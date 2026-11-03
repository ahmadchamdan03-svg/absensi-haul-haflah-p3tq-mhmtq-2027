'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopHeader from '@/components/TopHeader';
import CanvasRevealMask from '@/components/landing/CanvasRevealMask';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Tutup drawer mobile secara otomatis setiap kali rute berpindah
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Hanya halaman admin/petugas resmi yang menampilkan sidebar dan header navigasi.
  // Semua halaman publik (termasuk /, /u, /u/[token], /beli/..., /denah, /game, dan halaman 404)
  // TIDAK PERNAH menampilkan sidebar admin atau top header panitia.
  const isAdminRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/scan') ||
    pathname.startsWith('/rekon') ||
    pathname.startsWith('/dasbor') ||
    pathname.startsWith('/penerima-tamu') ||
    pathname.startsWith('/pimpinan');

  if (!isAdminRoute) {
    return (
      <main className="min-h-screen relative overflow-x-hidden">
        {/* Subtle Ambient Orbs for Glass Refraction (FIX 1 & FIX 3) */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
          <div className="absolute top-10 left-1/4 w-[480px] h-[480px] rounded-full bg-gradient-to-br from-[#D49B5B]/30 to-amber-300/20 blur-[100px]" />
          <div className="absolute top-1/2 -left-20 w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-[#8C6A47]/25 to-[#D49B5B]/20 blur-[90px]" />
          <div className="absolute bottom-10 right-10 w-[520px] h-[520px] rounded-full bg-gradient-to-tl from-[#D49B5B]/25 via-amber-200/20 to-transparent blur-[110px]" />
        </div>
        <div className="relative z-10">{children}</div>
      </main>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-transparent relative z-0">
      {/* EFEK INTERAKTIF CANVAS REVEAL MASK (RIAK AIR PANGGUNG) */}
      <CanvasRevealMask />

      {/* Sidebar Navigasi Samping */}
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      {/* Area Konten Utama */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative z-10 overflow-hidden">
        {/* Top Header Bersih & Ringkas */}
        <TopHeader onOpenMobile={() => setMobileOpen(true)} />

        {/* Isi Halaman Panitia */}
        <main className="flex-1 h-full min-h-0 overflow-y-auto relative">
          {children}
        </main>
      </div>
    </div>
  );
}
