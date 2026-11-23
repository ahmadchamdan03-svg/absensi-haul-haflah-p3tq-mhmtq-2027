'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { getActiveRole } from '@/lib/auth-roles';
import {
  useWaQueue,
  isNetworkResourceError,
  applyWorkerSyncResult,
} from '@/lib/use-wa-queue';

const MIN_DELAY_MS = 10 * 1000;
const MAX_CONSECUTIVE_NETWORK_ERRORS = 3;

export default function GlobalWAWorker() {
  const pathname = usePathname();
  const isTickingRef = useRef(false);
  const consecutiveNetworkErrorsRef = useRef(0);
  const {
    activeQueueCount,
    sendingItem,
    pendingItems,
    nextDelaySeconds,
  } = useWaQueue();

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
      if (isUnmounted) return;
      const safeDelay = Math.max(1200, Math.min(delayMs, 30000));
      nextTimer = setTimeout(() => {
        runWithCrossTabLock();
      }, safeDelay);
    };

    const recoverFromNetworkErrors = async () => {
      consecutiveNetworkErrorsRef.current = 0;
      clearScheduledTimer();

      const nowIso = new Date().toISOString();
      const recController = new AbortController();
      const recTimeoutId = setTimeout(() => recController.abort(), 10000);

      try {
        await supabase
          .from('wa_queue')
          .update({
            status: 'PENDING',
            updated_at: nowIso,
          })
          .eq('status', 'SENDING')
          .abortSignal(recController.signal);
      } catch (recErr) {
        console.warn('[GlobalWAWorker] Gagal mengembalikan status SENDING ke PENDING:', recErr);
      } finally {
        clearTimeout(recTimeoutId);
      }

      if (isUnmounted) return;
      applyWorkerSyncResult({ resetSendingToPending: true });
    };

    const registerNetworkError = async (
      errObj: any,
      forceCount = false
    ): Promise<boolean> => {
      if (isUnmounted) return false;
      if (!forceCount && !isNetworkResourceError(errObj)) return false;

      consecutiveNetworkErrorsRef.current += 1;
      if (consecutiveNetworkErrorsRef.current >= MAX_CONSECUTIVE_NETWORK_ERRORS) {
        await recoverFromNetworkErrors();
        return true;
      }
      return false;
    };

    const runWorkerTick = async () => {
      if (isTickingRef.current || isUnmounted) return;
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
          const recovered = await registerNetworkError(errObj);
          nextWaitMs = recovered ? 15000 : 2500;
          return;
        }

        const stateRow = resState.data;
        const activeRows = resQueue.data || [];
        const nowMs = Date.now();
        const lastSentMs = stateRow?.last_sent_at
          ? new Date(stateRow.last_sent_at).getTime()
          : 0;

        // Jaga jarak minimal 10 detik sejak pengiriman terakhir
        if (lastSentMs > 0 && nowMs - lastSentMs < MIN_DELAY_MS) {
          consecutiveNetworkErrorsRef.current = 0;
          nextWaitMs = Math.max(1500, lastSentMs + MIN_DELAY_MS - nowMs + 350);
          return;
        }

        if (activeRows.length === 0) {
          consecutiveNetworkErrorsRef.current = 0;
          nextWaitMs = 10000;
          return;
        }

        const activeSending = activeRows.find((r: any) => r.status === 'SENDING');
        if (activeSending) {
          const sendingUpdatedMs = activeSending.updated_at
            ? new Date(activeSending.updated_at).getTime()
            : nowMs;
          if (nowMs - sendingUpdatedMs <= 2 * 60 * 1000) {
            consecutiveNetworkErrorsRef.current = 0;
            nextWaitMs = 4000;
            return;
          }
        }

        // 3. Cek apakah pesan PENDING teratas waktunya sudah tiba
        const firstPending = activeRows.find((r: any) => r.status === 'PENDING');
        if (!firstPending) {
          consecutiveNetworkErrorsRef.current = 0;
          nextWaitMs = 5000;
          return;
        }

        const scheduledMs = new Date(firstPending.scheduled_at).getTime();
        if (scheduledMs > nowMs) {
          consecutiveNetworkErrorsRef.current = 0;
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
              const recovered = await registerNetworkError(
                new Error(`HTTP ${processRes.status}`),
                true
              );
              nextWaitMs = recovered ? 15000 : 2500;
            } else {
              nextWaitMs = 5000;
            }
            return;
          }

          consecutiveNetworkErrorsRef.current = 0;
          const json = await processRes.json();
          applyWorkerSyncResult(json);
          window.dispatchEvent(new CustomEvent('wa-queue-processed', { detail: json }));

          if (json?.status === 'PROCESSED' && typeof json.delayMs === 'number') {
            nextWaitMs = Math.max(MIN_DELAY_MS, Math.min(json.delayMs + 350, 15000));
          } else if (
            json?.status === 'RETRY_DISCONNECTED' ||
            json?.status === 'AUTO_PAUSED_DISCONNECTED'
          ) {
            nextWaitMs = 15000;
          } else if (json?.status === 'WAITING_DELAY') {
            nextWaitMs = 4000;
          } else {
            nextWaitMs = 3000;
          }
        } catch (sendErr) {
          clearTimeout(sendTimeoutId);
          const recovered = await registerNetworkError(sendErr);
          nextWaitMs = recovered ? 15000 : 2500;
          return;
        }
      } catch (err) {
        clearTimeout(dbTimeoutId);
        const recovered = await registerNetworkError(err);
        if (!recovered && !isUnmounted) {
          console.warn('[GlobalWAWorker] Worker tick warning:', err);
        }
        nextWaitMs = recovered ? 15000 : 2500;
      } finally {
        activeAbortController = null;
        isTickingRef.current = false;
        if (!isUnmounted) {
          scheduleNextTick(nextWaitMs);
        }
      }
    };

    const runWithCrossTabLock = async () => {
      if (isUnmounted) return;
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
      if (isUnmounted) return;
      if (!isTickingRef.current) {
        scheduleNextTick(250);
      }
    };

    window.addEventListener('wa-queue-wake', handleWakeUp);
    runWithCrossTabLock();

    return () => {
      isUnmounted = true;
      clearScheduledTimer();
      activeAbortController?.abort();
      window.removeEventListener('wa-queue-wake', handleWakeUp);
    };
  }, []);

  // Di halaman /admin/whatsapp sudah terdapat banner status khusus yang lengkap
  if (pathname.startsWith('/admin/whatsapp')) {
    return null;
  }

  if (activeQueueCount === 0) {
    return null;
  }

  return (
    <Link
      href="/admin/whatsapp"
      className="fixed bottom-6 right-6 z-40 max-w-md px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-md flex items-center space-x-3 transition-all hover:brightness-105 bg-[#0F2C59]/95 text-white border-sky-400/60"
    >
      <Loader2 className="w-4 h-4 text-amber-300 animate-spin shrink-0" />
      <div className="text-xs font-bold leading-snug">
        <span>
          Mengirim pesan... (Sisa antrean: {activeQueueCount})
          {sendingItem?.nama_target
            ? ` · Sedang kirim: ${sendingItem.nama_target}`
            : nextDelaySeconds > 0 && pendingItems[0]
            ? ` · Jeda acak: ${nextDelaySeconds}s`
            : ''}
        </span>
      </div>
    </Link>
  );
}
