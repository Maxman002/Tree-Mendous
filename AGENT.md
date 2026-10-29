# AGENT.md – adding your part to the Tree-Mendous website

## Purpose

Tree-Mendous is the team's prototype for the Green City Hackathon Heilbronn (27–29 October 2026): a map of Heilbronn that shows environmental data (heat, humidity, air quality) next to the city's European Green Capital 2027 projects, points of interest, weather stations, birdhouses and a walking tour. The website is built as a **foundation with "blank spaces"**: one slot per feature. Each team member works on one feature and their agent fills that feature's slot.

You are the agent of a team member. Your job: put your person's feature into the website **without breaking the other slots**. Mo and the team decide; when in doubt, ask your person.

## Read first

1. This file, completely.
2. `README.md` (how to run the site, the slot list and its status).
3. The slot folder you are going to fill: `frontend/js/features/<slot>/` and its `README.md`.
4. One slot that is already filled (`heatmap` is ready), as the example to copy.

## How it is built

Plain JavaScript ES modules loaded directly by the browser (no framework, no bundler), Leaflet 1.9.4
from a CDN, and Python scripts that prepare the data offline.

```
AGENT.md, CLAUDE.md          these instructions (CLAUDE.md only points Claude Code here)
README.md                    what the project is, how to run it, the slot list and its status
backend/                     Python: prepares data once, not a server
  requirements.txt           packages for the scripts (none needed so far)
  data/<slot>/               raw input data a script reads (e.g. data/heatmap/alles.csv)
  scripts/<slot>/            one folder per slot; writes its output to frontend/data/<slot>/
frontend/                    the website; run `python3 -m http.server 8000` in here
  index.html                 page layout: sidebar (layers, tools) and map (legend, info panel)
  css/base.css               core styles (from the vibin-branch prototype)
  i18n/en.json, de.json      UI texts: "core" plus one section per slot id
  data/<slot>/               the slot's static data (JSON / GeoJSON, aim for < 1 MB)
  js/main.js                 starts everything and builds the ctx object for each slot
  js/core/                   don't change without asking the team
    map.js                   the Leaflet map of Heilbronn
    registry.js              checks each slot against the contract and runs its init()
    layer-switcher.js        base layers (radio), overlays (checkbox)
    tools.js                 the card each tool slot gets in the "Tools" section
    legend.js                the map key; shows the legend of every layer on the map
    panel.js                 the info panel for clicked features
    loader.js                loadData() for frontend/data/, loadScript() for plugins
    i18n.js                  language switch (English default, German)
    html.js, toast.js        escapeHtml() and short messages
  js/features/index.js       the list of slots that get loaded, in sidebar order
  js/features/<slot>/        one folder per slot:
    index.js                   the slot (exports one object, see below)
    README.md                  what it shows, its data, how to regenerate it, what is missing
    style.css                  optional, the slot's own styles
```

### The slot contract

Every slot's `index.js` has `export default` one object:

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | kebab-case, the same as the folder name and the slot's section in `i18n/*.json` |
| `kind` | yes | `"base-layer"` (one at a time, radio button), `"overlay"` (checkbox) or `"tool"` (card in "Tools") |
| `title` | yes | `{ en, de }`, shown in the switcher, the legend and the tools card |
| `status` | yes | `"placeholder"` (shows a SAMPLE badge and "sample data" in the panel) or `"ready"` |
| `source` | yes | the data source, a string or `{ en, de }`; shown in the switcher and the info panel |
| `init(ctx)` | yes | `async`; builds the slot and returns its Leaflet layer (a tool may return a layer or nothing) |
| `icon` | no | one character for the switcher row, e.g. `"◉"` |
| `legend` | no | legend items, shown while the layer is on the map: `{ color, label }` for a dot or `{ gradient: [colours], from, to }` for a scale; labels are strings or `{ en, de }` |
| `style` | no | a CSS file in the slot folder, e.g. `"style.css"`; the core loads it |
| `visible` | no | `true` to show the layer at start. Without it the first base layer is shown and overlays start off |

The core adds the returned layer to the switcher (or, for a tool, straight to the map). If `init()`
throws, only that slot is greyed out ("Could not load this layer") and the error is in the console;
the other slots keep working. A slot that breaks the contract is skipped with a console error that
names the problem.

`ctx`, the object `init(ctx)` receives:

