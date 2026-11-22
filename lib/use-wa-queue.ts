'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface WaQueueItem {
  id: string;
  target_hp: string;
  message?: string;
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

const WA_QUEUE_LIGHT_COLUMNS =
  'id, target_hp, nama_target, status, created_at, scheduled_at, target_table, target_id, target_kode, target_column, tipe_pesan, error_message, sent_at, updated_at';

const WA_SYSTEM_STATE_COLUMNS = 'id, batch_count, cooldown_until, last_sent_at, updated_at';

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
    const compactQueue = queueItems.slice(0, 50).map((item) => ({
      id: item.id,
      target_kode: item.target_kode,
      nama_target: item.nama_target,
      status: item.status,
      scheduled_at: item.scheduled_at,
    }));
    localStorage.setItem('fonnte_queue', JSON.stringify(compactQueue));
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

export function isNetworkResourceError(err: any): boolean {
  if (!err) return false;
  const msg = String(err?.message || err || '').toLowerCase();
  const details = String(err?.details || '').toLowerCase();
  const name = String(err?.name || '').toLowerCase();
  const has = (token: string) => msg.includes(token) || details.includes(token);
  return (
    name === 'aborterror' ||
    name === 'typeerror' ||
    has('err_insufficient_resources') ||
    has('failed to fetch') ||
    has('networkerror') ||
    has('load failed') ||
    has('network request failed') ||
    has('aborted') ||
    has('timeout')
  );
}

// =====================================================================
// SINGLETON STORE: mencegah duplikasi channel Realtime & fetch storm
// =====================================================================
interface WaQueueStoreSnapshot {
  queueItems: WaQueueItem[];
  systemState: WaSystemState;
  loading: boolean;
  networkPaused: boolean;
  networkPauseMessage: string | null;
}

const storeState: WaQueueStoreSnapshot = {
  queueItems: [],
  systemState: DEFAULT_SYSTEM_STATE,
  loading: true,
  networkPaused: false,
  networkPauseMessage: null,
};

const listeners = new Set<(snap: WaQueueStoreSnapshot) => void>();
let subscriberCount = 0;
let sharedRealtimeChannel: ReturnType<typeof supabase.channel> | null = null;
let sharedWindowListener: ((evt: Event) => void) | null = null;
let inFlightRefreshPromise: Promise<void> | null = null;
let pendingFollowupRefresh = false;
let debounceRefreshTimer: ReturnType<typeof setTimeout> | null = null;

function notifyListeners() {
  const snapshot: WaQueueStoreSnapshot = { ...storeState };
  listeners.forEach((cb) => cb(snapshot));
}

export function setNetworkPausedState(paused: boolean, message?: string | null) {
  storeState.networkPaused = paused;
  storeState.networkPauseMessage = paused
    ? message || 'Koneksi internet/browser tidak stabil. Antrean dijeda sementara.'
    : null;
  notifyListeners();
}

export function applyWorkerSyncResult(detail: any) {
  if (!detail) return;
  let mutated = false;

  if (detail.state && typeof detail.state === 'object') {
    storeState.systemState = detail.state as WaSystemState;
    mutated = true;
  }

  if (detail.status === 'PROCESSED' && detail.itemId) {
    storeState.queueItems = storeState.queueItems.filter((item) => item.id !== detail.itemId);
    if (detail.nextScheduledAt) {
      const nextMs = new Date(detail.nextScheduledAt).getTime();
      storeState.queueItems = storeState.queueItems.map((item) => {
        if (item.status === 'PENDING' && new Date(item.scheduled_at).getTime() < nextMs) {
          return { ...item, scheduled_at: detail.nextScheduledAt };
        }
        return item;
      });
    }
    mutated = true;
  }

  if (mutated) {
    mirrorStateToLocalStorage(storeState.queueItems, storeState.systemState);
    notifyListeners();
  }
}

export async function refreshWaQueueStore(): Promise<void> {
  if (inFlightRefreshPromise) {
    pendingFollowupRefresh = true;
    return inFlightRefreshPromise;
  }

  inFlightRefreshPromise = (async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const [resQueue, resState] = await Promise.all([
        supabase
          .from('wa_queue')
          .select(WA_QUEUE_LIGHT_COLUMNS)
          .in('status', ['PENDING', 'SENDING'])
          .order('scheduled_at', { ascending: true })
          .order('created_at', { ascending: true })
          .retry(false)
          .abortSignal(controller.signal),
        supabase
          .from('wa_system_state')
          .select(WA_SYSTEM_STATE_COLUMNS)
          .eq('id', 'global')
          .retry(false)
          .abortSignal(controller.signal)
          .maybeSingle(),
      ]);

      if (!resQueue.error && resQueue.data) {
        storeState.queueItems = resQueue.data as WaQueueItem[];
      }
      if (!resState.error && resState.data) {
        storeState.systemState = resState.data as WaSystemState;
      }

      mirrorStateToLocalStorage(storeState.queueItems, storeState.systemState);
    } catch (err) {
      if (!isNetworkResourceError(err)) {
        console.warn('[useWaQueue] Gagal memuat antrean WA:', err);
      }
    } finally {
      clearTimeout(timeoutId);
      storeState.loading = false;
      inFlightRefreshPromise = null;
      notifyListeners();

      if (pendingFollowupRefresh) {
        pendingFollowupRefresh = false;
        scheduleDebouncedRefresh();
      }
    }
  })();

  return inFlightRefreshPromise;
}

