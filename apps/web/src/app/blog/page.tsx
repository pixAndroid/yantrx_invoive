'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { BlogHero } from '@/components/blog/BlogHero';
import { CategoryFilter } from '@/components/blog/CategoryFilter';
import { FeaturedPost } from '@/components/blog/FeaturedPost';
import { BlogCard } from '@/components/blog/BlogCard';
import { Pagination } from '@/components/blog/Pagination';
import { NewsletterCTA } from '@/components/blog/NewsletterCTA';
import type { BlogPost } from '@/components/blog/FeaturedPost';
import type { Category } from '@/components/blog/CategoryFilter';
import { FileSearch } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const POSTS_PER_PAGE = 12;

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
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
    setCurrentPage(1);
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    fetch(`${API_URL}/blog/public/categories`)
      .then(r => r.json())
      .then(d => { if (d.success) setCategories(d.data); })
      .catch(() => {});
  }, []);

  const featured = posts.find(p => p.isFeatured);
  const remaining = posts.filter(p => p.id !== featured?.id);

  // Paginate remaining posts
  const totalPages = Math.ceil(remaining.length / POSTS_PER_PAGE);
  const paginatedPosts = remaining.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  const handleCategoryChange = (slug: string) => {
    setActiveCategory(slug);
    setCurrentPage(1);
  };

  return (
    <PublicLayout>
      <div className="bg-white min-h-screen">
        {/* Hero */}
        <BlogHero search={search} onSearchChange={v => { setSearch(v); setCurrentPage(1); }} />

        {/* Category Filter */}
        <CategoryFilter
          categories={categories}
          active={activeCategory}
          onChange={handleCategoryChange}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          {loading ? (
            <LoadingSkeleton />
          ) : posts.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Featured Article */}
              {featured && <FeaturedPost post={featured} />}

              {/* Latest Articles Grid */}
              {paginatedPosts.length > 0 && (
                <>
                  <SectionDivider label="Latest Articles" />
                  <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: {},
                      show: { transition: { staggerChildren: 0.07 } },
                    }}
                  >
                    {paginatedPosts.map((post, idx) => (
                      <BlogCard key={post.id} post={post} index={idx} />
                    ))}
                  </motion.div>

                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={p => {
                      setCurrentPage(p);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                </>
              )}

              {/* Newsletter CTA */}
              <NewsletterCTA />
            </>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-200" />
      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-200" />
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
        <FileSearch className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">No articles found</h3>
      <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
        Try adjusting your search or selecting a different category.
      </p>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-10">
      {/* Featured skeleton */}
      <div className="h-72 bg-gray-100 rounded-3xl animate-pulse" />
      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-video bg-gray-100 rounded-2xl animate-pulse" />
            <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
            <div className="h-3 bg-gray-100 rounded animate-pulse w-5/6" />
          </div>
        ))}
      </div>
    </div>
  );
}
