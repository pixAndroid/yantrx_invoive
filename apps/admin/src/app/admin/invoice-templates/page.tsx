'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, X, Check, FileCode2, RefreshCw, AlertCircle, Lock } from 'lucide-react';
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

// ─── Built-in Template ────────────────────────────────────────────────────────

// Double-underscore prefix/suffix marks this as a system identifier that can
// never collide with a database-generated cuid() value.
const BUILTIN_TEMPLATE_ID = '__builtin_yantrx_classic__';

const BUILTIN_TEMPLATE_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice {{invoiceNumber}}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, 'Helvetica Neue', sans-serif; color: #1f2937; background: #fff; font-size: 13px; line-height: 1.5; }

    .inv-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 28px 36px 20px; }
    .logo-area { display: flex; align-items: center; gap: 14px; }
    .logo-box { width: 52px; height: 52px; border-radius: 8px; border: 1.5px solid #e0e7ef; background: #f8fafc; display: flex; align-items: center; justify-content: center; overflow: hidden; font-size: 20px; font-weight: 700; color: #1e3a8a; }
    .logo-box img { width: 100%; height: 100%; object-fit: contain; }
    .biz-name { font-size: 20px; font-weight: 700; color: #111827; }
    .inv-right { text-align: right; }
    .inv-title { font-size: 32px; font-weight: 800; color: #1e3a8a; letter-spacing: 2px; line-height: 1; }
    .inv-number { font-size: 14px; font-weight: 600; color: #374151; margin-top: 6px; }
    .inv-date { font-size: 12px; color: #6b7280; margin-top: 8px; }
    .inv-date strong { color: #374151; }

    hr { border: none; border-top: 1.5px solid #e8eef5; margin: 0 36px; }

    .addr-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; border: 1px solid #e5e7eb; border-radius: 8px; margin: 20px 36px; overflow: hidden; }
    .addr-cell { padding: 14px 18px; background: #f9fafb; border-right: 1px solid #e5e7eb; }
    .addr-cell:last-child { border-right: none; }
    .addr-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #1e3a8a; margin-bottom: 8px; }
    .addr-name { font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 2px; }
    .addr-line { font-size: 12px; color: #4b5563; }

    table { width: 100%; border-collapse: collapse; }
    .tbl-wrap { margin: 0 36px; }
    thead tr { background: #dbeafe; }
    th { padding: 9px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #1e3a8a; text-align: left; }
    th:nth-child(4), th:nth-child(5), th:nth-child(6), th:nth-child(7) { text-align: right; }
    td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; font-size: 13px; color: #374151; text-align: left; }
    td:nth-child(4), td:nth-child(5), td:nth-child(6), td:nth-child(7) { text-align: right; }
    td:first-child { color: #9ca3af; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    .amt-col { font-weight: 600; color: #111827; }

    .totals-section { display: flex; justify-content: space-between; align-items: flex-start; padding: 20px 36px; gap: 24px; border-top: 1px solid #f3f4f6; margin-top: 4px; }
    .words-side { flex: 1; }
    .words-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 6px; }
    .words-val { font-size: 13px; font-weight: 700; color: #1e3a8a; line-height: 1.6; }
    .totals-card { width: 260px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    .t-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 16px; border-bottom: 1px solid #f3f4f6; }
    .t-lbl { font-size: 12px; color: #6b7280; }
    .t-val { font-size: 12px; font-weight: 500; color: #374151; }
    .gt-row { display: flex; justify-content: space-between; align-items: center; padding: 13px 16px; background: #1e3a8a; }
    .gt-lbl { font-size: 13px; font-weight: 700; color: #fff; }
    .gt-val { font-size: 18px; font-weight: 800; color: #fff; }

    .footer-notes { display: flex; gap: 36px; padding: 16px 36px 12px; border-top: 1px solid #f3f4f6; }
    .fn-col { flex: 1; }
    .fn-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #1e3a8a; margin-bottom: 5px; }
    .fn-text { font-size: 12px; color: #4b5563; line-height: 1.6; }

    .final-row { display: flex; justify-content: space-between; align-items: flex-end; padding: 18px 36px 28px; border-top: 1.5px solid #e5e7eb; margin-top: 8px; }
    .ty-text { font-size: 13px; font-weight: 700; color: #1e3a8a; }
    .sig-area { text-align: right; }
    .sig-line { width: 130px; border-top: 1.5px solid #1e3a8a; margin: 0 0 8px auto; }
    .sig-name { font-size: 12px; font-weight: 700; color: #374151; }
    .sig-role { font-size: 11px; color: #9ca3af; margin-top: 2px; }
  </style>
</head>
<body>

  <div class="inv-header">
    <div class="logo-area">
      <div class="logo-box">
        <img src="{{businessLogo}}" alt="{{businessInitial}}" />
      </div>
      <div class="biz-name">{{businessName}}</div>
    </div>
    <div class="inv-right">
      <div class="inv-title">INVOICE</div>
      <div class="inv-number">{{invoiceNumber}}</div>
      <div class="inv-date">Issue Date &nbsp;<strong>{{issueDate}}</strong></div>
    </div>
  </div>

  <hr />

  <div class="addr-grid">
    <div class="addr-cell">
      <div class="addr-lbl">Bill To</div>
      <div class="addr-name">{{customerName}}</div>
      <div class="addr-line">{{customerEmail}}</div>
      <div class="addr-line">{{customerPhone}}</div>
      <div class="addr-line">{{customerAddress}}</div>
      <div class="addr-line">{{customerCity}}, {{customerState}} – {{customerPincode}}</div>
    </div>
    <div class="addr-cell">
      <div class="addr-lbl">Ship To</div>
      <div class="addr-line">{{shipAddress}}</div>
      <div class="addr-line">{{shipCity}}, {{shipState}} – {{shipPincode}}</div>
    </div>
    <div class="addr-cell">
      <div class="addr-lbl">Supply Details</div>
      <div class="addr-line">{{placeOfSupply}}</div>
      <div class="addr-line">{{taxType}}</div>
    </div>
  </div>

  <div class="tbl-wrap">
    <table>
      <thead>
        <tr>
          <th style="width:32px">#</th>
          <th>Description</th>
          <th>HSN/SAC</th>
          <th>QTY</th>
          <th>Rate</th>
          <th>GST%</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>{{#items}}
        <tr>
          <td>{{index}}</td>
          <td>{{description}}</td>
          <td>{{hsnSac}}</td>
          <td>{{quantity}} {{unit}}</td>
          <td>₹{{price}}</td>
          <td>{{gstRate}}%</td>
          <td class="amt-col">₹{{total}}</td>
        </tr>
      {{/items}}</tbody>
    </table>
  </div>

  <div class="totals-section">
    <div class="words-side">
      <div class="words-lbl">Amount in Words</div>
      <div class="words-val">{{amountInWords}}</div>
    </div>
    <div class="totals-card">
      <div class="t-row"><span class="t-lbl">Taxable Amount</span><span class="t-val">₹{{taxableAmount}}</span></div>
      <div class="t-row"><span class="t-lbl">CGST</span><span class="t-val">₹{{cgst}}</span></div>
      <div class="t-row"><span class="t-lbl">SGST</span><span class="t-val">₹{{sgst}}</span></div>
      <div class="t-row"><span class="t-lbl">IGST</span><span class="t-val">₹{{igst}}</span></div>
      <div class="gt-row"><span class="gt-lbl">Grand Total</span><span class="gt-val">₹{{total}}</span></div>
    </div>
  </div>

  <div class="footer-notes">
    <div class="fn-col">
      <div class="fn-lbl">Notes</div>
      <div class="fn-text">{{notes}}</div>
    </div>
    <div class="fn-col">
      <div class="fn-lbl">Terms &amp; Conditions</div>
      <div class="fn-text">{{terms}}</div>
    </div>
  </div>

  <div class="final-row">
    <div class="ty-text">Thank you for your business!</div>
    <div class="sig-area">
      <div class="sig-line"></div>
      <div class="sig-name">{{businessName}}</div>
      <div class="sig-role">Authorized Signatory</div>
    </div>
  </div>

</body>
</html>`;

const BUILTIN_TEMPLATE: InvoiceTemplate = {
  id: BUILTIN_TEMPLATE_ID,
  name: 'Yantrx Classic',
  isDefault: true,
  isActive: true,
  html: BUILTIN_TEMPLATE_HTML,
  css: null,
  thumbnail: null,
  sortOrder: -1,
  createdAt: 'built-in',
  updatedAt: 'built-in',
};

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice {{invoiceNumber}}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; background: #fff; font-size: 13px; }

    /* ── HEADER ─────────────────────────────────────────── */
    .invoice-header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: #fff;
      padding: 32px 40px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .business-logo {
      width: 56px; height: 56px; border-radius: 10px;
      background: rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; font-weight: 700; margin-bottom: 10px;
      overflow: hidden;
    }
    .business-logo img {
      width: 100%; height: 100%; object-fit: contain; border-radius: 10px;
    }
    .business-name { font-size: 22px; font-weight: 700; }
    .business-meta { font-size: 12px; color: rgba(255,255,255,0.8); margin-top: 2px; }
    .invoice-badge { text-align: right; }
    .invoice-type {
      font-size: 30px; font-weight: 800; letter-spacing: 1px;
      text-transform: uppercase;
    }
    .invoice-number { font-size: 14px; color: rgba(255,255,255,0.85); margin-top: 4px; }
    .invoice-dates { font-size: 12px; color: rgba(255,255,255,0.75); margin-top: 4px; line-height: 1.7; }

    /* ── BODY ────────────────────────────────────────────── */
    .invoice-body { padding: 32px 40px; }

    .parties { display: flex; gap: 40px; margin-bottom: 28px; }
    .party { flex: 1; }
    .party-label {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.8px; color: #6b7280; margin-bottom: 6px;
    }
    .party-name { font-size: 15px; font-weight: 700; color: #111827; }
    .party-meta { font-size: 12px; color: #6b7280; margin-top: 3px; line-height: 1.6; }
    .gstin-badge {
      display: inline-block; font-size: 11px; font-family: monospace;
      background: #f3f4f6; border: 1px solid #e5e7eb;
      border-radius: 4px; padding: 2px 6px; margin-top: 4px; color: #374151;
    }

    .supply-info {
      background: #f9fafb; border: 1px solid #e5e7eb;
      border-radius: 8px; padding: 10px 16px;
      margin-bottom: 24px; font-size: 12px; color: #6b7280;
      display: flex; gap: 32px;
    }
    .supply-info span { font-weight: 600; color: #374151; }

    /* Items table */
    table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
    thead { background: #4f46e5; color: #fff; }
    th {
      padding: 10px 12px; text-align: left;
      font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
    }
    th:last-child, td:last-child { text-align: right; }
    th:nth-child(4), th:nth-child(5), th:nth-child(6),
    td:nth-child(4), td:nth-child(5), td:nth-child(6) { text-align: right; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    tbody tr:hover { background: #eff6ff; }
    td { padding: 11px 12px; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
    td:first-child { color: #9ca3af; }
    .item-desc { font-weight: 500; color: #111827; }
    .item-hsn { font-size: 11px; color: #9ca3af; font-family: monospace; }
    .amount-col { font-weight: 600; color: #111827; }

    /* Totals + Amount in Words */
    .totals-section {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-top: 20px; gap: 24px;
    }
    .amount-in-words {
      flex: 1; background: #eff6ff; border: 1px solid #c7d2fe;
      border-radius: 8px; padding: 14px 16px;
    }
    .amount-in-words .label {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.8px; color: #6366f1; margin-bottom: 6px;
    }
    .amount-in-words .words {
      font-size: 13px; font-weight: 600; color: #1e1b4b;
      font-style: italic; line-height: 1.5;
    }
    .totals-box { min-width: 260px; }
    .totals-row {
      display: flex; justify-content: space-between;
      padding: 5px 0; font-size: 13px; border-bottom: 1px solid #f3f4f6;
    }
    .totals-row .lbl { color: #6b7280; }
    .totals-row .val { font-weight: 500; color: #111827; }
    .totals-grand {
      display: flex; justify-content: space-between;
      padding: 10px 0 4px; font-size: 16px; font-weight: 700;
      border-top: 2px solid #4f46e5; margin-top: 4px;
    }
    .totals-grand .lbl { color: #111827; }
    .totals-grand .val { color: #4f46e5; }
    .totals-balance {
      display: flex; justify-content: space-between;
      padding: 4px 0; font-size: 13px; font-weight: 600;
    }
    .totals-balance .lbl { color: #dc2626; }
    .totals-balance .val { color: #dc2626; }

    /* ── FOOTER ──────────────────────────────────────────── */
    .invoice-footer {
      border-top: 2px solid #e5e7eb; margin-top: 32px;
      padding: 24px 40px;
      display: flex; justify-content: space-between; gap: 32px;
    }
    .footer-col { flex: 1; }
    .footer-label {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.8px; color: #6b7280; margin-bottom: 6px;
    }
    .footer-text { font-size: 12px; color: #4b5563; line-height: 1.7; }
    .footer-bottom {
      background: #f9fafb; border-top: 1px solid #e5e7eb;
      padding: 12px 40px; text-align: center;
      font-size: 11px; color: #9ca3af;
    }
    .seal-area {
      border: 1px dashed #d1d5db; border-radius: 8px;
      min-height: 70px; padding: 10px; text-align: center;
      color: #d1d5db; font-size: 11px;
    }
  </style>
</head>
<body>

  <!-- ════ HEADER ════ -->
  <div class="invoice-header">
    <div>
      <div class="business-logo"><img src="{{businessLogo}}" alt="{{businessName}}" onerror="this.parentElement.innerHTML='{{businessInitial}}'" /></div>
      <div class="business-name">{{businessName}}</div>
      <div class="business-meta">GSTIN: {{businessGstin}}</div>
      <div class="business-meta">{{businessAddress}}</div>
      <div class="business-meta">{{businessCity}}, {{businessState}}</div>
      <div class="business-meta">Ph: {{businessPhone}} | {{businessEmail}}</div>
    </div>
    <div class="invoice-badge">
      <div class="invoice-type">{{invoiceType}}</div>
      <div class="invoice-number"># {{invoiceNumber}}</div>
      <div class="invoice-dates">
        Issue Date: {{issueDate}}<br>
        Due Date: {{dueDate}}
      </div>
    </div>
  </div>

  <!-- ════ BODY ════ -->
  <div class="invoice-body">

    <!-- Parties -->
    <div class="parties">
      <div class="party">
        <div class="party-label">Bill To</div>
        <div class="party-name">{{customerName}}</div>
        <div class="party-meta">{{customerAddress}}</div>
        <div class="party-meta">{{customerCity}}, {{customerState}}</div>
        {{#customerGstin}}<div class="gstin-badge">GSTIN: {{customerGstin}}</div>{{/customerGstin}}
        {{#customerPan}}<div class="party-meta">PAN: {{customerPan}}</div>{{/customerPan}}
        <div class="party-meta">{{customerEmail}}</div>
        <div class="party-meta">{{customerPhone}}</div>
      </div>
    </div>

    <!-- Supply Info -->
    <div class="supply-info">
      <div>Place of Supply: <span>{{placeOfSupply}}</span></div>
      <div>Tax Type: <span>{{taxType}}</span></div>
    </div>

    <!-- Items Table -->
    <table>
      <thead>
        <tr>
          <th style="width:36px">#</th>
          <th>Description</th>
          <th>HSN/SAC</th>
          <th>Qty</th>
          <th>Rate (₹)</th>
          <th>GST %</th>
          <th>Amount (₹)</th>
        </tr>
      </thead>
      <tbody>{{#items}}
        <tr>
          <td>{{index}}</td>
          <td><div class="item-desc">{{description}}</div></td>
          <td><span class="item-hsn">{{hsnSac}}</span></td>
          <td>{{quantity}} {{unit}}</td>
          <td>{{price}}</td>
          <td>{{gstRate}}%</td>
          <td class="amount-col">{{total}}</td>
        </tr>
      {{/items}}</tbody>
    </table>

    <!-- Totals + Amount in Words -->
    <div class="totals-section">
      <!-- Amount in Words on left -->
      <div class="amount-in-words">
        <div class="label">Amount in Words</div>
        <div class="words">{{amountInWords}}</div>
      </div>

      <!-- Numeric totals on right -->
      <div class="totals-box">
        <div class="totals-row"><span class="lbl">Taxable Amount</span><span class="val">₹{{taxableAmount}}</span></div>
        <div class="totals-row"><span class="lbl">CGST</span><span class="val">₹{{cgst}}</span></div>
        <div class="totals-row"><span class="lbl">SGST</span><span class="val">₹{{sgst}}</span></div>
        <div class="totals-row"><span class="lbl">IGST</span><span class="val">₹{{igst}}</span></div>
        <div class="totals-grand"><span class="lbl">Grand Total</span><span class="val">₹{{total}}</span></div>
        <div class="totals-balance"><span class="lbl">Balance Due</span><span class="val">₹{{amountDue}}</span></div>
      </div>
    </div>

  </div><!-- /invoice-body -->

  <!-- ════ FOOTER ════ -->
  <div class="invoice-footer">
    <div class="footer-col">
      <div class="footer-label">Notes</div>
      <div class="footer-text">{{notes}}</div>
    </div>
    <div class="footer-col">
      <div class="footer-label">Terms &amp; Conditions</div>
      <div class="footer-text">{{terms}}</div>
    </div>
    <div class="footer-col" style="max-width:160px;text-align:center;">
      <div class="footer-label">Authorised Signatory</div>
      <div class="seal-area" style="margin-top:8px;"></div>
      <div class="footer-text" style="margin-top:6px;">{{businessName}}</div>
    </div>
  </div>

  <div class="footer-bottom">
    This is a computer-generated invoice. | {{businessName}} | GSTIN: {{businessGstin}}
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
              <div className="rounded-lg bg-gray-800 border border-gray-700 p-4 text-xs text-gray-400 space-y-4">
                <p className="font-semibold text-gray-200 text-sm">Available Template Variables</p>

                {/* Business Info */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Business Info</p>
                  <div className="grid grid-cols-3 gap-1 font-mono">
                    {['{{businessName}}','{{businessGstin}}','{{businessAddress}}','{{businessCity}}','{{businessState}}','{{businessPhone}}','{{businessEmail}}','{{businessInitial}}','{{businessLogo}}'].map(v => (
                      <span key={v} className="text-orange-400">{v}</span>
                    ))}
                  </div>
                </div>

                {/* Invoice Info */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Invoice Info</p>
                  <div className="grid grid-cols-3 gap-1 font-mono">
                    {['{{invoiceNumber}}','{{invoiceType}}','{{issueDate}}','{{dueDate}}'].map(v => (
                      <span key={v} className="text-orange-400">{v}</span>
                    ))}
                  </div>
                </div>

                {/* Customer / Bill To */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Customer / Bill To</p>
                  <div className="grid grid-cols-3 gap-1 font-mono">
                    {['{{customerName}}','{{customerGstin}}','{{customerPan}}','{{customerAddress}}','{{customerCity}}','{{customerState}}','{{customerPincode}}','{{customerEmail}}','{{customerPhone}}'].map(v => (
                      <span key={v} className="text-orange-400">{v}</span>
                    ))}
                  </div>
                </div>

                {/* Shipping / Ship To */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Shipping / Ship To</p>
                  <div className="grid grid-cols-3 gap-1 font-mono">
                    {['{{shipAddress}}','{{shipCity}}','{{shipState}}','{{shipPincode}}'].map(v => (
                      <span key={v} className="text-orange-400">{v}</span>
                    ))}
                  </div>
                  <p className="text-gray-600 mt-1">Falls back to billing address when no separate shipping address is saved.</p>
                </div>

                {/* Supply & Tax */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Supply &amp; Tax</p>
                  <div className="grid grid-cols-3 gap-1 font-mono">
                    {['{{placeOfSupply}}','{{taxType}}'].map(v => (
                      <span key={v} className="text-orange-400">{v}</span>
                    ))}
                  </div>
                  <p className="text-gray-600 mt-1"><span className="text-orange-400 font-mono">{'{{taxType}}'}</span> resolves to <span className="text-gray-400">"Intra-State (CGST + SGST)"</span> or <span className="text-gray-400">"Inter-State (IGST)"</span> automatically.</p>
                </div>

                {/* Totals & Amounts */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Totals &amp; Amounts</p>
                  <div className="grid grid-cols-3 gap-1 font-mono">
                    {['{{taxableAmount}}','{{cgst}}','{{sgst}}','{{igst}}','{{total}}','{{amountDue}}','{{amountInWords}}'].map(v => (
                      <span key={v} className="text-orange-400">{v}</span>
                    ))}
                  </div>
                </div>

                {/* Notes & Terms */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Notes &amp; Terms</p>
                  <div className="grid grid-cols-3 gap-1 font-mono">
                    {['{{notes}}','{{terms}}'].map(v => (
                      <span key={v} className="text-orange-400">{v}</span>
                    ))}
                  </div>
                </div>

                {/* Items Loop */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Items Loop</p>
                  <p className="text-gray-400 mb-2">Wrap a <code className="bg-gray-700 px-1 rounded text-orange-300">&lt;tr&gt;</code> row inside the loop block to repeat it for every line item:</p>
                  <pre className="bg-gray-950 border border-gray-700 rounded p-2 text-orange-400 font-mono whitespace-pre-wrap leading-5 select-all">{`{{#items}}
  <tr>
    <td>{{index}}</td>
    <td>{{description}}</td>
    <td>{{hsnSac}}</td>
    <td>{{quantity}} {{unit}}</td>
    <td>{{price}}</td>
    <td>{{gstRate}}%</td>
    <td>{{total}}</td>
  </tr>
{{/items}}`}</pre>
                  <div className="grid grid-cols-3 gap-1 font-mono mt-2">
                    {['{{index}}','{{description}}','{{hsnSac}}','{{quantity}}','{{unit}}','{{price}}','{{gstRate}}','{{total}}'].map(v => (
                      <span key={v} className="text-orange-400">{v}</span>
                    ))}
                  </div>
                </div>

                {/* Conditional Blocks */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Conditional Blocks</p>
                  <p className="text-gray-400 mb-2">Wrap any HTML in <code className="bg-gray-700 px-1 rounded text-blue-300">{'{{#variable}}'}</code> / <code className="bg-gray-700 px-1 rounded text-blue-300">{'{{/variable}}'}</code> to render it only when the variable is non-empty:</p>
                  <pre className="bg-gray-950 border border-gray-700 rounded p-2 text-blue-300 font-mono whitespace-pre-wrap leading-5 select-all">{`{{#customerGstin}}
  <div>GSTIN: {{customerGstin}}</div>
{{/customerGstin}}

{{#customerPan}}
  <div>PAN: {{customerPan}}</div>
{{/customerPan}}`}</pre>
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
                  sandbox=""
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

  const handleToggleActive = async (tmpl: InvoiceTemplate) => {
    try {
      const token = getAdminToken();
      await fetch(`${API_URL}/admin/invoice-templates/${tmpl.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: !tmpl.isActive }),
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
            <iframe srcDoc={previewTemplate.html} className="w-full h-full" title="Preview" sandbox="" />
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
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Built-in template — always shown first, non-removable */}
            <div className="rounded-2xl border border-blue-700/50 bg-gray-900 p-5 ring-1 ring-blue-600/20">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-white">{BUILTIN_TEMPLATE.name}</h3>
                    <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="h-2.5 w-2.5" /> Built-in
                    </span>
                    <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded-full">Default</span>
                    <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded-full">Published</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Clean white design · Cannot be removed</p>
                </div>
              </div>
              <div className="rounded-lg overflow-hidden border border-gray-700 bg-white mb-3" style={{ height: '120px' }}>
                <iframe srcDoc={BUILTIN_TEMPLATE.html} className="w-full h-full" title={BUILTIN_TEMPLATE.name} sandbox="" style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%', height: '200%', pointerEvents: 'none' }} />
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setPreviewTemplate(BUILTIN_TEMPLATE)}
                  className="flex-1 rounded-lg border border-gray-700 py-1.5 text-xs font-medium text-gray-400 hover:bg-gray-800 hover:text-gray-200 flex items-center justify-center gap-1">
                  <Eye className="h-3.5 w-3.5" /> Preview
                </button>
                <span className="rounded-lg border border-gray-800 p-1.5 text-gray-600 cursor-not-allowed" title="Built-in template cannot be edited">
                  <Edit2 className="h-3.5 w-3.5" />
                </span>
                <span className="rounded-lg border border-gray-800 p-1.5 text-gray-600 cursor-not-allowed" title="Built-in template cannot be deleted">
                  <Trash2 className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>

            {/* Database templates */}
            {templates.map(tmpl => (
              <div key={tmpl.id} className="rounded-2xl border border-gray-700 bg-gray-900 p-5 hover:border-gray-600 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-white">{tmpl.name}</h3>
                      {tmpl.isDefault && (
                        <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded-full">Default</span>
                      )}
                      {tmpl.isActive ? (
                        <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded-full">Published</span>
                      ) : (
                        <span className="text-xs bg-gray-700 text-gray-400 border border-gray-600 px-1.5 py-0.5 rounded-full">Unpublished</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">#{tmpl.sortOrder}</p>
                  </div>
                </div>
                <div className="rounded-lg overflow-hidden border border-gray-700 bg-white mb-3" style={{ height: '120px' }}>
                  <iframe srcDoc={tmpl.html} className="w-full h-full" title={tmpl.name} sandbox="" style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%', height: '200%', pointerEvents: 'none' }} />
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
                  <button onClick={() => handleToggleActive(tmpl)}
                    title={tmpl.isActive ? 'Unpublish' : 'Publish'}
                    className={`rounded-lg border p-1.5 ${tmpl.isActive ? 'border-green-700 text-green-400 hover:bg-green-900/30' : 'border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-green-400'}`}>
                    {tmpl.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
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
