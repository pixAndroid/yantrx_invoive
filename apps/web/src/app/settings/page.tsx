'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Mail, Phone, MapPin, FileText, CreditCard,
  Save, CheckCircle, Camera, Globe, Hash
} from 'lucide-react';
import { apiFetch, API_URL, getAccessToken } from '@/lib/api';

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
  bankName: string | null;
  accountNo: string | null;
  ifsc: string | null;
  upiId: string | null;
  invoicePrefix: string;
  termsAndConditions: string | null;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'business' | 'banking' | 'invoice'>('business');

  useEffect(() => {
    apiFetch<{ data: { business: BusinessSettings } }>('/auth/me')
      .then(res => {
        if (res.data?.business) setSettings(res.data.business);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError('');
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_URL}/business/${settings.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError(data.error || 'Failed to save');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof BusinessSettings, value: string) => {
    setSettings(prev => prev ? { ...prev, [key]: value } : prev);
  };

  const TABS = [
    { id: 'business' as const, label: 'Business Info', icon: Building2 },
    { id: 'banking' as const, label: 'Banking', icon: CreditCard },
    { id: 'invoice' as const, label: 'Invoice Settings', icon: FileText },
  ];

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-40" />
          <div className="h-64 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Settings</h1>
          <p className="text-gray-500 mt-1">Manage your business profile and preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !settings}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {saved ? <><CheckCircle className="h-4 w-4" /> Saved!</> : saving ? 'Saving...' : <><Save className="h-4 w-4" /> Save Changes</>}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {!settings ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <Building2 className="h-12 w-12 text-amber-400 mx-auto mb-3" />
          <p className="text-amber-700 font-medium">No business profile found</p>
          <p className="text-amber-600 text-sm mt-1">Complete registration to set up your business</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6"
          >
            {activeTab === 'business' && (
              <div className="space-y-5">
                {/* Logo placeholder */}
                <div className="flex items-center gap-4 pb-5 border-b border-gray-100">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
                    {settings.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{settings.name}</h3>
                    <button className="mt-1 inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700">
                      <Camera className="h-3 w-3" /> Upload Logo
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <Building2 className="inline h-3.5 w-3.5 mr-1" />Business Name *
                    </label>
                    <input
                      type="text"
                      value={settings.name}
                      onChange={e => update('name', e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Legal Name</label>
                    <input
                      type="text"
                      value={settings.legalName || ''}
                      onChange={e => update('legalName', e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <Hash className="inline h-3.5 w-3.5 mr-1" />GSTIN
                    </label>
                    <input
                      type="text"
                      value={settings.gstin || ''}
                      onChange={e => update('gstin', e.target.value)}
                      placeholder="22AAAAA0000A1Z5"
                      className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">PAN</label>
                    <input
                      type="text"
                      value={settings.pan || ''}
                      onChange={e => update('pan', e.target.value)}
                      placeholder="AAAAA0000A"
                      className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <Mail className="inline h-3.5 w-3.5 mr-1" />Business Email
                    </label>
                    <input
                      type="email"
                      value={settings.email || ''}
                      onChange={e => update('email', e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <Phone className="inline h-3.5 w-3.5 mr-1" />Phone
                    </label>
                    <input
                      type="tel"
                      value={settings.phone || ''}
                      onChange={e => update('phone', e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <Globe className="inline h-3.5 w-3.5 mr-1" />Website
                    </label>
                    <input
                      type="url"
                      value={settings.website || ''}
                      onChange={e => update('website', e.target.value)}
                      placeholder="https://yoursite.com"
                      className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <MapPin className="inline h-3.5 w-3.5 mr-1" />Address
                  </label>
                  <input
                    type="text"
                    value={settings.address || ''}
                    onChange={e => update('address', e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none mb-3"
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={settings.city || ''}
                      onChange={e => update('city', e.target.value)}
                      placeholder="City"
                      className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={settings.state || ''}
                      onChange={e => update('state', e.target.value)}
                      placeholder="State"
                      className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={settings.pincode || ''}
                      onChange={e => update('pincode', e.target.value)}
                      placeholder="Pincode"
                      className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'banking' && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Bank Name</label>
                    <input
                      type="text"
                      value={settings.bankName || ''}
                      onChange={e => update('bankName', e.target.value)}
                      placeholder="HDFC Bank"
                      className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Number</label>
                    <input
                      type="text"
                      value={settings.accountNo || ''}
                      onChange={e => update('accountNo', e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">IFSC Code</label>
                    <input
                      type="text"
                      value={settings.ifsc || ''}
                      onChange={e => update('ifsc', e.target.value)}
                      placeholder="HDFC0001234"
                      className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">UPI ID</label>
                    <input
                      type="text"
                      value={settings.upiId || ''}
                      onChange={e => update('upiId', e.target.value)}
                      placeholder="business@upi"
                      className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                  <p className="text-xs text-blue-700">
                    <strong>Note:</strong> Bank details will appear on your GST invoices as payment instructions. Make sure the information is accurate.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'invoice' && (
              <div className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Invoice Prefix</label>
                    <input
                      type="text"
                      value={settings.invoicePrefix}
                      onChange={e => update('invoicePrefix', e.target.value)}
                      placeholder="INV"
                      className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-gray-400">Invoices will be numbered like {settings.invoicePrefix}-0001</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Terms & Conditions</label>
                  <textarea
                    value={settings.termsAndConditions || ''}
                    onChange={e => update('termsAndConditions', e.target.value)}
                    rows={4}
                    placeholder="Payment due within 30 days..."
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                  />
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}
