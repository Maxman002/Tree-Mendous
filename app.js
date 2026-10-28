const heilbronn = [49.1427, 9.2109];

const projects = [
  {
    id: "01",
    title: "Wellbeing Oasis",
    place: "Marktplatz · Robert Mayer Monument",
    category: "greening",
    date: "Planned for 2027",
    coordinates: [49.14165, 9.21924],
    icon: "✳",
    description: "Two planted, partly unsealed beds with seating are planned to bring shade and cooling to the market square.",
    source: "City project fact sheet 01"
  },
  {
    id: "02",
    title: "Mobile Greenery",
    place: "City centre · several locations",
    category: "greening",
    date: "Jan–Dec 2027",
    coordinates: [49.1428, 9.2166],
    icon: "♧",
    description: "Moveable trees, plants, seating and play elements are planned for sealed and overheated public spaces.",
    source: "City project fact sheet 02"
  },
  {
    id: "03",
    title: "Bleichinsel Bridge redesign",
    place: "Bleichinselbrücke · Neckar",
    category: "mobility",
    date: "Permanent change",
    coordinates: [49.14375, 9.2071],
    icon: "↗",
    description: "Permanent planting, space for cycling in both directions and unsealing are planned for this bridge.",
    source: "City project fact sheet 03"
  },
  {
    id: "04",
    title: "City Centre Cycling Ring",
    place: "Rollwagstraße · Gymnasiumstraße",
    category: "mobility",
    date: "Jan–Dec 2027",
    coordinates: [49.1398, 9.2146],
    icon: "↗",
    description: "A continuous, clearly marked cycle route is planned around the city centre.",
    source: "City project fact sheet 04"
  },
  {
    id: "05",
    title: "Friedrich-Ebert Bridge trial",
    place: "Friedrich-Ebert-Brücke · Gerberstraße",
    category: "mobility",
    date: "Summer 2027 · planned",
    coordinates: [49.14745, 9.2136],
    icon: "≋",
    description: "A temporary traffic trial is planned, with space for seating and greenery alongside buses.",
    source: "City project fact sheet 05"
  },
  {
    id: "08",
    title: "Vineyard transformation",
    place: "Weinbergarena · Gaffenberg",
    category: "nature",
    date: "From autumn 2026",
    coordinates: [49.1283, 9.2289],
    icon: "❋",
    description: "Biodiversity-friendly vineyard trials, flowering areas and a discovery trail are planned near Gaffenberg.",
    source: "City project fact sheet 08"
  }
];

const map = L.map("map", {
  zoomControl: false,
  scrollWheelZoom: true
}).setView(heilbronn, 14);

const temperatureToggle = document.querySelector('[data-layer="heat"]');
map.getContainer().classList.toggle("heatmap-active", temperatureToggle.checked);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
L.control.zoom({ position: "bottomleft" }).addTo(map);

const heatLayer = L.heatLayer([], {
  radius: 18,
  blur: 22,
  maxZoom: 17,
  minOpacity: 0.3,
  gradient: {
    0.2: "#377eb8",
    0.4: "#65b5c5",
    0.6: "#f2df65",
    0.8: "#f28e45",
    1: "#d73027"
  }
});
if (temperatureToggle.checked) {
  heatLayer.addTo(map);
}

