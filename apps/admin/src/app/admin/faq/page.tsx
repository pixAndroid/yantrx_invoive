'use client';

import { useState, useEffect, useRef } from 'react';
import {
  HelpCircle, Plus, Pencil, Trash2, GripVertical,
  AlertCircle, RefreshCw, X, Check, Eye, EyeOff
} from 'lucide-react';
import { adminFetch, API_URL, getAdminToken } from '@/lib/api';

interface Faq {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
}

interface FaqFormData {
  question: string;
  answer: string;
  isPublished: boolean;
}

const EMPTY_FORM: FaqFormData = { question: '', answer: '', isPublished: true };

export default function AdminFaqPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [formData, setFormData] = useState<FaqFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  // Drag state
  const dragIndex = useRef<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);

  const fetchFaqs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminFetch<{ data: Faq[] }>('/faqs');
      setFaqs(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFaqs(); }, []);

  const openCreate = () => {
    setEditingFaq(null);
    setFormData(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (faq: Faq) => {
    setEditingFaq(faq);
    setFormData({ question: faq.question, answer: faq.answer, isPublished: faq.isPublished });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingFaq(null);
    setFormData(EMPTY_FORM);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question.trim() || !formData.answer.trim()) return;
    setSaving(true);
    try {
      const token = getAdminToken();
      if (editingFaq) {
        const res = await fetch(`${API_URL}/faqs/${editingFaq.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to update');
        setFaqs(prev => prev.map(f => f.id === editingFaq.id ? data.data : f));
      } else {
        const res = await fetch(`${API_URL}/faqs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to create');
        setFaqs(prev => [...prev, data.data]);
      }
      closeForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return;
    setActionLoading(id);
    try {
      const token = getAdminToken();
      await fetch(`${API_URL}/faqs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setFaqs(prev => prev.filter(f => f.id !== id));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const togglePublished = async (faq: Faq) => {
    setActionLoading(faq.id);
    try {
      const token = getAdminToken();
      const res = await fetch(`${API_URL}/faqs/${faq.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isPublished: !faq.isPublished }),
      });
      const data = await res.json();
      if (data.success) {
        setFaqs(prev => prev.map(f => f.id === faq.id ? data.data : f));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update FAQ visibility');
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Drag-and-drop reordering ──────────────────────────────────────────────

  const handleDragStart = (index: number) => {
    dragIndex.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverIndex.current = index;
    if (dragIndex.current === null || dragIndex.current === index) return;
    setFaqs(prev => {
      const updated = [...prev];
      const [dragged] = updated.splice(dragIndex.current!, 1);
      updated.splice(index, 0, dragged);
      dragIndex.current = index;
      return updated;
    });
  };

  const handleDragEnd = async () => {
    dragIndex.current = null;
    dragOverIndex.current = null;
    setReordering(true);
    try {
      const token = getAdminToken();
      await fetch(`${API_URL}/faqs/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids: faqs.map(f => f.id) }),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save FAQ order');
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">FAQs</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {faqs.filter(f => f.isPublished).length} published · {faqs.filter(f => !f.isPublished).length} hidden
            {reordering && <span className="ml-2 text-orange-400">Saving order…</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchFaqs}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 hover:bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors"
          >
            <Plus className="h-4 w-4" /> Add FAQ
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* Create / Edit Form */}
      {showForm && (
        <div className="mb-6 rounded-2xl border border-gray-700 bg-gray-900 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            {editingFaq ? 'Edit FAQ' : 'New FAQ'}
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Question <span className="text-red-400">*</span></label>
              <input
                type="text"
                required
                value={formData.question}
                onChange={e => setFormData(p => ({ ...p, question: e.target.value }))}
                placeholder="e.g. How do I get started?"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Answer <span className="text-red-400">*</span></label>
              <textarea
                required
                rows={4}
                value={formData.answer}
                onChange={e => setFormData(p => ({ ...p, answer: e.target.value }))}
                placeholder="Provide a clear and helpful answer…"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:border-orange-500 focus:outline-none resize-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublished"
                checked={formData.isPublished}
                onChange={e => setFormData(p => ({ ...p, isPublished: e.target.checked }))}
                className="rounded border-gray-600 bg-gray-800 accent-orange-500"
              />
              <label htmlFor="isPublished" className="text-sm text-gray-300">Published (visible on website)</label>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-600 hover:bg-orange-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 transition-colors"
              >
                <Check className="h-4 w-4" /> {saving ? 'Saving…' : editingFaq ? 'Update FAQ' : 'Create FAQ'}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FAQ List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-gray-900 border border-gray-800 animate-pulse" />
          ))}
        </div>
      ) : faqs.length === 0 ? (
        <div className="text-center py-16">
          <HelpCircle className="h-12 w-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No FAQs yet</p>
          <p className="text-gray-600 text-sm mt-1">Click &quot;Add FAQ&quot; to create your first FAQ.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-600 mb-3 flex items-center gap-1.5">
            <GripVertical className="h-3.5 w-3.5" /> Drag rows to reorder
          </p>
          {faqs.map((faq, index) => (
            <div
              key={faq.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragEnd={handleDragEnd}
              onDragOver={e => e.preventDefault()}
              className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-4 flex items-start gap-3 group cursor-grab active:cursor-grabbing hover:border-gray-700 transition-colors"
            >
              {/* Drag handle */}
              <div className="mt-0.5 text-gray-700 group-hover:text-gray-500 transition-colors flex-shrink-0">
                <GripVertical className="h-4 w-4" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white leading-snug">{faq.question}</p>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2 leading-relaxed">{faq.answer}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Published toggle */}
                    <button
                      onClick={() => togglePublished(faq)}
                      disabled={actionLoading === faq.id}
                      title={faq.isPublished ? 'Click to hide' : 'Click to publish'}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                        faq.isPublished
                          ? 'bg-green-900/30 text-green-400 border border-green-800/40 hover:bg-green-900/50'
                          : 'bg-gray-800 text-gray-500 border border-gray-700 hover:bg-gray-700'
                      }`}
                    >
                      {faq.isPublished ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {faq.isPublished ? 'Published' : 'Hidden'}
                    </button>
                    <button
                      onClick={() => openEdit(faq)}
                      className="rounded-lg p-1.5 text-gray-500 hover:text-orange-400 hover:bg-gray-800 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(faq.id)}
                      disabled={actionLoading === faq.id}
                      className="rounded-lg p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
