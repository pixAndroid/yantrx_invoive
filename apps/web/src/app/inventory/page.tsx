'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Search, AlertTriangle, TrendingUp, BarChart2, RefreshCw,
  ArrowUpCircle, ArrowDownCircle, Settings, X, Check, History, IndianRupee
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  unit: string;
  price: number;
  costPrice: number | null;
  stockCount: number | null;
  lowStockAlert: number | null;
  stockMovements?: StockMovement[];
}

interface StockMovement {
  id: string;
  type: string;
  quantity: number;
  previousQty: number;
  newQty: number;
  reference: string | null;
  notes: string | null;
  createdAt: string;
  product?: { name: string; sku: string | null };
}

interface InventoryStats {
  totalProducts: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
}

const MOVEMENT_TYPES = [
  { value: 'PURCHASE', label: 'Purchase (Stock In)', icon: ArrowUpCircle, color: 'text-green-600' },
  { value: 'RETURN', label: 'Return (Stock In)', icon: ArrowUpCircle, color: 'text-blue-600' },
  { value: 'OPENING', label: 'Opening Stock', icon: ArrowUpCircle, color: 'text-indigo-600' },
  { value: 'DAMAGE', label: 'Damage / Loss (Stock Out)', icon: ArrowDownCircle, color: 'text-red-600' },
  { value: 'ADJUSTMENT', label: 'Manual Adjustment (Set exact)', icon: Settings, color: 'text-purple-600' },
];

const MOVEMENT_COLORS: Record<string, string> = {
  PURCHASE: 'bg-green-100 text-green-700',
  SALE: 'bg-blue-100 text-blue-700',
  RETURN: 'bg-teal-100 text-teal-700',
  DAMAGE: 'bg-red-100 text-red-700',
  OPENING: 'bg-indigo-100 text-indigo-700',
  ADJUSTMENT: 'bg-purple-100 text-purple-700',
};

interface AdjustModalProps {
  product: Product;
  onClose: () => void;
  onSaved: () => void;
}

