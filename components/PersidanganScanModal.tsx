'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  SwitchCamera,
  Users,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Persidangan, PersidanganPeserta } from '@/lib/persidangan';
import { supabase } from '@/lib/supabase';

interface PersidanganScanModalProps {
  persidangan: Persidangan;
  onClose: () => void;
  onScanSuccess?: () => void;
}

interface ScanResultFeedback {
  type: 'success' | 'warning' | 'error' | 'rate_limit';
  title: string;
  pesertaNama?: string;
  kodePeserta?: string;
  waktuText?: string;
  detailMsg?: string;
}

interface ScannedSessionItem {
  id: string;
  nama: string;
  kode: string;
  waktu: string;
}

export default function PersidanganScanModal({
  persidangan,
  onClose,
  onScanSuccess,
}: PersidanganScanModalProps) {
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [scanResult, setScanResult] = useState<ScanResultFeedback | null>(null);
  const [recentScans, setRecentScans] = useState<ScannedSessionItem[]>([]);

  const scannerRef = useRef<any>(null);
  const isScanningLockedRef = useRef(false);
  const scanTimestampsRef = useRef<number[]>([]);
  const isUnmountedRef = useRef(false);

  // Audio synthesize helpers
  const playSuccessTone = () => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(200);
      }
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(784, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.14);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {}
  };

  const playWarningTone = () => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.([100, 50, 100]);
      }
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(370, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  };

  const playErrorTone = () => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.([250, 80, 250]);
      }
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(130, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } catch {}
  };

  // Safe camera stop
  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        // Ignored
      }
      scannerRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Process Scanned Code
  const handleProcessScan = useCallback(
    async (decodedText: string) => {
      if (isScanningLockedRef.current) return;

      const rawCode = String(decodedText || '').trim();
      if (!rawCode) return;

      // Extract code if user scanned a URL: e.g. /s/SD-A9X2 or ?to=SD-A9X2
      let cleanCode = rawCode;
      try {
        if (rawCode.includes('/s/')) {
          const parts = rawCode.split('/s/');
          if (parts[1]) cleanCode = parts[1].split('?')[0].split('/')[0];
        } else if (rawCode.includes('?to=')) {
          const urlObj = new URL(rawCode);
          cleanCode = urlObj.searchParams.get('to') || cleanCode;
        } else if (rawCode.includes('to=')) {
          const parts = rawCode.split('to=');
          if (parts[1]) cleanCode = parts[1].split('&')[0];
        }
      } catch {
        // Bukan URL, gunakan teks mentah
      }
      cleanCode = cleanCode.trim().toUpperCase();

      // Rate limit check: max 10 scan per menit
      const now = Date.now();
      scanTimestampsRef.current = scanTimestampsRef.current.filter((t) => now - t < 60000);
      if (scanTimestampsRef.current.length >= 10) {
        isScanningLockedRef.current = true;
        playWarningTone();
        setScanResult({
          type: 'rate_limit',
          title: 'Batas Scan Tercapai',
          detailMsg: 'Maksimal 10 scan per menit untuk menjaga kestabilan sistem. Tunggu beberapa detik.',
        });
        setTimeout(() => {
          if (!isUnmountedRef.current) {
            setScanResult(null);
            isScanningLockedRef.current = false;
          }
        }, 3000);
        return;
      }

      // Lock scanning for 2 seconds
      isScanningLockedRef.current = true;
      scanTimestampsRef.current.push(now);

      try {
        // Query persidangan_peserta WHERE kode_peserta = cleanCode AND persidangan_id = persidangan.id
        const { data: peserta, error } = await supabase
          .from('persidangan_peserta')
          .select('*')
          .ilike('kode_peserta', cleanCode)
          .eq('persidangan_id', persidangan.id)
          .maybeSingle();

        if (error || !peserta) {
          // Case 1: Tidak ditemukan atau bukan untuk persidangan ini
          playErrorTone();
          setScanResult({
            type: 'error',
            title: 'QR Salah atau Bukan Persidangan Ini',
            kodePeserta: cleanCode,
            detailMsg: `Kode "${cleanCode}" tidak terdaftar di ${persidangan.judul}.`,
          });
        } else if (peserta.status_kehadiran === 'HADIR') {
          // Case 2: Sudah hadir sebelumnya
          playWarningTone();
          const waktuHadirStr = peserta.waktu_hadir
            ? new Date(peserta.waktu_hadir).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })
            : 'sebelumnya';

          setScanResult({
            type: 'warning',
            title: 'Sudah Tercatat Hadir',
            pesertaNama: peserta.nama,
            kodePeserta: peserta.kode_peserta || cleanCode,
            waktuText: waktuHadirStr,
            detailMsg: `${peserta.nama} sudah tercatat hadir pada pukul ${waktuHadirStr}.`,
          });
        } else {
          // Case 3: Belum hadir -> Tandai hadir!
          const nowIso = new Date().toISOString();
          const waktuScanStr = new Date(nowIso).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

          const { error: updateError } = await supabase
            .from('persidangan_peserta')
            .update({
              status_kehadiran: 'HADIR',
              waktu_hadir: nowIso,
            })
            .eq('id', peserta.id);

          if (updateError) {
            playErrorTone();
            setScanResult({
              type: 'error',
              title: 'Gagal Menyimpan Kehadiran',
              detailMsg: updateError.message || 'Gagal memperbarui status ke database.',
            });
          } else {
            playSuccessTone();
            setScanResult({
              type: 'success',
              title: 'Presensi Berhasil!',
              pesertaNama: peserta.nama,
              kodePeserta: peserta.kode_peserta || cleanCode,
              waktuText: waktuScanStr,
              detailMsg: `${peserta.nama} berhasil dicatat hadir.`,
            });

            // Catat di riwayat sesi ini
            setRecentScans((prev) => [
              {
                id: peserta.id,
                nama: peserta.nama,
                kode: peserta.kode_peserta || cleanCode,
                waktu: waktuScanStr,
              },
              ...prev.slice(0, 9),
            ]);

            if (onScanSuccess) {
              onScanSuccess();
            }
          }
        }
      } catch (err: any) {
        playErrorTone();
        setScanResult({
          type: 'error',
          title: 'Kesalahan Sistem',
          detailMsg: err?.message || 'Terjadi gangguan saat memproses QR Code.',
        });
      } finally {
        // Reset 2 detik
        setTimeout(() => {
          if (!isUnmountedRef.current) {
            setScanResult(null);
            isScanningLockedRef.current = false;
          }
        }, 2000);
      }
    },
    [persidangan.id, persidangan.judul, onScanSuccess]
  );

  // Start Camera
  const startCamera = useCallback(
    async (mode: 'environment' | 'user') => {
      if (typeof window === 'undefined') return;
      setCameraLoading(true);
      setCameraError(null);

      await stopCamera();

      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        const container = document.getElementById('persidangan-camera-reader');
        if (!container) {
          setCameraLoading(false);
          return;
        }

        const scanner = new Html5Qrcode('persidangan-camera-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: mode },
          {
            fps: 12,
            qrbox: { width: 240, height: 240 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            handleProcessScan(decodedText);
          },
          () => {
            // Frame tidak menemukan QR - abaikan
          }
        );

        if (!isUnmountedRef.current) {
          setCameraActive(true);
          setCameraLoading(false);
          setCameraError(null);
        }
      } catch (err: any) {
        if (!isUnmountedRef.current) {
          console.warn('Gagal mengaktifkan kamera:', err);
          setCameraActive(false);
          setCameraLoading(false);
          setCameraError(
            err?.message ||
              'Kamera tidak dapat diakses atau izin belum diberikan. Pastikan izin kamera telah diizinkan.'
          );
        }
      }
    },
    [handleProcessScan, stopCamera]
  );

  // Switch Camera
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Mount effect
  useEffect(() => {
    isUnmountedRef.current = false;
    startCamera(facingMode);

    return () => {
      isUnmountedRef.current = true;
      stopCamera();
    };
  }, [facingMode, startCamera, stopCamera]);

  // Handle ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#FAF7F3] border-2 border-[#D5C4B4] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="bg-[#FAF7F3] border-b-2 border-[#D5C4B4] px-5 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#8C6A47]/15 border border-[#8C6A47]/30 flex items-center justify-center text-[#8C6A47]">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm sm:text-base text-[#422F21] line-clamp-1">
                Scan Kehadiran Persidangan
              </h3>
              <p className="text-[11px] text-[#735334] line-clamp-1">
                {persidangan.judul}{' '}
                {persidangan.prefix_kode && (
                  <span className="font-mono font-bold text-[#8C6A47]">
                    ({persidangan.prefix_kode})
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleFacingMode}
              title="Ganti Kamera (Depan / Belakang)"
              className="p-2 rounded-xl bg-white border border-[#D5C4B4] text-[#735334] hover:bg-[#FAF7F3] transition-colors"
            >
              <SwitchCamera className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Tutup"
              className="p-2 rounded-xl bg-white border border-[#D5C4B4] text-[#735334] hover:bg-[#FAF7F3] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scanner Viewport Container */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          <div className="relative aspect-square max-w-[340px] mx-auto rounded-2xl overflow-hidden bg-stone-900 border-2 border-[#D5C4B4] shadow-inner flex items-center justify-center">
            {/* HTML5 QR Camera Element */}
            <div
              id="persidangan-camera-reader"
              className="w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full"
            />

            {/* Loading Spinner */}
            {cameraLoading && (
              <div className="absolute inset-0 bg-[#FAF7F3] flex flex-col items-center justify-center p-4 text-center z-10 space-y-2">
                <RefreshCw className="w-8 h-8 text-[#8C6A47] animate-spin" />
                <span className="text-xs font-bold text-[#422F21]">Menghubungkan ke kamera...</span>
              </div>
            )}

            {/* Error Message */}
            {cameraError && (
              <div className="absolute inset-0 bg-[#FAF7F3] flex flex-col items-center justify-center p-5 text-center z-10 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-red-100 border border-red-200 text-red-600 flex items-center justify-center">
                  <XCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif font-bold text-xs sm:text-sm text-[#422F21]">
                    Gagal Mengakses Kamera
                  </h4>
                  <p className="text-[11px] text-[#735334] max-w-xs">{cameraError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8C6A47] text-white text-xs font-bold shadow-xs hover:bg-[#735334]"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Coba Lagi
                </button>
              </div>
            )}

            {/* Dynamic Result Overlay: Red, Yellow, or Green */}
            {scanResult && (
              <div
                className={`absolute inset-0 z-30 p-6 flex flex-col items-center justify-center text-center animate-in fade-in duration-150 backdrop-blur-xs ${
                  scanResult.type === 'success'
                    ? 'bg-emerald-950/85 text-white'
                    : scanResult.type === 'warning'
                    ? 'bg-amber-950/85 text-white'
                    : scanResult.type === 'rate_limit'
                    ? 'bg-orange-950/85 text-white'
                    : 'bg-red-950/85 text-white'
                }`}
              >
                {/* Icon */}
                <div className="mb-2">
                  {scanResult.type === 'success' && (
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center">
                      <CheckCircle2 className="w-9 h-9 text-emerald-300" />
                    </div>
                  )}
                  {scanResult.type === 'warning' && (
                    <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center">
                      <AlertTriangle className="w-9 h-9 text-amber-300" />
                    </div>
                  )}
                  {scanResult.type === 'rate_limit' && (
                    <div className="w-16 h-16 rounded-full bg-orange-500/20 border-2 border-orange-400 flex items-center justify-center">
                      <Clock className="w-9 h-9 text-orange-300" />
                    </div>
                  )}
                  {scanResult.type === 'error' && (
                    <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-400 flex items-center justify-center">
                      <XCircle className="w-9 h-9 text-red-300" />
                    </div>
                  )}
                </div>

                {/* Title */}
                <h4 className="font-serif font-black text-base sm:text-lg mb-1 leading-tight">
                  {scanResult.title}
                </h4>

                {/* Peserta & Waktu */}
                {scanResult.pesertaNama && (
                  <p className="text-sm font-bold text-white mb-0.5">{scanResult.pesertaNama}</p>
                )}

                {scanResult.kodePeserta && (
                  <span className="inline-block px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-white/20 text-white mb-1">
                    {scanResult.kodePeserta}
                  </span>
                )}

                {scanResult.detailMsg && (
                  <p className="text-[11px] opacity-90 max-w-xs">{scanResult.detailMsg}</p>
                )}

                <span className="text-[10px] opacity-60 mt-3 block">
                  Kamera akan siap kembali dalam 2 detik...
                </span>
              </div>
            )}
          </div>

          {/* Instruksi Penggunaan */}
          <div className="text-center space-y-1">
            <p className="text-xs text-[#735334]">
              Arahkan kamera ke QR Code peserta pada surat undangan digital mereka.
            </p>
            <p className="text-[11px] text-[#A89887]">
              Sistem akan memverifikasi kode unik dan mencatat jam kehadiran secara otomatis.
            </p>
          </div>

          {/* Sesi Kehadiran Baru / Recent Scans */}
          {recentScans.length > 0 && (
            <div className="bg-white border border-[#D5C4B4] rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#422F21]">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#8C6A47]" />
                  Baru Saja Hadir ({recentScans.length}):
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Sesi Ini
                </span>
              </div>
              <div className="divide-y divide-[#EFE8E1] max-h-36 overflow-y-auto text-xs">
                {recentScans.map((item, idx) => (
                  <div key={idx} className="py-1.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-[#8C6A47] bg-[#8C6A47]/10 px-1.5 py-0.5 rounded">
                        {item.kode}
                      </span>
                      <span className="font-semibold text-[#422F21] line-clamp-1">{item.nama}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#735334] shrink-0">
                      {item.waktu}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="bg-[#FAF7F3] border-t-2 border-[#D5C4B4] px-5 py-3 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white border border-[#D5C4B4] text-xs font-bold text-[#735334] hover:bg-[#FAF7F3] transition-colors"
          >
            Tutup Scanner
          </button>
        </div>
      </div>
    </div>
  );
}
