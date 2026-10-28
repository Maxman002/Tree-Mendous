"""Prepare the humidity layer from the mobile bike readings.

Reads the humidity column of backend/data/heatmap/alles.csv (the same senseBox:bike
recordings of 1-3 Sep 2026 as the heat map), averages the readings into grid cells of
about 25 m and writes a small JSON file for the website:
frontend/data/humidity/humidity-cells.json.

Run from the repository root:
    python3 backend/scripts/humidity/prepare_humidity.py

Uses only the Python standard library.
"""

import csv
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
# The heat map's raw file has a humidity column, so both layers share one input.
SOURCE = ROOT / "backend" / "data" / "heatmap" / "alles.csv"
OUTPUT = ROOT / "frontend" / "data" / "humidity" / "humidity-cells.json"

CELL_SIZE_METERS = 25
HEILBRONN_LATITUDE = 49.1427
METERS_PER_DEGREE_LATITUDE = 111_320
METERS_PER_DEGREE_LONGITUDE = METERS_PER_DEGREE_LATITUDE * math.cos(math.radians(HEILBRONN_LATITUDE))


def read_samples(path):
    """Yield (latitude, longitude, relative humidity, timestamp) for every valid row."""
    with path.open(newline="", encoding="utf-8") as file:
        for row in csv.DictReader(file):
            try:
                latitude = float(row["latitude"])
                longitude = float(row["longitude"])
                humidity = float(row["humidity"])
            except (KeyError, TypeError, ValueError):
                continue
            if not (-90 <= latitude <= 90 and -180 <= longitude <= 180 and 0 <= humidity <= 100):
                continue
            if not all(math.isfinite(value) for value in (latitude, longitude, humidity)):
                continue
            yield latitude, longitude, humidity, row.get("timestamp", "")


def build_cells(samples):
    cells = {}
    stats = {"samples": 0, "min": math.inf, "max": -math.inf, "first": None, "last": None}
    for latitude, longitude, humidity, timestamp in samples:
        stats["samples"] += 1
        stats["min"] = min(stats["min"], humidity)
        stats["max"] = max(stats["max"], humidity)
        if timestamp:
            stats["first"] = min(stats["first"] or timestamp, timestamp)
            stats["last"] = max(stats["last"] or timestamp, timestamp)

        key = (
            math.floor(latitude * METERS_PER_DEGREE_LATITUDE / CELL_SIZE_METERS),
            math.floor(longitude * METERS_PER_DEGREE_LONGITUDE / CELL_SIZE_METERS),
        )
        cell = cells.setdefault(key, [0.0, 0.0, 0.0, 0])
        cell[0] += latitude
        cell[1] += longitude
        cell[2] += humidity
        cell[3] += 1
    return cells, stats


def main():
    cells, stats = build_cells(read_samples(SOURCE))
    if stats["samples"] == 0:
        raise SystemExit(f"No valid rows in {SOURCE}")

    rows = [[round(lat / n, 5), round(lng / n, 5), round(hum / n, 1), n] for lat, lng, hum, n in cells.values()]
    output = {
        "source": "senseBox:bike mobile humidity readings, Heilbronn",
        "from": stats["first"],
        "to": stats["last"],
        "samples": stats["samples"],
        "cellSizeMeters": CELL_SIZE_METERS,
        # The scale runs between the driest and the most humid cell average, like the heat map's.
        "minHumidity": min(row[2] for row in rows),
        "maxHumidity": max(row[2] for row in rows),
        "minReading": round(stats["min"], 1),
        "maxReading": round(stats["max"], 1),
        "columns": ["latitude", "longitude", "humidity", "count"],
        "cells": rows,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(output, separators=(",", ":")), encoding="utf-8")
    size_kb = OUTPUT.stat().st_size / 1024
    print(f"{stats['samples']} readings -> {len(rows)} cells, {size_kb:.0f} KB: {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
