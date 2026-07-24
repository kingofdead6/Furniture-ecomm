import express from 'express';
import {
  createOrder,
  getAllOrders,
  updateOrderStatus,
  getMyOrders,
  getOrderById,
} from '../Controllers/orderController.js';
import { protect, admin, optionalAuth } from '../Middleware/auth.js';

const router = express.Router();

// Guest or logged-in checkout (optionalAuth links the order to an account).
router.post('/create', optionalAuth, createOrder);

// Customer self-service
router.get('/mine', protect, getMyOrders);

// Admin
router.get('/', protect, admin, getAllOrders);
router.put('/:id/status', protect, admin, updateOrderStatus);

// Owner or admin (keep after the fixed routes above)
router.get('/:id', protect, getOrderById);

export default router;
