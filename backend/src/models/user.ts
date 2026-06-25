import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role: 'customer' | 'admin';
  companyName?: string;
  gstin?: string;
  addresses: IAddress[];
  pricingTier: 'tier_1' | 'tier_2' | 'tier_3';
  comparePassword(password: string): Promise<boolean>;
}

const AddressSchema = new Schema<IAddress>({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, default: 'India' },
  isDefault: { type: Boolean, default: false }
}, { _id: false });

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: { type: String, trim: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer'
  },
  companyName: { type: String, trim: true },
  gstin: { type: String, trim: true },
  addresses: [AddressSchema],
  pricingTier: {
    type: String,
    enum: ['tier_1', 'tier_2', 'tier_3'],
    default: 'tier_1'
  }
}, {
  timestamps: true
});

// Pre-save hook to hash password
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password || '', salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password || '');
};

export const User = model<IUser>('User', UserSchema);
