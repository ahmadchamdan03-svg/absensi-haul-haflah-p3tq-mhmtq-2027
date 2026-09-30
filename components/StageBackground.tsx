'use client';

import { useState, useEffect } from 'react';

export default function StageBackground() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Jumlah partikel: 12 untuk mobile, 36 untuk desktop
  const particleCount = isMobile ? 12 : 36;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* 1. FOTO PANGGUNG MEGAH (FULL SCREEN BACKGROUND) */}
      <div 
        className="absolute inset-0 bg-[url('/images/panggung-haul-haflah.jpg')] bg-cover bg-center bg-no-repeat bg-fixed filter brightness-[0.92] contrast-[1.02] transform scale-[1.01]"
      />

      {/* 2. OVERLAY KREM TRANSPARAN MENYELURUH (Sesuai Spesifikasi: bg-[#F5EFE6]/40) */}
      <div className="absolute inset-0 bg-[#F5EFE6]/40" />

      {/* 3. OVERLAY GRADIENT UNTUK KEDALAMAN (from-black/25 via-transparent to-black/20) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20" />

      {/* 4. VIGNETTE LEMBUT DI TEPI (radial-gradient transparent 50%, rgba(0,0,0,0.2) 100%) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.22)_100%)]" />

      {/* 5. EFEK 1 — LIGHT RAYS / CAHAYA SHIMMER KEEMASAN (WAJIB) */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#F5D76E]/15 to-transparent bg-[length:200%_200%] animate-lightShimmer opacity-80 motion-reduce:animate-none" />

      {/* 6. EFEK 3 — AWAN/MIST LEMBUT MELAYANG DI ATAS (OPSIONAL) */}
      <div className="hidden sm:block absolute -top-1/4 -left-1/4 w-[150%] h-[60%] bg-gradient-to-r from-transparent via-amber-100/10 to-transparent blur-3xl animate-cloudFloat motion-reduce:animate-none pointer-events-none" />

      {/* 7. EFEK 2 — PARTIKEL DEBU / BINTANG EMAS HALUS (WAJIB) */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: particleCount }).map((_, i) => {
          const size = (i % 3) + 1.5; // 1.5px - 3.5px
          const left = ((i * 137.5) % 100);
          const duration = 7 + (i % 7) * 1.8;
          const delay = (i % 9) * 0.9;
          const opacity = 0.35 + (i % 5) * 0.12;
          const isGold = i % 2 === 0;

          return (
            <div
              key={i}
              className={`absolute rounded-full animate-particleRise motion-reduce:animate-none ${
                isGold ? 'bg-[#F5D76E]' : 'bg-[#FFFFFF]'
              }`}
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${left}%`,
                bottom: '-20px',
                opacity,
                boxShadow: isGold 
                  ? '0 0 6px 1px rgba(245, 215, 110, 0.75)' 
                  : '0 0 5px 1px rgba(255, 255, 255, 0.85)',
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
                animationIterationCount: 'infinite',
                animationTimingFunction: 'linear',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
