// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH
// Everything brand-specific lives here. Components, Tailwind tokens, index.html
// and the document head all read from this file. To rebrand a store, edit this
// file only — never the components.
//
// The whole look changes from the `theme` values below. `ink` is the near-black,
// `bone` the warm off-white base, `clay` the single accent (a deep sage green).
// ─────────────────────────────────────────────────────────────────────────────

export const store = {
  brand: {
    name: "MAISON",
    fullName: "Maison Interiors",
    tagline: "Furniture made to live with. Considered pieces for the modern home, delivered across Algeria.",
    logoText: "MAISON",
    logo: "/src/assets/Logo.png",
    favicon: "/src/assets/Logo.png",
  },
  niche: {
    type: "furniture",
    productNoun: "piece",
    productNounPlural: "pieces",
  },
  theme: {
    ink:   "#23201A",   // warm espresso near-black — text, primary buttons/surfaces
    bone:  "#F2EDE4",   // warm ivory page base
    paper: "#E7E0D2",   // secondary surface / cards
    clay:  "#4F5D44",   // THE accent — deep sage green: links, one CTA, sale marks
    muted: "#857C6A",   // secondary text

    // Legacy aliases kept so nothing referencing the old names breaks.
    primary:   "#23201A",
    secondary: "#4F5D44",
    accent:    "#4F5D44",
  },
  contact: {
    email:    "hello@maison.dz",
    phone:    "+213 555 070 809",
    phoneHref: "+213555070809",
    whatsapp: "213555070809",
    address:  "24 Rue Larbi Ben M'hidi, Alger, Algeria",
  },
  social: {
    instagram: "https://instagram.com",
    facebook:  "https://facebook.com",
    tiktok:    "https://tiktok.com",
  },
  locale: {
    currency:       "DZD",
    currencySymbol: "DA",
    locale:         "fr-DZ",
    lang:           "en",
  },
  seo: {
    title:       "MAISON — Furniture for the Modern Home",
    description: "Considered furniture and lighting for the modern home — sofas, tables, storage and more. Cash on delivery across Algeria.",
    ogImage:     "/src/assets/Logo.png",
  },
};

export default store;
