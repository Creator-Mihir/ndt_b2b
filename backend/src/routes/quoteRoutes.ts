import { Router } from 'express';
import {
  createQuoteRequest,
  getMyQuotes,
  getAllQuotes,
  getQuoteByToken,
  linkQuoteToUser,
  respondToQuote,
  updateQuoteStatus
} from '../controllers/quoteController';
import { protect, restrictTo, optionalProtect } from '../middlewares/authMiddleware';

const router = Router();

// Public / Guest accessible routes
router.post('/', optionalProtect, createQuoteRequest);
router.get('/token/:token', getQuoteByToken);
router.put('/:id/status', optionalProtect, updateQuoteStatus);

// Authenticated user (customer/admin) routes
router.get('/my', protect, getMyQuotes);
router.post('/link', protect, linkQuoteToUser);

// Admin-only routes
router.get('/', protect, restrictTo('admin'), getAllQuotes);
router.put('/:id/respond', protect, restrictTo('admin'), respondToQuote);

export default router;
