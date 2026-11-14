'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FlashEvent } from '../_hooks/useGameEngine';
import { getJudgementLabel, Judgement } from '../_lib/engine';
import { PALETTE } from '../_lib/palette';

interface JudgementFlashProps {
  flash: FlashEvent | null;
}

function getAccentColor(judgement: Judgement): string {
  if (judgement === 'jayyid') return PALETTE.accentJayyid;
  if (judgement === 'mutawasith') return PALETTE.accentMutawasith;
  return PALETTE.accentRodi;
}

export default function JudgementFlash({ flash }: JudgementFlashProps) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none absolute right-4 sm:right-8 top-28 sm:top-20 z-30 flex flex-col items-end"
    >
      <AnimatePresence mode="wait">
        {flash && (
          <motion.span
            key={flash.id}
            initial={{ opacity: 0, y: -6, scale: 0.9 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: [-6, 0, 0, -4],
              scale: [0.9, 1.05, 1, 0.96],
            }}
            exit={{ opacity: 0, y: -4 }}
            transition={{
              duration: 0.85,
              times: [0, 0.2, 0.72, 1],
              ease: 'easeOut',
            }}
            className="text-lg sm:text-2xl font-black tracking-wide"
            style={{
              color: getAccentColor(flash.judgement),
              textShadow:
                '0 2px 8px rgba(4, 11, 26, 0.95), 0 0 16px rgba(4, 11, 26, 0.85)',
            }}
          >
            {getJudgementLabel(flash.judgement)}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
