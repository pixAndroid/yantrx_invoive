'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, ArrowRight, X, Loader2, AlertCircle,
  Shield, LayoutDashboard, Menu
} from 'lucide-react';
import { isAuthenticated, getUserData, apiFetch } from '@/lib/api';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  dailyPrice: number | null;
  yearlyPrice: number | null;
  currency: string;
  invoiceLimit: number;
  customerLimit: number;
  userLimit: number;
  features: string[];
  isFeatured: boolean;
}

declare global {
  interface Window { Razorpay: any; }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/** Returns the display price and period label for a plan based on its billing type. */
function getPlanDisplayPrice(plan: Plan): { amount: number; period: string; invoicePeriod: string } {
  const slug = plan.slug.toLowerCase();
  if (slug === 'daily') {
    return { amount: plan.dailyPrice ?? plan.price, period: '/day', invoicePeriod: 'day' };
  }
  if (slug === 'yearly' || slug === 'yealty') {
    return { amount: plan.yearlyPrice ?? plan.price, period: '/yr', invoicePeriod: 'year' };
  }
  return { amount: plan.price, period: '/mo', invoicePeriod: 'month' };
}

const NAV_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/tools', label: 'Tools' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [initials, setInitials] = useState('U');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Payment modal state
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentError, setPaymentError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    // Load plans
    apiFetch<{ data: Plan[] }>('/plans')
      .then(res => setPlans(res.data || []))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));

    // Check auth — use only JWT token data to avoid hitting the rate-limited /auth/me
    if (!isAuthenticated()) return;
    setLoggedIn(true);
    const tokenData = getUserData();
    const displayName = tokenData.name || 'User';
    setInitials(displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2));
  }, []);

  const handlePlanClick = (plan: Plan) => {
    if (plan.name === 'Business') {
      window.location.href = '/contact';
      return;
    }
    if (!loggedIn) {
      window.location.href = '/auth/register';
      return;
    }
    if (plan.price === 0 && !plan.dailyPrice && !plan.yearlyPrice) {
      window.location.href = '/dashboard';
      return;
    }
    setPaymentError('');
    setPaymentSuccess(false);
    setSelectedPlan(plan);
  };

  const handlePayment = async () => {
    if (!selectedPlan) return;
    setPaymentLoading(true);
    setPaymentError('');

    try {
      const orderRes = await apiFetch<{ data: { orderId: string; amount: number; currency: string; keyId: string } }>(
        '/subscriptions/razorpay-order',
        { method: 'POST', body: JSON.stringify({ planId: selectedPlan.id }) }
      );

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setPaymentError('Failed to load payment gateway. Please try again.');
        setPaymentLoading(false);
        return;
      }

      const { orderId, amount, currency, keyId } = orderRes.data;
      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        name: 'Yantrix',
        description: `${selectedPlan.name} Plan Subscription`,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            await apiFetch('/subscriptions/verify-payment', {
              method: 'POST',
              body: JSON.stringify({
                planId: selectedPlan.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            setPaymentSuccess(true);
            setPaymentLoading(false);
            setTimeout(() => { window.location.href = '/dashboard'; }, 2000);
          } catch {
            setPaymentError('Payment verification failed. Please contact support.');
            setPaymentLoading(false);
          }
        },
        prefill: {},
        theme: { color: '#6366f1' },
        modal: {
          ondismiss: () => { setPaymentLoading(false); },
        },
      });
      rzp.open();
    } catch {
      setPaymentError('Failed to initiate payment. Please try again.');
      setPaymentLoading(false);
    }
  };

  const planColors: Record<string, string> = {
    free: 'border-gray-200',
    starter: 'border-blue-300',
    pro: 'border-indigo-500 shadow-xl shadow-indigo-100',
    business: 'border-purple-400',
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="container-wide">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <img src="/yeantrix-labs-logo.svg" alt="Yantrix" className="h-8 w-8 rounded-lg" />
              <span className="text-xl font-bold text-gray-900">Yantrix</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map(link => (
                <Link key={link.href} href={link.href} className={`text-sm font-medium transition-colors ${link.href === '/pricing' ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'}`}>
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              {loggedIn ? (
                <>
                  <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 px-4 py-2">
                    <LayoutDashboard className="h-4 w-4" />Dashboard
                  </Link>
                  <Link href="/dashboard" className="flex-shrink-0">
                    <div className="h-9 w-9 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ring-2 ring-indigo-200 hover:ring-indigo-400 transition-all">
                      <span className="text-white text-xs font-bold">{initials}</span>
                    </div>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="text-sm font-medium text-gray-700 hover:text-gray-900 px-4 py-2">Log in</Link>
                  <Link href="/auth/register" className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
                    Get Started Free <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </>
              )}
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

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
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{initials}</span>
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

      {/* Hero */}
      <section className="pt-32 pb-16 text-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h1>
          <p className="text-xl text-gray-600 max-w-xl mx-auto">
            Start free, upgrade when you need to. All plans include a 14-day free trial.
          </p>
          {loggedIn && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-4 py-2 text-sm font-medium text-green-700">
              <CheckCircle className="h-4 w-4" /> You&apos;re logged in — select a plan to upgrade instantly
            </div>
          )}
        </motion.div>
      </section>

      {/* Plans */}
      <section className="pb-24 px-4">
        <div className="container-wide">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-96 rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : plans.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
              {plans.map((plan, idx) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className={`relative rounded-2xl border-2 bg-white p-6 ${planColors[plan.slug] || 'border-gray-200'} ${plan.isFeatured ? 'shadow-xl shadow-indigo-100' : 'shadow-sm'}`}
                >
                  {plan.isFeatured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-900">Most Popular</span>
                    </div>
                  )}

                  <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{plan.description}</p>

                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      ₹{getPlanDisplayPrice(plan).amount}
                    </span>
                    <span className="text-sm text-gray-500">{getPlanDisplayPrice(plan).period}</span>
                  </div>

                  <button
                    onClick={() => handlePlanClick(plan)}
                    className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all mb-6 ${plan.isFeatured
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {plan.name === 'Business'
                      ? 'Contact Sales'
                      : loggedIn && getPlanDisplayPrice(plan).amount > 0
                        ? 'Upgrade Now'
                        : loggedIn && getPlanDisplayPrice(plan).amount === 0
                          ? 'Go to Dashboard'
                          : getPlanDisplayPrice(plan).amount === 0
                            ? 'Get Started Free'
                            : 'Start Free Trial'}
                  </button>

                  <ul className="space-y-2.5">
                    <li className="text-sm text-gray-600">
                      {plan.invoiceLimit >= 999999 ? 'Unlimited' : plan.invoiceLimit} invoices/{getPlanDisplayPrice(plan).invoicePeriod}
                    </li>
                    <li className="text-sm text-gray-600">
                      {plan.customerLimit >= 999999 ? 'Unlimited' : plan.customerLimit} customers
                    </li>
                    <li className="text-sm text-gray-600">{plan.userLimit} team members</li>
                    {(plan.features as string[]).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          ) : (
            /* Fallback static plans if API returns empty */
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'Free', price: '₹0', desc: 'Perfect for freelancers', features: ['5 invoices/month', '10 customers', 'Basic GST reports', 'PDF download', 'Email support'], featured: false },
                { name: 'Starter', price: '₹149', desc: 'For growing businesses', features: ['100 invoices/month', '200 customers', '2 team members', 'GST reports', 'Email invoices', 'Payment tracking'], featured: false },
                { name: 'Pro', price: '₹299', desc: 'Most popular choice', features: ['500 invoices/month', 'Unlimited customers', '5 team members', 'Advanced GST reports', 'GSTR filing help', 'Multi-branch'], featured: true },
                { name: 'Business', price: '₹599', desc: 'For large enterprises', features: ['Unlimited invoices', 'Unlimited customers', '20 team members', 'Full GST suite', 'API access', 'White-label'], featured: false },
              ].map((plan, idx) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className={`relative rounded-2xl border-2 p-6 ${plan.featured ? 'border-indigo-500 bg-indigo-600 shadow-xl' : 'border-gray-200 bg-white shadow-sm'}`}
                >
                  {plan.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-900">Most Popular</span>
                    </div>
                  )}
                  <h3 className={`text-lg font-bold mb-1 ${plan.featured ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                  <p className={`text-sm mb-4 ${plan.featured ? 'text-indigo-200' : 'text-gray-500'}`}>{plan.desc}</p>
                  <div className="mb-6">
                    <span className={`text-4xl font-bold ${plan.featured ? 'text-white' : 'text-gray-900'}`}>{plan.price}</span>
                    <span className={`text-sm ${plan.featured ? 'text-indigo-200' : 'text-gray-500'}`}>/month</span>
                  </div>
                  <Link
                    href={plan.name === 'Business' ? '/contact' : loggedIn ? '/settings/billing' : '/auth/register'}
                    className={`block w-full rounded-xl py-2.5 text-center text-sm font-semibold mb-6 ${plan.featured ? 'bg-white text-indigo-600 hover:bg-indigo-50' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                  >
                    {plan.name === 'Business' ? 'Contact Sales' : loggedIn ? 'Upgrade Now' : plan.name === 'Free' ? 'Get Started Free' : 'Start Free Trial'}
                  </Link>
                  <ul className="space-y-2.5">
                    {plan.features.map((f, i) => (
                      <li key={i} className={`flex items-start gap-2 text-sm ${plan.featured ? 'text-indigo-100' : 'text-gray-600'}`}>
                        <CheckCircle className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${plan.featured ? 'text-indigo-300' : 'text-green-500'}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trust badges */}
      <section className="py-12 border-t border-gray-100 bg-gray-50">
        <div className="container-wide">
          <div className="flex flex-wrap justify-center gap-8 text-center">
            {[
              { icon: Shield, title: 'GST Compliant', desc: 'Fully compliant with Indian GST laws' },
              { icon: CheckCircle, title: '14-day Free Trial', desc: 'Try any paid plan risk-free' },
              { icon: ArrowRight, title: 'Cancel Anytime', desc: 'No lock-in contracts' },
            ].map(item => (
              <div key={item.title} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Confirmation Modal */}
      <AnimatePresence>
        {selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!paymentLoading) setSelectedPlan(null); }}
              className="absolute inset-0 bg-gray-900/60"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <button
                onClick={() => { if (!paymentLoading) setSelectedPlan(null); }}
                disabled={paymentLoading}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>

              {paymentSuccess ? (
                <div className="text-center py-6">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
                  <p className="text-gray-600 text-sm">Your {selectedPlan.name} plan is now active. Redirecting to dashboard…</p>
                </div>
              ) : (
                <>
                  <div className="mb-5">
                    <h2 className="text-xl font-bold text-gray-900">Confirm Purchase</h2>
                    <p className="text-sm text-gray-500 mt-1">You&apos;re about to subscribe to the {selectedPlan.name} plan</p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 mb-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-gray-900">{selectedPlan.name} Plan</span>
                      <span className="text-xl font-bold text-indigo-600">₹{getPlanDisplayPrice(selectedPlan).amount}<span className="text-sm font-normal text-gray-500">{getPlanDisplayPrice(selectedPlan).period}</span></span>
                    </div>
                    <ul className="space-y-1.5">
                      <li className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                        {selectedPlan.invoiceLimit >= 999999 ? 'Unlimited' : selectedPlan.invoiceLimit} invoices/{getPlanDisplayPrice(selectedPlan).invoicePeriod}
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                        {selectedPlan.customerLimit >= 999999 ? 'Unlimited' : selectedPlan.customerLimit} customers
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                        {selectedPlan.userLimit} team members
                      </li>
                      {(selectedPlan.features as string[]).slice(0, 3).map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {paymentError && (
                    <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" /> {paymentError}
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5 text-gray-400" />
                    Secured by Razorpay. Your payment info is never stored on our servers.
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedPlan(null)}
                      disabled={paymentLoading}
                      className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePayment}
                      disabled={paymentLoading}
                      className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {paymentLoading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
                      ) : (
                        <>Pay ₹{getPlanDisplayPrice(selectedPlan).amount} <ArrowRight className="h-4 w-4" /></>
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
