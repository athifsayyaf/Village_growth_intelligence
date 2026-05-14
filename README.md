# Village Economic Growth Intelligence

This repository is a reproducible assignment scaffold for identifying villages in India that show strong economic growth signals over the last five years.

The implementation is intentionally transparent: it converts village-level indicators into normalized growth signals, combines them into a weighted score, and exports the top 100 ranked villages plus simple visual outputs.

## What is included

- `gee/village_growth_feature_extraction.js` - Google Earth Engine script for VIIRS and GHSL feature extraction.

- `src/pipeline.py` - extraction, cleaning, feature engineering, scoring, and export pipeline.
- `data/raw/sample_village_growth.csv` - small sample input so the pipeline runs immediately.
- `data/processed/top_100_villages.csv` - generated ranked output after running the pipeline.
- `outputs/figures/` - generated charts and map HTML.
- `docs/methodology.md` - step-by-step assignment structure and scoring logic.
- `docs/slides_outline.md` - 5-7 slide presentation structure.

## Quick start

```bash
pip install -r requirements.txt
python src/pipeline.py --input data/raw/sample_village_growth.csv --output data/processed/top_100_villages.csv
```

The sample file is synthetic and exists only to prove the pipeline. For final submission, replace it with a real village-level feature table built from cited public sources.

## Recommended public data sources

1. VIIRS annual night-time lights composites from NASA/NOAA or Google Earth Engine: proxy for electrification, activity, and commercial intensity.
2. Census 2011 village directory or LGD village master data: village identifiers, district/state mapping, rural population baseline.
3. OpenStreetMap/Geofabrik roads and POIs: road connectivity and density of economic amenities.
4. PMGSY or government infrastructure datasets: rural road construction and connectivity improvements.
5. Optional: Bhuvan/ESA land cover or built-up area products: construction and land-use change.

## Core scoring definition

Economic growth is defined as multi-year improvement in visible economic activity and enabling infrastructure. The current score blends:

- night-light growth: 40%
- built-up area growth: 25%
- road/access growth: 15%
- population-adjusted activity growth: 10%
- POI/business amenity growth: 10%

The weights are easy to change in `src/pipeline.py`.

## Final submission checklist

- Replace sample data with real extracted features.
- Re-run the pipeline.
- Verify `data/processed/top_100_villages.csv` and `outputs/figures/top_states.png`.
- Fill the presentation using `docs/slides_outline.md`.
- Cite every external dataset in the final write-up.


## Google Earth Engine extraction

Open `gee/village_growth_feature_extraction.js` in the Earth Engine Code Editor, replace the village asset path, run the export task, and save the exported CSV under `data/raw/`. The Python pipeline can then rank the exported features.

Dataset references:

- VIIRS annual night lights V2.2: https://developers.google.com/earth-engine/datasets/catalog/NOAA_VIIRS_DNB_ANNUAL_V22
- GHSL built-up surface P2023A: https://developers.google.com/earth-engine/datasets/catalog/JRC_GHSL_P2023A_GHS_BUILT_S
