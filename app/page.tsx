'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Users,
  LayoutDashboard,
  QrCode,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { AppRole, ROLES_CONFIG, verifyRolePasswordAsync, setActiveRole, getActiveRole } from '@/lib/auth-roles';
import CanvasRevealMask from '@/components/landing/CanvasRevealMask';
import { TOS_FOTOS } from '@/lib/tos-fotos';

const playTosSound = () => {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioContext = new AudioContextClass();

    // Tap 1
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.connect(gain1);
    gain1.connect(audioContext.destination);

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, audioContext.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(1760, audioContext.currentTime + 0.08);

    gain1.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

    osc1.start(audioContext.currentTime);
    osc1.stop(audioContext.currentTime + 0.15);

    // Chime 2
    setTimeout(() => {
      try {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1320, audioContext.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(2200, audioContext.currentTime + 0.1);

        gain2.gain.setValueAtTime(0.2, audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

        osc2.start(audioContext.currentTime);
        osc2.stop(audioContext.currentTime + 0.2);
      } catch (e) {}
    }, 80);
  } catch (err) {
    console.warn('Audio error:', err);
  }
};

// Konfigurasi visual 4 tombol role (URUTAN: ADMIN -> PIMPINAN -> PENERIMA_TAMU -> PENJAGA_GERBANG)
const ROLE_BUTTONS: {
  key: AppRole;
  icon: React.ComponentType<{ className?: string }>;
  image: string;
  color: {
    bg: string;
    border: string;
    hoverBorder: string;
    iconBg: string;
    iconText: string;
    hoverAccent: string;
  };
}[] = [
  {
    key: 'ADMIN',
    icon: ShieldCheck,
    image: '/images/halwaa/admin.webp',
    color: {
      bg: 'bg-white/45 hover:bg-white/65 backdrop-blur-md shadow-[0_8px_32px_0_rgba(140,106,71,0.08)] hover:shadow-[0_12px_36px_0_rgba(225,29,72,0.15)]',
      border: 'border border-white/70',
      hoverBorder: 'hover:border-rose-400/80',
      iconBg: 'bg-rose-50/70 backdrop-blur-xs',
      iconText: 'text-rose-700',
      hoverAccent: 'group-hover:text-rose-700',
    },
  },
  {
    key: 'PIMPINAN',
    icon: LayoutDashboard,
    image: '/images/halwaa/pimpinan.webp',
    color: {
      bg: 'bg-white/45 hover:bg-white/65 backdrop-blur-md shadow-[0_8px_32px_0_rgba(140,106,71,0.08)] hover:shadow-[0_12px_36px_0_rgba(217,119,6,0.15)]',
      border: 'border border-white/70',
      hoverBorder: 'hover:border-amber-400/80',
      iconBg: 'bg-amber-50/70 backdrop-blur-xs',
      iconText: 'text-amber-700',
      hoverAccent: 'group-hover:text-amber-700',
    },
  },
  {
    key: 'PENERIMA_TAMU',
    icon: Users,
    image: '/images/halwaa/penerima-tamu.webp',
    color: {
      bg: 'bg-white/45 hover:bg-white/65 backdrop-blur-md shadow-[0_8px_32px_0_rgba(140,106,71,0.08)] hover:shadow-[0_12px_36px_0_rgba(5,150,105,0.15)]',
      border: 'border border-white/70',
      hoverBorder: 'hover:border-emerald-400/80',
      iconBg: 'bg-emerald-50/70 backdrop-blur-xs',
      iconText: 'text-emerald-700',
      hoverAccent: 'group-hover:text-emerald-700',
    },
  },
  {
    key: 'PENJAGA_GERBANG',
    icon: QrCode,
    image: '/images/halwaa/penjaga-gerbang.webp',
    color: {
      bg: 'bg-white/45 hover:bg-white/65 backdrop-blur-md shadow-[0_8px_32px_0_rgba(140,106,71,0.08)] hover:shadow-[0_12px_36px_0_rgba(37,99,235,0.15)]',
      border: 'border border-white/70',
      hoverBorder: 'hover:border-blue-400/80',
      iconBg: 'bg-blue-50/70 backdrop-blur-xs',
      iconText: 'text-blue-700',
      hoverAccent: 'group-hover:text-blue-700',
    },
  },
];

