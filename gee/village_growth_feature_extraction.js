/****
Village Economic Growth Intelligence - Google Earth Engine extraction script

Purpose:
  Build village-level satellite features for the Python ranking pipeline.

Inputs you must provide:
  1. Upload a village boundary or village centroid asset to Earth Engine.
  2. The asset should include at least:
       village_id, village_name, state, district
  3. Replace VILLAGE_ASSET below with your own asset path.

Official GEE datasets used:
  - VIIRS annual night lights V2.2: NOAA/VIIRS/DNB/ANNUAL_V22
  - GHSL built-up surface P2023A: JRC/GHSL/P2023A/GHS_BUILT_S

Output:
  A CSV in Google Drive with village_id/name/state/district and growth features.
  Download it and place it at data/raw/real_village_growth_features.csv, then run:
    python src/pipeline.py --input data/raw/real_village_growth_features.csv --output data/processed/top_100_villages.csv
****/

// -----------------------------------------------------------------------------
// 1. Configuration
// -----------------------------------------------------------------------------

var VILLAGE_ASSET = 'users/YOUR_USERNAME/india_villages';
var BASE_YEAR = 2019;
var LATEST_YEAR = 2024;
var EXPORT_FOLDER = 'Village_growth_intelligence';
var EXPORT_DESCRIPTION = 'village_growth_features_viirs_ghsl';

// If your input is village centroids rather than polygons, buffer each point.
// 1500 meters is a reasonable first-pass radius for village-level extraction.
var USE_POINT_BUFFER = false;
var POINT_BUFFER_METERS = 1500;

var villagesRaw = ee.FeatureCollection(VILLAGE_ASSET);

var villages = ee.FeatureCollection(
  ee.Algorithms.If(
    USE_POINT_BUFFER,
    villagesRaw.map(function(feature) {
      return feature.buffer(POINT_BUFFER_METERS).copyProperties(feature);
    }),
    villagesRaw
  )
);

// -----------------------------------------------------------------------------
// 2. Satellite source helpers
// -----------------------------------------------------------------------------

function getViirsAnnual(year) {
  return ee.ImageCollection('NOAA/VIIRS/DNB/ANNUAL_V22')
    .filter(ee.Filter.calendarRange(year, year, 'year'))
    .select('average')
    .first()
    .rename('ntl_' + year);
}

function getGhslBuiltSurface(year) {
  return ee.Image('JRC/GHSL/P2023A/GHS_BUILT_S/' + year)
    .select('built_surface')
    .rename('builtup_' + year);
}

var ntlBase = getViirsAnnual(BASE_YEAR);
var ntlLatest = getViirsAnnual(LATEST_YEAR);

// GHSL built-up is available in 5-year intervals. For a 5-year assignment window,
// 2020 and 2025 are practical choices. Change these if your analysis window differs.
var builtBaseYear = 2020;
var builtLatestYear = 2025;
var builtBase = getGhslBuiltSurface(builtBaseYear);
var builtLatest = getGhslBuiltSurface(builtLatestYear);

// -----------------------------------------------------------------------------
// 3. Village-level aggregation
// -----------------------------------------------------------------------------

var featureImage = ee.Image.cat([
  ntlBase,
  ntlLatest,
  builtBase,
  builtLatest
]);

var reduced = featureImage.reduceRegions({
  collection: villages,
  reducer: ee.Reducer.mean(),
  scale: 500,
  tileScale: 4
});

function addGrowthColumns(feature) {
  var ntlBaseValue = ee.Number(feature.get('ntl_' + BASE_YEAR));
  var ntlLatestValue = ee.Number(feature.get('ntl_' + LATEST_YEAR));
  var builtBaseValue = ee.Number(feature.get('builtup_' + builtBaseYear));
  var builtLatestValue = ee.Number(feature.get('builtup_' + builtLatestYear));

  var ntlGrowth = ntlLatestValue.subtract(ntlBaseValue)
    .divide(ntlBaseValue.max(0.001));
  var builtupGrowth = builtLatestValue.subtract(builtBaseValue)
    .divide(builtBaseValue.max(0.001));

  var centroid = feature.geometry().centroid(30);

  return feature.set({
    ntl_base: ntlBaseValue,
    ntl_latest: ntlLatestValue,
    builtup_base: builtBaseValue,
    builtup_latest: builtLatestValue,
    ntl_growth_pct: ntlGrowth,
    builtup_growth_pct: builtupGrowth,
    latitude: centroid.coordinates().get(1),
    longitude: centroid.coordinates().get(0),
    base_year: BASE_YEAR,
    latest_year: LATEST_YEAR,
    builtup_base_year: builtBaseYear,
    builtup_latest_year: builtLatestYear
  });
}

var output = reduced.map(addGrowthColumns);

// -----------------------------------------------------------------------------
// 4. Quick visual QA
// -----------------------------------------------------------------------------

Map.centerObject(villages.limit(1), 7);
Map.addLayer(ntlBase, {min: 0, max: 20, palette: ['000000', '1b4965', 'fca311', 'ffffff']}, 'VIIRS base');
Map.addLayer(ntlLatest, {min: 0, max: 20, palette: ['000000', '1b4965', 'fca311', 'ffffff']}, 'VIIRS latest');
Map.addLayer(builtLatest, {min: 0, max: 8000, palette: ['000000', 'ffffff']}, 'GHSL built-up latest');
Map.addLayer(villages.style({color: '00ffff', fillColor: '00000000', width: 1}), {}, 'Villages');

print('Village sample', output.limit(5));
print('Village count', output.size());

// -----------------------------------------------------------------------------
// 5. Export
// -----------------------------------------------------------------------------

Export.table.toDrive({
  collection: output,
  description: EXPORT_DESCRIPTION,
  folder: EXPORT_FOLDER,
  fileNamePrefix: EXPORT_DESCRIPTION,
  fileFormat: 'CSV',
  selectors: [
    'village_id',
    'village_name',
    'state',
    'district',
    'latitude',
    'longitude',
    'ntl_base',
    'ntl_latest',
    'builtup_base',
    'builtup_latest',
    'ntl_growth_pct',
    'builtup_growth_pct',
    'base_year',
    'latest_year',
    'builtup_base_year',
    'builtup_latest_year'
  ]
});
