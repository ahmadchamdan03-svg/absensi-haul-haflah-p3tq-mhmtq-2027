'use client';

import React from 'react';
import { CheckCircle2, Eye } from 'lucide-react';

export function ImportExportPreviewResult({
  isProcessing,
  progressPercent,
  uploadResult,
  activeTab,
  previewRows,
  parsedDataLength,
  columnHeaders,
}: {
  isProcessing: boolean;
  progressPercent: number;
  uploadResult: {
    total: number;
    success: number;
    skipped: number;
    failed: number;
    errors: string[];
  } | null;
  activeTab: 'SANTRI' | 'TAMU';
  previewRows: any[];
  parsedDataLength: number;
  columnHeaders: string[];
}) {
  return (
    <>
      {/* PROGRESS BAR */}
      {isProcessing && (
        <div className="bg-[#FAF7F3]/95 backdrop-blur-md rounded-3xl p-5 border border-emerald-400 shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
            <span>Sedang Memproses Unggahan ke Supabase...</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-emerald-100 overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* LAPORAN HASIL IMPORT */}
      {uploadResult && (
        <div className="bg-[#FAF7F3]/95 backdrop-blur-md rounded-3xl p-6 border border-emerald-500 shadow-md space-y-4 animate-in fade-in">
          <div className="flex items-center space-x-2 border-b border-[#422F21]/15 pb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-serif font-black text-base text-emerald-950">
                Laporan Hasil Impor Data Excel
              </h3>
              <p className="text-xs text-emerald-800 font-bold">
                {activeTab === 'TAMU'
                  ? `Berhasil import ${uploadResult.success} data tamu undangan.`
                  : `Berhasil import ${uploadResult.success} data peserta santri.`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="p-3 rounded-2xl bg-white border border-[#422F21]/20 shadow-2xs">
              <span className="text-stone-600 font-bold block text-[10px] uppercase">Total Data</span>
              <span className="font-serif font-black text-lg text-[#1A110B]">{uploadResult.total}</span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 shadow-2xs">
              <span className="text-emerald-800 font-bold block text-[10px] uppercase">Berhasil</span>
              <span className="font-serif font-black text-lg text-emerald-900">{uploadResult.success}</span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 shadow-2xs">
              <span className="text-amber-800 font-bold block text-[10px] uppercase">Dilewati</span>
              <span className="font-serif font-black text-lg text-amber-900">{uploadResult.skipped}</span>
            </div>
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-300 shadow-2xs">
              <span className="text-rose-800 font-bold block text-[10px] uppercase">Gagal</span>
              <span className="font-serif font-black text-lg text-rose-900">{uploadResult.failed}</span>
            </div>
          </div>

          {uploadResult.errors.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
              <span className="font-bold block">Detail Kesalahan (Maks 10 baris):</span>
              <ul className="list-disc list-inside space-y-0.5 font-mono text-[11px]">
                {uploadResult.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* PREVIEW 5 BARIS PERTAMA */}
      {previewRows.length > 0 && (
        <div className="bg-[#FAF7F3]/95 backdrop-blur-md border border-[#422F21]/20 shadow-md rounded-3xl p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-[#422F21]/15 pb-3">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-[#1A110B]" />
              <h3 className="font-serif font-black text-sm text-[#1A110B]">
                Pratinjau Data Unggahan (5 Baris Pertama)
              </h3>
            </div>
            <span className="text-[11px] font-bold text-[#1A110B]">
              Total {parsedDataLength} baris terdeteksi
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#422F21]/20 bg-white">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#FAF7F3] border-b border-[#422F21]/20 text-[#1A110B] font-bold">
                <tr>
                  {columnHeaders.map((col) => (
                    <th key={col} className="px-3 py-2.5 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#422F21]/10">
                {previewRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF7F3]/80 transition-colors">
                    {columnHeaders.map((col) => (
                      <td key={col} className="px-3 py-2 whitespace-nowrap text-[#1A110B] font-medium">
                        {String(row[col] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
