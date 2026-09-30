'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CheckCircle2,
  Clock,
  HelpCircle,
  LogOut,
  MapPin,
  Award,
  Search,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { clearActiveRole } from '@/lib/auth-roles';
import TanyaUsModal from '@/components/TanyaUsModal';
import AuthGuard from '@/components/AuthGuard';

export default function PimpinanPage() {
  const router = useRouter();
  const [keluargaList, setKeluargaList] = useState<any[]>([]);
  const [undanganList, setUndanganList] = useState<any[]>([]);
  const [isUsModalOpen, setIsUsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Live Supabase view metrics state
  const [supaMetrics, setSupaMetrics] = useState<{
    totalSantri: number;
    wsHadir: number;
    wsKuota: number;
    totalTamu: number;
    tamuHadir: number;
    tamuKuota: number;
  }>({
    totalSantri: 0,
    wsHadir: 0,
    wsKuota: 0,
    totalTamu: 0,
    tamuHadir: 0,
    tamuKuota: 0,
  });

  const fetchDasborPimpinan = async () => {
    try {
      // 1. Fetch live metrics from Supabase view 'v_dasbor_pimpinan'
      const { data: vData } = await supabase.from('v_dasbor_pimpinan').select('*').single();
      if (vData) {
        setSupaMetrics({
          totalSantri: vData.total_santri_terdaftar || 0,
          wsHadir: vData.total_ws_hadir || 0,
          wsKuota: vData.total_kuota_ws || 0,
          totalTamu: vData.total_tamu_terdaftar || 0,
          tamuHadir: vData.total_tamu_hadir || 0,
          tamuKuota: vData.total_kuota_tamu || 0,
        });
      }

      // 2. Fetch peserta_santri & tamu_undangan live tables
      const [resSantri, resUndangan] = await Promise.all([
        supabase.from('peserta_santri').select('*'),
        supabase.from('tamu_undangan').select('*'),
      ]);

      if (resSantri.data) {
        setKeluargaList(
          resSantri.data.map((s) => ({
            id: s.id,
            kode: s.kode || s.nis || 'SH000',
            namaWali: s.nama_wali,
            santri: [{ nama: s.nama, kelas: s.kelas }],
            kuota: {
              kuotaDasar: s.kuota_dasar || 2,
              kuotaTambahan: 0,
              terpakai: s.kuota_terpakai || 0,
            },
          }))
        );
      }
      if (resUndangan.data) {
        setUndanganList(
          resUndangan.data.map((u) => ({
            id: u.id,
            kode: u.kode,
            nama: u.nama,
            kategori: u.kategori,
            instansi: u.instansi || u.alamat,
            kuota: {
              kuotaDasar: u.kuota_dasar || 2,
              kuotaTambahan: 0,
              terpakai: u.kuota_terpakai || 0,
            },
          }))
        );
      }
    } catch (e) {
      setKeluargaList([]);
      setUndanganList([]);
    }
  };

  useEffect(() => {
    fetchDasborPimpinan();
    const interval = setInterval(fetchDasborPimpinan, 3000);
    return () => clearInterval(interval);
  }, []);

  // Compute Wali Santri & Tamu totals
  const totalKuotaWaliSantri = supaMetrics.wsKuota || keluargaList.reduce((acc, k) => acc + (k.kuota?.kuotaDasar || 0), 0);
  const totalHadirWaliSantri = supaMetrics.wsHadir || keluargaList.reduce((acc, k) => acc + (k.kuota?.terpakai || 0), 0);

  const totalKuotaTamu = supaMetrics.tamuKuota || undanganList.reduce((acc, u) => acc + (u.kuota?.kuotaDasar || 0), 0);
  const totalHadirTamu = supaMetrics.tamuHadir || undanganList.reduce((acc, u) => acc + (u.kuota?.terpakai || 0), 0);

  const grandTotalHadir = totalHadirWaliSantri + totalHadirTamu;
  const totalKapasitasKursi = (totalKuotaWaliSantri || 0) + (totalKuotaTamu || 0);
  const okupansiPersen = totalKapasitasKursi > 0 ? Math.round((grandTotalHadir / totalKapasitasKursi) * 100) : 0;

  // Filter pencarian kehadiran real-time berdasarkan nama di Supabase
  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];

    const res: any[] = [];

    // Cari di wali santri
    keluargaList.forEach((k) => {
      const namaWali = k.namaWali || '';
      const namaSantri = k.santri?.[0]?.nama || '';
      if (
        namaWali.toLowerCase().includes(q) ||
        namaSantri.toLowerCase().includes(q) ||
        k.kode.toLowerCase().includes(q)
      ) {
        res.push({
          id: k.id,
          kode: k.kode,
          tipe: 'Wali Santri',
          nama: namaWali || namaSantri,
          subInfo: `Santri: ${namaSantri || '-'} (${k.santri?.[0]?.kelas || '-'})`,
          terpakai: k.kuota?.terpakai || 0,
          totalKuota: (k.kuota?.kuotaDasar || 0) + (k.kuota?.kuotaTambahan || 0),
          isHadir: (k.kuota?.terpakai || 0) > 0,
        });
      }
    });

    // Cari di tamu undangan
    undanganList.forEach((u) => {
      if (
        u.nama.toLowerCase().includes(q) ||
        (u.instansi && u.instansi.toLowerCase().includes(q)) ||
        u.kode.toLowerCase().includes(q)
      ) {
        res.push({
          id: u.id,
          kode: u.kode,
          tipe: 'Tamu Undangan',
          nama: u.nama,
          subInfo: u.instansi || u.kategori || 'Tamu Undangan',
          terpakai: u.kuota?.terpakai || 0,
          totalKuota: (u.kuota?.kuotaDasar || 0) + (u.kuota?.kuotaTambahan || 0),
          isHadir: (u.kuota?.terpakai || 0) > 0,
        });
      }
    });

    return res.slice(0, 15);
  }, [searchQuery, keluargaList, undanganList]);

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
                  Haul &amp; Haflah P3TQ - MHMTQ 2027
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsUsModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 hover:brightness-105 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-200" />
                <span>Tanya Us AI</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 text-xs font-bold shadow-2xs flex items-center space-x-1.5 transition-all cursor-pointer"
                title="Keluar Sesi"
              >
                <LogOut className="w-3.5 h-3.5 text-stone-500" />
                <span>Keluar</span>
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
                    Live Okupansi Kursi Aula Al-Muktamar (Supabase Dynamic)
                  </span>
                </div>
                <h2 className="text-xl sm:text-3xl font-serif font-black text-white mt-1">
                  {grandTotalHadir} Hadir / {totalKapasitasKursi} Kapasitas Kursi
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
              <span>Wali Santri Hadir: <strong>{totalHadirWaliSantri} Hadir</strong></span>
              <span>Tamu Undangan Hadir: <strong>{totalHadirTamu} Hadir</strong></span>
              <span>Sisa Kursi Kosong: <strong>{Math.max(0, totalKapasitasKursi - grandTotalHadir)} Kursi</strong></span>
            </div>
          </div>

          {/* METRIK REAL-TIME FORMAT BARU (WALISANTRI & TAMU UNDANGAN) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-[#E8DFD5] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#8C6A47]" />
                  Total Wali Santri
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  {totalKuotaWaliSantri > 0 ? Math.round((totalHadirWaliSantri / totalKuotaWaliSantri) * 100) : 0}% Hadir
                </span>
              </div>
              <div className="text-3xl font-serif font-black text-[#422F21]">
                {totalHadirWaliSantri} <span className="text-lg font-sans font-normal text-stone-400">/ {totalKuotaWaliSantri}</span>
              </div>
              <p className="text-xs text-stone-500">
                Format: Total Wali Santri Hadir / Total Kuota Wali Santri
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-[#E8DFD5] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-700" />
                  Total Tamu Undangan
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {totalKuotaTamu > 0 ? Math.round((totalHadirTamu / totalKuotaTamu) * 100) : 0}% Hadir
                </span>
              </div>
              <div className="text-3xl font-serif font-black text-[#422F21]">
                {totalHadirTamu} <span className="text-lg font-sans font-normal text-stone-400">/ {totalKuotaTamu}</span>
              </div>
              <p className="text-xs text-stone-500">
                Format: Total Tamu Undangan Hadir / Total Tamu Undangan
              </p>
            </div>
          </div>

          {/* PECEKAN STATUS KEHADIRAN NAMA REAL-TIME */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#E8DFD5] shadow-sm space-y-4">
            <div>
              <h3 className="font-serif font-black text-base sm:text-lg text-[#422F21]">
                Cek Status Kehadiran Real-time (Supabase)
              </h3>
              <p className="text-xs text-[#7A624E]">
                Ketik nama wali santri, nama santri, kiai/tokoh, atau kode barcode untuk mengecek status kehadiran langsung.
              </p>
            </div>

            <div className="relative">
              <Search className="w-4.5 h-4.5 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama tokoh / wali santri / santri (cth: KH. Abdullah, SH0001)..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[#D5C4B4] bg-[#FAF7F3] focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-700"
              />
            </div>

            {searchQuery ? (
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-stone-500">Hasil Pencarian ({searchResults.length}):</div>
                {searchResults.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-stone-50 text-center text-xs text-stone-500 border border-dashed border-stone-200">
                    Belum ada data peserta / tamu yang cocok dengan "{searchQuery}".
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {searchResults.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                          item.isHadir
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                            : 'bg-stone-50 border-stone-200 text-stone-800'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white border border-current/20 font-bold">
                              {item.kode}
                            </span>
                            <span className="text-[10px] font-bold uppercase text-stone-500">
                              {item.tipe}
                            </span>
                          </div>
                          <h4 className="font-serif font-black text-sm leading-snug mt-1 truncate">
                            {item.nama}
                          </h4>
                          <p className="text-[11px] text-stone-600 truncate">{item.subInfo}</p>
                        </div>

                        <div className="shrink-0 text-right">
                          {item.isHadir ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-xl border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>HADIR ({item.terpakai}/{item.totalKuota})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-stone-600 bg-stone-200 px-2.5 py-1 rounded-xl border border-stone-300">
                              <Clock className="w-3.5 h-3.5 text-stone-500" />
                              <span>BELUM HADIR</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              (keluargaList.length === 0 && undanganList.length === 0) && (
                <div className="p-4 rounded-2xl bg-stone-50 text-center text-xs text-stone-500 border border-dashed border-stone-200">
                  Belum ada data peserta / tamu
                </div>
              )
            )}
          </div>

          {/* STATUS OPERASIONAL ACARA */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#E8DFD5] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-serif font-black text-base sm:text-lg text-[#422F21]">
                  Informasi &amp; Jadwal Pelaksanaan Haflah
                </h3>
                <p className="text-xs text-[#7A624E]">
                  Pelaksanaan resmi Sabtu, 24 Rajab 1448 H. / 02 Januari 2027 M.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                Sistem Supabase Terhubung
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1.5">
                <div className="font-bold text-[#422F21] flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#8C6A47]" />
                  <span>Registrasi &amp; Pintu Gerbang</span>
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
                  Sambangan dibuka setelah acara selesai s.d. pukul <strong>18.00 WIs</strong>. Halaman Al-Khodijah untuk Bil Ghoibi &amp; Bin Nadzori, Rusunawa Baru untuk Tamatan Aliyah.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] space-y-1.5">
                <div className="font-bold text-[#422F21] flex items-center space-x-1.5">
                  <Award className="w-3.5 h-3.5 text-[#8C6A47]" />
                  <span>Standar Warna Kartu Masuk</span>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  Walisantri maju panggung (Bil Ghoib): <strong>Hitam Gold</strong>. Walisantri reguler &amp; Tamu Undangan Umum: <strong>Merah Gold</strong>.
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
