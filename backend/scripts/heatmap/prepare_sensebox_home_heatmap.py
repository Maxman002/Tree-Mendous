"""Prepare the 2 September 2026 senseBox:home heat-map cells for Heilbronn."""

import csv
from pathlib import Path

from temperature_cells import number, write_temperature_cells

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "backend" / "data" / "weather-stations" / "osem_home_data_heilbronn_2026-09-02.csv"
OUTPUT = ROOT / "frontend" / "data" / "heatmap" / "reedu" / "sensebox-home-cells.csv"
TARGET_DATE = "2026-09-02"


def read_samples(path):
    seen_indices = {}
    with path.open(newline="", encoding="utf-8") as file:
        for row in csv.DictReader(file):
            index = row.get("index")
            if not index:
                continue
            previous = seen_indices.get(index)
            if previous is not None:
                if previous != row:
                    raise ValueError(f"Conflicting source rows share ATRAI index {index}.")
                continue
            seen_indices[index] = row

            if row.get("createdAt", "")[:10] != TARGET_DATE:
                continue
            latitude = number(row.get("latitude"))
            longitude = number(row.get("longitude"))
            temperature = number(row.get("Temperature"))
            if latitude is None or longitude is None or temperature is None:
                continue
            yield latitude, longitude, temperature


def main():
    if not SOURCE.is_file():
        raise FileNotFoundError(f"senseBox:home source CSV not found: {SOURCE}")
    sample_count, cell_count = write_temperature_cells(read_samples(SOURCE), OUTPUT)
    print(
        f"{sample_count:,} senseBox:home readings -> {cell_count:,} grid cells: "
        f"{OUTPUT.relative_to(ROOT)}"
    )


if __name__ == "__main__":
    main()
