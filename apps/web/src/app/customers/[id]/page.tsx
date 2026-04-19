'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Edit2, Save, Trash2, Mail, Phone, MapPin, Hash,
  FileText, ChevronRight, CheckCircle, Clock, AlertCircle, X,
  IndianRupee, TrendingUp, User
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { INDIAN_STATES } from '@/lib/constants';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  gstin: string | null;
  pan: string | null;
  gstType: string;
  billingAddress: string | null;
  billingCity: string | null;
  billingState: string | null;
  billingPincode: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPincode: string | null;
  ledgerBalance: number;
  creditLimit: number;
  creditDays: number;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  invoices: Invoice[];
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  type: string;
  status: string;
  issueDate: string;
  total: number;
  amountDue: number;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; Icon: any }> = {
  PAID: { label: 'Paid', cls: 'bg-green-100 text-green-700', Icon: CheckCircle },
  SENT: { label: 'Sent', cls: 'bg-blue-100 text-blue-700', Icon: Clock },
  OVERDUE: { label: 'Overdue', cls: 'bg-red-100 text-red-700', Icon: AlertCircle },
  DRAFT: { label: 'Draft', cls: 'bg-gray-100 text-gray-600', Icon: FileText },
  PARTIALLY_PAID: { label: 'Partial', cls: 'bg-amber-100 text-amber-700', Icon: Clock },
};

