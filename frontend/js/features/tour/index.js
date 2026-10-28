// Tour: a fixed walking tour along the points of interest, drawn on the map, with a button that
// opens it in Google Maps. Replaces the old routes picker (Eirini's instructions.md, 2026-10-28).

// The tour exactly as Eirini wrote it: from the Wollhaus past every point and back to the Wollhaus.
const GOOGLE_MAPS_URL = "https://www.google.com/maps/dir/?api=1&origin=49.139597,9.21981&destination=49.139597,9.21981&waypoints=49.142452,9.218943%7C49.142434,9.215012%7C49.147158,9.211756%7C49.150353,9.207446%7C49.151805,9.215302%7C49.151995,9.21548&travelmode=walking";
// The same stops as ids in points-of-interest/poi.json, in tour order (the start is also the end).
const STOPS = ["7", "6", "5", "4", "3", "2", "1"];

export default {
  id: "tour",
  kind: "tool",
  title: { en: "Green tour", de: "Grüne Tour" },
  status: "ready",
  source: { en: "Points of interest; directions by Google Maps", de: "Orte aus der Karte; Wegbeschreibung von Google Maps" },
  style: "style.css",

  async init(ctx) {
    const { L } = ctx;
    const points = await ctx.loadData("points-of-interest/poi.json");
    const stops = STOPS.map((id) => points.find((point) => point.id === id)).filter(Boolean);
    const layer = L.layerGroup();

    L.polyline([...stops, stops[0]].map((stop) => stop.coordinates), {
      color: "#214e38", weight: 4, opacity: 0.7, dashArray: "8 7", interactive: false
    }).addTo(layer);

    ctx.el.innerHTML = `
      <ol class="tour-stops" data-part="stops"></ol>
      <a class="button tour-start" data-part="start" href="${ctx.escapeHtml(GOOGLE_MAPS_URL)}" target="_blank" rel="noopener noreferrer"></a>`;
    const part = (name) => ctx.el.querySelector(`[data-part="${name}"]`);

    function draw() {
      part("stops").innerHTML = [...stops, stops[0]].map((stop) => `<li>${ctx.escapeHtml(ctx.pick(stop.title))}</li>`).join("");
      part("start").textContent = `${ctx.t("start")} ↗`;
    }

    ctx.onLanguageChange(draw);
    draw();
    return layer;
  }
};
