'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingBag,
  CreditCard,
  Clock,
  Upload,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ShieldAlert,
  Info,
  RotateCcw,
  Camera,
  Image as ImageIcon,
  X,
  Eye,
  Loader2,
  MessageCircle,
  Check,
  Copy,
  User,
  Plus,
  Minus,
  History,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import NamaLembaga from '@/components/NamaLembaga';
import { calculateKuotaDasarSantri } from '@/lib/types';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

function formatTanggalIndo(isoString?: string) {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return (
      d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }) +
      ', ' +
      d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }) +
      ' WIB'
    );
  } catch (e) {
    return isoString;
  }
}

export default function BeliKuotaPage() {
  const params = useParams();
  const token = (params?.token as string) || '';
  const kodeSantri = (token.split('-')[0] || 'SH0001').toUpperCase();

  // State Data Santri & Sistem
  const [santri, setSantri] = useState<any | null>(null);
  const [loadingSantri, setLoadingSantri] = useState(true);

  const [kuotaSwitchAktif, setKuotaSwitchAktif] = useState<boolean>(true);
  const [totalDiverifikasiGlobal, setTotalDiverifikasiGlobal] = useState<number>(0);
  const [loadingControl, setLoadingControl] = useState<boolean>(true);

  // Fitur A: Transaksi list per santri
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);

  // Form State
  const [jumlahBeli, setJumlahBeli] = useState(1);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Upload State (Fitur B: Ganti Bukti)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [showFullImageModal, setShowFullImageModal] = useState(false);
  const [isChangingProof, setIsChangingProof] = useState(false);

  const [statusMsg, setStatusMsg] = useState<{ tipe: 'success' | 'error'; text: string } | null>(null);
  const [copiedRekening, setCopiedRekening] = useState(false);

  // Countdown State 6 Jam untuk Order MENUNGGU_PEMBAYARAN
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isExpired: boolean }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  // 1. Fetch Data Santri dari Supabase peserta_santri
  useEffect(() => {
    async function fetchSantri() {
      try {
        setLoadingSantri(true);
        const { data, error } = await supabase
          .from('peserta_santri')
          .select('*')
          .eq('kode', kodeSantri)
          .maybeSingle();

        if (data && !error) {
          setSantri(data);
        } else {
          setSantri(null);
        }
      } catch (e) {
        console.warn('Error fetching peserta_santri:', e);
        setSantri(null);
      } finally {
        setLoadingSantri(false);
      }
    }

    fetchSantri();
  }, [kodeSantri]);

  // 2. Fetch Control Status (Switch & Sisa Pagu Global)
  useEffect(() => {
    async function fetchControl() {
      try {
        setLoadingControl(true);
        const { data: configData } = await supabase
          .from('konfigurasi_sistem')
          .select('value')
          .eq('key', 'kuota_tambahan_status')
          .maybeSingle();

        if (configData && configData.value) {
          let isAktif = false;
          if (typeof configData.value === 'object' && configData.value !== null) {
            isAktif = Boolean(configData.value.aktif);
          } else if (typeof configData.value === 'string') {
            isAktif = configData.value === 'true' || configData.value === 'TRUE';
          } else if (typeof configData.value === 'boolean') {
            isAktif = configData.value;
          }
          setKuotaSwitchAktif(isAktif);
        } else {
          setKuotaSwitchAktif(false);
        }

        const { data: pembelianData } = await supabase
          .from('pembelian_kuota')
          .select('jumlah_kursi, status')
          .in('status', ['DIVERIFIKASI', 'DITERIMA']);

        if (pembelianData) {
          const sumDiverifikasi = pembelianData.reduce((acc: number, p: any) => {
            return acc + Number(p.jumlah_kursi || p.jumlah || 0);
          }, 0);
          setTotalDiverifikasiGlobal(sumDiverifikasi);
        }
      } catch (e) {
        console.warn('Error fetching control status:', e);
      } finally {
        setLoadingControl(false);
      }
    }

    fetchControl();

    const channel = supabase
      .channel(`beli_kuota_control_${kodeSantri}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'konfigurasi_sistem' }, () => {
        fetchControl();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pembelian_kuota' }, () => {
        fetchControl();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [kodeSantri]);

  // 3. Fetch All Orders untuk Santri Ini (Fitur A)
  const fetchAllOrders = async () => {
    try {
      setLoadingOrders(true);
      const { data, error } = await supabase
        .from('pembelian_kuota')
        .select('*')
        .eq('kode_santri', kodeSantri)
        .order('created_at', { ascending: false });

      if (data && !error) {
        setAllOrders(data);
      } else {
        setAllOrders([]);
      }
    } catch (e) {
      console.warn('Error fetching all orders for santri:', e);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();

    const channel = supabase
      .channel(`all_orders_realtime_${kodeSantri}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pembelian_kuota', filter: `kode_santri=eq.${kodeSantri}` },
        () => {
          fetchAllOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [kodeSantri]);

  // Perhitungan Fitur A: Total Kuota & Deteksi Order Aktif Pending
  const verifiedOrders = allOrders.filter((o) => o.status === 'DIVERIFIKASI' || o.status === 'DITERIMA');
  const totalVerifiedExtraSeats = verifiedOrders.reduce((sum, o) => sum + Number(o.jumlah_kursi || 0), 0);
  const totalVerifiedTxCount = verifiedOrders.length;

  const kuotaDasar = santri ? calculateKuotaDasarSantri(santri.kategori_utama, santri.sub_kategori) : 2;
  const totalKuotaAkhir = kuotaDasar + totalVerifiedExtraSeats;

  // Active Pending Order yang memblokir pembuatan order baru
  const activePendingOrder = allOrders.find(
    (o) => o.status === 'MENUNGGU_PEMBAYARAN' || o.status === 'MENUNGGU_VERIFIKASI'
  );

  // 4. Timer Countdown 6 Jam untuk Active Order (MENUNGGU_PEMBAYARAN)
  useEffect(() => {
    if (!activePendingOrder || activePendingOrder.status !== 'MENUNGGU_PEMBAYARAN' || !activePendingOrder.locked_until)
      return;

    const updateTimer = () => {
      const lockedTime = new Date(activePendingOrder.locked_until).getTime();
      const nowTime = Date.now();
      const diff = lockedTime - nowTime;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });

        // Update status ke BATAL jika lewat 6 jam & belum bayar
        supabase
          .from('pembelian_kuota')
          .update({ status: 'BATAL', updated_at: new Date().toISOString() })
          .eq('id_pesanan', activePendingOrder.id_pesanan)
          .then(() => {
            fetchAllOrders();
          });
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft({ hours, minutes, seconds, isExpired: false });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activePendingOrder]);

  // Handler Salin Nomor Rekening
  const handleCopyRekening = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText('320701010266508');
      setCopiedRekening(true);
      setTimeout(() => setCopiedRekening(false), 3000);
    }
  };

  // Handler Pilih Gambar Bukti Transfer (Fitur B)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMsg({ tipe: 'error', text: 'Format file tidak didukung! Harap unggah foto/gambar bukti transfer (JPG/PNG/WebP).' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setStatusMsg({ tipe: 'error', text: 'Ukuran file terlalu besar (maksimal 10MB).' });
      return;
    }

    setSelectedFile(file);
    setSelectedFileName(file.name);
    try {
      const base64 = await fileToBase64(file);
      setSelectedImage(base64);
      setStatusMsg(null);
    } catch (err) {
      console.warn('Error reading image file:', err);
    }
  };

  // Handler Kunci Pesanan Kuota Baru (Fitur A: Pembelian Berulang)
  const handleKunciPesanan = async () => {
    if (!santri) return;
    if (activePendingOrder) {
      setStatusMsg({
        tipe: 'error',
        text: `Anda masih memiliki pesanan (${activePendingOrder.id_pesanan}) yang sedang diproses. Selesaikan dulu atau tunggu verifikasi panitia.`,
      });
      return;
    }

    setIsSubmittingOrder(true);
    setStatusMsg(null);

    try {
      const now = new Date();
      const lockedUntil = new Date(now.getTime() + 6 * 60 * 60 * 1000);
      const randomDigits = Math.floor(10000 + Math.random() * 90000);
      const orderId = `KT-${randomDigits}`;
      const totalBayar = jumlahBeli * 80000;
      const namaWali = santri.nama_wali || santri.nama_wali_santri || santri.nama || 'Wali Santri';

      const newOrder = {
        id: orderId,
        id_pesanan: orderId,
        kode_santri: santri.kode,
        nama_wali: namaWali,
        jumlah_kursi: jumlahBeli,
        total_bayar: totalBayar,
        status: 'MENUNGGU_PEMBAYARAN',
        metode: 'TRANSFER_BRI',
        locked_until: lockedUntil.toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      const { error: insertErr } = await supabase
        .from('pembelian_kuota')
        .insert(newOrder);

      if (insertErr) {
        console.error('Error inserting order to Supabase:', insertErr);
        setStatusMsg({ tipe: 'error', text: `Gagal mengunci pesanan: ${insertErr.message}` });
        return;
      }

      setStatusMsg({
        tipe: 'success',
        text: '✓ Pesanan berhasil dikunci selama 6 jam! Silakan lakukan transfer BRI dan unggah bukti pembayaran.',
      });

      fetchAllOrders();

      // Kirim WA Notifikasi ke Wali Santri jika ada nomor HP
      const noHpWali = santri.no_hp || santri.no_hp_wali || '';
      if (noHpWali) {
        try {
          const origin = typeof window !== 'undefined' ? window.location.origin : 'https://haflahp3tq.site';
          const pesanWali =
            `*PESANAN KUOTA TAMBAHAN HAFLAH P3TQ - MHMTQ 1448 H.*\n\n` +
            `Assalamu'alaikum Bpk/Ibu ${namaWali},\n` +
            `Pesanan kuota tambahan kursi Anda telah berhasil dikunci:\n\n` +
            `• ID Pesanan: *${orderId}*\n` +
            `• Santri: *${santri.nama}* (${santri.sub_kategori || 'Santri'})\n` +
            `• Jumlah Kursi: *${jumlahBeli} Kursi*\n` +
            `• Total Bayar: *Rp ${totalBayar.toLocaleString('id-ID')}*\n` +
            `• Batas Waktu: *6 Jam* (s.d. ${lockedUntil.toLocaleTimeString('id-ID')} WIB)\n\n` +
            `💳 *Rekening Pembayaran BRI*:\n` +
            `Bank BRI: *320701010266508*\n` +
            `a.n.: *Ahmad Chamdan Yuwafin*\n\n` +
            `Silakan unggah bukti transfer melalui link berikut:\n` +
            `🔗 ${origin}/beli/${santri.kode}\n\n` +
            `_Panitia Haul & Haflah P3TQ - MHMTQ 2027_`;

          await fetch('/api/whatsapp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              target: noHpWali,
              message: pesanWali,
            }),
          });
        } catch (e) {
          console.warn('Warning sending WA notification:', e);
        }
      }
    } catch (e: any) {
      console.error('Exception creating order:', e);
      setStatusMsg({ tipe: 'error', text: `Terjadi kesalahan: ${e.message || e}` });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Handler Upload / Ganti Bukti Transfer (Fitur B)
  const handleUploadProof = async () => {
    if (!selectedFile && !selectedImage) {
      setStatusMsg({ tipe: 'error', text: 'Silakan pilih foto atau file bukti transfer terlebih dahulu.' });
      return;
    }
    if (!activePendingOrder) return;

    setIsUploadingProof(true);
    setStatusMsg(null);

    try {
      let publicUrl = '';

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop() || 'jpg';
        const fileName = `bukti_${activePendingOrder.id_pesanan}_${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('bukti-pembayaran')
          .upload(fileName, selectedFile, { upsert: true });

        if (!uploadErr && uploadData) {
          const { data: urlData } = supabase.storage
            .from('bukti-pembayaran')
            .getPublicUrl(fileName);
          publicUrl = urlData.publicUrl;
        } else {
          publicUrl = selectedImage || (await fileToBase64(selectedFile));
        }
      } else if (selectedImage) {
        publicUrl = selectedImage;
      }

      const nowIso = new Date().toISOString();
      const { error: updateErr } = await supabase
        .from('pembelian_kuota')
        .update({
          status: 'MENUNGGU_VERIFIKASI',
          bukti_url: publicUrl,
          uploaded_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id_pesanan', activePendingOrder.id_pesanan);

      if (updateErr) {
        console.error('Error updating status in Supabase:', updateErr);
        setStatusMsg({ tipe: 'error', text: `Gagal memperbarui database: ${updateErr.message}` });
      } else {
        setSelectedFile(null);
        setSelectedImage(null);
        setSelectedFileName('');
        setIsChangingProof(false);
        setStatusMsg({
          tipe: 'success',
          text: '✓ Bukti transfer berhasil diunggah/diperbarui! Pesanan Anda kini menunggu verifikasi panitia.',
        });
        fetchAllOrders();
      }
    } catch (e: any) {
      console.error('Exception uploading proof:', e);
      setStatusMsg({ tipe: 'error', text: `Terjadi kesalahan: ${e.message || e}` });
    } finally {
      setIsUploadingProof(false);
    }
  };

  const sisaPaguGlobal = Math.max(0, 300 - totalDiverifikasiGlobal);

  // ---------------------------------------------------------------------------
  // STATE LOADING / ERROR VIEW
  // ---------------------------------------------------------------------------
  if (loadingSantri || loadingControl || loadingOrders) {
    return (
      <div className="min-h-screen bg-[#FAF7F3] text-[#422F21] flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 border-2 border-[#D5C4B4] shadow-xl text-center space-y-4 max-w-sm w-full">
          <Loader2 className="w-10 h-10 animate-spin text-[#8C6A47] mx-auto" />
          <p className="font-serif font-bold text-sm text-[#422F21]">
            Memuat Data Pembelian Kuota...
          </p>
        </div>
      </div>
    );
  }

  if (!santri) {
    return (
      <div className="min-h-screen bg-[#FAF7F3] text-[#422F21] flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="bg-white rounded-3xl p-8 border-2 border-rose-300 shadow-xl text-center space-y-5 max-w-md w-full">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h1 className="font-serif font-black text-xl text-[#322116]">Data Tidak Ditemukan</h1>
            <p className="text-xs text-stone-600 leading-relaxed">
              Kode santri <strong>{kodeSantri}</strong> tidak terdaftar dalam sistem database panitia.
            </p>
          </div>
          <Link
            href="/"
            className="w-full py-3 rounded-2xl bg-[#8C6A47] hover:bg-[#735334] text-white text-xs font-bold inline-flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda Portal</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F3] text-[#422F21] selection:bg-[#8C6A47]/20 py-8 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        {/* TOMBOL KEMBALI KE UNDANGAN */}
        <div className="flex items-center justify-between">
          <Link
            href={`/u/${santri.kode}`}
            className="inline-flex items-center space-x-2 text-xs font-bold text-[#8C6A47] hover:text-[#5C3E28] bg-white px-3.5 py-2 rounded-2xl border border-[#D5C4B4] shadow-xs transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Undangan Digital</span>
          </Link>
          <span className="text-xs font-mono font-bold text-stone-400">Kode: {santri.kode}</span>
        </div>

        {/* HEADER KARTU LEMBAGA */}
        <div className="bg-white rounded-3xl p-6 border-2 border-[#D5C4B4] shadow-md text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <img src="/images/logo-p3tq.png" alt="Logo P3TQ" className="h-10 object-contain" />
            <img src="/logo-haul-haflah-transparent.png" alt="Logo Haul & Haflah" className="h-12 object-contain" />
            <img src="/images/logo-mhmtq.png" alt="Logo MHMTQ" className="h-10 object-contain" />
          </div>
          <NamaLembaga align="center" size="xs" weight="bold" color="text-[#422F21]" />
          <div className="inline-block px-3 py-1 rounded-full bg-[#FAF0E6] text-[#8C6A47] text-[11px] font-bold border border-[#D5C4B4]">
            Pembelian Kuota Tambahan Kursi Wali
          </div>
        </div>

        {/* KARTU PROFIL SANTRI & WALI */}
        <div className="bg-white rounded-3xl p-6 border-2 border-[#E8DFD5] shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <span className="text-[10px] text-[#8C6A47] font-bold uppercase tracking-wider block">
                SHO HIBUL HAJAT (SANTRI):
              </span>
              <h2 className="font-serif font-black text-lg text-[#322116]">{santri.nama}</h2>
            </div>
            <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold shrink-0">
              {santri.sub_kategori || santri.kategori_utama || 'Santri'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5]">
              <span className="text-stone-500 text-[10px] uppercase font-bold block">Nama Wali:</span>
              <p className="font-bold text-[#422F21] truncate">{santri.nama_wali || santri.nama}</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5]">
              <span className="text-stone-500 text-[10px] uppercase font-bold block">Kelas / Kamar:</span>
              <p className="font-bold text-[#422F21] truncate">
                {santri.kelas || '-'} / Kamar {santri.kamar || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* FITUR A: BANNER RINGKASAN KUOTA TAMBAHAN SANTRI */}
        <div className="bg-emerald-50 rounded-3xl p-5 border-2 border-emerald-200 shadow-xs space-y-2 text-xs">
          <div className="flex items-center space-x-2 text-emerald-900 font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Informasi Kuota Santri Saat Ini</span>
          </div>
          <p className="text-emerald-950 font-medium leading-relaxed">
            Anda telah memiliki{' '}
            <strong className="font-serif font-black text-sm text-emerald-800">
              {totalVerifiedExtraSeats} kursi tambahan
            </strong>{' '}
            (dari {totalVerifiedTxCount} transaksi terverifikasi).
          </p>
          <div className="p-3 bg-white/80 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs">
            <span className="text-stone-600 font-semibold">Total Kuota Akhir Anda:</span>
            <span className="font-serif font-black text-base text-emerald-800">
              {totalKuotaAkhir} Kursi ({kuotaDasar} dasar + {totalVerifiedExtraSeats} tambahan)
            </span>
          </div>
        </div>

        {/* NOTIFIKASI STATUS OPERASI */}
        {statusMsg && (
          <div
            className={`p-4 rounded-2xl text-xs font-bold border flex items-center space-x-2.5 animate-in fade-in ${
              statusMsg.tipe === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            {statusMsg.tipe === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* FITUR A BLOKIR: Peringatan Jika Masih Ada Pesanan Pending */}
        {activePendingOrder && (
          <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs font-bold flex items-start space-x-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span>Pesanan Anda Masih Dalam Proses</span>
              <p className="text-[11px] font-normal text-amber-900 leading-relaxed">
                Anda masih memiliki pesanan yang sedang diproses (ID Pesanan:{' '}
                <strong>{activePendingOrder.id_pesanan}</strong>). Selesaikan dulu atau tunggu hasil verifikasi panitia
                sebelum melakukan pembelian baru.
              </p>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SKENARIO A: FITUR DITUTUP PANITIA / KUOTA HABIS                       */}
        {/* ===================================================================== */}
        {!kuotaSwitchAktif && !activePendingOrder ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-300 shadow-md text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-600 border border-stone-300 flex items-center justify-center mx-auto">
              <Info className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif font-black text-base text-[#422F21]">
                Pembelian Kuota Tambahan Sedang Ditutup
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Panitia belum membuka atau sedang menutup akses pembelian kuota tambahan kursi saat ini. Silakan berkonsultasi dengan panitia atau menunggu info resmi berikutnya.
              </p>
            </div>
          </div>
        ) : sisaPaguGlobal <= 0 && !activePendingOrder ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-300 shadow-md text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-300 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif font-black text-base text-amber-950">
                Kuota Tambahan Pagu Nasional Sudah Habis
              </h3>
              <p className="text-xs text-amber-900 leading-relaxed">
                Total pagu kuota tambahan kursi sebanyak <strong>300 kursi</strong> telah terisi penuh (300/300 unit).
              </p>
            </div>
          </div>
        ) : activePendingOrder ? (
          /* ===================================================================== */
          /* SKENARIO B: PESANAN AKTIF PENDING (TRANSFER & BUKTI / GANTI BUKTI)    */
          /* ===================================================================== */
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#8C6A47] shadow-xl space-y-6">
            {/* Header Status Pesanan Aktif */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <span className="text-[10px] text-stone-500 font-bold uppercase block">ID PESANAN AKTIF:</span>
                <h3 className="font-serif font-black text-xl text-[#322116]">{activePendingOrder.id_pesanan}</h3>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-stone-500 font-bold uppercase block">STATUS PESANAN:</span>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase border ${
                    activePendingOrder.status === 'MENUNGGU_VERIFIKASI'
                      ? 'bg-sky-100 text-sky-900 border-sky-300'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}
                >
                  {activePendingOrder.status === 'MENUNGGU_VERIFIKASI'
                    ? '⏳ Menunggu Verifikasi'
                    : '💳 Menunggu Pembayaran'}
                </span>
              </div>
            </div>

            {/* TIMER COUNTDOWN 6 JAM */}
            {activePendingOrder.status === 'MENUNGGU_PEMBAYARAN' && (
              <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-center space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                  SISA WAKTU MENGUNCI PESANAN (6 JAM)
                </span>
                <div className="flex items-center justify-center space-x-2 font-mono font-black text-2xl text-amber-900">
                  <Clock className="w-5 h-5 text-amber-700 animate-pulse" />
                  <span>
                    {String(timeLeft.hours).padStart(2, '0')} : {String(timeLeft.minutes).padStart(2, '0')} :{' '}
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Pesanan akan otomatis dibatalkan jika transfer &amp; unggah bukti tidak dilakukan dalam 6 jam.
                </p>
              </div>
            )}

            {/* DETAIL ALOKASI & TOTAL HARGA */}
            <div className="p-4 rounded-2xl bg-[#FAF7F3] border border-[#D5C4B4] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-600">Jumlah Kursi Tambahan:</span>
                <strong className="text-[#422F21]">{activePendingOrder.jumlah_kursi} Kursi</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Harga per Kursi:</span>
                <span>Rp 80.000</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#D5C4B4] text-sm font-bold text-[#422F21]">
                <span>Total Wajib Transfer:</span>
                <span className="text-emerald-700 font-black text-base">
                  Rp {Number(activePendingOrder.total_bayar).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* INFO REKENING PEMBAYARAN BRI */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-[#FAF0E6] to-[#FAF7F3] border-2 border-[#D5C4B4] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A47] flex items-center space-x-1.5">
                  <CreditCard className="w-4 h-4 text-[#8C6A47]" />
                  <span>REKENING RESMI PANITIA (BRI)</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  Bank BRI
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#D5C4B4] flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-stone-500 uppercase font-bold">Nomor Rekening:</div>
                  <div className="font-mono font-black text-lg text-[#322116] tracking-wider">
                    320701010266508
                  </div>
                  <div className="text-[11px] font-semibold text-[#8C6A47]">
                    a.n. Ahmad Chamdan Yuwafin
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyRekening}
                  className="px-3 py-2 rounded-xl bg-[#FAF7F3] hover:bg-[#EFE8E1] text-[#5C3E28] text-xs font-bold border border-[#D5C4B4] flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  {copiedRekening ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-[#8C6A47]" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* FORM UPLOAD / GANTI BUKTI TRANSFER (FITUR B) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#422F21]">
                  Foto Bukti Transfer Pembayaran:
                </label>
                {activePendingOrder.status === 'MENUNGGU_VERIFIKASI' && !isChangingProof && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingProof(true);
                      setSelectedFile(null);
                      setSelectedImage(null);
                    }}
                    className="text-[11px] font-bold text-[#8C6A47] hover:underline inline-flex items-center space-x-1"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Ganti Bukti Transfer</span>
                  </button>
                )}
              </div>

              {/* INPUT FILE HIDDEN */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* AREA PREVIEW / DROPZONE */}
              {(selectedImage || (activePendingOrder.bukti_url && !isChangingProof)) ? (
                <div className="space-y-2">
                  <div className="relative rounded-2xl overflow-hidden border-2 border-[#8C6A47] bg-stone-900 group">
                    <img
                      src={selectedImage || activePendingOrder.bukti_url}
                      alt="Bukti Transfer"
                      className="w-full max-h-64 object-contain mx-auto"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
                      <button
                        type="button"
                        onClick={() => setShowFullImageModal(true)}
                        className="px-3 py-2 rounded-xl bg-white/90 text-stone-900 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Lihat Foto</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsChangingProof(true);
                          fileInputRef.current?.click();
                        }}
                        className="px-3 py-2 rounded-xl bg-[#8C6A47] text-white text-xs font-bold flex items-center space-x-1 cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Ganti Foto</span>
                      </button>
                    </div>
                  </div>

                  {/* SUBTEKS WAKTU UPLOAD TERBARU (FITUR B) */}
                  <div className="text-[11px] text-stone-500 text-center font-medium">
                    Bukti terakhir diperbarui:{' '}
                    <strong className="text-[#422F21]">
                      {formatTanggalIndo(activePendingOrder.uploaded_at || activePendingOrder.created_at)}
                    </strong>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 px-4 rounded-2xl border-2 border-dashed border-[#D5C4B4] hover:border-[#8C6A47] bg-[#FAF7F3] hover:bg-white text-center space-y-2 transition-colors cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#8C6A47] flex items-center justify-center mx-auto border border-[#D5C4B4] group-hover:scale-105 transition-transform">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold text-[#422F21]">
                    Klik untuk Ambil Foto / Pilih Gambar Bukti Transfer
                  </div>
                  <p className="text-[10px] text-stone-500">Format JPG, PNG, WebP (Maksimal 10MB)</p>
                </button>
              )}

              {selectedFileName && (
                <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <span className="truncate">File terpilih: {selectedFileName}</span>
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>
              )}

              {/* TOMBOL UNGGAH / PERBARUI BUKTI */}
              {(activePendingOrder.status === 'MENUNGGU_PEMBAYARAN' || isChangingProof || selectedFile) && (
                <button
                  type="button"
                  onClick={handleUploadProof}
                  disabled={isUploadingProof || (!selectedFile && !selectedImage)}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-800 hover:brightness-105 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isUploadingProof ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin text-emerald-200" />
                      <span>Mengunggah Bukti Pembayaran...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4.5 h-4.5 text-emerald-200" />
                      <span>
                        {activePendingOrder.status === 'MENUNGGU_VERIFIKASI'
                          ? 'Perbarui Foto Bukti Transfer'
                          : 'Unggah Bukti Pembayaran'}
                      </span>
                    </>
                  )}
                </button>
              )}

              {/* TOMBOL HUBUNGI PANITIA (WHATSAPP) */}
              {activePendingOrder.status === 'MENUNGGU_VERIFIKASI' && (
                <div className="pt-2 space-y-2">
                  <a
                    href={`https://wa.me/6285790633812?text=Assalamu%27alaikum%20Panitia%20Haflah%2C%20saya%20wali%20dari%20${encodeURIComponent(
                      santri.nama
                    )}%20(ID%20Pesanan%3A%20${activePendingOrder.id_pesanan})%20sudah%20mengunggah%20bukti%20transfer%20sebesar%20Rp%20${activePendingOrder.total_bayar.toLocaleString(
                      'id-ID'
                    )}%2C%20mohon%20segera%20dikonfirmasi.%20Terima%20kasih.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-800 hover:brightness-105 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    <MessageCircle className="w-4.5 h-4.5 text-emerald-200" />
                    <span>Hubungi Panitia via WhatsApp</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ===================================================================== */
          /* SKENARIO C: FORM INPUT PEMBELIAN KUOTA BARU (FITUR A)                 */
          /* ===================================================================== */
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#E8DFD5] shadow-sm space-y-6">
            <div className="space-y-1">
              <h3 className="font-serif font-black text-lg text-[#422F21]">
                Formulir Pemesanan Kuota Kursi Tambahan
              </h3>
              <p className="text-xs text-stone-600">
                Sisa kuota pagu nasional: <strong>{sisaPaguGlobal} kursi</strong> ({totalDiverifikasiGlobal}/300 terisi).
              </p>
            </div>

            {/* STEPPER INPUT JUMLAH KURSI */}
            <div className="p-4 rounded-2xl bg-[#FAF7F3] border border-[#D5C4B4] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#422F21]">Jumlah Kuota Tambahan:</div>
                  <div className="text-[10px] text-stone-500">Harga Rp 80.000 / kursi</div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setJumlahBeli(Math.max(1, jumlahBeli - 1))}
                    disabled={jumlahBeli <= 1}
                    className="w-10 h-10 rounded-xl bg-white border border-[#D5C4B4] text-[#422F21] font-black text-base flex items-center justify-center hover:bg-stone-100 disabled:opacity-40 cursor-pointer active:scale-95"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-mono font-black text-xl w-6 text-center text-[#422F21]">
                    {jumlahBeli}
                  </span>
                  <button
                    type="button"
                    onClick={() => setJumlahBeli(Math.min(sisaPaguGlobal, jumlahBeli + 1))}
                    disabled={jumlahBeli >= sisaPaguGlobal}
                    className="w-10 h-10 rounded-xl bg-[#8C6A47] text-white font-black text-base flex items-center justify-center hover:bg-[#735334] disabled:opacity-40 cursor-pointer active:scale-95 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Rincian Total Tagihan */}
              <div className="pt-3 border-t border-[#D5C4B4] flex items-center justify-between text-xs">
                <span className="text-stone-600 font-semibold">Total Pembayaran:</span>
                <span className="font-serif font-black text-lg text-emerald-700">
                  Rp {(jumlahBeli * 80000).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* TOMBOL KUNCI PESANAN */}
            <button
              type="button"
              onClick={handleKunciPesanan}
              disabled={isSubmittingOrder || sisaPaguGlobal <= 0}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#8C6A47] via-[#A47E57] to-[#8C6A47] hover:brightness-105 disabled:opacity-50 text-white font-serif font-black text-xs sm:text-sm tracking-wide shadow-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center space-x-2 border border-amber-200/40"
            >
              {isSubmittingOrder ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin text-amber-200" />
                  <span>Mengunci Pesanan di Database...</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4.5 h-4.5 text-amber-200" />
                  <span>Kunci Pesanan &amp; Lanjut Bayar</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* FITUR A: RIWAYAT SEMUA PEMBELIAN KUOTA SANTRI */}
        {allOrders.length > 0 && (
          <div className="bg-white rounded-3xl p-6 border-2 border-[#E8DFD5] shadow-xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
              <History className="w-4 h-4 text-[#8C6A47]" />
              <h3 className="font-serif font-bold text-sm text-[#422F21]">
                Riwayat Transaksi Kuota Tambahan ({allOrders.length})
              </h3>
            </div>

            <div className="space-y-2.5">
              {allOrders.map((order) => {
                const isVerified = order.status === 'DIVERIFIKASI' || order.status === 'DITERIMA';
                const isPending = order.status === 'MENUNGGU_VERIFIKASI' || order.status === 'MENUNGGU_PEMBAYARAN';
                return (
                  <div
                    key={order.id_pesanan || order.id}
                    className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] flex items-center justify-between text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-[#322116]">
                          {order.id_pesanan || order.id}
                        </span>
                        <span className="text-stone-400">•</span>
                        <span className="font-semibold text-stone-700">
                          {order.jumlah_kursi} Kursi
                        </span>
                      </div>
                      <div className="text-[10px] text-stone-500">
                        {formatTanggalIndo(order.created_at)}
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="font-bold text-[#422F21]">
                        Rp {Number(order.total_bayar || 0).toLocaleString('id-ID')}
                      </div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isVerified
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : isPending
                            ? 'bg-sky-100 text-sky-900 border border-sky-300'
                            : 'bg-rose-100 text-rose-900 border border-rose-300'
                        }`}
                      >
                        {isVerified
                          ? 'Terverifikasi'
                          : isPending
                          ? 'Proses'
                          : order.status || 'Batal'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FOOTER INFORMASI BANTUAN */}
        <div className="text-center text-[11px] text-stone-500 space-y-1 pt-4">
          <p className="font-serif font-bold text-[#422F21]">
            Pondok Pesantren Putri Tahfizhil Qur-an &amp; MHMTQ Lirboyo
          </p>
          <p>Jika membutuhkan bantuan, silakan hubungi Panitia di 0857-9063-3812</p>
        </div>
      </div>

      {/* MODAL FULL PREVIEW IMAGE */}
      {showFullImageModal && (selectedImage || activePendingOrder?.bukti_url) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowFullImageModal(false)}
        >
          <div className="relative max-w-3xl w-full bg-stone-900 rounded-3xl p-3 border border-stone-700 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowFullImageModal(false)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedImage || activePendingOrder?.bukti_url}
              alt="Bukti Transfer Full"
              className="w-full max-h-[85vh] object-contain rounded-2xl mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}
