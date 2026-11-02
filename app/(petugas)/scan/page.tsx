'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/audit-log';
import { JalurPemeriksaan, CheckinResult, calculateKuotaDasarSantri, cleanKategoriTamatan } from '@/lib/types';
import { upsertPresensiLog, syncKuotaTerpakai } from '@/lib/presensi-helper';
import confetti from 'canvas-confetti';
import DenahModal from '@/components/DenahModal';
import ScanCameraAndInputSection from '@/components/petugas/scan/ScanCameraAndInputSection';
import ScanResultModals from '@/components/petugas/scan/ScanResultModals';
import ScanRecentHistory from '@/components/petugas/scan/ScanRecentHistory';
import {
  ScanFeedback,
  ScanActiveItem,
  RecentScanLog,
  playBeep,
  playBuzzerError,
  playSuccessChime,
} from '@/components/petugas/scan/types';

// Batas waktu buffer USB scanner (reset + auto-submit fallback jika hardware tidak mengirim Enter)
const USB_BUFFER_TIMEOUT_MS = 500;
// Jeda maksimal antar karakter yang dianggap sebagai "burst" dari alat scan USB (bukan ketikan manusia)
const USB_BURST_INTERVAL_MS = 80;
// Kapasitas maksimal buffer USB (cukup untuk URL panjang + token HMAC)
const USB_BUFFER_MAX_LENGTH = 512;

