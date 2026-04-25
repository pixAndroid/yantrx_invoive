'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PublicLayout } from '@/components/layout/PublicLayout';
import Link from 'next/link';
import {
  Wrench, ExternalLink, ArrowRight, CheckCircle, Tag, Star,
  Clock, Loader2, AlertCircle, ChevronLeft,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

interface Tool {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  fullDescription: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  screenshots: string[];
  category: string | null;
  tags: string[];
  toolType: string;
  internalRoute: string | null;
  externalUrl: string | null;
  customHtml: string | null;
  customCss: string | null;
  customJs: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
  pricingType: string;
  featured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
}

export default function ToolSlugPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!params.slug) return;

    fetch(`${API_URL}/tools/${params.slug}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          const t: Tool = data.data;

          // If it's an internal app, redirect to the real route
          if (t.toolType === 'INTERNAL_APP' && t.internalRoute) {
            router.replace(t.internalRoute);
            return;
          }
          // If it's an external URL, redirect immediately
          if (t.toolType === 'EXTERNAL_URL' && t.externalUrl) {
            window.location.href = t.externalUrl;
            return;
          }

          setTool(t);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.slug, router]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center py-40">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </PublicLayout>
    );
  }

  if (notFound || !tool) {
    return (
      <PublicLayout>
        <div className="container-wide py-32 text-center max-w-lg mx-auto">
          <div className="inline-flex h-16 w-16 rounded-2xl bg-gray-100 items-center justify-center mb-6">
            <AlertCircle className="h-8 w-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Tool Not Found</h1>
          <p className="text-gray-600 mb-8">
            This tool doesn&apos;t exist or isn&apos;t available right now.
          </p>
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to All Tools
          </Link>
        </div>
      </PublicLayout>
    );
  }

  // COMING SOON page
  if (tool.toolType === 'COMING_SOON') {
    return (
      <PublicLayout>
        <section className="py-32 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
          <div className="container-wide max-w-2xl mx-auto text-center">
            <div className="inline-flex h-20 w-20 rounded-3xl bg-indigo-100 items-center justify-center mb-6">
              {tool.logoUrl ? (
                <img src={tool.logoUrl} alt={tool.title} className="h-full w-full object-cover rounded-3xl" />
              ) : (
                <Clock className="h-10 w-10 text-indigo-600" />
              )}
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-700 mb-6">
              <Clock className="h-3.5 w-3.5" />
              Coming Soon
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{tool.title}</h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              {tool.shortDescription || tool.fullDescription || 'This tool is launching soon. Get notified when it&apos;s ready.'}
            </p>
            {tool.category && (
              <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
                <Tag className="h-3.5 w-3.5" />
                {tool.category}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white hover:bg-indigo-700 transition-all shadow-lg"
              >
                Get Notified
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/tools"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-8 py-4 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
                All Tools
              </Link>
            </div>
          </div>
        </section>
      </PublicLayout>
    );
  }

  // CUSTOM HTML TOOL — render in sandbox
  if (tool.toolType === 'CUSTOM_HTML_TOOL') {
    return (
      <PublicLayout>
        {/* Tool header */}
        <section className="py-10 bg-gradient-to-br from-indigo-50 to-white border-b border-gray-100">
          <div className="container-wide">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <Link href="/tools" className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                  <ChevronLeft className="h-5 w-5" />
                </Link>
                <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center overflow-hidden">
                  {tool.logoUrl ? (
                    <img src={tool.logoUrl} alt={tool.title} className="h-full w-full object-cover" />
                  ) : (
                    <Wrench className="h-7 w-7 text-indigo-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {tool.featured && (
                      <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                        <Star className="h-3 w-3 fill-current" /> Featured
                      </span>
                    )}
                    {tool.category && (
                      <span className="bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">{tool.category}</span>
                    )}
                    <span className="bg-green-50 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                      {tool.pricingType}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">{tool.title}</h1>
                  {tool.shortDescription && (
                    <p className="text-gray-600 mt-0.5">{tool.shortDescription}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sandboxed tool */}
        <section className="bg-gray-50 min-h-[600px]">
          <iframe
            sandbox="allow-scripts"
            className="w-full min-h-[600px] border-0"
            srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${tool.customCss || ''}</style></head><body>${tool.customHtml || ''}<script>${tool.customJs || ''}<\/script></body></html>`}
            title={tool.title}
          />
        </section>

        {/* Tags */}
        {tool.tags?.length > 0 && (
          <section className="py-8 bg-white border-t border-gray-100">
            <div className="container-wide">
              <div className="flex flex-wrap gap-2">
                {tool.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 rounded-full px-3 py-1 text-sm">
                    <Tag className="h-3.5 w-3.5" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}
      </PublicLayout>
    );
  }

  // DEFAULT: Generic tool detail page (for any other type that wasn't redirected)
  return (
    <PublicLayout>
      {/* Banner */}
      {tool.bannerUrl && (
        <div className="h-64 w-full overflow-hidden">
          <img src={tool.bannerUrl} alt={tool.title} className="h-full w-full object-cover" />
        </div>
      )}

      <section className="py-16 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="container-wide max-w-4xl mx-auto">
          <div className="flex items-start gap-6">
            <div className="h-20 w-20 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
              {tool.logoUrl ? (
                <img src={tool.logoUrl} alt={tool.title} className="h-full w-full object-cover" />
              ) : (
                <Wrench className="h-10 w-10 text-indigo-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {tool.featured && (
                  <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 border border-yellow-200 text-sm font-semibold px-3 py-1 rounded-full">
                    <Star className="h-3.5 w-3.5 fill-current" /> Featured
                  </span>
                )}
                {tool.category && (
                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-sm font-medium px-3 py-1 rounded-full">{tool.category}</span>
                )}
                <span className="bg-green-50 text-green-700 border border-green-200 text-sm font-medium px-3 py-1 rounded-full">{tool.pricingType}</span>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">{tool.title}</h1>
              {tool.shortDescription && (
                <p className="text-xl text-gray-600 leading-relaxed mb-6">{tool.shortDescription}</p>
              )}
              <div className="flex flex-wrap gap-3">
                <Link
                  href={tool.ctaUrl || `/tools/${tool.slug}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  {tool.ctaText || 'Launch Tool'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/tools"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-6 py-4 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                  All Tools
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full description */}
      {tool.fullDescription && (
        <section className="py-16 bg-white">
          <div className="container-wide max-w-3xl mx-auto">
            <div className="prose prose-gray max-w-none">
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{tool.fullDescription}</div>
            </div>
          </div>
        </section>
      )}

      {/* Screenshots */}
      {tool.screenshots?.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container-wide">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Screenshots</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {tool.screenshots.map((s, i) => (
                <img key={i} src={s} alt={`${tool.title} screenshot ${i + 1}`} className="rounded-2xl border border-gray-200 shadow-sm w-full object-cover" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Tags */}
      {tool.tags?.length > 0 && (
        <section className="py-10 bg-white border-t border-gray-100">
          <div className="container-wide">
            <div className="flex flex-wrap gap-2">
              {tool.tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 rounded-full px-3 py-1.5 text-sm">
                  <Tag className="h-3.5 w-3.5" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-purple-700 text-center">
        <div className="container-wide max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-indigo-200 mb-8 text-lg">Launch {tool.title} and streamline your business operations today.</p>
          <Link
            href={tool.ctaUrl || `/tools/${tool.slug}`}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-indigo-600 hover:bg-indigo-50 transition-all shadow-lg"
          >
            {tool.ctaText || 'Launch Tool'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
