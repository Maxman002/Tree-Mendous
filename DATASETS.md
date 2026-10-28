# Dataset and notebook guide

This note explains which environmental datasets and analysis artifacts are in this repository, what each is for, and what must not be inferred from them. Read this before combining measurements or changing the map's data source.

## At a glance

| Artifact | Source / identity | What one row represents | Intended use |
| --- | --- | --- | --- |
| `data/alles.csv` | Downloaded from the Mobile Datalogger link on the GreenCity resources page (Nextcloud folder `Heat-Island-Summerschool 2026`). Device provenance remains uncertain. | One mobile temperature/humidity/GPS/speed reading. | Current map heat layer and exploratory mobile-logger analysis. |
| `data/processed/osem_bike_data_heilbronn_2026-09-02.csv` | Snapshot from ATRAI API collection `osem_bike_data`, filtered for the `heilbronn` campaign tag and `createdAt` date 2026-09-02. | One raw bike sensor observation. | Explore mobile bike measurements, routes, sensor fields, and temperature by hour. |
| `data/processed/osem_home_data_heilbronn_2026-09-02.csv` | Snapshot from ATRAI API collection `osem_home_data_heilbronn`, filtered to `createdAt` date 2026-09-02. | One observation from a stationary sensor. | Explore separate station time series and temperature by station/hour. |
| `weather_data/klimadaten_*.csv` | Regional climate tables supplied with the climate profiles; the files identify an area, year, and season. | One annual or seasonal climate indicator record for an area. | Historical regional context in the climate explorer. These tables are separate from the 2026 bike-sensor measurements. |
| `weather_data/klimaprofil_*.pdf` and `weather_data/landesweite_klimaanalyse_endbericht.pdf` | Regional profile PDFs and statewide climate-analysis report supplied alongside the climate tables. | A regional climate profile or analysis report. | Background reading; the Erlenbach profile currently has no matching climate-data CSV in this folder and is not linked in the explorer. |

The two `data/processed` CSVs are intentional, dated snapshots and are staged for the next commit. The directory is otherwise ignored so that future generated API caches are not added accidentally. Do not treat other files created there as repository datasets without explicitly deciding to version them.

## The three sources are not interchangeable

### Mobile Datalogger: `data/alles.csv`

- The resources page calls this a mobile temperature/humidity logger and links its data card to the `Heat-Island-Summerschool 2026` Nextcloud folder.
- The local CSV has 61,546 rows from 1–3 September 2026, with columns `timestamp`, `latitude`, `longitude`, `temperature`, `humidity`, `gps_speed`, and `recording`.
- `timestamp` values end in `Z` and are UTC; the notebook converts them to `Europe/Berlin`.
- The `recording` strings say `senseBox_bike`, and the data includes GPS and speed. This conflicts with the resource page's description of a logger carried while walking. A filename is not enough to prove the data is the ATRAI bike collection. Keep this provenance unresolved until the dataset provider confirms the device/export.
- Analysis: [Mobile Datalogger notebook](notebooks/mobile_datalogger_temperature.ipynb).

### senseBox:bike: `osem_bike_data`

