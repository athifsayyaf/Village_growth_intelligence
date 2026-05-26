# Methodology

![Workflow](figures/workflow.png)

## What I Did

1. Downloaded state-wise village shapefiles from Survey of India/source village boundary files.
2. Merged the state shapefiles into one India village boundary shapefile.
3. Uploaded the combined village boundary shapefile to Google Earth Engine.
4. Used VIIRS night-time lights to calculate village-level light growth from 2021 to 2025.
5. Added Dynamic World built-area change as an extra growth signal in the GEE workflow.
6. Used zonal statistics to calculate mean values for each village polygon.
7. Ranked villages by growth signal and exported the final CSV.

## Files

- GEE code: `gee/village_growth_feature_extraction.js`
- Final CSV: `data/processed/top_100_villages_Kritter.csv`
- CSV cleaner: `src/clean_gee_top100_export.py`
- Workflow figure: `docs/figures/workflow.png`

## Data Sources

- Survey of India/state-wise village boundary shapefiles
- VIIRS monthly night-time lights: `NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG`
- Dynamic World built-area probability: `GOOGLE/DYNAMICWORLD/V1`

## Output

The final output is a ranked CSV of the top villages:

`data/processed/top_100_villages_Kritter.csv`

The file includes village name, district, state, night-light values, night-light growth, and rank.

## Note

Some source shapefiles were missing or damaged during merging, so the final boundary layer depends on the readable village shapefiles available at processing time.
