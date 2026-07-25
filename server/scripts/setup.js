// ─────────────────────────────────────────────────────────────────────────────
// STORE SETUP — one-shot script that:
//   1. Creates (or updates) an admin account.
//   2. Fills the store with a realistic furniture catalog: categories, ~24
//      products with finish/configuration variants, collections, coupons,
//      delivery areas, and a couple of reviews.
//   3. Guarantees WORKING product imagery: every candidate image URL is checked
//      over the network first, and anything unreachable is swapped for a
//      deterministic fallback image — so no product is ever left with a broken
//      picture.
//
// Usage:
//   node scripts/setup.js
//
// Environment (a .env file in /server is read automatically):
//   MONGO_URI          (required) MongoDB connection string
//   ADMIN_EMAIL        admin login email      (default admin@maison.dz)
//   ADMIN_PASSWORD     admin password         (default changeme123)
//   ADMIN_NAME         admin display name     (default Store Admin)
//   SKIP_IMAGE_CHECK   set to "1" to skip the network image check (faster)
//
// Safe to re-run: it clears catalog collections and re-inserts, and upserts the
// admin by email so credentials survive.
// ─────────────────────────────────────────────────────────────────────────────

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

// ── Admin (configurable via env) ─────────────────────────────────────────────
const ADMIN = {
  name: process.env.ADMIN_NAME || 'Store Admin',
  email: (process.env.ADMIN_EMAIL || 'admin@maison.dz').toLowerCase(),
  password: process.env.ADMIN_PASSWORD || 'changeme123',
  usertype: 'superadmin',
};

// ── Image helpers ────────────────────────────────────────────────────────────
const unsplash = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1000&q=80`;
const fallback = (seed, n) => `https://picsum.photos/seed/${seed}-${n}/900/1200`;

async function urlWorks(url, timeout = 9000) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ac.signal, redirect: 'follow' });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function verifyAll(urls) {
  const unique = [...new Set(urls)];
  const working = new Set();
  const concurrency = 6;
  let i = 0;
  async function worker() {
    while (i < unique.length) {
      const url = unique[i++];
      if (await urlWorks(url)) working.add(url);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return working;
}

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

// ── Finishes (stored in the variant "color" field; the swatch uses colorHex) ──
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
        stock: demoSoldOut && fi === 0 && si === 0 ? 0 : stockEach,
      });
    });
  });
  return variants;
}

