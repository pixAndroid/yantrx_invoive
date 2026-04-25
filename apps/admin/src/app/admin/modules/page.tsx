'use client';

import { useState, useEffect } from 'react';
import { Zap, AlertCircle, RefreshCw, Lock, Plus, Trash2, X, Check, ChevronUp, ChevronDown } from 'lucide-react';
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
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', slug: '', requiredPlan: '', sortOrder: '0' });
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const createModule = async () => {
    if (!createForm.name || !createForm.slug) return;
    setCreating(true);
    try {
      const token = getAdminToken();
      const res = await fetch(`${API_URL}/admin/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: createForm.name, slug: createForm.slug, requiredPlan: createForm.requiredPlan || null, sortOrder: parseInt(createForm.sortOrder) || 0 }),
      });
      const data = await res.json();
      if (data.success) { setShowCreate(false); setCreateForm({ name: '', slug: '', requiredPlan: '', sortOrder: '0' }); fetchModules(); }
    } catch {} finally { setCreating(false); }
  };

  const deleteModule = async (id: string) => {
    if (!confirm('Delete this module?')) return;
    setDeletingId(id);
    try {
      const token = getAdminToken();
      await fetch(`${API_URL}/admin/modules/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      setModules(prev => prev.filter(m => m.id !== id));
    } catch {} finally { setDeletingId(null); }
  };

  const moveModule = async (id: string, direction: 'up' | 'down') => {
    const sorted = [...modules].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex(m => m.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const current = sorted[idx];
    const neighbor = sorted[swapIdx];
    const newCurrentOrder = neighbor.sortOrder;
    const newNeighborOrder = current.sortOrder;

    try {
      await Promise.all([
        adminFetch(`/admin/modules/${current.id}`, {
          method: 'PUT',
          body: JSON.stringify({ sortOrder: newCurrentOrder }),
        }),
        adminFetch(`/admin/modules/${neighbor.id}`, {
          method: 'PUT',
          body: JSON.stringify({ sortOrder: newNeighborOrder }),
        }),
      ]);
      setModules(prev => prev.map(m => {
        if (m.id === current.id) return { ...m, sortOrder: newCurrentOrder };
        if (m.id === neighbor.id) return { ...m, sortOrder: newNeighborOrder };
        return m;
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to reorder modules');
    }
  };

  const planBadge: Record<string, string> = {
    starter: 'bg-blue-900/30 text-blue-400 border-blue-800',
    pro: 'bg-indigo-900/30 text-indigo-400 border-indigo-800',
    business: 'bg-purple-900/30 text-purple-400 border-purple-800',
  };

  return (
    <div className="p-6">
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl shadow-xl p-5 z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">New Module</h3>
              <button onClick={() => setShowCreate(false)}><X className="h-4 w-4 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              {[{ label: 'Module Name', key: 'name', ph: 'Invoicing' }, { label: 'Slug', key: 'slug', ph: 'invoicing' }, { label: 'Required Plan', key: 'requiredPlan', ph: 'starter (optional)' }, { label: 'Sort Order', key: 'sortOrder', ph: '0' }].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-400 mb-1">{f.label}</label>
                  <input value={(createForm as any)[f.key]} onChange={e => setCreateForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.ph}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none" />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowCreate(false)} className="flex-1 rounded-lg border border-gray-700 py-2 text-sm text-gray-400">Cancel</button>
              <button onClick={createModule} disabled={creating} className="flex-1 rounded-lg bg-orange-600 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {creating ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : <Check className="h-4 w-4" />}
                Create Module
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Modules</h1>
          <p className="text-gray-400 mt-1">Manage platform feature modules</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchModules} className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700">
            <Plus className="h-4 w-4" /> New Module
          </button>
        </div>
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
          {[...modules].sort((a, b) => a.sortOrder - b.sortOrder).map((mod, idx, sorted) => (
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

                <div className="flex items-center gap-1">
                  <div className="flex flex-col">
                    <button
                      onClick={() => moveModule(mod.id, 'up')}
                      disabled={idx === 0}
                      title="Move up in sidebar"
                      className="p-0.5 rounded text-gray-500 hover:text-gray-200 disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => moveModule(mod.id, 'down')}
                      disabled={idx === sorted.length - 1}
                      title="Move down in sidebar"
                      className="p-0.5 rounded text-gray-500 hover:text-gray-200 disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
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
              </div>

              {mod.requiredPlan && (
                <div className="mt-3 flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-gray-600" />
                  <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${planBadge[mod.requiredPlan] || 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                    {mod.requiredPlan}+
                  </span>
                </div>
              )}
              {!mod.isCore && (
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <button onClick={() => deleteModule(mod.id)} disabled={deletingId === mod.id}
                    className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1 disabled:opacity-50">
                    <Trash2 className="h-3 w-3" /> Delete Module
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-amber-800/50 bg-amber-900/10 p-4">
        <p className="text-sm text-amber-300">
          <strong>Note:</strong> Core modules are always enabled and cannot be disabled. Use the ↑↓ arrows to reorder the client sidebar menu.
        </p>
      </div>
    </div>
  );
}
