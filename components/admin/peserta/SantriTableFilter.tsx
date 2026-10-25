'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { BAGIAN_TAMATAN_LIST } from '@/lib/types';
import { matchUndanganCategory } from './TamuModal';

export interface SubFilterOption {
  value: string;
  label: string;
}

export function computeSantriSubFilterOptions(
  activeTab: string,
  allItems: any[],
  stats: any
): SubFilterOption[] {
  switch (activeTab) {
    case 'TAMATAN': {
      return [
        { value: 'SEMUA', label: `Semua Bagian Tamatan (${stats.tamatanCount})` },
        ...BAGIAN_TAMATAN_LIST.map((bg) => {
          const count = allItems.filter(
            (it) => it.kategoriUtama === 'TAMATAN' && it.bagianTamatan === bg
          ).length;
          return { value: bg, label: `Bagian ${bg} (${count})` };
        }),
      ];
    }

    case 'BIL_GHOIB': {
      const distinctKamar = Array.from(
        new Set(
          allItems
            .filter((it) => it.kategoriUtama === 'BIL_GHOIB' && it.kamar && it.kamar !== '-')
            .map((it) => it.kamar)
        )
      );

      return [
        { value: 'SEMUA', label: `Semua Santri Bil Ghoib (${stats.bilGhoibCount})` },
        ...distinctKamar.map((kmr) => {
          const count = allItems.filter(
            (it) => it.kategoriUtama === 'BIL_GHOIB' && it.kamar === kmr
          ).length;
          return { value: `KAMAR:${kmr}`, label: `Kamar ${kmr} (${count})` };
        }),
      ];
    }

    case 'BIN_NADZOR': {
      const distinctKelas = [
        { key: '2 Tsanawiyah', label: '2 Tsanawiyyah' },
        { key: '3 Tsanawiyah', label: '3 Tsanawiyyah' },
        { key: '1 Aliyah', label: '1 Aliyah' },
        { key: '2 Aliyah', label: '2 Aliyah' },
        { key: '3 Aliyah', label: '3 Aliyah & Mutakhorijat' },
      ];
      const distinctKamar = Array.from(
        new Set(
          allItems
            .filter((it) => it.kategoriUtama === 'BIN_NADZOR' && it.kamar && it.kamar !== '-')
            .map((it) => it.kamar)
        )
      );

      return [
        { value: 'SEMUA', label: `Semua Santri Bin Nadzori (${stats.binNadzorCount})` },
        ...distinctKelas.map((kls) => {
          const count = allItems.filter(
            (it) =>
              it.kategoriUtama === 'BIN_NADZOR' &&
              ((it.kelas || '').toLowerCase().includes(kls.key.toLowerCase()) ||
                (it.subKategori || '').toLowerCase().includes(kls.key.toLowerCase()))
          ).length;
          return { value: `KELAS:${kls.key}`, label: `Jenjang: ${kls.label} (${count})` };
        }),
        ...distinctKamar.map((kmr) => {
          const count = allItems.filter(
            (it) => it.kategoriUtama === 'BIN_NADZOR' && it.kamar === kmr
          ).length;
          return { value: `KAMAR:${kmr}`, label: `Kamar: ${kmr} (${count})` };
        }),
      ];
    }

    case 'SEMUA':
    default: {
      return [
        { value: 'SEMUA', label: `Semua Kategori & Bagian (${stats.totalSemua})` },
        { value: 'BIL_GHOIB', label: `Bil Ghoib (${stats.bilGhoibCount})` },
        { value: 'BIN_NADZOR', label: `Bin Nadzori (${stats.binNadzorCount})` },
        { value: 'TAMATAN', label: `Semua Tamatan (${stats.tamatanCount})` },
        ...BAGIAN_TAMATAN_LIST.map((bg) => {
          const count = allItems.filter(
            (it) => it.kategoriUtama === 'TAMATAN' && it.bagianTamatan === bg
          ).length;
          return { value: bg, label: `— Tamatan Bagian ${bg} (${count})` };
        }),
        {
          value: 'UNDANGAN_ISTIMEWA',
          label: `🌟 Istimewa (VVIP & VIP) (${stats.undanganIstimewaCount})`,
        },
        {
          value: 'UNDANGAN_KEHORMATAN',
          label: `🏛️ Kehormatan (Tamu Khusus) (${stats.undanganKehormatanCount})`,
        },
        {
          value: 'UNDANGAN_UMUM',
          label: `👥 Tamu Undangan Umum (${stats.undanganUmumCount})`,
        },
      ];
    }
  }
}

