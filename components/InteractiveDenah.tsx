'use client';

import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, MapPin, Download, ExternalLink, Search, Layers, Compass } from 'lucide-react';
import { DENAH_HAFLAH_2027, ZoneInfo } from '@/lib/denah-data';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'semua' | 'dalam' | 'luar' | 'jalur'>('semua');

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.3, 3.5));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.3, 0.7));
  const handleReset = () => setScale(1);

  const filterZones = (zones: ZoneInfo[]) => {
    if (!searchQuery.trim()) return zones;
    const q = searchQuery.toLowerCase();
    return zones.filter(
      (z) =>
        z.nama.toLowerCase().includes(q) ||
        z.deskripsi.toLowerCase().includes(q) ||
        z.lokasiSpesifik.toLowerCase().includes(q)
    );
  };

  const dalamFiltered = filterZones(DENAH_HAFLAH_2027.areaDalam);
  const luarFiltered = filterZones(DENAH_HAFLAH_2027.areaLuar);
  const jalurFiltered = filterZones(DENAH_HAFLAH_2027.jalurAkses);

  return (
    <div className={`flex flex-col bg-white rounded-3xl border-2 border-[#D5C4B4] overflow-hidden shadow-md ${className}`}>
      {/* HEADER RINGKAS & KONTROL UTAMA */}
      <div className="bg-[#FAF7F3] px-4 py-3 border-b border-[#D5C4B4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#8C6A47] text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-black text-sm md:text-base text-[#422F21]">
              Denah Lapangan Haul &amp; Haflah 2027
            </h3>
            <p className="text-[11px] text-[#7A624E] flex items-center gap-1.5">
              <span>Orientasi: {DENAH_HAFLAH_2027.orientasi}</span>
            </p>
          </div>
        </div>

        {/* AKSI: ZOOM, UNDUH, BUKA TAB BARU */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
          <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-[#D5C4B4] shadow-2xs">
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg text-[#8C6A47] hover:bg-[#EFE8E1] transition-colors"
              title="Perbesar Denah (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg text-[#8C6A47] hover:bg-[#EFE8E1] transition-colors"
              title="Perkecil Denah (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg text-[#8C6A47] hover:bg-[#EFE8E1] transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <a
            href={DENAH_HAFLAH_2027.gambarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-white border border-[#D5C4B4] text-[11px] font-bold text-[#422F21] hover:bg-[#EFE8E1] transition-colors shadow-2xs"
            title="Buka Denah Resolusi Tinggi di Tab Baru"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#8C6A47]" />
            <span className="hidden sm:inline">Tab Baru</span>
          </a>

          <a
            href={DENAH_HAFLAH_2027.gambarUrl}
            download="Denah-Haflah-2027.jpg"
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-[#8C6A47] text-white text-[11px] font-bold hover:bg-[#725436] transition-colors shadow-2xs"
            title="Unduh Gambar Denah (JPG High-Res)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh</span>
          </a>
        </div>
      </div>

      {/* VIEWPORT CANVAS DENAH STATIS & JERNIH */}
      <div className="relative flex-1 min-h-[380px] sm:min-h-[480px] md:min-h-[540px] bg-stone-900 overflow-auto flex items-center justify-center p-4 group">
        <div
          className="transition-transform duration-200 ease-out origin-center flex items-center justify-center cursor-zoom-in"
          style={{ transform: `scale(${scale})` }}
        >
          <img
            src={DENAH_HAFLAH_2027.gambarUrl}
            alt="Peta Denah Lapangan Haflah 2027"
            className="max-w-full max-h-[700px] w-auto h-auto rounded-xl shadow-2xl object-contain border border-stone-700/50"
          />
        </div>

        {/* INDIKATOR SCALE & COMPASS FLOATING */}
        <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-[11px] font-medium flex items-center space-x-2 border border-white/10 pointer-events-none">
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>Utara: Kanan (← U)</span>
          <span className="text-stone-400">|</span>
          <span>Zoom: {Math.round(scale * 100)}%</span>
        </div>
      </div>

      {/* DIREKTORI & PENJELASAN ZONA LOKASI */}
      <div className="bg-[#FAF7F3] border-t border-[#D5C4B4] p-4 space-y-3">
        {/* SEARCH & FILTER TAB */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8C6A47] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari lokasi (contoh: VVIP, Prasmanan, MCK, Parkir)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white rounded-xl border border-[#D5C4B4] focus:outline-none focus:ring-2 focus:ring-[#8C6A47] text-[#422F21]"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#EFE8E1] p-1 rounded-xl self-start sm:self-auto shrink-0">
            <button
              onClick={() => setActiveTab('semua')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                activeTab === 'semua' ? 'bg-[#8C6A47] text-white shadow-2xs' : 'text-[#7A624E] hover:text-[#422F21]'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setActiveTab('dalam')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                activeTab === 'dalam' ? 'bg-[#8C6A47] text-white shadow-2xs' : 'text-[#7A624E] hover:text-[#422F21]'
              }`}
            >
              Area Dalam
            </button>
            <button
              onClick={() => setActiveTab('luar')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                activeTab === 'luar' ? 'bg-[#8C6A47] text-white shadow-2xs' : 'text-[#7A624E] hover:text-[#422F21]'
              }`}
            >
              Fasilitas &amp; Luar
            </button>
            <button
              onClick={() => setActiveTab('jalur')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                activeTab === 'jalur' ? 'bg-[#8C6A47] text-white shadow-2xs' : 'text-[#7A624E] hover:text-[#422F21]'
              }`}
            >
              Jalur Masuk
            </button>
          </div>
        </div>

        {/* DAFTAR ZONA ACCORDION / GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
          {(activeTab === 'semua' || activeTab === 'dalam') &&
            dalamFiltered.map((zone) => (
              <div
                key={zone.id}
                className="bg-white p-2.5 rounded-xl border border-[#EFE8E1] hover:border-[#D5C4B4] transition-colors shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#422F21] line-clamp-1">{zone.nama}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#FAF7F3] text-[#8C6A47] font-semibold border border-[#D5C4B4]">
                    Dalam
                  </span>
                </div>
                <p className="text-[10px] text-[#7A624E] mt-1 line-clamp-2">{zone.deskripsi}</p>
                <p className="text-[9px] text-[#8C6A47] font-medium mt-1">📍 {zone.lokasiSpesifik}</p>
              </div>
            ))}

          {(activeTab === 'semua' || activeTab === 'luar') &&
            luarFiltered.map((zone) => (
              <div
                key={zone.id}
                className="bg-white p-2.5 rounded-xl border border-[#EFE8E1] hover:border-[#D5C4B4] transition-colors shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#422F21] line-clamp-1">{zone.nama}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#FAF7F3] text-[#422F21] font-semibold border border-[#D5C4B4]">
                    Luar / MCK
                  </span>
                </div>
                <p className="text-[10px] text-[#7A624E] mt-1 line-clamp-2">{zone.deskripsi}</p>
                <p className="text-[9px] text-[#8C6A47] font-medium mt-1">📍 {zone.lokasiSpesifik}</p>
              </div>
            ))}

          {(activeTab === 'semua' || activeTab === 'jalur') &&
            jalurFiltered.map((zone) => (
              <div
                key={zone.id}
                className="bg-white p-2.5 rounded-xl border border-[#EFE8E1] hover:border-[#D5C4B4] transition-colors shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#422F21] line-clamp-1">{zone.nama}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                    Jalur Alur
                  </span>
                </div>
                <p className="text-[10px] text-[#7A624E] mt-1 line-clamp-2">{zone.deskripsi}</p>
                <p className="text-[9px] text-emerald-700 font-medium mt-1">🚩 {zone.lokasiSpesifik}</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
