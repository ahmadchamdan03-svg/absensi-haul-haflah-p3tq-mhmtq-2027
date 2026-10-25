'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  X,
  AlertTriangle,
} from 'lucide-react';
import { store } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/audit-log';
import {
  extractBagianTamatan,
  getWarnaTiketSantri,
  getWarnaTiketUndangan,
  getDefaultJalurMasuk,
} from '@/lib/types';
import QRCode from 'qrcode';
import SantriTable from '@/components/admin/peserta/SantriTable';
import TamuTable from '@/components/admin/peserta/TamuTable';
import SantriModal from '@/components/admin/peserta/SantriModal';
import TamuModal, {
  GolonganUndangan,
  getGolonganUndangan,
} from '@/components/admin/peserta/TamuModal';

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
  const [selectedGolonganUndangan, setSelectedGolonganUndangan] = useState<GolonganUndangan>('ISTIMEWA');
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deletingItem, setDeletingItem] = useState<any | null>(null);
  const [qrDetailItem, setQrDetailItem] = useState<any | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleOpenAddUndangan = (gol: GolonganUndangan) => {
    setSelectedGolonganUndangan(gol);
    setShowAddUndanganModal(true);
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

    const jalurVal = raw.jalur_masuk || item.jalurMasuk || getDefaultJalurMasuk(gol);
    setEditingItem({
      ...item,
      namaPutra: p,
      namaPutri: w,
      alamat: raw.alamat || item.alamat || raw.instansi || item.instansi || '',
      instansi: raw.instansi || item.instansi || raw.alamat || item.alamat || '',
      jalurMasuk: jalurVal,
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refreshData = async () => {
    try {
      const { data: santriData, error: sErr } = await supabase
        .from('peserta_santri')
        .select('*')
        .order('created_at', { ascending: false });

      if (sErr) {
        console.error('Error fetching peserta_santri:', sErr);
      } else if (santriData) {
        const mappedKeluarga = santriData.map((d: any) => ({
          id: d.id,
          kode: d.kode,
          namaWali: d.nama_wali || '-',
          noHp: d.no_hp || '-',
          alamat: d.alamat || 'Kediri',
          kamar: d.kamar || '-',
          santri: [
            {
              id: d.id,
              nis: d.kode,
              nama: d.nama,
              kelas: d.kelas || '-',
              kategoriUtama: d.kategori_utama || 'BIL_GHOIB',
              subKategori: d.sub_kategori || 'Bil Ghoib',
              bagianTamatan: d.sub_kategori || 'A.01',
            },
          ],
          kuota: {
            id: d.id,
            kodeQr: d.kode,
            kuotaDasar: d.kuota_dasar || 2,
            kuotaTambahan: d.kuota_tambahan || 0,
            terpakai: d.kuota_terpakai || 0,
            tiketPanggungJatah: d.tiket_panggung_jatah || 0,
            warnaTiket: d.warna_tiket || getWarnaTiketSantri(d.kategori_utama, d.sub_kategori),
          },
        }));
        setKeluargaList(mappedKeluarga);
      }

      const { data: uData, error: uErr } = await supabase
        .from('tamu_undangan')
        .select('*')
        .order('created_at', { ascending: false });

      if (uErr) {
        console.error('Error fetching tamu_undangan:', uErr);
      } else if (uData) {
        const mappedUndangan = uData.map((u: any) => ({
          id: u.id,
          kode: u.kode,
          nama: u.nama,
          namaPutra: u.nama_putra || '',
          namaPutri: u.nama_putri || '',
          kategori: u.kategori || 'Tamu Kehormatan',
          golongan: u.sub_kategori || 'ISTIMEWA',
          instansi: u.instansi || u.alamat || '-',
          alamat: u.alamat || '-',
          noHp: u.no_hp || '-',
          kuota: {
            id: u.id,
            kodeQr: u.kode,
            kuotaDasar: (u.nama_putra && String(u.nama_putra).trim() ? 1 : 0) + (u.nama_putri && String(u.nama_putri).trim() ? 1 : 0),
            kuotaTambahan: 0,
            terpakai: u.kuota_terpakai || 0,
            warnaTiket: u.warna_tiket !== undefined && u.warna_tiket !== null && u.warna_tiket !== ''
              ? u.warna_tiket
              : getWarnaTiketUndangan(u.sub_kategori, u.kategori),
          },
        }));
        setUndanganList(mappedUndangan);
      }
    } catch (e) {
      console.warn('Error in refreshData:', e);
      setKeluargaList([]);
      setUndanganList([]);
    }
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

    // Supabase Realtime Subscription untuk update instant pada halaman Data Peserta
    const channel = supabase
      .channel('peserta_page_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'peserta_santri' }, refreshData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tamu_undangan' }, refreshData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presensi_log' }, refreshData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pembelian_kuota' }, refreshData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  // Handle keyboard ESC key to close open modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (qrDetailItem) setQrDetailItem(null);
        if (showAddModal) setShowAddModal(false);
        if (showAddUndanganModal) setShowAddUndanganModal(false);
        if (editingItem) setEditingItem(null);
        if (deletingItem) setDeletingItem(null);
        if (showClearModal) setShowClearModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [qrDetailItem, showAddModal, showAddUndanganModal, editingItem, deletingItem, showClearModal]);

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
        kuotaDasar: kuota?.kuotaDasar !== undefined ? kuota.kuotaDasar : (((u as any).namaPutra && String((u as any).namaPutra).trim() ? 1 : 0) + ((u as any).namaPutri && String((u as any).namaPutri).trim() ? 1 : 0)),
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

  // Handler Hapus Peserta (Direct Supabase .delete())
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      if (deletingItem.tipe === 'UNDANGAN') {
        const { error } = await supabase.from('tamu_undangan').delete().eq('kode', deletingItem.kode);
        if (error) {
          alert(`Gagal menghapus tamu dari Supabase DB: ${error.message}`);
          return;
        }
      } else {
        const { error } = await supabase.from('peserta_santri').delete().eq('kode', deletingItem.kode);
        if (error) {
          alert(`Gagal menghapus santri dari Supabase DB: ${error.message}`);
          return;
        }
      }

      await logAudit({
        panitia_id: 'ADMIN_SEKRETARIAT',
        panitia_role: 'ADMIN',
        aksi: deletingItem.tipe === 'UNDANGAN' ? 'HAPUS_TAMU' : 'HAPUS_PESERTA',
        tabel: deletingItem.tipe === 'UNDANGAN' ? 'tamu_undangan' : 'peserta_santri',
        kode: deletingItem.kode,
        nama: deletingItem.nama,
        field: 'hapus_peserta',
        nilai_lama: JSON.stringify(deletingItem),
        detail: deletingItem,
        catatan: `Penghapusan Data ${deletingItem.tipe === 'UNDANGAN' ? 'Tamu' : 'Santri'} (${deletingItem.kode}) - Backup di detail`,
      });
    } catch (err: any) {
      alert(`Terjadi kesalahan saat menghapus data: ${err?.message || err}`);
      return;
    }

    store.hapusPeserta(deletingItem.kode);
    await refreshData();
    showToast(`✓ Peserta ${deletingItem.nama} (${deletingItem.kode}) telah berhasil dihapus dari database.`);
    setDeletingItem(null);
  };

  // Tab Menu Kategori Berbentuk Kartu Statistik
  const tabsHeader = (
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
          4 Kursi · Hitam Gold
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
        <div className="text-[10px] text-blue-700 mt-0.5 truncate">2 Kursi · Merah Gold</div>
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
        <div className="text-[10px] text-amber-800 mt-0.5 truncate">2 Kursi · Merah Gold</div>
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
  );

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
          </div>
        </div>
      </div>

      {/* Tabel Data Santri atau Tamu Undangan */}
      {activeTab.startsWith('UNDANGAN') ? (
        <TamuTable
          tabsHeader={tabsHeader}
          activeTab={activeTab}
          allItems={allItems}
          stats={stats}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          bagianFilter={bagianFilter}
          setBagianFilter={setBagianFilter}
          statusHadirFilter={statusHadirFilter}
          setStatusHadirFilter={setStatusHadirFilter}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          setQrDetailItem={setQrDetailItem}
          handleOpenEdit={handleOpenEdit}
          setDeletingItem={setDeletingItem}
          onRefreshData={refreshData}
          showToast={showToast}
        />
      ) : (
        <SantriTable
          tabsHeader={tabsHeader}
          activeTab={activeTab}
          allItems={allItems}
          stats={stats}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          bagianFilter={bagianFilter}
          setBagianFilter={setBagianFilter}
          statusHadirFilter={statusHadirFilter}
          setStatusHadirFilter={setStatusHadirFilter}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          setQrDetailItem={setQrDetailItem}
          handleOpenEdit={handleOpenEdit}
          setDeletingItem={setDeletingItem}
          onRefreshData={refreshData}
          showToast={showToast}
        />
      )}

      {/* Modal Tambah & Edit Santri */}
      <SantriModal
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        editingItem={editingItem}
        setEditingItem={setEditingItem}
        onAddSuccess={(newSantriItem, msg) => {
          setKeluargaList((prev) => [newSantriItem, ...prev]);
          showToast(msg);
        }}
        onEditSuccess={async (msg) => {
          await refreshData();
          showToast(msg);
        }}
      />

      {/* Modal Tambah & Edit Tamu Undangan */}
      <TamuModal
        showAddUndanganModal={showAddUndanganModal}
        setShowAddUndanganModal={setShowAddUndanganModal}
        selectedGolonganUndangan={selectedGolonganUndangan}
        setSelectedGolonganUndangan={setSelectedGolonganUndangan}
        editingItem={editingItem}
        setEditingItem={setEditingItem}
        onAddSuccess={(newUndanganItem, msg) => {
          setUndanganList((prev) => [newUndanganItem, ...prev]);
          showToast(msg);
        }}
        onEditSuccess={async (msg) => {
          await refreshData();
          showToast(msg);
        }}
      />

      {/* MODAL 4: KONFIRMASI HAPUS PESERTA */}
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

      {/* MODAL: KONFIRMASI HAPUS SEMUA PESERTA */}
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

      {/* MODAL 5: DETAIL QR CODE & KARTU SANTRI */}
      {qrDetailItem && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setQrDetailItem(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md sm:max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border-2 border-opera-800 overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-opera-950 via-opera-900 to-opera-950 text-white p-4 sm:p-5 text-center border-b border-gold-500/40 relative shrink-0 pr-12">
              <button
                onClick={() => setQrDetailItem(null)}
                className="absolute right-3 top-3 sm:right-4 sm:top-4 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="text-[10px] sm:text-[11px] font-serif text-gold-400 tracking-widest uppercase">
                HAUL & HAFLAH 1448 H / 2027 M
              </div>
              <h3 className="font-serif font-black text-sm sm:text-base text-white mt-0.5">
                KARTU PESERTA RESMI
              </h3>
              <div className="text-[10px] sm:text-[11px] text-opera-200">
                P3TQ — MHMTQ PP. Lirboyo Kediri
              </div>
            </div>

            <div className="p-4 sm:p-6 text-center space-y-4 overflow-y-auto flex-1">
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
                      ? qrDetailItem.warnaTiket || getWarnaTiketUndangan(qrDetailItem.golonganUndangan, qrDetailItem.kategori) || (qrDetailItem.golonganUndangan === 'ISTIMEWA' ? 'Hitam Gold' : 'Merah Gold')
                      : getWarnaTiketSantri(qrDetailItem.kategoriUtama, qrDetailItem.subKategori)}
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
                    const liveDomain = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://haflahp3tq.site';
                    const origin = typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1') ? window.location.origin : liveDomain;
                    navigator.clipboard.writeText(
                      `${origin}/u/${qrDetailItem.kode}`
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

              {qrDetailItem.tipe === 'UNDANGAN' && (
                <button
                  onClick={() => {
                    const liveDomain = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://haflahp3tq.site';
                    const origin = typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1') ? window.location.origin : liveDomain;
                    const link = `${origin}/u/${qrDetailItem.kode}`;
                    const waText = `Assalamu'alaikum Wr. Wb.

Yth. *${qrDetailItem.nama}* (${qrDetailItem.instansi || qrDetailItem.kategori || 'Tamu Undangan'})

Pondok Pesantren Putri Tahfizhil Qur'an (P3TQ) & MHMTQ Lirboyo Kediri mengharapkan kehadiran Bapak/Ibu/Saudara/i dalam acara *Haul & Haflah Akhirussanah 1448 H / 2027 M*.

📋 *Detail Undangan:*
• Jatah Kuota: *${qrDetailItem.kuotaDasar + qrDetailItem.kuotaTambahan} Kursi VIP*
• Tautan Undangan & QR Code Digital:
${link}

Mohon tunjukkan QR Code pada tautan di atas kepada petugas saat tiba di gerbang lokasi acara.

Wassalamu'alaikum Wr. Wb.
Pemerhati Haul & Haflah P3TQ - MHMTQ Lirboyo Kediri`;

                    navigator.clipboard.writeText(waText);
                    showToast(`✓ Pesan WA santun untuk ${qrDetailItem.nama} berhasil disalin!`);
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer mt-2"
                >
                  <span>📋 Salin Template Chat WA Santun</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
