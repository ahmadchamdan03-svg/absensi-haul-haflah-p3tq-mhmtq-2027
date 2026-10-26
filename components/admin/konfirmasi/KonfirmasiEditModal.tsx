'use client';

import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { KonfirmasiItem } from './types';

interface KonfirmasiEditModalProps {
  modalItem: KonfirmasiItem | null;
  onClose: () => void;
  errorMsg: string | null;
  editL: number;
  setEditL: (val: number) => void;
  editP: number;
  setEditP: (val: number) => void;
  editCatatan: string;
  setEditCatatan: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function KonfirmasiEditModal({
  modalItem,
  onClose,
  errorMsg,
  editL,
  setEditL,
  editP,
  setEditP,
  editCatatan,
  setEditCatatan,
  onSubmit,
}: KonfirmasiEditModalProps) {
  if (!modalItem) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#FAF7F3] rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-[#8C6A47]/40 space-y-4 animate-scale-up">
        <div className="flex items-center justify-between border-b border-[#D5C4B4] pb-3">
          <div>
            <h3 className="font-serif font-black text-base text-[#422F21]">
              Edit Konfirmasi Manual Panitia
            </h3>
            <p className="text-xs text-[#7A624E]">
              Santri: <span className="font-bold text-[#422F21]">{modalItem.namaSantri}</span> ({modalItem.kode})
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#D5C4B4] text-[#7A624E] hover:text-[#422F21] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 text-red-800 text-xs border border-red-200 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="p-3 bg-[#EFE8E1]/70 rounded-2xl border border-[#D5C4B4] text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-[#7A624E]">Wali Santri:</span>
              <span className="font-bold text-[#422F21]">{modalItem.namaWali}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A624E]">Kategori / Kelas:</span>
              <span className="font-bold text-[#422F21]">
                {modalItem.subKategori} ({modalItem.kelas})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A624E]">Total Jatah Kuota:</span>
              <span className="font-bold text-[#8C6A47]">{modalItem.totalKuota} Kursi</span>
            </div>
          </div>

          {/* Stepper Laki-laki */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#D5C4B4]">
            <div>
              <div className="text-xs font-bold text-[#422F21]">Wali Laki-laki (Putra)</div>
              <div className="text-[10px] text-[#7A624E]">Zona Sayap Barat</div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                disabled={editL <= 0}
                onClick={() => setEditL(Math.max(0, editL - 1))}
                className="w-8 h-8 rounded-lg bg-[#FAF7F3] border border-[#D5C4B4] font-bold text-[#422F21] disabled:opacity-30 transition-all cursor-pointer"
              >
                −
              </button>
              <span className="w-6 text-center font-black text-[#422F21] text-base">{editL}</span>
              <button
                type="button"
                disabled={editL + editP >= modalItem.totalKuota}
                onClick={() => {
                  if (editL + editP < modalItem.totalKuota) setEditL(editL + 1);
                }}
                className="w-8 h-8 rounded-lg bg-[#FAF7F3] border border-[#D5C4B4] font-bold text-[#422F21] disabled:opacity-30 transition-all cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Stepper Perempuan */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#D5C4B4]">
            <div>
              <div className="text-xs font-bold text-[#422F21]">Wali Perempuan (Putri)</div>
              <div className="text-[10px] text-[#7A624E]">Zona Sayap Timur</div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                disabled={editP <= 0}
                onClick={() => setEditP(Math.max(0, editP - 1))}
                className="w-8 h-8 rounded-lg bg-[#FAF7F3] border border-[#D5C4B4] font-bold text-[#422F21] disabled:opacity-30 transition-all cursor-pointer"
              >
                −
              </button>
              <span className="w-6 text-center font-black text-[#422F21] text-base">{editP}</span>
              <button
                type="button"
                disabled={editL + editP >= modalItem.totalKuota}
                onClick={() => {
                  if (editL + editP < modalItem.totalKuota) setEditP(editP + 1);
                }}
                className="w-8 h-8 rounded-lg bg-[#FAF7F3] border border-[#D5C4B4] font-bold text-[#422F21] disabled:opacity-30 transition-all cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#EFE8E1]/80 text-xs font-bold text-[#7A624E]">
            <span>Total Estimasi:</span>
            <span className="text-[#8C6A47] font-black text-sm">
              {editL + editP} / {modalItem.totalKuota} Kursi
            </span>
          </div>

          {/* Catatan Panitia */}
          <div>
            <label className="block text-xs font-bold text-[#422F21] mb-1">
              Catatan Panitia (Opsional):
            </label>
            <input
              type="text"
              value={editCatatan}
              onChange={(e) => setEditCatatan(e.target.value)}
              placeholder="Contoh: Dikonfirmasi via telepon WhatsApp oleh wali"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#D5C4B4] text-xs text-[#422F21] focus:outline-none focus:border-[#8C6A47]"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#D5C4B4]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-[#D5C4B4] text-xs font-bold text-[#7A624E] hover:bg-[#FAF7F3] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white text-xs font-black shadow-md transition-all cursor-pointer"
            >
              Simpan Konfirmasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
