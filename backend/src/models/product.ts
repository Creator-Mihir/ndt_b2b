import { Schema, model, Document } from 'mongoose';

export interface ISpecification {
  name: string;
  value: string;
}

export interface ITieredPrices {
  tier_1: number; // Retail / Base tier price
  tier_2: number; // Mid-tier bulk price
  tier_3: number; // High-tier bulk price
}

export interface IProduct extends Document {
  name: string;
  sku: string;
  slug: string;
  description: string;
  category: string;
  images: string[];
  specifications: ISpecification[];
  datasheetUrl?: string;
  basePrice: number; // MSRP / List price
  tieredPrices: ITieredPrices;
  stock: number;
  status: 'active' | 'draft';
}

const SpecificationSchema = new Schema<ISpecification>({
  name: { type: String, required: true, trim: true },
  value: { type: String, required: true, trim: true }
}, { _id: false });

const TieredPricesSchema = new Schema<ITieredPrices>({
  tier_1: { type: Number, required: true, min: 0 },
  tier_2: { type: Number, required: true, min: 0 },
  tier_3: { type: Number, required: true, min: 0 }
}, { _id: false });

const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, required: true, trim: true },
  images: { type: [String], default: [] },
  specifications: [SpecificationSchema],
  datasheetUrl: { type: String, trim: true },
  basePrice: { type: Number, required: true, min: 0 },
  tieredPrices: { type: TieredPricesSchema, required: true },
  stock: { type: Number, required: true, default: 0, min: 0 },
  status: { type: String, enum: ['active', 'draft'], default: 'draft' }
}, {
  timestamps: true
});

export const Product = model<IProduct>('Product', ProductSchema);
