'use client';

import React from 'react';
import {
  UserPlus,
  FileSpreadsheet,
  Send,
  Edit2,
  X,
} from 'lucide-react';
import { Persidangan, PersidanganPeserta } from '@/lib/persidangan';
import { ExcelRowItem } from './types';

interface PersidanganModalsProps {
  persidangan: Persidangan;
  // Modal 1: Add
  showAddModal: boolean;
  onCloseAddModal: () => void;
  onAddSubmit: (e: React.FormEvent) => void;
  // Modal 2: Edit
  editingPeserta: PersidanganPeserta | null;
  onCloseEditModal: () => void;
  onEditSubmit: (e: React.FormEvent) => void;
  // Shared Add/Edit Form State
  inputNama: string;
  onInputNamaChange: (val: string) => void;
  inputNoWa: string;
  onInputNoWaChange: (val: string) => void;
  formSubmitting: boolean;
  // Modal 3: Import Excel
  showImportModal: boolean;
  onCloseImportModal: () => void;
  excelInputRef: React.RefObject<HTMLInputElement>;
  onExcelFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  excelFileName: string;
  excelPreviewData: ExcelRowItem[];
  excelAllData: ExcelRowItem[];
  skipDuplicates: boolean;
  onSkipDuplicatesChange: (val: boolean) => void;
  importing: boolean;
  onImportSubmit: () => void;
  // Modal 4: Confirm Send WA
  confirmSendTarget: PersidanganPeserta | null;
  onCloseConfirmSend: () => void;
  onExecuteSendWa: (peserta: PersidanganPeserta) => void;
}

