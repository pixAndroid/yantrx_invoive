'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Wrench, Plus, Search, Edit2, Trash2, Copy, Eye, Globe, Lock,
  Star, StarOff, CheckCircle, Clock, Filter, ExternalLink, Code2,
  BarChart2, RefreshCw, ChevronLeft, ChevronRight, AlertCircle, ShieldCheck,
} from 'lucide-react';
import { adminFetch } from '@/lib/api';

interface Tool {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  logoUrl: string | null;
  category: string | null;
  toolType: string;
  visibility: string;
  status: string;
  featured: boolean;
  isSystem: boolean;
  pricingType: string;
  viewCount: number;
  sortOrder: number;
  updatedAt: string;
  createdAt: string;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  INTERNAL_APP:    { label: 'Internal App',   color: 'bg-indigo-100 text-indigo-700' },
  CUSTOM_HTML_TOOL:{ label: 'HTML Tool',       color: 'bg-purple-100 text-purple-700' },
  EXTERNAL_URL:    { label: 'External URL',    color: 'bg-cyan-100 text-cyan-700' },
  COMING_SOON:     { label: 'Coming Soon',     color: 'bg-amber-100 text-amber-700' },
};

const PRICING_LABELS: Record<string, string> = {
  FREE: 'Free', PAID: 'Paid', CUSTOM: 'Custom',
};

function ToolTypeIcon({ type }: { type: string }) {
  if (type === 'EXTERNAL_URL') return <ExternalLink className="h-3.5 w-3.5" />;
  if (type === 'CUSTOM_HTML_TOOL') return <Code2 className="h-3.5 w-3.5" />;
  if (type === 'COMING_SOON') return <Clock className="h-3.5 w-3.5" />;
  return <Wrench className="h-3.5 w-3.5" />;
}