export default function ScanPage() {
  const [jalur, setJalur] = useState<JalurPemeriksaan>('TIMUR');
  const [isDenahOpen, setIsDenahOpen] = useState(false);
  const [kodeInput, setKodeInput] = useState('');
  const [activeItem, setActiveItem] = useState<ScanActiveItem | null>(null);

  // Form input kehadiran
  const [jumlahL, setJumlahL] = useState(0);
  const [jumlahP, setJumlahP] = useState(0);
  const [jumlahBalita, setJumlahBalita] = useState(0);
  const [serahkanTiketEmas, setSerahkanTiketEmas] = useState(true);
  const [kartuHitamGoldDiberi, setKartuHitamGoldDiberi] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [isUpdatingKartuGold, setIsUpdatingKartuGold] = useState(false);

  // Result state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [checkinResult, setCheckinResult] = useState<CheckinResult | null>(null);

  // Riwayat & Submitting state
  const [recentScans, setRecentScans] = useState<RecentScanLog[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Visual feedback overlay
  const [scanFeedback, setScanFeedback] = useState<ScanFeedback | null>(null);

  // Camera scanner state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isInitializing, setIsInitializing] = useState(false);

  const scannerRef = useRef<any>(null);
  const isScanningRef = useRef(false);

  // Fetch 5 scan terakhir hari ini
  const fetchRecentScans = useCallback(async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: logs } = await supabase
        .from('presensi_log')
        .select('id, kode_qr, nama_peserta, jumlah_l, jumlah_p, jalur, created_at')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentScans(logs || []);
    } catch (err) {
      console.error('Error fetching recent scans:', err);
    }
  }, []);

  useEffect(() => {
    fetchRecentScans();
    const channel = supabase
      .channel('scan_recent_logs_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presensi_log' }, () => {
        fetchRecentScans();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRecentScans]);

  const inputRef = useRef<HTMLInputElement>(null);
  const scanBufferRef = useRef('');
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastKeyTimeRef = useRef(0);
  const fastKeyCountRef = useRef(0);
  const lastUsbSubmitTimeRef = useRef(0);
  const lastSubmittedScanRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  // Ekstraksi kode peserta bersih dari berbagai format QR:
  // - Kode mentah: SHFV1Y / UND0103
  // - Payload HMAC: HFL27.SHFV1Y.9a3f1c7e
  // - URL portal: https://domain/u/SHFV1Y atau /u/SHFV1Y-9a3f1c7e?x=1
  // - Token portal: SHFV1Y-9a3f1c7e
  const extractCleanScanCode = useCallback((scannedRaw: string): string => {
    let raw = (scannedRaw || '')
      .replace(/[\x00-\x1F\x7F]+/g, '')
      .replace(/^\][A-Za-z][0-9]/, '') // Prefix AIM symbology identifier (misal "]Q1") dari sebagian scanner 2D
      .trim();

    if (!raw) return '';

    const urlPathMatch = raw.match(/\/(?:u|beli|s)\/([^/?#\s]+)/i);
    if (urlPathMatch && urlPathMatch[1]) {
      try {
        raw = decodeURIComponent(urlPathMatch[1]).trim();
      } catch {
        raw = urlPathMatch[1].trim();
      }
    } else if (raw.includes('.')) {
      const dotParts = raw.split('.').map((p) => p.trim()).filter(Boolean);
      if (dotParts.length >= 2 && !/^https?:/i.test(dotParts[0])) {
        raw = dotParts[1];
      }
    }

    // Buang suffix tanda tangan portal 8-hex (SHFV1Y-9a3f1c7e -> SHFV1Y)
    const signedPortalMatch = raw.match(/^(.+?)-[0-9a-f]{8}$/i);
    if (signedPortalMatch && signedPortalMatch[1]) {
      raw = signedPortalMatch[1];
    }

    return raw.toUpperCase().trim();
  }, []);

  // Tampilkan banner merah + buzzer (tidak boleh ada silent error)
  const showScanError = useCallback((errMsg: string) => {
    setErrorMsg(errMsg);
    setActiveItem(null);
    setCheckinResult(null);
    playBuzzerError();
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setScanFeedback({
      type: 'error',
      message: errMsg,
    });
    feedbackTimerRef.current = setTimeout(() => setScanFeedback(null), 4500);
  }, []);

  // Stop Kamera
  const stopCamera = useCallback(async () => {
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
  }, []);

  // Handler memproses kode QR (dipakai bersama oleh Kamera, Alat Scan USB, dan Input Manual)
  const handleScanCode = useCallback(async (scannedRaw: string, source: string = 'manual') => {
    try {
      const rawTrimmed = (scannedRaw || '').replace(/[\r\n\t]+/g, '').trim();
      console.log(`[Scan Submit] source=${source} raw="${rawTrimmed}" t=${Date.now()}`);

      if (!rawTrimmed) {
        showScanError('Format QR tidak dikenali: data hasil pindai kosong.');
        return;
      }

      const cleanCode = extractCleanScanCode(rawTrimmed);

      if (!cleanCode || cleanCode.length < 2 || cleanCode.length > 50 || !/^[A-Z0-9_-]+$/.test(cleanCode)) {
        const preview = rawTrimmed.length > 40 ? `${rawTrimmed.slice(0, 40)}...` : rawTrimmed;
        showScanError(`Format QR tidak dikenali: "${preview}". Gunakan QR Code resmi undangan Haflah P3TQ.`);
        return;
      }

      // Guard bentrok simultan (<350ms untuk kode identik, misal Enter keydown + form submit)
      const now = Date.now();
      if (lastSubmittedScanRef.current.code === cleanCode && now - lastSubmittedScanRef.current.time < 350) {
        console.log(`[Scan Submit] Duplikasi simultan diabaikan untuk "${cleanCode}"`);
        return;
      }
      lastSubmittedScanRef.current = { code: cleanCode, time: now };

      setErrorMsg(null);
      setCheckinResult(null);
      setKodeInput('');
      if (inputRef.current) inputRef.current.value = '';

      // 1. Cek Peserta Santri
      let { data: santri, error: santriError } = await supabase
        .from('peserta_santri')
        .select('*')
        .or(`kode.eq.${cleanCode},nis.eq.${cleanCode}`)
        .maybeSingle();

      if (santriError) {
        throw new Error(`Gagal memeriksa data peserta santri (${santriError.message})`);
      }

      // 2. Jika tidak ada di santri, cek ke Tamu Undangan
      let tamu = null;
      if (!santri) {
        const resTamu = await supabase
          .from('tamu_undangan')
          .select('*')
          .eq('kode', cleanCode)
          .maybeSingle();
        if (resTamu.error) {
          throw new Error(`Gagal memeriksa data tamu undangan (${resTamu.error.message})`);
        }
        tamu = resTamu.data;
      }

      // 3. Jika kode tidak terdaftar di Supabase
      if (!santri && !tamu) {
        showScanError(`Kode QR "${cleanCode}" TIDAK TERDAFTAR dalam basis data!`);
        return;
      }

      const isSantri = !!santri;
      const entity = santri || tamu;
      const targetKode = entity.kode || entity.nis || cleanCode;

      // Single Source of Truth: Fetch live terpakai from presensi_log
      const { data: presensiLogs, error: presensiError } = await supabase
        .from('presensi_log')
        .select('jumlah_l, jumlah_p')
        .eq('kode_qr', targetKode);

      if (presensiError) {
        throw new Error(`Gagal membaca log presensi (${presensiError.message})`);
      }

      const existingL = (presensiLogs || []).reduce(
        (sum, r) => sum + Number(r.jumlah_l || 0),
        0
      );
      const existingP = (presensiLogs || []).reduce(
        (sum, r) => sum + Number(r.jumlah_p || 0),
        0
      );
      const terpakai = existingL + existingP;

      const kuotaDasar = isSantri
        ? Math.max(Number(entity.kuota_dasar || 0), calculateKuotaDasarSantri(entity.kategori_utama, entity.sub_kategori))
        : ((entity.nama_putra && String(entity.nama_putra).trim() !== '') ? 1 : 0) +
          ((entity.nama_putri && String(entity.nama_putri).trim() !== '') ? 1 : 0);
      const kuotaTambahan = isSantri ? Number(entity.kuota_tambahan || 0) : 0;
      const totalKuota = kuotaDasar + kuotaTambahan;

      const sisa = Math.max(0, totalKuota - terpakai);

      const isBilGhoib = isSantri && (
        (entity.kategori_utama || '').toUpperCase().includes('BIL_GHOIB') ||
        (entity.kategori_utama || '').toUpperCase().includes('GHOIB') ||
        (entity.sub_kategori || '').toUpperCase().includes('GHOIB')
      );
      const isAlreadyGiven = Number(entity.tiket_panggung_diberi || 0) > 0;
      setKartuHitamGoldDiberi(isAlreadyGiven || sisa === 0);
      setSerahkanTiketEmas(isAlreadyGiven || sisa === 0);

      const resolvedKategori = isSantri
        ? (entity.sub_kategori || entity.kategori_utama || 'Bil Ghoib')
        : (entity.kategori || 'Tamu Undangan');

      const itemObj: ScanActiveItem = {
        id: entity.id,
        kode: targetKode,
        tipe: isSantri ? 'KELUARGA' : 'UNDANGAN',
        nama: entity.nama,
        namaWali: isSantri ? (entity.nama_wali || '-') : (entity.instansi || entity.alamat || '-'),
        kategori: resolvedKategori,
        subKategori: cleanKategoriTamatan(entity.sub_kategori) || (isSantri ? 'Bil Ghoib' : entity.kategori || 'Tamu'),
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
                subKategori: cleanKategoriTamatan(entity.sub_kategori) || 'Bil Ghoib',
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

      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      if (terpakai >= totalKuota) {
        playBuzzerError();
        const warnMsg = `PERINGATAN KUOTA HABIS: Seluruh tiket untuk "${itemObj.nama}" sudah terpakai (${terpakai}/${totalKuota})!`;
        setErrorMsg(warnMsg);
        setScanFeedback({
          type: 'error',
          message: warnMsg,
          name: itemObj.nama,
          kategori: itemObj.kategori,
        });
      } else {
        playBeep();
        setScanFeedback({
          type: 'success',
          message: `QR ${targetKode} Berhasil Terverifikasi`,
          name: itemObj.nama,
          kategori: itemObj.kategori,
        });
      }
      feedbackTimerRef.current = setTimeout(() => setScanFeedback(null), 2500);

      setActiveItem(itemObj);

      // Stop kamera saat item berhasil diproses
      stopCamera();

      // Konsep Scan Bertahap: input L/P selalu dimulai dari 0 (= jumlah orang yang BARU datang).
      // Saat konfirmasi, nilai ini DITAMBAHKAN ke total kumulatif presensi_log yang sudah ada.
      setJumlahL(0);
      setJumlahP(0);
      setJumlahBalita(0);

      if (isBilGhoib) {
        setSerahkanTiketEmas(!isAlreadyGiven);
      } else {
        setSerahkanTiketEmas(false);
      }
    } catch (err: any) {
      console.error('Error during scan verification:', err);
      showScanError(`Gagal memproses scan: ${err?.message || String(err)}`);
    }
  }, [extractCleanScanCode, showScanError, stopCamera]);

  // Ref ke versi terbaru handleScanCode agar listener keyboard tidak perlu dipasang ulang
  const handleScanCodeRef = useRef(handleScanCode);
  handleScanCodeRef.current = handleScanCode;

  // =========================================================================
  // LISTENER ALAT SCAN USB (USB HID = keyboard super cepat)
  // - Jalur A: kursor di <input> manual (auto-focus) -> baca langsung inputRef.current.value
  // - Jalur B: fokus di luar input (body/button/modal) -> akumulasi ke scanBufferRef
  // - Terminator: Enter / NumpadEnter / \r / \n / Ctrl+J / Tab (saat burst)
  // - Fallback: scanner tanpa Enter -> auto-submit setelah diam 500ms
  // =========================================================================
  useEffect(() => {
    // Auto-focus tetap dipertahankan
    if (inputRef.current) inputRef.current.focus();

    const resetBufferState = () => {
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
      scanBufferRef.current = '';
      lastKeyTimeRef.current = 0;
      fastKeyCountRef.current = 0;
    };

    const submitFromUsb = (value: string, source: string) => {
      lastUsbSubmitTimeRef.current = Date.now();
      console.log(`[USB Scanner] Submit (${source}):`, value);
      handleScanCodeRef.current(value, source);
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName || '';
      const isManualCodeInput = Boolean(inputRef.current && target === inputRef.current);
      const isOtherFormField =
        !isManualCodeInput &&
        (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || Boolean(target?.isContentEditable));

      console.log('Keydown:', e.key, `(target=${tagName}, buffer="${scanBufferRef.current}")`);

      // Jangan ganggu kolom lain (misal input angka L/P di pop-up atau kolom chat)
      if (isOtherFormField) return;

      const isEnterTerminator =
        e.key === 'Enter' ||
        e.code === 'NumpadEnter' ||
        e.key === '\r' ||
        e.key === '\n' ||
        (e.ctrlKey && e.key.toLowerCase() === 'j');
      const isTabTerminator = e.key === 'Tab' && fastKeyCountRef.current >= 3;

      // ---------------- JALUR A: kursor di input manual ----------------
      if (isManualCodeInput) {
        if (isEnterTerminator || isTabTerminator) {
          const domValue = (inputRef.current?.value || '').trim();
          resetBufferState();

          if (domValue.length > 0) {
            e.preventDefault();
            e.stopPropagation();
            submitFromUsb(domValue, 'usb-input-enter');
          } else if (Date.now() - lastUsbSubmitTimeRef.current < 200) {
            // LF susulan dari scanner CR+LF
            e.preventDefault();
            e.stopPropagation();
          }
          return;
        }

        if (e.ctrlKey || e.altKey || e.metaKey) return;

        if (e.key.length === 1) {
          const now = Date.now();
          const diff = lastKeyTimeRef.current ? now - lastKeyTimeRef.current : 0;
          lastKeyTimeRef.current = now;
          if (diff > 0 && diff < USB_BURST_INTERVAL_MS) {
            fastKeyCountRef.current += 1;
          } else if (diff >= USB_BURST_INTERVAL_MS) {
            fastKeyCountRef.current = 0;
          }

          // Fallback scanner tanpa Enter: burst cepat lalu diam 500ms -> submit otomatis
          if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
          scanTimerRef.current = setTimeout(() => {
            const burstValue = (inputRef.current?.value || '').trim();
            const wasUsbBurst = fastKeyCountRef.current >= 3;
            resetBufferState();
            if (wasUsbBurst && burstValue.length > 0) {
              submitFromUsb(burstValue, 'usb-input-auto');
            }
          }, USB_BUFFER_TIMEOUT_MS);
        }
        return;
      }

      // ---------------- JALUR B: fokus global ----------------
      if (isEnterTerminator || (e.key === 'Tab' && scanBufferRef.current.trim().length > 0 && fastKeyCountRef.current >= 2)) {
        const bufferedCode = scanBufferRef.current.trim();
        resetBufferState();

        if (bufferedCode.length > 0) {
          // Cegah Enter dari scanner "mengklik" tombol yang sedang fokus
          e.preventDefault();
          e.stopPropagation();
          submitFromUsb(bufferedCode, 'usb-global-enter');
        } else if (Date.now() - lastUsbSubmitTimeRef.current < 200) {
          e.preventDefault();
          e.stopPropagation();
        }
        return;
      }

      if (e.ctrlKey || e.altKey || e.metaKey) return;

      if (e.key.length === 1) {
        const now = Date.now();
        const diff = lastKeyTimeRef.current ? now - lastKeyTimeRef.current : 0;
        lastKeyTimeRef.current = now;
        if (diff > 0 && diff < USB_BURST_INTERVAL_MS) {
          fastKeyCountRef.current += 1;
        }

        if (scanBufferRef.current.length < USB_BUFFER_MAX_LENGTH) {
          scanBufferRef.current += e.key;
        }

        // Spasi dari scanner tidak boleh menekan tombol yang sedang fokus
        if (tagName === 'BUTTON' && e.key === ' ' && fastKeyCountRef.current > 0) {
          e.preventDefault();
        }

        if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
        scanTimerRef.current = setTimeout(() => {
          const bufferedCode = scanBufferRef.current.trim();
          const wasUsbBurst = fastKeyCountRef.current >= 2;
          resetBufferState();
          // Auto-submit hanya untuk pola burst USB (bukan ketukan tombol acak oleh manusia)
          if (wasUsbBurst && bufferedCode.length >= 3) {
            submitFromUsb(bufferedCode, 'usb-global-auto');
          }
        }, USB_BUFFER_TIMEOUT_MS);
      }
    };

    // Capture phase: menangkap event sebelum elemen lain (form/button) memprosesnya
    window.addEventListener('keydown', handleKeyPress, true);
    return () => {
      window.removeEventListener('keydown', handleKeyPress, true);
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

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
          fps: 10,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleScanCodeRef.current(decodedText, 'camera');
        },
        () => {}
      );

      // Jika pop-up absen sudah terbuka (misal via alat scan USB) saat kamera masih inisialisasi, matikan kamera
      if (!document.getElementById('qr-camera-reader')) {
        try {
          await scanner.stop();
          scanner.clear();
        } catch {}
        isScanningRef.current = false;
        setCameraActive(false);
        return;
      }

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
  }, [activeItem, checkinResult, facingMode, stopCamera]);

  // Handler Check / Uncheck Kartu Cream
  const handleToggleKartuHitamGold = async () => {
    if (!activeItem || isUpdatingKartuGold) return;
    const isCurrentlyChecked = Number(activeItem.kuota?.tiketPanggungDiberi || 0) > 0 || kartuHitamGoldDiberi || serahkanTiketEmas;

    if (isCurrentlyChecked) {
      setShowResetConfirmModal(true);
    } else {
      setIsUpdatingKartuGold(true);
      try {
        const { error } = await supabase
          .from('peserta_santri')
          .update({ tiket_panggung_diberi: 1 })
          .eq('id', activeItem.id);

        if (error) throw error;

        await logAudit({
          panitia_id: jalur === 'BARAT' ? 'PETUGAS_PUTRA' : 'PETUGAS_PUTRI',
          panitia_role: 'PENJAGA_GERBANG',
          aksi: 'CHECK_KARTU_CREAM',
          tabel: 'peserta_santri',
          kode: activeItem.kode,
          nama: activeItem.nama,
          field: 'tiket_panggung_diberi',
          nilai_lama: '0',
          nilai_baru: '1',
          catatan: 'Diberikan Kartu Cream via Scanner Gerbang',
        });

        setKartuHitamGoldDiberi(true);
        setSerahkanTiketEmas(true);
        setActiveItem((prev) =>
          prev
            ? {
                ...prev,
                kartuHitamGoldDiberi: true,
                kuota: {
                  ...prev.kuota,
                  tiketPanggungDiberi: 1,
                },
              }
            : null
        );
      } catch (err: any) {
        console.error('Error checking Kartu Cream:', err);
        setErrorMsg(`Gagal mengupdate Kartu Cream: ${err.message || err}`);
      } finally {
        setIsUpdatingKartuGold(false);
      }
    }
  };

  const handleConfirmResetKartuHitamGold = async () => {
    if (!activeItem || isUpdatingKartuGold) return;
    setIsUpdatingKartuGold(true);
    try {
      const { error } = await supabase
        .from('peserta_santri')
        .update({ tiket_panggung_diberi: 0 })
        .eq('id', activeItem.id);

      if (error) throw error;

      await logAudit({
        panitia_id: jalur === 'BARAT' ? 'PETUGAS_PUTRA' : 'PETUGAS_PUTRI',
        panitia_role: 'PENJAGA_GERBANG',
        aksi: 'UNCHECK_KARTU_CREAM',
        tabel: 'peserta_santri',
        kode: activeItem.kode,
        nama: activeItem.nama,
        field: 'tiket_panggung_diberi',
        nilai_lama: '1',
        nilai_baru: '0',
        catatan: 'Reset/Uncheck Kartu Cream via Scanner Gerbang',
      });

      setKartuHitamGoldDiberi(false);
      setSerahkanTiketEmas(false);
      setActiveItem((prev) =>
        prev
          ? {
              ...prev,
              kartuHitamGoldDiberi: false,
              kuota: {
                ...prev.kuota,
                tiketPanggungDiberi: 0,
              },
            }
          : null
      );
      setShowResetConfirmModal(false);
    } catch (err: any) {
      console.error('Error resetting Kartu Cream:', err);
      setErrorMsg(`Gagal mereset Kartu Cream: ${err.message || err}`);
    } finally {
      setIsUpdatingKartuGold(false);
    }
  };

  // Handler Konfirmasi Checkin
  const handleConfirmCheckin = async () => {
    if (!activeItem || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    const inputTotal = jumlahL + jumlahP;

    const isAlreadyGiven = activeItem.isBilGhoib && (Number(activeItem.kuota?.tiketPanggungDiberi || 0) > 0 || Boolean(activeItem.kartuHitamGoldDiberi));
    const isNewlyGivingGold = activeItem.isBilGhoib && !isAlreadyGiven && (kartuHitamGoldDiberi || serahkanTiketEmas);
    const nextTiketPanggung = activeItem.isBilGhoib
      ? (isAlreadyGiven ? Number(activeItem.kuota?.tiketPanggungDiberi || 1) : (isNewlyGivingGold ? 1 : 0))
      : 0;

    if (inputTotal <= 0 && !isNewlyGivingGold) {
      setErrorMsg('Masukkan jumlah orang yang hadir (L/P) atau centang Kartu Cream.');
      setIsSubmitting(false);
      return;
    }

    try {
      const totalKuota = activeItem.kuota.kuotaDasar + activeItem.kuota.kuotaTambahan;
      const kodeTarget = activeItem.kode || String(activeItem.id);

      // 1. Ambil total kumulatif TERKINI dari presensi_log untuk hitung akumulasi dan anti-duplicate guard
      const { data: currentLogs, error: currentLogsErr } = await supabase
        .from('presensi_log')
        .select('id, jumlah_l, jumlah_p, jumlah_balita, tiket_panggung, created_at')
        .eq('kode_qr', kodeTarget);

      if (currentLogsErr) {
        throw new Error(`Gagal membaca presensi terkini (${currentLogsErr.message})`);
      }

      // FIX 3: Anti-Duplicate Guard 3 detik (dihitung langsung dari currentLogs, tanpa query round-trip ke-2!)
      const now = Date.now();
      const isRecentlySubmitted = (currentLogs || []).some((r: any) => {
        if (!r.created_at) return false;
        const diff = now - new Date(r.created_at).getTime();
        return diff >= 0 && diff < 3000;
      });

      if (isRecentlySubmitted) {
        setErrorMsg('Peringatan: Presensi untuk kode ini baru saja dicatat dalam 3 detik terakhir (Anti-Duplicate Guard).');
        playBuzzerError();
        setIsSubmitting(false);
        return;
      }

      const prevL = (currentLogs || []).reduce((s, r: any) => s + Number(r.jumlah_l || 0), 0);
      const prevP = (currentLogs || []).reduce((s, r: any) => s + Number(r.jumlah_p || 0), 0);
      const prevBalita = (currentLogs || []).reduce((s, r: any) => s + Number(r.jumlah_balita || 0), 0);
      const prevTiketPanggung = (currentLogs || []).some((r: any) => Number(r.tiket_panggung || 0) > 0) ? 1 : 0;

      const nextL = prevL + jumlahL;
      const nextP = prevP + jumlahP;
      const nextTotal = nextL + nextP;
      const sisaSebelum = Math.max(0, totalKuota - (prevL + prevP));

      if (nextTotal > totalKuota) {
        setErrorMsg(`Gagal simpan presensi: Tambahan ${inputTotal} orang melebihi sisa kuota (${sisaSebelum} kursi dari total ${totalKuota})! Mohon kurangi jumlahnya.`);
        playBuzzerError();
        setIsSubmitting(false);
        return;
      }

      // FIX 3: Satukan update tiket_panggung_diberi ke dalam satu panggilan update() lewat extraSantriData
      const extraSantriData = (activeItem.tipe === 'KELUARGA' && nextTiketPanggung > 0)
        ? { tiket_panggung_diberi: nextTiketPanggung }
        : undefined;

      // 2. Upsert ke presensi_log + sync kuota_terpakai (dan satukan update peserta_santri)
      try {
        await upsertPresensiLog({
          kode_qr: kodeTarget,
          nama_peserta: activeItem.nama || activeItem.namaSantri || 'Peserta',
          tipe_peserta: activeItem.tipe === 'KELUARGA' ? 'KELUARGA' : 'UNDANGAN',
          jalur: jalur,
          panitia_id: jalur === 'BARAT' ? 'panitia-putra' : 'panitia-putri',
          jumlah_l: nextL,
          jumlah_p: nextP,
          jumlah_balita: prevBalita + jumlahBalita,
          tiket_panggung: prevTiketPanggung || (isNewlyGivingGold ? 1 : 0),
          catatan: `Scan Pintu ${jalur}`,
          extraSantriData,
          existingId: currentLogs && currentLogs.length > 0 ? currentLogs[0].id : undefined,
        });
      } catch (logErr: any) {
        setErrorMsg(`Gagal mencatat presensi di Supabase: ${logErr.message || logErr}`);
        playBuzzerError();
        setIsSubmitting(false);
        return;
      }

      const totalTerpakai = nextTotal;

      // FIX 2: Tampilkan hasil sukses SEGERA (Optimistic & Super Fast Response < 1 detik)
      playSuccessChime();

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#F5C26B', '#4A7BB0', '#F4EFE6', '#ffffff'],
      });

      const updatedItem: ScanActiveItem = {
        ...activeItem,
        kuota: {
          ...activeItem.kuota,
          terpakai: totalTerpakai,
          tiketPanggungDiberi: nextTiketPanggung,
        },
      };

      setCheckinResult({
        ok: true,
        pesan: `Presensi berhasil dicatat! Tambahan masuk: ${inputTotal} orang (L:${jumlahL}, P:${jumlahP}). Total kehadiran kini: ${nextTotal} orang (L:${nextL}, P:${nextP}).`,
        sisa: Math.max(0, totalKuota - totalTerpakai),
        detail: updatedItem,
      });

      setActiveItem(updatedItem);
      setIsSubmitting(false);

      // FIX 4: Asinkronkan proses non-kritis (fire-and-forget di background tanpa menahan tampilan sukses)
      logAudit({
        panitia_id: jalur === 'BARAT' ? 'PETUGAS_PUTRA' : 'PETUGAS_PUTRI',
        panitia_role: 'PENJAGA_GERBANG',
        aksi: 'TANDAI_HADIR',
        tabel: activeItem.tipe === 'KELUARGA' ? 'peserta_santri' : 'tamu_undangan',
        kode: kodeTarget,
        nama: activeItem.nama || activeItem.namaSantri || 'Peserta',
        field: 'kuota_terpakai',
        nilai_lama: String(prevL + prevP),
        nilai_baru: String(totalTerpakai),
        detail: {
          tambahan_l: jumlahL,
          tambahan_p: jumlahP,
          total_l: nextL,
          total_p: nextP,
          jumlah_balita: jumlahBalita,
          jalur,
          tiket_panggung: isNewlyGivingGold,
        },
        catatan: `Scan Presensi Pintu ${jalur} (+${jumlahL} L / +${jumlahP} P → total ${nextL} L / ${nextP} P)`,
      }).catch((auditErr) => console.error('[Non-blocking logAudit error]', auditErr));

      // fetchRecentScans dipanggil non-blocking (Realtime subscription juga mengupdate secara otomatis)
      fetchRecentScans().catch((err) => console.error('[Non-blocking fetchRecentScans error]', err));
    } catch (e: any) {
      console.error('Error during checkin confirmation:', e);
      setErrorMsg(`Gagal memproses presensi: ${e.message || e}`);
      setIsSubmitting(false);
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
    // Kembalikan fokus ke input agar tembakan alat scan USB berikutnya langsung tertangkap
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-20">
      {/* SECTION KAMERA DAN INPUT KODE QR */}
      <ScanCameraAndInputSection
        jalur={jalur}
        setJalur={setJalur}
        onOpenDenah={() => setIsDenahOpen(true)}
        scanFeedback={scanFeedback}
        showScannerViewport={!activeItem && !checkinResult}
        cameraActive={cameraActive}
        isInitializing={isInitializing}
        facingMode={facingMode}
        cameraError={cameraError}
        onToggleFacingMode={toggleFacingMode}
        onStopCamera={stopCamera}
        onStartCamera={() => startCamera(facingMode)}
        inputRef={inputRef}
        kodeInput={kodeInput}
        setKodeInput={setKodeInput}
        onSubmitCode={handleScanCode}
        errorMsg={errorMsg}
      />

      {/* DETAIL PESERTA & HASIL PRESENSI MODALS */}
      <ScanResultModals
        activeItem={activeItem}
        checkinResult={checkinResult}
        jalur={jalur}
        jumlahL={jumlahL}
        setJumlahL={setJumlahL}
        jumlahP={jumlahP}
        setJumlahP={setJumlahP}
        kartuHitamGoldDiberi={kartuHitamGoldDiberi}
        serahkanTiketEmas={serahkanTiketEmas}
        errorMsg={errorMsg}
        showResetConfirmModal={showResetConfirmModal}
        setShowResetConfirmModal={setShowResetConfirmModal}
        isUpdatingKartuGold={isUpdatingKartuGold}
        isSubmitting={isSubmitting}
        onToggleKartuHitamGold={handleToggleKartuHitamGold}
        onConfirmResetKartuHitamGold={handleConfirmResetKartuHitamGold}
        onConfirmCheckin={handleConfirmCheckin}
        onResetForNext={handleResetForNext}
      />

      {/* RIWAYAT SCAN TERAKHIR HARI INI */}
      <ScanRecentHistory recentScans={recentScans} />

      {/* DENAH MODAL */}
      {isDenahOpen && (
        <DenahModal isOpen={isDenahOpen} onClose={() => setIsDenahOpen(false)} />
      )}
    </div>
  );
}
