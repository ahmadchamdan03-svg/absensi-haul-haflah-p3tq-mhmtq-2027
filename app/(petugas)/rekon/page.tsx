'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/audit-log';
import { getWarnaTiketUndangan, getDefaultJalurMasuk } from '@/lib/types';
import { syncKuotaTerpakai, upsertPresensiLog } from '@/lib/presensi-helper';
import { generateRandomKode, generateUniqueKodeFromDb } from '@/lib/utils';
import AuthGuard from '@/components/AuthGuard';
import RekonHeaderAndStats from '@/components/petugas/rekon/RekonHeaderAndStats';
import RekonTableSection from '@/components/petugas/rekon/RekonTableSection';
import RekonModals from '@/components/petugas/rekon/RekonModals';
import {
  ToastMessage,
  WalkinFormState,
  INITIAL_WALKIN_FORM,
  filterRekonSearchResults,
  buildEditingItemState,
  buildEditPayload,
} from '@/components/petugas/rekon/types';

export default function RekonPage() {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [santriList, setSantriList] = useState<any[]>([]);
  const [tamuList, setTamuList] = useState<any[]>([]);
  const [toastMsg, setToastMsg] = useState<ToastMessage | null>(null);

  // Modal State
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [savingWalkin, setSavingWalkin] = useState(false);

  // Walk-in Form State
  const [walkinForm, setWalkinForm] = useState<WalkinFormState>(INITIAL_WALKIN_FORM);

  // Fetch Live Data & Realtime Subscription
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [resSantri, resTamu] = await Promise.all([
        supabase.from('peserta_santri').select('*').order('created_at', { ascending: false }),
        supabase.from('tamu_undangan').select('*').order('created_at', { ascending: false }),
      ]);

      if (resSantri.data) setSantriList(resSantri.data);
      if (resTamu.data) setTamuList(resTamu.data);
    } catch (e) {
      console.warn('Error fetching rekon data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    // Supabase Realtime Subscription
    const channel = supabase
      .channel('rekon_realtime_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'peserta_santri' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tamu_undangan' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presensi_log' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pembelian_kuota' }, fetchAllData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const showToast = (text: string, tipe: 'success' | 'error' = 'success') => {
    setToastMsg({ tipe, text });
    setTimeout(() => setToastMsg(null), 6000);
  };

  // Filter Hasil Pencarian
  const searchResults = useMemo(() => {
    return filterRekonSearchResults(keyword, santriList, tamuList);
  }, [keyword, santriList, tamuList]);

  // Listener tombol ESC untuk menutup modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingItem) setEditingItem(null);
        if (showWalkinModal) setShowWalkinModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingItem, showWalkinModal]);

  // Quick Action: Tandai Hadir / Batalkan Hadir
  const handleToggleHadir = async (item: any) => {
    const isSantri = item.tipe === 'SANTRI';
    const d = item.data;
    const currentTerpakai = Number(d.kuota_terpakai || 0);

    const isHadir = currentTerpakai > 0;
    const targetTable = isSantri ? 'peserta_santri' : 'tamu_undangan';

    try {
      if (isHadir) {
        // Batalkan Hadir (Hapus SEMUA baris presensi_log untuk kode_qr ini tanpa limit 1)
        const { error: delErr } = await supabase
          .from('presensi_log')
          .delete()
          .eq('kode_qr', d.kode);

        if (delErr) throw delErr;

        // Reset kuota_terpakai = 0 di database via helper
        await syncKuotaTerpakai(d.kode);

        // Log audit BATALKAN_HADIR
        await logAudit({
          panitia_id: 'PANITIA_REKONSILIASI',
          panitia_role: 'PENERIMA_TAMU',
          aksi: 'BATALKAN_HADIR',
          tabel: targetTable,
          kode: d.kode,
          nama: d.nama || d.kode,
          field: 'kuota_terpakai',
          nilai_lama: String(currentTerpakai),
          nilai_baru: '0',
          catatan: 'Pembatalan Kehadiran via Meja Rekonsiliasi',
        });

        showToast(`✓ Berhasil membatalkan kehadiran untuk ${d.nama || d.kode}. (kuota_terpakai reset ke 0).`);
      } else {
        // Tandai Hadir (Upsert ke presensi_log & sync kuota_terpakai)
        await upsertPresensiLog({
          kode_qr: d.kode,
          nama_peserta: d.nama,
          tipe_peserta: isSantri ? 'KELUARGA' : 'UNDANGAN',
          jalur: d.jalur_masuk || 'MEJA_REKONSILIASI',
          panitia_id: 'panitia-rekonsiliasi',
          jumlah_l: 1,
          jumlah_p: 0,
          catatan: 'Hadir via Meja Rekonsiliasi',
        });

        // Log audit TANDAI_HADIR
        await logAudit({
          panitia_id: 'PANITIA_REKONSILIASI',
          panitia_role: 'PENERIMA_TAMU',
          aksi: 'TANDAI_HADIR',
          tabel: targetTable,
          kode: d.kode,
          nama: d.nama || d.kode,
          field: 'kuota_terpakai',
          nilai_lama: '0',
          nilai_baru: '1',
          catatan: 'Tandai Hadir Manual via Meja Rekonsiliasi',
        });

        showToast(`✓ Berhasil menandai HADIR untuk ${d.nama || d.kode}.`);
      }

      await fetchAllData();
    } catch (err: any) {
      console.error('Error toggling hadir:', err);
      showToast(`Gagal memperbarui status kehadiran: ${err.message || err}`, 'error');
    }
  };

  // Open Edit Modal (Edit Lengkap)
  const handleOpenEdit = async (item: any) => {
    const d = item.data;

    // Fetch existing presensi_log untuk hitung awal L & P
    const { data: pLogs } = await supabase
      .from('presensi_log')
      .select('jumlah_l, jumlah_p')
      .eq('kode_qr', d.kode);

    setEditingItem(buildEditingItemState(item, pLogs));
  };

  // Save Edit Lengkap to Supabase
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const confirmSave = confirm(
      `Anda akan mengubah data "${editingItem.nama || editingItem.kode}" (${editingItem.kode}).\nPerubahan langsung tersinkron ke seluruh sistem. Lanjutkan?`
    );
    if (!confirmSave) return;

    setSavingEdit(true);

    const isSantri = editingItem.tipe === 'SANTRI';
    const targetTable = isSantri ? 'peserta_santri' : 'tamu_undangan';

    try {
      // 1. Fetch data LAMA (before) dari Supabase sebelum update
      const { data: beforeData } = await supabase
        .from(targetTable)
        .select('*')
        .eq('kode', editingItem.kode)
        .single();

      const { payload, totalPresensiInput } = buildEditPayload(editingItem);

      // 2. Perform update ke Supabase
      const { error } = await supabase
        .from(targetTable)
        .update(payload)
        .eq('kode', editingItem.kode);

      if (error) {
        console.error('Error updating rekon data in Supabase:', error);
        alert(`Gagal memperbarui data: ${error.message} (Kode: ${error.code || 'PGRST'})`);
        return;
      }

      // FIX 6: Upsert presensi_log berdasar Section 3 stepper (L & P)
      if (totalPresensiInput > 0) {
        await upsertPresensiLog({
          kode_qr: editingItem.kode,
          nama_peserta: editingItem.nama,
          tipe_peserta: isSantri ? 'KELUARGA' : 'UNDANGAN',
          jalur: editingItem.jalurMasuk || 'MEJA_REKONSILIASI',
          panitia_id: 'panitia-rekonsiliasi',
          jumlah_l: Number(editingItem.presensiL || 0),
          jumlah_p: Number(editingItem.presensiP || 0),
          catatan: 'Update via Modal Edit Rekonsiliasi',
        });
      } else {
        // Jika diset 0, hapus presensi_log dan sync
        await supabase.from('presensi_log').delete().eq('kode_qr', editingItem.kode);
        await syncKuotaTerpakai(editingItem.kode);
      }

      // Fix 7 & 14: Sinkronisasi pengurangan kuota_tambahan ke pembelian_kuota & audit_log
      if (isSantri && beforeData && payload.kuota_tambahan < Number(beforeData.kuota_tambahan || 0)) {
        const pengurangan = Number(beforeData.kuota_tambahan || 0) - payload.kuota_tambahan;
        let sisaKurang = pengurangan;

        const { data: activePurchases } = await supabase
          .from('pembelian_kuota')
          .select('*')
          .eq('kode_santri', editingItem.kode)
          .eq('status', 'DIVERIFIKASI')
          .order('created_at', { ascending: false });

        if (activePurchases && activePurchases.length > 0) {
          for (const purchase of activePurchases) {
            if (sisaKurang <= 0) break;
            const jKursi = Number(purchase.jumlah_kursi || 0);
            await supabase
              .from('pembelian_kuota')
              .update({ status: 'DIHAPUS', updated_at: new Date().toISOString() })
              .eq('id', purchase.id);

            await logAudit({
              panitia_id: 'PANITIA_REKONSILIASI',
              panitia_role: 'PENERIMA_TAMU',
              aksi: 'HAPUS_KUOTA_TAMBAHAN',
              tabel: 'pembelian_kuota',
              kode: editingItem.kode,
              nama: editingItem.nama,
              field: 'status',
              nilai_lama: 'DIVERIFIKASI',
              nilai_baru: 'DIHAPUS',
              catatan: `Pengurangan kuota tambahan via Rekonsiliasi (Order: ${purchase.id_pesanan || purchase.id}, -${jKursi} kursi)`,
            });

            sisaKurang -= jKursi;
          }
        }
      }

      // Audit Log
      await logAudit({
        panitia_id: 'PANITIA_REKONSILIASI',
        panitia_role: 'PENERIMA_TAMU',
        aksi: isSantri ? 'EDIT_PESERTA' : 'EDIT_TAMU',
        tabel: targetTable,
        kode: editingItem.kode,
        nama: editingItem.nama,
        field: 'edit_lengkap',
        nilai_lama: JSON.stringify(beforeData || {}),
        nilai_baru: JSON.stringify(payload),
        catatan: editingItem.catatanKonfirmasi ? editingItem.catatanKonfirmasi.trim() : `Koreksi Data ${isSantri ? 'Santri' : 'Tamu'} via Meja Rekonsiliasi`,
      });

      showToast(`✓ Perubahan data "${editingItem.nama}" (${editingItem.kode}) berhasil disimpan & tersinkron ke seluruh sistem.`);
      setEditingItem(null);
      await fetchAllData();
    } catch (err: any) {
      console.error('Error saving edit:', err);
      showToast(`Gagal menyimpan perubahan: ${err.message || err}`, 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle Tamu Walk-in Baru (FIX 2)
  const handleSaveWalkin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWalkin(true);

    let finalNama = '';
    const p = walkinForm.namaPutra.trim().toUpperCase();
    const w = walkinForm.namaPutri.trim().toUpperCase();

    if (walkinForm.golongan === 'ISTIMEWA') {
      if (!p && !w) {
        showToast('Isi minimal salah satu: Nama Putra atau Nama Putri!', 'error');
        setSavingWalkin(false);
        return;
      }
      finalNama = p && w ? `${p} & ${w}` : p || w;
    } else {
      if (!walkinForm.nama.trim() && !p && !w) {
        showToast('Nama Tamu Walk-in wajib diisi!', 'error');
        setSavingWalkin(false);
        return;
      }
      finalNama = walkinForm.nama.trim().toUpperCase() || (p && w ? `${p} & ${w}` : p || w);
    }

    try {
      let newKode = generateRandomKode('UND');
      newKode = await generateUniqueKodeFromDb('UND', 'tamu_undangan', supabase);
      // FIX 2: Payload HANYA kolom resmi tabel tamu_undangan (TANPA kuota_dasar / kuota_tambahan)
      const payload = {
        kode: newKode,
        nama: finalNama,
        nama_putra: p || null,
        nama_putri: w || null,
        instansi: walkinForm.instansi.trim() || walkinForm.alamat.trim() || '-',
        alamat: walkinForm.alamat.trim() || '-',
        kategori: walkinForm.kategori.trim() || 'Tamu Walk-in',
        sub_kategori: walkinForm.golongan,
        no_hp: walkinForm.noHp.trim() || '-',
        kuota_terpakai: walkinForm.langsungCheckin ? 1 : 0,
        status_konfirmasi: 'BELUM',
        warna_tiket: getWarnaTiketUndangan(walkinForm.golongan, walkinForm.kategori),
        jalur_masuk: walkinForm.jalurMasuk.trim() || getDefaultJalurMasuk(walkinForm.golongan),
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('tamu_undangan').insert([payload]);
      if (error) {
        alert(`Gagal mendaftarkan walk-in: ${error.message} (Kode: ${error.code || 'PGRST'})`);
        throw error;
      }

      if (walkinForm.langsungCheckin) {
        await upsertPresensiLog({
          kode_qr: newKode,
          nama_peserta: finalNama,
          tipe_peserta: 'UNDANGAN',
          jalur: walkinForm.jalurMasuk,
          panitia_id: 'panitia-rekonsiliasi',
          jumlah_l: 1,
          jumlah_p: 0,
          catatan: 'Walk-in Langsung Hadir',
        });
      }

      await logAudit({
        panitia_id: 'PANITIA_REKONSILIASI',
        panitia_role: 'PENERIMA_TAMU',
        aksi: 'TAMBAH_TAMU',
        tabel: 'tamu_undangan',
        kode: newKode,
        nama: finalNama,
        field: 'tamu_walkin_baru',
        nilai_baru: JSON.stringify(payload),
        detail: payload,
        catatan: `Registrasi Tamu Walk-in ${walkinForm.langsungCheckin ? '(Langsung Hadir)' : ''}`,
      });

      showToast(`✓ Berhasil mendaftarkan Tamu Walk-in: ${finalNama} (${newKode}) ${walkinForm.langsungCheckin ? '· Langsung Hadir' : ''}.`);
      setShowWalkinModal(false);
      setWalkinForm(INITIAL_WALKIN_FORM);

      await fetchAllData();
    } catch (err: any) {
      console.error('Error adding walk-in:', err);
      showToast(`Gagal mendaftarkan walk-in: ${err.message || err}`, 'error');
    } finally {
      setSavingWalkin(false);
    }
  };

  return (
    <AuthGuard allowedRoles={['ADMIN', 'PENJAGA_GERBANG']}>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 text-[#422F21]">
        <RekonHeaderAndStats
          loading={loading}
          toastMsg={toastMsg}
          keyword={keyword}
          setKeyword={setKeyword}
          onOpenWalkinModal={() => setShowWalkinModal(true)}
          onRefresh={fetchAllData}
        />

        <RekonTableSection
          keyword={keyword}
          searchResults={searchResults}
          onToggleHadir={handleToggleHadir}
          onOpenEdit={handleOpenEdit}
        />

        <RekonModals
          editingItem={editingItem}
          setEditingItem={setEditingItem}
          savingEdit={savingEdit}
          onSaveEdit={handleSaveEdit}
          showWalkinModal={showWalkinModal}
          setShowWalkinModal={setShowWalkinModal}
          walkinForm={walkinForm}
          setWalkinForm={setWalkinForm}
          savingWalkin={savingWalkin}
          onSaveWalkin={handleSaveWalkin}
        />
      </div>
    </AuthGuard>
  );
}
