// ─────────────────────────────────────────────────────────────────────────────
// STORE SETUP — one-shot script that fills the store with a full catalog.
//
//   1. Creates (or upserts) an admin account.
//   2. Seeds 8 categories, ~24 furniture products with finish/size variants,
//      3 collections, coupons, Algerian delivery areas and sample reviews.
//   3. Guarantees REAL, WORKING product photography:
//        · Every candidate image URL is fetched over the network first and only
//          kept if it returns 200.
//        · If a product's own photos are unreachable, it borrows another photo
//          from ITS OWN CATEGORY pool — so a sofa always shows a sofa, never a
//          random stock image.
//        · Only if a whole category pool is unreachable does it fall back to a
//          generic photo, and the run reports exactly which products that hit.
//
// Usage:
//   npm run setup            (or: node scripts/setup.js)
//   npm run setup -- --dry   verify images + print the plan, touch nothing
//
// Environment (server/.env is read automatically):
//   MONGO_URI          (required, except with --dry) MongoDB connection string
//   ADMIN_EMAIL        admin login email      (default admin@maison.dz)
//   ADMIN_PASSWORD     admin password         (default changeme123)
//   ADMIN_NAME         admin display name     (default Store Admin)
//   SKIP_IMAGE_CHECK=1 skip the network image check (offline / faster)
//   STRICT_IMAGES=1    abort if any product would fall back to a generic photo
//
// Custom photography:
//   Drop a scripts/images.local.json file shaped like
//     { "Linen Three-Seater Sofa": ["https://…/a.jpg", "https://…/b.jpg"] }
//   and those URLs are used verbatim for that product (still verified).
//
// Safe to re-run: catalog collections are rebuilt; the admin is upserted by
// email so credentials survive.
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import User from '../Models/User.js';
import Category from '../Models/Categories.js';
import Collection from '../Models/Collection.js';
import Product from '../Models/Product.js';
import Coupon from '../Models/Coupon.js';
import Review from '../Models/Review.js';
import DeliveryArea from '../Models/DeliveryArea.js';
import { slugify } from '../utils/slugify.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes('--dry');
const SKIP_IMAGE_CHECK = process.env.SKIP_IMAGE_CHECK === '1';
const STRICT_IMAGES = process.env.STRICT_IMAGES === '1';

// ── Admin (configurable via env) ─────────────────────────────────────────────
const ADMIN = {
  name: process.env.ADMIN_NAME || 'Store Admin',
  email: (process.env.ADMIN_EMAIL || 'admin@maison.dz').toLowerCase(),
  password: process.env.ADMIN_PASSWORD || 'changeme123',
  usertype: 'superadmin',
};

const CUSTOMER = {
  name: 'Nadia H.',
  email: 'customer@maison.dz',
  phone: '+213 555 070 809',
  password: 'password123',
  usertype: 'user',
};

// ── Image helpers ────────────────────────────────────────────────────────────
// Unsplash's image CDN serves a stable, permanent URL per photo id.
const unsplash = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1000&q=80`;
// Last-resort real photograph (deterministic per seed, always available).
const genericFallback = (seed, n) => `https://picsum.photos/seed/${seed}-${n}/900/1200`;