async function loadHeatMeasurements() {
  const response = await fetch("data/alles.csv");
  if (!response.ok) {
    throw new Error(`Could not load data/alles.csv (${response.status} ${response.statusText}).`);
  }

  const lines = (await response.text()).split(/\r?\n/);
  const header = lines.shift()?.split(",");
  if (!header) {
    throw new Error("The temperature CSV is empty.");
  }

  const latitudeColumn = header.indexOf("latitude");
  const longitudeColumn = header.indexOf("longitude");
  const temperatureColumn = header.indexOf("temperature");
  if (latitudeColumn < 0 || longitudeColumn < 0 || temperatureColumn < 0) {
    throw new Error("The temperature CSV must contain latitude, longitude, and temperature columns.");
  }

  const cellSizeMeters = 25;
  const longitudeMetersPerDegree = 111_320 * Math.cos(heilbronn[0] * Math.PI / 180);
  const cells = new Map();
  const bounds = L.latLngBounds([]);
  let validSamples = 0;
  let minTemperature = Infinity;
  let maxTemperature = -Infinity;

  lines.forEach((line) => {
    if (!line.trim()) return;
    const columns = line.split(",");
    if (
      !columns[latitudeColumn]?.trim()
      || !columns[longitudeColumn]?.trim()
      || !columns[temperatureColumn]?.trim()
    ) return;
    const latitude = Number(columns[latitudeColumn]);
    const longitude = Number(columns[longitudeColumn]);
    const temperature = Number(columns[temperatureColumn]);
    if (
      !Number.isFinite(latitude) || latitude < -90 || latitude > 90
      || !Number.isFinite(longitude) || longitude < -180 || longitude > 180
      || !Number.isFinite(temperature)
    ) return;

    validSamples += 1;
    minTemperature = Math.min(minTemperature, temperature);
    maxTemperature = Math.max(maxTemperature, temperature);
    bounds.extend([latitude, longitude]);

    const latitudeCell = Math.floor(latitude * 111_320 / cellSizeMeters);
    const longitudeCell = Math.floor(longitude * longitudeMetersPerDegree / cellSizeMeters);
    const key = `${latitudeCell}:${longitudeCell}`;
    const cell = cells.get(key) ?? { latitude: 0, longitude: 0, temperature: 0, count: 0 };
    cell.latitude += latitude;
    cell.longitude += longitude;
    cell.temperature += temperature;
    cell.count += 1;
    cells.set(key, cell);
  });

  if (validSamples === 0) {
    throw new Error("The temperature CSV contains no valid measurement rows.");
  }

  const temperatureRange = maxTemperature - minTemperature;
  const heatPoints = Array.from(cells.values(), (cell) => {
    const averageTemperature = cell.temperature / cell.count;
    const intensity = temperatureRange === 0
      ? 0.5
      : (averageTemperature - minTemperature) / temperatureRange;
    return [
      cell.latitude / cell.count,
      cell.longitude / cell.count,
      intensity
    ];
  });

  heatLayer.setLatLngs(heatPoints);
  map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
  document.getElementById("heat-min").textContent = `${minTemperature.toFixed(1)}°C`;
  document.getElementById("heat-max").textContent = `${maxTemperature.toFixed(1)}°C`;
}

loadHeatMeasurements().catch((error) => {
  console.error("Unable to load the bike temperature measurements.", error);
  document.getElementById("heat-min").textContent = "Data";
  document.getElementById("heat-max").textContent = "unavailable";
});

const climateRegions = {
  heilbronn: {
    label: "Heilbronn municipality",
    file: "weather_data/klimadaten_gemeinde_heilbronn_8121000.csv"
  },
  heilbronnCityDistrict: {
    label: "Heilbronn city district",
    file: "weather_data/klimadaten_kreis_heilbronn_stadt_8121.csv"
  },
  county: {
    label: "Heilbronn county",
    file: "weather_data/klimadaten_kreis_heilbronn_8125.csv"
  },
  badenWuerttemberg: {
    label: "Baden-Württemberg",
    file: "weather_data/klimadaten_land_baden-wuerttemberg_0.csv"
  }
};

const climateMetrics = {
  temperatur_mittelwert: { label: "Mean temperature", unit: "°C" },
  temperatur_sommertage: { label: "Summer days", unit: "days" },
  temperatur_heisse_tage: { label: "Hot days", unit: "days" },
  temperatur_tropennaechte: { label: "Tropical nights", unit: "nights" },
  niederschlag_summe: { label: "Total precipitation", unit: "mm" },
  niederschlag_trockentage: { label: "Dry days", unit: "days" },
  trockenperiode_tage_maximum: { label: "Longest dry period", unit: "days" }
};

const climateDataCache = new Map();
const climateDialog = document.getElementById("climate-dialog");
const climateRegionSelect = document.getElementById("climate-region");
const climateMetricSelect = document.getElementById("climate-metric");
const climateChart = document.getElementById("climate-chart");
const climateSummary = document.getElementById("climate-summary");
const climateStatus = document.getElementById("climate-status");
const climateNumberFormat = new Intl.NumberFormat("en", { maximumFractionDigits: 1 });
const climateChangeFormat = new Intl.NumberFormat("en", { maximumFractionDigits: 2 });
let climateUpdateId = 0;

