'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Search,
  Trash2,
  Edit,
  QrCode,
  Phone,
  ChevronLeft,
  ChevronRight,
  X,
  UserCheck,
  Check,
} from 'lucide-react';
import { store } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';
import { BAGIAN_TAMATAN_LIST, getWarnaTiketUndangan } from '@/lib/types';
import { matchUndanganCategory } from './TamuModal';

export interface SantriTableProps {
  tabsHeader?: React.ReactNode;
  activeTab: string;
  allItems: any[];
  stats: {
    totalSantri: number;
    bilGhoibCount: number;
    binNadzorCount: number;
    tamatanCount: number;
    undanganCount: number;
    undanganIstimewaCount: number;
    undanganKehormatanCount: number;
    undanganUmumCount: number;
    totalSemua: number;
    totalKuota: number;
    totalHadir: number;
  };
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  bagianFilter: string;
  setBagianFilter: (val: string) => void;
  statusHadirFilter: 'SEMUA' | 'SUDAH' | 'BELUM';
  setStatusHadirFilter: (val: 'SEMUA' | 'SUDAH' | 'BELUM') => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  pageSize: number;
  setPageSize: (val: number) => void;
  setQrDetailItem: (item: any | null) => void;
  handleOpenEdit: (item: any) => void;
  setDeletingItem: (item: any | null) => void;
  onRefreshData: () => Promise<void>;
  showToast: (msg: string) => void;
}

