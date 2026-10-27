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
}).addTo(map);

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

const layerControls = {
  heat: heatLayer,
  noise: noiseLayer,
  projects: projectLayer,
  routes: routeLayer
};

document.querySelectorAll("[data-layer]").forEach((input) => {
  input.addEventListener("change", () => {
    const layer = layerControls[input.dataset.layer];
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