async function loadClimateSeries(regionKey) {
  if (climateDataCache.has(regionKey)) {
    return climateDataCache.get(regionKey);
  }

  const region = climateRegions[regionKey];
  if (!region) {
    throw new Error(`Unknown climate region: ${regionKey}.`);
  }

  const response = await fetch(region.file);
  if (!response.ok) {
    throw new Error(`Could not load ${region.file} (${response.status} ${response.statusText}).`);
  }

  const lines = (await response.text()).split(/\r?\n/);
  const header = lines.shift()?.split(";");
  if (!header) {
    throw new Error(`The climate CSV for ${region.label} is empty.`);
  }

  const yearColumn = header.indexOf("jahr");
  const seasonColumn = header.indexOf("saison");
  if (yearColumn < 0 || seasonColumn < 0) {
    throw new Error(`The climate CSV for ${region.label} must contain jahr and saison columns.`);
  }

  const metricColumns = Object.fromEntries(
    Object.keys(climateMetrics).map((metric) => [metric, header.indexOf(metric)])
  );
  const rows = lines.flatMap((line) => {
    if (!line.trim()) return [];
    const columns = line.split(";");
    if (columns[seasonColumn] !== "kalenderjahr") return [];
    const year = Number(columns[yearColumn]);
    if (!Number.isInteger(year)) return [];

    return [{
      year,
      values: Object.fromEntries(
        Object.entries(metricColumns).map(([metric, column]) => {
          const value = column < 0 ? "" : columns[column]?.trim() ?? "";
          const number = value ? Number(value.replace(",", ".")) : NaN;
          return [metric, Number.isFinite(number) ? number : null];
        })
      )
    }];
  }).sort((first, second) => first.year - second.year);

  if (rows.length === 0) {
    throw new Error(`The climate CSV for ${region.label} has no annual records.`);
  }

  climateDataCache.set(regionKey, rows);
  return rows;
}

function appendSvgElement(svg, name, attributes, text) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attributes).forEach(([attribute, value]) => {
    element.setAttribute(attribute, String(value));
  });
  if (text !== undefined) element.textContent = text;
  svg.append(element);
  return element;
}

function renderClimateChart(rows, region, metricKey) {
  const metric = climateMetrics[metricKey];
  const points = rows.flatMap((row) => {
    const value = row.values[metricKey];
    return value === null ? [] : [{ year: row.year, value }];
  });
  climateChart.replaceChildren();

  if (points.length === 0) {
    climateSummary.textContent = `No annual ${metric.label.toLowerCase()} data is available for ${region.label}.`;
    climateStatus.textContent = climateSummary.textContent;
    return;
  }

  const width = 720;
  const height = 320;
  const plot = { left: 64, right: 18, top: 20, bottom: 42 };
  const plotWidth = width - plot.left - plot.right;
  const plotHeight = height - plot.top - plot.bottom;
  const values = points.map((point) => point.value);
  const range = Math.max(...values) - Math.min(...values);
  const padding = range === 0 ? 1 : range * 0.1;
  const minimum = Math.min(...values) - padding;
  const maximum = Math.max(...values) + padding;
  const x = (index) => plot.left + (index / Math.max(points.length - 1, 1)) * plotWidth;
  const y = (value) => plot.top + ((maximum - value) / (maximum - minimum)) * plotHeight;

  climateChart.setAttribute("viewBox", `0 0 ${width} ${height}`);
  climateChart.setAttribute("aria-label", `${metric.label} in ${region.label}, ${points[0].year} to ${points.at(-1).year}`);
  appendSvgElement(climateChart, "title", { id: "climate-chart-title" }, `${metric.label} in ${region.label}`);
  appendSvgElement(
    climateChart,
    "desc",
    { id: "climate-chart-description" },
    `Annual climate indicators from ${points[0].year} to ${points.at(-1).year}.`
  );
  climateChart.setAttribute("aria-labelledby", "climate-chart-title climate-chart-description");
  climateChart.setAttribute("role", "img");

  for (let tick = 0; tick <= 4; tick += 1) {
    const value = maximum - ((maximum - minimum) * tick) / 4;
    const yPosition = y(value);
    appendSvgElement(climateChart, "line", {
      x1: plot.left,
      x2: width - plot.right,
      y1: yPosition,
      y2: yPosition,
      class: "climate-gridline"
    });
    appendSvgElement(climateChart, "text", {
      x: plot.left - 10,
      y: yPosition + 4,
      "text-anchor": "end",
      class: "climate-axis-label"
    }, climateNumberFormat.format(value));
  }

  const yearTicks = new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]);
  yearTicks.forEach((index) => {
    appendSvgElement(climateChart, "text", {
      x: x(index),
      y: height - 12,
      "text-anchor": index === 0 ? "start" : index === points.length - 1 ? "end" : "middle",
      class: "climate-axis-label"
    }, String(points[index].year));
  });

  const path = points.map((point, index) =>
    `${index === 0 ? "M" : "L"} ${x(index).toFixed(2)} ${y(point.value).toFixed(2)}`
  ).join(" ");
  appendSvgElement(climateChart, "path", { d: path, class: "climate-line" });
  points.forEach((point, index) => {
    const circle = appendSvgElement(climateChart, "circle", {
      cx: x(index),
      cy: y(point.value),
      r: points.length > 40 ? 2 : 3,
      class: "climate-point"
    });
    appendSvgElement(circle, "title", {}, `${point.year}: ${climateNumberFormat.format(point.value)} ${metric.unit}`);
  });

  const first = points[0];
  const latest = points.at(-1);
  const difference = latest.value - first.value;
  const sign = difference > 0 ? "+" : "";
  climateSummary.textContent =
    `${first.year}: ${climateNumberFormat.format(first.value)} ${metric.unit} · `
    + `${latest.year}: ${climateNumberFormat.format(latest.value)} ${metric.unit} · `
    + `change: ${sign}${climateChangeFormat.format(difference)} ${metric.unit}`;
  climateStatus.textContent = `${points.length} annual records · ${first.year}–${latest.year}`;
}