export default function SantriTable({
  tabsHeader,
  activeTab,
  allItems,
  stats,
  searchTerm,
  setSearchTerm,
  bagianFilter,
  setBagianFilter,
  statusHadirFilter,
  setStatusHadirFilter,
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
  setQrDetailItem,
  handleOpenEdit,
  setDeletingItem,
  onRefreshData,
  showToast,
}: SantriTableProps) {
  const [fastTrackLoading, setFastTrackLoading] = useState<string | null>(null);

  const handleFastTrackVip = async (item: any) => {
    setFastTrackLoading(item.kode);
    try {
      const kuotaDasar = item.kuotaDasar || 2;
      const kuotaTambahan = item.kuotaTambahan || 0;
      const totalKuotaItem = kuotaDasar + kuotaTambahan;

      let jumlahL = 1;
      let jumlahP = 0;
      if (item.namaPutra && item.namaPutri) {
        jumlahL = Math.ceil(totalKuotaItem / 2);
        jumlahP = Math.floor(totalKuotaItem / 2);
      } else if (item.namaPutra) {
        jumlahL = totalKuotaItem;
        jumlahP = 0;
      } else if (item.namaPutri) {
        jumlahL = 0;
        jumlahP = totalKuotaItem;
      } else {
        const lower = (item.nama || '').toLowerCase();
        const isFemale = ['nyai', 'hj.', 'ning', 'ibu', 'ustadzah', 'hajah', 'biyung'].some((h) => lower.includes(h));
        if (isFemale) {
          jumlahL = 0;
          jumlahP = totalKuotaItem;
        } else {
          jumlahL = totalKuotaItem;
          jumlahP = 0;
        }
      }

      const { error: errUpdate } = await supabase
        .from('tamu_undangan')
        .update({ kuota_terpakai: totalKuotaItem })
        .eq('kode', item.kode);

      if (errUpdate) console.warn('Fast track update error:', errUpdate);

      await supabase.from('presensi_log').insert([
        {
          kode_qr: item.kode,
          nama_peserta: item.nama,
          tipe_peserta: 'UNDANGAN',
          jalur: 'MEJA_TRANSIT',
          panitia_id: 'fast-track-vip',
          jumlah_l: jumlahL,
          jumlah_p: jumlahP,
          jumlah_balita: 0,
          tiket_panggung: '0',
          catatan: 'Fast-Track VIP Checkin',
          created_at: new Date().toISOString(),
        },
      ]);

      store.checkin(item.kode, totalKuotaItem, 0, 'BARAT', 0, 'fast-track-vip');
      await onRefreshData();
      showToast(`✓ Tamu VIP ${item.nama} (${item.kode}) berhasil dihadirkan!`);
    } catch (e: any) {
      console.warn('FastTrack error:', e);
    } finally {
      setFastTrackLoading(null);
    }
  };

  // Opsi dropdown sub-filter yang disesuaikan secara dinamis dengan activeTab (Santri & Semua)
  const subFilterOptions = useMemo(() => {
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
          { value: 'UNDANGAN_ISTIMEWA', label: `🌟 Istimewa (VVIP & VIP) (${stats.undanganIstimewaCount})` },
          { value: 'UNDANGAN_KEHORMATAN', label: `🏛️ Kehormatan (Tamu Khusus) (${stats.undanganKehormatanCount})` },
          { value: 'UNDANGAN_UMUM', label: `👥 Tamu Undangan Umum (${stats.undanganUmumCount})` },
        ];
      }
    }
  }, [activeTab, allItems, stats]);

  // Jaga agar bagianFilter selalu valid bila activeTab berganti
  useEffect(() => {
    const exists = subFilterOptions.some((o) => o.value === bagianFilter);
    if (!exists) {
      setBagianFilter('SEMUA');
    }
  }, [activeTab, subFilterOptions]);

  // Filter list
  const filteredItems = useMemo(() => {
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
  }, [allItems, activeTab, bagianFilter, statusHadirFilter, searchTerm]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  return (
    <>
      {/* Kontrol Filter & Tab Navigasi */}
      <div className="max-w-7xl mx-auto bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
        {tabsHeader}

        {/* Bar Pencarian & Dropdown Filter Bagian Tamatan */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Input Pencarian */}
          <div className={`${subFilterOptions.length > 0 ? 'sm:col-span-6' : 'sm:col-span-9'} relative`}>
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

          {/* Sub / Bagian Filter Dinamis Sesuai Tab Kategori (Hanya jika memiliki opsi) */}
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
            Menampilkan <strong className="text-slate-800">{filteredItems.length}</strong> data peserta
            {searchTerm && ` untuk pencarian "${searchTerm}"`}
            {bagianFilter !== 'SEMUA' && subFilterOptions.length > 0 && (
              <span className="ml-1 text-opera-700 font-semibold">
                [{subFilterOptions.find((o) => o.value === bagianFilter)?.label || bagianFilter.replace('KAMAR:', 'Kamar ')}]
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
              <option value={600}>Semua ({filteredItems.length})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabel Data Peserta */}
      <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Kode QR</th>
                <th className="py-3.5 px-4">Nama Santri & Kamar</th>
                <th className="py-3.5 px-4">Kategori & Bagian</th>
                <th className="py-3.5 px-4">Wali Santri / Alamat & Kontak</th>
                <th className="py-3.5 px-4 text-center">Hak Kuota</th>
                <th className="py-3.5 px-4 text-center">Status Hadir</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    {stats.totalSemua === 0 ? (
                      <div className="space-y-2 max-w-md mx-auto">
                        <p className="font-bold text-slate-700 text-sm">Daftar seluruh santri dan tamu undangan kosong (0 data).</p>
                        <p className="text-xs text-slate-500">Semua data santri peserta maupun tamu undangan telah berhasil dibersihkan. Anda dapat menambahkan data baru melalui tombol &ldquo;+ Tambah Santri&rdquo; atau &ldquo;+ Tambah Undangan&rdquo; di atas.</p>
                      </div>
                    ) : !activeTab.startsWith('UNDANGAN') && stats.totalSantri === 0 && activeTab !== 'SEMUA' ? (
                      <div className="space-y-2 max-w-md mx-auto">
                        <p className="font-bold text-slate-700 text-sm">Daftar santri peserta kategori ini kosong (0 santri).</p>
                        <p className="text-xs text-slate-500">Semua data santri telah dibersihkan. Anda dapat menambahkan santri baru dengan tombol &ldquo;+ Tambah Santri&rdquo; di atas.</p>
                      </div>
                    ) : (
                      'Tidak ada data peserta atau tamu yang cocok dengan kriteria pencarian.'
                    )}
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, index) => {
                  const globalIndex = (currentPage - 1) * pageSize + index + 1;
                  const isBilGhoib = item.kategoriUtama === 'BIL_GHOIB';
                  const isBinNadzor = item.kategoriUtama === 'BIN_NADZOR';
                  const isTamatan = item.kategoriUtama === 'TAMATAN';
                  const isUndangan = item.tipe === 'UNDANGAN';

                  return (
                    <tr key={item.kode} className="hover:bg-slate-50/80 transition-colors">
                      {/* No */}
                      <td className="py-3 px-4 text-center text-slate-400 font-mono">
                        {globalIndex}
                      </td>

                      {/* Kode QR & Kartu Modal */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          onClick={() => setQrDetailItem(item)}
                          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-mono font-bold text-xs bg-slate-100 hover:bg-opera-50 hover:text-opera-850 hover:border-opera-300 border border-slate-200 transition-colors group"
                        >
                          <QrCode className="w-3.5 h-3.5 text-slate-500 group-hover:text-opera-700" />
                          <span>{item.kode}</span>
                        </button>
                      </td>

                      {/* Nama & Kamar */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 leading-snug">{item.nama}</div>
                        {item.kamar && item.kamar !== '-' && (
                          <div className="text-[11px] text-slate-500">Kamar: {item.kamar}</div>
                        )}
                        {isUndangan && item.golonganUndangan === 'ISTIMEWA' && item.namaPutra && item.namaPutri && (
                          <div className="text-[10px] text-amber-800/80 mt-0.5 font-medium flex items-center space-x-1">
                            <span>🤵 {item.namaPutra}</span>
                            <span>·</span>
                            <span>🧕 {item.namaPutri}</span>
                          </div>
                        )}
                      </td>

                      {/* Kategori & Bagian (Disesuaikan) */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`inline-block w-2.5 h-2.5 rounded-full ${
                              isBilGhoib
                                ? 'bg-emerald-500'
                                : isBinNadzor
                                ? 'bg-blue-500'
                                : isTamatan
                                ? 'bg-amber-500'
                                : item.golonganUndangan === 'ISTIMEWA'
                                ? 'bg-amber-600'
                                : item.golonganUndangan === 'KEHORMATAN'
                                ? 'bg-purple-600'
                                : 'bg-cyan-600'
                            }`}
                          ></span>
                          <span className="font-bold text-slate-800">
                            {isBilGhoib
                              ? 'Bil Ghoib'
                              : isBinNadzor
                              ? 'Bin Nadzori'
                              : isTamatan
                              ? 'Tamatan'
                              : item.golonganUndangan === 'ISTIMEWA'
                              ? 'Undangan Istimewa'
                              : item.golonganUndangan === 'KEHORMATAN'
                              ? 'Undangan Kehormatan'
                              : 'Undangan Umum'}
                          </span>
                        </div>
                        {isTamatan && item.bagianTamatan && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 mt-0.5">
                            Bagian {item.bagianTamatan}
                          </span>
                        )}
                        {isUndangan && (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border mt-0.5 ${
                              item.golonganUndangan === 'ISTIMEWA'
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : item.golonganUndangan === 'KEHORMATAN'
                                ? 'bg-purple-50 text-purple-900 border-purple-300'
                                : 'bg-cyan-50 text-cyan-900 border-cyan-300'
                            }`}
                          >
                            {item.golonganUndangan === 'KEHORMATAN' ? 'Tamu Kehormatan' : (item.kategori || 'VIP')}
                          </span>
                        )}
                      </td>

                      {/* Wali Santri / Alamat & Kontak */}
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">
                          {isUndangan ? (
                            item.golonganUndangan === 'ISTIMEWA' ? (
                              <span className="text-amber-900 font-semibold flex items-center space-x-1">
                                <span>📍 {item.alamat || item.instansi || 'Kediri'}</span>
                              </span>
                            ) : item.golonganUndangan === 'KEHORMATAN' ? (
                              <span className="text-purple-950 font-semibold flex items-center space-x-1">
                                <span>📍 {item.alamat || item.instansi || 'Kediri'}</span>
                              </span>
                            ) : (
                              <div>
                                <div className="font-semibold text-slate-800">{item.instansi || 'Pondok Pesantren Lirboyo'}</div>
                                {item.alamat && item.alamat !== '-' && item.alamat !== item.instansi && (
                                  <div className="text-[11px] text-slate-500 font-normal">📍 {item.alamat}</div>
                                )}
                              </div>
                            )
                          ) : (
                            item.namaWali
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                          {item.noHp && item.noHp !== '-' && (
                            <a
                              href={`https://wa.me/${item.noHp.replace(/^0/, '62')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center text-emerald-700 hover:underline"
                            >
                              <Phone className="w-3 h-3 mr-0.5" />
                              <span>{item.noHp}</span>
                            </a>
                          )}
                          {item.alamat && !isUndangan && <span>· {item.alamat}</span>}
                          {isUndangan && item.golonganUndangan === 'ISTIMEWA' && (item.namaPutra || item.namaPutri) && (
                            <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              {item.namaPutra && item.namaPutri ? 'Putra & Putri' : item.namaPutra ? 'Putra' : 'Putri'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Hak Kuota */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="font-bold text-slate-800">
                          {item.kuotaDasar + item.kuotaTambahan} Kursi
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 space-y-0.5">
                          {isBilGhoib && (
                            <>
                              <span className="inline-block font-bold text-slate-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded text-[10px]">
                                Hitam Gold
                              </span>
                              <span className="text-[9px] text-amber-800 font-bold block">
                                Wali Maju Panggung
                              </span>
                            </>
                          )}
                          {isBinNadzor && (
                            <span className="inline-block font-bold text-rose-900 bg-rose-100 border border-rose-300 px-1.5 py-0.5 rounded text-[10px]">
                              Merah Gold
                            </span>
                          )}
                          {isTamatan && (
                            <span className="inline-block font-bold text-rose-900 bg-rose-100 border border-rose-300 px-1.5 py-0.5 rounded text-[10px]">
                              Merah Gold
                            </span>
                          )}
                          {isUndangan && (
                            <span className="inline-block font-bold text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[10px]">
                              {item.warnaTiket || getWarnaTiketUndangan(item.golonganUndangan, item.kategori) || (item.golonganUndangan === 'ISTIMEWA' ? 'Hitam Gold' : 'Merah Gold')}
                            </span>
                          )}
                          {item.kuotaTambahan > 0 && (
                            <span className="text-rose-600 block font-semibold">+ {item.kuotaTambahan} Tambahan</span>
                          )}
                        </div>
                      </td>

                      {/* Status Hadir */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {item.terpakai > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Check className="w-3 h-3 mr-1" />
                            {item.terpakai} Masuk
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">
                            Belum Datang
                          </span>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5">Sisa: {item.sisa}</div>
                      </td>

                      {/* Tombol Aksi */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Fast-Track VIP Check-in Button khusus Tamu Undangan */}
                          {isUndangan && (
                            item.terpakai === 0 ? (
                              <button
                                onClick={() => handleFastTrackVip(item)}
                                disabled={fastTrackLoading === item.kode}
                                title="Fast-Track VIP: Hadirkan beliau langsung tanpa scan QR gerbang"
                                className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-[11px] shadow-xs flex items-center space-x-1 transition-all active:scale-95 disabled:opacity-50"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Hadirkan VIP</span>
                              </button>
                            ) : (
                              <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[10px] flex items-center space-x-1">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Hadir</span>
                              </span>
                            )
                          )}

                          {/* Detail & QR */}
                          <button
                            onClick={() => setQrDetailItem(item)}
                            title="Lihat QR & Kartu"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-opera-850 hover:bg-opera-50 border border-transparent hover:border-opera-200 transition-colors"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Data Peserta"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Hapus */}
                          <button
                            onClick={() => setDeletingItem(item)}
                            title="Hapus Peserta"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Kontrol Navigasi Halaman (Pagination) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Halaman <strong className="text-slate-800">{currentPage}</strong> dari{' '}
            <strong className="text-slate-800">{totalPages}</strong> (Total {filteredItems.length} peserta)
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage <= 1}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-xs"
            >
              Awal
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 font-semibold text-slate-700">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage >= totalPages}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-xs"
            >
              Akhir
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
