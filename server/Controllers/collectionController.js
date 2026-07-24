import asyncHandler from 'express-async-handler';
import Collection from '../Models/Collection.js';
import Product from '../Models/Product.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import { slugify } from '../utils/slugify.js';

export const getCollections = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.featured !== undefined) filter.featured = req.query.featured === 'true';
  const collections = await Collection.find(filter).sort({ order: 1, createdAt: -1 }).lean();
  res.json(collections);
});

// GET /api/collections/:slug — collection + its active products.
export const getCollectionBySlug = asyncHandler(async (req, res) => {
  const collection = await Collection.findOne({ slug: req.params.slug }).lean();
  if (!collection) {
    res.status(404);
    throw new Error('Collection not found');
  }
  const products = await Product.find({ collections: collection._id, status: 'active' })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ ...collection, products });
});

export const createCollection = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) {
    res.status(400);
    throw new Error('Collection name is required');
  }
  let heroImage = { url: null, public_id: null, alt: '' };
  if (req.file) {
    const uploaded = await uploadToCloudinary(req.file);
    heroImage = { ...uploaded, alt: name };
  }
  const collection = await Collection.create({
    name: name.trim(),
    slug: slugify(name),
    subtitle: req.body.subtitle?.trim() || '',
    description: req.body.description?.trim() || '',
    season: req.body.season?.trim() || '',
    featured: req.body.featured === 'true' || req.body.featured === true,
    order: Number(req.body.order) || 0,
    products: parseProducts(req.body.products),
    heroImage,
  });
  res.status(201).json(collection);
});

export const updateCollection = asyncHandler(async (req, res) => {
  const collection = await Collection.findById(req.params.id);
  if (!collection) {
    res.status(404);
    throw new Error('Collection not found');
  }
  const b = req.body;
  if (b.name) {
    collection.name = b.name.trim();
    collection.slug = slugify(b.name);
  }
  if (b.subtitle !== undefined) collection.subtitle = b.subtitle.trim();
  if (b.description !== undefined) collection.description = b.description.trim();
  if (b.season !== undefined) collection.season = b.season.trim();
  if (b.featured !== undefined) collection.featured = b.featured === 'true' || b.featured === true;
  if (b.order !== undefined) collection.order = Number(b.order);
  if (b.products !== undefined) collection.products = parseProducts(b.products);
  if (req.file) {
    if (collection.heroImage?.public_id) {
      await deleteFromCloudinary(collection.heroImage.public_id).catch(() => {});
    }
    const uploaded = await uploadToCloudinary(req.file);
    collection.heroImage = { ...uploaded, alt: collection.name };
  }
  await collection.save();
  res.json(collection);
});

export const deleteCollection = asyncHandler(async (req, res) => {
  const collection = await Collection.findById(req.params.id);
  if (!collection) {
    res.status(404);
    throw new Error('Collection not found');
  }
  if (collection.heroImage?.public_id) {
    await deleteFromCloudinary(collection.heroImage.public_id).catch(() => {});
  }
  await collection.deleteOne();
  res.json({ message: 'Collection deleted' });
});

function parseProducts(raw) {
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
