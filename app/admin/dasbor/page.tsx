'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  QrCode,
  Utensils,
  Clock,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Search,
  Award,
  CheckCircle2,
  Filter,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  MapPin,
  ShieldCheck,
  Radio,
  Phone,
  Building,
  X,
  Compass,
} from 'lucide-react';
import { store } from '@/lib/mock-data';
import DenahModal from '@/components/DenahModal';
import {
  DaftarHadirRealtimeItem,
  DaftarBelumHadirItem,
  BAGIAN_TAMATAN_LIST,
  extractBagianTamatan,
} from '@/lib/types';

type TabKategoriDasbor =
  | 'SEMUA'
  | 'BIL_GHOIB'
  | 'BIN_NADZOR'
  | 'TAMATAN'
  | 'UNDANGAN'
  | 'UNDANGAN_ISTIMEWA'
  | 'UNDANGAN_KEHORMATAN'
  | 'UNDANGAN_UMUM';

function getGolonganUndangan(u: any): 'ISTIMEWA' | 'KEHORMATAN' | 'UMUM' {
  if (u.golongan) {
    if (u.golongan === 'ISTIMEWA' || u.golongan === 'UNDANGAN_ISTIMEWA') return 'ISTIMEWA';
    if (u.golongan === 'KEHORMATAN' || u.golongan === 'UNDANGAN_KEHORMATAN') return 'KEHORMATAN';
    if (u.golongan === 'UMUM' || u.golongan === 'UNDANGAN_UMUM') return 'UMUM';
  }

  const text = `${u.kategori || ''} ${u.nama || ''} ${u.instansi || ''}`.toLowerCase();

  if (
    text.includes('vvip') ||
    text.includes('bani') ||
    text.includes('bandar') ||
    text.includes('kunir') ||
    text.includes('istimewa')
  ) {
    return 'ISTIMEWA';
  }

  if (
    text.includes('masyayikh') ||
    text.includes('habaib') ||
    text.includes('pejabat') ||
    text.includes('forkopimda') ||
    text.includes('pengasuh') ||
    text.includes('tokoh') ||
    text.includes('kehormatan')
  ) {
    return 'KEHORMATAN';
  }

  return 'UMUM';
}

