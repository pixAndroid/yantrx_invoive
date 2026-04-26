import { PublicLayout } from '@/components/layout/PublicLayout';
import Link from 'next/link';
import {
  FileText, BarChart3, Shield, Zap, Star,
  ArrowRight, IndianRupee, Users, Package,
} from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GST Invoice Tool — Professional GST Billing for Indian Businesses',
  description: 'Create GST-compliant invoices in 30 seconds. Auto-calculate CGST, SGST, IGST. Generate GSTR-1 and GSTR-3B reports. Built for Indian SMEs.',
};

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

const GST_SLABS = [
  { rate: '0%', items: 'Essential food items, fresh vegetables, milk, eggs, salt, educational services' },
  { rate: '5%', items: 'Packaged food, edible oils, sugar, tea, coffee, rail tickets, economy hotels' },
  { rate: '12%', items: 'Processed food, computers, smartphones, business class tickets, non-AC restaurants' },
  { rate: '18%', items: 'Most goods and services — electronics, IT services, financial services, AC restaurants' },
  { rate: '28%', items: 'Luxury goods, tobacco, automobiles, cement, aerated drinks, casinos' },
];

const TESTIMONIALS = [
  {
    name: 'Rajesh Sharma',
    business: 'Sharma Electronics, Mumbai',
    avatar: 'RS',
    quote: 'Yantrix has completely transformed how we handle GST billing. What used to take hours now takes minutes. The automatic tax calculations are a lifesaver!',
  },
  {
    name: 'Priya Nair',
    business: 'Priya Boutique, Bengaluru',
    avatar: 'PN',
    quote: 'As a small business owner, I was struggling with GST compliance. Yantrix made it so easy. My CA is also happy with the organized reports.',
  },
  {
    name: 'Amit Patel',
    business: 'AP Trading Co, Ahmedabad',
    avatar: 'AP',
    quote: 'The best billing software for Indian businesses. Simple, affordable, and packed with features. Highly recommend it to every SME owner.',
  },
];

export default function GSTInvoicePage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-indigo-500/15 to-purple-500/15 blur-3xl rounded-full pointer-events-none" />
        <div className="container-wide relative text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 mb-6">
            <Zap className="h-3.5 w-3.5" />
            GST Invoice Tool
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 tracking-tight leading-[1.1] mb-6">
            Professional GST Billing,
            <span className="block gradient-text">Built for Indian Businesses</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Create GST-compliant invoices in 30 seconds. Automate tax calculations, track payments,
            and file returns with confidence. Trusted by 50,000+ Indian SMEs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-4 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-all"
            >
              View Dashboard
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            ✓ Free plan available &nbsp;·&nbsp; ✓ 14-day trial &nbsp;·&nbsp; ✓ Cancel anytime
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="container-wide">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need to manage GST billing
            </h2>
            <p className="text-xl text-gray-600">
              From invoicing to reports — the complete toolkit for GST compliance.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map(feature => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-gray-100 bg-white p-6 hover:border-indigo-200 hover:shadow-lg transition-all duration-300"
              >
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.color} mb-4`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GST Slab Reference */}
      <section className="py-24 bg-gray-50">
        <div className="container-wide max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">GST Rate Reference</h2>
            <p className="text-gray-600">Quick reference for GST slabs applicable in India (FY 2025-26)</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-indigo-600 text-white">
                  <th className="text-left px-6 py-4 font-semibold">GST Rate</th>
                  <th className="text-left px-6 py-4 font-semibold">Applicable Items / Services</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {GST_SLABS.map((slab, idx) => (
                  <tr key={slab.rate} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4"><span className="font-bold text-lg text-indigo-600">{slab.rate}</span></td>
                    <td className="px-6 py-4 text-gray-700 text-sm">{slab.items}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">* GST rates are subject to change. Always verify with the GST Council notifications for the latest updates.</p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="container-wide">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Loved by Indian business owners</h2>
            <p className="text-xl text-gray-600">Join thousands of SMEs who trust Yantrix for their billing needs</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-purple-700 text-center">
        <div className="container-wide max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">
            Start your free account today
          </h2>
          <p className="text-indigo-200 mb-8 text-lg">
            No credit card required. Setup in 5 minutes. Cancel anytime.
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-indigo-600 hover:bg-indigo-50 transition-all shadow-lg"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
