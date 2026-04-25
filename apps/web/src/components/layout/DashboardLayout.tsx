'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FileText, Users, Package, BarChart3,
  LogOut, Bell, Menu, X,
  IndianRupee, Zap, Building2, ChevronRight, Lock,
  Receipt, Boxes, UserCircle, Target, Crown
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { isAuthenticated, getUserData, apiFetch, isSafeImageUrl } from '@/lib/api';
import { BusinessProfileSetupModal, type BusinessSettings as BizSettings } from '@/components/ui/BusinessProfileSetupModal';

const INVOICE_USAGE_WARNING_RATIO = 0.8;

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
// Items with no entry here are always enabled for active plans.
// Multiple keywords per route use OR logic — the item is enabled if ANY keyword matches.
// When a plan is expired the client falls back to the free-plan feature set, so routes
// whose keywords are absent from the free plan (e.g. expense, inventory, hrm, crm)
// become automatically locked.
const NAV_FEATURE_REQUIREMENTS: Record<string, string[]> = {
  '/customers': ['customer'],
  '/products': ['product'],
  '/reports': ['report', 'gst'],
  '/payments': ['payment'],
  '/expenses': ['expense'],
  '/inventory': ['inventory'],
  '/hrm': ['hrm'],
  '/crm': ['crm'],
};

