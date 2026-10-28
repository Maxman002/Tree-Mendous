// Starts the website: map, core UI, then every slot from features/index.js.
import { createMap } from "./core/map.js";
import { createI18n } from "./core/i18n.js";
import { loadData, loadScript } from "./core/loader.js";
import { escapeHtml } from "./core/html.js";
import { createPanel } from "./core/panel.js";
import { createLegend } from "./core/legend.js";
import { createLayerSwitcher } from "./core/layer-switcher.js";
import { createToolCard } from "./core/tools.js";
import { createToast } from "./core/toast.js";
import { initSlots } from "./core/registry.js";
import slots from "./features/index.js";

const i18n = await createI18n();
i18n.apply();

const languageButtons = document.querySelectorAll("#lang-switch [data-lang]");
function markLanguage() {
  languageButtons.forEach((button) => {
    const selected = button.dataset.lang === i18n.language;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}
languageButtons.forEach((button) => button.addEventListener("click", () => i18n.setLanguage(button.dataset.lang)));
i18n.onChange(markLanguage);
markLanguage();

const map = createMap(document.getElementById("map"));
const panel = createPanel(document.getElementById("info-panel"), i18n);
const legend = createLegend(document.getElementById("legend"), i18n);
const notify = createToast(document.getElementById("toast"));
const switcher = createLayerSwitcher({
  map,
  i18n,
  legend,
  panel,
  baseList: document.getElementById("base-layers"),
  overlayList: document.getElementById("overlay-layers")
});
const toolCards = new Map();

// The ctx object every slot's init(ctx) receives. See AGENT.md for what each entry does.
function createContext(slot) {
  const ctx = {
    map,
    L: window.L,
    loadData,
    loadScript,
    escapeHtml,
    notify,
    t: (key, values) => i18n.t(`${slot.id}.${key}`, values),
    pick: (value) => i18n.pick(value),
    get language() { return i18n.language; },
    onLanguageChange: (listener) => i18n.onChange(listener),
    panel: {
      show: (render) => panel.show(slot, render),
      close: () => panel.close(slot)
    },
    setLegend: (items) => legend.setItems(slot, items)
  };
  if (slot.kind === "tool") {
    const card = createToolCard(document.getElementById("tools"), slot, i18n);
    toolCards.set(slot.id, card);
    ctx.el = card.body;
  }
  return ctx;
}

const loaded = await initSlots(slots, createContext);
loaded.forEach(({ slot, layer, error }) => {
  if (slot.kind === "tool") {
    if (error) toolCards.get(slot.id).fail();
    else layer?.addTo(map);
  } else {
    switcher.add(slot, layer, error);
  }
});
switcher.showDefaults();
document.getElementById("tools").closest("section").hidden = toolCards.size === 0;
