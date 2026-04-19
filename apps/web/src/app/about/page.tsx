import { PublicLayout } from '@/components/layout/PublicLayout';
import { Users, Target, Heart, Award, TrendingUp, Globe } from 'lucide-react';

const TEAM = [
  {
    name: 'Arjun Mehta',
    role: 'Co-Founder & CEO',
    initials: 'AM',
    bio: 'Former CA with 10+ years in fintech. Passionate about simplifying tax compliance for Indian SMEs.',
    color: 'from-indigo-500 to-purple-600',
  },
  {
    name: 'Sneha Reddy',
    role: 'Co-Founder & CTO',
    initials: 'SR',
    bio: 'Ex-Razorpay engineer. Built scalable payment systems serving millions of transactions.',
    color: 'from-pink-500 to-rose-600',
  },
  {
    name: 'Vikram Nair',
    role: 'Head of Product',
    initials: 'VN',
    bio: 'Product leader who previously scaled a SaaS to 100k users. Obsessed with user experience.',
    color: 'from-amber-500 to-orange-600',
  },
  {
    name: 'Divya Sharma',
    role: 'Head of Customer Success',
    initials: 'DS',
    bio: 'Spent 8 years helping small businesses navigate GST compliance. Your first call when you need help.',
    color: 'from-green-500 to-teal-600',
  },
];

const VALUES = [
  {
    icon: Target,
    title: 'Simplicity First',
    description: 'We believe accounting software shouldn\'t require an accountant to operate. Every feature is designed for a non-expert.',
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    icon: Heart,
    title: 'Built for India',
    description: 'Not a Western product retrofitted for India. Yantrix was built ground-up for Indian GST, Indian businesses, and Indian challenges.',
    color: 'bg-rose-50 text-rose-600',
  },
  {
    icon: Award,
    title: 'Compliance Without Worry',
    description: 'We stay on top of every GST update so you don\'t have to. Our platform updates automatically when regulations change.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Users,
    title: 'Customer Obsessed',
    description: 'We answer support queries in under 2 hours. Your success is our success — especially during GST filing season.',
    color: 'bg-green-50 text-green-600',
  },
];

const MILESTONES = [
  { year: '2021', event: 'Yantrix founded in Bengaluru by two CAs and a fintech engineer.' },
  { year: '2022', event: 'Launched beta with 500 businesses. Processed our first ₹1 crore in invoices.' },
  { year: '2023', event: 'Reached 10,000 businesses. Launched GST filing integration. Series A funding.' },
  { year: '2024', event: 'Crossed 50,000 active businesses. Launched multi-branch and team collaboration features.' },
  { year: '2025', event: 'Expanding to international GST regimes. 100k businesses milestone.' },
];

export default function AboutPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="container-wide text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 mb-6">
            <Globe className="h-3.5 w-3.5" />
            Our Story
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            We&apos;re on a mission to make GST billing
            <span className="block gradient-text">ridiculously simple</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Yantrix was born out of frustration — watching small business owners spend hours on invoices
            and GST returns that should take minutes. We built the software we wished existed.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-indigo-600">
        <div className="container-wide">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '50,000+', label: 'Active Businesses' },
              { value: '₹500 Cr+', label: 'Invoices Processed' },
              { value: '4.9/5', label: 'Customer Rating' },
              { value: '3 Years', label: 'Building for India' },
            ].map(stat => (
              <div key={stat.label}>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-indigo-200 mt-1 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission / Story */}
      <section className="py-20">
        <div className="container-wide max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">How it started</h2>
          <div className="prose prose-gray max-w-none text-gray-600 space-y-4 leading-relaxed">
            <p>
              In 2021, our co-founder Arjun was working as a Chartered Accountant in Bengaluru.
              He watched his clients — restaurant owners, textile traders, freelancers — struggle with
              existing billing software that was either too complex, too expensive, or designed for
              a different era of Indian business.
            </p>
            <p>
              GST had changed everything in 2017, but the software hadn&apos;t caught up.
              Businesses were using clunky desktop tools, juggling multiple Excel sheets,
              or paying large fees to consultants just to file monthly returns.
            </p>
            <p>
              Arjun teamed up with Sneha, an engineer who had built payment infrastructure at Razorpay,
              and together they set out to build something different — a billing platform that was
              modern, mobile-friendly, and made compliance feel easy rather than terrifying.
            </p>
            <p>
              Today, Yantrix serves over 50,000 businesses across India — from street-level kirana stores
              to multi-branch enterprises — helping them invoice faster, stay GST compliant,
              and understand their business finances at a glance.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50">
        <div className="container-wide">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What we believe in</h2>
            <p className="text-gray-600">Our values shape every decision we make — from product features to support responses.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {VALUES.map(v => (
              <div key={v.title} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${v.color} mb-4`}>
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20">
        <div className="container-wide max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Our journey so far</h2>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-px bg-indigo-100" />
            <div className="space-y-8">
              {MILESTONES.map(m => (
                <div key={m.year} className="flex gap-6 items-start">
                  <div className="relative z-10 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-sm">
                    {m.year}
                  </div>
                  <div className="pt-4">
                    <p className="text-gray-700 leading-relaxed">{m.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-gray-50">
        <div className="container-wide">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet the team</h2>
            <p className="text-gray-600">A small, passionate group obsessed with making Indian businesses thrive.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {TEAM.map(member => (
              <div key={member.name} className="bg-white rounded-2xl border border-gray-100 p-6 text-center hover:shadow-md transition-shadow">
                <div className={`h-16 w-16 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg`}>
                  {member.initials}
                </div>
                <h3 className="font-semibold text-gray-900">{member.name}</h3>
                <p className="text-xs text-indigo-600 font-medium mb-3">{member.role}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-purple-700 text-center">
        <div className="container-wide max-w-2xl mx-auto">
          <TrendingUp className="h-12 w-12 text-indigo-300 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">Join 50,000+ businesses growing with Yantrix</h2>
          <p className="text-indigo-200 mb-8">Start free. No credit card needed. Setup in 5 minutes.</p>
          <a
            href="/auth/register"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-indigo-600 hover:bg-indigo-50 transition-all shadow-lg"
          >
            Get Started Free
          </a>
        </div>
      </section>
    </PublicLayout>
  );
}
