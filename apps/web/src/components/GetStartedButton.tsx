'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { isAuthenticated } from '@/lib/api';

export default function GetStartedButton() {
  const router = useRouter();

  const handleClick = useCallback(() => {
    router.push(isAuthenticated() ? '/dashboard' : '/auth/register');
  }, [router]);

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-indigo-600 hover:bg-indigo-50 transition-all shadow-lg"
    >
      Get Started Free
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}