const GST_TYPES = [
  { value: 'REGULAR', label: 'Regular' },
  { value: 'COMPOSITION', label: 'Composition' },
  { value: 'UNREGISTERED', label: 'Unregistered' },
  { value: 'EXPORT', label: 'Export' },
  { value: 'SEZ', label: 'SEZ' },
];

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export default function CustomerDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { success, error: toastError } = useToast();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState<Partial<Customer>>({});
  const [sameAsB, setSameAsB] = useState(false);

  const fetchCustomer = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: Customer }>(`/customers/${id}`);
      setCustomer(res.data);
      setForm(res.data);
      const d = res.data;
      setSameAsB(
        d.shippingAddress === d.billingAddress &&
        d.shippingCity === d.billingCity &&
        d.shippingState === d.billingState &&
        d.shippingPincode === d.billingPincode
      );
    } catch (err: any) {
      toastError('Failed to load customer', err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchCustomer(); }, [fetchCustomer]);

  const handleSave = async () => {
    if (!form.name?.trim()) { toastError('Validation error', 'Customer name is required'); return; }
    setSaving(true);
    try {
      const { invoices: _, ...updateData } = form as any;
      if (sameAsB) {
        updateData.shippingAddress = updateData.billingAddress;
        updateData.shippingCity = updateData.billingCity;
        updateData.shippingState = updateData.billingState;
        updateData.shippingPincode = updateData.billingPincode;
      }
      const res = await apiFetch<{ data: Customer }>(`/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      setCustomer({ ...res.data, invoices: customer.invoices });
      setForm({ ...res.data, invoices: customer.invoices });
      setEditing(false);
      success('Customer updated', 'Changes saved successfully.');
    } catch (err: any) {
      toastError('Failed to update', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiFetch(`/customers/${id}`, { method: 'DELETE' });
      success('Customer deleted', 'Customer has been removed.');
      router.push('/customers');
    } catch (err: any) {
      toastError('Failed to delete', err.message);
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-48 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6 lg:p-8 text-center">
        <p className="text-gray-500">Customer not found.</p>
        <Link href="/customers" className="mt-3 inline-flex text-sm text-indigo-600 hover:underline">← Back to Customers</Link>
      </div>
    );
  }

  const totalBilled = (customer.invoices || []).reduce((s, i) => s + i.total, 0);
  const totalDue = (customer.invoices || []).reduce((s, i) => s + i.amountDue, 0);

  const set = (key: string, val: string | number) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <ConfirmModal
        open={confirmDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete "${customer.name}"? This action cannot be undone.`}
        confirmLabel="Delete Customer"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.push('/customers')} className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold">{customer.name.charAt(0)}</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-sm text-gray-500">{customer.billingCity || 'Customer'}</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {editing ? (
            <>
              <button onClick={() => { setEditing(false); setForm(customer); }} className="rounded-lg px-3 py-2 text-sm border border-gray-200 hover:bg-gray-50">
                <X className="h-4 w-4" />
              </button>
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

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Billed', value: `₹${totalBilled.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Amount Due', value: `₹${totalDue.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Invoices', value: String((customer.invoices || []).length), icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Credit Days', value: String(customer.creditDays), icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(card => (
          <div key={card.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center mb-2 ${card.bg}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <p className="text-lg font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {editing ? (
            <>
              {/* Basic Information */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="h-4 w-4 text-indigo-600" /> Basic Information
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <EditField label="Customer Name *">
                      <input value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="Acme Corporation" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    </EditField>
                  </div>
                  <EditField label="Email Address">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="billing@acme.com" className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    </div>
                  </EditField>
                  <EditField label="Phone Number">
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type="tel" value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    </div>
                  </EditField>
                </div>
              </div>

              {/* GST & Tax Details */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Hash className="h-4 w-4 text-indigo-600" /> GST & Tax Details
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <EditField label="GST Type">
                    <select value={form.gstType || 'UNREGISTERED'} onChange={e => set('gstType', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                      {GST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </EditField>
                  <EditField label="GSTIN">
                    <input value={form.gstin || ''} onChange={e => set('gstin', e.target.value.toUpperCase())} maxLength={15} placeholder="22AAAAA0000A1Z5" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-mono uppercase focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  </EditField>
                  <EditField label="PAN">
                    <input value={form.pan || ''} onChange={e => set('pan', e.target.value.toUpperCase())} maxLength={10} placeholder="AAAAA0000A" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-mono uppercase focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  </EditField>
                  <EditField label="Credit Limit (₹)">
                    <input type="number" value={form.creditLimit ?? ''} onChange={e => set('creditLimit', e.target.value === '' ? 0 : parseFloat(e.target.value))} placeholder="0" min="0" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  </EditField>
                  <EditField label="Credit Days">
                    <input type="number" value={form.creditDays ?? 30} onChange={e => set('creditDays', e.target.value === '' ? 30 : parseInt(e.target.value))} min="0" max="365" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  </EditField>
                </div>
              </div>

              {/* Billing Address */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-indigo-600" /> Billing Address
                </h2>
                <div className="space-y-4">
                  <EditField label="Street Address">
                    <input value={form.billingAddress || ''} onChange={e => set('billingAddress', e.target.value)} placeholder="123, MG Road, Near Central Mall" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  </EditField>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <EditField label="City">
                      <input value={form.billingCity || ''} onChange={e => set('billingCity', e.target.value)} placeholder="Bengaluru" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    </EditField>
                    <EditField label="State">
                      <select value={form.billingState || ''} onChange={e => set('billingState', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                        <option value="">Select State</option>
                        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </EditField>
                    <EditField label="Pincode">
                      <input value={form.billingPincode || ''} onChange={e => set('billingPincode', e.target.value)} placeholder="560001" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    </EditField>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-purple-600" /> Shipping Address
                  </h2>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sameAsB}
                      onChange={e => setSameAsB(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600"
                    />
                    Same as billing
                  </label>
                </div>
                {sameAsB ? (
                  <p className="text-sm text-gray-400 italic">Shipping address will be same as billing address.</p>
                ) : (
                  <div className="space-y-4">
                    <EditField label="Street Address">
                      <input value={form.shippingAddress || ''} onChange={e => set('shippingAddress', e.target.value)} placeholder="456, Outer Ring Road" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    </EditField>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <EditField label="City">
                        <input value={form.shippingCity || ''} onChange={e => set('shippingCity', e.target.value)} placeholder="Bengaluru" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                      </EditField>
                      <EditField label="State">
                        <select value={form.shippingState || ''} onChange={e => set('shippingState', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                          <option value="">Select State</option>
                          {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </EditField>
                      <EditField label="Pincode">
                        <input value={form.shippingPincode || ''} onChange={e => set('shippingPincode', e.target.value)} placeholder="560066" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                      </EditField>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
          <>
          {/* Details Card (view mode) */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Customer Details</h2>
            <div className="space-y-3">
              {customer.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4 text-gray-400" />{customer.email}
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4 text-gray-400" />{customer.phone}
                </div>
              )}
              {customer.gstin && (
                <div className="flex items-center gap-2 text-sm">
                  <Hash className="h-4 w-4 text-gray-400" />
                  <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{customer.gstin}</span>
                </div>
              )}
              {(customer.billingAddress || customer.billingCity) && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase mb-0.5">Billing</p>
                    <span>{[customer.billingAddress, customer.billingCity, customer.billingState, customer.billingPincode].filter(Boolean).join(', ')}</span>
                  </div>
                </div>
              )}
              {(customer.shippingAddress || customer.shippingCity) && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-purple-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase mb-0.5">Shipping</p>
                    <span>{[customer.shippingAddress, customer.shippingCity, customer.shippingState, customer.shippingPincode].filter(Boolean).join(', ')}</span>
                  </div>
                </div>
              )}
              {customer.notes && (
                <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">{customer.notes}</div>
              )}
            </div>
          </div>
          </>
          )}

          {/* Invoices */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Invoices</h2>
              <Link href={`/invoices/new?customerId=${customer.id}`} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                + New Invoice
              </Link>
            </div>
            {(customer.invoices || []).length === 0 ? (
              <div className="py-10 text-center">
                <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No invoices yet</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Invoice</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(customer.invoices || []).map(inv => {
                    const sc = STATUS_CONFIG[inv.status] || STATUS_CONFIG.DRAFT;
                    return (
                      <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Link href={`/invoices/${inv.id}`} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">{inv.invoiceNumber}</Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{new Date(inv.issueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">₹{inv.total.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${sc.cls}`}>
                            <sc.Icon className="h-3 w-3" />{sc.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/invoices/${inv.id}`}><ChevronRight className="h-4 w-4 text-gray-400" /></Link>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {editing ? (
            <>
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-600" /> Notes
                </h3>
                <textarea
                  value={form.notes || ''}
                  onChange={e => set('notes', e.target.value)}
                  rows={4}
                  placeholder="Internal notes about this customer..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs text-blue-700">
                  <strong>GSTIN validation:</strong> Format: 2-digit state code + 10-char PAN + 1 entity number + Z + 1 check digit (e.g., 22AAAAA0000A1Z5)
                </p>
              </div>
            </>
          ) : (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Account Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">GST Type</span>
                <span className="text-gray-900 font-medium">{customer.gstType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Credit Limit</span>
                <span className="text-gray-900 font-medium">₹{customer.creditLimit.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Credit Days</span>
                <span className="text-gray-900 font-medium">{customer.creditDays} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Since</span>
                <span className="text-gray-900 font-medium">{new Date(customer.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`text-xs font-semibold ${customer.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {customer.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
