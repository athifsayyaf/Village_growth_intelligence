# Methodology and Work Plan

## 1. Frame the problem

Goal: rank the top 100 Indian villages showing the strongest economic growth signals over the most recent five-year period available.

Working definition: a village is considered economically growing when satellite-observable activity and supporting infrastructure increase together. A single signal, such as night lights alone, can be noisy, so the score combines multiple signals.

## 2. Data source plan

Use the following sources and document the download date, URL, coverage, and limitations:

| Source | Use | Why it matters |
| --- | --- | --- |
| VIIRS annual night-time lights | Light intensity in base and latest year | Captures electrification, commercial activity, and settlement intensity |
| Census 2011 / LGD village master | Village names, IDs, state, district | Provides stable village reference frame |
| Built-up / land-cover change | Built-up area in base and latest year | Captures construction and expansion |
| Roads / PMGSY / OSM | Road length or connectivity | Growth is more credible when access improves |
| OSM POIs or business amenities | Shops, schools, health, markets | Adds an economic services signal |

## 3. Pipeline steps

1. Extract raw source files into `data/raw/`.
2. Standardize village identifiers, names, state, district, latitude, and longitude.
3. Aggregate satellite and infrastructure signals to village boundaries or village centroids.
4. Create base-year and latest-year features for each signal.
5. Clean missing and invalid values.
6. Compute five-year growth rates.
7. Normalize each growth signal using percentile ranks.
8. Compute a weighted composite score.
9. Rank villages and export top 100.
10. Produce charts/maps for presentation.

## 4. Feature engineering

For each village:

- `ntl_growth_pct = (ntl_latest - ntl_base) / ntl_base`
- `builtup_growth_pct = (builtup_latest - builtup_base) / builtup_base`
- `road_growth_pct = (road_latest - road_base) / road_base`
- `poi_growth_pct = (poi_latest - poi_base) / poi_base`
- `ntl_per_capita_growth_pct = (ntl_latest / population_latest) - (ntl_base / population_base)` as percent growth

Small denominators are handled safely to avoid unstable division.

## 5. Scoring

Each growth feature is converted to a 0-100 percentile rank across all candidate villages. The final score is:

`score = 0.40*ntl + 0.25*builtup + 0.15*road + 0.10*ntl_per_capita + 0.10*poi`

This makes the ranking explainable: a high-ranking village must show broad improvement, not just one extreme metric.

## 6. Outputs

- `data/processed/top_100_villages.csv`: final ranked dataset.
- `outputs/figures/top_states.png`: top-village distribution by state.
- `outputs/figures/score_distribution.png`: spread of economic growth scores.
- `outputs/figures/top_100_map.html`: interactive map of ranked villages.

## 7. Limitations

- Satellite lights can saturate or be affected by temporary events.
- Village boundary matching can introduce spatial error.
- OSM data coverage is uneven across states.
- Economic growth is broader than visible infrastructure and lighting.
- Census population baselines may be outdated.

## 8. Next steps with more time

- Use official village boundaries instead of centroid buffers.
- Validate against district GDP, credit, GST, PMGSY, or employment datasets.
- Add uncertainty bands for each rank.
- Compare results across multiple weighting scenarios.
