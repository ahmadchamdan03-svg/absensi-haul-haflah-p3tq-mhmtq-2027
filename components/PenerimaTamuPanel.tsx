'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  HelpCircle,
  LogOut,
  MapPin,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Gift,
  Building,
  Plus,
  X,
  Phone,
  Trash2,
  Info,
  RotateCcw,
} from 'lucide-react';
import { store } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';
import { clearActiveRole } from '@/lib/auth-roles';
import { getWarnaTiketUndangan, getDefaultJalurMasuk } from '@/lib/types';
import TanyaUsModal from '@/components/TanyaUsModal';

type GolonganUndangan = 'ISTIMEWA' | 'KEHORMATAN' | 'UMUM';

const OPSI_UNDANGAN_ISTIMEWA = [
  'VVIP',
  'VIP Bani Marzuqi',
  'VIP Bani Qomariyah',
  'VIP Bani Mahrus (Zainab)',
  'VIP Bani Salamah',
  'VIP Bani Aisyah',
  'VIP Bandar',
  'VIP Keluarga Kunir – Blitar',
  'VIP IDS',
  'Lainnya (Ketik Sendiri...)',
];

const OPSI_UNDANGAN_UMUM = [
  'Asatidz Mhmtq Sekalian',
  'Asatidz Purna Bakti',
  'Asatidzah Mhmtq Nduduk Rumah',
  'Mustahiq Tamatan Non Purna',
  'Purna Mustahiqoh Ibtidaiyyah Tamatan Aliyah',
  'Pengajar Ekstrakurikuler Pondok (Mutakhorijin)',
  'Pengajar Unit',
  "Penguji Al-Qur'an",
  'Perwakilan Pondok',
  'Lainnya (Ketik Sendiri...)',
];

