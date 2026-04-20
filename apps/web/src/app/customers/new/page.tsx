'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, User, Mail, Phone, MapPin, Hash, FileText } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { INDIAN_STATES } from '@/lib/constants';

const GST_TYPES = [
  { value: 'REGULAR', label: 'Regular' },
  { value: 'COMPOSITION', label: 'Composition' },
  { value: 'UNREGISTERED', label: 'Unregistered' },
  { value: 'EXPORT', label: 'Export' },
  { value: 'SEZ', label: 'SEZ' },
];

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function NewCustomerPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customerLimitReached, setCustomerLimitReached] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    gstin: '',
    pan: '',
    gstType: 'UNREGISTERED',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingPincode: '',
    shippingAddress: '',
    shippingCity: '',
    shippingState: '',
    shippingPincode: '',
    creditLimit: '',
    creditDays: '30',
    notes: '',
  });
  const [sameAsB, setSameAsB] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/subscriptions'),
      apiFetch('/business/stats'),
    ]).then(([subRes, statsRes]: [any, any]) => {
      const sub = subRes.data?.[0];
      if (!sub) return;
      const customerLimit: number = sub.plan?.customerLimit || 0;
      const customersUsed: number = statsRes.data?.activeCustomers ?? 0;
      if (customerLimit > 0) {
        setCustomerLimitReached(customersUsed >= customerLimit);
      }
    }).catch(() => {});
  }, []);

  const set = (key: string, val: string) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => { const e = { ...prev }; delete e[key]; return e; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Customer name is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address';
    if (form.gstin && form.gstin.length !== 15) e.gstin = 'GSTIN must be exactly 15 characters';
    if (form.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(form.gstin)) {
      e.gstin = 'Invalid GSTIN format';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (customerLimitReached) { toastError('Customer limit reached', 'Please upgrade your plan to add more customers.'); return; }
    if (!validate()) return;
    setLoading(true);
    try {
      const payload: Record<string, any> = {
        name: form.name.trim(),
        gstType: form.gstType,
        creditDays: parseInt(form.creditDays) || 30,
      };
      if (form.email) payload.email = form.email;
      if (form.phone) payload.phone = form.phone;
      if (form.gstin) payload.gstin = form.gstin.toUpperCase();
      if (form.pan) payload.pan = form.pan.toUpperCase();
      if (form.billingAddress) payload.billingAddress = form.billingAddress;
      if (form.billingCity) payload.billingCity = form.billingCity;
      if (form.billingState) payload.billingState = form.billingState;
      if (form.billingPincode) payload.billingPincode = form.billingPincode;
      if (form.notes) payload.notes = form.notes;
      if (form.creditLimit) payload.creditLimit = parseFloat(form.creditLimit);
      if (sameAsB) {
        payload.shippingAddress = form.billingAddress;
        payload.shippingCity = form.billingCity;
        payload.shippingState = form.billingState;
        payload.shippingPincode = form.billingPincode;
      } else {
        if (form.shippingAddress) payload.shippingAddress = form.shippingAddress;
        if (form.shippingCity) payload.shippingCity = form.shippingCity;
        if (form.shippingState) payload.shippingState = form.shippingState;
        if (form.shippingPincode) payload.shippingPincode = form.shippingPincode;
      }
      const res = await apiFetch<{ data: { id: string } }>('/customers', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      success('Customer added', `${form.name} has been saved successfully.`);
      router.push(`/customers/${res.data.id}`);
    } catch (err: any) {
      toastError('Failed to save', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Customer</h1>
          <p className="text-gray-500 text-sm mt-0.5">Create a new customer record</p>
        </div>
        <div className="ml-auto">
          <button
            onClick={handleSubmit}
            disabled={loading || customerLimitReached}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : <Save className="h-4 w-4" />}
            Save Customer
          </button>
        </div>
      </div>

      {customerLimitReached && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">Customer limit reached</p>
            <p className="text-xs text-red-600 mt-0.5">You have reached the maximum number of customers allowed by your current plan. Please upgrade to add more customers.</p>
          </div>
          <a href="/settings/billing" className="flex-shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">Upgrade Plan</a>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-600" /> Basic Information
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Customer Name *" error={errors.name}>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="Acme Corporation"
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
                  />
                </Field>
              </div>
              <Field label="Email Address" error={errors.email}>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="billing@acme.com"
                    className={`w-full rounded-lg border pl-10 pr-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
                  />
                </div>
              </Field>
              <Field label="Phone Number">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </Field>
            </div>
          </div>

          {/* GST Details */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Hash className="h-4 w-4 text-indigo-600" /> GST & Tax Details
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="GST Type">
                <select
                  value={form.gstType}
                  onChange={e => set('gstType', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  {GST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="GSTIN" error={errors.gstin}>
                <input
                  type="text"
                  value={form.gstin}
                  onChange={e => set('gstin', e.target.value.toUpperCase())}
                  placeholder="22AAAAA0000A1Z5"
                  maxLength={15}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm font-mono uppercase focus:border-indigo-500 focus:outline-none ${errors.gstin ? 'border-red-400' : 'border-gray-300'}`}
                />
              </Field>
              <Field label="PAN">
                <input
                  type="text"
                  value={form.pan}
                  onChange={e => set('pan', e.target.value.toUpperCase())}
                  placeholder="AAAAA0000A"
                  maxLength={10}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-mono uppercase focus:border-indigo-500 focus:outline-none"
                />
              </Field>
              <Field label="Credit Limit (₹)">
                <input
                  type="number"
                  value={form.creditLimit}
                  onChange={e => set('creditLimit', e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </Field>
              <Field label="Credit Days">
                <input
                  type="number"
                  value={form.creditDays}
                  onChange={e => set('creditDays', e.target.value)}
                  min="0"
                  max="365"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </Field>
            </div>
          </div>

          {/* Billing Address */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-indigo-600" /> Billing Address
            </h2>
            <div className="space-y-4">
              <Field label="Street Address">
                <input
                  type="text"
                  value={form.billingAddress}
                  onChange={e => set('billingAddress', e.target.value)}
                  placeholder="123, MG Road, Near Central Mall"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </Field>
              <div className="grid sm:grid-cols-3 gap-4">
                <Field label="City">
                  <input
                    type="text"
                    value={form.billingCity}
                    onChange={e => set('billingCity', e.target.value)}
                    placeholder="Bengaluru"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </Field>
                <Field label="State">
                  <select
                    value={form.billingState}
                    onChange={e => set('billingState', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Pincode">
                  <input
                    type="text"
                    value={form.billingPincode}
                    onChange={e => set('billingPincode', e.target.value)}
                    placeholder="560001"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </Field>
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
            {!sameAsB && (
              <div className="space-y-4">
                <Field label="Street Address">
                  <input
                    type="text"
                    value={form.shippingAddress}
                    onChange={e => set('shippingAddress', e.target.value)}
                    placeholder="456, Outer Ring Road"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </Field>
                <div className="grid sm:grid-cols-3 gap-4">
                  <Field label="City">
                    <input
                      type="text"
                      value={form.shippingCity}
                      onChange={e => set('shippingCity', e.target.value)}
                      placeholder="Bengaluru"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </Field>
                  <Field label="State">
                    <select
                      value={form.shippingState}
                      onChange={e => set('shippingState', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Pincode">
                    <input
                      type="text"
                      value={form.shippingPincode}
                      onChange={e => set('shippingPincode', e.target.value)}
                      placeholder="560066"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </Field>
                </div>
              </div>
            )}
            {sameAsB && (
              <p className="text-sm text-gray-400 italic">Shipping address will be same as billing address.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" /> Notes
            </h3>
            <textarea
              value={form.notes}
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
        </div>
      </div>
    </div>
  );
}
