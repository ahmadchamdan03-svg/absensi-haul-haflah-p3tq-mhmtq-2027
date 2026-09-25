'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Sparkles,
  MapPin,
  Users,
  Compass,
  ArrowRight,
  X,
  Bot,
  Send,
  CornerDownLeft,
  CheckCircle2,
  Clock,
  Award,
  ShieldCheck,
  QrCode,
  FileSpreadsheet,
  Settings,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { store } from '@/lib/mock-data';

export interface SearchItem {
  id: string;
  tipe: 'FITUR' | 'PESERTA' | 'LOKASI' | 'AI';
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  href?: string;
  action?: () => void;
  metadata?: any;
}

// 1. Data Menu & Fitur Aplikasi
const DAFTAR_FITUR: SearchItem[] = [
  {
    id: 'f-dasbor',
    tipe: 'FITUR',
    title: 'Live Dasbor Monitoring Realtime',
    subtitle: 'Pantau arus kedatangan gerbang, kapasitas kursi aula, dan statistik per kategori',
    badge: 'Realtime',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    href: '/admin/dasbor',
  },
  {
    id: 'f-peserta',
    tipe: 'FITUR',
    title: 'Daftar Peserta & Tamu Tiap Kategori',
    subtitle: 'Basis data santri Bil Ghoib, Bin Nadzori, Tamatan, & 70 Tamu Undangan Khusus',
    badge: 'Database',
    badgeColor: 'bg-[#EFE8E1] text-[#8C6A47] border-[#D5C4B4]',
    href: '/admin/peserta',
  },
  {
    id: 'f-rekon',
    tipe: 'FITUR',
    title: 'Meja Rekonsiliasi & Kasus Khusus',
    subtitle: 'Koreksi status hadir, ubah kategori santri, kelola kuota tambahan & tamu walk-in',
    badge: 'Gerbang',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    href: '/rekon',
  },
  {
    id: 'f-kuota',
    tipe: 'FITUR',
    title: 'Verifikasi Kuota Tambahan 6 Jam',
    subtitle: 'Meja verifikasi bukti transfer manual wali santri sebelum auto-approve 12 jam',
    badge: 'Keuangan',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
    href: '/admin/kuota-tambahan',
  },
  {
    id: 'f-scan',
    tipe: 'FITUR',
    title: 'Scanner Barcode Gerbang Bola Dunia',
    subtitle: 'Pemindaian barcode tiket di Jalur Barat (Putra) dan Jalur Timur (Putri)',
    badge: 'Gate Scanner',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    href: '/scan',
  },
  {
    id: 'f-laporan',
    tipe: 'FITUR',
    title: 'Sub Ekspor & Laporan Kehadiran',
    subtitle: 'Daftar yang sudah absen masuk vs siapa saja yang belum hadir + Ekspor Multi-sheet Excel',
    badge: 'Laporan',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    href: '/admin/laporan',
  },
  {
    id: 'f-pengaturan',
    tipe: 'FITUR',
    title: 'Pengaturan Acara & Konfigurasi Sistem',
    subtitle: 'Kebijakan kuota, kunci HMAC gerbang, SLA verifikasi, dan link WhatsApp group',
    badge: 'Sistem',
    badgeColor: 'bg-stone-100 text-stone-800 border-stone-300',
    href: '/admin/pengaturan',
  },
  {
    id: 'f-undangan',
    tipe: 'FITUR',
    title: 'Portal Undangan Digital Wali Santri',
    subtitle: 'Tampilan e-invitation dan barcode QR dinamis yang diterima wali santri',
    badge: 'Public Portal',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    href: '/u/SH0001',
  },
];

