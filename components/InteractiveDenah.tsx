'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, MapPin, Download, ExternalLink, Search, Compass, X } from 'lucide-react';
import { DENAH_HAFLAH_2027, DENAH_COORDINATES, ZoneInfo } from '@/lib/denah-data';

export interface LokasiDenah {
  id: string;
  nama: string;
}

interface InteractiveDenahProps {
  initialLocationId?: string;
  onSelectLocation?: (loc: LokasiDenah) => void;
  onClose?: () => void;
  className?: string;
}

export default function InteractiveDenah({
  initialLocationId,
  onSelectLocation,
  onClose,
  className = '',
}: InteractiveDenahProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'semua' | 'dalam' | 'luar' | 'jalur'>('semua');
  const [selectedZone, setSelectedZone] = useState<ZoneInfo | null>(null);
  const [imageReady, setImageReady] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartScaleRef = useRef<number>(1);

  const focusZoneOnMap = useCallback((zoneId: string, scrollMapIntoView: boolean = false) => {
    const coord = DENAH_COORDINATES[zoneId];
    const imgEl = imgRef.current;
    if (!coord || !imgEl) return;

    const imgW = imgEl.offsetWidth;
    const imgH = imgEl.offsetHeight;
    if (!imgW || !imgH) return;

    const targetScale = Math.min(3.0, Math.max(0.5, coord.scale));
    const isNarrowViewport = (containerRef.current?.clientWidth || 800) < 640;
    const mobilePopupOffsetY = isNarrowViewport ? 36 : 0;

    // Dengan origin-center dan transform: translate(tx, ty) scale(S),
    // titik (pctX, pctY) pada gambar bergeser tepat ke pusat viewport ketika:
    // tx = (0.5 - pctX) * imgW * S, ty = (0.5 - pctY) * imgH * S
    const nextX = Math.round((0.5 - coord.pctX) * imgW * targetScale);
    const nextY = Math.round((0.5 - coord.pctY) * imgH * targetScale + mobilePopupOffsetY);

    setScale(Number(targetScale.toFixed(2)));
    setPosition({ x: nextX, y: nextY });

    if (scrollMapIntoView && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > window.innerHeight * 0.95) {
        containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, []);

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
        if (imageReady || imgRef.current?.complete) {
          focusZoneOnMap(found.id, false);
        }
      }
    }
  }, [initialLocationId, imageReady, focusZoneOnMap]);

  // Zoom controls with clamped range 0.5x - 3.0x
  const handleZoomIn = () => setScale((prev) => Math.min(Number((prev + 0.25).toFixed(2)), 3.0));
  const handleZoomOut = () => setScale((prev) => Math.max(Number((prev - 0.25).toFixed(2)), 0.5));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setSelectedZone(null);
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

  // Window-level mouse move and mouse up listeners while dragging
  useEffect(() => {
    if (!isDragging) return;

    const onWindowMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    };

    const onWindowMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup', onWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
    };
  }, [isDragging, dragStart]);

  // Window-level touch move & touch end listeners
  useEffect(() => {
    if (!isDragging && touchStartDistRef.current === null) return;

    const onWindowTouchMove = (e: TouchEvent) => {
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

    const onWindowTouchEnd = () => {
      setIsDragging(false);
      touchStartDistRef.current = null;
    };

    window.addEventListener('touchmove', onWindowTouchMove, { passive: true });
    window.addEventListener('touchend', onWindowTouchEnd);
    window.addEventListener('touchcancel', onWindowTouchEnd);

    return () => {
      window.removeEventListener('touchmove', onWindowTouchMove);
      window.removeEventListener('touchend', onWindowTouchEnd);
      window.removeEventListener('touchcancel', onWindowTouchEnd);
    };
  }, [isDragging, dragStart]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag with primary mouse button
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
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

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartDistRef.current = null;
  };

  const handleSelectZone = (zone: ZoneInfo) => {
    if (selectedZone?.id === zone.id) {
      setSelectedZone(null);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setSelectedZone(zone);
      focusZoneOnMap(zone.id, true);
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
    <div className={`flex flex-col bg-transparent rounded-3xl overflow-hidden select-none ${className}`}>
      {/* HEADER RINGKAS & KONTROL UTAMA — Mobile Close X terpisah dari tombol aksi */}
      <div className="bg-white/60 backdrop-blur-md px-4 py-3 border-b border-white/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#1D4ED8] text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-black text-sm md:text-base text-[#0F2C59]">
                Denah Lapangan Haul &amp; Haflah 2027
              </h3>
              <p className="text-[11px] text-[#7A624E] flex items-center gap-1.5">
                <span>Orientasi: {DENAH_HAFLAH_2027.orientasi}</span>
              </p>
            </div>
          </div>

          {/* Tombol X Close khusus Mobile — Sejajar dengan judul, tidak menabrak tombol unduh */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="sm:hidden w-8 h-8 rounded-xl bg-white/80 text-[#0F2C59] border border-stone-200 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              title="Tutup Denah"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          )}
        </div>

        {/* AKSI: ZOOM, UNDUH, BUKA TAB BARU, DAN CLOSE DI DESKTOP */}
        <div className="flex flex-wrap gap-2 items-center justify-between sm:justify-end w-full sm:w-auto">
          <div className="flex items-center space-x-1 bg-white/60 backdrop-blur-xs p-1 rounded-xl border border-white/70 shadow-2xs">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg text-[#1D4ED8] hover:bg-white/80 transition-colors cursor-pointer"
              title="Perbesar Denah (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg text-[#1D4ED8] hover:bg-white/80 transition-colors cursor-pointer"
              title="Perkecil Denah (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-lg text-[#1D4ED8] hover:bg-white/80 transition-colors cursor-pointer"
              title="Reset Posisi & Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <a
              href={DENAH_HAFLAH_2027.gambarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-white/60 backdrop-blur-xs border border-white/70 text-[11px] font-bold text-[#0F2C59] hover:bg-white/85 transition-colors shadow-2xs"
              title="Buka Denah Resolusi Tinggi di Tab Baru"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#1D4ED8]" />
              <span className="hidden sm:inline">Tab Baru</span>
            </a>

            <a
              href={DENAH_HAFLAH_2027.gambarUrl}
              download="Denah-Haflah-2027.jpg"
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-[#1D4ED8] text-white text-[11px] font-bold hover:bg-[#725436] transition-colors shadow-2xs"
              title="Unduh Gambar Denah (JPG High-Res)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh</span>
            </a>

            {/* Tombol X Close di Layar Lebar/Desktop */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white/60 backdrop-blur-xs border border-white/70 text-[#0F2C59] hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer shadow-2xs"
                title="Tutup Denah"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CONTAINER UTAMA: SPLIT-SCREEN DI PC (KIRI 2/3 GAMBAR, KANAN 1/3 DAFTAR) & FLOW ALAMI DI MOBILE */}
      <div className="flex flex-col lg:flex-row lg:gap-6 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden p-3 sm:p-4">
        {/* SISI KIRI (AREA GAMBAR): 2/3 LAYAR DI PC DENGAN PAN & ZOOM CANVAS */}
        <div className="w-full lg:w-2/3 lg:h-[70vh] flex flex-col rounded-2xl overflow-hidden border border-white/60 bg-stone-900/95 shadow-lg relative min-h-[380px] sm:min-h-[440px] shrink-0">
          <div
            ref={containerRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            style={{ touchAction: 'none' }}
            className={`relative flex-1 w-full h-full overflow-hidden flex items-center justify-center p-4 ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            <div
              className="origin-center flex items-center justify-center pointer-events-none"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transitionProperty: 'transform',
                transitionDuration: isDragging ? '0ms' : '500ms',
                transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              <img
                ref={imgRef}
                onLoad={() => setImageReady(true)}
                src={DENAH_HAFLAH_2027.gambarUrl}
                alt="Peta Denah Lapangan Haflah 2027"
                className="max-w-full max-h-[700px] w-auto h-auto rounded-xl shadow-2xl object-contain border border-stone-700/50"
                draggable={false}
              />
            </div>

            {/* DETAIL POPUP OVERLAY JIKA KARTU LOKASI DIPILIH */}
            {selectedZone && (
              <div className="absolute top-4 left-4 right-4 sm:right-auto sm:max-w-sm bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl shadow-xl border-2 border-[#1D4ED8] z-20 transition-all animate-in fade-in zoom-in-95">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1D4ED8]"></span>
                    <h4 className="font-serif font-black text-xs sm:text-sm text-[#0F2C59]">
                      {selectedZone.nama}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedZone(null)}
                    className="w-6 h-6 rounded-lg bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0F2C59] flex items-center justify-center transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                    title="Tutup Info"
                    aria-label="Tutup info lokasi"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-[#1E3A8A] mt-1.5 leading-relaxed">
                  {selectedZone.deskripsi}
                </p>
                <div className="mt-2.5 pt-2 border-t border-[#E0F2FE] space-y-1 text-[10px]">
                  <div className="text-[#1D4ED8] font-semibold flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span>{selectedZone.lokasiSpesifik}</span>
                  </div>
                  {selectedZone.aksesTamu && (
                    <div className="text-stone-600">
                      <span className="font-semibold text-[#0F2C59]">Akses:</span> {selectedZone.aksesTamu}
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
        </div>

        {/* SISI KANAN (AREA DAFTAR): 1/3 LAYAR DI PC DENGAN SCROLL MANDIRI, H-AUTO DI HP */}
        <div className="w-full lg:w-1/3 h-auto lg:h-[70vh] lg:overflow-y-auto pr-1 sm:pr-2 mt-4 lg:mt-0 space-y-3">
          {/* SEARCH & FILTER TAB */}
          <div className="flex flex-col gap-2.5">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-[#1D4ED8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari lokasi (contoh: VVIP, Prasmanan, MCK, Parkir)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white/70 backdrop-blur-xs rounded-xl border border-white/80 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] text-[#0F2C59] placeholder-[#7A624E]/70 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-1 bg-white/60 backdrop-blur-xs p-1 rounded-xl border border-white/70 overflow-x-auto w-full">
              <button
                type="button"
                onClick={() => setActiveTab('semua')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
                  activeTab === 'semua' ? 'bg-[#1D4ED8] text-white shadow-2xs' : 'text-[#7A624E] hover:text-[#0F2C59]'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('dalam')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
                  activeTab === 'dalam' ? 'bg-[#1D4ED8] text-white shadow-2xs' : 'text-[#7A624E] hover:text-[#0F2C59]'
                }`}
              >
                Area Dalam
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('luar')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
                  activeTab === 'luar' ? 'bg-[#1D4ED8] text-white shadow-2xs' : 'text-[#7A624E] hover:text-[#0F2C59]'
                }`}
              >
                Fasilitas &amp; Luar
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('jalur')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
                  activeTab === 'jalur' ? 'bg-[#1D4ED8] text-white shadow-2xs' : 'text-[#7A624E] hover:text-[#0F2C59]'
                }`}
              >
                Jalur Masuk
              </button>
            </div>
          </div>

          {/* DAFTAR ZONA ACCORDION / GRID — h-auto di mobile sehingga bebas di-scroll di seluruh halaman */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 h-auto">
            {(activeTab === 'semua' || activeTab === 'dalam') &&
              dalamFiltered.map((zone) => {
                const isSelected = selectedZone?.id === zone.id;
                return (
                  <div
                    key={zone.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectZone(zone)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectZone(zone);
                      }
                    }}
                    className={`p-2.5 rounded-xl border transition-all shadow-2xs cursor-pointer ${
                      isSelected
                        ? 'bg-sky-100/90 border-2 border-[#B8860B] ring-2 ring-amber-400/50 shadow-md scale-[1.01]'
                        : 'bg-white/60 backdrop-blur-xs border-white/70 hover:border-[#1D4ED8] hover:bg-white/85'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className={`font-bold text-xs line-clamp-1 ${isSelected ? 'text-[#1E3A8A]' : 'text-[#0F2C59]'}`}>
                        {zone.nama}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-semibold border shrink-0 ${
                          isSelected
                            ? 'bg-[#1D4ED8] text-white border-[#725436]'
                            : 'bg-white/60 text-[#1D4ED8] border-white/80'
                        }`}
                      >
                        {isSelected ? 'Fokus' : 'Dalam'}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#7A624E] mt-1 line-clamp-2">{zone.deskripsi}</p>
                    <p className="text-[9px] text-[#1D4ED8] font-medium mt-1">📍 {zone.lokasiSpesifik}</p>
                  </div>
                );
              })}

            {(activeTab === 'semua' || activeTab === 'luar') &&
              luarFiltered.map((zone) => {
                const isSelected = selectedZone?.id === zone.id;
                return (
                  <div
                    key={zone.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectZone(zone)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectZone(zone);
                      }
                    }}
                    className={`p-2.5 rounded-xl border transition-all shadow-2xs cursor-pointer ${
                      isSelected
                        ? 'bg-sky-100/90 border-2 border-[#B8860B] ring-2 ring-amber-400/50 shadow-md scale-[1.01]'
                        : 'bg-white/60 backdrop-blur-xs border-white/70 hover:border-[#1D4ED8] hover:bg-white/85'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className={`font-bold text-xs line-clamp-1 ${isSelected ? 'text-[#1E3A8A]' : 'text-[#0F2C59]'}`}>
                        {zone.nama}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-semibold border shrink-0 ${
                          isSelected
                            ? 'bg-[#1D4ED8] text-white border-[#725436]'
                            : 'bg-white/60 text-[#0F2C59] border-white/80'
                        }`}
                      >
                        {isSelected ? 'Fokus' : 'Luar / MCK'}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#7A624E] mt-1 line-clamp-2">{zone.deskripsi}</p>
                    <p className="text-[9px] text-[#1D4ED8] font-medium mt-1">📍 {zone.lokasiSpesifik}</p>
                  </div>
                );
              })}

            {(activeTab === 'semua' || activeTab === 'jalur') &&
              jalurFiltered.map((zone) => {
                const isSelected = selectedZone?.id === zone.id;
                return (
                  <div
                    key={zone.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectZone(zone)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectZone(zone);
                      }
                    }}
                    className={`p-2.5 rounded-xl border transition-all shadow-2xs cursor-pointer ${
                      isSelected
                        ? 'bg-sky-100/90 border-2 border-[#B8860B] ring-2 ring-amber-400/50 shadow-md scale-[1.01]'
                        : 'bg-white/60 backdrop-blur-xs border-white/70 hover:border-blue-500 hover:bg-blue-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className={`font-bold text-xs line-clamp-1 ${isSelected ? 'text-[#1E3A8A]' : 'text-[#0F2C59]'}`}>
                        {zone.nama}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-semibold border shrink-0 ${
                          isSelected
                            ? 'bg-[#1D4ED8] text-white border-[#725436]'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                      >
                        {isSelected ? 'Fokus' : 'Jalur Alur'}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#7A624E] mt-1 line-clamp-2">{zone.deskripsi}</p>
                    <p className="text-[9px] text-blue-700 font-medium mt-1">🚩 {zone.lokasiSpesifik}</p>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
