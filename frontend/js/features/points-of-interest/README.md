# Slot: points-of-interest

**Kind:** overlay (on by default) · **Status:** ready

Shows Eirini's seven points as round markers. The colour and symbol show the kind (European Green
Capital 2027 project, smart sensors, park). Clicking a marker opens a detail card in the info panel:
kind, name, description and an optional link. The **Birdhouse** card has an **Open bird dashboard**
button that opens the dashboard of the `birdhouses` slot (it works even when that layer is off).

## Data

`frontend/data/points-of-interest/poi.json`, converted from `points_of_interest.json` on the
`eirini` branch as her `instructions.md` asks: names, descriptions, coordinates and links are
Eirini's (one missing full stop added in the Wollhaus text), German texts were added.

```json
{
  "id": "1",
  "title": { "en": "Birdhouse", "de": "Vogelhaus" },
  "description": { "en": "…", "de": "…" },
  "kind": "smart-sensors",
  "coordinates": [49.151995, 9.215480],
  "link": "",
  "birdhouse": "birdhouse-01"
}
```

- `id` is Eirini's id as a string; the `tour` slot uses these ids for its stops.
- `kind` comes from Eirini's `category`: `green-capital` ("European Green Capital 2027"),
  `smart-sensors` ("Smart Sensors") or `park`.
- `coordinates` are `[latitude, longitude]`. Empty German texts fall back to English. `link` is
  optional.
- `birdhouse` (optional) is the id of a station in `frontend/data/birdhouses/birdhouses.json`; the
  card then shows the button to its bird dashboard.

## To do

- More city projects from the fact sheets (`Steckbriefe_10-2026_EN.pdf`).
- The beehive and the birdhouse are about 25 m apart, so their markers overlap until you zoom in.
