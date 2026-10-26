'use client';

import Link from 'next/link';
import { AlertCircle, MessageCircle, MailOpen, ChevronDown } from 'lucide-react';
import PortalBackground from '@/components/PortalBackground';
import GlassCard from '@/components/GlassCard';
import ScrollReveal from '@/components/ScrollReveal';
import HeaderUndangan from '@/components/HeaderUndangan';
import HeaderUndanganWali from '@/components/HeaderUndanganWali';
import { renderTamuName, renderAlamatTamu } from './UndanganEffects';

export function UndanganNotFoundView({ finalWaNo }: { finalWaNo: string }) {
  return (
    <div className="min-h-screen bg-[#FAF7F3] flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none relative z-10">
      <PortalBackground />
      <div className="max-w-md w-full bg-white/85 backdrop-blur-md border-2 border-[#D5C4B4] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 relative z-20">
        <div className="flex justify-center">
          <img
            src="/images/logo-haul-gold.png"
            alt="Logo Haul & Haflah P3TQ MHMTQ"
            className="h-16 sm:h-20 w-auto object-contain drop-shadow-sm"
          />
        </div>

        <div className="flex items-center justify-center gap-3 text-[#8C6A47]/60">
          <div className="h-px bg-gradient-to-r from-transparent via-[#D5C4B4] to-transparent flex-1" />
          <span className="text-xs">❖</span>
          <div className="h-px bg-gradient-to-r from-transparent via-[#D5C4B4] to-transparent flex-1" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-[#8C6A47] mb-1">
            <AlertCircle className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-black text-[#422F21]">
            Kode Undangan Tidak Ditemukan
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Mohon maaf, kode undangan tidak ditemukan. Silakan periksa kembali tautan undangan resmi Anda atau hubungi Sekretariat Panitia.
          </p>
        </div>

        <div className="pt-2 space-y-2.5">
          <a
            href={`https://wa.me/${finalWaNo}?text=${encodeURIComponent("Assalamu'alaikum, saya ingin konfirmasi link undangan Haflah.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-6 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs sm:text-sm shadow-md transition-all active:scale-95 inline-flex items-center justify-center space-x-2"
          >
            <MessageCircle className="w-4 h-4 text-emerald-200" />
            <span>Hubungi Panitia via WhatsApp</span>
          </a>
          <Link
            href="/"
            className="w-full py-2.5 px-6 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-xs sm:text-sm transition-all inline-flex items-center justify-center space-x-2"
          >
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </div>
      <p className="text-[11px] text-stone-500 mt-6 font-medium relative z-20">
        © 2027 Haflah Akhirussanah P3TQ &amp; MHMTQ Lirboyo Kediri
      </p>
    </div>
  );
}

export function UndanganCoverTamu({
  item,
  onOpen,
}: {
  item: any;
  onOpen: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 text-center relative z-20">
      <ScrollReveal>
        <GlassCard className="max-w-md w-full p-6 sm:p-10 border-2 border-[#D5C4B4]/80 shadow-2xl space-y-6 relative overflow-hidden">
          <HeaderUndangan titleType="UNDANGAN RESMI" />

          <div className="flex items-center justify-center gap-3 my-2 text-[#8C6A47]/60">
            <div className="h-px bg-gradient-to-r from-transparent via-[#D5C4B4] to-transparent flex-1" />
            <span className="text-xs">❖</span>
            <div className="h-px bg-gradient-to-r from-transparent via-[#D5C4B4] to-transparent flex-1" />
          </div>

          <div className="space-y-1.5 py-1">
            <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold">
              Kepada Yth. Bapak/Ibu/Saudara:
            </span>
            {renderTamuName(item)}

            {renderAlamatTamu(item)}
          </div>

          <div className="pt-2 space-y-3">
            <button
              type="button"
              onClick={onOpen}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#8C6A47] via-[#A47E57] to-[#8C6A47] hover:brightness-105 text-white font-serif font-black text-sm tracking-wide shadow-xl transition-all active:scale-95 flex items-center justify-center space-x-2 border border-amber-200/50 cursor-pointer animate-pulse"
            >
              <MailOpen className="w-4 h-4 text-amber-200" />
              <span>Buka Undangan ✉️</span>
            </button>

            <div className="pt-1 flex flex-col items-center space-y-1 text-stone-500 animate-bounce">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C6A47]">
                Scroll ke Bawah ✦
              </span>
              <ChevronDown className="w-4 h-4 text-[#8C6A47]" />
            </div>
          </div>
        </GlassCard>
      </ScrollReveal>
    </div>
  );
}

export function UndanganCoverWali({
  item,
  santri,
  onOpen,
}: {
  item: any;
  santri: any;
  onOpen: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 text-center relative z-20">
      <ScrollReveal>
        <GlassCard className="max-w-md w-full p-6 sm:p-10 border-2 border-[#D5C4B4]/80 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="text-[10px] sm:text-xs font-serif font-black tracking-widest text-[#8C6A47] uppercase text-center">
            UNDANGAN RESMI WALI SANTRI
          </div>

          <HeaderUndanganWali />

          <div className="h-px bg-gradient-to-r from-transparent via-[#D5C4B4] to-transparent my-2" />

          <div className="space-y-2 py-1">
            <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold">
              Kepada Yth. Bapak/Ibu Wali Santri dari:
            </span>
            <h2 className="text-lg sm:text-xl font-serif font-black text-[#422F21]">
              {santri?.nama || item?.entitas?.nama || 'Wali Santri'}
            </h2>
            <div className="inline-block px-3 py-1 rounded-full bg-[#FAF0E6]/90 text-[#8C6A47] text-xs font-bold border border-[#D5C4B4]">
              {santri
                ? santri.kamar && santri.kamar !== '-'
                  ? `${santri.subKategori || 'Santri'} · ${santri.kamar}`
                  : (santri.subKategori || 'Santri')
                : 'Wali Santri'}
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <button
              type="button"
              onClick={onOpen}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#8C6A47] via-[#A47E57] to-[#8C6A47] hover:brightness-105 text-white font-serif font-black text-sm tracking-wide shadow-xl transition-all active:scale-95 flex items-center justify-center space-x-2 border border-amber-200/50 cursor-pointer animate-pulse"
            >
              <MailOpen className="w-4 h-4 text-amber-200" />
              <span>Buka Undangan ✉️</span>
            </button>

            <div className="pt-1 flex flex-col items-center space-y-1 text-stone-500 animate-bounce">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C6A47]">
                Scroll ke Bawah ✦
              </span>
              <ChevronDown className="w-4 h-4 text-[#8C6A47]" />
            </div>
          </div>
        </GlassCard>
      </ScrollReveal>
    </div>
  );
}

export default function UndanganCoverOverlay({
  isTamu,
  item,
  santri,
  onOpen,
}: {
  isTamu: boolean;
  item: any;
  santri?: any;
  onOpen: () => void;
}) {
  if (isTamu) {
    return <UndanganCoverTamu item={item} onOpen={onOpen} />;
  }
  return <UndanganCoverWali item={item} santri={santri} onOpen={onOpen} />;
}
