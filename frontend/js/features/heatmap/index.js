// Each heatmap source keeps its own ramp; weather sources use distinct point colours.
const CLICK_RADIUS_METERS = 40;
const CLICK_RADIUS_PIXELS = 30;
const CELL_SIZE_METERS = 25;
const WEATHER_WINDOW_START = Date.parse("2026-09-02T10:29:08.999+02:00");
const WEATHER_WINDOW_END = Date.parse("2026-09-02T13:07:39.661+02:00");
const HEILBRONN = [49.1427, 9.2185];

const SOURCES = [
  {
    id: "senseboxBike",
    type: "cells",
    title: { en: "senseBox:bike", de: "senseBox:bike" },
    gradient: ["#377eb8", "#65b5c5", "#f2df65", "#f28e45", "#d73027"],
    source: {
      en: "ATRAI bike campaign · Heilbronn · 2 Sep 2026",
      de: "ATRAI-Fahrradkampagne · Heilbronn · 2. Sep. 2026"
    },
    dataPath: "heatmap/reedu/sensebox-bike-cells.csv"
  },
  {
    id: "mobileDatalogger",
    type: "cells",
    title: { en: "Mobile Datalogger", de: "Mobiler Datenlogger" },
    gradient: ["#313695", "#74add1", "#e0f3f8", "#f46d43", "#a50026"],
    source: {
      en: "Reedu Mobile Datalogger resource · recording values say senseBox_bike",
      de: "Reedu-Ressource Mobiler Datenlogger · Aufzeichnungswerte nennen senseBox_bike"
    },
    dataPath: "heatmap/reedu/mobile-datalogger-cells.csv"
  },
  {
    id: "senseboxHome",
    type: "cells",
    title: { en: "senseBox:home", de: "senseBox:home" },
    gradient: ["#2b83ba", "#abdda4", "#ffffbf", "#fdae61", "#d7191c"],
    source: {
      en: "ATRAI stationary sensors · Heilbronn collection · 2 Sep 2026",
      de: "ATRAI-Feststationen · Heilbronn-Sammlung · 2. Sep. 2026"
    },
    dataPath: "heatmap/reedu/sensebox-home-cells.csv"
  },
  {
    id: "dwd",
    type: "weather-point",
    title: { en: "DWD", de: "DWD" },
    markerColor: "#2166ac",
    source: {
      en: "DWD station 03734 Obersulm-Willsbach",
      de: "DWD-Station 03734 Obersulm-Willsbach"
    },
    dataPath: "heatmap/dwd/temperature.csv"
  },
  {
    id: "openMeteo",
    type: "weather-point",
    title: { en: "Open-Meteo", de: "Open-Meteo" },
    markerColor: "#d97706",
    source: {
      en: "Open-Meteo ERA5-Land reanalysis · Heilbronn grid cell",
      de: "Open-Meteo ERA5-Land-Reanalyse · Heilbronner Rasterzelle"
    },
    dataPath: "heatmap/open-meteo/temperature.csv"
  }
];
const DEFAULT_SOURCE_ID = "mobileDatalogger";

function parseCsv(text, dataPath) {
  const rows = text.trim().split(/\r?\n/);
  const header = rows.shift()?.split(",");
  if (!header || rows.length === 0) throw new Error(`Heat-map CSV ${dataPath} is empty.`);
  return rows.filter((row) => row.trim()).map((row) => {
    const values = row.split(",");
    return Object.fromEntries(header.map((name, index) => [name, values[index] ?? ""]));
  });
}

function parseCells(text, dataPath) {
  const rows = parseCsv(text, dataPath);
  const header = Object.keys(rows[0] ?? {});
  const latitudeColumn = header?.indexOf("latitude") ?? -1;
  const longitudeColumn = header?.indexOf("longitude") ?? -1;
  const temperatureColumn = header?.indexOf("temperature") ?? -1;
  const countColumn = header?.indexOf("count") ?? -1;
  if ([latitudeColumn, longitudeColumn, temperatureColumn, countColumn].some((index) => index < 0)) {
    throw new Error(`Heat-map CSV ${dataPath} must contain latitude, longitude, temperature and count columns.`);
  }

  const cells = [];
  let minTemperature = Infinity;
  let maxTemperature = -Infinity;
  rows.forEach((row) => {
    const latitude = Number(row.latitude);
    const longitude = Number(row.longitude);
    const temperature = Number(row.temperature);
    const count = Number(row.count);
    if (
      !Number.isFinite(latitude) || latitude < -90 || latitude > 90
      || !Number.isFinite(longitude) || longitude < -180 || longitude > 180
      || !Number.isFinite(temperature)
      || !Number.isInteger(count) || count < 1
    ) return;

    cells.push({ latitude, longitude, temperature, count });
    minTemperature = Math.min(minTemperature, temperature);
    maxTemperature = Math.max(maxTemperature, temperature);
  });
  if (!cells.length) {
    throw new Error(`Heat-map CSV ${dataPath} contains no valid cells.`);
  }

  return { cells, minTemperature, maxTemperature };
}

