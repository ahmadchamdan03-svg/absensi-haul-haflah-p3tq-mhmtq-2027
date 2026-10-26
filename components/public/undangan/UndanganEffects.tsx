'use client';

import { useState, useEffect } from 'react';
import { Volume2, VolumeX, MessageCircle } from 'lucide-react';
import { getNamaPenerima } from './types';

// Helper Render Nama Tamu Undangan
export function renderTamuName(item: any) {
  const namaPenerima = getNamaPenerima(item);
  return (
    <h2 className="text-xl sm:text-2xl font-serif font-black text-[#322116] tracking-wide text-center leading-snug">
      {namaPenerima}
    </h2>
  );
}

// Helper Render Asal / Kota Tamu Undangan (Hanya Alamat/Kota, tanpa Instansi & Kategori)
export function renderAlamatTamu(item: any) {
  const alamat = item?.alamat && item.alamat !== '-' ? item.alamat.trim() : '';
  if (alamat) {
    return <p className="text-xs text-stone-500 font-medium pt-0.5">{alamat}</p>;
  }
  return null;
}

// Komponen 3 Logo Resmi (P3TQ, Haul & Haflah, MHMTQ)
export function HeaderLogos() {
  return (
    <div className="flex items-center justify-center gap-3 sm:gap-6 my-3">
      <img
        src="/images/logo-p3tq.png"
        alt="Logo P3TQ"
        className="h-14 sm:h-18 object-contain drop-shadow-sm"
      />
      <img
        src="/logo-haul-haflah-transparent.png"
        alt="Logo Haul & Haflah"
        className="h-16 sm:h-20 object-contain drop-shadow-sm"
      />
      <img
        src="/images/logo-mhmtq.png"
        alt="Logo MHMTQ"
        className="h-14 sm:h-18 object-contain drop-shadow-sm"
      />
    </div>
  );
}

export function MusicToggle({
  isOpened,
  isPlayingMusic,
  toggleMusic,
}: {
  isOpened: boolean;
  isPlayingMusic: boolean;
  toggleMusic: () => void;
}) {
  if (!isOpened) return null;
  return (
    <button
      onClick={toggleMusic}
      type="button"
      className="fixed top-4 right-4 z-40 w-11 h-11 rounded-full bg-white/90 backdrop-blur-md border-2 border-[#D5C4B4] text-[#8C6A47] shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
      title={isPlayingMusic ? 'Jeda Musik' : 'Putar Musik'}
    >
      {isPlayingMusic ? (
        <Volume2 className="w-5 h-5 text-[#8C6A47] animate-pulse" />
      ) : (
        <VolumeX className="w-5 h-5 text-stone-400" />
      )}
    </button>
  );
}

export function FloatingUsthTanyaButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-full bg-[#422F21] hover:bg-[#322116] text-white font-serif font-bold text-xs shadow-2xl flex items-center space-x-2 border-2 border-[#D49B5B] transition-all hover:scale-105 active:scale-95 cursor-pointer group"
      title="Hubungi Panitia via WhatsApp"
    >
      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
      <MessageCircle className="w-4.5 h-4.5 text-[#D49B5B] group-hover:scale-110 transition-transform" />
      <span>Usth. Tanya</span>
    </a>
  );
}

export function EventCountdownGrid({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState(() => {
    const diff = Math.max(0, new Date(targetDate).getTime() - Date.now());
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.max(0, new Date(targetDate).getTime() - Date.now());
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
      <div className="p-3 rounded-2xl bg-[#FAF0E6]/90 border border-[#D5C4B4]">
        <div className="text-xl sm:text-2xl font-serif font-black text-[#8C6A47]">
          {timeLeft.days}
        </div>
        <div className="text-[10px] text-stone-600 font-bold uppercase">Hari</div>
      </div>
      <div className="p-3 rounded-2xl bg-[#FAF0E6]/90 border border-[#D5C4B4]">
        <div className="text-xl sm:text-2xl font-serif font-black text-[#8C6A47]">
          {timeLeft.hours}
        </div>
        <div className="text-[10px] text-stone-600 font-bold uppercase">Jam</div>
      </div>
      <div className="p-3 rounded-2xl bg-[#FAF0E6]/90 border border-[#D5C4B4]">
        <div className="text-xl sm:text-2xl font-serif font-black text-[#8C6A47]">
          {timeLeft.minutes}
        </div>
        <div className="text-[10px] text-stone-600 font-bold uppercase">Menit</div>
      </div>
      <div className="p-3 rounded-2xl bg-[#FAF0E6]/90 border border-[#D5C4B4]">
        <div className="text-xl sm:text-2xl font-serif font-black text-[#8C6A47]">
          {timeLeft.seconds}
        </div>
        <div className="text-[10px] text-stone-600 font-bold uppercase">Detik</div>
      </div>
    </div>
  );
}
