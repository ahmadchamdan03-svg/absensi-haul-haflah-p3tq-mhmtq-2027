'use client';

import React from 'react';
import {
  X,
  Send,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  User,
  Settings,
} from 'lucide-react';
import {
  EXPRESSION_AVATARS,
  Message,
  renderFormattedContent,
} from './tanya-us-helpers';
import { PieChartWidget } from './TanyaUsCharts';

export function TanyaUsHeaderAndSettings({
  isLoading,
  showSettings,
  setShowSettings,
  handleResetChat,
  onClose,
  apiKeyInput,
  setApiKeyInput,
  handleSaveApiKey,
}: {
  isLoading: boolean;
  showSettings: boolean;
  setShowSettings: (val: boolean) => void;
  handleResetChat: () => void;
  onClose: () => void;
  apiKeyInput: string;
  setApiKeyInput: (val: string) => void;
  handleSaveApiKey: () => void;
}) {
  return (
    <>
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
              alt="Usth. Halwaa"
              className="w-full h-full object-cover transition-all duration-300"
            />
            <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-600 animate-pulse" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <h2 className="font-serif font-black text-sm sm:text-lg text-[#422F21] leading-tight truncate">
                Tanya Usth. Halwaa
              </h2>
              <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-gradient-to-r from-[#8C6A47] to-[#D49B5B] text-white text-[9px] sm:text-[10px] font-black tracking-wide shadow-xs shrink-0 flex items-center space-x-1">
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-200 animate-pulse" />
                <span>Multi-AI</span>
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-[#7A624E] truncate font-medium">
              Asisten Resmi Haul &amp; Haflah P3TQ dan MHMTQ
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
    </>
  );
}

export function TanyaUsMessageList({
  messages,
  isLoading,
  copiedId,
  handleNavigate,
  handleCopyText,
  messagesEndRef,
}: {
  messages: Message[];
  isLoading: boolean;
  copiedId: string | null;
  handleNavigate: (url: string) => void;
  handleCopyText: (id: string, text: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}) {
  return (
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
                title={`Ekspresi Usth. Halwaa: ${EXPRESSION_AVATARS[msg.expression || 'polite'].label}`}
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
                      <span>Usth. Halwaa</span>
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
                {!isUser && msg.chart && <PieChartWidget chart={msg.chart} />}
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
              alt="Usth. Halwaa Berpikir"
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
              Usth. Halwaa sedang menyusun jawaban terbaik...
            </span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

export function TanyaUsInputBar({
  role,
  handleNavigate,
  handleSendMessage,
  inputRef,
  inputQuery,
  setInputQuery,
  handleKeyDown,
  isLoading,
}: {
  role: string;
  handleNavigate: (url: string) => void;
  handleSendMessage: (text?: string) => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  inputQuery: string;
  setInputQuery: (val: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
}) {
  return (
    <div className="p-3 sm:p-4 bg-[#FAF7F3] border-t-2 border-[#D5C4B4] shrink-0 space-y-2">
      {/* Quick Action Chips per Role */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {role === 'ADMIN' && (
          <>
            <button
              type="button"
              onClick={() => handleNavigate('/scan')}
              className="px-2.5 py-1 rounded-xl bg-white border border-[#D5C4B4] text-[#8C6A47] font-bold hover:bg-[#EFE8E1] transition-colors whitespace-nowrap shadow-2xs"
            >
              👉 Buka Scanner
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('/admin/dasbor')}
              className="px-2.5 py-1 rounded-xl bg-white border border-[#D5C4B4] text-[#8C6A47] font-bold hover:bg-[#EFE8E1] transition-colors whitespace-nowrap shadow-2xs"
            >
              📊 Cek Rekap Kehadiran
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('/admin/whatsapp')}
              className="px-2.5 py-1 rounded-xl bg-white border border-[#D5C4B4] text-[#8C6A47] font-bold hover:bg-[#EFE8E1] transition-colors whitespace-nowrap shadow-2xs"
            >
              💬 Kirim WA Gateway
            </button>
          </>
        )}
        {role === 'PENJAGA_GERBANG' && (
          <>
            <button
              type="button"
              onClick={() => handleNavigate('/scan')}
              className="px-2.5 py-1 rounded-xl bg-white border border-[#D5C4B4] text-[#8C6A47] font-bold hover:bg-[#EFE8E1] transition-colors whitespace-nowrap shadow-2xs"
            >
              👉 Buka Scanner Gerbang
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('Bagaimana status kedatangan di gerbang saat ini?')}
              className="px-2.5 py-1 rounded-xl bg-white border border-[#D5C4B4] text-[#8C6A47] font-bold hover:bg-[#EFE8E1] transition-colors whitespace-nowrap shadow-2xs"
            >
              📊 Status Kedatangan Gerbang
            </button>
          </>
        )}
        {role === 'PIMPINAN' && (
          <>
            <button
              type="button"
              onClick={() => handleSendMessage('Berapa persen tingkat okupansi dan jumlah total yang sudah hadir saat ini?')}
              className="px-2.5 py-1 rounded-xl bg-white border border-[#D5C4B4] text-[#8C6A47] font-bold hover:bg-[#EFE8E1] transition-colors whitespace-nowrap shadow-2xs"
            >
              📊 Ringkasan Kehadiran
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('Siapa saja Masyayikh dan Tamu Kehormatan yang sudah hadir?')}
              className="px-2.5 py-1 rounded-xl bg-white border border-[#D5C4B4] text-[#8C6A47] font-bold hover:bg-[#EFE8E1] transition-colors whitespace-nowrap shadow-2xs"
            >
              👑 Status Tamu VIP
            </button>
          </>
        )}
        {role === 'PENERIMA_TAMU' && (
          <>
            <button
              type="button"
              onClick={() => handleSendMessage('Siapa saja tamu undangan yang sudah tiba dan yang belum hadir?')}
              className="px-2.5 py-1 rounded-xl bg-white border border-[#D5C4B4] text-[#8C6A47] font-bold hover:bg-[#EFE8E1] transition-colors whitespace-nowrap shadow-2xs"
            >
              👥 Cek Status Tamu
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('/penerima-tamu')}
              className="px-2.5 py-1 rounded-xl bg-white border border-[#D5C4B4] text-[#8C6A47] font-bold hover:bg-[#EFE8E1] transition-colors whitespace-nowrap shadow-2xs"
            >
              📋 Presensi Tamu Masuk
            </button>
          </>
        )}
      </div>

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
            placeholder="Tanyakan apapun pada Usth. Halwaa seputar Haflah... (Enter untuk kirim)"
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
  );
}
