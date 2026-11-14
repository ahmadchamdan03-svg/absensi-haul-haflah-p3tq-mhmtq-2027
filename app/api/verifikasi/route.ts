import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getSessionRole } from '@/lib/auth-server';
import { buildRejectQuotaMessage, sendFonnteServerMessage } from '@/lib/whatsapp';

async function recalculateSantriExtraQuota(kodeSantri: string, nowIso: string): Promise<number> {
  const { data: verifiedRows } = await supabaseServer
    .from('pembelian_kuota')
    .select('jumlah_kursi')
    .eq('kode_santri', kodeSantri)
    .in('status', ['DIVERIFIKASI', 'DITERIMA']);

  const newTambah = (verifiedRows || []).reduce((sum, r) => sum + Number(r.jumlah_kursi || 0), 0);

  const { error: updateSantriErr } = await supabaseServer
    .from('peserta_santri')
    .update({
      kuota_tambahan: newTambah,
      updated_at: nowIso,
    })
    .eq('kode', kodeSantri);

  if (updateSantriErr) {
    throw new Error(`Gagal update kuota santri: ${updateSantriErr.message}`);
  }

  return newTambah;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || 'verify';

    // 1. PUBLIC ORDER (Wali memesan kuota tambahan via /beli/[token])
    if (action === 'order_public') {
      const { newOrder } = body;
      if (!newOrder || !newOrder.kode_santri) {
        return NextResponse.json(
          { ok: false, error: 'Data pesanan tidak valid atau kode santri kosong.' },
          { status: 400 }
        );
      }

      const { data, error } = await supabaseServer
        .from('pembelian_kuota')
        .insert([newOrder])
        .select()
        .single();

      if (error) {
        console.error('[API Verifikasi] Error inserting order_public:', error);
        return NextResponse.json(
          { ok: false, error: `Gagal menyimpan pesanan: ${error.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true, data });
    }

    // 2. PUBLIC UPLOAD PROOF (Wali mengunggah bukti bayar)
    if (action === 'upload_proof') {
      const { id_pesanan, bukti_url } = body;
      if (!id_pesanan) {
        return NextResponse.json(
          { ok: false, error: 'ID pesanan wajib disertakan.' },
          { status: 400 }
        );
      }
      const nowIso = new Date().toISOString();
      const { error } = await supabaseServer
        .from('pembelian_kuota')
        .update({
          status: 'MENUNGGU_VERIFIKASI',
          bukti_url: bukti_url || null,
          uploaded_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id_pesanan', id_pesanan);

      if (error) {
        console.error('[API Verifikasi] Error updating proof:', error);
        return NextResponse.json(
          { ok: false, error: `Gagal memperbarui bukti bayar: ${error.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true, pesan: 'Bukti bayar berhasil diunggah.' });
    }

    // 2. ADMIN ACTIONS: Require valid panitia session
    const role = getSessionRole(req);
    if (!role) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized: Sesi panitia tidak valid atau belum login.' },
        { status: 401 }
      );
    }

    const nowIso = new Date().toISOString();

    // ACTION: VERIFY
    if (action === 'verify') {
      const { targetId, targetKode } = body;
      if (!targetId || !targetKode) {
        return NextResponse.json(
          { ok: false, error: 'ID pesanan dan kode santri wajib disertakan.' },
          { status: 400 }
        );
      }

      // Update pembelian_kuota
      const { error: updateOrderErr } = await supabaseServer
        .from('pembelian_kuota')
        .update({
          status: 'DIVERIFIKASI',
          verified_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id_pesanan', targetId);

      if (updateOrderErr) {
        return NextResponse.json(
          { ok: false, error: `Gagal verifikasi pembelian: ${updateOrderErr.message}` },
          { status: 500 }
        );
      }

      // Recalculate kuota_tambahan
      const newTambah = await recalculateSantriExtraQuota(targetKode, nowIso);

      return NextResponse.json({
        ok: true,
        newTambah,
        pesan: `Pesanan ${targetId} berhasil diverifikasi. Kuota tambahan menjadi +${newTambah}.`,
      });
    }

    // ACTION: REJECT
    if (action === 'reject') {
      const { targetId, noHpOverride } = body;
      if (!targetId) {
        return NextResponse.json(
          { ok: false, error: 'ID pesanan wajib disertakan.' },
          { status: 400 }
        );
      }

      // Ambil data pesanan terlebih dahulu untuk keperluan status, nama wali, dan santri
      let { data: orderRow, error: orderFetchErr } = await supabaseServer
        .from('pembelian_kuota')
        .select('id, id_pesanan, kode_santri, nama_wali, status')
        .eq('id_pesanan', targetId)
        .maybeSingle();

      if (!orderRow && !orderFetchErr) {
        const fallbackRes = await supabaseServer
          .from('pembelian_kuota')
          .select('id, id_pesanan, kode_santri, nama_wali, status')
          .eq('id', targetId)
          .maybeSingle();
        orderRow = fallbackRes.data;
        orderFetchErr = fallbackRes.error;
      }

      if (orderFetchErr) {
        return NextResponse.json(
          { ok: false, error: `Gagal memuat pesanan: ${orderFetchErr.message}` },
          { status: 500 }
        );
      }

      if (!orderRow) {
        return NextResponse.json(
          { ok: false, error: `Pesanan ${targetId} tidak ditemukan.` },
          { status: 404 }
        );
      }

      const nextStatus = 'BATAL / REFUND';
      const { error: updateErr } = await supabaseServer
        .from('pembelian_kuota')
        .update({
          status: nextStatus,
          updated_at: nowIso,
        })
        .eq('id', orderRow.id);

      if (updateErr) {
        return NextResponse.json(
          { ok: false, error: `Gagal menolak pesanan: ${updateErr.message}` },
          { status: 500 }
        );
      }

      // Jika pesanan sebelumnya sudah diverifikasi, hitung ulang kuota tambahan santri
      if (orderRow.kode_santri && (orderRow.status === 'DIVERIFIKASI' || orderRow.status === 'DITERIMA')) {
        await recalculateSantriExtraQuota(orderRow.kode_santri, nowIso);
      }

      // Ambil profil santri (nama santri, nama wali, dan nomor HP wali)
      const { data: santriRow } = orderRow.kode_santri
        ? await supabaseServer
            .from('peserta_santri')
            .select('nama, nama_wali, no_hp')
            .eq('kode', orderRow.kode_santri)
            .maybeSingle()
        : { data: null };

      const idPesananLabel = orderRow.id_pesanan || orderRow.id || targetId;
      const namaWali = orderRow.nama_wali || santriRow?.nama_wali || 'Wali Santri';
      const namaSantri = santriRow?.nama || orderRow.kode_santri || 'Santri';
      const targetHp = noHpOverride || santriRow?.no_hp || '';

      const pesanPenolakan = buildRejectQuotaMessage({
        namaWali,
        namaSantri,
        idPesanan: idPesananLabel,
      });

      const waResult = await sendFonnteServerMessage({
        target: targetHp,
        message: pesanPenolakan,
      });

      return NextResponse.json({
        ok: true,
        status: nextStatus,
        waSent: waResult.ok,
        waTarget: waResult.target || null,
        waReason: waResult.reason || null,
        pesan: `Pesanan ${idPesananLabel} telah DITOLAK (${nextStatus}).`,
      });
    }

    // ACTION: CREATE MANUAL
    if (action === 'create_manual') {
      const { newOrder, langsungVerifikasi, kodeSantri, jumlahKursi } = body;
      if (!newOrder) {
        return NextResponse.json(
          { ok: false, error: 'Data pesanan manual wajib disertakan.' },
          { status: 400 }
        );
      }

      const { data, error: insertErr } = await supabaseServer
        .from('pembelian_kuota')
        .insert([newOrder])
        .select()
        .single();

      if (insertErr) {
        return NextResponse.json(
          { ok: false, error: `Gagal membuat transaksi manual: ${insertErr.message}` },
          { status: 500 }
        );
      }

      if (langsungVerifikasi && kodeSantri) {
        const { data: currentSantri } = await supabaseServer
          .from('peserta_santri')
          .select('kuota_tambahan')
          .eq('kode', kodeSantri)
          .maybeSingle();

        const currentTambah = Number(currentSantri?.kuota_tambahan || 0);
        const newTambah = currentTambah + Number(jumlahKursi || 0);

        await supabaseServer
          .from('peserta_santri')
          .update({ kuota_tambahan: newTambah, updated_at: nowIso })
          .eq('kode', kodeSantri);
      }

      return NextResponse.json({
        ok: true,
        data,
        pesan: 'Transaksi manual berhasil dibuat.',
      });
    }

    return NextResponse.json({ ok: false, error: 'Action tidak dikenal.' }, { status: 400 });
  } catch (err: any) {
    console.error('[API Verifikasi] Fatal error:', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Terjadi kesalahan sistem saat memproses verifikasi.' },
      { status: 500 }
    );
  }
}
