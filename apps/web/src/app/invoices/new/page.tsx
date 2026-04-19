'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Search, Save, Send, ArrowLeft, Calculator, UserPlus, X, Check } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface Customer { id: string; name: string; email: string | null; phone: string | null; gstin: string | null; billingCity: string | null; billingState: string | null; }
interface InvoiceItem { id: string; description: string; productId: string | null; hsnSac: string; quantity: number; unit: string; price: number; discount: number; gstRate: number; taxableAmount: number; cgst: number; sgst: number; igst: number; total: number; }

const GST_RATES = [0, 5, 12, 18, 28];

function generateId() { return crypto.randomUUID().replace(/-/g, '').slice(0, 9); }

function calcItem(item: Partial<InvoiceItem>, interState: boolean): InvoiceItem {
  const q = item.quantity || 1, p = item.price || 0, d = item.discount || 0, g = item.gstRate || 0;
  const sub = q * p, disc = (sub * d) / 100, taxable = sub - disc;
  const gstAmt = (taxable * g) / 100;
  return {
    id: item.id || generateId(), description: item.description || '',
    productId: item.productId || null, hsnSac: item.hsnSac || '',
    quantity: q, unit: item.unit || 'PCS', price: p, discount: d, gstRate: g,
    taxableAmount: taxable,
    cgst: interState ? 0 : gstAmt / 2, sgst: interState ? 0 : gstAmt / 2,
    igst: interState ? gstAmt : 0, total: taxable + gstAmt,
  };
}

function AddCustomerModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Customer) => void }) {
  const { success, error: toastError } = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', gstin: '' });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));
  const handleCreate = async () => {
    if (!form.name.trim()) { toastError('Name required'); return; }
    setLoading(true);
    try {
      const res = await apiFetch<{ data: Customer }>('/customers', {
        method: 'POST',
        body: JSON.stringify({ name: form.name, email: form.email || undefined, phone: form.phone || undefined, gstin: form.gstin || undefined }),
      });
      success('Customer created', form.name);
      onCreated(res.data);
    } catch (err: any) { toastError('Failed', err.message); }
    finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Add New Customer</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-gray-400" /></button>
        </div>
        <div className="space-y-3">
          {([
            { label: 'Name *', key: 'name', placeholder: 'Customer name' },
            { label: 'Email', key: 'email', placeholder: 'email@example.com' },
            { label: 'Phone', key: 'phone', placeholder: '+91 98765 43210' },
            { label: 'GSTIN', key: 'gstin', placeholder: '22AAAAA0000A1Z5' },
          ] as const).map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
              <input value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleCreate} disabled={loading}
            className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : <Check className="h-4 w-4" />}
            Add Customer
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success, error: toastError, warning } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isInterState, setIsInterState] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [showCustomerDrop, setShowCustomerDrop] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<InvoiceItem[]>([
    calcItem({ id: generateId(), description: '', quantity: 1, price: 0, gstRate: 18, unit: 'PCS' }, false),
  ]);
  const [formData, setFormData] = useState({
    type: 'INVOICE', issueDate: new Date().toISOString().split('T')[0],
    dueDate: '', notes: '', terms: 'Payment due within 30 days.', placeOfSupply: '',
  });

  useEffect(() => {
    const cid = searchParams.get('customerId');
    if (cid) {
      apiFetch<{ data: Customer }>(`/customers/${cid}`).then(r => {
        setSelectedCustomer(r.data); setCustomerSearch(r.data.name);
      }).catch(() => {});
    }
  }, [searchParams]);

  useEffect(() => {
    if (!customerSearch || selectedCustomer) return;
    const t = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await apiFetch<{ data: Customer[] }>(`/customers?search=${encodeURIComponent(customerSearch)}&limit=8`);
        setCustomerResults(res.data); setShowCustomerDrop(true);
      } catch {} finally { setSearchLoading(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [customerSearch, selectedCustomer]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowCustomerDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addItem = () => setItems(prev => [...prev, calcItem({ id: generateId(), quantity: 1, price: 0, gstRate: 18, unit: 'PCS' }, isInterState)]);
  const removeItem = (id: string) => { if (items.length > 1) setItems(prev => prev.filter(i => i.id !== id)); };
  const updateItem = useCallback((id: string, field: keyof InvoiceItem, value: number | string) => {
    setItems(prev => prev.map(item => item.id === id ? calcItem({ ...item, [field]: value }, isInterState) : item));
  }, [isInterState]);
  useEffect(() => { setItems(prev => prev.map(i => calcItem(i, isInterState))); }, [isInterState]);

  const totals = items.reduce((acc, item) => ({
    subtotal: acc.subtotal + item.quantity * item.price,
    taxableAmount: acc.taxableAmount + item.taxableAmount,
    cgst: acc.cgst + item.cgst, sgst: acc.sgst + item.sgst, igst: acc.igst + item.igst,
    total: acc.total + item.total,
  }), { subtotal: 0, taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, total: 0 });

  const handleSave = async (statusOverride?: string) => {
    if (!selectedCustomer) { warning('Customer required', 'Please select or add a customer first.'); return; }
    const validItems = items.filter(i => i.description.trim());
    if (validItems.length === 0) { warning('Items required', 'Add at least one line item.'); return; }
    setIsLoading(true);
    try {
      const res = await apiFetch<{ data: { id: string } }>('/invoices', {
        method: 'POST',
        body: JSON.stringify({
          customerId: selectedCustomer.id, type: formData.type, issueDate: formData.issueDate,
          dueDate: formData.dueDate || undefined, isInterState,
          placeOfSupply: formData.placeOfSupply || selectedCustomer.billingState || undefined,
          notes: formData.notes || undefined, terms: formData.terms || undefined,
          items: validItems.map(item => ({
            productId: item.productId || undefined, description: item.description,
            hsnSac: item.hsnSac || undefined, quantity: item.quantity, unit: item.unit,
            price: item.price, discount: item.discount, gstRate: item.gstRate,
          })),
        }),
      });
      if (statusOverride === 'SENT') {
        try { await apiFetch(`/invoices/${res.data.id}/send`, { method: 'POST' }); } catch {}
        success('Invoice saved & sent');
      } else {
        success('Draft saved');
      }
      router.push(`/invoices/${res.data.id}`);
    } catch (err: any) {
      toastError('Failed to save invoice', err.message);
    } finally { setIsLoading(false); }
  };

  return (
    <>
      {showAddCustomer && (
        <AddCustomerModal onClose={() => setShowAddCustomer(false)}
          onCreated={(c) => { setSelectedCustomer(c); setCustomerSearch(c.name); setShowAddCustomer(false); }} />
      )}
      <div className="p-4 lg:p-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="rounded-lg p-2 hover:bg-gray-100"><ArrowLeft className="h-5 w-5" /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Invoice</h1>
            <p className="text-gray-500 text-sm">Create a GST-compliant invoice</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => handleSave()} disabled={isLoading} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              <Save className="h-4 w-4" /> Save Draft
            </button>
            <button onClick={() => handleSave('SENT')} disabled={isLoading} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              <Send className="h-4 w-4" /> Save &amp; Send
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Invoice Details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Invoice Type</label>
                  <select value={formData.type} onChange={e => setFormData(p => ({ ...p, type: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none">
                    <option value="INVOICE">Tax Invoice</option>
                    <option value="PROFORMA">Proforma Invoice</option>
                    <option value="ESTIMATE">Estimate/Quote</option>
                    <option value="CREDIT_NOTE">Credit Note</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Invoice Date</label>
                  <input type="date" value={formData.issueDate} onChange={e => setFormData(p => ({ ...p, issueDate: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
                  <input type="date" value={formData.dueDate} onChange={e => setFormData(p => ({ ...p, dueDate: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Place of Supply</label>
                  <input type="text" value={formData.placeOfSupply} onChange={e => setFormData(p => ({ ...p, placeOfSupply: e.target.value }))} placeholder="Karnataka" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
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

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Bill To</h2>
              {selectedCustomer ? (
                <div className="flex items-start justify-between rounded-xl bg-indigo-50 border border-indigo-100 p-4">
                  <div>
                    <p className="font-semibold text-indigo-900">{selectedCustomer.name}</p>
                    {selectedCustomer.email && <p className="text-sm text-indigo-700">{selectedCustomer.email}</p>}
                    {selectedCustomer.gstin && <p className="text-xs font-mono text-indigo-600 mt-1">{selectedCustomer.gstin}</p>}
                    {selectedCustomer.billingCity && <p className="text-xs text-indigo-600">{selectedCustomer.billingCity}, {selectedCustomer.billingState}</p>}
                  </div>
                  <button onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }} className="text-indigo-400 hover:text-indigo-600"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <div ref={searchRef} className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type="text" placeholder="Search customer by name, email, or GSTIN..."
                        value={customerSearch}
                        onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDrop(true); }}
                        onFocus={() => customerResults.length > 0 && setShowCustomerDrop(true)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-indigo-500 focus:outline-none" />
                      {searchLoading && <svg className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                    </div>
                    <button onClick={() => setShowAddCustomer(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-indigo-300 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-100 whitespace-nowrap">
                      <UserPlus className="h-4 w-4" /> Add New
                    </button>
                  </div>
                  <AnimatePresence>
                    {showCustomerDrop && customerResults.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        className="absolute top-full left-0 right-0 mt-1 z-20 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                        {customerResults.map(c => (
                          <button key={c.id} onClick={() => { setSelectedCustomer(c); setCustomerSearch(c.name); setShowCustomerDrop(false); }}
                            className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0">
                            <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-indigo-700 text-xs font-bold">{c.name.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{c.name}</p>
                              <p className="text-xs text-gray-500">{c.email || c.phone || c.gstin || ''}</p>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">Items &amp; Services</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase min-w-[200px]">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-24">HSN/SAC</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-20">Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-28">Price (&#8377;)</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-20">Disc%</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-20">GST%</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase w-28">Total (&#8377;)</th>
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
                        <td className="px-4 py-3"><input type="number" min="0" max="100" step="0.5" value={item.discount} onChange={e => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)} className="w-full border-0 bg-transparent text-sm focus:outline-none" /></td>
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

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                  <textarea rows={3} value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} placeholder="Thank you for your business!" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Terms &amp; Conditions</label>
                  <textarea rows={3} value={formData.terms} onChange={e => setFormData(p => ({ ...p, terms: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="h-4 w-4 text-indigo-600" />
                <h2 className="text-base font-semibold text-gray-900">Tax Summary</h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">&#8377;{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxable Amount</span>
                  <span className="font-medium">&#8377;{totals.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="border-t pt-3 space-y-2">
                  {!isInterState ? (
                    <>
                      <div className="flex justify-between text-sm"><span className="text-gray-600">CGST</span><span>&#8377;{totals.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-600">SGST</span><span>&#8377;{totals.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                    </>
                  ) : (
                    <div className="flex justify-between text-sm"><span className="text-gray-600">IGST</span><span>&#8377;{totals.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                  )}
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-indigo-600">&#8377;{totals.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
              <div className="mt-6 space-y-2">
                <button onClick={() => handleSave()} disabled={isLoading} className="w-full rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Save as Draft</button>
                <button onClick={() => handleSave('SENT')} disabled={isLoading} className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-50">
                  {isLoading ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : <Send className="h-4 w-4" />}
                  Save &amp; Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
