'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { adminFetch } from '@/lib/api';
import ToolForm from '../../ToolForm';

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
}

export default function EditToolPage() {
  const params = useParams<{ id: string }>();
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminFetch<{ data: Tool }>(`/admin/tools/${params.id}`)
      .then(res => setTool(res.data))
      .catch(e => setError(e.message || 'Failed to load tool'))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
      </div>
    );
  }

  if (error || !tool) {
    return (
      <div className="flex items-center gap-3 p-8 text-red-400">
        <AlertCircle className="h-5 w-5" />
        {error || 'Tool not found'}
      </div>
    );
  }

  const initialData = {
    title: tool.title,
    slug: tool.slug,
    shortDescription: tool.shortDescription || '',
    fullDescription: tool.fullDescription || '',
    logoUrl: tool.logoUrl || '',
    bannerUrl: tool.bannerUrl || '',
    category: tool.category || '',
    tags: (tool.tags || []).join(', '),
    status: tool.status,
    visibility: tool.visibility,
    featured: tool.featured,
    toolType: tool.toolType,
    internalRoute: tool.internalRoute || '',
    externalUrl: tool.externalUrl || '',
    customHtml: tool.customHtml || '',
    customCss: tool.customCss || '',
    customJs: tool.customJs || '',
    ctaText: tool.ctaText || '',
    ctaUrl: tool.ctaUrl || '',
    pricingType: tool.pricingType,
    seoTitle: tool.seoTitle || '',
    seoDescription: tool.seoDescription || '',
    sortOrder: String(tool.sortOrder),
    screenshots: (tool.screenshots || []).join('\n'),
  };

  return <ToolForm mode="edit" toolId={tool.id} initialData={initialData} />;
}
