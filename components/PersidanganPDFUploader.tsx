'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  FileCheck,
  AlertCircle,
  Copy,
  ExternalLink,
  Check,
  Trash2,
  RefreshCw,
  FileText,
  Eye,
  Maximize2,
} from 'lucide-react';
import {
  Persidangan,
  uploadPersidanganPdf,
  updatePersidangan,
} from '@/lib/persidangan';

interface PersidanganPDFUploaderProps {
  persidangan: Persidangan;
  onUpdate: (updated: Persidangan) => void;
}

export default function PersidanganPDFUploader({
  persidangan,
  onUpdate,
}: PersidanganPDFUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const directPdfUrl = persidangan.pdf_url || '';

  const handleCopyLink = async () => {
    if (!directPdfUrl) {
      setErrorMsg('Belum ada berkas PDF yang diunggah.');
      return;
    }
    try {
      await navigator.clipboard.writeText(directPdfUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setErrorMsg('Gagal menyalin link ke clipboard.');
    }
  };

  const processFile = async (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validasi tipe file (hanya .pdf)
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Format file tidak didukung. Harap unggah dokumen dengan format PDF (.pdf).');
      return;
    }

    // Validasi ukuran file (maksimal 5 MB)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setErrorMsg('Ukuran file melebihi batas 5 MB. Harap kompres dokumen PDF Anda terlebih dahulu.');
      return;
    }

    setUploading(true);

    try {
      const { publicUrl: pdfUrl, error: uploadErr } = await uploadPersidanganPdf(
        file,
        persidangan.id
      );

      if (uploadErr || !pdfUrl) {
        setErrorMsg(uploadErr?.message || 'Gagal mengunggah dokumen PDF ke storage.');
        return;
      }

      // Update kolom pdf_url di tabel persidangan
      const { data: updatedData, error: updateErr } = await updatePersidangan(persidangan.id, {
        pdf_url: pdfUrl,
      });

      if (updateErr || !updatedData) {
        setErrorMsg(updateErr?.message || 'Gagal menyimpan URL PDF ke database.');
        return;
      }

      setSuccessMsg('Dokumen PDF undangan resmi berhasil diunggah!');
      onUpdate(updatedData);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan tidak terduga saat mengunggah file.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemovePdf = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus PDF undangan ini dari persidangan?')) return;

    setUploading(true);
    setErrorMsg(null);
    try {
      const { data: updatedData, error } = await updatePersidangan(persidangan.id, {
        pdf_url: null,
      });

      if (error || !updatedData) {
        setErrorMsg('Gagal menghapus tautan PDF.');
        return;
      }

      setSuccessMsg('Dokumen PDF berhasil dilepas dari persidangan.');
      onUpdate(updatedData);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Messages */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
          <FileCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>{successMsg}</div>
        </div>
      )}

      {/* Info Link Langsung PDF Storage */}
      {directPdfUrl ? (
        <div className="bg-[#FAF7F3] border-2 border-[#D5C4B4] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A47]">
              Tautan Langsung Berkas PDF (Supabase Storage)
            </div>
            <div className="font-mono text-xs text-[#422F21] bg-white px-3 py-1.5 rounded-lg border border-[#E5D7C8] break-all select-all">
              {directPdfUrl}
            </div>
            <div className="text-[11px] text-[#735334]">
              Tautan ini yang disisipkan ke pesan WhatsApp pada placeholder <code>[LINK_PDF_LANGSUNG]</code>.
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white text-xs font-bold shadow-xs transition-colors"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  Tersalin!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Salin Link PDF
                </>
              )}
            </button>
            <a
              href={directPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs font-bold text-[#735334] hover:bg-[#FAF7F3] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Buka PDF
            </a>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Belum ada dokumen PDF yang diunggah. Unggah berkas PDF di bawah agar tautan langsung otomatis aktif pada pesan WhatsApp.
          </span>
        </div>
      )}

      {/* Upload Box atau Preview PDF */}
      {!persidangan.pdf_url ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all ${
            isDragging
              ? 'border-[#8C6A47] bg-[#F5E6D3]/60'
              : 'border-[#D5C4B4] bg-[#FAF7F3] hover:border-[#8C6A47]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-white border border-[#D5C4B4] text-[#8C6A47] flex items-center justify-center mx-auto shadow-xs">
              <Upload className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="font-serif font-bold text-base sm:text-lg text-[#422F21]">
                Unggah Dokumen PDF Undangan Resmi
              </h4>
              <p className="text-xs text-[#735334]">
                Tarik &amp; letakkan berkas PDF surat persidangan resmi di sini, atau klik tombol di bawah.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Mengunggah PDF...' : 'Pilih Berkas PDF'}
              </button>
            </div>

            <div className="text-[11px] text-[#A89887]">
              Format yang didukung: <strong>.pdf</strong> (Maksimal 5 MB)
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header Controls for Existing PDF */}
          <div className="bg-[#FAF7F3] border-2 border-[#D5C4B4] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#8C6A47]/10 border border-[#8C6A47]/30 flex items-center justify-center text-[#8C6A47]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#422F21]">
                  Dokumen PDF Undangan Aktif
                </div>
                <div className="text-[11px] text-[#735334]">
                  Siap diakses langsung oleh seluruh peserta melalui tautan WhatsApp
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#D5C4B4] text-xs font-bold text-[#735334] hover:bg-[#F5E6D3] transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {uploading ? 'Mengunggah...' : 'Ganti PDF'}
              </button>
              <a
                href={persidangan.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8C6A47] text-white text-xs font-bold hover:bg-[#735334] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Buka PDF di Tab Baru
              </a>
              <button
                type="button"
                onClick={handleRemovePdf}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-red-200 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                title="Hapus PDF"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Embedded PDF Viewer */}
          <div className="border-2 border-[#D5C4B4] rounded-2xl overflow-hidden bg-white shadow-xs">
            <div className="bg-[#EFE8E1] px-4 py-2.5 border-b border-[#D5C4B4] flex items-center justify-between text-xs font-semibold text-[#735334]">
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#8C6A47]" />
                Pratinjau Dokumen PDF
              </span>
              <a
                href={persidangan.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#422F21] flex items-center gap-1 text-[11px]"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                Layar Penuh
              </a>
            </div>
            <iframe
              src={persidangan.pdf_url}
              title="Pratinjau PDF Undangan"
              className="w-full h-[550px] sm:h-[650px] border-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
