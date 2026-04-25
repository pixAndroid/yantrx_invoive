'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FileText, BarChart3, Shield, Zap, CheckCircle, Star,
  ArrowRight, IndianRupee, Users, TrendingUp,
  Menu, X, LayoutDashboard, ShoppingCart, Building2,
  UtensilsCrossed, Car, MapPin, Briefcase, Settings,
  Smartphone, Cloud, Bot, Repeat, Link2, Headphones, Wrench,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { isAuthenticated, getUserData, apiFetch, isSafeImageUrl } from '@/lib/api';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/tools', label: 'Tools' },
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

const PRODUCTS = [
  { icon: FileText, title: 'GST Invoice Tool', desc: 'Professional GST billing, invoicing and compliance in one place.', href: '/tools/gst-invoice', color: 'bg-indigo-50 text-indigo-600', border: 'hover:border-indigo-200' },
  { icon: Users, title: 'Attendance System', desc: 'Biometric and digital attendance tracking for teams.', href: '/tools', color: 'bg-green-50 text-green-600', border: 'hover:border-green-200' },
  { icon: ShoppingCart, title: 'Ecommerce Platform', desc: 'Full-featured online store with payments and inventory.', href: '/tools', color: 'bg-amber-50 text-amber-600', border: 'hover:border-amber-200' },
  { icon: Building2, title: 'Hotel Booking', desc: 'Property management and room booking for hospitality.', href: '/tools', color: 'bg-blue-50 text-blue-600', border: 'hover:border-blue-200' },
  { icon: UtensilsCrossed, title: 'Restaurant POS', desc: 'Order management and billing for F&B businesses.', href: '/tools', color: 'bg-rose-50 text-rose-600', border: 'hover:border-rose-200' },
  { icon: Car, title: 'Taxi Booking', desc: 'Driver and ride management platform.', href: '/tools', color: 'bg-purple-50 text-purple-600', border: 'hover:border-purple-200' },
  { icon: MapPin, title: 'GPS Tracking', desc: 'Real-time fleet tracking and route optimization.', href: '/tools', color: 'bg-cyan-50 text-cyan-600', border: 'hover:border-cyan-200' },
  { icon: BarChart3, title: 'CRM', desc: 'Manage leads, customers, and sales pipelines.', href: '/tools', color: 'bg-orange-50 text-orange-600', border: 'hover:border-orange-200' },
  { icon: Briefcase, title: 'HRMS', desc: 'HR, payroll, and employee lifecycle management.', href: '/tools', color: 'bg-pink-50 text-pink-600', border: 'hover:border-pink-200' },
  { icon: Settings, title: 'Custom ERP', desc: 'Tailored enterprise systems built for your workflow.', href: '/services', color: 'bg-violet-50 text-violet-600', border: 'hover:border-violet-200' },
];

const SERVICES = [
  { icon: Zap, title: 'Web Apps', desc: 'Fast, responsive web applications built to scale.' },
  { icon: Smartphone, title: 'Mobile Apps', desc: 'Native and cross-platform apps for iOS and Android.' },
  { icon: Cloud, title: 'SaaS Platforms', desc: 'Multi-tenant SaaS with billing, auth, and admin built in.' },
  { icon: LayoutDashboard, title: 'Admin Dashboards', desc: 'Data-rich dashboards for operations and analytics.' },
  { icon: Link2, title: 'API Integrations', desc: 'Connect your tools with third-party APIs and services.' },
  { icon: Bot, title: 'AI Tools', desc: 'Intelligent automation and AI-powered features.' },
  { icon: Repeat, title: 'Automation Systems', desc: 'Workflow automation to eliminate manual processes.' },
];

const WHY_US = [
  { icon: Zap, title: 'Fast Delivery', desc: 'Ship production-ready software in weeks, not months.', color: 'bg-indigo-50 text-indigo-600' },
  { icon: TrendingUp, title: 'Scalable Architecture', desc: 'Built to handle growth from 10 to 10 million users.', color: 'bg-green-50 text-green-600' },
  { icon: Star, title: 'Clean UI/UX', desc: 'Intuitive interfaces that users love from day one.', color: 'bg-amber-50 text-amber-600' },
  { icon: IndianRupee, title: 'SME-Friendly Pricing', desc: 'Enterprise-quality software at startup-friendly costs.', color: 'bg-blue-50 text-blue-600' },
  { icon: Shield, title: 'Enterprise Security', desc: 'Bank-grade security, GDPR-ready, and compliance-first.', color: 'bg-rose-50 text-rose-600' },
  { icon: Headphones, title: 'Ongoing Support', desc: 'Dedicated support and maintenance after launch.', color: 'bg-purple-50 text-purple-600' },
];

