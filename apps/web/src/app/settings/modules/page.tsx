'use client';

import { useState, useEffect } from 'react';
import { Zap, Lock, RefreshCw } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Module {
  id: string;
  name: string;
  slug: string;
  isCore: boolean;
  isActive: boolean;
  requiredPlan: string | null;
  sortOrder: number;
}

const MODULE_ICONS: Record<string, string> = {
  invoicing: '🧾',
  gst: '📋',
  customers: '👥',
  products: '📦',
  payments: '💳',
  reports: '📊',
  'gst-reports': '📊',
  purchase_orders: '🛒',
  expenses: '💸',
  inventory: '🏭',
  hrms: '👤',
  crm: '🎯',
};

export default function ModulesSettingsPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ data: Module[] }>('/modules')
      .then(res => setModules(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Feature Modules</h1>
        <p className="text-gray-500 mt-1">Modules available in your plan</p>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {modules.map(mod => (
            <div key={mod.id} className={`rounded-2xl border ${mod.isActive ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'} p-5 shadow-sm`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{MODULE_ICONS[mod.slug] || '⚙️'}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{mod.name}</p>
                    {mod.isCore && <span className="text-xs text-gray-400">Core module</span>}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${mod.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {mod.isActive ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              {mod.requiredPlan && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
                  <Lock className="h-3 w-3" />
                  Requires {mod.requiredPlan} plan or higher
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-700">
          Want to enable more modules? <a href="/settings/billing" className="font-semibold underline">Upgrade your plan</a> to unlock additional features.
        </p>
      </div>
    </div>
  );
}
