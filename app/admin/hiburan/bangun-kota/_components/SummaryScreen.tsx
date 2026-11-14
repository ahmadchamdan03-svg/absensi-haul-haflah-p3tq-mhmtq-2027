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
        background: PALETTE.sky[2],
      }}
    >
      <div
        className="absolute left-3 sm:left-6 top-0 z-20"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <button
          type="button"
          aria-label="Keluar ke Lobby Hiburan"
          title="Keluar ke Lobby Hiburan"
          onClick={() => router.push('/admin/hiburan')}
          className="flex items-center justify-center min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl text-sm font-black transition-transform duration-150 hover:scale-[1.02] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer shadow-md"
          style={{
            backgroundColor: PALETTE.ui.surfaceHud,
            color: PALETTE.ui.textOnDark,
            border: `1.5px solid ${PALETTE.ui.borderStrong}`,
            outlineColor: PALETTE.ui.surfacePrimary,
          }}
        >
          X
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-md rounded-2xl p-5 sm:p-7 shadow-xl"
        style={{
          backgroundColor: PALETTE.ui.surfacePrimary,
          border: `2px solid ${PALETTE.ui.borderStrong}`,
          color: PALETTE.ui.textPrimary,
        }}
      >
        <div className="text-center">
          <p
            className="text-xs font-bold tracking-wider uppercase"
            style={{ color: PALETTE.ui.textSecondary }}
          >
            Laporan Pembangunan Menara
          </p>
          <h1
            className="mt-1 text-2xl sm:text-3xl font-black tracking-tight"
            style={{ color: PALETTE.ui.textPrimary }}
          >
            Pembangunan Selesai
          </h1>
        </div>

        <div
          className="mt-4 rounded-xl p-4 text-center"
          style={{
            backgroundColor: PALETTE.ui.surfaceSecondary,
            border: `1.5px solid ${PALETTE.ui.borderStrong}`,
          }}
        >
          <span
            className="text-xs font-bold tracking-wide"
            style={{ color: PALETTE.ui.textSecondary }}
          >
            Skor Akhir
          </span>
          <div
            className="mt-0.5 text-4xl sm:text-5xl font-black tabular-nums tracking-tight"
            style={{ color: PALETTE.ui.textPrimary }}
          >
            {score.toLocaleString('id-ID')}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div
            className="rounded-xl p-3 text-center"
            style={{
              backgroundColor: PALETTE.ui.surfaceSecondary,
              border: `1.5px solid ${PALETTE.ui.borderStrong}`,
            }}
          >
            <span
              className="text-xs font-semibold"
              style={{ color: PALETTE.ui.textSecondary }}
            >
              Tinggi Menara
            </span>
            <p
              className="mt-0.5 text-xl sm:text-2xl font-extrabold tabular-nums"
              style={{ color: PALETTE.ui.textPrimary }}
            >
              {height} Lantai
            </p>
          </div>

          <div
            className="rounded-xl p-3 text-center"
            style={{
              backgroundColor: PALETTE.ui.surfaceSecondary,
              border: `1.5px solid ${PALETTE.ui.borderStrong}`,
            }}
          >
            <span
              className="text-xs font-semibold"
              style={{ color: PALETTE.ui.textSecondary }}
            >
              Kombo Terpanjang
            </span>
            <p
              className="mt-0.5 text-xl sm:text-2xl font-extrabold tabular-nums"
              style={{ color: PALETTE.ui.textPrimary }}
            >
              {longestCombo}x
            </p>
          </div>
        </div>

        <div className="mt-4">
          <h2
            className="text-xs font-bold tracking-wide mb-2"
            style={{ color: PALETTE.ui.textSecondary }}
          >
            Rincian Ketepatan Blok
          </h2>

          <div className="grid grid-cols-3 gap-2.5">
            <div
              className="rounded-xl p-2.5 text-center"
              style={{
                backgroundColor: PALETTE.ui.jayyidBgOnLight,
                border: `1.5px solid ${PALETTE.ui.jayyidTextOnLight}`,
                color: PALETTE.ui.jayyidTextOnLight,
              }}
            >
              <span className="block text-xs font-bold">Jayyid</span>
              <span className="mt-0.5 block text-xl font-black tabular-nums">
                {judgementCounts.jayyid}
              </span>
            </div>

            <div
              className="rounded-xl p-2.5 text-center"
              style={{
                backgroundColor: PALETTE.ui.mutawasithBgOnLight,
                border: `1.5px solid ${PALETTE.ui.mutawasithTextOnLight}`,
                color: PALETTE.ui.mutawasithTextOnLight,
              }}
            >
              <span className="block text-xs font-bold">Mutawasith</span>
              <span className="mt-0.5 block text-xl font-black tabular-nums">
                {judgementCounts.mutawasith}
              </span>
            </div>

            <div
              className="rounded-xl p-2.5 text-center"
              style={{
                backgroundColor: PALETTE.ui.rodiBgOnLight,
                border: `1.5px solid ${PALETTE.ui.rodiTextOnLight}`,
                color: PALETTE.ui.rodiTextOnLight,
              }}
            >
              <span className="block text-xs font-bold">{"Rodi'"}</span>
              <span className="mt-0.5 block text-xl font-black tabular-nums">
                {judgementCounts.rodi}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onPlayAgain}
            className="flex-1 min-h-[48px] px-5 py-3 rounded-xl text-sm sm:text-base font-extrabold tracking-wide transition-transform duration-150 hover:scale-[1.01] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer shadow-md"
            style={{
              backgroundColor: PALETTE.ui.ctaPrimaryBg,
              color: PALETTE.ui.ctaPrimaryText,
              border: `2px solid ${PALETTE.ui.textPrimary}`,
              outlineColor: PALETTE.ui.textPrimary,
            }}
          >
            Main Lagi
          </button>

          <button
            type="button"
            onClick={() => router.push('/admin/hiburan')}
            className="flex-1 min-h-[48px] px-5 py-3 rounded-xl text-sm sm:text-base font-extrabold tracking-wide transition-transform duration-150 hover:scale-[1.01] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer shadow-sm"
            style={{
              backgroundColor: PALETTE.ui.neutralBtnBg,
              color: PALETTE.ui.neutralBtnText,
              border: `2px solid ${PALETTE.ui.borderStrong}`,
              outlineColor: PALETTE.ui.textPrimary,
            }}
          >
            Kembali ke Lobby
          </button>
        </div>
      </motion.div>
    </div>
  );
}
