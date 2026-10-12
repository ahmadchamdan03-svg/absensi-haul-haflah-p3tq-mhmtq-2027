'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, MapPin, Download, ExternalLink, Search, Compass, Info, X } from 'lucide-react';
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

export default function InteractiveDenah({
  initialLocationId,
  onSelectLocation,
  className = '',
}: InteractiveDenahProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'semua' | 'dalam' | 'luar' | 'jalur'>('semua');
  const [selectedZone, setSelectedZone] = useState<ZoneInfo | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartScaleRef = useRef<number>(1);

  // Set initial selected location if provided
  useEffect(() => {
    if (initialLocationId) {
      const allZones: ZoneInfo[] = [
        ...DENAH_HAFLAH_2027.areaDalam,
        ...DENAH_HAFLAH_2027.areaLuar,
        ...DENAH_HAFLAH_2027.jalurAkses,
      ];
      const found = allZones.find((z) => z.id === initialLocationId);
      if (found) {
        setSelectedZone(found);
      }
    }
  }, [initialLocationId]);

  // Zoom controls with clamped range 0.5x - 3.0x
  const handleZoomIn = () => setScale((prev) => Math.min(Number((prev + 0.25).toFixed(2)), 3.0));
  const handleZoomOut = () => setScale((prev) => Math.max(Number((prev - 0.25).toFixed(2)), 0.5));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Mouse wheel zoom on container
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.15 : -0.15;
    setScale((prev) => {
      const newScale = Math.min(3.0, Math.max(0.5, prev + zoomFactor));
      return Number(newScale.toFixed(2));
    });
  }, []);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag with primary mouse button
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch gesture handlers for mobile pinch & pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDistRef.current = Math.hypot(dx, dy);
      touchStartScaleRef.current = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    } else if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDist = Math.hypot(dx, dy);
      const ratio = currentDist / touchStartDistRef.current;
      const newScale = Math.min(3.0, Math.max(0.5, touchStartScaleRef.current * ratio));
      setScale(Number(newScale.toFixed(2)));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartDistRef.current = null;
  };

  const handleSelectZone = (zone: ZoneInfo) => {
    if (selectedZone?.id === zone.id) {
      setSelectedZone(null);
    } else {
      setSelectedZone(zone);
      if (onSelectLocation) {
        onSelectLocation({ id: zone.id, nama: zone.nama });
      }
    }
  };

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
    <div className={`flex flex-col bg-white rounded-3xl border-2 border-[#D5C4B4] overflow-hidden shadow-md select-none ${className}`}>
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
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg text-[#8C6A47] hover:bg-[#EFE8E1] transition-colors"
              title="Perbesar Denah (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg text-[#8C6A47] hover:bg-[#EFE8E1] transition-colors"
              title="Perkecil Denah (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-lg text-[#8C6A47] hover:bg-[#EFE8E1] transition-colors"
              title="Reset Posisi & Zoom"
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

      {/* VIEWPORT CANVAS DENAH DENGAN PAN & ZOOM GESER */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative flex-1 min-h-[380px] sm:min-h-[480px] md:min-h-[540px] bg-stone-900 overflow-hidden flex items-center justify-center p-4 ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <div
          className="transition-transform duration-75 ease-out origin-center flex items-center justify-center pointer-events-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          }}
        >
          <img
            src={DENAH_HAFLAH_2027.gambarUrl}
            alt="Peta Denah Lapangan Haflah 2027"
            className="max-w-full max-h-[700px] w-auto h-auto rounded-xl shadow-2xl object-contain border border-stone-700/50"
            draggable={false}
          />
        </div>

        {/* DETAIL POPUP OVERLAY JIKA KARTU LOKASI DIPILIH */}
        {selectedZone && (
          <div className="absolute top-4 left-4 right-4 sm:right-auto sm:max-w-sm bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl shadow-xl border-2 border-[#8C6A47] z-20 transition-all animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8C6A47]"></span>
                <h4 className="font-serif font-black text-xs sm:text-sm text-[#422F21]">
                  {selectedZone.nama}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedZone(null)}
                className="w-6 h-6 rounded-lg bg-[#EFE8E1] hover:bg-[#D5C4B4] text-[#422F21] flex items-center justify-center transition-colors shrink-0"
                title="Tutup Info"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-[#5C3E28] mt-1.5 leading-relaxed">
              {selectedZone.deskripsi}
            </p>
            <div className="mt-2.5 pt-2 border-t border-[#EFE8E1] space-y-1 text-[10px]">
              <div className="text-[#8C6A47] font-semibold flex items-center gap-1">
                <MapPin className="w-3 h-3 shrink-0" />
                <span>{selectedZone.lokasiSpesifik}</span>
              </div>
              {selectedZone.aksesTamu && (
                <div className="text-stone-600">
                  <span className="font-semibold text-[#422F21]">Akses:</span> {selectedZone.aksesTamu}
                </div>
              )}
            </div>
          </div>
        )}

        {/* INDIKATOR PETUNJUK PAN/ZOOM & SCALE & COMPASS FLOATING */}
        <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-[11px] font-medium flex items-center space-x-2 border border-white/10 pointer-events-none">
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>Utara: Kanan (← U)</span>
          <span className="text-stone-400">|</span>
          <span>Zoom: {Math.round(scale * 100)}%</span>
          <span className="hidden sm:inline text-stone-400">|</span>
          <span className="hidden sm:inline text-stone-300">Geser untuk pan</span>
        </div>
      </div>

      {/* DIREKTORI & PENJELASAN ZONA LOKASI (INTERAKTIF & CLICKABLE) */}
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
              type="button"
              onClick={() => setActiveTab('semua')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                activeTab === 'semua' ? 'bg-[#8C6A47] text-white shadow-2xs' : 'text-[#7A624E] hover:text-[#422F21]'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dalam')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                activeTab === 'dalam' ? 'bg-[#8C6A47] text-white shadow-2xs' : 'text-[#7A624E] hover:text-[#422F21]'
              }`}
            >
              Area Dalam
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('luar')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                activeTab === 'luar' ? 'bg-[#8C6A47] text-white shadow-2xs' : 'text-[#7A624E] hover:text-[#422F21]'
              }`}
            >
              Fasilitas &amp; Luar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('jalur')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                activeTab === 'jalur' ? 'bg-[#8C6A47] text-white shadow-2xs' : 'text-[#7A624E] hover:text-[#422F21]'
              }`}
            >
              Jalur Masuk
            </button>
          </div>
        </div>

        {/* DAFTAR ZONA ACCORDION / GRID DENGAN KLIK HIGHLIGHT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
          {(activeTab === 'semua' || activeTab === 'dalam') &&
            dalamFiltered.map((zone) => {
              const isSelected = selectedZone?.id === zone.id;
              return (
                <div
                  key={zone.id}
                  onClick={() => handleSelectZone(zone)}
                  className={`p-2.5 rounded-xl border transition-all shadow-2xs cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50/90 border-[#8C6A47] ring-2 ring-[#8C6A47]/40 scale-[1.01]'
                      : 'bg-white border-[#EFE8E1] hover:border-[#8C6A47] hover:bg-[#FAF7F3]'
                  }`}
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
              );
            })}

          {(activeTab === 'semua' || activeTab === 'luar') &&
            luarFiltered.map((zone) => {
              const isSelected = selectedZone?.id === zone.id;
              return (
                <div
                  key={zone.id}
                  onClick={() => handleSelectZone(zone)}
                  className={`p-2.5 rounded-xl border transition-all shadow-2xs cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50/90 border-[#8C6A47] ring-2 ring-[#8C6A47]/40 scale-[1.01]'
                      : 'bg-white border-[#EFE8E1] hover:border-[#8C6A47] hover:bg-[#FAF7F3]'
                  }`}
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
              );
            })}

          {(activeTab === 'semua' || activeTab === 'jalur') &&
            jalurFiltered.map((zone) => {
              const isSelected = selectedZone?.id === zone.id;
              return (
                <div
                  key={zone.id}
                  onClick={() => handleSelectZone(zone)}
                  className={`p-2.5 rounded-xl border transition-all shadow-2xs cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/40 scale-[1.01]'
                      : 'bg-white border-[#EFE8E1] hover:border-emerald-500 hover:bg-emerald-50/30'
                  }`}
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
              );
            })}
        </div>
      </div>
    </div>
  );
}
