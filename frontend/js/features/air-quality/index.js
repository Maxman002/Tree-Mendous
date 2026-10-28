// Air quality: particulate matter (PM2.5) on 2 Sep 2026. Small dots are bike readings averaged into
// 50 m cells, large circles the stationary senseBox:home sensors. Colours follow the WHO guideline.
// The data is prepared offline by backend/scripts/air-quality/prepare_air_quality.py.
const LEVELS = [
  { max: 5, color: "#4f9d69", label: { en: "Good (≤ 5 µg/m³)", de: "Gut (≤ 5 µg/m³)" } },
  { max: 15, color: "#e9bd50", label: { en: "Moderate (≤ 15 µg/m³)", de: "Mittel (≤ 15 µg/m³)" } },
  { max: Infinity, color: "#d0563b", label: { en: "High (> 15 µg/m³)", de: "Hoch (> 15 µg/m³)" } }
];

function levelOf(pm25) {
  return LEVELS.find((level) => pm25 <= level.max);
}

export default {
  id: "air-quality",
  kind: "base-layer",
  title: { en: "Air quality", de: "Luftqualität" },
  status: "ready",
  source: {
    en: "senseBox:bike and senseBox:home Heilbronn (api.atrai.bike), 2 Sep 2026",
    de: "senseBox:bike und senseBox:home Heilbronn (api.atrai.bike), 2. Sep. 2026"
  },
  icon: "≋",
  legend: [
    ...LEVELS.map(({ color, label }) => ({ color, label })),
    { color: "#9aa39c", label: { en: "Dots: bike rides · circles: fixed sensors", de: "Punkte: Radfahrten · Kreise: feste Sensoren" } }
  ],

  async init(ctx) {
    const { L } = ctx;
    const data = await ctx.loadData("air-quality/pm.json");
    const renderer = L.canvas({ padding: 0.3 });
    const layer = L.layerGroup();
    const values = (pm25, pm10) => `<dl><dt>PM2.5</dt><dd>${ctx.escapeHtml(pm25.toFixed(1))} µg/m³</dd>`
      + `<dt>PM10</dt><dd>${ctx.escapeHtml(pm10.toFixed(1))} µg/m³</dd></dl>`
      + `<p>${ctx.escapeHtml(ctx.pick(levelOf(pm25).label))}</p>`;

    // Each cell is [latitude, longitude, PM2.5, PM10, number of readings].
    data.cells.forEach(([lat, lng, pm25, pm10, count]) => {
      L.circleMarker([lat, lng], { renderer, radius: 5, stroke: false, fillColor: levelOf(pm25).color, fillOpacity: 0.8 })
        .on("click", () => ctx.panel.show(() => ({
          kicker: ctx.t("kicker"),
          title: `${pm25.toFixed(1)} µg/m³`,
          html: values(pm25, pm10) + `<p>${ctx.escapeHtml(ctx.t("cell", { count, size: data.cellSizeMeters }))}</p>`
        })))
        .addTo(layer);
    });

    data.stations.forEach((station) => {
      L.circleMarker(station.coordinates, { renderer, radius: 12, color: "white", weight: 3, fillColor: levelOf(station.pm2_5).color, fillOpacity: 0.95 })
        .on("click", () => ctx.panel.show(() => ({
          kicker: ctx.t("stationKicker"),
          title: station.name,
          html: values(station.pm2_5, station.pm10) + `<p>${ctx.escapeHtml(ctx.t("station", { count: station.count }))}</p>`
        })))
        .addTo(layer);
    });

    return layer;
  }
};
