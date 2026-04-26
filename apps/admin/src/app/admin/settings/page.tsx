'use client';

import { useState, useEffect, useRef } from 'react';
import { Settings, Shield, Bell, Globe, Database, Key, Save, CheckCircle, LayoutTemplate, Phone, Info, Users, Plus, Pencil, Trash2, X, Upload } from 'lucide-react';
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

const CONTACT_DEFAULTS = {
  contactEmail: 'support@yantrix.in',
  contactPhone: '+91 80 4567 8900',
  contactPhoneHref: 'tel:+918045678900',
  officeCompanyName: 'Yantrix Technologies Pvt. Ltd.',
  officeFloor: '4th Floor, Innovate Hub',
  officeStreet: '80 Feet Road, Koramangala',
  officeCity: 'Bengaluru',
  officeState: 'Karnataka 560034',
  officePinCode: '',
  officeCountry: 'India',
  officeWebsite: 'yantrix.in',
  hoursMondayFriday: '9 AM – 8 PM IST',
  hoursSaturday: '10 AM – 6 PM IST',
  hoursSunday: 'Email only',
  hoursNote: 'Extended support hours during GST filing deadlines (20th – 22nd of each month).',
};

const ABOUT_STATS_DEFAULTS = {
  stat1Value: '10+',
  stat1Label: 'Products Built',
  stat2Value: '500+',
  stat2Label: 'Businesses Served',
  stat3Value: '5+',
  stat3Label: 'Industries Covered',
  stat4Value: '3+',
  stat4Label: 'Years Building',
};

type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string;
  imageUrl: string | null;
  displayOrder: number;
  isActive: boolean;
};

