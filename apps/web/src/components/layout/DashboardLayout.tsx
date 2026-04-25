'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FileText, Users, Package, BarChart3,
  LogOut, Bell, Menu, X,
  IndianRupee, Building2, ChevronRight, Lock,
  Receipt, Boxes, UserCircle, Target, Crown,
  Settings, PanelLeftClose, PanelLeft,
  Plus
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { isAuthenticated, getUserData, apiFetch, isSafeImageUrl } from '@/lib/api';
import { BusinessProfileSetupModal, type BusinessSettings as BizSettings } from '@/components/ui/BusinessProfileSetupModal';
import { GlobalSearch } from '@/components/ui/GlobalSearch';

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
  { href: '/settings/billing', label: 'Billing & Plans', icon: IndianRupee },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userData, setUserData] = useState<{ name?: string; email?: string; role?: string }>({});
  const [planInfo, setPlanInfo] = useState<{ name: string; invoicesUsed: number; invoiceLimit: number; customersUsed: number; customerLimit: number; features: string[]; isExpired?: boolean; endDate?: string } | null>(null);
  const [businessLogo, setBusinessLogo] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [setupSettings, setSetupSettings] = useState<BizSettings | null>(null);
  const [setupRequired, setSetupRequired] = useState(false);
  const [activeModuleSlugs, setActiveModuleSlugs] = useState<Set<string> | null>(null);
  const [moduleOrder, setModuleOrder] = useState<string[]>([]);

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
        const modules = res.data || [];
        const slugs = new Set<string>(modules.map(m => m.slug));
        setActiveModuleSlugs(slugs);
        setModuleOrder(modules.map(m => m.slug));
      })
      .catch(() => {
        setActiveModuleSlugs(null);
      });

    apiFetch('/subscriptions')
      .then(async (res: any) => {
        const subs = res.data || [];

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
          const isExpired =
            sub.status === 'EXPIRED' ||
            ((sub.status === 'ACTIVE' || sub.status === 'TRIAL') && new Date(sub.endDate) <= new Date());

          if (isExpired) {
            const { features: freePlanFeatures, invoiceLimit: freePlanInvoiceLimit, customerLimit: freePlanCustomerLimit } =
              await fetchFreePlanInfo();

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
    if (!requiredKeywords) return true;
    if (!planInfo) return true;
    return requiredKeywords.some(keyword =>
      planInfo.features.some(f => f.toLowerCase().includes(keyword.toLowerCase()))
    );
  };

  const isModuleGloballyActive = (href: string): boolean => {
    const slug = NAV_MODULE_SLUG[href];
    if (!slug) return true;
    if (activeModuleSlugs === null) return true;
    return activeModuleSlugs.has(slug);
  };

  const sortedNavItems = useMemo(() => {
    if (moduleOrder.length === 0) return NAV_ITEMS;
    const noSlug = NAV_ITEMS.filter(item => !NAV_MODULE_SLUG[item.href]);
    const withSlug = NAV_ITEMS.filter(item => NAV_MODULE_SLUG[item.href]);
    withSlug.sort((a, b) => {
      const ai = moduleOrder.indexOf(NAV_MODULE_SLUG[a.href]);
      const bi = moduleOrder.indexOf(NAV_MODULE_SLUG[b.href]);
      const aPos = ai === -1 ? Infinity : ai;
      const bPos = bi === -1 ? Infinity : bi;
      return aPos - bPos;
    });
    return [...noSlug, ...withSlug];
  }, [moduleOrder]);

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

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => {
    const collapsed = !mobile && sidebarCollapsed;
    return (
      <div className={`flex h-full flex-col ${mobile ? '' : collapsed ? 'w-16' : 'w-64'} transition-all duration-300`}>
        {/* Logo */}
        <div className={`flex h-16 items-center border-b border-gray-100 ${collapsed ? 'justify-center px-3' : 'px-5'} flex-shrink-0`}>
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
              {businessLogo ? (
                <img src={businessLogo} alt={businessName || 'Business Logo'} className="h-full w-full object-contain" />
              ) : (
                <img src="/yeantrix-labs-logo.svg" alt="Yeantrix Labs" className="h-full w-full object-contain" />
              )}
            </div>
            {!collapsed && (
              <span className="text-base font-bold text-gray-900 truncate">{businessName || 'Yeantrix Labs'}</span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto overflow-x-hidden py-4 ${collapsed ? 'px-2' : 'px-3'}`}>
          {!collapsed && <p className="section-label px-3 mb-2">Main</p>}

          <div className="space-y-0.5">
            {sortedNavItems.map(item => {
              if (!isModuleGloballyActive(item.href)) return null;
              const enabled = isNavEnabled(item.href);
              const active = isActive(item.href);

              if (!enabled) {
                return (
                  <Link
                    key={item.href}
                    href="/settings/billing"
                    onClick={() => mobile && setSidebarOpen(false)}
                    title={`Upgrade to unlock ${item.label}`}
                    className={`nav-item ${collapsed ? 'justify-center' : ''} text-gray-300 hover:bg-gray-50/60`}
                  >
                    <item.icon className="h-4 w-4 text-gray-300 flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        <Lock className="h-3 w-3 text-gray-300" />
                      </>
                    )}
                  </Link>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => mobile && setSidebarOpen(false)}
                  title={collapsed ? item.label : undefined}
                  className={`nav-item relative ${collapsed ? 'justify-center' : ''} ${
                    active ? 'nav-item-active' : 'nav-item-inactive'
                  }`}
                >
                  <item.icon className={`h-4 w-4 flex-shrink-0 ${active ? 'text-indigo-600' : 'text-gray-400'}`} />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {active && <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />}
                    </>
                  )}
                  {collapsed && active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-indigo-500" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Settings section */}
          <div className="mt-6">
            {!collapsed && <p className="section-label px-3 mb-2">Settings</p>}
            {collapsed && <div className="my-3 border-t border-gray-100" />}
            <div className="space-y-0.5">
              {collapsed ? (
                <Link
                  href="/settings"
                  title="Settings"
                  className={`nav-item justify-center ${isActive('/settings') ? 'nav-item-active' : 'nav-item-inactive'}`}
                >
                  <Settings className={`h-4 w-4 flex-shrink-0 ${isActive('/settings') ? 'text-indigo-600' : 'text-gray-400'}`} />
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => setSettingsOpen(!settingsOpen)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-150"
                  >
                    <Settings className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="flex-1 text-left">Settings</span>
                    <ChevronRight className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${settingsOpen ? 'rotate-90' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {settingsOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden pl-3 space-y-0.5"
                      >
                        {SETTINGS_ITEMS.map(item => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => mobile && setSidebarOpen(false)}
                            className={`nav-item ${isActive(item.href) ? 'nav-item-active' : 'nav-item-inactive'}`}
                          >
                            <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive(item.href) ? 'text-indigo-600' : 'text-gray-400'}`} />
                            <span className="flex-1">{item.label}</span>
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* User / Plan section */}
        <div className={`border-t border-gray-100 ${collapsed ? 'p-2' : 'p-3'} flex-shrink-0`}>
          {!collapsed && planInfo && (() => {
            const isPremium = !planInfo.isExpired && planInfo.name.toLowerCase() !== 'free';
            const invoiceLimitReached = planInfo.invoiceLimit > 0 && planInfo.invoicesUsed >= planInfo.invoiceLimit;

            if (isPremium) {
              return (
                <div className="mb-3 rounded-2xl p-3.5 bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 border border-indigo-800/60 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Crown className="h-3.5 w-3.5 text-amber-400" />
                      <p className="text-xs font-bold text-white">{planInfo.name} Plan</p>
                    </div>
                    <span className="text-[10px] font-bold bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded-full tracking-wide">PRO</span>
                  </div>
                  {planInfo.invoiceLimit > 0 && (
                    <>
                      <div className="flex items-center justify-between mt-1.5">
                        <p className="text-[11px] text-indigo-300">{planInfo.invoicesUsed}/{planInfo.invoiceLimit} invoices</p>
                        <p className="text-[11px] font-semibold text-amber-300">{Math.max(0, planInfo.invoiceLimit - planInfo.invoicesUsed)} left</p>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full rounded-full bg-indigo-800/60 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all"
                          style={{ width: `${Math.min(100, (planInfo.invoicesUsed / planInfo.invoiceLimit) * 100)}%` }}
                        />
                      </div>
                    </>
                  )}
                  {planInfo.endDate && (
                    <p className="text-[11px] text-indigo-400 mt-1.5">
                      Expires {new Date(planInfo.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                  <Link href="/settings/billing" className="mt-2.5 block text-center rounded-xl py-1.5 text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 hover:from-amber-500 hover:to-amber-600 transition-all shadow-sm">
                    Manage Plan
                  </Link>
                </div>
              );
            }

            const invoiceBarColor = invoiceLimitReached ? 'bg-red-500' : planInfo.isExpired ? 'bg-orange-500' : planInfo.invoicesUsed / planInfo.invoiceLimit >= INVOICE_USAGE_WARNING_RATIO ? 'bg-amber-500' : 'bg-indigo-500';
            const invoiceTextColor = invoiceLimitReached ? 'text-red-600' : planInfo.isExpired ? 'text-orange-600' : 'text-indigo-600';

            return (
              <div className={`mb-3 rounded-xl p-3 border ${planInfo.isExpired ? 'bg-red-50 border-red-200/80' : invoiceLimitReached ? 'bg-red-50 border-red-200/80' : 'bg-amber-50 border-amber-200/80'}`}>
                <p className="text-xs font-semibold text-gray-800">{planInfo.name} Plan</p>
                {planInfo.isExpired ? (
                  <>
                    <p className="text-xs text-red-600 font-medium mt-1">Expired — free tier active</p>
                    {planInfo.endDate && (
                      <p className="text-xs text-red-500 mt-0.5">
                        Expired {new Date(planInfo.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </>
                ) : null}
                {planInfo.invoiceLimit > 0 && (
                  <>
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-xs text-gray-600">{planInfo.invoicesUsed}/{planInfo.invoiceLimit} invoices</p>
                      <p className={`text-xs font-semibold ${invoiceTextColor}`}>{Math.max(0, planInfo.invoiceLimit - planInfo.invoicesUsed)} left</p>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${invoiceBarColor}`} style={{ width: `${Math.min(100, (planInfo.invoicesUsed / planInfo.invoiceLimit) * 100)}%` }} />
                    </div>
                  </>
                )}
                {!planInfo.isExpired && planInfo.endDate && (
                  <p className="text-xs text-gray-400 mt-1">Expires {new Date(planInfo.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                )}
                {!planInfo.isExpired && planInfo.customerLimit > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5">{planInfo.customersUsed}/{planInfo.customerLimit} customers</p>
                )}
                <Link
                  href="/settings/billing"
                  className={`mt-2 block text-center rounded-lg py-1.5 text-xs font-semibold text-white transition-colors ${planInfo.isExpired ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}
                >
                  {planInfo.isExpired ? 'Renew Plan' : 'Upgrade'}
                </Link>
              </div>
            );
          })()}

          {/* User row */}
          <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : 'px-1 mb-2'}`}>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-white">
              {businessLogo ? (
                <img src={businessLogo} alt={businessName || 'Business'} className="h-full w-full object-contain" />
              ) : (
                <span className="text-white text-xs font-bold">{initials}</span>
              )}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-900 truncate">{displayName}</p>
                {userData.email && <p className="text-[11px] text-gray-400 truncate">{userData.email}</p>}
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all duration-150"
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </button>
          )}
          {collapsed && (
            <button
              onClick={handleLogout}
              title="Log out"
              className="flex items-center justify-center rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all w-full mt-1"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50/80 overflow-hidden print:block print:h-auto print:overflow-visible print:bg-white">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r border-gray-100 bg-white print:hidden transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'} relative`}
        style={{ flexShrink: 0 }}
      >
        <Sidebar />
        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(c => !c)}
          className="absolute -right-3 top-20 z-10 hidden lg:flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm text-gray-400 hover:text-gray-600 hover:shadow-md transition-all duration-150"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed
            ? <PanelLeft className="h-3 w-3" />
            : <PanelLeftClose className="h-3 w-3" />
          }
        </button>
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
              className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'tween', duration: 0.22 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-white shadow-xl lg:hidden"
            >
              <div className="absolute right-3 top-3">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
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
        <header className="flex h-16 items-center border-b border-gray-100 bg-white px-4 lg:px-6 gap-3 print:hidden flex-shrink-0" style={{ boxShadow: '0 1px 0 0 rgb(0 0 0 / 0.04)' }}>
          {/* Mobile menu toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden rounded-xl p-2 text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Global Search */}
          <GlobalSearch />

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            {(() => {
              const invoiceBlocked = planInfo?.isExpired || (planInfo?.invoiceLimit != null && planInfo.invoiceLimit > 0 && planInfo.invoicesUsed >= planInfo.invoiceLimit);
              return invoiceBlocked ? (
                <Link
                  href="/settings/billing"
                  aria-disabled="true"
                  title={planInfo?.isExpired ? 'Plan expired — renew to create invoices' : 'Invoice limit reached — upgrade to create more'}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-gray-100 px-3.5 py-2 text-sm font-semibold text-gray-400 pointer-events-none"
                >
                  <Lock className="h-3.5 w-3.5" />
                  New Invoice
                </Link>
              ) : (
                <Link
                  href="/invoices/new"
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 hover:shadow-md transition-all duration-150 active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Invoice
                </Link>
              );
            })()}

            <button className="relative rounded-xl p-2.5 text-gray-500 hover:bg-gray-100 transition-colors">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

            <div className="h-8 w-8 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 ring-2 ring-gray-100 cursor-pointer hover:ring-indigo-200 transition-all">
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
