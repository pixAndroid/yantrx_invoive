'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Search, Package, Tag, TrendingUp, RefreshCw, Edit2, Trash2, AlertTriangle, BarChart2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';

interface Product {
  id: string;
  name: string;
  type: string;
  hsnSac: string | null;
  price: number;
  costPrice: number | null;
  mrp: number | null;
  gstRate: number;
  category: string | null;
  unit: string;
  stockCount: number | null;
  lowStockAlert: number | null;
  isActive: boolean;
}

function StockBadge({ stockCount, lowStockAlert, type }: { stockCount: number | null; lowStockAlert: number | null; type: string }) {
  if (type === 'service') {
    return <span className="text-xs text-gray-400 italic">N/A</span>;
  }
  if (stockCount === null) {
    return <span className="text-sm text-gray-400">—</span>;
  }
  const isOut = stockCount === 0;
  const isLow = lowStockAlert !== null && stockCount > 0 && stockCount <= lowStockAlert;

  return (
    <div className="flex flex-col gap-0.5">
      <span className={`text-sm font-semibold ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-green-700'}`}>
        {stockCount.toLocaleString('en-IN')}
      </span>
      {isOut && (
        <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 rounded-full px-1.5 py-0.5 font-medium w-fit">
          <AlertTriangle className="h-3 w-3" /> Out of Stock
        </span>
      )}
      {isLow && (
        <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 rounded-full px-1.5 py-0.5 font-medium w-fit">
          <AlertTriangle className="h-3 w-3" /> Low Stock
        </span>
      )}
      {!isOut && !isLow && (
        <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 rounded-full px-1.5 py-0.5 font-medium w-fit">
          In Stock
        </span>
      )}
      {lowStockAlert !== null && (
        <span className="text-xs text-gray-400">Alert at {lowStockAlert}</span>
      )}
    </div>
  );
}

export default function ProductsPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '100' });
      const res = await apiFetch<{ data: Product[] }>(`/products?${params}`);
      setProducts(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/products/${deleteTarget.id}`, { method: 'DELETE' });
      success('Product deleted', `"${deleteTarget.name}" has been removed.`);
      setDeleteTarget(null);
      fetchProducts();
    } catch (err: any) {
      toastError('Failed to delete', err.message);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
  );

  // Stock summary stats
  const productItems = products.filter(p => p.type !== 'service');
  const inStockCount = productItems.filter(p => p.stockCount !== null && p.stockCount > 0).length;
  const lowStockCount = productItems.filter(p => p.stockCount !== null && p.lowStockAlert !== null && p.stockCount <= p.lowStockAlert && p.stockCount > 0).length;
  const outOfStockCount = productItems.filter(p => p.stockCount !== null && p.stockCount === 0).length;

  return (
    <div className="p-6 lg:p-8">
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products & Services</h1>
          <p className="text-gray-500 mt-1">{filtered.length} items in catalog</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchProducts} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 active:scale-95">
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link href="/products/new" className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 hover:shadow-md transition-all duration-150 active:scale-95">
            <Plus className="h-4 w-4" /> Add Product
          </Link>
        </div>
      </div>

      {/* Stock summary stats */}
      {productItems.length > 0 && (
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs text-gray-500 font-medium flex items-center gap-1"><BarChart2 className="h-3.5 w-3.5" /> Total Products</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{productItems.length}</p>
          </div>
          <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 shadow-sm">
            <p className="text-xs text-green-700 font-medium">In Stock</p>
            <p className="text-2xl font-bold text-green-700 mt-0.5">{inStockCount}</p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 shadow-sm">
            <p className="text-xs text-amber-700 font-medium">Low Stock</p>
            <p className="text-2xl font-bold text-amber-700 mt-0.5">{lowStockCount}</p>
          </div>
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 shadow-sm">
            <p className="text-xs text-red-700 font-medium">Out of Stock</p>
            <p className="text-2xl font-bold text-red-700 mt-0.5">{outOfStockCount}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-150" />
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
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-8 bg-gray-100 rounded animate-pulse" /></td></tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No products found</p>
                  <Link href="/products/new" className="mt-3 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline">
                    <Plus className="h-4 w-4" /> Add your first product
                  </Link>
                </td>
              </tr>
            ) : filtered.map((product, idx) => (
              <motion.tr
                key={product.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/products/${product.id}`)}
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${product.type === 'service' ? 'bg-purple-50' : 'bg-blue-50'}`}>
                      {product.type === 'service' ? <TrendingUp className="h-4 w-4 text-purple-600" /> : <Package className="h-4 w-4 text-blue-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 hover:text-indigo-600">{product.name}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${product.type === 'service' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                        {product.type}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm font-mono text-gray-500">{product.hsnSac || '—'}</td>
                <td className="px-4 py-4">
                  {product.category ? (
                    <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 rounded-full px-2.5 py-1">
                      <Tag className="h-3 w-3" /> {product.category}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="text-sm font-semibold text-gray-900">₹{product.price.toLocaleString('en-IN')}</span>
                  {product.mrp && product.mrp > product.price && (
                    <p className="text-xs text-gray-400 line-through">₹{product.mrp.toLocaleString('en-IN')}</p>
                  )}
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">{product.gstRate}%</td>
                <td className="px-4 py-4">
                  <StockBadge stockCount={product.stockCount} lowStockAlert={product.lowStockAlert} type={product.type} />
                </td>
                <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1 relative">
                    <button
                      onClick={() => router.push(`/products/${product.id}`)}
                      className="rounded-lg p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(product)}
                      className="rounded-lg p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

