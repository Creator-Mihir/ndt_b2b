import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user';
import { Lead } from '../models/lead';
import { generateToken } from '../utils/auth';
import { AppError } from '../utils/AppError';

// Helper to sanitize user output
const sanitizeUser = (user: any) => {
  const sanitized = user.toObject();
  delete sanitized.password;
  return sanitized;
};

// 1. Signup
export const signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, phone, companyName, gstin } = req.body;

    if (!name || !email || !password) {
      return next(new AppError('Please provide name, email and password', 400));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email is already in use', 400));
    }

    const newUser = await User.create({
      name,
      email,
      password, // will be hashed by pre-save hook
      phone,
      companyName,
      gstin,
      role: 'customer' // default role is customer
    });

    const token = generateToken(newUser._id.toString());

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: sanitizeUser(newUser)
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Login
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    const token = generateToken(user._id.toString());

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: sanitizeUser(user)
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Logged-in Profile (me)
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AppError('You are not logged in', 401));
    }
    res.status(200).json({
      status: 'success',
      data: {
        user: sanitizeUser(req.user)
      }
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update Profile
export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AppError('You are not logged in', 401));
    }

    const { name, phone, companyName, gstin } = req.body;

    if (name) req.user.name = name;
    if (phone) req.user.phone = phone;
    if (companyName) req.user.companyName = companyName;
    if (gstin) req.user.gstin = gstin;

    await req.user.save();

    res.status(200).json({
      status: 'success',
      data: {
        user: sanitizeUser(req.user)
      }
    });
  } catch (error) {
    next(error);
  }
};

// 5. Add Address
export const addAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AppError('You are not logged in', 401));
    }

    const { street, city, state, postalCode, country, isDefault } = req.body;

    if (!street || !city || !state || !postalCode) {
      return next(new AppError('Please provide street, city, state and postal code', 400));
    }

    // If this is the default address, set all others to false
    if (isDefault) {
      req.user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    req.user.addresses.push({
      street,
      city,
      state,
      postalCode,
      country: country || 'India',
      isDefault: isDefault || false
    });

    await req.user.save();

    res.status(200).json({
      status: 'success',
      data: {
        user: sanitizeUser(req.user)
      }
    });
  } catch (error) {
    next(error);
  }
};

// 6. Update Address
export const updateAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AppError('You are not logged in', 401));
    }

    const index = parseInt(req.params.index);
    if (isNaN(index) || index < 0 || index >= req.user.addresses.length) {
      return next(new AppError('Invalid address index', 400));
    }

    const { street, city, state, postalCode, country, isDefault } = req.body;

    if (isDefault) {
      req.user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    const addr = req.user.addresses[index];
    if (street) addr.street = street;
    if (city) addr.city = city;
    if (state) addr.state = state;
    if (postalCode) addr.postalCode = postalCode;
    if (country) addr.country = country;
    if (isDefault !== undefined) addr.isDefault = isDefault;

    await req.user.save();

    res.status(200).json({
      status: 'success',
      data: {
        user: sanitizeUser(req.user)
      }
    });
  } catch (error) {
    next(error);
  }
};

// 7. Delete Address
export const deleteAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AppError('You are not logged in', 401));
    }

    const index = parseInt(req.params.index);
    if (isNaN(index) || index < 0 || index >= req.user.addresses.length) {
      return next(new AppError('Invalid address index', 400));
    }

    req.user.addresses.splice(index, 1);
    await req.user.save();

    res.status(200).json({
      status: 'success',
      data: {
        user: sanitizeUser(req.user)
      }
    });
  } catch (error) {
    next(error);
  }
};

// 8. Lead Capture for Datasheet Downloads (with checkbutton for auto-signup)
export const createLead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, company, email, mobile, address, productId, autoSignup } = req.body;

    if (!name || !company || !email || !mobile || !address || !productId) {
      return next(new AppError('All lead form fields are required', 400));
    }

    // Save Lead record
    const lead = new Lead({
      name,
      company,
      email,
      mobile,
      address,
      product: productId,
      createdAccount: false
    });

    let autoSignupDetails = null;

    // Check if autoSignup is checked
    if (autoSignup) {
      const existingUser = await User.findOne({ email });
      if (!existingUser) {
        // Generate a random human-readable password
        const generatedPassword = Math.random().toString(36).slice(-8);
        
        const newUser = await User.create({
          name,
          email,
          phone: mobile,
          companyName: company,
          password: generatedPassword, // auto-hashed by User hook
          addresses: [{
            street: address,
            city: 'Unknown', // placeholders as only raw address is obtained from lead form
            state: 'Maharashtra', // default state
            postalCode: '000000',
            country: 'India',
            isDefault: true
          }],
          role: 'customer'
        });

        lead.createdAccount = true;
        
        // Return credentials so frontend/user knows their temporary password
        autoSignupDetails = {
          userId: newUser._id,
          temporaryPassword: generatedPassword,
          token: generateToken(newUser._id.toString())
        };

        // Note: In production, we would email/WhatsApp this temporary password
        console.log(`[Auto-Signup Success] Created account for ${email} with temp password: ${generatedPassword}`);
      } else {
        console.log(`[Auto-Signup Info] User with email ${email} already has an account.`);
      }
    }

    await lead.save();

    res.status(201).json({
      status: 'success',
      message: 'Lead captured successfully',
      data: {
        lead,
        autoSignup: autoSignupDetails
      }
    });
  } catch (error) {
    next(error);
  }
};
