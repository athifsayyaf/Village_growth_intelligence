# Methodology Note

## Objective

The goal is to identify Indian villages with the strongest recent economic-growth signals using reproducible, public geospatial data. The current ranked output is stored at `data/processed/top_100_villages_Kritter.csv`.

This is a proxy-based analysis. It does not claim to directly measure income or GDP at village level. The current exported CSV ranks villages by night-time light growth. The included Earth Engine workflow also adds Dynamic World built-area growth for a stronger combined version.

## Input Boundary Data

Village polygons were assembled from downloaded state/UT village boundary shapefiles and merged into one India-wide shapefile. The merged boundary asset was uploaded to Google Earth Engine as:

`projects/villagepro/assets/all_india_village_boundaries_gee_upload`

The local merge output used for the upload was prepared under:

`Manual/Full_India/all_india_village_boundaries_gee_upload.zip`

Some state shapefiles were unreadable or missing during the merge. This limitation is documented in the local `merge_report.txt` created during boundary preparation.

## Satellite Data Sources

1. VIIRS monthly night-time lights
   - GEE collection: `NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG`
   - Band used: `avg_rad`
   - Purpose: proxy for electrification, commercial intensity, settlement activity, and evening economic activity.

2. Dynamic World built-area probability
   - GEE collection: `GOOGLE/DYNAMICWORLD/V1`
   - Band used: `built`
   - Purpose: proxy for built-up expansion and settlement/construction growth.

## Workflow

1. Load the uploaded village polygon asset in Google Earth Engine.
2. Build annual mean VIIRS night-light composites for 2021 and 2025.
3. Build annual mean Dynamic World built-area probability composites for 2021 and 2025.
4. Compute absolute and percentage night-light growth.
5. Compute absolute and percentage built-area growth.
6. Aggregate all raster signals to village polygons using zonal mean statistics.
7. Remove records with missing baseline night-light values or zero baseline night-light values.
8. Calculate a composite growth score when Dynamic World fields are included.
9. Sort villages by the selected growth metric and export the ranked results.

## Growth Score

The recommended combined scoring formula in the Earth Engine script is:

`growth_score = 0.70 * night_light_percent_growth + 0.30 * built_area_percent_growth`

Night lights receive a higher weight because they more directly capture economic activity intensity. Dynamic World built-area growth is used as a supporting signal, because construction and settlement expansion strengthen the interpretation that night-light growth is structural rather than temporary.

The provided CSV file contains the VIIRS night-light ranking fields available in the local export. If the final review requires the combined Dynamic World score in the CSV, rerun `gee/village_growth_feature_extraction.js` and replace `data/processed/top_100_villages_Kritter.csv` with the new export.

## Reproducibility

The Earth Engine script used for feature extraction and ranking is:

`gee/village_growth_feature_extraction.js`

To reproduce the output:

1. Upload the merged village shapefile to Google Earth Engine.
2. Update the asset ID in `gee/village_growth_feature_extraction.js` if needed.
3. Run the script in the Earth Engine Code Editor.
4. Start the CSV export task for `top_100_villages_growth_score_2021_2025`.
5. Clean the exported CSV with `src/clean_gee_top100_export.py` if the geometry export creates extra columns.
6. Place the cleaned CSV under `data/processed/`.

## Output Dataset

The submitted output file is:

`data/processed/top_100_villages_Kritter.csv`

It contains village identifiers and names, district/state attributes, night-light statistics, growth metrics, and geometry exported from Earth Engine.

## Limitations

- Night-time lights are a proxy and may be affected by temporary events, sensor noise, local lighting policy, or infrastructure unrelated to broad welfare.
- Dynamic World built-area probability can confuse some bare or impervious surfaces with built-up areas.
- The merged village boundary layer excludes or partially excludes states where source shapefiles were missing or corrupted.
- The ranking is strongest as a screening tool. A final investment or policy conclusion should be validated with ground data such as roads, employment, firm registrations, household surveys, or administrative economic records.
