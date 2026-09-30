'use client';

import { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Eye,
  Search,
  Filter,
  Users,
  X,
  Clock,
  Sparkles,
  UserCheck,
  UserX,
  Phone,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getWarnaTiketUndangan, getWarnaTiketSantri } from '@/lib/types';
import * as XLSX from 'xlsx';

// Definisikan 20 Rincian Sub-Kategori Tamu Undangan (Blok 3) Terkelompok Berdasarkan 3 Kategori Utama
const BLOK_3_SUBKATEGORI_DEFINITIONS = [
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
  { no: 33, kategoriUtama: 'Tamu Umum', kategori: 'Penguji Al-Qur\'an', matchers: ['penguji'], warna: 'Merah Gold' },
  { no: 34, kategoriUtama: 'Tamu Umum', kategori: 'Perwakilan Pondok', matchers: ['perwakilan'], warna: 'Merah Gold' },
  { no: 35, kategoriUtama: 'Tamu Umum', kategori: 'Tamu Umum / Lainnya', matchers: [], warna: 'Merah Gold' },
];

export default function LaporanPage() {
  const [santriList, setSantriList] = useState<any[]>([]);
  const [tamuList, setTamuList] = useState<any[]>([]);
  const [presensiLogs, setPresensiLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalKategori, setModalKategori] = useState<string | null>(null);
  const [modalSearch, setModalSearch] = useState<string>('');
  const [modalTab, setModalTab] = useState<'HADIR' | 'BELUM_HADIR'>('HADIR');

  // Fetch data murni 100% dari Supabase Cloud & Massal Sync ke Database
  const fetchLaporanData = async () => {
    try {
      const [resSantri, resTamu, resLogs] = await Promise.all([
        supabase.from('peserta_santri').select('*').order('created_at', { ascending: false }),
        supabase.from('tamu_undangan').select('*').order('created_at', { ascending: false }),
        supabase.from('presensi_log').select('*'),
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

      setSantriList(
        rawSantri.map((s: any) => ({
          ...s,
          warna_tiket: getWarnaTiketSantri(s.kategori_utama, s.sub_kategori),
        }))
      );
      setTamuList(
        rawTamu.map((u: any) => {
          const gol = (u.sub_kategori || u.golongan || '').toUpperCase();
          const isUmum = gol === 'UMUM' || gol === 'UNDANGAN_UMUM' || gol === 'TAMU_UMUM';
          return {
            ...u,
            warna_tiket: isUmum ? 'Merah Gold' : (u.warna_tiket || getWarnaTiketUndangan(u.sub_kategori, u.kategori)),
          };
        })
      );
      setPresensiLogs(resLogs.data || []);
    } catch (e) {
      console.error('Error fetching laporan data:', e);
      setSantriList([]);
      setTamuList([]);
      setPresensiLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaporanData();
    const interval = setInterval(fetchLaporanData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Template 14 Kategori Santri
  const templateBlokSantri = [
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

  const getSantriIndex = (s: any) => {
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

      // Ambil warna_tiket murni dari DB jika ada
      if (s.warna_tiket) {
        blokSantri[idx].warna = s.warna_tiket;
      }

      const terpakai = Number(s.kuota_terpakai || 0);
      const logs = presensiLogs.filter(
        (l) => l.kuota_id === s.kode || l.kuota_id === s.id || l.kode_qr === s.kode
      );
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
      blokSantri[idx].total += (terpakai > 0 ? terpakai : hadirL + hadirP);
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
  const pctSubtotalSantri = subtotalSantri.kuota > 0
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
      pct: (tambahanKuota > 0 ? tambahanKuota : 300) > 0 ? Math.round((tambahanHadirTotal / (tambahanKuota > 0 ? tambahanKuota : 300)) * 1000) / 10 : 0,
      warna: 'Merah Gold',
    },
  ];

  // Pencocokan Sub-Kategori Tamu Undangan (Blok 3)
  const getBlok3Index = (und: any) => {
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

  const blokUndangan = BLOK_3_SUBKATEGORI_DEFINITIONS.map((tpl) => ({
    no: tpl.no,
    kategoriUtama: tpl.kategoriUtama,
    kategori: tpl.kategori,
    warna: tpl.warna, // Default warna tiket sesuai ketetapan resmi
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
      const kTot = Number(und.kuota_dasar || 2) + Number(und.kuota_tambahan || 0);
      blokUndangan[idx].kuota += kTot;

      // Ambil warna_tiket murni dari DB jika ada
      if (und.warna_tiket !== undefined && und.warna_tiket !== null && und.warna_tiket !== '') {
        blokUndangan[idx].warna = und.warna_tiket;
      }

      const terpakai = Number(und.kuota_terpakai || 0);
      const logs = presensiLogs.filter(
        (l) => l.kuota_id === und.kode || l.kuota_id === und.id || l.kode_qr === und.kode
      );
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
      blokUndangan[idx].total += (terpakai > 0 ? terpakai : hadirL + hadirP);
    }
  }

  for (const row of blokUndangan) {
    row.pct = row.kuota > 0 ? Math.round((row.total / row.kuota) * 1000) / 10 : 0;
  }

  // Akumulasi Subtotal Keseluruhan Tamu Undangan
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
  const pctSubtotalUndangan = subtotalUndangan.kuota > 0
    ? Math.round((subtotalUndangan.total / subtotalUndangan.kuota) * 1000) / 10
    : 0;

  // Akumulasi Subtotal Per-Kategori Utama (Istimewa / Kehormatan / Umum)
  const rowsIstimewa = blokUndangan.filter((r) => r.kategoriUtama === 'Tamu Istimewa');
  const rowsKehormatan = blokUndangan.filter((r) => r.kategoriUtama === 'Tamu Kehormatan');
  const rowsUmum = blokUndangan.filter((r) => r.kategoriUtama === 'Tamu Umum');

  const subtotalIstimewa = rowsIstimewa.reduce((a, b) => ({ sh: a.sh + b.sh, l: a.l + b.l, p: a.p + b.p, total: a.total + b.total, kuota: a.kuota + b.kuota }), { sh: 0, l: 0, p: 0, total: 0, kuota: 0 });
  const pctIstimewa = subtotalIstimewa.kuota > 0 ? Math.round((subtotalIstimewa.total / subtotalIstimewa.kuota) * 1000) / 10 : 0;

  const subtotalKehormatan = rowsKehormatan.reduce((a, b) => ({ sh: a.sh + b.sh, l: a.l + b.l, p: a.p + b.p, total: a.total + b.total, kuota: a.kuota + b.kuota }), { sh: 0, l: 0, p: 0, total: 0, kuota: 0 });
  const pctKehormatan = subtotalKehormatan.kuota > 0 ? Math.round((subtotalKehormatan.total / subtotalKehormatan.kuota) * 1000) / 10 : 0;

  const subtotalUmum = rowsUmum.reduce((a, b) => ({ sh: a.sh + b.sh, l: a.l + b.l, p: a.p + b.p, total: a.total + b.total, kuota: a.kuota + b.kuota }), { sh: 0, l: 0, p: 0, total: 0, kuota: 0 });
  const pctUmum = subtotalUmum.kuota > 0 ? Math.round((subtotalUmum.total / subtotalUmum.kuota) * 1000) / 10 : 0;

  const countBilGhoib = santriList.filter((s) => (s.kategori_utama || '').toUpperCase() === 'BIL_GHOIB').length;
  const countBinNadzor = santriList.filter((s) => (s.kategori_utama || '').toUpperCase() === 'BIN_NADZOR').length;
  const countTamatan = santriList.filter((s) => (s.kategori_utama || '').toUpperCase() === 'TAMATAN').length;

  // Handler Print
  const handlePrint = () => {
    window.print();
  };

  // Ekspor ke Spreadsheet Excel via SheetJS
  const handleExportExcel = () => {
    const dataForExport = [
      ['LEMBAR REKAPITULASI PRESENSI HAUL & HAFLAH 1448 H / 2027 M'],
      ['PONDOK PESANTREN PUTRI TAHFIZHIL QUR-AN (P3TQ) — MADRASAH HIDAYATUL MUBTADI-AAT FITTAHFIZHI WAL QIRO-AT (MHMTQ) LIRBOYO KEDIRI'],
      ['Alamat: Jl. HM. Winarto, Campurejo, Kec. Mojoroto, Kabupaten Kediri, Jawa Timur 64117'],
      ['Tanggal Acara: Sabtu, 02 Januari 2027 / 24 Rajab 1448 H'],
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
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* HEADER DAN AKSI UTAMA (NO-PRINT) */}
      <div className="bg-gradient-to-r from-[#FAF7F3] via-[#EFE8E1] to-[#FAF7F3] text-[#422F21] rounded-3xl p-6 shadow-sm border-2 border-[#8C6A47]/40 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FAF7F3] text-[#8C6A47] text-xs font-serif font-black border-2 border-[#D49B5B]">
            <Sparkles className="w-3.5 h-3.5 text-[#D49B5B]" />
            <span>DOKUMEN RESMI REKAPITULASI PRESENSI</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-black mt-2 tracking-tight text-[#422F21]">
            Rekap &amp; Ekspor Laporan Presensi Realtime
          </h1>
          <p className="text-xs text-[#7A624E] mt-0.5 font-medium">
            Format rekapitulasi sesuai dokumen resmi Haul &amp; Haflah 2.0 (Blok Santri, Kuota Tambahan 300, &amp; Tamu Undangan terstruktur per Kategori Utama).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow border border-emerald-700 flex items-center space-x-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Excel (.xlsx)</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white font-bold text-xs shadow border border-[#735334] flex items-center space-x-2 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rekap Fisik</span>
          </button>
        </div>
      </div>

      {/* DOKUMEN REKAP RESMI (SIAP CETAK) */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 space-y-6 print:p-0 print:border-none print:shadow-none">
        {/* Kop Resmi Lembar Rekap Panitia */}
        <div className="text-center pb-6 border-b-2 border-slate-900 space-y-2">
          <div className="flex justify-center items-center space-x-3 mb-2">
            <img src="/images/logo-p3tq.png" alt="Logo P3TQ" className="w-12 h-12 object-contain" />
            <img src="/images/logo-haul-black.png" alt="Kaligrafi Haul Haflah" className="h-10 object-contain" />
            <img src="/images/logo-mhmtq.png" alt="Logo MHMTQ" className="w-12 h-12 object-contain" />
          </div>
          <h2 className="text-lg sm:text-xl font-serif font-black text-slate-900 uppercase tracking-tight">
            LEMBAR REKAPITULASI PRESENSI HAUL &amp; HAFLAH 1448 H / 2027 M
          </h2>
          <p className="text-xs font-bold text-slate-700">
            PONDOK PESANTREN PUTRI TAHFIZHIL QUR-AN (P3TQ) — MADRASAH HIDAYATUL MUBTADI-AAT FITTAHFIZHI WAL QIRO-AT (MHMTQ) LIRBOYO KEDIRI
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            Jl. HM. Winarto, Campurejo, Kec. Mojoroto, Kabupaten Kediri, Jawa Timur 64117
          </p>
          <div className="text-[11px] text-slate-500 flex justify-center items-center gap-3">
            <span>Hari/Tanggal: Sabtu, 02 Januari 2027</span>
            <span>·</span>
            <span>Gerbang Masuk: Gerbang Selatan Bola Dunia</span>
            <span>·</span>
            <span>Total Siswi: {subtotalSantri.sh} Santri Terdaftar ({countBilGhoib} Bil Ghoib · {countBinNadzor} Bin Nadzori · {countTamatan} Tamatan)</span>
          </div>
        </div>

        {/* TABEL BLOK 1: WALI SANTRI SHOHIBUL HAJAT */}
        <div className="space-y-2">
          <div className="font-serif font-bold text-xs text-slate-900 uppercase tracking-wide bg-slate-100 p-2.5 rounded-xl border border-slate-300 flex items-center justify-between">
            <span>BLOK 1: WALI SANTRI SHOHIBUL HAJAT ({subtotalSantri.sh} SANTRI TERDAFTAR)</span>
            <span className="text-[11px] font-normal normal-case text-[#8C6A47] no-print">
              💡 Klik baris untuk melihat rincian santri yang sudah absen
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 border border-slate-300 w-10 text-center">NO</th>
                  <th className="p-2 border border-slate-300">KATEGORI (LABEL REKAP)</th>
                  <th className="p-2 border border-slate-300 text-center">WARNA TIKET</th>
                  <th className="p-2 border border-slate-300 text-center">JUMLAH SH</th>
                  <th className="p-2 border border-slate-300 text-center">WS. LAKI-LAKI</th>
                  <th className="p-2 border border-slate-300 text-center">WS. PEREMPUAN</th>
                  <th className="p-2 border border-slate-300 text-center font-black">TOTAL HADIR</th>
                  <th className="p-2 border border-slate-300 text-center">TOTAL KUOTA</th>
                  <th className="p-2 border border-slate-300 text-center font-black">PROSENTASE</th>
                </tr>
              </thead>
              <tbody>
                {blokSantri.map((row) => (
                  <tr
                    key={row.no}
                    onClick={() => {
                      setModalKategori(row.kategori);
                      setModalSearch('');
                    }}
                    className="hover:bg-[#EFE8E1]/60 cursor-pointer transition-colors group"
                    title="Klik untuk melihat siapa saja santri yang sudah absen masuk"
                  >
                    <td className="p-2 border border-slate-300 text-center font-mono">{row.no}</td>
                    <td className="p-2 border border-slate-300 font-medium text-slate-900">
                      <div className="flex items-center justify-between gap-2">
                        <span className="group-hover:text-[#8C6A47] group-hover:font-bold transition-colors">{row.kategori}</span>
                        <span className="no-print opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-[#8C6A47] font-semibold bg-[#FAF7F3] px-1.5 py-0.5 rounded border border-[#D5C4B4]">
                          <Eye className="w-3 h-3" />
                          <span>Lihat Hadir</span>
                        </span>
                      </div>
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-semibold">
                      {row.warna ? (
                        <span
                          className={
                            row.warna.toLowerCase().includes('biru')
                              ? 'text-blue-700 font-bold'
                              : row.warna.toLowerCase().includes('kuning')
                              ? 'text-amber-700 font-bold'
                              : row.warna.toLowerCase().includes('hijau')
                              ? 'text-emerald-700 font-bold'
                              : row.warna.toLowerCase().includes('merah')
                              ? 'text-rose-700 font-bold'
                              : row.warna.toLowerCase().includes('hitam')
                              ? 'text-slate-900 font-black'
                              : 'text-slate-700'
                          }
                        >
                          {row.warna}
                        </span>
                      ) : (
                        <span className="text-slate-300"></span>
                      )}
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-bold">{row.sh}</td>
                    <td className="p-2 border border-slate-300 text-center text-blue-800 font-bold">{row.l}</td>
                    <td className="p-2 border border-slate-300 text-center text-pink-800 font-bold">{row.p}</td>
                    <td className="p-2 border border-slate-300 text-center font-black text-slate-900">{row.total}</td>
                    <td className="p-2 border border-slate-300 text-center font-bold text-slate-700">{row.kuota}</td>
                    <td className="p-2 border border-slate-300 text-center font-black text-emerald-800">
                      {row.pct}%
                    </td>
                  </tr>
                ))}
                {/* Subtotal Baris Santri */}
                <tr className="bg-slate-200 font-black text-slate-900">
                  <td colSpan={3} className="p-2 border border-slate-300 text-right">
                    SUBTOTAL WALI SANTRI SHOHIBUL HAJAT ({subtotalSantri.sh} SANTRI):
                  </td>
                  <td className="p-2 border border-slate-300 text-center">{subtotalSantri.sh}</td>
                  <td className="p-2 border border-slate-300 text-center">{subtotalSantri.l}</td>
                  <td className="p-2 border border-slate-300 text-center">{subtotalSantri.p}</td>
                  <td className="p-2 border border-slate-300 text-center">{subtotalSantri.total}</td>
                  <td className="p-2 border border-slate-300 text-center">{subtotalSantri.kuota}</td>
                  <td className="p-2 border border-slate-300 text-center">{pctSubtotalSantri}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* TABEL BLOK 2: KUOTA TAMBAHAN (300) */}
        <div className="space-y-2">
          <div className="font-serif font-bold text-xs text-slate-900 uppercase tracking-wide bg-slate-100 p-2.5 rounded-xl border border-slate-300 flex items-center justify-between">
            <span>BLOK 2: KUOTA TAMBAHAN (300)</span>
            <span className="text-[11px] font-normal normal-case text-[#8C6A47] no-print">
              💡 Klik baris untuk melihat rincian pemesan yang sudah absen
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <tbody>
                {blokTambahan.map((row) => (
                  <tr
                    key={row.no}
                    onClick={() => {
                      setModalKategori(row.kategori);
                      setModalSearch('');
                    }}
                    className="hover:bg-[#EFE8E1]/60 cursor-pointer transition-colors group font-medium"
                    title="Klik untuk melihat siapa saja santri pembeli kuota tambahan yang sudah absen masuk"
                  >
                    <td className="p-2 border border-slate-300 w-10 text-center font-mono">{row.no}</td>
                    <td className="p-2 border border-slate-300 text-slate-900 font-bold">
                      <div className="flex items-center justify-between gap-2">
                        <span className="group-hover:text-[#8C6A47] transition-colors">{row.kategori}</span>
                        <span className="no-print opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-[#8C6A47] font-semibold bg-[#FAF7F3] px-1.5 py-0.5 rounded border border-[#D5C4B4]">
                          <Eye className="w-3 h-3" />
                          <span>Lihat Hadir</span>
                        </span>
                      </div>
                    </td>
                    <td className="p-2 border border-slate-300 text-center text-pink-700 font-semibold">{row.warna}</td>
                    <td className="p-2 border border-slate-300 text-center font-bold">{row.sh}</td>
                    <td className="p-2 border border-slate-300 text-center text-blue-800 font-bold">{row.l}</td>
                    <td className="p-2 border border-slate-300 text-center text-pink-800 font-bold">{row.p}</td>
                    <td className="p-2 border border-slate-300 text-center font-black text-slate-900">{row.total}</td>
                    <td className="p-2 border border-slate-300 text-center font-bold text-slate-700">{row.kuota}</td>
                    <td className="p-2 border border-slate-300 text-center font-black text-emerald-800">
                      {row.pct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TABEL BLOK 3: TAMU UNDANGAN (TERSTRUKTUR PER KATEGORI UTAMA) */}
        <div className="space-y-2">
          <div className="font-serif font-bold text-xs text-slate-900 uppercase tracking-wide bg-slate-100 p-2.5 rounded-xl border border-slate-300 flex items-center justify-between">
            <span>BLOK 3: TAMU UNDANGAN ({subtotalUndangan.sh} TAMU TERDAFTAR)</span>
            <span className="text-[11px] font-normal normal-case text-[#8C6A47] no-print">
              💡 Klik baris untuk melihat rincian tamu VIP yang sudah absen
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 border border-slate-300 w-10 text-center">NO</th>
                  <th className="p-2 border border-slate-300 font-black text-[#8C6A47]">KATEGORI UTAMA</th>
                  <th className="p-2 border border-slate-300">RINCIAN SUB-KATEGORI (LABEL REKAP)</th>
                  <th className="p-2 border border-slate-300 text-center">WARNA TIKET</th>
                  <th className="p-2 border border-slate-300 text-center">JUMLAH TAMU</th>
                  <th className="p-2 border border-slate-300 text-center">TAMU LAKI-LAKI</th>
                  <th className="p-2 border border-slate-300 text-center">TAMU PEREMPUAN</th>
                  <th className="p-2 border border-slate-300 text-center font-black">TOTAL HADIR</th>
                  <th className="p-2 border border-slate-300 text-center">TOTAL KUOTA</th>
                  <th className="p-2 border border-slate-300 text-center font-black">PROSENTASE</th>
                </tr>
              </thead>
              <tbody>
                {/* ── KATEGORI UTAMA 1: TAMU ISTIMEWA ── */}
                <tr className="bg-amber-100/90 font-black text-amber-950 text-xs">
                  <td colSpan={10} className="p-2 border border-slate-300 tracking-wide">
                    ▸ KATEGORI UTAMA 1 — TAMU ISTIMEWA (VVIP / VIP IDS / BANI / BLITAR / BANDAR)
                  </td>
                </tr>
                {rowsIstimewa.map((row) => (
                  <tr
                    key={row.no}
                    onClick={() => {
                      setModalKategori(row.kategori);
                      setModalSearch('');
                    }}
                    className="hover:bg-[#EFE8E1]/60 cursor-pointer transition-colors group font-medium"
                    title="Klik untuk melihat rincian tamu hadir"
                  >
                    <td className="p-2 border border-slate-300 w-10 text-center font-mono">{row.no}</td>
                    <td className="p-2 border border-slate-300 font-bold text-amber-900">{row.kategoriUtama}</td>
                    <td className="p-2 border border-slate-300 text-slate-900 font-bold">
                      <div className="flex items-center justify-between gap-2">
                        <span className="group-hover:text-[#8C6A47] transition-colors">{row.kategori}</span>
                        <span className="no-print opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-[#8C6A47] font-semibold bg-[#FAF7F3] px-1.5 py-0.5 rounded border border-[#D5C4B4]">
                          <Eye className="w-3 h-3" />
                          <span>Lihat Hadir</span>
                        </span>
                      </div>
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-semibold">
                      {row.warna ? (
                        <span
                          className={
                            row.warna.toLowerCase().includes('merah')
                              ? 'text-rose-700 font-bold'
                              : row.warna.toLowerCase().includes('hitam')
                              ? 'text-slate-900 font-black'
                              : 'text-slate-700'
                          }
                        >
                          {row.warna}
                        </span>
                      ) : (
                        <span className="text-slate-300"></span>
                      )}
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-bold">{row.sh}</td>
                    <td className="p-2 border border-slate-300 text-center text-blue-800 font-bold">{row.l}</td>
                    <td className="p-2 border border-slate-300 text-center text-pink-800 font-bold">{row.p}</td>
                    <td className="p-2 border border-slate-300 text-center font-black text-slate-900">{row.total}</td>
                    <td className="p-2 border border-slate-300 text-center font-bold text-slate-700">{row.kuota}</td>
                    <td className="p-2 border border-slate-300 text-center font-black text-emerald-800">{row.pct}%</td>
                  </tr>
                ))}
                <tr className="bg-amber-50 font-black text-amber-950 text-xs border-b-2 border-slate-300">
                  <td colSpan={4} className="p-2 border border-slate-300 text-right">
                    SUBTOTAL TAMU ISTIMEWA ({subtotalIstimewa.sh} TAMU):
                  </td>
                  <td className="p-2 border border-slate-300 text-center">{subtotalIstimewa.sh}</td>
                  <td className="p-2 border border-slate-300 text-center">{subtotalIstimewa.l}</td>
                  <td className="p-2 border border-slate-300 text-center">{subtotalIstimewa.p}</td>
                  <td className="p-2 border border-slate-300 text-center">{subtotalIstimewa.total}</td>
                  <td className="p-2 border border-slate-300 text-center">{subtotalIstimewa.kuota}</td>
                  <td className="p-2 border border-slate-300 text-center text-emerald-800">{pctIstimewa}%</td>
                </tr>

                {/* ── KATEGORI UTAMA 2: TAMU KEHORMATAN ── */}
                <tr className="bg-[#EFE8E1] font-black text-[#422F21] text-xs">
                  <td colSpan={10} className="p-2 border border-slate-300 tracking-wide">
                    ▸ KATEGORI UTAMA 2 — TAMU KEHORMATAN (MASYAYIKH / TOKOH / PENGASUH)
                  </td>
                </tr>
                {rowsKehormatan.map((row) => (
                  <tr
                    key={row.no}
                    onClick={() => {
                      setModalKategori(row.kategori);
                      setModalSearch('');
                    }}
                    className="hover:bg-[#EFE8E1]/60 cursor-pointer transition-colors group font-medium"
                    title="Klik untuk melihat rincian tamu hadir"
                  >
                    <td className="p-2 border border-slate-300 w-10 text-center font-mono">{row.no}</td>
                    <td className="p-2 border border-slate-300 font-bold text-[#8C6A47]">{row.kategoriUtama}</td>
                    <td className="p-2 border border-slate-300 text-slate-900 font-bold">
                      <div className="flex items-center justify-between gap-2">
                        <span className="group-hover:text-[#8C6A47] transition-colors">{row.kategori}</span>
                        <span className="no-print opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-[#8C6A47] font-semibold bg-[#FAF7F3] px-1.5 py-0.5 rounded border border-[#D5C4B4]">
                          <Eye className="w-3 h-3" />
                          <span>Lihat Hadir</span>
                        </span>
                      </div>
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-semibold">
                      {row.warna ? (
                        <span
                          className={
                            row.warna.toLowerCase().includes('merah')
                              ? 'text-rose-700 font-bold'
                              : row.warna.toLowerCase().includes('hitam')
                              ? 'text-slate-900 font-black'
                              : 'text-slate-700'
                          }
                        >
                          {row.warna}
                        </span>
                      ) : (
                        <span className="text-slate-300"></span>
                      )}
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-bold">{row.sh}</td>
                    <td className="p-2 border border-slate-300 text-center text-blue-800 font-bold">{row.l}</td>
                    <td className="p-2 border border-slate-300 text-center text-pink-800 font-bold">{row.p}</td>
                    <td className="p-2 border border-slate-300 text-center font-black text-slate-900">{row.total}</td>
                    <td className="p-2 border border-slate-300 text-center font-bold text-slate-700">{row.kuota}</td>
                    <td className="p-2 border border-slate-300 text-center font-black text-emerald-800">{row.pct}%</td>
                  </tr>
                ))}
                <tr className="bg-[#FAF7F3] font-black text-[#422F21] text-xs border-b-2 border-slate-300">
                  <td colSpan={4} className="p-2 border border-slate-300 text-right">
                    SUBTOTAL TAMU KEHORMATAN ({subtotalKehormatan.sh} TAMU):
                  </td>
                  <td className="p-2 border border-slate-300 text-center">{subtotalKehormatan.sh}</td>
                  <td className="p-2 border border-slate-300 text-center">{subtotalKehormatan.l}</td>
                  <td className="p-2 border border-slate-300 text-center">{subtotalKehormatan.p}</td>
                  <td className="p-2 border border-slate-300 text-center">{subtotalKehormatan.total}</td>
                  <td className="p-2 border border-slate-300 text-center">{subtotalKehormatan.kuota}</td>
                  <td className="p-2 border border-slate-300 text-center text-emerald-800">{pctKehormatan}%</td>
                </tr>

                {/* ── KATEGORI UTAMA 3: TAMU UMUM ── */}
                <tr className="bg-slate-200 font-black text-slate-900 text-xs">
                  <td colSpan={10} className="p-2 border border-slate-300 tracking-wide">
                    ▸ KATEGORI UTAMA 3 — TAMU UMUM (ASATIDZ / MUSTAHIQ / PENGAJAR / PENGUJI / PERWAKILAN)
                  </td>
                </tr>
                {rowsUmum.map((row) => (
                  <tr
                    key={row.no}
                    onClick={() => {
                      setModalKategori(row.kategori);
                      setModalSearch('');
                    }}
                    className="hover:bg-[#EFE8E1]/60 cursor-pointer transition-colors group font-medium"
                    title="Klik untuk melihat rincian tamu hadir"
                  >
                    <td className="p-2 border border-slate-300 w-10 text-center font-mono">{row.no}</td>
                    <td className="p-2 border border-slate-300 font-bold text-slate-700">{row.kategoriUtama}</td>
                    <td className="p-2 border border-slate-300 text-slate-900 font-bold">
                      <div className="flex items-center justify-between gap-2">
                        <span className="group-hover:text-[#8C6A47] transition-colors">{row.kategori}</span>
                        <span className="no-print opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-[#8C6A47] font-semibold bg-[#FAF7F3] px-1.5 py-0.5 rounded border border-[#D5C4B4]">
                          <Eye className="w-3 h-3" />
                          <span>Lihat Hadir</span>
                        </span>
                      </div>
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-semibold">
                      {row.warna ? (
                        <span
                          className={
                            row.warna.toLowerCase().includes('merah')
                              ? 'text-rose-700 font-bold'
                              : row.warna.toLowerCase().includes('hitam')
                              ? 'text-slate-900 font-black'
                              : 'text-slate-700'
                          }
                        >
                          {row.warna}
                        </span>
                      ) : (
                        <span className="text-slate-300"></span>
                      )}
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-bold">{row.sh}</td>
                    <td className="p-2 border border-slate-300 text-center text-blue-800 font-bold">{row.l}</td>
                    <td className="p-2 border border-slate-300 text-center text-pink-800 font-bold">{row.p}</td>
                    <td className="p-2 border border-slate-300 text-center font-black text-slate-900">{row.total}</td>
                    <td className="p-2 border border-slate-300 text-center font-bold text-slate-700">{row.kuota}</td>
                    <td className="p-2 border border-slate-300 text-center font-black text-emerald-800">{row.pct}%</td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-black text-slate-900 text-xs border-b-2 border-slate-300">
                  <td colSpan={4} className="p-2 border border-slate-300 text-right">
                    SUBTOTAL TAMU UMUM ({subtotalUmum.sh} TAMU):
                  </td>
                  <td className="p-2 border border-slate-300 text-center">{subtotalUmum.sh}</td>
                  <td className="p-2 border border-slate-300 text-center">{subtotalUmum.l}</td>
                  <td className="p-2 border border-slate-300 text-center">{subtotalUmum.p}</td>
                  <td className="p-2 border border-slate-300 text-center">{subtotalUmum.total}</td>
                  <td className="p-2 border border-slate-300 text-center">{subtotalUmum.kuota}</td>
                  <td className="p-2 border border-slate-300 text-center text-emerald-800">{pctUmum}%</td>
                </tr>

                {/* Subtotal Baris Tamu Undangan Keseluruhan */}
                <tr className="bg-slate-300 font-black text-slate-950 text-xs border-t-2 border-slate-400">
                  <td colSpan={4} className="p-2.5 border border-slate-400 text-right">
                    SUBTOTAL TAMU UNDANGAN KESELURUHAN ({subtotalUndangan.sh} TAMU):
                  </td>
                  <td className="p-2.5 border border-slate-400 text-center">{subtotalUndangan.sh}</td>
                  <td className="p-2.5 border border-slate-400 text-center text-blue-900">{subtotalUndangan.l}</td>
                  <td className="p-2.5 border border-slate-400 text-center text-pink-900">{subtotalUndangan.p}</td>
                  <td className="p-2.5 border border-slate-400 text-center text-slate-950 font-black">{subtotalUndangan.total}</td>
                  <td className="p-2.5 border border-slate-400 text-center font-bold">{subtotalUndangan.kuota}</td>
                  <td className="p-2.5 border border-slate-400 text-center text-emerald-900 font-black">{pctSubtotalUndangan}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Kolom Tanda Tangan Panitia */}
        <div className="pt-8 grid grid-cols-2 text-center text-xs text-slate-800 font-medium">
          <div>
            <p>Mengetahui,</p>
            <p className="font-bold mt-1">Ketua Panitia Haul &amp; Haflah</p>
            <div className="h-16"></div>
            <p className="font-bold underline">( Sinta Maelani )</p>
          </div>
          <div>
            <p>Kediri, 02 Januari 2027</p>
            <p className="font-bold mt-1">Koordinator Presensi &amp; Rekonsiliasi</p>
            <div className="h-16"></div>
            <p className="font-bold underline">( Ahmad Chamdan Yuwafi )</p>
          </div>
        </div>
      </div>
    </div>
  );
}
