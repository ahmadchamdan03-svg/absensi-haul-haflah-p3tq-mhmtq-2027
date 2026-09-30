'use client';

import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import InteractiveDenah from './InteractiveDenah';

interface DenahModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLocationId?: string;
}

export default function DenahModal({ isOpen, onClose, initialLocationId }: DenahModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs motion-reduce:transition-none"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl bg-white motion-reduce:transform-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Floating Close Button */}
            <button
              onClick={onClose}
              className="absolute right-3.5 top-3.5 z-30 w-9 h-9 rounded-2xl bg-white/90 hover:bg-white text-[#422F21] border border-[#D5C4B4] flex items-center justify-center shadow-md transition-colors btn-transition"
              title="Tutup Denah"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Interactive Denah Component */}
            <div className="overflow-y-auto max-h-[92vh]">
              <InteractiveDenah initialLocationId={initialLocationId} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
