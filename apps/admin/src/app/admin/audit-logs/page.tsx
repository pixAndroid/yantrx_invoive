'use client';

import { useState, useEffect, useCallback } from 'react';
import { ScrollText, AlertCircle, RefreshCw, Search } from 'lucide-react';
import { adminFetch } from '@/lib/api';

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  metadata: object | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: { name: string; email: string | null } | null;
}

interface Meta {
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const ACTION_COLOR: Record<string, string> = {
  CREATE: 'text-green-400 bg-green-900/30 border-green-800',
  UPDATE: 'text-blue-400 bg-blue-900/30 border-blue-800',
  DELETE: 'text-red-400 bg-red-900/30 border-red-800',
  LOGIN: 'text-indigo-400 bg-indigo-900/30 border-indigo-800',
  LOGOUT: 'text-gray-400 bg-gray-800 border-gray-700',
};

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminFetch<{ data: AuditLog[]; meta: Meta }>(`/admin/audit-logs?page=${page}&limit=50`);
      const filtered = search
        ? res.data.filter(l =>
            l.action.toLowerCase().includes(search.toLowerCase()) ||
            l.resource.toLowerCase().includes(search.toLowerCase()) ||
            (l.user?.name || '').toLowerCase().includes(search.toLowerCase())
          )
        : res.data;
      setLogs(filtered);
      setMeta(res.meta);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(fetchLogs, 300);
    return () => clearTimeout(t);
  }, [fetchLogs]);

  const getActionColor = (action: string) => {
    for (const key of Object.keys(ACTION_COLOR)) {
      if (action.toUpperCase().includes(key)) return ACTION_COLOR[key];
    }
    return 'text-gray-400 bg-gray-800 border-gray-700';
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-gray-400 mt-1">{meta ? `${meta.total} log entries` : 'Loading...'}</p>
        </div>
        <button onClick={fetchLogs} className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Filter logs..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-700 bg-gray-800 text-sm text-gray-200 placeholder-gray-500 focus:border-orange-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Action</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Resource</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">IP</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-5 bg-gray-800 rounded animate-pulse" /></td></tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <ScrollText className="h-12 w-12 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500">No audit logs found</p>
                </td>
              </tr>
            ) : logs.map(log => (
              <tr key={log.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${getActionColor(log.action)}`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-gray-300">{log.resource}</p>
                  {log.resourceId && <p className="text-xs font-mono text-gray-600 truncate max-w-[120px]">{log.resourceId}</p>}
                </td>
                <td className="px-4 py-3">
                  {log.user ? (
                    <>
                      <p className="text-sm text-gray-300">{log.user.name}</p>
                      <p className="text-xs text-gray-600">{log.user.email}</p>
                    </>
                  ) : (
                    <span className="text-xs text-gray-600">System</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs font-mono text-gray-500">{log.ipAddress || '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {new Date(log.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
            <p className="text-xs text-gray-500">Page {meta.page} of {meta.totalPages} · {meta.total} entries</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!meta.hasPrev} className="rounded-lg px-3 py-1.5 text-sm text-gray-400 border border-gray-700 hover:bg-gray-800 disabled:opacity-50">Previous</button>
              <button onClick={() => setPage(p => p + 1)} disabled={!meta.hasNext} className="rounded-lg px-3 py-1.5 text-sm text-gray-400 border border-gray-700 hover:bg-gray-800 disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
