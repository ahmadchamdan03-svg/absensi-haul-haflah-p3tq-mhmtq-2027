'use client';

import React from 'react';
import {
  QrCode,
  AlertCircle,
  Camera,
  CameraOff,
  SwitchCamera,
  Compass,
  ShieldCheck,
} from 'lucide-react';
import { JalurPemeriksaan } from '@/lib/types';
import { ScanFeedback } from './types';

interface ScanCameraAndInputSectionProps {
  jalur: JalurPemeriksaan;
  setJalur: (jalur: JalurPemeriksaan) => void;
  onOpenDenah: () => void;
  scanFeedback: ScanFeedback | null;
  showScannerViewport: boolean;
  cameraActive: boolean;
  isInitializing: boolean;
  facingMode: 'environment' | 'user';
  cameraError: string | null;
  onToggleFacingMode: () => void;
  onStopCamera: () => void;
  onStartCamera: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  kodeInput: string;
  setKodeInput: (val: string) => void;
  onSubmitCode: (code: string) => void;
  errorMsg: string | null;
}

export default function ScanCameraAndInputSection({
  jalur,
  setJalur,
  onOpenDenah,
  scanFeedback,
  showScannerViewport,
  cameraActive,
  isInitializing,
  facingMode,
  cameraError,
  onToggleFacingMode,
  onStopCamera,
  onStartCamera,
  inputRef,
  kodeInput,
  setKodeInput,
  onSubmitCode,
  errorMsg,
}: ScanCameraAndInputSectionProps) {
  return (
    <>
      {/* Header Jalur Pemeriksaan */}
      <div className="relative z-10 mb-4 bg-[#FAF7F3] rounded-3xl p-3.5 sm:p-4 shadow-sm border-2 border-[#D5C4B4] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Baris 1 (Mobile) / Sisi Kiri (Desktop): Info Gerbang & Tombol Denah */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3 flex-wrap">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#EFE8E1] text-[#8C6A47] flex items-center justify-center font-bold border-2 border-[#8C6A47] shadow-sm shrink-0">
              <QrCode className="w-5 h-5 text-[#8C6A47]" />
            </div>
            <div className="min-w-0">
              <h1 className="font-serif font-black text-[#422F21] text-xs sm:text-base leading-tight">
                Gerbang Selatan (Bola Dunia)
              </h1>
              <p className="text-[11px] sm:text-xs text-[#7A624E] font-medium leading-tight">
                PWA Scanner &amp; Penyerahan Tiket
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenDenah}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white hover:bg-[#FAF7F3] text-[#5C3E28] text-xs font-bold border border-[#D5C4B4] flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
            title="Buka Denah Lapangan Interaktif"
          >
            <Compass className="w-4 h-4 text-[#8C6A47]" />
            <span className="hidden sm:inline">Denah Lokasi</span>
          </button>
        </div>

        {/* Baris 2 (Mobile) / Sisi Kanan (Desktop): Pemilih Jalur Barat vs Timur */}
        <div className="flex w-full md:w-auto bg-[#EFE8E1] p-1 rounded-xl border border-[#D5C4B4] gap-1.5 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => setJalur('BARAT')}
            className={`flex-1 md:flex-none px-3 py-1.5 text-xs font-bold leading-tight text-center rounded-lg transition-all ${
              jalur === 'BARAT'
                ? 'bg-[#8C6A47] text-white shadow-sm border border-[#735334]'
                : 'text-[#422F21] hover:text-[#8C6A47]'
            }`}
          >
            <span>Jalur Barat</span>
            <span className="block text-[10px] font-medium opacity-90 sm:inline sm:ml-1">(Putra)</span>
          </button>
          <button
            type="button"
            onClick={() => setJalur('TIMUR')}
            className={`flex-1 md:flex-none px-3 py-1.5 text-xs font-bold leading-tight text-center rounded-lg transition-all ${
              jalur === 'TIMUR'
                ? 'bg-[#735334] text-[#FAF7F3] border border-[#D49B5B]/60 shadow-sm'
                : 'text-[#422F21] hover:text-[#8C6A47]'
            }`}
          >
            <span>Jalur Timur</span>
            <span className="block text-[10px] font-medium opacity-90 sm:inline sm:ml-1">(Putri)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* OVERLAY VISUAL FEEDBACK (HASIL PINDAI KILAT)                              */}
      {/* ========================================================================= */}
      {scanFeedback && (
        <div
          className={`p-4 rounded-3xl border-2 shadow-xl animate-in zoom-in-95 duration-150 flex items-center justify-between gap-3 ${
            scanFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
              : 'bg-rose-50 border-rose-400 text-rose-950'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shrink-0 ${
                scanFeedback.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            >
              {scanFeedback.type === 'success' ? (
                <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
              ) : (
                <AlertCircle className="w-6 h-6 stroke-[2.5]" />
              )}
            </div>
            <div>
              <div className="font-serif font-black text-sm sm:text-base leading-tight">
                {scanFeedback.name ? `${scanFeedback.name} (${scanFeedback.kategori})` : scanFeedback.message}
              </div>
              <div
                className={`text-xs font-semibold ${
                  scanFeedback.type === 'success' ? 'text-emerald-800' : 'text-rose-800'
                }`}
              >
                {scanFeedback.message}
              </div>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-xl text-xs font-mono font-bold shrink-0 ${
              scanFeedback.type === 'success'
                ? 'bg-emerald-200 text-emerald-900'
                : 'bg-rose-200 text-rose-900'
            }`}
          >
            {scanFeedback.type === 'success' ? '✓ OK' : '✕ GAGAL'}
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAMPILAN 1: SCANNER AKTIF (PILIHAN DUA JALUR: USB HARDWARE vs KAMERA HP)   */}
      {/* ========================================================================= */}
      {showScannerViewport && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-opera-200 space-y-5">
          {/* Panel Kamera Live */}
          <div className="space-y-3">
            {/* Header Status Kamera */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    cameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                  }`}
                ></span>
                <span className="text-xs font-serif font-bold text-slate-800 tracking-wide">
                  {cameraActive
                    ? 'KAMERA AKTIF — BIDIK KODE QR (10 FPS)'
                    : isInitializing
                    ? 'MEMBUKA KAMERA...'
                    : 'KAMERA NON-AKTIF'}
                </span>
              </div>

              {/* Tombol Kontrol Kamera */}
              <div className="flex items-center space-x-1.5 flex-wrap">
                {cameraActive ? (
                  <>
                    <button
                      type="button"
                      onClick={onToggleFacingMode}
                      title="Ganti Kamera Depan/Belakang"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs flex items-center space-x-1 transition-colors"
                    >
                      <SwitchCamera className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-semibold hidden sm:inline">
                        {facingMode === 'environment' ? 'Kamera Belakang' : 'Kamera Depan'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={onStopCamera}
                      title="Matikan Kamera"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition-colors"
                    >
                      <CameraOff className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={onStartCamera}
                    className="px-3 py-1.5 rounded-xl bg-opera-850 hover:bg-opera-900 text-gold-300 text-xs font-bold border border-gold-500/40 flex items-center space-x-1 shadow-sm"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Nyalakan Kamera</span>
                  </button>
                )}
              </div>
            </div>

            {/* FRAME KAMERA LIVE */}
            <div className="relative rounded-3xl overflow-hidden bg-opera-950 border-2 border-opera-800 shadow-inner flex flex-col items-center justify-center min-h-[280px] aspect-video w-full">
              {/* Viewfinder Overlay */}
              <div className="absolute inset-0 pointer-events-none z-10 p-6 flex flex-col justify-between">
                <div className="flex justify-between">
                  <div className="w-8 h-8 border-t-4 border-l-4 border-[#F5C26B] rounded-tl-xl drop-shadow-[0_0_8px_rgba(245,194,107,0.7)]"></div>
                  <div className="w-8 h-8 border-t-4 border-r-4 border-[#F5C26B] rounded-tr-xl drop-shadow-[0_0_8px_rgba(245,194,107,0.7)]"></div>
                </div>

                {cameraActive && (
                  <div className="w-full flex items-center justify-center">
                    <div className="w-3/4 h-0.5 bg-gradient-to-r from-transparent via-[#F5C26B] to-transparent shadow-[0_0_15px_#F5C26B] animate-pulse"></div>
                  </div>
                )}

                <div className="flex justify-between">
                  <div className="w-8 h-8 border-b-4 border-l-4 border-[#F5C26B] rounded-bl-xl drop-shadow-[0_0_8px_rgba(245,194,107,0.7)]"></div>
                  <div className="w-8 h-8 border-b-4 border-r-4 border-[#F5C26B] rounded-br-xl drop-shadow-[0_0_8px_rgba(245,194,107,0.7)]"></div>
                </div>
              </div>

              <div
                id="qr-camera-reader"
                className="w-full h-full max-w-full aspect-video rounded-2xl overflow-hidden [&_video]:rounded-2xl [&_video]:object-cover"
              ></div>

              {!cameraActive && !isInitializing && (
                <div className="absolute inset-0 z-0 flex flex-col items-center justify-center p-6 text-center text-[#E4EDF5] space-y-3 bg-gradient-to-b from-[#142234] via-[#1F3450] to-[#0C1622]">
                  <div className="w-16 h-16 rounded-2xl bg-[#0C1622] border-2 border-[#4A7BB0]/50 flex items-center justify-center text-[#F5C26B]">
                    <Camera className="w-8 h-8 text-[#F5C26B]" />
                  </div>
                  <div className="space-y-1 max-w-xs">
                    <p className="font-serif font-bold text-white text-sm">
                      Kamera Siap Dinyalakan
                    </p>
                    <p className="text-[11px] text-[#C8DBEC]">
                      Arahkan kamera ke QR Code undangan (contoh: SH2943 atau UND0103).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onStartCamera}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F5C26B] via-[#E5A845] to-[#F5C26B] hover:brightness-105 text-[#142234] font-black text-xs shadow-lg transition-all border border-[#FDF4E4]"
                  >
                    Buka Kamera Sekarang
                  </button>
                </div>
              )}

              {isInitializing && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-opera-950/90 text-gold-300 space-y-2">
                  <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-mono">Menyiapkan Kamera...</span>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">Info Perangkat &amp; Izin Kamera:</div>
                  <div className="text-[11px] text-amber-800 leading-relaxed">
                    {cameraError}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Input Barcode / Manual USB Scanner */}
          <div className="space-y-2 pt-2 border-t border-stone-200">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span className="font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                Scanner USB Aktif / Input Kode Manual:
              </span>
              <span className="text-[11px] font-mono text-[#8C6A47]">Auto-detect USB HID</span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (kodeInput) onSubmitCode(kodeInput);
              }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={kodeInput}
                onChange={(e) => setKodeInput(e.target.value)}
                placeholder="Ketik kode manual jika scanner tidak tersambung (contoh: SH2943)..."
                className="flex-1 px-4 py-3 text-sm rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-mono"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-opera-850 hover:bg-opera-900 text-gold-300 text-sm font-bold shadow border border-gold-500/40 transition-colors cursor-pointer"
              >
                Proses
              </button>
            </form>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}
