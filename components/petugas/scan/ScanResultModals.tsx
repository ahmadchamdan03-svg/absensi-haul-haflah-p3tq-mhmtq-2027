'use client';

import React from 'react';
import { Check, AlertCircle, RotateCcw } from 'lucide-react';
import { JalurPemeriksaan, CheckinResult } from '@/lib/types';
import { ScanActiveItem } from './types';

interface ScanResultModalsProps {
  activeItem: ScanActiveItem | null;
  checkinResult: CheckinResult | null;
  jalur: JalurPemeriksaan;
  jumlahL: number;
  setJumlahL: (val: number) => void;
  jumlahP: number;
  setJumlahP: (val: number) => void;
  kartuHitamGoldDiberi: boolean;
  serahkanTiketEmas: boolean;
  errorMsg: string | null;
  showResetConfirmModal: boolean;
  setShowResetConfirmModal: (val: boolean) => void;
  isUpdatingKartuGold: boolean;
  onToggleKartuHitamGold: () => void;
  onConfirmResetKartuHitamGold: () => void;
  onConfirmCheckin: () => void;
  onResetForNext: () => void;
}

export default function ScanResultModals({
  activeItem,
  checkinResult,
  jalur,
  jumlahL,
  setJumlahL,
  jumlahP,
  setJumlahP,
  kartuHitamGoldDiberi,
  serahkanTiketEmas,
  errorMsg,
  showResetConfirmModal,
  setShowResetConfirmModal,
  isUpdatingKartuGold,
  onToggleKartuHitamGold,
  onConfirmResetKartuHitamGold,
  onConfirmCheckin,
  onResetForNext,
}: ScanResultModalsProps) {
  return (
    <>
      {/* ========================================================================= */}
      {/* TAMPILAN 2: DETAIL PESERTA DARI SUPABASE SAAT QR TERPINDAI */}
      {/* ========================================================================= */}
      {activeItem && !checkinResult && (
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-opera-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-w-md mx-auto">
          {/* Header Compact */}
          <div className="bg-gradient-to-r from-opera-950 to-opera-900 text-white px-3.5 py-2.5 flex items-center justify-between border-b border-gold-500/30">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gold-400 animate-ping"></span>
              <span className="text-[11px] font-serif font-bold tracking-wider text-gold-300">
                ✓ QR SUPABASE TERVERIFIKASI
              </span>
            </div>
            <span className="text-[11px] text-opera-200 font-mono font-bold">KODE: {activeItem.kode}</span>
          </div>

          <div className="p-4 space-y-3">
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                {activeItem.tipe === 'KELUARGA' ? 'SHOHIBUL HAJAT (SANTRI)' : 'TAMU UNDANGAN'}
              </div>
              <h2 className="text-base sm:text-lg font-serif font-black text-slate-900 leading-snug mt-0.5">
                {activeItem.nama}
              </h2>
              <p className="text-[11px] text-slate-600 font-medium leading-tight mt-0.5">
                {activeItem.tipe === 'KELUARGA'
                  ? `${activeItem.subKategori} · Kelas: ${activeItem.kelas} · Wali: ${activeItem.namaWali}`
                  : `${activeItem.kategori} · ${activeItem.namaWali}`}
              </p>
            </div>

            {/* Kotak Indikator Kuota Ringkas */}
            {(() => {
              const totalKuota = activeItem.kuota.kuotaDasar + activeItem.kuota.kuotaTambahan;
              const terpakai = activeItem.kuota.terpakai;
              const sisa = Math.max(0, totalKuota - terpakai);
              return (
                <div className="grid grid-cols-3 gap-1.5 text-center bg-stone-50 p-2.5 rounded-2xl border border-stone-200">
                  <div className="border-r border-stone-200 pr-1">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">KUOTA</div>
                    <div className="text-xl font-serif font-black text-slate-800">
                      {totalKuota}
                    </div>
                  </div>
                  <div className="border-r border-stone-200 pr-1">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">TERPAKAI</div>
                    <div className="text-xl font-serif font-black text-slate-800">
                      {terpakai}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase">SISA</div>
                    <div
                      className={`text-xl font-serif font-black ${
                        sisa > 0 ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {sisa}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Checkbox "Hitam Gold" KHUSUS BIL GHOIB */}
            {activeItem.isBilGhoib && (() => {
              const isChecked = Number(activeItem.kuota?.tiketPanggungDiberi || 0) > 0 || kartuHitamGoldDiberi || serahkanTiketEmas;

              return (
                <div
                  onClick={onToggleKartuHitamGold}
                  className={`p-3 rounded-2xl border-2 transition-all select-none cursor-pointer ${
                    isChecked
                      ? 'bg-[#2A1D0F] border-[#D49B5B] text-amber-200 shadow-xs hover:border-amber-400'
                      : 'bg-[#FFFDF9] border-[#D5C4B4] hover:border-amber-500 text-[#422F21]'
                  }`}
                  title={isChecked ? 'Klik untuk membatalkan/uncheck Kartu Hitam Gold' : 'Klik untuk memberikan Kartu Hitam Gold'}
                >
                  <div className="flex items-start space-x-2.5">
                    <input
                      type="checkbox"
                      id="checkbox-hitam-gold"
                      checked={isChecked}
                      onChange={onToggleKartuHitamGold}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded text-amber-600 border-amber-400 focus:ring-amber-500 accent-amber-600 mt-0.5 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="checkbox-hitam-gold"
                          className="text-xs font-bold leading-tight flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Kartu Hitam Gold</span>
                          <span className="text-[10px] text-amber-300 font-normal">(Maju Panggung)</span>
                        </label>

                        {isChecked ? (
                          <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#D49B5B] text-white ml-1 shrink-0 flex items-center gap-1 shadow-xs">
                            <Check className="w-3 h-3 text-white" />
                            SUDAH
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold text-stone-500 px-2 py-0.5 rounded-full bg-stone-100 ml-1 shrink-0">
                            BELUM
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] text-stone-500 mt-1 leading-tight flex items-center gap-1">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${isChecked ? 'bg-amber-400' : 'bg-stone-300'}`}></span>
                        {isChecked
                          ? 'Status: SUDAH DIBERIKAN (1 kuota panggung). Klik untuk mereset/uncheck.'
                          : 'Status: BELUM DIBERIKAN. Centang jika kartu diserahkan.'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Input Form Jumlah Kehadiran (L / P) */}
            {(() => {
              const totalKuota = activeItem.kuota.kuotaDasar + activeItem.kuota.kuotaTambahan;
              const terpakai = activeItem.kuota.terpakai;
              const sisa = Math.max(0, totalKuota - terpakai);
              const totalInput = jumlahL + jumlahP;
              const isNewlyGivingGold = activeItem.isBilGhoib && (kartuHitamGoldDiberi || serahkanTiketEmas);
              const isExceeded = totalInput > totalKuota;
              const isPlusDisabled = totalInput >= totalKuota;

              return (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        JUMLAH PRIA (L)
                      </label>
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setJumlahL(Math.max(0, jumlahL - 1))}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-black text-xs text-slate-700 shadow-xs cursor-pointer flex items-center justify-center shrink-0"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={0}
                          value={jumlahL}
                          onChange={(e) => setJumlahL(parseInt(e.target.value, 10) || 0)}
                          className="w-full text-center font-bold text-sm bg-white border border-slate-300 rounded-lg py-0.5"
                        />
                        <button
                          type="button"
                          onClick={() => setJumlahL(jumlahL + 1)}
                          disabled={isPlusDisabled}
                          title={isPlusDisabled ? `Total input (${totalInput}) sudah mencapai kuota (${totalKuota})` : undefined}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-black text-xs text-slate-700 shadow-xs cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        JUMLAH WANITA (P)
                      </label>
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setJumlahP(Math.max(0, jumlahP - 1))}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-black text-xs text-slate-700 shadow-xs cursor-pointer flex items-center justify-center shrink-0"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={0}
                          value={jumlahP}
                          onChange={(e) => setJumlahP(parseInt(e.target.value, 10) || 0)}
                          className="w-full text-center font-bold text-sm bg-white border border-slate-300 rounded-lg py-0.5"
                        />
                        <button
                          type="button"
                          onClick={() => setJumlahP(jumlahP + 1)}
                          disabled={isPlusDisabled}
                          title={isPlusDisabled ? `Total input (${totalInput}) sudah mencapai kuota (${totalKuota})` : undefined}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-black text-xs text-slate-700 shadow-xs cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* INFO TEKS SISA KUOTA & STATUS AUTOMATIS */}
                  <div className="text-[11px] font-semibold text-center py-1">
                    {terpakai >= totalKuota || isPlusDisabled ? (
                      <span className="text-amber-900 bg-amber-50 px-3 py-1 rounded-full border border-amber-300 inline-block font-bold">
                        ⚠️ KUOTA PENUH — Total saat ini: {terpakai}/{totalKuota} orang · Sisa kuota: {sisa} orang
                      </span>
                    ) : (
                      <span className="text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
                        Total saat ini: <strong>{terpakai} orang</strong> · Sisa kuota: <strong>{sisa} orang</strong> (Input total: {totalInput} orang)
                      </span>
                    )}
                  </div>

                  {isExceeded && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Total input ({totalInput} orang) melebihi total kuota ({totalKuota} kursi). Mohon kurangi jumlahnya.</span>
                    </div>
                  )}

                  {errorMsg && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={onResetForNext}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={onConfirmCheckin}
                      disabled={isExceeded || (totalInput <= 0 && !isNewlyGivingGold)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-800 hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed text-white font-serif font-black text-xs sm:text-sm shadow-md flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4 text-emerald-200" />
                      <span>Konfirmasi Presensi / Masuk</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAMPILAN 3: HASIL PRESENSI SUKSES */}
      {/* ========================================================================= */}
      {checkinResult && checkinResult.ok && (
        <div className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-emerald-500 text-center space-y-4 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto font-bold border-2 border-emerald-300">
            <Check className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-xl font-serif font-black text-emerald-950">
              PRESENSI BERHASIL DICATAT!
            </h2>
            <p className="text-xs text-emerald-800 mt-1">{checkinResult.pesan}</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1 text-left">
            <p><strong>Nama:</strong> {checkinResult.detail?.nama}</p>
            <p><strong>Kode:</strong> {checkinResult.detail?.kode}</p>
            <p><strong>Jalur Gerbang:</strong> {jalur === 'BARAT' ? 'Jalur Barat (Putra)' : 'Jalur Timur (Putri)'}</p>
            <p><strong>Sisa Kuota:</strong> {checkinResult.sisa} Kursi</p>
          </div>

          <button
            type="button"
            onClick={onResetForNext}
            className="w-full py-3.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-serif font-black text-sm shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Scan Kode QR Berikutnya</span>
          </button>
        </div>
      )}

      {/* MODAL KONFIRMASI RESET KARTU HITAM GOLD */}
      {showResetConfirmModal && activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative flex flex-col items-center w-full max-w-sm">
            {/* FOTO USTH. HALWAA — POP-OUT DARI BELAKANG KOTAK (HANYA BANTAN BAWAH 5% TERTUTUP) */}
            <div className="relative z-0 -mb-2 sm:-mb-2.5 w-36 sm:w-44 h-36 sm:h-44 pointer-events-none flex justify-center items-end">
              <img
                src="/images/halwaa/peringatan.webp"
                alt="Usth. Halwaa Warning"
                className="w-full h-full object-contain drop-shadow-2xl"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                  const fallbackEl = document.getElementById('halwaa-fallback-icon');
                  if (fallbackEl) fallbackEl.style.display = 'flex';
                }}
              />
              <div
                id="halwaa-fallback-icon"
                className="hidden w-20 h-20 rounded-full bg-amber-100 border-2 border-amber-400 text-amber-700 flex-col items-center justify-center shadow-lg"
              >
                <AlertCircle className="w-10 h-10" />
              </div>
            </div>

            {/* KOTAK POP-UP — DI DEPAN FOTO (HANYA TEKS + TOMBOL) */}
            <div className="relative z-10 bg-white rounded-3xl w-full p-6 space-y-4 shadow-2xl border-2 border-amber-300 text-center animate-in zoom-in-95 duration-200">
              {/* Teks Peringatan */}
              <div className="space-y-2">
                <h3 className="font-serif font-black text-amber-950 text-base sm:text-lg leading-tight">
                  Peringatan Pembatalan Kartu Gold
                </h3>
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                  Us, apakah Us yakin ingin mereset status <strong className="text-amber-950">&quot;Kartu Hitam Gold&quot;</strong> untuk santri <strong className="text-stone-900">{activeItem.nama}</strong> ({activeItem.kode}) kembali ke <strong className="text-rose-600 font-bold">BELUM</strong>?
                </p>
              </div>

              {/* Tombol */}
              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirmModal(false)}
                  disabled={isUpdatingKartuGold}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={onConfirmResetKartuHitamGold}
                  disabled={isUpdatingKartuGold}
                  className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-serif font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-50"
                >
                  {isUpdatingKartuGold ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <span>Ya, Reset</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
