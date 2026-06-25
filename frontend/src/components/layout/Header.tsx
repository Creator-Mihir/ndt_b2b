'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [cartCount, setCartCount] = useState(0);

  // Sync state with url query params
  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
    setSelectedCategory(searchParams.get('category') || '');
  }, [searchParams]);

  // Read local storage for logged in user or cart items count
  useEffect(() => {
    const checkAuthAndCart = () => {
      // Check user
      const savedUser = localStorage.getItem('conex_user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }

      // Check cart
      const cart = localStorage.getItem('conex_cart');
      if (cart) {
        try {
          const parsed = JSON.parse(cart);
          const totalItems = parsed.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
          setCartCount(totalItems);
        } catch {
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    };

    checkAuthAndCart();

    // Listen to custom event for dynamic cart updates
    window.addEventListener('cart-updated', checkAuthAndCart);
    window.addEventListener('auth-updated', checkAuthAndCart);
    
    return () => {
      window.removeEventListener('cart-updated', checkAuthAndCart);
      window.removeEventListener('auth-updated', checkAuthAndCart);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    
    router.push(`/?${params.toString()}`);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (category) params.set('category', category);
    
    router.push(`/?${params.toString()}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('conex_token');
    localStorage.removeItem('conex_user');
    setUser(null);
    window.dispatchEvent(new Event('auth-updated'));
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-primary">
              CONEX<span className="text-foreground">.in</span>
            </span>
            <span className="text-[10px] text-muted tracking-wider uppercase font-medium leading-none">
              Cable & NDT Shop
            </span>
          </Link>
        </div>

        {/* Search Bar - Center */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-lg mx-8 relative items-center">
          <div className="flex w-full items-center rounded-lg border border-border bg-muted-background overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="h-9 pl-3 pr-2 text-xs font-medium bg-transparent border-r border-border text-muted focus:outline-none cursor-pointer"
            >
              <option value="">All Categories</option>
              <option value="Ultrasonic Testing">Ultrasonic Testing</option>
              <option value="Cables & Accessories">Cables & Accessories</option>
              <option value="Magnetic Particle">Magnetic Particle</option>
              <option value="Chemicals">Chemicals</option>
            </select>
            
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search by name, SKU, or specs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 px-3 text-sm bg-transparent focus:outline-none text-foreground"
            />

            {/* Search Button */}
            <button type="submit" className="h-9 px-4 text-muted hover:text-primary transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>

        {/* Action Items - Right */}
        <div className="flex items-center gap-4">
          
          {/* Guest Quote Lookup */}
          <Link 
            href="/lookup" 
            className="hidden sm:inline-flex items-center text-xs font-medium text-muted hover:text-foreground transition-colors"
          >
            <span className="mr-1">Track Guest Quote</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </Link>

          {/* Cart Indicator */}
          <Link href="/cart" className="relative p-2 text-foreground hover:text-primary transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white ring-2 ring-background animate-pulse">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Authentication Badge */}
          {user ? (
            <div className="flex items-center gap-3">
              <Link 
                href="/dashboard" 
                className="hidden lg:flex flex-col text-right cursor-pointer group"
              >
                <span className="text-xs font-semibold group-hover:text-primary transition-colors">{user.name}</span>
                <span className="text-[10px] text-muted leading-none">Customer Portal</span>
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted-background transition-all"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-hover shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              Sign In
            </Link>
          )}

        </div>
      </div>

      {/* Mobile Search Row */}
      <div className="md:hidden border-t border-border px-4 py-2 bg-muted-background">
        <form onSubmit={handleSearchSubmit} className="flex relative items-center">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 px-3 text-xs bg-background border border-border rounded-md focus:outline-none focus:border-primary text-foreground"
          />
          <button type="submit" className="absolute right-2 text-muted">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>
      </div>
    </header>
  );
}