// 2. Data Tempat & Lokasi Acara Haflah
const DAFTAR_LOKASI: SearchItem[] = [
  {
    id: 'loc-gerbang',
    tipe: 'LOKASI',
    title: 'Gerbang Selatan (Tugu Bola Dunia)',
    subtitle: 'Pintu utama masuk acara. Jalur Barat (Putra), Jalur Timur (Putri), dan Meja Rekonsiliasi',
    badge: 'Pintu Masuk',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  {
    id: 'loc-aula',
    tipe: 'LOKASI',
    title: 'Aula Muktamar Pondok Pesantren Lirboyo',
    subtitle: 'Gedung utama Haul & Haflah 1448 H. Jl. HM. Winarto, Campurejo, Mojoroto, Kediri',
    badge: 'Gedung Utama',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  {
    id: 'loc-panggung',
    tipe: 'LOKASI',
    title: 'Panggung Utama Kehormatan',
    subtitle: 'Panggung prosesi wisudawati Bil Ghoib 30 Juz & Ibu Pendamping (Tiket Emas Panggung)',
    badge: 'Panggung Khusus',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  {
    id: 'loc-vip',
    tipe: 'LOKASI',
    title: 'Baris Kehormatan VIP (Depan Panggung)',
    subtitle: 'Alokasi kursi baris depan khusus Masyayikh, Pejabat Forkopimda, & Penguji Al-Qur\'an',
    badge: 'Zona VIP',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
  },
  {
    id: 'loc-barat',
    tipe: 'LOKASI',
    title: 'Zona Duduk Sayap Barat Aula',
    subtitle: 'Area khusus tempat duduk wali santri & tamu undangan laki-laki',
    badge: 'Sayap Putra',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
  },
  {
    id: 'loc-timur',
    tipe: 'LOKASI',
    title: 'Zona Duduk Sayap Timur Aula',
    subtitle: 'Area khusus tempat duduk wali santri & tamu undangan perempuan',
    badge: 'Sayap Putri',
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
  },
  {
    id: 'loc-rekon',
    tipe: 'LOKASI',
    title: 'Meja Rekonsiliasi & Kasus Khusus',
    subtitle: 'Sisi dalam Gerbang Selatan (dekat tenda panitia) untuk melayani walk-in & cetak tiket ulang',
    badge: 'Meja Kasus',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  {
    id: 'loc-medis',
    tipe: 'LOKASI',
    title: 'Posko Medis & P3K',
    subtitle: 'Samping Barat pintu masuk Aula Muktamar didukung tenaga medis RS Lirboyo',
    badge: 'Kesehatan',
    badgeColor: 'bg-red-100 text-red-900 border-red-300',
  },
  {
    id: 'loc-parkir-barat',
    tipe: 'LOKASI',
    title: 'Area Parkir Barat (Bus Rombongan)',
    subtitle: 'Kapasitas 45 bus pariwisata wali santri & rombongan luar kota',
    badge: 'Parkir Bus',
    badgeColor: 'bg-stone-100 text-stone-800 border-stone-300',
  },
  {
    id: 'loc-parkir-timur',
    tipe: 'LOKASI',
    title: 'Area Parkir Timur (Mobil Pribadi & VIP)',
    subtitle: 'Kapasitas 250 mobil pribadi dan tamu VIP dekat akses Aula Muktamar',
    badge: 'Parkir Mobil',
    badgeColor: 'bg-stone-100 text-stone-800 border-stone-300',
  },
  {
    id: 'loc-dapur',
    tipe: 'LOKASI',
    title: 'Dapur Umum & Distribusi Konsumsi',
    subtitle: 'Posko logistik pembagian konsumsi formula panitia (0.87 × 1.05) di basement aula',
    badge: 'Konsumsi',
    badgeColor: 'bg-orange-100 text-orange-900 border-orange-300',
  },
];

interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  initialTab?: 'SEMUA' | 'FITUR' | 'PESERTA' | 'LOKASI' | 'AI';
}

export default function UniversalSearchModal({
  isOpen,
  onClose,
  initialQuery = '',
  initialTab = 'SEMUA',
}: UniversalSearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'SEMUA' | 'FITUR' | 'PESERTA' | 'LOKASI' | 'AI'>(initialTab);

  // AI Chat State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKeySetting, setShowApiKeySetting] = useState(false);
  const [messages, setMessages] = useState<
    { role: 'user' | 'assistant'; content: string; model?: string; source?: string }[]
  >([
    {
      role: 'assistant',
      content:
        'Ahlan wa sahlan! Saya **Asisten Cerdas AI Haflah** ditenagai **Google Gemini Free**. Ada yang bisa saya bantu seputar absensi gerbang, kuota santri, lokasi, atau panduan acara?',
      model: 'Gemini 1.5 Flash (Free)',
    },
  ]);

  // Load custom API Key from localStorage
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem('gemini_api_key_custom');
      if (savedKey) setApiKeyInput(savedKey);
    } catch {}
  }, []);

  const saveApiKey = (key: string) => {
    setApiKeyInput(key);
    try {
      if (key) localStorage.setItem('gemini_api_key_custom', key);
      else localStorage.removeItem('gemini_api_key_custom');
    } catch {}
    setShowApiKeySetting(false);
  };

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeTab === 'AI' && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  // Data Peserta Live Search
  const pesertaItems = useMemo(() => {
    const keluarga = store.getKeluargaList();
    const undangan = store.getUndanganList();

    const items: SearchItem[] = [];

    for (const k of keluarga) {
      const santri = k.santri?.[0];
      const sudahHadir = k.kuota.terpakai > 0;
      let badgeKat = 'Bil Ghoib';
      let badgeCol = 'bg-emerald-100 text-emerald-800 border-emerald-300';

      if (santri?.kategoriUtama === 'BIN_NADZOR') {
        badgeKat = 'Bin Nadzori';
        badgeCol = 'bg-blue-100 text-blue-800 border-blue-300';
      } else if (santri?.kategoriUtama === 'TAMATAN') {
        badgeKat = 'Tamatan';
        badgeCol = 'bg-amber-100 text-amber-900 border-amber-300';
      }

      items.push({
        id: `s-${k.kode}`,
        tipe: 'PESERTA',
        title: santri?.nama || 'Santri',
        subtitle: `${k.kode} · ${santri?.kelas || badgeKat} · Wali: ${k.namaWali} (${k.alamat})`,
        badge: sudahHadir ? `Hadir (${k.kuota.terpakai} Kursi)` : 'Belum Hadir',
        badgeColor: sudahHadir
          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
          : 'bg-amber-100 text-amber-900 border-amber-300',
        href: `/admin/peserta?q=${k.kode}`,
      });
    }

    for (const u of undangan) {
      const sudahHadir = u.kuota.terpakai > 0;
      items.push({
        id: `u-${u.kode}`,
        tipe: 'PESERTA',
        title: u.nama,
        subtitle: `${u.kode} · ${u.kategori || 'VIP'} · ${u.instansi || (u as any).alamat || '-'}`,
        badge: sudahHadir ? `VIP Hadir (${u.kuota.terpakai} Kursi)` : 'VIP Belum Hadir',
        badgeColor: sudahHadir
          ? 'bg-purple-100 text-purple-900 border-purple-300'
          : 'bg-stone-100 text-stone-800 border-stone-300',
        href: `/admin/peserta?q=${u.kode}`,
      });
    }

    return items;
  }, []);

  // Filter Search
  const searchResults = useMemo(() => {
    const q = query.toLowerCase().trim();

    let all: SearchItem[] = [];
    if (activeTab === 'SEMUA' || activeTab === 'FITUR') all.push(...DAFTAR_FITUR);
    if (activeTab === 'SEMUA' || activeTab === 'LOKASI') all.push(...DAFTAR_LOKASI);
    if (activeTab === 'SEMUA' || activeTab === 'PESERTA') all.push(...pesertaItems);

    if (!q) {
      return all.slice(0, 15);
    }

    return all
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.badge?.toLowerCase().includes(q)
      )
      .slice(0, 25);
  }, [query, activeTab, pesertaItems]);

  // Handler Submit Tanya AI
  const handleSendAi = async (promptText?: string) => {
    const textToSend = promptText || aiPrompt;
    if (!textToSend.trim() || aiLoading) return;

    const userMessage = { role: 'user' as const, content: textToSend.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setAiPrompt('');
    setAiLoading(true);

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend.trim(),
          history: messages,
          apiKey: apiKeyInput.trim() || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Gagal menghubungi layanan AI');
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply || 'Maaf, terjadi kendala saat memproses jawaban.',
          model: data.model || 'Gemini 1.5 Flash (Free)',
          source: data.source,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Mohon maaf, koneksi AI sedang bermasalah (${err.message || 'Error'}). Silakan coba tanyakan kembali.`,
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl bg-[#FAF7F3] rounded-3xl shadow-2xl border-2 border-[#8C6A47]/40 flex flex-col overflow-hidden max-h-[90vh] text-[#422F21]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar Search */}
        <div className="p-4 sm:p-5 border-b-2 border-[#D5C4B4] bg-white flex items-center space-x-3">
          <Search className="w-5 h-5 text-[#8C6A47] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'Enter' && activeTab === 'AI') handleSendAi();
            }}
            placeholder={
              activeTab === 'AI'
                ? 'Tanyakan apa saja ke Google Gemini Free seputar Haflah...'
                : 'Cari fitur, nama santri/wali, tamu VIP, kode SH0001, atau tempat lokasi...'
            }
            className="flex-1 bg-transparent text-sm sm:text-base font-semibold text-[#422F21] placeholder-[#7A624E]/70 focus:outline-none"
          />

          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-[#7A624E] hover:text-[#422F21] hover:bg-[#EFE8E1]"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="hidden sm:flex items-center space-x-1 pl-2 border-l border-[#D5C4B4]">
            <kbd className="px-2 py-0.5 rounded-md bg-[#EFE8E1] border border-[#D5C4B4] text-[10px] font-mono text-[#8C6A47]">
              ESC
            </kbd>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#EFE8E1] text-[#7A624E] hover:text-[#422F21] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Pills Filter */}
        <div className="flex items-center space-x-2 px-4 py-2.5 bg-[#EFE8E1]/80 border-b border-[#D5C4B4] overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('SEMUA')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'SEMUA'
                ? 'bg-[#8C6A47] text-white shadow-xs'
                : 'bg-white text-[#7A624E] hover:text-[#422F21] border border-[#D5C4B4]'
            }`}
          >
            Semua
          </button>

          <button
            onClick={() => setActiveTab('FITUR')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'FITUR'
                ? 'bg-[#8C6A47] text-white shadow-xs'
                : 'bg-white text-[#7A624E] hover:text-[#422F21] border border-[#D5C4B4]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>🚀 Fitur & Menu ({DAFTAR_FITUR.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('PESERTA')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'PESERTA'
                ? 'bg-[#8C6A47] text-white shadow-xs'
                : 'bg-white text-[#7A624E] hover:text-[#422F21] border border-[#D5C4B4]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>👤 Santri & Tamu ({pesertaItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('LOKASI')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'LOKASI'
                ? 'bg-[#8C6A47] text-white shadow-xs'
                : 'bg-white text-[#7A624E] hover:text-[#422F21] border border-[#D5C4B4]'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>📍 Lokasi Acara ({DAFTAR_LOKASI.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('AI')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'AI'
                ? 'bg-gradient-to-r from-[#8C6A47] to-[#D49B5B] text-white shadow-sm font-black'
                : 'bg-white text-[#8C6A47] hover:bg-[#FAF7F3] border-2 border-[#D49B5B]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D49B5B]" />
            <span>✨ Tanya Gemini AI</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* TAB 1-4: HASIL PENCARIAN BIASA */}
          {activeTab !== 'AI' ? (
            <div className="space-y-2">
              {searchResults.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#EFE8E1] text-[#8C6A47] flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-[#422F21]">
                    Tidak ditemukan hasil untuk "{query}"
                  </div>
                  <p className="text-xs text-[#7A624E] max-w-sm mx-auto">
                    Coba kata kunci lain atau gunakan tab{' '}
                    <strong
                      className="text-[#8C6A47] cursor-pointer underline"
                      onClick={() => {
                        setActiveTab('AI');
                        handleSendAi(query);
                      }}
                    >
                      Tanya Gemini AI
                    </strong>{' '}
                    untuk menanyakan pertanyaan tersebut.
                  </p>
                </div>
              ) : (
                searchResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.href) {
                        router.push(item.href);
                        onClose();
                      } else if (item.action) {
                        item.action();
                      }
                    }}
                    className="p-3.5 rounded-2xl bg-white hover:bg-[#EFE8E1]/80 border-2 border-[#D5C4B4] hover:border-[#8C6A47] cursor-pointer transition-all flex items-center justify-between group shadow-2xs"
                  >
                    <div className="flex items-center space-x-3 min-w-0 pr-3">
                      <div className="w-9 h-9 rounded-xl bg-[#FAF7F3] border border-[#D5C4B4] flex items-center justify-center shrink-0 text-[#8C6A47] group-hover:bg-[#8C6A47] group-hover:text-white transition-colors">
                        {item.tipe === 'FITUR' ? (
                          <Compass className="w-4 h-4" />
                        ) : item.tipe === 'LOKASI' ? (
                          <MapPin className="w-4 h-4" />
                        ) : (
                          <Users className="w-4 h-4" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-serif font-black text-xs sm:text-sm text-[#422F21] truncate">
                            {item.title}
                          </span>
                          {item.badge && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                                item.badgeColor || 'bg-stone-100 text-stone-800'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#7A624E] truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-[#8C6A47] opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                ))
              )}
            </div>
          ) : (
            /* TAB 5: FITUR TANYA GEMINI AI */
            <div className="flex flex-col h-full space-y-4">
              {/* Info Model Gemini Free & Pengaturan Key */}
              <div className="p-3 rounded-2xl bg-white border border-[#D5C4B4] flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-bold text-[#422F21]">Model: Google Gemini Free (1.5 Flash)</span>
                  <span className="text-[10px] text-[#7A624E] hidden sm:inline">
                    · Pengetahuan Resmi Haflah 1448 H
                  </span>
                </div>

                <button
                  onClick={() => setShowApiKeySetting(!showApiKeySetting)}
                  className="text-[11px] text-[#8C6A47] hover:underline font-semibold flex items-center space-x-1"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>{apiKeyInput ? 'Ganti API Key' : 'Atur API Key Sendiri'}</span>
                </button>
              </div>

              {/* Box Pengaturan API Key Tambahan (Opsional) */}
              {showApiKeySetting && (
                <div className="p-4 rounded-2xl bg-[#EFE8E1] border-2 border-[#D5C4B4] space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-[#422F21]">
                    <span>Kunci API Google Gemini (Free Tier dari Google AI Studio)</span>
                    <button
                      onClick={() => setShowApiKeySetting(false)}
                      className="text-xs text-[#7A624E]"
                    >
                      Tutup
                    </button>
                  </div>
                  <p className="text-[11px] text-[#7A624E]">
                    Aplikasi sudah memiliki mesin pintar offline bawaan. Jika Anda memiliki Kunci API Gemini pribadi gratis, masukkan di sini:
                  </p>
                  <div className="flex space-x-2">
                    <input
                      type="password"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="AIzaSy..."
                      className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#D5C4B4] text-xs font-mono text-[#422F21] focus:outline-none"
                    />
                    <button
                      onClick={() => saveApiKey(apiKeyInput)}
                      className="px-4 py-2 rounded-xl bg-[#8C6A47] text-white text-xs font-bold hover:bg-[#735334]"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              )}

              {/* Chat Thread */}
              <div
                ref={chatScrollRef}
                className="flex-1 overflow-y-auto space-y-3 min-h-[220px] max-h-[380px] p-2"
              >
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start space-x-2.5 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-xl bg-[#8C6A47] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-1 ${
                        msg.role === 'user'
                          ? 'bg-[#8C6A47] text-white font-medium shadow-xs'
                          : 'bg-white border-2 border-[#D5C4B4] text-[#422F21] shadow-2xs'
                      }`}
                    >
                      <div className="whitespace-pre-line prose-xs">{msg.content}</div>

                      {msg.model && (
                        <div className="text-[9px] text-[#8C6A47] pt-1 border-t border-[#D5C4B4]/40 font-mono">
                          {msg.model}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {aiLoading && (
                  <div className="flex items-start space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#8C6A47] text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="p-3 rounded-2xl bg-white border border-[#D5C4B4] text-xs text-[#7A624E] flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-[#8C6A47] animate-ping"></span>
                      <span>Gemini sedang menyusun jawaban...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Rekomendasi Pertanyaan Cepat */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-[#8C6A47] uppercase tracking-wider">
                  Contoh Pertanyaan Cepat:
                </span>
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-[11px]">
                  {[
                    'Berapa kuota santri Bil Ghoib & tiket panggung?',
                    'Dimana posisi Meja Rekonsiliasi gerbang?',
                    'Bagaimana alur verifikasi kuota tambahan 6 jam?',
                    'Berapa jumlah tamu undangan kehormatan?',
                    'Kapan batas hangus kuota santri?',
                  ].map((sug, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => handleSendAi(sug)}
                      className="px-3 py-1.5 rounded-full bg-white hover:bg-[#FAF7F3] border border-[#D5C4B4] text-[#5C3E28] whitespace-nowrap font-medium transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input Bar */}
              <div className="flex items-center space-x-2 pt-2 border-t border-[#D5C4B4]">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendAi();
                  }}
                  placeholder="Ketik pertanyaan untuk Gemini AI..."
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-white border-2 border-[#D5C4B4] text-xs font-semibold text-[#422F21] placeholder-[#7A624E]/70 focus:outline-none focus:border-[#8C6A47]"
                />
                <button
                  onClick={() => handleSendAi()}
                  disabled={!aiPrompt.trim() || aiLoading}
                  className="px-4 py-2.5 rounded-2xl bg-[#8C6A47] hover:bg-[#735334] disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kirim</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2.5 bg-[#EFE8E1] border-t border-[#D5C4B4] flex items-center justify-between text-[11px] text-[#7A624E]">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-[#8C6A47]">Haflah Search Spotlight</span>
            <span>·</span>
            <span>Navigasi langsung & Asisten AI</span>
          </div>

          <div className="hidden sm:flex items-center space-x-2">
            <span>Tekan</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#D5C4B4] font-mono text-[9px]">
              Ctrl + K
            </kbd>
            <span>kapan saja untuk membuka</span>
          </div>
        </div>
      </div>
    </div>
  );
}
