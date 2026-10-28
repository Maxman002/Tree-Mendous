"""Prepare the 2 September 2026 Mobile Datalogger heat-map cells.

The GreenCity resources page links alles.csv as Mobile Datalogger data, even though its
recording values contain senseBox_bike filenames. Keep the published dataset identity
as Mobile Datalogger until the provider clarifies the filenames.

Run from the repository root:
    python backend/scripts/heatmap/prepare_heatmap.py

Uses only the Python standard library.
"""

import csv
from datetime import date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from temperature_cells import number, write_temperature_cells

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "backend" / "data" / "heatmap" / "alles.csv"
OUTPUT = ROOT / "frontend" / "data" / "heatmap" / "reedu" / "mobile-datalogger-cells.csv"
TARGET_DATE = date(2026, 9, 2)
LOCAL_TIMEZONE = ZoneInfo("Europe/Berlin")


def read_samples(path):
    with path.open(newline="", encoding="utf-8") as file:
        for row in csv.DictReader(file):
            try:
                timestamp = row["timestamp"]
                latitude = number(row["latitude"])
                longitude = number(row["longitude"])
                temperature = number(row["temperature"])
                if latitude is None or longitude is None or temperature is None:
                    continue
                timestamp_local = datetime.fromisoformat(
                    timestamp.replace("Z", "+00:00")
                )
                if timestamp_local.utcoffset() is None:
                    continue
                timestamp_local = timestamp_local.astimezone(LOCAL_TIMEZONE)
            except (KeyError, TypeError, ValueError):
                continue
            if timestamp_local.date() != TARGET_DATE:
                continue
            yield latitude, longitude, temperature


def main():
    if not SOURCE.is_file():
        raise FileNotFoundError(f"Mobile Datalogger source CSV not found: {SOURCE}")
    sample_count, cell_count = write_temperature_cells(read_samples(SOURCE), OUTPUT)
    print(
        f"{sample_count:,} Mobile Datalogger readings -> {cell_count:,} grid cells: "
        f"{OUTPUT.relative_to(ROOT)}"
    )


if __name__ == "__main__":
    main()
