'use client';

import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, MapPin } from 'lucide-react';

export interface LokasiDenah {
  id: string;
  nama: string;
}

interface InteractiveDenahProps {
  initialLocationId?: string;
  onSelectLocation?: (loc: LokasiDenah) => void;
  className?: string;
}

export default function InteractiveDenah({ className = '' }: InteractiveDenahProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.8));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className={`flex flex-col bg-white rounded-3xl border-2 border-[#D5C4B4] overflow-hidden shadow-sm ${className}`}>
      {/* HEADER RINGKAS & BERSIH */}
      <div className="bg-[#FAF7F3] px-4 py-3 border-b border-[#D5C4B4] flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#8C6A47] text-white flex items-center justify-center font-bold">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif font-black text-sm text-[#422F21]">Peta Denah Lapangan Haflah 2027</h3>
            <p className="text-[11px] text-[#7A624E]">Tampilan jernih denah lokasi dan alur gerbang</p>
          </div>
        </div>

        {/* KONTROL ZOOM KECIL */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg bg-white border border-[#D5C4B4] text-[#8C6A47] hover:bg-[#EFE8E1] transition-colors"
            title="Perbesar"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg bg-white border border-[#D5C4B4] text-[#8C6A47] hover:bg-[#EFE8E1] transition-colors"
            title="Perkecil"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-white border border-[#D5C4B4] text-[#8C6A47] hover:bg-[#EFE8E1] transition-colors"
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* VIEWPORT CANVAS DENAH STATIS & JERNIH */}
      <div className="relative flex-1 min-h-[420px] sm:min-h-[520px] bg-stone-900 overflow-hidden flex items-center justify-center p-4">
        <div
          className="transition-transform duration-200 ease-out flex items-center justify-center"
          style={{ transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)` }}
        >
          <img
            src="/images/denah-haflah-2027.jpg"
            alt="Peta Denah Lapangan Haflah 2027"
            className="max-w-full max-h-[600px] w-auto h-auto rounded-xl shadow-2xl object-contain"
          />
        </div>
      </div>
    </div>
  );
}
