import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, default: '' },
    body: { type: String, trim: true, default: '' },
    verified: { type: Boolean, default: false },
    status: { type: String, enum: ['published', 'hidden'], default: 'published' },
  },
  { timestamps: true }
);

reviewSchema.index({ product: 1, status: 1 });

// Recompute the parent product's aggregate rating whenever reviews change.
reviewSchema.statics.syncProductRating = async function (productId) {
  const Product = mongoose.model('Product');
  const agg = await this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId), status: 'published' } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const { avg = 0, count = 0 } = agg[0] || {};
  await Product.findByIdAndUpdate(productId, {
    ratingAvg: Math.round(avg * 10) / 10,
    ratingCount: count,
  });
};

export default mongoose.model('Review', reviewSchema);
