'use client';

import { useEffect, useRef } from 'react';

// Batas waktu buffer USB scanner (reset + auto-submit fallback jika hardware tidak mengirim Enter)
export const USB_BUFFER_TIMEOUT_MS = 500;
// Jeda maksimal antar karakter yang dianggap sebagai "burst" dari alat scan USB (bukan ketikan manusia)
export const USB_BURST_INTERVAL_MS = 80;
// Kapasitas maksimal buffer USB (cukup untuk URL panjang + token HMAC)
export const USB_BUFFER_MAX_LENGTH = 512;

interface UseUsbScannerProps {
  onScanCode: (scannedRaw: string, source: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

export function useUsbScanner({ onScanCode, inputRef }: UseUsbScannerProps) {
  const scanBufferRef = useRef('');
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastKeyTimeRef = useRef(0);
  const fastKeyCountRef = useRef(0);
  const lastUsbSubmitTimeRef = useRef(0);

  // Ref ke callback terbaru
  const onScanCodeRef = useRef(onScanCode);
  onScanCodeRef.current = onScanCode;

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
      onScanCodeRef.current(value, source);
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
    };
  }, [inputRef]);

  return {
    scanBufferRef,
  };
}
