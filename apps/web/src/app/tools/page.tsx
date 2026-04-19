import { PublicLayout } from '@/components/layout/PublicLayout';
import Link from 'next/link';
import {
  Calculator, FileText, IndianRupee, BarChart3,
  ArrowRight, Zap, Package, Users
} from 'lucide-react';

const TOOLS = [
  {
    icon: Calculator,
    title: 'GST Calculator',
    description: 'Calculate GST for any product or service instantly. Supports CGST, SGST, IGST, and all GST slabs (5%, 12%, 18%, 28%).',
    href: '/tools/gst-calculator',
    badge: 'Free',
    color: 'bg-indigo-50 text-indigo-600',
    badgeColor: 'bg-indigo-100 text-indigo-700',
  },
  {
    icon: FileText,
    title: 'Invoice Number Generator',
    description: 'Generate sequential GST-compliant invoice numbers for your business following the format required by the GST Act.',
    href: '/tools/invoice-number',
    badge: 'Free',
    color: 'bg-green-50 text-green-600',
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    icon: IndianRupee,
    title: 'HSN Code Finder',
    description: 'Look up HSN (Harmonized System of Nomenclature) codes for your products and find the correct GST rate.',
    href: '/tools/hsn-finder',
    badge: 'Free',
    color: 'bg-amber-50 text-amber-600',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  {
    icon: BarChart3,
    title: 'GSTR-1 Checker',
    description: 'Validate your GSTR-1 data before filing. Check for common errors that lead to notices and penalties.',
    href: '/tools/gstr1-checker',
    badge: 'Free',
    color: 'bg-blue-50 text-blue-600',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    icon: Package,
    title: 'SAC Code Finder',
    description: 'Find SAC (Services Accounting Code) codes for your services and determine the applicable GST rate.',
    href: '/tools/sac-finder',
    badge: 'Free',
    color: 'bg-purple-50 text-purple-600',
    badgeColor: 'bg-purple-100 text-purple-700',
  },
  {
    icon: Users,
    title: 'GSTIN Validator',
    description: 'Verify the authenticity of any GSTIN instantly. Check format, state code, and checksum validity.',
    href: '/tools/gstin-validator',
    badge: 'Free',
    color: 'bg-rose-50 text-rose-600',
    badgeColor: 'bg-rose-100 text-rose-700',
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
            100% Free
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Free GST Tools for
            <span className="block gradient-text">Indian Businesses</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Practical calculators and validators to help you stay GST compliant.
            No login required — just open and use.
          </p>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-20">
        <div className="container-wide">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {TOOLS.map(tool => (
              <div
                key={tool.title}
                className="group bg-white rounded-2xl border border-gray-100 p-6 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${tool.color}`}>
                    <tool.icon className="h-6 w-6" />
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tool.badgeColor}`}>
                    {tool.badge}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{tool.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed flex-1 mb-5">{tool.description}</p>
                <Link
                  href={tool.href}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 group-hover:gap-2.5 transition-all"
                >
                  Use Tool <ArrowRight className="h-4 w-4" />
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
            Need more than just tools?
          </h2>
          <p className="text-indigo-200 mb-8 text-lg">
            Yantrix automates all of this — invoice creation, GST calculations, and return filing — in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-indigo-600 hover:bg-indigo-50 transition-all shadow-lg"
            >
              Start Free — No Credit Card
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-400 px-8 py-4 text-base font-semibold text-white hover:bg-indigo-500/20 transition-all"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
