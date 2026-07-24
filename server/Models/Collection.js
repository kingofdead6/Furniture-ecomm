import mongoose from 'mongoose';

// A curated grouping of products for the Lookbook / Collections pages
// (e.g. a seasonal drop). Distinct from Category, which is the taxonomic
// bucket a product permanently belongs to.
const collectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    subtitle: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    season: { type: String, trim: true, default: '' }, // e.g. "AW25"
    heroImage: {
      url: { type: String, default: null },
      public_id: { type: String, default: null },
      alt: { type: String, default: '' },
    },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 }, // manual sort weight
  },
  { timestamps: true }
);

export default mongoose.model('Collection', collectionSchema);
