'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FileText, BarChart3, Shield, Zap, CheckCircle, Star,
  ArrowRight, IndianRupee, Users, Package, TrendingUp,
  ChevronRight, Globe, Lock, Headphones, Menu, X, LayoutDashboard
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { isAuthenticated, getUserData, apiFetch, isSafeImageUrl } from '@/lib/api';

const NAV_LINKS = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/tools', label: 'Tools' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

const FEATURES = [
  {
    icon: FileText,
    title: 'GST Invoicing in 30 Seconds',
    description: 'Create professional GST-compliant invoices with auto-calculations for CGST, SGST, and IGST. Support for all invoice types.',
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    icon: BarChart3,
    title: 'Automated GST Reports',
    description: 'Generate GSTR-1, GSTR-3B, and other GST returns with a single click. Never miss a filing deadline again.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: IndianRupee,
    title: 'Payment Tracking',
    description: 'Track payments, send reminders for overdue invoices, and accept online payments via UPI, cards, and net banking.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Users,
    title: 'Customer Management',
    description: 'Maintain a complete customer database with GST details, payment history, and outstanding balance tracking.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Package,
    title: 'Inventory Management',
    description: 'Track stock levels, get low-stock alerts, and manage your product catalog with HSN/SAC codes.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: Shield,
    title: 'Bank-Grade Security',
    description: 'Your business data is encrypted and secure. Regular backups ensure you never lose important information.',
    color: 'bg-rose-50 text-rose-600',
  },
];

const PLANS = [
  {
    name: 'Free',
    price: '₹0',
    period: '/month',
    description: 'Perfect for freelancers',
    features: ['5 invoices/month', '10 customers', 'Basic GST reports', 'PDF download', 'Email support'],
    cta: 'Get Started Free',
    highlighted: false,
    badge: null,
  },
  {
    name: 'Starter',
    price: '₹149',
    period: '/month',
    description: 'For growing businesses',
    features: ['100 invoices/month', '200 customers', '2 team members', 'GST reports', 'Email invoices', 'Payment tracking', 'Expense tracking'],
    cta: 'Start Free Trial',
    highlighted: false,
    badge: null,
  },
  {
    name: 'Pro',
    price: '₹299',
    period: '/month',
    description: 'Most popular choice',
    features: ['500 invoices/month', 'Unlimited customers', '5 team members', 'Advanced GST reports', 'GSTR filing help', 'Multi-branch', 'Custom templates', 'Payment gateway', 'Priority support'],
    cta: 'Start Free Trial',
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Business',
    price: '₹599',
    period: '/month',
    description: 'For large enterprises',
    features: ['Unlimited invoices', 'Unlimited customers', '20 team members', 'Full GST suite', 'API access', 'White-label', 'Dedicated manager', 'SLA support'],
    cta: 'Contact Sales',
    highlighted: false,
    badge: null,
  },
];

const TESTIMONIALS = [
  {
    name: 'Rajesh Sharma',
    business: 'Sharma Electronics, Mumbai',
    avatar: 'RS',
    rating: 5,
    quote: 'Yantrix has completely transformed how we handle GST billing. What used to take hours now takes minutes. The automatic tax calculations are a lifesaver!',
  },
  {
    name: 'Priya Nair',
    business: 'Priya Boutique, Bengaluru',
    avatar: 'PN',
    rating: 5,
    quote: 'As a small business owner, I was struggling with GST compliance. Yantrix made it so easy. My CA is also happy with the organized reports.',
  },
  {
    name: 'Amit Patel',
    business: 'AP Trading Co, Ahmedabad',
    avatar: 'AP',
    rating: 5,
    quote: 'The best billing software for Indian businesses. Simple, affordable, and packed with features. Highly recommend it to every SME owner.',
  },
];

