'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HelpCircle, LogOut, Calendar } from 'lucide-react';
import { clearActiveRole } from '@/lib/auth-roles';
import TanyaUsModal from '@/components/TanyaUsModal';
import AuthGuard from '@/components/AuthGuard';
import LiveDasbor from '@/components/LiveDasbor';

export default function PimpinanPage() {
  const router = useRouter();
  const [isUsModalOpen, setIsUsModalOpen] = useState(false);

  const handleLogout = () => {
    clearActiveRole();
    router.push('/');
  };

  return (
    <AuthGuard allowedRoles={['PIMPINAN', 'ADMIN']}>
      <div className="min-h-screen bg-[#FAF7F3] text-[#422F21] pb-24">
        {/* HEADER KHUSUS AKUN PIMPINAN */}
        <header className="border-b-2 border-[#D5C4B4] bg-[#FAF7F3]/95 backdrop-blur-md sticky top-0 z-20 px-4 py-3 sm:py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            {/* SISI KIRI: LOGO HAUL HAFLAH */}
            <div className="flex items-center space-x-3">
              <img
                src="/images/logo-haul-gold.png"
                alt="Logo Haul &amp; Haflah P3TQ MHMTQ"
                className="h-10 sm:h-12 w-auto object-contain"
              />
            </div>

            {/* SISI KANAN: TANGGAL, TANYA US AI, KELUAR */}
            <div className="flex items-center space-x-2">
              <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-2xl bg-[#EFE8E1] border border-[#D5C4B4] text-xs font-semibold text-[#5C3E28]">
                <Calendar className="w-3.5 h-3.5 text-[#8C6A47]" />
                <span>Sabtu, 02 Jan 2027 · 24 Rajab 1448 H</span>
              </div>
              <button
                type="button"
                onClick={() => setIsUsModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 hover:brightness-105 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-200" />
                <span>Tanya Us AI</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 text-xs font-bold shadow-2xs flex items-center space-x-1.5 transition-all cursor-pointer"
                title="Keluar Sesi"
              >
                <LogOut className="w-3.5 h-3.5 text-stone-500" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </header>

        {/* KONTEN UTAMA: IDENTIK DENGAN LIVE DASBOR (MODE PIMPINAN) */}
        <main className="max-w-6xl mx-auto px-4 py-6">
          <LiveDasbor isPimpinanView={true} />
        </main>

        <TanyaUsModal isOpen={isUsModalOpen} onClose={() => setIsUsModalOpen(false)} />
      </div>
    </AuthGuard>
  );
}
