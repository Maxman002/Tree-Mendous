# Tree-Mendous – Project Overview

*Status as of 27 October 2026*

## 1. What this is

**Tree-Mendous** is our team's project for the **Green City Hackathon in Heilbronn**. Heilbronn will be **European Green Capital 2027** (branded "heilbronn.now"), and the city is running 37 projects and events during the title year.

**Our idea:** an interactive website/app built around a map of Heilbronn. Residents and tourists can use it to:

1. **See the current state of the city**, with environmental data layers such as heat, noise and (later) air quality or green cover.
2. **Find the Green Capital projects and events** easily: what is happening, where, when, and why it matters.
3. **Connect problem and solution**, for example by showing that a heat hotspot is exactly where the city is unsealing and planting trees.

## 2. Current state of the folder

| File | What it is | Git status |
|---|---|---|
| `README.md` | Short project description plus a few test lines ("what's happening", "HELOOOO") | tracked |
| `.gitignore` | Standard Python template (so the plan so far seems to be a Python backend/tooling) | tracked |
| `Steckbriefe_10-2026.pdf` | Official city document (Oct 2026, 39 pages, German): fact sheets for all 37 Green Capital 2027 projects | **untracked** |
| `Steckbriefe_10-2026_EN.pdf` | English translation of the fact sheets, same layout and images | **untracked** |
| `Steckbriefe_Notes.md` | Our notes on the fact sheets: which projects suit the map, dates and places, ideas, projects sorted by topic | **untracked** |
| `PROJECT_OVERVIEW.md` | This file | **untracked** |
| `.DS_Store` | macOS system file, should go into `.gitignore` | untracked |

**Git:** the repo is `github.com/Maxman002/Tree-Mendous`, branch `main`, with 4 commits ("Initial commit", "hello", "Test", "Test"). **There is no app code yet.** The project is still in the research and concept phase.

## 3. What we know so far (from the fact sheets)

The full details are in `Steckbriefe_Notes.md`. The short version:

- **37 projects**, each with a title, description, duration, planned period in 2027, budget and the responsible city office. This maps almost one-to-one onto a JSON data model.
- **No coordinates are in the PDF**, only place names (Marktplatz, Friedrich-Ebert-Brücke, Hagenbuchersee, Wollhaus, Turmstraße, ...). We have to geocode them.
- **Heat and noise are already the city's own arguments:**
  - Heat: sheets 01 (market square oasis), 02 (mobile greenery at "heat hotspots"), 03 (Bleichinsel Bridge), 09 (Turmstraße) and 37 (10 m² unsealing in every district). The city calls Heilbronn a nationwide heat hotspot.
  - Noise and emissions: sheet 04 (cycling ring) and sheet 05 (closing the Friedrich-Ebert Bridge to cars for 1–3 months, with car traffic on Gerberstraße expected to roughly halve).
- **Strong map candidates:** 01, 02, 03, 04, 05, 07, 08, 09, 31, 32 and 37, plus about 12 events with a fixed venue and date (water show, light festival, Neckar Nature Games, opening on 15 Jan 2027, award ceremony 5–8 Oct 2027, ...).
- **Pitch hook:** the city's own exhibition (sheet 32) plans a "Map of Actions" station. Our app can be presented as the digital, city-wide version of it.
- **Possible partners or data sources named in the PDF:** the central events calendar (sheet 29), BildungsNetz Heilbronn (sheet 20), heilbronn.now (volunteering, sheet 27), Green Badge businesses (sheet 36).

## 4. Goal

> **A working, demo-ready web map of Heilbronn that shows environmental data layers (at least heat and noise) together with all Green Capital 2027 projects and events, filterable by topic and time, that works on a phone and can be pitched at the hackathon.**

### Minimum viable product (must have for the pitch)
- Map of Heilbronn (pan/zoom, works on mobile)
- **Project layer**: all map-able Green Capital projects as markers, with a detail card (title, description, dates, budget, image)
- **At least one data layer** (heat first), switchable on and off
- **Filters** by topic (greening, mobility, nature, energy, culture, ...) and by time ("happening now" / month)
- English and German

### Nice to have
- Noise layer and a before/after view for the Friedrich-Ebert Bridge trial
- Routes: cycling ring, light-festival route, vineyard trail, Neckar Nature Games stretch
- "How can I help?" section (tree sponsorships, Citizens' Budget, volunteering)
- Green Badge businesses on the map
- Tourist mode: "what's on near me today"

## 5. Steps to get there

### Phase 0 – Set up the team and repo (½ day)
- [ ] Agree on the MVP scope above and split the roles (data, frontend, design/pitch)
- [ ] Clean up the repo: tidy the README, add `.DS_Store` to `.gitignore`, decide whether the PDFs belong in the repo (the 14–17 MB files may be better in a `docs/` folder or kept out)
- [ ] Choose the tech stack. A suggestion:
  - Frontend: **React + Vite** (or plain HTML/JS) with **Leaflet** or **MapLibre GL**, and OpenStreetMap tiles
  - Data: static **GeoJSON/JSON** files in the repo (no backend needed for the MVP)
  - Optional Python scripts (matches the `.gitignore`) for data preparation and geocoding
  - Hosting: GitHub Pages / Vercel / Netlify

### Phase 1 – Project data (1 day)
- [ ] Turn the 37 fact sheets into `data/projects.json` (fields: id, title_de, title_en, summary, topic[], location name, start/end date, budget, office, image)
- [ ] Geocode every location (Nominatim/OSM, or set the points by hand in geojson.io). Use lines for routes and several points for "Mobile Greenery"
- [ ] Mark which projects are city-wide and have no point (these go into a list view, not onto the map)
- [ ] Check image rights before reusing photos from the PDF (credits: City of Heilbronn, HMG, Freepik, AdobeStock, ...)

### Phase 2 – Environmental data (1–2 days, start in parallel with phase 1)
- [ ] **Heat:** look for open data such as LUBW (Baden-Württemberg State Institute for the Environment) climate analyses, the city's urban climate analysis, Copernicus / Landsat land-surface temperature, or DWD data. Ask the hackathon organisers for provided datasets
- [ ] **Noise:** EU Environmental Noise Directive noise maps for Baden-Württemberg (LUBW Lärmkartierung, published as WMS/WFS)
- [ ] Optional: air quality (UBA / LUBW stations), tree register, green spaces from OSM
- [ ] Convert everything to web-friendly formats (GeoJSON, raster tiles or WMS) cut to the Heilbronn area

### Phase 3 – Build the app (2–3 days)
- [ ] Basic map centred on Heilbronn, mobile-first layout
- [ ] Project markers with topic icons/colours and detail cards
- [ ] Layer switcher for heat and noise, with a legend
- [ ] Topic and time filters, plus a list/search view
- [ ] Language switch DE/EN

### Phase 4 – Polish and pitch (1 day)
- [ ] Highlight 2–3 "stories" (e.g. *market square: hot spot → wellbeing oasis*, *Friedrich-Ebert Bridge: noise before and during the trial*)
- [ ] Deploy and test on phones
- [ ] Pitch deck: problem → idea → live demo → how the city could use it (link to sheet 32 "Map of Actions" and sheet 29's events calendar) → next steps
- [ ] Update the README with a description, screenshots, a link to the live demo and how to run it locally

## 6. Open questions
- When is the hackathon, and how much time do we have? (This sets how much of phases 2–4 is realistic.)
- Do the organisers provide official datasets or APIs (heat, noise, project locations)?
- Who is on the team and who takes which role?
- Is the target a website, an installable app (PWA), or both?
- Can we use the images from the fact sheets, or do we need our own or open ones?
