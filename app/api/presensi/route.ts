import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getSessionRole } from '@/lib/auth-server';
import { store } from '@/lib/mock-data';

export async function POST(req: NextRequest) {
  const role = getSessionRole(req);
  if (!role) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized: Sesi panitia tidak valid atau belum login.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const action = body.action || 'checkin';

    // 1. BATALKAN KEHADIRAN
    if (action === 'batal') {
      const { kode, nis } = body;
      if (!kode) {
        return NextResponse.json(
          { ok: false, error: 'Kode peserta wajib disertakan untuk pembatalan presensi.' },
          { status: 400 }
        );
      }

      const cleanKode = String(kode).trim().toUpperCase();
      const cleanNis = nis ? String(nis).trim().toUpperCase() : null;

      // Hapus dari presensi_log
      let delQuery = supabaseServer.from('presensi_log').delete();
      if (cleanNis && cleanNis !== cleanKode) {
        delQuery = delQuery.or(`kode_qr.eq.${cleanKode},kode_qr.eq.${cleanNis}`);
      } else {
        delQuery = delQuery.eq('kode_qr', cleanKode);
      }
      const { error: delErr } = await delQuery;
      if (delErr) {
        console.error('[API Presensi] Error deleting presensi_log:', delErr);
        return NextResponse.json(
          { ok: false, error: `Gagal membatalkan presensi: ${delErr.message}` },
          { status: 500 }
        );
      }

      // Reset kuota_terpakai = 0 di tabel peserta_santri dan tamu_undangan
      const now = new Date().toISOString();
      await Promise.all([
        supabaseServer
          .from('peserta_santri')
          .update({ kuota_terpakai: 0, updated_at: now })
          .or(`kode.eq.${cleanKode}${cleanNis ? `,nis.eq.${cleanNis}` : ''}`),
        supabaseServer
          .from('tamu_undangan')
          .update({ kuota_terpakai: 0, updated_at: now })
          .eq('kode', cleanKode),
      ]);

      // Mock store sync
      try {
        (store as any).batalCheckin(cleanKode);
      } catch (storeErr) {
        console.warn('[API Presensi] Mock store warning:', storeErr);
      }

      return NextResponse.json({
        ok: true,
        pesan: `Kehadiran untuk kode ${cleanKode} berhasil dibatalkan. Kuota telah dikembalikan.`,
      });
    }

    // 2. TOGGLE TIKET PANGGUNG (KARTU HITAM GOLD / CREAM)
    if (action === 'toggle_tiket_panggung') {
      const { id, kode, tiket_panggung_diberi } = body;
      if (!id && !kode) {
        return NextResponse.json(
          { ok: false, error: 'ID atau Kode peserta santri wajib disertakan.' },
          { status: 400 }
        );
      }

      const val = Number(tiket_panggung_diberi) || 0;
      let query = supabaseServer
        .from('peserta_santri')
        .update({ tiket_panggung_diberi: val, updated_at: new Date().toISOString() });

      if (id) {
        query = query.eq('id', id);
      } else {
        query = query.eq('kode', kode);
      }

      const { data, error } = await query.select();
      if (error) {
        console.error('[API Presensi] Error updating tiket_panggung_diberi:', error);
        return NextResponse.json(
          { ok: false, error: `Gagal memperbarui tiket panggung: ${error.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        data,
        pesan: `Tiket panggung berhasil diubah menjadi ${val}.`,
      });
    }

    // 3. CHECKIN PRESENSI (SCAN ATAU MANUAL)
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
      return NextResponse.json(
        { ok: false, error: 'Kode QR peserta wajib diisi.' },
        { status: 400 }
      );
    }

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
      const { error: upErr } = await supabaseServer.from('presensi_log').update(logPayload).eq('id', primaryId);
      if (upErr) throw upErr;
    } else {
      const { error: inErr } = await supabaseServer.from('presensi_log').insert([logPayload]);
      if (inErr) throw inErr;
    }

    // Hitung total kumulatif
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

    // Sinkronkan ke mock store
    try {
      store.checkin(cleanKode, numL, numP, jalur as any, numBalita, panitia_id);
    } catch {}

    return NextResponse.json({
      ok: true,
      pesan: `Presensi berhasil dicatat untuk ${targetNama}`,
      totalTerpakai,
      detail: santri || tamu,
    });
  } catch (err: any) {
    console.error('[API Presensi] Fatal error:', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Terjadi kesalahan sistem saat memproses presensi.' },
      { status: 500 }
    );
  }
}
