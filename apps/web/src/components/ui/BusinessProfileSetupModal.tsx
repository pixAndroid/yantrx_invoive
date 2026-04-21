'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, FileText, CheckCircle, ArrowRight, ChevronRight } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface BusinessSettings {
  id: string;
  name: string;
  legalName: string | null;
  gstin: string | null;
  pan: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  invoicePrefix: string;
}

export type { BusinessSettings };

interface Props {
  settings: BusinessSettings;
  onComplete: (updated: BusinessSettings) => void;
}

const STEPS = [
  { id: 1, label: 'Business Info', icon: Building2 },
  { id: 2, label: 'Invoice Settings', icon: FileText },
];

export function BusinessProfileSetupModal({ settings, onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<BusinessSettings>({ ...settings });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (key: keyof BusinessSettings, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleNextStep = () => {
    if (!form.name.trim()) {
      setError('Business Name is required.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSave = async () => {
    if (!form.invoicePrefix.trim()) {
      setError('Invoice Prefix is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/business/${form.id}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      onComplete(form);
    } catch (err: any) {
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
          <h2 className="text-lg font-bold text-white">Business Profile Setup</h2>
          <p className="text-indigo-200 text-sm mt-0.5">Complete your profile to get started</p>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-4">
            {STEPS.map((s, idx) => {
              const isCompleted = step > s.id;
              const isCurrent = step === s.id;
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                      isCompleted
                        ? 'bg-white/30 text-white'
                        : isCurrent
                        ? 'bg-white text-indigo-700'
                        : 'bg-white/10 text-indigo-300'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-3.5 w-3.5" />
                    ) : (
                      <s.icon className="h-3.5 w-3.5" />
                    )}
                    <span>Step {s.id}: {s.label}</span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <ChevronRight className="h-3.5 w-3.5 text-indigo-300 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-sm text-gray-600 mb-4">
                  Tell us about your business so we can personalise your invoices.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Business Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => update('name', e.target.value)}
                      placeholder="Your Business Name"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Legal Name</label>
                    <input
                      type="text"
                      value={form.legalName ?? ''}
                      onChange={e => update('legalName', e.target.value)}
                      placeholder="Legal Entity Name"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">GSTIN</label>
                      <input
                        type="text"
                        value={form.gstin ?? ''}
                        onChange={e => update('gstin', e.target.value)}
                        placeholder="22AAAAA0000A1Z5"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">PAN</label>
                      <input
                        type="text"
                        value={form.pan ?? ''}
                        onChange={e => update('pan', e.target.value)}
                        placeholder="AAAAA0000A"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Business Email</label>
                      <input
                        type="email"
                        value={form.email ?? ''}
                        onChange={e => update('email', e.target.value)}
                        placeholder="hello@yourbusiness.com"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={form.phone ?? ''}
                        onChange={e => update('phone', e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={form.address ?? ''}
                      onChange={e => update('address', e.target.value)}
                      placeholder="Street address"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        value={form.city ?? ''}
                        onChange={e => update('city', e.target.value)}
                        placeholder="City"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">State</label>
                      <input
                        type="text"
                        value={form.state ?? ''}
                        onChange={e => update('state', e.target.value)}
                        placeholder="State"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Pincode</label>
                      <input
                        type="text"
                        value={form.pincode ?? ''}
                        onChange={e => update('pincode', e.target.value)}
                        placeholder="000000"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-sm text-gray-600 mb-4">
                  Set your invoice prefix. This will appear on all your invoice numbers.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Invoice Prefix <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.invoicePrefix}
                      onChange={e => update('invoicePrefix', e.target.value.toUpperCase())}
                      placeholder="INV"
                      maxLength={10}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    {form.invoicePrefix && (
                      <p className="mt-1.5 text-xs text-gray-500">
                        Your invoices will be numbered like{' '}
                        <span className="font-semibold text-indigo-600">
                          {form.invoicePrefix}-0001
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-400">
            Step {step} of {STEPS.length}
          </p>
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button
                onClick={() => { setError(''); setStep(1); }}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            )}
            {step === 1 ? (
              <button
                onClick={handleNextStep}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                Next <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                {saving ? 'Saving…' : (
                  <>
                    <CheckCircle className="h-4 w-4" /> Complete Setup
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
