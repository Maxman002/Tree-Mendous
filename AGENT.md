# AGENT.md – adding your part to the Tree-Mendous website

## Purpose

Tree-Mendous is the team's prototype for the Green City Hackathon Heilbronn (27–29 October 2026): a map of Heilbronn that shows environmental data (heat, air quality) next to the city's European Green Capital 2027 projects, points of interest, birdhouses and routes. The website is built as a **foundation with "blank spaces"**: one slot per feature. Each team member works on one feature and their agent fills that feature's slot.

You are the agent of a team member. Your job: put your person's feature into the website **without breaking the other slots**. Mo and the team decide; when in doubt, ask your person.

## Read first

1. This file, completely.
2. `README.md` (how to run the site, the slot list and its status).
3. The slot folder you are going to fill: `frontend/js/features/<slot>/` and its `README.md`.
4. One slot that is already filled (`heatmap` once it is ready), as the example to copy.

## How it is built

> **TO BE FILLED IN BY THE FOUNDATION AGENT** when it builds the foundation: the real file tree with one line per folder, the exact slot contract and a minimal slot example, copied from the code. Until then, the plan below is the intended structure.

Intended structure:

```
backend/                  Python: scripts that download and prepare data (run once, not a server)
  requirements.txt
  scripts/<slot>/         one folder per slot, writes its output to frontend/data/<slot>/
frontend/
  index.html
  css/                    base styles; slot styles in their own file
  js/core/                map, slot registry, layer switcher, info panel, language switch (don't change)
  js/features/<slot>/     one folder per slot: index.js + README.md
  js/features/index.js    the list of slots that get loaded
  data/<slot>/            the slot's static data (GeoJSON / JSON)
  i18n/en.json, de.json   UI texts; English is required, German if possible
```

Every slot is a module that exports one object and is listed in `js/features/index.js`. The core does the rest (adds it to the layer switcher, the legend, the info panel). Intended contract:

```js
export default {
  id: "air-quality",                 // same as the folder name
  kind: "base-layer",                // "base-layer" (one shown at a time: heat, air quality),
                                     // "overlay" (on top, e.g. birdhouses, points of interest),
                                     // or "tool" (e.g. routes)
  title: { en: "Air quality", de: "Luftqualität" },
  status: "placeholder",             // "placeholder" until real data and code are in, then "ready"
  source: "senseBox:home Heilbronn (api.atrai.bike)",   // shown in the info panel
  async init(ctx) {                  // ctx gives the map, the data loader, the panel and i18n
    // build your Leaflet layer here and return it
  },
};
```

Slots that exist from the start (all but the heat map begin as placeholders with sample data):

| Slot | Kind | What goes in |
|---|---|---|
| `heatmap` | base-layer | the team's heat-map prototype, moved into the slot |
| `air-quality` | base-layer | particulate matter, chosen in the same switcher as the heat map |
| `points-of-interest` | overlay | a JSON file with location and description per point (city projects included) |
| `birdhouses` | overlay | birdhouse locations with their bird data |
| `routes` | tool | routes connecting points of interest, exportable to Google Maps |

## How to add your part

1. **Does it fit an existing slot?** Look at the slot list in `README.md`. If your feature is one of them (or belongs inside one, e.g. more points of interest), fill **that** slot.
2. **If nothing fits, create a new slot:** copy an existing slot folder of the same kind, rename it (kebab-case), change `id`, `title` and `source`, add it to `js/features/index.js` and to the slot list in `README.md`. Don't invent a new pattern.
3. **Data:** put a preparation script in `backend/scripts/<slot>/` and its output in `frontend/data/<slot>/`. Keep each file small (aim for under 1 MB); never load raw sensor data in the browser.
4. **Code:** only inside `frontend/js/features/<slot>/` (and its own CSS file). Texts go in `i18n/en.json` (and `de.json` if you can), under your slot's id.
5. **Set `status: "ready"`** when it works with real data, and update the slot's `README.md` (what it shows, data source, how to regenerate the data).

## Rules

- Don't change `js/core/` or another person's slot. If you need something from the core (a new option in `ctx`, a new kind), ask your person, who asks the team.
- Follow the style of the existing code: plain JavaScript modules, Leaflet, no new framework or build tool. Python only in `backend/`.
- Cite your data source in the slot (`source`).
- No API keys, tokens or personal data in the repository.
- English first; German where you can.

## Run and check

- Run the site locally as described in `README.md` (a local static server in `frontend/`; no hosting needed yet).
- Before you say done: the page loads without console errors, your slot appears in the switcher or panel, the other slots still work, and it looks right in a desktop browser (no phone layout yet).

## Hand back

- Work on a branch named after your slot (e.g. `slot/air-quality`), commit in small steps with clear messages, and open a pull request. The team merges.
- In the pull request, say which slot you filled or created, the data source, and anything still missing.

## When unsure

Ask your person instead of guessing. They bring the question to the team chat.

---

*Claude Code users: add a `CLAUDE.md` next to this file that contains only the line `@AGENT.md`, so Claude Code reads these instructions too.*

*Written by the librarian of Mo's vault (Coppermind-AI, project Tree-Mendous) on 2026-10-28, from the team's decisions of the same day.*
