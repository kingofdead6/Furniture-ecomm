// ─────────────────────────────────────────────────────────────────────────────
// CATALOG SEED (compatibility shim).
//
// The full store setup — admin account + furniture catalog with network-verified
// imagery — lives in scripts/setup.js. This file simply delegates to it so the
// existing `npm run seed` / `node seed/seed.js` entry point keeps working and
// there is a single source of catalog data.
//
// Run:  node seed/seed.js       (or: npm run seed / npm run setup)
// ─────────────────────────────────────────────────────────────────────────────

import '../scripts/setup.js';
