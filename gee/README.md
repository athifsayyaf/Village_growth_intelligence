# Google Earth Engine Extraction

Use `village_growth_feature_extraction.js` in the Google Earth Engine Code Editor.

## Steps

1. Upload an India village boundary or centroid file as an Earth Engine asset.
2. Make sure the asset has these properties: `village_id`, `village_name`, `state`, `district`.
3. Replace `users/YOUR_USERNAME/india_villages` in the script with your asset path.
4. Run the script and start the `Export.table.toDrive` task.
5. Download the CSV and place it in `data/raw/`.
6. Run the Python ranking pipeline:

```bash
python src/pipeline.py --input data/raw/real_village_growth_features.csv --output data/processed/top_100_villages.csv
```

## Dataset citations

- VIIRS annual night lights V2.2: `NOAA/VIIRS/DNB/ANNUAL_V22`, annual global VIIRS nighttime lights from 2012 to 2024.
- GHSL built-up surface P2023A: `JRC/GHSL/P2023A/GHS_BUILT_S`, built-up surface in square meters per 100 m grid cell.
