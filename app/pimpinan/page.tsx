'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
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
      <div className="w-full min-h-screen bg-transparent text-[#0F2C59] pb-24 relative">
        {/* Tombol Keluar Sesi Melayang Elegan di Sudut Kanan Atas */}
        <div className="fixed top-6 right-6 z-40">
          <button
            type="button"
            onClick={handleLogout}
            className="p-2 sm:px-3.5 sm:py-2 rounded-2xl bg-white/70 hover:bg-white/95 text-stone-700 border border-white/80 shadow-md backdrop-blur-md flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="Keluar Sesi"
          >
            <LogOut className="w-4 h-4 text-stone-500" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>

        {/* KONTEN UTAMA: LIVE DASBOR FULLSCREEN / KIOSK (MODE PIMPINAN) */}
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
          <LiveDasbor isPimpinanView={true} />
        </main>

        {/* FLOATING ACTION BUTTON (FAB) USTH. HALWAA */}
        <button
          type="button"
          onClick={() => setIsUsModalOpen(true)}
          className="fixed bottom-8 right-8 z-50 flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-3 rounded-full shadow-2xl transition-all duration-300 group cursor-pointer hover:scale-105 active:scale-95"
          title="Tanya Usth. Halwaa"
          aria-label="Tanya Usth. Halwaa"
        >
          <div className="w-7 h-7 rounded-full overflow-hidden border border-sky-200/60 shadow-xs shrink-0 bg-[#F0F9FF]">
            <img
              src="/images/avatar/ustadzah-avatar-wave.png"
              alt="Usth. Halwaa"
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
            />
          </div>
          <span className="font-bold text-sm tracking-wide">Tanya Usth. Halwaa</span>
        </button>

        <TanyaUsModal isOpen={isUsModalOpen} onClose={() => setIsUsModalOpen(false)} />
      </div>
    </AuthGuard>
  );
}
