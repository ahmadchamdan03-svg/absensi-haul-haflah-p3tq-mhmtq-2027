import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { store } from '@/lib/mock-data';
import { calculateKuotaDasarSantri } from '@/lib/types';

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
    const numL = Number(perkiraan_l ?? 0);
    const numP = Number(perkiraan_p ?? 0);

    if (
      !Number.isFinite(numL) ||
      !Number.isFinite(numP) ||
      !Number.isInteger(numL) ||
      !Number.isInteger(numP) ||
      numL < 0 ||
      numP < 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Jumlah kehadiran putra dan putri harus berupa bilangan bulat non-negatif.',
        },
        { status: 400 }
      );
    }

    const { data: existingSantri, error: fetchSantriErr } = await supabaseServer
      .from('peserta_santri')
      .select('kode, kategori_utama, sub_kategori, kuota_dasar, kuota_tambahan')
      .eq('kode', targetKode)
      .maybeSingle();

    if (fetchSantriErr) {
      console.error('[API RSVP] Fetch santri error:', fetchSantriErr);
      return NextResponse.json(
        { ok: false, error: `Gagal memeriksa data kuota santri: ${fetchSantriErr.message}` },
        { status: 500 }
      );
    }

    if (!existingSantri) {
      return NextResponse.json(
        { ok: false, error: 'Data santri tidak ditemukan.' },
        { status: 404 }
      );
    }

    const calculatedKDasar = calculateKuotaDasarSantri(
      existingSantri.kategori_utama,
      existingSantri.sub_kategori
    );
    const kDasar = Math.max(
      Number(existingSantri.kuota_dasar || 0),
      calculatedKDasar
    );
    const kTambahan = Number(existingSantri.kuota_tambahan || 0);
    const totalKuota = kDasar + kTambahan;

    if (numL + numP > totalKuota) {
      return NextResponse.json(
        {
          ok: false,
          error: `Total konfirmasi kehadiran (${numL + numP} kursi) melebihi kuota yang dimiliki (${totalKuota} kursi).`,
        },
        { status: 400 }
      );
    }

    const payload: Record<string, any> = {
      status_konfirmasi: status_konfirmasi || 'SUDAH',
      perkiraan_l: numL,
      perkiraan_p: numP,
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
      store.simpanEstimasi(targetKode, numL, numP, 'WALI_MANDIRI');
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
