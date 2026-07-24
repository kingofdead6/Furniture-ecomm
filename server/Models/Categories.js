import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, default: '' },
    image: {
      url: { type: String, default: null },
      public_id: { type: String, default: null },
    },
    order: { type: Number, default: 0 }, // manual sort weight for the nav
  },
  { timestamps: true }
);

export default mongoose.model('Category', categorySchema);
