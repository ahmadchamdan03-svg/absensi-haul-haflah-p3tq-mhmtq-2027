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
} from 'lucide-react';
import {
  Persidangan,
  getPersidanganById,
} from '@/lib/persidangan';
import PersidanganForm from '@/components/PersidanganForm';
import PersidanganPDFUploader from '@/components/PersidanganPDFUploader';
import PersidanganPesertaTable from '@/components/PersidanganPesertaTable';

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
      <div className="bg-[#FAF7F3] border-2 border-[#D5C4B4] rounded-2xl p-12 text-center text-xs text-[#735334]">
        <div className="inline-flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-[#8C6A47]" />
          <span>Memuat data persidangan...</span>
        </div>
      </div>
    );
  }

  if (!persidangan) {
    return null;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-[#FAF7F3] border-2 border-[#D5C4B4] rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin/persidangan"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8C6A47] hover:text-[#5E432A] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Daftar Persidangan
          </Link>

          <div className="flex items-center gap-2">
            {persidangan.pdf_url && (
              <a
                href={persidangan.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#D5C4B4] text-xs font-bold text-[#735334] hover:bg-[#FAF7F3] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#8C6A47]" />
                Buka Berkas PDF
              </a>
            )}
          </div>
        </div>

        <div>
          <h1 className="font-serif font-black text-xl sm:text-2xl text-[#422F21]">
            {persidangan.judul}
          </h1>
          <p className="text-xs text-[#735334] pt-1">
            Kelola persidangan, unggah berkas PDF resmi, dan distribusikan tautan langsung ke peserta via WhatsApp.
          </p>
        </div>
      </div>

      {/* Tabs Navigation (3 Tab Bersih) */}
      <div className="flex border-b-2 border-[#D5C4B4] bg-[#FAF7F3] rounded-t-2xl px-2 pt-2 gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold tracking-wide transition-all border-t-2 border-x-2 -mb-0.5 whitespace-nowrap ${
            activeTab === 'info'
              ? 'bg-white text-[#422F21] border-[#D5C4B4] border-b-white'
              : 'text-[#735334] hover:text-[#422F21] border-transparent'
          }`}
        >
          <FileText className="w-4 h-4 text-[#8C6A47]" />
          Tab 1: Info Persidangan
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pdf')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold tracking-wide transition-all border-t-2 border-x-2 -mb-0.5 whitespace-nowrap ${
            activeTab === 'pdf'
              ? 'bg-white text-[#422F21] border-[#D5C4B4] border-b-white'
              : 'text-[#735334] hover:text-[#422F21] border-transparent'
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
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold tracking-wide transition-all border-t-2 border-x-2 -mb-0.5 whitespace-nowrap ${
            activeTab === 'peserta'
              ? 'bg-white text-[#422F21] border-[#D5C4B4] border-b-white'
              : 'text-[#735334] hover:text-[#422F21] border-transparent'
          }`}
        >
          <Users className="w-4 h-4 text-[#8C6A47]" />
          Tab 3: Peserta &amp; Kirim WA
        </button>
      </div>

      {/* Tab Contents */}
      <div className="pt-2">
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
  );
}
