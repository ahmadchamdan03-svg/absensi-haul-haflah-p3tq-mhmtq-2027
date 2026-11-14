'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getActiveRole } from '@/lib/auth-roles';
import {
  LayoutDashboard,
  QrCode,
  ShieldCheck,
  Users,
  ClipboardCheck,
  Send,
  RotateCcw,
  FileSpreadsheet,
  History,
  X,
  Mail,
  ChevronLeft,
} from 'lucide-react';
import UniversalSearchModal from '@/components/UniversalSearchModal';
import TanyaUsModal from '@/components/TanyaUsModal';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
  setIsCollapsed?: React.Dispatch<React.SetStateAction<boolean>>;
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

const ALL_NAV_GROUPS: NavGroup[] = [
  {
    groupTitle: 'MENU UTAMA',
    items: [
      { href: '/admin/dasbor', label: 'Live Dasbor', icon: LayoutDashboard, badge: 'Live' },
      { href: '/penerima-tamu', label: 'Penerima Tamu', icon: Users },
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
      { href: '/admin/import-export', label: 'Import & Export Excel', icon: FileSpreadsheet, badge: 'Excel' },
      { href: '/admin/whatsapp', label: 'WhatsApp Gateway', icon: Send, badge: 'Fonnte' },
    ],
  },
  {
    groupTitle: 'AUDIT & LAPORAN',
    items: [
      { href: '/rekon', label: 'Rekonsiliasi Kuota', icon: RotateCcw },
      { href: '/admin/audit-log', label: 'Audit Log', icon: History },
      { href: '/admin/laporan', label: 'Rekap & Ekspor', icon: FileSpreadsheet },
      { href: '/admin/persidangan', label: 'Persidangan', icon: Mail },
    ],
  },
];

const GATE_NAV_GROUPS: NavGroup[] = [
  {
    groupTitle: 'MENU UTAMA',
    items: [
      { href: '/scan', label: 'Scanner Gerbang', icon: QrCode },
      { href: '/dasbor', label: 'Live Dasbor', icon: LayoutDashboard, badge: 'Live' },
      { href: '/penerima-tamu', label: 'Penerima Tamu', icon: Users },
    ],
  },
];