export default function PenerimaTamuPanel({ showLogout = true }: { showLogout?: boolean }) {
  const router = useRouter();
  const [undanganList, setUndanganList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUsModalOpen, setIsUsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ABSENSI' | 'POS_JAGA'>('ABSENSI');

  // Modal Tambah Tamu Baru
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGolonganUndangan, setSelectedGolonganUndangan] = useState<GolonganUndangan>('ISTIMEWA');
  const [undanganForm, setUndanganForm] = useState({
    nama: '',
    namaPutra: '',
    namaPutri: '',
    kategori: OPSI_UNDANGAN_ISTIMEWA[0],
    instansi: '',
    alamat: '',
    noHp: '',
    kuotaDasar: 2,
    jalurMasuk: getDefaultJalurMasuk('ISTIMEWA'),
  });
  const [undanganKategoriDropdown, setUndanganKategoriDropdown] = useState<string>(OPSI_UNDANGAN_ISTIMEWA[0]);
  const [customKategoriInput, setCustomKategoriInput] = useState<string>('');

  const handleOpenAddModal = (gol: GolonganUndangan = 'ISTIMEWA') => {
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
      instansi: '',
      alamat: '',
      noHp: '',
      kuotaDasar: gol === 'ISTIMEWA' ? 2 : gol === 'KEHORMATAN' ? 4 : 2,
      jalurMasuk: getDefaultJalurMasuk(gol),
    });
    setCustomKategoriInput('');
    setShowAddModal(true);
  };

  const fetchTamuData = async () => {
    try {
      const { data: supaData, error } = await supabase
        .from('tamu_undangan')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && supaData) {
        const mapped = supaData.map((d: any) => ({
          id: d.id,
          kode: d.kode,
          nama: d.nama,
          namaPutra: d.nama_putra || '',
          namaPutri: d.nama_putri || '',
          kategori: d.kategori || 'VIP IDS',
          instansi: d.instansi || d.alamat || '',
          alamat: d.alamat || '',
          noHp: d.no_hp || '',
          golongan: d.sub_kategori || 'ISTIMEWA',
          kuota: {
            id: d.id,
            kodeQr: d.kode,
            kuotaDasar: (d.nama_putra && String(d.nama_putra).trim() ? 1 : 0) + (d.nama_putri && String(d.nama_putri).trim() ? 1 : 0),
            kuotaTambahan: 0,
            terpakai: d.kuota_terpakai || 0,
          },
        }));
        setUndanganList(mapped);
      } else {
        setUndanganList([]);
      }
    } catch (e) {
      setUndanganList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTamuData();
    const interval = setInterval(fetchTamuData, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredUndangan = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return undanganList;
    return undanganList.filter((u) => {
      return (
        u.nama.toLowerCase().includes(q) ||
        (u.instansi && u.instansi.toLowerCase().includes(q)) ||
        u.kode.toLowerCase().includes(q) ||
        (u.kategori && u.kategori.toLowerCase().includes(q))
      );
    });
  }, [undanganList, searchQuery]);

  const handleQuickCheckin = async (u: any) => {
    const terpakaiSekarang = u.kuota?.terpakai || 0;
    const kuotaDasar = u.kuota?.kuotaDasar || 2;
    const kuotaTambahan = u.kuota?.kuotaTambahan || 0;
    const totalKuotaItem = kuotaDasar + kuotaTambahan;
    if (terpakaiSekarang >= totalKuotaItem) {
      alert(`Kuota untuk ${u.nama} sudah terpakai seluruhnya.`);
      return;
    }

    const newTerpakai = totalKuotaItem;

    let jumlahL = 1;
    let jumlahP = 0;

    const p = (u.namaPutra || '').trim();
    const w = (u.namaPutri || '').trim();

    if (p && w) {
      jumlahL = Math.ceil(totalKuotaItem / 2);
      jumlahP = Math.floor(totalKuotaItem / 2);
    } else if (p) {
      jumlahL = totalKuotaItem;
      jumlahP = 0;
    } else if (w) {
      jumlahL = 0;
      jumlahP = totalKuotaItem;
    } else {
      const lower = (u.nama || '').toLowerCase();
      const isFemale = ['nyai', 'hj.', 'ning', 'ibu', 'ustadzah', 'hajah', 'biyung'].some((h) => lower.includes(h));
      if (isFemale) {
        jumlahL = 0;
        jumlahP = totalKuotaItem;
      } else {
        jumlahL = totalKuotaItem;
        jumlahP = 0;
      }
    }

    try {
      const { error: errUpdate } = await supabase
        .from('tamu_undangan')
        .update({ kuota_terpakai: newTerpakai })
        .eq('kode', u.kode);

      if (errUpdate) {
        console.warn('Supabase checkin update error:', errUpdate);
      }

      await supabase.from('presensi_log').insert([
        {
          kode_qr: u.kode,
          nama_peserta: u.nama,
          tipe_peserta: 'UNDANGAN',
          jalur: 'MEJA_TRANSIT',
          panitia_id: 'penerima-tamu',
          jumlah_l: jumlahL,
          jumlah_p: jumlahP,
          jumlah_balita: 0,
          tiket_panggung: '0',
          catatan: 'Checkin via Penerima Tamu',
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      console.warn('Supabase presensi_log error:', e);
    }

    store.checkin(u.kode, totalKuotaItem, 0, 'BARAT', 0, 'penerima-tamu');
    await fetchTamuData();
  };

  const handleBatalkanHadir = async (u: any) => {
    if (!confirm(`Batalkan kehadiran untuk ${u.nama} (${u.kode})? Status akan kembali menjadi BELUM HADIR.`)) {
      return;
    }

    try {
      const { error: errUpdate } = await supabase
        .from('tamu_undangan')
        .update({ kuota_terpakai: 0 })
        .eq('kode', u.kode);

      if (errUpdate) {
        console.warn('Supabase undo error:', errUpdate);
      }

      await supabase
        .from('presensi_log')
        .delete()
        .eq('kode_qr', u.kode);
    } catch (e) {
      console.warn('Supabase delete presensi_log error:', e);
    }

    (store as any).batalCheckin(u.kode);
    await fetchTamuData();
  };

  const handleHapusTamu = async (u: any) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data tamu "${u.nama}"?`)) return;
    try {
      await supabase.from('tamu_undangan').delete().eq('kode', u.kode);
    } catch (e) {
      console.warn('Supabase delete error:', e);
    }
    (store as any).batalCheckin(u.kode);
    await fetchTamuData();
  };

  const handleTambahTamu = async (e: React.FormEvent) => {
    e.preventDefault();

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

    const isAsatidzSekalian = selectedGolonganUndangan === 'UMUM' && finalKategori === 'Asatidz Mhmtq Sekalian';

    const p = (undanganForm.namaPutra || '').trim().toUpperCase();
    const w = (undanganForm.namaPutri || '').trim().toUpperCase();
    const n = (undanganForm.nama || '').trim().toUpperCase();

    if (!p && !w && !n) {
      alert('Mohon isi minimal salah satu: Nama Tamu Putra (Kyai/Gus/Ust.) atau Nama Tamu Putri (Nyai/Ning/Ustazah)!');
      return;
    }

    let finalNama = '';
    let kuotaBase = 1;

    if (p && w) {
      finalNama = `${p} & ${w}`;
      kuotaBase = 2;
    } else if (p) {
      finalNama = p;
      kuotaBase = 1;
    } else if (w) {
      finalNama = w;
      kuotaBase = 1;
    } else {
      finalNama = n;
      kuotaBase = 1;
    }

    if (isAsatidzSekalian && p && w) {
      kuotaBase = 2;
    }

    let finalAlamat = '';
    let finalInstansi = '';

    if (selectedGolonganUndangan === 'ISTIMEWA' || selectedGolonganUndangan === 'KEHORMATAN') {
      finalAlamat = (undanganForm.alamat || undanganForm.instansi || '').trim();
      finalInstansi = finalAlamat;
    } else {
      finalInstansi = (undanganForm.instansi || '').trim();
      finalAlamat = (undanganForm.alamat || '').trim();
    }

    if (!p && !w && !finalNama) {
      alert('Minimal salah satu nama (Putra atau Putri) harus diisi!');
      return;
    }

    const newKode = `UND-${Math.floor(10000 + Math.random() * 90000)}`;
    const finalJalur = (undanganForm.jalurMasuk || getDefaultJalurMasuk(selectedGolonganUndangan)).trim();

    try {
      const { error } = await supabase.from('tamu_undangan').insert([
        {
          kode: newKode,
          nama: finalNama,
          nama_putra: p || null,
          nama_putri: w || null,
          instansi: finalInstansi || '-',
          alamat: finalAlamat || '-',
          kategori: finalKategori,
          sub_kategori: selectedGolonganUndangan || 'ISTIMEWA',
          no_hp: undanganForm.noHp || '-',
          kuota_terpakai: 0,
          warna_tiket: getWarnaTiketUndangan(selectedGolonganUndangan, finalKategori),
          jalur_masuk: finalJalur,
        },
      ]);
      if (error) {
        console.error('Supabase insert error (tamu_undangan):', error);
        alert(`Gagal menyimpan Tamu Undangan ke Supabase DB: ${error.message}`);
        return;
      }
    } catch (err: any) {
      console.warn('Supabase direct insert exception:', err);
      alert(`Terjadi kesalahan saat menyimpan: ${err.message || err}`);
      return;
    }

    store.tambahUndangan({
      nama: finalNama,
      namaPutra: p,
      namaPutri: w,
      kategori: finalKategori,
      instansi: finalInstansi,
      alamat: finalAlamat,
      kuotaDasar: kuotaBase,
      golongan: selectedGolonganUndangan,
      jalurMasuk: finalJalur,
    });

    await fetchTamuData();
    setShowAddModal(false);
    alert(`✓ Berhasil menambahkan Tamu Undangan ke Supabase: ${finalNama} (Kode: ${newKode})`);

    setUndanganForm({
      nama: '',
      namaPutra: '',
      namaPutri: '',
      kategori: OPSI_UNDANGAN_ISTIMEWA[0],
      instansi: '',
      alamat: '',
      noHp: '',
      kuotaDasar: 1,
      jalurMasuk: getDefaultJalurMasuk('ISTIMEWA'),
    });
    setUndanganKategoriDropdown(OPSI_UNDANGAN_ISTIMEWA[0]);
    setCustomKategoriInput('');
  };

  const handleLogout = () => {
    clearActiveRole();
    router.push('/');
  };

  const totalKuotaTamu = useMemo(() => {
    return undanganList.reduce((acc, u) => {
      const kBase = Number(u.kuota?.kuotaDasar !== undefined && u.kuota?.kuotaDasar !== null ? u.kuota.kuotaDasar : 2);
      const kExtra = Number(u.kuota?.kuotaTambahan || 0);
      return acc + kBase + kExtra;
    }, 0);
  }, [undanganList]);

  const totalHadirTamu = useMemo(() => {
    return undanganList.reduce((acc, u) => {
      return acc + Number(u.kuota?.terpakai || 0);
    }, 0);
  }, [undanganList]);

  const totalBelumHadirTamu = useMemo(() => {
    return Math.max(0, totalKuotaTamu - totalHadirTamu);
  }, [totalKuotaTamu, totalHadirTamu]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#422F21] pb-24">
      {/* HEADER RESPONSIF */}
      <header className="border-b border-[#E8DFD5] bg-[#FAF7F3]/95 backdrop-blur-md sticky top-0 z-20 px-3.5 sm:px-6 py-3 sm:py-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-50 text-emerald-800 border-2 border-emerald-600 flex items-center justify-center font-bold shadow-xs shrink-0">
              <Users className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs font-serif font-black tracking-wider text-emerald-800 uppercase leading-tight truncate">
                POS PENERIMA TAMU · MEJA TRANSIT
              </div>
              <h1 className="font-serif font-black text-xs sm:text-base text-[#422F21] leading-tight truncate">
                Haul &amp; Haflah P3TQ - MHMTQ 2027
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-0.5 md:pb-0">
            <button
              type="button"
              onClick={() => handleOpenAddModal('ISTIMEWA')}
              className="flex-1 md:flex-none justify-center px-3 py-2 sm:py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs flex items-center space-x-1 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Tamu</span>
            </button>
            <button
              type="button"
              onClick={() => setIsUsModalOpen(true)}
              className="flex-1 md:flex-none justify-center px-3 py-2 sm:py-1.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 hover:brightness-105 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap"
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-200" />
              <span>Tanya Us. Halwaa</span>
            </button>
            {showLogout && (
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-2 sm:py-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 text-xs font-bold shadow-2xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap"
                title="Keluar / Ganti Peran"
              >
                <LogOut className="w-3.5 h-3.5 text-stone-500" />
                <span className="inline">Keluar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* RINGKASAN LIVE DASBOR TAMU */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-3xl bg-white border border-[#E8DFD5] shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">
              Total Tamu Terdata
            </span>
            <div className="text-2xl font-serif font-black text-[#422F21]">
              {totalKuotaTamu} Kursi
            </div>
            <p className="text-[11px] text-stone-600">Total Kuota ({undanganList.length} Undangan)</p>
          </div>

          <div className="p-4 rounded-3xl bg-emerald-50/70 border border-emerald-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
              Tamu Sudah Rawuh
            </span>
            <div className="text-2xl font-serif font-black text-emerald-900">
              {totalHadirTamu} Hadir
            </div>
            <p className="text-[11px] text-emerald-700">Terpakai ({totalHadirTamu}/{totalKuotaTamu} Kursi)</p>
          </div>

          <div className="p-4 rounded-3xl bg-amber-50/70 border border-amber-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">
              Belum Hadir
            </span>
            <div className="text-2xl font-serif font-black text-amber-900">
              {totalBelumHadirTamu} Belum
            </div>
            <p className="text-[11px] text-amber-700">Sisa Kuota Belum Terpakai</p>
          </div>

          <div className="p-4 rounded-3xl bg-blue-50/70 border border-blue-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wide">
              Registrasi Gerbang
            </span>
            <div className="text-2xl font-serif font-black text-blue-900">06.30 WIB</div>
            <p className="text-[11px] text-blue-700">07.00 Waktu Istiwa' (WIs)</p>
          </div>
        </div>

        {/* TAB PILIHAN: ABSENSI CEPAT vs 8 POS JAGA */}
        <div className="flex bg-[#EFE8E1] p-1 rounded-2xl border border-[#D5C4B4] max-w-md">
          <button
            onClick={() => setActiveTab('ABSENSI')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ABSENSI'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-[#422F21] hover:text-emerald-800'
            }`}
          >
            Absensi Cepat Tamu
          </button>
          <button
            onClick={() => setActiveTab('POS_JAGA')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'POS_JAGA'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-[#422F21] hover:text-emerald-800'
            }`}
          >
            8 Pos Jaga Putri &amp; Putra
          </button>
        </div>

        {/* PANEL ABSENSI CEPAT TAMU UNDANGAN */}
        {activeTab === 'ABSENSI' && (
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#E8DFD5] shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
              <div>
                <h3 className="font-serif font-black text-lg text-[#422F21]">
                  absen cepat tamu undangan
                </h3>
                <p className="text-xs text-[#7A624E] font-medium">
                  haul haflah p3tq mhmtq 2027 M./ 1448 H.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Tamu Baru</span>
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama kiai, masyaikh, instansi, atau kode tamu..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#D5C4B4] bg-[#FAF7F3] focus:bg-white text-xs sm:text-sm focus:outline-none focus:border-emerald-700"
              />
            </div>

            {loading ? (
              <div className="p-8 text-center text-stone-500 text-xs">
                <p>Memuat data tamu dari Supabase...</p>
              </div>
            ) : filteredUndangan.length === 0 ? (
              <div className="p-8 text-center text-stone-500 text-xs bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                <p className="font-bold text-sm text-[#422F21]">Belum ada data peserta / tamu</p>
                <p className="mt-1 text-stone-600">
                  Silakan panitia menambahkan data tamu undangan via tombol "+ Tambah Tamu Baru".
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredUndangan.map((u) => {
                  const terpakai = u.kuota?.terpakai || 0;
                  const kuotaDasar = u.kuota?.kuotaDasar || 2;
                  const kuotaTambahan = u.kuota?.kuotaTambahan || 0;
                  const totalKuotaItem = kuotaDasar + kuotaTambahan;
                  const sisa = Math.max(0, totalKuotaItem - terpakai);
                  const isHadir = terpakai > 0;

                  return (
                    <div
                      key={u.id || u.kode}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isHadir
                          ? 'bg-emerald-50/60 border-emerald-300'
                          : 'bg-white border-[#E8DFD5] hover:border-emerald-500'
                      }`}
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                            {u.kode}
                          </span>
                          <span className="text-[10px] text-emerald-800 font-semibold truncate">
                            {u.kategori}
                          </span>
                        </div>
                        <h4 className="font-serif font-black text-sm text-[#422F21] truncate">
                          {u.nama}
                        </h4>
                        <p className="text-[11px] text-stone-600 truncate flex items-center gap-1">
                          <Building className="w-3 h-3 text-stone-400 shrink-0" />
                          <span>{u.instansi || u.alamat || 'Kediri'}</span>
                        </p>
                        {u.noHp && (
                          <p className="text-[10px] text-stone-500 truncate flex items-center gap-1">
                            <Phone className="w-3 h-3 text-stone-400 shrink-0" />
                            <span>{u.noHp}</span>
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0 space-y-1.5">
                        <div className="text-[11px] font-medium text-stone-500">
                          {isHadir ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-950 font-black text-[10px]">
                              ✓ HADIR ({terpakai}/{totalKuotaItem} Kursi)
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-stone-200 text-stone-700 font-semibold text-[10px]">
                              BELUM ({terpakai}/{totalKuotaItem} Kursi)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-1.5">
                          {!isHadir ? (
                            <button
                              type="button"
                              onClick={() => handleQuickCheckin(u)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                            >
                              Tandai Hadir
                            </button>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                                <Gift className="w-3 h-3 text-emerald-600" />
                                <span>Suvenir Siap</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleBatalkanHadir(u)}
                                className="px-2 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold shadow-2xs flex items-center space-x-1 transition-all cursor-pointer"
                                title="Batalkan Kehadiran (Undo)"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Batalkan Hadir</span>
                              </button>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => handleHapusTamu(u)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Tamu"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PANEL 8 POS JAGA */}
        {activeTab === 'POS_JAGA' && (
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#E8DFD5] shadow-sm space-y-4">
            <h3 className="font-serif font-black text-base text-[#422F21] border-b border-stone-100 pb-2">
              8 Pos Jaga Transit &amp; Registrasi Gerbang
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                <div className="font-bold text-amber-900 text-sm">Pos 1: Gerbang Utama VIP</div>
                <p className="text-amber-800 text-[11px]">Khusus Masyayikh &amp; Penguji Utama</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                <div className="font-bold text-emerald-900 text-sm">Pos 2: Transit Putri Barat</div>
                <p className="text-emerald-800 text-[11px]">Meja Registrasi Dzurriyah &amp; Nyai</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 space-y-1">
                <div className="font-bold text-blue-900 text-sm">Pos 3: Transit Putra Timur</div>
                <p className="text-blue-800 text-[11px]">Area Parkir Kiai &amp; Undangan Khusus</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 space-y-1">
                <div className="font-bold text-purple-900 text-sm">Pos 4: Meja Suvenir &amp; Berkat</div>
                <p className="text-purple-800 text-[11px]">Penyerahan Kitab &amp; Cendera Mata</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL TAMBAH TAMU BARU */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-[#E8DFD5] max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-serif font-black text-lg text-[#422F21]">
                  Tambah Tamu Undangan Baru
                </h3>
                <p className="text-xs text-[#7A624E]">
                  Data tersimpan langsung ke database Supabase Cloud
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTambahTamu} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#422F21] mb-1">Golongan Tamu Undangan:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ISTIMEWA', 'KEHORMATAN', 'UMUM'] as GolonganUndangan[]).map((gol) => (
                    <button
                      key={gol}
                      type="button"
                      onClick={() => handleOpenAddModal(gol)}
                      className={`py-2 px-1 rounded-xl font-bold border transition-all text-center text-[11px] ${
                        selectedGolonganUndangan === gol
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                          : 'bg-[#FAF7F3] text-[#422F21] border-[#D5C4B4] hover:bg-[#EFE8E1]'
                      }`}
                    >
                      {gol}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 bg-[#FAF7F3] p-3.5 rounded-2xl border border-[#D5C4B4]">
                <div>
                  <label className="block font-bold text-[#422F21] mb-1">
                    Nama Tamu Putra <span className="text-stone-500 font-normal">(Gus / Kyai / Ust.)</span>:
                  </label>
                  <input
                    type="text"
                    value={undanganForm.namaPutra}
                    onChange={(e) => setUndanganForm({ ...undanganForm, namaPutra: e.target.value })}
                    placeholder="Contoh: KH. ABDULLOH FAQIH / UST. AHMAD"
                    className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#422F21] mb-1">
                    Nama Tamu Putri <span className="text-stone-500 font-normal">(Ning / Nyai / Ustazah)</span>:
                  </label>
                  <input
                    type="text"
                    value={undanganForm.namaPutri}
                    onChange={(e) => setUndanganForm({ ...undanganForm, namaPutri: e.target.value })}
                    placeholder="Contoh: NYAI HJ. HINDAH / USTADZAH SITI"
                    className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
                <div className="text-[10px] text-emerald-800 bg-emerald-50/80 p-2 rounded-xl border border-emerald-200 font-medium">
                  💡 <strong>Aturan Kuota:</strong> Mengisi 2 nama (Putra &amp; Putri) = Otomatis 2 Kursi (1 L / 1 P). Mengisi 1 nama = 1 Kursi.
                </div>
              </div>

              {selectedGolonganUndangan !== 'KEHORMATAN' && (
                <div>
                  <label className="block font-bold text-[#422F21] mb-1">Kategori Undangan:</label>
                  <select
                    value={undanganKategoriDropdown}
                    onChange={(e) => setUndanganKategoriDropdown(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-[#FAF7F3] focus:bg-white text-xs"
                  >
                    {(selectedGolonganUndangan === 'ISTIMEWA' ? OPSI_UNDANGAN_ISTIMEWA : OPSI_UNDANGAN_UMUM).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {undanganKategoriDropdown === 'Lainnya (Ketik Sendiri...)' && (
                    <input
                      type="text"
                      value={customKategoriInput}
                      onChange={(e) => setCustomKategoriInput(e.target.value)}
                      placeholder="Ketik nama kategori khusus..."
                      className="w-full mt-2 px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs focus:ring-1 focus:ring-emerald-700"
                    />
                  )}
                </div>
              )}

              <div>
                <label className="block font-bold text-[#422F21] mb-1">Instansi / Alamat:</label>
                <input
                  type="text"
                  value={undanganForm.instansi}
                  onChange={(e) => setUndanganForm({ ...undanganForm, instansi: e.target.value, alamat: e.target.value })}
                  placeholder="Contoh: PP. Lirboyo Kota Kediri"
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-[#FAF7F3] focus:bg-white text-xs focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block font-bold text-[#422F21] mb-1">Nomor WhatsApp / HP (Opsional):</label>
                <input
                  type="text"
                  value={undanganForm.noHp}
                  onChange={(e) => setUndanganForm({ ...undanganForm, noHp: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-[#FAF7F3] focus:bg-white text-xs focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block font-bold text-[#422F21] mb-1">Masuk Melalui (Jalur Masuk):</label>
                <input
                  type="text"
                  value={undanganForm.jalurMasuk}
                  onChange={(e) => setUndanganForm({ ...undanganForm, jalurMasuk: e.target.value })}
                  placeholder="Contoh: Jalur VIP / Gerbang Selatan (Bola Dunia)"
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-[#FAF7F3] focus:bg-white text-xs focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold hover:bg-stone-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold shadow-md cursor-pointer"
                >
                  Simpan Tamu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TANYA US */}
      {isUsModalOpen && (
        <TanyaUsModal
          isOpen={isUsModalOpen}
          onClose={() => setIsUsModalOpen(false)}
          role="PENERIMA_TAMU"
        />
      )}
    </div>
  );
}
