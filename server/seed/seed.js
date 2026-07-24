// ─────────────────────────────────────────────────────────────────────────────
// CATALOG SEED — ATELIER demo storefront.
//
// The storefront loads ALL data from the database via the API; nothing is
// hardcoded in React. This file is the starting catalog for a store. It wipes
// and rebuilds the catalog collections (Products, Categories, Collections,
// Coupons, Reviews, DeliveryAreas) and UPSERTS the demo accounts, so it is safe
// to re-run.
//
// Run:  node seed/seed.js          (requires MONGO_URI in the environment / .env)
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

// Consistent editorial imagery pool (Unsplash). One quiet, uncropped look so the
// catalog reads as a single brand. Replace with real product shots per store.
const img = (id) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1000&q=80`;

const IMAGES = {
  coat: ['1591047139829-d91aecb6caea', '1544923246-77307dd654cb'],
  trench: ['1520975954732-35dd22299614', '1548624313-0396c75f8f1d'],
  parka: ['1578681994506-b8f463449011', '1608063615781-e2ef8c9d1f0d'],
  knitCrew: ['1576871337622-98d48d1cf531', '1620012253295-c15cc3e65df4'],
  cardigan: ['1591047139829-d91aecb6caea', '1434389677669-e08b4cac3105'],
  turtleneck: ['1608234808654-2a8875faa7fd', '1618354691373-d851c5c3a990'],
  shirtWhite: ['1596755094514-f87e34085b2c', '1602810318383-e386cc2a3ccf'],
  shirtStripe: ['1598033129183-c4f50c736f10', '1603252109303-2751441dd157'],
  overshirt: ['1607345366928-199ea26cfe3e', '1516257984-b1b4d707412e'],
  trouser: ['1594633312681-425c7b97ccd1', '1473966968600-fa801b869a1a'],
  denim: ['1542272604-787c3835535d', '1541099649105-f69ad21f3246'],
  chino: ['1624378439575-d8705ad7ae80', '1473966968600-fa801b869a1a'],
  teeWhite: ['1521572163474-6864f9cf17ab', '1583743814966-8936f5b7be1a'],
  teeBlack: ['1503341504253-dff4815485f1', '1618354691373-d851c5c3a990'],
  dressMidi: ['1595777457583-95e059d581b8', '1566174053879-31528523f8ae'],
  dressSlip: ['1539008835657-9e8e9680c956', '1502716119720-b23a93e5fe1b'],
  boot: ['1608256246200-53e635b5b65f', '1533867617858-e7b97e060509'],
  sneaker: ['1595950653106-6c9ebd614d3a', '1600185365483-26d7a4cc7519'],
  loafer: ['1533867617858-e7b97e060509', '1614252369475-531eba835eb1'],
  bag: ['1590874103328-eac38a683ce7', '1584917865442-de89df76afd3'],
  scarf: ['1601924994987-69e26d50dc26', '1520903920243-00d872a2d1c9'],
  belt: ['1553062407-98eeb64c6a62', '1624222247344-550fb60583dc'],
  cap: ['1588850561407-ed78c282e89b', '1521369909029-2afed882baee'],
};

const SIZES_APPAREL = ['XS', 'S', 'M', 'L', 'XL'];
const SIZES_SHOE = ['39', '40', '41', '42', '43', '44'];

const COLORWAYS = {
  bone: { color: 'Bone', hex: '#E7E1D3' },
  ink: { color: 'Ink', hex: '#1B1712' },
  clay: { color: 'Clay', hex: '#B4471F' },
  olive: { color: 'Olive', hex: '#5C5A3E' },
  stone: { color: 'Stone', hex: '#9B9384' },
  navy: { color: 'Navy', hex: '#26303F' },
  ecru: { color: 'Ecru', hex: '#D9CFBA' },
  charcoal: { color: 'Charcoal', hex: '#3A3733' },
};

let skuCounter = 1000;
function makeVariants(colorKeys, sizes, stockEach = 8) {
  const variants = [];
  for (const key of colorKeys) {
    const c = COLORWAYS[key];
    for (const size of sizes) {
      skuCounter += 1;
      variants.push({
        size,
        color: c.color,
        colorHex: c.hex,
        sku: `ATL-${skuCounter}`,
        // Vary stock a little; make one size of the first colour sold out.
        stock: size === 'XS' && key === colorKeys[0] ? 0 : stockEach,
      });
    }
  }
  return variants;
}

// ── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Outerwear', description: 'Coats, trenches and parkas built to last.' },
  { name: 'Knitwear', description: 'Crew necks, cardigans and merino turtlenecks.' },
  { name: 'Shirting', description: 'Considered shirts and overshirts.' },
  { name: 'Trousers', description: 'Tailored trousers, denim and chinos.' },
  { name: 'T-Shirts', description: 'Heavyweight cotton, cut to a clean line.' },
  { name: 'Dresses', description: 'Midi and slip silhouettes for every season.' },
  { name: 'Footwear', description: 'Boots, sneakers and hand-finished loafers.' },
  { name: 'Accessories', description: 'Bags, scarves, belts and caps.' },
];

// ── Products ─────────────────────────────────────────────────────────────────
// gender, category, price (DZD), compareAt?, images[], variants, copy.
const PRODUCTS = [
  // Outerwear
  { name: 'Wool Overcoat', cat: 'Outerwear', gender: 'women', price: 28900, images: IMAGES.coat,
    colors: ['ink', 'stone'], sizes: SIZES_APPAREL, featured: true,
    description: 'A double-faced wool overcoat with a clean, collarless line and a concealed placket.',
    material: '80% virgin wool, 20% cashmere. Lining: 100% viscose.', care: 'Dry clean only.' },
  { name: 'Belted Trench', cat: 'Outerwear', gender: 'unisex', price: 24500, compareAt: 29000, images: IMAGES.trench,
    colors: ['bone', 'olive'], sizes: SIZES_APPAREL, featured: true,
    description: 'The archetypal trench, rendered in a water-repellent cotton gabardine.',
    material: '100% cotton gabardine.', care: 'Dry clean.' },
  { name: 'Utility Parka', cat: 'Outerwear', gender: 'men', price: 21000, images: IMAGES.parka,
    colors: ['olive', 'ink'], sizes: SIZES_APPAREL,
    description: 'A relaxed parka with bellows pockets and a drawcord waist.',
    material: '100% organic cotton ripstop.', care: 'Machine wash cold.' },

  // Knitwear
  { name: 'Merino Crew Knit', cat: 'Knitwear', gender: 'unisex', price: 9800, images: IMAGES.knitCrew,
    colors: ['bone', 'clay', 'navy'], sizes: SIZES_APPAREL, featured: true,
    description: 'A fine-gauge merino crew neck that layers under everything.',
    material: '100% extra-fine merino wool.', care: 'Hand wash cold, dry flat.' },
  { name: 'Waffle Cardigan', cat: 'Knitwear', gender: 'women', price: 12500, images: IMAGES.cardigan,
    colors: ['ecru', 'charcoal'], sizes: SIZES_APPAREL,
    description: 'An oversized waffle-knit cardigan with horn buttons.',
    material: '70% cotton, 30% wool.', care: 'Hand wash cold.' },
  { name: 'Ribbed Turtleneck', cat: 'Knitwear', gender: 'women', price: 8900, images: IMAGES.turtleneck,
    colors: ['ink', 'bone', 'clay'], sizes: SIZES_APPAREL,
    description: 'A close-fitting ribbed turtleneck in soft lambswool.',
    material: '100% lambswool.', care: 'Hand wash cold, dry flat.' },

  // Shirting
  { name: 'Poplin Shirt', cat: 'Shirting', gender: 'men', price: 7500, images: IMAGES.shirtWhite,
    colors: ['bone', 'navy'], sizes: SIZES_APPAREL, featured: true,
    description: 'A crisp cotton poplin shirt with a slightly relaxed body.',
    material: '100% organic cotton poplin.', care: 'Machine wash warm.' },
  { name: 'Striped Oxford', cat: 'Shirting', gender: 'unisex', price: 8200, images: IMAGES.shirtStripe,
    colors: ['bone', 'navy'], sizes: SIZES_APPAREL,
    description: 'A washed oxford with a fine woven stripe and a button-down collar.',
    material: '100% cotton oxford.', care: 'Machine wash cold.' },
  { name: 'Wool Overshirt', cat: 'Shirting', gender: 'men', price: 13800, images: IMAGES.overshirt,
    colors: ['olive', 'charcoal'], sizes: SIZES_APPAREL,
    description: 'A shirt-jacket in brushed wool — the third layer for cool days.',
    material: '90% wool, 10% polyamide.', care: 'Dry clean.' },

  // Trousers
  { name: 'Pleated Trouser', cat: 'Trousers', gender: 'women', price: 11500, images: IMAGES.trouser,
    colors: ['ink', 'stone'], sizes: SIZES_APPAREL, featured: true,
    description: 'A high-rise pleated trouser with a straight, fluid leg.',
    material: '54% wool, 44% viscose, 2% elastane.', care: 'Dry clean.' },
  { name: 'Selvedge Denim', cat: 'Trousers', gender: 'unisex', price: 13200, compareAt: 15000, images: IMAGES.denim,
    colors: ['navy'], sizes: SIZES_APPAREL,
    description: 'A mid-rise straight jean cut from Japanese selvedge denim.',
    material: '100% cotton selvedge denim.', care: 'Machine wash cold, inside out.' },
  { name: 'Cotton Chino', cat: 'Trousers', gender: 'men', price: 8900, images: IMAGES.chino,
    colors: ['bone', 'olive', 'ink'], sizes: SIZES_APPAREL,
    description: 'A tapered chino in a peached cotton twill.',
    material: '98% cotton, 2% elastane.', care: 'Machine wash warm.' },

  // T-Shirts
  { name: 'Heavyweight Tee', cat: 'T-Shirts', gender: 'unisex', price: 4500, images: IMAGES.teeWhite,
    colors: ['bone', 'ink', 'clay'], sizes: SIZES_APPAREL, featured: true,
    description: 'A boxy heavyweight tee with a clean, structured collar.',
    material: '100% organic cotton, 240gsm.', care: 'Machine wash cold.' },
  { name: 'Pima Pocket Tee', cat: 'T-Shirts', gender: 'men', price: 4900, images: IMAGES.teeBlack,
    colors: ['ink', 'stone'], sizes: SIZES_APPAREL,
    description: 'A softer everyday tee in long-staple Pima cotton with a chest pocket.',
    material: '100% Pima cotton.', care: 'Machine wash cold.' },
  { name: 'Long-Sleeve Tee', cat: 'T-Shirts', gender: 'women', price: 5500, images: IMAGES.teeWhite,
    colors: ['bone', 'clay', 'olive'], sizes: SIZES_APPAREL,
    description: 'A slim long-sleeve tee that sits close without clinging.',
    material: '95% cotton, 5% elastane.', care: 'Machine wash cold.' },

  // Dresses
  { name: 'Cupro Slip Dress', cat: 'Dresses', gender: 'women', price: 14900, images: IMAGES.dressSlip,
    colors: ['stone', 'ink'], sizes: SIZES_APPAREL, featured: true,
    description: 'A bias-cut slip dress with a fluid drape and adjustable straps.',
    material: '100% cupro.', care: 'Hand wash cold.' },
  { name: 'Poplin Midi Dress', cat: 'Dresses', gender: 'women', price: 16500, images: IMAGES.dressMidi,
    colors: ['bone', 'navy'], sizes: SIZES_APPAREL,
    description: 'A gathered-waist midi dress in crisp cotton poplin.',
    material: '100% cotton poplin.', care: 'Machine wash cold.' },
  { name: 'Knit Tank Dress', cat: 'Dresses', gender: 'women', price: 12900, images: IMAGES.dressMidi,
    colors: ['clay', 'charcoal'], sizes: SIZES_APPAREL,
    description: 'A ribbed knit column dress that skims the body.',
    material: '80% viscose, 20% polyester.', care: 'Hand wash cold.' },

  // Footwear
  { name: 'Leather Chelsea Boot', cat: 'Footwear', gender: 'unisex', price: 22000, images: IMAGES.boot,
    colors: ['ink'], sizes: SIZES_SHOE, featured: true,
    description: 'A hand-lasted Chelsea boot on a lightweight rubber sole.',
    material: 'Full-grain calf leather, rubber sole.', care: 'Wipe clean, condition regularly.' },
  { name: 'Court Sneaker', cat: 'Footwear', gender: 'unisex', price: 15500, compareAt: 18000, images: IMAGES.sneaker,
    colors: ['bone'], sizes: SIZES_SHOE,
    description: 'A minimal low-top sneaker in tumbled leather.',
    material: 'Leather upper, rubber cup sole.', care: 'Wipe clean.' },
  { name: 'Suede Loafer', cat: 'Footwear', gender: 'women', price: 17800, images: IMAGES.loafer,
    colors: ['clay', 'ink'], sizes: SIZES_SHOE,
    description: 'A hand-finished penny loafer in soft suede.',
    material: 'Suede upper, leather sole.', care: 'Brush clean, protect from water.' },

  // Accessories
  { name: 'Structured Tote', cat: 'Accessories', gender: 'unisex', price: 18500, images: IMAGES.bag,
    colors: ['ink', 'clay'], sizes: ['One Size'], featured: true,
    description: 'A structured leather tote that holds its shape, day to day.',
    material: 'Vegetable-tanned leather.', care: 'Wipe clean, condition regularly.' },
  { name: 'Wool Scarf', cat: 'Accessories', gender: 'unisex', price: 6500, images: IMAGES.scarf,
    colors: ['bone', 'olive', 'navy'], sizes: ['One Size'],
    description: 'An oversized brushed-wool scarf for the coldest months.',
    material: '100% lambswool.', care: 'Dry clean.' },
  { name: 'Leather Belt', cat: 'Accessories', gender: 'men', price: 5900, images: IMAGES.belt,
    colors: ['ink', 'clay'], sizes: ['S', 'M', 'L'],
    description: 'A 3cm belt in bridle leather with a brushed brass buckle.',
    material: 'Bridle leather, brass hardware.', care: 'Wipe clean.' },
  { name: 'Cotton Cap', cat: 'Accessories', gender: 'unisex', price: 3900, images: IMAGES.cap,
    colors: ['ink', 'bone', 'olive'], sizes: ['One Size'],
    description: 'A six-panel cap in washed cotton twill with a curved brim.',
    material: '100% cotton twill.', care: 'Spot clean.' },
];

// ── Collections ──────────────────────────────────────────────────────────────
const COLLECTIONS = [
  { name: 'Autumn / Winter 25', season: 'AW25', subtitle: 'The cold-weather edit',
    description: 'Layered tailoring, brushed wool and quiet colour for the months ahead.',
    heroImage: img(IMAGES.coat[0]), featured: true, order: 1,
    productNames: ['Wool Overcoat', 'Belted Trench', 'Merino Crew Knit', 'Wool Scarf', 'Leather Chelsea Boot'] },
  { name: 'The Essentials', season: 'Core', subtitle: 'Pieces you reach for first',
    description: 'The permanent collection — considered basics that anchor a wardrobe.',
    heroImage: img(IMAGES.teeWhite[0]), featured: true, order: 2,
    productNames: ['Heavyweight Tee', 'Poplin Shirt', 'Cotton Chino', 'Court Sneaker'] },
  { name: 'Studio Neutrals', season: 'Core', subtitle: 'A palette of bone, stone and ink',
    description: 'A tonal study in restraint — everything works with everything.',
    heroImage: img(IMAGES.trouser[0]), featured: false, order: 3,
    productNames: ['Pleated Trouser', 'Ribbed Turtleneck', 'Cupro Slip Dress', 'Structured Tote'] },
];

// ── Coupons ──────────────────────────────────────────────────────────────────
const COUPONS = [
  { code: 'WELCOME10', type: 'percent', value: 10, minSubtotal: 0, active: true },
  { code: 'ATELIER500', type: 'fixed', value: 500, minSubtotal: 5000, active: true },
  { code: 'FREESHIP', type: 'free_shipping', value: 0, minSubtotal: 10000, active: true },
];

// ── Delivery areas (Algeria) ─────────────────────────────────────────────────
const DELIVERY_AREAS = [
  { wilaya: 'Alger', priceHome: 500, priceDesk: 350, desks: [{ name: 'Alger Centre' }, { name: 'Bab Ezzouar' }, { name: 'Hydra' }] },
  { wilaya: 'Oran', priceHome: 600, priceDesk: 400, desks: [{ name: 'Oran Centre' }, { name: 'Es Sénia' }] },
  { wilaya: 'Constantine', priceHome: 650, priceDesk: 450, desks: [{ name: 'Constantine Centre' }, { name: 'El Khroub' }] },
  { wilaya: 'Blida', priceHome: 550, priceDesk: 400, desks: [{ name: 'Blida Centre' }] },
  { wilaya: 'Annaba', priceHome: 700, priceDesk: 500, desks: [{ name: 'Annaba Centre' }] },
  { wilaya: 'Sétif', priceHome: 650, priceDesk: 450, desks: [{ name: 'Sétif Centre' }] },
];

// ── Accounts ─────────────────────────────────────────────────────────────────
const ADMIN = { name: 'Store Admin', email: 'admin@atelier.dz', password: 'changeme123', usertype: 'superadmin' };
const CUSTOMER = { name: 'Yasmine B.', email: 'customer@atelier.dz', phone: '+213 555 010 203', password: 'password123', usertype: 'user' };

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set. Add it to your environment or .env file.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected — seeding…');

  // Wipe catalog data (preserve users, which are upserted below).
  await Promise.all([
    Product.deleteMany({}),
    Category.deleteMany({}),
    Collection.deleteMany({}),
    Coupon.deleteMany({}),
    Review.deleteMany({}),
    DeliveryArea.deleteMany({}),
  ]);
  console.log('Cleared existing catalog.');

  // Accounts (upsert by email so credentials survive re-runs).
  let customerDoc;
  for (const acct of [ADMIN, CUSTOMER]) {
    let user = await User.findOne({ email: acct.email });
    if (!user) {
      user = await User.create(acct);
      console.log(`Created ${acct.usertype}: ${acct.email}`);
    }
    if (acct === CUSTOMER) customerDoc = user;
  }

  // Categories
  const catByName = {};
  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i];
    const doc = await Category.create({ ...c, slug: slugify(c.name), order: i });
    catByName[c.name] = doc._id;
  }
  console.log(`Seeded ${CATEGORIES.length} categories.`);

  // Products
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
      images: p.images.map((id) => ({ url: img(id), public_id: null, alt: p.name })),
      category: catByName[p.cat],
      gender: p.gender,
      featured: !!p.featured,
      status: 'active',
      variants: makeVariants(p.colors, p.sizes),
    });
    await doc.save(); // triggers the pre-save hook that derives sizes/colors/stock
    productByName[p.name] = doc;
  }
  console.log(`Seeded ${PRODUCTS.length} products.`);

  // Collections
  for (const c of COLLECTIONS) {
    const productIds = c.productNames.map((n) => productByName[n]?._id).filter(Boolean);
    const collection = await Collection.create({
      name: c.name,
      slug: slugify(c.name),
      subtitle: c.subtitle,
      description: c.description,
      season: c.season,
      heroImage: { url: c.heroImage, public_id: null, alt: c.name },
      featured: c.featured,
      order: c.order,
      products: productIds,
    });
    // Back-reference the collection on each product.
    await Product.updateMany({ _id: { $in: productIds } }, { $addToSet: { collections: collection._id } });
  }
  console.log(`Seeded ${COLLECTIONS.length} collections.`);

  // Coupons
  await Coupon.insertMany(COUPONS);
  console.log(`Seeded ${COUPONS.length} coupons.`);

  // Delivery areas
  await DeliveryArea.insertMany(DELIVERY_AREAS);
  console.log(`Seeded ${DELIVERY_AREAS.length} delivery areas.`);

  // A few reviews on featured products, then sync aggregate ratings.
  const reviewSpecs = [
    { product: 'Wool Overcoat', name: 'Sofia K.', rating: 5, title: 'Beautifully made', body: 'The wool is dense and the cut is perfect. Worth every dinar.' },
    { product: 'Merino Crew Knit', name: 'Yasmine B.', rating: 5, title: 'Layering staple', body: 'Soft, not itchy, and the bone colour goes with everything.', customer: customerDoc?._id },
    { product: 'Heavyweight Tee', name: 'Rania M.', rating: 4, title: 'Great weight', body: 'Structured and boxy exactly as described. Runs slightly large.' },
    { product: 'Poplin Shirt', name: 'Karim D.', rating: 5, title: 'Crisp and clean', body: 'Holds a press well and the fabric feels substantial.' },
    { product: 'Leather Chelsea Boot', name: 'Amine T.', rating: 4, title: 'Solid boot', body: 'Comfortable out of the box. Needed a day to break in the heel.' },
  ];
  for (const r of reviewSpecs) {
    const prod = productByName[r.product];
    if (!prod) continue;
    await Review.create({
      product: prod._id,
      customer: r.customer || null,
      name: r.name,
      rating: r.rating,
      title: r.title,
      body: r.body,
      verified: !!r.customer,
    });
    await Review.syncProductRating(prod._id);
  }
  console.log(`Seeded ${reviewSpecs.length} reviews.`);

  await mongoose.disconnect();
  console.log('Done.');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
