'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Users, Crown, Building, Edit, X, History } from 'lucide-react';
import ModalPortal from '@/components/ui/ModalPortal';
import { supabase } from '@/lib/supabase/client';
import { generateRandomKode } from '@/lib/utils';
import TamuFormFields, {
  GolonganUndangan,
  OPSI_UNDANGAN_ISTIMEWA,
  OPSI_UNDANGAN_UMUM,
  getGolonganUndangan,
  matchUndanganCategory,
} from './modal/TamuFormFields';
import TamuPaymentUploader, {
  submitTambahUndanganToSupabase,
  submitEditUndanganToSupabase,
} from './modal/TamuPaymentUploader';

export {
  type GolonganUndangan,
  OPSI_UNDANGAN_ISTIMEWA,
  OPSI_UNDANGAN_UMUM,
  getGolonganUndangan,
  matchUndanganCategory,
  generateRandomKode,
};

export interface TamuModalProps {
  showAddUndanganModal: boolean;
  setShowAddUndanganModal: (show: boolean) => void;
  selectedGolonganUndangan: GolonganUndangan;
  setSelectedGolonganUndangan: (gol: GolonganUndangan) => void;
  editingItem: any | null;
  setEditingItem: (item: any | null) => void;
  onAddSuccess: (newUndanganItem: any, message: string) => void;
  onEditSuccess: (message: string) => Promise<void> | void;
}

