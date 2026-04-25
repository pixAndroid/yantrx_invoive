'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, AlertCircle, ChevronLeft, Edit2, ExternalLink,
  Globe, Lock, Star, Clock, CheckCircle, Wrench, Code2, Tag,
  ArrowRight, Eye,
} from 'lucide-react';
import { adminFetch } from '@/lib/api';

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
  status: string;
  visibility: string;
  featured: boolean;
  toolType: string;
  internalRoute: string | null;
  externalUrl: string | null;
  customHtml: string | null;
  customCss: string | null;
  customJs: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
  pricingType: string;
  seoTitle: string | null;
  seoDescription: string | null;
  sortOrder: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TYPE_MAP: Record<string, { label: string; color: string; icon: any }> = {
  INTERNAL_APP:    { label: 'Internal App',  color: 'bg-indigo-100 text-indigo-700', icon: Wrench },
  CUSTOM_HTML_TOOL:{ label: 'HTML Tool',     color: 'bg-purple-100 text-purple-700', icon: Code2 },
  EXTERNAL_URL:    { label: 'External URL',  color: 'bg-cyan-100 text-cyan-700',     icon: ExternalLink },
  COMING_SOON:     { label: 'Coming Soon',   color: 'bg-amber-100 text-amber-700',   icon: Clock },
};

