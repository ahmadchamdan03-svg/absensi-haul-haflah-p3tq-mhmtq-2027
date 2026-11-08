'use client';

import React from 'react';
import { CheckCircle2, MessageCircle, Loader2 } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import ScrollReveal from '@/components/ScrollReveal';

interface UndanganWaliRsvpSectionProps {
  item: any;
  totalKuotaSantri: number;
  estL: number;
  setEstL: React.Dispatch<React.SetStateAction<number>>;
  estP: number;
  setEstP: React.Dispatch<React.SetStateAction<number>>;
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
    <ScrollReveal delay={300} variant="zoom-in">
      <GlassCard className="p-4 sm:p-6 md:p-8 space-y-4">
        {/* HEADER KONFIRMASI */}
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-1">
            <h3 className="font-serif font-black text-base text-[#0F2C59]">
              Konfirmasi Kehadiran
            </h3>
            <p className="text-xs md:text-sm text-[#7A624E] text-left">
              Bantu panitia menyiapkan kursi Anda dengan mengisi perkiraan jumlah kehadiran di bawah ini.
            </p>
          </div>
          {item?.estimasi?.statusKonfirmasi === 'SUDAH' && (
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 shrink-0">
              ✓ Terkonfirmasi
            </span>
          )}
        </div>

        {/* STACK VERTIKAL (PUTRA & PUTRI) */}
        <div className="space-y-4 md:space-y-5 pt-1">
          {/* WALI SANTRI PUTRA */}
          <div>
            <p className="text-sm md:text-base font-semibold text-[#0F2C59] mb-2 text-left">
              WALI SANTRI PUTRA
            </p>
            <div className="grid grid-cols-3 gap-2 w-full">
              <button
                type="button"
                onClick={() => setEstL((p) => Math.max(0, p - 1))}
                disabled={estL === 0}
                className="h-10 rounded-lg bg-[#1D4ED8] text-white text-xl font-bold flex items-center justify-center transition-opacity disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-stone-400 active:scale-95 cursor-pointer"
                title="Kurangi Wali Santri Putra"
              >
                −
              </button>
              <div className="h-10 rounded-lg bg-white/80 backdrop-blur-xs border border-[#1D4ED8]/30 flex items-center justify-center text-lg font-bold text-[#0F2C59]">
                {estL}
              </div>
              <button
                type="button"
                onClick={() => setEstL((p) => (totalInputWali < totalKuotaSantri ? p + 1 : p))}
                disabled={totalInputWali >= totalKuotaSantri}
                className="h-10 rounded-lg bg-[#1D4ED8] text-white text-xl font-bold flex items-center justify-center transition-opacity disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-stone-400 active:scale-95 cursor-pointer"
                title="Tambah Wali Santri Putra"
              >
                +
              </button>
            </div>
            <p className="text-[10px] md:text-xs italic text-stone-500 mt-1">Zona Putra</p>
          </div>

          {/* WALI SANTRI PUTRI */}
          <div>
            <p className="text-sm md:text-base font-semibold text-[#0F2C59] mb-2 text-left">
              WALI SANTRI PUTRI
            </p>
            <div className="grid grid-cols-3 gap-2 w-full">
              <button
                type="button"
                onClick={() => setEstP((p) => Math.max(0, p - 1))}
                disabled={estP === 0}
                className="h-10 rounded-lg bg-[#1D4ED8] text-white text-xl font-bold flex items-center justify-center transition-opacity disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-stone-400 active:scale-95 cursor-pointer"
                title="Kurangi Wali Santri Putri"
              >
                −
              </button>
              <div className="h-10 rounded-lg bg-white/80 backdrop-blur-xs border border-[#1D4ED8]/30 flex items-center justify-center text-lg font-bold text-[#0F2C59]">
                {estP}
              </div>
              <button
                type="button"
                onClick={() => setEstP((p) => (totalInputWali < totalKuotaSantri ? p + 1 : p))}
                disabled={totalInputWali >= totalKuotaSantri}
                className="h-10 rounded-lg bg-[#1D4ED8] text-white text-xl font-bold flex items-center justify-center transition-opacity disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-stone-400 active:scale-95 cursor-pointer"
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
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#1D4ED8] to-[#3B82F6] hover:brightness-105 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
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
          className="w-full py-3 rounded-2xl bg-white border-2 border-[#1D4ED8] text-[#0F2C59] hover:bg-[#F0F9FF] font-bold text-xs shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
          title="Hubungi Panitia via WhatsApp untuk Menyampaikan Hal Khusus"
        >
          <MessageCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Ada Hal Khusus? Hubungi Panitia</span>
        </a>

        {rsvpError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs text-center font-bold">
            ⚠️ {rsvpError}
          </div>
        )}

        {estimasiSaved && (
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs text-center font-bold animate-in fade-in">
            ✓ Konfirmasi kehadiran Anda berhasil disimpan ke sistem panitia Supabase
            {lastSavedTime ? ` pada ${lastSavedTime}` : ''}.
          </div>
        )}
      </GlassCard>
    </ScrollReveal>
  );
}
