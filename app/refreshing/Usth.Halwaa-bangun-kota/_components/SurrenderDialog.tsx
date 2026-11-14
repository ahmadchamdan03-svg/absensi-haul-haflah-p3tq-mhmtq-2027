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
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          style={{
            backgroundColor: PALETTE.ui.surfaceDarkOverlay,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-full max-w-sm rounded-2xl p-6 shadow-xl"
            style={{
              backgroundColor: PALETTE.ui.surfacePrimary,
              border: `2px solid ${PALETTE.ui.borderStrong}`,
              color: PALETTE.ui.textPrimary,
            }}
          >
            <h2
              id="surrender-dialog-title"
              className="text-xl sm:text-2xl font-extrabold tracking-tight text-center"
              style={{ color: PALETTE.ui.textPrimary }}
            >
              Yakin menyerah?
            </h2>

            <p
              id="surrender-dialog-desc"
              className="mt-2 text-sm text-center leading-relaxed"
              style={{ color: PALETTE.ui.textSecondary }}
            >
              Pembangunan menara saat ini akan diakhiri dan rekapitulasi skor akhir Anda akan ditampilkan.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-bold transition-transform duration-150 hover:scale-[1.01] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer"
                style={{
                  backgroundColor: PALETTE.ui.neutralBtnBg,
                  color: PALETTE.ui.neutralBtnText,
                  border: `1.5px solid ${PALETTE.ui.borderStrong}`,
                  outlineColor: PALETTE.ui.textPrimary,
                }}
              >
                Batal
              </button>

              <button
                type="button"
                onClick={onConfirm}
                className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-bold transition-transform duration-150 hover:scale-[1.01] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer"
                style={{
                  backgroundColor: PALETTE.ui.dangerBg,
                  color: PALETTE.ui.dangerText,
                  border: `1.5px solid ${PALETTE.ui.textPrimary}`,
                  outlineColor: PALETTE.ui.dangerBg,
                }}
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