export default function PersidanganModals({
  persidangan,
  showAddModal,
  onCloseAddModal,
  onAddSubmit,
  editingPeserta,
  onCloseEditModal,
  onEditSubmit,
  inputNama,
  onInputNamaChange,
  inputNoWa,
  onInputNoWaChange,
  formSubmitting,
  showImportModal,
  onCloseImportModal,
  excelInputRef,
  onExcelFileChange,
  excelFileName,
  excelPreviewData,
  excelAllData,
  skipDuplicates,
  onSkipDuplicatesChange,
  importing,
  onImportSubmit,
  confirmSendTarget,
  onCloseConfirmSend,
  onExecuteSendWa,
}: PersidanganModalsProps) {
  return (
    <>
      {/* ========================================================================= */}
      {/* MODAL 1: TAMBAH PESERTA MANUAL (TANPA KATEGORI)                           */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={onCloseAddModal}
        >
          <div
            className="bg-[#FAF7F3] border-2 border-[#D5C4B4] rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E5D7C8] pb-3">
              <h3 className="font-serif font-bold text-base text-[#422F21] flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#8C6A47]" />
                Tambah Peserta Baru
              </h3>
              <button
                type="button"
                onClick={onCloseAddModal}
                className="p-1 text-[#735334] hover:text-[#422F21]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={onAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#735334] mb-1">
                  Nama Penerima <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={inputNama}
                  onChange={(e) => onInputNamaChange(e.target.value)}
                  placeholder="Contoh: Gus Ahmad Faqih"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs text-[#422F21] focus:outline-none focus:ring-2 focus:ring-[#8C6A47]/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#735334] mb-1">
                  Nomor WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={inputNoWa}
                  onChange={(e) => onInputNoWaChange(e.target.value)}
                  placeholder="Contoh: 08123456789 atau 628123456789"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs text-[#422F21] focus:outline-none focus:ring-2 focus:ring-[#8C6A47]/40 font-mono"
                />
                <span className="text-[10px] text-[#A89887] block mt-1">
                  Format akan otomatis dinormalisasi ke format internasional (628...).
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5D7C8]">
                <button
                  type="button"
                  onClick={onCloseAddModal}
                  className="px-4 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs font-bold text-[#735334] hover:bg-[#FAF7F3]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white text-xs font-bold disabled:opacity-50"
                >
                  {formSubmitting ? 'Menyimpan...' : 'Tambah Saja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT PESERTA (TANPA KATEGORI)                                    */}
      {/* ========================================================================= */}
      {editingPeserta && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={onCloseEditModal}
        >
          <div
            className="bg-[#FAF7F3] border-2 border-[#D5C4B4] rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E5D7C8] pb-3">
              <h3 className="font-serif font-bold text-base text-[#422F21] flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#8C6A47]" />
                Edit Data Peserta
              </h3>
              <button
                type="button"
                onClick={onCloseEditModal}
                className="p-1 text-[#735334] hover:text-[#422F21]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={onEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#735334] mb-1">
                  Nama Penerima <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={inputNama}
                  onChange={(e) => onInputNamaChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs text-[#422F21] focus:outline-none focus:ring-2 focus:ring-[#8C6A47]/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#735334] mb-1">
                  Nomor WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={inputNoWa}
                  onChange={(e) => onInputNoWaChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs text-[#422F21] focus:outline-none focus:ring-2 focus:ring-[#8C6A47]/40 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5D7C8]">
                <button
                  type="button"
                  onClick={onCloseEditModal}
                  className="px-4 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs font-bold text-[#735334] hover:bg-[#FAF7F3]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white text-xs font-bold disabled:opacity-50"
                >
                  {formSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: IMPORT EXCEL                                                     */}
      {/* ========================================================================= */}
      {showImportModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={onCloseImportModal}
        >
          <div
            className="bg-[#FAF7F3] border-2 border-[#D5C4B4] rounded-2xl p-6 w-full max-w-lg shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E5D7C8] pb-3">
              <h3 className="font-serif font-bold text-base text-[#422F21] flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                Import Peserta via Excel (.xlsx)
              </h3>
              <button
                type="button"
                onClick={onCloseImportModal}
                className="p-1 text-[#735334] hover:text-[#422F21]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-white border border-[#D5C4B4] text-xs text-[#735334] space-y-1">
                <div className="font-bold text-[#422F21]">Format Kolom Excel:</div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li>
                    Kolom A: <strong>Nama Penerima</strong>
                  </li>
                  <li>
                    Kolom B: <strong>Nomor WhatsApp</strong> (contoh: 08123456789)
                  </li>
                </ul>
              </div>

              <div>
                <input
                  ref={excelInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={onExcelFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => excelInputRef.current?.click()}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-[#8C6A47] bg-white hover:bg-[#F5E6D3]/40 text-xs font-bold text-[#8C6A47] flex items-center justify-center gap-2 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  {excelFileName ? `Ganti Berkas (${excelFileName})` : 'Pilih Berkas Excel (.xlsx)'}
                </button>
              </div>

              {/* Preview 5 Baris Pertama */}
              {excelPreviewData.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#422F21] flex items-center justify-between">
                    <span>Pratinjau Data (5 dari {excelAllData.length} baris):</span>
                    <span className="text-[11px] text-[#8C6A47]">
                      Total {excelAllData.length} peserta terdeteksi
                    </span>
                  </div>

                  <div className="border border-[#D5C4B4] rounded-xl overflow-hidden bg-white max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-[#FAF7F3] text-[#735334] font-bold border-b border-[#D5C4B4]">
                        <tr>
                          <th className="p-2 w-8">No</th>
                          <th className="p-2">Nama</th>
                          <th className="p-2">No WA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EFE8E1]">
                        {excelPreviewData.map((row, idx) => (
                          <tr key={idx}>
                            <td className="p-2 text-center text-[#735334]">{idx + 1}</td>
                            <td className="p-2 font-medium">{row.nama}</td>
                            <td className="p-2 font-mono text-[#735334]">{row.no_wa}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-[#735334] cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={skipDuplicates}
                      onChange={(e) => onSkipDuplicatesChange(e.target.checked)}
                      className="rounded text-[#8C6A47] focus:ring-[#8C6A47]"
                    />
                    <span>Lewati jika nomor WA sudah ada di daftar persidangan ini</span>
                  </label>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5D7C8]">
              <button
                type="button"
                onClick={onCloseImportModal}
                className="px-4 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs font-bold text-[#735334] hover:bg-[#FAF7F3]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={onImportSubmit}
                disabled={excelAllData.length === 0 || importing}
                className="px-5 py-2 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white text-xs font-bold disabled:opacity-50"
              >
                {importing
                  ? 'Mengimpor...'
                  : `Impor ${excelAllData.length > 0 ? excelAllData.length : ''} Peserta`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: KONFIRMASI KIRIM WA PER BARIS                                     */}
      {/* ========================================================================= */}
      {confirmSendTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={onCloseConfirmSend}
        >
          <div
            className="bg-[#FAF7F3] border-2 border-[#D5C4B4] rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E5D7C8] pb-3">
              <h3 className="font-serif font-bold text-base text-[#422F21] flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                Konfirmasi Kirim WhatsApp
              </h3>
              <button
                type="button"
                onClick={onCloseConfirmSend}
                className="p-1 text-[#735334] hover:text-[#422F21]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#735334]">
              <p>
                Kirim surat undangan digital persidangan ke penerima berikut?
              </p>

              <div className="p-3.5 rounded-xl bg-white border border-[#D5C4B4] space-y-1.5">
                <div>
                  <span className="text-[#A89887] text-[10px] uppercase font-bold block">
                    Nama Penerima
                  </span>
                  <strong className="text-sm text-[#422F21]">{confirmSendTarget.nama}</strong>
                </div>
                <div>
                  <span className="text-[#A89887] text-[10px] uppercase font-bold block">
                    Nomor WhatsApp
                  </span>
                  <span className="font-mono text-xs text-[#422F21]">{confirmSendTarget.no_wa}</span>
                </div>
                <div>
                  <span className="text-[#A89887] text-[10px] uppercase font-bold block">
                    Persidangan
                  </span>
                  <span className="text-xs text-[#8C6A47] font-semibold">{persidangan.judul}</span>
                </div>
              </div>

              <p className="text-[11px] text-[#8C6A47]">
                Pesan akan dikirim langsung via gateway WhatsApp Fonnte bersama tautan dokumen PDF resmi.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5D7C8]">
              <button
                type="button"
                onClick={onCloseConfirmSend}
                className="px-4 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs font-bold text-[#735334] hover:bg-[#FAF7F3]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => onExecuteSendWa(confirmSendTarget)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                Ya, Kirim Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
