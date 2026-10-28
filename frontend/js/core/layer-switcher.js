// The layer switcher in the sidebar. Base layers are radio buttons (only one on the map at a time),
// overlays are checkboxes. A slot's legend is shown while its layer is on the map.
export function createLayerSwitcher({ map, i18n, legend, baseList, overlayList }) {
  const rows = [];

  function addRow(slot, layer, error) {
    const isBase = slot.kind === "base-layer";
    const row = document.createElement("label");
    row.className = "layer-row";
    row.innerHTML = `
      <span class="layer-symbol" aria-hidden="true"></span>
      <span class="layer-copy"><strong><span data-part="title"></span></strong><small data-part="note"></small></span>
      <input type="${isBase ? "radio" : "checkbox"}" ${isBase ? 'name="base-layer"' : ""}>
      <span class="toggle${isBase ? " is-radio" : ""}" aria-hidden="true"></span>`;
    row.querySelector(".layer-symbol").textContent = slot.icon ?? "◉";
    if (slot.status === "placeholder") {
      const badge = document.createElement("span");
      badge.className = "status-badge";
      badge.dataset.part = "badge";
      row.querySelector("strong").append(badge);
    }

    const input = row.querySelector("input");
    input.value = slot.id;
    if (error || !layer) {
      row.classList.add("is-failed");
      input.disabled = true;
    } else {
      layer.on("add", () => legend.setVisible(slot, true));
      layer.on("remove", () => legend.setVisible(slot, false));
      input.addEventListener("change", () => (isBase ? showBase(slot.id) : toggle(layer, input.checked)));
    }

    (isBase ? baseList : overlayList).append(row);
    rows.push({ slot, layer, error, row, input });
    drawRow(rows.at(-1));
  }

  function drawRow({ slot, error, row }) {
    row.querySelector('[data-part="title"]').textContent = i18n.pick(slot.title);
    const badge = row.querySelector('[data-part="badge"]');
    if (badge) badge.textContent = i18n.t("core.status.placeholder");
    row.querySelector('[data-part="note"]').textContent = error ? i18n.t("core.layers.failed") : i18n.pick(slot.source);
  }

  function toggle(layer, on) {
    if (on) layer.addTo(map);
    else map.removeLayer(layer);
  }

  function showBase(id) {
    rows.filter((entry) => entry.slot.kind === "base-layer" && entry.layer).forEach((entry) => {
      const on = entry.slot.id === id;
      entry.input.checked = on;
      toggle(entry.layer, on);
    });
  }

  i18n.onChange(() => rows.forEach(drawRow));

  return {
    add(slot, layer, error) {
      legend.register(slot);
      addRow(slot, layer, error);
    },
    // Turns on the layers marked `visible: true`. If no base layer is marked, the first one that loaded is shown.
    showDefaults() {
      const usable = rows.filter((entry) => entry.layer && !entry.error);
      const bases = usable.filter((entry) => entry.slot.kind === "base-layer");
      const base = bases.find((entry) => entry.slot.visible) ?? bases[0];
      if (base) showBase(base.slot.id);
      usable.filter((entry) => entry.slot.kind === "overlay" && entry.slot.visible).forEach((entry) => {
        entry.input.checked = true;
        toggle(entry.layer, true);
      });
    }
  };
}
