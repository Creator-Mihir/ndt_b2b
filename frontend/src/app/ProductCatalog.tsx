'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, IProduct } from '../lib/api';

export default function ProductCatalog() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';

  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);
      try {
        const response = await api.getProducts({ search, category });
        if (response.status === 'success') {
          setProducts(response.data.products);
        } else {
          setError('Failed to retrieve products catalog.');
        }
      } catch (err: any) {
        setError(err.message || 'Error connecting to the backend services.');
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [search, category]);

  const handleClearFilters = () => {
    router.push('/');
  };

  const handleCategoryQuickFilter = (cat: string) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (cat) params.set('category', cat);
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="flex flex-col flex-1 pb-16">
      
      {/* Hero section */}
      {!search && !category && (
        <section className="relative overflow-hidden bg-slate-900 py-20 text-white dark:bg-black border-b border-border">
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>
          
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-2xl flex flex-col gap-6">
              <span className="inline-flex max-w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/20">
                ⚡ Certified B2B Partner Portal
              </span>
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:leading-tight">
                High-Performance Cables & <br />
                <span className="text-primary">Non-Destructive Testing</span> Gear
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Connect directly with manufacturers. Instantly calculate GST, download technical spec sheets, request custom volume pricing, and track dispatch orders online.
              </p>
              
              <div className="flex flex-wrap gap-4 mt-2 justify-center sm:justify-start">
                <button 
                  onClick={() => handleCategoryQuickFilter('Ultrasonic Testing')} 
                  className="rounded-lg bg-primary px-5 py-2.5 text-xs font-bold text-white hover:bg-primary-hover shadow-lg transition-all"
                >
                  Explore NDT Systems
                </button>
                <button 
                  onClick={() => handleCategoryQuickFilter('Cables & Accessories')}
                  className="rounded-lg border border-slate-700 bg-slate-800/80 px-5 py-2.5 text-xs font-bold hover:bg-slate-700 transition-all text-white"
                >
                  Custom Cables & Adaptors
                </button>
              </div>
            </div>

            <div className="relative hidden lg:block w-96 h-64 bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
              {/* Mock premium screen representation */}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-transparent"></div>
              <div className="p-6 flex flex-col h-full justify-between">
                <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                  <span className="text-xs font-mono text-slate-400">GST AUTOMATION</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                  <div className="h-8 bg-primary/20 rounded w-full flex items-center justify-between px-3 text-2xs font-mono text-primary border border-primary/20 mt-2">
                    <span>IGST (Interstate Order)</span>
                    <span className="font-bold">18% Auto Calc</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-6 bg-slate-700 rounded-md w-1/3"></div>
                  <div className="h-6 bg-slate-700 rounded-md w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Catalog View */}
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Section Title / Filter Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6 mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
              {category ? `${category}` : search ? `Search Results` : 'Browse Catalog'}
            </h2>
            <p className="text-xs text-muted mt-1">
              {search ? `Displaying products matching "${search}"` : 'All prices exclusive of GST. Corporate pricing applied automatically.'}
            </p>
          </div>

          {(category || search) && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover border border-primary/20 rounded-lg px-3 py-1.5 hover:bg-primary/5 transition-all cursor-pointer"
            >
              <span>Clear Filter</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Load States */}
        {loading ? (
          <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="flex flex-col gap-4 animate-pulse">
                <div className="h-48 w-full bg-muted rounded-xl"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-muted-background">
            <svg className="mx-auto h-12 w-12 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="mt-4 text-sm font-semibold text-foreground">Catalog Unavailable</h3>
            <p className="mt-2 text-xs text-muted">{error}</p>
            <button
              onClick={() => router.refresh()}
              className="mt-4 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-hover shadow-sm transition-all"
            >
              Retry Connection
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-muted-background">
            <svg className="mx-auto h-12 w-12 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-sm font-semibold text-foreground">No Products Found</h3>
            <p className="mt-2 text-xs text-muted">Try adjusting your filters or searching for another keyword.</p>
            <button
              onClick={handleClearFilters}
              className="mt-4 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-hover shadow-sm transition-all"
            >
              Reset Search
            </button>
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <div 
                key={product._id} 
                className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-card-border bg-card shadow-sm hover:shadow-lg transition-all duration-300"
              >
                
                {/* Product Image Wrapper */}
                <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-slate-100 group-hover:opacity-95 transition-opacity h-48 relative">
                  {/* Category Badge */}
                  <span className="absolute top-2 left-2 z-10 inline-flex items-center rounded-md bg-slate-900/80 px-2 py-1 text-3xs font-semibold text-slate-100 backdrop-blur-xs">
                    {product.category}
                  </span>
                  
                  {/* Stock Indicator */}
                  {product.stock <= 30 && product.stock > 0 ? (
                    <span className="absolute top-2 right-2 z-10 inline-flex items-center rounded-md bg-amber-500/95 px-2 py-1 text-3xs font-semibold text-white animate-pulse">
                      Low Stock
                    </span>
                  ) : product.stock === 0 ? (
                    <span className="absolute top-2 right-2 z-10 inline-flex items-center rounded-md bg-rose-500/95 px-2 py-1 text-3xs font-semibold text-white">
                      Out Of Stock
                    </span>
                  ) : null}

                  <img
                    src={product.images && product.images[0] ? product.images[0] : '/placeholder.png'}
                    alt={product.name}
                    className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-grow justify-between gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-mono text-muted tracking-wider uppercase font-semibold">
                      SKU: {product.sku}
                    </span>
                    <h3 className="text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                      <Link href={`/product/${product.slug}`}>
                        <span aria-hidden="true" className="absolute inset-0"></span>
                        {product.name}
                      </Link>
                    </h3>
                    <p className="text-2xs text-muted line-clamp-2 mt-1 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="mt-2 border-t border-border pt-3 flex flex-col gap-2">
                    
                    {/* Tiered Price Matrix Preview */}
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xs text-muted font-medium">B2B Base Price</span>
                      <span className="text-sm font-extrabold text-foreground">
                        ₹{product.basePrice.toLocaleString('en-IN')}
                        {product.category === 'Cables & Accessories' && product.sku.includes('11KV') ? ' /m' : ''}
                      </span>
                    </div>

                    <div className="bg-muted-background p-2 rounded-lg text-3xs border border-border flex justify-between items-center">
                      <span className="text-muted">Bulk Tier Pricing</span>
                      <span className="font-semibold text-primary">
                        From ₹{product.tieredPrices.tier_3.toLocaleString('en-IN')}
                      </span>
                    </div>

                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
