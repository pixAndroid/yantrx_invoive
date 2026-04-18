'use client';

import { useState, useEffect, useCallback } from 'react';
import { CreditCard, AlertCircle, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { adminFetch } from '@/lib/api';

interface Subscription {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  amount: number;
  autoRenew: boolean;
  createdAt: string;
  business: { id: string; name: string };
  plan: { id: string; name: string; price: number };
}

interface Meta {
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; class: string; icon: typeof CheckCircle }> = {
  ACTIVE: { label: 'Active', class: 'bg-green-900/30 text-green-400 border-green-800', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', class: 'bg-red-900/30 text-red-400 border-red-800', icon: XCircle },
  EXPIRED: { label: 'Expired', class: 'bg-gray-800 text-gray-400 border-gray-700', icon: Clock },
  PAST_DUE: { label: 'Past Due', class: 'bg-amber-900/30 text-amber-400 border-amber-800', icon: Clock },
};

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSubs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminFetch<{ data: Subscription[]; meta: Meta }>(`/admin/subscriptions?page=${page}&limit=20`);
      setSubs(res.data);
      setMeta(res.meta);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchSubs(); }, [fetchSubs]);

  const planColorMap: Record<string, string> = {
    Free: 'bg-gray-800 text-gray-400 border-gray-700',
    Starter: 'bg-blue-900/50 text-blue-400 border-blue-800',
    Pro: 'bg-indigo-900/50 text-indigo-400 border-indigo-800',
    Business: 'bg-purple-900/50 text-purple-400 border-purple-800',
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
          <p className="text-gray-400 mt-1">{meta ? `${meta.total} subscriptions` : 'Loading...'}</p>
        </div>
        <button onClick={fetchSubs} className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Business</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Plan</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Start Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">End Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Auto Renew</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-8 bg-gray-800 rounded animate-pulse" /></td></tr>
              ))
            ) : subs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <CreditCard className="h-12 w-12 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500">No subscriptions found</p>
                </td>
              </tr>
            ) : subs.map(sub => {
              const statusConfig = STATUS_CONFIG[sub.status] || STATUS_CONFIG.ACTIVE;
              return (
                <tr key={sub.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {sub.business.name.charAt(0)}
                      </div>
                      <p className="text-sm font-medium text-white">{sub.business.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${planColorMap[sub.plan.name] || 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                      {sub.plan.name}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs flex items-center gap-1 w-fit px-2 py-0.5 rounded-full border ${statusConfig.class}`}>
                      <statusConfig.icon className="h-3 w-3" />
                      {statusConfig.label}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-300">
                    {sub.amount === 0 ? 'Free' : `₹${sub.amount}/mo`}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {new Date(sub.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {new Date(sub.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs ${sub.autoRenew ? 'text-green-400' : 'text-gray-500'}`}>
                      {sub.autoRenew ? '✓ Yes' : '✗ No'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
            <p className="text-xs text-gray-500">Page {meta.page} of {meta.totalPages}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!meta.hasPrev} className="rounded-lg px-3 py-1.5 text-sm text-gray-400 border border-gray-700 hover:bg-gray-800 disabled:opacity-50">Previous</button>
              <button onClick={() => setPage(p => p + 1)} disabled={!meta.hasNext} className="rounded-lg px-3 py-1.5 text-sm text-gray-400 border border-gray-700 hover:bg-gray-800 disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
