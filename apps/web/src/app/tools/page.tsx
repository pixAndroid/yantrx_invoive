'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import Link from 'next/link';
import {
  FileText, Users, ShoppingCart, Building2, UtensilsCrossed,
  Car, MapPin, BarChart3, Briefcase, Settings, ArrowRight, Zap,
  Search, Star, Wrench, ExternalLink, Code2, Clock, X, Filter,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

interface CMSTool {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  logoUrl: string | null;
  category: string | null;
  toolType: string;
  featured: boolean;
  pricingType: string;
  ctaText: string | null;
  ctaUrl: string | null;
  viewCount: number;
  sortOrder: number;
}

const FALLBACK_PRODUCTS = [
  { icon: FileText, title: 'GST Invoice Tool', description: 'Professional GST billing, invoicing, and compliance. Auto-calculate CGST, SGST, IGST. Generate GSTR-1 and GSTR-3B reports. Built for Indian businesses.', href: '/tools/gst-invoice', badge: 'Live', color: 'bg-indigo-50 text-indigo-600', badgeColor: 'bg-indigo-100 text-indigo-700' },
  { icon: Users, title: 'Attendance System', description: 'Biometric and digital attendance tracking for teams. Real-time reports, leave management, and payroll integration.', href: '/contact', badge: 'Coming Soon', color: 'bg-green-50 text-green-600', badgeColor: 'bg-green-100 text-green-700' },
  { icon: ShoppingCart, title: 'Ecommerce Platform', description: 'Full-featured online store with payments, inventory management, and order tracking. Launch your store in days.', href: '/contact', badge: 'Coming Soon', color: 'bg-amber-50 text-amber-600', badgeColor: 'bg-amber-100 text-amber-700' },
  { icon: Building2, title: 'Hotel Booking System', description: 'Property management and room booking for hospitality businesses. Online reservations, housekeeping, and billing.', href: '/contact', badge: 'Coming Soon', color: 'bg-blue-50 text-blue-600', badgeColor: 'bg-blue-100 text-blue-700' },
  { icon: UtensilsCrossed, title: 'Restaurant POS', description: 'Order management and billing for restaurants and F&B businesses. Table management, kitchen display, and GST billing.', href: '/contact', badge: 'Coming Soon', color: 'bg-rose-50 text-rose-600', badgeColor: 'bg-rose-100 text-rose-700' },
  { icon: Car, title: 'Taxi Booking App', description: 'Driver and ride management platform. Passenger app, driver app, and admin dashboard with real-time tracking.', href: '/contact', badge: 'Coming Soon', color: 'bg-purple-50 text-purple-600', badgeColor: 'bg-purple-100 text-purple-700' },
  { icon: MapPin, title: 'GPS Fleet Tracking', description: 'Real-time fleet tracking and route optimization for logistics businesses. Live map, trip history, and fuel monitoring.', href: '/contact', badge: 'Coming Soon', color: 'bg-cyan-50 text-cyan-600', badgeColor: 'bg-cyan-100 text-cyan-700' },
  { icon: BarChart3, title: 'CRM', description: 'Manage leads, customers, and sales pipelines. Track deals, send follow-ups, and measure conversion.', href: '/contact', badge: 'Coming Soon', color: 'bg-orange-50 text-orange-600', badgeColor: 'bg-orange-100 text-orange-700' },
  { icon: Briefcase, title: 'HRMS', description: 'HR, payroll, and employee lifecycle management. Onboarding, leaves, appraisals, and salary processing.', href: '/contact', badge: 'Coming Soon', color: 'bg-pink-50 text-pink-600', badgeColor: 'bg-pink-100 text-pink-700' },
  { icon: Settings, title: 'Custom ERP', description: 'Tailored enterprise resource planning systems built for your specific workflow and industry requirements.', href: '/services', badge: 'Custom Build', color: 'bg-violet-50 text-violet-600', badgeColor: 'bg-violet-100 text-violet-700' },
];


const CATEGORY_COLORS = ['text-indigo-600','text-emerald-600','text-amber-600','text-blue-600','text-rose-600','text-purple-600','text-cyan-600','text-orange-600','text-pink-600','text-violet-600'];
const ICON_GRADIENTS = [
  'linear-gradient(135deg,#eef2ff 0%,#c7d2fe 100%)',
  'linear-gradient(135deg,#f0fdf4 0%,#bbf7d0 100%)',
  'linear-gradient(135deg,#fffbeb 0%,#fde68a 100%)',
  'linear-gradient(135deg,#eff6ff 0%,#bfdbfe 100%)',
  'linear-gradient(135deg,#fff1f2 0%,#fecdd3 100%)',
  'linear-gradient(135deg,#faf5ff 0%,#e9d5ff 100%)',
  'linear-gradient(135deg,#ecfeff 0%,#a5f3fc 100%)',
  'linear-gradient(135deg,#fff7ed 0%,#fed7aa 100%)',
  'linear-gradient(135deg,#fdf2f8 0%,#fbcfe8 100%)',
  'linear-gradient(135deg,#f5f3ff 0%,#ddd6fe 100%)',
];
const CARD_GRADIENTS = [
  'linear-gradient(135deg,#ffffff 0%,#f8f7ff 100%)',
  'linear-gradient(135deg,#ffffff 0%,#f5f8ff 100%)',
  'linear-gradient(135deg,#ffffff 0%,#f7fff9 100%)',
  'linear-gradient(135deg,#ffffff 0%,#f5f8ff 100%)',
  'linear-gradient(135deg,#ffffff 0%,#fff7f8 100%)',
  'linear-gradient(135deg,#ffffff 0%,#faf5ff 100%)',
  'linear-gradient(135deg,#ffffff 0%,#f0fdff 100%)',
  'linear-gradient(135deg,#ffffff 0%,#fff8f0 100%)',
  'linear-gradient(135deg,#ffffff 0%,#fff5fb 100%)',
  'linear-gradient(135deg,#ffffff 0%,#f5f3ff 100%)',
];
function getColorForIndex(idx: number) { return CATEGORY_COLORS[idx % CATEGORY_COLORS.length]; }
function getIconGradient(idx: number) { return ICON_GRADIENTS[idx % ICON_GRADIENTS.length]; }
function getCardGradient(idx: number) { return CARD_GRADIENTS[idx % CARD_GRADIENTS.length]; }

function getFallbackBadgeClass(badgeColor: string): string {
  if (badgeColor.includes('green')) return 'border-emerald-200/80 text-emerald-700';
  if (badgeColor.includes('indigo')) return 'border-indigo-200/80 text-indigo-700';
  if (badgeColor.includes('violet')) return 'border-violet-200/80 text-violet-700';
  return 'border-gray-200/80 text-gray-500';
}
function getFallbackBadgeStyle(badgeColor: string): React.CSSProperties {
  if (badgeColor.includes('green')) return { background: 'linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' };
  if (badgeColor.includes('indigo')) return { background: 'linear-gradient(135deg,#eef2ff 0%,#e0e7ff 100%)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' };
  if (badgeColor.includes('violet')) return { background: 'linear-gradient(135deg,#f5f3ff 0%,#ede9fe 100%)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' };
  return { background: '#f9fafb' };
}

function getToolHref(tool: CMSTool): string {
  if (tool.ctaUrl) return tool.ctaUrl;
  if (tool.toolType === 'COMING_SOON') return '/contact';
  return `/tools/${tool.slug}`;
}

export default function ToolsPage() {
  const [cmsTools, setCmsTools] = useState<CMSTool[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [useFallback, setUseFallback] = useState(false);

  const fetchTools = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (search) params.set('search', search);
      if (activeCategory) params.set('category', activeCategory);
      const res = await fetch(`${API_URL}/tools?${params}`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const sorted = [...data.data].sort((a: CMSTool, b: CMSTool) => {
          const orderDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
          return orderDiff !== 0 ? orderDiff : a.id.localeCompare(b.id);
        });
        setCmsTools(sorted);
        if (sorted.length === 0 && !search && !activeCategory) {
          setUseFallback(true);
        } else {
          setUseFallback(false);
        }
      }
    } catch {
      setUseFallback(true);
    } finally {
      setLoading(false);
    }
  }, [search, activeCategory]);

  useEffect(() => {
    fetch(`${API_URL}/tools/categories`)
      .then(r => r.json())
      .then(d => { if (d.success) setCategories(d.data); })
      .catch(() => {});
  }, []);

  useEffect(() => { fetchTools(); }, [fetchTools]);

  const featuredTools = cmsTools.filter(t => t.featured);

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="container-wide text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 mb-6">
            <Zap className="h-3.5 w-3.5" />
            Products &amp; Tools
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            All Products &amp;
            <span className="block gradient-text">Business Tools</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed mb-8">
            Browse our ready-to-deploy business software solutions.
            From invoicing to booking platforms — built for India.
          </p>
          {!useFallback && (
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tools..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-gray-200 bg-white shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Category filters */}
      {!useFallback && categories.length > 0 && (
        <section className="py-4 border-b border-gray-100 bg-white sticky top-0 z-10 shadow-sm">
          <div className="container-wide">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <button onClick={() => setActiveCategory('')} className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${!activeCategory ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All Tools</button>
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(activeCategory === cat ? '' : cat)} className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${activeCategory === cat ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{cat}</button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured tools */}
      {!useFallback && !loading && featuredTools.length > 0 && !search && !activeCategory && (
        <section className="py-16 bg-gradient-to-br from-indigo-900 to-gray-900">
          <div className="container-wide">
            <div className="flex items-center gap-3 mb-8">
              <Star className="h-5 w-5 text-yellow-400 fill-current" />
              <h2 className="text-2xl font-bold text-white">Featured Tools</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredTools.map(tool => (
                <Link key={tool.id} href={getToolHref(tool)} className="group bg-white/10 backdrop-blur rounded-2xl border border-white/10 p-6 hover:bg-white/15 transition-all flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {tool.logoUrl ? <img src={tool.logoUrl} alt={tool.title} className="h-full w-full object-cover" /> : <Wrench className="h-6 w-6 text-white" />}
                    </div>
                    <span className="bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 text-xs font-semibold px-2.5 py-0.5 rounded-full">★ Featured</span>
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{tool.title}</h3>
                  <p className="text-indigo-200 text-sm leading-relaxed flex-1 mb-5">{tool.shortDescription || ''}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-300 group-hover:gap-2.5 transition-all">
                    {tool.ctaText || 'Launch Tool'} <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All CMS Tools */}
      {!useFallback && (
        <section className="py-20">
          <div className="container-wide">
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                    <div className="flex items-start justify-between mb-4"><div className="h-12 w-12 rounded-xl bg-gray-100" /><div className="h-5 w-20 rounded-full bg-gray-100" /></div>
                    <div className="h-4 w-3/4 rounded bg-gray-100 mb-2" /><div className="h-3 w-full rounded bg-gray-100 mb-1" /><div className="h-3 w-5/6 rounded bg-gray-100 mb-5" /><div className="h-3.5 w-24 rounded bg-gray-100" />
                  </div>
                ))}
              </div>
            ) : cmsTools.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex h-16 w-16 rounded-2xl bg-gray-100 items-center justify-center mb-4"><Search className="h-8 w-8 text-gray-400" /></div>
                <p className="text-gray-600 font-medium mb-2">No tools found</p>
                <p className="text-gray-400 text-sm">{search ? `No results for "${search}"` : 'Check back soon.'}</p>
                {search && <button onClick={() => setSearch('')} className="mt-4 text-indigo-600 text-sm font-medium hover:underline">Clear search</button>}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {cmsTools.map((tool, idx) => (
                  <div
                    key={tool.id}
                    className="group relative flex flex-col rounded-2xl border border-gray-100/80 p-6 overflow-hidden transition-all duration-[220ms] ease-out hover:-translate-y-1.5 hover:shadow-xl hover:border-indigo-100/80"
                    style={{ background: getCardGradient(idx), boxShadow: '0 1px 4px 0 rgb(0 0 0/0.06),0 1px 2px -1px rgb(0 0 0/0.04)' }}
                  >
                    {/* Top highlight line */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-200/50 to-transparent" />
                    {/* Corner radial glow */}
                    <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-[220ms]" style={{ background: 'radial-gradient(circle,rgba(99,102,241,0.10) 0%,transparent 70%)' }} />

                    {/* Header: icon + badges */}
                    <div className="flex items-start justify-between mb-5">
                      <div
                        className={`relative inline-flex h-12 w-12 items-center justify-center rounded-xl overflow-hidden flex-shrink-0 transition-transform duration-[220ms] group-hover:scale-105 ${getColorForIndex(idx)}`}
                        style={{ background: getIconGradient(idx), boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.07),0 1px 3px rgba(0,0,0,0.06)' }}
                      >
                        {tool.logoUrl ? <img src={tool.logoUrl} alt={tool.title} className="h-full w-full object-cover" /> : <Wrench className="h-5 w-5" />}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {tool.featured && (
                          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-200/80 text-amber-600" style={{ background: 'linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>★ Featured</span>
                        )}
                        <span
                          className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border ${
                            tool.toolType === 'COMING_SOON'
                              ? 'bg-gray-50 border-gray-200/80 text-gray-500'
                              : tool.pricingType === 'FREE'
                              ? 'border-emerald-200/80 text-emerald-700'
                              : 'border-indigo-200/80 text-indigo-700'
                          }`}
                          style={
                            tool.toolType !== 'COMING_SOON'
                              ? tool.pricingType === 'FREE'
                                ? { background: 'linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }
                                : { background: 'linear-gradient(135deg,#eef2ff 0%,#e0e7ff 100%)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }
                              : {}
                          }
                        >
                          {tool.toolType === 'COMING_SOON' ? 'Coming Soon' : tool.pricingType}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-[18px] font-bold text-gray-900 mb-2 leading-snug tracking-tight">{tool.title}</h3>
                    {/* Subtitle */}
                    <p className="text-gray-500 text-[13.5px] leading-relaxed flex-1 mb-5">{tool.shortDescription || ''}</p>

                    {/* CTA */}
                    <Link
                      href={getToolHref(tool)}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors duration-[220ms]"
                    >
                      {tool.toolType === 'COMING_SOON' ? 'Get Notified' : (tool.ctaText || 'Launch Tool')}
                      <ArrowRight className="h-4 w-4 transition-transform duration-[220ms] group-hover:translate-x-1" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Fallback static grid */}
      {useFallback && (
        <section className="py-20">
          <div className="container-wide">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {FALLBACK_PRODUCTS.map((product, idx) => (
                <div
                  key={product.title}
                  className="group relative flex flex-col rounded-2xl border border-gray-100/80 p-6 overflow-hidden transition-all duration-[220ms] ease-out hover:-translate-y-1.5 hover:shadow-xl hover:border-indigo-100/80"
                  style={{ background: getCardGradient(idx), boxShadow: '0 1px 4px 0 rgb(0 0 0/0.06),0 1px 2px -1px rgb(0 0 0/0.04)' }}
                >
                  {/* Top highlight line */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-200/50 to-transparent" />
                  {/* Corner radial glow */}
                  <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-[220ms]" style={{ background: 'radial-gradient(circle,rgba(99,102,241,0.10) 0%,transparent 70%)' }} />

                  {/* Header: icon + badge */}
                  <div className="flex items-start justify-between mb-5">
                    <div
                      className={`relative inline-flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0 transition-transform duration-[220ms] group-hover:scale-105 ${product.color}`}
                      style={{ background: getIconGradient(idx), boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.07),0 1px 3px rgba(0,0,0,0.06)' }}
                    >
                      <product.icon className="h-5 w-5" />
                    </div>
                    <span
                      className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border ${getFallbackBadgeClass(product.badgeColor)}`}
                      style={getFallbackBadgeStyle(product.badgeColor)}
                    >
                      {product.badge}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-[18px] font-bold text-gray-900 mb-2 leading-snug tracking-tight">{product.title}</h3>
                  {/* Subtitle */}
                  <p className="text-gray-500 text-[13.5px] leading-relaxed flex-1 mb-5">{product.description}</p>

                  {/* CTA */}
                  <Link
                    href={product.href}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors duration-[220ms]"
                  >
                    {product.badge === 'Live' ? 'View Product' : product.badge === 'Custom Build' ? 'Build Custom' : 'Get Notified'}
                    <ArrowRight className="h-4 w-4 transition-transform duration-[220ms] group-hover:translate-x-1" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-purple-700 text-center">
        <div className="container-wide max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">Don&apos;t see what you need?</h2>
          <p className="text-indigo-200 mb-8 text-lg">We build custom software for any business requirement. Tell us what you need.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-indigo-600 hover:bg-indigo-50 transition-all shadow-lg">Start a Project<ArrowRight className="h-4 w-4" /></Link>
            <Link href="/services" className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-400 px-8 py-4 text-base font-semibold text-white hover:bg-indigo-500/20 transition-all">View Services</Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
