'use client';

import React from 'react';
import { Edit3, X, Save } from 'lucide-react';
import { GolonganUndangan, WalkinFormState } from './types';

interface RekonModalsProps {
  editingItem: any | null;
  setEditingItem: React.Dispatch<React.SetStateAction<any | null>>;
  savingEdit: boolean;
  onSaveEdit: (e: React.FormEvent) => void;
  showWalkinModal: boolean;
  setShowWalkinModal: React.Dispatch<React.SetStateAction<boolean>>;
  walkinForm: WalkinFormState;
  setWalkinForm: React.Dispatch<React.SetStateAction<WalkinFormState>>;
  savingWalkin: boolean;
  onSaveWalkin: (e: React.FormEvent) => void;
}

export default function RekonModals({
  editingItem,
  setEditingItem,
  savingEdit,
  onSaveEdit,
  showWalkinModal,
  setShowWalkinModal,
  walkinForm,
  setWalkinForm,
  savingWalkin,
  onSaveWalkin,
}: RekonModalsProps) {
  return (
    <>
      {/* MODAL EDIT LENGKAP (REKONSILIASI KOREKSI MASIF) */}
      {editingItem && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingItem(null);
          }}
        >
          <div className="bg-[#FAF7F3]/95 backdrop-blur-2xl rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 border border-white/60 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-200/60 pb-4">
              <div>
                <div className="inline-flex items-center space-x-2 px-3 py-0.5 rounded-full bg-white/60 backdrop-blur-xs text-[#8C6A47] text-[10px] font-bold border border-white/70">
                  <Edit3 className="w-3.5 h-3.5 text-[#8C6A47]" />
                  <span>PANEL EDIT LENGKAP REKONSILIASI</span>
                </div>
                <h3 className="text-lg font-serif font-black text-[#422F21] mt-1">
                  Edit Data {editingItem.tipe === 'SANTRI' ? 'Peserta Santri' : 'Tamu Undangan'}: {editingItem.kode}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={onSaveEdit} className="space-y-4 text-xs">
              {/* BLOK 1: IDENTITAS & KONTAK */}
              <div className="p-4 rounded-2xl bg-white/50 backdrop-blur-xs border border-white/60 space-y-3">
                <h4 className="font-serif font-black text-sm text-[#422F21]">1. Identitas &amp; Kontak Utama</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#422F21] mb-1">Nama Utama:</label>
                    <input
                      type="text"
                      value={editingItem.nama}
                      onChange={(e) => setEditingItem({ ...editingItem, nama: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-white/70 bg-white/60 backdrop-blur-xs font-semibold text-xs focus:ring-1 focus:ring-[#8C6A47]"
                      required
                    />
                  </div>

                  {editingItem.tipe === 'SANTRI' ? (
                    <div>
                      <label className="block font-bold text-[#422F21] mb-1">Nama Wali:</label>
                      <input
                        type="text"
                        value={editingItem.namaWali}
                        onChange={(e) => setEditingItem({ ...editingItem, namaWali: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-white/70 bg-white/60 backdrop-blur-xs text-xs focus:ring-1 focus:ring-[#8C6A47]"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block font-bold text-[#422F21] mb-1">Instansi / Asal:</label>
                      <input
                        type="text"
                        value={editingItem.instansi}
                        onChange={(e) => setEditingItem({ ...editingItem, instansi: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-white/70 bg-white/60 backdrop-blur-xs text-xs focus:ring-1 focus:ring-[#8C6A47]"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-[#422F21] mb-1">Nomor WhatsApp / HP:</label>
                    <input
                      type="text"
                      value={editingItem.noHp}
                      onChange={(e) => setEditingItem({ ...editingItem, noHp: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-white/70 bg-white/60 backdrop-blur-xs text-xs focus:ring-1 focus:ring-[#8C6A47]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#422F21] mb-1">Alamat Domisili:</label>
                    <input
                      type="text"
                      value={editingItem.alamat}
                      onChange={(e) => setEditingItem({ ...editingItem, alamat: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-white/70 bg-white/60 backdrop-blur-xs text-xs focus:ring-1 focus:ring-[#8C6A47]"
                    />
                  </div>
                </div>
              </div>

              {/* BLOK 2: KATEGORI & KUOTA */}
              <div className="p-4 rounded-2xl bg-white/50 backdrop-blur-xs border border-white/60 space-y-3">
                <h4 className="font-serif font-black text-sm text-[#422F21]">2. Kategori, Kuota &amp; Warna Tiket</h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {editingItem.tipe === 'SANTRI' ? (
                    <>
                      <div>
                        <label className="block font-bold text-[#422F21] mb-1">Kategori Utama:</label>
                        <select
                          value={editingItem.kategoriUtama}
                          onChange={(e) => setEditingItem({ ...editingItem, kategoriUtama: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-white/70 bg-white/60 backdrop-blur-xs text-xs font-semibold"
                        >
                          <option value="BIL_GHOIB">BIL_GHOIB (Cream)</option>
                          <option value="BIN_NADZOR">BIN_NADZOR (Biru)</option>
                          <option value="TAMATAN">TAMATAN (Biru)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-[#422F21] mb-1">Sub-Kategori / Kelas:</label>
                        <input
                          type="text"
                          value={editingItem.subKategori}
                          onChange={(e) => setEditingItem({ ...editingItem, subKategori: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-white/70 bg-white/60 backdrop-blur-xs text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-[#422F21] mb-1">Kamar Santri:</label>
                        <input
                          type="text"
                          value={editingItem.kamar}
                          onChange={(e) => setEditingItem({ ...editingItem, kamar: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-white/70 bg-white/60 backdrop-blur-xs text-xs"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block font-bold text-[#422F21] mb-1">Golongan Undangan:</label>
                        <select
                          value={editingItem.subKategori}
                          onChange={(e) => setEditingItem({ ...editingItem, subKategori: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-white/70 bg-white/60 backdrop-blur-xs text-xs font-semibold"
                        >
                          <option value="ISTIMEWA">ISTIMEWA (VVIP / VIP)</option>
                          <option value="KEHORMATAN">KEHORMATAN (Masyayikh / Habaib)</option>
                          <option value="UMUM">UMUM (Asatidz / Mustahiq)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-[#422F21] mb-1">Kategori Khusus:</label>
                        <input
                          type="text"
                          value={editingItem.kategori}
                          onChange={(e) => setEditingItem({ ...editingItem, kategori: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-white/70 bg-white/60 backdrop-blur-xs text-xs"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div>
                    <label className="block font-bold text-[#422F21] mb-1">Kuota Dasar:</label>
                    <input
                      type="number"
                      min="0"
                      value={editingItem.kuotaDasar}
                      onChange={(e) => setEditingItem({ ...editingItem, kuotaDasar: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-white/70 bg-white/60 backdrop-blur-xs font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#422F21] mb-1">Kuota Tambahan:</label>
                    <input
                      type="number"
                      min="0"
                      value={editingItem.kuotaTambahan}
                      onChange={(e) => setEditingItem({ ...editingItem, kuotaTambahan: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-white/70 bg-white/60 backdrop-blur-xs font-bold text-xs text-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#422F21] mb-1">Kuota Terpakai:</label>
                    <input
                      type="number"
                      min="0"
                      value={editingItem.kuotaTerpakai}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const val = Math.max(0, parseInt(raw, 10) || 0);
                        const currL = Number(editingItem.presensiL || 0);
                        const currP = Number(editingItem.presensiP || 0);
                        let nextL = currL;
                        let nextP = currP;
                        if (val === 0) {
                          nextL = 0;
                          nextP = 0;
                        } else if (currL + currP === 0) {
                          nextL = val;
                          nextP = 0;
                        } else if (val < currL + currP) {
                          const diff = (currL + currP) - val;
                          if (currP >= diff) {
                            nextP = currP - diff;
                          } else {
                            nextL = Math.max(0, currL - (diff - currP));
                            nextP = 0;
                          }
                        } else {
                          nextP = currP + (val - (currL + currP));
                        }
                        setEditingItem({
                          ...editingItem,
                          kuotaTerpakai: raw,
                          presensiL: nextL,
                          presensiP: nextP,
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-white/70 bg-white/60 backdrop-blur-xs font-bold text-xs text-blue-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#422F21] mb-1">Warna Tiket:</label>
                    <select
                      value={editingItem.warnaTiket}
                      onChange={(e) => setEditingItem({ ...editingItem, warnaTiket: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-white/70 bg-white/60 backdrop-blur-xs font-bold text-xs"
                    >
                      <option value="Cream">Cream</option>
                      <option value="Biru">Biru</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* BLOK 3: JUMLAH KEHADIRAN (PRESENSI REALTIME) */}
              <div className="p-4 rounded-2xl bg-amber-50/50 backdrop-blur-xs border border-amber-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-black text-sm text-[#422F21]">
                    3. Jumlah Kehadiran (Presensi Realtime)
                  </h4>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100/80 backdrop-blur-xs text-amber-900 border border-amber-300">
                    Total Kuota: {(Number(editingItem.kuotaDasar || 0) + Number(editingItem.kuotaTambahan || 0))} Kursi
                  </span>
                </div>

                {(() => {
                  const maxKuota = Number(editingItem.kuotaDasar || 0) + Number(editingItem.kuotaTambahan || 0);
                  const currentTotal = Number(editingItem.presensiL || 0) + Number(editingItem.presensiP || 0);
                  const isMaxReached = maxKuota > 0 ? currentTotal >= maxKuota : false;

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Stepper Putra */}
                      <div className="p-3 rounded-xl bg-white/60 backdrop-blur-xs border border-white/70 flex items-center justify-between shadow-2xs">
                        <div>
                          <span className="font-bold text-xs text-[#422F21] block">Putra / Laki-laki (L)</span>
                          <span className="text-[10px] text-stone-500">Jumlah fisik hadir</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingItem((prev: any) => {
                                const nextL = Math.max(0, Number(prev.presensiL || 0) - 1);
                                const nextP = Number(prev.presensiP || 0);
                                return {
                                  ...prev,
                                  presensiL: nextL,
                                  kuotaTerpakai: nextL + nextP,
                                };
                              })
                            }
                            disabled={Number(editingItem.presensiL || 0) <= 0}
                            className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 disabled:opacity-30 font-black text-base flex items-center justify-center cursor-pointer border border-stone-300 transition-all"
                          >
                            -
                          </button>
                          <span className="font-black text-sm w-6 text-center">{editingItem.presensiL || 0}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingItem((prev: any) => {
                                const nextL = Number(prev.presensiL || 0) + 1;
                                const nextP = Number(prev.presensiP || 0);
                                return {
                                  ...prev,
                                  presensiL: nextL,
                                  kuotaTerpakai: nextL + nextP,
                                };
                              })
                            }
                            disabled={isMaxReached}
                            className="w-8 h-8 rounded-lg bg-amber-700 hover:bg-amber-800 text-white disabled:opacity-30 font-black text-base flex items-center justify-center cursor-pointer shadow-2xs transition-all"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Stepper Putri */}
                      <div className="p-3 rounded-xl bg-white/60 backdrop-blur-xs border border-white/70 flex items-center justify-between shadow-2xs">
                        <div>
                          <span className="font-bold text-xs text-[#422F21] block">Putri / Perempuan (P)</span>
                          <span className="text-[10px] text-stone-500">Jumlah fisik hadir</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingItem((prev: any) => {
                                const nextL = Number(prev.presensiL || 0);
                                const nextP = Math.max(0, Number(prev.presensiP || 0) - 1);
                                return {
                                  ...prev,
                                  presensiP: nextP,
                                  kuotaTerpakai: nextL + nextP,
                                };
                              })
                            }
                            disabled={Number(editingItem.presensiP || 0) <= 0}
                            className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 disabled:opacity-30 font-black text-base flex items-center justify-center cursor-pointer border border-stone-300 transition-all"
                          >
                            -
                          </button>
                          <span className="font-black text-sm w-6 text-center">{editingItem.presensiP || 0}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingItem((prev: any) => {
                                const nextL = Number(prev.presensiL || 0);
                                const nextP = Number(prev.presensiP || 0) + 1;
                                return {
                                  ...prev,
                                  presensiP: nextP,
                                  kuotaTerpakai: nextL + nextP,
                                };
                              })
                            }
                            disabled={isMaxReached}
                            className="w-8 h-8 rounded-lg bg-amber-700 hover:bg-amber-800 text-white disabled:opacity-30 font-black text-base flex items-center justify-center cursor-pointer shadow-2xs transition-all"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* BLOK 4: RSVP & STATUS */}
              <div className="p-4 rounded-2xl bg-white/50 backdrop-blur-xs border border-white/60 space-y-3">
                <h4 className="font-serif font-black text-sm text-[#422F21]">4. RSVP &amp; Catatan</h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-[#422F21] mb-1">Status Konfirmasi RSVP:</label>
                    <select
                      value={editingItem.statusKonfirmasi}
                      onChange={(e) => setEditingItem({ ...editingItem, statusKonfirmasi: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-white/70 bg-white/60 backdrop-blur-xs text-xs font-bold"
                    >
                      <option value="BELUM">BELUM</option>
                      <option value="SUDAH">SUDAH</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-[#422F21] mb-1">Perkiraan Laki-laki:</label>
                    <input
                      type="number"
                      min="0"
                      value={editingItem.perkiraanL}
                      onChange={(e) => setEditingItem({ ...editingItem, perkiraanL: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-white/70 bg-white/60 backdrop-blur-xs text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#422F21] mb-1">Perkiraan Perempuan:</label>
                    <input
                      type="number"
                      min="0"
                      value={editingItem.perkiraanP}
                      onChange={(e) => setEditingItem({ ...editingItem, perkiraanP: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-white/70 bg-white/60 backdrop-blur-xs text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#422F21] mb-1">Catatan Khusus Rekonsiliasi:</label>
                  <input
                    type="text"
                    value={editingItem.catatanKonfirmasi}
                    onChange={(e) => setEditingItem({ ...editingItem, catatanKonfirmasi: e.target.value })}
                    placeholder="Contoh: Koreksi kuota walk-in di gerbang selatan..."
                    className="w-full px-3 py-2 rounded-xl border border-white/70 bg-white/60 backdrop-blur-xs text-xs"
                  />
                </div>
              </div>

              {/* FOOTER ACTION BUTTONS */}
              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-5 py-2.5 rounded-2xl border border-stone-300 font-bold text-stone-700 hover:bg-stone-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-6 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4 text-emerald-200" />
                  <span>{savingEdit ? 'Menyimpan &amp; Menyinkron...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL WALK-IN GUEST BARU */}
      {showWalkinModal && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowWalkinModal(false);
          }}
        >
          <div className="bg-[#FAF7F3]/95 backdrop-blur-2xl rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-white/60 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-200/60 pb-3">
              <div>
                <h3 className="font-serif font-black text-lg text-[#422F21]">
                  Daftarkan Tamu Walk-in Baru
                </h3>
                <p className="text-xs text-[#7A624E]">
                  Tamu hadir tanpa bawa barcode / undangan rusak (Auto Kode UND-xxxx)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowWalkinModal(false)}
                className="p-1 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={onSaveWalkin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#422F21] mb-1">Golongan Tamu Walk-in:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ISTIMEWA', 'KEHORMATAN', 'UMUM'] as GolonganUndangan[]).map((gol) => (
                    <button
                      key={gol}
                      type="button"
                      onClick={() =>
                        setWalkinForm({
                          ...walkinForm,
                          golongan: gol,
                          kategori: gol === 'ISTIMEWA' ? 'VVIP' : gol === 'KEHORMATAN' ? 'Tamu Kehormatan' : 'Asatidz Mhmtq Sekalian',
                        })
                      }
                      className={`py-2 px-1 rounded-xl font-bold border transition-all text-center text-[11px] ${
                        walkinForm.golongan === gol
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                          : 'bg-white/50 text-[#422F21] border-white/60 hover:bg-white/75 backdrop-blur-xs'
                      }`}
                    >
                      {gol}
                    </button>
                  ))}
                </div>
              </div>

              {walkinForm.golongan === 'ISTIMEWA' ? (
                <div className="space-y-3 bg-white/50 backdrop-blur-xs p-3.5 rounded-2xl border border-white/60">
                  <div>
                    <label className="block font-bold text-[#422F21] mb-1">Nama Tamu Putra:</label>
                    <input
                      type="text"
                      value={walkinForm.namaPutra}
                      onChange={(e) => setWalkinForm({ ...walkinForm, namaPutra: e.target.value })}
                      placeholder="Contoh: KH. ABDULLOH FAQIHI"
                      className="w-full px-3 py-2 rounded-xl border border-white/70 bg-white/60 backdrop-blur-xs text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#422F21] mb-1">Nama Tamu Putri:</label>
                    <input
                      type="text"
                      value={walkinForm.namaPutri}
                      onChange={(e) => setWalkinForm({ ...walkinForm, namaPutri: e.target.value })}
                      placeholder="Contoh: NYAI HJ. HINDAH"
                      className="w-full px-3 py-2 rounded-xl border border-white/70 bg-white/60 backdrop-blur-xs text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-[#422F21] mb-1">Nama Tamu Walk-in:</label>
                  <input
                    type="text"
                    value={walkinForm.nama}
                    onChange={(e) => setWalkinForm({ ...walkinForm, nama: e.target.value })}
                    placeholder="Contoh: KH. ANWAR MASHADI"
                    className="w-full px-3 py-2 rounded-xl border border-white/70 bg-white/60 backdrop-blur-xs focus:bg-white/90 text-xs"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-[#422F21] mb-1">Instansi / Alamat Asal:</label>
                <input
                  type="text"
                  value={walkinForm.instansi}
                  onChange={(e) => setWalkinForm({ ...walkinForm, instansi: e.target.value, alamat: e.target.value })}
                  placeholder="Contoh: PP. Lirboyo Kediri"
                  className="w-full px-3 py-2 rounded-xl border border-white/70 bg-white/60 backdrop-blur-xs focus:bg-white/90 text-xs"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/60 backdrop-blur-xs border border-emerald-200/80 flex items-center space-x-2.5">
                <input
                  type="checkbox"
                  id="langsungCheckin"
                  checked={walkinForm.langsungCheckin}
                  onChange={(e) => setWalkinForm({ ...walkinForm, langsungCheckin: e.target.checked })}
                  className="w-4 h-4 text-emerald-700 rounded border-stone-300 focus:ring-emerald-700 cursor-pointer"
                />
                <label htmlFor="langsungCheckin" className="text-xs font-bold text-emerald-950 cursor-pointer">
                  Langsung Tandai HADIR Seketika (Insert Presensi Log)
                </label>
              </div>

              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowWalkinModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300/80 bg-white/50 backdrop-blur-xs text-stone-700 font-bold hover:bg-white/80 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingWalkin}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {savingWalkin ? 'Menyimpan...' : 'Daftarkan Walk-in'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
