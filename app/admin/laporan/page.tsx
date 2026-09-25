'use client';

import { useState } from 'react';
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
import { store, INITIAL_EVENT } from '@/lib/mock-data';
import { getGolonganUndangan } from '@/lib/types';
import * as XLSX from 'xlsx';

export default function LaporanPage() {
  const stats = store.getStatistikLive();
  const pagu = store.getPaguInfo();

  const [modalKategori, setModalKategori] = useState<string | null>(null);
  const [modalSearch, setModalSearch] = useState<string>('');
  const [modalTab, setModalTab] = useState<'HADIR' | 'BELUM_HADIR'>('HADIR');

  const allHadirList = store.getDaftarHadirSantriDanTamu();
  const allBelumHadirList = store.getDaftarBelumHadir();

  // Helper pencocokan kategori untuk modal
  const matchCategoryItem = (itemKategori: string, itemKatUtama: string, itemSub: string, itemKuotaTambahan: number, itemTipe: string, rawItem?: any) => {
    if (!modalKategori) return false;
    if (modalKategori.includes('Kuota Tambahan')) {
      return itemKuotaTambahan > 0;
    }
    const mk = modalKategori.toLowerCase();
    if (mk.includes('bil ghoib')) {
      return itemKatUtama === 'BIL_GHOIB' || itemKategori.toLowerCase().includes('bil ghoib');
    } else if (mk.includes('bin nadzori')) {
      const part = mk.replace('bin nadzori', '').trim();
      return (
        (itemKatUtama === 'BIN_NADZOR' || itemKategori.toLowerCase().includes('bin nadzori')) &&
        (!part || itemKategori.toLowerCase().includes(part) || itemSub.toLowerCase().includes(part))
      );
    } else if (mk.includes('tamatan')) {
      const part = mk.replace('tamatan bagian', '').replace('tamatan', '').trim();
      return (
        (itemKatUtama === 'TAMATAN' || itemKategori.toLowerCase().includes('tamatan')) &&
        (!part || itemKategori.toLowerCase().includes(part) || itemSub.toLowerCase().includes(part))
      );
    } else if (mk.includes('kehormatan')) {
      return itemTipe === 'UNDANGAN' && ((rawItem as any)?.golonganUndangan === 'KEHORMATAN' || getGolonganUndangan(rawItem) === 'KEHORMATAN');
    } else if (mk.includes('istimewa')) {
      return itemTipe === 'UNDANGAN' && ((rawItem as any)?.golonganUndangan === 'ISTIMEWA' || getGolonganUndangan(rawItem) === 'ISTIMEWA');
    } else if (mk.includes('umum')) {
      return itemTipe === 'UNDANGAN' && ((rawItem as any)?.golonganUndangan === 'UMUM' || getGolonganUndangan(rawItem) === 'UMUM');
    } else if (mk.includes('penguji')) {
      return itemTipe === 'UNDANGAN' && (itemSub.toLowerCase().includes('penguji') || itemKategori.toLowerCase().includes('penguji'));
    } else if (mk.includes('asatidz') || mk.includes('masyaikh')) {
      return (
        itemTipe === 'UNDANGAN' &&
        (itemSub.toLowerCase().includes('asatidz') ||
          itemSub.toLowerCase().includes('masyaikh') ||
          itemKategori.toLowerCase().includes('asatidz'))
      );
    }
    return itemKategori.toLowerCase().includes(mk) || itemSub.toLowerCase().includes(mk);
  };

  // Data peserta SUDAH HADIR di modal drilldown
  const modalHadirAttendees = modalKategori
    ? allHadirList.filter((item) => {
        const matchKat = matchCategoryItem(item.kategori, item.kategoriUtama, item.kelasAtauSub, item.kuotaTambahan, item.tipe, item);
        if (modalSearch.trim()) {
          const q = modalSearch.toLowerCase().trim();
          return (
            matchKat &&
            (item.nama.toLowerCase().includes(q) ||
              item.waliAtauInstansi.toLowerCase().includes(q) ||
              item.kode.toLowerCase().includes(q))
          );
        }
        return matchKat;
      })
    : [];

  // Data peserta BELUM HADIR di modal drilldown
  const modalBelumHadirAttendees = modalKategori
    ? allBelumHadirList.filter((item) => {
        const matchKat = matchCategoryItem(item.kategori, item.kategoriUtama, item.kelasAtauSub, item.kuotaTambahan, item.tipe, item);
        if (modalSearch.trim()) {
          const q = modalSearch.toLowerCase().trim();
          return (
            matchKat &&
            (item.nama.toLowerCase().includes(q) ||
              item.waliAtauInstansi.toLowerCase().includes(q) ||
              item.kode.toLowerCase().includes(q))
          );
        }
        return matchKat;
      })
    : [];

  const keluargaList = store.getKeluargaList();
  const undanganList = store.getUndanganList();
  const presensiLogs = store.getPresensiLogs();

  // Helper pengelompokan 14 kategori santri
  const templateBlokSantri = [
    { no: 1, kategori: 'Bil Ghoib (Khadimatul Qur-an)', warna: 'Hijau (+Emas ★)' },
    { no: 2, kategori: 'Bin Nadzori 2 Tsanawiyah', warna: 'Biru' },
    { no: 3, kategori: 'Bin Nadzori 3 Tsanawiyah', warna: 'Biru' },
    { no: 4, kategori: 'Bin Nadzori 1 Aliyah', warna: 'Biru' },
    { no: 5, kategori: 'Bin Nadzori 2 Aliyah', warna: 'Biru' },
    { no: 6, kategori: 'Bin Nadzori 3 Aliyah', warna: 'Biru' },
    { no: 7, kategori: 'Bin Nadzori Mutakhorijat', warna: 'Biru' },
    { no: 8, kategori: 'Tamatan Bagian A.01', warna: 'Kuning' },
    { no: 9, kategori: 'Tamatan Bagian A.02', warna: 'Kuning' },
    { no: 10, kategori: 'Tamatan Bagian A.03', warna: 'Kuning' },
    { no: 11, kategori: 'Tamatan Bagian A.04', warna: 'Kuning' },
    { no: 12, kategori: 'Tamatan Bagian B.01', warna: 'Kuning' },
    { no: 13, kategori: 'Tamatan Bagian B.02', warna: 'Kuning' },
    { no: 14, kategori: 'Tamatan Bagian B.03', warna: 'Kuning' },
  ];

  const getKategoriIndex = (k: (typeof keluargaList)[0]) => {
    const s = k.santri?.[0];
    const kat = s?.kategoriUtama || 'BIN_NADZOR';
    const sub = (s?.subKategori || '').toLowerCase();
    const kelas = (s?.kelas || '').toLowerCase();

    if (kat === 'BIL_GHOIB' || sub.includes('bil ghoib')) return 0;

    if (kat === 'BIN_NADZOR') {
      if (kelas.includes('2 tsanawiyah') || kelas.includes('2 tsanawi') || kelas.includes('2 tsn') || sub.includes('2 tsn')) return 1;
      if (kelas.includes('3 tsanawiyah') || kelas.includes('3 tsanawi') || kelas.includes('3 tsn') || sub.includes('3 tsn')) return 2;
      if (kelas.includes('1 aliyah') || kelas.includes('1 aly') || sub.includes('1 aly')) return 3;
      if (kelas.includes('2 aliyah') || kelas.includes('2 aly') || sub.includes('2 aly')) return 4;
      if (sub.includes('mutakhorijat') || kelas.includes('mutakhorijat')) return 6;
      if (kelas.includes('3 aliyah') || kelas.includes('3 aly') || sub.includes('3 aly')) return 5;
      return 3;
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

    return 1;
  };

  const blokSantri = templateBlokSantri.map((tpl) => ({
    ...tpl,
    sh: 0,
    l: 0,
    p: 0,
    total: 0,
    kuota: 0,
    pct: 0,
  }));

  for (const kel of keluargaList) {
    const idx = getKategoriIndex(kel);
    if (blokSantri[idx]) {
      blokSantri[idx].sh += 1;
      const kTot = kel.kuota.kuotaDasar + (kel.kuota.kuotaTambahan || 0);
      blokSantri[idx].kuota += kTot;

      const logs = presensiLogs.filter(
        (l) => l.kuotaId === kel.kuota.id || l.kuotaId === `q_${kel.kode}`
      );
      let hadirL = 0;
      let hadirP = 0;
      if (logs.length > 0) {
        for (const l of logs) {
          hadirL += l.jumlahL || 0;
          hadirP += l.jumlahP || 0;
        }
      } else if (kel.kuota.terpakai > 0) {
        hadirL += Math.ceil(kel.kuota.terpakai / 2);
        hadirP += Math.floor(kel.kuota.terpakai / 2);
      }
      blokSantri[idx].l += hadirL;
      blokSantri[idx].p += hadirP;
      blokSantri[idx].total += (hadirL + hadirP);
    }
  }

  for (const row of blokSantri) {
    row.pct = row.kuota > 0 ? Math.round((row.total / row.kuota) * 1000) / 10 : 0;
  }

  // Hitung Subtotal Blok Santri
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

  // Hitung akumulasi riil Blok 2: Kuota Tambahan Berbayar
  let tambahanHadirL = 0;
  let tambahanHadirP = 0;
  let tambahanHadirTotal = 0;

  for (const kel of keluargaList) {
    if (kel.kuota.kuotaTambahan > 0 && kel.kuota.terpakai > kel.kuota.kuotaDasar) {
      const lebih = kel.kuota.terpakai - kel.kuota.kuotaDasar;
      const pakai = Math.min(kel.kuota.kuotaTambahan, lebih);
      tambahanHadirTotal += pakai;
      tambahanHadirL += Math.ceil(pakai / 2);
      tambahanHadirP += Math.floor(pakai / 2);
    }
  }

  const blokTambahan = [
    {
      no: 15,
      kategori: 'Kuota Tambahan (Dibeli Berbayar Pagu 300)',
      sh: pagu.terjual,
      l: tambahanHadirL,
      p: tambahanHadirP,
      total: tambahanHadirTotal,
      kuota: pagu.paguTotal,
      pct: pagu.paguTotal > 0 ? Math.round((tambahanHadirTotal / pagu.paguTotal) * 1000) / 10 : 0,
      warna: 'Merah muda',
    },
  ];

  // Hitung akumulasi riil Blok 3: Tamu Undangan (Kehormatan, Istimewa & Umum)
  let kehormatanSH = 0, kehormatanL = 0, kehormatanP = 0, kehormatanTotal = 0, kehormatanKuota = 0;
  let istimewaSH = 0, istimewaL = 0, istimewaP = 0, istimewaTotal = 0, istimewaKuota = 0;
  let umumSH = 0, umumL = 0, umumP = 0, umumTotal = 0, umumKuota = 0;

  for (const und of undanganList) {
    const gol = getGolonganUndangan(und);
    const kTotal = und.kuota.kuotaDasar + (und.kuota.kuotaTambahan || 0);
    const terpakai = und.kuota.terpakai || 0;

    const logs = presensiLogs.filter((l) => l.kuotaId === und.kuota.id || l.kuotaId === `qu_${und.kode}`);
    let lHadir = 0;
    let pHadir = 0;
    if (logs.length > 0) {
      for (const log of logs) {
        lHadir += log.jumlahL || 0;
        pHadir += log.jumlahP || 0;
      }
    } else if (terpakai > 0) {
      lHadir = terpakai;
    }

    if (gol === 'KEHORMATAN') {
      kehormatanSH++;
      kehormatanKuota += kTotal;
      kehormatanL += lHadir;
      kehormatanP += pHadir;
      kehormatanTotal += terpakai;
    } else if (gol === 'ISTIMEWA') {
      istimewaSH++;
      istimewaKuota += kTotal;
      istimewaL += lHadir;
      istimewaP += pHadir;
      istimewaTotal += terpakai;
    } else {
      umumSH++;
      umumKuota += kTotal;
      umumL += lHadir;
      umumP += pHadir;
      umumTotal += terpakai;
    }
  }

  const blokUndangan = [
    {
      no: 16,
      kategori: 'Tamu Kehormatan',
      sh: kehormatanSH,
      l: kehormatanL,
      p: kehormatanP,
      total: kehormatanTotal,
      kuota: kehormatanKuota,
      pct: kehormatanKuota > 0 ? Math.round((kehormatanTotal / kehormatanKuota) * 1000) / 10 : 0,
      warna: 'Putih',
    },
    {
      no: 17,
      kategori: 'Tamu Istimewa',
      sh: istimewaSH,
      l: istimewaL,
      p: istimewaP,
      total: istimewaTotal,
      kuota: istimewaKuota,
      pct: istimewaKuota > 0 ? Math.round((istimewaTotal / istimewaKuota) * 1000) / 10 : 0,
      warna: 'Putih',
    },
    {
      no: 18,
      kategori: 'Tamu Umum',
      sh: umumSH,
      l: umumL,
      p: umumP,
      total: umumTotal,
      kuota: umumKuota,
      pct: umumKuota > 0 ? Math.round((umumTotal / umumKuota) * 1000) / 10 : 0,
      warna: 'Putih',
    },
  ];

  const countBilGhoib = keluargaList.filter((k) => k.santri?.[0]?.kategoriUtama === 'BIL_GHOIB').length;
  const countBinNadzor = keluargaList.filter((k) => k.santri?.[0]?.kategoriUtama === 'BIN_NADZOR').length;
  const countTamatan = keluargaList.filter((k) => k.santri?.[0]?.kategoriUtama === 'TAMATAN').length;

  // Ekspor ke Spreadsheet Excel via SheetJS (Multi-Sheet: Rekap 3 Blok, Detail Sudah Hadir, Detail Belum Hadir)
  const handleExportExcel = () => {
    // Sheet 1: Rekap 3 Blok Resmi
    const dataForExport = [
      ['LEMBAR REKAPITULASI PRESENSI HAUL & HAFLAH 1448 H / 2027 M'],
      ['PONDOK PESANTREN PUTRI TAHFIZHIL QUR-AN (P3TQ) — MADRASAH HIDAYATUL MUBTADI-AAT FITTAHFIZHI WAL QIRO-AT (MHMTQ) LIRBOYO KEDIRI'],
      ['Alamat: Jl. HM. Winarto, Campurejo, Kec. Mojoroto, Kabupaten Kediri, Jawa Timur 64117'],
      ['Tanggal Acara: Sabtu, 02 Januari 2027 / 24 Rajab 1448 H'],
      [],
      ['No', 'Kategori / Sub-Kelas', 'Warna Tiket', 'Jumlah SH', 'WS Laki-laki', 'WS Perempuan', 'Total Hadir', 'Total Kuota', 'Prosentase (%)'],
      ...blokSantri.map((r) => [r.no, r.kategori, r.warna, r.sh, r.l, r.p, r.total, r.kuota, `${r.pct}%`]),
      ['', `SUBTOTAL SOHIBUL HAJAT (${subtotalSantri.sh} SANTRI)`, '', subtotalSantri.sh, subtotalSantri.l, subtotalSantri.p, subtotalSantri.total, subtotalSantri.kuota, `${pctSubtotalSantri}%`],
      [],
      ['-- BLOK KUOTA TAMBAHAN --'],
      ...blokTambahan.map((r) => [r.no, r.kategori, r.warna, r.sh, r.l, r.p, r.total, r.kuota, `${r.pct}%`]),
      [],
      ['-- BLOK TAMU UNDANGAN (KEHORMATAN, ISTIMEWA & UMUM) --'],
      ...blokUndangan.map((r) => [r.no, r.kategori, r.warna, r.sh, r.l, r.p, r.total, r.kuota, `${r.pct}%`]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(dataForExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap_3_Blok');

    // Sheet 2: Detail Peserta yang Sudah Absen Masuk
    const allHadir = store.getDaftarHadirSantriDanTamu();
    const detailDataForExport = [
      ['DAFTAR RINCIAN PESERTA YANG SUDAH ABSEN MASUK'],
      ['HAUL & HAFLAH P3TQ & MHMTQ PONDOK PESANTREN LIRBOYO KEDIRI 1448 H / 2027 M'],
      ['Waktu Unduh:', new Date().toLocaleString('id-ID')],
      ['Total Peserta Terdata Hadir:', allHadir.length],
      [],
      [
        'No',
        'Kode Tiket',
        'Tipe Peserta',
        'Kategori Utama',
        'Kategori / Sub-Kelas',
        'Nama Santri / Tamu',
        'Nama Wali / Instansi',
        'Warna Tiket',
        'Jam Masuk',
        'Jalur Gerbang',
        'Hadir Laki-laki',
        'Hadir Perempuan',
        'Total Jiwa Hadir',
        'Kuota Dasar',
        'Kuota Tambahan',
        'Total Kuota',
        'Sisa Kuota',
        'Tiket Panggung',
        'No HP',
        'Alamat / Asal',
      ],
      ...allHadir.map((item, idx) => [
        idx + 1,
        item.kode,
        item.tipe,
        item.kategoriUtama,
        item.kategori,
        item.nama,
        item.waliAtauInstansi,
        item.warnaTiket,
        item.jamMasuk || '08:15:00',
        item.jalur || 'TIMUR',
        item.jumlahL,
        item.jumlahP,
        item.terpakai,
        item.kuotaDasar,
        item.kuotaTambahan,
        item.totalKuota,
        item.sisa,
        item.tiketPanggungDiberi > 0
          ? 'DIBERIKAN (1)'
          : item.tiketPanggungJatah > 0
          ? 'JATAH (BELUM DIAMBIL)'
          : '-',
        item.noHp || '-',
        item.alamat || '-',
      ]),
    ];

    const wsDetail = XLSX.utils.aoa_to_sheet(detailDataForExport);
    XLSX.utils.book_append_sheet(wb, wsDetail, 'Detail_Sudah_Absen_Masuk');

    // Sheet 3: Detail Peserta yang Belum Hadir
    const allBelumHadir = store.getDaftarBelumHadir();
    const detailBelumHadirForExport = [
      ['DAFTAR RINCIAN PESERTA YANG BELUM HADIR'],
      ['HAUL & HAFLAH P3TQ & MHMTQ PONDOK PESANTREN LIRBOYO KEDIRI 1448 H / 2027 M'],
      ['Waktu Unduh:', new Date().toLocaleString('id-ID')],
      ['Total Peserta Belum Hadir:', allBelumHadir.length],
      [],
      [
        'No',
        'Kode Tiket',
        'Tipe Peserta',
        'Kategori Utama',
        'Kategori / Sub-Kelas',
        'Nama Santri / Tamu',
        'Nama Wali / Instansi',
        'Warna Tiket',
        'Kuota Dasar',
        'Kuota Tambahan',
        'Total Kuota',
        'Status Konfirmasi WA',
        'Estimasi L',
        'Estimasi P',
        'Estimasi Total',
        'No HP',
        'Alamat / Asal',
      ],
      ...allBelumHadir.map((item, idx) => [
        idx + 1,
        item.kode,
        item.tipe,
        item.kategoriUtama,
        item.kategori,
        item.nama,
        item.waliAtauInstansi,
        item.warnaTiket,
        item.kuotaDasar,
        item.kuotaTambahan,
        item.totalKuota,
        item.statusKonfirmasi === 'SUDAH' ? 'SUDAH KONFIRMASI' : 'BELUM KONFIRMASI',
        item.estimasiL || 0,
        item.estimasiP || 0,
        item.estimasiTotal || 0,
        item.noHp || '-',
        item.alamat || '-',
      ]),
    ];

    const wsBelum = XLSX.utils.aoa_to_sheet(detailBelumHadirForExport);
    XLSX.utils.book_append_sheet(wb, wsBelum, 'Detail_Belum_Hadir');

    XLSX.writeFile(wb, 'Rekapitulasi_Presensi_Haul_Haflah_P3TQ_549_Santri.xlsx');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Panel Laporan: Warm Latte & Cinnamon Mocha Aesthetic */}
      <div className="bg-[#FAF7F3] rounded-3xl p-6 shadow-sm border-2 border-[#D5C4B4] flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-[#EFE8E1] text-[#8C6A47] flex items-center justify-center font-bold border border-[#D5C4B4] shadow-sm">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-black text-[#422F21]">
              Lembar Rekapitulasi & Laporan Pasca Acara (§17)
            </h1>
            <p className="text-xs text-[#7A624E] font-normal">
              Rekapitulasi resmi 3 blok mencakup <strong>549 Santri Riil</strong> (64 Bil Ghoib, 159 Bin Nadzori & 326 Tamatan) siap cetak dan ekspor.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportExcel}
            className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow flex items-center space-x-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Excel (.xlsx)</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white font-bold text-xs shadow border border-[#735334] flex items-center space-x-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rekap Fisik</span>
          </button>
        </div>
      </div>

      {/* DOKUMEN REKAP RESMI (SIAP CETAK) */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-opera-200 space-y-6 print:p-0 print:border-none print:shadow-none">
        {/* Kop Resmi Lembar Rekap Panitia dengan Logo Kembar */}
        <div className="text-center pb-6 border-b-2 border-opera-900 space-y-2">
          <div className="flex justify-center items-center space-x-3 mb-2">
            <img src="/images/logo-p3tq.png" alt="Logo P3TQ" className="w-12 h-12 object-contain" />
            <img src="/images/logo-haul-black.png" alt="Kaligrafi Haul Haflah" className="h-10 object-contain" />
            <img src="/images/logo-mhmtq.png" alt="Logo MHMTQ" className="w-12 h-12 object-contain" />
          </div>
          <h2 className="text-lg sm:text-xl font-serif font-black text-slate-900 uppercase tracking-tight">
            LEMBAR REKAPITULASI PRESENSI HAUL & HAFLAH 1448 H / 2027 M
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

        {/* TABEL BLOK 1: SOHIBUL HAJAT */}
        <div className="space-y-2">
          <div className="font-serif font-bold text-xs text-opera-900 uppercase tracking-wide bg-opera-50 p-2.5 rounded-xl border border-opera-200 flex items-center justify-between">
            <span>BLOK 1: SANTRI SOHIBUL HAJAT ({subtotalSantri.sh} SANTRI TERDAFTAR)</span>
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
                      <span className={row.warna === 'Biru' ? 'text-blue-700' : 'text-amber-700'}>
                        {row.warna}
                      </span>
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
                    SUBTOTAL SOHIBUL HAJAT ({subtotalSantri.sh} SANTRI):
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

        {/* TABEL BLOK 2: KUOTA TAMBAHAN (§17.1) */}
        <div className="space-y-2">
          <div className="font-serif font-bold text-xs text-opera-900 uppercase tracking-wide bg-opera-50 p-2.5 rounded-xl border border-opera-200 flex items-center justify-between">
            <span>BLOK 2: KUOTA TAMBAHAN (DIBELI BERBAYAR PAGU 300)</span>
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

        {/* TABEL BLOK 3: TAMU UNDANGAN (§17.1) */}
        <div className="space-y-2">
          <div className="font-serif font-bold text-xs text-opera-900 uppercase tracking-wide bg-opera-50 p-2.5 rounded-xl border border-opera-200 flex items-center justify-between">
            <span>BLOK 3: TAMU UNDANGAN (KEHORMATAN, ISTIMEWA & UMUM)</span>
            <span className="text-[11px] font-normal normal-case text-[#8C6A47] no-print">
              💡 Klik baris untuk melihat tamu VIP yang sudah absen
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <tbody>
                {blokUndangan.map((row) => (
                  <tr
                    key={row.no}
                    onClick={() => {
                      setModalKategori(row.kategori);
                      setModalSearch('');
                    }}
                    className="hover:bg-[#EFE8E1]/60 cursor-pointer transition-colors group font-medium"
                    title="Klik untuk melihat siapa saja tamu undangan yang sudah absen masuk"
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
                    <td className="p-2 border border-slate-300 text-center text-slate-700 font-semibold">{row.warna}</td>
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

        {/* Kolom Tanda Tangan Panitia */}
        <div className="pt-8 grid grid-cols-2 text-center text-xs text-slate-800 font-medium">
          <div>
            <p>Mengetahui,</p>
            <p className="font-bold mt-1">Ketua Panitia Haul & Haflah</p>
            <div className="h-16"></div>
            <p className="font-bold underline">( Sinta Maelani )</p>
          </div>
          <div>
            <p>Kediri, 02 Januari 2027</p>
            <p className="font-bold mt-1">Koordinator Presensi & Rekonsiliasi</p>
            <div className="h-16"></div>
            <p className="font-bold underline">( Ahmad Chamdan Yuwafi )</p>
          </div>
        </div>
      </div>

      {/* BANNER NAVIGASI KE LIVE DASBOR (NO-PRINT) */}
      <div className="bg-[#FAF7F3] rounded-3xl p-6 shadow-sm border-2 border-[#D5C4B4] flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-black text-sm text-[#422F21]">
              Rincian Absensi Realtime & Daftar Hadir / Belum Hadir
            </h3>
            <p className="text-xs text-[#7A624E]">
              Seluruh rincian santri dan tamu undangan yang sudah hadir maupun yang belum hadir dapat dipantau langsung di <strong>Live Dasbor</strong>.
            </p>
          </div>
        </div>
        <a
          href="/admin/dasbor"
          className="px-5 py-2.5 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white font-bold text-xs shadow flex items-center space-x-2 transition-colors shrink-0"
        >
          <span>Buka Live Dasbor Kehadiran</span>
          <span>→</span>
        </a>
      </div>

      {/* MODAL DRILLDOWN KETIKA BARIS 3-BLOK DIKLIK */}
      {modalKategori && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-[#D5C4B4] max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header dengan 2 Pilihan Tab: Sudah Hadir vs Belum Hadir */}
            <div className="p-5 bg-[#FAF7F3] border-b border-[#D5C4B4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-[#EFE8E1] text-[#8C6A47] border border-[#D5C4B4] shrink-0">
                  {modalTab === 'HADIR' ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-serif font-black text-base text-[#422F21]">
                    Rincian: {modalKategori}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500 font-medium">
                      Pilihan data peserta di kategori ini
                    </span>
                  </div>
                </div>
              </div>

              {/* 2 Pilihan Tab Switcher di Modal */}
              <div className="flex items-center bg-[#EFE8E1] p-1 rounded-2xl border border-[#D5C4B4] gap-1 self-start sm:self-auto">
                <button
                  onClick={() => setModalTab('HADIR')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    modalTab === 'HADIR'
                      ? 'bg-[#8C6A47] text-white shadow-xs'
                      : 'text-[#7A624E] hover:text-[#422F21]'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>1. Sudah Hadir ({modalHadirAttendees.length})</span>
                </button>
                <button
                  onClick={() => setModalTab('BELUM_HADIR')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    modalTab === 'BELUM_HADIR'
                      ? 'bg-amber-800 text-white shadow-xs'
                      : 'text-[#7A624E] hover:text-[#422F21]'
                  }`}
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>2. Belum Hadir ({modalBelumHadirAttendees.length})</span>
                </button>
              </div>

              <button
                onClick={() => setModalKategori(null)}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-300 text-slate-500 flex items-center justify-center transition-colors shrink-0 hidden sm:flex"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Search Bar & Shortcut Buka di Tabel Utama */}
            <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Filter nama santri / wali dalam ${modalTab === 'HADIR' ? 'daftar sudah hadir' : 'daftar belum hadir'}...`}
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8C6A47]/40 text-slate-800"
                />
                {modalSearch && (
                  <button
                    onClick={() => setModalSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <a
                href="/admin/dasbor"
                className="px-3.5 py-2 rounded-xl bg-[#8C6A47] text-white text-xs font-bold hover:bg-[#735334] transition-colors whitespace-nowrap"
              >
                Buka di Live Dasbor →
              </a>
            </div>

            {/* Modal Table Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {modalTab === 'HADIR' ? (
                /* TAB 1 MODAL: SUDAH HADIR */
                modalHadirAttendees.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Belum ada peserta hadir yang tercatat di kategori ini.</p>
                    <p className="text-xs text-slate-400 mt-1">Presensi akan muncul otomatis setelah barcode peserta di-scan.</p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5 w-10 text-center">NO</th>
                          <th className="p-2.5">KODE</th>
                          <th className="p-2.5">NAMA SANTRI / TAMU</th>
                          <th className="p-2.5">WALI / INSTANSI</th>
                          <th className="p-2.5 text-center">JAM MASUK</th>
                          <th className="p-2.5 text-center">L / P</th>
                          <th className="p-2.5 text-center">TOTAL HADIR</th>
                          <th className="p-2.5 text-center">PANGGUNG</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {modalHadirAttendees.map((m, idx) => (
                          <tr key={m.kode} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                            <td className="p-2.5 font-mono font-bold text-slate-900">{m.kode}</td>
                            <td className="p-2.5 font-bold text-slate-900">{m.nama}</td>
                            <td className="p-2.5 text-slate-700">{m.waliAtauInstansi}</td>
                            <td className="p-2.5 text-center font-mono text-slate-600">
                              {m.jamMasuk || '08:15:00'} ({m.jalur || 'TIMUR'})
                            </td>
                            <td className="p-2.5 text-center">
                              <span className="text-blue-700 font-bold">{m.jumlahL} L</span> /{' '}
                              <span className="text-pink-700 font-bold">{m.jumlahP} P</span>
                            </td>
                            <td className="p-2.5 text-center font-black text-emerald-800">
                              {m.terpakai} Jiwa
                            </td>
                            <td className="p-2.5 text-center">
                              {m.tiketPanggungDiberi > 0 ? (
                                <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                                  ★ 1 Tiket
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                /* TAB 2 MODAL: BELUM HADIR */
                modalBelumHadirAttendees.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <UserCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Seluruh peserta pada kategori ini sudah hadir lengkap!</p>
                    <p className="text-xs text-slate-400 mt-1">Tidak ada peserta yang belum hadir.</p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5 w-10 text-center">NO</th>
                          <th className="p-2.5">KODE</th>
                          <th className="p-2.5">NAMA SANTRI / TAMU</th>
                          <th className="p-2.5">WALI / INSTANSI</th>
                          <th className="p-2.5 text-center">KUOTA JATAH</th>
                          <th className="p-2.5 text-center">KONFIRMASI WA</th>
                          <th className="p-2.5 text-center">ESTIMASI</th>
                          <th className="p-2.5 text-center">NO. HP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {modalBelumHadirAttendees.map((m, idx) => (
                          <tr key={m.kode} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                            <td className="p-2.5 font-mono font-bold text-slate-900">{m.kode}</td>
                            <td className="p-2.5 font-bold text-slate-900">{m.nama}</td>
                            <td className="p-2.5 text-slate-700">{m.waliAtauInstansi}</td>
                            <td className="p-2.5 text-center font-mono">
                              <span className="font-bold text-slate-900">{m.totalKuota}</span>
                              <span className="text-[10px] text-slate-500 block">
                                ({m.kuotaDasar}{m.kuotaTambahan > 0 ? `+${m.kuotaTambahan}` : ''})
                              </span>
                            </td>
                            <td className="p-2.5 text-center">
                              {m.statusKonfirmasi === 'SUDAH' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Sudah</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                                  <span>Belum</span>
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-center font-mono text-[11px]">
                              {m.statusKonfirmasi === 'SUDAH' ? (
                                <span>{m.estimasiL || 0}L / {m.estimasiP || 0}P</span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                            <td className="p-2.5 text-center font-mono text-[11px]">
                              {m.noHp && m.noHp !== '-' ? (
                                <div className="flex items-center justify-center gap-1 text-slate-700">
                                  <Phone className="w-2.5 h-2.5 text-emerald-600" />
                                  <span>{m.noHp}</span>
                                </div>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs text-slate-600 font-medium">
                {modalTab === 'HADIR' ? (
                  <>
                    Total Jiwa Hadir Kategori Ini:{' '}
                    <strong className="text-slate-900">
                      {modalHadirAttendees.reduce((acc, c) => acc + c.terpakai, 0)} Jiwa
                    </strong>
                  </>
                ) : (
                  <>
                    Total Belum Hadir Kategori Ini:{' '}
                    <strong className="text-amber-900">
                      {modalBelumHadirAttendees.length} Peserta
                    </strong>{' '}
                    (Potensi: {modalBelumHadirAttendees.reduce((acc, c) => acc + c.totalKuota, 0)} Kursi)
                  </>
                )}
              </div>
              <button
                onClick={() => setModalKategori(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
