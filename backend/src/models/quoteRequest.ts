import { Schema, model, Document, Types } from 'mongoose';

export interface IQuoteItem {
  product: Types.ObjectId;
  requestedQuantity: number;
  offeredPrice?: number; // Proposed price from admin
}

export interface IGuestDetails {
  name: string;
  email: string;
  phone: string;
  companyName?: string;
  gstin?: string;
}

export interface IQuoteRequest extends Document {
  quoteNumber: string;
  customer?: Types.ObjectId; // Optional: reference to registered User
  guestDetails?: IGuestDetails; // Optional: details if user is not registered
  items: IQuoteItem[];
  status: 'pending' | 'responded' | 'accepted' | 'rejected';
  notes?: string;
  adminFeedback?: string;
  token?: string; // Secure token for guest access
}

const QuoteItemSchema = new Schema<IQuoteItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  requestedQuantity: { type: Schema.Types.Number, required: true, min: 1 },
  offeredPrice: { type: Schema.Types.Number }
}, { _id: false });

const GuestDetailsSchema = new Schema<IGuestDetails>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  companyName: { type: String, trim: true },
  gstin: { type: String, trim: true }
}, { _id: false });

const QuoteRequestSchema = new Schema<IQuoteRequest>({
  quoteNumber: { type: String, required: true, unique: true },
  customer: { type: Schema.Types.ObjectId, ref: 'User' },
  guestDetails: { type: GuestDetailsSchema },
  items: { type: [QuoteItemSchema], required: true },
  status: {
    type: String,
    enum: ['pending', 'responded', 'accepted', 'rejected'],
    default: 'pending'
  },
  token: { type: String, unique: true, sparse: true },
  notes: { type: String },
  adminFeedback: { type: String }
}, {
  timestamps: true
});

// Auto-generate unique quoteNumber before validation
QuoteRequestSchema.pre<IQuoteRequest>('validate', function (next) {
  if (!this.quoteNumber) {
    const randomSuffix = Math.floor(100 + Math.random() * 900); // 3-digit random
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
    this.quoteNumber = `REQ-${dateStr}-${randomSuffix}`;
  }
  next();
});

export const QuoteRequest = model<IQuoteRequest>('QuoteRequest', QuoteRequestSchema);
