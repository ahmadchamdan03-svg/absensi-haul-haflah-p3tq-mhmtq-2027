'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Users, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  findDuplicateSantriInList,
  autoMergeAllDuplicatesInSupabase,
} from '@/lib/santri-merge-helper';
import SantriTableFilter, {
  computeSantriSubFilterOptions,
  filterSantriTableItems,
} from './SantriTableFilter';
import SantriTableRow, { executeFastTrackVipHelper } from './SantriTableRow';
import { SkeletonTableRow } from '@/components/ui/GlassSkeleton';

export interface SantriTableProps {
  loading?: boolean;
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
  loading = false,
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
  const [isMerging, setIsMerging] = useState<boolean>(false);

  // Deteksi kelompok santri dengan Nama & Wali sama yang belum digabung
  const duplicateGroups = useMemo(() => {
    const santriItems = allItems.filter((i) => i.tipe === 'SANTRI');
    return findDuplicateSantriInList(santriItems);
  }, [allItems]);

  const handleMergeAllDuplicates = async () => {
    if (duplicateGroups.length === 0) {
      showToast('✓ Tidak ada data santri dobel yang perlu digabung.');
      return;
    }

    const confirm = window.confirm(
      `Ditemukan ${duplicateGroups.length} grup santri dengan nama dan wali yang sama. Apakah Anda ingin menggabungkannya secara otomatis menjadi kategori dobel?`
    );
    if (!confirm) return;

    setIsMerging(true);
    try {
      const res = await autoMergeAllDuplicatesInSupabase(supabase);
      if (res.success) {
        showToast(`✓ Berhasil menggabungkan ${res.mergedGroupsCount} grup santri kategori dobel.`);
        await onRefreshData();
      }
    } catch (e: any) {
      alert(`Gagal menggabungkan data: ${e.message || e}`);
    } finally {
      setIsMerging(false);
    }
  };

  const handleFastTrackVip = async (item: any) => {
    await executeFastTrackVipHelper({
      item,
      setFastTrackLoading,
      onRefreshData,
      showToast,
    });
  };

  const subFilterOptions = useMemo(
    () => computeSantriSubFilterOptions(activeTab, allItems, stats),
    [activeTab, allItems, stats]
  );

  useEffect(() => {
    const exists = subFilterOptions.some((o) => o.value === bagianFilter);
    if (!exists) {
      setBagianFilter('SEMUA');
    }
  }, [activeTab, subFilterOptions]);

  const filteredItems = useMemo(
    () =>
      filterSantriTableItems({
        allItems,
        activeTab,
        bagianFilter,
        statusHadirFilter,
        searchTerm,
      }),
    [allItems, activeTab, bagianFilter, statusHadirFilter, searchTerm]
  );

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  return (
    <>
      <SantriTableFilter
        tabsHeader={tabsHeader}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        bagianFilter={bagianFilter}
        setBagianFilter={setBagianFilter}
        statusHadirFilter={statusHadirFilter}
        setStatusHadirFilter={setStatusHadirFilter}
        subFilterOptions={subFilterOptions}
        filteredCount={filteredItems.length}
        pageSize={pageSize}
        setPageSize={setPageSize}
        setCurrentPage={setCurrentPage}
      />

      {/* Banner Deteksi Kategori Dobel Belum Bergabung */}
      {duplicateGroups.length > 0 && (
        <div className="max-w-7xl mx-auto my-3 bg-amber-500/15 border border-amber-500/40 backdrop-blur-md rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-950 shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-xs sm:text-sm">
                Terdeteksi {duplicateGroups.length} Grup Santri Kategori Dobel Belum Bergabung
              </p>
              <p className="text-[11px] text-amber-900/80">
                Nama santri dan wali sama ({duplicateGroups.map((g) => g.nama).slice(0, 3).join(', ')}
                {duplicateGroups.length > 3 ? '...' : ''}). Gabungkan menjadi 1 baris resmi dengan kuota otomatis.
              </p>
            </div>
          </div>
          <button
            onClick={handleMergeAllDuplicates}
            disabled={isMerging}
            className="shrink-0 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {isMerging ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menggabungkan...</span>
              </>
            ) : (
              <>
                <span>⚡ Gabung Data Sekarang ({duplicateGroups.length})</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Tabel Data Peserta */}
      <div className="max-w-7xl mx-auto bg-white/60 backdrop-blur-md rounded-3xl shadow-sm border border-white/70 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Kode QR</th>
                <th className="py-3.5 px-4">Nama Santri &amp; Kamar</th>
                <th className="py-3.5 px-4">Kategori &amp; Bagian</th>
                <th className="py-3.5 px-4">Wali Santri / Alamat &amp; Kontak</th>
                <th className="py-3.5 px-4 text-center">Hak Kuota</th>
                <th className="py-3.5 px-4 text-center">Status Hadir</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <SkeletonTableRow key={idx} cols={8} />
                ))
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    {stats.totalSemua === 0 ? (
                      <div className="space-y-2 max-w-md mx-auto">
                        <p className="font-bold text-slate-700 text-sm">
                          Daftar seluruh santri dan tamu undangan kosong (0 data).
                        </p>
                        <p className="text-xs text-slate-500">
                          Semua data santri peserta maupun tamu undangan telah berhasil dibersihkan. Anda dapat menambahkan data baru melalui tombol &ldquo;+ Tambah Santri&rdquo; atau &ldquo;+ Tambah Undangan&rdquo; di atas.
                        </p>
                      </div>
                    ) : !activeTab.startsWith('UNDANGAN') &&
                      stats.totalSantri === 0 &&
                      activeTab !== 'SEMUA' ? (
                      <div className="space-y-2 max-w-md mx-auto">
                        <p className="font-bold text-slate-700 text-sm">
                          Daftar santri peserta kategori ini kosong (0 santri).
                        </p>
                        <p className="text-xs text-slate-500">
                          Semua data santri telah dibersihkan. Anda dapat menambahkan santri baru dengan tombol &ldquo;+ Tambah Santri&rdquo; di atas.
                        </p>
                      </div>
                    ) : (
                      'Tidak ada data peserta atau tamu yang cocok dengan kriteria pencarian.'
                    )}
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, index) => {
                  const globalIndex = (currentPage - 1) * pageSize + index + 1;
                  return (
                    <SantriTableRow
                      key={item.kode}
                      item={item}
                      globalIndex={globalIndex}
                      fastTrackLoading={fastTrackLoading}
                      handleFastTrackVip={handleFastTrackVip}
                      setQrDetailItem={setQrDetailItem}
                      handleOpenEdit={handleOpenEdit}
                      setDeletingItem={setDeletingItem}
                    />
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
            <strong className="text-slate-800">{totalPages}</strong> (Total {filteredItems.length}{' '}
            peserta)
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
