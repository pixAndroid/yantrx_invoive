'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface Props {
  postId: string;
  initialClaps: number;
}

export default function ClapButton({ postId, initialClaps }: Props) {
  const [totalClaps, setTotalClaps] = useState(initialClaps);
  const [sessionClaps, setSessionClaps] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    let id = localStorage.getItem('blog_session_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('blog_session_id', id);
    }
    setSessionId(id);
  }, []);

  const handleClap = async () => {
    if (sessionClaps >= 50) return;
    setAnimating(true);
    setSessionClaps(prev => prev + 1);
    setTotalClaps(prev => prev + 1);
    setTimeout(() => setAnimating(false), 600);

    try {
      await fetch(`${API_URL}/blog/public/posts/${postId}/clap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, count: 1 }),
      });
    } catch {
      // ignore
    }
  };

  const remaining = 50 - sessionClaps;

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClap}
        disabled={sessionClaps >= 50}
        className={`relative h-14 w-14 rounded-full border-2 transition-all duration-200 flex items-center justify-center text-2xl
          ${sessionClaps > 0
            ? 'border-indigo-500 bg-indigo-50 scale-105'
            : 'border-gray-300 bg-white hover:border-indigo-400 hover:bg-indigo-50'
          }
          ${animating ? 'scale-125' : 'scale-100'}
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        aria-label="Clap"
      >
        👏
        {animating && (
          <span className="absolute -top-8 text-indigo-600 font-bold text-sm animate-bounce">
            +1
          </span>
        )}
      </button>
      <span className="text-gray-600 font-semibold text-sm">{totalClaps.toLocaleString()}</span>
      {sessionClaps > 0 && remaining > 0 && (
        <span className="text-xs text-gray-400">{remaining} left</span>
      )}
    </div>
  );
}
