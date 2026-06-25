import { Schema, model, Document, Types } from 'mongoose';

export interface ILead extends Document {
  name: string;
  company: string;
  email: string;
  mobile: string;
  address: string;
  product: Types.ObjectId; // Reference to the product they downloaded the sheet for
  createdAccount: boolean;  // Tracks if the lead turned into an account immediately
}

const LeadSchema = new Schema<ILead>({
  name: { type: String, required: true, trim: true },
  company: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  mobile: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  createdAccount: { type: Boolean, default: false }
}, {
  timestamps: true
});

export const Lead = model<ILead>('Lead', LeadSchema);
