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
import { supabase } from '@/lib/supabase';
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
  const [buzzerTested, setBuzzerTested] = useState(false);

  // Camera scanner state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isInitializing, setIsInitializing] = useState(false);

  const scannerRef = useRef<any>(null);
  const isScanningRef = useRef(false);

  // Audio synthesizer beep saat scan QR berhasil dideteksi
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(784, ctx.currentTime); // G5
      osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.12); // C6

      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch (e) {
      // Audio safety
    }
  };

  // Audio synthesizer buzzer error
  const playBuzzerError = () => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([280, 100, 280, 100, 350]);
      }

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const playBuzzPulse = (delaySec: number, durationSec: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(175, ctx.currentTime + delaySec);
        osc.frequency.linearRampToValueAtTime(115, ctx.currentTime + delaySec + durationSec);

        gain.gain.setValueAtTime(0.85, ctx.currentTime + delaySec);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delaySec + durationSec);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + delaySec);
        osc.stop(ctx.currentTime + delaySec + durationSec);
      };

      playBuzzPulse(0, 0.22);
      playBuzzPulse(0.26, 0.32);
    } catch (e) {
      // Audio safety
    }
  };

  // Suara konfirmasi sukses merdu
  const playSuccessChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const playTone = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.35, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur);
      };

      playTone(523.25, 0, 0.12);     // C5
      playTone(659.25, 0.1, 0.12);    // E5
      playTone(783.99, 0.2, 0.25);    // G5
    } catch (e) {}
  };

  const handleTestBuzzer = () => {
    playBuzzerError();
    setBuzzerTested(true);
    setTimeout(() => setBuzzerTested(false), 3500);
  };

  const inputRef = useRef<HTMLInputElement>(null);
  const scanBufferRef = useRef('');
  const scanTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handler memproses kode QR (100% Query Langsung ke Supabasepeserta_santri & tamu_undangan)
  const handleScanCode = useCallback(async (scannedRaw: string) => {
    setErrorMsg(null);
    setCheckinResult(null);

    let cleanCode = scannedRaw.trim();
    // Tangani jika format QR adalah URL web (e.g. https://domain.com/u/SH0001)
    if (cleanCode.includes('/u/')) {
      const parts = cleanCode.split('/u/');
      if (parts.length >= 2) cleanCode = parts[1].split('?')[0].split('#')[0];
    } else if (cleanCode.includes('.')) {
      const parts = cleanCode.split('.');
      if (parts.length >= 2) cleanCode = parts[1];
    }

    cleanCode = cleanCode.toUpperCase().trim();

    try {
      // 1. Cek Peserta Santri (cocokkan dengan kolom 'kode' ATAU 'nis')
      let { data: santri, error: santriErr } = await supabase
        .from('peserta_santri')
        .select('*')
        .or(`kode.eq.${cleanCode},nis.eq.${cleanCode}`)
        .maybeSingle();

      // 2. Jika tidak ada di santri, cek ke Tamu Undangan
      let tamu = null;
      if (!santri) {
        const resTamu = await supabase
          .from('tamu_undangan')
          .select('*')
          .eq('kode', cleanCode)
          .maybeSingle();
        tamu = resTamu.data;
      }

      // 3. Jika kode tidak terdaftar di Supabase
      if (!santri && !tamu) {
        setErrorMsg(`Kode QR "${cleanCode}" TIDAK TERDAFTAR dalam basis data!`);
        playBuzzerError();
        setActiveItem(null);
        return;
      }

      const isSantri = !!santri;
      const entity = santri || tamu;
      const kuotaDasar = Number(entity.kuota_dasar || 2);
      const kuotaTambahan = Number(entity.kuota_tambahan || 0);
      const terpakai = Number(entity.kuota_terpakai || 0);
      const totalKuota = kuotaDasar + kuotaTambahan;
      const sisa = Math.max(0, totalKuota - terpakai);

      const itemObj = {
        id: entity.id,
        kode: entity.kode || entity.nis || cleanCode,
        tipe: isSantri ? 'KELUARGA' : 'UNDANGAN',
        nama: entity.nama,
        namaWali: isSantri ? (entity.nama_wali || '-') : (entity.instansi || entity.alamat || '-'),
        kategori: isSantri ? (entity.kategori_utama || 'BIL_GHOIB') : (entity.kategori || 'Tamu Undangan'),
        subKategori: entity.sub_kategori || 'Bil Ghoib',
        kelas: entity.kelas || '-',
        kamar: entity.kamar || '-',
        alamat: entity.alamat || 'Kediri',
        noHp: entity.no_hp || '-',
        santri: isSantri
          ? [
              {
                nama: entity.nama,
                kategoriUtama: entity.kategori_utama || 'BIL_GHOIB',
                subKategori: entity.sub_kategori || 'Bil Ghoib',
                kelas: entity.kelas || '-',
                kamar: entity.kamar || '-',
              },
            ]
          : null,
        entitas: {
          nama: entity.nama,
          namaWali: entity.nama_wali || entity.instansi || '-',
          kategori: entity.kategori || entity.kategori_utama || 'Tamu',
        },
        kuota: {
          id: entity.id,
          kodeQr: entity.kode || cleanCode,
          kuotaDasar,
          kuotaTambahan,
          terpakai,
          tiketPanggungJatah: Number(entity.tiket_panggung_jatah || 0),
          tiketPanggungDiberi: Number(entity.tiket_panggung_diberi || 0),
        },
      };

      if (sisa <= 0) {
        playBuzzerError();
        setErrorMsg(
          `PERINGATAN KUOTA HABIS: Seluruh tiket untuk "${itemObj.nama}" sudah terpakai (${terpakai}/${totalKuota})!`
        );
      } else {
        playBeep();
      }

      setActiveItem(itemObj);
      setKodeInput(cleanCode);

      // Stop kamera saat item diproses
      stopCamera();

      if (sisa > 0) {
        setJumlahL(1);
        setJumlahP(Math.min(1, sisa - 1));
      } else {
        setJumlahL(0);
        setJumlahP(0);
      }
      setJumlahBalita(0);

      if (itemObj.kuota.tiketPanggungJatah > 0) {
        const belumDiberi = itemObj.kuota.tiketPanggungDiberi < itemObj.kuota.tiketPanggungJatah;
        setSerahkanTiketEmas(belumDiberi);
      } else {
        setSerahkanTiketEmas(false);
      }
    } catch (err: any) {
      console.error('Error during scan verification:', err);
      setErrorMsg(`Terjadi kesalahan sistem saat memverifikasi kode: ${err.message || err}`);
      playBuzzerError();
    }
  }, []);

  // Global USB Barcode Scanner Listener
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();

    const handleKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

      if (e.ctrlKey || e.altKey || e.metaKey) return;

      if (e.key === 'Enter') {
        if (scanBufferRef.current.length >= 3) {
          handleScanCode(scanBufferRef.current);
        }
        scanBufferRef.current = '';
        if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
        e.preventDefault();
        return;
      }

      if (e.key.length === 1) {
        scanBufferRef.current += e.key;
        if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
        scanTimerRef.current = setTimeout(() => {
          scanBufferRef.current = '';
        }, 100);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    };
  }, [handleScanCode]);

  // Inisialisasi & Start Kamera
  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    if (typeof window === 'undefined') return;
    setIsInitializing(true);
    setCameraError(null);

    try {
      if (scannerRef.current && isScanningRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch (e) {}
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
        () => {}
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

  useEffect(() => {
    if (!activeItem && !checkinResult) {
      startCamera(facingMode);
    }

    return () => {
      stopCamera();
    };
  }, [activeItem, checkinResult]);

  // Handler Konfirmasi Checkin (Update Kuota & Simpan Log ke Tabel 'presensi_log' Supabase)
  const handleConfirmCheckin = async () => {
    if (!activeItem) return;
    setErrorMsg(null);

    const inputTotal = jumlahL + jumlahP;
    const totalKuota = activeItem.kuota.kuotaDasar + activeItem.kuota.kuotaTambahan;
    const sisa = Math.max(0, totalKuota - activeItem.kuota.terpakai);

    if (inputTotal <= 0 && !serahkanTiketEmas) {
      setErrorMsg('Masukkan jumlah orang yang hadir (L/P) atau serahkan tiket panggung.');
      return;
    }

    if (inputTotal > sisa) {
      setErrorMsg(`Jumlah kehadiran (${inputTotal}) melebihi sisa kuota yang tersedia (${sisa})!`);
      playBuzzerError();
      return;
    }

    const nextTerpakai = activeItem.kuota.terpakai + inputTotal;
    const nextTiketPanggung = activeItem.kuota.tiketPanggungDiberi + (serahkanTiketEmas ? 1 : 0);

    try {
      // 1. Update kuota_terpakai di Supabase DB (peserta_santri atau tamu_undangan)
      if (activeItem.tipe === 'KELUARGA') {
        const { error: updateErr } = await supabase
          .from('peserta_santri')
          .update({
            kuota_terpakai: nextTerpakai,
            tiket_panggung_diberi: nextTiketPanggung,
          })
          .eq('id', activeItem.id);

        if (updateErr) {
          setErrorMsg(`Gagal memperbarui kuota santri di Supabase DB: ${updateErr.message}`);
          return;
        }
      } else {
        const { error: updateErr } = await supabase
          .from('tamu_undangan')
          .update({
            kuota_terpakai: nextTerpakai,
          })
          .eq('id', activeItem.id);

        if (updateErr) {
          setErrorMsg(`Gagal memperbarui kuota tamu di Supabase DB: ${updateErr.message}`);
          return;
        }
      }

      // 2. Insert riwayat presensi ke tabel 'presensi_log' di Supabase
      const { error: logErr } = await supabase
        .from('presensi_log')
        .insert([
          {
            kuota_id: activeItem.id,
            hasil: 'SUKSES',
            jumlah_l: jumlahL,
            jumlah_p: jumlahP,
            jumlah_balita: jumlahBalita,
            jalur: jalur,
            panitia_id: jalur === 'BARAT' ? 'panitia-putra' : 'panitia-putri',
            catatan: `${activeItem.nama} (${activeItem.kode}) - ${jalur}`,
            server_time: new Date().toISOString(),
          },
        ]);

      if (logErr) {
        console.warn('Presensi log insert note:', logErr.message);
      }

      playSuccessChime();

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#F5C26B', '#4A7BB0', '#F4EFE6', '#ffffff'],
      });

      const updatedItem = {
        ...activeItem,
        kuota: {
          ...activeItem.kuota,
          terpakai: nextTerpakai,
          tiketPanggungDiberi: nextTiketPanggung,
        },
      };

      setCheckinResult({
        ok: true,
        pesan: `Presensi berhasil dicatat! Total masuk: ${inputTotal} orang (L:${jumlahL}, P:${jumlahP}).`,
        sisa: Math.max(0, totalKuota - nextTerpakai),
        detail: updatedItem,
      });

      setActiveItem(updatedItem);
    } catch (e: any) {
      console.error('Error during checkin confirmation:', e);
      setErrorMsg(`Gagal memproses presensi: ${e.message || e}`);
    }
  };

  // Handler Reset untuk Tamu Berikutnya
  const handleResetForNext = () => {
    setActiveItem(null);
    setCheckinResult(null);
    setErrorMsg(null);
    setKodeInput('');
    setJumlahL(0);
    setJumlahP(0);
    setJumlahBalita(0);
    setSerahkanTiketEmas(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-20">
      {/* Header Jalur Pemeriksaan */}
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
              <p className="text-xs text-[#7A624E] font-medium">PWA Scanner &amp; Penyerahan Tiket</p>
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
                type="button"
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
                type="button"
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
                    type="button"
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
                    type="button"
                    onClick={stopCamera}
                    title="Matikan Kamera"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition-colors"
                  >
                    <CameraOff className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="px-3 py-1.5 rounded-xl bg-opera-850 hover:bg-opera-900 text-gold-300 text-xs font-bold border border-gold-500/40 flex items-center space-x-1 shadow-sm"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Nyalakan Kamera</span>
                </button>
              )}
            </div>
          </div>

          {/* FRAME KAMERA LIVE */}
          <div className="relative rounded-3xl overflow-hidden bg-opera-950 border-2 border-opera-800 shadow-inner flex flex-col items-center justify-center min-h-[300px]">
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
              className="w-full h-full max-w-[420px] aspect-square rounded-2xl overflow-hidden [&_video]:rounded-2xl [&_video]:object-cover"
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
                    Arahkan kamera ke QR Code undangan (contoh: SH2943).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
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

          {/* Form Input Barcode / Manual USB Scanner */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                Scanner USB / Input Kode Manual:
              </span>
              <span className="text-[11px] font-mono text-opera-700">Verifikasi Supabase Direct</span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (kodeInput) handleScanCode(kodeInput);
              }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={kodeInput}
                onChange={(e) => setKodeInput(e.target.value)}
                placeholder="Scanner USB / ketik kode (contoh: SH2943)..."
                autoFocus
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

      {/* ========================================================================= */}
      {/* TAMPILAN 2: DETAIL PESERTA DARI SUPABASE SAAT QR TERPINDAI */}
      {/* ========================================================================= */}
      {activeItem && !checkinResult && (
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-opera-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-gradient-to-r from-opera-950 to-opera-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-gold-500/30">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-gold-400 animate-ping"></span>
              <span className="text-xs font-serif font-bold tracking-wider text-gold-300">
                ✓ QR SUPABASE TERVERIFIKASI
              </span>
            </div>
            <span className="text-xs text-opera-200 font-mono">KODE: {activeItem.kode}</span>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wide">
                {activeItem.tipe === 'KELUARGA' ? 'SOHIBUL HAJAT (SANTRI)' : 'TAMU UNDANGAN'}
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-black text-slate-900 mt-0.5">
                {activeItem.nama}
              </h2>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {activeItem.tipe === 'KELUARGA'
                  ? `${activeItem.subKategori} · Kelas: ${activeItem.kelas} · Wali: ${activeItem.namaWali} (${activeItem.alamat})`
                  : `${activeItem.kategori} · Instansi/Alamat: ${activeItem.namaWali}`}
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
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Input Form Jumlah Kehadiran (L / P) */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    JUMLAH PRIA (L)
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setJumlahL(Math.max(0, jumlahL - 1))}
                      className="w-8 h-8 rounded-xl bg-white border border-slate-300 font-black text-sm text-slate-700 shadow-xs cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={jumlahL}
                      onChange={(e) => setJumlahL(parseInt(e.target.value, 10) || 0)}
                      className="w-full text-center font-bold text-base bg-white border border-slate-300 rounded-xl py-1"
                    />
                    <button
                      type="button"
                      onClick={() => setJumlahL(jumlahL + 1)}
                      className="w-8 h-8 rounded-xl bg-white border border-slate-300 font-black text-sm text-slate-700 shadow-xs cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    JUMLAH WANITA (P)
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setJumlahP(Math.max(0, jumlahP - 1))}
                      className="w-8 h-8 rounded-xl bg-white border border-slate-300 font-black text-sm text-slate-700 shadow-xs cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={jumlahP}
                      onChange={(e) => setJumlahP(parseInt(e.target.value, 10) || 0)}
                      className="w-full text-center font-bold text-base bg-white border border-slate-300 rounded-xl py-1"
                    />
                    <button
                      type="button"
                      onClick={() => setJumlahP(jumlahP + 1)}
                      className="w-8 h-8 rounded-xl bg-white border border-slate-300 font-black text-sm text-slate-700 shadow-xs cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={handleResetForNext}
                  className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCheckin}
                  className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-800 hover:brightness-105 text-white font-serif font-black text-sm shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <Check className="w-5 h-5 text-emerald-200" />
                  <span>Konfirmasi Presensi / Masuk</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAMPILAN 3: HASIL PRESENSI SUKSES */}
      {/* ========================================================================= */}
      {checkinResult && checkinResult.ok && (
        <div className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-emerald-500 text-center space-y-4 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto font-bold border-2 border-emerald-300">
            <Check className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-xl font-serif font-black text-emerald-950">
              PRESENSI BERHASIL DICATAT!
            </h2>
            <p className="text-xs text-emerald-800 mt-1">{checkinResult.pesan}</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1 text-left">
            <p><strong>Nama:</strong> {checkinResult.detail?.nama}</p>
            <p><strong>Kode:</strong> {checkinResult.detail?.kode}</p>
            <p><strong>Jalur Gerbang:</strong> {jalur === 'BARAT' ? 'Jalur Barat (Putra)' : 'Jalur Timur (Putri)'}</p>
            <p><strong>Sisa Kuota:</strong> {checkinResult.sisa} Kursi</p>
          </div>

          <button
            type="button"
            onClick={handleResetForNext}
            className="w-full py-3.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-serif font-black text-sm shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Scan Kode QR Berikutnya</span>
          </button>
        </div>
      )}

      {/* DENAH MODAL */}
      {isDenahOpen && (
        <DenahModal isOpen={isDenahOpen} onClose={() => setIsDenahOpen(false)} />
      )}
    </div>
  );
}