export default function TamuModal({
  showAddUndanganModal,
  setShowAddUndanganModal,
  selectedGolonganUndangan,
  setSelectedGolonganUndangan,
  editingItem,
  setEditingItem,
  onAddSuccess,
  onEditSuccess,
}: TamuModalProps) {
  const [isSubmittingTamu, setIsSubmittingTamu] = useState(false);
  const submitLockTamu = useRef(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Form state tambah undangan
  const [undanganForm, setUndanganForm] = useState({
    nama: '',
    namaPutra: '',
    namaPutri: '',
    kategori: 'VVIP',
    instansi: '',
    alamat: '',
    noHp: '',
    kuotaDasar: 2,
  });

  // State dropdown kategori undangan
  const [undanganKategoriDropdown, setUndanganKategoriDropdown] = useState<string>('VVIP');
  const [customKategoriInput, setCustomKategoriInput] = useState<string>('');

  // State dropdown kategori undangan saat edit
  const [editUndanganKategoriDropdown, setEditUndanganKategoriDropdown] = useState<string>('VVIP');
  const [editCustomKategoriInput, setEditCustomKategoriInput] = useState<string>('');
  const [editGolonganUndangan, setEditGolonganUndangan] = useState<GolonganUndangan>('ISTIMEWA');

  // Edit Modal Audit History Tab State
  const [editModalTab, setEditModalTab] = useState<'FORM' | 'RIWAYAT'>('FORM');
  const [itemAuditHistory, setItemAuditHistory] = useState<any[]>([]);
  const [loadingAuditHistory, setLoadingAuditHistory] = useState(false);

  const isEditingUndangan = editingItem && editingItem.tipe === 'UNDANGAN';

  // Reset form saat modal tambah undangan dibuka
  useEffect(() => {
    if (showAddUndanganModal) {
      setFormErrors({});
      let defaultKategori = OPSI_UNDANGAN_ISTIMEWA[0];
      if (selectedGolonganUndangan === 'KEHORMATAN') defaultKategori = 'Tamu Kehormatan';
      else if (selectedGolonganUndangan === 'UMUM') defaultKategori = OPSI_UNDANGAN_UMUM[0];
      setUndanganKategoriDropdown(defaultKategori);
      setUndanganForm({
        nama: '',
        namaPutra: '',
        namaPutri: '',
        kategori: defaultKategori,
        instansi: '',
        alamat: '',
        noHp: '',
        kuotaDasar:
          selectedGolonganUndangan === 'ISTIMEWA'
            ? 2
            : selectedGolonganUndangan === 'KEHORMATAN'
            ? 4
            : 2,
      });
      setCustomKategoriInput('');
    }
  }, [showAddUndanganModal]);

  // Sinkronisasi state edit golongan & kategori ketika editingItem dibuka
  useEffect(() => {
    if (isEditingUndangan && editingItem) {
      setFormErrors({});
      const raw = editingItem.raw || editingItem;
      const gol = editingItem.golonganUndangan || getGolonganUndangan(raw);
      setEditGolonganUndangan(gol);
      if (gol !== 'KEHORMATAN') {
        const opts = gol === 'ISTIMEWA' ? OPSI_UNDANGAN_ISTIMEWA : OPSI_UNDANGAN_UMUM;
        const currentKat = editingItem.kategori || '';
        if (opts.includes(currentKat)) {
          setEditUndanganKategoriDropdown(currentKat);
          setEditCustomKategoriInput('');
        } else {
          setEditUndanganKategoriDropdown('Lainnya (Ketik Sendiri...)');
          setEditCustomKategoriInput(currentKat);
        }
      }
    }
  }, [isEditingUndangan, editingItem?.kode]);

  useEffect(() => {
    if (isEditingUndangan && editingItem?.kode) {
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
    } else if (!isEditingUndangan) {
      setItemAuditHistory([]);
      setEditModalTab('FORM');
    }
  }, [isEditingUndangan, editingItem?.kode]);

  const handleTambahUndangan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLockTamu.current || isSubmittingTamu) return;
    await submitTambahUndanganToSupabase({
      selectedGolonganUndangan,
      undanganKategoriDropdown,
      customKategoriInput,
      undanganForm,
      setUndanganForm,
      setUndanganKategoriDropdown,
      setCustomKategoriInput,
      setShowAddUndanganModal,
      onAddSuccess,
      submitLockTamu,
      setIsSubmittingTamu,
      formErrors,
      setFormErrors,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLockTamu.current || isSubmittingTamu) return;
    setIsSubmittingTamu(true);
    try {
      await submitEditUndanganToSupabase({
        editingItem,
        editGolonganUndangan,
        editUndanganKategoriDropdown,
        editCustomKategoriInput,
        onEditSuccess,
        setEditingItem,
        setFormErrors,
      });
    } finally {
      setIsSubmittingTamu(false);
    }
  };

  return (
    <>
      {/* MODAL 2: TAMBAH TAMU UNDANGAN */}
      <ModalPortal
        isOpen={showAddUndanganModal}
        onClose={() => setShowAddUndanganModal(false)}
        disableClose={isSubmittingTamu}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-tambah-tamu-title"
          className="bg-[#F0F9FF]/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[calc(100dvh-3rem)] sm:max-h-[calc(100dvh-5rem)] flex flex-col shadow-2xl border border-white/60 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-opera-950 to-opera-900 text-white px-6 py-4 sm:px-8 sm:py-5 flex items-center justify-between gap-3 border-b border-gold-500/40 shrink-0">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gold-500/20 border border-gold-500/50 flex items-center justify-center text-gold-400 shrink-0">
                {selectedGolonganUndangan === 'ISTIMEWA' ? (
                  <Crown className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />
                ) : selectedGolonganUndangan === 'KEHORMATAN' ? (
                  <Building className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
                ) : (
                  <Users className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" />
                )}
              </div>
              <div className="min-w-0">
                <h3 id="modal-tambah-tamu-title" className="font-serif font-black text-base sm:text-lg text-gold-300 truncate">
                  Tambah Tamu{' '}
                  {selectedGolonganUndangan === 'ISTIMEWA'
                    ? 'Istimewa'
                    : selectedGolonganUndangan === 'KEHORMATAN'
                    ? 'Kehormatan'
                    : 'Umum'}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-opera-200 truncate mt-0.5">
                  {selectedGolonganUndangan === 'ISTIMEWA'
                    ? 'VVIP & Dzurriyyah / Keluarga Mahrus / Kunir / Bandar'
                    : selectedGolonganUndangan === 'KEHORMATAN'
                    ? 'Masyayikh, Habaib, Pejabat & Ulama Sepuh'
                    : 'Penguji Al Qur-an, Mustahiq, Asatidz & Perwakilan Pondok'}
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Tutup modal"
              onClick={() => setShowAddUndanganModal(false)}
              className="text-opera-200 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <TamuFormFields
            mode="ADD"
            selectedGolonganUndangan={selectedGolonganUndangan}
            setSelectedGolonganUndangan={setSelectedGolonganUndangan}
            undanganForm={undanganForm}
            setUndanganForm={setUndanganForm}
            undanganKategoriDropdown={undanganKategoriDropdown}
            setUndanganKategoriDropdown={setUndanganKategoriDropdown}
            customKategoriInput={customKategoriInput}
            setCustomKategoriInput={setCustomKategoriInput}
            isSubmittingTamu={isSubmittingTamu}
            onCancelAdd={() => setShowAddUndanganModal(false)}
            onSubmitAdd={handleTambahUndangan}
            errors={formErrors}
            setErrors={setFormErrors}
          />
        </div>
      </ModalPortal>

      {/* MODAL 3 (UNDANGAN): EDIT TAMU UNDANGAN */}
      <ModalPortal
        isOpen={Boolean(isEditingUndangan)}
        onClose={() => setEditingItem(null)}
        disableClose={isSubmittingTamu}
      >
        {isEditingUndangan && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-edit-tamu-title"
            className="bg-[#F0F9FF]/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[calc(100dvh-3rem)] sm:max-h-[calc(100dvh-5rem)] flex flex-col shadow-2xl border border-white/60 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-opera-950 to-opera-900 text-white px-6 py-4 sm:px-8 sm:py-5 flex items-center justify-between gap-3 border-b border-gold-500/40 shrink-0">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/50 flex items-center justify-center text-blue-300 shrink-0">
                  <Edit className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 id="modal-edit-tamu-title" className="font-serif font-black text-sm sm:text-base text-gold-300 truncate">
                    Edit Tamu Undangan: {editingItem.kode}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-opera-200 truncate">
                    Perbarui data tamu dan jatah kursi
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Tutup modal"
                onClick={() => setEditingItem(null)}
                className="text-opera-200 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors cursor-pointer shrink-0"
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
              <TamuFormFields
                mode="EDIT"
                editingItem={editingItem}
                setEditingItem={setEditingItem}
                editGolonganUndangan={editGolonganUndangan}
                setEditGolonganUndangan={setEditGolonganUndangan}
                editUndanganKategoriDropdown={editUndanganKategoriDropdown}
                setEditUndanganKategoriDropdown={setEditUndanganKategoriDropdown}
                editCustomKategoriInput={editCustomKategoriInput}
                setEditCustomKategoriInput={setEditCustomKategoriInput}
                isSubmittingTamu={isSubmittingTamu}
                onCancelEdit={() => setEditingItem(null)}
                onSubmitEdit={handleSaveEdit}
                errors={formErrors}
                setErrors={setFormErrors}
              />
            ) : (
              <TamuPaymentUploader
                loadingAuditHistory={loadingAuditHistory}
                itemAuditHistory={itemAuditHistory}
              />
            )}
          </div>
        )}
      </ModalPortal>
    </>
  );
}
