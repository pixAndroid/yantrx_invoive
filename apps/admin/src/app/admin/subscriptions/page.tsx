'use client';

import { useState, useEffect, useCallback } from 'react';
import { CreditCard, AlertCircle, RefreshCw, CheckCircle, XCircle, Clock, UserCheck, X, Check, Search, Filter, CalendarDays } from 'lucide-react';
import { adminFetch, API_URL, getAdminToken } from '@/lib/api';

interface Subscription {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  amount: number;
  createdAt: string;
  businessId: string;
  business: { id: string; name: string };
  plan: { id: string; name: string; price: number };
}

interface Plan {
  id: string;
  name: string;
  price: number;
  dailyPrice: number | null;
  yearlyPrice: number | null;
  isActive: boolean;
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
  TRIAL: { label: 'Trial', class: 'bg-blue-900/30 text-blue-400 border-blue-800', icon: Clock },
};

const MILLISECONDS_PER_DAY = 86_400_000;

/** Compute effective status: if DB still says ACTIVE/TRIAL but endDate is past → EXPIRED */
function getEffectiveStatus(sub: Subscription): string {
  if ((sub.status === 'ACTIVE' || sub.status === 'TRIAL') && new Date(sub.endDate) <= new Date()) {
    return 'EXPIRED';
  }
  return sub.status;
}

/** Return { pct, daysLeft } for a subscription period. pct = 0–100 elapsed. */
function getPeriodProgress(sub: Subscription): { pct: number; daysLeft: number } {
  const start = new Date(sub.startDate).getTime();
  const end = new Date(sub.endDate).getTime();
  const now = Date.now();
  const daysLeft = Math.max(0, Math.ceil((end - now) / MILLISECONDS_PER_DAY));
  const pct = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  return { pct, daysLeft };
}

/** Return a human-readable price label for a plan option */
function planLabel(p: Plan): string {
  if (p.dailyPrice != null && p.price === 0) {
    return `${p.name} — ${p.dailyPrice === 0 ? 'Free' : `₹${p.dailyPrice}/day`}`;
  }
  if (p.price > 0) {
    return `${p.name} — ₹${p.price}/mo`;
  }
  if (p.yearlyPrice != null && p.yearlyPrice > 0) {
    return `${p.name} — ₹${p.yearlyPrice}/yr`;
  }
  return `${p.name} — Free`;
}

