'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Wallet, TrendingDown, Calendar, Tag, Trash2, Edit2,
  X, Check, RefreshCw, BarChart2, Receipt
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string | null;
  date: string;
  vendor: string | null;
  gstAmount: number | null;
  isReimbursable: boolean;
  tags: string[];
}

interface Stats {
  totalAmount: number;
  totalCount: number;
  thisMonthAmount: number;
  thisMonthCount: number;
  lastMonthAmount: number;
  byCategory: { category: string; amount: number; count: number }[];
}

const EXPENSE_CATEGORIES = [
  'Travel', 'Food & Dining', 'Office Supplies', 'Marketing', 'Utilities',
  'Rent', 'Software & Subscriptions', 'Hardware', 'Salaries', 'Taxes',
  'Insurance', 'Maintenance', 'Entertainment', 'Training', 'Miscellaneous',
];

const CATEGORY_COLORS: Record<string, string> = {
  'Travel': 'bg-blue-100 text-blue-700',
  'Food & Dining': 'bg-orange-100 text-orange-700',
  'Office Supplies': 'bg-purple-100 text-purple-700',
  'Marketing': 'bg-pink-100 text-pink-700',
  'Utilities': 'bg-yellow-100 text-yellow-700',
  'Rent': 'bg-red-100 text-red-700',
  'Software & Subscriptions': 'bg-indigo-100 text-indigo-700',
  'Salaries': 'bg-green-100 text-green-700',
};

function getCategoryClass(category: string) {
  return CATEGORY_COLORS[category] || 'bg-gray-100 text-gray-700';
}

interface ExpenseFormProps {
  initial?: Partial<Expense>;
  onClose: () => void;
  onSaved: () => void;
}

