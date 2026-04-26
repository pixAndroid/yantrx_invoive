'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { adminFetch } from '@/lib/api';
import { Plus, Edit2, Trash2, X, ChevronDown } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  parentId: string | null;
  sortOrder: number;
  parent: { id: string; name: string } | null;
  _count: { posts: number };
}

const EMPTY: Omit<Category, 'id' | 'parent' | '_count'> = {
  name: '',
  slug: '',
  description: '',
  color: '#6366f1',
  parentId: null,
  sortOrder: 0,
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const fetch_ = async () => {
    setLoading(true);
    try {
      const res = await adminFetch<{ success: boolean; data: Category[] }>('/blog/categories');
      setCategories(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch_(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY });
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      color: cat.color || '#6366f1',
      parentId: cat.parentId || null,
      sortOrder: cat.sortOrder,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? Posts will be uncategorized.')) return;
    await adminFetch(`/blog/categories/${id}`, { method: 'DELETE' });
    fetch_();
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await adminFetch(`/blog/categories/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
      } else {
        await adminFetch('/blog/categories', {
          method: 'POST',
          body: JSON.stringify(form),
        });
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
        <h1 className="text-2xl font-bold text-white">Categories</h1>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No categories yet.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Posts</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Color</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Parent</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Order</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {categories.map(cat => (
                <tr key={cat.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-white text-sm font-medium">{cat.name}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{cat.slug}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{cat._count.posts}</td>
                  <td className="px-4 py-3">
                    <div
                      className="h-5 w-5 rounded-full border border-gray-600"
                      style={{ background: cat.color || '#6366f1' }}
                    />
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{cat.parent?.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{cat.sortOrder}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(cat)} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold">{editing ? 'Edit Category' : 'Add Category'}</h2>
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
                <label className="text-xs text-gray-400 block mb-1">Description</label>
                <textarea
                  value={form.description || ''}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs text-gray-400 block mb-1">Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.color || '#6366f1'}
                      onChange={e => setForm(prev => ({ ...prev, color: e.target.value }))}
                      className="h-9 w-12 rounded cursor-pointer bg-transparent border border-gray-700"
                    />
                    <span className="text-gray-400 text-sm">{form.color}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-400 block mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={e => setForm(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Parent Category</label>
                <div className="relative">
                  <select
                    value={form.parentId || ''}
                    onChange={e => setForm(prev => ({ ...prev, parentId: e.target.value || null }))}
                    className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500 appearance-none"
                  >
                    <option value="">No Parent</option>
                    {categories
                      .filter(c => c.id !== editing?.id)
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
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
