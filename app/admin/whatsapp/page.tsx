'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  Search,
  ExternalLink,
  MessageSquare,
  Settings,
  Filter,
  Clock,
  Smartphone,
  Sparkles,
  Wifi,
  WifiOff,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Check,
  ShoppingBag,
  Edit2,
  X,
  RefreshCw,
  Users,
  UserCheck,
  MapPin,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { normalkanNomorHp, buatPesanPengingatKonfirmasi } from '@/lib/hmac';
import { BAGIAN_TAMATAN_LIST, extractBagianTamatan, getGolonganUndangan, getDefaultJalurMasuk } from '@/lib/types';
import AuthGuard from '@/components/AuthGuard';

export default function WhatsAppPage() {
  const [activeTab, setActiveTab] = useState<'WALI_SANTRI' | 'TAMU_UNDANGAN'>('WALI_SANTRI');

  // =========================================================================
  // STATE WALI SANTRI
  // =========================================================================
  const [gelombang, setGelombang] = useState<1 | 2 | 3>(1);
  const [kuotaTambahanBuka, setKuotaTambahanBuka] = useState(false);
  const [savingKuotaConfig, setSavingKuotaConfig] = useState(false);
  const [linkGrupWa, setLinkGrupWa] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('SEMUA');
  const [filterKonfirmasi, setFilterKonfirmasi] = useState<'SEMUA' | 'BELUM' | 'SUDAH'>('SEMUA');
  const [filterKategori, setFilterKategori] = useState<string>('SEMUA');
  const [filterBagian, setFilterBagian] = useState<string>('SEMUA');
  const [search, setSearch] = useState('');
  
  const [keluargaList, setKeluargaList] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Edit Phone Modal State (Wali)
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [newHpInput, setNewHpInput] = useState('');

  // Sending state per item (Wali)
  const [sendingKode, setSendingKode] = useState<string | null>(null);

  // Batch Blasting state (Wali)
  const [isBlasting, setIsBlasting] = useState(false);
  const [blastProgress, setBlastProgress] = useState<{ current: number; total: number; success: number; failed: number }>({
    current: 0,
    total: 0,
    success: 0,
    failed: 0,
  });
  const stopBlastingRef = useRef(false);

  // =========================================================================
  // STATE TAMU UNDANGAN
  // =========================================================================
  const [tamuList, setTamuList] = useState<any[]>([]);
  const [loadingTamuData, setLoadingTamuData] = useState(true);
  const [tamuFilterGolongan, setTamuFilterGolongan] = useState<string>('SEMUA');
  const [tamuFilterStatus, setTamuFilterStatus] = useState<string>('SEMUA');
  const [tamuFilterJalurStatus, setTamuFilterJalurStatus] = useState<string>('SEMUA');
  const [tamuSearch, setTamuSearch] = useState('');
  const [massJalurInputText, setMassJalurInputText] = useState('');

  // Edit Phone Modal State (Tamu)
  const [editingTamuItem, setEditingTamuItem] = useState<any | null>(null);
  const [newHpInputTamu, setNewHpInputTamu] = useState('');

  // Sending state per item (Tamu)
  const [tamuSendingKode, setTamuSendingKode] = useState<string | null>(null);

  // Batch Blasting state (Tamu)
  const [isTamuBlasting, setIsTamuBlasting] = useState(false);
  const [tamuBlastProgress, setTamuBlastProgress] = useState<{ current: number; total: number; success: number; failed: number }>({
    current: 0,
    total: 0,
    success: 0,
    failed: 0,
  });
  const stopTamuBlastingRef = useRef(false);

  // Fonnte device status state
  const [fonnteStatus, setFonnteStatus] = useState<{
    connected: boolean;
    name?: string;
    device?: string;
    quota?: string;
    loading: boolean;
    error?: string;
  }>({
    connected: true,
    name: 'Ahmad Chamdan Yuwafin',
    device: '085790633812',
    quota: '1000',
    loading: false,
  });

  // =========================================================================
  // FETCH DATA SUPABASE
  // =========================================================================

  // Fetch Wali Santri
  const fetchSantriWaData = async () => {
    try {
      setLoadingData(true);
      const { data, error } = await supabase
        .from('peserta_santri')
        .select('*')
        .order('kode', { ascending: true });

      if (error) {
        console.error('Error fetching peserta_santri for WA:', error);
        setKeluargaList([]);
      } else if (data) {
        setKeluargaList(
          data.map((s: any) => ({
            id: s.id,
            kode: s.kode,
            namaWali: s.nama_wali || '-',
            noHp: s.no_hp || '',
            alamat: s.alamat || 'Kediri',
            statusWa: s.status_wa || 'BELUM',
            santri: [
              {
                id: s.id,
                nama: s.nama,
                kategoriUtama: s.kategori_utama || 'BIL_GHOIB',
                subKategori: s.sub_kategori || 'Bil Ghoib',
                kelas: s.kelas || '-',
                kamar: s.kamar || '-',
              },
            ],
            kuota: {
              kuotaDasar: s.kuota_dasar || 2,
              kuotaTambahan: s.kuota_tambahan || 0,
              terpakai: s.kuota_terpakai || 0,
            },
            estimasi: {
              statusKonfirmasi: s.kuota_terpakai > 0 ? 'SUDAH' : 'BELUM',
              perkiraanL: 1,
              perkiraanP: 1,
            },
          }))
        );
      }
    } catch (e) {
      console.warn('Error in fetchSantriWaData:', e);
      setKeluargaList([]);
    } finally {
      setLoadingData(false);
    }
  };

  // Fetch Tamu Undangan 100% dari Supabase
  const fetchTamuWaData = async () => {
    try {
      setLoadingTamuData(true);
      const { data, error } = await supabase
        .from('tamu_undangan')
        .select('*')
        .order('kode', { ascending: true });

      if (error) {
        console.error('Error fetching tamu_undangan for WA:', error);
        setTamuList([]);
      } else if (data) {
        setTamuList(
          data.map((t: any) => ({
            id: t.id,
            kode: t.kode,
            nama: t.nama,
            namaPutra: t.nama_putra,
            namaPutri: t.nama_putri,
            kategori: t.kategori || 'Tamu Kehormatan',
            subKategori: t.sub_kategori || 'UMUM',
            instansi: t.instansi || '-',
            alamat: t.alamat || '-',
            noHp: t.no_hp || '',
            kuotaDasar: t.kuota_dasar || 2,
            kuotaTambahan: t.kuota_tambahan || 0,
            warnaTiket: t.warna_tiket || 'Merah Gold',
            statusWa: t.status_wa || 'BELUM',
            jalurMasuk: t.jalur_masuk || '',
            golongan: getGolonganUndangan(t),
          }))
        );
      }
    } catch (e) {
      console.warn('Error in fetchTamuWaData:', e);
      setTamuList([]);
    } finally {
      setLoadingTamuData(false);
    }
  };

  const fetchKuotaConfigStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('konfigurasi_sistem')
        .select('value')
        .eq('key', 'kuota_tambahan_status')
        .maybeSingle();

      if (error) {
        console.error('Error reading kuota_tambahan_status from Supabase:', error);
        setKuotaTambahanBuka(false);
        return;
      }

      if (data && data.value) {
        let isAktif = false;
        if (typeof data.value === 'object' && data.value !== null) {
          isAktif = Boolean(data.value.aktif);
        } else if (typeof data.value === 'string') {
          isAktif = data.value === 'true' || data.value === 'TRUE';
        } else if (typeof data.value === 'boolean') {
          isAktif = data.value;
        }
        setKuotaTambahanBuka(isAktif);
      } else {
        setKuotaTambahanBuka(false);
      }
    } catch (err) {
      console.warn('Error fetching kuota_tambahan_status from Supabase:', err);
      setKuotaTambahanBuka(false);
    }
  };

  const handleToggleKuotaSwitch = async () => {
    if (savingKuotaConfig) return;
    const targetVal = !kuotaTambahanBuka;
    setSavingKuotaConfig(true);

    try {
      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from('konfigurasi_sistem')
        .upsert(
          {
            key: 'kuota_tambahan_status',
            value: { aktif: targetVal },
            updated_at: nowIso,
          },
          { onConflict: 'key' }
        );

      if (error) {
        console.error('Error updating kuota_tambahan_status:', error);
        alert(`⚠️ Gagal mengubah status Beli Kuota di Supabase: ${error.message || error}`);
      } else {
        setKuotaTambahanBuka(targetVal);
      }
    } catch (e: any) {
      console.error('Exception toggling kuota_tambahan_status:', e);
      alert(`⚠️ Terjadi kesalahan sistem: ${e.message || e}`);
    } finally {
      setSavingKuotaConfig(false);
    }
  };

  useEffect(() => {
    fetchSantriWaData();
    fetchTamuWaData();
    fetchKuotaConfigStatus();

    const channel = supabase
      .channel('konfigurasi_sistem_wa_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'konfigurasi_sistem' },
        () => {
          fetchKuotaConfigStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Handle URL Query Params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const g = params.get('gelombang');
      const fk = params.get('filterKonfirmasi');
      const tipe = params.get('tipe');
      const tab = params.get('tab');
      if (tab === 'tamu' || tab === 'undangan') {
        setActiveTab('TAMU_UNDANGAN');
      }
      if (g === '3' || tipe === 'pengingat') {
        setGelombang(3);
        setFilterKonfirmasi('BELUM');
      } else if (g === '2') {
        setGelombang(2);
      }
      if (fk === 'BELUM') {
        setFilterKonfirmasi('BELUM');
      } else if (fk === 'SUDAH') {
        setFilterKonfirmasi('SUDAH');
      }
    }
  }, []);

  // Cek Status Perangkat Fonnte saat halaman dibuka
  useEffect(() => {
    async function checkDevice() {
      try {
        setFonnteStatus((prev) => ({ ...prev, loading: true }));
        const res = await fetch('/api/whatsapp/device');
        const json = await res.json();
        if (json.ok && json.data) {
          setFonnteStatus({
            connected: json.data.device_status === 'connect' || json.data.status === true,
            name: json.data.name || 'Ahmad Chamdan Yuwafin',
            device: json.data.device || '085790633812',
            quota: json.data.quota || '1000',
            loading: false,
          });
        } else {
          setFonnteStatus((prev) => ({ ...prev, loading: false }));
        }
      } catch (err: any) {
        setFonnteStatus((prev) => ({ ...prev, loading: false, error: err.message }));
      }
    }
    checkDevice();
  }, []);

  // =========================================================================
  // LOGIK WALI SANTRI
  // =========================================================================

  const getTeksPesan = (kel: any, gel: 1 | 2 | 3) => {
    const santri = kel.santri?.[0];
    const totalKuota = kel.kuota?.kuotaDasar + kel.kuota?.kuotaTambahan;
    const liveDomain = process.env.NEXT_PUBLIC_APP_URL || 'https://absensi-haul-haflah-p3tq-mhmtq-2027.vercel.app';
    const origin =
      typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')
        ? window.location.origin
        : liveDomain;
    const linkPortal = `${origin}/u/${kel.kode}`;
    const linkPembelian = `${origin}/beli/${kel.kode}`;

    const katText =
      santri?.kategoriUtama === 'BIL_GHOIB'
        ? 'Bil Ghoib'
        : santri?.kategoriUtama === 'BIN_NADZOR'
        ? 'Bin Nadzori'
        : santri?.kategoriUtama === 'TAMATAN'
        ? `Tamatan (Bagian ${extractBagianTamatan(santri?.kelas || santri?.subKategori)})`
        : 'Sohibul Hajat';

    if (gel === 1) {
      return `Yth. Bapak/Ibu Wali Santri
*${kel.namaWali}*

Dengan memohon rahmat dan ridha Allah SWT, kami mengundang Bapak/Ibu untuk menghadiri:

*HAUL & HAFLAH P3TQ DAN MHMTQ 1448 H./ 2027 M.*
*Pondok Pesantren Putri Tahfizhil Qur-an (P3TQ)*
*Madrasah Hidayatul Mubtadi-aat Fittahfizhi wal Qiro-at (MHMTQ)*

Hari/Tanggal : Sabtu, 02 Januari 2027 M. / 24 Rajab 1448 H.
Waktu : 06.30 WIB - Selesai
Tempat : Aula Muktamar Pondok Pesantren Lirboyo Kediri
Masuk melalui: Gerbang Selatan (Bola Dunia)

Sohibul hajat : *${santri?.nama || '-'}*
Kategori : ${katText}
Kamar : ${santri?.kamar || '-'}
Hak Kuota Masuk : *${totalKuota} orang*

Undangan digital resmi, konfirmasi kehadiran, dan QR Code gerbang masuk dapat diakses pada tautan berikut:
${linkPortal}

_Mohon QR Code disimpan dan ditunjukkan kepada petugas di gerbang pada hari acara._

Untuk informasi dan pengumuman terbaru, silakan bergabung di grup WhatsApp resmi wali santri:
${linkGrupWa}

Atas perhatian dan kehadirannya kami sampaikan terima kasih.
Jazakumullahu khairan katsiran.

Wassalamu'alaikum warahmatullahi wabarakatuh
*Panitia Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.*`;
    } else if (gel === 2) {
      return `Yth. Bapak/Ibu Wali Santri
*${kel.namaWali}*

Menindaklanjuti undangan Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M., kami membuka kesempatan penambahan kuota kehadiran bagi keluarga yang ingin mengajak lebih banyak sanak saudara.

Ketentuan:
• Rincian biaya dan rekening tujuan transfer tersedia lengkap pada portal digital di bawah
• Bila dalam 6 jam belum upload bukti transfer, maka pemesanan otomatis dibatalkan
• Berlaku selama kuota masih tersedia (pagu terbatas 300 kuota)
• Pembatalan sebelum hari-H dana dikembalikan penuh
• Pendaftaran ditutup otomatis bila kuota habis
• Kuota otomatis ditambahkan ke QR Code Anda

Pemesanan dan konfirmasi pembayaran:
${linkPembelian}

Wassalamu'alaikum warahmatullahi wabarakatuh
*Panitia Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.*`;
    } else {
      return buatPesanPengingatKonfirmasi(santri?.nama || kel.namaWali, kel.kode, origin);
    }
  };

  const updateStatusWaInSupabase = async (id: string, status: string) => {
    try {
      await supabase
        .from('peserta_santri')
        .update({ status_wa: status })
        .eq('id', id);
      
      setKeluargaList((prev) =>
        prev.map((item) => (item.id === id ? { ...item, statusWa: status } : item))
      );
    } catch (e) {
      console.warn('Error updating status_wa in Supabase:', e);
    }
  };

  const handleSaveEditNoHp = async () => {
    if (!editingItem || !newHpInput.trim()) return;
    try {
      const { error } = await supabase
        .from('peserta_santri')
        .update({
          no_hp: newHpInput.trim(),
          status_wa: 'BELUM',
        })
        .eq('id', editingItem.id);

      if (error) {
        alert(`Gagal memperbarui nomor HP di database Supabase: ${error.message}`);
      } else {
        alert(`✓ Nomor HP untuk ${editingItem.namaWali} berhasil diperbarui di Supabase!`);
        setEditingItem(null);
        setNewHpInput('');
        await fetchSantriWaData();
      }
    } catch (err: any) {
      alert(`Terjadi kesalahan sistem: ${err.message}`);
    }
  };

  const handleKirimFonnte = async (kel: any) => {
    if (gelombang === 1 && (!linkGrupWa || linkGrupWa.trim() === '')) {
      alert('⚠️ PERINGATAN WAJIB:\nLink Grup WhatsApp Resmi Wali Santri masih KOSONG!\n\nSesuai SOP, link grup WA harus selalu diisi dan diperbarui setiap kali mau mengirim pesan undangan.');
      return false;
    }

    const rawHp = kel.noHp;
    if (!rawHp || rawHp.trim() === '' || rawHp.trim().length < 8) {
      await updateStatusWaInSupabase(kel.id, 'NOMOR_TIDAK_TERDAFTAR');
      alert(`Nomor HP untuk ${kel.namaWali} tidak terdaftar atau tidak valid! Status telah diperbarui.`);
      return false;
    }

    setSendingKode(kel.kode);

    try {
      const teks = getTeksPesan(kel, gelombang);
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: rawHp,
          message: teks,
        }),
      });

      const json = await res.json();
      if (json.ok) {
        await updateStatusWaInSupabase(kel.id, 'TERKIRIM');
        setSendingKode(null);
        return true;
      } else {
        const isNumInvalid = json.data?.reason?.toLowerCase().includes('invalid') || json.data?.reason?.toLowerCase().includes('not registered');
        const newStatus = isNumInvalid ? 'NOMOR_TIDAK_TERDAFTAR' : 'GAGAL';
        await updateStatusWaInSupabase(kel.id, newStatus);
        alert(`Gagal mengirim via Fonnte: ${json.data?.reason || json.message || 'Error'}`);
        setSendingKode(null);
        return false;
      }
    } catch (err: any) {
      await updateStatusWaInSupabase(kel.id, 'GAGAL');
      alert(`Gagal menghubungi server Fonnte: ${err.message}`);
      setSendingKode(null);
      return false;
    }
  };

  const handleKirimManualWA = async (kel: any) => {
    if (gelombang === 1 && (!linkGrupWa || linkGrupWa.trim() === '')) {
      alert('⚠️ PERINGATAN WAJIB:\nLink Grup WhatsApp Resmi Wali Santri masih KOSONG!');
      return;
    }

    const rawHp = kel.noHp;
    if (!rawHp || rawHp.trim() === '' || rawHp.trim().length < 8) {
      await updateStatusWaInSupabase(kel.id, 'NOMOR_TIDAK_TERDAFTAR');
      alert('Nomor HP tidak terdaftar atau tidak valid!');
      return;
    }

    const nomorBersih = normalkanNomorHp(rawHp);
    const teks = getTeksPesan(kel, gelombang);
    const url = `https://wa.me/${nomorBersih}?text=${encodeURIComponent(teks)}`;

    window.open(url, '_blank');
    await updateStatusWaInSupabase(kel.id, 'TERKIRIM');
  };

  const filteredList = useMemo(() => {
    return keluargaList.filter((kel) => {
      const isSent = kel.statusWa === 'TERKIRIM';
      const isProblem = kel.statusWa === 'NOMOR_TIDAK_TERDAFTAR' || kel.statusWa === 'GAGAL' || !kel.noHp || kel.noHp.trim().length < 8;
      const santri = kel.santri?.[0];
      const kat = santri?.kategoriUtama || 'BIN_NADZOR';
      const bagian = kat === 'TAMATAN' ? extractBagianTamatan(santri?.kelas || santri?.subKategori) : '';

      if (filterStatus === 'BELUM' && isSent) return false;
      if (filterStatus === 'TERKIRIM' && !isSent) return false;
      if (filterStatus === 'BERMASALAH' && !isProblem) return false;

      if (filterKonfirmasi === 'BELUM' && kel.estimasi?.statusKonfirmasi === 'SUDAH') return false;
      if (filterKonfirmasi === 'SUDAH' && kel.estimasi?.statusKonfirmasi !== 'SUDAH') return false;

      if (filterKategori !== 'SEMUA' && kat !== filterKategori) return false;

      if (filterBagian === 'BIL_GHOIB') {
        if (kat !== 'BIL_GHOIB') return false;
      } else if (filterBagian === 'BIN_NADZOR') {
        if (kat !== 'BIN_NADZOR') return false;
      } else if (filterBagian === 'TAMATAN_SEMUA') {
        if (kat !== 'TAMATAN') return false;
      } else if (filterBagian !== 'SEMUA') {
        if (kat !== 'TAMATAN' || bagian !== filterBagian) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          kel.namaWali.toLowerCase().includes(q) ||
          santri?.nama.toLowerCase().includes(q) ||
          kel.kode.toLowerCase().includes(q) ||
          kel.alamat.toLowerCase().includes(q) ||
          kel.noHp.includes(q) ||
          bagian.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [keluargaList, filterStatus, filterKonfirmasi, filterKategori, filterBagian, search]);

  const handleStartBatchBlast = async () => {
    if (gelombang === 1 && (!linkGrupWa || linkGrupWa.trim() === '')) {
      alert('⚠️ PERINGATAN WAJIB:\nLink Grup WhatsApp Resmi Wali Santri masih KOSONG!');
      return;
    }

    const unsentList = filteredList.filter(
      (k) => k.statusWa !== 'TERKIRIM' && k.noHp && k.noHp.trim().length >= 8
    );

    if (unsentList.length === 0) {
      alert('Semua nomor pada filter saat ini sudah terkirim!');
      return;
    }

    const judulPesan =
      gelombang === 1
        ? 'Undangan Resmi & QR'
        : gelombang === 2
        ? 'Penawaran Kuota Tambahan'
        : 'Pengingat Konfirmasi Kehadiran';

    if (
      !window.confirm(
        `Mulai pengiriman otomatis [${judulPesan}] via Fonnte untuk ${unsentList.length} wali santri?\nPesan akan dikirim dengan jeda 1.5 detik per pesan.`
      )
    ) {
      return;
    }

    setIsBlasting(true);
    stopBlastingRef.current = false;
    setBlastProgress({ current: 0, total: unsentList.length, success: 0, failed: 0 });

    for (let i = 0; i < unsentList.length; i++) {
      if (stopBlastingRef.current) break;

      const kel = unsentList[i];
      setBlastProgress((prev) => ({ ...prev, current: i + 1 }));

      const ok = await handleKirimFonnte(kel);
      if (ok) {
        setBlastProgress((prev) => ({ ...prev, success: prev.success + 1 }));
      } else {
        setBlastProgress((prev) => ({ ...prev, failed: prev.failed + 1 }));
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    setIsBlasting(false);
  };

  const handleStopBatchBlast = () => {
    stopBlastingRef.current = true;
    setIsBlasting(false);
  };

  const totalTerkirim = keluargaList.filter((k) => k.statusWa === 'TERKIRIM').length;
  const pctTerkirim = keluargaList.length > 0 ? Math.min(100, Math.round((totalTerkirim / keluargaList.length) * 100)) : 0;

  const countBilGhoib = keluargaList.filter((k) => k.santri?.[0]?.kategoriUtama === 'BIL_GHOIB').length;
  const countBinNadzor = keluargaList.filter((k) => k.santri?.[0]?.kategoriUtama === 'BIN_NADZOR').length;
  const countTamatan = keluargaList.filter((k) => k.santri?.[0]?.kategoriUtama === 'TAMATAN').length;

  const countPerBagian = useMemo(() => {
    const map: Record<string, number> = {
      'A.01': 0, 'A.02': 0, 'A.03': 0, 'A.04': 0,
      'B.01': 0, 'B.02': 0, 'B.03': 0,
    };
    for (const k of keluargaList) {
      const santri = k.santri?.[0];
      if (santri?.kategoriUtama === 'TAMATAN') {
        const bg = extractBagianTamatan(santri?.kelas || santri?.subKategori);
        if (bg && map[bg] !== undefined) {
          map[bg]++;
        }
      }
    }
    return map;
  }, [keluargaList]);

  // =========================================================================
  // LOGIK TAMU UNDANGAN (FORMAT FIX & MANUAL JALUR MASUK WAJIB)
  // =========================================================================

  // Format pesan WA persis sesuai permintaan resmi
  const getTeksPesanTamu = (tamu: any) => {
    const baseUrl = 'https://absensi-haul-haflah-p3tq-mhmtq-2027.vercel.app';
    const linkPortal = `${baseUrl}/u/${tamu.kode || 'UNDxxxx'}`;
    const jalur = (tamu.jalurMasuk || '').trim();

    return `Yth. Bapak/Ibu 
*${tamu.nama}*

Dengan memohon rahmat dan ridha Allah SWT, kami mengundang Bapak/Ibu untuk menghadiri:

*HAUL & HAFLAH P3TQ DAN MHMTQ 1448 H./ 2027 M.*
*Pondok Pesantren Putri Tahfizhil Qur-an (P3TQ)*
*Madrasah Hidayatul Mubtadi-aat Fittahfizhi wal Qiro-at (MHMTQ)*

Hari/Tanggal : Sabtu, 02 Januari 2027 M. / 24 Rajab 1448 H.
Waktu        : 06.30 WIB - Selesai
Tempat       : Aula Muktamar Pondok Pesantren Lirboyo Kediri
Masuk melalui: ${jalur || '[JALUR MASUK - MANUAL INPUT]'}

Undangan digital resmi, konfirmasi kehadiran, dan QR Code gerbang masuk dapat diakses pada tautan berikut:
${linkPortal}

_Mohon QR Code disimpan dan ditunjukkan kepada petugas di gerbang pada hari acara._

Atas perhatian dan kehadirannya kami sampaikan terima kasih.
Jazakumullahu khairan katsiran.

Wassalamu'alaikum warahmatullahi wabarakatuh
*Panitia Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.*`;
  };

  const updateTamuWaInSupabase = async (id: string | number, status: string, jalurMasuk?: string) => {
    try {
      const payload: any = { status_wa: status };
      if (jalurMasuk !== undefined) {
        payload.jalur_masuk = jalurMasuk;
      }

      const { error } = await supabase
        .from('tamu_undangan')
        .update(payload)
        .eq('id', id);

      if (error && (error.code === '42703' || error.code === 'PGRST204') && payload.jalur_masuk !== undefined) {
        delete payload.jalur_masuk;
        await supabase.from('tamu_undangan').update(payload).eq('id', id);
      }

      setTamuList((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                statusWa: status,
                ...(jalurMasuk !== undefined ? { jalurMasuk } : {}),
              }
            : item
        )
      );
    } catch (e) {
      console.warn('Error updating status_wa / jalur_masuk in Supabase:', e);
    }
  };

  const handleUpdateJalurMasuk = async (tamuId: string | number, newJalur: string) => {
    const target = tamuList.find((t) => t.id === tamuId);
    const currentStatus = target?.statusWa || 'BELUM';
    await updateTamuWaInSupabase(tamuId, currentStatus, newJalur);
  };

  const handleApplyMassJalurMasuk = async (customInput: string) => {
    const emptyList = tamuList.filter((t) => !t.jalurMasuk || !t.jalurMasuk.trim());
    if (emptyList.length === 0) {
      alert('Seluruh tamu sudah memiliki Jalur Masuk!');
      return;
    }

    const customVal = (customInput || '').trim();

    setTamuList((prev) =>
      prev.map((t) => {
        if (!t.jalurMasuk || !t.jalurMasuk.trim()) {
          const targetVal = customVal || getDefaultJalurMasuk(t.golongan);
          return { ...t, jalurMasuk: targetVal };
        }
        return t;
      })
    );

    for (const t of emptyList) {
      const targetVal = customVal || getDefaultJalurMasuk(t.golongan);
      await updateTamuWaInSupabase(t.id, t.statusWa, targetVal);
    }

    if (customVal) {
      alert(`✓ Berhasil menerapkan Jalur Masuk "${customVal}" ke ${emptyList.length} tamu!`);
    } else {
      alert(`✓ Berhasil menerapkan Jalur Masuk default per golongan (Istimewa/Kehormatan: "Jalur VIP", Umum: "Gerbang Selatan") ke ${emptyList.length} tamu yang kosong!`);
    }
  };

  const handleSaveEditNoHpTamu = async () => {
    if (!editingTamuItem || !newHpInputTamu.trim()) return;
    try {
      const { error } = await supabase
        .from('tamu_undangan')
        .update({
          no_hp: newHpInputTamu.trim(),
          status_wa: 'BELUM',
        })
        .eq('id', editingTamuItem.id);

      if (error) {
        alert(`Gagal memperbarui nomor HP di database Supabase: ${error.message}`);
      } else {
        alert(`✓ Nomor HP untuk ${editingTamuItem.nama} berhasil diperbarui di Supabase!`);
        setEditingTamuItem(null);
        setNewHpInputTamu('');
        await fetchTamuWaData();
      }
    } catch (err: any) {
      alert(`Terjadi kesalahan sistem: ${err.message}`);
    }
  };

  const handleKirimFonnteTamu = async (tamu: any) => {
    if (!tamu.jalurMasuk || !tamu.jalurMasuk.trim()) {
      alert(`⚠️ PERINGATAN WAJIB:\nJalur masuk untuk ${tamu.nama} masih KOSONG!\n\nHarap isi kolom "Masuk Melalui" (contoh: Gerbang Selatan (Bola Dunia)) sebelum mengirim pesan undangan.`);
      return false;
    }

    const rawHp = tamu.noHp;
    if (!rawHp || rawHp.trim() === '' || rawHp.trim().length < 8) {
      await updateTamuWaInSupabase(tamu.id, 'NOMOR_TIDAK_TERDAFTAR');
      alert(`Nomor HP untuk ${tamu.nama} tidak terdaftar atau tidak valid! Status diperbarui.`);
      return false;
    }

    setTamuSendingKode(tamu.kode);

    try {
      const teks = getTeksPesanTamu(tamu);
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: rawHp,
          message: teks,
        }),
      });

      const json = await res.json();
      if (json.ok) {
        await updateTamuWaInSupabase(tamu.id, 'TERKIRIM');
        setTamuSendingKode(null);
        return true;
      } else {
        const isNumInvalid = json.data?.reason?.toLowerCase().includes('invalid') || json.data?.reason?.toLowerCase().includes('not registered');
        const newStatus = isNumInvalid ? 'NOMOR_TIDAK_TERDAFTAR' : 'GAGAL';
        await updateTamuWaInSupabase(tamu.id, newStatus);
        alert(`Gagal mengirim via Fonnte: ${json.data?.reason || json.message || 'Error'}`);
        setTamuSendingKode(null);
        return false;
      }
    } catch (err: any) {
      await updateTamuWaInSupabase(tamu.id, 'GAGAL');
      alert(`Gagal menghubungi server Fonnte: ${err.message}`);
      setTamuSendingKode(null);
      return false;
    }
  };

  const handleKirimManualWATamu = async (tamu: any) => {
    if (!tamu.jalurMasuk || !tamu.jalurMasuk.trim()) {
      alert(`⚠️ PERINGATAN WAJIB:\nJalur masuk untuk ${tamu.nama} masih KOSONG!\n\nHarap isi kolom "Masuk Melalui" sebelum mengirim pesan.`);
      return;
    }

    const rawHp = tamu.noHp;
    if (!rawHp || rawHp.trim() === '' || rawHp.trim().length < 8) {
      await updateTamuWaInSupabase(tamu.id, 'NOMOR_TIDAK_TERDAFTAR');
      alert('Nomor HP tidak terdaftar atau tidak valid!');
      return;
    }

    const nomorBersih = normalkanNomorHp(rawHp);
    const teks = getTeksPesanTamu(tamu);
    const url = `https://wa.me/${nomorBersih}?text=${encodeURIComponent(teks)}`;

    window.open(url, '_blank');
    await updateTamuWaInSupabase(tamu.id, 'TERKIRIM');
  };

  const filteredTamuList = useMemo(() => {
    return tamuList.filter((tamu) => {
      const isSent = tamu.statusWa === 'TERKIRIM';
      const isProblem = tamu.statusWa === 'NOMOR_TIDAK_TERDAFTAR' || tamu.statusWa === 'GAGAL' || !tamu.noHp || tamu.noHp.trim().length < 8;
      const isJalurKosong = !tamu.jalurMasuk || !tamu.jalurMasuk.trim();

      if (tamuFilterStatus === 'BELUM' && isSent) return false;
      if (tamuFilterStatus === 'TERKIRIM' && !isSent) return false;
      if (tamuFilterStatus === 'BERMASALAH' && !isProblem) return false;

      if (tamuFilterGolongan !== 'SEMUA' && tamu.golongan !== tamuFilterGolongan) return false;

      if (tamuFilterJalurStatus === 'TERISI' && isJalurKosong) return false;
      if (tamuFilterJalurStatus === 'KOSONG' && !isJalurKosong) return false;

      if (tamuSearch.trim()) {
        const q = tamuSearch.toLowerCase();
        return (
          tamu.nama.toLowerCase().includes(q) ||
          (tamu.instansi && tamu.instansi.toLowerCase().includes(q)) ||
          tamu.kode.toLowerCase().includes(q) ||
          (tamu.alamat && tamu.alamat.toLowerCase().includes(q)) ||
          tamu.noHp.includes(q) ||
          tamu.kategori.toLowerCase().includes(q) ||
          (tamu.jalurMasuk && tamu.jalurMasuk.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [tamuList, tamuFilterStatus, tamuFilterGolongan, tamuFilterJalurStatus, tamuSearch]);

  const handleStartBatchBlastTamu = async () => {
    const validList = filteredTamuList.filter(
      (t) => t.statusWa !== 'TERKIRIM' && t.noHp && t.noHp.trim().length >= 8 && t.jalurMasuk && t.jalurMasuk.trim()
    );

    const skippedJalurKosongCount = filteredTamuList.filter(
      (t) => t.statusWa !== 'TERKIRIM' && t.noHp && t.noHp.trim().length >= 8 && (!t.jalurMasuk || !t.jalurMasuk.trim())
    ).length;

    if (validList.length === 0) {
      if (skippedJalurKosongCount > 0) {
        alert(`⚠️ Terdapat ${skippedJalurKosongCount} tamu yang belum terkirim, namun DILEWATI (SKIP) karena kolom "Masuk Melalui" (Jalur Masuk) masih KOSONG.\n\nHarap isi kolom Jalur Masuk untuk tamu-tamu tersebut terlebih dahulu.`);
      } else {
        alert('Semua nomor tamu undangan pada filter saat ini sudah terkirim!');
      }
      return;
    }

    const promptMsg = skippedJalurKosongCount > 0
      ? `Mulai pengiriman otomatis WA undangan ke ${validList.length} tamu via Fonnte?\n\n⚠️ CATATAN: ${skippedJalurKosongCount} tamu akan DILEWATI (SKIP) karena Jalur Masuk belum diisi.`
      : `Mulai pengiriman otomatis WA undangan ke ${validList.length} tamu undangan via Fonnte?`;

    if (!window.confirm(promptMsg)) {
      return;
    }

    setIsTamuBlasting(true);
    stopTamuBlastingRef.current = false;
    setTamuBlastProgress({ current: 0, total: validList.length, success: 0, failed: 0 });

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < validList.length; i++) {
      if (stopTamuBlastingRef.current) break;

      const tamu = validList[i];
      setTamuBlastProgress((prev) => ({ ...prev, current: i + 1 }));

      const ok = await handleKirimFonnteTamu(tamu);
      if (ok) {
        successCount++;
        setTamuBlastProgress((prev) => ({ ...prev, success: prev.success + 1 }));
      } else {
        failedCount++;
        setTamuBlastProgress((prev) => ({ ...prev, failed: prev.failed + 1 }));
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    setIsTamuBlasting(false);
    alert(`✓ Pengiriman Massal Selesai!\n• Terkirim: ${successCount} tamu\n• Gagal: ${failedCount} tamu\n• Dilewati (Jalur Kosong): ${skippedJalurKosongCount} tamu`);
  };

  const handleStopBatchBlastTamu = () => {
    stopTamuBlastingRef.current = true;
    setIsTamuBlasting(false);
  };

  const totalTamuTerkirim = tamuList.filter((t) => t.statusWa === 'TERKIRIM').length;
  const pctTamuTerkirim = tamuList.length > 0 ? Math.min(100, Math.round((totalTamuTerkirim / tamuList.length) * 100)) : 0;

  const countTamuIstimewa = tamuList.filter((t) => t.golongan === 'ISTIMEWA').length;
  const countTamuKehormatan = tamuList.filter((t) => t.golongan === 'KEHORMATAN').length;
  const countTamuUmum = tamuList.filter((t) => t.golongan === 'UMUM').length;
  const countJalurKosong = tamuList.filter((t) => !t.jalurMasuk || !t.jalurMasuk.trim()).length;

  return (
    <AuthGuard allowedRoles={['ADMIN', 'PENERIMA_TAMU', 'PIMPINAN']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* TAB SWITCHER UTAMA */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-[#D5C4B4] pb-3 gap-3">
          <div className="grid grid-cols-2 md:flex items-center gap-2 md:gap-3 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('WALI_SANTRI')}
              className={`px-3 sm:px-5 py-2.5 rounded-2xl font-serif font-black text-xs sm:text-sm transition-all flex items-center justify-center space-x-1.5 sm:space-x-2 cursor-pointer text-center ${
                activeTab === 'WALI_SANTRI'
                  ? 'bg-[#8C6A47] text-white shadow-md border border-[#735334]'
                  : 'bg-white hover:bg-[#FAF7F3] text-[#422F21] border border-[#D5C4B4]'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span className="truncate">1. WALI SANTRI ({keluargaList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('TAMU_UNDANGAN')}
              className={`px-3 sm:px-5 py-2.5 rounded-2xl font-serif font-black text-xs sm:text-sm transition-all flex items-center justify-center space-x-1.5 sm:space-x-2 cursor-pointer text-center ${
                activeTab === 'TAMU_UNDANGAN'
                  ? 'bg-[#8C6A47] text-white shadow-md border border-[#735334]'
                  : 'bg-white hover:bg-[#FAF7F3] text-[#422F21] border border-[#D5C4B4]'
              }`}
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span className="truncate">2. WA TAMU ({tamuList.length})</span>
            </button>
          </div>

          <div className="text-xs text-[#7A624E] font-medium hidden md:block">
            Modul WA Gateway Resmi Haul &amp; Haflah P3TQ - MHMTQ 2027
          </div>
        </div>

        {/* ===================================================================== */}
        {/* CONTENT TAB 1: WALI SANTRI                                            */}
        {/* ===================================================================== */}
        {activeTab === 'WALI_SANTRI' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Header Panel WhatsApp Wali */}
            <div className="bg-[#FAF7F3] rounded-3xl p-4 sm:p-6 shadow-sm border-2 border-[#D5C4B4] space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#EFE8E1] text-[#8C6A47] flex items-center justify-center font-bold border border-[#D5C4B4] shadow-sm shrink-0">
                    <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-lg sm:text-xl font-serif font-black text-[#422F21] truncate">
                      Panel WA Gateway — Wali Santri
                    </h1>
                    <p className="text-xs text-[#7A624E] font-normal leading-tight">
                      Terhubung 100% langsung ke tabel Supabase `peserta_santri` (<strong>{keluargaList.length} Santri</strong>).
                    </p>
                  </div>
                </div>

                <button
                  onClick={fetchSantriWaData}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF7F3] text-[#8C6A47] border border-[#D5C4B4] font-bold text-xs shadow-xs flex items-center justify-center space-x-1.5 w-full md:w-auto cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
                  <span>Refresh Data DB</span>
                </button>
              </div>

              {/* Gelombang & Switch Kontrol Beli Kuota */}
              <div className="pt-3 border-t border-[#D5C4B4] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 bg-[#EFE8E1] p-1.5 rounded-2xl border border-[#D5C4B4] shadow-inner overflow-x-auto no-scrollbar whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => {
                      setGelombang(1);
                      setFilterKonfirmasi('SEMUA');
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-serif font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
                      gelombang === 1
                        ? 'bg-[#8C6A47] text-white shadow-md border border-[#735334]'
                        : 'text-[#422F21] hover:text-[#8C6A47] hover:bg-white/70'
                    }`}
                  >
                    <span>1. Undangan &amp; QR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGelombang(2);
                      setFilterKonfirmasi('SEMUA');
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-serif font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
                      gelombang === 2
                        ? 'bg-[#8C6A47] text-white shadow-md border border-[#735334]'
                        : 'text-[#422F21] hover:text-[#8C6A47] hover:bg-white/70'
                    }`}
                  >
                    <span>2. Kuota Tambahan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGelombang(3);
                      setFilterKonfirmasi('BELUM');
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-serif font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
                      gelombang === 3
                        ? 'bg-amber-800 text-white shadow-md border border-amber-900'
                        : 'text-[#422F21] hover:text-amber-800 hover:bg-white/70'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>3. Pengingat Konfirmasi</span>
                  </button>
                </div>

                <div className="flex items-center justify-between sm:justify-start space-x-2.5 px-3.5 py-2 bg-white rounded-xl border border-[#D5C4B4] shadow-xs shrink-0">
                  <span className="text-xs font-bold text-[#422F21] flex items-center space-x-1.5">
                    <ShoppingBag className="w-4 h-4 text-[#8C6A47]" />
                    <span>Beli Kuota:</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleToggleKuotaSwitch}
                      disabled={savingKuotaConfig}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                        kuotaTambahanBuka ? 'bg-emerald-600' : 'bg-[#C5B5A5]'
                      }`}
                    >
                      <span className="sr-only">Toggle Kuota Tambahan</span>
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          kuotaTambahanBuka ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        savingKuotaConfig
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : kuotaTambahanBuka
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-stone-100 text-stone-500 border border-stone-300'
                      }`}
                    >
                      {savingKuotaConfig ? 'MEMPROSES...' : kuotaTambahanBuka ? 'ON' : 'OFF (TUTUP)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fonnte Live Status Widget */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#FAF7F3] via-[#EFE8E1] to-[#FAF7F3] text-[#422F21] border-2 border-[#8C6A47]/40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shadow-sm shrink-0">
                    <Wifi className="w-4.5 h-4.5 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-serif font-black text-[#422F21] truncate">
                        FONNTE GATEWAY TERHUBUNG
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-400 shrink-0">
                        ONLINE
                      </span>
                    </div>
                    <div className="text-[11px] sm:text-xs text-[#7A624E] mt-0.5 font-medium truncate">
                      Pengirim: <strong>{fonnteStatus.name}</strong> ({fonnteStatus.device}) · Sisa: <strong>{fonnteStatus.quota} Pesan</strong>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-auto">
                  {!isBlasting ? (
                    <button
                      onClick={handleStartBatchBlast}
                      className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8C6A47] via-[#A47E57] to-[#8C6A47] hover:brightness-105 text-white font-serif font-black text-xs shadow-md flex items-center justify-center space-x-1.5 transition-all border border-[#FAF7F3] cursor-pointer"
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      <span>
                        {gelombang === 3
                          ? 'Blast Pengingat (Fonnte)'
                          : 'Kirim Massal Otomatis (Fonnte)'}
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStopBatchBlast}
                      className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <Pause className="w-4 h-4" />
                      <span>Hentikan Blasting ({blastProgress.current}/{blastProgress.total})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Box Preview Template Pesan */}
              <div className="mt-4 p-4 rounded-2xl bg-white border border-[#D5C4B4] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-[#8C6A47]" />
                    <span className="font-bold text-xs text-[#422F21]">
                      Preview Template Pesan Wali:{' '}
                      <span className="text-[#8C6A47]">
                        {gelombang === 1
                          ? 'Gelombang 1 - Undangan Resmi & QR'
                          : gelombang === 2
                          ? 'Gelombang 2 - Info Kuota Tambahan'
                          : 'Pengingat Konfirmasi Kehadiran'}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FAF7F3] border border-[#D5C4B4]/70 font-mono text-[11px] text-[#422F21] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {getTeksPesan(
                    keluargaList[0] || {
                      kode: 'SH0001',
                      namaWali: 'Bpk. Wali Santri',
                      santri: [{ nama: 'Santri Putri', kategoriUtama: 'BIL_GHOIB', kamar: 'A.01' }],
                      kuota: { kuotaDasar: 2, kuotaTambahan: 0 },
                    },
                    gelombang
                  )}
                </div>
              </div>

              {/* Progress Bar Blasting jika aktif */}
              {isBlasting && (
                <div className="mt-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 space-y-2 text-xs text-amber-950">
                  <div className="flex items-center justify-between font-bold">
                    <span>Sedang Mengirim Pesan WhatsApp Massal...</span>
                    <span>
                      {blastProgress.current} dari {blastProgress.total} wali ({blastProgress.success} berhasil, {blastProgress.failed} gagal)
                    </span>
                  </div>
                  <div className="w-full bg-amber-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-[#8C6A47] h-2.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.round((blastProgress.current / blastProgress.total) * 100) || 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Pengaturan Link Grup WA */}
              <div
                className={`mt-4 p-4 rounded-2xl border transition-all ${
                  !linkGrupWa.trim()
                    ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-300/40'
                    : 'bg-[#FAF7F3] border-[#D5C4B4]'
                } grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-[#422F21]">
                      Link Grup WhatsApp Resmi Wali Santri:
                    </label>
                    {!linkGrupWa.trim() ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-300 animate-pulse">
                        ⚠️ Belum Diisi (Wajib Update)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        ✓ Link Terisi
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={linkGrupWa}
                    onChange={(e) => setLinkGrupWa(e.target.value)}
                    placeholder="Wajib selalu diisi setiap mau kirim: https://chat.whatsapp.com/..."
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-mono transition-all ${
                      !linkGrupWa.trim()
                        ? 'border-rose-400 bg-rose-50/40 text-rose-950 focus:ring-2 focus:ring-rose-400 focus:outline-none placeholder:text-rose-400'
                        : 'border-[#D5C4B4] bg-white text-slate-900 focus:ring-2 focus:ring-[#8C6A47]/40 focus:outline-none'
                    }`}
                  />
                </div>
                <div className="flex items-center p-3 rounded-xl bg-white border border-[#D5C4B4]">
                  <div className="text-[11px] text-[#7A624E] leading-relaxed">
                    <strong className="text-[#8C6A47]">Info Fonnte DB Sync:</strong> Seluruh status WA tersimpan murni di tabel Supabase `peserta_santri`.
                  </div>
                </div>
              </div>
            </div>

            {/* Tabel Pengiriman & Filter Wali */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#D5C4B4] space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    PROGRES PENGIRIMAN ({gelombang === 1 ? 'UNDANGAN MASUK' : gelombang === 2 ? 'KUOTA TAMBAHAN' : 'PENGINGAT KONFIRMASI'}):
                  </div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    Terkirim {totalTerkirim} / {keluargaList.length}{' '}
                    <span className="text-sm font-semibold text-emerald-700">({pctTerkirim}%)</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={filterKonfirmasi}
                    onChange={(e) => setFilterKonfirmasi(e.target.value as any)}
                    className="px-3 py-2 rounded-xl border border-amber-300 text-xs focus:outline-none bg-amber-50 text-amber-950 font-bold"
                  >
                    <option value="SEMUA">Semua Status Konfirmasi</option>
                    <option value="BELUM">Belum Konfirmasi Kehadiran</option>
                    <option value="SUDAH">Sudah Konfirmasi Kehadiran</option>
                  </select>

                  <select
                    value={filterKategori}
                    onChange={(e) => {
                      setFilterKategori(e.target.value);
                      setFilterBagian('SEMUA');
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none bg-slate-50"
                  >
                    <option value="SEMUA">Semua Kategori ({keluargaList.length})</option>
                    <option value="BIL_GHOIB">Bil Ghoib ({countBilGhoib})</option>
                    <option value="BIN_NADZOR">Bin Nadzori ({countBinNadzor})</option>
                    <option value="TAMATAN">Tamatan ({countTamatan})</option>
                  </select>

                  <select
                    value={filterBagian}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFilterBagian(val);
                      if (val === 'BIL_GHOIB') setFilterKategori('BIL_GHOIB');
                      else if (val === 'BIN_NADZOR') setFilterKategori('BIN_NADZOR');
                      else if (val === 'TAMATAN_SEMUA' || val.startsWith('A.') || val.startsWith('B.')) setFilterKategori('TAMATAN');
                      else if (val === 'SEMUA') setFilterKategori('SEMUA');
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none bg-slate-50"
                  >
                    <option value="SEMUA">Semua Kategori &amp; Bagian ({keluargaList.length})</option>
                    <option value="BIL_GHOIB">Bil Ghoib ({countBilGhoib})</option>
                    <option value="BIN_NADZOR">Bin Nadzori ({countBinNadzor})</option>
                    <option value="TAMATAN_SEMUA">Semua Bagian Tamatan ({countTamatan})</option>
                    {BAGIAN_TAMATAN_LIST.map((bg) => (
                      <option key={bg} value={bg}>
                        Bagian {bg} ({countPerBagian[bg] || 0})
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none bg-slate-50"
                  >
                    <option value="SEMUA">Semua Pengiriman</option>
                    <option value="BELUM">Belum Terkirim</option>
                    <option value="TERKIRIM">Sudah Terkirim</option>
                    <option value="BERMASALAH">Nomor Bermasalah / Kosong / Tidak Terdaftar</option>
                  </select>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari wali / santri / HP..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#8C6A47] w-44"
                    />
                  </div>
                </div>
              </div>

              {/* Tabel Wali */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#EFE8E1] text-[#5C3E28] font-bold border-b border-[#D5C4B4] uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-3">Kode</th>
                      <th className="py-3 px-4">Nama Wali Santri &amp; HP</th>
                      <th className="py-3 px-4">Sohibul Hajat &amp; Kategori</th>
                      <th className="py-3 px-3 text-center">Hak Kuota</th>
                      <th className="py-3 px-3 text-center">Konfirmasi Hadir</th>
                      <th className="py-3 px-3 text-center">Status Kirim WA</th>
                      <th className="py-3 px-4 text-center">Aksi Kirim</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {loadingData ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Memuat data peserta dari database Supabase...
                        </td>
                      </tr>
                    ) : filteredList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Tidak ada data wali santri yang cocok di Supabase DB.
                        </td>
                      </tr>
                    ) : (
                      filteredList.map((kel) => {
                        const santri = kel.santri?.[0];
                        const isInvalidNum = !kel.noHp || kel.noHp.trim().length < 8;
                        const isNoWaNotRegistered = kel.statusWa === 'NOMOR_TIDAK_TERDAFTAR';
                        const isFailed = kel.statusWa === 'GAGAL';
                        const isTerkirim = kel.statusWa === 'TERKIRIM';
                        const isSendingThis = sendingKode === kel.kode;

                        const isBilGhoib = santri?.kategoriUtama === 'BIL_GHOIB';
                        const isBinNadzor = santri?.kategoriUtama === 'BIN_NADZOR';
                        const isTamatan = santri?.kategoriUtama === 'TAMATAN';
                        const bagian = isTamatan ? extractBagianTamatan(santri?.kelas || santri?.subKategori) : '';
                        const isConfirmed = kel.estimasi?.statusKonfirmasi === 'SUDAH';

                        return (
                          <tr key={kel.id || kel.kode} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-opera-900">
                              {kel.kode}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-800">{kel.namaWali}</div>
                              <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                                <span>{kel.noHp || <span className="text-rose-500 font-bold">Tidak ada nomor</span>}</span>
                                {(isNoWaNotRegistered || isInvalidNum) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingItem(kel);
                                      setNewHpInput(kel.noHp || '');
                                    }}
                                    className="p-0.5 rounded hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                                    title="Edit Nomor HP Langsung ke Supabase"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-800">{santri?.nama}</div>
                              <div className="text-[11px] flex items-center space-x-1.5 mt-0.5">
                                <span
                                  className={`font-semibold ${
                                    isBilGhoib
                                      ? 'text-emerald-700'
                                      : isBinNadzor
                                      ? 'text-blue-700'
                                      : 'text-amber-800'
                                  }`}
                                >
                                  {isBilGhoib ? 'Bil Ghoib' : isBinNadzor ? 'Bin Nadzori' : 'Tamatan'}
                                </span>
                                {isTamatan && bagian && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                                    Bagian {bagian}
                                  </span>
                                )}
                                <span className="text-slate-400">· Kamar: {santri?.kamar || '-'}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              <div className="font-bold text-slate-800">
                                {(kel.kuota?.kuotaDasar || 2) + (kel.kuota?.kuotaTambahan || 0)} Kursi
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5 space-y-0.5">
                                {isBilGhoib && (
                                  <>
                                    <span className="inline-block font-bold text-slate-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded text-[10px]">
                                      Hitam Gold
                                    </span>
                                    <span className="text-[9px] text-amber-800 font-bold block">
                                      Wali Maju Panggung
                                    </span>
                                  </>
                                )}
                                {isBinNadzor && (
                                  <span className="inline-block font-bold text-rose-900 bg-rose-100 border border-rose-300 px-1.5 py-0.5 rounded text-[10px]">
                                    Merah Gold
                                  </span>
                                )}
                                {isTamatan && (
                                  <span className="inline-block font-bold text-rose-900 bg-rose-100 border border-rose-300 px-1.5 py-0.5 rounded text-[10px]">
                                    Merah Gold
                                  </span>
                                )}
                                {(kel.kuota?.kuotaTambahan || 0) > 0 && (
                                  <span className="text-rose-600 block font-semibold">+ {kel.kuota.kuotaTambahan} Tambahan</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              {isConfirmed ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  ✓ Sudah Hadir
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  ⏳ Belum Konfirmasi
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              {isTerkirim ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                                  TERKIRIM
                                </span>
                              ) : isNoWaNotRegistered || isInvalidNum ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                                  <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" />
                                  NOMOR TIDAK TERDAFTAR
                                </span>
                              ) : isFailed ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <AlertTriangle className="w-3 h-3 mr-1 text-rose-500" />
                                  GAGAL
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                  <Clock className="w-3 h-3 mr-1 text-slate-400" />
                                  BELUM
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center space-x-1.5">
                                <button
                                  onClick={() => handleKirimFonnte(kel)}
                                  disabled={isInvalidNum || isSendingThis || isBlasting}
                                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 shadow-sm transition-all cursor-pointer ${
                                    isTerkirim
                                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                                      : 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs'
                                  } disabled:opacity-40 disabled:pointer-events-none`}
                                  title="Kirim otomatis lewat WhatsApp Fonnte"
                                >
                                  <Zap className="w-3 h-3 fill-current text-amber-300" />
                                  <span>{isSendingThis ? 'Mengirim...' : isTerkirim ? 'Kirim Ulang' : 'Kirim Fonnte'}</span>
                                </button>

                                <button
                                  onClick={() => handleKirimManualWA(kel)}
                                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-emerald-700 border border-slate-200 transition-colors cursor-pointer"
                                  title="Kirim Manual via WhatsApp Web / App"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>

                                {(isNoWaNotRegistered || isInvalidNum) && (
                                  <button
                                    onClick={() => {
                                      setEditingItem(kel);
                                      setNewHpInput(kel.noHp || '');
                                    }}
                                    className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-xs cursor-pointer flex items-center space-x-1"
                                    title="Edit Nomor HP Langsung ke Supabase"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                    <span>Edit HP</span>
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
          </div>
        )}

        {/* ===================================================================== */}
        {/* CONTENT TAB 2: WA TAMU UNDANGAN (FORMAT FIX & MANUAL JALUR INPUT)     */}
        {/* ===================================================================== */}
        {activeTab === 'TAMU_UNDANGAN' && (
          <div className="space-y-6">
            {/* Header Panel WhatsApp Tamu */}
            <div className="bg-[#FAF7F3] rounded-3xl p-6 shadow-sm border-2 border-[#D5C4B4]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#EFE8E1] text-[#8C6A47] flex items-center justify-center font-bold border border-[#D5C4B4] shadow-sm">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-xl font-serif font-black text-[#422F21]">
                      Panel WA Gateway — Tamu Undangan
                    </h1>
                    <p className="text-xs text-[#7A624E] font-normal">
                      Terhubung 100% langsung ke tabel Supabase `tamu_undangan` (<strong>{tamuList.length} Tamu Undangan Terdaftar</strong>).
                    </p>
                  </div>
                </div>

                <button
                  onClick={fetchTamuWaData}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF7F3] text-[#8C6A47] border border-[#D5C4B4] font-bold text-xs shadow-xs flex items-center space-x-1.5 self-start md:self-auto cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingTamuData ? 'animate-spin' : ''}`} />
                  <span>Refresh Data DB</span>
                </button>
              </div>

              {/* Fonnte Live Status Widget */}
              <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-[#FAF7F3] via-[#EFE8E1] to-[#FAF7F3] text-[#422F21] border-2 border-[#8C6A47]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shadow-sm">
                    <Wifi className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-serif font-black text-[#422F21]">
                        FONNTE GATEWAY TERHUBUNG
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-400">
                        ONLINE
                      </span>
                    </div>
                    <div className="text-xs text-[#7A624E] mt-0.5 font-medium">
                      Pengirim: <strong>{fonnteStatus.name}</strong> ({fonnteStatus.device}) · Sisa Kuota API: <strong>{fonnteStatus.quota} Pesan</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {!isTamuBlasting ? (
                    <button
                      onClick={handleStartBatchBlastTamu}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8C6A47] via-[#A47E57] to-[#8C6A47] hover:brightness-105 text-white font-serif font-black text-xs shadow-md flex items-center space-x-1.5 transition-all border border-[#FAF7F3] cursor-pointer"
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      <span>Kirim WA ke Semua Tamu (Fonnte)</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStopBatchBlastTamu}
                      className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg flex items-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <Pause className="w-4 h-4" />
                      <span>Hentikan Blasting ({tamuBlastProgress.current}/{tamuBlastProgress.total})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Box Preview Template Pesan Tamu Undangan (Format Resmi Persis) */}
              <div className="mt-4 p-4 rounded-2xl bg-white border border-[#D5C4B4] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-[#8C6A47]" />
                    <span className="font-bold text-xs text-[#422F21]">
                      Preview Format Pesan WA Resmi Tamu Undangan:
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EFE8E1] text-[#8C6A47] border border-[#D5C4B4]">
                    Format Resmi Haul 2027
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FAF7F3] border border-[#D5C4B4]/70 font-mono text-[11px] text-[#422F21] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {getTeksPesanTamu(
                    filteredTamuList[0] || tamuList[0] || {
                      kode: 'UND0107',
                      nama: 'KH. Abdullah Kafabihi Mahrus',
                      jalurMasuk: 'Gerbang Selatan (Bola Dunia)',
                    }
                  )}
                </div>
              </div>

              {/* Progress Bar Blasting Tamu jika aktif */}
              {isTamuBlasting && (
                <div className="mt-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 space-y-2 text-xs text-amber-950">
                  <div className="flex items-center justify-between font-bold">
                    <span>Sedang Mengirim WA Undangan ke Tamu...</span>
                    <span>
                      {tamuBlastProgress.current} dari {tamuBlastProgress.total} tamu ({tamuBlastProgress.success} berhasil, {tamuBlastProgress.failed} gagal)
                    </span>
                  </div>
                  <div className="w-full bg-amber-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-[#8C6A47] h-2.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.round((tamuBlastProgress.current / tamuBlastProgress.total) * 100) || 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* BAR ISI MASSAL JALUR MASUK UNTUK BARIS KOSONG */}
            <div className="bg-[#FAF7F3] rounded-3xl p-4 shadow-sm border-2 border-[#D5C4B4] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4.5 h-4.5 text-[#8C6A47]" />
                <div>
                  <span className="font-bold text-[#422F21]">Isi Jalur Masuk Massal untuk Baris Kosong:</span>
                  <span className="text-[11px] text-amber-800 font-medium block sm:inline sm:ml-2">
                    ({countJalurKosong} tamu belum memiliki jalur masuk)
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Contoh: Gerbang Selatan (Bola Dunia)"
                  value={massJalurInputText}
                  onChange={(e) => setMassJalurInputText(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-[#8C6A47]"
                />
                <button
                  type="button"
                  onClick={() => handleApplyMassJalurMasuk(massJalurInputText)}
                  className="px-4 py-2 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white font-bold text-xs shadow-sm cursor-pointer whitespace-nowrap"
                >
                  Terapkan ke Baris Kosong
                </button>
              </div>
            </div>

            {/* Tabel Pengiriman & Filter Tamu Undangan */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#D5C4B4] space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    PROGRES PENGIRIMAN TAMU UNDANGAN:
                  </div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    Terkirim {totalTamuTerkirim} / {tamuList.length}{' '}
                    <span className="text-sm font-semibold text-emerald-700">({pctTamuTerkirim}%)</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Filter Golongan Tamu */}
                  <select
                    value={tamuFilterGolongan}
                    onChange={(e) => setTamuFilterGolongan(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none bg-slate-50"
                  >
                    <option value="SEMUA">Semua Golongan ({tamuList.length})</option>
                    <option value="ISTIMEWA">Istimewa ({countTamuIstimewa})</option>
                    <option value="KEHORMATAN">Kehormatan ({countTamuKehormatan})</option>
                    <option value="UMUM">Umum ({countTamuUmum})</option>
                  </select>

                  {/* Filter Status WA */}
                  <select
                    value={tamuFilterStatus}
                    onChange={(e) => setTamuFilterStatus(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none bg-slate-50"
                  >
                    <option value="SEMUA">Semua Status WA</option>
                    <option value="BELUM">Belum Terkirim</option>
                    <option value="TERKIRIM">Sudah Terkirim</option>
                    <option value="BERMASALAH">Nomor Bermasalah / Kosong / Tidak Terdaftar</option>
                  </select>

                  {/* Filter Status Jalur Masuk */}
                  <select
                    value={tamuFilterJalurStatus}
                    onChange={(e) => setTamuFilterJalurStatus(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none bg-slate-50"
                  >
                    <option value="SEMUA">Semua Jalur Masuk</option>
                    <option value="TERISI">Jalur Masuk Terisi</option>
                    <option value="KOSONG">Jalur Masuk Kosong ({countJalurKosong})</option>
                  </select>

                  {/* Search Tamu */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari tamu / instansi / jalur / kode..."
                      value={tamuSearch}
                      onChange={(e) => setTamuSearch(e.target.value)}
                      className="pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#8C6A47] w-48"
                    />
                  </div>
                </div>
              </div>

              {/* Tabel Tamu Undangan */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#EFE8E1] text-[#5C3E28] font-bold border-b border-[#D5C4B4] uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-3">Kode</th>
                      <th className="py-3 px-4">Nama Penerima &amp; HP</th>
                      <th className="py-3 px-4">Kategori &amp; Instansi</th>
                      <th className="py-3 px-4 text-center">Masuk Melalui (Jalur Wajib Input)</th>
                      <th className="py-3 px-3 text-center">Warna Tiket</th>
                      <th className="py-3 px-3 text-center">Status WA</th>
                      <th className="py-3 px-4 text-center">Aksi Kirim</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {loadingTamuData ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Memuat data tamu undangan dari database Supabase...
                        </td>
                      </tr>
                    ) : filteredTamuList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Tidak ada data tamu undangan yang cocok di Supabase DB.
                        </td>
                      </tr>
                    ) : (
                      filteredTamuList.map((tamu) => {
                        const isJalurKosong = !tamu.jalurMasuk || !tamu.jalurMasuk.trim();
                        const isInvalidNum = !tamu.noHp || tamu.noHp.trim().length < 8;
                        const isNoWaNotRegistered = tamu.statusWa === 'NOMOR_TIDAK_TERDAFTAR';
                        const isFailed = tamu.statusWa === 'GAGAL';
                        const isTerkirim = tamu.statusWa === 'TERKIRIM';
                        const isSendingThis = tamuSendingKode === tamu.kode;
                        const isSendDisabled = isInvalidNum || isJalurKosong || isSendingThis || isTamuBlasting;

                        const isIstimewa = tamu.golongan === 'ISTIMEWA';
                        const isKehormatan = tamu.golongan === 'KEHORMATAN';

                        return (
                          <tr key={tamu.id || tamu.kode} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-amber-900">
                              {tamu.kode}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-800">{tamu.nama}</div>
                              <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                                <span>{tamu.noHp || <span className="text-rose-500 font-bold">Tidak ada nomor</span>}</span>
                                {(isNoWaNotRegistered || isInvalidNum) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingTamuItem(tamu);
                                      setNewHpInputTamu(tamu.noHp || '');
                                    }}
                                    className="p-0.5 rounded hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                                    title="Edit Nomor HP Langsung ke Supabase"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-800">{tamu.kategori}</div>
                              <div className="text-[11px] flex items-center space-x-1.5 mt-0.5">
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                    isIstimewa
                                      ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                      : isKehormatan
                                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                                  }`}
                                >
                                  {tamu.golongan}
                                </span>
                                <span className="text-slate-400">· {tamu.instansi}</span>
                              </div>
                            </td>

                            {/* Kolom MASUK MELALUI (TEXT INPUT MANUAL WAJIB) */}
                            <td className="py-3 px-4 text-center">
                              <div className="flex flex-col items-center justify-center gap-1">
                                <input
                                  type="text"
                                  value={tamu.jalurMasuk || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setTamuList((prev) =>
                                      prev.map((item) =>
                                        item.id === tamu.id ? { ...item, jalurMasuk: val } : item
                                      )
                                    );
                                  }}
                                  onBlur={(e) => {
                                    handleUpdateJalurMasuk(tamu.id, e.target.value.trim());
                                  }}
                                  placeholder="Contoh: Gerbang Selatan (Bola Dunia)"
                                  className={`w-56 px-3 py-1.5 rounded-xl border text-xs focus:outline-none transition-all ${
                                    isJalurKosong
                                      ? 'border-amber-400 bg-amber-50/80 text-amber-950 placeholder:text-amber-400 focus:ring-2 focus:ring-amber-500'
                                      : 'border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-[#8C6A47]'
                                  }`}
                                />
                                {isJalurKosong && (
                                  <span className="text-[10px] font-bold text-amber-700 flex items-center gap-0.5">
                                    <AlertTriangle className="w-3 h-3" />
                                    Jalur Wajib Diisi
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                                {tamu.warnaTiket || 'Merah Gold'}
                              </span>
                            </td>

                            {/* Status WA */}
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              {isTerkirim ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                                  TERKIRIM
                                </span>
                              ) : isNoWaNotRegistered || isInvalidNum ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                                  <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" />
                                  NOMOR TIDAK TERDAFTAR
                                </span>
                              ) : isFailed ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <AlertTriangle className="w-3 h-3 mr-1 text-rose-500" />
                                  GAGAL
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                  <Clock className="w-3 h-3 mr-1 text-slate-400" />
                                  BELUM
                                </span>
                              )}
                            </td>

                            {/* Aksi Kirim */}
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center space-x-1.5">
                                <button
                                  onClick={() => handleKirimFonnteTamu(tamu)}
                                  disabled={isSendDisabled}
                                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 shadow-sm transition-all cursor-pointer ${
                                    isTerkirim
                                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                                      : 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs'
                                  } disabled:opacity-40 disabled:pointer-events-none`}
                                  title={
                                    isJalurKosong
                                      ? 'Isi kolom "Masuk Melalui" terlebih dahulu'
                                      : 'Kirim otomatis lewat WhatsApp Fonnte'
                                  }
                                >
                                  <Zap className="w-3 h-3 fill-current text-amber-300" />
                                  <span>{isSendingThis ? 'Mengirim...' : isTerkirim ? 'Kirim Ulang' : 'Kirim Fonnte'}</span>
                                </button>

                                <button
                                  onClick={() => handleKirimManualWATamu(tamu)}
                                  disabled={isJalurKosong}
                                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-emerald-700 border border-slate-200 transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                                  title="Kirim Manual via WhatsApp Web / App"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>

                                {(isNoWaNotRegistered || isInvalidNum) && (
                                  <button
                                    onClick={() => {
                                      setEditingTamuItem(tamu);
                                      setNewHpInputTamu(tamu.noHp || '');
                                    }}
                                    className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-xs cursor-pointer flex items-center space-x-1"
                                    title="Edit Nomor HP Langsung ke Supabase"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                    <span>Edit HP</span>
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
          </div>
        )}

        {/* MODAL EDIT HP WALI */}
        {editingItem && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#D5C4B4]">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                    <Smartphone className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-black text-sm text-[#422F21]">
                      Edit Nomor WhatsApp Wali
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Update nomor HP langsung ke tabel Supabase `peserta_santri`
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingItem(null)}
                  className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 space-y-1">
                  <p className="font-bold text-amber-900">
                    {editingItem.namaWali} ({editingItem.kode})
                  </p>
                  <p className="text-[11px] text-amber-800">
                    Santri: {editingItem.santri?.[0]?.nama || '-'}
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-[#422F21] mb-1">
                    Nomor WhatsApp Baru:
                  </label>
                  <input
                    type="text"
                    value={newHpInput}
                    onChange={(e) => setNewHpInput(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D5C4B4] bg-[#FAF7F3] focus:bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Format: 08xx atau 628xx. Status WA akan otomatis diset kembali ke "BELUM".
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100">
                <button
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveEditNoHp}
                  className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-sm cursor-pointer flex items-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan ke Supabase</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL EDIT HP TAMU UNDANGAN */}
        {editingTamuItem && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#D5C4B4]">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <Smartphone className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-black text-sm text-[#422F21]">
                      Edit Nomor WhatsApp Tamu Undangan
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Update nomor HP langsung ke tabel Supabase `tamu_undangan`
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingTamuItem(null)}
                  className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 space-y-1">
                  <p className="font-bold text-amber-900">
                    {editingTamuItem.nama} ({editingTamuItem.kode})
                  </p>
                  <p className="text-[11px] text-amber-800">
                    Kategori: {editingTamuItem.kategori} · {editingTamuItem.instansi}
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-[#422F21] mb-1">
                    Nomor WhatsApp Baru:
                  </label>
                  <input
                    type="text"
                    value={newHpInputTamu}
                    onChange={(e) => setNewHpInputTamu(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D5C4B4] bg-[#FAF7F3] focus:bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Format: 08xx atau 628xx. Status WA akan otomatis diset kembali ke "BELUM".
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100">
                <button
                  onClick={() => setEditingTamuItem(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveEditNoHpTamu}
                  className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-sm cursor-pointer flex items-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan ke Supabase</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AuthGuard>
  );
}
