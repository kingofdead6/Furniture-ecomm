import express from 'express';
import { protect, admin, optionalAuth } from '../Middleware/auth.js';
import {
  getProductReviews,
  createReview,
  getAllReviews,
  deleteReview,
} from '../Controllers/reviewController.js';

const router = express.Router();

// Public / customer
router.get('/product/:productId', getProductReviews);
router.post('/', optionalAuth, createReview);

// Admin
router.get('/', protect, admin, getAllReviews);
router.delete('/:id', protect, admin, deleteReview);

export default router;
