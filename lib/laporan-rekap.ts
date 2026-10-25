import { supabase } from '@/lib/supabase';
import { getWarnaTiketUndangan, getWarnaTiketSantri } from '@/lib/types';
import * as XLSX from 'xlsx';

// Definisikan 20 Rincian Sub-Kategori Tamu Undangan (Blok 3) Terkelompok Berdasarkan 3 Kategori Utama
export const BLOK_3_SUBKATEGORI_DEFINITIONS = [
  // ── KATEGORI UTAMA 1: TAMU ISTIMEWA ──
  { no: 16, kategoriUtama: 'Tamu Istimewa', kategori: 'VVIP', matchers: ['vvip'], warna: '' },
  { no: 17, kategoriUtama: 'Tamu Istimewa', kategori: 'VIP Bani Marzuqi', matchers: ['marzuqi'], warna: '' },
  { no: 18, kategoriUtama: 'Tamu Istimewa', kategori: 'VIP Bani Qomariyah', matchers: ['qomariyah'], warna: '' },
  { no: 19, kategoriUtama: 'Tamu Istimewa', kategori: 'VIP Bani Mahrus (Zainab)', matchers: ['mahrus', 'zainab'], warna: '' },
  { no: 20, kategoriUtama: 'Tamu Istimewa', kategori: 'VIP Bani Salamah', matchers: ['salamah'], warna: '' },
  { no: 21, kategoriUtama: 'Tamu Istimewa', kategori: 'VIP Bani Aisyah', matchers: ['aisyah'], warna: '' },
  { no: 22, kategoriUtama: 'Tamu Istimewa', kategori: 'VIP Bandar', matchers: ['bandar'], warna: '' },
  { no: 23, kategoriUtama: 'Tamu Istimewa', kategori: 'VIP Keluarga Kunir – Blitar', matchers: ['kunir', 'blitar'], warna: '' },
  { no: 24, kategoriUtama: 'Tamu Istimewa', kategori: 'VIP IDS', matchers: ['vip ids', 'ids'], warna: 'Merah Gold' },

  // ── KATEGORI UTAMA 2: TAMU KEHORMATAN ──
  { no: 25, kategoriUtama: 'Tamu Kehormatan', kategori: 'Tamu Kehormatan', matchers: ['kehormatan', 'tamu kehormatan', 'undangan_kehormatan'], warna: '' },

  // ── KATEGORI UTAMA 3: TAMU UMUM ──
  { no: 26, kategoriUtama: 'Tamu Umum', kategori: 'Asatidz Mhmtq Sekalian', matchers: ['asatidz mhmtq', 'masyaikh', 'masyayikh'], warna: 'Merah Gold' },
  { no: 27, kategoriUtama: 'Tamu Umum', kategori: 'Asatidz Purna Bakti', matchers: ['purna bakti'], warna: 'Merah Gold' },
  { no: 28, kategoriUtama: 'Tamu Umum', kategori: 'Asatidzah Mhmtq Nduduk Rumah', matchers: ['nduduk'], warna: 'Merah Gold' },
  { no: 29, kategoriUtama: 'Tamu Umum', kategori: 'Mustahiq Tamatan Non Purna', matchers: ['mustahiq non purna', 'non purna'], warna: 'Merah Gold' },
  { no: 30, kategoriUtama: 'Tamu Umum', kategori: 'Purna Mustahiqoh Ibtidaiyyah Tamatan Aliyah', matchers: ['purna mustahiqoh', 'mustahiqoh'], warna: 'Merah Gold' },
  { no: 31, kategoriUtama: 'Tamu Umum', kategori: 'Pengajar Ekstrakurikuler Pondok (Mutakhorijin)', matchers: ['ekstrakurikuler', 'ekstra', 'mutakhorijin'], warna: 'Merah Gold' },
  { no: 32, kategoriUtama: 'Tamu Umum', kategori: 'Pengajar Unit', matchers: ['pengajar unit', 'unit'], warna: 'Merah Gold' },
  { no: 33, kategoriUtama: 'Tamu Umum', kategori: "Penguji Al-Qur'an", matchers: ['penguji'], warna: 'Merah Gold' },
  { no: 34, kategoriUtama: 'Tamu Umum', kategori: 'Perwakilan Pondok', matchers: ['perwakilan'], warna: 'Merah Gold' },
  { no: 35, kategoriUtama: 'Tamu Umum', kategori: 'Tamu Umum / Lainnya', matchers: [], warna: 'Merah Gold' },
];

