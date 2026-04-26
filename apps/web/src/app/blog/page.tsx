'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Search, Clock, Eye, Heart, ArrowRight, Rss } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  _count: { posts: number };
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  authorName: string;
  authorAvatar: string | null;
  publishedAt: string | null;
  readTime: number | null;
  totalViews: number;
  totalClaps: number;
  isFeatured: boolean;
  category: { id: string; name: string; slug: string; color: string | null } | null;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function CategoryBadge({ category }: { category: Post['category'] }) {
  if (!category) return null;
  return (
    <span
      className="text-xs font-semibold px-3 py-1 rounded-full"
      style={{
        background: category.color ? `${category.color}20` : '#eef2ff',
        color: category.color || '#6366f1',
      }}
    >
      {category.name}
    </span>
  );
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [email, setEmail] = useState('');

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (search) params.set('search', search);
      if (activeCategory) params.set('category', activeCategory);

      const res = await fetch(`${API_URL}/blog/public/posts?${params}`);
      const data = await res.json();
      if (data.success) setPosts(data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search, activeCategory]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    fetch(`${API_URL}/blog/public/categories`)
      .then(r => r.json())
      .then(d => { if (d.success) setCategories(d.data); })
      .catch(() => {});
  }, []);

  const featured = posts.find(p => p.isFeatured) || posts[0];
  const remaining = posts.filter(p => p.id !== featured?.id);
  const trending = [...posts].sort((a, b) => b.totalViews - a.totalViews).slice(0, 5);

  return (
    <PublicLayout>
      <div className="bg-white min-h-screen">
        {/* Hero */}
        <section className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 text-white py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-indigo-800/50 border border-indigo-700 rounded-full px-4 py-1.5 text-sm text-indigo-200 mb-6">
              <Rss className="h-3.5 w-3.5" />
              Yantrix Labs Blog
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
              Insights & Ideas
            </h1>
            <p className="text-xl text-indigo-200 mb-10 max-w-2xl mx-auto leading-relaxed">
              Discover tips, tutorials, and stories about building great software and growing your business.
            </p>
            {/* Search */}
            <div className="relative max-w-lg mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-300" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search articles..."
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-indigo-300 pl-12 pr-4 py-3.5 rounded-2xl focus:outline-none focus:border-indigo-400 focus:bg-white/15 text-base"
              />
            </div>
          </div>
        </section>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveCategory('')}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  !activeCategory
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(activeCategory === cat.slug ? '' : cat.slug)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === cat.slug
                      ? 'text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  style={
                    activeCategory === cat.slug
                      ? { background: cat.color || '#6366f1' }
                      : {}
                  }
                >
                  {cat.name}
                  <span className="ml-1.5 text-xs opacity-70">({cat._count.posts})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto px-4 py-12">
          {loading ? (
            <div className="space-y-8">
              <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
              <div className="grid grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />)}
              </div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-xl">No articles found.</p>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-12">
              {/* Main Content */}
              <div className="flex-1">
                {/* Featured Article */}
                {featured && (
                  <div className="mb-12">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="h-px flex-1 bg-gray-200" />
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Featured</span>
                      <div className="h-px flex-1 bg-gray-200" />
                    </div>
                    <Link href={`/blog/${featured.slug}`} className="group block">
                      <div className="grid md:grid-cols-2 gap-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-shadow">
                        {featured.coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={featured.coverImage}
                            alt={featured.title}
                            className="h-64 md:h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-64 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                            <span className="text-5xl">📝</span>
                          </div>
                        )}
                        <div className="p-8 flex flex-col justify-center">
                          <CategoryBadge category={featured.category} />
                          <h2 className="text-2xl font-bold text-gray-900 mt-3 mb-3 group-hover:text-indigo-600 transition-colors leading-snug">
                            {featured.title}
                          </h2>
                          {featured.excerpt && (
                            <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">{featured.excerpt}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span>{featured.authorName}</span>
                            <span>·</span>
                            <span>{formatDate(featured.publishedAt)}</span>
                            {featured.readTime && (
                              <>
                                <span>·</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {featured.readTime}m
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-4 text-indigo-600 text-sm font-medium">
                            Read article <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                )}

                {/* Latest Posts Grid */}
                {remaining.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 mb-6">
                      <div className="h-px flex-1 bg-gray-200" />
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Latest</span>
                      <div className="h-px flex-1 bg-gray-200" />
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {remaining.map(post => (
                        <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                          <article className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 h-full flex flex-col">
                            {post.coverImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={post.coverImage}
                                alt={post.title}
                                className="h-44 w-full object-cover"
                              />
                            ) : (
                              <div className="h-44 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                                <span className="text-4xl">📄</span>
                              </div>
                            )}
                            <div className="p-5 flex flex-col flex-1">
                              <CategoryBadge category={post.category} />
                              <h3 className="text-gray-900 font-bold mt-2 mb-2 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2">
                                {post.title}
                              </h3>
                              {post.excerpt && (
                                <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 flex-1">{post.excerpt}</p>
                              )}
                              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-2">
                                  {post.authorAvatar ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={post.authorAvatar} alt="" className="h-6 w-6 rounded-full object-cover" />
                                  ) : (
                                    <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                                      <span className="text-indigo-600 text-xs font-bold">
                                        {post.authorName.charAt(0)}
                                      </span>
                                    </div>
                                  )}
                                  <span className="text-xs text-gray-500">{post.authorName}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-400">
                                  {post.readTime && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {post.readTime}m
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    {post.totalViews.toLocaleString()}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Heart className="h-3 w-3" />
                                    {post.totalClaps}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </article>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:w-72 space-y-8">
                {/* Trending */}
                {trending.length > 0 && (
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <h3 className="text-gray-900 font-bold mb-4 flex items-center gap-2">
                      <span className="text-lg">🔥</span>
                      Trending
                    </h3>
                    <div className="space-y-4">
                      {trending.map((post, idx) => (
                        <Link key={post.id} href={`/blog/${post.slug}`} className="flex items-start gap-3 group">
                          <span className="text-2xl font-bold text-gray-200">{String(idx + 1).padStart(2, '0')}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                              {post.title}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {post.totalViews.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Newsletter CTA */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
                  <h3 className="font-bold text-lg mb-2">Stay Updated</h3>
                  <p className="text-indigo-100 text-sm mb-4 leading-relaxed">
                    Get the latest articles and insights delivered to your inbox.
                  </p>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-indigo-200 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:bg-white/25 mb-3"
                  />
                  <button className="w-full bg-white text-indigo-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-indigo-50 transition-colors">
                    Subscribe
                  </button>
                </div>

                {/* Categories sidebar */}
                {categories.length > 0 && (
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <h3 className="text-gray-900 font-bold mb-4">Categories</h3>
                    <div className="space-y-2">
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => setActiveCategory(activeCategory === cat.slug ? '' : cat.slug)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${
                            activeCategory === cat.slug
                              ? 'font-medium text-white'
                              : 'text-gray-700 hover:bg-white'
                          }`}
                          style={activeCategory === cat.slug ? { background: cat.color || '#6366f1' } : {}}
                        >
                          <span>{cat.name}</span>
                          <span className="text-xs bg-white/30 px-2 py-0.5 rounded-full">
                            {cat._count.posts}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
