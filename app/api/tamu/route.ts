import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getSessionRole } from '@/lib/auth-server';
import { generateUniqueKodeFromDb } from '@/lib/utils';
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
    const {
      nama,
      namaPutra,
      namaPutri,
      instansi,
      alamat,
      kategori,
      subKategori,
      noHp,
      kuotaDasar,
      warnaTiket,
      kode,
    } = body;

    if (!nama && !namaPutra && !namaPutri) {
      return NextResponse.json(
        { ok: false, error: 'Nama tamu atau putra/putri wajib diisi.' },
        { status: 400 }
      );
    }

    const finalNama = (nama || [namaPutra, namaPutri].filter(Boolean).join(' & ') || 'Tamu Undangan').trim();
    const newKode = kode || (await generateUniqueKodeFromDb('UND', 'tamu_undangan', supabaseServer));
    const finalKategori = (kategori || 'UMUM').toUpperCase();
    const finalSubKategori = (subKategori || 'ISTIMEWA').toUpperCase();
    const finalInstansi = instansi || '-';
    const finalAlamat = alamat || '-';
    const finalNoHp = noHp || '-';
    const finalWarna = warnaTiket || (finalSubKategori === 'ISTIMEWA' ? 'Cream' : 'Biru');
    const hasP = !!(namaPutra && String(namaPutra).trim());
    const hasW = !!(namaPutri && String(namaPutri).trim());
    let autoKuota = hasP && hasW ? 2 : (hasP || hasW ? 1 : 0);
    if (autoKuota === 0 && finalNama) {
      autoKuota = finalNama.includes('&') ? 2 : 1;
    }
    const finalKuota = autoKuota > 0 ? autoKuota : (Number(kuotaDasar) || 1);

    const insertPayload = {
      kode: newKode,
      nama: finalNama,
      nama_putra: namaPutra || null,
      nama_putri: namaPutri || null,
      instansi: finalInstansi,
      alamat: finalAlamat,
      kategori: finalKategori,
      sub_kategori: finalSubKategori,
      no_hp: finalNoHp,
      kuota_terpakai: 0,
      warna_tiket: finalWarna,
      merged_group_id: body.merged_group_id || null,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseServer
      .from('tamu_undangan')
      .insert([insertPayload])
      .select()
      .single();

    if (error) {
      console.error('[API Tamu] Supabase insert error:', error);
      return NextResponse.json(
        { ok: false, error: `Gagal menyimpan tamu ke database: ${error.message}` },
        { status: 500 }
      );
    }

    // Sinkronkan ke mock-data in-memory store
    try {
      store.tambahUndangan({
        nama: finalNama,
        namaPutra: namaPutra || undefined,
        namaPutri: namaPutri || undefined,
        kategori: finalKategori as any,
        instansi: finalInstansi,
        alamat: finalAlamat,
        kuotaDasar: finalKuota,
        golongan: finalSubKategori as any,
      });
    } catch (storeErr) {
      console.warn('[API Tamu] Mock store sync warning:', storeErr);
    }

    return NextResponse.json({
      ok: true,
      data,
      kode: newKode,
      pesan: `Berhasil mendaftarkan tamu: ${finalNama} (${newKode})`,
    });
  } catch (err: any) {
    console.error('[API Tamu] Fatal POST error:', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Terjadi kesalahan server saat menyimpan tamu.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const role = getSessionRole(req);
  if (!role) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized: Sesi panitia tidak valid.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { id, kode, ...updates } = body;

    if (!id && !kode) {
      return NextResponse.json(
        { ok: false, error: 'ID atau Kode tamu wajib disertakan untuk pembaruan.' },
        { status: 400 }
      );
    }

    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    let query = supabaseServer.from('tamu_undangan').update(payload);
    if (id) {
      query = query.eq('id', id);
    } else {
      query = query.eq('kode', kode);
    }

    const { data, error } = await query.select();

    if (error) {
      console.error('[API Tamu] Supabase update error:', error);
      return NextResponse.json(
        { ok: false, error: `Gagal memperbarui data tamu: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data,
      pesan: 'Data tamu berhasil diperbarui.',
    });
  } catch (err: any) {
    console.error('[API Tamu] Fatal PATCH error:', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Terjadi kesalahan server saat memperbarui data tamu.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const role = getSessionRole(req);
  if (role !== 'ADMIN') {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized: Hanya akun ADMIN yang memiliki izin menghapus data tamu.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { searchParams } = new URL(req.url);
    const id = body.id || searchParams.get('id');
    const kode = body.kode || searchParams.get('kode');

    if (!id && !kode) {
      return NextResponse.json(
        { ok: false, error: 'ID atau Kode tamu wajib disertakan untuk penghapusan.' },
        { status: 400 }
      );
    }

    let targetKode = kode;
    let targetNama = body.nama || null;

    // Ambil data sebelum dihapus jika id diberikan tapi kode/nama belum ada
    if (id || !targetNama) {
      let q = supabaseServer.from('tamu_undangan').select('kode, nama');
      if (id) q = q.eq('id', id);
      else q = q.eq('kode', targetKode);
      const { data: existing } = await q.maybeSingle();
      if (existing) {
        if (!targetKode) targetKode = existing.kode;
        if (!targetNama) targetNama = existing.nama;
      }
    }

    // 1. Bersihkan presensi_log terkait (fallback aplikasi selain DB trigger)
    if (targetKode) {
      await supabaseServer.from('presensi_log').delete().eq('kode_qr', targetKode);
      await supabaseServer.from('antrean_presensi_gagal').delete().eq('kode_qr', targetKode);
    }

    // 2. Hapus dari tamu_undangan
    let query = supabaseServer.from('tamu_undangan').delete();
    if (id) {
      query = query.eq('id', id);
    } else {
      query = query.eq('kode', targetKode);
    }

    const { error } = await query;
    if (error) {
      console.error('[API Tamu] Supabase delete error:', error);
      return NextResponse.json(
        { ok: false, error: `Gagal menghapus data tamu: ${error.message}` },
        { status: 500 }
      );
    }

    // 3. Catat aktivitas penghapusan ke audit_log
    try {
      await supabaseServer.from('audit_log').insert({
        panitia_id: 'ADMIN',
        panitia_role: role,
        aksi: 'HAPUS',
        tabel: 'tamu_undangan',
        kode: targetKode || null,
        nama: targetNama || null,
        detail: { id, kode: targetKode, nama: targetNama },
        catatan: `Penghapusan tamu ${targetNama || targetKode || id} berhasil beserta cascade log presensi.`,
        created_at: new Date().toISOString(),
      });
    } catch (auditErr) {
      console.warn('[API Tamu] Audit log insert warning:', auditErr);
    }

    if (targetKode) {
      try {
        (store as any).batalCheckin(targetKode);
      } catch {}
    }

    return NextResponse.json({
      ok: true,
      pesan: `Data tamu ${targetKode || id} berhasil dihapus dari sistem.`,
    });
  } catch (err: any) {
    console.error('[API Tamu] Fatal DELETE error:', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Terjadi kesalahan server saat menghapus data tamu.' },
      { status: 500 }
    );
  }
}