const STATS = [
  { value: '50,000+', label: 'Businesses' },
  { value: '₹500 Cr+', label: 'Invoices Generated' },
  { value: '99.9%', label: 'Uptime' },
  { value: '4.9/5', label: 'Rating' },
];

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [initials, setInitials] = useState('');
  const [businessLogo, setBusinessLogo] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);

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
              <span className="text-xl font-bold text-gray-900">Yantrix</span>
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
                  <Link href="/auth/login" className="text-sm font-medium text-gray-700 hover:text-gray-900 px-4 py-2">
                    Log in
                  </Link>
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                  >
                    Get Started Free
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

        {/* Mobile menu */}
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
                  <Link href="/auth/login" className="block py-2 text-sm font-medium text-gray-700">Log in</Link>
                  <Link href="/auth/register" className="block rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white">Get Started Free</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ─── Hero Section ────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-3xl rounded-full pointer-events-none" />

        <div className="container-wide relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 mb-6">
              <Zap className="h-3.5 w-3.5" />
              Trusted by 50,000+ Indian businesses
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight leading-[1.1] mb-6">
              GST Billing Made
              <span className="block gradient-text">Ridiculously Simple</span>
            </h1>

            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Create GST-compliant invoices in 30 seconds. Automate tax calculations, track payments, 
              and file returns with confidence. Built for India&apos;s 63 million SMEs.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-lg shadow-indigo-200"
              >
                Start for Free — No credit card needed
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-4 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                View Pricing
              </Link>
            </div>

            <p className="mt-6 text-sm text-gray-500">
              ✓ Free plan available &nbsp;·&nbsp; ✓ 14-day trial &nbsp;·&nbsp; ✓ Cancel anytime
            </p>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 relative mx-auto max-w-5xl"
          >
            <div className="rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-1.5 bg-gray-50 border-b border-gray-200 px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
                <div className="ml-4 flex-1 rounded-md bg-gray-200 px-3 py-1 text-xs text-gray-500">app.yantrix.in/dashboard</div>
              </div>
              {/* Dashboard mockup */}
              <div className="bg-gray-50 p-6">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Total Revenue', value: '₹4,82,500', change: '+12%', color: 'indigo' },
                    { label: 'Invoices', value: '247', change: '+8%', color: 'green' },
                    { label: 'Customers', value: '89', change: '+5%', color: 'blue' },
                    { label: 'Pending', value: '₹38,200', change: '-3%', color: 'amber' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4">
                      <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                      <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                      <p className={`text-xs font-medium mt-0.5 ${stat.color === 'blue' ? 'text-blue-600' : stat.color === 'amber' ? 'text-amber-600' : stat.color === 'green' ? 'text-green-600' : 'text-indigo-600'}`}>{stat.change} this month</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-4 h-40">
                    <p className="text-sm font-medium text-gray-700 mb-3">Revenue Overview</p>
                    <div className="flex items-end gap-2 h-24">
                      {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                        <div key={i} className="flex-1 bg-indigo-100 rounded-t-sm relative overflow-hidden">
                          <div className="absolute bottom-0 left-0 right-0 bg-indigo-500 rounded-t-sm" style={{ height: `${h}%` }} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">Recent Invoices</p>
                    <div className="space-y-2">
                      {[
                        { name: 'Acme Corp', amount: '₹25,900', status: 'Paid' },
                        { name: 'Sharma Ent.', amount: '₹12,400', status: 'Sent' },
                        { name: 'Patel Co.', amount: '₹8,500', status: 'Draft' },
                      ].map(inv => (
                        <div key={inv.name} className="flex items-center justify-between text-xs">
                          <span className="text-gray-700 font-medium">{inv.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900 font-semibold">{inv.amount}</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${inv.status === 'Paid' ? 'bg-green-100 text-green-700' : inv.status === 'Sent' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{inv.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Stats ───────────────────────────────────────────────────────── */}
      <section className="py-16 bg-indigo-600">
        <div className="container-wide">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <p className="text-3xl md:text-4xl font-bold text-white">{stat.value}</p>
                <p className="text-indigo-200 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="py-24">
        <div className="container-wide">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need to manage your business finances
            </h2>
            <p className="text-xl text-gray-600">
              From GST invoicing to financial reports — Yantrix gives you the complete toolkit 
              to run your business efficiently and stay compliant.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="group rounded-2xl border border-gray-100 bg-white p-6 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 card-hover"
              >
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.color} mb-4`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ────────────────────────────────────────────────── */}
      <section className="py-24 bg-gray-50">
        <div className="container-wide">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Up and running in 5 minutes</h2>
            <p className="text-xl text-gray-600">No accounting degree needed. Yantrix is designed to be simple.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {[
              {
                step: '01',
                title: 'Create your account',
                description: 'Sign up for free. Add your business GSTIN and you\'re ready to invoice.',
                icon: Users,
              },
              {
                step: '02',
                title: 'Add your products & customers',
                description: 'Import your product catalog with HSN/SAC codes and GST rates. Add your customers with their GSTIN.',
                icon: Package,
              },
              {
                step: '03',
                title: 'Create & send invoices',
                description: 'Select customer, add items, and Yantrix auto-calculates all taxes. Send via email or WhatsApp.',
                icon: FileText,
              },
            ].map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.15 }}
                viewport={{ once: true }}
                className="relative bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center"
              >
                <div className="text-5xl font-bold text-indigo-100 mb-4">{item.step}</div>
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 mb-4">
                  <item.icon className="h-7 w-7 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24">
        <div className="container-wide">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-xl text-gray-600">
              Start free, upgrade when you need to. All plans include a 14-day free trial.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan, idx) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className={`relative rounded-2xl p-6 border-2 ${plan.highlighted
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-xl shadow-indigo-200'
                  : 'border-gray-200 bg-white'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-900">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <h3 className={`text-lg font-bold mb-1 ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                <p className={`text-sm mb-4 ${plan.highlighted ? 'text-indigo-200' : 'text-gray-500'}`}>{plan.description}</p>

                <div className="mb-6">
                  <span className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>{plan.price}</span>
                  <span className={`text-sm ${plan.highlighted ? 'text-indigo-200' : 'text-gray-500'}`}>{plan.period}</span>
                </div>

                <Link
                  href={
                    plan.name === 'Business'
                      ? '/contact'
                      : loggedIn
                        ? '/settings/billing'
                        : '/auth/register'
                  }
                  className={`block w-full rounded-xl py-2.5 text-center text-sm font-semibold transition-all mb-6 ${plan.highlighted
                    ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {loggedIn && plan.name !== 'Business' && plan.name !== 'Free' ? 'Upgrade Now' : plan.cta}
                </Link>

                <ul className="space-y-3">
                  {plan.features.map(feature => (
                    <li key={feature} className={`flex items-start gap-2 text-sm ${plan.highlighted ? 'text-indigo-100' : 'text-gray-600'}`}>
                      <CheckCircle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${plan.highlighted ? 'text-indigo-300' : 'text-green-500'}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ────────────────────────────────────────────────── */}
      <section className="py-24 bg-gray-50">
        <div className="container-wide">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Loved by Indian business owners</h2>
            <p className="text-xl text-gray-600">Join thousands of SMEs who trust Yantrix for their billing needs</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, idx) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
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

      {/* ─── Trust Badges ────────────────────────────────────────────────── */}
      <section className="py-16 border-y border-gray-100">
        <div className="container-wide">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: Shield, title: 'GST Compliant', desc: 'Fully compliant with Indian GST laws and updates' },
              { icon: Lock, title: 'Data Secure', desc: '256-bit SSL encryption for all your data' },
              { icon: Globe, title: 'Always Available', desc: '99.9% uptime SLA guarantee' },
              { icon: Headphones, title: '24/7 Support', desc: 'Dedicated support in Hindi and English' },
            ].map(item => (
              <div key={item.title} className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                  <item.icon className="h-6 w-6 text-indigo-600" />
                </div>
                <h4 className="font-semibold text-gray-900">{item.title}</h4>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-indigo-600 to-purple-700">
        <div className="container-wide text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to simplify your GST billing?
            </h2>
            <p className="text-xl text-indigo-200 mb-10 max-w-2xl mx-auto">
              Join 50,000+ Indian businesses who have already made the switch to smarter billing.
              Start free, no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-indigo-600 hover:bg-indigo-50 transition-all shadow-lg"
              >
                Start for Free Today
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-400 px-8 py-4 text-base font-semibold text-white hover:bg-indigo-500/20 transition-all"
              >
                View All Plans
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="container-wide">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Y</span>
                </div>
                <span className="text-xl font-bold text-white">Yantrix</span>
              </Link>
              <p className="text-sm leading-relaxed mb-4">
                India&apos;s simplest GST billing software. Designed for small and medium businesses 
                to manage invoicing, taxes, and payments without the complexity.
              </p>
              <p className="text-xs">Made with ❤️ in India 🇮🇳</p>
            </div>

            {[
              {
                title: 'Product',
                links: [
                  { href: '/features', label: 'Features' },
                  { href: '/pricing', label: 'Pricing' },
                  { href: '/tools', label: 'Free Tools' },
                  { href: '/changelog', label: 'Changelog' },
                ],
              },
              {
                title: 'Company',
                links: [
                  { href: '/about', label: 'About Us' },
                  { href: '/blog', label: 'Blog' },
                  { href: '/careers', label: 'Careers' },
                  { href: '/contact', label: 'Contact' },
                ],
              },
              {
                title: 'Legal',
                links: [
                  { href: '/privacy', label: 'Privacy Policy' },
                  { href: '/terms', label: 'Terms of Service' },
                  { href: '/refund', label: 'Refund Policy' },
                  { href: '/security', label: 'Security' },
                ],
              },
            ].map(col => (
              <div key={col.title}>
                <h5 className="font-semibold text-white mb-4">{col.title}</h5>
                <ul className="space-y-2">
                  {col.links.map(link => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm">© {new Date().getFullYear()} Yantrix. All rights reserved.</p>
            <div className="flex items-center gap-6 text-sm">
              <span>GST: 29AABCY1234B1ZX</span>
              <span>CIN: U72900KA2024PTC1234</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