export function filterSantriTableItems(params: {
  allItems: any[];
  activeTab: string;
  bagianFilter: string;
  statusHadirFilter: 'SEMUA' | 'SUDAH' | 'BELUM';
  searchTerm: string;
}) {
  const { allItems, activeTab, bagianFilter, statusHadirFilter, searchTerm } = params;

  return allItems.filter((item) => {
    // 1. Tab filter
    if (activeTab === 'BIL_GHOIB' && item.kategoriUtama !== 'BIL_GHOIB') return false;
    if (activeTab === 'BIN_NADZOR' && item.kategoriUtama !== 'BIN_NADZOR') return false;
    if (activeTab === 'TAMATAN' && item.kategoriUtama !== 'TAMATAN') return false;

    // 2. Sub Filter dinamis (bagianFilter)
    if (bagianFilter && bagianFilter !== 'SEMUA') {
      if (activeTab === 'SEMUA') {
        if (bagianFilter === 'BIL_GHOIB') {
          if (item.kategoriUtama !== 'BIL_GHOIB') return false;
        } else if (bagianFilter === 'BIN_NADZOR') {
          if (item.kategoriUtama !== 'BIN_NADZOR') return false;
        } else if (bagianFilter === 'TAMATAN') {
          if (item.kategoriUtama !== 'TAMATAN') return false;
        } else if (bagianFilter.startsWith('A.') || bagianFilter.startsWith('B.')) {
          if (item.kategoriUtama !== 'TAMATAN' || item.bagianTamatan !== bagianFilter) return false;
        } else if (bagianFilter === 'UNDANGAN') {
          if (item.tipe !== 'UNDANGAN') return false;
        } else if (bagianFilter === 'UNDANGAN_ISTIMEWA') {
          if (item.tipe !== 'UNDANGAN' || item.golonganUndangan !== 'ISTIMEWA') return false;
        } else if (bagianFilter === 'UNDANGAN_KEHORMATAN') {
          if (item.tipe !== 'UNDANGAN' || item.golonganUndangan !== 'KEHORMATAN') return false;
        } else if (bagianFilter === 'UNDANGAN_UMUM') {
          if (item.tipe !== 'UNDANGAN' || item.golonganUndangan !== 'UMUM') return false;
        }
      } else if (activeTab === 'TAMATAN') {
        if (item.bagianTamatan !== bagianFilter) return false;
      } else if (activeTab === 'BIL_GHOIB' || activeTab === 'BIN_NADZOR') {
        if (bagianFilter.startsWith('KAMAR:') && item.kamar !== bagianFilter.replace('KAMAR:', '')) {
          return false;
        }
        if (bagianFilter.startsWith('KELAS:')) {
          const targetKls = bagianFilter.replace('KELAS:', '').toLowerCase();
          const itemKls = (item.kelas || '').toLowerCase();
          const itemSub = (item.subKategori || '').toLowerCase();
          if (!itemKls.includes(targetKls) && !itemSub.includes(targetKls)) {
            return false;
          }
        }
      } else if (
        activeTab === 'UNDANGAN_ISTIMEWA' ||
        activeTab === 'UNDANGAN_KEHORMATAN' ||
        activeTab === 'UNDANGAN_UMUM'
      ) {
        if (!matchUndanganCategory(item.kategori, bagianFilter)) return false;
      }
    }

    // Status Hadir
    if (statusHadirFilter === 'SUDAH' && item.terpakai === 0) return false;
    if (statusHadirFilter === 'BELUM' && item.terpakai > 0) return false;

    // Search term
    if (searchTerm.trim()) {
      const normalize = (s: string) => (s || '').toLowerCase().replace(/yy/g, 'y');
      const q = normalize(searchTerm);
      const matchKode = normalize(item.kode).includes(q);
      const matchNama = normalize(item.nama).includes(q);
      const matchWali = normalize(item.namaWali).includes(q);
      const matchHp = normalize(item.noHp).includes(q);
      const matchAlamat = normalize(item.alamat).includes(q);
      const matchKamar = normalize(item.kamar).includes(q);
      const matchBagian = normalize(item.bagianTamatan).includes(q);
      const matchKelas = normalize(item.kelas || '').includes(q);
      const matchSub = normalize(item.subKategori || item.kategori || '').includes(q);
      return (
        matchKode ||
        matchNama ||
        matchWali ||
        matchHp ||
        matchAlamat ||
        matchKamar ||
        matchBagian ||
        matchKelas ||
        matchSub
      );
    }

    return true;
  });
}

