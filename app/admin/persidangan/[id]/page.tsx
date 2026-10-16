'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Upload,
  Users,
  Eye,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  Persidangan,
  getPersidanganById,
  formatTanggalIndo,
  getPublicInvitationUrl,
} from '@/lib/persidangan';
import PersidanganForm from '@/components/PersidanganForm';
import PersidanganPDFUploader from '@/components/PersidanganPDFUploader';
import PersidanganPesertaTable from '@/components/PersidanganPesertaTable';

export default function PersidanganDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [persidangan, setPersidangan] = useState<Persidangan | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'pdf' | 'peserta' | 'preview'>('info');

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

  const publicUrl = getPublicInvitationUrl(persidangan.slug, persidangan.token);

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
            <span
              className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                persidangan.status === 'AKTIF'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : persidangan.status === 'SELESAI'
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}
            >
              Status: {persidangan.status}
            </span>

            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#D5C4B4] text-xs font-bold text-[#735334] hover:bg-[#FAF7F3] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#8C6A47]" />
              Buka Undangan Publik
            </a>
          </div>
        </div>

        <div>
          <h1 className="font-serif font-black text-xl sm:text-2xl text-[#422F21]">
            {persidangan.judul}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#735334] pt-1">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#8C6A47]" />
              {formatTanggalIndo(persidangan.tanggal)}
            </span>
            {persidangan.waktu && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#8C6A47]" />
                {persidangan.waktu}
              </span>
            )}
            {persidangan.tempat && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#8C6A47]" />
                {persidangan.tempat}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
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
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
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
          Tab 3: Peserta & Kirim WA
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold tracking-wide transition-all border-t-2 border-x-2 -mb-0.5 whitespace-nowrap ${
            activeTab === 'preview'
              ? 'bg-white text-[#422F21] border-[#D5C4B4] border-b-white'
              : 'text-[#735334] hover:text-[#422F21] border-transparent'
          }`}
        >
          <Eye className="w-4 h-4 text-[#8C6A47]" />
          Tab 4: Pratinjau Undangan
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

        {activeTab === 'preview' && (
          <div className="space-y-4">
            <div className="bg-[#FAF7F3] border-2 border-[#D5C4B4] rounded-2xl p-4 flex items-center justify-between shadow-xs">
              <span className="text-xs text-[#735334]">
                Berikut adalah tampilan persis seperti yang akan dilihat oleh penerima saat membuka tautan undangan digital:
              </span>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8C6A47] text-white text-xs font-bold hover:bg-[#735334] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Buka di Tab Baru
              </a>
            </div>

            <div className="border-2 border-[#D5C4B4] rounded-2xl overflow-hidden bg-white shadow-md">
              <iframe
                src={publicUrl}
                title="Pratinjau Halaman Publik Undangan"
                className="w-full h-[800px] border-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