function parseHourly(text, dataPath) {
  const rows = parseCsv(text, dataPath);
  const required = ["timestamp", "latitude", "longitude", "temperature_c"];
  if (!rows.length || required.some((column) => !(column in rows[0]))) {
    throw new Error(`Hourly heat-map CSV ${dataPath} must contain ${required.join(", ")}.`);
  }
  const cells = rows.flatMap((row) => {
    const latitude = Number(row.latitude);
    const longitude = Number(row.longitude);
    const temperature = Number(row.temperature_c);
    const timestamp = Date.parse(row.timestamp);
    if (
      !Number.isFinite(latitude) || latitude < -90 || latitude > 90
      || !Number.isFinite(longitude) || longitude < -180 || longitude > 180
      || !Number.isFinite(temperature)
      || !Number.isFinite(timestamp)
      || timestamp < WEATHER_WINDOW_START
      || timestamp > WEATHER_WINDOW_END
    ) return [];
    return [{
      timestamp: row.timestamp,
      timestampValue: timestamp,
      latitude,
      longitude,
      temperature,
      humidity: row.relative_humidity_pct === "" ? null : Number(row.relative_humidity_pct),
      measurementType: row.measurement_type,
      sourceId: row.source_id
    }];
  });
  if (!cells.length) {
    throw new Error(`Weather-point CSV ${dataPath} has no readings in the 10:29–13:07 local-time window.`);
  }
  cells.sort((first, second) => first.timestampValue - second.timestampValue);
  const first = cells[0];
  if (cells.some((cell) => cell.latitude !== first.latitude || cell.longitude !== first.longitude)) {
    throw new Error(`Weather-point CSV ${dataPath} must contain readings from one location.`);
  }
  const humidityReadings = cells
    .map((cell) => cell.humidity)
    .filter((humidity) => Number.isFinite(humidity));
  const average = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const temperature = average(cells.map((cell) => cell.temperature));
  return {
    cells: [{
      timestamp: first.timestamp,
      endTimestamp: cells[cells.length - 1].timestamp,
      latitude: first.latitude,
      longitude: first.longitude,
      temperature,
      humidity: humidityReadings.length ? average(humidityReadings) : null,
      count: cells.length,
      measurementType: first.measurementType,
      sourceId: first.sourceId
    }]
  };
}

function heatLayer(L, source, cells) {
  if (!cells.length) return null;
  const range = source.data.maxTemperature - source.data.minTemperature;
  const points = cells.map((cell) => [
    cell.latitude,
    cell.longitude,
    range ? (cell.temperature - source.data.minTemperature) / range : 0.5
  ]);
  return L.heatLayer(points, {
    radius: 18,
    blur: 22,
    maxZoom: 17,
    minOpacity: 0.3,
    gradient: Object.fromEntries(source.gradient.map((color, index, colors) => [
      Number((0.2 + (0.8 * index) / (colors.length - 1)).toFixed(2)),
      color
    ]))
  });
}

function weatherMarker(L, source, cell, title) {
  const marker = L.circleMarker([cell.latitude, cell.longitude], {
    radius: 9,
    color: "#fff",
    weight: 3,
    opacity: 1,
    fillColor: source.markerColor,
    fillOpacity: 1
  });
  marker.bindTooltip(
    `${title} · ${cell.temperature.toFixed(1)} °C`,
    { permanent: true, direction: "top", offset: [0, -7], className: "heatmap-point-label" }
  );
  return marker;
}

