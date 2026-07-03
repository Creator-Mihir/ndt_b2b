'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, IQuote } from '../../lib/api';

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

export default function DashboardPage() {
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'quotes' | 'profile' | 'addresses'>('quotes');
  
  // Data states
  const [quotes, setQuotes] = useState<IQuote[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    companyName: '',
    gstin: '',
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Address CRUD state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState({
    street: '',
    city: '',
    state: 'Maharashtra',
    postalCode: '',
    isDefault: false,
  });

  // Verify auth session
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('conex_token');
      if (!token) {
        router.push('/login');
        return;
      }
      
      try {
        setLoading(true);
        const res = await api.getMe();
        if (res.status === 'success') {
          const freshUser = res.data.user;
          setUser(freshUser);
          localStorage.setItem('conex_user', JSON.stringify(freshUser));
          
          setProfileForm({
            name: freshUser.name || '',
            phone: freshUser.phone || '',
            companyName: freshUser.companyName || '',
            gstin: freshUser.gstin || '',
          });
          
          // Load quotes
          loadQuotes();
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error('Session verification failed:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, [router]);

  const loadQuotes = async () => {
    try {
      setQuotesLoading(true);
      const res = await api.getMyQuotes();
      if (res.status === 'success') {
        setQuotes(res.data.quotes);
      }
    } catch (err) {
      console.error('Failed to load user quotes history:', err);
    } finally {
      setQuotesLoading(false);
    }
  };

  // Profile submission
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name || !profileForm.phone || !profileForm.companyName) {
      alert('Please fill out all required profile details.');
      return;
    }

    setUpdatingProfile(true);
    try {
      const res = await api.updateProfile(profileForm);
      if (res.status === 'success') {
        const updatedUser = res.data.user;
        setUser(updatedUser);
        localStorage.setItem('conex_user', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('auth-updated'));
        alert('Corporate profile details saved successfully.');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating profile details.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Address CRUD Handlers
  const handleOpenAddressModal = (index: number | null = null) => {
    if (index !== null && user && user.addresses[index]) {
      const addr = user.addresses[index];
      setEditingAddressIndex(index);
      setAddressForm({
        street: addr.street,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postalCode,
        isDefault: addr.isDefault || false,
      });
    } else {
      setEditingAddressIndex(null);
      setAddressForm({
        street: '',
        city: '',
        state: 'Maharashtra',
        postalCode: '',
        isDefault: false,
      });
    }
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.street || !addressForm.city || !addressForm.state || !addressForm.postalCode) {
      alert('All address fields are required.');
      return;
    }

    try {
      let res;
      if (editingAddressIndex !== null) {
        // Edit existing
        res = await api.updateAddress(editingAddressIndex, addressForm);
      } else {
        // Create new
        res = await api.addAddress(addressForm);
      }

      if (res.status === 'success') {
        const updatedUser = res.data.user;
        setUser(updatedUser);
        localStorage.setItem('conex_user', JSON.stringify(updatedUser));
        setShowAddressModal(false);
        alert(editingAddressIndex !== null ? 'Address updated successfully.' : 'New address saved to book.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred while saving address.');
    }
  };

  const handleDeleteAddress = async (index: number) => {
    if (!confirm('Are you sure you want to remove this address location?')) return;
    try {
      const res = await api.deleteAddress(index);
      if (res.status === 'success') {
        const updatedUser = res.data.user;
        setUser(updatedUser);
        localStorage.setItem('conex_user', JSON.stringify(updatedUser));
        alert('Address removed successfully.');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting address.');
    }
  };

  // Accept/Reject action in history
  const handleUpdateQuoteStatus = async (quoteId: string, status: 'accepted' | 'rejected') => {
    try {
      const res = await api.updateQuoteStatus(quoteId, status);
      if (res.status === 'success') {
        // Reload quote lists
        loadQuotes();
        alert(`Quote marked as ${status} successfully.`);
      }
    } catch (err: any) {
      alert(err.message || 'Error updating quote status.');
    }
  };

  // Pricing calculation helper
  const getQuoteLedger = (quote: IQuote) => {
    const subtotal = quote.items.reduce((sum, item) => {
      const price = item.offeredPrice || (item.product && typeof item.product === 'object' ? (item.product as any).basePrice : 0);
      return sum + (price * item.requestedQuantity);
    }, 0);

    // Extract state from notes
    const notesText = quote.notes || '';
    let state = 'Maharashtra';
    const stateMatch = notesText.match(/Shipping Address:\s*[\s\S]*?,\s*([^,\n]*?)\s*-\s*\d+/i);
    if (stateMatch && stateMatch[1]) {
      state = stateMatch[1].trim();
    }

    const isIntrastate = state.toLowerCase() === 'maharashtra';
    const cgst = isIntrastate ? Number((subtotal * 0.09).toFixed(2)) : 0;
    const sgst = isIntrastate ? Number((subtotal * 0.09).toFixed(2)) : 0;
    const igst = !isIntrastate ? Number((subtotal * 0.18).toFixed(2)) : 0;
    const total = Number((subtotal + cgst + sgst + igst).toFixed(2));

    return { subtotal, cgst, sgst, igst, total, isIntrastate, state };
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center py-24 min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-xs text-muted font-mono animate-pulse">Synchronizing dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-grow flex flex-col gap-8">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl tracking-tight leading-none">
          Customer Portal
        </h1>
        <p className="text-xs text-muted mt-1.5">Manage partner credentials, track pending RFQs, and checkout active shipping catalogs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Summary Card (4 Columns) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="p-5 rounded-2xl border border-card-border bg-card shadow-sm flex flex-col gap-4">
            
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 text-primary font-black flex items-center justify-center text-lg">
                {user.name ? user.name[0].toUpperCase() : 'C'}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-foreground leading-snug">{user.name}</span>
                <span className="text-3xs font-mono text-muted uppercase font-semibold">Corporate Partner</span>
              </div>
            </div>

            <hr className="border-border" />

            <div className="flex flex-col gap-2.5 text-2xs text-foreground">
              <div className="flex flex-col gap-0.5">
                <span className="text-3xs font-mono text-muted uppercase font-bold">Email Username</span>
                <span className="font-semibold">{user.email}</span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-3xs font-mono text-muted uppercase font-bold">Registered Mobile</span>
                <span className="font-semibold">{user.phone || 'N/A'}</span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-3xs font-mono text-muted uppercase font-bold">Corporate Entity</span>
                <span className="font-semibold">{user.companyName || 'N/A'}</span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-3xs font-mono text-muted uppercase font-bold">GSTIN Profile</span>
                <span className="font-semibold font-mono text-primary">{user.gstin || 'No GSTIN Added'}</span>
              </div>
            </div>

          </div>

          {/* Quick links catalog */}
          <Link 
            href="/"
            className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold transition-all border border-primary/20 shadow-xs"
          >
            <span>Request New Custom Quote</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>

        {/* Right Side: Tabbed Workspaces (8 Columns) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Tab Navigation */}
          <div className="border-b border-border flex gap-6">
            <button
              onClick={() => setActiveTab('quotes')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider font-mono cursor-pointer transition-all border-b-2 ${
                activeTab === 'quotes' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              Quotes History
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider font-mono cursor-pointer transition-all border-b-2 ${
                activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              Profile Settings
            </button>
            <button
              onClick={() => setActiveTab('addresses')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider font-mono cursor-pointer transition-all border-b-2 ${
                activeTab === 'addresses' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              Address Book
            </button>
          </div>

          {/* Tab Content Workspace */}
          <div className="min-h-[400px]">
            
            {/* Tab 1: Quotes History */}
            {activeTab === 'quotes' && (
              <div className="flex flex-col gap-4">
                {quotesLoading ? (
                  <div className="py-20 text-center animate-pulse text-xs text-muted font-mono">Syncing quotes ledger...</div>
                ) : quotes.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card">
                    <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-4 text-xs font-bold text-foreground">No Quote Requests Found</h3>
                    <p className="mt-1 text-2xs text-muted">You have not submitted any Requests for Quotes (RFQs) yet.</p>
                  </div>
                ) : (
                  quotes.map((quote) => {
                    const isExpanded = expandedQuoteId === quote._id;
                    const ledger = getQuoteLedger(quote);

                    return (
                      <div 
                        key={quote._id}
                        className="rounded-xl border border-card-border bg-card shadow-xs overflow-hidden flex flex-col transition-all"
                      >
                        {/* Summary Header Row */}
                        <div 
                          onClick={() => setExpandedQuoteId(isExpanded ? null : quote._id)}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-muted-background transition-colors"
                        >
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-slate-400">{quote.quoteNumber}</span>
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-3xs font-extrabold uppercase tracking-wider ${
                                quote.status === 'responded' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                quote.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                quote.status === 'rejected' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                                'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                              }`}>
                                {quote.status}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted font-mono uppercase font-bold">
                              Requested {quote.items.length} item{quote.items.length > 1 ? 's' : ''} on {new Date(quote.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-left sm:text-right">
                              <span className="block text-[9px] font-mono text-muted uppercase font-bold">Total Staged Quote</span>
                              <span className="text-sm font-extrabold text-foreground">₹{ledger.total.toLocaleString('en-IN')}</span>
                            </div>
                            <svg 
                              className={`w-4 h-4 text-muted transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>

                        {/* Detailed Accordion Content */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1 border-t border-border bg-muted-background/30 flex flex-col gap-4">
                            
                            {/* Admin Feedback note */}
                            {quote.adminFeedback && (
                              <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl mt-2 text-2xs text-foreground font-semibold">
                                <span className="font-bold text-primary block uppercase font-mono text-3xs tracking-wider mb-0.5">Admin Response Remarks:</span>
                                {quote.adminFeedback}
                              </div>
                            )}

                            {/* Particulars Table */}
                            <div className="border border-border rounded-xl bg-card overflow-hidden">
                              <div className="divide-y divide-border">
                                {quote.items.map((item, index) => {
                                  const prod = item.product as any;
                                  const name = prod?.name || 'Unknown Product';
                                  const sku = prod?.sku || 'N/A';
                                  const price = item.offeredPrice || prod?.basePrice || 0;
                                  const discountRate = item.offeredPrice && prod?.basePrice ? Math.round(((prod.basePrice - item.offeredPrice) / prod.basePrice) * 100) : 0;

                                  return (
                                    <div key={index} className="p-3 flex justify-between items-center text-xs">
                                      <div className="flex flex-col gap-0.5 max-w-[70%]">
                                        <span className="text-3xs font-mono text-muted uppercase font-bold">SKU: {sku}</span>
                                        <span className="font-bold text-foreground truncate">{name}</span>
                                        {discountRate > 0 && <span className="text-[9px] text-emerald-500 font-bold font-mono">Custom {discountRate}% discount</span>}
                                      </div>
                                      <div className="text-right">
                                        <span className="font-extrabold text-foreground">₹{(price * item.requestedQuantity).toLocaleString('en-IN')}</span>
                                        <span className="block text-3xs text-muted">{item.requestedQuantity} x ₹{price.toLocaleString('en-IN')}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Financial breakdown */}
                            <div className="flex flex-col gap-1.5 text-2xs text-muted-foreground border-t border-border pt-3">
                              <div className="flex justify-between font-semibold text-foreground">
                                <span>Subtotal</span>
                                <span>₹{ledger.subtotal.toLocaleString('en-IN')}</span>
                              </div>
                              {ledger.isIntrastate ? (
                                <>
                                  <div className="flex justify-between text-slate-500">
                                    <span>CGST (9%)</span>
                                    <span>+ ₹{ledger.cgst.toLocaleString('en-IN')}</span>
                                  </div>
                                  <div className="flex justify-between text-slate-500">
                                    <span>SGST (9%)</span>
                                    <span>+ ₹{ledger.sgst.toLocaleString('en-IN')}</span>
                                  </div>
                                </>
                              ) : (
                                <div className="flex justify-between text-slate-500">
                                  <span>IGST (18% Interstate - {ledger.state})</span>
                                  <span>+ ₹{ledger.igst.toLocaleString('en-IN')}</span>
                                </div>
                              )}
                              <div className="flex justify-between font-black text-foreground border-t border-border pt-1.5 text-xs">
                                <span>Grand Total Valuation</span>
                                <span className="text-primary font-bold">₹{ledger.total.toLocaleString('en-IN')}</span>
                              </div>
                            </div>

                            {/* Response Actions if responded */}
                            {quote.status === 'responded' && (
                              <div className="flex gap-3 border-t border-border pt-3">
                                <button
                                  onClick={() => handleUpdateQuoteStatus(quote._id, 'rejected')}
                                  className="flex-1 h-8 rounded border border-rose-500/20 text-rose-500 text-3xs font-bold hover:bg-rose-500/5 transition-all cursor-pointer"
                                >
                                  Reject Offer
                                </button>
                                <button
                                  onClick={() => handleUpdateQuoteStatus(quote._id, 'accepted')}
                                  className="flex-1 h-8 rounded bg-emerald-500 text-white text-3xs font-bold hover:bg-emerald-600 transition-all cursor-pointer"
                                >
                                  Accept Offer & Finalize
                                </button>
                              </div>
                            )}

                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Tab 2: Profile Settings */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4 p-5 rounded-2xl border border-card-border bg-card shadow-sm">
                <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-wider border-b border-border pb-2.5">Corporate Metadata</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-3xs font-mono text-muted uppercase font-bold">Contact Name *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="h-9 px-3 text-xs bg-muted-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-3xs font-mono text-muted uppercase font-bold">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="h-9 px-3 text-xs bg-muted-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-3xs font-mono text-muted uppercase font-bold">Company Name *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.companyName}
                      onChange={(e) => setProfileForm({ ...profileForm, companyName: e.target.value })}
                      className="h-9 px-3 text-xs bg-muted-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-3xs font-mono text-muted uppercase font-bold">GSTIN Profile</label>
                    <input
                      type="text"
                      placeholder="e.g. 27AAAAA1111A1Z1"
                      value={profileForm.gstin}
                      onChange={(e) => setProfileForm({ ...profileForm, gstin: e.target.value.toUpperCase() })}
                      className="h-9 px-3 text-xs bg-muted-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="mt-2 flex h-9 items-center justify-center rounded-lg bg-primary hover:bg-primary-hover text-xs font-bold text-white shadow-md shadow-primary/10 transition-all cursor-pointer w-fit px-6 disabled:opacity-50"
                >
                  {updatingProfile ? 'Saving Details...' : 'Save Profile Details'}
                </button>
              </form>
            )}

            {/* Tab 3: Address Book */}
            {activeTab === 'addresses' && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-3xs font-mono text-muted uppercase font-bold">Saved Shipping Locations</span>
                  <button 
                    onClick={() => handleOpenAddressModal(null)}
                    className="rounded-lg bg-primary/10 px-3 py-1.5 text-3xs font-bold text-primary border border-primary/20 hover:bg-primary/15 transition-colors cursor-pointer"
                  >
                    + Add New Address
                  </button>
                </div>

                {user.addresses && user.addresses.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card">
                    <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <h3 className="mt-4 text-xs font-bold text-foreground">No Locations Recorded</h3>
                    <p className="mt-1 text-2xs text-muted">Register corporate delivery sites to speed up quote checking calculations.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {user.addresses.map((addr: any, index: number) => (
                      <div 
                        key={index}
                        className="p-4 rounded-xl border border-card-border bg-card shadow-xs flex flex-col justify-between gap-3 relative"
                      >
                        <div className="text-2xs text-foreground flex flex-col gap-1">
                          <span className="font-bold flex items-center gap-1.5">
                            Location #{index + 1}
                            {addr.isDefault && <span className="bg-primary/15 text-primary text-3xs font-bold px-1.5 py-0.5 rounded font-mono">Primary</span>}
                          </span>
                          <span className="text-muted block mt-1.5 leading-relaxed">
                            {addr.street}, <br />
                            {addr.city}, {addr.state} - {addr.postalCode} <br />
                            {addr.country || 'India'}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2.5 mt-2 border-t border-border pt-3">
                          <button
                            onClick={() => handleOpenAddressModal(index)}
                            className="text-3xs font-bold text-primary hover:underline cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(index)}
                            className="text-3xs font-bold text-rose-500 hover:underline cursor-pointer"
                          >
                            Delete
                          </button>
                          {!addr.isDefault && (
                            <button
                              onClick={() => {
                                setEditingAddressIndex(index);
                                api.updateAddress(index, { ...addr, isDefault: true }).then(res => {
                                  if (res.status === 'success') {
                                    setUser(res.data.user);
                                    localStorage.setItem('conex_user', JSON.stringify(res.data.user));
                                    alert('Primary shipping location updated.');
                                  }
                                });
                              }}
                              className="text-3xs font-semibold text-slate-400 hover:text-slate-600 hover:underline cursor-pointer ml-auto"
                            >
                              Make Primary
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

          </div>

        </div>

      </div>

      {/* Address creation/edit Dialog Form Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form onSubmit={handleSaveAddress} className="relative w-full max-w-md rounded-2xl border border-card-border bg-card p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-sm font-bold text-foreground font-mono uppercase tracking-wider border-b border-border pb-2.5">
              {editingAddressIndex !== null ? 'Modify Shipping Location' : 'Record Shipping Location'}
            </h2>
            
            <div className="flex flex-col gap-1">
              <label className="text-3xs font-mono text-muted uppercase font-bold">Street Address *</label>
              <input
                type="text"
                required
                placeholder="Unit, Building name, Industrial Area..."
                value={addressForm.street}
                onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
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
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  className="h-9 px-3 text-xs bg-muted-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-3xs font-mono text-muted uppercase font-bold">Postal Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 400703"
                  value={addressForm.postalCode}
                  onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                  className="h-9 px-3 text-xs bg-muted-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-3xs font-mono text-muted uppercase font-bold">State *</label>
              <select
                value={addressForm.state}
                onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
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
                id="addressDefault"
                checked={addressForm.isDefault}
                onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
              />
              <label htmlFor="addressDefault" className="text-2xs text-muted font-bold uppercase tracking-wide cursor-pointer">
                Mark as primary address
              </label>
            </div>

            <div className="flex gap-3 mt-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                className="h-10 flex-1 rounded-lg border border-border text-xs font-bold text-foreground hover:bg-muted-background cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-10 flex-1 rounded-lg bg-primary hover:bg-primary-hover text-xs font-bold text-white cursor-pointer"
              >
                {editingAddressIndex !== null ? 'Save Changes' : 'Record Location'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
