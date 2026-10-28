// The list of slots the website loads, in the order they appear in the sidebar.
// To add a slot: import its folder's index.js here and add it to the list.
import heatmap from "./heatmap/index.js";
import airQuality from "./air-quality/index.js";
import pointsOfInterest from "./points-of-interest/index.js";
import weatherStations from "./weather-stations/index.js";
import birdhouses from "./birdhouses/index.js";
import tour from "./tour/index.js";

export default [
  heatmap,
  airQuality,
  pointsOfInterest,
  weatherStations,
  birdhouses,
  tour
];
