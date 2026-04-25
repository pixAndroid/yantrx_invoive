'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare, Mail, Phone, CheckCircle2, Clock, Trash2,
  AlertCircle, RefreshCw, Search, Tag, CheckCheck
} from 'lucide-react';
import { adminFetch, API_URL, getAdminToken } from '@/lib/api';

interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: 'UNREAD' | 'READ' | 'REPLIED';
  ipAddress: string | null;
  createdAt: string;
}

const STATUS_CONFIG = {
  UNREAD: { label: 'Unread', bg: 'bg-amber-900/30', text: 'text-amber-400', border: 'border-amber-800/40' },
  READ: { label: 'Read', bg: 'bg-blue-900/30', text: 'text-blue-400', border: 'border-blue-800/40' },
  REPLIED: { label: 'Replied', bg: 'bg-green-900/30', text: 'text-green-400', border: 'border-green-800/40' },
};

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchEnquiries = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await adminFetch<{ data: Enquiry[] }>(`/admin/enquiries?${params}`);
      setEnquiries(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEnquiries(); }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEnquiries();
  };

  const markRead = async (id: string) => {
    setActionLoading(id);
    try {
      const token = getAdminToken();
      await fetch(`${API_URL}/admin/enquiries/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status: 'READ' } : e));
    } catch {}
    setActionLoading(null);
  };

  const markReplied = async (id: string) => {
    setActionLoading(id);
    try {
      const token = getAdminToken();
      await fetch(`${API_URL}/admin/enquiries/${id}/replied`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status: 'REPLIED' } : e));
    } catch {}
    setActionLoading(null);
  };

  const deleteEnquiry = async (id: string) => {
    if (!confirm('Delete this enquiry?')) return;
    setActionLoading(id);
    try {
      const token = getAdminToken();
      await fetch(`${API_URL}/admin/enquiries/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setEnquiries(prev => prev.filter(e => e.id !== id));
    } catch {}
    setActionLoading(null);
  };

  const unreadCount = enquiries.filter(e => e.status === 'UNREAD').length;
  const readCount = enquiries.filter(e => e.status === 'READ').length;
  const repliedCount = enquiries.filter(e => e.status === 'REPLIED').length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Enquiries</h1>
          <p className="text-gray-400 mt-1 text-sm">Contact form submissions from your website</p>
        </div>
        <button
          onClick={fetchEnquiries}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Unread', count: unreadCount, color: 'text-amber-400', bg: 'bg-amber-900/20', border: 'border-amber-800/30' },
          { label: 'Read', count: readCount, color: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-800/30' },
          { label: 'Replied', count: repliedCount, color: 'text-green-400', bg: 'bg-green-900/20', border: 'border-green-800/30' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} ${stat.border} border rounded-xl px-5 py-4`}>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
            <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, email, subject…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <button type="submit" className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 transition-colors">
            Search
          </button>
        </form>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-orange-500 focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="UNREAD">Unread</option>
          <option value="READ">Read</option>
          <option value="REPLIED">Replied</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-gray-900 border border-gray-800 animate-pulse" />
          ))}
        </div>
      ) : enquiries.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="h-12 w-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No enquiries found</p>
          <p className="text-gray-600 text-sm mt-1">Contact form submissions will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {enquiries.map(enquiry => {
            const cfg = STATUS_CONFIG[enquiry.status];
            const isExpanded = expandedId === enquiry.id;
            return (
              <div
                key={enquiry.id}
                className={`rounded-2xl border ${cfg.border} bg-gray-900 overflow-hidden transition-all`}
              >
                {/* Card Header */}
                <button
                  onClick={() => {
                    setExpandedId(isExpanded ? null : enquiry.id);
                    if (enquiry.status === 'UNREAD') markRead(enquiry.id);
                  }}
                  className="w-full text-left p-5 hover:bg-gray-800/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {enquiry.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-white">{enquiry.name}</p>
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                            {enquiry.status === 'UNREAD' && <Clock className="h-3 w-3" />}
                            {enquiry.status === 'READ' && <CheckCircle2 className="h-3 w-3" />}
                            {enquiry.status === 'REPLIED' && <CheckCheck className="h-3 w-3" />}
                            {cfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {enquiry.email}
                          </span>
                          {enquiry.phone && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {enquiry.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {enquiry.subject && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-xs bg-gray-800 text-gray-400 border border-gray-700 px-2 py-0.5 rounded-full">
                          <Tag className="h-3 w-3" /> {enquiry.subject}
                        </span>
                      )}
                      <span className="text-xs text-gray-600">
                        {new Date(enquiry.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  {!isExpanded && (
                    <p className="text-sm text-gray-400 mt-3 ml-12 line-clamp-2 leading-relaxed">
                      {enquiry.message}
                    </p>
                  )}
                </button>

                {/* Expanded Body */}
                {isExpanded && (
                  <div className="px-5 pb-5 ml-12">
                    {enquiry.subject && (
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Subject: {enquiry.subject}
                      </p>
                    )}
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap mb-5">
                      {enquiry.message}
                    </p>

                    <div className="flex items-center gap-2 flex-wrap">
                      {enquiry.status !== 'REPLIED' && (
                        <button
                          onClick={() => markReplied(enquiry.id)}
                          disabled={actionLoading === enquiry.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-green-700 hover:bg-green-600 px-3 py-1.5 text-sm text-white disabled:opacity-50 transition-colors"
                        >
                          <CheckCheck className="h-3.5 w-3.5" /> Mark as Replied
                        </button>
                      )}
                      {enquiry.status === 'UNREAD' && (
                        <button
                          onClick={() => markRead(enquiry.id)}
                          disabled={actionLoading === enquiry.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 text-sm text-gray-300 disabled:opacity-50 transition-colors"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Mark as Read
                        </button>
                      )}
                      <a
                        href={`mailto:${enquiry.email}?subject=Re: ${encodeURIComponent(enquiry.subject || 'Your Enquiry')}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 text-sm text-gray-300 transition-colors"
                      >
                        <Mail className="h-3.5 w-3.5" /> Reply via Email
                      </a>
                      <button
                        onClick={() => deleteEnquiry(enquiry.id)}
                        disabled={actionLoading === enquiry.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-900/50 bg-red-900/20 hover:bg-red-900/40 px-3 py-1.5 text-sm text-red-400 disabled:opacity-50 transition-colors ml-auto"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
