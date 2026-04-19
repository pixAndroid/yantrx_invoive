'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { IndianRupee, Plus, Search, Filter, CheckCircle, Clock, AlertCircle, TrendingUp, RefreshCw, X, Check } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Payment {
  id: string;
  amount: number;
  method: string;
  status: string;
  transactionRef: string | null;
  paidAt: string;
  notes: string | null;
  invoice: {
    id: string;
    invoiceNumber: string;
    customer: { name: string } | null;
  } | null;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  amountDue: number;
  customer: { name: string } | null;
}

const STATUS_CONFIG = {
  SUCCESS: { label: 'Received', class: 'bg-green-100 text-green-700', icon: CheckCircle },
  PENDING: { label: 'Pending', class: 'bg-amber-100 text-amber-700', icon: Clock },
  FAILED: { label: 'Failed', class: 'bg-red-100 text-red-700', icon: AlertCircle },
  REFUNDED: { label: 'Refunded', class: 'bg-gray-100 text-gray-600', icon: IndianRupee },
};

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  UPI: 'UPI',
  CHEQUE: 'Cheque',
  CARD: 'Card',
  OTHER: 'Other',
};

function RecordPaymentModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceResults, setInvoiceResults] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({
    amount: '', method: 'CASH', transactionRef: '', notes: '',
    paidAt: new Date().toISOString().split('T')[0],
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!invoiceSearch || selectedInvoice) return;
    const t = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await apiFetch<{ data: Invoice[] }>(`/invoices?search=${encodeURIComponent(invoiceSearch)}&limit=8&status=SENT`);
        setInvoiceResults(res.data);
      } catch {} finally { setSearchLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [invoiceSearch, selectedInvoice]);

  const handleSave = async () => {
    if (!selectedInvoice) { setErr('Please select an invoice'); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { setErr('Enter a valid amount'); return; }
    setSaving(true); setErr('');
    try {
      await apiFetch('/payments', {
        method: 'POST',
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          amount: parseFloat(form.amount),
          method: form.method,
          transactionRef: form.transactionRef || undefined,
          notes: form.notes || undefined,
          paidAt: form.paidAt,
        }),
      });
      onSaved();
      onClose();
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Record Payment</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-gray-400" /></button>
        </div>
        {err && <p className="text-xs text-red-600 mb-3">{err}</p>}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Invoice *</label>
            <div className="relative">
              <input type="text" placeholder="Search invoice number or customer..."
                value={invoiceSearch}
                onChange={e => { setInvoiceSearch(e.target.value); setSelectedInvoice(null); }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              {searchLoading && <div className="absolute right-3 top-2.5 h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
            </div>
            {invoiceResults.length > 0 && !selectedInvoice && (
              <div className="mt-1 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                {invoiceResults.map(inv => (
                  <button key={inv.id} onClick={() => { setSelectedInvoice(inv); setInvoiceSearch(inv.invoiceNumber); set('amount', String(inv.amountDue || '')); }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex justify-between">
                    <span className="font-medium">{inv.invoiceNumber}</span>
                    <span className="text-gray-500">{inv.customer?.name}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedInvoice && (
              <p className="text-xs text-indigo-600 mt-1">Selected: {selectedInvoice.invoiceNumber} · Due ₹{selectedInvoice.amountDue?.toLocaleString('en-IN')}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹) *</label>
            <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} step="0.01" min="0.01"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method</label>
            <select value={form.method} onChange={e => set('method', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
              {['CASH','BANK_TRANSFER','UPI','CHEQUE','CARD','OTHER'].map(m => <option key={m} value={m}>{METHOD_LABELS[m] || m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Payment Date</label>
            <input type="date" value={form.paidAt} onChange={e => set('paidAt', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Transaction Ref / UTR</label>
            <input type="text" value={form.transactionRef} onChange={e => set('transactionRef', e.target.value)} placeholder="Optional"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <input type="text" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : <Check className="h-4 w-4" />}
            Record Payment
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showRecordPayment, setShowRecordPayment] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch<{ data: Payment[]; meta: object }>('/payments');
      setPayments(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const filtered = payments.filter(p => {
    const q = search.toLowerCase();
    return (
      (p.invoice?.invoiceNumber || '').toLowerCase().includes(q) ||
      (p.invoice?.customer?.name || '').toLowerCase().includes(q) ||
      (p.transactionRef || '').toLowerCase().includes(q)
    );
  });

  const totalReceived = filtered
    .filter(p => p.status === 'SUCCESS')
    .reduce((sum, p) => sum + p.amount, 0);

  const pending = filtered
    .filter(p => p.status === 'PENDING')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <>
      {showRecordPayment && (
        <RecordPaymentModal onClose={() => setShowRecordPayment(false)} onSaved={fetchPayments} />
      )}
    <div className="p-6 lg:p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 mt-1">{filtered.length} records</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchPayments} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button onClick={() => setShowRecordPayment(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> Record Payment
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Received', value: `₹${totalReceived.toLocaleString('en-IN')}`, icon: CheckCircle, bg: 'bg-green-50', iconColor: 'text-green-600' },
          { label: 'Pending', value: `₹${pending.toLocaleString('en-IN')}`, icon: Clock, bg: 'bg-amber-50', iconColor: 'text-amber-600' },
          { label: 'Transactions', value: String(filtered.filter(p => p.status === 'SUCCESS').length), icon: TrendingUp, bg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
        ].map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${card.bg}`}>
              <card.icon className={`h-5 w-5 ${card.iconColor}`} />
            </div>
            <p className="text-xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error} — Make sure you&apos;re connected to the API.
        </div>
      )}

      {/* Search */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search payments..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:border-indigo-400 focus:outline-none"
          />
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
          <Filter className="h-4 w-4" /> Filter
        </button>
      </div>

      {/* Payments Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden"
      >
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Invoice</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Method</th>
              <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Reference</th>
              <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-4 py-4">
                    <div className="h-8 bg-gray-100 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <IndianRupee className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No payments found</p>
                  <p className="text-xs text-gray-400 mt-1">Payments will appear here once invoices are paid</p>
                </td>
              </tr>
            ) : filtered.map(payment => {
              const statusConfig = STATUS_CONFIG[payment.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING;
              return (
                <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-indigo-600">
                      {payment.invoice?.invoiceNumber || '—'}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium text-gray-900">
                      {payment.invoice?.customer?.name || 'Unknown'}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs bg-gray-100 text-gray-700 rounded-full px-2.5 py-1">
                      {METHOD_LABELS[payment.method] || payment.method}
                    </span>
                  </td>
                  <td className="hidden md:table-cell px-4 py-4 text-xs font-mono text-gray-500">
                    {payment.transactionRef || '—'}
                  </td>
                  <td className="hidden md:table-cell px-4 py-4 text-sm text-gray-500">
                    {new Date(payment.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-semibold text-gray-900">
                    ₹{payment.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusConfig.class}`}>
                      <statusConfig.icon className="h-3 w-3" />
                      {statusConfig.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>
    </div>
    </>
  );
}
