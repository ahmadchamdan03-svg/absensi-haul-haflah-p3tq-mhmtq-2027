import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase/client';
import { logAudit } from '@/lib/audit-log';
import {
  getWarnaTiketUndangan,
  getWarnaTiketSantri,
  calculateKuotaDasarSantri,
  mergeSubKategori,
  resolvePriorityKategoriUtama,
  isDuplicateSantri,
  normalizePesertaString,
  normalizeWaliString,
} from '@/lib/types';
import { generateRandomKode, generateUniqueKodeFromDb } from '@/lib/utils';

export { generateRandomKode, generateUniqueKodeFromDb };

export const getKategoriLabel = (cat: string) => {
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

export const downloadTemplateSantriExcel = async (
  filterKat: 'BIL_GHOIB' | 'BIN_NADZOR' | 'TAMATAN'
) => {
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
    const ws = wb.addWorksheet(`Santri ${katLabel}`);

    if (filterKat === 'TAMATAN') {
      ws.columns = [
        { header: 'NAMA LENGKAP SANTRIWATI', key: 'nama_santri', width: 34 },
        { header: 'KAMAR PONDOK', key: 'kamar', width: 22 },
        { header: 'NAMA WALI SANTRI', key: 'nama_wali', width: 28 },
        { header: 'NO WHATSAPP WALI', key: 'no_hp', width: 22 },
        { header: 'ALAMAT / ASAL KOTA', key: 'alamat', width: 28 },
        { header: 'BAGIAN TAMATAN', key: 'bagian_tamatan', width: 22 },
      ];
    } else if (filterKat === 'BIN_NADZOR') {
      ws.columns = [
        { header: 'NAMA LENGKAP SANTRIWATI', key: 'nama_santri', width: 34 },
        { header: 'KAMAR PONDOK', key: 'kamar', width: 22 },
        { header: 'KELAS', key: 'kelas', width: 22 },
        { header: 'NAMA WALI SANTRI', key: 'nama_wali', width: 28 },
        { header: 'NO WHATSAPP WALI', key: 'no_hp', width: 22 },
        { header: 'ALAMAT / ASAL KOTA', key: 'alamat', width: 28 },
      ];
    } else {
      ws.columns = [
        { header: 'NAMA LENGKAP SANTRIWATI', key: 'nama_santri', width: 34 },
        { header: 'KAMAR PONDOK', key: 'kamar', width: 22 },
        { header: 'NAMA WALI SANTRI', key: 'nama_wali', width: 28 },
        { header: 'NO WHATSAPP WALI', key: 'no_hp', width: 22 },
        { header: 'ALAMAT / ASAL KOTA', key: 'alamat', width: 28 },
      ];
    }

    const headerRow = ws.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF8C6A47' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD5C4B4' } },
        left: { style: 'thin', color: { argb: 'FFD5C4B4' } },
        bottom: { style: 'thin', color: { argb: 'FFD5C4B4' } },
        right: { style: 'thin', color: { argb: 'FFD5C4B4' } },
      };
    });

    if (filterKat === 'TAMATAN') {
      const tamatanOptions = '"A.01,A.02,A.03,A.04,B.01,B.02,B.03"';
      for (let r = 2; r <= 500; r++) {
        ws.getCell(`F${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [tamatanOptions],
          showErrorMessage: true,
          errorTitle: 'Pilihan Tidak Valid',
          error: 'Silakan pilih bagian tamatan dari daftar opsi (A.01 s/d B.03).',
        };
      }
    } else if (filterKat === 'BIN_NADZOR') {
      const binNadzorOptions = '"2 Tsanawiyah,3 Tsanawiyah,1 Aliyah,2 Aliyah,3 Aliyah,Mutakhorijat,Pondok Timur"';
      for (let r = 2; r <= 500; r++) {
        ws.getCell(`C${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [binNadzorOptions],
          showErrorMessage: true,
          errorTitle: 'Pilihan Tidak Valid',
          error: 'Silakan pilih kelas dari daftar opsi (2 Tsanawiyah, 3 Tsanawiyah, 1 Aliyah, 2 Aliyah, 3 Aliyah, Mutakhorijat, Pondok Timur).',
        };
      }
    }

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

export const downloadTemplateTamuExcel = async (
  filterKat: 'ISTIMEWA' | 'KEHORMATAN' | 'UMUM'
) => {
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

    if (filterKat === 'ISTIMEWA') {
      ws.columns = [
        { header: 'NAMA TAMU PUTRA', key: 'nama_putra', width: 30 },
        { header: 'NAMA TAMU PUTRI', key: 'nama_putri', width: 30 },
        { header: 'KATEGORI UNDANGAN', key: 'kategori', width: 24 },
        { header: 'ALAMAT', key: 'alamat', width: 26 },
        { header: 'NO WHATSAPP / HP', key: 'no_hp', width: 22 },
      ];
    } else if (filterKat === 'KEHORMATAN') {
      ws.columns = [
        { header: 'NAMA TAMU PUTRA', key: 'nama_putra', width: 30 },
        { header: 'NAMA TAMU PUTRI', key: 'nama_putri', width: 30 },
        { header: 'ALAMAT', key: 'alamat', width: 26 },
        { header: 'NO WHATSAPP / HP', key: 'no_hp', width: 22 },
      ];
    } else {
      ws.columns = [
        { header: 'NAMA TAMU PUTRA', key: 'nama_putra', width: 30 },
        { header: 'NAMA TAMU PUTRI', key: 'nama_putri', width: 30 },
        { header: 'KATEGORI UNDANGAN', key: 'kategori', width: 26 },
        { header: 'INSTANSI / ASAL LEMBAGA', key: 'instansi', width: 32 },
        { header: 'ALAMAT', key: 'alamat', width: 26 },
        { header: 'NO WHATSAPP / HP', key: 'no_hp', width: 22 },
      ];
    }

    const headerRow = ws.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF8C6A47' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD5C4B4' } },
        left: { style: 'thin', color: { argb: 'FFD5C4B4' } },
        bottom: { style: 'thin', color: { argb: 'FFD5C4B4' } },
        right: { style: 'thin', color: { argb: 'FFD5C4B4' } },
      };
    });

    const OPSI_UNDANGAN_ISTIMEWA = [
      'VVIP',
      'VIP Bani Marzuqi',
      'VIP Bani Qomariyah',
      'VIP Bani Mahrus (Zainab)',
      'VIP Bani Salamah',
      'VIP Bani Aisyah',
      'VIP Bandar',
      'VIP Keluarga Kunir - Blitar',
      'VIP IDS',
      'Lainnya (Ketik Sendiri...)',
    ];

    const OPSI_UNDANGAN_UMUM = [
      'Asatidz MHMTQ Sekalian',
      'Asatidz Purna Bakti',
      'Asatidzah MHMTQ Nduduk Rumah',
      'Mustahiq Tamatan Non Purna',
      'Purna Mustahiqoh Ibtidaiyah Tamatan Aliyah',
      'Pengajar Ekstrakurikuler Pondok (Mutakhorijin)',
      'Pengajar Unit',
      "Penguji Al-Qur'an",
      'Perwakilan Pondok',
      'Lainnya (Ketik Sendiri...)',
    ];

    if (filterKat === 'ISTIMEWA') {
      const wsRef = wb.addWorksheet('Referensi');
      wsRef.state = 'hidden';
      OPSI_UNDANGAN_ISTIMEWA.forEach((opt, idx) => {
        wsRef.getCell(`A${idx + 1}`).value = opt;
      });

      for (let r = 2; r <= 500; r++) {
        ws.getCell(`C${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`Referensi!$A$1:$A$${OPSI_UNDANGAN_ISTIMEWA.length}`],
          showErrorMessage: true,
          errorTitle: 'Kategori Tidak Valid',
          error: 'Silakan pilih kategori dari daftar pilihan dropdown yang tersedia.',
        };
      }
    } else if (filterKat === 'UMUM') {
      const wsRef = wb.addWorksheet('Referensi');
      wsRef.state = 'hidden';
      OPSI_UNDANGAN_UMUM.forEach((opt, idx) => {
        wsRef.getCell(`A${idx + 1}`).value = opt;
      });

      for (let r = 2; r <= 500; r++) {
        ws.getCell(`C${r}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`Referensi!$A$1:$A$${OPSI_UNDANGAN_UMUM.length}`],
          showErrorMessage: true,
          errorTitle: 'Kategori Tidak Valid',
          error: 'Silakan pilih kategori dari daftar pilihan dropdown yang tersedia.',
        };
      }
    }

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

