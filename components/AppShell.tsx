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

  // Halaman publik wali santri (portal undangan / beli kuota tambahan) tidak menggunakan sidebar panitia
  const isPublicPage = pathname.startsWith('/u/') || pathname.startsWith('/beli/');

  if (isPublicPage) {
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
