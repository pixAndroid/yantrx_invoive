'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CreditCard, CheckCircle, ArrowRight, AlertCircle, Loader2, X, TrendingUp, History, Clock } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  dailyPrice: number | null;
  yearlyPrice: number | null;
  invoiceLimit: number;
  customerLimit: number;
  userLimit: number;
  features: string[];
  isFeatured: boolean;
}

interface Subscription {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  amount: number;
  plan: Plan;
  createdAt?: string;
}

interface UsageStats {
  invoicesThisMonth: number;
  activeCustomers: number;
}

declare global {
  interface Window {
    Razorpay: any;
  }
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

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSub, setCurrentSub] = useState<Subscription | null>(null);
  const [allSubs, setAllSubs] = useState<Subscription[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch<{ data: Plan[] }>('/plans').catch(() => ({ data: [] })),
      apiFetch<{ data: Subscription[] }>('/subscriptions').catch(() => ({ data: [] })),
      apiFetch<{ data: UsageStats }>('/business/stats').catch(() => ({ data: null as any })),
    ]).then(([plansRes, subsRes, statsRes]) => {
      setPlans(plansRes.data || []);
      const subs = subsRes.data || [];
      // Compute effective status: treat ACTIVE/TRIAL as EXPIRED when endDate has passed
      const now = new Date();
      const effectiveSubs = subs.map(s =>
        (s.status === 'ACTIVE' || s.status === 'TRIAL') && new Date(s.endDate) < now
          ? { ...s, status: 'EXPIRED' }
          : s
      );
      setAllSubs(effectiveSubs);
      // Prefer active/trial; fall back to most recent expired sub so we can show the expired banner
      const activeSub = effectiveSubs.find(s => s.status === 'ACTIVE' || s.status === 'TRIAL')
        || effectiveSubs.find(s => s.status === 'EXPIRED')
        || null;
      setCurrentSub(activeSub);
      setUsage(statsRes.data || null);
    }).finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (plan: Plan) => {
    const { amount: planAmount } = getPlanDisplayPrice(plan);
    if (planAmount === 0) {
      // Free plan - direct upgrade
      try {
        setUpgrading(plan.id);
        await apiFetch('/subscriptions', { method: 'POST', body: JSON.stringify({ planId: plan.id }) });
        window.location.reload();
      } catch (err: any) {
        setError(err.message);
      } finally { setUpgrading(null); }
      return;
    }

    setUpgrading(plan.id);
    setError('');
    try {
      // Create Razorpay order
      const orderRes = await apiFetch<{ data: { orderId: string; amount: number; currency: string; keyId: string; prefill: { name: string; email: string; contact: string } } }>(
        '/subscriptions/razorpay-order',
        { method: 'POST', body: JSON.stringify({ planId: plan.id }) }
      );

      const loaded = await loadRazorpayScript();
      if (!loaded) { setError('Failed to load payment gateway. Please try again.'); return; }

      const { orderId, amount, currency, keyId, prefill } = orderRes.data;
      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        name: 'Yantrix',
        description: `${plan.name} Plan Subscription`,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            await apiFetch('/subscriptions/verify-payment', {
              method: 'POST',
              body: JSON.stringify({
                planId: plan.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            window.location.reload();
          } catch (e: any) {
            setError('Payment verification failed. Please contact support.');
          }
        },
        prefill: prefill || {},
        theme: { color: '#6366f1' },
        modal: { ondismiss: () => setUpgrading(null) },
      });
      rzp.open();
    } catch (err: any) {
      // Fallback: if Razorpay order creation isn't supported yet, use direct upgrade
      if (err.message?.includes('404') || err.message?.includes('razorpay')) {
        try {
          await apiFetch('/subscriptions', { method: 'POST', body: JSON.stringify({ planId: plan.id }) });
          window.location.reload();
        } catch (e: any) { setError(e.message); }
      } else {
        setError(err.message || 'Failed to initiate payment');
      }
    } finally {
      setUpgrading(null);
    }
  };

  const isExpired = currentSub?.status === 'EXPIRED';
  const isActive = currentSub?.status === 'ACTIVE' || currentSub?.status === 'TRIAL';

  const invoicesUsed = usage?.invoicesThisMonth ?? 0;
  const invoiceLimit = isActive ? (currentSub?.plan.invoiceLimit ?? 0) : 0;
  const invoiceUsagePct = invoiceLimit > 0 ? Math.min(100, (invoicesUsed / invoiceLimit) * 100) : 0;
  const isOverLimit = invoiceLimit > 0 && invoicesUsed >= invoiceLimit;
  const isNearLimit = !isOverLimit && invoiceLimit > 0 && invoicesUsed / invoiceLimit >= 0.8;

  const statusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full"><CheckCircle className="h-3 w-3" />Active</span>;
      case 'TRIAL': return <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full"><Clock className="h-3 w-3" />Trial</span>;
      case 'EXPIRED': return <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full"><AlertCircle className="h-3 w-3" />Expired</span>;
      case 'CANCELLED': return <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full"><X className="h-3 w-3" />Cancelled</span>;
      default: return <span className="text-xs text-gray-500">{status}</span>;
    }
  };

  const defaultAccent = { border: 'border-indigo-300', badge: 'bg-indigo-100 text-indigo-700', btn: 'bg-indigo-600 hover:bg-indigo-700', stripe: 'bg-indigo-500', glow: 'shadow-indigo-100', text: 'text-indigo-600', bg: 'bg-indigo-50' };
  const planAccents: Record<string, { border: string; badge: string; btn: string; stripe: string; glow: string; text: string; bg: string }> = {
    daily:    { border: 'border-amber-300',   badge: 'bg-amber-100 text-amber-700',   btn: 'bg-amber-500 hover:bg-amber-600',   stripe: 'bg-amber-400',   glow: 'shadow-amber-100',   text: 'text-amber-600',   bg: 'bg-amber-50' },
    starter:  { border: 'border-blue-300',    badge: 'bg-blue-100 text-blue-700',     btn: 'bg-blue-600 hover:bg-blue-700',     stripe: 'bg-blue-500',    glow: 'shadow-blue-100',    text: 'text-blue-600',    bg: 'bg-blue-50' },
    pro:      { border: 'border-indigo-500',  badge: 'bg-indigo-600 text-white',      btn: 'bg-indigo-600 hover:bg-indigo-700', stripe: 'bg-indigo-500',  glow: 'shadow-indigo-200',  text: 'text-indigo-600',  bg: 'bg-indigo-50' },
    business: { border: 'border-purple-400',  badge: 'bg-purple-100 text-purple-700', btn: 'bg-purple-600 hover:bg-purple-700', stripe: 'bg-purple-500',  glow: 'shadow-purple-100',  text: 'text-purple-600',  bg: 'bg-purple-50' },
    yearly:   { border: 'border-teal-400',    badge: 'bg-teal-100 text-teal-700',     btn: 'bg-teal-600 hover:bg-teal-700',     stripe: 'bg-teal-500',    glow: 'shadow-teal-100',    text: 'text-teal-600',    bg: 'bg-teal-50' },
  };

  return (
    <div className="min-h-full">
      {/* ── Page Header Banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 px-6 py-8 lg:px-10">
        <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-white/5" />
        <div className="absolute top-6 right-32 w-24 h-24 rounded-full bg-white/5" />
        <div className="absolute bottom-0 left-1/3 w-64 h-32 rounded-full bg-purple-800/30 blur-2xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/15 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg">
              <CreditCard className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Billing &amp; Plans</h1>
              <p className="text-indigo-200 text-sm mt-0.5">Manage your subscription and payment details</p>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-6">
            {[['Secure Payments', CheckCircle], ['Cancel Anytime', CheckCircle], ['24/7 Support', CheckCircle]].map(([label, Icon]: any) => (
              <div key={label as string} className="flex items-center gap-1.5 text-xs text-indigo-200">
                <Icon className="h-4 w-4 text-green-400" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 lg:p-8">
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Expired plan banner */}
      {isExpired && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-300 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Your plan has expired</p>
            <p className="mt-0.5">Premium features are disabled. Please renew or upgrade your plan to continue creating invoices and using premium features.</p>
          </div>
        </div>
      )}

      {/* ── Current Plan Card ── */}
      {currentSub && (
        <div className={`mb-8 rounded-2xl border-2 overflow-hidden shadow-md ${isExpired ? 'border-red-200' : 'border-indigo-200'}`}>
          <div className={`px-6 py-5 ${isExpired ? 'bg-gradient-to-r from-red-50 to-rose-50' : 'bg-gradient-to-r from-indigo-50 via-indigo-100/60 to-purple-50'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${isExpired ? 'bg-red-100' : 'bg-indigo-600'}`}>
                  <CreditCard className={`h-6 w-6 ${isExpired ? 'text-red-600' : 'text-white'}`} />
                </div>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${isExpired ? 'text-red-500' : 'text-indigo-500'}`}>Current Plan</p>
                  <p className={`text-2xl font-bold mt-0.5 ${isExpired ? 'text-red-900' : 'text-gray-900'}`}>{currentSub.plan.name}</p>
                  <div className="mt-1">
                    {isActive ? (
                      <p className="text-sm text-indigo-600 flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" />Active · Renews {new Date(currentSub.endDate).toLocaleDateString('en-IN')}
                      </p>
                    ) : isExpired ? (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" />Expired on {new Date(currentSub.endDate).toLocaleDateString('en-IN')}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" />{currentSub.status}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <span className={`text-3xl font-extrabold ${isExpired ? 'text-red-700' : 'text-indigo-700'}`}>
                {currentSub.plan.price === 0 && !currentSub.plan.dailyPrice && !currentSub.plan.yearlyPrice
                  ? 'Free'
                  : (() => {
                      const { amount, period } = getPlanDisplayPrice(currentSub.plan);
                      return amount === 0 ? 'Free' : `₹${amount}${period}`;
                    })()}
            </span>
          </div>

          {/* Usage meters — only shown for active subscriptions */}
          {isActive && invoiceLimit > 0 && usage !== null && (
            <div className="mt-2 space-y-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-indigo-700 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Invoices this period
                  </span>
                  <span className={`text-xs font-semibold ${isOverLimit ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-indigo-700'}`}>
                    {invoicesUsed} / {invoiceLimit >= 999999 ? '∞' : invoiceLimit}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-indigo-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isOverLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-indigo-600'}`}
                    style={{ width: `${invoiceUsagePct}%` }}
                  />
                </div>
                {isOverLimit && (
                  <p className="mt-1 text-xs text-red-600 font-medium">Limit reached — upgrade to create more invoices</p>
                )}
                {isNearLimit && !isOverLimit && (
                  <p className="mt-1 text-xs text-amber-600">You're close to your invoice limit</p>
                )}
              </div>
              {currentSub.plan.customerLimit > 0 && currentSub.plan.customerLimit < 999999 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-indigo-600">Customers</span>
                  <span className="text-xs font-medium text-indigo-800">{usage.activeCustomers} / {currentSub.plan.customerLimit}</span>
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      )}

      {/* ── Available Plans ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Available Plans</h2>
          <p className="text-sm text-gray-500 mt-0.5">Choose the plan that works best for you</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-80 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* All plans in one row on large screens, scrollable on mobile */}
          <div className="overflow-x-auto -mx-1 px-1 pb-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 min-w-0">
              {plans.filter(p => p.slug !== 'free').map(plan => {
                const isCurrent = isActive && currentSub?.plan.id === plan.id;
                const isUpgrading = upgrading === plan.id;
                const accent = planAccents[plan.slug.toLowerCase()] ?? defaultAccent;
                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl border-2 bg-white flex flex-col transition-all duration-200 hover:-translate-y-0.5 ${
                      plan.isFeatured
                        ? `${accent.border} shadow-lg ${accent.glow}`
                        : isCurrent
                        ? 'border-green-300 shadow-md shadow-green-100'
                        : `${accent.border} shadow-sm hover:shadow-md`
                    }`}
                  >
                    {/* Colored top stripe */}
                    <div className={`h-1.5 rounded-t-xl ${plan.isFeatured ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : isCurrent ? 'bg-gradient-to-r from-green-400 to-emerald-500' : accent.stripe}`} />

                    <div className="p-5 flex flex-col flex-1">
                      {/* Badge row */}
                      <div className="flex items-center justify-between mb-3 min-h-[24px]">
                        {plan.isFeatured ? (
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${accent.badge}`} aria-label="Most Popular plan">
                            <span aria-hidden="true">★ </span>Most Popular
                          </span>
                        ) : isCurrent ? (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-green-100 text-green-700" aria-label="Current plan">
                            <span aria-hidden="true">✓ </span>Current
                          </span>
                        ) : <span />}
                      </div>

                      {/* Plan name */}
                      <h3 className="text-base font-bold text-gray-900 leading-tight">{plan.name}</h3>

                      {/* Price */}
                      <div className="flex items-baseline gap-0.5 mt-2 mb-4">
                        <span className={`text-2xl font-extrabold ${accent.text}`}>₹{getPlanDisplayPrice(plan).amount}</span>
                        <span className="text-xs text-gray-400 ml-0.5">{getPlanDisplayPrice(plan).period}</span>
                      </div>

                      {/* Limits */}
                      <div className={`rounded-xl px-3 py-2.5 mb-4 space-y-1.5 ${accent.bg}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Invoices</span>
                          <span className={`text-xs font-semibold ${accent.text}`}>
                            {plan.invoiceLimit >= 999999 ? '∞' : plan.invoiceLimit}/{getPlanDisplayPrice(plan).invoicePeriod}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Customers</span>
                          <span className={`text-xs font-semibold ${accent.text}`}>
                            {plan.customerLimit >= 999999 ? 'Unlimited' : plan.customerLimit}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Team</span>
                          <span className={`text-xs font-semibold ${accent.text}`}>{plan.userLimit} members</span>
                        </div>
                      </div>

                      {/* Features */}
                      <ul className="space-y-1.5 mb-5 flex-1">
                        {plan.features.slice(0, 4).map((f, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="leading-tight">{f}</span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      <button
                        onClick={() => !isCurrent && !upgrading && setSelectedPlan(plan)}
                        disabled={isCurrent || !!upgrading}
                        className={`w-full rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          isCurrent
                            ? 'bg-green-100 text-green-700 cursor-not-allowed'
                            : isExpired && currentSub?.plan.id === plan.id
                            ? 'bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-200'
                            : `${accent.btn} text-white shadow-sm disabled:opacity-60`
                        }`}
                      >
                        {isUpgrading ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                        ) : isCurrent ? (
                          <>✓ Active Plan</>
                        ) : isExpired && currentSub?.plan.id === plan.id ? (
                          <>Renew <ArrowRight className="h-4 w-4" /></>
                        ) : (
                          <>Upgrade <ArrowRight className="h-4 w-4" /></>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </>
      )}

      {/* ── Subscription History ── */}
      {allSubs.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowHistory(h => !h)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 mb-3 group"
          >
            <div className="p-1.5 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
              <History className="h-3.5 w-3.5" />
            </div>
            Subscription History
            <span className="ml-1 text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{allSubs.length}</span>
            <ArrowRight className={`h-3.5 w-3.5 text-gray-400 transition-transform ${showHistory ? 'rotate-90' : ''}`} />
          </button>
          {showHistory && (
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Start</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">End</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allSubs.map(sub => (
                    <tr key={sub.id} className="hover:bg-indigo-50/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-900">{sub.plan.name}</td>
                      <td className="px-4 py-3">{statusBadge(sub.status)}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(sub.startDate).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(sub.endDate).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-700">
                        {sub.amount > 0 ? `₹${sub.amount}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Plan Confirmation Modal ── */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            {/* Modal gradient header */}
            <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
              <button
                onClick={() => { setSelectedPlan(null); setError(''); }}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Confirm Upgrade</h2>
                  <p className="text-indigo-200 text-xs mt-0.5">Review your plan details before payment</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {selectedPlan.isFeatured && (
                <div className="inline-block text-xs font-bold bg-indigo-600 text-white px-2.5 py-0.5 rounded-full mb-3">
                  ★ Most Popular
                </div>
              )}

              <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5 mb-4">
                <div className="flex items-baseline justify-between mb-4">
                  <span className="text-lg font-bold text-indigo-900">{selectedPlan.name} Plan</span>
                  <span className="text-2xl font-bold text-indigo-900">₹{getPlanDisplayPrice(selectedPlan).amount}<span className="text-sm font-normal text-indigo-600">{getPlanDisplayPrice(selectedPlan).period}</span></span>
                </div>
                <ul className="space-y-2">
                  <li className="text-sm text-gray-700 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {selectedPlan.invoiceLimit >= 999999 ? 'Unlimited' : selectedPlan.invoiceLimit} invoices/{getPlanDisplayPrice(selectedPlan).invoicePeriod}
                  </li>
                  <li className="text-sm text-gray-700 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {selectedPlan.customerLimit >= 999999 ? 'Unlimited' : selectedPlan.customerLimit} customers
                  </li>
                  <li className="text-sm text-gray-700 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {selectedPlan.userLimit} team members
                  </li>
                  {selectedPlan.features.map((f, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {isOverLimit && currentSub && (
                <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 flex-shrink-0" />
                  Upgrading will reset your invoice count for the new billing period.
                </div>
              )}

              {error && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setSelectedPlan(null); setError(''); }}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpgrade(selectedPlan)}
                  disabled={!!upgrading}
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
                >
                  {upgrading === selectedPlan.id ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                  ) : (
                    <>Confirm &amp; Pay <ArrowRight className="h-4 w-4" /></>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
