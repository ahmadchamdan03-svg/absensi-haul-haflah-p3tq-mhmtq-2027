'use client';

import { useEffect } from 'react';

interface Props {
  userName: string;
  onClose: () => void;
}

export function WelcomePopup({ userName, onClose }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Foto Usth. Halwaa — 95% terlihat */}
        <div className="relative z-0 w-full max-w-xs md:max-w-sm h-56 md:h-72 -mb-4 md:-mb-6 pointer-events-none">
          <img
            src="/images/halwaa/selamat-datang.webp"
            alt="Usth. Halwaa"
            className="w-full h-full object-contain object-bottom drop-shadow-xl"
          />
        </div>

        {/* Kotak Putih */}
        <div className="relative z-10 bg-white rounded-2xl shadow-2xl border border-amber-200 p-5 md:p-6 w-full max-w-xs md:max-w-sm text-center">
          <p className="text-base md:text-lg font-semibold text-[#422F21] mb-3">
            Selamat datang di dasbor,
            <br />
            <span className="text-amber-700 font-bold">{userName}</span>
          </p>

          <p className="text-sm md:text-base tracking-[0.2em] text-[#8C6A47] uppercase mb-3">
            ✦ HAFLAH AKHIRUSSANAH ✦
          </p>

          <div className="text-xs md:text-sm font-serif text-[#422F21] leading-relaxed space-y-1">
            <p>Pondok Pesantren Putri Tahfizhil Qur-an (P3TQ)</p>
            <p>Madrasah Hidayatul Mubtadi-aat Fittahfizhi Wal Qiro-at (MHMTQ)</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-[#8C6A47] text-white rounded-lg text-sm hover:bg-[#7a5a3b] transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

export default WelcomePopup;
