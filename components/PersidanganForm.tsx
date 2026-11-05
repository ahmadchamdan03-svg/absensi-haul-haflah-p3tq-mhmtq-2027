'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  MessageSquare,
  Save,
  ArrowLeft,
  CheckCircle2,
  Info,
  RotateCcw,
} from 'lucide-react';
import {
  Persidangan,
  createPersidangan,
  updatePersidangan,
  DEFAULT_TEMPLATE_WA,
} from '@/lib/persidangan';

interface PersidanganFormProps {
  mode: 'create' | 'edit';
  initialData?: Persidangan | null;
  onSuccess?: (data: Persidangan) => void;
  onCancel?: () => void;
}

export default function PersidanganForm({
  mode,
  initialData,
  onSuccess,
  onCancel,
}: PersidanganFormProps) {
  const router = useRouter();

  const [judul, setJudul] = useState('');
  const [prefixKode, setPrefixKode] = useState('');
  const [templateWa, setTemplateWa] = useState(DEFAULT_TEMPLATE_WA);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setJudul(initialData.judul || '');
      setPrefixKode(initialData.prefix_kode || '');
      setTemplateWa(initialData.template_wa || DEFAULT_TEMPLATE_WA);
    }
  }, [initialData]);

  const insertPlaceholder = (ph: string) => {
    setTemplateWa((prev) => `${prev} ${ph}`);
  };

  const handleResetTemplate = () => {
    if (confirm('Apakah Anda yakin ingin mengembalikan template pesan WhatsApp ke format standar?')) {
      setTemplateWa(DEFAULT_TEMPLATE_WA);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!judul.trim()) {
      setErrorMsg('Judul persidangan wajib diisi.');
      return;
    }
    if (!prefixKode.trim()) {
      setErrorMsg('Awalan kode (prefix) wajib diisi (contoh: SD3, SN).');
      return;
    }
    if (!templateWa.trim()) {
      setErrorMsg('Template pesan WhatsApp wajib diisi.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'create') {
        const { data, error } = await createPersidangan({
          judul: judul.trim(),
          prefix_kode: prefixKode.trim().toUpperCase(),
          template_wa: templateWa.trim(),
        });

        if (error || !data) {
          setErrorMsg(error?.message || 'Gagal membuat persidangan baru.');
          return;
        }

        setSuccessMsg('Persidangan berhasil dibuat!');
        if (onSuccess) {
          onSuccess(data);
        } else {
          router.push(`/admin/persidangan/${data.id}?tab=pdf`);
        }
      } else if (mode === 'edit' && initialData) {
        const { data, error } = await updatePersidangan(initialData.id, {
          judul: judul.trim(),
          prefix_kode: prefixKode.trim().toUpperCase(),
          template_wa: templateWa.trim(),
        });

        if (error || !data) {
          setErrorMsg(error?.message || 'Gagal memperbarui persidangan.');
          return;
        }

        setSuccessMsg('Perubahan berhasil disimpan!');
        if (onSuccess) {
          onSuccess(data);
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>{successMsg}</div>
        </div>
      )}

      {/* Field 1: Judul Persidangan & Prefix Kode */}
      <div className="bg-[#F0F9FF]/70 border border-[#BAE6FD] rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
        <h3 className="font-serif font-bold text-base text-[#0F2C59] border-b border-[#E5D7C8] pb-2.5 flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#1D4ED8]" />
          Informasi Persidangan
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1E40AF] mb-1">
              Judul Persidangan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: Sidang Harian II, Sidang Pleno, Sidang Ndalem"
              maxLength={200}
              required
              className="w-full px-3.5 py-2 rounded-xl border border-[#BAE6FD] bg-white text-[#0F2C59] placeholder-[#A89887] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/40 focus:border-[#1D4ED8]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1E40AF] mb-1">
              Awalan Kode (Prefix) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={prefixKode}
              onChange={(e) =>
                setPrefixKode(
                  e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, '')
                    .slice(0, 4)
                )
              }
              placeholder="Contoh: SD3, SN"
              maxLength={4}
              required
              className="w-full px-3.5 py-2 rounded-xl border border-[#BAE6FD] bg-white text-[#0F2C59] font-mono font-bold text-xs sm:text-sm tracking-wider uppercase placeholder-[#A89887] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/40 focus:border-[#1D4ED8]"
            />
            <span className="text-[10px] text-[#1E40AF] mt-1 block">
              Maks. 4 karakter kapital (contoh: SD3, SN).
            </span>
          </div>
        </div>
      </div>

      {/* Field 2: Editor Template WhatsApp */}
      <div className="bg-[#F0F9FF]/70 border border-[#BAE6FD] rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5D7C8] pb-2.5">
          <h3 className="font-serif font-bold text-base text-[#0F2C59] flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#1D4ED8]" />
            Template Pesan WhatsApp
          </h3>
          <button
            type="button"
            onClick={handleResetTemplate}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#1D4ED8] hover:text-[#5E432A] hover:bg-[#E0F2FE] rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset ke Standar
          </button>
        </div>

        <p className="text-xs text-[#1E40AF] leading-relaxed">
          Pesan ini akan otomatis dikirimkan ke WhatsApp peserta saat tombol &quot;Kirim WA&quot; ditekan.
          Klik salah satu tombol placeholder di bawah untuk menyisipkannya:
        </p>

        {/* Placeholder insertion buttons */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: '[NAMA_PESERTA]', tip: 'Nama penerima undangan' },
            { label: '[JUDUL_PERSIDANGAN]', tip: 'Judul persidangan' },
            { label: '[LINK_UNDANGAN]', tip: 'Tautan resmi undangan persidangan' },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => insertPlaceholder(item.label)}
              title={item.tip}
              className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-white border border-[#BAE6FD] text-[#1D4ED8] hover:bg-[#F5E6D3] hover:border-[#1D4ED8] transition-colors cursor-pointer"
            >
              + {item.label}
            </button>
          ))}
        </div>

        <textarea
          value={templateWa}
          onChange={(e) => setTemplateWa(e.target.value)}
          rows={9}
          required
          className="w-full px-3.5 py-2.5 rounded-xl border border-[#BAE6FD] bg-white text-[#0F2C59] font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/40 focus:border-[#1D4ED8]"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#BAE6FD] text-xs font-bold text-[#1E40AF] hover:bg-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Batal
          </button>
        ) : (
          <button
            type="button"
            onClick={() => router.push('/admin/persidangan')}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#BAE6FD] text-xs font-bold text-[#1E40AF] hover:bg-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Daftar
          </button>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-bold tracking-wide shadow-md hover:shadow-lg transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Menyimpan...' : mode === 'create' ? 'Buat Persidangan & Lanjut ke PDF' : 'Simpan Perubahan'}
        </button>
      </div>
    </form>
  );
}
