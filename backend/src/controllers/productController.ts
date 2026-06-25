import { Request, Response, NextFunction } from 'express';
import { Product } from '../models/product';
import { AppError } from '../utils/AppError';

// Helper to generate a slug from a product name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

// 1. Get All Products (supporting search and category filters)
export const getAllProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, category, status } = req.query;
    
    // Build query object
    const query: any = {};

    // Filter by status. By default, regular users only see 'active' products.
    // If user is admin and requests a specific status, allow it. Otherwise, force 'active'.
    const isAdmin = req.user && req.user.role === 'admin';
    if (isAdmin && status) {
      query.status = status;
    } else {
      query.status = 'active';
    }

    // Filter by category
    if (category) {
      query.category = String(category);
    }

    // Fuzzy search across Name, SKU, Category, and Description
    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      query.$or = [
        { name: searchRegex },
        { sku: searchRegex },
        { category: searchRegex },
        { description: searchRegex }
      ];
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: products.length,
      data: {
        products
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Single Product by Slug
export const getProductBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ slug });

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        product
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Create Product (Admin Only)
export const createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, sku, slug, description, category, images, specifications, basePrice, tieredPrices, stock, status } = req.body;

    if (!name || !sku || !description || !category || !basePrice || !tieredPrices) {
      return next(new AppError('Required product fields are missing', 400));
    }

    // Generate slug if not provided
    const productSlug = slug ? slug.toLowerCase().trim() : generateSlug(name);

    // Check SKU and Slug uniqueness
    const existingSku = await Product.findOne({ sku: sku.toUpperCase().trim() });
    if (existingSku) {
      return next(new AppError('Product with this SKU already exists', 400));
    }

    const existingSlug = await Product.findOne({ slug: productSlug });
    if (existingSlug) {
      return next(new AppError('Product with this Slug already exists', 400));
    }

    const newProduct = await Product.create({
      name,
      sku: sku.toUpperCase().trim(),
      slug: productSlug,
      description,
      category,
      images: images || [],
      specifications: specifications || [],
      basePrice,
      tieredPrices,
      stock: stock || 0,
      status: status || 'draft'
    });

    res.status(201).json({
      status: 'success',
      data: {
        product: newProduct
      }
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update Product (Admin Only)
export const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Normalize slug or SKU if they are updated
    if (updateData.slug) updateData.slug = updateData.slug.toLowerCase().trim();
    if (updateData.sku) updateData.sku = updateData.sku.toUpperCase().trim();

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!updatedProduct) {
      return next(new AppError('Product not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        product: updatedProduct
      }
    });
  } catch (error) {
    next(error);
  }
};

// 5. Delete Product (Admin Only)
export const deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return next(new AppError('Product not found', 404));
    }

    res.status(200).json({
      status: 'success',
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
