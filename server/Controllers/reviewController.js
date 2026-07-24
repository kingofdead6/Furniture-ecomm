import asyncHandler from 'express-async-handler';
import Review from '../Models/Review.js';
import Order from '../Models/Order.js';

// GET /api/reviews/product/:productId  (public)
export const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId, status: 'published' })
    .sort({ createdAt: -1 })
    .lean();
  res.json(reviews);
});

// POST /api/reviews  (optionalAuth) { product, name, rating, title, body }
export const createReview = asyncHandler(async (req, res) => {
  const { product, name, rating, title, body } = req.body;
  if (!product || !name || !rating) {
    res.status(400);
    throw new Error('Product, name and rating are required');
  }
  const numericRating = Number(rating);
  if (numericRating < 1 || numericRating > 5) {
    res.status(400);
    throw new Error('Rating must be between 1 and 5');
  }

  // Mark verified if a logged-in customer has an order containing this product.
  let verified = false;
  if (req.user) {
    const purchased = await Order.exists({ customer: req.user._id, 'items.productId': product });
    verified = Boolean(purchased);
  }

  const review = await Review.create({
    product,
    customer: req.user?._id || null,
    name: name.trim(),
    rating: numericRating,
    title: title?.trim() || '',
    body: body?.trim() || '',
    verified,
  });

  await Review.syncProductRating(product);
  res.status(201).json(review);
});

// GET /api/reviews  (admin)
export const getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({})
    .populate('product', 'name slug')
    .sort({ createdAt: -1 })
    .lean();
  res.json(reviews);
});

// DELETE /api/reviews/:id  (admin)
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }
  const productId = review.product;
  await review.deleteOne();
  await Review.syncProductRating(productId);
  res.json({ message: 'Review deleted' });
});
