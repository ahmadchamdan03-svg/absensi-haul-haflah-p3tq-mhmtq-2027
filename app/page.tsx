'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  QrCode,
  RotateCcw,
  LayoutDashboard,
  Send,
  ShieldCheck,
  FileSpreadsheet,
  ExternalLink,
  Users,
  CheckCircle2,
  RefreshCw,
  Award,
  BookOpen,
  MapPin,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { store } from '@/lib/mock-data';
import {
  TraditionalCorner,
  TraditionalHeaderBanner,
  TraditionalLatticeRoundel,
  BegoniaCartouche,
  StageLantern,
  StagePillarAccent,
} from '@/components/Ornaments';

export default function HomePage() {
  const [stats, setStats] = useState(() => store.getStatistikLive());
  const [pagu, setPagu] = useState(() => store.getPaguInfo());
  const [keluargaList, setKeluargaList] = useState<any[]>(() => store.getKeluargaList());
  const [undanganList, setUndanganList] = useState<any[]>(() => store.getUndanganList());

  useEffect(() => {
    const refresh = () => {
      setStats(store.getStatistikLive());
      setPagu(store.getPaguInfo());
      setKeluargaList([...store.getKeluargaList()]);
      setUndanganList([...store.getUndanganList()]);
    };
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, []);

  const komposisi = useMemo(() => {
    let bilGhoib = 0;
    let tsn2 = 0;
    let tsn3 = 0;
    let aly1 = 0;
    let aly2 = 0;
    let aly3 = 0;
    let tamatan = 0;

    keluargaList.forEach((k) => {
      const s = k.santri?.[0];
      const kat = s?.kategoriUtama;
      const txt = `${s?.kelas || ''} ${s?.subKategori || ''}`.toLowerCase();

      if (kat === 'BIL_GHOIB') {
        bilGhoib++;
      } else if (kat === 'TAMATAN') {
        tamatan++;
      } else if (kat === 'BIN_NADZOR') {
        if (txt.includes('2 tsanawiyah') || txt.includes('2 tsanawiyyah') || txt.includes('2 tsn')) {
          tsn2++;
        } else if (txt.includes('3 tsanawiyah') || txt.includes('3 tsanawiyyah') || txt.includes('3 tsn')) {
          tsn3++;
        } else if (txt.includes('1 aliyah') || txt.includes('1 aly')) {
          aly1++;
        } else if (txt.includes('2 aliyah') || txt.includes('2 aly')) {
          aly2++;
        } else if (txt.includes('3 aliyah') || txt.includes('mutakhorijat') || txt.includes('3 aly')) {
          aly3++;
        } else {
          aly1++;
        }
      }
    });

    const binNadzorTotal = tsn2 + tsn3 + aly1 + aly2 + aly3;

    return {
      totalSantri: keluargaList.length,
      bilGhoib,
      binNadzorTotal,
      tsn2,
      tsn3,
      aly1,
      aly2,
      aly3,
      tamatan,
    };
  }, [keluargaList]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner Hero: Warm Latte & Cinnamon Mocha Coffee Aesthetic dengan Ornamen Tradisional */}
      {/* Warna Dasar: Warm Oat Cream #EFE8E1 · Aksen: Cinnamon Mocha #8C6A47 · Ambience: Golden Caramel Crema #D49B5B */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#FAF7F3] via-[#EFE8E1] to-[#E5DCD2] p-6 sm:p-10 text-[#422F21] shadow-xl border-2 border-[#8C6A47]/40">
        {/* 4 Sudut Ornamen Tradisional Fretwork (sesuai referensi) */}
        <div className="absolute top-3 left-3 z-10 opacity-70">
          <TraditionalCorner position="top-left" className="w-10 h-10" />
        </div>
        <div className="absolute top-3 right-3 z-10 opacity-70">
          <TraditionalCorner position="top-right" className="w-10 h-10" />
        </div>
        <div className="absolute bottom-3 left-3 z-10 opacity-70">
          <TraditionalCorner position="bottom-left" className="w-10 h-10" />
        </div>
        <div className="absolute bottom-3 right-3 z-10 opacity-70">
          <TraditionalCorner position="bottom-right" className="w-10 h-10" />
        </div>

        {/* 2 Logo Utama Pondok (P3TQ) & Madrasah (MHMTQ) Besar Bersandingan di Tengah */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="flex items-center justify-center gap-8 sm:gap-16 mb-4">
            {/* Logo Pondok Pesantren Putri Tahfizhil Qur'an (P3TQ) */}
            <div className="flex flex-col items-center group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full p-2.5 bg-[#FAF7F3] border-2 border-[#8C6A47] shadow-lg shadow-[#8C6A47]/15 ring-4 ring-[#FAF7F3] flex items-center justify-center group-hover:scale-105 transition-all duration-300">
                <img
                  src="/images/logo-p3tq.png"
                  alt="Logo P3TQ"
                  className="w-full h-full object-contain filter drop-shadow-sm"
                />
              </div>
              <span className="mt-2.5 text-base sm:text-lg font-serif font-black tracking-widest text-[#422F21]">
                P3TQ
              </span>
            </div>

            {/* Logo Madrasah Hidayatul Mubtadi-aat Fittahfizhi wal Qiro-at (MHMTQ) */}
            <div className="flex flex-col items-center group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full p-2.5 bg-[#FAF7F3] border-2 border-[#8C6A47] shadow-lg shadow-[#8C6A47]/15 ring-4 ring-[#FAF7F3] flex items-center justify-center group-hover:scale-105 transition-all duration-300">
                <img
                  src="/images/logo-mhmtq.png"
                  alt="Logo MHMTQ"
                  className="w-full h-full object-contain filter drop-shadow-sm"
                />
              </div>
              <span className="mt-2.5 text-base sm:text-lg font-serif font-black tracking-widest text-[#422F21]">
                MHMTQ
              </span>
            </div>
          </div>

          {/* Header Banner Ornamen Tradisional di Bagian Atas */}
          <TraditionalHeaderBanner title="HAUL & HAFLAH 1448 H / 2027 M" />
        </div>

        {/* Ornamen Watermark Kaligrafi */}
        <div className="absolute -right-10 -bottom-10 w-96 h-96 opacity-5 pointer-events-none">
          <img
            src="/images/logo-haul-black.png"
            alt="Watermark Kaligrafi"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-3xl">
            {/* Kaligrafi Emas Haul Haflah & Logo Kuda Api Islami Terbaru (Hanya Logo Saja) */}
            <div className="pt-1 flex flex-wrap items-center gap-4 sm:gap-6">
              <img
                src="/images/logo-haul-gold.png"
                alt="Kaligrafi Haul & Haflah"
                className="h-14 sm:h-20 object-contain drop-shadow-[0_4px_8px_rgba(212,155,91,0.55)]"
              />

              {/* Tombol Rahasia: Logo Kuda Api / Buroq Menuju Game "Mi'raj Journey: Penunggang Buroq" */}
              <Link
                href="/miraj-journey"
                className="group relative inline-block cursor-pointer focus:outline-none"
                title="Rahasia Safar: Klik untuk Menunggangi Buroq!"
              >
                {/* Efek Pendar Api Emas saat Hover */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-300 animate-pulse" />
                <img
                  src="/images/logo-kuda-api.png"
                  alt="Logo Tema Kuda Api Haul Haflah (Tombol Rahasia Game)"
                  className="relative z-10 h-14 sm:h-20 w-auto object-contain drop-shadow-[0_4px_8px_rgba(212,155,91,0.35)] group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 active:scale-95"
                />
                {/* Tooltip Rahasia Melayang Halus */}
                <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-900/90 text-amber-200 border border-amber-400/60 text-[10px] font-bold tracking-wide opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-lg pointer-events-none z-20 flex items-center space-x-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-300 animate-spin" />
                  <span>Safar Buroq 🎮</span>
                </span>
              </Link>

              <StageLantern className="w-6 h-10 hidden sm:block text-[#D49B5B]" />
            </div>

            <h1 className="text-2xl sm:text-4xl font-serif font-black tracking-wide text-[#422F21] leading-tight">
              Sistem Absensi & Manajemen Kuota Haul–Haflah
            </h1>

            {/* Deskripsi Lembaga, Alamat Resmi di Bawahnya, dan Kalimat Penyesuaian */}
            <div className="text-xs sm:text-sm text-[#7A624E] font-normal leading-relaxed space-y-1.5">
              <p className="text-[#422F21] font-medium">
                Pondok Pesantren Putri Tahfizhil Qur-an (P3TQ) & Madrasah Hidayatul Mubtadi-aat Fittahfizhi wal Qiro-at (MHMTQ) Lirboyo Kediri.
              </p>
              <p className="flex items-center space-x-1.5 text-xs text-[#8C6A47] font-medium">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>Jl. HM. Winarto, Campurejo, Kec. Mojoroto, Kota Kediri, Jawa Timur 64117</span>
              </p>
              <p>
                Sistem database resmi Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M. memuat data santri riil ({komposisi.bilGhoib} Bil Ghoib, {komposisi.binNadzorTotal} Takhtiman Bin Nadzori & {komposisi.tamatan} Wisudawati Tamatan) serta seluruh Tamu Undangan Kehormatan, Istimewa & Umum.
              </p>
            </div>
          </div>

          {/* Tombol Aksi Cepat Panggung: Cinnamon Mocha Pill CTA */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <Link
              href="/scan"
              className="inline-flex items-center justify-center space-x-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#8C6A47] via-[#A47E57] to-[#8C6A47] hover:brightness-105 text-white font-black text-sm shadow-lg shadow-[#8C6A47]/30 transition-transform active:scale-95 border-2 border-white"
            >
              <QrCode className="w-5 h-5 text-white" />
              <span>Buka Scanner Gerbang</span>
            </Link>
            <Link
              href="/admin/dasbor"
              className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-[#FAF7F3] hover:bg-[#EFE8E1] text-[#422F21] font-bold text-xs border-2 border-[#8C6A47] shadow-sm transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-[#8C6A47]" />
              <span>Pantau Live Realtime</span>
            </Link>
          </div>
        </div>

        {/* 4 Kartu Metrik di atas Warm Oat Cream - Interaktif & Bisa Diklik */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t-2 border-[#8C6A47]/25">
          <Link
            href="/admin/peserta?tab=SEMUA"
            className="group bg-[#FAF7F3] hover:bg-[#F5EFE6] rounded-2xl p-4 border-2 border-[#D5C4B4] hover:border-[#8C6A47] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between cursor-pointer"
            title={`Buka Database ${komposisi.totalSantri} Santri Terdaftar`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-serif font-bold text-[#8C6A47]">Total Santri Terdaftar</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8C6A47] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="text-2xl font-black text-[#422F21] mt-1">
                {komposisi.totalSantri} <span className="text-xs font-normal text-[#7A624E]">Santri</span>
              </div>
            </div>
            <div className="text-[11px] text-[#8C6A47] mt-1 font-medium">{komposisi.bilGhoib} Bil Ghoib · {komposisi.binNadzorTotal} Bin Nadzori · {komposisi.tamatan} Tamatan</div>
          </Link>

          <Link
            href="/admin/dasbor"
            className="group bg-[#FAF7F3] hover:bg-[#F5EFE6] rounded-2xl p-4 border-2 border-[#D5C4B4] hover:border-[#8C6A47] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between cursor-pointer"
            title="Pantau Monitoring Pagu & Okupansi Kuota Kursi Aula"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-serif font-bold text-[#8C6A47]">Total Pagu Kuota Kursi</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8C6A47] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="text-2xl font-black text-[#422F21] mt-1">
                {stats.totalKuota} <span className="text-xs font-normal text-[#7A624E]">Kursi</span>
              </div>
            </div>
            <div className="text-[11px] text-emerald-800 mt-1 font-medium">{komposisi.totalSantri * 2} Santri (Dasar) + 300 Tambahan</div>
          </Link>

          <Link
            href="/admin/dasbor?status=SUDAH"
            className="group bg-[#FAF7F3] hover:bg-[#F5EFE6] rounded-2xl p-4 border-2 border-[#D5C4B4] hover:border-[#8C6A47] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between cursor-pointer"
            title="Lihat Daftar Hadir Realtime di Live Dasbor"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-serif font-bold text-[#8C6A47]">Kehadiran Live Saat Ini</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#D49B5B] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="text-2xl font-black text-[#D49B5B] mt-1">
                {stats.totalHadir} <span className="text-xs font-normal text-[#7A624E]">Hadir</span>
              </div>
            </div>
            <div className="text-[11px] text-[#7A624E] mt-1 font-medium">
              {stats.totalLaki} Laki-laki : {stats.totalPerempuan} Perempuan
            </div>
          </Link>

          <Link
            href="/admin/verifikasi"
            className="group bg-[#FAF7F3] hover:bg-[#F5EFE6] rounded-2xl p-4 border-2 border-[#D5C4B4] hover:border-[#8C6A47] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between cursor-pointer"
            title="Kelola & Verifikasi Kuota Tambahan Berbayar"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-serif font-bold text-[#8C6A47]">Pagu Kuota Tambahan (300)</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8C6A47] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="text-2xl font-black text-[#422F21] mt-1">
                {pagu.terjual} <span className="text-xs font-normal text-[#7A624E]">/ {pagu.paguTotal}</span>
              </div>
            </div>
            <div className="text-[11px] text-[#8C6A47] mt-1 font-medium">Sisa {pagu.sisa} unit (Rp 80.000)</div>
          </Link>
        </div>
      </div>

      {/* Grid Menu Fitur Utama */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-serif font-black text-[#422F21] flex items-center space-x-2">
            <Users className="w-5 h-5 text-[#8C6A47]" />
            <span>Pusat Kendali & Modul Operasional</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Box 1: PWA Scanner Gerbang */}
          <div className="bg-[#FAF7F3] rounded-3xl p-6 shadow-sm border-2 border-[#D5C4B4] flex flex-col justify-between hover:border-[#8C6A47] transition-colors">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EFE8E1] text-[#8C6A47] flex items-center justify-center font-bold border border-[#D5C4B4]">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-[#422F21] text-base">
                Gerbang Masuk (PWA Operator)
              </h3>
              <p className="text-xs text-[#7A624E] leading-relaxed font-normal">
                Pemindaian kamera & barcode USB di Gerbang Selatan Bola Dunia (Jalur Barat Putra & Jalur Timur Putri). Validasi kuota atomik dan penyerahan tiket fisik berwarna (Biru / Kuning / Hijau).
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#D5C4B4]/50 flex gap-2">
              <Link
                href="/scan"
                className="flex-1 py-2.5 text-center rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white text-xs font-bold shadow border border-[#735334]"
              >
                Layar Scanner
              </Link>
              <Link
                href="/rekon"
                className="px-4 py-2.5 text-center rounded-xl bg-[#EFE8E1] hover:bg-[#E5DCD2] text-[#422F21] text-xs font-semibold border border-[#D5C4B4]"
              >
                Rekonsiliasi
              </Link>
            </div>
          </div>

          {/* Box 2: Portal Wali Santri */}
          <div className="bg-[#FAF7F3] rounded-3xl p-6 shadow-sm border-2 border-[#D5C4B4] flex flex-col justify-between hover:border-[#D49B5B] transition-colors">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FCF3E4] text-[#D49B5B] flex items-center justify-center font-bold border border-[#D49B5B]/50">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-[#422F21] text-base">
                Portal Undangan Resmi Wali Santri
              </h3>
              <p className="text-xs text-[#7A624E] leading-relaxed font-normal">
                Akses publik tanpa login via token URL: Undangan digital resmi, form konfirmasi estimasi kehadiran L & P, QR statis resolusi tinggi, dan pembelian kuota tambahan.
              </p>
            </div>
          </div>

          {/* Box 3: Panel Panitia Inti */}
          <div className="bg-[#FAF7F3] rounded-3xl p-6 shadow-sm border-2 border-[#D5C4B4] flex flex-col justify-between hover:border-[#8C6A47] transition-colors">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#8C6A47] text-[#FAF7F3] flex items-center justify-center font-bold border border-[#735334]">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-[#422F21] text-base">
                Panel Administrasi & Laporan
              </h3>
              <p className="text-xs text-[#7A624E] leading-relaxed font-normal">
                Monitoring live realtime, pengiriman pesan WhatsApp 2 gelombang untuk seluruh wali santri, verifikasi mutasi rekening BRI, serta rekapitulasi 3 blok siap cetak / ekspor ke Excel.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#D5C4B4]/50 grid grid-cols-2 gap-2">
              <Link
                href="/admin/dasbor"
                className="py-2 text-center rounded-xl bg-[#EFE8E1] hover:bg-[#E5DCD2] text-[#422F21] text-xs font-semibold border border-[#D5C4B4]"
              >
                Live Dasbor
              </Link>
              <Link
                href="/admin/whatsapp"
                className="py-2 text-center rounded-xl bg-[#EFE8E1] hover:bg-[#E5DCD2] text-[#422F21] text-xs font-semibold border border-[#D5C4B4]"
              >
                Kirim WhatsApp
              </Link>
              <Link
                href="/admin/verifikasi"
                className="py-2 text-center rounded-xl bg-[#EFE8E1] hover:bg-[#E5DCD2] text-[#422F21] text-xs font-semibold border border-[#D5C4B4]"
              >
                Verifikasi Kuota
              </Link>
              <Link
                href="/admin/laporan"
                className="py-2 text-center rounded-xl bg-[#EFE8E1] hover:bg-[#E5DCD2] text-[#422F21] text-xs font-semibold border border-[#D5C4B4]"
              >
                Rekap & Ekspor
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Rincian Komposisi Santri Riil Terdaftar */}
      <div className="bg-[#FAF7F3] rounded-3xl p-6 shadow-sm border-2 border-[#D5C4B4] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="font-serif font-black text-[#422F21] text-sm sm:text-base flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8C6A47]"></span>
            <span>Komposisi Data Santri Riil ({komposisi.totalSantri} Santri Terdaftar)</span>
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[#7A624E] hidden md:inline">
              Klik kartu untuk memfilter santri di Database Peserta
            </span>
            <Link
              href="/admin/dasbor"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8C6A47] hover:text-[#422F21] transition-colors"
            >
              <span>Lihat Dasbor Live</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
          <Link
            href="/admin/peserta?tab=BIL_GHOIB"
            className="group p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-300 hover:border-emerald-500 hover:bg-emerald-100/70 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950">Bil Ghoib</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-600 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="text-lg font-black text-emerald-900 mt-1">{komposisi.bilGhoib} Santri</div>
            </div>
            <span className="text-[10px] text-emerald-700 font-medium mt-1">{komposisi.bilGhoib * 2} Tiket + {komposisi.bilGhoib} Panggung</span>
          </Link>

          <Link
            href="/admin/peserta?tab=BIN_NADZOR&q=2 Tsanawiyah"
            className="group p-3.5 rounded-2xl bg-[#EFE8E1] border border-[#D5C4B4] hover:border-[#8C6A47] hover:bg-[#E5DCD2] hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#422F21]">2 Tsanawiyyah</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8C6A47] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="text-lg font-black text-[#8C6A47] mt-1">{komposisi.tsn2} Santri</div>
            </div>
            <span className="text-[10px] text-[#7A624E] font-medium mt-1">{komposisi.tsn2 * 2} Tiket Biru</span>
          </Link>

          <Link
            href="/admin/peserta?tab=BIN_NADZOR&q=3 Tsanawiyah"
            className="group p-3.5 rounded-2xl bg-[#EFE8E1] border border-[#D5C4B4] hover:border-[#8C6A47] hover:bg-[#E5DCD2] hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#422F21]">3 Tsanawiyyah</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8C6A47] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="text-lg font-black text-[#8C6A47] mt-1">{komposisi.tsn3} Santri</div>
            </div>
            <span className="text-[10px] text-[#7A624E] font-medium mt-1">{komposisi.tsn3 * 2} Tiket Biru</span>
          </Link>

          <Link
            href="/admin/peserta?tab=BIN_NADZOR&q=1 Aliyah"
            className="group p-3.5 rounded-2xl bg-[#EFE8E1] border border-[#D5C4B4] hover:border-[#8C6A47] hover:bg-[#E5DCD2] hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#422F21]">1 Aliyah</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8C6A47] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="text-lg font-black text-[#8C6A47] mt-1">{komposisi.aly1} Santri</div>
            </div>
            <span className="text-[10px] text-[#7A624E] font-medium mt-1">{komposisi.aly1 * 2} Tiket Biru</span>
          </Link>

          <Link
            href="/admin/peserta?tab=BIN_NADZOR&q=2 Aliyah"
            className="group p-3.5 rounded-2xl bg-[#EFE8E1] border border-[#D5C4B4] hover:border-[#8C6A47] hover:bg-[#E5DCD2] hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#422F21]">2 Aliyah</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8C6A47] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="text-lg font-black text-[#8C6A47] mt-1">{komposisi.aly2} Santri</div>
            </div>
            <span className="text-[10px] text-[#7A624E] font-medium mt-1">{komposisi.aly2 * 2} Tiket Biru</span>
          </Link>

          <Link
            href="/admin/peserta?tab=BIN_NADZOR&q=3 Aliyah"
            className="group p-3.5 rounded-2xl bg-[#EFE8E1] border border-[#D5C4B4] hover:border-[#8C6A47] hover:bg-[#E5DCD2] hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#422F21]">3 Aliyah & Mutakhorijat</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8C6A47] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="text-lg font-black text-[#8C6A47] mt-1">{komposisi.aly3} Santri</div>
            </div>
            <span className="text-[10px] text-[#7A624E] font-medium mt-1">{komposisi.aly3 * 2} Tiket Biru</span>
          </Link>

          <Link
            href="/admin/peserta?tab=TAMATAN"
            className="group p-3.5 rounded-2xl bg-[#FCF3E4] border border-[#D49B5B]/60 hover:border-[#D49B5B] hover:bg-[#F8E7CD] hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#543C28]">Tamatan (7 Bagian)</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#D49B5B] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="text-lg font-black text-[#D49B5B] mt-1">{komposisi.tamatan} Santri</div>
            </div>
            <span className="text-[10px] text-[#8C6A47] font-medium mt-1">{komposisi.tamatan * 2} Tiket Kuning</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
