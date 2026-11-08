'use client';

import React from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

export default function UndanganParallaxOrnaments({ isOpened }: { isOpened?: boolean }) {
  const shouldReduceMotion = useReducedMotion();
  const { scrollY } = useScroll();

  // Pergeseran parallax halus tanpa memotong tepi aset atau mengganggu teks/tombol
  const yTopLeft = useTransform(scrollY, [0, 1200], [0, -24]);
  const yBottomRight = useTransform(scrollY, [0, 1400], [0, -28]);

  // Rotasi lembut saat scroll dengan poros sudut
  const rotateLeft = useTransform(scrollY, [0, 1200], [0, 3]);
  const rotateRight = useTransform(scrollY, [0, 1200], [0, -4]);

  return (
    <div className="fixed inset-0 pointer-events-none select-none z-20 overflow-hidden" aria-hidden="true">
      {/* 1. Ornamen Ranting Lemon Pojok Kiri Atas */}
      <motion.img
        src="/images/undangan-assets/lemon-branch-left.webp"
        alt=""
        width={334}
        height={483}
        loading="eager"
        style={
          shouldReduceMotion
            ? { transformOrigin: 'top left' }
            : { y: yTopLeft, rotate: rotateLeft, transformOrigin: 'top left' }
        }
        className="absolute top-0 left-0 w-20 sm:w-24 md:w-32 lg:w-40 h-auto object-contain opacity-85 drop-shadow-md transition-opacity duration-700"
      />

      {/* 2. Ornamen Buket Lemon Pojok Kanan Bawah: hanya di layar lebar (lg+), karena di HP/tablet margin samping terlalu sempit dan buket tertutup kartu */}
      {isOpened && (
        <motion.img
          src="/images/undangan-assets/lemon-bouquet.webp"
          alt=""
          width={591}
          height={543}
          loading="lazy"
          style={shouldReduceMotion ? undefined : { y: yBottomRight, rotate: rotateRight }}
          className="hidden lg:block absolute bottom-24 right-5 lg:w-36 xl:w-40 h-auto object-contain opacity-80 drop-shadow-lg transition-opacity duration-700"
        />
      )}
    </div>
  );
}