/** HEAD/GET a URL and report whether it is actually serving an image. */
async function urlWorks(url, timeout = 10000) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ac.signal, redirect: 'follow' });
    if (!res.ok) return false;
    const type = res.headers.get('content-type') || '';
    return type.startsWith('image/');
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** Verify many URLs with bounded concurrency. Returns the set that work. */
async function verifyAll(urls, { concurrency = 8 } = {}) {
  const unique = [...new Set(urls)];
  const working = new Set();
  let i = 0;
  let done = 0;
  async function worker() {
    while (i < unique.length) {
      const url = unique[i++];
      if (await urlWorks(url)) working.add(url);
      done += 1;
      if (done % 10 === 0) process.stdout.write(`\r  checked ${done}/${unique.length}…`);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  process.stdout.write(`\r  checked ${unique.length}/${unique.length}.      \n`);
  return working;
}

// ── Category-level photo pools ───────────────────────────────────────────────
// If a product's own photos fail verification we pull a replacement from here,
// so every product keeps subject-appropriate imagery.
const IMAGE_POOLS = {
  Sofas: ['1555041469-a586c61ea9bc', '1493663284031-b7e3aefcae8e', '1416339306562-f3d12fefd36f', '1550226891-ef816aed4a98'],
  Chairs: ['1503602642458-232111445657', '1567538096630-e0c55bd6374c', '1598300042247-d088f8ab3a91', '1519947486511-46149fa0a254'],
  Tables: ['1594026112284-02bb6f3352fe', '1449247709967-d4461a6a6103', '1533090161767-e6ffed986c88', '1517705008128-361805f42e86'],
  Beds: ['1505693416388-ac5ce068fe85', '1522771739844-6a9f6d5f14af', '1616594039964-ae9021a400a0', '1560185893-a55cbc8c57e8'],
  Storage: ['1538688525198-9b88f6f53126', '1586023492125-27b2c045efd7', '1595428774223-ef52624120d2', '1594620302200-9a762244a156'],
  Lighting: ['1513506003901-1e6a229e2d15', '1540932239986-30128078f3c5', '1507473885765-e6ed057f782c', '1567225557594-88d73e55f2cb'],
  Decor: ['1526057565006-20beab8dd2ed', '1600166898405-da9535204843', '1584100936595-c0654b55a2e2', '1493663284031-b7e3aefcae8e'],
  Outdoor: ['1600210492493-0946911123ea', '1592078615290-033ee584e267', '1595429035839-c99c298ffdde', '1416339306562-f3d12fefd36f'],
};

// ── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Sofas', description: 'Sofas, loveseats and modular seating for the living room.' },
  { name: 'Chairs', description: 'Dining chairs, armchairs and accent seating.' },
  { name: 'Tables', description: 'Dining, coffee and side tables in solid timber and stone.' },
  { name: 'Beds', description: 'Bed frames and headboards for a restful bedroom.' },
  { name: 'Storage', description: 'Sideboards, shelving and bedside storage.' },
  { name: 'Lighting', description: 'Pendants, floor and table lamps with a warm glow.' },
  { name: 'Decor', description: 'Rugs, cushions and ceramics to finish a room.' },
  { name: 'Outdoor', description: 'Weather-ready seating and tables for the garden.' },
];

// ── Finishes (stored in the variant `color` field; swatch uses colorHex) ─────
const FINISHES = {
  oatmeal: { color: 'Oatmeal', hex: '#D9CFB8' },
  sage: { color: 'Sage', hex: '#7C8768' },
  charcoal: { color: 'Charcoal', hex: '#3A3A38' },
  oak: { color: 'Oak', hex: '#C9A876' },
  walnut: { color: 'Walnut', hex: '#5A3E2B' },
  black: { color: 'Black', hex: '#23201A' },
  brass: { color: 'Brass', hex: '#B08D4C' },
  white: { color: 'White', hex: '#EFEBE2' },
  terracotta: { color: 'Terracotta', hex: '#B5623F' },
  natural: { color: 'Natural', hex: '#B79A6E' },
  cream: { color: 'Cream', hex: '#E8DFC9' },
  rust: { color: 'Rust', hex: '#A6572F' },
};

const SIZE = {
  seater: ['2-Seater', '3-Seater'],
  one: ['One Size'],
  dining: ['4-Seat', '6-Seat'],
  bed: ['Queen', 'King'],
  rug: ['170 × 240', '200 × 300'],
};

let skuCounter = 1000;
function makeVariants(finishKeys, sizes, stockEach = 6, demoSoldOut = false) {
  const variants = [];
  finishKeys.forEach((key, fi) => {
    const f = FINISHES[key];
    sizes.forEach((size, si) => {
      skuCounter += 1;
      variants.push({
        size,
        color: f.color,
        colorHex: f.hex,
        sku: `MSN-${skuCounter}`,
        // One option is intentionally sold out so the storefront's sold-out
        // state is visible in the demo catalog.
        stock: demoSoldOut && fi === 0 && si === 0 ? 0 : stockEach,
      });
    });
  });
  return variants;
}

// ── Products ─────────────────────────────────────────────────────────────────
const PRODUCTS = [
  // Sofas
  { name: 'Linen Three-Seater Sofa', cat: 'Sofas', price: 128000, featured: true, soldOut: true,
    ids: ['1555041469-a586c61ea9bc', '1493663284031-b7e3aefcae8e'],
    finishes: ['oatmeal', 'sage', 'charcoal'], sizes: SIZE.seater,
    dims: 'W 220 × D 95 × H 82 cm · seat height 45 cm',
    description: 'A deep, feather-filled sofa in washed linen with a low, relaxed back.',
    material: 'Washed linen upholstery, kiln-dried hardwood frame, feather-wrapped foam cushions.',
    care: 'Vacuum regularly; spot clean with a damp cloth. Rotate cushions to wear evenly.' },
  { name: 'Modular Corner Sofa', cat: 'Sofas', price: 168000, compareAt: 195000,
    ids: ['1493663284031-b7e3aefcae8e', '1416339306562-f3d12fefd36f'],
    finishes: ['oatmeal', 'charcoal'], sizes: SIZE.seater,
    dims: 'W 280 × D 180 × H 80 cm · reversible chaise',
    description: 'A configurable corner sofa you can rearrange as your room changes.',
    material: 'Bouclé upholstery, hardwood frame, high-resilience foam.',
    care: 'Spot clean only. Re-fluff cushions weekly.' },
  { name: 'Bouclé Loveseat', cat: 'Sofas', price: 96000, featured: true,
    ids: ['1550226891-ef816aed4a98', '1555041469-a586c61ea9bc'],
    finishes: ['cream', 'sage'], sizes: SIZE.one,
    dims: 'W 155 × D 88 × H 78 cm',
    description: 'A compact two-seater in textured bouclé — ideal for smaller rooms.',
    material: 'Bouclé upholstery, solid beech legs.',
    care: 'Brush gently with a soft brush; spot clean.' },

  // Chairs
  { name: 'Oak Dining Chair', cat: 'Chairs', price: 16500, featured: true,
    ids: ['1503602642458-232111445657', '1598300042247-d088f8ab3a91'],
    finishes: ['oak', 'walnut', 'black'], sizes: SIZE.one,
    dims: 'W 46 × D 52 × H 80 cm · seat height 46 cm',
    description: 'A solid oak dining chair with a contoured seat and tapered legs.',
    material: 'Solid oak, water-based lacquer.', care: 'Wipe with a soft dry cloth.' },
  { name: 'Lounge Armchair', cat: 'Chairs', price: 38000,
    ids: ['1567538096630-e0c55bd6374c', '1519947486511-46149fa0a254'],
    finishes: ['sage', 'oatmeal', 'rust'], sizes: SIZE.one,
    dims: 'W 78 × D 84 × H 92 cm',
    description: 'A sculptural armchair with a high back and a gentle recline.',
    material: 'Wool-blend upholstery, oak base.', care: 'Vacuum; spot clean.' },
  { name: 'Cane Accent Chair', cat: 'Chairs', price: 24500,
    ids: ['1598300042247-d088f8ab3a91', '1503602642458-232111445657'],
    finishes: ['natural', 'walnut'], sizes: SIZE.one,
    dims: 'W 58 × D 60 × H 84 cm',
    description: 'A woven cane accent chair that brings warmth to a quiet corner.',
    material: 'Rattan cane, solid ash frame.', care: 'Dust with a soft brush; keep out of direct sun.' },

  // Tables
  { name: 'Solid Oak Dining Table', cat: 'Tables', price: 118000, featured: true,
    ids: ['1594026112284-02bb6f3352fe', '1533090161767-e6ffed986c88'],
    finishes: ['oak', 'walnut'], sizes: SIZE.dining,
    dims: 'W 200 × D 95 × H 75 cm (6-seat)',
    description: 'A generous dining table in solid oak with a hand-finished edge.',
    material: 'Solid oak, natural oil finish.',
    care: 'Re-oil twice a year; wipe spills promptly.' },
  { name: 'Travertine Coffee Table', cat: 'Tables', price: 74000, compareAt: 89000,
    ids: ['1449247709967-d4461a6a6103', '1594026112284-02bb6f3352fe'],
    finishes: ['cream', 'natural'], sizes: SIZE.one,
    dims: 'W 120 × D 60 × H 32 cm',
    description: 'A low coffee table carved from honed travertine stone.',
    material: 'Natural travertine.', care: 'Seal annually; avoid acidic cleaners.' },
  { name: 'Round Bistro Table', cat: 'Tables', price: 46000,
    ids: ['1517705008128-361805f42e86', '1449247709967-d4461a6a6103'],
    finishes: ['black', 'white'], sizes: SIZE.one,
    dims: 'Ø 70 × H 74 cm',
    description: 'A compact round table for two — breakfasts, coffees, card games.',
    material: 'Powder-coated steel, oak top.', care: 'Wipe clean.' },

  // Beds
  { name: 'Upholstered Bed Frame', cat: 'Beds', price: 98000, featured: true,
    ids: ['1505693416388-ac5ce068fe85', '1522771739844-6a9f6d5f14af'],
    finishes: ['oatmeal', 'charcoal'], sizes: SIZE.bed,
    dims: 'Queen: W 168 × L 215 × H 120 cm (headboard)',
    description: 'A softly upholstered bed frame with a tall, channel-stitched headboard.',
    material: 'Linen-blend upholstery, solid pine frame, sprung slats.',
    care: 'Vacuum; spot clean.' },
  { name: 'Oak Platform Bed', cat: 'Beds', price: 112000,
    ids: ['1522771739844-6a9f6d5f14af', '1616594039964-ae9021a400a0'],
    finishes: ['oak', 'walnut'], sizes: SIZE.bed,
    dims: 'Queen: W 172 × L 218 × H 40 cm',
    description: 'A low platform bed in solid oak with a floating base.',
    material: 'Solid oak, natural oil finish.', care: 'Re-oil yearly.' },
  { name: 'Rattan Headboard Bed', cat: 'Beds', price: 88000,
    ids: ['1616594039964-ae9021a400a0', '1505693416388-ac5ce068fe85'],
    finishes: ['natural'], sizes: SIZE.bed,
    dims: 'Queen: W 168 × L 215 × H 110 cm (headboard)',
    description: 'A relaxed bed with a hand-woven rattan headboard.',
    material: 'Rattan, solid ash frame.', care: 'Dust with a soft brush.' },

  // Storage
  { name: 'Walnut Sideboard', cat: 'Storage', price: 86000, featured: true,
    ids: ['1538688525198-9b88f6f53126', '1595428774223-ef52624120d2'],
    finishes: ['walnut', 'oak'], sizes: SIZE.one,
    dims: 'W 180 × D 45 × H 75 cm',
    description: 'A long sideboard with soft-close doors and cable management.',
    material: 'Walnut veneer, solid timber legs.', care: 'Wipe with a soft dry cloth.' },
  { name: 'Oak Bookshelf', cat: 'Storage', price: 62000,
    ids: ['1586023492125-27b2c045efd7', '1594620302200-9a762244a156'],
    finishes: ['oak', 'black'], sizes: SIZE.one,
    dims: 'W 90 × D 35 × H 200 cm · 5 adjustable shelves',
    description: 'An open bookshelf with five adjustable shelves.',
    material: 'Solid oak, steel supports.', care: 'Dust regularly.' },
  { name: 'Bedside Table', cat: 'Storage', price: 22000,
    ids: ['1595428774223-ef52624120d2', '1538688525198-9b88f6f53126'],
    finishes: ['oak', 'walnut', 'white'], sizes: SIZE.one,
    dims: 'W 45 × D 40 × H 55 cm · 2 drawers',
    description: 'A two-drawer bedside table sized for smaller bedrooms.',
    material: 'Oak veneer, solid oak legs.', care: 'Wipe clean.' },

  // Lighting
  { name: 'Paper Pendant Lamp', cat: 'Lighting', price: 12500, featured: true,
    ids: ['1513506003901-1e6a229e2d15', '1507473885765-e6ed057f782c'],
    finishes: ['white', 'cream'], sizes: SIZE.one,
    dims: 'Ø 50 × H 45 cm · 2 m cord',
    description: 'A large rice-paper pendant that casts a soft, diffuse glow.',
    material: 'Rice paper, steel frame.', care: 'Dust gently; keep dry.' },
  { name: 'Arc Floor Lamp', cat: 'Lighting', price: 28000,
    ids: ['1540932239986-30128078f3c5', '1513506003901-1e6a229e2d15'],
    finishes: ['brass', 'black'], sizes: SIZE.one,
    dims: 'H 200 × reach 150 cm · marble base Ø 30 cm',
    description: 'A sweeping arc floor lamp that reaches over a sofa or reading chair.',
    material: 'Powder-coated steel, brass detailing, marble base.', care: 'Wipe clean.' },
  { name: 'Ceramic Table Lamp', cat: 'Lighting', price: 14500,
    ids: ['1507473885765-e6ed057f782c', '1567225557594-88d73e55f2cb'],
    finishes: ['cream', 'terracotta'], sizes: SIZE.one,
    dims: 'Ø 28 × H 48 cm',
    description: 'A hand-thrown ceramic lamp with a linen shade.',
    material: 'Glazed ceramic, linen shade.', care: 'Dust the shade; wipe the base.' },

  // Decor
  { name: 'Wool Area Rug', cat: 'Decor', price: 42000, featured: true,
    ids: ['1526057565006-20beab8dd2ed', '1600166898405-da9535204843'],
    finishes: ['oatmeal', 'sage', 'terracotta'], sizes: SIZE.rug,
    dims: '170 × 240 cm or 200 × 300 cm · 12 mm pile',
    description: 'A hand-tufted wool rug with a subtle low pile.',
    material: '100% wool pile, cotton backing.',
    care: 'Professional clean; rotate twice a year to wear evenly.' },
  { name: 'Linen Cushion', cat: 'Decor', price: 4800,
    ids: ['1600166898405-da9535204843', '1584100936595-c0654b55a2e2'],
    finishes: ['sage', 'oatmeal', 'rust', 'terracotta'], sizes: SIZE.one,
    dims: '50 × 50 cm · feather insert included',
    description: 'A stonewashed linen cushion with a plump feather insert.',
    material: 'Washed linen cover, feather insert.', care: 'Machine wash cover cold.' },
  { name: 'Ceramic Vase', cat: 'Decor', price: 6500,
    ids: ['1584100936595-c0654b55a2e2', '1526057565006-20beab8dd2ed'],
    finishes: ['cream', 'terracotta', 'sage'], sizes: SIZE.one,
    dims: 'Ø 18 × H 32 cm',
    description: 'A sculptural stoneware vase, thrown by hand.',
    material: 'Glazed stoneware.', care: 'Hand wash; not dishwasher safe.' },

  // Outdoor
  { name: 'Teak Outdoor Lounge', cat: 'Outdoor', price: 92000, featured: true,
    ids: ['1600210492493-0946911123ea', '1595429035839-c99c298ffdde'],
    finishes: ['natural'], sizes: SIZE.seater,
    dims: 'W 160 × D 80 × H 75 cm',
    description: 'A weather-ready teak lounge with quick-dry cushions.',
    material: 'Solid teak, quick-dry foam, outdoor fabric.',
    care: 'Oil the teak seasonally; cover over winter.' },
  { name: 'Rattan Garden Chair', cat: 'Outdoor', price: 34000, compareAt: 41000,
    ids: ['1592078615290-033ee584e267', '1600210492493-0946911123ea'],
    finishes: ['natural', 'charcoal'], sizes: SIZE.one,
    dims: 'W 60 × D 62 × H 85 cm · stackable',
    description: 'A stackable all-weather rattan chair for balconies and gardens.',
    material: 'PE rattan, powder-coated aluminium frame.',
    care: 'Hose clean; dry before storing.' },
  { name: 'Folding Bistro Set', cat: 'Outdoor', price: 30000,
    ids: ['1595429035839-c99c298ffdde', '1592078615290-033ee584e267'],
    finishes: ['sage', 'black'], sizes: SIZE.one,
    dims: 'Table Ø 60 × H 70 cm · 2 folding chairs',
    description: 'A folding table and two chairs for compact outdoor spaces.',
    material: 'Powder-coated steel.', care: 'Wipe clean; fold flat to store.' },
];

const COLLECTIONS = [
  { name: 'The Living Room Edit', season: 'Featured', subtitle: 'Everything for a room you want to stay in',
    featured: true, order: 1, heroId: '1493663284031-b7e3aefcae8e', heroCat: 'Sofas',
    description: 'Sink-in sofas, a stone coffee table and warm lighting — a living room built around comfort.',
    productNames: ['Linen Three-Seater Sofa', 'Travertine Coffee Table', 'Lounge Armchair', 'Wool Area Rug', 'Arc Floor Lamp'] },
  { name: 'Warm Minimalism', season: 'Core', subtitle: 'Honest timber, clean lines',
    featured: true, order: 2, heroId: '1538688525198-9b88f6f53126', heroCat: 'Storage',
    description: 'Solid oak and walnut, pared back to the essentials — pieces that age beautifully.',
    productNames: ['Solid Oak Dining Table', 'Oak Dining Chair', 'Walnut Sideboard', 'Oak Platform Bed'] },
  { name: 'Small Spaces', season: 'Core', subtitle: 'Made to fit',
    featured: false, order: 3, heroId: '1586023492125-27b2c045efd7', heroCat: 'Storage',
    description: 'Compact seating, folding tables and clever storage for apartments and studios.',
    productNames: ['Bouclé Loveseat', 'Round Bistro Table', 'Bedside Table', 'Folding Bistro Set'] },
];

const COUPONS = [
  { code: 'WELCOME10', type: 'percent', value: 10, minSubtotal: 0, active: true },
  { code: 'MAISON5000', type: 'fixed', value: 5000, minSubtotal: 60000, active: true },
  { code: 'FREESHIP', type: 'free_shipping', value: 0, minSubtotal: 80000, active: true },
];

const DELIVERY_AREAS = [
  { wilaya: 'Alger', priceHome: 1500, priceDesk: 900, desks: [{ name: 'Alger Centre' }, { name: 'Bab Ezzouar' }, { name: 'Hydra' }] },
  { wilaya: 'Oran', priceHome: 2000, priceDesk: 1200, desks: [{ name: 'Oran Centre' }, { name: 'Es Sénia' }] },
  { wilaya: 'Constantine', priceHome: 2200, priceDesk: 1400, desks: [{ name: 'Constantine Centre' }, { name: 'El Khroub' }] },
  { wilaya: 'Blida', priceHome: 1800, priceDesk: 1100, desks: [{ name: 'Blida Centre' }] },
  { wilaya: 'Annaba', priceHome: 2500, priceDesk: 1600, desks: [{ name: 'Annaba Centre' }] },
  { wilaya: 'Sétif', priceHome: 2200, priceDesk: 1400, desks: [{ name: 'Sétif Centre' }] },
];

const REVIEWS = [
  { product: 'Linen Three-Seater Sofa', name: 'Yacine B.', rating: 5, title: 'Incredibly comfortable', body: 'The linen is soft and the cushions keep their shape. Worth the wait.' },
  { product: 'Solid Oak Dining Table', name: 'Nadia H.', rating: 5, title: 'A forever piece', body: 'Beautiful grain and rock solid. It will outlast us all.', fromCustomer: true },
  { product: 'Oak Dining Chair', name: 'Sofiane K.', rating: 4, title: 'Sturdy and elegant', body: 'Comfortable for long dinners. Assembly took ten minutes.' },
  { product: 'Paper Pendant Lamp', name: 'Amel T.', rating: 5, title: 'Lovely soft light', body: 'Casts a really warm glow in the evening. Bigger than I expected.' },
  { product: 'Wool Area Rug', name: 'Karim D.', rating: 4, title: 'Thick and warm', body: 'Great underfoot. Shed a little at first, then settled.' },
];

// ── Optional local photo overrides ───────────────────────────────────────────
function loadOverrides() {
  const file = path.join(__dirname, 'images.local.json');
  if (!fs.existsSync(file)) return {};
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    console.log(`  Using photo overrides from ${path.basename(file)} (${Object.keys(parsed).length} entries).`);
    return parsed;
  } catch (err) {
    console.warn(`  ⚠ Could not parse images.local.json — ignoring it. ${err.message}`);
    return {};
  }
}

