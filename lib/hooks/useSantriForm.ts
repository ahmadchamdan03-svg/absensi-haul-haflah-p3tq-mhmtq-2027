'use client';

import { useState, useEffect, useRef } from 'react';
import { store } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/audit-log';
import {
  getWarnaTiketSantri,
  calculateKuotaDasarSantri,
  mergeSubKategori,
  resolvePriorityKategoriUtama,
  isDuplicateSantri,
  normalizePesertaString,
  normalizeWaliString,
} from '@/lib/types';
import { generateRandomKode, generateUniqueKodeFromDb } from '@/lib/utils';

export interface UseSantriFormProps {
  editingItem: any | null;
  setEditingItem: (item: any | null) => void;
  setShowAddModal: (show: boolean) => void;
  onAddSuccess: (newSantriItem: any, message: string) => void;
  onEditSuccess: (message: string) => Promise<void> | void;
}

export function useSantriForm({
  editingItem,
  setEditingItem,
  setShowAddModal,
  onAddSuccess,
  onEditSuccess,
}: UseSantriFormProps) {
  // State & Ref Guard Anti-Duplikasi Submit
  const [isSubmittingSantri, setIsSubmittingSantri] = useState(false);
  const submitLockSantri = useRef(false);

  // Form state tambah santri (tanpa Sub-Kategori / Juz / Tingkat)
  const [formData, setFormData] = useState({
    nama: '',
    kategoriUtama: 'BIL_GHOIB' as 'BIL_GHOIB' | 'BIN_NADZOR' | 'TAMATAN',
    bagianTamatan: 'A.01',
    kamar: '',
    namaWali: '',
    noHp: '',
    alamat: '',
  });

  // Edit Modal Audit History Tab State
  const [editModalTab, setEditModalTab] = useState<'FORM' | 'RIWAYAT'>('FORM');
  const [itemAuditHistory, setItemAuditHistory] = useState<any[]>([]);
  const [loadingAuditHistory, setLoadingAuditHistory] = useState(false);

  const isEditingSantri = editingItem && editingItem.tipe === 'SANTRI';

  useEffect(() => {
    if (isEditingSantri && editingItem?.kode) {
      setLoadingAuditHistory(true);
      supabase
        .from('audit_log')
        .select('*')
        .eq('kode', editingItem.kode)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) {
            setItemAuditHistory(data);
          } else {
            setItemAuditHistory([]);
          }
          setLoadingAuditHistory(false);
        });
    } else if (!isEditingSantri) {
      setItemAuditHistory([]);
      setEditModalTab('FORM');
    }
  }, [isEditingSantri, editingItem?.kode]);

  // Handler Tambah Santri Baru (Cek Kategori Dobel + Direct Supabase + Optimistic UI)
  const handleTambahPeserta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLockSantri.current || isSubmittingSantri) return;

    if (!formData.nama.trim()) {
      alert('Nama santri wajib diisi!');
      return;
    }
    if (!formData.namaWali.trim()) {
      alert('Nama wali wajib diisi!');
      return;
    }

    submitLockSantri.current = true;
    setIsSubmittingSantri(true);

    const cleanNama = formData.nama.trim().replace(/\s+/g, ' ');
    const cleanWali = formData.namaWali.trim().replace(/\s+/g, ' ');

    const incomingSubKat =
      formData.kategoriUtama === 'TAMATAN'
        ? `Tamatan (${formData.bagianTamatan || 'A.01'})`
        : formData.kategoriUtama === 'BIL_GHOIB'
        ? 'Bil Ghoib'
        : 'Bin Nadzori';

    try {
      // 1. CEK APAKAH NAMA SANTRI DAN NAMA WALI SUDAH ADA DI DATABASE (KATEGORI DOBEL)
      // Query kandidat santri dengan nama yang cocok (case-insensitive)
      const { data: existingList, error: checkError } = await supabase
        .from('peserta_santri')
        .select('*')
        .ilike('nama', cleanNama);

      if (checkError) {
        console.warn('Error checking existing santri:', checkError);
      }

      // Verifikasi menggunakan fungsi normalisasi ketat anti-spasi ganda & toleransi gelar wali
      let existing = existingList?.find((item) =>
        isDuplicateSantri(item.nama, item.nama_wali, cleanNama, cleanWali)
      );

      // Fallback 1: Jika ilike nama persis tidak menemukan (misal ada spasi berlebih di database)
      if (!existing && cleanNama.length >= 3) {
        const { data: broadList } = await supabase
          .from('peserta_santri')
          .select('*')
          .ilike('nama', `%${cleanNama}%`);
        existing = broadList?.find((item) =>
          isDuplicateSantri(item.nama, item.nama_wali, cleanNama, cleanWali)
        );
      }

      // Fallback 2: Cek memori lokal jika koneksi Supabase offline
      if (!existing) {
        const localMatch = store.getKeluargaList().find((k) =>
          k.santri?.some((s) => isDuplicateSantri(s.nama, k.namaWali, cleanNama, cleanWali))
        );
        if (localMatch) {
          const { data: byKode } = await supabase
            .from('peserta_santri')
            .select('*')
            .eq('kode', localMatch.kode)
            .maybeSingle();
          if (byKode) existing = byKode;
        }
      }

      if (existing) {
        // 2. TAMPILKAN POP-UP KONFIRMASI: KARENA NAMA DAN WALI COCOK
        const confirmed = window.confirm(
          `Santri dengan nama ${existing.nama} sudah ada. Apakah Anda ingin memperbarui datanya dan menggabungkan kategorinya?`
        );

        if (!confirmed) {
          return;
        }

        // 3. Jika Konfirmasi YA: LAKUKAN UPDATE
        const mergedSub = mergeSubKategori(existing.sub_kategori || '', incomingSubKat);
        const resolvedKatUtama = resolvePriorityKategoriUtama(
          existing.kategori_utama,
          formData.kategoriUtama,
          mergedSub
        );
        const resolvedKuota = Math.max(
          Number(existing.kuota_dasar || 0),
          calculateKuotaDasarSantri(resolvedKatUtama, mergedSub)
        );
        const resolvedWarna = getWarnaTiketSantri(resolvedKatUtama, mergedSub);

        const updatePayload: any = {
          kategori_utama: resolvedKatUtama,
          sub_kategori: mergedSub,
          kuota_dasar: resolvedKuota,
          warna_tiket: resolvedWarna,
          updated_at: new Date().toISOString(),
        };

        if (formData.noHp.trim()) {
          updatePayload.no_hp = formData.noHp.trim();
        }
        if (formData.kamar.trim()) {
          updatePayload.kamar = formData.kamar.trim();
        }
        if (formData.alamat.trim()) {
          updatePayload.alamat = formData.alamat.trim().toUpperCase();
        }

        const { error: updateError } = await supabase
          .from('peserta_santri')
          .update(updatePayload)
          .eq('id', existing.id);

        if (updateError) {
          alert(`Gagal memperbarui data santri di Supabase: ${updateError.message}`);
          return;
        }

        store.editPeserta(existing.kode, {
          nama: existing.nama,
          kategoriUtama: resolvedKatUtama,
          subKategori: mergedSub,
          kuotaDasar: resolvedKuota,
          namaWali: existing.nama_wali,
          noHp: updatePayload.no_hp || existing.no_hp,
          kamar: updatePayload.kamar || existing.kamar,
          alamat: updatePayload.alamat || existing.alamat,
        });

        logAudit({
          panitia_id: 'ADMIN_SEKRETARIAT',
          panitia_role: 'ADMIN',
          aksi: 'UPDATE_PESERTA',
          tabel: 'peserta_santri',
          kode: existing.kode,
          nama: existing.nama,
          field: 'gabung_kategori_manual',
          nilai_lama: existing.sub_kategori,
          nilai_baru: mergedSub,
          catatan: `Penggabungan Kategori Santri Manual (${existing.kode}): ${mergedSub}`,
        }).catch((err) => console.warn('Audit log error:', err));

        setShowAddModal(false);
        onEditSuccess(
          `✓ Berhasil memperbarui & menggabungkan kategori santri ${existing.nama}: ${mergedSub} (Kuota: ${resolvedKuota} Kursi, Tiket: ${resolvedWarna})`
        );

        setFormData({
          nama: '',
          kategoriUtama: 'BIL_GHOIB',
          bagianTamatan: 'A.01',
          kamar: '',
          namaWali: '',
          noHp: '',
          alamat: '',
        });
        return;
      }

      // 2. SANTRI BELUM ADA ATAU NAMA WALI BEDA: LAKUKAN INSERT BARU
      const kuotaVal = calculateKuotaDasarSantri(formData.kategoriUtama, incomingSubKat);
      const warna = getWarnaTiketSantri(formData.kategoriUtama, incomingSubKat);

      let kodeBaru = generateRandomKode('SH');
      kodeBaru = await generateUniqueKodeFromDb('SH', 'peserta_santri', supabase);

      const { data, error } = await supabase.from('peserta_santri').insert([
        {
          kode: kodeBaru,
          nama: cleanNama,
          kategori_utama: formData.kategoriUtama || 'BIL_GHOIB',
          sub_kategori: incomingSubKat,
          kelas: formData.kategoriUtama || '-',
          kamar: formData.kamar.trim() || '-',
          nama_wali: cleanWali || '-',
          no_hp: formData.noHp.trim() || '-',
          alamat: formData.alamat.trim().toUpperCase() || 'Kediri',
          kuota_dasar: kuotaVal,
          kuota_tambahan: 0,
          kuota_terpakai: 0,
          status_konfirmasi: 'BELUM',
          warna_tiket: warna,
        },
      ]);

      if (error) {
        alert(`Gagal menambahkan data santri ke database Supabase: ${error.message}`);
        return;
      }

      const newSantriItem = {
        id: data && (data as any)[0]?.id ? (data as any)[0].id : kodeBaru,
        kode: kodeBaru,
        namaWali: formData.namaWali.trim().toUpperCase(),
        noHp: formData.noHp.trim() || '-',
        alamat: formData.alamat.trim().toUpperCase() || 'Kediri',
        kamar: formData.kamar.trim() || '-',
        santri: [
          {
            id: kodeBaru,
            nis: kodeBaru,
            nama: cleanNama,
            kamar: formData.kamar.trim() || '-',
            kelas: formData.kategoriUtama || '-',
            kategoriUtama: formData.kategoriUtama || 'BIL_GHOIB',
            subKategori: incomingSubKat,
            bagianTamatan: incomingSubKat,
          },
        ],
        kuota: {
          id: kodeBaru,
          kodeQr: kodeBaru,
          kuotaDasar: kuotaVal,
          kuotaTambahan: 0,
          terpakai: 0,
          tiketPanggungJatah: formData.kategoriUtama === 'BIL_GHOIB' ? 1 : 0,
          warnaTiket: warna,
        },
      };

      store.tambahPeserta({
        nama: cleanNama,
        kategoriUtama: formData.kategoriUtama,
        bagianTamatan: formData.kategoriUtama === 'TAMATAN' ? formData.bagianTamatan : undefined,
        kamar: formData.kamar.trim(),
        namaWali: formData.namaWali.trim().toUpperCase(),
        noHp: formData.noHp.trim(),
        alamat: formData.alamat.trim().toUpperCase(),
      });

      setShowAddModal(false);
      onAddSuccess(
        newSantriItem,
        `✓ Berhasil menambahkan santri baru ke database: ${formData.nama} (Kode: ${kodeBaru})`
      );

      logAudit({
        panitia_id: 'ADMIN_SEKRETARIAT',
        panitia_role: 'ADMIN',
        aksi: 'TAMBAH_PESERTA',
        tabel: 'peserta_santri',
        kode: kodeBaru,
        nama: cleanNama,
        field: 'tambah_santri_baru',
        nilai_baru: JSON.stringify(formData),
        detail: formData,
        catatan: `Penambahan Data Santri Baru (${kodeBaru})`,
      }).catch((err) => console.warn('Audit log error:', err));

      setFormData({
        nama: '',
        kategoriUtama: 'BIL_GHOIB',
        bagianTamatan: 'A.01',
        kamar: '',
        namaWali: '',
        noHp: '',
        alamat: '',
      });
    } catch (err: any) {
      alert(`Terjadi kesalahan sistem saat menghubungi Supabase: ${err?.message || err}`);
    } finally {
      submitLockSantri.current = false;
      setIsSubmittingSantri(false);
    }
  };

  // Handler Edit Santri (Direct Supabase Update by Kode)
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || editingItem.tipe !== 'SANTRI' || submitLockSantri.current || isSubmittingSantri) return;

    submitLockSantri.current = true;
    setIsSubmittingSantri(true);

    const targetKode = editingItem.kode;

    let subKat = editingItem.subKategori || 'Bin Nadzori';
    let kls = editingItem.kelas || 'Bin Nadzori';

    if (!subKat.includes('&')) {
      if (editingItem.kategoriUtama === 'BIL_GHOIB') {
        subKat = 'Bil Ghoib';
        kls = 'Bil Ghoib';
      } else if (editingItem.kategoriUtama === 'TAMATAN') {
        subKat = `Tamatan (${editingItem.bagianTamatan || 'A.01'})`;
        kls = `3 ALY ${editingItem.bagianTamatan || 'A.01'}`;
      } else {
        subKat = 'Bin Nadzori';
        kls = 'Bin Nadzori';
      }
    }

    const resolvedKatUtama = resolvePriorityKategoriUtama(editingItem.kategoriUtama, subKat);
    const resolvedKuota = Math.max(
      Number(editingItem.kuotaDasar || 0),
      calculateKuotaDasarSantri(resolvedKatUtama, subKat)
    );
    const resolvedWarna = getWarnaTiketSantri(resolvedKatUtama, subKat);

    try {
      const { error } = await supabase
        .from('peserta_santri')
        .update({
          nama: (editingItem.nama || '').trim().toUpperCase(),
          kategori_utama: resolvedKatUtama,
          sub_kategori: subKat,
          kelas: kls,
          nama_wali: (editingItem.namaWali || '').trim().toUpperCase() || '-',
          no_hp: (editingItem.noHp || '').trim() || '-',
          alamat: (editingItem.alamat || '').trim().toUpperCase() || 'KEDIRI',
          kamar: (editingItem.kamar || '').trim() || '-',
          kuota_dasar: resolvedKuota,
          warna_tiket: resolvedWarna,
        })
        .eq('kode', targetKode);

      if (error) {
        console.error('Supabase update error (peserta_santri):', error);
        alert(`Gagal memperbarui data santri di Supabase: ${error.message}`);
        return;
      }
    } catch (err: any) {
      console.error('Exception updating peserta_santri:', err);
      alert(`Terjadi kesalahan saat menyimpan: ${err.message || err}`);
      submitLockSantri.current = false;
      setIsSubmittingSantri(false);
      return;
    }

    store.editPeserta(targetKode, {
      nama: editingItem.nama?.trim().toUpperCase(),
      namaWali: editingItem.namaWali?.trim().toUpperCase(),
      noHp: editingItem.noHp?.trim(),
      alamat: editingItem.alamat?.trim().toUpperCase(),
      kamar: editingItem.kamar?.trim(),
      kategoriUtama: editingItem.kategoriUtama,
      subKategori: subKat,
      kelas: kls,
      kuotaDasar: Number(editingItem.kuotaDasar || 4),
    });

    logAudit({
      panitia_id: 'ADMIN_SEKRETARIAT',
      panitia_role: 'ADMIN',
      aksi: 'EDIT_PESERTA',
      tabel: 'peserta_santri',
      kode: targetKode,
      nama: editingItem.nama,
      field: 'edit_santri',
      nilai_baru: JSON.stringify(editingItem),
      detail: editingItem,
      catatan: `Perubahan Data Santri (${targetKode})`,
    }).catch((err) => console.warn('Audit log error:', err));

    onEditSuccess(`✓ Perubahan data santri ${targetKode} berhasil disimpan!`);
    setEditingItem(null);
    submitLockSantri.current = false;
    setIsSubmittingSantri(false);
  };

  return {
    formData,
    setFormData,
    isSubmittingSantri,
    editModalTab,
    setEditModalTab,
    itemAuditHistory,
    loadingAuditHistory,
    isEditingSantri,
    handleTambahPeserta,
    handleSaveEdit,
  };
}
