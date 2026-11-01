'use client';

import { useState, useEffect } from 'react';

export interface DevicePerformance {
  isDesktop: boolean;
  isHighEndMobile: boolean;
  isLowEnd: boolean;
  isReady: boolean;
  hasWebGL: boolean;
}

/**
 * Custom hook untuk mendeteksi kapabilitas performa perangkat
 * - Desktop: PC/Laptop dengan mouse & keyboard
 * - High-End Mobile: Minimal 4 core CPU & RAM >= 3GB, OS modern, WebGL didukung
 * - Low-End: CPU < 4 core, RAM rendah, WebGL tidak didukung, atau prefers-reduced-motion
 */
export function useDevicePerformance(): DevicePerformance {
  const [deviceInfo, setDeviceInfo] = useState<DevicePerformance>({
    isDesktop: true,
    isHighEndMobile: false,
    isLowEnd: false,
    isReady: false,
    hasWebGL: true,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Cek dukungan WebGL
    let hasWebGL = false;
    try {
      const canvas = document.createElement('canvas');
      hasWebGL = Boolean(
        window.WebGLRenderingContext &&
          (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch (_) {
      hasWebGL = false;
    }

    // 2. Cek prefers-reduced-motion (Aksesibilitas & Hemat Daya)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 3. Deteksi Mobile / Tablet vs Desktop
    // Longgarkan deteksi: setiap perangkat dengan lebar layar >= 1024 atau tanpa ontouchstart adalah Desktop
    const ua = navigator.userAgent || '';
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
    const hasTouch = 'ontouchstart' in window || (navigator && navigator.maxTouchPoints > 0);
    const isWideScreen = window.innerWidth >= 1024;

    const isDesktop = !isMobileUA && (isWideScreen || !hasTouch);

    // 4. Deteksi Hardware Capability (Core CPU & Memory) untuk Mobile
    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as any).deviceMemory || 4;

    // Cek versi modern OS (Android 9+ atau iOS 13+)
    let isModernOS = true;
    if (/Android/i.test(ua)) {
      const match = ua.match(/Android\s([0-9\.]+)/i);
      if (match && parseFloat(match[1]) < 9.0) {
        isModernOS = false;
      }
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
      const match = ua.match(/OS\s([0-9_]+)/i);
      if (match) {
        const version = parseFloat(match[1].replace('_', '.'));
        if (version < 13.0) {
          isModernOS = false;
        }
      }
    }

    // High-End Mobile: mobile dengan WebGL dan hardware cukup
    const isHighEndMobile =
      !isDesktop &&
      hasWebGL &&
      !prefersReducedMotion &&
      cores >= 2 &&
      memory >= 2 &&
      isModernOS;

    // Low-End: WebGL tidak didukung atau mobile dengan spec sangat rendah
    const isLowEnd =
      !hasWebGL ||
      (!isDesktop && !isHighEndMobile);

    setDeviceInfo({
      isDesktop: isDesktop && hasWebGL,
      isHighEndMobile,
      isLowEnd,
      isReady: true,
      hasWebGL,
    });
  }, []);

  return deviceInfo;
}
