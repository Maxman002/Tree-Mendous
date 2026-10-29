"""Download Open-Meteo ERA5-Land hourly weather for Heilbronn on 2 Sep 2026."""

from datetime import timedelta, timezone
from urllib.parse import urlencode

from weather_series import (
    CITY_LATITUDE,
    CITY_LONGITUDE,
    HEATMAP_DIRECTORY,
    TARGET_DATE,
    fetch_json,
    number,
    parse_timestamp,
    write_hourly_csv,
)

OUTPUT = HEATMAP_DIRECTORY / "open-meteo" / "temperature.csv"
MODEL = "era5_land"


def read_measurements():
    query = urlencode({
        "latitude": CITY_LATITUDE,
        "longitude": CITY_LONGITUDE,
        "start_date": (TARGET_DATE - timedelta(days=1)).isoformat(),
        "end_date": TARGET_DATE.isoformat(),
        "hourly": "temperature_2m,relative_humidity_2m",
        "timezone": "UTC",
        "models": MODEL,
    })
    payload = fetch_json(f"https://archive-api.open-meteo.com/v1/archive?{query}")
    latitude = number(payload.get("latitude"))
    longitude = number(payload.get("longitude"))
    hourly = payload.get("hourly", {})
    times = hourly.get("time", [])
    temperatures = hourly.get("temperature_2m", [])
    humidities = hourly.get("relative_humidity_2m", [])
    if latitude is None or longitude is None:
        raise ValueError("Open-Meteo response did not include valid grid coordinates.")
    if len(times) != len(temperatures) or len(times) != len(humidities):
        raise ValueError("Open-Meteo hourly arrays have different lengths.")

    for timestamp_text, temperature_value, humidity_value in zip(times, temperatures, humidities):
        timestamp = parse_timestamp(timestamp_text, timezone.utc)
        temperature = number(temperature_value)
        if temperature is None:
            continue
        yield (
            timestamp,
            latitude,
            longitude,
            temperature,
            number(humidity_value),
            "gridded_reanalysis",
            f"Open-Meteo {MODEL}",
        )


def main():
    count = write_hourly_csv(OUTPUT, read_measurements())
    print(
        f"{count} Open-Meteo {MODEL} hourly values for {TARGET_DATE}: "
        f"{OUTPUT.relative_to(OUTPUT.parents[3])}"
    )


if __name__ == "__main__":
    main()
