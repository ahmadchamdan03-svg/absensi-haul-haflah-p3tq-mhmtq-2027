'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FlashEvent } from '../_hooks/useGameEngine';
import { PALETTE } from '../_lib/palette';

export const HALWAA_PHOTOS: readonly string[] = [
  '/images/halwaa/senyum.webp',
  '/images/halwaa/melambai.webp',
  '/images/halwaa/welcoming.webp',
  '/images/halwaa/selamat-datang.webp',
  '/images/halwaa/doa.webp',
  '/images/halwaa/admin.webp',
  '/images/halwaa/tos/tos-1.webp',
  '/images/halwaa/tos/tos-2.webp',
  '/images/halwaa/tos/tos-3.webp',
  '/images/halwaa/tos/tos-4.webp',
  '/images/halwaa/tos/tos-5.webp',
  '/images/halwaa/tos/tos-6.webp',
];

export const HALWAA_QUOTES: readonly string[] = [
  'Masya Allah, presisi!',
  'Terus semangat membangun!',
  'Hati-hati ayunannya ya!',
  'Jayyid sekali!',
  'Alhamdulillah, tepat sasaran!',
  'Menaranya makin megah!',
  'Barakallah, lanjutkan!',
  'Mantap, ritmenya terjaga!',
];

interface UsthHalwaaPopUpProps {
  flash: FlashEvent | null;
}

interface ActivePopUp {
  id: number;
  photo: string;
  quote: string;
}

export default function UsthHalwaaPopUp({ flash }: UsthHalwaaPopUpProps) {
  const [activePopUp, setActivePopUp] = useState<ActivePopUp | null>(null);

  useEffect(() => {
    if (!flash || flash.judgement === 'rodi') {
      return;
    }

    const randomPhoto =
      HALWAA_PHOTOS[Math.floor(Math.random() * HALWAA_PHOTOS.length)];
    const randomQuote =
      HALWAA_QUOTES[Math.floor(Math.random() * HALWAA_QUOTES.length)];

    setActivePopUp({
      id: flash.id,
      photo: randomPhoto,
      quote: randomQuote,
    });

    const timer = window.setTimeout(() => {
      setActivePopUp((prev) => (prev?.id === flash.id ? null : prev));
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [flash]);

  return (
    <div
      aria-live="polite"
      data-testid="usth-halwaa-popup-container"
      className="pointer-events-none absolute bottom-3 left-2.5 sm:bottom-6 sm:left-6 z-30"
    >
      <AnimatePresence>
        {activePopUp && (
          <motion.div
            key="usth-halwaa-popup-card"
            data-testid="usth-halwaa-popup"
            initial={{ opacity: 0, y: 24, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.92 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="flex flex-col-reverse items-start sm:flex-row sm:items-end gap-1.5 sm:gap-2.5 max-w-[132px] sm:max-w-[290px]"
          >
            <img
              src={activePopUp.photo}
              alt="Usth. Halwaa"
              draggable={false}
              className="w-14 h-14 sm:w-16 sm:h-16 object-contain shrink-0 drop-shadow-[0_6px_12px_rgba(0,0,0,0.65)] select-none"
            />

            <div className="sm:mb-1.5 rounded-2xl rounded-bl-sm bg-[#091936]/90 backdrop-blur-md border border-[#F5C56B]/60 px-2.5 py-2 sm:px-3.5 sm:py-2.5 shadow-xl">
              <span
                className="block text-[10px] font-extrabold uppercase tracking-wider leading-tight"
                style={{ color: PALETTE.accentJayyid }}
              >
                Usth. Halwaa
              </span>
              <p className="mt-0.5 text-[11px] sm:text-sm font-bold text-white leading-snug">
                {activePopUp.quote}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
