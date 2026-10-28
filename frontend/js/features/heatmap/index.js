// Each source keeps its own colour ramp so simultaneous layers remain identifiable.
const CLICK_RADIUS_METERS = 40;
const CLICK_RADIUS_PIXELS = 30;
const CELL_SIZE_METERS = 25;
const DEFAULT_HOUR = 14;
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
    type: "hourly",
    title: { en: "DWD", de: "DWD" },
    gradient: ["#2166ac", "#8073ac", "#f7f7f7", "#f1a340", "#b2182b"],
    source: {
      en: "DWD station 03734 Obersulm-Willsbach",
      de: "DWD-Station 03734 Obersulm-Willsbach"
    },
    dataPath: "heatmap/dwd/temperature.csv"
  },
  {
    id: "openMeteo",
    type: "hourly",
    title: { en: "Open-Meteo", de: "Open-Meteo" },
    gradient: ["#4575b4", "#91bfdb", "#ffffbf", "#fc8d59", "#d73027"],
    source: {
      en: "Open-Meteo ERA5-Land hourly reanalysis · Heilbronn grid cell",
      de: "Open-Meteo ERA5-Land-Stunden-Reanalyse · Heilbronner Rasterzelle"
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
    const hour = Number(row.timestamp.slice(11, 13));
    if (
      !Number.isFinite(latitude) || latitude < -90 || latitude > 90
      || !Number.isFinite(longitude) || longitude < -180 || longitude > 180
      || !Number.isFinite(temperature) || !Number.isInteger(hour) || hour < 0 || hour > 23
    ) return [];
    return [{
      timestamp: row.timestamp,
      hour,
      latitude,
      longitude,
      temperature,
      humidity: row.relative_humidity_pct === "" ? null : Number(row.relative_humidity_pct),
      measurementType: row.measurement_type,
      sourceId: row.source_id
    }];
  });
  if (!cells.length) throw new Error(`Hourly heat-map CSV ${dataPath} contains no valid rows.`);
  return {
    cells,
    minTemperature: Math.min(...cells.map((cell) => cell.temperature)),
    maxTemperature: Math.max(...cells.map((cell) => cell.temperature))
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

function temperatureColor(temperature, source) {
  const range = source.data.maxTemperature - source.data.minTemperature;
  const position = range ? (temperature - source.data.minTemperature) / range : 0.5;
  const scaledPosition = position * (source.gradient.length - 1);
  const start = Math.floor(scaledPosition);
  const end = Math.min(start + 1, source.gradient.length - 1);
  const fraction = scaledPosition - start;
  const channels = [1, 3, 5].map((offset) => {
    const first = Number.parseInt(source.gradient[start].slice(offset, offset + 2), 16);
    const second = Number.parseInt(source.gradient[end].slice(offset, offset + 2), 16);
    return Math.round(first + (second - first) * fraction)
      .toString(16)
      .padStart(2, "0");
  });
  return `#${channels.join("")}`;
}

function hourlyMarkers(L, source, cells, hour) {
  return cells.map((cell) => {
    const marker = L.circleMarker([cell.latitude, cell.longitude], {
      radius: 8,
      color: "#fff",
      weight: 3,
      opacity: 1,
      fillColor: temperatureColor(cell.temperature, source),
      fillOpacity: 1
    });
    marker.bindTooltip(
      `${source.id === "dwd" ? "DWD" : "Open-Meteo"} · ${cell.temperature.toFixed(1)} °C · `
        + `${String(hour).padStart(2, "0")}:00`,
      { permanent: true, direction: "top", offset: [0, -7], className: "heatmap-point-label" }
    );
    return marker;
  });
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
        data: source.type === "hourly"
          ? parseHourly(text, source.dataPath)
          : parseCells(text, source.dataPath)
      };
    }));

    const stage = map.getContainer().parentElement;
    const control = stage?.querySelector("#temperature-source-control");
    const sourceInputs = control?.querySelectorAll("[data-temperature-source]");
    const hourInput = control?.querySelector("#temperature-hour");
    const hourOutput = control?.querySelector("#temperature-hour-output");
    if (!control || !sourceInputs?.length || !hourInput || !hourOutput) {
      throw new Error("The temperature-source map control is missing from the map layout.");
    }

    const selectedIds = new Set([DEFAULT_SOURCE_ID]);
    sourceInputs.forEach((input) => {
      input.checked = selectedIds.has(input.dataset.temperatureSource);
    });
    let selectedHour = DEFAULT_HOUR;

    function cellsForHour(source) {
      return source.type === "hourly"
        ? source.data.cells.filter((cell) => cell.hour === selectedHour)
        : source.data.cells;
    }

    L.DomEvent.disableClickPropagation(control);
    L.DomEvent.disableScrollPropagation(control);

    const layer = L.layerGroup();
    function drawLegend() {
      ctx.setLegend(preparedSources.filter((source) => (
        selectedIds.has(source.id) && cellsForHour(source).length > 0
      ))
        .map((source) => ({
          gradient: source.gradient,
          from: `${ctx.pick(source.title)} · ${source.data.minTemperature.toFixed(1)} °C`,
          to: `${source.data.maxTemperature.toFixed(1)} °C`
        })));
    }

    function renderSelectedLayers() {
      layer.clearLayers();
      let renderedSourceCount = 0;
      preparedSources.forEach((source) => {
        if (!selectedIds.has(source.id)) return;
        const heatmap = heatLayer(L, source, cellsForHour(source));
        if (heatmap) {
          layer.addLayer(heatmap);
          if (source.type === "hourly") {
            hourlyMarkers(L, source, cellsForHour(source), selectedHour)
              .forEach((marker) => layer.addLayer(marker));
          }
          renderedSourceCount += 1;
        }
      });
      drawLegend();
      map.getContainer().classList.toggle(
        "heatmap-active",
        map.hasLayer(layer) && renderedSourceCount > 0
      );
      ctx.panel.close();
    }

    function updateHour() {
      selectedHour = Number(hourInput.value);
      hourOutput.value = `${String(selectedHour).padStart(2, "0")}:00`;
      hourOutput.textContent = hourOutput.value;
      renderSelectedLayers();
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
    hourInput.addEventListener("input", updateHour);
    hourInput.addEventListener("change", updateHour);
    ctx.onLanguageChange(drawLegend);
    updateHour();

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
        for (const cell of cellsForHour(source)) {
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
        const detail = source.type === "hourly"
          ? `<p>${ctx.escapeHtml(ctx.t(`sources.${source.id}.reading`, {
            timestamp: cell.timestamp.slice(11, 16)
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