async function updateClimateExplorer() {
  const updateId = ++climateUpdateId;
  const regionKey = climateRegionSelect.value;
  const metricKey = climateMetricSelect.value;
  climateStatus.textContent = "Loading climate data…";
  climateSummary.textContent = "";
  climateChart.replaceChildren();
  try {
    const region = climateRegions[regionKey];
    const rows = await loadClimateSeries(regionKey);
    if (updateId !== climateUpdateId) return;
    renderClimateChart(rows, region, metricKey);
  } catch (error) {
    if (updateId !== climateUpdateId) return;
    console.error("Unable to load the annual climate data.", error);
    climateStatus.textContent = "Climate data could not be loaded.";
    climateSummary.textContent = error.message;
  }
}

document.getElementById("climate-open").addEventListener("click", () => {
  climateDialog.showModal();
  updateClimateExplorer();
});
climateRegionSelect.addEventListener("change", updateClimateExplorer);
climateMetricSelect.addEventListener("change", updateClimateExplorer);

const noiseLayer = L.layerGroup([
  L.polyline([[49.1488, 9.2139], [49.1472, 9.2136], [49.1458, 9.2133]], {
    color: "#718ba2",
    weight: 19,
    opacity: 0.25,
    lineCap: "round"
  }),
  L.circle([49.1448, 9.2082], {
    radius: 320,
    color: "#718ba2",
    weight: 1,
    fillColor: "#8da2b4",
    fillOpacity: 0.2
  })
]);

const routeLayer = L.layerGroup([
  L.polyline([
    [49.1378, 9.2148],
    [49.1397, 9.2101],
    [49.1430, 9.2079],
    [49.1462, 9.2103],
    [49.1476, 9.2154],
    [49.1454, 9.2202],
    [49.1416, 9.2204],
    [49.1378, 9.2148]
  ], {
    color: "#64815d",
    weight: 3,
    opacity: 0.8,
    dashArray: "7 7"
  })
]);

