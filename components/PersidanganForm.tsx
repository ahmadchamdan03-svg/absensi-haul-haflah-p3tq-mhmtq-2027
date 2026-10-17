'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  MessageSquare,
  Save,
  ArrowLeft,
  Sparkles,
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3">
          <Info className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>{successMsg}</div>
        </div>
      )}

      {/* Field 1: Judul Persidangan & Prefix Kode */}
      <div className="bg-[#FAF7F3] border-2 border-[#D5C4B4] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="font-serif font-bold text-base sm:text-lg text-[#422F21] border-b border-[#E5D7C8] pb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#8C6A47]" />
          Informasi Persidangan
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#735334] mb-1.5">
              Judul Persidangan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: Sidang Harian II, Sidang Pleno, Sidang Ndalem"
              maxLength={200}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C4B4] bg-white text-[#422F21] placeholder-[#A89887] text-sm focus:outline-none focus:ring-2 focus:ring-[#8C6A47]/40 focus:border-[#8C6A47]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#735334] mb-1.5">
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C4B4] bg-white text-[#422F21] font-mono font-bold text-sm tracking-wider uppercase placeholder-[#A89887] focus:outline-none focus:ring-2 focus:ring-[#8C6A47]/40 focus:border-[#8C6A47]"
            />
            <span className="text-[10px] text-[#735334] mt-1 block">
              Maks. 4 karakter kapital (contoh: SD3, SN).
            </span>
          </div>
        </div>
      </div>

      {/* Field 2: Editor Template WhatsApp */}
      <div className="bg-[#FAF7F3] border-2 border-[#D5C4B4] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5D7C8] pb-3">
          <h3 className="font-serif font-bold text-base sm:text-lg text-[#422F21] flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#8C6A47]" />
            Template Pesan WhatsApp
          </h3>
          <button
            type="button"
            onClick={handleResetTemplate}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#8C6A47] hover:text-[#5E432A] hover:bg-[#EFE8E1] rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset ke Standar
          </button>
        </div>

        <p className="text-xs text-[#735334] leading-relaxed">
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
              className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-white border border-[#D5C4B4] text-[#8C6A47] hover:bg-[#F5E6D3] hover:border-[#8C6A47] transition-colors"
            >
              + {item.label}
            </button>
          ))}
        </div>

        <textarea
          value={templateWa}
          onChange={(e) => setTemplateWa(e.target.value)}
          rows={11}
          required
          className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C4B4] bg-white text-[#422F21] font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#8C6A47]/40 focus:border-[#8C6A47]"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-3 pt-2">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#D5C4B4] text-xs font-bold text-[#735334] hover:bg-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Batal
          </button>
        ) : (
          <button
            type="button"
            onClick={() => router.push('/admin/persidangan')}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#D5C4B4] text-xs font-bold text-[#735334] hover:bg-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Daftar
          </button>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white text-xs font-bold tracking-wide shadow-md hover:shadow-lg transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Menyimpan...' : mode === 'create' ? 'Buat Persidangan & Lanjut ke PDF' : 'Simpan Perubahan'}
        </button>
      </div>
    </form>
  );
}
