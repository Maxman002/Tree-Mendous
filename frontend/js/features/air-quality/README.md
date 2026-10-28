# Slot: air-quality

**Kind:** base-layer · **Status:** placeholder

Shows particulate matter (PM2.5, PM10) as coloured circles, one per sensor. It is a base layer, so
it replaces the heat map when chosen in the switcher. Clicking a circle opens its values in the
info panel. The colour bands (≤ 5, ≤ 15, > 15 µg/m³ PM2.5) follow the WHO guideline values for
the annual (5) and daily (15) mean; adjust them if the team prefers other thresholds.

## Data

- **Now:** `frontend/data/air-quality/sample.geojson`, six made-up points with `name`, `pm2_5`
  and `pm10`. They are **not measurements**.
- **Planned source:** senseBox:home Heilbronn (temperature, humidity, PM1–PM10),
  `https://api.atrai.bike/collections/osem_home_data_heilbronn/items?f=json`
  (GeoJSON points, about 2 million rows; the time filters didn't work in a test on 2026-10-27).
- **Also available:** senseBox:bike particulate-matter danger zones,
  `https://api.atrai.bike/collections/danger_zones_PM_heilbronn/items?f=json&limit=0`
  (about 183,000 points with a risk index).

## To do for the real layer

1. Write `backend/scripts/air-quality/prepare_air_quality.py`: download the senseBox:home data
   once, average PM2.5/PM10 per sensor (or per grid cell), and write
   `frontend/data/air-quality/<name>.geojson` with the same properties as the sample. Keep it
   under 1 MB.
2. Point `loadData()` in `index.js` at the new file, set `status: "ready"`, and update this README.
