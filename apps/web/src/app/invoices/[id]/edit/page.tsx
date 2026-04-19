'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Trash2, Search, Save, ArrowLeft, UserPlus, X, Check } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface Customer { id: string; name: string; email: string | null; phone: string | null; gstin: string | null; billingCity: string | null; billingState: string | null; }
interface InvoiceItem { id: string; description: string; productId: string | null; hsnSac: string; quantity: number; unit: string; price: number; discount: number; gstRate: number; taxableAmount: number; cgst: number; sgst: number; igst: number; total: number; }

const GST_RATES = [0, 5, 12, 18, 28];
const UNITS = ['PCS', 'KG', 'GRAM', 'LITRE', 'METRE', 'BOX', 'DOZEN', 'SET', 'PAIR', 'BUNDLE', 'HOUR', 'DAY', 'MONTH', 'SERVICE'];

function generateId() { return Math.random().toString(36).slice(2, 11); }

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

import { INDIAN_STATES as INDIAN_STATES_MODAL } from '@/lib/constants';

function AddCustomerModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Customer) => void }) {
  const { success, error: toastError } = useToast();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', gstin: '',
    billingAddress: '', billingCity: '', billingState: '', billingPincode: '',
    shippingAddress: '', shippingCity: '', shippingState: '', shippingPincode: '',
  });
  const [sameAsB, setSameAsB] = useState(true);
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));
  const handleCreate = async () => {
    if (!form.name.trim()) { toastError('Name required'); return; }
    setLoading(true);
    try {
      const payload: Record<string, any> = {
        name: form.name,
        ...(form.email && { email: form.email }),
        ...(form.phone && { phone: form.phone }),
        ...(form.gstin && { gstin: form.gstin }),
        ...(form.billingAddress && { billingAddress: form.billingAddress }),
        ...(form.billingCity && { billingCity: form.billingCity }),
        ...(form.billingState && { billingState: form.billingState }),
        ...(form.billingPincode && { billingPincode: form.billingPincode }),
      };
      if (sameAsB) {
        if (form.billingAddress) payload.shippingAddress = form.billingAddress;
        if (form.billingCity) payload.shippingCity = form.billingCity;
        if (form.billingState) payload.shippingState = form.billingState;
        if (form.billingPincode) payload.shippingPincode = form.billingPincode;
      } else {
        if (form.shippingAddress) payload.shippingAddress = form.shippingAddress;
        if (form.shippingCity) payload.shippingCity = form.shippingCity;
        if (form.shippingState) payload.shippingState = form.shippingState;
        if (form.shippingPincode) payload.shippingPincode = form.shippingPincode;
      }
      const res = await apiFetch<{ data: Customer }>('/customers', { method: 'POST', body: JSON.stringify(payload) });
      success('Customer created', form.name);
      onCreated(res.data);
    } catch (err: any) { toastError('Failed', err.message); }
    finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 z-10 max-h-[90vh] overflow-y-auto">
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

          {/* Billing Address */}
          <div className="pt-1">
            <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Billing Address</p>
            <div className="space-y-2">
              <input value={form.billingAddress} onChange={e => set('billingAddress', e.target.value)} placeholder="Street address"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              <div className="grid grid-cols-3 gap-2">
                <input value={form.billingCity} onChange={e => set('billingCity', e.target.value)} placeholder="City"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                <select value={form.billingState} onChange={e => set('billingState', e.target.value)}
                  className="rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                  <option value="">State</option>
                  {INDIAN_STATES_MODAL.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input value={form.billingPincode} onChange={e => set('billingPincode', e.target.value)} placeholder="Pincode"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Shipping Address</p>
              <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                <input type="checkbox" checked={sameAsB} onChange={e => setSameAsB(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600" />
                Same as billing
              </label>
            </div>
            {sameAsB ? (
              <p className="text-xs text-gray-400 italic">Shipping address will be same as billing address.</p>
            ) : (
              <div className="space-y-2">
                <input value={form.shippingAddress} onChange={e => set('shippingAddress', e.target.value)} placeholder="Street address"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                <div className="grid grid-cols-3 gap-2">
                  <input value={form.shippingCity} onChange={e => set('shippingCity', e.target.value)} placeholder="City"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                  <select value={form.shippingState} onChange={e => set('shippingState', e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                    <option value="">State</option>
                    {INDIAN_STATES_MODAL.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input value={form.shippingPincode} onChange={e => set('shippingPincode', e.target.value)} placeholder="Pincode"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
              </div>
            )}
          </div>
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

export default function EditInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { success, error: toastError, warning } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [isInterState, setIsInterState] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [showCustomerDrop, setShowCustomerDrop] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [formData, setFormData] = useState({
    type: 'INVOICE', issueDate: new Date().toISOString().split('T')[0],
    dueDate: '', notes: '', terms: '', placeOfSupply: '',
  });

  // Load existing invoice
  useEffect(() => {
    if (!id) return;
    setPageLoading(true);
    apiFetch<{ data: any }>(`/invoices/${id}`)
      .then(res => {
        const inv = res.data;
        if (['PAID', 'CANCELLED'].includes(inv.status)) {
          toastError('Cannot edit', `Cannot edit a ${inv.status.toLowerCase()} invoice`);
          router.push(`/invoices/${inv.id}`);
          return;
        }
        setFormData({
          type: inv.type || 'INVOICE',
          issueDate: inv.issueDate?.split('T')[0] || new Date().toISOString().split('T')[0],
          dueDate: inv.dueDate?.split('T')[0] || '',
          notes: inv.notes || '',
          terms: inv.terms || '',
          placeOfSupply: inv.placeOfSupply || '',
        });
        setIsInterState(inv.isInterState || false);
        setSelectedCustomer(inv.customer);
        setCustomerSearch(inv.customer?.name || '');
        const loadedItems = (inv.items || []).map((item: any) => calcItem({
          id: item.id || generateId(),
          description: item.description,
          productId: item.productId || null,
          hsnSac: item.hsnSac || '',
          quantity: item.quantity,
          unit: item.unit || 'PCS',
          price: item.price,
          discount: item.discount || 0,
          gstRate: item.gstRate || 0,
        }, inv.isInterState || false));
        setItems(loadedItems.length > 0 ? loadedItems : [calcItem({ id: generateId(), quantity: 1, price: 0, gstRate: 18, unit: 'PCS' }, false)]);
      })
      .catch(err => { toastError('Failed to load invoice', err.message); router.push('/invoices'); })
      .finally(() => setPageLoading(false));
  }, [id]);

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
  const removeItem = (itemId: string) => { if (items.length > 1) setItems(prev => prev.filter(i => i.id !== itemId)); };
  const updateItem = useCallback((itemId: string, field: keyof InvoiceItem, value: number | string) => {
    setItems(prev => prev.map(item => item.id === itemId ? calcItem({ ...item, [field]: value }, isInterState) : item));
  }, [isInterState]);
  useEffect(() => { setItems(prev => prev.map(i => calcItem(i, isInterState))); }, [isInterState]);

  const totals = items.reduce((acc, item) => ({
    subtotal: acc.subtotal + item.quantity * item.price,
    taxableAmount: acc.taxableAmount + item.taxableAmount,
    cgst: acc.cgst + item.cgst, sgst: acc.sgst + item.sgst, igst: acc.igst + item.igst,
    total: acc.total + item.total,
  }), { subtotal: 0, taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, total: 0 });

  const handleSave = async () => {
    if (!selectedCustomer) { warning('Customer required', 'Please select or add a customer first.'); return; }
    const validItems = items.filter(i => i.description.trim());
    if (validItems.length === 0) { warning('Items required', 'Add at least one line item.'); return; }
    setIsLoading(true);
    try {
      await apiFetch(`/invoices/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          type: formData.type,
          issueDate: formData.issueDate,
          dueDate: formData.dueDate || undefined,
          isInterState,
          placeOfSupply: formData.placeOfSupply || selectedCustomer.billingState || undefined,
          notes: formData.notes || undefined,
          terms: formData.terms || undefined,
          items: validItems.map(item => ({
            id: item.id,
            productId: item.productId || undefined,
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
      success('Invoice updated');
      router.push(`/invoices/${id}`);
    } catch (err: any) {
      toastError('Failed to update invoice', err.message);
    } finally { setIsLoading(false); }
  };

  if (pageLoading) {
    return <div className="p-6 lg:p-8 animate-pulse"><div className="h-64 bg-gray-100 rounded-2xl" /></div>;
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Edit Invoice</h1>
            <p className="text-gray-500 text-sm">Update invoice details</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => router.back()} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSave} disabled={isLoading} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              {isLoading ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : <Save className="h-4 w-4" />}
              Save Changes
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main form */}
          <div className="lg:col-span-2 space-y-5">
            {/* Invoice Type & Dates */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Invoice Details</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Type</label>
                  <select value={formData.type} onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                    {['INVOICE','PROFORMA','CREDIT_NOTE','DEBIT_NOTE','ESTIMATE','RECEIPT'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Issue Date</label>
                  <input type="date" value={formData.issueDate} onChange={e => setFormData(p => ({ ...p, issueDate: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Due Date</label>
                  <input type="date" value={formData.dueDate} onChange={e => setFormData(p => ({ ...p, dueDate: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
              </div>
            </div>

            {/* Customer */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Bill To</h2>
                <button onClick={() => setShowAddCustomer(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100">
                  <UserPlus className="h-3.5 w-3.5" /> Add Customer
                </button>
              </div>
              <div ref={searchRef} className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" placeholder="Search or select customer..." value={customerSearch}
                    onChange={e => { setCustomerSearch(e.target.value); setSelectedCustomer(null); }}
                    onFocus={() => { if (customerResults.length > 0) setShowCustomerDrop(true); }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-indigo-500 focus:outline-none" />
                  {searchLoading && <svg className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                </div>
                {showCustomerDrop && customerResults.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                    {customerResults.map(c => (
                      <button key={c.id} onClick={() => { setSelectedCustomer(c); setCustomerSearch(c.name); setShowCustomerDrop(false); }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{c.name}</p>
                          {c.email && <p className="text-xs text-gray-500">{c.email}</p>}
                        </div>
                        {c.gstin && <span className="text-xs font-mono text-gray-400">{c.gstin}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedCustomer && (
                <div className="mt-3 p-3 rounded-lg bg-indigo-50 border border-indigo-100 text-sm">
                  <p className="font-semibold text-indigo-900">{selectedCustomer.name}</p>
                  {selectedCustomer.gstin && <p className="text-xs text-indigo-600 font-mono mt-0.5">GSTIN: {selectedCustomer.gstin}</p>}
                  {selectedCustomer.email && <p className="text-xs text-indigo-600 mt-0.5">{selectedCustomer.email}</p>}
                </div>
              )}
            </div>

            {/* GST Type */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Tax Type</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{isInterState ? 'Inter-State: IGST applies' : 'Intra-State: CGST + SGST applies'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium ${!isInterState ? 'text-indigo-600' : 'text-gray-400'}`}>Intra-State</span>
                  <button onClick={() => setIsInterState(p => !p)}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${isInterState ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${isInterState ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                  <span className={`text-xs font-medium ${isInterState ? 'text-indigo-600' : 'text-gray-400'}`}>Inter-State</span>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Line Items</h2>
                <button onClick={addItem} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700">
                  <Plus className="h-3.5 w-3.5" /> Add Item
                </button>
              </div>
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-start p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="col-span-12 sm:col-span-5">
                      <label className="block text-xs text-gray-500 mb-1">Description *</label>
                      <input value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)}
                        placeholder={`Item ${idx + 1}`}
                        className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none bg-white" />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Qty</label>
                      <input type="number" value={item.quantity} min="0.01" step="0.01"
                        onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none bg-white" />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Price (₹)</label>
                      <input type="number" value={item.price} min="0" step="0.01"
                        onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none bg-white" />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">GST %</label>
                      <select value={item.gstRate} onChange={e => updateItem(item.id, 'gstRate', parseInt(e.target.value))}
                        className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none bg-white">
                        {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                      </select>
                    </div>
                    <div className="col-span-12 sm:col-span-1 flex items-end justify-between sm:justify-center">
                      <p className="text-xs text-gray-400 sm:hidden">Total: ₹{item.total.toFixed(2)}</p>
                      <button onClick={() => removeItem(item.id)} disabled={items.length === 1}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-30">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes & Terms */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Notes &amp; Terms</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Notes</label>
                  <textarea rows={3} value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Thank you for your business..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Terms &amp; Conditions</label>
                  <textarea rows={3} value={formData.terms} onChange={e => setFormData(p => ({ ...p, terms: e.target.value }))}
                    placeholder="Payment due within 30 days..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Summary sidebar */}
          <div className="space-y-5">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sticky top-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{totals.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Taxable</span><span>₹{totals.taxableAmount.toFixed(2)}</span></div>
                {!isInterState ? (
                  <>
                    <div className="flex justify-between text-gray-600"><span>CGST</span><span>₹{totals.cgst.toFixed(2)}</span></div>
                    <div className="flex justify-between text-gray-600"><span>SGST</span><span>₹{totals.sgst.toFixed(2)}</span></div>
                  </>
                ) : (
                  <div className="flex justify-between text-gray-600"><span>IGST</span><span>₹{totals.igst.toFixed(2)}</span></div>
                )}
                <div className="border-t pt-2 flex justify-between font-bold text-base text-gray-900">
                  <span>Total</span><span className="text-indigo-600">₹{totals.total.toFixed(2)}</span>
                </div>
              </div>
              <div className="mt-5 space-y-2">
                <button onClick={handleSave} disabled={isLoading} className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-50">
                  {isLoading ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : <Save className="h-4 w-4" />}
                  Save Changes
                </button>
                <button onClick={() => router.back()} className="w-full rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
