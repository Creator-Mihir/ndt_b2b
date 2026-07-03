'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, IQuote } from '../../lib/api';

function LookupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const initialQuoteNum = searchParams.get('quoteNumber') || '';
  const initialToken = searchParams.get('token') || '';

  // Form states
  const [quoteNumber, setQuoteNumber] = useState(initialQuoteNum);
  const [token, setToken] = useState(initialToken);
  
  // Data states
  const [quote, setQuote] = useState<IQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // User auth state
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('conex_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  // Auto trigger lookup if query parameters are present on load
  useEffect(() => {
    if (initialToken) {
      handleLookup(null, initialToken);
    }
  }, [initialToken]);

  const handleLookup = async (e: React.FormEvent | null, tokenVal?: string) => {
    if (e) e.preventDefault();
    
    const activeToken = tokenVal || token;
    if (!quoteNumber || !activeToken) {
      setError('Please provide reference number and secure token.');
      return;
    }

    setLoading(true);
    setError(null);
    setQuote(null);
    try {
      const response = await api.getQuoteByToken(activeToken);
      if (response.status === 'success') {
        setQuote(response.data.quote);
      } else {
        setError('Quote not found or invalid credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while looking up quote.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status: 'accepted' | 'rejected') => {
    if (!quote || !token) return;
    setLoading(true);
    try {
      const res = await api.updateQuoteStatus(quote._id, status, token);
      if (res.status === 'success') {
        setQuote(res.data.quote);
        alert(`Quote marked as ${status} successfully.`);
      }
    } catch (err: any) {
      alert(err.message || 'Error updating quote status.');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkToAccount = async () => {
    if (!quote || !token) return;
    setLoading(true);
    try {
      const res = await api.linkQuote(quote.quoteNumber, token);
      if (res.status === 'success') {
        alert('Quote request linked to your profile successfully! Redirecting to your dashboard...');
        router.push('/dashboard');
      }
    } catch (err: any) {
      alert(err.message || 'Error linking quote request.');
      setLoading(false);
    }
  };

  // Pricing calculations
  const calculateTotals = () => {
    if (!quote) return { subtotal: 0, cgst: 0, sgst: 0, igst: 0, total: 0, isIntrastate: true, state: 'Maharashtra' };
    
    // Subtotal: if offeredPrice is present, use it; otherwise use basePrice of populated product
    const subtotal = quote.items.reduce((sum, item) => {
      const price = item.offeredPrice || (item.product && typeof item.product === 'object' ? (item.product as any).basePrice : 0);
      return sum + (price * item.requestedQuantity);
    }, 0);

    // Extract state from notes if possible
    // Note format: "Shipping Address:\nStreet, City, State - Zip, India"
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

  const ledger = calculateTotals();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-grow flex flex-col gap-8">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl tracking-tight leading-none">
          Track Guest Quote
        </h1>
        <p className="text-xs text-muted mt-1.5">Verify secure RFQ tokens to check feedback and execute approval transactions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Lookup Form (4 Columns) */}
        <div className="lg:col-span-4 flex flex-col gap-4 p-5 rounded-2xl border border-card-border bg-card shadow-sm">
          <div className="border-b border-border pb-3">
            <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-wider">Access Parameters</h3>
          </div>

          <form onSubmit={(e) => handleLookup(e)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-3xs font-mono text-muted uppercase font-bold font-semibold">RFQ Reference Number</label>
              <input
                type="text"
                required
                placeholder="e.g. REQ-260625-102"
                value={quoteNumber}
                onChange={(e) => setQuoteNumber(e.target.value)}
                className="h-9 px-3 text-xs bg-muted-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-3xs font-mono text-muted uppercase font-bold font-semibold">Security Access Token</label>
              <input
                type="password"
                required
                placeholder="Paste the 48-char secure token..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="h-9 px-3 text-xs bg-muted-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-9 w-full items-center justify-center rounded-lg bg-primary hover:bg-primary-hover text-xs font-bold text-white shadow-md shadow-primary/10 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Authenticating Token...' : 'Track RFQ Details'}
            </button>
          </form>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium mt-1">
              {error}
            </div>
          )}

          {/* Prompt to register or login to link */}
          {quote && !quote.customer && (
            <div className="mt-4 pt-4 border-t border-border flex flex-col gap-3">
              <span className="text-[10px] font-mono text-muted uppercase font-bold">Method B: Quote Binder</span>
              {currentUser ? (
                <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl flex flex-col gap-2">
                  <p className="text-3xs text-foreground leading-normal">
                    You are logged in as <span className="font-bold">{currentUser.name}</span>. You can bind this guest quote to your profile permanently.
                  </p>
                  <button
                    onClick={handleLinkToAccount}
                    className="h-7 w-full rounded bg-primary text-white text-3xs font-bold hover:bg-primary-hover transition-colors cursor-pointer"
                  >
                    Bind to Profile
                  </button>
                </div>
              ) : (
                <div className="bg-slate-500/5 border border-slate-500/10 p-3 rounded-xl">
                  <p className="text-3xs text-muted leading-normal">
                    To save this RFQ to a customer dashboard, please <Link href="/login" className="text-primary font-bold hover:underline">Sign In</Link> or <Link href="/signup" className="text-primary font-bold hover:underline">Sign Up</Link> first.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Quote Details display (8 Columns) */}
        <div className="lg:col-span-8">
          {quote ? (
            <div className="flex flex-col gap-6">
              
              {/* Quote summary card */}
              <div className="p-5 rounded-2xl border border-card-border bg-card shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">{quote.quoteNumber}</span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-3xs font-extrabold uppercase tracking-wider ${
                      quote.status === 'responded' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse' :
                      quote.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                      quote.status === 'rejected' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                      'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      {quote.status}
                    </span>
                  </div>
                  <h2 className="text-base font-extrabold text-foreground">RFQ Status Records</h2>
                  <span className="text-3xs text-muted">Submitted on: {new Date(quote.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>

                <div className="text-left sm:text-right flex flex-col gap-0.5">
                  <span className="text-[10px] font-mono text-muted uppercase font-bold">Total Staged Quote</span>
                  <span className="text-lg font-black text-foreground">₹{ledger.total.toLocaleString('en-IN')}</span>
                  <span className="text-3xs text-muted">Incl. 18% Indian GST</span>
                </div>
              </div>

              {/* Admin feedback alert */}
              {quote.adminFeedback && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                  <div className="text-3xs font-mono text-primary font-bold uppercase tracking-wider">Manufacturer Response Notes</div>
                  <p className="text-xs text-foreground font-semibold mt-1 leading-relaxed">{quote.adminFeedback}</p>
                </div>
              )}

              {/* Particulars List */}
              <div className="border border-border rounded-2xl bg-card overflow-hidden shadow-xs">
                <div className="bg-muted-background border-b border-border px-5 py-3 text-3xs font-mono uppercase font-bold text-muted">
                  Staged Product Particulars
                </div>
                
                <div className="divide-y divide-border">
                  {quote.items.map((item, idx) => {
                    const prod = item.product as any;
                    const name = prod?.name || 'Unknown Product';
                    const sku = prod?.sku || 'N/A';
                    const basePrice = prod?.basePrice || 0;
                    
                    // Applied offered price or base price
                    const displayUnitPrice = item.offeredPrice || basePrice;
                    const subtotalItem = displayUnitPrice * item.requestedQuantity;
                    const discountRate = item.offeredPrice && basePrice ? Math.round(((basePrice - item.offeredPrice) / basePrice) * 100) : 0;

                    return (
                      <div key={idx} className="flex flex-col sm:grid sm:grid-cols-12 items-center gap-4 px-5 py-4">
                        <div className="col-span-6 text-left w-full">
                          <span className="text-[10px] font-mono text-muted uppercase font-bold">SKU: {sku}</span>
                          <h4 className="text-xs font-bold text-foreground leading-snug line-clamp-1">{name}</h4>
                          {discountRate > 0 && (
                            <span className="inline-block bg-emerald-500/10 text-emerald-500 text-3xs font-mono font-bold px-1.5 py-0.5 rounded mt-1">
                              {discountRate}% custom discount applied
                            </span>
                          )}
                        </div>
                        <div className="col-span-3 text-center w-full">
                          <span className="sm:hidden text-3xs font-mono text-muted uppercase font-bold mr-1">Qty:</span>
                          <span className="text-xs font-extrabold text-foreground">{item.requestedQuantity}</span>
                        </div>
                        <div className="col-span-3 text-right w-full flex sm:flex-col justify-between sm:items-end">
                          <span className="sm:hidden text-3xs font-mono text-muted uppercase font-bold">Subtotal</span>
                          <div className="text-right">
                            <span className="text-xs font-bold text-foreground">₹{subtotalItem.toLocaleString('en-IN')}</span>
                            <span className="block text-[10px] text-muted">₹{displayUnitPrice.toLocaleString('en-IN')} unit</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* GST breakdown box */}
              <div className="p-5 rounded-2xl border border-card-border bg-card shadow-xs flex flex-col gap-2.5">
                <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-wider border-b border-border pb-2.5">RFQ Financial Ledger</h3>
                
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted">RFQ Subtotal</span>
                  <span className="text-foreground">₹{ledger.subtotal.toLocaleString('en-IN')}</span>
                </div>

                {ledger.isIntrastate ? (
                  <>
                    <div className="flex justify-between text-2xs font-medium text-slate-500">
                      <span>CGST (9% Intrastate)</span>
                      <span>+ ₹{ledger.cgst.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-2xs font-medium text-slate-500">
                      <span>SGST (9% Intrastate)</span>
                      <span>+ ₹{ledger.sgst.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-2xs font-medium text-slate-500">
                    <span>IGST (18% Interstate - {ledger.state})</span>
                    <span>+ ₹{ledger.igst.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <hr className="border-border" />

                <div className="flex justify-between text-sm font-black text-foreground pt-1">
                  <span>RFQ Valuation</span>
                  <span className="text-primary">₹{ledger.total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Accept / Reject actions */}
              {quote.status === 'responded' && (
                <div className="flex gap-4">
                  <button
                    onClick={() => handleUpdateStatus('rejected')}
                    className="flex-1 h-11 rounded-lg border border-rose-500/20 hover:bg-rose-500/5 text-rose-500 text-xs font-bold transition-all cursor-pointer"
                  >
                    Reject Offered Rates
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('accepted')}
                    className="flex-1 h-11 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/10 transition-all cursor-pointer"
                  >
                    Accept Offered Rates & Finalize Order
                  </button>
                </div>
              )}

              {/* Status information banners */}
              {quote.status === 'accepted' && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center flex flex-col gap-1">
                  <span className="text-xs font-bold text-emerald-500">RFQ Finalized & Accepted!</span>
                  <span className="text-[10px] text-slate-400">Our customer representative is generating the final GST Tax Invoice for dispatch processing. We will contact you shortly.</span>
                </div>
              )}

              {quote.status === 'rejected' && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center flex flex-col gap-1">
                  <span className="text-xs font-bold text-rose-500">Offered Rates Rejected</span>
                  <span className="text-[10px] text-slate-400">You have rejected the custom pricing proposed by the manufacturer. If you want to re-negotiate, please submit another RFQ or contact support.</span>
                </div>
              )}

            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-8 border border-dashed border-border bg-card rounded-2xl text-center min-h-[300px]">
              <div className="max-w-xs flex flex-col gap-2">
                <svg className="w-10 h-10 text-slate-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h4 className="text-xs font-bold text-foreground">Waiting for Input</h4>
                <p className="text-3xs text-muted">Input your Quote Reference Number and secure 48-character token to unlock real-time feedback and execution keys.</p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

export default function LookupPage() {
  return (
    <Suspense fallback={
      <div className="flex-grow flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    }>
      <LookupContent />
    </Suspense>
  );
}
