'use client';

import React from 'react';
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  Search,
  Trash2,
  XCircle,
  X,
  Info,
  Check,
} from 'lucide-react';
import { PersidanganPeserta } from '@/lib/persidangan';
import { PersidanganToast } from './types';

interface PersidanganToolbarAndStatsProps {
  toast: PersidanganToast | null;
  onCloseToast: () => void;
  pesertaList: PersidanganPeserta[];
  selectedIds: string[];
  onBulkDelete: () => void;
  onOpenImportModal: () => void;
  onOpenAddModal: () => void;
  search: string;
  onSearchChange: (val: string) => void;
  filterStatus: string;
  onFilterStatusChange: (val: string) => void;
}

export default function PersidanganToolbarAndStats({
  toast,
  onCloseToast,
  pesertaList,
  selectedIds,
  onBulkDelete,
  onOpenImportModal,
  onOpenAddModal,
  search,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
}: PersidanganToolbarAndStatsProps) {
  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 shadow-md transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : toast.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-[#8C6A47] text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <Check className="w-4 h-4" />
            ) : toast.type === 'error' ? (
              <XCircle className="w-4 h-4" />
            ) : (
              <Info className="w-4 h-4" />
            )}
            <span>{toast.text}</span>
          </div>
          <button
            onClick={onCloseToast}
            className="p-1 hover:bg-black/10 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Control Bar: Actions & Filters */}
      <div className="bg-[#FAF7F3] border-2 border-[#D5C4B4] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#8C6A47]/10 border border-[#8C6A47]/30 flex items-center justify-center text-[#8C6A47]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm sm:text-base text-[#422F21]">
                Daftar Peserta Persidangan
              </h4>
              <p className="text-[11px] text-[#735334]">
                Total: <strong>{pesertaList.length}</strong> orang • Hadir:{' '}
                <strong className="text-emerald-700">
                  {pesertaList.filter((p) => p.status_kehadiran === 'HADIR').length}
                </strong>{' '}
                • Terkirim:{' '}
                <strong className="text-emerald-700">
                  {pesertaList.filter((p) => p.status_kirim === 'TERKIRIM').length}
                </strong>{' '}
                • Belum:{' '}
                <strong className="text-amber-700">
                  {pesertaList.filter((p) => p.status_kirim === 'BELUM').length}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={onBulkDelete}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Terpilih ({selectedIds.length})
              </button>
            )}

            <button
              type="button"
              onClick={onOpenImportModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D5C4B4] bg-white hover:bg-[#F5E6D3] text-xs font-bold text-[#735334] transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              Import Excel
            </button>

            <button
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white text-xs font-bold shadow-xs transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              + Tambah Peserta
            </button>
          </div>
        </div>

        {/* Filter & Search Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E5D7C8]">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8C6A47] absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari nama, nomor WA, atau kode..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs text-[#422F21] placeholder-[#A89887] focus:outline-none focus:ring-2 focus:ring-[#8C6A47]/40"
            />
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => onFilterStatusChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs text-[#422F21] focus:outline-none focus:ring-2 focus:ring-[#8C6A47]/40"
            >
              <option value="SEMUA">Semua Status</option>
              <option value="HADIR">Presensi: Hadir</option>
              <option value="BELUM_HADIR">Presensi: Belum Hadir</option>
              <option value="TERKIRIM">WA: Sudah Terkirim</option>
              <option value="BELUM">WA: Belum Dikirim</option>
              <option value="GAGAL">WA: Gagal Kirim</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
}
