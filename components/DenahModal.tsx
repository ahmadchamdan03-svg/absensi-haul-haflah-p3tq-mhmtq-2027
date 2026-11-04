'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import InteractiveDenah from './InteractiveDenah';

interface DenahModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLocationId?: string;
}

export default function DenahModal({ isOpen, onClose, initialLocationId }: DenahModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const modalJSX = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-2.5 sm:p-5 bg-black/70 backdrop-blur-md motion-reduce:transition-none"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-5xl max-h-[94vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl bg-[#FAF7F3]/90 backdrop-blur-2xl border border-white/60 motion-reduce:transform-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Floating Close Button */}
            <button
              onClick={onClose}
              className="absolute right-3.5 top-3.5 z-30 w-9 h-9 rounded-2xl bg-white/80 hover:bg-white text-[#422F21] border border-white/80 flex items-center justify-center shadow-md transition-colors btn-transition cursor-pointer backdrop-blur-xs"
              title="Tutup Denah"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Interactive Denah Component (tanpa overflow-y-auto yang memotong gesture) */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <InteractiveDenah initialLocationId={initialLocationId} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalJSX, document.body);
}