// candidate Unsplash ids (interiors / furniture), primary first.
const PRODUCTS = [
  // Sofas
  { name: 'Linen Three-Seater Sofa', cat: 'Sofas', price: 128000, featured: true, soldOut: true,
    ids: ['1555041469-a586c61ea9bc', '1493663284031-b7e3aefcae8e', '1616486338812-3dadae4b4ace'],
    finishes: ['oatmeal', 'sage', 'charcoal'], sizes: SIZE.seater,
    description: 'A deep, feather-filled sofa in washed linen with a low, relaxed back.',
    material: 'Washed linen upholstery, kiln-dried hardwood frame, feather-wrapped foam cushions.',
    care: 'Vacuum regularly; spot clean with a damp cloth. Rotate cushions to wear evenly.' },
  { name: 'Modular Corner Sofa', cat: 'Sofas', price: 168000, compareAt: 195000,
    ids: ['1493663284031-b7e3aefcae8e', '1555041469-a586c61ea9bc', '1616627988744-9f4f3b6f2c1e'],
    finishes: ['oatmeal', 'charcoal'], sizes: SIZE.seater,
    description: 'A configurable corner sofa you can rearrange as your room changes.',
    material: 'Boucle upholstery, hardwood frame, high-resilience foam.', care: 'Spot clean only.' },
  { name: 'Bouclé Loveseat', cat: 'Sofas', price: 96000, featured: true,
    ids: ['1616627988744-9f4f3b6f2c1e', '1493663284031-b7e3aefcae8e', '1555041469-a586c61ea9bc'],
    finishes: ['cream', 'sage'], sizes: SIZE.one,
    description: 'A compact two-seater in textured bouclé — perfect for smaller rooms.',
    material: 'Bouclé upholstery, solid beech legs.', care: 'Brush gently; spot clean.' },

  // Chairs
  { name: 'Oak Dining Chair', cat: 'Chairs', price: 16500, featured: true,
    ids: ['1503602642458-232111445657', '1567538096630-e0c55bd6374c', '1533090161767-e6ffed986c88'],
    finishes: ['oak', 'walnut', 'black'], sizes: SIZE.one,
    description: 'A solid oak dining chair with a contoured seat and tapered legs.',
    material: 'Solid oak, water-based lacquer.', care: 'Wipe with a soft dry cloth.' },
  { name: 'Lounge Armchair', cat: 'Chairs', price: 38000,
    ids: ['1567538096630-e0c55bd6374c', '1550226891-ef816aed4a98', '1499933374294-4584851497cc'],
    finishes: ['sage', 'oatmeal', 'rust'], sizes: SIZE.one,
    description: 'A sculptural armchair with a high back and gentle recline.',
    material: 'Wool-blend upholstery, oak base.', care: 'Vacuum; spot clean.' },
  { name: 'Cane Accent Chair', cat: 'Chairs', price: 24500,
    ids: ['1533090161767-e6ffed986c88', '1503602642458-232111445657', '1567225557594-88d73e55f2cb'],
    finishes: ['natural', 'walnut'], sizes: SIZE.one,
    description: 'A woven cane accent chair that brings warmth to any corner.',
    material: 'Rattan cane, solid ash frame.', care: 'Dust with a soft brush.' },

  // Tables
  { name: 'Solid Oak Dining Table', cat: 'Tables', price: 118000, featured: true,
    ids: ['1594026112284-02bb6f3352fe', '1533090161767-e6ffed986c88', '1449247709967-d4461a6a6103'],
    finishes: ['oak', 'walnut'], sizes: SIZE.dining,
    description: 'A generous dining table in solid oak with a hand-finished edge.',
    material: 'Solid oak, natural oil finish.', care: 'Re-oil twice a year; wipe spills promptly.' },
  { name: 'Travertine Coffee Table', cat: 'Tables', price: 74000, compareAt: 89000,
    ids: ['1449247709967-d4461a6a6103', '1594026112284-02bb6f3352fe', '1524758631624-e2822e304c36'],
    finishes: ['cream', 'natural'], sizes: SIZE.one,
    description: 'A low coffee table carved from honed travertine stone.',
    material: 'Natural travertine.', care: 'Seal annually; avoid acidic cleaners.' },
  { name: 'Round Bistro Table', cat: 'Tables', price: 46000,
    ids: ['1524758631624-e2822e304c36', '1594026112284-02bb6f3352fe', '1449247709967-d4461a6a6103'],
    finishes: ['black', 'white'], sizes: SIZE.one,
    description: 'A compact round table for two — breakfasts, coffees, card games.',
    material: 'Powder-coated steel, oak top.', care: 'Wipe clean.' },

  // Beds
  { name: 'Upholstered Bed Frame', cat: 'Beds', price: 98000, featured: true,
    ids: ['1505693416388-ac5ce068fe85', '1522771739844-6a9f6d5f14af', '1611967164521-abae8fba4668'],
    finishes: ['oatmeal', 'charcoal'], sizes: SIZE.bed,
    description: 'A softly upholstered bed frame with a tall, channel-stitched headboard.',
    material: 'Linen-blend upholstery, solid pine frame, sprung slats.', care: 'Vacuum; spot clean.' },
  { name: 'Oak Platform Bed', cat: 'Beds', price: 112000,
    ids: ['1522771739844-6a9f6d5f14af', '1505693416388-ac5ce068fe85', '1618220179428-22790b461013'],
    finishes: ['oak', 'walnut'], sizes: SIZE.bed,
    description: 'A low platform bed in solid oak with a floating base.',
    material: 'Solid oak, natural oil finish.', care: 'Re-oil yearly.' },
  { name: 'Rattan Headboard Bed', cat: 'Beds', price: 88000,
    ids: ['1611967164521-abae8fba4668', '1505693416388-ac5ce068fe85', '1522771739844-6a9f6d5f14af'],
    finishes: ['natural'], sizes: SIZE.bed,
    description: 'A relaxed bed with a hand-woven rattan headboard.',
    material: 'Rattan, solid ash frame.', care: 'Dust with a soft brush.' },

  // Storage
  { name: 'Walnut Sideboard', cat: 'Storage', price: 86000, featured: true,
    ids: ['1616627988744-9f4f3b6f2c1e', '1538688525198-9b88f6f53126', '1586023492125-27b2c045efd7'],
    finishes: ['walnut', 'oak'], sizes: SIZE.one,
    description: 'A long sideboard with soft-close doors and cable management.',
    material: 'Walnut veneer, solid timber legs.', care: 'Wipe with a soft dry cloth.' },
  { name: 'Oak Bookshelf', cat: 'Storage', price: 62000,
    ids: ['1586023492125-27b2c045efd7', '1538688525198-9b88f6f53126', '1616627988744-9f4f3b6f2c1e'],
    finishes: ['oak', 'black'], sizes: SIZE.one,
    description: 'An open bookshelf with five adjustable shelves.',
    material: 'Solid oak, steel supports.', care: 'Dust regularly.' },
  { name: 'Bedside Table', cat: 'Storage', price: 22000,
    ids: ['1538688525198-9b88f6f53126', '1586023492125-27b2c045efd7', '1616627988744-9f4f3b6f2c1e'],
    finishes: ['oak', 'walnut', 'white'], sizes: SIZE.one,
    description: 'A two-drawer bedside table sized for small bedrooms.',
    material: 'Oak veneer, solid oak legs.', care: 'Wipe clean.' },

  // Lighting
  { name: 'Paper Pendant Lamp', cat: 'Lighting', price: 12500, featured: true,
    ids: ['1513506003901-1e6a229e2d15', '1540932239986-30128078f3c5', '1517705008128-361805f42e86'],
    finishes: ['white', 'cream'], sizes: SIZE.one,
    description: 'A large rice-paper pendant that casts a soft, diffuse glow.',
    material: 'Rice paper, steel frame.', care: 'Dust gently; keep dry.' },
  { name: 'Arc Floor Lamp', cat: 'Lighting', price: 28000,
    ids: ['1540932239986-30128078f3c5', '1513506003901-1e6a229e2d15', '1517705008128-361805f42e86'],
    finishes: ['brass', 'black'], sizes: SIZE.one,
    description: 'A sweeping arc floor lamp that reaches over a sofa or reading chair.',
    material: 'Powder-coated steel, brass detailing, marble base.', care: 'Wipe clean.' },
  { name: 'Ceramic Table Lamp', cat: 'Lighting', price: 14500,
    ids: ['1517705008128-361805f42e86', '1540932239986-30128078f3c5', '1513506003901-1e6a229e2d15'],
    finishes: ['cream', 'terracotta'], sizes: SIZE.one,
    description: 'A hand-thrown ceramic lamp with a linen shade.',
    material: 'Glazed ceramic, linen shade.', care: 'Dust the shade; wipe the base.' },

  // Decor
  { name: 'Wool Area Rug', cat: 'Decor', price: 42000, featured: true,
    ids: ['1526057565006-20beab8dd2ed', '1600166898405-da9535204843', '1584100936595-c0654b55a2e2'],
    finishes: ['oatmeal', 'sage', 'terracotta'], sizes: SIZE.rug,
    description: 'A hand-tufted wool rug with a subtle low pile.',
    material: '100% wool pile, cotton backing.', care: 'Professional clean; rotate to wear evenly.' },
  { name: 'Linen Cushion', cat: 'Decor', price: 4800,
    ids: ['1600166898405-da9535204843', '1526057565006-20beab8dd2ed', '1584100936595-c0654b55a2e2'],
    finishes: ['sage', 'oatmeal', 'rust', 'terracotta'], sizes: SIZE.one,
    description: 'A stonewashed linen cushion with a feather insert.',
    material: 'Washed linen cover, feather insert.', care: 'Machine wash cover cold.' },
  { name: 'Ceramic Vase', cat: 'Decor', price: 6500,
    ids: ['1584100936595-c0654b55a2e2', '1600166898405-da9535204843', '1526057565006-20beab8dd2ed'],
    finishes: ['cream', 'terracotta', 'sage'], sizes: SIZE.one,
    description: 'A sculptural stoneware vase, thrown by hand.',
    material: 'Glazed stoneware.', care: 'Hand wash; not dishwasher safe.' },

  // Outdoor
  { name: 'Teak Outdoor Lounge', cat: 'Outdoor', price: 92000, featured: true,
    ids: ['1600210492493-0946911123ea', '1592078615290-033ee584e267', '1595429035839-c99c298ffdde'],
    finishes: ['natural'], sizes: SIZE.seater,
    description: 'A weather-ready teak lounge chair with quick-dry cushions.',
    material: 'Solid teak, quick-dry foam, outdoor fabric.', care: 'Oil teak seasonally; cover in winter.' },
  { name: 'Rattan Garden Chair', cat: 'Outdoor', price: 34000, compareAt: 41000,
    ids: ['1592078615290-033ee584e267', '1600210492493-0946911123ea', '1595429035839-c99c298ffdde'],
    finishes: ['natural', 'charcoal'], sizes: SIZE.one,
    description: 'A stackable all-weather rattan chair for balconies and gardens.',
    material: 'PE rattan, powder-coated aluminium frame.', care: 'Hose clean; dry before storing.' },
  { name: 'Folding Bistro Set', cat: 'Outdoor', price: 30000,
    ids: ['1595429035839-c99c298ffdde', '1600210492493-0946911123ea', '1592078615290-033ee584e267'],
    finishes: ['sage', 'black'], sizes: SIZE.one,
    description: 'A folding table and two chairs for compact outdoor spaces.',
    material: 'Powder-coated steel.', care: 'Wipe clean; fold flat to store.' },
];

