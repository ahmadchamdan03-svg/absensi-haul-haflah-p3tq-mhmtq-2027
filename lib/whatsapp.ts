import { supabaseServer } from '@/lib/supabase/server';

export const DEFAULT_FONNTE_TOKENS: readonly string[] = [
  'bZf42KYdFukNH6nBZe9B',
  'dVb3JDQbAF9kamiYAqkf',
];
const FONNTE_ROTATOR_KEY = 'fonnte_token_rotator';
let fallbackRotationIndex = 0;

function parseTokenList(raw?: string | null): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const tokens: string[] = [];
  for (const part of String(raw).split(/[,;\r\n]+/)) {
    const clean = part.replace(/^["']|["']$/g, '').trim();
    if (clean && !seen.has(clean)) {
      seen.add(clean);
      tokens.push(clean);
    }
  }
  return tokens;
}

/**
 * Ambil daftar token Fonnte dari environment (dipisah koma) atau gunakan pool default.
 */
export function getFonnteTokens(): string[] {
  const combined: string[] = [];
  const seen = new Set<string>();
  const primaryEnv =
    process.env.FONNTE_TOKENS ||
    process.env.FONNTE_TOKEN ||
    process.env.FONNTE_API_KEY;

  for (const rawSource of [
    primaryEnv,
    process.env.FONNTE_TOKEN_1,
    process.env.FONNTE_TOKEN_2,
  ]) {
    for (const token of parseTokenList(rawSource)) {
      if (!seen.has(token)) {
        seen.add(token);
        combined.push(token);
      }
    }
  }

  return combined.length > 0 ? combined : [...DEFAULT_FONNTE_TOKENS];
}

/**
 * Ambil token berikutnya secara bergantian (round-robin persisten lintas invocation Vercel).
 */
export async function acquireNextFonnteToken(): Promise<{
  token: string;
  index: number;
  total: number;
}> {
  const tokens = getFonnteTokens();
  if (tokens.length === 1) {
    return { token: tokens[0], index: 0, total: 1 };
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { data, error } = await supabaseServer
        .from('konfigurasi_sistem')
        .select('value, updated_at')
        .eq('key', FONNTE_ROTATOR_KEY)
        .maybeSingle();

      if (error) {
        break;
      }

      const rawNext = Number(data?.value?.next_index);
      const currentIndex =
        Number.isInteger(rawNext) && rawNext >= 0 ? rawNext % tokens.length : 0;
      const nextIndex = (currentIndex + 1) % tokens.length;
      const totalDispatched =
        (Number(data?.value?.total_dispatched) || 0) + 1;

      let nextMs = Date.now();
      if (data?.updated_at) {
        const prevMs = new Date(data.updated_at).getTime();
        if (!Number.isNaN(prevMs) && nextMs <= prevMs) {
          nextMs = prevMs + 1;
        }
      }
      const nextUpdatedAt = new Date(nextMs).toISOString();
      const nextValue = {
        next_index: nextIndex,
        last_used_index: currentIndex,
        total_dispatched: totalDispatched,
      };

      if (!data) {
        const { error: insertErr } = await supabaseServer
          .from('konfigurasi_sistem')
          .insert({
            key: FONNTE_ROTATOR_KEY,
            value: nextValue,
            updated_at: nextUpdatedAt,
          });
        if (!insertErr) {
          return { token: tokens[currentIndex], index: currentIndex, total: tokens.length };
        }
        continue;
      }

      let updateQuery = supabaseServer
        .from('konfigurasi_sistem')
        .update({
          value: nextValue,
          updated_at: nextUpdatedAt,
        })
        .eq('key', FONNTE_ROTATOR_KEY);

      updateQuery = data.updated_at
        ? updateQuery.eq('updated_at', data.updated_at)
        : updateQuery.is('updated_at', null);

      const { data: updatedRows, error: updateErr } = await updateQuery.select('key');
      if (!updateErr && updatedRows && updatedRows.length > 0) {
        return { token: tokens[currentIndex], index: currentIndex, total: tokens.length };
      }
    } catch {
      break;
    }
  }

  const idx = fallbackRotationIndex % tokens.length;
  fallbackRotationIndex = (idx + 1) % tokens.length;
  return { token: tokens[idx], index: idx, total: tokens.length };
}

function isSenderDeviceOrTokenError(reason?: string): boolean {
  if (!reason) return false;
  const lower = reason.toLowerCase();
  const senderErrorKeywords = [
    'disconnected',
    'not connected',
    'invalid token',
    'token',
    'expired',
    'quota',
    'limit',
    'unauthorized',
    'device',
  ];
  return senderErrorKeywords.some((kw) => lower.includes(kw));
}

export interface FonnteSendOptions {
  target?: string | null;
  message: string;
  delay?: number | string;
  typing?: boolean;
}

export interface FonnteSendResult {
  ok: boolean;
  target?: string;
  data?: any;
  reason?: string;
  tokenIndex?: number;
  tokenCount?: number;
}

export interface QuotaNotificationParams {
  namaWali: string;
  namaSantri: string;
  idPesanan: string;
}

