'use client';

import React from 'react';

interface HeaderUndanganProps {
  titleType?: string;
  className?: string;
}

export function HeaderUndangan({
  titleType = 'UNDANGAN RESMI',
  className = '',
}: HeaderUndanganProps) {
  return (
    <div className={`text-center space-y-2.5 sm:space-y-3 px-2 sm:px-4 py-2 relative select-none ${className}`}>
      {/* 1. 3 LOGO RESMI DI PALING ATAS */}
      <div className="flex items-center justify-center gap-3 sm:gap-6 mb-2 sm:mb-3">
        <img
          src="/images/logo-p3tq.png"
          alt="Logo P3TQ"
          className="h-12 sm:h-16 md:h-18 object-contain drop-shadow-xs"
        />
        <img
          src="/logo-haul-haflah-transparent.png"
          alt="Logo Haul & Haflah"
          className="h-14 sm:h-18 md:h-20 object-contain drop-shadow-xs"
        />
        <img
          src="/images/logo-mhmtq.png"
          alt="Logo MHMTQ"
          className="h-12 sm:h-16 md:h-18 object-contain drop-shadow-xs"
        />
      </div>

      {/* 2. BARIS 1 — TIPE UNDANGAN */}
      <p className="text-xs sm:text-sm font-serif font-black tracking-[0.25em] sm:tracking-[0.3em] uppercase text-[#8C6A47] text-center">
        {titleType}
      </p>

      {/* 3. BARIS 2 — JUDUL UTAMA (1 BARIS RAPI, TIDAK WRAP) */}
      <h1 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-serif font-bold text-[#422F21] leading-snug text-center whitespace-nowrap mt-2 sm:mt-3">
        Haul &amp; Haflah Akhirussanah
      </h1>

      {/* 4. BARIS 3 — TAHUN (BARIS TERPISAH) */}
      <p className="text-sm sm:text-base md:text-lg font-serif text-[#422F21] font-medium text-center mt-1 sm:mt-2">
        1448 H. / 2027 M.
      </p>

      {/* 5. BLOK NAMA LEMBAGA (RAPI & PROPORSIAL) */}
      <div className="text-xs sm:text-sm text-[#7A624E] leading-relaxed space-y-0.5 mt-3 sm:mt-4 text-center font-serif italic max-w-md mx-auto">
        <p>Pondok Pesantren Putri Tahfizhil Qur-an (P3TQ)</p>
        <p>Madrasah Hidayatul Mubtadi-aat Fittahfizhi Wal Qiro-at (MHMTQ)</p>
        <p className="font-semibold text-[#8C6A47] not-italic text-xs sm:text-sm pt-1">
          Lirboyo Kediri
        </p>
      </div>
    </div>
  );
}

export default HeaderUndangan;
