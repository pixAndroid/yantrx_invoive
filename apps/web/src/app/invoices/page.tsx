'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Download, FileText, CheckCircle, Clock, AlertCircle, ChevronRight, MoreVertical } from 'lucide-react';

const INVOICES = [
  { id: '1', number: 'INV-0047', customer: 'Acme Corporation', gstin: '07AABCA1234B1ZX', amount: 25900, date: '2024-11-20', dueDate: '2024-12-20', status: 'PAID' },
  { id: '2', number: 'INV-0046', customer: 'Sharma Enterprises', gstin: '27AABCS5658K1ZQ', amount: 12400, date: '2024-11-18', dueDate: '2024-12-03', status: 'SENT' },
  { id: '3', number: 'INV-0045', customer: 'Patel Trading Co', gstin: null, amount: 8500, date: '2024-11-10', dueDate: '2024-11-17', status: 'OVERDUE' },
  { id: '4', number: 'INV-0044', customer: 'Tech Solutions Pvt', gstin: '29AABCT1234C1ZX', amount: 45000, date: '2024-11-08', dueDate: '2024-12-08', status: 'DRAFT' },
  { id: '5', number: 'INV-0043', customer: 'Gupta & Sons', gstin: '24AABCG1234D1ZX', amount: 15750, date: '2024-11-05', dueDate: '2024-11-20', status: 'PAID' },
];

const STATUS_CONFIG = {
  PAID: { label: 'Paid', class: 'bg-green-100 text-green-700', icon: CheckCircle },
  SENT: { label: 'Sent', class: 'bg-blue-100 text-blue-700', icon: Clock },
  OVERDUE: { label: 'Overdue', class: 'bg-red-100 text-red-700', icon: AlertCircle },
  DRAFT: { label: 'Draft', class: 'bg-gray-100 text-gray-600', icon: FileText },
  PARTIALLY_PAID: { label: 'Partial', class: 'bg-amber-100 text-amber-700', icon: Clock },
};

const FILTERS = ['All', 'Draft', 'Sent', 'Paid', 'Overdue'];

export default function InvoicesPage() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = INVOICES.filter(inv => {
    const matchSearch = inv.number.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === 'All' || inv.status === activeFilter.toUpperCase();
    return matchSearch && matchFilter;
  });

  const totalAmount = filtered.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500 mt-1">{filtered.length} invoices · ₹{totalAmount.toLocaleString('en-IN')} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Download className="h-4 w-4" />
            Export
          </button>
          <Link
            href="/invoices/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            New Invoice
          </Link>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div className="flex items-center gap-2">
          {FILTERS.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${activeFilter === filter ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden"
      >
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
              {filtered.map(invoice => {
                const statusConfig = STATUS_CONFIG[invoice.status as keyof typeof STATUS_CONFIG];
                return (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <Link href={`/invoices/${invoice.id}`} className="font-semibold text-sm text-indigo-600 hover:text-indigo-700">
                        {invoice.number}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-gray-900">{invoice.customer}</p>
                      {invoice.gstin && <p className="text-xs text-gray-500">{invoice.gstin}</p>}
                    </td>
                    <td className="hidden md:table-cell px-4 py-4 text-sm text-gray-500">
                      {new Date(invoice.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="hidden lg:table-cell px-4 py-4 text-sm text-gray-500">
                      {new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                      ₹{invoice.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusConfig.class}`}>
                        <statusConfig.icon className="h-3 w-3" />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No invoices found</p>
                    <Link href="/invoices/new" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                      <Plus className="h-4 w-4" /> Create your first invoice
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
