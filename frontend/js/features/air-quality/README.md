# Slot: air-quality

**Kind:** base-layer · **Status:** ready

Shows particulate matter (PM2.5) on 2 Sep 2026. Small dots are senseBox:bike readings averaged
into 50 m grid cells; the larger circles with a white ring are the stationary senseBox:home sensors
(daily average). It is a base layer, so it replaces the heat map when chosen in the switcher.
Clicking a dot or circle opens PM2.5, PM10 and the number of readings in the info panel. The colour
bands (≤ 5, ≤ 15, > 15 µg/m³ PM2.5) follow the WHO guideline values for the annual (5) and daily
(15) mean.

On that day the air was clean: almost every cell is below 5 µg/m³, the highest cell average is
about 12 µg/m³ and the Innenstadt sensor averaged 5.4 µg/m³.

## Data

Prepared offline by `backend/scripts/air-quality/prepare_air_quality.py` from two dated snapshots
of the ATRAI API, copied from `vibin-branch` (`data/processed/`, explained in its `DATASETS.md`):

- `backend/data/air-quality/osem_bike_data_heilbronn_2026-09-02.csv`: collection `osem_bike_data`,
  tag `heilbronn`, 13,275 rows from six bikes; 6,175 have PM2.5 and PM10.
- `backend/data/weather-stations/osem_home_data_heilbronn_2026-09-02.csv`: collection
  `osem_home_data_heilbronn`; four of its five stations measure PM (THW Heilbronn does not). Two of
  them are outside Heilbronn (HCG Beilstein, Wolf-von-Gemmingen-Schule), so they are off the
  default map view.

Output: `frontend/data/air-quality/pm.json` (about 30 KB) with `cells`
(`[latitude, longitude, pm2_5, pm10, count]`) and `stations`
(`{ name, coordinates, pm2_5, pm10, count }`).

Rows along a ride are not independent samples of every place, and the bikes rode at different
times of the day; see `DATASETS.md` before comparing places.

## Regenerate the data

```sh
python3 backend/scripts/air-quality/prepare_air_quality.py
```

Standard library only. For another day, export a new snapshot with the notebooks on `vibin-branch`
and change the file names at the top of the script.

## To do

- Add the senseBox:bike PM danger zones
  (`https://api.atrai.bike/collections/danger_zones_PM_heilbronn/items?f=json&limit=0`).
- More days than 2 Sep 2026.
