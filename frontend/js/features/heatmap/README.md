# Slot: heatmap

**Kind:** base-layer · **Status:** ready

Shows where Heilbronn was hot during the team's measuring rides. Each colour spot is the average
temperature of a grid cell of about 25 m. Clicking the map near a measured street opens the
temperature of that cell in the info panel. Map tiles turn grey while this layer is on.

The colours are relative: blue is the coolest and red the hottest single reading in this data set
(19.9–29.6 °C), not fixed temperature thresholds. Temperatures exist only along the routes that were ridden; the heat
layer blurs between them, so it is not citywide coverage.

## Data

- **Source:** mobile temperature loggers (senseBox:bike), recorded by the team on 1–3 September 2026
  (61,546 readings). Raw file: `backend/data/heatmap/alles.csv` (columns `timestamp, latitude,
  longitude, temperature, humidity, gps_speed, recording`). Its `humidity` column feeds the
  `humidity` slot.
- **Website file:** `frontend/data/heatmap/temperature-cells.json` (about 20 KB):
  `minTemperature`, `maxTemperature`, `cellSizeMeters` and `cells`, a list of
  `[latitude, longitude, average temperature, number of readings]`.

## Regenerate the data

From the repository root:

```sh
python3 backend/scripts/heatmap/prepare_heatmap.py
```

To change the grid size, edit `CELL_SIZE_METERS` in that script.

## Depends on

- [Leaflet.heat 0.2.0](https://github.com/Leaflet/Leaflet.heat), loaded from unpkg in `init()`.

## Ideas / open

- Use fixed temperature bands (e.g. °C steps) instead of a relative scale.
- Add the Heat-Island Summer School heat-walk loggers.
