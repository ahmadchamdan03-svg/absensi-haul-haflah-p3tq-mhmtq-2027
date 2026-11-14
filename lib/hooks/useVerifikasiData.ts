'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { logAudit } from '@/lib/audit-log';

export const getLiveBaseUrl = () => {
  if (
    typeof window !== 'undefined' &&
    !window.location.hostname.includes('localhost') &&
    !window.location.hostname.includes('127.0.0.1')
  ) {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://haflahp3tq.site';
};

const isBatalStatus = (status?: string | null): boolean => {
  const s = String(status || '').toUpperCase().trim();
  return s.startsWith('BATAL') || s === 'DITOLAK' || s === 'REFUND';
};

export function useVerifikasiData() {
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

    // Subscribe Realtime ke tabel 'pembelian_kuota' & 'peserta_santri'
    const channel = supabase
      .channel('admin_verifikasi_realtime_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pembelian_kuota' },
        () => {
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'peserta_santri' },
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
    return pembelianList.filter((p) => isBatalStatus(p.status)).length;
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
        if (!isBatalStatus(status)) return false;
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
      const targetKode = item.kode_santri || item.kode;

      // 1. Verifikasi via Server API Route (Bypass RLS)
      const res = await fetch('/api/verifikasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          targetId,
          targetKode,
        }),
      });
      const resJson = await res.json();

      if (!res.ok || !resJson.ok) {
        console.error('Error updating status pembelian_kuota:', resJson.error);
        setStatusMsg({ tipe: 'error', text: `Gagal memverifikasi pesanan: ${resJson.error || 'Server error'}` });
        return;
      }

      const { data: currentSantri } = await supabase
        .from('peserta_santri')
        .select('kuota_tambahan, no_hp, nama_wali, nama')
        .eq('kode', targetKode)
        .maybeSingle();

      const numKursi = Number(item.jumlah_kursi || item.jumlah || 1);

      // 3. Kirim Otomatis Pesan WA ke Wali Santri
      const targetHp = currentSantri?.no_hp || item.no_hp || '';
      if (targetHp && targetHp.length >= 9) {
        const origin = getLiveBaseUrl();
        const pesanWa =
          `Assalamu'alaikum Bpk/Ibu *${item.nama_wali || currentSantri?.nama_wali || 'Wali Santri'}*,\n\n` +
          `Pembayaran kuota tambahan (ID: *${targetId}*) sebanyak *${numKursi} Kursi* telah *BERHASIL DIVERIFIKASI* dan kini *Aktif pada QR Code Santri*.\n\n` +
          `*Mohon Konfirmasi Ulang Kedatangan*\n` +
          `Guna persiapan kursi dan penginapan, silakan buka link di bawah, scroll ke bagian Konfirmasi Kehadiran, dan isi:\n\n` +
          `- Jumlah wali santri putra & putri\n\n` +
          `Akses Kartu Presensi & QR Code:\n` +
          `🔗 *${origin}/u/${targetKode}*\n\n` +
          `Terima kasih atas kerja samanya.\n` +
          `*Panitia Haul & Haflah P3TQ - MHMTQ 2027*`;

        fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: targetHp,
            message: pesanWa,
          }),
        }).catch((e) => console.warn('WA send error:', e));
      }

      await logAudit({
        panitia_id: 'ADMIN_VERIFIKASI',
        panitia_role: 'ADMIN',
        aksi: 'VERIFIKASI_KUOTA',
        tabel: 'pembelian_kuota',
        kode: targetKode,
        nama: item.nama_wali || currentSantri?.nama_wali || 'Wali Santri',
        field: 'status',
        nilai_lama: item.status,
        nilai_baru: 'DIVERIFIKASI',
        detail: { id_pesanan: targetId, jumlah_kursi: numKursi, total_bayar: item.total_bayar },
        catatan: `Verifikasi Pembelian Kuota Tambahan (+${numKursi} Kursi)`,
      });

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
      const res = await fetch('/api/verifikasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          targetId,
        }),
      });
      const resJson = await res.json();

      if (!res.ok || !resJson.ok) {
        setStatusMsg({ tipe: 'error', text: `Gagal menolak pesanan: ${resJson.error || 'Server error'}` });
      } else {
        const nextStatus = resJson.status || 'BATAL / REFUND';
        await logAudit({
          panitia_id: 'ADMIN_VERIFIKASI',
          panitia_role: 'ADMIN',
          aksi: 'TOLAK_KUOTA',
          tabel: 'pembelian_kuota',
          kode: item.kode_santri || item.kode,
          nama: item.nama_wali || item.nama_santri,
          field: 'status',
          nilai_lama: item.status,
          nilai_baru: nextStatus,
          detail: {
            id_pesanan: targetId,
            jumlah_kursi: item.jumlah_kursi,
            wa_sent: Boolean(resJson.waSent),
          },
          catatan: `Penolakan Pembelian Kuota Tambahan (ID: ${targetId})`,
        });

        const waInfo = resJson.waSent
          ? 'Notifikasi WA penolakan terkirim ke wali santri.'
          : `WA tidak terkirim (${resJson.waReason || 'nomor HP belum tersedia'}).`;

        setStatusMsg({
          tipe: 'success',
          text: `✓ Pesanan ${targetId} DITOLAK (${nextStatus}). ${waInfo}`,
        });
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
      const totalBayar = manualJumlah * 75000;
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

      const res = await fetch('/api/verifikasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_manual',
          newOrder,
          langsungVerifikasi: manualLangsungVerifikasi,
          kodeSantri: selectedSantri.kode,
          jumlahKursi: manualJumlah,
        }),
      });
      const resJson = await res.json();

      if (!res.ok || !resJson.ok) {
        console.error('Error inserting manual order:', resJson.error);
        setStatusMsg({ tipe: 'error', text: `Gagal membuat transaksi manual: ${resJson.error || 'Server error'}` });
        setIsSubmittingManual(false);
        return;
      }

      // Kirim WA Notifikasi ke Wali jika dicentang
      if (manualKirimWa && selectedSantri.no_hp && selectedSantri.no_hp !== '-' && selectedSantri.no_hp.length >= 9) {
        const origin = getLiveBaseUrl();
        const pesanWa = manualLangsungVerifikasi
          ? `Assalamu'alaikum Wr. Wb.\n\n` +
            `Kepada Yth. Bapak/Ibu *${selectedSantri.nama_wali}*,\n` +
            `Panitia Haul & Haflah P3TQ - MHMTQ telah menambahkan *${manualJumlah} Kuota Tambahan* secara langsung untuk santri *${selectedSantri.nama}* (${selectedSantri.kelas || '-'}).\n\n` +
            `📋 *Rincian Status*:\n` +
            `• ID Pesanan: ${orderId}\n` +
            `• Metode: ${manualMetode === 'TUNAI' ? 'Kas Tunai di Sekretariat' : 'Transfer Rekening BRI'}\n` +
            `• Jumlah: +${manualJumlah} Kursi\n` +
            `• Status: *DIVERIFIKASI LANGSUNG (Aktif)*\n\n` +
            `*Konfirmasi Kehadiran Anda (RSVP)*\n` +
            `Bantu panitia menyiapkan kursi dan penginapan dengan memperbarui konfirmasi kehadiran (jumlah wali santri putra & putri) pada E-Undangan:\n\n` +
            `Akses E-Undangan & QR Presensi:\n` +
            `🔗 ${origin}/u/${selectedSantri.kode}\n\n` +
            `_Panitia Haul & Haflah P3TQ - MHMTQ_`
          : `Assalamu'alaikum Wr. Wb.\n\n` +
            `Kepada Yth. Bapak/Ibu *${selectedSantri.nama_wali}*,\n` +
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

  return {
    pembelianList,
    loadingData,
    errorMessage,
    statusMsg,
    setStatusMsg,
    previewBuktiModal,
    setPreviewBuktiModal,
    isProcessing,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    showAddManualModal,
    setShowAddManualModal,
    searchSantriText,
    setSearchSantriText,
    selectedSantriKode,
    setSelectedSantriKode,
    manualJumlah,
    setManualJumlah,
    manualMetode,
    setManualMetode,
    manualLangsungVerifikasi,
    setManualLangsungVerifikasi,
    manualCatatan,
    setManualCatatan,
    manualKirimWa,
    setManualKirimWa,
    isSubmittingManual,
    loading: loadingData,
    error: errorMessage,
    fetchData,
    refetch: fetchData,
    santriMap,
    paguTerjual,
    sisaPagu,
    countMenungguVerifikasi,
    countMenungguPembayaran,
    countDiverifikasi,
    countBatal,
    filteredOrders,
    filteredSantriList,
    selectedSantri,
    handleVerifikasiOrder,
    handleTolakOrder,
    handleSubmitTambahManual,
  };
}
