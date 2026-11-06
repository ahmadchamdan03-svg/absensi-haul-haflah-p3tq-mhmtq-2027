'use client';

import React from 'react';
import { X, Loader2, Crown, Building, Users } from 'lucide-react';
import {
  GolonganUndangan,
  OPSI_UNDANGAN_ISTIMEWA,
  OPSI_UNDANGAN_UMUM,
} from '@/lib/hooks/useTamuData';

interface TambahTamuModalProps {
  showAddModal: boolean;
  setShowAddModal: (show: boolean) => void;
  selectedGolonganUndangan: GolonganUndangan;
  handleOpenAddModal: (gol: GolonganUndangan) => void;
  undanganForm: {
    nama: string;
    namaPutra: string;
    namaPutri: string;
    kategori: string;
    instansi: string;
    alamat: string;
    noHp: string;
    kuotaDasar: number;
  };
  setUndanganForm: React.Dispatch<
    React.SetStateAction<{
      nama: string;
      namaPutra: string;
      namaPutri: string;
      kategori: string;
      instansi: string;
      alamat: string;
      noHp: string;
      kuotaDasar: number;
    }>
  >;
  undanganKategoriDropdown: string;
  setUndanganKategoriDropdown: (val: string) => void;
  customKategoriInput: string;
  setCustomKategoriInput: (val: string) => void;
  handleTambahTamu: (e: React.FormEvent) => Promise<void>;
  isSubmitting?: boolean;
}

