'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Building2, FileText, IndianRupee, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { adminFetch } from '@/lib/api';

interface Stats {
  totalUsers: number;
  totalBusinesses: number;
  totalInvoices: number;
  totalRevenue: number;
}

interface RecentUser {
  id: string;
  name: string;
  email: string | null;
  role: string;
  createdAt: string;
  isActive: boolean;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      adminFetch<{ data: Stats }>('/admin/stats'),
      adminFetch<{ data: RecentUser[]; meta: object }>('/admin/users?limit=5'),
    ])
      .then(([statsRes, usersRes]) => {
        setStats(statsRes.data);
        setRecentUsers(usersRes.data.slice(0, 5));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const statColorMap = {
    blue: { bg: 'bg-blue-900/30', icon: 'text-blue-400' },
    green: { bg: 'bg-green-900/30', icon: 'text-green-400' },
    indigo: { bg: 'bg-indigo-900/30', icon: 'text-indigo-400' },
    amber: { bg: 'bg-amber-900/30', icon: 'text-amber-400' },
  } as const;

  type StatColorKey = keyof typeof statColorMap;

  const statCards = stats
    ? [
        { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'blue' as StatColorKey },
        { label: 'Active Businesses', value: stats.totalBusinesses.toLocaleString(), icon: Building2, color: 'green' as StatColorKey },
        { label: 'Total Invoices', value: stats.totalInvoices.toLocaleString(), icon: FileText, color: 'indigo' as StatColorKey },
        {
          label: 'Platform Revenue',
          value: `₹${stats.totalRevenue >= 100000 ? (stats.totalRevenue / 100000).toFixed(1) + 'L' : stats.totalRevenue.toLocaleString('en-IN')}`,
          icon: IndianRupee,
          color: 'amber' as StatColorKey,
        },
      ]
    : [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-gray-400 mt-1">Real-time stats across all businesses on Yantrix</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error} — Make sure the API server is running.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-800 bg-gray-900 p-5 animate-pulse">
                <div className="h-10 w-10 rounded-xl bg-gray-800 mb-3" />
                <div className="h-7 w-20 bg-gray-800 rounded mb-1" />
                <div className="h-3 w-24 bg-gray-800 rounded" />
              </div>
            ))
          : statCards.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-2xl border border-gray-800 bg-gray-900 p-5"
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${statColorMap[stat.color].bg}`}>
                  <stat.icon className={`h-5 w-5 ${statColorMap[stat.color].icon}`} />
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </motion.div>
            ))}
      </div>

      {/* Recent Signups */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-base font-semibold text-white mb-4">Recent Signups</h2>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : recentUsers.length === 0 ? (
          <p className="text-gray-500 text-sm">No users yet</p>
        ) : (
          <div className="space-y-3">
            {recentUsers.map(user => (
              <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`flex items-center gap-1 text-xs ${user.isActive ? 'text-green-400' : 'text-red-400'}`}>
                    {user.isActive ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                    {user.isActive ? 'Active' : 'Suspended'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

