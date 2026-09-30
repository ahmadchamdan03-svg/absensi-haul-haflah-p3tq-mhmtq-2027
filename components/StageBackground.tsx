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
      {/* 1. LAYER FOTO PANGGUNG ASLI DENGAN EDIT VISUAL & TONE */}
      <div 
        className="absolute inset-0 bg-[url('/images/panggung-haul-haflah.jpg')] bg-cover bg-center bg-no-repeat bg-fixed filter brightness-[0.85] contrast-[1.05] sepia-[0.12] transform scale-[1.02]"
      />

      {/* 2. OVERLAY GRADIENT COKLAT TUA DARI BAWAH HINGGA ATAS */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1A0F08]/95 via-[#2A1D13]/65 to-[#120B06]/80" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#120B06]/75 via-transparent to-[#1A0F08]/90" />

      {/* 3. VIGNETTE RADIAL EMBOSSED TEPI */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(15,9,5,0.85)_100%)]" />

      {/* 4. EFEK 1 — LIGHT RAYS / CAHAYA SHIMMER KEEMASAN (WAJIB) */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#F5D76E]/15 to-transparent bg-[length:200%_200%] animate-lightShimmer opacity-75 motion-reduce:animate-none" />

      {/* 5. EFEK 3 — AWAN/MIST LEMBUT MELAYANG DI ATAS (OPSIONAL) */}
      <div className="hidden sm:block absolute -top-1/4 -left-1/4 w-[150%] h-[60%] bg-gradient-to-r from-transparent via-amber-100/5 to-transparent blur-3xl animate-cloudFloat motion-reduce:animate-none pointer-events-none" />

      {/* 6. EFEK 2 — PARTIKEL DEBU / BINTANG EMAS HALUS (WAJIB) */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: particleCount }).map((_, i) => {
          const size = (i % 3) + 1.5; // 1.5px - 3.5px
          const left = ((i * 137.5) % 100); // Sebaran 0-100%
          const duration = 7 + (i % 7) * 1.8; // 7s - 18s
          const delay = (i % 9) * 0.9; // 0s - 7.2s
          const opacity = 0.3 + (i % 5) * 0.12; // 0.3 - 0.78
          const isGold = i % 2 === 0;

          return (
            <div
              key={i}
              className={`absolute rounded-full animate-particleRise motion-reduce:animate-none ${
                isGold ? 'bg-[#F5D76E]' : 'bg-[#FFF4D4]'
              }`}
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${left}%`,
                bottom: '-20px',
                opacity,
                boxShadow: isGold 
                  ? '0 0 6px 1px rgba(245, 215, 110, 0.7)' 
                  : '0 0 4px 1px rgba(255, 255, 255, 0.8)',
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
