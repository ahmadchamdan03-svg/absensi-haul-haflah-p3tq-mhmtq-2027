'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const SnakeGame = dynamic(() => import('@/components/games/SnakeGame'), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[9999] w-full h-[100dvh] bg-[#07142B] flex items-center justify-center p-4"
    >
      <div className="w-full max-w-sm rounded-3xl bg-white/95 border-2 border-[#D49B5B] p-8 text-center shadow-2xl space-y-3">
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
          Menyiapkan papan permainan layar penuh dan audio interaktif.
        </p>
      </div>
    </div>
  ),
});

export default function SnakeP3TQPage() {
  return <SnakeGame />;
}
