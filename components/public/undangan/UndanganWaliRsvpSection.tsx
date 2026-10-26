'use client';

import React from 'react';
import TimePicker from 'react-time-picker';
import { Clock, CheckCircle2, MessageCircle, Loader2 } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import ScrollReveal from '@/components/ScrollReveal';

interface UndanganWaliRsvpSectionProps {
  item: any;
  totalKuotaSantri: number;
  estL: number;
  setEstL: React.Dispatch<React.SetStateAction<number>>;
  estP: number;
  setEstP: React.Dispatch<React.SetStateAction<number>>;
  jamKonfirmasi: string;
  setJamKonfirmasi: (val: string) => void;
  hariKonfirmasi: '' | 'JUMAT' | 'SABTU' | string;
  setHariKonfirmasi: React.Dispatch<React.SetStateAction<'' | 'JUMAT' | 'SABTU'>>;
  rsvpValidationErr: string | null;
  setRsvpValidationErr: (val: string | null) => void;
  isMounted: boolean;
  isMobileDevice: boolean;
  clockWrapperRef: React.RefObject<HTMLDivElement>;
  isClockOpen: boolean;
  setIsClockOpen: (val: boolean) => void;
  clockMode: 'hours' | 'minutes';
  setClockMode: (val: 'hours' | 'minutes') => void;
  savingRsvp: boolean;
  isWaliRsvpExceeded: boolean;
  handleSimpanEstimasiWali: () => void;
  waHalKhususLink: string;
  rsvpError: string | null;
  estimasiSaved: boolean;
  lastSavedTime: string;
}

