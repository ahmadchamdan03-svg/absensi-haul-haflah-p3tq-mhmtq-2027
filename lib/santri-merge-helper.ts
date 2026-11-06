import {
  isDuplicateSantri,
  normalizePesertaString,
  normalizeWaliString,
  extractCoreWaliName,
  mergeSubKategori,
  resolvePriorityKategoriUtama,
  getWarnaTiketSantri,
  calculateKuotaDasarSantri,
} from '@/lib/types';
import { logAudit } from '@/lib/audit-log';

export interface DuplicateSantriGroup {
  key: string;
  nama: string;
  namaWali: string;
  items: any[];
}

/**
 * Memindai daftar santri dan mengelompokkan data yang memiliki
 * Nama Santri dan Nama Wali yang sama (duplikat).
 */
export function findDuplicateSantriInList(items: any[]): DuplicateSantriGroup[] {
  if (!items || items.length === 0) return [];

  const groups = new Map<string, any[]>();

  for (const item of items) {
    const rawNama = item.nama || item.santri?.[0]?.nama || '';
    const rawWali = item.namaWali || item.nama_wali || '';

    const normNama = normalizePesertaString(rawNama);
    const coreWali = extractCoreWaliName(rawWali);

    if (!normNama || !coreWali || coreWali === '-') continue;

    const groupKey = `${normNama}|||${coreWali}`;

    // Cek apakah sudah ada group yang cocok dengan isDuplicateSantri
    let matchedKey: string | null = null;
    Array.from(groups.entries()).forEach(([existingKey, groupItems]) => {
      if (matchedKey) return;
      const sample = groupItems[0];
      const sNama = sample.nama || sample.santri?.[0]?.nama || '';
      const sWali = sample.namaWali || sample.nama_wali || '';
      if (isDuplicateSantri(sNama, sWali, rawNama, rawWali)) {
        matchedKey = existingKey;
      }
    });

    const keyToUse = matchedKey || groupKey;
    if (!groups.has(keyToUse)) {
      groups.set(keyToUse, []);
    }
    groups.get(keyToUse)!.push(item);
  }

  const result: DuplicateSantriGroup[] = [];
  Array.from(groups.entries()).forEach(([key, groupItems]) => {
    if (groupItems.length > 1) {
      const sample = groupItems[0];
      result.push({
        key,
        nama: sample.nama || sample.santri?.[0]?.nama || '',
        namaWali: sample.namaWali || sample.nama_wali || '',
        items: groupItems,
      });
    }
  });

  return result;
}

/**
 * Menggabungkan satu grup data santri duplikat di Supabase database.
 * Menggabungkan sub_kategori, memilih kuota_dasar tertinggi, mengakumulasi kuota_tambahan & terpakai,
 * memperbarui relasi log presensi/pembelian, dan menghapus baris duplikat.
 */
