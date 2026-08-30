import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProductSuite,
  updateProductSuite,
  deleteProductSuite,
} from '../controllers/productController.js';
import { requireFields } from '../middlewares/validate.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Protected Admin & Developer mutations
router.post(
  '/',
  protect,
  requireFields(['id', 'label', 'suite', 'tagline', 'desc']),
  createProductSuite
);
router.put('/:id', protect, updateProductSuite);
router.delete('/:id', protect, authorize('admin'), deleteProductSuite);

export default router;
