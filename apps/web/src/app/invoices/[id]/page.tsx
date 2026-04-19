'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Printer, Download, Send, CheckCircle, XCircle, Copy,
  IndianRupee, Clock, AlertCircle, Share2, FileText, X, Check, Edit2
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { numberToWords } from '@/lib/numberToWords';
import { useToast } from '@/components/ui/Toast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

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
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
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

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SENT: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  OVERDUE: 'bg-red-100 text-red-700',
  PARTIALLY_PAID: 'bg-amber-100 text-amber-700',
  CANCELLED: 'bg-red-100 text-red-500',
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

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
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

  const badge = STATUS_BADGE[invoice.status] || STATUS_BADGE.DRAFT;
  const amtPaid = (invoice.total ?? 0) - (invoice.amountDue ?? 0);
  // Only render logos that are safe data URLs or absolute https URLs to prevent injection
  const safeLogo = invoice.business.logo && /^(data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,|https:\/\/)/.test(invoice.business.logo)
    ? invoice.business.logo : null;

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

      <div className="p-4 lg:p-8 max-w-5xl mx-auto print:p-0">
        {/* Action bar - hidden on print */}
        <div className="flex items-center gap-3 mb-6 print:hidden">
          <button onClick={() => router.push('/invoices')} className="rounded-lg p-2 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">{invoice.invoiceNumber}</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${badge}`}>{invoice.status}</span>
          </div>
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            {(invoice.status === 'DRAFT' || invoice.status === 'SENT' || invoice.status === 'PARTIALLY_PAID' || invoice.status === 'OVERDUE') && (
              <button onClick={() => setShowPayment(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700">
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
            <button onClick={handleWhatsApp} className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100">
              <Share2 className="h-4 w-4" /> WhatsApp
            </button>
            <button onClick={handlePrint} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Printer className="h-4 w-4" /> Print
            </button>
            <button onClick={handleDownloadPdf} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Download className="h-4 w-4" /> Download PDF
            </button>
            <button onClick={handleDuplicate} disabled={actionLoading === 'dup'}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
              <Copy className="h-4 w-4" /> Duplicate
            </button>
            {invoice.status !== 'CANCELLED' && invoice.status !== 'PAID' && (
              <button onClick={() => setConfirmCancel(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                <XCircle className="h-4 w-4" /> Cancel
              </button>
            )}
          </div>
        </div>

        {/* Invoice document — fixed height so header/footer are always visible while items scroll.
            11rem accounts for: top navigation (~4rem) + action bar (~3.5rem) + page padding (~3.5rem).
            Print styles restore natural document flow. */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm print:shadow-none print:border-0 flex flex-col h-[calc(100vh-11rem)] print:h-auto overflow-hidden print:overflow-visible">
          {/* Header - sticky at top */}
          <div className="flex-shrink-0 flex items-start justify-between p-8 bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
            <div className="flex items-start gap-4">
              {safeLogo && (
                <img
                  src={safeLogo}
                  alt="Business Logo"
                  className="h-16 w-16 object-contain rounded-xl bg-white/20 p-1 flex-shrink-0"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold">{invoice.business.name}</h1>
                {invoice.business.gstin && <p className="text-indigo-200 text-sm mt-0.5">GSTIN: {invoice.business.gstin}</p>}
                {invoice.business.address && <p className="text-indigo-200 text-sm mt-0.5">{invoice.business.address}</p>}
                {invoice.business.city && <p className="text-indigo-200 text-sm">{invoice.business.city}, {invoice.business.state}</p>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-extrabold">{invoice.type}</div>
              <div className="text-indigo-200 mt-1 font-medium">{invoice.invoiceNumber}</div>
              <div className="mt-1 text-sm text-indigo-200">
                Date: {new Date(invoice.issueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              {invoice.dueDate && (
                <div className="text-sm text-indigo-200">
                  Due: {new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              )}
            </div>
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto min-h-0 print:overflow-visible">
            {/* Bill To / Ship To / Place of Supply */}
            <div className="grid sm:grid-cols-3 gap-6 p-8 border-b border-gray-100">
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400 mb-2">Bill To</p>
                <Link href={`/customers/${invoice.customer.id}`} className="text-base font-bold text-gray-900 hover:text-indigo-600">{invoice.customer.name}</Link>
                {invoice.customer.gstin && <p className="text-sm font-mono text-gray-500 mt-0.5">GSTIN: {invoice.customer.gstin}</p>}
                {invoice.customer.email && <p className="text-sm text-gray-500">{invoice.customer.email}</p>}
                {invoice.customer.billingAddress && <p className="text-sm text-gray-500 mt-0.5">{invoice.customer.billingAddress}</p>}
                {invoice.customer.billingCity && <p className="text-sm text-gray-500">{invoice.customer.billingCity}{invoice.customer.billingState ? `, ${invoice.customer.billingState}` : ''}{invoice.customer.billingPincode ? ` - ${invoice.customer.billingPincode}` : ''}</p>}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400 mb-2">Ship To</p>
                {(invoice.customer.shippingAddress || invoice.customer.shippingCity) ? (
                  <>
                    {invoice.customer.shippingAddress && <p className="text-sm text-gray-700">{invoice.customer.shippingAddress}</p>}
                    {invoice.customer.shippingCity && <p className="text-sm text-gray-500">{invoice.customer.shippingCity}{invoice.customer.shippingState ? `, ${invoice.customer.shippingState}` : ''}{invoice.customer.shippingPincode ? ` - ${invoice.customer.shippingPincode}` : ''}</p>}
                  </>
                ) : (
                  <p className="text-sm text-gray-400 italic">Same as billing address</p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400 mb-2">Place of Supply</p>
                <p className="text-sm text-gray-700">{invoice.placeOfSupply || '—'}</p>
                <p className="text-sm text-gray-500 mt-1">{invoice.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST+SGST)'}</p>
              </div>
            </div>

            {/* Items table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">HSN/SAC</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">GST</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoice.items.map((item, i) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 text-sm text-gray-400">{i + 1}</td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-gray-900">{item.description}</p>
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-500 font-mono">{item.hsnSac || '—'}</td>
                      <td className="px-4 py-4 text-sm text-gray-700 text-right">{item.quantity} {item.unit}</td>
                      <td className="px-4 py-4 text-sm text-gray-700 text-right">₹{item.price.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-4 text-sm text-gray-600 text-right">{item.gstRate}%</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex flex-col sm:flex-row sm:justify-between p-8 border-t border-gray-100 gap-6">
              {/* Amount in Words */}
              <div className="sm:max-w-xs flex-1">
                <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Amount in Words</p>
                <p className="text-sm font-medium text-gray-700 italic">{numberToWords(invoice.total ?? 0)}</p>
              </div>
              <div className="w-full sm:max-w-xs space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-600">Taxable Amount</span><span>₹{(invoice.taxableAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                {!invoice.isInterState ? (
                  <>
                    <div className="flex justify-between text-sm"><span className="text-gray-600">CGST</span><span>₹{(invoice.cgstAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-600">SGST</span><span>₹{(invoice.sgstAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                  </>
                ) : (
                  <div className="flex justify-between text-sm"><span className="text-gray-600">IGST</span><span>₹{(invoice.igstAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                )}
                <div className="border-t pt-2 flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span className="text-indigo-600">₹{(invoice.total ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                {amtPaid > 0 && (
                  <div className="flex justify-between text-sm text-green-600"><span>Paid</span><span>₹{amtPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                )}
                {(invoice.amountDue ?? 0) > 0 && (
                  <div className="flex justify-between text-sm font-semibold text-red-600"><span>Balance Due</span><span>₹{(invoice.amountDue ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                )}
              </div>
            </div>
          </div>

          {/* Footer - sticky at bottom */}
          {(invoice.notes || invoice.terms) && (
            <div className="flex-shrink-0 grid sm:grid-cols-2 gap-4 px-8 py-6 border-t border-gray-100 bg-white">
              {invoice.notes && (
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Notes</p>
                  <p className="text-sm text-gray-600">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Terms &amp; Conditions</p>
                  <p className="text-sm text-gray-600">{invoice.terms}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Payment History */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="mt-6 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden print:hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Payment History</h2>
            </div>
            <table className="w-full">
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
                    <td className="px-4 py-3 text-sm text-gray-700">{new Date(p.paidAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.method.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600 text-right">₹{p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
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
