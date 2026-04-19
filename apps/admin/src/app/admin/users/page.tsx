'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, UserCheck, UserX, Eye, Filter, AlertCircle, RefreshCw, Plus, X, Check, Edit2 } from 'lucide-react';
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

const ROLES = ['OWNER', 'ACCOUNTANT', 'STAFF'];

function UserModal({ user, onClose, onSaved }: { user: User | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!user;
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || 'STAFF',
    password: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name) { setErr('Name is required'); return; }
    if (!isEdit && !form.email) { setErr('Email is required for new users'); return; }
    if (!isEdit && !form.password) { setErr('Password is required for new users'); return; }
    setSaving(true); setErr('');
    try {
      const token = getAdminToken();
      const url = isEdit ? `${API_URL}/admin/users/${user!.id}` : `${API_URL}/admin/users`;
      const method = isEdit ? 'PUT' : 'POST';
      const payload: any = { name: form.name, role: form.role };
      if (form.email) payload.email = form.email;
      if (form.phone) payload.phone = form.phone;
      if (!isEdit && form.password) payload.password = form.password;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) { setErr(data.error || 'Failed to save'); return; }
      onSaved(); onClose();
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-xl p-6 z-10">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-white">{isEdit ? 'Edit User' : 'Add New User'}</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-gray-400" /></button>
        </div>
        {err && <p className="text-xs text-red-400 mb-3 bg-red-900/20 border border-red-800 rounded px-3 py-2">{err}</p>}
        <div className="space-y-3">
          {[
            { label: 'Full Name *', key: 'name', type: 'text', placeholder: 'John Smith' },
            { label: `Email${!isEdit ? ' *' : ''}`, key: 'email', type: 'email', placeholder: 'user@example.com' },
            { label: 'Phone', key: 'phone', type: 'tel', placeholder: '+91 98765 43210' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-gray-400 mb-1">{f.label}</label>
              <input type={f.type} value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Role</label>
            <select value={form.role} onChange={e => set('role', e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none">
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {!isEdit && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Password *</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Minimum 8 characters"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none" />
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 rounded-lg border border-gray-700 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 rounded-lg bg-orange-500 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : <Check className="h-4 w-4" />}
            {isEdit ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (filterRole) params.set('role', filterRole);
      if (filterStatus) params.set('isActive', filterStatus === 'active' ? 'true' : 'false');
      const res = await adminFetch<{ data: User[]; meta: Meta }>(`/admin/users?${params}`);
      setUsers(res.data);
      setMeta(res.meta);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterRole, filterStatus]);

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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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

  const activeFilters = [filterRole, filterStatus].filter(Boolean).length;

  return (
    <>
      {(showAddUser || editUser) && (
        <UserModal
          user={editUser}
          onClose={() => { setShowAddUser(false); setEditUser(null); }}
          onSaved={fetchUsers}
        />
      )}
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-gray-400 mt-1">{meta ? `${meta.total} users found` : 'Loading...'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchUsers} className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button onClick={() => setShowFilter(p => !p)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-700 ${activeFilters > 0 ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-gray-700 bg-gray-800 text-gray-300'}`}>
            <Filter className="h-4 w-4" /> Filter {activeFilters > 0 && <span className="bg-orange-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">{activeFilters}</span>}
          </button>
          <button onClick={() => setShowAddUser(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600">
            <Plus className="h-4 w-4" /> Add User
          </button>
        </div>
      </div>

      {showFilter && (
        <div className="mb-4 p-4 rounded-xl border border-gray-700 bg-gray-800/50 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Role:</label>
            <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 focus:border-orange-500 focus:outline-none">
              <option value="">All</option>
              {['OWNER','ACCOUNTANT','STAFF','SUPER_ADMIN'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Status:</label>
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 focus:border-orange-500 focus:outline-none">
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          {activeFilters > 0 && (
            <button onClick={() => { setFilterRole(''); setFilterStatus(''); setPage(1); }}
              className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1">
              <X className="h-3 w-3" /> Clear filters
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input type="text" placeholder="Search users..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-700 bg-gray-800 text-sm text-gray-200 placeholder-gray-500 focus:border-orange-500 focus:outline-none" />
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
                <tr key={i}><td colSpan={6} className="px-4 py-4"><div className="h-8 bg-gray-800 rounded animate-pulse" /></td></tr>
              ))
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">No users found</td></tr>
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
                    <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full border border-gray-700">{user.role}</span>
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
                      <button onClick={() => setEditUser(user)} title="Edit user"
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-700 hover:text-orange-400">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => toggleUser(user.id, user.isActive)} disabled={actionLoading === user.id}
                        title={user.isActive ? 'Suspend user' : 'Activate user'}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-700 hover:text-gray-300 disabled:opacity-50">
                        {actionLoading === user.id ? (
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
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

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
            <p className="text-xs text-gray-500">Page {meta.page} of {meta.totalPages} · {meta.total} users</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!meta.hasPrev}
                className="rounded-lg px-3 py-1.5 text-sm text-gray-400 border border-gray-700 hover:bg-gray-800 disabled:opacity-50">Previous</button>
              <button onClick={() => setPage(p => p + 1)} disabled={!meta.hasNext}
                className="rounded-lg px-3 py-1.5 text-sm text-gray-400 border border-gray-700 hover:bg-gray-800 disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
