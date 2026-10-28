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

// UBA air-quality observations. The UBA overall index is used as the heat intensity.
const airLayer = L.layerGroup();
const airHeatLayer = L.heatLayer([], {
  radius: 62,
  blur: 52,
  maxZoom: 15,
  minOpacity: 0.42,
  max: 5,
  gradient: {
    0.2: "#2c7bb6", // index 1: very good
    0.4: "#00a6ca", // index 2: good
    0.6: "#ffff8c", // index 3: moderate
    0.8: "#fdae61", // index 4: poor
    1.0: "#d7191c"  // index 5: very poor
  }
});
let airLoaded = false;
let airLoading = false;

function distanceKm(aLat, aLon, bLat, bLon) {
  const toRad = (value) => value * Math.PI / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const value = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function airQualityLabel(index) {
  return ({ 1: "Very good", 2: "Good", 3: "Moderate", 4: "Poor", 5: "Very poor" })[index]
    || `UBA index ${index}`;
}

function airQualityClass(index) {
  return index <= 1 ? "very-good" : index === 2 ? "good" : index === 3 ? "moderate" : index === 4 ? "poor" : "very-poor";
}

async function loadAirQuality() {
  if (airLoaded || airLoading) return;
  airLoading = true;
  showToast("Loading air-quality measurements from the German Environment Agency…");
  try {
    const stationResponse = await fetch("/api/uba/stations?lang=en");
    if (!stationResponse.ok) throw new Error(`UBA stations request failed (${stationResponse.status}).`);
    const stationPayload = await stationResponse.json();
    const stationIndices = stationPayload.indices || [];
    const stationField = (name) => stationIndices.indexOf(name);
    const idField = stationField("station id");
    const codeField = stationField("station code");
    const nameField = stationField("station name");
    const cityField = stationField("station city");
    const activeFromField = stationField("station active from");
    const activeToField = stationField("station active to");
    const longitudeField = stationField("station longitude");
    const latitudeField = stationField("station latitude");
    const today = new Date().toISOString().slice(0, 10);

    const nearbyStations = Object.values(stationPayload.data || {})
      .map((row) => ({
        id: row[idField], code: row[codeField], name: row[nameField], city: row[cityField],
        activeFrom: row[activeFromField], activeTo: row[activeToField],
        longitude: Number(row[longitudeField]), latitude: Number(row[latitudeField])
      }))
      .filter((station) => station.id && Number.isFinite(station.latitude) && Number.isFinite(station.longitude)
        && station.latitude >= -90 && station.latitude <= 90
        && station.longitude >= -180 && station.longitude <= 180
        && (!station.activeFrom || station.activeFrom <= today)
        && (!station.activeTo || station.activeTo >= today))
      .map((station) => ({ ...station, distance: distanceKm(heilbronn[0], heilbronn[1], station.latitude, station.longitude) }))
      .filter((station) => station.distance <= 40)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 8);

    if (!nearbyStations.length) throw new Error("No active UBA stations were found within 40 km of Heilbronn.");

    const berlinDate = (date) => new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit"
    }).format(date);
    const now = new Date();
    const dateTo = berlinDate(now);
    const dateFrom = berlinDate(new Date(now.getTime() - 24 * 60 * 60 * 1000));
    const observations = await Promise.all(nearbyStations.map(async (station) => {
      const params = new URLSearchParams({
        station: String(station.id), date_from: dateFrom, date_to: dateTo,
        time_from: "1", time_to: "24", lang: "en"
      });
      const response = await fetch(`/api/uba/airquality?${params}`);
      if (!response.ok) return null;
      const payload = await response.json();
      const stationData = payload.data?.[String(station.id)] || payload.data?.[station.code];
      if (!stationData || typeof stationData !== "object") return null;
      const entries = Object.entries(stationData).sort(([a], [b]) => a.localeCompare(b));
      for (let i = entries.length - 1; i >= 0; i -= 1) {
        const [timestamp, row] = entries[i];
        const index = Number(row?.[1]);
        if (Number.isFinite(index) && index >= 1) {
          return { ...station, timestamp, index, incomplete: Number(row?.[2]) === 1 };
        }
      }
      return null;
    }));

    const validObservations = observations.filter(Boolean);
    if (!validObservations.length) throw new Error("Nearby stations were found, but no recent air-quality indices were returned.");

    // Use the actual UBA overall index as each point's heat intensity.
    // Leaflet.heat renders a continuous color-blended surface instead of fixed-radius circles.
    // Index 1..5 maps to normalized intensity 0.2..1.0; gradient colors encode the index.
    airHeatLayer.setLatLngs(validObservations.map((station) => [
      station.latitude,
      station.longitude,
      Math.max(0.2, Math.min(1, station.index / 5))
    ]));
    if (document.querySelector('[data-layer="air"]').checked) {
      airHeatLayer.addTo(map);
    }

    validObservations.forEach((station) => {
      const label = airQualityLabel(station.index);
      const icon = L.divIcon({
        className: "air-marker-wrap",
        html: `<span class="air-marker ${airQualityClass(station.index)}" aria-hidden="true">${station.index}</span>`,
        iconSize: [34, 34], iconAnchor: [17, 17]
      });
      const marker = L.marker([station.latitude, station.longitude], {
        icon, title: `${station.name}: ${label}`, alt: `${station.name}, air quality ${label}`
      });
      // UBA timestamps are already expressed in the local time valid at measurement time (CET/CEST).
      const formattedTime = `${station.timestamp} CET/CEST`;
      marker.bindPopup(`
        <div class="popup-kicker">UBA air-quality station · ${escapeHtml(station.code || String(station.id))}</div>
        <h3 class="popup-title">${escapeHtml(station.name || "Monitoring station")}</h3>
        <p class="popup-description"><strong>${escapeHtml(label)}</strong> · overall UBA index ${station.index}</p>
        <p class="popup-description">${escapeHtml(station.city || "Near Heilbronn")} · ${station.distance.toFixed(1)} km from Heilbronn</p>
        <p class="popup-description">Latest returned hour: ${escapeHtml(formattedTime)}${station.incomplete ? " · data flagged incomplete" : ""}</p>
        <p class="popup-description">Source: Umweltbundesamt with data from the federal and state monitoring networks.</p>
      `);
      marker.addTo(airLayer);
    });
    airLoaded = true;
    showToast(`Air quality loaded: ${validObservations.length} nearby monitoring station${validObservations.length === 1 ? "" : "s"}.`);
  } catch (error) {
    console.error("Unable to load UBA air-quality data.", error);
    showToast(`Air-quality data unavailable: ${error.message}`);
  } finally {
    airLoading = false;
  }
}

