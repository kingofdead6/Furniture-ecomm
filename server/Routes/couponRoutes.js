import express from 'express';
import { protect, admin } from '../Middleware/auth.js';
import {
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '../Controllers/couponController.js';

const router = express.Router();

// Public — preview a discount (checkout re-validates server-side).
router.post('/validate', validateCoupon);

// Admin
router.get('/', protect, admin, getCoupons);
router.post('/', protect, admin, createCoupon);
router.put('/:id', protect, admin, updateCoupon);
router.delete('/:id', protect, admin, deleteCoupon);

export default router;
