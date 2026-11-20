'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface WaQueueItem {
  id: string;
  target_hp: string;
  message: string;
  nama_target: string;
  status: 'PENDING' | 'SENDING' | 'SUCCESS' | 'FAILED';
  created_at: string;
  scheduled_at: string;
  target_table?: string | null;
  target_id?: string | null;
  target_kode?: string | null;
  target_column?: string | null;
  tipe_pesan?: string | null;
  error_message?: string | null;
  sent_at?: string | null;
  updated_at?: string | null;
}

export interface WaSystemState {
  id: string;
  batch_count: number;
  cooldown_until: string | null;
  last_sent_at: string | null;
  updated_at?: string | null;
}

export interface WaEnqueuePayload {
  target_hp: string;
  message: string;
  nama_target: string;
  target_table?: 'peserta_santri' | 'tamu_undangan';
  target_id?: string | number;
  target_kode?: string;
  target_column?: string;
  tipe_pesan?: string;
  scheduled_at?: string;
}

const DEFAULT_SYSTEM_STATE: WaSystemState = {
  id: 'global',
  batch_count: 0,
  cooldown_until: null,
  last_sent_at: null,
};

export function formatCountdownHHMMSS(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((val) => String(val).padStart(2, '0'))
    .join(':');
}

function mirrorStateToLocalStorage(
  queueItems: WaQueueItem[],
  systemState: WaSystemState
) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('fonnte_queue', JSON.stringify(queueItems));
    localStorage.setItem('fonnte_batch_count', String(systemState.batch_count || 0));
    localStorage.setItem(
      'fonnte_cooldown_until',
      systemState.cooldown_until ? String(new Date(systemState.cooldown_until).getTime()) : ''
    );
    localStorage.setItem(
      'fonnte_last_sent_at',
      systemState.last_sent_at ? String(new Date(systemState.last_sent_at).getTime()) : ''
    );
  } catch {
    // Ignore storage quota errors
  }
}

export function useWaQueue() {
  const [queueItems, setQueueItems] = useState<WaQueueItem[]>([]);
  const [systemState, setSystemState] = useState<WaSystemState>(DEFAULT_SYSTEM_STATE);
  const [loading, setLoading] = useState<boolean>(true);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const mountedRef = useRef(true);

  const refreshWaQueue = useCallback(async () => {
    try {
      const [resQueue, resState] = await Promise.all([
        supabase
          .from('wa_queue')
          .select('*')
          .in('status', ['PENDING', 'SENDING'])
          .order('scheduled_at', { ascending: true })
          .order('created_at', { ascending: true }),
        supabase
          .from('wa_system_state')
          .select('*')
          .eq('id', 'global')
          .maybeSingle(),
      ]);

      if (!mountedRef.current) return;

      const nextQueue = (!resQueue.error && resQueue.data ? resQueue.data : []) as WaQueueItem[];
      const nextState = (!resState.error && resState.data
        ? resState.data
        : DEFAULT_SYSTEM_STATE) as WaSystemState;

      setQueueItems(nextQueue);
      setSystemState(nextState);
      mirrorStateToLocalStorage(nextQueue, nextState);
    } catch (err) {
      console.warn('[useWaQueue] Gagal memuat antrean WA:', err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refreshWaQueue();

    const channel = supabase
      .channel(`wa_queue_realtime_${Math.random().toString(36).slice(2, 8)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wa_queue' }, () => {
        refreshWaQueue();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wa_system_state' }, () => {
        refreshWaQueue();
      })
      .subscribe();

    const onProcessed = () => {
      refreshWaQueue();
    };
    window.addEventListener('wa-queue-processed', onProcessed);

    const clockInterval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(channel);
      window.removeEventListener('wa-queue-processed', onProcessed);
      clearInterval(clockInterval);
    };
  }, [refreshWaQueue]);

  const sendingItem = useMemo(
    () => queueItems.find((item) => item.status === 'SENDING') || null,
    [queueItems]
  );

  const pendingItems = useMemo(
    () => queueItems.filter((item) => item.status === 'PENDING'),
    [queueItems]
  );

  const activeQueueCount = pendingItems.length + (sendingItem ? 1 : 0);

  const cooldownUntilMs = systemState.cooldown_until
    ? new Date(systemState.cooldown_until).getTime()
    : 0;
  const cooldownRemainingMs = Math.max(0, cooldownUntilMs - nowMs);
  const isCooldown = cooldownRemainingMs > 0;
  const cooldownFormatted = formatCountdownHHMMSS(cooldownRemainingMs);

  const nextScheduledMs = pendingItems[0]?.scheduled_at
    ? new Date(pendingItems[0].scheduled_at).getTime()
    : 0;
  const nextDelaySeconds =
    nextScheduledMs > nowMs ? Math.ceil((nextScheduledMs - nowMs) / 1000) : 0;

  const sendingKode =
    sendingItem && sendingItem.target_table !== 'tamu_undangan'
      ? sendingItem.target_kode || null
      : null;

  const tamuSendingKode =
    sendingItem && sendingItem.target_table === 'tamu_undangan'
      ? sendingItem.target_kode || null
      : null;

  const queuedKodes = useMemo(
    () => pendingItems.map((item) => item.target_kode).filter(Boolean) as string[],
    [pendingItems]
  );

  const enqueueWaMessages = useCallback(
    async (items: WaEnqueuePayload[]) => {
      const res = await fetch('/api/whatsapp/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enqueue',
          items,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Gagal memasukkan pesan ke antrean terpusat.');
      }
      await refreshWaQueue();
      window.dispatchEvent(new CustomEvent('wa-queue-processed', { detail: json }));
      return json;
    },
    [refreshWaQueue]
  );

  const cancelPendingWaQueue = useCallback(async () => {
    const res = await fetch('/api/whatsapp/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel_pending' }),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      throw new Error(json.error || 'Gagal membatalkan antrean.');
    }
    await refreshWaQueue();
    window.dispatchEvent(new CustomEvent('wa-queue-processed', { detail: json }));
    return json;
  }, [refreshWaQueue]);

  return {
    loading,
    queueItems,
    sendingItem,
    pendingItems,
    activeQueueCount,
    systemState,
    isCooldown,
    cooldownRemainingMs,
    cooldownFormatted,
    nextDelaySeconds,
    sendingKode,
    tamuSendingKode,
    queuedKodes,
    enqueueWaMessages,
    cancelPendingWaQueue,
    refreshWaQueue,
  };
}
