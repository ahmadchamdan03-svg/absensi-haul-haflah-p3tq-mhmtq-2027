'use client';

import React from 'react';

interface HeaderUndanganProps {
  titleType?: string;
  className?: string;
  variant?: 'dark' | 'light';
}

export function HeaderUndangan({
  titleType = 'UNDANGAN RESMI',
  className = '',
  variant = 'dark',
}: HeaderUndanganProps) {
  const isDark = variant === 'dark';

  return (
    <div className={`text-center space-y-2 sm:space-y-2.5 px-2 sm:px-4 py-1 relative select-none ${className}`}>
      {/* 1. 3 LOGO RESMI DI PALING ATAS - LOGO TENGAH DIPERBESAR PROPORSIONAL & SEIMBANG */}
      <div className="flex items-center justify-center gap-3 sm:gap-5 mb-2 sm:mb-3">
        <img
          src="/images/logo-p3tq.png"
          alt="Logo P3TQ"
          className="h-10 sm:h-12 md:h-14 object-contain drop-shadow-md brightness-105"
        />
        <img
          src="/logo-haul-haflah-transparent.png"
          alt="Logo Haul & Haflah"
          className="h-16 sm:h-20 md:h-24 scale-105 sm:scale-115 object-contain drop-shadow-[0_4px_12px_rgba(251,191,36,0.35)]"
        />
        <img
          src="/images/logo-mhmtq.png"
          alt="Logo MHMTQ"
          className="h-10 sm:h-12 md:h-14 object-contain drop-shadow-md brightness-105"
        />
      </div>

      {/* 2. BARIS 1 — TIPE UNDANGAN (EMAS ELEGAN) */}
      <p className={`text-[11px] sm:text-xs font-serif font-black tracking-[0.25em] sm:tracking-[0.3em] uppercase text-center ${
        isDark ? 'text-amber-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]' : 'text-[#1D4ED8]'
      }`}>
        {titleType}
      </p>

      {/* 3. BARIS 2 — JUDUL UTAMA (EMAS BERKILAU DENGAN DROP SHADOW TIPIS) */}
      <h1 className={`text-lg sm:text-2xl md:text-3xl font-serif font-black leading-tight text-center break-words max-w-full mx-auto mt-1 sm:mt-2 px-1 ${
        isDark ? 'text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.35)]' : 'text-[#0F2C59]'
      }`}>
        <span className="inline-block">Haul &amp; Haflah</span>{' '}
        <span className="inline-block">Akhirussanah</span>
      </h1>

      {/* 4. BARIS 3 — TAHUN (PUTIH / EMAS MUDA) */}
      <p className={`text-xs sm:text-sm md:text-base font-serif font-medium text-center mt-0.5 sm:mt-1 ${
        isDark ? 'text-amber-200/95 drop-shadow-xs' : 'text-[#0F2C59]'
      }`}>
        1448 H. / 2027 M.
      </p>

      {/* 5. BLOK NAMA LEMBAGA (PUTIH BERSIH & EMAS) */}
      <div className={`w-full max-w-none md:max-w-2xl text-[11px] sm:text-xs leading-relaxed space-y-0.5 mt-2 sm:mt-2.5 text-center font-serif italic mx-auto px-1 ${
        isDark ? 'text-white/85 drop-shadow-xs' : 'text-[#7A624E]'
      }`}>
        <p className="whitespace-nowrap text-[10px] sm:text-xs">
          Pondok Pesantren Putri Tahfizhil Qur-an (P3TQ)
        </p>
        <p className="whitespace-nowrap text-[9px] sm:text-[11px] tracking-tight sm:tracking-normal">
          Madrasah Hidayatul Mubtadi-aat Fittahfizhi Wal Qiro-at (MHMTQ)
        </p>
        <p className={`font-semibold not-italic text-[11px] sm:text-xs pt-0.5 ${
          isDark ? 'text-amber-300 font-bold' : 'text-[#1D4ED8]'
        }`}>
          Lirboyo Kediri
        </p>
      </div>
    </div>
  );
}

export default HeaderUndangan;
