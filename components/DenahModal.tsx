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

  // Kunci scroll background saat modal Denah terbuka di PC & mobile
  useEffect(() => {
    if (isOpen) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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
            onWheel={(e) => e.stopPropagation()}
            className="relative w-full max-w-6xl max-h-[94vh] flex flex-col rounded-3xl overflow-y-auto lg:overflow-hidden shadow-2xl bg-[#F0F9FF]/95 backdrop-blur-2xl border border-white/60 motion-reduce:transform-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Interactive Denah Component (responsif mobile & desktop split-screen) */}
            <div className="flex-1 min-h-0 flex flex-col overflow-visible lg:overflow-hidden">
              <InteractiveDenah initialLocationId={initialLocationId} onClose={onClose} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalJSX, document.body);
}
