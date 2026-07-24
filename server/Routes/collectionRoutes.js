import express from 'express';
import multer from 'multer';
import { protect, admin } from '../Middleware/auth.js';
import {
  getCollections,
  getCollectionBySlug,
  createCollection,
  updateCollection,
  deleteCollection,
} from '../Controllers/collectionController.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

// Public
router.get('/', getCollections);
router.get('/:slug', getCollectionBySlug);

// Admin
router.post('/', protect, admin, upload.single('heroImage'), createCollection);
router.put('/:id', protect, admin, upload.single('heroImage'), updateCollection);
router.delete('/:id', protect, admin, deleteCollection);

export default router;
