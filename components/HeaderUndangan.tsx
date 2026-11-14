'use client';

import React from 'react';

interface HeaderUndanganProps {
  titleType?: string;
  className?: string;
  variant?: 'dark' | 'light';
  compact?: boolean;
}

export function HeaderUndangan({
  titleType = 'UNDANGAN RESMI',
  className = '',
  variant = 'dark',
  compact = false,
}: HeaderUndanganProps) {
  const isDark = variant === 'dark';

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact
          ? 'gap-1.5 sm:gap-2 lg:gap-1 px-3 sm:px-4 py-1 lg:py-0'
          : 'gap-1.5 sm:gap-2 px-3 sm:px-4 py-1'
      } relative select-none z-20 ${className}`}
    >
      {/* 1. 3 LOGO RESMI DI PALING ATAS - LOGO TENGAH DIPERBESAR PROPORSIONAL & SEIMBANG */}
      <div
        className={`flex items-center justify-center gap-2.5 sm:gap-4 ${
          compact ? 'mb-0.5 sm:mb-1 lg:mb-0.5' : 'mb-0.5 sm:mb-1'
        }`}
      >
        <img
          src="/images/logo-p3tq.png"
          alt="Logo P3TQ"
          className={`${
            compact ? 'h-8 sm:h-9 md:h-10 lg:h-8' : 'h-8 sm:h-9 md:h-10'
          } w-auto max-h-10 object-contain drop-shadow-md brightness-105`}
        />
        <img
          src="/images/logo-haul-white.png"
          alt="Logo Haul & Haflah"
          className={`${
            compact ? 'h-12 sm:h-14 md:h-16 lg:h-11' : 'h-12 sm:h-14 md:h-16'
          } w-auto max-h-16 object-contain drop-shadow-[0_4px_12px_rgba(251,191,36,0.35)]`}
        />
        <img
          src="/images/logo-mhmtq.png"
          alt="Logo MHMTQ"
          className={`${
            compact ? 'h-8 sm:h-9 md:h-10 lg:h-8' : 'h-8 sm:h-9 md:h-10'
          } w-auto max-h-10 object-contain drop-shadow-md brightness-105`}
        />
      </div>

      {/* 2. BARIS 1 : TIPE UNDANGAN (EMAS ELEGAN) */}
      <p
        className={`${
          compact ? 'text-[10px] sm:text-[11px] lg:text-[10px]' : 'text-[10px] sm:text-[11px]'
        } font-serif font-black tracking-[0.25em] sm:tracking-[0.3em] uppercase text-center ${
          isDark ? 'text-amber-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]' : 'text-[#1D4ED8]'
        }`}
      >
        {titleType}
      </p>

      {/* 3. BARIS 2 : JUDUL UTAMA (LEBIH BESAR, ELEGAN, WRAP RAPI DI HP) */}
      <h1
        className={`${
          compact
            ? 'text-2xl sm:text-3xl lg:text-2xl leading-tight sm:leading-snug lg:leading-tight'
            : 'text-2xl sm:text-3xl leading-tight sm:leading-snug'
        } font-serif font-black text-center whitespace-normal break-words max-w-full mx-auto px-1 ${
          isDark ? 'text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.35)]' : 'text-[#0F2C59]'
        }`}
      >
        Haul &amp; Haflah Akhirussanah
      </h1>

      {/* 4. BARIS 3 : TAHUN (PUTIH / EMAS MUDA) */}
      <p
        className={`${
          compact ? 'text-xs sm:text-sm lg:text-xs' : 'text-xs sm:text-sm'
        } font-serif font-medium text-center ${
          isDark ? 'text-amber-200/95 drop-shadow-xs' : 'text-[#0F2C59]'
        }`}
      >
        1448 H. / 2027 M.
      </p>

      {/* 5. BLOK NAMA LEMBAGA (TEKS INSTANSI PROPORSIONAL, TIDAK OVERFLOW) */}
      <div
        className={`w-full max-w-sm sm:max-w-md ${
          compact
            ? 'text-xs sm:text-sm lg:text-xs leading-snug lg:leading-tight space-y-0.5 lg:space-y-0'
            : 'text-xs sm:text-sm leading-snug space-y-0.5'
        } text-center font-serif mx-auto px-2 ${
          isDark ? 'text-white font-medium drop-shadow-md' : 'text-[#7A624E]'
        }`}
      >
        <p className="whitespace-normal">
          Pondok Pesantren Putri Tahfizhil Qur-an (P3TQ)
        </p>
        <p
          className={`whitespace-normal ${
            compact ? 'text-[11px] sm:text-xs lg:text-[11px]' : 'text-[11px] sm:text-xs'
          } text-white/90`}
        >
          Madrasah Hidayatul Mubtadi-aat Fittahfizhi Wal Qiro-at (MHMTQ)
        </p>
        <p
          className={`${
            compact ? 'text-xs sm:text-sm lg:text-xs pt-0.5 lg:pt-0' : 'text-xs sm:text-sm pt-0.5'
          } ${
            isDark ? 'text-amber-400 italic font-semibold' : 'text-[#1D4ED8] font-semibold'
          }`}
        >
          Lirboyo Kediri
        </p>
      </div>
    </div>
  );
}

export default HeaderUndangan;
