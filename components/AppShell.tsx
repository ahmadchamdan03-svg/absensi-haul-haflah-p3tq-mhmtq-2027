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
    return <main className="min-h-screen bg-[#FAF7F3]">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-[#FAF7F3] flex">
      {/* Sidebar Navigasi Samping */}
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      {/* Area Konten Utama */}
      <div className="flex-1 flex flex-col min-w-0">
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
