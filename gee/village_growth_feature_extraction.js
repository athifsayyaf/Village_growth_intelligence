/****
Village Growth Intelligence - Google Earth Engine extraction script

Workflow:
  Village polygons
      -> VIIRS night-light growth, 2021-2025
      -> Dynamic World built-area growth, 2021-2025
      -> zonal statistics
      -> weighted growth score
      -> ranked top villages

Input asset used for the submitted run:
  projects/villagepro/assets/all_india_village_boundaries_gee_upload

Official GEE datasets used:
  - VIIRS monthly night lights: NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG
  - Dynamic World land cover probabilities: GOOGLE/DYNAMICWORLD/V1

Output:
  Exported CSV copied into data/processed/top_100_villages_Kritter.csv
****/

var villages = ee.FeatureCollection(
  'projects/villagepro/assets/all_india_village_boundaries_gee_upload'
);

// -----------------------------------------------------------------------------
// 1. Night lights growth from VIIRS monthly composites
// -----------------------------------------------------------------------------

var viirs = ee.ImageCollection('NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG')
  .select('avg_rad');

var ntl2021 = viirs
  .filterDate('2021-01-01', '2022-01-01')
  .mean()
  .rename('ntl_2021');

var ntl2025 = viirs
  .filterDate('2025-01-01', '2026-01-01')
  .mean()
  .rename('ntl_latest');

ntl2021 = ntl2021.updateMask(ntl2021.gte(0));
ntl2025 = ntl2025.updateMask(ntl2025.gte(0));

var ntlAbsGrowth = ntl2025
  .subtract(ntl2021)
  .rename('ntl_abs_growth');

// -----------------------------------------------------------------------------
// 2. Built-area growth from Dynamic World
// -----------------------------------------------------------------------------

var dynamicWorld = ee.ImageCollection('GOOGLE/DYNAMICWORLD/V1')
  .select('built');

var built2021 = dynamicWorld
  .filterDate('2021-01-01', '2022-01-01')
  .mean()
  .rename('built_2021');

var built2025 = dynamicWorld
  .filterDate('2025-01-01', '2026-01-01')
  .mean()
  .rename('built_2025');

var builtAbsGrowth = built2025
  .subtract(built2021)
  .rename('built_abs_growth');

// -----------------------------------------------------------------------------
// 3. Zonal statistics
// -----------------------------------------------------------------------------

var growthImage = ntl2021
  .addBands(ntl2025)
  .addBands(ntlAbsGrowth)
  .addBands(built2021)
  .addBands(built2025)
  .addBands(builtAbsGrowth);

var villageStatsRaw = growthImage.reduceRegions({
  collection: villages,
  reducer: ee.Reducer.mean(),
  scale: 100,
  tileScale: 16
});

// -----------------------------------------------------------------------------
// 4. Growth score
// -----------------------------------------------------------------------------

var villageStats = villageStatsRaw
  .filter(ee.Filter.notNull([
    'ntl_2021',
    'ntl_latest',
    'built_2021',
    'built_2025'
  ]))
  .filter(ee.Filter.gt('ntl_2021', 0))
  .map(function(feature) {
    var ntlBase = ee.Number(feature.get('ntl_2021'));
    var ntlLatest = ee.Number(feature.get('ntl_latest'));
    var builtBase = ee.Number(feature.get('built_2021'));
    var builtLatest = ee.Number(feature.get('built_2025'));

    var ntlAbs = ntlLatest.subtract(ntlBase);
    var ntlPct = ntlAbs.divide(ntlBase).multiply(100);

    var builtAbs = builtLatest.subtract(builtBase);
    var builtPct = ee.Algorithms.If(
      builtBase.gt(0),
      builtAbs.divide(builtBase).multiply(100),
      builtAbs.multiply(100)
    );

    var growthScore = ntlPct.multiply(0.70)
      .add(ee.Number(builtPct).multiply(0.30));

    return feature.set({
      ntl_abs_growth_clean: ntlAbs,
      ntl_pct_growth_clean: ntlPct,
      built_abs_growth_clean: builtAbs,
      built_pct_growth_clean: builtPct,
      growth_score: growthScore
    });
  })
  .filter(ee.Filter.notNull(['growth_score']));

var top100 = villageStats
  .sort('growth_score', false)
  .limit(100);

// Keep console prints small to avoid Earth Engine memory errors.
print('Village asset sample', villages.limit(3));
print('VIIRS 2021 image count', viirs.filterDate('2021-01-01', '2022-01-01').size());
print('VIIRS 2025 image count', viirs.filterDate('2025-01-01', '2026-01-01').size());
print('Dynamic World 2021 image count', dynamicWorld.filterDate('2021-01-01', '2022-01-01').size());
print('Dynamic World 2025 image count', dynamicWorld.filterDate('2025-01-01', '2026-01-01').size());

Map.setCenter(78.9629, 22.5937, 5);
Map.addLayer(ntlAbsGrowth, {
  min: -5,
  max: 10,
  palette: ['red', 'white', 'yellow']
}, 'Night-light absolute growth');
Map.addLayer(builtAbsGrowth, {
  min: -0.1,
  max: 0.3,
  palette: ['red', 'white', 'blue']
}, 'Dynamic World built growth');

Export.table.toDrive({
  collection: villageStats,
  description: 'all_villages_ntl_dynamicworld_growth_2021_2025',
  fileFormat: 'CSV'
});

Export.table.toDrive({
  collection: top100,
  description: 'top_100_villages_growth_score_2021_2025',
  fileFormat: 'CSV'
});