const COLLECTIONS = [
  { name: 'The Living Room Edit', season: 'Featured', subtitle: 'Everything for a room you want to stay in', featured: true, order: 1,
    heroId: '1524758631624-e2822e304c36',
    description: 'Sink-in sofas, a stone coffee table and warm lighting — a living room built around comfort.',
    productNames: ['Linen Three-Seater Sofa', 'Travertine Coffee Table', 'Lounge Armchair', 'Wool Area Rug', 'Arc Floor Lamp'] },
  { name: 'Warm Minimalism', season: 'Core', subtitle: 'Honest timber, clean lines', featured: true, order: 2,
    heroId: '1538688525198-9b88f6f53126',
    description: 'Solid oak and walnut, pared back to the essentials — pieces that age beautifully.',
    productNames: ['Solid Oak Dining Table', 'Oak Dining Chair', 'Walnut Sideboard', 'Oak Platform Bed'] },
  { name: 'Small Spaces', season: 'Core', subtitle: 'Made to fit', featured: false, order: 3,
    heroId: '1586023492125-27b2c045efd7',
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

const CUSTOMER = { name: 'Nadia H.', email: 'customer@maison.dz', phone: '+213 555 070 809', password: 'password123', usertype: 'user' };

async function run() {
  if (!process.env.MONGO_URI) {
    console.error('✖ MONGO_URI is not set. Add it to your environment or server/.env');
    process.exit(1);
  }

  const skipCheck = process.env.SKIP_IMAGE_CHECK === '1';
  const allIds = [...new Set([...PRODUCTS.flatMap((p) => p.ids), ...COLLECTIONS.map((c) => c.heroId)])];
  let working = new Set(allIds.map(unsplash));
  if (!skipCheck) {
    console.log(`Checking ${allIds.length} candidate images…`);
    working = await verifyAll(allIds.map(unsplash));
    console.log(`  ${working.size}/${allIds.length} image URLs reachable; the rest use a safe fallback.`);
  } else {
    console.log('Skipping image reachability check (SKIP_IMAGE_CHECK=1).');
  }

  function imagesFor(p) {
    const slug = slugify(p.name);
    const good = p.ids.map(unsplash).filter((u) => working.has(u));
    const chosen = good.slice(0, 3);
    let n = 0;
    while (chosen.length < 2) chosen.push(fallback(slug, n++));
    return chosen.map((url, i) => ({ url, public_id: null, alt: `${p.name} — view ${i + 1}` }));
  }
  function heroFor(c) {
    const url = unsplash(c.heroId);
    return { url: working.has(url) ? url : fallback(slugify(c.name), 0), public_id: null, alt: c.name };
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected — setting up store…');

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
      details: p.description,
      material: p.material,
      care: p.care,
      price: p.price,
      compareAtPrice: p.compareAt || null,
      images: imagesFor(p),
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

  const reviewSpecs = [
    { product: 'Linen Three-Seater Sofa', name: 'Yacine B.', rating: 5, title: 'Incredibly comfortable', body: 'The linen is soft and the cushions keep their shape. Worth the wait.' },
    { product: 'Solid Oak Dining Table', name: 'Nadia H.', rating: 5, title: 'A forever piece', body: 'Beautiful grain and rock solid. It will outlast us all.', customer: null },
    { product: 'Oak Dining Chair', name: 'Sofiane K.', rating: 4, title: 'Sturdy and elegant', body: 'Comfortable for long dinners. Assembly took ten minutes.' },
    { product: 'Paper Pendant Lamp', name: 'Amel T.', rating: 5, title: 'Lovely soft light', body: 'Casts a really warm glow in the evening. Bigger than I expected.' },
    { product: 'Wool Area Rug', name: 'Karim D.', rating: 4, title: 'Thick and warm', body: 'Great underfoot. Shed a little at first, then settled.' },
  ];
  for (const r of reviewSpecs) {
    const prod = productByName[r.product];
    if (!prod) continue;
    const isDemoCustomer = r.product === 'Solid Oak Dining Table';
    await Review.create({
      product: prod._id,
      customer: isDemoCustomer ? customerDoc?._id || null : null,
      name: r.name,
      rating: r.rating,
      title: r.title,
      body: r.body,
      verified: isDemoCustomer,
    });
    await Review.syncProductRating(prod._id);
  }
  console.log(`  Seeded ${reviewSpecs.length} reviews.`);

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