/** Convert a Date string to the value expected by <input type="datetime-local"> */
function toDatetimeLocal(dateStr: string): string {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPlanId, setFilterPlanId] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);

  // Assign-plan modal
  const [assignModal, setAssignModal] = useState<Subscription | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [confirmAssign, setConfirmAssign] = useState(false);

  // Edit-dates modal
  const [editModal, setEditModal] = useState<Subscription | null>(null);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const fetchSubs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (filterStatus) params.set('status', filterStatus);
      if (filterPlanId) params.set('planId', filterPlanId);
      const res = await adminFetch<{ data: Subscription[]; meta: Meta }>(`/admin/subscriptions?${params}`);
      setSubs(res.data);
      setMeta(res.meta);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, filterPlanId]);

  useEffect(() => {
    const t = setTimeout(fetchSubs, 300);
    return () => clearTimeout(t);
  }, [fetchSubs]);

  useEffect(() => {
    adminFetch<{ data: Plan[] }>('/admin/plans').then(r => setPlans(r.data.filter(p => p.isActive))).catch(() => {});
  }, []);

  const handleAssignPlan = async () => {
    if (!assignModal || !selectedPlan) return;
    setAssigning(true);
    try {
      const token = getAdminToken();
      await fetch(`${API_URL}/admin/subscriptions/${assignModal.id}/assign-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId: selectedPlan }),
      });
      setAssignModal(null);
      setConfirmAssign(false);
      fetchSubs();
    } catch {} finally { setAssigning(false); }
  };

  const openEditModal = (sub: Subscription) => {
    setEditModal(sub);
    setEditStartDate(toDatetimeLocal(sub.startDate));
    setEditEndDate(toDatetimeLocal(sub.endDate));
    setSaveError('');
  };

  const handleSaveDates = async () => {
    if (!editModal) return;
    setSaving(true);
    setSaveError('');
    try {
      const token = getAdminToken();
      const res = await fetch(`${API_URL}/admin/subscriptions/${editModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          startDate: new Date(editStartDate).toISOString(),
          endDate: new Date(editEndDate).toISOString(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update dates');
      setEditModal(null);
      fetchSubs();
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update dates');
    } finally {
      setSaving(false);
    }
  };

  const planColorMap: Record<string, string> = {
    Free: 'bg-gray-800 text-gray-400 border-gray-700',
    Starter: 'bg-blue-900/50 text-blue-400 border-blue-800',
    Pro: 'bg-indigo-900/50 text-indigo-400 border-indigo-800',
    Business: 'bg-purple-900/50 text-purple-400 border-purple-800',
  };

  return (
    <div className="p-6">
      {/* ── Assign Plan Modal ── */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => { setAssignModal(null); setConfirmAssign(false); }} />
          <div className="relative w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl shadow-xl p-5 z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Assign Plan</h3>
              <button onClick={() => { setAssignModal(null); setConfirmAssign(false); }}><X className="h-4 w-4 text-gray-400" /></button>
            </div>
            <p className="text-xs text-gray-400 mb-3">Business: <span className="text-gray-200">{assignModal.business.name}</span></p>

            {confirmAssign ? (
              /* ── Confirmation step ── */
              <>
                <p className="text-sm text-gray-300 mb-4">
                  Are you sure you want to assign <span className="text-white font-semibold">{plans.find(p => p.id === selectedPlan)?.name ?? 'this plan'}</span> to <span className="text-white font-semibold">{assignModal.business.name}</span>?
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmAssign(false)} className="flex-1 rounded-lg border border-gray-700 py-2 text-sm text-gray-400">No, go back</button>
                  <button onClick={handleAssignPlan} disabled={assigning}
                    className="flex-1 rounded-lg bg-orange-600 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60 flex items-center justify-center gap-2">
                    {assigning ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : <Check className="h-4 w-4" />}
                    Yes, Assign
                  </button>
                </div>
              </>
            ) : (
              /* ── Plan selection step ── */
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Select Plan</label>
                  <select value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none">
                    <option value="">Choose a plan...</option>
                    {plans.map(p => <option key={p.id} value={p.id}>{planLabel(p)}</option>)}
                  </select>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => { setAssignModal(null); setConfirmAssign(false); }} className="flex-1 rounded-lg border border-gray-700 py-2 text-sm text-gray-400">Cancel</button>
                  <button onClick={() => setConfirmAssign(true)} disabled={!selectedPlan}
                    className="flex-1 rounded-lg bg-orange-600 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60 flex items-center justify-center gap-2">
                    <Check className="h-4 w-4" />
                    Assign
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Edit Dates Modal ── */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setEditModal(null)} />
          <div className="relative w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl shadow-xl p-5 z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Edit Subscription Dates</h3>
              <button onClick={() => setEditModal(null)}><X className="h-4 w-4 text-gray-400" /></button>
            </div>
            <p className="text-xs text-gray-400 mb-4">Business: <span className="text-gray-200">{editModal.business.name}</span></p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Start Date &amp; Time</label>
                <input
                  type="datetime-local"
                  value={editStartDate}
                  onChange={e => setEditStartDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Expiry Date &amp; Time</label>
                <input
                  type="datetime-local"
                  value={editEndDate}
                  onChange={e => setEditEndDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>
            {saveError && (
              <p className="mt-2 text-xs text-red-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{saveError}</p>
            )}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setEditModal(null)} className="flex-1 rounded-lg border border-gray-700 py-2 text-sm text-gray-400">Cancel</button>
              <button onClick={handleSaveDates} disabled={saving || !editStartDate || !editEndDate}
                className="flex-1 rounded-lg bg-orange-600 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : <Check className="h-4 w-4" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
          <p className="text-gray-400 mt-1">{meta ? `${meta.total} subscriptions` : 'Loading...'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchSubs} className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button onClick={() => setShowFilter(p => !p)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-700 ${(filterStatus || filterPlanId) ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-gray-700 bg-gray-800 text-gray-300'}`}>
            <Filter className="h-4 w-4" /> Filter
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input type="text" placeholder="Search by business or plan..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-700 bg-gray-800 text-sm text-gray-200 placeholder-gray-500 focus:border-orange-500 focus:outline-none" />
        </div>
      </div>

      {showFilter && (
        <div className="mb-4 p-4 rounded-xl border border-gray-700 bg-gray-800/50 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Status:</label>
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 focus:border-orange-500 focus:outline-none">
              <option value="">All</option>
              {['ACTIVE','TRIAL','EXPIRED','CANCELLED','PAST_DUE'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Plan:</label>
            <select value={filterPlanId} onChange={e => { setFilterPlanId(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 focus:border-orange-500 focus:outline-none">
              <option value="">All Plans</option>
              {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          {(filterStatus || filterPlanId) && (
            <button onClick={() => { setFilterStatus(''); setFilterPlanId(''); setPage(1); }}
              className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1">
              <X className="h-3 w-3" /> Clear filters
            </button>
          )}
        </div>
      )}

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
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Time Left</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={8} className="px-4 py-4"><div className="h-8 bg-gray-800 rounded animate-pulse" /></td></tr>
              ))
            ) : subs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <CreditCard className="h-12 w-12 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500">No subscriptions found</p>
                </td>
              </tr>
            ) : subs.map(sub => {
              const effectiveStatus = getEffectiveStatus(sub);
              const statusConfig = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.ACTIVE;
              const { pct, daysLeft } = getPeriodProgress(sub);
              const isActiveOrTrial = effectiveStatus === 'ACTIVE' || effectiveStatus === 'TRIAL';

              // Progress bar color based on time remaining
              let barColor = 'bg-green-500';
              if (!isActiveOrTrial) {
                barColor = 'bg-gray-600';
              } else if (daysLeft <= 3) {
                barColor = 'bg-red-500';
              } else if (daysLeft <= 7) {
                barColor = 'bg-amber-500';
              }

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
                  {/* Time-left progress bar */}
                  <td className="px-4 py-4 min-w-[120px]">
                    {isActiveOrTrial ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-medium ${daysLeft <= 3 ? 'text-red-400' : daysLeft <= 7 ? 'text-amber-400' : 'text-green-400'}`}>
                            {daysLeft}d left
                          </span>
                          <span className="text-xs text-gray-600">{Math.round(pct)}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-gray-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${barColor}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => { setAssignModal(sub); setSelectedPlan(sub.plan.id); setConfirmAssign(false); }}
                        className="inline-flex items-center gap-1 text-xs rounded-lg border border-orange-800 bg-orange-900/20 px-2 py-1 text-orange-400 hover:bg-orange-900/40">
                        <UserCheck className="h-3 w-3" /> Assign Plan
                      </button>
                      <button onClick={() => openEditModal(sub)}
                        className="inline-flex items-center gap-1 text-xs rounded-lg border border-gray-700 bg-gray-800 px-2 py-1 text-gray-300 hover:bg-gray-700">
                        <CalendarDays className="h-3 w-3" /> Edit Dates
                      </button>
                    </div>
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