export async function mergeDuplicateSantriGroupInSupabase(
  supabaseClient: any,
  group: DuplicateSantriGroup
): Promise<{ primaryKode: string; mergedSubKategori: string; deletedKodes: string[] }> {
  const items = group.items;
  if (items.length < 2) {
    throw new Error('Grup tidak memiliki data duplikat yang cukup untuk digabung.');
  }

  // Pilih Primary Record yang akan dipertahankan:
  // Prioritaskan yang memiliki sub-kategori TAMATAN dengan bagian spesifik (misal Tamatan A.04),
  // atau yang memiliki created_at lebih baru / id lengkap
  let primary = items.find(
    (it) =>
      (it.kategori_utama === 'TAMATAN' || it.kategoriUtama === 'TAMATAN') &&
      String(it.sub_kategori || it.subKategori || '').includes('(')
  );

  if (!primary) {
    primary = items.find(
      (it) =>
        (it.kategori_utama === 'TAMATAN' || it.kategoriUtama === 'TAMATAN') ||
        (it.kategori_utama === 'BIL_GHOIB' || it.kategoriUtama === 'BIL_GHOIB')
    );
  }

  if (!primary) {
    primary = items[0];
  }

  const duplicates = items.filter((it) => it.id !== primary.id);
  const primaryKode = primary.kode;
  const deletedKodes: string[] = [];

  let mergedSub = primary.sub_kategori || primary.subKategori || '';
  let resolvedKat = primary.kategori_utama || primary.kategoriUtama || 'BIN_NADZOR';
  let maxKuotaDasar = Number(primary.kuota_dasar || primary.kuotaDasar || 2);
  let totalKuotaTambahan = Number(primary.kuota_tambahan || primary.kuotaTambahan || 0);
  let totalKuotaTerpakai = Number(primary.kuota_terpakai || primary.terpakai || 0);

  let bestNoHp = primary.no_hp || primary.noHp || '';
  let bestKamar = primary.kamar || '';
  let bestAlamat = primary.alamat || '';

  for (const dup of duplicates) {
    const dupSub = dup.sub_kategori || dup.subKategori || '';
    const dupKat = dup.kategori_utama || dup.kategoriUtama || '';
    const dupKuotaDasar = Number(dup.kuota_dasar || dup.kuotaDasar || 0);
    const dupKuotaTambahan = Number(dup.kuota_tambahan || dup.kuotaTambahan || 0);
    const dupKuotaTerpakai = Number(dup.kuota_terpakai || dup.terpakai || 0);

    mergedSub = mergeSubKategori(mergedSub, dupSub);
    resolvedKat = resolvePriorityKategoriUtama(resolvedKat, dupKat, mergedSub);
    maxKuotaDasar = Math.max(maxKuotaDasar, dupKuotaDasar, calculateKuotaDasarSantri(resolvedKat, mergedSub));
    totalKuotaTambahan += dupKuotaTambahan;
    totalKuotaTerpakai += dupKuotaTerpakai;

    const dupHp = dup.no_hp || dup.noHp || '';
    if ((!bestNoHp || bestNoHp === '-') && dupHp && dupHp !== '-') {
      bestNoHp = dupHp;
    }
    const dupKamar = dup.kamar || '';
    if ((!bestKamar || bestKamar === '-') && dupKamar && dupKamar !== '-') {
      bestKamar = dupKamar;
    }
    const dupAlamat = dup.alamat || '';
    if ((!bestAlamat || bestAlamat === '-' || bestAlamat === 'Kediri') && dupAlamat && dupAlamat !== '-') {
      bestAlamat = dupAlamat;
    }

    const dupKode = dup.kode;
    deletedKodes.push(dupKode);

    // 1. Alihkan referensi log presensi ke primaryKode
    try {
      await supabaseClient
        .from('presensi_log')
        .update({ kode_qr: primaryKode })
        .eq('kode_qr', dupKode);
    } catch (e) {
      console.warn(`[Merge] Gagal mengalihkan presensi_log ${dupKode}:`, e);
    }

    // 2. Alihkan referensi pembelian kuota ke primaryKode
    try {
      await supabaseClient
        .from('pembelian_kuota')
        .update({ kode_santri: primaryKode })
        .eq('kode_santri', dupKode);
    } catch (e) {
      console.warn(`[Merge] Gagal mengalihkan pembelian_kuota ${dupKode}:`, e);
    }

    // 3. Alihkan audit_log ke primaryKode
    try {
      await supabaseClient
        .from('audit_log')
        .update({ kode: primaryKode })
        .eq('kode', dupKode);
    } catch (e) {
      console.warn(`[Merge] Gagal mengalihkan audit_log ${dupKode}:`, e);
    }

    // 4. Hapus baris duplikat dari peserta_santri
    const { error: delErr } = await supabaseClient
      .from('peserta_santri')
      .delete()
      .eq('id', dup.id);

    if (delErr) {
      console.error(`[Merge] Gagal menghapus santri duplikat ${dupKode} (${dup.id}):`, delErr);
      throw delErr;
    }
  }

  const resolvedWarna = getWarnaTiketSantri(resolvedKat, mergedSub);

  // 5. Update data primary santri dengan kategori yang sudah tergabung
  const updatePayload: any = {
    kategori_utama: resolvedKat,
    sub_kategori: mergedSub,
    kuota_dasar: maxKuotaDasar,
    kuota_tambahan: totalKuotaTambahan,
    kuota_terpakai: totalKuotaTerpakai,
    warna_tiket: resolvedWarna,
    updated_at: new Date().toISOString(),
  };

  if (bestNoHp) updatePayload.no_hp = bestNoHp;
  if (bestKamar) updatePayload.kamar = bestKamar;
  if (bestAlamat) updatePayload.alamat = bestAlamat;

  const { error: updErr } = await supabaseClient
    .from('peserta_santri')
    .update(updatePayload)
    .eq('id', primary.id);

  if (updErr) {
    console.error(`[Merge] Gagal mengupdate primary santri ${primaryKode}:`, updErr);
    throw updErr;
  }

  // 6. Catat riwayat di Audit Log
  await logAudit({
    panitia_id: 'SYSTEM_AUTO_MERGE',
    panitia_role: 'ADMIN',
    aksi: 'UPDATE_PESERTA',
    tabel: 'peserta_santri',
    kode: primaryKode,
    nama: primary.nama,
    field: 'gabung_kategori_duplikat',
    nilai_lama: `${primary.sub_kategori || primary.subKategori} (Duplikat: ${deletedKodes.join(', ')})`,
    nilai_baru: mergedSub,
    catatan: `Penggabungan Kategori Dobel Otomatis: ${mergedSub}. Menghapus data duplikat kode ${deletedKodes.join(', ')}`,
  }).catch((err) => console.warn('[Merge] Audit log error:', err));

  return {
    primaryKode,
    mergedSubKategori: mergedSub,
    deletedKodes,
  };
}

