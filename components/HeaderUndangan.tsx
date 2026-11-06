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
    <div className={`text-center space-y-1.5 sm:space-y-2 px-2 sm:px-4 py-0.5 sm:py-1 relative select-none ${className}`}>
      {/* 1. 3 LOGO RESMI DI PALING ATAS - LOGO TENGAH DIPERBESAR PROPORSIONAL & SEIMBANG */}
      <div className="flex items-center justify-center gap-2.5 sm:gap-4 mb-1.5 sm:mb-2">
        <img
          src="/images/logo-p3tq.png"
          alt="Logo P3TQ"
          className="h-8 sm:h-9 md:h-10 w-auto max-h-10 object-contain drop-shadow-md brightness-105"
        />
        <img
          src="/images/logo-haul-white.png"
          alt="Logo Haul & Haflah"
          className="h-12 sm:h-16 md:h-18 w-auto max-h-18 object-contain drop-shadow-[0_4px_12px_rgba(251,191,36,0.35)]"
        />
        <img
          src="/images/logo-mhmtq.png"
          alt="Logo MHMTQ"
          className="h-8 sm:h-9 md:h-10 w-auto max-h-10 object-contain drop-shadow-md brightness-105"
        />
      </div>

      {/* 2. BARIS 1 — TIPE UNDANGAN (EMAS ELEGAN) */}
      <p className={`text-[10px] sm:text-[11px] font-serif font-black tracking-[0.25em] sm:tracking-[0.3em] uppercase text-center ${
        isDark ? 'text-amber-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]' : 'text-[#1D4ED8]'
      }`}>
        {titleType}
      </p>

      {/* 3. BARIS 2 — JUDUL UTAMA (EMAS BERKILAU DENGAN DROP SHADOW TIPIS) */}
      <h1 className={`text-base sm:text-xl md:text-2xl font-serif font-bold leading-tight text-center break-words max-w-full mx-auto mt-0.5 sm:mt-1 px-1 ${
        isDark ? 'text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.35)]' : 'text-[#0F2C59]'
      }`}>
        <span className="inline-block">Haul &amp; Haflah</span>{' '}
        <span className="inline-block">Akhirussanah</span>
      </h1>

      {/* 4. BARIS 3 — TAHUN (PUTIH / EMAS MUDA) */}
      <p className={`text-[11px] sm:text-xs md:text-sm font-serif font-medium text-center mt-0.5 ${
        isDark ? 'text-amber-200/95 drop-shadow-xs' : 'text-[#0F2C59]'
      }`}>
        1448 H. / 2027 M.
      </p>

      {/* 5. BLOK NAMA LEMBAGA (PUTIH BERSIH & EMAS) */}
      <div className={`w-full max-w-none md:max-w-2xl text-[9.5px] sm:text-[10.5px] leading-tight space-y-0.5 mt-1 sm:mt-1.5 text-center font-serif mx-auto px-1 ${
        isDark ? 'text-white font-bold drop-shadow-md' : 'text-[#7A624E]'
      }`}>
        <p className="whitespace-nowrap text-[9.5px] sm:text-[10.5px]">
          Pondok Pesantren Putri Tahfizhil Qur-an (P3TQ)
        </p>
        <p className="whitespace-nowrap text-[8.5px] sm:text-[9.5px] tracking-tight">
          Madrasah Hidayatul Mubtadi-aat Fittahfizhi Wal Qiro-at (MHMTQ)
        </p>
        <p className={`text-[9.5px] sm:text-[10.5px] pt-0.5 ${
          isDark ? 'text-amber-400 italic' : 'text-[#1D4ED8] font-semibold'
        }`}>
          Lirboyo Kediri
        </p>
      </div>
    </div>
  );
}

export default HeaderUndangan;
