'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Printer, Download, Send, XCircle, Copy,
  IndianRupee, Share2, X, Check, Edit2,
  Palette, LayoutTemplate,
} from 'lucide-react';
import { apiFetch, isSafeImageUrl } from '@/lib/api';
import { numberToWords } from '@/lib/numberToWords';
import { useToast } from '@/components/ui/Toast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface PublicTemplate {
  id: string;
  name: string;
  html: string;
  isDefault: boolean;
}

interface InvoiceItem {
  id: string;
  description: string;
  hsnSac: string | null;
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

interface Invoice {
  id: string;
  invoiceNumber: string;
  type: string;
  status: string;
  issueDate: string;
  dueDate: string | null;
  subtotal: number;
  taxableAmount: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  total: number;
  amountDue: number;
  isInterState: boolean;
  placeOfSupply: string | null;
  notes: string | null;
  terms: string | null;
  isPaid: boolean;
  customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    gstin: string | null;
    billingAddress: string | null;
    billingCity: string | null;
    billingState: string | null;
    billingPincode: string | null;
    shippingAddress: string | null;
    shippingCity: string | null;
    shippingState: string | null;
    shippingPincode: string | null;
  };
  business: {
    name: string;
    gstin: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    phone: string | null;
    email: string | null;
    logo: string | null;
  };
  items: InvoiceItem[];
  payments: { id: string; amount: number; method: string; paidAt: string; }[];
}

// ─── Theme System ────────────────────────────────────────────────────────────

const THEMES = {
  'corporate-blue': {
    name: 'Corporate Blue',
    accent: '#1e40af',
    accentMid: '#2563eb',
    accentBg: '#eff6ff',
    accentBorder: '#bfdbfe',
    headerBg: '#1e3a8a',
    headerText: '#ffffff',
    headerSub: '#93c5fd',
    tableBg: '#f0f9ff',
    tableHeaderText: '#1e3a8a',
    totalCardBg: '#f0f9ff',
    grandTotalBg: '#1e3a8a',
    grandTotalText: '#ffffff',
  },
  'classic-black': {
    name: 'Classic Black',
    accent: '#111827',
    accentMid: '#374151',
    accentBg: '#f9fafb',
    accentBorder: '#d1d5db',
    headerBg: '#111827',
    headerText: '#ffffff',
    headerSub: '#9ca3af',
    tableBg: '#f9fafb',
    tableHeaderText: '#111827',
    totalCardBg: '#f9fafb',
    grandTotalBg: '#111827',
    grandTotalText: '#ffffff',
  },
  'elegant-gray': {
    name: 'Elegant Gray',
    accent: '#475569',
    accentMid: '#64748b',
    accentBg: '#f8fafc',
    accentBorder: '#e2e8f0',
    headerBg: '#1e293b',
    headerText: '#ffffff',
    headerSub: '#94a3b8',
    tableBg: '#f8fafc',
    tableHeaderText: '#1e293b',
    totalCardBg: '#f8fafc',
    grandTotalBg: '#1e293b',
    grandTotalText: '#ffffff',
  },
} as const;

type ThemeKey = keyof typeof THEMES;

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SENT: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  OVERDUE: 'bg-red-100 text-red-700',
  PARTIALLY_PAID: 'bg-amber-100 text-amber-700',
  CANCELLED: 'bg-red-100 text-red-500',
};

const STATUS_DOC_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  DRAFT:          { bg: '#f3f4f6', text: '#6b7280', label: 'Draft' },
  SENT:           { bg: '#dbeafe', text: '#1d4ed8', label: '' },
  PAID:           { bg: '#dcfce7', text: '#15803d', label: '✓ Paid' },
  OVERDUE:        { bg: '#fee2e2', text: '#b91c1c', label: 'Overdue' },
  PARTIALLY_PAID: { bg: '#fef3c7', text: '#b45309', label: 'Partial' },
  CANCELLED:      { bg: '#fee2e2', text: '#dc2626', label: '' },
};

