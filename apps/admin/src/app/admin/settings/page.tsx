'use client';

import { useState, useEffect } from 'react';
import { Settings, Shield, Bell, Globe, Database, Key, Save, CheckCircle, LayoutTemplate } from 'lucide-react';
import { adminFetch } from '@/lib/api';

const SETTING_SECTIONS = [
  {
    id: 'platform',
    title: 'Platform Settings',
    icon: Globe,
    fields: [
      { key: 'platformName', label: 'Platform Name', value: 'Yantrix', type: 'text' },
      { key: 'supportEmail', label: 'Support Email', value: 'support@yantrix.in', type: 'email' },
      { key: 'maxFreeInvoices', label: 'Free Plan Invoice Limit', value: '5', type: 'number' },
      { key: 'trialDays', label: 'Trial Period (Days)', value: '14', type: 'number' },
    ],
  },
  {
    id: 'security',
    title: 'Security',
    icon: Shield,
    fields: [
      { key: 'jwtExpiry', label: 'JWT Expiry', value: '7d', type: 'text' },
      { key: 'maxLoginAttempts', label: 'Max Login Attempts', value: '5', type: 'number' },
      { key: 'otpExpiry', label: 'OTP Expiry (minutes)', value: '10', type: 'number' },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    toggles: [
      { key: 'emailNotifications', label: 'Email Notifications', enabled: true },
      { key: 'smsNotifications', label: 'SMS Notifications', enabled: false },
      { key: 'invoiceAlerts', label: 'Invoice Due Alerts', enabled: true },
      { key: 'paymentAlerts', label: 'Payment Received Alerts', enabled: true },
    ],
  },
];

const HOME_HEADER_DEFAULTS = {
  badgeText: 'Trusted by 500+ businesses across India',
  titleLine1: 'We Build Tools That',
  titleGradientText: 'Power Modern Businesses',
  description:
    'From invoicing to booking platforms, tracking systems to SaaS products — we design software that helps companies grow faster.',
  primaryBtnLabel: 'Explore Tools',
  secondaryBtnLabel: 'Start a Project',
  stat1Value: '10+',
  stat1Label: 'Products Built',
  stat2Value: '500+',
  stat2Label: 'Businesses Served',
  stat3Value: '5+',
  stat3Label: 'Industries',
};

export default function AdminSettingsPage() {
  const [formData, setFormData] = useState<Record<string, string>>({
    platformName: 'Yantrix',
    supportEmail: 'support@yantrix.in',
    maxFreeInvoices: '5',
    trialDays: '14',
    jwtExpiry: '7d',
    maxLoginAttempts: '5',
    otpExpiry: '10',
  });

  const [toggles, setToggles] = useState<Record<string, boolean>>({
    emailNotifications: true,
    smsNotifications: false,
    invoiceAlerts: true,
    paymentAlerts: true,
  });

  const [homeHeader, setHomeHeader] = useState<Record<string, string>>(HOME_HEADER_DEFAULTS);
  const [headerLoading, setHeaderLoading] = useState(true);

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminFetch('/admin/settings/home-header')
      .then((res: any) => {
        if (res.success && res.data) {
          setHomeHeader(prev => ({ ...prev, ...Object.fromEntries(Object.entries(res.data).filter(([, v]) => v != null)) }));
        }
      })
      .catch(() => {})
      .finally(() => setHeaderLoading(false));
  }, []);

  const handleSave = async () => {
    await adminFetch('/admin/settings/home-header', {
      method: 'PUT',
      body: JSON.stringify(homeHeader),
    }).catch(() => {});
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-1">Platform configuration and preferences</p>
        </div>
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
        >
          {saved ? <><CheckCircle className="h-4 w-4" /> Saved!</> : <><Save className="h-4 w-4" /> Save Changes</>}
        </button>
      </div>

      <div className="space-y-6">
        {SETTING_SECTIONS.map(section => (
          <div key={section.id} className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-800 bg-gray-800/50">
              <section.icon className="h-5 w-5 text-orange-400" />
              <h2 className="text-base font-semibold text-white">{section.title}</h2>
            </div>
            <div className="p-6">
              {section.fields && (
                <div className="grid sm:grid-cols-2 gap-4">
                  {section.fields.map(field => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-400 mb-1.5">{field.label}</label>
                      <input
                        type={field.type}
                        value={formData[field.key] ?? field.value}
                        onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-200 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              )}
              {section.toggles && (
                <div className="space-y-4">
                  {section.toggles.map(toggle => (
                    <div key={toggle.key} className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">{toggle.label}</span>
                      <button
                        onClick={() => setToggles(prev => ({ ...prev, [toggle.key]: !prev[toggle.key] }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${toggles[toggle.key] ? 'bg-orange-500' : 'bg-gray-700'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${toggles[toggle.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Home Page Header Config */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-800 bg-gray-800/50">
            <LayoutTemplate className="h-5 w-5 text-orange-400" />
            <h2 className="text-base font-semibold text-white">Home Page Header Config</h2>
          </div>
          <div className="p-6 space-y-6">
            {headerLoading ? (
              <p className="text-sm text-gray-400">Loading…</p>
            ) : (
              <>
                {/* Badge & Title */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Badge Text</label>
                    <input
                      type="text"
                      value={homeHeader.badgeText}
                      onChange={e => setHomeHeader(prev => ({ ...prev, badgeText: e.target.value }))}
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-200 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Title Line 1</label>
                    <input
                      type="text"
                      value={homeHeader.titleLine1}
                      onChange={e => setHomeHeader(prev => ({ ...prev, titleLine1: e.target.value }))}
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-200 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Title Gradient Text</label>
                    <input
                      type="text"
                      value={homeHeader.titleGradientText}
                      onChange={e => setHomeHeader(prev => ({ ...prev, titleGradientText: e.target.value }))}
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-200 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Description</label>
                    <textarea
                      rows={3}
                      value={homeHeader.description}
                      onChange={e => setHomeHeader(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-200 focus:border-orange-500 focus:outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Primary Button Label</label>
                    <input
                      type="text"
                      value={homeHeader.primaryBtnLabel}
                      onChange={e => setHomeHeader(prev => ({ ...prev, primaryBtnLabel: e.target.value }))}
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-200 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Secondary Button Label</label>
                    <input
                      type="text"
                      value={homeHeader.secondaryBtnLabel}
                      onChange={e => setHomeHeader(prev => ({ ...prev, secondaryBtnLabel: e.target.value }))}
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-200 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Stats */}
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-3">Hero Stats</p>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {([1, 2, 3] as const).map(n => (
                      <div key={n} className="rounded-xl border border-gray-700 bg-gray-800/50 p-4 space-y-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stat {n}</p>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">Value</label>
                          <input
                            type="text"
                            value={homeHeader[`stat${n}Value`]}
                            onChange={e => setHomeHeader(prev => ({ ...prev, [`stat${n}Value`]: e.target.value }))}
                            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-orange-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">Label</label>
                          <input
                            type="text"
                            value={homeHeader[`stat${n}Label`]}
                            onChange={e => setHomeHeader(prev => ({ ...prev, [`stat${n}Label`]: e.target.value }))}
                            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-orange-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-2xl border border-red-900/50 bg-gray-900 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-red-900/50 bg-red-900/10">
            <Database className="h-5 w-5 text-red-400" />
            <h2 className="text-base font-semibold text-red-400">Danger Zone</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-red-900/30 bg-red-900/10">
              <div>
                <p className="text-sm font-medium text-gray-200">Clear Audit Logs</p>
                <p className="text-xs text-gray-500">Delete all audit logs older than 90 days</p>
              </div>
              <button className="rounded-lg border border-red-800 px-3 py-1.5 text-sm text-red-400 hover:bg-red-900/30">
                Clear Logs
              </button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl border border-red-900/30 bg-red-900/10">
              <div>
                <p className="text-sm font-medium text-gray-200">API Rate Limits</p>
                <p className="text-xs text-gray-500">Reset rate limit counters for all users</p>
              </div>
              <button className="rounded-lg border border-red-800 px-3 py-1.5 text-sm text-red-400 hover:bg-red-900/30">
                Reset Limits
              </button>
            </div>
          </div>
        </div>

        {/* API Keys */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-800 bg-gray-800/50">
            <Key className="h-5 w-5 text-orange-400" />
            <h2 className="text-base font-semibold text-white">System Information</h2>
          </div>
          <div className="p-6 space-y-3">
            {[
              { label: 'API Version', value: 'v1.0.0' },
              { label: 'Node Environment', value: process.env.NODE_ENV || 'development' },
              { label: 'Database', value: 'PostgreSQL' },
              { label: 'Cache', value: 'In-Memory' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <span className="text-sm text-gray-400">{item.label}</span>
                <span className="text-sm font-mono text-gray-300">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
