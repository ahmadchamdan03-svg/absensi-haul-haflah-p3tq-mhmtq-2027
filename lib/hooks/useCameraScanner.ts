'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseCameraScannerProps {
  onScanCode: (decodedText: string, source: string) => void;
  activeItem: any;
  checkinResult: any;
}

export function useCameraScanner({
  onScanCode,
  activeItem,
  checkinResult,
}: UseCameraScannerProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isInitializing, setIsInitializing] = useState(false);

  const scannerRef = useRef<any>(null);
  const isScanningRef = useRef(false);

  const onScanCodeRef = useRef(onScanCode);
  onScanCodeRef.current = onScanCode;

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

  // Inisialisasi & Start Kamera
  const startCamera = useCallback(async (mode: 'environment' | 'user' = facingMode) => {
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
          onScanCodeRef.current(decodedText, 'camera');
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
  }, [facingMode]);

  // Switch Kamera (Depan / Belakang)
  const toggleFacingMode = useCallback(() => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  }, [facingMode, startCamera]);

  useEffect(() => {
    if (!activeItem && !checkinResult) {
      startCamera(facingMode);
    }

    return () => {
      stopCamera();
    };
  }, [activeItem, checkinResult, facingMode, startCamera, stopCamera]);

  return {
    cameraActive,
    cameraError,
    facingMode,
    isInitializing,
    startCamera,
    stopCamera,
    toggleFacingMode,
  };
}