export default function PreviewToolPage() {
  const params = useParams<{ id: string }>();
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'public' | 'html' | 'css' | 'js'>('public');

  useEffect(() => {
    adminFetch<{ data: Tool }>(`/admin/tools/${params.id}`)
      .then(res => setTool(res.data))
      .catch(e => setError(e.message || 'Failed to load tool'))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-950">
        <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
      </div>
    );
  }

  if (error || !tool) {
    return (
      <div className="flex items-center gap-3 p-8 bg-gray-950 text-red-400">
        <AlertCircle className="h-5 w-5" />
        {error || 'Tool not found'}
      </div>
    );
  }

  const typeMeta = TYPE_MAP[tool.toolType] || { label: tool.toolType, color: 'bg-gray-200 text-gray-700', icon: Wrench };
  const TypeIcon = typeMeta.icon;

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/tools"
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Preview: {tool.title}</h1>
            <p className="text-sm text-gray-500">/tools/{tool.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {tool.status === 'PUBLISHED' && tool.visibility === 'PUBLIC' && (
            <a
              href={`/tools/${tool.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors"
            >
              <Eye className="h-4 w-4" />
              View Live
            </a>
          )}
          <Link
            href={`/admin/tools/${tool.id}/edit`}
            className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
          >
            <Edit2 className="h-4 w-4" />
            Edit Tool
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Meta info */}
        <div className="space-y-4">
          {/* Status card */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Publication</span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                  tool.status === 'PUBLISHED' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-amber-900/30 text-amber-400'
                }`}>
                  {tool.status === 'PUBLISHED' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  {tool.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Visibility</span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                  tool.visibility === 'PUBLIC' ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-400'
                }`}>
                  {tool.visibility === 'PUBLIC' ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  {tool.visibility}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Featured</span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                  tool.featured ? 'bg-yellow-900/30 text-yellow-400' : 'bg-gray-800 text-gray-500'
                }`}>
                  <Star className={`h-3 w-3 ${tool.featured ? 'fill-current' : ''}`} />
                  {tool.featured ? 'Featured' : 'Not Featured'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Type</span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${typeMeta.color}`}>
                  <TypeIcon className="h-3 w-3" />
                  {typeMeta.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Pricing</span>
                <span className="text-xs font-medium text-gray-300">{tool.pricingType}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Analytics</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-white">{tool.viewCount.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-0.5">Views</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-white">{tool.sortOrder}</p>
                <p className="text-xs text-gray-500 mt-0.5">Sort Order</p>
              </div>
            </div>
          </div>

          {/* Meta */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Info</h3>
            {tool.category && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Category:</span>
                <span className="text-gray-300">{tool.category}</span>
              </div>
            )}
            {tool.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tool.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 bg-gray-800 text-gray-400 rounded-full px-2 py-0.5 text-xs">
                    <Tag className="h-2.5 w-2.5" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="text-xs text-gray-600 pt-2 space-y-1">
              <p>Created: {new Date(tool.createdAt).toLocaleDateString('en-IN')}</p>
              <p>Updated: {new Date(tool.updatedAt).toLocaleDateString('en-IN')}</p>
            </div>
          </div>

          {/* SEO */}
          {(tool.seoTitle || tool.seoDescription) && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">SEO Preview</h3>
              <p className="text-blue-400 text-sm font-medium">{tool.seoTitle || tool.title}</p>
              <p className="text-green-600 text-xs mt-0.5">yantrixlab.com/tools/{tool.slug}</p>
              {tool.seoDescription && (
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">{tool.seoDescription}</p>
              )}
            </div>
          )}
        </div>

        {/* Right: Preview */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="flex border-b border-gray-800">
              <button
                onClick={() => setActiveTab('public')}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'public' ? 'text-orange-400 border-b-2 border-orange-500 bg-orange-500/5' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Public Card Preview
              </button>
              {tool.toolType === 'CUSTOM_HTML_TOOL' && (
                <>
                  {(['html', 'css', 'js'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setActiveTab(t)}
                      className={`px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === t ? 'text-orange-400 border-b-2 border-orange-500 bg-orange-500/5' : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {t.toUpperCase()}
                    </button>
                  ))}
                </>
              )}
            </div>

            <div className="p-6">
              {activeTab === 'public' && (
                <div>
                  {/* Simulated public card */}
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    How this tool appears on /tools page
                  </p>
                  <div className="max-w-sm bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center overflow-hidden">
                        {tool.logoUrl ? (
                          <img src={tool.logoUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Wrench className="h-6 w-6 text-indigo-600" />
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        {tool.featured && (
                          <span className="bg-yellow-50 text-yellow-700 text-xs font-semibold px-2 py-0.5 rounded-full">★ Featured</span>
                        )}
                        <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                          {tool.pricingType}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-2">{tool.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-5">
                      {tool.shortDescription || <span className="text-gray-400 italic">No description</span>}
                    </p>
                    <button className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600">
                      {tool.ctaText || 'Launch Tool'} <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Full page preview for custom HTML */}
                  {tool.toolType === 'CUSTOM_HTML_TOOL' && tool.customHtml && (
                    <div className="mt-6">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Live Tool Preview (sandboxed)
                      </p>
                      <div className="rounded-xl border border-gray-700 overflow-hidden">
                        <div className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 border-b border-gray-700">
                          <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
                          <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
                          <span className="ml-2 text-xs text-gray-500">yantrixlab.com/tools/{tool.slug}</span>
                        </div>
                        <iframe
                          sandbox="allow-scripts"
                          className="w-full h-[500px] bg-white"
                          srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>${tool.customCss || ''}</style></head><body>${tool.customHtml}<script>${tool.customJs || ''}<\/script></body></html>`}
                          title="Tool Preview"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'html' && (
                <pre className="text-xs text-green-400 font-mono overflow-auto max-h-[500px] whitespace-pre-wrap bg-gray-800 p-4 rounded-xl">
                  {tool.customHtml || '(empty)'}
                </pre>
              )}
              {activeTab === 'css' && (
                <pre className="text-xs text-blue-400 font-mono overflow-auto max-h-[500px] whitespace-pre-wrap bg-gray-800 p-4 rounded-xl">
                  {tool.customCss || '(empty)'}
                </pre>
              )}
              {activeTab === 'js' && (
                <pre className="text-xs text-yellow-400 font-mono overflow-auto max-h-[500px] whitespace-pre-wrap bg-gray-800 p-4 rounded-xl">
                  {tool.customJs || '(empty)'}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
