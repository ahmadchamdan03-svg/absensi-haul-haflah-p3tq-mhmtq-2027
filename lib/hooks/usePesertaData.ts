'use client';

import { useState, useMemo, useEffect } from 'react';
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
import {
  GolonganUndangan,
  getGolonganUndangan,
} from '@/components/admin/peserta/TamuModal';

export type TabKategori =
  | 'SEMUA'
  | 'BIL_GHOIB'
  | 'BIN_NADZOR'
  | 'TAMATAN'
  | 'UNDANGAN'
  | 'UNDANGAN_ISTIMEWA'
  | 'UNDANGAN_KEHORMATAN'
  | 'UNDANGAN_UMUM';

export function usePesertaData() {
  const [keluargaList, setKeluargaList] = useState<any[]>([]);
  const [undanganList, setUndanganList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearScope, setClearScope] = useState<'SANTRI' | 'UNDANGAN' | 'SEMUA'>('SEMUA');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenAddUndangan = (gol: GolonganUndangan) => {
    setSelectedGolonganUndangan(gol);
    setShowAddUndanganModal(true);
  };

  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: santriData, error: sErr } = await supabase
        .from('peserta_santri')
        .select('*')
        .order('created_at', { ascending: false });

      if (sErr) {
        console.error('Error fetching peserta_santri:', sErr);
        setError(sErr.message);
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
              kamar: d.kamar || '-',
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
            tiketPanggungJatah: d.tiket_panggung_jatah ?? (d.kategori_utama === 'BIL_GHOIB' ? 1 : 0),
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
        setError(uErr.message);
      } else if (uData) {
        const mappedUndangan = uData.map((u: any) => {
          const rawSub = String(u.sub_kategori || '').trim();
          const rawKat = String(u.kategori || '').trim();
          const isSubGolongan = ['ISTIMEWA', 'KEHORMATAN', 'UMUM'].includes(rawSub.toUpperCase());
          const resolvedGolongan = isSubGolongan
            ? (rawSub.toUpperCase() as GolonganUndangan)
            : getGolonganUndangan(u);
          const resolvedKategori = isSubGolongan
            ? rawKat || 'Tamu Kehormatan'
            : rawSub && !['ISTIMEWA', 'KEHORMATAN', 'UMUM'].includes(rawSub.toUpperCase())
            ? rawSub
            : rawKat || 'Tamu Kehormatan';

          return {
            id: u.id,
            kode: u.kode,
            nama: u.nama,
            namaPutra: u.nama_putra || '',
            namaPutri: u.nama_putri || '',
            kategori: resolvedKategori,
            golongan: resolvedGolongan,
            jalur_masuk: u.jalur_masuk || '',
            jalurMasuk: u.jalur_masuk || '',
            status_konfirmasi: u.status_konfirmasi || 'BELUM',
            instansi: u.instansi || u.alamat || '-',
            alamat: u.alamat || '-',
            noHp: u.no_hp || '-',
            kuota: {
              id: u.id,
              kodeQr: u.kode,
              kuotaDasar:
                (u.nama_putra && String(u.nama_putra).trim() ? 1 : 0) +
                (u.nama_putri && String(u.nama_putri).trim() ? 1 : 0),
              kuotaTambahan: 0,
              terpakai: u.kuota_terpakai || 0,
              warnaTiket:
                u.warna_tiket !== undefined && u.warna_tiket !== null && u.warna_tiket !== ''
                  ? u.warna_tiket
                  : getWarnaTiketUndangan(resolvedGolongan, resolvedKategori),
            },
          };
        });
        setUndanganList(mappedUndangan);
      }
    } catch (e: any) {
      console.warn('Error in refreshData:', e);
      setError(e?.message || 'Gagal memuat data peserta');
      setKeluargaList([]);
      setUndanganList([]);
    } finally {
      setLoading(false);
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
    const gol =
      item.tipe === 'UNDANGAN'
        ? item.golonganUndangan || getGolonganUndangan(raw)
        : 'ISTIMEWA';

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

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      if (deletingItem.tipe === 'UNDANGAN') {
        const { error } = await supabase
          .from('tamu_undangan')
          .delete()
          .eq('kode', deletingItem.kode);
        if (error) {
          alert(`Gagal menghapus tamu dari Supabase DB: ${error.message}`);
          return;
        }
      } else {
        const { error } = await supabase
          .from('peserta_santri')
          .delete()
          .eq('kode', deletingItem.kode);
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
        catatan: `Penghapusan Data ${
          deletingItem.tipe === 'UNDANGAN' ? 'Tamu' : 'Santri'
        } (${deletingItem.kode}) - Backup di detail`,
      });
    } catch (err: any) {
      alert(`Terjadi kesalahan saat menghapus data: ${err?.message || err}`);
      return;
    }

    store.hapusPeserta(deletingItem.kode);
    await refreshData();
    showToast(
      `✓ Peserta ${deletingItem.nama} (${deletingItem.kode}) telah berhasil dihapus dari database.`
    );
    setDeletingItem(null);
  };

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

  const allItems = useMemo(() => {
    const list: any[] = [];

    keluargaList.forEach((k) => {
      const santri = k.santri?.[0];
      const kuota = k.kuota;
      const totalKuota = (kuota?.kuotaDasar || 0) + (kuota?.kuotaTambahan || 0);
      const terpakai = kuota?.terpakai || 0;
      const sisa = Math.max(0, totalKuota - terpakai);
      const kat = santri?.kategoriUtama || 'BIN_NADZOR';
      const bagian =
        kat === 'TAMATAN'
          ? extractBagianTamatan(santri?.kelas || santri?.subKategori)
          : '';

      list.push({
        id: k.id,
        kode: k.kode,
        tipe: 'SANTRI',
        kategoriUtama: kat,
        bagianTamatan: bagian,
        kelas: santri?.kelas || '',
        subKategori: santri?.subKategori || '',
        nama: santri?.nama || '-',
        kamar: santri?.kamar || k.kamar || '-',
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
        jalurMasuk: (u as any).jalurMasuk || (u as any).jalur_masuk || '',
        kuotaDasar:
          kuota?.kuotaDasar !== undefined
            ? kuota.kuotaDasar
            : ((u as any).namaPutra && String((u as any).namaPutra).trim() ? 1 : 0) +
              ((u as any).namaPutri && String((u as any).namaPutri).trim() ? 1 : 0),
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

  return {
    keluargaList,
    setKeluargaList,
    undanganList,
    setUndanganList,
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    bagianFilter,
    setBagianFilter,
    statusHadirFilter,
    setStatusHadirFilter,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    showAddModal,
    setShowAddModal,
    showAddUndanganModal,
    setShowAddUndanganModal,
    selectedGolonganUndangan,
    setSelectedGolonganUndangan,
    editingItem,
    setEditingItem,
    deletingItem,
    setDeletingItem,
    qrDetailItem,
    setQrDetailItem,
    qrDataUrl,
    toastMessage,
    showToast,
    showClearModal,
    setShowClearModal,
    clearScope,
    setClearScope,
    handleOpenAddUndangan,
    handleConfirmHapusSemua,
    handleOpenEdit,
    handleConfirmDelete,
    loading,
    error,
    refreshData,
    refetch: refreshData,
    stats,
    allItems,
  };
}
