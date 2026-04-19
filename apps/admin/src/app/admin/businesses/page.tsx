'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Building2, Users, FileText, AlertCircle, RefreshCw, Filter, X } from 'lucide-react';
import { adminFetch } from '@/lib/api';

interface Business {
  id: string;
  name: string;
  gstin: string | null;
  city: string | null;
  state: string | null;
  createdAt: string;
  plan: { name: string; slug: string } | null;
  owner: { name: string; email: string | null };
  _count: { invoices: number; customers: number };
}

interface Meta {
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (filterPlan) params.set('plan', filterPlan);
      const res = await adminFetch<{ data: Business[]; meta: Meta }>(`/admin/businesses?${params}`);
      setBusinesses(res.data);
      setMeta(res.meta);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterPlan]);

  useEffect(() => {
    const t = setTimeout(fetchBusinesses, 300);
    return () => clearTimeout(t);
  }, [fetchBusinesses]);

  const planColors: Record<string, string> = {
    free: 'bg-gray-800 text-gray-400 border-gray-700',
    starter: 'bg-blue-900/50 text-blue-400 border-blue-800',
    pro: 'bg-indigo-900/50 text-indigo-400 border-indigo-800',
    business: 'bg-purple-900/50 text-purple-400 border-purple-800',
  };

  const PLAN_FILTERS = ['free', 'starter', 'pro', 'business'];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Businesses</h1>
          <p className="text-gray-400 mt-1">{meta ? `${meta.total} businesses` : 'Loading...'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchBusinesses} className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button onClick={() => setShowFilter(p => !p)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-700 ${filterPlan ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-gray-700 bg-gray-800 text-gray-300'}`}>
            <Filter className="h-4 w-4" /> Filter {filterPlan && <span className="bg-orange-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">1</span>}
          </button>
        </div>
      </div>

      {showFilter && (
        <div className="mb-4 p-4 rounded-xl border border-gray-700 bg-gray-800/50 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Plan:</label>
            <select value={filterPlan} onChange={e => { setFilterPlan(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 focus:border-orange-500 focus:outline-none">
              <option value="">All Plans</option>
              {PLAN_FILTERS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
          {filterPlan && (
            <button onClick={() => { setFilterPlan(''); setPage(1); }}
              className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1">
              <X className="h-3 w-3" /> Clear filter
            </button>
          )}
        </div>
      )}

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input type="text" placeholder="Search businesses..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-700 bg-gray-800 text-sm text-gray-200 placeholder-gray-500 focus:border-orange-500 focus:outline-none" />
        </div>
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
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Owner</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Plan</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Invoices</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Customers</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Location</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-8 bg-gray-800 rounded animate-pulse" /></td></tr>
              ))
            ) : businesses.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">No businesses found</td></tr>
            ) : (
              businesses.map(b => (
                <tr key={b.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {b.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{b.name}</p>
                        {b.gstin && <p className="text-xs text-gray-500 font-mono">{b.gstin}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-300">{b.owner.name}</p>
                    {b.owner.email && <p className="text-xs text-gray-500">{b.owner.email}</p>}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${planColors[b.plan?.slug || ''] || 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                      {b.plan?.name || 'No Plan'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-sm text-gray-300">
                      <FileText className="h-3.5 w-3.5 text-gray-500" /> {b._count.invoices}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-sm text-gray-300">
                      <Users className="h-3.5 w-3.5 text-gray-500" /> {b._count.customers}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {[b.city, b.state].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
            <p className="text-xs text-gray-500">Page {meta.page} of {meta.totalPages} · {meta.total} businesses</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!meta.hasPrev}
                className="rounded-lg px-3 py-1.5 text-sm text-gray-400 border border-gray-700 hover:bg-gray-800 disabled:opacity-50">Previous</button>
              <button onClick={() => setPage(p => p + 1)} disabled={!meta.hasNext}
                className="rounded-lg px-3 py-1.5 text-sm text-gray-400 border border-gray-700 hover:bg-gray-800 disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
