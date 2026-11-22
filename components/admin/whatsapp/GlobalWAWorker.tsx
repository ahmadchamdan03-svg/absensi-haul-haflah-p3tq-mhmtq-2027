'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Hourglass, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { getActiveRole } from '@/lib/auth-roles';
import {
  useWaQueue,
  isNetworkResourceError,
  setNetworkPausedState,
  applyWorkerSyncResult,
} from '@/lib/use-wa-queue';

const IDLE_RESET_MS = 30 * 60 * 1000;
const MIN_DELAY_MS = 10 * 1000;
const MAX_CONSECUTIVE_NETWORK_ERRORS = 3;
const NETWORK_PAUSE_MSG = 'Koneksi internet/browser tidak stabil. Antrean dijeda sementara.';

export default function GlobalWAWorker() {
  const pathname = usePathname();
  const isTickingRef = useRef(false);
  const consecutiveNetworkErrorsRef = useRef(0);
  const {
    activeQueueCount,
    sendingItem,
    pendingItems,
    systemState,
    isCooldown,
    cooldownFormatted,
    nextDelaySeconds,
    networkPaused,
    networkPauseMessage,
    resumeNetworkPausedQueue,
  } = useWaQueue();

  const networkPausedRef = useRef(networkPaused);
  useEffect(() => {
    networkPausedRef.current = networkPaused;
  }, [networkPaused]);

  useEffect(() => {
    const role = getActiveRole();
    if (!role || !['ADMIN', 'PENERIMA_TAMU', 'PIMPINAN'].includes(role)) {
      return;
    }

    let isUnmounted = false;
    let nextTimer: ReturnType<typeof setTimeout> | null = null;
    let activeAbortController: AbortController | null = null;

    const clearScheduledTimer = () => {
      if (nextTimer) {
        clearTimeout(nextTimer);
        nextTimer = null;
      }
    };

    const scheduleNextTick = (delayMs: number) => {
      clearScheduledTimer();
      if (isUnmounted || networkPausedRef.current) return;
      const safeDelay = Math.max(1200, Math.min(delayMs, 30000));
      nextTimer = setTimeout(() => {
        runWithCrossTabLock();
      }, safeDelay);
    };

    const registerNetworkError = (errObj: any) => {
      if (isUnmounted) return false;
      if (!isNetworkResourceError(errObj)) return false;

      consecutiveNetworkErrorsRef.current += 1;
      if (consecutiveNetworkErrorsRef.current >= MAX_CONSECUTIVE_NETWORK_ERRORS) {
        networkPausedRef.current = true;
        setNetworkPausedState(true, NETWORK_PAUSE_MSG);
        clearScheduledTimer();
        return true;
      }
      return false;
    };

    const runWorkerTick = async () => {
      if (isTickingRef.current || isUnmounted || networkPausedRef.current) return;
      isTickingRef.current = true;

      let nextWaitMs = 10000;
      const dbController = new AbortController();
      activeAbortController = dbController;
      const dbTimeoutId = setTimeout(() => dbController.abort(), 10000);

      try {
        const [resState, resQueue] = await Promise.all([
          supabase
            .from('wa_system_state')
            .select('batch_count, cooldown_until, last_sent_at')
            .eq('id', 'global')
            .retry(false)
            .abortSignal(dbController.signal)
            .maybeSingle(),
          supabase
            .from('wa_queue')
            .select('id, status, scheduled_at, updated_at')
            .in('status', ['PENDING', 'SENDING'])
            .order('scheduled_at', { ascending: true })
            .order('created_at', { ascending: true })
            .limit(5)
            .retry(false)
            .abortSignal(dbController.signal),
        ]);

        clearTimeout(dbTimeoutId);
        if (isUnmounted) return;

        if (resState.error || resQueue.error) {
          const errObj = resState.error || resQueue.error;
          const paused = registerNetworkError(errObj);
          if (paused) return;
          nextWaitMs = 2500;
          return;
        }

        consecutiveNetworkErrorsRef.current = 0;

        const stateRow = resState.data;
        const activeRows = resQueue.data || [];
        const nowMs = Date.now();
        const cooldownUntilMs = stateRow?.cooldown_until
          ? new Date(stateRow.cooldown_until).getTime()
          : 0;
        const lastSentMs = stateRow?.last_sent_at
          ? new Date(stateRow.last_sent_at).getTime()
          : 0;

        // 1. Jika cooldown baru berakhir atau idle > 30 menit, reset hitungan batch
        const shouldResetExpiredCooldown = Boolean(
          stateRow?.cooldown_until && cooldownUntilMs <= nowMs
        );
        const shouldResetIdleBatch = Boolean(
          stateRow &&
            Number(stateRow.batch_count || 0) > 0 &&
            (!cooldownUntilMs || cooldownUntilMs <= nowMs) &&
            lastSentMs > 0 &&
            nowMs - lastSentMs > IDLE_RESET_MS
        );

        if (shouldResetExpiredCooldown || shouldResetIdleBatch) {
          const apiController = new AbortController();
          activeAbortController = apiController;
          const apiTimeoutId = setTimeout(() => apiController.abort(), 15000);
          try {
            const resetRes = await fetch('/api/whatsapp/queue', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'reset_idle' }),
              signal: apiController.signal,
            });
            clearTimeout(apiTimeoutId);
            if (resetRes.ok) {
              consecutiveNetworkErrorsRef.current = 0;
              const resetJson = await resetRes.json();
              applyWorkerSyncResult({ ...resetJson, action: 'reset_idle' });
              window.dispatchEvent(
                new CustomEvent('wa-queue-processed', {
                  detail: { ...resetJson, action: 'reset_idle' },
                })
              );
            }
          } catch (err) {
            clearTimeout(apiTimeoutId);
            if (registerNetworkError(err)) return;
          }
          nextWaitMs = 2000;
          return;
        }

        // 2. Jika sedang Cooldown, tidur sampai mendekati akhir cooldown (maks 30 detik/cek)
        if (cooldownUntilMs > nowMs) {
          nextWaitMs = Math.min(Math.max(cooldownUntilMs - nowMs + 500, 5000), 30000);
          return;
        }

        // 2b. Jaga jarak minimal 10 detik sejak pengiriman terakhir
        if (lastSentMs > 0 && nowMs - lastSentMs < MIN_DELAY_MS) {
          nextWaitMs = Math.max(1500, lastSentMs + MIN_DELAY_MS - nowMs + 350);
          return;
        }

        if (activeRows.length === 0) {
          nextWaitMs = 10000;
          return;
        }

        const activeSending = activeRows.find((r: any) => r.status === 'SENDING');
        if (activeSending) {
          const sendingUpdatedMs = activeSending.updated_at
            ? new Date(activeSending.updated_at).getTime()
            : nowMs;
          if (nowMs - sendingUpdatedMs <= 2 * 60 * 1000) {
            nextWaitMs = 4000;
            return;
          }
        }

        // 3. Cek apakah pesan PENDING teratas waktunya sudah tiba
        const firstPending = activeRows.find((r: any) => r.status === 'PENDING');
        if (!firstPending) {
          nextWaitMs = 5000;
          return;
        }

        const scheduledMs = new Date(firstPending.scheduled_at).getTime();
        if (scheduledMs > nowMs) {
          nextWaitMs = Math.max(1500, Math.min(scheduledMs - nowMs + 350, 15000));
          return;
        }

        // 4. Kirim 1 pesan berikutnya secara sekuensial dengan AbortController
        const sendController = new AbortController();
        activeAbortController = sendController;
        const sendTimeoutId = setTimeout(() => sendController.abort(), 30000);

        try {
          const processRes = await fetch('/api/whatsapp/queue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'process_next' }),
            signal: sendController.signal,
          });
          clearTimeout(sendTimeoutId);

          if (!processRes.ok) {
            if (processRes.status >= 500) {
              registerNetworkError(new Error(`HTTP ${processRes.status}`));
            }
            nextWaitMs = 5000;
            return;
          }

          consecutiveNetworkErrorsRef.current = 0;
          const json = await processRes.json();
          applyWorkerSyncResult(json);
          window.dispatchEvent(new CustomEvent('wa-queue-processed', { detail: json }));

          if (json?.status === 'PROCESSED' && typeof json.delayMs === 'number') {
            nextWaitMs = Math.max(MIN_DELAY_MS, Math.min(json.delayMs + 350, 15000));
          } else if (json?.status === 'COOLDOWN' || json?.status === 'AUTO_PAUSED_DISCONNECTED') {
            nextWaitMs = 30000;
          } else if (json?.status === 'WAITING_DELAY') {
            nextWaitMs = 4000;
          } else {
            nextWaitMs = 3000;
          }
        } catch (sendErr) {
          clearTimeout(sendTimeoutId);
          if (registerNetworkError(sendErr)) return;
          nextWaitMs = 5000;
        }
      } catch (err) {
        clearTimeout(dbTimeoutId);
        if (registerNetworkError(err)) return;
        if (!isUnmounted) {
          console.warn('[GlobalWAWorker] Worker tick warning:', err);
        }
        nextWaitMs = 5000;
      } finally {
        activeAbortController = null;
        isTickingRef.current = false;
        if (!isUnmounted && !networkPausedRef.current) {
          scheduleNextTick(nextWaitMs);
        }
      }
    };

    const runWithCrossTabLock = async () => {
      if (isUnmounted || networkPausedRef.current) return;
      if (typeof navigator !== 'undefined' && navigator.locks?.request) {
        await navigator.locks.request(
          'haflah_wa_worker_tick_lock',
          { ifAvailable: true },
          async (lock) => {
            if (!lock) {
              // Tab lain sedang memegang lock proses; jadwalkan pengecekan ulang secara tenang
              scheduleNextTick(5000);
              return;
            }
            await runWorkerTick();
          }
        );
      } else {
        await runWorkerTick();
      }
    };

    const handleWakeUp = () => {
      if (isUnmounted || networkPausedRef.current) return;
      if (!isTickingRef.current) {
        scheduleNextTick(250);
      }
    };

    const handleResumeFromPause = () => {
      if (isUnmounted) return;
      consecutiveNetworkErrorsRef.current = 0;
      networkPausedRef.current = false;
      scheduleNextTick(250);
    };

    window.addEventListener('wa-queue-wake', handleWakeUp);
    window.addEventListener('wa-queue-resume', handleResumeFromPause);
    runWithCrossTabLock();

    return () => {
      isUnmounted = true;
      clearScheduledTimer();
      activeAbortController?.abort();
      window.removeEventListener('wa-queue-wake', handleWakeUp);
      window.removeEventListener('wa-queue-resume', handleResumeFromPause);
    };
  }, []);

  // Di halaman /admin/whatsapp sudah terdapat banner status khusus yang lengkap
  if (pathname.startsWith('/admin/whatsapp')) {
    return null;
  }

  if (networkPaused) {
    return (
      <div className="fixed bottom-6 right-6 z-40 max-w-md px-4 py-3 rounded-2xl shadow-2xl border bg-rose-950/95 text-rose-50 border-rose-400/70 backdrop-blur-md flex items-center justify-between space-x-3">
        <div className="flex items-center space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" />
          <span className="text-xs font-bold leading-snug">
            {networkPauseMessage || NETWORK_PAUSE_MSG}
          </span>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => resumeNetworkPausedQueue()}
            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer"
          >
            Coba Lagi
          </button>
          <Link
            href="/admin/whatsapp"
            className="text-[11px] font-bold underline text-rose-200 hover:text-white"
          >
            Buka
          </Link>
        </div>
      </div>
    );
  }

  if (!isCooldown && activeQueueCount === 0) {
    return null;
  }

  const displayedBatchCount =
    isCooldown && systemState.batch_count === 0 ? 30 : systemState.batch_count;

  return (
    <Link
      href="/admin/whatsapp"
      className={`fixed bottom-6 right-6 z-40 max-w-md px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-md flex items-center space-x-3 transition-all hover:brightness-105 ${
        isCooldown
          ? 'bg-amber-950/95 text-amber-50 border-amber-400/70'
          : 'bg-[#0F2C59]/95 text-white border-sky-400/60'
      }`}
    >
      {isCooldown ? (
        <Hourglass className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
      ) : (
        <Loader2 className="w-4 h-4 text-amber-300 animate-spin shrink-0" />
      )}
      <div className="text-xs font-bold leading-snug">
        {isCooldown ? (
          <span>
            Mode Cooldown: Menunggu{' '}
            <span className="font-mono text-amber-300">{cooldownFormatted}</span> sebelum mengirim batch berikutnya ({displayedBatchCount}/30 pesan terkirim)
          </span>
        ) : (
          <span>
            Mengirim pesan... (Sisa antrean: {activeQueueCount})
            {sendingItem?.nama_target
              ? ` · Sedang kirim: ${sendingItem.nama_target}`
              : nextDelaySeconds > 0 && pendingItems[0]
              ? ` · Jeda acak: ${nextDelaySeconds}s`
              : ''}
          </span>
        )}
      </div>
    </Link>
  );
}
