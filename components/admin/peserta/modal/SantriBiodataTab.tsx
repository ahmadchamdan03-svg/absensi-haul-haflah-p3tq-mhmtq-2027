'use client';

import React from 'react';
import { KELAS_BIN_NADZOR_LIST } from '@/lib/types';

interface SantriBiodataProps {
  nama: string;
  onNamaChange: (val: string) => void;
  kamar: string;
  onKamarChange: (val: string) => void;
  kelas?: string;
  onKelasChange?: (val: string) => void;
  kategoriUtama?: 'BIL_GHOIB' | 'BIN_NADZOR' | 'TAMATAN';
  namaWali: string;
  onNamaWaliChange: (val: string) => void;
  noHp: string;
  onNoHpChange: (val: string) => void;
  alamat: string;
  onAlamatChange: (val: string) => void;
  errors?: { [key: string]: string };
}

export default function SantriBiodataTab({
  nama,
  onNamaChange,
  kamar,
  onKamarChange,
  kelas = '2 Tsanawiyah',
  onKelasChange,
  kategoriUtama,
  namaWali,
  onNamaWaliChange,
  noHp,
  onNoHpChange,
  alamat,
  onAlamatChange,
  errors = {},
}: SantriBiodataProps) {
  return (
    <div className="space-y-4">
      {/* Nama Lengkap Santri */}
      <div>
        <label htmlFor="input-santri-nama" className="block font-bold text-slate-700 mb-1">
          Nama Lengkap Santriwati *
        </label>
        <input
          id="input-santri-nama"
          type="text"
          required
          aria-invalid={!!errors.nama}
          aria-describedby={errors.nama ? 'error-santri-nama' : undefined}
          value={nama}
          onChange={(e) => onNamaChange(e.target.value)}
          placeholder=""
          className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 uppercase font-semibold transition-colors ${
            errors.nama
              ? 'border-rose-400 bg-rose-50/40 text-rose-950 focus:ring-rose-500'
              : 'border-slate-300 focus:ring-opera-700'
          }`}
        />
        {errors.nama && (
          <p id="error-santri-nama" className="text-rose-500 text-xs mt-1 font-medium animate-in fade-in">
            {errors.nama}
          </p>
        )}
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

      {/* Field Kelas: Khusus Kategori BIN_NADZOR tepat di bawah Kamar Pondok */}
      {kategoriUtama === 'BIN_NADZOR' && (
        <div className="animate-in fade-in">
          <label className="block font-bold text-slate-700 mb-1">
            Kelas *
          </label>
          <select
            value={kelas || '2 Tsanawiyah'}
            onChange={(e) => onKelasChange?.(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-opera-700 font-semibold text-slate-800"
          >
            {KELAS_BIN_NADZOR_LIST.map((kls) => (
              <option key={kls} value={kls}>
                {kls}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Nama Wali & No WhatsApp */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="input-santri-wali" className="block font-bold text-slate-700 mb-1">Nama Wali Santri *</label>
          <input
            id="input-santri-wali"
            type="text"
            required
            aria-invalid={!!errors.namaWali}
            aria-describedby={errors.namaWali ? 'error-santri-wali' : undefined}
            value={namaWali}
            onChange={(e) => onNamaWaliChange(e.target.value)}
            placeholder=""
            className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 uppercase transition-colors ${
              errors.namaWali
                ? 'border-rose-400 bg-rose-50/40 text-rose-950 focus:ring-rose-500'
                : 'border-slate-300 focus:ring-opera-700'
            }`}
          />
          {errors.namaWali && (
            <p id="error-santri-wali" className="text-rose-500 text-xs mt-1 font-medium animate-in fade-in">
              {errors.namaWali}
            </p>
          )}
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
