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
} from 'lucide-react';
import { store } from '@/lib/mock-data';

const getLiveBaseUrl = () => {
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'https://absensi-haul-haflah-p3tq-mhmtq-2027.vercel.app';
};

export default function VerifikasiPage() {
  const [pembelianList, setPembelianList] = useState(() => store.getPembelianList());
  const [paguInfo, setPaguInfo] = useState(() => store.getPaguInfo());
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [catatan, setCatatan] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ tipe: 'success' | 'error'; text: string } | null>(null);
  const [previewBuktiModal, setPreviewBuktiModal] = useState<{ url: string; title: string } | null>(null);

  // Filter & Search Pesanan
  const [filterStatus, setFilterStatus] = useState<'SEMUA' | 'MENUNGGU' | 'DIVERIFIKASI' | 'BATAL'>('SEMUA');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Tambah Manual & Verifikasi Langsung
  const [showAddManualModal, setShowAddManualModal] = useState(false);
  const [searchSantriText, setSearchSantriText] = useState('');
  const [selectedKeluargaId, setSelectedKeluargaId] = useState('');
  const [manualJumlah, setManualJumlah] = useState(1);
  const [manualMetode, setManualMetode] = useState<'TUNAI' | 'TRANSFER'>('TUNAI');
  const [manualLangsungVerifikasi, setManualLangsungVerifikasi] = useState(true);
  const [manualCatatan, setManualCatatan] = useState('');
  const [manualKirimWa, setManualKirimWa] = useState(true);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [sendingWaId, setSendingWaId] = useState<string | null>(null);

  // Form 4-Mata untuk Refund Tunai Hari-H (§6.5 & §15)
  const [showModalRefundTunai, setShowModalRefundTunai] = useState(false);
  const [panitia1, setPanitia1] = useState('Ahmad Yuwafin (Bendahara)');
  const [panitia2, setPanitia2] = useState('');
  const [fotoTandaTangan, setFotoTandaTangan] = useState('');

  const keluargaList = useMemo(() => store.getKeluargaList(), []);

  const refresh = () => {
    store.evaluasiBatasWaktu();
    setPembelianList([...store.getPembelianList()]);
    setPaguInfo(store.getPaguInfo());
  };

  // Auto-sync evaluator setiap 15 detik untuk memproses pesanan 6 jam dan 12 jam
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, []);

  const getSisaWaktuLabel = (targetIso?: string) => {
    if (!targetIso) return '-';
    const diff = new Date(targetIso).getTime() - Date.now();
    if (diff <= 0) return '0 menit (Habis)';
    const hours = Math.floor(diff / (3600 * 1000));
    const minutes = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
    if (hours > 0) return `${hours}j ${minutes}m lagi`;
    return `${minutes} menit lagi`;
  };

  // Filter santri untuk autocomplete di modal tambah manual
  const filteredSantriList = useMemo(() => {
    if (!searchSantriText.trim()) {
      return keluargaList.slice(0, 15);
    }
    const q = searchSantriText.toLowerCase();
    return keluargaList
      .filter((k) => {
        const santri = k.santri?.[0];
        return (
          santri?.nama.toLowerCase().includes(q) ||
          k.namaWali.toLowerCase().includes(q) ||
          k.kode.toLowerCase().includes(q) ||
          santri?.kelas.toLowerCase().includes(q) ||
          santri?.kategoriUtama.toLowerCase().includes(q) ||
          santri?.subKategori.toLowerCase().includes(q)
        );
      })
      .slice(0, 25);
  }, [keluargaList, searchSantriText]);

  // Santri yang sedang dipilih di form manual
  const selectedKeluarga = useMemo(() => {
    return keluargaList.find((k) => k.id === selectedKeluargaId) || null;
  }, [keluargaList, selectedKeluargaId]);

  // Filter pesanan di tabel
  const filteredOrders = useMemo(() => {
    return pembelianList.filter((order) => {
      const kel = keluargaList.find((k) => k.id === order.keluargaId);
      const santri = kel?.santri?.[0];

      // Filter status
      if (filterStatus === 'MENUNGGU') {
        if (order.status !== 'MENUNGGU_VERIFIKASI' && order.status !== 'DIPESAN') return false;
      } else if (filterStatus === 'DIVERIFIKASI') {
        if (order.status !== 'DIVERIFIKASI') return false;
      } else if (filterStatus === 'BATAL') {
        if (order.status !== 'DIBATALKAN_REFUND' && order.status !== 'DITOLAK' && order.status !== 'KEDALUWARSA') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = order.id.toLowerCase().includes(q);
        const matchWali = kel?.namaWali.toLowerCase().includes(q);
        const matchSantri = santri?.nama.toLowerCase().includes(q);
        const matchKode = kel?.kode.toLowerCase().includes(q);
        return matchId || matchWali || matchSantri || matchKode;
      }

      return true;
    });
  }, [pembelianList, keluargaList, filterStatus, searchQuery]);

  // Handler Verifikasi Langsung / Tolak
  const handleVerifikasi = async (orderId: string, setuju: boolean) => {
    setStatusMsg(null);
    const res = store.verifikasiPembelian(orderId, setuju, catatan);
    if (res.ok) {
      const order = pembelianList.find((p) => p.id === orderId);
      const kel = keluargaList.find((k) => k.id === order?.keluargaId);
      const santri = kel?.santri?.[0];

      setStatusMsg({
        tipe: 'success',
        text: setuju
          ? `Pembayaran ${orderId} (${santri?.nama || 'Santri'}) berhasil disetujui! Kuota tambahan otomatis aktif pada QR santri.`
          : `Pembayaran ${orderId} ditolak. Kuota telah dikembalikan ke pagu global.`,
      });
      refresh();
      setSelectedOrder(null);
      setCatatan('');

      // Kirim konfirmasi WA ke wali santri jika disetujui
      if (setuju && kel?.noHp && kel.noHp !== '-' && kel.noHp.length >= 9) {
        try {
          const totalKuota = (kel.kuota?.kuotaDasar || 2) + (kel.kuota?.kuotaTambahan || 0);
          const pesanWali = `Assalamu'alaikum Wr. Wb.\n\n` +
            `Yth. Bapak/Ibu *${kel.namaWali}*,\n` +
            `Alhamdulillah, pembayaran pesanan kuota tambahan Anda untuk santri *${santri?.nama}* telah *DIVERIFIKASI RESMI* oleh Panitia.\n\n` +
            `📋 *Rincian Status Kuota*:\n` +
            `• ID Pesanan: ${orderId}\n` +
            `• Tambahan: +${order?.jumlah} Kursi (Rp ${order?.totalBayar.toLocaleString('id-ID')})\n` +
            `• Total Kuota Keluarga: *${totalKuota} Kursi*\n` +
            `• Status: *Aktif pada QR Code Santri*\n\n` +
            `Tautan E-Undangan & Barcode Presensi Resmi:\n` +
            `🔗 ${getLiveBaseUrl()}/u/${kel.kode}-resmi\n\n` +
            `Terima kasih atas partisipasi Anda.\n` +
            `_Panitia Haul & Haflah P3TQ - MHMTQ_`;

          await fetch('/api/whatsapp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              target: kel.noHp,
              message: pesanWali,
            }),
          });
        } catch (err) {
          console.error('Error auto-sending WA to wali:', err);
        }
      }
    }
  };

  // Handler Tambah Manual & Verifikasi Langsung
  const handleSubmitTambahManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKeluargaId) {
      alert('Pilih santri terlebih dahulu dari daftar 549 santri!');
      return;
    }
    if (manualJumlah <= 0) {
      alert('Jumlah kuota minimal 1 kursi!');
      return;
    }
    if (manualJumlah > paguInfo.sisa) {
      alert(`Sisa kuota global saat ini hanya ${paguInfo.sisa} unit!`);
      return;
    }

    setIsSubmittingManual(true);
    try {
      const res = store.tambahPesananManual({
        keluargaId: selectedKeluargaId,
        jumlah: manualJumlah,
        metodeBayar: manualMetode,
        langsungVerifikasi: manualLangsungVerifikasi,
        catatan: manualCatatan,
      });

      if (!res.ok) {
        setStatusMsg({ tipe: 'error', text: res.pesan || 'Gagal menambahkan pesanan manual' });
        setIsSubmittingManual(false);
        return;
      }

      const kel = selectedKeluarga;
      const santri = kel?.santri?.[0];

      // Kirim pesan WhatsApp otomatis ke wali santri jika opsi dicentang
      if (manualKirimWa && kel?.noHp && kel.noHp !== '-' && kel.noHp.length >= 9) {
        const totalBiaya = manualJumlah * 80000;
        const totalKuota = (kel.kuota?.kuotaDasar || 2) + (kel.kuota?.kuotaTambahan || 0);

        const pesanWa = manualLangsungVerifikasi
          ? `Assalamu'alaikum Wr. Wb.\n\n` +
            `Yth. Bapak/Ibu *${kel.namaWali}*,\n` +
            `Panitia Haul & Haflah P3TQ - MHMTQ telah menambahkan *${manualJumlah} Kuota Tambahan* secara langsung untuk santri *${santri?.nama}* (${santri?.kelas}).\n\n` +
            `📋 *Rincian Status*:\n` +
            `• Metode: ${manualMetode === 'TUNAI' ? 'Kas Tunai di Sekretariat' : 'Transfer Rekening BRI'}\n` +
            `• Jumlah: +${manualJumlah} Kursi (Rp ${totalBiaya.toLocaleString('id-ID')})\n` +
            `• Total Jatah Masuk: *${totalKuota} Kursi*\n` +
            `• Status: *DIVERIFIKASI LANGSUNG (Aktif)*\n\n` +
            `Silakan akses E-Undangan Anda:\n` +
            `🔗 ${getLiveBaseUrl()}/u/${kel.kode}-resmi\n\n` +
            `_Panitia Haul & Haflah P3TQ - MHMTQ_`
          : `Assalamu'alaikum Wr. Wb.\n\n` +
            `Yth. Bapak/Ibu *${kel.namaWali}*,\n` +
            `Pesanan *${manualJumlah} Kuota Tambahan* untuk santri *${santri?.nama}* telah dicatat oleh Panitia.\n` +
            `Total: Rp ${totalBiaya.toLocaleString('id-ID')}.\n` +
            `Mohon lakukan pelunasan agar kuota segera diaktifkan pada QR Code.\n\n` +
            `_Panitia Haul & Haflah P3TQ - MHMTQ_`;

        try {
          await fetch('/api/whatsapp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              target: kel.noHp,
              message: pesanWa,
            }),
          });
        } catch (err) {
          console.error('Gagal kirim WhatsApp ke wali:', err);
        }
      }

      setStatusMsg({
        tipe: 'success',
        text: res.pesan || 'Pesanan manual berhasil ditambahkan!',
      });
      refresh();
      setShowAddManualModal(false);
      setSelectedKeluargaId('');
      setSearchSantriText('');
      setManualJumlah(1);
      setManualCatatan('');
    } catch (err: any) {
      setStatusMsg({ tipe: 'error', text: err.message || 'Terjadi kesalahan sistem' });
    } finally {
      setIsSubmittingManual(false);
    }
  };

  // Handler Kirim Notif WhatsApp Manual (Tombol di Baris Tabel)
  const handleKirimWaOrder = async (order: any, tipe: 'PANITIA' | 'WALI') => {
    const kel = keluargaList.find((k) => k.id === order.keluargaId);
    const santri = kel?.santri?.[0];
    setSendingWaId(order.id);

    try {
      if (tipe === 'PANITIA') {
        const pesan = `🔔 *PENGINGAT VERIFIKASI KUOTA TAMBAHAN*\n*Haul & Haflah P3TQ - MHMTQ*\n\n` +
          `Yth. Panitia / Bendahara,\n` +
          `Mohon segera ditanggapi pesanan kuota tambahan berikut:\n\n` +
          `👤 *Wali*: ${kel?.namaWali}\n` +
          `🧕 *Santri*: ${santri?.nama} (${santri?.kategoriUtama} - ${santri?.kelas})\n` +
          `🎫 *Jumlah*: ${order.jumlah} Kursi\n` +
          `💰 *Total*: Rp ${order.totalBayar.toLocaleString('id-ID')}\n` +
          `🆔 *ID*: ${order.id}\n` +
          `📌 *Status*: ${order.status}\n\n` +
          `Akses Panel Verifikasi:\n` +
          `🔗 ${getLiveBaseUrl()}/admin/verifikasi\n\n` +
          `_Pesan Otomatis Gateway Panitia_`;

        const res = await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: '085181805377',
            message: pesan,
          }),
        });
        const json = await res.json();
        if (json.ok) {
          alert('Pesan notifikasi WhatsApp berhasil dikirim ke nomor Panitia (085181805377).');
        } else {
          alert(`Gateway WA respon: ${json.message || 'Gagal'}`);
        }
      } else {
        if (!kel?.noHp || kel.noHp === '-' || kel.noHp.length < 9) {
          alert(`Nomor HP wali ${kel?.namaWali} tidak tersedia.`);
          return;
        }

        const pesan = `Assalamu'alaikum Wr. Wb.\n\n` +
          `Yth. Bapak/Ibu *${kel?.namaWali}*,\n` +
          `Pemberitahuan status pesanan kuota tambahan santri *${santri?.nama}*:\n` +
          `• ID: ${order.id}\n` +
          `• Jumlah: ${order.jumlah} Kursi (Rp ${order.totalBayar.toLocaleString('id-ID')})\n` +
          `• Status Saat Ini: *${order.status}*\n\n` +
          `Tautan Undangan & Pembelian:\n` +
          `🔗 ${getLiveBaseUrl()}/beli/${kel?.kode}-resmi\n\n` +
          `_Panitia Haul & Haflah P3TQ - MHMTQ_`;

        const res = await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: kel.noHp,
            message: pesan,
          }),
        });
        const json = await res.json();
        if (json.ok) {
          alert(`Pesan notifikasi WhatsApp berhasil dikirim ke Wali Santri (${kel.noHp}).`);
        } else {
          alert(`Gateway WA respon: ${json.message || 'Gagal'}`);
        }
      }
    } catch (err: any) {
      alert(`Gagal mengirim WhatsApp: ${err.message}`);
    } finally {
      setSendingWaId(null);
    }
  };

  // Handler Protokol 4-Mata Refund Tunai Hari-H
  const handleProsesRefundTunai = () => {
    if (!panitia2.trim()) {
      alert('Prinsip Empat Mata: Nama Panitia Inti Kedua wajib diisi sebelum mengeluarkan uang kas tunai!');
      return;
    }
    if (!selectedOrder) return;

    selectedOrder.catatanPanitia = `Refund tunai Rp ${selectedOrder.totalBayar.toLocaleString('id-ID')} disaksikan oleh ${panitia1} dan ${panitia2}. Bukti tanda tangan terlampir.`;
    store.batalkanPembelian(selectedOrder.id, 'TUNAI_HARI_H');
    refresh();
    setShowModalRefundTunai(false);
    setSelectedOrder(null);
    setStatusMsg({
      tipe: 'success',
      text: 'Refund kas tunai berhasil diproses sesuai protokol kendali ganda empat mata.',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Panel Verifikasi: Warm Latte & Cinnamon Mocha Aesthetic */}
      <div className="bg-[#FAF7F3] rounded-3xl p-6 shadow-sm border-2 border-[#D5C4B4] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#EFE8E1] text-[#8C6A47] border-2 border-[#8C6A47]/40 flex items-center justify-center font-bold shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-[#422F21]">
                Verifikasi Mutasi & Kuota Tambahan
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#EFE8E1] text-[#422F21] border border-[#D5C4B4] uppercase">
                Panel Panitia
              </span>
            </div>
            <p className="text-xs text-[#7A624E] mt-0.5">
              Rekening Resmi: <strong>BRI 320701010266508</strong> a.n. Ahmad Chamdan Yuwafin · Pagu 300 Kursi
            </p>
          </div>
        </div>

        {/* Ringkasan Pagu & Tombol Tambah Manual */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-[#EFE8E1] border border-[#D5C4B4] px-4 py-2 rounded-2xl flex items-center space-x-4 text-xs">
            <div>
              <span className="text-[#8C6A47] block text-[10px] font-bold uppercase">Pagu Terjual:</span>
              <span className="font-black text-[#422F21] text-sm">
                {paguInfo.terjual} / {paguInfo.paguTotal}
              </span>
            </div>
            <div className="border-l border-[#D5C4B4] pl-4">
              <span className="text-[#8C6A47] block text-[10px] font-bold uppercase">Sisa Tersedia:</span>
              <span className="font-black text-emerald-800 text-sm">{paguInfo.sisa} unit</span>
            </div>
          </div>

          {/* Tombol Evaluasi Batas Waktu (6 Jam / 12 Jam Auto-Approve) */}
          <button
            type="button"
            onClick={refresh}
            className="px-3.5 py-2.5 rounded-2xl bg-[#EFE8E1] hover:bg-[#E5DACF] text-[#422F21] text-xs font-bold border border-[#D5C4B4] flex items-center space-x-1.5 transition-colors shadow-xs"
            title="Periksa dan proses pesanan yang telah melewati batas 6 jam (kedaluwarsa) atau 12 jam (auto-approve)"
          >
            <Clock className="w-3.5 h-3.5 text-[#8C6A47]" />
            <span>Cek Batas Waktu</span>
          </button>

          {/* Tombol Utama: Tambah Manual & Verifikasi Langsung */}
          <button
            type="button"
            onClick={() => setShowAddManualModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#8C6A47] via-[#A47E57] to-[#8C6A47] hover:brightness-105 text-white font-black text-xs shadow-md border-2 border-white flex items-center space-x-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="w-5 h-5 rounded-lg bg-white/30 flex items-center justify-center text-white">
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span>+ Tambah Manual & Verifikasi Langsung</span>
          </button>
        </div>
      </div>

      {/* Alert Status Pesan */}
      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between space-x-3 ${
            statusMsg.tipe === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
              : 'bg-rose-50 text-rose-900 border border-rose-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2
              className={`w-5 h-5 shrink-0 ${
                statusMsg.tipe === 'success' ? 'text-emerald-600' : 'text-rose-600'
              }`}
            />
            <span className="font-medium leading-relaxed">{statusMsg.text}</span>
          </div>
          <button
            onClick={() => setStatusMsg(null)}
            className="text-slate-400 hover:text-slate-600 font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Kontrol Filter & Pencarian Pesanan */}
      <div className="bg-[#FAF7F3] rounded-3xl p-5 shadow-sm border-2 border-[#D5C4B4] space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Filter Status Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            <button
              onClick={() => setFilterStatus('SEMUA')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                filterStatus === 'SEMUA'
                  ? 'bg-[#8C6A47] text-white shadow-sm font-bold border border-[#735334]'
                  : 'bg-[#EFE8E1] text-[#422F21] hover:bg-[#E5DCD2]'
              }`}
            >
              Semua Transaksi ({pembelianList.length})
            </button>
            <button
              onClick={() => setFilterStatus('MENUNGGU')}
              className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-colors ${
                filterStatus === 'MENUNGGU'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                Menunggu Verifikasi (
                {
                  pembelianList.filter((p) => p.status === 'MENUNGGU_VERIFIKASI' || p.status === 'DIPESAN').length
                }
                )
              </span>
            </button>
            <button
              onClick={() => setFilterStatus('DIVERIFIKASI')}
              className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-colors ${
                filterStatus === 'DIVERIFIKASI'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>
                Diverifikasi ({pembelianList.filter((p) => p.status === 'DIVERIFIKASI').length})
              </span>
            </button>
            <button
              onClick={() => setFilterStatus('BATAL')}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                filterStatus === 'BATAL'
                  ? 'bg-rose-700 text-white shadow-sm'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              Refund / Batal (
              {
                pembelianList.filter((p) => p.status === 'DIBATALKAN_REFUND' || p.status === 'DITOLAK').length
              }
              )
            </button>
          </div>

          {/* Search Box */}
          <div className="relative md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari ID, santri, atau wali..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pesantren-700 bg-slate-50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Tabel Transaksi Kuota */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">ID PESANAN</th>
                <th className="py-3 px-3">WALI & SANTRI</th>
                <th className="py-3 px-3">KATEGORI</th>
                <th className="py-3 px-3">JUMLAH</th>
                <th className="py-3 px-3">TOTAL</th>
                <th className="py-3 px-3">BUKTI / METODE</th>
                <th className="py-3 px-3">STATUS</th>
                <th className="py-3 px-3 text-right">AKSI VERIFIKASI & WA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ada transaksi kuota tambahan yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const kel = keluargaList.find((k) => k.id === order.keluargaId);
                  const santri = kel?.santri?.[0];

                  const isMenunggu = order.status === 'MENUNGGU_VERIFIKASI' || order.status === 'DIPESAN';
                  const isDiverifikasi = order.status === 'DIVERIFIKASI';

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-mono text-slate-700 font-bold block">{order.id}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(order.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{kel?.namaWali || 'Wali Santri'}</div>
                        <div className="text-[11px] text-slate-600 flex items-center space-x-1">
                          <span className="font-medium text-pesantren-900">{santri?.nama || '-'}</span>
                          <span className="text-slate-400">({santri?.kelas || '-'})</span>
                        </div>
                        {kel?.noHp && kel.noHp !== '-' && (
                          <div className="text-[10px] text-slate-400 font-mono flex items-center space-x-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5 text-emerald-600" />
                            <span>{kel.noHp}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {santri?.kategoriUtama === 'BIL_GHOIB' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Bil Ghoib
                          </span>
                        )}
                        {santri?.kategoriUtama === 'BIN_NADZOR' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                            Bin Nadzori
                          </span>
                        )}
                        {santri?.kategoriUtama === 'TAMATAN' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            Tamatan
                          </span>
                        )}
                        {!santri?.kategoriUtama && <span className="text-slate-400">-</span>}
                      </td>

                      <td className="py-3 px-3 font-bold text-slate-800">
                        <span className="text-sm font-black text-slate-900">{order.jumlah}</span> Kursi
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-black text-slate-900">
                          Rp {order.totalBayar.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-slate-400">@ Rp 80.000</div>
                      </td>

                      <td className="py-3 px-3">
                        {order.buktiUrl ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewBuktiModal({
                                url: order.buktiUrl!,
                                title: `Foto Bukti Transfer - ${order.id} (${kel?.namaWali || 'Wali Santri'})`,
                              })
                            }
                            className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold border border-blue-200 transition-colors shadow-xs"
                            title="Klik untuk melihat foto struk transfer langsung"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Lihat Foto Bukti</span>
                          </button>
                        ) : order.catatanPanitia?.includes('TUNAI') ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                            <Banknote className="w-3 h-3" />
                            <span>Kas Tunai</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Belum diunggah</span>
                        )}
                        {order.catatanPanitia && (
                          <div className="text-[10px] text-slate-500 truncate max-w-[150px] mt-0.5" title={order.catatanPanitia}>
                            {order.catatanPanitia}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {order.status === 'DIVERIFIKASI' && (
                          <div className="space-y-1">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center space-x-1 w-fit">
                              <Check className="w-3 h-3" />
                              <span>Diverifikasi</span>
                            </span>
                            {order.autoApprovedBySystem ? (
                              <span className="inline-block text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                Otomatis Berhasil (12 Jam)
                              </span>
                            ) : (
                              <span className="inline-block text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                Manual Panitia
                              </span>
                            )}
                          </div>
                        )}
                        {order.status === 'MENUNGGU_VERIFIKASI' && (
                          <div className="space-y-1">
                            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center space-x-1 w-fit">
                              <Clock className="w-3 h-3" />
                              <span>Menunggu Mutasi</span>
                            </span>
                            <div className="text-[10px] text-amber-900 font-medium">
                              Target SLA: <strong>{getSisaWaktuLabel(order.batasVerifikasiAt)}</strong>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Auto-Approve: <strong>{getSisaWaktuLabel(order.autoApproveAt)}</strong>
                            </div>
                          </div>
                        )}
                        {order.status === 'DIPESAN' && (
                          <div className="space-y-1">
                            <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center space-x-1 w-fit">
                              <Clock className="w-3 h-3" />
                              <span>Terkunci 6 Jam</span>
                            </span>
                            <div className="text-[10px] text-blue-900 font-medium">
                              Sisa waktu: <strong>{getSisaWaktuLabel(order.kedaluwarsaAt)}</strong>
                            </div>
                          </div>
                        )}
                        {order.status === 'KEDALUWARSA' && (
                          <div className="space-y-1">
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center space-x-1 w-fit">
                              <X className="w-3 h-3" />
                              <span>Kedaluwarsa (6 Jam)</span>
                            </span>
                          </div>
                        )}
                        {order.status === 'DIBATALKAN_REFUND' && (
                          <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-xs flex items-center space-x-1 w-fit">
                            <RotateCcw className="w-3 h-3" />
                            <span>Refund</span>
                          </span>
                        )}
                        {order.status === 'DITOLAK' && (
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center space-x-1 w-fit">
                            <X className="w-3 h-3" />
                            <span>Ditolak</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Aksi 1-Klik Verifikasi Langsung untuk status menunggu atau dipesan */}
                          {isMenunggu && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleVerifikasi(order.id, true)}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center space-x-1 shadow-sm transition-all hover:scale-105"
                                title="Setujui dan aktifkan kuota tambahan langsung ke santri"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Verifikasi Langsung</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleVerifikasi(order.id, false)}
                                className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 border border-slate-200 transition-colors"
                                title="Tolak Pesanan"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {/* Tombol Notifikasi WhatsApp */}
                          <button
                            type="button"
                            disabled={sendingWaId === order.id}
                            onClick={() => handleKirimWaOrder(order, 'PANITIA')}
                            className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-colors"
                            title="Kirim Notifikasi WhatsApp ke Panitia (085181805377) agar segera ditanggapi"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>

                          {kel?.noHp && kel.noHp !== '-' && (
                            <button
                              type="button"
                              disabled={sendingWaId === order.id}
                              onClick={() => handleKirimWaOrder(order, 'WALI')}
                              className="p-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 transition-colors"
                              title={`Hubungi / Kirim WhatsApp ke Wali Santri (${kel.noHp})`}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Tombol Refund Tunai untuk yang sudah Diverifikasi */}
                          {isDiverifikasi && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowModalRefundTunai(true);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-rose-700 font-bold border border-slate-200 flex items-center space-x-1 text-[11px] transition-colors"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Refund Tunai Hari-H</span>
                            </button>
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

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH MANUAL & VERIFIKASI LANGSUNG OLEH PANITIA                   */}
      {/* ========================================================================= */}
      {showAddManualModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full space-y-5 shadow-2xl border-2 border-gold-400/50 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Tambah Kuota Manual & Verifikasi Langsung
                  </h3>
                  <p className="text-xs text-slate-500">
                    Panitia dapat menginput kuota tambahan bagi santri & memverifikasi seketika.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddManualModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitTambahManual} className="space-y-4 text-xs">
              {/* 1. Pilih Santri dari 549 Data */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  1. Pilih Santri (549 Data Santri Terdaftar):
                </label>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchSantriText}
                    onChange={(e) => setSearchSantriText(e.target.value)}
                    placeholder="Ketik nama santri, nama wali, atau kelas..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-pesantren-700"
                  />
                </div>

                {/* Dropdown / Scroll list santri */}
                <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 divide-y divide-slate-100">
                  {filteredSantriList.map((k) => {
                    const santri = k.santri?.[0];
                    const isSelected = selectedKeluargaId === k.id;
                    const kuotaAktif = (k.kuota?.kuotaDasar || 2) + (k.kuota?.kuotaTambahan || 0);

                    return (
                      <div
                        key={k.id}
                        onClick={() => setSelectedKeluargaId(k.id)}
                        className={`p-2.5 cursor-pointer flex items-center justify-between transition-colors ${
                          isSelected ? 'bg-amber-100/90 font-bold border-l-4 border-amber-600' : 'hover:bg-slate-100'
                        }`}
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-900 font-bold">{santri?.nama}</span>
                            <span className="text-[10px] text-slate-500">({santri?.kelas})</span>
                            {santri?.kategoriUtama === 'BIL_GHOIB' && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-200 text-emerald-900 font-bold">
                                Bil Ghoib
                              </span>
                            )}
                            {santri?.kategoriUtama === 'BIN_NADZOR' && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-200 text-blue-900 font-bold">
                                Bin Nadzori
                              </span>
                            )}
                            {santri?.kategoriUtama === 'TAMATAN' && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-200 text-amber-900 font-bold">
                                Tamatan
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Wali: {k.namaWali} · Kode: <span className="font-mono">{k.kode}</span>
                            {k.noHp && k.noHp !== '-' && ` · HP: ${k.noHp}`}
                          </div>
                        </div>

                        <div className="text-right text-[11px] shrink-0 ml-2">
                          <span className="text-slate-400">Kuota Saat Ini:</span>{' '}
                          <span className="font-bold text-slate-800">{kuotaAktif} Kursi</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Info Santri Terpilih */}
                {selectedKeluarga && (
                  <div className="mt-2.5 p-3 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">
                        SANTRI DIPILIH:
                      </div>
                      <div className="text-sm font-black text-slate-900">
                        {selectedKeluarga.santri?.[0]?.nama}
                      </div>
                      <div className="text-xs text-slate-600">
                        Wali: <strong>{selectedKeluarga.namaWali}</strong> · Kelas:{' '}
                        {selectedKeluarga.santri?.[0]?.kelas}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                        Kode: {selectedKeluarga.kode}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Stepper Jumlah Kuota & Total Biaya */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <label className="block font-bold text-slate-800">
                    2. Jumlah Kursi Tambahan:
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setManualJumlah(Math.max(1, manualJumlah - 1))}
                      className="w-9 h-9 rounded-xl bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-black text-xl text-slate-900">
                      {manualJumlah}
                    </span>
                    <button
                      type="button"
                      onClick={() => setManualJumlah(Math.min(paguInfo.sisa, manualJumlah + 1))}
                      className="w-9 h-9 rounded-xl bg-amber-500 text-slate-900 font-bold text-lg hover:bg-amber-600"
                    >
                      +
                    </button>
                    <span className="text-slate-500 text-[11px]">
                      (Sisa pagu: {paguInfo.sisa})
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex flex-col justify-center">
                  <span className="text-[10px] text-slate-400 font-medium">TOTAL NOMINAL PEMBAYARAN:</span>
                  <span className="text-xl font-black text-gold-400 mt-0.5">
                    Rp {(manualJumlah * 80000).toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {manualJumlah} Kursi @ Rp 80.000 / orang
                  </span>
                </div>
              </div>

              {/* 3. Metode Pembayaran */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  3. Metode Pembayaran:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`p-3 rounded-2xl border cursor-pointer flex items-center space-x-2.5 transition-all ${
                      manualMetode === 'TUNAI'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="metodeBayar"
                      value="TUNAI"
                      checked={manualMetode === 'TUNAI'}
                      onChange={() => setManualMetode('TUNAI')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-xs">💵 Uang Tunai (Kasir)</div>
                      <div className="text-[10px] text-slate-500 font-normal">Diterima langsung di sekretariat</div>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-2xl border cursor-pointer flex items-center space-x-2.5 transition-all ${
                      manualMetode === 'TRANSFER'
                        ? 'border-blue-500 bg-blue-50 text-blue-950 font-bold shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="metodeBayar"
                      value="TRANSFER"
                      checked={manualMetode === 'TRANSFER'}
                      onChange={() => setManualMetode('TRANSFER')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-xs">💳 Transfer Bank BRI</div>
                      <div className="text-[10px] text-slate-500 font-normal">320701010266508 a.n. Yuwafin</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* 4. Sakelar Verifikasi Langsung */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-start space-x-2.5">
                <input
                  type="checkbox"
                  id="directVerifyCheck"
                  checked={manualLangsungVerifikasi}
                  onChange={(e) => setManualLangsungVerifikasi(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-emerald-700 rounded border-emerald-400 focus:ring-emerald-600"
                />
                <label htmlFor="directVerifyCheck" className="cursor-pointer">
                  <div className="font-bold text-emerald-950">
                    ✓ Langsung Verifikasi & Aktifkan Kuota Santri Seketika
                  </div>
                  <div className="text-[11px] text-emerald-800 leading-relaxed">
                    Kuota santri otomatis bertambah sekarang juga pada barcode scanner dan e-undangan wali santri tanpa perlu konfirmasi ulang.
                  </div>
                </label>
              </div>

              {/* 5. Catatan Panitia */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Panitia (Opsional):
                </label>
                <input
                  type="text"
                  value={manualCatatan}
                  onChange={(e) => setManualCatatan(e.target.value)}
                  placeholder="Contoh: Diterima tunai oleh Ust. Yuwafin di posko pendaftaran..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              {/* 6. Kirim WhatsApp ke Wali */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center space-x-2.5">
                <input
                  type="checkbox"
                  id="sendWaCheck"
                  checked={manualKirimWa}
                  onChange={(e) => setManualKirimWa(e.target.checked)}
                  className="w-4 h-4 text-pesantren-700 rounded border-slate-300 focus:ring-pesantren-600"
                />
                <label htmlFor="sendWaCheck" className="cursor-pointer flex-1">
                  <span className="font-bold text-slate-800">
                    Kirim Pesan WhatsApp Otomatis ke Wali Santri
                  </span>
                  <span className="block text-[10px] text-slate-500">
                    Notifikasi penambahan kuota akan dikirim ke nomor HP wali via gateway Fonnte.
                  </span>
                </label>
              </div>

              {/* Tombol Aksi Modal */}
              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddManualModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManual || !selectedKeluargaId}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pesantren-900 to-pesantren-800 hover:from-pesantren-800 hover:to-pesantren-700 text-white font-bold shadow flex items-center space-x-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>
                    {isSubmittingManual
                      ? 'Menyimpan...'
                      : manualLangsungVerifikasi
                      ? 'Simpan & Verifikasi Langsung'
                      : 'Simpan Pesanan'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL KENDALI GANDA EMPAT MATA REFUND TUNAI HARI-H (§6.5 & §15)           */}
      {/* ========================================================================= */}
      {showModalRefundTunai && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border-2 border-rose-300 animate-in zoom-in-95">
            <div className="flex items-center space-x-2 text-rose-700">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900">
                Protokol Empat Mata (Kendali Ganda Kas Tunai)
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Sesuai ketetapan panitia §6.5 & §15: Pengembalian uang kas tunai di hari-H senilai{' '}
              <strong>Rp {selectedOrder.totalBayar.toLocaleString('id-ID')}</strong> wajib dilakukan oleh minimal 2
              orang Panitia Inti bersama-sama.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Panitia Inti 1:</label>
                <input
                  type="text"
                  value={panitia1}
                  disabled
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Panitia Inti 2 (Wajib Saksi Kedua):
                </label>
                <input
                  type="text"
                  value={panitia2}
                  onChange={(e) => setPanitia2(e.target.value)}
                  placeholder="Ketik nama panitia inti kedua yang menyaksikan..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Foto Lembar Tanda Tangan Penerima (§15):
                </label>
                <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-slate-500">
                  <Camera className="w-5 h-5 mx-auto mb-1 text-slate-400" />
                  <span>Foto kwitansi/tanda tangan telah dilampirkan via kamera</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModalRefundTunai(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleProsesRefundTunai}
                className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow flex items-center space-x-1"
              >
                <Check className="w-4 h-4" />
                <span>Konfirmasi Pengeluaran Kas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pratinjau Foto Bukti Transfer Panitia */}
      {previewBuktiModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewBuktiModal(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-white rounded-3xl p-5 space-y-4 shadow-2xl border-2 border-slate-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>{previewBuktiModal.title}</span>
              </div>
              <button
                onClick={() => setPreviewBuktiModal(null)}
                className="p-1 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-50 rounded-2xl p-2 border border-slate-200">
              <img
                src={previewBuktiModal.url}
                alt="Foto Bukti Transfer"
                className="max-h-[65vh] w-auto object-contain rounded-xl shadow-sm"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-slate-500 italic">
                Panitia: Cocokkan nominal dan nama pengirim dengan rekening koran/mutasi BRI.
              </span>
              <button
                onClick={() => setPreviewBuktiModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
