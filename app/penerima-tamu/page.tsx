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

export default function PenerimaTamuPage() {
  const router = useRouter();
  const [undanganList, setUndanganList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUsModalOpen, setIsUsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ABSENSI' | 'POS_JAGA'>('ABSENSI');

  // Modal Tambah Tamu Baru
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    nama: '',
    kategori: 'VIP IDS',
    golongan: 'ISTIMEWA' as 'ISTIMEWA' | 'KEHORMATAN' | 'UMUM',
    instansi: '',
    alamat: '',
    noHp: '',
    kuotaDasar: 2,
  });

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
        .update({ terpakai: newTerpakai })
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

  // Handler Tambah Tamu Baru (VIP IDS / Tamu Umum)
  const handleTambahTamu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      alert('Nama tamu undangan wajib diisi!');
      return;
    }

    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const newKode = `UND-${randomNum}`;
    const kuotaVal = Number(formData.kuotaDasar) || 2;

    try {
      const { error } = await supabase.from('tamu_undangan').insert([
        {
          kode: newKode,
          nama: formData.nama.trim().toUpperCase(),
          instansi: formData.instansi.trim().toUpperCase() || '-',
          alamat: formData.alamat.trim().toUpperCase() || formData.instansi.trim().toUpperCase() || 'KEDIRI',
          kategori: formData.kategori || 'VIP IDS',
          sub_kategori: formData.golongan || 'ISTIMEWA',
          no_hp: formData.noHp.trim() || '-',
          kuota_dasar: kuotaVal,
          kuota_terpakai: 0,
          warna_tiket: getWarnaTiketUndangan(formData.golongan, formData.kategori),
        },
      ]);
      if (error) {
        console.error('Supabase insert tamu_undangan error:', error);
        alert(`Gagal menyimpan data tamu ke Supabase: ${error.message}`);
        return;
      }
    } catch (err: any) {
      console.warn('Supabase direct insert exception:', err);
      alert(`Terjadi kesalahan saat menyimpan: ${err.message || err}`);
      return;
    }

    // Sync to store
    store.tambahUndangan({
      nama: formData.nama.trim().toUpperCase(),
      kategori: formData.kategori,
      instansi: formData.instansi.trim().toUpperCase(),
      alamat: formData.alamat.trim().toUpperCase(),
      kuotaDasar: kuotaVal,
      golongan: formData.golongan,
    });

    await fetchTamuData();
    setShowAddModal(false);
    setFormData({
      nama: '',
      kategori: 'VIP IDS',
      golongan: 'ISTIMEWA',
      instansi: '',
      alamat: '',
      noHp: '',
      kuotaDasar: 2,
    });
  };

  const handleLogout = () => {
    clearActiveRole();
    router.push('/');
  };

  return (
    <AuthGuard allowedRoles={['PENERIMA_TAMU', 'ADMIN']}>
      <div className="min-h-screen bg-[#FDFBF7] text-[#422F21] pb-24">
        {/* HEADER */}
        <header className="border-b border-[#E8DFD5] bg-[#FAF7F3]/90 backdrop-blur-md sticky top-0 z-20 px-4 py-3 sm:py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 border-2 border-emerald-600 flex items-center justify-center font-bold shadow-xs">
                <Users className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <div className="text-[10px] font-serif font-black tracking-widest text-emerald-800 uppercase">
                  POS PENERIMA TAMU · MEJA TRANSIT
                </div>
                <h1 className="font-serif font-black text-sm sm:text-base text-[#422F21]">
                  Haul &amp; Haflah P3TQ - MHMTQ 2027
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs flex items-center space-x-1 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Tamu</span>
              </button>
              <button
                type="button"
                onClick={() => setIsUsModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 hover:brightness-105 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-emerald-200" />
                <span>Tanya Us</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 text-xs font-bold shadow-2xs flex items-center space-x-1.5 transition-all cursor-pointer"
                title="Keluar / Ganti Peran"
              >
                <LogOut className="w-3.5 h-3.5 text-stone-500" />
                <span className="hidden sm:inline">Ganti Peran</span>
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

        {/* MODAL TAMBAH TAMU BARU (VIP IDS / TAMU UMUM) */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#E8DFD5] shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="font-serif font-black text-lg text-[#422F21]">
                  Tambah Tamu Undangan (Live Supabase)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleTambahTamu} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Nama Tamu Undangan *</label>
                  <input
                    type="text"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Contoh: KH. Abdullah Faqih / VIP IDS..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-700 text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Kategori Undangan</label>
                    <input
                      type="text"
                      value={formData.kategori}
                      onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                      placeholder="VIP IDS / Penguji / Tamu Umum"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-700 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Golongan</label>
                    <select
                      value={formData.golongan}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          golongan: e.target.value as 'ISTIMEWA' | 'KEHORMATAN' | 'UMUM',
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-700 text-xs"
                    >
                      <option value="ISTIMEWA">Istimewa (VVIP / VIP IDS)</option>
                      <option value="KEHORMATAN">Kehormatan (Masyayikh)</option>
                      <option value="UMUM">Umum</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Nomor WhatsApp (Opsional)</label>
                  <input
                    type="text"
                    value={formData.noHp}
                    onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                    placeholder="08123456789"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-700 text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Instansi / Kota (Opsional)</label>
                    <input
                      type="text"
                      value={formData.instansi}
                      onChange={(e) => setFormData({ ...formData, instansi: e.target.value })}
                      placeholder="Kediri / Lirboyo"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-700 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Kuota Kursi (Opsional)</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.kuotaDasar}
                      onChange={(e) => setFormData({ ...formData, kuotaDasar: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-700 text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 font-bold transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-800 text-white hover:bg-emerald-900 font-bold shadow-xs transition-all"
                  >
                    Simpan ke Supabase
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
