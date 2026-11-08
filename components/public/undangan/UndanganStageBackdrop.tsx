'use client';

import React from 'react';

export default function UndanganStageBackdrop({
  className = 'fixed inset-0 w-full h-full pointer-events-none overflow-hidden z-0 select-none',
}: {
  className?: string;
}) {
  return (
    <div className={className} aria-hidden="true">
      {/* 1. Foto Panggung Aula Al-Muktamar tampil langsung full-screen */}
      <img
        src="/images/panggung-aula.jpg"
        alt=""
        width={1024}
        height={576}
        fetchPriority="high"
        decoding="sync"
        className="absolute inset-0 w-full h-full object-cover object-center z-0 select-none pointer-events-none"
      />

      {/* 2. Overlay gradient Deep Navy transparan untuk keterbacaan teks WCAG AA di seluruh viewport */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#0F2C59]/90 via-[#0F2C59]/65 to-[#0F2C59]/80" />

      {/* 3. Vignette radial halus agar fokus visual tetap terjaga pada kartu konten */}
      <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(15,44,89,0.55)_100%)]" />
    </div>
  );
}
