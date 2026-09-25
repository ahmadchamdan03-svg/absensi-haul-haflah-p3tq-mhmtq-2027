'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Compass, Download, Share2 } from 'lucide-react';
import InteractiveDenah from '@/components/InteractiveDenah';

export default function DenahPublicPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F3] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-xs font-bold text-[#8C6A47] hover:text-[#422F21] bg-white px-3.5 py-2 rounded-2xl border border-[#D5C4B4] shadow-xs self-start transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>

          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <a
              href="/images/denah-haflah-2027.jpg"
              download="Denah-Haflah-P3TQ-2027.jpg"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#422F21] bg-white px-3 py-2 rounded-2xl border border-[#D5C4B4] shadow-xs hover:bg-[#EFE8E1] transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#8C6A47]" />
              <span>Unduh Arsip JPG</span>
            </a>
          </div>
        </div>

        {/* The Interactive Zoomable Denah Map */}
        <InteractiveDenah className="shadow-lg" />
      </div>
    </div>
  );
}
