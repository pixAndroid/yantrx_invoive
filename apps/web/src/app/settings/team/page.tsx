'use client';

import { useState, useEffect } from 'react';
import { Users, UserPlus, Mail, Shield, RefreshCw } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Member {
  id: string;
  role: string;
  isActive: boolean;
  joinedAt: string;
  user: { name: string; email: string | null; phone: string | null };
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('ACCOUNTANT');
  const [inviting, setInviting] = useState(false);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: Member[] }>('/business/team');
      setMembers(res.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      await apiFetch('/business/invite', {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      setInviteEmail('');
      alert('Invitation sent!');
    } catch (err: any) {
      alert(err.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const ROLE_LABELS: Record<string, { label: string; class: string }> = {
    OWNER: { label: 'Owner', class: 'bg-indigo-100 text-indigo-700' },
    ADMIN: { label: 'Admin', class: 'bg-purple-100 text-purple-700' },
    ACCOUNTANT: { label: 'Accountant', class: 'bg-blue-100 text-blue-700' },
    VIEWER: { label: 'Viewer', class: 'bg-gray-100 text-gray-700' },
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Team</h1>
        <p className="text-gray-500 mt-1">Manage team members and their access</p>
      </div>

      {/* Invite form */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-indigo-600" /> Invite Team Member
        </h2>
        <form onSubmit={handleInvite} className="flex gap-3">
          <div className="flex-1">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                required
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-indigo-400 focus:outline-none"
              />
            </div>
          </div>
          <select
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none"
          >
            <option value="ADMIN">Admin</option>
            <option value="ACCOUNTANT">Accountant</option>
            <option value="VIEWER">Viewer</option>
          </select>
          <button
            type="submit"
            disabled={inviting}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {inviting ? 'Sending...' : 'Invite'}
          </button>
        </form>
      </div>

      {/* Members list */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-400" /> Members ({members.length})
          </h2>
          <button onClick={fetchMembers} className="text-gray-400 hover:text-gray-600">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No team members yet. Invite someone to collaborate!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {members.map(member => {
              const roleConfig = ROLE_LABELS[member.role] || ROLE_LABELS.VIEWER;
              return (
                <div key={member.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                    {member.user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{member.user.name}</p>
                    <p className="text-xs text-gray-500">{member.user.email}</p>
                  </div>
                  <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${roleConfig.class}`}>
                    {roleConfig.label}
                  </span>
                  {member.role === 'OWNER' && (
                    <Shield className="h-4 w-4 text-indigo-400" title="Owner" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
