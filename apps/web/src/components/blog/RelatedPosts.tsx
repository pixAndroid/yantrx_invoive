import Link from 'next/link';
import { Clock } from 'lucide-react';
import type { BlogPost } from './FeaturedPost';

function formatDate(dateStr: string | null) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface Props {
  posts: BlogPost[];
}

export function RelatedPosts({ posts }: Props) {
  if (!posts.length) return null;

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.slice(0, 3).map(post => (
          <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
            <article className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
              {/* Thumbnail */}
              <div className="relative overflow-hidden aspect-video bg-gradient-to-br from-indigo-50 to-purple-50">
                {post.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl select-none">📄</span>
                  </div>
                )}
                {post.category && (
                  <div className="absolute top-2 left-2">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                      style={{ background: post.category.color || '#6366f1' }}
                    >
                      {post.category.name}
                    </span>
                  </div>
                )}
              </div>
              {/* Content */}
              <div className="p-4 flex flex-col flex-1">
                <p className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">
                  {post.title}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-auto">
                  <span>{formatDate(post.publishedAt)}</span>
                  {post.readTime && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.readTime}m
                      </span>
                    </>
                  )}
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
