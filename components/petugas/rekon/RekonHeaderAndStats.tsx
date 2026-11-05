'use client';

import {
  RotateCcw,
  Search,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  UserPlus,
} from 'lucide-react';
import { ToastMessage } from './types';

interface RekonHeaderAndStatsProps {
  loading: boolean;
  toastMsg: ToastMessage | null;
  keyword: string;
  setKeyword: (val: string) => void;
  onOpenWalkinModal: () => void;
  onRefresh: () => void;
}

export default function RekonHeaderAndStats({
  loading,
  toastMsg,
  keyword,
  setKeyword,
  onOpenWalkinModal,
  onRefresh,
}: RekonHeaderAndStatsProps) {
  return (
    <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-white/70 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-[#E0F2FE] text-[#1D4ED8] border-2 border-[#1D4ED8]/40 flex items-center justify-center font-bold shadow-xs shrink-0">
            <RotateCcw className="w-5 h-5 text-[#1D4ED8]" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-black text-[#0F2C59]">
              Meja Rekonsiliasi &amp; Kasus Khusus Gerbang
            </h1>
            <p className="text-xs text-[#7A624E]">
              Gerbang Selatan (Sisi Dalam). Menangani tamu walk-in, barcode bermasalah, koreksi kuota, &amp; audit identitas.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onOpenWalkinModal}
            className="px-3.5 py-2.5 rounded-2xl bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4 text-emerald-200" />
            <span>+ Daftarkan Walk-in</span>
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="p-2.5 rounded-2xl bg-white/60 hover:bg-white/85 backdrop-blur-xs text-[#1D4ED8] border border-white/70 shadow-2xs flex items-center justify-center transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* TOAST / ALERT BOX NOTIFIKASI */}
      {toastMsg && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center space-x-2.5 shadow-xs transition-all animate-in fade-in ${
            toastMsg.tipe === 'success'
              ? 'bg-blue-50 text-blue-900 border-2 border-blue-300'
              : 'bg-rose-50 text-rose-900 border-2 border-rose-300'
          }`}
        >
          {toastMsg.tipe === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="font-bold leading-relaxed">{toastMsg.text}</span>
        </div>
      )}

      {/* SEARCH BAR PENCARIAN MASIF */}
      <div className="relative">
        <Search className="w-5 h-5 text-[#1D4ED8] absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Cari berdasarkan Nama Santri, Nama Wali, Tamu VIP, No. HP, atau Kode (SH0001 / UND0101)..."
          className="w-full pl-11 pr-10 py-3 rounded-2xl border border-white/80 text-xs sm:text-sm focus:outline-none focus:border-[#1D4ED8] font-semibold bg-white/70 backdrop-blur-xs text-[#0F2C59] placeholder-[#7A624E]/70 shadow-xs"
        />
        {keyword && (
          <button
            type="button"
            onClick={() => setKeyword('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-sm font-bold"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
