// Routes: pick points of interest in order, see the route as a line and open it in Google Maps.
// Reads the same poi.json as the points-of-interest slot. Placeholder: straight lines, no routing.

// Google Maps URLs allow at most 9 waypoints (3 in mobile browsers) between origin and destination.
// https://developers.google.com/maps/documentation/urls/get-started (checked 2026-10-28)
const MAX_WAYPOINTS = 9;
const MAX_STOPS = MAX_WAYPOINTS + 2;

export function googleMapsUrl(stops, travelmode = "walking") {
  const position = (stop) => stop.coordinates.join(",");
  const params = new URLSearchParams({
    api: "1",
    origin: position(stops[0]),
    destination: position(stops.at(-1)),
    travelmode
  });
  const waypoints = stops.slice(1, -1).map(position);
  if (waypoints.length) params.set("waypoints", waypoints.join("|"));
  return `https://www.google.com/maps/dir/?${params}`;
}

export default {
  id: "routes",
  kind: "tool",
  title: { en: "Plan a green route", de: "Grüne Route planen" },
  status: "placeholder",
  source: { en: "Points of interest; directions by Google Maps", de: "Orte aus der Karte; Wegbeschreibung von Google Maps" },
  style: "style.css",

  async init(ctx) {
    const { L, map } = ctx;
    const points = await ctx.loadData("points-of-interest/poi.json");
    const stops = [];
    const layer = L.layerGroup();

    ctx.el.innerHTML = `
      <div class="route-picker">
        <select data-part="select"></select>
        <button class="button" type="button" data-part="add"></button>
      </div>
      <ol class="route-stops" data-part="stops"></ol>
      <p class="route-hint" data-part="hint"></p>
      <div class="route-actions">
        <button class="button" type="button" data-part="open"></button>
        <button class="button is-quiet" type="button" data-part="clear"></button>
      </div>`;
    const part = (name) => ctx.el.querySelector(`[data-part="${name}"]`);

    part("add").addEventListener("click", () => {
      const point = points.find((item) => item.id === part("select").value);
      if (!point) return;
      if (stops.length >= MAX_STOPS) {
        ctx.notify(ctx.t("tooMany", { max: MAX_STOPS }));
        return;
      }
      stops.push(point);
      draw();
    });
    part("stops").addEventListener("click", (event) => {
      const button = event.target.closest("[data-remove]");
      if (!button) return;
      stops.splice(Number(button.dataset.remove), 1);
      draw();
    });
    part("clear").addEventListener("click", () => {
      stops.length = 0;
      draw();
    });
    part("open").addEventListener("click", () => {
      window.open(googleMapsUrl(stops), "_blank", "noopener");
    });

    function draw() {
      const select = part("select");
      const selected = select.value;
      select.replaceChildren(...points.map((point) => new Option(ctx.pick(point.title), point.id)));
      if (selected) select.value = selected;

      part("add").textContent = ctx.t("add");
      part("open").textContent = `${ctx.t("open")} ↗`;
      part("clear").textContent = ctx.t("clear");
      part("open").disabled = stops.length < 2;
      part("clear").disabled = stops.length === 0;
      part("hint").textContent = stops.length < 2 ? ctx.t("hint") : ctx.t("count", { count: stops.length, max: MAX_STOPS });
      part("stops").innerHTML = stops.map((stop, index) => `<li><span>${ctx.escapeHtml(ctx.pick(stop.title))}</span>`
        + `<button type="button" data-remove="${index}" aria-label="${ctx.escapeHtml(ctx.t("remove"))}">×</button></li>`).join("");

      layer.clearLayers();
      if (stops.length > 1) {
        L.polyline(stops.map((stop) => stop.coordinates), { color: "#214e38", weight: 4, opacity: 0.85, dashArray: "8 7" }).addTo(layer);
      }
      stops.forEach((stop, index) => {
        const icon = L.divIcon({ className: "", html: `<span class="route-number">${index + 1}</span>`, iconSize: [20, 20], iconAnchor: [10, 10] });
        L.marker(stop.coordinates, { icon, interactive: false, zIndexOffset: 1000 }).addTo(layer);
      });
      if (stops.length > 1) map.fitBounds(L.latLngBounds(stops.map((stop) => stop.coordinates)), { padding: [80, 80], maxZoom: 16 });
    }

    ctx.onLanguageChange(draw);
    draw();
    return layer;
  }
};
