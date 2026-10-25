'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Users, ChevronLeft, ChevronRight } from 'lucide-react';
import SantriTableFilter, {
  computeSantriSubFilterOptions,
  filterSantriTableItems,
} from './SantriTableFilter';
import SantriTableRow, { executeFastTrackVipHelper } from './SantriTableRow';

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

      {/* Tabel Data Peserta */}
      <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
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
              {paginatedItems.length === 0 ? (
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
