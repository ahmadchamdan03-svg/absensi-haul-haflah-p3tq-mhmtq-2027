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
import { AppRole, ROLES_CONFIG, verifyRolePassword, setActiveRole, getActiveRole } from '@/lib/auth-roles';
import StageBackground from '@/components/StageBackground';

// 6 POSE TOS INTERAKTIF US. HALWAA
const TOS_POSES = [
  { img: '/images/halwaa/tos/tos-1.png', text: 'Yuk Tos! ✋' },
  { img: '/images/halwaa/tos/tos-2.png', text: 'Siap Tos! 👋' },
  { img: '/images/halwaa/tos/tos-3.png', text: 'Ayo Tos! ✨' },
  { img: '/images/halwaa/tos/tos-4.png', text: 'Tos High-Five! 🙌' },
  { img: '/images/halwaa/tos/tos-5.png', text: 'Semangat Haflah! 🥰' },
  { img: '/images/halwaa/tos/tos-6.png', text: 'Tos Dulu! 👊' },
];

const TOS_CORNERS = [
  { id: 'bottom-left', posClass: 'bottom-4 left-4 md:bottom-8 md:left-8' },
  { id: 'bottom-right', posClass: 'bottom-4 right-4 md:bottom-8 md:right-8' },
  { id: 'top-left', posClass: 'top-4 left-4 md:top-8 md:left-8' },
  { id: 'top-right', posClass: 'top-4 right-4 md:top-8 md:right-8' },
];

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

// Konfigurasi visual 4 tombol role (URUTAN BARU: ADMIN -> PIMPINAN -> PENERIMA_TAMU -> PENJAGA_GERBANG)
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
    image: '/images/halwaa/admin.png',
    color: {
      bg: 'bg-white/90 hover:bg-white backdrop-blur-sm',
      border: 'border-[#E8DFD5]',
      hoverBorder: 'hover:border-rose-400',
      iconBg: 'bg-rose-50',
      iconText: 'text-rose-700',
      hoverAccent: 'group-hover:text-rose-700',
    },
  },
  {
    key: 'PIMPINAN',
    icon: LayoutDashboard,
    image: '/images/halwaa/pimpinan.png',
    color: {
      bg: 'bg-white/90 hover:bg-white backdrop-blur-sm',
      border: 'border-[#E8DFD5]',
      hoverBorder: 'hover:border-amber-500',
      iconBg: 'bg-amber-50',
      iconText: 'text-amber-700',
      hoverAccent: 'group-hover:text-amber-700',
    },
  },
  {
    key: 'PENERIMA_TAMU',
    icon: Users,
    image: '/images/halwaa/penerima-tamu.png',
    color: {
      bg: 'bg-white/90 hover:bg-white backdrop-blur-sm',
      border: 'border-[#E8DFD5]',
      hoverBorder: 'hover:border-emerald-500',
      iconBg: 'bg-emerald-50',
      iconText: 'text-emerald-700',
      hoverAccent: 'group-hover:text-emerald-700',
    },
  },
  {
    key: 'PENJAGA_GERBANG',
    icon: QrCode,
    image: '/images/halwaa/penjaga-gerbang.png',
    color: {
      bg: 'bg-white/90 hover:bg-white backdrop-blur-sm',
      border: 'border-[#E8DFD5]',
      hoverBorder: 'hover:border-blue-500',
      iconBg: 'bg-blue-50',
      iconText: 'text-blue-700',
      hoverAccent: 'group-hover:text-blue-700',
    },
  },
];

