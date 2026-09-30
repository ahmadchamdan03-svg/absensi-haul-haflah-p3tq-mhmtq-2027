'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  Clock,
  Award,
  RefreshCw,
  Building,
  Phone,
  Compass,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import DenahModal from '@/components/DenahModal';

export default function LiveDasbor() {
  const [loading, setLoading] = useState(true);
  const [keluargaList, setKeluargaList] = useState<any[]>([]);
  const [undanganList, setUndanganList] = useState<any[]>([]);
  const [supaMetrics, setSupaMetrics] = useState({
    totalSantri: 0,
    wsHadir: 0,
    wsKuota: 0,
    totalTamu: 0,
    tamuHadir: 0,
    tamuKuota: 0,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'SEMUA' | 'SUDAH' | 'BELUM'>('SEMUA');
  const [tabCategory, setTabCategory] = useState<'SEMUA' | 'SANTRI' | 'UNDANGAN'>('SEMUA');
  const [isDenahOpen, setIsDenahOpen] = useState(false);

  const fetchLiveDasborData = async () => {
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

      // 2. Fetch live tables 'peserta_santri' and 'tamu_undangan'
      const [resSantri, resUndangan] = await Promise.all([
        supabase.from('peserta_santri').select('*').order('created_at', { ascending: false }),
        supabase.from('tamu_undangan').select('*').order('created_at', { ascending: false }),
      ]);

      if (resSantri.data) {
        setKeluargaList(
          resSantri.data.map((s) => ({
            id: s.id,
            kode: s.kode,
            tipe: 'SANTRI',
            nama: s.nama,
            namaWali: s.nama_wali || '-',
            subInfo: `Wali: ${s.nama_wali || '-'} (${s.kategori_utama || 'Bil Ghoib'})`,
            kategori: s.kategori_utama || 'BIL_GHOIB',
            subKategori: s.sub_kategori || 'Bil Ghoib',
            kelas: s.kelas || '-',
            kamar: s.kamar || '-',
            noHp: s.no_hp || '-',
            alamat: s.alamat || 'Kediri',
            kuotaDasar: s.kuota_dasar || 2,
            terpakai: s.kuota_terpakai || 0,
            isHadir: (s.kuota_terpakai || 0) > 0,
          }))
        );
      }

      if (resUndangan.data) {
        setUndanganList(
          resUndangan.data.map((u) => ({
            id: u.id,
            kode: u.kode,
            tipe: 'UNDANGAN',
            nama: u.nama,
            namaWali: u.instansi || u.alamat || 'Tamu Undangan',
            subInfo: `Instansi: ${u.instansi || u.alamat || '-'} (${u.kategori || 'Tamu'})`,
            kategori: u.kategori || 'Tamu Undangan',
            subKategori: u.sub_kategori || 'ISTIMEWA',
            kelas: u.sub_kategori || 'VIP IDS',
            kamar: '-',
            noHp: u.no_hp || '-',
            alamat: u.alamat || u.instansi || 'Kediri',
            kuotaDasar: u.kuota_dasar || 2,
            terpakai: u.kuota_terpakai || 0,
            isHadir: (u.kuota_terpakai || 0) > 0,
          }))
        );
      }
    } catch (e) {
      console.warn('Live dasbor fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveDasborData();
    const interval = setInterval(fetchLiveDasborData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Total Wali Santri metric calculation
  const totalKuotaWaliSantri = supaMetrics.wsKuota || keluargaList.reduce((acc, k) => acc + (k.kuotaDasar || 0), 0);
  const totalHadirWaliSantri = supaMetrics.wsHadir || keluargaList.reduce((acc, k) => acc + (k.terpakai || 0), 0);

  // Total Tamu Undangan metric calculation
  const totalKuotaTamu = supaMetrics.tamuKuota || undanganList.reduce((acc, u) => acc + (u.kuotaDasar || 0), 0);
  const totalHadirTamu = supaMetrics.tamuHadir || undanganList.reduce((acc, u) => acc + (u.terpakai || 0), 0);

  // Unified participant list (Santri + Tamu)
  const allUnifiedList = useMemo(() => {
    return [...keluargaList, ...undanganList];
  }, [keluargaList, undanganList]);

  // Real-time filtering
  const filteredList = useMemo(() => {
    let list = allUnifiedList;

    // Filter Kategori Tab
    if (tabCategory === 'SANTRI') {
      list = list.filter((i) => i.tipe === 'SANTRI');
    } else if (tabCategory === 'UNDANGAN') {
      list = list.filter((i) => i.tipe === 'UNDANGAN');
    }

    // Quick Status Filter
    if (statusFilter === 'SUDAH') {
      list = list.filter((i) => i.isHadir);
    } else if (statusFilter === 'BELUM') {
      list = list.filter((i) => !i.isHadir);
    }

    // Real-time Search Query Filter
    const q = searchQuery.toLowerCase().trim();
    if (!q) return list;

    return list.filter((item) => {
      const matchKode = (item.kode || '').toLowerCase().includes(q);
      const matchNama = (item.nama || '').toLowerCase().includes(q);
      const matchWali = (item.namaWali || '').toLowerCase().includes(q);
      const matchKat = (item.kategori || '').toLowerCase().includes(q);
      const matchAlamat = (item.alamat || '').toLowerCase().includes(q);
      const matchHp = (item.noHp || '').toLowerCase().includes(q);
      return matchKode || matchNama || matchWali || matchKat || matchAlamat || matchHp;
    });
  }, [allUnifiedList, tabCategory, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-black tracking-tight text-[#422F21]">
            Laporan Realtime Jumlah Kehadiran Peserta Haul Haflah P3TQ MHMTQ 2027 M./ 1448 H.
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsDenahOpen(true)}
            className="p-2.5 rounded-xl bg-white hover:bg-[#FAF7F3] text-[#5C3E28] border-2 border-[#D5C4B4] shadow-xs transition-colors flex items-center space-x-1.5 text-xs font-bold cursor-pointer"
          >
            <Compass className="w-4 h-4 text-[#8C6A47]" />
            <span>Denah Lapangan</span>
          </button>
          <button
            type="button"
            onClick={fetchLiveDasborData}
            className="p-2.5 rounded-xl bg-white hover:bg-[#FAF7F3] text-[#8C6A47] border-2 border-[#8C6A47] shadow-sm transition-colors flex items-center space-x-1.5 text-xs font-bold cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2 KARTU METRIK UTAMA FORMAT DOKUMEN 2.0 (TANPA PEMISAHAN GENDER L/P) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* KARTU 1: TOTAL WALI SANTRI */}
        <div className="p-6 rounded-3xl bg-white border border-[#E8DFD5] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wide flex items-center gap-1.5">
              <Users className="w-4.5 h-4.5 text-[#8C6A47]" />
              TOTAL WALI SANTRI
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              {totalKuotaWaliSantri > 0 ? Math.round((totalHadirWaliSantri / totalKuotaWaliSantri) * 100) : 0}% Hadir
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-serif font-black text-[#422F21]">
            {totalHadirWaliSantri} <span className="text-xl font-sans font-normal text-stone-400">/ {totalKuotaWaliSantri}</span>
          </div>
          <p className="text-xs text-stone-500">
            Total wali santri hadir / total kuota wali santri keseluruhan
          </p>
        </div>

        {/* KARTU 2: TOTAL TAMU UNDANGAN */}
        <div className="p-6 rounded-3xl bg-white border border-[#E8DFD5] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wide flex items-center gap-1.5">
              <Award className="w-4.5 h-4.5 text-emerald-700" />
              TOTAL TAMU UNDANGAN
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              {totalKuotaTamu > 0 ? Math.round((totalHadirTamu / totalKuotaTamu) * 100) : 0}% Hadir
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-serif font-black text-[#422F21]">
            {totalHadirTamu} <span className="text-xl font-sans font-normal text-stone-400">/ {totalKuotaTamu}</span>
          </div>
          <p className="text-xs text-stone-500">
            Total tamu undangan hadir / total tamu undangan keseluruhan
          </p>
        </div>
      </div>

      {/* FILTER & PENCARIAN REAL-TIME */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#E8DFD5] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <h3 className="font-serif font-black text-base sm:text-lg text-[#422F21]">
              Pencarian &amp; Filter Kehadiran Realtime
            </h3>
            <p className="text-xs text-[#7A624E]">
              Ketik nama santri, nama wali, atau kode barcode untuk menyaring data secara instan
            </p>
          </div>

          {/* TAB FILTER KATEGORI */}
          <div className="flex bg-[#EFE8E1] p-1 rounded-2xl border border-[#D5C4B4] text-xs font-bold">
            <button
              type="button"
              onClick={() => setTabCategory('SEMUA')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                tabCategory === 'SEMUA' ? 'bg-emerald-800 text-white shadow-xs' : 'text-[#422F21]'
              }`}
            >
              Semua ({allUnifiedList.length})
            </button>
            <button
              type="button"
              onClick={() => setTabCategory('SANTRI')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                tabCategory === 'SANTRI' ? 'bg-emerald-800 text-white shadow-xs' : 'text-[#422F21]'
              }`}
            >
              Wali Santri ({keluargaList.length})
            </button>
            <button
              type="button"
              onClick={() => setTabCategory('UNDANGAN')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                tabCategory === 'UNDANGAN' ? 'bg-emerald-800 text-white shadow-xs' : 'text-[#422F21]'
              }`}
            >
              Tamu ({undanganList.length})
            </button>
          </div>
        </div>

        {/* INPUT PENCARIAN REAL-TIME */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4.5 h-4.5 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama santri, wali, instansi, atau kode (cth: SH0001, KH. Abdullah)..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[#D5C4B4] bg-[#FAF7F3] focus:bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          {/* TOMBOL FILTER CEPAT STATUS KEHADIRAN */}
          <div className="flex items-center space-x-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('SEMUA')}
              className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold border transition-all ${
                statusFilter === 'SEMUA'
                  ? 'bg-stone-800 text-white border-stone-800 shadow-xs'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
              }`}
            >
              Semua Status
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('SUDAH')}
              className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold border transition-all ${
                statusFilter === 'SUDAH'
                  ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                  : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
              }`}
            >
              ✓ Sudah Hadir
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('BELUM')}
              className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold border transition-all ${
                statusFilter === 'BELUM'
                  ? 'bg-amber-800 text-white border-amber-800 shadow-xs'
                  : 'bg-white text-amber-800 border-amber-300 hover:bg-amber-50'
              }`}
            >
              ⏱ Belum Hadir
            </button>
          </div>
        </div>

        {/* TABEL / GRID DAFTAR PESERTA & TAMU */}
        {loading ? (
          <div className="p-8 text-center text-xs text-stone-500">
            Memuat data dasbor dari Supabase...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-8 text-center text-xs bg-stone-50 rounded-2xl border border-dashed border-stone-200 space-y-1">
            <p className="font-bold text-sm text-[#422F21]">Belum ada data peserta / tamu</p>
            <p className="text-stone-500">
              {searchQuery
                ? `Tidak ditemukan data yang cocok dengan kata kunci "${searchQuery}".`
                : 'Silakan panitia menambahkan data peserta atau tamu melalui menu Manajemen Peserta atau Penerima Tamu.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {filteredList.map((item) => (
              <div
                key={item.id || item.kode}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                  item.isHadir
                    ? 'bg-emerald-50/70 border-emerald-300'
                    : 'bg-white border-[#E8DFD5] hover:border-emerald-500'
                }`}
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                      {item.kode}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        item.tipe === 'UNDANGAN'
                          ? 'bg-purple-100 text-purple-900 border border-purple-200'
                          : 'bg-blue-100 text-blue-900 border border-blue-200'
                      }`}
                    >
                      {item.tipe === 'UNDANGAN' ? 'Tamu Undangan' : 'Wali Santri'}
                    </span>
                  </div>
                  <h4 className="font-serif font-black text-sm text-[#422F21] truncate">
                    {item.nama}
                  </h4>
                  <p className="text-[11px] text-stone-600 truncate flex items-center gap-1">
                    <Building className="w-3 h-3 text-stone-400 shrink-0" />
                    <span>{item.subInfo}</span>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  {item.isHadir ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-950 font-black text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>HADIR ({item.terpakai}/{item.kuotaDasar} Kursi)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-200 text-stone-700 font-semibold text-[11px]">
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

      {/* DENAH MODAL */}
      {isDenahOpen && (
        <DenahModal isOpen={isDenahOpen} onClose={() => setIsDenahOpen(false)} />
      )}
    </div>
  );
}