function ExpenseForm({ initial, onClose, onSaved }: ExpenseFormProps) {
  const [form, setForm] = useState({
    category: initial?.category || '',
    amount: initial?.amount ? String(initial.amount) : '',
    description: initial?.description || '',
    date: initial?.date ? initial.date.split('T')[0] : new Date().toISOString().split('T')[0],
    vendor: initial?.vendor || '',
    gstAmount: initial?.gstAmount ? String(initial.gstAmount) : '',
    isReimbursable: initial?.isReimbursable ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.category) { setErr('Please select a category'); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { setErr('Enter a valid amount'); return; }
    setSaving(true); setErr('');
    try {
      const body = {
        category: form.category,
        amount: parseFloat(form.amount),
        description: form.description || undefined,
        date: form.date,
        vendor: form.vendor || undefined,
        gstAmount: form.gstAmount ? parseFloat(form.gstAmount) : undefined,
        isReimbursable: form.isReimbursable,
      };
      if (initial?.id) {
        await apiFetch(`/expenses/${initial.id}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await apiFetch('/expenses', { method: 'POST', body: JSON.stringify(body) });
      }
      onSaved();
      onClose();
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">{initial?.id ? 'Edit Expense' : 'Add Expense'}</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-gray-400" /></button>
        </div>
        {err && <p className="text-xs text-red-600 mb-3 bg-red-50 p-2 rounded-lg">{err}</p>}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                <option value="">Select category</option>
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹) *</label>
              <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} min="0.01" step="0.01"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Vendor / Payee</label>
              <input type="text" value={form.vendor} onChange={e => set('vendor', e.target.value)} placeholder="e.g. Amazon"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <input type="text" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief description"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">GST Amount (₹)</label>
              <input type="number" value={form.gstAmount} onChange={e => set('gstAmount', e.target.value)} min="0" step="0.01"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isReimbursable} onChange={e => set('isReimbursable', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm text-gray-700">Reimbursable</span>
              </label>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="h-4 w-4" />}
            {initial?.id ? 'Update' : 'Add Expense'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (filterCategory) params.set('category', filterCategory);
      const [expRes, statsRes] = await Promise.all([
        apiFetch<{ data: Expense[] }>(`/expenses?${params}`),
        apiFetch<{ data: Stats }>('/expenses/stats'),
      ]);
      setExpenses(expRes.data || []);
      setStats(statsRes.data);
    } catch { } finally { setLoading(false); }
  }, [filterCategory]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = expenses.filter(e => {
    const q = search.toLowerCase();
    return (
      e.category.toLowerCase().includes(q) ||
      (e.vendor || '').toLowerCase().includes(q) ||
      (e.description || '').toLowerCase().includes(q)
    );
  });

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await apiFetch(`/expenses/${id}`, { method: 'DELETE' });
      setDeleteId(null);
      fetchData();
    } catch { } finally { setDeleting(false); }
  };

  const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <>
      <AnimatePresence>
        {(showForm || editTarget) && (
          <ExpenseForm
            initial={editTarget || undefined}
            onClose={() => { setShowForm(false); setEditTarget(null); }}
            onSaved={fetchData}
          />
        )}
      </AnimatePresence>

      <div className="p-6 lg:p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expense Tracker</h1>
            <p className="text-gray-500 mt-1">{filtered.length} expenses · ₹{totalFiltered.toLocaleString('en-IN')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchData} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
              <Plus className="h-4 w-4" /> Add Expense
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Expenses', value: `₹${stats.totalAmount.toLocaleString('en-IN')}`, sub: `${stats.totalCount} records`, icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'This Month', value: `₹${stats.thisMonthAmount.toLocaleString('en-IN')}`, sub: `${stats.thisMonthCount} expenses`, icon: Calendar, color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'Last Month', value: `₹${stats.lastMonthAmount.toLocaleString('en-IN')}`, sub: 'previous month', icon: TrendingDown, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Categories', value: String(stats.byCategory.length), sub: 'expense types', icon: Tag, color: 'text-green-600', bg: 'bg-green-50' },
            ].map((card, i) => (
              <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${card.bg}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <p className="text-xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
                <p className="text-xs text-gray-400">{card.sub}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Category breakdown */}
        {stats && stats.byCategory.length > 0 && (
          <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><BarChart2 className="h-4 w-4 text-gray-400" /> Spending by Category</h3>
            <div className="flex flex-wrap gap-2">
              {stats.byCategory.slice(0, 8).map(cat => (
                <button key={cat.category} onClick={() => setFilterCategory(filterCategory === cat.category ? '' : cat.category)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${filterCategory === cat.category ? 'ring-2 ring-indigo-500' : ''} ${getCategoryClass(cat.category)}`}>
                  {cat.category}
                  <span className="font-bold">₹{cat.amount.toLocaleString('en-IN')}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:border-indigo-400 focus:outline-none" />
          </div>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none">
            <option value="">All Categories</option>
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Expenses Table */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Vendor</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">GST</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-8 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No expenses found</p>
                    <button onClick={() => setShowForm(true)} className="mt-3 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline">
                      <Plus className="h-4 w-4" /> Add your first expense
                    </button>
                  </td>
                </tr>
              ) : filtered.map((expense, idx) => (
                <motion.tr key={expense.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                  className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${getCategoryClass(expense.category)}`}>
                      {expense.category}
                    </span>
                    {expense.isReimbursable && (
                      <span className="ml-1 text-xs bg-blue-50 text-blue-600 rounded-full px-1.5 py-0.5">Reimbursable</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">{expense.description || '—'}</td>
                  <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-600">{expense.vendor || '—'}</td>
                  <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-600">
                    {expense.gstAmount ? `₹${expense.gstAmount.toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                    ₹{expense.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setEditTarget(expense)} className="rounded-lg p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {deleteId === expense.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDelete(expense.id)} disabled={deleting} className="rounded-lg p-1.5 text-white bg-red-500 hover:bg-red-600">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setDeleteId(null)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteId(expense.id)} className="rounded-lg p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
