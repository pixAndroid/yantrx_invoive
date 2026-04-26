'use client';

import { useEffect, useRef, useState, useCallback, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch } from '@/lib/api';
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Link2, Image, Code, Quote, ChevronDown, ChevronUp,
  Save, Eye, EyeOff, Check, Loader2, Type,
} from 'lucide-react';

interface Category { id: string; name: string; slug: string; color: string | null }
interface Tag { id: string; name: string; slug: string; color: string | null }

interface ArticleData {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  contentHtml: string;
  coverImage: string;
  status: string;
  categoryId: string;
  tagIds: string[];
  authorName: string;
  authorBio: string;
  publishedAt: string;
  scheduledAt: string;
  // SEO
  seoTitle: string;
  seoDescription: string;
  focusKeyword: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  schemaType: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  isFeatured: boolean;
  seoScore: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function calcReadTime(words: number): number {
  return Math.max(1, Math.ceil(words / 200));
}

function calcSeoScore(data: ArticleData): number {
  let score = 0;
  if (data.title.length >= 30 && data.title.length <= 60) score += 20;
  else if (data.title.length > 0) score += 10;
  if (data.seoDescription.length >= 120 && data.seoDescription.length <= 160) score += 20;
  else if (data.seoDescription.length > 0) score += 10;
  if (data.focusKeyword) {
    score += 15;
    if (data.title.toLowerCase().includes(data.focusKeyword.toLowerCase())) score += 10;
    if (data.contentHtml.toLowerCase().includes(data.focusKeyword.toLowerCase())) score += 10;
  }
  const wordCount = countWords(data.contentHtml.replace(/<[^>]+>/g, ''));
  if (wordCount >= 300) score += 15;
  if (data.coverImage) score += 10;
  return Math.min(score, 100);
}

interface Props {
  postId?: string;
}

export default function ArticleEditor({ postId }: Props) {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);
  const [htmlMode, setHtmlMode] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [seoOpen, setSeoOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedIdRef = useRef<string | undefined>(postId);

  const [data, setData] = useState<ArticleData>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    contentHtml: '',
    coverImage: '',
    status: 'DRAFT',
    categoryId: '',
    tagIds: [],
    authorName: 'Yantrix Labs',
    authorBio: '',
    publishedAt: '',
    scheduledAt: '',
    isFeatured: false,
    seoTitle: '',
    seoDescription: '',
    focusKeyword: '',
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    schemaType: 'ARTICLE',
    robotsIndex: true,
    robotsFollow: true,
    seoScore: 0,
  });

  // Load existing post
  useEffect(() => {
    if (!postId) return;
    adminFetch<{ success: boolean; data: ArticleData & { tags: Array<{ tagId: string }> } }>(`/blog/${postId}`)
      .then(res => {
        const post = res.data;
        const loaded: ArticleData = {
          id: post.id,
          title: post.title || '',
          slug: post.slug || '',
          excerpt: post.excerpt || '',
          content: post.content || '',
          contentHtml: post.contentHtml || post.content || '',
          coverImage: post.coverImage || '',
          status: post.status || 'DRAFT',
          categoryId: post.categoryId || '',
          tagIds: post.tags?.map((t: { tagId: string }) => t.tagId) ?? [],
          authorName: post.authorName || 'Yantrix Labs',
          authorBio: post.authorBio || '',
          publishedAt: post.publishedAt ? String(post.publishedAt).slice(0, 16) : '',
          scheduledAt: post.scheduledAt ? String(post.scheduledAt).slice(0, 16) : '',
          seoTitle: post.seoTitle || '',
          seoDescription: post.seoDescription || '',
          focusKeyword: post.focusKeyword || '',
          canonicalUrl: post.canonicalUrl || '',
          ogTitle: post.ogTitle || '',
          ogDescription: post.ogDescription || '',
          ogImage: post.ogImage || '',
          schemaType: post.schemaType || 'ARTICLE',
          robotsIndex: post.robotsIndex ?? true,
          robotsFollow: post.robotsFollow ?? true,
          isFeatured: post.isFeatured ?? false,
          seoScore: post.seoScore || 0,
        };
        setData(loaded);
        if (editorRef.current) {
          editorRef.current.innerHTML = loaded.contentHtml;
        }
      })
      .catch(() => {});
  }, [postId]);

  useEffect(() => {
    adminFetch<{ success: boolean; data: Category[] }>('/blog/categories').then(r => setCategories(r.data)).catch(() => {});
    adminFetch<{ success: boolean; data: Tag[] }>('/blog/tags').then(r => setTags(r.data)).catch(() => {});
  }, []);

  const update = useCallback((field: keyof ArticleData, value: unknown) => {
    setData(prev => {
      const next = { ...prev, [field]: value };
      next.seoScore = calcSeoScore(next);
      return next;
    });
  }, []);

  const handleTitleChange = (value: string) => {
    setData(prev => {
      const next = { ...prev, title: value };
      if (!prev.id) next.slug = slugify(value);
      next.seoScore = calcSeoScore(next);
      return next;
    });
  };

  const handleEditorInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    setData(prev => {
      const next = { ...prev, contentHtml: html, content: editorRef.current?.innerText || '' };
      next.seoScore = calcSeoScore(next);
      return next;
    });
    scheduleAutoSave();
  };

  const handleHtmlChange = (html: string) => {
    setData(prev => {
      const next = { ...prev, contentHtml: html, content: html.replace(/<[^>]+>/g, '') };
      next.seoScore = calcSeoScore(next);
      return next;
    });
    scheduleAutoSave();
  };

  const scheduleAutoSave = () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setAutoSaveStatus('idle');
    autoSaveTimer.current = setTimeout(() => {
      doAutoSave();
    }, 2000);
  };

  const doAutoSave = useCallback(async () => {
    setAutoSaveStatus('saving');
    const current = await new Promise<ArticleData>(resolve => {
      setData(d => { resolve(d); return d; });
    });
    try {
      await savePost(current, true);
    } catch {
      setAutoSaveStatus('idle');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const savePost = async (current: ArticleData, isAuto = false) => {
    const wordCount = countWords(current.contentHtml.replace(/<[^>]+>/g, ''));
    const readTime = calcReadTime(wordCount);
    const payload = {
      ...current,
      wordCount,
      readTime,
      publishedAt: current.publishedAt || null,
      scheduledAt: current.scheduledAt || null,
      categoryId: current.categoryId || null,
    };

    let savedId = savedIdRef.current;
    if (savedId) {
      await adminFetch(`/blog/${savedId}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      const res = await adminFetch<{ success: boolean; data: { id: string } }>('/blog', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      savedId = res.data.id;
      savedIdRef.current = savedId;
    }

    if (isAuto) {
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    }
    return savedId;
  };

  const handleSave = async (e?: FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    try {
      await savePost(data);
      router.push('/admin/blog/articles');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleEditorInput();
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) exec('createLink', url);
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) exec('insertImage', url);
  };

  const insertCodeBlock = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
      const range = sel.getRangeAt(0);
      const code = document.createElement('pre');
      code.innerHTML = `<code>${range.toString() || 'code here'}</code>`;
      range.deleteContents();
      range.insertNode(code);
      handleEditorInput();
    }
  };

  const insertQuote = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
      const range = sel.getRangeAt(0);
      const bq = document.createElement('blockquote');
      bq.textContent = range.toString() || 'Quote here';
      range.deleteContents();
      range.insertNode(bq);
      handleEditorInput();
    }
  };

  const toolbarBtns = [
    { icon: Bold, action: () => exec('bold'), title: 'Bold' },
    { icon: Italic, action: () => exec('italic'), title: 'Italic' },
    { icon: Underline, action: () => exec('underline'), title: 'Underline' },
    { icon: Strikethrough, action: () => exec('strikeThrough'), title: 'Strikethrough' },
  ];

  const words = countWords(data.contentHtml.replace(/<[^>]+>/g, ''));
  const readTime = calcReadTime(words);

  const seoColor = data.seoScore >= 80 ? 'text-green-400' : data.seoScore >= 50 ? 'text-yellow-400' : 'text-red-400';

  const toggleTag = (tagId: string) => {
    setData(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter(id => id !== tagId)
        : [...prev.tagIds, tagId],
    }));
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col lg:flex-row gap-6 p-6 bg-gray-950 min-h-screen">
      {/* Main Content */}
      <div className="flex-1 space-y-4">
        {/* Auto-save indicator */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">{postId ? 'Edit Article' : 'New Article'}</h1>
          <div className="flex items-center gap-3 text-xs">
            {autoSaveStatus === 'saving' && (
              <span className="text-gray-400 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Auto-saving...
              </span>
            )}
            {autoSaveStatus === 'saved' && (
              <span className="text-green-400 flex items-center gap-1">
                <Check className="h-3 w-3" /> All changes saved
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <input
            value={data.title}
            onChange={e => handleTitleChange(e.target.value)}
            placeholder="Article Title"
            className="w-full bg-gray-900 border border-gray-700 text-white text-2xl font-bold px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 placeholder-gray-600"
            required
          />
        </div>

        {/* Slug */}
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">/blog/</span>
          <input
            value={data.slug}
            onChange={e => update('slug', e.target.value)}
            placeholder="article-slug"
            className="flex-1 bg-gray-900 border border-gray-700 text-gray-300 text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Excerpt */}
        <textarea
          value={data.excerpt}
          onChange={e => update('excerpt', e.target.value)}
          placeholder="Short excerpt / summary..."
          rows={2}
          className="w-full bg-gray-900 border border-gray-700 text-gray-300 text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 resize-none placeholder-gray-600"
        />

        {/* Editor */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
          {/* Editor Toolbar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-gray-800/50 flex-wrap gap-2">
            <div className="flex items-center gap-1 flex-wrap">
              {/* Mode toggle */}
              <button
                type="button"
                onClick={() => setHtmlMode(!htmlMode)}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-300 hover:bg-gray-700 border border-gray-600 mr-2"
                title={htmlMode ? 'Switch to Visual' : 'Switch to HTML'}
              >
                {htmlMode ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                {htmlMode ? 'Visual' : 'HTML'}
              </button>

              {!htmlMode && (
                <>
                  {toolbarBtns.map(btn => (
                    <button
                      key={btn.title}
                      type="button"
                      title={btn.title}
                      onClick={btn.action}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                    >
                      <btn.icon className="h-3.5 w-3.5" />
                    </button>
                  ))}

                  <div className="w-px h-4 bg-gray-600 mx-1" />

                  {/* Headings */}
                  {(['h1', 'h2', 'h3'] as const).map(h => (
                    <button
                      key={h}
                      type="button"
                      title={h.toUpperCase()}
                      onClick={() => exec('formatBlock', `<${h}>`)}
                      className="px-1.5 py-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded text-xs font-bold"
                    >
                      {h.toUpperCase()}
                    </button>
                  ))}
                  <button
                    type="button"
                    title="Paragraph"
                    onClick={() => exec('formatBlock', '<p>')}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                  >
                    <Type className="h-3.5 w-3.5" />
                  </button>

                  <div className="w-px h-4 bg-gray-600 mx-1" />

                  {/* Align */}
                  <button type="button" title="Align Left" onClick={() => exec('justifyLeft')} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
                    <AlignLeft className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" title="Align Center" onClick={() => exec('justifyCenter')} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
                    <AlignCenter className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" title="Align Right" onClick={() => exec('justifyRight')} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
                    <AlignRight className="h-3.5 w-3.5" />
                  </button>

                  <div className="w-px h-4 bg-gray-600 mx-1" />

                  {/* Lists */}
                  <button type="button" title="Unordered List" onClick={() => exec('insertUnorderedList')} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
                    <List className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" title="Ordered List" onClick={() => exec('insertOrderedList')} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
                    <ListOrdered className="h-3.5 w-3.5" />
                  </button>

                  <div className="w-px h-4 bg-gray-600 mx-1" />

                  <button type="button" title="Insert Link" onClick={insertLink} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
                    <Link2 className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" title="Insert Image" onClick={insertImage} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
                    <Image className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" title="Code Block" onClick={insertCodeBlock} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
                    <Code className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" title="Quote" onClick={insertQuote} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
                    <Quote className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Editor Content */}
          {htmlMode ? (
            <textarea
              value={data.contentHtml}
              onChange={e => handleHtmlChange(e.target.value)}
              className="w-full bg-gray-950 text-green-300 font-mono text-sm p-4 focus:outline-none resize-none"
              style={{ minHeight: '500px' }}
              placeholder="<p>Write HTML here...</p>"
            />
          ) : (
            <div
              ref={editorRef}
              contentEditable
              onInput={handleEditorInput}
              suppressContentEditableWarning
              className="min-h-[500px] p-4 text-gray-200 focus:outline-none blog-editor-content"
              style={{ lineHeight: '1.8' }}
              data-placeholder="Start writing your article..."
            />
          )}

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-700 bg-gray-800/30 flex items-center gap-4 text-xs text-gray-500">
            <span>{words.toLocaleString()} words</span>
            <span>{readTime} min read</span>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="lg:w-80 space-y-4">
        {/* Publishing */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-3">
          <h3 className="text-white font-semibold text-sm">Publishing</h3>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Status</label>
            <select
              value={data.status}
              onChange={e => update('status', e.target.value)}
              className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          {data.status === 'PUBLISHED' && (
            <div>
              <label className="text-xs text-gray-400 block mb-1">Publish Date</label>
              <input
                type="datetime-local"
                value={data.publishedAt}
                onChange={e => update('publishedAt', e.target.value)}
                className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}
          {data.status === 'SCHEDULED' && (
            <div>
              <label className="text-xs text-gray-400 block mb-1">Schedule For</label>
              <input
                type="datetime-local"
                value={data.scheduledAt}
                onChange={e => update('scheduledAt', e.target.value)}
                className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              id="featured"
              type="checkbox"
              checked={data.isFeatured}
              onChange={e => update('isFeatured', e.target.checked)}
              className="rounded"
            />
            <label htmlFor="featured" className="text-xs text-gray-400">Featured article</label>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : data.status === 'PUBLISHED' ? 'Publish' : 'Save Draft'}
          </button>
        </div>

        {/* Cover Image */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-3">
          <h3 className="text-white font-semibold text-sm">Cover Image</h3>
          <input
            value={data.coverImage}
            onChange={e => update('coverImage', e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500 placeholder-gray-600"
          />
          {data.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.coverImage} alt="" className="w-full h-32 object-cover rounded-lg" />
          )}
        </div>

        {/* Category & Tags */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-3">
          <h3 className="text-white font-semibold text-sm">Category & Tags</h3>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Category</label>
            <select
              value={data.categoryId}
              onChange={e => update('categoryId', e.target.value)}
              className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="">No Category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-2">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                    data.tagIds.includes(tag.id)
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
              {tags.length === 0 && <p className="text-gray-600 text-xs">No tags yet.</p>}
            </div>
          </div>
        </div>

        {/* Author */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-3">
          <h3 className="text-white font-semibold text-sm">Author</h3>
          <input
            value={data.authorName}
            onChange={e => update('authorName', e.target.value)}
            placeholder="Author name"
            className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500"
          />
          <textarea
            value={data.authorBio}
            onChange={e => update('authorBio', e.target.value)}
            placeholder="Author bio..."
            rows={2}
            className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        {/* SEO Panel */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setSeoOpen(!seoOpen)}
            className="w-full flex items-center justify-between p-4 text-white"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">SEO</span>
              <span className={`text-xs font-bold ${seoColor}`}>{data.seoScore}/100</span>
            </div>
            {seoOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
          </button>

          {seoOpen && (
            <div className="px-4 pb-4 space-y-3 border-t border-gray-700">
              {/* SEO Score bar */}
              <div className="pt-3">
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      data.seoScore >= 80 ? 'bg-green-500' : data.seoScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${data.seoScore}%` }}
                  />
                </div>
              </div>

              {[
                { label: 'SEO Title', field: 'seoTitle', placeholder: 'Title for search engines' },
                { label: 'Meta Description', field: 'seoDescription', placeholder: '120-160 chars description' },
                { label: 'Focus Keyword', field: 'focusKeyword', placeholder: 'Main keyword' },
                { label: 'Canonical URL', field: 'canonicalUrl', placeholder: 'https://...' },
                { label: 'OG Title', field: 'ogTitle', placeholder: 'Open Graph title' },
                { label: 'OG Description', field: 'ogDescription', placeholder: 'Open Graph description' },
                { label: 'OG Image URL', field: 'ogImage', placeholder: 'https://...' },
              ].map(({ label, field, placeholder }) => (
                <div key={field}>
                  <label className="text-xs text-gray-400 block mb-1">{label}</label>
                  {field === 'seoDescription' || field === 'ogDescription' ? (
                    <textarea
                      value={data[field as keyof ArticleData] as string}
                      onChange={e => update(field as keyof ArticleData, e.target.value)}
                      placeholder={placeholder}
                      rows={2}
                      className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500 resize-none placeholder-gray-600"
                    />
                  ) : (
                    <input
                      value={data[field as keyof ArticleData] as string}
                      onChange={e => update(field as keyof ArticleData, e.target.value)}
                      placeholder={placeholder}
                      className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500 placeholder-gray-600"
                    />
                  )}
                </div>
              ))}

              <div>
                <label className="text-xs text-gray-400 block mb-1">Schema Type</label>
                <select
                  value={data.schemaType}
                  onChange={e => update('schemaType', e.target.value)}
                  className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500"
                >
                  {['ARTICLE', 'HOWTO', 'FAQ', 'PRODUCT', 'NEWSARTICLE'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.robotsIndex}
                    onChange={e => update('robotsIndex', e.target.checked)}
                    className="rounded"
                  />
                  Index
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.robotsFollow}
                    onChange={e => update('robotsFollow', e.target.checked)}
                    className="rounded"
                  />
                  Follow
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