export interface SantriTableFilterProps {
  tabsHeader?: React.ReactNode;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  bagianFilter: string;
  setBagianFilter: (val: string) => void;
  statusHadirFilter: 'SEMUA' | 'SUDAH' | 'BELUM';
  setStatusHadirFilter: (val: 'SEMUA' | 'SUDAH' | 'BELUM') => void;
  subFilterOptions: SubFilterOption[];
  filteredCount: number;
  pageSize: number;
  setPageSize: (val: number) => void;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

export default function SantriTableFilter({
  tabsHeader,
  searchTerm,
  setSearchTerm,
  bagianFilter,
  setBagianFilter,
  statusHadirFilter,
  setStatusHadirFilter,
  subFilterOptions,
  filteredCount,
  pageSize,
  setPageSize,
  setCurrentPage,
}: SantriTableFilterProps) {
  return (
    <div className="max-w-7xl mx-auto bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
      {tabsHeader}

      {/* Bar Pencarian & Dropdown Filter Bagian Tamatan */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Input Pencarian */}
        <div
          className={`${
            subFilterOptions.length > 0 ? 'sm:col-span-6' : 'sm:col-span-9'
          } relative`}
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari nama santri, wali, kode (SH0001...), no HP, kamar, kota..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-opera-700"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sub / Bagian Filter Dinamis */}
        {subFilterOptions.length > 0 && (
          <div className="sm:col-span-3">
            <select
              value={bagianFilter}
              onChange={(e) => {
                setBagianFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-opera-700 bg-amber-50/40 text-amber-950 font-medium"
            >
              {subFilterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status Hadir */}
        <div className="sm:col-span-3">
          <select
            value={statusHadirFilter}
            onChange={(e) => {
              setStatusHadirFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-opera-700"
          >
            <option value="SEMUA">Semua Status Hadir</option>
            <option value="SUDAH">Sudah Hadir / Check-in</option>
            <option value="BELUM">Belum Hadir</option>
          </select>
        </div>
      </div>

      {/* Ringkasan Hasil & Limit Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
        <div>
          Menampilkan <strong className="text-slate-800">{filteredCount}</strong> data peserta
          {searchTerm && ` untuk pencarian "${searchTerm}"`}
          {bagianFilter !== 'SEMUA' && subFilterOptions.length > 0 && (
            <span className="ml-1 text-opera-700 font-semibold">
              [
              {subFilterOptions.find((o) => o.value === bagianFilter)?.label ||
                bagianFilter.replace('KAMAR:', 'Kamar ')}
              ]
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <span>Baris per halaman:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 rounded-lg border border-slate-300 text-xs"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={600}>Semua ({filteredCount})</option>
          </select>
        </div>
      </div>
    </div>
  );
}
