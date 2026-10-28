// Birdhouses: the smart birdhouses (Birdiary) as markers, with a card for their bird data. Placeholder.
export default {
  id: "birdhouses",
  kind: "overlay",
  title: { en: "Smart birdhouses", de: "Smarte Vogelhäuser" },
  status: "placeholder",
  source: "Birdiary smart birdhouses (wiediversistmeingarten.org)",
  icon: "⌂",
  style: "style.css",
  legend: [{ color: "#8a5b3e", label: { en: "Birdhouse", de: "Vogelhaus" } }],

  async init(ctx) {
    const { L } = ctx;
    const birdhouses = await ctx.loadData("birdhouses/birdhouses.json");
    const icon = L.divIcon({ className: "", html: '<span class="birdhouse-marker">⌂</span>', iconSize: [28, 28], iconAnchor: [14, 14] });
    const layer = L.layerGroup();

    birdhouses.forEach((birdhouse) => {
      L.marker(birdhouse.coordinates, { icon, title: ctx.pick(birdhouse.name) })
        .on("click", () => ctx.panel.show(() => card(birdhouse)))
        .addTo(layer);
    });

    function card(birdhouse) {
      const { birds } = birdhouse;
      const data = birds
        ? `<dl><dt>${ctx.escapeHtml(ctx.t("visits"))}</dt><dd>${ctx.escapeHtml(birds.visitsLast7Days)}</dd>`
          + `<dt>${ctx.escapeHtml(ctx.t("species"))}</dt><dd>${ctx.escapeHtml(birds.species.join(", "))}</dd>`
          + `<dt>${ctx.escapeHtml(ctx.t("lastVisit"))}</dt><dd>${ctx.escapeHtml(birds.lastVisit)}</dd></dl>`
        : `<p><em>${ctx.escapeHtml(ctx.t("noData"))}</em></p>`;
      return {
        kicker: birdhouse.sample ? ctx.t("sampleKicker") : ctx.t("kicker"),
        title: ctx.pick(birdhouse.name),
        html: `<p>${ctx.escapeHtml(ctx.pick(birdhouse.description))}</p>${data}`
          + (birdhouse.link ? `<p><a href="${ctx.escapeHtml(birdhouse.link)}" target="_blank" rel="noopener noreferrer">${ctx.escapeHtml(ctx.t("station"))} ↗</a></p>` : "")
      };
    }

    return layer;
  }
};
