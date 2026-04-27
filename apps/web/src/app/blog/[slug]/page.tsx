import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PublicLayout } from '@/components/layout/PublicLayout';
import ReadingProgress from './ReadingProgress';
import ClapButton from './ClapButton';
import { ArticleHeader } from '@/components/blog/ArticleHeader';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { RelatedPosts } from '@/components/blog/RelatedPosts';
import { ShareButtons } from '@/components/blog/ShareButtons';
import { NewsletterCTA } from '@/components/blog/NewsletterCTA';
import { ArrowLeft, ArrowRight, Eye } from 'lucide-react';

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
  isFeatured: boolean;
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yantrixlabs.com';

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || undefined,
    alternates: { canonical: `${siteUrl}/blog/${post.slug}` },
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
      url: `${siteUrl}/blog/${post.slug}`,
      siteName: 'Yantrix Labs',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.ogTitle || post.title,
      description: post.ogDescription || post.excerpt || undefined,
      images: post.ogImage ? [post.ogImage] : post.coverImage ? [post.coverImage] : [],
    },
  };
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
    url: pageUrl,
    publisher: {
      '@type': 'Organization',
      name: 'Yantrix Labs',
      logo: { '@type': 'ImageObject', url: 'https://yantrixlabs.com/logo.png' },
    },
  };

  // Cast for component compatibility (adding missing fields with defaults)
  const postForComponents = {
    ...post,
    isFeatured: post.isFeatured ?? false,
    totalClaps: post.totalClaps ?? 0,
    totalViews: post.totalViews ?? 0,
  };

  const relatedForComponents = related.map(r => ({
    ...r,
    isFeatured: false,
    totalClaps: r.totalClaps ?? 0,
  }));

  return (
    <PublicLayout>
      {/* Reading progress bar */}
      <ReadingProgress />

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="bg-white min-h-screen pt-1">
        {/* Article Header */}
        <ArticleHeader post={postForComponents} />

        {/* Share buttons row (below header) */}
        <div className="max-w-4xl mx-auto px-4 mb-6 flex items-center justify-between flex-wrap gap-3">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            All Articles
          </Link>
          <ShareButtons url={pageUrl} title={post.title} />
        </div>

        {/* Cover Image */}
        {post.coverImage && (
          <div className="max-w-4xl mx-auto px-4 mb-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-64 md:h-[28rem] object-cover rounded-3xl shadow-xl"
            />
          </div>
        )}

        {/* Content + Sidebar */}
        <div className="max-w-7xl mx-auto px-4 pb-16">
          <div className="flex gap-12 items-start">
            {/* ── Main Article ─────────────────────────────── */}
            <article className="flex-1 min-w-0">
              {/* Article body */}
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
                      className="text-xs px-3 py-1.5 rounded-full border hover:bg-gray-50 transition-colors font-medium"
                      style={{ borderColor: tag.color || '#e5e7eb', color: tag.color || '#6b7280' }}
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* Clap + Share bar */}
              <div className="mt-10 flex items-center justify-between py-6 border-t border-b border-gray-100">
                <ClapButton postId={post.id} initialClaps={post.totalClaps} />
                <ShareButtons url={pageUrl} title={post.title} />
              </div>

              {/* Author Bio */}
              {post.authorBio && (
                <div className="mt-10 p-7 bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-3xl border border-gray-100">
                  <div className="flex items-start gap-5">
                    {post.authorAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.authorAvatar}
                        alt={post.authorName}
                        className="h-16 w-16 rounded-2xl object-cover flex-shrink-0 shadow-sm"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-2xl flex-shrink-0 shadow-sm">
                        {post.authorName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-0.5">Written by</p>
                      <p className="font-bold text-gray-900 text-lg">{post.authorName}</p>
                      <p className="text-gray-500 text-sm mt-2 leading-relaxed">{post.authorBio}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Related Posts */}
              <RelatedPosts posts={relatedForComponents} />

              {/* Newsletter CTA */}
              <NewsletterCTA />

              {/* Prev / Next Navigation */}
              {related.length > 0 && (
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link
                    href={`/blog/${related[0].slug}`}
                    className="group flex items-start gap-3 p-5 rounded-2xl border border-gray-100 bg-white hover:shadow-md hover:border-indigo-100 transition-all duration-200"
                  >
                    <ArrowLeft className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Previous</p>
                      <p className="text-sm font-bold text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                        {related[0].title}
                      </p>
                    </div>
                  </Link>
                  {related[1] && (
                    <Link
                      href={`/blog/${related[1].slug}`}
                      className="group flex items-start gap-3 p-5 rounded-2xl border border-gray-100 bg-white hover:shadow-md hover:border-indigo-100 transition-all duration-200 text-right justify-end"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Next</p>
                        <p className="text-sm font-bold text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                          {related[1].title}
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors mt-0.5 flex-shrink-0" />
                    </Link>
                  )}
                </div>
              )}
            </article>

            {/* ── Sticky Right Sidebar ──────────────────────── */}
            <aside className="hidden lg:flex flex-col gap-6 w-64 flex-shrink-0">
              <div className="sticky top-24 space-y-6">
                {/* Table of Contents */}
                {toc.length > 1 && (
                  <div className="bg-gray-50 rounded-2xl p-5">
                    <TableOfContents items={toc} />
                  </div>
                )}

                {/* Share Buttons */}
                <div className="bg-gray-50 rounded-2xl p-5">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Share</h4>
                  <ShareButtons url={pageUrl} title={post.title} />
                </div>

                {/* Stats */}
                <div className="bg-gray-50 rounded-2xl p-5">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Stats</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5 text-gray-400" />
                        Views
                      </span>
                      <span className="font-semibold text-gray-800">{post.totalViews.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        👏 Claps
                      </span>
                      <span className="font-semibold text-gray-800">{post.totalClaps.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Related in sidebar */}
                {related.length > 0 && (
                  <div className="bg-gray-50 rounded-2xl p-5">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                      Related Articles
                    </h4>
                    <div className="space-y-4">
                      {related.slice(0, 3).map(rp => (
                        <Link key={rp.id} href={`/blog/${rp.slug}`} className="group flex gap-3 items-start">
                          <div className="h-12 w-12 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-indigo-50 to-purple-50">
                            {rp.coverImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={rp.coverImage} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <span className="text-lg">📄</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors line-clamp-3 leading-snug">
                            {rp.title}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
