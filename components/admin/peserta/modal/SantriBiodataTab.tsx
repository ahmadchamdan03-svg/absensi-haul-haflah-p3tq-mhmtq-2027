'use client';

import React from 'react';

interface SantriBiodataProps {
  nama: string;
  onNamaChange: (val: string) => void;
  kamar: string;
  onKamarChange: (val: string) => void;
  namaWali: string;
  onNamaWaliChange: (val: string) => void;
  noHp: string;
  onNoHpChange: (val: string) => void;
  alamat: string;
  onAlamatChange: (val: string) => void;
}

export default function SantriBiodataTab({
  nama,
  onNamaChange,
  kamar,
  onKamarChange,
  namaWali,
  onNamaWaliChange,
  noHp,
  onNoHpChange,
  alamat,
  onAlamatChange,
}: SantriBiodataProps) {
  return (
    <div className="space-y-4">
      {/* Nama Lengkap Santri */}
      <div>
        <label className="block font-bold text-slate-700 mb-1">
          Nama Lengkap Santriwati *
        </label>
        <input
          type="text"
          required
          value={nama}
          onChange={(e) => onNamaChange(e.target.value)}
          placeholder=""
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 uppercase font-semibold"
        />
      </div>

      {/* Kamar Pondok */}
      <div>
        <label className="block font-bold text-slate-700 mb-1">Kamar Pondok</label>
        <input
          type="text"
          value={kamar}
          onChange={(e) => onKamarChange(e.target.value)}
          placeholder=""
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700"
        />
      </div>

      {/* Nama Wali & No WhatsApp */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-bold text-slate-700 mb-1">Nama Wali Santri *</label>
          <input
            type="text"
            required
            value={namaWali}
            onChange={(e) => onNamaWaliChange(e.target.value)}
            placeholder=""
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 uppercase"
          />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">No. WhatsApp Wali</label>
          <input
            type="text"
            value={noHp}
            onChange={(e) => onNoHpChange(e.target.value)}
            placeholder=""
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-mono"
          />
        </div>
      </div>

      {/* Alamat / Asal Kota */}
      <div>
        <label className="block font-bold text-slate-700 mb-1">Alamat / Asal Kota</label>
        <input
          type="text"
          value={alamat}
          onChange={(e) => onAlamatChange(e.target.value)}
          placeholder=""
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 uppercase"
        />
      </div>
    </div>
  );
}
