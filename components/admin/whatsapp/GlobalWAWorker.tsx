'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Hourglass } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { getActiveRole } from '@/lib/auth-roles';
import { useWaQueue } from '@/lib/use-wa-queue';

const IDLE_RESET_MS = 30 * 60 * 1000;

export default function GlobalWAWorker() {
  const pathname = usePathname();
  const isTickingRef = useRef(false);
  const {
    activeQueueCount,
    sendingItem,
    pendingItems,
    systemState,
    isCooldown,
    cooldownFormatted,
    nextDelaySeconds,
    refreshWaQueue,
  } = useWaQueue();

  useEffect(() => {
    const role = getActiveRole();
    if (!role || !['ADMIN', 'PENERIMA_TAMU', 'PIMPINAN'].includes(role)) {
      return;
    }

    const runWorkerTick = async () => {
      if (isTickingRef.current) return;
      isTickingRef.current = true;

      try {
        const [{ data: stateRow }, { data: activeRows }] = await Promise.all([
          supabase
            .from('wa_system_state')
            .select('*')
            .eq('id', 'global')
            .maybeSingle(),
          supabase
            .from('wa_queue')
            .select('id, status, scheduled_at, updated_at')
            .in('status', ['PENDING', 'SENDING'])
            .order('scheduled_at', { ascending: true })
            .order('created_at', { ascending: true })
            .limit(10),
        ]);

        const nowMs = Date.now();
        const cooldownUntilMs = stateRow?.cooldown_until
          ? new Date(stateRow.cooldown_until).getTime()
          : 0;
        const lastSentMs = stateRow?.last_sent_at
          ? new Date(stateRow.last_sent_at).getTime()
          : 0;

        // 1. Jika cooldown baru berakhir atau tidak ada aktivitas kirim > 30 menit, sinkronkan reset otomatis
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
          const resetRes = await fetch('/api/whatsapp/queue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'reset_idle' }),
          });
          if (resetRes.ok) {
            window.dispatchEvent(new CustomEvent('wa-queue-processed', { detail: { action: 'reset_idle' } }));
          }
          return;
        }

        // 2. Jika sedang Cooldown, jangan kirim pesan
        if (cooldownUntilMs > nowMs) {
          return;
        }

        const list = activeRows || [];
        const activeSending = list.find((r: any) => r.status === 'SENDING');
        if (activeSending) {
          const sendingUpdatedMs = activeSending.updated_at
            ? new Date(activeSending.updated_at).getTime()
            : nowMs;
          // Pulihkan hanya jika macet > 2 menit
          if (nowMs - sendingUpdatedMs <= 2 * 60 * 1000) {
            return;
          }
        }

        // 3. Cek apakah ada pesan PENDING yang waktunya sudah tiba (scheduled_at <= now)
        const duePending = list.find(
          (r: any) => r.status === 'PENDING' && new Date(r.scheduled_at).getTime() <= nowMs
        );
        if (!duePending) {
          return;
        }

        const processRes = await fetch('/api/whatsapp/queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'process_next' }),
        });

        if (processRes.ok) {
          const json = await processRes.json();
          await refreshWaQueue();
          window.dispatchEvent(new CustomEvent('wa-queue-processed', { detail: json }));
        }
      } catch (err) {
        console.warn('[GlobalWAWorker] Worker tick warning:', err);
      } finally {
        isTickingRef.current = false;
      }
    };

    runWorkerTick();
    const interval = setInterval(runWorkerTick, 2000);
    return () => {
      clearInterval(interval);
    };
  }, [pathname, refreshWaQueue]);

  // Di halaman /admin/whatsapp sudah terdapat banner status khusus yang lengkap
  if (pathname.startsWith('/admin/whatsapp')) {
    return null;
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
