'use client';

import { useState, useEffect, type ElementType } from 'react';
import {
  LayoutDashboard, FileText, Users, Package, BarChart3,
  IndianRupee, Receipt, Boxes, UserCircle, Target,
  ChevronUp, ChevronDown, Eye, EyeOff, RefreshCw,
  AlertCircle, Lock, LayoutList,
} from 'lucide-react';
import { adminFetch } from '@/lib/api';

interface Module {
  id: string;
  name: string;
  slug: string;
  isCore: boolean;
  isActive: boolean;
  sortOrder: number;
  requiredPlan: string | null;
}

// Maps module slug → web-app sidebar item metadata
const SLUG_META: Record<string, { label: string; href: string; Icon: ElementType }> = {
  invoicing:    { label: 'Invoices',   href: '/invoices',   Icon: FileText },
  customers:    { label: 'Customers',  href: '/customers',  Icon: Users },
  products:     { label: 'Products',   href: '/products',   Icon: Package },
  'gst-reports':{ label: 'Reports',    href: '/reports',    Icon: BarChart3 },
  payments:     { label: 'Payments',   href: '/payments',   Icon: IndianRupee },
  expenses:     { label: 'Expenses',   href: '/expenses',   Icon: Receipt },
  inventory:    { label: 'Inventory',  href: '/inventory',  Icon: Boxes },
  hrms:         { label: 'HRM',        href: '/hrm',        Icon: UserCircle },
  crm:          { label: 'CRM',        href: '/crm',        Icon: Target },
};

// Items that are always shown in the web sidebar regardless of modules
const PINNED_ITEMS: Array<{ label: string; href: string; Icon: ElementType }> = [
  { label: 'Dashboard', href: '/dashboard', Icon: LayoutDashboard },
];

