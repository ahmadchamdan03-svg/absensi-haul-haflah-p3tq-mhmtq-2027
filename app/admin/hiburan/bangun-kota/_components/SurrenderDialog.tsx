'use client';

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PALETTE } from '../_lib/palette';

interface SurrenderDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function SurrenderDialog({
  open,
  onConfirm,
  onCancel,
}: SurrenderDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="surrender-dialog-title"
          aria-describedby="surrender-dialog-desc"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: PALETTE.ui.surfaceDarkOverlay,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-full max-w-sm rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 text-white shadow-2xl"
          >
            <h2
              id="surrender-dialog-title"
              className="text-xl sm:text-2xl font-serif font-black tracking-tight text-center"
              style={{ color: PALETTE.accentJayyid }}
            >
              Yakin menyerah?
            </h2>

            <p
              id="surrender-dialog-desc"
              className="mt-2 text-sm text-center leading-relaxed text-white/90"
            >
              Pembangunan menara saat ini akan diakhiri dan rekapitulasi skor akhir Anda akan ditampilkan.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white text-sm font-bold transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C56B] cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={onConfirm}
                className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] border border-white/25 text-white text-sm font-bold transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C56B] cursor-pointer shadow-sm"
              >
                Ya, Menyerah
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
