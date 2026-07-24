import mongoose from 'mongoose';

// A single sellable configuration of a product — one size + color combination.
// Stock is tracked here, not at the product level, so the storefront can show
// per-variant availability and checkout can decrement the exact SKU purchased.
const variantSchema = new mongoose.Schema(
  {
    size: { type: String, required: true, trim: true },      // e.g. "S", "M", "42"
    color: { type: String, required: true, trim: true },     // human name, e.g. "Bone"
    colorHex: { type: String, default: '#000000' },          // swatch color
    sku: { type: String, required: true, trim: true },       // unique per product
    stock: { type: Number, default: 0, min: 0 },
    // Optional per-variant price. Falls back to the product price when null.
    priceOverride: { type: Number, default: null, min: 0 },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, default: '' },
    // Longer editorial copy shown on the product page under "Details".
    details: { type: String, trim: true, default: '' },
    material: { type: String, trim: true, default: '' },
    care: { type: String, trim: true, default: '' },

    price: { type: Number, required: true, min: 0 },
    // Original price for showing a markdown. Only rendered when > price.
    compareAtPrice: { type: Number, default: null, min: 0 },

    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, default: null },
        alt: { type: String, default: '' },
      },
    ],

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    collections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Collection' }],

    gender: {
      type: String,
      enum: ['women', 'men', 'unisex'],
      default: 'unisex',
    },

    variants: [variantSchema],

    // Denormalised facets derived from variants — kept in sync on save so the
    // Shop filters (size / color) can query without unwinding subdocuments.
    sizes: [{ type: String }],
    colors: [{ name: String, hex: String }],

    // Maintained as the sum of variant stock (or a standalone value when a
    // product has no variants). Lets list views show in/out of stock cheaply.
    stock: { type: Number, default: 0, min: 0 },

    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },

    featured: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'draft'], default: 'active' },
  },
  { timestamps: true }
);

// Full-text search across name + description for the Shop search bar.
productSchema.index({ name: 'text', description: 'text', details: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ collections: 1 });

// Keep the derived facets and total stock consistent with the variant list.
productSchema.pre('save', function (next) {
  if (this.variants && this.variants.length > 0) {
    this.sizes = [...new Set(this.variants.map((v) => v.size))];
    const colorMap = new Map();
    for (const v of this.variants) {
      if (!colorMap.has(v.color)) colorMap.set(v.color, v.colorHex || '#000000');
    }
    this.colors = [...colorMap.entries()].map(([name, hex]) => ({ name, hex }));
    this.stock = this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  }
  next();
});

export default mongoose.model('Product', productSchema);
