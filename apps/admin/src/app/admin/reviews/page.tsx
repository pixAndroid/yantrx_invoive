'use client';

import { useState, useEffect } from 'react';
import { Star, CheckCircle, XCircle, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react';
import { adminFetch, API_URL, getAdminToken } from '@/lib/api';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string;
  isApproved: boolean;
  adminReply: string | null;
  repliedAt: string | null;
  createdAt: string;
  user: { name: string; email: string | null; avatar: string | null };
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminFetch<{ data: Review[] }>('/admin/reviews');
      setReviews(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const approveReview = async (id: string, reply?: string) => {
    setActionLoading(id);
    try {
      const token = getAdminToken();
      const res = await fetch(`${API_URL}/admin/reviews/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reply }),
      });
      const data = await res.json();
      if (data.success) {
        setReviews(prev => prev.map(r => r.id === id ? { ...r, isApproved: true, adminReply: reply || r.adminReply } : r));
        setReplyingId(null);
        setReplyText('');
      }
    } catch {}
    setActionLoading(null);
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}`} />
      ))}
    </div>
  );

  const pending = reviews.filter(r => !r.isApproved);
  const approved = reviews.filter(r => r.isApproved);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Reviews</h1>
          <p className="text-gray-400 mt-1">{pending.length} pending · {approved.length} approved</p>
        </div>
        <button onClick={fetchReviews} className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-gray-900 border border-gray-800 animate-pulse" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12">
          <Star className="h-12 w-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pending section */}
          {pending.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">Pending Approval ({pending.length})</h2>
              {pending.map(review => (
                <div key={review.id} className="rounded-2xl border border-amber-800/40 bg-gray-900 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs font-bold">
                        {review.user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{review.user.name}</p>
                        <p className="text-xs text-gray-500">{review.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating)}
                      <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>

                  {review.title && <p className="text-sm font-semibold text-white mb-1">{review.title}</p>}
                  <p className="text-sm text-gray-300 mb-4">{review.content}</p>

                  {replyingId === review.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Write admin reply..."
                        rows={2}
                        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-orange-500 focus:outline-none resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveReview(review.id, replyText || undefined)}
                          disabled={actionLoading === review.id}
                          className="rounded-lg bg-green-700 px-3 py-1.5 text-sm text-white hover:bg-green-600 disabled:opacity-50"
                        >
                          Approve & Reply
                        </button>
                        <button onClick={() => { setReplyingId(null); setReplyText(''); }} className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-400">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveReview(review.id)}
                        disabled={actionLoading === review.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-green-700 px-3 py-1.5 text-sm text-white hover:bg-green-600 disabled:opacity-50"
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => setReplyingId(review.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800"
                      >
                        <MessageSquare className="h-3.5 w-3.5" /> Reply & Approve
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Approved section */}
          {approved.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-green-400 uppercase tracking-wider mt-6">Approved ({approved.length})</h2>
              {approved.map(review => (
                <div key={review.id} className="rounded-2xl border border-gray-800 bg-gray-900 p-5 opacity-80">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center text-white text-xs font-bold">
                        {review.user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-300">{review.user.name}</p>
                        <p className="text-xs text-gray-600">{review.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating)}
                      <span className="text-xs bg-green-900/30 text-green-400 border border-green-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> approved
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">{review.content}</p>
                  {review.adminReply && (
                    <div className="mt-3 pl-3 border-l-2 border-orange-800">
                      <p className="text-xs text-orange-400 font-medium mb-1">Admin Reply</p>
                      <p className="text-xs text-gray-400">{review.adminReply}</p>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
