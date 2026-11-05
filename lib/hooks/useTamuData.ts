'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { store } from '@/lib/mock-data';
import { generateRandomKode, generateUniqueKodeFromDb } from '@/lib/utils';
import { getWarnaTiketUndangan } from '@/lib/types';

export type GolonganUndangan = 'ISTIMEWA' | 'KEHORMATAN' | 'UMUM';

export const OPSI_UNDANGAN_ISTIMEWA = [
  'VVIP',
  'VIP Bani Marzuqi',
  'VIP Bani Qomariyah',
  'VIP Bani Mahrus (Zainab)',
  'VIP Bani Salamah',
  'VIP Bani Aisyah',
  'VIP Bandar',
  'VIP Keluarga Kunir – Blitar',
  'VIP IDS',
  'Lainnya (Ketik Sendiri...)',
];

export const OPSI_UNDANGAN_UMUM = [
  'Asatidz Mhmtq Sekalian',
  'Asatidz Purna Bakti',
  'Asatidzah Mhmtq Nduduk Rumah',
  'Mustahiq Tamatan Non Purna',
  'Purna Mustahiqoh Ibtidaiyyah Tamatan Aliyah',
  'Pengajar Ekstrakurikuler Pondok (Mutakhorijin)',
  'Pengajar Unit',
  "Penguji Al-Qur'an",
  'Perwakilan Pondok',
  'Lainnya (Ketik Sendiri...)',
];

export interface TamuUndanganItem {
  id: string;
  kode: string;
  nama: string;
  namaPutra: string;
  namaPutri: string;
  kategori: string;
  instansi: string;
  alamat: string;
  noHp: string;
  golongan: string;
  kuota: {
    id: string;
    kodeQr: string;
    kuotaDasar: number;
    kuotaTambahan: number;
    terpakai: number;
  };
}

