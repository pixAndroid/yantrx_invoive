'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Search, Users, Mail, Phone, MoreVertical, ChevronRight } from 'lucide-react';

const CUSTOMERS = [
  { id: '1', name: 'Acme Corporation', email: 'billing@acmecorp.com', phone: '+919811223344', gstin: '07AABCA1234B1ZX', city: 'New Delhi', balance: 0, invoices: 12, totalSpend: 285000 },
  { id: '2', name: 'Sharma Enterprises', email: 'accounts@sharmaent.in', phone: '+919922334455', gstin: '27AABCS5658K1ZQ', city: 'Mumbai', balance: 12400, invoices: 8, totalSpend: 142000 },
  { id: '3', name: 'Patel Trading Co', email: 'patel@pateltrading.com', phone: '+919988776655', gstin: null, city: 'Ahmedabad', balance: 8500, invoices: 5, totalSpend: 67500 },
  { id: '4', name: 'Tech Solutions Pvt', email: 'finance@techsol.in', phone: '+919766554433', gstin: '29AABCT1234C1ZX', city: 'Bengaluru', balance: 0, invoices: 15, totalSpend: 425000 },
];

export default function CustomersPage() {
  const [search, setSearch] = useState('');

  const filtered = CUSTOMERS.filter(c =>
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
        <Link href="/customers/new" className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> Add Customer
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:border-indigo-400 focus:outline-none" />
        </div>
      </div>

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
                    <p className="text-xs text-gray-500">{customer.city}</p>
                  </div>
                </div>
                {customer.balance > 0 && (
                  <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">₹{customer.balance.toLocaleString('en-IN')} due</span>
                )}
              </div>

              <div className="space-y-1.5 mb-4">
                {customer.email && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Mail className="h-3.5 w-3.5" />
                    {customer.email}
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Phone className="h-3.5 w-3.5" />
                    {customer.phone}
                  </div>
                )}
                {customer.gstin && (
                  <p className="font-mono text-xs text-gray-500 bg-gray-50 rounded px-2 py-0.5">{customer.gstin}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  <span className="font-semibold text-gray-900">{customer.invoices}</span> invoices
                </div>
                <div className="text-xs text-gray-500">
                  ₹<span className="font-semibold text-gray-900">{customer.totalSpend.toLocaleString('en-IN')}</span> total
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            </Link>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No customers found</p>
            <Link href="/customers/new" className="mt-3 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline">
              <Plus className="h-4 w-4" /> Add your first customer
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
