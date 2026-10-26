'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { store } from '@/lib/mock-data';
import { buatPesanPengingatKonfirmasi } from '@/lib/hmac';
import { logAudit } from '@/lib/audit-log';
import {
  MainTabType,
  FilterStatusType,
  FilterKategoriType,
  KonfirmasiItem,
  mapSantriToKonfirmasiItem,
  mapTamuToKonfirmasiItem,
  calculateKonfirmasiRekap,
} from '@/components/admin/konfirmasi/types';
import KonfirmasiStatsAndFilters from '@/components/admin/konfirmasi/KonfirmasiStatsAndFilters';
import KonfirmasiTableSection from '@/components/admin/konfirmasi/KonfirmasiTableSection';
import KonfirmasiEditModal from '@/components/admin/konfirmasi/KonfirmasiEditModal';

export default function KonfirmasiPage() {
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('WALI_SANTRI');
  const [daftarSantri, setDaftarSantri] = useState<KonfirmasiItem[]>([]);
  const [daftarTamu, setDaftarTamu] = useState<KonfirmasiItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatusType>('SEMUA');
  const [filterKategori, setFilterKategori] = useState<FilterKategoriType>('SEMUA');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Modal Edit Manual
  const [modalItem, setModalItem] = useState<KonfirmasiItem | null>(null);
  const [editL, setEditL] = useState(0);
  const [editP, setEditP] = useState(0);
  const [editCatatan, setEditCatatan] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // 1. Fetch data dari Supabase tabel 'peserta_santri' & 'tamu_undangan'
  const fetchKonfirmasiData = async () => {
    try {
      const [resSantri, resTamu] = await Promise.all([
        supabase.from('peserta_santri').select('*').order('created_at', { ascending: false }),
        supabase.from('tamu_undangan').select('*').order('created_at', { ascending: false }),
      ]);

      if (resSantri.data && !resSantri.error) {
        setDaftarSantri(resSantri.data.map(mapSantriToKonfirmasiItem));
      } else {
        setDaftarSantri([]);
      }

      if (resTamu.data && !resTamu.error) {
        setDaftarTamu(resTamu.data.map(mapTamuToKonfirmasiItem));
      } else {
        setDaftarTamu([]);
      }
    } catch (e) {
      console.error('Error fetching konfirmasi data:', e);
      setDaftarSantri([]);
      setDaftarTamu([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKonfirmasiData();
    const interval = setInterval(fetchKonfirmasiData, 60000);

    const channel = supabase
      .channel('konfirmasi_page_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'peserta_santri' }, fetchKonfirmasiData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tamu_undangan' }, fetchKonfirmasiData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presensi_log' }, fetchKonfirmasiData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pembelian_kuota' }, fetchKonfirmasiData)
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const currentDataset = useMemo(() => {
    return activeMainTab === 'WALI_SANTRI' ? daftarSantri : daftarTamu;
  }, [activeMainTab, daftarSantri, daftarTamu]);

  // 2. Kalkulasi Metrik Ringkasan Realtime
  const rekap = useMemo(() => {
    return calculateKonfirmasiRekap(daftarSantri, daftarTamu);
  }, [daftarSantri, daftarTamu]);

  // Filtered List
  const filteredList = useMemo(() => {
    return currentDataset.filter((item) => {
      // Filter Status Konfirmasi
      if (filterStatus !== 'SEMUA') {
        if (activeMainTab === 'TAMU_UNDANGAN') {
          const raw = String(item.rawStatusKonfirmasi || '').toUpperCase().trim();
          const isHadir = raw === 'HADIR' || (item.statusKonfirmasi === 'SUDAH' && raw !== 'BERHALANGAN');
          const isBerhalangan = raw === 'BERHALANGAN';
          const isBelum = !isHadir && !isBerhalangan;

          if (filterStatus === 'HADIR' && !isHadir) return false;
          if (filterStatus === 'BERHALANGAN' && !isBerhalangan) return false;
          if (filterStatus === 'BELUM' && !isBelum) return false;
          if (filterStatus === 'SUDAH' && !isHadir) return false;
        } else {
          if (item.statusKonfirmasi !== filterStatus) {
            return false;
          }
        }
      }
      // Filter Kategori Santri
      if (activeMainTab === 'WALI_SANTRI' && filterKategori !== 'SEMUA' && item.kategoriUtama !== filterKategori) {
        return false;
      }
      // Pencarian
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNama = (item.namaSantri || '').toLowerCase().includes(q);
        const matchWali = (item.namaWali || '').toLowerCase().includes(q);
        const matchKode = (item.kode || '').toLowerCase().includes(q);
        const matchKelas = (item.kelas || '').toLowerCase().includes(q);
        const matchAlamat = (item.alamat || '').toLowerCase().includes(q);
        const matchHp = (item.noHp || '').toLowerCase().includes(q);
        if (!matchNama && !matchWali && !matchKode && !matchKelas && !matchAlamat && !matchHp) {
          return false;
        }
      }
      return true;
    });
  }, [currentDataset, activeMainTab, filterStatus, filterKategori, searchQuery]);

  // Paginasi
  const totalPages = Math.max(1, Math.ceil(filteredList.length / itemsPerPage));
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredList.slice(start, start + itemsPerPage);
  }, [filteredList, currentPage, itemsPerPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [activeMainTab, filterStatus, filterKategori, searchQuery]);

  // Buka Modal Edit Manual
  const handleOpenEdit = (item: KonfirmasiItem) => {
    setModalItem(item);
    setEditL(item.perkiraanL || 0);
    setEditP(item.perkiraanP || 0);
    setEditCatatan(item.catatan || '');
    setErrorMsg('');
  };

  // Simpan Edit Manual (Direct Supabase .update())
  const handleSimpanEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalItem) return;

    if (editL + editP > modalItem.totalKuota) {
      setErrorMsg(
        `Total estimasi (${editL + editP} orang) melebihi jatah kuota (${modalItem.totalKuota} kursi)!`
      );
      return;
    }

    try {
      if (modalItem.tipe === 'TAMU_UNDANGAN') {
        const { error } = await supabase
          .from('tamu_undangan')
          .update({
            status_konfirmasi: editL + editP > 0 ? 'SUDAH' : 'BELUM',
            catatan_konfirmasi: editCatatan,
            confirmed_at: editL + editP > 0 ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('kode', modalItem.kode);

        if (error) {
          console.error('Error updating tamu konfirmasi in Supabase:', error);
          setErrorMsg(`Gagal menyimpan ke Supabase DB: ${error.message}`);
          return;
        }

        await logAudit({
          panitia_id: 'ADMIN_SEKRETARIAT',
          panitia_role: 'ADMIN',
          aksi: 'EDIT_TAMU',
          tabel: 'tamu_undangan',
          kode: modalItem.kode,
          nama: modalItem.namaSantri || modalItem.namaWali,
          field: 'edit_konfirmasi_tamu',
          nilai_baru: JSON.stringify({ perkiraan_l: editL, perkiraan_p: editP, status_konfirmasi: editL + editP > 0 ? 'SUDAH' : 'BELUM', catatan_konfirmasi: editCatatan }),
          detail: modalItem,
          catatan: `Edit Konfirmasi Tamu Undangan (${modalItem.kode})`,
        });
      } else {
        const { error } = await supabase
          .from('peserta_santri')
          .update({
            perkiraan_l: editL,
            perkiraan_p: editP,
            status_konfirmasi: editL + editP > 0 ? 'SUDAH' : 'BELUM',
            catatan_konfirmasi: editCatatan,
          })
          .eq('kode', modalItem.kode);

        if (error) {
          console.error('Error updating konfirmasi in Supabase:', error);
          setErrorMsg(`Gagal menyimpan ke Supabase DB: ${error.message}`);
          return;
        }
      }
    } catch (err: any) {
      console.error('Exception updating konfirmasi:', err);
      setErrorMsg(`Terjadi kesalahan: ${err.message || err}`);
      return;
    }

    if (modalItem.tipe !== 'TAMU_UNDANGAN') {
      store.editKonfirmasiManual(modalItem.kode, editL, editP, editCatatan);
    }

    await fetchKonfirmasiData();
    setSuccessToast(
      `Konfirmasi ${modalItem.tipe === 'TAMU_UNDANGAN' ? 'tamu' : 'santri'} ${modalItem.namaSantri || modalItem.namaWali} (${modalItem.kode}) berhasil diperbarui secara manual!`
    );
    setTimeout(() => setSuccessToast(''), 4000);
    setModalItem(null);
  };

  // State Pengiriman Fonnte Otomatis
  const [sendingFonnteKode, setSendingFonnteKode] = useState<string | null>(null);
  const [sentFonnteKodes, setSentFonnteKodes] = useState<Record<string, string>>({});
  const [isBlasting, setIsBlasting] = useState(false);

  // Kirim Pengingat Fonnte Satuan
  const handleKirimFonnte = async (item: KonfirmasiItem) => {
    if (!item.noHp || item.noHp.trim().length < 8 || item.noHp === '-') {
      alert(`Nomor WhatsApp untuk wali ${item.namaWali} tidak valid atau kosong!`);
      return false;
    }

    setSendingFonnteKode(item.kode);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://haflah.p3tq.id';
      const teks = buatPesanPengingatKonfirmasi(item.namaSantri !== '-' ? item.namaSantri : item.namaWali, item.kode, origin);

      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: item.noHp,
          message: teks,
        }),
      });

      const json = await res.json();
      if (json.ok) {
        const timeStr = new Date().toTimeString().split(' ')[0] + ' WIB';
        setSentFonnteKodes((prev) => ({ ...prev, [item.kode]: timeStr }));
        setSuccessToast(`Pesan pengingat berhasil dikirim via Fonnte ke ${item.namaWali} (${item.noHp})`);
        setTimeout(() => setSuccessToast(''), 4000);
        setSendingFonnteKode(null);
        return true;
      } else {
        alert(`Gagal mengirim via Fonnte: ${json.data?.reason || json.message || 'Error server Fonnte'}`);
        setSendingFonnteKode(null);
        return false;
      }
    } catch (err: any) {
      alert(`Gagal menghubungi server Fonnte: ${err.message}`);
      setSendingFonnteKode(null);
      return false;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast Notifikasi Sukses */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-800 text-white shadow-xl flex items-center space-x-3 border-2 border-emerald-600 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <div className="text-xs font-semibold">{successToast}</div>
        </div>
      )}

      {/* STATS & FILTER SECTION */}
      <KonfirmasiStatsAndFilters
        activeMainTab={activeMainTab}
        setActiveMainTab={setActiveMainTab}
        daftarSantriCount={daftarSantri.length}
        daftarTamuCount={daftarTamu.length}
        rekap={rekap}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterKategori={filterKategori}
        setFilterKategori={setFilterKategori}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredCount={filteredList.length}
        currentDatasetCount={currentDataset.length}
        onResetPage={() => setCurrentPage(1)}
        onRefreshData={fetchKonfirmasiData}
      >
        {/* TABEL DATA KONFIRMASI */}
        <KonfirmasiTableSection
          activeMainTab={activeMainTab}
          paginatedList={paginatedList}
          filteredListLength={filteredList.length}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          handlePageChange={handlePageChange}
          handleOpenEdit={handleOpenEdit}
          handleKirimFonnte={handleKirimFonnte}
          sendingFonnteKode={sendingFonnteKode}
          sentFonnteKodes={sentFonnteKodes}
          isBlasting={isBlasting}
        />
      </KonfirmasiStatsAndFilters>

      {/* MODAL EDIT MANUAL KONFIRMASI */}
      <KonfirmasiEditModal
        modalItem={modalItem}
        onClose={() => setModalItem(null)}
        errorMsg={errorMsg}
        editL={editL}
        setEditL={setEditL}
        editP={editP}
        setEditP={setEditP}
        editCatatan={editCatatan}
        setEditCatatan={setEditCatatan}
        onSubmit={handleSimpanEdit}
      />
    </div>
  );
}