export function useTamuData() {
  const [undanganList, setUndanganList] = useState<TamuUndanganItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUsModalOpen, setIsUsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ABSENSI' | 'POS_JAGA'>('ABSENSI');

  // Modal Tambah Tamu Baru State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmittingTamu, setIsSubmittingTamu] = useState(false);
  const [selectedGolonganUndangan, setSelectedGolonganUndangan] = useState<GolonganUndangan>('ISTIMEWA');
  const [undanganForm, setUndanganForm] = useState({
    nama: '',
    namaPutra: '',
    namaPutri: '',
    kategori: OPSI_UNDANGAN_ISTIMEWA[0],
    instansi: '',
    alamat: '',
    noHp: '',
    kuotaDasar: 2,
  });
  const [undanganKategoriDropdown, setUndanganKategoriDropdown] = useState<string>(OPSI_UNDANGAN_ISTIMEWA[0]);
  const [customKategoriInput, setCustomKategoriInput] = useState<string>('');

  const fetchTamuData = useCallback(async () => {
    try {
      const { data: supaData, error } = await supabase
        .from('tamu_undangan')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && supaData) {
        const mapped = supaData.map((d: any) => ({
          id: d.id,
          kode: d.kode,
          nama: d.nama,
          namaPutra: d.nama_putra || '',
          namaPutri: d.nama_putri || '',
          kategori: d.kategori || 'VIP IDS',
          instansi: d.instansi || d.alamat || '',
          alamat: d.alamat || '',
          noHp: d.no_hp || '',
          golongan: d.sub_kategori || 'ISTIMEWA',
          kuota: {
            id: d.id,
            kodeQr: d.kode,
            kuotaDasar:
              (d.nama_putra && String(d.nama_putra).trim() ? 1 : 0) +
              (d.nama_putri && String(d.nama_putri).trim() ? 1 : 0),
            kuotaTambahan: 0,
            terpakai: d.kuota_terpakai || 0,
          },
        }));
        setUndanganList(mapped);
      } else {
        setUndanganList([]);
      }
    } catch {
      setUndanganList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTamuData();

    const channel = supabase
      .channel('penerima_tamu_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tamu_undangan' }, fetchTamuData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presensi_log' }, fetchTamuData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pembelian_kuota' }, fetchTamuData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTamuData]);

  const handleOpenAddModal = (gol: GolonganUndangan = 'ISTIMEWA') => {
    setSelectedGolonganUndangan(gol);
    let defaultKategori = OPSI_UNDANGAN_ISTIMEWA[0];
    if (gol === 'KEHORMATAN') defaultKategori = 'Tamu Kehormatan';
    else if (gol === 'UMUM') defaultKategori = OPSI_UNDANGAN_UMUM[0];
    setUndanganKategoriDropdown(defaultKategori);
    setUndanganForm({
      nama: '',
      namaPutra: '',
      namaPutri: '',
      kategori: defaultKategori,
      instansi: '',
      alamat: '',
      noHp: '',
      kuotaDasar: gol === 'ISTIMEWA' ? 2 : gol === 'KEHORMATAN' ? 4 : 2,
    });
    setCustomKategoriInput('');
    setShowAddModal(true);
  };

  const handleQuickCheckin = async (u: TamuUndanganItem) => {
    const terpakaiSekarang = u.kuota?.terpakai || 0;
    const kuotaDasar =
      u.kuota?.kuotaDasar !== undefined
        ? u.kuota.kuotaDasar
        : ((u.namaPutra && String(u.namaPutra).trim() ? 1 : 0) +
            (u.namaPutri && String(u.namaPutri).trim() ? 1 : 0));
    const kuotaTambahan = u.kuota?.kuotaTambahan || 0;
    const totalKuotaItem = kuotaDasar + kuotaTambahan;
    if (terpakaiSekarang >= totalKuotaItem) {
      alert(`Kuota untuk ${u.nama} sudah terpakai seluruhnya.`);
      return;
    }

    const newTerpakai = totalKuotaItem;

    let jumlahL = 1;
    let jumlahP = 0;

    const p = (u.namaPutra || '').trim();
    const w = (u.namaPutri || '').trim();

    if (p && w) {
      jumlahL = Math.ceil(totalKuotaItem / 2);
      jumlahP = Math.floor(totalKuotaItem / 2);
    } else if (p) {
      jumlahL = totalKuotaItem;
      jumlahP = 0;
    } else if (w) {
      jumlahL = 0;
      jumlahP = totalKuotaItem;
    } else {
      const lower = (u.nama || '').toLowerCase();
      const isFemale = ['nyai', 'hj.', 'ning', 'ibu', 'ustadzah', 'hajah', 'biyung'].some((h) =>
        lower.includes(h)
      );
      if (isFemale) {
        jumlahL = 0;
        jumlahP = totalKuotaItem;
      } else {
        jumlahL = totalKuotaItem;
        jumlahP = 0;
      }
    }

    try {
      const res = await fetch('/api/presensi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkin',
          kode_qr: u.kode,
          entityId: u.id,
          nama_peserta: u.nama,
          tipe_peserta: 'UNDANGAN',
          jumlah_l: jumlahL,
          jumlah_p: jumlahP,
          jalur: 'MEJA_TRANSIT',
          panitia_id: 'penerima-tamu',
          catatan: 'Checkin via Penerima Tamu',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        console.warn('Presensi server error:', data.error || data.reason);
      }
    } catch (e) {
      console.warn('Presensi network error:', e);
    }

    store.checkin(u.kode, totalKuotaItem, 0, 'BARAT', 0, 'penerima-tamu');
    await fetchTamuData();
  };

  const handleBatalkanHadir = async (u: TamuUndanganItem) => {
    if (!confirm(`Batalkan kehadiran untuk ${u.nama} (${u.kode})? Status akan kembali menjadi BELUM HADIR.`)) {
      return;
    }

    try {
      const res = await fetch('/api/presensi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batal',
          kode: u.kode,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        console.warn('Batal presensi server error:', data.error);
      }
    } catch (e) {
      console.warn('Batal presensi error:', e);
    }

    (store as any).batalCheckin(u.kode);
    await fetchTamuData();
  };

  const handleHapusTamu = async (u: TamuUndanganItem) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data tamu "${u.nama}"?`)) return;
    try {
      const res = await fetch(`/api/tamu?kode=${encodeURIComponent(u.kode)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data.error || 'Gagal menghapus data tamu dari server.');
        return;
      }
    } catch (e) {
      console.warn('Delete tamu error:', e);
    }
    (store as any).batalCheckin(u.kode);
    await fetchTamuData();
  };

  const handleTambahTamu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingTamu) return;

    let finalKategori = '';
    if (selectedGolonganUndangan === 'KEHORMATAN') {
      finalKategori = 'Tamu Kehormatan';
    } else {
      finalKategori =
        undanganKategoriDropdown === 'Lainnya (Ketik Sendiri...)'
          ? customKategoriInput.trim()
          : undanganKategoriDropdown.trim();

      if (!finalKategori) {
        alert('Kategori undangan wajib diisi atau diketik!');
        return;
      }
    }

    const isAsatidzSekalian = selectedGolonganUndangan === 'UMUM' && finalKategori === 'Asatidz Mhmtq Sekalian';

    const p = (undanganForm.namaPutra || '').trim().toUpperCase();
    const w = (undanganForm.namaPutri || '').trim().toUpperCase();
    const n = (undanganForm.nama || '').trim().toUpperCase();

    if (!p && !w && !n) {
      alert('Mohon isi minimal salah satu: Nama Tamu Putra (Kyai/Gus/Ust.) atau Nama Tamu Putri (Nyai/Ning/Ustazah)!');
      return;
    }

    let finalNama = '';
    let kuotaBase = 1;

    if (p && w) {
      finalNama = `${p} & ${w}`;
      kuotaBase = 2;
    } else if (p) {
      finalNama = p;
      kuotaBase = 1;
    } else if (w) {
      finalNama = w;
      kuotaBase = 1;
    } else {
      finalNama = n;
      kuotaBase = 1;
    }

    if (isAsatidzSekalian && p && w) {
      kuotaBase = 2;
    }

    let finalAlamat = '';
    let finalInstansi = '';

    if (selectedGolonganUndangan === 'ISTIMEWA' || selectedGolonganUndangan === 'KEHORMATAN') {
      finalAlamat = (undanganForm.alamat || undanganForm.instansi || '').trim();
      finalInstansi = finalAlamat;
    } else {
      finalInstansi = (undanganForm.instansi || '').trim();
      finalAlamat = (undanganForm.alamat || '').trim();
    }

    if (!p && !w && !finalNama) {
      alert('Minimal salah satu nama (Putra atau Putri) harus diisi!');
      return;
    }

    let newKode = '';
    setIsSubmittingTamu(true);

    try {
      const res = await fetch('/api/tamu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: finalNama,
          namaPutra: p || null,
          namaPutri: w || null,
          instansi: finalInstansi || '-',
          alamat: finalAlamat || '-',
          kategori: finalKategori,
          subKategori: selectedGolonganUndangan || 'ISTIMEWA',
          noHp: undanganForm.noHp || '-',
          kuotaDasar: kuotaBase,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        alert(`Gagal menyimpan Tamu Undangan: ${json.error || 'Kesalahan server'}`);
        return;
      }
      newKode = json.kode;

      store.tambahUndangan({
        nama: finalNama,
        namaPutra: p,
        namaPutri: w,
        kategori: finalKategori,
        instansi: finalInstansi,
        alamat: finalAlamat,
        kuotaDasar: kuotaBase,
        golongan: selectedGolonganUndangan,
      });

      await fetchTamuData();
      setShowAddModal(false);
      alert(`✓ Berhasil menambahkan Tamu Undangan ke Supabase: ${finalNama} (Kode: ${newKode})`);

      setUndanganForm({
        nama: '',
        namaPutra: '',
        namaPutri: '',
        kategori: OPSI_UNDANGAN_ISTIMEWA[0],
        instansi: '',
        alamat: '',
        noHp: '',
        kuotaDasar: 1,
      });
      setUndanganKategoriDropdown(OPSI_UNDANGAN_ISTIMEWA[0]);
      setCustomKategoriInput('');
    } catch (err: any) {
      console.warn('API /api/tamu exception:', err);
      alert(`Terjadi kesalahan saat menyimpan: ${err.message || err}`);
    } finally {
      setIsSubmittingTamu(false);
    }
  };

  const filteredUndangan = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return undanganList;
    return undanganList.filter((u) => {
      return (
        u.nama.toLowerCase().includes(q) ||
        (u.instansi && u.instansi.toLowerCase().includes(q)) ||
        u.kode.toLowerCase().includes(q) ||
        (u.kategori && u.kategori.toLowerCase().includes(q))
      );
    });
  }, [undanganList, searchQuery]);

  const totalKuotaTamu = useMemo(() => {
    return undanganList.reduce((acc, u) => {
      const kBase = Number(
        u.kuota?.kuotaDasar !== undefined && u.kuota?.kuotaDasar !== null
          ? u.kuota.kuotaDasar
          : ((u.namaPutra && String(u.namaPutra).trim() ? 1 : 0) +
              (u.namaPutri && String(u.namaPutri).trim() ? 1 : 0))
      );
      const kExtra = Number(u.kuota?.kuotaTambahan || 0);
      return acc + kBase + kExtra;
    }, 0);
  }, [undanganList]);

  const totalHadirTamu = useMemo(() => {
    return undanganList.reduce((acc, u) => {
      return acc + Number(u.kuota?.terpakai || 0);
    }, 0);
  }, [undanganList]);

  const totalBelumHadirTamu = useMemo(() => {
    return Math.max(0, totalKuotaTamu - totalHadirTamu);
  }, [totalKuotaTamu, totalHadirTamu]);

  return {
    undanganList,
    loading,
    searchQuery,
    setSearchQuery,
    isUsModalOpen,
    setIsUsModalOpen,
    activeTab,
    setActiveTab,
    showAddModal,
    setShowAddModal,
    selectedGolonganUndangan,
    setSelectedGolonganUndangan,
    undanganForm,
    setUndanganForm,
    undanganKategoriDropdown,
    setUndanganKategoriDropdown,
    customKategoriInput,
    setCustomKategoriInput,
    handleOpenAddModal,
    handleQuickCheckin,
    handleBatalkanHadir,
    handleHapusTamu,
    handleTambahTamu,
    isSubmittingTamu,
    filteredUndangan,
    totalKuotaTamu,
    totalHadirTamu,
    totalBelumHadirTamu,
    fetchTamuData,
  };
}
