# Village Economic Growth Intelligence

This repository contains a reproducible workflow for identifying villages in India that show strong economic-growth signals over the most recent five-year satellite window used in the analysis.

The implementation is intentionally transparent: it converts village-level indicators into growth signals and exports the ranked villages plus simple visual outputs.

## What is included

- `gee/village_growth_feature_extraction.js` - Google Earth Engine script for VIIRS night-light growth and Dynamic World built-area growth.

- `src/pipeline.py` - extraction, cleaning, feature engineering, scoring, and export pipeline.
- `src/clean_gee_top100_export.py` - cleanup helper for Google Earth Engine CSV exports.
- `data/raw/sample_village_growth.csv` - small sample input so the pipeline runs immediately.
- `data/processed/top_100_villages_Kritter.csv` - submitted ranked output cleaned from the Google Earth Engine export.
- `data/processed/top_100_villages.csv` - duplicate convenience copy of the submitted ranked output.
- `outputs/figures/` - generated charts and map HTML.
- `docs/methodology.md` - step-by-step assignment structure and scoring logic.
- `docs/slides_outline.md` - 5-7 slide presentation structure.

## Quick start

```bash
pip install -r requirements.txt
python src/pipeline.py --input data/raw/sample_village_growth.csv --output data/processed/top_100_villages.csv
```

The sample file is synthetic and exists only to prove the Python pipeline. The submitted result was produced in Google Earth Engine from the uploaded village polygon asset, cleaned with `src/clean_gee_top100_export.py`, and copied into `data/processed/top_100_villages_Kritter.csv`.

## Recommended public data sources

1. VIIRS monthly night-time lights composites from NASA/NOAA via Google Earth Engine: proxy for electrification, activity, and commercial intensity.
2. Census 2011 village directory or LGD village master data: village identifiers, district/state mapping, rural population baseline.
3. Google Dynamic World land-cover probabilities: built-area change signal.
4. OpenStreetMap/Geofabrik roads and POIs: optional future road connectivity and amenity validation.
5. PMGSY or government infrastructure datasets: optional future rural road validation.

## Core scoring definition

Economic growth is defined as multi-year improvement in visible economic activity and settlement expansion. The Earth Engine workflow supports a combined score that blends:

- night-light percent growth, 2021-2025: 70%
- Dynamic World built-area percent growth, 2021-2025: 30%

The weights are easy to change in `gee/village_growth_feature_extraction.js`. The current provided CSV contains the VIIRS night-light ranking fields exported from Earth Engine.

## Final submission checklist

- Verify `data/processed/top_100_villages_Kritter.csv`.
- Review `gee/village_growth_feature_extraction.js` and `docs/methodology.md`.
- If a combined Dynamic World score is required in the final CSV, rerun the GEE script and replace the processed CSV with the new export.
- Fill the presentation using `docs/slides_outline.md`.
- Cite VIIRS, Dynamic World, and the source village boundary shapefiles in the final write-up.


## Google Earth Engine extraction

Open `gee/village_growth_feature_extraction.js` in the Earth Engine Code Editor, confirm the village asset path, run the export task, and save the exported CSV under `data/processed/`.

Dataset references:

- VIIRS monthly night lights: https://developers.google.com/earth-engine/datasets/catalog/NOAA_VIIRS_DNB_MONTHLY_V1_VCMSLCFG
- Dynamic World V1: https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_DYNAMICWORLD_V1
