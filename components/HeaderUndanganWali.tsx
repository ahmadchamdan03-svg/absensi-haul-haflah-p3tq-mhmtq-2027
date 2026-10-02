'use client';

import React from 'react';
import { Great_Vibes } from 'next/font/google';

const greatVibes = Great_Vibes({ weight: '400', subsets: ['latin'] });

export function HeaderUndanganWali() {
  return (
    <div className="text-center space-y-4 py-4 px-2 relative">
      {/* 3 LOGO RESMI DI PALING ATAS */}
      <div className="flex items-center justify-center gap-3 sm:gap-6 my-2">
        <img
          src="/images/logo-p3tq.png"
          alt="Logo P3TQ"
          className="h-12 sm:h-16 object-contain drop-shadow-xs"
        />
        <img
          src="/logo-haul-haflah-transparent.png"
          alt="Logo Haul & Haflah"
          className="h-14 sm:h-18 object-contain drop-shadow-xs"
        />
        <img
          src="/images/logo-mhmtq.png"
          alt="Logo MHMTQ"
          className="h-12 sm:h-16 object-contain drop-shadow-xs"
        />
      </div>

      {/* HAFLAH + Akhirussanah OVERLAP TITLE */}
      <div className="relative inline-block my-2">
        {/* SPARKLE ORNAMEN HALUS SISI KIRI-KANAN */}
        <span className="absolute -left-6 sm:-left-10 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-[#D49B5B]/60 select-none">
          ✨
        </span>
        <span className="absolute -right-6 sm:-right-10 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-[#D49B5B]/60 select-none">
          ✨
        </span>

        <h1 className="font-serif font-black text-3xl sm:text-5xl text-[#422F21] tracking-[0.25em] uppercase leading-none">
          HAFLAH
        </h1>
        <div
          className={`${greatVibes.className} text-3xl sm:text-5xl text-[#D49B5B] -mt-3 sm:-mt-5 font-normal tracking-wide transform -rotate-2 select-none drop-shadow-xs`}
        >
          Akhirussanah
        </div>
      </div>

      {/* ARABIC CALLIGRAPHY LOGO CENTER */}
      <div className="flex justify-center my-2">
        <img
          src="/images/logo-haul-gold.png"
          alt="Calligraphy Haul & Haflah"
          className="h-16 sm:h-20 object-contain drop-shadow-sm"
        />
      </div>

      {/* SUBTITLE ALL-CAPS */}
      <div className="font-serif font-black text-xs sm:text-sm text-[#8C6A47] tracking-[0.25em] uppercase">
        HAFLAH AKHIRUSSANAH
      </div>

      {/* 4 BARIS DESKRIPSI LEMBAGA */}
      <div className="font-serif italic text-xs sm:text-sm text-[#7A624E] leading-relaxed max-w-md mx-auto space-y-0.5">
        <p>Takhtiman - Tamatan Pondok Pesantren</p>
        <p>Putri Tahfizhil Qur-an</p>
        <p>Madrasah Hidayatul Mubtadi-aat</p>
        <p>Fittahfizhi Wal Qiro-at</p>
        <p className="font-semibold text-[#8C6A47] not-italic text-xs pt-1">
          Lirboyo Kota Kediri
        </p>
      </div>
    </div>
  );
}

export default HeaderUndanganWali;