/**
 * Memindai seluruh peserta_santri di Supabase, mendeteksi semua santri duplikat,
 * dan menggabungkannya secara otomatis sekali jalan.
 */
export async function autoMergeAllDuplicatesInSupabase(
  supabaseClient: any
): Promise<{
  success: boolean;
  mergedGroupsCount: number;
  details: Array<{ nama: string; namaWali: string; primaryKode: string; mergedSub: string; deletedKodes: string[] }>;
}> {
  const { data: allSantri, error } = await supabaseClient
    .from('peserta_santri')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Gagal memuat data peserta_santri dari Supabase: ${error.message}`);
  }

  const groups = findDuplicateSantriInList(allSantri || []);
  if (groups.length === 0) {
    return {
      success: true,
      mergedGroupsCount: 0,
      details: [],
    };
  }

  const details: any[] = [];
  for (const grp of groups) {
    const res = await mergeDuplicateSantriGroupInSupabase(supabaseClient, grp);
    details.push({
      nama: grp.nama,
      namaWali: grp.namaWali,
      primaryKode: res.primaryKode,
      mergedSub: res.mergedSubKategori,
      deletedKodes: res.deletedKodes,
    });
  }

  return {
    success: true,
    mergedGroupsCount: groups.length,
    details,
  };
}

export interface DuplicateTamuGroup {
  key: string;
  nama: string;
  kota: string;
  items: any[];
}

export function cleanHonorificTamuName(name?: string | null): string {
  if (!name) return '';
  return name
    .toUpperCase()
    .replace(/\b(KH|K|GUS|USTADZ|UST|USTAZAH|USTH|NYAI|NING|HJ|H|DRS|DRA|DR|PROF)\.?\b/gi, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Memindai daftar tamu undangan dan mengelompokkan data yang memiliki
 * Nama Utama (Putra/Putri/Tamu) dan Kota (Alamat) yang sama.
 */
export function findDuplicateTamuInList(items: any[]): DuplicateTamuGroup[] {
  if (!items || items.length === 0) return [];

  // Hanya periksa tamu yang BELUM digabung
  const unmerged = items.filter(
    (it) =>
      (it.tipe === 'UNDANGAN' || it.kode?.startsWith('UND') || it.golonganUndangan) &&
      !it.isMerged &&
      !it.merged_group_id
  );

  const groups: any[][] = [];

  for (const item of unmerged) {
    const rawPutra = item.namaPutra || item.nama_putra || '';
    const rawPutri = item.namaPutri || item.nama_putri || '';
    const rawNama = item.nama || '';

    // Ambil nama identitas: putra, putri (bukan 'ISTRI'), atau sebelum '&'
    const nameCandidate =
      rawPutra ||
      (rawPutri && rawPutri.toUpperCase() !== 'ISTRI' ? rawPutri : '') ||
      rawNama.split('&')[0];
    const cleanName = cleanHonorificTamuName(nameCandidate);
    if (!cleanName || cleanName.length < 3) continue;

    const rawAlamat = (item.alamat || item.instansi || '').trim().toUpperCase();
    const city = rawAlamat.split(/[\s,.-]+/).pop() || '';

    let matchedGroup: any[] | null = null;
    for (const grp of groups) {
      const sample = grp[0];
      const sPutra = sample.namaPutra || sample.nama_putra || '';
      const sPutri = sample.namaPutri || sample.nama_putri || '';
      const sNama = sample.nama || '';
      const sNameCandidate =
        sPutra ||
        (sPutri && sPutri.toUpperCase() !== 'ISTRI' ? sPutri : '') ||
        sNama.split('&')[0];
      const sCleanName = cleanHonorificTamuName(sNameCandidate);

      const nameMatches =
        cleanName === sCleanName ||
        (cleanName.length > 5 && sCleanName.includes(cleanName)) ||
        (sCleanName.length > 5 && cleanName.includes(sCleanName));

      if (nameMatches) {
        const sAlamat = (sample.alamat || sample.instansi || '').trim().toUpperCase();
        const sCity = sAlamat.split(/[\s,.-]+/).pop() || '';
        const cityMatches =
          !city ||
          !sCity ||
          city === '-' ||
          sCity === '-' ||
          city === sCity ||
          city.includes(sCity) ||
          sCity.includes(city);

        if (cityMatches) {
          matchedGroup = grp;
          break;
        }
      }
    }

    if (matchedGroup) {
      matchedGroup.push(item);
    } else {
      groups.push([item]);
    }
  }

  const result: DuplicateTamuGroup[] = [];
  for (const grp of groups) {
    if (grp.length > 1) {
      const sample = grp[0];
      result.push({
        key: `tamu-dup-${sample.id || sample.kode}`,
        nama: sample.nama,
        kota: (sample.alamat || '').trim().split(/[\s,.-]+/).pop() || 'Kediri',
        items: grp,
      });
    }
  }

  return result;
}
