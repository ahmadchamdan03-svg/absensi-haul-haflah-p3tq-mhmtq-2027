'use client';

import React from 'react';

export default function UndanganStageBackdrop({
  className = 'fixed inset-0 w-full h-full pointer-events-none overflow-hidden z-0 select-none',
}: {
  className?: string;
}) {
  return (
    <div className={className} aria-hidden="true">
      {/* Foto Panggung Aula Al-Muktamar tampil full-screen, terang, tanpa lapisan overlay */}
      <img
        src="/images/panggung-aula.jpg"
        alt=""
        width={1024}
        height={576}
        fetchPriority="high"
        decoding="sync"
        className="absolute inset-0 w-full h-full object-cover object-center z-0 select-none pointer-events-none"
      />
    </div>
  );
}
