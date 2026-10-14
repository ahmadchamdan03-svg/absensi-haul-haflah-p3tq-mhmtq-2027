'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  RefreshCw,
  Eye,
  ArrowRight,
  Database,
  Filter,
  Users,
  Check,
  X,
  FileText,
  Layers,
} from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/audit-log';

export default function ImportExportPage() {
  const [activeTab, setActiveTab] = useState<'SANTRI' | 'TAMU'>('SANTRI');

  // State Upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [columnHeaders, setColumnHeaders] = useState<string[]>([]);
  const [uploadMode, setUploadMode] = useState<'SKIP' | 'UPDATE'>('SKIP');
  const [filterKategoriUpload, setFilterKategoriUpload] = useState<string>('ALL');

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

  // ---------------------------------------------------------------------------
  // 1. DOWNLOAD TEMPLATE EXCEL (PESERTA SANTRI & TAMU UNDANGAN)
  // ---------------------------------------------------------------------------
  const handleDownloadTemplateSantri = (filterKat?: string) => {
    const headers = [
      'kode',
      'nama',
      'nama_wali',
      'alamat',
      'no_hp',
      'kategori_utama',
      'sub_kategori',
      'kelas',
      'kamar',
      'kuota_dasar',
      'kuota_tambahan',
      'warna_tiket',
      'jalur_masuk',
    ];

    let sampleRows: any[] = [];
    if (!filterKat || filterKat === 'ALL') {
      sampleRows = [
        [
          'SH0001',
          'AHMAD FAUZI',
          'H. MAHMUDI',
          'Kediri',
          '081234567890',
          'BIL_GHOIB',
          'Bil Ghoib 30 Juz',
          '3 Aliyah',
          'Kamar Al-Falah 02',
          4,
          0,
          'Hitam Gold',
          'Gerbang Selatan (Bola Dunia)',
        ],
        [
          'SH0002',
          'MUHAMMAD ZAINAL',
          'H. ABDULLAH',
          'Nganjuk',
          '081298765432',
          'BIN_NADZOR',
          'Bin Nadzor',
          '2 Tsanawiyah',
          'Kamar An-Nur 05',
          2,
          0,
          'Merah Gold',
          'Gerbang Selatan (Bola Dunia)',
        ],
        [
          'SH0003',
          'ZULFA RAHMAWATI',
          'K.H. IMRON',
          'Jombang',
          '085612345678',
          'TAMATAN',
          'Tamatan Alfiyah',
          '3 Aliyah',
          'Kamar Fatimah 01',
          2,
          0,
          'Merah Gold',
          'Gerbang Selatan (Bola Dunia)',
        ],
      ];
    } else if (filterKat === 'BIL_GHOIB') {
      sampleRows = [
        [
          'SH0101',
          'CONTOH SANTRI BIL GHOIB',
          'NAMA WALI',
          'Kediri',
          '081234567890',
          'BIL_GHOIB',
          'Bil Ghoib 30 Juz',
          '3 Aliyah',
          'Kamar 01',
          4,
          0,
          'Hitam Gold',
          'Gerbang Selatan (Bola Dunia)',
        ],
      ];
    } else if (filterKat === 'BIN_NADZOR') {
      sampleRows = [
        [
          'SH0201',
          'CONTOH SANTRI BIN NADZOR',
          'NAMA WALI',
          'Blitar',
          '081234567891',
          'BIN_NADZOR',
          'Bin Nadzor',
          '2 Tsanawiyah',
          'Kamar 02',
          2,
          0,
          'Merah Gold',
          'Gerbang Selatan (Bola Dunia)',
        ],
      ];
    } else if (filterKat === 'TAMATAN') {
      sampleRows = [
        [
          'SH0301',
          'CONTOH SANTRI TAMATAN',
          'NAMA WALI',
          'Tulungagung',
          '081234567892',
          'TAMATAN',
          'Tamatan Al-Miftah',
          '3 Aliyah',
          'Kamar 03',
          2,
          0,
          'Merah Gold',
          'Gerbang Selatan (Bola Dunia)',
        ],
      ];
    }

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Peserta Santri');
    const fileName = filterKat && filterKat !== 'ALL'
      ? `Template_Peserta_Santri_${filterKat}.xlsx`
      : 'Template_Format_Peserta_Santri.xlsx';
    XLSX.writeFile(wb, fileName);
  };

  const handleDownloadTemplateTamu = (filterKat?: string) => {
    const headers = [
      'kode',
      'nama',
      'nama_putra',
      'nama_putri',
      'instansi',
      'alamat',
      'no_hp',
      'kategori',
      'sub_kategori',
      'warna_tiket',
      'jalur_masuk',
    ];

    let sampleRows: any[] = [];
    if (!filterKat || filterKat === 'ALL') {
      sampleRows = [
        [
          'UND0001',
          'KH. ANWAR MANSUR & IBU NYAI',
          'KH. ANWAR MANSUR',
          'IBU NYAI HJ. MAHMUDAH',
          'Pon. Pes. Lirboyo Kediri',
          'Kediri',
          '081234567890',
          'VVIP',
          'ISTIMEWA',
          'Hitam Gold',
          'Jalur VIP (Pintu Utama)',
        ],
        [
          'UND0002',
          'BAPAK H. BAMBANG IRAWAN',
          'BAPAK H. BAMBANG IRAWAN',
          '',
          'Kemenag Kab. Kediri',
          'Kediri',
          '081345678901',
          'Tamu Kehormatan',
          'KEHORMATAN',
          'Merah Gold',
          'Jalur VIP',
        ],
        [
          'UND0003',
          'AL-USTADZ ZAINUDDIN',
          'AL-USTADZ ZAINUDDIN',
          '',
          'Asatidz MHMTQ Sekalian',
          'Kediri',
          '085712345678',
          'Umum',
          'UMUM',
          'Merah Gold',
          'Gerbang Timur',
        ],
      ];
    } else if (filterKat === 'ISTIMEWA') {
      sampleRows = [
        [
          'UND0101',
          'CONTOH TAMU ISTIMEWA',
          'NAMA PUTRA',
          'NAMA PUTRI',
          'Instansi / Pesantren',
          'Kediri',
          '081234567890',
          'VVIP',
          'ISTIMEWA',
          'Hitam Gold',
          'Jalur VIP (Pintu Utama)',
        ],
      ];
    } else if (filterKat === 'KEHORMATAN') {
      sampleRows = [
        [
          'UND0201',
          'CONTOH TAMU KEHORMATAN',
          'NAMA TAMU',
          '',
          'Instansi Pemerintahan',
          'Kediri',
          '081234567891',
          'Tamu Kehormatan',
          'KEHORMATAN',
          'Merah Gold',
          'Jalur VIP',
        ],
      ];
    } else if (filterKat === 'UMUM') {
      sampleRows = [
        [
          'UND0301',
          'CONTOH TAMU UMUM',
          'NAMA TAMU',
          '',
          'Alumni / Asatidz',
          'Kediri',
          '081234567892',
          'Umum',
          'UMUM',
          'Merah Gold',
          'Gerbang Timur',
        ],
      ];
    }

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Tamu Undangan');
    const fileName = filterKat && filterKat !== 'ALL'
      ? `Template_Tamu_Undangan_${filterKat}.xlsx`
      : 'Template_Format_Tamu_Undangan.xlsx';
    XLSX.writeFile(wb, fileName);
  };

  // ---------------------------------------------------------------------------
  // 2. EXPORT LIVE DATA DARI DATABASE SUPABASE
  // ---------------------------------------------------------------------------
  const handleExportDataLive = async (tipe: 'SANTRI' | 'TAMU') => {
    setIsProcessing(true);
    try {
      if (tipe === 'SANTRI') {
        const { data, error } = await supabase
          .from('peserta_santri')
          .select('*')
          .order('kode', { ascending: true });

        if (error) throw error;
        if (!data || data.length === 0) {
          alert('Tidak ada data peserta santri untuk diekspor.');
          return;
        }

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Peserta Santri');
        XLSX.writeFile(wb, `Data_Peserta_Santri_Live_${new Date().toISOString().split('T')[0]}.xlsx`);
      } else {
        const { data, error } = await supabase
          .from('tamu_undangan')
          .select('*')
          .order('kode', { ascending: true });

        if (error) throw error;
        if (!data || data.length === 0) {
          alert('Tidak ada data tamu undangan untuk diekspor.');
          return;
        }

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Tamu Undangan');
        XLSX.writeFile(wb, `Data_Tamu_Undangan_Live_${new Date().toISOString().split('T')[0]}.xlsx`);
      }
    } catch (err: any) {
      console.error('Error exporting data live:', err);
      alert(`Gagal mengekspor data: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 3. READ & PREVIEW FILE EXCEL
  // ---------------------------------------------------------------------------
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

  // Reset form upload
  const handleResetUpload = () => {
    setSelectedFile(null);
    setParsedData([]);
    setPreviewRows([]);
    setColumnHeaders([]);
    setUploadResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ---------------------------------------------------------------------------
  // 4. EKSEKUSI PROSES IMPORT KE SUPABASE (SKIP VS UPDATE)
  // ---------------------------------------------------------------------------
  const handleExecuteImport = async () => {
    if (!parsedData || parsedData.length === 0) {
      alert('Tidak ada data untuk diimpor.');
      return;
    }

    // Filter baris berdasar kategori jika dipilih
    let rowsToImport = [...parsedData];
    if (filterKategoriUpload !== 'ALL') {
      if (activeTab === 'SANTRI') {
        rowsToImport = rowsToImport.filter((r) => {
          const cat = `${r.kategori_utama || ''} ${r.sub_kategori || ''}`.toUpperCase();
          if (filterKategoriUpload === 'BIL_GHOIB') return cat.includes('GHOIB');
          if (filterKategoriUpload === 'BIN_NADZOR') return cat.includes('NADZOR');
          if (filterKategoriUpload === 'TAMATAN') return cat.includes('TAMATAN');
          return true;
        });
      } else {
        rowsToImport = rowsToImport.filter((r) => {
          const sub = String(r.sub_kategori || r.golongan || '').toUpperCase();
          return sub.includes(filterKategoriUpload);
        });
      }
    }

    if (rowsToImport.length === 0) {
      alert(`Tidak ada baris yang cocok dengan filter kategori: ${filterKategoriUpload}`);
      return;
    }

    const confirmRun = confirm(
      `Mulai impor ${rowsToImport.length} data ${activeTab === 'SANTRI' ? 'Peserta Santri' : 'Tamu Undangan'}?\nMode: ${uploadMode === 'SKIP' ? 'LEWATI yang sudah ada (SKIP)' : 'PERBARUI data jika ada (UPDATE/UPSERT)'}`
    );
    if (!confirmRun) return;

    setIsProcessing(true);
    setProgressPercent(0);

    const targetTable = activeTab === 'SANTRI' ? 'peserta_santri' : 'tamu_undangan';
    let successCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const errorLogs: string[] = [];

    // Ambil data existing untuk cek SKIP vs UPDATE
    const { data: existingRecords } = await supabase
      .from(targetTable)
      .select('kode');

    const existingKodeSet = new Set((existingRecords || []).map((item: any) => String(item.kode).toUpperCase().trim()));

    const totalRows = rowsToImport.length;

    for (let i = 0; i < totalRows; i++) {
      const row = rowsToImport[i];
      const kode = String(row.kode || '').toUpperCase().trim();

      if (!kode) {
        failedCount++;
        errorLogs.push(`Baris #${i + 1}: Kode kosong.`);
        continue;
      }

      const isExist = existingKodeSet.has(kode);

      if (isExist && uploadMode === 'SKIP') {
        skippedCount++;
        continue;
      }

      try {
        if (activeTab === 'SANTRI') {
          const payload = {
            kode,
            nama: String(row.nama || '').trim().toUpperCase(),
            nama_wali: String(row.nama_wali || '-').trim(),
            alamat: String(row.alamat || 'Kediri').trim(),
            no_hp: String(row.no_hp || '-').trim(),
            kategori_utama: String(row.kategori_utama || 'BIL_GHOIB').trim().toUpperCase(),
            sub_kategori: String(row.sub_kategori || 'Bil Ghoib').trim(),
            kelas: String(row.kelas || '-').trim(),
            kamar: String(row.kamar || '-').trim(),
            kuota_dasar: Number(row.kuota_dasar || (String(row.kategori_utama).toUpperCase().includes('GHOIB') ? 4 : 2)),
            kuota_tambahan: Number(row.kuota_tambahan || 0),
            warna_tiket: String(row.warna_tiket || (String(row.kategori_utama).toUpperCase().includes('GHOIB') ? 'Hitam Gold' : 'Merah Gold')),
            jalur_masuk: String(row.jalur_masuk || 'Gerbang Selatan (Bola Dunia)'),
            updated_at: new Date().toISOString(),
          };

          const { error } = await supabase
            .from('peserta_santri')
            .upsert(payload, { onConflict: 'kode' });

          if (error) throw error;
          successCount++;
          existingKodeSet.add(kode);
        } else {
          // TAMU UNDANGAN
          const p = String(row.nama_putra || '').trim();
          const w = String(row.nama_putri || '').trim();
          let finalNama = String(row.nama || '').trim();
          if (!finalNama && (p || w)) {
            finalNama = p && w ? `${p} & ${w}` : p || w;
          }

          const payload = {
            kode,
            nama: finalNama || 'Tamu Undangan',
            nama_putra: p || null,
            nama_putri: w || null,
            instansi: String(row.instansi || '-').trim(),
            alamat: String(row.alamat || '-').trim(),
            no_hp: String(row.no_hp || '-').trim(),
            kategori: String(row.kategori || 'Tamu Undangan').trim(),
            sub_kategori: String(row.sub_kategori || 'ISTIMEWA').trim().toUpperCase(),
            warna_tiket: String(row.warna_tiket || 'Merah Gold'),
            jalur_masuk: String(row.jalur_masuk || 'Jalur VIP'),
            updated_at: new Date().toISOString(),
          };

          const { error } = await supabase
            .from('tamu_undangan')
            .upsert(payload, { onConflict: 'kode' });

          if (error) throw error;
          successCount++;
          existingKodeSet.add(kode);
        }
      } catch (err: any) {
        failedCount++;
        errorLogs.push(`Kode ${kode}: ${err.message || err}`);
      }

      // Update progress
      const percent = Math.round(((i + 1) / totalRows) * 100);
      setProgressPercent(percent);
    }

    // Catat Audit Log
    await logAudit({
      panitia_id: 'PANITIA_ADMIN',
      panitia_role: 'ADMIN',
      aksi: 'IMPORT_EXCEL',
      tabel: targetTable,
      kode: 'EXCEL_BATCH',
      nama: `Batch Import ${activeTab}`,
      field: 'bulk_import',
      nilai_lama: `Mode: ${uploadMode}`,
      nilai_baru: `Berhasil: ${successCount}, Dilewati: ${skippedCount}, Gagal: ${failedCount}`,
      catatan: `Import data excel ${activeTab} (${rowsToImport.length} baris)`,
    });

    setUploadResult({
      total: totalRows,
      success: successCount,
      skipped: skippedCount,
      failed: failedCount,
      errors: errorLogs.slice(0, 10),
    });

    setIsProcessing(false);
  };

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* HEADER SECTION */}
        <div className="bg-white rounded-3xl p-6 border-2 border-[#D5C4B4] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FAF0E6] text-[#8C6A47] text-xs font-bold border border-[#D5C4B4]">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>MODUL RESMI IMPORT &amp; EXPORT DATA EXCEL</span>
            </div>
            <h1 className="font-serif font-black text-xl sm:text-2xl text-[#322116]">
              Import &amp; Export Data Haflah 2027
            </h1>
            <p className="text-xs text-[#7A624E]">
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
        <div className="flex items-center space-x-2 border-b border-[#E8DFD5] pb-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('SANTRI');
              handleResetUpload();
            }}
            className={`px-5 py-2.5 rounded-2xl font-serif font-bold text-xs sm:text-sm transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'SANTRI'
                ? 'bg-[#8C6A47] text-white shadow-md'
                : 'bg-white text-stone-600 hover:bg-[#FAF7F3] border border-[#D5C4B4]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Peserta Santri (Shohibul Hajat)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('TAMU');
              handleResetUpload();
            }}
            className={`px-5 py-2.5 rounded-2xl font-serif font-bold text-xs sm:text-sm transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'TAMU'
                ? 'bg-[#8C6A47] text-white shadow-md'
                : 'bg-white text-stone-600 hover:bg-[#FAF7F3] border border-[#D5C4B4]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Tamu Undangan (VIP &amp; Masyayikh)</span>
          </button>
        </div>

        {/* 4 TOMBOL UTAMA & KARTU KATEGORI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* KARTU 1: DOWNLOAD TEMPLATE & FORMAT STANDAR */}
          <div className="bg-white rounded-3xl p-6 border-2 border-[#E8DFD5] shadow-xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
              <Download className="w-5 h-5 text-[#8C6A47]" />
              <h2 className="font-serif font-black text-base text-[#422F21]">
                1. Unduh Template Format Excel
              </h2>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Unduh format resmi yang telah disesuaikan dengan struktur tabel database{' '}
              <strong>{activeTab === 'SANTRI' ? 'peserta_santri' : 'tamu_undangan'}</strong>. Format ini
              berisi kolom baku dan contoh data siap isi.
            </p>

            <button
              type="button"
              onClick={() =>
                activeTab === 'SANTRI'
                  ? handleDownloadTemplateSantri()
                  : handleDownloadTemplateTamu()
              }
              className="w-full py-3 px-4 rounded-2xl bg-[#FAF0E6] hover:bg-[#EFE8E1] text-[#5C3E28] border-2 border-[#D5C4B4] font-bold text-xs shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#8C6A47]" />
              <span>
                Unduh Format Lengkap {activeTab === 'SANTRI' ? 'Peserta Santri' : 'Tamu Undangan'} (.xlsx)
              </span>
            </button>

            {/* KARTU TEMPLATE PER KATEGORI (FIX 13) */}
            <div className="pt-2 border-t border-stone-100 space-y-2">
              <span className="text-[11px] font-bold text-[#8C6A47] uppercase tracking-wider block">
                Unduh Format Terfilter Per Kategori:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {activeTab === 'SANTRI' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplateSantri('BIL_GHOIB')}
                      className="p-2.5 rounded-xl bg-[#FAF7F3] hover:bg-stone-100 border border-[#D5C4B4] text-center text-xs font-bold text-[#422F21] transition-all cursor-pointer"
                    >
                      Bil Ghoib
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplateSantri('BIN_NADZOR')}
                      className="p-2.5 rounded-xl bg-[#FAF7F3] hover:bg-stone-100 border border-[#D5C4B4] text-center text-xs font-bold text-[#422F21] transition-all cursor-pointer"
                    >
                      Bin Nadzor
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplateSantri('TAMATAN')}
                      className="p-2.5 rounded-xl bg-[#FAF7F3] hover:bg-stone-100 border border-[#D5C4B4] text-center text-xs font-bold text-[#422F21] transition-all cursor-pointer"
                    >
                      Tamatan
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplateTamu('ISTIMEWA')}
                      className="p-2.5 rounded-xl bg-[#FAF7F3] hover:bg-stone-100 border border-[#D5C4B4] text-center text-xs font-bold text-[#422F21] transition-all cursor-pointer"
                    >
                      Istimewa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplateTamu('KEHORMATAN')}
                      className="p-2.5 rounded-xl bg-[#FAF7F3] hover:bg-stone-100 border border-[#D5C4B4] text-center text-xs font-bold text-[#422F21] transition-all cursor-pointer"
                    >
                      Kehormatan
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplateTamu('UMUM')}
                      className="p-2.5 rounded-xl bg-[#FAF7F3] hover:bg-stone-100 border border-[#D5C4B4] text-center text-xs font-bold text-[#422F21] transition-all cursor-pointer"
                    >
                      Umum
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* KARTU 2: UPLOAD & KONFIGURASI IMPORT */}
          <div className="bg-white rounded-3xl p-6 border-2 border-[#E8DFD5] shadow-xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
              <Upload className="w-5 h-5 text-[#8C6A47]" />
              <h2 className="font-serif font-black text-base text-[#422F21]">
                2. Unggah Berkas Excel / CSV
              </h2>
            </div>

            {/* DROPZONE / FILE SELECTOR */}
            <div className="p-4 rounded-2xl bg-[#FAF7F3] border-2 border-dashed border-[#D5C4B4] text-center space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="excel-file-input"
              />
              <label
                htmlFor="excel-file-input"
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-white border border-[#D5C4B4] text-xs font-bold text-[#5C3E28] hover:bg-stone-100 cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#8C6A47]" />
                <span>Pilih Berkas Excel/CSV...</span>
              </label>

              {selectedFile ? (
                <div className="text-xs font-bold text-emerald-800 pt-1">
                  ✓ Berkas terpilih: <strong>{selectedFile.name}</strong> ({parsedData.length} baris data)
                </div>
              ) : (
                <p className="text-[11px] text-stone-500">
                  Dukung format .xlsx, .xls, atau .csv (maksimal 10MB)
                </p>
              )}
            </div>

            {/* PILIHAN MODE & FILTER KATEGORI UPLOAD */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-[#422F21] mb-1">Mode Duplikasi Kode:</label>
                <select
                  value={uploadMode}
                  onChange={(e) => setUploadMode(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white font-medium"
                >
                  <option value="SKIP">Lewati yang sudah ada (SKIP)</option>
                  <option value="UPDATE">Perbarui data yang ada (UPDATE)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#422F21] mb-1">Filter Baris Kategori:</label>
                <select
                  value={filterKategoriUpload}
                  onChange={(e) => setFilterKategoriUpload(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white font-medium"
                >
                  <option value="ALL">Semua Baris dalam File</option>
                  {activeTab === 'SANTRI' ? (
                    <>
                      <option value="BIL_GHOIB">Hanya Bil Ghoib</option>
                      <option value="BIN_NADZOR">Hanya Bin Nadzor</option>
                      <option value="TAMATAN">Hanya Tamatan</option>
                    </>
                  ) : (
                    <>
                      <option value="ISTIMEWA">Hanya Istimewa</option>
                      <option value="KEHORMATAN">Hanya Kehormatan</option>
                      <option value="UMUM">Hanya Umum</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* ACTION TOMBOL EKSEKUSI */}
            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={!selectedFile || parsedData.length === 0 || isProcessing}
                className="flex-1 py-3 px-4 rounded-2xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-serif font-black text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-200" />
                    <span>Mengimpor ke Supabase ({progressPercent}%)...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-emerald-200" />
                    <span>Mulai Impor ke Database</span>
                  </>
                )}
              </button>

              {selectedFile && (
                <button
                  type="button"
                  onClick={handleResetUpload}
                  disabled={isProcessing}
                  className="px-3 py-3 rounded-2xl border border-stone-300 text-stone-600 hover:bg-stone-100 font-bold text-xs"
                  title="Batalkan Pilihan"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

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
              <h3 className="font-serif font-black text-base text-emerald-950">
                Laporan Hasil Impor Data Excel
              </h3>
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
                Total {parsedData.length} baris terdeteksi
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
      </div>
    </AuthGuard>
  );
}
