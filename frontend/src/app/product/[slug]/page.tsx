'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { api, IProduct } from '../../../lib/api';

export default function ProductDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Interactive state
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState('');
  const [showDatasheetModal, setShowDatasheetModal] = useState(false);
  
  // Lead form state
  const [leadForm, setLeadForm] = useState({
    name: '',
    company: '',
    email: '',
    mobile: '',
    address: '',
    autoSignup: true,
  });
  const [submittingLead, setSubmittingLead] = useState(false);
  const [leadSuccessData, setLeadSuccessData] = useState<{
    temporaryPassword?: string;
    email?: string;
  } | null>(null);

  // Cart animation feedback
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const response = await api.getProductBySlug(slug);
        if (response.status === 'success') {
          const prod = response.data.product;
          setProduct(prod);
          if (prod.images && prod.images.length > 0) {
            setActiveImage(prod.images[0]);
          }
        } else {
          setError('Product not found.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load product details.');
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24 min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-xs text-muted font-mono animate-pulse">Loading technical specs...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 mb-4">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-extrabold text-foreground">Specifications Unreachable</h2>
        <p className="text-sm text-muted mt-2 max-w-md mx-auto">{error || 'This product does not exist in our catalog.'}</p>
        <Link href="/" className="mt-6 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-hover transition-all">
          Return to Catalog
        </Link>
      </div>
    );
  }

  // Cable threshold: 1-49 tier_1, 50-199 tier_2, 200+ tier_3
  // Standard NDT thresholds: 1-9 tier_1, 10-49 tier_2, 50+ tier_3
  const isCable = product.category === 'Cables & Accessories';
  
  const getPricingTierDetails = () => {
    if (isCable) {
      return {
        t1Range: '1 - 49 m',
        t2Range: '50 - 199 m',
        t3Range: '200+ m',
        currentTier: quantity >= 200 ? 3 : quantity >= 50 ? 2 : 1,
        activePrice: quantity >= 200 ? product.tieredPrices.tier_3 : quantity >= 50 ? product.tieredPrices.tier_2 : product.tieredPrices.tier_1,
        unit: 'm',
      };
    } else {
      return {
        t1Range: '1 - 9 pcs',
        t2Range: '10 - 49 pcs',
        t3Range: '50+ pcs',
        currentTier: quantity >= 50 ? 3 : quantity >= 10 ? 2 : 1,
        activePrice: quantity >= 50 ? product.tieredPrices.tier_3 : quantity >= 10 ? product.tieredPrices.tier_2 : product.tieredPrices.tier_1,
        unit: 'unit',
      };
    }
  };

  const tierDetails = getPricingTierDetails();
  const subtotal = tierDetails.activePrice * quantity;

  // Add to local storage cart
  const handleAddToQuote = () => {
    try {
      const cartRaw = localStorage.getItem('conex_cart');
      let cart = [];
      if (cartRaw) {
        cart = JSON.parse(cartRaw);
      }

      // Check if product is already in cart
      const existingItemIndex = cart.findIndex((item: any) => item.product === product._id);
      if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += quantity;
      } else {
        cart.push({
          product: product._id,
          name: product.name,
          sku: product.sku,
          slug: product.slug,
          category: product.category,
          basePrice: product.basePrice,
          tieredPrices: product.tieredPrices,
          image: product.images[0] || '',
          quantity: quantity,
        });
      }

      localStorage.setItem('conex_cart', JSON.stringify(cart));
      
      // Dispatch event to update layout header
      window.dispatchEvent(new Event('cart-updated'));

      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  };

  // Lead form handler
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.company || !leadForm.email || !leadForm.mobile || !leadForm.address) {
      alert('Please fill in all details to verify corporate request.');
      return;
    }

    setSubmittingLead(true);
    try {
      const res = await api.createLead({
        name: leadForm.name,
        company: leadForm.company,
        email: leadForm.email,
        mobile: leadForm.mobile,
        address: leadForm.address,
        productId: product._id,
        autoSignup: leadForm.autoSignup,
      });

      if (res.status === 'success') {
        // Trigger simulated PDF download
        const link = document.createElement('a');
        link.href = '#';
        link.setAttribute('download', `${product.sku}_Datasheet.pdf`);
        document.body.appendChild(link);
        
        // Show success state in modal
        if (res.data.autoSignup) {
          setLeadSuccessData({
            email: leadForm.email,
            temporaryPassword: res.data.autoSignup.temporaryPassword,
          });

          // Log user in automatically
          localStorage.setItem('conex_token', res.data.autoSignup.token);
          localStorage.setItem('conex_user', JSON.stringify({
            name: leadForm.name,
            email: leadForm.email,
            companyName: leadForm.company,
            role: 'customer'
          }));
          window.dispatchEvent(new Event('auth-updated'));
        } else {
          // Normal lead success (no auto signup needed, e.g. already registered or not selected)
          setLeadSuccessData({
            email: leadForm.email,
          });
        }
      }
    } catch (err: any) {
      alert(err.message || 'Error capturing lead parameters.');
    } finally {
      setSubmittingLead(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-grow flex flex-col gap-8">
      
      {/* Breadcrumbs */}
      <nav className="text-2xs text-muted font-semibold flex items-center gap-1.5 uppercase tracking-wider">
        <Link href="/" className="hover:text-primary transition-colors">Catalog</Link>
        <span className="text-slate-400">/</span>
        <span className="text-slate-400">{product.category}</span>
        <span className="text-slate-400">/</span>
        <span className="text-foreground line-clamp-1">{product.name}</span>
      </nav>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Side: Images & Gallery (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="relative aspect-square w-full rounded-2xl border border-border bg-slate-900 overflow-hidden shadow-sm flex items-center justify-center">
            <img
              src={activeImage || '/placeholder.png'}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>
          
          {/* Thumbnail Gallery */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`relative h-20 w-20 rounded-xl border overflow-hidden cursor-pointer flex-shrink-0 transition-all ${
                    activeImage === img ? 'border-primary ring-2 ring-primary-glow' : 'border-border opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Details & B2B Actions (7 Columns) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Header Info */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-0.5 text-2xs font-bold text-muted border border-border">
                {product.category}
              </span>
              <span className="text-2xs font-mono text-muted uppercase font-bold">
                SKU: {product.sku}
              </span>
            </div>
            
            <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Stock status indicator */}
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-block h-2 w-2 rounded-full ${product.stock > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              <span className="text-2xs font-bold text-muted uppercase tracking-wider">
                {product.stock > 0 ? `${product.stock} ${isCable ? 'meters' : 'units'} in Stock` : 'Out of Stock / Direct Order'}
              </span>
            </div>
          </div>

          <hr className="border-border" />

          {/* Description */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-muted">Product Overview</h3>
            <p className="text-sm text-muted leading-relaxed whitespace-pre-line">{product.description}</p>
          </div>

          {/* B2B Tiered Price Table */}
          <div className="flex flex-col gap-3 p-5 rounded-2xl border border-card-border bg-card shadow-xs">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-wider">B2B Volume Price Grid</h3>
              <span className="text-[10px] text-primary font-semibold font-mono">Excl. 18% GST</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center mt-2">
              {/* Tier 1 */}
              <div className={`p-3 rounded-xl border flex flex-col gap-1 transition-all ${
                tierDetails.currentTier === 1 
                  ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                  : 'border-border bg-background'
              }`}>
                <span className="text-3xs text-muted font-bold font-mono">TIER 1 ({tierDetails.t1Range})</span>
                <span className="text-sm font-extrabold text-foreground">₹{product.tieredPrices.tier_1.toLocaleString('en-IN')}</span>
              </div>

              {/* Tier 2 */}
              <div className={`p-3 rounded-xl border flex flex-col gap-1 transition-all ${
                tierDetails.currentTier === 2 
                  ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                  : 'border-border bg-background'
              }`}>
                <span className="text-3xs text-muted font-bold font-mono">TIER 2 ({tierDetails.t2Range})</span>
                <span className="text-sm font-extrabold text-foreground">₹{product.tieredPrices.tier_2.toLocaleString('en-IN')}</span>
              </div>

              {/* Tier 3 */}
              <div className={`p-3 rounded-xl border flex flex-col gap-1 transition-all ${
                tierDetails.currentTier === 3 
                  ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                  : 'border-border bg-background'
              }`}>
                <span className="text-3xs text-muted font-bold font-mono">TIER 3 ({tierDetails.t3Range})</span>
                <span className="text-sm font-extrabold text-foreground">₹{product.tieredPrices.tier_3.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Interactive Quantity & Subtotal Calculator */}
            <div className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row gap-4 items-center justify-between">
              
              {/* Quantity Picker */}
              <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                <label className="text-[10px] font-mono text-muted uppercase font-bold">RFQ Quantity ({isCable ? 'Meters' : 'Units'})</label>
                <div className="flex items-center rounded-lg border border-border bg-background overflow-hidden max-w-fit h-10">
                  <button 
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="w-10 h-full border-r border-border text-muted hover:bg-muted-background hover:text-foreground font-bold transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-center text-sm font-extrabold bg-transparent focus:outline-none text-foreground"
                  />
                  <button 
                    onClick={() => setQuantity(prev => prev + 1)}
                    className="w-10 h-full border-l border-border text-muted hover:bg-muted-background hover:text-foreground font-bold transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Total Summary */}
              <div className="text-right flex flex-col gap-0.5 w-full sm:w-auto">
                <span className="text-[10px] font-mono text-muted uppercase font-bold">Estimated RFQ Value</span>
                <div className="text-xl font-black text-foreground">
                  ₹{subtotal.toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] font-semibold text-emerald-500">
                  Active Price: ₹{tierDetails.activePrice.toLocaleString('en-IN')}/{tierDetails.unit}
                </span>
              </div>
            </div>

            {/* Actions: Add to Quote and Datasheet Download */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <button
                onClick={handleAddToQuote}
                disabled={product.stock === 0}
                className={`flex h-11 items-center justify-center rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer ${
                  addedToCart 
                    ? 'bg-emerald-500 text-white shadow-emerald-500/10' 
                    : 'bg-primary text-white hover:bg-primary-hover shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {addedToCart ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    Added to Quote Cart!
                  </span>
                ) : 'Add to Quote Request'}
              </button>

              <button
                onClick={() => setShowDatasheetModal(true)}
                className="flex h-11 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted-background text-xs font-bold text-foreground transition-all cursor-pointer"
              >
                <svg className="w-4 h-4 mr-1.5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Technical Datasheet
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* Specifications Table */}
      <div className="mt-8 border border-border rounded-2xl bg-card overflow-hidden shadow-xs">
        <div className="bg-muted-background border-b border-border px-6 py-4">
          <h3 className="text-xs font-bold font-mono text-foreground uppercase tracking-wider">Technical Specifications</h3>
        </div>
        <div className="divide-y divide-border">
          {product.specifications && product.specifications.length > 0 ? (
            product.specifications.map((spec, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 px-6 py-3.5 text-xs">
                <span className="font-mono text-muted uppercase font-bold mb-1 sm:mb-0">{spec.name}</span>
                <span className="sm:col-span-2 text-foreground font-semibold">{spec.value}</span>
              </div>
            ))
          ) : (
            <div className="px-6 py-4 text-xs text-muted">No specific parameters available.</div>
          )}
        </div>
      </div>

      {/* Datasheet Lead Modal */}
      {showDatasheetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl border border-card-border bg-card p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            
            {/* Close button */}
            <button 
              onClick={() => {
                setShowDatasheetModal(false);
                setLeadSuccessData(null);
              }}
              className="absolute top-4 right-4 text-muted hover:text-foreground cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {!leadSuccessData ? (
              // Lead Capture Form View
              <form onSubmit={handleLeadSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-wider">Datasheet Verification</span>
                  <h2 className="text-lg font-extrabold text-foreground">Verify Your Corporate Details</h2>
                  <p className="text-xs text-muted">Please provide details to verify you are a commercial client. We will immediately download the technical sheet for <span className="font-semibold text-foreground">{product.name}</span>.</p>
                </div>

                <hr className="border-border" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-3xs font-mono text-muted uppercase font-bold">Contact Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={leadForm.name}
                      onChange={(e) => setLeadForm({...leadForm, name: e.target.value})}
                      className="h-9 px-3 text-xs bg-muted-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-3xs font-mono text-muted uppercase font-bold">Company Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Diagnostics Ltd"
                      value={leadForm.company}
                      onChange={(e) => setLeadForm({...leadForm, company: e.target.value})}
                      className="h-9 px-3 text-xs bg-muted-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-3xs font-mono text-muted uppercase font-bold">Corporate Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. r.sharma@apex.in"
                      value={leadForm.email}
                      onChange={(e) => setLeadForm({...leadForm, email: e.target.value})}
                      className="h-9 px-3 text-xs bg-muted-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-3xs font-mono text-muted uppercase font-bold">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={leadForm.mobile}
                      onChange={(e) => setLeadForm({...leadForm, mobile: e.target.value})}
                      className="h-9 px-3 text-xs bg-muted-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-3xs font-mono text-muted uppercase font-bold">Delivery / Installation Address *</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Enter plant or delivery site address..."
                    value={leadForm.address}
                    onChange={(e) => setLeadForm({...leadForm, address: e.target.value})}
                    className="p-3 text-xs bg-muted-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Auto Signup check button */}
                <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <input
                    type="checkbox"
                    id="autoSignup"
                    checked={leadForm.autoSignup}
                    onChange={(e) => setLeadForm({...leadForm, autoSignup: e.target.checked})}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                  />
                  <label htmlFor="autoSignup" className="text-2xs text-foreground font-semibold cursor-pointer">
                    Create a free B2B partner account automatically using these details. <br />
                    <span className="text-3xs text-muted font-normal">This enables you to track quotes, save addresses, and unlocks custom tiered pricing.</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submittingLead}
                  className="flex h-10 w-full items-center justify-center rounded-lg bg-primary hover:bg-primary-hover text-xs font-bold text-white shadow-md shadow-primary/15 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submittingLead ? 'Verifying Details...' : 'Submit & Download Technical Sheet'}
                </button>
              </form>
            ) : (
              // Success / Auto-signup credentials Display View
              <div className="flex flex-col gap-4 text-center py-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mx-auto mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>

                <h2 className="text-lg font-extrabold text-foreground">Datasheet Verification Complete</h2>
                <p className="text-xs text-muted">
                  Technical specifications sheet for <span className="font-semibold text-foreground">{product.sku}</span> has started downloading.
                </p>

                {leadSuccessData.temporaryPassword ? (
                  <div className="bg-muted-background p-4 rounded-xl border border-border flex flex-col gap-3 text-left mt-2">
                    <div className="text-3xs font-mono text-primary font-bold uppercase tracking-wider">Auto-Generated B2B Account Details</div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted font-mono uppercase font-bold">Email / Username</span>
                      <span className="text-xs font-bold text-foreground font-mono">{leadSuccessData.email}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-muted font-mono uppercase font-bold">Temporary Password</span>
                      <span className="text-xs font-bold text-foreground font-mono bg-background border border-border px-2 py-1 rounded w-fit select-all">
                        {leadSuccessData.temporaryPassword}
                      </span>
                      <span className="text-[9px] text-slate-400">Please use this temporary password to log in. You can change it later inside your customer portal.</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-muted-background border border-border rounded-xl text-2xs text-muted mt-2">
                    Thank you! We will email you the updated datasheet details.
                  </div>
                )}

                <button
                  onClick={() => {
                    setShowDatasheetModal(false);
                    setLeadSuccessData(null);
                  }}
                  className="mt-4 flex h-10 w-full items-center justify-center rounded-lg bg-primary hover:bg-primary-hover text-xs font-bold text-white transition-all cursor-pointer"
                >
                  Continue Browsing
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
