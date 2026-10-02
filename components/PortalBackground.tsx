'use client';

import { useState, useEffect } from 'react';

export function Particles({ count }: { count?: number }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Responsive: 12-15 di mobile, 30-50 di desktop
  const particleCount = count ?? (isMobile ? 14 : 38);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: particleCount }).map((_, i) => {
        const size = (i % 3) + 1.5;
        const left = (i * 137.5) % 100;
        const duration = 7 + (i % 7) * 1.8;
        const delay = (i % 9) * 0.9;
        const opacity = 0.35 + (i % 5) * 0.12;
        const isGold = i % 2 === 0;

        return (
          <div
            key={i}
            className={`absolute rounded-full animate-particleRise motion-reduce:animate-none ${
              isGold ? 'bg-[#D49B5B]' : 'bg-[#FFFFFF]'
            }`}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${left}%`,
              bottom: '-20px',
              opacity,
              boxShadow: isGold
                ? '0 0 6px 1px rgba(212, 155, 91, 0.75)'
                : '0 0 5px 1px rgba(255, 255, 255, 0.95)',
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
              animationIterationCount: 'infinite',
              animationTimingFunction: 'linear',
            }}
          />
        );
      })}
    </div>
  );
}

export function PortalBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* 1. FOTO PANGGUNG MEGAH FULL-SCREEN */}
      <div className="absolute inset-0 bg-[url('/images/panggung-haul-haflah.jpg')] bg-cover bg-center bg-no-repeat bg-fixed filter brightness-[1.02] contrast-[1.02] transform scale-[1.01]" />

      {/* 2. OVERLAY KREM TRANSPARAN */}
      <div className="absolute inset-0 bg-[#F5EFE6]/60" />

      {/* 3. GRADIENT BAWAH UNTUK KEDALAMAN */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

      {/* 4. VIGNETTE RADIAL LEMBUT DI TEPI */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.2)_100%)]" />

      {/* 5. LIGHT RAYS SHIMMER EMAS LEMBUT */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#F5D76E]/15 to-transparent bg-[length:200%_200%] animate-lightShimmer opacity-75 motion-reduce:animate-none" />

      {/* 6. EFEK AWAN LEMBUT DI ATAS */}
      <div className="hidden sm:block absolute -top-1/4 -left-1/4 w-[150%] h-[60%] bg-gradient-to-r from-transparent via-amber-100/15 to-transparent blur-3xl animate-cloudFloat motion-reduce:animate-none" />

      {/* 7. PARTIKEL BINTANG / DEBU EMAS MELAYANG */}
      <Particles />
    </div>
  );
}

export default PortalBackground;
