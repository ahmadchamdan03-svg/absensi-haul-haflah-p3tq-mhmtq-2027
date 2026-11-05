'use client';

import React from 'react';
import { Link2, X, AlertCircle } from 'lucide-react';

export interface MergeConfirmModalProps {
  isOpen: boolean;
  existingRecord: {
    nama: string;
    alamat?: string;
    kategori?: string;
    kode?: string;
  } | null;
  onConfirmMerge: () => void;
  onRejectSeparate: () => void;
  onClose: () => void;
}

export default function MergeConfirmModal({
  isOpen,
  existingRecord,
  onConfirmMerge,
  onRejectSeparate,
  onClose,
}: MergeConfirmModalProps) {
  if (!isOpen || !existingRecord) return null;

  const rawAlamat = (existingRecord.alamat || '').trim();
  const kota = rawAlamat.split(/\s+/).pop() || rawAlamat || 'Daerah Serupa';

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl max-w-md w-full p-6 shadow-2xl border border-sky-200 space-y-4 animate-in zoom-in-95">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 border border-sky-300 flex items-center justify-center text-sky-700 shrink-0">
              <Link2 className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h3 className="font-serif font-black text-base text-[#0F2C59]">
                Deteksi Data Serupa
              </h3>
              <p className="text-[11px] text-slate-500">
                Pilihan Penggabungan (Merge) Peserta
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs space-y-1.5 text-slate-700">
          <div className="flex items-center space-x-1.5 text-amber-800 font-bold">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Terdeteksi data serupa di database:</span>
          </div>
          <p className="leading-relaxed font-medium">
            <strong>{existingRecord.nama}</strong> dari <strong>{kota}</strong>
            {existingRecord.kategori ? ` (${existingRecord.kategori})` : ''}
            {existingRecord.kode ? ` [${existingRecord.kode}]` : ''}.
          </p>
          <p className="text-[11px] text-slate-600 pt-1 border-t border-amber-200/60">
            Apakah Anda ingin menggabungkan data ini ke dalam satu kartu terpadu agar kuota kehadiran terhubung secara bersamaan?
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onRejectSeparate}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
          >
            Tidak, Simpan Terpisah
          </button>
          <button
            type="button"
            onClick={onConfirmMerge}
            className="px-4 py-2.5 rounded-xl bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center space-x-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
          >
            <Link2 className="w-4 h-4" />
            <span>Ya, Gabungkan</span>
          </button>
        </div>
      </div>
    </div>
  );
}
