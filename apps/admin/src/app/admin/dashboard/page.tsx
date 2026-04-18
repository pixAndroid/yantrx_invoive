'use client';

import { motion } from 'framer-motion';
import { Users, Building2, FileText, IndianRupee, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const STATS = [
  { label: 'Total Users', value: '50,247', change: '+234 this week', icon: Users, color: 'blue' },
  { label: 'Active Businesses', value: '12,583', change: '+89 this week', icon: Building2, color: 'green' },
  { label: 'Total Invoices', value: '8,47,291', change: '+12,450 this week', icon: FileText, color: 'indigo' },
  { label: 'Platform Revenue', value: '₹24.8L', change: '+₹1.2L this month', icon: IndianRupee, color: 'amber' },
];

const RECENT_USERS = [
  { name: 'Rahul Gupta', email: 'rahul@techcorp.in', business: 'Tech Corp', plan: 'Pro', joined: '2 hours ago', status: 'active' },
  { name: 'Sunita Rao', email: 'sunita@raotextiles.com', business: 'Rao Textiles', plan: 'Starter', joined: '4 hours ago', status: 'active' },
  { name: 'Mohit Agarwal', email: 'mohit@agri.co.in', business: 'Agri Solutions', plan: 'Free', joined: '6 hours ago', status: 'pending' },
  { name: 'Kavita Jain', email: 'kavita@jainfoods.in', business: 'Jain Foods', plan: 'Business', joined: '1 day ago', status: 'active' },
];

const PLAN_DIST = [
  { plan: 'Free', count: 28403, pct: 57, color: 'bg-gray-500' },
  { plan: 'Starter', count: 11284, pct: 22, color: 'bg-blue-500' },
  { plan: 'Pro', count: 7850, pct: 16, color: 'bg-indigo-500' },
  { plan: 'Business', count: 2510, pct: 5, color: 'bg-purple-500' },
];

export default function AdminDashboardPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-gray-400 mt-1">Real-time stats across all businesses on Yantrix</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map((stat, idx) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <div className={`h-10 w-10 rounded-xl bg-${stat.color}-900/30 flex items-center justify-center mb-3`}>
              <stat.icon className={`h-5 w-5 text-${stat.color}-400`} />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            <p className={`text-xs text-${stat.color}-400 mt-1`}>{stat.change}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Plan Distribution */}
        <div className="lg:col-span-1 rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="text-base font-semibold text-white mb-4">Plan Distribution</h2>
          <div className="space-y-4">
            {PLAN_DIST.map(item => (
              <div key={item.plan}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">{item.plan}</span>
                  <span className="text-gray-400">{item.count.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-800">
                  <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Signups */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="text-base font-semibold text-white mb-4">Recent Signups</h2>
          <div className="space-y-3">
            {RECENT_USERS.map(user => (
              <div key={user.email} className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs font-bold">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email} · {user.business}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-indigo-900/50 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-800">{user.plan}</span>
                  <span className={`flex items-center gap-1 text-xs ${user.status === 'active' ? 'text-green-400' : 'text-amber-400'}`}>
                    {user.status === 'active' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    {user.joined}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="rounded-2xl border border-amber-800/50 bg-amber-900/20 p-4 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-300">3 businesses have overdue payments</p>
          <p className="text-xs text-amber-500">Review their subscription status and send reminder emails</p>
        </div>
        <button className="ml-auto text-xs font-medium text-amber-400 hover:text-amber-300 whitespace-nowrap">View →</button>
      </div>
    </div>
  );
}
