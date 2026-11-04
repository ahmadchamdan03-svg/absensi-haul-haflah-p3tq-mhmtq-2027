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
      <div className="bg-white/80 backdrop-blur-md border border-[#D5C4B4] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] overflow-hidden">
        {/* 1. Top Header (Menyatu di bagian atas panel) */}
        <div className="p-5 sm:p-6 bg-gradient-to-b from-[#FAF7F3] to-[#F5EFE8] border-b border-[#D5C4B4] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/admin/persidangan"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8C6A47] hover:text-[#5E432A] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali ke Daftar Persidangan
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowScanModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-[#D5C4B4] hover:bg-[#FAF7F3] hover:border-[#8C6A47] text-xs font-bold text-[#8C6A47] shadow-xs transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-[#8C6A47]" />
                Scan Kehadiran
              </button>

              <button
                type="button"
                onClick={handleCopyOfficialLink}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
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
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-[#D5C4B4] text-xs font-bold text-[#735334] hover:bg-[#FAF7F3] transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#8C6A47]" />
                Buka Halaman Publik
              </a>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-serif font-black text-xl sm:text-2xl text-[#422F21]">
                {persidangan.judul}
              </h1>
              {persidangan.prefix_kode && (
                <span className="px-2.5 py-0.5 rounded-md font-mono font-bold text-xs bg-[#8C6A47]/10 text-[#8C6A47] border border-[#8C6A47]/25">
                  Prefix: {persidangan.prefix_kode}
                </span>
              )}
            </div>
            <p className="text-xs text-[#735334] pt-1">
              Kelola persidangan, unggah berkas PDF resmi, dan distribusikan tautan langsung ke peserta via WhatsApp.
            </p>
          </div>
        </div>

        {/* 2. Tabs Navigation (Langsung menempel di bawah header tanpa margin/gap) */}
        <div className="flex border-b border-[#D5C4B4] bg-[#EFE8E1]/90 px-4 sm:px-6 pt-2.5 gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-t-xl text-xs tracking-wide transition-all border-t border-x -mb-px whitespace-nowrap cursor-pointer ${
              activeTab === 'info'
                ? 'bg-white text-[#422F21] border-[#D5C4B4] border-b-white shadow-xs font-black'
                : 'text-[#735334] hover:text-[#422F21] border-transparent hover:bg-white/40 font-bold'
            }`}
          >
            <FileText className="w-4 h-4 text-[#8C6A47]" />
            Tab 1: Info Persidangan
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pdf')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-t-xl text-xs tracking-wide transition-all border-t border-x -mb-px whitespace-nowrap cursor-pointer ${
              activeTab === 'pdf'
                ? 'bg-white text-[#422F21] border-[#D5C4B4] border-b-white shadow-xs font-black'
                : 'text-[#735334] hover:text-[#422F21] border-transparent hover:bg-white/40 font-bold'
            }`}
          >
            <Upload className="w-4 h-4 text-[#8C6A47]" />
            Tab 2: Dokumen PDF
            {persidangan.pdf_url && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="PDF sudah diunggah"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('peserta')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-t-xl text-xs tracking-wide transition-all border-t border-x -mb-px whitespace-nowrap cursor-pointer ${
              activeTab === 'peserta'
                ? 'bg-white text-[#422F21] border-[#D5C4B4] border-b-white shadow-xs font-black'
                : 'text-[#735334] hover:text-[#422F21] border-transparent hover:bg-white/40 font-bold'
            }`}
          >
            <Users className="w-4 h-4 text-[#8C6A47]" />
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
