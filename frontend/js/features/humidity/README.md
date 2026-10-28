# Slot: humidity

**Kind:** base-layer · **Status:** ready

Shows how humid the air was along the team's measuring rides. Each colour spot is the average
relative humidity of a grid cell of about 25 m. Clicking the map near a measured street opens the
humidity of that cell in the info panel. Map tiles turn grey while this layer is on, like the heat map.

The colours are relative: sand is the driest and dark blue the most humid cell average in this data
set (about 40–65 %), not fixed thresholds. Values exist only along the routes that were ridden. Warm
air holds more water, so the same amount of moisture reads as a lower relative humidity where it is
hot: dry spots on this map often match the hot spots of the heat map. The rides happened at different
times of day, which also changes the humidity.

The idea comes from the `humidity` branch: its `humidity website/` folder is a copy of the old
prototype with a live UBA air-quality layer, and its data file is the same `alles.csv` as the heat
map, whose `humidity` column had not been shown yet.

## Data

- **Source:** mobile loggers (senseBox:bike), recorded by the team on 1–3 September 2026 (61,543
  readings with humidity). Raw file: `backend/data/heatmap/alles.csv`, shared with the heat map.
- **Website file:** `frontend/data/humidity/humidity-cells.json` (about 20 KB): `minHumidity`,
  `maxHumidity` (lowest and highest cell average), `minReading`, `maxReading`, `cellSizeMeters` and
  `cells`, a list of `[latitude, longitude, average relative humidity in %, number of readings]`.

## Regenerate the data

From the repository root:

```sh
python3 backend/scripts/humidity/prepare_humidity.py
```

## Depends on

- [Leaflet.heat 0.2.0](https://github.com/Leaflet/Leaflet.heat), loaded from unpkg in `init()`.
- The heat map's `style.css` for the fade of `.leaflet-heatmap-layer`; this slot's own CSS only
  turns it on with the `humidity-active` class.

## Ideas / open

- Show the live UBA air-quality stations from the `humidity` branch (it needs a small proxy server,
  because the UBA API is not called from the browser directly there).
- Split by day or time of day, so morning and afternoon rides can be compared.
