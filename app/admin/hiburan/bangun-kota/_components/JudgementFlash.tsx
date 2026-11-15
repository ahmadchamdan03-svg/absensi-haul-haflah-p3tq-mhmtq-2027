'use client';

import React from 'react';
import { Caveat } from 'next/font/google';
import { AnimatePresence, motion } from 'framer-motion';
import { FlashEvent, JudgementSide } from '../_hooks/useGameEngine';
import { getJudgementLabel, Judgement } from '../_lib/engine';
import { PALETTE } from '../_lib/palette';

const caveatFont = Caveat({
  subsets: ['latin'],
  weight: ['700'],
  display: 'swap',
});

interface JudgementFlashProps {
  flash: FlashEvent | null;
  side?: JudgementSide;
  tilt?: number;
}

function getAccentColor(judgement: Judgement): string {
  if (judgement === 'jayyid') return PALETTE.accentJayyid;
  if (judgement === 'mutawasith') return PALETTE.accentMutawasith;
  return PALETTE.accentRodi;
}

export default function JudgementFlash({
  flash,
  side,
  tilt,
}: JudgementFlashProps) {
  const resolvedSide: JudgementSide = side ?? flash?.side ?? 'right';
  const resolvedTilt: number = tilt ?? flash?.tilt ?? 0;
  const driftX = resolvedSide === 'left' ? -8 : 8;

  return (
    <div
      aria-live="polite"
      data-testid="judgement-flash-container"
      data-side={resolvedSide}
      className={`pointer-events-none absolute top-[40%] z-30 flex flex-col ${
        resolvedSide === 'left'
          ? 'left-3 sm:left-[10%] items-start'
          : 'right-3 sm:right-[10%] items-end'
      }`}
    >
      <AnimatePresence>
        {flash && (
          <motion.div
            key={flash.id}
            initial={{ opacity: 0, y: 8, x: 0, scale: 0.78 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: [8, 0, -6, -18],
              x: [0, 0, driftX * 0.4, driftX],
              scale: [0.78, 1.12, 1.02, 0.94],
            }}
            exit={{ opacity: 0, y: -14, scale: 0.92 }}
            transition={{
              duration: 1.35,
              times: [0, 0.12, 0.78, 1],
              ease: 'easeOut',
            }}
          >
            <span
              data-testid="judgement-flash-text"
              className={`${caveatFont.className} inline-block text-4xl sm:text-5xl font-bold leading-none select-none`}
              style={{
                color: getAccentColor(flash.judgement),
                transform: `rotate(${resolvedTilt}deg)`,
                textShadow:
                  '0 3px 10px rgba(4, 11, 26, 0.95), 0 0 18px rgba(4, 11, 26, 0.88)',
              }}
            >
              {getJudgementLabel(flash.judgement)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
