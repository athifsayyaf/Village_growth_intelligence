from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd


KEEP_COLUMNS = [
    "dist_lgd",
    "district",
    "state_lgd",
    "state_ut",
    "sub_dist",
    "subdis_lg",
    "subdis_ty",
    "vill_cat",
    "vill_lgd",
    "vill_name",
    "src_state",
    "src_file",
    "objectid",
    "ntl_2021",
    "ntl_latest",
    "ntl_abs_growth",
    "ntl_abs_growth_clean",
    "ntl_pct_growth_clean",
    "built_2021",
    "built_2025",
    "built_abs_growth_clean",
    "built_pct_growth_clean",
    "growth_score",
    "shp_area",
    "shp_leng",
]


def clean_export(input_path: Path, output_path: Path, limit: int) -> pd.DataFrame:
    """Clean a Google Earth Engine CSV export into a compact ranked table."""
    raw = pd.read_csv(input_path, low_memory=False)
    available_columns = [column for column in KEEP_COLUMNS if column in raw.columns]
    cleaned = raw[available_columns].copy()

    for column in cleaned.columns:
        if column not in {"district", "state_ut", "sub_dist", "subdis_ty", "vill_cat", "vill_name", "src_state", "src_file"}:
            converted = pd.to_numeric(cleaned[column], errors="coerce")
            if converted.notna().any():
                cleaned[column] = converted

    sort_column = "growth_score" if "growth_score" in cleaned.columns else "ntl_pct_growth_clean"
    if sort_column in cleaned.columns:
        cleaned = cleaned.sort_values(sort_column, ascending=False)

    cleaned = cleaned.head(limit).reset_index(drop=True)
    cleaned.insert(0, "rank", range(1, len(cleaned) + 1))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    cleaned.to_csv(output_path, index=False)
    return cleaned


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Clean GEE top-village CSV export.")
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--limit", type=int, default=100)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    cleaned = clean_export(args.input, args.output, args.limit)
    print(f"Wrote {len(cleaned)} cleaned records to {args.output}")


if __name__ == "__main__":
    main()
