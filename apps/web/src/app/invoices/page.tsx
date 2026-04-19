'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Search, Download, FileText, CheckCircle, Clock, AlertCircle, ChevronRight, RefreshCw } from 'lucide-react';
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
  PAID: { label: 'Paid', class: 'bg-green-100 text-green-700', icon: CheckCircle },
  SENT: { label: '', class: 'bg-blue-100 text-blue-700', icon: Clock },
  OVERDUE: { label: 'Overdue', class: 'bg-red-100 text-red-700', icon: AlertCircle },
  DRAFT: { label: 'Draft', class: 'bg-gray-100 text-gray-600', icon: FileText },
  PARTIALLY_PAID: { label: 'Partial', class: 'bg-amber-100 text-amber-700', icon: Clock },
};

const FILTERS = ['All', 'Draft', 'Sent', 'Paid', 'Overdue'];

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
    <div className="p-6 lg:p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500 mt-1">
            {meta ? `${meta.total} invoices` : 'Loading...'} · ₹{totalAmount.toLocaleString('en-IN')} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchInvoices} className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={handleExport} className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Download className="h-4 w-4" /> Export
          </button>
          <Link href="/invoices/new" className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> New Invoice
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error} — Make sure you&apos;re connected to the API.
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div className="flex items-center gap-2">
          {FILTERS.map(filter => (
            <button
              key={filter}
              onClick={() => { setActiveFilter(filter); setPage(1); }}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${activeFilter === filter ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Invoice</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Customer</th>
                <th className="hidden md:table-cell px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Date</th>
                <th className="hidden lg:table-cell px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Due Date</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Amount</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-8 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No invoices found</p>
                    <Link href="/invoices/new" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                      <Plus className="h-4 w-4" /> Create your first invoice
                    </Link>
                  </td>
                </tr>
              ) : invoices.map(invoice => {
                const statusConfig = STATUS_CONFIG[invoice.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.DRAFT;
                return (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <Link href={`/invoices/${invoice.id}`} className="font-semibold text-sm text-indigo-600 hover:text-indigo-700">
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-gray-900">{invoice.customer?.name || 'Unknown'}</p>
                      {invoice.customer?.email && <p className="text-xs text-gray-500">{invoice.customer.email}</p>}
                    </td>
                    <td className="hidden md:table-cell px-4 py-4 text-sm text-gray-500">
                      {new Date(invoice.issueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="hidden lg:table-cell px-4 py-4 text-sm text-gray-500">
                      {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                      ₹{invoice.total.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusConfig.class}`}>
                        <statusConfig.icon className="h-3 w-3" />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <Link href={`/invoices/${invoice.id}`} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 inline-flex">
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Page {meta.page} of {meta.totalPages}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!meta.hasPrev} className="rounded-lg px-3 py-1.5 text-sm text-gray-500 border border-gray-200 hover:bg-gray-50 disabled:opacity-50">Previous</button>
              <button onClick={() => setPage(p => p + 1)} disabled={!meta.hasNext} className="rounded-lg px-3 py-1.5 text-sm text-gray-500 border border-gray-200 hover:bg-gray-50 disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

