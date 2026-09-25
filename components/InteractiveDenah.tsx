'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  MapPin,
  Maximize2,
  Navigation,
  Compass,
  Layers,
  Sparkles,
  Users,
  Utensils,
  Car,
  DoorOpen,
  Info,
  X,
  Check,
} from 'lucide-react';

export interface LokasiDenah {
  id: string;
  nama: string;
  kategori: string;
  badge: string;
  warna: string;
  warnaBg: string;
  deskripsi: string;
  pintuMasuk: string;
  fasilitas: string;
  kapasitas: string;
  targetZoom: {
    scale: number;
    x: number;
    y: number;
  };
  svgArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export const DAFTAR_LOKASI_DENAH: LokasiDenah[] = [
  {
    id: 'panggung',
    nama: 'Panggung Utama & VVIP Masyayikh',
    kategori: 'PANGGUNG',
    badge: '👑 VVIP & Masyayikh',
    warna: '#D49B5B',
    warnaBg: 'bg-amber-500/20 text-amber-900 border-amber-400',
    deskripsi: 'Panggung seremonial prosesi khataman, tempat duduk Dewan Masyayikh, sofa VVIP Putra & Putri.',
    pintuMasuk: 'Pintu Khusus Masyayikh / Drop Point DZ VIP (Barat)',
    fasilitas: 'Sofa VVIP, AC Portable, Sound System Utama, Podium Khotbah, Layar LED Videotron',
    kapasitas: '50 Tokoh Masyayikh & Tamu VVIP',
    targetZoom: { scale: 2.4, x: -500, y: -260 },
    svgArea: { x: 260, y: 280, width: 330, height: 110 },
  },
  {
    id: 'bil_ghoib',
    nama: 'Zona Santri Bil Ghoib & Wali (Tiket Emas)',
    kategori: 'SANTRI_BIL_GHOIB',
    badge: '🟢 Bil Ghoib + Emas ★',
    warna: '#059669',
    warnaBg: 'bg-emerald-500/20 text-emerald-900 border-emerald-400',
    deskripsi: 'Tempat duduk 63 santriwati Khadimatul Qur-an Takhtiman Bil Ghoibi (57 murni + 6 rangkap tamatan) dan wali perempuan pemegang Tiket Emas Panggung.',
    pintuMasuk: 'Gerbang Selatan (Bola Dunia) → Pintu Timur Aula',
    fasilitas: 'Akses langsung tangga naik ke Panggung Kehormatan untuk Ibu Kandung, Tiket Emas Khusus',
    kapasitas: '63 Santriwati (57 Murni + 6 Tamatan) + 63 Wali Ibu',
    targetZoom: { scale: 2.7, x: -540, y: -480 },
    svgArea: { x: 340, y: 470, width: 200, height: 50 },
  },
  {
    id: 'bin_nadzori',
    nama: 'Zona Santri Bin Nadzori (Kelas 1–6)',
    kategori: 'SANTRI_BIN_NADZOR',
    badge: '🔵 Bin Nadzori (Biru)',
    warna: '#2563EB',
    warnaBg: 'bg-blue-500/20 text-blue-900 border-blue-400',
    deskripsi: 'Tempat duduk 166 santriwati khataman Bin Nadzori (153 murni + 13 rangkap tamatan) dari 6 jenjang kelas berderet rapi di tengah aula.',
    pintuMasuk: 'Gerbang Selatan (Bola Dunia) → Koridor Tengah Aula',
    fasilitas: 'Tiket Biru, barisan teratur per jenjang kelas, monitor LED samping',
    kapasitas: '166 Santriwati (153 Murni + 13 Tamatan)',
    targetZoom: { scale: 2.6, x: -540, y: -540 },
    svgArea: { x: 340, y: 520, width: 200, height: 60 },
  },
  {
    id: 'tamatan',
    nama: 'Zona Santriwati Tamatan III Aliyah',
    kategori: 'SANTRI_TAMATAN',
    badge: '🟡 Tamatan (Kuning)',
    warna: '#D97706',
    warnaBg: 'bg-amber-500/20 text-amber-900 border-amber-400',
    deskripsi: 'Tempat duduk 307 santriwati purna studi Tamatan Madrasah Hidayatul Mubtadi-aat Al-Qur-aniyyah Bagian A.01 s/d B.03 (Total 326 tamatan termasuk 6 Bil Ghoib & 13 Bin Nadzori).',
    pintuMasuk: 'Gerbang Selatan (Bola Dunia) → Jalur Masuk Santri Aula',
    fasilitas: 'Tiket Kuning, barisan per kelompok bagian ujian tamatan',
    kapasitas: '307 Santriwati (Total 326 Tamatan)',
    targetZoom: { scale: 2.5, x: -540, y: -640 },
    svgArea: { x: 340, y: 595, width: 200, height: 85 },
  },
  {
    id: 'wali_putra',
    nama: 'Zona Wali Santri Putra (Sohibul Hajat PA)',
    kategori: 'WALI_PUTRA',
    badge: '🧔 Wali Laki-laki (PA)',
    warna: '#1E3A8A',
    warnaBg: 'bg-indigo-500/20 text-indigo-900 border-indigo-400',
    deskripsi: 'Area tempat duduk bapak / wali laki-laki dan keluarga putra, berada di sayap Barat aula.',
    pintuMasuk: 'Gerbang Selatan (Bola Dunia) → Sayap Barat (Jalur PA)',
    fasilitas: 'Kursi berjarak, videotron LED sudut Barat, akses langsung ke Prasmanan SH PA & Toilet Putra',
    kapasitas: '± 500 Kursi Wali Santri Laki-laki',
    targetZoom: { scale: 2.3, x: -280, y: -570 },
    svgArea: { x: 235, y: 485, width: 105, height: 215 },
  },
  {
    id: 'wali_putri',
    nama: 'Zona Wali Santri Putri (Sohibul Hajat PI)',
    kategori: 'WALI_PUTRI',
    badge: '🧕 Wali Perempuan (PI)',
    warna: '#BE185D',
    warnaBg: 'bg-pink-500/20 text-pink-900 border-pink-400',
    deskripsi: 'Area tempat duduk ibu / wali santriwati perempuan dan keluarga putri, berada di sayap Timur aula.',
    pintuMasuk: 'Gerbang Selatan (Bola Dunia) → Sayap Timur (Jalur PI)',
    fasilitas: 'Satir pemisah double, monitor LED Timur, akses Prasmanan SH PI & Toilet Putri',
    kapasitas: '± 700 Kursi Wali Santri Perempuan',
    targetZoom: { scale: 2.2, x: -680, y: -570 },
    svgArea: { x: 620, y: 440, width: 130, height: 290 },
  },
  {
    id: 'undangan_umum',
    nama: 'Tamu Undangan Umum (PA & PI)',
    kategori: 'UNDANGAN_UMUM',
    badge: '👥 Undangan Umum',
    warna: '#0891B2',
    warnaBg: 'bg-cyan-500/20 text-cyan-900 border-cyan-400',
    deskripsi: 'Area tempat duduk tokoh kehormatan, asatidz purna bakti, dan tamu undangan khusus keluarga pesantren.',
    pintuMasuk: 'Gerbang Selatan → Pintu Masuk Khusus Undangan (Satir U)',
    fasilitas: 'Tiket Putih VIP, baris sofa & kursi VIP, dekat monitor LED utama',
    kapasitas: '± 150 Tamu Undangan',
    targetZoom: { scale: 2.4, x: -450, y: -480 },
    svgArea: { x: 125, y: 380, width: 85, height: 235 },
  },
  {
    id: 'gerbang_bola_dunia',
    nama: 'Gerbang Selatan (Bola Dunia) & Pos Masuk',
    kategori: 'GERBANG',
    badge: '🌍 Gerbang Registrasi QR',
    warna: '#16A34A',
    warnaBg: 'bg-emerald-600/20 text-emerald-950 border-emerald-500',
    deskripsi: 'Titik pemeriksaan barcode QR utama, penyerahan tiket fisik, serta pendataan kehadiran rombongan.',
    pintuMasuk: 'Akses Jalan Raya Utama Selatan Pesantren',
    fasilitas: 'Posko Petugas PWA Scanner, Tenda Satir U, Pos Keamanan, Meja Registrasi Undangan',
    kapasitas: 'Jalur Masuk Ribuan Jamaah',
    targetZoom: { scale: 2.5, x: -800, y: -780 },
    svgArea: { x: 785, y: 740, width: 190, height: 160 },
  },
  {
    id: 'prasmanan',
    nama: 'Area Prasmanan & Konsumsi (PA, PI & Lobi)',
    kategori: 'KONSUMSI',
    badge: '🍽️ Prasmanan & Ramah Tamah',
    warna: '#EA580C',
    warnaBg: 'bg-orange-500/20 text-orange-950 border-orange-400',
    deskripsi: 'Titik jamuan makan prasmanan wali santri putra (Barat), wali putri (Timur), dan lobi Masyayikh (Utara).',
    pintuMasuk: 'Samping Koridor Aula Utama & Lobi Gedung',
    fasilitas: 'Meja prasmanan buffet, air mineral kemasan, tempat cuci tangan & pembuangan rapi',
    kapasitas: 'Alur Rotasi Ribuan Porsi',
    targetZoom: { scale: 2.3, x: -440, y: -120 },
    svgArea: { x: 220, y: 35, width: 360, height: 155 },
  },
  {
    id: 'parkir_vip',
    nama: 'Parkir VIP & Gerbang Timur/Utara',
    kategori: 'PARKIR',
    badge: '🚗 Parkir & Akses VIP',
    warna: '#4B5563',
    warnaBg: 'bg-slate-500/20 text-slate-900 border-slate-400',
    deskripsi: 'Area parkir mobil VVIP dan Masyayikh di sisi Timur laut, serta jalur keluar DZ VIP.',
    pintuMasuk: 'Gerbang Timur (Masuk VIP) & Gerbang Utara (Jalur Keluar)',
    fasilitas: 'Petugas keamanan parkir khusus, akses langsung ke Kamar VVIP & Lab',
    kapasitas: '± 40 Kendaraan Roda 4 VIP',
    targetZoom: { scale: 2.3, x: -160, y: -140 },
    svgArea: { x: 125, y: 35, width: 95, height: 160 },
  },
];

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
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [selectedLocId, setSelectedLocId] = useState<string | null>(initialLocationId || null);
  const [viewMode, setViewMode] = useState<'VEKTOR' | 'ARSIP' | 'OVERLAY'>('VEKTOR');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLoc = DAFTAR_LOKASI_DENAH.find((l) => l.id === selectedLocId) || null;