// Template 14 Kategori Santri
export const templateBlokSantri = [
  { no: 1, kategori: 'Bil Ghoib (Khadimatul Qur-an)', warna: 'Hitam Gold' },
  { no: 2, kategori: 'Bin Nadzori 2 Tsanawiyah', warna: 'Merah Gold' },
  { no: 3, kategori: 'Bin Nadzori 3 Tsanawiyah', warna: 'Merah Gold' },
  { no: 4, kategori: 'Bin Nadzori 1 Aliyah', warna: 'Merah Gold' },
  { no: 5, kategori: 'Bin Nadzori 2 Aliyah', warna: 'Merah Gold' },
  { no: 6, kategori: 'Bin Nadzori 3 Aliyah', warna: 'Merah Gold' },
  { no: 7, kategori: 'Bin Nadzori Mutakhorijat', warna: 'Merah Gold' },
  { no: 8, kategori: 'Tamatan Bagian A.01', warna: 'Merah Gold' },
  { no: 9, kategori: 'Tamatan Bagian A.02', warna: 'Merah Gold' },
  { no: 10, kategori: 'Tamatan Bagian A.03', warna: 'Merah Gold' },
  { no: 11, kategori: 'Tamatan Bagian A.04', warna: 'Merah Gold' },
  { no: 12, kategori: 'Tamatan Bagian B.01', warna: 'Merah Gold' },
  { no: 13, kategori: 'Tamatan Bagian B.02', warna: 'Merah Gold' },
  { no: 14, kategori: 'Tamatan Bagian B.03', warna: 'Merah Gold' },
];

export const getSantriIndex = (s: any) => {
  const kat = s.kategori_utama || 'BIL_GHOIB';
  const sub = (s.sub_kategori || '').toLowerCase();
  const kelas = (s.kelas || '').toLowerCase();

  if (kat === 'BIL_GHOIB' || sub.includes('bil ghoib')) return 0;

  if (kat === 'BIN_NADZOR') {
    if (kelas.includes('2 tsanawiyah') || kelas.includes('2 tsanawi') || kelas.includes('2 tsn') || sub.includes('2 tsn')) return 1;
    if (kelas.includes('3 tsanawiyah') || kelas.includes('3 tsanawi') || kelas.includes('3 tsn') || sub.includes('3 tsn')) return 2;
    if (kelas.includes('1 aliyah') || kelas.includes('1 aly') || sub.includes('1 aly')) return 3;
    if (kelas.includes('2 aliyah') || kelas.includes('2 aly') || sub.includes('2 aly')) return 4;
    if (sub.includes('mutakhorijat') || kelas.includes('mutakhorijat')) return 6;
    if (kelas.includes('3 aliyah') || kelas.includes('3 aly') || sub.includes('3 aly')) return 5;
    return 1;
  }

  if (kat === 'TAMATAN') {
    const combined = (sub + ' ' + kelas).toUpperCase();
    if (combined.includes('A.01')) return 7;
    if (combined.includes('A.02')) return 8;
    if (combined.includes('A.03')) return 9;
    if (combined.includes('A.04')) return 10;
    if (combined.includes('B.01')) return 11;
    if (combined.includes('B.02')) return 12;
    if (combined.includes('B.03')) return 13;
    return 7;
  }

  return 0;
};

