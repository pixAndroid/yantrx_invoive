'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Download, Calendar, TrendingUp, IndianRupee, Users, AlertCircle, RefreshCw } from 'lucide-react';
import { apiFetch } from '@/lib/api';

type TabKey = 'sales' | 'gst' | 'pending' | 'customers' | 'top';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'sales', label: 'Sales Report' },
  { key: 'gst', label: 'GST Summary' },
  { key: 'pending', label: 'Pending Payments' },
  { key: 'customers', label: 'Customer Sales' },
  { key: 'top', label: 'Top Customers' },
];

const STATUS_CLS: Record<string, string> = {
  PAID: 'bg-green-100 text-green-700',
  SENT: 'bg-blue-100 text-blue-700',
  PARTIALLY_PAID: 'bg-amber-100 text-amber-700',
  OVERDUE: 'bg-red-100 text-red-700',
  DRAFT: 'bg-gray-100 text-gray-500',
};

function exportCSV(headers: string[], rows: string[][], filename: string) {
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function exportExcel(headers: string[], rows: string[][], filename: string) {
  // Excel-compatible CSV with BOM for proper Unicode rendering
  const csv = '\uFEFF' + [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [tab, setTab] = useState<TabKey>('sales');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [gstMonth, setGstMonth] = useState(() => String(new Date().getMonth() + 1));
  const [gstYear, setGstYear] = useState(() => String(new Date().getFullYear()));
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      let res: any;
      if (tab === 'sales') res = await apiFetch(`/reports/sales?startDate=${startDate}&endDate=${endDate}`);
      else if (tab === 'gst') res = await apiFetch(`/reports/gst-summary?month=${gstMonth}&year=${gstYear}`);
      else if (tab === 'pending') res = await apiFetch('/reports/pending-payments');
      else if (tab === 'customers') res = await apiFetch(`/reports/customer-sales?startDate=${startDate}&endDate=${endDate}`);
      else if (tab === 'top') res = await apiFetch('/reports/top-customers?limit=15');
      setData(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tab, startDate, endDate, gstMonth, gstYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExport = (format: 'csv' | 'excel' = 'csv') => {
    if (!data) return;
    const exporter = format === 'excel' ? exportExcel : exportCSV;
    const ext = format === 'excel' ? 'xls' : 'csv';
    if (tab === 'sales' && data.invoices) {
      exporter(
        ['Invoice No', 'Customer', 'Date', 'Total', 'Paid', 'Due', 'Status'],
        data.invoices.map((i: any) => [i.invoiceNumber, i.customer?.name, i.issueDate?.split('T')[0], i.total, i.amountPaid, i.amountDue, i.status]),
        `sales-report.${ext}`
      );
    } else if (tab === 'pending' && data.invoices) {
      exporter(
        ['Invoice No', 'Customer', 'Due Date', 'Amount Due', 'Days Overdue'],
        data.invoices.map((i: any) => [i.invoiceNumber, i.customer?.name, i.dueDate?.split('T')[0] || 'N/A', i.amountDue, i.daysOverdue]),
        `pending-payments.${ext}`
      );
    } else if (tab === 'customers' && Array.isArray(data)) {
      exporter(
        ['Customer', 'Total Sales', 'Paid', 'Due', 'Invoices'],
        data.map((d: any) => [d.customer?.name, d.totalSales, d.totalPaid, d.totalDue, d.invoiceCount]),
        `customer-sales.${ext}`
      );
    } else if (tab === 'top' && Array.isArray(data)) {
      exporter(
        ['Rank', 'Customer', 'Revenue', 'Invoices'],
        data.map((d: any) => [d.rank, d.customer?.name, d.totalRevenue, d.invoiceCount]),
        `top-customers.${ext}`
      );
    } else if (tab === 'gst') {
      const gstData = Array.isArray(data) ? data : (data?.items || []);
      exporter(
        ['HSN/SAC', 'Description', 'Taxable Amount', 'CGST', 'SGST', 'IGST', 'Total Tax'],
        gstData.map((d: any) => [d.hsnSac || '', d.description || '', d.taxableAmount, d.cgst, d.sgst, d.igst, (d.cgst || 0) + (d.sgst || 0) + (d.igst || 0)]),
        `gst-summary.${ext}`
      );
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1">Business analytics and GST data</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button onClick={() => handleExport('csv')} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button onClick={() => handleExport('excel')} className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100">
            <BarChart3 className="h-4 w-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${tab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Date Filter */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Calendar className="h-4 w-4 text-gray-500" />
        {tab === 'gst' ? (
          <>
            <select value={gstMonth} onChange={e => setGstMonth(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none">
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => <option key={m} value={i+1}>{m}</option>)}
            </select>
            <select value={gstYear} onChange={e => setGstYear(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none">
              {['2025','2024','2023','2022'].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </>
        ) : tab !== 'top' && tab !== 'pending' ? (
          <>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none" />
            <span className="text-gray-400 text-sm">to</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none" />
          </>
        ) : null}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}</div>
      ) : !data ? null : (
        <>
          {/* SALES TAB */}
          {tab === 'sales' && (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-4 gap-4">
                {[
                  { label: 'Total Sales', value: `₹${(data.totalSales || 0).toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: 'Amount Paid', value: `₹${(data.totalPaid || 0).toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Amount Due', value: `₹${(data.totalDue || 0).toLocaleString('en-IN')}`, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
                  { label: 'Invoices', value: String(data.count || 0), icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
                ].map(c => (
                  <div key={c.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center mb-2 ${c.bg}`}><c.icon className={`h-4 w-4 ${c.color}`} /></div>
                    <p className="text-lg font-bold text-gray-900">{c.value}</p>
                    <p className="text-xs text-gray-500">{c.label}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50"><tr>{['Invoice','Customer','Date','Total','Paid','Due','Status'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {(data.invoices || []).map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-indigo-600">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{inv.customer?.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{new Date(inv.issueDate).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">₹{inv.total.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-sm text-green-600">₹{inv.amountPaid.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-sm text-red-500">₹{inv.amountDue.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLS[inv.status] || STATUS_CLS.DRAFT}`}>{inv.status}</span></td>
                      </tr>
                    ))}
                    {(!data.invoices || data.invoices.length === 0) && <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No invoices in this period</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* GST TAB */}
          {tab === 'gst' && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-4 gap-4">
                {[
                  { label: 'Total Sales', value: `₹${(data.totalSales||0).toLocaleString('en-IN')}` },
                  { label: 'CGST', value: `₹${(data.totalCgst||0).toLocaleString('en-IN')}` },
                  { label: 'SGST', value: `₹${(data.totalSgst||0).toLocaleString('en-IN')}` },
                  { label: 'IGST', value: `₹${(data.totalIgst||0).toLocaleString('en-IN')}` },
                ].map(c => (
                  <div key={c.label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">{c.label}</p>
                    <p className="text-lg font-bold text-gray-900">{c.value}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm font-semibold text-gray-600">B2B Invoices ({data.b2bCount || 0})</p>
              <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-auto">
                <table className="w-full text-sm"><thead className="bg-gray-50"><tr>{['GSTIN','Party','Invoices','Taxable','CGST','SGST','IGST','Total'].map(h=><th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
                  <tbody>{(data.b2bInvoices||[]).map((inv: any) => <tr key={inv.id} className="border-t border-gray-50"><td className="px-3 py-2 font-mono text-xs">{inv.customer?.gstin||'—'}</td><td className="px-3 py-2">{inv.customer?.name}</td><td className="px-3 py-2">1</td><td className="px-3 py-2">₹{(inv.taxableAmount||0).toLocaleString('en-IN')}</td><td className="px-3 py-2">₹{(inv.cgstTotal||0).toLocaleString('en-IN')}</td><td className="px-3 py-2">₹{(inv.sgstTotal||0).toLocaleString('en-IN')}</td><td className="px-3 py-2">₹{(inv.igstTotal||0).toLocaleString('en-IN')}</td><td className="px-3 py-2 font-medium">₹{(inv.total||0).toLocaleString('en-IN')}</td></tr>)}
                  {(!data.b2bInvoices||data.b2bInvoices.length===0)&&<tr><td colSpan={8} className="px-4 py-6 text-center text-gray-400">No B2B invoices</td></tr>}</tbody>
                </table>
              </div>
            </div>
          )}

          {/* PENDING TAB */}
          {tab === 'pending' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-xl border border-amber-100 bg-amber-50 p-4">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">Total Pending: ₹{(data.totalPending||0).toLocaleString('en-IN')}</p>
                  <p className="text-xs text-amber-700">{data.count || 0} invoices awaiting payment</p>
                </div>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50"><tr>{['Invoice','Customer','Due Date','Amount Due','Days Overdue','Status'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {(data.invoices||[]).map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-indigo-600">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{inv.customer?.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : '—'}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-red-600">₹{inv.amountDue.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-sm"><span className={`font-semibold ${inv.daysOverdue > 0 ? 'text-red-600' : 'text-gray-500'}`}>{inv.daysOverdue > 0 ? `${inv.daysOverdue}d` : '—'}</span></td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLS[inv.status]||STATUS_CLS.DRAFT}`}>{inv.status}</span></td>
                      </tr>
                    ))}
                    {(!data.invoices||data.invoices.length===0)&&<tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No pending payments</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CUSTOMER SALES TAB */}
          {tab === 'customers' && (
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50"><tr>{['Customer','Email','Total Sales','Paid','Due','Invoices'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {(Array.isArray(data) ? data : []).map((d: any) => (
                    <tr key={d.customer?.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{d.customer?.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{d.customer?.email || '—'}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-indigo-600">₹{d.totalSales.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-sm text-green-600">₹{d.totalPaid.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-sm text-red-500">₹{d.totalDue.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{d.invoiceCount}</td>
                    </tr>
                  ))}
                  {(!Array.isArray(data)||data.length===0)&&<tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No data</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* TOP CUSTOMERS TAB */}
          {tab === 'top' && (
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50"><tr>{['#','Customer','Email','Revenue','Invoices'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {(Array.isArray(data) ? data : []).map((d: any) => (
                    <tr key={d.customer?.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${d.rank<=3?'bg-amber-400 text-white':'bg-gray-100 text-gray-500'}`}>{d.rank}</div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{d.customer?.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{d.customer?.email || '—'}</td>
                      <td className="px-4 py-3 text-sm font-bold text-indigo-600">₹{d.totalRevenue.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{d.invoiceCount}</td>
                    </tr>
                  ))}
                  {(!Array.isArray(data)||data.length===0)&&<tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No data</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
