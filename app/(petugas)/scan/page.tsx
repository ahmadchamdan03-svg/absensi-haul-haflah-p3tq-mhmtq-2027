'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { logAudit } from '@/lib/audit-log';
import { JalurPemeriksaan, CheckinResult } from '@/lib/types';
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
} from '@/components/petugas/scan/types';
import { useUsbScanner } from '@/lib/hooks/useUsbScanner';
import { useCameraScanner } from '@/lib/hooks/useCameraScanner';
import {
  extractCleanScanCode,
  fetchPesertaByCode,
  triggerSuccessPresensiEffect,
  upsertPresensiLog,
} from '@/lib/presensi-actions';

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
  const [loadingScans, setLoadingScans] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Visual feedback overlay
  const [scanFeedback, setScanFeedback] = useState<ScanFeedback | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSubmittedScanRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

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
    } finally {
      setLoadingScans(false);
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

      const {
        itemObj,
        totalKuota,
        terpakai,
        isBilGhoib,
        isAlreadyGiven,
      } = await fetchPesertaByCode(cleanCode);

      setKartuHitamGoldDiberi(isAlreadyGiven || (totalKuota - terpakai) === 0);
      setSerahkanTiketEmas(isAlreadyGiven || (totalKuota - terpakai) === 0);

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
          message: `QR ${itemObj.kode} Berhasil Terverifikasi`,
          name: itemObj.nama,
          kategori: itemObj.kategori,
        });
      }
      feedbackTimerRef.current = setTimeout(() => setScanFeedback(null), 2500);

      setActiveItem(itemObj);

      // Konsep Scan Bertahap: input L/P selalu dimulai dari 0 (= jumlah orang yang BARU datang).
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
  }, [showScanError]);

  // Hook 1: USB / Bluetooth Hardware Scanner Listener
  useUsbScanner({
    onScanCode: handleScanCode,
    inputRef,
  });

  // Hook 2: Camera Scanner Lifecycle & Facing Mode
  const {
    cameraActive,
    cameraError,
    facingMode,
    isInitializing,
    startCamera,
    stopCamera,
    toggleFacingMode,
  } = useCameraScanner({
    onScanCode: handleScanCode,
    activeItem,
    checkinResult,
  });

  // Handler Check / Uncheck Kartu Cream
  const handleToggleKartuHitamGold = async () => {
    if (!activeItem || isUpdatingKartuGold) return;
    const isCurrentlyChecked = Number(activeItem.kuota?.tiketPanggungDiberi || 0) > 0 || kartuHitamGoldDiberi || serahkanTiketEmas;

    if (isCurrentlyChecked) {
      setShowResetConfirmModal(true);
    } else {
      setIsUpdatingKartuGold(true);
      try {
        const res = await fetch('/api/presensi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'toggle_tiket_panggung',
            id: activeItem.id,
            kode: activeItem.kode,
            tiket_panggung_diberi: 1,
          }),
        });
        const resJson = await res.json();
        if (!res.ok || !resJson.ok) throw new Error(resJson.error || 'Gagal update tiket panggung');

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
      const res = await fetch('/api/presensi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_tiket_panggung',
          id: activeItem.id,
          kode: activeItem.kode,
          tiket_panggung_diberi: 0,
        }),
      });
      const resJson = await res.json();
      if (!res.ok || !resJson.ok) throw new Error(resJson.error || 'Gagal reset tiket panggung');

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

      // Anti-Duplicate Guard 3 detik (In-memory guard - instant response)
      const now = Date.now();
      if (
        lastSubmittedScanRef.current &&
        lastSubmittedScanRef.current.code === kodeTarget &&
        now - lastSubmittedScanRef.current.time < 3000
      ) {
        setErrorMsg('Peringatan: Presensi untuk kode ini baru saja dicatat dalam 3 detik terakhir (Anti-Duplicate Guard).');
        playBuzzerError();
        setIsSubmitting(false);
        return;
      }
      lastSubmittedScanRef.current = { code: kodeTarget, time: now };

      const prevL = Number(activeItem.kuota?.terpakaiL || 0);
      const prevP = Number(activeItem.kuota?.terpakaiP || 0);
      const prevBalita = Number(activeItem.kuota?.terpakaiBalita || 0);
      const prevTiketPanggung = Number(activeItem.kuota?.tiketPanggungDiberi || 0) > 0 ? 1 : 0;

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

      // Satukan update tiket_panggung_diberi ke dalam satu panggilan update() lewat extraSantriData
      const extraSantriData = (activeItem.tipe === 'KELUARGA' && nextTiketPanggung > 0)
        ? { tiket_panggung_diberi: nextTiketPanggung }
        : undefined;

      // 2. Upsert ke presensi_log + sync kuota_terpakai via server API secara paralel
      let queued = false;
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout 5000ms: Koneksi lambat')), 5000)
        );
        await Promise.race([
          upsertPresensiLog({
            kode_qr: kodeTarget,
            entityId: activeItem.id,
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
            existingId: activeItem.kuota?.existingLogId,
          }),
          timeoutPromise,
        ]);
      } catch (logErr: any) {
        queued = true;
        console.warn('Checkin online gagal, memasukkan ke antrean_presensi_gagal:', logErr);
        try {
          await supabase.from('antrean_presensi_gagal').insert([
            {
              kode_qr: kodeTarget,
              pintu_masuk: jalur,
              operator: jalur === 'BARAT' ? 'panitia-putra' : 'panitia-putri',
              alasan_gagal: logErr?.message || 'Timeout / Gangguan Koneksi',
              status: 'PENDING',
            },
          ]);
        } catch (queueErr) {
          console.error('Gagal insert ke antrean_presensi_gagal:', queueErr);
        }
      }

      const totalTerpakai = nextTotal;

      // Tampilkan hasil sukses SEGERA (Optimistic & Super Fast Response < 1 detik)
      triggerSuccessPresensiEffect();

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
        pesan: queued
          ? `Absen masuk antrean, akan diproses ulang otomatis. Tambahan masuk: ${inputTotal} orang (L:${jumlahL}, P:${jumlahP}).`
          : `Presensi berhasil dicatat! Tambahan masuk: ${inputTotal} orang (L:${jumlahL}, P:${jumlahP}). Total kehadiran kini: ${nextTotal} orang (L:${nextL}, P:${nextP}).`,
        sisa: Math.max(0, totalKuota - totalTerpakai),
        detail: updatedItem,
      });

      setActiveItem(updatedItem);
      setIsSubmitting(false);

      // Asinkronkan proses non-kritis (fire-and-forget di background tanpa menahan tampilan sukses)
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
      <ScanRecentHistory recentScans={recentScans} loading={loadingScans} />

      {/* DENAH MODAL */}
      {isDenahOpen && (
        <DenahModal isOpen={isDenahOpen} onClose={() => setIsDenahOpen(false)} />
      )}
    </div>
  );
}