const temperatureSlot = {
  id: "heatmap",
  kind: "base-layer",
  title: { en: "Urban temperature", de: "Temperatur in der Stadt" },
  status: "ready",
  source: {
    en: "Choose any combination of Reedu, DWD and Open-Meteo data on the map",
    de: "Beliebige Kombination aus Reedu-, DWD- und Open-Meteo-Daten auf der Karte auswählen"
  },
  icon: "◉",
  style: "style.css",
  visible: true,
  legend: [],

  async init(ctx) {
    const { L, map } = ctx;
    await ctx.loadScript("https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js");
    const preparedSources = await Promise.all(SOURCES.map(async (source) => {
      const text = await ctx.loadData(source.dataPath);
      return {
        ...source,
        data: source.type === "weather-point"
          ? parseHourly(text, source.dataPath)
          : parseCells(text, source.dataPath)
      };
    }));

    const stage = map.getContainer().parentElement;
    const control = stage?.querySelector("#temperature-source-control");
    const sourceInputs = control?.querySelectorAll("[data-temperature-source]");
    if (!control || !sourceInputs?.length) {
      throw new Error("The temperature-source map control is missing from the map layout.");
    }

    const selectedIds = new Set([DEFAULT_SOURCE_ID]);
    sourceInputs.forEach((input) => {
      input.checked = selectedIds.has(input.dataset.temperatureSource);
    });
    L.DomEvent.disableClickPropagation(control);
    L.DomEvent.disableScrollPropagation(control);

    const layer = L.layerGroup();
    function drawLegend() {
      ctx.setLegend(preparedSources.filter((source) => selectedIds.has(source.id))
        .map((source) => source.type === "weather-point"
          ? {
            color: source.markerColor,
            label: {
              en: `${source.title.en} · ${source.data.cells[0].temperature.toFixed(1)} °C average`,
              de: `${source.title.de} · ${source.data.cells[0].temperature.toFixed(1)} °C Mittelwert`
            }
          }
          : {
            gradient: source.gradient,
            from: `${ctx.pick(source.title)} · ${source.data.minTemperature.toFixed(1)} °C`,
            to: `${source.data.maxTemperature.toFixed(1)} °C`
          }));
    }

    function renderSelectedLayers() {
      layer.clearLayers();
      let renderedHeatmap = false;
      preparedSources.forEach((source) => {
        if (!selectedIds.has(source.id)) return;
        if (source.type === "weather-point") {
          source.data.cells.forEach((cell) => {
            layer.addLayer(weatherMarker(L, source, cell, ctx.pick(source.title)));
          });
        } else {
          const heatmap = heatLayer(L, source, source.data.cells);
          if (heatmap) {
            layer.addLayer(heatmap);
            renderedHeatmap = true;
          }
        }
      });
      drawLegend();
      map.getContainer().classList.toggle(
        "heatmap-active",
        map.hasLayer(layer) && renderedHeatmap
      );
      ctx.panel.close();
    }

    sourceInputs.forEach((input) => input.addEventListener("change", () => {
      const source = preparedSources.find((entry) => entry.id === input.dataset.temperatureSource);
      if (!source) throw new Error(`Unknown temperature source: ${input.dataset.temperatureSource}`);
      if (input.checked) selectedIds.add(source.id);
      else selectedIds.delete(source.id);
      if (source.id === "dwd" && input.checked) {
        const station = source.data.cells[0];
        if (station && !map.getBounds().contains([station.latitude, station.longitude])) {
          map.fitBounds([
            HEILBRONN,
            [station.latitude, station.longitude]
          ], { padding: [40, 40], maxZoom: 12 });
        }
      }
      renderSelectedLayers();
    }));
    ctx.onLanguageChange(drawLegend);
    renderSelectedLayers();

    function showNearestCell(event) {
      const nearestBySource = [];
      const maxDistance = Math.max(
        CLICK_RADIUS_METERS,
        CLICK_RADIUS_PIXELS * 40_075_016
          * Math.cos(event.latlng.lat * Math.PI / 180)
          / 2 ** (map.getZoom() + 8)
      );
      for (const source of preparedSources) {
        if (!selectedIds.has(source.id)) continue;
        let nearestCell = null;
        let nearestDistance = Infinity;
        for (const cell of source.data.cells) {
          const distance = event.latlng.distanceTo([cell.latitude, cell.longitude]);
          if (distance < nearestDistance) {
            nearestCell = cell;
            nearestDistance = distance;
          }
        }
        if (nearestCell && nearestDistance <= maxDistance) {
          nearestBySource.push({ source, cell: nearestCell });
        }
      }

      if (!nearestBySource.length) {
        ctx.panel.close();
        return;
      }

      const readings = nearestBySource.map(({ source, cell }) => {
        const detail = source.type === "weather-point"
          ? `<p>${ctx.escapeHtml(ctx.t(`sources.${source.id}.reading`, {
            count: cell.count,
            from: cell.timestamp.slice(11, 16),
            to: cell.endTimestamp.slice(11, 16)
          }))}</p>`
            + (cell.humidity === null || !Number.isFinite(cell.humidity)
              ? ""
              : `<p>${ctx.escapeHtml(ctx.t(`sources.${source.id}.humidity`, {
                humidity: cell.humidity.toFixed(1)
              }))}</p>`)
            + `<p>${ctx.escapeHtml(ctx.pick(source.source))}</p>`
          : `<p>${ctx.escapeHtml(ctx.t(`sources.${source.id}.cell`, {
            count: cell.count,
            size: CELL_SIZE_METERS
          }))}</p>`
            + `<p>${ctx.escapeHtml(ctx.pick(source.source))}</p>`
            + `<p>${ctx.escapeHtml(ctx.t(`sources.${source.id}.range`, {
              min: source.data.minTemperature.toFixed(1),
              max: source.data.maxTemperature.toFixed(1)
            }))}</p>`;
        return `<div class="heatmap-reading"><strong>${ctx.escapeHtml(ctx.pick(source.title))} · `
          + `${cell.temperature.toFixed(1)} °C</strong>${detail}</div>`;
      });
      ctx.panel.show(() => ({
        kicker: ctx.t("panel.kicker"),
        title: nearestBySource.length === 1
          ? `${nearestBySource[0].cell.temperature.toFixed(1)} °C`
          : ctx.t("panel.sourcesCount", { count: nearestBySource.length }),
        html: readings.join("")
      }));
    }

    layer.on("add", () => {
      control.hidden = false;
      map.on("click", showNearestCell);
      renderSelectedLayers();
    });
    layer.on("remove", () => {
      control.hidden = true;
      map.getContainer().classList.remove("heatmap-active");
      map.off("click", showNearestCell);
      ctx.panel.close();
      ctx.setLegend([]);
    });

    return layer;
  }
};

export default temperatureSlot;
