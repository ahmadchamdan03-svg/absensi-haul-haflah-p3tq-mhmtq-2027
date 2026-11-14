'use client';

import React from 'react';
import { Plus, Edit, X, History, Loader2 } from 'lucide-react';
import ModalPortal from '@/components/ui/ModalPortal';
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
    formErrors,
    setFormErrors,
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
      <ModalPortal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        disableClose={isSubmittingSantri}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-tambah-santri-title"
          className="bg-[#F0F9FF]/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[calc(100dvh-3rem)] sm:max-h-[calc(100dvh-5rem)] flex flex-col shadow-2xl border border-white/60 overflow-hidden"
        >
            <div className="bg-gradient-to-r from-opera-950 to-opera-900 text-white px-6 py-4 sm:px-8 sm:py-5 flex items-center justify-between gap-3 border-b border-gold-500/40 shrink-0">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gold-500/20 border border-gold-500/50 flex items-center justify-center text-gold-400 shrink-0">
                  <Plus className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h3 id="modal-tambah-santri-title" className="font-serif font-black text-base text-gold-300">
                    Tambah Santri Peserta Baru
                  </h3>
                  <p className="text-[11px] text-opera-200">
                    Pilih kategori santri (Bil Ghoib, Bin Nadzor, atau Tamatan)
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Tutup modal"
                onClick={() => setShowAddModal(false)}
                className="text-opera-200 hover:text-white hover:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleTambahPeserta} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="p-6 sm:px-8 sm:py-6 space-y-5 text-xs overflow-y-auto flex-1">
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
                  onNamaChange={(val) => {
                    setFormData({ ...formData, nama: val });
                    if (formErrors.nama) setFormErrors({ ...formErrors, nama: '' });
                  }}
                  kamar={formData.kamar}
                  onKamarChange={(val) => setFormData({ ...formData, kamar: val })}
                  kelas={formData.kelas}
                  onKelasChange={(val) => setFormData({ ...formData, kelas: val })}
                  kategoriUtama={formData.kategoriUtama}
                  namaWali={formData.namaWali}
                  onNamaWaliChange={(val) => {
                    setFormData({ ...formData, namaWali: val });
                    if (formErrors.namaWali) setFormErrors({ ...formErrors, namaWali: '' });
                  }}
                  noHp={formData.noHp}
                  onNoHpChange={(val) => setFormData({ ...formData, noHp: val })}
                  alamat={formData.alamat}
                  onAlamatChange={(val) => setFormData({ ...formData, alamat: val })}
                  errors={formErrors}
                />
              </div>

              <div className="shrink-0 px-6 py-4 sm:px-8 sm:py-4 bg-white/80 backdrop-blur-sm border-t border-slate-200/80 flex items-center justify-end gap-3 text-xs sm:text-sm">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmittingSantri}
                  className="px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSantri}
                  className="px-5 sm:px-6 py-2.5 min-h-[44px] rounded-xl bg-opera-850 hover:bg-opera-900 text-gold-300 font-serif font-black shadow border border-gold-500/40 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
      </ModalPortal>

      {/* ========================================================================= */}
      {/* MODAL 3 (SANTRI): EDIT PESERTA SANTRI */}
      {/* ========================================================================= */}
      <ModalPortal
        isOpen={Boolean(isEditingSantri)}
        onClose={() => setEditingItem(null)}
        disableClose={isSubmittingSantri}
      >
        {isEditingSantri && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-edit-santri-title"
            className="bg-[#F0F9FF]/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[calc(100dvh-3rem)] sm:max-h-[calc(100dvh-5rem)] flex flex-col shadow-2xl border border-white/60 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-opera-950 to-opera-900 text-white px-6 py-4 sm:px-8 sm:py-5 flex items-center justify-between gap-3 border-b border-gold-500/40 shrink-0">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/50 flex items-center justify-center text-blue-300 shrink-0">
                  <Edit className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h3 id="modal-edit-santri-title" className="font-serif font-black text-sm sm:text-base text-gold-300 truncate">
                    Edit Peserta: {editingItem.kode}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-opera-200 truncate">
                    Perbarui rincian santri dan wali
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Tutup modal"
                onClick={() => setEditingItem(null)}
                className="text-opera-200 hover:text-white hover:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* TAB NAVIGASI EDIT MODAL */}
            <div className="flex border-b border-blue-900/10 bg-sky-50/50 backdrop-blur-xs px-6 sm:px-8 pt-2 gap-2 text-xs font-bold shrink-0">
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
              <form onSubmit={handleSaveEdit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="p-6 sm:px-8 sm:py-6 space-y-5 text-xs overflow-y-auto flex-1">
                  {/* Biodata & Kuota Components for Edit */}
                  <div>
                    <label htmlFor="edit-santri-nama" className="block font-bold text-slate-700 mb-1.5">Nama Lengkap Santri *</label>
                    <input
                      id="edit-santri-nama"
                      type="text"
                      required
                      aria-invalid={!!formErrors.nama}
                      aria-describedby={formErrors.nama ? 'error-edit-santri-nama' : undefined}
                      value={editingItem.nama}
                      onChange={(e) => {
                        setEditingItem({ ...editingItem, nama: e.target.value });
                        if (formErrors.nama) setFormErrors({ ...formErrors, nama: '' });
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl border uppercase font-semibold focus:outline-none focus:ring-2 transition-colors ${
                        formErrors.nama
                          ? 'border-rose-400 bg-rose-50/40 text-rose-950 focus:ring-rose-500'
                          : 'border-slate-300 bg-white/90 focus:ring-opera-700'
                      }`}
                    />
                    {formErrors.nama && (
                      <p id="error-edit-santri-nama" className="text-rose-500 text-xs mt-1 font-medium animate-in fade-in">
                        {formErrors.nama}
                      </p>
                    )}
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="edit-santri-kamar" className="block font-bold text-slate-700 mb-1.5">Kamar Pondok</label>
                      <input
                        id="edit-santri-kamar"
                        type="text"
                        value={editingItem.kamar}
                        onChange={(e) => setEditingItem({ ...editingItem, kamar: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white/90 focus:outline-none focus:ring-2 focus:ring-opera-700"
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-santri-wali" className="block font-bold text-slate-700 mb-1.5">Nama Wali *</label>
                      <input
                        id="edit-santri-wali"
                        type="text"
                        required
                        aria-invalid={!!formErrors.namaWali}
                        aria-describedby={formErrors.namaWali ? 'error-edit-santri-wali' : undefined}
                        value={editingItem.namaWali}
                        onChange={(e) => {
                          setEditingItem({ ...editingItem, namaWali: e.target.value });
                          if (formErrors.namaWali) setFormErrors({ ...formErrors, namaWali: '' });
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border uppercase focus:outline-none focus:ring-2 transition-colors ${
                          formErrors.namaWali
                            ? 'border-rose-400 bg-rose-50/40 text-rose-950 focus:ring-rose-500'
                            : 'border-slate-300 bg-white/90 focus:ring-opera-700'
                        }`}
                      />
                      {formErrors.namaWali && (
                        <p id="error-edit-santri-wali" className="text-rose-500 text-xs mt-1 font-medium animate-in fade-in">
                          {formErrors.namaWali}
                        </p>
                      )}
                    </div>
                  </div>

                  {editingItem.kategoriUtama === 'BIN_NADZOR' && (
                    <div className="animate-in fade-in">
                      <label htmlFor="edit-santri-kelas" className="block font-bold text-slate-700 mb-1.5">Kelas *</label>
                      <select
                        id="edit-santri-kelas"
                        value={editingItem.kelas || '2 Tsanawiyah'}
                        onChange={(e) => setEditingItem({ ...editingItem, kelas: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-opera-700 font-semibold text-slate-800 cursor-pointer"
                      >
                        {KELAS_BIN_NADZOR_LIST.map((kls) => (
                          <option key={kls} value={kls}>
                            {kls}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="edit-santri-hp" className="block font-bold text-slate-700 mb-1.5">No. WhatsApp</label>
                      <input
                        id="edit-santri-hp"
                        type="text"
                        value={editingItem.noHp}
                        onChange={(e) => setEditingItem({ ...editingItem, noHp: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white/90 focus:outline-none focus:ring-2 focus:ring-opera-700 font-mono"
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-santri-alamat" className="block font-bold text-slate-700 mb-1.5">Alamat / Asal Kota</label>
                      <input
                        id="edit-santri-alamat"
                        type="text"
                        value={editingItem.alamat}
                        onChange={(e) => setEditingItem({ ...editingItem, alamat: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white/90 focus:outline-none focus:ring-2 focus:ring-opera-700 uppercase"
                      />
                    </div>
                  </div>
                </div>

                <div className="shrink-0 px-6 py-4 sm:px-8 sm:py-4 bg-white/80 backdrop-blur-sm border-t border-slate-200/80 flex items-center justify-end gap-3 text-xs sm:text-sm">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    disabled={isSubmittingSantri}
                    className="px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingSantri}
                    className="px-5 sm:px-6 py-2.5 min-h-[44px] rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold shadow flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="p-6 sm:px-8 sm:py-6 space-y-3 text-xs overflow-y-auto flex-1 bg-sky-50/20">
                <SantriAuditHistoryTab
                  loading={loadingAuditHistory}
                  history={itemAuditHistory}
                />
              </div>
            )}
          </div>
        )}
      </ModalPortal>
    </>
  );
}
