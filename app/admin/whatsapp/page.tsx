'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Users, UserCheck, CheckCircle2, AlertTriangle, X, Loader2, Clock, Hourglass } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { logAudit } from '@/lib/audit-log';
import { extractBagianTamatan, getGolonganUndangan, getWaStatusColumnByGelombang } from '@/lib/types';
import { deduplicateMergedWaRecords } from '@/lib/wa-merge-priority';
import { useWaQueue } from '@/lib/use-wa-queue';
import { generateRandomWaUndanganMessage } from '@/lib/wa-message-templates';
import AuthGuard from '@/components/AuthGuard';
import WhatsAppStats, { getTeksPesan, getTeksPesanTamu } from '@/components/admin/whatsapp/WhatsAppStats';
import WhatsAppTable from '@/components/admin/whatsapp/WhatsAppTable';
import WhatsAppSendModal, {
  validateAndCleanPhoneNumber,
  kirimManualWAWali,
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
  const [savingLinkGrup, setSavingLinkGrup] = useState(false);
  const [linkGrupSavedNotice, setLinkGrupSavedNotice] = useState(false);
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
  const [isSavingHp, setIsSavingHp] = useState(false);
  const [hpValidationError, setHpValidationError] = useState('');

  // Centralized Multi-Browser WA Queue (Supabase + Realtime)
  const {
    sendingItem,
    pendingItems,
    activeQueueCount,
    systemState,
    isCooldown,
    cooldownFormatted,
    nextDelaySeconds,
    enqueueWaMessages,
    cancelPendingWaQueue,
  } = useWaQueue();

  // Batch Blasting tracking (Wali)
  const [blastTotalTarget, setBlastTotalTarget] = useState(0);
  const [blastStats, setBlastStats] = useState<{ success: number; failed: number }>({
    success: 0,
    failed: 0,
  });

  // =========================================================================
  // STATE TAMU UNDANGAN
  // =========================================================================
  const [tamuList, setTamuList] = useState<any[]>([]);
  const [loadingTamuData, setLoadingTamuData] = useState(true);
  const [tamuFilterGolongan, setTamuFilterGolongan] = useState<string>('SEMUA');
  const [tamuFilterStatus, setTamuFilterStatus] = useState<string>('SEMUA');
  const [tamuSearch, setTamuSearch] = useState('');

  // Edit Phone Modal State (Tamu)
  const [editingTamuItem, setEditingTamuItem] = useState<any | null>(null);
  const [newHpInputTamu, setNewHpInputTamu] = useState('');
  const [isSavingHpTamu, setIsSavingHpTamu] = useState(false);
  const [hpValidationErrorTamu, setHpValidationErrorTamu] = useState('');

  // Toast Notification State
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMsg({ type, message });
    toastTimeoutRef.current = setTimeout(() => {
      setToastMsg(null);
    }, 4500);
  };

  // Batch Blasting tracking (Tamu)
  const [tamuBlastTotalTarget, setTamuBlastTotalTarget] = useState(0);
  const [tamuBlastStats, setTamuBlastStats] = useState<{ success: number; failed: number }>({
    success: 0,
    failed: 0,
  });

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

  const resolveSantriBagian = (santri?: { bagianTamatan?: string; subKategori?: string; kelas?: string }) => {
    if (!santri) return '';
    return santri.bagianTamatan || extractBagianTamatan(santri.subKategori) || extractBagianTamatan(santri.kelas) || '';
  };

  const getStatusWaByGelombang = (kel: any, gel: 1 | 2 | 3 = gelombang): string => {
    if (!kel) return 'BELUM';
    if (gel === 2) return kel.status_wa_kuota || 'BELUM';
    if (gel === 3) return kel.status_wa_penginapan || 'BELUM';
    return kel.status_wa_undangan || kel.statusWa || 'BELUM';
  };

  // Paginated fetch keeps WA dropdown counts complete even past PostgREST's 1000-row cap.
  const fetchAllTableRows = async (table: 'peserta_santri' | 'tamu_undangan') => {
    const pageSize = 1000;
    const allRows: any[] = [];
    let from = 0;

    while (true) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('kode', { ascending: true })
        .order('id', { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) {
        return { data: null, error };
      }
      if (!data || data.length === 0) break;

      allRows.push(...data);
      if (data.length < pageSize) break;
      from += pageSize;
    }

    return { data: allRows, error: null };
  };

  const fetchSantriWaData = async (silent: boolean = false) => {
    try {
      if (!silent && keluargaList.length === 0) {
        setLoadingData(true);
      }
      const { data, error } = await fetchAllTableRows('peserta_santri');

      if (error) {
        console.error('Error fetching peserta_santri for WA:', error);
        if (!silent && keluargaList.length === 0) setKeluargaList([]);
      } else if (data) {
        const mappedSantri = data.map((s: any) => {
          const katUtama = s.kategori_utama || 'BIL_GHOIB';
          const subKat =
            s.sub_kategori ||
            (katUtama === 'TAMATAN' ? '' : katUtama === 'BIN_NADZOR' ? 'Bin Nadzori' : 'Bil Ghoib');
          const bagianTamatan =
            extractBagianTamatan(s.sub_kategori) || extractBagianTamatan(s.kelas) || '';

          return {
            id: s.id,
            kode: s.kode,
            merged_group_id: s.merged_group_id || null,
            namaWali: s.nama_wali || '-',
            noHp: s.no_hp || '',
            alamat: s.alamat || 'Kediri',
            statusWa: s.status_wa_undangan || s.status_wa || 'BELUM',
            status_wa_undangan: s.status_wa_undangan || s.status_wa || 'BELUM',
            status_wa_kuota: s.status_wa_kuota || 'BELUM',
            status_wa_penginapan: s.status_wa_penginapan || 'BELUM',
            santri: [
              {
                id: s.id,
                nama: s.nama,
                kategoriUtama: katUtama,
                subKategori: subKat,
                bagianTamatan,
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
          };
        });

        setKeluargaList(deduplicateMergedWaRecords(mappedSantri, 'SANTRI'));
      }
    } catch (e) {
      console.warn('Error in fetchSantriWaData:', e);
      if (!silent && keluargaList.length === 0) setKeluargaList([]);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchTamuWaData = async (silent: boolean = false) => {
    try {
      if (!silent && tamuList.length === 0) {
        setLoadingTamuData(true);
      }
      const { data, error } = await fetchAllTableRows('tamu_undangan');

      if (error) {
        console.error('Error fetching tamu_undangan for WA:', error);
        if (!silent && tamuList.length === 0) setTamuList([]);
      } else if (data) {
        const mappedTamu = data.map((t: any) => {
          const subKatUpper = String(t.sub_kategori || '').trim().toUpperCase();
          const golongan = ['ISTIMEWA', 'KEHORMATAN', 'UMUM'].includes(subKatUpper)
            ? subKatUpper
            : getGolonganUndangan(t);

          return {
            id: t.id,
            kode: t.kode,
            merged_group_id: t.merged_group_id || null,
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
            warnaTiket: t.warna_tiket || 'Biru',
            statusWa: t.status_wa || 'BELUM',
            status_wa: t.status_wa || 'BELUM',
            golongan,
          };
        });

        setTamuList(deduplicateMergedWaRecords(mappedTamu, 'TAMU'));
      }
    } catch (e) {
      console.warn('Error in fetchTamuWaData:', e);
      if (!silent && tamuList.length === 0) setTamuList([]);
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

  const fetchLinkGrupWaConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('konfigurasi_sistem')
        .select('value')
        .eq('key', 'link_grup_wa')
        .maybeSingle();

      if (error) {
        console.error('Error reading link_grup_wa from Supabase:', error);
        return;
      }

      if (data && data.value) {
        let savedUrl = '';
        if (typeof data.value === 'object' && data.value !== null) {
          savedUrl = String(data.value.url || data.value.link || '').trim();
        } else if (typeof data.value === 'string') {
          savedUrl = data.value.trim();
        }
        setLinkGrupWa(savedUrl);
      }
    } catch (err) {
      console.warn('Error fetching link_grup_wa from Supabase:', err);
    }
  };

  const handleSaveLinkGrupWa = async (newVal: string) => {
    if (savingLinkGrup) return;
    setSavingLinkGrup(true);
    try {
      const trimmed = newVal.trim();
      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from('konfigurasi_sistem')
        .upsert(
          {
            key: 'link_grup_wa',
            value: { url: trimmed, link: trimmed },
            updated_at: nowIso,
          },
          { onConflict: 'key' }
        );

      if (error) {
        console.error('Error saving link_grup_wa to konfigurasi_sistem:', error);
        showToast('error', `Gagal menyimpan Link Grup WA: ${error.message || 'Database error'}`);
        return;
      }

      setLinkGrupWa(trimmed);
      setLinkGrupSavedNotice(true);
      showToast('success', 'Link Grup WA berhasil disimpan ke database.');
      setTimeout(() => setLinkGrupSavedNotice(false), 2500);

      logAudit({
        panitia_id: 'ADMIN_SISTEM',
        panitia_role: 'ADMIN',
        aksi: 'UPDATE_LINK_GRUP_WA',
        tabel: 'konfigurasi_sistem',
        kode: 'link_grup_wa',
        nama: 'Link Grup WhatsApp Resmi Wali Santri',
        field: 'url',
        nilai_lama: linkGrupWa || '-',
        nilai_baru: trimmed || '-',
        detail: { url: trimmed, link: trimmed },
        catatan: 'Pembaruan Link Grup WhatsApp Wali Santri untuk balasan otomatis webhook',
      }).catch(() => {});
    } catch (err: any) {
      showToast('error', err?.message || 'Gagal menyimpan Link Grup WA.');
    } finally {
      setSavingLinkGrup(false);
    }
  };

  useEffect(() => {
    fetchSantriWaData();
    fetchTamuWaData();
    fetchKuotaConfigStatus();
    fetchLinkGrupWaConfig();

    const channel = supabase
      .channel('konfigurasi_sistem_wa_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'konfigurasi_sistem' }, () => {
        fetchKuotaConfigStatus();
        fetchLinkGrupWaConfig();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'peserta_santri' }, () => fetchSantriWaData(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tamu_undangan' }, () => fetchTamuWaData(true))
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
      if (g === '2') {
        setGelombang(2);
      } else if (g === '3') {
        setGelombang(3);
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
    if (!editingItem) return;

    const validation = validateAndCleanPhoneNumber(newHpInput);
    if (!validation.isValid) {
      setHpValidationError(validation.error || 'Format nomor HP tidak valid.');
      return;
    }

    setHpValidationError('');
    setIsSavingHp(true);

    try {
      const cleanNo = validation.cleanNumber;
      const targetColumn = getWaStatusColumnByGelombang(gelombang);
      let success = false;
      let errorMsg = '';

      // 1. Coba update via API route server role (bypass RLS)
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const res = await fetch('/api/santri', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingItem.id,
            kode: editingItem.kode,
            no_hp: cleanNo,
            status_wa: 'BELUM',
            [targetColumn]: 'BELUM',
            target_column: targetColumn,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const json = await res.json();
          if (json.ok) {
            success = true;
          } else {
            errorMsg = json.error || 'Gagal update data via API';
          }
        }
      } catch (apiErr: any) {
        console.warn('API PATCH /api/santri warning, fallback direct Supabase client:', apiErr);
      }

      // 2. Fallback direct Supabase client jika API belum berhasil
      if (!success) {
        const { error } = await supabase
          .from('peserta_santri')
          .update({
            no_hp: cleanNo,
            [targetColumn]: 'BELUM',
            ...(targetColumn === 'status_wa_undangan' ? { status_wa: 'BELUM' } : {}),
          })
          .eq('id', editingItem.id);

        if (error) {
          throw new Error(errorMsg || error.message);
        } else {
          success = true;
        }
      }

      // 3. Optimistic update di state tabel
      setKeluargaList((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                noHp: cleanNo,
                [targetColumn]: 'BELUM',
                ...(targetColumn === 'status_wa_undangan' ? { statusWa: 'BELUM' } : {}),
              }
            : item
        )
      );

      // Audit log
      logAudit({
        panitia_id: 'ADMIN_SISTEM',
        panitia_role: 'ADMIN',
        aksi: 'UPDATE_NO_HP_WALI',
        tabel: 'peserta_santri',
        kode: editingItem.kode,
        nama: editingItem.namaWali,
        field: 'no_hp',
        nilai_lama: editingItem.noHp || '-',
        nilai_baru: cleanNo,
        catatan: `Update nomor HP wali santri via WA Gateway`,
      }).catch(() => {});

      // Tutup modal dan reset form
      setEditingItem(null);
      setNewHpInput('');
      setHpValidationError('');

      // Notifikasi sukses
      showToast('success', `✓ Nomor WhatsApp ${editingItem.namaWali} (${cleanNo}) berhasil disimpan!`);

      // Re-fetch sinkronisasi DB secara silent agar tabel & posisi scroll tidak ter-reset
      fetchSantriWaData(true);
    } catch (err: any) {
      console.error('Error saving no HP wali:', err);
      const errMsg = err.message || 'Terjadi kesalahan sistem saat menyimpan nomor HP.';
      setHpValidationError(errMsg);
      showToast('error', `Gagal menyimpan nomor HP: ${errMsg}`);
    } finally {
      setIsSavingHp(false);
    }
  };

  const activeWaliTargetColumn = getWaStatusColumnByGelombang(gelombang);

  // Sinkronkan jumlah progres batch saat antrean terpusat berjalan lintas browser
  const waliQueueItems = useMemo(() => {
    const all = sendingItem ? [sendingItem, ...pendingItems] : [...pendingItems];
    return all.filter((q) => q.target_table !== 'tamu_undangan');
  }, [sendingItem, pendingItems]);

  const tamuQueueItems = useMemo(() => {
    const all = sendingItem ? [sendingItem, ...pendingItems] : [...pendingItems];
    return all.filter((q) => q.target_table === 'tamu_undangan');
  }, [sendingItem, pendingItems]);

  useEffect(() => {
    if (waliQueueItems.length === 0) {
      setBlastTotalTarget(0);
      setBlastStats({ success: 0, failed: 0 });
    } else if (waliQueueItems.length > blastTotalTarget) {
      setBlastTotalTarget(waliQueueItems.length);
    }
  }, [waliQueueItems.length, blastTotalTarget]);

  useEffect(() => {
    if (tamuQueueItems.length === 0) {
      setTamuBlastTotalTarget(0);
      setTamuBlastStats({ success: 0, failed: 0 });
    } else if (tamuQueueItems.length > tamuBlastTotalTarget) {
      setTamuBlastTotalTarget(tamuQueueItems.length);
    }
  }, [tamuQueueItems.length, tamuBlastTotalTarget]);

  // Refresh senyap saat GlobalWAWorker menyelesaikan 1 pesan agar posisi scroll tidak reset
  useEffect(() => {
    const handleWorkerProcessed = (evt: Event) => {
      const detail = (evt as CustomEvent).detail;
      if (!detail || detail.status !== 'PROCESSED') return;

      const isOk = Boolean(detail.sentOk);
      if (String(detail.targetKode || '').startsWith('UND')) {
        setTamuBlastStats((prev) => ({
          success: prev.success + (isOk ? 1 : 0),
          failed: prev.failed + (isOk ? 0 : 1),
        }));
        fetchTamuWaData(true);
      } else {
        setBlastStats((prev) => ({
          success: prev.success + (isOk ? 1 : 0),
          failed: prev.failed + (isOk ? 0 : 1),
        }));
        fetchSantriWaData(true);
      }
    };

    window.addEventListener('wa-queue-processed', handleWorkerProcessed);
    return () => {
      window.removeEventListener('wa-queue-processed', handleWorkerProcessed);
    };
  }, []);

  const isBlasting = waliQueueItems.length > 0;
  const blastProgress = {
    current: Math.max(0, blastTotalTarget - waliQueueItems.length),
    total: blastTotalTarget || waliQueueItems.length,
    success: blastStats.success,
    failed: blastStats.failed,
  };

  const isTamuBlasting = tamuQueueItems.length > 0;
  const tamuBlastProgress = {
    current: Math.max(0, tamuBlastTotalTarget - tamuQueueItems.length),
    total: tamuBlastTotalTarget || tamuQueueItems.length,
    success: tamuBlastStats.success,
    failed: tamuBlastStats.failed,
  };

  const sendingKode =
    sendingItem &&
    sendingItem.target_table !== 'tamu_undangan' &&
    (!sendingItem.target_column || sendingItem.target_column === activeWaliTargetColumn)
      ? sendingItem.target_kode || null
      : null;

  const tamuSendingKode =
    sendingItem && sendingItem.target_table === 'tamu_undangan'
      ? sendingItem.target_kode || null
      : null;

  const queuedKodes = useMemo(() => {
    if (activeTab === 'TAMU_UNDANGAN') {
      return pendingItems
        .filter((q) => q.target_table === 'tamu_undangan')
        .map((q) => q.target_kode)
        .filter(Boolean) as string[];
    }
    return pendingItems
      .filter(
        (q) =>
          q.target_table !== 'tamu_undangan' &&
          (!q.target_column || q.target_column === activeWaliTargetColumn)
      )
      .map((q) => q.target_kode)
      .filter(Boolean) as string[];
  }, [activeTab, pendingItems, activeWaliTargetColumn]);

  const handleKirimFonnte = async (kel: any) => {
    const rawHp = (kel.noHp || '').trim();
    if (!rawHp || rawHp.length < 8) {
      showToast('error', `Nomor HP untuk ${kel.namaWali} tidak valid.`);
      return false;
    }

    const namaPeserta = kel.namaWali || kel.santri?.[0]?.nama || kel.kode;
    const namaSantri = kel.santri?.[0]?.nama || namaPeserta || '-';
    const activeLink = gelombang === 1 ? linkGrupWa.trim() : '';
    const messageText =
      gelombang === 1
        ? generateRandomWaUndanganMessage({
            nama_wali: namaPeserta,
            nama_santri: namaSantri,
            kode_undangan: kel.kode,
            link_grup_wa: activeLink,
          })
        : getTeksPesan(kel, gelombang, activeLink);
    const tipePesan =
      gelombang === 3 ? 'PENGINAPAN' : gelombang === 2 ? 'KUOTA_TAMBAHAN' : 'UNDANGAN';

    try {
      await enqueueWaMessages([
        {
          target_hp: rawHp,
          message: messageText,
          nama_target: namaPeserta,
          target_table: 'peserta_santri',
          target_id: kel.id,
          target_kode: kel.kode,
          target_column: getWaStatusColumnByGelombang(gelombang),
          tipe_pesan: tipePesan,
          scheduled_at: new Date().toISOString(),
        },
      ]);
      showToast('success', 'Pesan masuk antrean. Akan dikirim otomatis.');
      return true;
    } catch (err: any) {
      showToast('error', err.message || 'Gagal memasukkan pesan ke antrean.');
      return false;
    }
  };

  const handleKirimManualWA = async (kel: any) => {
    return kirimManualWAWali(kel, gelombang, gelombang === 1 ? linkGrupWa : '', setKeluargaList);
  };

  const filteredList = useMemo(() => {
    return keluargaList.filter((kel) => {
      const currentStatusWa = getStatusWaByGelombang(kel, gelombang);
      const isSent = currentStatusWa === 'TERKIRIM';
      const isProblem =
        currentStatusWa === 'NOMOR_TIDAK_TERDAFTAR' ||
        currentStatusWa === 'GAGAL' ||
        !kel.noHp ||
        kel.noHp.trim().length < 8;
      const santri = kel.santri?.[0];
      const kat = santri?.kategoriUtama || 'BIN_NADZOR';
      const bagian = kat === 'TAMATAN' ? resolveSantriBagian(santri) : '';

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
          (kel.namaWali || '').toLowerCase().includes(q) ||
          (santri?.nama || '').toLowerCase().includes(q) ||
          (kel.kode || '').toLowerCase().includes(q) ||
          (kel.alamat || '').toLowerCase().includes(q) ||
          (kel.noHp || '').includes(q) ||
          bagian.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [keluargaList, gelombang, filterStatus, filterKonfirmasi, filterKategori, filterBagian, search]);

  const runBatchBlastForTab = async (targetGelombang: 1 | 2 | 3) => {
    const statusColumn = getWaStatusColumnByGelombang(targetGelombang);
    const activeLink = targetGelombang === 1 ? linkGrupWa.trim() : '';
    const tipePesan =
      targetGelombang === 3 ? 'PENGINAPAN' : targetGelombang === 2 ? 'KUOTA_TAMBAHAN' : 'UNDANGAN';

    const unsentList = filteredList
      .filter((k) => {
        const currentTabStatus =
          targetGelombang === 2
            ? k.status_wa_kuota || 'BELUM'
            : targetGelombang === 3
            ? k.status_wa_penginapan || 'BELUM'
            : k.status_wa_undangan || k.statusWa || 'BELUM';
        return currentTabStatus !== 'TERKIRIM' && Boolean(k.noHp && k.noHp.trim().length >= 8);
      })
      .map((kel) => {
        const namaWali = kel.namaWali || kel.santri?.[0]?.nama || kel.kode;
        const namaSantri = kel.santri?.[0]?.nama || namaWali || '-';
        const generatedMsg =
          targetGelombang === 1
            ? generateRandomWaUndanganMessage({
                nama_wali: namaWali,
                nama_santri: namaSantri,
                kode_undangan: kel.kode,
                link_grup_wa: activeLink,
              })
            : getTeksPesan(kel, targetGelombang, activeLink);

        return {
          target_hp: kel.noHp.trim(),
          message: generatedMsg,
          nama_target: namaWali,
          target_table: 'peserta_santri' as const,
          target_id: kel.id,
          target_kode: kel.kode,
          target_column: statusColumn,
          tipe_pesan: tipePesan,
          scheduled_at: new Date().toISOString(),
        };
      });

    if (unsentList.length === 0) {
      alert('Semua nomor pada filter dan tab saat ini sudah terkirim!');
      return;
    }

    const judulPesan =
      targetGelombang === 1
        ? 'Undangan Resmi & QR'
        : targetGelombang === 2
        ? 'Penawaran Kuota Tambahan'
        : 'Informasi Penginapan';

    if (
      !window.confirm(
        `Masukkan ${unsentList.length} pesan [${judulPesan}] ke Antrean Terpusat Fonnte?\nSistem menggunakan jeda acak 10-60 detik antar pesan & cooldown otomatis setiap 30 pesan.`
      )
    ) {
      return;
    }

    try {
      setBlastStats({ success: 0, failed: 0 });
      const res = await enqueueWaMessages(unsentList);
      const inserted = res.insertedCount ?? unsentList.length;
      setBlastTotalTarget((prev) => prev + inserted);
      showToast('success', `${inserted} pesan masuk antrean. Akan dikirim otomatis.`);
    } catch (err: any) {
      showToast('error', err.message || 'Gagal memasukkan batch pesan ke antrean.');
    }
  };

  const handleStartBatchBlastUndangan = () => runBatchBlastForTab(1);
  const handleStartBatchBlastKuota = () => runBatchBlastForTab(2);
  const handleStartBatchBlastPenginapan = () => runBatchBlastForTab(3);

  const handleStartBatchBlast = () => {
    if (gelombang === 2) return handleStartBatchBlastKuota();
    if (gelombang === 3) return handleStartBatchBlastPenginapan();
    return handleStartBatchBlastUndangan();
  };

  const handleStopBatchBlast = async () => {
    try {
      await cancelPendingWaQueue();
      setBlastTotalTarget(0);
      showToast('success', 'Sisa antrean pengiriman massal berhasil dihentikan.');
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menghentikan antrean.');
    }
  };

  // Nominator (X) & Denominator (Y) responsif terhadap tab aktif (gelombang 1/2/3) dan filter aktif (filteredList)
  const totalTerkirim = useMemo(() => {
    return filteredList.filter((item) => {
      if (gelombang === 2) return item.status_wa_kuota === 'TERKIRIM';
      if (gelombang === 3) return item.status_wa_penginapan === 'TERKIRIM';
      return (item.status_wa_undangan || item.statusWa) === 'TERKIRIM';
    }).length;
  }, [filteredList, gelombang]);

  const pctTerkirim =
    filteredList.length > 0 ? Math.min(100, Math.round((totalTerkirim / filteredList.length) * 100)) : 0;

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
        const bg = resolveSantriBagian(santri);
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

  const handleSaveEditNoHpTamu = async () => {
    if (!editingTamuItem) return;

    const validation = validateAndCleanPhoneNumber(newHpInputTamu);
    if (!validation.isValid) {
      setHpValidationErrorTamu(validation.error || 'Format nomor HP tidak valid.');
      return;
    }

    setHpValidationErrorTamu('');
    setIsSavingHpTamu(true);

    try {
      const cleanNo = validation.cleanNumber;
      let success = false;
      let errorMsg = '';

      // 1. Coba update via API route server role (bypass RLS)
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const res = await fetch('/api/tamu', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingTamuItem.id,
            kode: editingTamuItem.kode,
            no_hp: cleanNo,
            status_wa: 'BELUM',
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const json = await res.json();
          if (json.ok) {
            success = true;
          } else {
            errorMsg = json.error || 'Gagal update data via API';
          }
        }
      } catch (apiErr: any) {
        console.warn('API PATCH /api/tamu warning, fallback direct Supabase client:', apiErr);
      }

      // 2. Fallback direct Supabase client jika API belum berhasil
      if (!success) {
        const { error } = await supabase
          .from('tamu_undangan')
          .update({
            no_hp: cleanNo,
            status_wa: 'BELUM',
          })
          .eq('id', editingTamuItem.id);

        if (error) {
          throw new Error(errorMsg || error.message);
        } else {
          success = true;
        }
      }

      // 3. Optimistic update di state tabel
      setTamuList((prev) =>
        prev.map((item) =>
          item.id === editingTamuItem.id
            ? { ...item, noHp: cleanNo, statusWa: 'BELUM' }
            : item
        )
      );

      // Audit log
      logAudit({
        panitia_id: 'ADMIN_SISTEM',
        panitia_role: 'ADMIN',
        aksi: 'UPDATE_NO_HP_TAMU',
        tabel: 'tamu_undangan',
        kode: editingTamuItem.kode,
        nama: editingTamuItem.nama,
        field: 'no_hp',
        nilai_lama: editingTamuItem.noHp || '-',
        nilai_baru: cleanNo,
        catatan: `Update nomor HP tamu undangan via WA Gateway`,
      }).catch(() => {});

      // Tutup modal dan reset form
      setEditingTamuItem(null);
      setNewHpInputTamu('');
      setHpValidationErrorTamu('');

      // Notifikasi sukses
      showToast('success', `✓ Nomor WhatsApp ${editingTamuItem.nama} (${cleanNo}) berhasil disimpan!`);

      // Re-fetch sinkronisasi DB secara silent agar tabel & posisi scroll tidak ter-reset
      fetchTamuWaData(true);
    } catch (err: any) {
      console.error('Error saving no HP tamu:', err);
      const errMsg = err.message || 'Terjadi kesalahan sistem saat menyimpan nomor HP.';
      setHpValidationErrorTamu(errMsg);
      showToast('error', `Gagal menyimpan nomor HP: ${errMsg}`);
    } finally {
      setIsSavingHpTamu(false);
    }
  };

  const handleKirimFonnteTamu = async (tamu: any) => {
    const rawHp = (tamu.noHp || '').trim();
    if (!rawHp || rawHp.length < 8) {
      showToast('error', `Nomor HP untuk ${tamu.nama} tidak valid.`);
      return false;
    }

    const namaPeserta = tamu.nama || tamu.kode || 'Tamu Undangan';
    const messageText = getTeksPesanTamu(tamu);

    try {
      await enqueueWaMessages([
        {
          target_hp: rawHp,
          message: messageText,
          nama_target: namaPeserta,
          target_table: 'tamu_undangan',
          target_id: tamu.id,
          target_kode: tamu.kode,
          target_column: 'status_wa',
          tipe_pesan: 'UNDANGAN_TAMU',
          scheduled_at: new Date().toISOString(),
        },
      ]);
      showToast('success', 'Pesan masuk antrean. Akan dikirim otomatis.');
      return true;
    } catch (err: any) {
      showToast('error', err.message || 'Gagal memasukkan pesan tamu ke antrean.');
      return false;
    }
  };

  const handleKirimManualWATamu = (tamu: any) =>
    kirimManualWATamu(tamu, setTamuList);

  const filteredTamuList = useMemo(() => {
    return tamuList.filter((tamu) => {
      const isSent = tamu.statusWa === 'TERKIRIM';
      const isProblem = tamu.statusWa === 'NOMOR_TIDAK_TERDAFTAR' || tamu.statusWa === 'GAGAL' || !tamu.noHp || tamu.noHp.trim().length < 8;

      if (tamuFilterStatus === 'BELUM' && isSent) return false;
      if (tamuFilterStatus === 'TERKIRIM' && !isSent) return false;
      if (tamuFilterStatus === 'BERMASALAH' && !isProblem) return false;

      if (tamuFilterGolongan !== 'SEMUA' && tamu.golongan !== tamuFilterGolongan) return false;

      if (tamuSearch.trim()) {
        const q = tamuSearch.toLowerCase();
        return (
          tamu.nama.toLowerCase().includes(q) ||
          (tamu.instansi && tamu.instansi.toLowerCase().includes(q)) ||
          tamu.kode.toLowerCase().includes(q) ||
          (tamu.alamat && tamu.alamat.toLowerCase().includes(q)) ||
          tamu.noHp.includes(q) ||
          tamu.kategori.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tamuList, tamuFilterStatus, tamuFilterGolongan, tamuSearch]);

  const handleStartBatchBlastTamu = async () => {
    const validList: any[] = [];
    for (const tamu of filteredTamuList) {
      if ((tamu.status_wa || tamu.statusWa) === 'TERKIRIM') continue;
      if (!tamu.noHp || tamu.noHp.trim().length < 8) continue;
      validList.push({
        target_hp: tamu.noHp.trim(),
        message: getTeksPesanTamu(tamu),
        nama_target: tamu.nama || tamu.kode || 'Tamu Undangan',
        target_table: 'tamu_undangan' as const,
        target_id: tamu.id,
        target_kode: tamu.kode,
        target_column: 'status_wa',
        tipe_pesan: 'UNDANGAN_TAMU',
        scheduled_at: new Date().toISOString(),
      });
    }

    if (validList.length === 0) {
      alert('Semua nomor tamu undangan pada filter saat ini sudah terkirim!');
      return;
    }

    const promptMsg = `Masukkan ${validList.length} pesan WA undangan tamu ke Antrean Terpusat Fonnte?\nSistem menggunakan jeda acak 10-60 detik antar pesan & cooldown otomatis setiap 30 pesan.`;

    if (!window.confirm(promptMsg)) {
      return;
    }

    try {
      setTamuBlastStats({ success: 0, failed: 0 });
      const res = await enqueueWaMessages(validList);
      const inserted = res.insertedCount ?? validList.length;
      setTamuBlastTotalTarget((prev) => prev + inserted);
      showToast('success', `${inserted} pesan masuk antrean. Akan dikirim otomatis.`);
    } catch (err: any) {
      showToast('error', err.message || 'Gagal memasukkan batch pesan tamu ke antrean.');
    }
  };

  const handleStopBatchBlastTamu = async () => {
    try {
      await cancelPendingWaQueue();
      setTamuBlastTotalTarget(0);
      showToast('success', 'Sisa antrean pengiriman massal tamu berhasil dihentikan.');
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menghentikan antrean tamu.');
    }
  };

  const totalTamuTerkirim = useMemo(
    () => filteredTamuList.filter((t) => (t.status_wa || t.statusWa) === 'TERKIRIM').length,
    [filteredTamuList]
  );
  const pctTamuTerkirim =
    filteredTamuList.length > 0
      ? Math.min(100, Math.round((totalTamuTerkirim / filteredTamuList.length) * 100))
      : 0;

  const countTamuIstimewa = tamuList.filter((t) => t.golongan === 'ISTIMEWA').length;
  const countTamuKehormatan = tamuList.filter((t) => t.golongan === 'KEHORMATAN').length;
  const countTamuUmum = tamuList.filter((t) => t.golongan === 'UMUM').length;

  return (
    <AuthGuard allowedRoles={['ADMIN', 'PENERIMA_TAMU', 'PIMPINAN']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* TAB SWITCHER UTAMA */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/50 pb-3 gap-3">
          <div className="grid grid-cols-2 md:flex items-center gap-2 md:gap-3 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('WALI_SANTRI')}
              className={`px-3 sm:px-5 py-2.5 rounded-2xl font-serif font-black text-xs sm:text-sm transition-all flex items-center justify-center space-x-1.5 sm:space-x-2 cursor-pointer text-center ${
                activeTab === 'WALI_SANTRI'
                  ? 'bg-[#1D4ED8]/90 backdrop-blur-sm text-white shadow-md border border-[#1E40AF]'
                  : 'bg-white/40 hover:bg-white/70 backdrop-blur-sm text-[#0F2C59] border border-white/60 shadow-xs'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span className="truncate">1. WALI SANTRI ({keluargaList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('TAMU_UNDANGAN')}
              className={`px-3 sm:px-5 py-2.5 rounded-2xl font-serif font-black text-xs sm:text-sm transition-all flex items-center justify-center space-x-1.5 sm:space-x-2 cursor-pointer text-center ${
                activeTab === 'TAMU_UNDANGAN'
                  ? 'bg-[#1D4ED8]/90 backdrop-blur-sm text-white shadow-md border border-[#1E40AF]'
                  : 'bg-white/40 hover:bg-white/70 backdrop-blur-sm text-[#0F2C59] border border-white/60 shadow-xs'
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
            fetchSantriWaData={() => fetchSantriWaData()}
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
            handleSaveLinkGrupWa={handleSaveLinkGrupWa}
            savingLinkGrup={savingLinkGrup}
            linkGrupSavedNotice={linkGrupSavedNotice}
            tamuList={tamuList}
            filteredTamuList={filteredTamuList}
            loadingTamuData={loadingTamuData}
            fetchTamuWaData={() => fetchTamuWaData()}
            isTamuBlasting={isTamuBlasting}
            tamuBlastProgress={tamuBlastProgress}
            handleStartBatchBlastTamu={handleStartBatchBlastTamu}
            handleStopBatchBlastTamu={handleStopBatchBlastTamu}
          />

          {/* INDIKATOR CENTRALIZED SMART QUEUE & MODE COOLDOWN (ANTI-BLOKIR FONNTE) */}
          {isCooldown ? (
            <div
              data-testid="wa-cooldown-banner"
              className="p-4 sm:p-5 rounded-2xl bg-amber-950 text-amber-50 border-2 border-amber-400/80 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0">
                  <Hourglass className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-black tracking-wide">
                    Mode Cooldown: Menunggu{' '}
                    <span className="font-mono text-amber-300 text-sm sm:text-base">
                      {cooldownFormatted}
                    </span>{' '}
                    sebelum mengirim batch berikutnya (
                    {systemState.batch_count === 0 ? 30 : systemState.batch_count}/30 pesan terkirim)
                  </div>
                  <div className="text-[11px] text-amber-200 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <Clock className="w-3.5 h-3.5 text-amber-300" />
                    <span>
                      {pendingItems.some((p) =>
                        (p.error_message || '').toLowerCase().includes('disconnected')
                      )
                        ? `Auto-Pause aktif karena perangkat WhatsApp terputus. Pesan tetap aman di PENDING (Sisa antrean: ${activeQueueCount} pesan) dan otomatis dilanjutkan setelah cooldown selesai.`
                        : `Batas 30 pesan per batch tercapai. Antrean tetap tersimpan di Supabase (Sisa antrean: ${activeQueueCount} pesan) dan otomatis dilanjutkan setelah cooldown selesai di tab/browser mana pun.`}
                    </span>
                  </div>
                </div>
              </div>

              {pendingItems.length > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    await cancelPendingWaQueue();
                    showToast('success', 'Sisa antrean PENDING dibersihkan dari database.');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer shrink-0"
                >
                  Hentikan Sisa Antrean ({pendingItems.length})
                </button>
              )}
            </div>
          ) : activeQueueCount > 0 ? (
            <div
              data-testid="wa-active-queue-banner"
              className="p-4 rounded-2xl bg-[#0F2C59] text-white border border-sky-400/50 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-amber-300 shrink-0">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold tracking-wide">
                    Mengirim pesan...{' '}
                    <span className="text-amber-300 font-black">
                      (Sisa antrean: {activeQueueCount})
                    </span>
                    {sendingItem?.nama_target || pendingItems[0]?.nama_target
                      ? ` · Target: ${sendingItem?.nama_target || pendingItems[0]?.nama_target}`
                      : ''}
                  </div>
                  <div className="text-[11px] text-sky-200 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-300" />
                      {sendingItem
                        ? 'Sedang memproses pengiriman ke Fonnte...'
                        : nextDelaySeconds > 0
                        ? `Jeda aman acak (10-60 dtk): menunggu ${nextDelaySeconds} detik sebelum pesan berikutnya`
                        : 'Siap mengirim pesan berikutnya...'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-amber-200 font-bold text-[10px]">
                      Batch saat ini: {systemState.batch_count}/30 pesan
                    </span>
                  </div>
                </div>
              </div>

              {pendingItems.length > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    await cancelPendingWaQueue();
                    showToast('success', 'Sisa antrean pengiriman dibersihkan dari database.');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer shrink-0"
                >
                  Hentikan Sisa Antrean ({pendingItems.length})
                </button>
              )}
            </div>
          ) : systemState.batch_count > 0 ? (
            <div className="px-4 py-2.5 rounded-2xl bg-white/55 backdrop-blur-sm border border-[#BAE6FD] text-[#0F2C59] text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#1D4ED8] shrink-0" />
                <span>
                  Status Smart Queue Terpusat: <strong>{systemState.batch_count}/30</strong> pesan terkirim pada batch aktif (reset otomatis ke 0 jika idle 30 menit).
                </span>
              </div>
            </div>
          ) : null}

          <WhatsAppTable
            activeTab={activeTab}
            gelombang={gelombang}
            totalTerkirim={totalTerkirim}
            keluargaCount={keluargaList.length}
            progressTotalCount={filteredList.length}
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
            tamuProgressTotalCount={filteredTamuList.length}
            pctTamuTerkirim={pctTamuTerkirim}
            tamuFilterGolongan={tamuFilterGolongan}
            setTamuFilterGolongan={setTamuFilterGolongan}
            tamuFilterStatus={tamuFilterStatus}
            setTamuFilterStatus={setTamuFilterStatus}
            tamuSearch={tamuSearch}
            setTamuSearch={setTamuSearch}
            countTamuIstimewa={countTamuIstimewa}
            countTamuKehormatan={countTamuKehormatan}
            countTamuUmum={countTamuUmum}
            loadingData={loadingData}
            filteredList={filteredList}
            sendingKode={sendingKode}
            queuedKodes={queuedKodes}
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
            handleKirimFonnteTamu={handleKirimFonnteTamu}
            handleKirimManualWATamu={handleKirimManualWATamu}
            setEditingTamuItem={setEditingTamuItem}
            setNewHpInputTamu={setNewHpInputTamu}
          />
        </div>

        {/* FLOATING QUEUE INDICATOR SAAT SCROLL KE BAWAH */}
        {(isCooldown || activeQueueCount > 0) && (
          <div
            className={`fixed bottom-6 right-6 z-40 max-w-md backdrop-blur-md px-4 py-3 rounded-2xl shadow-2xl border flex items-center space-x-3 ${
              isCooldown
                ? 'bg-amber-950/95 text-amber-50 border-amber-400/60'
                : 'bg-[#0F2C59]/95 text-white border-sky-400/50'
            }`}
          >
            {isCooldown ? (
              <Hourglass className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
            ) : (
              <Loader2 className="w-4 h-4 text-amber-300 animate-spin shrink-0" />
            )}
            <span className="text-xs font-bold leading-snug">
              {isCooldown ? (
                <>
                  Mode Cooldown: Menunggu{' '}
                  <span className="font-mono text-amber-300">{cooldownFormatted}</span> (
                  {systemState.batch_count === 0 ? 30 : systemState.batch_count}/30)
                </>
              ) : (
                <>
                  Mengirim pesan...{' '}
                  <span className="text-amber-300">(Sisa antrean: {activeQueueCount})</span>
                  {nextDelaySeconds > 0 && !sendingItem ? ` · Jeda ${nextDelaySeconds}s` : ''}
                </>
              )}
            </span>
          </div>
        )}

        {/* MODAL EDIT HP WALI & TAMU */}
        <WhatsAppSendModal
          editingItem={editingItem}
          setEditingItem={setEditingItem}
          newHpInput={newHpInput}
          setNewHpInput={setNewHpInput}
          handleSaveEditNoHp={handleSaveEditNoHp}
          isSavingHp={isSavingHp}
          hpValidationError={hpValidationError}
          setHpValidationError={setHpValidationError}
          editingTamuItem={editingTamuItem}
          setEditingTamuItem={setEditingTamuItem}
          newHpInputTamu={newHpInputTamu}
          setNewHpInputTamu={setNewHpInputTamu}
          handleSaveEditNoHpTamu={handleSaveEditNoHpTamu}
          isSavingHpTamu={isSavingHpTamu}
          hpValidationErrorTamu={hpValidationErrorTamu}
          setHpValidationErrorTamu={setHpValidationErrorTamu}
        />

        {/* TOAST NOTIFIKASI */}
        {toastMsg && (
          <div role="alert" aria-live="assertive" className="fixed bottom-24 right-6 z-50 animate-bounce-short">
            <div
              className={`flex items-center space-x-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-md ${
                toastMsg.type === 'success'
                  ? 'bg-slate-900/95 text-white border-emerald-500/60 shadow-emerald-950/30'
                  : 'bg-rose-950/95 text-white border-rose-500/60 shadow-rose-950/30'
              }`}
            >
              {toastMsg.type === 'success' ? (
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              )}
              <span className="text-xs sm:text-sm font-semibold tracking-wide">{toastMsg.message}</span>
              <button
                type="button"
                aria-label="Tutup notifikasi"
                onClick={() => setToastMsg(null)}
                className="text-white/60 hover:text-white p-1 rounded-lg ml-2 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
