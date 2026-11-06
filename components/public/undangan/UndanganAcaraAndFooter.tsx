'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Compass, Users, ShoppingBag, ArrowRight, Info, AlertCircle, Loader2 } from 'lucide-react';
import NamaLembaga from '@/components/NamaLembaga';
import GlassCard from '@/components/GlassCard';
import ScrollReveal from '@/components/ScrollReveal';
import { EventCountdownGrid } from './UndanganEffects';

interface UndanganAcaraAndFooterProps {
  kodeSH: string;
  onOpenDenah: () => void;
  onOpenDaftarPeserta: () => void;
  loadingKuotaControl: boolean;
  kuotaSwitchAktif: boolean;
  totalDiverifikasi: number;
}

export default function UndanganAcaraAndFooter({
  kodeSH,
  onOpenDenah,
  onOpenDaftarPeserta,
  loadingKuotaControl,
  kuotaSwitchAktif,
  totalDiverifikasi,
}: UndanganAcaraAndFooterProps) {
  return (
    <>
      {/* KARTU WAKTU, LOKASI & COUNTDOWN TIMER WALI */}
      <ScrollReveal delay={350} variant="zoom-in">
        <GlassCard className="p-5 sm:p-7 md:p-8 space-y-5 text-center relative overflow-hidden">
          {/* Aksen Ornamen Lemon Cantik & Elegan dari CDR */}
          <motion.img
            src="/images/undangan-assets/lemon-branch.webp"
            alt="Aksen Lemon"
            className="absolute -top-3 -right-3 w-12 sm:w-16 pointer-events-none z-10 opacity-80 drop-shadow-sm select-none"
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            whileInView={{ opacity: 0.85, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            animate={{ rotate: [0, 4, 0, -4, 0] }}
            whileHover={{ scale: 1.1, rotate: 8 }}
          />
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1D4ED8]">
              Waktu &amp; Tempat Pelaksanaan
            </span>
            <h3 className="font-serif font-black text-xl text-[#0F2C59]">
              Aula Al-Muktamar Pondok Pesantren Lirboyo
            </h3>
            <p className="text-xs text-stone-600">
              Sabtu, 24 Rajab 1448 H. / 02 Januari 2027 M.
            </p>
          </div>

          <EventCountdownGrid targetDate="2027-01-02T06:30:00+07:00" />

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
            <button
              type="button"
              onClick={onOpenDenah}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-white/60 hover:bg-white/80 backdrop-blur-xs text-[#1E3A8A] text-xs font-bold border border-white/80 inline-flex items-center justify-center space-x-2 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-xs"
            >
              <Compass className="w-4 h-4 text-[#1D4ED8]" />
              <span>Buka Denah Lokasi &amp; Parkir</span>
            </button>
            <button
              type="button"
              onClick={onOpenDaftarPeserta}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-white/75 hover:bg-white/90 backdrop-blur-xs text-[#1D4ED8] text-xs font-bold border border-white/80 inline-flex items-center justify-center space-x-2 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-xs"
            >
              <Users className="w-4 h-4 text-[#1D4ED8]" />
              <span>Lihat Daftar Peserta</span>
            </button>
          </div>
        </GlassCard>
      </ScrollReveal>

      {/* FOOTER TANDA TANGAN PANITIA */}
      <ScrollReveal delay={400}>
        <GlassCard className="p-5 sm:p-7 md:p-8 text-center space-y-5 text-xs font-serif text-[#0F2C59]">
          <p className="italic text-stone-600 leading-relaxed text-center">
            Atas perhatian dan kehadiran Bapak/Ibu/Saudara/i, kami sampaikan terima kasih.<br />
            Jazakumullahu khairan katsiran.
          </p>

          <div className="pt-4 border-t border-[#E8DFD5] grid grid-cols-2 gap-3 md:gap-6 max-w-md mx-auto text-center">
            <div className="text-center space-y-1">
              <p className="text-[10px] md:text-xs font-serif uppercase tracking-widest text-[#1D4ED8] font-semibold">
                KETUA UMUM
              </p>
              <p className="pt-3 font-serif font-bold text-sm md:text-base text-[#0F2C59]">
                (Sinta Maelani)
              </p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-[10px] md:text-xs font-serif uppercase tracking-widest text-[#1D4ED8] font-semibold">
                SEKRETARIS UMUM
              </p>
              <p className="pt-3 font-serif font-bold text-sm md:text-base text-[#0F2C59]">
                (Refi Al Izzatul Kholifah)
              </p>
            </div>
          </div>

          <div className="pt-3 text-[#1D4ED8] font-serif italic text-xs md:text-sm font-bold text-center">
            Wassalamu'alaikum Warahmatullahi Wabarakatuh
          </div>
        </GlassCard>
      </ScrollReveal>

      {/* KARTU PEMBELIAN KUOTA TAMBAHAN */}
      <ScrollReveal delay={450}>
        <GlassCard className="p-5 sm:p-7 space-y-3.5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-sky-100 border border-sky-300 text-blue-950 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <h3 className="font-serif font-black text-sm sm:text-base text-[#0F2C59]">
                  Pembelian Kuota Tambahan Kursi
                </h3>
                <p className="text-[11px] text-stone-500">
                  Sisa Kuota Pagu: <strong>{Math.max(0, 300 - totalDiverifikasi)} unit</strong> ({totalDiverifikasi}/300 terisi)
                </p>
              </div>
            </div>
          </div>

          {loadingKuotaControl ? (
            <div className="p-3.5 rounded-2xl bg-[#F0F9FF]/90 border border-[#E8DFD5] text-center text-xs text-stone-500 flex items-center justify-center space-x-2 font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-[#1D4ED8]" />
              <span>Sedang memuat status kuota tambahan...</span>
            </div>
          ) : kuotaSwitchAktif && totalDiverifikasi < 300 ? (
            <div className="space-y-2.5 text-center">
              <p className="text-xs text-stone-600 leading-relaxed font-medium">
                Panitia membuka kesempatan pembelian kuota tambahan kursi untuk wali santri.
              </p>
              <Link
                href={`/beli/${kodeSH}`}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#1D4ED8] via-[#3B82F6] to-[#1D4ED8] hover:brightness-105 text-white font-serif font-black text-xs sm:text-sm tracking-wide shadow-md flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer border border-sky-200/40"
              >
                <ShoppingBag className="w-4.5 h-4.5 text-amber-200" />
                <span>Beli Kuota Tambahan</span>
                <ArrowRight className="w-4.5 h-4.5 text-amber-200" />
              </Link>
              <p className="text-[11px] text-stone-500 font-semibold">
                Harga Rp 75.000 / kursi · Sisa kuota: <strong>{Math.max(0, 300 - totalDiverifikasi)} unit</strong>
              </p>
            </div>
          ) : !kuotaSwitchAktif ? (
            <div className="p-3.5 rounded-2xl bg-slate-100/90 border border-slate-200 text-slate-700 text-xs flex items-center space-x-2.5 font-medium">
              <Info className="w-4.5 h-4.5 text-slate-500 shrink-0" />
              <span>Pembelian kuota tambahan sedang ditutup.</span>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-sky-50/90 border border-sky-200 text-blue-950 text-xs flex items-center space-x-2.5 font-medium">
              <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0" />
              <span>Kuota tambahan sudah habis (300/300 terisi).</span>
            </div>
          )}
        </GlassCard>
      </ScrollReveal>

      {/* FOOTER WALI SANTRI */}
      <ScrollReveal delay={500}>
        <GlassCard className="p-5 text-center text-[11px] text-stone-500 space-y-1">
          <div className="pt-1">
            <NamaLembaga align="center" size="xs" weight="bold" color="text-[#0F2C59]" />
            <p className="text-[10px] text-stone-500 font-semibold mt-0.5">Lirboyo Kediri</p>
          </div>
          <p>Web Resmi Haflah P3TQ dan MHMTQ 2027</p>
        </GlassCard>
      </ScrollReveal>
    </>
  );
}