export default function DasborPage() {
  const [stats, setStats] = useState(() => store.getStatistikLive());
  const [pagu, setPagu] = useState(() => store.getPaguInfo());
  const [daftarHadir, setDaftarHadir] = useState<DaftarHadirRealtimeItem[]>(() =>
    store.getDaftarHadirRealtime()
  );
  const [daftarBelumHadir, setDaftarBelumHadir] = useState<DaftarBelumHadirItem[]>(() =>
    store.getDaftarBelumHadir()
  );
  const [logKedatangan, setLogKedatangan] = useState<any[]>(() =>
    store.getLogKedatanganDetail()
  );
  const [keluargaList, setKeluargaList] = useState<any[]>(() => store.getKeluargaList());
  const [undanganList, setUndanganList] = useState<any[]>(() => store.getUndanganList());

  const [searchQuery, setSearchQuery] = useState('');
  const [tabKategori, setTabKategori] = useState<TabKategoriDasbor>('SEMUA');
  const [statusHadirFilter, setStatusHadirFilter] = useState<'SEMUA' | 'SUDAH' | 'BELUM'>('SEMUA');
  const [demographicFilter, setDemographicFilter] = useState<'SEMUA' | 'LAKI' | 'PEREMPUAN' | 'PANGGUNG' | 'BALITA'>('SEMUA');
  const [subFilter, setSubFilter] = useState<string>('SEMUA');
  const [viewMode, setViewMode] = useState<'NAMA' | 'LOG'>('NAMA');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [isDenahOpen, setIsDenahOpen] = useState(false);

  const handleToggleDemographic = (val: 'LAKI' | 'PEREMPUAN' | 'PANGGUNG' | 'BALITA') => {
    if (demographicFilter === val) {
      setDemographicFilter('SEMUA');
    } else {
      setDemographicFilter(val);
      if (val === 'BALITA') {
        setViewMode('LOG');
      }
      const el = document.getElementById('daftar-hadir-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    setCurrentPage(1);
  };

  const refreshData = () => {
    setStats(store.getStatistikLive());
    setPagu(store.getPaguInfo());
    setDaftarHadir(store.getDaftarHadirRealtime());
    setDaftarBelumHadir(store.getDaftarBelumHadir());
    setLogKedatangan(store.getLogKedatanganDetail());
    setKeluargaList([...store.getKeluargaList()]);
    setUndanganList([...store.getUndanganList()]);
  };

  useEffect(() => {
    refreshData();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as TabKategoriDasbor;
      const qParam = params.get('q');
      const statusParam = params.get('status') as any;

      if (
        tabParam &&
        [
          'SEMUA',
          'BIL_GHOIB',
          'BIN_NADZOR',
          'TAMATAN',
          'UNDANGAN',
          'UNDANGAN_ISTIMEWA',
          'UNDANGAN_KEHORMATAN',
          'UNDANGAN_UMUM',
        ].includes(tabParam)
      ) {
        setTabKategori(tabParam);
      }
      if (qParam) {
        setSearchQuery(qParam);
      }
      if (statusParam && ['SEMUA', 'SUDAH', 'BELUM'].includes(statusParam)) {
        setStatusHadirFilter(statusParam);
      }
    }
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, []);

  const totalPindaian = (stats.jalurBarat || 0) + (stats.jalurTimur || 0);
  const pctBarat = totalPindaian > 0 ? Math.round((stats.jalurBarat / totalPindaian) * 100) : 50;
  const pctTimur = totalPindaian > 0 ? Math.round((stats.jalurTimur / totalPindaian) * 100) : 50;

  // Formulasi Konsumsi Panitia §18.2: Porsi = Total Kuota × 0.87 × 1.05
  const totalPorsiEstimasi = Math.round(stats.totalKuota * 0.87 * 1.05);
  const porsiTerpakai = stats.totalHadir;
  const sisaPorsi = Math.max(0, totalPorsiEstimasi - porsiTerpakai);

  // Kategori Stats Fallback
  const kStats = stats.kategoriStats || {
    bilGhoib: {
      nama: 'Bil Ghoib (64 Khadimatul Qur-an)',
      subLabel: '64 Santri · 256 Kuota Dasar (Tiket Hijau + Emas Panggung)',
      warnaTiket: 'Hijau (+Emas Panggung)',
      badgeWarna: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      totalPeserta: 64,
      hadirPeserta: 3,
      totalKuota: 256,
      totalHadir: 6,
      persentase: 2,
    },
    binNadzor: {
      nama: 'Bin Nadzori (6 Jenjang Kelas)',
      subLabel: '159 Santri · 318 Kuota Dasar (Tiket Biru)',
      warnaTiket: 'Biru',
      badgeWarna: 'bg-blue-100 text-blue-900 border-blue-300',
      totalPeserta: 159,
      hadirPeserta: 2,
      totalKuota: 318,
      totalHadir: 4,
      persentase: 1,
    },
    tamatan: {
      nama: 'Tamatan III Aliyah (7 Bagian)',
      subLabel: '326 Santri · 652 Kuota Dasar (Tiket Kuning)',
      warnaTiket: 'Kuning',
      badgeWarna: 'bg-amber-100 text-amber-900 border-amber-300',
      totalPeserta: 326,
      hadirPeserta: 3,
      totalKuota: 652,
      totalHadir: 6,
      persentase: 1,
    },
    tamuUndangan: {
      nama: 'Tamu Undangan Khusus (Penguji & Asatidz)',
      subLabel: '70 Tokoh Kehormatan · 140 Kuota VIP (Tiket Putih)',
      warnaTiket: 'Putih VIP',
      badgeWarna: 'bg-stone-100 text-stone-900 border-stone-300',
      totalPeserta: 70,
      hadirPeserta: 6,
      totalKuota: 140,
      totalHadir: 12,
      persentase: 9,
    },
  };

  const tamuStat = stats.tamuUndanganStat || {
    totalUndangan: 70,
    hadirUndangan: 6,
    totalKuota: 140,
    totalHadir: 12,
    totalLaki: 8,
    totalPerempuan: 4,
    persentase: 9,
  };

  // 1. Unified Reactive Participant List (Santri + Tamu)
  const allUnifiedPeserta = useMemo(() => {
    const list: any[] = [];

    // Santri Sohibul Hajat
    for (const kel of keluargaList) {
      const santri = kel.santri?.[0];
      const log = logKedatangan.find((l) => l.kode === kel.kode);
      const sudahHadir = kel.kuota.terpakai > 0;

      let katLabel = santri?.subKategori || santri?.kategoriUtama || 'Santri';
      let bg = '';
      if (santri?.kategoriUtama === 'TAMATAN') {
        bg = extractBagianTamatan(santri.subKategori) || 'A.01';
        katLabel = `Tamatan Bagian ${bg}`;
      } else if (santri?.kategoriUtama === 'BIL_GHOIB') {
        katLabel = 'Bil Ghoib (Khadimatul Qur-an)';
      } else if (santri?.kelas) {
        katLabel = `Bin Nadzori ${santri.kelas}`;
      }

      let warna = 'Biru';
      if (santri?.kategoriUtama === 'TAMATAN') warna = 'Kuning';
      else if (santri?.kategoriUtama === 'BIL_GHOIB') warna = 'Hijau (+Emas ★)';

      list.push({
        id: kel.id,
        kode: kel.kode,
        tipe: 'SANTRI',
        kategoriUtama: santri?.kategoriUtama || 'BIN_NADZOR',
        bagianTamatan: bg,
        nama: santri?.nama || 'Santri',
        waliAtauInstansi: kel.namaWali,
        kategori: katLabel,
        kelasAtauSub: santri?.kelas || santri?.subKategori || '-',
        kamar: (santri as any)?.kamar || '',
        noHp: kel.noHp,
        alamat: kel.alamat,
        kuotaDasar: kel.kuota.kuotaDasar,
        kuotaTambahan: kel.kuota.kuotaTambahan || 0,
        totalKuota: kel.kuota.kuotaDasar + (kel.kuota.kuotaTambahan || 0),
        terpakai: kel.kuota.terpakai,
        sisa: Math.max(0, kel.kuota.kuotaDasar + (kel.kuota.kuotaTambahan || 0) - kel.kuota.terpakai),
        warnaTiket: warna,
        tiketPanggungJatah: kel.kuota.tiketPanggungJatah || 0,
        tiketPanggungDiberi: kel.kuota.tiketPanggungDiberi || 0,
        statusKehadiran: sudahHadir ? 'SUDAH' : 'BELUM',
        jamMasuk: log?.serverTime || (sudahHadir ? '08:15:00' : undefined),
        jalur: log?.jalur || (sudahHadir ? 'TIMUR' : undefined),
        jumlahL: log ? log.jumlahL : (kel.kuota.terpakai > 1 ? 1 : 0),
        jumlahP: log ? log.jumlahP : (kel.kuota.terpakai > 1 ? kel.kuota.terpakai - 1 : kel.kuota.terpakai),
        statusKonfirmasi: kel.estimasi?.statusKonfirmasi || 'SUDAH',
      });
    }

    // Tamu Undangan Khusus
    for (const und of undanganList) {
      const log = logKedatangan.find((l) => l.kode === und.kode);
      const sudahHadir = und.kuota.terpakai > 0;
      const gol = getGolonganUndangan(und);

      list.push({
        id: und.id,
        kode: und.kode,
        tipe: 'UNDANGAN',
        kategoriUtama: 'UNDANGAN',
        golonganUndangan: gol,
        bagianTamatan: '',
        nama: und.nama,
        waliAtauInstansi: und.instansi || (und as any).alamat || '-',
        kategori: und.kategori || 'Tamu Undangan Khusus',
        kelasAtauSub:
          gol === 'ISTIMEWA'
            ? 'VVIP & VIP'
            : gol === 'KEHORMATAN'
            ? 'Tamu Khusus'
            : und.subKategori === 'PENGUJI'
            ? "Penguji Al-Qur'an"
            : 'Tamu Undangan Umum',
        kamar: '',
        noHp: '-',
        alamat: (und as any).alamat || und.instansi || 'Kediri',
        kuotaDasar: und.kuota.kuotaDasar,
        kuotaTambahan: und.kuota.kuotaTambahan || 0,
        totalKuota: und.kuota.kuotaDasar + (und.kuota.kuotaTambahan || 0),
        terpakai: und.kuota.terpakai,
        sisa: Math.max(0, und.kuota.kuotaDasar + (und.kuota.kuotaTambahan || 0) - und.kuota.terpakai),
        warnaTiket: 'Putih VIP',
        tiketPanggungJatah: 0,
        tiketPanggungDiberi: 0,
        statusKehadiran: sudahHadir ? 'SUDAH' : 'BELUM',
        jamMasuk: log?.serverTime || (sudahHadir ? '08:30:00' : undefined),
        jalur: log?.jalur || (sudahHadir ? 'BARAT' : undefined),
        jumlahL: log ? log.jumlahL : und.kuota.terpakai,
        jumlahP: log ? log.jumlahP : 0,
        statusKonfirmasi: 'SUDAH',
      });
    }

    return list;
  }, [keluargaList, undanganList, logKedatangan]);

  // 2. 7 Kategori Summary Metrics (Persis Screenshot Referensi)
  const categorySummaryStats = useMemo(() => {
    let bilGhoibCount = 0;
    let binNadzorCount = 0;
    let tamatanCount = 0;
    let undanganIstimewaCount = 0;
    let undanganKehormatanCount = 0;
    let undanganUmumCount = 0;

    let hadirBilGhoib = 0;
    let hadirBinNadzor = 0;
    let hadirTamatan = 0;
    let hadirIstimewa = 0;
    let hadirKehormatan = 0;
    let hadirUmum = 0;

    for (const item of allUnifiedPeserta) {
      const hadir = item.statusKehadiran === 'SUDAH';
      if (item.kategoriUtama === 'BIL_GHOIB') {
        bilGhoibCount++;
        if (hadir) hadirBilGhoib++;
      } else if (item.kategoriUtama === 'BIN_NADZOR') {
        binNadzorCount++;
        if (hadir) hadirBinNadzor++;
      } else if (item.kategoriUtama === 'TAMATAN') {
        tamatanCount++;
        if (hadir) hadirTamatan++;
      } else if (item.tipe === 'UNDANGAN') {
        if (item.golonganUndangan === 'ISTIMEWA') {
          undanganIstimewaCount++;
          if (hadir) hadirIstimewa++;
        } else if (item.golonganUndangan === 'KEHORMATAN') {
          undanganKehormatanCount++;
          if (hadir) hadirKehormatan++;
        } else {
          undanganUmumCount++;
          if (hadir) hadirUmum++;
        }
      }
    }

    const undanganCount = undanganIstimewaCount + undanganKehormatanCount + undanganUmumCount;
    const hadirUndangan = hadirIstimewa + hadirKehormatan + hadirUmum;
    const totalSemua = allUnifiedPeserta.length;
    const totalHadir = hadirBilGhoib + hadirBinNadzor + hadirTamatan + hadirUndangan;

    return {
      totalSemua,
      totalHadir,
      totalBelum: totalSemua - totalHadir,
      bilGhoibCount,
      hadirBilGhoib,
      belumBilGhoib: bilGhoibCount - hadirBilGhoib,
      binNadzorCount,
      hadirBinNadzor,
      belumBinNadzor: binNadzorCount - hadirBinNadzor,
      tamatanCount,
      hadirTamatan,
      belumTamatan: tamatanCount - hadirTamatan,
      undanganCount,
      hadirUndangan,
      belumUndangan: undanganCount - hadirUndangan,
      undanganIstimewaCount,
      hadirIstimewa,
      belumIstimewa: undanganIstimewaCount - hadirIstimewa,
      undanganKehormatanCount,
      hadirKehormatan,
      belumKehormatan: undanganKehormatanCount - hadirKehormatan,
      undanganUmumCount,
      hadirUmum,
      belumUmum: undanganUmumCount - hadirUmum,
    };
  }, [allUnifiedPeserta]);

  // 3. Dynamic Sub Filter Options
  const subFilterOptions = useMemo(() => {
    switch (tabKategori) {
      case 'TAMATAN':
        return [
          { value: 'SEMUA', label: `Semua Bagian Tamatan (${categorySummaryStats.tamatanCount})` },
          ...BAGIAN_TAMATAN_LIST.map((bg) => {
            const count = allUnifiedPeserta.filter(
              (it) => it.kategoriUtama === 'TAMATAN' && it.bagianTamatan === bg
            ).length;
            return { value: bg, label: `Bagian ${bg} (${count})` };
          }),
        ];
      case 'UNDANGAN':
        return [
          { value: 'SEMUA', label: `Semua Tamu Undangan (${categorySummaryStats.undanganCount})` },
          { value: 'ISTIMEWA', label: `🌟 Istimewa (VVIP & VIP) (${categorySummaryStats.undanganIstimewaCount})` },
          { value: 'KEHORMATAN', label: `🏛️ Kehormatan (Tamu Khusus) (${categorySummaryStats.undanganKehormatanCount})` },
          { value: 'UMUM', label: `👥 Tamu Undangan Umum (${categorySummaryStats.undanganUmumCount})` },
        ];
      case 'BIL_GHOIB': {
        const distinctKamar = Array.from(
          new Set(allUnifiedPeserta.filter((it) => it.kategoriUtama === 'BIL_GHOIB' && it.kamar).map((it) => it.kamar))
        );
        return [
          { value: 'SEMUA', label: `Semua Santri Bil Ghoib (${categorySummaryStats.bilGhoibCount})` },
          ...distinctKamar.map((kmr) => {
            const count = allUnifiedPeserta.filter(
              (it) => it.kategoriUtama === 'BIL_GHOIB' && it.kamar === kmr
            ).length;
            return { value: `KAMAR:${kmr}`, label: `Kamar ${kmr} (${count})` };
          }),
        ];
      }
      case 'BIN_NADZOR': {
        const distinctKamar = Array.from(
          new Set(allUnifiedPeserta.filter((it) => it.kategoriUtama === 'BIN_NADZOR' && it.kamar).map((it) => it.kamar))
        );
        return [
          { value: 'SEMUA', label: `Semua Santri Bin Nadzori (${categorySummaryStats.binNadzorCount})` },
          ...distinctKamar.map((kmr) => {
            const count = allUnifiedPeserta.filter(
              (it) => it.kategoriUtama === 'BIN_NADZOR' && it.kamar === kmr
            ).length;
            return { value: `KAMAR:${kmr}`, label: `Kamar ${kmr} (${count})` };
          }),
        ];
      }
      case 'SEMUA':
      default:
        return [
          { value: 'SEMUA', label: `Semua Kategori & Bagian (${categorySummaryStats.totalSemua})` },
          { value: 'BIL_GHOIB', label: `Bil Ghoib (${categorySummaryStats.bilGhoibCount})` },
          { value: 'BIN_NADZOR', label: `Bin Nadzori (${categorySummaryStats.binNadzorCount})` },
          { value: 'TAMATAN', label: `Semua Tamatan (${categorySummaryStats.tamatanCount})` },
          ...BAGIAN_TAMATAN_LIST.map((bg) => {
            const count = allUnifiedPeserta.filter(
              (it) => it.kategoriUtama === 'TAMATAN' && it.bagianTamatan === bg
            ).length;
            return { value: bg, label: `— Tamatan Bagian ${bg} (${count})` };
          }),
          { value: 'UNDANGAN_ISTIMEWA', label: `🌟 Istimewa (VVIP & VIP) (${categorySummaryStats.undanganIstimewaCount})` },
          { value: 'UNDANGAN_KEHORMATAN', label: `🏛️ Kehormatan (Tamu Khusus) (${categorySummaryStats.undanganKehormatanCount})` },
          { value: 'UNDANGAN_UMUM', label: `👥 Tamu Undangan Umum (${categorySummaryStats.undanganUmumCount})` },
        ];
    }
  }, [tabKategori, categorySummaryStats, allUnifiedPeserta]);

  // Jaga agar subFilter selalu valid
  useEffect(() => {
    const exists = subFilterOptions.some((o) => o.value === subFilter);
    if (!exists) setSubFilter('SEMUA');
  }, [tabKategori, subFilterOptions, subFilter]);

  // 4. Filter List Peserta (Tamu & Santri)
  const filteredPesertaList = useMemo(() => {
    return allUnifiedPeserta.filter((item) => {
      // 1. Tab Kategori
      if (tabKategori === 'BIL_GHOIB' && item.kategoriUtama !== 'BIL_GHOIB') return false;
      if (tabKategori === 'BIN_NADZOR' && item.kategoriUtama !== 'BIN_NADZOR') return false;
      if (tabKategori === 'TAMATAN' && item.kategoriUtama !== 'TAMATAN') return false;
      if (tabKategori === 'UNDANGAN' && item.tipe !== 'UNDANGAN') return false;
      if (tabKategori === 'UNDANGAN_ISTIMEWA' && (item.tipe !== 'UNDANGAN' || item.golonganUndangan !== 'ISTIMEWA')) return false;
      if (tabKategori === 'UNDANGAN_KEHORMATAN' && (item.tipe !== 'UNDANGAN' || item.golonganUndangan !== 'KEHORMATAN')) return false;
      if (tabKategori === 'UNDANGAN_UMUM' && (item.tipe !== 'UNDANGAN' || item.golonganUndangan !== 'UMUM')) return false;

      // 2. Status Hadir Filter
      if (statusHadirFilter === 'SUDAH' && item.statusKehadiran !== 'SUDAH') return false;
      if (statusHadirFilter === 'BELUM' && item.statusKehadiran !== 'BELUM') return false;

      // 3. Sub Filter Dinamis
      if (subFilter && subFilter !== 'SEMUA') {
        if (tabKategori === 'SEMUA') {
          if (subFilter === 'BIL_GHOIB' && item.kategoriUtama !== 'BIL_GHOIB') return false;
          if (subFilter === 'BIN_NADZOR' && item.kategoriUtama !== 'BIN_NADZOR') return false;
          if (subFilter === 'TAMATAN' && item.kategoriUtama !== 'TAMATAN') return false;
          if ((subFilter.startsWith('A.') || subFilter.startsWith('B.')) && (item.kategoriUtama !== 'TAMATAN' || item.bagianTamatan !== subFilter)) return false;
          if (subFilter === 'UNDANGAN_ISTIMEWA' && (item.tipe !== 'UNDANGAN' || item.golonganUndangan !== 'ISTIMEWA')) return false;
          if (subFilter === 'UNDANGAN_KEHORMATAN' && (item.tipe !== 'UNDANGAN' || item.golonganUndangan !== 'KEHORMATAN')) return false;
          if (subFilter === 'UNDANGAN_UMUM' && (item.tipe !== 'UNDANGAN' || item.golonganUndangan !== 'UMUM')) return false;
        } else if (tabKategori === 'TAMATAN') {
          if (item.bagianTamatan !== subFilter) return false;
        } else if (tabKategori === 'UNDANGAN') {
          if (item.golonganUndangan !== subFilter) return false;
        } else if (subFilter.startsWith('KAMAR:')) {
          if (item.kamar !== subFilter.replace('KAMAR:', '')) return false;
        }
      }

      // 4. Pencarian Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNama = item.nama?.toLowerCase().includes(q);
        const matchWali = item.waliAtauInstansi?.toLowerCase().includes(q);
        const matchKode = item.kode?.toLowerCase().includes(q);
        const matchKat = item.kategori?.toLowerCase().includes(q);
        const matchSub = item.kelasAtauSub?.toLowerCase().includes(q);
        const matchAlamat = item.alamat?.toLowerCase().includes(q);
        const matchNoHp = item.noHp?.includes(q);
        if (!matchNama && !matchWali && !matchKode && !matchKat && !matchSub && !matchAlamat && !matchNoHp) return false;
      }

      // 5. Filter Demografis (Laki-laki / Perempuan / Panggung Emas / Balita)
      if (demographicFilter === 'LAKI') {
        if (item.statusKehadiran !== 'SUDAH' || ((item.jumlahL || 0) <= 0 && item.jalur !== 'BARAT')) return false;
      } else if (demographicFilter === 'PEREMPUAN') {
        if (item.statusKehadiran !== 'SUDAH' || ((item.jumlahP || 0) <= 0 && item.jalur !== 'TIMUR')) return false;
      } else if (demographicFilter === 'PANGGUNG') {
        if (item.kategoriUtama !== 'BIL_GHOIB' && (item.tiketPanggungJatah || 0) <= 0 && (item.tiketPanggungDiberi || 0) <= 0) return false;
      } else if (demographicFilter === 'BALITA') {
        if ((item.balita || 0) <= 0) return false;
      }

      return true;
    });
  }, [allUnifiedPeserta, tabKategori, statusHadirFilter, subFilter, searchQuery, demographicFilter]);

  // Filtered List Log Kedatangan Realtime
  const filteredLogKedatangan = useMemo(() => {
    return logKedatangan.filter((item) => {
      // Demographic Filter
      if (demographicFilter === 'LAKI') {
        if ((item.jumlahL || 0) <= 0 && item.jalur !== 'BARAT') return false;
      } else if (demographicFilter === 'PEREMPUAN') {
        if ((item.jumlahP || 0) <= 0 && item.jalur !== 'TIMUR') return false;
      } else if (demographicFilter === 'PANGGUNG') {
        if (!item.tiketPanggung && item.kategoriUtama !== 'BIL_GHOIB') return false;
      } else if (demographicFilter === 'BALITA') {
        if ((item.balita || 0) <= 0) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNama = item.nama?.toLowerCase().includes(q);
        const matchWali = item.waliAtauInstansi?.toLowerCase().includes(q);
        const matchKode = item.kode?.toLowerCase().includes(q);
        if (!matchNama && !matchWali && !matchKode) return false;
      }
      return true;
    });
  }, [logKedatangan, searchQuery, demographicFilter]);

  // Pagination Active Items
  const activeItems = viewMode === 'NAMA' ? filteredPesertaList : filteredLogKedatangan;
  const totalPages = Math.max(1, Math.ceil(activeItems.length / itemsPerPage));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return activeItems.slice(start, start + itemsPerPage);
  }, [activeItems, currentPage, itemsPerPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [tabKategori, statusHadirFilter, subFilter, searchQuery, viewMode, demographicFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Realtime: Warm Latte & Cinnamon Mocha Aesthetic */}
      <div className="bg-gradient-to-r from-[#FAF7F3] via-[#EFE8E1] to-[#FAF7F3] text-[#422F21] rounded-3xl p-6 shadow-sm border-2 border-[#8C6A47]/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FAF7F3] text-[#8C6A47] text-xs font-serif font-black border-2 border-[#D49B5B]">
            <span className="w-2 h-2 rounded-full bg-[#D49B5B] animate-ping"></span>
            <span>● LIVE MONITORING SISTEM · HAUL & HAFLAH 1448 H</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-black mt-2 tracking-tight text-[#422F21]">
            Dasbor Realtime Kehadiran & Manajemen Kuota
          </h1>
          <p className="text-xs text-[#7A624E] mt-0.5 font-medium">
            Gerbang Selatan Bola Dunia · 549 Santri Riil (64 Bil Ghoib + 159 Bin Nadzori + 326 Tamatan) + 70 Tamu Undangan Khusus
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-[11px] text-[#8C6A47] font-semibold">Status Sinkronisasi:</div>
            <div className="text-xs font-mono font-bold text-emerald-800 flex items-center justify-end space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>Terhubung (3 dtk)</span>
            </div>
          </div>
          <button
            onClick={() => setIsDenahOpen(true)}
            className="p-2.5 rounded-xl bg-white hover:bg-[#FAF7F3] text-[#5C3E28] border-2 border-[#D5C4B4] shadow-xs transition-colors flex items-center space-x-1.5 text-xs font-bold cursor-pointer"
            title="Buka Denah Lapangan Interaktif"
          >
            <Compass className="w-4 h-4 text-[#8C6A47]" />
            <span className="hidden sm:inline">Denah Lapangan</span>
          </button>
          <button
            onClick={refreshData}
            className="p-2.5 rounded-xl bg-white hover:bg-[#FAF7F3] text-[#8C6A47] border-2 border-[#8C6A47] shadow-sm transition-colors flex items-center space-x-1.5 text-xs font-bold"
            title="Muat Ulang Data Sekarang"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* METRIC UTAMA: PROGRESS PERSENTASE HADIR */}
      <div className="bg-[#FAF7F3] rounded-3xl p-6 shadow-sm border-2 border-[#D5C4B4] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="text-xs text-[#7A624E] font-bold uppercase tracking-wider">
              TOTAL KEHADIRAN WALI SANTRI & TAMU UNDANGAN:
            </div>
            <div className="text-3xl sm:text-4xl font-serif font-black text-[#422F21] mt-1">
              {stats.totalHadir.toLocaleString('id-ID')}{' '}
              <span className="text-lg font-normal text-[#7A624E] font-sans">
                / {stats.totalKuota.toLocaleString('id-ID')} KUOTA GLOBAL
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-3xl sm:text-4xl font-serif font-black text-[#8C6A47]">
              {stats.persentaseHadir}%
            </span>
            <span className="text-xs text-[#7A624E] block">Kapasitas Kursi Terisi</span>
          </div>
        </div>

        {/* Progress Bar Visual Moka ke Emas Karamel */}
        <div className="w-full bg-[#EFE8E1] rounded-full h-4 overflow-hidden p-0.5 border border-[#D5C4B4]">
          <div
            className="bg-gradient-to-r from-[#8C6A47] via-[#A47E57] to-[#D49B5B] h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.max(2, Math.min(100, stats.persentaseHadir))}%` }}
          ></div>
        </div>

        {/* Demographic Breakdown - Interactive Filter Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <button
            type="button"
            onClick={() => handleToggleDemographic('LAKI')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative shadow-xs hover:shadow-md ${
              demographicFilter === 'LAKI'
                ? 'bg-white border-[#8C6A47] ring-2 ring-[#8C6A47]/40 shadow-sm'
                : 'bg-[#EFE8E1]/80 border-[#D5C4B4] hover:bg-white hover:border-[#8C6A47]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[#5C3E28] font-bold">Wali / Tamu Laki-laki</span>
              {demographicFilter === 'LAKI' && (
                <span className="text-[9px] bg-[#8C6A47] text-white px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">Aktif</span>
              )}
            </div>
            <div className="text-xl font-black text-[#422F21] mt-0.5">{stats.totalLaki} Orang</div>
            <span className="text-[10px] text-[#8C6A47] block mt-0.5">Zona Laki-laki Aula · Klik filter</span>
          </button>

          <button
            type="button"
            onClick={() => handleToggleDemographic('PEREMPUAN')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative shadow-xs hover:shadow-md ${
              demographicFilter === 'PEREMPUAN'
                ? 'bg-white border-[#8C6A47] ring-2 ring-[#8C6A47]/40 shadow-sm'
                : 'bg-[#FAF7F3] border-[#D5C4B4] hover:bg-white hover:border-[#8C6A47]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[#5C3E28] font-bold">Wali / Tamu Perempuan</span>
              {demographicFilter === 'PEREMPUAN' && (
                <span className="text-[9px] bg-[#8C6A47] text-white px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">Aktif</span>
              )}
            </div>
            <div className="text-xl font-black text-[#422F21] mt-0.5">{stats.totalPerempuan} Orang</div>
            <span className="text-[10px] text-[#8C6A47] block mt-0.5">Zona Perempuan Aula · Klik filter</span>
          </button>

          <button
            type="button"
            onClick={() => handleToggleDemographic('PANGGUNG')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative shadow-xs hover:shadow-md ${
              demographicFilter === 'PANGGUNG'
                ? 'bg-white border-[#D49B5B] ring-2 ring-[#D49B5B]/50 shadow-sm'
                : 'bg-[#FCF3E4] border-[#D49B5B]/50 hover:bg-white hover:border-[#D49B5B]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[#543C28] font-bold">Tiket Panggung Emas</span>
              {demographicFilter === 'PANGGUNG' && (
                <span className="text-[9px] bg-[#D49B5B] text-white px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">Aktif</span>
              )}
            </div>
            <div className="text-xl font-black text-[#8C6A47] mt-0.5">
              {stats.totalPanggung} <span className="text-xs font-normal">Diserahkan</span>
            </div>
            <span className="text-[10px] text-[#D49B5B] block mt-0.5">Ibu Santriwati Bil Ghoib · Klik filter</span>
          </button>

          <button
            type="button"
            onClick={() => handleToggleDemographic('BALITA')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative shadow-xs hover:shadow-md ${
              demographicFilter === 'BALITA'
                ? 'bg-white border-[#8C6A47] ring-2 ring-[#8C6A47]/40 shadow-sm'
                : 'bg-[#EFE8E1]/60 border-[#D5C4B4] hover:bg-white hover:border-[#8C6A47]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[#5C3E28] font-bold">Anak Balita (Non-Kuota)</span>
              {demographicFilter === 'BALITA' && (
                <span className="text-[9px] bg-[#8C6A47] text-white px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">Aktif</span>
              )}
            </div>
            <div className="text-xl font-black text-[#422F21] mt-0.5">{stats.totalBalita} Anak</div>
            <span className="text-[10px] text-[#7A624E] block mt-0.5">Dicatat Gerbang Masuk · Klik filter</span>
          </button>
        </div>
      </div>



      {/* ========================================================================= */}
      {/* FITUR UTAMA: DAFTAR KEHADIRAN REALTIME DENGAN FILTER & STATUS KATEGORI    */}
      {/* ========================================================================= */}
      <div
        id="daftar-hadir-section"
        className="bg-[#FAF7F3] rounded-3xl p-6 shadow-sm border-2 border-[#8C6A47]/40 space-y-5"
      >
        {/* Header Bagian */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D5C4B4]/60 pb-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#EFE8E1] text-[#8C6A47] text-xs font-bold border border-[#D5C4B4]">
              <Radio className="w-3.5 h-3.5 text-[#D49B5B] animate-pulse" />
              <span>LIVE FEED PRESENSI LOKASI</span>
            </div>
            <h2 className="text-lg sm:text-xl font-serif font-black text-[#422F21] mt-1.5">
              Daftar Kehadiran Realtime · Monitoring Kedatangan Lokasi
            </h2>
            <p className="text-xs text-[#7A624E] mt-0.5">
              Pantau siapa saja yang sudah maupun belum tiba melewati gerbang pemeriksaan bola dunia per kategori.
            </p>
          </div>

          {/* Toggle View Mode */}
          <div className="inline-flex p-1 bg-[#EFE8E1] rounded-2xl border border-[#D5C4B4] self-start sm:self-auto text-xs font-bold">
            <button
              onClick={() => setViewMode('NAMA')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                viewMode === 'NAMA'
                  ? 'bg-white text-[#8C6A47] shadow-sm border border-[#8C6A47]/30'
                  : 'text-[#7A624E] hover:text-[#422F21]'
              }`}
            >
              Daftar Peserta ({filteredPesertaList.length})
            </button>
            <button
              onClick={() => setViewMode('LOG')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                viewMode === 'LOG'
                  ? 'bg-white text-[#8C6A47] shadow-sm border border-[#8C6A47]/30'
                  : 'text-[#7A624E] hover:text-[#422F21]'
              }`}
            >
              Log Aliran Scan ({filteredLogKedatangan.length})
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 7 KARTU KATEGORI (SEPERTI SCREENSHOT media_1790277624444)                */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {/* 1. Total Semua */}
          <div
            onClick={() => {
              setTabKategori('SEMUA');
              setSubFilter('SEMUA');
              setCurrentPage(1);
            }}
            className={`cursor-pointer p-3.5 rounded-2xl bg-white transition-all shadow-xs ${
              tabKategori === 'SEMUA'
                ? 'border-2 border-[#422F21] ring-1 ring-[#422F21]/20 shadow-sm'
                : 'border border-[#D5C4B4]/70 hover:border-[#8C6A47]/60'
            }`}
          >
            <div className="text-[11px] font-bold text-[#7A624E] uppercase tracking-wide truncate">
              TOTAL SEMUA
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-black text-[#422F21] mt-1">
              {categorySummaryStats.totalSemua}
            </div>
            <div className="text-[10px] text-[#7A624E] mt-0.5 truncate">
              Santri + Tamu Undangan
            </div>
          </div>

          {/* 2. Bil Ghoib */}
          <div
            onClick={() => {
              setTabKategori('BIL_GHOIB');
              setSubFilter('SEMUA');
              setCurrentPage(1);
            }}
            className={`cursor-pointer p-3.5 rounded-2xl bg-white transition-all shadow-xs ${
              tabKategori === 'BIL_GHOIB'
                ? 'border-2 border-[#422F21] ring-1 ring-[#422F21]/20 shadow-sm'
                : 'border border-[#D5C4B4]/70 hover:border-[#8C6A47]/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide truncate">
                BIL GHOIB
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-black text-[#422F21] mt-1">
              {categorySummaryStats.bilGhoibCount}
            </div>
            <div className="text-[10px] text-[#7A624E] mt-0.5 truncate">
              4 Kursi · Tiket Emas
            </div>
          </div>

          {/* 3. Bin Nadzori */}
          <div
            onClick={() => {
              setTabKategori('BIN_NADZOR');
              setSubFilter('SEMUA');
              setCurrentPage(1);
            }}
            className={`cursor-pointer p-3.5 rounded-2xl bg-white transition-all shadow-xs ${
              tabKategori === 'BIN_NADZOR'
                ? 'border-2 border-[#422F21] ring-1 ring-[#422F21]/20 shadow-sm'
                : 'border border-[#D5C4B4]/70 hover:border-[#8C6A47]/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wide truncate">
                BIN NADZORI
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-black text-[#422F21] mt-1">
              {categorySummaryStats.binNadzorCount}
            </div>
            <div className="text-[10px] text-[#7A624E] mt-0.5 truncate">
              2 Kursi · Tiket Biru
            </div>
          </div>

          {/* 4. Tamatan */}
          <div
            onClick={() => {
              setTabKategori('TAMATAN');
              setSubFilter('SEMUA');
              setCurrentPage(1);
            }}
            className={`cursor-pointer p-3.5 rounded-2xl bg-white transition-all shadow-xs ${
              tabKategori === 'TAMATAN'
                ? 'border-2 border-[#422F21] ring-1 ring-[#422F21]/20 shadow-sm'
                : 'border border-[#D5C4B4]/70 hover:border-[#8C6A47]/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide truncate">
                TAMATAN
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-black text-[#422F21] mt-1">
              {categorySummaryStats.tamatanCount}
            </div>
            <div className="text-[10px] text-[#7A624E] mt-0.5 truncate">
              A.01–B.03 · 2 Kursi
            </div>
          </div>

          {/* 5. Istimewa */}
          <div
            onClick={() => {
              setTabKategori('UNDANGAN_ISTIMEWA');
              setSubFilter('SEMUA');
              setCurrentPage(1);
            }}
            className={`cursor-pointer p-3.5 rounded-2xl bg-white transition-all shadow-xs ${
              tabKategori === 'UNDANGAN_ISTIMEWA'
                ? 'border-2 border-[#422F21] ring-1 ring-[#422F21]/20 shadow-sm'
                : 'border border-[#D5C4B4]/70 hover:border-[#8C6A47]/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wide truncate flex items-center space-x-1">
                <span>🌟</span>
                <span>ISTIMEWA</span>
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-black text-[#422F21] mt-1">
              {categorySummaryStats.undanganIstimewaCount}
            </div>
            <div className="text-[10px] text-[#7A624E] mt-0.5 truncate">
              VVIP &amp; VIP
            </div>
          </div>

          {/* 6. Kehormatan */}
          <div
            onClick={() => {
              setTabKategori('UNDANGAN_KEHORMATAN');
              setSubFilter('SEMUA');
              setCurrentPage(1);
            }}
            className={`cursor-pointer p-3.5 rounded-2xl bg-white transition-all shadow-xs ${
              tabKategori === 'UNDANGAN_KEHORMATAN'
                ? 'border-2 border-[#422F21] ring-1 ring-[#422F21]/20 shadow-sm'
                : 'border border-[#D5C4B4]/70 hover:border-[#8C6A47]/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] sm:text-[11px] font-bold text-purple-800 uppercase tracking-tight flex items-center space-x-1 min-w-0">
                <span className="shrink-0">🏛️</span>
                <span className="truncate">KEHORMATAN</span>
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0 ml-1"></span>
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-black text-[#422F21] mt-1">
              {categorySummaryStats.undanganKehormatanCount}
            </div>
            <div className="text-[10px] text-[#7A624E] mt-0.5 truncate">
              Tamu Khusus
            </div>
          </div>

          {/* 7. Umum */}
          <div
            onClick={() => {
              setTabKategori('UNDANGAN_UMUM');
              setSubFilter('SEMUA');
              setCurrentPage(1);
            }}
            className={`cursor-pointer p-3.5 rounded-2xl bg-white transition-all shadow-xs ${
              tabKategori === 'UNDANGAN_UMUM'
                ? 'border-2 border-[#422F21] ring-1 ring-[#422F21]/20 shadow-sm'
                : 'border border-[#D5C4B4]/70 hover:border-[#8C6A47]/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-cyan-800 uppercase tracking-wide truncate flex items-center space-x-1">
                <span>👥</span>
                <span>UMUM</span>
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0"></span>
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-black text-[#422F21] mt-1">
              {categorySummaryStats.undanganUmumCount}
            </div>
            <div className="text-[10px] text-[#7A624E] mt-0.5 truncate">
              Tamu Undangan Umum
            </div>
          </div>
        </div>

        {/* Active Demographic Banner if filtered */}
        {demographicFilter !== 'SEMUA' && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-[#543C28] shadow-xs">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-[#8C6A47]" />
              <span>
                Menampilkan data terfilter demografi: <strong className="text-[#8C6A47] font-black">
                  {demographicFilter === 'LAKI' && 'Wali / Tamu Laki-laki (Zona Laki-laki)'}
                  {demographicFilter === 'PEREMPUAN' && 'Wali / Tamu Perempuan (Zona Perempuan)'}
                  {demographicFilter === 'PANGGUNG' && 'Penerima Tiket Panggung Emas'}
                  {demographicFilter === 'BALITA' && 'Anak Balita (Non-Kuota)'}
                </strong>
              </span>
            </div>
            <button
              onClick={() => handleToggleDemographic(demographicFilter)}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-[#543C28] font-bold text-[11px] transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Hapus Filter Demografi</span>
            </button>
          </div>
        )}

        {/* 2 Pilihan Segmented Control: Seluruh yang Sudah Hadir vs Siapa Saja yang Belum Hadir */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2 border-t border-[#D5C4B4]/60">
          <div className="flex items-center bg-[#EFE8E1] p-1.5 rounded-2xl border border-[#D5C4B4] gap-1.5 self-start lg:self-auto shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setStatusHadirFilter('SUDAH');
                setCurrentPage(1);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-serif font-black transition-all flex items-center space-x-2 ${
                statusHadirFilter === 'SUDAH'
                  ? 'bg-[#8C6A47] text-white shadow-md border border-[#735334]'
                  : 'text-[#7A624E] hover:text-[#422F21] hover:bg-white/60'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>1. Seluruh yang Sudah Hadir ({allUnifiedPeserta.filter((p) => p.statusKehadiran === 'SUDAH').length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusHadirFilter('BELUM');
                setCurrentPage(1);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-serif font-black transition-all flex items-center space-x-2 ${
                statusHadirFilter === 'BELUM'
                  ? 'bg-amber-800 text-white shadow-md border border-amber-900'
                  : 'text-[#7A624E] hover:text-[#422F21] hover:bg-white/60'
              }`}
            >
              <UserX className="w-4 h-4" />
              <span>2. Siapa Saja yang Belum Hadir ({allUnifiedPeserta.filter((p) => p.statusKehadiran === 'BELUM').length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusHadirFilter('SEMUA');
                setCurrentPage(1);
              }}
              className={`px-3 py-2.5 rounded-xl text-xs font-serif font-bold transition-all ${
                statusHadirFilter === 'SEMUA'
                  ? 'bg-white text-[#422F21] shadow-xs border border-[#D5C4B4]'
                  : 'text-[#7A624E] hover:text-[#422F21]'
              }`}
            >
              Semua ({allUnifiedPeserta.length})
            </button>
          </div>

          {/* Quick Metrics Badges (Sesuai Screenshot media_1790335207719) */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-white border border-[#D5C4B4] font-semibold text-[#422F21] shadow-2xs">
              Peserta / Keluarga: <strong>{filteredPesertaList.length}</strong>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-100 border border-emerald-300 font-semibold text-emerald-900 shadow-2xs">
              Total Jiwa Hadir: <strong>{filteredPesertaList.reduce((acc, c) => acc + (c.terpakai || 0), 0)} Jiwa</strong>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 font-semibold text-blue-900 shadow-2xs">
              L: <strong>{filteredPesertaList.reduce((acc, c) => acc + (c.jumlahL || 0), 0)}</strong> | P: <strong>{filteredPesertaList.reduce((acc, c) => acc + (c.jumlahP || 0), 0)}</strong>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 font-semibold text-amber-950 shadow-2xs flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Panggung: <strong>{filteredPesertaList.reduce((acc, c) => acc + (c.tiketPanggungDiberi || 0), 0)}</strong></span>
            </span>
          </div>
        </div>

        {/* BAR PENCARIAN & DROPDOWN FILTER GANDA (KATEGORI & STATUS HADIR) */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
          {/* Input Pencarian */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-[#8C6A47] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nama santri, wali, kode (SH0001...), no HP, kamar, kota..."
              className="w-full pl-10 pr-8 py-2.5 rounded-2xl bg-white border border-[#D5C4B4] text-xs text-[#422F21] placeholder-[#7A624E]/70 focus:outline-none focus:border-[#8C6A47] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7A624E] hover:text-[#422F21]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sub / Bagian Filter Dinamis */}
          <div className="sm:col-span-3">
            <select
              value={subFilter}
              onChange={(e) => {
                setSubFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-2xl border border-[#D5C4B4] text-xs focus:outline-none focus:border-[#8C6A47] bg-white text-[#422F21] font-semibold"
            >
              {subFilterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown Status Hadir */}
          <div className="sm:col-span-3">
            <select
              value={statusHadirFilter}
              onChange={(e) => {
                setStatusHadirFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className={`w-full px-3 py-2.5 rounded-2xl text-xs focus:outline-none bg-white text-[#422F21] font-semibold transition-all ${
                statusHadirFilter !== 'SEMUA'
                  ? 'border-2 border-[#422F21] ring-1 ring-[#422F21]/20 font-bold'
                  : 'border border-[#D5C4B4] focus:border-[#8C6A47]'
              }`}
            >
              <option value="SEMUA">Semua Status Hadir</option>
              <option value="SUDAH">Sudah Hadir / Check-in</option>
              <option value="BELUM">Belum Hadir</option>
            </select>
          </div>
        </div>

        {/* Info Pencarian & Baris per Halaman (Persis Screenshot media_1790277624444) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#7A624E] pt-1">
          <div>
            Menampilkan <strong className="text-[#422F21] font-bold">{filteredPesertaList.length}</strong> data peserta
            {searchQuery && (
              <span> untuk pencarian &quot;<strong className="text-[#422F21]">{searchQuery}</strong>&quot;</span>
            )}
          </div>
          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <span>Baris per halaman:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 rounded-xl bg-white border border-[#D5C4B4] text-xs font-bold text-[#422F21] focus:outline-none focus:border-[#8C6A47]"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Indikator Geser di Layar HP */}
        <div className="md:hidden px-3.5 py-2 bg-amber-50/90 border-2 border-b-0 border-[#D5C4B4] rounded-t-2xl text-[11px] font-semibold text-[#8C6A47] flex items-center justify-between">
          <span className="flex items-center space-x-1.5">
            <span>👉</span>
            <span>Geser tabel ke samping untuk melihat Kuota & Aksi</span>
          </span>
          <span className="text-xs">↔️</span>
        </div>

        {/* TABEL DATA KEHADIRAN TERPADU */}
        <div className="overflow-x-auto rounded-b-2xl md:rounded-2xl border-2 border-[#D5C4B4] bg-white shadow-sm">
          {viewMode === 'NAMA' ? (
            <table className="w-full text-left text-xs text-[#422F21]">
              <thead className="bg-[#EFE8E1] text-[#5C3E28] font-bold uppercase tracking-wider border-b border-[#D5C4B4]">
                <tr>
                  <th className="py-3 px-3.5 whitespace-nowrap">Nama Lengkap & Kode</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Kategori & Sub-Bagian</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Wali / Lembaga & Kontak</th>
                  <th className="py-3 px-3.5 text-center whitespace-nowrap">Hak Kuota</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Status Kehadiran di Gerbang</th>
                  <th className="py-3 px-3.5 text-center whitespace-nowrap">Fasilitas Khusus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D5C4B4]/40">
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-[#7A624E]">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Users className="w-8 h-8 text-[#8C6A47]/40" />
                        <div className="font-bold text-sm">Tidak ada data peserta yang cocok dengan filter ini</div>
                        <div className="text-[11px] text-[#7A624E]">
                          Coba sesuaikan tab kategori, sub-bagian, atau status hadir di atas.
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  (paginatedItems as any[]).map((item) => {
                    const isSudah = item.statusKehadiran === 'SUDAH';
                    const isVip = item.tipe === 'UNDANGAN';

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-[#FAF7F3] transition-colors ${
                          isVip ? 'bg-[#FCF9F5]' : ''
                        }`}
                      >
                        {/* Nama & Kode */}
                        <td className="py-3 px-3.5">
                          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                            <span className="font-serif font-black text-xs sm:text-sm text-[#422F21]">
                              {item.nama}
                            </span>
                            {isVip ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-[#422F21] text-white shrink-0">
                                {item.golonganUndangan || 'VIP'}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#8C6A47]/15 text-[#5C3E28] shrink-0">
                                Santri
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[11px] text-[#8C6A47] font-semibold mt-0.5">
                            {item.kode}
                          </div>
                        </td>

                        {/* Kategori & Sub */}
                        <td className="py-3 px-3.5 min-w-[140px]">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                              item.kategoriUtama === 'UNDANGAN'
                                ? 'bg-[#EFE8E1] text-[#422F21] border border-[#8C6A47]/40'
                                : item.kategoriUtama === 'BIL_GHOIB'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : item.kategoriUtama === 'TAMATAN'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-blue-100 text-blue-900 border border-blue-300'
                            }`}
                          >
                            {item.kategori}
                          </span>
                          <div className="text-[11px] text-[#7A624E] mt-0.5 font-medium">
                            {item.kelasAtauSub}
                            {item.kamar && ` · Kamar ${item.kamar}`}
                          </div>
                        </td>

                        {/* Wali & Kontak */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#422F21]">{item.waliAtauInstansi}</div>
                          <div className="text-[11px] text-[#7A624E] flex items-center space-x-2 mt-0.5">
                            {item.noHp && item.noHp !== '-' ? (
                              <a
                                href={`https://wa.me/${item.noHp.replace(/\D/g, '').replace(/^0/, '62')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-700 hover:text-emerald-900 font-mono font-bold flex items-center space-x-1 underline"
                                title="Hubungi via WhatsApp"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{item.noHp}</span>
                              </a>
                            ) : (
                              <span className="text-[10px] text-gray-400">Tanpa Kontak HP</span>
                            )}
                          </div>
                          {item.alamat && item.alamat !== '-' && (
                            <div className="text-[10px] text-[#7A624E]/80 mt-0.5 truncate max-w-xs">
                              {item.alamat}
                            </div>
                          )}
                        </td>

                        {/* Hak Kuota */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="font-mono font-black text-sm text-[#422F21]">
                            {item.totalKuota} <span className="text-xs font-normal text-[#7A624E]">Kursi</span>
                          </div>
                          <div className="text-[10px] text-[#7A624E] mt-0.5">
                            {item.kuotaDasar} Dasar
                            {item.kuotaTambahan > 0 && ` + ${item.kuotaTambahan} Tambahan`}
                          </div>
                        </td>

                        {/* Status Kehadiran di Gerbang */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {isSudah ? (
                            <div>
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                Sudah Hadir ({item.terpakai} Kursi Terisi)
                              </span>
                              <div className="text-[10px] text-[#7A624E] font-medium mt-1">
                                {item.jamMasuk ? `Masuk ${item.jamMasuk} WIB` : 'Telah Tiba'}
                                {item.jalur && ` · ${item.jalur === 'BARAT' ? 'Pintu Barat' : item.jalur === 'TIMUR' ? 'Pintu Timur' : 'Rekonsiliasi'}`}
                                {item.tipe === 'UNDANGAN' && (
                                  <button
                                    onClick={() => {
                                      if (confirm(`Batalkan status hadir untuk ${item.nama}?`)) {
                                        (store as any).batalCheckin(item.kode);
                                        setStats(store.getStatistikLive());
                                        setKeluargaList(store.getKeluargaList());
                                        setUndanganList(store.getUndanganList());
                                        setLogKedatangan(store.getLogKedatanganDetail());
                                      }
                                    }}
                                    className="ml-2 text-slate-400 hover:text-rose-600 underline font-medium"
                                    title="Batalkan presensi (Reset)"
                                  >
                                    Reset
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                                Belum Hadir ({item.sisa} Kursi Utuh)
                              </span>
                              <div className="text-[10px] text-[#7A624E] font-medium mt-1">
                                Konfirmasi WA: {item.statusKonfirmasi || 'SUDAH'}
                              </div>
                              {item.tipe === 'UNDANGAN' && (
                                <div className="mt-1.5 flex items-center space-x-1.5">
                                  <button
                                    onClick={() => {
                                      const res = (store as any).fastTrackVipCheckin(item.kode, 2);
                                      if (res.ok) {
                                        setStats(store.getStatistikLive());
                                        setKeluargaList(store.getKeluargaList());
                                        setUndanganList(store.getUndanganList());
                                        setLogKedatangan(store.getLogKedatanganDetail());
                                        alert(res.pesan);
                                      }
                                    }}
                                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] shadow-xs transition-all active:scale-95"
                                    title="Check-in Cepat Protokoler VIP (Tanpa Scan HP)"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Hadirkan VIP (Fast-Track)</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Fasilitas Khusus */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {item.tiketPanggungJatah > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FCF3E4] text-[#8C6A47] border border-[#D49B5B]/50">
                              ★ Tiket Emas Panggung
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#7A624E] font-medium">
                              Tiket {item.warnaTiket}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            /* TABEL MODE LOG ALIRAN SCAN */
            <table className="w-full text-left text-xs text-[#422F21]">
              <thead className="bg-[#EFE8E1] text-[#5C3E28] font-bold uppercase tracking-wider border-b border-[#D5C4B4]">
                <tr>
                  <th className="py-3 px-4">Waktu Scan</th>
                  <th className="py-3 px-4">Nama Santri / Tamu</th>
                  <th className="py-3 px-4">Pintu Gerbang</th>
                  <th className="py-3 px-4 text-center">Rombongan Scan</th>
                  <th className="py-3 px-4">Tiket Panggung</th>
                  <th className="py-3 px-4">Petugas / Gate</th>
                  <th className="py-3 px-4">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D5C4B4]/40">
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#7A624E]">
                      Belum ada log scan yang cocok.
                    </td>
                  </tr>
                ) : (
                  (paginatedItems as any[]).map((log) => (
                    <tr key={log.id} className="hover:bg-[#FAF7F3] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold whitespace-nowrap">
                        {log.serverTime} WIB
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-sm text-[#422F21]">{log.nama}</div>
                        <div className="text-[11px] text-[#8C6A47] font-mono">
                          {log.kode} · {log.kategori}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.jalur === 'BARAT'
                              ? 'bg-blue-100 text-blue-800'
                              : log.jalur === 'TIMUR'
                              ? 'bg-pink-100 text-pink-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {log.jalur === 'BARAT'
                            ? 'Jalur Barat (Putra)'
                            : log.jalur === 'TIMUR'
                            ? 'Jalur Timur (Putri)'
                            : 'Rekonsiliasi'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="font-bold text-[#422F21]">
                          {log.jumlahL + log.jumlahP} Orang
                        </span>
                        <div className="text-[10px] text-[#7A624E]">
                          L: {log.jumlahL} · P: {log.jumlahP}
                          {log.jumlahBalita > 0 && ` · +${log.jumlahBalita} Balita`}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {log.tiketPanggung ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FCF3E4] text-[#8C6A47] border border-[#D49B5B]/50">
                            ★ Diserahkan
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-[#7A624E]">
                        {log.panitiaId}
                      </td>
                      <td className="py-3 px-4 text-xs text-[#7A624E]">
                        {log.catatan || 'Check-in pintu gerbang'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginasi & Keterangan Total */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-[#7A624E]">
          <div>
            Menampilkan{' '}
            <span className="font-bold text-[#422F21]">
              {activeItems.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
            </span>{' '}
            hingga{' '}
            <span className="font-bold text-[#422F21]">
              {Math.min(currentPage * itemsPerPage, activeItems.length)}
            </span>{' '}
            dari <span className="font-bold text-[#422F21]">{activeItems.length}</span> data terfilter
            {' '}
            (Kategori: <strong>{tabKategori}</strong> · Status: <strong>{statusHadirFilter}</strong>)
          </div>

          <div className="flex items-center space-x-2 self-center sm:self-auto">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-xl border border-[#D5C4B4] bg-white hover:bg-[#FAF7F3] disabled:opacity-40 disabled:hover:bg-white text-[#422F21] transition-colors"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-xs px-2">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-xl border border-[#D5C4B4] bg-white hover:bg-[#FAF7F3] disabled:opacity-40 disabled:hover:bg-white text-[#422F21] transition-colors"
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Denah Interaktif */}
      <DenahModal isOpen={isDenahOpen} onClose={() => setIsDenahOpen(false)} />
    </div>
  );
}
