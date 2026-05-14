from __future__ import annotations

import argparse
from pathlib import Path
from typing import Iterable

import folium
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

WEIGHTS = {
    "ntl_growth_score": 0.40,
    "builtup_growth_score": 0.25,
    "road_growth_score": 0.15,
    "ntl_per_capita_growth_score": 0.10,
    "poi_growth_score": 0.10,
}

REQUIRED_COLUMNS = [
    "village_id",
    "village_name",
    "state",
    "district",
    "latitude",
    "longitude",
    "population_base",
    "population_latest",
    "ntl_base",
    "ntl_latest",
    "builtup_base",
    "builtup_latest",
    "road_km_base",
    "road_km_latest",
    "poi_count_base",
    "poi_count_latest",
]


def safe_growth(latest: pd.Series, base: pd.Series) -> pd.Series:
    """Return percent growth while avoiding division by zero explosions."""
    base = pd.to_numeric(base, errors="coerce")
    latest = pd.to_numeric(latest, errors="coerce")
    denominator = base.replace(0, np.nan)
    growth = (latest - base) / denominator
    return growth.replace([np.inf, -np.inf], np.nan).fillna(0.0)


def percentile_score(series: pd.Series) -> pd.Series:
    """Convert any numeric growth signal into a 0-100 percentile score."""
    numeric = pd.to_numeric(series, errors="coerce")
    numeric = numeric.fillna(numeric.median())
    return numeric.rank(pct=True, method="average") * 100


def validate_columns(df: pd.DataFrame, required: Iterable[str]) -> None:
    missing = [column for column in required if column not in df.columns]
    if missing:
        raise ValueError(f"Input dataset is missing required columns: {missing}")


def clean_input(df: pd.DataFrame) -> pd.DataFrame:
    validate_columns(df, REQUIRED_COLUMNS)
    cleaned = df.copy()

    text_columns = ["village_id", "village_name", "state", "district"]
    for column in text_columns:
        cleaned[column] = cleaned[column].astype(str).str.strip()

    numeric_columns = [column for column in REQUIRED_COLUMNS if column not in text_columns]
    for column in numeric_columns:
        cleaned[column] = pd.to_numeric(cleaned[column], errors="coerce")

    cleaned = cleaned.dropna(subset=["village_id", "village_name", "latitude", "longitude"])
    cleaned = cleaned.drop_duplicates(subset=["village_id"], keep="first")
    return cleaned


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    features = df.copy()
    features["ntl_growth_pct"] = safe_growth(features["ntl_latest"], features["ntl_base"])
    features["builtup_growth_pct"] = safe_growth(features["builtup_latest"], features["builtup_base"])
    features["road_growth_pct"] = safe_growth(features["road_km_latest"], features["road_km_base"])
    features["poi_growth_pct"] = safe_growth(features["poi_count_latest"], features["poi_count_base"])

    ntl_per_capita_base = features["ntl_base"] / features["population_base"].replace(0, np.nan)
    ntl_per_capita_latest = features["ntl_latest"] / features["population_latest"].replace(0, np.nan)
    features["ntl_per_capita_growth_pct"] = safe_growth(ntl_per_capita_latest, ntl_per_capita_base)
    return features


def score_villages(df: pd.DataFrame) -> pd.DataFrame:
    scored = df.copy()
    growth_to_score = {
        "ntl_growth_pct": "ntl_growth_score",
        "builtup_growth_pct": "builtup_growth_score",
        "road_growth_pct": "road_growth_score",
        "ntl_per_capita_growth_pct": "ntl_per_capita_growth_score",
        "poi_growth_pct": "poi_growth_score",
    }

    for growth_column, score_column in growth_to_score.items():
        scored[score_column] = percentile_score(scored[growth_column])

    scored["economic_growth_score"] = sum(
        scored[column] * weight for column, weight in WEIGHTS.items()
    ).round(2)

    scored = scored.sort_values(
        ["economic_growth_score", "ntl_growth_pct", "builtup_growth_pct"],
        ascending=[False, False, False],
    )
    scored.insert(0, "rank", range(1, len(scored) + 1))
    return scored


def export_charts(scored: pd.DataFrame, figures_dir: Path) -> None:
    figures_dir.mkdir(parents=True, exist_ok=True)

    plt.figure(figsize=(9, 5))
    scored["economic_growth_score"].plot(kind="hist", bins=10, color="#2a9d8f", edgecolor="white")
    plt.title("Distribution of Village Economic Growth Scores")
    plt.xlabel("Economic growth score")
    plt.ylabel("Village count")
    plt.tight_layout()
    plt.savefig(figures_dir / "score_distribution.png", dpi=160)
    plt.close()

    top_states = scored.head(100).groupby("state").size().sort_values(ascending=True)
    plt.figure(figsize=(9, 5))
    top_states.plot(kind="barh", color="#264653")
    plt.title("Top Villages by State")
    plt.xlabel("Villages in top 100")
    plt.ylabel("")
    plt.tight_layout()
    plt.savefig(figures_dir / "top_states.png", dpi=160)
    plt.close()


def export_map(scored: pd.DataFrame, figures_dir: Path) -> None:
    figures_dir.mkdir(parents=True, exist_ok=True)
    top = scored.head(100)
    center = [top["latitude"].mean(), top["longitude"].mean()]
    fmap = folium.Map(location=center, zoom_start=5, tiles="CartoDB positron")

    for _, row in top.iterrows():
        popup = (
            f"<b>#{int(row['rank'])} {row['village_name']}</b><br>"
            f"{row['district']}, {row['state']}<br>"
            f"Score: {row['economic_growth_score']}<br>"
            f"NTL growth: {row['ntl_growth_pct']:.1%}<br>"
            f"Built-up growth: {row['builtup_growth_pct']:.1%}"
        )
        folium.CircleMarker(
            location=[row["latitude"], row["longitude"]],
            radius=4 + (row["economic_growth_score"] / 25),
            color="#e76f51",
            fill=True,
            fill_opacity=0.75,
            popup=popup,
        ).add_to(fmap)

    fmap.save(figures_dir / "top_100_map.html")


def run_pipeline(input_path: Path, output_path: Path, figures_dir: Path) -> pd.DataFrame:
    raw = pd.read_csv(input_path)
    cleaned = clean_input(raw)
    features = engineer_features(cleaned)
    scored = score_villages(features)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    scored.head(100).to_csv(output_path, index=False)
    export_charts(scored, figures_dir)
    export_map(scored, figures_dir)
    return scored


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Rank villages by economic growth signals.")
    parser.add_argument("--input", type=Path, default=Path("data/raw/sample_village_growth.csv"))
    parser.add_argument("--output", type=Path, default=Path("data/processed/top_100_villages.csv"))
    parser.add_argument("--figures", type=Path, default=Path("outputs/figures"))
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    scored = run_pipeline(args.input, args.output, args.figures)
    print(f"Processed {len(scored)} villages")
    print(f"Wrote ranked output to {args.output}")
    print(f"Top village: {scored.iloc[0]['village_name']} ({scored.iloc[0]['economic_growth_score']})")


if __name__ == "__main__":
    main()
