import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { QuoteRequest } from '../models/quoteRequest';
import { Product } from '../models/product';
import { AppError } from '../utils/AppError';

// 1. Submit a Quote Request (Optionally authenticated)
export const createQuoteRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { items, guestDetails, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return next(new AppError('Please provide a list of items for the quote request', 400));
    }

    // Validate that products exist and quantities are correct
    for (const item of items) {
      if (!item.product || !item.requestedQuantity || item.requestedQuantity < 1) {
        return next(new AppError('Invalid product or quantity in items list', 400));
      }
      const productExists = await Product.findById(item.product);
      if (!productExists) {
        return next(new AppError(`Product with ID ${item.product} does not exist`, 404));
      }
    }

    const newQuoteData: any = {
      items,
      notes,
      status: 'pending'
    };

    // If user is authenticated, link to customer account
    if (req.user) {
      newQuoteData.customer = req.user._id;
    } else {
      // Guest submission: guestDetails are mandatory
      if (!guestDetails || !guestDetails.name || !guestDetails.email || !guestDetails.phone) {
        return next(new AppError('Guest contact details (name, email, phone) are required', 400));
      }
      newQuoteData.guestDetails = guestDetails;
      // Generate a secure access token for Method A (Guest secure access)
      newQuoteData.token = crypto.randomBytes(24).toString('hex');
    }

    const quoteRequest = await QuoteRequest.create(newQuoteData);

    res.status(201).json({
      status: 'success',
      data: {
        quoteRequest
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Fetch logged-in user's quote requests (Customer Only)
export const getMyQuotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AppError('You are not logged in', 401));
    }

    const quotes = await QuoteRequest.find({ customer: req.user._id })
      .populate('items.product')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: quotes.length,
      data: {
        quotes
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Fetch all quote requests (Admin Only)
export const getAllQuotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const quotes = await QuoteRequest.find()
      .populate('customer', 'name email phone companyName gstin')
      .populate('items.product')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: quotes.length,
      data: {
        quotes
      }
    });
  } catch (error) {
    next(error);
  }
};

// 4. Secure access lookup by token (Method A - Public Guest access)
export const getQuoteByToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.params;

    if (!token) {
      return next(new AppError('Secure token is missing', 400));
    }

    const quote = await QuoteRequest.findOne({ token }).populate('items.product');

    if (!quote) {
      return next(new AppError('Quote request not found or token has expired', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        quote
      }
    });
  } catch (error) {
    next(error);
  }
};

// 5. Link guest quote to registered user (Method B - Purchase requirement)
export const linkQuoteToUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AppError('You must be logged in to link quote requests', 401));
    }

    const { quoteNumber, token } = req.body;

    if (!quoteNumber || !token) {
      return next(new AppError('Quote number and secure token are required', 400));
    }

    const quote = await QuoteRequest.findOne({ quoteNumber, token });

    if (!quote) {
      return next(new AppError('Invalid quote details or unauthorized token verification failed', 404));
    }

    if (quote.customer) {
      return next(new AppError('This quote is already linked to an account', 400));
    }

    // Bind quote request to active logged in user
    quote.customer = req.user._id;
    // We can clear the guest token since it is now linked to a permanent user profile
    quote.token = undefined;
    await quote.save();

    res.status(200).json({
      status: 'success',
      message: 'Quote request linked to your profile successfully',
      data: {
        quote
      }
    });
  } catch (error) {
    next(error);
  }
};

// 6. Respond to a quote with pricing (Admin Only)
export const respondToQuote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { offeredPrices, adminFeedback } = req.body; // offeredPrices is an object mapping product ID to proposed price

    if (!offeredPrices || typeof offeredPrices !== 'object') {
      return next(new AppError('Please provide offered prices mapping', 400));
    }

    const quote = await QuoteRequest.findById(id);

    if (!quote) {
      return next(new AppError('Quote request not found', 404));
    }

    // Update offered price for items matching provided offeredPrices list
    quote.items.forEach(item => {
      const prodId = item.product.toString();
      if (offeredPrices[prodId] !== undefined) {
        item.offeredPrice = Number(offeredPrices[prodId]);
      }
    });

    quote.status = 'responded';
    if (adminFeedback) {
      quote.adminFeedback = adminFeedback;
    }

    await quote.save();

    res.status(200).json({
      status: 'success',
      data: {
        quote
      }
    });
  } catch (error) {
    next(error);
  }
};

// 7. Accept or Reject Quote Offer
export const updateQuoteStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, token } = req.body; // status is 'accepted' or 'rejected'

    if (!['accepted', 'rejected'].includes(status)) {
      return next(new AppError('Invalid status update. Must accept or reject', 400));
    }

    // Find the quote
    const quote = await QuoteRequest.findById(id);
    if (!quote) {
      return next(new AppError('Quote request not found', 404));
    }

    // Access check: Either the user owns it, or they have the matching secure guest token
    const isOwner = req.user && quote.customer && quote.customer.toString() === req.user._id.toString();
    const isGuestTokenValid = token && quote.token === token;

    if (!isOwner && !isGuestTokenValid) {
      return next(new AppError('You do not have permission to modify this quote request', 403));
    }

    quote.status = status;
    await quote.save();

    res.status(200).json({
      status: 'success',
      message: `Quote request marked as ${status} successfully`,
      data: {
        quote
      }
    });
  } catch (error) {
    next(error);
  }
};
