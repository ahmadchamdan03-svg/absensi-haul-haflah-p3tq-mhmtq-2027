'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  QrCode,
  Users,
  Check,
  AlertCircle,
  Clock,
  ArrowRight,
  Sparkles,
  ChevronRight,
  RotateCcw,
  Camera,
  CameraOff,
  SwitchCamera,
  Volume2,
  HelpCircle,
  Compass,
} from 'lucide-react';
import { store } from '@/lib/mock-data';
import { JalurPemeriksaan, CheckinResult } from '@/lib/types';
import confetti from 'canvas-confetti';
import DenahModal from '@/components/DenahModal';

export default function ScanPage() {
  const [jalur, setJalur] = useState<JalurPemeriksaan>('TIMUR');
  const [isDenahOpen, setIsDenahOpen] = useState(false);
  const [kodeInput, setKodeInput] = useState('');
  const [activeItem, setActiveItem] = useState<any>(null);

  // Form input kehadiran
  const [jumlahL, setJumlahL] = useState(0);
  const [jumlahP, setJumlahP] = useState(0);
  const [jumlahBalita, setJumlahBalita] = useState(0);
  const [serahkanTiketEmas, setSerahkanTiketEmas] = useState(true);

  // Result state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [checkinResult, setCheckinResult] = useState<CheckinResult | null>(null);

  // Camera scanner state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isInitializing, setIsInitializing] = useState(false);

  const scannerRef = useRef<any>(null);
  const isScanningRef = useRef(false);

  // Audio synthesizer beep saat scan berhasil
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(784, ctx.currentTime); // G5
      osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.12); // C6

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch (e) {
      // Browser audio not allowed before user interaction, ignore safely
    }
  };

  // Handler memproses kode QR (baik dari kamera maupun input manual)
  const handleScanCode = useCallback((scannedRaw: string) => {
    setErrorMsg(null);
    setCheckinResult(null);

    let cleanKode = scannedRaw.trim();
    // Tangani jika format QR adalah URL web (e.g. https://domain.com/u/SH0001)
    if (cleanKode.includes('/u/')) {
      const parts = cleanKode.split('/u/');
      if (parts.length >= 2) cleanKode = parts[1].split('?')[0].split('#')[0];
    } else if (cleanKode.includes('.')) {
      const parts = cleanKode.split('.');
      if (parts.length >= 2) cleanKode = parts[1];
    }

    cleanKode = cleanKode.toUpperCase().trim();

    const item = store.findByKode(cleanKode);
    if (!item) {
      setErrorMsg(`Kode QR "${cleanKode}" tidak terdaftar dalam database!`);
      setActiveItem(null);
      return;
    }

    playBeep();
    setActiveItem(item);
    setKodeInput(cleanKode);

    // Stop sementara scanner kamera agar tidak dobel scan saat input L/P
    stopCamera();

    const sisa = item.kuota.kuotaDasar + item.kuota.kuotaTambahan - item.kuota.terpakai;
    if (sisa > 0) {
      setJumlahL(1);
      setJumlahP(Math.min(1, sisa - 1));
    } else {
      setJumlahL(0);
      setJumlahP(0);
    }
    setJumlahBalita(0);

    // Inisialisasi status checklist tiket panggung Bil Ghoib
    if (item.kuota.tiketPanggungJatah > 0) {
      const belumDiberi = (item.kuota.tiketPanggungDiberi || 0) < item.kuota.tiketPanggungJatah;
      setSerahkanTiketEmas(belumDiberi);
    } else {
      setSerahkanTiketEmas(false);
    }
  }, []);

  // Inisialisasi & Start Kamera
  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    if (typeof window === 'undefined') return;
    setIsInitializing(true);
    setCameraError(null);

    try {
      // Hentikan instance sebelumnya jika ada
      if (scannerRef.current && isScanningRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch (e) {
          // ignore
        }
      }

      const { Html5Qrcode } = await import('html5-qrcode');
      const readerElement = document.getElementById('qr-camera-reader');
      if (!readerElement) {
        setIsInitializing(false);
        return;
      }

      const scanner = new Html5Qrcode('qr-camera-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: mode },
        {
          fps: 12,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleScanCode(decodedText);
        },
        () => {
          // Frame scanner ignore
        }
      );

      isScanningRef.current = true;
      setCameraActive(true);
      setCameraError(null);
    } catch (err: any) {
      console.warn('Gagal menyalakan kamera:', err);
      setCameraActive(false);
      isScanningRef.current = false;
      const errMsg =
        err?.message ||
        'Kamera tidak terdeteksi atau izin belum diberikan. Silakan izinkan akses kamera di browser Anda.';
      setCameraError(errMsg);
    } finally {
      setIsInitializing(false);
    }
  };

  // Stop Kamera
  const stopCamera = async () => {
    if (scannerRef.current && isScanningRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      isScanningRef.current = false;
      setCameraActive(false);
    }
  };

  // Switch Kamera (Depan / Belakang)
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Auto-Start Kamera saat halaman dibuka dan tidak ada item yang sedang diproses
  useEffect(() => {
    if (!activeItem && !checkinResult) {
      startCamera(facingMode);
    }

    return () => {
      stopCamera();
    };
  }, [activeItem, checkinResult]);

  // Handler Konfirmasi Checkin
  const handleConfirmCheckin = () => {
    if (!activeItem) return;
    setErrorMsg(null);

    const result = store.checkin(
      activeItem.kuota.kodeQr,
      jumlahL,
      jumlahP,
      jalur,
      jumlahBalita,
      jalur === 'BARAT' ? 'panitia-putra' : 'panitia-putri',
      serahkanTiketEmas
    );

    if (!result.ok) {
      setErrorMsg(result.pesan || result.reason || 'Check-in gagal');
      return;
    }

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#F5C26B', '#4A7BB0', '#F4EFE6', '#ffffff'],
    });

    setCheckinResult(result);
    const updated = store.findByKode(activeItem.kuota.kodeQr);
    setActiveItem(updated);
  };

  // Handler Reset untuk Tamu Berikutnya (Otomatis Aktifkan Kamera Lagi)
  const handleResetForNext = () => {
    setActiveItem(null);
    setCheckinResult(null);
    setErrorMsg(null);
    setKodeInput('');
    setJumlahL(0);
    setJumlahP(0);
    setJumlahBalita(0);
    setSerahkanTiketEmas(false);
    // Kamera otomatis dimulai kembali oleh useEffect di atas
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-20">
      {/* Header Jalur Pemeriksaan: Warm Latte & Cinnamon Mocha Aesthetic */}
      <div className="bg-[#FAF7F3] rounded-3xl p-4 shadow-sm border-2 border-[#D5C4B4]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EFE8E1] text-[#8C6A47] flex items-center justify-center font-bold border-2 border-[#8C6A47] shadow-sm">
              <QrCode className="w-5 h-5 text-[#8C6A47]" />
            </div>
            <div>
              <h1 className="font-serif font-black text-[#422F21] text-sm sm:text-base leading-tight">
                Gerbang Selatan (Bola Dunia)
              </h1>
              <p className="text-xs text-[#7A624E] font-medium">PWA Scanner & Penyerahan Tiket</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsDenahOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF7F3] text-[#5C3E28] text-xs font-bold border border-[#D5C4B4] flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
              title="Buka Denah Lapangan Interaktif"
            >
              <Compass className="w-3.5 h-3.5 text-[#8C6A47]" />
              <span className="hidden sm:inline">Denah Lokasi</span>
            </button>

            {/* Pemilih Jalur Barat vs Timur */}
            <div className="flex bg-[#EFE8E1] p-1 rounded-xl border border-[#D5C4B4]">
              <button
                onClick={() => setJalur('BARAT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  jalur === 'BARAT'
                    ? 'bg-[#8C6A47] text-white shadow-sm'
                    : 'text-[#422F21] hover:text-[#8C6A47]'
                }`}
              >
                Jalur Barat (Putra)
              </button>
              <button
                onClick={() => setJalur('TIMUR')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  jalur === 'TIMUR'
                    ? 'bg-[#735334] text-[#FAF7F3] border border-[#D49B5B]/60 shadow-sm'
                    : 'text-[#422F21] hover:text-[#8C6A47]'
                }`}
              >
                Jalur Timur (Putri)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAMPILAN 1: KAMERA OTOMATIS AKTIF & SCANNER QR */}
      {/* ========================================================================= */}
      {!activeItem && !checkinResult && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-opera-200 space-y-5">
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
                  ? 'KAMERA AKTIF — BIDIK KODE QR'
                  : isInitializing
                  ? 'MEMBUKA KAMERA...'
                  : 'KAMERA NON-AKTIF'}
              </span>
            </div>

            {/* Tombol Kontrol Kamera */}
            <div className="flex items-center space-x-1.5">
              {cameraActive ? (
                <>
                  <button
                    onClick={toggleFacingMode}
                    title="Ganti Kamera Depan/Belakang"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs flex items-center space-x-1 transition-colors"
                  >
                    <SwitchCamera className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-semibold hidden sm:inline">
                      {facingMode === 'environment' ? 'Kamera Belakang' : 'Kamera Depan'}
                    </span>
                  </button>
                  <button
                    onClick={stopCamera}
                    title="Matikan Kamera"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition-colors"
                  >
                    <CameraOff className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => startCamera(facingMode)}
                  className="px-3 py-1.5 rounded-xl bg-opera-850 hover:bg-opera-900 text-gold-300 text-xs font-bold border border-gold-500/40 flex items-center space-x-1 shadow-sm"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Nyalakan Kamera</span>
                </button>
              )}
            </div>
          </div>

          {/* FRAME KAMERA LIVE DENGAN BINGKAI EMAS VIDEOTRON */}
          <div className="relative rounded-3xl overflow-hidden bg-opera-950 border-2 border-opera-800 shadow-inner flex flex-col items-center justify-center min-h-[300px]">
            {/* Viewfinder Overlay Panggung (Bingkai Emas & Sudut Emas) */}
            <div className="absolute inset-0 pointer-events-none z-10 p-6 flex flex-col justify-between">
              {/* Sudut Atas */}
              <div className="flex justify-between">
                <div className="w-8 h-8 border-t-4 border-l-4 border-[#F5C26B] rounded-tl-xl drop-shadow-[0_0_8px_rgba(245,194,107,0.7)]"></div>
                <div className="w-8 h-8 border-t-4 border-r-4 border-[#F5C26B] rounded-tr-xl drop-shadow-[0_0_8px_rgba(245,194,107,0.7)]"></div>
              </div>

              {/* Garis Pemindai Laser Animasi */}
              {cameraActive && (
                <div className="w-full flex items-center justify-center">
                  <div className="w-3/4 h-0.5 bg-gradient-to-r from-transparent via-[#F5C26B] to-transparent shadow-[0_0_15px_#F5C26B] animate-pulse"></div>
                </div>
              )}

              {/* Sudut Bawah */}
              <div className="flex justify-between">
                <div className="w-8 h-8 border-b-4 border-l-4 border-[#F5C26B] rounded-bl-xl drop-shadow-[0_0_8px_rgba(245,194,107,0.7)]"></div>
                <div className="w-8 h-8 border-b-4 border-r-4 border-[#F5C26B] rounded-br-xl drop-shadow-[0_0_8px_rgba(245,194,107,0.7)]"></div>
              </div>
            </div>

            {/* Elemen Video Stream dari Html5Qrcode */}
            <div
              id="qr-camera-reader"
              className="w-full h-full max-w-[420px] aspect-square rounded-2xl overflow-hidden [&_video]:rounded-2xl [&_video]:object-cover"
            ></div>

            {/* Placeholder jika kamera belum aktif atau error */}
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
                    Arahkan kamera ponsel/perangkat ke QR Code undangan wali santri.
                  </p>
                </div>
                <button
                  onClick={() => startCamera(facingMode)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F5C26B] via-[#E5A845] to-[#F5C26B] hover:brightness-105 text-[#142234] font-black text-xs shadow-lg transition-all border border-[#FDF4E4]"
                >
                  Buka Kamera Sekarang
                </button>
              </div>
            )}

            {/* Loading spinner */}
            {isInitializing && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-opera-950/90 text-gold-300 space-y-2">
                <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-mono">Menyiapkan Kamera...</span>
              </div>
            )}
          </div>

          {/* Notifikasi Kamera Error / Tanpa Webcam */}
          {cameraError && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold">Info Perangkat & Izin Kamera:</div>
                <div className="text-[11px] text-amber-800 leading-relaxed">
                  {cameraError}
                </div>
                <div className="text-[11px] text-amber-800">
                  Anda tetap dapat menggunakan <strong>Barcode Scanner USB</strong> atau mengetik kode QR di bawah.
                </div>
              </div>
            </div>
          )}

          {/* Form Input Barcode / Manual USB Scanner */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold">Atau Scan dengan Barcode Scanner USB / Ketik Kode:</span>
              <span className="text-[11px] font-mono text-opera-700">Database: 549 Santri</span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (kodeInput) handleScanCode(kodeInput);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={kodeInput}
                onChange={(e) => setKodeInput(e.target.value)}
                placeholder="Scan barcode USB / ketik SH0001, SH0160..."
                className="flex-1 px-4 py-3 text-sm rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-mono"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-opera-850 hover:bg-opera-900 text-gold-300 text-sm font-bold shadow border border-gold-500/40 transition-colors"
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

      {/* ========================================================================= */}
      {/* TAMPILAN 2: MODAL DETAIL KUOTA SAAT QR TERPINDAI */}
      {/* ========================================================================= */}
      {activeItem && !checkinResult && (
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-opera-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-gradient-to-r from-opera-950 to-opera-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-gold-500/30">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-gold-400 animate-ping"></span>
              <span className="text-xs font-serif font-bold tracking-wider text-gold-300">
                ✓ QR BERHASIL DIPINDAI
              </span>
            </div>
            <span className="text-xs text-opera-200 font-mono">ID: {activeItem.kuota.kodeQr}</span>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wide">
                {activeItem.tipe === 'KELUARGA' ? 'SOHIBUL HAJAT' : 'TAMU UNDANGAN'}
              </div>
              <h2 className="text-xl font-serif font-black text-slate-900 mt-0.5">
                {activeItem.santri?.nama || activeItem.entitas.nama}
              </h2>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {activeItem.santri
                  ? `${activeItem.santri.subKategori} · Kamar: ${
                      activeItem.santri.kamar || '-'
                    } · Wali: ${activeItem.entitas.namaWali}`
                  : activeItem.entitas.kategori}
              </p>
            </div>

            {/* Kotak Indikator Kuota */}
            {(() => {
              const totalKuota = activeItem.kuota.kuotaDasar + activeItem.kuota.kuotaTambahan;
              const terpakai = activeItem.kuota.terpakai;
              const sisa = Math.max(0, totalKuota - terpakai);
              return (
                <div className="grid grid-cols-3 gap-2 text-center bg-opera-50/40 p-3.5 rounded-2xl border border-opera-200">
                  <div className="border-r border-opera-200">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">KUOTA</div>
                    <div className="text-2xl font-serif font-black text-slate-800 mt-0.5">
                      {totalKuota}
                    </div>
                    {activeItem.kuota.kuotaTambahan > 0 && (
                      <div className="text-[10px] text-amber-600 font-medium">
                        +{activeItem.kuota.kuotaTambahan} Beli
                      </div>
                    )}
                  </div>
                  <div className="border-r border-opera-200">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">TERPAKAI</div>
                    <div className="text-2xl font-serif font-black text-slate-800 mt-0.5">
                      {terpakai}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">SISA</div>
                    <div
                      className={`text-2xl font-serif font-black mt-0.5 ${
                        sisa > 0 ? 'text-opera-800' : 'text-rose-600'
                      }`}
                    >
                      {sisa}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Checklist Tiket Panggung Indicator untuk Bil Ghoib */}
            {activeItem.kuota.tiketPanggungJatah > 0 && (
              <div className="space-y-2">
                {activeItem.kuota.tiketPanggungDiberi >= activeItem.kuota.tiketPanggungJatah ? (
                  /* Status jika sudah diserahkan pada scan sebelumnya */
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-xs text-emerald-950 flex items-center justify-between shadow-xs">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold flex items-center space-x-1">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Tiket Emas Panggung (Wali Perempuan)</span>
                        </div>
                        <div className="text-[11px] text-emerald-700 font-medium">
                          Status: <strong>SUDAH DIBERIKAN</strong> pada pemindaian sebelumnya
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                      Sudah Diterima
                    </span>
                  </div>
                ) : (
                  /* Checklist interaktif untuk mengetahui & menentukan apakah tiket emas diserahkan sekarang */
                  <div
                    onClick={() => setSerahkanTiketEmas(!serahkanTiketEmas)}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer select-none shadow-xs ${
                      serahkanTiketEmas
                        ? 'bg-gradient-to-r from-amber-50 to-[#FCF3E4] border-[#D49B5B] ring-2 ring-[#D49B5B]/30'
                        : 'bg-slate-50 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="checklist-tiket-emas"
                        checked={serahkanTiketEmas}
                        onChange={(e) => setSerahkanTiketEmas(e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5 w-5 h-5 rounded-md text-[#8C6A47] border-2 border-[#D49B5B] focus:ring-[#8C6A47] cursor-pointer accent-[#8C6A47]"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <label
                            htmlFor="checklist-tiket-emas"
                            className="font-serif font-black text-xs sm:text-sm text-[#422F21] flex items-center space-x-1.5 cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4 text-[#D49B5B]" />
                            <span>Checklist Tiket Emas Panggung (Ibu)</span>
                          </label>
                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              serahkanTiketEmas
                                ? 'bg-[#8C6A47] text-white shadow-xs'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {serahkanTiketEmas ? '✓ Diserahkan Sekarang' : '✕ Belum Diserahkan'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7A624E] mt-1 leading-relaxed">
                          {serahkanTiketEmas
                            ? 'Tiket Emas Panggung DIBERIKAN pada absensi ini untuk Ibu Santriwati Bil Ghoib.'
                            : 'Tiket Emas Panggung BELUM DIBERIKAN (disimpan panitia / diserahkan menyusul).'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Riwayat Kedatangan Bertahap */}
            {activeItem.kuota.terpakai > 0 && (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Kedatangan Bertahap:</span>
                </div>
                <div className="text-[11px] text-amber-800">
                  Sudah masuk {activeItem.kuota.terpakai} orang pada pemindaian sebelumnya.
                </div>
              </div>
            )}

            {/* Stepper Masukkan yang Hadir Sekarang */}
            <div className="pt-2 border-t border-slate-100 space-y-4">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wide text-center">
                ── MASUKKAN YANG HADIR SEKARANG ──
              </div>

              {/* Laki-laki */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-sm font-bold text-slate-800">Wali Laki-laki</div>
                  <div className="text-xs text-slate-500">Arahkan ke Zona Laki-laki</div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setJumlahL(Math.max(0, jumlahL - 1))}
                    className="w-10 h-10 rounded-xl bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-xl font-black text-slate-900">{jumlahL}</span>
                  <button
                    type="button"
                    onClick={() => setJumlahL(jumlahL + 1)}
                    className="w-10 h-10 rounded-xl bg-blue-700 text-white font-bold hover:bg-blue-800"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Perempuan */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-sm font-bold text-slate-800">Wali Perempuan</div>
                  <div className="text-xs text-slate-500">Arahkan ke Zona Perempuan</div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setJumlahP(Math.max(0, jumlahP - 1))}
                    className="w-10 h-10 rounded-xl bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-xl font-black text-slate-900">{jumlahP}</span>
                  <button
                    type="button"
                    onClick={() => setJumlahP(jumlahP + 1)}
                    className="w-10 h-10 rounded-xl bg-opera-850 text-gold-300 font-bold hover:bg-opera-900"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Balita (Opsional) */}
              <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-slate-50 text-xs">
                <span className="text-slate-500">Anak Balita (Tidak memakai kuota):</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setJumlahBalita(Math.max(0, jumlahBalita - 1))}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-bold text-slate-600"
                  >
                    −
                  </button>
                  <span className="w-5 text-center font-bold text-slate-700">{jumlahBalita}</span>
                  <button
                    type="button"
                    onClick={() => setJumlahBalita(jumlahBalita + 1)}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-bold text-slate-600"
                  >
                    +
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleResetForNext}
                  className="px-4 py-3 rounded-2xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCheckin}
                  className="flex-1 py-3 rounded-2xl bg-opera-850 hover:bg-opera-900 text-gold-300 text-sm font-serif font-black shadow-lg border border-gold-500/40 flex items-center justify-center space-x-2"
                >
                  <span>
                    {serahkanTiketEmas
                      ? 'KONFIRMASI & SERAHKAN (+ 1 TIKET EMAS)'
                      : 'KONFIRMASI & SERAHKAN TIKET'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAMPILAN 3: LAYAR HASIL CHECK-IN SELESAI (§11.1) */}
      {/* ========================================================================= */}
      {checkinResult && (
        <div className="bg-white rounded-3xl shadow-2xl border-4 border-opera-800 overflow-hidden animate-in fade-in zoom-in-95">
          <div className="bg-gradient-to-r from-opera-950 via-opera-900 to-opera-950 text-white p-5 text-center border-b border-gold-500/40">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-gold-500 text-opera-950 text-xs font-bold uppercase tracking-wider">
              <Check className="w-4 h-4 text-opera-950" />
              <span>CHECK-IN BERHASIL</span>
            </div>
            <h2 className="text-xl font-serif font-black text-white mt-1.5">
              {checkinResult.namaSantri}
            </h2>
            <div className="text-xs text-opera-200">
              {checkinResult.kelas} · {checkinResult.kategori}
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Box Instruksi Tiket Fisik */}
            <div className="p-5 rounded-3xl bg-opera-950 text-white shadow-inner space-y-3 border border-gold-500/30">
              <div className="text-xs font-serif font-bold text-gold-400 tracking-wider uppercase text-center flex items-center justify-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-gold-400" />
                <span>SERAHKAN TIKET KERTAS SEKARANG:</span>
              </div>

              {/* Tiket Reguler */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-opera-900 border border-gold-500/40">
                <div className="flex items-center space-x-3">
                  <span
                    className={`w-5 h-5 rounded-full ${
                      checkinResult.warnaTiket === 'Biru'
                        ? 'bg-blue-400'
                        : checkinResult.warnaTiket === 'Kuning'
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                  ></span>
                  <div>
                    <span className="font-serif font-black text-lg text-white">
                      TIKET {checkinResult.warnaTiket?.toUpperCase()} (REGULER)
                    </span>
                    <div className="text-[11px] text-opera-200">
                      Sesuai kategori {checkinResult.kategori}
                    </div>
                  </div>
                </div>
                <span className="text-3xl font-serif font-black text-gold-400">
                  {checkinResult.masukSekarang} ×
                </span>
              </div>

              {/* Tiket Panggung Emas jika Bil Ghoib */}
              {checkinResult.tiketPanggung ? (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-gold-600/30 to-amber-600/30 border border-gold-400">
                  <div className="flex items-center space-x-3">
                    <Sparkles className="w-5 h-5 text-gold-300" />
                    <div>
                      <span className="font-serif font-black text-base text-gold-300">
                        + 1 TIKET EMAS PANGGUNG ★
                      </span>
                      <div className="text-[10px] text-gold-200">
                        Khusus Wali Perempuan (Ibu Kandung) Bil Ghoib · Diserahkan Sekarang
                      </div>
                    </div>
                  </div>
                  <span className="text-2xl font-serif font-black text-gold-300">1 ×</span>
                </div>
              ) : activeItem?.kuota.tiketPanggungJatah > 0 ? (
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-xs">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="font-bold text-slate-200">
                        Tiket Emas Panggung:{' '}
                        {activeItem.kuota.tiketPanggungDiberi >= activeItem.kuota.tiketPanggungJatah
                          ? 'Sudah Diberikan Sebelumnya'
                          : 'Belum Diserahkan (Tertunda)'}
                      </span>
                      <div className="text-[10px] text-slate-400">
                        {activeItem.kuota.tiketPanggungDiberi >= activeItem.kuota.tiketPanggungJatah
                          ? 'Telah diserahkan pada scan sebelumnya'
                          : 'Dapat diserahkan menyusul saat wali perempuan hadir'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-amber-300 px-2 py-0.5 rounded-full bg-slate-800 border border-amber-500/30">
                    {activeItem.kuota.tiketPanggungDiberi >= activeItem.kuota.tiketPanggungJatah
                      ? '✓ Sudah'
                      : 'Tertunda'}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Arahan ke Zona Duduk */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                ARAHKAN ROMBONGAN KE ZONA:
              </div>
              <div className="space-y-1.5 text-xs font-semibold">
                {checkinResult.zonaLaki && checkinResult.zonaLaki > 0 ? (
                  <div className="flex items-center space-x-2 text-blue-900 bg-blue-50 p-2.5 rounded-xl border border-blue-200">
                    <ChevronRight className="w-4 h-4 text-blue-600" />
                    <span>
                      → <strong>{checkinResult.zonaLaki} Orang</strong> ke <strong>Zona Laki-laki</strong>
                    </span>
                  </div>
                ) : null}

                {checkinResult.zonaPerempuan && checkinResult.zonaPerempuan > 0 ? (
                  <div className="flex items-center space-x-2 text-pink-900 bg-pink-50 p-2.5 rounded-xl border border-pink-200">
                    <ChevronRight className="w-4 h-4 text-pink-600" />
                    <span>
                      → <strong>{checkinResult.zonaPerempuan} Orang</strong> ke <strong>Zona Perempuan</strong>
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Rekap Kuota Akhir */}
            <div className="text-xs text-slate-600 bg-slate-100 p-3 rounded-2xl flex items-center justify-between font-medium">
              <div>
                Masuk Sekarang: <strong>{checkinResult.masukSekarang} Orang</strong>
              </div>
              <div>
                Terpakai: <strong>{checkinResult.terpakai}</strong> dari {checkinResult.kuotaTotal}
              </div>
              <div>
                Sisa Kuota: <strong className="text-opera-800">{checkinResult.sisa}</strong>
              </div>
            </div>

            {/* Tombol Selesai yang Otomatis Menyalakan Kamera Kembali */}
            <button
              onClick={handleResetForNext}
              className="w-full py-4 rounded-2xl bg-opera-850 hover:bg-opera-900 text-gold-300 font-serif font-black text-sm shadow-xl border border-gold-500/40 flex items-center justify-center space-x-2 transition-all group"
            >
              <RotateCcw className="w-4 h-4 group-hover:-rotate-45 transition-transform" />
              <span>[ SELESAI — PINDAI TAMU BERIKUTNYA DENGAN KAMERA ]</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal Denah Interaktif untuk Petugas */}
      <DenahModal
        isOpen={isDenahOpen}
        onClose={() => setIsDenahOpen(false)}
        initialLocationId="gerbang_bola_dunia"
      />
    </div>
  );
}
