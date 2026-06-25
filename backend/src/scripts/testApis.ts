import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../models/user';
import { Product } from '../models/product';
import { Lead } from '../models/lead';
import { QuoteRequest } from '../models/quoteRequest';

// Load env variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

// Helper for delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runApiTests() {
  console.log('Waiting 3 seconds for Express server and MongoDB connection...');
  await delay(3000);

  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/conex';
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB directly for API testing database helper.');
  } catch (err) {
    console.error('Failed to connect to MongoDB in testApis:', err);
    process.exit(1);
  }

  console.log('\n======================================================');
  console.log('STARTING INTEGRATION API TESTS');
  console.log('======================================================');

  try {
    // 0. Clean up any leftover test data in MongoDB first
    await User.deleteMany({ email: { $in: ['admin@conex.in', 'leadbuyer@conex.in'] } });
    await Product.deleteMany({ sku: 'TEST-CBL-API' });
    await Lead.deleteMany({ email: 'leadbuyer@conex.in' });
    await QuoteRequest.deleteMany({ notes: 'API INTEGRATION TEST QUOTE' });

    // 1. Health check
    console.log('\n--- 1. Testing Health Check ---');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    console.log('Health Check Status Code:', healthRes.status);
    console.log('Health Check Response:', healthData);

    // 2. Create Admin directly in DB to test Admin APIs
    console.log('\n--- 2. Creating Admin User directly in DB ---');
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@conex.in',
      password: 'adminpassword123', // auto-hashed
      role: 'admin'
    });
    console.log('Admin account created in database.');

    // 3. Login as Admin via API
    console.log('\n--- 3. Logging in as Admin via API ---');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@conex.in', password: 'adminpassword123' })
    });
    const loginData: any = await loginRes.json();
    console.log('Login status:', loginRes.status);
    const adminToken = loginData.token;
    console.log('Received JWT Token:', adminToken ? 'YES' : 'NO');

    // 4. Create Product (Admin Only)
    console.log('\n--- 4. Creating Product as Admin ---');
    const productRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Test Cable API V1',
        sku: 'TEST-CBL-API',
        slug: 'test-cable-api-v1',
        description: 'High quality testing cable.',
        category: 'Cables',
        basePrice: 5000,
        tieredPrices: {
          tier_1: 5000,
          tier_2: 4500,
          tier_3: 4000
        },
        stock: 100,
        status: 'active'
      })
    });
    const productData: any = await productRes.json();
    console.log('Create Product status:', productRes.status);
    const createdProduct = productData.data.product;
    console.log('Product Created:', createdProduct.name, '(ID:', createdProduct._id, ')');

    // 5. Public: Get All Products
    console.log('\n--- 5. Public: Get All Products ---');
    const getProductsRes = await fetch(`${BASE_URL}/products?search=TEST-CBL-API`);
    const getProductsData: any = await getProductsRes.json();
    console.log('Get Products status:', getProductsRes.status);
    console.log('Products Found Count:', getProductsData.results);

    // 6. Lead Capture for Datasheet Download (with autoSignup: true)
    console.log('\n--- 6. Capturing Lead with Auto-Signup ---');
    const leadRes = await fetch(`${BASE_URL}/auth/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Lead Buyer',
        company: 'Lead B2B India',
        email: 'leadbuyer@conex.in',
        mobile: '+919876543210',
        address: '101 Trade Center, Pune, Maharashtra',
        productId: createdProduct._id,
        autoSignup: true // triggers background signup
      })
    });
    const leadData: any = await leadRes.json();
    console.log('Lead Capture Status:', leadRes.status);
    console.log('Lead Saved:', leadData.data.lead.name, '(Account Created:', leadData.data.lead.createdAccount, ')');
    const tempPassword = leadData.data.autoSignup?.temporaryPassword;
    console.log('Generated Temporary Password:', tempPassword);

    // 7. Guest submits a Quote Request (Method A part 1)
    console.log('\n--- 7. Guest Submits Quote Request ---');
    const quoteSubmitRes = await fetch(`${BASE_URL}/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [
          {
            product: createdProduct._id,
            requestedQuantity: 25
          }
        ],
        guestDetails: {
          name: 'Lead Buyer',
          email: 'leadbuyer@conex.in',
          phone: '+919876543210',
          companyName: 'Lead B2B India',
          gstin: '27AADCT2201R1Z5'
        },
        notes: 'API INTEGRATION TEST QUOTE'
      })
    });
    const quoteSubmitData: any = await quoteSubmitRes.json();
    console.log('Quote Request status:', quoteSubmitRes.status);
    const guestQuote = quoteSubmitData.data.quoteRequest;
    console.log('Quote Number Generated:', guestQuote.quoteNumber);
    console.log('Secure Token Generated:', guestQuote.token ? 'YES' : 'NO');
    const guestToken = guestQuote.token;

    // 8. Admin responds to the Quote Request
    console.log('\n--- 8. Admin Responds to Quote with custom pricing ---');
    const offeredPrices: any = {};
    offeredPrices[createdProduct._id] = 4200; // Custom lower price offered by admin

    const respondRes = await fetch(`${BASE_URL}/quotes/${guestQuote._id}/respond`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        offeredPrices,
        adminFeedback: 'We can offer special ₹4200 rate for bulk qty 25.'
      })
    });
    const respondData: any = await respondRes.json();
    console.log('Admin Respond status:', respondRes.status);
    console.log('Quote status updated to:', respondData.data.quote.status);

    // 9. Guest retrieves Quote using Method A (Secure Token Link)
    console.log('\n--- 9. Guest retrieves responded Quote via Secure Token (Method A) ---');
    const guestViewRes = await fetch(`${BASE_URL}/quotes/token/${guestToken}`);
    const guestViewData: any = await guestViewRes.json();
    console.log('Guest lookup status:', guestViewRes.status);
    const viewedQuote = guestViewData.data.quote;
    console.log('Viewed Quote Number:', viewedQuote.quoteNumber);
    console.log('Offered custom price for product:', viewedQuote.items[0].offeredPrice);

    // 10. Login using Auto-Signed Up User credentials (to check out)
    console.log('\n--- 10. User Logins with Auto-Signup credentials (Method B) ---');
    const buyerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'leadbuyer@conex.in', password: tempPassword })
    });
    const buyerLoginData: any = await buyerLoginRes.json();
    console.log('Buyer login status:', buyerLoginRes.status);
    const buyerToken = buyerLoginData.token;
    console.log('Buyer JWT Token received:', buyerToken ? 'YES' : 'NO');

    // 11. Link Guest Quote to Logged-in Buyer Profile (Method B)
    console.log('\n--- 11. Linking Guest Quote to User Account ---');
    const linkRes = await fetch(`${BASE_URL}/quotes/link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${buyerToken}`
      },
      body: JSON.stringify({
        quoteNumber: viewedQuote.quoteNumber,
        token: guestToken
      })
    });
    const linkData: any = await linkRes.json();
    console.log('Link status:', linkRes.status);
    console.log('Is Quote now associated with buyer customer ID:', linkData.data.quote.customer !== null);

    // 12. Buyer accepts the offer on the website
    console.log('\n--- 12. Buyer accepts the quote offer ---');
    const acceptRes = await fetch(`${BASE_URL}/quotes/${viewedQuote._id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${buyerToken}`
      },
      body: JSON.stringify({
        status: 'accepted'
      })
    });
    const acceptData: any = await acceptRes.json();
    console.log('Accept Quote status:', acceptRes.status);
    console.log('Quote status updated to:', acceptData.data.quote.status);

    // 13. Clean up DB records
    console.log('\n--- 13. Cleaning up Test Database Records ---');
    await User.findByIdAndDelete(adminUser._id);
    await User.findOneAndDelete({ email: 'leadbuyer@conex.in' });
    await Product.findByIdAndDelete(createdProduct._id);
    await Lead.findOneAndDelete({ email: 'leadbuyer@conex.in' });
    await QuoteRequest.findByIdAndDelete(viewedQuote._id);
    console.log('Cleanup completed successfully.');

    console.log('\n======================================================');
    console.log('API INTEGRATION TESTS SUCCESSFUL! 🚀✅');
    console.log('======================================================');
    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('API Tests failed with error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Start test runner
runApiTests();
