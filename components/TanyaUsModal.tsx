'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Send,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  Bot,
  User,
  Settings,
  HelpCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

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

function getExpressionFromContent(
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
    c.includes('80.000') ||
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

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  source?: string;
  model?: string;
  expression?: UstadzahExpression;
}

interface TanyaUsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuestion?: string;
}

const CONTOH_PERTANYAAN = [
  'Berapa kuota & jatah tiket santri Bil Ghoib?',
  'Jelaskan alur kuota tambahan 6 jam panitia',
  'Dimana posisi Meja Rekonsiliasi & fungsinya?',
  'Berapa jumlah total tamu undangan & kategorinya?',
  'Bagaimana jika HP wali santri mati saat antri gerbang?',
  'Berapa estimasi konsumsi untuk 620 orang?',
];

function renderFormattedContent(
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

export default function TanyaUsModal({
  isOpen,
  onClose,
  initialQuestion,
}: TanyaUsModalProps) {
  const router = useRouter();

  const handleNavigate = (url: string) => {
    if (url.startsWith('/')) {
      onClose();
      router.push(url);
    } else {
      window.open(url, '_blank');
    }
  };
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-user-salam',
      role: 'user',
      content: "Assalamu'alaikum Us.",
      timestamp: 'Baru saja',
    },
    {
      id: 'm-welcome',
      role: 'assistant',
      content: `Wa'alaikum Salam Wr. Wb. 🙏✨

Nggih Us, wonten ingkang saget kula bantu seputar pelaksanaan Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.? Kula siap mbantu informasi kuota, denah lokasi, tata tertib, jadwal acara, presensi, utawi rekapitulasi data. Silakan ketik pertanyaan di bawah ya! 😊`,
      timestamp: 'Baru saja',
      model: 'Gemini 3.5 Pro',
      expression: 'wave',
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savedApiKey, setSavedApiKey] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load API key dari localStorage (Zhipu / OpenAI / Gemini)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored =
        localStorage.getItem('haflah_zhipu_api_key') ||
        localStorage.getItem('haflah_openai_api_key') ||
        localStorage.getItem('haflah_gemini_api_key') ||
        '';
      setSavedApiKey(stored);
      setApiKeyInput(stored);
    }
  }, []);

  // Handle initial question bila ada
  useEffect(() => {
    if (isOpen && initialQuestion) {
      handleSendMessage(initialQuestion);
    }
  }, [isOpen, initialQuestion]);

  // Auto focus input saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  // Auto scroll ke pesan terbawah
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSaveApiKey = () => {
    const trimmed = apiKeyInput.trim();
    setSavedApiKey(trimmed);
    if (typeof window !== 'undefined') {
      if (trimmed) {
        if (trimmed.includes('.') && trimmed.length >= 30) {
          localStorage.setItem('haflah_zhipu_api_key', trimmed);
        } else if (trimmed.startsWith('sk-')) {
          localStorage.setItem('haflah_openai_api_key', trimmed);
        } else {
          localStorage.setItem('haflah_gemini_api_key', trimmed);
        }
      } else {
        localStorage.removeItem('haflah_zhipu_api_key');
        localStorage.removeItem('haflah_openai_api_key');
        localStorage.removeItem('haflah_gemini_api_key');
      }
    }
    setShowSettings(false);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'm-user-salam-' + Date.now(),
        role: 'user',
        content: "Assalamu'alaikum Us.",
        timestamp: 'Baru saja',
      },
      {
        id: 'm-welcome-' + Date.now(),
        role: 'assistant',
        content: `Wa'alaikum Salam Wr. Wb. Obrolan sampun dipun-reset 🙏✨\n\nWonten ingkang saget kula bantu malih seputar pelaksanaan Haul & Haflah P3TQ dan MHMTQ, Us? Silakan ketik pertanyaan di bawah ya! 😊`,
        timestamp: 'Baru saja',
        model: 'Gemini 3.5 Pro',
        expression: 'wave',
      },
    ]);
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    const userMsgId = 'user-' + Date.now();
    const timeStr = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMessage: Message = {
      id: userMsgId,
      role: 'user',
      content: query,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          history: historyPayload,
          apiKey: savedApiKey || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data?.reply) {
        const assignedExpr: UstadzahExpression =
          data.expression || getExpressionFromContent(data.reply, false);
        setMessages((prev) => [
          ...prev,
          {
            id: 'ai-' + Date.now(),
            role: 'assistant',
            content: data.reply,
            timestamp: new Date().toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            source: data.source,
            model: data.model || 'GPT-4o',
            expression: assignedExpr,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: 'ai-err-' + Date.now(),
            role: 'assistant',
            content: `Maaf, Us AI mengalami kendala saat memproses jawaban: ${data?.error || 'Koneksi terganggu'}. Silakan coba ajukan kembali ya.`,
            timestamp: new Date().toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            model: 'GPT-4o Engine',
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'ai-err-' + Date.now(),
          role: 'assistant',
          content: `Afwan, terjadi kendala jaringan saat menghubungi sistem AI. Silakan coba kembali sesaat lagi.`,
          timestamp: new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          model: 'Gemini 3.5 Offline',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl h-[92dvh] sm:h-[88vh] max-h-[800px] flex flex-col rounded-2xl sm:rounded-3xl bg-[#FAF7F3] border-2 border-[#D5C4B4] shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal Ustadzah AI */}
        <div className="py-2.5 px-3 sm:px-6 bg-gradient-to-r from-[#FAF7F3] via-[#EFE8E1] to-[#FAF7F3] border-b-2 border-[#D5C4B4] flex items-center justify-between shrink-0 select-none gap-2">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            {/* Avatar Ustadzah Animasi Interaktif */}
            <div className="relative w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-[#FAF7F3] border-2 border-[#8C6A47] shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src={
                  isLoading
                    ? '/images/avatar/ustadzah-avatar-thinking.png'
                    : '/images/avatar/ustadzah-avatar-wave.png'
                }
                alt="Ustadzah AI"
                className="w-full h-full object-cover transition-all duration-300"
              />
              <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-600 animate-pulse" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <h2 className="font-serif font-black text-sm sm:text-lg text-[#422F21] leading-tight truncate">
                  Tanya Us AI
                </h2>
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-gradient-to-r from-[#8C6A47] to-[#D49B5B] text-white text-[9px] sm:text-[10px] font-black tracking-wide shadow-xs shrink-0 flex items-center space-x-1">
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-200 animate-pulse" />
                  <span>Multi-AI</span>
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#7A624E] truncate font-medium">
                Asisten Resmi Haul & Haflah P3TQ dan MHMTQ
              </p>
            </div>
          </div>

          {/* Tombol Aksi Header */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-xl text-[#7A624E] hover:text-[#422F21] hover:bg-[#E5DCD2] transition-colors ${
                showSettings ? 'bg-[#E5DCD2] text-[#8C6A47]' : ''
              }`}
              title="Pengaturan API Key"
              aria-label="Pengaturan"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetChat}
              className="p-2 rounded-xl text-[#7A624E] hover:text-[#422F21] hover:bg-[#E5DCD2] transition-colors"
              title="Mulai Percakapan Baru"
              aria-label="Reset Chat"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#7A624E] hover:text-[#422F21] hover:bg-[#E5DCD2] transition-colors"
              title="Tutup (Esc)"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Panel Pengaturan API Key (Opsional / Terbuka Saat Tombol Settings Diklik) */}
        {showSettings && (
          <div className="p-4 bg-amber-50/90 border-b-2 border-amber-200 text-xs text-[#543C28] space-y-2 shrink-0 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-[#8C6A47]">
                <Settings className="w-3.5 h-3.5" />
                <span>Konfigurasi Kunci API AI (Opsional)</span>
              </span>
              <button
                onClick={() => setShowSettings(false)}
                className="text-[#8C6A47] hover:text-[#422F21]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] leading-relaxed text-[#7A624E]">
              Sistem mendukung <strong>Zhipu AI (GLM-4-Flash)</strong>, <strong>Multi-Key Gemini</strong>, atau <strong>OpenAI GPT-4o</strong>:
            </p>
            <div className="flex items-center space-x-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Masukkan API Key Zhipu AI / Gemini / OpenAI..."
                className="flex-1 px-3 py-1.5 rounded-xl border border-[#D5C4B4] bg-white text-xs font-mono focus:outline-none focus:border-[#8C6A47]"
              />
              <button
                onClick={handleSaveApiKey}
                className="px-3 py-1.5 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white font-bold text-xs transition-colors shrink-0 shadow-xs"
              >
                Simpan
              </button>
            </div>
          </div>
        )}

        {/* Area Pesan Chat */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div
                    className="w-10 h-10 rounded-full bg-[#FAF7F3] border-2 border-[#8C6A47] shadow-sm flex items-center justify-center shrink-0 overflow-hidden mt-0.5 group/avatar relative"
                    title={`Ekspresi Us AI: ${EXPRESSION_AVATARS[msg.expression || 'polite'].label}`}
                  >
                    <img
                      src={EXPRESSION_AVATARS[msg.expression || 'polite'].src}
                      alt={EXPRESSION_AVATARS[msg.expression || 'polite'].label}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/avatar:scale-110"
                    />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-3xl p-4 shadow-xs space-y-2 text-xs sm:text-[13px] leading-relaxed relative group ${
                    isUser
                      ? 'bg-gradient-to-br from-[#F6F0E8] via-[#EFE5D9] to-[#E6D8C8] border-2 border-[#CBB59F] text-[#2D1B0E] rounded-br-xs'
                      : 'bg-white border-2 border-[#D5C4B4] text-[#422F21] rounded-bl-xs'
                  }`}
                >
                  {/* Sender & Timestamp */}
                  <div
                    className={`flex items-center justify-between text-[10px] pb-1 border-b ${
                      isUser
                        ? 'border-[#CBB59F]/60 text-[#7D5A3C]'
                        : 'border-[#EFE8E1] text-[#7A624E]'
                    }`}
                  >
                    <span className="font-bold flex items-center space-x-1 flex-wrap gap-y-1">
                      {isUser ? (
                        <>
                          <User className="w-3.5 h-3.5 text-[#8C6A47]" />
                          <span className="text-[#5C3D26] font-black">Anda (Panitia / Tamu)</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-[#D49B5B]" />
                          <span>Ustadzah AI (Us AI)</span>
                          <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-md bg-[#EFE8E1] text-[#8C6A47] font-semibold">
                            {msg.model || 'GPT-4o'}
                          </span>
                          <span
                            className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${
                              EXPRESSION_AVATARS[msg.expression || 'polite'].badgeColor
                            }`}
                          >
                            {EXPRESSION_AVATARS[msg.expression || 'polite'].mood}
                          </span>
                        </>
                      )}
                    </span>
                    <span className={isUser ? 'text-[#8C6A47] font-semibold' : ''}>{msg.timestamp}</span>
                  </div>

                  {/* Konten Balasan */}
                  <div className="leading-relaxed font-sans">
                    {renderFormattedContent(msg.content, handleNavigate, isUser)}
                  </div>

                  {/* Tombol Copy untuk Assistant */}
                  {!isUser && (
                    <div className="pt-1 flex items-center justify-end">
                      <button
                        onClick={() => handleCopyText(msg.id, msg.content)}
                        className="inline-flex items-center space-x-1 text-[10px] text-[#7A624E] hover:text-[#422F21] px-2 py-0.5 rounded-md hover:bg-[#EFE8E1] transition-colors"
                        title="Salin jawaban"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-[#EFE5D9] border-2 border-[#CBB59F] flex items-center justify-center shrink-0 mt-0.5 text-[#8C6A47] shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Indikator Mengetik (Typing Indicator) */}
          {isLoading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-10 h-10 rounded-full bg-[#FAF7F3] border-2 border-[#8C6A47] shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
                <img
                  src="/images/avatar/ustadzah-avatar-thinking.png"
                  alt="Us AI Berpikir"
                  className="w-full h-full object-cover animate-pulse"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-white border-2 border-[#D5C4B4] text-xs text-[#7A624E] flex items-center space-x-2.5 shadow-xs">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-[#8C6A47] animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-[#A47E57] animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-[#D49B5B] animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="font-medium italic text-[11px]">
                  Ustadzah AI sedang menyusun jawaban terbaik...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar Tanya Us AI */}
        <div className="p-3 sm:p-4 bg-[#FAF7F3] border-t-2 border-[#D5C4B4] shrink-0 space-y-2">

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end space-x-2"
          >
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Tanyakan apapun pada Ustadzah AI seputar Haflah... (Enter untuk kirim)"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white border-2 border-[#D5C4B4] focus:border-[#8C6A47] focus:outline-none text-xs sm:text-sm text-[#422F21] placeholder:text-[#7A624E]/70 resize-none min-h-[42px] max-h-24 shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              className="p-3 rounded-2xl bg-gradient-to-r from-[#8C6A47] via-[#A47E57] to-[#D49B5B] hover:brightness-105 disabled:opacity-50 text-white font-bold transition-all shadow-md active:scale-95 shrink-0 flex items-center justify-center cursor-pointer"
              title="Kirim Pertanyaan"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[10px] text-[#7A624E] mt-1 px-1 font-medium gap-2">
            <span className="truncate">Didukung 6-Tier Multi-AI Engine P3TQ</span>
            <span className="hidden sm:inline shrink-0">Tekan Shift + Enter untuk baris baru</span>
          </div>
        </div>
      </div>
    </div>
  );
}
