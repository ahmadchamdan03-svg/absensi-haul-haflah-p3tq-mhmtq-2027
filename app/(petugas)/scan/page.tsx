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
import { logAudit } from '@/lib/audit-log';
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
  const [kartuHitamGoldDiberi, setKartuHitamGoldDiberi] = useState(false);

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
      const targetKode = entity.kode || entity.nis || cleanCode;

      // Single Source of Truth: Fetch live terpakai from presensi_log
      const { data: presensiLogs } = await supabase
        .from('presensi_log')
        .select('jumlah_l, jumlah_p')
        .eq('kode_qr', targetKode);

      const terpakai = (presensiLogs || []).reduce(
        (sum, r) => sum + Number(r.jumlah_l || 0) + Number(r.jumlah_p || 0),
        0
      );

      const kuotaDasar = isSantri
        ? Number(entity.kuota_dasar || 2)
        : ((entity.nama_putra && String(entity.nama_putra).trim() !== '') ? 1 : 0) +
          ((entity.nama_putri && String(entity.nama_putri).trim() !== '') ? 1 : 0);
      const kuotaTambahan = isSantri ? Number(entity.kuota_tambahan || 0) : 0;
      const totalKuota = kuotaDasar + kuotaTambahan;

      if (!isSantri) {
        console.log('[Kuota Tamu]', {
          kode: targetKode,
          nama_putra: entity.nama_putra,
          nama_putri: entity.nama_putri,
          kuota: kuotaDasar,
        });
      }
      const sisa = Math.max(0, totalKuota - terpakai);

      const isBilGhoib = isSantri && (
        (entity.kategori_utama || '').toUpperCase().includes('BIL_GHOIB') ||
        (entity.kategori_utama || '').toUpperCase().includes('GHOIB') ||
        (entity.sub_kategori || '').toUpperCase().includes('GHOIB')
      );
      const isAlreadyGiven = Number(entity.tiket_panggung_diberi || 0) > 0;
      setKartuHitamGoldDiberi(isAlreadyGiven || sisa === 0);
      setSerahkanTiketEmas(isAlreadyGiven || sisa === 0);

      const itemObj = {
        id: entity.id,
        kode: targetKode,
        tipe: isSantri ? 'KELUARGA' : 'UNDANGAN',
        nama: entity.nama,
        namaWali: isSantri ? (entity.nama_wali || '-') : (entity.instansi || entity.alamat || '-'),
        kategori: isSantri ? (entity.kategori_utama || 'BIL_GHOIB') : (entity.kategori || 'Tamu Undangan'),
        subKategori: entity.sub_kategori || 'Bil Ghoib',
        kelas: entity.kelas || '-',
        kamar: entity.kamar || '-',
        alamat: entity.alamat || 'Kediri',
        noHp: entity.no_hp || '-',
        isBilGhoib,
        kartuHitamGoldDiberi: isAlreadyGiven,
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
          kodeQr: targetKode,
          kuotaDasar,
          kuotaTambahan,
          terpakai,
          tiketPanggungJatah: isBilGhoib ? 1 : 0,
          tiketPanggungDiberi: Number(entity.tiket_panggung_diberi || 0),
        },
      };

      if (terpakai >= totalKuota) {
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

      if (isBilGhoib) {
        setSerahkanTiketEmas(!isAlreadyGiven);
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

    const isAlreadyGiven = activeItem.isBilGhoib && (Number(activeItem.kuota?.tiketPanggungDiberi || 0) > 0 || Boolean(activeItem.kartuHitamGoldDiberi));
    const isNewlyGivingGold = activeItem.isBilGhoib && !isAlreadyGiven && (kartuHitamGoldDiberi || serahkanTiketEmas);
    const nextTiketPanggung = activeItem.isBilGhoib
      ? (isAlreadyGiven ? Number(activeItem.kuota?.tiketPanggungDiberi || 1) : (isNewlyGivingGold ? 1 : 0))
      : 0;

    if (inputTotal <= 0 && !isNewlyGivingGold) {
      setErrorMsg('Masukkan jumlah orang yang hadir (L/P) atau centang Kartu Hitam Gold.');
      return;
    }

    try {
      // 1. Fetch live existing terpakai from presensi_log BEFORE input
      const { data: existingLogs } = await supabase
        .from('presensi_log')
        .select('jumlah_l, jumlah_p')
        .eq('kode_qr', activeItem.kode);

      const totalExisting = (existingLogs || []).reduce(
        (sum, r) => sum + Number(r.jumlah_l || 0) + Number(r.jumlah_p || 0),
        0
      );

      const totalKuota = activeItem.kuota.kuotaDasar + activeItem.kuota.kuotaTambahan;
      const sisa = Math.max(0, totalKuota - totalExisting);

      if (inputTotal > sisa) {
        setErrorMsg(`Gagal simpan presensi: Total input (${inputTotal} orang) melebihi sisa kuota (${sisa} orang)! Mohon kurangi jumlahnya.`);
        playBuzzerError();
        return;
      }

      // 2. Insert riwayat presensi ke tabel 'presensi_log' di Supabase
      const { error: logErr } = await supabase
        .from('presensi_log')
        .insert([
          {
            kode_qr: activeItem.kode || String(activeItem.id),
            nama_peserta: activeItem.nama || activeItem.namaSantri || 'Peserta',
            tipe_peserta: activeItem.tipe === 'KELUARGA' ? 'KELUARGA' : 'UNDANGAN',
            jalur: jalur,
            panitia_id: jalur === 'BARAT' ? 'panitia-putra' : 'panitia-putri',
            jumlah_l: jumlahL,
            jumlah_p: jumlahP,
            jumlah_balita: jumlahBalita,
            tiket_panggung: isNewlyGivingGold ? '1' : '0',
            catatan: `Scan Pintu ${jalur}`,
            created_at: new Date().toISOString(),
          },
        ]);

      if (logErr) {
        setErrorMsg(`Gagal mencatat presensi di Supabase: ${logErr.message}`);
        playBuzzerError();
        return;
      }

      // 3. Sync kuota_terpakai cache in database
      const { data: presensiAll } = await supabase
        .from('presensi_log')
        .select('jumlah_l, jumlah_p')
        .eq('kode_qr', activeItem.kode);

      const totalTerpakai = (presensiAll || []).reduce(
        (sum, r) => sum + Number(r.jumlah_l || 0) + Number(r.jumlah_p || 0),
        0
      );

      if (activeItem.tipe === 'KELUARGA') {
        await supabase
          .from('peserta_santri')
          .update({
            kuota_terpakai: totalTerpakai,
            tiket_panggung_diberi: nextTiketPanggung,
          })
          .eq('id', activeItem.id);
      } else {
        await supabase
          .from('tamu_undangan')
          .update({
            kuota_terpakai: totalTerpakai,
          })
          .eq('id', activeItem.id);
      }

      await logAudit({
        panitia_id: jalur === 'BARAT' ? 'PETUGAS_PUTRA' : 'PETUGAS_PUTRI',
        panitia_role: 'PENJAGA_GERBANG',
        aksi: 'TANDAI_HADIR',
        tabel: activeItem.tipe === 'KELUARGA' ? 'peserta_santri' : 'tamu_undangan',
        kode: activeItem.kode || String(activeItem.id),
        nama: activeItem.nama || activeItem.namaSantri || 'Peserta',
        field: 'kuota_terpakai',
        nilai_lama: String(totalExisting),
        nilai_baru: String(totalTerpakai),
        detail: {
          jumlah_l: jumlahL,
          jumlah_p: jumlahP,
          jumlah_balita: jumlahBalita,
          jalur,
          tiket_panggung: isNewlyGivingGold,
        },
        catatan: `Scan Presensi Pintu ${jalur} (${jumlahL} L / ${jumlahP} P)`,
      });

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
          terpakai: totalTerpakai,
          tiketPanggungDiberi: nextTiketPanggung,
        },
      };

      setCheckinResult({
        ok: true,
        pesan: `Presensi berhasil dicatat! Total masuk: ${inputTotal} orang (L:${jumlahL}, P:${jumlahP}).`,
        sisa: Math.max(0, totalKuota - totalTerpakai),
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
    setKartuHitamGoldDiberi(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-20">
      {/* Header Jalur Pemeriksaan */}
      <div className="bg-[#FAF7F3] rounded-3xl p-3.5 sm:p-4 shadow-sm border-2 border-[#D5C4B4] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Baris 1 (Mobile) / Sisi Kiri (Desktop): Info Gerbang & Tombol Denah */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
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
            onClick={() => setIsDenahOpen(true)}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white hover:bg-[#FAF7F3] text-[#5C3E28] text-xs font-bold border border-[#D5C4B4] flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
            title="Buka Denah Lapangan Interaktif"
          >
            <Compass className="w-4 h-4 text-[#8C6A47]" />
            <span className="hidden sm:inline">Denah Lokasi</span>
          </button>
        </div>

        {/* Baris 2 (Mobile) / Sisi Kanan (Desktop): Pemilih Jalur Barat vs Timur */}
        <div className="flex w-full md:w-auto bg-[#EFE8E1] p-1 rounded-xl border border-[#D5C4B4] gap-1.5">
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
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-opera-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-w-md mx-auto">
          {/* Header Compact */}
          <div className="bg-gradient-to-r from-opera-950 to-opera-900 text-white px-3.5 py-2.5 flex items-center justify-between border-b border-gold-500/30">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gold-400 animate-ping"></span>
              <span className="text-[11px] font-serif font-bold tracking-wider text-gold-300">
                ✓ QR SUPABASE TERVERIFIKASI
              </span>
            </div>
            <span className="text-[11px] text-opera-200 font-mono font-bold">KODE: {activeItem.kode}</span>
          </div>

          <div className="p-4 space-y-3">
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                {activeItem.tipe === 'KELUARGA' ? 'SOHIBUL HAJAT (SANTRI)' : 'TAMU UNDANGAN'}
              </div>
              <h2 className="text-base sm:text-lg font-serif font-black text-slate-900 leading-snug mt-0.5">
                {activeItem.nama}
              </h2>
              <p className="text-[11px] text-slate-600 font-medium leading-tight mt-0.5">
                {activeItem.tipe === 'KELUARGA'
                  ? `${activeItem.subKategori} · Kelas: ${activeItem.kelas} · Wali: ${activeItem.namaWali}`
                  : `${activeItem.kategori} · ${activeItem.namaWali}`}
              </p>
            </div>

            {/* Kotak Indikator Kuota Ringkas */}
            {(() => {
              const totalKuota = activeItem.kuota.kuotaDasar + activeItem.kuota.kuotaTambahan;
              const terpakai = activeItem.kuota.terpakai;
              const sisa = Math.max(0, totalKuota - terpakai);
              return (
                <div className="grid grid-cols-3 gap-1.5 text-center bg-stone-50 p-2.5 rounded-2xl border border-stone-200">
                  <div className="border-r border-stone-200 pr-1">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">KUOTA</div>
                    <div className="text-xl font-serif font-black text-slate-800">
                      {totalKuota}
                    </div>
                  </div>
                  <div className="border-r border-stone-200 pr-1">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">TERPAKAI</div>
                    <div className="text-xl font-serif font-black text-slate-800">
                      {terpakai}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase">SISA</div>
                    <div
                      className={`text-xl font-serif font-black ${
                        sisa > 0 ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {sisa}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Checkbox "Hitam Gold" KHUSUS BIL GHOIB (One-Time Disabled jika sudah diberikan) */}
            {activeItem.isBilGhoib && (() => {
              const isAlreadyGiven = Number(activeItem.kuota?.tiketPanggungDiberi || 0) > 0 || Boolean(activeItem.kartuHitamGoldDiberi);
              const isChecked = isAlreadyGiven || kartuHitamGoldDiberi || serahkanTiketEmas;

              return (
                <div
                  onClick={() => {
                    if (!isAlreadyGiven) {
                      const nextVal = !kartuHitamGoldDiberi;
                      setKartuHitamGoldDiberi(nextVal);
                      setSerahkanTiketEmas(nextVal);
                    }
                  }}
                  className={`p-3 rounded-2xl border-2 transition-all select-none ${
                    isAlreadyGiven
                      ? 'bg-[#1C1712] border-amber-500/80 text-amber-200 opacity-90 cursor-not-allowed'
                      : isChecked
                      ? 'bg-[#2A1D0F] border-[#D49B5B] text-amber-200 shadow-xs cursor-pointer'
                      : 'bg-[#FFFDF9] border-[#D5C4B4] hover:border-amber-500 text-[#422F21] cursor-pointer'
                  }`}
                  title={isAlreadyGiven ? 'Kartu Hitam Gold sudah diberikan — hanya 1 kuota maju panggung.' : undefined}
                >
                  <div className="flex items-start space-x-2.5">
                    <input
                      type="checkbox"
                      id="checkbox-hitam-gold"
                      checked={isChecked}
                      disabled={isAlreadyGiven}
                      onChange={(e) => {
                        if (!isAlreadyGiven) {
                          setKartuHitamGoldDiberi(e.target.checked);
                          setSerahkanTiketEmas(e.target.checked);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={`w-4 h-4 rounded text-amber-600 border-amber-400 focus:ring-amber-500 accent-amber-600 mt-0.5 ${
                        isAlreadyGiven ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="checkbox-hitam-gold"
                          className={`text-xs font-bold leading-tight flex items-center gap-1.5 ${
                            isAlreadyGiven ? 'cursor-not-allowed' : 'cursor-pointer'
                          }`}
                        >
                          <span>Kartu Hitam Gold</span>
                          <span className="text-[10px] text-amber-300 font-normal">(Maju Panggung)</span>
                        </label>

                        {isAlreadyGiven ? (
                          <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs shrink-0 flex items-center gap-1">
                            <Check className="w-3 h-3 text-white" />
                            SUDAH
                          </span>
                        ) : isChecked ? (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#D49B5B] text-white ml-1 shrink-0">
                            ✓ DIBERIKAN
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold text-stone-500 px-2 py-0.5 rounded-full bg-stone-100 ml-1 shrink-0">
                            BELUM
                          </span>
                        )}
                      </div>

                      {isAlreadyGiven && (
                        <p className="text-[10px] text-amber-300/90 font-medium mt-1 leading-tight flex items-center gap-1">
                          <span className="inline-block w-1 h-1 rounded-full bg-amber-400 shrink-0"></span>
                          Kartu Hitam Gold sudah diberikan — hanya 1 kuota maju panggung.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Input Form Jumlah Kehadiran (L / P) */}
            {(() => {
              const totalKuota = activeItem.kuota.kuotaDasar + activeItem.kuota.kuotaTambahan;
              const terpakai = activeItem.kuota.terpakai;
              const sisa = Math.max(0, totalKuota - terpakai);
              const totalInput = jumlahL + jumlahP;
              const isNewlyGivingGold = activeItem.isBilGhoib && (kartuHitamGoldDiberi || serahkanTiketEmas);
              const isExceeded = totalInput > sisa;
              const isPlusDisabled = totalInput >= sisa;

              return (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        JUMLAH PRIA (L)
                      </label>
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setJumlahL(Math.max(0, jumlahL - 1))}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-black text-xs text-slate-700 shadow-xs cursor-pointer flex items-center justify-center shrink-0"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={0}
                          value={jumlahL}
                          onChange={(e) => setJumlahL(parseInt(e.target.value, 10) || 0)}
                          className="w-full text-center font-bold text-sm bg-white border border-slate-300 rounded-lg py-0.5"
                        />
                        <button
                          type="button"
                          onClick={() => setJumlahL(jumlahL + 1)}
                          disabled={isPlusDisabled}
                          title={isPlusDisabled ? `Sisa kuota: ${sisa} orang` : undefined}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-black text-xs text-slate-700 shadow-xs cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        JUMLAH WANITA (P)
                      </label>
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setJumlahP(Math.max(0, jumlahP - 1))}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-black text-xs text-slate-700 shadow-xs cursor-pointer flex items-center justify-center shrink-0"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={0}
                          value={jumlahP}
                          onChange={(e) => setJumlahP(parseInt(e.target.value, 10) || 0)}
                          className="w-full text-center font-bold text-sm bg-white border border-slate-300 rounded-lg py-0.5"
                        />
                        <button
                          type="button"
                          onClick={() => setJumlahP(jumlahP + 1)}
                          disabled={isPlusDisabled}
                          title={isPlusDisabled ? `Sisa kuota: ${sisa} orang` : undefined}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-black text-xs text-slate-700 shadow-xs cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* INFO TEKS SISA KUOTA & STATUS AUTOMATIS */}
                  <div className="text-[11px] font-semibold text-center py-1">
                    {sisa === 0 ? (
                      <span className="text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-block">
                        ⚠️ Kuota habis{activeItem.isBilGhoib ? ' — Kartu Hitam Gold sudah otomatis diberikan.' : '.'}
                      </span>
                    ) : (
                      <span className="text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
                        Sisa kuota: <strong>{sisa} orang</strong> (Input saat ini: {totalInput} orang)
                      </span>
                    )}
                  </div>

                  {isExceeded && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Total input ({totalInput} orang) melebihi sisa kuota ({sisa} orang). Mohon kurangi jumlahnya.</span>
                    </div>
                  )}

                  {errorMsg && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={handleResetForNext}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmCheckin}
                      disabled={isExceeded || (totalInput <= 0 && !isNewlyGivingGold) || sisa <= 0}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-800 hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed text-white font-serif font-black text-xs sm:text-sm shadow-md flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4 text-emerald-200" />
                      <span>Konfirmasi Presensi / Masuk</span>
                    </button>
                  </div>
                </div>
              );
            })()}
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
