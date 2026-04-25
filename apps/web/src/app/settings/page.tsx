'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Mail, Phone, MapPin, FileText, CreditCard,
  Save, CheckCircle, Camera, Globe, Hash, Bell, Lock, Upload
} from 'lucide-react';
import { apiFetch, API_URL, getAccessToken, getUserData } from '@/lib/api';

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
  logo: string | null;
  defaultTemplateId: string | null;
}

interface InvoiceTemplate {
  id: string;
  name: string;
  thumbnail: string | null;
  isDefault: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'business' | 'banking' | 'invoice' | 'notifications' | 'security'>('business');
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  useEffect(() => {
    const tokenData = getUserData();
    const businessId = tokenData.businessId;
    if (!businessId) {
      setLoading(false);
      return;
    }
    apiFetch<{ data: BusinessSettings }>(`/business/${businessId}`)
      .then(res => {
        if (res.data) setSettings(res.data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab !== 'invoice' || templates.length > 0) return;
    setTemplatesLoading(true);
    apiFetch<{ data: InvoiceTemplate[] }>('/invoices/templates')
      .then(res => { if (res.data) setTemplates(res.data); })
      .catch(() => {})
      .finally(() => setTemplatesLoading(false));
  }, [activeTab, templates.length]);

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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;
    if (!file.type.startsWith('image/')) { setError('Please select an image file'); return; }
    if (file.size > 2 * 1024 * 1024) { setError('Logo must be under 2MB'); return; }
    setLogoUploading(true);
    setError('');
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = ev.target?.result as string;
        const token = getAccessToken();
        const res = await fetch(`${API_URL}/business/${settings.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ logo: dataUrl }),
        });
        const data = await res.json();
        if (data.success) {
          setSettings(prev => prev ? { ...prev, logo: dataUrl } : prev);
        } else {
          setError(data.error || 'Failed to upload logo');
        }
        setLogoUploading(false);
      };
      reader.onerror = () => { setError('Failed to read file'); setLogoUploading(false); };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message);
      setLogoUploading(false);
    }
    // Reset the input so the same file can be re-selected
    e.target.value = '';
  };

  const TABS = [
    { id: 'business' as const, label: 'Business Info', icon: Building2 },
    { id: 'banking' as const, label: 'Banking', icon: CreditCard },
    { id: 'invoice' as const, label: 'Invoice Settings', icon: FileText },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'security' as const, label: 'Security', icon: Lock },
  ];

  const handlePasswordChange = async () => {
    if (!pwForm.current || !pwForm.newPw) { setPwError('All fields required'); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwError('Passwords do not match'); return; }
    if (pwForm.newPw.length < 8) { setPwError('Password must be at least 8 characters'); return; }
    setPwLoading(true); setPwError(''); setPwSuccess(false);
    try {
      await apiFetch('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.newPw }) });
      setPwSuccess(true);
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err: any) {
      setPwError(err.message);
    } finally {
      setPwLoading(false);
    }
  };

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
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 hover:shadow-md transition-all duration-150 active:scale-95 disabled:opacity-60 disabled:pointer-events-none"
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
                {/* Logo */}
                <div className="flex items-center gap-4 pb-5 border-b border-gray-100">
                  <div className="h-16 w-16 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
                    {settings.logo ? (
                      <img src={settings.logo} alt="Business Logo" className="h-full w-full object-contain" />
                    ) : (
                      settings.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{settings.name}</h3>
                    <label className="mt-1 inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 cursor-pointer">
                      <Camera className="h-3 w-3" />
                      {logoUploading ? 'Uploading...' : settings.logo ? 'Change Logo' : 'Upload Logo'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                        disabled={logoUploading}
                      />
                    </label>
                    {settings.logo && !logoUploading && (
                      <button
                        onClick={async () => {
                          const prevLogo = settings.logo;
                          setSettings(prev => prev ? { ...prev, logo: null } : prev);
                          try {
                            const token = getAccessToken();
                            const res = await fetch(`${API_URL}/business/${settings.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ logo: null }),
                            });
                            const data = await res.json();
                            if (!data.success) {
                              setSettings(prev => prev ? { ...prev, logo: prevLogo } : prev);
                              setError(data.error || 'Failed to remove logo');
                            }
                          } catch (err: any) {
                            setSettings(prev => prev ? { ...prev, logo: prevLogo } : prev);
                            setError(err.message);
                          }
                        }}
                        className="ml-3 text-xs text-red-500 hover:text-red-600"
                      >
                        Remove
                      </button>
                    )}
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
              <div className="space-y-6">
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
                <fieldset>
                  <legend className="block text-sm font-semibold text-gray-700 mb-3">Default Invoice Template</legend>
                  {templatesLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse rounded-xl border border-gray-100 bg-gray-50 h-40" />
                      ))}
                    </div>
                  ) : templates.length === 0 ? (
                    <p className="text-sm text-gray-400">No published templates available.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {templates.map(tpl => {
                        const isSelected = settings.defaultTemplateId
                          ? settings.defaultTemplateId === tpl.id
                          : tpl.isDefault;
                        return (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => update('defaultTemplateId', tpl.id)}
                            className={`relative rounded-xl border-2 p-3 text-left transition-all focus:outline-none ${
                              isSelected
                                ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                                : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50'
                            }`}
                          >
                            {tpl.thumbnail ? (
                              <img
                                src={tpl.thumbnail}
                                alt={tpl.name}
                                className="w-full h-28 object-cover rounded-lg mb-2 bg-gray-100"
                              />
                            ) : (
                              <div className="w-full h-28 rounded-lg mb-2 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                <FileText className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                            <p className="text-sm font-medium text-gray-800 truncate">{tpl.name}</p>
                            {isSelected && (
                              <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600">
                                <CheckCircle className="h-3.5 w-3.5 text-white" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <p className="mt-2 text-xs text-gray-400">This template will be used by default when creating new invoices.</p>
                </fieldset>
              </div>
            )}
            {activeTab === 'notifications' && (
              <div className="space-y-5">
                <h3 className="text-sm font-semibold text-gray-700">Email Notifications</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Invoice sent confirmation', desc: 'Receive a copy when you send an invoice' },
                    { label: 'Payment received', desc: 'Notify when payment is recorded' },
                    { label: 'Overdue invoice alerts', desc: 'Daily digest of overdue invoices' },
                    { label: 'Low stock alerts', desc: 'When product stock falls below threshold' },
                    { label: 'Weekly revenue summary', desc: 'Weekly business performance report' },
                  ].map(n => (
                    <div key={n.label} className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{n.label}</p>
                        <p className="text-xs text-gray-500">{n.desc}</p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="peer h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-indigo-600 peer-checked:after:translate-x-full" />
                      </label>
                    </div>
                  ))}
                </div>
                <h3 className="text-sm font-semibold text-gray-700 pt-2">WhatsApp Notifications</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Send invoice via WhatsApp', desc: 'Allow sending invoice links via WhatsApp' },
                    { label: 'Payment reminders', desc: 'Auto-send payment reminders to customers' },
                  ].map(n => (
                    <div key={n.label} className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{n.label}</p>
                        <p className="text-xs text-gray-500">{n.desc}</p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="peer h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-indigo-600 peer-checked:after:translate-x-full" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-5 max-w-sm">
                <h3 className="text-sm font-semibold text-gray-700">Change Password</h3>
                {pwSuccess && (
                  <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" /> Password changed successfully.
                  </div>
                )}
                {pwError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{pwError}</div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                  <input type="password" value={pwForm.current} onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                  <input type="password" value={pwForm.newPw} onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                  <input type="password" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
                <button onClick={handlePasswordChange} disabled={pwLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                  {pwLoading ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : <Lock className="h-4 w-4" />}
                  Update Password
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}
