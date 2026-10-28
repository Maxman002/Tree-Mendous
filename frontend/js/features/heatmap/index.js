// Heat map: average temperatures measured by the team's mobile bike loggers, drawn with Leaflet.heat.
// The data is prepared offline by backend/scripts/heatmap/prepare_heatmap.py.
const GRADIENT = {
  0.2: "#377eb8",
  0.4: "#65b5c5",
  0.6: "#f2df65",
  0.8: "#f28e45",
  1: "#d73027"
};
const CLICK_RADIUS_METERS = 40;
const CLICK_RADIUS_PIXELS = 30; // about the size of a heat spot on screen

export default {
  id: "heatmap",
  kind: "base-layer",
  title: { en: "Urban temperature", de: "Temperatur in der Stadt" },
  status: "ready",
  source: {
    en: "Mobile temperature loggers (senseBox:bike), team recordings 1–3 Sep 2026",
    de: "Mobile Temperaturlogger (senseBox:bike), Messfahrten des Teams 1.–3. Sep. 2026"
  },
  icon: "◉",
  style: "style.css",
  legend: [{ gradient: Object.values(GRADIENT), from: { en: "Cool", de: "Kühl" }, to: { en: "Hot", de: "Heiß" } }],

  async init(ctx) {
    const { L, map } = ctx;
    await ctx.loadScript("https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js");
    const data = await ctx.loadData("heatmap/temperature-cells.json");
    const { minTemperature: min, maxTemperature: max } = data;
    const range = max - min;

    // Each cell is [latitude, longitude, average temperature, number of readings].
    const points = data.cells.map(([lat, lng, temperature]) => [lat, lng, range ? (temperature - min) / range : 0.5]);
    const layer = L.heatLayer(points, { radius: 18, blur: 22, maxZoom: 17, minOpacity: 0.3, gradient: GRADIENT });

    ctx.setLegend([{ gradient: Object.values(GRADIENT), from: `${min.toFixed(1)} °C`, to: `${max.toFixed(1)} °C` }]);

    // Grey map tiles while the heat map is shown, so the colours stand out.
    layer.on("add", () => map.getContainer().classList.add("heatmap-active"));
    layer.on("remove", () => {
      map.getContainer().classList.remove("heatmap-active");
      map.off("click", showNearestCell);
      ctx.panel.close();
    });
    layer.on("add", () => map.on("click", showNearestCell));

    function showNearestCell(event) {
      let nearest = null;
      let nearestDistance = Infinity;
      for (const cell of data.cells) {
        const distance = event.latlng.distanceTo([cell[0], cell[1]]);
        if (distance < nearestDistance) {
          nearest = cell;
          nearestDistance = distance;
        }
      }
      // At low zoom levels a few pixels are already hundreds of metres, so the radius grows with the zoom.
      const metersPerPixel = 40_075_016 * Math.cos(event.latlng.lat * Math.PI / 180) / 2 ** (map.getZoom() + 8);
      if (!nearest || nearestDistance > Math.max(CLICK_RADIUS_METERS, CLICK_RADIUS_PIXELS * metersPerPixel)) {
        ctx.panel.close();
        return;
      }
      const [, , temperature, count] = nearest;
      ctx.panel.show(() => ({
        kicker: ctx.t("kicker"),
        title: `${temperature.toFixed(1)} °C`,
        html: `<p>${ctx.escapeHtml(ctx.t("cell", { count, size: data.cellSizeMeters }))}</p>`
          + `<p>${ctx.escapeHtml(ctx.t("range", { min: min.toFixed(1), max: max.toFixed(1) }))}</p>`
      }));
    }

    return layer;
  }
};
