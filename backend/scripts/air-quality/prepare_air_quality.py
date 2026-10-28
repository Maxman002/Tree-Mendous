"""Prepare the air-quality layer from the senseBox:bike and senseBox:home particulate-matter readings.

Reads two dated snapshots of the ATRAI API (2 Sep 2026), taken from vibin-branch (see DATASETS.md there):
- backend/data/air-quality/osem_bike_data_heilbronn_2026-09-02.csv: mobile bike readings, averaged
  into grid cells of about 50 m,
- backend/data/weather-stations/osem_home_data_heilbronn_2026-09-02.csv: stationary sensors,
  averaged per station over the day,
and writes frontend/data/air-quality/pm.json.

Run from the repository root:
    python3 backend/scripts/air-quality/prepare_air_quality.py

Uses only the Python standard library.
"""

import csv
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
BIKE_SOURCE = ROOT / "backend" / "data" / "air-quality" / "osem_bike_data_heilbronn_2026-09-02.csv"
HOME_SOURCE = ROOT / "backend" / "data" / "weather-stations" / "osem_home_data_heilbronn_2026-09-02.csv"
OUTPUT = ROOT / "frontend" / "data" / "air-quality" / "pm.json"

CELL_SIZE_METERS = 50
HEILBRONN_LATITUDE = 49.1427
METERS_PER_DEGREE_LATITUDE = 111_320
METERS_PER_DEGREE_LONGITUDE = METERS_PER_DEGREE_LATITUDE * math.cos(math.radians(HEILBRONN_LATITUDE))


def read_samples(path):
    """Yield (box name, latitude, longitude, PM2.5, PM10, createdAt) for every row with both PM values."""
    with path.open(newline="", encoding="utf-8") as file:
        for row in csv.DictReader(file):
            try:
                values = [float(row[key]) for key in ("latitude", "longitude", "Finedust PM2.5", "Finedust PM10")]
            except (KeyError, TypeError, ValueError):
                continue
            if not all(math.isfinite(value) for value in values):
                continue
            yield (row["boxName"], *values, row.get("createdAt", ""))


def average(groups, key, latitude, longitude, pm25, pm10):
    group = groups.setdefault(key, [0.0, 0.0, 0.0, 0.0, 0])
    group[0] += latitude
    group[1] += longitude
    group[2] += pm25
    group[3] += pm10
    group[4] += 1


def build_cells(samples):
    cells = {}
    times = []
    for _, latitude, longitude, pm25, pm10, created in samples:
        key = (
            math.floor(latitude * METERS_PER_DEGREE_LATITUDE / CELL_SIZE_METERS),
            math.floor(longitude * METERS_PER_DEGREE_LONGITUDE / CELL_SIZE_METERS),
        )
        average(cells, key, latitude, longitude, pm25, pm10)
        times.append(created)
    rows = [[round(lat / n, 5), round(lng / n, 5), round(a / n, 2), round(b / n, 2), n] for lat, lng, a, b, n in cells.values()]
    return rows, min(times), max(times)


def build_stations(samples):
    stations = {}
    for name, latitude, longitude, pm25, pm10, _ in samples:
        average(stations, name, latitude, longitude, pm25, pm10)
    return [
        {"name": name, "coordinates": [round(lat / n, 6), round(lng / n, 6)], "pm2_5": round(a / n, 2), "pm10": round(b / n, 2), "count": n}
        for name, (lat, lng, a, b, n) in sorted(stations.items())
    ]


def main():
    cells, first, last = build_cells(read_samples(BIKE_SOURCE))
    stations = build_stations(read_samples(HOME_SOURCE))
    if not cells:
        raise SystemExit(f"No valid rows in {BIKE_SOURCE}")

    output = {
        "source": "ATRAI API: osem_bike_data (tag heilbronn) and osem_home_data_heilbronn, 2 Sep 2026",
        "date": "2026-09-02",
        "from": first,
        "to": last,
        "samples": sum(cell[4] for cell in cells),
        "cellSizeMeters": CELL_SIZE_METERS,
        "columns": ["latitude", "longitude", "pm2_5", "pm10", "count"],
        "cells": cells,
        "stations": stations,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(output, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
    size_kb = OUTPUT.stat().st_size / 1024
    print(f"{output['samples']} bike readings -> {len(cells)} cells, {len(stations)} stations, {size_kb:.0f} KB: {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
