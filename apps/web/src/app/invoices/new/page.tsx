'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Search, Save, Send, ArrowLeft, Calculator, UserPlus, X, Check, Lock, FileText, AlertTriangle } from 'lucide-react';
import { apiFetch, getUserData } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface Customer { id: string; name: string; email: string | null; phone: string | null; gstin: string | null; billingCity: string | null; billingState: string | null; }
interface InvoiceItem { id: string; description: string; productId: string | null; hsnSac: string; quantity: number; unit: string; price: number; discount: number; gstRate: number; taxableAmount: number; cgst: number; sgst: number; igst: number; total: number; }
interface Product { id: string; name: string; hsnSac: string | null; price: number; gstRate: number; unit: string; }

const GST_RATES = [0, 5, 12, 18, 28];
const INVOICE_WARNING_THRESHOLD = 2;

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

import { INDIAN_STATES as INDIAN_STATES_MODAL } from '@/lib/constants';

function AddCustomerModal({ onClose, onCreated, customerLimitReached }: { onClose: () => void; onCreated: (c: Customer) => void; customerLimitReached?: boolean }) {
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
    if (customerLimitReached) { toastError('Customer limit reached', 'Please upgrade your plan to add more customers.'); return; }
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
        {customerLimitReached && (
          <div className="mb-3 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
            <strong>Customer limit reached.</strong> Please upgrade your plan to add more customers.
          </div>
        )}
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
          <button onClick={handleCreate} disabled={loading || customerLimitReached}
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
  const [invoiceLimitReached, setInvoiceLimitReached] = useState(false);
  const [customerLimitReached, setCustomerLimitReached] = useState(false);
  const [invoicesLeft, setInvoicesLeft] = useState<number | null>(null);

  const [items, setItems] = useState<InvoiceItem[]>([
    calcItem({ id: generateId(), description: '', quantity: 1, price: 0, gstRate: 18, unit: 'PCS' }, false),
  ]);
  const [formData, setFormData] = useState({
    type: 'INVOICE', issueDate: new Date().toISOString().split('T')[0],
    dueDate: '', notes: '', terms: '', placeOfSupply: '',
  });

  // Product suggestion state
  const [productSuggestions, setProductSuggestions] = useState<Record<string, Product[]>>({});
  const [activeSuggestionItem, setActiveSuggestionItem] = useState<string | null>(null);
  const descSearchTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const descInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    const tokenData = getUserData();
    const businessId = tokenData?.businessId;
    if (businessId) {
      apiFetch<{ data: { termsAndConditions?: string | null } }>(`/business/${businessId}`)
        .then(res => {
          if (res.data?.termsAndConditions) {
            setFormData(prev => ({ ...prev, terms: res.data.termsAndConditions! }));
          }
        })
        .catch(() => {});
    }

    // Check plan limits
    Promise.all([
      apiFetch('/subscriptions'),
      apiFetch('/business/stats'),
    ]).then(([subRes, statsRes]: [any, any]) => {
      const subs: any[] = subRes.data || [];
      const sub = subs.find((s: any) => s.status === 'ACTIVE' || s.status === 'TRIAL') || null;
      if (!sub) return;
      const invoiceLimit: number = sub.plan?.invoiceLimit || 0;
      const customerLimit: number = sub.plan?.customerLimit || 0;
      const invoicesUsed: number = statsRes.data?.invoicesThisMonth ?? 0;
      const customersUsed: number = statsRes.data?.activeCustomers ?? 0;
      // Block invoice creation if plan is expired
      if (sub.status === 'EXPIRED') {
        setInvoiceLimitReached(true);
        setInvoicesLeft(0);
      } else if (invoiceLimit > 0) {
        setInvoiceLimitReached(invoicesUsed >= invoiceLimit);
        setInvoicesLeft(Math.max(0, invoiceLimit - invoicesUsed));
      }
      if (customerLimit > 0) {
        setCustomerLimitReached(customersUsed >= customerLimit);
      }
    }).catch(() => {});
  }, []);

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

  const handleDescriptionChange = useCallback((id: string, value: string) => {
    updateItem(id, 'description', value);
    // Clear previous timer for this item
    if (descSearchTimers.current[id]) {
      clearTimeout(descSearchTimers.current[id]);
      delete descSearchTimers.current[id];
    }
    if (!value.trim()) {
      setProductSuggestions(prev => { const next = { ...prev }; delete next[id]; return next; });
      setActiveSuggestionItem(null);
      return;
    }
    descSearchTimers.current[id] = setTimeout(async () => {
      delete descSearchTimers.current[id];
      try {
        const res = await apiFetch<{ data: Product[] }>(`/products?search=${encodeURIComponent(value.trim())}&limit=8`);
        if (res.data && res.data.length > 0) {
          setProductSuggestions(prev => ({ ...prev, [id]: res.data }));
          setActiveSuggestionItem(id);
        } else {
          setProductSuggestions(prev => { const next = { ...prev }; delete next[id]; return next; });
          setActiveSuggestionItem(null);
        }
      } catch {}
    }, 250);
  }, [updateItem]);

  const applyProductSuggestion = useCallback((itemId: string, product: Product) => {
    setItems(prev => prev.map(item =>
      item.id === itemId
        ? calcItem({ ...item, description: product.name, productId: product.id, hsnSac: product.hsnSac || '', price: product.price, gstRate: product.gstRate, unit: product.unit }, isInterState)
        : item
    ));
    setProductSuggestions(prev => { const next = { ...prev }; delete next[itemId]; return next; });
    setActiveSuggestionItem(null);
  }, [isInterState]);

  // Close product suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('[data-product-suggestions]')) {
        setActiveSuggestionItem(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  useEffect(() => {
    if (activeSuggestionItem && descInputRefs.current[activeSuggestionItem]) {
      const rect = descInputRefs.current[activeSuggestionItem]!.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: Math.max(288, rect.width) });
    } else {
      setDropdownPos(null);
    }
  }, [activeSuggestionItem]);
  useEffect(() => {
    const update = () => {
      if (activeSuggestionItem && descInputRefs.current[activeSuggestionItem]) {
        const rect = descInputRefs.current[activeSuggestionItem]!.getBoundingClientRect();
        setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: Math.max(288, rect.width) });
      }
    };
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [activeSuggestionItem]);

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

  const inputCls = "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all";
  const labelCls = "block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5";

  return (
    <>
      {showAddCustomer && (
        <AddCustomerModal onClose={() => setShowAddCustomer(false)}
          customerLimitReached={customerLimitReached}
          onCreated={(c) => { setSelectedCustomer(c); setCustomerSearch(c.name); setShowAddCustomer(false); }} />
      )}
      <div className="p-4 lg:p-6 xl:p-8 w-full max-w-full">

        {/* Page Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-gray-50 hover:text-gray-700 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">New Invoice</h1>
            <p className="text-sm text-gray-400 mt-0.5">Create a GST-compliant invoice</p>
          </div>
          <div className="ml-auto flex flex-col items-end gap-2">
            {invoiceLimitReached && (
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-red-600 ring-1 ring-red-200"
              >
                <Lock className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold">Limit reached</span>
              </motion.div>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSave()}
                disabled={isLoading || invoiceLimitReached}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 disabled:opacity-50 transition-all"
              >
                <Save className="h-4 w-4" />
                Save Draft
              </button>
              <button
                onClick={() => handleSave('SENT')}
                disabled={isLoading || invoiceLimitReached}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 transition-all"
              >
                <Send className="h-4 w-4" />
                Save &amp; Send
              </button>
            </div>
          </div>
        </div>

        {/* Alert Banners */}
        {invoiceLimitReached && (
          <div className="mb-5 rounded-2xl bg-red-50 border border-red-200 p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-red-100">
              <Lock className="h-4 w-4 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">Invoice limit reached</p>
              <p className="text-xs text-red-500 mt-0.5">You have used all invoices for this month. Upgrade to create more.</p>
            </div>
            <a href="/settings/billing" className="flex-shrink-0 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors">Upgrade Plan</a>
          </div>
        )}
        {invoicesLeft !== null && invoicesLeft <= INVOICE_WARNING_THRESHOLD && !invoiceLimitReached && (
          <div className="mb-5 rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-sm font-medium text-amber-800 flex-1">
              Only <strong>{invoicesLeft}</strong> invoice{invoicesLeft === 1 ? '' : 's'} left this month.{' '}
              <a href="/settings/billing" className="underline underline-offset-2 font-semibold">Upgrade your plan</a> to avoid interruption.
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">

            {/* Invoice Details */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50">
                  <FileText className="h-3.5 w-3.5 text-indigo-600" />
                </span>
                <h2 className="text-sm font-semibold text-gray-800">Invoice Details</h2>
              </div>
              <div className="p-6">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelCls}>Invoice Type</label>
                    <select value={formData.type} onChange={e => setFormData(p => ({ ...p, type: e.target.value }))} className={inputCls}>
                      <option value="INVOICE">Tax Invoice</option>
                      <option value="PROFORMA">Proforma Invoice</option>
                      <option value="ESTIMATE">Estimate/Quote</option>
                      <option value="CREDIT_NOTE">Credit Note</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Invoice Date</label>
                    <input type="date" value={formData.issueDate} onChange={e => setFormData(p => ({ ...p, issueDate: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Due Date</label>
                    <input type="date" value={formData.dueDate} onChange={e => setFormData(p => ({ ...p, dueDate: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Place of Supply</label>
                    <input type="text" value={formData.placeOfSupply} onChange={e => setFormData(p => ({ ...p, placeOfSupply: e.target.value }))} placeholder="e.g. Karnataka" className={inputCls} />
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" checked={isInterState} onChange={e => setIsInterState(e.target.checked)} className="sr-only peer" />
                    <div className="peer h-5 w-9 rounded-full bg-gray-300 transition-all after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:bg-indigo-600 peer-checked:after:translate-x-full" />
                  </label>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Inter-State Supply</span>
                    <span className="ml-2 text-xs text-gray-400">(IGST applies)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bill To */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">
                  <UserPlus className="h-3.5 w-3.5 text-violet-600" />
                </span>
                <h2 className="text-sm font-semibold text-gray-800">Bill To</h2>
              </div>
              <div className="p-6">
                {selectedCustomer ? (
                  <div className="flex items-start justify-between rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm">
                        {selectedCustomer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-indigo-900 text-sm">{selectedCustomer.name}</p>
                        {selectedCustomer.email && <p className="text-xs text-indigo-600 mt-0.5">{selectedCustomer.email}</p>}
                        {selectedCustomer.gstin && <p className="text-xs font-mono text-indigo-500 mt-1 bg-indigo-100 px-2 py-0.5 rounded-md inline-block">{selectedCustomer.gstin}</p>}
                        {selectedCustomer.billingCity && (
                          <p className="text-xs text-indigo-500 mt-1">{selectedCustomer.billingCity}, {selectedCustomer.billingState}</p>
                        )}
                      </div>
                    </div>
                    <button onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }} className="rounded-lg p-1 text-indigo-300 hover:bg-indigo-100 hover:text-indigo-600 transition-all">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div ref={searchRef} className="relative">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search by name, email, or GSTIN…"
                          value={customerSearch}
                          onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDrop(true); }}
                          onFocus={() => customerResults.length > 0 && setShowCustomerDrop(true)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm shadow-sm placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                        {searchLoading && (
                          <svg className="animate-spin absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                        )}
                      </div>
                      <button
                        onClick={() => setShowAddCustomer(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-indigo-300 bg-indigo-50 px-3.5 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-100 whitespace-nowrap transition-all"
                      >
                        <UserPlus className="h-4 w-4" />
                        Add New
                      </button>
                    </div>
                    <AnimatePresence>
                      {showCustomerDrop && customerResults.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="absolute top-full left-0 right-0 mt-1.5 z-20 rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden"
                        >
                          {customerResults.map(c => (
                            <button
                              key={c.id}
                              onClick={() => { setSelectedCustomer(c); setCustomerSearch(c.name); setShowCustomerDrop(false); }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-indigo-50 border-b border-gray-50 last:border-0 transition-colors"
                            >
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-100 font-bold text-indigo-700 text-sm">
                                {c.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                                <p className="text-xs text-gray-400">{c.email || c.phone || c.gstin || ''}</p>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>

            {/* Items & Services */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50">
                  <Calculator className="h-3.5 w-3.5 text-emerald-600" />
                </span>
                <h2 className="text-sm font-semibold text-gray-800">Items &amp; Services</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 min-w-[200px]">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 w-24">HSN/SAC</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 w-20">Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 w-28">Price (&#8377;)</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 w-20">Disc%</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 w-20">GST%</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400 w-28">Total (&#8377;)</th>
                      <th className="px-3 py-3 w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map((item, idx) => (
                      <tr key={item.id} className="group hover:bg-indigo-50/30 transition-colors">
                        <td className="px-4 py-3" data-product-suggestions>
                          <input type="text" value={item.description}
                            ref={el => { descInputRefs.current[item.id] = el; }}
                            onChange={e => handleDescriptionChange(item.id, e.target.value)}
                            onFocus={() => { if (productSuggestions[item.id]?.length) setActiveSuggestionItem(item.id); }}
                            placeholder={`Item ${idx + 1}`}
                            className="w-full border-0 bg-transparent text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none" />
                        </td>
                        <td className="px-4 py-3">
                          <input type="text" value={item.hsnSac} onChange={e => updateItem(item.id, 'hsnSac', e.target.value)} placeholder="998314"
                            className="w-full border-0 bg-transparent text-sm text-gray-600 placeholder:text-gray-300 focus:outline-none" />
                        </td>
                        <td className="px-4 py-3">
                          <input type="number" min="0.01" step="0.01" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full border-0 bg-transparent text-sm text-gray-700 focus:outline-none" />
                        </td>
                        <td className="px-4 py-3">
                          <input type="number" min="0" step="0.01" value={item.price} onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                            className="w-full border-0 bg-transparent text-sm text-gray-700 focus:outline-none" />
                        </td>
                        <td className="px-4 py-3">
                          <input type="number" min="0" max="100" step="0.5" value={item.discount} onChange={e => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                            className="w-full border-0 bg-transparent text-sm text-gray-700 focus:outline-none" />
                        </td>
                        <td className="px-4 py-3">
                          <select value={item.gstRate} onChange={e => updateItem(item.id, 'gstRate', parseFloat(e.target.value))}
                            className="w-full border-0 bg-transparent text-sm text-gray-700 focus:outline-none cursor-pointer">
                            {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-semibold text-gray-900">{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </td>
                        <td className="px-3 py-3">
                          <button onClick={() => removeItem(item.id)} disabled={items.length === 1}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 disabled:opacity-20 transition-all opacity-0 group-hover:opacity-100">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/40">
                <button onClick={addItem} className="inline-flex items-center gap-2 rounded-xl border border-dashed border-indigo-300 bg-white px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm">
                  <Plus className="h-4 w-4" />
                  Add Line Item
                </button>
              </div>
            </div>

            {/* Notes & Terms */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
                  <FileText className="h-3.5 w-3.5 text-amber-600" />
                </span>
                <h2 className="text-sm font-semibold text-gray-800">Notes &amp; Terms</h2>
              </div>
              <div className="p-6 grid sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Notes</label>
                  <textarea
                    rows={4}
                    value={formData.notes}
                    onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Thank you for your business!"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none transition-all"
                  />
                </div>
                <div>
                  <label className={labelCls}>Terms &amp; Conditions</label>
                  <textarea
                    rows={4}
                    value={formData.terms}
                    onChange={e => setFormData(p => ({ ...p, terms: e.target.value }))}
                    placeholder="Payment due within 30 days…"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="rounded-2xl border border-gray-100/80 bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),0_2px_8px_-2px_rgba(0,0,0,0.05)] sticky top-6 overflow-hidden">

              {/* Header */}
              <div className="px-6 pt-6 pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 ring-1 ring-indigo-100/80">
                    <Calculator className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-semibold text-gray-900 leading-tight">Tax Summary</h2>
                    <p className="text-xs text-gray-400 mt-0.5 font-medium">Calculated automatically</p>
                  </div>
                </div>
              </div>

              {/* Line items */}
              <div className="px-6 pb-5 space-y-0.5">
                <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
                  <span className="text-sm text-gray-500 font-medium">Subtotal</span>
                  <span className="text-sm font-semibold text-gray-800 tabular-nums">&#8377;{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
                  <span className="text-sm text-gray-500 font-medium">Taxable Amount</span>
                  <span className="text-sm font-semibold text-gray-800 tabular-nums">&#8377;{totals.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-1 space-y-0.5">
                  {!isInterState ? (
                    <>
                      <div className="flex justify-between items-center py-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-[4px] text-[9px] font-bold bg-violet-50 text-violet-600 ring-1 ring-violet-100 leading-none">C</span>
                          <span className="text-sm text-gray-500 font-medium">CGST</span>
                        </div>
                        <span className="text-sm text-gray-700 tabular-nums font-medium">&#8377;{totals.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-[4px] text-[9px] font-bold bg-violet-50 text-violet-600 ring-1 ring-violet-100 leading-none">S</span>
                          <span className="text-sm text-gray-500 font-medium">SGST</span>
                        </div>
                        <span className="text-sm text-gray-700 tabular-nums font-medium">&#8377;{totals.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center py-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-[4px] text-[9px] font-bold bg-violet-50 text-violet-600 ring-1 ring-violet-100 leading-none">I</span>
                        <span className="text-sm text-gray-500 font-medium">IGST</span>
                      </div>
                      <span className="text-sm text-gray-700 tabular-nums font-medium">&#8377;{totals.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Total hero block */}
              <div className="mx-4 mb-5 rounded-2xl bg-gradient-to-br from-[#5B4BFF] via-indigo-600 to-[#4338ca] px-5 py-5 text-white shadow-[0_8px_24px_-4px_rgba(91,75,255,0.40),0_4px_12px_-4px_rgba(91,75,255,0.25)] ring-1 ring-white/10">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-200 mb-2">Invoice Total</p>
                <p className="text-[2.25rem] font-bold tracking-tight leading-none tabular-nums">&#8377;{totals.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                <p className="text-[11px] text-indigo-300/90 mt-2.5 font-medium">Includes all applicable taxes</p>
              </div>

              {/* CTA buttons */}
              <div className="px-4 pb-5 space-y-2.5">
                {invoiceLimitReached && (
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-red-50 py-2 text-red-600 ring-1 ring-red-200"
                  >
                    <Lock className="h-4 w-4" />
                    <span className="text-xs font-semibold">Invoice limit reached</span>
                  </motion.div>
                )}
                <button
                  onClick={() => handleSave()}
                  disabled={isLoading || invoiceLimitReached}
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 shadow-xs hover:border-gray-300 hover:bg-gray-50/80 hover:shadow-sm hover:-translate-y-px active:translate-y-0 active:shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:ring-offset-1"
                >
                  Save as Draft
                </button>
                <button
                  onClick={() => handleSave('SENT')}
                  disabled={isLoading || invoiceLimitReached}
                  className="group w-full rounded-xl bg-gradient-to-r from-[#5B4BFF] to-indigo-600 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_0_rgba(91,75,255,0.35)] hover:shadow-[0_6px_20px_0_rgba(91,75,255,0.45)] hover:-translate-y-0.5 hover:from-[#4e40f0] hover:to-indigo-700 active:translate-y-0 active:shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:ring-offset-1"
                >
                  {isLoading ? (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  ) : (
                    <Send className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                  )}
                  Save &amp; Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {typeof window !== 'undefined' && activeSuggestionItem && productSuggestions[activeSuggestionItem]?.length > 0 && dropdownPos && createPortal(
        <AnimatePresence>
          <motion.div
            key={activeSuggestionItem}
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
            className="fixed z-[9999] rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden"
            data-product-suggestions
          >
            {productSuggestions[activeSuggestionItem].map(p => (
              <button key={p.id} type="button"
                onMouseDown={e => { e.preventDefault(); applyProductSuggestion(activeSuggestionItem, p); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-indigo-50 border-b border-gray-50 last:border-0 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">&#8377;{p.price} · GST {p.gstRate}%{p.hsnSac ? ` · ${p.hsnSac}` : ''}</p>
                </div>
              </button>
            ))}
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
