'use client';

import React from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  Search,
  Sparkles,
  XCircle,
} from 'lucide-react';
import {
  MainTabType,
  FilterStatusType,
  FilterKategoriType,
  KonfirmasiRekap,
} from './types';

interface KonfirmasiStatsAndFiltersProps {
  activeMainTab: MainTabType;
  setActiveMainTab: React.Dispatch<React.SetStateAction<MainTabType>>;
  daftarSantriCount: number;
  daftarTamuCount: number;
  rekap: KonfirmasiRekap;
  filterStatus: FilterStatusType;
  setFilterStatus: React.Dispatch<React.SetStateAction<FilterStatusType>>;
  filterKategori: FilterKategoriType;
  setFilterKategori: React.Dispatch<React.SetStateAction<FilterKategoriType>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  filteredCount: number;
  currentDatasetCount: number;
  onResetPage: () => void;
  onRefreshData: () => void;
  children?: React.ReactNode;
}

export default function KonfirmasiStatsAndFilters({
  activeMainTab,
  setActiveMainTab,
  daftarSantriCount,
  daftarTamuCount,
  rekap,
  filterStatus,
  setFilterStatus,
  filterKategori,
  setFilterKategori,
  searchQuery,
  setSearchQuery,
  filteredCount,
  currentDatasetCount,
  onResetPage,
  onRefreshData,
  children,
}: KonfirmasiStatsAndFiltersProps) {
  const scrollToTable = () => {
    const el = document.getElementById('tabel-konfirmasi');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* Header Halaman */}
      <div className="bg-gradient-to-r from-[#FAF7F3] via-[#EFE8E1] to-[#FAF7F3] text-[#422F21] rounded-3xl p-4 sm:p-6 shadow-sm border-2 border-[#8C6A47]/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF7F3] text-[#8C6A47] text-[10px] sm:text-xs font-serif font-black border-2 border-[#D49B5B] max-w-full truncate">
              <Sparkles className="w-3 h-3 text-[#D49B5B] shrink-0" />
              <span className="truncate">PANEL PANITIA · REKAPITULASI PRA-ACARA</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-serif font-black tracking-tight text-[#422F21] leading-tight">
              Monitoring Konfirmasi Kehadiran{' '}
              {activeMainTab === 'WALI_SANTRI' ? 'Wali Santri' : 'Tamu Undangan'}
            </h1>
          </div>

          {/* TOGGLE WALI SANTRI / TAMU UNDANGAN */}
          <div className="flex items-center space-x-2 bg-[#FAF7F3] p-1.5 rounded-2xl border-2 border-[#8C6A47]/30 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveMainTab('WALI_SANTRI');
                setFilterStatus('SEMUA');
                setFilterKategori('SEMUA');
                onResetPage();
                onRefreshData();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-2 ${
                activeMainTab === 'WALI_SANTRI'
                  ? 'bg-[#8C6A47] text-white shadow-md'
                  : 'text-[#7A624E] hover:bg-[#EFE8E1]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Wali Santri ({daftarSantriCount})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMainTab('TAMU_UNDANGAN');
                setFilterStatus('SEMUA');
                setFilterKategori('SEMUA');
                onResetPage();
                onRefreshData();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-2 ${
                activeMainTab === 'TAMU_UNDANGAN'
                  ? 'bg-[#8C6A47] text-white shadow-md'
                  : 'text-[#7A624E] hover:bg-[#EFE8E1]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D49B5B]" />
              <span>Tamu Undangan ({daftarTamuCount})</span>
            </button>
          </div>
        </div>
        <p className="text-xs text-[#7A624E] font-medium leading-relaxed">
          {activeMainTab === 'WALI_SANTRI'
            ? 'Pantau total konfirmasi kehadiran, data rombongan Laki-laki & Perempuan untuk alokasi konsumsi dan kursi wali santri.'
            : 'Pantau konfirmasi kehadiran Tamu Undangan / Kehormatan, jatah kursi alokasi, dan perkiraan rombongan.'}
        </p>
      </div>

      {/* 4 KARTU METRIK RINGKASAN KONFIRMASI */}
      {activeMainTab === 'WALI_SANTRI' ? (
        <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 sm:gap-6 items-stretch">
          {/* Card 1: Total Santri Riil */}
          <button
            type="button"
            onClick={() => {
              setFilterStatus('SEMUA');
              scrollToTable();
            }}
            className={`rounded-3xl p-4 sm:p-5 shadow-sm border-2 text-left transition-all duration-200 cursor-pointer relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 min-h-[140px] flex flex-col justify-between ${
              filterStatus === 'SEMUA'
                ? 'bg-[#FAF7F3] border-[#8C6A47] ring-2 ring-[#8C6A47]/30'
                : 'bg-[#FAF7F3] border-[#D5C4B4] hover:border-[#8C6A47]'
            }`}
            title="Klik untuk menampilkan seluruh data wali santri"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-[#7A624E] uppercase tracking-wider group-hover:text-[#422F21]">
                Total Santri Riil
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#EFE8E1] group-hover:bg-[#8C6A47] group-hover:text-white flex items-center justify-center text-[#8C6A47] transition-colors shrink-0">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-3xl font-serif font-black text-[#422F21] my-1">
              {rekap.totalSantri}{' '}
              <span className="text-xs sm:text-sm font-sans font-medium text-[#7A624E]">
                Santri
              </span>
            </div>
            <div className="text-[10px] sm:text-xs text-[#8C6A47] font-semibold flex items-center justify-between truncate">
              <span className="truncate">Kuota: {rekap.totalKuotaSantri} Kursi</span>
            </div>
          </button>

          {/* Card 2: Sudah Konfirmasi */}
          <button
            type="button"
            onClick={() => {
              setFilterStatus('SUDAH');
              scrollToTable();
            }}
            className={`rounded-3xl p-4 sm:p-5 shadow-sm border-2 text-left transition-all duration-200 cursor-pointer relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 min-h-[140px] flex flex-col justify-between ${
              filterStatus === 'SUDAH'
                ? 'bg-emerald-50/90 border-emerald-600 ring-2 ring-emerald-500/30'
                : 'bg-[#FAF7F3] border-[#D5C4B4] hover:border-emerald-500 hover:bg-emerald-50/50'
            }`}
            title="Klik untuk memfilter data yang SUDAH konfirmasi"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Sudah Konfirmasi
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-100 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center text-emerald-700 transition-colors shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-3xl font-serif font-black text-emerald-900 my-1">
              {rekap.sudahKonfirmasiCount}{' '}
              <span className="text-xs sm:text-sm font-sans font-medium text-emerald-700">
                Wali ({rekap.persentaseSudah}%)
              </span>
            </div>
            <div className="text-[11px] sm:text-xs text-emerald-900 space-y-0.5 mt-0.5">
              <p className="font-semibold text-emerald-800">
                Est: {rekap.totalEstimasiRombongan || 0} Orang
              </p>
              <p className="text-[10px] sm:text-xs font-bold text-emerald-700">
                L: {rekap.sumSudahL || 0} | P: {rekap.sumSudahP || 0}
              </p>
            </div>
          </button>

          {/* Card 3: Belum Konfirmasi */}
          <button
            type="button"
            onClick={() => {
              setFilterStatus('BELUM');
              scrollToTable();
            }}
            className={`rounded-3xl p-4 sm:p-5 shadow-sm border-2 text-left transition-all duration-200 cursor-pointer relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 min-h-[140px] flex flex-col justify-between ${
              filterStatus === 'BELUM'
                ? 'bg-amber-50/90 border-amber-600 ring-2 ring-amber-500/30'
                : 'bg-[#FAF7F3] border-[#D5C4B4] hover:border-amber-500 hover:bg-amber-50/50'
            }`}
            title="Klik untuk memfilter data yang BELUM konfirmasi"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-800">
                Belum Konfirmasi
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors shrink-0 bg-amber-100 group-hover:bg-amber-600 group-hover:text-white text-amber-700">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-3xl font-serif font-black my-1 text-amber-900">
              {rekap.belumKonfirmasiCount}{' '}
              <span className="text-xs sm:text-sm font-sans font-medium text-amber-700">
                Wali ({100 - rekap.persentaseSudah}%)
              </span>
            </div>
            <div className="text-[10px] sm:text-xs font-semibold truncate text-amber-800">
              <span>Menunggu konfirmasi</span>
            </div>
          </button>

          {/* Card 4: Estimasi Kursi Hadir */}
          <button
            type="button"
            onClick={() => {
              setFilterStatus('SUDAH');
              scrollToTable();
            }}
            className="rounded-3xl p-4 sm:p-5 shadow-sm border-2 text-left transition-all duration-200 cursor-pointer relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 min-h-[140px] flex flex-col justify-between border-[#D5C4B4] hover:border-[#8C6A47] bg-[#FAF7F3] hover:bg-[#F5EFE6]"
            title="Klik untuk melihat rincian alokasi kursi hadir"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#8C6A47]">
                ESTIMASI KURSI HADIR
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors shrink-0 bg-[#EFE8E1] group-hover:bg-[#8C6A47] group-hover:text-white text-[#8C6A47]">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-3xl font-serif font-black my-1 text-[#422F21]">
              {rekap.totalEstimasiRombongan}{' '}
              <span className="text-xs sm:text-sm font-sans font-medium text-[#7A624E]">
                Kursi
              </span>
            </div>
            <div className="text-[10px] sm:text-xs font-medium truncate text-[#7A624E]">
              Alokasi santri &amp; rombongan
            </div>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 sm:gap-6 items-stretch">
          {/* Card 1: TOTAL TAMU UNDANGAN */}
          <button
            type="button"
            onClick={() => {
              setFilterStatus('SEMUA');
              scrollToTable();
            }}
            className={`rounded-3xl p-4 sm:p-5 shadow-sm border-2 text-left transition-all duration-200 cursor-pointer relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 min-h-[140px] flex flex-col justify-between ${
              filterStatus === 'SEMUA'
                ? 'bg-[#FAF7F3] border-[#8C6A47] ring-2 ring-[#8C6A47]/30'
                : 'bg-[#FAF7F3] border-[#D5C4B4] hover:border-[#8C6A47]'
            }`}
            title="Klik untuk menampilkan seluruh tamu undangan"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-[#7A624E] uppercase tracking-wider group-hover:text-[#422F21]">
                TOTAL TAMU UNDANGAN
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#EFE8E1] group-hover:bg-[#8C6A47] group-hover:text-white flex items-center justify-center text-[#8C6A47] transition-colors shrink-0">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-3xl font-serif font-black text-[#422F21] my-1">
              {rekap.totalTamu}{' '}
              <span className="text-xs sm:text-sm font-sans font-medium text-[#7A624E]">
                Tamu
              </span>
            </div>
            <div className="text-[10px] sm:text-xs text-[#8C6A47] font-semibold flex items-center justify-between truncate">
              <span className="truncate">Kuota: {rekap.totalKuotaTamu} Kursi</span>
            </div>
          </button>

          {/* Card 2: KONFIRMASI HADIR */}
          <button
            type="button"
            onClick={() => {
              setFilterStatus('HADIR');
              scrollToTable();
            }}
            className={`rounded-3xl p-4 sm:p-5 shadow-sm border-2 text-left transition-all duration-200 cursor-pointer relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 min-h-[140px] flex flex-col justify-between ${
              filterStatus === 'HADIR'
                ? 'bg-emerald-50/90 border-emerald-600 ring-2 ring-emerald-500/30'
                : 'bg-[#FAF7F3] border-[#D5C4B4] hover:border-emerald-500 hover:bg-emerald-50/50'
            }`}
            title="Klik untuk memfilter tamu yang KONFIRMASI HADIR"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-emerald-800 uppercase tracking-wider">
                KONFIRMASI HADIR
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-100 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center text-emerald-700 transition-colors shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-3xl font-serif font-black text-emerald-900 my-1">
              {rekap.tamuHadirCount}{' '}
              <span className="text-xs sm:text-sm font-sans font-medium text-emerald-700">
                Tamu ({rekap.persenTamuHadir}%)
              </span>
            </div>
            <div className="text-[10px] sm:text-xs font-bold text-emerald-700">
              L: {rekap.countTamuHadirL} | P: {rekap.countTamuHadirP}
            </div>
            <div className="text-[10px] sm:text-xs font-semibold text-emerald-800 truncate">
              <span>Siap hadir di acara</span>
            </div>
          </button>

          {/* Card 3: KONFIRMASI TIDAK HADIR */}
          <button
            type="button"
            onClick={() => {
              setFilterStatus('BERHALANGAN');
              scrollToTable();
            }}
            className={`rounded-3xl p-4 sm:p-5 shadow-sm border-2 text-left transition-all duration-200 cursor-pointer relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 min-h-[140px] flex flex-col justify-between ${
              filterStatus === 'BERHALANGAN'
                ? 'bg-rose-50/90 border-rose-600 ring-2 ring-rose-500/30'
                : 'bg-[#FAF7F3] border-[#D5C4B4] hover:border-rose-500 hover:bg-rose-50/50'
            }`}
            title="Klik untuk memfilter tamu yang BERHALANGAN HADIR"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-800">
                KONFIRMASI TIDAK HADIR
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors shrink-0 bg-rose-100 group-hover:bg-rose-600 group-hover:text-white text-rose-700">
                <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-3xl font-serif font-black my-1 text-rose-900">
              {rekap.tamuBerhalanganCount}{' '}
              <span className="text-xs sm:text-sm font-sans font-medium text-rose-700">
                Tamu ({rekap.persenTamuBerhalangan}%)
              </span>
            </div>
            <div className="text-[10px] sm:text-xs font-bold text-rose-700">
              L: {rekap.countTamuBerhalanganL} | P: {rekap.countTamuBerhalanganP}
            </div>
            <div className="text-[10px] sm:text-xs font-semibold truncate text-rose-800">
              <span>Tidak bisa hadir</span>
            </div>
          </button>

          {/* Card 4: BELUM KONFIRMASI */}
          <button
            type="button"
            onClick={() => {
              setFilterStatus('BELUM');
              scrollToTable();
            }}
            className={`rounded-3xl p-4 sm:p-5 shadow-sm border-2 text-left transition-all duration-200 cursor-pointer relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 min-h-[140px] flex flex-col justify-between ${
              filterStatus === 'BELUM'
                ? 'bg-amber-50/90 border-amber-600 ring-2 ring-amber-500/30'
                : 'bg-[#FAF7F3] border-[#D5C4B4] hover:border-amber-500 hover:bg-amber-50/50'
            }`}
            title="Klik untuk memfilter tamu yang BELUM konfirmasi"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-800">
                BELUM KONFIRMASI
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors shrink-0 bg-amber-100 group-hover:bg-amber-600 group-hover:text-white text-amber-700">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-3xl font-serif font-black my-1 text-amber-900">
              {rekap.tamuBelumCount}{' '}
              <span className="text-xs sm:text-sm font-sans font-medium text-amber-700">
                Tamu ({rekap.persenTamuBelum}%)
              </span>
            </div>
            <div className="text-[10px] sm:text-xs font-semibold truncate text-amber-800">
              <span>Menunggu respon</span>
            </div>
          </button>
        </div>
      )}

      {/* FILTER & PENCARIAN + TABEL SECTION */}
      <div
        id="tabel-konfirmasi"
        className="bg-[#FAF7F3] rounded-3xl p-4 sm:p-6 shadow-sm border-2 border-[#D5C4B4] space-y-4 scroll-mt-6"
      >
        {/* Toggle Switch Status Konfirmasi dengan Scroll Horizontal di Mobile */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-2 bg-[#EFE8E1]/70 rounded-2xl border border-[#D5C4B4]">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 -mx-1 px-1 whitespace-nowrap no-scrollbar">
            <span className="text-xs font-bold text-[#7A624E] pl-1 hidden sm:inline">Status:</span>
            {activeMainTab === 'WALI_SANTRI' ? (
              <>
                <button
                  type="button"
                  onClick={() => setFilterStatus('SEMUA')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    filterStatus === 'SEMUA'
                      ? 'bg-[#8C6A47] text-white shadow-sm'
                      : 'bg-white text-[#7A624E] hover:bg-[#FAF7F3] border border-[#D5C4B4]'
                  }`}
                >
                  Semua ({daftarSantriCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('SUDAH')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                    filterStatus === 'SUDAH'
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-white text-emerald-800 hover:bg-[#FAF7F3] border border-[#D5C4B4]'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sudah Konfirmasi ({rekap.sudahKonfirmasiCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('BELUM')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                    filterStatus === 'BELUM'
                      ? 'bg-amber-700 text-white shadow-sm'
                      : 'bg-white text-amber-800 hover:bg-[#FAF7F3] border border-[#D5C4B4]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Belum Konfirmasi ({rekap.belumKonfirmasiCount})</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setFilterStatus('SEMUA')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    filterStatus === 'SEMUA'
                      ? 'bg-[#8C6A47] text-white shadow-sm'
                      : 'bg-white text-[#7A624E] hover:bg-[#FAF7F3] border border-[#D5C4B4]'
                  }`}
                >
                  Semua ({daftarTamuCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('HADIR')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                    filterStatus === 'HADIR'
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-white text-emerald-800 hover:bg-[#FAF7F3] border border-[#D5C4B4]'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Konfirmasi Hadir ({rekap.tamuHadirCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('BERHALANGAN')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                    filterStatus === 'BERHALANGAN'
                      ? 'bg-rose-700 text-white shadow-sm'
                      : 'bg-white text-rose-800 hover:bg-[#FAF7F3] border border-[#D5C4B4]'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Tidak Hadir ({rekap.tamuBerhalanganCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('BELUM')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                    filterStatus === 'BELUM'
                      ? 'bg-amber-700 text-white shadow-sm'
                      : 'bg-white text-amber-800 hover:bg-[#FAF7F3] border border-[#D5C4B4]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Belum Konfirmasi ({rekap.tamuBelumCount})</span>
                </button>
              </>
            )}
          </div>

          <div className="text-[11px] sm:text-xs text-[#7A624E] font-medium self-end md:self-auto">
            Menampilkan {filteredCount} dari {currentDatasetCount}{' '}
            {activeMainTab === 'WALI_SANTRI' ? 'santri' : 'tamu'}
          </div>
        </div>

        {/* Bar Filter Kategori & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8C6A47] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeMainTab === 'WALI_SANTRI'
                  ? 'Cari nama santri, wali, kode (SH0001), kelas, kamar, alamat...'
                  : 'Cari nama tamu, instansi, kode (UND0001), alamat, no hp...'
              }
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border-2 border-[#D5C4B4] text-xs text-[#422F21] placeholder-[#7A624E]/70 focus:outline-none focus:border-[#8C6A47] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#7A624E] hover:text-[#422F21]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Kategori Dropdown */}
          {activeMainTab === 'WALI_SANTRI' && (
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <span className="text-xs font-bold text-[#7A624E] hidden sm:inline shrink-0">
                Kategori:
              </span>
              <select
                value={filterKategori}
                onChange={(e) => setFilterKategori(e.target.value as FilterKategoriType)}
                className="w-full md:w-auto px-3 py-2.5 rounded-2xl bg-white border-2 border-[#D5C4B4] text-xs font-semibold text-[#422F21] focus:outline-none focus:border-[#8C6A47]"
              >
                <option value="SEMUA">Semua Kategori ({rekap.totalSantri})</option>
                <option value="BIL_GHOIB">Bil Ghoib ({rekap.bilGhoibCount} Santri)</option>
                <option value="BIN_NADZOR">Bin Nadzori ({rekap.binNadzorCount} Santri)</option>
                <option value="TAMATAN">Tamatan III Aliyah ({rekap.tamatanCount} Santri)</option>
              </select>
            </div>
          )}
        </div>

        {children}
      </div>
    </>
  );
}
