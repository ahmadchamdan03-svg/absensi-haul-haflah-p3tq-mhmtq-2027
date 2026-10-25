import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/audit-log';
import { getWarnaTiketUndangan } from '@/lib/types';
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

  const { data: existingRecords } = await supabase
    .from(targetTable)
    .select('kode');

  const existingKodeSet = new Set(
    (existingRecords || []).map((item: any) => String(item.kode).toUpperCase().trim())
  );

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
      const namaSantri = getVal(
        'NAMA LENGKAP SANTRIWATI',
        'NAMA LENGKAP',
        'NAMA SANTRI',
        'NAMA',
        'nama_santri',
        'nama'
      );
      const kamar = getVal('KAMAR PONDOK', 'KAMAR', 'kamar_pondok', 'kamar') || null;
      const namaWali = getVal('NAMA WALI SANTRI', 'NAMA WALI', 'WALI', 'nama_wali') || null;
      const noHp = getVal('NO WHATSAPP WALI', 'NO WHATSAPP', 'NO WA', 'NO HP', 'HP', 'no_hp') || null;
      const alamat = getVal('ALAMAT / ASAL KOTA', 'ALAMAT', 'ASAL KOTA', 'alamat') || null;
      const bagianTamatan = getVal('BAGIAN TAMATAN', 'BAGIAN', 'bagian_tamatan') || null;

      if (!namaSantri) {
        skippedCount++;
        errorLogs.push(`Baris #${i + 1}: Dilewati karena NAMA SANTRI kosong.`);
        const percent = Math.round(((i + 1) / totalRows) * 100);
        setProgressPercent(percent);
        continue;
      }

      let kode = getVal('KODE', 'kode').toUpperCase();
      if (!kode) {
        kode = generateRandomKode('SH');
        while (existingKodeSet.has(kode)) {
          kode = generateRandomKode('SH');
        }
        kode = await generateUniqueKodeFromDb('SH', 'peserta_santri', supabase, existingKodeSet);
      } else if (existingKodeSet.has(kode)) {
        skippedCount++;
        const percent = Math.round(((i + 1) / totalRows) * 100);
        setProgressPercent(percent);
        continue;
      }

      const kategoriUtama = selectedKategoriUpload;
      let subKategori = 'Bil Ghoib 30 Juz';
      if (kategoriUtama === 'TAMATAN') {
        subKategori = bagianTamatan || 'A.01';
      } else if (kategoriUtama === 'BIN_NADZOR') {
        subKategori = 'Bin Nadzori';
      } else {
        subKategori = 'Bil Ghoib 30 Juz';
      }

      const warnaTiket = kategoriUtama === 'BIL_GHOIB' ? 'Hitam Gold' : 'Merah Gold';
      const defaultKuota = kategoriUtama === 'BIL_GHOIB' ? 4 : 2;
      const kuotaDasar = defaultKuota;

      try {
        const payload = {
          kode,
          nama: namaSantri.toUpperCase(),
          nama_wali: namaWali,
          kelas: kategoriUtama,
          kamar,
          alamat,
          no_hp: noHp,
          kategori_utama: kategoriUtama,
          sub_kategori: subKategori,
          kuota_dasar: kuotaDasar,
          kuota_tambahan: 0,
          kuota_terpakai: 0,
          warna_tiket: warnaTiket,
          status_konfirmasi: 'BELUM',
          created_at: new Date().toISOString(),
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
      const p = getVal('NAMA TAMU PUTRA', 'NAMA PUTRA', 'PUTRA', 'nama_putra');
      const w = getVal('NAMA TAMU PUTRI', 'NAMA PUTRI', 'PUTRI', 'nama_putri');
      const rawNama = getVal('NAMA TAMU', 'NAMA', 'nama_tamu', 'nama');

      let finalNama = '';
      if (p && w) {
        finalNama = `${p} & ${w}`;
      } else if (p) {
        finalNama = p;
      } else if (w) {
        finalNama = w;
      } else if (rawNama) {
        finalNama = rawNama;
      }

      if (!finalNama) {
        skippedCount++;
        errorLogs.push(`Baris #${i + 1}: Dilewati karena Nama Tamu (Putra/Putri) kosong.`);
        const percent = Math.round(((i + 1) / totalRows) * 100);
        setProgressPercent(percent);
        continue;
      }

      const kategoriUndangan = getVal('KATEGORI UNDANGAN', 'KATEGORI', 'kategori_undangan', 'kategori') || null;
      const instansi = getVal('INSTANSI / ASAL LEMBAGA', 'INSTANSI', 'ASAL LEMBAGA', 'instansi') || null;
      const alamat = getVal('ALAMAT / ASAL KOTA', 'ALAMAT', 'alamat') || null;
      const noHp = getVal('NO WHATSAPP / HP', 'NO WHATSAPP', 'NO WA', 'NO HP', 'HP', 'no_hp') || null;
      const jalurMasukInput = getVal('JALUR MASUK', 'JALUR', 'jalur_masuk') || null;

      let kode = getVal('KODE', 'kode').toUpperCase();
      if (!kode) {
        kode = generateRandomKode('UND');
        while (existingKodeSet.has(kode)) {
          kode = generateRandomKode('UND');
        }
        kode = await generateUniqueKodeFromDb('UND', 'tamu_undangan', supabase, existingKodeSet);
      } else if (existingKodeSet.has(kode)) {
        skippedCount++;
        const percent = Math.round(((i + 1) / totalRows) * 100);
        setProgressPercent(percent);
        continue;
      }

      let defaultJalur = 'Gerbang Selatan (Bola Dunia)';
      if (selectedKategoriUpload === 'ISTIMEWA' || selectedKategoriUpload === 'KEHORMATAN') {
        defaultJalur = 'Jalur VIP';
      } else {
        defaultJalur = 'Gerbang Selatan (Bola Dunia)';
      }
      const jalurMasuk = jalurMasukInput || defaultJalur;

      let kategori = 'UMUM';
      let subKategori = selectedKategoriUpload || 'UMUM';

      if (selectedKategoriUpload === 'ISTIMEWA') {
        kategori = kategoriUndangan || 'VVIP';
        subKategori = 'ISTIMEWA';
      } else if (selectedKategoriUpload === 'KEHORMATAN') {
        kategori = 'Tamu Kehormatan';
        subKategori = 'KEHORMATAN';
      } else {
        kategori = kategoriUndangan || 'Pengajar Unit';
        subKategori = 'UMUM';
      }

      const warnaTiketUnd = getWarnaTiketUndangan(subKategori, kategori);

      try {
        const payload = {
          kode,
          nama: finalNama,
          nama_putra: p || null,
          nama_putri: w || null,
          instansi: instansi || null,
          alamat: alamat || null,
          no_hp: noHp || null,
          kategori,
          sub_kategori: subKategori,
          warna_tiket: warnaTiketUnd,
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

    const percent = Math.round(((i + 1) / totalRows) * 100);
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
