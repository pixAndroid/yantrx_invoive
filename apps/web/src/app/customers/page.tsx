'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Search, Users, Mail, Phone, ChevronRight, RefreshCw } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  gstin: string | null;
  billingCity: string | null;
  billingState: string | null;
  outstandingBalance: number;
  _count: { invoices: number };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (search) params.set('search', search);
      const res = await apiFetch<{ data: Customer[] }>(`/customers?${params}`);
      setCustomers(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(t);
  }, [fetchCustomers]);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
    (c.gstin && c.gstin.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 mt-1">{filtered.length} customers</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchCustomers} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 active:scale-95">
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link href="/customers/new" className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 hover:shadow-md transition-all duration-150 active:scale-95">
            <Plus className="h-4 w-4" /> Add Customer
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mb-6">
        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-150" />
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm animate-pulse h-36" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((customer, idx) => (
            <motion.div key={customer.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <Link href={`/customers/${customer.id}`} className="block rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{customer.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{customer.name}</p>
                      <p className="text-xs text-gray-500">{customer.billingCity || '—'}{customer.billingState ? `, ${customer.billingState}` : ''}</p>
                    </div>
                  </div>
                  {(customer.outstandingBalance ?? 0) > 0 && (
                    <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      ₹{(customer.outstandingBalance || 0).toLocaleString('en-IN')} due
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 mb-4">
                  {customer.email && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Mail className="h-3.5 w-3.5" /> {customer.email}
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Phone className="h-3.5 w-3.5" /> {customer.phone}
                    </div>
                  )}
                  {customer.gstin && (
                    <p className="font-mono text-xs text-gray-500 bg-gray-50 rounded px-2 py-0.5">{customer.gstin}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    <span className="font-semibold text-gray-900">{customer._count?.invoices ?? 0}</span> invoices
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </Link>
            </motion.div>
          ))}

          {filtered.length === 0 && !loading && (
            <div className="col-span-full text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No customers found</p>
              <Link href="/customers/new" className="mt-3 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline">
                <Plus className="h-4 w-4" /> Add your first customer
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

