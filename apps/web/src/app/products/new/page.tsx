'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Package, Tag, TrendingUp, Hash } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

const GST_RATES = [0, 5, 12, 18, 28];
const UNITS = ['PCS','KG','GRAM','LITRE','METRE','BOX','DOZEN','SET','PAIR','BUNDLE','HOUR','DAY','MONTH','SERVICE'];
const PRODUCT_TYPES = [{ value: 'product', label: 'Product' }, { value: 'service', label: 'Service' }];

function F({ label, err, children }: { label: string; err?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  );
}

export default function NewProductPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'product',
    sku: '',
    barcode: '',
    hsnSac: '',
    unit: 'PCS',
    price: '',
    costPrice: '',
    mrp: '',
    gstRate: '18',
    cessRate: '',
    category: '',
    brand: '',
    stockCount: '',
    lowStockAlert: '',
    isTaxable: true,
  });

  const set = (key: string, val: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => { const e = { ...prev }; delete e[key]; return e; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Product name is required';
    if (!form.price || parseFloat(form.price) < 0) e.price = 'Valid price is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload: Record<string, any> = {
        name: form.name.trim(),
        type: form.type,
        unit: form.unit,
        price: parseFloat(form.price),
        gstRate: parseFloat(form.gstRate) || 18,
        isTaxable: form.isTaxable,
      };
      if (form.description) payload.description = form.description;
      if (form.sku) payload.sku = form.sku;
      if (form.barcode) payload.barcode = form.barcode;
      if (form.hsnSac) payload.hsnSac = form.hsnSac;
      if (form.costPrice) payload.costPrice = parseFloat(form.costPrice);
      if (form.mrp) payload.mrp = parseFloat(form.mrp);
      if (form.cessRate) payload.cessRate = parseFloat(form.cessRate);
      if (form.category) payload.category = form.category;
      if (form.brand) payload.brand = form.brand;
      if (form.stockCount) payload.stockCount = parseFloat(form.stockCount);
      if (form.lowStockAlert) payload.lowStockAlert = parseFloat(form.lowStockAlert);

      const res = await apiFetch<{ data: { id: string } }>('/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      success('Product added', `${form.name} has been saved.`);
      router.push(`/products/${res.data.id}`);
    } catch (err: any) {
      toastError('Failed to save', err.message);
    } finally {
      setLoading(false);
    }
  };

  const inp = (field: string, type = 'text', ph = '') => (
    <input
      type={type}
      value={(form as any)[field]}
      onChange={e => set(field, e.target.value)}
      placeholder={ph}
      className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${errors[field] ? 'border-red-400' : 'border-gray-300'}`}
    />
  );

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Product / Service</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create a new catalog item</p>
        </div>
        <div className="ml-auto">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : <Save className="h-4 w-4" />}
            Save Product
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Basic Info */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="h-4 w-4 text-indigo-600" /> Basic Information
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <F label="Product / Service Name *" err={errors.name}>{inp('name', 'text', 'e.g. Web Design Service')}</F>
              </div>
              <div className="sm:col-span-2">
                <F label="Description">
                  <textarea
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    rows={2}
                    placeholder="Brief description of the product or service"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                  />
                </F>
              </div>
              <F label="Type">
                <select value={form.type} onChange={e => set('type', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none">
                  {PRODUCT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </F>
              <F label="Unit">
                <select value={form.unit} onChange={e => set('unit', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none">
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </F>
              <F label="Category">
                {inp('category', 'text', 'e.g. Software, Hardware')}
              </F>
              <F label="Brand">
                {inp('brand', 'text', 'e.g. Apple, Samsung')}
              </F>
            </div>
          </div>

          {/* Pricing */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" /> Pricing
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <F label="Selling Price (₹) *" err={errors.price}>{inp('price', 'number', '0.00')}</F>
              <F label="Cost Price (₹)">{inp('costPrice', 'number', '0.00')}</F>
              <F label="MRP (₹)">{inp('mrp', 'number', '0.00')}</F>
              <F label="GST Rate (%)">
                <select value={form.gstRate} onChange={e => set('gstRate', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none">
                  {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                </select>
              </F>
              <F label="Cess Rate (%)">{inp('cessRate', 'number', '0')}</F>
              <div className="flex items-center gap-3 pt-6">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={form.isTaxable} onChange={e => set('isTaxable', e.target.checked)} className="rounded border-gray-300 text-indigo-600" />
                  Taxable item
                </label>
              </div>
            </div>
          </div>

          {/* Identifiers */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Hash className="h-4 w-4 text-purple-600" /> Identifiers
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <F label="SKU">{inp('sku', 'text', 'SKU-001')}</F>
              <F label="Barcode">{inp('barcode', 'text', '1234567890123')}</F>
              <F label="HSN / SAC Code">{inp('hsnSac', 'text', '998314')}</F>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4 text-indigo-600" /> Inventory
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Stock Quantity</label>
                <input type="number" value={form.stockCount} onChange={e => set('stockCount', e.target.value)} placeholder="0" min="0" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Low Stock Alert at</label>
                <input type="number" value={form.lowStockAlert} onChange={e => set('lowStockAlert', e.target.value)} placeholder="10" min="0" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs text-blue-700">
              <strong>HSN codes</strong> are required for goods. <strong>SAC codes</strong> apply to services. These appear on GST invoices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