export default function LandingPortalPage() {
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);
  const [inputPassword, setInputPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Tos Interaktif Us. Halwaa
  const [tosState, setTosState] = useState<{
    active: boolean;
    imgUrl: string;
    bubbleText: string;
    posClass: string;
  } | null>(null);

  const tosCooldownRef = useRef(false);

  const triggerTos = useCallback(() => {
    if (tosCooldownRef.current) return;
    tosCooldownRef.current = true;

    const randomPose = TOS_POSES[Math.floor(Math.random() * TOS_POSES.length)];
    const randomCorner = TOS_CORNERS[Math.floor(Math.random() * TOS_CORNERS.length)];

    setTosState({
      active: true,
      imgUrl: randomPose.img,
      bubbleText: randomPose.text,
      posClass: randomCorner.posClass,
    });

    playTosSound();

    setTimeout(() => {
      setTosState(null);
    }, 2500);

    setTimeout(() => {
      tosCooldownRef.current = false;
    }, 3000);
  }, []);

  useEffect(() => {
    const role = getActiveRole();
    if (role && ROLES_CONFIG[role]) {
      router.replace(ROLES_CONFIG[role].route);
    }

    // Preload seluruh foto Tos saat landing page dimuat agar respon klik 100% instan
    TOS_POSES.forEach((pose) => {
      if (typeof window !== 'undefined') {
        const img = new Image();
        img.src = pose.img;
      }
    });
  }, [router]);

  const doLoginSubmit = useCallback((role: AppRole, pass: string) => {
    if (!role || isSubmitting || pass.length < 4) return;
    setIsSubmitting(true);
    setPasswordError(false);

    // Jeda kecil untuk indikator visual loading ("Memproses...")
    setTimeout(() => {
      const isValid = verifyRolePassword(role, pass);
      if (isValid) {
        setActiveRole(role);
        const targetRoute = ROLES_CONFIG[role].route;
        setSelectedRole(null);
        setInputPassword('');
        setIsSubmitting(false);
        router.push(targetRoute);
      } else {
        setPasswordError(true);
        setInputPassword('');
        setIsSubmitting(false);
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      }
    }, 400);
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
      className="min-h-screen text-[#422F21] flex flex-col justify-center items-center selection:bg-[#8C6A47]/20 selection:text-[#422F21] relative overflow-hidden py-8 px-4 sm:px-6 cursor-pointer"
      onClick={(e) => {
        if (selectedRole) return;
        const cardEl = document.getElementById('login-card');
        if (cardEl && !cardEl.contains(e.target as Node)) {
          triggerTos();
        }
      }}
    >
      {/* BACKGROUND PANGGUNG RESMI & ANIMASI DEBU EMAS */}
      <StageBackground />

      {/* KONTEN UTAMA TERPUSAT (KARTU KREM CERAH TRANSPARAN DENGAN MAX-WIDTH TERKONTROL COMPACT) */}
      <div id="login-card" className="relative z-10 w-full max-w-sm md:max-w-md p-5 md:p-6 space-y-4 bg-white/30 backdrop-blur-md border border-[#D5C4B4]/70 shadow-xl rounded-2xl text-center my-auto animate-in fade-in zoom-in-95 duration-300">
        {/* LOGO BERJAJAR */}
        <div className="flex justify-center items-center gap-2 md:gap-3 mb-3">
          <img src="/images/logo-p3tq.png" alt="Logo P3TQ" className="h-8 md:h-11 w-auto object-contain drop-shadow-xs" />
          <img src="/images/logo-haul-gold.png" alt="Logo Haul Haflah" className="h-8 md:h-11 w-auto object-contain drop-shadow-xs" />
          <img src="/images/logo-mhmtq.png" alt="Logo MHMTQ" className="h-8 md:h-11 w-auto object-contain drop-shadow-xs" />
        </div>

        {/* JUDUL & DESKRIPSI IDENTITAS */}
        <div>
          <p className="text-[10px] md:text-xs font-serif font-black tracking-[0.15em] text-[#8C6A47] uppercase mb-2">
            HAUL &amp; HAFLAH AKHIRUSSANAH 1448 H.
          </p>

          <h1 className="text-sm md:text-base font-bold text-[#422F21] leading-relaxed">
            Pondok Pesantren Putri Tahfizhil Qur-an (P3TQ)
          </h1>
          <h1 className="text-sm md:text-base font-bold text-[#422F21] leading-relaxed">
            Madrasah Hidayatul Mubtadi-aat Fittahfizhi Wal Qiro-at (MHMTQ)
          </h1>

          <p className="text-[10px] md:text-xs italic text-[#8C6A47] mt-1.5 font-medium">
            Lirboyo Kediri
          </p>

          <p className="text-[11px] md:text-xs text-stone-600 mt-2 mb-4 font-medium leading-relaxed max-w-md mx-auto">
            Portal resmi kepanitiaan. Silakan masuk sesuai bagan dan otoritas tugas Anda.
          </p>
        </div>

        {/* 4 TOMBOL AKSES ROLE - POP-OUT HOVER US. HALWAA */}
        <div className="grid grid-cols-2 gap-2.5 md:gap-3 items-stretch">
          {ROLE_BUTTONS.map(({ key, icon: Icon, image, color }) => {
            const config = ROLES_CONFIG[key];
            const isAdmin = key === 'ADMIN';

            return (
              <div key={key} className="role-card-wrapper relative group hover:z-30 z-10 h-full flex flex-col">
                {/* FOTO US. HALWAA — MUNCUL DARI BALIK KARTU SAAT HOVER (3/4 BADAN DILUAR, 1/4 TERTUTUP KARTU) */}
                <div
                  className={`absolute left-1/2 -translate-x-1/2 opacity-0 translate-y-4 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-hover:translate-y-0 transition-all duration-300 ease-out pointer-events-none overflow-hidden z-0 flex items-end justify-center ${
                    isAdmin
                      ? 'bottom-[65%] md:bottom-[70%] mb-[-12px] md:mb-[-16px] w-36 md:w-48 h-36 md:h-48'
                      : 'bottom-[65%] md:bottom-[70%] mb-[-12px] md:mb-[-16px] w-32 md:w-44 h-32 md:h-44'
                  }`}
                >
                  <img
                    src={image}
                    alt={`Us. Halwaa - ${config.title}`}
                    className="w-full h-full object-contain object-bottom drop-shadow-2xl select-none"
                    draggable={false}
                  />
                </div>

                {/* KARTU ROLE UTAMA */}
                <button
                  type="button"
                  onClick={() => handleOpenRoleModal(key)}
                  className={`relative z-10 flex items-center h-full gap-2 sm:gap-2.5 p-2.5 sm:p-3 md:p-4 ${color.bg} rounded-2xl border ${color.border} ${color.hoverBorder} shadow-xs hover:shadow-lg transition-all text-left w-full cursor-pointer active:scale-[0.98] min-w-0`}
                >
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl ${color.iconBg} ${color.iconText} border border-current/10 shrink-0`}>
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

        {/* FOOTER KECIL */}
        <div className="text-center space-y-1 pt-3 border-t border-[#D5C4B4]/60 mt-4">
          <p className="text-[10px] md:text-[11px] text-[#8C6A47] font-semibold">
            Sabtu, 24 Rajab 1448 H. / 02 Januari 2027 M. · Aula Al-Muktamar
          </p>
          <p className="text-[10px] md:text-[11px] text-stone-500 font-medium">
            Sistem Web Murni · Dibuka langsung melalui browser
          </p>
        </div>
      </div>

      {/* ================================================================= */}
      {/* MODAL INPUT PASSWORD                                              */}
      {/* ================================================================= */}
      {selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border-2 border-[#D5C4B4] space-y-5 animate-in zoom-in-95 duration-150">
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

      {/* INTERAKTIF US. HALWAA TOS POP-OUT OVERLAY */}
      {tosState?.active && (
        <div
          className={`fixed z-50 ${tosState.posClass} pointer-events-none animate-tos-pop flex flex-col items-center justify-center`}
        >
          {/* Sparkle Emas */}
          <div className="absolute inset-0 pointer-events-none overflow-visible">
            <span className="absolute -top-2 -left-2 text-amber-400 text-lg md:text-xl animate-tos-sparkle">✨</span>
            <span className="absolute -top-4 right-4 text-amber-300 text-base md:text-lg animate-tos-sparkle">⭐</span>
            <span className="absolute bottom-2 -left-4 text-amber-400 text-sm md:text-base animate-tos-sparkle">✨</span>
            <span className="absolute bottom-4 -right-2 text-amber-300 text-lg md:text-xl animate-tos-sparkle">🌟</span>
          </div>

          {/* Bubble Chat "Tos!" */}
          <div className="absolute -top-3 md:-top-5 bg-white border-2 border-[#D5C4B4] rounded-full px-3 py-1 md:px-4 md:py-1.5 shadow-xl text-xs md:text-sm font-black text-[#8C6A47] animate-tos-bounce flex items-center gap-1 z-10 whitespace-nowrap">
            <span>{tosState.bubbleText}</span>
          </div>

          {/* Foto Us. Halwaa */}
          <img
            src={tosState.imgUrl}
            alt="Us. Halwaa - Tos!"
            className="w-36 md:w-56 h-auto drop-shadow-2xl select-none object-contain"
            draggable={false}
          />
        </div>
      )}
    </div>
  );
}
