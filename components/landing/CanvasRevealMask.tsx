'use client';

import React, { useEffect, useRef } from 'react';

// Konstanta parameter organic reveal mask persis seperti mekanisme Xiaomi MiMo Code
const MASK_COLOR = '#0F2C59'; // Tirai warna Deep Navy solid penutup gambar panggung
const R_START = 8; // Setiap riak lahir kecil (radius 8px)
const R_END = 128; // Radius maksimal singkap (~128px)
const R_VARY = 0.45; // Variasi acak ukuran per titik sapuan (efek kuas organik)
const LIFETIME = 520; // Durasi pemudaran halus (520ms)
const STAMP_STEP = 12; // Jarak interpolasi antar-titik sepanjang jalur kursor (12px)
const MAX_STAMPS = 200; // Kapasitas titik aktif yang luas dan responsif

interface Stamp {
  x: number;
  y: number;
  born: number;
  seed: number;
  rmax: number;
}

export default function CanvasRevealMask({
  className = 'absolute inset-0 pointer-events-none overflow-hidden',
}: {
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;

    // 1. Mengisi seluruh kanvas dengan tirai Deep Navy solid (#0F2C59)
    function drawBaseFill() {
      if (!ctx) return;
      ctx.fillStyle = MASK_COLOR;
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

    // Interpolasi (Path Stamping): menyisipkan titik setiap 12px agar sapuan cepat tidak putus
    function stampAlong(x: number, y: number) {
      if (lastX === null || lastY === null) {
        addStamp(x, y);
      } else {
        const dx = x - lastX;
        const dy = y - lastY;
        const dist = Math.hypot(dx, dy);
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

    // Harmonic Wobble: 3 gelombang sinus (frekuensi 3, 7, 13) persis kode Xiaomi MiMo
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

    // Loop Animasi Utama dengan Smart Sleep Loop
    function loop() {
      if (!ctx) return;
      const now = performance.now();

      // 1. Gambar ulang tirai krem solid
      ctx.globalCompositeOperation = 'source-over';
      drawBaseFill();

      // 2. Kikis kanvas menggunakan destination-out pada setiap titik riak air
      ctx.globalCompositeOperation = 'destination-out';
      for (let i = stamps.length - 1; i >= 0; i--) {
        const t = (now - stamps[i].born) / LIFETIME;
        if (t >= 1) {
          stamps.splice(i, 1);
          continue;
        }
        // Kurva perlambatan easeOutCubic: riak mengembang cepat lalu melambat lembut
        const ease = 1 - Math.pow(1 - t, 3);
        const r = R_START + (stamps[i].rmax - R_START) * ease;
        // Pemudaran kuadratik hingga menutup kembali menjadi tirai krem utuh
        const alpha = 1 - t * t;
        carveInk(stamps[i].x, stamps[i].y, r, alpha, stamps[i].seed);
      }

      // Optimasi CPU: hanya request frame berikutnya jika masih ada titik aktif
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
      className={className}
      aria-hidden="true"
    >
      {/* 1. Layer Gambar Panggung Aula Al-Muktamar (Terang, Jelas, Warna Asli Tanpa Filter) */}
      <img
        src="/images/panggung-aula.jpg"
        alt="Panggung Aula Al-Muktamar"
        className="absolute inset-0 w-full h-full object-cover object-center z-0"
      />

      {/* 2. Layer Canvas Tirai Deep Navy Solid (#0F2C59) yang dikikis kursor mouse (z-10) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />
    </div>
  );
}
