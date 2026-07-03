'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, IQuote, IProduct, ISpecification } from '../../lib/api';

const PRODUCT_CATEGORIES = [
  'Ultrasonic Testing',
  'Cables & Accessories',
  'Magnetic Particle',
  'Chemicals'
];

export default function AdminPage() {
  const router = useRouter();
  
  // Auth state
  const [adminUser, setAdminUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'quotes' | 'products'>('quotes');

  // Quotes management state
  const [quotes, setQuotes] = useState<IQuote[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [quoteFilter, setQuoteFilter] = useState<'all' | 'pending' | 'responded' | 'accepted' | 'rejected'>('all');
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);

  // Quote response form state
  const [offeredPrices, setOfferedPrices] = useState<Record<string, number>>({});
  const [adminFeedback, setAdminFeedback] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  // Products management state
  const [products, setProducts] = useState<IProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Product CRUD modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    slug: '',
    description: '',
    category: 'Ultrasonic Testing',
    images: [''],
    basePrice: 0,
    tieredPrices: {
      tier_1: 0,
      tier_2: 0,
      tier_3: 0
    },
    stock: 0,
    status: 'active' as 'active' | 'draft',
    specifications: [] as ISpecification[],
    datasheetUrl: ''
  });
  const [newSpecName, setNewSpecName] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);

  // Loading quotes
  const loadQuotes = async () => {
    try {
      setQuotesLoading(true);
      const res = await api.getAllQuotes();
      if (res.status === 'success') {
        setQuotes(res.data.quotes);
      }
    } catch (err) {
      console.error('Failed to load all quotes:', err);
    } finally {
      setQuotesLoading(false);
    }
  };

  // Loading products
  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      const res = await api.getProducts();
      if (res.status === 'success') {
        setProducts(res.data.products);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  // Verify auth session on load
  useEffect(() => {
    const checkAdminSession = async () => {
      const token = localStorage.getItem('conex_token');
      if (!token) {
        setUnauthorized(true);
        setLoadingAuth(false);
        router.push('/login');
        return;
      }
      
      try {
        setLoadingAuth(true);
        const res = await api.getMe();
        if (res.status === 'success' && res.data.user.role === 'admin') {
          setAdminUser(res.data.user);
          setUnauthorized(false);
          // Initial loads
          loadQuotes();
          loadProducts();
        } else {
          setUnauthorized(true);
          // If logged in but not admin, let the page render "Access Denied"
        }
      } catch (err) {
        console.error('Admin session validation failed:', err);
        setUnauthorized(true);
      } finally {
        setLoadingAuth(false);
      }
    };
    checkAdminSession();
  }, [router]);

  // Handle expanding quote and pre-filling offered prices
  const handleExpandQuote = (quote: IQuote) => {
    if (expandedQuoteId === quote._id) {
      setExpandedQuoteId(null);
      setOfferedPrices({});
      setAdminFeedback('');
    } else {
      setExpandedQuoteId(quote._id);
      
      // Initialize offered prices with existing offeredPrice, or fall back to product tiered rates or basePrice
      const initialPrices: Record<string, number> = {};
      quote.items.forEach(item => {
        const prod = item.product as IProduct | null;
        const isProductObject = typeof prod === 'object' && prod !== null;
        const prodId = isProductObject ? prod._id : (item.product as string || 'deleted');
        
        if (item.offeredPrice) {
          initialPrices[prodId] = item.offeredPrice;
        } else if (isProductObject) {
          // Fallback logic to autofill based on quantity requested
          const qty = item.requestedQuantity;
          let tierPrice = prod.basePrice;
          if (qty >= 50 && prod.tieredPrices?.tier_3) {
            tierPrice = prod.tieredPrices.tier_3;
          } else if (qty >= 10 && prod.tieredPrices?.tier_2) {
            tierPrice = prod.tieredPrices.tier_2;
          } else if (prod.tieredPrices?.tier_1) {
            tierPrice = prod.tieredPrices.tier_1;
          }
          initialPrices[prodId] = tierPrice;
        } else {
          initialPrices[prodId] = 0;
        }
      });
      
      setOfferedPrices(initialPrices);
      setAdminFeedback(quote.adminFeedback || '');
    }
  };

  const handlePriceChange = (productId: string, val: number) => {
    setOfferedPrices(prev => ({
      ...prev,
      [productId]: val
    }));
  };

  // Submit quote response
  const handleQuoteResponseSubmit = async (quoteId: string) => {
    if (Object.keys(offeredPrices).length === 0) {
      alert('Please fill out the offered prices.');
      return;
    }

    setSubmittingResponse(true);
    try {
      const res = await api.respondToQuote(quoteId, {
        offeredPrices,
        adminFeedback: adminFeedback || undefined
      });

      if (res.status === 'success') {
        alert('Response submitted successfully to corporate client.');
        setExpandedQuoteId(null);
        setOfferedPrices({});
        setAdminFeedback('');
        loadQuotes();
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      alert(error.message || 'Error submitting response to quote.');
    } finally {
      setSubmittingResponse(false);
    }
  };

  // Product CRUD Handlers
  const handleOpenProductModal = (product: IProduct | null = null) => {
    if (product) {
      // Edit mode
      setEditingProductId(product._id);
      setProductForm({
        name: product.name,
        sku: product.sku,
        slug: product.slug,
        description: product.description || '',
        category: product.category || 'Ultrasonic Testing',
        images: product.images && product.images.length > 0 ? product.images : [''],
        basePrice: product.basePrice || 0,
        tieredPrices: {
          tier_1: product.tieredPrices?.tier_1 || product.basePrice || 0,
          tier_2: product.tieredPrices?.tier_2 || product.basePrice || 0,
          tier_3: product.tieredPrices?.tier_3 || product.basePrice || 0
        },
        stock: product.stock || 0,
        status: product.status || 'active',
        specifications: product.specifications || [],
        datasheetUrl: product.datasheetUrl || ''
      });
    } else {
      // Create mode
      setEditingProductId(null);
      setProductForm({
        name: '',
        sku: '',
        slug: '',
        description: '',
        category: 'Ultrasonic Testing',
        images: [''],
        basePrice: 0,
        tieredPrices: {
          tier_1: 0,
          tier_2: 0,
          tier_3: 0
        },
        stock: 0,
        status: 'active',
        specifications: [],
        datasheetUrl: ''
      });
    }
    setShowProductModal(true);
  };

  const handleProductFormChange = <K extends keyof typeof productForm>(key: K, value: (typeof productForm)[K]) => {
    setProductForm(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleTierPriceChange = (tier: 'tier_1' | 'tier_2' | 'tier_3', val: number) => {
    setProductForm(prev => ({
      ...prev,
      tieredPrices: {
        ...prev.tieredPrices,
        [tier]: val
      }
    }));
  };

  const generateSlug = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    handleProductFormChange('slug', slug);
  };

  const handleAddSpecification = () => {
    if (!newSpecName || !newSpecValue) return;
    const newSpec: ISpecification = { name: newSpecName, value: newSpecValue };
    setProductForm(prev => ({
      ...prev,
      specifications: [...prev.specifications, newSpec]
    }));
    setNewSpecName('');
    setNewSpecValue('');
  };

  const handleRemoveSpecification = (index: number) => {
    setProductForm(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, idx) => idx !== index)
    }));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.sku || !productForm.slug || productForm.basePrice <= 0) {
      alert('Product Name, SKU, Slug and Base Price are required.');
      return;
    }

    setSavingProduct(true);
    try {
      let res;
      if (editingProductId) {
        res = await api.updateProduct(editingProductId, productForm);
      } else {
        res = await api.createProduct(productForm);
      }

      if (res.status === 'success') {
        alert(editingProductId ? 'Product updated successfully.' : 'New product created successfully.');
        setShowProductModal(false);
        loadProducts();
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      alert(error.message || 'Error saving product records.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}" from catalog?`)) {
      return;
    }

    try {
      const res = await api.deleteProduct(productId);
      if (res.status === 'success') {
        alert('Product deleted successfully.');
        loadProducts();
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      alert(error.message || 'Error deleting product.');
    }
  };

  // Filters calculation
  const filteredQuotes = quotes.filter(quote => {
    if (quoteFilter === 'all') return true;
    return quote.status === quoteFilter;
  });

  const filteredProducts = products.filter(prod => {
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prod.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter ? prod.category === categoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  // KPI Calculations
  const totalQuotesCount = quotes.length;
  const pendingQuotesCount = quotes.filter(q => q.status === 'pending').length;
  const totalProductsCount = products.length;
  const lowStockCount = products.filter(p => p.stock < 10).length;

  if (loadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white dark:bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <span className="text-sm text-slate-400 font-mono">Verifying administrative access credentials...</span>
        </div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-955 px-4 text-center">
        <div className="max-w-md rounded-2xl border border-rose-500/20 bg-slate-900 p-8 shadow-2xl flex flex-col items-center gap-6">
          <div className="rounded-full bg-rose-500/10 p-3 text-rose-500">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Access Denied</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            You do not have administrative permissions to view this dashboard page. Please sign in with an administrator account.
          </p>
          <Link 
            href="/login"
            className="rounded-lg bg-primary hover:bg-primary-hover px-6 py-2.5 text-xs font-bold text-white transition-all shadow-md"
          >
            Sign In with Admin Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 dark:bg-black py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="text-xs font-bold font-mono text-rose-400 uppercase tracking-widest">Admin Control Panel</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">CONEX Shop Manager</h1>
            <p className="text-xs text-slate-400 mt-1">
              Review corporate quote RFQs, update custom tiered margins, and configure catalog items.
              Signed in as <span className="font-semibold text-slate-200">{adminUser?.name}</span> ({adminUser?.email})
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab('quotes')}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                activeTab === 'quotes' 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Quotes Console ({pendingQuotesCount})
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                activeTab === 'products' 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Products Catalog ({totalProductsCount})
            </button>
          </div>
        </div>

        {/* Dashboard KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col gap-1">
            <span className="text-slate-500 font-mono uppercase text-3xs font-bold tracking-wider">Total RFQ Orders</span>
            <span className="text-2xl font-black text-white">{totalQuotesCount}</span>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col gap-1">
            <span className="text-slate-500 font-mono uppercase text-3xs font-bold tracking-wider">Pending Responses</span>
            <span className="text-2xl font-black text-amber-500 animate-pulse">{pendingQuotesCount}</span>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col gap-1">
            <span className="text-slate-500 font-mono uppercase text-3xs font-bold tracking-wider">Catalog Inventory</span>
            <span className="text-2xl font-black text-white">{totalProductsCount} items</span>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col gap-1">
            <span className="text-slate-500 font-mono uppercase text-3xs font-bold tracking-wider">Low Stock Warning</span>
            <span className={`text-2xl font-black ${lowStockCount > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
              {lowStockCount} items
            </span>
          </div>
        </div>

        {/* TAB 1: QUOTES MANAGEMENT */}
        {activeTab === 'quotes' && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
            
            {/* Table Filter Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg font-bold text-white">Clients Quote Requests</h2>
              <div className="flex flex-wrap gap-1.5">
                {(['all', 'pending', 'responded', 'accepted', 'rejected'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setQuoteFilter(f)}
                    className={`rounded-md px-3 py-1 text-2xs font-bold capitalize transition-colors ${
                      quoteFilter === f 
                        ? 'bg-slate-800 text-white border border-slate-700' 
                        : 'text-slate-400 hover:text-slate-200 bg-transparent border border-transparent'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* List Table */}
            {quotesLoading ? (
              <div className="py-20 text-center text-slate-500 flex flex-col items-center gap-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                <span className="text-xs font-mono">Fetching quote history logs...</span>
              </div>
            ) : filteredQuotes.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-slate-800 rounded-xl text-slate-500">
                <span className="text-xs">No quote requests found matching current filter state.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-3xs font-mono uppercase text-slate-400 tracking-wider">
                      <th className="pb-3 pl-2">RFQ Number</th>
                      <th className="pb-3">Client details</th>
                      <th className="pb-3">Items</th>
                      <th className="pb-3">Submitted</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 pr-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-xs">
                    {filteredQuotes.map(quote => {
                      const clientName = quote.customer?.name || quote.guestDetails?.name || 'Guest User';
                      const clientCompany = quote.customer?.companyName || 'Not Registered';
                      const clientEmail = quote.customer?.email || quote.guestDetails?.email || '';
                      
                      return (
                        <React.Fragment key={quote._id}>
                          <tr className={`hover:bg-slate-900/60 transition-colors ${expandedQuoteId === quote._id ? 'bg-slate-900/50' : ''}`}>
                            <td className="py-4 pl-2 font-mono font-bold text-white">{quote.quoteNumber}</td>
                            <td className="py-4">
                              <div className="font-semibold text-slate-200">{clientName}</div>
                              <div className="text-[10px] text-slate-500">{clientCompany} ({clientEmail})</div>
                            </td>
                            <td className="py-4 font-mono">
                              {quote.items.length} product{quote.items.length > 1 ? 's' : ''}
                            </td>
                            <td className="py-4 text-slate-400">
                              {new Date(quote.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="py-4">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-3xs font-mono uppercase tracking-wider font-bold ${
                                quote.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse' :
                                quote.status === 'responded' ? 'bg-sky-500/10 text-sky-500 border border-sky-500/20' :
                                quote.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                              }`}>
                                {quote.status}
                              </span>
                            </td>
                            <td className="py-4 pr-2 text-right">
                              <button
                                onClick={() => handleExpandQuote(quote)}
                                className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-2xs hover:bg-slate-700 transition-colors text-white font-medium"
                              >
                                {expandedQuoteId === quote._id ? 'Close' : 'Review & Respond'}
                              </button>
                            </td>
                          </tr>
                          
                          {/* Expanded Detail Rows & Respond Form */}
                          {expandedQuoteId === quote._id && (
                            <tr>
                              <td colSpan={6} className="bg-slate-900/40 border-t border-b border-slate-800 p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                  
                                  {/* Left Panel: Quote Details */}
                                  <div className="flex flex-col gap-4">
                                    <div>
                                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">Quote Client Profile</h3>
                                      <div className="bg-slate-955 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-1.5">
                                        <div className="flex justify-between"><span className="text-slate-500">Contact:</span> <span className="font-semibold text-slate-300">{clientName}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Email:</span> <span className="text-slate-300">{clientEmail}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Phone:</span> <span className="text-slate-300">{quote.customer?.phone || quote.guestDetails?.phone || 'N/A'}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Company:</span> <span className="text-slate-300">{clientCompany}</span></div>
                                        {quote.customer?.gstin && (
                                          <div className="flex justify-between"><span className="text-slate-500">GSTIN:</span> <span className="font-mono text-emerald-400">{quote.customer.gstin}</span></div>
                                        )}
                                      </div>
                                    </div>

                                    {quote.notes && (
                                      <div>
                                        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">Client Notes / Specifications Request</h3>
                                        <div className="bg-slate-955 border border-slate-800/80 rounded-xl p-4 text-xs italic text-slate-300 leading-relaxed">
                                          &quot;{quote.notes}&quot;
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Right Panel: respond & offered prices form */}
                                  <div className="flex flex-col gap-5">
                                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Offered Prices Calculation</h3>
                                    
                                    <div className="flex flex-col gap-3">
                                      {quote.items.map((item, idx) => {
                                        const prod = item.product as IProduct | null;
                                        const isProductObject = typeof prod === 'object' && prod !== null;
                                        const prodId = isProductObject ? prod._id : (item.product as string || `deleted-${idx}`);
                                        const prodName = isProductObject ? prod.name : 'Deleted Product';
                                        const prodSKU = isProductObject ? prod.sku : 'N/A';
                                        const basePrice = isProductObject ? prod.basePrice : 0;
                                        
                                        return (
                                          <div key={idx} className="bg-slate-955 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
                                            <div className="flex justify-between items-start">
                                              <div>
                                                <div className="font-bold text-slate-200">{prodName}</div>
                                                <div className="text-[10px] text-slate-500 font-mono">SKU: {prodSKU} | Requested Qty: {item.requestedQuantity} units</div>
                                              </div>
                                              <div className="text-right">
                                                <div className="text-slate-400 font-bold">₹{basePrice.toLocaleString('en-IN')}</div>
                                                <div className="text-[9px] text-slate-500">Base Unit Rate</div>
                                              </div>
                                            </div>
                                            
                                            <hr className="border-slate-900" />
                                            
                                            <div className="flex items-center justify-between gap-4">
                                              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">Proposed Rate (₹)</span>
                                              <input
                                                type="number"
                                                value={offeredPrices[prodId] || 0}
                                                onChange={(e) => handlePriceChange(prodId, Number(e.target.value))}
                                                className="w-32 h-8 px-2 text-right bg-slate-900 border border-slate-800 rounded text-xs font-bold text-white focus:outline-none focus:border-primary"
                                              />
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {/* Remarks feedback */}
                                    <div className="flex flex-col gap-1">
                                      <label className="text-[10px] text-slate-400 font-mono font-bold uppercase">Reviewer Feedback Remarks</label>
                                      <textarea
                                        value={adminFeedback}
                                        onChange={(e) => setAdminFeedback(e.target.value)}
                                        placeholder="Add notes about shipping availability, specialized volumetric discounts applied, or lead times..."
                                        rows={3}
                                        className="w-full bg-slate-955 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-primary placeholder-slate-600"
                                      />
                                    </div>

                                    {/* Submit action */}
                                    <button
                                      onClick={() => handleQuoteResponseSubmit(quote._id)}
                                      disabled={submittingResponse || quote.status === 'accepted' || quote.status === 'rejected'}
                                      className="flex h-10 w-full items-center justify-center rounded-xl bg-primary hover:bg-primary-hover text-xs font-bold text-white shadow-md transition-all disabled:opacity-40 cursor-pointer"
                                    >
                                      {submittingResponse ? 'Submitting Responses...' : 'Submit Proposed Pricing & Feedbacks'}
                                    </button>
                                  </div>

                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PRODUCTS CATALOG */}
        {activeTab === 'products' && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
            
            {/* Catalog Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-white">Product Inventory Records</h2>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <input
                  type="text"
                  placeholder="Search SKU or Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 px-3 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-primary placeholder-slate-600 w-full sm:w-48"
                />
                
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="h-9 px-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="">All Categories</option>
                  {PRODUCT_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <button
                  onClick={() => handleOpenProductModal(null)}
                  className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md transition-all cursor-pointer whitespace-nowrap"
                >
                  + Add New Product
                </button>
              </div>
            </div>

            {/* Products Table */}
            {productsLoading ? (
              <div className="py-20 text-center text-slate-500 flex flex-col items-center gap-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                <span className="text-xs font-mono">Loading product items catalog...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-slate-800 rounded-xl text-slate-500">
                <span className="text-xs">No products catalogued matching filter keywords.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-3xs font-mono uppercase text-slate-400 tracking-wider">
                      <th className="pb-3 pl-2">Product Info</th>
                      <th className="pb-3">SKU</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3">Base Price</th>
                      <th className="pb-3">Stock</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 pr-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-xs">
                    {filteredProducts.map(prod => (
                      <tr key={prod._id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="py-3.5 pl-2 font-bold text-white max-w-xs truncate">{prod.name}</td>
                        <td className="py-3.5 font-mono text-slate-300">{prod.sku}</td>
                        <td className="py-3.5 text-slate-400">{prod.category}</td>
                        <td className="py-3.5 font-bold font-mono text-emerald-400">₹{prod.basePrice.toLocaleString('en-IN')}</td>
                        <td className="py-3.5">
                          <span className={`font-semibold font-mono ${prod.stock < 10 ? 'text-rose-500 animate-pulse' : 'text-slate-300'}`}>
                            {prod.stock} units
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-3xs font-bold uppercase tracking-wider ${
                            prod.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'
                          }`}>
                            {prod.status}
                          </span>
                        </td>
                        <td className="py-3.5 pr-2 text-right flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenProductModal(prod)}
                            className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-3xs hover:bg-slate-700 transition-colors text-slate-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod._id, prod.name)}
                            className="rounded-md border border-rose-500/20 bg-rose-500/10 px-2 py-1 text-3xs hover:bg-rose-500/20 transition-colors text-rose-400"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* MODAL: ADD / EDIT PRODUCT */}
        {showProductModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 p-5 sticky top-0 bg-slate-900 z-10">
                <h3 className="text-base font-bold text-white">
                  {editingProductId ? 'Configure Existing Product' : 'Catalog New B2B Product'}
                </h3>
                <button
                  onClick={() => setShowProductModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveProduct} className="p-6 flex flex-col gap-6">
                
                {/* Form Row 1: Name and Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-3xs font-mono uppercase tracking-wider text-slate-400 font-bold">Product Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ultrasonic Flaw Detector Model B"
                      value={productForm.name}
                      onChange={(e) => {
                        handleProductFormChange('name', e.target.value);
                        if (!editingProductId) generateSlug(e.target.value);
                      }}
                      className="h-10 px-3 text-xs bg-slate-955 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-3xs font-mono uppercase tracking-wider text-slate-400 font-bold">Inventory Category</label>
                    <select
                      value={productForm.category}
                      onChange={(e) => handleProductFormChange('category', e.target.value)}
                      className="h-10 px-2 text-xs bg-slate-955 border border-slate-800 rounded-lg text-slate-300 focus:outline-none cursor-pointer"
                    >
                      {PRODUCT_CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Form Row 2: SKU and Slug */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-3xs font-mono uppercase tracking-wider text-slate-400 font-bold">Stock Keeping Unit (SKU)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. NDT-UFD-02"
                      value={productForm.sku}
                      onChange={(e) => handleProductFormChange('sku', e.target.value)}
                      className="h-10 px-3 text-xs bg-slate-955 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-primary font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-3xs font-mono uppercase tracking-wider text-slate-400 font-bold">Web URL Slug</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ultrasonic-flaw-detector-model-b"
                      value={productForm.slug}
                      onChange={(e) => handleProductFormChange('slug', e.target.value)}
                      className="h-10 px-3 text-xs bg-slate-955 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-primary font-mono"
                    />
                  </div>
                </div>

                {/* Form Row 3: Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-3xs font-mono uppercase tracking-wider text-slate-400 font-bold">Product Description</label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => handleProductFormChange('description', e.target.value)}
                    placeholder="Enter detailed description of the physical components, compliance guidelines, certifications..."
                    rows={4}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Form Row 4: Base Pricing & Stocks */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-3xs font-mono uppercase tracking-wider text-slate-400 font-bold">Base Price (INR)</label>
                    <input
                      type="number"
                      required
                      value={productForm.basePrice}
                      onChange={(e) => handleProductFormChange('basePrice', Number(e.target.value))}
                      className="h-10 px-3 text-xs bg-slate-955 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-primary font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-3xs font-mono uppercase tracking-wider text-slate-400 font-bold">Current Stock Level</label>
                    <input
                      type="number"
                      required
                      value={productForm.stock}
                      onChange={(e) => handleProductFormChange('stock', Number(e.target.value))}
                      className="h-10 px-3 text-xs bg-slate-955 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-primary font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-3xs font-mono uppercase tracking-wider text-slate-400 font-bold">Catalogue Status</label>
                    <select
                      value={productForm.status}
                      onChange={(e) => handleProductFormChange('status', e.target.value as 'active' | 'draft')}
                      className="h-10 px-2 text-xs bg-slate-955 border border-slate-800 rounded-lg text-slate-300 focus:outline-none cursor-pointer"
                    >
                      <option value="active">Active (Visible)</option>
                      <option value="draft">Draft (Hidden)</option>
                    </select>
                  </div>
                </div>

                {/* Form Row 5: Tiered Pricing Details */}
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">Tiered Volume Pricing Configuration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-955 border border-slate-800/80 rounded-xl p-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-3xs text-slate-500 font-mono font-semibold">Tier 1 (Base/Low Volume)</label>
                      <input
                        type="number"
                        value={productForm.tieredPrices.tier_1}
                        onChange={(e) => handleTierPriceChange('tier_1', Number(e.target.value))}
                        className="h-9 px-3 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-primary font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-3xs text-slate-500 font-mono font-semibold">Tier 2 (Mid Volume)</label>
                      <input
                        type="number"
                        value={productForm.tieredPrices.tier_2}
                        onChange={(e) => handleTierPriceChange('tier_2', Number(e.target.value))}
                        className="h-9 px-3 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-primary font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-3xs text-slate-500 font-mono font-semibold">Tier 3 (High Bulk Vol)</label>
                      <input
                        type="number"
                        value={productForm.tieredPrices.tier_3}
                        onChange={(e) => handleTierPriceChange('tier_3', Number(e.target.value))}
                        className="h-9 px-3 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-primary font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Row 6: Image URLs and Datasheet */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-3xs font-mono uppercase tracking-wider text-slate-400 font-bold">Image URL</label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/..."
                      value={productForm.images[0] || ''}
                      onChange={(e) => handleProductFormChange('images', [e.target.value])}
                      className="h-10 px-3 text-xs bg-slate-955 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-3xs font-mono uppercase tracking-wider text-slate-400 font-bold">Datasheet Link (PDF)</label>
                    <input
                      type="text"
                      placeholder="e.g. /datasheets/UFD-01_datasheet.pdf"
                      value={productForm.datasheetUrl}
                      onChange={(e) => handleProductFormChange('datasheetUrl', e.target.value)}
                      className="h-10 px-3 text-xs bg-slate-955 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-primary font-mono"
                    />
                  </div>
                </div>

                {/* Form Row 7: Specifications dynamic list */}
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">Technical Specifications</h4>
                  <div className="flex flex-col gap-3 bg-slate-955 border border-slate-800/80 rounded-xl p-4">
                    {/* Add Spec Inputs */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Spec Name (e.g. Operating Temperature)"
                        value={newSpecName}
                        onChange={(e) => setNewSpecName(e.target.value)}
                        className="flex-1 h-9 px-3 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-primary"
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. -10°C to 50°C)"
                        value={newSpecValue}
                        onChange={(e) => setNewSpecValue(e.target.value)}
                        className="flex-1 h-9 px-3 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={handleAddSpecification}
                        className="h-9 px-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg cursor-pointer transition-all"
                      >
                        Add Spec
                      </button>
                    </div>

                    {/* Spec List */}
                    {productForm.specifications.length > 0 && (
                      <div className="flex flex-col gap-1.5 mt-2 max-h-48 overflow-y-auto divide-y divide-slate-900">
                        {productForm.specifications.map((spec, idx) => (
                          <div key={idx} className="flex justify-between items-center py-2 text-xs">
                            <span className="font-semibold text-slate-400">{spec.name}:</span>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-200">{spec.value}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSpecification(idx)}
                                className="text-rose-500 hover:text-rose-400 text-2xs cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="border-t border-slate-800 pt-5 flex justify-end gap-3 sticky bottom-0 bg-slate-900 z-10 pb-2">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="h-10 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProduct}
                    className="h-10 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md transition-all disabled:opacity-40 cursor-pointer"
                  >
                    {savingProduct ? 'Saving Record...' : 'Save Product Record'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
