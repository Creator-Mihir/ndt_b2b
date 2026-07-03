'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect to dashboard or admin
  useEffect(() => {
    const token = localStorage.getItem('conex_token');
    const userStr = localStorage.getItem('conex_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      } catch {
        router.push('/dashboard');
      }
    } else if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.login({ email, password });
      if (response.status === 'success') {
        localStorage.setItem('conex_token', response.token);
        localStorage.setItem('conex_user', JSON.stringify(response.data.user));
        
        // Notify header
        window.dispatchEvent(new Event('auth-updated'));
        
        // Redirect based on role
        if (response.data.user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-20 px-4 bg-slate-900 text-white dark:bg-black relative overflow-hidden min-h-[75vh]">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20"></div>

      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-8 shadow-2xl flex flex-col gap-6">
        
        {/* Header */}
        <div className="text-center flex flex-col gap-2">
          <Link href="/" className="text-2xl font-bold tracking-tight text-primary">
            CONEX<span className="text-white">.in</span>
          </Link>
          <h2 className="text-lg font-bold text-foreground">Sign In to Partner Portal</h2>
          <p className="text-2xs text-slate-400">Access quote records, manage profile and shipping addresses.</p>
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
          <div className="flex flex-col gap-1">
            <label className="text-3xs font-mono text-slate-400 uppercase font-bold">Email Address</label>
            <input
              type="email"
              required
              placeholder="e.g. buyer@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 px-3 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label className="text-3xs font-mono text-slate-400 uppercase font-bold">Password</label>
              {/* Reset password - simulated */}
              <span className="text-3xs font-semibold text-primary hover:underline cursor-pointer">Forgot?</span>
            </div>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 px-3 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-primary"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex h-10 w-full items-center justify-center rounded-lg bg-primary hover:bg-primary-hover text-xs font-bold text-white shadow-md shadow-primary/10 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <hr className="border-slate-800" />

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-400">
          New corporate partner?{' '}
          <Link href="/signup" className="font-bold text-primary hover:underline">
            Create an Account
          </Link>
        </p>

      </div>
    </div>
  );
}
