// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH
// Everything brand-specific lives here. Components, Tailwind tokens, index.html
// and the document head all read from this file. To rebrand a store, edit this
// file only — never the components.
//
// The whole look changes from the `theme` values below. `ink` is the near-black,
// `bone` the off-white base, `clay` the single accent used sparingly.
// ─────────────────────────────────────────────────────────────────────────────

export const store = {
  brand: {
    name: "ATELIER",
    fullName: "Atelier Studio",
    tagline: "Considered clothing, made to last. Cash on delivery across Algeria.",
    logoText: "ATELIER",
    logo: "/src/assets/Logo.png",
    favicon: "/src/assets/Logo.png",
  },
  niche: {
    type: "clothing",
    productNoun: "piece",
    productNounPlural: "pieces",
  },
  theme: {
    ink:   "#17130E",   // near-black — text, primary buttons/surfaces
    bone:  "#F3EFE6",   // off-white page base
    paper: "#E9E3D6",   // secondary surface / cards
    clay:  "#B4471F",   // THE accent — links, one CTA, sale marks
    muted: "#8A8272",   // secondary text

    // Legacy aliases kept so nothing referencing the old names breaks.
    primary:   "#17130E",
    secondary: "#B4471F",
    accent:    "#B4471F",
  },
  contact: {
    email:    "hello@atelier.dz",
    phone:    "+213 555 010 203",
    phoneHref: "+213555010203",
    whatsapp: "213555010203",
    address:  "12 Rue Didouche Mourad, Alger, Algeria",
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
    title:       "ATELIER — Considered Clothing",
    description: "Considered clothing, made to last. Outerwear, knitwear and essentials. Cash on delivery across Algeria.",
    ogImage:     "/src/assets/Logo.png",
  },
};

export default store;
