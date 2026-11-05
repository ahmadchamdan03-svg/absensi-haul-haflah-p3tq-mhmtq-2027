import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { store } from '@/lib/mock-data';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type,
      kode,
      token,
      status_konfirmasi,
      perkiraan_l,
      perkiraan_p,
      hari_konfirmasi,
      jam_konfirmasi,
      catatan_konfirmasi,
    } = body;

    const targetKode = String(kode || token || '').trim().toUpperCase();

    if (!targetKode) {
      return NextResponse.json(
        { ok: false, error: 'Kode atau token peserta wajib disertakan.' },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();

    if (type === 'TAMU') {
      const payload: Record<string, any> = {
        status_konfirmasi: status_konfirmasi || 'HADIR',
        updated_at: nowIso,
      };

      const { data, error } = await supabaseServer
        .from('tamu_undangan')
        .update(payload)
        .eq('kode', targetKode)
        .select();

      if (error) {
        console.error('[API RSVP] Tamu update error:', error);
        return NextResponse.json(
          { ok: false, error: `Gagal memperbarui konfirmasi tamu: ${error.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        data,
        pesan: 'Konfirmasi kehadiran tamu berhasil disimpan.',
      });
    }

    // Default: SANTRI (Wali)
    const payload: Record<string, any> = {
      status_konfirmasi: status_konfirmasi || 'SUDAH',
      perkiraan_l: Number(perkiraan_l ?? 0),
      perkiraan_p: Number(perkiraan_p ?? 0),
      updated_at: nowIso,
    };

    if (hari_konfirmasi !== undefined) payload.hari_konfirmasi = hari_konfirmasi;
    if (jam_konfirmasi !== undefined) payload.jam_konfirmasi = jam_konfirmasi;
    if (catatan_konfirmasi !== undefined) payload.catatan_konfirmasi = catatan_konfirmasi;

    const { data, error } = await supabaseServer
      .from('peserta_santri')
      .update(payload)
      .eq('kode', targetKode)
      .select();

    if (error) {
      console.error('[API RSVP] Santri update error:', error);
      return NextResponse.json(
        { ok: false, error: `Gagal memperbarui konfirmasi santri: ${error.message}` },
        { status: 500 }
      );
    }

    // Sync ke mock store
    try {
      store.simpanEstimasi(targetKode, Number(perkiraan_l ?? 0), Number(perkiraan_p ?? 0), 'WALI_MANDIRI');
    } catch {}

    return NextResponse.json({
      ok: true,
      data,
      pesan: 'Konfirmasi kehadiran santri berhasil disimpan.',
    });
  } catch (err: any) {
    console.error('[API RSVP] Fatal error:', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Terjadi kesalahan sistem saat memproses konfirmasi.' },
      { status: 500 }
    );
  }
}