export default function UndanganWaliRsvpSection({
  item,
  totalKuotaSantri,
  estL,
  setEstL,
  estP,
  setEstP,
  jamKonfirmasi,
  setJamKonfirmasi,
  hariKonfirmasi,
  setHariKonfirmasi,
  rsvpValidationErr,
  setRsvpValidationErr,
  isMounted,
  isMobileDevice,
  clockWrapperRef,
  isClockOpen,
  setIsClockOpen,
  clockMode,
  setClockMode,
  savingRsvp,
  isWaliRsvpExceeded,
  handleSimpanEstimasiWali,
  waHalKhususLink,
  rsvpError,
  estimasiSaved,
  lastSavedTime,
}: UndanganWaliRsvpSectionProps) {
  const totalInputWali = estL + estP;

  return (
    <ScrollReveal delay={300}>
      <GlassCard className="p-4 sm:p-6 md:p-8 border-2 border-[#E8DFD5]/80 shadow-sm space-y-4 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-1">
            <h3 className="font-serif font-black text-base text-[#422F21]">
              Konfirmasi Kehadiran (RSVP)
            </h3>
            <p className="text-xs md:text-sm text-[#7A624E] text-left">
              Bantu panitia menyiapkan kursi Anda dengan mengisi perkiraan jumlah kehadiran di bawah ini.
            </p>
          </div>
          {item?.estimasi?.statusKonfirmasi === 'SUDAH' && (
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
              ✓ Terkonfirmasi
            </span>
          )}
        </div>

        {/* FORMAT 2 KOLOM: JAM (KIRI) & HARI (KANAN) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#D5C4B4]">
          {/* KOLOM KIRI: CLOCK PICKER 24 JAM */}
          <div
            className={`p-3 rounded-xl bg-white border transition-all ${
              !jamKonfirmasi && rsvpValidationErr
                ? 'border-rose-400 bg-rose-50/30 ring-1 ring-rose-300'
                : 'border-[#D5C4B4]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-serif font-black text-[#422F21] uppercase tracking-wide">
                ⏰ Jam Kedatangan:
              </label>
              <div className="text-xs font-bold text-[#8C6A47] px-2.5 py-1 bg-[#FAF7F3] rounded-xl border border-[#D5C4B4] shrink-0 font-mono shadow-2xs">
                {jamKonfirmasi ? `${jamKonfirmasi} WIB` : 'Belum dipilih'}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="w-full">
                {isMounted && !isMobileDevice ? (
                  <div ref={clockWrapperRef} className="relative z-50 w-full">
                    <TimePicker
                      value={jamKonfirmasi || null}
                      onChange={(val) => {
                        if (val) {
                          setJamKonfirmasi(String(val));
                          setRsvpValidationErr(null);
                        }
                      }}
                      format="HH:mm"
                      disableClock={false}
                      clearIcon={null}
                      isOpen={isClockOpen}
                      onClockOpen={() => setIsClockOpen(true)}
                      onClockClose={() => setIsClockOpen(false)}
                      clockIcon={<Clock className="w-4 h-4 text-[#8C6A47]" />}
                      className={`custom-time-picker z-50 w-full ${
                        !jamKonfirmasi && rsvpValidationErr ? 'has-error' : ''
                      }`}
                      locale="id-ID"
                      hourPlaceholder="00"
                      minutePlaceholder="00"
                      clockProps={{ renderNumbers: true }}
                    />
                  </div>
                ) : (
                  <div className="relative w-full">
                    <Clock className="w-4 h-4 text-[#8C6A47] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="time"
                      value={jamKonfirmasi}
                      onChange={(e) => {
                        setJamKonfirmasi(e.target.value);
                        setRsvpValidationErr(null);
                      }}
                      className={`w-full pl-9 pr-3 py-2 text-sm font-mono font-bold rounded-xl bg-white border text-[#422F21] focus:outline-hidden focus:ring-2 focus:ring-[#8C6A47] ${
                        !jamKonfirmasi && rsvpValidationErr ? 'border-rose-400' : 'border-[#D5C4B4]'
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* Toolbar Kontrol Clock Picker Interaktif (Desktop) */}
              {isMounted && !isMobileDevice && isClockOpen && (
                <div className="flex items-center justify-between w-full pt-1 px-1 text-xs">
                  <div className="flex items-center gap-1 bg-stone-100/90 p-0.5 rounded-lg border border-[#D5C4B4]">
                    <button
                      type="button"
                      onClick={() => setClockMode('hours')}
                      className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                        clockMode === 'hours'
                          ? 'bg-[#8C6A47] text-white shadow-xs'
                          : 'text-[#7A624E] hover:bg-stone-200/60'
                      }`}
                    >
                      🕒 Jam
                    </button>
                    <button
                      type="button"
                      onClick={() => setClockMode('minutes')}
                      className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                        clockMode === 'minutes'
                          ? 'bg-[#8C6A47] text-white shadow-xs'
                          : 'text-[#7A624E] hover:bg-stone-200/60'
                      }`}
                    >
                      ⏱️ Menit
                    </button>
                  </div>

                  <div className="flex items-center gap-1 bg-stone-100/90 p-0.5 rounded-lg border border-[#D5C4B4]">
                    <button
                      type="button"
                      onClick={() => {
                        const parts = (jamKonfirmasi || '08:00').split(':');
                        let h = parseInt(parts[0], 10);
                        if (isNaN(h)) h = 8;
                        if (h >= 12) h = h - 12;
                        const m = parts[1] || '00';
                        setJamKonfirmasi(`${String(h).padStart(2, '0')}:${m}`);
                        setRsvpValidationErr(null);
                      }}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                        parseInt((jamKonfirmasi || '08:00').split(':')[0], 10) < 12
                          ? 'bg-[#8C6A47] text-white shadow-xs'
                          : 'text-[#7A624E] hover:bg-stone-200/60'
                      }`}
                    >
                      Pagi (00-11)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const parts = (jamKonfirmasi || '08:00').split(':');
                        let h = parseInt(parts[0], 10);
                        if (isNaN(h)) h = 8;
                        if (h < 12) h = h + 12;
                        const m = parts[1] || '00';
                        setJamKonfirmasi(`${String(h).padStart(2, '0')}:${m}`);
                        setRsvpValidationErr(null);
                      }}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                        parseInt((jamKonfirmasi || '08:00').split(':')[0], 10) >= 12
                          ? 'bg-[#8C6A47] text-white shadow-xs'
                          : 'text-[#7A624E] hover:bg-stone-200/60'
                      }`}
                    >
                      Siang/Malam (12-23)
                    </button>
                  </div>
                </div>
              )}

              {/* Hint Interaksi Desktop */}
              {isMounted && !isMobileDevice && isClockOpen && (
                <p className="text-[10px] text-[#8C6A47] italic text-center -mt-1">
                  *Klik atau geser/drag lingkaran jam analog untuk memutar jarum waktu
                </p>
              )}
            </div>
          </div>

          {/* KOLOM KANAN: PILIHAN HARI KEDATANGAN */}
          <div
            className={`p-3 rounded-xl bg-white border flex flex-col justify-between transition-all ${
              !hariKonfirmasi && rsvpValidationErr
                ? 'border-rose-400 bg-rose-50/30 ring-1 ring-rose-300'
                : 'border-[#D5C4B4]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-serif font-black text-[#422F21] uppercase tracking-wide">
                  🗓️ Hari Kedatangan:
                </label>
                <span className="text-[10px] text-stone-500">Pilih salah satu</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setHariKonfirmasi('JUMAT');
                    setRsvpValidationErr(null);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center ${
                    hariKonfirmasi === 'JUMAT'
                      ? 'bg-[#8C6A47] text-white border-[#8C6A47] shadow-xs ring-2 ring-[#8C6A47]/30'
                      : 'bg-white text-[#7A624E] border-[#D5C4B4] hover:bg-[#FAF0E6]'
                  }`}
                >
                  Jum'at (24 Rajab)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHariKonfirmasi('SABTU');
                    setRsvpValidationErr(null);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center ${
                    hariKonfirmasi === 'SABTU'
                      ? 'bg-[#8C6A47] text-white border-[#8C6A47] shadow-xs ring-2 ring-[#8C6A47]/30'
                      : 'bg-white text-[#7A624E] border-[#D5C4B4] hover:bg-[#FAF0E6]'
                  }`}
                >
                  Sabtu (25 Rajab)
                </button>
              </div>
            </div>

            <div className="text-[10px] text-stone-500 pt-2 text-center">
              {hariKonfirmasi ? (
                <span className="text-emerald-700 font-bold">
                  ✓ Terpilih: {hariKonfirmasi === 'JUMAT' ? "Jum'at" : 'Sabtu'}
                </span>
              ) : (
                <span className="text-stone-400 italic">Belum menentukan hari</span>
              )}
            </div>
          </div>
        </div>

        {/* PESAN VALIDASI HARI & JAM */}
        {rsvpValidationErr && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold text-center animate-in fade-in">
            ⚠️ {rsvpValidationErr}
          </div>
        )}

        {/* STACK VERTIKAL (PUTRA & PUTRI) */}
        <div className="space-y-4 md:space-y-5 pt-1">
          {/* WALI SANTRI PUTRA */}
          <div>
            <p className="text-sm md:text-base font-semibold text-[#422F21] mb-2 text-left">
              WALI SANTRI PUTRA
            </p>
            <div className="grid grid-cols-3 gap-2 w-full">
              <button
                type="button"
                onClick={() => setEstL((p) => Math.max(0, p - 1))}
                disabled={estL === 0}
                className="h-10 rounded-lg bg-[#8C6A47] text-white text-xl font-bold flex items-center justify-center transition-opacity disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-stone-400 active:scale-95 cursor-pointer"
                title="Kurangi Wali Santri Putra"
              >
                −
              </button>
              <div className="h-10 rounded-lg bg-white border border-[#8C6A47]/30 flex items-center justify-center text-lg font-bold text-[#422F21]">
                {estL}
              </div>
              <button
                type="button"
                onClick={() => setEstL((p) => (totalInputWali < totalKuotaSantri ? p + 1 : p))}
                disabled={totalInputWali >= totalKuotaSantri}
                className="h-10 rounded-lg bg-[#8C6A47] text-white text-xl font-bold flex items-center justify-center transition-opacity disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-stone-400 active:scale-95 cursor-pointer"
                title="Tambah Wali Santri Putra"
              >
                +
              </button>
            </div>
            <p className="text-[10px] md:text-xs italic text-stone-500 mt-1">Zona Putra</p>
          </div>

          {/* WALI SANTRI PUTRI */}
          <div>
            <p className="text-sm md:text-base font-semibold text-[#422F21] mb-2 text-left">
              WALI SANTRI PUTRI
            </p>
            <div className="grid grid-cols-3 gap-2 w-full">
              <button
                type="button"
                onClick={() => setEstP((p) => Math.max(0, p - 1))}
                disabled={estP === 0}
                className="h-10 rounded-lg bg-[#8C6A47] text-white text-xl font-bold flex items-center justify-center transition-opacity disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-stone-400 active:scale-95 cursor-pointer"
                title="Kurangi Wali Santri Putri"
              >
                −
              </button>
              <div className="h-10 rounded-lg bg-white border border-[#8C6A47]/30 flex items-center justify-center text-lg font-bold text-[#422F21]">
                {estP}
              </div>
              <button
                type="button"
                onClick={() => setEstP((p) => (totalInputWali < totalKuotaSantri ? p + 1 : p))}
                disabled={totalInputWali >= totalKuotaSantri}
                className="h-10 rounded-lg bg-[#8C6A47] text-white text-xl font-bold flex items-center justify-center transition-opacity disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-stone-400 active:scale-95 cursor-pointer"
                title="Tambah Wali Santri Putri"
              >
                +
              </button>
            </div>
            <p className="text-[10px] md:text-xs italic text-stone-500 mt-1">Zona Putri</p>
          </div>
        </div>

        {/* ERROR INLINE SAAT JUMLAH MELEBIHI KUOTA */}
        {isWaliRsvpExceeded && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold text-center">
            ⚠️ Jumlah konfirmasi ({totalInputWali} orang) melebihi kuota Anda ({totalKuotaSantri} kursi).
            Mohon kurangi jumlahnya.
          </div>
        )}

        <button
          type="button"
          onClick={handleSimpanEstimasiWali}
          disabled={savingRsvp || isWaliRsvpExceeded}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#8C6A47] to-[#A47E57] hover:brightness-105 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
        >
          {savingRsvp ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-200" />
              <span>Menyimpan ke Sistem Panitia...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-amber-200" />
              <span>Simpan Konfirmasi Kehadiran</span>
            </>
          )}
        </button>

        <a
          href={waHalKhususLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 rounded-2xl bg-white border-2 border-[#8C6A47] text-[#422F21] hover:bg-[#FAF7F3] font-bold text-xs shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
          title="Hubungi Panitia via WhatsApp untuk Menyampaikan Hal Khusus"
        >
          <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Ada Hal Khusus? Hubungi Panitia</span>
        </a>

        {rsvpError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs text-center font-bold">
            ⚠️ {rsvpError}
          </div>
        )}

        {estimasiSaved && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs text-center font-bold animate-in fade-in">
            ✓ Konfirmasi kehadiran Anda berhasil disimpan ke sistem panitia Supabase
            {lastSavedTime ? ` pada ${lastSavedTime}` : ''}.
          </div>
        )}
      </GlassCard>
    </ScrollReveal>
  );
}