export const exportLiveTableToExcel = async (tipe: 'SANTRI' | 'TAMU') => {
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
};

export async function executeBatchImportToSupabase({
  activeTab,
  selectedKategoriUpload,
  parsedData,
  setProgressPercent,
}: {
  activeTab: 'SANTRI' | 'TAMU';
  selectedKategoriUpload: string;
  parsedData: any[];
  setProgressPercent: (val: number) => void;
}) {
  const targetTable = activeTab === 'SANTRI' ? 'peserta_santri' : 'tamu_undangan';
  let successCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const errorLogs: string[] = [];

  const totalRows = parsedData.length;
  if (totalRows === 0) {
    return { total: 0, success: 0, skipped: 0, failed: 0, errors: [] };
  }

  const BATCH_SIZE = 50;
  for (let i = 0; i < totalRows; i += BATCH_SIZE) {
    const batchRows = parsedData.slice(i, i + BATCH_SIZE);

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeTab,
          selectedKategoriUpload,
          rows: batchRows,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }

      successCount += json.successCount || 0;
      skippedCount += json.skippedCount || 0;
      failedCount += json.failedCount || 0;
      if (Array.isArray(json.errorLogs)) {
        errorLogs.push(...json.errorLogs);
      }
    } catch (err: any) {
      failedCount += batchRows.length;
      errorLogs.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${err.message || err}`);
    }

    const currentProcessed = Math.min(i + BATCH_SIZE, totalRows);
    const percent = Math.round((currentProcessed / totalRows) * 100);
    setProgressPercent(percent);
  }

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

  return {
    total: totalRows,
    success: successCount,
    skipped: skippedCount,
    failed: failedCount,
    errors: errorLogs.slice(0, 10),
  };
}
