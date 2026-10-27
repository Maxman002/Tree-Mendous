# Tree-Mendous

Tree-Mendous is an interactive map prototype for exploring Heilbronn’s greener future: city projects, environmental context, and ways residents can participate.

## Run locally

This is a static web app with no build step. From the repository root, start a local web server:

```powershell
python -m http.server 8000
```

Then open <http://localhost:8000>. Alternatively, use the Live Server extension in Visual Studio Code.

The map uses Leaflet, OpenStreetMap tiles, and Google Fonts from their public CDNs, so an internet connection is needed to load the map and fonts.

## Prototype data and limitations

- The sample initiatives are based on the city’s `Steckbriefe_10-2026_EN.pdf` project fact sheets; project details are paraphrased.
- Project pins and drawn routes are approximate placeholders, not official geocoded locations.
- The temperature heatmap reads `data/alles.csv`: 61,546 mobile bike-sensor readings from 1–3 September 2026. It averages readings into roughly 25 m grid cells and interpolates between sampled routes. The blue-to-red scale is relative to the CSV’s measured temperature range; it does not represent citywide coverage or an official city dataset.
- The traffic/noise overlay is a conceptual illustration, not measured data.
- An “Add your idea” pin exists only in the current browser session. The prototype does not submit or store citizen contributions.
- Participation options are summaries of the fact sheets; check official city channels for current details.

The research notes in [Steckbriefe_Notes.md](./Steckbriefe_Notes.md) list data still needed for a production version, including verified coordinates, district boundaries, and measured heat/noise data.

## Next steps for a production map

Connect verified city datasets and project locations, identify licensing and update responsibilities, and add a real participation workflow before presenting the environmental layers or citizen ideas as authoritative.