export default function Sidebar({
  mobileOpen,
  onCloseMobile,
  isCollapsed = false,
  setIsCollapsed,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // State Universal Search
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchInitialTab, setSearchInitialTab] = useState<'SEMUA' | 'FITUR' | 'PESERTA' | 'LOKASI' | 'AI'>('SEMUA');

  // State Tanya Usth.! (Gemini 3.5 AI Modal & Hover Animasi)
  const [tanyaUsOpen, setTanyaUsOpen] = useState(false);
  const [isUsHovered, setIsUsHovered] = useState(false);

  // Idle Background Preloading untuk seluruh rute navigasi di Sidebar
  useEffect(() => {
    const prefetchRoutes = () => {
      try {
        const currentRole = getActiveRole();
        const targetGroups = currentRole === 'PENJAGA_GERBANG' ? GATE_NAV_GROUPS : ALL_NAV_GROUPS;
        const uniqueHrefs = Array.from(
          new Set(targetGroups.flatMap((g) => g.items.map((i) => i.href)))
        );

        uniqueHrefs.forEach((href) => {
          try {
            router.prefetch(href);
          } catch {
            // Silently ignore prefetch errors
          }
        });
      } catch {
        // Silently catch unexpected prefetch errors
      }
    };

    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        const idleId = (window as any).requestIdleCallback(prefetchRoutes, { timeout: 3000 });
        return () => {
          if ('cancelIdleCallback' in window) {
            (window as any).cancelIdleCallback(idleId);
          }
        };
      } else {
        const timerId = setTimeout(prefetchRoutes, 3000);
        return () => clearTimeout(timerId);
      }
    }
  }, [router]);

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

  // Hydration-safe: role dibaca setelah mount
  const [activeRole, setActiveRoleState] = useState<ReturnType<typeof getActiveRole> | null>(null);
  useEffect(() => {
    setActiveRoleState(getActiveRole());
  }, []);

  const toggleCollapse = () => {
    if (setIsCollapsed) {
      setIsCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('haflah_sidebar_collapsed', String(next));
        } catch {}
        return next;
      });
    }
  };

  // Untuk role Penjaga Gerbang: Tampilkan Scanner Gerbang, Live Dasbor, dan Penerima Tamu
  const navGroups: NavGroup[] = activeRole === 'PENJAGA_GERBANG'
    ? GATE_NAV_GROUPS
    : ALL_NAV_GROUPS;

  // Render konten sidebar fleksibel (mode collapsed vs expanded)
  const renderSidebarContent = (collapsed: boolean) => (
    <div className="flex flex-col h-full bg-white/40 backdrop-blur-xl border-r border-white/50 text-[#0F2C59] shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300">
      {/* Header Sidebar: Identitas Resmi Sejajar dengan TopHeader (h-[72px]) */}
      <div className="h-[72px] px-3 border-b border-white/50 bg-white/30 backdrop-blur-xs relative select-none flex items-center justify-center shrink-0">
        {collapsed ? (
          <Link
            href="/"
            prefetch={true}
            onClick={onCloseMobile}
            className="flex items-center justify-center group"
            title="HAUL & HAFLAH P3TQ & MHMTQ Lirboyo 1448 H. / 2027 M."
          >
            <img
              src="/images/logo-haul-white.png"
              alt="Logo Haul"
              className="h-10 w-auto object-contain brightness-0 invert drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform"
            />
          </Link>
        ) : (
          <Link
            href="/"
            prefetch={true}
            onClick={onCloseMobile}
            className="block group text-center space-y-0.5"
          >
            <div className="font-serif font-black text-xs sm:text-sm tracking-wider text-[#0F2C59] leading-none group-hover:text-[#1D4ED8] transition-colors whitespace-nowrap">
              HAUL &amp; HAFLAH
            </div>
            <div className="text-[11px] font-bold text-[#1E40AF] tracking-wide leading-tight whitespace-nowrap">
              P3TQ &amp; MHMTQ Lirboyo
            </div>
            <div className="pt-0.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#F0F9FF] text-[#1D4ED8] border border-[#D49B5B] text-[10px] font-serif font-bold tracking-wider shadow-2xs whitespace-nowrap">
                1448 H. / 2027 M.
              </span>
            </div>
          </Link>
        )}

        {/* Tombol Tutup Mobile Drawer */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden absolute top-2 right-2 p-1 rounded-xl bg-white border border-[#BAE6FD] text-[#7A624E] hover:text-[#0F2C59]"
          aria-label="Tutup menu"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Navigasi Menu Vertikal Terkelompok — Clearance pb-36 agar menu terakhir tidak tertutup FAB */}
      <div className={`flex-1 overflow-y-auto ${collapsed ? 'px-2 pt-4 pb-36 space-y-4' : 'px-3 pt-4 pb-36 space-y-6'}`}>
        {navGroups.map((group) => (
          <div key={group.groupTitle} className="space-y-1">
            {collapsed ? (
              <div className="my-2 mx-1.5 h-px bg-white/40" title={group.groupTitle} />
            ) : (
              <div className="px-3 text-[10px] font-black uppercase tracking-wider text-[#1D4ED8]/80 whitespace-nowrap">
                {group.groupTitle}
              </div>
            )}

            <div className="space-y-1 pt-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/' && (pathname.startsWith(`${item.href}/`) || pathname.startsWith(`${item.href}?`)));

                if (collapsed) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={true}
                      onClick={onCloseMobile}
                      title={`${item.label}${item.badge ? ` (${item.badge})` : ''}`}
                      className={`relative w-11 h-11 mx-auto flex items-center justify-center rounded-2xl transition-all duration-200 group ${
                        isActive
                          ? 'bg-[#1D4ED8] text-white shadow-md font-bold border border-[#1E40AF]'
                          : 'text-[#0F2C59] hover:bg-white/60 hover:text-[#1D4ED8]'
                      }`}
                    >
                      <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-[#1D4ED8] group-hover:scale-110 transition-transform'}`} />
                      {item.badge && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white/80" />
                      )}
                    </Link>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    onClick={onCloseMobile}
                    className={`sidebar-transition flex items-center justify-between pl-4 pr-3.5 py-2.5 rounded-2xl text-xs font-semibold tracking-wide ${
                      isActive
                        ? 'bg-[#1D4ED8] text-white shadow-sm font-bold border border-[#1E40AF]'
                        : 'text-[#0F2C59] hover:bg-white/50 hover:text-[#1D4ED8]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#1D4ED8]'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : item.badge === 'Live'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-sky-100 text-blue-950 border border-sky-300'
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
    </div>
  );

  return (
    <>
      {/* 1. Desktop Glassy Collapsible Sidebar V3 */}
      <aside
        className={`hidden lg:block shrink-0 h-full no-print select-none relative z-30 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-[78px]' : 'w-[260px]'
        }`}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {renderSidebarContent(isCollapsed)}

        {/* Tombol Toggle Collapse / Expand di pojok kanan atas sidebar */}
        <button
          type="button"
          onClick={toggleCollapse}
          className="absolute -right-3.5 top-7 bg-white/90 backdrop-blur-md rounded-full p-1.5 shadow-md border border-white/60 hover:scale-110 active:scale-95 transition-all z-50 cursor-pointer text-[#1D4ED8] hover:text-[#0F2C59] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
          title={isCollapsed ? 'Lebarkan Sidebar (260px)' : 'Kecilkan Sidebar (78px)'}
          aria-label={isCollapsed ? 'Lebarkan Sidebar' : 'Kecilkan Sidebar'}
        >
          <ChevronLeft
            className={`w-3.5 h-3.5 transition-transform duration-300 ease-in-out ${
              isCollapsed ? 'rotate-180' : ''
            }`}
          />
        </button>
      </aside>

      {/* 2. Mobile Drawer & Backdrop Overlay (Selalu expanded w-72) */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex no-print">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={onCloseMobile}
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-slide-right">
            {renderSidebarContent(false)}
          </div>
        </div>
      )}

      {/* 3. Universal Search Spotlight Modal */}
      <UniversalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        initialTab={searchInitialTab}
      />

      {/* 4. Pop-up AI Tanya Usth.! (Didukung Gemini 3.5) */}
      <TanyaUsModal
        isOpen={tanyaUsOpen}
        onClose={() => setTanyaUsOpen(false)}
      />

      {/* 5. Floating Action Button (FAB) Usth. Halwaa - Melayang di Kiri Bawah (Fixed) */}
      <button
        type="button"
        onClick={() => setTanyaUsOpen(true)}
        onMouseEnter={() => setIsUsHovered(true)}
        onMouseLeave={() => setIsUsHovered(false)}
        className={`fixed bottom-6 z-[60] group flex items-center bg-[#0F2C59] hover:bg-blue-700 text-white shadow-2xl border border-blue-400/30 transition-all duration-300 hover:scale-105 hover:-translate-y-1 active:scale-95 cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
          isCollapsed
            ? 'left-3.5 w-12 h-12 rounded-2xl justify-center p-1'
            : 'left-6 pl-2 pr-5 py-2 rounded-full gap-2.5'
        }`}
        title="Usth. Halwaa"
        aria-label="Usth. Halwaa Asisten AI"
      >
        <div className="relative w-8 h-8 shrink-0">
          <div className="w-full h-full rounded-full overflow-hidden bg-white/20 border border-white/40">
            <img
              src={isUsHovered ? '/images/ustadzah-half-hover.png' : '/images/ustadzah-avatar.png'}
              alt="Usth. Halwaa"
              className="w-full h-full object-cover object-center"
            />
          </div>
          <span className="absolute top-0 right-0 z-10 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0F2C59] animate-pulse" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col text-left pr-1">
            <span className="text-xs font-bold tracking-wide leading-tight text-white">
              Usth. Halwaa
            </span>
            <span className="text-[10px] font-medium text-blue-200 leading-none mt-0.5">
              Asisten AI
            </span>
          </div>
        )}
      </button>
    </>
  );
}
