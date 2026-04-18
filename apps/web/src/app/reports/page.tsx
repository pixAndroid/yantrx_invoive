'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Download, Calendar, FileText, TrendingUp, IndianRupee } from 'lucide-react';

const REPORT_CARD_COLORS: Record<string, { bg: string; icon: string }> = {
  indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600' },
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600' },
  green: { bg: 'bg-green-50', icon: 'text-green-600' },
};

const GST_LINK_COLORS: Record<string, { border: string; bg: string; title: string; text: string; sub: string; btn: string }> = {
  indigo: { border: 'border-indigo-100', bg: 'bg-indigo-50', title: 'text-indigo-900', text: 'text-indigo-700', sub: 'text-indigo-600', btn: 'text-indigo-700 hover:text-indigo-900' },
  green: { border: 'border-green-100', bg: 'bg-green-50', title: 'text-green-900', text: 'text-green-700', sub: 'text-green-600', btn: 'text-green-700 hover:text-green-900' },
  blue: { border: 'border-blue-100', bg: 'bg-blue-50', title: 'text-blue-900', text: 'text-blue-700', sub: 'text-blue-600', btn: 'text-blue-700 hover:text-blue-900' },
};
const GST_SUMMARY = {
  b2b: [
    { gstin: '07AABCA1234B1ZX', party: 'Acme Corporation', invoices: 4, taxable: 89655, igst: 0, cgst: 8069, sgst: 8069, total: 105793 },
    { gstin: '27AABCS5658K1ZQ', party: 'Sharma Enterprises', invoices: 2, taxable: 44915, igst: 0, cgst: 4042, sgst: 4042, total: 52999 },
  ],
  b2c: [
    { party: 'Unregistered Customers', invoices: 8, taxable: 42372, igst: 0, cgst: 3814, sgst: 3814, total: 50000 },
  ],
};

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState('11');
  const [selectedYear, setSelectedYear] = useState('2024');

  const totalTaxable = [...GST_SUMMARY.b2b, ...GST_SUMMARY.b2c].reduce((s, r) => s + r.taxable, 0);
  const totalCgst = [...GST_SUMMARY.b2b, ...GST_SUMMARY.b2c].reduce((s, r) => s + r.cgst, 0);
  const totalSgst = [...GST_SUMMARY.b2b, ...GST_SUMMARY.b2c].reduce((s, r) => s + r.sgst, 0);
  const totalTax = totalCgst + totalSgst;

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GST Reports</h1>
          <p className="text-gray-500 mt-1">Tax summary and GST filing data</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <Download className="h-4 w-4" /> Export JSON
        </button>
      </div>

      {/* Period selector */}
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="h-4 w-4 text-gray-500" />
        <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none">
          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
            <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
          ))}
        </select>
        <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none">
          {['2024', '2023', '2022'].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <span className="text-sm text-gray-500">Period: Nov 2024</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Sales', value: `₹${totalTaxable.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'indigo' },
          { label: 'CGST Collected', value: `₹${totalCgst.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'blue' },
          { label: 'SGST Collected', value: `₹${totalSgst.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'purple' },
          { label: 'Net GST Liability', value: `₹${totalTax.toLocaleString('en-IN')}`, icon: BarChart3, color: 'green' },
        ].map((card, idx) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${REPORT_CARD_COLORS[card.color]?.bg ?? 'bg-gray-50'}`}>
              <card.icon className={`h-5 w-5 ${REPORT_CARD_COLORS[card.color]?.icon ?? 'text-gray-600'}`} />
            </div>
            <p className="text-xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* B2B Invoices (GSTR-1) */}
      <div className="mb-6 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">B2B Invoices (GSTR-1)</h2>
            <p className="text-sm text-gray-500">Invoices issued to registered GST businesses</p>
          </div>
          <FileText className="h-5 w-5 text-gray-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">GSTIN</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Party Name</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Invoices</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Taxable (₹)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">CGST (₹)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">SGST (₹)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {GST_SUMMARY.b2b.map(row => (
                <tr key={row.gstin} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600">{row.gstin}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.party}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">{row.invoices}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">{row.taxable.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">{row.cgst.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">{row.sgst.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{row.total.toLocaleString('en-IN')}</td>
                </tr>
              ))}
              <tr className="bg-indigo-50 font-semibold">
                <td colSpan={3} className="px-4 py-3 text-sm text-indigo-900">Totals</td>
                <td className="px-4 py-3 text-sm text-indigo-900 text-right">{GST_SUMMARY.b2b.reduce((s, r) => s + r.taxable, 0).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-sm text-indigo-900 text-right">{GST_SUMMARY.b2b.reduce((s, r) => s + r.cgst, 0).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-sm text-indigo-900 text-right">{GST_SUMMARY.b2b.reduce((s, r) => s + r.sgst, 0).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-sm text-indigo-900 text-right">{GST_SUMMARY.b2b.reduce((s, r) => s + r.total, 0).toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { title: 'GSTR-1', desc: 'Outward supplies return', date: 'Due: 11th Dec 2024', color: 'indigo' },
          { title: 'GSTR-3B', desc: 'Monthly summary return', date: 'Due: 20th Dec 2024', color: 'green' },
          { title: 'GSTR-2A', desc: 'Purchase return (auto)', date: 'View anytime', color: 'blue' },
        ].map(report => {
          const c = GST_LINK_COLORS[report.color];
          return (
          <div key={report.title} className={`rounded-2xl border p-5 ${c.border} ${c.bg}`}>
            <h3 className={`text-base font-bold ${c.title}`}>{report.title}</h3>
            <p className={`text-sm mt-1 ${c.text}`}>{report.desc}</p>
            <p className={`text-xs mt-2 font-medium ${c.sub}`}>{report.date}</p>
            <button className={`mt-3 text-sm font-medium underline ${c.btn}`}>
              Generate Report →
            </button>
          </div>
          );
        })}
      </div>
    </div>
  );
}
