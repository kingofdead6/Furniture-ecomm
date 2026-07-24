import asyncHandler from 'express-async-handler';
import Product from '../Models/Product.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import { getPagination } from '../utils/paginate.js';
import { slugify } from '../utils/slugify.js';

const SORT_MAP = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  name_asc: { name: 1 },
  name_desc: { name: -1 },
  rating: { ratingAvg: -1 },
};

// GET /api/products
// Supports: page, limit, sort, search, category, collection, gender, size,
// color, minPrice, maxPrice, featured, status.
export const getProducts = asyncHandler(async (req, res) => {
  const {
    category,
    collection,
    gender,
    size,
    color,
    minPrice,
    maxPrice,
    featured,
    search,
    sort = 'newest',
    status,
  } = req.query;

  const query = {};

  // Storefront only ever sees active products; admin can pass status=all.
  if (status === 'all') {
    // no status filter
  } else if (status) {
    query.status = status;
  } else {
    query.status = 'active';
  }

  if (category) query.category = category;
  if (collection) query.collections = collection;
  if (gender) query.gender = gender;
  if (size) query.sizes = size;
  if (color) query['colors.name'] = color;
  if (featured !== undefined) query.featured = featured === 'true';

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const { skip, limit, meta } = getPagination(req.query);
  const sortSpec = SORT_MAP[sort] || SORT_MAP.newest;

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('category', 'name slug')
      .sort(sortSpec)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(query),
  ]);

  res.json({ products, pagination: meta(total) });
});

// GET /api/products/facets — distinct sizes/colors/price range for filter UI.
export const getFacets = asyncHandler(async (req, res) => {
  const base = { status: 'active' };
  const [sizes, colors, priceRange] = await Promise.all([
    Product.distinct('sizes', base),
    Product.distinct('colors', base),
    Product.aggregate([
      { $match: base },
      { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } },
    ]),
  ]);

  // Dedupe colors by name (distinct on subdoc returns per-hex duplicates).
  const colorMap = new Map();
  for (const c of colors) {
    if (c?.name && !colorMap.has(c.name)) colorMap.set(c.name, c.hex);
  }

  res.json({
    sizes: sizes.filter(Boolean).sort(),
    colors: [...colorMap.entries()].map(([name, hex]) => ({ name, hex })),
    priceRange: priceRange[0] ? { min: priceRange[0].min, max: priceRange[0].max } : { min: 0, max: 0 },
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name slug')
    .populate('collections', 'name slug')
    .lean();
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json(product);
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug })
    .populate('category', 'name slug')
    .populate('collections', 'name slug')
    .lean();
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json(product);
});

// GET /api/products/:id/related — same category, excluding the product itself.
export const getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  const related = await Product.find({
    _id: { $ne: product._id },
    status: 'active',
    category: product.category,
  })
    .populate('category', 'name slug')
    .sort({ ratingAvg: -1, createdAt: -1 })
    .limit(4)
    .lean();
  res.json(related);
});

function parseVariants(body) {
  if (!body.variants) return [];
  try {
    const parsed = typeof body.variants === 'string' ? JSON.parse(body.variants) : body.variants;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((v) => ({
      size: String(v.size || '').trim(),
      color: String(v.color || '').trim(),
      colorHex: v.colorHex || '#000000',
      sku: String(v.sku || '').trim(),
      stock: Number(v.stock) || 0,
      priceOverride: v.priceOverride != null && v.priceOverride !== '' ? Number(v.priceOverride) : null,
    }));
  } catch {
    return [];
  }
}

function parseCollections(body) {
  if (!body.collections) return [];
  try {
    const parsed = typeof body.collections === 'string' ? JSON.parse(body.collections) : body.collections;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const createProduct = asyncHandler(async (req, res) => {
  const { name, category, price } = req.body;
  if (!name || !category || price === undefined) {
    res.status(400);
    throw new Error('Name, category and price are required');
  }

  const images = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const { url, public_id } = await uploadToCloudinary(file);
      images.push({ url, public_id, alt: name });
    }
  }

  const variants = parseVariants(req.body);

  const product = new Product({
    name: name.trim(),
    slug: slugify(name),
    category,
    price: Number(price),
    compareAtPrice: req.body.compareAtPrice ? Number(req.body.compareAtPrice) : null,
    stock: req.body.stock !== undefined ? Number(req.body.stock) : 0,
    description: req.body.description?.trim() || '',
    details: req.body.details?.trim() || '',
    material: req.body.material?.trim() || '',
    care: req.body.care?.trim() || '',
    gender: req.body.gender || 'unisex',
    featured: req.body.featured === 'true' || req.body.featured === true,
    status: req.body.status || 'active',
    collections: parseCollections(req.body),
    variants,
    images,
  });

  await product.save();
  res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const b = req.body;
  if (b.name) {
    product.name = b.name.trim();
    product.slug = slugify(b.name);
  }
  if (b.category) product.category = b.category;
  if (b.price !== undefined) product.price = Number(b.price);
  if (b.compareAtPrice !== undefined)
    product.compareAtPrice = b.compareAtPrice ? Number(b.compareAtPrice) : null;
  if (b.stock !== undefined) product.stock = Number(b.stock);
  if (b.description !== undefined) product.description = b.description.trim();
  if (b.details !== undefined) product.details = b.details.trim();
  if (b.material !== undefined) product.material = b.material.trim();
  if (b.care !== undefined) product.care = b.care.trim();
  if (b.gender !== undefined) product.gender = b.gender;
  if (b.featured !== undefined) product.featured = b.featured === 'true' || b.featured === true;
  if (b.status !== undefined) product.status = b.status;
  if (b.collections !== undefined) product.collections = parseCollections(b);
  if (b.variants !== undefined) product.variants = parseVariants(b);

  // Remove images the admin deleted (list of public_ids or urls to keep).
  if (b.removeImages) {
    let toRemove = [];
    try {
      toRemove = typeof b.removeImages === 'string' ? JSON.parse(b.removeImages) : b.removeImages;
    } catch {
      toRemove = [];
    }
    for (const img of product.images) {
      if (toRemove.includes(img.public_id) || toRemove.includes(img.url)) {
        if (img.public_id) await deleteFromCloudinary(img.public_id).catch(() => {});
      }
    }
    product.images = product.images.filter(
      (img) => !toRemove.includes(img.public_id) && !toRemove.includes(img.url)
    );
  }

  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const { url, public_id } = await uploadToCloudinary(file);
      product.images.push({ url, public_id, alt: product.name });
    }
  }

  const updated = await product.save();
  res.json(updated);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  for (const img of product.images) {
    if (img.public_id) await deleteFromCloudinary(img.public_id).catch(() => {});
  }
  await product.deleteOne();
  res.json({ message: 'Product deleted' });
});
