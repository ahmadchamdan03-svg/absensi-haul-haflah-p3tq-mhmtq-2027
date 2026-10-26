'use client';

import React from 'react';
import Link from 'next/link';
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
      {/* RANGKAIAN ADICARA UTAMA & TATA TERTIB SAMBANGAN */}
      <ScrollReveal delay={200}>
        <GlassCard className="p-5 sm:p-7 md:p-8 border-2 border-[#E8DFD5]/80 shadow-sm space-y-5">
          <div className="space-y-3">
            <h3 className="font-serif font-black text-base text-[#422F21] border-b border-stone-100 pb-2">
              Rangkaian Acara Haflah Akhirussanah P3TQ dan MHMTQ 1448 H. / 2027 M.
            </h3>
            <div className="space-y-2.5 text-xs md:text-sm leading-relaxed">
              <div className="flex items-start space-x-3">
                <span className="font-mono font-bold text-[#8C6A47] shrink-0 min-w-[70px]">05.30 WIs</span>
                <p className="text-stone-700">Persiapan Shohibul Hajat diberangkatkan ke Aula Al-Muktamar.</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="font-mono font-bold text-[#8C6A47] shrink-0 min-w-[70px]">06.00 WIs</span>
                <p className="text-stone-700">Lalaran Tamatan Aliyah &amp; Senandung Sholawat Syauqul Ahibba'.</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="font-mono font-bold text-[#8C6A47] shrink-0 min-w-[70px]">06.30 WIs</span>
                <p className="text-stone-700">
                  <strong>Registrasi Gerbang Masuk Dibuka</strong> (06.30 WIB / 07.00 WIs) &amp; Tartilan Khotmil Qur'an.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="font-mono font-bold text-[#8C6A47] shrink-0 min-w-[70px]">07.30 WIs</span>
                <p className="text-stone-700">Pembukaan, Qiro'at, Tahlil, dan Sambutan-Sambutan Masyayikh.</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="font-mono font-bold text-[#8C6A47] shrink-0 min-w-[70px]">08.52 WIs</span>
                <p className="text-stone-700">Pembagian Syahadah Takhtiman Bil Ghoibi &amp; Bin Nadzori.</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="font-mono font-bold text-[#8C6A47] shrink-0 min-w-[70px]">10.12 WIs</span>
                <p className="text-stone-700">Mau'idzoh Hasanah, Do'a Masyayikh, &amp; Pembagian Ijazah Tamatan.</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="font-mono font-bold text-[#8C6A47] shrink-0 min-w-[70px]">13.01 WIs</span>
                <p className="text-stone-700">Penayangan Video Closing "Sajak Akhirussanah" dan Sesi Foto.</p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 space-y-3">
            <h4 className="font-serif font-black text-sm text-[#422F21]">
              Tata Tertib &amp; Ketentuan Sambangan
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs md:text-sm">
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                <span className="font-bold text-amber-900 block">🚫 Larangan Selama Acara:</span>
                <ul className="text-amber-800 leading-relaxed text-[11px] md:text-xs space-y-1">
                  <li>• Dilarang membawa <strong>buket</strong> ke aula.</li>
                  <li>• Dilarang memakai kutek, hena, &amp; nail art.</li>
                  <li>• Dilarang membawa fotografer dari luar.</li>
                  <li>• Wali dilarang memasuki area steril santriwati saat acara.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                <span className="font-bold text-emerald-900 block">📍 Jadwal &amp; Lokasi Sambangan:</span>
                <ul className="text-emerald-800 leading-relaxed text-[11px] md:text-xs space-y-1">
                  <li>• Dibuka <strong>setelah acara s.d. 18.00 WIs</strong>.</li>
                  <li>• <strong>Halaman Al-Khodijah:</strong> Bil Ghoibi &amp; Bin Nadzori.</li>
                  <li>• <strong>Gedung Rusunawa Baru:</strong> Tamatan Aliyah.</li>
                  <li>• Wajib mahrom sah (bawa KKS/KTP).</li>
                </ul>
              </div>
            </div>
          </div>
        </GlassCard>
      </ScrollReveal>

      {/* KARTU WAKTU, LOKASI & COUNTDOWN TIMER WALI */}
      <ScrollReveal delay={350}>
        <GlassCard className="p-5 sm:p-7 md:p-8 border-2 border-[#E8DFD5]/80 shadow-sm space-y-5 text-center">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A47]">
              Waktu &amp; Tempat Pelaksanaan
            </span>
            <h3 className="font-serif font-black text-xl text-[#422F21]">
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
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[#FAF7F3] hover:bg-[#EFE8E1] text-[#5C3E28] text-xs font-bold border border-[#D5C4B4] inline-flex items-center justify-center space-x-2 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-xs"
            >
              <Compass className="w-4 h-4 text-[#8C6A47]" />
              <span>Buka Denah Lokasi &amp; Parkir</span>
            </button>
            <button
              type="button"
              onClick={onOpenDaftarPeserta}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-white hover:bg-stone-50 text-[#8C6A47] text-xs font-bold border border-[#D5C4B4] inline-flex items-center justify-center space-x-2 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-xs"
            >
              <Users className="w-4 h-4 text-[#8C6A47]" />
              <span>Lihat Daftar Peserta</span>
            </button>
          </div>
        </GlassCard>
      </ScrollReveal>

      {/* FOOTER TANDA TANGAN PANITIA */}
      <ScrollReveal delay={400}>
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
        </GlassCard>
      </ScrollReveal>

      {/* KARTU PEMBELIAN KUOTA TAMBAHAN */}
      <ScrollReveal delay={450}>
        <GlassCard className="p-5 sm:p-7 border-2 border-[#E8DFD5]/80 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <h3 className="font-serif font-black text-sm sm:text-base text-[#422F21]">
                  Pembelian Kuota Tambahan Kursi
                </h3>
                <p className="text-[11px] text-stone-500">
                  Sisa Kuota Pagu: <strong>{Math.max(0, 300 - totalDiverifikasi)} unit</strong> ({totalDiverifikasi}/300 terisi)
                </p>
              </div>
            </div>
          </div>

          {loadingKuotaControl ? (
            <div className="p-3.5 rounded-2xl bg-[#FAF7F3]/90 border border-[#E8DFD5] text-center text-xs text-stone-500 flex items-center justify-center space-x-2 font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-[#8C6A47]" />
              <span>Sedang memuat status kuota tambahan...</span>
            </div>
          ) : kuotaSwitchAktif && totalDiverifikasi < 300 ? (
            <div className="space-y-2.5 text-center">
              <p className="text-xs text-stone-600 leading-relaxed font-medium">
                Panitia membuka kesempatan pembelian kuota tambahan kursi untuk wali santri.
              </p>
              <Link
                href={`/beli/${kodeSH}`}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#8C6A47] via-[#A47E57] to-[#8C6A47] hover:brightness-105 text-white font-serif font-black text-xs sm:text-sm tracking-wide shadow-md flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer border border-amber-200/40"
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
            <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-center space-x-2.5 font-medium">
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
            <NamaLembaga align="center" size="xs" weight="bold" color="text-[#422F21]" />
            <p className="text-[10px] text-stone-500 font-semibold mt-0.5">Lirboyo Kediri</p>
          </div>
          <p>Web Resmi Haflah P3TQ dan MHMTQ 2027</p>
        </GlassCard>
      </ScrollReveal>
    </>
  );
}
