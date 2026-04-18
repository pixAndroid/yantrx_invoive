'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Search, Package, Tag, TrendingUp } from 'lucide-react';

const PRODUCTS = [
  { id: '1', name: 'Web Development Services', type: 'service', hsnSac: '998314', price: 50000, gstRate: 18, category: 'Technology', stock: null },
  { id: '2', name: 'Monthly Maintenance', type: 'service', hsnSac: '998313', price: 5000, gstRate: 18, category: 'Technology', stock: null },
  { id: '3', name: 'Cloud Hosting (Annual)', type: 'product', hsnSac: '998315', price: 12000, gstRate: 18, category: 'Hosting', stock: 100 },
  { id: '4', name: 'SEO Optimization', type: 'service', hsnSac: '998367', price: 15000, gstRate: 18, category: 'Marketing', stock: null },
];

export default function ProductsPage() {
  const [search, setSearch] = useState('');

  const filtered = PRODUCTS.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products & Services</h1>
          <p className="text-gray-500 mt-1">{filtered.length} items in catalog</p>
        </div>
        <Link href="/products/new" className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> Add Product
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:border-indigo-400 focus:outline-none" />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product / Service</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">HSN/SAC</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Price</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">GST</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((product, idx) => (
              <motion.tr key={product.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${product.type === 'service' ? 'bg-purple-50' : 'bg-blue-50'}`}>
                      {product.type === 'service' ? <TrendingUp className="h-4 w-4 text-purple-600" /> : <Package className="h-4 w-4 text-blue-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${product.type === 'service' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                        {product.type}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm font-mono text-gray-500">{product.hsnSac}</td>
                <td className="px-4 py-4">
                  <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 rounded-full px-2.5 py-1">
                    <Tag className="h-3 w-3" /> {product.category}
                  </span>
                </td>
                <td className="px-4 py-4 text-right text-sm font-semibold text-gray-900">₹{product.price.toLocaleString('en-IN')}</td>
                <td className="px-4 py-4 text-sm text-gray-600">{product.gstRate}%</td>
                <td className="px-4 py-4 text-sm text-gray-600">{product.stock !== null ? product.stock : '—'}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
