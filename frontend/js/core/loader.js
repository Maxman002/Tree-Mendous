// Loads static files: slot data from frontend/data/, plus external scripts a slot needs (e.g. a Leaflet plugin).
const DATA_ROOT = new URL("../../data/", import.meta.url);
const scripts = new Map();

// loadData("air-quality/sample.geojson"): .json and .geojson come back parsed, anything else as text.
export async function loadData(path) {
  const url = new URL(path, DATA_ROOT);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load data/${path} (${response.status} ${response.statusText})`);
  }
  return /\.(geo)?json$/i.test(url.pathname) ? response.json() : response.text();
}

// Adds a <script> once and resolves when it has loaded.
export function loadScript(src) {
  if (!scripts.has(src)) {
    scripts.set(src, new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Could not load script ${src}`));
      document.head.append(script);
    }));
  }
  return scripts.get(src);
}
