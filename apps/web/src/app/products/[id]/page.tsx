'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Edit2, Trash2, Package, TrendingUp, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface Product {
  id: string;
  name: string;
  description: string | null;
  type: string;
  sku: string | null;
  barcode: string | null;
  hsnSac: string | null;
  unit: string;
  price: number;
  costPrice: number | null;
  mrp: number | null;
  gstRate: number;
  cessRate: number | null;
  category: string | null;
  brand: string | null;
  stockCount: number | null;
  lowStockAlert: number | null;
  isTaxable: boolean;
  isActive: boolean;
}

const GST_RATES = [0, 5, 12, 18, 28];
const UNITS = ['PCS','KG','GRAM','LITRE','METRE','BOX','DOZEN','SET','PAIR','BUNDLE','HOUR','DAY','MONTH','SERVICE'];

function getStockStatusColor(stockCount: number | null, lowStockAlert: number | null): string {
  if (stockCount === 0) return 'text-red-600';
  if (lowStockAlert !== null && stockCount !== null && stockCount <= lowStockAlert) return 'text-amber-600';
  return 'text-green-700';
}

function getStockStatusLabel(stockCount: number | null, lowStockAlert: number | null): string {
  if (stockCount === 0) return '⚠ Out of Stock';
  if (lowStockAlert !== null && stockCount !== null && stockCount <= lowStockAlert) return '⚠ Low Stock';
  return '✓ In Stock';
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState<Partial<Product>>({});

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: Product }>(`/products/${id}`);
      setProduct(res.data);
      setForm(res.data);
    } catch (err: any) {
      toastError('Failed to load', err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSave = async () => {
    if (!form.name?.trim()) { toastError('Validation', 'Product name required'); return; }
    setSaving(true);
    try {
      const res = await apiFetch<{ data: Product }>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      setProduct(res.data);
      setForm(res.data);
      setEditing(false);
      success('Product updated', 'Changes saved successfully.');
    } catch (err: any) {
      toastError('Failed to update', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiFetch(`/products/${id}`, { method: 'DELETE' });
      success('Product deleted');
      router.push('/products');
    } catch (err: any) {
      toastError('Failed to delete', err.message);
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const set = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  if (loading) {
    return <div className="p-6 lg:p-8"><div className="animate-pulse h-64 bg-gray-100 rounded-2xl" /></div>;
  }

  if (!product) {
    return <div className="p-6 text-center text-gray-500">Product not found.</div>;
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <ConfirmModal
        open={confirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${product.name}"?`}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.push('/products')} className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${product.type === 'service' ? 'bg-purple-50' : 'bg-blue-50'}`}>
            {product.type === 'service' ? <TrendingUp className="h-5 w-5 text-purple-600" /> : <Package className="h-5 w-5 text-blue-600" />}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-sm text-gray-500 capitalize">{product.type}</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {editing ? (
            <>
              <button onClick={() => { setEditing(false); setForm(product); }} className="rounded-lg p-2 border border-gray-200 hover:bg-gray-50"><X className="h-4 w-4" /></button>
              <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                {saving ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : <Save className="h-4 w-4" />}
                Save
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50">
                <Edit2 className="h-4 w-4" /> Edit
              </button>
              <button onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stock summary cards (view mode only, for products) */}
      {!editing && product.type !== 'service' && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Current Stock</p>
            <p className={`text-2xl font-bold mt-0.5 ${getStockStatusColor(product.stockCount, product.lowStockAlert)}`}>
              {product.stockCount !== null ? product.stockCount.toLocaleString('en-IN') : '—'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{product.unit}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Low Stock Alert</p>
            <p className="text-2xl font-bold text-gray-700 mt-0.5">
              {product.lowStockAlert !== null ? product.lowStockAlert.toLocaleString('en-IN') : '—'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">threshold</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Stock Status</p>
            <p className={`text-sm font-semibold mt-1 ${getStockStatusColor(product.stockCount, product.lowStockAlert)}`}>
              {getStockStatusLabel(product.stockCount, product.lowStockAlert)}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        {editing ? (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input value={form.name || ''} onChange={e => set('name', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description || ''} onChange={e => set('description', e.target.value)} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none" />
            </div>
            {[
              { label: 'SKU', key: 'sku' },
              { label: 'Barcode', key: 'barcode' },
              { label: 'HSN/SAC', key: 'hsnSac' },
              { label: 'Category', key: 'category' },
              { label: 'Brand', key: 'brand' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <input value={(form as any)[f.key] || ''} onChange={e => set(f.key, e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select value={form.unit || 'PCS'} onChange={e => set('unit', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₹)</label>
              <input type="number" value={form.price || 0} onChange={e => set('price', parseFloat(e.target.value) || 0)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (₹)</label>
              <input type="number" value={form.costPrice || 0} onChange={e => set('costPrice', parseFloat(e.target.value) || 0)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">MRP (₹)</label>
              <input type="number" value={form.mrp || 0} onChange={e => set('mrp', parseFloat(e.target.value) || 0)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
              <select value={form.gstRate || 18} onChange={e => set('gstRate', parseFloat(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock Qty</label>
              <input type="number" min="0" value={form.stockCount ?? ''} onChange={e => set('stockCount', e.target.value === '' ? null : (parseFloat(e.target.value) || null))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert at</label>
              <input type="number" min="0" value={form.lowStockAlert ?? ''} onChange={e => set('lowStockAlert', e.target.value === '' ? null : (parseFloat(e.target.value) || null))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-y-4 gap-x-8">
            {[
              { label: 'Type', value: product.type },
              { label: 'Unit', value: product.unit },
              { label: 'SKU', value: product.sku || '—' },
              { label: 'Barcode', value: product.barcode || '—' },
              { label: 'HSN/SAC', value: product.hsnSac || '—' },
              { label: 'Category', value: product.category || '—' },
              { label: 'Brand', value: product.brand || '—' },
              { label: 'Selling Price', value: `₹${product.price.toLocaleString('en-IN')}` },
              { label: 'Cost Price', value: product.costPrice ? `₹${product.costPrice.toLocaleString('en-IN')}` : '—' },
              { label: 'MRP', value: product.mrp ? `₹${product.mrp.toLocaleString('en-IN')}` : '—' },
              { label: 'GST Rate', value: `${product.gstRate}%` },
              { label: 'Current Stock', value: product.stockCount !== null ? `${product.stockCount.toLocaleString('en-IN')} ${product.unit}` : '—' },
              { label: 'Low Stock Alert', value: product.lowStockAlert !== null ? String(product.lowStockAlert) : '—' },
            ].map(row => (
              <div key={row.label} className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-sm text-gray-500">{row.label}</span>
                <span className="text-sm font-medium text-gray-900">{row.value}</span>
              </div>
            ))}
            {product.description && (
              <div className="sm:col-span-2 mt-2">
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-700">{product.description}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
