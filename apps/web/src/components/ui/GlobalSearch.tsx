'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Users, Package, X, ArrowRight, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface InvoiceResult {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  customer: { name: string } | null;
}

interface CustomerResult {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface ProductResult {
  id: string;
  name: string;
  type: string;
  price: number;
  category: string | null;
}

interface SearchResults {
  invoices: InvoiceResult[];
  customers: CustomerResult[];
  products: ProductResult[];
}

const STATUS_COLOR: Record<string, string> = {
  PAID: 'bg-emerald-100 text-emerald-700',
  SENT: 'bg-blue-100 text-blue-700',
  OVERDUE: 'bg-red-100 text-red-700',
  DRAFT: 'bg-gray-100 text-gray-600',
  PARTIALLY_PAID: 'bg-amber-100 text-amber-700',
  CANCELLED: 'bg-red-100 text-red-500',
  SAVED: 'bg-violet-100 text-violet-700',
};

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ invoices: [], customers: [], products: [] });
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // All result items flattened for keyboard nav
  const allItems = [
    ...results.invoices.map(r => ({ type: 'invoice' as const, id: r.id, href: `/invoices/${r.id}` })),
    ...results.customers.map(r => ({ type: 'customer' as const, id: r.id, href: `/customers/${r.id}` })),
    ...results.products.map(r => ({ type: 'product' as const, id: r.id, href: `/products/${r.id}` })),
  ];

  // ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults({ invoices: [], customers: [], products: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [invRes, custRes, prodRes] = await Promise.allSettled([
        apiFetch<{ data: InvoiceResult[] }>(`/invoices?search=${encodeURIComponent(q)}&limit=5`),
        apiFetch<{ data: CustomerResult[] }>(`/customers?search=${encodeURIComponent(q)}&limit=5`),
        apiFetch<{ data: ProductResult[] }>(`/products?search=${encodeURIComponent(q)}&limit=5`),
      ]);
      setResults({
        invoices: invRes.status === 'fulfilled' ? (invRes.value?.data ?? []) : [],
        customers: custRes.status === 'fulfilled' ? (custRes.value?.data ?? []) : [],
        products: prodRes.status === 'fulfilled' ? (prodRes.value?.data ?? []) : [],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset active index whenever results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(t);
  }, [query, open, doSearch]);

  const navigate = (href: string) => {
    router.push(href);
    setOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIndex >= 0 && allItems[activeIndex]) {
      e.preventDefault();
      navigate(allItems[activeIndex].href);
    }
  };

  const hasResults =
    results.invoices.length > 0 || results.customers.length > 0 || results.products.length > 0;

  const totalResults = results.invoices.length + results.customers.length + results.products.length;

  let itemIndex = -1;

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md hidden sm:block">
      {/* Trigger input */}
      <div
        className={`relative cursor-pointer transition-all duration-150 ${open ? 'ring-2 ring-indigo-400 ring-offset-0 rounded-xl' : ''}`}
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
      >
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search invoices, customers, products…"
          className="w-full pl-10 pr-20 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-300 focus:bg-white transition-all duration-150 hover:border-gray-300 hover:bg-white"
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {query && (
            <button
              onClick={e => { e.stopPropagation(); setQuery(''); setResults({ invoices: [], customers: [], products: [] }); }}
              className="rounded p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 text-indigo-500 animate-spin" />
          ) : (
            <kbd className="hidden md:inline-flex items-center gap-0.5 rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-400 shadow-xs select-none">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-900/10 overflow-hidden"
          >
            {/* Header */}
            {query && (
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/70">
                <span className="text-xs text-gray-500 font-medium">
                  {loading ? 'Searching…' : hasResults ? `${totalResults} result${totalResults !== 1 ? 's' : ''} for "${query}"` : `No results for "${query}"`}
                </span>
                <kbd className="text-[10px] text-gray-400 font-medium">Esc to close</kbd>
              </div>
            )}

            {/* Empty / hint state */}
            {!query && (
              <div className="px-4 py-5 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50">
                  <Search className="h-5 w-5 text-indigo-400" />
                </div>
                <p className="text-sm font-medium text-gray-700">Search your workspace</p>
                <p className="mt-1 text-xs text-gray-400">Find invoices, customers, and products instantly</p>
                <div className="mt-3 flex items-center justify-center gap-3 text-[11px] text-gray-400">
                  <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> Invoices</span>
                  <span className="text-gray-200">•</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Customers</span>
                  <span className="text-gray-200">•</span>
                  <span className="flex items-center gap-1"><Package className="h-3 w-3" /> Products</span>
                </div>
              </div>
            )}

            {/* Loading skeleton */}
            {loading && query && (
              <div className="p-3 space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
                    <div className="h-8 w-8 rounded-lg bg-gray-100 animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-2/3 rounded bg-gray-100 animate-pulse" />
                      <div className="h-2.5 w-1/2 rounded bg-gray-100 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Results */}
            {!loading && query && (
              <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
                {/* Invoices */}
                {results.invoices.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
                      <FileText className="h-3.5 w-3.5 text-indigo-400" />
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Invoices</span>
                    </div>
                    {results.invoices.map(inv => {
                      itemIndex++;
                      const idx = itemIndex;
                      const isActive = activeIndex === idx;
                      return (
                        <button
                          key={inv.id}
                          onClick={() => navigate(`/invoices/${inv.id}`)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${isActive ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                        >
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${isActive ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                            <FileText className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-gray-500'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900 truncate">{inv.invoiceNumber}</span>
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLOR[inv.status] || 'bg-gray-100 text-gray-600'}`}>
                                {inv.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {inv.customer?.name || 'No customer'} · {formatINR(inv.total)}
                            </p>
                          </div>
                          <ArrowRight className={`h-3.5 w-3.5 flex-shrink-0 transition-opacity ${isActive ? 'opacity-100 text-indigo-400' : 'opacity-0'}`} />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Customers */}
                {results.customers.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
                      <Users className="h-3.5 w-3.5 text-violet-400" />
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Customers</span>
                    </div>
                    {results.customers.map(cust => {
                      itemIndex++;
                      const idx = itemIndex;
                      const isActive = activeIndex === idx;
                      const initials = cust.name.split(' ').filter((w: string) => w).map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
                      return (
                        <button
                          key={cust.id}
                          onClick={() => navigate(`/customers/${cust.id}`)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${isActive ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                        >
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 text-xs font-bold ${isActive ? 'bg-violet-100 text-violet-700' : 'bg-violet-50 text-violet-600'}`}>
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{cust.name}</p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{cust.email || cust.phone || 'No contact info'}</p>
                          </div>
                          <ArrowRight className={`h-3.5 w-3.5 flex-shrink-0 transition-opacity ${isActive ? 'opacity-100 text-indigo-400' : 'opacity-0'}`} />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Products */}
                {results.products.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
                      <Package className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Products</span>
                    </div>
                    {results.products.map(prod => {
                      itemIndex++;
                      const idx = itemIndex;
                      const isActive = activeIndex === idx;
                      return (
                        <button
                          key={prod.id}
                          onClick={() => navigate(`/products/${prod.id}`)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${isActive ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                        >
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${isActive ? 'bg-amber-100' : 'bg-amber-50'}`}>
                            <Package className={`h-4 w-4 ${isActive ? 'text-amber-600' : 'text-amber-500'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900 truncate">{prod.name}</span>
                              {prod.category && (
                                <span className="text-[10px] text-gray-400 bg-gray-100 rounded-full px-1.5 py-0.5 flex-shrink-0">{prod.category}</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{prod.type === 'service' ? 'Service' : 'Product'} · {formatINR(prod.price)}</p>
                          </div>
                          <ArrowRight className={`h-3.5 w-3.5 flex-shrink-0 transition-opacity ${isActive ? 'opacity-100 text-indigo-400' : 'opacity-0'}`} />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* No results */}
                {!hasResults && !loading && (
                  <div className="px-4 py-8 text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-600">No results found</p>
                    <p className="mt-1 text-xs text-gray-400">Try a different search term</p>
                  </div>
                )}
              </div>
            )}

            {/* Footer hint */}
            {hasResults && !loading && (
              <div className="flex items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/70 px-4 py-2">
                <div className="flex items-center gap-3 text-[11px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-gray-200 bg-white px-1 py-px text-[10px] shadow-xs">↑↓</kbd> navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-gray-200 bg-white px-1 py-px text-[10px] shadow-xs">↵</kbd> open
                  </span>
                </div>
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <kbd className="rounded border border-gray-200 bg-white px-1 py-px text-[10px] shadow-xs">Esc</kbd> close
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
