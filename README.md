# Tree-Mendous

This repository holds the Tree-Mendous team's project for the Green City Hackathon Heilbronn
("Data for the Heilbronn of Tomorrow", 27–29 October 2026).
Hackathon website: https://hackathon.greencity.hn

**Tree-Mendous** is an interactive map of Heilbronn for residents and tourists. It shows environmental
data (heat, humidity, air quality) as the *problem* and the city's European Green Capital 2027 projects as the
*solution*, in the same place. The pitch story is "from hot spot to oasis": the measured heat on the
Marktplatz next to the wellbeing oasis the city is planning there.

Working on a feature? Read [`AGENT.md`](AGENT.md) first: it explains how to fill a slot.

## Run the website locally

No build step, no installation. You need Python 3 (only for its built-in web server) and a desktop
browser.

```sh
cd frontend
python3 -m http.server 8000
```

Then open http://localhost:8000. Opening `index.html` directly from the file system does not work,
because browsers block ES modules and `fetch()` on `file://` pages.

Leaflet 1.9.4, Leaflet.heat, OpenStreetMap tiles and Google Fonts come from public CDNs, so the page
needs internet access.

## Slots

The website is a **foundation with one slot per feature**. Each slot is a folder in
`frontend/js/features/<slot>/` with an `index.js` and a `README.md`. The core adds each slot's layer,
legend and texts automatically.

| Slot | Kind | Status | What it does now |
|---|---|---|---|
| [`heatmap`](frontend/js/features/heatmap/README.md) | base layer | ready | Bike-sensor temperatures (1–3 Sep 2026, 61,546 readings), averaged into 25 m cells; click for the cell's temperature |
| [`humidity`](frontend/js/features/humidity/README.md) | base layer | ready | Relative humidity from the same bike rides (1–3 Sep 2026, 61,543 readings) in 25 m cells; click for the cell's humidity |
| [`air-quality`](frontend/js/features/air-quality/README.md) | base layer | ready | PM2.5 on 2 Sep 2026: 6,175 senseBox:bike readings in 50 m cells plus four senseBox:home sensors, WHO-based colours |
| [`points-of-interest`](frontend/js/features/points-of-interest/README.md) | overlay | ready | Eirini's seven points (smart sensors, a park, Green Capital 2027 projects) with a detail card; the birdhouse opens the bird dashboard |
| [`weather-stations`](frontend/js/features/weather-stations/README.md) | overlay | ready | The five senseBox:home stations with their mean temperature on 2 Sep 2026; card with min/max, humidity, PM2.5 and an hourly chart |
| [`birdhouses`](frontend/js/features/birdhouses/README.md) | overlay | ready | The bird feeder at the 42 campus (Birdiary); card with its top birds and a full-screen bird dashboard (ring chart, photos, 30 days / since April) |
| [`tour`](frontend/js/features/tour/README.md) | tool | ready | A fixed walking tour from the Wollhaus past every point and back, with a "Start the tour on Google Maps" button; the line is drawn while "Projects and places" is on |

Base layers are shown one at a time (radio buttons); overlays can be combined (checkboxes); tools get
a card in the sidebar. The language switch (EN/DE) changes every text; German falls back to English
where a text is missing.

## Data

Data is prepared **offline** by Python scripts in `backend/scripts/<slot>/`, which write small static
files (aim for under 1 MB per layer) into `frontend/data/<slot>/`. The browser never loads raw sensor
data.

### Regenerate the data

```sh
python3 -m venv .tree-mendous
source .tree-mendous/bin/activate      # Windows: .tree-mendous\Scripts\activate
pip install -r backend/requirements.txt

python3 backend/scripts/heatmap/prepare_heatmap.py
python3 backend/scripts/humidity/prepare_humidity.py
python3 backend/scripts/air-quality/prepare_air_quality.py
python3 backend/scripts/weather-stations/prepare_weather_stations.py
python3 backend/scripts/birdhouses/prepare_birdhouses.py   # needs internet
```

