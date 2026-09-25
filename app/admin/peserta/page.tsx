'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Trash2,
  Edit,
  Download,
  QrCode,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  Building,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  AlertTriangle,
  UserCheck,
  Check,
  RotateCcw,
} from 'lucide-react';
import { store } from '@/lib/mock-data';
import { BAGIAN_TAMATAN_LIST, extractBagianTamatan } from '@/lib/types';
import * as XLSX from 'xlsx';
import QRCode from 'qrcode';

type GolonganUndangan = 'ISTIMEWA' | 'KEHORMATAN' | 'UMUM';

// 1. Opsi Tamu Undangan Istimewa (Sesuai Permintaan)
const OPSI_UNDANGAN_ISTIMEWA = [
  'VVIP',
  'VIP Bani Marzuqi',
  'VIP Bani Qomariyah',
  'VIP Bani Mahrus (Zainab)',
  'VIP Bani Salamah',
  'VIP Bani Aisyah',
  'VIP Bandar',
  'VIP Keluarga Kunir – Blitar',
  'VIP Lainnya',
  'Lainnya (Ketik Sendiri...)',
];

// 2. Opsi Tamu Undangan Umum (Sesuai Permintaan)
const OPSI_UNDANGAN_UMUM = [
  'Asatidz Mhmtq Sekalian',
  'Asatidz Purna Bakti',
  'Asatidzah Mhmtq Nduduk Rumah',
  'Mustahiq Tamatan Non Purna',
  'Purna Mustahiqoh Ibtidaiyyah Tamatan Aliyah',
  'Pengajar Ekstrakurikuler Pondok (Mutakhorijin)',
  'Pengajar Unit',
  'Penguji Al-Qur\'an',
  'Perwakilan Pondok',
  'Lainnya (Ketik Sendiri...)',
];

