'use client';

import { motion } from 'framer-motion';
import { Rss, Search } from 'lucide-react';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
}

export function BlogHero({ search, onSearchChange }: Props) {
  return (
    <section className="relative bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 text-white py-28 px-4 overflow-hidden">
      {/* Floating background glows */}
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-float pointer-events-none" />
      <div
        className="absolute -bottom-24 -right-16 w-[30rem] h-[30rem] bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"
        style={{ animation: 'float 8s ease-in-out 3s infinite' }}
      />
      <div
        className="absolute top-1/2 left-1/3 w-64 h-64 bg-violet-400/10 rounded-full blur-2xl pointer-events-none"
        style={{ animation: 'float 10s ease-in-out 1.5s infinite' }}
      />
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm text-indigo-200 mb-6">
            <Rss className="h-3.5 w-3.5 text-indigo-300" />
            Yantrix Labs Blog
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent"
        >
          Insights &amp; Ideas
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="text-lg md:text-xl text-indigo-200/90 mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          Discover tutorials, guides, product insights, and business growth ideas.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.3 }}
          className="relative max-w-lg mx-auto"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-300 pointer-events-none" />
          <input
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search articles..."
            className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-indigo-300/80 pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:border-indigo-400/80 focus:bg-white/15 text-base transition-all duration-200 shadow-lg"
          />
        </motion.div>
      </div>
    </section>
  );
}
