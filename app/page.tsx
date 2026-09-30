'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Users,
  LayoutDashboard,
  QrCode,
  Lock,
  ArrowRight,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { AppRole, ROLES_CONFIG, verifyRolePassword, setActiveRole } from '@/lib/auth-roles';
import StageBackground from '@/components/StageBackground';

// Konfigurasi visual 4 tombol role
const ROLE_BUTTONS: {
  key: AppRole;
  icon: React.ComponentType<{ className?: string }>;
  color: {
    bg: string;
    border: string;
    hoverBorder: string;
    iconBg: string;
    iconText: string;
    badgeBg: string;
    badgeText: string;
    btnBg: string;
    btnHoverBg: string;
    btnText: string;
    btnHoverText: string;
    btnBorder: string;
    hoverAccent: string;
  };
}[] = [
  {
    key: 'ADMIN',
    icon: ShieldCheck,
    color: {
      bg: 'bg-white/70 dark:bg-[#2E251C]/80 hover:bg-white/85 dark:hover:bg-[#382D22]/95 backdrop-blur-sm',
      border: 'border-white/60 dark:border-stone-700/60',
      hoverBorder: 'hover:border-[#8C6A47] dark:hover:border-[#C19A6B]',
      iconBg: 'bg-rose-50 dark:bg-rose-950/50',
      iconText: 'text-rose-700 dark:text-rose-300',
      badgeBg: 'bg-rose-100 dark:bg-rose-900/60',
      badgeText: 'text-rose-800 dark:text-rose-200',
      btnBg: 'bg-[#FAF7F3] dark:bg-[#251E18]',
      btnHoverBg: 'hover:bg-[#8C6A47]',
      btnText: 'text-[#5C3E28]',
      btnHoverText: 'hover:text-white',
      btnBorder: 'border-[#D5C4B4]',
      hoverAccent: 'group-hover:text-[#8C6A47] dark:group-hover:text-[#C19A6B]',
    },
  },
  {
    key: 'PENERIMA_TAMU',
    icon: Users,
    color: {
      bg: 'bg-white/70 dark:bg-[#2E251C]/80 hover:bg-white/85 dark:hover:bg-[#382D22]/95 backdrop-blur-sm',
      border: 'border-white/60 dark:border-stone-700/60',
      hoverBorder: 'hover:border-emerald-500 dark:hover:border-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/50',
      iconText: 'text-emerald-700 dark:text-emerald-300',
      badgeBg: 'bg-emerald-100 dark:bg-emerald-900/60',
      badgeText: 'text-emerald-800 dark:text-emerald-200',
      btnBg: 'bg-emerald-50/70',
      btnHoverBg: 'hover:bg-emerald-700',
      btnText: 'text-emerald-900',
      btnHoverText: 'hover:text-white',
      btnBorder: 'border-emerald-200',
      hoverAccent: 'group-hover:text-emerald-700 dark:group-hover:text-emerald-400',
    },
  },
  {
    key: 'PIMPINAN',
    icon: LayoutDashboard,
    color: {
      bg: 'bg-white/70 dark:bg-[#2E251C]/80 hover:bg-white/85 dark:hover:bg-[#382D22]/95 backdrop-blur-sm',
      border: 'border-white/60 dark:border-stone-700/60',
      hoverBorder: 'hover:border-amber-500 dark:hover:border-amber-400',
      iconBg: 'bg-amber-50 dark:bg-amber-950/50',
      iconText: 'text-amber-700 dark:text-amber-300',
      badgeBg: 'bg-amber-100 dark:bg-amber-900/60',
      badgeText: 'text-amber-800 dark:text-amber-200',
      btnBg: 'bg-amber-50/70',
      btnHoverBg: 'hover:bg-amber-700',
      btnText: 'text-amber-900',
      btnHoverText: 'hover:text-white',
      btnBorder: 'border-amber-200',
      hoverAccent: 'group-hover:text-amber-700 dark:group-hover:text-amber-400',
    },
  },
  {
    key: 'PENJAGA_GERBANG',
    icon: QrCode,
    color: {
      bg: 'bg-white/70 dark:bg-[#2E251C]/80 hover:bg-white/85 dark:hover:bg-[#382D22]/95 backdrop-blur-sm',
      border: 'border-white/60 dark:border-stone-700/60',
      hoverBorder: 'hover:border-blue-500 dark:hover:border-blue-400',
      iconBg: 'bg-blue-50 dark:bg-blue-950/50',
      iconText: 'text-blue-700 dark:text-blue-300',
      badgeBg: 'bg-blue-100 dark:bg-blue-900/60',
      badgeText: 'text-blue-800 dark:text-blue-200',
      btnBg: 'bg-blue-50/70',
      btnHoverBg: 'hover:bg-blue-700',
      btnText: 'text-blue-900',
      btnHoverText: 'hover:text-white',
      btnBorder: 'border-blue-200',
      hoverAccent: 'group-hover:text-blue-700 dark:group-hover:text-blue-400',
    },
  },
];

