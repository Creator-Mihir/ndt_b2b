'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    companyName: '',
    gstin: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    const token = localStorage.getItem('conex_token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.phone || !form.companyName) {
      setError('Please fill in all mandatory corporate profile fields.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.signup({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        companyName: form.companyName,
        gstin: form.gstin || undefined,
      });

      if (response.status === 'success') {
        localStorage.setItem('conex_token', response.token);
        localStorage.setItem('conex_user', JSON.stringify(response.data.user));

        // Notify header
        window.dispatchEvent(new Event('auth-updated'));

        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError('Signup failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-20 px-4 bg-slate-900 text-white dark:bg-black relative overflow-hidden min-h-[85vh]">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20"></div>

      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-8 shadow-2xl flex flex-col gap-6">
        
        {/* Header */}
        <div className="text-center flex flex-col gap-2">
          <Link href="/" className="text-2xl font-bold tracking-tight text-primary">
            CONEX<span className="text-white">.in</span>
          </Link>
          <h2 className="text-lg font-bold text-foreground">Create B2B Partner Account</h2>
          <p className="text-2xs text-slate-400">Unlock custom tiered volume discounts and automated GST invoices.</p>
        </div>

        <hr className="border-slate-800" />

        {error && (
          <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-3xs font-mono text-slate-400 uppercase font-bold">Contact Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Amit Patel"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-10 px-3 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-3xs font-mono text-slate-400 uppercase font-bold">Company Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Patel Engineering Ltd"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="h-10 px-3 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-3xs font-mono text-slate-400 uppercase font-bold">Corporate Email *</label>
              <input
                type="email"
                required
                placeholder="e.g. a.patel@pateleng.in"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-10 px-3 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-3xs font-mono text-slate-400 uppercase font-bold">Mobile Number *</label>
              <input
                type="tel"
                required
                placeholder="e.g. +91 99999 88888"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="h-10 px-3 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-3xs font-mono text-slate-400 uppercase font-bold">Password *</label>
              <input
                type="password"
                required
                placeholder="Minimum 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="h-10 px-3 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-3xs font-mono text-slate-400 uppercase font-bold">GSTIN (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 27AAAAA1111A1Z1"
                value={form.gstin}
                onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                className="h-10 px-3 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-primary placeholder:text-slate-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex h-10 w-full items-center justify-center rounded-lg bg-primary hover:bg-primary-hover text-xs font-bold text-white shadow-md shadow-primary/10 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Registering Account...' : 'Register Corporate Account'}
          </button>
        </form>

        <hr className="border-slate-800" />

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-400">
          Already registered?{' '}
          <Link href="/login" className="font-bold text-primary hover:underline">
            Sign In Here
          </Link>
        </p>

      </div>
    </div>
  );
}