function RecordPaymentModal({ invoice, onClose, onPaid }: { invoice: Invoice; onClose: () => void; onPaid: () => void }) {
  const { success, error: toastError } = useToast();
  const [form, setForm] = useState({
    amount: String(invoice.amountDue || invoice.total),
    method: 'CASH', transactionRef: '', notes: '',
    paidAt: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) { toastError('Invalid amount'); return; }
    setLoading(true);
    try {
      await apiFetch('/payments', {
        method: 'POST',
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount: parseFloat(form.amount),
          method: form.method,
          transactionRef: form.transactionRef || undefined,
          notes: form.notes || undefined,
          paidAt: form.paidAt,
        }),
      });
      success('Payment recorded');
      onPaid();
      onClose();
    } catch (err: any) {
      toastError('Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Record Payment</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-gray-400" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹)</label>
            <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} step="0.01" min="0.01"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            <p className="text-xs text-gray-400 mt-0.5">Due: ₹{invoice.amountDue.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method</label>
            <select value={form.method} onChange={e => set('method', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
              {['CASH','BANK_TRANSFER','UPI','CHEQUE','CARD','NEFT','RTGS'].map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Payment Date</label>
            <input type="date" value={form.paidAt} onChange={e => set('paidAt', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Transaction Ref / UTR</label>
            <input type="text" value={form.transactionRef} onChange={e => set('transactionRef', e.target.value)} placeholder="Optional"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <input type="text" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : <Check className="h-4 w-4" />}
            Record Payment
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [theme, setTheme] = useState<ThemeKey>('classic-black');
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [templates, setTemplates] = useState<PublicTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  const TEMPLATE_STORAGE_KEY = 'invoice_default_template';

  const handleSelectTemplate = (id: string | null) => {
    setSelectedTemplateId(id);
    setShowTemplatePicker(false);
    try {
      if (id) {
        localStorage.setItem(TEMPLATE_STORAGE_KEY, id);
      } else {
        localStorage.removeItem(TEMPLATE_STORAGE_KEY);
      }
    } catch {
      // localStorage may be unavailable (e.g. private browsing or quota exceeded)
    }
  };

  const fetchInvoice = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: Invoice }>(`/invoices/${id}`);
      setInvoice(res.data);
    } catch (err: any) {
      toastError('Failed to load invoice', err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchInvoice(); }, [fetchInvoice]);

  useEffect(() => {
    apiFetch<{ data: PublicTemplate[] }>('/invoices/templates')
      .then(res => {
        setTemplates(res.data);
        const saved = typeof window !== 'undefined' ? localStorage.getItem(TEMPLATE_STORAGE_KEY) : null;
        if (saved && res.data.some(t => t.id === saved)) {
          setSelectedTemplateId(saved);
        }
      })
      .catch((err: unknown) => { console.error('Failed to load invoice templates:', err); });
  }, []);

  const handleMarkSent = async () => {
    setActionLoading('sent');
    try {
      await apiFetch(`/invoices/${id}/send`, { method: 'POST' });
      success('Invoice marked as sent');
      await fetchInvoice();
    } catch (err: any) {
      toastError('Failed', err.message);
    } finally {
      setActionLoading('');
    }
  };

  const handleDuplicate = async () => {
    setActionLoading('dup');
    try {
      const res = await apiFetch<{ data: { id: string } }>(`/invoices/${id}/duplicate`, { method: 'POST' });
      success('Invoice duplicated');
      router.push(`/invoices/${res.data.id}`);
    } catch (err: any) {
      toastError('Failed to duplicate', err.message);
    } finally {
      setActionLoading('');
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await apiFetch(`/invoices/${id}/cancel`, { method: 'POST' });
      success('Invoice cancelled');
      setConfirmCancel(false);
      await fetchInvoice();
    } catch (err: any) {
      toastError('Failed to cancel', err.message);
    } finally {
      setCancelling(false);
    }
  };

  const renderTemplateHtml = (html: string | undefined, inv: Invoice): string => {
    if (!html) return '<p style="padding:2rem;color:red">Template HTML is unavailable.</p>';
    const fmtN = (n: number) => (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    // Escape special HTML characters in text content to prevent injection
    const esc = (s: string | null | undefined) => (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

    // Pre-compiled patterns for item variables (use lowercase per data-structure convention)
    const itemPatterns: Array<[RegExp, (item: InvoiceItem, i: number) => string]> = [
      [/{{index}}/g,       (_item, i) => esc(String(i + 1))],
      [/{{description}}/g, (item) => esc(item.description)],
      [/{{hsnSac}}/g,      (item) => esc(item.hsnSac)],
      [/{{quantity}}/g,    (item) => esc(String(item.quantity))],
      [/{{unit}}/g,        (item) => esc(item.unit)],
      [/{{price}}/g,       (item) => esc(fmtN(item.price))],
      [/{{gstRate}}/g,     (item) => esc(String(item.gstRate))],
      [/{{total}}/g,       (item) => esc(fmtN(item.total))],
    ];

    // Resolve items block
    let result = html.replace(/{{#items}}([\s\S]*?){{\/items}}/g, (_match, itemTpl: string) => {
      return inv.items.map((item, i) => {
        let row = itemTpl;
        for (const [pattern, fn] of itemPatterns) {
          row = row.replace(pattern, fn(item, i));
        }
        return row;
      }).join('');
    });

    // Transparent 1×1 GIF data URI used as logo fallback so <img> renders cleanly without a broken-image icon
    const transparentGif = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    const safeLogoUrl = inv.business.logo && isSafeImageUrl(inv.business.logo)
      ? inv.business.logo : transparentGif;

    const vars: Record<string, string> = {
      businessName: esc(inv.business.name),
      businessGstin: esc(inv.business.gstin),
      businessAddress: esc(inv.business.address),
      businessCity: esc(inv.business.city),
      businessState: esc(inv.business.state),
      businessPhone: esc(inv.business.phone),
      businessEmail: esc(inv.business.email),
      businessInitial: esc(inv.business.name?.charAt(0)?.toUpperCase()),
      businessLogo: safeLogoUrl,
      invoiceNumber: esc(inv.invoiceNumber),
      invoiceType: esc(inv.type || 'INVOICE'),
      issueDate: esc(fmtDate(inv.issueDate)),
      dueDate: inv.dueDate ? esc(fmtDate(inv.dueDate)) : '',
      customerName: esc(inv.customer.name),
      customerGstin: esc(inv.customer.gstin),
      customerPan: '',
      customerAddress: esc(inv.customer.billingAddress),
      customerCity: esc(inv.customer.billingCity),
      customerState: esc(inv.customer.billingState),
      customerPincode: esc(inv.customer.billingPincode),
      customerEmail: esc(inv.customer.email),
      customerPhone: esc(inv.customer.phone),
      shipAddress: esc(inv.customer.shippingAddress || inv.customer.billingAddress),
      shipCity: esc(inv.customer.shippingCity || inv.customer.billingCity),
      shipState: esc(inv.customer.shippingState || inv.customer.billingState),
      shipPincode: esc(inv.customer.shippingPincode || inv.customer.billingPincode),
      placeOfSupply: esc(inv.placeOfSupply),
      taxType: inv.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)',
      taxableAmount: esc(fmtN(inv.taxableAmount)),
      cgst: esc(fmtN(inv.cgstTotal)),
      sgst: esc(fmtN(inv.sgstTotal)),
      igst: esc(fmtN(inv.igstTotal)),
      total: esc(fmtN(inv.total)),
      amountDue: esc(fmtN(inv.amountDue)),
      amountInWords: esc(numberToWords(inv.total ?? 0)),
      notes: esc(inv.notes),
      terms: esc(inv.terms),
    };

    // Single-pass replacement using a callback for efficiency
    result = result.replace(/{{(\w+)}}/g, (_match, key) => vars[key] ?? '');
    return result;
  };

  const openTemplatePrint = (templateHtml: string, inv: Invoice) => {
    const rendered = renderTemplateHtml(templateHtml, inv);
    const blob = new Blob([rendered], { type: 'text/html; charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    // Ensure blob URL is always revoked to prevent memory leaks
    const revoke = () => URL.revokeObjectURL(blobUrl);
    const win = window.open(blobUrl, '_blank');
    if (win) {
      win.addEventListener('load', () => { win.print(); revoke(); }, { once: true });
      // Fallback revocation in case the load event does not fire (e.g. window closed early)
      setTimeout(revoke, 30_000);
    } else {
      revoke();
    }
  };

  const handlePrint = () => {
    if (selectedTemplateId && invoice) {
      const tmpl = templates.find(t => t.id === selectedTemplateId);
      if (tmpl) { openTemplatePrint(tmpl.html, invoice); return; }
    }
    window.print();
  };

  const handleDownloadPdf = () => {
    if (selectedTemplateId && invoice) {
      const tmpl = templates.find(t => t.id === selectedTemplateId);
      if (tmpl) { openTemplatePrint(tmpl.html, invoice); return; }
    }
    const prevTitle = document.title;
    if (invoice) document.title = `Invoice-${invoice.invoiceNumber}`;
    window.print();
    document.title = prevTitle;
  };

  const handleWhatsApp = () => {
    if (!invoice) return;
    const msg = `Hi ${invoice.customer.name}, your invoice ${invoice.invoiceNumber} for ₹${invoice.total.toLocaleString('en-IN')} is ready. Please make payment at your earliest convenience. Thank you!`;
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return <div className="p-6 lg:p-8 animate-pulse"><div className="h-64 bg-gray-100 rounded-2xl" /></div>;
  }
  if (!invoice) {
    return <div className="p-6 text-center text-gray-500">Invoice not found.</div>;
  }

  const selectedTemplate = selectedTemplateId ? templates.find(t => t.id === selectedTemplateId) : null;

  const t = THEMES[theme];
  const docBadge = STATUS_DOC_BADGE[invoice.status] ?? STATUS_DOC_BADGE.DRAFT;
  const actionBadge = STATUS_BADGE[invoice.status] || STATUS_BADGE.DRAFT;
  const amtPaid = (invoice.total ?? 0) - (invoice.amountDue ?? 0);
  // Only render logos that are safe data URLs or absolute https URLs to prevent injection
  const safeLogo = invoice.business.logo && isSafeImageUrl(invoice.business.logo)
    ? invoice.business.logo : null;

  const fmt = (n: number) => `₹${(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      {showPayment && (
        <RecordPaymentModal invoice={invoice} onClose={() => setShowPayment(false)} onPaid={fetchInvoice} />
      )}
      <ConfirmModal
        open={confirmCancel}
        title="Cancel Invoice"
        message={`Cancel invoice ${invoice.invoiceNumber}? This cannot be undone.`}
        confirmLabel="Cancel Invoice"
        destructive loading={cancelling}
        onConfirm={handleCancel}
        onCancel={() => setConfirmCancel(false)}
      />

      <div className="p-2 lg:p-3 max-w-4xl mx-auto print:p-0 print:max-w-none">

        {/* ── Action Bar (hidden on print) ─────────────────────────── */}
        <div className="flex items-center gap-3 mb-5 print:hidden flex-wrap">
          <button onClick={() => router.push('/invoices')}
            className="rounded-lg p-2 hover:bg-gray-100 text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-gray-900">{invoice.invoiceNumber}</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${actionBadge}`}>
              {invoice.status !== 'SENT' && invoice.status !== 'CANCELLED' && invoice.status.replace('_', ' ')}
            </span>
          </div>

          {/* Theme Picker — hidden when a custom template is active */}
          {!selectedTemplateId && (
            <div className="relative ml-1">
              <button
                onClick={() => setShowThemePicker(p => !p)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                title="Change theme"
              >
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">{t.name}</span>
              </button>
              {showThemePicker && (
                <div className="absolute left-0 top-10 z-30 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-44">
                  {(Object.keys(THEMES) as ThemeKey[]).map(k => (
                    <button key={k} onClick={() => { setTheme(k); setShowThemePicker(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${theme === k ? 'font-semibold' : ''}`}>
                      <span className="inline-block h-3 w-3 rounded-full flex-shrink-0"
                        style={{ background: THEMES[k].accent }} />
                      {THEMES[k].name}
                      {theme === k && <Check className="h-3.5 w-3.5 ml-auto text-gray-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Template Picker */}
          {templates.length > 0 && (
            <div className="relative ml-1">
              <button
                onClick={() => { setShowTemplatePicker(p => !p); setShowThemePicker(false); }}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50 ${selectedTemplateId ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600'}`}
                title="Change invoice template"
              >
                <LayoutTemplate className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {selectedTemplateId ? (templates.find(t => t.id === selectedTemplateId)?.name ?? 'Template') : 'Template'}
                </span>
              </button>
              {showTemplatePicker && (
                <div className="absolute left-0 top-10 z-30 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-52">
                  <button
                    onClick={() => handleSelectTemplate(null)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${!selectedTemplateId ? 'font-semibold' : ''}`}>
                    <span className="inline-block h-3 w-3 rounded-full bg-gray-400 flex-shrink-0" />
                    Default (Themed)
                    {!selectedTemplateId && <Check className="h-3.5 w-3.5 ml-auto text-gray-500" />}
                  </button>
                  {templates.map(tmpl => (
                    <button key={tmpl.id} onClick={() => handleSelectTemplate(tmpl.id)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${selectedTemplateId === tmpl.id ? 'font-semibold' : ''}`}>
                      <span className="inline-block h-3 w-3 rounded-full bg-indigo-500 flex-shrink-0" />
                      {tmpl.name}
                      {tmpl.isDefault && <span className="text-[10px] text-indigo-400 ml-1">(default)</span>}
                      {selectedTemplateId === tmpl.id && <Check className="h-3.5 w-3.5 ml-auto text-gray-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="ml-auto flex items-center gap-2 flex-wrap">
            {(invoice.status === 'DRAFT' || invoice.status === 'SENT' || invoice.status === 'PARTIALLY_PAID' || invoice.status === 'OVERDUE') && (
              <button onClick={() => setShowPayment(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700">
                <IndianRupee className="h-4 w-4" /> Record Payment
              </button>
            )}
            {invoice.status === 'DRAFT' && (
              <button onClick={handleMarkSent} disabled={actionLoading === 'sent'}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                <Send className="h-4 w-4" /> Mark Sent
              </button>
            )}
            {(invoice.status === 'DRAFT' || invoice.status === 'SENT') && (
              <button onClick={() => router.push(`/invoices/${id}/edit`)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100">
                <Edit2 className="h-4 w-4" /> Edit
              </button>
            )}
            <button onClick={handleWhatsApp}
              className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100">
              <Share2 className="h-4 w-4" /> WhatsApp
            </button>
            <button onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Printer className="h-4 w-4" /> Print
            </button>
            <button onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Download className="h-4 w-4" /> PDF
            </button>
            <button onClick={handleDuplicate} disabled={actionLoading === 'dup'}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
              <Copy className="h-4 w-4" /> Duplicate
            </button>
            {invoice.status !== 'CANCELLED' && invoice.status !== 'PAID' && (
              <button onClick={() => setConfirmCancel(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                <XCircle className="h-4 w-4" /> Cancel
              </button>
            )}
          </div>
        </div>

        {/* ── Invoice Document ─────────────────────────────────────── */}
        {selectedTemplate ? (
          /* Template-rendered view */
          <div className="invoice-document bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm print:shadow-none print:border-0 print:rounded-none">
            <iframe
              srcDoc={renderTemplateHtml(selectedTemplate.html, invoice)}
              className="w-full border-0"
              style={{ minHeight: '900px' }}
              title="Invoice Preview"
              sandbox=""
            />
          </div>
        ) : (
          <div
            id="invoice-document"
            className="invoice-document bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm print:shadow-none print:border-0 print:rounded-none flex flex-col overflow-x-hidden print:overflow-visible"
          >
          {/* Top accent bar */}
          <div className="h-1.5 flex-shrink-0 print:h-1" style={{ background: t.accent }} />

          {/* ── Header ── */}
          <div className="flex-shrink-0 flex items-start justify-between gap-6 px-8 pt-7 pb-7 bg-white border-b border-gray-100">
            {/* Left: company */}
            <div className="flex items-start gap-4 min-w-0">
              {safeLogo ? (
                <img
                  src={safeLogo}
                  alt="Logo"
                  className="h-14 w-14 object-contain rounded-lg border border-gray-100 flex-shrink-0"
                />
              ) : (
                <div className="h-14 w-14 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-xl font-bold"
                  style={{ background: t.accent }}>
                  {invoice.business.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-gray-900 leading-tight">{invoice.business.name}</h1>
                {invoice.business.gstin && (
                  <p className="text-xs font-mono text-gray-500 mt-0.5">GSTIN: {invoice.business.gstin}</p>
                )}
                {invoice.business.address && (
                  <p className="text-xs text-gray-500 mt-0.5">{invoice.business.address}</p>
                )}
                {(invoice.business.city || invoice.business.state) && (
                  <p className="text-xs text-gray-500">
                    {[invoice.business.city, invoice.business.state].filter(Boolean).join(', ')}
                  </p>
                )}
                {(invoice.business.phone || invoice.business.email) && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[invoice.business.phone, invoice.business.email].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            </div>

            {/* Right: invoice meta card */}
            <div className="flex-shrink-0 text-right">
              <p className="text-3xl font-extrabold tracking-tight" style={{ color: t.accent }}>
                INVOICE
              </p>
              <p className="text-base font-semibold text-gray-700 mt-1">{invoice.invoiceNumber}</p>
              <div className="mt-3 space-y-1 text-xs text-gray-500">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-gray-400">Issue Date</span>
                  <span className="font-medium text-gray-700">{fmtDate(invoice.issueDate)}</span>
                </div>
                {invoice.dueDate && (
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-gray-400">Due Date</span>
                    <span className="font-medium text-gray-700">{fmtDate(invoice.dueDate)}</span>
                  </div>
                )}
              </div>
              {/* Status badge – hidden for Draft, Sent and Cancelled */}
              {invoice.status !== 'DRAFT' && invoice.status !== 'SENT' && invoice.status !== 'CANCELLED' && (
                <div className="mt-3 flex justify-end">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide border"
                    style={{ background: docBadge.bg, color: docBadge.text, borderColor: docBadge.bg }}>
                    {docBadge.label}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Scrollable body ── */}
          <div className="print:overflow-visible">

            {/* Bill To / Ship To / Supply Details */}
            <div className="grid grid-cols-3 gap-px bg-gray-100 border-b border-gray-100">
              {/* Bill To */}
              <div className="bg-white px-6 py-5">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: t.accent }}>
                  Bill To
                </p>
                <Link href={`/customers/${invoice.customer.id}`}
                  className="text-sm font-bold text-gray-900 hover:underline leading-snug block">
                  {invoice.customer.name}
                </Link>
                {invoice.customer.gstin && (
                  <p className="text-xs font-mono text-gray-500 mt-0.5">GSTIN: {invoice.customer.gstin}</p>
                )}
                {invoice.customer.email && (
                  <p className="text-xs text-gray-500 mt-0.5">{invoice.customer.email}</p>
                )}
                {invoice.customer.phone && (
                  <p className="text-xs text-gray-500">{invoice.customer.phone}</p>
                )}
                {invoice.customer.billingAddress && (
                  <p className="text-xs text-gray-500 mt-1">{invoice.customer.billingAddress}</p>
                )}
                {invoice.customer.billingCity && (
                  <p className="text-xs text-gray-500">
                    {invoice.customer.billingCity}
                    {invoice.customer.billingState ? `, ${invoice.customer.billingState}` : ''}
                    {invoice.customer.billingPincode ? ` – ${invoice.customer.billingPincode}` : ''}
                  </p>
                )}
              </div>

              {/* Ship To */}
              <div className="bg-white px-6 py-5">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: t.accent }}>
                  Ship To
                </p>
                {(invoice.customer.shippingAddress || invoice.customer.shippingCity) ? (
                  <>
                    {invoice.customer.shippingAddress && (
                      <p className="text-xs text-gray-700">{invoice.customer.shippingAddress}</p>
                    )}
                    {invoice.customer.shippingCity && (
                      <p className="text-xs text-gray-500">
                        {invoice.customer.shippingCity}
                        {invoice.customer.shippingState ? `, ${invoice.customer.shippingState}` : ''}
                        {invoice.customer.shippingPincode ? ` – ${invoice.customer.shippingPincode}` : ''}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-gray-400 italic">Same as billing</p>
                )}
              </div>

              {/* Supply Details */}
              <div className="bg-white px-6 py-5">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: t.accent }}>
                  Supply Details
                </p>
                <p className="text-xs font-medium text-gray-700">{invoice.placeOfSupply || '—'}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {invoice.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
                </p>
              </div>
            </div>

            {/* ── Items Table ── */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: t.accentBg }}>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider w-10"
                      style={{ color: t.tableHeaderText }}>#</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"
                      style={{ color: t.tableHeaderText }}>Description</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"
                      style={{ color: t.tableHeaderText }}>HSN/SAC</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider"
                      style={{ color: t.tableHeaderText }}>Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider"
                      style={{ color: t.tableHeaderText }}>Rate</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider"
                      style={{ color: t.tableHeaderText }}>GST%</th>
                    <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider"
                      style={{ color: t.tableHeaderText }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, i) => (
                    <tr key={item.id}
                      className="border-b border-gray-50 transition-colors"
                      style={{ background: i % 2 === 1 ? t.tableBg : '#ffffff' }}>
                      <td className="px-5 py-4 text-gray-400 font-medium">{i + 1}</td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-900 leading-snug">{item.description}</p>
                        {item.discount > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5">Discount: {fmt(item.discount)}</p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs font-mono text-gray-500">{item.hsnSac || '—'}</td>
                      <td className="px-4 py-4 text-gray-700 text-right tabular-nums">
                        {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                      </td>
                      <td className="px-4 py-4 text-gray-700 text-right tabular-nums">
                        {fmt(item.price)}
                      </td>
                      <td className="px-4 py-4 text-gray-600 text-right tabular-nums">{item.gstRate}%</td>
                      <td className="px-5 py-4 font-semibold text-gray-900 text-right tabular-nums">
                        {fmt(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Totals Section ── */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 px-8 py-7 border-t border-gray-100">
              {/* Amount in Words */}
              <div className="flex-1 sm:max-w-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                  Amount in Words
                </p>
                <p className="text-sm font-semibold text-gray-700 leading-relaxed">
                  {numberToWords(invoice.total ?? 0)}
                </p>
              </div>

              {/* Totals card */}
              <div className="w-full sm:w-72 rounded-xl overflow-hidden border border-gray-200 shadow-sm print:shadow-none inv-totals-card">
                <div className="divide-y divide-gray-100">
                  <div className="flex justify-between items-center px-5 py-3">
                    <span className="text-sm text-gray-500">Taxable Amount</span>
                    <span className="text-sm font-medium text-gray-800 tabular-nums">{fmt(invoice.taxableAmount)}</span>
                  </div>
                  {!invoice.isInterState ? (
                    <>
                      <div className="flex justify-between items-center px-5 py-3">
                        <span className="text-sm text-gray-500">CGST</span>
                        <span className="text-sm text-gray-700 tabular-nums">{fmt(invoice.cgstTotal)}</span>
                      </div>
                      <div className="flex justify-between items-center px-5 py-3">
                        <span className="text-sm text-gray-500">SGST</span>
                        <span className="text-sm text-gray-700 tabular-nums">{fmt(invoice.sgstTotal)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center px-5 py-3">
                      <span className="text-sm text-gray-500">IGST</span>
                      <span className="text-sm text-gray-700 tabular-nums">{fmt(invoice.igstTotal)}</span>
                    </div>
                  )}
                  {amtPaid > 0 && (
                    <div className="flex justify-between items-center px-5 py-3">
                      <span className="text-sm text-green-600">Amount Paid</span>
                      <span className="text-sm font-medium text-green-600 tabular-nums">− {fmt(amtPaid)}</span>
                    </div>
                  )}
                </div>
                {/* Grand Total highlight */}
                <div className="flex justify-between items-center px-5 py-4"
                  style={{ background: t.grandTotalBg }}>
                  <span className="text-sm font-bold" style={{ color: t.grandTotalText }}>Grand Total</span>
                  <span className="text-xl font-extrabold tabular-nums" style={{ color: t.grandTotalText }}>
                    {fmt(invoice.total)}
                  </span>
                </div>
                {(invoice.amountDue ?? 0) > 0 && amtPaid > 0 && (
                  <div className="flex justify-between items-center px-5 py-3 bg-red-50 border-t border-red-100">
                    <span className="text-sm font-semibold text-red-600">Balance Due</span>
                    <span className="text-sm font-bold text-red-700 tabular-nums">{fmt(invoice.amountDue)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Notes & Terms ── */}
            {(invoice.notes || invoice.terms) && (
              <div className="grid sm:grid-cols-2 gap-6 px-8 py-6 border-t border-gray-100">
                {invoice.notes && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: t.accent }}>
                      Notes
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{invoice.notes}</p>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: t.accent }}>
                      Terms &amp; Conditions
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{invoice.terms}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Footer: Thank You + Authorized Signatory ── */}
            <div className="flex items-end justify-between px-8 py-6 border-t border-gray-100 gap-6">
              <div>
                <p className="text-sm font-semibold text-gray-700">Thank you for your business!</p>
                {invoice.business.email && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Questions? Contact us at {invoice.business.email}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="inline-block border-t-2 pt-3 text-center" style={{ borderColor: t.accent, minWidth: '9rem' }}>
                  <p className="text-xs font-semibold text-gray-700">{invoice.business.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Authorized Signatory</p>
                </div>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* ── Payment History (screen only) ───────────────────────── */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="mt-6 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden print:hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Payment History</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Method</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoice.payments.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{new Date(p.paidAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3 text-gray-600">{p.method.replace('_', ' ')}</td>
                    <td className="px-4 py-3 font-semibold text-green-600 text-right tabular-nums">
                      {fmt(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
