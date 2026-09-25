'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Sparkles,
  QrCode,
  LayoutDashboard,
  Calendar,
} from 'lucide-react';

interface TopHeaderProps {
  onOpenMobile: () => void;
}

export default function TopHeader({ onOpenMobile }: TopHeaderProps) {
  const pathname = usePathname();

  // Helper untuk menentukan judul dan breadcrumb berdasarkan pathname
  const getPageInfo = () => {
    if (pathname === '/') {
      return { title: 'Beranda Panitia', category: 'Haul & Haflah P3TQ & MHMTQ 2027' };
    }
    if (pathname === '/admin/dasbor') {
      return { title: 'Live Dasbor Kedatangan', category: 'Monitoring Realtime' };
    }
    if (pathname === '/scan') {
      return { title: 'Scanner QR Gerbang', category: 'Operasional Masuk' };
    }
    if (pathname === '/admin/verifikasi') {
      return { title: 'Verifikasi Manual Gerbang', category: 'Operasional Masuk' };
    }
    if (pathname === '/admin/peserta') {
      return { title: 'Data Peserta & Tamu VIP', category: 'Master Data' };
    }
    if (pathname === '/admin/konfirmasi') {
      return { title: 'Monitoring Konfirmasi Kehadiran', category: 'Pra-Acara & Konsumsi' };
    }
    if (pathname === '/admin/whatsapp') {
      return { title: 'WhatsApp Gateway & Fonnte', category: 'Otomatisasi Pesan' };
    }
    if (pathname === '/rekon') {
      return { title: 'Rekonsiliasi Kuota', category: 'Audit & Penyesuaian' };
    }
    if (pathname === '/admin/laporan') {
      return { title: 'Rekapitulasi & Ekspor', category: 'Pelaporan Resmi' };
    }
    return { title: 'Panel Panitia', category: 'Sistem Haul-Haflah' };
  };

  const pageInfo = getPageInfo();

  return (
    <header className="h-16 sm:h-[72px] sticky top-0 z-20 bg-[#FAF7F3]/95 backdrop-blur-md border-b-2 border-[#D5C4B4] text-[#422F21] px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 no-print select-none">
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
        {/* Tombol Hamburger di HP/Tablet */}
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-xl bg-white border border-[#D5C4B4] text-[#8C6A47] hover:bg-[#EFE8E1] transition-colors shrink-0"
          aria-label="Buka Menu Navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb & Judul Halaman */}
        <div className="min-w-0">
          <div className="hidden sm:flex items-center space-x-1.5 text-[11px] text-[#8C6A47] font-semibold tracking-wide truncate">
            <span>{pageInfo.category}</span>
            <span>/</span>
            <span className="text-[#422F21] font-bold">{pageInfo.title}</span>
          </div>
          <h2 className="text-sm sm:text-lg font-serif font-black text-[#422F21] leading-tight truncate">
            {pageInfo.title}
          </h2>
        </div>
      </div>

      {/* Sisi Kanan: Badge Tanggal Acara & Pintasan Aksi Cepat */}
      <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
        {/* Info Tanggal Acara */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-2xl bg-[#EFE8E1] border border-[#D5C4B4] text-xs font-semibold text-[#5C3E28]">
          <Calendar className="w-3.5 h-3.5 text-[#8C6A47]" />
          <span>Sabtu, 02 Jan 2027 · 24 Rajab 1448 H</span>
        </div>

        {/* Pintasan Aksi Cepat: Tanya Us AI */}
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('open-tanya-us'));
            }
          }}
          className="inline-flex items-center space-x-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl bg-amber-50 hover:bg-amber-100 text-[#735334] text-xs font-bold shadow-2xs transition-all border border-amber-300"
          title="Tanya Us AI (Asisten Haflah)"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          <span className="text-[11px] sm:text-xs">Tanya Us</span>
        </button>

        {/* Pintasan Aksi Cepat: Scanner Gerbang */}
        <Link
          href="/scan"
          className="inline-flex items-center justify-center p-2 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl bg-[#8C6A47] hover:bg-[#735334] text-white text-xs font-bold shadow-2xs transition-all border border-[#735334]"
          title="Buka Scanner QR Gerbang Masuk"
        >
          <QrCode className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-amber-200" />
          <span className="hidden md:inline ml-1.5">Scan Gerbang</span>
        </Link>

        {/* Pintasan Aksi Cepat: Live Dasbor */}
        <Link
          href="/admin/dasbor"
          className="inline-flex items-center justify-center p-2 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl bg-white hover:bg-[#FAF7F3] text-[#8C6A47] text-xs font-bold shadow-2xs transition-all border-2 border-[#D5C4B4]"
          title="Buka Live Dasbor Kedatangan"
        >
          <LayoutDashboard className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-[#8C6A47]" />
          <span className="hidden md:inline ml-1.5">Live Dasbor</span>
        </Link>
      </div>
    </header>
  );
}
