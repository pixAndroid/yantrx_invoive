'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FileText, Users, IndianRupee, TrendingUp, ArrowUpRight, ArrowDownRight, Plus, ChevronRight, Clock, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { apiFetch, getUserData } from '@/lib/api';

const STATUS_CONFIG = {
  PAID: { label: 'Paid', class: 'badge badge-success', icon: CheckCircle },
  SENT: { label: 'Sent', class: 'badge badge-info', icon: Clock },
  OVERDUE: { label: 'Overdue', class: 'badge badge-danger', icon: AlertCircle },
  DRAFT: { label: 'Draft', class: 'badge badge-neutral', icon: FileText },
  PARTIALLY_PAID: { label: 'Partial', class: 'badge badge-warning', icon: Clock },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const QUICK_ACTION_FEATURE_REQUIREMENTS: Record<string, string[]> = {
  '/customers/new': ['customer'],
  '/products/new': ['product'],
  '/reports': ['report', 'gst'],
};

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

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
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [planFeatures, setPlanFeatures] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeBar, setActiveBar] = useState<number | null>(null);
  const router = useRouter();
  const userData = getUserData();
  const firstName = userData.name?.split(' ')[0] || 'there';

  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      router.push('/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [router]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const isQuickActionEnabled = (href: string): boolean => {
    const required = QUICK_ACTION_FEATURE_REQUIREMENTS[href];
    if (!required) return true;
    if (planFeatures === null) return true;
    return required.some(kw => planFeatures.some(f => f.toLowerCase().includes(kw.toLowerCase())));
  };

  useEffect(() => {
    Promise.all([
      apiFetch<{ data: { totalRevenue: number; invoicesThisMonth: number; activeCustomers: number; pendingAmount: number; pendingInvoicesCount: number } }>('/business/stats').catch(() => null),
      apiFetch<{ data: any[]; meta: object }>('/invoices?limit=5').catch(() => null),
      apiFetch<{ data: { monthlyRevenue: MonthlyRevenue[] } }>('/reports/dashboard').catch(() => null),
      apiFetch<{ data: any[] }>('/subscriptions').catch(() => null),
    ]).then(async ([statsRes, invoicesRes, dashboardRes, subsRes]) => {
      setStats({
        totalRevenue: statsRes?.data?.totalRevenue ?? 0,
        invoicesThisMonth: statsRes?.data?.invoicesThisMonth ?? 0,
        activeCustomers: statsRes?.data?.activeCustomers ?? 0,
        pendingAmount: statsRes?.data?.pendingAmount ?? 0,
        pendingInvoicesCount: statsRes?.data?.pendingInvoicesCount ?? 0,
        recentInvoices: invoicesRes?.data ?? [],
      });
      setMonthlyRevenue(dashboardRes?.data?.monthlyRevenue ?? []);

      const subs: any[] = subsRes?.data ?? [];
      const now = new Date();
      const activeSub = subs.find((s: any) =>
        (s.status === 'ACTIVE' || s.status === 'TRIAL') &&
        s.endDate && new Date(s.endDate) >= now
      );
      if (activeSub?.plan?.features) {
        setPlanFeatures(activeSub.plan.features);
      } else {
        const plansRes: any = await apiFetch('/plans').catch(() => null);
        const plans: any[] = plansRes?.data ?? [];
        const freePlan =
          plans.find((p: any) => p.slug === 'free') ||
          plans.find((p: any) => p.price === 0) ||
          plans.slice().sort((a: any, b: any) => a.price - b.price)[0];
        setPlanFeatures(freePlan?.features ?? []);
      }
    }).finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      label: 'Total Revenue',
      value: stats ? `₹${stats.totalRevenue.toLocaleString('en-IN')}` : '—',
      change: '+12.5%',
      trend: 'up' as const,
      icon: IndianRupee,
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
    },
    {
      label: 'Invoices This Month',
      value: stats ? String(stats.invoicesThisMonth) : '—',
      change: '+8.3%',
      trend: 'up' as const,
      icon: FileText,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      label: 'Active Customers',
      value: stats ? String(stats.activeCustomers) : '—',
      change: '+5.2%',
      trend: 'up' as const,
      icon: Users,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Pending Amount',
      value: stats ? `₹${stats.pendingAmount.toLocaleString('en-IN')}` : '—',
      change: '-3.1%',
      trend: 'down' as const,
      icon: Clock,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      sub: stats ? `${stats.pendingInvoicesCount} invoices due` : '',
    },
  ];

  const currentYear = new Date().getFullYear();
  const chartData = MONTHS.map(m => {
    const found = monthlyRevenue.find(r => r.month === `${m} ${currentYear}`);
    return found?.revenue ?? 0;
  });
  const maxRevenue = Math.max(...chartData, 1);
  const currentMonth = new Date().getMonth();

  const niceMax = (() => {
    if (maxRevenue <= 1) return 100;
    const mag = Math.pow(10, Math.floor(Math.log10(maxRevenue)));
    const n = maxRevenue / mag;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
  })();
  const Y_TICKS = 4;
  const CHART_HEIGHT = 160;
  const yTickValues = Array.from({ length: Y_TICKS + 1 }, (_, i) => (niceMax / Y_TICKS) * i);
  const formatRevenue = (v: number) =>
    v >= 100000 ? `₹${(v / 100000).toFixed(1)}L`
    : v >= 1000 ? `₹${(v / 1000).toFixed(0)}K`
    : `₹${Math.round(v)}`;

  const QUICK_ACTIONS = [
    { href: '/invoices/new', label: 'Create Invoice', icon: FileText, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600', hoverBg: 'hover:bg-indigo-50', hoverBorder: 'hover:border-indigo-200' },
    { href: '/customers/new', label: 'Add Customer', icon: Users, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', hoverBg: 'hover:bg-emerald-50', hoverBorder: 'hover:border-emerald-200' },
    { href: '/products/new', label: 'Add Product', icon: TrendingUp, iconBg: 'bg-blue-50', iconColor: 'text-blue-600', hoverBg: 'hover:bg-blue-50', hoverBorder: 'hover:border-blue-200' },
    { href: '/reports', label: 'GST Reports', icon: IndianRupee, iconBg: 'bg-amber-50', iconColor: 'text-amber-600', hoverBg: 'hover:bg-amber-50', hoverBorder: 'hover:border-amber-200' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8 flex items-center justify-between"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{getGreeting()}, {firstName}!</h1>
            <span className="text-2xl">👋</span>
          </div>
          <p className="text-sm text-gray-500">Here&apos;s your business overview for today.</p>
        </div>
        <Link
          href="/invoices/new"
          className="hidden md:inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 hover:shadow-md transition-all duration-150 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          New Invoice
        </Link>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.07, duration: 0.3 }}
            className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${stat.iconBg} transition-transform duration-200 group-hover:scale-110`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              <span className={`flex items-center gap-0.5 text-xs font-semibold rounded-full px-2 py-0.5 ${
                stat.trend === 'up'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-600'
              }`}>
                {stat.trend === 'up'
                  ? <ArrowUpRight className="h-3 w-3" />
                  : <ArrowDownRight className="h-3 w-3" />
                }
                {stat.change}
              </span>
            </div>
            {loading ? (
              <div className="h-7 bg-gray-100 rounded-lg animate-pulse mb-2 w-3/4" />
            ) : (
              <p className="text-2xl font-bold text-gray-900 mb-1 leading-none">{stat.value}</p>
            )}
            <p className="text-xs font-medium text-gray-500">{stat.label}</p>
            {stat.sub && !loading && (
              <p className="text-xs text-amber-600 mt-0.5 font-medium">{stat.sub}</p>
            )}
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.3 }}
          className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-gray-900">Revenue Overview</h2>
              <p className="text-xs text-gray-500 mt-0.5">Monthly revenue — {currentYear}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-r from-indigo-500 to-violet-500" />
                Revenue
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex gap-2">
              <div className="flex-1 flex items-end gap-1" style={{ height: `${CHART_HEIGHT + 28}px` }}>
                {MONTHS.map((_, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end gap-1.5">
                    <div className="w-full rounded-t-md skeleton" style={{ height: `${30 + (idx % 5) * 14}px` }} />
                    <span className="text-[10px] text-gray-300">{MONTHS[idx]}</span>
                  </div>
                ))}
              </div>
              <div className="shrink-0 flex flex-col-reverse justify-between" style={{ width: '38px', height: `${CHART_HEIGHT}px`, marginBottom: '28px' }}>
                {yTickValues.map((_, i) => (
                  <div key={i} className="skeleton h-2.5 rounded w-full" />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              {/* Bars + gridlines */}
              <div className="relative flex-1" style={{ height: `${CHART_HEIGHT + 28}px` }}>
                {/* Horizontal gridlines */}
                {yTickValues.map((tick, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 border-t border-dashed border-gray-100"
                    style={{ bottom: `${28 + (tick / niceMax) * CHART_HEIGHT}px` }}
                  />
                ))}
                {/* Bars */}
                <div className="absolute inset-x-0 bottom-0 top-0 flex items-end gap-1">
                  {chartData.map((value, idx) => {
                    const barH = Math.max(4, (value / niceMax) * CHART_HEIGHT);
                    const isCurrentMonth = idx === currentMonth;
                    const hasValue = value > 0;
                    const isActive = activeBar === idx;
                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center group/bar cursor-pointer"
                        style={{ height: '100%' }}
                        onClick={() => setActiveBar(isActive ? null : idx)}
                      >
                        {/* Chart area (flex-1) with tooltip + bar */}
                        <div className="relative flex-1 w-full flex items-end">
                          {/* Tooltip */}
                          {hasValue && (
                            <div
                              className={`absolute left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all duration-150 ${
                                isActive
                                  ? 'opacity-100 -translate-y-1'
                                  : 'opacity-0 group-hover/bar:opacity-100 group-hover/bar:-translate-y-1'
                              }`}
                              style={{ bottom: `${barH + 8}px` }}
                            >
                              <div className="bg-gray-900 text-white rounded-xl shadow-2xl px-3 py-2 whitespace-nowrap text-center min-w-[64px]">
                                <p className="text-[9px] text-gray-400 font-medium leading-none mb-1">{MONTHS[idx]} {currentYear}</p>
                                <p className="text-xs font-bold leading-none">{formatRevenue(value)}</p>
                              </div>
                              <div className="w-0 h-0 absolute left-1/2 -translate-x-1/2 top-full border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-gray-900" />
                            </div>
                          )}
                          {/* Bar */}
                          <div
                            className="w-full rounded-t-lg relative overflow-hidden transition-all duration-200"
                            style={{ height: `${barH}px` }}
                          >
                            <div className="absolute inset-0 rounded-t-lg bg-gray-100/80" />
                            {hasValue && (
                              <div
                                className={`absolute inset-0 rounded-t-lg transition-all duration-300 ${
                                  isCurrentMonth || isActive
                                    ? 'bg-gradient-to-t from-indigo-600 to-violet-500'
                                    : 'bg-gradient-to-t from-indigo-400 to-indigo-300 group-hover/bar:from-indigo-500 group-hover/bar:to-violet-400'
                                }`}
                              />
                            )}
                          </div>
                        </div>
                        {/* Month label */}
                        <span className={`text-[10px] font-medium mt-1.5 leading-none ${isCurrentMonth ? 'text-indigo-600' : 'text-gray-400'}`}>
                          {MONTHS[idx]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Y-axis labels */}
              <div
                className="flex flex-col-reverse justify-between shrink-0"
                style={{ width: '38px', height: `${CHART_HEIGHT}px`, marginBottom: '28px' }}
              >
                {yTickValues.map((tick, i) => (
                  <span key={i} className="text-[9px] font-medium text-gray-400 text-right leading-none">
                    {formatRevenue(tick)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.3 }}
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <h2 className="text-base font-bold text-gray-900">Quick Actions</h2>
          </div>
          <div className="space-y-2">
            {QUICK_ACTIONS.filter(action => isQuickActionEnabled(action.href)).map(action => (
              <Link
                key={action.href}
                href={action.href}
                className={`flex items-center gap-3 rounded-xl border border-gray-100 p-3 transition-all duration-150 ${action.hoverBg} ${action.hoverBorder} hover:shadow-sm group`}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${action.iconBg} transition-transform duration-150 group-hover:scale-110`}>
                  <action.icon className={`h-4 w-4 ${action.iconColor}`} />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 flex-1">{action.label}</span>
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </Link>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Invoices */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42, duration: 0.3 }}
        className="mt-5 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Recent Invoices</h2>
          <Link href="/invoices" className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="divide-y divide-gray-50">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4">
                <div className="skeleton h-4 rounded w-24" />
                <div className="skeleton h-4 rounded flex-1" />
                <div className="skeleton h-6 rounded-full w-16" />
                <div className="skeleton h-4 rounded w-16" />
              </div>
            ))
          ) : (stats?.recentInvoices ?? []).length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
                <FileText className="h-6 w-6 text-indigo-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-1">No invoices yet</p>
              <p className="text-xs text-gray-400 mb-4">Create your first invoice to get started</p>
              <Link
                href="/invoices/new"
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-4 w-4" /> Create Invoice
              </Link>
            </div>
          ) : (stats?.recentInvoices ?? []).map(invoice => {
            const statusConfig = STATUS_CONFIG[invoice.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.DRAFT;
            return (
              <Link
                key={invoice.id}
                href={`/invoices/${invoice.id}`}
                className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/80 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{invoice.invoiceNumber}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{invoice.customer?.name || 'Unknown'}</p>
                </div>
                <div className="hidden sm:block text-xs text-gray-400 tabular-nums">
                  {new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </div>
                <span className={statusConfig.class}>
                  <statusConfig.icon className="h-3 w-3" />
                  {statusConfig.label}
                </span>
                <span className="text-sm font-bold text-gray-900 tabular-nums">₹{invoice.total.toLocaleString('en-IN')}</span>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