export const getBlok3Index = (und: any) => {
  const gol = (und.sub_kategori || und.subKategori || und.golongan || '').toUpperCase();
  const kat = (und.kategori || '').toLowerCase();
  const inst = (und.instansi || '').toLowerCase();
  const nama = (und.nama || '').toLowerCase();
  const alamat = (und.alamat || '').toLowerCase();
  const combined = `${kat} ${gol} ${inst} ${nama} ${alamat}`.toLowerCase();

  // Jika secara eksplisit KEHORMATAN
  if (gol === 'KEHORMATAN' || combined.includes('kehormatan')) {
    return 9; // Tamu Kehormatan berada pada index 9 (no 25)
  }

  for (let i = 0; i < BLOK_3_SUBKATEGORI_DEFINITIONS.length - 1; i++) {
    if (i === 9) continue;
    const def = BLOK_3_SUBKATEGORI_DEFINITIONS[i];
    if (def.matchers.some((m) => combined.includes(m))) {
      return i;
    }
  }

  return BLOK_3_SUBKATEGORI_DEFINITIONS.length - 1; // Index 19: Tamu Umum / Lainnya (no 35)
};

export async function fetchLaporanDataFromSupabase() {
  const [resSantri, resTamu, resLogs] = await Promise.all([
    supabase.from('peserta_santri').select('*').order('created_at', { ascending: false }),
    supabase.from('tamu_undangan').select('*').order('created_at', { ascending: false }),
    supabase.from('presensi_log').select('*').order('created_at', { ascending: false }),
  ]);

  const rawSantri = resSantri.data || [];
  const rawTamu = resTamu.data || [];

  // Auto update massal di Supabase jika ada Tamu Umum yang di database warna_tiket-nya belum 'Merah Gold'
  const unassignedUmumInDb = rawTamu.filter((u: any) => {
    const gol = (u.sub_kategori || u.golongan || '').toUpperCase();
    return (gol === 'UMUM' || gol === 'UNDANGAN_UMUM' || gol === 'TAMU_UMUM') && u.warna_tiket !== 'Merah Gold';
  });

  if (unassignedUmumInDb.length > 0) {
    supabase
      .from('tamu_undangan')
      .update({ warna_tiket: 'Merah Gold' })
      .or('sub_kategori.eq.UMUM,sub_kategori.eq.UNDANGAN_UMUM,sub_kategori.eq.TAMU_UMUM')
      .then(
        () => {},
        (err) => console.warn('Mass update warning:', err)
      );
  }

  // Auto update massal di Supabase jika ada peserta_santri non-Bil Ghoib yang di database warna_tiket-nya belum 'Merah Gold'
  const unassignedSantriInDb = rawSantri.filter((s: any) => {
    const kat = (s.kategori_utama || '').toUpperCase();
    const sub = (s.sub_kategori || '').toLowerCase();
    const isBilGhoib = kat === 'BIL_GHOIB' || sub.includes('bil ghoib');
    if (isBilGhoib) {
      return s.warna_tiket !== 'Hitam Gold';
    }
    return s.warna_tiket !== 'Merah Gold';
  });

  if (unassignedSantriInDb.length > 0) {
    supabase
      .from('peserta_santri')
      .update({ warna_tiket: 'Hitam Gold' })
      .or('kategori_utama.eq.BIL_GHOIB,sub_kategori.ilike.%bil ghoib%')
      .then(
        () => {},
        (err) => console.warn('Mass update santri Bil Ghoib warning:', err)
      );

    supabase
      .from('peserta_santri')
      .update({ warna_tiket: 'Merah Gold' })
      .not('kategori_utama', 'eq', 'BIL_GHOIB')
      .then(
        () => {},
        (err) => console.warn('Mass update santri Non-Bil Ghoib warning:', err)
      );
  }

  const santriList = rawSantri.map((s: any) => ({
    ...s,
    warna_tiket: getWarnaTiketSantri(s.kategori_utama, s.sub_kategori),
  }));

  const tamuList = rawTamu.map((u: any) => {
    const gol = (u.sub_kategori || u.golongan || '').toUpperCase();
    const isUmum = gol === 'UMUM' || gol === 'UNDANGAN_UMUM' || gol === 'TAMU_UMUM';
    return {
      ...u,
      warna_tiket: isUmum ? 'Merah Gold' : (u.warna_tiket || getWarnaTiketUndangan(u.sub_kategori, u.kategori)),
    };
  });

  const presensiLogs = resLogs.data || [];

  return { santriList, tamuList, presensiLogs };
}

