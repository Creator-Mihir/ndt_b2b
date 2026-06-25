import { Router } from 'express';
import {
  signup,
  login,
  getMe,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  createLead
} from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/leads', createLead);

// Protected routes (require JWT verification)
router.use(protect);

router.get('/me', getMe);
router.put('/profile', updateProfile);
router.post('/addresses', addAddress);
router.put('/addresses/:index', updateAddress);
router.delete('/addresses/:index', deleteAddress);

export default router;
