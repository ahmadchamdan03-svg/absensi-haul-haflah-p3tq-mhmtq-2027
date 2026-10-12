import Link from 'next/link';
import { MailX, Home } from 'lucide-react';

export default function PublicUPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F3] flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-md border-2 border-[#D5C4B4] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* LOGO RESMI */}
        <div className="flex justify-center">
          <img
            src="/images/logo-haul-gold.png"
            alt="Logo Haul & Haflah P3TQ MHMTQ"
            className="h-16 sm:h-20 w-auto object-contain drop-shadow-sm"
          />
        </div>

        {/* DIVIDER */}
        <div className="flex items-center justify-center gap-3 text-[#8C6A47]/60">
          <div className="h-px bg-gradient-to-r from-transparent via-[#D5C4B4] to-transparent flex-1" />
          <span className="text-xs">❖</span>
          <div className="h-px bg-gradient-to-r from-transparent via-[#D5C4B4] to-transparent flex-1" />
        </div>

        {/* PESAN */}
        <div className="space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-[#8C6A47] mb-1">
            <MailX className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-black text-[#422F21]">
            Kode Undangan Diperlukan
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Mohon maaf, tautan ini memerlukan kode undangan yang valid. Silakan gunakan link undangan resmi yang dikirimkan oleh Panitia Haflah melalui WhatsApp.
          </p>
        </div>

        {/* TOMBOL AKSI */}
        <div className="pt-2">
          <Link
            href="/"
            className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-[#8C6A47] via-[#A47E57] to-[#8C6A47] hover:brightness-105 text-white font-serif font-bold text-sm tracking-wide shadow-lg transition-all active:scale-95 inline-flex items-center justify-center space-x-2 border border-amber-200/50"
          >
            <Home className="w-4 h-4 text-amber-200" />
            <span>Kembali ke Beranda Utama</span>
          </Link>
        </div>
      </div>

      <p className="text-[11px] text-stone-500 mt-6 font-medium">
        © 2027 Haflah Akhirussanah P3TQ &amp; MHMTQ Lirboyo Kediri
      </p>
    </div>
  );
}