const layerControls = {
  heat: heatLayer,
  air: airLayer,
  noise: noiseLayer,
  projects: projectLayer,
  routes: routeLayer
};

document.querySelectorAll("[data-layer]").forEach((input) => {
  input.addEventListener("change", () => {
    const layer = layerControls[input.dataset.layer];
    if (!layer) return;
    if (input.dataset.layer === "air" && input.checked) {
      // Keep the two analytical overlays separate: enabling air quality disables temperature.
      temperatureToggle.checked = false;
      map.removeLayer(heatLayer);
      map.getContainer().classList.remove("heatmap-active");
      loadAirQuality();
      // Draw the air-quality surface beneath its clickable station markers.
      airHeatLayer.addTo(map);
      layer.addTo(map);
      return;
    }
    if (input.dataset.layer === "air" && !input.checked) {
      map.removeLayer(airHeatLayer);
      map.removeLayer(layer);
      return;
    }
    if (input.dataset.layer === "heat") {
      if (input.checked) {
        // Keep the temperature layer separate from the air-quality overlay.
        const airToggle = document.querySelector('[data-layer="air"]');
        airToggle.checked = false;
        map.removeLayer(airHeatLayer);
        map.removeLayer(airLayer);
        layer.addTo(map);
      } else {
        map.removeLayer(layer);
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