/**
 * Normalisasi nomor WhatsApp Indonesia ke format awalan 62.
 * Mengembalikan string kosong jika panjang nomor tidak memenuhi minimal 9 digit.
 */
export function normalizeIndoPhone(raw?: string | null): string {
  if (!raw) return '';
  let clean = String(raw).replace(/[^0-9]/g, '');
  if (!clean || clean.length < 9) return '';
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (clean.startsWith('8')) {
    clean = '62' + clean;
  }
  return clean;
}

/**
 * Kirim pesan WhatsApp melalui API Fonnte dari sisi server.
 */
export async function sendFonnteServerMessage({
  target,
  message,
  delay,
  typing = true,
}: FonnteSendOptions): Promise<FonnteSendResult> {
  const cleanTarget = normalizeIndoPhone(target);
  if (!cleanTarget) {
    return {
      ok: false,
      reason: 'Nomor WhatsApp tidak valid atau kosong.',
    };
  }
  if (!message || !message.trim()) {
    return {
      ok: false,
      reason: 'Isi pesan WhatsApp wajib diisi.',
    };
  }

  const tokens = getFonnteTokens();
  const primary = await acquireNextFonnteToken();

  const dispatchWithToken = async (
    token: string,
    tokenIdx: number
  ): Promise<FonnteSendResult> => {
    try {
      const formData = new FormData();
      formData.append('target', cleanTarget);
      formData.append('message', message);
      if (delay !== undefined && delay !== null && String(delay).trim() !== '') {
        formData.append('delay', String(delay));
      }
      formData.append('typing', typing === false ? 'false' : 'true');
      formData.append('countryCode', '62');

      const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          Authorization: token,
        },
        body: formData,
      });

      const result = await response.json();
      const ok = result?.status === true;
      return {
        ok,
        target: cleanTarget,
        data: result,
        reason: ok ? undefined : result?.reason || result?.message || 'Fonnte gagal mengirim pesan',
        tokenIndex: tokenIdx + 1,
        tokenCount: tokens.length,
      };
    } catch (error: any) {
      console.error('[Fonnte Server] Error sending WA:', error);
      return {
        ok: false,
        target: cleanTarget,
        reason: error?.message || 'Terjadi kesalahan pada gateway WhatsApp',
        tokenIndex: tokenIdx + 1,
        tokenCount: tokens.length,
      };
    }
  };

  let attemptResult = await dispatchWithToken(primary.token, primary.index);

  if (
    !attemptResult.ok &&
    tokens.length > 1 &&
    isSenderDeviceOrTokenError(attemptResult.reason)
  ) {
    for (let offset = 1; offset < tokens.length; offset++) {
      const nextIdx = (primary.index + offset) % tokens.length;
      const retryResult = await dispatchWithToken(tokens[nextIdx], nextIdx);
      attemptResult = retryResult;
      if (retryResult.ok) {
        return retryResult;
      }
      if (!isSenderDeviceOrTokenError(retryResult.reason)) {
        break;
      }
    }
  }

  return attemptResult;
}

/**
 * Template pesan WhatsApp penolakan manual pesanan kuota tambahan.
 */
export function buildRejectQuotaMessage({
  namaWali,
  namaSantri,
  idPesanan,
}: QuotaNotificationParams): string {
  const wali = (namaWali || 'Wali Santri').trim();
  const santri = (namaSantri || 'Santri').trim();
  const id = (idPesanan || '-').trim();

  return (
    `Kepada Yth. Bapak/Ibu *${wali}*\n\n` +
    `Mohon maaf, pesanan kuota tambahan untuk *${santri}* dengan ID Pesanan *${id}* telah DITOLAK.\n\n` +
    `Jika kuota masih tersedia, Bapak/Ibu dapat melakukan pemesanan ulang melalui link undangan. Jika ada pertanyaan, silakan hubungi Sekretariat Haflah.\n\n` +
    `Jazakumullahu khairan katsiran.\n` +
    `Panitia Haul & Haflah P3TQ dan MHMTQ 2027`
  );
}

/**
 * Template pesan WhatsApp pembatalan otomatis karena melewati batas waktu 6 jam.
 */
export function buildExpireQuotaMessage({
  namaWali,
  namaSantri,
  idPesanan,
}: QuotaNotificationParams): string {
  const wali = (namaWali || 'Wali Santri').trim();
  const santri = (namaSantri || 'Santri').trim();
  const id = (idPesanan || '-').trim();

  return (
    `Kepada Yth. Bapak/Ibu *${wali}*\n\n` +
    `Pesanan kuota tambahan untuk *${santri}* dengan ID Pesanan *${id}* telah DIBATALKAN OTOMATIS karena melewati batas waktu pembayaran (6 jam) dan belum ada unggahan bukti transfer.\n\n` +
    `Jika Bapak/Ibu masih membutuhkan kuota tambahan dan kuota masih tersedia, silakan melakukan pemesanan ulang melalui link undangan.\n\n` +
    `Jazakumullahu khairan katsiran.\n` +
    `Panitia Haul & Haflah P3TQ dan MHMTQ 2027`
  );
}