| Entry | What it does |
|---|---|
| `map`, `L` | the Leaflet map and the Leaflet library |
| `loadData(path)` | loads `frontend/data/<path>`; `.json`/`.geojson` come back parsed, other files as text |
| `loadScript(url)` | loads an external script once, e.g. a Leaflet plugin |
| `panel.show(render)` | opens the info panel. `render()` returns `{ kicker, title, html }` and is called again when the language changes. The core adds the slot's `source` at the bottom |
| `panel.close()` | closes the panel if this slot opened it (the core also closes it when the layer is switched off) |
| `setLegend(items)` | replaces the slot's legend, e.g. with min/max values computed from the data |
| `t(key, values)` | the text at `<slot id>.<key>` in `i18n/<lang>.json`; `{name}` placeholders are filled from `values` |
| `pick(value)` | `{ en, de }` → the text in the current language (falls back to English) |
| `language`, `onLanguageChange(fn)` | the current language, and a callback to redraw your own UI when it changes |
| `escapeHtml(text)` | use it for every data value you put into `html` |
| `notify(message)` | a short message at the bottom of the screen |
| `el` | **tools only:** the element inside the slot's tools card to put the tool's UI in |

### A minimal slot

This is the shape of `frontend/js/features/air-quality/index.js`, shortened:

```js
export default {
  id: "air-quality",
  kind: "base-layer",
  title: { en: "Air quality", de: "Luftqualität" },
  status: "placeholder",
  source: "senseBox:home Heilbronn (api.atrai.bike)",
  icon: "≋",
  legend: [{ color: "#d0563b", label: { en: "High (> 15 µg/m³)", de: "Hoch (> 15 µg/m³)" } }],

  async init(ctx) {
    const data = await ctx.loadData("air-quality/sample.geojson");
    return ctx.L.geoJSON(data, {
      pointToLayer: (feature, latlng) => ctx.L.circleMarker(latlng, { radius: 11, fillColor: "#d0563b", fillOpacity: 0.85 }),
      onEachFeature: (feature, layer) => layer.on("click", () => ctx.panel.show(() => ({
        kicker: ctx.t("kicker"),                       // i18n: "air-quality": { "kicker": "Particulate matter" }
        title: feature.properties.name,
        html: `<p>PM2.5: ${ctx.escapeHtml(feature.properties.pm2_5)} µg/m³</p>`
      })))
    });
  }
};
```

and one line each in `frontend/js/features/index.js`:

```js
import airQuality from "./air-quality/index.js";

export default [
  heatmap,
  airQuality,
  // …
];
```

For a tool, see `tour/index.js`: it builds its UI in `ctx.el` and returns a layer group for the
tour line. For a slot with a backend script and a plugin, see `heatmap/`.

### Slots that exist from the start

The temperature slot allows multiple Reedu, DWD and Open-Meteo datasets to be selected together on
the map; DWD and Open-Meteo are averaged over the Mobile Datalogger's recording window. The other slots begin as
placeholders with sample data:

| Slot | Kind | What goes in |
|---|---|---|
| `heatmap` | base-layer | Reedu temperature cells plus DWD and Open-Meteo points for 2 Sep 2026; choose any combination on the map |
| `humidity` | base-layer | relative humidity from the same bike rides (added later, ready) |
| `air-quality` | base-layer | particulate matter, chosen in the sidebar switcher |
| `points-of-interest` | overlay | a JSON file with location and description per point (city projects included) |
| `birdhouses` | overlay | birdhouse locations with their bird data |
| `weather-stations` | overlay | the stationary senseBox:home sensors with their temperature (added later) |
| `tour` | tool | a fixed walking tour along the points of interest, opened in Google Maps (replaced `routes`) |

## How to add your part

1. **Does it fit an existing slot?** Look at the slot list in `README.md`. If your feature is one of them (or belongs inside one, e.g. more points of interest), fill **that** slot.
2. **If nothing fits, create a new slot:** copy an existing slot folder of the same kind, rename it (kebab-case), change `id`, `title` and `source`, add it to `js/features/index.js` and to the slot list in `README.md`. Don't invent a new pattern.
3. **Data:** put a preparation script in `backend/scripts/<slot>/` (raw input in `backend/data/<slot>/`) and its output in `frontend/data/<slot>/`. Keep each file small (aim for under 1 MB); never load raw sensor data in the browser.
4. **Code:** only inside `frontend/js/features/<slot>/` (and its own CSS file). Texts go in `i18n/en.json` (and `de.json` if you can), under your slot's id.
5. **Set `status: "ready"`** when it works with real data, and update the slot's `README.md` (what it shows, data source, how to regenerate the data).

## Rules

- Don't change `js/core/`, `js/main.js`, `css/base.css` or another person's slot. If you need something from the core (a new option in `ctx`, a new kind), ask your person, who asks the team.
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

*Claude Code users: the `CLAUDE.md` next to this file contains only the line `@AGENT.md`, so Claude Code reads these instructions too.*

*Written by the librarian of Mo's vault (Coppermind-AI, project Tree-Mendous) on 2026-10-28, from the team's decisions of the same day.*
