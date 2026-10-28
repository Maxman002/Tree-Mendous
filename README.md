# Tree-Mendous

Tree-Mendous is an interactive map prototype for exploring Heilbronn’s greener future: city projects, environmental context, and ways residents can participate.

## Run locally

This is a static web app with no build step. From the repository root, start a local web server:

```powershell
python -m http.server 8000
```

Then open <http://localhost:8000>. Alternatively, use the Live Server extension in Visual Studio Code.

The map uses Leaflet, OpenStreetMap tiles, and Google Fonts from their public CDNs, so an internet connection is needed to load the map and fonts.

## Datasets ambientales y cuadernos Jupyter

Las páginas de [recursos](https://hackathon.greencity.hn/resources) y [datos senseBox:bike](https://hackathon.greencity.hn/resources/bike-data) distinguen tres fuentes. No deben combinarse solo porque los nombres de algunos archivos se parezcan:

| Fuente | Origen que identifica la documentación | Uso y límites |
| --- | --- | --- |
| **Mobile Datalogger** | El enlace de descarga de la tarjeta Mobile Datalogger lleva a la carpeta Nextcloud `Heat-Island-Summerschool 2026`; el archivo local analizado es [`data/alles.csv`](./data/alles.csv). | Recorridos móviles y análisis por fecha/hora local. En `recording` aparecen nombres `senseBox_bike`, además de campos GPS y velocidad: esto contradice la descripción del logger a pie y deja pendiente confirmar la procedencia con quien publicó los datos. No se debe declarar que es la colección bike de ATRAI sin esa confirmación. |
| **senseBox:bike** | Colección cruda `osem_bike_data` en la [API ATRAI](https://api.atrai.bike/collections), descrita en la [guía de bike-data](https://hackathon.greencity.hn/resources/bike-data). Incluye varias campañas/ciudades; `groupTags` identifica la campaña. | Datos móviles por punto, con temperatura, humedad, PM, velocidad y otros campos. El notebook filtra la etiqueta exacta `heilbronn`, pagina la API y cachea las lecturas de un día. |
| **senseBox:home** | La tarjeta senseBox:home enlaza a `osem_home_data_heilbronn` en la [API ATRAI](https://api.atrai.bike/collections/osem_home_data_heilbronn/items?f=json&limit=1000000). | Estaciones fijas con series por `boxName`. La API contiene más de dos millones de registros y la fecha se filtra localmente tras paginar; inspecciona el nombre y las coordenadas de cada estación. |

Hay un cuaderno independiente para cada fuente:

- [Mobile Datalogger / `alles.csv`](./notebooks/mobile_datalogger_temperature.ipynb): calidad, cobertura, horarios y tabla del 2 de septiembre.
- [senseBox:bike / `osem_bike_data`](./notebooks/sensebox_bike_temperature.ipynb): campaña Heilbronn y resúmenes por hora/sensor para una fecha.
- [senseBox:home / `osem_home_data_heilbronn`](./notebooks/sensebox_home_temperature.ipynb): estaciones fijas y resúmenes por hora/estación para una fecha.

Los tres cuadernos usan inicialmente el 2 de septiembre de 2026 y la franja 10:00–14:00 (fin exclusivo) para facilitar la exploración. El CSV convierte explícitamente UTC a `Europe/Berlin`; las muestras API no incluyen zona horaria en `createdAt`. Por tanto, sus horas todavía no se pueden afirmar como la misma franja CEST: confirma la zona horaria, la identidad del sensor, la ubicación y la calibración antes de comparar temperaturas.

Para ejecutarlos en Windows con Visual Studio Code, selecciona el kernel del entorno local `.venv`. Si faltan dependencias, instálalas en ese entorno existente:

```powershell
.\.venv\Scripts\python -m pip install -r requirements-notebook.txt
```

Abre el cuaderno y ejecuta todas las celdas. Las dependencias y las consultas de API requieren conexión a internet. Los cuadernos API recorren la colección completa la primera vez y guardan el resultado del día elegido en `data/processed/`; las siguientes ejecuciones usan la caché. Los dos CSV fechados actualmente incluidos son snapshots intencionales; otras cachés generadas permanecen ignoradas. Consulta [DATASETS.md](./DATASETS.md) para procedencia, campos y límites de interpretación.

## Prototype data and limitations

- The sample initiatives are based on the city’s `Steckbriefe_10-2026_EN.pdf` project fact sheets; project details are paraphrased.
- Project pins and drawn routes are approximate placeholders, not official geocoded locations.
- The temperature heatmap reads `data/alles.csv`: 61,546 mobile readings from 1–3 September 2026. The CSV's device provenance is not yet resolved because its `recording` filenames say `senseBox_bike`, while the linked resource identifies the download as Mobile Datalogger data. The map averages readings into roughly 25 m grid cells and interpolates between sampled routes. The blue-to-red scale is relative to the CSV’s measured temperature range; it does not represent citywide coverage or an official city dataset.
- The traffic/noise overlay is a conceptual illustration, not measured data.
- An “Add your idea” pin exists only in the current browser session. The prototype does not submit or store citizen contributions.
- Participation options are summaries of the fact sheets; check official city channels for current details.

The research notes in [Steckbriefe_Notes.md](./Steckbriefe_Notes.md) list data still needed for a production version, including verified coordinates, district boundaries, and measured heat/noise data.

## Next steps for a production map

Connect verified city datasets and project locations, identify licensing and update responsibilities, and add a real participation workflow before presenting the environmental layers or citizen ideas as authoritative.
