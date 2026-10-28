// Weather stations: the stationary senseBox:home sensors with their temperature on 2 Sep 2026.
// The marker shows the day's mean; the card adds minimum, maximum, humidity and an hourly chart.
// The data is prepared offline by backend/scripts/weather-stations/prepare_weather_stations.py.
const CHART_WIDTH = 240;
const CHART_HEIGHT = 70;

function chart(hourly, escapeHtml) {
  const known = hourly.filter((value) => value != null);
  if (known.length < 2) return "";
  const min = Math.min(...known);
  const max = Math.max(...known);
  const x = (hour) => (hour / 23) * CHART_WIDTH;
  const y = (value) => CHART_HEIGHT - 6 - ((value - min) / Math.max(max - min, 0.1)) * (CHART_HEIGHT - 12);
  // A gap in the data (no readings in that hour) also breaks the line.
  const path = hourly.map((value, hour) => (value == null ? "" : `${hourly[hour - 1] == null ? "M" : "L"}${x(hour).toFixed(1)} ${y(value).toFixed(1)}`)).join(" ");
  return `<svg class="ws-chart" viewBox="0 0 ${CHART_WIDTH} ${CHART_HEIGHT + 14}" role="img" aria-label="${escapeHtml(`${min.toFixed(1)}–${max.toFixed(1)} °C`)}">`
    + `<path d="${path}" />`
    + `<text x="0" y="${CHART_HEIGHT + 12}">00:00</text><text x="${CHART_WIDTH / 2}" y="${CHART_HEIGHT + 12}" text-anchor="middle">12:00</text>`
    + `<text x="${CHART_WIDTH}" y="${CHART_HEIGHT + 12}" text-anchor="end">23:00</text></svg>`;
}

export default {
  id: "weather-stations",
  kind: "overlay",
  title: { en: "Weather stations", de: "Wetterstationen" },
  status: "ready",
  source: {
    en: "senseBox:home Heilbronn (api.atrai.bike, osem_home_data_heilbronn), 2 Sep 2026",
    de: "senseBox:home Heilbronn (api.atrai.bike, osem_home_data_heilbronn), 2. Sep. 2026"
  },
  icon: "☂",
  style: "style.css",
  legend: [{ color: "#3f6f8f", label: { en: "Station, daily mean temperature", de: "Station, Tagesmittel der Temperatur" } }],

  async init(ctx) {
    const { L } = ctx;
    const data = await ctx.loadData("weather-stations/stations.json");
    const layer = L.layerGroup();
    const format = (value, unit) => (value == null ? "–" : `${value.toFixed(1)} ${unit}`);

    data.stations.filter((station) => station.temperature).forEach((station) => {
      const icon = L.divIcon({
        className: "",
        html: `<span class="ws-marker">${ctx.escapeHtml(station.temperature.mean.toFixed(0))}°</span>`,
        iconSize: [38, 24],
        iconAnchor: [19, 12]
      });
      L.marker(station.coordinates, { icon, title: station.name })
        .on("click", () => ctx.panel.show(() => card(station)))
        .addTo(layer);
    });

    function card(station) {
      const { temperature, humidity, pm2_5: pm25 } = station;
      const time = (iso) => iso.slice(11, 16);
      return {
        kicker: ctx.t("kicker"),
        title: station.name,
        html: `<dl><dt>${ctx.escapeHtml(ctx.t("mean"))}</dt><dd>${format(temperature.mean, "°C")}</dd>`
          + `<dt>${ctx.escapeHtml(ctx.t("range"))}</dt><dd>${format(temperature.min, "°C")} – ${format(temperature.max, "°C")}</dd>`
          + `<dt>${ctx.escapeHtml(ctx.t("humidity"))}</dt><dd>${format(humidity?.mean, "%")}</dd>`
          + `<dt>PM2.5</dt><dd>${format(pm25?.mean, "µg/m³")}</dd></dl>`
          + chart(temperature.hourly, ctx.escapeHtml)
          + `<p>${ctx.escapeHtml(ctx.t("recorded", { from: time(station.from), to: time(station.to), count: temperature.count }))}</p>`
          + `<p>${ctx.escapeHtml(ctx.t("distance", { km: station.distanceKm.toLocaleString(ctx.language === "de" ? "de-DE" : "en-GB") }))}</p>`
      };
    }

    return layer;
  }
};
