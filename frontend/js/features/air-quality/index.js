// Air quality: particulate matter (PM2.5) per sensor, as coloured circles. Placeholder with sample values.
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
  status: "placeholder",
  source: "senseBox:home Heilbronn (api.atrai.bike)",
  icon: "≋",
  legend: LEVELS.map(({ color, label }) => ({ color, label })),

  async init(ctx) {
    const data = await ctx.loadData("air-quality/sample.geojson");

    return ctx.L.geoJSON(data, {
      pointToLayer: (feature, latlng) => {
        const { color } = levelOf(feature.properties.pm2_5);
        return ctx.L.circleMarker(latlng, { radius: 11, color: "white", weight: 2, fillColor: color, fillOpacity: 0.85 });
      },
      onEachFeature: (feature, layer) => {
        layer.on("click", () => {
          const { name, pm2_5: pm25, pm10 } = feature.properties;
          ctx.panel.show(() => ({
            kicker: ctx.t("kicker"),
            title: name,
            html: `<dl><dt>PM2.5</dt><dd>${ctx.escapeHtml(pm25)} µg/m³</dd><dt>PM10</dt><dd>${ctx.escapeHtml(pm10)} µg/m³</dd></dl>`
              + `<p>${ctx.escapeHtml(ctx.pick(levelOf(pm25).label))}</p>`
          }));
        });
      }
    });
  }
};
