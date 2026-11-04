import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { store } from '@/lib/mock-data';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      kode_qr,
      jumlah_l = 0,
      jumlah_p = 0,
      jalur = 'TIMUR',
      jumlah_balita = 0,
      tiket_panggung = 0,
      panitia_id = 'panitia-gate',
      catatan,
      nama_peserta,
      tipe_peserta,
      extraSantriData,
      existingId,
    } = body;

    if (!kode_qr) {
      return NextResponse.json({ ok: false, reason: 'KODE_QR_KOSONG', pesan: 'Kode QR wajib diisi' }, { status: 400 });
    }

    // Bersihkan format kode jika berformat HFL27.SH0042.xxxx atau URL portal
    let cleanKode = String(kode_qr).trim().toUpperCase();
    if (cleanKode.includes('.')) {
      const parts = cleanKode.split('.');
      if (parts.length >= 2 && !/^HTTPS?:/i.test(parts[0])) cleanKode = parts[1].trim().toUpperCase();
    }
    const signedPortalMatch = cleanKode.match(/^(.+?)-[0-9A-F]{8}$/i);
    if (signedPortalMatch && signedPortalMatch[1]) {
      cleanKode = signedPortalMatch[1].trim().toUpperCase();
    }

    const numL = Number(jumlah_l) || 0;
    const numP = Number(jumlah_p) || 0;
    const numBalita = Number(jumlah_balita) || 0;
    const numTiketPanggung = Number(tiket_panggung) || 0;

    // 1. Ambil data peserta dari database via supabaseServer
    const [resSantri, resTamu] = await Promise.all([
      supabaseServer
        .from('peserta_santri')
        .select('*')
        .or(`kode.eq.${cleanKode},nis.eq.${cleanKode}`)
        .maybeSingle(),
      supabaseServer
        .from('tamu_undangan')
        .select('*')
        .eq('kode', cleanKode)
        .maybeSingle(),
    ]);

    const santri = resSantri.data;
    const tamu = resTamu.data;

    const targetNama = nama_peserta || santri?.nama || tamu?.nama || 'Peserta';
    const targetTipe = tipe_peserta || (santri ? 'KELUARGA' : 'UNDANGAN');

    // 2. Upsert ke presensi_log menggunakan client server (service_role)
    let primaryId = existingId;
    if (!primaryId) {
      const { data: existingLogs } = await supabaseServer
        .from('presensi_log')
        .select('id')
        .eq('kode_qr', cleanKode);

      if (existingLogs && existingLogs.length > 0) {
        primaryId = existingLogs[0].id;
        if (existingLogs.length > 1) {
          const extraIds = existingLogs.slice(1).map((r) => r.id);
          await supabaseServer.from('presensi_log').delete().in('id', extraIds);
        }
      }
    }

    const logPayload = {
      kode_qr: cleanKode,
      nama_peserta: targetNama,
      tipe_peserta: targetTipe,
      jalur: jalur || 'TIMUR',
      panitia_id: panitia_id || 'panitia-gate',
      jumlah_l: numL,
      jumlah_p: numP,
      jumlah_balita: numBalita,
      tiket_panggung: numTiketPanggung,
      catatan: catatan || `Presensi via ${jalur}`,
      created_at: new Date().toISOString(),
    };

    if (primaryId) {
      await supabaseServer.from('presensi_log').update(logPayload).eq('id', primaryId);
    } else {
      await supabaseServer.from('presensi_log').insert([logPayload]);
    }

    // 3. Hitung total kumulatif dan sinkronisasi kuota_terpakai
    const { data: allLogs } = await supabaseServer
      .from('presensi_log')
      .select('jumlah_l, jumlah_p')
      .eq('kode_qr', cleanKode);

    const totalTerpakai = (allLogs || []).reduce(
      (sum, item) => sum + (Number(item.jumlah_l) || 0) + (Number(item.jumlah_p) || 0),
      0
    );

    const santriUpdatePayload: Record<string, any> = {
      kuota_terpakai: totalTerpakai,
      updated_at: new Date().toISOString(),
      ...(extraSantriData || {}),
    };

    await Promise.all([
      supabaseServer.from('peserta_santri').update(santriUpdatePayload).or(`kode.eq.${cleanKode},nis.eq.${cleanKode}`),
      supabaseServer.from('tamu_undangan').update({ kuota_terpakai: totalTerpakai, updated_at: new Date().toISOString() }).eq('kode', cleanKode),
    ]);

    // 4. Sinkronkan juga ke mock in-memory store
    const mockRes = store.checkin(cleanKode, numL, numP, jalur as any, numBalita, panitia_id);

    return NextResponse.json({
      ok: true,
      pesan: `Presensi berhasil dicatat untuk ${targetNama}`,
      totalTerpakai,
      detail: santri || tamu || mockRes.detail,
      sisa: mockRes.sisa ?? 0,
    });
  } catch (err: any) {
    console.error('Error in /api/checkin:', err);
    return NextResponse.json({ ok: false, reason: err.message }, { status: 500 });
  }
}
