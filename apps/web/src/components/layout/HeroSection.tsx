'use client';

import { useState, useEffect, useMemo } from 'react';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  FileText, BarChart3, Zap, ArrowRight, IndianRupee,
  Users, ShoppingCart, Building2, UtensilsCrossed, Car, MapPin,
  Menu, X, LayoutDashboard, TrendingUp, Briefcase,
} from 'lucide-react';
import { isSafeImageUrl } from '@/lib/api';

interface HomeHeader {
  badgeText: string;
  titleLine1: string;
  titleGradientText: string;
  description: string;
  primaryBtnLabel: string;
  secondaryBtnLabel: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
}

interface HeroSectionProps {
  homeHeader: HomeHeader;
  loggedIn: boolean;
  businessLogo: string | null;
  businessName: string | null;
  initials: string;
}

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/tools', label: 'Tools' },
  { href: '/services', label: 'Services' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

const FLOATING_PRODUCTS = [
  { icon: FileText,        label: 'GST Invoice',    color: '#a5b4fc', bg: 'rgba(99,102,241,0.14)',  border: 'rgba(129,140,248,0.28)' },
  { icon: Users,           label: 'Attendance',     color: '#6ee7b7', bg: 'rgba(16,185,129,0.13)',  border: 'rgba(52,211,153,0.28)' },
  { icon: ShoppingCart,    label: 'Ecommerce',      color: '#fcd34d', bg: 'rgba(245,158,11,0.13)',  border: 'rgba(251,191,36,0.28)' },
  { icon: Building2,       label: 'Hotel Booking',  color: '#93c5fd', bg: 'rgba(59,130,246,0.13)',  border: 'rgba(96,165,250,0.28)' },
  { icon: UtensilsCrossed, label: 'Restaurant POS', color: '#fca5a5', bg: 'rgba(239,68,68,0.13)',   border: 'rgba(248,113,113,0.28)' },
  { icon: Car,             label: 'Taxi Booking',   color: '#d8b4fe', bg: 'rgba(139,92,246,0.13)',  border: 'rgba(192,132,252,0.28)' },
  { icon: MapPin,          label: 'GPS Tracking',   color: '#67e8f9', bg: 'rgba(6,182,212,0.13)',   border: 'rgba(34,211,238,0.28)' },
  { icon: BarChart3,       label: 'CRM',            color: '#fdba74', bg: 'rgba(249,115,22,0.13)',  border: 'rgba(251,146,60,0.28)' },
  { icon: Briefcase,       label: 'HRMS',           color: '#f9a8d4', bg: 'rgba(236,72,153,0.13)',  border: 'rgba(244,114,182,0.28)' },
];

// Positions for floating pills around the dashboard card
const PILL_POSITIONS: CSSProperties[] = [
  { top: '-18px',  left: '18%' },
  { top: '8%',     right: '-22px' },
  { top: '42%',    right: '-24px' },
  { bottom: '14%', right: '-20px' },
  { bottom: '-18px', left: '38%' },
  { top: '26%',    left: '-26px' },
];

const PILL_FLOAT_DURATIONS = [4.2, 5.0, 4.6, 5.4, 4.8, 5.2];

const STAT_CARDS = [
  { label: 'Total Revenue',    value: '₹4,82,500', change: '+18%',  icon: IndianRupee, gradFrom: 'rgba(99,102,241,0.22)',  gradTo: 'rgba(139,92,246,0.14)',  accent: '#a5b4fc' },
  { label: 'Invoices Sent',    value: '247',        change: '+12',   icon: FileText,    gradFrom: 'rgba(16,185,129,0.22)',  gradTo: 'rgba(5,150,105,0.10)',   accent: '#6ee7b7' },
  { label: 'Active Clients',   value: '89',         change: '+5',    icon: Users,       gradFrom: 'rgba(59,130,246,0.22)',  gradTo: 'rgba(6,182,212,0.10)',   accent: '#93c5fd' },
  { label: 'Pending Amount',   value: '₹38,200',   change: '4 due', icon: TrendingUp,  gradFrom: 'rgba(245,158,11,0.22)',  gradTo: 'rgba(249,115,22,0.10)',  accent: '#fcd34d' },
];

const INVOICE_ROWS = [
  { name: 'Acme Corp',          amount: '₹25,900', status: 'Paid',  statusColor: '#6ee7b7', statusBg: 'rgba(16,185,129,0.15)' },
  { name: 'Sharma Enterprises', amount: '₹12,400', status: 'Sent',  statusColor: '#93c5fd', statusBg: 'rgba(59,130,246,0.15)' },
  { name: 'Patel Industries',   amount: '₹8,500',  status: 'Draft', statusColor: '#94a3b8', statusBg: 'rgba(148,163,184,0.10)' },
];

const CHART_BARS = [38, 62, 44, 78, 56, 88, 72, 94, 67, 82, 100, 78];
const CHART_MONTHS = ['J','F','M','A','M','J','J','A','S','O','N','D'];

function generateParticles(count: number) {
  // Deterministic-looking but varied values using a simple seeded pattern
  return Array.from({ length: count }, (_, i) => {
    const phi = (i * 2.399) % 1; // golden ratio spread
    const theta = (i * 0.618) % 1;
    return {
      id: i,
      x: phi * 100,
      y: theta * 100,
      size: (i % 4 === 0 ? 2.5 : i % 3 === 0 ? 1.8 : 1.2),
      opacity: 0.08 + (i % 7) * 0.04,
      duration: 4 + (i % 6) * 1.5,
      delay: (i % 12) * 0.9,
    };
  });
}

export default function HeroSection({ homeHeader, loggedIn, businessLogo, businessName, initials }: HeroSectionProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const particles = useMemo(() => generateParticles(55), []);

  const { scrollY } = useScroll();
  const bgY   = useTransform(scrollY, [0, 700], [0, 110]);
  const textY = useTransform(scrollY, [0, 700], [0, 55]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#060616]/90 backdrop-blur-2xl border-b border-white/[0.06] shadow-2xl shadow-black/30'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[68px] items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <img src="/yeantrix-labs-logo.svg" alt="Yantrix Labs" className="h-9 w-9 rounded-xl shadow-lg shadow-indigo-600/30 transition-shadow duration-200 group-hover:shadow-indigo-500/50" />
              <span className="text-[17px] font-bold text-white tracking-tight">Yantrix Labs</span>
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-0.5">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3.5 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.07] transition-all duration-150"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              {loggedIn ? (
                <>
                  <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-white/60 hover:text-white px-3 py-2 rounded-lg hover:bg-white/[0.07] transition-all duration-150">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link href="/dashboard" className="flex-shrink-0">
                    <div className="h-9 w-9 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ring-2 ring-indigo-400/25 hover:ring-indigo-400/55 transition-all">
                      {businessLogo && isSafeImageUrl(businessLogo)
                        ? <img src={businessLogo} alt={businessName || 'Business'} className="h-full w-full object-contain" />
                        : <span className="text-white text-xs font-bold">{initials}</span>
                      }
                    </div>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/dashboard" className="text-sm font-medium text-white/60 hover:text-white px-3 py-2 rounded-lg hover:bg-white/[0.07] transition-all duration-150">
                    Sign in
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white hover:from-indigo-500 hover:to-violet-500 transition-all duration-200 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 active:scale-[0.97]"
                  >
                    Get Started
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/[0.09] transition-all"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#07071a]/96 backdrop-blur-2xl border-t border-white/[0.07] px-4 py-4 space-y-0.5">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="block py-2.5 px-3 text-sm font-medium text-white/65 hover:text-white hover:bg-white/[0.07] rounded-lg transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 mt-2 border-t border-white/[0.08] space-y-2">
              {loggedIn ? (
                <Link href="/dashboard" className="flex items-center gap-2.5 py-2.5 px-3 text-sm font-medium text-white/65 rounded-lg hover:bg-white/[0.07]" onClick={() => setMobileMenuOpen(false)}>
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    {businessLogo && isSafeImageUrl(businessLogo)
                      ? <img src={businessLogo} alt={businessName || 'Business'} className="h-full w-full object-contain" />
                      : <span className="text-white text-[10px] font-bold">{initials}</span>
                    }
                  </div>
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/dashboard" className="block py-2.5 px-3 text-sm font-medium text-white/65 rounded-lg hover:bg-white/[0.07]" onClick={() => setMobileMenuOpen(false)}>
                    Sign in
                  </Link>
                  <Link href="/contact" className="block rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-600/25" onClick={() => setMobileMenuOpen(false)}>
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-[#040411]">

        {/* ── Background layers ── */}
        <motion.div className="absolute inset-0 pointer-events-none" style={{ y: bgY }}>
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#040411] via-[#06061a] to-[#040411]" />

          {/* Orb 1 — upper left */}
          <div
            className="absolute -top-60 -left-72 w-[900px] h-[900px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(67,56,202,0.22) 0%, rgba(79,70,229,0.07) 40%, transparent 68%)' }}
          />

          {/* Orb 2 — upper right */}
          <div
            className="absolute -top-32 right-[5%] w-[700px] h-[700px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(109,40,217,0.16) 0%, rgba(139,92,246,0.05) 42%, transparent 68%)' }}
          />

          {/* Orb 3 — bottom center glow */}
          <div
            className="absolute -bottom-48 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(55,48,163,0.18) 0%, transparent 65%)' }}
          />

          {/* Dot grid */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(rgba(255,255,255,0.13) 1px, transparent 1px)`,
              backgroundSize: '36px 36px',
            }}
          />
          {/* Fade edges of grid */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 30%, #040411 90%)',
            }}
          />

          {/* Animated data-stream lines (SVG) */}
          <svg
            className="absolute inset-0 w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="sg1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#6366f1" stopOpacity="0" />
                <stop offset="45%"  stopColor="#6366f1" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="sg2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#8b5cf6" stopOpacity="0" />
                <stop offset="55%"  stopColor="#8b5cf6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="sg3" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#4f46e5" stopOpacity="0" />
                <stop offset="50%"  stopColor="#4f46e5" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
              </linearGradient>
            </defs>
            <line x1="0" y1="22%" x2="100%" y2="22%" stroke="url(#sg1)" strokeWidth="0.6" className="hero-stream-line-1" />
            <line x1="0" y1="48%" x2="100%" y2="48%" stroke="url(#sg2)" strokeWidth="0.5" className="hero-stream-line-2" />
            <line x1="0" y1="68%" x2="100%" y2="68%" stroke="url(#sg3)" strokeWidth="0.5" className="hero-stream-line-1" />
            <line x1="0" y1="85%" x2="100%" y2="85%" stroke="url(#sg1)" strokeWidth="0.4" className="hero-stream-line-2" />
          </svg>

          {/* Particles */}
          {particles.map(p => (
            <div
              key={p.id}
              className="absolute rounded-full bg-white"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                opacity: p.opacity,
                animation: `heroParticleFloat ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
              }}
            />
          ))}
        </motion.div>

        {/* ── Content grid ── */}
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-24">
          <div className="grid lg:grid-cols-[1fr_1fr] xl:grid-cols-[1.05fr_0.95fr] gap-14 xl:gap-20 items-center">

            {/* ── LEFT: copy + CTAs + stats ── */}
            <motion.div className="text-center lg:text-left" style={{ y: textY }}>

              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-indigo-300 mb-8"
              >
                <Zap className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
                {homeHeader.badgeText}
              </motion.div>

              {/* H1 */}
              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="text-[2.85rem] sm:text-[3.5rem] lg:text-[3.8rem] xl:text-[4.1rem] font-extrabold tracking-tight leading-[1.07] mb-5"
              >
                <span className="text-white">{homeHeader.titleLine1}</span>
                <br />
                <span
                  className="inline-block bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(95deg, #a5b4fc 0%, #c084fc 50%, #818cf8 100%)' }}
                >
                  {homeHeader.titleGradientText}
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="text-[1.05rem] sm:text-lg text-white/50 max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed"
              >
                {homeHeader.description}
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.27, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start mb-14"
              >
                <Link
                  href="/tools"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.975]"
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    boxShadow: '0 0 0 1px rgba(99,102,241,0.4), 0 12px 40px rgba(79,70,229,0.38)',
                  }}
                >
                  {homeHeader.primaryBtnLabel}
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.14] bg-white/[0.05] backdrop-blur-sm px-8 py-4 text-base font-semibold text-white/80 hover:bg-white/[0.10] hover:border-white/[0.22] hover:text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.975]"
                >
                  {homeHeader.secondaryBtnLabel}
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-8 justify-center lg:justify-start"
              >
                {[
                  { value: homeHeader.stat1Value, label: homeHeader.stat1Label },
                  { value: homeHeader.stat2Value, label: homeHeader.stat2Label },
                  { value: homeHeader.stat3Value, label: homeHeader.stat3Label },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center gap-8">
                    {i > 0 && <div className="h-9 w-px bg-white/[0.10]" />}
                    <div className="flex flex-col">
                      <span
                        className="text-3xl sm:text-4xl font-black tracking-tight leading-none"
                        style={{ background: 'linear-gradient(135deg, #e0e7ff 0%, #c4b5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                      >
                        {stat.value}
                      </span>
                      <span className="text-[13px] text-white/40 mt-1 font-medium">{stat.label}</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* ── RIGHT: Dashboard mockup ── */}
            <motion.div
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.85, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative hidden lg:block"
            >
              {/* Ambient glow behind card */}
              <div
                className="absolute inset-0 -m-10 rounded-[40px]"
                style={{ background: 'radial-gradient(ellipse 75% 60% at 50% 50%, rgba(79,70,229,0.22) 0%, transparent 70%)' }}
              />

              {/* Dashboard card */}
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  background: 'linear-gradient(145deg, rgba(15,14,40,0.92) 0%, rgba(10,9,30,0.97) 100%)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 0 0 1px rgba(99,102,241,0.12), 0 32px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.06)',
                }}
              >
                {/* Browser chrome */}
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.07]">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]/70" />
                  <div className="ml-3 flex-1 rounded-md bg-white/[0.05] px-3 py-1 text-[10px] text-white/25 font-mono tracking-wide">
                    app.yantrixlab.com/dashboard
                  </div>
                </div>

                <div className="p-5 space-y-3.5">
                  {/* 4 metric cards */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {STAT_CARDS.map(s => (
                      <div
                        key={s.label}
                        className="rounded-xl p-3 border border-white/[0.06]"
                        style={{ background: `linear-gradient(135deg, ${s.gradFrom} 0%, ${s.gradTo} 100%)` }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[9.5px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.38)' }}>{s.label}</p>
                          <s.icon className="h-3 w-3 flex-shrink-0" style={{ color: s.accent }} />
                        </div>
                        <p className="text-[15px] font-bold text-white leading-none">{s.value}</p>
                        <p className="text-[10px] mt-1 font-semibold" style={{ color: s.accent }}>{s.change} this month</p>
                      </div>
                    ))}
                  </div>

                  {/* Mini bar chart */}
                  <div
                    className="rounded-xl p-3.5 border border-white/[0.06]"
                    style={{ background: 'rgba(255,255,255,0.025)' }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[11px] font-semibold text-white/55">Revenue Overview</p>
                      <span
                        className="text-[9.5px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ color: '#6ee7b7', background: 'rgba(16,185,129,0.15)' }}
                      >
                        ↑ +18.2%
                      </span>
                    </div>
                    <div className="flex items-end gap-1 h-[44px]">
                      {CHART_BARS.map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t-[3px]"
                          style={{
                            height: `${h}%`,
                            background: i === 11
                              ? 'linear-gradient(to top, #4f46e5, #7c3aed)'
                              : 'rgba(99,102,241,0.28)',
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between mt-1.5">
                      {CHART_MONTHS.map((m, i) => (
                        <span key={i} className="text-[8px] text-white/18 flex-1 text-center">{m}</span>
                      ))}
                    </div>
                  </div>

                  {/* Recent invoices */}
                  <div
                    className="rounded-xl p-3.5 border border-white/[0.06]"
                    style={{ background: 'rgba(255,255,255,0.025)' }}
                  >
                    <p className="text-[11px] font-semibold text-white/55 mb-3">Recent Invoices</p>
                    <div className="space-y-2.5">
                      {INVOICE_ROWS.map(inv => (
                        <div key={inv.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.18)' }}>
                              <FileText className="h-2.5 w-2.5 text-indigo-400" />
                            </div>
                            <span className="text-[11px] text-white/60">{inv.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-white/75">{inv.amount}</span>
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                              style={{ color: inv.statusColor, background: inv.statusBg }}
                            >
                              {inv.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating product pills */}
              {FLOATING_PRODUCTS.slice(0, PILL_POSITIONS.length).map((product, i) => (
                <motion.div
                  key={product.label}
                  initial={{ opacity: 0, scale: 0.75 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + i * 0.11, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                  className="absolute flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap backdrop-blur-md"
                  style={{
                    ...PILL_POSITIONS[i],
                    background: product.bg,
                    borderColor: product.border,
                    color: product.color,
                    boxShadow: `0 4px 20px ${product.bg}, 0 0 0 1px ${product.border}`,
                    animation: `heroParticleFloat ${PILL_FLOAT_DURATIONS[i]}s ease-in-out ${i * 0.6}s infinite alternate`,
                  }}
                >
                  <product.icon className="h-3.5 w-3.5 flex-shrink-0" />
                  {product.label}
                </motion.div>
              ))}
            </motion.div>

          </div>
        </div>

        {/* Bottom fade into next section */}
        <div
          className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(4,4,17,0.85))' }}
        />
      </section>
    </>
  );
}
