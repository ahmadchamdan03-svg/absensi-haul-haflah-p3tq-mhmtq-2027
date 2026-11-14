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
  Link2,
  Unlink,
  Loader2,
} from 'lucide-react';
import UnmergeModal from './modal/UnmergeModal';
import MergeDuplicateBanner from './modal/MergeDuplicateBanner';
import { store } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase/client';
import { getWarnaTiketUndangan } from '@/lib/types';
import {
  findDuplicateTamuInList,
  getMergedCategoryBadges,
  getMergedCategoryBadgeClass,
} from '@/lib/santri-merge-helper';
import {
  OPSI_UNDANGAN_ISTIMEWA,
  OPSI_UNDANGAN_UMUM,
  matchUndanganCategory,
} from './TamuModal';
import { SkeletonTableRow } from '@/components/ui/GlassSkeleton';

export interface TamuTableProps {
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

export default function TamuTable({
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
}: TamuTableProps) {
  const [fastTrackLoading, setFastTrackLoading] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [unmergeItem, setUnmergeItem] = useState<any | null>(null);

  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleMergeSelected = async () => {
    if (selectedIds.length < 2) return;
    const selectedRecords = allItems.filter((it) => selectedIds.includes(it.id));
    const hasScanned = selectedRecords.some((it) => (it.terpakai || 0) > 0);
    if (hasScanned) {
      alert('Tidak dapat menggabungkan data yang sudah melakukan scan kehadiran.');
      return;
    }

    setIsMerging(true);
    try {
      const items = selectedRecords.map((it) => ({
        id: it.id,
        table: (it.tipe === 'SANTRI' ? 'peserta_santri' : 'tamu_undangan') as 'tamu_undangan' | 'peserta_santri',
      }));
      const res = await fetch('/api/peserta/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'merge', items }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        alert(json.error || 'Gagal menggabungkan data peserta.');
        return;
      }
      showToast(`✓ ${json.pesan || 'Berhasil menggabungkan peserta'}`);
      setSelectedIds([]);
      await onRefreshData();
    } catch (err: any) {
      alert(err?.message || 'Terjadi kesalahan saat menggabungkan data');
    } finally {
      setIsMerging(false);
    }
  };

  // Deteksi kelompok tamu undangan dengan nama dan kota serupa yang belum digabung
  const duplicateTamuGroups = useMemo(() => {
    return findDuplicateTamuInList(allItems);
  }, [allItems]);

  const handleUnmerge = async (itemsToUnmerge: Array<{ id: string; table: 'tamu_undangan' | 'peserta_santri' }>) => {
    const res = await fetch('/api/peserta/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'unmerge',
        items: itemsToUnmerge,
        groupId: unmergeItem?.merged_group_id,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      alert(json.error || 'Gagal memisahkan data.');
      return;
    }
    showToast(`✓ ${json.pesan || 'Data peserta berhasil dipisahkan'}`);
    await onRefreshData();
  };

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

      await fetch('/api/presensi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkin',
          kode_qr: item.kode,
          nama_peserta: item.nama,
          tipe_peserta: 'UNDANGAN',
          jalur: 'MEJA_TRANSIT',
          panitia_id: 'fast-track-vip',
          jumlah_l: jumlahL,
          jumlah_p: jumlahP,
          jumlah_balita: 0,
          catatan: 'Fast-Track VIP Checkin',
        }),
      });

      store.checkin(item.kode, totalKuotaItem, 0, 'BARAT', 0, 'fast-track-vip');
      await onRefreshData();
      showToast(`✓ Tamu VIP ${item.nama} (${item.kode}) berhasil dihadirkan!`);
    } catch (e: any) {
      console.warn('FastTrack error:', e);
    } finally {
      setFastTrackLoading(null);
    }
  };

  // Opsi dropdown sub-filter yang disesuaikan secara dinamis dengan activeTab Tamu Undangan
  const subFilterOptions = useMemo(() => {
    switch (activeTab) {
      case 'UNDANGAN_UMUM': {
        const baseOptions = OPSI_UNDANGAN_UMUM.filter((o) => !o.includes('Lainnya'));
        const distinctKategoriInItems = Array.from(
          new Set(
            allItems
              .filter((it) => it.tipe === 'UNDANGAN' && (it.golonganUndangan === 'UMUM' || it.uniqueGolongan?.includes('UMUM')))
              .flatMap((it) => (it.isMerged && it.uniqueSubKategori ? it.uniqueSubKategori : [it.kategori]))
              .filter(Boolean)
          )
        );

        const allCat = [...baseOptions];
        distinctKategoriInItems.forEach((c) => {
          if (!allCat.some((b) => matchUndanganCategory(c, b))) {
            allCat.push(c);
          }
        });

        return [
          { value: 'SEMUA', label: `Semua Tamu Umum (${stats.undanganUmumCount})` },
          ...allCat.map((cat) => {
            const count = allItems.filter(
              (it) =>
                it.tipe === 'UNDANGAN' &&
                (it.golonganUndangan === 'UMUM' || it.uniqueGolongan?.includes('UMUM')) &&
                (matchUndanganCategory(it.kategori, cat) ||
                  (it.isMerged &&
                    (it.uniqueSubKategori?.some((sub: string) => matchUndanganCategory(sub, cat)) ||
                     it.mergedItems?.some((m: any) => matchUndanganCategory(m.kategori, cat)))))
            ).length;
            return { value: cat, label: `${cat} (${count})` };
          }),
        ];
      }

      case 'UNDANGAN_ISTIMEWA': {
        const baseOptions = OPSI_UNDANGAN_ISTIMEWA.filter((o) => !o.includes('Lainnya'));
        const distinctKategoriInItems = Array.from(
          new Set(
            allItems
              .filter((it) => it.tipe === 'UNDANGAN' && (it.golonganUndangan === 'ISTIMEWA' || it.uniqueGolongan?.includes('ISTIMEWA')))
              .flatMap((it) => (it.isMerged && it.uniqueSubKategori ? it.uniqueSubKategori : [it.kategori]))
              .filter(Boolean)
          )
        );

        const allCat = [...baseOptions];
        distinctKategoriInItems.forEach((c) => {
          if (!allCat.some((b) => matchUndanganCategory(c, b))) {
            allCat.push(c);
          }
        });

        return [
          { value: 'SEMUA', label: `Semua Tamu Istimewa (${stats.undanganIstimewaCount})` },
          ...allCat.map((cat) => {
            const count = allItems.filter(
              (it) =>
                it.tipe === 'UNDANGAN' &&
                (it.golonganUndangan === 'ISTIMEWA' || it.uniqueGolongan?.includes('ISTIMEWA')) &&
                (matchUndanganCategory(it.kategori, cat) ||
                  (it.isMerged &&
                    (it.uniqueSubKategori?.some((sub: string) => matchUndanganCategory(sub, cat)) ||
                     it.mergedItems?.some((m: any) => matchUndanganCategory(m.kategori, cat)))))
            ).length;
            return { value: cat, label: `${cat} (${count})` };
          }),
        ];
      }

      case 'UNDANGAN_KEHORMATAN': {
        // Tamu Kehormatan hanya 1 jenis resmi (tanpa sub-kategori), tidak memerlukan opsi dropdown
        return [];
      }

      case 'UNDANGAN':
      default: {
        return [
          { value: 'SEMUA', label: `Semua Tamu Undangan (${stats.undanganCount})` },
          { value: 'ISTIMEWA', label: `🌟 Tamu Undangan Istimewa (${stats.undanganIstimewaCount})` },
          { value: 'KEHORMATAN', label: `🏛️ Tamu Undangan Kehormatan (${stats.undanganKehormatanCount})` },
          { value: 'UMUM', label: `👥 Tamu Undangan Umum (${stats.undanganUmumCount})` },
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

  // Filter list Tamu Undangan
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // 1. Tab filter
      if (activeTab === 'UNDANGAN' && item.tipe !== 'UNDANGAN') return false;
      if (activeTab === 'UNDANGAN_ISTIMEWA') {
        if (item.tipe !== 'UNDANGAN') return false;
        const matches =
          item.golonganUndangan === 'ISTIMEWA' ||
          (item.isMerged && item.mergedItems?.some((m: any) => m.golonganUndangan === 'ISTIMEWA' || m.golongan === 'ISTIMEWA'));
        if (!matches) return false;
      }
      if (activeTab === 'UNDANGAN_KEHORMATAN') {
        if (item.tipe !== 'UNDANGAN') return false;
        const matches =
          item.golonganUndangan === 'KEHORMATAN' ||
          (item.isMerged && item.mergedItems?.some((m: any) => m.golonganUndangan === 'KEHORMATAN' || m.golongan === 'KEHORMATAN'));
        if (!matches) return false;
      }
      if (activeTab === 'UNDANGAN_UMUM') {
        if (item.tipe !== 'UNDANGAN') return false;
        const matches =
          item.golonganUndangan === 'UMUM' ||
          (item.isMerged && item.mergedItems?.some((m: any) => m.golonganUndangan === 'UMUM' || m.golongan === 'UMUM'));
        if (!matches) return false;
      }

      // 2. Sub Filter dinamis (bagianFilter)
      if (bagianFilter && bagianFilter !== 'SEMUA') {
        if (activeTab === 'UNDANGAN') {
          const matches =
            item.golonganUndangan === bagianFilter ||
            (item.isMerged && item.mergedItems?.some((m: any) => m.golonganUndangan === bagianFilter || m.golongan === bagianFilter));
          if (!matches) return false;
        } else if (
          activeTab === 'UNDANGAN_ISTIMEWA' ||
          activeTab === 'UNDANGAN_KEHORMATAN' ||
          activeTab === 'UNDANGAN_UMUM'
        ) {
          const matches =
            matchUndanganCategory(item.kategori, bagianFilter) ||
            (item.isMerged &&
              (item.uniqueSubKategori?.some((sub: string) => matchUndanganCategory(sub, bagianFilter)) ||
               item.mergedItems?.some((m: any) => matchUndanganCategory(m.kategori, bagianFilter))));
          if (!matches) return false;
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
        const matchSub =
          normalize(item.subKategori || item.kategori || '').includes(q) ||
          (item.isMerged && item.uniqueSubKategori?.some((sub: string) => normalize(sub).includes(q)));
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
      <div className="max-w-7xl mx-auto bg-white/60 backdrop-blur-md rounded-3xl p-5 shadow-sm border border-white/70 space-y-4">
        {tabsHeader}

        {/* Bar Pencarian & Dropdown Filter Tamu Undangan */}
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
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-opera-700 bg-sky-50/40 text-blue-950 font-medium"
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

      {/* Banner Deteksi Otomatis Tamu Dobel */}
      <MergeDuplicateBanner
        mode="TAMU"
        groups={duplicateTamuGroups}
        isMerging={isMerging}
        setIsMerging={setIsMerging}
        onRefreshData={onRefreshData}
        showToast={showToast}
      />

      {/* Tabel Data Peserta (Tamu Undangan) */}
      <div className="max-w-7xl mx-auto bg-white/60 backdrop-blur-md rounded-3xl shadow-sm border border-white/70 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wide text-[11px]">
              <tr>
                <th className="py-2 px-2 w-8 text-center">
                  <input
                    type="checkbox"
                    title="Pilih Semua Halaman Ini"
                    aria-label="Pilih semua data pada halaman ini"
                    checked={paginatedItems.length > 0 && paginatedItems.every((i) => selectedIds.includes(i.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const pageIds = paginatedItems.map((i) => i.id);
                        setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
                      } else {
                        const pageIds = new Set(paginatedItems.map((i) => i.id));
                        setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-2 px-1.5 sm:px-2 w-9 text-center whitespace-nowrap">No</th>
                <th className="py-2 px-2 sm:px-2.5 whitespace-nowrap">Kode QR</th>
                <th className="py-2 px-2 sm:px-2.5">Nama Tamu</th>
                <th className="py-2 px-2 sm:px-2.5">Kategori Undangan</th>
                <th className="py-2 px-2 sm:px-2.5">Alamat &amp; Kontak</th>
                <th className="py-2 px-2 sm:px-2.5 text-center whitespace-nowrap">Hak Kuota</th>
                <th className="py-2 px-2 sm:px-2.5 text-center whitespace-nowrap">Status Hadir</th>
                <th className="py-2 px-2 sm:px-2.5 text-center whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <SkeletonTableRow key={idx} cols={9} />
                ))
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    {stats.totalSemua === 0 ? (
                      <div className="space-y-2 max-w-md mx-auto">
                        <p className="font-bold text-slate-700 text-sm">Daftar seluruh santri dan tamu undangan kosong (0 data).</p>
                        <p className="text-xs text-slate-500">Semua data santri peserta maupun tamu undangan telah berhasil dibersihkan. Anda dapat menambahkan data baru melalui tombol &ldquo;+ Tambah Santri&rdquo; atau &ldquo;+ Tambah Undangan&rdquo; di atas.</p>
                      </div>
                    ) : stats.undanganCount === 0 ? (
                      <div className="space-y-2 max-w-md mx-auto">
                        <p className="font-bold text-slate-700 text-sm">Daftar tamu undangan kosong (0 tamu).</p>
                        <p className="text-xs text-slate-500">Semua data tamu undangan telah dibersihkan. Anda dapat menambahkan tamu baru dengan tombol &ldquo;+ Tambah Undangan&rdquo; di atas.</p>
                      </div>
                    ) : (
                      'Tidak ada data peserta atau tamu yang cocok dengan kriteria pencarian.'
                    )}
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, index) => {
                  const globalIndex = (currentPage - 1) * pageSize + index + 1;
                  const isUndangan = item.tipe === 'UNDANGAN';

                  return (
                    <tr key={item.kode} className="hover:bg-slate-50/80 transition-colors">
                      {/* Checkbox Select for Merge */}
                      <td className="py-2 px-2 text-center">
                        <input
                          type="checkbox"
                          aria-label={`Pilih ${item.nama}`}
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleSelectItem(item.id)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* No */}
                      <td className="py-2 px-1.5 sm:px-2 text-center text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {globalIndex}
                      </td>

                      {/* Kode QR & Kartu Modal */}
                      <td className="py-2 px-2 sm:px-2.5 whitespace-nowrap">
                        <button
                          onClick={() => setQrDetailItem(item)}
                          className="flex items-center space-x-1 px-2 py-0.5 rounded-md font-mono font-bold text-[11px] bg-slate-100 hover:bg-opera-50 hover:text-opera-850 hover:border-opera-300 border border-slate-200 transition-colors group"
                        >
                          <QrCode className="w-3.5 h-3.5 text-slate-500 group-hover:text-opera-700" />
                          <span>{item.kode}</span>
                          {item.isMerged && (
                            <span title="QR Code Prioritas Tertinggi (Grup Gabungan)">
                              <Link2 className="w-3 h-3 text-sky-600 shrink-0" />
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Nama */}
                      <td className="py-2 px-2 sm:px-2.5">
                        <div className="space-y-0.5 leading-tight">
                          <div className="font-bold text-slate-900 text-xs sm:text-[13px] leading-tight">{item.nama}</div>
                          {item.kamar && item.kamar !== '-' && (
                            <div className="text-[11px] text-slate-600 leading-tight">Kamar: {item.kamar}</div>
                          )}
                          {isUndangan && item.golonganUndangan === 'ISTIMEWA' && item.namaPutra && item.namaPutri && (
                            <div className="text-[10px] text-blue-900/80 font-medium flex items-center space-x-1 leading-tight">
                              <span>🤵 {item.namaPutra}</span>
                              <span>·</span>
                              <span>🧕 {item.namaPutri}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Kategori & Bagian (Multi-badge if Merged) */}
                      <td className="py-2 px-2 sm:px-2.5">
                        {item.isMerged ? (
                          <div className="flex flex-wrap items-center gap-1 leading-tight">
                            {getMergedCategoryBadges(item).map((katName: string, kIdx: number) => (
                              <span
                                key={`${katName}-${kIdx}`}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border shadow-2xs leading-tight ${getMergedCategoryBadgeClass(katName)}`}
                              >
                                {katName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-0.5 leading-tight">
                            <div className="flex items-center space-x-1.5">
                              <span
                                className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                                  item.golonganUndangan === 'ISTIMEWA'
                                    ? 'bg-amber-600'
                                    : item.golonganUndangan === 'KEHORMATAN'
                                    ? 'bg-purple-600'
                                    : 'bg-cyan-600'
                                }`}
                              ></span>
                              <span className="font-bold text-slate-800 text-xs leading-tight">
                                {item.golonganUndangan === 'ISTIMEWA'
                                  ? 'Undangan Istimewa'
                                  : item.golonganUndangan === 'KEHORMATAN'
                                  ? 'Undangan Kehormatan'
                                  : 'Undangan Umum'}
                              </span>
                            </div>
                            {isUndangan && (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border leading-tight ${
                                  item.golonganUndangan === 'ISTIMEWA'
                                    ? 'bg-sky-50 text-blue-950 border-sky-300'
                                    : item.golonganUndangan === 'KEHORMATAN'
                                    ? 'bg-purple-50 text-purple-900 border-purple-300'
                                    : 'bg-cyan-50 text-cyan-900 border-cyan-300'
                                }`}
                              >
                                {item.golonganUndangan === 'KEHORMATAN' ? 'Tamu Kehormatan' : (item.kategori || 'VIP')}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Wali Santri / Alamat & Kontak */}
                      <td className="py-2 px-2 sm:px-2.5">
                        <div className="space-y-0.5 leading-tight">
                          <div className="text-slate-800 text-xs font-medium leading-tight">
                            {item.golonganUndangan === 'ISTIMEWA' ? (
                              <span className="text-blue-950 font-semibold flex items-center space-x-1">
                                <span>📍 {item.alamat || item.instansi || 'Kediri'}</span>
                              </span>
                            ) : item.golonganUndangan === 'KEHORMATAN' ? (
                              <span className="text-purple-950 font-semibold flex items-center space-x-1">
                                <span>📍 {item.alamat || item.instansi || 'Kediri'}</span>
                              </span>
                            ) : (
                              <div className="space-y-0.5 leading-tight">
                                <div className="font-semibold text-slate-800">{item.instansi || 'Pondok Pesantren Lirboyo'}</div>
                                {item.alamat && item.alamat !== '-' && item.alamat !== item.instansi && (
                                  <div className="text-xs text-slate-600 font-normal">📍 {item.alamat}</div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-600 leading-tight">
                            {item.noHp && item.noHp !== '-' && (
                              <a
                                href={`https://wa.me/${item.noHp.replace(/^0/, '62')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center text-blue-700 hover:underline whitespace-nowrap"
                              >
                                <Phone className="w-3 h-3 mr-0.5" />
                                <span>{item.noHp}</span>
                              </a>
                            )}
                            {isUndangan && item.golonganUndangan === 'ISTIMEWA' && (item.namaPutra || item.namaPutri) && (
                              <span className="text-[10px] text-amber-700 font-semibold bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 leading-tight">
                                {item.namaPutra && item.namaPutri ? 'Putra & Putri' : item.namaPutra ? 'Putra' : 'Putri'}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Hak Kuota */}
                      <td className="py-2 px-2 sm:px-2.5 text-center whitespace-nowrap">
                        <div className="font-bold text-slate-800 text-xs leading-tight">
                          {item.kuotaDasar + item.kuotaTambahan} Kursi
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 space-y-0.5 leading-tight">
                          {(() => {
                            const rawWarna = item.warnaTiket || getWarnaTiketUndangan(item.golonganUndangan, item.kategori) || (item.golonganUndangan === 'ISTIMEWA' ? 'Cream' : 'Biru');
                            const isCream = String(rawWarna).toLowerCase().includes('cream');
                            return (
                              <span className={`inline-block font-bold px-1.5 py-0.5 rounded text-[10px] border leading-none ${
                                isCream
                                  ? 'text-[#1E3A8A] bg-[#F5E6D3] border-[#D49B5B]'
                                  : 'text-blue-900 bg-blue-100 border-blue-300'
                              }`}>
                                {rawWarna}
                              </span>
                            );
                          })()}
                          {item.kuotaTambahan > 0 && (
                            <span className="text-rose-600 block font-semibold leading-tight">+ {item.kuotaTambahan} Tambahan</span>
                          )}
                        </div>
                      </td>

                      {/* Status Hadir */}
                      <td className="py-2 px-2 sm:px-2.5 text-center whitespace-nowrap">
                        {item.terpakai > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 leading-tight">
                            <Check className="w-3 h-3 mr-1" />
                            {item.terpakai} Masuk
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 leading-tight">
                            Belum Datang
                          </span>
                        )}
                        <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">Sisa: {item.sisa}</div>
                      </td>

                      {/* Tombol Aksi */}
                      <td className="py-2 px-2 sm:px-2.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1">
                          {/* Detail & QR */}
                          <button
                            onClick={() => setQrDetailItem(item)}
                            title="Lihat QR &amp; Kartu"
                            aria-label={`Lihat QR dan kartu ${item.nama}`}
                            className="p-1 rounded-md text-slate-600 hover:text-opera-850 hover:bg-opera-50 border border-transparent hover:border-opera-200 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none cursor-pointer"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Data Peserta"
                            aria-label={`Ubah data ${item.nama}`}
                            className="p-1 rounded-md text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Unmerge Button */}
                          {item.isMerged && (
                            <button
                              type="button"
                              onClick={() => setUnmergeItem(item)}
                              disabled={item.terpakai > 0}
                              aria-label={`Pisahkan grup ${item.nama}`}
                              title={
                                item.terpakai > 0
                                  ? 'Tidak dapat dipisahkan karena peserta sudah melakukan scan kehadiran.'
                                  : 'Pisahkan (Unmerge) data peserta ini'
                              }
                              className={`p-1 rounded-md border transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
                                item.terpakai > 0
                                  ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                                  : 'bg-white hover:bg-amber-50 text-amber-700 border-amber-300 hover:border-amber-400 cursor-pointer'
                              }`}
                            >
                              <Unlink className="w-4 h-4" />
                            </button>
                          )}

                          {/* Hapus */}
                          <button
                            onClick={() => setDeletingItem(item)}
                            title="Hapus Peserta"
                            aria-label={`Hapus data ${item.nama}`}
                            className="p-1 rounded-md text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
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

      {/* Floating Toolbar: Gabungkan Terpilih (Merge) */}
      {selectedIds.length >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 text-white backdrop-blur-md px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl shadow-2xl border border-sky-400/40 flex items-center space-x-3 sm:space-x-4 animate-in slide-in-from-bottom-5 max-w-[95vw]">
          <div className="text-xs font-medium whitespace-nowrap">
            <strong className="text-amber-300 font-bold">{selectedIds.length}</strong> data dipilih
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isMerging}
              onClick={handleMergeSelected}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none whitespace-nowrap"
            >
              {isMerging ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menggabungkan...</span>
                </>
              ) : (
                <>
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Gabungkan Data Terpilih</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modal Unmerge */}
      {unmergeItem && (
        <UnmergeModal
          isOpen={!!unmergeItem}
          mergedCard={unmergeItem}
          onUnmergeSelected={handleUnmerge}
          onClose={() => setUnmergeItem(null)}
        />
      )}
    </>
  );
}
