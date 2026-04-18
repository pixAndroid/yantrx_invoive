'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Users, IndianRupee, TrendingUp, ArrowUpRight, ArrowDownRight, Plus, ChevronRight, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { apiFetch, getUserData } from '@/lib/api';

const STATUS_CONFIG = {
  PAID: { label: 'Paid', class: 'bg-green-100 text-green-700', icon: CheckCircle },
  SENT: { label: 'Sent', class: 'bg-blue-100 text-blue-700', icon: Clock },
  OVERDUE: { label: 'Overdue', class: 'bg-red-100 text-red-700', icon: AlertCircle },
  DRAFT: { label: 'Draft', class: 'bg-gray-100 text-gray-600', icon: FileText },
  PARTIALLY_PAID: { label: 'Partial', class: 'bg-amber-100 text-amber-700', icon: Clock },
};

const CHART_DATA = [65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88, 72];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface DashboardStats {
  totalRevenue: number;
  invoicesThisMonth: number;
  activeCustomers: number;
  pendingAmount: number;
  pendingInvoicesCount: number;
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string;
    total: number;
    status: string;
    createdAt: string;
    customer: { name: string } | null;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const userData = getUserData();
  const firstName = userData.name?.split(' ')[0] || 'there';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    Promise.all([
      apiFetch<{ data: { totalRevenue: number; invoicesThisMonth: number; activeCustomers: number; pendingAmount: number; pendingInvoicesCount: number } }>('/business/stats').catch(() => null),
      apiFetch<{ data: any[]; meta: object }>('/invoices?limit=5').catch(() => null),
    ]).then(([statsRes, invoicesRes]) => {
      setStats({
        totalRevenue: statsRes?.data?.totalRevenue ?? 0,
        invoicesThisMonth: statsRes?.data?.invoicesThisMonth ?? 0,
        activeCustomers: statsRes?.data?.activeCustomers ?? 0,
        pendingAmount: statsRes?.data?.pendingAmount ?? 0,
        pendingInvoicesCount: statsRes?.data?.pendingInvoicesCount ?? 0,
        recentInvoices: invoicesRes?.data ?? [],
      });
    }).finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      label: 'Total Revenue',
      value: stats ? `₹${stats.totalRevenue.toLocaleString('en-IN')}` : '—',
      change: '+12.5%',
      trend: 'up' as const,
      icon: IndianRupee,
      bg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
    },
    {
      label: 'Invoices This Month',
      value: stats ? String(stats.invoicesThisMonth) : '—',
      change: '+8.3%',
      trend: 'up' as const,
      icon: FileText,
      bg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      label: 'Active Customers',
      value: stats ? String(stats.activeCustomers) : '—',
      change: '+5.2%',
      trend: 'up' as const,
      icon: Users,
      bg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Pending Amount',
      value: stats ? `₹${stats.pendingAmount.toLocaleString('en-IN')}` : '—',
      change: '-3.1%',
      trend: 'down' as const,
      icon: Clock,
      bg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      sub: stats ? `${stats.pendingInvoicesCount} invoices due` : '',
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{getGreeting()}, {firstName}! 👋</h1>
          <p className="text-gray-500 mt-1">Here&apos;s what&apos;s happening with your business today.</p>
        </div>
        <Link
          href="/invoices/new"
          className="hidden md:inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Invoice
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              <span className={`flex items-center gap-0.5 text-xs font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {stat.trend === 'up' ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {stat.change}
              </span>
            </div>
            {loading ? (
              <div className="h-8 bg-gray-100 rounded animate-pulse mb-1" />
            ) : (
              <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
            )}
            <p className="text-xs text-gray-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Revenue Overview</h2>
              <p className="text-sm text-gray-500">Monthly revenue for 2024</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <span className="h-2 w-2 rounded-full bg-indigo-500" /> Revenue
              </span>
            </div>
          </div>

          <div className="flex items-end gap-2 h-40">
            {CHART_DATA.map((value, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-sm bg-indigo-100 relative overflow-hidden group cursor-pointer"
                  style={{ height: `${(value / 100) * 140}px` }}
                >
                  <div className="absolute bottom-0 left-0 right-0 bg-indigo-500 rounded-t-sm transition-all group-hover:bg-indigo-600" style={{ height: '60%' }} />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-indigo-700 bg-white/80 rounded px-1">{value}K</span>
                  </div>
                </div>
                <span className="text-[10px] text-gray-400">{MONTHS[idx]}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { href: '/invoices/new', label: 'Create Invoice', icon: FileText, color: 'indigo' },
              { href: '/customers/new', label: 'Add Customer', icon: Users, color: 'green' },
              { href: '/products/new', label: 'Add Product', icon: TrendingUp, color: 'blue' },
              { href: '/reports', label: 'GST Reports', icon: IndianRupee, color: 'amber' },
            ].map(action => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 hover:border-indigo-200 hover:bg-indigo-50 transition-all group"
              >
                <div className={`h-8 w-8 rounded-lg bg-${action.color}-50 flex items-center justify-center group-hover:bg-${action.color}-100`}>
                  <action.icon className={`h-4 w-4 text-${action.color}-600`} />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{action.label}</span>
                <ChevronRight className="ml-auto h-4 w-4 text-gray-400 group-hover:text-gray-600" />
              </Link>
            ))}
          </div>

          {/* GST Reminder */}
          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
            <p className="text-sm font-semibold text-amber-800">📅 GST Filing Due</p>
            <p className="text-xs text-amber-700 mt-1">GSTR-3B for Nov 2024 due in 5 days</p>
            <Link href="/reports" className="mt-2 block text-xs font-medium text-amber-700 hover:text-amber-900 underline">
              View GST Summary →
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Recent Invoices */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-6 rounded-2xl border border-gray-100 bg-white shadow-sm"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Recent Invoices</h2>
          <Link href="/invoices" className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="divide-y divide-gray-50">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-6 py-4">
                <div className="h-8 bg-gray-100 rounded animate-pulse" />
              </div>
            ))
          ) : (stats?.recentInvoices ?? []).length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500 text-sm">No invoices yet.</p>
              <Link href="/invoices/new" className="mt-2 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline">
                <Plus className="h-4 w-4" /> Create your first invoice
              </Link>
            </div>
          ) : (stats?.recentInvoices ?? []).map(invoice => {
            const statusConfig = STATUS_CONFIG[invoice.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.DRAFT;
            return (
              <Link
                key={invoice.id}
                href={`/invoices/${invoice.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{invoice.invoiceNumber}</p>
                  <p className="text-xs text-gray-500 truncate">{invoice.customer?.name || 'Unknown'}</p>
                </div>
                <div className="hidden sm:block text-xs text-gray-400">
                  {new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusConfig.class}`}>
                  <statusConfig.icon className="h-3 w-3" />
                  {statusConfig.label}
                </span>
                <span className="text-sm font-semibold text-gray-900">₹{invoice.total.toLocaleString('en-IN')}</span>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
