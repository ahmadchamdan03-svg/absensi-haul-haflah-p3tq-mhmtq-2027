'use client';

import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function UndanganParallaxOrnaments({ isOpened }: { isOpened?: boolean }) {
  const { scrollY } = useScroll();

  // Efek Parallax Floating: bergerak lebih lambat dari konten saat di-scroll
  const yTopLeft = useTransform(scrollY, [0, 1000], [0, 80]);
  const yTopRight = useTransform(scrollY, [0, 1000], [0, 110]);
  const yMidRight = useTransform(scrollY, [200, 1400], [-40, 90]);
  const yBottomLeft = useTransform(scrollY, [600, 2000], [20, -60]);

  // Rotasi dinamis sangat halus saat di-scroll (efek melayang alami)
  const rotateLeft = useTransform(scrollY, [0, 1200], [0, 6]);
  const rotateRight = useTransform(scrollY, [0, 1200], [0, -6]);

  return (
    <div className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden">
      {/* 1. Ornamen Ranting Lemon Kiri Atas (Parallax) */}
      <motion.div
        style={{ y: yTopLeft, rotate: rotateLeft }}
        className="absolute -top-6 -left-6 sm:top-2 sm:left-2 w-28 sm:w-40 md:w-48 lg:w-56 drop-shadow-md opacity-85 transition-opacity duration-700"
      >
        <img
          src="/images/undangan-assets/lemon-branch-left.webp"
          alt=""
          width={450}
          height={650}
          className="w-full h-auto object-contain"
          loading="eager"
        />
      </motion.div>

      {/* 2. Ornamen Ranting Lemon Kanan Atas (Parallax) */}
      <motion.div
        style={{ y: yTopRight, rotate: rotateRight }}
        className="absolute -top-8 -right-6 sm:top-0 sm:right-2 w-28 sm:w-36 md:w-44 lg:w-52 drop-shadow-md opacity-80 transition-opacity duration-700"
      >
        <img
          src="/images/undangan-assets/lemon-branch-right.webp"
          alt=""
          width={400}
          height={700}
          className="w-full h-auto object-contain"
          loading="eager"
        />
      </motion.div>

      {/* 3. Ornamen Buket Lemon Tengah Kanan (Muncul lembut saat scroll ke tengah) */}
      {isOpened && (
        <motion.div
          style={{ y: yMidRight }}
          className="hidden sm:block absolute top-[42%] -right-8 md:-right-4 w-32 md:w-44 lg:w-52 drop-shadow-lg opacity-75"
        >
          <img
            src="/images/undangan-assets/lemon-bouquet.webp"
            alt=""
            width={600}
            height={550}
            className="w-full h-auto object-contain"
            loading="lazy"
          />
        </motion.div>
      )}

      {/* 4. Ornamen Sudut Bunga Biru Kiri Bawah (Parallax halus) */}
      {isOpened && (
        <motion.div
          style={{ y: yBottomLeft }}
          className="absolute bottom-2 -left-6 sm:bottom-6 sm:left-2 w-32 sm:w-44 md:w-52 opacity-70 drop-shadow-sm"
        >
          <img
            src="/images/undangan-assets/floral-corner.webp"
            alt=""
            width={550}
            height={350}
            className="w-full h-auto object-contain"
            loading="lazy"
          />
        </motion.div>
      )}
    </div>
  );
}
