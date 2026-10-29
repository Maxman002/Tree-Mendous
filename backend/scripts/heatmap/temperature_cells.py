"""Shared helpers for producing compact temperature heat-map CSVs."""

import csv
import math
from pathlib import Path

CELL_SIZE_METERS = 25
HEILBRONN_LATITUDE = 49.1427
METERS_PER_DEGREE_LATITUDE = 111_320
METERS_PER_DEGREE_LONGITUDE = (
    METERS_PER_DEGREE_LATITUDE * math.cos(math.radians(HEILBRONN_LATITUDE))
)

# Approximate map area, not an official municipal boundary.
MIN_LONGITUDE, MIN_LATITUDE, MAX_LONGITUDE, MAX_LATITUDE = 9.10, 49.08, 9.28, 49.20


def number(value):
    try:
        result = float(value)
    except (TypeError, ValueError):
        return None
    return result if math.isfinite(result) else None


def is_in_map_area(latitude, longitude):
    return (
        MIN_LATITUDE <= latitude <= MAX_LATITUDE
        and MIN_LONGITUDE <= longitude <= MAX_LONGITUDE
    )


def write_temperature_cells(samples, output_path):
    """Aggregate (latitude, longitude, temperature) samples into a 25 m CSV grid."""
    cells = {}
    sample_count = 0

    for latitude, longitude, temperature in samples:
        if not is_in_map_area(latitude, longitude):
            continue
        if not all(math.isfinite(value) for value in (latitude, longitude, temperature)):
            continue
        if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
            continue

        key = (
            math.floor(latitude * METERS_PER_DEGREE_LATITUDE / CELL_SIZE_METERS),
            math.floor(longitude * METERS_PER_DEGREE_LONGITUDE / CELL_SIZE_METERS),
        )
        cell = cells.setdefault(key, [0.0, 0.0, 0.0, 0])
        cell[0] += latitude
        cell[1] += longitude
        cell[2] += temperature
        cell[3] += 1
        sample_count += 1

    if sample_count == 0:
        raise ValueError("No valid temperature readings fall within the map area.")

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["latitude", "longitude", "temperature", "count"])
        for latitude, longitude, temperature, count in cells.values():
            writer.writerow(
                [
                    round(latitude / count, 6),
                    round(longitude / count, 6),
                    round(temperature / count, 2),
                    count,
                ]
            )

    return sample_count, len(cells)
