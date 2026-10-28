# Temperature heat map

The sidebar keeps a single **Urban temperature** base layer. Its map control lets residents select
any combination of these five independently rendered sources:

- **Reedu** group: senseBox:bike, Mobile Datalogger and senseBox:home. Each dataset contains
  2 September 2026 temperature averages in approximately 25 m cells.
- **DWD**: hourly observation from station 03734, Obersulm-Willsbach. The CSV is fetched from the
  Bright Sky API, but the interface identifies the provider as DWD. The station is about 10 km east
  of Heilbronn; activating it frames the city and the true station location together.
- **Open-Meteo**: hourly ERA5-Land reanalysis at the grid cell returned for Heilbronn. It is a model
  estimate, not a local station observation.

<<<<<<< Updated upstream
The colours are relative: blue is the coolest and red the hottest average in this data set, not
fixed temperature thresholds. Temperatures exist only along the routes that were ridden; the heat
layer blurs between them, so it is not citywide coverage.
=======
The hour slider filters DWD and Open-Meteo only; Reedu data remain daily cell averages. The map shows
an independent heat layer and a separate legend scale for every selected source. Hourly sources also
show a labelled point marker at the actual station/grid coordinate, with the selected hour's value,
so a single reading is easy to locate and is not mistaken for city-wide coverage. Each source uses a
distinct blue-to-red colour ramp, normalized to that source's own temperature range. Heat blur is a
visual aid, not evidence that the city between measurements has the same temperature.
>>>>>>> Stashed changes

The `alles.csv` export is treated as Mobile Datalogger because that is how the GreenCity resources
page identifies it, although its `recording` values contain `senseBox_bike` filenames. This
discrepancy is disclosed rather than used to relabel the dataset.

<<<<<<< Updated upstream
- **Source:** mobile temperature loggers (senseBox:bike), recorded by the team on 1–3 September 2026
  (61,546 readings). Raw file: `backend/data/heatmap/alles.csv` (columns `timestamp, latitude,
  longitude, temperature, humidity, gps_speed, recording`).
- **Website file:** `frontend/data/heatmap/temperature-cells.json` (about 20 KB):
  `minTemperature`, `maxTemperature`, `cellSizeMeters` and `cells`, a list of
  `[latitude, longitude, average temperature, number of readings]`.
=======
## Input and output files
>>>>>>> Stashed changes

| Source | Backend input | Prepared frontend CSV |
|---|---|---|
| Mobile Datalogger | `backend/data/heatmap/alles.csv` | `frontend/data/heatmap/reedu/mobile-datalogger-cells.csv` |
| senseBox:bike | `backend/data/air-quality/osem_bike_data_heilbronn_2026-09-02.csv` | `frontend/data/heatmap/reedu/sensebox-bike-cells.csv` |
| senseBox:home | `backend/data/weather-stations/osem_home_data_heilbronn_2026-09-02.csv` | `frontend/data/heatmap/reedu/sensebox-home-cells.csv` |
| DWD station 03734 | Bright Sky weather API, source 304167 | `frontend/data/heatmap/dwd/temperature.csv` |
| Open-Meteo | ERA5-Land archive API, Heilbronn coordinate | `frontend/data/heatmap/open-meteo/temperature.csv` |

Reedu CSVs contain `latitude,longitude,temperature,count`. The API preparation scripts keep valid
readings from the target date inside the same approximate Heilbronn bounding box; bike records must
also carry the `heilbronn` group tag. Repeated ATRAI rows with the same `index` are ignored when
their content matches, and conflicting duplicate IDs fail loudly. ATRAI `createdAt` values do not
declare a timezone and are not converted.

DWD and Open-Meteo use
`timestamp,latitude,longitude,temperature_c,relative_humidity_pct,measurement_type,source_id`.
Timestamps are ISO 8601 with the `+02:00` local-time offset for **Europe/Berlin**. DWD rows are
station observations, and Open-Meteo rows are gridded reanalysis. The direct DWD Open Data CSV was
removed because it duplicated the same station observations; Bright Sky remains the DWD access path.

## Regenerate

Run from the repository root:

```powershell
python backend/scripts/heatmap/prepare_heatmap.py
python backend/scripts/heatmap/prepare_sensebox_bike_heatmap.py
python backend/scripts/heatmap/prepare_sensebox_home_heatmap.py
python backend/scripts/heatmap/prepare_dwd_heatmap.py
python backend/scripts/heatmap/prepare_open_meteo_heatmap.py
```

The scripts use only Python's standard library. The DWD and Open-Meteo scripts need internet access.
The browser loads prepared CSVs, not raw sensor exports. Keep generated frontend files small and do
not commit raw or unrelated API cache data.

## Depends on

<<<<<<< Updated upstream
- [Leaflet.heat 0.2.0](https://github.com/Leaflet/Leaflet.heat), loaded from unpkg in `init()`.

## Ideas / open

- Use fixed temperature bands (e.g. °C steps) instead of a relative scale.
- Add the Heat-Island Summer School heat-walk loggers.
- Show the humidity column as well.
=======
- [Leaflet.heat 0.2.0](https://github.com/Leaflet/Leaflet.heat), loaded on demand from unpkg.
- [Bright Sky weather API](https://brightsky.dev/) for DWD station observations.
- [Open-Meteo Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api) for
  ERA5-Land reanalysis.
>>>>>>> Stashed changes
