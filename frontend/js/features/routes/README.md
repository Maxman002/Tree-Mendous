# Slot: routes

**Kind:** tool · **Status:** placeholder

A card in the "Tools" section of the sidebar. The user picks points of interest one after the
other; the route appears on the map as a dashed line with numbered stops, and "Open in Google
Maps" opens walking directions for the same stops in a new tab. No API key is needed.

## How it works now

- The stop list comes from `frontend/data/points-of-interest/poi.json` (the same file as the
  `points-of-interest` slot), so new points there become route stops automatically.
- The line on the map is straight from stop to stop; Google Maps does the real routing.
- **Limit:** Google Maps URLs allow at most 9 waypoints between start and destination (only 3 in
  mobile browsers), see https://developers.google.com/maps/documentation/urls/get-started
  (checked 2026-10-28). The tool therefore allows at most 11 stops and shows a message when the
  user tries to add more.
- `googleMapsUrl(stops, travelmode)` is exported, so the URL format can be tested on its own.
  Example output:
  `https://www.google.com/maps/dir/?api=1&origin=49.142452%2C9.218943&destination=49.147158%2C9.211756&travelmode=walking`

## Ideas / to do

- Ready-made routes ("from hot spot to oasis", a cycling-ring tour) as a data file in
  `frontend/data/routes/`.
- Pick stops by clicking markers on the map, reorder stops, choose walking or cycling.
- Draw the real path (e.g. with an OSRM or openrouteservice request prepared offline).
