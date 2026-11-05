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
      entityId,
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

    // 1. Parallel Roundtrip 1: Ambil data peserta + existing logs dalam SATU Promise.all
    const [resSantri, resTamu, resLogs] = await Promise.all([
      entityId && tipe_peserta === 'KELUARGA'
        ? supabaseServer.from('peserta_santri').select('id, nama, kuota_dasar, kuota_tambahan, kuota_terpakai, tiket_panggung_diberi').eq('id', entityId).maybeSingle()
        : supabaseServer.from('peserta_santri').select('id, nama, kuota_dasar, kuota_tambahan, kuota_terpakai, tiket_panggung_diberi').or(`kode.eq.${cleanKode},nis.eq.${cleanKode}`).maybeSingle(),
      entityId && tipe_peserta === 'UNDANGAN'
        ? supabaseServer.from('tamu_undangan').select('id, nama, kuota_terpakai').eq('id', entityId).maybeSingle()
        : supabaseServer.from('tamu_undangan').select('id, nama, kuota_terpakai').eq('kode', cleanKode).maybeSingle(),
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

    // 3c. Update data santri atau tamu langsung menggunakan indexed Primary Key (id)
    if (santri) {
      const santriUpdatePayload: Record<string, any> = {
        kuota_terpakai: totalTerpakai,
        updated_at: new Date().toISOString(),
        ...(extraSantriData || {}),
      };
      if (numTiketPanggung > 0) {
        santriUpdatePayload.tiket_panggung_diberi = 1;
      }
      writePromises.push(
        supabaseServer.from('peserta_santri').update(santriUpdatePayload).eq('id', santri.id)
      );
    } else if (tamu) {
      writePromises.push(
        supabaseServer.from('tamu_undangan').update({
          kuota_terpakai: totalTerpakai,
          updated_at: new Date().toISOString(),
        }).eq('id', tamu.id)
      );
    }

    // Eksekusi seluruh operasi simpan secara paralel
    await Promise.all(writePromises);

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
