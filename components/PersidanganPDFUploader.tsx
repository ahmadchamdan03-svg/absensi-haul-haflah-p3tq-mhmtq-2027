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
  Sparkles,
} from 'lucide-react';
import {
  Persidangan,
  uploadPersidanganPdf,
  updatePersidangan,
  getPublicPersidanganUrl,
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
  const [converting, setConverting] = useState(false);
  const [convertingStatus, setConvertingStatus] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedOfficialLink, setCopiedOfficialLink] = useState(false);

  const directPdfUrl = persidangan.pdf_url || '';
  const officialPublicUrl = getPublicPersidanganUrl(persidangan.slug);

  const handleCopyOfficialLink = async () => {
    try {
      await navigator.clipboard.writeText(officialPublicUrl);
      setCopiedOfficialLink(true);
      setTimeout(() => setCopiedOfficialLink(false), 2500);
    } catch {
      setErrorMsg('Gagal menyalin link resmi ke clipboard.');
    }
  };

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

  const handleRetryConvert = async () => {
    if (!persidangan.pdf_url) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setConverting(true);
    setConvertingStatus('Sedang memproses PDF jadi gambar...');

    try {
      const convRes = await fetch('/api/persidangan/convert-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persidangan_id: persidangan.id,
          pdf_url: persidangan.pdf_url,
        }),
      });

      const convJson = await convRes.json();
      if (convJson.success && convJson.jpg_urls) {
        setSuccessMsg(`Berhasil mengonversi dokumen menjadi ${convJson.jpg_urls.length} gambar!`);
        onUpdate({
          ...persidangan,
          jpg_urls: convJson.jpg_urls,
        });
      } else {
        setErrorMsg('Konversi gagal: ' + (convJson.message || 'Terjadi kesalahan sistem.'));
      }
    } catch (err: any) {
      setErrorMsg('Gagal mengonversi: ' + (err?.message || err));
    } finally {
      setConverting(false);
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

    // Validasi ukuran file (maksimal 10 MB)
    const MAX_SIZE_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setErrorMsg('Ukuran file melebihi batas 10 MB. Harap kompres dokumen PDF Anda terlebih dahulu.');
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

      onUpdate(updatedData);

      // Konversi otomatis PDF -> JPG
      setConverting(true);
      setConvertingStatus('Sedang memproses PDF jadi gambar...');

      try {
        const convRes = await fetch('/api/persidangan/convert-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            persidangan_id: persidangan.id,
            pdf_url: pdfUrl,
          }),
        });

        const convJson = await convRes.json();
        if (convJson.success && convJson.jpg_urls) {
          setSuccessMsg(
            `Dokumen PDF berhasil diunggah & dikonversi menjadi ${convJson.jpg_urls.length} gambar!`
          );
          onUpdate({
            ...updatedData,
            pdf_url: pdfUrl,
            jpg_urls: convJson.jpg_urls,
          });
        } else {
          setErrorMsg(
            'PDF berhasil diunggah, namun konversi otomatis ke gambar gagal: ' +
              (convJson.message || 'Silakan klik tombol Coba Konversi Ulang.')
          );
        }
      } catch (convErr: any) {
        setErrorMsg('Gagal mengonversi PDF ke gambar: ' + (convErr?.message || convErr));
      } finally {
        setConverting(false);
      }
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
    if (!confirm('Apakah Anda yakin ingin menghapus PDF dan gambar undangan ini dari persidangan?')) return;

    setUploading(true);
    setErrorMsg(null);
    try {
      const { data: updatedData, error } = await updatePersidangan(persidangan.id, {
        pdf_url: null,
        jpg_urls: null,
      });

      if (error || !updatedData) {
        setErrorMsg('Gagal menghapus berkas undangan.');
        return;
      }

      setSuccessMsg('Dokumen PDF dan berkas gambar berhasil dilepas dari persidangan.');
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

      {/* Info Link Publik Resmi & Tautan PDF */}
      <div className="bg-[#FAF7F3] border-2 border-[#D5C4B4] rounded-2xl p-5 shadow-xs space-y-4">
        {/* Tautan Publik Resmi */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A47]">
                Tautan Resmi Undangan Publik
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Viewer Fullscreen
              </span>
            </div>
            <div className="font-mono text-xs text-[#422F21] bg-white px-3 py-1.5 rounded-lg border border-[#E5D7C8] break-all select-all font-semibold">
              {officialPublicUrl}
            </div>
            <div className="text-[11px] text-[#735334]">
              Tautan resmi ini yang disisipkan ke pesan WhatsApp pada placeholder <code>[LINK_UNDANGAN]</code>. Halaman ini memuat viewer PDF satu layar penuh dengan tombol unduh.
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyOfficialLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white text-xs font-bold shadow-xs transition-colors"
            >
              {copiedOfficialLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  Link Tersalin!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Salin Link Resmi
                </>
              )}
            </button>
            <a
              href={`/persidangan/${persidangan.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs font-bold text-[#735334] hover:bg-[#FAF7F3] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Buka Halaman
            </a>
          </div>
        </div>

        {/* Status Berkas PDF */}
        {directPdfUrl ? (
          <div className="pt-3 border-t border-[#E5D7C8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#735334]">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate max-w-md">
                Berkas PDF Storage: <code className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-[#E5D7C8]">{directPdfUrl}</code>
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-[11px] font-bold text-[#8C6A47] hover:underline"
              >
                {copiedLink ? 'URL Storage Tersalin!' : 'Salin URL Berkas Storage'}
              </button>
              <span>•</span>
              <a
                href={directPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-[#8C6A47] hover:underline"
              >
                Lihat File Asli
              </a>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Belum ada dokumen PDF yang diunggah. Unggah dokumen PDF di bawah agar halaman resmi dapat menampilkan surat persidangan.
            </span>
          </div>
        )}
      </div>

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

          {/* State 1: Sedang Mengonversi PDF ke JPG */}
          {converting && (
            <div className="bg-[#FAF7F3] border-2 border-dashed border-[#8C6A47] rounded-2xl p-8 text-center space-y-3 animate-pulse">
              <RefreshCw className="w-8 h-8 animate-spin text-[#8C6A47] mx-auto" />
              <div className="space-y-1">
                <h4 className="font-serif font-bold text-base text-[#422F21]">
                  {convertingStatus || 'Sedang Memproses PDF Menjadi Gambar...'}
                </h4>
                <p className="text-xs text-[#735334]">
                  Setiap halaman dokumen sedang dikonversi ke gambar beresolusi tinggi agar langsung tampil di semua HP dan desktop.
                </p>
              </div>
            </div>
          )}

          {/* State 2: Gambar JPG Tersedia */}
          {!converting && persidangan.jpg_urls && persidangan.jpg_urls.length > 0 && (
            <div className="space-y-4">
              <div className="bg-[#FAF7F3] border-2 border-[#D5C4B4] rounded-2xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D49B5B]" />
                  <span className="text-xs font-bold text-[#422F21]">
                    Pratinjau Hasil Gambar ({persidangan.jpg_urls.length} Halaman)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Universal di Seluruh HP &amp; Desktop
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleRetryConvert}
                  disabled={converting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#D5C4B4] text-xs font-bold text-[#735334] hover:bg-[#F5E6D3] transition-colors disabled:opacity-50"
                  title="Jalankan ulang konversi halaman dokumen ke berkas gambar"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Konversi Ulang ke Gambar</span>
                </button>
              </div>

              {/* Daftar Gambar Halaman Berurutan */}
              <div className="bg-[#EDE5DB] border-2 border-[#D5C4B4] rounded-2xl p-4 sm:p-6 space-y-5 max-h-[750px] overflow-y-auto shadow-inner">
                {persidangan.jpg_urls.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="relative bg-white rounded-xl shadow-lg border border-[#D5C4B4] overflow-hidden max-w-3xl mx-auto"
                  >
                    <div className="bg-[#FAF7F3] px-3.5 py-1.5 border-b border-[#E5D7C8] flex items-center justify-between text-[11px] font-semibold text-[#735334]">
                      <span>
                        Halaman {idx + 1} dari {persidangan.jpg_urls?.length}
                      </span>
                      <a
                        href={imgUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#8C6A47] hover:underline flex items-center gap-1 text-[11px]"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Buka Gambar Tab Baru
                      </a>
                    </div>
                    <img
                      src={imgUrl}
                      alt={`Halaman ${idx + 1} ${persidangan.judul}`}
                      className="w-full h-auto object-contain select-none block"
                      loading={idx === 0 ? 'eager' : 'lazy'}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* State 3: Ada PDF tapi Belum Dikonversi ke JPG */}
          {!converting && (!persidangan.jpg_urls || persidangan.jpg_urls.length === 0) && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-white border border-amber-200 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif font-bold text-sm sm:text-base text-[#422F21]">
                  Dokumen PDF Belum Dikonversi Menjadi Gambar
                </h4>
                <p className="text-xs text-[#735334] max-w-md mx-auto">
                  Dokumen PDF sudah tersimpan. Klik tombol di bawah untuk menghasilkan gambar JPG agar surat undangan dapat langsung tampil di layar HP peserta tanpa perlu PDF viewer.
                </p>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleRetryConvert}
                  disabled={converting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Konversi PDF ke Gambar Sekarang</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
