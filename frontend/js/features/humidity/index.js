// Humidity: average relative humidity measured by the same mobile bike loggers as the heat map,
// drawn with Leaflet.heat. Taken from the humidity column the "humidity" branch brought up.
// The data is prepared offline by backend/scripts/humidity/prepare_humidity.py.
const GRADIENT = {
  0.2: "#e6c98a",
  0.4: "#cfe0b4",
  0.6: "#7fc4c4",
  0.8: "#3f8fc2",
  1: "#23508f"
};
const CLICK_RADIUS_METERS = 40;
const CLICK_RADIUS_PIXELS = 30; // about the size of a spot on screen

export default {
  id: "humidity",
  kind: "base-layer",
  title: { en: "Humidity", de: "Luftfeuchtigkeit" },
  status: "ready",
  source: {
    en: "Mobile loggers (senseBox:bike), team recordings 1–3 Sep 2026",
    de: "Mobile Logger (senseBox:bike), Messfahrten des Teams 1.–3. Sep. 2026"
  },
  icon: "◍",
  style: "style.css",
  legend: [{ gradient: Object.values(GRADIENT), from: { en: "Dry", de: "Trocken" }, to: { en: "Humid", de: "Feucht" } }],

  async init(ctx) {
    const { L, map } = ctx;
    await ctx.loadScript("https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js");
    const data = await ctx.loadData("humidity/humidity-cells.json");
    const { minHumidity: min, maxHumidity: max } = data;
    const range = max - min;

    // Each cell is [latitude, longitude, average relative humidity in %, number of readings].
    const points = data.cells.map(([lat, lng, humidity]) => [lat, lng, range ? (humidity - min) / range : 0.5]);
    const layer = L.heatLayer(points, { radius: 18, blur: 22, maxZoom: 17, minOpacity: 0.3, gradient: GRADIENT });

    ctx.setLegend([{ gradient: Object.values(GRADIENT), from: `${min.toFixed(0)} %`, to: `${max.toFixed(0)} %` }]);

    // Grey map tiles while the layer is shown. Its own class, so switching from the heat map does not clash.
    layer.on("add", () => {
      map.getContainer().classList.add("humidity-active");
      map.on("click", showNearestCell);
    });
    layer.on("remove", () => {
      map.getContainer().classList.remove("humidity-active");
      map.off("click", showNearestCell);
    });

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
      const [, , humidity, count] = nearest;
      ctx.panel.show(() => ({
        kicker: ctx.t("kicker"),
        title: `${humidity.toFixed(0)} %`,
        html: `<p>${ctx.escapeHtml(ctx.t("cell", { count, size: data.cellSizeMeters }))}</p>`
          + `<p>${ctx.escapeHtml(ctx.t("range", { min: min.toFixed(0), max: max.toFixed(0) }))}</p>`
          + `<p>${ctx.escapeHtml(ctx.t("note"))}</p>`
      }));
    }

    return layer;
  }
};
