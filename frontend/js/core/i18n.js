// UI texts from i18n/<lang>.json. English is the default and the fallback for missing German texts.
export const LANGUAGES = ["en", "de"];
const STORAGE_KEY = "tree-mendous-lang";

function lookup(dictionary, key) {
  return key.split(".").reduce((node, part) => node?.[part], dictionary);
}

function readStoredLanguage() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function createI18n() {
  const dictionaries = {};
  await Promise.all(LANGUAGES.map(async (language) => {
    const response = await fetch(`i18n/${language}.json`);
    dictionaries[language] = response.ok ? await response.json() : {};
  }));

  const stored = readStoredLanguage();
  let language = LANGUAGES.includes(stored) ? stored : "en";
  const listeners = new Set();

  // t("core.layers.base") or t("routes.add", { count: 3 }) for "{count}" placeholders.
  function t(key, values) {
    const text = lookup(dictionaries[language], key) ?? lookup(dictionaries.en, key) ?? key;
    if (typeof text !== "string" || !values) return text;
    return text.replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match);
  }

  // pick({ en: "Air quality", de: "Luftqualität" }) returns the text in the current language.
  function pick(value) {
    if (value == null) return "";
    if (typeof value !== "object") return String(value);
    return value[language] || value.en || "";
  }

  function apply(root = document) {
    document.documentElement.lang = language;
    root.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = t(element.dataset.i18n);
    });
    root.querySelectorAll("[data-i18n-label]").forEach((element) => {
      element.setAttribute("aria-label", t(element.dataset.i18nLabel));
    });
  }

  function setLanguage(next) {
    if (!LANGUAGES.includes(next) || next === language) return;
    language = next;
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Private mode: the choice just isn't remembered.
    }
    apply();
    listeners.forEach((listener) => listener(language));
  }

  return {
    t,
    pick,
    apply,
    setLanguage,
    get language() { return language; },
    onChange(listener) { listeners.add(listener); }
  };
}
