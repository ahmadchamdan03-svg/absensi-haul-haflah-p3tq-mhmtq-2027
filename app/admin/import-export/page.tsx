'use client';

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import AuthGuard from '@/components/AuthGuard';
import {
  getKategoriLabel,
  downloadTemplateSantriExcel,
  downloadTemplateTamuExcel,
  exportLiveTableToExcel,
  executeBatchImportToSupabase,
} from '@/lib/import-export-helpers';
import { ImportExportCards } from '@/components/admin/import-export/ImportExportCards';
import { ImportExportPreviewResult } from '@/components/admin/import-export/ImportExportPreviewResult';

export default function ImportExportPage() {
  const [activeTab, setActiveTab] = useState<'SANTRI' | 'TAMU'>('SANTRI');

  // State Upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [columnHeaders, setColumnHeaders] = useState<string[]>([]);
  const [selectedKategoriUpload, setSelectedKategoriUpload] = useState<string>('');

  // State Processing & Result
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [uploadResult, setUploadResult] = useState<{
    total: number;
    success: number;
    skipped: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportDataLive = async (tipe: 'SANTRI' | 'TAMU') => {
    setIsProcessing(true);
    try {
      await exportLiveTableToExcel(tipe);
    } catch (err: any) {
      console.error('Error exporting data live:', err);
      alert(`Gagal mengekspor data: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setUploadResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (rawJson.length === 0) {
          alert('File kosong atau format tidak terbaca.');
          return;
        }

        const headers = Object.keys(rawJson[0]);
        setColumnHeaders(headers);
        setParsedData(rawJson);
        setPreviewRows(rawJson.slice(0, 5));
      } catch (err: any) {
        console.error('Error reading excel file:', err);
        alert(`Gagal membaca file: ${err.message || err}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleResetUpload = () => {
    setSelectedFile(null);
    setParsedData([]);
    setPreviewRows([]);
    setColumnHeaders([]);
    setUploadResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExecuteImport = async () => {
    if (!selectedKategoriUpload) {
      alert('Silakan pilih Kategori Data terlebih dahulu sebelum memulai impor.');
      return;
    }

    if (!parsedData || parsedData.length === 0) {
      alert('Tidak ada data dalam berkas yang dapat diimpor.');
      return;
    }

    const catLabel = getKategoriLabel(selectedKategoriUpload);
    const confirmRun = confirm(
      `Mulai impor ${parsedData.length} baris data ${
        activeTab === 'SANTRI' ? 'Peserta Santri' : 'Tamu Undangan'
      } (${catLabel}) ke database Supabase?`
    );
    if (!confirmRun) return;

    setIsProcessing(true);
    setProgressPercent(0);

    const result = await executeBatchImportToSupabase({
      activeTab,
      selectedKategoriUpload,
      parsedData,
      setProgressPercent,
    });

    setUploadResult(result);
    setIsProcessing(false);
  };

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        <ImportExportCards
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedKategoriUpload={selectedKategoriUpload}
          setSelectedKategoriUpload={setSelectedKategoriUpload}
          selectedFile={selectedFile}
          parsedDataLength={parsedData.length}
          isProcessing={isProcessing}
          progressPercent={progressPercent}
          fileInputRef={fileInputRef}
          handleExportDataLive={handleExportDataLive}
          handleResetUpload={handleResetUpload}
          handleDownloadTemplateSantri={downloadTemplateSantriExcel}
          handleDownloadTemplateTamu={downloadTemplateTamuExcel}
          handleFileChange={handleFileChange}
          handleExecuteImport={handleExecuteImport}
        />

        <ImportExportPreviewResult
          isProcessing={isProcessing}
          progressPercent={progressPercent}
          uploadResult={uploadResult}
          activeTab={activeTab}
          previewRows={previewRows}
          parsedDataLength={parsedData.length}
          columnHeaders={columnHeaders}
        />
      </div>
    </AuthGuard>
  );
}
