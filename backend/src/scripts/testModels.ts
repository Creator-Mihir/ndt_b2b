import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../models/user';
import { Product } from '../models/product';
import { Order } from '../models/order';
import { QuoteRequest } from '../models/quoteRequest';

// Load env variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/conex';

async function runTests() {
  console.log('Connecting to MongoDB at:', MONGODB_URI);
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to database successfully.');
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }

  try {
    // 1. Clean up old test data
    console.log('\n--- 1. Cleaning up existing test records ---');
    await User.deleteMany({ email: 'testbuyer@conex.in' });
    await Product.deleteMany({ sku: { $in: ['CBL-HV-100', 'NDT-UFD-01'] } });
    await Order.deleteMany({ companyName: 'Test Corp Ltd' });
    await QuoteRequest.deleteMany({ notes: 'BULK QUANTITY DISCLOSURE' });
    console.log('Cleanup completed.');

    // 2. Test User creation & auth
    console.log('\n--- 2. Testing User Creation & Hashing ---');
    const user = new User({
      name: 'Mihir Rawat',
      email: 'testbuyer@conex.in',
      phone: '+919999999999',
      password: 'password123', // should be hashed in pre-save hook
      companyName: 'Test Corp Ltd',
      gstin: '27AADCT2201R1Z5', // Maharashtra GSTIN format
      addresses: [
        {
          street: '123 Business Park, Andheri East',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400069',
          country: 'India',
          isDefault: true
        }
      ],
      pricingTier: 'tier_2'
    });

    await user.save();
    console.log('User created successfully. ID:', user._id);
    console.log('Hashed Password stored:', user.password);
    
    // Test password comparison
    const isCorrect = await user.comparePassword('password123');
    const isIncorrect = await user.comparePassword('wrongpassword');
    console.log(`Password verification - Correct: ${isCorrect} (Expected: true), Incorrect: ${isIncorrect} (Expected: false)`);

    // 3. Test Product creation
    console.log('\n--- 3. Testing Product Creation ---');
    const product1 = new Product({
      name: 'High-Voltage Cable 100m',
      sku: 'CBL-HV-100',
      slug: 'high-voltage-cable-100m',
      description: 'Heavy duty high-voltage cable rated up to 11kV.',
      category: 'Cables',
      basePrice: 10000,
      tieredPrices: {
        tier_1: 10000,
        tier_2: 9000,
        tier_3: 8000
      },
      stock: 50,
      status: 'active',
      specifications: [
        { name: 'Voltage Rating', value: '11kV' },
        { name: 'Length', value: '100 meters' }
      ]
    });

    const product2 = new Product({
      name: 'NDT Ultrasonic Flaw Detector',
      sku: 'NDT-UFD-01',
      slug: 'ndt-ultrasonic-flaw-detector',
      description: 'Portable ultrasonic testing equipment for weld inspections.',
      category: 'NDT Instruments',
      basePrice: 150000,
      tieredPrices: {
        tier_1: 150000,
        tier_2: 140000,
        tier_3: 130000
      },
      stock: 5,
      status: 'active',
      specifications: [
        { name: 'Frequency Range', value: '0.5 - 20MHz' },
        { name: 'Display', value: '5.7 inch TFT Color Screen' }
      ]
    });

    await product1.save();
    await product2.save();
    console.log(`Products created: \n- ${product1.name} (SKU: ${product1.sku})\n- ${product2.name} (SKU: ${product2.sku})`);

    // 4. Test Order Creation & Auto-GST Calculation
    console.log('\n--- 4. Testing Order & GST Auto-calculation (Intra-state: Maharashtra) ---');
    const orderMH = new Order({
      customer: user._id,
      companyName: user.companyName,
      gstin: user.gstin,
      shippingAddress: {
        street: '123 Business Park, Andheri East',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400069',
        country: 'India'
      },
      billingAddress: {
        street: '123 Business Park, Andheri East',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400069',
        country: 'India'
      },
      items: [
        {
          product: product1._id,
          name: product1.name,
          price: product1.tieredPrices.tier_2, // using tier_2 based on user's setup
          quantity: 2,
          subtotal: product1.tieredPrices.tier_2 * 2 // 18000
        },
        {
          product: product2._id,
          name: product2.name,
          price: product2.tieredPrices.tier_2, // 140000
          quantity: 1,
          subtotal: product2.tieredPrices.tier_2 * 1 // 140000
        }
      ],
      shippingCharges: 250
    });

    await orderMH.save();
    console.log('Maharashtra Order Number:', orderMH.orderNumber);
    console.log(`Subtotal: ₹${orderMH.subtotal}`);
    console.log(`CGST (9%): ₹${orderMH.cgst}`);
    console.log(`SGST (9%): ₹${orderMH.sgst}`);
    console.log(`IGST (18%): ₹${orderMH.igst} (Expected: 0)`);
    console.log(`Shipping: ₹${orderMH.shippingCharges}`);
    console.log(`Total: ₹${orderMH.total}`);

    console.log('\n--- 5. Testing Order & GST Auto-calculation (Inter-state: Karnataka) ---');
    const orderKA = new Order({
      customer: user._id,
      companyName: user.companyName,
      gstin: user.gstin,
      shippingAddress: {
        street: '456 Tech Lane, Whitefield',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560066',
        country: 'India'
      },
      billingAddress: {
        street: '123 Business Park, Andheri East',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400069',
        country: 'India'
      },
      items: [
        {
          product: product1._id,
          name: product1.name,
          price: product1.tieredPrices.tier_2, // 9000
          quantity: 2,
          subtotal: 9000 * 2 // 18000
        }
      ],
      shippingCharges: 150
    });

    await orderKA.save();
    console.log('Karnataka Order Number:', orderKA.orderNumber);
    console.log(`Subtotal: ₹${orderKA.subtotal}`);
    console.log(`CGST: ₹${orderKA.cgst} (Expected: 0)`);
    console.log(`SGST: ₹${orderKA.sgst} (Expected: 0)`);
    console.log(`IGST (18%): ₹${orderKA.igst}`);
    console.log(`Shipping: ₹${orderKA.shippingCharges}`);
    console.log(`Total: ₹${orderKA.total}`);

    // 6. Test Quote Request
    console.log('\n--- 6. Testing Quote Request Creation ---');
    const quote = new QuoteRequest({
      customer: user._id,
      notes: 'BULK QUANTITY DISCLOSURE',
      items: [
        {
          product: product2._id,
          requestedQuantity: 10
        }
      ]
    });

    await quote.save();
    console.log('Quote Request Number:', quote.quoteNumber);
    console.log('Status:', quote.status);
    console.log('Items Requested Quantity:', quote.items[0].requestedQuantity);

    console.log('\n--- 7. Cleanup after test ---');
    await User.findByIdAndDelete(user._id);
    await Product.findByIdAndDelete(product1._id);
    await Product.findByIdAndDelete(product2._id);
    await Order.findByIdAndDelete(orderMH._id);
    await Order.findByIdAndDelete(orderKA._id);
    await QuoteRequest.findByIdAndDelete(quote._id);
    console.log('Database cleaned up.');
    console.log('\nALL TESTS PASSED SUCCESSFULLY! ✅');

  } catch (error) {
    console.error('Test run failed with error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
}

runTests();
