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
            className="pointer-events-auto flex items-center justify-center min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl text-sm font-black transition-transform duration-150 hover:scale-[1.02] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer shadow-md"
            style={{
              backgroundColor: PALETTE.ui.surfaceHud,
              color: PALETTE.ui.textOnDark,
              border: `1.5px solid ${PALETTE.ui.borderStrong}`,
              outlineColor: PALETTE.ui.surfacePrimary,
            }}
          >
            X
          </button>

          <div
            className="pointer-events-auto flex items-center gap-2.5 sm:gap-4 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 shadow-md"
            style={{
              backgroundColor: PALETTE.ui.surfaceHud,
              color: PALETTE.ui.textOnDark,
              border: `1.5px solid ${PALETTE.ui.borderStrong}`,
            }}
          >
            <div className="flex flex-col">
              <span
                className="text-[10px] sm:text-[11px] font-semibold tracking-wide"
                style={{ color: PALETTE.ui.textSubtleOnDark }}
              >
                Skor
              </span>
              <span className="text-sm sm:text-lg font-extrabold tabular-nums leading-tight">
                {score.toLocaleString('id-ID')}
              </span>
            </div>

            <div
              className="h-6 w-[1px]"
              style={{ backgroundColor: PALETTE.ui.textMuted }}
              aria-hidden="true"
            />

            <div className="flex flex-col">
              <span
                className="text-[10px] sm:text-[11px] font-semibold tracking-wide"
                style={{ color: PALETTE.ui.textSubtleOnDark }}
              >
                Lantai
              </span>
              <span className="text-sm sm:text-lg font-extrabold tabular-nums leading-tight">
                {height}
              </span>
            </div>

            <div
              className="h-6 w-[1px]"
              style={{ backgroundColor: PALETTE.ui.textMuted }}
              aria-hidden="true"
            />

            <div className="flex flex-col">
              <span
                className="text-[10px] sm:text-[11px] font-semibold tracking-wide"
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
            className="pointer-events-auto min-h-[44px] min-w-[44px] px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-transform duration-150 hover:scale-[1.02] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer shadow-md"
            style={{
              backgroundColor: PALETTE.ui.dangerBg,
              color: PALETTE.ui.dangerText,
              border: `1.5px solid ${PALETTE.ui.surfacePrimary}`,
              outlineColor: PALETTE.ui.surfacePrimary,
            }}
          >
            Menyerah
          </button>

          {isWindActive && (
            <div
              className="rounded-lg px-2.5 py-1 text-[11px] font-bold tracking-wide"
              style={{
                backgroundColor: PALETTE.ui.surfaceHud,
                color: PALETTE.accentMutawasith,
                border: `1px solid ${PALETTE.ui.borderStrong}`,
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
