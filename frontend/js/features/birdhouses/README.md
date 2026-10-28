# Slot: birdhouses

**Kind:** overlay · **Status:** placeholder

Shows the smart birdhouses as brown markers. Clicking one opens a card with its description, its
bird data (visits in the last 7 days, species, last visit) and a link to the station page.

## Data

`frontend/data/birdhouses/birdhouses.json`, a list of:

```json
{
  "id": "birdhouse-01",
  "name": { "en": "…", "de": "…" },
  "coordinates": [49.151995, 9.21548],
  "description": { "en": "…", "de": "" },
  "link": "https://wiediversistmeingarten.org/view/station/…",
  "sample": false,
  "birds": { "visitsLast7Days": 23, "species": ["Great tit"], "lastVisit": "2026-10-27" }
}
```

`birds` can be `null` while there is no data; the card then says so.

**Now:** two entries. The first is a real station (location and link from Eirini's
`points_of_interest.json` on the `eirini` branch) without bird data yet. The second is made up
(`"sample": true`) to show what the bird data looks like.

## To do

- Get the station list and bird data from Birdiary (links on https://hackathon.greencity.hn/resources).
- Write `backend/scripts/birdhouses/prepare_birdhouses.py` that writes `birdhouses.json` in the
  format above. Remove the sample entry, then set `status: "ready"`.
