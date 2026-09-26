'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Users,
  LayoutDashboard,
  QrCode,
  Ticket,
  Lock,
  ArrowRight,
  Globe,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
  Clock,
  Compass,
} from 'lucide-react';
import { AppRole, ROLES_CONFIG, verifyRolePassword, setActiveRole } from '@/lib/auth-roles';
import TanyaUsModal from '@/components/TanyaUsModal';

export default function LandingPortalPage() {
  const router = useRouter();

  // State Dialog Password Modal
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);
  const [inputPassword, setInputPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  // State Input Kode Wali Santri
  const [kodeInput, setKodeInput] = useState('');
  const [kodeError, setKodeError] = useState<string | null>(null);

  // State Modal Ustadzah AI
  const [isUsModalOpen, setIsUsModalOpen] = useState(false);

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

  const handleOpenWaliPortal = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = kodeInput.trim().toUpperCase();
    if (!clean) {
      setKodeError('Silakan masukkan Kode Undangan Anda (contoh: SH0001 atau UND0101)');
      return;
    }
    setKodeError(null);
    router.push(`/u/${clean}`);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#422F21] flex flex-col justify-between selection:bg-[#8C6A47]/20 selection:text-[#422F21]">
      {/* Background Ornamen Halus */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#D5C4B4_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* HEADER UTAMA */}
      <header className="relative z-10 border-b border-[#E8DFD5] bg-[#FAF7F3]/90 backdrop-blur-md sticky top-0 px-4 py-3 sm:py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#EFE8E1] border-2 border-[#8C6A47] flex items-center justify-center font-bold text-[#8C6A47] shadow-xs">
              <Sparkles className="w-5 h-5 text-[#8C6A47]" />
            </div>
            <div>
              <div className="text-[10px] sm:text-xs font-serif font-black tracking-widest text-[#8C6A47] uppercase">
                PORTAL RESMI HAFLAH 1448 H. / 2027 M.
              </div>
              <h1 className="font-serif font-black text-sm sm:text-base text-[#422F21] leading-tight">
                P3TQ & MHMTQ Lirboyo Kediri
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsUsModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#8C6A47] to-[#A47E57] hover:brightness-105 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-200" />
              <span>Tanya Us AI</span>
            </button>
          </div>
        </div>
      </header>

      {/* KONTEN UTAMA */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8 sm:py-12 space-y-10 sm:space-y-14 flex-1">
        {/* BANNER UTAMA & PENJELASAN WEB MURNI */}
        <div className="text-center space-y-3 sm:space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF0E6] border border-[#D5C4B4] text-[#8C6A47] text-xs font-bold shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-[#8C6A47]" />
            <span>Sabtu, 24 Rajab 1448 H. / 02 Januari 2027 M. · Aula Al-Muktamar</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-serif font-black text-[#322116] tracking-tight leading-snug">
            Sistem Manajemen Presensi & Undangan Digital
          </h2>
          <p className="text-xs sm:text-sm text-[#7A624E] leading-relaxed max-w-2xl mx-auto">
            Selamat datang di gerbang digital resmi Haul & Haflah Pondok Pesantren Putri Tahfizhil Qur-an & Madrasah Hidayatul Mubtadi-aat Fittahfizhi Wal Qiro-at Lirboyo. Silakan pilih portal bagan panitia atau masukkan kode undangan Anda.
          </p>

          {/* Catatan Tegas: Web Murni Tanpa Perlu Download */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium shadow-xs">
            <Globe className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Platform Berbasis Web Murni:</strong> Dibuka langsung melalui peramban (browser) HP maupun Laptop tanpa perlu mengunduh aplikasi tambahan.
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BAGIAN 1: 4 PORTAL AKSES PANITIA SESUAI BAGAN & OTORITAS */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-2">
            <div>
              <h3 className="font-serif font-black text-lg text-[#422F21]">
                Akses Bagan & Kepanitiaan
              </h3>
              <p className="text-xs text-[#7A624E]">
                Akses terproteksi sandi sesuai tugas dan wewenang masing-masing seksi
              </p>
            </div>
            <span className="text-[11px] font-mono text-[#8C6A47] bg-[#FAF0E6] px-2.5 py-1 rounded-lg border border-[#D5C4B4]">
              4 Otoritas Resmi
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* 1. ADMIN */}
            <div className="bg-white rounded-3xl p-5 border-2 border-[#E8DFD5] hover:border-[#8C6A47] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center font-bold shadow-2xs">
                    <ShieldCheck className="w-6 h-6 text-rose-700" />
                  </div>
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                    Semua Akses
                  </span>
                </div>
                <div>
                  <h4 className="font-serif font-black text-base text-[#422F21] group-hover:text-[#8C6A47] transition-colors">
                    Administrator
                  </h4>
                  <p className="text-[11px] text-[#8C6A47] font-semibold mt-0.5">
                    Seksi Kesekretariatan & Sistem
                  </p>
                  <p className="text-xs text-[#7A624E] leading-relaxed mt-2">
                    Kelola master data santri & tamu, rekonsiliasi kuota, audit log, buka/tutup kuota tambahan, dan ekspor data Excel/PDF.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenRoleModal('ADMIN')}
                className="w-full py-2.5 px-4 rounded-2xl bg-[#FAF7F3] hover:bg-[#8C6A47] text-[#5C3E28] hover:text-white border border-[#D5C4B4] hover:border-[#8C6A47] text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-2xs cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Masuk Admin</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 2. PENERIMA TAMU */}
            <div className="bg-white rounded-3xl p-5 border-2 border-[#E8DFD5] hover:border-emerald-600 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold shadow-2xs">
                    <Users className="w-6 h-6 text-emerald-700" />
                  </div>
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Dasbor & Absen Tamu
                  </span>
                </div>
                <div>
                  <h4 className="font-serif font-black text-base text-[#422F21] group-hover:text-emerald-700 transition-colors">
                    Penerima Tamu
                  </h4>
                  <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                    Pos Meja Transit & Protokoler
                  </p>
                  <p className="text-xs text-[#7A624E] leading-relaxed mt-2">
                    Live dasbor tamu, akses absen cepat tamu undangan kehormatan & VIP tanpa antre gerbang, serta panduan 8 pos jaga.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenRoleModal('PENERIMA_TAMU')}
                className="w-full py-2.5 px-4 rounded-2xl bg-emerald-50/70 hover:bg-emerald-700 text-emerald-900 hover:text-white border border-emerald-200 hover:border-emerald-700 text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-2xs cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Masuk Penerima Tamu</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 3. PIMPINAN */}
            <div className="bg-white rounded-3xl p-5 border-2 border-[#E8DFD5] hover:border-amber-600 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold shadow-2xs">
                    <LayoutDashboard className="w-6 h-6 text-amber-700" />
                  </div>
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    Executive View
                  </span>
                </div>
                <div>
                  <h4 className="font-serif font-black text-base text-[#422F21] group-hover:text-amber-700 transition-colors">
                    Pimpinan & Masyayikh
                  </h4>
                  <p className="text-[11px] text-amber-700 font-semibold mt-0.5">
                    Dewan Pengasuh & Penasehat
                  </p>
                  <p className="text-xs text-[#7A624E] leading-relaxed mt-2">
                    Live dasbor eksekutif: Okupansi kursi Aula Al-Muktamar, rasio kehadiran putra vs putri, dan grafik kedatangan per jam.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenRoleModal('PIMPINAN')}
                className="w-full py-2.5 px-4 rounded-2xl bg-amber-50/70 hover:bg-amber-700 text-amber-900 hover:text-white border border-amber-200 hover:border-amber-700 text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-2xs cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Buka Dasbor Pimpinan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 4. PENJAGA GERBANG */}
            <div className="bg-white rounded-3xl p-5 border-2 border-[#E8DFD5] hover:border-blue-600 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold shadow-2xs">
                    <QrCode className="w-6 h-6 text-blue-700" />
                  </div>
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    Scanner & Cek Peserta
                  </span>
                </div>
                <div>
                  <h4 className="font-serif font-black text-base text-[#422F21] group-hover:text-blue-700 transition-colors">
                    Penjaga Gerbang
                  </h4>
                  <p className="text-[11px] text-blue-700 font-semibold mt-0.5">
                    Seksi Keamanan & Petugas Pintu
                  </p>
                  <p className="text-xs text-[#7A624E] leading-relaxed mt-2">
                    PWA scanner QR kamera & barcode USB, verifikasi fisik tiket Hitam Gold vs Merah Gold, dan audio buzzer error.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenRoleModal('PENJAGA_GERBANG')}
                className="w-full py-2.5 px-4 rounded-2xl bg-blue-50/70 hover:bg-blue-700 text-blue-900 hover:text-white border border-blue-200 hover:border-blue-700 text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-2xs cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Buka Scanner Gerbang</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BAGIAN 2: PORTAL KHUSUS WALI SANTRI & TAMU UNDANGAN (TANPA PASSWORD) */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-br from-[#FAF7F3] via-white to-[#F4EFE6] rounded-3xl p-6 sm:p-10 border-2 border-[#D5C4B4] shadow-sm space-y-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFE8E1] text-[#8C6A47] text-xs font-bold">
              <Ticket className="w-3.5 h-3.5 text-[#8C6A47]" />
              <span>Akses Walisantri & Tamu Undangan</span>
            </div>
            <h3 className="font-serif font-black text-xl sm:text-2xl text-[#322116]">
              Buka Undangan Digital & Kartu Masuk Anda
            </h3>
            <p className="text-xs sm:text-sm text-[#7A624E] leading-relaxed">
              Wali santri dan tamu undangan dapat langsung membuka kartu undangan tanpa password panitia. Silakan ketik Kode Registrasi Anda (misal: <code className="font-mono font-bold text-[#8C6A47]">SH0001</code> atau <code className="font-mono font-bold text-[#8C6A47]">UND0101</code>).
            </p>
          </div>

          <form onSubmit={handleOpenWaliPortal} className="max-w-xl space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={kodeInput}
                onChange={(e) => setKodeInput(e.target.value)}
                placeholder="Ketik kode: SH0001, SH0042, UND0101..."
                className="flex-1 px-4 py-3 rounded-2xl bg-white border-2 border-[#D5C4B4] focus:border-[#8C6A47] focus:outline-none text-sm font-mono uppercase tracking-wider text-[#422F21] placeholder:text-stone-400 shadow-inner"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#8C6A47] to-[#A47E57] hover:brightness-105 text-white font-serif font-black text-sm shadow-md transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer active:scale-95"
              >
                <span>Buka Undangan ✉️</span>
                <ArrowRight className="w-4 h-4 text-amber-200" />
              </button>
            </div>

            {kodeError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{kodeError}</span>
              </div>
            )}
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-[#7A624E] border-t border-[#E8DFD5]">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#8C6A47]"></span>
              <span>Registrasi Buka: <strong>06.30 WIB / 07.00 WIs</strong></span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>Lokasi: <strong>Aula Al-Muktamar Lirboyo</strong></span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              <span>Konsultasi: <strong>Ustadzah AI Siap Menjawab</strong></span>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-[#E8DFD5] bg-[#FAF7F3] px-4 py-6 text-center text-xs text-[#7A624E] space-y-1">
        <p className="font-serif font-bold text-[#422F21]">
          Pondok Pesantren Putri Tahfizhil Qur-an & Madrasah Hidayatul Mubtadi-aat Fittahfizhi Wal Qiro-at
        </p>
        <p>Lirboyo Kota Kediri Jawa Timur 1448 H. / 2027 M.</p>
        <p className="text-[11px] text-stone-500 pt-1">
          Sistem Web Murni Terintegrasi · Tanpa Instalasi Aplikasi
        </p>
      </footer>

      {/* ========================================================================= */}
      {/* MODAL INPUT PASSWORD UNTUK BAGAN PANITIA */}
      {/* ========================================================================= */}
      {selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border-2 border-[#D5C4B4] space-y-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FAF0E6] text-[#8C6A47] flex items-center justify-center font-bold border border-[#D5C4B4]">
                  <KeyRound className="w-5 h-5 text-[#8C6A47]" />
                </div>
                <div>
                  <h4 className="font-serif font-black text-base text-[#422F21]">
                    Otentikasi {ROLES_CONFIG[selectedRole].title}
                  </h4>
                  <p className="text-xs text-[#7A624E]">
                    {ROLES_CONFIG[selectedRole].subtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full hover:bg-stone-100 text-stone-500 hover:text-stone-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] text-xs text-[#7A624E] space-y-1">
              <div className="font-bold text-[#422F21]">Otoritas Fitur:</div>
              <p className="leading-relaxed">{ROLES_CONFIG[selectedRole].description}</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#422F21] block">
                  Masukkan Kata Sandi {ROLES_CONFIG[selectedRole].title}:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={inputPassword}
                    onChange={(e) => {
                      setInputPassword(e.target.value);
                      setPasswordError(false);
                    }}
                    placeholder={`Ketik kata sandi ${ROLES_CONFIG[selectedRole].title}...`}
                    autoFocus
                    className={`w-full px-4 py-3 rounded-2xl border-2 text-sm text-[#422F21] pr-12 focus:outline-none transition-colors ${
                      passwordError
                        ? 'border-rose-500 bg-rose-50/50'
                        : 'border-[#D5C4B4] focus:border-[#8C6A47]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-800 p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {passwordError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Kata sandi tidak sesuai. Silakan periksa kembali sandi resmi Anda.</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-3 rounded-2xl border border-[#D5C4B4] text-[#7A624E] hover:bg-[#FAF7F3] text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!inputPassword.trim()}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#8C6A47] to-[#A47E57] hover:brightness-105 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <span>Masuk Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL USTADZAH AI (MODE WALI / UMUM) */}
      {isUsModalOpen && (
        <TanyaUsModal
          isOpen={isUsModalOpen}
          onClose={() => setIsUsModalOpen(false)}
          role="WALI"
        />
      )}
    </div>
  );
}