export default function AdminToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterVisibility, setFilterVisibility] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, hasNext: false, hasPrev: false });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (search) params.set('search', search);
      if (filterStatus) params.set('status', filterStatus);
      if (filterType) params.set('toolType', filterType);
      if (filterVisibility) params.set('visibility', filterVisibility);
      const res = await adminFetch<{ data: Tool[]; meta: typeof meta }>(`/admin/tools?${params}`);
      setTools(res.data);
      setMeta(res.meta);
    } catch (e: any) {
      setError(e.message || 'Failed to load tools');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, filterType, filterVisibility]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setActionLoading(id);
    try {
      await adminFetch(`/admin/tools/${id}`, { method: 'DELETE' });
      showToast('Tool deleted');
      load();
    } catch (e: any) {
      showToast(e.message || 'Delete failed', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDuplicate(id: string) {
    setActionLoading(id + '-dup');
    try {
      await adminFetch(`/admin/tools/${id}/duplicate`, { method: 'POST' });
      showToast('Tool duplicated — check Drafts');
      load();
    } catch (e: any) {
      showToast(e.message || 'Duplicate failed', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleToggle(id: string, field: 'status' | 'featured' | 'visibility', current: any) {
    setActionLoading(id + '-' + field);
    try {
      let data: any = {};
      if (field === 'status') data.status = current === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
      if (field === 'featured') data.featured = !current;
      if (field === 'visibility') data.visibility = current === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
      await adminFetch(`/admin/tools/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      showToast('Updated');
      load();
    } catch (e: any) {
      showToast(e.message || 'Update failed', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  const resetFilters = () => {
    setSearch('');
    setFilterStatus('');
    setFilterType('');
    setFilterVisibility('');
    setPage(1);
  };

  const hasFilters = search || filterStatus || filterType || filterVisibility;

  return (
    <div className="p-6 min-h-screen bg-gray-950">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg border ${
          toast.type === 'success'
            ? 'bg-gray-900 text-green-400 border-green-800'
            : 'bg-gray-900 text-red-400 border-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <Wrench className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Tools CMS</h1>
            <p className="text-sm text-gray-500">{meta.total} tool{meta.total !== 1 ? 's' : ''} total</p>
          </div>
        </div>
        <Link
          href="/admin/tools/new"
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Tool
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search tools..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300 focus:outline-none focus:border-orange-500"
          >
            <option value="">All Status</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
          </select>
          <select
            value={filterType}
            onChange={e => { setFilterType(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300 focus:outline-none focus:border-orange-500"
          >
            <option value="">All Types</option>
            <option value="INTERNAL_APP">Internal App</option>
            <option value="CUSTOM_HTML_TOOL">HTML Tool</option>
            <option value="EXTERNAL_URL">External URL</option>
            <option value="COMING_SOON">Coming Soon</option>
          </select>
          <select
            value={filterVisibility}
            onChange={e => { setFilterVisibility(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300 focus:outline-none focus:border-orange-500"
          >
            <option value="">All Visibility</option>
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
          </select>
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
            >
              <Filter className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
          <button
            onClick={load}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {error ? (
          <div className="flex items-center gap-3 p-6 text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : loading ? (
          <div className="space-y-px">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-800 animate-pulse">
                <div className="h-9 w-9 rounded-lg bg-gray-800" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-40 rounded bg-gray-800" />
                  <div className="h-3 w-24 rounded bg-gray-800" />
                </div>
                <div className="h-6 w-20 rounded-full bg-gray-800" />
                <div className="h-6 w-16 rounded-full bg-gray-800" />
                <div className="h-6 w-16 rounded-full bg-gray-800" />
                <div className="h-4 w-12 rounded bg-gray-800" />
                <div className="h-4 w-24 rounded bg-gray-800" />
                <div className="flex gap-1.5">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="h-8 w-8 rounded-lg bg-gray-800" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : tools.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-gray-800 flex items-center justify-center mb-4">
              <Wrench className="h-8 w-8 text-gray-600" />
            </div>
            <p className="text-gray-400 font-medium mb-1">No tools found</p>
            <p className="text-gray-600 text-sm mb-6">
              {hasFilters ? 'Try adjusting your filters.' : 'Create your first tool to get started.'}
            </p>
            {!hasFilters && (
              <Link
                href="/admin/tools/new"
                className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Tool
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tool</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Visibility</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Featured</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Views</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Updated</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {tools.map(tool => {
                  const typeMeta = TYPE_LABELS[tool.toolType] || { label: tool.toolType, color: 'bg-gray-700 text-gray-300' };
                  const isActionLoading = (suf: string) => actionLoading === tool.id + suf || actionLoading === tool.id;
                  return (
                    <tr key={tool.id} className="hover:bg-gray-800/30 transition-colors">
                      {/* Tool */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {tool.logoUrl ? (
                              <img src={tool.logoUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Wrench className="h-4 w-4 text-gray-500" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium text-white leading-tight">{tool.title}</p>
                              {tool.isSystem && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-900/40 px-1.5 py-0.5 text-xs font-medium text-blue-400" title="System tool — cannot be deleted">
                                  <ShieldCheck className="h-3 w-3" /> System
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">/{tool.slug}</p>
                          </div>
                        </div>
                      </td>
                      {/* Category */}
                      <td className="px-4 py-3 text-gray-400">{tool.category || <span className="text-gray-600">—</span>}</td>
                      {/* Type */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${typeMeta.color}`}>
                          <ToolTypeIcon type={tool.toolType} />
                          {typeMeta.label}
                        </span>
                      </td>
                      {/* Visibility */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => !tool.isSystem && handleToggle(tool.id, 'visibility', tool.visibility)}
                          disabled={tool.isSystem || !!isActionLoading('-visibility')}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                            tool.isSystem
                              ? 'bg-green-900/40 text-green-400 cursor-not-allowed opacity-75'
                              : tool.visibility === 'PUBLIC'
                              ? 'bg-green-900/40 text-green-400 hover:bg-green-900/60'
                              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                          }`}
                          title={tool.isSystem ? 'System tools are always public' : undefined}
                        >
                          {tool.visibility === 'PUBLIC' ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                          {tool.visibility === 'PUBLIC' ? 'Public' : 'Private'}
                        </button>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => !tool.isSystem && handleToggle(tool.id, 'status', tool.status)}
                          disabled={tool.isSystem || !!isActionLoading('-status')}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                            tool.isSystem
                              ? 'bg-emerald-900/40 text-emerald-400 cursor-not-allowed opacity-75'
                              : tool.status === 'PUBLISHED'
                              ? 'bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60'
                              : 'bg-amber-900/30 text-amber-400 hover:bg-amber-900/50'
                          }`}
                          title={tool.isSystem ? 'System tools are always published' : undefined}
                        >
                          {tool.status === 'PUBLISHED' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {tool.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      {/* Featured */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggle(tool.id, 'featured', tool.featured)}
                          disabled={!!isActionLoading('-featured')}
                          className={`p-1.5 rounded-lg transition-colors ${
                            tool.featured
                              ? 'text-yellow-400 bg-yellow-900/30 hover:bg-yellow-900/50'
                              : 'text-gray-600 hover:text-gray-400 hover:bg-gray-800'
                          }`}
                          title={tool.featured ? 'Remove from featured' : 'Mark as featured'}
                        >
                          {tool.featured ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
                        </button>
                      </td>
                      {/* Views */}
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-gray-400">
                          <BarChart2 className="h-3.5 w-3.5" />
                          {tool.viewCount.toLocaleString()}
                        </span>
                      </td>
                      {/* Updated */}
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(tool.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/tools/${tool.id}/preview`}
                            className="p-2 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-900/20 transition-colors"
                            title="Preview"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/admin/tools/${tool.id}/edit`}
                            className="p-2 rounded-lg text-gray-500 hover:text-orange-400 hover:bg-orange-900/20 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDuplicate(tool.id)}
                            disabled={!!isActionLoading('-dup')}
                            className="p-2 rounded-lg text-gray-500 hover:text-purple-400 hover:bg-purple-900/20 transition-colors"
                            title="Duplicate"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          {tool.isSystem ? (
                            <span
                              className="p-2 rounded-lg text-gray-700 cursor-not-allowed"
                              title="System tools cannot be deleted"
                            >
                              <Trash2 className="h-4 w-4" />
                            </span>
                          ) : (
                            <button
                              onClick={() => handleDelete(tool.id, tool.title)}
                              disabled={!!isActionLoading('')}
                              className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && tools.length > 0 && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-800">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, meta.total)} of {meta.total}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={!meta.hasPrev}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === meta.totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | string)[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) => (
                  <button
                    key={i}
                    onClick={() => typeof p === 'number' && setPage(p)}
                    disabled={p === '...'}
                    className={`min-w-[30px] h-7 rounded-lg text-xs font-medium transition-colors ${
                      p === page ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    } ${p === '...' ? 'cursor-default' : ''}`}
                  >
                    {p}
                  </button>
                ))}
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!meta.hasNext}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
