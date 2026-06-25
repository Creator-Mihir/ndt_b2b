import { Schema, model, Document, Types } from 'mongoose';

export interface IOrderItem {
  product: Types.ObjectId;
  name: string; // Snapshotted name
  price: number; // Applied price at purchase
  quantity: number;
  subtotal: number;
}

export interface IOrderAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  customer: Types.ObjectId;
  items: IOrderItem[];
  companyName?: string;
  gstin?: string;
  shippingAddress: IOrderAddress;
  billingAddress: IOrderAddress;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  shippingCharges: number;
  total: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  shippingStatus: 'pending' | 'packed' | 'dispatched' | 'in_transit' | 'delivered' | 'cancelled';
  shiprocketOrderId?: string;
  trackingNumber?: string;
  invoiceUrl?: string;
}

const OrderItemSchema = new Schema<IOrderItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true, min: 0 }
}, { _id: false });

const OrderAddressSchema = new Schema<IOrderAddress>({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, default: 'India' }
}, { _id: false });

const OrderSchema = new Schema<IOrder>({
  orderNumber: { type: String, required: true, unique: true },
  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: [OrderItemSchema],
  companyName: { type: String, trim: true },
  gstin: { type: String, trim: true },
  shippingAddress: { type: OrderAddressSchema, required: true },
  billingAddress: { type: OrderAddressSchema, required: true },
  subtotal: { type: Number, required: true, min: 0 },
  cgst: { type: Number, required: true, default: 0, min: 0 },
  sgst: { type: Number, required: true, default: 0, min: 0 },
  igst: { type: Number, required: true, default: 0, min: 0 },
  shippingCharges: { type: Number, required: true, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  razorpayOrderId: { type: String, trim: true },
  razorpayPaymentId: { type: String, trim: true },
  shippingStatus: {
    type: String,
    enum: ['pending', 'packed', 'dispatched', 'in_transit', 'delivered', 'cancelled'],
    default: 'pending'
  },
  shiprocketOrderId: { type: String, trim: true },
  trackingNumber: { type: String, trim: true },
  invoiceUrl: { type: String, trim: true }
}, {
  timestamps: true
});

// Middleware to calculate total before saving if not already set manually
OrderSchema.pre<IOrder>('validate', function (next) {
  if (!this.orderNumber) {
    const randomSuffix = Math.floor(100 + Math.random() * 900); // 3-digit random
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
    this.orderNumber = `CONEX-${dateStr}-${randomSuffix}`;
  }
  
  // Compute GST based on shipping state compared to merchant operating state (Maharashtra)
  // Let's assume standard B2B GST rate is 18% for Cables/NDT items
  const standardGstRate = 0.18;
  
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Normalize state names to check if it matches Maharashtra
    const shipState = (this.shippingAddress?.state || '').trim().toLowerCase();
    
    if (shipState === 'maharashtra') {
      // Intra-state: CGST (9%) + SGST (9%)
      this.cgst = Number((this.subtotal * (standardGstRate / 2)).toFixed(2));
      this.sgst = Number((this.subtotal * (standardGstRate / 2)).toFixed(2));
      this.igst = 0;
    } else {
      // Inter-state: IGST (18%)
      this.cgst = 0;
      this.sgst = 0;
      this.igst = Number((this.subtotal * standardGstRate).toFixed(2));
    }
    
    this.total = Number((this.subtotal + this.cgst + this.sgst + this.igst + this.shippingCharges).toFixed(2));
  }
  
  next();
});

export const Order = model<IOrder>('Order', OrderSchema);
