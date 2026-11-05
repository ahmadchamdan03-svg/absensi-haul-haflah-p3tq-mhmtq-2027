'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { store } from '@/lib/mock-data';
import { generateRandomKode, generateUniqueKodeFromDb } from '@/lib/utils';
import { getWarnaTiketUndangan, normalizePesertaString } from '@/lib/types';

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
  merged_group_id?: string | null;
  isMerged?: boolean;
  mergedItems?: any[];
  uniqueGolongan?: string[];
  uniqueSubKategori?: string[];
  multiBadges?: Array<{
    id: string;
    kode: string;
    kategori: string;
    golongan: string;
  }>;
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
        const rawMapped = supaData.map((d: any) => {
          const hasP = !!(d.nama_putra && String(d.nama_putra).trim());
          const hasW = !!(d.nama_putri && String(d.nama_putri).trim());
          let kBase = hasP && hasW ? 2 : (hasP || hasW ? 1 : 0);
          if (kBase === 0 && d.nama && String(d.nama).trim()) {
            kBase = String(d.nama).includes('&') ? 2 : 1;
          }
          return {
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
            merged_group_id: d.merged_group_id || null,
            kuota: {
              id: d.id,
              kodeQr: d.kode,
              kuotaDasar: kBase,
              kuotaTambahan: 0,
              terpakai: d.kuota_terpakai || 0,
            },
          };
        });

        // Grouping berdasarkan merged_group_id persis seperti usePesertaData
        const getPriority = (item: any) => {
          const gol = (item.golongan || '').toUpperCase();
          if (gol === 'ISTIMEWA') return 30;
          if (gol === 'KEHORMATAN') return 20;
          return 10;
        };

        const groupMap = new Map<string, any[]>();
        const unmergedList: any[] = [];

        rawMapped.forEach((item: any) => {
          if (item.merged_group_id) {
            if (!groupMap.has(item.merged_group_id)) {
              groupMap.set(item.merged_group_id, []);
            }
            groupMap.get(item.merged_group_id)!.push(item);
          } else {
            unmergedList.push({
              ...item,
              isMerged: false,
              mergedItems: [item],
            });
          }
        });

        const mergedCards: any[] = [];
        groupMap.forEach((groupItems, groupId) => {
          if (groupItems.length === 1) {
            unmergedList.push({
              ...groupItems[0],
              isMerged: false,
              mergedItems: groupItems,
            });
            return;
          }

          groupItems.sort((a, b) => getPriority(b) - getPriority(a));
          const primary = groupItems[0];

          // Deduplikasi nama unik agar tidak terjadi double-counting kuota
          const uniqueNames = new Set<string>();
          groupItems.forEach((it) => {
            const p = (it.namaPutra || '').trim();
            const w = (it.namaPutri || '').trim();
            if (p) uniqueNames.add(normalizePesertaString(p));
            if (w) uniqueNames.add(normalizePesertaString(w));
            if (!p && !w && it.nama) {
              const parts = it.nama.split(/&|,/).map((s: string) => s.trim()).filter(Boolean);
              parts.forEach((part: string) => uniqueNames.add(normalizePesertaString(part)));
            }
          });

          const deduplicatedKuota =
            uniqueNames.size > 0 ? uniqueNames.size : Math.max(...groupItems.map((it) => it.kuota.kuotaDasar || 1));
          const maxTerpakai = Math.max(...groupItems.map((it) => it.kuota.terpakai || 0));

          // Kategori Utama unik (misal: "ISTIMEWA")
          const uniqueGolongan = Array.from(
            new Set(
              groupItems
                .map((it) => (it.golongan || 'ISTIMEWA').toUpperCase())
                .filter(Boolean)
            )
          );

          // Sub-kategori unik (misal: ["VIP IDS", "VIP Bani Marzuqi"])
          const uniqueSubKategori = Array.from(
            new Set(
              groupItems
                .map((it) => (it.kategori || '').trim())
                .filter(Boolean)
            )
          );

          mergedCards.push({
            ...primary,
            isMerged: true,
            merged_group_id: groupId,
            mergedItems: groupItems,
            uniqueGolongan,
            uniqueSubKategori,
            multiBadges: groupItems.map((it) => ({
              id: it.id,
              kode: it.kode,
              kategori: it.kategori,
              golongan: it.golongan,
            })),
            kuota: {
              id: primary.id,
              kodeQr: primary.kode,
              kuotaDasar: deduplicatedKuota,
              kuotaTambahan: 0,
              terpakai: maxTerpakai,
            },
          });
        });

        setUndanganList([...mergedCards, ...unmergedList]);
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

    if (u.isMerged && u.mergedItems) {
      u.mergedItems.forEach((m) => {
        try {
          store.checkin(m.kode, totalKuotaItem, 0, 'BARAT', 0, 'penerima-tamu');
        } catch {}
      });
    } else {
      store.checkin(u.kode, totalKuotaItem, 0, 'BARAT', 0, 'penerima-tamu');
    }
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

    if (u.isMerged && u.mergedItems) {
      u.mergedItems.forEach((m) => {
        try {
          (store as any).batalCheckin(m.kode);
        } catch {}
      });
    } else {
      (store as any).batalCheckin(u.kode);
    }
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

    // Logika Kuota Otomatis:
    // Putra & Putri terisi -> Kuota = 2
    // Salah satu terisi -> Kuota = 1
    // Keduanya kosong -> Error (Kuota 0 tidak boleh submit)
    const hasP = !!p;
    const hasW = !!w;
    const autoKuota = hasP && hasW ? 2 : (hasP || hasW ? 1 : (n ? (n.includes('&') ? 2 : 1) : 0));

    if (autoKuota === 0) {
      alert('Wajib mengisi minimal satu Nama Tamu (Putra atau Putri)!');
      return;
    }

    let finalNama = '';
    if (p && w) finalNama = `${p} & ${w}`;
    else if (p) finalNama = p;
    else if (w) finalNama = w;
    else finalNama = n;

    const kuotaBase = autoKuota;

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
      let mergedGroupId: string | null = null;
      try {
        const detectRes = await fetch('/api/peserta/merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'detect',
            nama: finalNama,
            alamat: finalAlamat,
            type: 'TAMU',
          }),
        });
        const detectJson = await detectRes.json();
        if (detectJson.detected && detectJson.record) {
          const rec = detectJson.record;
          const existingSubKat = (rec.kategori || rec.sub_kategori || '').trim();
          const incomingSubKat = finalKategori.trim();
          let promptMsg = '';
          if (existingSubKat && incomingSubKat && existingSubKat.toLowerCase() !== incomingSubKat.toLowerCase()) {
            promptMsg = `Terdeteksi data serupa dengan Sub-Kategori berbeda (${existingSubKat}). Apakah Anda ingin menggabungkan data ini ke dalam satu kartu?`;
          } else {
            const kota = (rec.alamat || '').trim().split(/\s+/).pop() || 'daerah serupa';
            promptMsg = `Terdeteksi data serupa: ${rec.nama} dari ${kota}.\n\nApakah Anda ingin menggabungkan data ini?`;
          }
          const wantsMerge = window.confirm(promptMsg);
          if (wantsMerge) {
            mergedGroupId = rec.merged_group_id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `grp-${Date.now()}`);
            if (!rec.merged_group_id) {
              await fetch('/api/tamu', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: rec.id, merged_group_id: mergedGroupId }),
              }).catch(() => {});
            }
          }
        }
      } catch (detErr) {
        console.warn('Detect duplicate error in penerima-tamu:', detErr);
      }

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
          merged_group_id: mergedGroupId,
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
      const matchName = u.nama.toLowerCase().includes(q);
      const matchInstansi = (u.instansi || '').toLowerCase().includes(q);
      const matchAlamat = (u.alamat || '').toLowerCase().includes(q);
      const matchKode = u.kode.toLowerCase().includes(q);
      const matchKat = (u.kategori || '').toLowerCase().includes(q);
      const matchGol = (u.golongan || '').toLowerCase().includes(q);
      const matchMerged =
        u.isMerged &&
        u.mergedItems?.some(
          (m: any) =>
            (m.nama && m.nama.toLowerCase().includes(q)) ||
            (m.kategori && m.kategori.toLowerCase().includes(q)) ||
            (m.golongan && m.golongan.toLowerCase().includes(q)) ||
            (m.instansi && m.instansi.toLowerCase().includes(q)) ||
            (m.alamat && m.alamat.toLowerCase().includes(q)) ||
            (m.kode && m.kode.toLowerCase().includes(q))
        );
      return matchName || matchInstansi || matchAlamat || matchKode || matchKat || matchGol || matchMerged;
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
