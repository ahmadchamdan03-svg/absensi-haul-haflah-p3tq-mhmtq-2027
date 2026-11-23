import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getSessionRole } from '@/lib/auth-server';
import { sendFonnteServerMessage } from '@/lib/whatsapp';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const MIN_DELAY_MS = 10000; // 10 detik (ketat anti-blokir)
const MAX_DELAY_MS = 60000; // 60 detik
const STALE_SENDING_MS = 2 * 60 * 1000; // 2 menit recovery jika browser tertutup saat SENDING

export interface WaSystemStateRow {
  id: string;
  batch_count: number;
  cooldown_until: string | null;
  last_sent_at: string | null;
  updated_at?: string | null;
}

function getRandomDelayMs(): number {
  return Math.floor(Math.random() * 50000) + 10000;
}

async function getOrInitSystemState(): Promise<WaSystemStateRow> {
  const { data, error } = await supabaseServer
    .from('wa_system_state')
    .select('*')
    .eq('id', 'global')
    .maybeSingle();

  if (!error && data) {
    return data as WaSystemStateRow;
  }

  const initial: WaSystemStateRow = {
    id: 'global',
    batch_count: 0,
    cooldown_until: null,
    last_sent_at: null,
    updated_at: new Date().toISOString(),
  };

  await supabaseServer.from('wa_system_state').upsert(initial, { onConflict: 'id' });
  return initial;
}

async function syncSystemStateTimers(state: WaSystemStateRow): Promise<WaSystemStateRow> {
  if (state.cooldown_until === null && Number(state.batch_count || 0) === 0) {
    return state;
  }

  const nowIso = new Date().toISOString();
  const updated: WaSystemStateRow = {
    ...state,
    batch_count: 0,
    cooldown_until: null,
    updated_at: nowIso,
  };

  await supabaseServer
    .from('wa_system_state')
    .update({
      batch_count: 0,
      cooldown_until: null,
      updated_at: nowIso,
    })
    .eq('id', 'global');

  return updated;
}

async function recoverStaleSendingRows() {
  const staleThresholdIso = new Date(Date.now() - STALE_SENDING_MS).toISOString();
  await supabaseServer
    .from('wa_queue')
    .update({
      status: 'PENDING',
      updated_at: new Date().toISOString(),
    })
    .eq('status', 'SENDING')
    .lt('updated_at', staleThresholdIso);
}

async function updateRecipientTableStatus(
  item: any,
  isSuccess: boolean,
  reasonText: string
): Promise<'TERKIRIM' | 'NOMOR_TIDAK_TERDAFTAR' | 'GAGAL'> {
  const isInvalidNum =
    reasonText.toLowerCase().includes('invalid') ||
    reasonText.toLowerCase().includes('not registered');
  const finalStatus: 'TERKIRIM' | 'NOMOR_TIDAK_TERDAFTAR' | 'GAGAL' = isSuccess
    ? 'TERKIRIM'
    : isInvalidNum
    ? 'NOMOR_TIDAK_TERDAFTAR'
    : 'GAGAL';

  const targetTable = item.target_table;
  const targetId = item.target_id;
  const targetKode = item.target_kode;
  if (!targetTable || (!targetId && !targetKode)) return finalStatus;

  const nowIso = new Date().toISOString();

  if (targetTable === 'peserta_santri') {
    const col = item.target_column || 'status_wa_undangan';
    const updatePayload: Record<string, any> = {
      [col]: finalStatus,
      ...(col === 'status_wa_undangan' ? { status_wa: finalStatus } : {}),
      updated_at: nowIso,
    };

    let query = supabaseServer.from('peserta_santri').update(updatePayload);
    if (targetId) query = query.eq('id', targetId);
    else query = query.eq('kode', targetKode);
    await query;
  } else if (targetTable === 'tamu_undangan') {
    const updatePayload = {
      status_wa: finalStatus,
      updated_at: nowIso,
    };
    let query = supabaseServer.from('tamu_undangan').update(updatePayload);
    if (targetId) query = query.eq('id', targetId);
    else query = query.eq('kode', targetKode);
    await query;
  }

  return finalStatus;
}

