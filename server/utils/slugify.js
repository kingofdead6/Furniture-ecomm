// Shared slug generator so products, categories, and collections all derive
// URL-safe slugs identically.
export const slugify = (name) =>
  String(name)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