- The GreenCity [bike-data guide](https://hackathon.greencity.hn/resources/bike-data) identifies `osem_bike_data` as raw bike sensor data across campaigns/cities.
- The notebook selects the exact `heilbronn` tag from `groupTags`, then selects the requested `createdAt` date. The campaign query parameter documented by the guide currently has no effect, so tag filtering must be done on returned data.
- The committed 2026-09-02 snapshot has 13,275 rows from six `boxName` values. It includes `Temperature`, `Rel. Humidity`, PM fields, `Speed`, road-surface probabilities, overtaking measurements, coordinates, and timestamps. Many fields are legitimately null; temperature is present on only 6,169 rows.
- Rows are mobile points along rides, not independent samples of every city location.
- Analysis: [senseBox:bike notebook](notebooks/sensebox_bike_temperature.ipynb).

### senseBox:home: `osem_home_data_heilbronn`

- The GreenCity resources page links this collection from its **senseBox:home** card and describes home sensors as stationary weather stations.
- The committed 2026-09-02 snapshot has 8,781 rows and five `boxName` values. It contains fixed coordinates and temperature, humidity, pressure, light, particulate matter, and other optional weather fields.
- The collection name does not guarantee all stations are within central Heilbronn: names include `HCG Beilstein` and `SenseBox Wolf-von-Gemmingen-Schule`. Inspect each station's coordinates before applying a city-boundary filter or describing it as a central-city observation.
- Analyze by `boxName`; do not combine stations without deciding that a regional summary is appropriate.
- Analysis: [senseBox:home notebook](notebooks/sensebox_home_temperature.ipynb).

## Time-window comparisons

All three notebooks default to 2 September 2026, 10:00–14:00, with the end of the interval excluded. This shared window is a convenient starting point, not proof the sensors sampled the same place or time:

- The mobile CSV timestamps explicitly use UTC and are converted to Heilbronn local time.
- ATRAI `createdAt` examples do not include a timezone suffix. The API notebooks preserve the recorded clock time and do not assume UTC or local time.
- `created_at` in the API CSVs is ingestion time, not the measurement time. Use `createdAt` for measurement-time analysis.
- Before comparing temperature values, confirm the API timestamp timezone, sensor location/placement, calibration, and exposure to sun/shade. Bike readings along a route and fixed home-station readings measure different sampling situations.

The bike snapshot's `createdAt` values span 10:24–19:38 as recorded; the home snapshot covers 00:00–23:59. The local CSV has a different timestamp convention and should be aligned only after converting it to the API's confirmed time basis.

## Regional climate tables and profiles

The `weather_data` folder contains semicolon-delimited regional climate tables for Heilbronn municipality, Heilbronn city district, Heilbronn county, and Baden-Württemberg. Each table contains 65 annual records (1961–2025) as well as seasonal and monthly records. Numeric decimal values use a comma. The visualizer's climate explorer reads the annual records for all four areas; it offers annual temperature, heat-day, precipitation, and dry-period indicators. It does not interpolate these regional summaries onto the street map or combine them with mobile measurements.

The folder also includes climate profile PDFs for Erlenbach, Heilbronn county, Heilbronn city district, and Baden-Württemberg, plus a statewide climate-analysis report. The Erlenbach PDF remains in the repository but is not linked in the explorer. The supplied profile is branded by LUBW's Kompetenzzentrum Klimawandel and reports a 10.9 °C mean for 1996–2025, 1.5 °C above its 1961–1990 reference mean of 9.4 °C; its reported 2025 mean is 11.2 °C. The profiles also include modeled RCP 4.5 and RCP 8.5 projections to 2100; these scenarios are not plotted with the historical series. Erlenbach has no corresponding `klimadaten` CSV here, so it is not plotted as a time series. The explorer displays the CSV series' first-to-last available annual difference as context only; it is not a trend estimate or forecast. Confirm the publisher, methodology, license, and indicator definitions from the original source before presenting the data as official or authoritative.

## Re-running the notebooks and API caches

Use the existing project `.venv` kernel and `requirements-notebook.txt`. The two API notebooks page through their full collection because the API does not effectively filter by date. They keep only the selected date and write a CSV cache under `data/processed/`. On later runs, the notebooks reuse that cache unless `REFRESH_CACHE = True`.

The dated CSV snapshots above are tracked for reproducible inspection. Generated caches for other dates/collections remain ignored by `.gitignore`; do not force-add them unless a new snapshot is intentionally being preserved.

## Documentation references

- [GreenCity resources](https://hackathon.greencity.hn/resources)
- [GreenCity senseBox:bike data guide](https://hackathon.greencity.hn/resources/bike-data)
- [ATRAI collections API](https://api.atrai.bike/collections)
