'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Sparkles } from 'lucide-react';

interface Props {
  /** Optional API endpoint for newsletter subscription */
  onSubscribe?: (email: string) => Promise<void>;
}

export function NewsletterCTA({ onSubscribe }: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!email || !emailRegex.test(email)) return;
    setStatus('loading');
    try {
      if (onSubscribe) {
        await onSubscribe(email);
      }
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <section className="mt-20 mb-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 rounded-3xl overflow-hidden px-8 md:px-16 py-14 text-white text-center shadow-2xl shadow-indigo-300/30"
      >
        {/* Background glows */}
        <div className="absolute -top-10 -left-10 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm text-indigo-100 mb-5">
            <Sparkles className="h-3.5 w-3.5" />
            Newsletter
          </div>

          <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Stay Updated</h2>
          <p className="text-indigo-100 text-lg mb-8 leading-relaxed">
            Get latest articles, tutorials and product insights delivered to your inbox.
          </p>

          {status === 'success' ? (
            <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl px-6 py-4 text-sm font-medium">
              🎉 You&apos;re subscribed! Check your inbox for a confirmation.
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <div className="flex-1 relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-300 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-white/15 backdrop-blur-sm border border-white/25 text-white placeholder-indigo-300 pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:bg-white/20 focus:border-white/40 transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="inline-flex items-center justify-center gap-2 bg-white text-indigo-700 font-bold px-6 py-3 rounded-xl text-sm hover:bg-indigo-50 transition-colors shadow-lg disabled:opacity-70 flex-shrink-0"
              >
                {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
                {status !== 'loading' && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          )}

          {status === 'error' && (
            <p className="mt-3 text-red-200 text-sm">
              Something went wrong. Please try again.
            </p>
          )}

          <p className="mt-4 text-indigo-300/70 text-xs">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