const markers = new Map();
const projectLayer = L.layerGroup().addTo(map);
let activeCategory = "all";
let searchQuery = "";
let ideaMode = false;
let toastTimer;

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function makeProjectMarker(project) {
  const icon = L.divIcon({
    className: "",
    html: `<span class="project-marker" aria-hidden="true">${project.icon}</span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
  const marker = L.marker(project.coordinates, {
    icon,
    title: `${project.title} — ${project.place}`,
    alt: project.title
  });
  marker.bindPopup(`
    <div class="popup-kicker">Project ${project.id} · ${escapeHtml(project.date)}</div>
    <h3 class="popup-title">${escapeHtml(project.title)}</h3>
    <p class="popup-description">${escapeHtml(project.description)}</p>
    <p class="popup-description">${escapeHtml(project.place)} · approximate pin</p>
  `);
  return marker;
}

projects.forEach((project) => {
  markers.set(project.id, makeProjectMarker(project));
  markers.get(project.id).addTo(projectLayer);
});

function matchesProject(project) {
  const matchesCategory = activeCategory === "all" || project.category === activeCategory;
  const haystack = `${project.title} ${project.place} ${project.description} ${project.category}`.toLowerCase();
  return matchesCategory && haystack.includes(searchQuery);
}

function renderProjects() {
  const visible = projects.filter(matchesProject);
  const list = document.getElementById("project-list");
  list.replaceChildren();

  visible.forEach((project) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "project-card";
    card.dataset.projectId = project.id;
    card.innerHTML = `
      <span class="project-top">
        <span class="project-name">${escapeHtml(project.title)}</span>
        <span class="project-number">${project.id}</span>
      </span>
      <span class="project-meta">${escapeHtml(project.place)} · ${escapeHtml(project.date)}</span>
    `;
    list.append(card);
  });

  document.getElementById("project-count").textContent =
    `${String(visible.length).padStart(2, "0")} PROJECT${visible.length === 1 ? "" : "S"}`;
  document.getElementById("empty-state").hidden = visible.length > 0;

  markers.forEach((marker, id) => {
    const isVisible = visible.some((project) => project.id === id);
    if (isVisible && map.hasLayer(projectLayer)) {
      marker.addTo(projectLayer);
    } else {
      projectLayer.removeLayer(marker);
    }
  });
}

document.getElementById("project-list").addEventListener("click", (event) => {
  const card = event.target.closest("[data-project-id]");
  if (!card) return;
  const project = projects.find((item) => item.id === card.dataset.projectId);
  if (!project) return;
  map.flyTo(project.coordinates, 16, { duration: 0.7 });
  markers.get(project.id).openPopup();
});

document.querySelectorAll(".filter-chip").forEach((button) => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.category;
    document.querySelectorAll(".filter-chip").forEach((chip) => {
      chip.classList.toggle("is-selected", chip === button);
    });
    renderProjects();
  });
});

document.getElementById("project-search").addEventListener("input", (event) => {
  searchQuery = event.target.value.trim().toLowerCase();
  renderProjects();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && ideaMode) {
    setIdeaMode(false);
    showToast("Idea location selection cancelled.");
    return;
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    document.getElementById("project-search").focus();
  }
});

const layerControls = {
  heat: heatLayer,
  noise: noiseLayer,
  projects: projectLayer,
  routes: routeLayer
};

document.querySelectorAll("[data-layer]").forEach((input) => {
  input.addEventListener("change", () => {
    const layer = layerControls[input.dataset.layer];
    if (input.dataset.layer === "heat") {
      if (input.checked) {
        layer.addTo(map);
      }
      map.getContainer().classList.toggle("heatmap-active", input.checked);
      return;
    }

    if (input.checked) {
      layer.addTo(map);
    } else {
      map.removeLayer(layer);
    }
  });
});

const participationDialog = document.getElementById("participation-dialog");
document.getElementById("participate-button").addEventListener("click", () => {
  participationDialog.showModal();
});

const ideaDialog = document.getElementById("idea-dialog");
document.getElementById("idea-button").addEventListener("click", () => {
  if (ideaMode) {
    setIdeaMode(false);
    showToast("Idea location selection cancelled.");
    return;
  }
  setIdeaMode(true);
  showToast("Click the map to choose a place for your idea.");
});

map.on("click", (event) => {
  if (!ideaMode) return;
  setIdeaMode(false);
  ideaDialog.dataset.latitude = event.latlng.lat;
  ideaDialog.dataset.longitude = event.latlng.lng;
  document.getElementById("idea-description").value = "";
  ideaDialog.showModal();
});

document.getElementById("idea-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const category = document.getElementById("idea-category").value;
  const description = document.getElementById("idea-description").value.trim();
  const latitude = Number(ideaDialog.dataset.latitude);
  const longitude = Number(ideaDialog.dataset.longitude);
  if (!description || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

  const ideaIcon = L.divIcon({
    className: "",
    html: '<span class="idea-marker" aria-hidden="true"><span>✳</span></span>',
    iconSize: [32, 32],
    iconAnchor: [16, 28]
  });
  L.marker([latitude, longitude], { icon: ideaIcon, title: `${category}: ${description}` })
    .addTo(map)
    .bindPopup(`<div class="popup-kicker">Your idea · this session only</div><h3 class="popup-title">${escapeHtml(category)}</h3><p class="popup-description">${escapeHtml(description)}</p>`)
    .openPopup();
  ideaDialog.close();
  showToast("Your idea is on the map for this session only. Nothing was sent or saved.");
});

ideaDialog.addEventListener("close", () => {
  setIdeaMode(false);
});

function setIdeaMode(enabled) {
  ideaMode = enabled;
  const button = document.getElementById("idea-button");
  button.classList.toggle("is-active", enabled);
  button.setAttribute("aria-pressed", String(enabled));
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3600);
}

renderProjects();

window.addEventListener("resize", () => map.invalidateSize());
