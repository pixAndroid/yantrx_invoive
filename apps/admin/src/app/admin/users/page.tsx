'use client';

import { useState } from 'react';
import { Search, UserCheck, UserX, Eye, MoreVertical, Filter } from 'lucide-react';

const USERS = [
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
