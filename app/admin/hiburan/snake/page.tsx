'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const SnakeGame = dynamic(() => import('@/components/games/SnakeGame'), {
  ssr: false,
  loading: () => (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 min-h-[calc(100vh-96px)] flex items-center justify-center">
      <div
        role="status"
        aria-live="polite"
        className="w-full max-w-md rounded-3xl bg-white/95 border border-[#D49B5B]/45 p-8 text-center shadow-sm space-y-3"
      >
        <div className="mx-auto w-12 h-12 rounded-2xl bg-[#0F2C59] border-2 border-[#D49B5B] flex items-center justify-center">
          <span
            className="w-5 h-5 rounded-full border-2 border-[#F5C56B] border-t-transparent animate-spin"
            aria-hidden="true"
          />
        </div>
        <p className="text-base font-serif font-bold text-[#0F2C59]">
          Memuat Arena Snake P3TQ...
        </p>
        <p className="text-xs text-slate-700">
          Menyiapkan papan permainan dan audio interaktif.
        </p>
      </div>
    </div>
  ),
});

export default function SnakeP3TQPage() {
  return <SnakeGame />;
}
