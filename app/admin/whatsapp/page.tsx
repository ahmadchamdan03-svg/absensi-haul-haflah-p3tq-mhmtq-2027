'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Users, UserCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/audit-log';
import { extractBagianTamatan, getGolonganUndangan, getDefaultJalurMasuk } from '@/lib/types';
import AuthGuard from '@/components/AuthGuard';
import WhatsAppStats from '@/components/admin/whatsapp/WhatsAppStats';
import WhatsAppTable from '@/components/admin/whatsapp/WhatsAppTable';
import WhatsAppSendModal, {
  updateTamuWaInSupabase,
  kirimFonnteWali,
  kirimManualWAWali,
  kirimFonnteTamu,
  kirimManualWATamu,
} from '@/components/admin/whatsapp/WhatsAppSendModal';

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
    device: '085181805377',
    quota: '1000',
    loading: false,
  });

  // =========================================================================
  // FETCH DATA SUPABASE
  // =========================================================================

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
              statusKonfirmasi: String(s.status_konfirmasi || '').toUpperCase() === 'SUDAH' ? 'SUDAH' : 'BELUM',
              perkiraanL: Number(s.perkiraan_l || 0),
              perkiraanP: Number(s.perkiraan_p || 0),
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
            kuotaDasar: (t.nama_putra && String(t.nama_putra).trim() ? 1 : 0) + (t.nama_putri && String(t.nama_putri).trim() ? 1 : 0),
            kuotaTambahan: 0,
            statusKonfirmasi: t.status_konfirmasi || null,
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

        await logAudit({
          panitia_id: 'ADMIN_SISTEM',
          panitia_role: 'ADMIN',
          aksi: 'TOGGLE_KUOTA_SWITCH',
          tabel: 'konfigurasi_sistem',
          kode: 'kuota_tambahan_status',
          nama: 'Pintu Pembelian Kuota Tambahan',
          field: 'aktif',
          nilai_lama: String(kuotaTambahanBuka),
          nilai_baru: String(targetVal),
          detail: { aktif: targetVal },
          catatan: `Toggle Pintu Beli Kuota Tambahan (${targetVal ? 'DIBUKA' : 'DITUTUP'})`,
        });
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'konfigurasi_sistem' }, () => fetchKuotaConfigStatus())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'peserta_santri' }, () => fetchSantriWaData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tamu_undangan' }, () => fetchTamuWaData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
            device: json.data.device || '085181805377',
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
  // HANDLERS WALI SANTRI
  // =========================================================================

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

  const handleKirimFonnte = (kel: any) =>
    kirimFonnteWali(kel, gelombang, linkGrupWa, setSendingKode, setKeluargaList);

  const handleKirimManualWA = (kel: any) =>
    kirimManualWAWali(kel, gelombang, linkGrupWa, setKeluargaList);

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
  // HANDLERS TAMU UNDANGAN
  // =========================================================================

  const handleUpdateJalurMasuk = async (tamuId: string | number, newJalur: string) => {
    const target = tamuList.find((t) => t.id === tamuId);
    const currentStatus = target?.statusWa || 'BELUM';
    await updateTamuWaInSupabase(tamuId, currentStatus, setTamuList, newJalur);
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
      await updateTamuWaInSupabase(t.id, t.statusWa, setTamuList, targetVal);
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

  const handleKirimFonnteTamu = (tamu: any) =>
    kirimFonnteTamu(tamu, setTamuSendingKode, setTamuList);

  const handleKirimManualWATamu = (tamu: any) =>
    kirimManualWATamu(tamu, setTamuList);

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

        {/* CONTENT TAB 1 / TAB 2 */}
        <div className={activeTab === 'WALI_SANTRI' ? 'space-y-4 sm:space-y-6' : 'space-y-6'}>
          <WhatsAppStats
            activeTab={activeTab}
            keluargaList={keluargaList}
            loadingData={loadingData}
            fetchSantriWaData={fetchSantriWaData}
            gelombang={gelombang}
            setGelombang={setGelombang}
            setFilterKonfirmasi={setFilterKonfirmasi}
            kuotaTambahanBuka={kuotaTambahanBuka}
            savingKuotaConfig={savingKuotaConfig}
            handleToggleKuotaSwitch={handleToggleKuotaSwitch}
            fonnteStatus={fonnteStatus}
            isBlasting={isBlasting}
            blastProgress={blastProgress}
            handleStartBatchBlast={handleStartBatchBlast}
            handleStopBatchBlast={handleStopBatchBlast}
            linkGrupWa={linkGrupWa}
            setLinkGrupWa={setLinkGrupWa}
            tamuList={tamuList}
            filteredTamuList={filteredTamuList}
            loadingTamuData={loadingTamuData}
            fetchTamuWaData={fetchTamuWaData}
            isTamuBlasting={isTamuBlasting}
            tamuBlastProgress={tamuBlastProgress}
            handleStartBatchBlastTamu={handleStartBatchBlastTamu}
            handleStopBatchBlastTamu={handleStopBatchBlastTamu}
            countJalurKosong={countJalurKosong}
            massJalurInputText={massJalurInputText}
            setMassJalurInputText={setMassJalurInputText}
            handleApplyMassJalurMasuk={handleApplyMassJalurMasuk}
          />

          <WhatsAppTable
            activeTab={activeTab}
            gelombang={gelombang}
            totalTerkirim={totalTerkirim}
            keluargaCount={keluargaList.length}
            pctTerkirim={pctTerkirim}
            filterKonfirmasi={filterKonfirmasi}
            setFilterKonfirmasi={setFilterKonfirmasi}
            filterKategori={filterKategori}
            setFilterKategori={setFilterKategori}
            filterBagian={filterBagian}
            setFilterBagian={setFilterBagian}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            search={search}
            setSearch={setSearch}
            countBilGhoib={countBilGhoib}
            countBinNadzor={countBinNadzor}
            countTamatan={countTamatan}
            countPerBagian={countPerBagian}
            totalTamuTerkirim={totalTamuTerkirim}
            tamuCount={tamuList.length}
            pctTamuTerkirim={pctTamuTerkirim}
            tamuFilterGolongan={tamuFilterGolongan}
            setTamuFilterGolongan={setTamuFilterGolongan}
            tamuFilterStatus={tamuFilterStatus}
            setTamuFilterStatus={setTamuFilterStatus}
            tamuFilterJalurStatus={tamuFilterJalurStatus}
            setTamuFilterJalurStatus={setTamuFilterJalurStatus}
            tamuSearch={tamuSearch}
            setTamuSearch={setTamuSearch}
            countTamuIstimewa={countTamuIstimewa}
            countTamuKehormatan={countTamuKehormatan}
            countTamuUmum={countTamuUmum}
            countJalurKosong={countJalurKosong}
            loadingData={loadingData}
            filteredList={filteredList}
            sendingKode={sendingKode}
            isBlasting={isBlasting}
            handleKirimFonnte={handleKirimFonnte}
            handleKirimManualWA={handleKirimManualWA}
            setEditingItem={setEditingItem}
            setNewHpInput={setNewHpInput}
            loadingTamuData={loadingTamuData}
            filteredTamuList={filteredTamuList}
            tamuSendingKode={tamuSendingKode}
            isTamuBlasting={isTamuBlasting}
            setTamuList={setTamuList}
            handleUpdateJalurMasuk={handleUpdateJalurMasuk}
            handleKirimFonnteTamu={handleKirimFonnteTamu}
            handleKirimManualWATamu={handleKirimManualWATamu}
            setEditingTamuItem={setEditingTamuItem}
            setNewHpInputTamu={setNewHpInputTamu}
          />
        </div>

        {/* MODAL EDIT HP WALI & TAMU */}
        <WhatsAppSendModal
          editingItem={editingItem}
          setEditingItem={setEditingItem}
          newHpInput={newHpInput}
          setNewHpInput={setNewHpInput}
          handleSaveEditNoHp={handleSaveEditNoHp}
          editingTamuItem={editingTamuItem}
          setEditingTamuItem={setEditingTamuItem}
          newHpInputTamu={newHpInputTamu}
          setNewHpInputTamu={setNewHpInputTamu}
          handleSaveEditNoHpTamu={handleSaveEditNoHpTamu}
        />
      </div>
    </AuthGuard>
  );
}