export default function SidebarMenusPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchModules = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminFetch<{ data: Module[] }>('/admin/modules');
      setModules(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load modules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchModules(); }, []);

  // Only show modules that have a known sidebar mapping
  const sidebarModules = [...modules]
    .filter(m => SLUG_META[m.slug])
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const toggleVisibility = async (mod: Module) => {
    if (mod.isCore) return;
    setSavingId(mod.id);
    try {
      await adminFetch(`/admin/modules/${mod.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !mod.isActive }),
      });
      setModules(prev => prev.map(m => m.id === mod.id ? { ...m, isActive: !mod.isActive } : m));
    } catch (err: any) {
      setError(err.message || 'Failed to update module');
    } finally {
      setSavingId(null);
    }
  };

  const moveItem = async (id: string, direction: 'up' | 'down') => {
    const sorted = [...sidebarModules];
    const idx = sorted.findIndex(m => m.id === id);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const current = sorted[idx];
    const neighbor = sorted[swapIdx];
    // Optimistically update UI
    setModules(prev => prev.map(m => {
      if (m.id === current.id) return { ...m, sortOrder: neighbor.sortOrder };
      if (m.id === neighbor.id) return { ...m, sortOrder: current.sortOrder };
      return m;
    }));
    setSavingId(current.id);
    try {
      await Promise.all([
        adminFetch(`/admin/modules/${current.id}`, {
          method: 'PUT',
          body: JSON.stringify({ sortOrder: neighbor.sortOrder }),
        }),
        adminFetch(`/admin/modules/${neighbor.id}`, {
          method: 'PUT',
          body: JSON.stringify({ sortOrder: current.sortOrder }),
        }),
      ]);
    } catch (err: any) {
      // Rollback optimistic update on failure
      setModules(prev => prev.map(m => {
        if (m.id === current.id) return { ...m, sortOrder: current.sortOrder };
        if (m.id === neighbor.id) return { ...m, sortOrder: neighbor.sortOrder };
        return m;
      }));
      setError(err.message || 'Failed to reorder menu items');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Sidebar Menus</h1>
          <p className="text-gray-400 mt-1">
            Control which menu items appear in the client web app sidebar and their display order.
          </p>
        </div>
        <button
          onClick={fetchModules}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left: Management Table ── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
            Menu Items
          </h2>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-gray-800 bg-gray-900 p-4 animate-pulse h-16" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Pinned items (always visible, fixed position) */}
              {PINNED_ITEMS.map(item => (
                <div
                  key={item.href}
                  className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-3"
                >
                  <Lock className="h-4 w-4 text-gray-700 flex-shrink-0" title="Fixed position — cannot be moved" />
                  <item.Icon className="h-4 w-4 text-gray-500" />
                  <span className="flex-1 text-sm font-medium text-gray-400">{item.label}</span>
                  <span className="text-[10px] bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full border border-gray-700">
                    always visible
                  </span>
                </div>
              ))}

              {/* Module-backed items */}
              {sidebarModules.map((mod, idx) => {
                const meta = SLUG_META[mod.slug];
                const isSaving = savingId === mod.id;
                return (
                  <div
                    key={mod.id}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-opacity ${
                      mod.isActive ? 'border-gray-700 bg-gray-900' : 'border-gray-800 bg-gray-900/50 opacity-60'
                    }`}
                  >
                    <GripVertical className="h-4 w-4 text-gray-600 flex-shrink-0" />
                    <meta.Icon className={`h-4 w-4 flex-shrink-0 ${mod.isActive ? 'text-orange-400' : 'text-gray-600'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{meta.label}</p>
                      <p className="text-xs text-gray-500 font-mono">{mod.slug}</p>
                    </div>

                    {mod.requiredPlan && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Lock className="h-3 w-3 text-gray-600" />
                        <span className="text-[10px] text-gray-500 capitalize">{mod.requiredPlan}+</span>
                      </div>
                    )}

                    {/* Reorder buttons */}
                    <div className="flex flex-col flex-shrink-0">
                      <button
                        onClick={() => moveItem(mod.id, 'up')}
                        disabled={idx === 0 || isSaving}
                        title="Move up"
                        className="p-0.5 rounded text-gray-500 hover:text-gray-200 disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => moveItem(mod.id, 'down')}
                        disabled={idx === sidebarModules.length - 1 || isSaving}
                        title="Move down"
                        className="p-0.5 rounded text-gray-500 hover:text-gray-200 disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Visibility toggle */}
                    <button
                      onClick={() => toggleVisibility(mod)}
                      disabled={mod.isCore || isSaving}
                      title={mod.isCore ? 'Core modules cannot be hidden' : (mod.isActive ? 'Hide from sidebar' : 'Show in sidebar')}
                      className={`flex-shrink-0 rounded-lg p-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        mod.isActive
                          ? 'text-green-400 hover:bg-green-900/20'
                          : 'text-gray-600 hover:bg-gray-800'
                      }`}
                    >
                      {mod.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <p className="mt-4 text-xs text-gray-500">
            Use ↑↓ arrows to reorder. Click the eye icon to show/hide items. Core items cannot be hidden.
          </p>
        </div>

        {/* ── Right: Live Sidebar Preview ── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
            Live Preview
          </h2>
          <div className="rounded-2xl border border-gray-700 bg-gray-900 overflow-hidden shadow-xl">
            {/* Mock browser chrome */}
            <div className="flex h-10 items-center gap-2 px-4 border-b border-gray-800 bg-gray-950">
              <div className="h-3 w-3 rounded-full bg-red-500/60" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
              <div className="h-3 w-3 rounded-full bg-green-500/60" />
              <div className="ml-3 flex-1 h-5 rounded-md bg-gray-800" />
            </div>
            <div className="flex">
              {/* Simulated sidebar */}
              <div className="w-52 border-r border-gray-800 bg-gray-950 p-3 space-y-1 min-h-[420px]">
                {/* Brand */}
                <div className="flex items-center gap-2 px-2 py-2 mb-3 border-b border-gray-800">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">Y</span>
                  </div>
                  <span className="text-sm font-bold text-white">Yantrix</span>
                </div>

                {/* Pinned items */}
                {PINNED_ITEMS.map(item => (
                  <div
                    key={item.href}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 bg-indigo-950/60 text-indigo-300"
                  >
                    <item.Icon className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </div>
                ))}

                {/* Module-backed items (active only) */}
                {loading ? (
                  <div className="space-y-1 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-7 rounded-lg bg-gray-800 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  sidebarModules
                    .filter(m => m.isActive)
                    .map(mod => {
                      const meta = SLUG_META[mod.slug];
                      return (
                        <div
                          key={mod.id}
                          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-gray-400 hover:bg-gray-800/50"
                        >
                          <meta.Icon className="h-3.5 w-3.5 text-gray-500" />
                          <span className="text-xs font-medium">{meta.label}</span>
                        </div>
                      );
                    })
                )}

                {/* Settings section */}
                <div className="pt-3 mt-2 border-t border-gray-800">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600 px-2 mb-1">
                    Settings
                  </p>
                  <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-gray-500">
                    <LayoutList className="h-3.5 w-3.5" />
                    <span className="text-xs">Business Settings</span>
                  </div>
                </div>
              </div>

              {/* Mock main content area */}
              <div className="flex-1 bg-gray-950 p-4">
                <div className="h-5 w-32 rounded bg-gray-800 mb-3" />
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-3 rounded bg-gray-800/60" style={{ width: `${70 - i * 10}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            This preview reflects the current visibility and order of sidebar items in the client web app.
          </p>
        </div>
      </div>
    </div>
  );
}
