# Google Earth Engine Code

This folder stores the Google Earth Engine workflow used for the satellite analysis.

Main script:

`village_growth_feature_extraction.js`

It uses:

- Village boundary asset uploaded to GEE
- VIIRS night-time lights, 2021-2025
- Dynamic World built-area change, 2021-2025
- Zonal statistics by village
- Export to CSV

Run the script in the Earth Engine Code Editor, then download the exported CSV and place it in `data/processed/`.
