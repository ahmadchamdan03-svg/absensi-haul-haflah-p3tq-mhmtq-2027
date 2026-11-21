import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { normalizeIndoPhone, sendFonnteServerMessage } from '@/lib/whatsapp';
import { generateRandomWaGroupReplyMessage } from '@/lib/wa-message-templates';

export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function parseIncomingWebhookPayload(req: NextRequest): Promise<Record<string, any>> {
  const contentType = (req.headers.get('content-type') || '').toLowerCase();

  if (contentType.includes('application/json')) {
    try {
      const json = await req.json();
      return json && typeof json === 'object' ? json : {};
    } catch {
      return {};
    }
  }

  if (contentType.includes('multipart/form-data')) {
    try {
      const fd = await req.formData();
      const out: Record<string, any> = {};
      fd.forEach((value, key) => {
        out[key] = typeof value === 'string' ? value : value.name;
      });
      return out;
    } catch {
      return {};
    }
  }

  try {
    const rawText = await req.text();
    if (!rawText) return {};
    const trimmed = rawText.trim();
    if (trimmed.startsWith('{')) {
      return JSON.parse(trimmed);
    }
    const params = new URLSearchParams(rawText);
    const out: Record<string, any> = {};
    params.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  } catch {
    return {};
  }
}

async function getLatestLinkGrupWa(): Promise<string> {
  const { data, error } = await supabaseServer
    .from('konfigurasi_sistem')
    .select('value')
    .eq('key', 'link_grup_wa')
    .maybeSingle();

  if (error || !data?.value) return '';
  if (typeof data.value === 'object' && data.value !== null) {
    return String(data.value.url || data.value.link || '').trim();
  }
  if (typeof data.value === 'string') {
    return data.value.trim();
  }
  return '';
}

async function findWaliSantriByPhone(clean62Phone: string) {
  const coreDigits = clean62Phone.slice(2); // 8xxx
  const zeroForm = `0${coreDigits}`; // 08xxx
  const plusForm = `+${clean62Phone}`; // +628xxx
  const candidateFormats = [zeroForm, clean62Phone, plusForm, coreDigits];

  const { data: exactMatches, error } = await supabaseServer
    .from('peserta_santri')
    .select('id, kode, nama, nama_wali, no_hp, status_balasan_grup')
    .in('no_hp', candidateFormats)
    .ilike('kode', 'SH%');

  if (!error && exactMatches && exactMatches.length > 0) {
    return exactMatches;
  }

  // Fallback pencocokan 8 digit terakhir bila di database terdapat tanda baca/spasi pada no_hp
  const suffix = coreDigits.slice(-8);
  if (suffix.length < 8) return [];

  const { data: fuzzyMatches, error: fuzzyErr } = await supabaseServer
    .from('peserta_santri')
    .select('id, kode, nama, nama_wali, no_hp, status_balasan_grup')
    .ilike('kode', 'SH%')
    .ilike('no_hp', `%${suffix}%`);

  if (fuzzyErr || !fuzzyMatches) return [];
  return fuzzyMatches.filter((row: any) => normalizeIndoPhone(row.no_hp) === clean62Phone);
}

