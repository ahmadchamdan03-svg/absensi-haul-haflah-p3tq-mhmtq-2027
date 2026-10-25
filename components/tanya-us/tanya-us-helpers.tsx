'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

export type UstadzahExpression =
  | 'wave'
  | 'happy'
  | 'wink'
  | 'welcome'
  | 'thinking'
  | 'polite';

export const EXPRESSION_AVATARS: Record<
  UstadzahExpression,
  { src: string; label: string; mood: string; badgeColor: string }
> = {
  wave: {
    src: '/images/avatar/ustadzah-avatar-wave.png',
    label: 'Menyapa Ramah',
    mood: '👋 Sapaan Hangat',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  happy: {
    src: '/images/avatar/ustadzah-avatar-happy.png',
    label: 'Gembira & Bersyukur',
    mood: '✨ Penuh Berkah',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  wink: {
    src: '/images/avatar/ustadzah-avatar-wink.png',
    label: 'Tips Cerdas',
    mood: '💡 Tips Cerdas',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
  },
  welcome: {
    src: '/images/avatar/ustadzah-avatar-welcome.png',
    label: 'Menyambut Hangat',
    mood: '🏛️ Panduan Lokasi',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  thinking: {
    src: '/images/avatar/ustadzah-avatar-thinking.png',
    label: 'Analisis Cermat',
    mood: '🧠 Solutif & Cermat',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  polite: {
    src: '/images/avatar/ustadzah-avatar-polite.png',
    label: 'Santun & Khidmat',
    mood: '🌸 Khidmat & Santun',
    badgeColor: 'bg-[#EFE8E1] text-[#735334] border-[#D5C4B4]',
  },
};

export function getExpressionFromContent(
  content: string,
  isFirstTurn: boolean = false
): UstadzahExpression {
  const c = content.toLowerCase();

  // 1. Awal sesi / Sapaan
  if (
    isFirstTurn ||
    c.startsWith("wa'alaikum") ||
    c.startsWith('waalaikumsalam') ||
    c.startsWith("assalamu'alaikum") ||
    c.includes('perkenalkan, saya ustadzah ai')
  ) {
    return 'wave';
  }

  // 2. Berpikir / Analitis / Masalah teknis / Rekonsiliasi / Kuota & Biaya / Rumus
  if (
    c.includes('rekonsiliasi') ||
    c.includes('rekon') ||
    c.includes('formula') ||
    c.includes('rumus') ||
    c.includes('hp mati') ||
    c.includes('baterai') ||
    c.includes('salah scan') ||
    c.includes('kendala') ||
    c.includes('verifikasi') ||
    c.includes('sla') ||
    c.includes('mutasi') ||
    c.includes('75.000') ||
    c.includes('hitung') ||
    c.includes('langkah')
  ) {
    return 'thinking';
  }

  // 3. Senang / Syukur / Prestasi / Wisuda / Bil Ghoib 30 Juz
  if (
    c.includes('alhamdulillah') ||
    c.includes('barakallah') ||
    c.includes('khadimatul') ||
    c.includes('bil ghoib') ||
    c.includes('30 juz') ||
    c.includes('wisudawati') ||
    c.includes('selamat') ||
    c.includes('panggung kehormatan') ||
    c.includes('emas') ||
    c.includes('berkah')
  ) {
    return 'happy';
  }

  // 4. Menyambut / Gerbang / Lokasi / Denah / Tempat Duduk / Jalur
  if (
    c.includes('gerbang') ||
    c.includes('bola dunia') ||
    c.includes('sayap barat') ||
    c.includes('sayap timur') ||
    c.includes('denah') ||
    c.includes('lokasi') ||
    c.includes('aula muktamar') ||
    c.includes('parkir') ||
    c.includes('zonasi') ||
    c.includes('tata ruang')
  ) {
    return 'welcome';
  }

  // 5. Tips cerdas / Trik praktis / Rekomendasi
  if (
    c.includes('tips') ||
    c.includes('rekomendasi') ||
    c.includes('solusi') ||
    c.includes('trik') ||
    c.includes('saran') ||
    c.includes('penting:')
  ) {
    return 'wink';
  }

  // 6. Santun / Masyayikh / Jadwal / Umum
  if (
    c.includes('masyayikh') ||
    c.includes('tamu') ||
    c.includes('undangan') ||
    c.includes('jadwal') ||
    c.includes('rundown') ||
    c.includes('waktu') ||
    c.includes('kehormatan')
  ) {
    return 'polite';
  }

  return 'polite';
}

export interface PieChartSlice {
  label: string;
  value: number;
  percent: number;
  color: string;
}

export interface PieChartSummary {
  totalWaliHadir: number;
  totalWaliKuota: number;
  totalTamuHadir: number;
  totalTamuKuota: number;
  totalHadir: number;
  totalKuota: number;
}

export interface CategoryChartData {
  title: string;
  totalHadir: number;
  totalKuota: number;
  persenHadir: number;
  totalL?: number;
  totalP?: number;
  belumHadir: number;
  color: string;
}

export interface PieChartData {
  type?: 'pie' | 'dual_pie';
  title?: string;
  wali?: CategoryChartData;
  tamu?: CategoryChartData;
  data?: PieChartSlice[];
  summary?: PieChartSummary;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  source?: string;
  model?: string;
  expression?: UstadzahExpression;
  chart?: PieChartData;
}

export interface TanyaUsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuestion?: string;
  role?: 'ADMIN' | 'PENERIMA_TAMU' | 'PIMPINAN' | 'PENJAGA_GERBANG' | 'WALI';
}

export const CONTOH_PERTANYAAN_WALI = [
  'Kapan registrasi gerbang dibuka?',
  'Apa warna kartu masuk saya?',
  'Apakah boleh membawa buket atau fotografer luar?',
  'Dimana lokasi & jam sambangan?',
  'Bagaimana tata krama sowan ke Masyayikh?',
  "Doa musafir & kelancaran khotmil Qur'an",
];

export const CONTOH_PERTANYAAN_PANITIA = [
  'Jelaskan tugas 8 Pos Penerima Tamu',
  'Jelaskan alur kuota tambahan 6 jam panitia',
  'Dimana posisi Meja Rekonsiliasi & fungsinya?',
  'Berapa jumlah total tamu undangan & kategorinya?',
  'Bagaimana jika HP wali santri mati saat antri gerbang?',
  'Berapa estimasi konsumsi untuk tamu?',
];

export function renderFormattedContent(
  text: string,
  onNavigate?: (url: string) => void,
  isUser: boolean = false
) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];

  const textColor = isUser ? 'text-[#2D1B0E]' : 'text-[#543C28]';
  const strongColor = isUser ? 'text-[#1A0E06]' : 'text-[#422F21]';
  const bulletDot = isUser ? 'bg-[#8C6A47]' : 'bg-[#8C6A47]';
  const numColor = isUser ? 'text-[#7A5533]' : 'text-[#8C6A47]';

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="my-2 space-y-1.5 pl-2 list-none">
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  const hasArabic = (str: string) =>
    /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(str);

  const parseInline = (line: string): React.ReactNode => {
    const parts = line.split(
      /(\[.*?\]\(.*?\)|\*\*.*?\*\*|[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0660-\u0669\s]{3,})/g
    );
    return parts.map((part, idx) => {
      if (!part) return null;
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        if (hasArabic(boldText)) {
          return (
            <strong
              key={idx}
              dir="rtl"
              className="font-bold text-[#1A0E06] font-['KFGQPC_Utsman_Taha_Naskh','KFGQPC_Uthmanic_Script_HAFS','Amiri',serif] text-lg sm:text-xl leading-relaxed mx-1"
            >
              {boldText}
            </strong>
          );
        }
        return (
          <strong key={idx} className={`font-bold ${strongColor}`}>
            {boldText}
          </strong>
        );
      }
      const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        const label = linkMatch[1];
        const url = linkMatch[2];
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onNavigate?.(url)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 my-1 mx-0.5 rounded-xl bg-gradient-to-r from-[#8C6A47] via-[#9B7752] to-[#8C6A47] hover:brightness-110 text-white font-bold text-xs shadow-xs transition-all active:scale-95 border border-[#735334] cursor-pointer"
            title={`Buka ${label}`}
          >
            <span>{label}</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-200" />
          </button>
        );
      }
      if (hasArabic(part) && part.trim().length > 0) {
        return (
          <span
            key={idx}
            dir="rtl"
            className="font-['KFGQPC_Utsman_Taha_Naskh','KFGQPC_Uthmanic_Script_HAFS','Amiri',serif] text-lg sm:text-xl leading-relaxed text-[#2D1B0E] mx-1 inline-block"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      elements.push(<div key={`space-${index}`} className="h-1.5" />);
      return;
    }

    // Kutipan / Ayat Al-Qur'an / Hadits (> ...)
    if (trimmed.startsWith('> ')) {
      flushList();
      const quoteContent = trimmed.replace(/^>\s+/, '');
      const isArabicQuote = hasArabic(quoteContent);
      elements.push(
        <div
          key={`quote-${index}`}
          dir={isArabicQuote ? 'rtl' : 'ltr'}
          className={`my-3 p-3.5 sm:p-4 rounded-2xl border-2 ${
            isArabicQuote
              ? 'border-r-4 border-l-2 border-[#8C6A47] bg-[#FBF8F4] text-right font-["KFGQPC_Utsman_Taha_Naskh","KFGQPC_Uthmanic_Script_HAFS","Amiri",serif] text-xl sm:text-2xl leading-[2.4] text-[#2D1B0E] shadow-xs'
              : 'border-l-4 border-r-2 border-[#8C6A47] bg-[#F5EFE8] text-left text-xs leading-relaxed text-[#543C28]'
          }`}
        >
          {parseInline(quoteContent)}
        </div>
      );
      return;
    }

    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={`h4-${index}`} className={`font-serif font-black text-sm ${strongColor} mt-3 mb-1`}>
          {parseInline(trimmed.replace(/^###\s+/, ''))}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={`h3-${index}`} className={`font-serif font-black text-base ${strongColor} mt-3.5 mb-1.5`}>
          {parseInline(trimmed.replace(/^##\s+/, ''))}
        </h3>
      );
      return;
    }

    if (trimmed === '---' || trimmed === '***') {
      flushList();
      elements.push(<hr key={`hr-${index}`} className="my-2 border-[#E5DCD2]" />);
      return;
    }

    if (/^[\*\-]\s+/.test(trimmed)) {
      const bulletContent = trimmed.replace(/^[\*\-]\s+/, '');
      currentList.push(
        <li key={`li-${index}`} className={`flex items-start space-x-2 text-xs ${textColor}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${bulletDot} mt-1.5 shrink-0`} />
          <span className="flex-1 leading-relaxed font-medium">{parseInline(bulletContent)}</span>
        </li>
      );
      return;
    }

    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      flushList();
      elements.push(
        <div key={`num-${index}`} className={`flex items-start space-x-2 my-1 text-xs ${textColor}`}>
          <span className={`font-black ${numColor} shrink-0 min-w-[18px]`}>
            {numMatch[1]}.
          </span>
          <span className="flex-1 leading-relaxed font-medium">{parseInline(numMatch[2])}</span>
        </div>
      );
      return;
    }

    // Paragraf dominan bahasa Arab
    if (hasArabic(trimmed)) {
      const arabicChars = (
        trimmed.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []
      ).length;
      const totalChars = trimmed.replace(/\s+/g, '').length;
      if (totalChars > 0 && arabicChars / totalChars > 0.4) {
        flushList();
        elements.push(
          <p
            key={`ar-p-${index}`}
            dir="rtl"
            className="my-2.5 text-right font-['KFGQPC_Utsman_Taha_Naskh','KFGQPC_Uthmanic_Script_HAFS','Amiri',serif] text-xl sm:text-2xl leading-[2.4] text-[#2D1B0E]"
          >
            {parseInline(trimmed)}
          </p>
        );
        return;
      }
    }

    flushList();
    elements.push(
      <p key={`p-${index}`} className={`text-xs ${textColor} leading-relaxed my-0.5 font-medium`}>
        {parseInline(trimmed)}
      </p>
    );
  });

  flushList();
  return elements;
}