async function run() {
  if (!process.env.MONGO_URI && !DRY_RUN) {
    console.error('✖ MONGO_URI is not set. Add it to your environment or server/.env');
    process.exit(1);
  }

  const overrides = loadOverrides();

  // 1. Collect every candidate URL: overrides, per-product photos, category
  //    pools and collection heroes — then verify them all in one pass.
  const candidates = [
    ...Object.values(overrides).flat(),
    ...PRODUCTS.flatMap((p) => p.ids.map(unsplash)),
    ...Object.values(IMAGE_POOLS).flat().map(unsplash),
    ...COLLECTIONS.map((c) => unsplash(c.heroId)),
  ];

  let working;
  if (SKIP_IMAGE_CHECK) {
    console.log('Skipping the image reachability check (SKIP_IMAGE_CHECK=1).');
    working = new Set(candidates);
  } else {
    console.log(`Verifying ${new Set(candidates).size} candidate images…`);
    working = await verifyAll(candidates);
    console.log(`  ${working.size}/${new Set(candidates).size} reachable.`);
  }

  // 2. Build each product's photo set: overrides → own photos → category pool
  //    → generic fallback. Track which products needed help.
  // Each product is classified into exactly one bucket for an honest report.
  const sourced = { own: [], pool: [], generic: [] };

  function imagesFor(p) {
    const slug = slugify(p.name);
    const picked = [];

    const push = (url) => {
      if (url && working.has(url) && !picked.includes(url)) picked.push(url);
    };

    (overrides[p.name] || []).forEach(push);          // hand-picked photography
    p.ids.map(unsplash).forEach(push);                // the product's own photos
    const ownCount = picked.length;

    if (picked.length < 2) {
      (IMAGE_POOLS[p.cat] || []).map(unsplash).forEach(push); // same-category
    }
    const realCount = picked.length;

    const chosen = picked.slice(0, 3);
    let n = 0;
    while (chosen.length < 2) chosen.push(genericFallback(slug, n++)); // last resort

    // Classify: generic wins only if we actually had to invent an image.
    if (realCount < 2) sourced.generic.push(p.name);
    else if (ownCount < 2) sourced.pool.push(p.name);
    else sourced.own.push(p.name);

    return chosen.map((url, i) => ({ url, public_id: null, alt: `${p.name} — view ${i + 1}` }));
  }

  function heroFor(c) {
    const own = unsplash(c.heroId);
    if (working.has(own)) return { url: own, public_id: null, alt: c.name };
    const pool = (IMAGE_POOLS[c.heroCat] || []).map(unsplash).find((u) => working.has(u));
    return { url: pool || genericFallback(slugify(c.name), 0), public_id: null, alt: c.name };
  }

  const productImages = new Map(PRODUCTS.map((p) => [p.name, imagesFor(p)]));

  // 3. Report image sourcing before touching the database.
  console.log('\nImage report');
  console.log(`  ${sourced.own.length}/${PRODUCTS.length} products used their own photography.`);
  if (sourced.pool.length) {
    console.log(`  ${sourced.pool.length} topped up from their category pool (still on-subject): ${sourced.pool.join(', ')}`);
  }
  if (sourced.generic.length) {
    console.log(`  ⚠ ${sourced.generic.length} fell back to a generic photo: ${sourced.generic.join(', ')}`);
    console.log('    Add real URLs for these in scripts/images.local.json and re-run.');
    if (STRICT_IMAGES) {
      console.error('\n✖ STRICT_IMAGES=1 and some products lack real photography — aborting.');
      process.exit(1);
    }
  } else {
    console.log('  ✔ Every product has real, subject-appropriate, verified photography.');
  }

  if (DRY_RUN) {
    console.log('\n--dry: no database changes were made.');
    process.exit(0);
  }

  // 4. Write everything.
  await mongoose.connect(process.env.MONGO_URI);
  console.log('\nMongoDB connected — setting up store…');

  let customerDoc;
  for (const acct of [ADMIN, CUSTOMER]) {
    let user = await User.findOne({ email: acct.email });
    if (!user) {
      user = await User.create(acct);
      console.log(`  Created ${acct.usertype}: ${acct.email}`);
    } else {
      console.log(`  ${acct.usertype} already exists: ${acct.email} (left unchanged)`);
    }
    if (acct === CUSTOMER) customerDoc = user;
  }

  await Promise.all([
    Product.deleteMany({}),
    Category.deleteMany({}),
    Collection.deleteMany({}),
    Coupon.deleteMany({}),
    Review.deleteMany({}),
    DeliveryArea.deleteMany({}),
  ]);

  const catByName = {};
  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i];
    const doc = await Category.create({ ...c, slug: slugify(c.name), order: i });
    catByName[c.name] = doc._id;
  }
  console.log(`  Seeded ${CATEGORIES.length} categories.`);

  const productByName = {};
  for (const p of PRODUCTS) {
    const doc = new Product({
      name: p.name,
      slug: slugify(p.name),
      description: p.description,
      details: p.dims ? `${p.description}\n\nDimensions: ${p.dims}` : p.description,
      material: p.material,
      care: p.care,
      price: p.price,
      compareAtPrice: p.compareAt || null,
      images: productImages.get(p.name),
      category: catByName[p.cat],
      featured: !!p.featured,
      status: 'active',
      variants: makeVariants(p.finishes, p.sizes, 6, !!p.soldOut),
    });
    await doc.save(); // pre-save hook derives sizes/colors/stock
    productByName[p.name] = doc;
  }
  console.log(`  Seeded ${PRODUCTS.length} products.`);

  for (const c of COLLECTIONS) {
    const productIds = c.productNames.map((n) => productByName[n]?._id).filter(Boolean);
    const collection = await Collection.create({
      name: c.name,
      slug: slugify(c.name),
      subtitle: c.subtitle,
      description: c.description,
      season: c.season,
      heroImage: heroFor(c),
      featured: c.featured,
      order: c.order,
      products: productIds,
    });
    await Product.updateMany({ _id: { $in: productIds } }, { $addToSet: { collections: collection._id } });
  }
  console.log(`  Seeded ${COLLECTIONS.length} collections.`);

  await Coupon.insertMany(COUPONS);
  console.log(`  Seeded ${COUPONS.length} coupons.`);

  await DeliveryArea.insertMany(DELIVERY_AREAS);
  console.log(`  Seeded ${DELIVERY_AREAS.length} delivery areas.`);

  for (const r of REVIEWS) {
    const prod = productByName[r.product];
    if (!prod) continue;
    await Review.create({
      product: prod._id,
      customer: r.fromCustomer ? customerDoc?._id || null : null,
      name: r.name,
      rating: r.rating,
      title: r.title,
      body: r.body,
      verified: !!r.fromCustomer,
    });
    await Review.syncProductRating(prod._id);
  }
  console.log(`  Seeded ${REVIEWS.length} reviews.`);

  await mongoose.disconnect();

  console.log('\n✔ Store is ready.');
  console.log('  Admin login:');
  console.log(`    email:    ${ADMIN.email}`);
  console.log(`    password: ${ADMIN.password}`);
  console.log('  Sign in at /login, then open /admin/dashboard.');
  if (ADMIN.password === 'changeme123') {
    console.log('  ⚠ Change the default password after first sign-in (or set ADMIN_PASSWORD before running).');
  }
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
