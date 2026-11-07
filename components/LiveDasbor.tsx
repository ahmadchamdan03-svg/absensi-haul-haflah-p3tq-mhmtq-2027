'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  Clock,
  Award,
  RefreshCw,
  Building,
  Compass,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { fetchDashboardMetrics } from '@/lib/dashboard-queries';
import DenahModal from '@/components/DenahModal';
import { SkeletonCard, SkeletonList } from '@/components/ui/GlassSkeleton';

interface LiveDasborProps {
  isPimpinanView?: boolean;
}

export default function LiveDasbor({ isPimpinanView = false }: LiveDasborProps) {
  const [loading, setLoading] = useState(true);
  const [keluargaList, setKeluargaList] = useState<any[]>([]);
  const [undanganList, setUndanganList] = useState<any[]>([]);
  const [supaMetrics, setSupaMetrics] = useState({
    totalSantri: 0,
    wsHadir: 0,
    wsKuota: 0,
    totalTamu: 0,
    tamuHadir: 0,
    tamuKuota: 0,
  });

  const [genderStats, setGenderStats] = useState({
    wsL: 0,
    wsP: 0,
    tamuL: 0,
    tamuP: 0,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'SEMUA' | 'SUDAH' | 'BELUM'>('SEMUA');
  const [tabCategory, setTabCategory] = useState<'SEMUA' | 'SANTRI' | 'UNDANGAN'>('SEMUA');
  const [isDenahOpen, setIsDenahOpen] = useState(false);

  const fetchLiveDasborData = async () => {
    try {
      const res = await fetchDashboardMetrics();
      setSupaMetrics({
        totalSantri: res.totalSantri,
        wsHadir: res.wsHadir,
        wsKuota: res.wsKuota,
        totalTamu: res.totalTamu,
        tamuHadir: res.tamuHadir,
        tamuKuota: res.tamuKuota,
      });

      setGenderStats({
        wsL: res.wsL,
        wsP: res.wsP,
        tamuL: res.tamuL,
        tamuP: res.tamuP,
      });

      setKeluargaList(res.santriList);
      setUndanganList(res.undanganList);
    } catch (e) {
      console.warn('Live dasbor fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveDasborData();

    // Supabase Realtime Subscription untuk update instant saat presensi di-absen (bebas polling beban)
    const channel = supabase
      .channel('live_dasbor_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'presensi_log' },
        () => {
          fetchLiveDasborData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tamu_undangan' },
        () => {
          fetchLiveDasborData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'peserta_santri' },
        () => {
          fetchLiveDasborData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pembelian_kuota' },
        () => {
          fetchLiveDasborData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Total Wali Santri metric calculation (Unified with dataset)
  const totalKuotaWaliSantri = supaMetrics.wsKuota;
  const totalHadirWaliSantri = supaMetrics.wsHadir;

  // Total Tamu Undangan metric calculation (Unified with dataset)
  const totalKuotaTamu = supaMetrics.tamuKuota;
  const totalHadirTamu = supaMetrics.tamuHadir;

  // Anomaly Validation: Hadir > Kuota
  const isWsAnomaly = totalKuotaWaliSantri > 0 && totalHadirWaliSantri > totalKuotaWaliSantri;
  const isTamuAnomaly = totalKuotaTamu > 0 && totalHadirTamu > totalKuotaTamu;
  const totalHadirCombined = totalHadirWaliSantri + totalHadirTamu;
  const totalKuotaCombined = totalKuotaWaliSantri + totalKuotaTamu;
  const isOverallAnomaly = totalKuotaCombined > 0 && totalHadirCombined > totalKuotaCombined;
  const isAnomaly = isWsAnomaly || isTamuAnomaly || isOverallAnomaly;

  // Unified participant list (Santri + Tamu)
  const allUnifiedList = useMemo(() => {
    return [...keluargaList, ...undanganList];
  }, [keluargaList, undanganList]);

  // Filtering & Sorting berdasar role
  const filteredList = useMemo(() => {
    if (isPimpinanView) {
      const q = searchQuery.toLowerCase().trim();
      if (!q) {
        const arrivedGuests = undanganList.filter((u) => u.isHadir);
        return arrivedGuests.sort((a, b) => {
          const tA = new Date(a.lastCheckinTime || 0).getTime();
          const tB = new Date(b.lastCheckinTime || 0).getTime();
          return tB - tA;
        });
      }

      const matched = allUnifiedList.filter((item) => {
        const matchKode = (item.kode || '').toLowerCase().includes(q);
        const matchNama = (item.nama || '').toLowerCase().includes(q);
        const matchWali = (item.namaWali || '').toLowerCase().includes(q);
        const matchKat = (item.kategori || '').toLowerCase().includes(q);
        const matchAlamat = (item.alamat || '').toLowerCase().includes(q);
        const matchHp = (item.noHp || '').toLowerCase().includes(q);
        return matchKode || matchNama || matchWali || matchKat || matchAlamat || matchHp;
      });

      const arrived = matched
        .filter((i) => i.isHadir)
        .sort((a, b) => new Date(b.lastCheckinTime || 0).getTime() - new Date(a.lastCheckinTime || 0).getTime());
      const notArrived = matched
        .filter((i) => !i.isHadir)
        .sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));

      return [...arrived, ...notArrived];
    }

    // MODE DASBOR PETUGAS (Regular View)
    let list = allUnifiedList;

    if (tabCategory === 'SANTRI') {
      list = list.filter((i) => i.tipe === 'SANTRI');
    } else if (tabCategory === 'UNDANGAN') {
      list = list.filter((i) => i.tipe === 'UNDANGAN');
    }

    if (statusFilter === 'SUDAH') {
      list = list.filter((i) => i.isHadir);
    } else if (statusFilter === 'BELUM') {
      list = list.filter((i) => !i.isHadir);
    }

    const q = searchQuery.toLowerCase().trim();
    if (!q) return list;

    return list.filter((item) => {
      const matchKode = (item.kode || '').toLowerCase().includes(q);
      const matchNama = (item.nama || '').toLowerCase().includes(q);
      const matchWali = (item.namaWali || '').toLowerCase().includes(q);
      const matchKat = (item.kategori || '').toLowerCase().includes(q);
      const matchAlamat = (item.alamat || '').toLowerCase().includes(q);
      const matchHp = (item.noHp || '').toLowerCase().includes(q);
      return matchKode || matchNama || matchWali || matchKat || matchAlamat || matchHp;
    });
  }, [allUnifiedList, undanganList, tabCategory, statusFilter, searchQuery, isPimpinanView]);

  return (
    <div className="space-y-6">
      {/* BANNER WARNING ANOMALI BILA HADIR > KUOTA */}
      {isAnomaly && (
        <div className="p-4 rounded-2xl bg-sky-50 border-2 border-sky-400 text-blue-950 flex items-start space-x-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1">
            <h5 className="font-serif font-black text-sm text-blue-950">
              Pemberitahuan Selisih Kuota Kehadiran
            </h5>
            <p className="text-xs text-blue-900 leading-relaxed">
              Total Hadir ({totalHadirCombined} orang) melebihi Total Kuota ({totalKuotaCombined} kursi). Silakan cek &amp; lakukan koreksi data via Meja Rekonsiliasi.
            </p>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-xl sm:text-2xl lg:text-3xl font-serif font-black tracking-tight text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.85)] drop-shadow-2xl"
            style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.85), 0 4px 18px rgba(0, 0, 0, 0.7)' }}
          >
            Laporan Kehadiran Peserta Haul &amp; Haflah 1448 H.
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsDenahOpen(true)}
            className="p-2.5 rounded-xl bg-white/50 hover:bg-white/75 backdrop-blur-md text-[#1E3A8A] border border-white/60 shadow-xs flex items-center space-x-1.5 text-xs font-bold cursor-pointer btn-transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
            aria-label="Buka denah lapangan"
          >
            <Compass className="w-4 h-4 text-[#1D4ED8]" />
            <span>Denah Lapangan</span>
          </button>
          <button
            type="button"
            onClick={fetchLiveDasborData}
            className="p-2.5 rounded-xl bg-white/50 hover:bg-white/75 backdrop-blur-md text-[#1D4ED8] border border-white/60 shadow-xs flex items-center space-x-1.5 text-xs font-bold cursor-pointer btn-transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
            aria-label="Perbarui data kehadiran"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* 2 KARTU METRIK UTAMA (GLASSMORPHISM) */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-300">
          {/* KARTU 1: TOTAL WALI SANTRI */}
          <div
            onClick={() => {
              setTabCategory('SANTRI');
              setStatusFilter('SUDAH');
            }}
            className="p-6 rounded-3xl bg-white/85 backdrop-blur-md border border-white/80 shadow-[0_8px_32px_0_rgba(140,106,71,0.08)] hover:shadow-[0_12px_36px_0_rgba(140,106,71,0.14)] space-y-3 card-transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wide flex items-center gap-1.5">
                <Users className="w-4.5 h-4.5 text-[#1D4ED8]" />
                TOTAL WALI SANTRI
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border badge-transition ${isWsAnomaly ? 'bg-red-50 text-red-700 border-red-300' : 'bg-sky-50 text-blue-900 border-sky-200'}`}>
                {totalKuotaWaliSantri > 0 ? `${Math.min(100, Math.round((totalHadirWaliSantri / totalKuotaWaliSantri) * 100))}% Hadir` : '—'} {isWsAnomaly && '⚠️ (Over)'}
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-serif font-black text-[#0F2C59]">
              {totalHadirWaliSantri} <span className="text-xl font-sans font-normal text-stone-400">/ {totalKuotaWaliSantri > 0 ? totalKuotaWaliSantri : '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-600 font-medium pt-0.5">
              <span>Laki-laki: <strong className="font-bold text-stone-800">{genderStats.wsL}</strong></span>
              <span className="text-stone-300">·</span>
              <span>Perempuan: <strong className="font-bold text-stone-800">{genderStats.wsP}</strong></span>
            </div>
            <p className="text-xs text-stone-500">
              Total wali santri hadir / total kuota wali santri keseluruhan
            </p>
          </div>

          {/* KARTU 2: TOTAL TAMU UNDANGAN */}
          <div
            onClick={() => {
              setTabCategory('UNDANGAN');
              setStatusFilter('SUDAH');
            }}
            className="p-6 rounded-3xl bg-white/85 backdrop-blur-md border border-white/80 shadow-[0_8px_32px_0_rgba(140,106,71,0.08)] hover:shadow-[0_12px_36px_0_rgba(140,106,71,0.14)] space-y-3 card-transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wide flex items-center gap-1.5">
                <Award className="w-4.5 h-4.5 text-blue-700" />
                TOTAL TAMU UNDANGAN
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border badge-transition ${isTamuAnomaly ? 'bg-red-50 text-red-700 border-red-300' : 'bg-blue-50 text-blue-800 border-blue-200'}`}>
                {totalKuotaTamu > 0 ? `${Math.min(100, Math.round((totalHadirTamu / totalKuotaTamu) * 100))}% Hadir` : '—'} {isTamuAnomaly && '⚠️ (Over)'}
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-serif font-black text-[#0F2C59]">
              {totalHadirTamu} <span className="text-xl font-sans font-normal text-stone-400">/ {totalKuotaTamu}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-600 font-medium pt-0.5">
              <span>Laki-laki: <strong className="font-bold text-stone-800">{genderStats.tamuL}</strong></span>
              <span className="text-stone-300">·</span>
              <span>Perempuan: <strong className="font-bold text-stone-800">{genderStats.tamuP}</strong></span>
            </div>
            <p className="text-xs text-stone-500">
              Total tamu undangan hadir / total tamu undangan keseluruhan
            </p>
          </div>
        </div>
      )}

      {/* FILTER & PENCARIAN REAL-TIME */}
      <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 sm:p-7 border border-white/80 shadow-[0_8px_32px_0_rgba(140,106,71,0.08)] space-y-4">
        {/* SECTION HEADER & TABS HANYA MUNCUL DI AKUN PETUGAS (TIDAK DI PIMPINAN) */}
        {!isPimpinanView && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <h3 className="font-serif font-black text-base sm:text-lg text-[#0F2C59]">
                Pencarian &amp; Filter Kehadiran
              </h3>
              <p className="text-xs text-[#7A624E]">
                Cari berdasarkan nama santri, nama wali, instansi, atau kode undangan
              </p>
            </div>

            {/* TAB FILTER KATEGORI */}
            <div className="flex bg-white/40 backdrop-blur-xs p-1 rounded-2xl border border-white/60 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTabCategory('SEMUA')}
                className={`px-3 py-1.5 rounded-xl btn-transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                  tabCategory === 'SEMUA' ? 'bg-blue-800 text-white shadow-xs' : 'text-[#0F2C59]'
                }`}
              >
                Semua ({allUnifiedList.length})
              </button>
              <button
                type="button"
                onClick={() => setTabCategory('SANTRI')}
                className={`px-3 py-1.5 rounded-xl btn-transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                  tabCategory === 'SANTRI' ? 'bg-blue-800 text-white shadow-xs' : 'text-[#0F2C59]'
                }`}
              >
                Wali Santri ({keluargaList.length})
              </button>
              <button
                type="button"
                onClick={() => setTabCategory('UNDANGAN')}
                className={`px-3 py-1.5 rounded-xl btn-transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                  tabCategory === 'UNDANGAN' ? 'bg-blue-800 text-white shadow-xs' : 'text-[#0F2C59]'
                }`}
              >
                Tamu ({undanganList.length})
              </button>
            </div>
          </div>
        )}

        {/* INPUT PENCARIAN REAL-TIME & TOMBOL STATUS */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4.5 h-4.5 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama santri, wali, instansi, atau kode (contoh: SH0001, KH. Anwar)..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-white/60 bg-white/50 backdrop-blur-xs text-xs sm:text-sm focus:outline-none input-transition shadow-xs focus-visible:ring-2 focus-visible:ring-blue-600"
            />
          </div>

          {/* TOMBOL FILTER CEPAT STATUS KEHADIRAN (HANYA MUNCUL DI PETUGAS) */}
          {!isPimpinanView && (
            <div className="flex items-center space-x-1.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setStatusFilter('SEMUA')}
                className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold border btn-transition focus-visible:ring-2 focus-visible:ring-stone-600 focus-visible:outline-none ${
                  statusFilter === 'SEMUA'
                    ? 'bg-stone-800 text-white border-stone-800 shadow-xs'
                    : 'bg-white/60 backdrop-blur-xs text-stone-700 border-stone-300/80 hover:bg-white/80'
                }`}
              >
                Semua Status
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('SUDAH')}
                className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold border btn-transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                  statusFilter === 'SUDAH'
                    ? 'bg-blue-800 text-white border-blue-800 shadow-xs'
                    : 'bg-white/60 backdrop-blur-xs text-blue-800 border-blue-300/80 hover:bg-white/80'
                }`}
              >
                Sudah Hadir
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('BELUM')}
                className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold border btn-transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                  statusFilter === 'BELUM'
                    ? 'bg-blue-800 text-white border-blue-800 shadow-xs'
                    : 'bg-white/60 backdrop-blur-xs text-blue-900 border-sky-300/80 hover:bg-white/80'
                }`}
              >
                Belum Hadir
              </button>
            </div>
          )}
        </div>

        {/* TABEL / GRID DAFTAR PESERTA & TAMU */}
        {loading ? (
          <SkeletonList rows={4} className="pt-1" />
        ) : filteredList.length === 0 ? (
          <div className="p-8 text-center text-xs bg-stone-50 rounded-2xl border border-dashed border-stone-200 space-y-1">
            <p className="font-bold text-sm text-[#0F2C59]">
              {isPimpinanView && !searchQuery
                ? 'Belum ada tamu undangan yang hadir.'
                : 'Belum ada data peserta / tamu'}
            </p>
            <p className="text-stone-500">
              {searchQuery
                ? `Tidak ditemukan data yang cocok dengan kata kunci "${searchQuery}".`
                : isPimpinanView
                ? 'Data kehadiran tamu undangan yang baru di-absen akan muncul di sini secara otomatis.'
                : 'Silakan panitia menambahkan data peserta atau tamu melalui menu Manajemen Peserta atau Penerima Tamu.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {filteredList.map((item) => (
              <div
                key={item.id || item.kode}
                className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between transition-all animate-in fade-in slide-in-from-top-2 duration-300 gap-2.5 ${
                  item.isHadir
                    ? 'bg-blue-50/70 border-blue-300'
                    : 'bg-white/60 backdrop-blur-xs border-white/80 hover:border-blue-500 shadow-xs'
                }`}
              >
                {/* Baris 1 (Atas): [Kode Peserta] dan [Kategori] di kiri, [Badge Status] di kanan */}
                <div className="flex flex-wrap sm:flex-nowrap justify-between items-center w-full gap-2">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                      {item.kode}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-normal break-words ${
                        item.tipe === 'UNDANGAN'
                          ? 'bg-purple-100 text-purple-900 border border-purple-200'
                          : 'bg-blue-100 text-blue-900 border border-blue-200'
                      }`}
                    >
                      {item.tipe === 'UNDANGAN'
                        ? (item.subKategori ? `Tamu Undangan • ${item.subKategori}` : 'Tamu Undangan')
                        : 'Wali Santri'}
                    </span>
                    {item.tipe === 'UNDANGAN' && item.warnaTiket && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          String(item.warnaTiket).toLowerCase() === 'cream'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-sky-100 text-sky-900 border-sky-300'
                        }`}
                      >
                        Tiket: {item.warnaTiket}
                      </span>
                    )}
                  </div>

                  {/* Badge Status Kehadiran */}
                  <div className="shrink-0 self-start sm:self-center text-right">
                    {(() => {
                      const totalK = item.kuotaTotal !== undefined ? item.kuotaTotal : (Number(item.kuotaDasar || 0) + Number(item.kuotaTambahan || 0));
                      return (
                        <div className="flex flex-col items-end gap-0.5">
                          {item.isHadir ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-200 text-blue-950 font-black text-[11px] whitespace-nowrap shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                              <span>HADIR ({item.terpakai}/{totalK} Kursi)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-200 text-stone-700 font-semibold text-[11px] whitespace-nowrap shadow-2xs">
                              <Clock className="w-3.5 h-3.5 text-stone-500" />
                              <span>BELUM HADIR (0/{totalK} Kursi)</span>
                            </span>
                          )}
                          {item.isHadir && item.lastCheckinTime && (
                            <span className="text-[10px] text-stone-500 font-mono">
                              {new Date(item.lastCheckinTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Baris 2 (Tengah): [Nama Lengkap Siswi / Tamu] - w-full mt-2 text-lg font-bold tanpa truncate */}
                <div className="w-full mt-0.5">
                  <h4 className="font-serif font-black text-base sm:text-lg text-[#0F2C59] whitespace-normal break-words leading-snug">
                    {item.nama}
                  </h4>
                </div>

                {/* Baris 3 (Bawah): [Info Wali: Nama Wali / Lembaga] - Disembunyikan untuk Tamu Undangan, tetap tampil untuk Santri */}
                {item.subInfo && item.tipe !== 'UNDANGAN' && !item.kode?.startsWith('UND') && (
                  <div className="w-full text-xs sm:text-sm text-stone-600 whitespace-normal break-words flex items-start gap-1.5 pt-0.5">
                    <Building className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                    <span className="leading-tight">{item.subInfo}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DENAH MODAL */}
      {isDenahOpen && (
        <DenahModal isOpen={isDenahOpen} onClose={() => setIsDenahOpen(false)} />
      )}
    </div>
  );
}