type TeamMemberDraft = {
  id?: string;
  name: string;
  role: string;
  bio: string;
  imageUrl: string | null;
  displayOrder: number;
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

  const [aboutStats, setAboutStats] = useState<Record<string, string>>(ABOUT_STATS_DEFAULTS);
  const [aboutStatsLoading, setAboutStatsLoading] = useState(true);

  const [contactDetails, setContactDetails] = useState<Record<string, string>>(CONTACT_DEFAULTS);
  const [contactLoading, setContactLoading] = useState(true);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamModal, setTeamModal] = useState<{ open: boolean; draft: TeamMemberDraft }>({
    open: false,
    draft: { name: '', role: '', bio: '', imageUrl: null, displayOrder: 0 },
  });
  const [teamSaving, setTeamSaving] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminFetch('/admin/settings/home-header')
      .then((res: any) => {
        if (res.success && res.data) {
          setHomeHeader(prev => ({
            ...prev,
            ...Object.fromEntries(Object.entries(res.data).filter(([, v]) => v != null && v !== '')),
          }));
        }
      })
      .catch(() => {})
      .finally(() => setHeaderLoading(false));

    adminFetch('/admin/settings/about-stats')
      .then((res: any) => {
        if (res.success && res.data) {
          setAboutStats(prev => ({
            ...prev,
            ...Object.fromEntries(Object.entries(res.data).filter(([, v]) => v != null && v !== '')),
          }));
        }
      })
      .catch(() => {})
      .finally(() => setAboutStatsLoading(false));

    adminFetch('/admin/settings/contact')
      .then((res: any) => {
        if (res.success && res.data) {
          setContactDetails(prev => ({
            ...prev,
            ...Object.fromEntries(Object.entries(res.data).filter(([, v]) => v != null)),
          }));
        }
      })
      .catch(() => {})
      .finally(() => setContactLoading(false));

    adminFetch('/admin/settings/team-members')
      .then((res: any) => {
        if (res.success && Array.isArray(res.data)) {
          setTeamMembers(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setTeamLoading(false));
  }, []);

  const handleSave = async () => {
    await Promise.all([
      adminFetch('/admin/settings/home-header', {
        method: 'PUT',
        body: JSON.stringify(homeHeader),
      }),
      adminFetch('/admin/settings/about-stats', {
        method: 'PUT',
        body: JSON.stringify(aboutStats),
      }),
      adminFetch('/admin/settings/contact', {
        method: 'PUT',
        body: JSON.stringify(contactDetails),
      }),
    ])
      .then(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      })
      .catch(() => {});
  };

  const openAddMember = () => {
    setTeamModal({ open: true, draft: { name: '', role: '', bio: '', imageUrl: null, displayOrder: teamMembers.length } });
  };

  const openEditMember = (m: TeamMember) => {
    setTeamModal({ open: true, draft: { id: m.id, name: m.name, role: m.role, bio: m.bio, imageUrl: m.imageUrl, displayOrder: m.displayOrder } });
  };

  const closeTeamModal = () => {
    setTeamModal(prev => ({ ...prev, open: false }));
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      setTeamModal(prev => ({ ...prev, draft: { ...prev.draft, imageUrl: ev.target?.result as string } }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveMember = async () => {
    const { id, name, role, bio, imageUrl, displayOrder } = teamModal.draft;
    if (!name.trim() || !role.trim() || !bio.trim()) return;
    setTeamSaving(true);
    try {
      if (id) {
        const res: any = await adminFetch(`/admin/settings/team-members/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ name, role, bio, imageUrl, displayOrder }),
        });
        if (res.success) {
          setTeamMembers(prev => prev.map(m => m.id === id ? res.data : m));
        }
      } else {
        const res: any = await adminFetch('/admin/settings/team-members', {
          method: 'POST',
          body: JSON.stringify({ name, role, bio, imageUrl, displayOrder }),
        });
        if (res.success) {
          setTeamMembers(prev => [...prev, res.data]);
        }
      }
      closeTeamModal();
    } catch {
      // ignore
    } finally {
      setTeamSaving(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Delete this team member?')) return;
    try {
      await adminFetch(`/admin/settings/team-members/${id}`, { method: 'DELETE' });
      setTeamMembers(prev => prev.filter(m => m.id !== id));
    } catch {
      // ignore
    }
  };

  return (
    <>
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

        {/* About Page Stats Config */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-800 bg-gray-800/50">
            <Info className="h-5 w-5 text-orange-400" />
            <h2 className="text-base font-semibold text-white">About Page Stats</h2>
          </div>
          <div className="p-6 space-y-6">
            {aboutStatsLoading ? (
              <p className="text-sm text-gray-400">Loading…</p>
            ) : (
              <div>
                <p className="text-sm font-medium text-gray-400 mb-3">Stats displayed on the About page</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {([1, 2, 3, 4] as const).map(n => (
                    <div key={n} className="rounded-xl border border-gray-700 bg-gray-800/50 p-4 space-y-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stat {n}</p>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Value</label>
                        <input
                          type="text"
                          value={aboutStats[`stat${n}Value`]}
                          onChange={e => setAboutStats(prev => ({ ...prev, [`stat${n}Value`]: e.target.value }))}
                          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-orange-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Label</label>
                        <input
                          type="text"
                          value={aboutStats[`stat${n}Label`]}
                          onChange={e => setAboutStats(prev => ({ ...prev, [`stat${n}Label`]: e.target.value }))}
                          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-orange-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact Details Config */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-800 bg-gray-800/50">
            <Phone className="h-5 w-5 text-orange-400" />
            <h2 className="text-base font-semibold text-white">Contact Details</h2>
          </div>
          <div className="p-6 space-y-6">
            {contactLoading ? (
              <p className="text-sm text-gray-400">Loading…</p>
            ) : (
              <>
                {/* Support Channels */}
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-3">Support Channels</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1.5">Support Email</label>
                      <input
                        type="email"
                        value={contactDetails.contactEmail}
                        onChange={e => setContactDetails(prev => ({ ...prev, contactEmail: e.target.value }))}
                        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-200 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1.5">Phone Number (Display)</label>
                      <input
                        type="text"
                        value={contactDetails.contactPhone}
                        onChange={e => setContactDetails(prev => ({ ...prev, contactPhone: e.target.value }))}
                        placeholder="+91 80 4567 8900"
                        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-200 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-1.5">Phone Href (tel: link)</label>
                      <input
                        type="text"
                        value={contactDetails.contactPhoneHref}
                        onChange={e => setContactDetails(prev => ({ ...prev, contactPhoneHref: e.target.value }))}
                        placeholder="tel:+918045678900"
                        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-200 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Office Address */}
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-3">Office Address</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-1.5">Company Name</label>
                      <input
                        type="text"
                        value={contactDetails.officeCompanyName}
                        onChange={e => setContactDetails(prev => ({ ...prev, officeCompanyName: e.target.value }))}
                        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-200 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1.5">Floor / Building</label>
                      <input
                        type="text"
                        value={contactDetails.officeFloor}
                        onChange={e => setContactDetails(prev => ({ ...prev, officeFloor: e.target.value }))}
                        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-200 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1.5">Street</label>
                      <input
                        type="text"
                        value={contactDetails.officeStreet}
                        onChange={e => setContactDetails(prev => ({ ...prev, officeStreet: e.target.value }))}
                        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-200 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1.5">City</label>
                      <input
                        type="text"
                        value={contactDetails.officeCity}
                        onChange={e => setContactDetails(prev => ({ ...prev, officeCity: e.target.value }))}
                        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-200 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1.5">State &amp; Postal Code</label>
                      <input
                        type="text"
                        value={contactDetails.officeState}
                        onChange={e => setContactDetails(prev => ({ ...prev, officeState: e.target.value }))}
                        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-200 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1.5">Country</label>
                      <input
                        type="text"
                        value={contactDetails.officeCountry}
                        onChange={e => setContactDetails(prev => ({ ...prev, officeCountry: e.target.value }))}
                        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-200 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1.5">Website</label>
                      <input
                        type="text"
                        value={contactDetails.officeWebsite}
                        onChange={e => setContactDetails(prev => ({ ...prev, officeWebsite: e.target.value }))}
                        placeholder="yantrix.in"
                        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-200 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Support Hours */}
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-3">Support Hours</p>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1.5">Monday – Friday</label>
                      <input
                        type="text"
                        value={contactDetails.hoursMondayFriday}
                        onChange={e => setContactDetails(prev => ({ ...prev, hoursMondayFriday: e.target.value }))}
                        placeholder="9 AM – 8 PM IST"
                        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-200 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1.5">Saturday</label>
                      <input
                        type="text"
                        value={contactDetails.hoursSaturday}
                        onChange={e => setContactDetails(prev => ({ ...prev, hoursSaturday: e.target.value }))}
                        placeholder="10 AM – 6 PM IST"
                        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-200 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1.5">Sunday</label>
                      <input
                        type="text"
                        value={contactDetails.hoursSunday}
                        onChange={e => setContactDetails(prev => ({ ...prev, hoursSunday: e.target.value }))}
                        placeholder="Email only"
                        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-200 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Hours Note</label>
                    <textarea
                      rows={2}
                      value={contactDetails.hoursNote}
                      onChange={e => setContactDetails(prev => ({ ...prev, hoursNote: e.target.value }))}
                      placeholder="Extended support hours during GST filing deadlines..."
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-200 focus:border-orange-500 focus:outline-none resize-none"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Team Members Config */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-800/50">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-orange-400" />
              <h2 className="text-base font-semibold text-white">Team Members</h2>
            </div>
            <button
              onClick={openAddMember}
              className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700"
            >
              <Plus className="h-3.5 w-3.5" /> Add Member
            </button>
          </div>
          <div className="p-6">
            {teamLoading ? (
              <p className="text-sm text-gray-400">Loading…</p>
            ) : teamMembers.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No team members yet. Click &quot;Add Member&quot; to add one.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {teamMembers.map(m => (
                  <div key={m.id} className="flex gap-4 rounded-xl border border-gray-700 bg-gray-800/50 p-4">
                    <div className="flex-shrink-0">
                      {m.imageUrl ? (
                        <img
                          src={m.imageUrl}
                          alt={m.name}
                          className="h-14 w-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                          {m.name.split(' ').filter(n => n).map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{m.name}</p>
                      <p className="text-xs text-orange-400 mb-1">{m.role}</p>
                      <p className="text-xs text-gray-400 line-clamp-2">{m.bio}</p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => openEditMember(m)}
                        className="rounded-lg border border-gray-600 p-1.5 text-gray-400 hover:text-orange-400 hover:border-orange-500 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMember(m.id)}
                        className="rounded-lg border border-gray-600 p-1.5 text-gray-400 hover:text-red-400 hover:border-red-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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

    {/* Team Member Modal */}
    {teamModal.open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
            <h3 className="text-base font-semibold text-white">
              {teamModal.draft.id ? 'Edit Team Member' : 'Add Team Member'}
            </h3>
            <button onClick={closeTeamModal} className="text-gray-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            {/* Image Picker */}
            <div className="flex flex-col items-center gap-3">
              {teamModal.draft.imageUrl ? (
                <img
                  src={teamModal.draft.imageUrl}
                  alt="Preview"
                  className="h-20 w-20 rounded-full object-cover border-2 border-orange-500"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
                  <Upload className="h-8 w-8" />
                </div>
              )}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImagePick}
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-600 px-3 py-1.5 text-xs text-gray-300 hover:border-orange-500 hover:text-orange-400 transition-colors"
              >
                <Upload className="h-3.5 w-3.5" />
                {teamModal.draft.imageUrl ? 'Change Photo' : 'Upload Photo'}
              </button>
              {teamModal.draft.imageUrl && (
                <button
                  type="button"
                  onClick={() => setTeamModal(prev => ({ ...prev, draft: { ...prev.draft, imageUrl: null } }))}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove photo
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Name <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={teamModal.draft.name}
                onChange={e => setTeamModal(prev => ({ ...prev, draft: { ...prev.draft, name: e.target.value } }))}
                placeholder="e.g. Arjun Mehta"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-200 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Role / Title <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={teamModal.draft.role}
                onChange={e => setTeamModal(prev => ({ ...prev, draft: { ...prev.draft, role: e.target.value } }))}
                placeholder="e.g. Co-Founder & CEO"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-200 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Bio <span className="text-red-400">*</span></label>
              <textarea
                rows={3}
                value={teamModal.draft.bio}
                onChange={e => setTeamModal(prev => ({ ...prev, draft: { ...prev.draft, bio: e.target.value } }))}
                placeholder="Short bio about the team member…"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-200 focus:border-orange-500 focus:outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Display Order</label>
              <input
                type="number"
                min={0}
                value={teamModal.draft.displayOrder}
                onChange={e => setTeamModal(prev => ({ ...prev, draft: { ...prev.draft, displayOrder: Number(e.target.value) } }))}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-200 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-800">
            <button
              onClick={closeTeamModal}
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveMember}
              disabled={teamSaving || !teamModal.draft.name.trim() || !teamModal.draft.role.trim() || !teamModal.draft.bio.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {teamSaving ? 'Saving…' : <><Save className="h-4 w-4" /> Save</>}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
