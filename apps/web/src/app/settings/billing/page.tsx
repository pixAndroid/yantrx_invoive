'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CreditCard, CheckCircle, ArrowRight, AlertCircle, Loader2, X, TrendingUp } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
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
  plan: Plan;
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

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSub, setCurrentSub] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<{ data: Plan[] }>('/plans').catch(() => ({ data: [] })),
      apiFetch<{ data: Subscription[] }>('/subscriptions').catch(() => ({ data: [] })),
      apiFetch<{ data: UsageStats }>('/business/stats').catch(() => ({ data: null as any })),
    ]).then(([plansRes, subsRes, statsRes]) => {
      setPlans(plansRes.data || []);
      const activeSub = (subsRes.data || []).find(s => s.status === 'ACTIVE' || s.status === 'TRIAL') || null;
      setCurrentSub(activeSub);
      setUsage(statsRes.data || null);
    }).finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (plan: Plan) => {
    if (plan.price === 0) {
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
      const orderRes = await apiFetch<{ data: { orderId: string; amount: number; currency: string; keyId: string } }>(
        '/subscriptions/razorpay-order',
        { method: 'POST', body: JSON.stringify({ planId: plan.id }) }
      );

      const loaded = await loadRazorpayScript();
      if (!loaded) { setError('Failed to load payment gateway. Please try again.'); return; }

      const { orderId, amount, currency, keyId } = orderRes.data;
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
        prefill: {},
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

  const planColors: Record<string, string> = {
    free: 'border-gray-200',
    starter: 'border-blue-300',
    pro: 'border-indigo-400',
    business: 'border-purple-400',
  };

  const invoicesUsed = usage?.invoicesThisMonth ?? 0;
  const invoiceLimit = currentSub?.plan.invoiceLimit ?? 0;
  const invoiceUsagePct = invoiceLimit > 0 ? Math.min(100, (invoicesUsed / invoiceLimit) * 100) : 0;
  const isOverLimit = invoiceLimit > 0 && invoicesUsed >= invoiceLimit;
  const isNearLimit = !isOverLimit && invoiceLimit > 0 && invoicesUsed / invoiceLimit >= 0.8;

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Billing &amp; Plans</h1>
        <p className="text-gray-500 mt-1">Manage your subscription and payment details</p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {currentSub && (
        <div className="mb-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-indigo-700">Current Plan</p>
              <p className="text-xl font-bold text-indigo-900 mt-1">{currentSub.plan.name}</p>
              <p className="text-sm text-indigo-600 mt-1">
                {currentSub.status === 'ACTIVE' ? (
                  <><CheckCircle className="inline h-3.5 w-3.5 mr-1" />Active · Renews {new Date(currentSub.endDate).toLocaleDateString('en-IN')}</>
                ) : (
                  <><AlertCircle className="inline h-3.5 w-3.5 mr-1" />{currentSub.status}</>
                )}
              </p>
            </div>
            <span className="text-2xl font-bold text-indigo-900">
              {currentSub.plan.price === 0 ? 'Free' : `₹${currentSub.plan.price}/mo`}
            </span>
          </div>

          {/* Usage meters */}
          {invoiceLimit > 0 && usage !== null && (
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
      )}

      {loading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-64 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : (
        <>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Available Plans</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {plans.filter(p => p.slug !== 'free').map(plan => {
              const isCurrent = currentSub?.plan.id === plan.id;
              const isUpgrading = upgrading === plan.id;
              return (
                <div key={plan.id} className={`rounded-2xl border-2 bg-white p-6 ${planColors[plan.slug] || 'border-gray-200'} ${plan.isFeatured ? 'shadow-lg' : 'shadow-sm'}`}>
                  {plan.isFeatured && (
                    <div className="inline-block text-xs font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full mb-3">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-2 mb-4">
                    <span className="text-3xl font-bold text-gray-900">₹{plan.price}</span>
                    <span className="text-gray-500">/mo</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    <li className="text-sm text-gray-600">
                      {plan.invoiceLimit >= 999999 ? 'Unlimited' : plan.invoiceLimit} invoices/month
                    </li>
                    <li className="text-sm text-gray-600">
                      {plan.customerLimit >= 999999 ? 'Unlimited' : plan.customerLimit} customers
                    </li>
                    <li className="text-sm text-gray-600">{plan.userLimit} team members</li>
                    {plan.features.slice(0, 3).map((f, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => !isCurrent && !upgrading && setSelectedPlan(plan)}
                    disabled={isCurrent || !!upgrading}
                    className={`w-full rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 ${
                      isCurrent
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60'
                    }`}
                  >
                    {isUpgrading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                    ) : isCurrent ? (
                      'Current Plan'
                    ) : (
                      <>Upgrade <ArrowRight className="h-4 w-4" /></>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-center">
            <Link href="/settings" className="text-sm text-gray-500 hover:text-gray-700">
              <CreditCard className="inline h-4 w-4 mr-1" />Contact us for custom enterprise pricing
            </Link>
          </div>
        </>
      )}

      {/* Plan Confirmation Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl p-8">
            <button
              onClick={() => { setSelectedPlan(null); setError(''); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-1">Confirm Upgrade</h2>
            <p className="text-sm text-gray-500 mb-6">Review your plan details before payment</p>

            {selectedPlan.isFeatured && (
              <div className="inline-block text-xs font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full mb-3">
                Most Popular
              </div>
            )}

            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5 mb-4">
              <div className="flex items-baseline justify-between mb-4">
                <span className="text-lg font-bold text-indigo-900">{selectedPlan.name} Plan</span>
                <span className="text-2xl font-bold text-indigo-900">₹{selectedPlan.price}<span className="text-sm font-normal text-indigo-600">/mo</span></span>
              </div>
              <ul className="space-y-2">
                <li className="text-sm text-gray-700 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  {selectedPlan.invoiceLimit >= 999999 ? 'Unlimited' : selectedPlan.invoiceLimit} invoices/month
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
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpgrade(selectedPlan)}
                disabled={!!upgrading}
                className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2"
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
      )}
    </div>
  );
}
