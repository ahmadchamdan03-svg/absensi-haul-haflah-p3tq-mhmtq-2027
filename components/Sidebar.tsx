'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  LayoutDashboard,
  QrCode,
  ShieldCheck,
  Users,
  ClipboardCheck,
  Send,
  RotateCcw,
  FileSpreadsheet,
  Sparkles,
  X,
  ExternalLink,
  GripVertical,
  Search,
  Bot,
} from 'lucide-react';
import UniversalSearchModal from '@/components/UniversalSearchModal';
import TanyaUsModal from '@/components/TanyaUsModal';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

export default function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  // State untuk pengaturan lebar sidebar manual (Desktop)
  const [sidebarWidth, setSidebarWidth] = useState<number>(280);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  // State Universal Search
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchInitialTab, setSearchInitialTab] = useState<'SEMUA' | 'FITUR' | 'PESERTA' | 'LOKASI' | 'AI'>('SEMUA');

  // State Tanya Us! (Gemini 3.5 AI Modal & Hover Animasi)
  const [tanyaUsOpen, setTanyaUsOpen] = useState(false);
  const [isUsHovered, setIsUsHovered] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleOpenTanya = () => setTanyaUsOpen(true);
      window.addEventListener('open-tanya-us', handleOpenTanya);
      const params = new URLSearchParams(window.location.search);
      if (params.get('tanya') === '1' || params.get('tanya') === 'true') {
        setTanyaUsOpen(true);
      }
      return () => window.removeEventListener('open-tanya-us', handleOpenTanya);
    }
  }, []);

  // Shortcut Keyboard Global: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchInitialTab('SEMUA');
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Ambil lebar tersimpan dari localStorage saat komponen dimuat
  useEffect(() => {
    try {
      const savedWidth = localStorage.getItem('haflah_sidebar_width');
      if (savedWidth) {
        const parsed = parseInt(savedWidth, 10);
        if (parsed >= 220 && parsed <= 480) {
          setSidebarWidth(parsed);
        }
      }
    } catch {
      // Abaikan jika localStorage dibatasi
    }
  }, []);

  // Handler interaktif drag untuk memperbesar / memperkecil lebar sidebar
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleResetWidth = () => {
    setSidebarWidth(280);
    try {
      localStorage.setItem('haflah_sidebar_width', '280');
    } catch {}
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Hitung lebar sidebar dari posisi horizontal cursor layar
      const newWidth = Math.max(220, Math.min(480, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      try {
        localStorage.setItem('haflah_sidebar_width', sidebarWidth.toString());
      } catch {}
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, sidebarWidth]);

  const navGroups: NavGroup[] = [
    {
      groupTitle: 'MENU UTAMA',
      items: [
        { href: '/', label: 'Beranda', icon: Home },
        { href: '/admin/dasbor', label: 'Live Dasbor', icon: LayoutDashboard, badge: 'Live' },
      ],
    },
    {
      groupTitle: 'OPERASIONAL GERBANG',
      items: [
        { href: '/scan', label: 'Scanner Gerbang', icon: QrCode },
        { href: '/admin/verifikasi', label: 'Verifikasi Manual', icon: ShieldCheck },
      ],
    },
    {
      groupTitle: 'DATA & WALI SANTRI',
      items: [
        { href: '/admin/peserta', label: 'Data Peserta', icon: Users },
        { href: '/admin/konfirmasi', label: 'Konfirmasi Hadir', icon: ClipboardCheck },
        { href: '/admin/whatsapp', label: 'WhatsApp Gateway', icon: Send, badge: 'Fonnte' },
      ],
    },
    {
      groupTitle: 'AUDIT & LAPORAN',
      items: [
        { href: '/rekon', label: 'Rekonsiliasi Kuota', icon: RotateCcw },
        { href: '/admin/laporan', label: 'Rekap & Ekspor', icon: FileSpreadsheet },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#FAF7F3] border-r-2 border-[#D5C4B4] text-[#422F21]">
      {/* Header Sidebar: Identitas Resmi Kompak & Sejajar Lurus dengan TopHeader (h-[72px]) */}
      <div className="h-[72px] px-3 border-b-2 border-[#D5C4B4] bg-[#EFE8E1]/60 relative select-none flex items-center justify-center shrink-0">
        {/* Tombol Rahasia Miniatur Buroq di Pojok Kiri Header Sidebar */}
        <Link
          href="/miraj-journey"
          onClick={onCloseMobile}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full p-0.5 bg-[#FAF7F3] border border-[#D49B5B] shadow-2xs hover:scale-115 active:scale-95 transition-transform group flex items-center justify-center cursor-pointer z-10"
          title="Rahasia Safar: Game Penunggang Buroq 🎮"
        >
          <img
            src="/images/logo-kuda-api.png"
            alt="Buroq Game Secret"
            className="w-full h-full object-contain filter drop-shadow-2xs group-hover:rotate-6 transition-transform"
          />
        </Link>

        <Link
          href="/"
          onClick={onCloseMobile}
          className="block group text-center space-y-0.5 pl-6"
        >
          <div className="font-serif font-black text-xs sm:text-sm tracking-wider text-[#422F21] leading-none group-hover:text-[#8C6A47] transition-colors">
            HAUL & HAFLAH
          </div>
          <div className="text-[11px] font-bold text-[#735334] tracking-wide leading-tight">
            P3TQ & MHMTQ Lirboyo
          </div>
          <div className="pt-0.5">
            <span className="inline-flex items-center px-2 py-0.2 rounded-full bg-[#FAF7F3] text-[#8C6A47] border border-[#D49B5B] text-[10px] font-serif font-bold tracking-wider shadow-2xs">
              1448 H. / 2027 M.
            </span>
          </div>
        </Link>

        {/* Tombol Tutup Mobile Drawer */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden absolute top-2 right-2 p-1 rounded-xl bg-white border border-[#D5C4B4] text-[#7A624E] hover:text-[#422F21]"
          aria-label="Tutup menu"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Navigasi Menu Vertikal Terkelompok */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.groupTitle} className="space-y-1">
            <div className="px-3 text-[10px] font-black uppercase tracking-wider text-[#8C6A47]/80">
              {group.groupTitle}
            </div>

            <div className="space-y-1 pt-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold tracking-wide transition-all ${
                      isActive
                        ? 'bg-[#8C6A47] text-white shadow-sm font-bold border border-[#735334]'
                        : 'text-[#422F21] hover:bg-[#EFE8E1] hover:text-[#8C6A47]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#8C6A47]'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : item.badge === 'Live'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Sidebar: Karakter Ustadzah AI (Tanpa Pop Up Chat Bubble) */}
      <div className="pt-2 pb-3 px-2 border-t-2 border-[#D5C4B4] bg-gradient-to-b from-[#FAF7F3] to-[#EFE8E1] select-none flex flex-col items-center justify-center">
        <button
          type="button"
          onClick={() => setTanyaUsOpen(true)}
          onMouseEnter={() => setIsUsHovered(true)}
          onMouseLeave={() => setIsUsHovered(false)}
          className="group relative flex flex-col items-center cursor-pointer focus:outline-none"
          title="Klik untuk bertanya ke Ustadzah AI (Us AI)"
        >
          {/* Area Gambar Karakter Ustadzah (Satu elemen gambar bersih tanpa ghosting/tumpuk) */}
          <div className="relative w-20 h-20 sm:w-22 sm:h-20 flex items-end justify-center transition-transform duration-200 group-hover:scale-105">
            <img
              src={isUsHovered ? '/images/ustadzah-half-hover.png' : '/images/ustadzah-half-standby.png'}
              alt="Ustadzah AI"
              className="w-full h-full object-contain object-bottom filter drop-shadow-sm"
            />
          </div>

          {/* Label Tanya Us AI! (Menempel langsung tanpa jarak) */}
          <div className="-mt-1 px-3 py-1 rounded-full bg-gradient-to-r from-[#8C6A47] via-[#9B7752] to-[#8C6A47] group-hover:brightness-110 text-white text-[11px] font-bold shadow-xs border border-[#735334] flex items-center space-x-1.5 transition-all group-hover:scale-105 active:scale-95 z-10">
            <Sparkles className="w-3 h-3 text-amber-200 animate-pulse" />
            <span>Tanya Us AI!</span>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Resizable Sidebar */}
      <aside
        style={{ width: `${sidebarWidth}px` }}
        className={`hidden lg:block shrink-0 h-screen sticky top-0 z-30 no-print select-none relative ${
          isResizing ? '' : 'transition-[width] duration-150 ease-out'
        }`}
      >
        {sidebarContent}

        {/* Drag Handle di Tepi Kanan Sidebar */}
        <div
          onMouseDown={handleMouseDown}
          onDoubleClick={handleResetWidth}
          title="Tarik ke kiri/kanan untuk mengatur lebar sidebar secara manual (Klik 2x untuk reset)"
          className={`absolute top-0 -right-1.5 w-3 h-full cursor-col-resize z-40 flex items-center justify-center transition-colors group ${
            isResizing
              ? 'bg-[#8C6A47]/60 text-white'
              : 'hover:bg-[#8C6A47]/30 text-transparent hover:text-[#8C6A47]'
          }`}
        >
          {/* Indikator Pegangan Vertikal Visual */}
          <div className="w-1 h-12 rounded-full bg-[#8C6A47] opacity-50 group-hover:opacity-100 transition-opacity" />
        </div>
      </aside>

      {/* 2. Mobile Drawer & Backdrop Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex no-print">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={onCloseMobile}
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-slide-right">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* 3. Universal Search Spotlight Modal */}
      <UniversalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        initialTab={searchInitialTab}
      />

      {/* 4. Pop-up AI Tanya Us! (Didukung Gemini 3.5) */}
      <TanyaUsModal
        isOpen={tanyaUsOpen}
        onClose={() => setTanyaUsOpen(false)}
      />
    </>
  );
}

