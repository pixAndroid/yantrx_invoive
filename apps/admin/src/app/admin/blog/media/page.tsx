'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminFetch } from '@/lib/api';
import { Plus, Search, Copy, Trash2, X, FileImage, Check } from 'lucide-react';

interface Media {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  alt: string | null;
  caption: string | null;
  folder: string | null;
  width: number | null;
  height: number | null;
  createdAt: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const EMPTY_FORM = {
  url: '',
  originalName: '',
  filename: '',
  mimeType: 'image/jpeg',
  size: 0,
  alt: '',
  caption: '',
  folder: '',
};

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [folder, setFolder] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (folder) params.set('folder', folder);
      const res = await adminFetch<{ success: boolean; data: Media[] }>(`/blog/media?${params}`);
      setMedia(res.data);
    } finally {
      setLoading(false);
    }
  }, [search, folder]);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this media item?')) return;
    await adminFetch(`/blog/media/${id}`, { method: 'DELETE' });
    fetchMedia();
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(url);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        filename: form.filename || form.originalName,
        size: Number(form.size) || 0,
      };
      await adminFetch('/blog/media', { method: 'POST', body: JSON.stringify(payload) });
      setModalOpen(false);
      setForm({ ...EMPTY_FORM });
      fetchMedia();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');
  const folders = [...new Set(media.map(m => m.folder).filter(Boolean))] as string[];

  return (
    <div className="p-8 bg-gray-950 min-h-screen space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Media Library</h1>
          <p className="text-gray-400 text-sm mt-1">{media.length} items</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Add Media URL
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-gray-900 p-4 rounded-xl border border-gray-800">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="w-full bg-gray-800 text-white pl-9 pr-4 py-2 rounded-lg text-sm border border-gray-700 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={folder}
          onChange={e => setFolder(e.target.value)}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm border border-gray-700 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Folders</option>
          {folders.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-900 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : media.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No media items found.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {media.map(item => (
            <div key={item.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden group">
              <div className="relative h-32 bg-gray-800">
                {isImage(item.mimeType) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt={item.alt || item.originalName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <FileImage className="h-8 w-8 text-gray-600" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleCopy(item.url)}
                    className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white backdrop-blur-sm"
                    title="Copy URL"
                  >
                    {copied === item.url ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-red-300 backdrop-blur-sm"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="p-2">
                <p className="text-white text-xs truncate font-medium">{item.originalName}</p>
                <p className="text-gray-500 text-xs">{formatSize(item.size)}</p>
                {item.folder && <p className="text-gray-600 text-xs">{item.folder}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Media Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold">Add Media URL</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">URL *</label>
                <input
                  required
                  value={form.url}
                  onChange={e => setForm(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500"
                />
              </div>
              {form.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.url} alt="" className="w-full h-32 object-cover rounded-lg" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              )}
              <div>
                <label className="text-xs text-gray-400 block mb-1">Original Name *</label>
                <input
                  required
                  value={form.originalName}
                  onChange={e => setForm(prev => ({ ...prev, originalName: e.target.value }))}
                  placeholder="image.jpg"
                  className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">MIME Type</label>
                  <select
                    value={form.mimeType}
                    onChange={e => setForm(prev => ({ ...prev, mimeType: e.target.value }))}
                    className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="image/jpeg">image/jpeg</option>
                    <option value="image/png">image/png</option>
                    <option value="image/webp">image/webp</option>
                    <option value="image/gif">image/gif</option>
                    <option value="image/svg+xml">image/svg+xml</option>
                    <option value="application/pdf">application/pdf</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Size (bytes)</label>
                  <input
                    type="number"
                    value={form.size}
                    onChange={e => setForm(prev => ({ ...prev, size: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Alt Text</label>
                <input
                  value={form.alt}
                  onChange={e => setForm(prev => ({ ...prev, alt: e.target.value }))}
                  className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Caption</label>
                <input
                  value={form.caption}
                  onChange={e => setForm(prev => ({ ...prev, caption: e.target.value }))}
                  className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Folder</label>
                <input
                  value={form.folder}
                  onChange={e => setForm(prev => ({ ...prev, folder: e.target.value }))}
                  placeholder="blog, covers, thumbnails..."
                  className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-300 text-sm hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Add Media'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
