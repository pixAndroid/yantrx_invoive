'use client';

import { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Check, X, AlertCircle, RefreshCw, Star } from 'lucide-react';
import { adminFetch, API_URL, getAdminToken } from '@/lib/api';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  yearlyPrice: number | null;
  invoiceLimit: number;
  customerLimit: number;
  userLimit: number;
  storageLimit: number;
  features: string[];
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminFetch<{ data: Plan[] }>('/admin/plans');
      setPlans(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const savePrice = async (planId: string) => {
    setSaving(true);
    try {
      const token = getAdminToken();
      const res = await fetch(`${API_URL}/admin/plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ price: parseFloat(editPrice) }),
      });
      const data = await res.json();
      if (data.success) {
        setPlans(prev => prev.map(p => p.id === planId ? { ...p, price: parseFloat(editPrice) } : p));
        setEditingId(null);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const togglePlan = async (planId: string, isActive: boolean) => {
    try {
      const token = getAdminToken();
      await fetch(`${API_URL}/admin/plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: !isActive }),
      });
      setPlans(prev => prev.map(p => p.id === planId ? { ...p, isActive: !isActive } : p));
    } catch {}
  };

  const planColorMap: Record<string, { border: string; header: string }> = {
    free: { border: 'border-gray-700', header: 'bg-gray-800/50' },
    starter: { border: 'border-blue-800/50', header: 'bg-blue-900/20' },
    pro: { border: 'border-indigo-800/50', header: 'bg-indigo-900/20' },
    business: { border: 'border-purple-800/50', header: 'bg-purple-900/20' },
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Plans</h1>
          <p className="text-gray-400 mt-1">Manage pricing plans and features</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchPlans} className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700">
            <Plus className="h-4 w-4" /> New Plan
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-800 bg-gray-900 p-6 animate-pulse h-64" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">No plans found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map(plan => {
            const colors = planColorMap[plan.slug] || planColorMap.free;
            return (
              <div key={plan.id} className={`rounded-2xl border ${colors.border} bg-gray-900 overflow-hidden`}>
                <div className={`p-5 ${colors.header} border-b border-gray-800`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{plan.name}</h3>
                        {plan.isFeatured && <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{plan.description}</p>
                    </div>
                    <button
                      onClick={() => togglePlan(plan.id, plan.isActive)}
                      className={`text-xs px-2 py-0.5 rounded-full border ${plan.isActive ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-red-900/30 text-red-400 border-red-800'}`}
                    >
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  <div className="flex items-baseline gap-1 mt-3">
                    {editingId === plan.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">₹</span>
                        <input
                          type="number"
                          value={editPrice}
                          onChange={e => setEditPrice(e.target.value)}
                          className="w-24 rounded-lg border border-gray-600 bg-gray-800 px-2 py-1 text-lg font-bold text-white focus:border-orange-500 focus:outline-none"
                          autoFocus
                        />
                        <button onClick={() => savePrice(plan.id)} disabled={saving} className="text-green-400 hover:text-green-300">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-300">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-2xl font-bold text-white">
                          {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                        </span>
                        {plan.price > 0 && <span className="text-xs text-gray-500">/mo</span>}
                        <button
                          onClick={() => { setEditingId(plan.id); setEditPrice(String(plan.price)); }}
                          className="ml-1 text-gray-600 hover:text-gray-400"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <div className="space-y-1.5 mb-4">
                    <p className="text-xs text-gray-500">{plan.invoiceLimit >= 999999 ? 'Unlimited' : plan.invoiceLimit} invoices/mo</p>
                    <p className="text-xs text-gray-500">{plan.customerLimit >= 999999 ? 'Unlimited' : plan.customerLimit} customers</p>
                    <p className="text-xs text-gray-500">{plan.userLimit} team member{plan.userLimit !== 1 ? 's' : ''}</p>
                    <p className="text-xs text-gray-500">{plan.storageLimit}MB storage</p>
                  </div>
                  <div className="space-y-1">
                    {plan.features.slice(0, 4).map((f, i) => (
                      <p key={i} className="text-xs text-gray-400 flex items-start gap-1.5">
                        <span className="text-green-500 mt-0.5">✓</span> {f}
                      </p>
                    ))}
                    {plan.features.length > 4 && (
                      <p className="text-xs text-gray-600">+{plan.features.length - 4} more features</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
