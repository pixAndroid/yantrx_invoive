'use client';

import { useState, useEffect, useRef } from 'react';
import { Package, Plus, Edit2, Check, X, AlertCircle, RefreshCw, Star, Trash2, Zap } from 'lucide-react';
import { adminFetch, API_URL, getAdminToken } from '@/lib/api';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  dailyPrice: number | null;
  yearlyPrice: number | null;
  invoiceLimit: number;
  customerLimit: number;
  userLimit: number;
  storageLimit: number;
  durationDays: number | null;
  features: string[];
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
}

interface Module {
  id: string;
  name: string;
  slug: string;
  isCore: boolean;
  isActive: boolean;
}

const DEFAULT_FORM = {
  name: '', slug: '', description: '', price: '0', dailyPrice: '', yearlyPrice: '',
  invoiceLimit: '100', customerLimit: '500', userLimit: '2', storageLimit: '500',
  features: [] as string[],
  isActive: true, isFeatured: false, sortOrder: '0',
  durationMode: 'preset' as 'preset' | 'days' | 'range',
  durationPreset: 'monthly' as 'daily' | 'monthly' | 'yearly',
  durationDays: '',
  durationStart: '',
  durationEnd: '',
};

function PlanModal({ plan, onClose, onSaved }: { plan: Plan | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState(plan ? {
    name: plan.name, slug: plan.slug, description: plan.description || '',
    price: String(plan.price), dailyPrice: String(plan.dailyPrice || ''), yearlyPrice: String(plan.yearlyPrice || ''),
    invoiceLimit: String(plan.invoiceLimit), customerLimit: String(plan.customerLimit),
    userLimit: String(plan.userLimit), storageLimit: String(plan.storageLimit),
    features: plan.features || [],
    isActive: plan.isActive, isFeatured: plan.isFeatured, sortOrder: String(plan.sortOrder),
    durationMode: 'days' as 'preset' | 'days' | 'range',
    durationPreset: 'monthly' as 'daily' | 'monthly' | 'yearly',
    durationDays: plan.durationDays != null ? String(plan.durationDays) : '',
    durationStart: '',
    durationEnd: '',
  } : { ...DEFAULT_FORM, features: [] as string[] });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [modules, setModules] = useState<Module[]>([]);
  const [featureInput, setFeatureInput] = useState('');
  const featureInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    adminFetch<{ data: Module[] }>('/admin/modules')
      .then(res => setModules(res.data))
      .catch(() => {
        // Modules are optional for the quick-add pills; failure is non-fatal
      });
  }, []);

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const addFeature = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setForm(p => ({
      ...p,
      features: p.features.includes(trimmed) ? p.features : [...p.features, trimmed],
    }));
    setFeatureInput('');
    featureInputRef.current?.focus();
  };

  const removeFeature = (index: number) => {
    setForm(p => ({ ...p, features: p.features.filter((_, i) => i !== index) }));
  };

  const toggleModuleFeature = (moduleName: string) => {
    setForm(p => ({
      ...p,
      features: p.features.includes(moduleName)
        ? p.features.filter(f => f !== moduleName)
        : [...p.features, moduleName],
    }));
  };

  const diffDays = (startStr: string, endStr: string): number => {
    // Parse as UTC midnight to avoid DST-induced off-by-one errors
    const start = new Date(startStr + 'T00:00:00Z');
    const end = new Date(endStr + 'T00:00:00Z');
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const resolveDurationDays = (): number | null => {
    if (form.durationMode === 'preset') {
      return form.durationPreset === 'daily' ? 1 : form.durationPreset === 'monthly' ? 30 : 365;
    }
    if (form.durationMode === 'days') {
      const d = parseInt(form.durationDays);
      return d > 0 ? d : null;
    }
    if (form.durationMode === 'range' && form.durationStart && form.durationEnd) {
      const diff = diffDays(form.durationStart, form.durationEnd);
      return diff > 0 ? diff : null;
    }
    return null;
  };

  const handleSave = async () => {
    if (!form.name || !form.slug) { setErr('Name and slug are required'); return; }
    const durationDays = resolveDurationDays();
    if (form.durationMode === 'days' && form.durationDays && durationDays === null) {
      setErr('Duration days must be a positive number'); return;
    }
    if (form.durationMode === 'range') {
      if (!form.durationStart || !form.durationEnd) { setErr('Please select both start and end dates'); return; }
      if (durationDays === null) { setErr('End date must be after start date'); return; }
    }
    setSaving(true); setErr('');
    try {
      const token = getAdminToken();
      const payload = {
        name: form.name, slug: form.slug, description: form.description,
        price: parseFloat(form.price) || 0,
        dailyPrice: form.dailyPrice ? parseFloat(form.dailyPrice) : null,
        yearlyPrice: form.yearlyPrice ? parseFloat(form.yearlyPrice) : null,
        invoiceLimit: parseInt(form.invoiceLimit) || 100,
        customerLimit: parseInt(form.customerLimit) || 500,
        userLimit: parseInt(form.userLimit) || 2,
        storageLimit: parseInt(form.storageLimit) || 500,
        features: form.features,
        isActive: form.isActive, isFeatured: form.isFeatured,
        sortOrder: parseInt(form.sortOrder) || 0,
        durationDays,
      };
      const url = plan ? `${API_URL}/admin/plans/${plan.id}` : `${API_URL}/admin/plans`;
      const method = plan ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!data.success) { setErr(data.error || 'Failed to save'); return; }
      onSaved();
      onClose();
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const inp = (label: string, key: string, type = 'text', ph = '') => (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
      <input type={type} value={(form as any)[key]} onChange={e => set(key, e.target.value)} placeholder={ph}
        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl shadow-xl p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">{plan ? 'Edit Plan' : 'New Plan'}</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-gray-400" /></button>
        </div>
        {err && <div className="mb-3 text-xs text-red-400 bg-red-900/20 rounded px-3 py-2">{err}</div>}
        <div className="grid grid-cols-2 gap-3">
          {inp('Plan Name *', 'name', 'text', 'Pro')}
          {inp('Slug *', 'slug', 'text', 'pro')}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
            <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="For growing businesses"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none" />
          </div>
          {inp('Monthly Price (₹)', 'price', 'number', '999')}
          {inp('Daily Price (₹)', 'dailyPrice', 'number', '10')}
          {inp('Yearly Price (₹)', 'yearlyPrice', 'number', '9999')}
          {inp('Invoice Limit', 'invoiceLimit', 'number', '500')}
          {inp('Customer Limit', 'customerLimit', 'number', '1000')}
          {inp('User Limit', 'userLimit', 'number', '5')}
          {inp('Storage (MB)', 'storageLimit', 'number', '2048')}
          {inp('Sort Order', 'sortOrder', 'number', '1')}
          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} className="rounded border-gray-600" />
              Active
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={e => set('isFeatured', e.target.checked)} className="rounded border-gray-600" />
              Featured
            </label>
          </div>

          {/* ── Plan Duration Section ── */}
          <div className="col-span-2 mt-1">
            <label className="block text-xs font-medium text-gray-400 mb-2">Plan Duration</label>
            {/* Mode tabs */}
            <div className="flex gap-1 mb-3 rounded-lg bg-gray-800 p-1">
              {(['preset', 'days', 'range'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => set('durationMode', mode)}
                  className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                    form.durationMode === mode
                      ? 'bg-orange-600 text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {mode === 'preset' ? 'Preset' : mode === 'days' ? 'Total Days' : 'Date Range'}
                </button>
              ))}
            </div>

            {form.durationMode === 'preset' && (
              <select
                value={form.durationPreset}
                onChange={e => set('durationPreset', e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="daily">Daily (1 day)</option>
                <option value="monthly">Monthly (30 days)</option>
                <option value="yearly">Yearly (365 days)</option>
              </select>
            )}

            {form.durationMode === 'days' && (
              <div>
                <input
                  type="number"
                  min="1"
                  value={form.durationDays}
                  onChange={e => set('durationDays', e.target.value)}
                  placeholder="e.g. 90"
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                />
                {form.durationDays && parseInt(form.durationDays) > 0 && (
                  <p className="mt-1 text-xs text-gray-500">≈ {(parseInt(form.durationDays) / 30).toFixed(1)} months</p>
                )}
              </div>
            )}

            {form.durationMode === 'range' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={form.durationStart}
                    onChange={e => set('durationStart', e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={form.durationEnd}
                    onChange={e => set('durationEnd', e.target.value)}
                    min={form.durationStart || undefined}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
                {form.durationStart && form.durationEnd && (() => {
                  const days = diffDays(form.durationStart, form.durationEnd);
                  return days > 0 ? (
                    <p className="col-span-2 text-xs text-orange-400">{days} day{days !== 1 ? 's' : ''} selected</p>
                  ) : days <= 0 ? (
                    <p className="col-span-2 text-xs text-red-400">End date must be after start date</p>
                  ) : null;
                })()}
              </div>
            )}
          </div>

          {/* ── Features Section ── */}
          <div className="col-span-2 mt-1">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-400">
                Features
                <span className="ml-1.5 text-gray-600">({form.features.length} added)</span>
              </label>
              {form.features.length > 0 && (
                <button
                  type="button"
                  onClick={() => set('features', [])}
                  className="text-xs text-gray-600 hover:text-red-400"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Added features list */}
            <div className="rounded-lg border border-gray-700 bg-gray-800 p-3 min-h-[64px]">
              {form.features.length === 0 ? (
                <p className="text-xs text-gray-600 italic">No features added yet. Use the input below or pick modules.</p>
              ) : (
                <ul className="space-y-1.5">
                  {form.features.map((f, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 group">
                      <span className="flex items-center gap-1.5 text-xs text-gray-300">
                        <Check className="h-3 w-3 text-green-500 shrink-0" />
                        {f}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFeature(i)}
                        className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        title="Remove feature"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Custom feature input */}
            <div className="flex gap-2 mt-2">
              <input
                ref={featureInputRef}
                type="text"
                value={featureInput}
                onChange={e => setFeatureInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature(featureInput); } }}
                placeholder="Type a feature and press Enter or +"
                className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => addFeature(featureInput)}
                className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Modules as quick-add pills */}
            {modules.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <Zap className="h-3 w-3 text-orange-400" /> Quick-add modules
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {modules.map(mod => {
                    const active = form.features.includes(mod.name);
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => toggleModuleFeature(mod.name)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs border transition-colors ${
                          active
                            ? 'bg-orange-600/20 border-orange-500 text-orange-300'
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                        }`}
                      >
                        {active ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                        {mod.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 rounded-lg border border-gray-700 py-2 text-sm text-gray-400 hover:text-gray-200">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 rounded-lg bg-orange-600 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : <Check className="h-4 w-4" />}
            {plan ? 'Save Changes' : 'Create Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPlans = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminFetch<{ data: Plan[] }>('/admin/plans');
      setPlans(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const savePrice = async (planId: string) => {
    setSaving(true);
    try {
      const token = getAdminToken();
      const res = await fetch(`${API_URL}/admin/plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ price: parseFloat(editPrice) }),
      });
      const data = await res.json();
      if (data.success) {
        setPlans(prev => prev.map(p => p.id === planId ? { ...p, price: parseFloat(editPrice) } : p));
        setEditingId(null);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const togglePlan = async (planId: string, isActive: boolean) => {
    try {
      const token = getAdminToken();
      await fetch(`${API_URL}/admin/plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: !isActive }),
      });
      setPlans(prev => prev.map(p => p.id === planId ? { ...p, isActive: !isActive } : p));
    } catch {}
  };

  const deletePlan = async (planId: string) => {
    if (!confirm('Delete this plan? This cannot be undone.')) return;
    setDeletingId(planId);
    try {
      const token = getAdminToken();
      await fetch(`${API_URL}/admin/plans/${planId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      setPlans(prev => prev.filter(p => p.id !== planId));
    } catch {} finally { setDeletingId(null); }
  };

  const planColorMap: Record<string, { border: string; header: string }> = {
    free: { border: 'border-gray-700', header: 'bg-gray-800/50' },
    starter: { border: 'border-blue-800/50', header: 'bg-blue-900/20' },
    pro: { border: 'border-indigo-800/50', header: 'bg-indigo-900/20' },
    business: { border: 'border-purple-800/50', header: 'bg-purple-900/20' },
  };

  return (
    <div className="p-6">
      {showModal && (
        <PlanModal plan={editPlan} onClose={() => { setShowModal(false); setEditPlan(null); }} onSaved={fetchPlans} />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Plans</h1>
          <p className="text-gray-400 mt-1">Manage pricing plans and features</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchPlans} className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button onClick={() => { setEditPlan(null); setShowModal(true); }} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700">
            <Plus className="h-4 w-4" /> New Plan
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-800 bg-gray-900 p-6 animate-pulse h-64" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">No plans found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map(plan => {
            const colors = planColorMap[plan.slug] || planColorMap.free;
            return (
              <div key={plan.id} className={`rounded-2xl border ${colors.border} bg-gray-900 overflow-hidden`}>
                <div className={`p-5 ${colors.header} border-b border-gray-800`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{plan.name}</h3>
                        {plan.isFeatured && <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{plan.description}</p>
                    </div>
                    <button
                      onClick={() => togglePlan(plan.id, plan.isActive)}
                      className={`text-xs px-2 py-0.5 rounded-full border ${plan.isActive ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-red-900/30 text-red-400 border-red-800'}`}
                    >
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  {(() => {
                    const slugLower = plan.slug.toLowerCase();
                    const displayPrice = slugLower === 'daily'
                      ? { amount: plan.dailyPrice ?? plan.price, unit: '/day' }
                      : (slugLower === 'yearly' || slugLower === 'yealty')
                      ? { amount: plan.yearlyPrice ?? plan.price, unit: '/yr' }
                      : { amount: plan.price, unit: '/mo' };
                    return (
                      <div className="flex items-baseline gap-1 mt-3">
                        {editingId === plan.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">₹</span>
                            <input
                              type="number"
                              value={editPrice}
                              onChange={e => setEditPrice(e.target.value)}
                              className="w-24 rounded-lg border border-gray-600 bg-gray-800 px-2 py-1 text-lg font-bold text-white focus:border-orange-500 focus:outline-none"
                              autoFocus
                            />
                            <button onClick={() => savePrice(plan.id)} disabled={saving} className="text-green-400 hover:text-green-300">
                              <Check className="h-4 w-4" />
                            </button>
                            <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-300">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="text-2xl font-bold text-white">
                              {(displayPrice.amount ?? 0) === 0 ? 'Free' : `₹${displayPrice.amount}`}
                            </span>
                            {(displayPrice.amount ?? 0) > 0 && <span className="text-xs text-gray-500">{displayPrice.unit}</span>}
                            <button
                              onClick={() => { setEditingId(plan.id); setEditPrice(String(displayPrice.amount ?? plan.price)); }}
                              className="ml-1 text-gray-600 hover:text-gray-400"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="p-4">
                  <div className="space-y-1.5 mb-4">
                    <p className="text-xs text-gray-500">{plan.invoiceLimit >= 999999 ? 'Unlimited' : plan.invoiceLimit} invoices/mo</p>
                    <p className="text-xs text-gray-500">{plan.customerLimit >= 999999 ? 'Unlimited' : plan.customerLimit} customers</p>
                    <p className="text-xs text-gray-500">{plan.userLimit} team member{plan.userLimit !== 1 ? 's' : ''}</p>
                    <p className="text-xs text-gray-500">{plan.storageLimit}MB storage</p>
                    {plan.durationDays != null && (
                      <p className="text-xs text-orange-400">
                        {plan.durationDays === 1 ? 'Daily (1 day)' : plan.durationDays === 30 ? 'Monthly (30 days)' : plan.durationDays === 365 ? 'Yearly (365 days)' : `${plan.durationDays} days`}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    {plan.features.slice(0, 4).map((f, i) => (
                      <p key={i} className="text-xs text-gray-400 flex items-start gap-1.5">
                        <span className="text-green-500 mt-0.5">✓</span> {f}
                      </p>
                    ))}
                    {plan.features.length > 4 && (
                      <p className="text-xs text-gray-600">+{plan.features.length - 4} more features</p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-800">
                    <button onClick={() => { setEditPlan(plan); setShowModal(true); }}
                      className="flex-1 rounded-lg border border-gray-700 py-1.5 text-xs text-gray-400 hover:text-gray-200 flex items-center justify-center gap-1">
                      <Edit2 className="h-3 w-3" /> Edit
                    </button>
                    <button onClick={() => deletePlan(plan.id)} disabled={deletingId === plan.id}
                      className="flex-1 rounded-lg border border-red-900 py-1.5 text-xs text-red-500 hover:text-red-400 flex items-center justify-center gap-1 disabled:opacity-50">
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
