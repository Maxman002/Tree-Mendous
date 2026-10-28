# Slot: birdhouses

**Kind:** overlay · **Status:** ready

Shows the Birdiary smart bird feeders as brown markers. Clicking one opens a card with its visits in
the last 30 days, the last visit and its three most frequent birds (photo, English and German name).
**Open bird dashboard** shows a full-screen dashboard over the map:

- a ring chart of visits per species and a share donut, with a photo legend in the chart colours
- an info card per bird: names (English, German, Latin), visits, average weight on the perch next to
  the species' typical weight, a short fact, and how many AI labels were corrected
- key numbers and a QR code to the feeder's live camera page
- a switch between "last 30 days" and "since the feeder started"; a full-screen button for display
  screens. After 30 s without input it cycles through the birds by itself.

Files: `index.js` (the slot and the card), `dashboard.js` (the dashboard), `photos.js` (bird photos),
`style.css`.

## Data

Prepared offline by `backend/scripts/birdhouses/prepare_birdhouses.py`, which reads the settings in
`backend/data/birdhouses/species.json` and writes:

- `frontend/data/birdhouses/birdhouses.json`: the stations, each with
  `birds.ranges.recent` (last 30 days) and `birds.ranges.all` (since the first visit):
  `{ from, to, total, species: [{ latin, count, corrected, avgWeight, firstSeen, lastSeen }] }`.
  `total` includes the uncertain visits; the dashboard shows the difference as "Uncertain".
- `frontend/data/birdhouses/species.json`: name (en/de), colour, typical weight and fact (en/de) of
  every whitelisted species.

**How visits are counted.** Each visit (movement) counts for the AI's best guess if its score is at
least `minScore` (0.6). The AI often picks a similar-looking bird from another continent; the
`fixes` in the settings relabel mix-ups we checked against the videos and the perch weight
(*Poecile atricapillus* → great tit). Only species on the whitelist are named; everything else is
"uncertain" (the perch scale only ever measured 10–30 g, so pelicans and geese are impossible).

**Photos** come from Wikipedia's summary API (Wikimedia Commons images), loaded in the browser by
Latin name and credited in the info card. Without internet the circles show the first letters.

## Regenerate the data

```sh
python3 backend/scripts/birdhouses/prepare_birdhouses.py
```

Standard library only; needs internet (Birdiary API). To add a bird, add it to `species` in the
settings file; to add a feeder, add it to `stations`.

The data in the repository was first built from a 28 Oct 2026 export of the same API (station
"Open Space Heilbronn"), so run the script once to refresh it.

## To do

- Check the videos of White wagtail and Black redstart (6 and 2 visits) before relying on them, and
  of the coal tit (its average perch weight of 18 g is more like a great tit).
- Use stills from the feeder's own videos instead of Wikipedia photos.
- The second Heilbronn station near campus (Arkadia) recorded almost nothing, so it is not shown.
