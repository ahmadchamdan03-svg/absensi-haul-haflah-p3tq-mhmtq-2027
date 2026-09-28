'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  HelpCircle,
  LogOut,
  MapPin,
  TrendingUp,
  Award,
  BookOpen,
} from 'lucide-react';
import { store } from '@/lib/mock-data';
import { clearActiveRole } from '@/lib/auth-roles';
import TanyaUsModal from '@/components/TanyaUsModal';
import AuthGuard from '@/components/AuthGuard';

export default function PimpinanPage() {
  const router = useRouter();
  const [stats, setStats] = useState(() => store.getStatistikLive());
  const [keluargaList, setKeluargaList] = useState<any[]>(() => store.getKeluargaList());
  const [undanganList, setUndanganList] = useState<any[]>(() => store.getUndanganList());
  const [isUsModalOpen, setIsUsModalOpen] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setStats(store.getStatistikLive());
      setKeluargaList([...store.getKeluargaList()]);
      setUndanganList([...store.getUndanganList()]);
    };
    refresh();
    const interval = setInterval(refresh, 2500);
    return () => clearInterval(interval);
  }, []);

  const totalSantri = keluargaList.length;
  const totalTamu = undanganList.length;

  // Hitung jumlah hadir
  let totalHadirSantri = 0;
  keluargaList.forEach((k) => {
    totalHadirSantri += k.kuota?.terpakai || 0;
  });

  let totalHadirTamu = 0;
  undanganList.forEach((u) => {
    totalHadirTamu += u.kuota?.terpakai || 0;
  });

  const grandTotalHadir = totalHadirSantri + totalHadirTamu;
  const targetKursi = 1534; // Sesuai Materi Koordinasi II
  const okupansiPersen = Math.min(100, Math.round((grandTotalHadir / targetKursi) * 100));

  const handleLogout = () => {
    clearActiveRole();
    router.push('/');
  };

  return (
    <AuthGuard allowedRoles={['PIMPINAN', 'ADMIN']}>
    <div className="min-h-screen bg-[#FDFBF7] text-[#422F21] pb-24">
      {/* HEADER EKSEKUTIF */}
      <header className="border-b border-[#E8DFD5] bg-[#FAF7F3]/90 backdrop-blur-md sticky top-0 z-20 px-4 py-3 sm:py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 border-2 border-amber-600 flex items-center justify-center font-bold shadow-xs">
              <LayoutDashboard className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="text-[10px] font-serif font-black tracking-widest text-amber-800 uppercase">
                EXECUTIVE LIVE DASHBOARD · PIMPINAN
              </div>
              <h1 className="font-serif font-black text-sm sm:text-base text-[#422F21]">
                Haul & Haflah P3TQ - MHMTQ 2027
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsUsModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 hover:brightness-105 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-200" />
              <span>Tanya Us AI (Laporan Pimpinan)</span>
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
        {/* PROGRESS OKUPANSI AULA AL-MUKTAMAR */}
        <div className="bg-gradient-to-br from-[#422F21] to-[#24170E] rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-4 border border-[#8C6A47]/40 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-serif font-bold uppercase tracking-wider text-[#F5C26B]">
                  Live Okupansi Kursi Aula Al-Muktamar
                </span>
              </div>
              <h2 className="text-xl sm:text-3xl font-serif font-black text-white mt-1">
                {grandTotalHadir} Hadir / {targetKursi} Kapasitas Kursi
              </h2>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-3xl sm:text-4xl font-serif font-black text-[#F5C26B]">
                {okupansiPersen}%
              </span>
              <p className="text-xs text-stone-300">Tingkat Keterisian Aula</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 rounded-full bg-black/40 overflow-hidden p-0.5 border border-white/10 relative z-10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-emerald-400 to-[#F5C26B] transition-all duration-500"
              style={{ width: `${okupansiPersen}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-stone-300 pt-1 border-t border-white/10 relative z-10">
            <span>Sohibul Hajat Hadir: <strong>{totalHadirSantri} Jamaah</strong></span>
            <span>Tamu Undangan Hadir: <strong>{totalHadirTamu} Tamu</strong></span>
            <span>Sisa Kursi Kosong: <strong>{Math.max(0, targetKursi - grandTotalHadir)} Kursi</strong></span>
          </div>
        </div>

        {/* METRIK REAL-TIME */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-3xl bg-white border border-[#E8DFD5] shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">
              Total Santriwati
            </span>
            <div className="text-2xl font-serif font-black text-[#422F21]">
              {totalSantri}
            </div>
            <p className="text-[11px] text-stone-600">
              {totalSantri === 0 ? 'Menunggu input manual panitia' : 'Terdaftar dalam sistem'}
            </p>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-[#E8DFD5] shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">
              Total Tamu Undangan
            </span>
            <div className="text-2xl font-serif font-black text-[#422F21]">
              {totalTamu}
            </div>
            <p className="text-[11px] text-stone-600">
              {totalTamu === 0 ? 'Menunggu input manual panitia' : 'Penguji, Asatidz & Dzuriyyah'}
            </p>
          </div>

          <div className="p-4 rounded-3xl bg-emerald-50/70 border border-emerald-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
              Wali Laki-Laki Hadir
            </span>
            <div className="text-2xl font-serif font-black text-emerald-900">
              {stats.totalLaki || 0}
            </div>
            <p className="text-[11px] text-emerald-700">Zona Aula Laki-laki</p>
          </div>

          <div className="p-4 rounded-3xl bg-pink-50/70 border border-pink-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-pink-800 uppercase tracking-wide">
              Wali Perempuan Hadir
            </span>
            <div className="text-2xl font-serif font-black text-pink-900">
              {stats.totalPerempuan || 0}
            </div>
            <p className="text-[11px] text-pink-700">Zona Aula Perempuan</p>
          </div>
        </div>

        {/* STATUS OPERASIONAL ACARA */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#E8DFD5] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="font-serif font-black text-base sm:text-lg text-[#422F21]">
                Informasi & Jadwal Pelaksanaan Haflah
              </h3>
              <p className="text-xs text-[#7A624E]">
                Pelaksanaan resmi Sabtu, 24 Rajab 1448 H. / 02 Januari 2027 M.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
              Sistem Siap Operasi
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1.5">
              <div className="font-bold text-[#422F21] flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-[#8C6A47]" />
                <span>Registrasi & Pintu Gerbang</span>
              </div>
              <p className="text-stone-600 leading-relaxed">
                Pintu gerbang registrasi dibuka pukul <strong>06.30 WIB / 07.00 WIs</strong>. Pos Kesekretariatan Putra berada di sebelah barat dan Putri di sebelah timur gerbang bola dunia.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1.5">
              <div className="font-bold text-[#422F21] flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#8C6A47]" />
                <span>Ketentuan Sambangan Santri</span>
              </div>
              <p className="text-stone-600 leading-relaxed">
                Sambangan dibuka setelah acara selesai s.d. pukul <strong>18.00 WIs</strong>. Halaman Al-Khodijah untuk Bil Ghoibi & Bin Nadzori, Rusunawa Baru untuk Tamatan Aliyah.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1.5">
              <div className="font-bold text-[#422F21] flex items-center space-x-1.5">
                <Award className="w-3.5 h-3.5 text-[#8C6A47]" />
                <span>Standar Warna Kartu Masuk</span>
              </div>
              <p className="text-stone-600 leading-relaxed">
                Walisantri maju panggung (Bil Ghoib): <strong>Hitam Gold</strong>. Walisantri reguler & Tamu Undangan Umum: <strong>Merah Gold</strong>.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL USTADZAH AI (MODE PIMPINAN) */}
      {isUsModalOpen && (
        <TanyaUsModal
          isOpen={isUsModalOpen}
          onClose={() => setIsUsModalOpen(false)}
          role="PIMPINAN"
        />
      )}
    </div>
    </AuthGuard>
  );
}
