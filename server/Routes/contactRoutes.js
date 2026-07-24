import express from 'express';
import { protect, admin } from '../Middleware/auth.js';
import {
  createContact,
  getAllContacts,
  deleteContact,
} from '../Controllers/contactController.js';

const router = express.Router();

// Public route
router.post('/', createContact);

// Admin routes
router.get('/', protect, admin, getAllContacts);
router.delete('/:id', protect, admin, deleteContact);

export default router;
