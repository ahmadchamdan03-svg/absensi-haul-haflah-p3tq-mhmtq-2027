'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { calculateKuotaDasarSantri } from '@/lib/types';
import { normalizePortalToken, getAmbiguousKodeVariants } from '@/lib/utils';
import PortalBackground from '@/components/PortalBackground';
import { fileToBase64 } from '@/components/public/beli/types';
import BeliKuotaHeaderAndInfo from '@/components/public/beli/BeliKuotaHeaderAndInfo';
import BeliActiveOrderCard from '@/components/public/beli/BeliActiveOrderCard';
import {
  BeliClosedNotice,
  BeliPaguHabisNotice,
  BeliOrderForm,
  BeliVerifiedHistory,
  BeliFooter,
  BeliFullImageModal,
} from '@/components/public/beli/BeliOrderFormAndHistory';

export default function BeliKuotaPage() {
  const params = useParams();
  const token = (params?.token as string) || '';
  const kodeSantri = normalizePortalToken(token) || 'SH0001';

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



  const [isRefreshing, setIsRefreshing] = useState(false);

  // 1. Fetch Data Santri dari Supabase peserta_santri
  const fetchSantri = useCallback(async () => {
    try {
      setLoadingSantri(true);
      let { data, error } = await supabase
        .from('peserta_santri')
        .select('*')
        .eq('kode', kodeSantri)
        .maybeSingle();

      // Fallback: toleransi ambiguitas 0/O dan 1/I pada kode acak (mis. SH80X7 -> SH8OX7)
      if (!data && !error) {
        const variants = getAmbiguousKodeVariants(kodeSantri);
        if (variants.length > 1) {
          const fallback = await supabase
            .from('peserta_santri')
            .select('*')
            .in('kode', variants)
            .limit(1)
            .maybeSingle();
          data = fallback.data;
          error = fallback.error;
        }
      }

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
  }, [kodeSantri]);

  useEffect(() => {
    fetchSantri();
  }, [fetchSantri]);

  // 2. Fetch Control Status (Switch & Sisa Pagu Global)
  const fetchControl = useCallback(async () => {
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
  }, []);

  useEffect(() => {
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
  }, [kodeSantri, fetchControl]);

  // 3. Fetch All Orders untuk Santri Ini (Fitur A)
  // Gunakan kode santri hasil resolusi database (mis. SH8OX7) agar tidak meleset bila URL memakai varian ambigu.
  const kodeAktif: string = santri?.kode || kodeSantri;
  const fetchAllOrders = useCallback(async () => {
    try {
      setLoadingOrders(true);
      const { data, error } = await supabase
        .from('pembelian_kuota')
        .select('*')
        .eq('kode_santri', kodeAktif)
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
  }, [kodeAktif]);

  useEffect(() => {
    fetchAllOrders();

    const channel = supabase
      .channel(`all_orders_realtime_${kodeAktif}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pembelian_kuota', filter: `kode_santri=eq.${kodeAktif}` },
        () => {
          fetchAllOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [kodeAktif, fetchAllOrders]);

  // Refresh All Data handler
  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchSantri(), fetchControl(), fetchAllOrders()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Perhitungan Fitur A: Total Kuota & Deteksi Order Aktif Pending
  // Fix 7 & 14: Kuota tambahan mengacu langsung ke peserta_santri.kuota_tambahan
  const totalVerifiedExtraSeats = Number(santri?.kuota_tambahan || 0);
  const verifiedOrders = allOrders.filter((o) => o.status === 'DIVERIFIKASI' || o.status === 'DITERIMA');
  const totalVerifiedTxCount = verifiedOrders.length;

  const kuotaDasar = santri ? calculateKuotaDasarSantri(santri.kategori_utama, santri.sub_kategori) : 2;
  const totalKuotaAkhir = kuotaDasar + totalVerifiedExtraSeats;

  // Active Pending Order yang memblokir pembuatan order baru
  const activePendingOrder = allOrders.find(
    (o) => o.status === 'MENUNGGU_PEMBAYARAN' || o.status === 'MENUNGGU_VERIFIKASI'
  );



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
      const totalBayar = jumlahBeli * 75000;
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
          const liveDomain = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://haflahp3tq.site';
          const origin = typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1') ? window.location.origin : liveDomain;
          const linkUpload = `${origin}/beli/${santri.kode}`;

          const pesanWali =
            `*PEMESANAN KUOTA TAMBAHAN*\n` +
            `*HAUL & HAFLAH P3TQ - MHMTQ 2027*\n\n` +
            `Yth. Bapak/Ibu ${namaWali},\n\n` +
            `Pesanan kuota tambahan Anda telah DIKUNCI dengan detail:\n` +
            `  • ID Pesanan : ${orderId}\n` +
            `  • Santri     : ${santri.nama} (${santri.kode})\n` +
            `  • Jumlah     : ${jumlahBeli} kursi\n` +
            `  • Total      : Rp ${totalBayar.toLocaleString('id-ID')}\n\n` +
            `Mohon segera lakukan transfer ke:\n` +
            `  Bank BRI\n` +
            `  No. Rek: 320701010266508\n` +
            `  a.n. Ahmad Chamdan Yuwafin\n\n` +
            `*Batas waktu: 6 JAM dari sekarang.*\n\n` +
            `⚠️ *PENTING:* Apabila dalam 6 jam Bapak/Ibu belum mengunggah bukti transfer, maka pesanan ini akan DIBATALKAN secara OTOMATIS oleh sistem dan kuota akan dilepas kembali. Silakan lakukan pemesanan ulang jika diperlukan.\n\n` +
            `Upload bukti transfer di link berikut:\n` +
            `${linkUpload}\n\n` +
            `Jazakumullahu khairan katsiran.\n` +
            `_Panitia Haul & Haflah P3TQ dan MHMTQ 2027_`;

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
    <div className="min-h-screen text-[#422F21] selection:bg-[#8C6A47]/20 py-8 px-4 sm:px-6 relative overflow-x-hidden">
      <PortalBackground />
      <div className="max-w-xl mx-auto space-y-6 relative z-10">
        <BeliKuotaHeaderAndInfo
          santri={santri}
          isRefreshing={isRefreshing}
          onRefreshAll={handleRefreshAll}
          totalVerifiedExtraSeats={totalVerifiedExtraSeats}
          totalVerifiedTxCount={totalVerifiedTxCount}
          totalKuotaAkhir={totalKuotaAkhir}
          kuotaDasar={kuotaDasar}
          statusMsg={statusMsg}
          activePendingOrder={activePendingOrder}
        />

        {!kuotaSwitchAktif && !activePendingOrder ? (
          <BeliClosedNotice />
        ) : sisaPaguGlobal <= 0 && !activePendingOrder ? (
          <BeliPaguHabisNotice />
        ) : activePendingOrder ? (
          <BeliActiveOrderCard
            santri={santri}
            activePendingOrder={activePendingOrder}
            fetchAllOrders={fetchAllOrders}
            copiedRekening={copiedRekening}
            onCopyRekening={handleCopyRekening}
            isChangingProof={isChangingProof}
            setIsChangingProof={setIsChangingProof}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
            selectedFileName={selectedFileName}
            fileInputRef={fileInputRef}
            onFileChange={handleFileChange}
            setShowFullImageModal={setShowFullImageModal}
            onUploadProof={handleUploadProof}
            isUploadingProof={isUploadingProof}
          />
        ) : (
          <BeliOrderForm
            jumlahBeli={jumlahBeli}
            setJumlahBeli={setJumlahBeli}
            sisaPaguGlobal={sisaPaguGlobal}
            isSubmittingOrder={isSubmittingOrder}
            onKunciPesanan={handleKunciPesanan}
          />
        )}

        <BeliVerifiedHistory verifiedOrders={verifiedOrders} />

        <BeliFooter />
      </div>

      {showFullImageModal && (selectedImage || activePendingOrder?.bukti_url) && (
        <BeliFullImageModal
          src={selectedImage || activePendingOrder?.bukti_url}
          onClose={() => setShowFullImageModal(false)}
        />
      )}
    </div>
  );
}
