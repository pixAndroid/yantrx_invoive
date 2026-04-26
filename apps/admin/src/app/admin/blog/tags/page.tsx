'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { adminFetch } from '@/lib/api';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  _count: { posts: number };
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', color: '#6366f1' });
  const [saving, setSaving] = useState(false);

  const fetch_ = async () => {
    setLoading(true);
    try {
      const res = await adminFetch<{ success: boolean; data: Tag[] }>('/blog/tags');
      setTags(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch_(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', slug: '', color: '#6366f1' });
    setModalOpen(true);
  };

  const openEdit = (tag: Tag) => {
    setEditing(tag);
    setForm({ name: tag.name, slug: tag.slug, color: tag.color || '#6366f1' });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this tag?')) return;
    await adminFetch(`/blog/tags/${id}`, { method: 'DELETE' });
    fetch_();
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await adminFetch(`/blog/tags/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await adminFetch('/blog/tags', { method: 'POST', body: JSON.stringify(form) });
      }
      setModalOpen(false);
      fetch_();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 bg-gray-950 min-h-screen space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Tags</h1>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Add Tag
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500 text-center py-12">Loading...</div>
      ) : tags.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No tags yet.</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map(tag => (
            <div
              key={tag.id}
              className="flex items-center gap-2 px-3 py-2 rounded-full border bg-gray-900"
              style={{ borderColor: tag.color || '#6366f1' }}
            >
              <div
                className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                style={{ background: tag.color || '#6366f1' }}
              />
              <span className="text-white text-sm font-medium">{tag.name}</span>
              <span
                className="text-xs px-1.5 py-0.5 rounded-full"
                style={{ background: `${tag.color || '#6366f1'}30`, color: tag.color || '#a5b4fc' }}
              >
                {tag._count.posts}
              </span>
              <div className="flex items-center gap-1 ml-1">
                <button onClick={() => openEdit(tag)} className="p-0.5 text-gray-500 hover:text-white transition-colors">
                  <Edit2 className="h-3 w-3" />
                </button>
                <button onClick={() => handleDelete(tag.id)} className="p-0.5 text-gray-500 hover:text-red-400 transition-colors">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold">{editing ? 'Edit Tag' : 'Add Tag'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value, slug: prev.slug || slugify(e.target.value) }))}
                  className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Slug *</label>
                <input
                  required
                  value={form.slug}
                  onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.color}
                    onChange={e => setForm(prev => ({ ...prev, color: e.target.value }))}
                    className="h-9 w-14 rounded cursor-pointer bg-transparent border border-gray-700"
                  />
                  <span className="text-gray-400 text-sm">{form.color}</span>
                </div>
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
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
