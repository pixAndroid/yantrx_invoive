'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, Eye, ArrowRight } from 'lucide-react';
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
  post: BlogPost;
  index?: number;
}

export function BlogCard({ post, index = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
    >
      <Link href={`/blog/${post.slug}`} className="group block h-full">
        <article className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 h-full flex flex-col">
          {/* 16:9 thumbnail */}
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
                <span className="text-5xl select-none">📄</span>
              </div>
            )}
            {/* Category badge overlay */}
            {post.category && (
              <div className="absolute top-3 left-3">
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm"
                  style={{
                    background: post.category.color ? `${post.category.color}e0` : '#6366f1e0',
                    color: '#fff',
                  }}
                >
                  {post.category.name}
                </span>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="p-5 flex flex-col flex-1">
            <h3 className="text-gray-900 font-bold text-base leading-snug line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">
              {post.title}
            </h3>
            {post.excerpt && (
              <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 flex-1 mb-4">
                {post.excerpt}
              </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
              <div className="flex items-center gap-2 min-w-0">
                {post.authorAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.authorAvatar}
                    alt=""
                    className="h-6 w-6 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[9px] font-bold">
                      {post.authorName.charAt(0)}
                    </span>
                  </div>
                )}
                <span className="text-xs text-gray-500 truncate">{post.authorName}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-gray-400 flex-shrink-0">
                {post.readTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {post.readTime}m
                  </span>
                )}
                {post.totalViews > 0 && (
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {post.totalViews.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 mt-3 text-indigo-600 text-xs font-semibold">
              Read More
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}
