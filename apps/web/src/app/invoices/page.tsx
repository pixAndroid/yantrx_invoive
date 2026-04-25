'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Search, Download, FileText, CheckCircle, Clock, AlertCircle, ChevronRight, RefreshCw, TrendingUp, IndianRupee, ReceiptText, XCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Invoice {
  id: string;
  invoiceNumber: string;
  type: string;
  status: string;
  issueDate: string;
  dueDate: string | null;
  total: number;
  amountDue: number;
  customer: { id: string; name: string; email: string | null } | null;
}

interface Meta {
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const STATUS_CONFIG = {
  PAID: { label: 'Paid', class: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle },
  SENT: { label: 'Sent', class: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200', dot: 'bg-blue-500', icon: Clock },
  OVERDUE: { label: 'Overdue', class: 'bg-red-50 text-red-700 ring-1 ring-red-200', dot: 'bg-red-500', icon: AlertCircle },
  DRAFT: { label: 'Draft', class: 'bg-gray-50 text-gray-600 ring-1 ring-gray-200', dot: 'bg-gray-400', icon: FileText },
  PARTIALLY_PAID: { label: 'Partial', class: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200', dot: 'bg-amber-500', icon: Clock },
  CANCELLED: { label: 'Cancelled', class: 'bg-red-50 text-red-600 ring-1 ring-red-200', dot: 'bg-red-400', icon: XCircle },
  SAVED: { label: 'Saved', class: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200', dot: 'bg-violet-500', icon: FileText },
};

const FILTERS = ['All', 'Draft', 'Sent', 'Paid', 'Overdue'];

function CustomerAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const hue = name.charCodeAt(0) % 6;
  const colors = [
    'bg-indigo-100 text-indigo-700',
    'bg-violet-100 text-violet-700',
    'bg-pink-100 text-pink-700',
    'bg-amber-100 text-amber-700',
    'bg-cyan-100 text-cyan-700',
    'bg-teal-100 text-teal-700',
  ];
  return (
    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold flex-shrink-0 ${colors[hue]}`}>
      {initials}
    </span>
  );
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (activeFilter !== 'All') params.set('status', activeFilter.toUpperCase());
      const res = await apiFetch<{ data: Invoice[]; meta: Meta }>(`/invoices?${params}`);
      setInvoices(res.data);
      setMeta(res.meta);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, activeFilter]);

  useEffect(() => {
    const t = setTimeout(fetchInvoices, 300);
    return () => clearTimeout(t);
  }, [fetchInvoices]);

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const paidAmount = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.total, 0);
  const overdueCount = invoices.filter(i => i.status === 'OVERDUE').length;
  const draftCount = invoices.filter(i => i.status === 'DRAFT' || i.status === 'SAVED').length;

  const handleExport = () => {
    const csv = [
      ['Invoice No', 'Customer', 'Email', 'Date', 'Due Date', 'Amount', 'Amount Due', 'Status'],
      ...invoices.map(inv => [
        inv.invoiceNumber,
        inv.customer?.name || 'Unknown',
        inv.customer?.email || '',
        new Date(inv.issueDate).toLocaleDateString('en-IN'),
        inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : '',
        inv.total.toString(),
        inv.amountDue.toString(),
        inv.status,
      ]),
    ].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Invoices</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {meta ? `${meta.total} total invoices` : 'Loading...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchInvoices}
            className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-150 active:scale-95"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={handleExport}
            className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-150 active:scale-95"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <Link
            href="/invoices/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 hover:shadow-md transition-all duration-150 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            New Invoice
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
          className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Invoices</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
              <ReceiptText className="h-4 w-4 text-indigo-600" />
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{meta?.total ?? invoices.length}</p>
          <p className="text-xs text-gray-500 mt-1">this period</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Value</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
              <IndianRupee className="h-4 w-4 text-violet-600" />
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
          <p className="text-xs text-gray-500 mt-1">across all invoices</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Collected</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">₹{paidAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
          <p className="text-xs text-gray-500 mt-1">paid invoices</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Attention</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-500" />
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{overdueCount}</p>
          <p className="text-xs text-gray-500 mt-1">overdue · {draftCount} draft{draftCount !== 1 ? 's' : ''}</p>
        </motion.div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error} — Make sure you&apos;re connected to the API.
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by invoice number or customer…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-gray-100 rounded-xl p-1">
          {FILTERS.map(filter => (
            <button
              key={filter}
              onClick={() => { setActiveFilter(filter); setPage(1); }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                activeFilter === filter
                  ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Invoice</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Customer</th>
                <th className="hidden md:table-cell px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Issue Date</th>
                <th className="hidden lg:table-cell px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Due Date</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Amount</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                <th className="px-4 py-3.5 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-5 py-3.5">
                      <div className="h-8 bg-gray-100 rounded-lg animate-pulse" style={{ opacity: 1 - i * 0.15 }} />
                    </td>
                  </tr>
                ))
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 mb-4">
                        <FileText className="h-8 w-8 text-indigo-400" />
                      </div>
                      <p className="text-sm font-semibold text-gray-700">No invoices found</p>
                      <p className="text-xs text-gray-400 mt-1 mb-4">Create your first invoice to get started</p>
                      <Link
                        href="/invoices/new"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Create Invoice
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map(invoice => {
                  const statusConfig = STATUS_CONFIG[invoice.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.DRAFT;
                  return (
                    <tr key={invoice.id} className="group hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <CustomerAvatar name={invoice.customer?.name || 'U'} />
                          <div>
                            <p className="text-sm font-medium text-gray-900 leading-tight">{invoice.customer?.name || 'Unknown'}</p>
                            {invoice.customer?.email && (
                              <p className="text-xs text-gray-400 mt-0.5">{invoice.customer.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-5 py-4 text-sm text-gray-500">
                        {new Date(invoice.issueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="hidden lg:table-cell px-5 py-4 text-sm text-gray-500">
                        {invoice.dueDate
                          ? new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          ₹{invoice.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                        {invoice.amountDue > 0 && invoice.status !== 'PAID' && (
                          <p className="text-xs text-red-500 mt-0.5">₹{invoice.amountDue.toLocaleString('en-IN', { maximumFractionDigits: 0 })} due</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusConfig.class}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-gray-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-400">
              Page <span className="font-medium text-gray-600">{meta.page}</span> of <span className="font-medium text-gray-600">{meta.totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!meta.hasPrev}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 transition-all"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!meta.hasNext}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

