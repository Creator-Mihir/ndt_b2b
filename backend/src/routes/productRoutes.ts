import { Router } from 'express';
import {
  getAllProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController';
import { protect, restrictTo, optionalProtect } from '../middlewares/authMiddleware';

const router = Router();

// Public routes
router.get('/', optionalProtect, getAllProducts);
router.get('/:slug', getProductBySlug);

// Admin-only protected routes
router.use(protect, restrictTo('admin'));

router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
