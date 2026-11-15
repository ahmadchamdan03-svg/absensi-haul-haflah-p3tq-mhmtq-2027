'use client';

import React, { useEffect } from 'react';
import { getSkyIndex } from '../_lib/engine';
import {
  PALETTE,
  WIND_MIN_HEIGHT,
} from '../_lib/palette';

interface GameStageProps {
  height: number;
  currentWind: number;
  cameraOffsetY: number;
  stageRef: React.MutableRefObject<HTMLDivElement | null>;
  onTap: () => void;
  disabledTap?: boolean;
  children: React.ReactNode;
}

export default function GameStage({
  height,
  currentWind,
  stageRef,
  onTap,
  disabledTap = false,
  children,
}: GameStageProps) {
  const activeSkyIndex = getSkyIndex(height);
  const isWindActive = height >= WIND_MIN_HEIGHT;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabledTap) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'BUTTON' ||
          target.tagName === 'INPUT' ||
          target.closest('[role="dialog"]'))
      ) {
        return;
      }
      if (e.code === 'Space' || e.code === 'ArrowDown') {
        e.preventDefault();
        onTap();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTap, disabledTap]);

  const handleStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabledTap) return;
    const target = e.target as HTMLElement | null;
    if (target && (target.closest('button') || target.closest('[role="dialog"]'))) {
      return;
    }
    onTap();
  };

  return (
    <div
      ref={stageRef}
      onPointerDown={handleStagePointerDown}
      role="application"
      aria-label="Area permainan Bangun Kota. Ketuk layar atau tekan Spasi untuk menjatuhkan blok bangunan."
      className="relative w-full h-[100dvh] pb-0 overflow-hidden touch-none select-none cursor-pointer"
      style={{
        backgroundColor: PALETTE.skyBaseFallback,
      }}
    >
      {PALETTE.sky.map((gradient, idx) => (
        <div
          key={gradient}
          aria-hidden="true"
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out pointer-events-none"
          style={{
            background: gradient,
            opacity: idx === activeSkyIndex ? 1 : 0,
          }}
        />
      ))}

      {/* Latar Belakang Aula Utama (Penuh hingga dasar layar tanpa garis bawah) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none overflow-hidden"
      >
        <div
          className="w-full h-full bg-cover bg-top bg-no-repeat"
          style={{
            backgroundImage: "url('/images/aula-utama.jpg')",
            backgroundPosition: 'center top',
          }}
        />
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
      >
        {[
          { top: '14%', left: '18%', size: 3 },
          { top: '22%', left: '76%', size: 3 },
          { top: '11%', left: '54%', size: 4 },
          { top: '29%', left: '28%', size: 3 },
          { top: '18%', left: '88%', size: 3 },
          { top: '34%', left: '68%', size: 2.5 },
          { top: '26%', left: '12%', size: 3.5 },
        ].map((star, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              backgroundColor: PALETTE.ground.star,
              opacity: 0.65,
            }}
          />
        ))}
      </div>

      {isWindActive && (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-1/3 h-40 pointer-events-none overflow-hidden"
        >
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className="absolute h-0.5 rounded-full transition-transform duration-300"
              style={{
                top: `${idx * 44 + 16}px`,
                left: currentWind >= 0 ? '15%' : '55%',
                width: `${Math.min(140, Math.abs(currentWind) + 48)}px`,
                backgroundColor: PALETTE.ground.cloud,
                transform: `translate3d(${currentWind * 0.35}px, 0, 0)`,
              }}
            />
          ))}
        </div>
      )}

      {children}
    </div>
  );
}