// Konfigurasi 5 Foto Galeri Dokumentasi Panggung & Haflah
const GALERI_FOTOS = [
  '/images/galeri/galeri-1.jpg',
  '/images/galeri/galeri-2.jpg',
  '/images/galeri/galeri-3.jpg',
  '/images/galeri/galeri-4.jpg',
  '/images/galeri/galeri-5.jpg',
];

export default function LandingPortalPage() {
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);
  const [inputPassword, setInputPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Multi-Tos Interaktif Usth. Halwaa (Bisa Di-spam Instan)
  const [tosList, setTosList] = useState<
    Array<{
      id: string;
      imgUrl: string;
      bubbleText: string;
      left: number;
      top: number;
      clickX: number;
      clickY: number;
    }>
  >([]);

  const triggerTos = useCallback((clientX: number, clientY: number) => {
    const randomPose = TOS_FOTOS[Math.floor(Math.random() * TOS_FOTOS.length)];

    // Dimensi gambar yang dirender setara 2x2 cm (~76px pada mobile, ~84px pada desktop)
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
    const imgSize = isDesktop ? 84 : 76;

    const relX = randomPose.handRelX ?? 0.35;
    const relY = randomPose.handRelY ?? 0.4;
    const handXRel = relX * imgSize;
    const handYRel = relY * imgSize;

    // Hitung posisi absolut kontainer gambar agar posisi tangan pas di kursor klik (clientX, clientY)
    let posX = clientX - handXRel;
    let posY = clientY - handYRel;

    // Jaga agar kontainer tidak terpotong keluar layar
    if (typeof window !== 'undefined') {
      const maxX = window.innerWidth - imgSize - 10;
      const maxY = window.innerHeight - imgSize - 10;
      posX = Math.max(10, Math.min(maxX, posX));
      posY = Math.max(10, Math.min(maxY, posY));
    }

    const id = Math.random().toString(36).substring(2, 9);
    const newItem = {
      id,
      imgUrl: randomPose.src,
      bubbleText: randomPose.caption,
      left: posX,
      top: posY,
      clickX: clientX,
      clickY: clientY,
    };

    // Tambahkan item baru ke tosList (simpan maks 15 item aktif sekaligus untuk performa)
    setTosList((prev) => [...prev.slice(-14), newItem]);

    playTosSound();

    // Hapus item ini secara individual setelah 2 detik
    setTimeout(() => {
      setTosList((prev) => prev.filter((item) => item.id !== id));
    }, 2000);
  }, []);

  useEffect(() => {
    const role = getActiveRole();
    if (role && ROLES_CONFIG[role]) {
      router.replace(ROLES_CONFIG[role].route);
    }

    // Preload seluruh foto Halwaa saat landing page dimuat agar respon klik 100% instan
    TOS_FOTOS.forEach((pose) => {
      if (typeof window !== 'undefined') {
        const img = new Image();
        img.src = pose.src;
      }
    });
  }, [router]);

  const doLoginSubmit = useCallback((role: AppRole, pass: string) => {
    if (!role || isSubmitting || pass.length < 4) return;
    setIsSubmitting(true);
    setPasswordError(false);

    // Prioritaskan verifikasi password utama ke tabel akun_otoritas Supabase (source of truth),
    // dengan fallback lokal otomatis di dalam verifyRolePasswordAsync apabila Supabase timeout/error.
    (async () => {
      try {
        const isValid = await verifyRolePasswordAsync(role, pass);
        if (isValid) {
          setActiveRole(role);
          const targetRoute = ROLES_CONFIG[role].route;
          setSelectedRole(null);
          setInputPassword('');
          setIsSubmitting(false);
          router.push(targetRoute);
          return;
        }
      } catch (err) {
        console.warn('Async login error:', err);
      }

      setPasswordError(true);
      setInputPassword('');
      setIsSubmitting(false);
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    })();
  }, [isSubmitting, router]);

  const handleOpenRoleModal = (roleKey: AppRole) => {
    setSelectedRole(roleKey);
    setInputPassword('');
    setShowPassword(false);
    setPasswordError(false);
    setIsSubmitting(false);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setSelectedRole(null);
    setInputPassword('');
    setPasswordError(false);
    setIsSubmitting(false);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole && inputPassword.length >= 4 && !isSubmitting) {
      doLoginSubmit(selectedRole, inputPassword);
    }
  };

  return (
    <div
      className="isolate min-h-screen text-[#422F21] flex flex-col justify-between items-center selection:bg-[#8C6A47]/20 selection:text-[#422F21] relative overflow-x-hidden cursor-pointer"
      onClick={(e) => {
        if (selectedRole) return;
        const cardEl = document.getElementById('login-card');
        if (cardEl && !cardEl.contains(e.target as Node)) {
          triggerTos(e.clientX, e.clientY);
        }
      }}
    >
      {/* EFEK ORGANIC REVEAL MASK 2D (XIAOMI MIMO TECHNIQUE - LAYER TERBAWAH) */}
      <CanvasRevealMask />

      {/* ================================================================= */}
      {/* HERO SECTION: AKSES LOGIN KEPANITIAAN MELAYANG (FLOATING)         */}
      {/* ================================================================= */}
      <div className="min-h-screen flex flex-col justify-center items-center py-8 px-4 sm:px-6 w-full relative z-10">
        {/* KONTEN UTAMA: KARTU PEMBUNGKUS PUTIH DIHAPUS, TOMBOL MELAYANG MURNI */}
        <div id="login-card" className="w-full max-w-sm md:max-w-md p-2 sm:p-4 space-y-4 text-center my-auto animate-in fade-in zoom-in-95 duration-300">
          {/* LOGO BERJAJAR */}
          <div className="flex justify-center items-center gap-2 md:gap-3 mb-3">
            <img src="/images/logo-p3tq.png" alt="Logo P3TQ" className="h-9 md:h-12 w-auto object-contain drop-shadow-sm" />
            <img src="/images/logo-haul-gold.png" alt="Logo Haul Haflah" className="h-9 md:h-12 w-auto object-contain drop-shadow-sm" />
            <img src="/images/logo-mhmtq.png" alt="Logo MHMTQ" className="h-9 md:h-12 w-auto object-contain drop-shadow-sm" />
          </div>

          {/* JUDUL & DESKRIPSI IDENTITAS */}
          <div>
            <p className="text-[10px] md:text-xs font-serif font-black tracking-[0.18em] text-[#8C6A47] uppercase mb-2 drop-shadow-xs">
              HAUL &amp; HAFLAH AKHIRUSSANAH 1448 H.
            </p>

            <h1 className="text-sm md:text-base font-bold text-[#422F21] leading-relaxed drop-shadow-2xs">
              Pondok Pesantren Putri Tahfizhil Qur-an (P3TQ)
            </h1>
            <h1 className="text-sm md:text-base font-bold text-[#422F21] leading-relaxed drop-shadow-2xs">
              Madrasah Hidayatul Mubtadi-aat Fittahfizhi Wal Qiro-at (MHMTQ)
            </h1>

            <p className="text-[10px] md:text-xs italic text-[#8C6A47] mt-1.5 font-bold">
              Lirboyo Kediri
            </p>

            <p className="text-[11px] md:text-xs text-stone-700 mt-2 mb-4 font-medium leading-relaxed max-w-md mx-auto">
              Portal resmi kepanitiaan. Silakan masuk sesuai bagan dan otoritas tugas Anda.
            </p>
          </div>

          {/* 4 TOMBOL AKSES ROLE - MELAYANG LANGSUNG DI ATAS BACKGROUND DENGAN HOVER USTH. HALWAA */}
          <div className="grid grid-cols-2 gap-2.5 md:gap-3 items-stretch">
            {ROLE_BUTTONS.map(({ key, icon: Icon, image, color }) => {
              const config = ROLES_CONFIG[key];
              const isAdmin = key === 'ADMIN';

              return (
                <div key={key} className="role-card-wrapper relative group hover:z-30 z-10 h-full flex flex-col">
                  {/* FOTO USTH. HALWAA — MUNCUL DARI BALIK KARTU SAAT HOVER */}
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 opacity-0 translate-y-4 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-hover:translate-y-0 transition-all duration-300 ease-out pointer-events-none overflow-hidden z-0 flex items-end justify-center ${
                      isAdmin
                        ? 'bottom-[65%] md:bottom-[70%] mb-[-12px] md:mb-[-16px] w-36 md:w-48 h-36 md:h-48'
                        : 'bottom-[65%] md:bottom-[70%] mb-[-12px] md:mb-[-16px] w-32 md:w-44 h-32 md:h-44'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Usth. Halwaa - ${config.title}`}
                      className="w-full h-full object-contain object-bottom drop-shadow-2xl select-none"
                      draggable={false}
                    />
                  </div>

                  {/* KARTU ROLE UTAMA (MEMILIKI BACKGROUND PUTIH & SHADOW MASING-MASING) */}
                  <button
                    type="button"
                    onClick={() => handleOpenRoleModal(key)}
                    className={`relative z-10 flex items-center h-full gap-2 sm:gap-2.5 p-2.5 sm:p-3 md:p-4 ${color.bg} rounded-2xl ${color.border} ${color.hoverBorder} transition-all duration-300 text-left w-full cursor-pointer active:scale-[0.98] hover:-translate-y-0.5 min-w-0`}
                  >
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl ${color.iconBg} ${color.iconText} border border-current/10 shrink-0 shadow-xs`}>
                      <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px] md:w-5 md:h-5" />
                    </div>
                    <span className={`font-serif font-black text-xs sm:text-sm md:text-base text-[#422F21] ${color.hoverAccent} transition-colors leading-tight break-words min-w-0 flex-1 pr-2.5`}>
                      {config.title}
                    </span>
                    <Lock className="absolute top-2 sm:top-2.5 right-2 sm:right-2.5 w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#8C6A47]/40 group-hover:text-[#8C6A47] transition-colors" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* FOOTER INFO KEPANITIAAN */}
          <div className="text-center space-y-1 pt-3 border-t border-[#8C6A47]/20 mt-4">
            <p className="text-[10px] md:text-[11px] text-[#8C6A47] font-bold">
              Sabtu, 24 Rajab 1448 H. / 02 Januari 2027 M. · Aula Al-Muktamar
            </p>
            <p className="text-[10px] md:text-[11px] text-stone-600 font-medium">
              Sistem Web Murni · Dibuka langsung melalui browser
            </p>
          </div>
        </div>

      </div>

      {/* ================================================================= */}
      {/* SECTION GALERI 5 FOTO RESMI VERTIKAL (BESAR, RASIO 16:9 SINEMATIK) */}
      {/* ================================================================= */}
      <section className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 pt-4 pb-16 flex flex-col gap-6 sm:gap-8">
        {GALERI_FOTOS.map((src, idx) => (
          <div
            key={idx}
            className="relative w-full aspect-video overflow-hidden rounded-2xl shadow-lg border border-[#D5C4B4]/70 bg-black/5 transition-all duration-300"
          >
            <img
              src={src}
              alt={`Dokumentasi Haflah P3TQ ${idx + 1}`}
              className="w-full h-full object-cover block"
              loading="lazy"
            />
          </div>
        ))}
      </section>

      {/* FOOTER BAWAH */}
      <footer className="relative z-10 w-full py-6 text-center text-xs text-[#8C6A47]/80 border-t border-white/60 bg-white/45 backdrop-blur-md">
        <p className="font-semibold text-[#8C6A47]">
          Haflah Akhirussanah 1448 H. · Pondok Pesantren Putri Tahfizhil Qur-an (P3TQ) &amp; MHMTQ Lirboyo
        </p>
      </footer>

      {/* ================================================================= */}
      {/* MODAL INPUT PASSWORD                                              */}
      {/* ================================================================= */}
      {selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white/75 backdrop-blur-xl rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/80 space-y-5 animate-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FAF0E6] text-[#8C6A47] flex items-center justify-center font-bold border border-[#D5C4B4]">
                  <KeyRound className="w-5 h-5 text-[#8C6A47]" />
                </div>
                <div>
                  <h4 className="font-serif font-black text-base text-[#422F21]">
                    Masuk {ROLES_CONFIG[selectedRole].title}
                  </h4>
                  <p className="text-xs text-[#7A624E]">
                    {ROLES_CONFIG[selectedRole].subtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="w-8 h-8 rounded-full hover:bg-stone-100 text-stone-500 hover:text-stone-800 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ✕
              </button>
            </div>

            {/* Form Password */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#422F21] block">
                  Kata Sandi:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={inputPassword}
                    onChange={(e) => {
                      setInputPassword(e.target.value);
                      setPasswordError(false);
                    }}
                    placeholder={`Masukkan sandi ${ROLES_CONFIG[selectedRole].title}...`}
                    autoFocus
                    disabled={isSubmitting}
                    className={`w-full px-4 py-3 rounded-2xl border-2 text-sm text-[#422F21] pr-12 focus:outline-none transition-all disabled:opacity-70 disabled:bg-stone-100 disabled:cursor-not-allowed ${
                      passwordError
                        ? 'border-rose-500 bg-rose-50/50'
                        : 'border-[#D5C4B4] focus:border-[#8C6A47]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-800 p-1 disabled:opacity-30"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {passwordError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Kata sandi tidak sesuai. Silakan periksa kembali.</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-2xl border border-stone-300 text-stone-600 hover:bg-stone-100 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || inputPassword.length < 4}
                  className="flex-1 py-3 rounded-2xl bg-[#8C6A47] hover:bg-[#745638] text-white text-xs font-bold shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0 text-white" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    'Masuk Sekarang'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INTERAKTIF USTH. HALWAA TOS POP-OUT OVERLAY (BISA DI-SPAM INSTAN DARI SETIAP KLIK KURSOR) */}
      {tosList.map((item) => (
        <div
          key={item.id}
          style={{ left: `${item.left}px`, top: `${item.top}px` }}
          className="fixed z-50 pointer-events-none animate-tos-pop flex flex-col items-center justify-center w-[76px] md:w-[84px] h-[76px] md:h-[84px]"
        >
          {/* Sparkle Emas di Titik Temu Tangan & Kursor (clickX, clickY) */}
          <div
            style={{
              left: `${item.clickX - item.left}px`,
              top: `${item.clickY - item.top}px`,
            }}
            className="absolute pointer-events-none overflow-visible -translate-x-1/2 -translate-y-1/2 z-20"
          >
            <span className="absolute -top-2 -left-2 text-amber-400 text-sm md:text-base animate-tos-sparkle">✨</span>
            <span className="absolute -top-3 right-0 text-amber-300 text-xs md:text-sm animate-tos-sparkle">⭐</span>
            <span className="absolute bottom-0 -left-3 text-amber-400 text-xs md:text-sm animate-tos-sparkle">✨</span>
            <span className="absolute bottom-2 -right-2 text-amber-300 text-sm md:text-base animate-tos-sparkle">🌟</span>
            <div className="w-5 h-5 rounded-full bg-amber-300/40 blur-sm animate-ping" />
          </div>

          {/* Bubble Chat "Tos!" */}
          <div className="absolute -top-5 md:-top-6 bg-white border-2 border-[#D5C4B4] rounded-full px-2 py-0.5 md:px-2.5 md:py-1 shadow-md text-[10px] md:text-xs font-black text-[#8C6A47] animate-tos-bounce flex items-center gap-0.5 z-30 whitespace-nowrap">
            <span>{item.bubbleText}</span>
          </div>

          {/* Foto Usth. Halwaa */}
          <img
            src={item.imgUrl}
            alt="Usth. Halwaa - Tos!"
            className="w-full h-full drop-shadow-md select-none object-contain"
            draggable={false}
          />
        </div>
      ))}
    </div>
  );
}
