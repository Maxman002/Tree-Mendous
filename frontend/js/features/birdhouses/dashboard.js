// The bird dashboard: a full-screen view over the map with a ring chart of visits per species,
// a share donut, an info card per bird (photo, German and English name, weight, fact) and key
// numbers. Opened from a birdhouse card. On a display screen it cycles through the birds by itself
// after a while without input.
import { birdAvatar, loadPhotos, photoFor } from "./photos.js";

const QR_SCRIPT = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
const UNCERTAIN_COLOR = "#c3c8bf";
const IDLE_START_MS = 30_000;
const IDLE_STEP_MS = 9_000;
const SVG_NS = "http://www.w3.org/2000/svg";

export function createDashboard(ctx, species) {
  const esc = ctx.escapeHtml;
  let birdhouse = null;
  let range = "recent";
  let selected = null;
  let items = [];
  let total = 0;
  let lastInput = Date.now();
  let idleTimer = null;

  const root = document.createElement("div");
  root.className = "bird-dashboard";
  root.hidden = true;
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  document.body.append(root);

  root.addEventListener("click", (event) => {
    lastInput = Date.now();
    const target = event.target.closest("[data-key], [data-range], [data-action]");
    if (!target) return;
    if (target.dataset.action === "close") close();
    else if (target.dataset.action === "fullscreen") toggleFullscreen();
    else if (target.dataset.range) { range = target.dataset.range; render(); }
    else if (target.dataset.key) select(target.dataset.key);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !root.hidden) close();
  });
  ctx.onLanguageChange(() => { if (!root.hidden) render(); });

  /* ---------- names and numbers ---------- */
  const locale = () => (ctx.language === "de" ? "de-DE" : "en-GB");
  const number = (value) => Number(value).toLocaleString(locale());
  const percent = (value) => {
    const p = 100 * value / Math.max(total, 1);
    return `${p.toLocaleString(locale(), { maximumFractionDigits: p < 1 ? 1 : 0 })} %`;
  };
  const date = (iso) => new Date(iso).toLocaleDateString(locale(), { day: "numeric", month: "short", year: "numeric" });
  const nameOf = (item) => (item.key === "uncertain" ? ctx.t("uncertain") : ctx.language === "de" ? item.de : item.en);
  const otherNameOf = (item) => (item.key === "uncertain" ? ctx.t("uncertainSub") : ctx.language === "de" ? item.en : item.de);
  const avatar = (item, size) => birdAvatar({
    latin: item.latin, color: item.color, size,
    label: item.key === "uncertain" ? "?" : nameOf(item).slice(0, 2)
  }, esc);

  function buildItems() {
    const data = birdhouse.birds.ranges[range];
    total = data.total;
    items = data.species
      .filter((bird) => species[bird.latin])
      .map((bird) => ({ ...species[bird.latin], ...bird, key: bird.latin }))
      .sort((a, b) => b.count - a.count);
    const uncertain = total - items.reduce((sum, item) => sum + item.count, 0);
    if (uncertain > 0) items.push({ key: "uncertain", latin: "", color: UNCERTAIN_COLOR, count: uncertain });
    if (!items.some((item) => item.key === selected)) selected = items[0]?.key ?? null;
    return data;
  }

  /* ---------- SVG helpers ---------- */
  const svgEl = (tag, attrs, parent) => {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    parent?.append(node);
    return node;
  };
  const polar = (cx, cy, r, degrees) => {
    const angle = (degrees - 90) * Math.PI / 180;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  };
  const arc = (cx, cy, r, from, to) => {
    const [x0, y0] = polar(cx, cy, r, from);
    const [x1, y1] = polar(cx, cy, r, to);
    return `M${x0} ${y0} A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x1} ${y1}`;
  };
  const grow = (path) => requestAnimationFrame(() => requestAnimationFrame(() => path.setAttribute("stroke-dashoffset", 0)));

  /* ---------- drawing ---------- */
  function render() {
    const data = buildItems();
    const camera = birdhouse.link;
    root.innerHTML = `
      <div class="bd-wrap">
        <header class="bd-header">
          <div>
            <p class="bd-kicker">${esc(ctx.t("kicker"))}</p>
            <h2>${esc(ctx.t("dashTitle"))}</h2>
            <p class="bd-sub">${esc(ctx.pick(birdhouse.name))} · ${esc(ctx.t("dashSubtitle"))}</p>
          </div>
          <div class="bd-controls">
            <div class="bd-toggle" role="group">
              <button type="button" data-range="recent" class="${range === "recent" ? "is-on" : ""}">${esc(ctx.t("rangeRecent"))}</button>
              <button type="button" data-range="all" class="${range === "all" ? "is-on" : ""}">${esc(ctx.t("rangeAll", { date: date(birdhouse.birds.ranges.all.from) }))}</button>
            </div>
            ${camera ? `<a class="bd-camera" href="${esc(camera)}" target="_blank" rel="noopener noreferrer">● ${esc(ctx.t("camera"))}</a>` : ""}
            <button type="button" class="bd-icon" data-action="fullscreen" title="${esc(ctx.t("fullscreen"))}" aria-label="${esc(ctx.t("fullscreen"))}">⛶</button>
            <button type="button" class="bd-icon" data-action="close" title="${esc(ctx.t("close"))}" aria-label="${esc(ctx.t("close"))}">×</button>
          </div>
        </header>

        <main class="bd-grid">
          <section class="bd-card">
            <h3>${esc(ctx.t("visitsPerSpecies"))}</h3>
            <div class="bd-radial">
              <svg class="bd-rings" viewBox="0 0 460 460" role="img" aria-label="${esc(ctx.t("visitsPerSpecies"))}"></svg>
              <div class="bd-legend">${items.map((item) => `
                <button type="button" data-key="${esc(item.key)}">
                  ${avatar(item, 52)}
                  <span class="bd-name">${esc(nameOf(item))}<small>${esc(otherNameOf(item))}</small></span>
                  <span class="bd-count">${number(item.count)}</span>
                </button>`).join("")}
              </div>
            </div>
          </section>

          <div class="bd-side">
            <section class="bd-card">
              <h3>${esc(ctx.t("share"))}</h3>
              <div class="bd-share">
                <svg class="bd-donut" viewBox="0 0 200 200" role="img" aria-label="${esc(ctx.t("share"))}"></svg>
                <div class="bd-bars">${items.map((item) => `
                  <div class="bd-bar" data-key="${esc(item.key)}">
                    <span>${esc(nameOf(item))}</span>
                    <span class="bd-bar-track"><span class="bd-bar-fill" style="background:${esc(item.color)}" data-width="${Math.max(100 * item.count / total, 0.6)}"></span></span>
                    <span class="bd-bar-pct">${percent(item.count)}</span>
                  </div>`).join("")}
                </div>
              </div>
            </section>
            <section class="bd-card bd-info" aria-live="polite"></section>
          </div>
        </main>

        <section class="bd-kpis">${kpis(data)}</section>
        <p class="bd-footer">${esc(ctx.t("footer"))}</p>
      </div>`;

    drawRings();
    drawDonut();
    requestAnimationFrame(() => requestAnimationFrame(() => root.querySelectorAll(".bd-bar-fill")
      .forEach((bar) => { bar.style.width = `${bar.dataset.width}%`; })));
    loadPhotos(root);
    drawQr(camera);
    select(selected, false);
  }

  function drawRings() {
    const svg = root.querySelector(".bd-rings");
    const cx = 230, cy = 230, outer = 205, inner = 78;
    const step = (outer - inner) / items.length;
    const width = Math.min(step * 0.62, 18);
    const max = Math.max(...items.map((item) => item.count));

    // The most frequent bird fills three quarters of its ring, like the reference chart.
    for (let k = 0; k <= 4; k++) {
      const [x, y] = polar(cx, cy, outer + 18, 270 * k / 4);
      svgEl("text", { x, y, class: "bd-tick", "text-anchor": "middle", "dominant-baseline": "middle" }, svg)
        .textContent = number(Math.round(max * k / 4));
    }
    items.forEach((item, index) => {
      const r = outer - index * step - step / 2;
      svgEl("circle", { cx, cy, r, class: "bd-track", "stroke-width": width }, svg);
      const path = svgEl("path", {
        d: arc(cx, cy, r, 0, Math.max(270 * item.count / max, 2)), class: "bd-arc", stroke: item.color,
        "stroke-width": width, pathLength: 100, "stroke-dasharray": 100, "stroke-dashoffset": 100, "data-key": item.key
      }, svg);
      grow(path);
      svgEl("text", { x: cx - 10, y: cy - r, class: "bd-ring-label", "text-anchor": "end", "dominant-baseline": "middle", "data-key": item.key }, svg)
        .textContent = nameOf(item);
    });
    svgEl("text", { x: cx, y: cy - 4, class: "bd-center-number", "text-anchor": "middle" }, svg).textContent = number(total);
    svgEl("text", { x: cx, y: cy + 20, class: "bd-center-label", "text-anchor": "middle" }, svg).textContent = ctx.t("visits");
  }

  function drawDonut() {
    const svg = root.querySelector(".bd-donut");
    const cx = 100, cy = 100, r = 72, gap = 1.5;
    let start = 0;
    svgEl("circle", { cx, cy, r, class: "bd-track", "stroke-width": 26 }, svg);
    items.forEach((item) => {
      const sweep = Math.max(360 * item.count / total, 1.5);
      svgEl("path", {
        d: arc(cx, cy, r, start + gap / 2, Math.min(start + sweep - gap / 2, 359.9)),
        class: "bd-slice", stroke: item.color, "stroke-width": 26, "data-key": item.key
      }, svg);
      start += sweep;
    });
    svgEl("text", { x: cx, y: cy - 2, class: "bd-center-number bd-small", "text-anchor": "middle", "data-role": "pct" }, svg);
    svgEl("text", { x: cx, y: cy + 18, class: "bd-center-label bd-small", "text-anchor": "middle", "data-role": "name" }, svg);
  }

  function kpiRing(fraction, color) {
    const r = 26, length = 2 * Math.PI * r;
    return `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="${r}" class="bd-track" stroke-width="6"/>`
      + `<circle cx="32" cy="32" r="${r}" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round"`
      + ` stroke-dasharray="${length * Math.min(fraction, 1)} ${length}" transform="rotate(-90 32 32)"/></svg>`;
  }

  function kpis(data) {
    const confirmed = items.filter((item) => item.key !== "uncertain");
    const confirmedVisits = confirmed.reduce((sum, item) => sum + item.count, 0);
    const corrected = confirmed.reduce((sum, item) => sum + (item.corrected || 0), 0);
    const days = Math.max(1, Math.round((new Date(data.to) - new Date(data.from)) / 864e5));
    const perDay = confirmedVisits / days;
    const tile = (ring, value, label) => `<div class="bd-card bd-kpi">${ring}<div><b>${value}</b><span>${esc(label)}</span></div></div>`;
    return tile(kpiRing(confirmedVisits / Math.max(total, 1), "#3a8cc1"), percent(confirmedVisits), ctx.t("kpiIdentified"))
      + tile(kpiRing(confirmed.length / Object.keys(species).length, "#2c6849"), number(confirmed.length), ctx.t("kpiSpecies"))
      + tile(kpiRing(corrected / Math.max(confirmedVisits, 1), "#e3ad2b"), number(corrected), ctx.t("kpiCorrected"))
      + tile(kpiRing(perDay / 20, "#c9773e"), perDay.toLocaleString(locale(), { maximumFractionDigits: 1 }), ctx.t("kpiPerDay"))
      + `<div class="bd-card bd-qr"><div class="bd-qr-code"></div><span>${esc(ctx.t("qr"))}</span></div>`;
  }

  async function drawQr(url) {
    const box = root.querySelector(".bd-qr-code");
    if (!url || !box) return;
    try {
      await ctx.loadScript(QR_SCRIPT);
      new window.QRCode(box, { text: url, width: 192, height: 192, colorDark: "#20342c", colorLight: "#ffffff" });
    } catch {
      box.outerHTML = `<a class="bd-qr-fallback" href="${esc(url)}" target="_blank" rel="noopener noreferrer">wiediversistmeingarten.org</a>`;
    }
  }

  /* ---------- selecting a bird ---------- */
  function select(key, byUser = true) {
    if (!key) return;
    selected = key;
    if (byUser) lastInput = Date.now();
    const item = items.find((entry) => entry.key === key);
    root.querySelectorAll(".bd-rings, .bd-donut").forEach((svg) => svg.classList.add("is-dimmed"));
    root.querySelectorAll("[data-key]").forEach((node) => node.classList.toggle("is-on", node.dataset.key === key));
    root.querySelectorAll(".bd-slice").forEach((slice) => slice.setAttribute("stroke-width", slice.dataset.key === key ? 32 : 26));
    root.querySelector('[data-role="pct"]').textContent = percent(item.count);
    root.querySelector('[data-role="name"]').textContent = nameOf(item).toUpperCase();

    const info = root.querySelector(".bd-info");
    if (key === "uncertain") {
      info.innerHTML = `
        <div class="bd-info-head">${avatar(item, 76)}
          <div><h3 class="bd-bird">${esc(nameOf(item))}</h3><p class="bd-latin">${esc(otherNameOf(item))}</p></div></div>
        <div class="bd-stats">
          <div><b>${number(item.count)}</b><span>${esc(ctx.t("visits"))}</span></div>
          <div><b>${percent(item.count)}</b><span>${esc(ctx.t("ofAll"))}</span></div>
          <div><b>10–30 g</b><span>${esc(ctx.t("uncertainWeight"))}</span></div>
        </div>
        <p class="bd-fact">${esc(ctx.t("uncertainText"))}</p>
        <p class="bd-note is-warning">${esc(ctx.t("uncertainNote"))}</p>`;
      return;
    }
    const rangeLabel = range === "recent" ? ctx.t("rangeRecent") : ctx.t("rangeAll", { date: date(birdhouse.birds.ranges.all.from) });
    info.innerHTML = `
      <div class="bd-info-head">${avatar(item, 76)}
        <div>
          <h3 class="bd-bird">${esc(nameOf(item))}</h3>
          <p class="bd-latin"><span lang="${ctx.language === "de" ? "en" : "de"}">${esc(otherNameOf(item))}</span> · <i>${esc(item.latin)}</i></p>
          <p class="bd-share-line" style="color:${esc(item.color)}">${esc(ctx.t("ofAllVisits", { pct: percent(item.count) }))}</p>
        </div>
      </div>
      <div class="bd-stats">
        <div><b>${number(item.count)}</b><span>${esc(ctx.t("visits"))} · ${esc(rangeLabel)}</span></div>
        <div><b>${item.avgWeight == null ? "–" : `${item.avgWeight.toLocaleString(locale())} g`}</b><span>${esc(ctx.t("avgWeight"))}</span></div>
        <div><b>${esc(item.typicalWeight)}</b><span>${esc(ctx.t("typicalWeight"))}</span></div>
      </div>
      <p class="bd-fact">${esc(ctx.pick(item.fact))}</p>
      ${item.corrected ? `<p class="bd-note">${esc(ctx.t("corrected", { count: number(item.corrected) }))}</p>` : ""}
      <p class="bd-seen">${esc(ctx.t("firstLast", { first: date(item.firstSeen), last: date(item.lastSeen) }))}<span class="bd-credit"></span></p>`;
    loadPhotos(info);
    photoFor(item.latin).then((photo) => {
      const credit = info.querySelector(".bd-credit");
      if (photo && credit && selected === key) {
        credit.innerHTML = ` · ${esc(ctx.t("photo"))}: <a href="${esc(photo.page)}" target="_blank" rel="noopener noreferrer">Wikipedia / Wikimedia Commons</a>`;
      }
    });
  }

  /* ---------- open, close, display mode ---------- */
  function cycle() {
    if (root.hidden || Date.now() - lastInput < IDLE_START_MS || !items.length) return;
    const keys = items.map((item) => item.key);
    select(keys[(keys.indexOf(selected) + 1) % keys.length], false);
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else root.requestFullscreen?.();
  }

  function open(target) {
    if (!target?.birds) return;
    birdhouse = target;
    selected = null;
    lastInput = Date.now();
    root.hidden = false;
    document.body.classList.add("bird-dashboard-open");
    render();
    clearInterval(idleTimer);
    idleTimer = setInterval(cycle, IDLE_STEP_MS);
  }

  function close() {
    if (root.hidden) return;
    root.hidden = true;
    document.body.classList.remove("bird-dashboard-open");
    clearInterval(idleTimer);
    if (document.fullscreenElement === root) document.exitFullscreen();
  }

  return { open, close };
}
