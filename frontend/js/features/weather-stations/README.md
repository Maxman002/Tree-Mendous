# Slot: weather-stations

**Kind:** overlay · **Status:** ready

Shows the stationary senseBox:home sensors as blue pills with their mean temperature on
2 Sep 2026. Clicking one opens a card with the mean, lowest and highest temperature, mean humidity
and PM2.5, an hourly temperature chart, the time span it recorded and its distance from the
Marktplatz.

## Data

Prepared offline by `backend/scripts/weather-stations/prepare_weather_stations.py` from
`backend/data/weather-stations/osem_home_data_heilbronn_2026-09-02.csv`, a dated snapshot of the
ATRAI collection `osem_home_data_heilbronn` copied from `vibin-branch` (explained in its
`DATASETS.md`). Output: `frontend/data/weather-stations/stations.json` (about 4 KB).

Read the stations with care (from `DATASETS.md` and our own check):

| Station | Distance from Marktplatz | Recorded on 2 Sep |
|---|---|---|
| Innenstadt | 0.3 km | the whole day |
| GreenCity OpenSpace | 1.0 km | only 00:00–00:52 |
| THW Heilbronn | 2.2 km | only 00:00–14:00, no PM |
| HCG Beilstein | 12.8 km | the whole day, but 28–31 °C even at night (probably indoors or in a warm spot) |
| Wolf-von-Gemmingen-Schule | 16.7 km | from 06:43 |

So the daily means are not comparable between stations; the card says which hours each one covers.
The `createdAt` times have no time zone and are shown as recorded.

## Regenerate the data

```sh
python3 backend/scripts/weather-stations/prepare_weather_stations.py
```

Standard library only.

## To do

- More days, so the stations can be compared over the same hours.
- Decide with the team whether to hide the two stations outside Heilbronn.
