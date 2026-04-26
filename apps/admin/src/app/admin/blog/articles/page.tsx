'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/api';
import {
  Plus, Search, Eye, Heart, Star, Edit2, Trash2, ExternalLink,
  ChevronLeft, ChevronRight, CheckSquare, Square,
} from 'lucide-react';

interface Post {
  id: string;
  title: string;
  slug: string;
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED';
  coverImage: string | null;
  authorName: string;
  publishedAt: string | null;
  totalViews: number;
  totalClaps: number;
  seoScore: number | null;
  category: { id: string; name: string; color: string | null } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface Category {
  id: string;
  name: string;
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-gray-700 text-gray-300',
  PUBLISHED: 'bg-green-900/50 text-green-400 border border-green-800',
  SCHEDULED: 'bg-blue-900/50 text-blue-400 border border-blue-800',
  ARCHIVED: 'bg-orange-900/50 text-orange-400 border border-orange-800',
};

export default function ArticlesPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchPosts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (categoryId) params.set('category', categoryId);

      const res = await adminFetch<{ success: boolean; data: Post[]; pagination: Pagination }>(
        `/blog?${params}`
      );
      setPosts(res.data);
      setPagination(res.pagination);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search, status, categoryId]);

  useEffect(() => {
    adminFetch<{ success: boolean; data: Category[] }>('/blog/categories')
      .then(r => setCategories(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this article?')) return;
    await adminFetch(`/blog/${id}`, { method: 'DELETE' });
    fetchPosts(pagination.page);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === posts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(posts.map(p => p.id)));
    }
  };

  const handleBulkAction = async (action: 'PUBLISHED' | 'DRAFT' | 'delete') => {
    if (!selected.size) return;
    setBulkLoading(true);
    try {
      await Promise.all(
        [...selected].map(id =>
          action === 'delete'
            ? adminFetch(`/blog/${id}`, { method: 'DELETE' })
            : adminFetch(`/blog/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ status: action }),
              })
        )
      );
      setSelected(new Set());
      fetchPosts(pagination.page);
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-950 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">All Articles</h1>
          <p className="text-gray-400 text-sm mt-1">{pagination.total} articles total</p>
        </div>
        <Link
          href="/admin/blog/articles/new"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Article
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-gray-900 p-4 rounded-xl border border-gray-800">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search articles..."
            className="w-full bg-gray-800 text-white pl-9 pr-4 py-2 rounded-lg text-sm border border-gray-700 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm border border-gray-700 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <select
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm border border-gray-700 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-indigo-900/30 border border-indigo-800 rounded-xl px-4 py-3">
          <span className="text-indigo-300 text-sm">{selected.size} selected</span>
          <button
            onClick={() => handleBulkAction('PUBLISHED')}
            disabled={bulkLoading}
            className="text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded-lg disabled:opacity-50"
          >
            Publish
          </button>
          <button
            onClick={() => handleBulkAction('DRAFT')}
            disabled={bulkLoading}
            className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-lg disabled:opacity-50"
          >
            Move to Draft
          </button>
          <button
            onClick={() => handleBulkAction('delete')}
            disabled={bulkLoading}
            className="text-xs bg-red-800 hover:bg-red-700 text-white px-3 py-1 rounded-lg disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400 mb-4">No articles found.</p>
            <Link href="/admin/blog/articles/new" className="text-indigo-400 hover:text-indigo-300 text-sm">
              Create your first article →
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button onClick={selectAll} className="text-gray-400 hover:text-white">
                    {selected.size === posts.length ? (
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
              {posts.map(post => (
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
                    <span className={`text-xs px-2 py-1 rounded-full ${STATUS_BADGE[post.status]}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{post.authorName}</td>
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
                        className={`text-xs font-medium ${
                          post.seoScore >= 80
                            ? 'text-green-400'
                            : post.seoScore >= 50
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }`}
                      >
                        <Star className="h-3 w-3 inline mr-1" />
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

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            Page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchPosts(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => fetchPosts(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
