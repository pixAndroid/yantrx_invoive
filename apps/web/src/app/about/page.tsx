'use client';

import { useEffect, useState } from 'react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Users, Target, Heart, Award, TrendingUp, Globe } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

const ABOUT_STATS_DEFAULTS = [
  { value: '10+', label: 'Products Built' },
  { value: '500+', label: 'Businesses Served' },
  { value: '5+', label: 'Industries Covered' },
  { value: '3+', label: 'Years Building' },
];

const TEAM_DEFAULTS = [
  {
    id: '1',
    name: 'Arjun Mehta',
    role: 'Co-Founder & CEO',
    bio: 'Former CA with 10+ years in fintech. Passionate about simplifying tax compliance for Indian SMEs.',
    imageUrl: null,
  },
  {
    id: '2',
    name: 'Sneha Reddy',
    role: 'Co-Founder & CTO',
    bio: 'Ex-Razorpay engineer. Built scalable payment systems serving millions of transactions.',
    imageUrl: null,
  },
  {
    id: '3',
    name: 'Vikram Nair',
    role: 'Head of Product',
    bio: 'Product leader who previously scaled a SaaS to 100k users. Obsessed with user experience.',
    imageUrl: null,
  },
  {
    id: '4',
    name: 'Divya Sharma',
    role: 'Head of Customer Success',
    bio: 'Spent 8 years helping small businesses navigate GST compliance. Your first call when you need help.',
    imageUrl: null,
  },
];

const AVATAR_COLORS = [
  'from-indigo-500 to-purple-600',
  'from-pink-500 to-rose-600',
  'from-amber-500 to-orange-600',
  'from-green-500 to-teal-600',
  'from-blue-500 to-cyan-600',
  'from-violet-500 to-purple-600',
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
    title: 'Quality Without Compromise',
    description: 'We obsess over code quality, performance, and UX. Every product we ship is something we are proud to put our name on.',
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
  { year: '2019', event: 'Started the development journey with Android Studio, building native Android applications using Java/XML and learning real-world app architecture.' },
  { year: '2020', event: 'Expanded into React Native CLI and cross-platform mobile app development. Began delivering custom apps for businesses and internal operations.' },
  { year: '2021', event: 'Moved into full-stack web development, backend systems, databases, admin panels, and scalable web applications for growing businesses.' },
  { year: '2022', event: 'Built multiple business solutions including ecommerce platforms, booking systems, billing tools, and custom management software.' },
  { year: '2023', event: 'Focused on SaaS product development, dashboards, automation systems, CRM tools, and operational software for SMEs and startups.' },
  { year: '2024', event: 'Launched advanced solutions including GPS tracking systems, taxi booking apps, restaurant platforms, hotel booking systems, and workforce tools.' },
  { year: '2025', event: 'Expanded into AI-powered products including face recognition attendance systems, smart automation workflows, productivity tools, and modern scalable business platforms.' },
  { year: 'Today', event: 'Yantrix Labs continues building custom software, SaaS products, mobile apps, AI systems, and digital tools that help businesses automate operations and grow faster.' },
];

