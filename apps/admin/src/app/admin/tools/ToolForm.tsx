'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, Save, Eye, Loader2, AlertCircle, CheckCircle,
  Globe, Lock, Star, Wrench, ExternalLink, Code2, Clock,
  Type, AlignLeft, Image, Tag, Settings, Search, BarChart2,
} from 'lucide-react';
import { adminFetch } from '@/lib/api';

interface ToolFormData {
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  logoUrl: string;
  bannerUrl: string;
  category: string;
  tags: string;
  status: string;
  visibility: string;
  featured: boolean;
  toolType: string;
  internalRoute: string;
  externalUrl: string;
  customHtml: string;
  customCss: string;
  customJs: string;
  ctaText: string;
  ctaUrl: string;
  pricingType: string;
  seoTitle: string;
  seoDescription: string;
  sortOrder: string;
  screenshots: string;
}

const DEFAULT_FORM: ToolFormData = {
  title: '', slug: '', shortDescription: '', fullDescription: '',
  logoUrl: '', bannerUrl: '', category: '', tags: '',
  status: 'DRAFT', visibility: 'PUBLIC', featured: false,
  toolType: 'INTERNAL_APP', internalRoute: '', externalUrl: '',
  customHtml: '', customCss: '', customJs: '',
  ctaText: 'Launch Tool', ctaUrl: '',
  pricingType: 'FREE', seoTitle: '', seoDescription: '', sortOrder: '0',
  screenshots: '',
};

const GST_INVOICE_PRESET: Partial<ToolFormData> = {
  title: 'GST Invoice Tool',
  slug: 'gst-invoice',
  shortDescription: 'Professional GST billing, invoicing, and compliance. Auto-calculate CGST, SGST, IGST. Generate GSTR-1 and GSTR-3B reports. Built for Indian businesses.',
  category: 'Invoice',
  tags: 'GST, Invoice, Billing, India',
  status: 'PUBLISHED',
  visibility: 'PUBLIC',
  featured: true,
  toolType: 'INTERNAL_APP',
  internalRoute: '/tools/gst-invoice',
  ctaText: 'Launch Tool',
  pricingType: 'FREE',
  seoTitle: 'GST Invoice Tool — Professional GST Billing for Indian Businesses',
  seoDescription: 'Create GST-compliant invoices in 30 seconds. Auto-calculate CGST, SGST, IGST. Generate GSTR-1 and GSTR-3B reports. Built for Indian SMEs.',
  sortOrder: '0',
};

function generateSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
}

interface ToolFormProps {
  initialData?: Partial<ToolFormData>;
  toolId?: string;
  mode: 'create' | 'edit';
}

type TabId = 'basic' | 'branding' | 'config' | 'code' | 'visibility' | 'seo' | 'advanced';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'basic',      label: 'Basic Info',   icon: Type },
  { id: 'branding',   label: 'Branding',     icon: Image },
  { id: 'config',     label: 'Tool Config',  icon: Settings },
  { id: 'code',       label: 'Custom Code',  icon: Code2 },
  { id: 'visibility', label: 'Visibility',   icon: Globe },
  { id: 'seo',        label: 'SEO',          icon: Search },
  { id: 'advanced',   label: 'Advanced',     icon: BarChart2 },
];

