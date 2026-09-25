'use client';

import React from 'react';
import { X } from 'lucide-react';
import InteractiveDenah from './InteractiveDenah';

interface DenahModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLocationId?: string;
}

export default function DenahModal({ isOpen, onClose, initialLocationId }: DenahModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 z-30 w-9 h-9 rounded-2xl bg-white/90 hover:bg-white text-[#422F21] border border-[#D5C4B4] flex items-center justify-center shadow-md transition-colors"
          title="Tutup Denah"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Interactive Denah Component */}
        <div className="overflow-y-auto max-h-[92vh]">
          <InteractiveDenah initialLocationId={initialLocationId} />
        </div>
      </div>
    </div>
  );
}
