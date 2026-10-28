// Creates the Leaflet map of Heilbronn with OpenStreetMap tiles.
export const HEILBRONN = [49.142, 9.219];

export function createMap(element) {
  const map = L.map(element, { zoomControl: false }).setView(HEILBRONN, 14);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  L.control.zoom({ position: "bottomleft" }).addTo(map);

  window.addEventListener("resize", () => map.invalidateSize());
  return map;
}
