// Points of interest: Green Capital city projects, events and places as markers with a detail card.
const KINDS = {
  "city-project": { color: "#2c6849", label: { en: "Green Capital project", de: "Projekt Grüne Hauptstadt" } },
  event: { color: "#e47f4e", label: { en: "Event", de: "Veranstaltung" } },
  place: { color: "#3f8a99", label: { en: "Place", de: "Ort" } }
};
const CATEGORY_ICONS = {
  greening: "✳",
  mobility: "↗",
  nature: "❋",
  energy: "ϟ",
  circular: "♻",
  culture: "✦",
  education: "✎",
  participation: "✋"
};

export default {
  id: "points-of-interest",
  kind: "overlay",
  title: { en: "Projects and places", de: "Projekte und Orte" },
  status: "placeholder",
  source: {
    en: "City of Heilbronn, Green Capital 2027 fact sheets (10/2026); team research",
    de: "Stadt Heilbronn, Steckbriefe Grüne Hauptstadt 2027 (10/2026); Recherche des Teams"
  },
  icon: "✳",
  style: "style.css",
  visible: true,
  legend: Object.values(KINDS),

  async init(ctx) {
    const { L } = ctx;
    const points = await ctx.loadData("points-of-interest/poi.json");
    const layer = L.layerGroup();

    points.forEach((point) => {
      const kind = KINDS[point.kind] ?? KINDS.place;
      const icon = L.divIcon({
        className: "",
        html: `<span class="poi-marker" style="background:${kind.color}">${CATEGORY_ICONS[point.category] ?? "●"}</span>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      const marker = L.marker(point.coordinates, { icon, title: ctx.pick(point.title) });
      marker.on("click", () => ctx.panel.show(() => card(point, kind)));
      marker.addTo(layer);
    });

    function card(point, kind) {
      const environment = ctx.pick(point.environment);
      const kicker = [ctx.pick(kind.label), ctx.t(`categories.${point.category}`), point.when].filter(Boolean).join(" · ");
      return {
        kicker,
        title: ctx.pick(point.title),
        html: `<p>${ctx.escapeHtml(ctx.pick(point.description))}</p>`
          + (environment ? `<p><strong>${ctx.escapeHtml(ctx.t("environment"))}:</strong> ${ctx.escapeHtml(environment)}</p>` : "")
          + (point.link ? `<p><a href="${ctx.escapeHtml(point.link)}" target="_blank" rel="noopener noreferrer">${ctx.escapeHtml(ctx.t("more"))} ↗</a></p>` : "")
      };
    }

    return layer;
  }
};
