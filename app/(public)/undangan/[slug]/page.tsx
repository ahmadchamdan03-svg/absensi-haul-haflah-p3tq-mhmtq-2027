'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  Download,
  ExternalLink,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  Home,
  Maximize2,
  CheckCircle2,
} from 'lucide-react';
import {
  Persidangan,
  getPersidanganBySlugAndToken,
  formatTanggalIndo,
} from '@/lib/persidangan';

export default function PublicUndanganPersidanganPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const slug = (params?.slug as string) || '';
  const token = searchParams.get('token') || '';

  const [persidangan, setPersidangan] = useState<Persidangan | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!slug || !token) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getPersidanganBySlugAndToken(slug, token);
        if (!data) {
          setNotFound(true);
        } else {
          setPersidangan(data);
          setNotFound(false);
        }
      } catch (err) {
        console.error('Error loading public invitation:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [slug, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F3] flex items-center justify-center p-4">
        <div className="bg-white border-2 border-[#D5C4B4] rounded-2xl p-8 max-w-sm w-full text-center shadow-lg space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#8C6A47] border-t-transparent animate-spin mx-auto"></div>
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-base text-[#422F21]">
              Membuka Surat Undangan...
            </h3>
            <p className="text-xs text-[#735334]">
              Memvalidasi token akses resmi persidangan.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Halaman 404 jika token/slug tidak valid atau tidak ditemukan
  if (notFound || !persidangan) {
    return (
      <div className="min-h-screen bg-[#FAF7F3] flex items-center justify-center p-4">
        <div className="bg-white border-2 border-[#D5C4B4] rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold uppercase tracking-wider">
              Akses Tidak Valid
            </span>
            <h2 className="font-serif font-black text-xl text-[#422F21]">
              Undangan Tidak Ditemukan
            </h2>
            <p className="text-xs text-[#735334] leading-relaxed">
              Undangan digital persidangan tidak ditemukan atau token akses sudah tidak berlaku.
              Pastikan Anda membuka tautan resmi yang dikirimkan melalui WhatsApp panitia.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white text-xs font-bold shadow-md transition-all"
            >
              <Home className="w-4 h-4" />
              Kembali ke Beranda
            </Link>
          </div>

          <div className="text-[10px] text-[#A89887] pt-2 border-t border-[#EFE8E1]">
            Panitia Haul &amp; Haflah Akhirussanah P3TQ &amp; MHMTQ Lirboyo Kediri
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F3] text-[#422F21] py-8 sm:py-12 px-4 select-none">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        {/* ========================================================================= */}
        {/* HEADER IDENTITAS RESMI PERSIDANGAN                                        */}
        {/* ========================================================================= */}
        <div className="text-center space-y-3 sm:space-y-4 px-2 select-text">
          {/* 3 Logo Resmi Pesantren */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 mb-3">
            <img
              src="/images/logo-p3tq.png"
              alt="Logo P3TQ"
              className="h-14 sm:h-20 object-contain drop-shadow-xs"
            />
            <img
              src="/logo-haul-haflah-transparent.png"
              alt="Logo Haul & Haflah"
              className="h-16 sm:h-24 object-contain drop-shadow-xs"
            />
            <img
              src="/images/logo-mhmtq.png"
              alt="Logo MHMTQ"
              className="h-14 sm:h-20 object-contain drop-shadow-xs"
            />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#EFE8E1] border border-[#D5C4B4] text-[10px] sm:text-xs font-serif font-black tracking-[0.2em] uppercase text-[#8C6A47]">
              <Sparkles className="w-3 h-3 text-[#D49B5B]" />
              Surat Undangan Resmi Kepanitiaan
            </div>
            <h2 className="text-sm sm:text-base font-serif font-bold text-[#735334] tracking-wide">
              HAUL &amp; HAFLAH AKHIRUSSANAH 1448 H. / 2027 M.
            </h2>
            <div className="text-[11px] sm:text-xs text-[#7A624E] font-serif italic">
              Pondok Pesantren Putri Tahfizhil Qur-an (P3TQ) &amp; MHMTQ Lirboyo Kediri
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* KARTU UTAMA PERSIDANGAN                                                   */}
        {/* ========================================================================= */}
        <div className="bg-white border-2 border-[#D5C4B4] rounded-3xl p-6 sm:p-8 shadow-md space-y-6 select-text">
          {/* Judul & Status */}
          <div className="text-center space-y-2 border-b border-[#E5D7C8] pb-5">
            <span
              className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                persidangan.status === 'AKTIF'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : persidangan.status === 'SELESAI'
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}
            >
              {persidangan.status === 'AKTIF'
                ? 'Persidangan Aktif'
                : persidangan.status === 'SELESAI'
                ? 'Persidangan Selesai'
                : 'Draf Persidangan'}
            </span>

            <h1 className="font-serif font-black text-2xl sm:text-3xl text-[#422F21] leading-tight max-w-2xl mx-auto">
              {persidangan.judul}
            </h1>

            {persidangan.deskripsi && (
              <p className="text-xs sm:text-sm text-[#735334] max-w-xl mx-auto leading-relaxed">
                {persidangan.deskripsi}
              </p>
            )}
          </div>

          {/* Rincian Waktu, Tempat, dan Agenda */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#FAF7F3] border border-[#E5D7C8] space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8C6A47]">
                <Calendar className="w-4 h-4" />
                Hari &amp; Tanggal
              </div>
              <div className="font-serif font-bold text-sm text-[#422F21]">
                {formatTanggalIndo(persidangan.tanggal)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F3] border border-[#E5D7C8] space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8C6A47]">
                <Clock className="w-4 h-4" />
                Waktu Pelaksanaan
              </div>
              <div className="font-serif font-bold text-sm text-[#422F21]">
                {persidangan.waktu || 'Sesuai Jadwal'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F3] border border-[#E5D7C8] space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8C6A47]">
                <MapPin className="w-4 h-4" />
                Tempat / Lokasi
              </div>
              <div className="font-serif font-bold text-sm text-[#422F21]">
                {persidangan.tempat || 'Pondok Pesantren Lirboyo Kediri'}
              </div>
            </div>
          </div>

          {/* Agenda Sidang */}
          {persidangan.agenda && (
            <div className="p-5 rounded-2xl bg-[#FAF7F3] border border-[#E5D7C8] space-y-2">
              <h3 className="font-serif font-bold text-sm text-[#422F21] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#8C6A47]" />
                Agenda / Susunan Acara Persidangan
              </h3>
              <p className="text-xs sm:text-sm text-[#735334] whitespace-pre-line leading-relaxed">
                {persidangan.agenda}
              </p>
            </div>
          )}

          {/* ========================================================================= */}
          {/* EMBED PDF UNDANGAN RESMI                                                  */}
          {/* ========================================================================= */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5D7C8] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#8C6A47]" />
                <h3 className="font-serif font-bold text-base text-[#422F21]">
                  Dokumen Surat Undangan Resmi (PDF)
                </h3>
              </div>

              {persidangan.pdf_url && (
                <div className="flex items-center gap-2">
                  <a
                    href={persidangan.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#D5C4B4] bg-white text-xs font-bold text-[#735334] hover:bg-[#FAF7F3] transition-colors"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    Layar Penuh
                  </a>
                  <a
                    href={persidangan.pdf_url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh PDF
                  </a>
                </div>
              )}
            </div>

            {persidangan.pdf_url ? (
              <div className="border-2 border-[#D5C4B4] rounded-2xl overflow-hidden bg-white shadow-xs">
                <iframe
                  src={persidangan.pdf_url}
                  title="Surat Undangan Resmi PDF"
                  className="w-full h-[600px] sm:h-[800px] border-none"
                />
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-[#FAF7F3] border border-dashed border-[#D5C4B4] text-center space-y-2">
                <FileText className="w-8 h-8 text-[#8C6A47] mx-auto opacity-70" />
                <div className="font-serif font-bold text-sm text-[#422F21]">
                  Surat Undangan Fisik Sedang Dipersiapkan
                </div>
                <p className="text-xs text-[#735334] max-w-sm mx-auto">
                  Dokumen PDF resmi yang telah ditandatangani oleh Ketua Umum dan Sekretaris sedang dalam proses digitalisasi oleh sekretariat panitia.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-1 text-xs text-[#735334] pt-4 border-t border-[#D5C4B4]">
          <div>
            Dikirim via <strong className="text-[#8C6A47]">haflahp3tq.site</strong>
          </div>
          <div className="text-[11px] text-[#A89887]">
            Panitia Haul &amp; Haflah P3TQ &amp; MHMTQ 1448 H. / 2027 M. Pondok Pesantren Lirboyo Kediri
          </div>
        </div>
      </div>
    </div>
  );
}
