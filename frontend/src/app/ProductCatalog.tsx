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

  // Quote Form State variables
  const [quoteName, setQuoteName] = useState('');
  const [quoteCompany, setQuoteCompany] = useState('');
  const [quoteEmail, setQuoteEmail] = useState('');
  const [quoteMethod, setQuoteMethod] = useState('');
  const [quoteMessage, setQuoteMessage] = useState('');
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

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
      
      {/* ═══════════════════════ HERO ═══════════════════════ */}
      {!search && !category && (
        <section className="relative overflow-hidden bg-slate-955 py-20 text-white border-b border-border font-dmsans">
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35"></div>
          
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-12 z-10">
            <div className="max-w-2xl flex flex-col gap-6 text-center lg:text-left items-center lg:items-start">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1 text-xs font-medium text-primary font-rajdhani uppercase tracking-wider">
                <span className="h-2.5 w-2.5 rounded-full bg-primary animate-ping"></span>
                India's Premier NDT Consumables Store
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl md:leading-tight font-rajdhani uppercase">
                YOUR TRUSTED<br />NDT <em className="text-primary not-italic font-semibold">SUPPLY</em><br />PARTNER
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                Ultrasonic couplants, dye penetrant kits, magnetic inks, IQI wire sets & more — sourced from certified manufacturers, delivered pan-India.
              </p>
              <div className="flex flex-wrap gap-4 mt-2 justify-center lg:justify-start">
                <button
                  onClick={() => {
                    const catalogElement = document.getElementById('catalog-section');
                    if (catalogElement) {
                      catalogElement.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="rounded-lg bg-primary px-6 py-3 text-xs font-bold text-white hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all flex items-center gap-2 cursor-pointer font-rajdhani uppercase tracking-wider"
                >
                  Shop All Products <i className="ti ti-arrow-right text-sm"></i>
                </button>
                <button
                  onClick={() => {
                    const quoteElement = document.getElementById('quote-section');
                    if (quoteElement) {
                      quoteElement.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="rounded-lg border border-slate-700 bg-slate-900/60 px-6 py-3 text-xs font-bold hover:bg-slate-800 transition-all text-white cursor-pointer font-rajdhani uppercase tracking-wider"
                >
                  Get Bulk Quote
                </button>
              </div>
            </div>

            <div className="relative flex flex-col items-center gap-8 lg:mr-8">
              {/* Emblem */}
              <div className="relative w-72 h-72 rounded-full flex items-center justify-center bg-slate-900/50 border border-slate-800 shadow-2xl">
                {/* Emblem Outer Ring */}
                <div className="absolute inset-2 rounded-full border border-dashed border-primary/25 animate-[spin_40s_linear_infinite]"></div>
                {/* Emblem Mid Ring */}
                <div className="absolute inset-8 rounded-full border border-primary/20 animate-[spin_20s_linear_infinite] [animation-direction:reverse]"></div>
                {/* Emblem Core */}
                <div className="h-28 w-28 rounded-full bg-gradient-to-tr from-primary/25 to-primary/5 flex items-center justify-center border border-primary/40 shadow-inner backdrop-blur-xs">
                  <i className="ti ti-scan text-4xl text-primary animate-pulse"></i>
                </div>
              </div>
              
              {/* Stats Bar */}
              <div className="flex items-center gap-6 bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-xs font-rajdhani">
                <div className="text-center px-2">
                  <div className="text-2xl font-bold text-primary">500+</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Products</div>
                </div>
                <div className="h-8 w-px bg-slate-800"></div>
                <div className="text-center px-2">
                  <div className="text-2xl font-bold text-primary">ISO</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Certified</div>
                </div>
                <div className="h-8 w-px bg-slate-800"></div>
                <div className="text-center px-2">
                  <div className="text-2xl font-bold text-primary">PAN</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">India Ship</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════ TRUST BAR ═══════════════════════ */}
      <div className="bg-slate-900 border-b border-border py-4 font-rajdhani text-white select-none overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-y-4 gap-x-8 text-xs font-medium uppercase tracking-wider text-slate-300">
            <div className="flex items-center gap-2">
              <i className="ti ti-certificate text-primary text-base"></i>
              <span>ASME / ASTM / ISO Compliant</span>
            </div>
            <div className="hidden md:block text-slate-700 font-bold">·</div>
            <div className="flex items-center gap-2">
              <i className="ti ti-truck-delivery text-primary text-base"></i>
              <span>Same-day dispatch before 2 PM</span>
            </div>
            <div className="hidden md:block text-slate-700 font-bold">·</div>
            <div className="flex items-center gap-2">
              <i className="ti ti-shield-check text-primary text-base"></i>
              <span>Genuine OEM products only</span>
            </div>
            <div className="hidden md:block text-slate-700 font-bold">·</div>
            <div className="flex items-center gap-2">
              <i className="ti ti-headset text-primary text-base"></i>
              <span>Level-II certified support</span>
            </div>
            <div className="hidden md:block text-slate-700 font-bold">·</div>
            <div className="flex items-center gap-2">
              <i className="ti ti-package text-primary text-base"></i>
              <span>Bulk & project kit pricing</span>
            </div>
            <div className="hidden md:block text-slate-700 font-bold">·</div>
            <div className="flex items-center gap-2">
              <i className="ti ti-receipt-tax text-primary text-base"></i>
              <span>GST invoices for all orders</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════ CATEGORIES ═══════════════════════ */}
      {!search && !category && (
        <section className="py-20 border-b border-border bg-background font-dmsans">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-primary font-rajdhani">Browse by Method</span>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl mt-2 font-rajdhani uppercase">NDT Categories</h2>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { name: 'Ultrasonic Testing', count: '142 products', icon: 'ti-wave-sine', slug: 'Ultrasonic Testing' },
                { name: 'Radiographic Testing', count: '98 products', icon: 'ti-radioactive', slug: 'Radiographic Testing' },
                { name: 'Magnetic Particle', count: '76 products', icon: 'ti-magnet', slug: 'Magnetic Particle' },
                { name: 'Dye Penetrant', count: '65 products', icon: 'ti-droplet', slug: 'Chemicals' },
                { name: 'Visual Testing', count: '53 products', icon: 'ti-eye', slug: 'Visual Testing' },
                { name: 'Eddy Current', count: '89 products', icon: 'ti-activity', slug: 'Eddy Current' }
              ].map((cat, idx) => (
                <div
                  key={idx}
                  onClick={() => handleCategoryQuickFilter(cat.slug)}
                  className="group relative flex items-center justify-between p-6 rounded-xl border border-card-border bg-card shadow-xs hover:shadow-md hover:border-primary/50 hover:bg-muted-background/40 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-305">
                      <i className={`ti ${cat.icon} text-2xl`}></i>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors font-rajdhani uppercase tracking-wider">{cat.name}</h3>
                      <p className="text-xs text-muted mt-0.5">{cat.count}</p>
                    </div>
                  </div>
                  <div className="text-muted group-hover:text-primary group-hover:translate-x-1 transition-all">
                    <i className="ti ti-arrow-right text-lg"></i>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════ FEATURED PRODUCTS ═══════════════════════ */}
      <section className="py-20 bg-muted-background/20 font-dmsans" id="catalog-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end md:justify-between border-b border-border pb-6 mb-8 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary font-rajdhani">Top Sellers</span>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl mt-2 font-rajdhani uppercase">
                {category ? `${category}` : search ? `Search Results` : 'Featured Products'}
              </h2>
              <p className="text-xs text-muted mt-1.5">
                {search ? `Displaying products matching "${search}"` : 'All prices exclusive of GST. Corporate pricing applied automatically.'}
              </p>
            </div>

            {/* Filter Tabs */}
            {!search && (
              <div className="flex flex-wrap gap-2 font-rajdhani uppercase tracking-wider text-xs">
                {[
                  { label: 'All', value: '' },
                  { label: 'Ultrasonic', value: 'Ultrasonic Testing' },
                  { label: 'Cables & Accessories', value: 'Cables & Accessories' },
                  { label: 'Magnetic Particle', value: 'Magnetic Particle' },
                  { label: 'Chemicals', value: 'Chemicals' }
                ].map((tab, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCategoryQuickFilter(tab.value)}
                    className={`rounded-lg px-4 py-2 font-bold transition-all border cursor-pointer ${
                      category === tab.value
                        ? 'bg-primary text-white border-primary shadow-md shadow-primary/10'
                        : 'bg-card border-card-border text-muted hover:border-primary/45 hover:text-primary'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {(category || search) && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover border border-primary/20 rounded-lg px-3 py-1.5 hover:bg-primary/5 transition-all cursor-pointer uppercase tracking-wider font-rajdhani"
              >
                <span>Clear Filter</span>
                <i className="ti ti-x text-sm"></i>
              </button>
            )}
          </div>

          {/* Load States */}
          {loading ? (
            <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="flex flex-col gap-4 animate-pulse bg-card border border-card-border p-4 rounded-xl">
                  <div className="h-44 w-full bg-muted rounded-lg"></div>
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card">
              <i className="ti ti-alert-triangle text-4xl text-amber-500 animate-bounce"></i>
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
            <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card">
              <i className="ti ti-mood-empty text-4xl text-muted"></i>
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
              {products.map((product) => {
                // Add to cart helper function
                const handleAddToCart = (e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // Read current cart
                  const savedCart = localStorage.getItem('conex_cart');
                  let cartList = [];
                  if (savedCart) {
                    try {
                      cartList = JSON.parse(savedCart);
                    } catch {
                      cartList = [];
                    }
                  }
                  
                  // Check if product is in cart
                  const existingItem = cartList.find((item: any) => item.product._id === product._id);
                  if (existingItem) {
                    existingItem.quantity += 1;
                  } else {
                    cartList.push({
                      product: product,
                      quantity: 1
                    });
                  }
                  
                  localStorage.setItem('conex_cart', JSON.stringify(cartList));
                  // Trigger update events
                  window.dispatchEvent(new Event('cart-updated'));
                };

                return (
                  <div 
                    key={product._id} 
                    className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-card-border bg-card shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  >
                    {/* Product Image Wrapper */}
                    <div className="aspect-w-16 aspect-h-10 w-full overflow-hidden bg-slate-900/5 dark:bg-slate-950/20 group-hover:opacity-95 transition-opacity h-48 relative border-b border-border">
                      {/* Category Badge */}
                      <span className="absolute top-2.5 left-2.5 z-10 inline-flex items-center rounded-md bg-slate-955/85 px-2 py-1 text-[10px] font-semibold text-slate-100 backdrop-blur-xs font-rajdhani uppercase tracking-wider border border-slate-850">
                        {product.category}
                      </span>
                      
                      {/* Stock Indicator */}
                      {product.stock <= 30 && product.stock > 0 ? (
                        <span className="absolute top-2.5 right-2.5 z-10 inline-flex items-center rounded-md bg-amber-500/90 px-2 py-1 text-[10px] font-semibold text-white animate-pulse">
                          Low Stock
                        </span>
                      ) : product.stock === 0 ? (
                        <span className="absolute top-2.5 right-2.5 z-10 inline-flex items-center rounded-md bg-rose-500/90 px-2 py-1 text-[10px] font-semibold text-white">
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
                    <div className="p-5 flex flex-col flex-grow justify-between gap-4 font-dmsans">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-mono text-muted tracking-wider uppercase font-bold">
                          SKU: {product.sku}
                        </span>
                        <h3 className="text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors font-rajdhani uppercase tracking-wide">
                          <Link href={`/product/${product.slug}`}>
                            <span aria-hidden="true" className="absolute inset-0"></span>
                            {product.name}
                          </Link>
                        </h3>
                        <p className="text-xs text-muted line-clamp-2 mt-1 leading-relaxed">
                          {product.description}
                        </p>
                      </div>

                      <div className="mt-2 border-t border-border pt-4 flex flex-col gap-3">
                        
                        {/* Price Row */}
                        <div className="flex items-baseline justify-between">
                          <span className="text-[10px] text-muted uppercase font-bold tracking-wider font-rajdhani">B2B Base Price</span>
                          <span className="text-base font-extrabold text-foreground font-rajdhani">
                            ₹{product.basePrice.toLocaleString('en-IN')}
                            {product.category === 'Cables & Accessories' && product.sku.includes('11KV') ? ' /m' : ''}
                          </span>
                        </div>

                        {/* Bulk Preview */}
                        <div className="bg-muted-background p-2.5 rounded-lg text-3xs border border-border flex justify-between items-center font-rajdhani">
                          <span className="text-muted uppercase font-bold tracking-wide">Bulk Tier Price</span>
                          <span className="font-bold text-primary text-2xs">
                            From ₹{product.tieredPrices.tier_3.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="relative z-20 mt-1">
                          <button
                            onClick={handleAddToCart}
                            disabled={product.stock === 0}
                            className={`w-full flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider font-rajdhani shadow-sm cursor-pointer transition-all ${
                              product.stock === 0 
                                ? 'bg-muted-background text-muted border border-border cursor-not-allowed'
                                : 'bg-primary text-white hover:bg-primary-hover shadow-primary/10 hover:shadow-md'
                            }`}
                          >
                            <i className="ti ti-plus"></i> Add to RFQ
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      </section>

      {/* ═══════════════════════ WHY CONEX ═══════════════════════ */}
      {!search && !category && (
        <section className="py-20 border-t border-b border-border bg-background font-dmsans" id="about">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-primary font-rajdhani">Why Choose Us</span>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl mt-2 font-rajdhani uppercase">The CONEX.in Promise</h2>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: 'Standards Compliant',
                  desc: 'All products meet ASME, ASTM, ISO, and EN standards — essential for certified NDT applications in oil & gas, aerospace, and power sectors.',
                  icon: 'ti-certificate'
                },
                {
                  title: 'Bulk Procurement',
                  desc: 'Volume pricing and standing orders tailored for MRO teams, third-party inspection companies, fabrication shops, and laboratories.',
                  icon: 'ti-package'
                },
                {
                  title: 'Fast Dispatch',
                  desc: 'Same-day dispatch on orders placed before 2 PM. Reliable pan-India delivery in 2–5 working days with full tracking support.',
                  icon: 'ti-truck-delivery'
                },
                {
                  title: 'Expert Support',
                  desc: 'Level-II certified engineers available to advise on consumable selection, calibration procedures, and standard compliance.',
                  icon: 'ti-headset'
                }
              ].map((why, idx) => (
                <div key={idx} className="flex flex-col p-6 rounded-xl border border-card-border bg-card shadow-xs hover:shadow-md hover:border-primary/35 transition-all">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-5 animate-pulse">
                    <i className={`ti ${why.icon} text-2xl`}></i>
                  </div>
                  <h3 className="text-lg font-bold text-foreground font-rajdhani uppercase tracking-wider mb-2">{why.title}</h3>
                  <p className="text-xs text-muted leading-relaxed">{why.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════ STANDARDS BANNER ═══════════════════════ */}
      {!search && !category && (
        <section className="py-16 bg-slate-950 border-b border-border text-white font-dmsans">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="max-w-xl text-center lg:text-left">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-500 font-rajdhani">Certified & Approved</span>
                <h2 className="text-3xl font-extrabold tracking-tight text-white mt-2 font-rajdhani uppercase">Industry Standards We Support</h2>
                <p className="text-xs text-slate-400 mt-2">Every consumable stocked at CONEX.in is verified against one or more of the following standards bodies.</p>
              </div>
              <div className="flex flex-wrap justify-center lg:justify-end gap-3 max-w-2xl font-rajdhani font-bold text-xs uppercase tracking-wider">
                {[
                  'ASME Sec V',
                  'ASTM E165',
                  'ASTM E709',
                  'ASTM E747',
                  'ISO 9712',
                  'EN 571-1',
                  'IS 3658',
                  'BS 6443'
                ].map((std, idx) => (
                  <span key={idx} className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-4 py-2 hover:border-primary/50 hover:text-white transition-all select-none">
                    {std}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════ QUOTE / CTA ═══════════════════════ */}
      <section className="py-20 bg-muted-background/30 font-dmsans" id="quote-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch bg-card border border-card-border rounded-2xl shadow-xl overflow-hidden">
            
            {/* Left side details */}
            <div className="lg:col-span-5 p-8 lg:p-12 bg-slate-950 text-white flex flex-col justify-between gap-12 relative">
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(2,132,199,0.05),transparent)] pointer-events-none"></div>
              <div className="flex flex-col gap-6 z-10">
                <span className="text-xs font-bold uppercase tracking-widest text-primary font-rajdhani">Get in Touch</span>
                <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl font-rajdhani uppercase leading-none">
                  Need a Custom<br /><span className="text-primary not-italic font-semibold">Quote?</span>
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
                  Project kits, bulk packs, or custom specs — our team responds within 24 hours with competitive pricing.
                </p>
              </div>

              <div className="flex flex-col gap-4 font-rajdhani font-medium text-sm tracking-wider uppercase z-10">
                <div className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors">
                  <i className="ti ti-mail text-primary text-lg"></i>
                  <span>sales@conex.in</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors">
                  <i className="ti ti-phone text-primary text-lg"></i>
                  <span>+91 98765 43210</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors">
                  <i className="ti ti-map-pin text-primary text-lg"></i>
                  <span>Mumbai, Maharashtra, India</span>
                </div>
              </div>
            </div>

            {/* Right side form */}
            <div className="lg:col-span-7 p-8 lg:p-12 flex flex-col justify-center">
              {quoteSubmitted ? (
                <div className="text-center py-8 px-4 flex flex-col items-center gap-4 animate-fade-in">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <i className="ti ti-circle-check text-4xl animate-bounce"></i>
                  </div>
                  <h3 className="text-xl font-bold font-rajdhani uppercase tracking-wide text-foreground">Quote Request Received!</h3>
                  <p className="text-xs text-muted max-w-md leading-relaxed">
                    Thank you, <strong className="text-foreground">{quoteName}</strong>. Your custom quote request for <strong className="text-foreground">{quoteMethod || 'NDT consumables'}</strong> has been submitted. Our Level-II support team will respond to <strong className="text-foreground">{quoteEmail}</strong> within 24 hours.
                  </p>
                  <button
                    onClick={() => {
                      setQuoteSubmitted(false);
                      setQuoteName('');
                      setQuoteCompany('');
                      setQuoteEmail('');
                      setQuoteMethod('');
                      setQuoteMessage('');
                    }}
                    className="mt-4 rounded-lg border border-border px-5 py-2 text-xs font-bold uppercase tracking-wider font-rajdhani text-muted hover:border-primary/50 hover:text-primary transition-all cursor-pointer bg-card hover:bg-muted-background"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              ) : (
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!quoteName || !quoteEmail) {
                      setQuoteError('Name and Email are required.');
                      return;
                    }
                    setQuoteError(null);
                    setQuoteLoading(true);
                    
                    // Simulate API lead call wait
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    
                    // Persist lead request details locally
                    const pendingQueries = JSON.parse(localStorage.getItem('conex_custom_quotes') || '[]');
                    pendingQueries.push({
                      name: quoteName,
                      company: quoteCompany,
                      email: quoteEmail,
                      method: quoteMethod,
                      message: quoteMessage,
                      timestamp: new Date().toISOString()
                    });
                    localStorage.setItem('conex_custom_quotes', JSON.stringify(pendingQueries));

                    setQuoteLoading(false);
                    setQuoteSubmitted(true);
                  }}
                  className="space-y-5"
                >
                  {quoteError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg text-xs font-medium flex items-center gap-2">
                      <i className="ti ti-alert-circle text-base"></i>
                      <span>{quoteError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-muted font-rajdhani">Your Name</label>
                      <input 
                        type="text" 
                        required
                        value={quoteName}
                        onChange={(e) => setQuoteName(e.target.value)}
                        placeholder="Ravi Sharma" 
                        className="rounded-lg border border-border bg-muted-background/40 px-4 h-10 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-muted font-rajdhani">Company Name</label>
                      <input 
                        type="text" 
                        value={quoteCompany}
                        onChange={(e) => setQuoteCompany(e.target.value)}
                        placeholder="Inspection Co. Pvt Ltd" 
                        className="rounded-lg border border-border bg-muted-background/40 px-4 h-10 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted font-rajdhani">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={quoteEmail}
                      onChange={(e) => setQuoteEmail(e.target.value)}
                      placeholder="ravi@company.com" 
                      className="rounded-lg border border-border bg-muted-background/40 px-4 h-10 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted font-rajdhani">NDT Method / Product Required</label>
                    <select 
                      value={quoteMethod}
                      onChange={(e) => setQuoteMethod(e.target.value)}
                      className="rounded-lg border border-border bg-muted-background/40 px-4 h-10 text-xs text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer"
                    >
                      <option value="">Select a category…</option>
                      <option value="Ultrasonic Testing">Ultrasonic Testing</option>
                      <option value="Radiographic Testing">Radiographic Testing</option>
                      <option value="Magnetic Particle Testing">Magnetic Particle Testing</option>
                      <option value="Dye Penetrant Testing">Dye Penetrant Testing</option>
                      <option value="Eddy Current Testing">Eddy Current Testing</option>
                      <option value="Visual Testing">Visual Testing</option>
                      <option value="Multiple / Mixed">Multiple / Mixed</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted font-rajdhani">Message / Specifications</label>
                    <textarea 
                      value={quoteMessage}
                      onChange={(e) => setQuoteMessage(e.target.value)}
                      placeholder="Describe the product, quantity, grade, or standard required…" 
                      className="rounded-lg border border-border bg-muted-background/40 p-4 h-24 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={quoteLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-hover h-11 text-xs font-bold uppercase tracking-widest font-rajdhani text-white shadow-md shadow-primary/10 hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {quoteLoading ? 'Sending...' : 'Send Quote Request'} <i className="ti ti-send"></i>
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
