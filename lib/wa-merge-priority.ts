import { BAGIAN_TAMATAN_LIST, extractBagianTamatan } from '@/lib/types';

export type WaRecordType = 'SANTRI' | 'TAMU';

const BIN_NADZOR_SUB_ORDER = [
  '1 ALIYAH',
  '2 ALIYAH',
  '3 ALIYAH',
  '1 TSANAWIYAH',
  '2 TSANAWIYAH',
  '3 TSANAWIYAH',
  'MUTAKHORIJAT',
  'PONDOK TIMUR',
] as const;

function getTamatanBagianScore(bagian: string): number {
  const idx = BAGIAN_TAMATAN_LIST.indexOf(bagian as (typeof BAGIAN_TAMATAN_LIST)[number]);
  return idx !== -1 ? (BAGIAN_TAMATAN_LIST.length - idx) * 10 : 0;
}

function getBinNadzorSubScore(textUpper: string): number {
  const idx = BIN_NADZOR_SUB_ORDER.findIndex((label) => textUpper.includes(label));
  return idx !== -1 ? (BIN_NADZOR_SUB_ORDER.length - idx) * 10 : 0;
}

/**
 * Hitung skor prioritas kategori tertinggi untuk memilih Data Utama
 * pada grup peserta yang digabung (merged_group_id) di WA Gateway.
 *
 * Santri: BIL_GHOIB (3000) > TAMATAN (2000 + A.01..B.03) > BIN_NADZOR (1000 + kelas).
 * Tamu: ISTIMEWA (3000 + VVIP/VIP) > KEHORMATAN (2000) > UMUM (1000).
 */
export function getWaCategoryPriorityScore(item: any, type: WaRecordType): number {
  if (!item) return 0;

  if (type === 'TAMU') {
    const gol = String(item.golongan || item.subKategori || item.sub_kategori || '').trim().toUpperCase();
    const kat = String(item.kategori || '').trim().toUpperCase();
    const tiket = String(item.warnaTiket || item.warna_tiket || '').trim().toUpperCase();

    if (gol === 'ISTIMEWA' || kat.includes('ISTIMEWA') || kat.includes('VVIP') || kat.includes('VIP')) {
      const tierBonus = kat.includes('VVIP') ? 100 : kat.includes('VIP') ? 50 : 0;
      const ticketBonus = tiket === 'CREAM' ? 20 : tiket === 'BIRU' ? 10 : 0;
      return 3000 + tierBonus + ticketBonus;
    }
    if (gol === 'KEHORMATAN' || kat.includes('KEHORMATAN')) {
      return 2000;
    }
    return 1000;
  }

  const s = item.santri?.[0] || item;
  const katUtama = String(s.kategoriUtama || s.kategori_utama || '').trim().toUpperCase();
  const subKat = String(s.subKategori || s.sub_kategori || '');
  const kelas = String(s.kelas || '');
  const subUpper = `${subKat} ${kelas}`.trim().toUpperCase();
  const bagian =
    String(s.bagianTamatan || '').trim() ||
    extractBagianTamatan(subKat) ||
    extractBagianTamatan(kelas);

  if (katUtama === 'BIL_GHOIB') {
    const juzBonus = subUpper.includes('30') ? 20 : subUpper.includes('15') || subUpper.includes('5') ? 10 : 0;
    return 3000 + juzBonus;
  }
  if (katUtama === 'TAMATAN') {
    return 2000 + getTamatanBagianScore(bagian);
  }
  if (katUtama === 'BIN_NADZOR') {
    return 1000 + getBinNadzorSubScore(subUpper);
  }

  // Fallback jika kategori_utama kosong pada data lama
  if (subUpper.includes('BIL GHOIB') || subUpper.includes('BIL_GHOIB')) {
    return 3000;
  }
  if (subUpper.includes('TAMATAN') || bagian) {
    return 2000 + getTamatanBagianScore(bagian);
  }
  return 1000 + getBinNadzorSubScore(subUpper);
}

