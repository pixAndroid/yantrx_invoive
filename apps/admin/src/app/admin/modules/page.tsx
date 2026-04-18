'use client';

import { useState, useEffect } from 'react';
import { Zap, AlertCircle, RefreshCw, Lock } from 'lucide-react';
import { adminFetch, API_URL, getAdminToken } from '@/lib/api';

interface Module {
  id: string;
  name: string;
  slug: string;
  isCore: boolean;
  isActive: boolean;
  sortOrder: number;
  requiredPlan: string | null;
}

export default function AdminModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchModules = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminFetch<{ data: Module[] }>('/admin/modules');
      setModules(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchModules(); }, []);

  const toggleModule = async (id: string, isActive: boolean) => {
    setTogglingId(id);
    try {
      const token = getAdminToken();
      const res = await fetch(`${API_URL}/admin/modules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: !isActive }),
      });
      const data = await res.json();
      if (data.success) {
        setModules(prev => prev.map(m => m.id === id ? { ...m, isActive: !isActive } : m));
      }
    } catch {}
    setTogglingId(null);
  };

  const planBadge: Record<string, string> = {
    starter: 'bg-blue-900/30 text-blue-400 border-blue-800',
    pro: 'bg-indigo-900/30 text-indigo-400 border-indigo-800',
    business: 'bg-purple-900/30 text-purple-400 border-purple-800',
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Modules</h1>
          <p className="text-gray-400 mt-1">Manage platform feature modules</p>
        </div>
        <button onClick={fetchModules} className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="rounded-2xl border border-gray-800 bg-gray-900 p-6 animate-pulse h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map(mod => (
            <div key={mod.id} className={`rounded-2xl border ${mod.isActive ? 'border-gray-700' : 'border-gray-800 opacity-60'} bg-gray-900 p-5`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${mod.isActive ? 'bg-orange-900/30' : 'bg-gray-800'}`}>
                    <Zap className={`h-5 w-5 ${mod.isActive ? 'text-orange-400' : 'text-gray-600'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">{mod.name}</h3>
                      {mod.isCore && (
                        <span className="text-xs bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded border border-gray-700">core</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-mono">{mod.slug}</p>
                  </div>
                </div>

                <button
                  onClick={() => toggleModule(mod.id, mod.isActive)}
                  disabled={togglingId === mod.id || mod.isCore}
                  title={mod.isCore ? 'Core modules cannot be disabled' : (mod.isActive ? 'Disable module' : 'Enable module')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${mod.isActive ? 'bg-orange-500' : 'bg-gray-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${mod.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {mod.requiredPlan && (
                <div className="mt-3 flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-gray-600" />
                  <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${planBadge[mod.requiredPlan] || 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                    {mod.requiredPlan}+
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-amber-800/50 bg-amber-900/10 p-4">
        <p className="text-sm text-amber-300">
          <strong>Note:</strong> Core modules are always enabled and cannot be disabled. Non-core modules can be toggled on/off globally.
        </p>
      </div>
    </div>
  );
}