  // Zoom to specific location smoothly
  const handleZoomToLocation = useCallback(
    (loc: LokasiDenah) => {
      setSelectedLocId(loc.id);
      setScale(loc.targetZoom.scale);
      setTranslate({ x: loc.targetZoom.x, y: loc.targetZoom.y });
      if (onSelectLocation) onSelectLocation(loc);
    },
    [onSelectLocation]
  );

  // Reset to full map view
  const handleResetZoom = () => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    setSelectedLocId(null);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.35, 3.8));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.35, 0.9));
  };

  // Drag pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setTranslate({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch pan handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - translate.x,
        y: e.touches[0].clientY - translate.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setTranslate({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.2 : -0.2;
    setScale((prev) => Math.max(0.9, Math.min(3.8, prev + zoomFactor)));
  };

  useEffect(() => {
    if (initialLocationId) {
      const found = DAFTAR_LOKASI_DENAH.find((l) => l.id === initialLocationId);
      if (found) handleZoomToLocation(found);
    }
  }, [initialLocationId, handleZoomToLocation]);

  return (
    <div className={`flex flex-col bg-white rounded-3xl border-2 border-[#8C6A47]/40 shadow-xl overflow-hidden ${className}`}>
      {/* Top Header Bar */}
      <div className="bg-[#FAF7F3] p-4 border-b border-[#D5C4B4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#EFE8E1] border-2 border-[#8C6A47] text-[#8C6A47] flex items-center justify-center shadow-xs">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-serif font-black text-[#422F21] text-base sm:text-lg leading-tight">
                Peta Denah Lapangan Haflah 1448 H / 2027 M
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#8C6A47] text-white uppercase tracking-wider">
                Interaktif Ultra HD
              </span>
            </div>
            <p className="text-xs text-[#7A624E] mt-0.5">
              Klik lokasi pada menu atau peta di bawah untuk <strong>zoom otomatis per area</strong> secara detail &amp; jernih.
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="inline-flex p-1 bg-[#EFE8E1] rounded-2xl border border-[#D5C4B4] text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setViewMode('VEKTOR')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              viewMode === 'VEKTOR'
                ? 'bg-white text-[#8C6A47] shadow-sm border border-[#8C6A47]/30'
                : 'text-[#7A624E] hover:text-[#422F21]'
            }`}
          >
            Vektor Jernih HD
          </button>
          <button
            onClick={() => setViewMode('ARSIP')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              viewMode === 'ARSIP'
                ? 'bg-white text-[#8C6A47] shadow-sm border border-[#8C6A47]/30'
                : 'text-[#7A624E] hover:text-[#422F21]'
            }`}
          >
            Gambar Arsip
          </button>
          <button
            onClick={() => setViewMode('OVERLAY')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              viewMode === 'OVERLAY'
                ? 'bg-white text-[#8C6A47] shadow-sm border border-[#8C6A47]/30'
                : 'text-[#7A624E] hover:text-[#422F21]'
            }`}
          >
            Overlay Keduanya
          </button>
        </div>
      </div>

      {/* QUICK LOCATION PILLS - ZOOM PER LOKASI */}
      <div className="bg-[#FAF7F3]/70 px-4 py-2.5 border-b border-[#D5C4B4]/60 overflow-x-auto no-scrollbar">
        <div className="flex items-center space-x-2 text-xs min-w-max">
          <button
            onClick={handleResetZoom}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition-all ${
              !selectedLocId
                ? 'bg-[#422F21] text-white shadow-xs'
                : 'bg-white text-[#7A624E] hover:bg-[#EFE8E1] border border-[#D5C4B4]'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Lihat Semua (Full)</span>
          </button>

          {DAFTAR_LOKASI_DENAH.map((loc) => {
            const isSelected = selectedLocId === loc.id;
            return (
              <button
                key={loc.id}
                onClick={() => handleZoomToLocation(loc)}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#422F21] text-white shadow-md ring-2 ring-[#8C6A47]/40'
                    : 'bg-white text-[#5C3E28] hover:bg-[#EFE8E1] border border-[#D5C4B4]'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: loc.warna }}
                ></span>
                <span>{loc.badge}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEWPORT AREA MAP CANVAS */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        className="relative flex-1 min-h-[460px] sm:min-h-[560px] max-h-[640px] bg-slate-900 overflow-hidden cursor-grab active:cursor-grabbing select-none"
      >
        {/* SVG & Image Canvas Layer with Transform */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out origin-center"
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          }}
        >
          {/* 1. LAYER GAMBAR ASLI ARSIP (jika mode ARSIP atau OVERLAY) */}
          {(viewMode === 'ARSIP' || viewMode === 'OVERLAY') && (
            <img
              src="/images/denah-haflah-2027.jpg"
              alt="Denah Haflah Asli"
              className={`max-w-none w-[1000px] h-auto object-contain pointer-events-none transition-opacity duration-300 ${
                viewMode === 'OVERLAY' ? 'opacity-35' : 'opacity-100'
              }`}
            />
          )}

          {/* 2. LAYER VEKTOR ULTRA CLEAR BLUEPRINT (jika mode VEKTOR atau OVERLAY) */}
          {(viewMode === 'VEKTOR' || viewMode === 'OVERLAY') && (
            <svg
              viewBox="0 0 1000 700"
              className="w-[1000px] h-[700px] pointer-events-auto bg-[#FBF9F6]"
            >
              {/* Grid Background Pattern */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E6DFD5" strokeWidth="0.8" />
                </pattern>
                {/* Glow Filter for Selected Area */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <rect width="1000" height="700" fill="url(#grid)" />

              {/* BOUNDARY / JALUR LUAR */}
              <rect x="15" y="15" width="970" height="670" fill="none" stroke="#8C6A47" strokeWidth="3" />

              {/* ======================================================== */}
              {/* 1. ZONA ATAS (UTARA / GERBANG TIMUR & PRASMANAN LOBI)   */}
              {/* ======================================================== */}
              {/* Ruang Lab & Basecamp SA */}
              <g
                className="cursor-pointer hover:opacity-90"
                onClick={() => handleZoomToLocation(DAFTAR_LOKASI_DENAH[9])}
              >
                <rect x="25" y="25" width="80" height="90" fill="#E57373" stroke="#B71C1C" strokeWidth="1.5" />
                <text x="65" y="60" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                  RUANG LAB
                </text>
                <text x="65" y="75" textAnchor="middle" fill="#FFEBEE" fontSize="8" fontFamily="sans-serif">
                  Basecamp SA
                </text>
              </g>

              {/* Kantor Pesma & MCK Tamu */}
              <rect x="25" y="118" width="80" height="50" fill="#ECEFF1" stroke="#90A4AE" strokeWidth="1" />
              <text x="65" y="145" textAnchor="middle" fill="#37474F" fontSize="9" fontWeight="bold">KANTOR PESMA</text>
              <rect x="25" y="170" width="80" height="45" fill="#CFD8DC" stroke="#90A4AE" strokeWidth="1" />
              <text x="65" y="195" textAnchor="middle" fill="#263238" fontSize="9" fontWeight="bold">MCK TAMU</text>

              {/* Parkir VIP */}
              <g
                className="cursor-pointer"
                onClick={() => handleZoomToLocation(DAFTAR_LOKASI_DENAH[9])}
              >
                <rect x="110" y="25" width="100" height="120" fill="#ECEFF1" stroke="#78909C" strokeWidth="1.5" strokeDasharray="4 2" />
                <text x="160" y="75" textAnchor="middle" fill="#37474F" fontSize="11" fontWeight="bold">
                  PARKIR MOBIL
                </text>
                <text x="160" y="92" textAnchor="middle" fill="#1E88E5" fontSize="13" fontWeight="black">
                  VVIP
                </text>
              </g>

              {/* Prasmanan Lobi PA & PI */}
              <g
                className="cursor-pointer"
                onClick={() => handleZoomToLocation(DAFTAR_LOKASI_DENAH[8])}
              >
                <rect x="215" y="25" width="360" height="110" fill="#FFF3E0" stroke="#FB8C00" strokeWidth="2" />
                <text x="395" y="55" textAnchor="middle" fill="#E65100" fontSize="13" fontWeight="bold">
                  PRASMANAN LOBI
                </text>
                <line x1="395" y1="25" x2="395" y2="135" stroke="#FFA726" strokeWidth="1.5" strokeDasharray="4 2" />
                <text x="305" y="95" textAnchor="middle" fill="#BF360C" fontSize="16" fontWeight="black">
                  PA (Laki-laki)
                </text>
                <text x="485" y="95" textAnchor="middle" fill="#BF360C" fontSize="16" fontWeight="black">
                  PI (Perempuan)
                </text>
              </g>

              {/* Basecamp Peladen PI, Dekorasi, Lorong */}
              <rect x="635" y="25" width="60" height="110" fill="#BCAAA4" stroke="#6D4C41" strokeWidth="1" />
              <text x="665" y="80" textAnchor="middle" fill="#3E2723" fontSize="9" fontWeight="bold" transform="rotate(-90 665 80)">BASECAMP PI</text>

              {/* ======================================================== */}
              {/* 2. AREA INTI AULA UTAMA & PANGGUNG                       */}
              {/* ======================================================== */}
              {/* Outer Hall Frame */}
              <rect x="220" y="225" width="385" height="425" fill="#FAF8F5" stroke="#422F21" strokeWidth="3" rx="10" />

              {/* PANGGUNG UTAMA */}
              <g
                className="cursor-pointer"
                onClick={() => handleZoomToLocation(DAFTAR_LOKASI_DENAH[0])}
              >
                <rect
                  x="235"
                  y="235"
                  width="355"
                  height="85"
                  fill="#FFF8E7"
                  stroke="#D49B5B"
                  strokeWidth="3"
                  rx="6"
                  filter={selectedLocId === 'panggung' ? 'url(#glow)' : undefined}
                />
                <text x="412" y="275" textAnchor="middle" fill="#543C28" fontSize="16" fontWeight="900" fontFamily="serif">
                  ★ PANGGUNG UTAMA ★
                </text>
                <text x="412" y="295" textAnchor="middle" fill="#8C6A47" fontSize="10" fontWeight="bold">
                  DEWAN MASYAYIKH &amp; KHIDMAH TIKET EMAS
                </text>
              </g>

              {/* VVIP Sofa Putra & Putri */}
              <rect x="290" y="325" width="115" height="30" fill="#EDE7F6" stroke="#7E57C2" strokeWidth="1" />
              <text x="347" y="344" textAnchor="middle" fill="#512DA8" fontSize="9" fontWeight="bold">VVIP PUTRA (SOFA)</text>

              <rect x="415" y="325" width="125" height="30" fill="#FCE4EC" stroke="#EC407A" strokeWidth="1" />
              <text x="477" y="344" textAnchor="middle" fill="#880E4F" fontSize="9" fontWeight="bold">VVIP PUTRI (SOFA)</text>

              {/* VIP Kursi Elephant */}
              <rect x="275" y="360" width="275" height="30" fill="#E8EAF6" stroke="#5C6BC0" strokeWidth="1" />
              <text x="412" y="380" textAnchor="middle" fill="#283593" fontSize="10" fontWeight="bold">VIP (KURSI ELEPHANT)</text>

              {/* ZONA SANTRI TAKHTIMAN BIL GHOIB */}
              <g
                className="cursor-pointer"
                onClick={() => handleZoomToLocation(DAFTAR_LOKASI_DENAH[1])}
              >
                <rect
                  x="340"
                  y="400"
                  width="200"
                  height="50"
                  fill="#D1FAE5"
                  stroke="#059669"
                  strokeWidth="2.5"
                  rx="4"
                  filter={selectedLocId === 'bil_ghoib' ? 'url(#glow)' : undefined}
                />
                <text x="440" y="420" textAnchor="middle" fill="#065F46" fontSize="11" fontWeight="bold">
                  TAKHTIMAN BIL-GHOIBI
                </text>
                <text x="440" y="437" textAnchor="middle" fill="#047857" fontSize="9" fontWeight="semibold">
                  63 Santriwati · Jatah Tiket Emas Panggung ★
                </text>
              </g>

              {/* ZONA SANTRI BIN NADZORI */}
              <g
                className="cursor-pointer"
                onClick={() => handleZoomToLocation(DAFTAR_LOKASI_DENAH[2])}
              >
                <rect
                  x="340"
                  y="460"
                  width="200"
                  height="55"
                  fill="#DBEAFE"
                  stroke="#2563EB"
                  strokeWidth="2"
                  rx="4"
                  filter={selectedLocId === 'bin_nadzori' ? 'url(#glow)' : undefined}
                />
                <text x="440" y="485" textAnchor="middle" fill="#1E40AF" fontSize="11" fontWeight="bold">
                  TAKHTIMAN BIN-NADZORI
                </text>
                <text x="440" y="502" textAnchor="middle" fill="#1D4ED8" fontSize="9">
                  166 Santriwati (Kelas 1 s/d 6)
                </text>
              </g>

              {/* ZONA TAMATAN ALIYAH */}
              <g
                className="cursor-pointer"
                onClick={() => handleZoomToLocation(DAFTAR_LOKASI_DENAH[3])}
              >
                <rect
                  x="340"
                  y="525"
                  width="200"
                  height="75"
                  fill="#FEF3C7"
                  stroke="#D97706"
                  strokeWidth="2"
                  rx="4"
                  filter={selectedLocId === 'tamatan' ? 'url(#glow)' : undefined}
                />
                <text x="440" y="555" textAnchor="middle" fill="#92400E" fontSize="12" fontWeight="bold">
                  TAMATAN ALIYAH
                </text>
                <text x="440" y="572" textAnchor="middle" fill="#B45309" fontSize="9">
                  307 Santriwati · Bagian A.01 s/d B.03
                </text>
              </g>

              {/* Operator Sound / Multimedia */}
              <rect x="480" y="605" width="65" height="35" fill="#FFE082" stroke="#FFB300" strokeWidth="1" />
              <text x="512" y="627" textAnchor="middle" fill="#5D4037" fontSize="8" fontWeight="bold">OPERATOR</text>

              {/* ======================================================== */}
              {/* 3. SAYAP BARAT: WALI SANTRI PUTRA (PA) & TAMU UMUM PA    */}
              {/* ======================================================== */}
              <g
                className="cursor-pointer"
                onClick={() => handleZoomToLocation(DAFTAR_LOKASI_DENAH[4])}
              >
                <rect
                  x="230"
                  y="400"
                  width="100"
                  height="200"
                  fill="#E0E7FF"
                  stroke="#3730A3"
                  strokeWidth="2"
                  rx="4"
                  filter={selectedLocId === 'wali_putra' ? 'url(#glow)' : undefined}
                />
                <text x="280" y="490" textAnchor="middle" fill="#312E81" fontSize="11" fontWeight="bold">
                  WALI SANTRI
                </text>
                <text x="280" y="508" textAnchor="middle" fill="#3730A3" fontSize="12" fontWeight="900">
                  SH (PUTRA)
                </text>
                <text x="280" y="525" textAnchor="middle" fill="#4338CA" fontSize="8">
                  Zona Duduk Laki-laki
                </text>
              </g>

              {/* Tamu Undangan Umum PA */}
              <g
                className="cursor-pointer"
                onClick={() => handleZoomToLocation(DAFTAR_LOKASI_DENAH[6])}
              >
                <rect x="125" y="325" width="85" height="150" fill="#CFD8DC" stroke="#455A64" strokeWidth="1.5" />
                <text x="167" y="390" textAnchor="middle" fill="#263238" fontSize="10" fontWeight="bold">
                  TAMU
                </text>
                <text x="167" y="405" textAnchor="middle" fill="#263238" fontSize="10" fontWeight="bold">
                  UNDANGAN
                </text>
                <text x="167" y="420" textAnchor="middle" fill="#37474F" fontSize="9">
                  UMUM PA
                </text>
              </g>

              {/* Prasmanan SH PA */}
              <g
                className="cursor-pointer"
                onClick={() => handleZoomToLocation(DAFTAR_LOKASI_DENAH[8])}
              >
                <rect x="125" y="500" width="85" height="100" fill="#FFE0B2" stroke="#FB8C00" strokeWidth="1.5" />
                <text x="167" y="545" textAnchor="middle" fill="#E65100" fontSize="10" fontWeight="bold">
                  PRASMANAN
                </text>
                <text x="167" y="560" textAnchor="middle" fill="#BF360C" fontSize="11" fontWeight="black">
                  SH PA
                </text>
              </g>

              {/* ======================================================== */}
              {/* 4. SAYAP TIMUR: WALI SANTRI PUTRI (PI) & TAMU UMUM PI    */}
              {/* ======================================================== */}
              {/* Prasmanan Wali Santri SH PI */}
              <g
                className="cursor-pointer"
                onClick={() => handleZoomToLocation(DAFTAR_LOKASI_DENAH[8])}
              >
                <rect x="635" y="235" width="115" height="100" fill="#FFE0B2" stroke="#FB8C00" strokeWidth="1.5" />
                <text x="692" y="280" textAnchor="middle" fill="#E65100" fontSize="10" fontWeight="bold">
                  PRASMANAN
                </text>
                <text x="692" y="295" textAnchor="middle" fill="#BF360C" fontSize="11" fontWeight="black">
                  WALI SH PI
                </text>
              </g>

              {/* Tamu Undangan Umum PI */}
              <rect x="620" y="350" width="130" height="95" fill="#CFD8DC" stroke="#455A64" strokeWidth="1.5" />
              <text x="685" y="395" textAnchor="middle" fill="#263238" fontSize="10" fontWeight="bold">
                TAMU UNDANGAN UMUM PI
              </text>

              {/* WALI SANTRI SH PUTRI (PI) */}
              <g
                className="cursor-pointer"
                onClick={() => handleZoomToLocation(DAFTAR_LOKASI_DENAH[5])}
              >
                <rect
                  x="620"
                  y="455"
                  width="130"
                  height="185"
                  fill="#FCE7F3"
                  stroke="#DB2777"
                  strokeWidth="2"
                  rx="4"
                  filter={selectedLocId === 'wali_putri' ? 'url(#glow)' : undefined}
                />
                <text x="685" y="535" textAnchor="middle" fill="#9D174D" fontSize="11" fontWeight="bold">
                  WALI SANTRI
                </text>
                <text x="685" y="555" textAnchor="middle" fill="#831843" fontSize="13" fontWeight="900">
                  SH (PUTRI)
                </text>
                <text x="685" y="575" textAnchor="middle" fill="#BE185D" fontSize="9">
                  Zona Perempuan Aula
                </text>
              </g>

              {/* ======================================================== */}
              {/* 5. ZONA SELATAN: GERBANG BOLA DUNIA & JALUR REGISTRASI   */}
              {/* ======================================================== */}
              {/* Area Baris Santri Bawah */}
              <rect x="125" y="650" width="625" height="35" fill="#90A4AE" stroke="#455A64" strokeWidth="1" />
              <text x="437" y="672" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="bold">
                SANTRI (SATIR DOUBLE) · JALUR TAMU UNDANGAN
              </text>

              {/* GERBANG BOLA DUNIA (PINTU MASUK UTAMA) */}
              <g
                className="cursor-pointer"
                onClick={() => handleZoomToLocation(DAFTAR_LOKASI_DENAH[7])}
              >
                <rect
                  x="780"
                  y="620"
                  width="190"
                  height="65"
                  fill="#DCFCE7"
                  stroke="#16A34A"
                  strokeWidth="2.5"
                  rx="6"
                  filter={selectedLocId === 'gerbang_bola_dunia' ? 'url(#glow)' : undefined}
                />
                <circle cx="810" cy="652" r="14" fill="#16A34A" />
                <text x="810" y="657" textAnchor="middle" fill="#FFFFFF" fontSize="14">🌍</text>
                <text x="885" y="646" textAnchor="middle" fill="#14532D" fontSize="11" fontWeight="900">
                  GERBANG BOLA DUNIA
                </text>
                <text x="885" y="662" textAnchor="middle" fill="#15803D" fontSize="8" fontWeight="bold">
                  Pintu Masuk &amp; Scan Presensi QR
                </text>
              </g>

              {/* Orientasi Arah Mata Angin (Kompas) */}
              <g transform="translate(850, 420)">
                <circle cx="25" cy="25" r="22" fill="#FFFFFF" stroke="#8C6A47" strokeWidth="1.5" />
                <path d="M 12 25 L 35 15 L 28 25 L 35 35 Z" fill="#D49B5B" />
                <text x="8" y="29" fill="#8C6A47" fontSize="12" fontWeight="black" fontFamily="sans-serif">U</text>
                <text x="25" y="42" textAnchor="middle" fill="#7A624E" fontSize="7" fontWeight="bold">UTARA</text>
              </g>
            </svg>
          )}
        </div>

        {/* Floating Controls: Zoom In, Zoom Out, Reset, Fullscreen */}
        <div className="absolute right-4 bottom-4 flex flex-col space-y-2 z-20">
          <button
            onClick={handleZoomIn}
            title="Perbesar Denah (+)"
            className="w-10 h-10 rounded-2xl bg-white/95 hover:bg-white text-[#422F21] shadow-lg border border-[#D5C4B4] flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Perkecil Denah (-)"
            className="w-10 h-10 rounded-2xl bg-white/95 hover:bg-white text-[#422F21] shadow-lg border border-[#D5C4B4] flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={handleResetZoom}
            title="Reset Posisi (100%)"
            className="w-10 h-10 rounded-2xl bg-white/95 hover:bg-white text-[#422F21] shadow-lg border border-[#D5C4B4] flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Floating Zoom Level Indicator */}
        <div className="absolute left-4 bottom-4 z-20 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-mono border border-slate-700 flex items-center space-x-2">
          <Navigation className="w-3.5 h-3.5 text-amber-400" />
          <span>Zoom: {Math.round(scale * 100)}%</span>
          {selectedLoc && (
            <span className="text-amber-300 font-bold border-l border-slate-600 pl-2">
              Fokus: {selectedLoc.nama}
            </span>
          )}
        </div>
      </div>

      {/* DETAIL INFO KARTU AREA YANG DI-ZOOM */}
      {selectedLoc ? (
        <div className="bg-[#FAF7F3] p-4 sm:p-5 border-t border-[#D5C4B4] space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black shadow-sm"
                style={{ backgroundColor: selectedLoc.warna }}
              >
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-serif font-black text-base sm:text-lg text-[#422F21]">
                    {selectedLoc.nama}
                  </h3>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${selectedLoc.warnaBg}`}>
                    {selectedLoc.badge}
                  </span>
                </div>
                <p className="text-xs text-[#7A624E] mt-0.5">{selectedLoc.deskripsi}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedLocId(null)}
              className="p-1.5 rounded-xl bg-white hover:bg-[#EFE8E1] text-[#7A624E] border border-[#D5C4B4] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Specs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs pt-1">
            <div className="p-2.5 rounded-xl bg-white border border-[#D5C4B4]">
              <div className="text-[10px] font-bold text-[#7A624E] uppercase">🚪 PINTU MASUK &amp; JALUR</div>
              <div className="font-semibold text-[#422F21] mt-0.5">{selectedLoc.pintuMasuk}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-[#D5C4B4]">
              <div className="text-[10px] font-bold text-[#7A624E] uppercase">✨ FASILITAS &amp; SARANA</div>
              <div className="font-semibold text-[#422F21] mt-0.5 truncate" title={selectedLoc.fasilitas}>
                {selectedLoc.fasilitas}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-[#D5C4B4]">
              <div className="text-[10px] font-bold text-[#7A624E] uppercase">👥 ESTIMASI DAYA TAMPUNG</div>
              <div className="font-semibold text-[#422F21] mt-0.5">{selectedLoc.kapasitas}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#FAF7F3] px-4 py-3 border-t border-[#D5C4B4] text-xs text-[#7A624E] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-[#8C6A47]" />
            <span>
              Tip: Geser/drag peta untuk menjelajah, scroll/pinch untuk zoom, atau klik tombol lokasi di atas.
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#8C6A47]">Aula Utama P3TQ &amp; MHMTQ</span>
        </div>
      )}
    </div>
  );
}