const TESTIMONIALS = [
  { name: 'Rajesh Sharma', business: 'Sharma Electronics, Mumbai', avatar: 'RS', quote: 'Yantrix Labs built our invoicing system. It transformed how we operate. Incredibly fast and professional team!' },
  { name: 'Priya Nair', business: 'Priya Boutique, Bengaluru', avatar: 'PN', quote: 'The custom ecommerce platform they built grew our online revenue 3x in just 6 months. Highly recommend!' },
  { name: 'Amit Patel', business: 'AP Logistics, Ahmedabad', avatar: 'AP', quote: 'Their GPS tracking system gave us real-time visibility across our entire fleet. Absolute game changer for us.' },
];

const PROCESS = [
  { emoji: '💡', title: 'Idea', desc: 'Understand your requirements' },
  { emoji: '🎨', title: 'Design', desc: 'UI/UX wireframes & prototypes' },
  { emoji: '⚙️', title: 'Develop', desc: 'Clean, scalable code' },
  { emoji: '🚀', title: 'Launch', desc: 'Deploy and go live' },
  { emoji: '🤝', title: 'Support', desc: 'Ongoing maintenance' },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

const CATEGORY_COLORS = ['bg-indigo-50 text-indigo-600','bg-green-50 text-green-600','bg-amber-50 text-amber-600','bg-blue-50 text-blue-600','bg-rose-50 text-rose-600','bg-purple-50 text-purple-600','bg-cyan-50 text-cyan-600','bg-orange-50 text-orange-600','bg-pink-50 text-pink-600','bg-violet-50 text-violet-600'];
const CATEGORY_BORDERS = ['hover:border-indigo-200','hover:border-green-200','hover:border-amber-200','hover:border-blue-200','hover:border-rose-200','hover:border-purple-200','hover:border-cyan-200','hover:border-orange-200','hover:border-pink-200','hover:border-violet-200'];
function getColorForIndex(idx: number) { return CATEGORY_COLORS[idx % CATEGORY_COLORS.length]; }
function getBorderForIndex(idx: number) { return CATEGORY_BORDERS[idx % CATEGORY_BORDERS.length]; }

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
}