export async function POST(req: NextRequest) {
  try {
    const payload = await parseIncomingWebhookPayload(req);
    const rawSender = String(
      payload.sender ||
        payload.pengirim ||
        payload.from ||
        payload.phone ||
        payload.no_hp ||
        payload.target ||
        ''
    ).trim();

    // Abaikan pesan dari grup (@g.us) atau pesan keluar (fromMe/isFromMe)
    if (
      payload.isFromMe === true ||
      payload.fromMe === true ||
      payload.isFromMe === 'true' ||
      payload.fromMe === 'true' ||
      rawSender.includes('@g.us')
    ) {
      console.info('[WA Webhook] Ignored outbound/group event:', rawSender);
      return new NextResponse('Ignored', { status: 200 });
    }

    // Bersihkan suffix JID WhatsApp jika ada (mis. 62812345@s.whatsapp.net / @c.us)
    const strippedSender = rawSender.split('@')[0];
    const clean62 = normalizeIndoPhone(strippedSender);

    if (!clean62) {
      console.info('[WA Webhook] Ignored empty/invalid sender:', rawSender);
      return new NextResponse('Ignored', { status: 200 });
    }

    // 1. Cari nomor pengirim hanya di tabel peserta_santri (kode SH...)
    const matchedRows = await findWaliSantriByPhone(clean62);
    if (!matchedRows || matchedRows.length === 0) {
      console.info('[WA Webhook] Ignored non-wali sender (not found in peserta_santri):', clean62);
      return new NextResponse('Ignored', { status: 200 });
    }

    // 2. Jika sudah pernah menerima balasan link grup ('TERKIRIM') atau sedang diproses ('PROCESSING'), abaikan
    const alreadyHandled = matchedRows.some((r: any) => {
      const st = String(r.status_balasan_grup || '').toUpperCase();
      return st === 'TERKIRIM' || st === 'PROCESSING';
    });
    if (alreadyHandled) {
      console.info('[WA Webhook] Ignored duplicate/in-progress reply from wali santri:', clean62);
      return new NextResponse('Ignored', { status: 200 });
    }

    const primaryRow = matchedRows[0];
    const allMatchedIds = matchedRows.map((r: any) => r.id);

    // Atomic claim agar webhook retry/ganda pada milidetik sama tidak membalas dua kali
    const { data: claimedRows, error: claimErr } = await supabaseServer
      .from('peserta_santri')
      .update({
        status_balasan_grup: 'PROCESSING',
        updated_at: new Date().toISOString(),
      })
      .eq('id', primaryRow.id)
      .or('status_balasan_grup.eq.BELUM,status_balasan_grup.is.null')
      .select('id, kode, nama, nama_wali');

    if (claimErr || !claimedRows || claimedRows.length === 0) {
      console.info('[WA Webhook] Ignored concurrent/in-progress webhook:', clean62);
      return new NextResponse('Ignored', { status: 200 });
    }

    // 3. Ambil link grup terbaru dari konfigurasi_sistem
    const linkGrupWa = await getLatestLinkGrupWa();
    if (!linkGrupWa) {
      await supabaseServer
        .from('peserta_santri')
        .update({ status_balasan_grup: 'BELUM', updated_at: new Date().toISOString() })
        .in('id', allMatchedIds);
      console.warn('[WA Webhook] Ignored: link_grup_wa belum diatur di konfigurasi_sistem.');
      return new NextResponse('Ignored', { status: 200 });
    }

    // 4. Tunggu jeda acak 3-5 detik (simulasi mengetik alami)
    const delayMs = Math.floor(Math.random() * 2001) + 3000;
    await sleep(delayMs);

    // 5. Bangun pesan balasan acak + kirim via Fonnte API
    const replyMessage = generateRandomWaGroupReplyMessage({
      nama_wali: primaryRow.nama_wali,
      nama_santri: primaryRow.nama,
      link_grup_wa: linkGrupWa,
    });

    const isSafeDummyPhone = clean62.startsWith('6280000') || clean62.startsWith('080000');
    const sendResult = isSafeDummyPhone
      ? { ok: true, target: clean62, data: { status: true, dummy: true } }
      : await sendFonnteServerMessage({
          target: clean62,
          message: replyMessage,
          typing: true,
        });

    if (!sendResult.ok) {
      await supabaseServer
        .from('peserta_santri')
        .update({ status_balasan_grup: 'BELUM', updated_at: new Date().toISOString() })
        .in('id', allMatchedIds);

      console.error('[WA Webhook] Gagal mengirim balasan ke Fonnte:', {
        kode: primaryRow.kode,
        target: clean62,
        reason: sendResult.reason,
      });

      return NextResponse.json(
        {
          ok: false,
          status: 'FAILED',
          kode: primaryRow.kode,
          target: clean62,
          reason: sendResult.reason || 'Fonnte gagal mengirim balasan',
        },
        { status: 200 }
      );
    }

    // 6. Sukses terkirim -> tandai status_balasan_grup menjadi 'TERKIRIM'
    const nowIso = new Date().toISOString();
    await supabaseServer
      .from('peserta_santri')
      .update({
        status_balasan_grup: 'TERKIRIM',
        updated_at: nowIso,
      })
      .in('id', allMatchedIds);

    console.info('[WA Webhook] Replied link_grup_wa to wali santri:', {
      kode: primaryRow.kode,
      nama_wali: primaryRow.nama_wali,
      target: clean62,
      delayMs,
    });

    return NextResponse.json(
      {
        ok: true,
        status: 'REPLIED',
        kode: primaryRow.kode,
        namaWali: primaryRow.nama_wali,
        target: clean62,
        delayMs,
        message: replyMessage,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[WA Webhook] Fatal error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'Webhook error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'Fonnte Reply-First Gate Webhook Active' });
}
