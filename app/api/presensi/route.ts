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

      // Cek apakah kode memiliki merged_group_id agar pembatalan berlaku atomik untuk seluruh grup
      const [batalSantri, batalTamu] = await Promise.all([
        supabaseServer.from('peserta_santri').select('merged_group_id').or(`kode.eq.${cleanKode}${cleanNis ? `,nis.eq.${cleanNis}` : ''}`).maybeSingle(),
        supabaseServer.from('tamu_undangan').select('merged_group_id').eq('kode', cleanKode).maybeSingle(),
      ]);
      const mergedGroupId = batalSantri.data?.merged_group_id || batalTamu.data?.merged_group_id;

      // Reset kuota_terpakai = 0 di tabel peserta_santri dan tamu_undangan
      const now = new Date().toISOString();
      const resetPromises: PromiseLike<any>[] = [delQuery];

      if (mergedGroupId) {
        resetPromises.push(
          supabaseServer.from('peserta_santri').update({ kuota_terpakai: 0, updated_at: now }).eq('merged_group_id', mergedGroupId),
          supabaseServer.from('tamu_undangan').update({ kuota_terpakai: 0, updated_at: now }).eq('merged_group_id', mergedGroupId)
        );
      } else {
        resetPromises.push(
          supabaseServer
            .from('peserta_santri')
            .update({ kuota_terpakai: 0, updated_at: now })
            .or(`kode.eq.${cleanKode}${cleanNis ? `,nis.eq.${cleanNis}` : ''}`),
          supabaseServer
            .from('tamu_undangan')
            .update({ kuota_terpakai: 0, updated_at: now })
            .eq('kode', cleanKode)
        );
      }
      await Promise.all(resetPromises);

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
      entityId,
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

    // 1. Parallel Roundtrip 1: Ambil data peserta + existing logs dalam SATU Promise.all
    const [resSantri, resTamu, resLogs] = await Promise.all([
      entityId && tipe_peserta === 'KELUARGA'
        ? supabaseServer.from('peserta_santri').select('id, nama, kuota_dasar, kuota_tambahan, kuota_terpakai, tiket_panggung_diberi, merged_group_id').eq('id', entityId).maybeSingle()
        : supabaseServer.from('peserta_santri').select('id, nama, kuota_dasar, kuota_tambahan, kuota_terpakai, tiket_panggung_diberi, merged_group_id').or(`kode.eq.${cleanKode},nis.eq.${cleanKode}`).maybeSingle(),
      entityId && tipe_peserta === 'UNDANGAN'
        ? supabaseServer.from('tamu_undangan').select('id, nama, kuota_terpakai, merged_group_id').eq('id', entityId).maybeSingle()
        : supabaseServer.from('tamu_undangan').select('id, nama, kuota_terpakai, merged_group_id').eq('kode', cleanKode).maybeSingle(),
      existingId
        ? Promise.resolve({ data: [{ id: existingId, jumlah_l: 0, jumlah_p: 0 }], error: null })
        : supabaseServer.from('presensi_log').select('id, jumlah_l, jumlah_p').eq('kode_qr', cleanKode),
    ]);

    const santri = resSantri.data;
    const tamu = resTamu.data;
    const targetNama = nama_peserta || santri?.nama || tamu?.nama || 'Peserta';
    const targetTipe = tipe_peserta || (santri ? 'KELUARGA' : 'UNDANGAN');

    // 2. Evaluasi Primary Log ID & Total Terpakai secara in-memory
    const existingLogs = resLogs.data || [];
    let primaryId = existingId || (existingLogs.length > 0 ? existingLogs[0].id : null);
    const extraIds = existingLogs.length > 1 ? existingLogs.slice(1).map((r: any) => r.id) : [];

    const totalTerpakai = numL + numP;

    const logPayload: Record<string, any> = {
      kode_qr: cleanKode,
      nama_peserta: targetNama,
      tipe_peserta: targetTipe,
      jalur: jalur || 'TIMUR',
      panitia_id: panitia_id || 'panitia-gate',
      jumlah_l: numL,
      jumlah_p: numP,
      jumlah_balita: numBalita,
      tiket_panggung: numTiketPanggung > 0,
      catatan: catatan || `Presensi via ${jalur}`,
      created_at: new Date().toISOString(),
    };

    // 3. Parallel Roundtrip 2: Simpan Log + Update Status Tabel Peserta Target (HANYA ke tabel yang sesuai menggunakan PK)
    const writePromises: PromiseLike<any>[] = [];

    // 3a. Upsert presensi_log
    if (primaryId) {
      writePromises.push(
        supabaseServer.from('presensi_log').update(logPayload).eq('id', primaryId)
      );
    } else {
      writePromises.push(
        supabaseServer.from('presensi_log').insert([logPayload])
      );
    }

    // 3b. Hapus duplikat ekstra jika ada
    if (extraIds.length > 0) {
      writePromises.push(
        supabaseServer.from('presensi_log').delete().in('id', extraIds)
      );
    }

    // 3c. Update data santri atau tamu langsung menggunakan indexed Primary Key (id) atau merged_group_id
    if (santri) {
      const santriUpdatePayload: Record<string, any> = {
        kuota_terpakai: totalTerpakai,
        updated_at: new Date().toISOString(),
        ...(extraSantriData || {}),
      };
      if (numTiketPanggung > 0) {
        santriUpdatePayload.tiket_panggung_diberi = 1;
      }
      if (santri.merged_group_id) {
        writePromises.push(
          supabaseServer.from('peserta_santri').update(santriUpdatePayload).eq('merged_group_id', santri.merged_group_id),
          supabaseServer.from('tamu_undangan').update({ kuota_terpakai: totalTerpakai, updated_at: new Date().toISOString() }).eq('merged_group_id', santri.merged_group_id)
        );
      } else {
        writePromises.push(
          supabaseServer.from('peserta_santri').update(santriUpdatePayload).eq('id', santri.id)
        );
      }
    } else if (tamu) {
      if (tamu.merged_group_id) {
        writePromises.push(
          supabaseServer.from('tamu_undangan').update({
            kuota_terpakai: totalTerpakai,
            updated_at: new Date().toISOString(),
          }).eq('merged_group_id', tamu.merged_group_id),
          supabaseServer.from('peserta_santri').update({
            kuota_terpakai: totalTerpakai,
            updated_at: new Date().toISOString(),
          }).eq('merged_group_id', tamu.merged_group_id)
        );
      } else {
        writePromises.push(
          supabaseServer.from('tamu_undangan').update({
            kuota_terpakai: totalTerpakai,
            updated_at: new Date().toISOString(),
          }).eq('id', tamu.id)
        );
      }
    }

    // Eksekusi seluruh operasi simpan secara paralel
    await Promise.all(writePromises);

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
