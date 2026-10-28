"""Prepare the birdhouses layer from the Birdiary smart bird feeders.

Reads the settings in backend/data/birdhouses/species.json (stations, species whitelist, AI fixes),
downloads every visit ("movement") of each station from the Birdiary API and writes two small files:

    frontend/data/birdhouses/birdhouses.json   the stations with their bird counts
    frontend/data/birdhouses/species.json      names, colours and facts of the whitelisted birds

Each visit counts for the species the AI was most sure about, if that score is at least `minScore`.
AI mix-ups listed in `fixes` are relabelled (e.g. the North American chickadee that is really a
great tit). Species that are not on the whitelist are counted as "uncertain".

Run from the repository root (needs internet):
    python3 backend/scripts/birdhouses/prepare_birdhouses.py

Uses only the Python standard library.
"""

import json
import time
import urllib.parse
import urllib.request
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SETTINGS = ROOT / "backend" / "data" / "birdhouses" / "species.json"
OUTPUT_DIR = ROOT / "frontend" / "data" / "birdhouses"

BASE_URL = "https://wiediversistmeingarten.org/api"
PAGE_SIZE = 500
RECENT_DAYS = 30


def get(path, **params):
    """GET an API path and return the parsed JSON. Retries a few times on errors."""
    url = f"{BASE_URL}{path}?{urllib.parse.urlencode(params)}"
    for attempt in range(3):
        try:
            with urllib.request.urlopen(url, timeout=60) as response:
                return json.load(response)
        except OSError as error:
            if attempt == 2:
                raise
            print(f"  request failed ({error}), retrying …")
            time.sleep(2 * (attempt + 1))


def parse_date(text):
    """'2026-10-06 11:00:16.381854' (station clock) -> datetime, without fractions or time zone."""
    return datetime.fromisoformat(text[:19])


def all_movements(station_id):
    """Every movement of a station, newest first, paged through the station endpoint."""
    movements, offset = [], 0
    while True:
        page = get(f"/station/{station_id}", movements=PAGE_SIZE, movementsOffset=offset)
        movements += page.get("measurements", {}).get("movements", [])
        if not page.get("movementsMeta", {}).get("hasMore"):
            return movements
        offset += PAGE_SIZE


def identify(movement, settings):
    """(species, was_corrected) for a movement, or None if the AI's best guess is too unsure."""
    best = max(movement.get("detections") or [], key=lambda d: d["score"], default=None)
    if not best or best["score"] < settings["minScore"]:
        return None
    latin = best["latinName"]
    if latin in settings["fixes"]:
        return settings["fixes"][latin], True
    if latin in settings["species"]:
        return latin, False
    return "uncertain", False


def summarise(visits, since, until):
    """Counts per species for visits between since and until (visits: list of (date, species, corrected, weight))."""
    per_species = {}
    total = 0
    for date, species, corrected, weight in visits:
        if since and date < since:
            continue
        total += 1
        if species == "uncertain":
            continue
        entry = per_species.setdefault(species, {"latin": species, "count": 0, "corrected": 0, "weights": [],
                                                 "firstSeen": date, "lastSeen": date})
        entry["count"] += 1
        entry["corrected"] += corrected
        if weight:
            entry["weights"].append(weight)
        entry["firstSeen"] = min(entry["firstSeen"], date)
        entry["lastSeen"] = max(entry["lastSeen"], date)

    species = []
    for entry in sorted(per_species.values(), key=lambda e: -e["count"]):
        weights = entry.pop("weights")
        entry["avgWeight"] = round(sum(weights) / len(weights), 1) if weights else None
        entry["firstSeen"] = entry["firstSeen"].date().isoformat()
        entry["lastSeen"] = entry["lastSeen"].date().isoformat()
        species.append(entry)
    first = min((v[0] for v in visits if not since or v[0] >= since), default=until)
    return {"from": (since or first).date().isoformat(), "to": until.date().isoformat(), "total": total, "species": species}


def main():
    settings = json.loads(SETTINGS.read_text(encoding="utf-8"))
    now = datetime.now()
    birdhouses = []

    for station in settings["stations"]:
        print(f"{station['id']}: downloading movements …")
        visits = []
        for movement in all_movements(station["stationId"]):
            result = identify(movement, settings)
            if result:
                visits.append((parse_date(movement["start_date"]), *result, movement.get("weight")))
        print(f"  {len(visits)} visits with a confident AI guess")

        birdhouses.append({
            "id": station["id"],
            "name": station["name"],
            "coordinates": station["coordinates"],
            "description": station["description"],
            "link": f"https://wiediversistmeingarten.org/view/station/{station['stationId']}",
            "sample": False,
            "birds": {
                "updated": now.date().isoformat(),
                "lastVisit": max(v[0] for v in visits).date().isoformat() if visits else None,
                "ranges": {
                    "recent": summarise(visits, now - timedelta(days=RECENT_DAYS), now),
                    "all": summarise(visits, None, now),
                },
            } if visits else None,
        })

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "birdhouses.json").write_text(json.dumps(birdhouses, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUTPUT_DIR / "species.json").write_text(json.dumps(settings["species"], ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUTPUT_DIR.relative_to(ROOT)}/birdhouses.json and species.json")


if __name__ == "__main__":
    main()
