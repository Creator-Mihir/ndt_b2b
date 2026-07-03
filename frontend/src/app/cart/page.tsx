'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, IProduct } from '../../lib/api';

interface ICartItem {
  product: string;
  name: string;
  sku: string;
  slug: string;
  category: string;
  basePrice: number;
  tieredPrices: {
    tier_1: number;
    tier_2: number;
    tier_3: number;
  };
  image: string;
  quantity: number;
}

const INDIAN_STATES = [
  'Maharashtra',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Puducherry',
];

export default function CartPage() {
  const router = useRouter();
  
  const [cartItems, setCartItems] = useState<ICartItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Auth state
  const [user, setUser] = useState<any>(null);
  const [userAddresses, setUserAddresses] = useState<any[]>([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(-1);
  
  // Guest form state
  const [guestForm, setGuestForm] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    gstin: '',
    street: '',
    city: '',
    state: 'Maharashtra',
    postalCode: '',
  });

  // Additional RFQ state
  const [specialNotes, setSpecialNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Address creation form for logged-in user inside checkout
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    state: 'Maharashtra',
    postalCode: '',
    isDefault: false,
  });

  useEffect(() => {
    // Load Cart
    const loadCartAndAuth = async () => {
      setLoading(true);
      try {
        const cartRaw = localStorage.getItem('conex_cart');
        if (cartRaw) {
          setCartItems(JSON.parse(cartRaw));
        }

        // Load Auth User
        const savedUser = localStorage.getItem('conex_user');
        const token = localStorage.getItem('conex_token');
        if (savedUser && token) {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          
          // Fetch freshest user profile & address book from backend
          const profileRes = await api.getMe();
          if (profileRes.status === 'success') {
            const freshUser = profileRes.data.user;
            setUser(freshUser);
            localStorage.setItem('conex_user', JSON.stringify(freshUser));
            
            if (freshUser.addresses && freshUser.addresses.length > 0) {
              setUserAddresses(freshUser.addresses);
              // Set default address
              const defaultIdx = freshUser.addresses.findIndex((addr: any) => addr.isDefault);
              setSelectedAddressIndex(defaultIdx >= 0 ? defaultIdx : 0);
            }
          }
        }
      } catch (err) {
        console.error('Error loading checkout parameters:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCartAndAuth();
  }, []);

  // Sync cart helper
  const saveCart = (items: ICartItem[]) => {
    setCartItems(items);
    localStorage.setItem('conex_cart', JSON.stringify(items));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const handleUpdateQuantity = (idx: number, newQty: number) => {
    if (newQty < 1) return;
    const newCart = [...cartItems];
    newCart[idx].quantity = newQty;
    saveCart(newCart);
  };

  const handleRemoveItem = (idx: number) => {
    const newCart = cartItems.filter((_, i) => i !== idx);
    saveCart(newCart);
  };

  // Pricing Helpers
  const getItemPrice = (item: ICartItem) => {
    const isCable = item.category === 'Cables & Accessories';
    const qty = item.quantity;
    if (isCable) {
      if (qty >= 200) return item.tieredPrices.tier_3;
      if (qty >= 50) return item.tieredPrices.tier_2;
      return item.tieredPrices.tier_1;
    } else {
      if (qty >= 50) return item.tieredPrices.tier_3;
      if (qty >= 10) return item.tieredPrices.tier_2;
      return item.tieredPrices.tier_1;
    }
  };

  const getItemTierName = (item: ICartItem) => {
    const isCable = item.category === 'Cables & Accessories';
    const qty = item.quantity;
    if (isCable) {
      if (qty >= 200) return 'Tier 3 (Bulk)';
      if (qty >= 50) return 'Tier 2 (Volume)';
      return 'Tier 1 (Base)';
    } else {
      if (qty >= 50) return 'Tier 3 (Bulk)';
      if (qty >= 10) return 'Tier 2 (Volume)';
      return 'Tier 1 (Base)';
    }
  };

  // Totals calculations
  const subtotal = cartItems.reduce((sum, item) => sum + (getItemPrice(item) * item.quantity), 0);

  // Get active checkout state (to calculate GST)
  const getActiveShippingState = () => {
    if (user && selectedAddressIndex >= 0 && userAddresses[selectedAddressIndex]) {
      return userAddresses[selectedAddressIndex].state;
    }
    return guestForm.state;
  };

  const shippingState = getActiveShippingState();
  const isIntrastate = (shippingState || '').trim().toLowerCase() === 'maharashtra';
  
  const cgst = isIntrastate ? Number((subtotal * 0.09).toFixed(2)) : 0;
  const sgst = isIntrastate ? Number((subtotal * 0.09).toFixed(2)) : 0;
  const igst = !isIntrastate ? Number((subtotal * 0.18).toFixed(2)) : 0;
  const total = Number((subtotal + cgst + sgst + igst).toFixed(2));

  // Add Address Handler for Logged In User
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.street || !newAddress.city || !newAddress.state || !newAddress.postalCode) {
      alert('Please fill out all address fields.');
      return;
    }
    try {
      const res = await api.addAddress(newAddress);
      if (res.status === 'success') {
        const updatedUser = res.data.user;
        setUser(updatedUser);
        localStorage.setItem('conex_user', JSON.stringify(updatedUser));
        setUserAddresses(updatedUser.addresses);
        setSelectedAddressIndex(updatedUser.addresses.length - 1);
        setShowNewAddressForm(false);
        setNewAddress({
          street: '',
          city: '',
          state: 'Maharashtra',
          postalCode: '',
          isDefault: false,
        });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save address.');
    }
  };

  // Submit RFQ Handler
  const handleSubmitRFQ = async () => {
    if (cartItems.length === 0) return;
    
    // Address checking
    let shippingDetailsText = '';
    if (user) {
      if (selectedAddressIndex < 0 || !userAddresses[selectedAddressIndex]) {
        alert('Please select or add a shipping address.');
        return;
      }
      const addr = userAddresses[selectedAddressIndex];
      shippingDetailsText = `Shipping Address:\n${addr.street}, ${addr.city}, ${addr.state} - ${addr.postalCode}, India`;
    } else {
      if (!guestForm.name || !guestForm.email || !guestForm.phone || !guestForm.street || !guestForm.city || !guestForm.state || !guestForm.postalCode) {
        alert('Please fill out all guest checkout details and shipping address.');
        return;
      }
      shippingDetailsText = `Shipping Address:\n${guestForm.street}, ${guestForm.city}, ${guestForm.state} - ${guestForm.postalCode}, India`;
    }

    setSubmitting(true);
    try {
      // Build items payload
      const itemsPayload = cartItems.map(item => ({
        product: item.product,
        requestedQuantity: item.quantity,
      }));

      // Combine address and special notes
      const notesCombined = `${specialNotes ? `Notes: ${specialNotes}\n\n` : ''}${shippingDetailsText}${guestForm.gstin ? `\nGSTIN: ${guestForm.gstin}` : ''}${user?.gstin ? `\nGSTIN: ${user.gstin}` : ''}`;

      const quotePayload: any = {
        items: itemsPayload,
        notes: notesCombined,
      };

      if (!user) {
        quotePayload.guestDetails = {
          name: guestForm.name,
          email: guestForm.email,
          phone: guestForm.phone,
          companyName: guestForm.companyName || undefined,
          gstin: guestForm.gstin || undefined,
        };
      }

      const res = await api.createQuote(quotePayload);
      if (res.status === 'success') {
        // Clear Cart
        saveCart([]);
        
        // Redirect to success
        const queryParams = new URLSearchParams();
        queryParams.set('quoteNumber', res.data.quoteRequest.quoteNumber);
        if (res.data.quoteRequest.token) {
          queryParams.set('token', res.data.quoteRequest.token);
        }
        router.push(`/cart/success?${queryParams.toString()}`);
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred during RFQ submission.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24 min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-xs text-muted font-mono animate-pulse">Reviewing quote cart...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center flex-grow flex flex-col justify-center items-center gap-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-extrabold text-foreground">Your Quote Cart is Empty</h2>
          <p className="text-sm text-muted max-w-sm">Browse our B2B catalog to select custom cables, adaptors, and NDT equipment to add to your quote request.</p>
        </div>
        <Link href="/" className="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-xs font-bold text-white hover:bg-primary-hover shadow-lg transition-all">
          Browse Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-grow flex flex-col gap-8">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl tracking-tight leading-none">
          Verify Quote Request
        </h1>
        <p className="text-xs text-muted mt-1.5">Configure product quantities and corporate billing metrics before submitting your RFQ.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Cart Items list (7 Columns) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Cart Table Header */}
          <div className="hidden sm:grid grid-cols-12 border-b border-border pb-3 text-3xs font-mono uppercase font-bold text-muted px-4">
            <div className="col-span-6">Item Particulars</div>
            <div className="col-span-3 text-center">RFQ Quantity</div>
            <div className="col-span-3 text-right font-semibold">Staged Price</div>
          </div>

          {/* Cart Items */}
          <div className="flex flex-col gap-4">
            {cartItems.map((item, idx) => {
              const activePrice = getItemPrice(item);
              const itemSubtotal = activePrice * item.quantity;
              const tierName = getItemTierName(item);
              
              return (
                <div key={idx} className="flex flex-col sm:grid sm:grid-cols-12 items-center gap-4 p-4 rounded-xl border border-card-border bg-card shadow-xs relative">
                  
                  {/* Particulars (6 Columns) */}
                  <div className="col-span-6 flex gap-4 w-full">
                    <div className="h-16 w-16 bg-slate-100 rounded-lg border border-border overflow-hidden shrink-0 flex items-center justify-center">
                      <img src={item.image || '/placeholder.png'} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-mono text-muted uppercase font-bold">SKU: {item.sku}</span>
                      <h3 className="text-xs font-bold text-foreground leading-snug line-clamp-2 hover:text-primary">
                        <Link href={`/product/${item.slug}`}>{item.name}</Link>
                      </h3>
                      <span className="text-[9px] text-muted">{item.category}</span>
                    </div>
                  </div>

                  {/* Quantity selector (3 Columns) */}
                  <div className="col-span-3 flex flex-col items-center gap-1.5 w-full sm:w-auto">
                    <div className="flex items-center rounded-lg border border-border bg-background overflow-hidden h-8 w-24">
                      <button 
                        onClick={() => handleUpdateQuantity(idx, item.quantity - 1)}
                        className="w-8 h-full border-r border-border text-muted hover:bg-muted-background font-bold transition-colors cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleUpdateQuantity(idx, Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-8 text-center text-xs font-bold bg-transparent focus:outline-none text-foreground"
                      />
                      <button 
                        onClick={() => handleUpdateQuantity(idx, item.quantity + 1)}
                        className="w-8 h-full border-l border-border text-muted hover:bg-muted-background font-bold transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-[9px] font-mono text-primary font-semibold">{tierName} applied</span>
                  </div>

                  {/* Subtotal & Remove (3 Columns) */}
                  <div className="col-span-3 flex sm:flex-col items-baseline justify-between sm:items-end w-full sm:w-auto mt-2 sm:mt-0">
                    <span className="sm:hidden text-3xs font-mono text-muted uppercase font-bold">Staged Price</span>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold text-foreground">₹{itemSubtotal.toLocaleString('en-IN')}</span>
                      <span className="text-[10px] text-muted">₹{activePrice.toLocaleString('en-IN')} each</span>
                    </div>
                  </div>

                  {/* Remove Button - Absolute on top-right */}
                  <button 
                    onClick={() => handleRemoveItem(idx)}
                    className="absolute top-2 right-2 p-1 text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                </div>
              );
            })}
          </div>

          {/* Notes field */}
          <div className="flex flex-col gap-1.5 mt-2">
            <label className="text-[10px] font-mono text-muted uppercase font-bold">Special RFQ Notes or Custom Requests</label>
            <textarea
              rows={3}
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder="Provide specialized specifications, lead time requests, or project notes here..."
              className="p-3 text-xs bg-card border border-border rounded-xl text-foreground focus:outline-none focus:border-primary shadow-xs"
            />
          </div>

        </div>

        {/* Right Side: Shipping & GST Calculation Details (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          <div className="flex flex-col gap-4 p-5 rounded-2xl border border-card-border bg-card shadow-sm">
            <div className="border-b border-border pb-3">
              <h2 className="text-sm font-bold text-foreground font-mono uppercase tracking-wider">Corporate Checkout</h2>
            </div>

            {/* If user is logged in, show address picker */}
            {user ? (
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-muted uppercase font-bold">Billing Corporate Entity</span>
                  <Link href="/dashboard" className="text-3xs font-semibold text-primary hover:underline">Manage Book</Link>
                </div>
                <div className="p-3 bg-muted-background border border-border rounded-xl">
                  <div className="text-xs font-bold text-foreground">{user.companyName || 'Not Set'}</div>
                  <div className="text-2xs text-muted font-medium mt-0.5">GSTIN: {user.gstin || 'N/A'}</div>
                </div>

                <div className="flex justify-between items-center mt-2">
                  <span className="text-[10px] font-mono text-muted uppercase font-bold">Select Shipping Profile</span>
                  <button 
                    onClick={() => setShowNewAddressForm(true)}
                    className="text-3xs font-bold text-primary hover:underline cursor-pointer"
                  >
                    + Add Address
                  </button>
                </div>

                {userAddresses.length === 0 ? (
                  <div className="text-center py-4 border border-dashed border-border rounded-xl text-2xs text-muted">
                    No shipping addresses saved. <br />
                    <button 
                      onClick={() => setShowNewAddressForm(true)} 
                      className="text-primary font-bold hover:underline mt-1 cursor-pointer"
                    >
                      Create first address
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {userAddresses.map((addr, index) => (
                      <label 
                        key={index}
                        className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedAddressIndex === index 
                            ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                            : 'border-border bg-background hover:bg-muted-background'
                        }`}
                      >
                        <input
                          type="radio"
                          name="shipping_address"
                          checked={selectedAddressIndex === index}
                          onChange={() => setSelectedAddressIndex(index)}
                          className="mt-1 h-3.5 w-3.5 text-primary border-border focus:ring-primary/20 cursor-pointer"
                        />
                        <div className="text-2xs text-foreground flex-1">
                          <span className="font-bold flex items-center gap-1">
                            Address #{index + 1}
                            {addr.isDefault && <span className="inline-block bg-primary/10 text-primary text-3xs px-1.5 py-0.5 rounded font-mono font-bold">Default</span>}
                          </span>
                          <span className="block text-muted mt-1 leading-relaxed">{addr.street}, {addr.city}, {addr.state} - {addr.postalCode}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Guest checkout form
              <div className="flex flex-col gap-3.5">
                <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-2xs leading-normal">Submitting RFQ as <span className="font-bold">Guest</span>. <Link href="/login" className="font-bold underline hover:text-white">Sign In</Link> to save orders and auto-populate corporate parameters.</p>
                </div>

                <span className="text-[10px] font-mono text-muted uppercase font-bold">Guest Company Information</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-3xs font-mono text-slate-400 uppercase font-bold">Buyer Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. S. Kumar"
                      value={guestForm.name}
                      onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                      className="h-8.5 px-2.5 text-2xs bg-muted-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-3xs font-mono text-slate-400 uppercase font-bold">Company Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kumar Diagnostics"
                      value={guestForm.companyName}
                      onChange={(e) => setGuestForm({ ...guestForm, companyName: e.target.value })}
                      className="h-8.5 px-2.5 text-2xs bg-muted-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-3xs font-mono text-slate-400 uppercase font-bold">Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="buyer@domain.com"
                      value={guestForm.email}
                      onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                      className="h-8.5 px-2.5 text-2xs bg-muted-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-3xs font-mono text-slate-400 uppercase font-bold">Phone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 XXXXX XXXXX"
                      value={guestForm.phone}
                      onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                      className="h-8.5 px-2.5 text-2xs bg-muted-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-3xs font-mono text-slate-400 uppercase font-bold">GSTIN (Optional)</label>
                  <input
                    type="text"
                    placeholder="27AAAAA1111A1Z1"
                    value={guestForm.gstin}
                    onChange={(e) => setGuestForm({ ...guestForm, gstin: e.target.value.toUpperCase() })}
                    className="h-8.5 px-2.5 text-2xs bg-muted-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <span className="text-[10px] font-mono text-muted uppercase font-bold mt-2">Delivery Address Details</span>

                <div className="flex flex-col gap-1">
                  <label className="text-3xs font-mono text-slate-400 uppercase font-bold">Street Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="Plant location, Industrial Estate..."
                    value={guestForm.street}
                    onChange={(e) => setGuestForm({ ...guestForm, street: e.target.value })}
                    className="h-8.5 px-2.5 text-2xs bg-muted-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-3xs font-mono text-slate-400 uppercase font-bold">City *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pune"
                      value={guestForm.city}
                      onChange={(e) => setGuestForm({ ...guestForm, city: e.target.value })}
                      className="h-8.5 px-2.5 text-2xs bg-muted-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-3xs font-mono text-slate-400 uppercase font-bold">Postal Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 411001"
                      value={guestForm.postalCode}
                      onChange={(e) => setGuestForm({ ...guestForm, postalCode: e.target.value })}
                      className="h-8.5 px-2.5 text-2xs bg-muted-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-3xs font-mono text-slate-400 uppercase font-bold">State (Determines GST rate) *</label>
                  <select
                    value={guestForm.state}
                    onChange={(e) => setGuestForm({ ...guestForm, state: e.target.value })}
                    className="h-9 px-2.5 text-2xs bg-muted-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary cursor-pointer"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* GST Summary & pricing ledger */}
            <div className="mt-4 border-t border-border pt-4 flex flex-col gap-2 bg-muted-background p-4 rounded-xl border border-border">
              <div className="text-3xs font-mono text-muted uppercase font-bold">Indian Tax Valuation</div>
              
              <div className="flex justify-between text-xs font-semibold mt-1">
                <span className="text-muted">Item Subtotal</span>
                <span className="text-foreground">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              {isIntrastate ? (
                <>
                  <div className="flex justify-between text-2xs font-medium text-slate-500">
                    <span>CGST (9% Intrastate)</span>
                    <span>+ ₹{cgst.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-2xs font-medium text-slate-500">
                    <span>SGST (9% Intrastate)</span>
                    <span>+ ₹{sgst.toLocaleString('en-IN')}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-2xs font-medium text-slate-500">
                  <span>IGST (18% Interstate - {shippingState})</span>
                  <span>+ ₹{igst.toLocaleString('en-IN')}</span>
                </div>
              )}

              <hr className="border-border mt-1" />

              <div className="flex justify-between text-sm font-black text-foreground pt-1.5">
                <span>Estimated Value</span>
                <span className="text-primary">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              onClick={handleSubmitRFQ}
              disabled={submitting}
              className="mt-2 flex h-11 w-full items-center justify-center rounded-lg bg-primary hover:bg-primary-hover text-xs font-bold text-white shadow-md shadow-primary/10 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Submitting Quote Request...' : 'Submit Request for Quote (RFQ)'}
            </button>

          </div>

        </div>

      </div>

      {/* New Address Dialog Form (Logged in users only) */}
      {showNewAddressForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form onSubmit={handleAddAddress} className="relative w-full max-w-md rounded-2xl border border-card-border bg-card p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-sm font-bold text-foreground font-mono uppercase tracking-wider border-b border-border pb-2.5">Add Shipping Location</h2>
            
            <div className="flex flex-col gap-1">
              <label className="text-3xs font-mono text-muted uppercase font-bold">Street Address *</label>
              <input
                type="text"
                required
                placeholder="Unit, Building name, Industrial Area..."
                value={newAddress.street}
                onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                className="h-9 px-3 text-xs bg-muted-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-3xs font-mono text-muted uppercase font-bold">City *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Navi Mumbai"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                  className="h-9 px-3 text-xs bg-muted-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-3xs font-mono text-muted uppercase font-bold">Postal Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 400703"
                  value={newAddress.postalCode}
                  onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                  className="h-9 px-3 text-xs bg-muted-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-3xs font-mono text-muted uppercase font-bold">State *</label>
              <select
                value={newAddress.state}
                onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                className="h-9 px-3 text-xs bg-muted-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary cursor-pointer"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                id="isDefault"
                checked={newAddress.isDefault}
                onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
              />
              <label htmlFor="isDefault" className="text-2xs text-muted font-bold uppercase tracking-wide cursor-pointer">
                Mark as primary address
              </label>
            </div>

            <div className="flex gap-3 mt-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setShowNewAddressForm(false)}
                className="h-10 flex-1 rounded-lg border border-border text-xs font-bold text-foreground hover:bg-muted-background cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-10 flex-1 rounded-lg bg-primary hover:bg-primary-hover text-xs font-bold text-white cursor-pointer"
              >
                Save Location
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