// Maps each nav route to its corresponding module slug as defined in the DB.
// Nav items whose slug is absent from the globally-active modules list will be hidden.
// Routes with no entry (e.g. /dashboard) are always shown.
const NAV_MODULE_SLUG: Record<string, string> = {
  '/invoices': 'invoicing',
  '/customers': 'customers',
  '/products': 'products',
  '/reports': 'gst-reports',
  '/payments': 'payments',
  '/expenses': 'expenses',
  '/inventory': 'inventory',
  '/hrm': 'hrms',
  '/crm': 'crm',
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
  const [planInfo, setPlanInfo] = useState<{ name: string; invoicesUsed: number; invoiceLimit: number; customersUsed: number; customerLimit: number; features: string[]; isExpired?: boolean; endDate?: string } | null>(null);
  const [businessLogo, setBusinessLogo] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [setupSettings, setSetupSettings] = useState<BizSettings | null>(null);
  const [setupRequired, setSetupRequired] = useState(false);
  const [activeModuleSlugs, setActiveModuleSlugs] = useState<Set<string> | null>(null);

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

        // Check if business profile setup is required
        const bizId = biz?.id || getUserData().businessId;
        if (bizId) {
          apiFetch(`/business/${bizId}`)
            .then((bizRes: any) => {
              const s = bizRes?.data;
              if (s) {
                const isIncomplete =
                  !s.email?.trim() ||
                  !s.phone?.trim() ||
                  !s.address?.trim() ||
                  !s.invoicePrefix?.trim();
                if (isIncomplete) {
                  setSetupSettings(s);
                  setSetupRequired(true);
                }
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});

    apiFetch('/modules')
      .then((res: { data?: Array<{ slug: string }> }) => {
        const slugs = new Set<string>((res.data || []).map(m => m.slug));
        setActiveModuleSlugs(slugs);
      })
      .catch(() => {
        // On failure keep null so all nav items remain visible (fail-open)
        setActiveModuleSlugs(null);
      });

    apiFetch('/subscriptions')
      .then(async (res: any) => {
        const subs = res.data || [];

        // Helper to fetch free-plan limits/features (used for expired subs and no-sub fallback)
        const fetchFreePlanInfo = async (): Promise<{ features: string[]; invoiceLimit: number; customerLimit: number }> => {
          try {
            const plansRes: any = await apiFetch('/plans');
            const plans: any[] = plansRes.data || [];
            const freePlan =
              plans.find((p: any) => p.slug === 'free') ||
              plans.find((p: any) => p.price === 0) ||
              plans.slice().sort((a: any, b: any) => a.price - b.price)[0];
            if (freePlan) {
              return {
                features: freePlan.features || [],
                invoiceLimit: freePlan.invoiceLimit || 5,
                customerLimit: freePlan.customerLimit || 10,
              };
            }
          } catch (err) {
            console.error('Failed to fetch plans for free-plan fallback:', err);
          }
          return { features: [], invoiceLimit: 5, customerLimit: 10 };
        };

        // Client-side expiry check: treat ACTIVE/TRIAL sub as expired if endDate is in the past
        const activeSub = subs.find(
          (s: any) =>
            (s.status === 'ACTIVE' || s.status === 'TRIAL') &&
            new Date(s.endDate) > new Date()
        );
        const clientExpiredSub = !activeSub
          ? subs.find(
              (s: any) =>
                s.status === 'EXPIRED' ||
                ((s.status === 'ACTIVE' || s.status === 'TRIAL') && new Date(s.endDate) <= new Date())
            )
          : null;
        const sub = activeSub || clientExpiredSub;

        if (sub) {
          // Treat as expired if the subscription is EXPIRED in DB, or endDate is in the past
          const isExpired =
            sub.status === 'EXPIRED' ||
            ((sub.status === 'ACTIVE' || sub.status === 'TRIAL') && new Date(sub.endDate) <= new Date());

          if (isExpired) {
            // Fetch the free/lowest-tier plan to determine fallback features and limits
            const { features: freePlanFeatures, invoiceLimit: freePlanInvoiceLimit, customerLimit: freePlanCustomerLimit } =
              await fetchFreePlanInfo();

            // Fetch usage stats so the sidebar widget shows real counts
            apiFetch('/business/stats')
              .then((statsRes: any) => {
                setPlanInfo({
                  name: sub.plan?.name || 'Unknown',
                  invoicesUsed: statsRes?.data?.invoicesThisMonth ?? 0,
                  invoiceLimit: freePlanInvoiceLimit,
                  customersUsed: statsRes?.data?.activeCustomers ?? 0,
                  customerLimit: freePlanCustomerLimit,
                  features: freePlanFeatures,
                  isExpired: true,
                  endDate: sub.endDate,
                });
              })
              .catch(() => {
                setPlanInfo({
                  name: sub.plan?.name || 'Unknown',
                  invoicesUsed: 0,
                  invoiceLimit: freePlanInvoiceLimit,
                  customersUsed: 0,
                  customerLimit: freePlanCustomerLimit,
                  features: freePlanFeatures,
                  isExpired: true,
                  endDate: sub.endDate,
                });
              });
          } else {
            // Active subscription — use the plan's own features (Free plan users are gated by their plan's features list)
            apiFetch('/business/stats')
              .then((statsRes: any) => {
                setPlanInfo({
                  name: sub.plan?.name || 'Free',
                  invoicesUsed: statsRes?.data?.invoicesThisMonth ?? 0,
                  invoiceLimit: sub.plan?.invoiceLimit || 5,
                  customersUsed: statsRes?.data?.activeCustomers ?? 0,
                  customerLimit: sub.plan?.customerLimit || 0,
                  features: sub.plan?.features || [],
                  isExpired: false,
                  endDate: sub.endDate,
                });
              })
              .catch(() => {
                setPlanInfo({
                  name: sub.plan?.name || 'Free',
                  invoicesUsed: 0,
                  invoiceLimit: sub.plan?.invoiceLimit || 5,
                  customersUsed: 0,
                  customerLimit: sub.plan?.customerLimit || 0,
                  features: sub.plan?.features || [],
                  isExpired: false,
                  endDate: sub.endDate,
                });
              });
          }
        } else {
          // No subscription at all — fall back to free-plan feature restrictions
          const { features: freePlanFeatures, invoiceLimit: freePlanInvoiceLimit, customerLimit: freePlanCustomerLimit } =
            await fetchFreePlanInfo();
          apiFetch('/business/stats')
            .then((statsRes: any) => {
              setPlanInfo({
                name: 'Free',
                invoicesUsed: statsRes?.data?.invoicesThisMonth ?? 0,
                invoiceLimit: freePlanInvoiceLimit,
                customersUsed: statsRes?.data?.activeCustomers ?? 0,
                customerLimit: freePlanCustomerLimit,
                features: freePlanFeatures,
                isExpired: true,
              });
            })
            .catch(() => {
              setPlanInfo({
                name: 'Free',
                invoicesUsed: 0,
                invoiceLimit: freePlanInvoiceLimit,
                customersUsed: 0,
                customerLimit: freePlanCustomerLimit,
                features: freePlanFeatures,
                isExpired: true,
              });
            });
        }
      })
      .catch(() => {});
  }, [router, pathname]);

  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  const isNavEnabled = (href: string): boolean => {
    const requiredKeywords = NAV_FEATURE_REQUIREMENTS[href];
    if (!requiredKeywords) return true; // No requirement — always accessible
    if (!planInfo) return true; // Still loading — show as enabled to avoid flicker
    // When expired, planInfo.features contains free-plan features, so routes whose
    // keywords are absent from the free plan will be naturally locked here.
    return requiredKeywords.some(keyword =>
      planInfo.features.some(f => f.toLowerCase().includes(keyword.toLowerCase()))
    );
  };

  // Returns false when the admin has globally disabled the module for this nav route.
  // While the modules list is still loading (null), we show all items to avoid flicker.
  const isModuleGloballyActive = (href: string): boolean => {
    const slug = NAV_MODULE_SLUG[href];
    if (!slug) return true; // No module mapping (e.g. /dashboard) — always show
    if (activeModuleSlugs === null) return true; // Still loading
    return activeModuleSlugs.has(slug);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/auth/login';
  };

  const handleSetupComplete = (updated: BizSettings) => {
    setSetupRequired(false);
    setSetupSettings(null);
    if (updated?.name) setBusinessName(updated.name);
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
            if (!isModuleGloballyActive(item.href)) return null;
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
        {planInfo && (() => {
          const isPremium = !planInfo.isExpired && planInfo.name.toLowerCase() !== 'free';
          const invoiceLimitReached = planInfo.invoiceLimit > 0 && planInfo.invoicesUsed >= planInfo.invoiceLimit;

          if (isPremium) {
            return (
              <div className="mb-3 rounded-xl p-3.5 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 border border-indigo-700 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Crown className="h-3.5 w-3.5 text-amber-400" />
                    <p className="text-xs font-bold text-white">{planInfo.name} Plan</p>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded-full tracking-wide">PREMIUM</span>
                </div>
                {planInfo.invoiceLimit > 0 && (
                  <>
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-[11px] text-indigo-200">{planInfo.invoicesUsed}/{planInfo.invoiceLimit} invoices used</p>
                      <p className="text-[11px] font-semibold text-amber-300">
                        {Math.max(0, planInfo.invoiceLimit - planInfo.invoicesUsed)} left
                      </p>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-indigo-700/60 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all"
                        style={{ width: `${Math.min(100, (planInfo.invoicesUsed / planInfo.invoiceLimit) * 100)}%` }}
                      />
                    </div>
                  </>
                )}
                {planInfo.endDate && (
                  <p className="text-[11px] text-indigo-300 mt-1.5">
                    Expires {new Date(planInfo.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
                {planInfo.customerLimit > 0 && (
                  <p className="text-[11px] text-indigo-300 mt-0.5">
                    {planInfo.customersUsed}/{planInfo.customerLimit} customers
                  </p>
                )}
                <Link
                  href="/settings/billing"
                  className="mt-2.5 block text-center rounded-lg py-1.5 text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-amber-900 hover:from-amber-500 hover:to-amber-600 transition-all shadow-sm"
                >
                  Manage Plan
                </Link>
              </div>
            );
          }

          const invoiceBarColor = invoiceLimitReached ? 'bg-red-500' : planInfo.isExpired ? 'bg-orange-500' : planInfo.invoicesUsed / planInfo.invoiceLimit >= INVOICE_USAGE_WARNING_RATIO ? 'bg-amber-500' : 'bg-indigo-500';
          const invoiceTextColor = invoiceLimitReached ? 'text-red-600' : planInfo.isExpired ? 'text-orange-600' : 'text-indigo-600';
          return (
          <div className={`mb-3 rounded-lg p-3 border ${planInfo.isExpired ? 'bg-red-50 border-red-300' : invoiceLimitReached ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
            <p className="text-xs font-semibold text-gray-800">{planInfo.name} Plan</p>
            {planInfo.isExpired ? (
              <>
                <p className="text-xs text-red-600 font-medium mt-1">Plan expired — free tier active</p>
                {planInfo.endDate && (
                  <p className="text-xs text-red-500 mt-0.5">
                    Expired on {new Date(planInfo.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
                {planInfo.invoiceLimit > 0 && (
                  <>
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-xs text-gray-600">{planInfo.invoicesUsed}/{planInfo.invoiceLimit} invoices used</p>
                      <p className={`text-xs font-semibold ${invoiceTextColor}`}>
                        {Math.max(0, planInfo.invoiceLimit - planInfo.invoicesUsed)} left
                      </p>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${invoiceBarColor}`}
                        style={{ width: `${Math.min(100, (planInfo.invoicesUsed / planInfo.invoiceLimit) * 100)}%` }}
                      />
                    </div>
                  </>
                )}
                {planInfo.customerLimit > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {planInfo.customersUsed}/{planInfo.customerLimit} customers
                  </p>
                )}
              </>
            ) : planInfo.invoiceLimit > 0 ? (
              <>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-xs text-gray-600">{planInfo.invoicesUsed}/{planInfo.invoiceLimit} invoices used</p>
                  <p className={`text-xs font-semibold ${invoiceTextColor}`}>
                    {Math.max(0, planInfo.invoiceLimit - planInfo.invoicesUsed)} left
                  </p>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${invoiceBarColor}`}
                    style={{ width: `${Math.min(100, (planInfo.invoicesUsed / planInfo.invoiceLimit) * 100)}%` }}
                  />
                </div>
                {planInfo.endDate && (
                  <p className="text-xs text-gray-400 mt-1">
                    Expires {new Date(planInfo.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </>
            ) : null}
            {!planInfo.isExpired && planInfo.customerLimit > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {planInfo.customersUsed}/{planInfo.customerLimit} customers
              </p>
            )}
            <Link
              href="/settings/billing"
              className={`mt-2 block text-center rounded-md py-1 text-xs font-semibold text-white ${planInfo.isExpired ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}
            >
              {planInfo.isExpired ? 'Renew Plan' : 'Upgrade'}
            </Link>
          </div>
          );
        })()}
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {businessLogo ? (
              <img src={businessLogo} alt={businessName || 'Business'} className="h-full w-full object-contain" />
            ) : (
              <span className="text-white text-xs font-bold">{initials}</span>
            )}
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
            {(() => {
              const invoiceBlocked = planInfo?.isExpired || (planInfo?.invoiceLimit > 0 && planInfo.invoicesUsed >= planInfo.invoiceLimit);
              return invoiceBlocked ? (
                <Link
                  href="/settings/billing"
                  aria-disabled="true"
                  title={planInfo?.isExpired ? 'Plan expired — renew to create invoices' : 'Invoice limit reached — upgrade to create more invoices'}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-gray-300 px-3.5 py-2 text-sm font-semibold text-gray-500 pointer-events-none"
                >
                  <Lock className="h-3.5 w-3.5" />
                  New Invoice
                </Link>
              ) : (
                <Link
                  href="/invoices/new"
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  <FileText className="h-3.5 w-3.5" />
                  New Invoice
                </Link>
              );
            })()}

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

      {/* Business Profile Setup Modal */}
      {setupRequired && setupSettings && (
        <BusinessProfileSetupModal
          settings={setupSettings}
          onComplete={handleSetupComplete}
        />
      )}
    </div>
  );
}
