// The map key. Each slot can describe its legend as a list of items:
//   { color: "#e47f4e", label: { en: "High", de: "Hoch" } }          a coloured dot
//   { gradient: ["#377eb8", "#d73027"], from: "Cool", to: "Hot" }     a colour scale
// The legend of a layer is shown only while the layer is on the map.
import { escapeHtml } from "./html.js";

export function createLegend(element, i18n) {
  const groups = element.querySelector('[data-role="groups"]');
  const entries = new Map();

  function itemHtml(item) {
    if (item.gradient) {
      const scale = `linear-gradient(90deg, ${item.gradient.join(", ")})`;
      return `<span class="legend-item"><span>${escapeHtml(i18n.pick(item.from))}</span>`
        + `<i class="legend-scale" style="background:${escapeHtml(scale)}"></i>`
        + `<span>${escapeHtml(i18n.pick(item.to))}</span></span>`;
    }
    return `<span class="legend-item"><i class="legend-dot" style="background:${escapeHtml(item.color)}"></i>`
      + `${escapeHtml(i18n.pick(item.label))}</span>`;
  }

  function draw() {
    const visible = [...entries.values()].filter((entry) => entry.visible && entry.items.length);
    groups.innerHTML = visible.map((entry) => `<div class="legend-group">`
      + `<strong>${escapeHtml(i18n.pick(entry.slot.title))}</strong>${entry.items.map(itemHtml).join("")}</div>`).join("");
    element.hidden = visible.length === 0;
  }

  i18n.onChange(draw);

  function entry(slot) {
    if (!entries.has(slot.id)) entries.set(slot.id, { slot, items: slot.legend ?? [], visible: false });
    return entries.get(slot.id);
  }

  return {
    register(slot) { entry(slot); },
    setItems(slot, items) { entry(slot).items = items ?? []; draw(); },
    setVisible(slot, visible) { entry(slot).visible = visible; draw(); }
  };
}
