import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { supabaseServer } from '@/lib/supabase/server';
import { getSessionRole } from '@/lib/auth-server';
import {
  isDuplicateSantri,
  mergeSubKategori,
  resolvePriorityKategoriUtama,
  calculateKuotaDasarSantri,
  getWarnaTiketSantri,
  getWarnaTiketUndangan,
} from '@/lib/types';
import { generateRandomKode } from '@/lib/utils';

export const runtime = 'nodejs';
export const maxDuration = 60;

function generateUniqueKodeInMemory(
  prefix: 'SH' | 'UND',
  existingKodeSet: Set<string>
): string {
  for (let attempt = 0; attempt < 100; attempt++) {
    const candidate = generateRandomKode(prefix);
    if (!existingKodeSet.has(candidate)) {
      existingKodeSet.add(candidate);
      return candidate;
    }
  }
  const fallback = `${prefix}${Date.now().toString(36).slice(-4).toUpperCase()}`;
  existingKodeSet.add(fallback);
  return fallback;
}

export async function POST(req: NextRequest) {
  const role = getSessionRole(req);
  if (!role || (role !== 'ADMIN' && role !== 'PENERIMA_TAMU')) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized: Sesi admin/panitia tidak valid.' },
      { status: 401 }
    );
  }

  try {
    let activeTab = 'SANTRI';
    let selectedKategoriUpload = 'BIN_NADZOR';
    let rows: any[] = [];

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      activeTab = String(formData.get('activeTab') || 'SANTRI');
      selectedKategoriUpload = String(formData.get('selectedKategoriUpload') || 'BIN_NADZOR');
      const uploadedFile = formData.get('file');
      const rawRowsField = formData.get('rows');

      if (uploadedFile && typeof (uploadedFile as Blob).arrayBuffer === 'function') {
        const arrayBuf = await (uploadedFile as Blob).arrayBuffer();
        const wb = XLSX.read(Buffer.from(arrayBuf), { type: 'buffer' });
        const wsName = wb.SheetNames[0];
        if (!wsName) {
          return NextResponse.json(
            { ok: false, error: 'File Excel tidak memiliki sheet yang valid.' },
            { status: 400 }
          );
        }
        rows = XLSX.utils.sheet_to_json(wb.Sheets[wsName], { defval: '' });
      } else if (typeof rawRowsField === 'string' && rawRowsField.trim()) {
        rows = JSON.parse(rawRowsField);
      } else {
        return NextResponse.json(
          { ok: false, error: 'Berkas Excel (file) atau data rows wajib disertakan dalam FormData.' },
          { status: 400 }
        );
      }
    } else {
      const body = await req.json();
      activeTab = body.activeTab;
      selectedKategoriUpload = body.selectedKategoriUpload;
      rows = body.rows;
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Data baris Excel kosong atau tidak valid.' },
        { status: 400 }
      );
    }

    const isSantri = activeTab === 'SANTRI';

    // 1. Ambil data awal dari database via supabaseServer untuk pengecekan duplikasi
    const existingKodeSet = new Set<string>();
    let existingSantriList: any[] = [];

    if (isSantri) {
      const { data: dbSantri, error: fetchSantriErr } = await supabaseServer
        .from('peserta_santri')
        .select('id, kode, nama, kategori_utama, sub_kategori, kuota_dasar, kuota_tambahan, kuota_terpakai, nama_wali, no_hp, kamar, alamat, kelas')
        .limit(5000);
      if (fetchSantriErr) {
        console.error('[API Import] Gagal mengambil data santri awal:', fetchSantriErr);
        return NextResponse.json(
          { ok: false, error: `Gagal membaca database peserta_santri: ${fetchSantriErr.message}` },
          { status: 500 }
        );
      }
      existingSantriList = dbSantri || [];
      existingSantriList.forEach((s) => {
        if (s.kode) existingKodeSet.add(s.kode.toUpperCase());
      });
    } else {
      const { data: dbTamu, error: fetchTamuErr } = await supabaseServer
        .from('tamu_undangan')
        .select('kode')
        .limit(5000);
      if (fetchTamuErr) {
        console.error('[API Import] Gagal mengambil data tamu awal:', fetchTamuErr);
        return NextResponse.json(
          { ok: false, error: `Gagal membaca database tamu_undangan: ${fetchTamuErr.message}` },
          { status: 500 }
        );
      }
      (dbTamu || []).forEach((t) => {
        if (t.kode) existingKodeSet.add(t.kode.toUpperCase());
      });
    }

    let successCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const errorLogs: string[] = [];
    const newSantriItems: Array<{ rowNumber: number; cleanNamaSantri: string; payload: any }> = [];
    const newTamuItems: Array<{ rowNumber: number; finalNama: string; payload: any }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
      const getVal = (...keys: string[]) => {
        const normKeys = keys.map(norm);
        for (const rk of Object.keys(row)) {
          const normRk = norm(rk);
          if (normKeys.includes(normRk) && row[rk] !== undefined && row[rk] !== null) {
            const val = String(row[rk]).trim();
            if (val !== '') return val;
          }
        }
        return '';
      };

      if (isSantri) {
        const namaSantri = getVal(
          'NAMA LENGKAP SANTRIWATI',
          'NAMA LENGKAP SANTRI',
          'NAMA SANTRIWATI',
          'NAMA SANTRI',
          'NAMA LENGKAP',
          'NAMA',
          'SANTRI',
          'SANTRIWATI',
          'nama_santriwati',
          'nama_lengkap_santriwati',
          'nama_santri',
          'nama'
        );
        const kamar = getVal('KAMAR PONDOK', 'KAMAR', 'KAMAR SANTRI', 'NO KAMAR', 'kamar_pondok', 'kamar') || null;
        const kelas = getVal('KELAS', 'TINGKAT', 'JENJANG', 'TINGKAT KELAS', 'kelas', 'tingkat') || null;
        const namaWali = getVal('NAMA WALI SANTRI', 'NAMA WALI SANTRIWATI', 'NAMA WALI', 'WALI SANTRI', 'WALI', 'NAMA ORANG TUA', 'ORANG TUA', 'nama_wali') || null;
        const noHp = getVal('NO WHATSAPP WALI', 'NO WA WALI', 'NO WHATSAPP', 'NO WA', 'WHATSAPP WALI', 'WHATSAPP', 'NO HP WALI', 'NO HP', 'HP', 'TELEPON', 'no_hp') || null;
        const alamat = getVal('ALAMAT / ASAL KOTA', 'ALAMAT ASAL KOTA', 'ASAL KOTA', 'ALAMAT', 'KOTA', 'ASAL', 'alamat') || null;
        const bagianTamatan = getVal('BAGIAN TAMATAN', 'BAGIAN', 'SUB KATEGORI TAMATAN', 'SUB KATEGORI', 'bagian_tamatan') || null;

        if (!namaSantri) {
          skippedCount++;
          errorLogs.push(`Baris #${i + 1}: Dilewati karena NAMA SANTRI kosong.`);
          continue;
        }

        const cleanNamaSantri = namaSantri.trim().replace(/\s+/g, ' ');
        const cleanNamaWali = (namaWali || '').trim().replace(/\s+/g, ' ');

        const incomingKategoriUtama = selectedKategoriUpload;
        let incomingSubKategori = 'Bil Ghoib';
        if (incomingKategoriUtama === 'TAMATAN') {
          const bg = bagianTamatan || 'A.01';
          incomingSubKategori = `Tamatan (${bg})`;
        } else if (incomingKategoriUtama === 'BIN_NADZOR') {
          incomingSubKategori = 'Bin Nadzori';
        } else {
          incomingSubKategori = 'Bil Ghoib';
        }

        // Cek jika sudah ada santri dengan nama dan wali cocok (kategori dobel)
        const existingSantri = cleanNamaWali
          ? existingSantriList.find((s) => isDuplicateSantri(s.nama, s.nama_wali, cleanNamaSantri, cleanNamaWali))
          : null;

        if (existingSantri) {
          const mergedSub = mergeSubKategori(existingSantri.sub_kategori || '', incomingSubKategori);
          const resolvedKatUtama = resolvePriorityKategoriUtama(
            existingSantri.kategori_utama,
            incomingKategoriUtama,
            mergedSub
          );
          const resolvedKuota = Math.max(
            Number(existingSantri.kuota_dasar || 0),
            calculateKuotaDasarSantri(resolvedKatUtama, mergedSub)
          );
          const resolvedWarna = getWarnaTiketSantri(resolvedKatUtama, mergedSub);

          const updatePayload: any = {
            kategori_utama: resolvedKatUtama,
            sub_kategori: mergedSub,
            kuota_dasar: resolvedKuota,
            warna_tiket: resolvedWarna,
            updated_at: new Date().toISOString(),
          };

          if ((!existingSantri.no_hp || existingSantri.no_hp === '-') && noHp) {
            updatePayload.no_hp = noHp;
          }
          if ((!existingSantri.kamar || existingSantri.kamar === '-') && kamar) {
            updatePayload.kamar = kamar;
          }
          if (
            (!existingSantri.alamat || existingSantri.alamat === '-' || existingSantri.alamat === 'Kediri') &&
            alamat
          ) {
            updatePayload.alamat = alamat;
          }
          if (incomingKategoriUtama === 'BIN_NADZOR' && kelas) {
            updatePayload.kelas = kelas;
          }

          if (!existingSantri.id && existingSantri._pendingPayload) {
            const { updated_at: _omitUpdatedAt, ...pendingUpdates } = updatePayload;
            Object.assign(existingSantri._pendingPayload, pendingUpdates);
            Object.assign(existingSantri, pendingUpdates);
            successCount++;
            continue;
          }

          try {
            const { error: updateError } = await supabaseServer
              .from('peserta_santri')
              .update(updatePayload)
              .eq('id', existingSantri.id);

            if (updateError) throw updateError;
            Object.assign(existingSantri, updatePayload);
            successCount++;
          } catch (err: any) {
            failedCount++;
            errorLogs.push(`Update Santri Dobel ${cleanNamaSantri} (${existingSantri.kode}): ${err.message || err}`);
          }
          continue;
        }

        // Siapkan Santri Baru untuk bulk insert
        let kode = getVal('KODE', 'kode').toUpperCase();
        if (!kode) {
          kode = generateUniqueKodeInMemory('SH', existingKodeSet);
        } else if (existingKodeSet.has(kode)) {
          skippedCount++;
          continue;
        } else {
          existingKodeSet.add(kode);
        }

        const kategoriUtama = selectedKategoriUpload;
        const subKategori = incomingSubKategori;
        const warnaTiket = getWarnaTiketSantri(kategoriUtama, subKategori);
        const kuotaDasar = calculateKuotaDasarSantri(kategoriUtama, subKategori);

        const resolvedKelas =
          incomingKategoriUtama === 'BIN_NADZOR'
            ? (kelas || 'Belum Diisi')
            : (incomingKategoriUtama === 'TAMATAN' ? `3 ALY ${bagianTamatan || 'A.01'}` : incomingKategoriUtama);

        const payload = {
          kode,
          nama: cleanNamaSantri,
          nama_wali: namaWali,
          kelas: resolvedKelas,
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
          status_wa: 'BELUM',
          status_wa_undangan: 'BELUM',
          status_wa_kuota: 'BELUM',
          status_wa_penginapan: 'BELUM',
          created_at: new Date().toISOString(),
        };

        newSantriItems.push({ rowNumber: i + 1, cleanNamaSantri, payload });

        if (cleanNamaWali) {
          existingSantriList.push({ ...payload, _pendingPayload: payload });
        }
      } else {
        // Tamu Undangan
        const p = getVal('NAMA TAMU PUTRA', 'TAMU PUTRA', 'NAMA PUTRA', 'PUTRA', 'BAPAK', 'KYAI', 'nama_putra');
        const w = getVal('NAMA TAMU PUTRI', 'TAMU PUTRI', 'NAMA PUTRI', 'PUTRI', 'IBU', 'NYAI', 'nama_putri');
        const rawNama = getVal('NAMA TAMU', 'NAMA UNDANGAN', 'NAMA LENGKAP', 'NAMA', 'TAMU', 'nama_tamu', 'nama');

        let finalNama = '';
        if (p && w) finalNama = `${p} & ${w}`;
        else if (p) finalNama = p;
        else if (w) finalNama = w;
        else if (rawNama) finalNama = rawNama;

        if (!finalNama) {
          skippedCount++;
          errorLogs.push(`Baris #${i + 1}: Dilewati karena Nama Tamu kosong.`);
          continue;
        }

        const kategoriUndangan = getVal('KATEGORI UNDANGAN', 'KATEGORI', 'GOLONGAN UNDANGAN', 'GOLONGAN', 'SUB KATEGORI', 'kategori_undangan', 'kategori') || null;
        const instansi = getVal('INSTANSI / ASAL LEMBAGA', 'INSTANSI ASAL LEMBAGA', 'INSTANSI', 'ASAL LEMBAGA', 'LEMBAGA', 'instansi') || null;
        const alamat = getVal('ALAMAT / ASAL KOTA', 'ALAMAT ASAL KOTA', 'ASAL KOTA', 'ALAMAT', 'KOTA', 'ASAL', 'alamat') || null;
        const noHp = getVal('NO WHATSAPP / HP', 'NO WHATSAPP', 'NO WA', 'NO HP', 'HP', 'WHATSAPP', 'TELEPON', 'no_hp') || null;

        let kode = getVal('KODE', 'kode').toUpperCase();
        if (!kode) {
          kode = generateUniqueKodeInMemory('UND', existingKodeSet);
        } else if (existingKodeSet.has(kode)) {
          skippedCount++;
          continue;
        } else {
          existingKodeSet.add(kode);
        }

        let kategori = 'UMUM';
        let subKategori = selectedKategoriUpload || 'UMUM';

        if (selectedKategoriUpload === 'ISTIMEWA') {
          kategori = kategoriUndangan || 'VVIP';
          subKategori = 'ISTIMEWA';
        } else if (selectedKategoriUpload === 'KEHORMATAN') {
          kategori = 'Tamu Kehormatan';
          subKategori = 'KEHORMATAN';
        } else {
          kategori = kategoriUndangan || 'PENGUJI AL QUR-AN';
          subKategori = 'UMUM';
        }

        const warnaTiketUnd = getWarnaTiketUndangan(subKategori, kategori);

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
          status_konfirmasi: 'BELUM',
          status_wa: 'BELUM',
          kuota_terpakai: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        newTamuItems.push({ rowNumber: i + 1, finalNama, payload });
      }
    }

    // Eksekusi bulk insert Santri (dengan fallback per baris bila ada baris bermasalah)
    if (isSantri && newSantriItems.length > 0) {
      const bulkPayloads = newSantriItems.map((item) => item.payload);
      const { error: bulkErr } = await supabaseServer
        .from('peserta_santri')
        .insert(bulkPayloads);

      if (!bulkErr) {
        successCount += newSantriItems.length;
      } else {
        console.warn('[API Import] Bulk insert santri fallback ke per baris:', bulkErr.message);
        for (const item of newSantriItems) {
          const { error: rowErr } = await supabaseServer
            .from('peserta_santri')
            .insert([item.payload]);
          if (!rowErr) {
            successCount++;
          } else {
            failedCount++;
            errorLogs.push(`Baris #${item.rowNumber} (${item.cleanNamaSantri}): ${rowErr.message}`);
          }
        }
      }
    }

    // Eksekusi bulk upsert Tamu Undangan (dengan fallback per baris bila ada baris bermasalah)
    if (!isSantri && newTamuItems.length > 0) {
      const bulkPayloads = newTamuItems.map((item) => item.payload);
      const { error: bulkErr } = await supabaseServer
        .from('tamu_undangan')
        .upsert(bulkPayloads, { onConflict: 'kode' });

      if (!bulkErr) {
        successCount += newTamuItems.length;
      } else {
        console.warn('[API Import] Bulk upsert tamu fallback ke per baris:', bulkErr.message);
        for (const item of newTamuItems) {
          const { error: rowErr } = await supabaseServer
            .from('tamu_undangan')
            .upsert(item.payload, { onConflict: 'kode' });
          if (!rowErr) {
            successCount++;
          } else {
            failedCount++;
            errorLogs.push(`Baris #${item.rowNumber} (${item.finalNama}): ${rowErr.message}`);
          }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      total: rows.length,
      successCount,
      skippedCount,
      failedCount,
      errorLogs,
      pesan: `Import selesai. Berhasil: ${successCount}, Dilewati: ${skippedCount}, Gagal: ${failedCount}`,
    });
  } catch (err: any) {
    console.error('[API Import] Fatal error:', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Terjadi kesalahan server saat import Excel.' },
      { status: 500 }
    );
  }
}