function getCmsToolHref(tool: CMSTool): string {
  if (tool.ctaUrl) return tool.ctaUrl;
  if (tool.toolType === 'COMING_SOON') return '/contact';
  return `/tools/${tool.slug}`;
}

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [initials, setInitials] = useState('');
  const [businessLogo, setBusinessLogo] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [cmsTools, setCmsTools] = useState<CMSTool[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/tools?limit=12`)
      .then(r => r.json())
      .then(d => { if (d.success && Array.isArray(d.data) && d.data.length > 0) setCmsTools(d.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) return;
    setLoggedIn(true);
    const tokenData = getUserData();
    const displayName = tokenData.name || 'User';
    setInitials(displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2));

    apiFetch('/auth/me')
      .then((res: any) => {
        if (res.data?.user?.name) {
          const name = res.data.user.name;
          setInitials(name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2));
        }
        const biz = res.data?.memberships?.[0]?.business;
        if (biz?.logo && typeof biz.logo === 'string' && isSafeImageUrl(biz.logo)) {
          setBusinessLogo(biz.logo);
        }
        if (biz?.name) setBusinessName(biz.name);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Navbar ──────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="container-wide">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">Y</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Yantrix Labs</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map(link => (
                <Link key={link.href} href={link.href} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              {loggedIn ? (
                <>
                  <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 px-4 py-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link href="/dashboard" className="flex-shrink-0">
                    <div className="h-9 w-9 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ring-2 ring-indigo-200 hover:ring-indigo-400 transition-all">
                      {businessLogo ? (
                        <img src={businessLogo} alt={businessName || 'Business Logo'} className="h-full w-full object-contain" />
                      ) : (
                        <span className="text-white text-xs font-bold">{initials}</span>
                      )}
                    </div>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-gray-900 px-4 py-2">
                    Dashboard
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                  >
                    Get Started
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </>
              )}
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-2">
            {NAV_LINKS.map(link => (
              <Link key={link.href} href={link.href} className="block py-2 text-sm font-medium text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
            <div className="pt-2 space-y-2">
              {loggedIn ? (
                <Link href="/dashboard" className="flex items-center gap-2 py-2 text-sm font-medium text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                  <div className="h-7 w-7 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    {businessLogo ? (
                      <img src={businessLogo} alt={businessName || 'Business'} className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-white text-xs font-bold">{initials}</span>
                    )}
                  </div>
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/dashboard" className="block py-2 text-sm font-medium text-gray-700">Dashboard</Link>
                  <Link href="/contact" className="block rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white">Get Started</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ─── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-r from-indigo-400/15 to-purple-400/15 blur-3xl rounded-full pointer-events-none" />

        <div className="container-wide relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 mb-6">
              <Zap className="h-3.5 w-3.5" />
              Trusted by 500+ businesses across India
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight leading-[1.1] mb-6">
              We Build Tools That
              <span className="block gradient-text">Power Modern Businesses</span>
            </h1>

            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              From invoicing to booking platforms, tracking systems to SaaS products —
              we design software that helps companies grow faster.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                href="/tools"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-lg shadow-indigo-200"
              >
                Explore Tools
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-4 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                Start a Project
              </Link>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {[
                { value: '10+', label: 'Products Built' },
                { value: '500+', label: 'Businesses Served' },
                { value: '5+', label: 'Industries' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="bg-white/80 backdrop-blur rounded-2xl border border-gray-100 shadow-sm px-6 py-4 text-center"
                >
                  <p className="text-2xl font-bold text-indigo-600">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── TRUST STRIP ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-gray-50 border-y border-gray-100">
        <div className="container-wide text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-8">
            Built for businesses across every industry
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Retail', 'Logistics', 'Hospitality', 'Healthcare', 'Education', 'Local Business'].map(ind => (
              <span key={ind} className="rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-700 shadow-sm">
                {ind}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED PRODUCT ────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-indigo-900 to-gray-900">
        <div className="container-wide">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/40 bg-indigo-500/20 px-4 py-1.5 text-sm font-medium text-indigo-300 mb-6">
                <Star className="h-3.5 w-3.5" />
                Featured Product
              </span>
              <h2 className="text-4xl font-bold text-white mb-4">
                GST Invoice Tool — Billing Made Effortless
              </h2>
              <p className="text-indigo-200 text-lg leading-relaxed mb-8">
                Create GST-compliant invoices in seconds. Automate tax calculations, track payments,
                and generate returns with confidence. Built for Indian businesses.
              </p>
              <ul className="space-y-3 mb-10">
                {['Instant GST invoicing (CGST/SGST/IGST)', 'Auto tax calculations for all slabs', 'Payment tracking & reminders'].map(f => (
                  <li key={f} className="flex items-center gap-3 text-indigo-100">
                    <CheckCircle className="h-5 w-5 text-indigo-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/tools/gst-invoice"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-indigo-900 hover:bg-indigo-50 transition-all shadow-lg"
              >
                View GST Invoice Tool
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            {/* Decorative dashboard preview */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
            >
              <div className="flex items-center gap-1.5 mb-4">
                <div className="h-3 w-3 rounded-full bg-red-400/60" />
                <div className="h-3 w-3 rounded-full bg-yellow-400/60" />
                <div className="h-3 w-3 rounded-full bg-green-400/60" />
                <span className="ml-3 text-xs text-indigo-300/60">app.yantrixlab.com/dashboard</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {[
                  { label: 'Revenue', value: '₹4,82,500', color: 'from-indigo-500/30 to-purple-500/30' },
                  { label: 'Invoices', value: '247 sent', color: 'from-green-500/30 to-teal-500/30' },
                  { label: 'Customers', value: '89 active', color: 'from-blue-500/30 to-cyan-500/30' },
                  { label: 'Pending', value: '₹38,200', color: 'from-amber-500/30 to-orange-500/30' },
                ].map(s => (
                  <div key={s.label} className={`rounded-xl bg-gradient-to-br ${s.color} border border-white/10 p-3`}>
                    <p className="text-xs text-white/60 mb-1">{s.label}</p>
                    <p className="text-sm font-bold text-white">{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <p className="text-xs text-white/60 mb-3">Recent Invoices</p>
                <div className="space-y-2">
                  {[
                    { name: 'Acme Corp', amount: '₹25,900', status: 'Paid', c: 'text-green-400' },
                    { name: 'Sharma Ent.', amount: '₹12,400', status: 'Sent', c: 'text-blue-400' },
                    { name: 'Patel Co.', amount: '₹8,500', status: 'Draft', c: 'text-gray-400' },
                  ].map(inv => (
                    <div key={inv.name} className="flex items-center justify-between text-xs">
                      <span className="text-white/70">{inv.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{inv.amount}</span>
                        <span className={`${inv.c} font-medium`}>{inv.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── PRODUCTS GRID ───────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="container-wide">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Products &amp; Tools</h2>
            <p className="text-xl text-gray-600">Ready-to-deploy software for every business need</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cmsTools.length > 0 ? cmsTools.map((tool, idx) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                viewport={{ once: true }}
                className={`group bg-white rounded-2xl border border-gray-100 p-6 ${getBorderForIndex(idx)} hover:shadow-lg transition-all duration-300 flex flex-col`}
              >
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl overflow-hidden ${getColorForIndex(idx)} mb-4`}>
                  {tool.logoUrl
                    ? <img src={tool.logoUrl} alt={tool.title} className="h-full w-full object-cover" />
                    : <Wrench className="h-6 w-6" />
                  }
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{tool.title}</h3>
                  {tool.toolType === 'COMING_SOON' && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Coming Soon</span>
                  )}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed flex-1 mb-5">{tool.shortDescription || ''}</p>
                <Link
                  href={getCmsToolHref(tool)}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 group-hover:gap-2.5 transition-all"
                >
                  {tool.toolType === 'COMING_SOON' ? 'Get Notified' : (tool.ctaText || 'Learn more')} <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            )) : PRODUCTS.map((product, idx) => (
              <motion.div
                key={product.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                viewport={{ once: true }}
                className={`group bg-white rounded-2xl border border-gray-100 p-6 ${product.border} hover:shadow-lg transition-all duration-300 flex flex-col`}
              >
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${product.color} mb-4`}>
                  <product.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed flex-1 mb-5">{product.desc}</p>
                <Link
                  href={product.href}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 group-hover:gap-2.5 transition-all"
                >
                  Learn more <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SERVICES ────────────────────────────────────────────────────── */}
      <section className="py-24 bg-gray-50">
        <div className="container-wide">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">We Build Custom Solutions</h2>
            <p className="text-xl text-gray-600">Have a unique requirement? We design and build from scratch.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
            {SERVICES.map((s, idx) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -16 : 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                viewport={{ once: true }}
                className="flex items-start gap-4 bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow"
              >
                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <s.icon className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{s.title}</h3>
                  <p className="text-sm text-gray-600">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              Talk to Us
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── WHY CHOOSE US ───────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="container-wide">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why businesses choose Yantrix Labs</h2>
            <p className="text-xl text-gray-600">We combine startup speed with enterprise quality.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {WHY_US.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${item.color} mb-4`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROCESS ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-gray-50">
        <div className="container-wide">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How We Work</h2>
            <p className="text-xl text-gray-600">A simple, transparent process from idea to launch.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-0 relative">
            {PROCESS.map((step, idx) => (
              <div key={step.title} className="flex flex-col items-center text-center relative">
                {idx < PROCESS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-px bg-indigo-100 z-0" />
                )}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="relative z-10 flex flex-col items-center"
                >
                  <div className="h-16 w-16 rounded-2xl bg-white border border-indigo-100 shadow-sm flex items-center justify-center text-2xl mb-4">
                    {step.emoji}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-xs text-gray-500 max-w-[100px]">{step.desc}</p>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="container-wide">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Trusted by business owners</h2>
            <p className="text-xl text-gray-600">What our clients say about working with us</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, idx) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">&quot;{t.quote}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-gray-500 text-xs">{t.business}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ───────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-indigo-600 to-purple-700">
        <div className="container-wide text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-indigo-300 font-semibold uppercase tracking-widest text-sm mb-4">Need software for your business?</p>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Let&apos;s build it.
            </h2>
            <p className="text-xl text-indigo-200 mb-10 max-w-2xl mx-auto">
              We work with startups, SMEs, and enterprises to create digital products that drive growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-indigo-600 hover:bg-indigo-50 transition-all shadow-lg"
              >
                Book a Consultation
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/tools"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-400 px-8 py-4 text-base font-semibold text-white hover:bg-indigo-500/20 transition-all"
              >
                Explore Products
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="container-wide">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Y</span>
                </div>
                <span className="text-xl font-bold text-white">Yantrix Labs</span>
              </Link>
              <p className="text-sm leading-relaxed mb-4">
                We build smart digital products and business tools for startups, SMEs, and enterprises.
              </p>
              <p className="text-xs">Made with ❤️ in India 🇮🇳</p>
            </div>
            <div>
              <h5 className="font-semibold text-white mb-4">Products</h5>
              <ul className="space-y-2 text-sm">
                <li><Link href="/tools/gst-invoice" className="hover:text-white transition-colors">GST Invoice Tool</Link></li>
                <li><Link href="/tools" className="hover:text-white transition-colors">All Products</Link></li>
                <li><Link href="/services" className="hover:text-white transition-colors">Custom Development</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-white mb-4">Company</h5>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm">© {new Date().getFullYear()} Yantrix Labs. All rights reserved.</p>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
