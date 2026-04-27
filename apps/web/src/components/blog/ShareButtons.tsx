'use client';

import { useState } from 'react';
import { Twitter, Linkedin, Link2, Check, Facebook } from 'lucide-react';

interface Props {
  url: string;
  title: string;
  compact?: boolean;
}

export function ShareButtons({ url, title, compact = false }: Props) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  const btnBase = compact
    ? 'p-2 rounded-xl transition-all duration-150 hover:scale-110'
    : 'p-2.5 rounded-xl transition-all duration-150 hover:scale-110 shadow-sm';

  return (
    <div className="flex items-center gap-2">
      {!compact && <span className="text-sm text-gray-400 font-medium mr-1">Share</span>}
      <a
        href={twitterUrl}
        target="_blank"
        rel="noreferrer"
        className={`${btnBase} bg-sky-50 text-sky-500 hover:bg-sky-100`}
        aria-label="Share on Twitter / X"
      >
        <Twitter className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      </a>
      <a
        href={linkedinUrl}
        target="_blank"
        rel="noreferrer"
        className={`${btnBase} bg-blue-50 text-blue-600 hover:bg-blue-100`}
        aria-label="Share on LinkedIn"
      >
        <Linkedin className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      </a>
      <a
        href={facebookUrl}
        target="_blank"
        rel="noreferrer"
        className={`${btnBase} bg-indigo-50 text-indigo-600 hover:bg-indigo-100`}
        aria-label="Share on Facebook"
      >
        <Facebook className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      </a>
      <button
        onClick={copyLink}
        className={`${btnBase} bg-gray-100 text-gray-600 hover:bg-gray-200`}
        aria-label={copied ? 'Link copied' : 'Copy link'}
      >
        {copied ? (
          <Check className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-green-500`} />
        ) : (
          <Link2 className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        )}
      </button>
    </div>
  );
}
