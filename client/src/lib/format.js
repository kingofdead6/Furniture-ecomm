import { store } from "../store.config.js";

const { locale, currencySymbol } = store.locale;

// "12 900 DA" — grouped, no decimals, brand currency symbol.
export function formatPrice(amount) {
  const n = Number(amount) || 0;
  return `${n.toLocaleString(locale || "fr-DZ")} ${currencySymbol}`;
}

export function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(locale || "fr-DZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
