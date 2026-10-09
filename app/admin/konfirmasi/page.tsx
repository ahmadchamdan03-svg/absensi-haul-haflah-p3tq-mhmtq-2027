'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Users,
  CheckCircle2,
  Clock,
  Search,
  Phone,
  MessageSquare,
  Edit3,
  X,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { store } from '@/lib/mock-data';
import { buatPesanPengingatKonfirmasi, normalkanNomorHp } from '@/lib/hmac';
import { logAudit } from '@/lib/audit-log';

export default function KonfirmasiPage() {
  const [activeMainTab, setActiveMainTab] = useState<'WALI_SANTRI' | 'TAMU_UNDANGAN'>('WALI_SANTRI');
  const [daftarSantri, setDaftarSantri] = useState<any[]>([]);
  const [daftarTamu, setDaftarTamu] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'SEMUA' | 'SUDAH' | 'BELUM'>('SEMUA');
  const [filterKategori, setFilterKategori] = useState<
    'SEMUA' | 'BIL_GHOIB' | 'BIN_NADZOR' | 'TAMATAN'
  >('SEMUA');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Modal Edit Manual
  const [modalItem, setModalItem] = useState<any | null>(null);
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
        const mapped = resSantri.data.map((s: any) => {
          const kDasar = Number(s.kuota_dasar || 2);
          const kTambahan = Number(s.kuota_tambahan || 0);
          const totKuota = kDasar + kTambahan;
          const terpakai = Number(s.kuota_terpakai || 0);

          const estL = Number(s.perkiraan_l || 0);
          const estP = Number(s.perkiraan_p || 0);
          const sumEst = estL + estP;

          const isSudah = s.status_konfirmasi === 'SUDAH' || (s.status_konfirmasi !== 'BELUM' && (sumEst > 0 || terpakai > 0));
          const status = isSudah ? 'SUDAH' : 'BELUM';
          const totalEst = isSudah ? (sumEst > 0 ? sumEst : terpakai) : 0;

          return {
            id: s.id,
            tipe: 'WALI_SANTRI',
            kode: s.kode || s.nis || 'SH000',
            namaSantri: s.nama || '-',
            namaWali: s.nama_wali || '-',
            noHp: s.no_hp || '-',
            alamat: s.alamat || '-',
            kamar: s.kamar || '-',
            kategoriUtama: s.kategori_utama || 'BIL_GHOIB',
            subKategori: s.sub_kategori || 'Bil Ghoib',
            kelas: s.kelas || '-',
            kuotaDasar: kDasar,
            kuotaTambahan: kTambahan,
            totalKuota: totKuota,
            statusKonfirmasi: status,
            perkiraanL: estL,
            perkiraanP: estP,
            totalEstimasi: totalEst,
            catatan: s.catatan_konfirmasi || s.catatan || '',
            diubahOleh: s.diubah_oleh || (status === 'SUDAH' ? 'PANITIA_MANUAL' : 'WALI_SANTRI'),
            diisiAt: s.created_at || s.updated_at,
          };
        });
        setDaftarSantri(mapped);
      } else {
        setDaftarSantri([]);
      }

      if (resTamu.data && !resTamu.error) {
        const mappedTamu = resTamu.data.map((t: any) => {
          const countL = t.nama_putra && String(t.nama_putra).trim() ? 1 : 0;
          const countP = t.nama_putri && String(t.nama_putri).trim() ? 1 : 0;
          const totKuota = countL + countP;
          const terpakai = Number(t.kuota_terpakai || 0);

          const rawStatus = String(t.status_konfirmasi || '').toUpperCase().trim();
          const isSudah = ['HADIR', 'BERHALANGAN', 'SUDAH'].includes(rawStatus) || Boolean(t.confirmed_at) || terpakai > 0;
          const status = isSudah ? 'SUDAH' : 'BELUM';
          const isHadir = rawStatus === 'HADIR' || rawStatus === 'SUDAH' || (rawStatus !== 'BERHALANGAN' && isSudah);

          return {
            id: t.id,
            tipe: 'TAMU_UNDANGAN',
            kode: t.kode || 'UND000',
            namaSantri: t.nama || [t.nama_putra, t.nama_putri].filter(Boolean).join(' & ') || 'Tamu Undangan',
            namaWali: t.instansi || t.alamat || 'Tamu Undangan',
            namaPutra: t.nama_putra || '',
            namaPutri: t.nama_putri || '',
            noHp: t.no_hp || '-',
            alamat: t.alamat || '-',
            kamar: '-',
            kategoriUtama: t.kategori || 'Tamu Undangan',
            subKategori: t.sub_kategori || 'ISTIMEWA',
            kelas: t.kategori || 'Tamu',
            kuotaDasar: totKuota,
            kuotaTambahan: 0,
            totalKuota: totKuota,
            statusKonfirmasi: status,
            rawStatusKonfirmasi: rawStatus || (isSudah ? 'HADIR' : 'BELUM'),
            perkiraanL: countL,
            perkiraanP: countP,
            totalEstimasi: isHadir ? totKuota : 0,
            catatan: t.catatan_konfirmasi || '',
            diubahOleh: 'TAMU_OFFICIAL',
            diisiAt: t.confirmed_at || t.updated_at || t.created_at,
          };
        });
        setDaftarTamu(mappedTamu);
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
    const totalSantri = currentDataset.length;
    const totalKuotaSantri = currentDataset.reduce((acc, curr) => acc + (curr.totalKuota || 0), 0);
    const sudahKonfirmasiCount = currentDataset.filter((s) => s.statusKonfirmasi === 'SUDAH').length;
    const belumKonfirmasiCount = Math.max(0, totalSantri - sudahKonfirmasiCount);
    const persentaseSudah = totalSantri > 0 ? Math.round((sudahKonfirmasiCount / totalSantri) * 100) : 0;
    
    const totalEstimasiRombongan = activeMainTab === 'WALI_SANTRI'
      ? currentDataset.reduce((acc, curr) => acc + (curr.totalEstimasi || 0), 0)
      : currentDataset.filter((s) => s.statusKonfirmasi === 'SUDAH').reduce((acc, curr) => acc + (curr.totalKuota || 0), 0);

    const totalEstL = currentDataset.reduce((acc, curr) => acc + (curr.perkiraanL || 0), 0);
    const totalEstP = currentDataset.reduce((acc, curr) => acc + (curr.perkiraanP || 0), 0);

    const countHadirL = currentDataset.filter((s) => s.statusKonfirmasi === 'SUDAH' && (s.namaPutra || s.perkiraanL > 0)).length;
    const countHadirP = currentDataset.filter((s) => s.statusKonfirmasi === 'SUDAH' && (s.namaPutri || s.perkiraanP > 0)).length;

    const bilGhoibCount = currentDataset.filter((s) => s.kategoriUtama === 'BIL_GHOIB').length;
    const binNadzorCount = currentDataset.filter((s) => s.kategoriUtama === 'BIN_NADZOR').length;
    const tamatanCount = currentDataset.filter((s) => s.kategoriUtama === 'TAMATAN').length;

    return {
      totalSantri,
      totalKuotaSantri,
      sudahKonfirmasiCount,
      belumKonfirmasiCount,
      persentaseSudah,
      totalEstimasiRombongan,
      totalEstL,
      totalEstP,
      countHadirL,
      countHadirP,
      bilGhoibCount,
      binNadzorCount,
      tamatanCount,
    };
  }, [currentDataset, activeMainTab]);

  // Filtered List
  const filteredList = useMemo(() => {
    return currentDataset.filter((item) => {
      // Filter Status Konfirmasi
      if (filterStatus !== 'SEMUA' && item.statusKonfirmasi !== filterStatus) {
        return false;
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
  const handleOpenEdit = (item: any) => {
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

  // State Batch Blast Fonnte
  const [isBlasting, setIsBlasting] = useState(false);
  const [blastProgress, setBlastProgress] = useState({ current: 0, total: 0, sukses: 0, gagal: 0 });
  const stopBlastRef = useRef(false);

  // Kirim Pengingat Fonnte Satuan
  const handleKirimFonnte = async (item: any) => {
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

  // Batch Blasting Fonnte untuk Santri yang Belum Konfirmasi
  const handleStartBatchBlast = async () => {
    const targetList = daftarSantri.filter(
      (s) => s.statusKonfirmasi === 'BELUM' && s.noHp && s.noHp.trim().length >= 8 && s.noHp !== '-' && !sentFonnteKodes[s.kode]
    );

    if (targetList.length === 0) {
      alert('Semua wali santri yang belum konfirmasi sudah dikirimi pesan pengingat di sesi ini!');
      return;
    }

    if (
      !confirm(
        `PERHATIAN: Anda akan mengirimkan Pesan Pengingat Konfirmasi Kehadiran via API Fonnte ke ${targetList.length} wali santri yang BELUM konfirmasi.\n\nPesan akan dikirim otomatis dengan jeda aman 1.5 detik per pesan.\n\nLanjutkan?`
      )
    ) {
      return;
    }

    setIsBlasting(true);
    stopBlastRef.current = false;
    setBlastProgress({ current: 0, total: targetList.length, sukses: 0, gagal: 0 });

    let suksesCount = 0;
    let gagalCount = 0;

    for (let i = 0; i < targetList.length; i++) {
      if (stopBlastRef.current) {
        break;
      }

      const item = targetList[i];
      setBlastProgress((prev) => ({ ...prev, current: i + 1 }));

      const ok = await handleKirimFonnte(item);
      if (ok) {
        suksesCount++;
      } else {
        gagalCount++;
      }

      setBlastProgress((prev) => ({ ...prev, sukses: suksesCount, gagal: gagalCount }));

      if (i < targetList.length - 1 && !stopBlastRef.current) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    setIsBlasting(false);
    setSuccessToast(`Selesai blasting pengingat! Berhasil: ${suksesCount}, Gagal: ${gagalCount}`);
    setTimeout(() => setSuccessToast(''), 5000);
  };

  const handleStopBlast = () => {
    stopBlastRef.current = true;
    setIsBlasting(false);
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

      {/* Header Halaman */}
      <div className="bg-gradient-to-r from-[#FAF7F3] via-[#EFE8E1] to-[#FAF7F3] text-[#422F21] rounded-3xl p-4 sm:p-6 shadow-sm border-2 border-[#8C6A47]/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF7F3] text-[#8C6A47] text-[10px] sm:text-xs font-serif font-black border-2 border-[#D49B5B] max-w-full truncate">
              <Sparkles className="w-3 h-3 text-[#D49B5B] shrink-0" />
              <span className="truncate">PANEL PANITIA · REKAPITULASI PRA-ACARA</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-serif font-black tracking-tight text-[#422F21] leading-tight">
              Monitoring Konfirmasi Kehadiran {activeMainTab === 'WALI_SANTRI' ? 'Wali Santri' : 'Tamu Undangan'}
            </h1>
          </div>

          {/* TOGGLE WALI SANTRI / TAMU UNDANGAN */}
          <div className="flex items-center space-x-2 bg-[#FAF7F3] p-1.5 rounded-2xl border-2 border-[#8C6A47]/30 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveMainTab('WALI_SANTRI');
                setFilterKategori('SEMUA');
                setCurrentPage(1);
                fetchKonfirmasiData();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-2 ${
                activeMainTab === 'WALI_SANTRI'
                  ? 'bg-[#8C6A47] text-white shadow-md'
                  : 'text-[#7A624E] hover:bg-[#EFE8E1]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Wali Santri ({daftarSantri.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMainTab('TAMU_UNDANGAN');
                setFilterKategori('SEMUA');
                setCurrentPage(1);
                fetchKonfirmasiData();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-2 ${
                activeMainTab === 'TAMU_UNDANGAN'
                  ? 'bg-[#8C6A47] text-white shadow-md'
                  : 'text-[#7A624E] hover:bg-[#EFE8E1]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D49B5B]" />
              <span>Tamu Undangan ({daftarTamu.length})</span>
            </button>
          </div>
        </div>
        <p className="text-xs text-[#7A624E] font-medium leading-relaxed">
          {activeMainTab === 'WALI_SANTRI'
            ? 'Pantau total konfirmasi kehadiran, data rombongan Laki-laki & Perempuan untuk alokasi konsumsi dan kursi wali santri.'
            : 'Pantau konfirmasi kehadiran Tamu Undangan / Kehormatan, jatah kursi alokasi, dan perkiraan rombongan.'}
        </p>
      </div>

      {/* 4 KARTU METRIK RINGKASAN KONFIRMASI (MOBILE 2 KOLOM x 2 BARIS, DESKTOP 4 KOLOM) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Card 1: Total Santri / Tamu */}
        <button
          type="button"
          onClick={() => {
            setFilterStatus('SEMUA');
            const el = document.getElementById('tabel-konfirmasi');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className={`rounded-3xl p-3.5 sm:p-5 shadow-sm border-2 text-left transition-all duration-200 cursor-pointer relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 min-h-[110px] flex flex-col justify-between ${
            filterStatus === 'SEMUA'
              ? 'bg-[#FAF7F3] border-[#8C6A47] ring-2 ring-[#8C6A47]/30'
              : 'bg-[#FAF7F3] border-[#D5C4B4] hover:border-[#8C6A47]'
          }`}
          title="Klik untuk menampilkan seluruh data"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-[#7A624E] uppercase tracking-wider group-hover:text-[#422F21]">
              {activeMainTab === 'WALI_SANTRI' ? 'Total Santri Riil' : 'TOTAL TAMU UNDANGAN'}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#EFE8E1] group-hover:bg-[#8C6A47] group-hover:text-white flex items-center justify-center text-[#8C6A47] transition-colors shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-serif font-black text-[#422F21] my-1">
            {rekap.totalSantri}{' '}
            <span className="text-xs sm:text-sm font-sans font-medium text-[#7A624E]">
              {activeMainTab === 'WALI_SANTRI' ? 'Santri' : 'Tamu'}
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
            const el = document.getElementById('tabel-konfirmasi');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className={`rounded-3xl p-3.5 sm:p-5 shadow-sm border-2 text-left transition-all duration-200 cursor-pointer relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 min-h-[110px] flex flex-col justify-between ${
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
              {activeMainTab === 'WALI_SANTRI' ? 'Wali' : 'Tamu'} ({rekap.persentaseSudah}%)
            </span>
          </div>
          <div className="text-[10px] sm:text-xs text-emerald-800 font-semibold truncate">
            <span className="truncate">
              {activeMainTab === 'WALI_SANTRI'
                ? `Est: ${rekap.totalEstimasiRombongan} Orang`
                : `Est: ${rekap.countHadirL} Laki-laki, ${rekap.countHadirP} Perempuan`}
            </span>
          </div>
        </button>

        {/* Card 3: Belum Konfirmasi */}
        <button
          type="button"
          onClick={() => {
            setFilterStatus('BELUM');
            const el = document.getElementById('tabel-konfirmasi');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className={`rounded-3xl p-3.5 sm:p-5 shadow-sm border-2 text-left transition-all duration-200 cursor-pointer relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 min-h-[110px] flex flex-col justify-between ${
            filterStatus === 'BELUM'
              ? 'bg-amber-50/90 border-amber-600 ring-2 ring-amber-500/30'
              : 'bg-[#FAF7F3] border-[#D5C4B4] hover:border-amber-500 hover:bg-amber-50/50'
          }`}
          title="Klik untuk memfilter data yang BELUM konfirmasi"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-amber-800 uppercase tracking-wider">
              Belum Konfirmasi
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-100 group-hover:bg-amber-600 group-hover:text-white flex items-center justify-center text-amber-700 transition-colors shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-serif font-black text-amber-900 my-1">
            {rekap.belumKonfirmasiCount}{' '}
            <span className="text-xs sm:text-sm font-sans font-medium text-amber-700">
              {activeMainTab === 'WALI_SANTRI' ? 'Wali' : 'Tamu'} ({100 - rekap.persentaseSudah}%)
            </span>
          </div>
          <div className="text-[10px] sm:text-xs text-amber-800 font-semibold truncate">
            <span>Menunggu konfirmasi</span>
          </div>
        </button>

        {/* Card 4: Estimasi Kursi Hadir */}
        <button
          type="button"
          onClick={() => {
            setFilterStatus('SUDAH');
            const el = document.getElementById('tabel-konfirmasi');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="rounded-3xl p-3.5 sm:p-5 shadow-sm border-2 border-[#D5C4B4] hover:border-[#8C6A47] bg-[#FAF7F3] hover:bg-[#F5EFE6] text-left transition-all duration-200 cursor-pointer relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 min-h-[110px] flex flex-col justify-between"
          title="Klik untuk melihat rincian alokasi kursi hadir"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-[#8C6A47] uppercase tracking-wider">
              ESTIMASI KURSI HADIR
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#EFE8E1] group-hover:bg-[#8C6A47] group-hover:text-white flex items-center justify-center text-[#8C6A47] transition-colors shrink-0">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-serif font-black text-[#422F21] my-1">
            {rekap.totalEstimasiRombongan}{' '}
            <span className="text-xs sm:text-sm font-sans font-medium text-[#7A624E]">Kursi</span>
          </div>
          <div className="text-[10px] sm:text-xs text-[#7A624E] font-medium truncate">
            {activeMainTab === 'WALI_SANTRI' ? 'Alokasi santri & rombongan' : 'Estimasi tamu yang hadir'}
          </div>
        </button>
      </div>

      {/* FILTER & PENCARIAN */}
      <div id="tabel-konfirmasi" className="bg-[#FAF7F3] rounded-3xl p-4 sm:p-6 shadow-sm border-2 border-[#D5C4B4] space-y-4 scroll-mt-6">
        {/* Toggle Switch Status Konfirmasi dengan Scroll Horizontal di Mobile */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-2 bg-[#EFE8E1]/70 rounded-2xl border border-[#D5C4B4]">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 -mx-1 px-1 whitespace-nowrap no-scrollbar">
            <span className="text-xs font-bold text-[#7A624E] pl-1 hidden sm:inline">Status:</span>
            <button
              onClick={() => setFilterStatus('SEMUA')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filterStatus === 'SEMUA'
                  ? 'bg-[#8C6A47] text-white shadow-sm'
                  : 'bg-white text-[#7A624E] hover:bg-[#FAF7F3] border border-[#D5C4B4]'
              }`}
            >
              Semua ({daftarSantri.length})
            </button>
            <button
              onClick={() => setFilterStatus('SUDAH')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
                filterStatus === 'SUDAH'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white text-emerald-800 hover:bg-[#FAF7F3] border border-[#D5C4B4]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sudah Konfirmasi ({rekap.sudahKonfirmasiCount})</span>
            </button>
            <button
              onClick={() => setFilterStatus('BELUM')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
                filterStatus === 'BELUM'
                  ? 'bg-amber-700 text-white shadow-sm'
                  : 'bg-white text-amber-800 hover:bg-[#FAF7F3] border border-[#D5C4B4]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Belum Konfirmasi ({rekap.belumKonfirmasiCount})</span>
            </button>
          </div>

          <div className="text-[11px] sm:text-xs text-[#7A624E] font-medium self-end md:self-auto">
            Menampilkan {filteredList.length} dari {currentDataset.length} {activeMainTab === 'WALI_SANTRI' ? 'santri' : 'tamu'}
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
              placeholder={activeMainTab === 'WALI_SANTRI' ? "Cari nama santri, wali, kode (SH0001), kelas, kamar, alamat..." : "Cari nama tamu, instansi, kode (UND0001), alamat, no hp..."}
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
              <span className="text-xs font-bold text-[#7A624E] hidden sm:inline shrink-0">Kategori:</span>
              <select
                value={filterKategori}
                onChange={(e) => setFilterKategori(e.target.value as any)}
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

        {/* Indikator Geser di Layar HP */}
        <div className="md:hidden px-3.5 py-2 bg-amber-50/90 border-2 border-b-0 border-[#D5C4B4] rounded-t-2xl text-[11px] font-semibold text-[#8C6A47] flex items-center justify-between mt-3">
          <span className="flex items-center space-x-1.5">
            <span>👉</span>
            <span>Geser tabel ke samping untuk melihat Kontak, Kuota &amp; Aksi</span>
          </span>
          <span className="text-xs">↔️</span>
        </div>

        {/* TABEL DATA KONFIRMASI */}
        <div className="overflow-x-auto rounded-b-2xl md:rounded-2xl border-2 border-[#D5C4B4] bg-white shadow-sm mt-0 md:mt-3">
          <table className="w-full text-left text-xs text-[#422F21]">
            <thead className="bg-[#EFE8E1] text-[#5C3E28] font-bold uppercase tracking-wider border-b border-[#D5C4B4]">
              <tr>
                <th className="py-3 px-3.5 whitespace-nowrap">{activeMainTab === 'WALI_SANTRI' ? 'Kode & Santri' : 'Kode & Tamu'}</th>
                <th className="py-3 px-3.5 whitespace-nowrap">{activeMainTab === 'WALI_SANTRI' ? 'Kategori & Kelas' : 'Kategori & Golongan'}</th>
                <th className="py-3 px-3.5 whitespace-nowrap">{activeMainTab === 'WALI_SANTRI' ? 'Nama Wali & Kontak WA' : 'Instansi & Kontak WA'}</th>
                <th className="py-3 px-3.5 text-center whitespace-nowrap">Jatah Kuota</th>
                <th className="py-3 px-3.5 text-center whitespace-nowrap">Status Konfirmasi</th>
                <th className="py-3 px-3.5 text-center whitespace-nowrap">Estimasi Kursi</th>
                <th className="py-3 px-3.5 text-center whitespace-nowrap">Aksi Panitia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D5C4B4]/40">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#7A624E]">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="w-8 h-8 text-[#8C6A47]/40" />
                      <div className="font-semibold">Tidak ada data {activeMainTab === 'WALI_SANTRI' ? 'santri' : 'tamu undangan'} yang cocok</div>
                      <div className="text-[11px] text-[#7A624E]">
                        Silakan sesuaikan filter status konfirmasi atau kata kunci pencarian.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedList.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAF7F3] transition-colors">
                    {/* Kode & Santri */}
                    <td className="py-3 px-4">
                      <div className="font-serif font-black text-sm text-[#422F21]">
                        {item.namaSantri}
                      </div>
                      <div className="flex items-center space-x-1.5 text-[11px] text-[#8C6A47] font-mono mt-0.5">
                        <span className="font-bold">{item.kode}</span>
                        {item.kamar && item.kamar !== '-' && (
                          <span className="text-[#7A624E]">· Kamar {item.kamar}</span>
                        )}
                      </div>
                    </td>

                    {/* Kategori & Kelas */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          item.kategoriUtama === 'BIL_GHOIB'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : item.kategoriUtama === 'TAMATAN'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-blue-100 text-blue-900 border border-blue-300'
                        }`}
                      >
                        {item.subKategori}
                      </span>
                      <div className="text-[11px] text-[#7A624E] mt-0.5 font-medium">
                        Kelas: {item.kelas}
                      </div>
                    </td>

                    {/* Nama Wali & Kontak WA (Riil dari Supabase DB) */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#422F21]">{item.namaWali}</div>
                      <div className="text-[11px] text-[#7A624E] flex items-center space-x-2 mt-0.5">
                        {item.noHp && item.noHp !== '-' && item.noHp !== 'Tanpa Kontak HP' ? (
                          <a
                            href={`https://wa.me/${item.noHp.replace(/\D/g, '').replace(/^0/, '62')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-700 hover:text-emerald-900 font-mono font-bold flex items-center space-x-1 underline"
                            title="Hubungi Wali via WhatsApp"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{item.noHp}</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-gray-400">Tanpa Kontak HP</span>
                        )}
                      </div>
                      {item.alamat && item.alamat !== '-' && (
                        <div className="text-[10px] text-[#7A624E]/80 mt-0.5 truncate max-w-xs">
                          {item.alamat}
                        </div>
                      )}
                    </td>

                    {/* Jatah Kuota */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="font-mono font-black text-sm text-[#422F21]">
                        {item.totalKuota} <span className="text-xs font-normal text-[#7A624E]">Kursi</span>
                      </div>
                      <div className="text-[10px] text-[#8C6A47]">
                        {item.kuotaDasar} Dasar
                        {item.kuotaTambahan > 0 && ` + ${item.kuotaTambahan} Tambahan`}
                      </div>
                    </td>

                    {/* Status Konfirmasi */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {item.rawStatusKonfirmasi === 'BERHALANGAN' ? (
                        <div>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <Clock className="w-3 h-3 mr-1 text-rose-600" />
                            Berhalangan Hadir
                          </span>
                          {item.diisiAt && (
                            <div className="text-[9px] text-[#7A624E] mt-0.5">
                              {new Date(item.diisiAt).toLocaleDateString('id-ID')}
                            </div>
                          )}
                        </div>
                      ) : item.statusKonfirmasi === 'SUDAH' ? (
                        <div>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                            Sudah Konfirmasi
                          </span>
                          <div className="text-[10px] text-[#7A624E] mt-0.5">
                            {item.diubahOleh === 'PANITIA_MANUAL' ? (
                              <span className="text-[#8C6A47] font-semibold">Oleh: Panitia Manual</span>
                            ) : item.tipe === 'TAMU_UNDANGAN' ? (
                              <span className="text-[#8C6A47] font-semibold">Oleh: Tamu (RSVP)</span>
                            ) : (
                              <span>Oleh: Wali Santri</span>
                            )}
                          </div>
                          {item.diisiAt && (
                            <div className="text-[9px] text-[#7A624E]">
                              {new Date(item.diisiAt).toLocaleDateString('id-ID')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <Clock className="w-3 h-3 mr-1 text-amber-600" />
                            Belum Konfirmasi
                          </span>
                          <div className="text-[10px] text-[#7A624E] mt-0.5">Menunggu respon</div>
                        </div>
                      )}
                    </td>

                    {/* Estimasi Kursi */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {item.statusKonfirmasi === 'SUDAH' ? (
                        <div>
                          <div className="font-black text-[#422F21] text-sm">
                            {item.totalEstimasi}{' '}
                            <span className="text-xs font-normal text-[#7A624E]">Orang</span>
                          </div>
                          <div className="text-[10px] text-[#8C6A47] font-medium">
                            L: {item.perkiraanL} · P: {item.perkiraanP}
                          </div>
                          {item.catatan && (
                            <div
                              className="text-[10px] text-stone-600 italic mt-0.5 truncate max-w-[120px]"
                              title={item.catatan}
                            >
                              "{item.catatan}"
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 font-mono text-xs">-</span>
                      )}
                    </td>

                    {/* Aksi Panitia */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1.5">
                        {/* Edit Manual */}
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF7F3] text-[#8C6A47] border border-[#D5C4B4] font-bold text-xs flex items-center space-x-1 shadow-sm transition-all cursor-pointer"
                          title="Edit Konfirmasi Secara Manual"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

                        {/* Kirim via Fonnte Otomatis */}
                        {item.noHp && item.noHp !== '-' && item.noHp !== 'Tanpa Kontak HP' ? (
                          sentFonnteKodes[item.kode] ? (
                            <div
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[11px] flex items-center space-x-1"
                              title={`Terkirim via Fonnte jam ${sentFonnteKodes[item.kode]}`}
                            >
                              <Check className="w-3 h-3 text-emerald-700" />
                              <span>Terkirim</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleKirimFonnte(item)}
                              disabled={sendingFonnteKode === item.kode || isBlasting}
                              className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 shadow-sm transition-all cursor-pointer ${
                                item.statusKonfirmasi === 'BELUM'
                                  ? 'bg-amber-600 hover:bg-amber-700 text-white border border-amber-700'
                                  : 'bg-emerald-700 hover:bg-emerald-800 text-white border border-emerald-800'
                              } disabled:opacity-50`}
                              title={
                                item.statusKonfirmasi === 'BELUM'
                                  ? 'Kirim Pesan Pengingat Otomatis via API Fonnte'
                                  : 'Kirim Pengingat Ulang via API Fonnte'
                              }
                            >
                              {sendingFonnteKode === item.kode ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin text-white" />
                                  <span>Kirim...</span>
                                </>
                              ) : (
                                <>
                                  <Zap className="w-3 h-3 text-amber-200" />
                                  <span>Fonnte</span>
                                </>
                              )}
                            </button>
                          )
                        ) : null}

                        {/* Link Chat WhatsApp Web Manual */}
                        {item.noHp && item.noHp !== '-' && item.noHp !== 'Tanpa Kontak HP' && (
                          <a
                            href={`https://wa.me/${normalkanNomorHp(item.noHp)}?text=${encodeURIComponent(
                              buatPesanPengingatKonfirmasi(
                                item.namaSantri !== '-' ? item.namaSantri : item.namaWali,
                                item.kode,
                                typeof window !== 'undefined' ? window.location.origin : 'https://haflah.p3tq.id'
                              )
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 transition-all cursor-pointer"
                            title="Buka Chat Pengingat Resmi di WhatsApp Web"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginasi Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-[#7A624E]">
          <div>
            Menampilkan{' '}
            <span className="font-bold text-[#422F21]">
              {filteredList.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
            </span>{' '}
            hingga{' '}
            <span className="font-bold text-[#422F21]">
              {Math.min(currentPage * itemsPerPage, filteredList.length)}
            </span>{' '}
            dari <span className="font-bold text-[#422F21]">{filteredList.length}</span> data terfilter
          </div>

          <div className="flex items-center space-x-2 self-center sm:self-auto">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-xl border border-[#D5C4B4] bg-white hover:bg-[#FAF7F3] disabled:opacity-40 disabled:hover:bg-white text-[#422F21] transition-colors cursor-pointer"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-xs px-2">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-xl border border-[#D5C4B4] bg-white hover:bg-[#FAF7F3] disabled:opacity-40 disabled:hover:bg-white text-[#422F21] transition-colors cursor-pointer"
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL EDIT MANUAL KONFIRMASI (Direct Supabase update) */}
      {modalItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FAF7F3] rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-[#8C6A47]/40 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-[#D5C4B4] pb-3">
              <div>
                <h3 className="font-serif font-black text-base text-[#422F21]">
                  Edit Konfirmasi Manual Panitia
                </h3>
                <p className="text-xs text-[#7A624E]">
                  Santri: <span className="font-bold text-[#422F21]">{modalItem.namaSantri}</span> ({modalItem.kode})
                </p>
              </div>
              <button
                onClick={() => setModalItem(null)}
                className="w-8 h-8 rounded-full bg-white border border-[#D5C4B4] text-[#7A624E] hover:text-[#422F21] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 text-red-800 text-xs border border-red-200 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSimpanEdit} className="space-y-4">
              <div className="p-3 bg-[#EFE8E1]/70 rounded-2xl border border-[#D5C4B4] text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#7A624E]">Wali Santri:</span>
                  <span className="font-bold text-[#422F21]">{modalItem.namaWali}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7A624E]">Kategori / Kelas:</span>
                  <span className="font-bold text-[#422F21]">
                    {modalItem.subKategori} ({modalItem.kelas})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7A624E]">Total Jatah Kuota:</span>
                  <span className="font-bold text-[#8C6A47]">{modalItem.totalKuota} Kursi</span>
                </div>
              </div>

              {/* Stepper Laki-laki */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#D5C4B4]">
                <div>
                  <div className="text-xs font-bold text-[#422F21]">Wali Laki-laki (Putra)</div>
                  <div className="text-[10px] text-[#7A624E]">Zona Sayap Barat</div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    disabled={editL <= 0}
                    onClick={() => setEditL(Math.max(0, editL - 1))}
                    className="w-8 h-8 rounded-lg bg-[#FAF7F3] border border-[#D5C4B4] font-bold text-[#422F21] disabled:opacity-30 transition-all cursor-pointer"
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-black text-[#422F21] text-base">{editL}</span>
                  <button
                    type="button"
                    disabled={editL + editP >= modalItem.totalKuota}
                    onClick={() => {
                      if (editL + editP < modalItem.totalKuota) setEditL(editL + 1);
                    }}
                    className="w-8 h-8 rounded-lg bg-[#FAF7F3] border border-[#D5C4B4] font-bold text-[#422F21] disabled:opacity-30 transition-all cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Stepper Perempuan */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#D5C4B4]">
                <div>
                  <div className="text-xs font-bold text-[#422F21]">Wali Perempuan (Putri)</div>
                  <div className="text-[10px] text-[#7A624E]">Zona Sayap Timur</div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    disabled={editP <= 0}
                    onClick={() => setEditP(Math.max(0, editP - 1))}
                    className="w-8 h-8 rounded-lg bg-[#FAF7F3] border border-[#D5C4B4] font-bold text-[#422F21] disabled:opacity-30 transition-all cursor-pointer"
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-black text-[#422F21] text-base">{editP}</span>
                  <button
                    type="button"
                    disabled={editL + editP >= modalItem.totalKuota}
                    onClick={() => {
                      if (editL + editP < modalItem.totalKuota) setEditP(editP + 1);
                    }}
                    className="w-8 h-8 rounded-lg bg-[#FAF7F3] border border-[#D5C4B4] font-bold text-[#422F21] disabled:opacity-30 transition-all cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#EFE8E1]/80 text-xs font-bold text-[#7A624E]">
                <span>Total Estimasi:</span>
                <span className="text-[#8C6A47] font-black text-sm">
                  {editL + editP} / {modalItem.totalKuota} Kursi
                </span>
              </div>

              {/* Catatan Panitia */}
              <div>
                <label className="block text-xs font-bold text-[#422F21] mb-1">
                  Catatan Panitia (Opsional):
                </label>
                <input
                  type="text"
                  value={editCatatan}
                  onChange={(e) => setEditCatatan(e.target.value)}
                  placeholder="Contoh: Dikonfirmasi via telepon WhatsApp oleh wali"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#D5C4B4] text-xs text-[#422F21] focus:outline-none focus:border-[#8C6A47]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#D5C4B4]">
                <button
                  type="button"
                  onClick={() => setModalItem(null)}
                  className="px-4 py-2 rounded-xl bg-white border border-[#D5C4B4] text-xs font-bold text-[#7A624E] hover:bg-[#FAF7F3] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white text-xs font-black shadow-md transition-all cursor-pointer"
                >
                  Simpan Konfirmasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
