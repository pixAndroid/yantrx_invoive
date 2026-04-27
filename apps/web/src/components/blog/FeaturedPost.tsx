import Link from 'next/link';
import { Clock, Eye, ArrowRight, Star } from 'lucide-react';

export interface BlogPost {
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
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface Props {
  post: BlogPost;
}

export function FeaturedPost({ post }: Props) {
  return (
    <div className="mb-14">
      {/* Section label */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-200" />
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest">
          <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
          Featured
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-200" />
      </div>

      <Link href={`/blog/${post.slug}`} className="group block">
        <div className="grid md:grid-cols-5 gap-0 bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          {/* Image — 3/5 width */}
          <div className="md:col-span-3 relative overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50">
            {post.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.coverImage}
                alt={post.title}
                className="h-64 md:h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="h-64 md:h-full flex items-center justify-center">
                <span className="text-7xl select-none">📝</span>
              </div>
            )}
            {/* Featured badge overlay */}
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-amber-600 text-xs font-bold px-3 py-1 rounded-full shadow-sm border border-amber-100">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                Featured
              </span>
            </div>
          </div>

          {/* Content — 2/5 width */}
          <div className="md:col-span-2 p-8 md:p-10 flex flex-col justify-center">
            {post.category && (
              <span
                className="self-start text-xs font-bold px-3 py-1 rounded-full mb-4"
                style={{
                  background: post.category.color ? `${post.category.color}18` : '#eef2ff',
                  color: post.category.color || '#6366f1',
                }}
              >
                {post.category.name}
              </span>
            )}

            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-3">
              {post.title}
            </h2>

            {post.excerpt && (
              <p className="text-gray-500 text-sm leading-relaxed mb-5 line-clamp-3">
                {post.excerpt}
              </p>
            )}

            {/* Meta */}
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-6 flex-wrap">
              <div className="flex items-center gap-1.5">
                {post.authorAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.authorAvatar} alt="" className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                    <span className="text-white text-[9px] font-bold">{post.authorName.charAt(0)}</span>
                  </div>
                )}
                <span className="font-medium text-gray-600">{post.authorName}</span>
              </div>
              <span>·</span>
              <span>{formatDate(post.publishedAt)}</span>
              {post.readTime && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {post.readTime} min read
                  </span>
                </>
              )}
              {post.totalViews > 0 && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {post.totalViews.toLocaleString()}
                  </span>
                </>
              )}
            </div>

            <div className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors w-fit">
              Read Article
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
