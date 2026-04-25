import { PublicLayout } from '@/components/layout/PublicLayout';
import Link from 'next/link';
import {
  FileText, Users, ShoppingCart, Building2, UtensilsCrossed,
  Car, MapPin, BarChart3, Briefcase, Settings, ArrowRight, Zap,
} from 'lucide-react';

const PRODUCTS = [
  {
    icon: FileText,
    title: 'GST Invoice Tool',
    description: 'Professional GST billing, invoicing, and compliance. Auto-calculate CGST, SGST, IGST. Generate GSTR-1 and GSTR-3B reports. Built for Indian businesses.',
    href: '/tools/gst-invoice',
    badge: 'Live',
    color: 'bg-indigo-50 text-indigo-600',
    badgeColor: 'bg-indigo-100 text-indigo-700',
  },
  {
    icon: Users,
    title: 'Attendance System',
    description: 'Biometric and digital attendance tracking for teams. Real-time reports, leave management, and payroll integration.',
    href: '/contact',
    badge: 'Coming Soon',
    color: 'bg-green-50 text-green-600',
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    icon: ShoppingCart,
    title: 'Ecommerce Platform',
    description: 'Full-featured online store with payments, inventory management, and order tracking. Launch your store in days.',
    href: '/contact',
    badge: 'Coming Soon',
    color: 'bg-amber-50 text-amber-600',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  {
    icon: Building2,
    title: 'Hotel Booking System',
    description: 'Property management and room booking for hospitality businesses. Online reservations, housekeeping, and billing.',
    href: '/contact',
    badge: 'Coming Soon',
    color: 'bg-blue-50 text-blue-600',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    icon: UtensilsCrossed,
    title: 'Restaurant POS',
    description: 'Order management and billing for restaurants and F&B businesses. Table management, kitchen display, and GST billing.',
    href: '/contact',
    badge: 'Coming Soon',
    color: 'bg-rose-50 text-rose-600',
    badgeColor: 'bg-rose-100 text-rose-700',
  },
  {
    icon: Car,
    title: 'Taxi Booking App',
    description: 'Driver and ride management platform. Passenger app, driver app, and admin dashboard with real-time tracking.',
    href: '/contact',
    badge: 'Coming Soon',
    color: 'bg-purple-50 text-purple-600',
    badgeColor: 'bg-purple-100 text-purple-700',
  },
  {
    icon: MapPin,
    title: 'GPS Fleet Tracking',
    description: 'Real-time fleet tracking and route optimization for logistics businesses. Live map, trip history, and fuel monitoring.',
    href: '/contact',
    badge: 'Coming Soon',
    color: 'bg-cyan-50 text-cyan-600',
    badgeColor: 'bg-cyan-100 text-cyan-700',
  },
  {
    icon: BarChart3,
    title: 'CRM',
    description: 'Manage leads, customers, and sales pipelines. Track deals, send follow-ups, and measure conversion.',
    href: '/contact',
    badge: 'Coming Soon',
    color: 'bg-orange-50 text-orange-600',
    badgeColor: 'bg-orange-100 text-orange-700',
  },
  {
    icon: Briefcase,
    title: 'HRMS',
    description: 'HR, payroll, and employee lifecycle management. Onboarding, leaves, appraisals, and salary processing.',
    href: '/contact',
    badge: 'Coming Soon',
    color: 'bg-pink-50 text-pink-600',
    badgeColor: 'bg-pink-100 text-pink-700',
  },
  {
    icon: Settings,
    title: 'Custom ERP',
    description: 'Tailored enterprise resource planning systems built for your specific workflow and industry requirements.',
    href: '/services',
    badge: 'Custom Build',
    color: 'bg-violet-50 text-violet-600',
    badgeColor: 'bg-violet-100 text-violet-700',
  },
];

const GST_SLABS = [
  { rate: '0%', items: 'Essential food items, fresh vegetables, milk, eggs, salt, educational services' },
  { rate: '5%', items: 'Packaged food, edible oils, sugar, tea, coffee, rail tickets, economy hotels' },
  { rate: '12%', items: 'Processed food, computers, smartphones, business class tickets, non-AC restaurants' },
  { rate: '18%', items: 'Most goods and services — electronics, IT services, financial services, AC restaurants' },
  { rate: '28%', items: 'Luxury goods, tobacco, automobiles, cement, aerated drinks, casinos' },
];

export default function ToolsPage() {
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
          <p className="text-xl text-gray-600 leading-relaxed">
            Browse our ready-to-deploy business software solutions.
            From invoicing to booking platforms — built for India.
          </p>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-20">
        <div className="container-wide">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {PRODUCTS.map(product => (
              <div
                key={product.title}
                className="group bg-white rounded-2xl border border-gray-100 p-6 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${product.color}`}>
                    <product.icon className="h-6 w-6" />
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${product.badgeColor}`}>
                    {product.badge}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed flex-1 mb-5">{product.description}</p>
                <Link
                  href={product.href}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 group-hover:gap-2.5 transition-all"
                >
                  {product.badge === 'Live' ? 'View Product' : product.badge === 'Custom Build' ? 'Build Custom' : 'Get Notified'} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GST Slab Reference */}
      <section className="py-20 bg-gray-50">
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
                    <td className="px-6 py-4">
                      <span className="font-bold text-lg text-indigo-600">{slab.rate}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 text-sm">{slab.items}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">
            * GST rates are subject to change. Always verify with the GST Council notifications for the latest updates.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-purple-700 text-center">
        <div className="container-wide max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">
            Don&apos;t see what you need?
          </h2>
          <p className="text-indigo-200 mb-8 text-lg">
            We build custom software for any business requirement. Tell us what you need.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-indigo-600 hover:bg-indigo-50 transition-all shadow-lg"
            >
              Start a Project
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-400 px-8 py-4 text-base font-semibold text-white hover:bg-indigo-500/20 transition-all"
            >
              View Services
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