function AdjustModal({ product, onClose, onSaved }: AdjustModalProps) {
  const [type, setType] = useState('PURCHASE');
  const [quantity, setQuantity] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleSave = async () => {
    if (!quantity || parseFloat(quantity) <= 0) { setErr('Enter a valid quantity'); return; }
    setSaving(true); setErr('');
    try {
      await apiFetch('/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({ productId: product.id, type, quantity: parseFloat(quantity), reference: reference || undefined, notes: notes || undefined }),
      });
      onSaved();
      onClose();
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const isAdjustment = type === 'ADJUSTMENT';
  const currentStock = product.stockCount ?? 0;
  const qty = parseFloat(quantity) || 0;
  let previewNewQty = currentStock;
  if (isAdjustment) previewNewQty = qty;
  else if (type === 'DAMAGE') previewNewQty = Math.max(0, currentStock - qty);
  else previewNewQty = currentStock + qty;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Adjust Stock</h3>
            <p className="text-xs text-gray-500 mt-0.5">{product.name} · Current: {currentStock} {product.unit}</p>
          </div>
          <button onClick={onClose}><X className="h-4 w-4 text-gray-400" /></button>
        </div>
        {err && <p className="text-xs text-red-600 mb-3 bg-red-50 p-2 rounded-lg">{err}</p>}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Movement Type</label>
            <div className="space-y-1.5">
              {MOVEMENT_TYPES.map(t => (
                <label key={t.value} className={`flex items-center gap-3 rounded-lg border p-2.5 cursor-pointer transition-colors ${type === t.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input type="radio" name="type" value={t.value} checked={type === t.value} onChange={() => setType(t.value)} className="sr-only" />
                  <t.icon className={`h-4 w-4 ${t.color}`} />
                  <span className="text-sm text-gray-700">{t.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {isAdjustment ? 'New Quantity *' : 'Quantity *'}
            </label>
            <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} min="0" step="1"
              placeholder={isAdjustment ? 'Enter exact new stock count' : 'Enter quantity'}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            {quantity && (
              <p className={`text-xs mt-1 font-medium ${previewNewQty <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                New stock: {previewNewQty} {product.unit}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Reference (PO/Bill No.)</label>
            <input type="text" value={reference} onChange={e => setReference(e.target.value)} placeholder="Optional"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="h-4 w-4" />}
            Update Stock
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'stock' | 'movements'>('stock');
  const [adjustTarget, setAdjustTarget] = useState<Product | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (stockFilter) params.set('stockStatus', stockFilter);
      const [invRes, movRes] = await Promise.all([
        apiFetch<{ data: Product[]; stats: InventoryStats }>(`/inventory?${params}`),
        apiFetch<{ data: StockMovement[] }>('/inventory/movements?limit=30'),
      ]);
      setProducts(invRes.data || []);
      setStats(invRes.stats || null);
      setMovements(movRes.data || []);
    } catch { } finally { setLoading(false); }
  }, [search, stockFilter]);

  useEffect(() => {
    const t = setTimeout(fetchData, 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  return (
    <>
      <AnimatePresence>
        {adjustTarget && (
          <AdjustModal product={adjustTarget} onClose={() => setAdjustTarget(null)} onSaved={fetchData} />
        )}
      </AnimatePresence>

      <div className="p-6 lg:p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
            <p className="text-gray-500 mt-1">Stock management & movements</p>
          </div>
          <button onClick={fetchData} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {[
              { label: 'Total Products', value: stats.totalProducts, color: 'text-gray-900', bg: 'bg-gray-50', icon: Package },
              { label: 'In Stock', value: stats.inStock, color: 'text-green-700', bg: 'bg-green-50', icon: TrendingUp },
              { label: 'Low Stock', value: stats.lowStock, color: 'text-amber-700', bg: 'bg-amber-50', icon: AlertTriangle },
              { label: 'Out of Stock', value: stats.outOfStock, color: 'text-red-700', bg: 'bg-red-50', icon: AlertTriangle },
              { label: 'Inventory Value', value: `₹${stats.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: 'text-indigo-700', bg: 'bg-indigo-50', icon: IndianRupee },
            ].map((card, i) => (
              <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`rounded-2xl border border-gray-100 p-4 shadow-sm ${card.bg}`}>
                <card.icon className={`h-5 w-5 mb-2 ${card.color}`} />
                <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-5">
          {(['stock', 'movements'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all capitalize ${activeTab === tab ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab === 'movements' ? 'Stock Movements' : 'Stock Overview'}
            </button>
          ))}
        </div>

        {activeTab === 'stock' && (
          <>
            <div className="mb-4 flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:border-indigo-400 focus:outline-none" />
              </div>
              <select value={stockFilter} onChange={e => setStockFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none">
                <option value="">All Stock</option>
                <option value="in">In Stock</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                    <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">SKU</th>
                    <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Stock</th>
                    <th className="hidden md:table-cell px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Value</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-8 bg-gray-100 rounded animate-pulse" /></td></tr>
                    ))
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No products found</p>
                        <p className="text-xs text-gray-400 mt-1">Add products from the Products section first</p>
                      </td>
                    </tr>
                  ) : products.map((product, idx) => {
                    const stock = product.stockCount;
                    const isOut = stock === 0;
                    const isLow = stock !== null && product.lowStockAlert !== null && stock > 0 && stock <= product.lowStockAlert;
                    const stockValue = (stock || 0) * (product.costPrice || product.price);

                    return (
                      <motion.tr key={product.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                        className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                              <Package className="h-4 w-4 text-blue-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 text-xs font-mono text-gray-500">{product.sku || '—'}</td>
                        <td className="hidden md:table-cell px-4 py-3">
                          {product.category ? (
                            <span className="text-xs bg-gray-100 text-gray-700 rounded-full px-2.5 py-1">{product.category}</span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <p className={`text-sm font-bold ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-green-700'}`}>
                            {stock ?? '—'} {stock !== null ? product.unit : ''}
                          </p>
                          {product.lowStockAlert && <p className="text-xs text-gray-400">Alert: {product.lowStockAlert}</p>}
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 text-right text-sm text-gray-600">
                          {stock !== null ? `₹${stockValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {stock === null ? (
                            <span className="text-xs text-gray-400">Not tracked</span>
                          ) : isOut ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 rounded-full px-2.5 py-1 font-medium">
                              <AlertTriangle className="h-3 w-3" /> Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 rounded-full px-2.5 py-1 font-medium">
                              <AlertTriangle className="h-3 w-3" /> Low Stock
                            </span>
                          ) : (
                            <span className="text-xs bg-green-100 text-green-700 rounded-full px-2.5 py-1 font-medium">In Stock</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => setAdjustTarget(product)}
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors">
                            <Settings className="h-3.5 w-3.5" /> Adjust
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'movements' && (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <History className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700">Recent Stock Movements</h3>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Before → After</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={6} className="px-4 py-4"><div className="h-8 bg-gray-100 rounded animate-pulse" /></td></tr>
                  ))
                ) : movements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <BarChart2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No stock movements yet</p>
                    </td>
                  </tr>
                ) : movements.map((m, idx) => (
                  <motion.tr key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                    className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{m.product?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${MOVEMENT_COLORS[m.type] || 'bg-gray-100 text-gray-700'}`}>
                        {m.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-bold ${['SALE', 'DAMAGE'].includes(m.type) ? 'text-red-600' : 'text-green-600'}`}>
                        {['SALE', 'DAMAGE'].includes(m.type) ? '-' : m.type === 'ADJUSTMENT' ? '=' : '+'}{m.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      <span className="text-gray-400">{m.previousQty}</span>
                      <span className="mx-1 text-gray-300">→</span>
                      <span className="font-medium text-gray-900">{m.newQty}</span>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-xs text-gray-500 font-mono">{m.reference || m.notes || '—'}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
