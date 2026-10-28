// Birdhouses: the Birdiary smart bird feeders as markers. Clicking one opens a card with its most
// frequent birds; "Open bird dashboard" shows the full dashboard (dashboard.js) over the map.
// The data is prepared offline by backend/scripts/birdhouses/prepare_birdhouses.py.
import { createDashboard } from "./dashboard.js";
import { birdAvatar, loadPhotos } from "./photos.js";

const TOP_BIRDS_IN_CARD = 3;

export default {
  id: "birdhouses",
  kind: "overlay",
  title: { en: "Smart birdhouses", de: "Smarte Vogelhäuser" },
  status: "ready",
  source: "Birdiary smart bird feeders (wiediversistmeingarten.org), AI identifications checked by hand",
  icon: "⌂",
  style: "style.css",
  legend: [{ color: "#8a5b3e", label: { en: "Bird feeder", de: "Futterhaus" } }],

  async init(ctx) {
    const { L } = ctx;
    const [birdhouses, species] = await Promise.all([
      ctx.loadData("birdhouses/birdhouses.json"),
      ctx.loadData("birdhouses/species.json")
    ]);
    const dashboard = createDashboard(ctx, species);
    const icon = L.divIcon({ className: "", html: '<span class="birdhouse-marker">⌂</span>', iconSize: [28, 28], iconAnchor: [14, 14] });
    const layer = L.layerGroup();

    birdhouses.forEach((birdhouse) => {
      L.marker(birdhouse.coordinates, { icon, title: ctx.pick(birdhouse.name) })
        .on("click", () => {
          ctx.panel.show(() => card(birdhouse));
          requestAnimationFrame(() => loadPhotos(document.querySelector(".birdhouse-card")));
        })
        .addTo(layer);
    });

    // The card's button lives in HTML the core puts into the panel, so listen on the document.
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-bird-dashboard]");
      if (!button) return;
      dashboard.open(birdhouses.find((birdhouse) => birdhouse.id === button.dataset.birdDashboard));
    });
    layer.on("remove", () => dashboard.close());

    function card(birdhouse) {
      const recent = birdhouse.birds?.ranges?.recent;
      const top = (recent?.species ?? []).filter((bird) => species[bird.latin]).slice(0, TOP_BIRDS_IN_CARD);
      const rows = top.map((bird) => {
        const info = species[bird.latin];
        const name = ctx.language === "de" ? info.de : info.en;
        const other = ctx.language === "de" ? info.en : info.de;
        return `<li>${birdAvatar({ latin: bird.latin, color: info.color, label: name.slice(0, 2), size: 34 }, ctx.escapeHtml)}`
          + `<span><strong>${ctx.escapeHtml(name)}</strong><small>${ctx.escapeHtml(other)}</small></span>`
          + `<b>${ctx.escapeHtml(bird.count)}</b></li>`;
      }).join("");

      const data = recent
        ? `<dl><dt>${ctx.escapeHtml(ctx.t("visitsRecent"))}</dt><dd>${ctx.escapeHtml(recent.total)}</dd>`
          + `<dt>${ctx.escapeHtml(ctx.t("lastVisit"))}</dt><dd>${ctx.escapeHtml(birdhouse.birds.lastVisit ?? "–")}</dd></dl>`
          + `<p class="birdhouse-card-heading">${ctx.escapeHtml(ctx.t("topBirds"))}</p><ul class="birdhouse-top">${rows}</ul>`
          + `<button type="button" class="button birdhouse-open" data-bird-dashboard="${ctx.escapeHtml(birdhouse.id)}">${ctx.escapeHtml(ctx.t("openDashboard"))}</button>`
        : `<p><em>${ctx.escapeHtml(ctx.t("noData"))}</em></p>`;

      return {
        kicker: birdhouse.sample ? ctx.t("sampleKicker") : ctx.t("kicker"),
        title: ctx.pick(birdhouse.name),
        html: `<div class="birdhouse-card"><p>${ctx.escapeHtml(ctx.pick(birdhouse.description))}</p>${data}`
          + (birdhouse.link ? `<p><a href="${ctx.escapeHtml(birdhouse.link)}" target="_blank" rel="noopener noreferrer">${ctx.escapeHtml(ctx.t("station"))} ↗</a></p>` : "")
          + "</div>"
      };
    }

    return layer;
  }
};
