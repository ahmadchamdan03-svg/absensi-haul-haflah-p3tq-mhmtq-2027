'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { BAGIAN_TAMATAN_LIST } from '@/lib/types';

export interface WhatsAppFilterProps {
  activeTab: 'WALI_SANTRI' | 'TAMU_UNDANGAN';
  // Wali Santri Filter Props
  gelombang: 1 | 2 | 3;
  totalTerkirim: number;
  keluargaCount: number;
  pctTerkirim: number;
  filterKonfirmasi: 'SEMUA' | 'BELUM' | 'SUDAH';
  setFilterKonfirmasi: (val: 'SEMUA' | 'BELUM' | 'SUDAH') => void;
  filterKategori: string;
  setFilterKategori: (val: string) => void;
  filterBagian: string;
  setFilterBagian: (val: string) => void;
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  search: string;
  setSearch: (val: string) => void;
  countBilGhoib: number;
  countBinNadzor: number;
  countTamatan: number;
  countPerBagian: Record<string, number>;
  // Tamu Undangan Filter Props
  totalTamuTerkirim: number;
  tamuCount: number;
  pctTamuTerkirim: number;
  tamuFilterGolongan: string;
  setTamuFilterGolongan: (val: string) => void;
  tamuFilterStatus: string;
  setTamuFilterStatus: (val: string) => void;
  tamuFilterJalurStatus: string;
  setTamuFilterJalurStatus: (val: string) => void;
  tamuSearch: string;
  setTamuSearch: (val: string) => void;
  countTamuIstimewa: number;
  countTamuKehormatan: number;
  countTamuUmum: number;
  countJalurKosong: number;
}

export default function WhatsAppFilter({
  activeTab,
  gelombang,
  totalTerkirim,
  keluargaCount,
  pctTerkirim,
  filterKonfirmasi,
  setFilterKonfirmasi,
  filterKategori,
  setFilterKategori,
  filterBagian,
  setFilterBagian,
  filterStatus,
  setFilterStatus,
  search,
  setSearch,
  countBilGhoib,
  countBinNadzor,
  countTamatan,
  countPerBagian,
  totalTamuTerkirim,
  tamuCount,
  pctTamuTerkirim,
  tamuFilterGolongan,
  setTamuFilterGolongan,
  tamuFilterStatus,
  setTamuFilterStatus,
  tamuFilterJalurStatus,
  setTamuFilterJalurStatus,
  tamuSearch,
  setTamuSearch,
  countTamuIstimewa,
  countTamuKehormatan,
  countTamuUmum,
  countJalurKosong,
}: WhatsAppFilterProps) {
  if (activeTab === 'WALI_SANTRI') {
    return (
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            PROGRES PENGIRIMAN ({gelombang === 1 ? 'UNDANGAN MASUK' : gelombang === 2 ? 'KUOTA TAMBAHAN' : 'PENGINGAT KONFIRMASI'}):
          </div>
          <div className="text-lg font-black text-slate-900 mt-0.5">
            Terkirim {totalTerkirim} / {keluargaCount}{' '}
            <span className="text-sm font-semibold text-emerald-700">({pctTerkirim}%)</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterKonfirmasi}
            onChange={(e) => setFilterKonfirmasi(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-amber-300 text-xs focus:outline-none bg-amber-50 text-amber-950 font-bold"
          >
            <option value="SEMUA">Semua Status Konfirmasi</option>
            <option value="BELUM">Belum Konfirmasi Kehadiran</option>
            <option value="SUDAH">Sudah Konfirmasi Kehadiran</option>
          </select>

          <select
            value={filterKategori}
            onChange={(e) => {
              setFilterKategori(e.target.value);
              setFilterBagian('SEMUA');
            }}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none bg-slate-50"
          >
            <option value="SEMUA">Semua Kategori ({keluargaCount})</option>
            <option value="BIL_GHOIB">Bil Ghoib ({countBilGhoib})</option>
            <option value="BIN_NADZOR">Bin Nadzori ({countBinNadzor})</option>
            <option value="TAMATAN">Tamatan ({countTamatan})</option>
          </select>

          <select
            value={filterBagian}
            onChange={(e) => {
              const val = e.target.value;
              setFilterBagian(val);
              if (val === 'BIL_GHOIB') setFilterKategori('BIL_GHOIB');
              else if (val === 'BIN_NADZOR') setFilterKategori('BIN_NADZOR');
              else if (val === 'TAMATAN_SEMUA' || val.startsWith('A.') || val.startsWith('B.')) setFilterKategori('TAMATAN');
              else if (val === 'SEMUA') setFilterKategori('SEMUA');
            }}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none bg-slate-50"
          >
            <option value="SEMUA">Semua Kategori &amp; Bagian ({keluargaCount})</option>
            <option value="BIL_GHOIB">Bil Ghoib ({countBilGhoib})</option>
            <option value="BIN_NADZOR">Bin Nadzori ({countBinNadzor})</option>
            <option value="TAMATAN_SEMUA">Semua Bagian Tamatan ({countTamatan})</option>
            {BAGIAN_TAMATAN_LIST.map((bg) => (
              <option key={bg} value={bg}>
                Bagian {bg} ({countPerBagian[bg] || 0})
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none bg-slate-50"
          >
            <option value="SEMUA">Semua Pengiriman</option>
            <option value="BELUM">Belum Terkirim</option>
            <option value="TERKIRIM">Sudah Terkirim</option>
            <option value="BERMASALAH">Nomor Bermasalah / Kosong / Tidak Terdaftar</option>
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari wali / santri / HP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#8C6A47] w-44"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
      <div>
        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
          PROGRES PENGIRIMAN TAMU UNDANGAN:
        </div>
        <div className="text-lg font-black text-slate-900 mt-0.5">
          Terkirim {totalTamuTerkirim} / {tamuCount}{' '}
          <span className="text-sm font-semibold text-emerald-700">({pctTamuTerkirim}%)</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Filter Golongan Tamu */}
        <select
          value={tamuFilterGolongan}
          onChange={(e) => setTamuFilterGolongan(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none bg-slate-50"
        >
          <option value="SEMUA">Semua Golongan ({tamuCount})</option>
          <option value="ISTIMEWA">Istimewa ({countTamuIstimewa})</option>
          <option value="KEHORMATAN">Kehormatan ({countTamuKehormatan})</option>
          <option value="UMUM">Umum ({countTamuUmum})</option>
        </select>

        {/* Filter Status WA */}
        <select
          value={tamuFilterStatus}
          onChange={(e) => setTamuFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none bg-slate-50"
        >
          <option value="SEMUA">Semua Status WA</option>
          <option value="BELUM">Belum Terkirim</option>
          <option value="TERKIRIM">Sudah Terkirim</option>
          <option value="BERMASALAH">Nomor Bermasalah / Kosong / Tidak Terdaftar</option>
        </select>

        {/* Filter Status Jalur Masuk */}
        <select
          value={tamuFilterJalurStatus}
          onChange={(e) => setTamuFilterJalurStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none bg-slate-50"
        >
          <option value="SEMUA">Semua Jalur Masuk</option>
          <option value="TERISI">Jalur Masuk Terisi</option>
          <option value="KOSONG">Jalur Masuk Kosong ({countJalurKosong})</option>
        </select>

        {/* Search Tamu */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari tamu / instansi / jalur / kode..."
            value={tamuSearch}
            onChange={(e) => setTamuSearch(e.target.value)}
            className="pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#8C6A47] w-48"
          />
        </div>
      </div>
    </div>
  );
}