export async function GET() {
  try {
    await recoverStaleSendingRows();
    const rawState = await getOrInitSystemState();
    const state = await syncSystemStateTimers(rawState);

    const { data: activeItems } = await supabaseServer
      .from('wa_queue')
      .select('*')
      .in('status', ['PENDING', 'SENDING'])
      .order('scheduled_at', { ascending: true })
      .order('created_at', { ascending: true });

    const list = activeItems || [];
    const sendingItem = list.find((item) => item.status === 'SENDING') || null;
    const pendingItems = list.filter((item) => item.status === 'PENDING');

    return NextResponse.json({
      ok: true,
      state,
      sendingItem,
      pendingItems,
    });
  } catch (err: any) {
    console.error('[API WA Queue GET] Error:', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Gagal memuat state antrean WA.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const role = getSessionRole(req);
  if (!role || !['ADMIN', 'PENERIMA_TAMU', 'PIMPINAN'].includes(role)) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized: Sesi panitia tidak valid.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const action = body.action || 'enqueue';

    if (action === 'reset_idle') {
      const rawState = await getOrInitSystemState();
      const state = await syncSystemStateTimers(rawState);
      return NextResponse.json({ ok: true, state });
    }

    if (action === 'cancel_pending') {
      const { error } = await supabaseServer
        .from('wa_queue')
        .delete()
        .eq('status', 'PENDING');

      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, message: 'Seluruh antrean PENDING berhasil dibersihkan.' });
    }

    if (action === 'enqueue') {
      const incomingItems: any[] = Array.isArray(body.items) ? body.items : [];
      if (incomingItems.length === 0) {
        return NextResponse.json(
          { ok: false, error: 'Daftar pesan antrean kosong.' },
          { status: 400 }
        );
      }

      const { data: existingActive } = await supabaseServer
        .from('wa_queue')
        .select('target_hp, target_kode, target_column')
        .in('status', ['PENDING', 'SENDING']);

      const activeKeys = new Set(
        (existingActive || []).map(
          (x: any) => `${x.target_kode || x.target_hp}:${x.target_column || 'default'}`
        )
      );

      const nowIso = new Date().toISOString();
      const rowsToInsert: any[] = [];

      for (const item of incomingItems) {
        const targetHp = String(item.target_hp || '').trim();
        const message = String(item.message || '').trim();
        const namaTarget = String(item.nama_target || 'Peserta').trim();
        if (!targetHp || !message) continue;

        const dedupKey = `${item.target_kode || targetHp}:${item.target_column || 'default'}`;
        if (activeKeys.has(dedupKey)) continue;
        activeKeys.add(dedupKey);

        rowsToInsert.push({
          target_hp: targetHp,
          message,
          nama_target: namaTarget,
          status: 'PENDING',
          created_at: nowIso,
          scheduled_at: item.scheduled_at || nowIso,
          target_table: item.target_table || null,
          target_id: item.target_id ? String(item.target_id) : null,
          target_kode: item.target_kode || null,
          target_column: item.target_column || null,
          tipe_pesan: item.tipe_pesan || null,
          updated_at: nowIso,
        });
      }

      if (rowsToInsert.length === 0) {
        return NextResponse.json({
          ok: true,
          insertedCount: 0,
          message: 'Pesan sudah berada di dalam antrean aktif.',
        });
      }

      const { data: inserted, error: insertErr } = await supabaseServer
        .from('wa_queue')
        .insert(rowsToInsert)
        .select('*');

      if (insertErr) {
        return NextResponse.json(
          { ok: false, error: `Gagal memasukkan ke wa_queue: ${insertErr.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        insertedCount: rowsToInsert.length,
        items: inserted || [],
      });
    }

    if (action === 'process_next') {
      await recoverStaleSendingRows();

      const { data: activeSending } = await supabaseServer
        .from('wa_queue')
        .select('id, nama_target')
        .eq('status', 'SENDING')
        .limit(1);

      if (activeSending && activeSending.length > 0) {
        return NextResponse.json({ ok: true, status: 'BUSY', sending: activeSending[0] });
      }

      const rawState = await getOrInitSystemState();
      let state = await syncSystemStateTimers(rawState);
      const nowMs = Date.now();
      const nowIso = new Date(nowMs).toISOString();

      // Kunci Jeda Ketat >= 10 detik dari pengiriman terakhir (anti pesan kembar < 10 detik)
      if (state.last_sent_at) {
        const lastSentMs = new Date(state.last_sent_at).getTime();
        const elapsedSinceLastSent = nowMs - lastSentMs;
        if (elapsedSinceLastSent >= 0 && elapsedSinceLastSent < MIN_DELAY_MS) {
          const minNextScheduledIso = new Date(lastSentMs + MIN_DELAY_MS).toISOString();
          await supabaseServer
            .from('wa_queue')
            .update({
              scheduled_at: minNextScheduledIso,
              updated_at: nowIso,
            })
            .eq('status', 'PENDING')
            .lt('scheduled_at', minNextScheduledIso);

          return NextResponse.json({
            ok: true,
            status: 'WAITING_DELAY',
            minNextScheduledAt: minNextScheduledIso,
            state,
          });
        }
      }

      const { data: dueCandidates } = await supabaseServer
        .from('wa_queue')
        .select('*')
        .eq('status', 'PENDING')
        .lte('scheduled_at', nowIso)
        .order('scheduled_at', { ascending: true })
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
        .limit(1);

      const candidate = dueCandidates?.[0];
      if (!candidate) {
        return NextResponse.json({
          ok: true,
          status: 'IDLE',
          state,
        });
      }

      // Atomic Claim agar tidak diproses ganda oleh tab/browser lain
      const { data: claimedRows, error: claimErr } = await supabaseServer
        .from('wa_queue')
        .update({
          status: 'SENDING',
          updated_at: nowIso,
        })
        .eq('id', candidate.id)
        .eq('status', 'PENDING')
        .select('*');

      if (claimErr || !claimedRows || claimedRows.length === 0) {
        return NextResponse.json({
          ok: true,
          status: 'ALREADY_CLAIMED',
          state,
        });
      }

      const claimed = claimedRows[0];

      // Double-check guard: jika dua tab lolos cek BUSY hampir bersamaan dan mengklaim row berbeda,
      // hanya klaim pertama yang dipertahankan, selebihnya kembalikan ke PENDING.
      const { data: concurrentSending } = await supabaseServer
        .from('wa_queue')
        .select('id')
        .eq('status', 'SENDING')
        .order('updated_at', { ascending: true })
        .order('created_at', { ascending: true })
        .order('id', { ascending: true });

      if (concurrentSending && concurrentSending.length > 1 && concurrentSending[0].id !== claimed.id) {
        const latestStateCheck = await getOrInitSystemState();
        const latestSentMs = latestStateCheck.last_sent_at
          ? new Date(latestStateCheck.last_sent_at).getTime()
          : 0;
        const revertNowMs = Date.now();
        const needsDelayShift =
          latestSentMs > 0 && revertNowMs - latestSentMs < MIN_DELAY_MS;
        const safeScheduledAt = needsDelayShift
          ? new Date(latestSentMs + getRandomDelayMs()).toISOString()
          : new Date(revertNowMs + MIN_DELAY_MS).toISOString();
        const existingScheduledMs = new Date(claimed.scheduled_at).getTime();
        const nextRevertScheduled =
          existingScheduledMs < new Date(safeScheduledAt).getTime()
            ? safeScheduledAt
            : claimed.scheduled_at;

        await supabaseServer
          .from('wa_queue')
          .update({
            status: 'PENDING',
            scheduled_at: nextRevertScheduled,
            updated_at: new Date(revertNowMs).toISOString(),
          })
          .eq('id', claimed.id)
          .eq('status', 'SENDING');

        return NextResponse.json({
          ok: true,
          status: 'BUSY',
          state: latestStateCheck,
        });
      }

      // Panggil API Fonnte dengan simulasi mengetik (typing: true), kecuali nomor uji dummy atau simulasi putus
      let isSuccess = false;
      let errorReason = '';
      const cleanDigitsHp = String(claimed.target_hp || '').replace(/\D/g, '');
      const isSafeDummyPhone = cleanDigitsHp.startsWith('080000') || cleanDigitsHp.startsWith('6280000');
      const simulateDisconnected = body.simulateDisconnected === true;

      if (simulateDisconnected) {
        isSuccess = false;
        errorReason = 'request invalid on disconnected device';
      } else if (isSafeDummyPhone) {
        isSuccess = true;
      } else {
        try {
          const sendRes = await sendFonnteServerMessage({
            target: claimed.target_hp,
            message: claimed.message,
            typing: true,
          });
          isSuccess = Boolean(sendRes.ok);
          if (!isSuccess) {
            errorReason =
              sendRes.reason ||
              sendRes.data?.reason ||
              'Pengiriman ditolak oleh gateway Fonnte';
          }
        } catch (sendErr: any) {
          isSuccess = false;
          errorReason = sendErr?.message || 'Gagal menghubungi server Fonnte';
        }
      }

      const finishNowMs = Date.now();
      const finishNowIso = new Date(finishNowMs).toISOString();

      // Jika perangkat terputus sementara, jadwalkan ulang 30 detik lagi tanpa jeda panjang global
      const isDisconnectedError =
        !isSuccess && errorReason.toLowerCase().includes('disconnected');

      if (isDisconnectedError) {
        const retryAtIso = new Date(finishNowMs + 30000).toISOString();

        await supabaseServer
          .from('wa_queue')
          .update({
            status: 'PENDING',
            scheduled_at: retryAtIso,
            error_message: errorReason,
            updated_at: finishNowIso,
          })
          .eq('id', claimed.id);

        const cleanState: WaSystemStateRow = {
          ...state,
          batch_count: 0,
          cooldown_until: null,
          updated_at: finishNowIso,
        };

        return NextResponse.json({
          ok: true,
          status: 'RETRY_DISCONNECTED',
          itemId: claimed.id,
          namaTarget: claimed.nama_target,
          targetKode: claimed.target_kode,
          sentOk: false,
          errorReason,
          cooldownTriggered: false,
          state: cleanState,
        });
      }

      // 2. PENCEGAHAN BUG CELAH 0,24 DETIK:
      // Geser scheduled_at pesan berikutnya (10 - 60 detik) dan update wa_system_state
      // SEBELUM mengubah status pesan saat ini dari 'SENDING' menjadi 'SUCCESS'/'FAILED'.
      const delayMs = getRandomDelayMs();
      const nextScheduledIso = new Date(finishNowMs + delayMs).toISOString();

      await supabaseServer
        .from('wa_queue')
        .update({
          scheduled_at: nextScheduledIso,
          updated_at: finishNowIso,
        })
        .eq('status', 'PENDING')
        .lt('scheduled_at', nextScheduledIso);

      const finalBatchCount = 0;
      const finalCooldownUntil: string | null = null;
      const cooldownTriggered = false;

      const { data: updatedStateRow } = await supabaseServer
        .from('wa_system_state')
        .update({
          batch_count: finalBatchCount,
          cooldown_until: finalCooldownUntil,
          last_sent_at: finishNowIso,
          updated_at: finishNowIso,
        })
        .eq('id', 'global')
        .select('*')
        .single();

      const finalRecipientStatus = await updateRecipientTableStatus(claimed, isSuccess, errorReason);

      await supabaseServer
        .from('wa_queue')
        .update({
          status: isSuccess ? 'SUCCESS' : 'FAILED',
          sent_at: finishNowIso,
          error_message: isSuccess ? null : errorReason,
          updated_at: finishNowIso,
        })
        .eq('id', claimed.id);

      state = (updatedStateRow as WaSystemStateRow) || {
        id: 'global',
        batch_count: finalBatchCount,
        cooldown_until: finalCooldownUntil,
        last_sent_at: finishNowIso,
        updated_at: finishNowIso,
      };

      return NextResponse.json({
        ok: true,
        status: 'PROCESSED',
        itemId: claimed.id,
        namaTarget: claimed.nama_target,
        targetKode: claimed.target_kode,
        targetTable: claimed.target_table || null,
        targetId: claimed.target_id || null,
        targetColumn: claimed.target_column || 'status_wa_undangan',
        finalRecipientStatus,
        sentOk: isSuccess,
        errorReason: isSuccess ? null : errorReason,
        delayMs,
        nextScheduledAt: nextScheduledIso,
        cooldownTriggered,
        state,
      });
    }

    return NextResponse.json(
      { ok: false, error: `Action '${action}' tidak dikenali.` },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('[API WA Queue POST] Fatal error:', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Terjadi kesalahan pada server antrean WA.' },
      { status: 500 }
    );
  }
}
