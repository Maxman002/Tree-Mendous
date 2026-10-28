# Tree-Mendous — Heilbronn

Interactive Leaflet map prototype for greener places, climate projects, urban temperature and measured air quality.

## Run locally

Requirements: Node.js 18 or newer. No npm dependencies or API key are required.

```bash
node server.js
```

Open <http://localhost:8000>. Use the Air quality toggle to load nearby monitoring stations from the German Environment Agency (Umweltbundesamt, UBA). The local server proxies UBA requests to avoid browser cross-origin restrictions.

## Air-quality layer

- Fetches UBA station metadata and keeps active stations within 40 km of Heilbronn.
- Requests hourly UBA air-quality data for up to the eight nearest stations and displays the latest returned overall index.
- Click a numbered marker for the station name, index, timestamp, and data attribution.
- Coverage depends on available stations and the UBA's latest published data. A missing marker does not mean air quality is good; it can mean no recent index was returned.
- Attribution: “Umweltbundesamt mit Daten der Messnetze der Länder und des Bundes” (German Environment Agency with data from the monitoring networks of the states and the federal government).
- API documentation: <https://luftdaten.umweltbundesamt.de/api/air-data/v4/doc>

## Temperature layer

The temperature layer expects `data/alles.csv` with `latitude`, `longitude`, and `temperature` columns. That source CSV was not included in the files available for this update; add it to enable the temperature heatmap.

## Notes

The traffic/noise layer is illustrative, not a live measurement. Project locations are approximate. User-submitted idea pins are only kept in the current browser session and are not sent to a server.
