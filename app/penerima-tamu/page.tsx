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
} from 'lucide-react';
import { store } from '@/lib/mock-data';
import { clearActiveRole } from '@/lib/auth-roles';
import TanyaUsModal from '@/components/TanyaUsModal';
import AuthGuard from '@/components/AuthGuard';

export default function PenerimaTamuPage() {
  const router = useRouter();
  const [undanganList, setUndanganList] = useState<any[]>(() => store.getUndanganList());
  const [stats, setStats] = useState(() => store.getStatistikLive());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSub, setSelectedSub] = useState<'SEMUA' | 'PENGUJI' | 'ASATIDZ_MASYAIKH' | 'LAINNYA'>('SEMUA');
  const [isUsModalOpen, setIsUsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ABSENSI' | 'POS_JAGA'>('ABSENSI');

  useEffect(() => {
    const refresh = () => {
      setUndanganList([...store.getUndanganList()]);
      setStats(store.getStatistikLive());
    };
    refresh();
    const interval = setInterval(refresh, 2500);
    return () => clearInterval(interval);
  }, []);

  const filteredUndangan = useMemo(() => {
    return undanganList.filter((u) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        u.nama.toLowerCase().includes(q) ||
        (u.instansi && u.instansi.toLowerCase().includes(q)) ||
        u.kode.toLowerCase().includes(q) ||
        u.kategori.toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (selectedSub === 'SEMUA') return true;
      if (selectedSub === 'PENGUJI') return u.subKategori === 'PENGUJI';
      if (selectedSub === 'ASATIDZ_MASYAIKH') return u.subKategori === 'ASATIDZ_MASYAIKH';
      return u.subKategori !== 'PENGUJI' && u.subKategori !== 'ASATIDZ_MASYAIKH';
    });
  }, [undanganList, searchQuery, selectedSub]);

  const handleQuickCheckin = (u: any) => {
    const sisa = u.kuota.kuotaDasar + u.kuota.kuotaTambahan - u.kuota.terpakai;
    if (sisa <= 0) {
      alert(`Kuota untuk ${u.nama} sudah terpakai seluruhnya.`);
      return;
    }
    const masuk = Math.min(2, sisa);
    const res = store.checkin(u.kuota.kodeQr, masuk, 0, 'BARAT', 0, 'penerima-tamu');
    if (res.ok) {
      setUndanganList([...store.getUndanganList()]);
      setStats(store.getStatistikLive());
    } else {
      alert(res.pesan || 'Gagal check-in tamu.');
    }
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
                Haul & Haflah P3TQ - MHMTQ 2027
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsUsModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 hover:brightness-105 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-200" />
              <span>Tanya Us AI (Penerima Tamu)</span>
            </button>
            <button
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
            <p className="text-[11px] text-stone-600">Penguji, Asatidz & Dzuriyyah</p>
          </div>

          <div className="p-4 rounded-3xl bg-emerald-50/70 border border-emerald-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
              Tamu Sudah Rawuh
            </span>
            <div className="text-2xl font-serif font-black text-emerald-900">
              {undanganList.filter((u) => u.kuota?.terpakai > 0).length} Hadir
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
            <div className="text-2xl font-serif font-black text-blue-900">
              06.30 WIB
            </div>
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
            8 Pos Jaga Putri & Putra
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
                  Daftar Absensi Tamu Kehormatan & VIP
                </h3>
                <p className="text-xs text-[#7A624E]">
                  Tandai kehadiran tamu langsung tanpa perlu antre di scanner kamera gerbang
                </p>
              </div>

              {/* Filter Sub-kategori */}
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {(['SEMUA', 'PENGUJI', 'ASATIDZ_MASYAIKH'] as const).map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setSelectedSub(sub)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                      selectedSub === sub
                        ? 'bg-emerald-800 text-white shadow-2xs'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {sub === 'SEMUA' ? 'Semua' : sub === 'PENGUJI' ? 'Penguji Al-Qur\'an' : 'Asatidz & Masyaikh'}
                  </button>
                ))}
              </div>
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
            {filteredUndangan.length === 0 ? (
              <div className="p-8 text-center text-stone-500 text-xs bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                {undanganList.length === 0 ? (
                  <div>
                    <p className="font-bold text-sm text-[#422F21]">Basis Data Tamu Sedang Kosong</p>
                    <p className="mt-1">
                      Silakan panitia menambahkan data tamu undangan manual melalui menu Admin Peserta.
                    </p>
                  </div>
                ) : (
                  'Tidak ada tamu undangan yang sesuai dengan kata kunci pencarian.'
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredUndangan.map((u) => {
                  const sisa = (u.kuota?.kuotaDasar || 2) + (u.kuota?.kuotaTambahan || 0) - (u.kuota?.terpakai || 0);
                  const isHadir = (u.kuota?.terpakai || 0) > 0;

                  return (
                    <div
                      key={u.id}
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
                      </div>

                      <div className="text-right shrink-0 space-y-1.5">
                        <div className="text-[11px] font-medium text-stone-500">
                          {isHadir ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-black text-[10px]">
                              ✓ HADIR ({u.kuota.terpakai} Kursi)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 font-semibold text-[10px]">
                              Sisa {sisa} Kursi
                            </span>
                          )}
                        </div>

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
                            <span>Suvenir & Berkat Siap</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAMPILAN 2: RINCIAN 8 POS JAGA PENERIMA TAMU (SESUAI KOORDINASI II) */}
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
                  <div className="text-[11px] text-emerald-800 font-medium">Personil: Aimmatul Mu'awwanah & Nala Sholihatunnisa'</div>
                  <p className="text-stone-600">Menyambut kedatangan tamu, memeriksa kartu masuk/stiker, mengarahkan ke Pos 2.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1">
                  <div className="font-bold text-[#422F21]">Pos 2: Pojok Terop Santri</div>
                  <div className="text-[11px] text-emerald-800 font-medium">Personil: Rifqa Annisa Nawang Wulan & Zidni Zein Azkiyah</div>
                  <p className="text-stone-600">Mengarahkan tamu ke tempat prasmanan Pos 3.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1">
                  <div className="font-bold text-[#422F21]">Pos 3: Prasmanan Putri</div>
                  <div className="text-[11px] text-emerald-800 font-medium">Personil: Safira Auliyatul Faizah & Afifah Nur Hafidzoh</div>
                  <p className="text-stone-600">Menyambut dan mempersilahkan tamu undangan ke tempat hidangan prasmanan.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1">
                  <div className="font-bold text-[#422F21]">Pos 4: Samping Panggung Utama</div>
                  <div className="text-[11px] text-emerald-800 font-medium">Personil: Hj. Noer Izza Farhana, Lafifatuz Zahro', Nailatun Nafisah</div>
                  <p className="text-stone-600">Menyambut dan mempersilahkan tamu Dzuriyyah ke tempat kehormatan panggung.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1">
                  <div className="font-bold text-[#422F21]">Pos 5: Depan Tamu Undangan Umum</div>
                  <div className="text-[11px] text-emerald-800 font-medium">Personil: Nuzulul Hasanah & Nurus Sa'idah</div>
                  <p className="text-stone-600">Memeriksa kartu masuk/stiker dan mempersilahkan tamu ke tempat duduk.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1">
                  <div className="font-bold text-[#422F21]">Pos 6: Barisan Belakang Wali Santri Pi Kiri</div>
                  <div className="text-[11px] text-emerald-800 font-medium">Personil: Ghina Sa'idah & Khusnul Khotimah</div>
                  <p className="text-stone-600">Mempersilahkan tamu undangan ke tempat duduk yang telah ditentukan.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1">
                  <div className="font-bold text-[#422F21]">Pos 7: Drop Point Dzuriyyah</div>
                  <div className="text-[11px] text-emerald-800 font-medium">Personil: Hanifatun Nasihah & Ilma Rofi'atul Walidah</div>
                  <p className="text-stone-600">Menyambut Dzuriyyah ke prasmanan, mengisi daftar hadir, dan nderekaken rawuh.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1">
                  <div className="font-bold text-[#422F21]">Pos 8: Sekitar Area Lobi</div>
                  <div className="text-[11px] text-emerald-800 font-medium">Personil: Hanik Najwa & Nurul Walidaini Ihsana</div>
                  <p className="text-stone-600">Menyambut Dzuriyyah yang turun di lobi dan nderekaken sampai Pos 7.</p>
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
                  <p className="text-stone-600">Menyambut kedatangan tamu, memeriksa kartu masuk, mengarahkan ke Pos 2.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1">
                  <div className="font-bold text-[#422F21]">Pos 2: Gerbang Bola Dunia Barat</div>
                  <div className="text-[11px] text-blue-800 font-medium">Personil: Bapak Akfi Romiyan Kafabih & Bapak Achmad Abdulloh Faqih</div>
                  <p className="text-stone-600">Mengarahkan tamu putra ke Pos 3.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1">
                  <div className="font-bold text-[#422F21]">Pos 3: Gerbang Utara</div>
                  <div className="text-[11px] text-blue-800 font-medium">Personil: 2 Orang Tenaga Bantu Putra</div>
                  <p className="text-stone-600">Mengarahkan tamu putra menuju area prasmanan putra.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1">
                  <div className="font-bold text-[#422F21]">Pos 4: Depan Prasmanan Tamu Putra</div>
                  <div className="text-[11px] text-blue-800 font-medium">Personil: Bapak Affan Istikhori</div>
                  <p className="text-stone-600">Mempersilahkan tamu undangan ke hidangan prasmanan.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1">
                  <div className="font-bold text-[#422F21]">Pos 5: Timur Prasmanan Putra</div>
                  <div className="text-[11px] text-blue-800 font-medium">Personil: Bapak Badru Ro'in Amin</div>
                  <p className="text-stone-600">Mengarahkan tamu ke tempat duduk aula putra.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1">
                  <div className="font-bold text-[#422F21]">Pos 6: Samping Wali Santri Kiri</div>
                  <div className="text-[11px] text-blue-800 font-medium">Personil: Bapak Subadar, Bapak Misbahul Huda, Bapak Alex Alqomah</div>
                  <p className="text-stone-600">Mempersilahkan tamu undangan ke tempat duduk.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1">
                  <div className="font-bold text-[#422F21]">Pos 7: Drop Point Dzuriyyah Putra</div>
                  <div className="text-[11px] text-blue-800 font-medium">Personil: Bapak M. Izzuddin Assakhi, Bapak M. Najih, Bapak M. Yazid Mahbubillah</div>
                  <p className="text-stone-600">Menyambut Dzuriyyah, mengisi daftar hadir Dzuriyyah, dan nderekaken rawuh.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1">
                  <div className="font-bold text-[#422F21]">Pos 8: Sekitar Area Lobi</div>
                  <div className="text-[11px] text-blue-800 font-medium">Personil: Bapak Imam Ghozali, Bapak Afif Cholilul Umam, Bapak M. Sabiqul Anam</div>
                  <p className="text-stone-600">Menyambut Dzuriyyah yang turun di area Lobi dan nderekaken sampai ke Pos 7.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

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
