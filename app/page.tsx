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
      hoverBorder: 'hover:border-sky-400/80',
      iconBg: 'bg-sky-50/70 backdrop-blur-xs',
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
      hoverBorder: 'hover:border-blue-400/80',
      iconBg: 'bg-blue-50/70 backdrop-blur-xs',
      iconText: 'text-blue-700',
      hoverAccent: 'group-hover:text-blue-700',
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


  useEffect(() => {
    const role = getActiveRole();
    if (role && ROLES_CONFIG[role]) {
      router.replace(ROLES_CONFIG[role].route);
    }

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
      className="isolate min-h-screen text-[#0F2C59] flex flex-col justify-between items-center selection:bg-[#1D4ED8]/20 selection:text-[#0F2C59] relative overflow-x-hidden"
    >
      {/* EFEK ORGANIC REVEAL MASK 2D (XIAOMI MIMO TECHNIQUE - LAYER TERBAWAH) */}
      <CanvasRevealMask />

      {/* ================================================================= */}
      {/* HERO SECTION: AKSES LOGIN KEPANITIAAN MELAYANG (FLOATING)         */}
      {/* ================================================================= */}
      <div className="min-h-screen flex flex-col justify-center items-center py-8 px-4 sm:px-6 w-full relative z-20">
        {/* KONTEN UTAMA: KARTU PEMBUNGKUS PUTIH DIHAPUS, TOMBOL MELAYANG MURNI */}
        <div id="login-card" className="w-full max-w-xl lg:max-w-2xl p-2 sm:p-4 space-y-4 text-center my-auto animate-in fade-in zoom-in-95 duration-300">
          {/* LOGO BERJAJAR */}
          <div className="flex justify-center items-center gap-2 md:gap-3 mb-3">
            <img src="/images/logo-p3tq.png" alt="Logo P3TQ" className="h-9 md:h-12 w-auto object-contain drop-shadow-sm" />
            <img src="/images/logo-haul-blue.png" alt="Logo Haul Haflah" className="h-9 md:h-12 w-auto object-contain drop-shadow-sm" />
            <img src="/images/logo-mhmtq.png" alt="Logo MHMTQ" className="h-9 md:h-12 w-auto object-contain drop-shadow-sm" />
          </div>

          {/* JUDUL & DESKRIPSI IDENTITAS */}
          <div className="w-full">
            <p className="text-[10px] md:text-xs font-serif font-black tracking-[0.18em] text-[#1D4ED8] uppercase mb-2 drop-shadow-[0_1px_2px_rgba(255,255,255,0.95)]">
              HAUL &amp; HAFLAH AKHIRUSSANAH 1448 H.
            </p>

            <h1 className="text-xs sm:text-sm md:text-base font-extrabold text-[#0F2C59] leading-relaxed drop-shadow-[0_1px_3px_rgba(255,255,255,0.95)] sm:whitespace-nowrap">
              Pondok Pesantren Putri Tahfizhil Qur-an (P3TQ)
            </h1>
            <h1 className="text-[11px] sm:text-xs md:text-sm lg:text-base font-extrabold text-[#0F2C59] leading-relaxed drop-shadow-[0_1px_3px_rgba(255,255,255,0.95)] sm:whitespace-nowrap tracking-tight sm:tracking-normal">
              Madrasah Hidayatul Mubtadi-aat Fittahfizhi Wal Qiro-at (MHMTQ)
            </h1>

            <p className="text-[10px] md:text-xs italic text-[#1D4ED8] mt-1.5 font-bold drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
              Lirboyo Kediri
            </p>

            <p className="text-[11px] md:text-xs text-[#0F2C59] mt-2 mb-4 font-semibold leading-relaxed max-w-md mx-auto drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
              Portal resmi kepanitiaan. Silakan masuk sesuai bagan dan otoritas tugas Anda.
            </p>
          </div>

          {/* 4 TOMBOL AKSES ROLE - MELAYANG LANGSUNG DI ATAS BACKGROUND DENGAN HOVER USTH. HALWAA */}
          <div className="w-full max-w-md md:max-w-lg mx-auto grid grid-cols-2 gap-2.5 md:gap-3 items-stretch">
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
                    <span className={`font-serif font-black text-xs sm:text-sm md:text-base text-[#0F2C59] ${color.hoverAccent} transition-colors leading-tight break-words min-w-0 flex-1 pr-2.5`}>
                      {config.title}
                    </span>
                    <Lock className="absolute top-2 sm:top-2.5 right-2 sm:right-2.5 w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#1D4ED8]/40 group-hover:text-[#1D4ED8] transition-colors" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* FOOTER INFO KEPANITIAAN */}
          <div className="text-center space-y-1 pt-3 border-t border-[#1D4ED8]/20 mt-4">
            <p className="text-[10px] md:text-[11px] text-[#1D4ED8] font-bold">
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
            className="relative w-full aspect-video overflow-hidden rounded-2xl shadow-lg border border-[#BAE6FD]/70 bg-black/5 transition-all duration-300"
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
      <footer className="relative z-10 w-full py-6 text-center text-xs text-[#1D4ED8]/80 border-t border-white/60 bg-white/45 backdrop-blur-md">
        <p className="font-semibold text-[#1D4ED8]">
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
                <div className="w-10 h-10 rounded-2xl bg-[#FAF0E6] text-[#1D4ED8] flex items-center justify-center font-bold border border-[#BAE6FD]">
                  <KeyRound className="w-5 h-5 text-[#1D4ED8]" />
                </div>
                <div>
                  <h4 className="font-serif font-black text-base text-[#0F2C59]">
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
                <label className="text-xs font-bold text-[#0F2C59] block">
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
                    className={`w-full px-4 py-3 rounded-2xl border-2 text-sm text-[#0F2C59] pr-12 focus:outline-none transition-all disabled:opacity-70 disabled:bg-stone-100 disabled:cursor-not-allowed ${
                      passwordError
                        ? 'border-rose-500 bg-rose-50/50'
                        : 'border-[#BAE6FD] focus:border-[#1D4ED8]'
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
                  className="flex-1 py-3 rounded-2xl bg-[#1D4ED8] hover:bg-[#745638] text-white text-xs font-bold shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

    </div>
  );
}