export function computeLaporanThreeBlocks(
  santriList: any[],
  tamuList: any[],
  presensiLogs: any[]
) {
  // Kalkulasi Blok 1: Santri Sohibul Hajat
  const blokSantri = templateBlokSantri.map((tpl) => ({
    ...tpl,
    sh: 0,
    l: 0,
    p: 0,
    total: 0,
    kuota: 0,
    pct: 0,
  }));

  for (const s of santriList) {
    const idx = getSantriIndex(s);
    if (blokSantri[idx]) {
      blokSantri[idx].sh += 1;
      const kTot = Number(s.kuota_dasar || 2) + Number(s.kuota_tambahan || 0);
      blokSantri[idx].kuota += kTot;

      if (s.warna_tiket) {
        blokSantri[idx].warna = s.warna_tiket;
      }

      const terpakai = Number(s.kuota_terpakai || 0);
      const logs = presensiLogs.filter((l) => l.kode_qr === s.kode);
      let hadirL = 0;
      let hadirP = 0;
      if (logs.length > 0) {
        for (const l of logs) {
          hadirL += Number(l.jumlah_l || l.jumlahL || 0);
          hadirP += Number(l.jumlah_p || l.jumlahP || 0);
        }
      } else if (terpakai > 0) {
        hadirL += Math.ceil(terpakai / 2);
        hadirP += Math.floor(terpakai / 2);
      }
      blokSantri[idx].l += hadirL;
      blokSantri[idx].p += hadirP;
      blokSantri[idx].total += terpakai > 0 ? terpakai : hadirL + hadirP;
    }
  }

  for (const row of blokSantri) {
    row.pct = row.kuota > 0 ? Math.round((row.total / row.kuota) * 1000) / 10 : 0;
  }

  const subtotalSantri = blokSantri.reduce(
    (acc, row) => ({
      sh: acc.sh + row.sh,
      l: acc.l + row.l,
      p: acc.p + row.p,
      total: acc.total + row.total,
      kuota: acc.kuota + row.kuota,
    }),
    { sh: 0, l: 0, p: 0, total: 0, kuota: 0 }
  );
  const pctSubtotalSantri =
    subtotalSantri.kuota > 0
      ? Math.round((subtotalSantri.total / subtotalSantri.kuota) * 1000) / 10
      : 0;

  // Kalkulasi Blok 2: Kuota Tambahan (300)
  let tambahanSh = 0;
  let tambahanKuota = 0;
  let tambahanHadirL = 0;
  let tambahanHadirP = 0;
  let tambahanHadirTotal = 0;

  for (const s of santriList) {
    const kExtra = Number(s.kuota_tambahan || 0);
    const terpakai = Number(s.kuota_terpakai || 0);
    const kDasar = Number(s.kuota_dasar || 2);
    if (kExtra > 0) {
      tambahanSh += 1;
      tambahanKuota += kExtra;
      if (terpakai > kDasar) {
        const lebih = terpakai - kDasar;
        const pakai = Math.min(kExtra, lebih);
        tambahanHadirTotal += pakai;
        tambahanHadirL += Math.ceil(pakai / 2);
        tambahanHadirP += Math.floor(pakai / 2);
      }
    }
  }

  const blokTambahan = [
    {
      no: 15,
      kategori: 'Kuota Tambahan (300)',
      sh: tambahanSh,
      l: tambahanHadirL,
      p: tambahanHadirP,
      total: tambahanHadirTotal,
      kuota: tambahanKuota > 0 ? tambahanKuota : 300,
      pct:
        (tambahanKuota > 0 ? tambahanKuota : 300) > 0
          ? Math.round((tambahanHadirTotal / (tambahanKuota > 0 ? tambahanKuota : 300)) * 1000) / 10
          : 0,
      warna: 'Merah Gold',
    },
  ];

  // Kalkulasi Blok 3: Tamu Undangan
  const blokUndangan = BLOK_3_SUBKATEGORI_DEFINITIONS.map((tpl) => ({
    no: tpl.no,
    kategoriUtama: tpl.kategoriUtama,
    kategori: tpl.kategori,
    warna: tpl.warna,
    sh: 0,
    l: 0,
    p: 0,
    total: 0,
    kuota: 0,
    pct: 0,
  }));

  for (const und of tamuList) {
    const idx = getBlok3Index(und);
    if (blokUndangan[idx]) {
      blokUndangan[idx].sh += 1;
      const kBase =
        (und.nama_putra && String(und.nama_putra).trim() !== '' ? 1 : 0) +
        (und.nama_putri && String(und.nama_putri).trim() !== '' ? 1 : 0);
      const kTot = kBase + Number(und.kuota_tambahan || 0);
      blokUndangan[idx].kuota += kTot;

      if (und.warna_tiket !== undefined && und.warna_tiket !== null && und.warna_tiket !== '') {
        blokUndangan[idx].warna = und.warna_tiket;
      }

      const terpakai = Number(und.kuota_terpakai || 0);
      const logs = presensiLogs.filter((l) => l.kode_qr === und.kode);
      let hadirL = 0;
      let hadirP = 0;
      if (logs.length > 0) {
        for (const l of logs) {
          hadirL += Number(l.jumlah_l || l.jumlahL || 0);
          hadirP += Number(l.jumlah_p || l.jumlahP || 0);
        }
      } else if (terpakai > 0) {
        hadirL += Math.ceil(terpakai / 2);
        hadirP += Math.floor(terpakai / 2);
      }

      blokUndangan[idx].l += hadirL;
      blokUndangan[idx].p += hadirP;
      blokUndangan[idx].total += terpakai > 0 ? terpakai : hadirL + hadirP;
    }
  }

  for (const row of blokUndangan) {
    row.pct = row.kuota > 0 ? Math.round((row.total / row.kuota) * 1000) / 10 : 0;
  }

  const subtotalUndangan = blokUndangan.reduce(
    (acc, row) => ({
      sh: acc.sh + row.sh,
      l: acc.l + row.l,
      p: acc.p + row.p,
      total: acc.total + row.total,
      kuota: acc.kuota + row.kuota,
    }),
    { sh: 0, l: 0, p: 0, total: 0, kuota: 0 }
  );
  const pctSubtotalUndangan =
    subtotalUndangan.kuota > 0
      ? Math.round((subtotalUndangan.total / subtotalUndangan.kuota) * 1000) / 10
      : 0;

  const rowsIstimewa = blokUndangan.filter((r) => r.kategoriUtama === 'Tamu Istimewa');
  const rowsKehormatan = blokUndangan.filter((r) => r.kategoriUtama === 'Tamu Kehormatan');
  const rowsUmum = blokUndangan.filter((r) => r.kategoriUtama === 'Tamu Umum');

  const subtotalIstimewa = rowsIstimewa.reduce(
    (a, b) => ({ sh: a.sh + b.sh, l: a.l + b.l, p: a.p + b.p, total: a.total + b.total, kuota: a.kuota + b.kuota }),
    { sh: 0, l: 0, p: 0, total: 0, kuota: 0 }
  );
  const pctIstimewa =
    subtotalIstimewa.kuota > 0
      ? Math.round((subtotalIstimewa.total / subtotalIstimewa.kuota) * 1000) / 10
      : 0;

  const subtotalKehormatan = rowsKehormatan.reduce(
    (a, b) => ({ sh: a.sh + b.sh, l: a.l + b.l, p: a.p + b.p, total: a.total + b.total, kuota: a.kuota + b.kuota }),
    { sh: 0, l: 0, p: 0, total: 0, kuota: 0 }
  );
  const pctKehormatan =
    subtotalKehormatan.kuota > 0
      ? Math.round((subtotalKehormatan.total / subtotalKehormatan.kuota) * 1000) / 10
      : 0;

  const subtotalUmum = rowsUmum.reduce(
    (a, b) => ({ sh: a.sh + b.sh, l: a.l + b.l, p: a.p + b.p, total: a.total + b.total, kuota: a.kuota + b.kuota }),
    { sh: 0, l: 0, p: 0, total: 0, kuota: 0 }
  );
  const pctUmum =
    subtotalUmum.kuota > 0
      ? Math.round((subtotalUmum.total / subtotalUmum.kuota) * 1000) / 10
      : 0;

  const countBilGhoib = santriList.filter((s) => (s.kategori_utama || '').toUpperCase() === 'BIL_GHOIB').length;
  const countBinNadzor = santriList.filter((s) => (s.kategori_utama || '').toUpperCase() === 'BIN_NADZOR').length;
  const countTamatan = santriList.filter((s) => (s.kategori_utama || '').toUpperCase() === 'TAMATAN').length;

  return {
    blokSantri,
    subtotalSantri,
    pctSubtotalSantri,
    blokTambahan,
    blokUndangan,
    subtotalUndangan,
    pctSubtotalUndangan,
    rowsIstimewa,
    rowsKehormatan,
    rowsUmum,
    subtotalIstimewa,
    pctIstimewa,
    subtotalKehormatan,
    pctKehormatan,
    subtotalUmum,
    pctUmum,
    countBilGhoib,
    countBinNadzor,
    countTamatan,
  };
}

