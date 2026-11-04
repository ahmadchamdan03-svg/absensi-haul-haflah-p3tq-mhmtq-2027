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
  Download,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import {
  EXPRESSION_AVATARS,
  Message,
  renderFormattedContent,
} from './tanya-us-helpers';
import { PieChartWidget } from './TanyaUsCharts';
import { exportTextToPdf, exportTableToExcel, exportTextToDocx, fetchFreshMotivasi, cleanDocumentText } from '@/lib/halwaa/file-exporter';

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
      <div className="py-2.5 px-3 sm:px-6 bg-white/60 backdrop-blur-md border-b border-white/40 flex items-center justify-between shrink-0 select-none gap-2">
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
            <div className="flex items-center">
              <h2 className="font-serif font-black text-sm sm:text-lg text-[#422F21] leading-tight truncate">
                Tanya Usth. Halwaa
              </h2>
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
            className={`p-2 rounded-xl text-[#7A624E] hover:text-[#422F21] hover:bg-white/60 transition-colors ${
              showSettings ? 'bg-white/60 text-[#8C6A47]' : ''
            }`}
            title="Pengaturan API Key"
            aria-label="Pengaturan"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetChat}
            className="p-2 rounded-xl text-[#7A624E] hover:text-[#422F21] hover:bg-white/60 transition-colors"
            title="Mulai Percakapan Baru"
            aria-label="Reset Chat"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#7A624E] hover:text-[#422F21] hover:bg-white/60 transition-colors"
            title="Tutup (Esc)"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Panel Pengaturan API Key (Opsional / Terbuka Saat Tombol Settings Diklik) */}
      {showSettings && (
        <div className="p-4 bg-[#FAF7F3]/95 backdrop-blur-md border-b border-white/40 text-xs text-[#543C28] space-y-2 shrink-0 animate-in slide-in-from-top-2 duration-150 shadow-inner">
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
              className="flex-1 px-3 py-1.5 rounded-xl border border-white/80 bg-white/80 backdrop-blur-xs text-xs font-mono focus:outline-none focus:border-[#8C6A47] text-[#422F21]"
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
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-transparent">
      {messages.map((msg, msgIndex) => {
        const isUser = msg.role === 'user';
        const prevUserMsg = msgIndex > 0 ? messages[msgIndex - 1] : null;
        const userAskedPdf =
          !isUser &&
          prevUserMsg?.role === 'user' &&
          /(buatkan|bikin|unduh|download|ekspor|jadikan).*?(pdf)|(\bpdf\b)/i.test(prevUserMsg.content);
        const userAskedDocx =
          !isUser &&
          prevUserMsg?.role === 'user' &&
          /(buatkan|bikin|unduh|download|ekspor|jadikan).*?(word|docx)|(\bdocx?\b|\bword\b)/i.test(prevUserMsg.content);
        const userAskedExcel =
          !isUser &&
          prevUserMsg?.role === 'user' &&
          /(buatkan|bikin|unduh|download|ekspor|jadikan).*?(excel|xlsx|spreadsheet)|(\bxlsx?\b|\bexcel\b)/i.test(prevUserMsg.content);

        const hasPdfTag = /\[DOWNLOAD_PDF:/i.test(msg.content);
        const hasDocxTag = /\[DOWNLOAD_DOCX:/i.test(msg.content);
        const hasTable = /\|.*?\|.*?\|/.test(msg.content);

        const showPdfButton = userAskedPdf && !hasPdfTag;
        const showDocxButton = userAskedDocx && !hasDocxTag;
        const showExcelButton = userAskedExcel && !hasTable;
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
              className={`max-w-[85%] sm:max-w-[78%] rounded-3xl p-4 shadow-sm space-y-2 text-xs sm:text-[13px] leading-relaxed relative group ${
                isUser
                  ? 'bg-amber-100/90 border border-amber-200/80 shadow-sm text-[#2D1B0E] rounded-br-xs'
                  : 'bg-white/80 backdrop-blur-md border border-white/60 shadow-sm text-[#422F21] rounded-bl-xs'
              }`}
            >
              {/* Sender & Timestamp */}
              <div
                className={`flex items-center justify-between gap-2 text-[10px] pb-1 border-b ${
                  isUser
                    ? 'border-amber-200/80 text-[#7D5A3C]'
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
                        {msg.model || 'Clouvia'}
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

              {/* Tombol Unduhan File Tambahan HANYA jika diminta oleh pengguna di pertanyaan sebelumnya */}
              {!isUser && (showPdfButton || showDocxButton || showExcelButton) && (
                <div className="pt-2 border-t border-[#EFE8E1] flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-[#7A624E] font-medium flex items-center gap-1">
                    <Download className="w-3 h-3 text-[#8C6A47]" />
                    Unduh Berkas yang Diminta:
                  </span>
                  {showPdfButton && (
                    <button
                      type="button"
                      onClick={async () => {
                        const clean = cleanDocumentText(msg.content);
                        const userTopic = prevUserMsg?.content?.replace(/^(tolong|mohon|buatkan|bikin|unduh|download|ekspor|jadikan|format|versi)\s+/i, '').trim().slice(0, 50) || 'Dokumen_Haflah_P3TQ';
                        const motivasi = await fetchFreshMotivasi(userTopic);
                        exportTextToPdf(userTopic, clean, undefined, motivasi);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold text-[10px] shadow-2xs transition-all active:scale-95 cursor-pointer"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Unduh PDF</span>
                    </button>
                  )}
                  {showDocxButton && (
                    <button
                      type="button"
                      onClick={async () => {
                        const clean = cleanDocumentText(msg.content);
                        const userTopic = prevUserMsg?.content?.replace(/^(tolong|mohon|buatkan|bikin|unduh|download|ekspor|jadikan|format|versi)\s+/i, '').trim().slice(0, 50) || 'Dokumen_Haflah_P3TQ';
                        const motivasi = await fetchFreshMotivasi(userTopic);
                        exportTextToDocx(userTopic, clean, undefined, motivasi);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-[10px] shadow-2xs transition-all active:scale-95 cursor-pointer"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Unduh Word (.docx)</span>
                    </button>
                  )}
                  {showExcelButton && (
                    <button
                      type="button"
                      onClick={async () => {
                        const clean = cleanDocumentText(msg.content);
                        const lines = clean
                          .split('\n')
                          .filter((l) => l.trim().length > 0);
                        const rows = lines.map((l, i) => [i + 1, l.replace(/^[\*\-\d\.\s]+/, '')]);
                        const userTopic = prevUserMsg?.content?.replace(/^(tolong|mohon|buatkan|bikin|unduh|download|ekspor|jadikan|format|versi)\s+/i, '').trim().slice(0, 50) || 'Ringkasan_Haflah';
                        const motivasi = await fetchFreshMotivasi(userTopic);
                        exportTableToExcel(['No', 'Uraian'], rows, userTopic, motivasi);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] shadow-2xs transition-all active:scale-95 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3 h-3" />
                      <span>Unduh Excel (.xlsx)</span>
                    </button>
                  )}
                </div>
              )}

              {/* Tombol Copy untuk Assistant */}
              {!isUser && (
                <div className="pt-1 flex items-center justify-end">
                  <button
                    onClick={() => handleCopyText(msg.id, msg.content)}
                    className="inline-flex items-center space-x-1 text-[10px] text-[#7A624E] hover:text-[#422F21] px-2 py-0.5 rounded-md hover:bg-white/60 transition-colors"
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
              <div className="w-8 h-8 rounded-full bg-[#EADBC8] border-2 border-[#8C6A47]/40 flex items-center justify-center shrink-0 mt-0.5 text-[#8C6A47] shadow-xs">
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

          <div className="p-3.5 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/50 text-xs text-[#422F21] flex items-center space-x-2.5 shadow-sm">
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
    <div className="p-3 sm:p-4 bg-white/60 backdrop-blur-md border-t border-white/40 shrink-0 space-y-2">
      {/* Quick Action Chips per Role */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {role === 'ADMIN' && (
          <>
            <button
              type="button"
              onClick={() => handleNavigate('/scan')}
              className="px-2.5 py-1 rounded-xl bg-white/60 hover:bg-white/85 backdrop-blur-xs border border-white/70 text-[#8C6A47] font-bold transition-colors whitespace-nowrap shadow-2xs"
            >
              👉 Buka Scanner
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('/admin/dasbor')}
              className="px-2.5 py-1 rounded-xl bg-white/60 hover:bg-white/85 backdrop-blur-xs border border-white/70 text-[#8C6A47] font-bold transition-colors whitespace-nowrap shadow-2xs"
            >
              📊 Cek Rekap Kehadiran
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('/admin/whatsapp')}
              className="px-2.5 py-1 rounded-xl bg-white/60 hover:bg-white/85 backdrop-blur-xs border border-white/70 text-[#8C6A47] font-bold transition-colors whitespace-nowrap shadow-2xs"
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
              className="px-2.5 py-1 rounded-xl bg-white/60 hover:bg-white/85 backdrop-blur-xs border border-white/70 text-[#8C6A47] font-bold transition-colors whitespace-nowrap shadow-2xs"
            >
              👉 Buka Scanner Gerbang
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('Bagaimana status kedatangan di gerbang saat ini?')}
              className="px-2.5 py-1 rounded-xl bg-white/60 hover:bg-white/85 backdrop-blur-xs border border-white/70 text-[#8C6A47] font-bold transition-colors whitespace-nowrap shadow-2xs"
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
              className="px-2.5 py-1 rounded-xl bg-white/60 hover:bg-white/85 backdrop-blur-xs border border-white/70 text-[#8C6A47] font-bold transition-colors whitespace-nowrap shadow-2xs"
            >
              📊 Ringkasan Kehadiran
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('Siapa saja Masyayikh dan Tamu Kehormatan yang sudah hadir?')}
              className="px-2.5 py-1 rounded-xl bg-white/60 hover:bg-white/85 backdrop-blur-xs border border-white/70 text-[#8C6A47] font-bold transition-colors whitespace-nowrap shadow-2xs"
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
              className="px-2.5 py-1 rounded-xl bg-white/60 hover:bg-white/85 backdrop-blur-xs border border-white/70 text-[#8C6A47] font-bold transition-colors whitespace-nowrap shadow-2xs"
            >
              👥 Cek Status Tamu
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('/penerima-tamu')}
              className="px-2.5 py-1 rounded-xl bg-white/60 hover:bg-white/85 backdrop-blur-xs border border-white/70 text-[#8C6A47] font-bold transition-colors whitespace-nowrap shadow-2xs"
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
            className="w-full px-3.5 py-2.5 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/60 focus:bg-white/90 focus:border-[#8C6A47] focus:outline-none text-xs sm:text-sm text-[#422F21] placeholder:text-[#7A624E]/70 resize-none min-h-[42px] max-h-24 shadow-inner"
          />
        </div>

        <button
          type="submit"
          disabled={!inputQuery.trim() || isLoading}
          className="p-3 rounded-2xl bg-[#8C6A47] hover:bg-[#735334] disabled:opacity-50 text-white font-bold transition-all shadow-md active:scale-95 shrink-0 flex items-center justify-center cursor-pointer"
          title="Kirim Pertanyaan"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      <div className="hidden sm:flex items-center justify-end text-[10px] text-[#7A624E] mt-1 px-1 font-medium">
        <span className="shrink-0">Tekan Shift + Enter untuk baris baru</span>
      </div>
    </div>
  );
}
