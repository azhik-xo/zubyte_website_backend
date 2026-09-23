import express from 'express';
import { getImage, getImageMetadata, deleteImage } from '../controllers/imageController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// Public streaming & metadata routes
router.get('/:id/info', getImageMetadata);
router.get('/:id', getImage);

// Protected deletion route
router.delete('/:id', protect, deleteImage);

export default router;

