// The info panel on the map. A slot shows a clicked feature with panel.show(render), where render()
// returns { kicker, title, html }. The panel calls render() again when the language changes and
// adds the slot's source (and a "sample data" note for placeholders) at the bottom.
export function createPanel(element, i18n) {
  const part = (role) => element.querySelector(`[data-role="${role}"]`);
  let current = null;

  function draw() {
    if (!current) {
      element.hidden = true;
      return;
    }
    const { kicker = "", title = "", html = "" } = current.render();
    const { slot } = current;
    part("kicker").textContent = kicker;
    part("title").textContent = title;
    part("body").innerHTML = html;
    const sample = slot.status === "placeholder" ? ` · ${i18n.t("core.status.sampleNote")}` : "";
    part("source").textContent = `${i18n.t("core.panel.source")}: ${i18n.pick(slot.source)}${sample}`;
    element.hidden = false;
  }

  element.querySelector(".info-close").addEventListener("click", () => close());
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
  i18n.onChange(draw);

  function show(slot, render) {
    current = { slot, render };
    draw();
  }

  // close() closes any panel; close(slot) only closes it if that slot opened it.
  function close(slot) {
    if (slot && current?.slot !== slot) return;
    current = null;
    draw();
  }

  return { show, close };
}
