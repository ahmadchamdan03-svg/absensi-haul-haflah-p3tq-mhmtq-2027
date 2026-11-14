'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { JudgementCounts } from '../_hooks/useGameEngine';
import { PALETTE } from '../_lib/palette';

interface SummaryScreenProps {
  score: number;
  height: number;
  longestCombo: number;
  judgementCounts: JudgementCounts;
  onPlayAgain: () => void;
}

export default function SummaryScreen({
  score,
  height,
  longestCombo,
  judgementCounts,
  onPlayAgain,
}: SummaryScreenProps) {
  const router = useRouter();

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto touch-none select-none"
      style={{
        background: PALETTE.sky[0],
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-cover bg-center bg-no-repeat opacity-35 mix-blend-luminosity"
        style={{
          backgroundImage: "url('/images/panggung-aula.jpg')",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(7, 20, 43, 0.65) 0%, rgba(15, 44, 89, 0.45) 55%, rgba(7, 20, 43, 0.80) 100%)',
        }}
      />

      <div
        className="absolute left-3 sm:left-6 top-0 z-20"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <button
          type="button"
          aria-label="Keluar ke Lobby Hiburan"
          title="Keluar ke Lobby Hiburan"
          onClick={() => router.push('/admin/hiburan')}
          className="flex items-center justify-center min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-sm font-black transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C56B] cursor-pointer shadow-md"
        >
          X
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-5 sm:p-7 text-white shadow-2xl"
      >
        <div className="text-center">
          <p
            className="text-xs font-bold tracking-wider uppercase"
            style={{ color: PALETTE.accentJayyid }}
          >
            Laporan Pembangunan Menara
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-serif font-black tracking-tight text-white">
            Pembangunan Selesai
          </h1>
        </div>

        <div className="mt-4 rounded-xl bg-white/10 border border-white/20 p-4 text-center">
          <span
            className="text-xs font-bold tracking-wide"
            style={{ color: PALETTE.accentJayyid }}
          >
            Skor Akhir
          </span>
          <div className="mt-0.5 text-4xl sm:text-5xl font-black tabular-nums tracking-tight text-white">
            {score.toLocaleString('id-ID')}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/10 border border-white/20 p-3 text-center">
            <span
              className="text-xs font-semibold"
              style={{ color: PALETTE.accentJayyid }}
            >
              Tinggi Menara
            </span>
            <p className="mt-0.5 text-xl sm:text-2xl font-extrabold tabular-nums text-white">
              {height} Lantai
            </p>
          </div>

          <div className="rounded-xl bg-white/10 border border-white/20 p-3 text-center">
            <span
              className="text-xs font-semibold"
              style={{ color: PALETTE.accentJayyid }}
            >
              Kombo Terpanjang
            </span>
            <p className="mt-0.5 text-xl sm:text-2xl font-extrabold tabular-nums text-white">
              {longestCombo}x
            </p>
          </div>
        </div>

        <div className="mt-4">
          <h2
            className="text-xs font-bold tracking-wide mb-2"
            style={{ color: PALETTE.accentJayyid }}
          >
            Rincian Ketepatan Blok
          </h2>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl bg-white/10 border border-white/20 p-2.5 text-center">
              <span
                className="block text-xs font-bold"
                style={{ color: PALETTE.accentJayyid }}
              >
                Jayyid
              </span>
              <span className="mt-0.5 block text-xl font-black tabular-nums text-white">
                {judgementCounts.jayyid}
              </span>
            </div>

            <div className="rounded-xl bg-white/10 border border-white/20 p-2.5 text-center">
              <span className="block text-xs font-bold text-white">
                Mutawasith
              </span>
              <span className="mt-0.5 block text-xl font-black tabular-nums text-white">
                {judgementCounts.mutawasith}
              </span>
            </div>

            <div className="rounded-xl bg-white/10 border border-white/20 p-2.5 text-center">
              <span
                className="block text-xs font-bold"
                style={{ color: PALETTE.accentRodi }}
              >
                {"Rodi'"}
              </span>
              <span className="mt-0.5 block text-xl font-black tabular-nums text-white">
                {judgementCounts.rodi}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onPlayAgain}
            className="flex-1 min-h-[48px] px-5 py-3 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] border border-white/25 text-white text-sm sm:text-base font-extrabold tracking-wide transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C56B] cursor-pointer shadow-md"
          >
            Main Lagi
          </button>

          <button
            type="button"
            onClick={() => router.push('/admin/hiburan')}
            className="flex-1 min-h-[48px] px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white text-sm sm:text-base font-extrabold tracking-wide transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C56B] cursor-pointer shadow-sm"
          >
            Kembali ke Lobby
          </button>
        </div>
      </motion.div>
    </div>
  );
}