| Script | Input | Output |
|---|---|---|
| `backend/scripts/heatmap/prepare_heatmap.py` | `backend/data/heatmap/alles.csv` (raw bike readings) | `frontend/data/heatmap/temperature-cells.json` (about 20 KB) |
| `backend/scripts/humidity/prepare_humidity.py` | `backend/data/heatmap/alles.csv` (its `humidity` column) | `frontend/data/humidity/humidity-cells.json` (about 20 KB) |
| `backend/scripts/air-quality/prepare_air_quality.py` | `backend/data/air-quality/osem_bike_data_heilbronn_2026-09-02.csv` and the senseBox:home snapshot below | `frontend/data/air-quality/pm.json` (about 30 KB) |
| `backend/scripts/weather-stations/prepare_weather_stations.py` | `backend/data/weather-stations/osem_home_data_heilbronn_2026-09-02.csv` | `frontend/data/weather-stations/stations.json` (about 4 KB) |
| `backend/scripts/birdhouses/prepare_birdhouses.py` | Birdiary API + `backend/data/birdhouses/species.json` (stations, species whitelist, AI fixes) | `frontend/data/birdhouses/birdhouses.json`, `species.json` (a few KB) |

`points-of-interest` and `tour` read the hand-written `frontend/data/points-of-interest/poi.json`.

### Datasets

The two ATRAI snapshots of 2 Sep 2026 come from `vibin-branch` (`data/processed/`); its `DATASETS.md`
explains them in detail, with notebooks. In short:

- **senseBox:bike** (`osem_bike_data`, tag `heilbronn`): 13,275 mobile readings from six bikes;
  PM2.5/PM10 on 6,175 of them. → `air-quality`
- **senseBox:home** (`osem_home_data_heilbronn`): 8,781 readings from five stationary sensors
  (temperature, humidity, PM). Two of them are outside Heilbronn (Beilstein, about 13 km;
  Wolf-von-Gemmingen-Schule, about 17 km), and three only recorded part of the day.
  → `weather-stations`, `air-quality`
- The `createdAt` times of both have no time zone; they are shown as recorded.
- **Mobile Datalogger** (`alles.csv`, 1–3 Sep 2026): its provenance (walking logger or bike) is
  still open, see `DATASETS.md`. → `heatmap`, `humidity`
- **Smart birdhouses** (Birdiary) and the **beehive** (Grafana link in the points of interest).
  → `birdhouses`, `points-of-interest`
- **Green Capital 2027 projects**: the city's fact sheets `resources/Steckbriefe_10-2026.pdf` (German)
  and `resources/Steckbriefe_10-2026_EN.pdf`, with our notes in `resources/Steckbriefe_Notes.md`. → `points-of-interest`
- Not used yet: senseBox:bike particulate-matter danger zones,
  `https://api.atrai.bike/collections/danger_zones_PM_heilbronn/items?f=json&limit=0`, and the live
  UBA (Umweltbundesamt) air-quality stations of the `humidity` branch, which need a small proxy server.

## Project structure

```
backend/      Python data preparation (scripts and raw data), no server
frontend/     the static website (index.html, css/, js/core/, js/features/, data/, i18n/)
AGENT.md      how to add a feature (for team members and their coding agents)
resources/    the city's fact sheets (PDF), notes and the project overview
```

The full file tree is in [`AGENT.md`](AGENT.md#how-it-is-built).

## General project idea

Create a website / application that guides users through the city of Heilbronn. The focus is on
spots where the city has carried out projects or initiatives in the past or plans to do so, to make
Heilbronn greener and more nature friendly as the European Green Capital 2027. The purpose is to
educate users on these initiatives: what their purpose is, what problem they solve and what they
improve. To show what each initiative improves, data can show what was or is problematic before
(like the heat map or the streets where biking is unsafe).

Target audience:

- citizens of Heilbronn who want to inform themselves
- tourists who want to see the European Green Capital of 2027

### Features

#### Must

- Map with points of interest
  - Can click on them to get information about the initiative
  - Problems it solves
  - Purpose
  - Who does it help
- Sightseeing routes which connect certain points of interest
  - pre-created area-based routes (to visit all points of interest in a certain area)
  - pre-created topic-based routes (visit points of interest connected by a certain topic)
  - route can then be exported to Google Maps for navigation
- Before/after view
  - before: graphical data showing the problem which the initiative tries to address and solve
  - after: if data is available, a graphical view with the changes achieved by the initiative

#### Should

- Heat map and traffic map for navigation

#### Can

## TODOs

- access data and make it useful for us
  - heatmap of hotspots in the city
    - compare different areas depending on the heat
  - bike data: where is it unsafe to drive
  - (Air quality)
  - How does the current data impact the decisions of what the city wants to change through its initiatives
- see if the beehive data is useful?
- is the birds data useful?
- ~~create a prototype of the actual project~~ (foundation with slots is in place)
- backend: stores statically processed data to create visualisations on a map (heatmap, ...)
- frontend: website to interact with
- the view which is relevant shows up when clicking on a specific point of interest
