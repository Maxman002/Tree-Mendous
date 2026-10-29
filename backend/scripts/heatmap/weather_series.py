"""Shared helpers for fetching and exporting hourly Heilbronn heat-map data."""

import csv
import json
import math
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[3]
TARGET_DATE = date(2026, 9, 2)
LOCAL_TIMEZONE = ZoneInfo("Europe/Berlin")
CITY_LATITUDE = 49.1427
CITY_LONGITUDE = 9.2185
HEATMAP_DIRECTORY = ROOT / "frontend" / "data" / "heatmap"
CSV_FIELDS = [
    "timestamp",
    "latitude",
    "longitude",
    "temperature_c",
    "relative_humidity_pct",
    "measurement_type",
    "source_id",
]


def local_day_utc_bounds():
    local_start = datetime.combine(TARGET_DATE, time.min, LOCAL_TIMEZONE)
    local_end = datetime.combine(TARGET_DATE + timedelta(days=1), time.min, LOCAL_TIMEZONE)
    return local_start.astimezone(timezone.utc), local_end.astimezone(timezone.utc)


def fetch_bytes(url):
    request = Request(url, headers={"User-Agent": "Tree-Mendous weather data preparation"})
    with urlopen(request, timeout=60) as response:
        return response.read()


def fetch_json(url):
    return json.loads(fetch_bytes(url))


def number(value):
    try:
        result = float(value)
    except (TypeError, ValueError):
        return None
    return result if math.isfinite(result) else None


def parse_timestamp(value, source_timezone=None):
    timestamp = datetime.fromisoformat(value)
    if timestamp.utcoffset() is None:
        if source_timezone is None:
            raise ValueError(f"Timestamp has no timezone: {value}")
        timestamp = timestamp.replace(tzinfo=source_timezone)
    return timestamp


def write_hourly_csv(path, measurements):
    normalized = {}
    for measurement in measurements:
        timestamp, latitude, longitude, temperature, humidity, measurement_type, source_id = measurement
        if timestamp.utcoffset() is None:
            raise ValueError(f"Measurement timestamp has no timezone: {timestamp}")
        timestamp = timestamp.astimezone(LOCAL_TIMEZONE)
        if timestamp.date() != TARGET_DATE:
            continue
        if not all(math.isfinite(value) for value in (latitude, longitude, temperature)):
            continue
        if humidity is not None and not math.isfinite(humidity):
            humidity = None

        key = timestamp.isoformat(timespec="minutes")
        row = (
            key,
            round(latitude, 6),
            round(longitude, 6),
            round(temperature, 2),
            "" if humidity is None else round(humidity, 2),
            measurement_type,
            source_id,
        )
        previous = normalized.get(key)
        if previous is not None and previous != row:
            raise ValueError(f"Conflicting weather observations share timestamp {key}.")
        normalized[key] = row

    if not normalized:
        raise ValueError(f"No valid weather observations for {TARGET_DATE}.")

    output_path = Path(path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(CSV_FIELDS)
        writer.writerows(normalized[key] for key in sorted(normalized))
    return len(normalized)
