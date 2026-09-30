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
} from 'lucide-react';
import { store } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';
import { clearActiveRole } from '@/lib/auth-roles';
import { getWarnaTiketUndangan } from '@/lib/types';
import TanyaUsModal from '@/components/TanyaUsModal';
import AuthGuard from '@/components/AuthGuard';

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
  'Penguji Al-Qur\'an',
  'Perwakilan Pondok',
  'Lainnya (Ketik Sendiri...)',
];

export default function PenerimaTamuPage() {
  const router = useRouter();
  const [undanganList, setUndanganList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUsModalOpen, setIsUsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ABSENSI' | 'POS_JAGA'>('ABSENSI');

  // Modal Tambah Tamu Baru (Identik dengan Admin)
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
    });
    setCustomKategoriInput('');
    setShowAddModal(true);
  };

  const fetchTamuData = async () => {
    try {
      // 1. Fetch live directly from Supabase 'tamu_undangan'
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
            kuotaDasar: d.kuota_dasar || 2,
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

  // Handler quick checkin
  const handleQuickCheckin = async (u: any) => {
    const terpakaiSekarang = u.kuota?.terpakai || 0;
    const kuotaDasar = u.kuota?.kuotaDasar || 2;
    const sisa = kuotaDasar - terpakaiSekarang;
    if (sisa <= 0) {
      alert(`Kuota untuk ${u.nama} sudah terpakai seluruhnya.`);
      return;
    }
    const masuk = 1;
    const newTerpakai = terpakaiSekarang + masuk;

    try {
      // Direct Supabase update tamu_undangan
      const { error: errUpdate } = await supabase
        .from('tamu_undangan')
        .update({ kuota_terpakai: newTerpakai })
        .eq('kode', u.kode);

      if (errUpdate) {
        console.warn('Supabase checkin update error:', errUpdate);
      }

      // Direct Supabase insert presensi_log
      await supabase.from('presensi_log').insert([
        {
          kuota_id: u.kode,
          hasil: 'SUKSES',
          jumlah_l: 1,
          jumlah_p: 0,
          jumlah_balita: 0,
          jalur: 'MEJA_TRANSIT',
          panitia_id: 'penerima-tamu',
          catatan: `Check-in Meja Transit: ${u.nama}`,
          server_time: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      console.warn('Supabase presensi_log error:', e);
    }

    // Update store state
    store.checkin(u.kode, masuk, 0, 'BARAT', 0, 'penerima-tamu');
    await fetchTamuData();
  };

  // Handler Hapus Tamu
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

  // Handler Tambah Tamu Baru (Identik 100% dengan Admin)
  const handleTambahTamu = async (e: React.FormEvent) => {
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
      finalAlamat = (undanganForm.alamat || undanganForm.instansi || '').trim();
      finalInstansi = finalAlamat;
    } else {
      finalInstansi = (undanganForm.instansi || '').trim();
      finalAlamat = (undanganForm.alamat || '').trim();
    }

    const kuotaBase = Number(undanganForm.kuotaDasar) || (selectedGolonganUndangan === 'KEHORMATAN' ? 4 : 2);
    const newKode = `UND-${Math.floor(10000 + Math.random() * 90000)}`;

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
          kuota_dasar: kuotaBase,
          kuota_tambahan: 0,
          kuota_terpakai: 0,
          warna_tiket: getWarnaTiketUndangan(selectedGolonganUndangan, finalKategori),
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

    // Sync store
    store.tambahUndangan({
      nama: finalNama,
      namaPutra: p,
      namaPutri: w,
      kategori: finalKategori,
      instansi: finalInstansi,
      alamat: finalAlamat,
      kuotaDasar: kuotaBase,
      golongan: selectedGolonganUndangan,
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
      kuotaDasar: 2,
    });
    setUndanganKategoriDropdown(OPSI_UNDANGAN_ISTIMEWA[0]);
    setCustomKategoriInput('');
  };

  const handleLogout = () => {
    clearActiveRole();
    router.push('/');
  };

  return (
    <AuthGuard allowedRoles={['PENERIMA_TAMU', 'ADMIN']}>
      <div className="min-h-screen bg-[#FDFBF7] text-[#422F21] pb-24">
        {/* HEADER RESPONSIF (MOBILE STACKED, DESKTOP INLINE) */}
        <header className="border-b border-[#E8DFD5] bg-[#FAF7F3]/95 backdrop-blur-md sticky top-0 z-20 px-3.5 sm:px-6 py-3 sm:py-4">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* BARIS PERTAMA (MOBILE): LOGO & JUDUL POS PENERIMA TAMU */}
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

            {/* BARIS KEDUA (MOBILE) / KANAN (DESKTOP): TOMBOL AKSI */}
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
                <span>Tanya Us</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-2 sm:py-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 text-xs font-bold shadow-2xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap"
                title="Keluar / Ganti Peran"
              >
                <LogOut className="w-3.5 h-3.5 text-stone-500" />
                <span className="inline">Keluar</span>
              </button>
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
                {undanganList.length} Tamu
              </div>
              <p className="text-[11px] text-stone-600">VIP IDS, Penguji &amp; Asatidz</p>
            </div>

            <div className="p-4 rounded-3xl bg-emerald-50/70 border border-emerald-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
                Tamu Sudah Rawuh
              </span>
              <div className="text-2xl font-serif font-black text-emerald-900">
                {undanganList.filter((u) => (u.kuota?.terpakai || 0) > 0).length} Hadir
              </div>
              <p className="text-[11px] text-emerald-700">Telah hadir di meja transit / aula</p>
            </div>

            <div className="p-4 rounded-3xl bg-amber-50/70 border border-amber-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">
                Belum Hadir
              </span>
              <div className="text-2xl font-serif font-black text-amber-900">
                {undanganList.filter((u) => !u.kuota || u.kuota.terpakai === 0).length} Belum
              </div>
              <p className="text-[11px] text-amber-700">Dalam perjalanan / konfirmasi</p>
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

          {/* ========================================================================= */}
          {/* TAMPILAN 1: PANEL ABSENSI CEPAT TAMU UNDANGAN */}
          {/* ========================================================================= */}
          {activeTab === 'ABSENSI' && (
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#E8DFD5] shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                <div>
                  <h3 className="font-serif font-black text-lg text-[#422F21]">
                    Daftar Absensi Tamu Kehormatan &amp; VIP IDS
                  </h3>
                  <p className="text-xs text-[#7A624E]">
                    Tandai kehadiran tamu secara live tersambung ke database Supabase
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

              {/* Input Pencarian */}
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

              {/* List Tamu */}
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
                    const sisa = Math.max(0, kuotaDasar - terpakai);
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
                              <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-black text-[10px]">
                                ✓ HADIR ({terpakai} Kursi)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 font-semibold text-[10px]">
                                Sisa {sisa} Kursi
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
                              <div className="text-[10px] text-emerald-700 font-semibold flex items-center justify-end gap-1">
                                <Gift className="w-3 h-3 text-emerald-600" />
                                <span>Suvenir Siap</span>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => handleHapusTamu(u)}
                              className="p-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors"
                              title="Hapus Baris Tamu"
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

          {/* ========================================================================= */}
          {/* TAMPILAN 2: RINCIAN 8 POS JAGA PENERIMA TAMU */}
          {/* ========================================================================= */}
          {activeTab === 'POS_JAGA' && (
            <div className="space-y-6">
              {/* 8 POS PUTRI */}
              <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#E8DFD5] shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div>
                    <h3 className="font-serif font-black text-base sm:text-lg text-[#422F21]">
                      Pos Jaga Penerima Tamu Putri (8 Pos Hari Acara)
                    </h3>
                    <p className="text-xs text-[#7A624E]">
                      Kasi: Hanifatun Nasihah* · Wakasi: Safira Auliyatul Faizah**
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-pink-100 text-pink-800 border border-pink-200">
                    Putri
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1">
                    <div className="font-bold text-[#422F21]">Pos 1: Luar Gerbang Bola Dunia</div>
                    <div className="text-[11px] text-emerald-800 font-medium">
                      Personil: Aimmatul Mu'awwanah &amp; Nala Sholihatunnisa'
                    </div>
                    <p className="text-stone-600">
                      Menyambut kedatangan tamu, memeriksa kartu masuk/stiker, mengarahkan ke Pos 2.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1">
                    <div className="font-bold text-[#422F21]">Pos 2: Pojok Terop Santri</div>
                    <div className="text-[11px] text-emerald-800 font-medium">
                      Personil: Rifqa Annisa Nawang Wulan &amp; Zidni Zein Azkiyah
                    </div>
                    <p className="text-stone-600">Mengarahkan tamu ke tempat prasmanan Pos 3.</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1">
                    <div className="font-bold text-[#422F21]">Pos 3: Prasmanan Putri</div>
                    <div className="text-[11px] text-emerald-800 font-medium">
                      Personil: Safira Auliyatul Faizah &amp; Afifah Nur Hafidzoh
                    </div>
                    <p className="text-stone-600">
                      Menyambut dan mempersilahkan tamu undangan ke tempat hidangan prasmanan.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1">
                    <div className="font-bold text-[#422F21]">Pos 4: Samping Panggung Utama</div>
                    <div className="text-[11px] text-emerald-800 font-medium">
                      Personil: Hj. Noer Izza Farhana, Lafifatuz Zahro', Nailatun Nafisah
                    </div>
                    <p className="text-stone-600">
                      Menyambut dan mempersilahkan tamu Dzuriyyah ke tempat kehormatan panggung.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1">
                    <div className="font-bold text-[#422F21]">Pos 5: Depan Tamu Undangan Umum</div>
                    <div className="text-[11px] text-emerald-800 font-medium">
                      Personil: Nuzulul Hasanah &amp; Nurus Sa'idah
                    </div>
                    <p className="text-stone-600">
                      Memeriksa kartu masuk/stiker dan mempersilahkan tamu ke tempat duduk.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1">
                    <div className="font-bold text-[#422F21]">
                      Pos 6: Barisan Belakang Wali Santri Pi Kiri
                    </div>
                    <div className="text-[11px] text-emerald-800 font-medium">
                      Personil: Ghina Sa'idah &amp; Khusnul Khotimah
                    </div>
                    <p className="text-stone-600">
                      Mempersilahkan tamu undangan ke tempat duduk yang telah ditentukan.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1">
                    <div className="font-bold text-[#422F21]">Pos 7: Drop Point Dzuriyyah</div>
                    <div className="text-[11px] text-emerald-800 font-medium">
                      Personil: Hanifatun Nasihah &amp; Ilma Rofi'atul Walidah
                    </div>
                    <p className="text-stone-600">
                      Menyambut Dzuriyyah ke prasmanan, mengisi daftar hadir, dan nderekaken rawuh.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1">
                    <div className="font-bold text-[#422F21]">Pos 8: Sekitar Area Lobi</div>
                    <div className="text-[11px] text-emerald-800 font-medium">
                      Personil: Hanik Najwa &amp; Nurul Walidaini Ihsana
                    </div>
                    <p className="text-stone-600">
                      Menyambut Dzuriyyah yang turun di lobi dan nderekaken sampai Pos 7.
                    </p>
                  </div>
                </div>
              </div>

              {/* 8 POS PUTRA */}
              <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#E8DFD5] shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div>
                    <h3 className="font-serif font-black text-base sm:text-lg text-[#422F21]">
                      Pos Jaga Penerima Tamu Putra (8 Pos Hari Acara)
                    </h3>
                    <p className="text-xs text-[#7A624E]">
                      Koordinator: Bapak M. Badru Ro'in Amin* · Wakoordinator: Bapak Imam Ghozali**
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    Putra
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1">
                    <div className="font-bold text-[#422F21]">Pos 1: Luar Gerbang Bola Dunia</div>
                    <div className="text-[11px] text-blue-800 font-medium">Personil: 2 Orang Petugas</div>
                    <p className="text-stone-600">
                      Menyambut kedatangan tamu, memeriksa kartu masuk, mengarahkan ke Pos 2.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1">
                    <div className="font-bold text-[#422F21]">Pos 2: Gerbang Bola Dunia Barat</div>
                    <div className="text-[11px] text-blue-800 font-medium">
                      Personil: Bapak Akfi Romiyan Kafabih &amp; Bapak Achmad Abdulloh Faqih
                    </div>
                    <p className="text-stone-600">Mengarahkan tamu putra ke Pos 3.</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1">
                    <div className="font-bold text-[#422F21]">Pos 3: Gerbang Utara</div>
                    <div className="text-[11px] text-blue-800 font-medium">
                      Personil: 2 Orang Tenaga Bantu Putra
                    </div>
                    <p className="text-stone-600">Mengarahkan tamu putra menuju area prasmanan putra.</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1">
                    <div className="font-bold text-[#422F21]">Pos 4: Depan Prasmanan Tamu Putra</div>
                    <div className="text-[11px] text-blue-800 font-medium">
                      Personil: Bapak Affan Istikhori
                    </div>
                    <p className="text-stone-600">Mempersilahkan tamu undangan ke hidangan prasmanan.</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1">
                    <div className="font-bold text-[#422F21]">Pos 5: Timur Prasmanan Putra</div>
                    <div className="text-[11px] text-blue-800 font-medium">
                      Personil: Bapak Badru Ro'in Amin
                    </div>
                    <p className="text-stone-600">Mengarahkan tamu ke tempat duduk aula putra.</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1">
                    <div className="font-bold text-[#422F21]">Pos 6: Samping Wali Santri Kiri</div>
                    <div className="text-[11px] text-blue-800 font-medium">
                      Personil: Bapak Subadar, Bapak Misbahul Huda, Bapak Alex Alqomah
                    </div>
                    <p className="text-stone-600">Mempersilahkan tamu undangan ke tempat duduk.</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1">
                    <div className="font-bold text-[#422F21]">Pos 7: Drop Point Dzuriyyah Putra</div>
                    <div className="text-[11px] text-blue-800 font-medium">
                      Personil: Bapak M. Izzuddin Assakhi, Bapak M. Najih, Bapak M. Yazid Mahbubillah
                    </div>
                    <p className="text-stone-600">
                      Menyambut Dzuriyyah, mengisi daftar hadir Dzuriyyah, dan nderekaken rawuh.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1">
                    <div className="font-bold text-[#422F21]">Pos 8: Sekitar Area Lobi</div>
                    <div className="text-[11px] text-blue-800 font-medium">
                      Personil: Bapak Imam Ghozali, Bapak Afif Cholilul Umam, Bapak M. Sabiqul Anam
                    </div>
                    <p className="text-stone-600">
                      Menyambut Dzuriyyah yang turun di area Lobi dan nderekaken sampai ke Pos 7.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* MODAL TAMBAH TAMU BARU (IDENTIK WITH ADMIN PESERTA) */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full max-h-[92dvh] flex flex-col shadow-2xl border-2 border-emerald-800 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-950 to-emerald-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-amber-500/40 shrink-0">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-serif font-black text-sm sm:text-base text-amber-300 truncate">
                      Tambah Tamu {selectedGolonganUndangan === 'ISTIMEWA' ? 'Istimewa' : selectedGolonganUndangan === 'KEHORMATAN' ? 'Kehormatan' : 'Umum'}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-emerald-200 truncate">
                      {selectedGolonganUndangan === 'ISTIMEWA'
                        ? 'VVIP & Dzurriyyah / Keluarga Mahrus / Kunir / Bandar'
                        : selectedGolonganUndangan === 'KEHORMATAN'
                        ? 'Masyayikh, Habaib, Pejabat & Ulama Sepuh'
                        : 'Asatidz MHMTQ, Mustahiq, Pengajar Unit & Penguji'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-emerald-200 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleTambahTamu} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
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
                          instansi: '',
                          alamat: '',
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
                          instansi: '',
                          alamat: '',
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
                          instansi: '',
                          alamat: '',
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
                          placeholder=""
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
                          placeholder=""
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
                      placeholder=""
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 uppercase font-semibold"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white font-medium text-slate-800"
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
                        <label className="block text-[11px] font-bold text-emerald-900">
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
                          placeholder=""
                          className="w-full px-3.5 py-2.5 rounded-xl border-2 border-emerald-500 bg-emerald-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-medium placeholder:text-slate-400"
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
                      placeholder=""
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-medium"
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
                      placeholder=""
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-medium"
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
                        placeholder=""
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-medium"
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
                        placeholder=""
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-medium"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Alamat domisili atau tempat tinggal</p>
                    </div>
                  </>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
                  <input
                    type="text"
                    value={undanganForm.noHp}
                    onChange={(e) =>
                      setUndanganForm({ ...undanganForm, noHp: e.target.value })
                    }
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono"
                  />
                </div>

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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono font-bold"
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
                    className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-serif font-black shadow border border-emerald-600"
                  >
                    Simpan Undangan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL USTADZAH AI (MODE PENERIMA TAMU) */}
        {isUsModalOpen && (
          <TanyaUsModal
            isOpen={isUsModalOpen}
            onClose={() => setIsUsModalOpen(false)}
            role="PENERIMA_TAMU"
          />
        )}
      </div>
    </AuthGuard>
  );
}
