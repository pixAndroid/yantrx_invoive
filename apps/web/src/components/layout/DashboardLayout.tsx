'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FileText, Users, Package, BarChart3,
  LogOut, Bell, Menu, X,
  IndianRupee, Zap, Building2, ChevronRight, Lock,
  Receipt, Boxes, UserCircle, Target
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { isAuthenticated, getUserData, apiFetch, isSafeImageUrl } from '@/lib/api';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/payments', label: 'Payments', icon: IndianRupee },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/inventory', label: 'Inventory', icon: Boxes },
  { href: '/hrm', label: 'HRM', icon: UserCircle },
  { href: '/crm', label: 'CRM', icon: Target },
];

// Keywords that must appear (case-insensitive) in plan.features to enable a nav item.
// Items with no entry here are always enabled.
// Multiple keywords per route use OR logic — the item is enabled if ANY keyword matches.
const NAV_FEATURE_REQUIREMENTS: Record<string, string[]> = {
  '/customers': ['customer'],
  '/products': ['product'],
  '/reports': ['report', 'gst'],
  '/payments': ['payment'],
};

const SETTINGS_ITEMS = [
  { href: '/settings', label: 'Business Settings', icon: Building2 },
  { href: '/settings/team', label: 'Team', icon: Users },
  { href: '/settings/billing', label: 'Billing & Plans', icon: IndianRupee },
  { href: '/settings/modules', label: 'Modules', icon: Zap },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userData, setUserData] = useState<{ name?: string; email?: string; role?: string }>({});
  const [planInfo, setPlanInfo] = useState<{ name: string; invoicesUsed: number; invoiceLimit: number; features: string[] } | null>(null);
  const [businessLogo, setBusinessLogo] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/auth/login');
      return;
    }
    const tokenData = getUserData();
    setUserData(tokenData);

    apiFetch('/auth/me')
      .then((res: any) => {
        if (res.data?.user) {
          setUserData(prev => ({ ...prev, name: res.data.user.name, email: res.data.user.email }));
        }
        const biz = res.data?.memberships?.[0]?.business;
        if (biz?.logo && typeof biz.logo === 'string' && isSafeImageUrl(biz.logo)) {
          setBusinessLogo(biz.logo);
        }
        if (biz?.name) setBusinessName(biz.name);
      })
      .catch(() => {});

    apiFetch('/subscriptions')
      .then((res: any) => {
        if (res.data?.length > 0) {
          const sub = res.data[0];
          // Fetch this month's invoice count from business stats
          apiFetch('/business/stats')
            .then((statsRes: any) => {
              setPlanInfo({
                name: sub.plan?.name || 'Free',
                invoicesUsed: statsRes?.data?.invoicesThisMonth ?? 0,
                invoiceLimit: sub.plan?.invoiceLimit || 5,
                features: sub.plan?.features || [],
              });
            })
            .catch(() => {
              setPlanInfo({
                name: sub.plan?.name || 'Free',
                invoicesUsed: 0,
                invoiceLimit: sub.plan?.invoiceLimit || 5,
                features: sub.plan?.features || [],
              });
            });
        }
      })
      .catch(() => {});
  }, [router]);

  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  const isNavEnabled = (href: string): boolean => {
    const requiredKeywords = NAV_FEATURE_REQUIREMENTS[href];
    if (!requiredKeywords) return true; // No requirement — always accessible
    if (!planInfo) return true; // Still loading — show as enabled to avoid flicker
    return requiredKeywords.some(keyword =>
      planInfo.features.some(f => f.toLowerCase().includes(keyword.toLowerCase()))
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/auth/login';
  };

  const displayName = userData.name || 'User';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex h-full flex-col ${mobile ? '' : 'w-64'}`}>
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-100 px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center overflow-hidden flex-shrink-0">
            {businessLogo ? (
              <img src={businessLogo} alt={businessName || 'Business Logo'} className="h-full w-full object-contain" />
            ) : (
              <span className="text-white font-bold text-sm">{businessName ? businessName.charAt(0).toUpperCase() : 'Y'}</span>
            )}
          </div>
          <span className="text-lg font-bold text-gray-900">{businessName || 'Yantrix'}</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {NAV_ITEMS.map(item => {
            const enabled = isNavEnabled(item.href);
            if (!enabled) {
              return (
                <Link
                  key={item.href}
                  href="/settings/billing"
                  onClick={() => mobile && setSidebarOpen(false)}
                  title={`Upgrade your plan to unlock ${item.label}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-50 hover:text-gray-400 transition-colors"
                >
                  <item.icon className="h-4 w-4 text-gray-300" />
                  <span>{item.label}</span>
                  <Lock className="ml-auto h-3.5 w-3.5 text-gray-300" />
                </Link>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => mobile && setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className={`h-4 w-4 ${isActive(item.href) ? 'text-indigo-600' : 'text-gray-400'}`} />
                {item.label}
                {isActive(item.href) && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600" />}
              </Link>
            );
          })}
        </div>

        {/* Settings section */}
        <div className="mt-8">
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600"
          >
            Settings
            <ChevronRight className={`h-3.5 w-3.5 transition-transform ${settingsOpen ? 'rotate-90' : ''}`} />
          </button>
          {settingsOpen && (
            <div className="mt-1 space-y-1">
              {SETTINGS_ITEMS.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => mobile && setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="h-4 w-4 text-gray-400" />
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* User section */}
      <div className="border-t border-gray-100 p-4">
        {planInfo && (
          <div className="mb-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs font-medium text-amber-800">{planInfo.name} Plan</p>
            <p className="text-xs text-amber-600 mt-0.5">{planInfo.invoicesUsed}/{planInfo.invoiceLimit} invoices used</p>
            <Link href="/settings/billing" className="mt-2 block text-center rounded-md bg-amber-600 py-1 text-xs font-semibold text-white hover:bg-amber-700">
              Upgrade
            </Link>
          </div>
        )}
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">{displayName}</p>
            {userData.email && <p className="text-xs text-gray-400 truncate">{userData.email}</p>}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden print:block print:h-auto print:overflow-visible print:bg-white">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-gray-200 bg-white print:hidden">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="print:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-white shadow-xl lg:hidden"
            >
              <div className="absolute right-3 top-3">
                <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 hover:bg-gray-100">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Sidebar mobile />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden print:block print:overflow-visible">
        {/* Top bar */}
        <header className="flex h-16 items-center border-b border-gray-200 bg-white px-4 lg:px-6 gap-4 print:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden rounded-lg p-2 hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <Link
              href="/invoices/new"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <FileText className="h-3.5 w-3.5" />
              New Invoice
            </Link>

            <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>

            <div className="h-8 w-8 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              {businessLogo ? (
                <img src={businessLogo} alt={businessName || 'Business Logo'} className="h-full w-full object-contain" />
              ) : (
                <span className="text-white text-xs font-bold">{initials}</span>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
