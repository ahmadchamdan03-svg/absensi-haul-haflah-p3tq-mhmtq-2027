'use client';

import React from 'react';
import QRCode from 'react-qr-code';
import { CheckCircle2, XCircle } from 'lucide-react';
import { formatQrPayloadSync } from '@/lib/hmac';
import NamaLembaga from '@/components/NamaLembaga';
import GlassCard from '@/components/GlassCard';
import ScrollReveal from '@/components/ScrollReveal';

interface UndanganTamuRsvpAndFooterProps {
  item: any;
  kodeSH: string;
  fullQrPayload: string;
  savingRsvp: boolean;
  rsvpError: string | null;
  tamuRsvpSaved: boolean;
  onKonfirmasiTamu: (status: 'HADIR' | 'BERHALANGAN') => void;
}

export default function UndanganTamuRsvpAndFooter({
  item,
  kodeSH,
  fullQrPayload,
  savingRsvp,
  rsvpError,
  tamuRsvpSaved,
  onKonfirmasiTamu,
}: UndanganTamuRsvpAndFooterProps) {
  return (
    <>
      {/* 6a. KARTU QR CODE GERBANG MASUK TAMU */}
      <ScrollReveal delay={350}>
        <div className="bg-white rounded-3xl p-5 sm:p-7 md:p-8 border-2 border-[#8C6A47] shadow-lg text-center space-y-5">
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#8C6A47]">
              KODE AKSES RESMI LOKASI ACARA
            </span>
            <h3 className="font-serif font-black text-lg text-[#322116]">
              Tunjukkan QR Code Ini Kepada Petugas
            </h3>
            <p className="text-xs text-[#8C6A47] font-semibold">
              Mohon QR Code disimpan dan ditunjukkan kepada petugas saat memasuki Lokasi acara.
            </p>
            <p className="text-[11px] text-stone-500">
              Pintu registrasi dibuka mulai pukul <strong>06.30 WIB / 07.00 WIs</strong>
            </p>
          </div>

          <div className="flex flex-col items-center justify-center">
            <div className="p-4 rounded-3xl bg-[#FAF7F3] border-2 border-[#D5C4B4] shadow-inner max-w-[260px] w-full aspect-square flex items-center justify-center">
              {item?.kode || kodeSH ? (
                <QRCode
                  value={fullQrPayload || formatQrPayloadSync(item?.kode || kodeSH)}
                  size={220}
                  bgColor="#FAF7F3"
                  fgColor="#422F21"
                  level="M"
                  style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                />
              ) : (
                <div className="text-xs font-serif font-bold text-stone-500">Kode tidak tersedia</div>
              )}
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* 6b. KARTU KONFIRMASI KEHADIRAN (RSVP TAMU UNDANGAN) */}
      <ScrollReveal delay={400}>
        <GlassCard className="p-5 sm:p-7 md:p-8 border-2 border-[#E8DFD5]/80 shadow-sm space-y-5 text-center">
          <div className="space-y-1">
            <h3 className="font-serif font-black text-base sm:text-lg text-[#422F21]">
              Konfirmasi Kehadiran
            </h3>
            <p className="text-xs text-[#7A624E]">
              Mohon konfirmasi kehadiran Anda agar panitia dapat menyiapkan tempat dengan baik.
            </p>
          </div>

          {item?.estimasi?.statusKonfirmasi === 'HADIR' || item?.estimasi?.statusKonfirmasi === 'SUDAH' ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 space-y-2">
              <div className="font-serif font-black text-sm text-emerald-900 flex items-center justify-center space-x-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                <span>✓ Terkonfirmasi Hadir</span>
              </div>
              <p className="text-xs text-emerald-800">
                Terima kasih! Anda telah mengonfirmasi untuk <strong>HADIR</strong> pada Haul &amp; Haflah P3TQ - MHMTQ 2027.
              </p>
            </div>
          ) : item?.estimasi?.statusKonfirmasi === 'BERHALANGAN' ? (
            <div className="p-4 rounded-2xl bg-stone-100 border-2 border-stone-300 text-stone-800 space-y-2">
              <div className="font-serif font-black text-sm text-stone-900 flex items-center justify-center space-x-1.5">
                <XCircle className="w-5 h-5 text-stone-600" />
                <span>✗ Berhalangan Hadir</span>
              </div>
              <p className="text-xs text-stone-700">
                Terima kasih atas konfirmasi Anda. Doa restu Bapak/Ibu/Saudara sangat bermakna bagi kami.
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => onKonfirmasiTamu('HADIR')}
              disabled={savingRsvp}
              className={`py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 active:scale-95 ${
                item?.estimasi?.statusKonfirmasi === 'HADIR' || item?.estimasi?.statusKonfirmasi === 'SUDAH'
                  ? 'bg-emerald-800 text-white ring-2 ring-emerald-400'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>✓ Saya Hadir</span>
            </button>

            <button
              type="button"
              onClick={() => onKonfirmasiTamu('BERHALANGAN')}
              disabled={savingRsvp}
              className={`py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm border shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 active:scale-95 ${
                item?.estimasi?.statusKonfirmasi === 'BERHALANGAN'
                  ? 'bg-stone-300 text-stone-900 border-stone-400 ring-2 ring-stone-400'
                  : 'bg-stone-200 hover:bg-stone-300 text-stone-800 border-stone-300'
              }`}
            >
              <XCircle className="w-4 h-4 text-stone-600" />
              <span>✗ Saya Berhalangan Hadir</span>
            </button>
          </div>

          {rsvpError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
              ⚠️ {rsvpError}
            </div>
          )}

          {tamuRsvpSaved && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs text-center font-bold animate-in fade-in">
              ✓ Konfirmasi berhasil disimpan ke sistem panitia.
            </div>
          )}
        </GlassCard>
      </ScrollReveal>

      {/* 8. FOOTER TANDA TANGAN PANITIA */}
      <ScrollReveal delay={450}>
        <GlassCard className="p-5 sm:p-7 md:p-8 border-2 border-[#E8DFD5]/80 shadow-sm text-center space-y-5 text-xs font-serif text-[#422F21]">
          <p className="italic text-stone-600 leading-relaxed text-center">
            Atas perhatian dan kehadiran Bapak/Ibu/Saudara/i, kami sampaikan terima kasih.<br />
            Jazakumullahu khairan katsiran.
          </p>

          <div className="pt-4 border-t border-[#E8DFD5] grid grid-cols-2 gap-3 md:gap-6 max-w-md mx-auto text-center">
            <div className="text-center space-y-1">
              <p className="text-[10px] md:text-xs font-serif uppercase tracking-widest text-[#8C6A47] font-semibold">
                KETUA UMUM
              </p>
              <p className="pt-3 font-serif font-bold text-sm md:text-base text-[#422F21]">
                (Sinta Maelani)
              </p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-[10px] md:text-xs font-serif uppercase tracking-widest text-[#8C6A47] font-semibold">
                SEKRETARIS UMUM
              </p>
              <p className="pt-3 font-serif font-bold text-sm md:text-base text-[#422F21]">
                (Refi Al Izzatul Kholifah)
              </p>
            </div>
          </div>

          <div className="pt-3 text-[#8C6A47] font-serif italic text-xs md:text-sm font-bold text-center">
            Wassalamu'alaikum Warahmatullahi Wabarakatuh
          </div>

          <div className="pt-2 border-t border-stone-100">
            <NamaLembaga align="center" size="xs" weight="medium" color="text-stone-500" />
            <p className="text-[10px] text-stone-400 mt-0.5 font-semibold">Lirboyo Kediri</p>
          </div>
        </GlassCard>
      </ScrollReveal>
    </>
  );
}
