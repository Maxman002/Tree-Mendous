# Slot: points-of-interest

**Kind:** overlay (on by default) · **Status:** placeholder

Shows city projects, events and places as round markers. The colour shows the kind (Green
Capital project, event, place), the symbol the category. Clicking a marker opens a detail card
in the info panel: title, kind · category · when, description, "why it matters for the
environment" and an optional link.

## Data

`frontend/data/points-of-interest/poi.json`: a list of points in this format:

```json
{
  "id": "06",
  "title": { "en": "Wellbeing Oasis at the Robert Mayer Monument", "de": "Wohlfühloase am Robert-Mayer-Denkmal" },
  "description": { "en": "…", "de": "" },
  "category": "greening",
  "kind": "city-project",
  "coordinates": [49.142452, 9.218943],
  "when": "2027",
  "environment": { "en": "Provides shade and improves the microclimate …", "de": "" },
  "link": ""
}
```

- `coordinates` are `[latitude, longitude]`.
- `category`: `greening`, `mobility`, `nature`, `energy`, `circular`, `culture`, `education`,
  `participation`.
- `kind`: `city-project`, `event` or `place`.
- Empty German texts fall back to English. `link` is optional.

**Now:** six points converted from Eirini's `points_of_interest.json` on the `eirini` branch
(the birdhouse from that file is in the `birdhouses` slot). The categories, `when` and the
`environment` lines were added during the conversion and still need checking. The Green Capital
projects come from the city's fact sheets (`Steckbriefe_10-2026_EN.pdf`); their pins are
approximate.

## To do

- Deliver the full file (about 10 city projects plus other points) in the format above, with
  checked coordinates and German texts, then set `status: "ready"`.
- The `routes` slot reads this file too, so every point becomes a possible route stop.
