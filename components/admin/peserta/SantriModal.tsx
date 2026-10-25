'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, X, History, Loader2 } from 'lucide-react';
import { store } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/audit-log';
import { BAGIAN_TAMATAN_LIST, getWarnaTiketSantri } from '@/lib/types';

export interface SantriModalProps {
  showAddModal: boolean;
  setShowAddModal: (show: boolean) => void;
  editingItem: any | null;
  setEditingItem: (item: any | null) => void;
  onAddSuccess: (newSantriItem: any, message: string) => void;
  onEditSuccess: (message: string) => Promise<void> | void;
}

export default function SantriModal({
  showAddModal,
  setShowAddModal,
  editingItem,
  setEditingItem,
  onAddSuccess,
  onEditSuccess,
}: SantriModalProps) {
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

  // Handler Tambah Santri Baru (Direct Supabase .insert() + Optimistic UI)
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

    const kodeBaru = 'SH' + Math.floor(1000 + Math.random() * 9000);
    const subKat =
      formData.kategoriUtama === 'TAMATAN'
        ? formData.bagianTamatan
        : formData.kategoriUtama === 'BIL_GHOIB'
        ? 'Bil Ghoib'
        : 'Bin Nadzori';

    const kuotaVal = Number(formData.kategoriUtama === 'BIL_GHOIB' ? 4 : 2);
    const warna = getWarnaTiketSantri(formData.kategoriUtama, subKat);

    try {
      const { data, error } = await supabase.from('peserta_santri').insert([
        {
          kode: kodeBaru,
          nama: formData.nama.trim().toUpperCase(),
          kategori_utama: formData.kategoriUtama || 'BIL_GHOIB',
          sub_kategori: subKat || 'Bil Ghoib',
          kelas: formData.kategoriUtama || '-',
          kamar: formData.kamar.trim() || '-',
          nama_wali: formData.namaWali.trim().toUpperCase() || '-',
          no_hp: formData.noHp.trim() || '-',
          alamat: formData.alamat.trim().toUpperCase() || 'Kediri',
          kuota_dasar: kuotaVal,
          warna_tiket: warna,
        },
      ]);

      if (error) {
        alert(`Gagal menambahkan data santri ke database Supabase: ${error.message}`);
        return;
      }

      // Optimistic UI: Buat item baru dan sisipkan ke state keluargaList seketika
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
            nama: formData.nama.trim().toUpperCase(),
            kelas: formData.kategoriUtama || '-',
            kategoriUtama: formData.kategoriUtama || 'BIL_GHOIB',
            subKategori: subKat || 'Bil Ghoib',
            bagianTamatan: subKat || 'A.01',
          },
        ],
        kuota: {
          id: kodeBaru,
          kodeQr: kodeBaru,
          kuotaDasar: kuotaVal,
          kuotaTambahan: 0,
          terpakai: 0,
          tiketPanggungJatah: 0,
          warnaTiket: warna,
        },
      };

      store.tambahPeserta({
        nama: formData.nama.trim().toUpperCase(),
        kategoriUtama: formData.kategoriUtama,
        bagianTamatan: formData.kategoriUtama === 'TAMATAN' ? formData.bagianTamatan : undefined,
        kamar: formData.kamar.trim(),
        namaWali: formData.namaWali.trim().toUpperCase(),
        noHp: formData.noHp.trim(),
        alamat: formData.alamat.trim().toUpperCase(),
      });

      // Tutup modal SEGERA & tampilkan toast sukses (< 500ms)
      setShowAddModal(false);
      onAddSuccess(
        newSantriItem,
        `✓ Berhasil menambahkan santri baru ke database: ${formData.nama} (Kode: ${kodeBaru})`
      );

      // logAudit fire-and-forget (tanpa await yang memblokir UI)
      logAudit({
        panitia_id: 'ADMIN_SEKRETARIAT',
        panitia_role: 'ADMIN',
        aksi: 'TAMBAH_PESERTA',
        tabel: 'peserta_santri',
        kode: kodeBaru,
        nama: formData.nama.trim().toUpperCase(),
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
    if (!editingItem || editingItem.tipe !== 'SANTRI') return;

    const targetKode = editingItem.kode;

    let subKat = 'Bin Nadzori';
    let kls = 'Bin Nadzori';
    if (editingItem.kategoriUtama === 'BIL_GHOIB') {
      subKat = 'Bil Ghoib';
      kls = 'Bil Ghoib';
    } else if (editingItem.kategoriUtama === 'TAMATAN') {
      subKat = `3 ALY ${editingItem.bagianTamatan || 'A.01'}`;
      kls = `3 ALY ${editingItem.bagianTamatan || 'A.01'}`;
    }

    try {
      const { error } = await supabase
        .from('peserta_santri')
        .update({
          nama: (editingItem.nama || '').trim().toUpperCase(),
          kategori_utama: editingItem.kategoriUtama || 'BIL_GHOIB',
          sub_kategori: subKat,
          kelas: kls,
          nama_wali: (editingItem.namaWali || '').trim().toUpperCase() || '-',
          no_hp: (editingItem.noHp || '').trim() || '-',
          alamat: (editingItem.alamat || '').trim().toUpperCase() || 'KEDIRI',
          kamar: (editingItem.kamar || '').trim() || '-',
          kuota_dasar: Number(editingItem.kuotaDasar || 4),
          warna_tiket: getWarnaTiketSantri(editingItem.kategoriUtama, subKat),
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
      return;
    }

    // Sync store
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

    await logAudit({
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
    });

    await onEditSuccess(`✓ Perubahan data santri ${targetKode} berhasil disimpan!`);
    setEditingItem(null);
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* MODAL 1: TAMBAH SANTRI BARU (Disesuaikan tanpa Sub-Kategori / Juz) */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full max-h-[92dvh] flex flex-col shadow-2xl border-2 border-opera-800 overflow-hidden">
            <div className="bg-gradient-to-r from-opera-950 to-opera-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-gold-500/40 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-gold-500/20 border border-gold-500/50 flex items-center justify-center text-gold-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-base text-gold-300">
                    Tambah Santri Peserta Baru
                  </h3>
                  <p className="text-[11px] text-opera-200">
                    Pilih kategori santri (Bil Ghoib, Bin Nadzor, atau Tamatan)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-opera-200 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTambahPeserta} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Kategori Utama */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kategori Utama Santri *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        kategoriUtama: 'BIL_GHOIB',
                      })
                    }
                    className={`py-2 px-3 rounded-xl font-bold border transition-all text-center ${
                      formData.kategoriUtama === 'BIL_GHOIB'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow'
                        : 'bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    Bil Ghoib
                    <span className="block text-[10px] font-normal opacity-80">
                      4 Kursi · Hitam Gold
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        kategoriUtama: 'BIN_NADZOR',
                      })
                    }
                    className={`py-2 px-3 rounded-xl font-bold border transition-all text-center ${
                      formData.kategoriUtama === 'BIN_NADZOR'
                        ? 'bg-blue-700 text-white border-blue-800 shadow'
                        : 'bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    Bin Nadzori
                    <span className="block text-[10px] font-normal opacity-80">
                      2 Kursi · Merah Gold
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        kategoriUtama: 'TAMATAN',
                      })
                    }
                    className={`py-2 px-3 rounded-xl font-bold border transition-all text-center ${
                      formData.kategoriUtama === 'TAMATAN'
                        ? 'bg-amber-600 text-white border-amber-700 shadow'
                        : 'bg-slate-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    Tamatan
                    <span className="block text-[10px] font-normal opacity-80">
                      2 Kursi · Merah Gold
                    </span>
                  </button>
                </div>
              </div>

              {/* Opsi Khusus Tamatan: Bagian A.01, A.02, A.03, A.04, B.01, B.02, B.03 */}
              {formData.kategoriUtama === 'TAMATAN' && (
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-300 space-y-1.5 animate-in fade-in">
                  <label className="block font-bold text-amber-950">
                    Pilih Bagian Tamatan *
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                    {BAGIAN_TAMATAN_LIST.map((bg) => (
                      <button
                        key={bg}
                        type="button"
                        onClick={() => setFormData({ ...formData, bagianTamatan: bg })}
                        className={`py-1.5 px-2 rounded-lg font-bold text-center text-xs transition-all ${
                          formData.bagianTamatan === bg
                            ? 'bg-amber-600 text-white shadow'
                            : 'bg-white text-amber-900 border border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {bg}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Nama Lengkap Santri */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap Santriwati *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder=""
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 uppercase font-semibold"
                />
              </div>

              {/* Kamar Pondok */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kamar Pondok</label>
                <input
                  type="text"
                  value={formData.kamar}
                  onChange={(e) => setFormData({ ...formData, kamar: e.target.value })}
                  placeholder=""
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700"
                />
              </div>

              {/* Nama Wali & No WhatsApp */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Wali Santri *</label>
                  <input
                    type="text"
                    required
                    value={formData.namaWali}
                    onChange={(e) => setFormData({ ...formData, namaWali: e.target.value })}
                    placeholder=""
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. WhatsApp Wali</label>
                  <input
                    type="text"
                    value={formData.noHp}
                    onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                    placeholder=""
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-mono"
                  />
                </div>
              </div>

              {/* Alamat / Asal Kota */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat / Asal Kota</label>
                <input
                  type="text"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  placeholder=""
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 uppercase"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmittingSantri}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSantri}
                  className="px-6 py-2.5 rounded-xl bg-opera-850 hover:bg-opera-900 text-gold-300 font-serif font-black shadow border border-gold-500/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingSantri ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-gold-300 shrink-0" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    'Simpan Santri Baru'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3 (SANTRI): EDIT PESERTA SANTRI */}
      {/* ========================================================================= */}
      {isEditingSantri && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-full md:max-w-2xl lg:max-w-3xl w-full max-h-[92dvh] flex flex-col shadow-2xl border-2 border-opera-800 overflow-hidden">
            <div className="bg-gradient-to-r from-opera-950 to-opera-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-gold-500/40 shrink-0">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/50 flex items-center justify-center text-blue-300 shrink-0">
                  <Edit className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif font-black text-sm sm:text-base text-gold-300 truncate">
                    Edit Peserta: {editingItem.kode}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-opera-200 truncate">
                    Perbarui rincian santri dan wali
                  </p>
                </div>
              </div>
              <button onClick={() => setEditingItem(null)} className="text-opera-200 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB NAVIGASI EDIT MODAL */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => setEditModalTab('FORM')}
                className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
                  editModalTab === 'FORM'
                    ? 'border-[#8C6A47] text-[#422F21]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                📝 Form Edit Data
              </button>
              <button
                type="button"
                onClick={() => setEditModalTab('RIWAYAT')}
                className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  editModalTab === 'RIWAYAT'
                    ? 'border-[#8C6A47] text-[#422F21]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Riwayat Audit ({itemAuditHistory.length})</span>
              </button>
            </div>

            {editModalTab === 'FORM' ? (
              <form onSubmit={handleSaveEdit} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Santri *</label>
                  <input
                    type="text"
                    required
                    value={editingItem.nama}
                    onChange={(e) => setEditingItem({ ...editingItem, nama: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 uppercase font-semibold"
                  />
                </div>

                {/* Kategori Utama Switcher */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Santri</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['BIL_GHOIB', 'BIN_NADZOR', 'TAMATAN'] as const).map((kat) => (
                      <button
                        key={kat}
                        type="button"
                        onClick={() => setEditingItem({ ...editingItem, kategoriUtama: kat })}
                        className={`py-2 px-2.5 rounded-xl font-bold text-xs border transition-all ${
                          editingItem.kategoriUtama === kat
                            ? kat === 'BIL_GHOIB'
                              ? 'bg-emerald-700 text-white border-emerald-800'
                              : kat === 'BIN_NADZOR'
                              ? 'bg-blue-700 text-white border-blue-800'
                              : 'bg-amber-600 text-white border-amber-700'
                            : 'bg-slate-50 text-slate-700 border-slate-300'
                        }`}
                      >
                        {kat === 'BIL_GHOIB' ? 'Bil Ghoib' : kat === 'BIN_NADZOR' ? 'Bin Nadzori' : 'Tamatan'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Jika Tamatan, Pilih Bagian */}
                {editingItem.kategoriUtama === 'TAMATAN' && (
                  <div>
                    <label className="block font-bold text-amber-950 mb-1">Bagian Tamatan *</label>
                    <select
                      value={editingItem.bagianTamatan || 'A.01'}
                      onChange={(e) => setEditingItem({ ...editingItem, bagianTamatan: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-950 font-bold focus:outline-none focus:ring-2 focus:ring-amber-600"
                    >
                      {BAGIAN_TAMATAN_LIST.map((bg) => (
                        <option key={bg} value={bg}>
                          Bagian {bg}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kamar Pondok</label>
                    <input
                      type="text"
                      value={editingItem.kamar}
                      onChange={(e) => setEditingItem({ ...editingItem, kamar: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kuota Dasar Kursi</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={editingItem.kuotaDasar}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, kuotaDasar: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Wali</label>
                    <input
                      type="text"
                      value={editingItem.namaWali}
                      onChange={(e) => setEditingItem({ ...editingItem, namaWali: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">No. WhatsApp</label>
                    <input
                      type="text"
                      value={editingItem.noHp}
                      onChange={(e) => setEditingItem({ ...editingItem, noHp: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Alamat / Asal Kota</label>
                  <input
                    type="text"
                    value={editingItem.alamat}
                    onChange={(e) => setEditingItem({ ...editingItem, alamat: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 uppercase"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold shadow"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 sm:p-6 space-y-3 text-xs overflow-y-auto flex-1 bg-stone-50">
                {loadingAuditHistory ? (
                  <div className="py-12 text-center text-stone-500 font-medium">
                    Memuat riwayat audit...
                  </div>
                ) : itemAuditHistory.length === 0 ? (
                  <div className="py-12 text-center text-stone-500">
                    <History className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    <p className="font-bold">Belum Ada Riwayat Audit</p>
                    <p className="text-[11px] text-stone-400 mt-1">
                      Setiap aksi perubahan data pada peserta ini akan otomatis tercatat di sini.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {itemAuditHistory.map((log) => {
                      const dtStr = log.created_at
                        ? new Date(log.created_at).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'Asia/Jakarta',
                          })
                        : '-';
                      return (
                        <div
                          key={log.id}
                          className="p-3.5 rounded-xl bg-white border border-stone-200 shadow-2xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] bg-amber-100 text-amber-900 border border-amber-300">
                              {log.aksi}
                            </span>
                            <span className="text-[10px] text-stone-400 font-mono">{dtStr} WIB</span>
                          </div>
                          <div className="text-xs font-semibold text-[#422F21]">
                            Oleh: <span className="font-bold text-[#8C6A47]">{log.panitia_id || 'SYSTEM'}</span> ({log.panitia_role || 'PANITIA'})
                          </div>
                          {log.catatan && (
                            <div className="text-[11px] text-stone-600 italic">
                              "{log.catatan}"
                            </div>
                          )}
                          {(log.nilai_lama || log.nilai_baru) && (
                            <div className="text-[11px] font-mono bg-stone-50 p-2 rounded-lg border border-stone-200 text-stone-700 overflow-x-auto">
                              {log.field && <span className="font-bold text-[#8C6A47]">{log.field}: </span>}
                              {log.nilai_lama && <span className="line-through text-rose-600 mr-2">{log.nilai_lama}</span>}
                              {log.nilai_baru && <span className="text-emerald-700 font-bold">{log.nilai_baru}</span>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
