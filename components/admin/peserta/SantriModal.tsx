'use client';

import React from 'react';
import { Plus, Edit, X, History, Loader2 } from 'lucide-react';
import { useSantriForm } from '@/lib/hooks/useSantriForm';
import { KELAS_BIN_NADZOR_LIST } from '@/lib/types';
import SantriBiodataTab from './modal/SantriBiodataTab';
import SantriKuotaTab from './modal/SantriKuotaTab';
import SantriAuditHistoryTab from './modal/SantriAuditHistoryTab';

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
  const {
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
  } = useSantriForm({
    editingItem,
    setEditingItem,
    setShowAddModal,
    onAddSuccess,
    onEditSuccess,
  });

  return (
    <>
      {/* ========================================================================= */}
      {/* MODAL 1: TAMBAH SANTRI BARU */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in">
          <div className="bg-[#F0F9FF]/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl max-w-xl w-full max-h-[92dvh] flex flex-col shadow-2xl border border-white/60 overflow-hidden">
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
              {/* Kategori & Bagian Tamatan Tab */}
              <SantriKuotaTab
                kategoriUtama={formData.kategoriUtama}
                onKategoriUtamaChange={(kat) => setFormData({ ...formData, kategoriUtama: kat })}
                bagianTamatan={formData.bagianTamatan}
                onBagianTamatanChange={(bg) => setFormData({ ...formData, bagianTamatan: bg })}
                isEditMode={false}
              />

              {/* Biodata Fields Tab */}
              <SantriBiodataTab
                nama={formData.nama}
                onNamaChange={(val) => setFormData({ ...formData, nama: val })}
                kamar={formData.kamar}
                onKamarChange={(val) => setFormData({ ...formData, kamar: val })}
                kelas={formData.kelas}
                onKelasChange={(val) => setFormData({ ...formData, kelas: val })}
                kategoriUtama={formData.kategoriUtama}
                namaWali={formData.namaWali}
                onNamaWaliChange={(val) => setFormData({ ...formData, namaWali: val })}
                noHp={formData.noHp}
                onNoHpChange={(val) => setFormData({ ...formData, noHp: val })}
                alamat={formData.alamat}
                onAlamatChange={(val) => setFormData({ ...formData, alamat: val })}
              />

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
          <div className="bg-[#F0F9FF]/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl max-w-full md:max-w-2xl lg:max-w-3xl w-full max-h-[92dvh] flex flex-col shadow-2xl border border-white/60 overflow-hidden">
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
            <div className="flex border-b border-blue-900/10 bg-sky-50/50 backdrop-blur-xs px-4 pt-2 gap-2 text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => setEditModalTab('FORM')}
                className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
                  editModalTab === 'FORM'
                    ? 'border-[#1D4ED8] text-[#0F2C59]'
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
                    ? 'border-[#1D4ED8] text-[#0F2C59]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Riwayat Audit ({itemAuditHistory.length})</span>
              </button>
            </div>

            {editModalTab === 'FORM' ? (
              <form onSubmit={handleSaveEdit} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
                {/* Biodata & Kuota Components for Edit */}
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

                <SantriKuotaTab
                  kategoriUtama={editingItem.kategoriUtama}
                  onKategoriUtamaChange={(kat) => setEditingItem({ ...editingItem, kategoriUtama: kat })}
                  bagianTamatan={editingItem.bagianTamatan}
                  onBagianTamatanChange={(bg) => setEditingItem({ ...editingItem, bagianTamatan: bg })}
                  kuotaDasar={editingItem.kuotaDasar}
                  onKuotaDasarChange={(val) => setEditingItem({ ...editingItem, kuotaDasar: val })}
                  isEditMode={true}
                />

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
                    <label className="block font-bold text-slate-700 mb-1">Nama Wali</label>
                    <input
                      type="text"
                      value={editingItem.namaWali}
                      onChange={(e) => setEditingItem({ ...editingItem, namaWali: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 uppercase"
                    />
                  </div>
                </div>

                {editingItem.kategoriUtama === 'BIN_NADZOR' && (
                  <div className="animate-in fade-in">
                    <label className="block font-bold text-slate-700 mb-1">Kelas *</label>
                    <select
                      value={editingItem.kelas || '2 Tsanawiyah'}
                      onChange={(e) => setEditingItem({ ...editingItem, kelas: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-opera-700 font-semibold text-slate-800"
                    >
                      {KELAS_BIN_NADZOR_LIST.map((kls) => (
                        <option key={kls} value={kls}>
                          {kls}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">No. WhatsApp</label>
                    <input
                      type="text"
                      value={editingItem.noHp}
                      onChange={(e) => setEditingItem({ ...editingItem, noHp: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-mono"
                    />
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
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    disabled={isSubmittingSantri}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingSantri}
                    className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingSantri ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin shrink-0 text-white" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      'Simpan Perubahan'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 sm:p-6 space-y-3 text-xs overflow-y-auto flex-1 bg-sky-50/20">
                <SantriAuditHistoryTab
                  loading={loadingAuditHistory}
                  history={itemAuditHistory}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
