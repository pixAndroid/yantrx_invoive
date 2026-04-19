'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, TrendingUp, Target, PhoneCall, Mail, MessageSquare, Calendar,
  Plus, Search, X, Check, RefreshCw, Edit2, Trash2, ChevronRight,
  Activity, BarChart2, Briefcase, Phone, ArrowRight
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string;
  status: string;
  value: number | null;
  notes: string | null;
  tags: string[];
  expectedCloseDate: string | null;
  createdAt: string;
  _count?: { activities: number; deals: number };
}

interface Deal {
  id: string;
  title: string;
  leadId: string | null;
  value: number | null;
  stage: string;
  probability: number;
  expectedCloseDate: string | null;
  closedAt: string | null;
  notes: string | null;
  createdAt: string;
  lead?: { id: string; name: string; company: string | null } | null;
  _count?: { activities: number };
}

interface CRMActivity {
  id: string;
  type: string;
  subject: string;
  description: string | null;
  leadId: string | null;
  dealId: string | null;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  lead?: { id: string; name: string } | null;
  deal?: { id: string; title: string } | null;
}

interface CRMStats {
  totalLeads: number;
  newLeadsThisMonth: number;
  wonLeads: number;
  lostLeads: number;
  conversionRate: number;
  totalDeals: number;
  openDeals: number;
  openDealValue: number;
  leadsByStatus: { status: string; count: number }[];
  dealsByStage: { stage: string; count: number; value: number }[];
  recentLeads: Lead[];
  recentActivities: CRMActivity[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
const LEAD_SOURCES = ['WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'COLD_CALL', 'EMAIL', 'WALK_IN', 'OTHER'];
const DEAL_STAGES = ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
const ACTIVITY_TYPES = ['CALL', 'EMAIL', 'MEETING', 'TASK', 'NOTE', 'FOLLOW_UP'];

const LEAD_STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  CONTACTED: 'bg-indigo-100 text-indigo-700',
  QUALIFIED: 'bg-purple-100 text-purple-700',
  PROPOSAL: 'bg-amber-100 text-amber-700',
  NEGOTIATION: 'bg-orange-100 text-orange-700',
  WON: 'bg-green-100 text-green-700',
  LOST: 'bg-red-100 text-red-700',
};

const DEAL_STAGE_COLORS: Record<string, string> = {
  PROSPECTING: 'bg-gray-100 text-gray-700',
  QUALIFICATION: 'bg-blue-100 text-blue-700',
  PROPOSAL: 'bg-purple-100 text-purple-700',
  NEGOTIATION: 'bg-amber-100 text-amber-700',
  CLOSED_WON: 'bg-green-100 text-green-700',
  CLOSED_LOST: 'bg-red-100 text-red-700',
};

const ACTIVITY_ICONS: Record<string, typeof PhoneCall> = {
  CALL: PhoneCall,
  EMAIL: Mail,
  MEETING: Users,
  TASK: Target,
  NOTE: MessageSquare,
  FOLLOW_UP: Calendar,
};

const STAGE_PROBABILITY: Record<string, number> = {
  PROSPECTING: 10, QUALIFICATION: 25, PROPOSAL: 50, NEGOTIATION: 75, CLOSED_WON: 100, CLOSED_LOST: 0,
};

// ─── Lead Modal ───────────────────────────────────────────────────────────────

function LeadModal({ initial, onClose, onSaved }: { initial?: Partial<Lead>; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    email: initial?.email || '',
    phone: initial?.phone || '',
    company: initial?.company || '',
    source: initial?.source || 'OTHER',
    status: initial?.status || 'NEW',
    value: initial?.value ? String(initial.value) : '',
    notes: initial?.notes || '',
    expectedCloseDate: initial?.expectedCloseDate ? initial.expectedCloseDate.split('T')[0] : '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name) { setErr('Name is required'); return; }
    setSaving(true); setErr('');
    try {
      const body = {
        name: form.name, email: form.email || undefined, phone: form.phone || undefined,
        company: form.company || undefined, source: form.source, status: form.status,
        value: form.value ? parseFloat(form.value) : undefined,
        notes: form.notes || undefined,
        expectedCloseDate: form.expectedCloseDate || undefined,
      };
      if (initial?.id) {
        await apiFetch(`/crm/leads/${initial.id}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await apiFetch('/crm/leads', { method: 'POST', body: JSON.stringify(body) });
      }
      onSaved(); onClose();
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">{initial?.id ? 'Edit Lead' : 'Add Lead'}</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-gray-400" /></button>
        </div>
        {err && <p className="text-xs text-red-600 mb-3 bg-red-50 p-2 rounded-lg">{err}</p>}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Lead name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Company</label>
              <input value={form.company} onChange={e => set('company', e.target.value)} placeholder="Company name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Lead Value (₹)</label>
              <input type="number" value={form.value} onChange={e => set('value', e.target.value)} min="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Source</label>
              <select value={form.source} onChange={e => set('source', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                {LEAD_SOURCES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Expected Close</label>
              <input type="date" value={form.expectedCloseDate} onChange={e => set('expectedCloseDate', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none" />
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="h-4 w-4" />}
            {initial?.id ? 'Update' : 'Add Lead'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Deal Modal ───────────────────────────────────────────────────────────────

function DealModal({ leads, initial, onClose, onSaved }: { leads: Lead[]; initial?: Partial<Deal>; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    leadId: initial?.leadId || '',
    value: initial?.value ? String(initial.value) : '',
    stage: initial?.stage || 'PROSPECTING',
    probability: initial?.probability ? String(initial.probability) : '10',
    expectedCloseDate: initial?.expectedCloseDate ? initial.expectedCloseDate.split('T')[0] : '',
    notes: initial?.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleStageChange = (stage: string) => {
    set('stage', stage);
    set('probability', String(STAGE_PROBABILITY[stage] ?? 10));
  };

  const handleSave = async () => {
    if (!form.title) { setErr('Title is required'); return; }
    setSaving(true); setErr('');
    try {
      const body = {
        title: form.title, leadId: form.leadId || undefined,
        value: form.value ? parseFloat(form.value) : undefined,
        stage: form.stage, probability: parseInt(form.probability),
        expectedCloseDate: form.expectedCloseDate || undefined,
        notes: form.notes || undefined,
      };
      if (initial?.id) {
        await apiFetch(`/crm/deals/${initial.id}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await apiFetch('/crm/deals', { method: 'POST', body: JSON.stringify(body) });
      }
      onSaved(); onClose();
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">{initial?.id ? 'Edit Deal' : 'Add Deal'}</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-gray-400" /></button>
        </div>
        {err && <p className="text-xs text-red-600 mb-3 bg-red-50 p-2 rounded-lg">{err}</p>}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Deal Title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Website Redesign Project"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Lead (optional)</label>
              <select value={form.leadId} onChange={e => set('leadId', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                <option value="">No lead</option>
                {leads.map(l => <option key={l.id} value={l.id}>{l.name}{l.company ? ` — ${l.company}` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Value (₹)</label>
              <input type="number" value={form.value} onChange={e => set('value', e.target.value)} min="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Probability (%)</label>
              <input type="number" value={form.probability} onChange={e => set('probability', e.target.value)} min="0" max="100"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Stage</label>
              <select value={form.stage} onChange={e => handleStageChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                {DEAL_STAGES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Expected Close</label>
              <input type="date" value={form.expectedCloseDate} onChange={e => set('expectedCloseDate', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none" />
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="h-4 w-4" />}
            {initial?.id ? 'Update' : 'Add Deal'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Activity Modal ───────────────────────────────────────────────────────────

function ActivityModal({ leads, deals, onClose, onSaved }: { leads: Lead[]; deals: Deal[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ type: 'NOTE', subject: '', description: '', leadId: '', dealId: '', dueDate: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.subject) { setErr('Subject is required'); return; }
    setSaving(true); setErr('');
    try {
      await apiFetch('/crm/activities', {
        method: 'POST',
        body: JSON.stringify({
          type: form.type, subject: form.subject, description: form.description || undefined,
          leadId: form.leadId || undefined, dealId: form.dealId || undefined,
          dueDate: form.dueDate || undefined,
        }),
      });
      onSaved(); onClose();
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Log Activity</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-gray-400" /></button>
        </div>
        {err && <p className="text-xs text-red-600 mb-3 bg-red-50 p-2 rounded-lg">{err}</p>}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Activity Type</label>
            <div className="grid grid-cols-3 gap-1.5">
              {ACTIVITY_TYPES.map(t => {
                const Icon = ACTIVITY_ICONS[t] || MessageSquare;
                return (
                  <button key={t} onClick={() => set('type', t)}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-2.5 text-xs font-medium transition-colors ${form.type === t ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    <Icon className="h-4 w-4" />
                    {t.replace('_', ' ')}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Subject *</label>
            <input value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="e.g. Follow up call with client"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="Details..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Related Lead</label>
              <select value={form.leadId} onChange={e => set('leadId', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                <option value="">None</option>
                {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Related Deal</label>
              <select value={form.dealId} onChange={e => set('dealId', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                <option value="">None</option>
                {deals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Due Date</label>
              <input type="datetime-local" value={form.dueDate} onChange={e => set('dueDate', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="h-4 w-4" />}
            Log Activity
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main CRM Page ────────────────────────────────────────────────────────────

type Tab = 'overview' | 'leads' | 'pipeline' | 'activities';

export default function CRMPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activities, setActivities] = useState<CRMActivity[]>([]);
  const [stats, setStats] = useState<CRMStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState('');
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showDealModal, setShowDealModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [editDeal, setEditDeal] = useState<Deal | null>(null);
  const [pipelineStageFilter, setPipelineStageFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [leadRes, dealRes, actRes, statsRes] = await Promise.all([
        apiFetch<{ data: Lead[] }>('/crm/leads?limit=100'),
        apiFetch<{ data: Deal[] }>('/crm/deals'),
        apiFetch<{ data: CRMActivity[] }>('/crm/activities?limit=50'),
        apiFetch<{ data: CRMStats }>('/crm/dashboard'),
      ]);
      setLeads(leadRes.data || []);
      setDeals(dealRes.data || []);
      setActivities(actRes.data || []);
      setStats(statsRes.data);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDeleteLead = async (id: string) => {
    if (!confirm('Delete this lead?')) return;
    try { await apiFetch(`/crm/leads/${id}`, { method: 'DELETE' }); fetchData(); } catch { }
  };

  const handleDeleteDeal = async (id: string) => {
    if (!confirm('Delete this deal?')) return;
    try { await apiFetch(`/crm/deals/${id}`, { method: 'DELETE' }); fetchData(); } catch { }
  };

  const handleCompleteActivity = async (id: string) => {
    try { await apiFetch(`/crm/activities/${id}/complete`, { method: 'PATCH' }); fetchData(); } catch { }
  };

  const filteredLeads = leads.filter(l => {
    const q = search.toLowerCase();
    const matchesSearch = l.name.toLowerCase().includes(q) || (l.company || '').toLowerCase().includes(q) || (l.email || '').toLowerCase().includes(q);
    const matchesStatus = !leadStatusFilter || l.status === leadStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredDeals = deals.filter(d => {
    if (pipelineStageFilter) return d.stage === pipelineStageFilter;
    return true;
  });

  const TABS = [
    { key: 'overview' as Tab, label: 'Overview', icon: BarChart2 },
    { key: 'leads' as Tab, label: 'Leads', icon: Users },
    { key: 'pipeline' as Tab, label: 'Pipeline', icon: TrendingUp },
    { key: 'activities' as Tab, label: 'Activities', icon: Activity },
  ];

  return (
    <>
      <AnimatePresence>
        {(showLeadModal || editLead) && (
          <LeadModal initial={editLead || undefined} onClose={() => { setShowLeadModal(false); setEditLead(null); }} onSaved={fetchData} />
        )}
        {(showDealModal || editDeal) && (
          <DealModal leads={leads} initial={editDeal || undefined} onClose={() => { setShowDealModal(false); setEditDeal(null); }} onSaved={fetchData} />
        )}
        {showActivityModal && (
          <ActivityModal leads={leads} deals={deals} onClose={() => setShowActivityModal(false)} onSaved={fetchData} />
        )}
      </AnimatePresence>

      <div className="p-6 lg:p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CRM</h1>
            <p className="text-gray-500 mt-1">Manage leads, deals & customer relationships</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchData} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <RefreshCw className="h-4 w-4" />
            </button>
            {activeTab === 'leads' && (
              <button onClick={() => setShowLeadModal(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                <Plus className="h-4 w-4" /> Add Lead
              </button>
            )}
            {activeTab === 'pipeline' && (
              <button onClick={() => setShowDealModal(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                <Plus className="h-4 w-4" /> Add Deal
              </button>
            )}
            {activeTab === 'activities' && (
              <button onClick={() => setShowActivityModal(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                <Plus className="h-4 w-4" /> Log Activity
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-5">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === tab.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Leads', value: stats.totalLeads, sub: `${stats.newLeadsThisMonth} this month`, icon: Users, color: 'text-indigo-700', bg: 'bg-indigo-50' },
                { label: 'Conversion Rate', value: `${stats.conversionRate}%`, sub: `${stats.wonLeads} won`, icon: Target, color: 'text-green-700', bg: 'bg-green-50' },
                { label: 'Open Deals', value: stats.openDeals, sub: `of ${stats.totalDeals} total`, icon: Briefcase, color: 'text-blue-700', bg: 'bg-blue-50' },
                { label: 'Pipeline Value', value: `₹${(stats.openDealValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, sub: 'open deals', icon: TrendingUp, color: 'text-amber-700', bg: 'bg-amber-50' },
              ].map((card, i) => (
                <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={`rounded-2xl border border-gray-100 p-5 shadow-sm ${card.bg}`}>
                  <card.icon className={`h-5 w-5 mb-2 ${card.color}`} />
                  <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
                  <p className="text-xs text-gray-400">{card.sub}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              {/* Leads by Status */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Leads by Status</h3>
                <div className="space-y-2">
                  {LEAD_STATUSES.map(status => {
                    const count = stats.leadsByStatus.find(l => l.status === status)?.count || 0;
                    const pct = stats.totalLeads > 0 ? Math.round((count / stats.totalLeads) * 100) : 0;
                    return (
                      <div key={status} className="flex items-center gap-3">
                        <span className={`text-xs font-medium rounded-full px-2.5 py-1 w-28 text-center ${LEAD_STATUS_COLORS[status]}`}>{status}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Deals by Stage */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Pipeline by Stage</h3>
                <div className="space-y-2">
                  {DEAL_STAGES.map(stage => {
                    const stageData = stats.dealsByStage.find(d => d.stage === stage);
                    const count = stageData?.count || 0;
                    const value = stageData?.value || 0;
                    return (
                      <div key={stage} className="flex items-center gap-3">
                        <span className={`text-xs font-medium rounded-full px-2.5 py-1 w-32 text-center ${DEAL_STAGE_COLORS[stage]}`}>
                          {stage.replace('_', ' ')}
                        </span>
                        <div className="flex-1 flex items-center justify-between gap-2">
                          <span className="text-xs text-gray-600">{count} deals</span>
                          <span className="text-xs font-semibold text-gray-900">₹{value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            {stats.recentActivities.length > 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {stats.recentActivities.map(activity => {
                    const Icon = ACTIVITY_ICONS[activity.type] || MessageSquare;
                    return (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{activity.subject}</p>
                          <p className="text-xs text-gray-400">
                            {activity.lead?.name || activity.deal?.title || 'General'} · {new Date(activity.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Leads Tab */}
        {activeTab === 'leads' && (
          <>
            <div className="mb-4 flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:border-indigo-400 focus:outline-none" />
              </div>
              <select value={leadStatusFilter} onChange={e => setLeadStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none">
                <option value="">All Statuses</option>
                {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Lead</th>
                    <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Source</th>
                    <th className="hidden md:table-cell px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Value</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Added</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}><td colSpan={6} className="px-4 py-4"><div className="h-8 bg-gray-100 rounded animate-pulse" /></td></tr>
                    ))
                  ) : filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No leads found</p>
                        <button onClick={() => setShowLeadModal(true)} className="mt-3 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline">
                          <Plus className="h-4 w-4" /> Add your first lead
                        </button>
                      </td>
                    </tr>
                  ) : filteredLeads.map((lead, idx) => (
                    <motion.tr key={lead.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                      className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm font-bold">{lead.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                            <p className="text-xs text-gray-500">{lead.company || lead.email || ''}</p>
                            {lead.phone && (
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Phone className="h-3 w-3" /> {lead.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3">
                        <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-1">{lead.source.replace('_', ' ')}</span>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3 text-right text-sm font-semibold text-gray-900">
                        {lead.value ? `₹${lead.value.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${LEAD_STATUS_COLORS[lead.status] || 'bg-gray-100 text-gray-600'}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3 text-xs text-gray-500">
                        {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setEditLead(lead)} className="rounded-lg p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDeleteLead(lead.id)} className="rounded-lg p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pipeline Tab */}
        {activeTab === 'pipeline' && (
          <>
            <div className="mb-4 flex items-center gap-3">
              <select value={pipelineStageFilter} onChange={e => setPipelineStageFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none">
                <option value="">All Stages</option>
                {DEAL_STAGES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>

            {/* Kanban-style pipeline view */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              {DEAL_STAGES.map(stage => {
                const stageDeals = filteredDeals.filter(d => d.stage === stage);
                const stageValue = stageDeals.reduce((s, d) => s + (d.value || 0), 0);
                return (
                  <div key={stage} className="min-w-0">
                    <div className={`rounded-xl p-2.5 mb-2 ${DEAL_STAGE_COLORS[stage]}`}>
                      <p className="text-xs font-semibold truncate">{stage.replace('_', ' ')}</p>
                      <p className="text-xs opacity-75">{stageDeals.length} deals · ₹{stageValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                    </div>
                    <div className="space-y-2">
                      {stageDeals.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-200 p-3 text-center">
                          <p className="text-xs text-gray-400">No deals</p>
                        </div>
                      ) : stageDeals.map(deal => (
                        <div key={deal.id} className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm hover:shadow-md transition-shadow">
                          <p className="text-xs font-semibold text-gray-900 mb-1 line-clamp-2">{deal.title}</p>
                          {deal.lead && <p className="text-xs text-gray-500 truncate">{deal.lead.name}</p>}
                          {deal.value && <p className="text-xs font-bold text-indigo-600 mt-1">₹{deal.value.toLocaleString('en-IN')}</p>}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400">{deal.probability}%</span>
                            <div className="flex gap-0.5">
                              <button onClick={() => setEditDeal(deal)} className="rounded p-0.5 text-gray-400 hover:text-indigo-600">
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button onClick={() => handleDeleteDeal(deal.id)} className="rounded p-0.5 text-gray-400 hover:text-red-600">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          <div className="mt-1.5 bg-gray-100 rounded-full h-1">
                            <div className="bg-indigo-500 h-1 rounded-full" style={{ width: `${deal.probability}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Activities Tab */}
        {activeTab === 'activities' && (
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
              ))
            ) : activities.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
                <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No activities logged yet</p>
                <button onClick={() => setShowActivityModal(true)} className="mt-3 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline">
                  <Plus className="h-4 w-4" /> Log first activity
                </button>
              </div>
            ) : activities.map((activity, idx) => {
              const Icon = ACTIVITY_ICONS[activity.type] || MessageSquare;
              const isCompleted = !!activity.completedAt;
              return (
                <motion.div key={activity.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                  className={`rounded-2xl border bg-white p-4 shadow-sm flex items-start gap-4 ${isCompleted ? 'border-gray-100 opacity-70' : 'border-gray-200'}`}>
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isCompleted ? 'bg-gray-50' : 'bg-indigo-50'}`}>
                    <Icon className={`h-5 w-5 ${isCompleted ? 'text-gray-400' : 'text-indigo-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`text-sm font-semibold ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>{activity.subject}</p>
                        {activity.description && <p className="text-xs text-gray-500 mt-0.5">{activity.description}</p>}
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{activity.type}</span>
                          {activity.lead && <span className="text-xs text-indigo-600">{activity.lead.name}</span>}
                          {activity.deal && <span className="text-xs text-purple-600">{activity.deal.title}</span>}
                          {activity.dueDate && !isCompleted && (
                            <span className="text-xs text-amber-600 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due {new Date(activity.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <p className="text-xs text-gray-400 whitespace-nowrap">
                          {new Date(activity.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                        {!isCompleted && (
                          <button onClick={() => handleCompleteActivity(activity.id)}
                            className="rounded-lg p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50" title="Mark complete">
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
