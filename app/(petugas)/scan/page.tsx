'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/audit-log';
import { JalurPemeriksaan, CheckinResult } from '@/lib/types';
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
  const scanTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Handler memproses kode QR
  const handleScanCode = useCallback(async (scannedRaw: string) => {
    let cleanCode = scannedRaw.trim();
    if (cleanCode.includes('/u/')) {
      const parts = cleanCode.split('/u/');
      if (parts.length >= 2) cleanCode = parts[1].split('?')[0].split('#')[0];
    } else if (cleanCode.includes('.')) {
      const parts = cleanCode.split('.');
      if (parts.length >= 2) cleanCode = parts[1];
    }

    cleanCode = cleanCode.toUpperCase().trim();
    if (cleanCode.length > 50) cleanCode = cleanCode.substring(0, 50);
    if (!cleanCode || cleanCode.length < 2) return;

    setErrorMsg(null);
    setCheckinResult(null);

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Scan Debug] Submit: "${cleanCode}" Timestamp: ${Date.now()}`);
    }

    try {
      // 1. Cek Peserta Santri
      let { data: santri } = await supabase
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
        const errMsg = `Kode QR "${cleanCode}" TIDAK TERDAFTAR dalam basis data!`;
        setErrorMsg(errMsg);
        playBuzzerError();
        setActiveItem(null);
        setScanFeedback({
          type: 'error',
          message: errMsg,
        });
        setTimeout(() => setScanFeedback(null), 3000);
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
        ? Number(entity.kuota_dasar || 2)
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

      const itemObj: ScanActiveItem = {
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
          message: `QR ${cleanCode} Berhasil Terverifikasi`,
          name: itemObj.nama,
          kategori: itemObj.kategori,
        });
      }
      setTimeout(() => setScanFeedback(null), 2500);

      setActiveItem(itemObj);
      setKodeInput(cleanCode);

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
      const msg = `Terjadi kesalahan sistem saat memverifikasi kode: ${err.message || err}`;
      setErrorMsg(msg);
      playBuzzerError();
      setScanFeedback({
        type: 'error',
        message: msg,
      });
      setTimeout(() => setScanFeedback(null), 3000);
    }
  }, [stopCamera]);

  // Global USB barcode listener
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();

    const handleKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      if (e.ctrlKey || e.altKey || e.metaKey) return;

      if (e.key === 'Enter') {
        const bufferedCode = scanBufferRef.current.trim();
        if (bufferedCode.length >= 3) {
          handleScanCode(bufferedCode);
        }
        scanBufferRef.current = '';
        if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
        e.preventDefault();
        return;
      }

      if (e.key.length === 1) {
        if (scanBufferRef.current.length < 50) {
          scanBufferRef.current += e.key;
        }
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
          fps: 10,
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

  // Handler Check / Uncheck Kartu Hitam Gold
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
          aksi: 'CHECK_KARTU_HITAM_GOLD',
          tabel: 'peserta_santri',
          kode: activeItem.kode,
          nama: activeItem.nama,
          field: 'tiket_panggung_diberi',
          nilai_lama: '0',
          nilai_baru: '1',
          catatan: 'Diberikan Kartu Hitam Gold via Scanner Gerbang',
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
        console.error('Error checking Kartu Hitam Gold:', err);
        setErrorMsg(`Gagal mengupdate Kartu Hitam Gold: ${err.message || err}`);
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
        aksi: 'UNCHECK_KARTU_HITAM_GOLD',
        tabel: 'peserta_santri',
        kode: activeItem.kode,
        nama: activeItem.nama,
        field: 'tiket_panggung_diberi',
        nilai_lama: '1',
        nilai_baru: '0',
        catatan: 'Reset/Uncheck Kartu Hitam Gold via Scanner Gerbang',
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
      console.error('Error resetting Kartu Hitam Gold:', err);
      setErrorMsg(`Gagal mereset Kartu Hitam Gold: ${err.message || err}`);
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
      setErrorMsg('Masukkan jumlah orang yang hadir (L/P) atau centang Kartu Hitam Gold.');
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
