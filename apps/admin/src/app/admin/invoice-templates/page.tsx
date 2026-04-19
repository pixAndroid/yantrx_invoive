'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Eye, Save, X, Check, FileCode2, RefreshCw, AlertCircle } from 'lucide-react';
import { adminFetch, API_URL, getAdminToken } from '@/lib/api';

interface InvoiceTemplate {
  id: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  html: string;
  css: string | null;
  thumbnail: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .business-name { font-size: 24px; font-weight: bold; color: #4f46e5; }
    .invoice-title { font-size: 28px; font-weight: bold; text-align: right; }
    .section { margin: 20px 0; }
    .label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    thead { background: #f9fafb; }
    th { padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; }
    td { padding: 12px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
    .total-row { font-weight: bold; font-size: 16px; }
    .footer { margin-top: 40px; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="business-name">{{businessName}}</div>
      <div>GSTIN: {{businessGstin}}</div>
      <div>{{businessAddress}}</div>
    </div>
    <div>
      <div class="invoice-title">{{invoiceType}}</div>
      <div>{{invoiceNumber}}</div>
      <div>Date: {{issueDate}}</div>
      <div>Due: {{dueDate}}</div>
    </div>
  </div>
  <div class="section">
    <div class="label">Bill To</div>
    <div><strong>{{customerName}}</strong></div>
    <div>GSTIN: {{customerGstin}}</div>
    <div>{{customerAddress}}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th><th>Description</th><th>HSN/SAC</th>
        <th align="right">Qty</th><th align="right">Rate</th>
        <th align="right">GST</th><th align="right">Amount</th>
      </tr>
    </thead>
    <tbody>{{#items}}
      <tr>
        <td>{{index}}</td><td>{{description}}</td><td>{{hsnSac}}</td>
        <td align="right">{{quantity}} {{unit}}</td>
        <td align="right">₹{{price}}</td>
        <td align="right">{{gstRate}}%</td>
        <td align="right">₹{{total}}</td>
      </tr>
    {{/items}}</tbody>
  </table>
  <div style="display:flex;justify-content:flex-end;">
    <div style="min-width:260px;">
      <div style="display:flex;justify-content:space-between;margin:4px 0;font-size:14px;">
        <span>Taxable Amount</span><span>₹{{taxableAmount}}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin:4px 0;font-size:14px;">
        <span>CGST</span><span>₹{{cgst}}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin:4px 0;font-size:14px;">
        <span>SGST</span><span>₹{{sgst}}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin:8px 0;font-size:16px;font-weight:bold;border-top:2px solid #e5e7eb;padding-top:8px;">
        <span>Total</span><span>₹{{total}}</span>
      </div>
    </div>
  </div>
  <div class="footer">
    <p>Notes: {{notes}}</p>
    <p>Terms: {{terms}}</p>
  </div>
</body>
</html>`;

function TemplateModal({
  template,
  onClose,
  onSaved,
}: {
  template: InvoiceTemplate | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!template;
  const [form, setForm] = useState({
    name: template?.name || '',
    isDefault: template?.isDefault || false,
    html: template?.html || DEFAULT_HTML,
    css: template?.css || '',
    sortOrder: template?.sortOrder || 0,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'html' | 'css' | 'preview'>('info');
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name) { setErr('Name is required'); return; }
    if (!form.html) { setErr('HTML content is required'); return; }
    setSaving(true); setErr('');
    try {
      const token = getAdminToken();
      const url = isEdit
        ? `${API_URL}/admin/invoice-templates/${template!.id}`
        : `${API_URL}/admin/invoice-templates`;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) { setErr(data.error || 'Failed to save'); return; }
      onSaved(); onClose();
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-gray-900 border border-gray-700 rounded-2xl shadow-xl z-10 my-4">
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <FileCode2 className="h-4 w-4 text-orange-400" />
            {isEdit ? 'Edit Template' : 'New Invoice Template'}
          </h3>
          <button onClick={onClose}><X className="h-4 w-4 text-gray-400" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {(['info', 'html', 'css', 'preview'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400 hover:text-gray-200'}`}>
              {tab === 'html' ? 'HTML Editor' : tab === 'css' ? 'CSS Editor' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="p-5">
          {err && <p className="text-xs text-red-400 mb-3 bg-red-900/20 border border-red-800 rounded px-3 py-2">{err}</p>}

          {activeTab === 'info' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Template Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="e.g. Modern Invoice"
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Sort Order</label>
                <input type="number" value={form.sortOrder} onChange={e => set('sortOrder', parseInt(e.target.value) || 0)}
                  className="w-32 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isDefault} onChange={e => set('isDefault', e.target.checked)}
                  className="rounded border-gray-600 bg-gray-700 text-orange-500" />
                <span className="text-sm text-gray-300">Set as default template for all customers</span>
              </label>
              <div className="rounded-lg bg-gray-800 border border-gray-700 p-3 text-xs text-gray-400">
                <p className="font-medium text-gray-300 mb-1">Available Template Variables:</p>
                <div className="grid grid-cols-3 gap-1 font-mono">
                  {['{{businessName}}','{{businessGstin}}','{{businessAddress}}','{{invoiceNumber}}','{{invoiceType}}','{{issueDate}}','{{dueDate}}','{{customerName}}','{{customerGstin}}','{{customerAddress}}','{{taxableAmount}}','{{cgst}}','{{sgst}}','{{igst}}','{{total}}','{{notes}}','{{terms}}'].map(v => (
                    <span key={v} className="text-orange-400">{v}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'html' && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Edit the HTML template. Use template variables like {'{{businessName}}'} etc.</p>
              <textarea value={form.html} onChange={e => set('html', e.target.value)} rows={24}
                spellCheck={false}
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-xs text-green-400 font-mono focus:border-orange-500 focus:outline-none resize-none" />
            </div>
          )}

          {activeTab === 'css' && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Additional CSS overrides (optional). This is injected into the {'<style>'} tag.</p>
              <textarea value={form.css} onChange={e => set('css', e.target.value)} rows={24}
                spellCheck={false}
                placeholder="/* Custom CSS overrides */"
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-xs text-blue-300 font-mono focus:border-orange-500 focus:outline-none resize-none" />
            </div>
          )}

          {activeTab === 'preview' && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Preview (template variables shown as placeholders)</p>
              <div className="rounded-lg border border-gray-700 bg-white overflow-hidden" style={{ height: '480px' }}>
                <iframe
                  srcDoc={form.html}
                  className="w-full h-full"
                  title="Template Preview"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 p-5 border-t border-gray-700">
          <button onClick={onClose} className="flex-1 rounded-lg border border-gray-700 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 rounded-lg bg-orange-500 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : <Check className="h-4 w-4" />}
            {isEdit ? 'Save Changes' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InvoiceTemplatesPage() {
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTemplate, setEditTemplate] = useState<InvoiceTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<InvoiceTemplate | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await adminFetch<{ data: InvoiceTemplate[] }>('/admin/invoice-templates');
      setTemplates(res.data);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    setDeleting(id);
    try {
      const token = getAdminToken();
      const res = await fetch(`${API_URL}/admin/invoice-templates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setTemplates(prev => prev.filter(t => t.id !== id));
    } catch {} finally { setDeleting(null); }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const token = getAdminToken();
      await fetch(`${API_URL}/admin/invoice-templates/${id}/set-default`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTemplates();
    } catch {}
  };

  return (
    <>
      {(showModal || editTemplate) && (
        <TemplateModal
          template={editTemplate}
          onClose={() => { setShowModal(false); setEditTemplate(null); }}
          onSaved={fetchTemplates}
        />
      )}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setPreviewTemplate(null)} />
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl z-10 overflow-hidden" style={{ height: '80vh' }}>
            <div className="flex items-center justify-between px-4 py-3 bg-gray-100 border-b">
              <span className="text-sm font-medium text-gray-700">{previewTemplate.name} — Preview</span>
              <button onClick={() => setPreviewTemplate(null)}><X className="h-4 w-4 text-gray-500" /></button>
            </div>
            <iframe srcDoc={previewTemplate.html} className="w-full h-full" title="Preview" sandbox="allow-same-origin" />
          </div>
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Invoice Templates</h1>
            <p className="text-gray-400 mt-1">Manage HTML templates used for invoice generation</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchTemplates} className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button onClick={() => { setEditTemplate(null); setShowModal(true); }}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600">
              <Plus className="h-4 w-4" /> New Template
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        {loading ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-48 rounded-2xl bg-gray-800 animate-pulse" />)}
          </div>
        ) : templates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-700 bg-gray-900 p-12 text-center">
            <FileCode2 className="h-12 w-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 font-medium mb-2">No templates yet</p>
            <p className="text-gray-600 text-sm mb-4">Create your first invoice template to get started</p>
            <button onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
              <Plus className="h-4 w-4" /> Create Template
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {templates.map(tmpl => (
              <div key={tmpl.id} className="rounded-2xl border border-gray-700 bg-gray-900 p-5 hover:border-gray-600 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">{tmpl.name}</h3>
                      {tmpl.isDefault && (
                        <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded-full">Default</span>
                      )}
                      {!tmpl.isActive && (
                        <span className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded-full">Inactive</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{tmpl.slug}</p>
                  </div>
                </div>
                {tmpl.description && <p className="text-xs text-gray-400 mb-3 line-clamp-2">{tmpl.description}</p>}
                <div className="rounded-lg overflow-hidden border border-gray-700 bg-white mb-3" style={{ height: '120px' }}>
                  <iframe srcDoc={tmpl.html} className="w-full h-full" title={tmpl.name} sandbox="allow-same-origin" style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%', height: '200%', pointerEvents: 'none' }} />
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPreviewTemplate(tmpl)}
                    className="flex-1 rounded-lg border border-gray-700 py-1.5 text-xs font-medium text-gray-400 hover:bg-gray-800 hover:text-gray-200 flex items-center justify-center gap-1">
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </button>
                  <button onClick={() => setEditTemplate(tmpl)}
                    className="flex-1 rounded-lg border border-gray-700 py-1.5 text-xs font-medium text-gray-400 hover:bg-gray-800 hover:text-orange-400 flex items-center justify-center gap-1">
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </button>
                  {!tmpl.isDefault && (
                    <button onClick={() => handleSetDefault(tmpl.id)}
                      title="Set as default"
                      className="rounded-lg border border-gray-700 p-1.5 text-gray-400 hover:bg-gray-800 hover:text-green-400">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(tmpl.id)} disabled={deleting === tmpl.id}
                    className="rounded-lg border border-gray-700 p-1.5 text-gray-400 hover:bg-gray-800 hover:text-red-400 disabled:opacity-50">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
