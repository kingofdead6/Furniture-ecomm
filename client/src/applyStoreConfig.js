// Runtime bridge between store.config.js and the DOM.
// - Writes the brand palette into CSS variables so both Tailwind tokens and any
//   inline var(--…) styles follow the config.
// - Syncs the document <title>, <html lang> and favicon from the config.
// This keeps store.config.js the single source of truth without a head-manager.

import { store } from "./store.config.js";

// "#B4471F" -> "180 71 31" (space-separated channels for rgb(... / alpha))
function hexToRgbChannels(hex) {
  let h = String(hex).trim().replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

export function applyStoreConfig() {
  const root = document.documentElement;
  const t = store.theme;

  const setVar = (name, value) => value && root.style.setProperty(name, value);

  setVar("--ink", t.ink);
  setVar("--bone", t.bone);
  setVar("--paper", t.paper);
  setVar("--clay", t.clay);
  setVar("--muted", t.muted);

  // Legacy aliases + rgb channels for alpha usage.
  setVar("--primary", t.ink);
  setVar("--secondary", t.clay);
  setVar("--accent", t.clay);
  if (t.clay) root.style.setProperty("--clay-rgb", hexToRgbChannels(t.clay));
  if (t.ink) root.style.setProperty("--ink-rgb", hexToRgbChannels(t.ink));

  // SEO / head
  if (store.seo?.title) document.title = store.seo.title;
  if (store.locale?.lang) root.setAttribute("lang", store.locale.lang);

  if (store.brand?.favicon) {
    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = store.brand.favicon;
  }

  if (store.seo?.description) {
    let meta = document.querySelector("meta[name='description']");
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = store.seo.description;
  }
}

export default applyStoreConfig;