export function exportLaporanRekapExcel(
  blokSantri: any[],
  subtotalSantri: any,
  pctSubtotalSantri: number,
  blokTambahan: any[],
  blokUndangan: any[],
  subtotalUndangan: any,
  pctSubtotalUndangan: number
) {
  const dataForExport = [
    ['LEMBAR REKAPITULASI PRESENSI HAUL & HAFLAH 1448 H / 2027 M'],
    ['PONDOK PESANTREN PUTRI TAHFIZHIL QUR-AN (P3TQ) — MADRASAH HIDAYATUL MUBTADI-AAT FITTAHFIZHI WAL QIRO-AT (MHMTQ) LIRBOYO KEDIRI'],
    ['Alamat: Jl. HM. Winarto, Campurejo, Kec. Mojoroto, Kabupaten Kediri, Jawa Timur 64117'],
    ['Tanggal Acara: Sabtu, 24 Rajab 1448 H. / 02 Januari 2027 M.'],
    [],
    ['No', 'Kategori Utama', 'Rincian Sub-Kategori', 'Warna Tiket', 'Jumlah Tamu', 'WS Laki-laki', 'WS Perempuan', 'Total Hadir', 'Total Kuota', 'Prosentase (%)'],
    ...blokSantri.map((r) => [r.no, 'Wali Santri Shohibul Hajat', r.kategori, r.warna || '', r.sh, r.l, r.p, r.total, r.kuota, `${r.pct}%`]),
    ['', '', `SUBTOTAL WALI SANTRI SHOHIBUL HAJAT (${subtotalSantri.sh} SANTRI)`, '', subtotalSantri.sh, subtotalSantri.l, subtotalSantri.p, subtotalSantri.total, subtotalSantri.kuota, `${pctSubtotalSantri}%`],
    [],
    ['-- BLOK 2: KUOTA TAMBAHAN (300) --'],
    ...blokTambahan.map((r) => [r.no, 'Kuota Tambahan', r.kategori, r.warna || '', r.sh, r.l, r.p, r.total, r.kuota, `${r.pct}%`]),
    [],
    ['-- BLOK 3: TAMU UNDANGAN (TERKELOMPOK KATEGORI UTAMA) --'],
    ...blokUndangan.map((r) => [r.no, r.kategoriUtama, r.kategori, r.warna || '', r.sh, r.l, r.p, r.total, r.kuota, `${r.pct}%`]),
    ['', '', `SUBTOTAL TAMU UNDANGAN KESELURUHAN (${subtotalUndangan.sh} TAMU)`, '', subtotalUndangan.sh, subtotalUndangan.l, subtotalUndangan.p, subtotalUndangan.total, subtotalUndangan.kuota, `${pctSubtotalUndangan}%`],
  ];

  const ws = XLSX.utils.aoa_to_sheet(dataForExport);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rekapitulasi 3 Blok');

  XLSX.writeFile(wb, `Rekapitulasi_Haul_Haflah_2027_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
