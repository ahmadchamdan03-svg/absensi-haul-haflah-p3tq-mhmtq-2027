'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopHeader from '@/components/TopHeader';

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
    pathname.startsWith('/dasbor');

  if (!isAdminRoute) {
    return (
      <main className="min-h-screen relative overflow-x-hidden">
        {/* Subtle Ambient Orbs for Glass Refraction (FIX 1) */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#D49B5B]/15 blur-3xl" />
          <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-[#8C6A47]/10 blur-3xl" />
          <div className="absolute -bottom-32 left-1/4 w-96 h-96 rounded-full bg-[#D49B5B]/12 blur-3xl" />
        </div>
        <div className="relative z-10">{children}</div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F3] glass-ambient-bg flex relative overflow-x-hidden">
      {/* Subtle Ambient Orbs for Glass Refraction (FIX 1) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#D49B5B]/15 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-[#8C6A47]/10 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 w-96 h-96 rounded-full bg-[#D49B5B]/12 blur-3xl" />
      </div>

      {/* Sidebar Navigasi Samping */}
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      {/* Area Konten Utama */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Top Header Bersih & Ringkas */}
        <TopHeader onOpenMobile={() => setMobileOpen(true)} />

        {/* Isi Halaman Panitia */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
