'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  UstadzahExpression,
  EXPRESSION_AVATARS,
  getExpressionFromContent,
  PieChartSlice,
  PieChartSummary,
  CategoryChartData,
  PieChartData,
  Message,
  TanyaUsModalProps,
} from './tanya-us/tanya-us-helpers';
import {
  TanyaUsHeaderAndSettings,
  TanyaUsMessageList,
  TanyaUsInputBar,
} from './tanya-us/TanyaUsChatBody';

export { EXPRESSION_AVATARS };
export type {
  UstadzahExpression,
  PieChartSlice,
  PieChartSummary,
  CategoryChartData,
  PieChartData,
};

export default function TanyaUsModal({
  isOpen,
  onClose,
  initialQuestion,
  role = 'WALI',
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
      content: "Assalamu'alaikum Usth.",
      timestamp: 'Baru saja',
    },
    {
      id: 'm-welcome',
      role: 'assistant',
      content: `Wa'alaikum Salam Wr. Wb. 🙏✨

Nggih Usth., wonten ingkang saget kula bantu seputar pelaksanaan Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.? Kula siap mbantu informasi kuota, denah lokasi, tata tertib, jadwal acara, presensi, utawi rekapitulasi data. Silakan ketik pertanyaan di bawah ya! 😊`,
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
        content: "Assalamu'alaikum Usth.",
        timestamp: 'Baru saja',
      },
      {
        id: 'm-welcome-' + Date.now(),
        role: 'assistant',
        content: `Wa'alaikum Salam Wr. Wb. Obrolan sampun dipun-reset 🙏✨\n\nWonten ingkang saget kula bantu malih seputar pelaksanaan Haul & Haflah P3TQ dan MHMTQ, Usth.? Silakan ketik pertanyaan di bawah ya! 😊`,
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
          role: role,
        }),
      });

      const data = await res.json();

      // Debug mode (?debug=1 di URL atau query parameter)
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('debug') === '1' || urlParams.has('debug')) {
          console.groupCollapsed(`%c[Halwaa Debug] 🔍 "${query}"`, 'color: #8C6A47; font-weight: bold;');
          console.log('%cQuery Input:', 'font-weight: bold;', query);
          console.log('%cModel / Engine:', 'font-weight: bold;', data?.model || 'Unknown');
          console.log('%cSource:', 'font-weight: bold;', data?.source || 'Unknown');
          console.log('%cExpression:', 'font-weight: bold;', data?.expression || 'polite');
          console.log('%cReply Length:', 'font-weight: bold;', data?.reply?.length || 0, 'karakter');
          console.log('%cReply Content:\n', 'font-weight: bold;', data?.reply);
          if (data?.chart) console.log('%cChart Data:', 'font-weight: bold;', data.chart);
          console.groupEnd();
        }
      }

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
            chart: data.chart,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: 'ai-err-' + Date.now(),
            role: 'assistant',
            content: `Maaf, Usth. Halwaa mengalami kendala saat memproses jawaban: ${data?.error || 'Koneksi terganggu'}. Silakan coba ajukan kembali ya.`,
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
        className="w-full max-w-3xl h-[92dvh] sm:h-[88vh] max-h-[800px] flex flex-col rounded-2xl sm:rounded-3xl bg-[#FAF7F3] border-2 border-[#D5C4B4] shadow-2xl overflow-hidden relative motion-reduce:transform-none"
        onClick={(e) => e.stopPropagation()}
      >
        <TanyaUsHeaderAndSettings
          isLoading={isLoading}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          handleResetChat={handleResetChat}
          onClose={onClose}
          apiKeyInput={apiKeyInput}
          setApiKeyInput={setApiKeyInput}
          handleSaveApiKey={handleSaveApiKey}
        />

        <TanyaUsMessageList
          messages={messages}
          isLoading={isLoading}
          copiedId={copiedId}
          handleNavigate={handleNavigate}
          handleCopyText={handleCopyText}
          messagesEndRef={messagesEndRef}
        />

        <TanyaUsInputBar
          role={role}
          handleNavigate={handleNavigate}
          handleSendMessage={handleSendMessage}
          inputRef={inputRef}
          inputQuery={inputQuery}
          setInputQuery={setInputQuery}
          handleKeyDown={handleKeyDown}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