function hasUsablePhone(phone?: string): boolean {
  return Boolean(phone && String(phone).trim().length >= 8);
}

function resolveBestPhone(sorted: any[]): string {
  const withValidPhone = sorted.find((row) => hasUsablePhone(row.noHp));
  if (withValidPhone) return String(withValidPhone.noHp).trim();
  const withAnyPhone = sorted.find((row) => Boolean(row.noHp && String(row.noHp).trim()));
  return withAnyPhone ? String(withAnyPhone.noHp).trim() : '';
}

function mergeSantriGroup(sorted: any[]): any {
  const primary = sorted[0];
  const anySent = sorted.some((row) => row.statusWa === 'TERKIRIM');
  const anyConfirmed = sorted.some((row) => row.estimasi?.statusKonfirmasi === 'SUDAH');
  const maxKuotaDasar = Math.max(...sorted.map((row) => Number(row.kuota?.kuotaDasar || 0)), 0);
  const sumKuotaTambahan = sorted.reduce((acc, row) => acc + Number(row.kuota?.kuotaTambahan || 0), 0);
  const maxTerpakai = Math.max(...sorted.map((row) => Number(row.kuota?.terpakai || 0)), 0);

  return {
    ...primary,
    noHp: hasUsablePhone(primary.noHp) ? primary.noHp : resolveBestPhone(sorted),
    statusWa: anySent ? 'TERKIRIM' : primary.statusWa,
    mergedCount: sorted.length,
    kuota: {
      kuotaDasar: maxKuotaDasar,
      kuotaTambahan: sumKuotaTambahan,
      terpakai: maxTerpakai,
    },
    estimasi: {
      ...primary.estimasi,
      statusKonfirmasi: anyConfirmed ? 'SUDAH' : primary.estimasi?.statusKonfirmasi || 'BELUM',
    },
  };
}

function mergeTamuGroup(sorted: any[]): any {
  const primary = sorted[0];
  const anySent = sorted.some((row) => row.statusWa === 'TERKIRIM');
  const firstWithPutra = sorted.find((row) => row.namaPutra && String(row.namaPutra).trim());
  const firstWithPutri = sorted.find((row) => row.namaPutri && String(row.namaPutri).trim());

  return {
    ...primary,
    noHp: hasUsablePhone(primary.noHp) ? primary.noHp : resolveBestPhone(sorted),
    namaPutra: primary.namaPutra || firstWithPutra?.namaPutra || null,
    namaPutri: primary.namaPutri || firstWithPutri?.namaPutri || null,
    statusWa: anySent ? 'TERKIRIM' : primary.statusWa,
    mergedCount: sorted.length,
  };
}

/**
 * Deduplikasi item WA berdasarkan merged_group_id dengan memilih tepat satu
 * Data Utama berprioritas kategori tertinggi agar tidak terjadi double counting.
 */
export function deduplicateMergedWaRecords<T extends Record<string, any>>(
  items: T[],
  type: WaRecordType
): T[] {
  const grouped = new Map<string, T[]>();

  for (const item of items) {
    const groupId = item.merged_group_id ? String(item.merged_group_id).trim() : '';
    if (!groupId) continue;
    const list = grouped.get(groupId) || [];
    list.push(item);
    grouped.set(groupId, list);
  }

  if (grouped.size === 0) return items;

  const emittedGroups = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const groupId = item.merged_group_id ? String(item.merged_group_id).trim() : '';
    if (!groupId) {
      result.push(item);
      continue;
    }
    if (emittedGroups.has(groupId)) continue;
    emittedGroups.add(groupId);

    const groupItems = grouped.get(groupId) || [item];
    const sorted = [...groupItems].sort((a, b) => {
      const scoreDiff = getWaCategoryPriorityScore(b, type) - getWaCategoryPriorityScore(a, type);
      if (scoreDiff !== 0) return scoreDiff;
      return String(a.kode || '').localeCompare(String(b.kode || ''));
    });

    result.push((type === 'TAMU' ? mergeTamuGroup(sorted) : mergeSantriGroup(sorted)) as T);
  }

  return result;
}
