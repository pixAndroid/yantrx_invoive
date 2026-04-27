import { Clock, Eye, Calendar } from 'lucide-react';
import type { BlogPost } from './FeaturedPost';

function formatDate(dateStr: string | null) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

interface Props {
  post: BlogPost & {
    authorBio?: string | null;
    tags?: Array<{ tag: { id: string; name: string; slug: string; color: string | null } }>;
  };
}

export function ArticleHeader({ post }: Props) {
  return (
    <header className="max-w-4xl mx-auto px-4 pt-12 pb-8">
      {/* Category badge */}
      {post.category && (
        <div className="mb-4">
          <span
            className="inline-block text-xs font-bold px-3 py-1 rounded-full"
            style={{
              background: post.category.color ? `${post.category.color}18` : '#eef2ff',
              color: post.category.color || '#6366f1',
            }}
          >
            {post.category.name}
          </span>
        </div>
      )}

      {/* Title */}
      <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-5 tracking-tight">
        {post.title}
      </h1>

      {/* Excerpt */}
      {post.excerpt && (
        <p className="text-xl text-gray-500 leading-relaxed mb-8 font-normal">{post.excerpt}</p>
      )}

      {/* Author + meta row */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-7 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {post.authorAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.authorAvatar}
              alt={post.authorName}
              className="h-11 w-11 rounded-full object-cover ring-2 ring-gray-100"
            />
          ) : (
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg ring-2 ring-indigo-100">
              {post.authorName.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900 text-sm">{post.authorName}</p>
            <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(post.publishedAt)}
              </span>
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
                    {post.totalViews.toLocaleString()} views
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