function getGolonganUndangan(u: any): GolonganUndangan {
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

function matchUndanganCategory(itemCategory: string, filterCategory: string): boolean {
  if (!filterCategory || filterCategory === 'SEMUA') return true;
  if (!itemCategory) return false;

  const ic = itemCategory.toLowerCase().trim();
  const fc = filterCategory.toLowerCase().trim();

  if (ic === fc) return true;

  // Normalisasi karakter alfanumerik
  const cleanIc = ic.replace(/[^a-z0-9]/g, '');
  const cleanFc = fc.replace(/[^a-z0-9]/g, '');

  if (cleanIc === cleanFc) return true;

  // Keyword matching untuk variasi gelar & ejaan
  if (fc.includes('penguji') && ic.includes('penguji')) return true;
  if (fc.includes('purna bakti') && ic.includes('purna bakti')) return true;
  if (fc.includes('nduduk') && ic.includes('nduduk')) return true;
  if (fc.includes('mutakhorijin') && ic.includes('mutakhorijin')) return true;
  if (fc.includes('pengajar unit') && ic.includes('pengajar unit')) return true;
  if (fc.includes('marzuqi') && ic.includes('marzuqi')) return true;
  if (fc.includes('qomariyah') && ic.includes('qomariyah')) return true;
  if (fc.includes('mahrus') && ic.includes('mahrus')) return true;
  if (fc.includes('salamah') && ic.includes('salamah')) return true;
  if (fc.includes('aisyah') && ic.includes('aisyah')) return true;
  if (fc.includes('bandar') && ic.includes('bandar')) return true;
  if (fc.includes('kunir') && ic.includes('kunir')) return true;

  return cleanIc.includes(cleanFc) || cleanFc.includes(cleanIc);
}

type TabKategori =
  | 'SEMUA'
  | 'BIL_GHOIB'
  | 'BIN_NADZOR'
  | 'TAMATAN'
  | 'UNDANGAN'
  | 'UNDANGAN_ISTIMEWA'
  | 'UNDANGAN_KEHORMATAN'
  | 'UNDANGAN_UMUM';

export default function ManajemenPesertaPage() {
  const [keluargaList, setKeluargaList] = useState<any[]>([]);
  const [undanganList, setUndanganList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabKategori>('SEMUA');
  const [searchTerm, setSearchTerm] = useState('');
  const [bagianFilter, setBagianFilter] = useState<string>('SEMUA');
  const [statusHadirFilter, setStatusHadirFilter] = useState<'SEMUA' | 'SUDAH' | 'BELUM'>('SEMUA');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddUndanganModal, setShowAddUndanganModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deletingItem, setDeletingItem] = useState<any | null>(null);
  const [qrDetailItem, setQrDetailItem] = useState<any | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state tambah santri (tanpa Sub-Kategori / Juz / Tingkat)
  const [formData, setFormData] = useState({
    nama: '',
    kategoriUtama: 'BIL_GHOIB' as 'BIL_GHOIB' | 'BIN_NADZOR' | 'TAMATAN',
    bagianTamatan: 'A.01',
    kamar: 'Hafidzah',
    namaWali: '',
    noHp: '',
    alamat: '',
  });

  // Form state tambah undangan
  const [undanganForm, setUndanganForm] = useState({
    nama: '',
    namaPutra: '',
    namaPutri: '',
    kategori: 'VVIP',
    instansi: 'Kediri',
    alamat: 'Kediri',
    kuotaDasar: 2,
  });

  // State dropdown kategori undangan
  const [undanganKategoriDropdown, setUndanganKategoriDropdown] = useState<string>('VVIP');
  const [customKategoriInput, setCustomKategoriInput] = useState<string>('');

  // State dropdown kategori undangan saat edit
  const [editUndanganKategoriDropdown, setEditUndanganKategoriDropdown] = useState<string>('VVIP');
  const [editCustomKategoriInput, setEditCustomKategoriInput] = useState<string>('');

  // State Golongan Tamu Undangan (Istimewa, Kehormatan, Umum)
  const [selectedGolonganUndangan, setSelectedGolonganUndangan] = useState<GolonganUndangan>('ISTIMEWA');
  const [editGolonganUndangan, setEditGolonganUndangan] = useState<GolonganUndangan>('ISTIMEWA');

  const handleOpenAddUndangan = (gol: GolonganUndangan) => {
    setSelectedGolonganUndangan(gol);
    let defaultKategori = OPSI_UNDANGAN_ISTIMEWA[0];
    if (gol === 'KEHORMATAN') defaultKategori = 'Tamu Kehormatan';
    else if (gol === 'UMUM') defaultKategori = OPSI_UNDANGAN_UMUM[0];
    setUndanganKategoriDropdown(defaultKategori);
    setUndanganForm({
      nama: '',
      namaPutra: '',
      namaPutri: '',
      kategori: defaultKategori,
      instansi: gol === 'UMUM' ? 'Pondok Pesantren Lirboyo' : 'Kediri',
      alamat: 'Kediri',
      kuotaDasar: gol === 'ISTIMEWA' ? 2 : gol === 'KEHORMATAN' ? 4 : 2,
    });
    setCustomKategoriInput('');
    setShowAddUndanganModal(true);
  };

  const [fastTrackLoading, setFastTrackLoading] = useState<string | null>(null);

  const handleFastTrackVip = (item: any) => {
    setFastTrackLoading(item.kode);
    try {
      const res = (store as any).fastTrackVipCheckin(item.kode, 2);
      if (res.ok) {
        setKeluargaList(store.getKeluargaList());
        setUndanganList(store.getUndanganList());
        alert(res.pesan);
      } else {
        alert(res.pesan);
      }
    } finally {
      setFastTrackLoading(null);
    }
  };

  const handleBatalCheckinVip = (item: any) => {
    if (!confirm(`Batalkan status hadir untuk ${item.nama}? Kursi akan kembali kosong.`)) return;
    (store as any).batalCheckin(item.kode);
    setKeluargaList(store.getKeluargaList());
    setUndanganList(store.getUndanganList());
    alert(`Status hadir ${item.nama} berhasil dibatalkan.`);
  };

  const [showClearModal, setShowClearModal] = useState(false);
  const [clearScope, setClearScope] = useState<'SANTRI' | 'UNDANGAN' | 'SEMUA'>('SEMUA');

  const handleConfirmHapusSemua = () => {
    const res = (store as any).hapusSemuaPeserta(clearScope);
    if (res.ok) {
      refreshData();
      setShowClearModal(false);
      showToast(`✓ ${res.pesan}`);
    }
  };

  const handleOpenEdit = (item: any) => {
    const raw = item.raw || item;
    const gol = item.tipe === 'UNDANGAN' ? (item.golonganUndangan || getGolonganUndangan(raw)) : 'ISTIMEWA';

    let p = raw.namaPutra || item.namaPutra || '';
    let w = raw.namaPutri || item.namaPutri || '';
    if (!p && !w && item.tipe === 'UNDANGAN' && gol === 'ISTIMEWA') {
      if (item.nama && item.nama.includes(' & ')) {
        const parts = item.nama.split(' & ');
        p = parts[0]?.trim() || '';
        w = parts.slice(1).join(' & ')?.trim() || '';
      } else if (item.nama) {
        const upper = item.nama.toUpperCase();
        if (upper.startsWith('NYAI') || upper.startsWith('NING') || upper.startsWith('BU NYAI')) {
          w = item.nama;
        } else {
          p = item.nama;
        }
      }
    }

    setEditingItem({
      ...item,
      namaPutra: p,
      namaPutri: w,
      alamat: raw.alamat || item.alamat || raw.instansi || item.instansi || '',
      instansi: raw.instansi || item.instansi || raw.alamat || item.alamat || '',
    });

    if (item.tipe === 'UNDANGAN') {
      setEditGolonganUndangan(gol);
      if (gol !== 'KEHORMATAN') {
        const opts = gol === 'ISTIMEWA' ? OPSI_UNDANGAN_ISTIMEWA : OPSI_UNDANGAN_UMUM;
        const currentKat = item.kategori || '';
        if (opts.includes(currentKat)) {
          setEditUndanganKategoriDropdown(currentKat);
          setEditCustomKategoriInput('');
        } else {
          setEditUndanganKategoriDropdown('Lainnya (Ketik Sendiri...)');
          setEditCustomKategoriInput(currentKat);
        }
      }
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refreshData = () => {
    setKeluargaList([...store.getKeluargaList()]);
    setUndanganList([...store.getUndanganList()]);
  };

  useEffect(() => {
    refreshData();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as TabKategori;
      const qParam = params.get('q');
      const bagianParam = params.get('bagian');
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
        setActiveTab(tabParam);
      }
      if (qParam) {
        setSearchTerm(qParam);
      }
      if (bagianParam) {
        setBagianFilter(bagianParam);
      }
      const kelasParam = params.get('kelas');
      if (kelasParam) {
        setBagianFilter(`KELAS:${kelasParam}`);
      }
      if (statusParam && ['SEMUA', 'SUDAH', 'BELUM'].includes(statusParam)) {
        setStatusHadirFilter(statusParam);
      }
    }
  }, []);

  // Update QR code saat qrDetailItem berubah
  useEffect(() => {
    if (qrDetailItem) {
      const code = qrDetailItem.kode;
      QRCode.toDataURL(code, { width: 280, margin: 2 })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error(err));
    } else {
      setQrDataUrl('');
    }
  }, [qrDetailItem]);

  // Statistik per kategori
  const stats = useMemo(() => {
    let bilGhoibCount = 0;
    let binNadzorCount = 0;
    let tamatanCount = 0;
    let totalKuotaSantri = 0;
    let totalHadirSantri = 0;

    keluargaList.forEach((k) => {
      const kat = k.santri?.[0]?.kategoriUtama;
      if (kat === 'BIL_GHOIB') bilGhoibCount++;
      else if (kat === 'BIN_NADZOR') binNadzorCount++;
      else if (kat === 'TAMATAN') tamatanCount++;

      totalKuotaSantri += (k.kuota?.kuotaDasar || 0) + (k.kuota?.kuotaTambahan || 0);
      totalHadirSantri += k.kuota?.terpakai || 0;
    });

    const undanganCount = undanganList.length;
    let totalKuotaUndangan = 0;
    let undanganIstimewaCount = 0;
    let undanganKehormatanCount = 0;
    let undanganUmumCount = 0;

    undanganList.forEach((u) => {
      totalKuotaUndangan += (u.kuota?.kuotaDasar || 0) + (u.kuota?.kuotaTambahan || 0);
      const gol = getGolonganUndangan(u);
      if (gol === 'ISTIMEWA') undanganIstimewaCount++;
      else if (gol === 'KEHORMATAN') undanganKehormatanCount++;
      else undanganUmumCount++;
    });

    return {
      totalSantri: keluargaList.length,
      bilGhoibCount,
      binNadzorCount,
      tamatanCount,
      undanganCount,
      undanganIstimewaCount,
      undanganKehormatanCount,
      undanganUmumCount,
      totalSemua: keluargaList.length + undanganCount,
      totalKuota: totalKuotaSantri + totalKuotaUndangan,
      totalHadir: totalHadirSantri,
    };
  }, [keluargaList, undanganList]);

  // Normalisasi data tabel
  const allItems = useMemo(() => {
    const list: any[] = [];

    // Tambah keluarga santri
    keluargaList.forEach((k) => {
      const santri = k.santri?.[0];
      const kuota = k.kuota;
      const totalKuota = (kuota?.kuotaDasar || 0) + (kuota?.kuotaTambahan || 0);
      const terpakai = kuota?.terpakai || 0;
      const sisa = Math.max(0, totalKuota - terpakai);
      const kat = santri?.kategoriUtama || 'BIN_NADZOR';
      const bagian = kat === 'TAMATAN' ? extractBagianTamatan(santri?.kelas || santri?.subKategori) : '';

      list.push({
        id: k.id,
        kode: k.kode,
        tipe: 'SANTRI',
        kategoriUtama: kat,
        bagianTamatan: bagian,
        kelas: santri?.kelas || '',
        subKategori: santri?.subKategori || '',
        nama: santri?.nama || '-',
        kamar: santri?.kamar || '-',
        namaWali: k.namaWali,
        noHp: k.noHp,
        alamat: k.alamat,
        kuotaDasar: kuota?.kuotaDasar || 0,
        kuotaTambahan: kuota?.kuotaTambahan || 0,
        terpakai: terpakai,
        sisa: sisa,
        tiketPanggungJatah: kuota?.tiketPanggungJatah || 0,
        hangus: kuota?.hangus || false,
        raw: k,
      });
    });

    // Tambah tamu undangan
    undanganList.forEach((u) => {
      const kuota = u.kuota;
      const totalKuota = (kuota?.kuotaDasar || 0) + (kuota?.kuotaTambahan || 0);
      const terpakai = kuota?.terpakai || 0;
      const sisa = Math.max(0, totalKuota - terpakai);
      const gol = getGolonganUndangan(u);

      list.push({
        id: u.id,
        kode: u.kode,
        tipe: 'UNDANGAN',
        kategoriUtama: 'UNDANGAN',
        golonganUndangan: gol,
        bagianTamatan: '',
        nama: u.nama,
        namaPutra: (u as any).namaPutra || '',
        namaPutri: (u as any).namaPutri || '',
        kamar: '-',
        namaWali: u.nama,
        noHp: (u as any).noHp || '-',
        alamat: (u as any).alamat || u.instansi || '-',
        kategori: u.kategori || 'Asatidz / Masyayikh',
        instansi: u.instansi || (u as any).alamat || '-',
        kuotaDasar: kuota?.kuotaDasar || 4,
        kuotaTambahan: 0,
        terpakai: terpakai,
        sisa: sisa,
        tiketPanggungJatah: 0,
        hangus: false,
        raw: u,
      });
    });

    return list;
  }, [keluargaList, undanganList]);

  // Opsi dropdown sub-filter yang disesuaikan secara dinamis dengan activeTab
  const subFilterOptions = useMemo(() => {
    switch (activeTab) {
      case 'UNDANGAN_UMUM': {
        const baseOptions = OPSI_UNDANGAN_UMUM.filter((o) => !o.includes('Lainnya'));
        const distinctKategoriInItems = Array.from(
          new Set(
            allItems
              .filter((it) => it.tipe === 'UNDANGAN' && it.golonganUndangan === 'UMUM' && it.kategori)
              .map((it) => it.kategori)
          )
        );

        const allCat = [...baseOptions];
        distinctKategoriInItems.forEach((c) => {
          if (!allCat.some((b) => matchUndanganCategory(c, b))) {
            allCat.push(c);
          }
        });

        return [
          { value: 'SEMUA', label: `Semua Tamu Umum (${stats.undanganUmumCount})` },
          ...allCat.map((cat) => {
            const count = allItems.filter(
              (it) => it.tipe === 'UNDANGAN' && it.golonganUndangan === 'UMUM' && matchUndanganCategory(it.kategori, cat)
            ).length;
            return { value: cat, label: `${cat} (${count})` };
          }),
        ];
      }

      case 'UNDANGAN_ISTIMEWA': {
        const baseOptions = OPSI_UNDANGAN_ISTIMEWA.filter((o) => !o.includes('Lainnya'));
        const distinctKategoriInItems = Array.from(
          new Set(
            allItems
              .filter((it) => it.tipe === 'UNDANGAN' && it.golonganUndangan === 'ISTIMEWA' && it.kategori)
              .map((it) => it.kategori)
          )
        );

        const allCat = [...baseOptions];
        distinctKategoriInItems.forEach((c) => {
          if (!allCat.some((b) => matchUndanganCategory(c, b))) {
            allCat.push(c);
          }
        });

        return [
          { value: 'SEMUA', label: `Semua Tamu Istimewa (${stats.undanganIstimewaCount})` },
          ...allCat.map((cat) => {
            const count = allItems.filter(
              (it) => it.tipe === 'UNDANGAN' && it.golonganUndangan === 'ISTIMEWA' && matchUndanganCategory(it.kategori, cat)
            ).length;
            return { value: cat, label: `${cat} (${count})` };
          }),
        ];
      }

      case 'UNDANGAN_KEHORMATAN': {
        // Tamu Kehormatan hanya 1 jenis resmi (tanpa sub-kategori), tidak memerlukan opsi dropdown
        return [];
      }

      case 'UNDANGAN': {
        return [
          { value: 'SEMUA', label: `Semua Tamu Undangan (${stats.undanganCount})` },
          { value: 'ISTIMEWA', label: `🌟 Tamu Undangan Istimewa (${stats.undanganIstimewaCount})` },
          { value: 'KEHORMATAN', label: `🏛️ Tamu Undangan Kehormatan (${stats.undanganKehormatanCount})` },
          { value: 'UMUM', label: `👥 Tamu Undangan Umum (${stats.undanganUmumCount})` },
        ];
      }

      case 'TAMATAN': {
        return [
          { value: 'SEMUA', label: `Semua Bagian Tamatan (${stats.tamatanCount})` },
          ...BAGIAN_TAMATAN_LIST.map((bg) => {
            const count = allItems.filter(
              (it) => it.kategoriUtama === 'TAMATAN' && it.bagianTamatan === bg
            ).length;
            return { value: bg, label: `Bagian ${bg} (${count})` };
          }),
        ];
      }

      case 'BIL_GHOIB': {
        const distinctKamar = Array.from(
          new Set(
            allItems
              .filter((it) => it.kategoriUtama === 'BIL_GHOIB' && it.kamar && it.kamar !== '-')
              .map((it) => it.kamar)
          )
        );

        return [
          { value: 'SEMUA', label: `Semua Santri Bil Ghoib (${stats.bilGhoibCount})` },
          ...distinctKamar.map((kmr) => {
            const count = allItems.filter(
              (it) => it.kategoriUtama === 'BIL_GHOIB' && it.kamar === kmr
            ).length;
            return { value: `KAMAR:${kmr}`, label: `Kamar ${kmr} (${count})` };
          }),
        ];
      }

      case 'BIN_NADZOR': {
        const distinctKelas = [
          { key: '2 Tsanawiyah', label: '2 Tsanawiyyah' },
          { key: '3 Tsanawiyah', label: '3 Tsanawiyyah' },
          { key: '1 Aliyah', label: '1 Aliyah' },
          { key: '2 Aliyah', label: '2 Aliyah' },
          { key: '3 Aliyah', label: '3 Aliyah & Mutakhorijat' },
        ];
        const distinctKamar = Array.from(
          new Set(
            allItems
              .filter((it) => it.kategoriUtama === 'BIN_NADZOR' && it.kamar && it.kamar !== '-')
              .map((it) => it.kamar)
          )
        );

        return [
          { value: 'SEMUA', label: `Semua Santri Bin Nadzori (${stats.binNadzorCount})` },
          ...distinctKelas.map((kls) => {
            const count = allItems.filter(
              (it) =>
                it.kategoriUtama === 'BIN_NADZOR' &&
                ((it.kelas || '').toLowerCase().includes(kls.key.toLowerCase()) ||
                  (it.subKategori || '').toLowerCase().includes(kls.key.toLowerCase()))
            ).length;
            return { value: `KELAS:${kls.key}`, label: `Jenjang: ${kls.label} (${count})` };
          }),
          ...distinctKamar.map((kmr) => {
            const count = allItems.filter(
              (it) => it.kategoriUtama === 'BIN_NADZOR' && it.kamar === kmr
            ).length;
            return { value: `KAMAR:${kmr}`, label: `Kamar: ${kmr} (${count})` };
          }),
        ];
      }

      case 'SEMUA':
      default: {
        return [
          { value: 'SEMUA', label: `Semua Kategori & Bagian (${stats.totalSemua})` },
          { value: 'BIL_GHOIB', label: `Bil Ghoib (${stats.bilGhoibCount})` },
          { value: 'BIN_NADZOR', label: `Bin Nadzori (${stats.binNadzorCount})` },
          { value: 'TAMATAN', label: `Semua Tamatan (${stats.tamatanCount})` },
          ...BAGIAN_TAMATAN_LIST.map((bg) => {
            const count = allItems.filter(
              (it) => it.kategoriUtama === 'TAMATAN' && it.bagianTamatan === bg
            ).length;
            return { value: bg, label: `— Tamatan Bagian ${bg} (${count})` };
          }),
          { value: 'UNDANGAN_ISTIMEWA', label: `🌟 Istimewa (VVIP & VIP) (${stats.undanganIstimewaCount})` },
          { value: 'UNDANGAN_KEHORMATAN', label: `🏛️ Kehormatan (Tamu Khusus) (${stats.undanganKehormatanCount})` },
          { value: 'UNDANGAN_UMUM', label: `👥 Tamu Undangan Umum (${stats.undanganUmumCount})` },
        ];
      }
    }
  }, [activeTab, allItems, stats]);

  // Jaga agar bagianFilter selalu valid bila activeTab berganti
  useEffect(() => {
    const exists = subFilterOptions.some((o) => o.value === bagianFilter);
    if (!exists) {
      setBagianFilter('SEMUA');
    }
  }, [activeTab, subFilterOptions]);

  // Filter list
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // 1. Tab filter
      if (activeTab === 'BIL_GHOIB' && item.kategoriUtama !== 'BIL_GHOIB') return false;
      if (activeTab === 'BIN_NADZOR' && item.kategoriUtama !== 'BIN_NADZOR') return false;
      if (activeTab === 'TAMATAN' && item.kategoriUtama !== 'TAMATAN') return false;
      if (activeTab === 'UNDANGAN' && item.tipe !== 'UNDANGAN') return false;
      if (activeTab === 'UNDANGAN_ISTIMEWA' && (item.tipe !== 'UNDANGAN' || item.golonganUndangan !== 'ISTIMEWA')) return false;
      if (activeTab === 'UNDANGAN_KEHORMATAN' && (item.tipe !== 'UNDANGAN' || item.golonganUndangan !== 'KEHORMATAN')) return false;
      if (activeTab === 'UNDANGAN_UMUM' && (item.tipe !== 'UNDANGAN' || item.golonganUndangan !== 'UMUM')) return false;

      // 2. Sub Filter dinamis (bagianFilter)
      if (bagianFilter && bagianFilter !== 'SEMUA') {
        if (activeTab === 'SEMUA') {
          if (bagianFilter === 'BIL_GHOIB') {
            if (item.kategoriUtama !== 'BIL_GHOIB') return false;
          } else if (bagianFilter === 'BIN_NADZOR') {
            if (item.kategoriUtama !== 'BIN_NADZOR') return false;
          } else if (bagianFilter === 'TAMATAN') {
            if (item.kategoriUtama !== 'TAMATAN') return false;
          } else if (bagianFilter.startsWith('A.') || bagianFilter.startsWith('B.')) {
            if (item.kategoriUtama !== 'TAMATAN' || item.bagianTamatan !== bagianFilter) return false;
          } else if (bagianFilter === 'UNDANGAN') {
            if (item.tipe !== 'UNDANGAN') return false;
          } else if (bagianFilter === 'UNDANGAN_ISTIMEWA') {
            if (item.tipe !== 'UNDANGAN' || item.golonganUndangan !== 'ISTIMEWA') return false;
          } else if (bagianFilter === 'UNDANGAN_KEHORMATAN') {
            if (item.tipe !== 'UNDANGAN' || item.golonganUndangan !== 'KEHORMATAN') return false;
          } else if (bagianFilter === 'UNDANGAN_UMUM') {
            if (item.tipe !== 'UNDANGAN' || item.golonganUndangan !== 'UMUM') return false;
          }
        } else if (activeTab === 'TAMATAN') {
          if (item.bagianTamatan !== bagianFilter) return false;
        } else if (activeTab === 'UNDANGAN') {
          if (item.golonganUndangan !== bagianFilter) return false;
        } else if (
          activeTab === 'UNDANGAN_ISTIMEWA' ||
          activeTab === 'UNDANGAN_KEHORMATAN' ||
          activeTab === 'UNDANGAN_UMUM'
        ) {
          if (!matchUndanganCategory(item.kategori, bagianFilter)) return false;
        } else if (activeTab === 'BIL_GHOIB' || activeTab === 'BIN_NADZOR') {
          if (bagianFilter.startsWith('KAMAR:') && item.kamar !== bagianFilter.replace('KAMAR:', '')) {
            return false;
          }
          if (bagianFilter.startsWith('KELAS:')) {
            const targetKls = bagianFilter.replace('KELAS:', '').toLowerCase();
            const itemKls = (item.kelas || '').toLowerCase();
            const itemSub = (item.subKategori || '').toLowerCase();
            if (!itemKls.includes(targetKls) && !itemSub.includes(targetKls)) {
              return false;
            }
          }
        }
      }

      // Status Hadir
      if (statusHadirFilter === 'SUDAH' && item.terpakai === 0) return false;
      if (statusHadirFilter === 'BELUM' && item.terpakai > 0) return false;

      // Search term
      if (searchTerm.trim()) {
        const normalize = (s: string) => (s || '').toLowerCase().replace(/yy/g, 'y');
        const q = normalize(searchTerm);
        const matchKode = normalize(item.kode).includes(q);
        const matchNama = normalize(item.nama).includes(q);
        const matchWali = normalize(item.namaWali).includes(q);
        const matchHp = normalize(item.noHp).includes(q);
        const matchAlamat = normalize(item.alamat).includes(q);
        const matchKamar = normalize(item.kamar).includes(q);
        const matchBagian = normalize(item.bagianTamatan).includes(q);
        const matchKelas = normalize(item.kelas || '').includes(q);
        const matchSub = normalize(item.subKategori || item.kategori || '').includes(q);
        return (
          matchKode ||
          matchNama ||
          matchWali ||
          matchHp ||
          matchAlamat ||
          matchKamar ||
          matchBagian ||
          matchKelas ||
          matchSub
        );
      }

      return true;
    });
  }, [allItems, activeTab, bagianFilter, statusHadirFilter, searchTerm]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // Handler Tambah Santri Baru
  const handleTambahPeserta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      alert('Nama santri wajib diisi!');
      return;
    }
    if (!formData.namaWali.trim()) {
      alert('Nama wali wajib diisi!');
      return;
    }

    const res = store.tambahPeserta({
      nama: formData.nama.trim().toUpperCase(),
      kategoriUtama: formData.kategoriUtama,
      bagianTamatan: formData.kategoriUtama === 'TAMATAN' ? formData.bagianTamatan : undefined,
      kamar: formData.kamar.trim(),
      namaWali: formData.namaWali.trim().toUpperCase(),
      noHp: formData.noHp.trim(),
      alamat: formData.alamat.trim().toUpperCase(),
    });

    if (res.ok) {
      refreshData();
      setShowAddModal(false);
      showToast(`✓ Berhasil menambahkan santri baru: ${formData.nama} (Kode: ${res.code})`);
      setFormData({
        nama: '',
        kategoriUtama: 'BIL_GHOIB',
        bagianTamatan: 'A.01',
        kamar: 'Hafidzah',
        namaWali: '',
        noHp: '',
        alamat: '',
      });
    }
  };

  // Handler Tambah Undangan Baru
  const handleTambahUndangan = (e: React.FormEvent) => {
    e.preventDefault();

    let finalNama = '';
    const p = (undanganForm.namaPutra || '').trim().toUpperCase();
    const w = (undanganForm.namaPutri || '').trim().toUpperCase();

    if (selectedGolonganUndangan === 'ISTIMEWA') {
      if (!p && !w) {
        alert('Mohon isi minimal salah satu: Nama Tamu Putra atau Nama Tamu Putri!');
        return;
      }
      if (p && w) finalNama = `${p} & ${w}`;
      else finalNama = p || w;
    } else {
      if (!undanganForm.nama.trim()) {
        alert('Nama tamu undangan wajib diisi!');
        return;
      }
      finalNama = undanganForm.nama.trim().toUpperCase();
    }

    let finalKategori = '';
    if (selectedGolonganUndangan === 'KEHORMATAN') {
      finalKategori = 'Tamu Kehormatan';
    } else {
      finalKategori =
        undanganKategoriDropdown === 'Lainnya (Ketik Sendiri...)'
          ? customKategoriInput.trim()
          : undanganKategoriDropdown.trim();

      if (!finalKategori) {
        alert('Kategori undangan wajib diisi atau diketik!');
        return;
      }
    }

    let finalAlamat = '';
    let finalInstansi = '';

    if (selectedGolonganUndangan === 'ISTIMEWA' || selectedGolonganUndangan === 'KEHORMATAN') {
      finalAlamat = (undanganForm.alamat || undanganForm.instansi || 'Kediri').trim();
      finalInstansi = finalAlamat;
    } else {
      // UMUM
      finalInstansi = (undanganForm.instansi || 'Pondok Pesantren Lirboyo').trim();
      finalAlamat = (undanganForm.alamat || 'Kediri').trim();
    }

    const res = store.tambahUndangan({
      nama: finalNama,
      namaPutra: p,
      namaPutri: w,
      kategori: finalKategori,
      instansi: finalInstansi,
      alamat: finalAlamat,
      kuotaDasar: Number(undanganForm.kuotaDasar) || (selectedGolonganUndangan === 'KEHORMATAN' ? 4 : 2),
      golongan: selectedGolonganUndangan,
    });

    if (res.ok) {
      refreshData();
      setShowAddUndanganModal(false);
      showToast(`✓ Berhasil menambahkan Tamu Undangan: ${finalNama} (Kode: ${res.code})`);
      setUndanganForm({
        nama: '',
        namaPutra: '',
        namaPutri: '',
        kategori: OPSI_UNDANGAN_ISTIMEWA[0],
        instansi: 'Kediri',
        alamat: 'Kediri',
        kuotaDasar: 2,
      });
      setUndanganKategoriDropdown(OPSI_UNDANGAN_ISTIMEWA[0]);
      setCustomKategoriInput('');
    }
  };

  // Handler Edit Peserta
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (editingItem.tipe === 'UNDANGAN') {
      let finalKat = '';
      if (editGolonganUndangan === 'KEHORMATAN') {
        finalKat = editingItem.kategori || 'Tamu Kehormatan';
      } else {
        finalKat =
          editUndanganKategoriDropdown === 'Lainnya (Ketik Sendiri...)'
            ? editCustomKategoriInput.trim()
            : editUndanganKategoriDropdown.trim();

        if (!finalKat) {
          alert('Kategori undangan wajib diisi atau diketik!');
          return;
        }
      }

      let finalNama = (editingItem.nama || '').trim().toUpperCase();
      let p = (editingItem.namaPutra || '').trim().toUpperCase();
      let w = (editingItem.namaPutri || '').trim().toUpperCase();

      if (editGolonganUndangan === 'ISTIMEWA') {
        if (!p && !w && !finalNama) {
          alert('Mohon isi minimal salah satu: Nama Tamu Putra atau Nama Tamu Putri!');
          return;
        }
        if (p && w) finalNama = `${p} & ${w}`;
        else if (p) finalNama = p;
        else if (w) finalNama = w;
      } else {
        if (!finalNama) {
          alert('Nama tamu undangan wajib diisi!');
          return;
        }
      }

      let finalAlamat = '';
      let finalInstansi = '';

      if (editGolonganUndangan === 'ISTIMEWA' || editGolonganUndangan === 'KEHORMATAN') {
        finalAlamat = (editingItem.alamat || editingItem.instansi || 'Kediri').trim();
        finalInstansi = finalAlamat;
      } else {
        finalInstansi = (editingItem.instansi || 'Pondok Pesantren Lirboyo').trim();
        finalAlamat = (editingItem.alamat || 'Kediri').trim();
      }

      const res = store.editPeserta(editingItem.kode, {
        nama: finalNama,
        namaPutra: p,
        namaPutri: w,
        kategori: finalKat,
        instansi: finalInstansi,
        alamat: finalAlamat,
        golongan: editGolonganUndangan,
        kuotaDasar: Number(editingItem.kuotaDasar) || 2,
      });

      if (res.ok) {
        refreshData();
        setEditingItem(null);
        showToast(`✓ Perubahan data tamu undangan ${editingItem.kode} berhasil disimpan!`);
      } else {
        alert(res.pesan || 'Gagal menyimpan perubahan.');
      }
      return;
    }

    let subKat = 'Bin Nadzori';
    let kls = 'Bin Nadzori';
    if (editingItem.kategoriUtama === 'BIL_GHOIB') {
      subKat = 'Bil Ghoib';
      kls = 'Bil Ghoib';
    } else if (editingItem.kategoriUtama === 'TAMATAN') {
      subKat = `3 ALY ${editingItem.bagianTamatan || 'A.01'}`;
      kls = `3 ALY ${editingItem.bagianTamatan || 'A.01'}`;
    }

    const res = store.editPeserta(editingItem.kode, {
      nama: editingItem.nama?.trim().toUpperCase(),
      namaWali: editingItem.namaWali?.trim().toUpperCase(),
      noHp: editingItem.noHp?.trim(),
      alamat: editingItem.alamat?.trim().toUpperCase(),
      kamar: editingItem.kamar?.trim(),
      kategoriUtama: editingItem.kategoriUtama,
      subKategori: subKat,
      kelas: kls,
      kuotaDasar: Number(editingItem.kuotaDasar),
    });

    if (res.ok) {
      refreshData();
      setEditingItem(null);
      showToast(`✓ Perubahan data ${editingItem.kode} berhasil disimpan!`);
    } else {
      alert(res.pesan || 'Gagal menyimpan perubahan.');
    }
  };

  // Handler Hapus Peserta
  const handleConfirmDelete = () => {
    if (!deletingItem) return;
    const res = store.hapusPeserta(deletingItem.kode);
    if (res.ok) {
      refreshData();
      showToast(`✓ Peserta ${deletingItem.nama} (${deletingItem.kode}) telah berhasil dihapus.`);
      setDeletingItem(null);
    } else {
      alert(res.pesan || 'Gagal menghapus peserta.');
    }
  };

  // Handler Ekspor Excel
  const handleExportExcel = () => {
    const dataToExport = filteredItems.map((item, idx) => ({
      No: idx + 1,
      'Kode QR': item.kode,
      'Kategori Utama': item.kategoriUtama === 'BIL_GHOIB'
        ? 'Bil Ghoib'
        : item.kategoriUtama === 'BIN_NADZOR'
        ? 'Bin Nadzori'
        : item.kategoriUtama === 'TAMATAN'
        ? 'Tamatan'
        : 'Tamu Undangan',
      'Bagian Tamatan': item.bagianTamatan || '-',
      'Nama Santri / Peserta': item.nama,
      Kamar: item.kamar,
      'Nama Wali': item.namaWali,
      'No. WhatsApp': item.noHp,
      'Alamat / Asal': item.alamat,
      'Kuota Dasar': item.kuotaDasar,
      'Kuota Tambahan': item.kuotaTambahan,
      'Total Kuota': item.kuotaDasar + item.kuotaTambahan,
      'Sudah Masuk': item.terpakai,
      'Sisa Kursi': item.sisa,
      'Tiket Panggung': item.tiketPanggungJatah > 0 ? 'Ya (Emas ★)' : 'Tidak',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar_Peserta');
    XLSX.writeFile(
      workbook,
      `Daftar_Peserta_Haflah_P3TQ_${activeTab}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
    showToast('✓ Berkas Excel berhasil diunduh!');
  };

  return (
    <div className="min-h-screen bg-[#EFE8E1] py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#8C6A47] text-white px-5 py-3.5 rounded-2xl shadow-2xl border-2 border-[#D49B5B] flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Halaman: Warm Latte & Cinnamon Mocha Aesthetic */}
      <div className="max-w-7xl mx-auto bg-gradient-to-r from-[#FAF7F3] via-[#EFE8E1] to-[#FAF7F3] text-[#422F21] rounded-3xl p-6 sm:p-8 shadow-sm border-2 border-[#8C6A47]/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-8 opacity-10 pointer-events-none">
          <img
            src="/images/logo-haul-gold.png"
            alt="Kaligrafi Haul Haflah"
            className="w-96 object-contain"
          />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-white border-2 border-[#8C6A47] flex items-center justify-center text-[#8C6A47] shadow-sm">
                <Users className="w-6 h-6 text-[#8C6A47]" />
              </div>
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FAF7F3] text-[#8C6A47] border border-[#D49B5B]">
                  <Sparkles className="w-3 h-3 mr-1 text-[#D49B5B]" />
                  DATABASE RESMI SANTRI & TAMU
                </span>
                <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#422F21] tracking-wide">
                  Daftar Peserta Tiap Kategori
                </h1>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-[#7A624E] font-normal max-w-2xl">
              Pembagian 3 kategori utama: <strong>Bil Ghoib</strong>, <strong>Bin Nadzori</strong>, dan <strong>Tamatan</strong> (Bagian A.01–A.04 & B.01–B.03), serta Tamu Undangan VIP.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#8C6A47] to-[#735334] hover:brightness-105 text-white font-serif font-bold text-xs shadow-md border border-[#5C3E28] flex items-center space-x-1.5 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Tambah Santri</span>
            </button>

            <button
              onClick={() => handleOpenAddUndangan('ISTIMEWA')}
              className="px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#422F21] font-serif font-bold text-xs border-2 border-[#D49B5B] shadow-sm flex items-center space-x-1.5 transition-all"
              title="Tambah Tamu Undangan (Istimewa, Kehormatan, atau Umum)"
            >
              <Plus className="w-4 h-4 text-[#8C6A47] stroke-[3]" />
              <span>Tambah Undangan</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#FAF7F3] text-[#422F21] font-semibold text-xs border-2 border-[#D5C4B4] hover:border-[#8C6A47] shadow-sm flex items-center space-x-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-[#8C6A47]" />
              <span>Unduh Excel</span>
            </button>

            <button
              onClick={() => {
                setClearScope('SEMUA');
                setShowClearModal(true);
              }}
              className="px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-semibold text-xs border border-rose-300 shadow-sm flex items-center space-x-1.5 transition-all"
              title="Hapus / Kosongkan Data Peserta & Tamu"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Hapus Semua</span>
            </button>
          </div>
        </div>
      </div>

      {/* Kontrol Filter & Tab Navigasi */}
      <div className="max-w-7xl mx-auto bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
                {/* Tab Menu Kategori Berbentuk Kartu Statistik (Foto 2) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 border-b border-slate-100 pb-4">
          <div
            onClick={() => {
              setActiveTab('SEMUA');
              setBagianFilter('SEMUA');
              setCurrentPage(1);
            }}
            className={`cursor-pointer p-3 rounded-2xl bg-white border transition-all ${
              activeTab === 'SEMUA'
                ? 'border-opera-700 shadow-md ring-2 ring-opera-600/30'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              TOTAL SEMUA
            </div>
            <div className="text-xl font-serif font-black text-slate-900 mt-1">
              {stats.totalSemua}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">
              {stats.totalSantri} Santri + {stats.undanganCount} Tamu
            </div>
          </div>

          <div
            onClick={() => {
              setActiveTab('BIL_GHOIB');
              setBagianFilter('SEMUA');
              setCurrentPage(1);
            }}
            className={`cursor-pointer p-3 rounded-2xl bg-white border transition-all ${
              activeTab === 'BIL_GHOIB'
                ? 'border-emerald-600 shadow-md ring-2 ring-emerald-500/30'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide flex items-center justify-between">
              <span>BIL GHOIB</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="text-xl font-serif font-black text-emerald-950 mt-1">
              {stats.bilGhoibCount}
            </div>
            <div className="text-[10px] text-emerald-700 mt-0.5 truncate">
              4 Kursi · Tiket Emas ★
            </div>
          </div>

          <div
            onClick={() => {
              setActiveTab('BIN_NADZOR');
              setBagianFilter('SEMUA');
              setCurrentPage(1);
            }}
            className={`cursor-pointer p-3 rounded-2xl bg-white border transition-all ${
              activeTab === 'BIN_NADZOR'
                ? 'border-blue-600 shadow-md ring-2 ring-blue-500/30'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wide flex items-center justify-between">
              <span>BIN NADZORI</span>
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            </div>
            <div className="text-xl font-serif font-black text-blue-950 mt-1">
              {stats.binNadzorCount}
            </div>
            <div className="text-[10px] text-blue-700 mt-0.5 truncate">2 Kursi · Tiket Biru</div>
          </div>

          <div
            onClick={() => {
              setActiveTab('TAMATAN');
              setBagianFilter('SEMUA');
              setCurrentPage(1);
            }}
            className={`cursor-pointer p-3 rounded-2xl bg-white border transition-all ${
              activeTab === 'TAMATAN'
                ? 'border-amber-600 shadow-md ring-2 ring-amber-500/30'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wide flex items-center justify-between">
              <span>TAMATAN</span>
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            </div>
            <div className="text-xl font-serif font-black text-amber-950 mt-1">
              {stats.tamatanCount}
            </div>
            <div className="text-[10px] text-amber-800 mt-0.5 truncate">A.01–B.03 · 2 Kursi</div>
          </div>

          <div
            onClick={() => {
              setActiveTab('UNDANGAN_ISTIMEWA');
              setBagianFilter('SEMUA');
              setCurrentPage(1);
            }}
            className={`cursor-pointer p-3 rounded-2xl bg-white border transition-all ${
              activeTab === 'UNDANGAN_ISTIMEWA'
                ? 'border-amber-600 shadow-md ring-2 ring-amber-500/30 bg-amber-50/20'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wide flex items-center justify-between">
              <span>🌟 ISTIMEWA</span>
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            </div>
            <div className="text-xl font-serif font-black text-amber-950 mt-1">
              {stats.undanganIstimewaCount}
            </div>
            <div className="text-[10px] text-amber-700 mt-0.5 truncate">VVIP & VIP</div>
          </div>

          <div
            onClick={() => {
              setActiveTab('UNDANGAN_KEHORMATAN');
              setBagianFilter('SEMUA');
              setCurrentPage(1);
            }}
            className={`cursor-pointer p-3 rounded-2xl bg-white border transition-all ${
              activeTab === 'UNDANGAN_KEHORMATAN'
                ? 'border-purple-600 shadow-md ring-2 ring-purple-500/30 bg-purple-50/20'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-[10px] font-bold text-purple-800 uppercase tracking-wide flex items-center justify-between">
              <span>🏛️ KEHORMATAN</span>
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            </div>
            <div className="text-xl font-serif font-black text-purple-950 mt-1">
              {stats.undanganKehormatanCount}
            </div>
            <div className="text-[10px] text-purple-700 mt-0.5 truncate">Tamu Khusus</div>
          </div>

          <div
            onClick={() => {
              setActiveTab('UNDANGAN_UMUM');
              setBagianFilter('SEMUA');
              setCurrentPage(1);
            }}
            className={`cursor-pointer p-3 rounded-2xl bg-white border transition-all ${
              activeTab === 'UNDANGAN_UMUM'
                ? 'border-cyan-600 shadow-md ring-2 ring-cyan-500/30 bg-cyan-50/20'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-[10px] font-bold text-cyan-800 uppercase tracking-wide flex items-center justify-between">
              <span>👥 UMUM</span>
              <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
            </div>
            <div className="text-xl font-serif font-black text-cyan-950 mt-1">
              {stats.undanganUmumCount}
            </div>
            <div className="text-[10px] text-cyan-700 mt-0.5 truncate">Tamu Undangan Umum</div>
          </div>
        </div>

        {/* Bar Pencarian & Dropdown Filter Bagian Tamatan */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Input Pencarian */}
          <div className={`${subFilterOptions.length > 0 ? 'sm:col-span-6' : 'sm:col-span-9'} relative`}>
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nama santri, wali, kode (SH0001...), no HP, kamar, kota..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-opera-700"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sub / Bagian Filter Dinamis Sesuai Tab Kategori (Hanya jika memiliki opsi) */}
          {subFilterOptions.length > 0 && (
            <div className="sm:col-span-3">
              <select
                value={bagianFilter}
                onChange={(e) => {
                  setBagianFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-opera-700 bg-amber-50/40 text-amber-950 font-medium"
              >
                {subFilterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Hadir */}
          <div className="sm:col-span-3">
            <select
              value={statusHadirFilter}
              onChange={(e) => {
                setStatusHadirFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-opera-700"
            >
              <option value="SEMUA">Semua Status Hadir</option>
              <option value="SUDAH">Sudah Hadir / Check-in</option>
              <option value="BELUM">Belum Hadir</option>
            </select>
          </div>
        </div>

        {/* Ringkasan Hasil & Limit Halaman */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
          <div>
            Menampilkan <strong className="text-slate-800">{filteredItems.length}</strong> data peserta
            {searchTerm && ` untuk pencarian "${searchTerm}"`}
            {bagianFilter !== 'SEMUA' && subFilterOptions.length > 0 && (
              <span className="ml-1 text-opera-700 font-semibold">
                [{subFilterOptions.find((o) => o.value === bagianFilter)?.label || bagianFilter.replace('KAMAR:', 'Kamar ')}]
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span>Baris per halaman:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded-lg border border-slate-300 text-xs"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={600}>Semua ({filteredItems.length})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabel Data Peserta */}
      <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Kode QR</th>
                <th className="py-3.5 px-4">Nama Santri & Kamar</th>
                <th className="py-3.5 px-4">Kategori & Bagian</th>
                <th className="py-3.5 px-4">Wali Santri / Alamat & Kontak</th>
                <th className="py-3.5 px-4 text-center">Hak Kuota</th>
                <th className="py-3.5 px-4 text-center">Status Hadir</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    {stats.totalSemua === 0 ? (
                      <div className="space-y-2 max-w-md mx-auto">
                        <p className="font-bold text-slate-700 text-sm">Daftar seluruh santri dan tamu undangan kosong (0 data).</p>
                        <p className="text-xs text-slate-500">Semua data santri peserta maupun tamu undangan telah berhasil dibersihkan. Anda dapat menambahkan data baru melalui tombol &ldquo;+ Tambah Santri&rdquo; atau &ldquo;+ Tambah Undangan&rdquo; di atas.</p>
                      </div>
                    ) : activeTab.startsWith('UNDANGAN') && stats.undanganCount === 0 ? (
                      <div className="space-y-2 max-w-md mx-auto">
                        <p className="font-bold text-slate-700 text-sm">Daftar tamu undangan kosong (0 tamu).</p>
                        <p className="text-xs text-slate-500">Semua data tamu undangan telah dibersihkan. Anda dapat menambahkan tamu baru dengan tombol &ldquo;+ Tambah Undangan&rdquo; di atas.</p>
                      </div>
                    ) : !activeTab.startsWith('UNDANGAN') && stats.totalSantri === 0 && activeTab !== 'SEMUA' ? (
                      <div className="space-y-2 max-w-md mx-auto">
                        <p className="font-bold text-slate-700 text-sm">Daftar santri peserta kategori ini kosong (0 santri).</p>
                        <p className="text-xs text-slate-500">Semua data santri telah dibersihkan. Anda dapat menambahkan santri baru dengan tombol &ldquo;+ Tambah Santri&rdquo; di atas.</p>
                      </div>
                    ) : (
                      'Tidak ada data peserta atau tamu yang cocok dengan kriteria pencarian.'
                    )}
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, index) => {
                  const globalIndex = (currentPage - 1) * pageSize + index + 1;
                  const isBilGhoib = item.kategoriUtama === 'BIL_GHOIB';
                  const isBinNadzor = item.kategoriUtama === 'BIN_NADZOR';
                  const isTamatan = item.kategoriUtama === 'TAMATAN';
                  const isUndangan = item.tipe === 'UNDANGAN';

                  return (
                    <tr key={item.kode} className="hover:bg-slate-50/80 transition-colors">
                      {/* No */}
                      <td className="py-3 px-4 text-center text-slate-400 font-mono">
                        {globalIndex}
                      </td>

                      {/* Kode QR & Kartu Modal */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          onClick={() => setQrDetailItem(item)}
                          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-mono font-bold text-xs bg-slate-100 hover:bg-opera-50 hover:text-opera-850 hover:border-opera-300 border border-slate-200 transition-colors group"
                        >
                          <QrCode className="w-3.5 h-3.5 text-slate-500 group-hover:text-opera-700" />
                          <span>{item.kode}</span>
                        </button>
                      </td>

                      {/* Nama & Kamar */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 leading-snug">{item.nama}</div>
                        {item.kamar && item.kamar !== '-' && (
                          <div className="text-[11px] text-slate-500">Kamar: {item.kamar}</div>
                        )}
                        {isUndangan && item.golonganUndangan === 'ISTIMEWA' && item.namaPutra && item.namaPutri && (
                          <div className="text-[10px] text-amber-800/80 mt-0.5 font-medium flex items-center space-x-1">
                            <span>🤵 {item.namaPutra}</span>
                            <span>·</span>
                            <span>🧕 {item.namaPutri}</span>
                          </div>
                        )}
                      </td>

                      {/* Kategori & Bagian (Disesuaikan) */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`inline-block w-2.5 h-2.5 rounded-full ${
                              isBilGhoib
                                ? 'bg-emerald-500'
                                : isBinNadzor
                                ? 'bg-blue-500'
                                : isTamatan
                                ? 'bg-amber-500'
                                : item.golonganUndangan === 'ISTIMEWA'
                                ? 'bg-amber-600'
                                : item.golonganUndangan === 'KEHORMATAN'
                                ? 'bg-purple-600'
                                : 'bg-cyan-600'
                            }`}
                          ></span>
                          <span className="font-bold text-slate-800">
                            {isBilGhoib
                              ? 'Bil Ghoib'
                              : isBinNadzor
                              ? 'Bin Nadzori'
                              : isTamatan
                              ? 'Tamatan'
                              : item.golonganUndangan === 'ISTIMEWA'
                              ? 'Undangan Istimewa'
                              : item.golonganUndangan === 'KEHORMATAN'
                              ? 'Undangan Kehormatan'
                              : 'Undangan Umum'}
                          </span>
                        </div>
                        {isTamatan && item.bagianTamatan && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 mt-0.5">
                            Bagian {item.bagianTamatan}
                          </span>
                        )}
                        {isUndangan && (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border mt-0.5 ${
                              item.golonganUndangan === 'ISTIMEWA'
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : item.golonganUndangan === 'KEHORMATAN'
                                ? 'bg-purple-50 text-purple-900 border-purple-300'
                                : 'bg-cyan-50 text-cyan-900 border-cyan-300'
                            }`}
                          >
                            {item.golonganUndangan === 'KEHORMATAN' ? 'Tamu Kehormatan' : (item.kategori || 'VIP')}
                          </span>
                        )}
                      </td>

                      {/* Wali Santri / Alamat & Kontak */}
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">
                          {isUndangan ? (
                            item.golonganUndangan === 'ISTIMEWA' ? (
                              <span className="text-amber-900 font-semibold flex items-center space-x-1">
                                <span>📍 {item.alamat || item.instansi || 'Kediri'}</span>
                              </span>
                            ) : item.golonganUndangan === 'KEHORMATAN' ? (
                              <span className="text-purple-950 font-semibold flex items-center space-x-1">
                                <span>📍 {item.alamat || item.instansi || 'Kediri'}</span>
                              </span>
                            ) : (
                              <div>
                                <div className="font-semibold text-slate-800">{item.instansi || 'Pondok Pesantren Lirboyo'}</div>
                                {item.alamat && item.alamat !== '-' && item.alamat !== item.instansi && (
                                  <div className="text-[11px] text-slate-500 font-normal">📍 {item.alamat}</div>
                                )}
                              </div>
                            )
                          ) : (
                            item.namaWali
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                          {item.noHp && item.noHp !== '-' && (
                            <a
                              href={`https://wa.me/${item.noHp.replace(/^0/, '62')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center text-emerald-700 hover:underline"
                            >
                              <Phone className="w-3 h-3 mr-0.5" />
                              <span>{item.noHp}</span>
                            </a>
                          )}
                          {item.alamat && !isUndangan && <span>· {item.alamat}</span>}
                          {isUndangan && item.golonganUndangan === 'ISTIMEWA' && (item.namaPutra || item.namaPutri) && (
                            <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              {item.namaPutra && item.namaPutri ? 'Putra & Putri' : item.namaPutra ? 'Putra' : 'Putri'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Hak Kuota */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="font-bold text-slate-800">
                          {item.kuotaDasar + item.kuotaTambahan} Kursi
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isBilGhoib && (
                            <span className="text-emerald-700 font-semibold">1 Tiket Emas ★</span>
                          )}
                          {isBinNadzor && <span className="text-blue-700">Tiket Biru</span>}
                          {isTamatan && <span className="text-amber-700">Tiket Kuning</span>}
                          {isUndangan && (
                            <span
                              className={
                                item.golonganUndangan === 'ISTIMEWA'
                                  ? 'text-amber-700 font-semibold'
                                  : item.golonganUndangan === 'KEHORMATAN'
                                  ? 'text-purple-700 font-semibold'
                                  : 'text-cyan-700 font-semibold'
                              }
                            >
                              {item.golonganUndangan === 'ISTIMEWA'
                                ? 'VIP Emas'
                                : item.golonganUndangan === 'KEHORMATAN'
                                ? 'VIP Ungu'
                                : 'VIP Biru'}
                            </span>
                          )}
                          {item.kuotaTambahan > 0 && (
                            <span className="text-rose-600 block">+{item.kuotaTambahan} Tambahan</span>
                          )}
                        </div>
                      </td>

                      {/* Status Hadir */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {item.terpakai > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Check className="w-3 h-3 mr-1" />
                            {item.terpakai} Masuk
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">
                            Belum Datang
                          </span>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5">Sisa: {item.sisa}</div>
                      </td>

                      {/* Tombol Aksi */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Fast-Track VIP Check-in Button khusus Tamu Undangan */}
                          {isUndangan && (
                            item.terpakai === 0 ? (
                              <button
                                onClick={() => handleFastTrackVip(item)}
                                disabled={fastTrackLoading === item.kode}
                                title="Fast-Track VIP: Hadirkan beliau langsung tanpa scan QR gerbang"
                                className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-[11px] shadow-xs flex items-center space-x-1 transition-all active:scale-95 disabled:opacity-50"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Hadirkan VIP</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBatalCheckinVip(item)}
                                title="Batalkan status hadir (Reset kembali ke belum hadir)"
                                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-[10px] flex items-center space-x-1 transition-all"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Reset</span>
                              </button>
                            )
                          )}

                          {/* Detail & QR */}
                          <button
                            onClick={() => setQrDetailItem(item)}
                            title="Lihat QR & Kartu"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-opera-850 hover:bg-opera-50 border border-transparent hover:border-opera-200 transition-colors"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Data Peserta"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Hapus */}
                          <button
                            onClick={() => setDeletingItem(item)}
                            title="Hapus Peserta"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Kontrol Navigasi Halaman (Pagination) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Halaman <strong className="text-slate-800">{currentPage}</strong> dari{' '}
            <strong className="text-slate-800">{totalPages}</strong> (Total {filteredItems.length} peserta)
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage <= 1}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-xs"
            >
              Awal
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 font-semibold text-slate-700">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage >= totalPages}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-xs"
            >
              Akhir
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: TAMBAH SANTRI BARU (Disesuaikan tanpa Sub-Kategori / Juz) */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full max-h-[92dvh] flex flex-col shadow-2xl border-2 border-opera-800 overflow-hidden">
            <div className="bg-gradient-to-r from-opera-950 to-opera-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-gold-500/40 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-gold-500/20 border border-gold-500/50 flex items-center justify-center text-gold-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-base text-gold-300">
                    Tambah Santri Peserta Baru
                  </h3>
                  <p className="text-[11px] text-opera-200">
                    Pilih kategori santri (Bil Ghoib, Bin Nadzor, atau Tamatan)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-opera-200 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTambahPeserta} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Kategori Utama */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kategori Utama Santri *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        kategoriUtama: 'BIL_GHOIB',
                      })
                    }
                    className={`py-2 px-3 rounded-xl font-bold border transition-all text-center ${
                      formData.kategoriUtama === 'BIL_GHOIB'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow'
                        : 'bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    Bil Ghoib
                    <span className="block text-[10px] font-normal opacity-80">
                      4 Tiket + Emas ★
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        kategoriUtama: 'BIN_NADZOR',
                      })
                    }
                    className={`py-2 px-3 rounded-xl font-bold border transition-all text-center ${
                      formData.kategoriUtama === 'BIN_NADZOR'
                        ? 'bg-blue-700 text-white border-blue-800 shadow'
                        : 'bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    Bin Nadzori
                    <span className="block text-[10px] font-normal opacity-80">
                      2 Tiket Biru
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        kategoriUtama: 'TAMATAN',
                      })
                    }
                    className={`py-2 px-3 rounded-xl font-bold border transition-all text-center ${
                      formData.kategoriUtama === 'TAMATAN'
                        ? 'bg-amber-600 text-white border-amber-700 shadow'
                        : 'bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    Tamatan
                    <span className="block text-[10px] font-normal opacity-80">
                      2 Tiket Kuning
                    </span>
                  </button>
                </div>
              </div>

              {/* Opsi Khusus Tamatan: Bagian A.01, A.02, A.03, A.04, B.01, B.02, B.03 */}
              {formData.kategoriUtama === 'TAMATAN' && (
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-300 space-y-1.5 animate-in fade-in">
                  <label className="block font-bold text-amber-950">
                    Pilih Bagian Tamatan *
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                    {BAGIAN_TAMATAN_LIST.map((bg) => (
                      <button
                        key={bg}
                        type="button"
                        onClick={() => setFormData({ ...formData, bagianTamatan: bg })}
                        className={`py-1.5 px-2 rounded-lg font-bold text-center text-xs transition-all ${
                          formData.bagianTamatan === bg
                            ? 'bg-amber-600 text-white shadow'
                            : 'bg-white text-amber-900 border border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {bg}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Nama Lengkap Santri */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap Santriwati *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: AISYAH NURUL JANNAH"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 uppercase font-semibold"
                />
              </div>

              {/* Kamar Pondok */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kamar Pondok</label>
                <input
                  type="text"
                  value={formData.kamar}
                  onChange={(e) => setFormData({ ...formData, kamar: e.target.value })}
                  placeholder="Contoh: Hafidzah / Maryam 02"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700"
                />
              </div>

              {/* Nama Wali & No WhatsApp */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Wali Santri *</label>
                  <input
                    type="text"
                    required
                    value={formData.namaWali}
                    onChange={(e) => setFormData({ ...formData, namaWali: e.target.value })}
                    placeholder="Contoh: BPK. ABDULLAH"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. WhatsApp Wali</label>
                  <input
                    type="text"
                    value={formData.noHp}
                    onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                    placeholder="081234567890"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-mono"
                  />
                </div>
              </div>

              {/* Alamat / Asal Kota */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat / Asal Kota</label>
                <input
                  type="text"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  placeholder="Contoh: KEDIRI / SURABAYA"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 uppercase"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-opera-850 hover:bg-opera-900 text-gold-300 font-serif font-black shadow border border-gold-500/40"
                >
                  Simpan Santri Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: TAMBAH TAMU UNDANGAN (Istimewa, Kehormatan, Umum) */}
      {/* ========================================================================= */}
      {showAddUndanganModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[92dvh] flex flex-col shadow-2xl border-2 border-opera-800 overflow-hidden">
            <div className="bg-gradient-to-r from-opera-950 to-opera-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-gold-500/40 shrink-0">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gold-500/20 border border-gold-500/50 flex items-center justify-center text-gold-400 shrink-0">
                  {selectedGolonganUndangan === 'ISTIMEWA' ? (
                    <Sparkles className="w-5 h-5 text-amber-400" />
                  ) : selectedGolonganUndangan === 'KEHORMATAN' ? (
                    <Building className="w-5 h-5 text-purple-400" />
                  ) : (
                    <Users className="w-5 h-5 text-cyan-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif font-black text-sm sm:text-base text-gold-300 truncate">
                    Tambah Tamu {selectedGolonganUndangan === 'ISTIMEWA' ? 'Istimewa' : selectedGolonganUndangan === 'KEHORMATAN' ? 'Kehormatan' : 'Umum'}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-opera-200 truncate">
                    {selectedGolonganUndangan === 'ISTIMEWA'
                      ? 'VVIP & Dzurriyyah / Keluarga Mahrus / Kunir / Bandar'
                      : selectedGolonganUndangan === 'KEHORMATAN'
                      ? 'Masyayikh, Habaib, Pejabat & Ulama Sepuh'
                      : 'Asatidz MHMTQ, Mustahiq, Pengajar Unit & Penguji'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddUndanganModal(false)}
                className="text-opera-200 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTambahUndangan} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {/* 3 Kotak Pemilih Golongan Undangan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pilih Golongan Tamu Undangan *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGolonganUndangan('ISTIMEWA');
                      setUndanganKategoriDropdown(OPSI_UNDANGAN_ISTIMEWA[0]);
                      setUndanganForm({
                        ...undanganForm,
                        kategori: OPSI_UNDANGAN_ISTIMEWA[0],
                        instansi: 'Kediri',
                        alamat: 'Kediri',
                        kuotaDasar: 2,
                      });
                      setCustomKategoriInput('');
                    }}
                    className={`py-2 px-2 rounded-xl font-bold text-xs border flex items-center justify-center space-x-1.5 transition-all ${
                      selectedGolonganUndangan === 'ISTIMEWA'
                        ? 'bg-amber-100 text-amber-900 border-amber-400 ring-2 ring-amber-400/30 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>🌟 Istimewa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGolonganUndangan('KEHORMATAN');
                      setUndanganForm({
                        ...undanganForm,
                        kategori: 'Tamu Kehormatan',
                        instansi: 'Kediri',
                        alamat: 'Kediri',
                        kuotaDasar: 4,
                      });
                      setCustomKategoriInput('');
                    }}
                    className={`py-2 px-2 rounded-xl font-bold text-xs border flex items-center justify-center space-x-1.5 transition-all ${
                      selectedGolonganUndangan === 'KEHORMATAN'
                        ? 'bg-purple-100 text-purple-900 border-purple-400 ring-2 ring-purple-400/30 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5 text-purple-600" />
                    <span>🏛️ Kehormatan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGolonganUndangan('UMUM');
                      setUndanganKategoriDropdown(OPSI_UNDANGAN_UMUM[0]);
                      setUndanganForm({
                        ...undanganForm,
                        kategori: OPSI_UNDANGAN_UMUM[0],
                        instansi: 'Pondok Pesantren Lirboyo',
                        alamat: 'Kediri',
                        kuotaDasar: 2,
                      });
                      setCustomKategoriInput('');
                    }}
                    className={`py-2 px-2 rounded-xl font-bold text-xs border flex items-center justify-center space-x-1.5 transition-all ${
                      selectedGolonganUndangan === 'UMUM'
                        ? 'bg-cyan-100 text-cyan-900 border-cyan-400 ring-2 ring-cyan-400/30 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-cyan-700" />
                    <span>👥 Umum</span>
                  </button>
                </div>
              </div>

              {/* NAMA TAMU UNDANGAN: JIKA ISTIMEWA BISA INPUT PUTRA & PUTRI, JIKA LAINNYA 1 FIELD NAMA */}
              {selectedGolonganUndangan === 'ISTIMEWA' ? (
                <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-amber-950 text-xs flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Nama Tamu Undangan Istimewa *</span>
                    </label>
                    <span className="text-[10px] text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full font-semibold">
                      Bisa diisi salah satu atau keduanya
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 text-[11px] mb-1">
                        🤵 Nama Tamu Putra (Gus / Kyai)
                      </label>
                      <input
                        type="text"
                        value={undanganForm.namaPutra}
                        onChange={(e) => setUndanganForm({ ...undanganForm, namaPutra: e.target.value })}
                        placeholder="Contoh: K.H. ABDULLAH KAFABIH MAHRUS"
                        className="w-full px-3 py-2.5 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase font-semibold text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 text-[11px] mb-1">
                        🧕 Nama Tamu Putri (Ning / Nyai)
                      </label>
                      <input
                        type="text"
                        value={undanganForm.namaPutri}
                        onChange={(e) => setUndanganForm({ ...undanganForm, namaPutri: e.target.value })}
                        placeholder="Contoh: NYAI HJ. TUTIK"
                        className="w-full px-3 py-2.5 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase font-semibold text-xs bg-white"
                      />
                    </div>
                  </div>
                  <div className="text-[10px] text-amber-800/80">
                    * Gabungan nama yang tercetak di kartu undangan:{' '}
                    <strong className="text-amber-950">
                      {undanganForm.namaPutra.trim() && undanganForm.namaPutri.trim()
                        ? `${undanganForm.namaPutra.trim().toUpperCase()} & ${undanganForm.namaPutri.trim().toUpperCase()}`
                        : (undanganForm.namaPutra.trim().toUpperCase() || undanganForm.namaPutri.trim().toUpperCase() || '(Belum diisi)')}
                    </strong>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Tamu / Tokoh / Kyai *
                  </label>
                  <input
                    type="text"
                    required
                    value={undanganForm.nama}
                    onChange={(e) => setUndanganForm({ ...undanganForm, nama: e.target.value })}
                    placeholder="Contoh: K.H. ABDULLAH KAFABIH MAHRUS"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 uppercase font-semibold"
                  />
                </div>
              )}

              {/* KATEGORI UNDANGAN: DIHAPUS UNTUK KEHORMATAN, HANYA MUNCUL DI ISTIMEWA DAN UMUM */}
              {selectedGolonganUndangan !== 'KEHORMATAN' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kategori Undangan *
                  </label>
                  <select
                    value={undanganKategoriDropdown}
                    onChange={(e) => {
                      const val = e.target.value;
                      setUndanganKategoriDropdown(val);
                      if (val !== 'Lainnya (Ketik Sendiri...)') {
                        setUndanganForm({ ...undanganForm, kategori: val });
                      } else {
                        setUndanganForm({ ...undanganForm, kategori: customKategoriInput });
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 bg-white font-medium text-slate-800"
                  >
                    {(selectedGolonganUndangan === 'ISTIMEWA'
                      ? OPSI_UNDANGAN_ISTIMEWA
                      : OPSI_UNDANGAN_UMUM
                    ).map((kat) => (
                      <option key={kat} value={kat}>
                        {kat}
                      </option>
                    ))}
                  </select>

                  {/* Input Khusus jika memilih opsi terakhir 'Lainnya (Ketik Sendiri...)' */}
                  {undanganKategoriDropdown === 'Lainnya (Ketik Sendiri...)' && (
                    <div className="mt-2.5 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                      <label className="block text-[11px] font-bold text-opera-900">
                        Ketik Kategori Undangan Sendiri *
                      </label>
                      <input
                        type="text"
                        required
                        value={customKategoriInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomKategoriInput(val);
                          setUndanganForm({ ...undanganForm, kategori: val });
                        }}
                        placeholder="Ketik kategori baru"
                        className="w-full px-3.5 py-2.5 rounded-xl border-2 border-opera-500 bg-opera-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-opera-700 font-medium placeholder:text-slate-400"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* INSTANSI / ALAMAT SESUAI GOLONGAN */}
              {selectedGolonganUndangan === 'ISTIMEWA' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Alamat *
                  </label>
                  <input
                    type="text"
                    value={undanganForm.alamat}
                    onChange={(e) =>
                      setUndanganForm({ ...undanganForm, alamat: e.target.value, instansi: e.target.value })
                    }
                    placeholder="Contoh: Bandar Kidul, Kediri / Blitar / Kunir"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-medium"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Alamat asal / daerah Tamu Istimewa</p>
                </div>
              )}

              {selectedGolonganUndangan === 'KEHORMATAN' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Alamat *
                  </label>
                  <input
                    type="text"
                    value={undanganForm.alamat}
                    onChange={(e) =>
                      setUndanganForm({ ...undanganForm, alamat: e.target.value, instansi: e.target.value })
                    }
                    placeholder="Contoh: Kediri / Ploso / Sarang / Rembang / Jakarta"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-medium"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Alamat asal / kediaman Masyayikh & Ulama Sepuh</p>
                </div>
              )}

              {selectedGolonganUndangan === 'UMUM' && (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Instansi / Asal Lembaga</label>
                    <input
                      type="text"
                      value={undanganForm.instansi}
                      onChange={(e) =>
                        setUndanganForm({ ...undanganForm, instansi: e.target.value })
                      }
                      placeholder="Contoh: Pondok Pesantren Lirboyo / Unit MHMTQ"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Alamat</label>
                    <input
                      type="text"
                      value={undanganForm.alamat}
                      onChange={(e) =>
                        setUndanganForm({ ...undanganForm, alamat: e.target.value })
                      }
                      placeholder="Contoh: Lirboyo, Mojoroto, Kota Kediri"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-medium"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Alamat domisili atau tempat tinggal</p>
                  </div>
                </>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Jatah Kuota Kursi</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={undanganForm.kuotaDasar}
                  onChange={(e) =>
                    setUndanganForm({ ...undanganForm, kuotaDasar: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-mono font-bold"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddUndanganModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-opera-850 hover:bg-opera-900 text-gold-300 font-serif font-black shadow border border-gold-500/40"
                >
                  Simpan Undangan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EDIT PESERTA (Santri atau Tamu Undangan) */}
      {/* ========================================================================= */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full max-h-[92dvh] flex flex-col shadow-2xl border-2 border-opera-800 overflow-hidden">
            <div className="bg-gradient-to-r from-opera-950 to-opera-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-gold-500/40 shrink-0">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/50 flex items-center justify-center text-blue-300 shrink-0">
                  <Edit className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif font-black text-sm sm:text-base text-gold-300 truncate">
                    Edit {editingItem.tipe === 'UNDANGAN' ? 'Tamu Undangan' : 'Peserta'}: {editingItem.kode}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-opera-200 truncate">
                    {editingItem.tipe === 'UNDANGAN' ? 'Perbarui data tamu dan jatah kursi' : 'Perbarui rincian santri dan wali'}
                  </p>
                </div>
              </div>
              <button onClick={() => setEditingItem(null)} className="text-opera-200 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {/* JIKA PESERTA ADALAH SANTRI: NAMA LENGKAP SANTRI */}
              {editingItem.tipe === 'SANTRI' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Santri *</label>
                  <input
                    type="text"
                    required
                    value={editingItem.nama}
                    onChange={(e) => setEditingItem({ ...editingItem, nama: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 uppercase font-semibold"
                  />
                </div>
              )}

              {/* JIKA PESERTA ADALAH TAMU UNDANGAN */}
              {editingItem.tipe === 'UNDANGAN' && (
                <>
                  {/* 3 Kotak Pemilih Golongan Undangan Edit */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Golongan Tamu Undangan *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditGolonganUndangan('ISTIMEWA');
                          setEditUndanganKategoriDropdown(OPSI_UNDANGAN_ISTIMEWA[0]);
                          setEditCustomKategoriInput('');
                        }}
                        className={`py-2 px-2 rounded-xl font-bold text-xs border flex items-center justify-center space-x-1.5 transition-all ${
                          editGolonganUndangan === 'ISTIMEWA'
                            ? 'bg-amber-100 text-amber-900 border-amber-400 ring-2 ring-amber-400/30 shadow-sm'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>🌟 Istimewa</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditGolonganUndangan('KEHORMATAN');
                          setEditCustomKategoriInput('');
                        }}
                        className={`py-2 px-2 rounded-xl font-bold text-xs border flex items-center justify-center space-x-1.5 transition-all ${
                          editGolonganUndangan === 'KEHORMATAN'
                            ? 'bg-purple-100 text-purple-900 border-purple-400 ring-2 ring-purple-400/30 shadow-sm'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Building className="w-3.5 h-3.5 text-purple-600" />
                        <span>🏛️ Kehormatan</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditGolonganUndangan('UMUM');
                          setEditUndanganKategoriDropdown(OPSI_UNDANGAN_UMUM[0]);
                          setEditCustomKategoriInput('');
                        }}
                        className={`py-2 px-2 rounded-xl font-bold text-xs border flex items-center justify-center space-x-1.5 transition-all ${
                          editGolonganUndangan === 'UMUM'
                            ? 'bg-cyan-100 text-cyan-900 border-cyan-400 ring-2 ring-cyan-400/30 shadow-sm'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5 text-cyan-700" />
                        <span>👥 Umum</span>
                      </button>
                    </div>
                  </div>

                  {/* NAMA TAMU ISTIMEWA (PUTRA & PUTRI) ATAU NAMA BIASA */}
                  {editGolonganUndangan === 'ISTIMEWA' ? (
                    <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block font-bold text-amber-950 text-xs flex items-center space-x-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Nama Tamu Undangan Istimewa *</span>
                        </label>
                        <span className="text-[10px] text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full font-semibold">
                          Bisa diisi salah satu atau keduanya
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 text-[11px] mb-1">
                            🤵 Nama Tamu Putra (Gus / Kyai)
                          </label>
                          <input
                            type="text"
                            value={editingItem.namaPutra || ''}
                            onChange={(e) => {
                              const p = e.target.value;
                              const w = editingItem.namaPutri || '';
                              const combined = p.trim() && w.trim() ? `${p.trim()} & ${w.trim()}` : (p.trim() || w.trim());
                              setEditingItem({ ...editingItem, namaPutra: p, nama: combined });
                            }}
                            placeholder="Contoh: K.H. ABDULLAH KAFABIH MAHRUS"
                            className="w-full px-3 py-2.5 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase font-semibold text-xs bg-white"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 text-[11px] mb-1">
                            🧕 Nama Tamu Putri (Ning / Nyai)
                          </label>
                          <input
                            type="text"
                            value={editingItem.namaPutri || ''}
                            onChange={(e) => {
                              const w = e.target.value;
                              const p = editingItem.namaPutra || '';
                              const combined = p.trim() && w.trim() ? `${p.trim()} & ${w.trim()}` : (p.trim() || w.trim());
                              setEditingItem({ ...editingItem, namaPutri: w, nama: combined });
                            }}
                            placeholder="Contoh: NYAI HJ. TUTIK"
                            className="w-full px-3 py-2.5 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase font-semibold text-xs bg-white"
                          />
                        </div>
                      </div>
                      <div className="text-[10px] text-amber-800/80">
                        * Gabungan nama yang tercetak di kartu undangan:{' '}
                        <strong className="text-amber-950">
                          {editingItem.namaPutra && editingItem.namaPutri
                            ? `${editingItem.namaPutra.trim().toUpperCase()} & ${editingItem.namaPutri.trim().toUpperCase()}`
                            : (editingItem.namaPutra?.trim().toUpperCase() || editingItem.namaPutri?.trim().toUpperCase() || editingItem.nama || '(Belum diisi)')}
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Nama Tamu / Tokoh / Kyai *
                      </label>
                      <input
                        type="text"
                        required
                        value={editingItem.nama || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, nama: e.target.value })}
                        placeholder="Contoh: K.H. ABDULLAH KAFABIH MAHRUS"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 uppercase font-semibold"
                      />
                    </div>
                  )}

                  {/* KATEGORI UNDANGAN: DIHAPUS UNTUK KEHORMATAN, HANYA MUNCUL DI ISTIMEWA DAN UMUM */}
                  {editGolonganUndangan !== 'KEHORMATAN' && (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Kategori Undangan *
                      </label>
                      <select
                        value={editUndanganKategoriDropdown}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditUndanganKategoriDropdown(val);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 bg-white font-medium text-slate-800"
                      >
                        {(editGolonganUndangan === 'ISTIMEWA'
                          ? OPSI_UNDANGAN_ISTIMEWA
                          : OPSI_UNDANGAN_UMUM
                        ).map((kat) => (
                          <option key={kat} value={kat}>
                            {kat}
                          </option>
                        ))}
                      </select>

                      {editUndanganKategoriDropdown === 'Lainnya (Ketik Sendiri...)' && (
                        <div className="mt-2.5 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                          <label className="block text-[11px] font-bold text-opera-900">
                            Ketik Kategori Undangan Sendiri *
                          </label>
                          <input
                            type="text"
                            required
                            value={editCustomKategoriInput}
                            onChange={(e) => setEditCustomKategoriInput(e.target.value)}
                            placeholder="Ketik kategori baru"
                            className="w-full px-3.5 py-2.5 rounded-xl border-2 border-opera-500 bg-opera-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-opera-700 font-medium"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* INSTANSI / ALAMAT SESUAI GOLONGAN */}
                  {editGolonganUndangan === 'ISTIMEWA' && (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Alamat *
                      </label>
                      <input
                        type="text"
                        value={editingItem.alamat || editingItem.instansi || ''}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            alamat: e.target.value,
                            instansi: e.target.value,
                          })
                        }
                        placeholder="Contoh: Bandar Kidul, Kediri / Blitar / Kunir"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-medium"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Alamat asal / daerah Tamu Istimewa</p>
                    </div>
                  )}

                  {editGolonganUndangan === 'KEHORMATAN' && (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Alamat *
                      </label>
                      <input
                        type="text"
                        value={editingItem.alamat || editingItem.instansi || ''}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            alamat: e.target.value,
                            instansi: e.target.value,
                          })
                        }
                        placeholder="Contoh: Kediri / Ploso / Sarang / Rembang / Jakarta"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-medium"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Alamat asal / kediaman Masyayikh & Ulama Sepuh</p>
                    </div>
                  )}

                  {editGolonganUndangan === 'UMUM' && (
                    <>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Instansi / Asal Lembaga</label>
                        <input
                          type="text"
                          value={editingItem.instansi || ''}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              instansi: e.target.value,
                            })
                          }
                          placeholder="Contoh: Pondok Pesantren Lirboyo / Unit MHMTQ"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Alamat</label>
                        <input
                          type="text"
                          value={editingItem.alamat || ''}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              alamat: e.target.value,
                            })
                          }
                          placeholder="Contoh: Lirboyo, Mojoroto, Kota Kediri"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-medium"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Alamat domisili atau tempat tinggal</p>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jatah Kuota Kursi</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={editingItem.kuotaDasar}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, kuotaDasar: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-mono font-bold"
                    />
                  </div>
                </>
              )}

              {/* JIKA PESERTA ADALAH SANTRI */}
              {editingItem.tipe === 'SANTRI' && (
                <>
                  {/* Kategori Utama Switcher */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kategori Santri</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['BIL_GHOIB', 'BIN_NADZOR', 'TAMATAN'] as const).map((kat) => (
                        <button
                          key={kat}
                          type="button"
                          onClick={() => setEditingItem({ ...editingItem, kategoriUtama: kat })}
                          className={`py-2 px-2.5 rounded-xl font-bold text-xs border transition-all ${
                            editingItem.kategoriUtama === kat
                              ? kat === 'BIL_GHOIB'
                                ? 'bg-emerald-700 text-white border-emerald-800'
                                : kat === 'BIN_NADZOR'
                                ? 'bg-blue-700 text-white border-blue-800'
                                : 'bg-amber-600 text-white border-amber-700'
                              : 'bg-slate-50 text-slate-700 border-slate-300'
                          }`}
                        >
                          {kat === 'BIL_GHOIB' ? 'Bil Ghoib' : kat === 'BIN_NADZOR' ? 'Bin Nadzori' : 'Tamatan'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Jika Tamatan, Pilih Bagian */}
                  {editingItem.kategoriUtama === 'TAMATAN' && (
                    <div>
                      <label className="block font-bold text-amber-950 mb-1">Bagian Tamatan *</label>
                      <select
                        value={editingItem.bagianTamatan || 'A.01'}
                        onChange={(e) => setEditingItem({ ...editingItem, bagianTamatan: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-950 font-bold focus:outline-none focus:ring-2 focus:ring-amber-600"
                      >
                        {BAGIAN_TAMATAN_LIST.map((bg) => (
                          <option key={bg} value={bg}>
                            Bagian {bg}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Kamar Pondok</label>
                      <input
                        type="text"
                        value={editingItem.kamar}
                        onChange={(e) => setEditingItem({ ...editingItem, kamar: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Kuota Dasar Kursi</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={editingItem.kuotaDasar}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, kuotaDasar: Number(e.target.value) })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Nama Wali</label>
                      <input
                        type="text"
                        value={editingItem.namaWali}
                        onChange={(e) => setEditingItem({ ...editingItem, namaWali: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 uppercase"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">No. WhatsApp</label>
                      <input
                        type="text"
                        value={editingItem.noHp}
                        onChange={(e) => setEditingItem({ ...editingItem, noHp: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Alamat / Asal Kota</label>
                    <input
                      type="text"
                      value={editingItem.alamat}
                      onChange={(e) => setEditingItem({ ...editingItem, alamat: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 uppercase"
                    />
                  </div>
                </>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold shadow"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: KONFIRMASI HAPUS PESERTA */}
      {/* ========================================================================= */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-2 border-rose-500 overflow-hidden">
            <div className="bg-rose-50 p-5 border-b border-rose-200 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-serif font-black text-slate-900 text-sm">
                  Konfirmasi Hapus Peserta
                </h3>
                <p className="text-[11px] text-rose-700">Tindakan ini akan mengurangi daftar peserta</p>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus peserta berikut dari daftar Haul & Haflah?
              </p>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-mono font-bold text-opera-900">{deletingItem.kode}</div>
                <div className="font-bold text-slate-900 text-sm">{deletingItem.nama}</div>
                <div className="text-slate-500 text-[11px]">
                  Kategori: {deletingItem.kategoriUtama} {deletingItem.bagianTamatan && `· Bagian ${deletingItem.bagianTamatan}`} · Wali: {deletingItem.namaWali}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingItem(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow"
                >
                  Hapus Permanen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: KONFIRMASI HAPUS SEMUA PESERTA */}
      {/* ========================================================================= */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border-2 border-rose-500 overflow-hidden">
            <div className="bg-rose-50 p-4 sm:p-5 border-b border-rose-200 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-serif font-black text-slate-900 text-sm sm:text-base">
                  Hapus / Kosongkan Data
                </h3>
                <p className="text-[11px] text-rose-700">Pilih lingkup data yang ingin dihapus</p>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Tindakan ini akan menghapus peserta dari basis data. Pilih opsi penghapusan:
              </p>

              <div className="space-y-2">
                <label
                  onClick={() => setClearScope('SANTRI')}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    clearScope === 'SANTRI'
                      ? 'border-rose-500 bg-rose-50/70 ring-2 ring-rose-400/30'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-900">Hapus Semua Santri Peserta Saja</div>
                    <div className="text-[11px] text-slate-500">
                      Menghapus {stats.totalSantri} santri (Bil Ghoib, Bin Nadzor, Tamatan). 70 Tamu Undangan tetap disimpan.
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="clearScope"
                    checked={clearScope === 'SANTRI'}
                    onChange={() => setClearScope('SANTRI')}
                    className="accent-rose-600 w-4 h-4 ml-2"
                  />
                </label>

                <label
                  onClick={() => setClearScope('UNDANGAN')}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    clearScope === 'UNDANGAN'
                      ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-400/30'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-900">Hapus Semua Tamu Undangan Saja</div>
                    <div className="text-[11px] text-slate-500">
                      Menghapus {stats.undanganCount} tamu undangan (Istimewa, Kehormatan, Umum). Data santri tetap disimpan.
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="clearScope"
                    checked={clearScope === 'UNDANGAN'}
                    onChange={() => setClearScope('UNDANGAN')}
                    className="accent-amber-600 w-4 h-4 ml-2"
                  />
                </label>

                <label
                  onClick={() => setClearScope('SEMUA')}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    clearScope === 'SEMUA'
                      ? 'border-rose-600 bg-rose-100/70 ring-2 ring-rose-500/30'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-bold text-rose-900">Hapus Seluruh Data (Kosong Total)</div>
                    <div className="text-[11px] text-rose-700">
                      Menghapus seluruh {stats.totalSemua} data (Santri + Tamu Undangan).
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="clearScope"
                    checked={clearScope === 'SEMUA'}
                    onChange={() => setClearScope('SEMUA')}
                    className="accent-rose-600 w-4 h-4 ml-2"
                  />
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmHapusSemua}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow"
                >
                  Ya, Hapus Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: DETAIL QR CODE & KARTU SANTRI */}
      {/* ========================================================================= */}
      {qrDetailItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border-2 border-opera-800 overflow-hidden">
            <div className="bg-gradient-to-r from-opera-950 via-opera-900 to-opera-950 text-white p-5 text-center border-b border-gold-500/40 relative">
              <button
                onClick={() => setQrDetailItem(null)}
                className="absolute right-3.5 top-3.5 text-opera-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="text-[11px] font-serif text-gold-400 tracking-widest uppercase">
                HAUL & HAFLAH 1448 H / 2027 M
              </div>
              <h3 className="font-serif font-black text-base text-white mt-1">
                KARTU PESERTA RESMI
              </h3>
              <div className="text-[11px] text-opera-200">
                P3TQ — MHMTQ PP. Lirboyo Kediri
              </div>
            </div>

            <div className="p-6 text-center space-y-4">
              {/* QR Image */}
              <div className="p-3 bg-white border-2 border-dashed border-opera-300 rounded-2xl inline-block shadow-sm">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code ${qrDetailItem.kode}`}
                    className="w-48 h-48 mx-auto"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-slate-400 font-mono text-xs">
                    Membuat QR...
                  </div>
                )}
                <div className="font-mono font-bold text-sm text-slate-800 mt-2">
                  {qrDetailItem.kode}
                </div>
              </div>

              {/* Rincian Peserta */}
              <div className="text-xs space-y-1">
                <div className="font-serif font-black text-base text-slate-900">
                  {qrDetailItem.nama}
                </div>
                <div className="text-slate-600 font-medium">
                  {qrDetailItem.kategoriUtama === 'BIL_GHOIB'
                    ? 'Bil Ghoib'
                    : qrDetailItem.kategoriUtama === 'BIN_NADZOR'
                    ? 'Bin Nadzori'
                    : qrDetailItem.kategoriUtama === 'TAMATAN'
                    ? `Tamatan (Bagian ${qrDetailItem.bagianTamatan})`
                    : qrDetailItem.golonganUndangan === 'ISTIMEWA'
                    ? `Undangan Istimewa · ${qrDetailItem.kategori}`
                    : qrDetailItem.golonganUndangan === 'KEHORMATAN'
                    ? 'Tamu Undangan Kehormatan'
                    : `Undangan Umum · ${qrDetailItem.kategori}`}
                  {qrDetailItem.kamar !== '-' && ` · Kamar ${qrDetailItem.kamar}`}
                </div>
                <div className="text-slate-500 text-[11px]">
                  {qrDetailItem.tipe === 'UNDANGAN' ? (
                    qrDetailItem.golonganUndangan === 'ISTIMEWA' ? (
                      <span className="text-amber-900 font-semibold">📍 Alamat: {qrDetailItem.alamat || qrDetailItem.instansi || 'Kediri'}</span>
                    ) : qrDetailItem.golonganUndangan === 'KEHORMATAN' ? (
                      <span className="text-purple-900 font-semibold">📍 Alamat: {qrDetailItem.alamat || qrDetailItem.instansi || 'Kediri'}</span>
                    ) : (
                      <span>
                        🏛️ Instansi: {qrDetailItem.instansi || 'Pondok Pesantren Lirboyo'}
                        {qrDetailItem.alamat && qrDetailItem.alamat !== '-' && qrDetailItem.alamat !== qrDetailItem.instansi && ` · 📍 ${qrDetailItem.alamat}`}
                      </span>
                    )
                  ) : (
                    <span>Wali: {qrDetailItem.namaWali} ({qrDetailItem.alamat})</span>
                  )}
                </div>
              </div>

              {/* Jatah Kuota */}
              <div className="p-3 rounded-2xl bg-opera-50 border border-opera-200 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-slate-500 text-[10px]">TOTAL KUOTA</div>
                  <div className="font-serif font-black text-slate-800 text-lg">
                    {qrDetailItem.kuotaDasar + qrDetailItem.kuotaTambahan} Kursi
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">STATUS TIKET</div>
                  <div className="font-serif font-black text-opera-800 text-base">
                    {qrDetailItem.tipe === 'UNDANGAN'
                      ? qrDetailItem.golonganUndangan === 'ISTIMEWA'
                        ? 'VIP Emas'
                        : qrDetailItem.golonganUndangan === 'KEHORMATAN'
                        ? 'VIP Ungu'
                        : 'VIP Biru'
                      : qrDetailItem.kategoriUtama === 'BIL_GHOIB'
                      ? 'Emas ★'
                      : qrDetailItem.kategoriUtama === 'BIN_NADZOR'
                      ? 'Biru'
                      : 'Kuning'}
                  </div>
                </div>
              </div>

              {/* Link Akses Portal Wali / Undangan */}
              <div className="pt-2 flex gap-2">
                <a
                  href={`/u/${qrDetailItem.kode}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 rounded-xl bg-opera-850 hover:bg-opera-900 text-gold-300 font-serif font-bold text-xs shadow border border-gold-500/40 flex items-center justify-center space-x-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{qrDetailItem.tipe === 'UNDANGAN' ? 'Buka Portal Undangan' : 'Buka Portal Wali'}</span>
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/u/${qrDetailItem.kode}`
                    );
                    showToast(
                      `✓ Link portal ${qrDetailItem.tipe === 'UNDANGAN' ? 'undangan' : 'wali'} berhasil disalin!`
                    );
                  }}
                  className="px-3 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Salin Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
