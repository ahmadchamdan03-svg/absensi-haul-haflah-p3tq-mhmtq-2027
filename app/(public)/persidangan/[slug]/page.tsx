'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import {
  Download,
  ExternalLink,
  ArrowLeft,
  AlertTriangle,
  FileText,
  Home,
  RefreshCw,
} from 'lucide-react';
import { Persidangan, getPersidanganBySlug } from '@/lib/persidangan';

function PublicPersidanganContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = (params?.slug as string) || '';
  const toCode = searchParams.get('to')?.trim() || '';

  const [persidangan, setPersidangan] = useState<Persidangan | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function loadPersidangan() {
      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getPersidanganBySlug(slug);
        if (!data) {
          setNotFound(true);
        } else {
          setPersidangan(data);
          setNotFound(false);
        }
      } catch (err) {
        console.error('Error fetching persidangan by slug:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadPersidangan();
  }, [slug]);

  const handleDownload = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!persidangan?.pdf_url) return;
    try {
      setDownloading(true);
      const res = await fetch(persidangan.pdf_url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const safeFilename = `${persidangan.slug || 'undangan-persidangan'}.pdf`;
      a.download = safeFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: buka file langsung di tab baru
      window.open(persidangan.pdf_url, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F3] flex items-center justify-center p-4">
        <div className="bg-white border-2 border-[#D5C4B4] rounded-2xl p-8 max-w-sm w-full text-center shadow-lg space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#8C6A47] border-t-transparent animate-spin mx-auto"></div>
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-base text-[#422F21]">
              Membuka Undangan Persidangan...
            </h3>
            <p className="text-xs text-[#735334]">
              Memuat berkas resmi kepanitiaan.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Halaman 404 jika slug tidak ditemukan
  if (notFound || !persidangan) {
    return (
      <div className="min-h-screen bg-[#FAF7F3] flex items-center justify-center p-4">
        <div className="bg-white border-2 border-[#D5C4B4] rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold uppercase tracking-wider">
              Undangan Tidak Ditemukan
            </span>
            <h2 className="font-serif font-black text-xl text-[#422F21]">
              Persidangan Tidak Ditemukan
            </h2>
            <p className="text-xs text-[#735334] leading-relaxed">
              Undangan persidangan tidak ditemukan atau sudah tidak berlaku.
              Pastikan Anda membuka tautan resmi yang dibagikan oleh panitia.
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
            Panitia Haul &amp; Haflah P3TQ - MHMTQ 1448 H. / 2027 M.
          </div>
        </div>
      </div>
    );
  }

  // Jika persidangan ditemukan tapi belum ada PDF diunggah
  if (!persidangan.pdf_url) {
    return (
      <div className="min-h-screen bg-[#FAF7F3] flex items-center justify-center p-4">
        <div className="bg-white border-2 border-[#D5C4B4] rounded-3xl p-8 max-w-lg w-full text-center shadow-xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-[#FAF7F3] border border-[#D5C4B4] text-[#8C6A47] flex items-center justify-center mx-auto shadow-xs">
            <FileText className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
              Dokumen Dalam Proses
            </span>
            <h2 className="font-serif font-black text-xl text-[#422F21]">
              {persidangan.judul}
            </h2>
            <p className="text-xs text-[#735334] leading-relaxed">
              Dokumen PDF surat persidangan sedang dipersiapkan oleh sekretariat kepanitiaan.
              Silakan periksa kembali tautan ini beberapa saat lagi.
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
        </div>
      </div>
    );
  }

  const hasImages = Boolean(persidangan.jpg_urls && persidangan.jpg_urls.length > 0);

  // Tampilan Halaman Gambar Universal (Scrollable, Native Zoom di HP)
  return (
    <div className="min-h-screen bg-[#F5EFE6] text-[#422F21] relative selection:bg-[#D49B5B] selection:text-white pb-16">
      {/* Floating Button Kiri Atas: Kembali */}
      <div className="fixed top-4 left-4 z-50">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              window.history.back();
            } else {
              router.push('/');
            }
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#8C6A47]/90 hover:bg-[#735334] text-white text-xs font-bold shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95 border border-white/20"
          title="Kembali"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Kembali</span>
        </button>
      </div>

      {/* Floating Button Kanan Atas: Download & Buka di Tab Baru */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#8C6A47]/90 hover:bg-[#735334] text-white text-xs font-bold shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95 border border-white/20 disabled:opacity-50"
          title="Unduh berkas PDF ke perangkat Anda"
        >
          {downloading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>⬇ Unduh PDF</span>
        </button>

        <a
          href={persidangan.pdf_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#422F21]/90 hover:bg-[#2b1f15] text-white text-xs font-bold shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95 border border-white/20"
          title="Buka langsung PDF asli di tab baru"
        >
          <ExternalLink className="w-4 h-4" />
          <span className="hidden sm:inline">↗ Buka di Tab Baru</span>
        </a>
      </div>

      {/* Main Content Area */}
      <div className="pt-20 px-3 sm:px-6 max-w-4xl mx-auto space-y-4">
        {hasImages ? (
          <div className="space-y-4 sm:space-y-6">
            {persidangan.jpg_urls!.map((url, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg shadow-xl overflow-hidden border border-[#D5C4B4] transition-all"
              >
                <img
                  src={url}
                  alt={`Halaman ${idx + 1} dari ${persidangan.judul}`}
                  className="w-full h-auto block select-none"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border-2 border-[#D5C4B4] rounded-3xl p-8 sm:p-12 text-center shadow-xl space-y-4 my-12">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
              <RefreshCw className="w-7 h-7 animate-spin text-[#8C6A47]" />
            </div>
            <div className="space-y-2">
              <h3 className="font-serif font-bold text-lg text-[#422F21]">
                PDF Sedang Dipersiapkan
              </h3>
              <p className="text-xs text-[#735334] max-w-md mx-auto leading-relaxed">
                Halaman surat persidangan sedang dipersiapkan. Anda dapat mengunduh berkas langsung melalui tombol <strong>⬇ Unduh PDF</strong> di atas.
              </p>
            </div>
          </div>
        )}

        {/* Card QR Code Akses Presensi (Hanya tampil jika parameter ?to= ada) */}
        {toCode && (
          <div className="bg-white border-2 border-[#D5C4B4] rounded-3xl p-6 sm:p-8 shadow-xl my-6 flex items-center justify-center">
            <div className="p-4 sm:p-5 rounded-3xl bg-[#FAF7F3] border-2 border-[#D5C4B4] shadow-inner max-w-[260px] w-full aspect-square flex items-center justify-center">
              <QRCode
                value={toCode}
                size={220}
                bgColor="#FAF7F3"
                fgColor="#422F21"
                level="M"
                style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
              />
            </div>
          </div>
        )}

        {/* Footer Panitia */}
        <div className="text-center pt-8 pb-4 text-[11px] text-[#8C6A47] font-medium">
          Panitia Haul &amp; Haflah Akhirussanah P3TQ &amp; MHMTQ Lirboyo 1448 H. / 2027 M.
        </div>
      </div>
    </div>
  );
}

export default function PublicPersidanganViewerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F3] flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#D5C4B4] rounded-2xl p-8 max-w-sm w-full text-center shadow-lg space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-[#8C6A47] border-t-transparent animate-spin mx-auto"></div>
            <p className="text-xs text-[#735334]">Memuat dokumen undangan...</p>
          </div>
        </div>
      }
    >
      <PublicPersidanganContent />
    </Suspense>
  );
}
