'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { IndianRupee, Plus, Search, Filter, CheckCircle, Clock, AlertCircle, TrendingUp, RefreshCw } from 'lucide-react';
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
    invoiceNumber: string;
    customer: { name: string } | null;
  } | null;
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

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

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
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
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
  );
}
