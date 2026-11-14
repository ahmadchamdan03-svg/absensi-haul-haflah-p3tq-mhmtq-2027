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
      className="pointer-events-none absolute inset-x-0 top-[36%] z-30 flex flex-col items-center justify-center px-4"
    >
      <AnimatePresence mode="wait">
        {flash && (
          <motion.div
            key={flash.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.8, 1.1, 1, 1],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.8,
              times: [0, 0.22, 0.55, 1],
              ease: 'easeOut',
            }}
            className="flex flex-col items-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 px-5 py-2.5 shadow-lg"
          >
            <span
              className="text-2xl sm:text-3xl font-black tracking-wide"
              style={{ color: getAccentColor(flash.judgement) }}
            >
              {getJudgementLabel(flash.judgement)}
            </span>

            <span className="text-xs sm:text-sm font-bold mt-0.5 text-white">
              {flash.judgement === 'rodi'
                ? 'Blok Meleset (Kombo Reset)'
                : `+${flash.points.toLocaleString('id-ID')} Poin (${flash.combo}x Kombo)`}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
