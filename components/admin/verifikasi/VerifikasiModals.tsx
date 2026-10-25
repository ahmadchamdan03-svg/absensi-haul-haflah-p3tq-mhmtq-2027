'use client';

import React from 'react';
import {
  Check,
  CreditCard,
  Plus,
  Search,
  Banknote,
  Loader2,
  ExternalLink,
} from 'lucide-react';

export function VerifikasiModals({
  previewBuktiModal,
  setPreviewBuktiModal,
  showAddManualModal,
  setShowAddManualModal,
  handleSubmitTambahManual,
  searchSantriText,
  setSearchSantriText,
  selectedSantriKode,
  setSelectedSantriKode,
  filteredSantriList,
  selectedSantri,
  manualJumlah,
  setManualJumlah,
  manualMetode,
  setManualMetode,
  manualLangsungVerifikasi,
  setManualLangsungVerifikasi,
  manualKirimWa,
  setManualKirimWa,
  isSubmittingManual,
}: {
  previewBuktiModal: { url: string; title: string } | null;
  setPreviewBuktiModal: (val: { url: string; title: string } | null) => void;
  showAddManualModal: boolean;
  setShowAddManualModal: (val: boolean) => void;
  handleSubmitTambahManual: (e: React.FormEvent) => void;
  searchSantriText: string;
  setSearchSantriText: (val: string) => void;
  selectedSantriKode: string;
  setSelectedSantriKode: (val: string) => void;
  filteredSantriList: any[];
  selectedSantri: any;
  manualJumlah: number;
  setManualJumlah: (val: number) => void;
  manualMetode: 'TUNAI' | 'TRANSFER';
  setManualMetode: (val: 'TUNAI' | 'TRANSFER') => void;
  manualLangsungVerifikasi: boolean;
  setManualLangsungVerifikasi: (val: boolean) => void;
  manualKirimWa: boolean;
  setManualKirimWa: (val: boolean) => void;
  isSubmittingManual: boolean;
}) {
  return (
    <>
      {/* MODAL PREVIEW BUKTI TRANSFER */}
      {previewBuktiModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setPreviewBuktiModal(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-stone-900 rounded-3xl p-4 border border-stone-700 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between text-white border-b border-stone-800 pb-3 px-1">
              <h3 className="font-serif font-bold text-sm truncate">{previewBuktiModal.title}</h3>
              <button
                type="button"
                onClick={() => setPreviewBuktiModal(null)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl bg-black flex items-center justify-center max-h-[75vh]">
              <img
                src={previewBuktiModal.url}
                alt="Bukti Transfer"
                className="max-h-[75vh] w-auto object-contain mx-auto"
              />
            </div>

            <div className="flex justify-end pt-1">
              <a
                href={previewBuktiModal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white text-xs font-bold inline-flex items-center space-x-1.5 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Buka Gambar Ukuran Penuh</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH MANUAL PANITIA (KASIR) */}
      {showAddManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border-2 border-[#D5C4B4] space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <h4 className="font-serif font-black text-base text-[#422F21]">
                    Tambah Kuota Manual (Kasir)
                  </h4>
                  <p className="text-xs text-stone-500">Entri kuota kas tunai atau transfer panitia</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddManualModal(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 text-stone-500 hover:text-stone-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitTambahManual} className="space-y-4 text-xs">
              {/* Cari Santri */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#422F21] block">Cari &amp; Pilih Santri:</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchSantriText}
                    onChange={(e) => {
                      setSearchSantriText(e.target.value);
                      setSelectedSantriKode('');
                    }}
                    placeholder="Ketik nama santri, wali, atau kode SHxxxx..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#D5C4B4] bg-[#FAF7F3] focus:bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#8C6A47]"
                  />
                </div>

                {/* Dropdown hasil cari santri */}
                {filteredSantriList.length > 0 && !selectedSantriKode && (
                  <div className="max-h-44 overflow-y-auto border border-[#D5C4B4] rounded-xl bg-white shadow-lg divide-y divide-stone-100">
                    {filteredSantriList.map((s) => (
                      <button
                        key={s.id || s.kode}
                        type="button"
                        onClick={() => {
                          setSelectedSantriKode(s.kode);
                          setSearchSantriText(`${s.nama} (${s.kode})`);
                        }}
                        className="w-full text-left p-2.5 hover:bg-[#FAF0E6] transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <div className="font-bold text-[#422F21]">{s.nama}</div>
                          <div className="text-[10px] text-stone-500">
                            Wali: {s.nama_wali || s.nama} · Kelas {s.kelas || '-'}
                          </div>
                        </div>
                        <span className="font-mono text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                          {s.kode}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {selectedSantri && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 font-medium flex items-center justify-between">
                    <div>
                      <span className="font-bold block">{selectedSantri.nama}</span>
                      <span className="text-[10px] text-emerald-800">
                        Wali: {selectedSantri.nama_wali} · Sisa Tambahan Aktif: +{selectedSantri.kuota_tambahan || 0}
                      </span>
                    </div>
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  </div>
                )}
              </div>

              {/* Stepper Jumlah Kursi */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#422F21] block">Jumlah Kuota Tambahan:</label>
                <div className="flex items-center space-x-3 p-3 bg-[#FAF7F3] rounded-xl border border-[#D5C4B4]">
                  <button
                    type="button"
                    onClick={() => setManualJumlah(Math.max(1, manualJumlah - 1))}
                    className="w-9 h-9 rounded-lg bg-white border border-stone-300 font-black text-sm cursor-pointer hover:bg-stone-100 active:scale-95"
                  >
                    −
                  </button>
                  <span className="font-serif font-black text-lg text-[#422F21] w-8 text-center">
                    {manualJumlah}
                  </span>
                  <button
                    type="button"
                    onClick={() => setManualJumlah(manualJumlah + 1)}
                    className="w-9 h-9 rounded-lg bg-[#8C6A47] text-white font-black text-sm cursor-pointer hover:bg-[#735334] active:scale-95"
                  >
                    +
                  </button>
                  <div className="flex-1 text-right text-xs">
                    <span className="text-stone-500">Total:</span>{' '}
                    <strong className="text-emerald-700 font-serif font-black text-sm">
                      Rp {(manualJumlah * 75000).toLocaleString('id-ID')}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Metode Pembayaran */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#422F21] block">Metode Pembayaran:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setManualMetode('TUNAI')}
                    className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer ${
                      manualMetode === 'TUNAI'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                        : 'bg-[#FAF7F3] text-stone-700 border-[#D5C4B4]'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Kas Tunai</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualMetode('TRANSFER')}
                    className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer ${
                      manualMetode === 'TRANSFER'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                        : 'bg-[#FAF7F3] text-stone-700 border-[#D5C4B4]'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Transfer BRI</span>
                  </button>
                </div>
              </div>

              {/* Checkboxes Options */}
              <div className="space-y-2 pt-1">
                <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-[#422F21]">
                  <input
                    type="checkbox"
                    checked={manualLangsungVerifikasi}
                    onChange={(e) => setManualLangsungVerifikasi(e.target.checked)}
                    className="rounded border-[#D5C4B4] text-[#8C6A47] focus:ring-[#8C6A47] w-4 h-4"
                  />
                  <span>Langsung Verifikasi &amp; Aktifkan Kuota Santri</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-[#422F21]">
                  <input
                    type="checkbox"
                    checked={manualKirimWa}
                    onChange={(e) => setManualKirimWa(e.target.checked)}
                    className="rounded border-[#D5C4B4] text-[#8C6A47] focus:ring-[#8C6A47] w-4 h-4"
                  />
                  <span>Kirim Notifikasi WhatsApp Konfirmasi ke Wali Santri</span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddManualModal(false)}
                  className="flex-1 py-3 rounded-2xl border border-[#D5C4B4] text-stone-600 hover:bg-[#FAF7F3] font-bold cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManual || !selectedSantriKode}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#8C6A47] to-[#A47E57] hover:brightness-105 disabled:opacity-50 text-white font-bold transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  {isSubmittingManual ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-200" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-amber-200" />
                      <span>Simpan Transaksi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
