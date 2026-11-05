'use client';

import React from 'react';
import { ArrowRight, ExternalLink, FileSpreadsheet, FileText, Download } from 'lucide-react';
import { exportTextToPdf, exportTableToExcel, exportTextToDocx, fetchFreshMotivasi, cleanDocumentText } from '@/lib/halwaa/file-exporter';

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
    badgeColor: 'bg-sky-100 text-blue-900 border-sky-300',
  },
  happy: {
    src: '/images/avatar/ustadzah-avatar-happy.png',
    label: 'Gembira & Bersyukur',
    mood: '✨ Penuh Berkah',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
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
    badgeColor: 'bg-[#E0F2FE] text-[#1E40AF] border-[#BAE6FD]',
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
  let currentTableLines: string[] = [];

  const textColor = isUser ? 'text-[#0A192F]' : 'text-[#543C28]';
  const strongColor = isUser ? 'text-[#1A0E06]' : 'text-[#0F2C59]';
  const bulletDot = isUser ? 'bg-[#1D4ED8]' : 'bg-[#1D4ED8]';
  const numColor = isUser ? 'text-[#7A5533]' : 'text-[#1D4ED8]';

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

  const flushTable = () => {
    if (currentTableLines.length === 0) return;

    // Parse markdown table rows
    const rawRows = currentTableLines.map((line) =>
      line
        .split('|')
        .map((c) => c.trim())
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
    );

    const isSeparator = (cells: string[]) => cells.every((c) => /^[-:\s]+$/.test(c));
    const headerRow = rawRows[0] || [];
    const dataRows = rawRows.slice(1).filter((r) => !isSeparator(r));

    const tableKey = `table-${elements.length}`;
    elements.push(
      <div
        key={tableKey}
        className="my-3 overflow-hidden rounded-2xl border border-[#BAE6FD] bg-[#F0F9FF] shadow-xs"
      >
        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#E0F2FE] border-b border-[#BAE6FD] text-[#543C28] font-bold">
                {headerRow.map((h, i) => (
                  <th key={i} className="p-2.5 border-r border-[#BAE6FD] last:border-r-0 whitespace-nowrap">
                    {parseInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className="border-b border-[#E0F2FE] last:border-b-0 hover:bg-[#F5EFE8] transition-colors"
                >
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className="p-2.5 border-r border-[#E0F2FE] last:border-r-0 text-[#0A192F]"
                    >
                      {parseInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-2.5 bg-[#F7F2EC] border-t border-[#BAE6FD] flex items-center justify-between flex-wrap gap-2 text-[11px]">
          <span className="text-[#1E40AF] font-bold flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-blue-700" />
            <span>Tabel Data Haflah ({dataRows.length} baris)</span>
          </span>
          <button
            type="button"
            onClick={() => exportTableToExcel(headerRow, dataRows, 'Tabel_Data_Haflah')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Unduh data tabel dalam format spreadsheet Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Excel (.xlsx)</span>
          </button>
        </div>
      </div>
    );

    currentTableLines = [];
  };

  const hasArabic = (str: string) =>
    /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(str);

  const parseInline = (line: string): React.ReactNode => {
    // Regex splits images (![...](...)), links ([...](...)), bold (**...**), and Arabic blocks
    const parts = line.split(
      /(!\[.*?\\\]\(.*?\)|\b\[.*?\]\(.*?\)|\*\*.*?\*\*|[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0660-\u0669\s]{3,})/g
    );
    return parts.map((part, idx) => {
      if (!part) return null;

      // Gambar Markdown inline: ![alt](url)
      if (part.startsWith('![') && part.endsWith(')')) {
        const imgMatch = part.match(/^!\[(.*?)\]\((.*?)\)$/);
        if (imgMatch) {
          const alt = imgMatch[1];
          const url = imgMatch[2];
          return (
            <span
              key={idx}
              className="block my-2 rounded-xl overflow-hidden border border-[#BAE6FD] bg-[#F0F9FF] shadow-xs"
            >
              <img
                src={url}
                alt={alt || 'Ilustrasi Haflah'}
                className="w-full max-h-64 object-cover"
                loading="lazy"
              />
              {alt && (
                <span className="block p-1.5 text-[10px] text-[#1E40AF] bg-[#F7F2EC] text-center font-medium">
                  {alt}
                </span>
              )}
            </span>
          );
        }
      }

      // Bold text: **bold**
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

      // Link Markdown [label](url)
      const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        const label = linkMatch[1];
        const url = linkMatch[2];
        const isExternal = /^https?:\/\//i.test(url);

        if (isExternal) {
          return (
            <a
              key={idx}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 my-0.5 mx-0.5 rounded-lg bg-[#F5EFE8] hover:bg-[#E0F2FE] text-[#1E40AF] hover:text-[#543C28] font-bold text-xs border border-[#BAE6FD] transition-all underline underline-offset-2 decoration-[#1D4ED8]/40 hover:decoration-[#1D4ED8] cursor-pointer"
              title={`Kunjungi tautan eksternal: ${label}`}
            >
              <span>{label}</span>
              <ExternalLink className="w-3 h-3 text-[#1D4ED8] shrink-0" />
            </a>
          );
        }

        return (
          <button
            key={idx}
            type="button"
            onClick={() => onNavigate?.(url)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 my-1 mx-0.5 rounded-xl bg-gradient-to-r from-[#1D4ED8] via-[#9B7752] to-[#1D4ED8] hover:brightness-110 text-white font-bold text-xs shadow-xs transition-all active:scale-95 border border-[#1E40AF] cursor-pointer"
            title={`Buka ${label}`}
          >
            <span>{label}</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-200" />
          </button>
        );
      }

      // Bahasa Arab
      if (hasArabic(part) && part.trim().length > 0) {
        return (
          <span
            key={idx}
            dir="rtl"
            className="font-['KFGQPC_Utsman_Taha_Naskh','KFGQPC_Uthmanic_Script_HAFS','Amiri',serif] text-lg sm:text-xl leading-relaxed text-[#0A192F] mx-1 inline-block"
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

    // Cek apakah baris ini bagian dari Markdown Table
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2) {
      flushList();
      currentTableLines.push(trimmed);
      return;
    } else {
      flushTable();
    }

    if (!trimmed) {
      flushList();
      elements.push(<div key={`space-${index}`} className="h-1.5" />);
      return;
    }

    // Single Markdown Image pada baris tersendiri: ![alt](url)
    const singleImgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (singleImgMatch) {
      flushList();
      const alt = singleImgMatch[1];
      const url = singleImgMatch[2];
      elements.push(
        <div
          key={`img-card-${index}`}
          className="my-3 rounded-2xl overflow-hidden border border-[#BAE6FD] bg-[#F0F9FF] shadow-xs"
        >
          <div className="relative w-full aspect-video max-h-[300px] bg-stone-100 flex items-center justify-center overflow-hidden">
            <img
              src={url}
              alt={alt || 'Ilustrasi Haflah'}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
          </div>
          {alt && (
            <div className="px-3 py-2 text-[11px] text-[#1E40AF] font-medium flex items-center justify-between border-t border-[#E0F2FE] bg-[#F7F2EC]">
              <span className="truncate pr-2 font-medium">{alt}</span>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-[#1D4ED8] hover:underline font-bold shrink-0"
              >
                <span>Lihat Ukuran Penuh</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      );
      return;
    }

    // Unduhan PDF Card: [DOWNLOAD_PDF: Judul Dokumen]
    const pdfMatch = trimmed.match(/^\[DOWNLOAD_PDF:\s*(.*?)\]$/i);
    if (pdfMatch) {
      flushList();
      const title = pdfMatch[1] || 'Dokumen Haflah P3TQ & MHMTQ';
      elements.push(
        <div
          key={`dl-pdf-${index}`}
          className="my-3 p-3.5 rounded-2xl border border-red-200 bg-red-50/70 flex items-center justify-between gap-3 shadow-xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center text-red-700 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-red-950 truncate">{title}</div>
              <div className="text-[10px] text-red-700">Format Dokumen PDF Siap Cetak (.pdf)</div>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              const clean = cleanDocumentText(text);
              const cleanTitle = title.replace(/\b(dokumen|pdf|word|excel|laporan|file)\b/gi, '').trim() || 'Haflah P3TQ';
              const motivasi = await fetchFreshMotivasi(cleanTitle);
              exportTextToPdf(title, clean, undefined, motivasi);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
            title="Unduh dokumen PDF ke perangkat"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh PDF</span>
          </button>
        </div>
      );
      return;
    }

    // Unduhan DOCX Card: [DOWNLOAD_DOCX: Judul Dokumen]
    const docxMatch = trimmed.match(/^\[DOWNLOAD_DOCX:\s*(.*?)\]$/i);
    if (docxMatch) {
      flushList();
      const title = docxMatch[1] || 'Dokumen Haflah P3TQ & MHMTQ';
      elements.push(
        <div
          key={`dl-docx-${index}`}
          className="my-3 p-3.5 rounded-2xl border border-blue-200 bg-blue-50/70 flex items-center justify-between gap-3 shadow-xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-blue-950 truncate">{title}</div>
              <div className="text-[10px] text-blue-700">Format Microsoft Word (.docx)</div>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              const clean = cleanDocumentText(text);
              const cleanTitle = title.replace(/\b(dokumen|pdf|word|excel|laporan|file)\b/gi, '').trim() || 'Haflah P3TQ';
              const motivasi = await fetchFreshMotivasi(cleanTitle);
              exportTextToDocx(title, clean, undefined, motivasi);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
            title="Unduh dokumen Word ke perangkat"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Word (.docx)</span>
          </button>
        </div>
      );
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
              ? 'border-r-4 border-l-2 border-[#1D4ED8] bg-[#FBF8F4] text-right font-["KFGQPC_Utsman_Taha_Naskh","KFGQPC_Uthmanic_Script_HAFS","Amiri",serif] text-xl sm:text-2xl leading-[2.4] text-[#0A192F] shadow-xs'
              : 'border-l-4 border-r-2 border-[#1D4ED8] bg-[#F5EFE8] text-left text-xs leading-relaxed text-[#543C28]'
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
      elements.push(<hr key={`hr-${index}`} className="my-2 border-[#BAE6FD]" />);
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
            className="my-2.5 text-right font-['KFGQPC_Utsman_Taha_Naskh','KFGQPC_Uthmanic_Script_HAFS','Amiri',serif] text-xl sm:text-2xl leading-[2.4] text-[#0A192F]"
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
  flushTable();
  return elements;
}
