'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  Check,
  X,
  CreditCard,
  Camera,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Users,
  Plus,
  Search,
  MessageSquare,
  Send,
  Phone,
  Sparkles,
  ArrowRight,
  Filter,
  Clock,
  Banknote,
  Eye,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/AuthGuard';

const getLiveBaseUrl = () => {
  if (
    typeof window !== 'undefined' &&
    !window.location.hostname.includes('localhost') &&
    !window.location.hostname.includes('127.0.0.1')
  ) {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'https://haflahp3tq.site';
};

export default function VerifikasiPage() {
  // State Data dari Supabase
  const [pembelianList, setPembelianList] = useState<any[]>([]);
  const [dbSantriList, setDbSantriList] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [statusMsg, setStatusMsg] = useState<{ tipe: 'success' | 'error'; text: string } | null>(null);
  const [previewBuktiModal, setPreviewBuktiModal] = useState<{ url: string; title: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter & Search State
  const [filterStatus, setFilterStatus] = useState<'SEMUA' | 'MENUNGGU' | 'DIVERIFIKASI' | 'BATAL'>('MENUNGGU');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Tambah Manual State
  const [showAddManualModal, setShowAddManualModal] = useState(false);
  const [searchSantriText, setSearchSantriText] = useState('');
  const [selectedSantriKode, setSelectedSantriKode] = useState('');
  const [manualJumlah, setManualJumlah] = useState(1);
  const [manualMetode, setManualMetode] = useState<'TUNAI' | 'TRANSFER'>('TUNAI');
  const [manualLangsungVerifikasi, setManualLangsungVerifikasi] = useState(true);
  const [manualCatatan, setManualCatatan] = useState('');
  const [manualKirimWa, setManualKirimWa] = useState(true);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // 1. Fetch Data dari Supabase ('pembelian_kuota' & 'peserta_santri')
  const fetchData = async () => {
    try {
      setLoadingData(true);
      setErrorMessage(null);

      // Fetch data pembelian_kuota
      const { data: pData, error: pErr } = await supabase
        .from('pembelian_kuota')
        .select('*')
        .order('created_at', { ascending: false });

      if (pErr) {
        console.error('Error fetching data from pembelian_kuota:', pErr);
        setErrorMessage(`Gagal memuat data transaksi: ${pErr.message}`);
        setPembelianList([]);
      } else {
        setPembelianList(pData || []);
      }

      // Fetch data peserta_santri untuk mapping profil
      const { data: sData, error: sErr } = await supabase
        .from('peserta_santri')
        .select('*')
        .order('nama', { ascending: true });

      if (sErr) {
        console.error('Error fetching data from peserta_santri:', sErr);
      } else if (sData) {
        setDbSantriList(sData);
      }
    } catch (err: any) {
      console.error('Exception in fetchData verifikasi:', err);
      setErrorMessage(`Terjadi kesalahan sistem: ${err.message || err}`);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe Realtime ke tabel 'pembelian_kuota'
    const channel = supabase
      .channel('admin_verifikasi_realtime_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pembelian_kuota' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Map Santri by Kode
  const santriMap = useMemo(() => {
    const map = new Map<string, any>();
    dbSantriList.forEach((s) => {
      if (s.kode) map.set(s.kode.toUpperCase(), s);
    });
    return map;
  }, [dbSantriList]);

  // Hitung Statistik Pagu Terjual & Sisa
  const paguTerjual = useMemo(() => {
    return pembelianList
      .filter((p) => p.status === 'DIVERIFIKASI' || p.status === 'DITERIMA')
      .reduce((acc, p) => acc + Number(p.jumlah_kursi || p.jumlah || 0), 0);
  }, [pembelianList]);

  const sisaPagu = Math.max(0, 300 - paguTerjual);

  const countMenungguVerifikasi = useMemo(() => {
    return pembelianList.filter((p) => p.status === 'MENUNGGU_VERIFIKASI').length;
  }, [pembelianList]);

  const countMenungguPembayaran = useMemo(() => {
    return pembelianList.filter((p) => p.status === 'MENUNGGU_PEMBAYARAN').length;
  }, [pembelianList]);

  const countDiverifikasi = useMemo(() => {
    return pembelianList.filter((p) => p.status === 'DIVERIFIKASI' || p.status === 'DITERIMA').length;
  }, [pembelianList]);

  const countBatal = useMemo(() => {
    return pembelianList.filter((p) => ['REFUND', 'BATAL', 'DITOLAK'].includes(p.status)).length;
  }, [pembelianList]);

  // Filter & Search List Transaksi
  const filteredOrders = useMemo(() => {
    return pembelianList.filter((order) => {
      const status = order.status || '';

      // Filter status tab
      if (filterStatus === 'MENUNGGU') {
        if (status !== 'MENUNGGU_VERIFIKASI' && status !== 'MENUNGGU_PEMBAYARAN' && status !== 'DIPESAN') return false;
      } else if (filterStatus === 'DIVERIFIKASI') {
        if (status !== 'DIVERIFIKASI' && status !== 'DITERIMA') return false;
      } else if (filterStatus === 'BATAL') {
        if (status !== 'BATAL' && status !== 'DITOLAK' && status !== 'REFUND') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const santri = santriMap.get((order.kode_santri || '').toUpperCase());
        const idPesanan = (order.id_pesanan || order.id || '').toLowerCase();
        const namaWali = (order.nama_wali || '').toLowerCase();
        const kodeSantri = (order.kode_santri || '').toLowerCase();
        const namaSantri = (santri?.nama || '').toLowerCase();

        return (
          idPesanan.includes(q) ||
          namaWali.includes(q) ||
          kodeSantri.includes(q) ||
          namaSantri.includes(q)
        );
      }

      return true;
    });
  }, [pembelianList, filterStatus, searchQuery, santriMap]);

  // Filter santri untuk modal tambah manual
  const filteredSantriList = useMemo(() => {
    if (!searchSantriText.trim()) return [];
    const q = searchSantriText.toLowerCase().trim();
    return dbSantriList
      .filter((s) => {
        const nama = (s.nama || '').toLowerCase();
        const wali = (s.nama_wali || '').toLowerCase();
        const kelas = (s.kelas || '').toLowerCase();
        const kode = (s.kode || '').toLowerCase();
        return nama.includes(q) || wali.includes(q) || kelas.includes(q) || kode.includes(q);
      })
      .slice(0, 30);
  }, [dbSantriList, searchSantriText]);

  const selectedSantri = useMemo(() => {
    if (!selectedSantriKode) return null;
    return dbSantriList.find((s) => s.kode === selectedSantriKode) || null;
  }, [dbSantriList, selectedSantriKode]);

  // 2. Handler Verifikasi Transaksi (Setujui)
  const handleVerifikasiOrder = async (item: any) => {
    setIsProcessing(true);
    setStatusMsg(null);

    try {
      const nowIso = new Date().toISOString();
      const targetId = item.id_pesanan || item.id;

      // 1. Update status pembelian_kuota ke 'DIVERIFIKASI'
      const { error: updateOrderErr } = await supabase
        .from('pembelian_kuota')
        .update({
          status: 'DIVERIFIKASI',
          verified_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id_pesanan', targetId);

      if (updateOrderErr) {
        console.error('Error updating status pembelian_kuota:', updateOrderErr);
        setStatusMsg({ tipe: 'error', text: `Gagal memverifikasi pesanan: ${updateOrderErr.message}` });
        return;
      }

      // 2. Update kuota_tambahan di peserta_santri
      const targetKode = item.kode_santri || item.kode;
      const { data: currentSantri } = await supabase
        .from('peserta_santri')
        .select('kuota_tambahan, no_hp, nama_wali, nama')
        .eq('kode', targetKode)
        .maybeSingle();

      const currentTambah = Number(currentSantri?.kuota_tambahan || 0);
      const numKursi = Number(item.jumlah_kursi || item.jumlah || 1);
      const newTambah = currentTambah + numKursi;

      await supabase
        .from('peserta_santri')
        .update({
          kuota_tambahan: newTambah,
          updated_at: nowIso,
        })
        .eq('kode', targetKode);

      // 3. Kirim Otomatis Pesan WA ke Wali Santri
      const targetHp = currentSantri?.no_hp || item.no_hp || '';
      if (targetHp && targetHp.length >= 9) {
        const origin = getLiveBaseUrl();
        const pesanWa = `*VERIFIKASI PEMBELIAN KUOTA TAMBAHAN BERHASIL*\n\n` +
          `Assalamu'alaikum Bpk/Ibu *${item.nama_wali || currentSantri?.nama_wali || 'Wali Santri'}*,\n` +
          `Pembayaran pesanan kuota tambahan kursi Anda (ID Pesanan: *${targetId}*) sebanyak *${numKursi} Kursi* telah *BERHASIL DIVERIFIKASI RESMI* oleh panitia.\n\n` +
          `📋 *Detail Terkini*:\n` +
          `• ID Pesanan: ${targetId}\n` +
          `• Tambahan: +${numKursi} Kursi (Rp ${Number(item.total_bayar || item.totalBayar || numKursi * 80000).toLocaleString('id-ID')})\n` +
          `• Status: *Aktif pada QR Code Santri*\n\n` +
          `Akses Kartu Presensi Digital & QR Code:\n` +
          `🔗 ${origin}/u/${targetKode}\n\n` +
          `_Panitia Haul & Haflah P3TQ - MHMTQ 2027_`;

        fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: targetHp,
            message: pesanWa,
          }),
        }).catch((e) => console.warn('WA send error:', e));
      }

      setStatusMsg({
        tipe: 'success',
        text: `✓ Pesanan ${targetId} (${item.nama_wali}) BERHASIL DIVERIFIKASI! Kuota santri bertambah +${numKursi} kursi.`,
      });

      fetchData();
    } catch (err: any) {
      console.error('Exception during verification:', err);
      setStatusMsg({ tipe: 'error', text: `Terjadi kesalahan: ${err.message || err}` });
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Handler Tolak Transaksi
  const handleTolakOrder = async (item: any) => {
    const targetId = item.id_pesanan || item.id;
    if (!confirm(`Apakah Anda yakin ingin MENOLAK pesanan ${targetId} dari ${item.nama_wali}?`)) return;

    setIsProcessing(true);
    setStatusMsg(null);

    try {
      const nowIso = new Date().toISOString();
      const { error: updateErr } = await supabase
        .from('pembelian_kuota')
        .update({
          status: 'DITOLAK',
          updated_at: nowIso,
        })
        .eq('id_pesanan', targetId);

      if (updateErr) {
        setStatusMsg({ tipe: 'error', text: `Gagal menolak pesanan: ${updateErr.message}` });
      } else {
        setStatusMsg({ tipe: 'success', text: `✓ Pesanan ${targetId} telah DITOLAK.` });
        fetchData();
      }
    } catch (err: any) {
      setStatusMsg({ tipe: 'error', text: `Terjadi kesalahan: ${err.message || err}` });
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Handler Tambah Manual Panitia
  const handleSubmitTambahManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantriKode || !selectedSantri) {
      alert('Pilih santri terlebih dahulu dari hasil pencarian!');
      return;
    }
    if (manualJumlah <= 0) {
      alert('Jumlah kuota minimal 1 kursi!');
      return;
    }
    if (manualJumlah > sisaPagu) {
      alert(`Sisa kuota pagu saat ini hanya ${sisaPagu} unit!`);
      return;
    }

    setIsSubmittingManual(true);
    setStatusMsg(null);

    try {
      const now = new Date();
      const orderId = `KT-M${Math.floor(10000 + Math.random() * 90000)}`;
      const statusAwal = manualLangsungVerifikasi ? 'DIVERIFIKASI' : 'MENUNGGU_VERIFIKASI';
      const totalBayar = manualJumlah * 80000;
      const namaWali = selectedSantri.nama_wali || selectedSantri.nama;

      const newOrder = {
        id: orderId,
        id_pesanan: orderId,
        kode_santri: selectedSantri.kode,
        nama_wali: namaWali,
        jumlah_kursi: manualJumlah,
        total_bayar: totalBayar,
        status: statusAwal,
        metode: manualMetode,
        verified_at: manualLangsungVerifikasi ? now.toISOString() : null,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      const { error: insertErr } = await supabase
        .from('pembelian_kuota')
        .insert(newOrder);

      if (insertErr) {
        console.error('Error inserting manual order:', insertErr);
        setStatusMsg({ tipe: 'error', text: `Gagal membuat transaksi manual: ${insertErr.message}` });
        setIsSubmittingManual(false);
        return;
      }

      if (manualLangsungVerifikasi) {
        const currentTambah = Number(selectedSantri.kuota_tambahan || 0);
        const newTambah = currentTambah + manualJumlah;
        await supabase
          .from('peserta_santri')
          .update({ kuota_tambahan: newTambah, updated_at: now.toISOString() })
          .eq('kode', selectedSantri.kode);
      }

      // Kirim WA Notifikasi ke Wali jika dicentang
      if (manualKirimWa && selectedSantri.no_hp && selectedSantri.no_hp !== '-' && selectedSantri.no_hp.length >= 9) {
        const origin = getLiveBaseUrl();
        const pesanWa = manualLangsungVerifikasi
          ? `Assalamu'alaikum Wr. Wb.\n\n` +
            `Yth. Bapak/Ibu *${selectedSantri.nama_wali}*,\n` +
            `Panitia Haul & Haflah P3TQ - MHMTQ telah menambahkan *${manualJumlah} Kuota Tambahan* secara langsung untuk santri *${selectedSantri.nama}* (${selectedSantri.kelas || '-'}).\n\n` +
            `📋 *Rincian Status*:\n` +
            `• ID Pesanan: ${orderId}\n` +
            `• Metode: ${manualMetode === 'TUNAI' ? 'Kas Tunai di Sekretariat' : 'Transfer Rekening BRI'}\n` +
            `• Jumlah: +${manualJumlah} Kursi (Rp ${totalBayar.toLocaleString('id-ID')})\n` +
            `• Status: *DIVERIFIKASI LANGSUNG (Aktif)*\n\n` +
            `Akses E-Undangan & QR Presensi:\n` +
            `🔗 ${origin}/u/${selectedSantri.kode}\n\n` +
            `_Panitia Haul & Haflah P3TQ - MHMTQ_`
          : `Assalamu'alaikum Wr. Wb.\n\n` +
            `Yth. Bapak/Ibu *${selectedSantri.nama_wali}*,\n` +
            `Pesanan *${manualJumlah} Kuota Tambahan* (ID: ${orderId}) untuk santri *${selectedSantri.nama}* telah dicatat oleh Panitia.\n` +
            `Total Tagihan: Rp ${totalBayar.toLocaleString('id-ID')}.\n` +
            `Mohon lakukan pelunasan agar kuota segera diaktifkan pada QR Code.\n\n` +
            `_Panitia Haul & Haflah P3TQ - MHMTQ_`;

        fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: selectedSantri.no_hp,
            message: pesanWa,
          }),
        }).catch((errW) => console.error('Gagal kirim WA ke wali:', errW));
      }

      setStatusMsg({
        tipe: 'success',
        text: `✓ Berhasil menambahkan +${manualJumlah} kuota tambahan untuk ${selectedSantri.nama} (${selectedSantri.kode})!`,
      });

      setShowAddManualModal(false);
      setSelectedSantriKode('');
      setSearchSantriText('');
      setManualJumlah(1);
      setManualCatatan('');
      fetchData();
    } catch (err: any) {
      setStatusMsg({ tipe: 'error', text: err.message || 'Terjadi kesalahan sistem' });
    } finally {
      setIsSubmittingManual(false);
    }
  };

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <div className="space-[#FAF7F3] space-y-6 selection:bg-[#8C6A47]/20 pb-20">
        {/* HEADER LOGO & JUDUL HALAMAN */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white rounded-3xl p-6 border-2 border-[#D5C4B4] shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#8C6A47] uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-[#8C6A47]" />
              <span>Panel Verifikasi Panitia</span>
            </div>
            <h1 className="font-serif font-black text-2xl text-[#322116]">
              Verifikasi Mutasi &amp; Kuota Tambahan
            </h1>
            <p className="text-xs text-stone-600">
              Kelola verifikasi pembayaran bukti transfer, entri manual kasir, dan alokasi pagu kuota tambahan kursi.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddManualModal(true)}
            className="py-3 px-5 rounded-2xl bg-gradient-to-r from-[#8C6A47] to-[#A47E57] hover:brightness-105 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2 cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 text-amber-200" />
            <span>Tambah Transaksi Manual (Kasir)</span>
          </button>
        </div>

        {/* RINGKASAN STATISTIK PAGU KUOTA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl p-5 border-2 border-[#E8DFD5] shadow-xs space-y-2">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">
              PAGU TERJUAL (DIVERIFIKASI)
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="font-serif font-black text-3xl text-emerald-700">{paguTerjual}</span>
              <span className="text-xs text-stone-500 font-bold">/ 300 unit</span>
            </div>
            <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden border border-stone-200">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (paguTerjual / 300) * 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border-2 border-[#E8DFD5] shadow-xs space-y-2">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">
              SISA TERSEDIA
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="font-serif font-black text-3xl text-[#422F21]">{sisaPagu}</span>
              <span className="text-xs text-stone-500 font-bold">unit pagu</span>
            </div>
            <p className="text-[11px] text-stone-500 font-medium">Kapasitas maksimal 300 kursi</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border-2 border-[#E8DFD5] shadow-xs space-y-2">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">
              MENUNGGU VERIFIKASI
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="font-serif font-black text-3xl text-sky-700">
                {countMenungguVerifikasi}
              </span>
              <span className="text-xs text-stone-500 font-bold">pesanan</span>
            </div>
            <p className="text-[11px] text-stone-500 font-medium">Bukti transfer sudah diunggah</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border-2 border-[#E8DFD5] shadow-xs space-y-2">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">
              MENUNGGU PEMBAYARAN
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="font-serif font-black text-3xl text-amber-700">
                {countMenungguPembayaran}
              </span>
              <span className="text-xs text-stone-500 font-bold">pesanan</span>
            </div>
            <p className="text-[11px] text-stone-500 font-medium">Terkunci (Batas waktu 6 jam)</p>
          </div>
        </div>

        {/* ERROR MESSAGE NOTIFICATION BANNER */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 text-xs font-bold flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={fetchData}
              className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* ALERT STATUS HASIL OPERASI */}
        {statusMsg && (
          <div
            className={`p-4 rounded-2xl text-xs font-bold border flex items-center justify-between shadow-xs animate-in fade-in ${
              statusMsg.tipe === 'success'
                ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
                : 'bg-rose-50 text-rose-950 border-rose-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <CheckCircle2
                className={`w-5 h-5 shrink-0 ${
                  statusMsg.tipe === 'success' ? 'text-emerald-600' : 'text-rose-600'
                }`}
              />
              <span>{statusMsg.text}</span>
            </div>
            <button
              onClick={() => setStatusMsg(null)}
              className="text-stone-400 hover:text-stone-600 font-bold px-2 py-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* KONTROL TAB FILTER & SEARCH */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border-2 border-[#D5C4B4] space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Tab Filter Pills */}
            <div className="flex items-center gap-2 text-xs font-bold overflow-x-auto pb-2 md:pb-0 whitespace-nowrap no-scrollbar">
              <button
                onClick={() => setFilterStatus('SEMUA')}
                className={`px-4 py-2.5 rounded-2xl transition-all shrink-0 cursor-pointer ${
                  filterStatus === 'SEMUA'
                    ? 'bg-[#8C6A47] text-white shadow-md'
                    : 'bg-[#FAF7F3] text-[#422F21] hover:bg-[#EFE8E1] border border-[#D5C4B4]'
                }`}
              >
                Semua Transaksi ({pembelianList.length})
              </button>
              <button
                onClick={() => setFilterStatus('MENUNGGU')}
                className={`px-4 py-2.5 rounded-2xl flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer ${
                  filterStatus === 'MENUNGGU'
                    ? 'bg-sky-700 text-white shadow-md'
                    : 'bg-sky-50 text-sky-900 hover:bg-sky-100 border border-sky-300'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Menunggu ({countMenungguVerifikasi + countMenungguPembayaran})</span>
              </button>
              <button
                onClick={() => setFilterStatus('DIVERIFIKASI')}
                className={`px-4 py-2.5 rounded-2xl flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer ${
                  filterStatus === 'DIVERIFIKASI'
                    ? 'bg-emerald-700 text-white shadow-md'
                    : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-300'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Diverifikasi ({countDiverifikasi})</span>
              </button>
              <button
                onClick={() => setFilterStatus('BATAL')}
                className={`px-4 py-2.5 rounded-2xl flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer ${
                  filterStatus === 'BATAL'
                    ? 'bg-rose-700 text-white shadow-md'
                    : 'bg-rose-50 text-rose-900 hover:bg-rose-100 border border-rose-300'
                }`}
              >
                <X className="w-3.5 h-3.5" />
                <span>Refund / Batal ({countBatal})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari ID pesanan, santri, wali..."
                className="w-full pl-9 pr-8 py-2.5 text-xs rounded-2xl border border-[#D5C4B4] bg-[#FAF7F3] focus:bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#8C6A47]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* TABEL TRANSAKSI KUOTA TAMBAHAN */}
          <div className="overflow-x-auto rounded-2xl border border-[#E8DFD5] bg-white">
            <table className="w-full min-w-[920px] text-xs text-left">
              <thead className="bg-[#FAF7F3] text-[#422F21] font-serif font-black border-b border-[#D5C4B4] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 whitespace-nowrap">ID PESANAN</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">WALI &amp; SANTRI</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">KATEGORI</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">JUMLAH</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">TOTAL</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">BUKTI / METODE</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">STATUS</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">AKSI VERIFIKASI &amp; WA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loadingData ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-stone-500">
                      <Loader2 className="w-7 h-7 animate-spin text-[#8C6A47] mx-auto mb-2" />
                      <p className="font-semibold text-xs">Memuat Data Transaksi dari Supabase...</p>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-stone-400">
                      Tidak ada transaksi kuota tambahan yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const santri = santriMap.get((order.kode_santri || '').toUpperCase());
                    const orderId = order.id_pesanan || order.id || 'KT-0000';
                    const numKursi = Number(order.jumlah_kursi || order.jumlah || 1);
                    const totalBayar = Number(order.total_bayar || order.totalBayar || numKursi * 80000);
                    const isMenunggu = order.status === 'MENUNGGU_VERIFIKASI' || order.status === 'MENUNGGU_PEMBAYARAN';
                    const isDiverifikasi = order.status === 'DIVERIFIKASI' || order.status === 'DITERIMA';

                    return (
                      <tr key={orderId} className="hover:bg-[#FAF7F3]/70 transition-colors">
                        {/* ID PESANAN */}
                        <td className="py-3.5 px-4 font-mono">
                          <span className="font-bold text-[#322116] block text-xs">{orderId}</span>
                          <span className="text-[10px] text-stone-400 block pt-0.5">
                            {order.created_at
                              ? new Date(order.created_at).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '-'}
                          </span>
                        </td>

                        {/* WALI & SANTRI */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#422F21]">
                            {order.nama_wali || santri?.nama_wali || 'Wali Santri'}
                          </div>
                          <div className="text-[11px] text-stone-600 flex items-center space-x-1 pt-0.5">
                            <span className="font-semibold text-[#8C6A47]">
                              {santri?.nama || order.kode_santri}
                            </span>
                            <span className="text-stone-400">
                              ({santri?.kelas ? `Kelas ${santri.kelas}` : order.kode_santri})
                            </span>
                          </div>
                          {(santri?.no_hp || order.no_hp) && (
                            <div className="text-[10px] text-stone-400 font-mono flex items-center space-x-1 mt-0.5">
                              <Phone className="w-2.5 h-2.5 text-emerald-600" />
                              <span>{santri?.no_hp || order.no_hp}</span>
                            </div>
                          )}
                        </td>

                        {/* KATEGORI */}
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF0E6] text-[#8C6A47] border border-[#D5C4B4]">
                            {santri?.sub_kategori || santri?.kategori_utama || 'Santri'}
                          </span>
                        </td>

                        {/* JUMLAH KURSI */}
                        <td className="py-3.5 px-4 font-bold text-stone-800">
                          <span className="text-sm font-serif font-black text-[#422F21]">
                            {numKursi}
                          </span>{' '}
                          Kursi
                        </td>

                        {/* TOTAL BAYAR */}
                        <td className="py-3.5 px-4">
                          <div className="font-serif font-black text-[#322116]">
                            Rp {totalBayar.toLocaleString('id-ID')}
                          </div>
                          <div className="text-[10px] text-stone-400">@ Rp 80.000</div>
                        </td>

                        {/* BUKTI / METODE */}
                        <td className="py-3.5 px-4">
                          {order.bukti_url || order.buktiUrl ? (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewBuktiModal({
                                  url: order.bukti_url || order.buktiUrl,
                                  title: `Bukti Transfer - ${orderId} (${order.nama_wali || 'Wali'})`,
                                })
                              }
                              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-sky-50 text-sky-800 hover:bg-sky-100 font-bold border border-sky-300 transition-colors shadow-xs cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-sky-600" />
                              <span>Lihat Bukti</span>
                            </button>
                          ) : order.metode === 'TUNAI' ? (
                            <span className="inline-flex items-center space-x-1 text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-300">
                              <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Kas Tunai</span>
                            </span>
                          ) : (
                            <span className="text-stone-400 italic text-[11px]">Belum diunggah</span>
                          )}
                        </td>

                        {/* STATUS BADGE */}
                        <td className="py-3.5 px-4">
                          {order.status === 'DIVERIFIKASI' || order.status === 'DITERIMA' ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-[11px]">
                              <Check className="w-3 h-3 text-emerald-700" />
                              <span>Diverifikasi</span>
                            </span>
                          ) : order.status === 'MENUNGGU_VERIFIKASI' ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-sky-100 text-sky-900 border border-sky-300 font-bold text-[11px]">
                              <Clock className="w-3 h-3 text-sky-700 animate-pulse" />
                              <span>Menunggu Verifikasi</span>
                            </span>
                          ) : order.status === 'MENUNGGU_PEMBAYARAN' ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px]">
                              <Clock className="w-3 h-3 text-amber-700" />
                              <span>Menunggu Bayar</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-900 border border-rose-300 font-bold text-[11px]">
                              <X className="w-3 h-3 text-rose-700" />
                              <span>{order.status || 'Batal'}</span>
                            </span>
                          )}
                        </td>

                        {/* AKSI VERIFIKASI & WA */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Tombol Verifikasi Langsung */}
                            {isMenunggu && (
                              <>
                                <button
                                  type="button"
                                  disabled={isProcessing}
                                  onClick={() => handleVerifikasiOrder(order)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs flex items-center space-x-1 shadow-sm transition-all active:scale-95 cursor-pointer"
                                  title="Verifikasi dan tambahkan kuota ke QR santri"
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>Verifikasi</span>
                                </button>

                                <button
                                  type="button"
                                  disabled={isProcessing}
                                  onClick={() => handleTolakOrder(order)}
                                  className="p-1.5 rounded-xl bg-stone-100 hover:bg-rose-100 text-stone-500 hover:text-rose-700 border border-stone-200 transition-colors cursor-pointer"
                                  title="Tolak Pesanan"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            {/* Tombol WA Wali */}
                            {(santri?.no_hp || order.no_hp) && (
                              <a
                                href={`https://wa.me/${(santri?.no_hp || order.no_hp).replace(/[^0-9]/g, '')}?text=Assalamu%27alaikum%20Bpk%2FIbu%20Wali%20Santri%2C%20mengenai%20pesanan%20kuota%20tambahan%20${orderId}...`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-colors cursor-pointer"
                                title="Hubungi Wali via WhatsApp"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL PREVIEW BUKTI TRANSFER */}
        {previewBuktiModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
            onClick={() => setPreviewBuktiModal(null)}
          >
            <div
              className="relative max-w-2xl w-full bg-stone-900 rounded-3xl p-4 border border-stone-700 shadow-2xl space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between text-white border-b border-stone-800 pb-3 px-1">
                <h3 className="font-serif font-bold text-sm truncate">{previewBuktiModal.title}</h3>
                <button
                  type="button"
                  onClick={() => setPreviewBuktiModal(null)}
                  className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="overflow-hidden rounded-2xl bg-black flex items-center justify-center max-h-[75vh]">
                <img
                  src={previewBuktiModal.url}
                  alt="Bukti Transfer"
                  className="max-h-[75vh] w-auto object-contain mx-auto"
                />
              </div>

              <div className="flex justify-end pt-1">
                <a
                  href={previewBuktiModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white text-xs font-bold inline-flex items-center space-x-1.5 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Buka Gambar Ukuran Penuh</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* MODAL TAMBAH MANUAL PANITIA (KASIR) */}
        {showAddManualModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border-2 border-[#D5C4B4] space-y-5 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-amber-800" />
                  </div>
                  <div>
                    <h4 className="font-serif font-black text-base text-[#422F21]">
                      Tambah Kuota Manual (Kasir)
                    </h4>
                    <p className="text-xs text-stone-500">Entri kuota kas tunai atau transfer panitia</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddManualModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-stone-100 text-stone-500 hover:text-stone-800 flex items-center justify-center transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitTambahManual} className="space-y-4 text-xs">
                {/* Cari Santri */}
                <div className="space-y-1.5">
                  <label className="font-bold text-[#422F21] block">Cari &amp; Pilih Santri:</label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchSantriText}
                      onChange={(e) => {
                        setSearchSantriText(e.target.value);
                        setSelectedSantriKode('');
                      }}
                      placeholder="Ketik nama santri, wali, atau kode SHxxxx..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#D5C4B4] bg-[#FAF7F3] focus:bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#8C6A47]"
                    />
                  </div>

                  {/* Dropdown hasil cari santri */}
                  {filteredSantriList.length > 0 && !selectedSantriKode && (
                    <div className="max-h-44 overflow-y-auto border border-[#D5C4B4] rounded-xl bg-white shadow-lg divide-y divide-stone-100">
                      {filteredSantriList.map((s) => (
                        <button
                          key={s.id || s.kode}
                          type="button"
                          onClick={() => {
                            setSelectedSantriKode(s.kode);
                            setSearchSantriText(`${s.nama} (${s.kode})`);
                          }}
                          className="w-full text-left p-2.5 hover:bg-[#FAF0E6] transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <div>
                            <div className="font-bold text-[#422F21]">{s.nama}</div>
                            <div className="text-[10px] text-stone-500">
                              Wali: {s.nama_wali || s.nama} · Kelas {s.kelas || '-'}
                            </div>
                          </div>
                          <span className="font-mono text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                            {s.kode}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedSantri && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 font-medium flex items-center justify-between">
                      <div>
                        <span className="font-bold block">{selectedSantri.nama}</span>
                        <span className="text-[10px] text-emerald-800">
                          Wali: {selectedSantri.nama_wali} · Sisa Tambahan Aktif: +{selectedSantri.kuota_tambahan || 0}
                        </span>
                      </div>
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    </div>
                  )}
                </div>

                {/* Stepper Jumlah Kursi */}
                <div className="space-y-1.5">
                  <label className="font-bold text-[#422F21] block">Jumlah Kuota Tambahan:</label>
                  <div className="flex items-center space-x-3 p-3 bg-[#FAF7F3] rounded-xl border border-[#D5C4B4]">
                    <button
                      type="button"
                      onClick={() => setManualJumlah(Math.max(1, manualJumlah - 1))}
                      className="w-9 h-9 rounded-lg bg-white border border-stone-300 font-black text-sm cursor-pointer hover:bg-stone-100 active:scale-95"
                    >
                      −
                    </button>
                    <span className="font-serif font-black text-lg text-[#422F21] w-8 text-center">
                      {manualJumlah}
                    </span>
                    <button
                      type="button"
                      onClick={() => setManualJumlah(manualJumlah + 1)}
                      className="w-9 h-9 rounded-lg bg-[#8C6A47] text-white font-black text-sm cursor-pointer hover:bg-[#735334] active:scale-95"
                    >
                      +
                    </button>
                    <div className="flex-1 text-right text-xs">
                      <span className="text-stone-500">Total:</span>{' '}
                      <strong className="text-emerald-700 font-serif font-black text-sm">
                        Rp {(manualJumlah * 80000).toLocaleString('id-ID')}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Metode Pembayaran */}
                <div className="space-y-1.5">
                  <label className="font-bold text-[#422F21] block">Metode Pembayaran:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setManualMetode('TUNAI')}
                      className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer ${
                        manualMetode === 'TUNAI'
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                          : 'bg-[#FAF7F3] text-stone-700 border-[#D5C4B4]'
                      }`}
                    >
                      <Banknote className="w-4 h-4" />
                      <span>Kas Tunai</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualMetode('TRANSFER')}
                      className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer ${
                        manualMetode === 'TRANSFER'
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                          : 'bg-[#FAF7F3] text-stone-700 border-[#D5C4B4]'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Transfer BRI</span>
                    </button>
                  </div>
                </div>

                {/* Checkboxes Options */}
                <div className="space-y-2 pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-[#422F21]">
                    <input
                      type="checkbox"
                      checked={manualLangsungVerifikasi}
                      onChange={(e) => setManualLangsungVerifikasi(e.target.checked)}
                      className="rounded border-[#D5C4B4] text-[#8C6A47] focus:ring-[#8C6A47] w-4 h-4"
                    />
                    <span>Langsung Verifikasi &amp; Aktifkan Kuota Santri</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-[#422F21]">
                    <input
                      type="checkbox"
                      checked={manualKirimWa}
                      onChange={(e) => setManualKirimWa(e.target.checked)}
                      className="rounded border-[#D5C4B4] text-[#8C6A47] focus:ring-[#8C6A47] w-4 h-4"
                    />
                    <span>Kirim Notifikasi WhatsApp Konfirmasi ke Wali Santri</span>
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddManualModal(false)}
                    className="flex-1 py-3 rounded-2xl border border-[#D5C4B4] text-stone-600 hover:bg-[#FAF7F3] font-bold cursor-pointer transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingManual || !selectedSantriKode}
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#8C6A47] to-[#A47E57] hover:brightness-105 disabled:opacity-50 text-white font-bold transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    {isSubmittingManual ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-amber-200" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-amber-200" />
                        <span>Simpan Transaksi</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
