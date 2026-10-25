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
        <div className="bg-white rounded-3xl p-5 border-2 border-emerald-300 shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
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
        <div className="bg-white rounded-3xl p-6 border-2 border-emerald-400 shadow-md space-y-4 animate-in fade-in">
          <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-serif font-black text-base text-emerald-950">
                Laporan Hasil Impor Data Excel
              </h3>
              <p className="text-xs text-emerald-700 font-bold">
                {activeTab === 'TAMU'
                  ? `Berhasil import ${uploadResult.success} data tamu undangan.`
                  : `Berhasil import ${uploadResult.success} data peserta santri.`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="p-3 rounded-2xl bg-[#FAF7F3] border border-[#D5C4B4]">
              <span className="text-stone-500 font-bold block text-[10px] uppercase">Total Data</span>
              <span className="font-serif font-black text-lg text-[#322116]">{uploadResult.total}</span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300">
              <span className="text-emerald-700 font-bold block text-[10px] uppercase">Berhasil</span>
              <span className="font-serif font-black text-lg text-emerald-800">{uploadResult.success}</span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300">
              <span className="text-amber-700 font-bold block text-[10px] uppercase">Dilewati</span>
              <span className="font-serif font-black text-lg text-amber-800">{uploadResult.skipped}</span>
            </div>
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-300">
              <span className="text-rose-700 font-bold block text-[10px] uppercase">Gagal</span>
              <span className="font-serif font-black text-lg text-rose-800">{uploadResult.failed}</span>
            </div>
          </div>

          {uploadResult.errors.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
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
        <div className="bg-white rounded-3xl p-6 border-2 border-[#E8DFD5] shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-[#8C6A47]" />
              <h3 className="font-serif font-black text-sm text-[#422F21]">
                Pratinjau Data Unggahan (5 Baris Pertama)
              </h3>
            </div>
            <span className="text-[11px] font-bold text-stone-500">
              Total {parsedDataLength} baris terdeteksi
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#E8DFD5]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#FAF7F3] border-b border-[#E8DFD5] text-[#422F21] font-bold">
                <tr>
                  {columnHeaders.map((col) => (
                    <th key={col} className="px-3 py-2.5 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {previewRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF7F3]/60 transition-colors">
                    {columnHeaders.map((col) => (
                      <td key={col} className="px-3 py-2 whitespace-nowrap text-stone-700">
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
