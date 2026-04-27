'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/api';
import {
  BookOpen, Eye, Heart, Star, Plus, Tag, Image, BarChart2,
  FileText, TrendingUp, Clock, CheckCircle, Archive,
  Edit2, ExternalLink, Trash2, CheckSquare, Square,
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
    authorName: string | null;
    category: { id: string; name: string; color: string | null } | null;
  }>;
  avgSeoScore: number;
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-gray-700 text-gray-300',
  PUBLISHED: 'bg-green-900/50 text-green-400 border border-green-800',
  SCHEDULED: 'bg-blue-900/50 text-blue-400 border border-blue-800',
  ARCHIVED: 'bg-orange-900/50 text-orange-400 border border-orange-800',
};

export default function BlogDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const loadStats = () => {
    setLoading(true);
    adminFetch<{ success: boolean; data: DashboardStats }>('/blog/stats/dashboard')
      .then(d => setStats(d.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStats(); }, []);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const posts = stats?.topPosts ?? [];
    setSelected(prev => prev.size === posts.length ? new Set() : new Set(posts.map(p => p.id)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) return;
    try {
      await adminFetch(`/blog/${id}`, { method: 'DELETE' });
      loadStats();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete article.');
    }
  };

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
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-400" />
            Top Performing Articles
          </h2>
          <Link
            href="/admin/blog/articles"
            className="text-indigo-400 hover:text-indigo-300 text-xs"
          >
            View all →
          </Link>
        </div>
        {stats?.topPosts.length === 0 ? (
          <p className="text-gray-500 text-sm p-6">No articles yet.</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button onClick={selectAll} className="text-gray-400 hover:text-white">
                    {selected.size > 0 && selected.size === (stats?.topPosts.length ?? 0) ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Article</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Author</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Views</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Claps</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">SEO</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {stats?.topPosts.map(post => (
                <tr key={post.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <button onClick={() => toggleSelect(post.id)} className="text-gray-400 hover:text-white">
                      {selected.has(post.id) ? (
                        <CheckSquare className="h-4 w-4 text-indigo-400" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {post.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.coverImage}
                          alt=""
                          className="h-10 w-16 object-cover rounded-md flex-shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-16 bg-gray-800 rounded-md flex-shrink-0 flex items-center justify-center">
                          <span className="text-gray-600 text-xs">No img</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate max-w-[200px]">{post.title}</p>
                        <p className="text-gray-500 text-xs truncate max-w-[200px]">{post.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {post.category ? (
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          background: post.category.color ? `${post.category.color}20` : '#374151',
                          color: post.category.color || '#9ca3af',
                        }}
                      >
                        {post.category.name}
                      </span>
                    ) : (
                      <span className="text-gray-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${STATUS_BADGE[post.status] ?? 'bg-gray-700 text-gray-300'}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{post.authorName ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-gray-400 text-xs">
                      <Eye className="h-3 w-3" />
                      {post.totalViews.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-gray-400 text-xs">
                      <Heart className="h-3 w-3" />
                      {post.totalClaps}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {post.seoScore != null ? (
                      <span
                        className={`text-xs font-medium flex items-center gap-1 ${
                          post.seoScore >= 80
                            ? 'text-green-400'
                            : post.seoScore >= 50
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }`}
                      >
                        <Star className="h-3 w-3" />
                        {post.seoScore}
                      </span>
                    ) : (
                      <span className="text-gray-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/blog/articles/${post.id}/edit`}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Link>
                      <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
