'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Hourglass } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { getActiveRole } from '@/lib/auth-roles';
import {
  useWaQueue,
  isNetworkResourceError,
  getWaQueueStoreSystemState,
  applyWorkerSyncResult,
} from '@/lib/use-wa-queue';

const IDLE_RESET_MS = 30 * 60 * 1000;
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
    isCooldown,
    cooldownFormatted,
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

    const triggerNetworkCooldown = async () => {
      consecutiveNetworkErrorsRef.current = 0;
      clearScheduledTimer();

      const nowMs = Date.now();
      const nowIso = new Date(nowMs).toISOString();
      const cooldownMs = (30 + Math.random() * 30) * 60 * 1000;
      const cooldownUntilIso = new Date(nowMs + cooldownMs).toISOString();

      const cdController = new AbortController();
      const cdTimeoutId = setTimeout(() => cdController.abort(), 10000);
      let updatedStateRow: any = null;

      try {
        const [, stateUpdateRes] = await Promise.allSettled([
          supabase
            .from('wa_queue')
            .update({
              status: 'PENDING',
              updated_at: nowIso,
            })
            .eq('status', 'SENDING')
            .abortSignal(cdController.signal),
          supabase
            .from('wa_system_state')
            .update({
              cooldown_until: cooldownUntilIso,
              batch_count: 0,
              updated_at: nowIso,
            })
            .eq('id', 'global')
            .select('id, batch_count, cooldown_until, last_sent_at, updated_at')
            .abortSignal(cdController.signal)
            .maybeSingle(),
        ]);

        if (
          stateUpdateRes.status === 'fulfilled' &&
          !stateUpdateRes.value.error &&
          stateUpdateRes.value.data
        ) {
          updatedStateRow = stateUpdateRes.value.data;
        }
      } catch (cdErr) {
        console.warn('[GlobalWAWorker] Gagal menyimpan cooldown error jaringan:', cdErr);
      } finally {
        clearTimeout(cdTimeoutId);
      }

      if (isUnmounted) return;

      const fallbackState = {
        ...getWaQueueStoreSystemState(),
        id: 'global',
        batch_count: 0,
        cooldown_until: cooldownUntilIso,
        updated_at: nowIso,
      };
      const nextState = updatedStateRow || fallbackState;

      applyWorkerSyncResult({
        status: 'COOLDOWN',
        state: nextState,
        resetSendingToPending: true,
      });
      window.dispatchEvent(
        new CustomEvent('wa-queue-processed', {
          detail: {
            status: 'COOLDOWN',
            reason: 'NETWORK_ERROR_COOLDOWN',
            state: nextState,
            resetSendingToPending: true,
          },
        })
      );
    };

    const registerNetworkError = async (
      errObj: any,
      forceCount = false
    ): Promise<boolean> => {
      if (isUnmounted) return false;
      if (!forceCount && !isNetworkResourceError(errObj)) return false;

      // Jangan reset timer cooldown jika sistem sudah berada dalam Mode Cooldown Global aktif
      const currentState = getWaQueueStoreSystemState();
      const existingCooldownMs = currentState?.cooldown_until
        ? new Date(currentState.cooldown_until).getTime()
        : 0;
      if (existingCooldownMs > Date.now()) {
        return false;
      }

      consecutiveNetworkErrorsRef.current += 1;
      if (consecutiveNetworkErrorsRef.current >= MAX_CONSECUTIVE_NETWORK_ERRORS) {
        await triggerNetworkCooldown();
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
          const triggeredCooldown = await registerNetworkError(errObj);
          nextWaitMs = triggeredCooldown ? 30000 : 2500;
          return;
        }

        const stateRow = resState.data;
        if (stateRow) {
          const prevStore = getWaQueueStoreSystemState();
          if (
            prevStore.cooldown_until !== stateRow.cooldown_until ||
            prevStore.batch_count !== stateRow.batch_count ||
            prevStore.last_sent_at !== stateRow.last_sent_at
          ) {
            applyWorkerSyncResult({
              state: {
                id: 'global',
                batch_count: stateRow.batch_count,
                cooldown_until: stateRow.cooldown_until,
                last_sent_at: stateRow.last_sent_at,
              },
            });
          }
        }
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
            } else if (resetRes.status >= 500) {
              const triggeredCooldown = await registerNetworkError(
                new Error(`HTTP ${resetRes.status}`),
                true
              );
              nextWaitMs = triggeredCooldown ? 30000 : 2500;
              return;
            }
          } catch (err) {
            clearTimeout(apiTimeoutId);
            const triggeredCooldown = await registerNetworkError(err);
            nextWaitMs = triggeredCooldown ? 30000 : 2500;
            return;
          }
          nextWaitMs = 2000;
          return;
        }

        // 2. Jika sedang Cooldown, tidur sampai mendekati akhir cooldown (maks 30 detik/cek)
        if (cooldownUntilMs > nowMs) {
          consecutiveNetworkErrorsRef.current = 0;
          nextWaitMs = Math.min(Math.max(cooldownUntilMs - nowMs + 500, 1500), 30000);
          return;
        }

        // 2b. Jaga jarak minimal 10 detik sejak pengiriman terakhir
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
              const triggeredCooldown = await registerNetworkError(
                new Error(`HTTP ${processRes.status}`),
                true
              );
              nextWaitMs = triggeredCooldown ? 30000 : 2500;
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
          } else if (json?.status === 'COOLDOWN' || json?.status === 'AUTO_PAUSED_DISCONNECTED') {
            nextWaitMs = 30000;
          } else if (json?.status === 'WAITING_DELAY') {
            nextWaitMs = 4000;
          } else {
            nextWaitMs = 3000;
          }
        } catch (sendErr) {
          clearTimeout(sendTimeoutId);
          const triggeredCooldown = await registerNetworkError(sendErr);
          nextWaitMs = triggeredCooldown ? 30000 : 2500;
          return;
        }
      } catch (err) {
        clearTimeout(dbTimeoutId);
        const triggeredCooldown = await registerNetworkError(err);
        if (!triggeredCooldown && !isUnmounted) {
          console.warn('[GlobalWAWorker] Worker tick warning:', err);
        }
        nextWaitMs = triggeredCooldown ? 30000 : 2500;
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

  if (!isCooldown && activeQueueCount === 0) {
    return null;
  }

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
            <span className="font-mono text-amber-300">{cooldownFormatted}</span> sebelum melanjutkan pengiriman. (Sistem mendeteksi gangguan jaringan atau perangkat WhatsApp terputus).
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