export default function LandingPortalPage() {
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);
  const [inputPassword, setInputPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const handleOpenRoleModal = (roleKey: AppRole) => {
    setSelectedRole(roleKey);
    setInputPassword('');
    setShowPassword(false);
    setPasswordError(false);
  };

  const handleCloseModal = () => {
    setSelectedRole(null);
    setInputPassword('');
    setPasswordError(false);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    const isValid = verifyRolePassword(selectedRole, inputPassword);
    if (isValid) {
      setActiveRole(selectedRole);
      const targetRoute = ROLES_CONFIG[selectedRole].route;
      handleCloseModal();
      router.push(targetRoute);
    } else {
      setPasswordError(true);
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    }
  };

  return (
    <div className="min-h-screen text-[#422F21] flex flex-col justify-center items-center selection:bg-[#8C6A47]/20 selection:text-[#422F21] relative overflow-hidden py-10 px-4 sm:px-6">
      {/* BACKGROUND PANGGUNG RESMI & ANIMASI DEBU EMAS */}
      <StageBackground />

      {/* KONTEN UTAMA TERPUSAT (KARTU TRANSPARAN MEWAH DI ATAS BACKDROP PANGGUNG) */}
      <div className="relative z-10 w-full max-w-2xl px-5 py-8 sm:py-12 sm:px-10 space-y-8 sm:space-y-10 bg-white/30 dark:bg-[#251E18]/60 backdrop-blur-md border border-white/50 dark:border-white/20 shadow-xl shadow-black/10 dark:shadow-black/50 rounded-3xl my-auto animate-in fade-in zoom-in-95 duration-300">
        {/* HEADER IDENTITAS */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <img src="/images/logo-p3tq.png" alt="Logo P3TQ" className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-md" />
            <img src="/images/logo-haul-gold.png" alt="Logo Haul Haflah" className="w-14 h-10 sm:w-16 sm:h-12 object-contain drop-shadow-md" />
            <img src="/images/logo-mhmtq.png" alt="Logo MHMTQ" className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-md" />
          </div>
          <div>
            <div className="text-[10px] sm:text-xs font-serif font-black tracking-[0.2em] text-[#704E32] dark:text-[#C19A6B] uppercase drop-shadow-xs">
              HAUL &amp; HAFLAH AKHIRUSSANAH 1448 H.
            </div>
            <h1 className="font-serif font-black text-xl sm:text-2xl text-[#2B1B10] dark:text-[#F5EFE6] leading-tight mt-1 drop-shadow-sm">
              P3TQ &amp; MHMTQ Lirboyo Kediri
            </h1>
          </div>
          <p className="text-xs text-[#4A3425] dark:text-[#D5C0AB] max-w-md mx-auto leading-relaxed font-semibold drop-shadow-xs">
            Portal resmi kepanitiaan. Silakan masuk sesuai bagan dan otoritas tugas Anda.
          </p>
        </div>

        {/* 4 TOMBOL AKSES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ROLE_BUTTONS.map(({ key, icon: Icon, color }) => {
            const config = ROLES_CONFIG[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleOpenRoleModal(key)}
                className={`${color.bg} rounded-2xl p-5 border ${color.border} ${color.hoverBorder} shadow-sm hover:shadow-md transition-all text-left group cursor-pointer active:scale-[0.98]`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`w-11 h-11 rounded-xl ${color.iconBg} ${color.iconText} border border-current/10 flex items-center justify-center shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-serif font-black text-sm text-[#322116] dark:text-[#F5EFE6] ${color.hoverAccent} transition-colors leading-tight`}>
                      {config.title}
                    </h3>
                    <p className="text-[11px] text-[#5C4533] dark:text-[#B8A99A] mt-0.5 leading-snug font-medium">
                      {config.subtitle}
                    </p>
                  </div>
                  <div className="shrink-0 mt-0.5">
                    <Lock className="w-4 h-4 text-[#9A826C] dark:text-[#B8A99A] group-hover:text-[#8C6A47] dark:group-hover:text-[#C19A6B] transition-colors" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* FOOTER KECIL */}
        <div className="text-center space-y-1 pt-3 border-t border-white/40 dark:border-white/10">
          <p className="text-[11px] text-[#5C3E28] dark:text-[#C19A6B] font-bold drop-shadow-xs">
            Sabtu, 24 Rajab 1448 H. / 02 Januari 2027 M. · Aula Al-Muktamar
          </p>
          <p className="text-[10px] text-[#6E5542] dark:text-[#A49282] font-semibold">
            Sistem Web Murni · Dibuka langsung melalui browser
          </p>
        </div>
      </div>

      {/* ================================================================= */}
      {/* MODAL INPUT PASSWORD                                              */}
      {/* ================================================================= */}
      {selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#251E18] text-[#422F21] dark:text-[#F5EFE6] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border-2 border-[#D5C4B4] dark:border-[#3D3226] space-y-5 animate-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FAF0E6] dark:bg-[#2E251C] text-[#8C6A47] dark:text-[#C19A6B] flex items-center justify-center font-bold border border-[#D5C4B4] dark:border-[#4A3D2F]">
                  <KeyRound className="w-5 h-5 text-[#8C6A47] dark:text-[#C19A6B]" />
                </div>
                <div>
                  <h4 className="font-serif font-black text-base text-[#422F21] dark:text-[#F5EFE6]">
                    Masuk {ROLES_CONFIG[selectedRole].title}
                  </h4>
                  <p className="text-xs text-[#7A624E] dark:text-[#B8A99A]">
                    {ROLES_CONFIG[selectedRole].subtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form Password */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#422F21] dark:text-[#F5EFE6] block">
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
                    className={`w-full px-4 py-3 rounded-2xl border-2 text-sm text-[#422F21] dark:text-[#F5EFE6] bg-white dark:bg-[#1A1512] pr-12 focus:outline-none transition-colors ${
                      passwordError
                        ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/40'
                        : 'border-[#D5C4B4] dark:border-[#3D3226] focus:border-[#8C6A47] dark:focus:border-[#C19A6B]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {passwordError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>Kata sandi tidak sesuai. Silakan periksa kembali.</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-3 rounded-2xl border border-[#D5C4B4] dark:border-[#3D3226] text-[#7A624E] dark:text-[#B8A99A] hover:bg-[#FAF7F3] dark:hover:bg-[#2E251C] text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!inputPassword.trim()}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#8C6A47] to-[#A47E57] dark:from-[#C19A6B] dark:to-[#8C6A47] hover:brightness-105 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <span>Masuk</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
