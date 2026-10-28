# Slot: tour

**Kind:** tool · **Status:** ready

A fixed walking tour along the points of interest. The tools card lists the stops in order and has a
**Start the tour on Google Maps** button; the route is drawn on the map as a dashed line (straight
lines between the stops, Google Maps does the real routing).

It replaces the earlier `routes` slot (pick your own stops), following Eirini's `instructions.md` on
the `eirini` branch.

## Data

- The Google Maps link is fixed in `index.js` (`GOOGLE_MAPS_URL`), exactly as given in
  `instructions.md`: from the Wollhaus past the Robert Mayer Monument, Friedrich-Ebert Bridge,
  Bleichinsel Bridge, BUGA playground, beehive and birdhouse, and back to the Wollhaus, on foot.
- The stop names and the line come from `frontend/data/points-of-interest/poi.json` (`STOPS` lists
  their ids in tour order).

## To change the tour

Change `GOOGLE_MAPS_URL` and `STOPS` together, so the map and Google Maps show the same tour. A
Google Maps link can have at most 9 waypoints between start and end.
