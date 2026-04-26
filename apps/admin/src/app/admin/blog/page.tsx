'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/api';
import {
  BookOpen, Eye, Heart, Star, Plus, Tag, Image, BarChart2,
  FileText, TrendingUp, Clock, CheckCircle, Archive,
} from 'lucide-react';

interface DashboardStats {
  totalPosts: number;
  published: number;
  drafts: number;
  scheduled: number;
  archived: number;
  totalViews: number;
  totalClaps: number;
  topPosts: Array<{
    id: string;
    title: string;
    slug: string;
    status: string;
    totalViews: number;
    totalClaps: number;
    seoScore: number | null;
    publishedAt: string | null;
    coverImage: string | null;
  }>;
  avgSeoScore: number;
}

const STATUS_COLOR: Record<string, string> = {
  PUBLISHED: 'text-green-400',
  DRAFT: 'text-gray-400',
  SCHEDULED: 'text-blue-400',
  ARCHIVED: 'text-orange-400',
};

export default function BlogDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminFetch<{ success: boolean; data: DashboardStats }>('/blog/stats/dashboard')
      .then(d => setStats(d.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 bg-gray-950 min-h-screen">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-800 rounded" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-28 bg-gray-900 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-gray-950 min-h-screen flex items-center justify-center">
        <div className="text-red-400 bg-red-900/20 border border-red-800 rounded-xl p-6">{error}</div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Articles', value: stats?.totalPosts ?? 0, icon: BookOpen, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { label: 'Published', value: stats?.published ?? 0, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Drafts', value: stats?.drafts ?? 0, icon: FileText, color: 'text-gray-400', bg: 'bg-gray-400/10' },
    { label: 'Scheduled', value: stats?.scheduled ?? 0, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Total Views', value: (stats?.totalViews ?? 0).toLocaleString(), icon: Eye, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
    { label: 'Total Claps', value: (stats?.totalClaps ?? 0).toLocaleString(), icon: Heart, color: 'text-pink-400', bg: 'bg-pink-400/10' },
    { label: 'Archived', value: stats?.archived ?? 0, icon: Archive, color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { label: 'Avg SEO Score', value: stats?.avgSeoScore ?? 0, icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  ];

  const maxViews = Math.max(...(stats?.topPosts.map(p => p.totalViews) ?? [1]), 1);

  return (
    <div className="p-8 bg-gray-950 min-h-screen space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-indigo-400" />
            Blog Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage your content and track performance</p>
        </div>
        <Link
          href="/admin/blog/articles/new"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Article
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">{card.label}</span>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-indigo-400" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/admin/blog/articles/new', label: 'New Article', icon: Plus, color: 'bg-indigo-600 hover:bg-indigo-700' },
            { href: '/admin/blog/categories', label: 'Categories', icon: BarChart2, color: 'bg-gray-700 hover:bg-gray-600' },
            { href: '/admin/blog/tags', label: 'Tags', icon: Tag, color: 'bg-gray-700 hover:bg-gray-600' },
            { href: '/admin/blog/media', label: 'Media Library', icon: Image, color: 'bg-gray-700 hover:bg-gray-600' },
          ].map(action => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex items-center gap-2 ${action.color} text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors`}
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Top Posts */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-indigo-400" />
          Top Performing Articles
        </h2>
        {stats?.topPosts.length === 0 ? (
          <p className="text-gray-500 text-sm">No articles yet.</p>
        ) : (
          <div className="space-y-4">
            {stats?.topPosts.map(post => (
              <div key={post.id} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white text-sm font-medium truncate">{post.title}</p>
                    <span className={`text-xs ${STATUS_COLOR[post.status] || 'text-gray-400'}`}>
                      {post.status}
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full"
                      style={{ width: `${Math.round((post.totalViews / maxViews) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400 flex-shrink-0">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {post.totalViews.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {post.totalClaps}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {post.seoScore ?? '-'}
                  </span>
                  <Link
                    href={`/admin/blog/articles/${post.id}/edit`}
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
