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
  const [selectedKategoriUpload, setSelectedKategoriUpload] = useState<string>('');

  const getKategoriLabel = (cat: string) => {
    switch (cat) {
      case 'BIL_GHOIB':
        return 'Bil Ghoib';
      case 'BIN_NADZOR':
        return 'Bin Nadzor';
      case 'TAMATAN':
        return 'Tamatan';
      case 'ISTIMEWA':
        return 'Istimewa';
      case 'KEHORMATAN':
        return 'Kehormatan';
      case 'UMUM':
        return 'Umum';
      default:
        return cat;
    }
  };

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
  const handleDownloadTemplateSantri = async (filterKat: 'BIL_GHOIB' | 'BIN_NADZOR' | 'TAMATAN') => {
    try {
      const ExcelJS = (await import('exceljs')).default || (await import('exceljs'));
      const wb = new ExcelJS.Workbook();
      wb.creator = 'Panitia Haflah 2027';
      wb.created = new Date();

      const katLabel =
        filterKat === 'BIL_GHOIB'
          ? 'Bil Ghoib'
          : filterKat === 'BIN_NADZOR'
          ? 'Bin Nadzor'
          : 'Tamatan';
      const ws = wb.addWorksheet(`Peserta ${katLabel}`);

      // 7 Kolom Baku Sederhana
      ws.columns = [
        { header: 'NAMA SANTRI', key: 'nama_santri', width: 34 },
        { header: 'NAMA WALI', key: 'nama_wali', width: 30 },
        { header: 'KELAS', key: 'kelas', width: 20 },
        { header: 'KAMAR', key: 'kamar', width: 24 },
        { header: 'ALAMAT', key: 'alamat', width: 26 },
        { header: 'NO HP', key: 'no_hp', width: 20 },
        { header: 'KUOTA DASAR', key: 'kuota_dasar', width: 16 },
      ];

      // Styling Header: Background Coklat #8C6A47, Font Putih Bold, Alignment Center
      const headerRow = ws.getRow(1);
      headerRow.height = 28;
      headerRow.eachCell((cell) => {
        cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF8C6A47' }, // Coklat resmi Haflah
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD5C4B4' } },
          left: { style: 'thin', color: { argb: 'FFD5C4B4' } },
          bottom: { style: 'thin', color: { argb: 'FFD5C4B4' } },
          right: { style: 'thin', color: { argb: 'FFD5C4B4' } },
        };
      });

      // 1 Baris Contoh Data Dummy
      let sampleData = {
        nama_santri: 'AHMAD FAUZI',
        nama_wali: 'H. MAHMUDI',
        kelas: '3 Aliyah',
        kamar: 'Kamar Al-Falah 02',
        alamat: 'Kediri',
        no_hp: '081234567890',
        kuota_dasar: 4,
      };

      if (filterKat === 'BIN_NADZOR') {
        sampleData = {
          nama_santri: 'MUHAMMAD ZAINAL',
          nama_wali: 'H. ABDULLAH',
          kelas: '2 Tsanawiyah',
          kamar: 'Kamar An-Nur 05',
          alamat: 'Nganjuk',
          no_hp: '081298765432',
          kuota_dasar: 2,
        };
      } else if (filterKat === 'TAMATAN') {
        sampleData = {
          nama_santri: 'ZULFA RAHMAWATI',
          nama_wali: 'K.H. IMRON',
          kelas: '3 Aliyah',
          kamar: 'Kamar Fatimah 01',
          alamat: 'Jombang',
          no_hp: '085612345678',
          kuota_dasar: 2,
        };
      }

      const sampleRow = ws.addRow(sampleData);
      sampleRow.height = 22;
      sampleRow.eachCell((cell) => {
        cell.font = { name: 'Calibri', size: 10 };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      });
      ws.getCell('C2').alignment = { vertical: 'middle', horizontal: 'center' };
      ws.getCell('F2').alignment = { vertical: 'middle', horizontal: 'center' };
      ws.getCell('G2').alignment = { vertical: 'middle', horizontal: 'center' };

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const fileName = `Template_Peserta_Santri_${filterKat}.xlsx`;

      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error downloading template santri:', err);
      alert(`Gagal membuat template Excel: ${err.message || err}`);
    }
  };

  const handleDownloadTemplateTamu = async (filterKat: 'ISTIMEWA' | 'KEHORMATAN' | 'UMUM') => {
    try {
      const ExcelJS = (await import('exceljs')).default || (await import('exceljs'));
      const wb = new ExcelJS.Workbook();
      wb.creator = 'Panitia Haflah 2027';
      wb.created = new Date();

      const katLabel =
        filterKat === 'ISTIMEWA'
          ? 'Istimewa'
          : filterKat === 'KEHORMATAN'
          ? 'Kehormatan'
          : 'Umum';
      const ws = wb.addWorksheet(`Tamu ${katLabel}`);

      // 6 Kolom Baku Sederhana
      ws.columns = [
        { header: 'NAMA TAMU', key: 'nama_tamu', width: 34 },
        { header: 'NAMA PUTRA', key: 'nama_putra', width: 28 },
        { header: 'NAMA PUTRI', key: 'nama_putri', width: 28 },
        { header: 'INSTANSI', key: 'instansi', width: 32 },
        { header: 'ALAMAT', key: 'alamat', width: 24 },
        { header: 'NO HP', key: 'no_hp', width: 20 },
      ];

      // Styling Header: Background Coklat #8C6A47, Font Putih Bold, Alignment Center
      const headerRow = ws.getRow(1);
      headerRow.height = 28;
      headerRow.eachCell((cell) => {
        cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF8C6A47' }, // Coklat resmi Haflah
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD5C4B4' } },
          left: { style: 'thin', color: { argb: 'FFD5C4B4' } },
          bottom: { style: 'thin', color: { argb: 'FFD5C4B4' } },
          right: { style: 'thin', color: { argb: 'FFD5C4B4' } },
        };
      });

      // 1 Baris Contoh Data Dummy
      let sampleData = {
        nama_tamu: 'KH. ANWAR MANSHUR & IBU NYAI',
        nama_putra: 'KH. ANWAR MANSHUR',
        nama_putri: 'IBU NYAI HJ. MAHMUDAH',
        instansi: 'Pon. Pes. Lirboyo Kediri',
        alamat: 'Kediri',
        no_hp: '081234567890',
      };

      if (filterKat === 'KEHORMATAN') {
        sampleData = {
          nama_tamu: 'BAPAK H. BAMBANG IRAWAN',
          nama_putra: 'BAPAK H. BAMBANG IRAWAN',
          nama_putri: '',
          instansi: 'Kemenag Kab. Kediri',
          alamat: 'Kediri',
          no_hp: '081345678901',
        };
      } else if (filterKat === 'UMUM') {
        sampleData = {
          nama_tamu: 'AL-USTADZ ZAINUDDIN',
          nama_putra: 'AL-USTADZ ZAINUDDIN',
          nama_putri: '',
          instansi: 'Asatidz MHMTQ Sekalian',
          alamat: 'Kediri',
          no_hp: '085712345678',
        };
      }

      const sampleRow = ws.addRow(sampleData);
      sampleRow.height = 22;
      sampleRow.eachCell((cell) => {
        cell.font = { name: 'Calibri', size: 10 };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      });
      ws.getCell('F2').alignment = { vertical: 'middle', horizontal: 'center' };

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const fileName = `Template_Tamu_Undangan_${filterKat}.xlsx`;

      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error downloading template tamu:', err);
      alert(`Gagal membuat template Excel: ${err.message || err}`);
    }
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
      `Mulai impor ${parsedData.length} baris data ${activeTab === 'SANTRI' ? 'Peserta Santri' : 'Tamu Undangan'} (${catLabel}) ke database Supabase?`
    );
    if (!confirmRun) return;

    setIsProcessing(true);
    setProgressPercent(0);

    const targetTable = activeTab === 'SANTRI' ? 'peserta_santri' : 'tamu_undangan';
    let successCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const errorLogs: string[] = [];

    // Ambil data existing untuk cek duplikasi kode
    const { data: existingRecords } = await supabase
      .from(targetTable)
      .select('kode');

    const existingKodeSet = new Set(
      (existingRecords || []).map((item: any) => String(item.kode).toUpperCase().trim())
    );

    // Hitung max kode numerik untuk santri (SH8001...) dan tamu (UND0001...)
    let maxSantriKodeNum = 8000;
    let maxTamuKodeNum = 0;

    if (existingRecords) {
      for (const item of existingRecords) {
        const k = String(item.kode || '').trim().toUpperCase();
        if (activeTab === 'SANTRI') {
          const m = k.match(/^SH(\d+)$/);
          if (m) {
            const num = parseInt(m[1], 10);
            if (!isNaN(num) && num > maxSantriKodeNum) {
              maxSantriKodeNum = num;
            }
          }
        } else {
          const m = k.match(/^UND(\d+)$/);
          if (m) {
            const num = parseInt(m[1], 10);
            if (!isNaN(num) && num > maxTamuKodeNum) {
              maxTamuKodeNum = num;
            }
          }
        }
      }
    }

    const totalRows = parsedData.length;

    for (let i = 0; i < totalRows; i++) {
      const row = parsedData[i];

      const getVal = (...keys: string[]) => {
        for (const k of keys) {
          if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
            return String(row[k]).trim();
          }
        }
        return '';
      };

      if (activeTab === 'SANTRI') {
        const namaSantri = getVal('NAMA SANTRI', 'NAMA', 'nama_santri', 'nama');
        const namaWali = getVal('NAMA WALI', 'WALI', 'nama_wali') || '-';
        const kelas = getVal('KELAS', 'kelas') || '-';
        const kamar = getVal('KAMAR', 'kamar') || '-';
        const alamat = getVal('ALAMAT', 'alamat') || 'Kediri';
        const noHp = getVal('NO HP', 'HP', 'no_hp') || '-';
        const kuotaDasarRaw = getVal('KUOTA DASAR', 'KUOTA', 'kuota_dasar');

        if (!namaSantri) {
          skippedCount++;
          errorLogs.push(`Baris #${i + 1}: Dilewati karena NAMA SANTRI kosong.`);
          const percent = Math.round(((i + 1) / totalRows) * 100);
          setProgressPercent(percent);
          continue;
        }

        // Tentukan Kode: Dari file jika ada, atau Auto-Generate SH8001+ sekuensial
        let kode = getVal('KODE', 'kode').toUpperCase();
        if (!kode) {
          maxSantriKodeNum++;
          kode = `SH${String(maxSantriKodeNum).padStart(4, '0')}`;
          while (existingKodeSet.has(kode)) {
            maxSantriKodeNum++;
            kode = `SH${String(maxSantriKodeNum).padStart(4, '0')}`;
          }
        } else if (existingKodeSet.has(kode)) {
          // Bentrok kode -> otomatis skip baris tersebut
          skippedCount++;
          const percent = Math.round(((i + 1) / totalRows) * 100);
          setProgressPercent(percent);
          continue;
        }

        // Auto-generate berdasarkan Kategori yang dipilih User di UI
        const kategoriUtama = selectedKategoriUpload; // BIL_GHOIB | BIN_NADZOR | TAMATAN
        const subKategori =
          kategoriUtama === 'BIL_GHOIB'
            ? 'Bil Ghoib 30 Juz'
            : kategoriUtama === 'BIN_NADZOR'
            ? 'Bin Nadzor'
            : 'Tamatan Alfiyah';
        const warnaTiket = kategoriUtama === 'BIL_GHOIB' ? 'Hitam Gold' : 'Merah Gold';
        const jalurMasuk = 'Gerbang Selatan (Bola Dunia)';
        const defaultKuota = kategoriUtama === 'BIL_GHOIB' ? 4 : 2;
        const kuotaDasar = Number(kuotaDasarRaw || defaultKuota);

        try {
          const payload = {
            kode,
            nama: namaSantri.toUpperCase(),
            nama_wali: namaWali,
            kelas,
            kamar,
            alamat,
            no_hp: noHp,
            kategori_utama: kategoriUtama,
            sub_kategori: subKategori,
            warna_tiket: warnaTiket,
            jalur_masuk: jalurMasuk,
            kuota_dasar: kuotaDasar,
            kuota_tambahan: 0,
            kuota_terpakai: 0,
            status_konfirmasi: 'BELUM',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const { error } = await supabase
            .from('peserta_santri')
            .upsert(payload, { onConflict: 'kode' });

          if (error) throw error;
          successCount++;
          existingKodeSet.add(kode);
        } catch (err: any) {
          failedCount++;
          errorLogs.push(`Kode ${kode}: ${err.message || err}`);
        }
      } else {
        // =======================================================================
        // TAMU UNDANGAN (FORMAT SEDERHANA 6 KOLOM & AUTO-GENERATE)
        // =======================================================================
        const rawNama = getVal('NAMA TAMU', 'NAMA', 'nama_tamu', 'nama');
        let p = getVal('NAMA PUTRA', 'nama_putra', 'NAMA_PUTRA');
        let w = getVal('NAMA PUTRI', 'nama_putri', 'NAMA_PUTRI');
        const instansi = getVal('INSTANSI', 'instansi') || '-';
        const alamat = getVal('ALAMAT', 'alamat') || '-';
        const noHp = getVal('NO HP', 'HP', 'no_hp') || '-';

        let finalNama = rawNama;
        if (!finalNama && (p || w)) {
          finalNama = p && w ? `${p} & ${w}` : p || w;
        }

        if (!finalNama) {
          skippedCount++;
          errorLogs.push(`Baris #${i + 1}: Dilewati karena NAMA TAMU kosong.`);
          const percent = Math.round(((i + 1) / totalRows) * 100);
          setProgressPercent(percent);
          continue;
        }

        if (!p && !w) {
          const upper = finalNama.toUpperCase();
          if (
            upper.startsWith('NYAI') ||
            upper.startsWith('NING') ||
            upper.startsWith('IBU NYAI') ||
            upper.startsWith('USTADZAH')
          ) {
            w = finalNama;
          } else {
            p = finalNama;
          }
        }

        // Tentukan Kode: Dari file jika ada, atau Auto-Generate UND0001+ sekuensial
        let kode = getVal('KODE', 'kode').toUpperCase();
        if (!kode) {
          maxTamuKodeNum++;
          kode = `UND${String(maxTamuKodeNum).padStart(4, '0')}`;
          while (existingKodeSet.has(kode)) {
            maxTamuKodeNum++;
            kode = `UND${String(maxTamuKodeNum).padStart(4, '0')}`;
          }
        } else if (existingKodeSet.has(kode)) {
          // Bentrok kode -> otomatis skip baris tersebut
          skippedCount++;
          const percent = Math.round(((i + 1) / totalRows) * 100);
          setProgressPercent(percent);
          continue;
        }

        // Auto-generate berdasarkan Kategori yang dipilih User di UI
        let kategori = 'UMUM';
        let subKategori = 'UMUM';
        let jalurMasuk = 'Gerbang';

        if (selectedKategoriUpload === 'ISTIMEWA') {
          kategori = 'VVIP';
          subKategori = 'ISTIMEWA';
          jalurMasuk = 'Jalur VIP';
        } else if (selectedKategoriUpload === 'KEHORMATAN') {
          kategori = 'KEHORMATAN';
          subKategori = 'KEHORMATAN';
          jalurMasuk = 'Jalur VIP';
        } else {
          kategori = 'UMUM';
          subKategori = 'UMUM';
          jalurMasuk = 'Gerbang';
        }

        try {
          const payload = {
            kode,
            nama: finalNama,
            nama_putra: p || null,
            nama_putri: w || null,
            instansi,
            alamat,
            no_hp: noHp,
            kategori,
            sub_kategori: subKategori,
            warna_tiket: 'Merah Gold',
            jalur_masuk: jalurMasuk,
            status_konfirmasi: 'BELUM',
            kuota_terpakai: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const { error } = await supabase
            .from('tamu_undangan')
            .upsert(payload, { onConflict: 'kode' });

          if (error) throw error;
          successCount++;
          existingKodeSet.add(kode);
        } catch (err: any) {
          failedCount++;
          errorLogs.push(`Kode ${kode}: ${err.message || err}`);
        }
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
      nilai_lama: `Kategori: ${selectedKategoriUpload}`,
      nilai_baru: `Berhasil: ${successCount}, Dilewati: ${skippedCount}, Gagal: ${failedCount}`,
      catatan: `Import data excel ${activeTab} (${totalRows} baris)`,
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
              setSelectedKategoriUpload('');
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
              setSelectedKategoriUpload('');
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

        {/* 2 KARTU UTAMA: DOWNLOAD TEMPLATE & UPLOAD DATA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* KARTU 1: DOWNLOAD TEMPLATE PER KATEGORI */}
          <div className="bg-white rounded-3xl p-6 border-2 border-[#E8DFD5] shadow-xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
              <Download className="w-5 h-5 text-[#8C6A47]" />
              <h2 className="font-serif font-black text-base text-[#422F21]">
                1. Unduh Template Format Excel
              </h2>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Pilih kategori di bawah untuk mengunduh template resmi. Format telah disederhanakan
              hanya memuat data esensial yang perlu diisi panitia.
            </p>

            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-[#8C6A47] uppercase tracking-wider block">
                Pilih Kategori untuk Mengunduh Template ({activeTab === 'SANTRI' ? 'Peserta Santri' : 'Tamu Undangan'}):
              </span>
              <div className="grid grid-cols-3 gap-2.5">
                {activeTab === 'SANTRI' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplateSantri('BIL_GHOIB')}
                      className="p-3.5 rounded-2xl bg-[#FAF0E6] hover:bg-[#EFE8E1] border-2 border-[#D5C4B4] text-center text-xs font-serif font-black text-[#422F21] shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-[#8C6A47]" />
                      <span>Bil Ghoib</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplateSantri('BIN_NADZOR')}
                      className="p-3.5 rounded-2xl bg-[#FAF0E6] hover:bg-[#EFE8E1] border-2 border-[#D5C4B4] text-center text-xs font-serif font-black text-[#422F21] shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-[#8C6A47]" />
                      <span>Bin Nadzor</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplateSantri('TAMATAN')}
                      className="p-3.5 rounded-2xl bg-[#FAF0E6] hover:bg-[#EFE8E1] border-2 border-[#D5C4B4] text-center text-xs font-serif font-black text-[#422F21] shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-[#8C6A47]" />
                      <span>Tamatan</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplateTamu('ISTIMEWA')}
                      className="p-3.5 rounded-2xl bg-[#FAF0E6] hover:bg-[#EFE8E1] border-2 border-[#D5C4B4] text-center text-xs font-serif font-black text-[#422F21] shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-[#8C6A47]" />
                      <span>Istimewa</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplateTamu('KEHORMATAN')}
                      className="p-3.5 rounded-2xl bg-[#FAF0E6] hover:bg-[#EFE8E1] border-2 border-[#D5C4B4] text-center text-xs font-serif font-black text-[#422F21] shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-[#8C6A47]" />
                      <span>Kehormatan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplateTamu('UMUM')}
                      className="p-3.5 rounded-2xl bg-[#FAF0E6] hover:bg-[#EFE8E1] border-2 border-[#D5C4B4] text-center text-xs font-serif font-black text-[#422F21] shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-[#8C6A47]" />
                      <span>Umum</span>
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
                2. Unggah Berkas Excel Sesuai Kategori
              </h2>
            </div>

            {/* STEP A: DROPDOWN PILIH KATEGORI WAJIB */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#422F21]">
                Langkah 1 — Pilih Kategori Data <span className="text-rose-600">*</span>:
              </label>
              <select
                value={selectedKategoriUpload}
                onChange={(e) => {
                  setSelectedKategoriUpload(e.target.value);
                  if (selectedFile) handleResetUpload();
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#D5C4B4] bg-white font-serif font-semibold text-xs text-[#322116] focus:outline-none focus:ring-2 focus:ring-[#8C6A47]"
              >
                <option value="">
                  {activeTab === 'SANTRI'
                    ? '-- Pilih Kategori Peserta Santri --'
                    : '-- Pilih Kategori Tamu Undangan --'}
                </option>
                {activeTab === 'SANTRI' ? (
                  <>
                    <option value="BIL_GHOIB">Bil Ghoib</option>
                    <option value="BIN_NADZOR">Bin Nadzor</option>
                    <option value="TAMATAN">Tamatan</option>
                  </>
                ) : (
                  <>
                    <option value="ISTIMEWA">Istimewa (VVIP/VIP)</option>
                    <option value="KEHORMATAN">Kehormatan</option>
                    <option value="UMUM">Umum</option>
                  </>
                )}
              </select>
              {!selectedKategoriUpload && (
                <p className="text-[11px] text-amber-800 font-medium">
                  ⚠️ Wajib pilih kategori data di atas sebelum memilih berkas Excel.
                </p>
              )}
            </div>

            {/* STEP B: DROPZONE / FILE SELECTOR */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#422F21]">
                Langkah 2 — Unggah File Excel:
              </label>
              <div
                className={`p-4 rounded-2xl border-2 border-dashed text-center space-y-2 transition-all ${
                  selectedKategoriUpload
                    ? 'bg-[#FAF7F3] border-[#D5C4B4]'
                    : 'bg-stone-50 border-stone-200 opacity-60'
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
                      ? 'bg-white border border-[#D5C4B4] text-[#5C3E28] hover:bg-stone-100 cursor-pointer'
                      : 'bg-stone-200 border border-stone-300 text-stone-400 cursor-not-allowed opacity-50'
                  }`}
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
                    {selectedKategoriUpload
                      ? `Silakan unggah format Excel untuk kategori ${getKategoriLabel(selectedKategoriUpload)}`
                      : 'Pilih kategori terlebih dahulu untuk membuka tombol unggah'}
                  </p>
                )}
              </div>
            </div>

            {/* ACTION TOMBOL EKSEKUSI */}
            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={!selectedKategoriUpload || !selectedFile || parsedData.length === 0 || isProcessing}
                className="flex-1 py-3 px-4 rounded-2xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-serif font-black text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
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
