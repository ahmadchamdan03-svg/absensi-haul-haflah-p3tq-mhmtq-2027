'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/audit-log';
import { JalurPemeriksaan, CheckinResult, calculateKuotaDasarSantri, cleanKategoriTamatan } from '@/lib/types';
import { getAmbiguousKodeVariants } from '@/lib/utils';
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
  const inputBurstCountRef = useRef(0);
  const lastUsbSubmitTimeRef = useRef(0);
  const lastSubmittedScanRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  // Helper ekstraksi kode peserta bersih dari berbagai format QR (Raw, HMAC HFL27.KODE.SIG, URL /u/KODE-SIG, AIM prefix ]Q1)
  const extractCleanScanCode = useCallback((scannedRaw: string): string => {
    let raw = (scannedRaw || '')
      .replace(/[\x00-\x1F\x7F]+/g, '')
      .replace(/^\][A-Za-z][0-9]/, '')
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

    // Bersihkan suffix tanda tangan portal 8-hex (misal SHFV1Y-9a3f1c7e atau UND-0012-9a3f1c7e)
    const signedPortalMatch = raw.match(/^(.+?)-[0-9a-f]{8}$/i);
    if (signedPortalMatch && signedPortalMatch[1]) {
      raw = signedPortalMatch[1];
    }

    return raw.toUpperCase().trim();
  }, []);

  // Helper menampilkan feedback & notifikasi error merah di UI (tanpa silent error)
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
    feedbackTimerRef.current = setTimeout(() => {
      setScanFeedback(null);
    }, 4500);
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

  // Handler memproses kode QR (Kamera, USB Barcode Scanner, maupun Input Manual)
  const handleScanCode = useCallback(async (scannedRaw: string, source: string = 'manual') => {
    try {
      const rawTrimmed = (scannedRaw || '').replace(/[\r\n\t]+/g, '').trim();
      console.log(`[Scan Submit] Source=${source} | Raw="${rawTrimmed}" | Timestamp=${Date.now()}`);

      if (!rawTrimmed) {
        showScanError('Format QR tidak dikenali: data hasil pindai kosong.');
        return;
      }

      const cleanCode = extractCleanScanCode(rawTrimmed);

      // Validasi format kode hasil ekstraksi (jangan pernah silent return)
      if (!cleanCode || cleanCode.length < 2 || cleanCode.length > 50 || !/^[A-Z0-9_-]+$/.test(cleanCode)) {
        const preview = rawTrimmed.length > 40 ? `${rawTrimmed.slice(0, 40)}...` : rawTrimmed;
        showScanError(`Format QR tidak dikenali: "${preview}". Gunakan QR Code resmi undangan Haflah P3TQ.`);
        return;
      }

      // Guard anti-double-submit simultan (<350ms untuk kode identik, misal bentrok Enter keydown & form submit)
      const now = Date.now();
      if (
        lastSubmittedScanRef.current.code === cleanCode &&
        now - lastSubmittedScanRef.current.time < 350
      ) {
        console.log(`[Scan Submit] Abaikan duplikasi simultan (<350ms) untuk kode "${cleanCode}"`);
        return;
      }
      lastSubmittedScanRef.current = { code: cleanCode, time: now };

      setErrorMsg(null);
      setCheckinResult(null);
      setKodeInput('');
      if (inputRef.current) {
        inputRef.current.value = '';
      }

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

      // 2b. Fallback toleransi karakter ambigu (0<->O, 1<->I) seperti pada portal /u/[token]
      if (!santri && !tamu) {
        const variants = getAmbiguousKodeVariants(cleanCode);
        if (variants.length > 1) {
          const altSantri = await supabase
            .from('peserta_santri')
            .select('*')
            .in('kode', variants)
            .limit(1)
            .maybeSingle();
          if (altSantri.data) {
            santri = altSantri.data;
          } else {
            const altTamu = await supabase
              .from('tamu_undangan')
              .select('*')
              .in('kode', variants)
              .limit(1)
              .maybeSingle();
            if (altTamu.data) {
              tamu = altTamu.data;
            }
          }
        }
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
      feedbackTimerRef.current = setTimeout(() => setScanFeedback(null), 2800);

      setActiveItem(itemObj);

      // Stop kamera saat item berhasil diproses
      stopCamera();

      // Konsep Scan Bertahap: Pre-fill dengan nilai existing (kumulatif) dari presensi_log bila ada
      if (existingL > 0 || existingP > 0) {
        setJumlahL(existingL);
        setJumlahP(existingP);
      } else if (sisa > 0) {
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
      showScanError(`Gagal memproses scan: ${err?.message || String(err)}`);
    }
  }, [extractCleanScanCode, showScanError, stopCamera]);

  const handleScanCodeRef = useRef(handleScanCode);
  handleScanCodeRef.current = handleScanCode;

  // Global USB Barcode Scanner Listener (bebas bentrokan fokus input/button & mendukung scanner dengan/tanpa Enter)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName || '';
      const isManualCodeInput = Boolean(inputRef.current && target === inputRef.current);
      const isOtherFormField =
        !isManualCodeInput &&
        (tagName === 'INPUT' ||
          tagName === 'TEXTAREA' ||
          tagName === 'SELECT' ||
          Boolean(target?.isContentEditable));

      console.log('Keydown:', e.key, {
        code: e.code,
        target: tagName,
        isManualCodeInput,
        buffer: scanBufferRef.current,
      });

      // Jangan intersep jika petugas sedang mengetik angka jumlah L/P di modal atau kolom chat lain
      if (isOtherFormField) {
        return;
      }

      const isEnterTerminator =
        e.key === 'Enter' ||
        e.code === 'NumpadEnter' ||
        e.key === '\r' ||
        e.key === '\n' ||
        (e.ctrlKey && e.key.toLowerCase() === 'j');
      const isTabTerminator = e.key === 'Tab';

      // JALUR A: Kursor sedang berada di kolom input kode manual (tetap tangani tembakan USB Scanner & tekan Enter!)
      if (isManualCodeInput) {
        if (isEnterTerminator || (isTabTerminator && inputBurstCountRef.current >= 3)) {
          if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
          const domValue = (inputRef.current?.value || scanBufferRef.current || '').trim();
          scanBufferRef.current = '';
          inputBurstCountRef.current = 0;
          lastKeyTimeRef.current = 0;

          // Abaikan LF susulan (<200ms) setelah CR pada scanner berformat CR+LF
          if (!domValue && Date.now() - lastUsbSubmitTimeRef.current < 200) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }

          if (domValue.length > 0) {
            e.preventDefault();
            e.stopPropagation();
            lastUsbSubmitTimeRef.current = Date.now();
            console.log('[USB/Input Scanner] Terminator terdeteksi di kolom input, submit:', domValue);
            handleScanCodeRef.current(domValue, 'input-keydown');
          }
          return;
        }

        if (e.ctrlKey || e.altKey || e.metaKey) return;

        if (e.key.length === 1) {
          const now = Date.now();
          const diff = lastKeyTimeRef.current ? now - lastKeyTimeRef.current : 0;
          lastKeyTimeRef.current = now;

          if (diff > 0 && diff < 75) {
            inputBurstCountRef.current += 1;
          } else if (diff > 250) {
            inputBurstCountRef.current = 0;
          }

          // Fallback auto-submit jika USB Scanner menembak ke dalam <input> namun hardware tidak mengirim Enter
          if (inputBurstCountRef.current >= 4) {
            if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
            scanTimerRef.current = setTimeout(() => {
              const burstValue = (inputRef.current?.value || '').trim();
              inputBurstCountRef.current = 0;
              scanBufferRef.current = '';
              lastKeyTimeRef.current = 0;
              if (burstValue.length > 0) {
                lastUsbSubmitTimeRef.current = Date.now();
                console.log('[USB/Input Scanner] Auto-submit burst USB di kolom input (tanpa Enter):', burstValue);
                handleScanCodeRef.current(burstValue, 'input-usb-burst');
              }
            }, 300);
          }
        }
        return;
      }

      // JALUR B: Fokus global (BODY, BUTTON, DIV, maupun saat modal hasil sebelumnya terbuka)
      if (isEnterTerminator || (isTabTerminator && scanBufferRef.current.trim().length > 0)) {
        if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
        const bufferedCode = scanBufferRef.current.trim();
        scanBufferRef.current = '';
        lastKeyTimeRef.current = 0;
        inputBurstCountRef.current = 0;

        if (bufferedCode.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          lastUsbSubmitTimeRef.current = Date.now();
          console.log('[USB Scanner] Terminator terdeteksi, memproses buffer:', bufferedCode);
          handleScanCodeRef.current(bufferedCode, 'usb-keydown');
        } else if (Date.now() - lastUsbSubmitTimeRef.current < 200) {
          // Cegah LF susulan menekan tombol yang sedang fokus
          e.preventDefault();
          e.stopPropagation();
        }
        return;
      }

      if (e.ctrlKey || e.altKey || e.metaKey) return;

      let printableChar = e.key.length === 1 ? e.key : '';
      if (!printableChar && e.key === 'Unidentified' && e.keyCode >= 48 && e.keyCode <= 90) {
        printableChar = String.fromCharCode(e.keyCode);
      }

      if (printableChar) {
        const now = Date.now();
        const diff = lastKeyTimeRef.current ? now - lastKeyTimeRef.current : 0;
        if (diff > 800) {
          scanBufferRef.current = '';
        }
        lastKeyTimeRef.current = now;

        if (scanBufferRef.current.length < 512) {
          scanBufferRef.current += printableChar;
        }

        if (tagName === 'BUTTON' && printableChar === ' ') {
          e.preventDefault();
        }

        console.log('[USB Scanner] Buffer terakumulasi:', scanBufferRef.current, `(+${diff}ms)`);

        if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
        scanTimerRef.current = setTimeout(() => {
          const bufferedCode = scanBufferRef.current.trim();
          scanBufferRef.current = '';
          lastKeyTimeRef.current = 0;
          if (bufferedCode.length >= 2) {
            lastUsbSubmitTimeRef.current = Date.now();
            console.log('[USB Scanner] Auto-submit buffer setelah jeda 350ms (scanner tanpa Enter):', bufferedCode);
            handleScanCodeRef.current(bufferedCode, 'usb-auto-timeout');
          }
        }, 350);
      }
    };

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

      // Jika saat kamera masih inisialisasi ternyata USB scanner sudah lebih dulu membuka pop-up absen, segera matikan kamera
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

      if (inputTotal > totalKuota) {
        setErrorMsg(`Gagal simpan presensi: Total input (${inputTotal} orang) melebihi total kuota (${totalKuota} kursi)! Mohon kurangi jumlahnya.`);
        playBuzzerError();
        setIsSubmitting(false);
        return;
      }

      // Anti Race-Condition: 3 detik
      const threeSecAgo = new Date(Date.now() - 3000).toISOString();
      const { data: recentDup } = await supabase
        .from('presensi_log')
        .select('id, created_at')
        .eq('kode_qr', activeItem.kode || String(activeItem.id))
        .gte('created_at', threeSecAgo)
        .limit(1);

      if (recentDup && recentDup.length > 0) {
        setErrorMsg('Peringatan: Presensi untuk kode ini baru saja dicatat dalam 3 detik terakhir (Anti-Duplicate Guard).');
        playBuzzerError();
        setIsSubmitting(false);
        return;
      }

      // 2. Upsert ke presensi_log
      try {
        await upsertPresensiLog({
          kode_qr: activeItem.kode || String(activeItem.id),
          nama_peserta: activeItem.nama || activeItem.namaSantri || 'Peserta',
          tipe_peserta: activeItem.tipe === 'KELUARGA' ? 'KELUARGA' : 'UNDANGAN',
          jalur: jalur,
          panitia_id: jalur === 'BARAT' ? 'panitia-putra' : 'panitia-putri',
          jumlah_l: jumlahL,
          jumlah_p: jumlahP,
          jumlah_balita: jumlahBalita,
          tiket_panggung: isNewlyGivingGold ? 1 : 0,
          catatan: `Scan Pintu ${jalur}`,
        });
      } catch (logErr: any) {
        setErrorMsg(`Gagal mencatat presensi di Supabase: ${logErr.message || logErr}`);
        playBuzzerError();
        setIsSubmitting(false);
        return;
      }

      // 3. Update tiket_panggung_diberi bila perlu
      if (activeItem.tipe === 'KELUARGA' && nextTiketPanggung > 0) {
        await supabase
          .from('peserta_santri')
          .update({
            tiket_panggung_diberi: nextTiketPanggung,
          })
          .eq('id', activeItem.id);
      }

      const totalTerpakai = await syncKuotaTerpakai(activeItem.kode || String(activeItem.id));

      await logAudit({
        panitia_id: jalur === 'BARAT' ? 'PETUGAS_PUTRA' : 'PETUGAS_PUTRI',
        panitia_role: 'PENJAGA_GERBANG',
        aksi: 'TANDAI_HADIR',
        tabel: activeItem.tipe === 'KELUARGA' ? 'peserta_santri' : 'tamu_undangan',
        kode: activeItem.kode || String(activeItem.id),
        nama: activeItem.nama || activeItem.namaSantri || 'Peserta',
        field: 'kuota_terpakai',
        nilai_lama: String(activeItem.kuota.terpakai),
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

      await fetchRecentScans();
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
        pesan: `Presensi berhasil dicatat! Total masuk: ${inputTotal} orang (L:${jumlahL}, P:${jumlahP}).`,
        sisa: Math.max(0, totalKuota - totalTerpakai),
        detail: updatedItem,
      });

      setActiveItem(updatedItem);
    } catch (e: any) {
      console.error('Error during checkin confirmation:', e);
      setErrorMsg(`Gagal memproses presensi: ${e.message || e}`);
    } finally {
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
