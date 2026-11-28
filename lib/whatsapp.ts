export const DEFAULT_FONNTE_TOKENS: readonly string[] = [
  'YFNhUwAbwsjHoFjNrUcx',
  'bZf42KYdFukNH6nBZe9B',
  'dVb3JDQbAF9kamiYAqkf',
];

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
 * Ambil daftar token Fonnte berurutan sesuai prioritas Tier 1, Tier 2, Tier 3.
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
    process.env.FONNTE_TOKEN_3,
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

function isRecipientOnlyError(reason?: string): boolean {
  if (!reason) return false;
  const lower = reason.toLowerCase();
  const recipientErrorKeywords = [
    'invalid target',
    'target not registered',
    'not registered',
    'invalid phone',
    'invalid number',
    'target is empty',
    'message is empty',
  ];
  return recipientErrorKeywords.some((kw) => lower.includes(kw));
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

      const result = await response.json().catch(() => null);
      const ok = response.ok && result?.status === true;
      return {
        ok,
        target: cleanTarget,
        data: result,
        reason: ok
          ? undefined
          : result?.reason ||
            result?.message ||
            (!response.ok ? `HTTP ${response.status}` : 'Fonnte gagal mengirim pesan'),
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

  let lastResult: FonnteSendResult = {
    ok: false,
    target: cleanTarget,
    reason: 'Tidak ada token Fonnte yang tersedia',
    tokenCount: tokens.length,
  };

  for (let idx = 0; idx < tokens.length; idx++) {
    const attemptResult = await dispatchWithToken(tokens[idx], idx);
    lastResult = attemptResult;

    if (attemptResult.ok) {
      return attemptResult;
    }
    if (isRecipientOnlyError(attemptResult.reason)) {
      return attemptResult;
    }
  }

  return lastResult;
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
