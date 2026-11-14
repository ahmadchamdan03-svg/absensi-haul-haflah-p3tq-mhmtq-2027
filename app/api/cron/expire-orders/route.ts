import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getSessionRole } from '@/lib/auth-server';
import { buildExpireQuotaMessage, sendFonnteServerMessage } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

const EXPIRE_AFTER_MS = 6 * 60 * 60 * 1000; // 6 jam

function isAuthorizedCronRequest(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return true;
  }

  const authHeader = req.headers.get('authorization') || '';
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  const role = getSessionRole(req);
  return role === 'ADMIN';
}

async function handleExpireOrders(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized cron invocation.' },
      { status: 401 }
    );
  }

  try {
    const now = new Date();
    const nowIso = now.toISOString();
    const cutoffIso = new Date(now.getTime() - EXPIRE_AFTER_MS).toISOString();

    // Cari pesanan MENUNGGU_PEMBAYARAN lebih dari 6 jam yang belum mengunggah bukti transfer
    const { data: candidates, error: queryErr } = await supabaseServer
      .from('pembelian_kuota')
      .select('id, id_pesanan, kode_santri, nama_wali, jumlah_kursi, status, bukti_url, uploaded_at, created_at')
      .eq('status', 'MENUNGGU_PEMBAYARAN')
      .lt('created_at', cutoffIso);

    if (queryErr) {
      console.error('[Cron Expire Orders] Query error:', queryErr);
      return NextResponse.json(
        { ok: false, error: `Gagal memeriksa pesanan kedaluwarsa: ${queryErr.message}` },
        { status: 500 }
      );
    }

    const eligibleOrders = (candidates || []).filter((order) => {
      const hasProofUrl = Boolean(order.bukti_url && String(order.bukti_url).trim() !== '');
      const hasUploadedAt = Boolean(order.uploaded_at);
      return !hasProofUrl && !hasUploadedAt;
    });

    if (eligibleOrders.length === 0) {
      return NextResponse.json({
        ok: true,
        checkedAt: nowIso,
        cutoff: cutoffIso,
        expiredCount: 0,
        results: [],
      });
    }

    // Ambil data santri terkait sekaligus dalam 1 query
    const santriCodes = Array.from(
      new Set(eligibleOrders.map((o) => o.kode_santri).filter(Boolean))
    );

    const santriMap = new Map<string, { nama: string; nama_wali: string; no_hp: string }>();
    if (santriCodes.length > 0) {
      const { data: santriRows } = await supabaseServer
        .from('peserta_santri')
        .select('kode, nama, nama_wali, no_hp')
        .in('kode', santriCodes);

      for (const s of santriRows || []) {
        if (s.kode) {
          santriMap.set(String(s.kode).toUpperCase(), {
            nama: s.nama || s.kode,
            nama_wali: s.nama_wali || 'Wali Santri',
            no_hp: s.no_hp || '',
          });
        }
      }
    }

    const results: Array<{
      id_pesanan: string;
      kode_santri: string;
      status: string;
      waSent: boolean;
      waTarget?: string;
      waReason?: string;
    }> = [];

    for (const order of eligibleOrders) {
      // Update atomik agar aman bila cron terpanggil bersamaan
      const { data: updatedRow, error: updateErr } = await supabaseServer
        .from('pembelian_kuota')
        .update({
          status: 'BATAL / KEDALUWARSA',
          updated_at: nowIso,
        })
        .eq('id', order.id)
        .eq('status', 'MENUNGGU_PEMBAYARAN')
        .select('id, id_pesanan, status')
        .maybeSingle();

      if (updateErr || !updatedRow) {
        continue;
      }

      const santriInfo = santriMap.get(String(order.kode_santri || '').toUpperCase());
      const idPesananLabel = order.id_pesanan || order.id;
      const namaWali = order.nama_wali || santriInfo?.nama_wali || 'Wali Santri';
      const namaSantri = santriInfo?.nama || order.kode_santri || 'Santri';
      const targetHp = santriInfo?.no_hp || '';

      const message = buildExpireQuotaMessage({
        namaWali,
        namaSantri,
        idPesanan: idPesananLabel,
      });

      const waRes = await sendFonnteServerMessage({
        target: targetHp,
        message,
      });

      await supabaseServer.from('audit_log').insert({
        panitia_id: 'SYSTEM_CRON',
        panitia_role: 'SYSTEM',
        aksi: 'KEDALUWARSA_KUOTA',
        tabel: 'pembelian_kuota',
        kode: order.kode_santri,
        nama: namaWali,
        field: 'status',
        nilai_lama: 'MENUNGGU_PEMBAYARAN',
        nilai_baru: 'BATAL / KEDALUWARSA',
        detail: {
          id_pesanan: idPesananLabel,
          jumlah_kursi: order.jumlah_kursi,
          wa_sent: waRes.ok,
          created_at: order.created_at,
        },
        catatan: `Pembatalan otomatis pesanan kuota kedaluwarsa >6 jam (ID: ${idPesananLabel})`,
        created_at: nowIso,
      });

      results.push({
        id_pesanan: idPesananLabel,
        kode_santri: order.kode_santri,
        status: updatedRow.status,
        waSent: waRes.ok,
        waTarget: waRes.target,
        waReason: waRes.reason,
      });
    }

    return NextResponse.json({
      ok: true,
      checkedAt: nowIso,
      cutoff: cutoffIso,
      expiredCount: results.length,
      results,
    });
  } catch (err: any) {
    console.error('[Cron Expire Orders] Fatal error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'Terjadi kesalahan pada cron kedaluwarsa pesanan' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleExpireOrders(req);
}

export async function POST(req: NextRequest) {
  return handleExpireOrders(req);
}
