import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PublicLayout } from '@/components/layout/PublicLayout';
import ReadingProgress from './ReadingProgress';
import ClapButton from './ClapButton';
import ShareButtons from './ShareButtons';
import { Clock, Eye, ArrowLeft, ArrowRight } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  contentHtml: string | null;
  content: string;
  coverImage: string | null;
  authorName: string;
  authorAvatar: string | null;
  authorBio: string | null;
  publishedAt: string | null;
  readTime: number | null;
  totalViews: number;
  totalClaps: number;
  schemaType: string;
  seoTitle: string | null;
  seoDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  robotsIndex: boolean;
  robotsFollow: boolean;
  category: { id: string; name: string; slug: string; color: string | null } | null;
  tags: Array<{ tag: { id: string; name: string; slug: string; color: string | null } }>;
}

interface PageProps {
  params: { slug: string };
}

async function getPost(slug: string): Promise<{ post: Post; related: Post[] } | null> {
  try {
    const res = await fetch(`${API_URL}/blog/public/posts/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.success) return null;
    return { post: data.data, related: data.related || [] };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const result = await getPost(params.slug);
  if (!result) return { title: 'Article Not Found' };
  const { post } = result;

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || undefined,
    robots: {
      index: post.robotsIndex,
      follow: post.robotsFollow,
    },
    openGraph: {
      title: post.ogTitle || post.title,
      description: post.ogDescription || post.excerpt || undefined,
      images: post.ogImage ? [post.ogImage] : post.coverImage ? [post.coverImage] : [],
      type: 'article',
      publishedTime: post.publishedAt || undefined,
      authors: [post.authorName],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.ogTitle || post.title,
      description: post.ogDescription || post.excerpt || undefined,
      images: post.ogImage ? [post.ogImage] : post.coverImage ? [post.coverImage] : [],
    },
  };
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function extractToc(html: string): Array<{ id: string; text: string; level: number }> {
  const toc: Array<{ id: string; text: string; level: number }> = [];
  const re = /<h([23])[^>]*>(.*?)<\/h[23]>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const level = parseInt(m[1]);
    const text = m[2].replace(/<[^>]+>/g, '').trim();
    const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    toc.push({ id, text, level });
  }
  return toc;
}

function addIdsToHeadings(html: string): string {
  return html.replace(/<h([23])([^>]*)>(.*?)<\/h[23]>/gi, (_, level, attrs, text) => {
    const cleanText = text.replace(/<[^>]+>/g, '').trim();
    const id = cleanText.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    return `<h${level}${attrs} id="${id}">${text}</h${level}>`;
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const result = await getPost(params.slug);
  if (!result) notFound();
  const { post, related } = result;

  const pageUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://yantrixlabs.com'}/blog/${post.slug}`;
  const contentHtml = addIdsToHeadings(post.contentHtml || post.content || '');
  const toc = extractToc(contentHtml);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': post.schemaType === 'HOWTO' ? 'HowTo' : post.schemaType === 'NEWSARTICLE' ? 'NewsArticle' : 'Article',
    headline: post.title,
    description: post.excerpt || post.seoDescription,
    image: post.coverImage || post.ogImage,
    author: { '@type': 'Person', name: post.authorName },
    datePublished: post.publishedAt,
    publisher: {
      '@type': 'Organization',
      name: 'Yantrix Labs',
      logo: { '@type': 'ImageObject', url: 'https://yantrixlabs.com/logo.png' },
    },
  };

  return (
    <PublicLayout>
      <ReadingProgress />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="bg-white min-h-screen pt-1">
        {/* Hero */}
        <header className="max-w-4xl mx-auto px-4 pt-12 pb-8">
          {post.category && (
            <div className="mb-4">
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{
                  background: post.category.color ? `${post.category.color}20` : '#eef2ff',
                  color: post.category.color || '#6366f1',
                }}
              >
                {post.category.name}
              </span>
            </div>
          )}
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-xl text-gray-500 leading-relaxed mb-6">{post.excerpt}</p>
          )}

          {/* Author row */}
          <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {post.authorAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.authorAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {post.authorName.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900 text-sm">{post.authorName}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400">
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
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {post.totalViews.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <ShareButtons url={pageUrl} title={post.title} />
          </div>
        </header>

        {/* Cover Image */}
        {post.coverImage && (
          <div className="max-w-4xl mx-auto px-4 mb-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-64 md:h-96 object-cover rounded-2xl shadow-md"
            />
          </div>
        )}

        {/* Content + Sidebar */}
        <div className="max-w-6xl mx-auto px-4 pb-16 flex gap-12">
          {/* Main Article */}
          <article className="flex-1 max-w-3xl">
            <div
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="mt-10 pt-6 border-t border-gray-100 flex flex-wrap gap-2">
                {post.tags.map(({ tag }) => (
                  <Link
                    key={tag.id}
                    href={`/blog?tag=${tag.slug}`}
                    className="text-xs px-3 py-1 rounded-full border hover:bg-gray-50 transition-colors"
                    style={{ borderColor: tag.color || '#e5e7eb', color: tag.color || '#6b7280' }}
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Author Bio */}
            {post.authorBio && (
              <div className="mt-10 p-6 bg-gray-50 rounded-2xl">
                <div className="flex items-start gap-4">
                  {post.authorAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.authorAvatar} alt="" className="h-14 w-14 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                      {post.authorName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-gray-900">{post.authorName}</p>
                    <p className="text-gray-600 text-sm mt-1 leading-relaxed">{post.authorBio}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Clap + Share */}
            <div className="mt-10 flex items-center justify-between py-6 border-t border-b border-gray-100">
              <ClapButton postId={post.id} initialClaps={post.totalClaps} />
              <ShareButtons url={pageUrl} title={post.title} />
            </div>

            {/* Related Articles */}
            {related.length > 0 && (
              <div className="mt-10">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Related Articles</h2>
                <div className="grid sm:grid-cols-3 gap-6">
                  {related.map(rp => (
                    <Link key={rp.id} href={`/blog/${rp.slug}`} className="group block">
                      <article className="bg-gray-50 rounded-xl overflow-hidden hover:bg-gray-100 transition-colors">
                        {rp.coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={rp.coverImage} alt={rp.title} className="h-32 w-full object-cover" />
                        ) : (
                          <div className="h-32 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                            <span className="text-3xl">📄</span>
                          </div>
                        )}
                        <div className="p-4">
                          <p className="font-semibold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                            {rp.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">{formatDate(rp.publishedAt)}</p>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="mt-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-8 text-white text-center">
              <h3 className="text-2xl font-bold mb-2">Ready to transform your business?</h3>
              <p className="text-indigo-100 mb-6">Join thousands of businesses using Yantrix Labs tools.</p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-white text-indigo-600 font-semibold px-6 py-3 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </article>

          {/* TOC Sidebar */}
          {toc.length > 1 && (
            <aside className="hidden lg:block w-60 flex-shrink-0">
              <div className="sticky top-8">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                  Table of Contents
                </h4>
                <nav className="space-y-1">
                  {toc.map(item => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block text-sm text-gray-600 hover:text-indigo-600 transition-colors py-1 leading-snug ${
                        item.level === 3 ? 'pl-3 text-xs' : ''
                      }`}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>

                <div className="mt-8 flex gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {post.totalViews.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    👏
                    {post.totalClaps}
                  </span>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
