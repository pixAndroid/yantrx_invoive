'use client';

import { useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { isAuthenticated } from '@/lib/api';
import {
  Zap, ArrowRight, Rocket, FileText, IndianRupee,
  Users, Package, BarChart3, TrendingUp, CheckCircle,
} from 'lucide-react';

/* ─── Deterministic particles ────────────────────────────────────────────── */
function generateParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: ((i * 2.399) % 1) * 100,
    y: ((i * 0.618) % 1) * 100,
    size: i % 4 === 0 ? 3 : i % 3 === 0 ? 2 : 1.5,
    opacity: 0.06 + (i % 7) * 0.025,
    duration: 5 + (i % 6) * 1.8,
    delay: (i % 10) * 0.8,
  }));
}

/* ─── Mockup data ─────────────────────────────────────────────────────────── */
const STAT_CARDS = [
  { label: 'Revenue This Month', value: '₹4,82,500', change: '+18%', icon: IndianRupee, accent: '#818cf8', bg: 'rgba(99,102,241,0.10)' },
  { label: 'Invoices Created',   value: '247',        change: '+12',  icon: FileText,    accent: '#34d399', bg: 'rgba(16,185,129,0.10)' },
  { label: 'Active Clients',     value: '89',         change: '+5',   icon: Users,       accent: '#60a5fa', bg: 'rgba(59,130,246,0.10)' },
  { label: 'Pending Payments',   value: '₹38,200',   change: '4 due',icon: TrendingUp,  accent: '#fbbf24', bg: 'rgba(245,158,11,0.10)' },
];

const INVOICE_ROWS = [
  { name: 'Acme Corp',          amount: '₹25,900', status: 'Paid',    statusColor: '#10b981', statusBg: 'rgba(16,185,129,0.12)' },
  { name: 'Sharma Enterprises', amount: '₹12,400', status: 'Sent',    statusColor: '#6366f1', statusBg: 'rgba(99,102,241,0.12)' },
  { name: 'Patel Industries',   amount: '₹8,500',  status: 'Draft',   statusColor: '#94a3b8', statusBg: 'rgba(148,163,184,0.10)' },
  { name: 'Gupta Retail',       amount: '₹31,000', status: 'Overdue', statusColor: '#f43f5e', statusBg: 'rgba(244,63,94,0.12)'  },
];

const CHART_BARS = [38, 55, 44, 72, 56, 84, 68, 92, 60, 78, 95, 82];
const CHART_MONTHS = ['J','F','M','A','M','J','J','A','S','O','N','D'];

const FEATURE_PILLS = [
  { icon: FileText,     label: 'GST Invoicing' },
  { icon: Package,      label: 'Stock Inventory' },
  { icon: IndianRupee,  label: 'Payment Tracking' },
  { icon: BarChart3,    label: 'Smart Reports' },
  { icon: Users,        label: 'Customer Management' },
  { icon: CheckCircle,  label: 'PDF & Excel Export' },
];