export default function ToolForm({ initialData, toolId, mode }: ToolFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ToolFormData>({ ...DEFAULT_FORM, ...initialData });
  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [slugManual, setSlugManual] = useState(!!toolId);
  const [previewTab, setPreviewTab] = useState<'html' | 'css' | 'js' | 'preview'>('html');

  const set = (k: keyof ToolFormData, v: any) => setForm(p => ({ ...p, [k]: v }));

  const loadGstInvoicePreset = () => {
    setForm(p => ({ ...p, ...GST_INVOICE_PRESET }));
    setSlugManual(true);
  };

  const handleTitleChange = (v: string) => {
    set('title', v);
    if (!slugManual) set('slug', generateSlug(v));
  };

  async function handleSubmit(e: { preventDefault: () => void }, publishNow = false) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        ...form,
        screenshots: form.screenshots ? form.screenshots.split('\n').map(u => u.trim()).filter(Boolean) : [],
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        sortOrder: parseInt(form.sortOrder) || 0,
        status: publishNow ? 'PUBLISHED' : form.status,
      };

      if (mode === 'create') {
        const res = await adminFetch<{ data: { id: string } }>('/admin/tools', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSuccess('Tool created successfully!');
        setTimeout(() => router.push(`/admin/tools/${res.data.id}/edit`), 1000);
      } else {
        await adminFetch(`/admin/tools/${toolId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setSuccess('Tool saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (e: any) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors';
  const labelClass = 'block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5';

  const showCodeTab = form.toolType === 'CUSTOM_HTML_TOOL';

  const visibleTabs = TABS.filter(t => t.id !== 'code' || showCodeTab);

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/tools"
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">
              {mode === 'create' ? 'Create New Tool' : `Edit: ${form.title || 'Untitled'}`}
            </h1>
            <p className="text-sm text-gray-500">
              {mode === 'create' ? 'Add a new tool to the CMS' : `/tools/${form.slug}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mode === 'create' && (
            <button
              type="button"
              onClick={loadGstInvoicePreset}
              className="flex items-center gap-2 rounded-xl border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-400 hover:bg-orange-500/20 transition-colors"
            >
              <Wrench className="h-4 w-4" />
              Load GST Invoice Default
            </button>
          )}
          {toolId && (
            <Link
              href={`/admin/tools/${toolId}/preview`}
              className="flex items-center gap-2 rounded-xl border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Link>
          )}
          <button
            type="submit"
            form="tool-form"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {mode === 'create' ? 'Create Tool' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-red-900/30 border border-red-800 px-4 py-3 mb-4 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 rounded-xl bg-green-900/30 border border-green-800 px-4 py-3 mb-4 text-sm text-green-400">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          {success}
        </div>
      )}

      <form id="tool-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
          {/* Sidebar Tabs */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-2 h-fit sticky top-6">
            {visibleTabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left ${
                  activeTab === tab.id ? 'bg-orange-500/20 text-orange-400' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
              >
                <tab.icon className="h-4 w-4 flex-shrink-0" />
                {tab.label}
              </button>
            ))}

            {/* Quick Toggles */}
            <div className="mt-4 pt-4 border-t border-gray-800 space-y-3 px-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Published</span>
                <button
                  type="button"
                  onClick={() => set('status', form.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED')}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    form.status === 'PUBLISHED' ? 'bg-emerald-500' : 'bg-gray-700'
                  }`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    form.status === 'PUBLISHED' ? 'translate-x-4.5' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Featured</span>
                <button
                  type="button"
                  onClick={() => set('featured', !form.featured)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    form.featured ? 'bg-yellow-500' : 'bg-gray-700'
                  }`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    form.featured ? 'translate-x-4.5' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Public</span>
                <button
                  type="button"
                  onClick={() => set('visibility', form.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC')}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    form.visibility === 'PUBLIC' ? 'bg-blue-500' : 'bg-gray-700'
                  }`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    form.visibility === 'PUBLIC' ? 'translate-x-4.5' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">

            {/* ─── BASIC INFO ─── */}
            {activeTab === 'basic' && (
              <div className="space-y-5">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Type className="h-4 w-4 text-orange-400" /> Basic Information
                </h2>
                <div>
                  <label className={labelClass}>Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GST Invoice Tool"
                    value={form.title}
                    onChange={e => handleTitleChange(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Slug (URL-friendly ID)</label>
                  <div className="flex gap-2">
                    <span className="flex items-center px-3 rounded-l-lg bg-gray-700 border border-gray-600 border-r-0 text-gray-400 text-sm">/tools/</span>
                    <input
                      type="text"
                      placeholder="gst-invoice-tool"
                      value={form.slug}
                      onChange={e => { setSlugManual(true); set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-')); }}
                      className={`${inputClass} rounded-l-none flex-1`}
                    />
                  </div>
                  {!slugManual && (
                    <p className="text-xs text-gray-600 mt-1">Auto-generated from title. Edit to customize.</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Short Description</label>
                  <textarea
                    rows={2}
                    placeholder="Brief description shown in cards and listings..."
                    value={form.shortDescription}
                    onChange={e => set('shortDescription', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Full Description</label>
                  <textarea
                    rows={6}
                    placeholder="Detailed description, features, use-cases..."
                    value={form.fullDescription}
                    onChange={e => set('fullDescription', e.target.value)}
                    className={`${inputClass} resize-y`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Invoicing, HR, CRM"
                      value={form.category}
                      onChange={e => set('category', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Tags (comma separated)</label>
                    <input
                      type="text"
                      placeholder="gst, invoice, billing"
                      value={form.tags}
                      onChange={e => set('tags', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>CTA Button Text</label>
                    <input
                      type="text"
                      placeholder="Launch Tool"
                      value={form.ctaText}
                      onChange={e => set('ctaText', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>CTA Button URL</label>
                    <input
                      type="text"
                      placeholder="/tools/gst-invoice or https://..."
                      value={form.ctaUrl}
                      onChange={e => set('ctaUrl', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ─── BRANDING ─── */}
            {activeTab === 'branding' && (
              <div className="space-y-5">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Image className="h-4 w-4 text-orange-400" /> Branding & Media
                </h2>
                <div>
                  <label className={labelClass}>Logo URL</label>
                  <input
                    type="url"
                    placeholder="https://cdn.yantrixlab.com/tools/gst-logo.png"
                    value={form.logoUrl}
                    onChange={e => set('logoUrl', e.target.value)}
                    className={inputClass}
                  />
                  {form.logoUrl && (
                    <div className="mt-2 inline-flex">
                      <img src={form.logoUrl} alt="Logo" className="h-12 w-12 rounded-xl object-cover border border-gray-700" />
                    </div>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Banner / Cover Image URL</label>
                  <input
                    type="url"
                    placeholder="https://cdn.yantrixlab.com/tools/gst-banner.jpg"
                    value={form.bannerUrl}
                    onChange={e => set('bannerUrl', e.target.value)}
                    className={inputClass}
                  />
                  {form.bannerUrl && (
                    <div className="mt-2">
                      <img src={form.bannerUrl} alt="Banner" className="rounded-xl object-cover border border-gray-700 max-h-40 w-full" />
                    </div>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Screenshot URLs (one per line)</label>
                  <textarea
                    rows={4}
                    placeholder="https://cdn.example.com/screenshot1.jpg&#10;https://cdn.example.com/screenshot2.jpg"
                    value={form.screenshots}
                    onChange={e => set('screenshots', e.target.value)}
                    className={`${inputClass} resize-y`}
                  />
                  <p className="text-xs text-gray-600 mt-1">Enter one URL per line</p>
                </div>
              </div>
            )}

            {/* ─── TOOL CONFIG ─── */}
            {activeTab === 'config' && (
              <div className="space-y-5">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Settings className="h-4 w-4 text-orange-400" /> Tool Configuration
                </h2>
                <div>
                  <label className={labelClass}>Tool Type *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'INTERNAL_APP',    label: 'Internal App',    icon: Wrench,       desc: 'Renders a route within this app' },
                      { value: 'CUSTOM_HTML_TOOL', label: 'HTML Tool',       icon: Code2,        desc: 'Custom HTML/CSS/JS page' },
                      { value: 'EXTERNAL_URL',    label: 'External URL',    icon: ExternalLink, desc: 'Redirect to external site' },
                      { value: 'COMING_SOON',     label: 'Coming Soon',     icon: Clock,        desc: 'Lead capture page' },
                    ].map(t => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => set('toolType', t.value)}
                        className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                          form.toolType === t.value
                            ? 'border-orange-500 bg-orange-500/10 text-white'
                            : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        <t.icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{t.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {form.toolType === 'INTERNAL_APP' && (
                  <div>
                    <label className={labelClass}>Internal Route</label>
                    <input
                      type="text"
                      placeholder="/tools/gst-invoice"
                      value={form.internalRoute}
                      onChange={e => set('internalRoute', e.target.value)}
                      className={inputClass}
                    />
                    <p className="text-xs text-gray-600 mt-1">The Next.js route this tool renders at</p>
                  </div>
                )}

                {form.toolType === 'EXTERNAL_URL' && (
                  <div>
                    <label className={labelClass}>External URL</label>
                    <input
                      type="url"
                      placeholder="https://hotel.yantrixlab.com"
                      value={form.externalUrl}
                      onChange={e => set('externalUrl', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                )}

                <div>
                  <label className={labelClass}>Pricing Type</label>
                  <div className="flex gap-3">
                    {['FREE', 'PAID', 'CUSTOM'].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => set('pricingType', p)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                          form.pricingType === p
                            ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                            : 'border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─── CUSTOM CODE ─── */}
            {activeTab === 'code' && showCodeTab && (
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-orange-400" /> Custom Code Editor
                </h2>
                <div className="bg-amber-900/20 border border-amber-800/50 rounded-xl px-4 py-3 text-sm text-amber-400">
                  ⚠️ Custom code is rendered inside a sandboxed iframe. Keep scripts safe and avoid accessing parent window.
                </div>
                {/* Code editor tabs */}
                <div className="flex gap-1 bg-gray-800 rounded-lg p-1 w-fit">
                  {(['html', 'css', 'js', 'preview'] as const).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setPreviewTab(tab)}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        previewTab === tab ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {tab.toUpperCase()}
                    </button>
                  ))}
                </div>
                {previewTab === 'html' && (
                  <textarea
                    rows={20}
                    placeholder="<div class='container'>&#10;  <h1>My Tool</h1>&#10;</div>"
                    value={form.customHtml}
                    onChange={e => set('customHtml', e.target.value)}
                    className={`${inputClass} font-mono text-xs resize-y`}
                  />
                )}
                {previewTab === 'css' && (
                  <textarea
                    rows={20}
                    placeholder=".container { padding: 20px; }"
                    value={form.customCss}
                    onChange={e => set('customCss', e.target.value)}
                    className={`${inputClass} font-mono text-xs resize-y`}
                  />
                )}
                {previewTab === 'js' && (
                  <textarea
                    rows={20}
                    placeholder="// Your JavaScript here&#10;document.querySelector('h1').textContent = 'Hello!';"
                    value={form.customJs}
                    onChange={e => set('customJs', e.target.value)}
                    className={`${inputClass} font-mono text-xs resize-y`}
                  />
                )}
                {previewTab === 'preview' && (
                  <div className="rounded-xl border border-gray-700 overflow-hidden">
                    <div className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 border-b border-gray-700">
                      <div className="h-3 w-3 rounded-full bg-red-500/60" />
                      <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                      <div className="h-3 w-3 rounded-full bg-green-500/60" />
                      <span className="ml-2 text-xs text-gray-500">Sandboxed Preview</span>
                    </div>
                    <iframe
                      sandbox="allow-scripts"
                      className="w-full h-[500px] bg-white"
                      srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>${form.customCss}</style></head><body>${form.customHtml}<script>${form.customJs}<\/script></body></html>`}
                      title="Tool Preview"
                    />
                  </div>
                )}
              </div>
            )}

            {/* ─── VISIBILITY ─── */}
            {activeTab === 'visibility' && (
              <div className="space-y-5">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Globe className="h-4 w-4 text-orange-400" /> Visibility & Status
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {/* Status */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-700 bg-gray-800/50">
                    <div>
                      <p className="text-sm font-medium text-white">Publication Status</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {form.status === 'PUBLISHED' ? 'This tool is live and visible to users.' : 'This tool is a draft and not visible publicly.'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {['DRAFT', 'PUBLISHED'].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => set('status', s)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            form.status === s
                              ? s === 'PUBLISHED' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Visibility */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-700 bg-gray-800/50">
                    <div>
                      <p className="text-sm font-medium text-white">Visibility</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {form.visibility === 'PUBLIC' ? 'Appears in public tools listing.' : 'Hidden from public. Admin access only.'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {['PUBLIC', 'PRIVATE'].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => set('visibility', v)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            form.visibility === v
                              ? v === 'PUBLIC' ? 'bg-blue-500 text-white' : 'bg-gray-600 text-white'
                              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                          }`}
                        >
                          {v === 'PUBLIC' ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Featured */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-700 bg-gray-800/50">
                    <div>
                      <p className="text-sm font-medium text-white">Featured Tool</p>
                      <p className="text-xs text-gray-500 mt-0.5">Featured tools appear in the highlighted section on the tools page.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => set('featured', !form.featured)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        form.featured ? 'bg-yellow-500 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      <Star className={`h-3.5 w-3.5 ${form.featured ? 'fill-current' : ''}`} />
                      {form.featured ? 'Featured' : 'Not Featured'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ─── SEO ─── */}
            {activeTab === 'seo' && (
              <div className="space-y-5">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Search className="h-4 w-4 text-orange-400" /> SEO Settings
                </h2>
                <div>
                  <label className={labelClass}>SEO Title</label>
                  <input
                    type="text"
                    placeholder="GST Invoice Tool - Free Online GST Billing | Yantrix Labs"
                    value={form.seoTitle}
                    onChange={e => set('seoTitle', e.target.value)}
                    className={inputClass}
                    maxLength={60}
                  />
                  <p className="text-xs text-gray-600 mt-1">{form.seoTitle.length}/60 characters</p>
                </div>
                <div>
                  <label className={labelClass}>Meta Description</label>
                  <textarea
                    rows={3}
                    placeholder="Create GST-compliant invoices in seconds. Automate CGST, SGST, IGST calculations..."
                    value={form.seoDescription}
                    onChange={e => set('seoDescription', e.target.value)}
                    className={inputClass}
                    maxLength={160}
                  />
                  <p className="text-xs text-gray-600 mt-1">{form.seoDescription.length}/160 characters</p>
                </div>
                {/* SEO Preview */}
                <div className="rounded-xl border border-gray-700 p-4 bg-gray-800/30">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Google Preview</p>
                  <p className="text-blue-400 text-sm font-medium">{form.seoTitle || form.title || 'Tool Title'}</p>
                  <p className="text-green-600 text-xs mt-0.5">yantrixlab.com/tools/{form.slug || 'tool-slug'}</p>
                  <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                    {form.seoDescription || form.shortDescription || 'Tool description will appear here...'}
                  </p>
                </div>
              </div>
            )}

            {/* ─── ADVANCED ─── */}
            {activeTab === 'advanced' && (
              <div className="space-y-5">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-orange-400" /> Advanced Settings
                </h2>
                <div>
                  <label className={labelClass}>Sort Order</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.sortOrder}
                    onChange={e => set('sortOrder', e.target.value)}
                    className={`${inputClass} w-32`}
                    min={0}
                  />
                  <p className="text-xs text-gray-600 mt-1">Lower numbers appear first. Default is 0.</p>
                </div>
              </div>
            )}

            {/* Bottom action bar */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-800">
              <Link
                href="/admin/tools"
                className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
              >
                ← Back to Tools
              </Link>
              <div className="flex gap-3">
                {form.status === 'DRAFT' && (
                  <button
                    type="button"
                    onClick={e => handleSubmit(e as any, true)}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl border border-emerald-700 bg-emerald-900/30 px-4 py-2 text-sm font-semibold text-emerald-400 hover:bg-emerald-900/50 disabled:opacity-50 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Save & Publish
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {mode === 'create' ? 'Create Tool' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