export function scheduleDebouncedRefresh(delayMs: number = 450) {
  if (debounceRefreshTimer) {
    clearTimeout(debounceRefreshTimer);
  }
  debounceRefreshTimer = setTimeout(() => {
    debounceRefreshTimer = null;
    refreshWaQueueStore();
  }, delayMs);
}

export async function resumeNetworkPausedQueue(): Promise<void> {
  setNetworkPausedState(false, null);
  await refreshWaQueueStore();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('wa-queue-resume'));
  }
}

function attachSharedSubscriptions() {
  if (typeof window === 'undefined') return;

  if (!sharedRealtimeChannel) {
    // Hanya subscribe ke 1 tabel inti (wa_queue) dengan debounce agar kiriman massal tidak memicu banjir request
    sharedRealtimeChannel = supabase
      .channel('wa_queue_realtime_singleton')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wa_queue' }, () => {
        scheduleDebouncedRefresh(450);
      })
      .subscribe();
  }

  if (!sharedWindowListener) {
    sharedWindowListener = (evt: Event) => {
      const detail = (evt as CustomEvent).detail;
      if (detail) {
        applyWorkerSyncResult(detail);
      }
      if (!detail || (detail.status !== 'PROCESSED' && detail.action !== 'enqueue')) {
        scheduleDebouncedRefresh(450);
      }
    };
    window.addEventListener('wa-queue-processed', sharedWindowListener);
  }
}

function detachSharedSubscriptionsIfUnused() {
  if (subscriberCount > 0) return;

  if (debounceRefreshTimer) {
    clearTimeout(debounceRefreshTimer);
    debounceRefreshTimer = null;
  }
  if (sharedRealtimeChannel) {
    supabase.removeChannel(sharedRealtimeChannel);
    sharedRealtimeChannel = null;
  }
  if (sharedWindowListener && typeof window !== 'undefined') {
    window.removeEventListener('wa-queue-processed', sharedWindowListener);
    sharedWindowListener = null;
  }
}

export function useWaQueue() {
  const [snapshot, setSnapshot] = useState<WaQueueStoreSnapshot>(() => ({ ...storeState }));
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const mountedRef = useRef(true);

  const refreshWaQueue = useCallback(() => refreshWaQueueStore(), []);

  useEffect(() => {
    mountedRef.current = true;
    const listener = (nextSnap: WaQueueStoreSnapshot) => {
      if (mountedRef.current) {
        setSnapshot(nextSnap);
      }
    };

    listeners.add(listener);
    subscriberCount += 1;
    attachSharedSubscriptions();

    if (subscriberCount === 1 || storeState.loading) {
      refreshWaQueueStore();
    } else {
      setSnapshot({ ...storeState });
    }

    return () => {
      mountedRef.current = false;
      listeners.delete(listener);
      subscriberCount = Math.max(0, subscriberCount - 1);
      detachSharedSubscriptionsIfUnused();
    };
  }, []);

  const sendingItem = useMemo(
    () => snapshot.queueItems.find((item) => item.status === 'SENDING') || null,
    [snapshot.queueItems]
  );

  const pendingItems = useMemo(
    () => snapshot.queueItems.filter((item) => item.status === 'PENDING'),
    [snapshot.queueItems]
  );

  const activeQueueCount = pendingItems.length + (sendingItem ? 1 : 0);

  const cooldownUntilMs = snapshot.systemState.cooldown_until
    ? new Date(snapshot.systemState.cooldown_until).getTime()
    : 0;
  const hasActiveClock = activeQueueCount > 0 || cooldownUntilMs > nowMs;

  useEffect(() => {
    if (!hasActiveClock) return;
    setNowMs(Date.now());
    const clockInterval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, [hasActiveClock]);

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

  const enqueueWaMessages = useCallback(async (items: WaEnqueuePayload[]) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch('/api/whatsapp/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enqueue',
          items,
        }),
        signal: controller.signal,
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Gagal memasukkan pesan ke antrean terpusat.');
      }
      if (storeState.networkPaused) {
        setNetworkPausedState(false, null);
      }
      await refreshWaQueueStore();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('wa-queue-wake', { detail: { ...json, action: 'enqueue' } })
        );
      }
      return json;
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  const cancelPendingWaQueue = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch('/api/whatsapp/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel_pending' }),
        signal: controller.signal,
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Gagal membatalkan antrean.');
      }
      setNetworkPausedState(false, null);
      await refreshWaQueueStore();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('wa-queue-processed', { detail: { ...json, action: 'cancel_pending' } })
        );
      }
      return json;
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  return {
    loading: snapshot.loading,
    queueItems: snapshot.queueItems,
    sendingItem,
    pendingItems,
    activeQueueCount,
    systemState: snapshot.systemState,
    isCooldown,
    cooldownRemainingMs,
    cooldownFormatted,
    nextDelaySeconds,
    sendingKode,
    tamuSendingKode,
    queuedKodes,
    networkPaused: snapshot.networkPaused,
    networkPauseMessage: snapshot.networkPauseMessage,
    resumeNetworkPausedQueue,
    enqueueWaMessages,
    cancelPendingWaQueue,
    refreshWaQueue,
  };
}
