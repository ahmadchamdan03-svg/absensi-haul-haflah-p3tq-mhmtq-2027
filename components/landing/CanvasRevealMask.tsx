'use client';

import React, { useEffect, useRef } from 'react';

// Konstanta parameter organic reveal mask (adaptasi presisi dari teknik Xiaomi MiMo)
const MASK_RGB = '234, 219, 200'; // #EADBC8 (krem lebih pekat khas Haflah)
const R_START = 8; // Titik awal sapuan kursor
const R_END = 120; // Radius singkap ~120px sesuai instruksi User
const R_VARY = 0.45; // Variasi acak ukuran per-titik sapuan (efek kuas organik)
const LIFETIME = 500; // Durasi pemudaran halus (~0.5 detik)
const STAMP_STEP = 12; // Jarak interpolasi antar-titik sepanjang jalur kursor
const MAX_STAMPS = 300; // Kapasitas titik aktif yang luas dan responsif

interface Stamp {
  x: number;
  y: number;
  born: number;
  seed: number;
  rmax: number;
}

export default function CanvasRevealMask() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;

    function drawBaseFill() {
      if (!ctx) return;
      const g = ctx.createRadialGradient(w * 0.5, h * 0.45, 60, w * 0.5, h * 0.45, Math.max(w, h) * 0.85);
      g.addColorStop(0, `rgba(${MASK_RGB}, 0.88)`);
      g.addColorStop(0.65, `rgba(${MASK_RGB}, 0.92)`);
      g.addColorStop(1, `rgba(${MASK_RGB}, 0.96)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }

    function resize() {
      if (!canvas || !ctx) return;
      w = window.innerWidth;
      h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      drawBaseFill();
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });

    const stamps: Stamp[] = [];
    let lastX: number | null = null;
    let lastY: number | null = null;
    let animationFrameId: number | null = null;
    let running = false;

    function addStamp(x: number, y: number) {
      if (stamps.length >= MAX_STAMPS) stamps.shift();
      stamps.push({
        x,
        y,
        born: performance.now(),
        seed: Math.random() * Math.PI * 2,
        rmax: R_END * (1 - R_VARY + Math.random() * R_VARY),
      });
    }

    function stampAlong(x: number, y: number) {
      if (lastX === null || lastY === null) {
        addStamp(x, y);
      } else {
        const dx = x - lastX;
        const dy = y - lastY;
        const dist = Math.hypot(dx, dy);
        // Cegah interpolasi berlebih jika kursor berpindah/teleport secara mendadak (> 150px)
        if (dist > 150) {
          addStamp(x, y);
        } else {
          const steps = Math.max(1, Math.ceil(dist / STAMP_STEP));
          for (let i = 1; i <= steps; i++) {
            addStamp(lastX + (dx * i) / steps, lastY + (dy * i) / steps);
          }
        }
      }
      lastX = x;
      lastY = y;
    }

    // Carve organic harmonic hole (lekukan riak air harmonik dengan fungsi Math.sin)
    function carveInk(x: number, y: number, r: number, alpha: number, seed: number) {
      if (!ctx) return;
      const g = ctx.createRadialGradient(x, y, r * 0.25, x, y, r);
      g.addColorStop(0, `rgba(0, 0, 0, ${0.95 * alpha})`);
      g.addColorStop(0.55, `rgba(0, 0, 0, ${0.88 * alpha})`);
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = g;
      ctx.beginPath();
      const segs = 32;
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        const wob =
          0.78 +
          0.14 * Math.sin(a * 3 + seed) +
          0.08 * Math.sin(a * 7 + seed * 2.1) +
          0.05 * Math.sin(a * 13 + seed * 0.7);
        const rr = r * wob;
        const px = x + Math.cos(a) * rr;
        const py = y + Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }

    function loop() {
      if (!ctx) return;
      const now = performance.now();

      // Lapisi ulang seluruh kanvas dengan gradien halus krem
      ctx.globalCompositeOperation = 'source-over';
      drawBaseFill();

      // Kikis kanvas pada setiap titik riak air menggunakan destination-out
      ctx.globalCompositeOperation = 'destination-out';
      for (let i = stamps.length - 1; i >= 0; i--) {
        const t = (now - stamps[i].born) / LIFETIME;
        if (t >= 1) {
          stamps.splice(i, 1);
          continue;
        }
        const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic untuk ekspansi lembut
        const r = R_START + (stamps[i].rmax - R_START) * ease;
        const alpha = 1 - t * t; // Pemudaran kuadratik hingga menutup kembali
        carveInk(stamps[i].x, stamps[i].y, r, alpha, stamps[i].seed);
      }

      if (stamps.length > 0) {
        animationFrameId = requestAnimationFrame(loop);
      } else {
        running = false;
        animationFrameId = null;
      }
    }

    function start() {
      if (!running) {
        running = true;
        animationFrameId = requestAnimationFrame(loop);
      }
    }

    function handleMouseMove(e: MouseEvent) {
      stampAlong(e.clientX, e.clientY);
      start();
    }

    function handleTouchMove(e: TouchEvent) {
      if (e.touches && e.touches[0]) {
        stampAlong(e.touches[0].clientX, e.touches[0].clientY);
        start();
      }
    }

    function handleMouseLeave() {
      lastX = null;
      lastY = null;
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    window.addEventListener('touchend', handleMouseLeave, { passive: true });

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchend', handleMouseLeave);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* 1. Layer Background Gambar Panggung Aula Al-Muktamar (Baru) & Overlay Logo */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="relative w-full h-full min-w-full min-h-full">
          <img
            src="/images/panggung-aula.jpg"
            alt="Panggung Aula Al-Muktamar"
            className="w-full h-full object-cover object-center"
          />

          {/* Overlay Logo P3TQ & MHMTQ Tajam (Menimpa logo blur di panggung) */}
          <div className="absolute top-[18%] sm:top-[20%] left-1/2 -translate-x-1/2 flex items-center justify-center gap-4 sm:gap-6 z-10 pointer-events-none drop-shadow-md">
            <img
              src="/images/logo-p3tq-overlay.png"
              alt="Logo P3TQ"
              className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain filter drop-shadow-md"
            />
            <img
              src="/images/logo-mhmtq-overlay.png"
              alt="Logo MHMTQ"
              className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain filter drop-shadow-md"
            />
          </div>
        </div>
      </div>

      {/* Layer Ambient Light Orbs di atas foto panggung untuk kedalaman kaca */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D49B5B]/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-[#8C6A47]/20 rounded-full blur-3xl pointer-events-none" />

      {/* 2. Layer Canvas 2D Organic Reveal Mask (#FAF7F3) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block pointer-events-none"
      />
    </div>
  );
}
