'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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

export default function PublicPersidanganViewerPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || '';

  const [persidangan, setPersidangan] = useState<Persidangan | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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

  const [downloading, setDownloading] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Fallback timeout: jika setelah 3.5 detik iframe belum load (misal diblokir browser atau plugin PDF tidak ada)
  useEffect(() => {
    if (!persidangan?.pdf_url) return;

    const timer = setTimeout(() => {
      setIframeLoaded((loaded) => {
        if (!loaded) {
          setIframeError(true);
        }
        return loaded;
      });
    }, 3500);

    return () => clearTimeout(timer);
  }, [persidangan?.pdf_url]);

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
              Memuat dokumen PDF resmi kepanitiaan.
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

  // PDF Viewer Full-screen Minimalis dengan Tombol Floating
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900">
      {/* Floating Button Kiri Atas: Kembali */}
      <div className="fixed top-4 left-4 z-50">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              window.history.back();
            } else {
              router.push('/');
            }
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#8C6A47]/90 hover:bg-[#735334] text-white text-xs font-bold shadow-lg backdrop-blur-sm transition-all hover:scale-105 active:scale-95 border border-white/20"
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
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#8C6A47]/90 hover:bg-[#735334] text-white text-xs font-bold shadow-lg backdrop-blur-sm transition-all hover:scale-105 active:scale-95 border border-white/20 disabled:opacity-50"
          title="Unduh berkas PDF ke perangkat Anda"
        >
          {downloading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>{downloading ? 'Mengunduh...' : 'Unduh PDF'}</span>
        </button>

        <a
          href={persidangan.pdf_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#422F21]/90 hover:bg-[#2b1f15] text-white text-xs font-bold shadow-lg backdrop-blur-sm transition-all hover:scale-105 active:scale-95 border border-white/20"
          title="Buka langsung di tab baru (viewer bawaan browser)"
        >
          <ExternalLink className="w-4 h-4" />
          <span className="hidden sm:inline">Buka di Tab Baru</span>
        </a>
      </div>

      {/* Embedded PDF Full-screen */}
      <iframe
        src={persidangan.pdf_url}
        title={`Undangan ${persidangan.judul}`}
        className="w-full h-full border-0 select-none"
        onLoad={() => {
          setIframeLoaded(true);
          setIframeError(false);
        }}
        onError={() => {
          setIframeError(true);
        }}
      />

      {/* Fallback Panel Jika PDF Gagal Dimuat di Browser Tertentu */}
      {iframeError && (
        <div className="absolute inset-0 z-40 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border-2 border-[#D5C4B4] rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
              <FileText className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                Pratinjau Browser
              </span>
              <h3 className="font-serif font-black text-lg sm:text-xl text-[#422F21]">
                PDF tidak bisa ditampilkan di browser ini.
              </h3>
              <p className="text-xs text-[#735334] leading-relaxed">
                Silakan klik tombol di bawah untuk membuka atau mengunduh surat undangan persidangan resmi:
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleDownload()}
                disabled={downloading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
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
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#422F21] hover:bg-[#2b1f15] text-white text-xs font-bold shadow-md transition-all active:scale-95"
              >
                <ExternalLink className="w-4 h-4" />
                <span>↗ Buka di Tab Baru</span>
              </a>
            </div>

            <button
              type="button"
              onClick={() => {
                setIframeError(false);
                setIframeLoaded(true);
              }}
              className="text-[11px] text-[#A89887] hover:text-[#735334] underline pt-1 block mx-auto transition-colors"
            >
              Tutup &amp; coba lihat pratinjau kembali
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
