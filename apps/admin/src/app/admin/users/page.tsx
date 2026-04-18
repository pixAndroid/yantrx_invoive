'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, UserCheck, UserX, Eye, Filter, AlertCircle, RefreshCw } from 'lucide-react';
import { adminFetch, API_URL, getAdminToken } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

interface Meta {
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const res = await adminFetch<{ data: User[]; meta: Meta }>(`/admin/users?${params}`);
      setUsers(res.data);
      setMeta(res.meta);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const toggleUser = async (userId: string, currentlyActive: boolean) => {
    setActionLoading(userId);
    try {
      const action = currentlyActive ? 'suspend' : 'activate';
      const token = getAdminToken();
      const res = await fetch(`${API_URL}/admin/users/${userId}/${action}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !currentlyActive } : u));
      }
    } catch {
      // silently fail
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-gray-400 mt-1">{meta ? `${meta.total} users found` : 'Loading...'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700">
            <Filter className="h-4 w-4" /> Filter
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search users..."
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
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Verified</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Joined</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-4 py-4">
                    <div className="h-8 bg-gray-800 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">No users found</td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email || user.phone || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full border border-gray-700">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs flex items-center gap-1 w-fit px-2 py-0.5 rounded-full ${user.isActive ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
                      {user.isActive ? 'active' : 'suspended'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs ${user.isVerified ? 'text-green-400' : 'text-gray-500'}`}>
                      {user.isVerified ? '✓ verified' : 'unverified'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        title="View user"
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-700 hover:text-gray-300"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleUser(user.id, user.isActive)}
                        disabled={actionLoading === user.id}
                        title={user.isActive ? 'Suspend user' : 'Activate user'}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-700 hover:text-gray-300 disabled:opacity-50"
                      >
                        {actionLoading === user.id ? (
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                        ) : user.isActive ? (
                          <UserX className="h-4 w-4 text-red-400" />
                        ) : (
                          <UserCheck className="h-4 w-4 text-green-400" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
            <p className="text-xs text-gray-500">
              Page {meta.page} of {meta.totalPages} · {meta.total} users
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!meta.hasPrev}
                className="rounded-lg px-3 py-1.5 text-sm text-gray-400 border border-gray-700 hover:bg-gray-800 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!meta.hasNext}
                className="rounded-lg px-3 py-1.5 text-sm text-gray-400 border border-gray-700 hover:bg-gray-800 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
  { id: '1', name: 'Demo User', email: 'demo@yantrix.in', phone: '+919876543210', role: 'OWNER', plan: 'Pro', business: 'Demo Tech Solutions', status: 'active', verified: true, joined: '2024-01-15' },
  { id: '2', name: 'Rahul Gupta', email: 'rahul@techcorp.in', phone: '+919811001122', role: 'OWNER', plan: 'Starter', business: 'Tech Corp', status: 'active', verified: true, joined: '2024-11-01' },
  { id: '3', name: 'Sunita Rao', email: 'sunita@raotext.com', phone: '+919922334455', role: 'OWNER', plan: 'Free', business: 'Rao Textiles', status: 'suspended', verified: false, joined: '2024-10-28' },
  { id: '4', name: 'Mohit Agarwal', email: 'mohit@agri.co.in', phone: '+919988776655', role: 'ACCOUNTANT', plan: 'Pro', business: 'Agri Solutions', status: 'active', verified: true, joined: '2024-09-10' },
];

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');

  const filtered = USERS.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.business.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-gray-400 mt-1">{filtered.length} users found</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700">
          <Filter className="h-4 w-4" /> Filter
        </button>
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input type="text" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-700 bg-gray-800 text-sm text-gray-200 placeholder-gray-500 focus:border-orange-500 focus:outline-none" />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Business</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Plan</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filtered.map(user => (
              <tr key={user.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-300">{user.business}</td>
                <td className="px-4 py-4">
                  <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full border border-gray-700">{user.role}</span>
                </td>
                <td className="px-4 py-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${user.plan === 'Pro' ? 'bg-indigo-900/50 text-indigo-400 border-indigo-800' : user.plan === 'Starter' ? 'bg-blue-900/50 text-blue-400 border-blue-800' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>{user.plan}</span>
                </td>
                <td className="px-4 py-4">
                  <span className={`text-xs flex items-center gap-1 w-fit px-2 py-0.5 rounded-full ${user.status === 'active' ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${user.status === 'active' ? 'bg-green-400' : 'bg-red-400'}`} />
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-500">{user.joined}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1">
                    <button className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-700 hover:text-gray-300">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-700 hover:text-gray-300">
                      {user.status === 'active' ? <UserX className="h-4 w-4 text-red-400" /> : <UserCheck className="h-4 w-4 text-green-400" />}
                    </button>
                    <button className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-700 hover:text-gray-300">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
