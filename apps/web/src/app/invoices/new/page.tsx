'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Trash2, Search, Save, Send, ArrowLeft, Calculator } from 'lucide-react';

interface InvoiceItem {
  id: string;
  description: string;
  hsnSac: string;
  quantity: number;
  unit: string;
  price: number;
  discount: number;
  gstRate: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

const GST_RATES = [0, 5, 12, 18, 28];

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function calculateItem(item: Partial<InvoiceItem>, isInterState: boolean): InvoiceItem {
  const quantity = item.quantity || 1;
  const price = item.price || 0;
  const discount = item.discount || 0;
  const gstRate = item.gstRate || 0;

  const subtotal = quantity * price;
  const discountAmount = (subtotal * discount) / 100;
  const taxableAmount = subtotal - discountAmount;
  const gstAmount = (taxableAmount * gstRate) / 100;

  return {
    id: item.id || generateId(),
    description: item.description || '',
    hsnSac: item.hsnSac || '',
    quantity,
    unit: item.unit || 'PCS',
    price,
    discount,
    gstRate,
    taxableAmount,
    cgst: isInterState ? 0 : gstAmount / 2,
    sgst: isInterState ? 0 : gstAmount / 2,
    igst: isInterState ? gstAmount : 0,
    total: taxableAmount + gstAmount,
  };
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isInterState, setIsInterState] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([
    calculateItem({ id: generateId(), description: '', quantity: 1, price: 0, gstRate: 18, unit: 'SERVICE' }, false),
  ]);

  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    type: 'INVOICE',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
    terms: 'Payment due within 30 days.',
    placeOfSupply: 'Karnataka',
  });

  const addItem = () => {
    setItems(prev => [...prev, calculateItem({ id: generateId(), description: '', quantity: 1, price: 0, gstRate: 18, unit: 'PCS' }, isInterState)]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateItem = useCallback((id: string, field: keyof InvoiceItem, value: number | string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? calculateItem({ ...item, [field]: value }, isInterState) : item
    ));
  }, [isInterState]);

  const totals = items.reduce(
    (acc, item) => ({
      subtotal: acc.subtotal + item.quantity * item.price,
      taxableAmount: acc.taxableAmount + item.taxableAmount,
      cgst: acc.cgst + item.cgst,
      sgst: acc.sgst + item.sgst,
      igst: acc.igst + item.igst,
      total: acc.total + item.total,
    }),
    { subtotal: 0, taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, total: 0 }
  );

  const handleSave = async (status: 'DRAFT' | 'SENT') => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          customerId: formData.customerId || 'placeholder',
          type: formData.type,
          issueDate: formData.issueDate,
          dueDate: formData.dueDate || undefined,
          isInterState,
          placeOfSupply: formData.placeOfSupply,
          notes: formData.notes,
          terms: formData.terms,
          items: items.map(item => ({
            description: item.description,
            hsnSac: item.hsnSac || undefined,
            quantity: item.quantity,
            unit: item.unit,
            price: item.price,
            discount: item.discount,
            gstRate: item.gstRate,
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/invoices/${data.data.id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Invoice</h1>
          <p className="text-gray-500 text-sm">Create a GST-compliant invoice</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => handleSave('DRAFT')} disabled={isLoading} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Save className="h-4 w-4" /> Save Draft
          </button>
          <button onClick={() => handleSave('SENT')} disabled={isLoading} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            <Send className="h-4 w-4" /> Save & Send
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Details */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Invoice Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Invoice Type</label>
                <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none">
                  <option value="INVOICE">Tax Invoice</option>
                  <option value="PROFORMA">Proforma Invoice</option>
                  <option value="ESTIMATE">Estimate/Quote</option>
                  <option value="CREDIT_NOTE">Credit Note</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Invoice Date</label>
                <input type="date" value={formData.issueDate} onChange={e => setFormData({ ...formData, issueDate: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
                <input type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Place of Supply</label>
                <input type="text" value={formData.placeOfSupply} onChange={e => setFormData({ ...formData, placeOfSupply: e.target.value })} placeholder="Karnataka" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" checked={isInterState} onChange={e => setIsInterState(e.target.checked)} className="sr-only peer" />
                <div className="peer h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-indigo-600 peer-checked:after:translate-x-full" />
              </label>
              <span className="text-sm text-gray-700">Inter-State Supply (IGST applies)</span>
            </div>
          </div>

          {/* Customer */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Bill To</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Search or type customer name..." value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>

          {/* Line Items */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Items & Services</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase min-w-[200px]">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-24">HSN/SAC</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-20">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-28">Price (₹)</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-20">GST%</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase w-28">Total (₹)</th>
                    <th className="px-3 py-3 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3"><input type="text" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} placeholder={`Item ${idx + 1}`} className="w-full border-0 bg-transparent text-sm focus:outline-none" /></td>
                      <td className="px-4 py-3"><input type="text" value={item.hsnSac} onChange={e => updateItem(item.id, 'hsnSac', e.target.value)} placeholder="998314" className="w-full border-0 bg-transparent text-sm focus:outline-none" /></td>
                      <td className="px-4 py-3"><input type="number" min="0.01" step="0.01" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-full border-0 bg-transparent text-sm focus:outline-none" /></td>
                      <td className="px-4 py-3"><input type="number" min="0" step="0.01" value={item.price} onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)} className="w-full border-0 bg-transparent text-sm focus:outline-none" /></td>
                      <td className="px-4 py-3">
                        <select value={item.gstRate} onChange={e => updateItem(item.id, 'gstRate', parseFloat(e.target.value))} className="w-full border-0 bg-transparent text-sm focus:outline-none">
                          {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right"><span className="text-sm font-medium text-gray-900">{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></td>
                      <td className="px-3 py-3">
                        <button onClick={() => removeItem(item.id)} disabled={items.length === 1} className="rounded p-1 text-gray-300 hover:text-red-500 disabled:opacity-30">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-100">
              <button onClick={addItem} className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                <Plus className="h-4 w-4" /> Add Line Item
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea rows={3} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Thank you for your business!" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Terms & Conditions</label>
                <textarea rows={3} value={formData.terms} onChange={e => setFormData({ ...formData, terms: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Tax Summary Sidebar */}
        <div>
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="h-4 w-4 text-indigo-600" />
              <h2 className="text-base font-semibold text-gray-900">Tax Summary</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t pt-3 space-y-2">
                {!isInterState ? (
                  <>
                    <div className="flex justify-between text-sm"><span className="text-gray-600">CGST</span><span>₹{totals.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-600">SGST</span><span>₹{totals.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                  </>
                ) : (
                  <div className="flex justify-between text-sm"><span className="text-gray-600">IGST</span><span>₹{totals.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                )}
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-indigo-600">₹{totals.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <button onClick={() => handleSave('DRAFT')} disabled={isLoading} className="w-full rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Save as Draft</button>
              <button onClick={() => handleSave('SENT')} disabled={isLoading} className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 flex items-center justify-center gap-2">
                {isLoading ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : <Send className="h-4 w-4" />}
                Save & Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