/* ─── Animation variants ─────────────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
});

export default function GSTInvoiceHero() {
  const particles = useMemo(() => generateParticles(50), []);
  const router = useRouter();

  const handleLaunchApp = useCallback(() => {
    router.push(isAuthenticated() ? '/dashboard' : '/auth/register');
  }, [router]);

  return (
    <section className="relative overflow-hidden" style={{ background: 'linear-gradient(155deg, #ffffff 0%, #f5f3ff 35%, #ede9fe 65%, #faf5ff 100%)' }}>

      {/* ── Background decorations ─────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Radial orb — top left */}
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, rgba(167,139,250,0.06) 45%, transparent 68%)' }}
        />
        {/* Radial orb — top right */}
        <div
          className="absolute -top-20 right-0 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, rgba(129,140,248,0.05) 45%, transparent 68%)' }}
        />
        {/* Radial orb — bottom center */}
        <div
          className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(167,139,250,0.12) 0%, transparent 65%)' }}
        />
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(rgba(99,102,241,0.18) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        {/* Fade edges of grid */}
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 30%, rgba(250,245,255,0.92) 85%, #faf5ff 100%)' }}
        />
        {/* Animated light particles */}
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: p.id % 3 === 0 ? 'rgba(139,92,246,0.5)' : p.id % 3 === 1 ? 'rgba(99,102,241,0.45)' : 'rgba(167,139,250,0.4)',
              opacity: p.opacity,
              animation: `gstParticleFloat ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
            }}
          />
        ))}
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-20 lg:pt-28 lg:pb-24">
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">

          {/* ── LEFT: copy + CTAs ─────────────────────────────────────────── */}
          <div className="text-center lg:text-left">

            {/* Badge */}
            <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2 mb-8">
              <span
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold"
                style={{
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.10) 100%)',
                  border: '1px solid rgba(139,92,246,0.30)',
                  color: '#6d28d9',
                  boxShadow: '0 1px 12px rgba(139,92,246,0.10)',
                }}
              >
                <Zap className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#7c3aed' }} />
                GST Invoice Tool
              </span>
            </motion.div>

            {/* H1 */}
            <motion.h1
              {...fadeUp(0.08)}
              className="text-[2.6rem] sm:text-5xl lg:text-[3.2rem] xl:text-[3.6rem] font-extrabold tracking-tight leading-[1.08] mb-6 text-gray-900"
            >
              Professional GST Billing,{' '}
              <span
                className="inline-block bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(95deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)',
                  backgroundSize: '200% auto',
                  animation: 'gstGradientShimmer 4s linear infinite',
                }}
              >
                Built for Indian Businesses
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              {...fadeUp(0.18)}
              className="text-lg sm:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0 mb-4 leading-relaxed"
            >
              Generate invoices in seconds, export PDF & Excel files, manage stock inventory, track payments, and access smart business reports — all in one powerful platform.
            </motion.p>

            {/* Supporting line */}
            <motion.p
              {...fadeUp(0.24)}
              className="text-sm text-gray-500 max-w-lg mx-auto lg:mx-0 mb-10 font-medium"
            >
              Built for retailers, wholesalers, service providers, and growing businesses.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              {...fadeUp(0.32)}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12"
            >
              {/* Primary — Launch App */}
              <button
                onClick={handleLaunchApp}
                className="gst-launch-btn group relative inline-flex items-center justify-center gap-2.5 rounded-2xl px-8 py-4 text-base font-bold text-white overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #9333ea 100%)',
                  boxShadow: '0 0 0 1px rgba(99,102,241,0.5), 0 8px 32px rgba(79,70,229,0.40), 0 2px 8px rgba(79,70,229,0.25)',
                  transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                {/* shimmer overlay */}
                <span
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{
                    background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.25) 50%, transparent 65%)',
                    backgroundSize: '200% 100%',
                    animation: 'gstBtnShimmer 2.8s ease-in-out infinite',
                  }}
                />
                <Rocket className="relative flex-shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-12" style={{ height: '18px', width: '18px' }} />
                <span className="relative">Launch App</span>
                <ArrowRight className="relative h-4 w-4 flex-shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>

              {/* Secondary — View Dashboard */}
              <Link
                href="/dashboard"
                className="group relative inline-flex items-center justify-center gap-2.5 rounded-2xl px-8 py-4 text-base font-semibold overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.70)',
                  backdropFilter: 'blur(12px)',
                  border: '1.5px solid rgba(139,92,246,0.28)',
                  color: '#4c1d95',
                  boxShadow: '0 2px 12px rgba(139,92,246,0.08), 0 1px 3px rgba(0,0,0,0.06)',
                  transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                <BarChart3 className="h-4 w-4 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                View Dashboard
              </Link>
            </motion.div>

            {/* Feature pills */}
            <motion.div
              {...fadeUp(0.44)}
              className="flex flex-wrap gap-2.5 justify-center lg:justify-start"
            >
              {FEATURE_PILLS.map(pill => (
                <span
                  key={pill.label}
                  className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold"
                  style={{
                    background: 'rgba(255,255,255,0.75)',
                    border: '1px solid rgba(139,92,246,0.20)',
                    color: '#5b21b6',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 1px 4px rgba(139,92,246,0.08)',
                  }}
                >
                  <pill.icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#7c3aed' }} />
                  {pill.label}
                </span>
              ))}
            </motion.div>
          </div>

          {/* ── RIGHT: Dashboard mockup ────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 36, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative hidden lg:block"
            style={{ animation: 'gstMockupFloat 6s ease-in-out infinite' }}
          >
            {/* Ambient glow */}
            <div
              className="absolute inset-0 -m-8 rounded-[36px] pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 80% 65% at 50% 50%, rgba(99,102,241,0.18) 0%, transparent 70%)' }}
            />

            {/* Dashboard card */}
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(160deg, #ffffff 0%, #faf5ff 100%)',
                border: '1px solid rgba(139,92,246,0.18)',
                boxShadow: '0 0 0 1px rgba(99,102,241,0.10), 0 24px 64px rgba(99,102,241,0.16), 0 8px 24px rgba(0,0,0,0.06)',
              }}
            >
              {/* Browser chrome */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b" style={{ borderColor: 'rgba(139,92,246,0.12)', background: 'rgba(250,245,255,0.80)' }}>
                <div className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                <div
                  className="ml-3 flex-1 rounded-md px-3 py-1 text-[10px] font-mono tracking-wide"
                  style={{ background: 'rgba(139,92,246,0.08)', color: 'rgba(109,40,217,0.55)' }}
                >
                  app.yantrixlab.com/invoices
                </div>
              </div>

              <div className="p-5 space-y-3">
                {/* 4 metric cards */}
                <div className="grid grid-cols-2 gap-2.5">
                  {STAT_CARDS.map(s => (
                    <div
                      key={s.label}
                      className="rounded-xl p-3.5"
                      style={{
                        background: s.bg,
                        border: `1px solid ${s.accent}22`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{s.label}</p>
                        <s.icon className="h-3 w-3 flex-shrink-0" style={{ color: s.accent }} />
                      </div>
                      <p className="text-[15px] font-extrabold text-gray-800 leading-none">{s.value}</p>
                      <p className="text-[10px] mt-1 font-semibold" style={{ color: s.accent }}>{s.change} this month</p>
                    </div>
                  ))}
                </div>

                {/* Mini bar chart */}
                <div
                  className="rounded-xl p-3.5"
                  style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.10)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-semibold text-gray-600">Revenue Overview</p>
                    <span
                      className="text-[9.5px] font-bold px-2 py-0.5 rounded-full"
                      style={{ color: '#059669', background: 'rgba(16,185,129,0.12)' }}
                    >↑ +18.2%</span>
                  </div>
                  <div className="flex items-end gap-1 h-[44px]">
                    {CHART_BARS.map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-sm"
                        style={{
                          height: `${h}%`,
                          background: i === 11
                            ? 'linear-gradient(to top, #4f46e5, #7c3aed)'
                            : 'rgba(99,102,241,0.22)',
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1.5">
                    {CHART_MONTHS.map((m, i) => (
                      <span key={i} className="flex-1 text-center text-[8px] text-gray-300">{m}</span>
                    ))}
                  </div>
                </div>

                {/* Recent invoices */}
                <div
                  className="rounded-xl p-3.5"
                  style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.10)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-semibold text-gray-600">Recent Invoices</p>
                    <span className="text-[9px] font-semibold text-indigo-500">View all →</span>
                  </div>
                  <div className="space-y-2.5">
                    {INVOICE_ROWS.map(inv => (
                      <div key={inv.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-5 w-5 rounded-md flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(99,102,241,0.12)' }}
                          >
                            <FileText className="h-2.5 w-2.5 text-indigo-500" />
                          </div>
                          <span className="text-[11px] font-medium text-gray-700">{inv.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-gray-800">{inv.amount}</span>
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ color: inv.statusColor, background: inv.statusBg }}
                          >
                            {inv.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Export quick actions */}
                <div className="flex gap-2">
                  {['Export PDF', 'Export Excel'].map(label => (
                    <div
                      key={label}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[10px] font-semibold cursor-pointer"
                      style={{
                        background: label === 'Export PDF'
                          ? 'linear-gradient(135deg, rgba(239,68,68,0.10) 0%, rgba(239,68,68,0.06) 100%)'
                          : 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.06) 100%)',
                        border: label === 'Export PDF' ? '1px solid rgba(239,68,68,0.20)' : '1px solid rgba(16,185,129,0.20)',
                        color: label === 'Export PDF' ? '#dc2626' : '#059669',
                      }}
                    >
                      {label === 'Export PDF' ? '📄' : '📊'} {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating badge — GST Compliant */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.85, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              className="absolute -top-4 -left-6 flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold whitespace-nowrap"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(250,245,255,0.95) 100%)',
                border: '1px solid rgba(139,92,246,0.25)',
                boxShadow: '0 4px 20px rgba(139,92,246,0.18)',
                color: '#6d28d9',
                backdropFilter: 'blur(8px)',
                animation: 'gstParticleFloat 4.5s ease-in-out infinite alternate',
              }}
            >
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
              GST Compliant
            </motion.div>

            {/* Floating badge — PDF Export */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.0, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              className="absolute bottom-10 -right-8 flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold whitespace-nowrap"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(239,246,255,0.95) 100%)',
                border: '1px solid rgba(99,102,241,0.25)',
                boxShadow: '0 4px 20px rgba(99,102,241,0.16)',
                color: '#4338ca',
                backdropFilter: 'blur(8px)',
                animation: 'gstParticleFloat 5.2s ease-in-out 1.2s infinite alternate',
              }}
            >
              <FileText className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
              Instant PDF Export
            </motion.div>
          </motion.div>

        </div>
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.85))' }}
      />
    </section>
  );
}
