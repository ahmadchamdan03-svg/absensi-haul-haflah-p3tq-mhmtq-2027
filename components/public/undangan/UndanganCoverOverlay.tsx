'use client';

import Link from 'next/link';
import { AlertCircle, MessageCircle, MailOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import CanvasRevealMask from '@/components/landing/CanvasRevealMask';
import ScrollReveal from '@/components/ScrollReveal';
import HeaderUndangan from '@/components/HeaderUndangan';
import HeaderUndanganWali from '@/components/HeaderUndanganWali';
import { cleanKategoriTamatan } from '@/lib/types';
import { formatTitleCase } from '@/lib/utils';
import { renderTamuName, renderAlamatTamu } from './UndanganEffects';
import { SkeletonText } from '@/components/ui/GlassSkeleton';

export function UndanganNotFoundView({ finalWaNo }: { finalWaNo: string }) {
  const targetWa = finalWaNo || '6285181805377';

  return (
    <div className="min-h-[100dvh] h-[100dvh] bg-[#0F2C59] text-white flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none relative z-10 overflow-hidden">
      <CanvasRevealMask />
      <div className="max-w-md w-full bg-[#0F2C59]/80 backdrop-blur-xl border border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.5)] rounded-3xl p-6 sm:p-8 space-y-6 relative z-20">
        <div className="flex justify-center">
          <img
            src="/logo-haul-haflah-transparent.png"
            alt="Logo Haul & Haflah P3TQ MHMTQ"
            className="h-16 sm:h-20 w-auto object-contain drop-shadow-[0_4px_12px_rgba(251,191,36,0.35)]"
          />
        </div>

        <div className="flex items-center justify-center gap-3 text-amber-400/60">
          <div className="h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent flex-1" />
          <span className="text-xs">❖</span>
          <div className="h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent flex-1" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 border border-white/20 text-amber-300 mb-1">
            <AlertCircle className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-black text-amber-400 drop-shadow-sm">
            Kode Undangan Tidak Ditemukan
          </h1>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-sans">
            Mohon maaf, kode undangan tidak ditemukan. Silakan periksa kembali tautan undangan resmi Anda atau hubungi Sekretariat Haflah di 0851-8180-5377.
          </p>
        </div>

        <div className="pt-2 space-y-2.5">
          <a
            href={`https://wa.me/${targetWa}?text=${encodeURIComponent("Assalamu'alaikum, saya ingin konfirmasi tautan undangan Haflah.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-6 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white font-medium text-xs sm:text-sm shadow-md transition-all active:scale-95 inline-flex items-center justify-center space-x-2 cursor-pointer hover:border-amber-400/50"
          >
            <MessageCircle className="w-4 h-4 text-emerald-300" />
            <span>Hubungi Sekretariat Haflah via WhatsApp</span>
          </a>
          <Link
            href="/"
            className="w-full py-2.5 px-6 rounded-2xl bg-white/10 hover:bg-white/15 text-white/90 font-medium text-xs sm:text-sm border border-white/15 transition-all inline-flex items-center justify-center space-x-2"
          >
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </div>
      <p className="text-[11px] text-white/60 mt-6 font-medium relative z-20">
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
    <div
      className="min-h-[100dvh] h-[100dvh] w-full max-w-md mx-auto flex flex-col justify-between items-center px-4 py-4 sm:py-6 text-center relative overflow-hidden select-none bg-[#0F2C59] shadow-2xl"
    >
      {/* BACKGROUND GAMBAR PANGGUNG AULA & EFEK REVEAL MASK (RIAK AIR) */}
      <CanvasRevealMask className="absolute inset-0 pointer-events-none overflow-hidden z-10" />

      {/* ORNAMEN LEMON BERGOYANG PELAN (POJOK KIRI ATAS) */}
      <motion.img
        src="/images/undangan-assets/lemon-branch.webp"
        alt="Ornamen Lemon"
        className="absolute -top-4 -left-4 w-28 sm:w-36 pointer-events-none z-20 drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
        animate={{ rotate: [0, 3, 0, -3, 0] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
      />

      {/* ORNAMEN MANDALA EMAS BERPUTAR PELAN (POJOK KANAN BAWAH) */}
      <motion.img
        src="/images/undangan-assets/mandala-gold.webp"
        alt="Pola Mandala Emas"
        className="absolute -bottom-10 -right-10 w-36 sm:w-44 pointer-events-none z-20 opacity-80 drop-shadow-[0_4px_16px_rgba(251,191,36,0.3)]"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
      />

      {/* 1. BAGIAN ATAS: ORNAMEN KUFI & HEADER RESMI (EMAS & PUTIH) */}
      <div className="w-full max-w-lg mx-auto pt-1 sm:pt-2 relative z-20">
        <ScrollReveal variant="zoom-in" duration={0.8}>
          <div className="w-full space-y-2 text-center">
            {/* Kaligrafi Kufi Ornamen Elegan dari CDR */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              className="flex justify-center -mb-1"
            >
              <img
                src="/images/undangan-assets/calligraphy-kufic.webp"
                alt="Kaligrafi Kufi Haflah"
                width={160}
                height={85}
                className="h-7 sm:h-9 w-auto object-contain opacity-90 drop-shadow-[0_2px_6px_rgba(251,191,36,0.3)]"
              />
            </motion.div>

            <HeaderUndangan titleType="UNDANGAN RESMI" variant="dark" />
          </div>
        </ScrollReveal>
      </div>

      {/* 2. BAGIAN TENGAH: GLASSMORPHISM CARD IDENTITAS PENERIMA */}
      <div className="w-full max-w-lg mx-auto my-auto py-2 relative z-20">
        <ScrollReveal variant="zoom-in" duration={0.8} delay={100}>
          <div className="w-full bg-[#0F2C59]/80 backdrop-blur-xl border border-white/20 shadow-[0_16px_48px_rgba(0,0,0,0.6)] rounded-3xl p-5 sm:p-6 space-y-3 relative z-20">
            <span className="text-[11px] sm:text-xs text-amber-200/90 uppercase tracking-widest font-semibold block drop-shadow-xs">
              Kepada Yth. Bapak/Ibu/Saudara:
            </span>

            {item?.nama || item?.namaPutra || item?.namaPutri ? (
              <div className="space-y-1">
                {renderTamuName(item, true)}
                {renderAlamatTamu(item, true)}
              </div>
            ) : (
              <div className="space-y-2 py-1">
                <SkeletonText width="70%" height="1.5rem" className="mx-auto" />
                <SkeletonText width="40%" height="1rem" className="mx-auto" />
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-1 text-amber-400/60">
              <div className="h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent flex-1" />
              <span className="text-xs">❖</span>
              <div className="h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent flex-1" />
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* 3. BAGIAN BAWAH: TOMBOL BUKA UNDANGAN (GLASSMORPHISM MEWAH, SELALU DI BAWAH) */}
      <div className="w-full max-w-lg mx-auto pb-4 sm:pb-6 relative z-20">
        <ScrollReveal variant="zoom-in" duration={0.8} delay={200}>
          <button
            type="button"
            onClick={onOpen}
            className="w-full py-3.5 px-6 rounded-2xl bg-white/20 hover:bg-white/30 active:bg-white/35 backdrop-blur-md border border-white/30 text-white font-serif font-black text-sm tracking-wider shadow-[0_8px_24px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_30px_rgba(251,191,36,0.3)] hover:border-amber-400/60 transition-all active:scale-95 flex items-center justify-center space-x-2.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
          >
            <MailOpen className="w-4 h-4 text-amber-300 animate-pulse" />
            <span className="tracking-widest uppercase">Buka Undangan</span>
          </button>
        </ScrollReveal>
      </div>
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
    <div
      className="min-h-[100dvh] h-[100dvh] w-full max-w-md mx-auto flex flex-col justify-between items-center px-4 py-4 sm:py-6 text-center relative overflow-hidden select-none bg-[#0F2C59] shadow-2xl"
    >
      {/* BACKGROUND GAMBAR PANGGUNG AULA & EFEK REVEAL MASK (RIAK AIR) */}
      <CanvasRevealMask className="absolute inset-0 pointer-events-none overflow-hidden z-10" />

      {/* ORNAMEN LEMON BERGOYANG PELAN (POJOK KIRI ATAS) */}
      <motion.img
        src="/images/undangan-assets/lemon-branch.webp"
        alt="Ornamen Lemon"
        className="absolute -top-4 -left-4 w-28 sm:w-36 pointer-events-none z-20 drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
        animate={{ rotate: [0, 3, 0, -3, 0] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
      />

      {/* ORNAMEN MANDALA EMAS BERPUTAR PELAN (POJOK KANAN BAWAH) */}
      <motion.img
        src="/images/undangan-assets/mandala-gold.webp"
        alt="Pola Mandala Emas"
        className="absolute -bottom-10 -right-10 w-36 sm:w-44 pointer-events-none z-20 opacity-80 drop-shadow-[0_4px_16px_rgba(251,191,36,0.3)]"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
      />

      {/* 1. BAGIAN ATAS: ORNAMEN KUFI & HEADER RESMI WALI (EMAS & PUTIH) */}
      <div className="w-full max-w-lg mx-auto pt-1 sm:pt-2 relative z-20">
        <ScrollReveal variant="zoom-in" duration={0.8}>
          <div className="w-full space-y-2 text-center">
            {/* Kaligrafi Kufi Ornamen Elegan dari CDR */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              className="flex justify-center -mb-1"
            >
              <img
                src="/images/undangan-assets/calligraphy-kufic.webp"
                alt="Kaligrafi Kufi Haflah"
                width={160}
                height={85}
                className="h-7 sm:h-9 w-auto object-contain opacity-90 drop-shadow-[0_2px_6px_rgba(251,191,36,0.3)]"
              />
            </motion.div>

            {/* HEADER RESMI WALI SANTRI (TEKS GANDA TELAH DIHAPUS) */}
            <HeaderUndanganWali />
          </div>
        </ScrollReveal>
      </div>

      {/* 2. BAGIAN TENGAH: GLASSMORPHISM CARD IDENTITAS WALI SANTRI */}
      <div className="w-full max-w-lg mx-auto my-auto py-2 relative z-20">
        <ScrollReveal variant="zoom-in" duration={0.8} delay={100}>
          <div className="w-full bg-[#0F2C59]/80 backdrop-blur-xl border border-white/20 shadow-[0_16px_48px_rgba(0,0,0,0.6)] rounded-3xl p-5 sm:p-6 space-y-3 relative z-20">
            <span className="text-[11px] sm:text-xs text-amber-200/90 uppercase tracking-widest font-semibold block drop-shadow-xs">
              Kepada Yth. Bapak/Ibu Wali Santri dari:
            </span>

            <h2 className="text-xl sm:text-2xl font-serif font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] leading-snug">
              {formatTitleCase(santri?.nama || item?.entitas?.nama || item?.nama || '') || (
                <SkeletonText width="65%" height="1.75rem" className="mx-auto my-1" />
              )}
            </h2>

            <div>
              <div className="inline-block px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-amber-300 text-xs font-bold shadow-md max-w-full leading-normal break-words text-center">
                {santri
                  ? santri.kamar && santri.kamar !== '-'
                    ? `${cleanKategoriTamatan(santri.subKategori) || 'Santri'} · ${santri.kamar}`
                    : (cleanKategoriTamatan(santri.subKategori) || 'Santri')
                  : (
                    <SkeletonText width="5rem" height="0.875rem" className="mx-auto" />
                  )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-1 text-amber-400/60">
              <div className="h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent flex-1" />
              <span className="text-xs">❖</span>
              <div className="h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent flex-1" />
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* 3. BAGIAN BAWAH: TOMBOL BUKA UNDANGAN (GLASSMORPHISM MEWAH, SELALU DI BAWAH) */}
      <div className="w-full max-w-lg mx-auto pb-4 sm:pb-6 relative z-20">
        <ScrollReveal variant="zoom-in" duration={0.8} delay={200}>
          <button
            type="button"
            onClick={onOpen}
            className="w-full py-3.5 px-6 rounded-2xl bg-white/20 hover:bg-white/30 active:bg-white/35 backdrop-blur-md border border-white/30 text-white font-serif font-black text-sm tracking-wider shadow-[0_8px_24px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_30px_rgba(251,191,36,0.3)] hover:border-amber-400/60 transition-all active:scale-95 flex items-center justify-center space-x-2.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
          >
            <MailOpen className="w-4 h-4 text-amber-300 animate-pulse" />
            <span className="tracking-widest uppercase">Buka Undangan</span>
          </button>
        </ScrollReveal>
      </div>
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
