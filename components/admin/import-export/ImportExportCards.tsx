'use client';

import React from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  Database,
  Users,
  X,
  Layers,
} from 'lucide-react';
import { getKategoriLabel } from '@/lib/import-export-helpers';

export function ImportExportCards({
  activeTab,
  setActiveTab,
  selectedKategoriUpload,
  setSelectedKategoriUpload,
  selectedFile,
  parsedDataLength,
  isProcessing,
  progressPercent,
  fileInputRef,
  handleExportDataLive,
  handleResetUpload,
  handleDownloadTemplateSantri,
  handleDownloadTemplateTamu,
  handleFileChange,
  handleExecuteImport,
}: {
  activeTab: 'SANTRI' | 'TAMU';
  setActiveTab: (val: 'SANTRI' | 'TAMU') => void;
  selectedKategoriUpload: string;
  setSelectedKategoriUpload: (val: string) => void;
  selectedFile: File | null;
  parsedDataLength: number;
  isProcessing: boolean;
  progressPercent: number;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleExportDataLive: (tipe: 'SANTRI' | 'TAMU') => void;
  handleResetUpload: () => void;
  handleDownloadTemplateSantri: (kat: 'BIL_GHOIB' | 'BIN_NADZOR' | 'TAMATAN') => void;
  handleDownloadTemplateTamu: (kat: 'ISTIMEWA' | 'KEHORMATAN' | 'UMUM') => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExecuteImport: () => void;
}) {
  return (
    <>
      {/* HEADER SECTION */}
      <div className="bg-[#422F21]/15 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#2D1B0E]/20 text-[#2D1B0E] text-xs font-bold border border-white/40">
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#2D1B0E]" />
            <span>MODUL RESMI IMPORT &amp; EXPORT DATA EXCEL</span>
          </div>
          <h1 className="font-serif font-black text-xl sm:text-2xl text-[#2D1B0E]">
            Import &amp; Export Data Haflah 2027
          </h1>
          <p className="text-xs text-[#2D1B0E] font-medium">
            Kelola format data baku, unggah berkas Excel/CSV, dan sinkronisasi live ke Supabase.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => handleExportDataLive(activeTab)}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-2xl bg-[#8C6A47] hover:bg-[#735334] text-white font-bold text-xs shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <Database className="w-3.5 h-3.5 text-amber-200" />
            <span>Export Data Live (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* TAB PILIHAN ENTITAS: SANTRI ATAU TAMU */}
      <div className="flex items-center space-x-2 border-b border-[#422F21]/20 pb-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab('SANTRI');
            setSelectedKategoriUpload('');
            handleResetUpload();
          }}
          className={`px-5 py-2.5 rounded-2xl font-serif font-bold text-xs sm:text-sm transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'SANTRI'
              ? 'bg-[#8C6A47] text-white shadow-md'
              : 'bg-[#422F21]/10 hover:bg-[#422F21]/20 backdrop-blur-sm text-[#2D1B0E] border border-white/40'
          }`}
        >
          <Users className="w-4 h-4 text-[#2D1B0E]" />
          <span>Peserta Santri (Shohibul Hajat)</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('TAMU');
            setSelectedKategoriUpload('');
            handleResetUpload();
          }}
          className={`px-5 py-2.5 rounded-2xl font-serif font-bold text-xs sm:text-sm transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'TAMU'
              ? 'bg-[#8C6A47] text-white shadow-md'
              : 'bg-[#422F21]/10 hover:bg-[#422F21]/20 backdrop-blur-sm text-[#2D1B0E] border border-white/40'
          }`}
        >
          <Layers className="w-4 h-4 text-[#2D1B0E]" />
          <span>Tamu Undangan (VIP &amp; Masyayikh)</span>
        </button>
      </div>

      {/* 2 KARTU UTAMA: DOWNLOAD TEMPLATE & UPLOAD DATA (SMOKED GLASS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* KARTU 1: DOWNLOAD TEMPLATE PER KATEGORI */}
        <div className="bg-[#422F21]/15 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-3xl p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b border-white/40 pb-3">
            <Download className="w-5 h-5 text-[#2D1B0E]" />
            <h2 className="font-serif font-black text-base text-[#2D1B0E]">
              1. Unduh Template Format Excel
            </h2>
          </div>
          <p className="text-xs text-[#2D1B0E] font-medium leading-relaxed">
            Pilih kategori di bawah untuk mengunduh template resmi. Format telah disederhanakan
            hanya memuat data esensial yang perlu diisi panitia.
          </p>

          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-bold text-[#2D1B0E] uppercase tracking-wider block">
              Pilih Kategori untuk Mengunduh Template ({activeTab === 'SANTRI' ? 'Peserta Santri' : 'Tamu Undangan'}):
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              {activeTab === 'SANTRI' ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplateSantri('BIL_GHOIB')}
                    className="p-3.5 rounded-2xl bg-white/40 hover:bg-white/60 border-2 border-[#422F21]/30 text-center text-xs font-serif font-black text-[#2D1B0E] shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5 backdrop-blur-xs"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[#2D1B0E]" />
                    <span>Bil Ghoib</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplateSantri('BIN_NADZOR')}
                    className="p-3.5 rounded-2xl bg-white/40 hover:bg-white/60 border-2 border-[#422F21]/30 text-center text-xs font-serif font-black text-[#2D1B0E] shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5 backdrop-blur-xs"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[#2D1B0E]" />
                    <span>Bin Nadzor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplateSantri('TAMATAN')}
                    className="p-3.5 rounded-2xl bg-white/40 hover:bg-white/60 border-2 border-[#422F21]/30 text-center text-xs font-serif font-black text-[#2D1B0E] shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5 backdrop-blur-xs"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[#2D1B0E]" />
                    <span>Tamatan</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplateTamu('ISTIMEWA')}
                    className="p-3.5 rounded-2xl bg-white/40 hover:bg-white/60 border-2 border-[#422F21]/30 text-center text-xs font-serif font-black text-[#2D1B0E] shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5 backdrop-blur-xs"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[#2D1B0E]" />
                    <span>Istimewa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplateTamu('KEHORMATAN')}
                    className="p-3.5 rounded-2xl bg-white/40 hover:bg-white/60 border-2 border-[#422F21]/30 text-center text-xs font-serif font-black text-[#2D1B0E] shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5 backdrop-blur-xs"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[#2D1B0E]" />
                    <span>Kehormatan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplateTamu('UMUM')}
                    className="p-3.5 rounded-2xl bg-white/40 hover:bg-white/60 border-2 border-[#422F21]/30 text-center text-xs font-serif font-black text-[#2D1B0E] shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5 backdrop-blur-xs"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[#2D1B0E]" />
                    <span>Umum</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* KARTU 2: UPLOAD & KONFIGURASI IMPORT */}
        <div className="bg-[#422F21]/15 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-3xl p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b border-white/40 pb-3">
            <Upload className="w-5 h-5 text-[#2D1B0E]" />
            <h2 className="font-serif font-black text-base text-[#2D1B0E]">
              2. Unggah Berkas Excel Sesuai Kategori
            </h2>
          </div>

          {/* STEP A: DROPDOWN PILIH KATEGORI WAJIB */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#2D1B0E]">
              Langkah 1 — Pilih Kategori Data <span className="text-rose-600">*</span>:
            </label>
            <select
              value={selectedKategoriUpload}
              onChange={(e) => {
                setSelectedKategoriUpload(e.target.value);
                if (selectedFile) handleResetUpload();
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#422F21]/30 bg-[#422F21]/10 backdrop-blur-xs font-serif font-bold text-xs text-[#2D1B0E] focus:outline-none focus:ring-2 focus:ring-[#422F21]"
            >
              <option value="" className="bg-[#FAF7F3] text-[#2D1B0E]">
                {activeTab === 'SANTRI'
                  ? '-- Pilih Kategori Peserta Santri --'
                  : '-- Pilih Kategori Tamu Undangan --'}
              </option>
              {activeTab === 'SANTRI' ? (
                <>
                  <option value="BIL_GHOIB" className="bg-[#FAF7F3] text-[#2D1B0E]">Bil Ghoib</option>
                  <option value="BIN_NADZOR" className="bg-[#FAF7F3] text-[#2D1B0E]">Bin Nadzor</option>
                  <option value="TAMATAN" className="bg-[#FAF7F3] text-[#2D1B0E]">Tamatan</option>
                </>
              ) : (
                <>
                  <option value="ISTIMEWA" className="bg-[#FAF7F3] text-[#2D1B0E]">Istimewa (VVIP/VIP)</option>
                  <option value="KEHORMATAN" className="bg-[#FAF7F3] text-[#2D1B0E]">Kehormatan</option>
                  <option value="UMUM" className="bg-[#FAF7F3] text-[#2D1B0E]">Umum</option>
                </>
              )}
            </select>
            {!selectedKategoriUpload && (
              <p className="text-[11px] text-[#2D1B0E] font-bold">
                ⚠️ Wajib pilih kategori data di atas sebelum memilih berkas Excel.
              </p>
            )}
          </div>

          {/* STEP B: DROPZONE / FILE SELECTOR (TETAP TRANSPARAN DENGAN BORDER TEGAS) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#2D1B0E]">
              Langkah 2 — Unggah File Excel:
            </label>
            <div
              className={`p-4 rounded-2xl border-2 border-dashed border-[#422F21]/40 text-center space-y-2 transition-all ${
                selectedKategoriUpload
                  ? 'bg-[#422F21]/10 backdrop-blur-xs'
                  : 'bg-[#422F21]/5 backdrop-blur-xs opacity-75'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                disabled={!selectedKategoriUpload}
                className="hidden"
                id="excel-file-input"
              />
              <label
                htmlFor={selectedKategoriUpload ? 'excel-file-input' : undefined}
                className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xs transition-all ${
                  selectedKategoriUpload
                    ? 'bg-white/40 hover:bg-white/60 border border-white/60 text-[#2D1B0E] backdrop-blur-xs cursor-pointer'
                    : 'bg-stone-300/30 border border-stone-300/40 text-stone-500 cursor-not-allowed opacity-60'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-[#2D1B0E]" />
                <span>Pilih Berkas Excel/CSV...</span>
              </label>

              {selectedFile ? (
                <div className="text-xs font-bold text-emerald-950 pt-1">
                  ✓ Berkas terpilih: <strong>{selectedFile.name}</strong> ({parsedDataLength} baris data)
                </div>
              ) : (
                <p className="text-xs text-[#2D1B0E] font-semibold pt-1">
                  {selectedKategoriUpload
                    ? `Silakan unggah format Excel untuk kategori ${getKategoriLabel(selectedKategoriUpload)}`
                    : 'Pilih kategori terlebih dahulu untuk membuka tombol unggah'}
                </p>
              )}
            </div>
          </div>

          {/* ACTION TOMBOL EKSEKUSI (DENGAN DISABLED STATE TEGAS) */}
          <div className="flex items-center space-x-2 pt-2">
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={!selectedKategoriUpload || !selectedFile || parsedDataLength === 0 || isProcessing}
              className="flex-1 py-3 px-4 rounded-2xl bg-emerald-800 hover:bg-emerald-900 disabled:bg-emerald-900 disabled:opacity-80 disabled:cursor-not-allowed text-white font-serif font-black text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-200" />
                  <span>Mengimpor ke Supabase ({progressPercent}%)...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 text-emerald-200" />
                  <span>
                    {selectedKategoriUpload
                      ? `Import Data ${getKategoriLabel(selectedKategoriUpload)} ke Database`
                      : 'Import Data ke Database'}
                  </span>
                </>
              )}
            </button>

            {selectedFile && (
              <button
                type="button"
                onClick={handleResetUpload}
                disabled={isProcessing}
                className="px-3 py-3 rounded-2xl border border-[#422F21]/30 bg-white/30 text-[#2D1B0E] hover:bg-white/50 font-bold text-xs"
                title="Batalkan Pilihan"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
