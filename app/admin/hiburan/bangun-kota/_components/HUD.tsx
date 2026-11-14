'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PALETTE, WIND_MIN_HEIGHT } from '../_lib/palette';

interface HUDProps {
  score: number;
  combo: number;
  height: number;
  currentWind: number;
  onRequestSurrender: () => void;
}

export default function HUD({
  score,
  combo,
  height,
  currentWind,
  onRequestSurrender,
}: HUDProps) {
  const router = useRouter();
  const isWindActive = height >= WIND_MIN_HEIGHT;

  return (
    <header
      className="pointer-events-none absolute inset-x-0 top-0 z-30 px-3 sm:px-6"
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
      }}
    >
      <div className="mx-auto flex w-full max-w-5xl items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Keluar ke Lobby Hiburan"
            title="Keluar ke Lobby Hiburan"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              router.push('/admin/hiburan');
            }}
            className="pointer-events-auto flex items-center justify-center min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-sm font-black transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C56B] cursor-pointer shadow-md"
          >
            X
          </button>

          <div className="pointer-events-auto flex items-center gap-2.5 sm:gap-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 sm:px-4 sm:py-2 text-white shadow-md">
            <div className="flex flex-col">
              <span
                className="text-[10px] sm:text-[11px] font-bold tracking-wide"
                style={{ color: PALETTE.ui.textSubtleOnDark }}
              >
                Skor
              </span>
              <span className="text-sm sm:text-lg font-extrabold tabular-nums leading-tight text-white">
                {score.toLocaleString('id-ID')}
              </span>
            </div>

            <div
              className="h-6 w-[1px] bg-white/20"
              aria-hidden="true"
            />

            <div className="flex flex-col">
              <span
                className="text-[10px] sm:text-[11px] font-bold tracking-wide"
                style={{ color: PALETTE.ui.textSubtleOnDark }}
              >
                Lantai
              </span>
              <span className="text-sm sm:text-lg font-extrabold tabular-nums leading-tight text-white">
                {height}
              </span>
            </div>

            <div
              className="h-6 w-[1px] bg-white/20"
              aria-hidden="true"
            />

            <div className="flex flex-col">
              <span
                className="text-[10px] sm:text-[11px] font-bold tracking-wide"
                style={{ color: PALETTE.ui.textSubtleOnDark }}
              >
                Kombo
              </span>
              <span
                className="text-sm sm:text-lg font-extrabold tabular-nums leading-tight"
                style={{
                  color:
                    combo > 0 ? PALETTE.accentJayyid : PALETTE.ui.textOnDark,
                }}
              >
                {combo}x
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onRequestSurrender();
            }}
            className="pointer-events-auto min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] border border-white/25 text-white text-xs sm:text-sm font-bold tracking-wide transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C56B] cursor-pointer shadow-md"
          >
            Menyerah
          </button>

          {isWindActive && (
            <div
              className="rounded-lg bg-white/10 backdrop-blur-md border border-white/20 px-2.5 py-1 text-[11px] font-bold tracking-wide"
              style={{
                color: PALETTE.accentJayyid,
              }}
            >
              Angin {currentWind >= 0 ? 'Kanan' : 'Kiri'} ({Math.abs(currentWind)})
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
