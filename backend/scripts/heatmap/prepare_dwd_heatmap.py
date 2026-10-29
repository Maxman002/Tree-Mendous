"""Prepare hourly DWD station data for the heat map via the Bright Sky API."""

from datetime import timezone
from pathlib import Path
from urllib.parse import urlencode

from weather_series import (
    HEATMAP_DIRECTORY,
    TARGET_DATE,
    fetch_json,
    local_day_utc_bounds,
    number,
    parse_timestamp,
    write_hourly_csv,
)

OUTPUT = HEATMAP_DIRECTORY / "dwd" / "temperature.csv"
BRIGHTSKY_SOURCE_ID = 304167
DWD_STATION_ID = "03734"
STATION_NAME = "Obersulm-Willsbach"
STATION_LATITUDE = 49.128
STATION_LONGITUDE = 9.3525


def read_measurements():
    start, end = local_day_utc_bounds()
    query = urlencode({
        "source_id": BRIGHTSKY_SOURCE_ID,
        "date": start.isoformat(timespec="seconds"),
        "last_date": end.isoformat(timespec="seconds"),
    })
    payload = fetch_json(f"https://api.brightsky.dev/weather?{query}")
    sources = payload.get("sources", [])
    if not any(source.get("id") == BRIGHTSKY_SOURCE_ID for source in sources):
        raise ValueError(f"Bright Sky response did not include source {BRIGHTSKY_SOURCE_ID}.")

    for observation in payload.get("weather", []):
        if observation.get("source_id") != BRIGHTSKY_SOURCE_ID:
            continue
        timestamp = parse_timestamp(observation["timestamp"], timezone.utc)
        temperature = number(observation.get("temperature"))
        if temperature is None:
            continue
        yield (
            timestamp,
            STATION_LATITUDE,
            STATION_LONGITUDE,
            temperature,
            number(observation.get("relative_humidity")),
            "weather_station_observation",
            f"DWD station {DWD_STATION_ID} ({STATION_NAME})",
        )


def main():
    count = write_hourly_csv(OUTPUT, read_measurements())
    print(
        f"{count} DWD hourly observations for {TARGET_DATE} "
        f"at {STATION_NAME}: {OUTPUT.relative_to(OUTPUT.parents[2])}"
    )


if __name__ == "__main__":
    main()
