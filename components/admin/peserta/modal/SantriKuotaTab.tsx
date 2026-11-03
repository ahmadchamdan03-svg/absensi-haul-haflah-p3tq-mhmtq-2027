'use client';

import React from 'react';
import { BAGIAN_TAMATAN_LIST } from '@/lib/types';

interface SantriKuotaTabProps {
  kategoriUtama: 'BIL_GHOIB' | 'BIN_NADZOR' | 'TAMATAN';
  onKategoriUtamaChange: (kat: 'BIL_GHOIB' | 'BIN_NADZOR' | 'TAMATAN') => void;
  bagianTamatan?: string;
  onBagianTamatanChange?: (bg: string) => void;
  kuotaDasar?: number;
  onKuotaDasarChange?: (val: number) => void;
  isEditMode?: boolean;
}

export default function SantriKuotaTab({
  kategoriUtama,
  onKategoriUtamaChange,
  bagianTamatan = 'A.01',
  onBagianTamatanChange,
  kuotaDasar,
  onKuotaDasarChange,
  isEditMode = false,
}: SantriKuotaTabProps) {
  return (
    <div className="space-y-4">
      {/* Kategori Utama */}
      <div>
        <label className="block font-bold text-slate-700 mb-1">
          Kategori Utama Santri *
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onKategoriUtamaChange('BIL_GHOIB')}
            className={`py-2 px-3 rounded-xl font-bold border transition-all text-center ${
              kategoriUtama === 'BIL_GHOIB'
                ? 'bg-emerald-700 text-white border-emerald-800 shadow'
                : 'bg-slate-50 text-slate-700 border-slate-300'
            }`}
          >
            Bil Ghoib
            <span className="block text-[10px] font-normal opacity-80">
              4 Kursi · Cream
            </span>
          </button>

          <button
            type="button"
            onClick={() => onKategoriUtamaChange('BIN_NADZOR')}
            className={`py-2 px-3 rounded-xl font-bold border transition-all text-center ${
              kategoriUtama === 'BIN_NADZOR'
                ? 'bg-blue-700 text-white border-blue-800 shadow'
                : 'bg-slate-50 text-slate-700 border-slate-300'
            }`}
          >
            Bin Nadzori
            <span className="block text-[10px] font-normal opacity-80">
              2 Kursi · Biru
            </span>
          </button>

          <button
            type="button"
            onClick={() => onKategoriUtamaChange('TAMATAN')}
            className={`py-2 px-3 rounded-xl font-bold border transition-all text-center ${
              kategoriUtama === 'TAMATAN'
                ? 'bg-amber-600 text-white border-amber-700 shadow'
                : 'bg-slate-50 text-slate-700 border-slate-300'
            }`}
          >
            Tamatan
            <span className="block text-[10px] font-normal opacity-80">
              2 Kursi · Biru
            </span>
          </button>
        </div>
      </div>

      {/* Opsi Khusus Tamatan */}
      {kategoriUtama === 'TAMATAN' && (
        <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-300 space-y-1.5 animate-in fade-in">
          <label className="block font-bold text-amber-950">
            Pilih Bagian Tamatan *
          </label>
          {isEditMode ? (
            <select
              value={bagianTamatan || 'A.01'}
              onChange={(e) => onBagianTamatanChange?.(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-950 font-bold focus:outline-none focus:ring-2 focus:ring-amber-600"
            >
              {BAGIAN_TAMATAN_LIST.map((bg) => (
                <option key={bg} value={bg}>
                  Bagian {bg}
                </option>
              ))}
            </select>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {BAGIAN_TAMATAN_LIST.map((bg) => (
                <button
                  key={bg}
                  type="button"
                  onClick={() => onBagianTamatanChange?.(bg)}
                  className={`py-1.5 px-2 rounded-lg font-bold text-center text-xs transition-all ${
                    bagianTamatan === bg
                      ? 'bg-amber-600 text-white shadow'
                      : 'bg-white text-amber-900 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Input Kuota Khusus Edit Mode */}
      {isEditMode && kuotaDasar !== undefined && onKuotaDasarChange && (
        <div>
          <label className="block font-bold text-slate-700 mb-1">Kuota Dasar Kursi</label>
          <input
            type="number"
            min={1}
            max={10}
            value={kuotaDasar}
            onChange={(e) => onKuotaDasarChange(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-mono font-bold"
          />
        </div>
      )}
    </div>
  );
}
