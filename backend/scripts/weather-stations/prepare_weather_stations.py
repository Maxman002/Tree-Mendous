"""Prepare the weather-stations layer from the senseBox:home stations.

Reads backend/data/weather-stations/osem_home_data_heilbronn_2026-09-02.csv, a dated snapshot of the
ATRAI collection osem_home_data_heilbronn (2 Sep 2026, taken from vibin-branch, see DATASETS.md
there), and writes one entry per station with its daily minimum, mean and maximum and the hourly
means of temperature and humidity: frontend/data/weather-stations/stations.json.

The createdAt times have no time zone; they are kept as recorded (DATASETS.md).

Run from the repository root:
    python3 backend/scripts/weather-stations/prepare_weather_stations.py

Uses only the Python standard library.
"""

import csv
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "backend" / "data" / "weather-stations" / "osem_home_data_heilbronn_2026-09-02.csv"
OUTPUT = ROOT / "frontend" / "data" / "weather-stations" / "stations.json"

MARKTPLATZ = (49.1427, 9.2185)  # centre of Heilbronn, for the distance shown on each station
MEASUREMENTS = {"temperature": "Temperature", "humidity": "Rel. Humidity", "pm2_5": "Finedust PM2.5"}


def distance_km(a, b):
    """Great-circle distance between two (latitude, longitude) pairs."""
    lat1, lng1, lat2, lng2 = map(math.radians, (*a, *b))
    h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lng2 - lng1) / 2) ** 2
    return 2 * 6371 * math.asin(math.sqrt(h))


def number(value):
    try:
        result = float(value)
    except (TypeError, ValueError):
        return None
    return result if math.isfinite(result) else None


def read_stations(path):
    stations = {}
    with path.open(newline="", encoding="utf-8") as file:
        for row in csv.DictReader(file):
            latitude, longitude = number(row.get("latitude")), number(row.get("longitude"))
            created = row.get("createdAt", "")
            if latitude is None or longitude is None or len(created) < 13:
                continue
            station = stations.setdefault(row["boxName"], {"coordinates": (latitude, longitude), "first": created, "last": created, "values": {}})
            station["first"] = min(station["first"], created)
            station["last"] = max(station["last"], created)
            hour = int(created[11:13])
            for key, column in MEASUREMENTS.items():
                value = number(row.get(column))
                if value is not None:
                    station["values"].setdefault(key, []).append((hour, value))
    return stations


def summarize(values):
    if not values:
        return None
    readings = [value for _, value in values]
    hourly = [[] for _ in range(24)]
    for hour, value in values:
        hourly[hour].append(value)
    return {
        "min": round(min(readings), 2),
        "mean": round(sum(readings) / len(readings), 2),
        "max": round(max(readings), 2),
        "count": len(readings),
        "hourly": [round(sum(hour) / len(hour), 2) if hour else None for hour in hourly],
    }


def main():
    stations = read_stations(SOURCE)
    if not stations:
        raise SystemExit(f"No valid rows in {SOURCE}")

    output = {
        "source": "ATRAI API: osem_home_data_heilbronn (senseBox:home), 2 Sep 2026",
        "date": "2026-09-02",
        "stations": [
            {
                "name": name,
                "coordinates": [round(value, 6) for value in station["coordinates"]],
                "distanceKm": round(distance_km(MARKTPLATZ, station["coordinates"]), 1),
                "from": station["first"],
                "to": station["last"],
                **{key: summarize(station["values"].get(key)) for key in MEASUREMENTS},
            }
            for name, station in sorted(stations.items())
        ],
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(output, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
    size_kb = OUTPUT.stat().st_size / 1024
    print(f"{len(output['stations'])} stations, {size_kb:.1f} KB: {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
