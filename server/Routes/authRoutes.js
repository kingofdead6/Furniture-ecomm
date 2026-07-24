import express from 'express';
import {
  loginUser,
  registerUser,
  registerSuperAdmin,
  updatePassword,
  deleteUser,
  updateUser,
  getUsers,
  registerCustomer,
  getMe,
  updateMe,
  addAddress,
  updateAddress,
  deleteAddress,
  getWishlist,
  toggleWishlist,
  getCustomers,
} from '../Controllers/auth.js';
import { protect, superadmin, admin } from '../Middleware/auth.js';

const router = express.Router();

// Public
router.post('/login', loginUser);
router.post('/register-customer', registerCustomer);
router.post('/register-superadmin', registerSuperAdmin);

// Authenticated customer (self-service)
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.post('/me/addresses', protect, addAddress);
router.put('/me/addresses/:addressId', protect, updateAddress);
router.delete('/me/addresses/:addressId', protect, deleteAddress);
router.get('/me/wishlist', protect, getWishlist);
router.post('/me/wishlist', protect, toggleWishlist);

// Admin — customer directory
router.get('/customers', protect, admin, getCustomers);

// Superadmin — staff management
router.post('/register', protect, superadmin, registerUser);
router.get('/users', protect, superadmin, getUsers);
router.put('/users/:id', protect, superadmin, updateUser);
router.delete('/users/:id', protect, superadmin, deleteUser);
router.put('/users/:id/password', protect, superadmin, updatePassword);

export default router;