export default function AboutPage() {
  const [stats, setStats] = useState(ABOUT_STATS_DEFAULTS);
  const [team, setTeam] = useState(TEAM_DEFAULTS);

  useEffect(() => {
    fetch(`${API_URL}/settings/about-stats`)
      .then(r => { if (!r.ok) throw new Error('fetch failed'); return r.json(); })
      .then(d => {
        if (d.success && d.data) {
          const data = d.data;
          const updated = [
            { value: data.stat1Value || ABOUT_STATS_DEFAULTS[0].value, label: data.stat1Label || ABOUT_STATS_DEFAULTS[0].label },
            { value: data.stat2Value || ABOUT_STATS_DEFAULTS[1].value, label: data.stat2Label || ABOUT_STATS_DEFAULTS[1].label },
            { value: data.stat3Value || ABOUT_STATS_DEFAULTS[2].value, label: data.stat3Label || ABOUT_STATS_DEFAULTS[2].label },
            { value: data.stat4Value || ABOUT_STATS_DEFAULTS[3].value, label: data.stat4Label || ABOUT_STATS_DEFAULTS[3].label },
          ];
          setStats(updated);
        }
      })
      .catch(() => {});

    fetch(`${API_URL}/settings/team-members`)
      .then(r => { if (!r.ok) throw new Error('fetch failed'); return r.json(); })
      .then(d => {
        if (d.success && Array.isArray(d.data) && d.data.length > 0) {
          setTeam(d.data);
        }
      })
      .catch(() => {});
  }, []);

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
            We build software that
            <span className="block gradient-text">powers modern businesses</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Yantrix Labs was built to help Indian businesses grow faster with smart software.
            From GST tools to full-scale enterprise systems — we create products that work.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-indigo-600">
        <div className="container-wide">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={`stat-${i}`}>
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
              Yantrix Labs was built on one clear idea: businesses need reliable, scalable, and affordable
              software that solves real operational problems.
            </p>
            <p>
              Founded by a solo developer with hands-on product engineering experience since 2019, the journey
              began with native Android development in Android Studio using Java/XML, then expanded into React
              Native CLI for cross-platform apps, full-stack web development, backend systems, database
              architecture, and SaaS product engineering.
            </p>
            <p>
              Over the years, multiple production-grade solutions have been designed and developed across
              different industries — combining strong UI/UX, business logic, automation, and scalable
              architecture. What started as independent development evolved into a technology studio focused
              on building modern business systems.
            </p>
            <p>Yantrix Labs has worked on and developed:</p>
            <ul>
              <li>SaaS platforms and admin dashboards</li>
              <li>Ecommerce websites and custom stores</li>
              <li>Booking systems for hotels, services, and appointments</li>
              <li>Restaurant ordering and management systems</li>
              <li>GPS vehicle and fleet tracking platforms</li>
              <li>Taxi booking and dispatch systems</li>
              <li>Attendance systems with AI face recognition</li>
              <li>Employee management and HR tools</li>
              <li>Billing, GST invoicing, and business utility tools</li>
              <li>Workflow automation systems</li>
              <li>AI-powered business solutions</li>
              <li>Custom Android, iOS, and Web applications</li>
              <li>Internal tools for operations and productivity</li>
            </ul>
            <p>
              Today, Yantrix Labs builds practical, secure, and scalable digital products for startups, SMEs,
              and growing businesses — with a focus on performance, automation, and real business outcomes.
            </p>
            <p>
              Our mission: engineer smart software systems that help businesses save time, reduce manual work,
              and scale faster.
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
            {team.map((member, i) => {
              const initials = member.name.split(' ').filter((n: string) => n).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
              const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
              return (
                <div key={member.id} className="bg-white rounded-2xl border border-gray-100 p-6 text-center hover:shadow-md transition-shadow">
                  {member.imageUrl ? (
                    <img
                      src={member.imageUrl}
                      alt={member.name}
                      className="h-16 w-16 rounded-full object-cover mx-auto mb-4"
                    />
                  ) : (
                    <div className={`h-16 w-16 rounded-full bg-gradient-to-br ${color} flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg`}>
                      {initials}
                    </div>
                  )}
                  <h3 className="font-semibold text-gray-900">{member.name}</h3>
                  <p className="text-xs text-indigo-600 font-medium mb-3">{member.role}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{member.bio}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-purple-700 text-center">
        <div className="container-wide max-w-2xl mx-auto">
          <TrendingUp className="h-12 w-12 text-indigo-300 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">Let&apos;s build something together</h2>
          <p className="text-indigo-200 mb-8">We work with startups, SMEs, and enterprises to create software that drives growth.</p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-indigo-600 hover:bg-indigo-50 transition-all shadow-lg"
          >
            Get in Touch
          </a>
        </div>
      </section>
    </PublicLayout>
  );
}
