'use client';

import React, { useEffect } from 'react';
import { getSkyIndex } from '../_lib/engine';
import {
  GROUND_HEIGHT,
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
  cameraOffsetY,
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

  const groundTranslateY = Math.min(cameraOffsetY, GROUND_HEIGHT + 120);

  return (
    <div
      ref={stageRef}
      onPointerDown={handleStagePointerDown}
      role="application"
      aria-label="Area permainan City Bloxx 2D. Ketuk layar atau tekan Spasi untuk menjatuhkan blok bangunan."
      className="fixed inset-0 z-[9999] h-[100dvh] w-screen overflow-hidden touch-none select-none cursor-pointer"
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

      {/* Latar Belakang Panggung Statis (Tidak ikut bergeser saat menara bertambah tinggi) */}
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
            'linear-gradient(180deg, rgba(7, 20, 43, 0.55) 0%, rgba(15, 44, 89, 0.35) 55%, rgba(7, 20, 43, 0.72) 100%)',
        }}
      />

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

      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 pointer-events-none transition-transform duration-300 ease-out"
        style={{
          transform: `translate3d(0, ${groundTranslateY}px, 0)`,
        }}
      >
        <div
          className="w-full"
          style={{
            height: `${GROUND_HEIGHT}px`,
            backgroundColor: PALETTE.ground.soil,
            borderTop: `4px solid ${PALETTE.ground.grass}`,
          }}
        >
          <div
            className="w-full h-2.5"
            style={{ backgroundColor: PALETTE.ground.curb }}
          />
        </div>
      </div>

      {children}
    </div>
  );
}
