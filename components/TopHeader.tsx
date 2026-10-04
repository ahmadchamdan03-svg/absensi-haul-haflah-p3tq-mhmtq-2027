'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clearActiveRole } from '@/lib/auth-roles';
import {
  Menu,
  LogOut,
  QrCode,
  LayoutDashboard,
  Calendar,
} from 'lucide-react';

interface TopHeaderProps {
  onOpenMobile: () => void;
}

export default function TopHeader({ onOpenMobile }: TopHeaderProps) {
  const router = useRouter();

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

        {/* Logo Haul Haflah (Menggantikan Breadcrumb & Judul Halaman) */}
        <Link href="/admin/dasbor" className="min-w-0 shrink-0 block group cursor-pointer" title="Kembali ke Dasbor Admin">
          <img
            src="/images/logo-haul-gold.png"
            alt="Logo Haul &amp; Haflah P3TQ MHMTQ"
            className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </Link>
      </div>

      {/* Sisi Kanan: Badge Tanggal Acara & Pintasan Aksi Cepat */}
      <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
        {/* Info Tanggal Acara */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-2xl bg-[#EFE8E1] border border-[#D5C4B4] text-xs font-semibold text-[#5C3E28]">
          <Calendar className="w-3.5 h-3.5 text-[#8C6A47]" />
          <span>Sabtu, 24 Rajab 1448 H. / 02 Jan 2027 M.</span>
        </div>

        {/* Pintasan Aksi Cepat: Scanner Gerbang */}
        <Link
          href="/scan"
          className="btn-transition inline-flex items-center justify-center p-2 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl bg-[#8C6A47] hover:bg-[#735334] text-white text-xs font-bold shadow-2xs border border-[#735334]"
          title="Buka Scanner QR Gerbang Masuk"
        >
          <QrCode className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-amber-200" />
          <span className="hidden md:inline ml-1.5">Scan Gerbang</span>
        </Link>

        {/* Pintasan Aksi Cepat: Live Dasbor */}
        <Link
          href="/admin/dasbor"
          className="btn-transition inline-flex items-center justify-center p-2 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl bg-white hover:bg-[#FAF7F3] text-[#8C6A47] text-xs font-bold shadow-2xs border-2 border-[#D5C4B4]"
          title="Buka Live Dasbor Kedatangan"
        >
          <LayoutDashboard className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-[#8C6A47]" />
          <span className="hidden md:inline ml-1.5">Live Dasbor</span>
        </Link>

        {/* Tombol Keluar Sesi (paling kanan) */}
        <button
          type="button"
          onClick={() => { clearActiveRole(); router.replace('/'); }}
          className="btn-transition inline-flex items-center space-x-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold shadow-2xs border border-rose-200 cursor-pointer"
          title="Keluar dari sesi dan kembali ke halaman login"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-600" />
          <span className="text-[11px] sm:text-xs">Keluar</span>
        </button>
      </div>
    </header>
  );
}
