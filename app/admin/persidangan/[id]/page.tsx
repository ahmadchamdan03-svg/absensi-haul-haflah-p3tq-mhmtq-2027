'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Upload,
  Users,
  ExternalLink,
  RefreshCw,
  FileCheck,
  Copy,
  Check,
  Camera,
} from 'lucide-react';
import {
  Persidangan,
  getPersidanganById,
  getPublicPersidanganUrl,
} from '@/lib/persidangan';
import PersidanganForm from '@/components/PersidanganForm';
import PersidanganPDFUploader from '@/components/PersidanganPDFUploader';
import PersidanganPesertaTable from '@/components/PersidanganPesertaTable';
import PersidanganScanModal from '@/components/PersidanganScanModal';
import { SkeletonCard, SkeletonTable } from '@/components/ui/GlassSkeleton';

export default function PersidanganDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params?.id as string;

  const initialTabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'info' | 'pdf' | 'peserta'>(
    initialTabParam === 'pdf' ? 'pdf' : initialTabParam === 'peserta' ? 'peserta' : 'info'
  );

  const [persidangan, setPersidangan] = useState<Persidangan | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);

  const handleCopyOfficialLink = async () => {
    if (!persidangan) return;
    try {
      const url = getPublicPersidanganUrl(persidangan.slug);
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      alert('Gagal menyalin link resmi.');
    }
  };

  // Sync tab dari search param jika berubah
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'pdf' || tabParam === 'peserta' || tabParam === 'info') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getPersidanganById(id);
      if (!data) {
        alert('Persidangan tidak ditemukan.');
        router.push('/admin/persidangan');
        return;
      }
      setPersidangan(data);
    } catch (err: any) {
      console.error('Error fetching detail:', err);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (loading) {
    return (
      <div className="px-6 lg:px-8 py-6 pb-12 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
        <SkeletonCard className="h-32" />
        <SkeletonTable rows={5} cols={6} />
      </div>
    );
  }

  if (!persidangan) {
    return null;
  }

  return (
    <div className="px-6 lg:px-8 py-6 pb-12 max-w-7xl mx-auto">
      {/* Unified Main Panel: Header + Tab Menu + Kotak Isi */}
      <div className="bg-white/80 backdrop-blur-md border border-[#BAE6FD] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* 1. Top Header (Menyatu di bagian atas panel) */}
        <div className="p-5 sm:p-6 bg-gradient-to-b from-[#F0F9FF] to-[#F5EFE8] border-b border-[#BAE6FD] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/admin/persidangan"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1D4ED8] hover:text-[#5E432A] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali ke Daftar Persidangan
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowScanModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-[#BAE6FD] hover:bg-[#F0F9FF] hover:border-[#1D4ED8] text-xs font-bold text-[#1D4ED8] shadow-xs transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-[#1D4ED8]" />
                Scan Kehadiran
              </button>

              <button
                type="button"
                onClick={handleCopyOfficialLink}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    Link Tersalin!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Salin Link Resmi
                  </>
                )}
              </button>

              <a
                href={`/persidangan/${persidangan.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-[#BAE6FD] text-xs font-bold text-[#1E40AF] hover:bg-[#F0F9FF] transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#1D4ED8]" />
                Buka Halaman Publik
              </a>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-serif font-black text-xl sm:text-2xl text-[#0F2C59]">
                {persidangan.judul}
              </h1>
              {persidangan.prefix_kode && (
                <span className="px-2.5 py-0.5 rounded-md font-mono font-bold text-xs bg-[#1D4ED8]/10 text-[#1D4ED8] border border-[#1D4ED8]/25">
                  Prefix: {persidangan.prefix_kode}
                </span>
              )}
            </div>
            <p className="text-xs text-[#1E40AF] pt-1">
              Kelola persidangan, unggah berkas PDF resmi, dan distribusikan tautan langsung ke peserta via WhatsApp.
            </p>
          </div>
        </div>

        {/* 2. Tabs Navigation (Langsung menempel di bawah header tanpa margin/gap) */}
        <div className="flex border-b border-[#BAE6FD] bg-[#E0F2FE]/90 px-4 sm:px-6 pt-2.5 gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-t-xl text-xs tracking-wide transition-all border-t border-x -mb-px whitespace-nowrap cursor-pointer ${
              activeTab === 'info'
                ? 'bg-white text-[#0F2C59] border-[#BAE6FD] border-b-white shadow-xs font-black'
                : 'text-[#1E40AF] hover:text-[#0F2C59] border-transparent hover:bg-white/40 font-bold'
            }`}
          >
            <FileText className="w-4 h-4 text-[#1D4ED8]" />
            Tab 1: Info Persidangan
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pdf')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-t-xl text-xs tracking-wide transition-all border-t border-x -mb-px whitespace-nowrap cursor-pointer ${
              activeTab === 'pdf'
                ? 'bg-white text-[#0F2C59] border-[#BAE6FD] border-b-white shadow-xs font-black'
                : 'text-[#1E40AF] hover:text-[#0F2C59] border-transparent hover:bg-white/40 font-bold'
            }`}
          >
            <Upload className="w-4 h-4 text-[#1D4ED8]" />
            Tab 2: Dokumen PDF
            {persidangan.pdf_url && (
              <span className="w-2 h-2 rounded-full bg-blue-500" title="PDF sudah diunggah"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('peserta')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-t-xl text-xs tracking-wide transition-all border-t border-x -mb-px whitespace-nowrap cursor-pointer ${
              activeTab === 'peserta'
                ? 'bg-white text-[#0F2C59] border-[#BAE6FD] border-b-white shadow-xs font-black'
                : 'text-[#1E40AF] hover:text-[#0F2C59] border-transparent hover:bg-white/40 font-bold'
            }`}
          >
            <Users className="w-4 h-4 text-[#1D4ED8]" />
            Tab 3: Peserta &amp; Kirim WA
          </button>
        </div>

        {/* 3. Kotak Isi (Menyatu dengan Tab Menu di atasnya, rounded-b-2xl) */}
        <div className="p-5 sm:p-6 bg-white rounded-b-2xl">
          {activeTab === 'info' && (
            <PersidanganForm
              mode="edit"
              initialData={persidangan}
              onSuccess={(updated) => setPersidangan(updated)}
            />
          )}

          {activeTab === 'pdf' && (
            <PersidanganPDFUploader
              persidangan={persidangan}
              onUpdate={(updated) => setPersidangan(updated)}
            />
          )}

          {activeTab === 'peserta' && (
            <PersidanganPesertaTable persidangan={persidangan} />
          )}
        </div>
      </div>

      {/* Modal Scanner Kehadiran */}
      {showScanModal && (
        <PersidanganScanModal
          persidangan={persidangan}
          onClose={() => setShowScanModal(false)}
          onScanSuccess={() => fetchDetail()}
        />
      )}
    </div>
  );
}
