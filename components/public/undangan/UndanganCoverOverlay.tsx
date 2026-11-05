'use client';

import Link from 'next/link';
import { AlertCircle, MessageCircle, MailOpen } from 'lucide-react';
import CanvasRevealMask from '@/components/landing/CanvasRevealMask';
import GlassCard from '@/components/GlassCard';
import ScrollReveal from '@/components/ScrollReveal';
import HeaderUndangan from '@/components/HeaderUndangan';
import HeaderUndanganWali from '@/components/HeaderUndanganWali';
import { cleanKategoriTamatan } from '@/lib/types';
import { renderTamuName, renderAlamatTamu } from './UndanganEffects';
import { SkeletonText } from '@/components/ui/GlassSkeleton';

export function UndanganNotFoundView({ finalWaNo }: { finalWaNo: string }) {
  return (
    <div className="min-h-screen bg-[#F0F9FF] flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none relative z-10">
      <CanvasRevealMask />
      <div className="max-w-md w-full p-6 sm:p-8 space-y-6 relative z-20">
        <div className="flex justify-center">
          <img
            src="/images/logo-haul-blue.png"
            alt="Logo Haul & Haflah P3TQ MHMTQ"
            className="h-16 sm:h-20 w-auto object-contain drop-shadow-sm"
          />
        </div>

        <div className="flex items-center justify-center gap-3 text-[#1D4ED8]/60">
          <div className="h-px bg-gradient-to-r from-transparent via-[#BAE6FD] to-transparent flex-1" />
          <span className="text-xs">❖</span>
          <div className="h-px bg-gradient-to-r from-transparent via-[#BAE6FD] to-transparent flex-1" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 text-[#1D4ED8] mb-1">
            <AlertCircle className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-black text-[#0F2C59]">
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
            className="w-full py-3 px-6 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-medium text-xs sm:text-sm shadow-md transition-all active:scale-95 inline-flex items-center justify-center space-x-2"
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
    <div className="min-h-screen h-full flex flex-col items-center justify-center p-4 sm:p-6 text-center relative z-20 overflow-hidden">
      <ScrollReveal>
        <div className="max-w-md md:max-w-2xl lg:max-w-3xl w-full p-2 sm:p-4 md:px-6 space-y-6 text-center relative animate-in fade-in zoom-in-95 duration-300">
          <HeaderUndangan titleType="UNDANGAN RESMI" />

          <div className="flex items-center justify-center gap-3 my-2 text-[#1D4ED8]/60">
            <div className="h-px bg-gradient-to-r from-transparent via-[#BAE6FD] to-transparent flex-1" />
            <span className="text-xs">❖</span>
            <div className="h-px bg-gradient-to-r from-transparent via-[#BAE6FD] to-transparent flex-1" />
          </div>

          <div className="space-y-1.5 py-1">
            <span className="text-xs text-stone-600 uppercase tracking-wider font-semibold">
              Kepada Yth. Bapak/Ibu/Saudara:
            </span>
            {item?.nama || item?.namaPutra || item?.namaPutri ? (
              <>
                {renderTamuName(item)}
                {renderAlamatTamu(item)}
              </>
            ) : (
              <div className="space-y-1.5 py-1">
                <SkeletonText width="70%" height="1.5rem" className="mx-auto" />
                <SkeletonText width="40%" height="1rem" className="mx-auto" />
              </div>
            )}
          </div>

          <div className="pt-2 space-y-3 max-w-md mx-auto w-full">
            <button
              type="button"
              onClick={onOpen}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#1D4ED8] via-[#3B82F6] to-[#1D4ED8] hover:brightness-105 text-white font-serif font-black text-sm tracking-wide shadow-xl transition-all active:scale-95 flex items-center justify-center space-x-2 border border-sky-200/50 cursor-pointer animate-pulse focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
            >
              <MailOpen className="w-4 h-4 text-amber-200" />
              <span>Buka Undangan</span>
            </button>
          </div>
        </div>
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
    <div className="min-h-screen h-full flex flex-col items-center justify-center p-4 sm:p-6 text-center relative z-20 overflow-hidden">
      <ScrollReveal>
        <div className="max-w-md md:max-w-2xl lg:max-w-3xl w-full p-2 sm:p-4 md:px-6 space-y-6 text-center relative animate-in fade-in zoom-in-95 duration-300">
          <div className="text-[10px] sm:text-xs font-serif font-black tracking-widest text-[#1D4ED8] uppercase text-center mb-1">
            UNDANGAN RESMI WALI SANTRI
          </div>

          <HeaderUndanganWali />

          <div className="h-px bg-gradient-to-r from-transparent via-[#BAE6FD] to-transparent my-2" />

          <div className="space-y-2 py-1">
            <span className="text-xs text-stone-600 uppercase tracking-wider font-semibold">
              Kepada Yth. Bapak/Ibu Wali Santri dari:
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-black text-[#0F2C59] drop-shadow-xs">
              {santri?.nama || item?.entitas?.nama || item?.nama || (
                <SkeletonText width="65%" height="1.75rem" className="mx-auto my-1" />
              )}
            </h2>
            <div className="inline-block px-3.5 py-1 rounded-full bg-white/70 backdrop-blur-xs text-[#1D4ED8] text-xs font-bold border border-white/80 max-w-full leading-normal break-words text-center shadow-xs">
              {santri
                ? santri.kamar && santri.kamar !== '-'
                  ? `${cleanKategoriTamatan(santri.subKategori) || 'Santri'} · ${santri.kamar}`
                  : (cleanKategoriTamatan(santri.subKategori) || 'Santri')
                : (
                  <SkeletonText width="5rem" height="0.875rem" className="mx-auto" />
                )}
            </div>
          </div>

          <div className="pt-2 space-y-3 max-w-md mx-auto w-full">
            <button
              type="button"
              onClick={onOpen}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#1D4ED8] via-[#3B82F6] to-[#1D4ED8] hover:brightness-105 text-white font-serif font-black text-sm tracking-wide shadow-xl transition-all active:scale-95 flex items-center justify-center space-x-2 border border-sky-200/50 cursor-pointer animate-pulse focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
            >
              <MailOpen className="w-4 h-4 text-amber-200" />
              <span>Buka Undangan</span>
            </button>
          </div>
        </div>
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
