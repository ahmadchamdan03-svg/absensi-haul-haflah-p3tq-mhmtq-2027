'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { store } from '@/lib/mock-data';
import { buatPesanPengingatKonfirmasi, buatPesanKonfirmasiTamu, normalkanNomorHp } from '@/lib/hmac';
import { logAudit } from '@/lib/audit-log';
import { useWaQueue, WaEnqueuePayload } from '@/lib/use-wa-queue';
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

  const realtimeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    activeQueueCount,
    sendingItem,
    pendingItems,
    nextDelaySeconds,
    sendingKode: queueSendingKode,
    queuedKodes,
    enqueueWaMessages,
    cancelPendingWaQueue,
  } = useWaQueue();

  const showSuccessToast = (msg: string, durationMs = 6000) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setSuccessToast(msg);
    toastTimerRef.current = setTimeout(() => {
      setSuccessToast('');
      toastTimerRef.current = null;
    }, durationMs);
  };

  useEffect(() => {
    fetchKonfirmasiData();

    const handleRealtimeChange = () => {
      if (realtimeDebounceRef.current) {
        clearTimeout(realtimeDebounceRef.current);
      }
      realtimeDebounceRef.current = setTimeout(() => {
        fetchKonfirmasiData();
      }, 600);
    };

    const handleQueueProcessed = (evt: Event) => {
      const detail = (evt as CustomEvent).detail;
      if (
        detail?.status === 'PROCESSED' &&
        detail?.sentOk &&
        detail?.targetTable === 'peserta_santri' &&
        detail?.targetColumn === 'status_wa_konfirmasi' &&
        detail?.targetKode
      ) {
        const sentIso = new Date().toISOString();
        setDaftarSantri((prev) =>
          prev.map((s) =>
            s.kode === detail.targetKode
              ? { ...s, waReminderSentAt: sentIso, statusWaKonfirmasi: 'TERKIRIM' }
              : s
          )
        );
      }
    };

    window.addEventListener('wa-queue-processed', handleQueueProcessed);

    const channel = supabase
      .channel('konfirmasi_page_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'peserta_santri' }, handleRealtimeChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tamu_undangan' }, handleRealtimeChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presensi_log' }, handleRealtimeChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pembelian_kuota' }, handleRealtimeChange)
      .subscribe();

    return () => {
      if (realtimeDebounceRef.current) {
        clearTimeout(realtimeDebounceRef.current);
      }
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      window.removeEventListener('wa-queue-processed', handleQueueProcessed);
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
        const patchRes = await fetch('/api/tamu', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kode: modalItem.kode,
            status_konfirmasi: editL + editP > 0 ? 'SUDAH' : 'BELUM',
            catatan_konfirmasi: editCatatan,
            confirmed_at: editL + editP > 0 ? new Date().toISOString() : null,
          }),
        });
        const patchJson = await patchRes.json();

        if (!patchRes.ok || !patchJson.ok) {
          console.error('Error updating tamu konfirmasi:', patchJson.error);
          setErrorMsg(`Gagal menyimpan konfirmasi tamu: ${patchJson.error || 'Server error'}`);
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
        const patchRes = await fetch('/api/santri', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kode: modalItem.kode,
            perkiraan_l: editL,
            perkiraan_p: editP,
            status_konfirmasi: editL + editP > 0 ? 'SUDAH' : 'BELUM',
            catatan_konfirmasi: editCatatan,
          }),
        });
        const patchJson = await patchRes.json();

        if (!patchRes.ok || !patchJson.ok) {
          console.error('Error updating santri konfirmasi:', patchJson.error);
          setErrorMsg(`Gagal menyimpan konfirmasi santri: ${patchJson.error || 'Server error'}`);
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
    showSuccessToast(
      `Konfirmasi ${modalItem.tipe === 'TAMU_UNDANGAN' ? 'tamu' : 'santri'} ${modalItem.namaSantri || modalItem.namaWali} (${modalItem.kode}) berhasil diperbarui secara manual!`,
      4000
    );
    setModalItem(null);
  };

  // State Pengiriman Fonnte Otomatis & Antrean Global
  const [sendingFonnteKode, setSendingFonnteKode] = useState<string | null>(null);
  const [sentFonnteKodes, setSentFonnteKodes] = useState<Record<string, string>>({});
  const [isEnqueuingReminder, setIsEnqueuingReminder] = useState(false);

  const handleCancelPendingQueue = async () => {
    try {
      await cancelPendingWaQueue();
      showSuccessToast('Sisa antrean pengingat berhasil dihentikan.', 4000);
    } catch (err: any) {
      alert(err.message || 'Gagal menghentikan antrean.');
    }
  };

  // Kirim Pengingat Massal via Bulk Insert ke Antrean Global (wa_queue)
  const handleKirimPengingatMassal = async () => {
    if (isEnqueuingReminder) return;

    const baseCandidates =
      activeMainTab === 'WALI_SANTRI' && (filterKategori !== 'SEMUA' || searchQuery.trim() !== '')
        ? filteredList
        : daftarSantri;

    const queuedSet = new Set(queuedKodes);

    const targetList = baseCandidates.filter((item) => {
      const isUnconfirmed = String(item.statusKonfirmasi || 'BELUM').toUpperCase() === 'BELUM';
      const isNeverReminded =
        !item.waReminderSentAt &&
        item.statusWaKonfirmasi !== 'TERKIRIM' &&
        !sentFonnteKodes[item.kode];
      const isNotInActiveQueue =
        !queuedSet.has(item.kode) && queueSendingKode !== item.kode;
      const digitsOnly = String(item.noHp || '').replace(/\D/g, '');
      const normalizedHp = normalkanNomorHp(String(item.noHp || ''));
      return (
        isUnconfirmed &&
        isNeverReminded &&
        isNotInActiveQueue &&
        digitsOnly.length >= 9 &&
        normalizedHp.startsWith('62')
      );
    });

    if (targetList.length === 0) {
      alert(
        'Tidak ada wali santri berstatus Belum Konfirmasi yang belum pernah dikirimi pengingat atau sedang tidak berada di antrean (dengan nomor HP valid minimal 9 digit).'
      );
      return;
    }

    if (
      !window.confirm(
        `Masukkan ${targetList.length} pesan pengingat kehadiran (Belum Konfirmasi & belum pernah dikirimi pengingat) ke Antrean Global Fonnte?\nPengiriman diproses otomatis di latar belakang dengan jeda acak 10-60 detik antar pesan.`
      )
    ) {
      return;
    }

    setIsEnqueuingReminder(true);
    try {
      const nowIso = new Date().toISOString();
      const queuePayloads: WaEnqueuePayload[] = targetList.map((item) => {
        const namaWali = (
          item.namaWali && item.namaWali !== '-' ? item.namaWali : 'Wali Santri'
        ).trim();
        const namaSantri = (
          item.namaSantri && item.namaSantri !== '-' ? item.namaSantri : namaWali
        ).trim();
        const targetHp = normalkanNomorHp(String(item.noHp || ''));

        const teksPesan = `Kepada Yth. Bapak/Ibu Wali Santri *${namaWali}*

Kami mengingatkan bahwa Wali Santri dari *${namaSantri}* belum mengisi konfirmasi kehadiran untuk acara Haul & Haflah Akhirussanah P3TQ & MHMTQ.

Mohon kesediaannya untuk membuka link undangan di bawah ini, scroll ke bagian Konfirmasi Kehadiran, dan mengisi jumlah rombongan (Putra & Putri) agar panitia dapat menyiapkan kursi dan konsumsi yang sesuai.

🔗 https://www.haflahp3tq.site/u/${item.kode}

Terima kasih atas kerja samanya.
Jazakumullahu khairan katsiran.
Panitia Haul & Haflah P3TQ dan MHMTQ 2027`;

        return {
          target_hp: targetHp,
          message: teksPesan,
          nama_target: namaWali,
          target_table: 'peserta_santri',
          target_id: item.id,
          target_kode: item.kode,
          target_column: 'status_wa_konfirmasi',
          tipe_pesan: 'PENGINGAT_KONFIRMASI',
          scheduled_at: nowIso,
        };
      });

      const res = await enqueueWaMessages(queuePayloads);
      const insertedCount = res.insertedCount ?? queuePayloads.length;

      if (insertedCount > 0) {
        showSuccessToast(
          `${insertedCount} pesan pengingat telah masuk ke antrean global. Pesan akan diproses di latar belakang.`,
          7000
        );
      } else {
        showSuccessToast(
          res.message || 'Pesan pengingat sudah berada di dalam antrean aktif.',
          5000
        );
      }
    } catch (err: any) {
      alert(`Gagal memasukkan pengingat ke antrean global: ${err.message || err}`);
    } finally {
      setIsEnqueuingReminder(false);
    }
  };

  // Kirim Pengingat Fonnte Satuan
  const handleKirimFonnte = async (item: KonfirmasiItem) => {
    if (!item.noHp || item.noHp.trim().length < 8 || item.noHp === '-') {
      alert(`Nomor WhatsApp untuk wali ${item.namaWali} tidak valid atau kosong!`);
      return false;
    }

    setSendingFonnteKode(item.kode);
    try {
      const origin =
        typeof window !== 'undefined' &&
        !window.location.hostname.includes('localhost') &&
        !window.location.hostname.includes('127.0.0.1')
          ? window.location.origin
          : process.env.NEXT_PUBLIC_BASE_URL || 'https://haflahp3tq.site';
      const isTamu = item.tipe === 'TAMU_UNDANGAN' || item.kode?.startsWith('UND');
      const targetNama = item.namaSantri !== '-' ? item.namaSantri : item.namaWali;
      const teks = isTamu
        ? buatPesanKonfirmasiTamu(targetNama, item.kode, origin)
        : buatPesanPengingatKonfirmasi(targetNama, item.kode, origin);

      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: item.noHp,
          message: teks,
          typing: true,
          ...(isTamu ? {} : { id: item.id, kode: item.kode, mark_reminder_sent: true }),
        }),
      });

      const json = await res.json();
      if (json.ok) {
        const timeStr = new Date().toTimeString().split(' ')[0] + ' WIB';
        setSentFonnteKodes((prev) => ({ ...prev, [item.kode]: timeStr }));
        if (!isTamu) {
          const sentIso = json.wa_reminder_sent_at || new Date().toISOString();
          setDaftarSantri((prev) =>
            prev.map((s) =>
              s.kode === item.kode
                ? { ...s, waReminderSentAt: sentIso, statusWaKonfirmasi: 'TERKIRIM' }
                : s
            )
          );
        }
        showSuccessToast(
          `Pesan pengingat berhasil dikirim via Fonnte ke ${item.namaWali} (${item.noHp})`,
          4000
        );
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
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-6 z-50 max-w-md p-4 rounded-2xl bg-blue-800 text-white shadow-xl flex items-center space-x-3 border-2 border-blue-600 animate-slide-up"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <div className="text-xs font-semibold leading-relaxed">{successToast}</div>
        </div>
      )}

      {/* STATS & FILTER SECTION */}
      <KonfirmasiStatsAndFilters
        loading={loading}
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
        isEnqueuingReminder={isEnqueuingReminder}
        activeQueueCount={activeQueueCount}
        queuePendingCount={pendingItems.length}
        queueSendingTarget={sendingItem?.nama_target || pendingItems[0]?.nama_target || null}
        nextDelaySeconds={nextDelaySeconds}
        onStartMassReminder={handleKirimPengingatMassal}
        onCancelPendingQueue={handleCancelPendingQueue}
      >
        {/* TABEL DATA KONFIRMASI */}
        <KonfirmasiTableSection
          loading={loading}
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
          isBlasting={isEnqueuingReminder}
          queuedKodes={queuedKodes}
          queueSendingKode={queueSendingKode}
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