export default function TambahTamuModal({
  showAddModal,
  setShowAddModal,
  selectedGolonganUndangan,
  handleOpenAddModal,
  undanganForm,
  setUndanganForm,
  undanganKategoriDropdown,
  setUndanganKategoriDropdown,
  customKategoriInput,
  setCustomKategoriInput,
  handleTambahTamu,
  isSubmitting = false,
}: TambahTamuModalProps) {
  if (!showAddModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 md:p-8 animate-in fade-in">
      <div className="bg-[#F0F9FF]/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl max-w-2xl w-full shadow-2xl border border-white/60 max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-white/50 p-4 sm:p-5 bg-white/40 backdrop-blur-md shrink-0">
          <div>
            <h3 className="font-serif font-black text-base sm:text-lg text-[#0F2C59]">
              Tambah Tamu Undangan Baru
            </h3>
            <p className="text-xs text-[#7A624E] mt-0.5">
              Data tersimpan langsung ke sistem presensi terpadu
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(false)}
            aria-label="Tutup form tambah tamu"
            className="p-1.5 rounded-xl hover:bg-white/40 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleTambahTamu}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          <div className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
            <div>
              <label className="block font-bold text-[#0F2C59] mb-1.5 text-xs">
                Golongan Tamu Undangan:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['ISTIMEWA', 'KEHORMATAN', 'UMUM'] as GolonganUndangan[]).map((gol) => (
                  <button
                    key={gol}
                    type="button"
                    onClick={() => handleOpenAddModal(gol)}
                    className={`py-2 px-2 rounded-xl font-bold border transition-all text-center text-xs cursor-pointer flex items-center justify-center gap-1.5 ${
                      selectedGolonganUndangan === gol
                        ? 'bg-blue-800 text-white border-blue-800 shadow-xs'
                        : 'bg-white/50 text-[#0F2C59] border-white/70 hover:bg-white/80 backdrop-blur-xs'
                    }`}
                  >
                    {gol === 'ISTIMEWA' && <Crown className="w-4 h-4 text-amber-400 shrink-0" />}
                    {gol === 'KEHORMATAN' && <Building className="w-4 h-4 text-purple-400 shrink-0" />}
                    {gol === 'UMUM' && <Users className="w-4 h-4 text-cyan-400 shrink-0" />}
                    <span>{gol === 'ISTIMEWA' ? 'Istimewa' : gol === 'KEHORMATAN' ? 'Kehormatan' : 'Umum'}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 bg-white/40 backdrop-blur-xs p-3.5 sm:p-4 rounded-2xl border border-white/50">
              <label className="block font-bold text-[#0F2C59] text-xs mb-1">
                Nama Tamu Undangan *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#0F2C59] text-xs mb-1">
                    👨 Nama Tamu Putra{' '}
                    <span className="text-stone-500 font-normal">(Gus / Kyai / Ust.)</span>:
                  </label>
                  <input
                    type="text"
                    value={undanganForm.namaPutra}
                    onChange={(e) => setUndanganForm({ ...undanganForm, namaPutra: e.target.value })}
                    placeholder="Nama tamu putra..."
                    className="w-full px-3.5 py-2 sm:py-2.5 rounded-xl border border-white/70 bg-white/60 backdrop-blur-xs focus:bg-white/90 text-xs focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#0F2C59] text-xs mb-1">
                    👩 Nama Tamu Putri{' '}
                    <span className="text-stone-500 font-normal">(Ning / Nyai / Ust.)</span>:
                  </label>
                  <input
                    type="text"
                    value={undanganForm.namaPutri}
                    onChange={(e) => setUndanganForm({ ...undanganForm, namaPutri: e.target.value })}
                    placeholder="Nama tamu putri..."
                    className="w-full px-3.5 py-2 sm:py-2.5 rounded-xl border border-white/70 bg-white/60 backdrop-blur-xs focus:bg-white/90 text-xs focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
              </div>

              {/* Indikator Kuota Otomatis Real-time */}
              {(() => {
                const hasP = !!undanganForm.namaPutra?.trim();
                const hasW = !!undanganForm.namaPutri?.trim();
                const autoKuota = hasP && hasW ? 2 : hasP || hasW ? 1 : 0;
                return (
                  <div className="mt-2.5 pt-2.5 border-t border-white/40 flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#0F2C59]">
                      Estimasi Kuota:{' '}
                      <strong className="text-sm font-bold text-blue-900">{autoKuota} Kursi</strong>
                    </span>
                    {autoKuota === 0 ? (
                      <span className="text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 text-[11px]">
                        ⚠️ Wajib mengisi minimal satu nama
                      </span>
                    ) : (
                      <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                        ✓ Kuota otomatis ({hasP && hasW ? 'Suami & Istri' : hasP ? 'Tamu Putra' : 'Tamu Putri'})
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>

            {selectedGolonganUndangan !== 'KEHORMATAN' && (
              <div>
                <label className="block font-bold text-[#0F2C59] mb-1.5 text-xs">
                  Kategori Undangan:
                </label>
                <select
                  value={undanganKategoriDropdown}
                  onChange={(e) => setUndanganKategoriDropdown(e.target.value)}
                  className="w-full px-3.5 py-2 sm:py-2.5 rounded-xl border border-white/70 bg-white/60 backdrop-blur-xs focus:bg-white/90 text-xs font-medium text-[#0F2C59]"
                >
                  {(selectedGolonganUndangan === 'ISTIMEWA' ? OPSI_UNDANGAN_ISTIMEWA : OPSI_UNDANGAN_UMUM).map(
                    (opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    )
                  )}
                </select>
                {undanganKategoriDropdown === 'Lainnya (Ketik Sendiri...)' && (
                  <input
                    type="text"
                    value={customKategoriInput}
                    onChange={(e) => setCustomKategoriInput(e.target.value)}
                    placeholder="Ketik nama kategori khusus..."
                    className="w-full mt-2 px-3.5 py-2 sm:py-2.5 rounded-xl border border-white/70 bg-white/60 backdrop-blur-xs focus:bg-white/90 text-xs focus:ring-1 focus:ring-emerald-700"
                  />
                )}
              </div>
            )}

            <div>
              <label className="block font-bold text-[#0F2C59] mb-1.5 text-xs">
                Instansi / Alamat:
              </label>
              <input
                type="text"
                value={undanganForm.instansi}
                onChange={(e) =>
                  setUndanganForm({ ...undanganForm, instansi: e.target.value, alamat: e.target.value })
                }
                placeholder="Contoh: PP. Lirboyo Kota Kediri"
                className="w-full px-3.5 py-2 sm:py-2.5 rounded-xl border border-white/70 bg-white/60 backdrop-blur-xs focus:bg-white/90 text-xs focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block font-bold text-[#0F2C59] mb-1.5 text-xs">
                Nomor WhatsApp / HP (Opsional):
              </label>
              <input
                type="text"
                value={undanganForm.noHp}
                onChange={(e) => setUndanganForm({ ...undanganForm, noHp: e.target.value })}
                placeholder="08xxxxxxxxxx"
                className="w-full px-3.5 py-2 sm:py-2.5 rounded-xl border border-white/70 bg-white/60 backdrop-blur-xs focus:bg-white/90 text-xs focus:ring-1 focus:ring-emerald-700"
              />
            </div>
          </div>

          <div className="shrink-0 p-3.5 sm:px-6 sm:py-3.5 bg-white/80 backdrop-blur-sm border-t border-stone-200/80 flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl border border-stone-300/80 bg-white/60 hover:bg-white/80 text-stone-700 font-bold text-xs sm:text-sm transition-colors cursor-pointer backdrop-blur-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs sm:text-sm shadow-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                'Simpan Tamu'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
