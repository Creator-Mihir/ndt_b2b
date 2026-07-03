'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function SuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const quoteNumber = searchParams.get('quoteNumber') || 'N/A';
  const token = searchParams.get('token') || '';

  const [copiedNum, setCopiedNum] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const copyToClipboard = (text: string, type: 'num' | 'token') => {
    navigator.clipboard.writeText(text);
    if (type === 'num') {
      setCopiedNum(true);
      setTimeout(() => setCopiedNum(false), 2000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24 text-center flex-grow flex flex-col justify-center items-center gap-6">
      
      {/* Success Badge */}
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
        <svg className="h-8 w-8 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl tracking-tight leading-none">
          Quote Request Submitted!
        </h1>
        <p className="text-sm text-muted max-w-md mt-1">
          Your Request for Quote (RFQ) has been logged in our databases. Our technical engineers are reviewing your specifications and will respond with updated custom tiered rates.
        </p>
      </div>

      {/* Quote Metadata Cards */}
      <div className="w-full max-w-md bg-card border border-card-border p-5 rounded-2xl flex flex-col gap-4 shadow-sm text-left">
        
        {/* Quote Number */}
        <div className="flex justify-between items-center bg-muted-background p-3 rounded-xl border border-border">
          <div className="flex flex-col gap-0.5">
            <span className="text-3xs font-mono text-muted uppercase font-bold">RFQ Reference Number</span>
            <span className="text-sm font-extrabold text-foreground font-mono">{quoteNumber}</span>
          </div>
          <button 
            onClick={() => copyToClipboard(quoteNumber, 'num')}
            className="rounded-lg border border-border px-2.5 py-1.5 text-3xs font-bold bg-background text-foreground hover:bg-muted-background transition-colors cursor-pointer"
          >
            {copiedNum ? 'Copied' : 'Copy'}
          </button>
        </div>

        {/* If Guest token exists */}
        {token && (
          <div className="flex flex-col gap-2 bg-amber-500/5 p-4 rounded-xl border border-amber-500/10">
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-0.5">
                <span className="text-3xs font-mono text-amber-500 font-bold uppercase tracking-wider">Secure Guest Access Token</span>
                <span className="text-2xs font-bold text-foreground font-mono truncate max-w-[200px] sm:max-w-[260px]">{token}</span>
              </div>
              <button 
                onClick={() => copyToClipboard(token, 'token')}
                className="rounded-lg border border-amber-500/20 bg-background px-2.5 py-1.5 text-3xs font-bold text-amber-500 hover:bg-amber-500/5 transition-colors cursor-pointer"
              >
                {copiedToken ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-normal">
              &gt; <span className="font-semibold">Important</span>: Keep this token safe. Since you submitted as a guest, you will need this token to track updates, communicate with admins, and accept or reject the finalized quote.
            </p>
          </div>
        )}

      </div>

      {/* Next Steps walkthrough */}
      <div className="text-left w-full max-w-md border-t border-border pt-4">
        <h3 className="text-xs font-mono text-muted uppercase font-bold mb-3 tracking-wider">What happens next?</h3>
        <ul className="space-y-3 text-2xs text-muted leading-relaxed">
          <li className="flex gap-2">
            <span className="text-primary font-bold">1.</span>
            <span>Our admin team reviews stock availability and updates custom tiered rates matching your quantity request.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary font-bold">2.</span>
            {token ? (
              <span>You will paste the Reference Number and Token into the guest tracker to view offered pricing.</span>
            ) : (
              <span>You will receive a notification and can accept/reject the offer directly inside your Customer Portal.</span>
            )}
          </li>
          <li className="flex gap-2">
            <span className="text-primary font-bold">3.</span>
            <span>Once you accept, our support team will dispatch the automated GST tax invoice and initiate packing.</span>
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mt-2 justify-center w-full max-w-md">
        {token ? (
          <button 
            onClick={() => router.push(`/lookup?quoteNumber=${quoteNumber}&token=${token}`)}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-white hover:bg-primary-hover shadow-lg shadow-primary/10 transition-all cursor-pointer min-w-[160px]"
          >
            Track Quote Status
          </button>
        ) : (
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-white hover:bg-primary-hover shadow-lg shadow-primary/10 transition-all cursor-pointer min-w-[160px]"
          >
            Go to Portal Dashboard
          </button>
        )}
        <button 
          onClick={() => router.push('/')}
          className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-xs font-bold text-foreground hover:bg-muted-background transition-all cursor-pointer min-w-[160px]"
        >
          Continue Shopping
        </button>
      </div>

    </div>
  );
}

export default function QuoteSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex-grow flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}
