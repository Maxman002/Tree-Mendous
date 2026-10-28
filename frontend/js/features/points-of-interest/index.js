// Points of interest: Eirini's places (smart sensors, a park, Green Capital 2027 projects) as markers
// with a detail card. The birdhouse point opens the bird dashboard of the birdhouses slot.
const KINDS = {
  "green-capital": { color: "#2c6849", icon: "✳", label: { en: "European Green Capital 2027", de: "Grüne Hauptstadt Europas 2027" } },
  "smart-sensors": { color: "#3f8a99", icon: "◎", label: { en: "Smart sensors", de: "Smarte Sensoren" } },
  park: { color: "#6d9b3a", icon: "❋", label: { en: "Park", de: "Park" } }
};

export default {
  id: "points-of-interest",
  kind: "overlay",
  title: { en: "Projects and places", de: "Projekte und Orte" },
  status: "ready",
  source: {
    en: "Team research (Eirini); City of Heilbronn, Green Capital 2027 fact sheets (10/2026)",
    de: "Recherche des Teams (Eirini); Stadt Heilbronn, Steckbriefe Grüne Hauptstadt 2027 (10/2026)"
  },
  icon: "✳",
  style: "style.css",
  visible: true,
  legend: Object.values(KINDS).map(({ color, label }) => ({ color, label })),

  async init(ctx) {
    const { L } = ctx;
    const points = await ctx.loadData("points-of-interest/poi.json");
    const layer = L.layerGroup();

    points.forEach((point) => {
      const kind = KINDS[point.kind] ?? KINDS["green-capital"];
      const icon = L.divIcon({
        className: "",
        html: `<span class="poi-marker" style="background:${kind.color}">${kind.icon}</span>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      const marker = L.marker(point.coordinates, { icon, title: ctx.pick(point.title) });
      marker.on("click", () => ctx.panel.show(() => card(point, kind)));
      marker.addTo(layer);
    });

    function card(point, kind) {
      // The birdhouses slot listens for clicks on [data-bird-dashboard] and opens that feeder's dashboard.
      const birds = point.birdhouse
        ? `<button type="button" class="button poi-action" data-bird-dashboard="${ctx.escapeHtml(point.birdhouse)}">${ctx.escapeHtml(ctx.t("birds"))}</button>`
        : "";
      return {
        kicker: ctx.pick(kind.label),
        title: ctx.pick(point.title),
        html: `<p>${ctx.escapeHtml(ctx.pick(point.description))}</p>${birds}`
          + (point.link ? `<p><a href="${ctx.escapeHtml(point.link)}" target="_blank" rel="noopener noreferrer">${ctx.escapeHtml(ctx.t("more"))} ↗</a></p>` : "")
      };
    }

    return layer;
  }
};
