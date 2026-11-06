import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getSessionRole } from '@/lib/auth-server';
import { generateUniqueKodeFromDb } from '@/lib/utils';
import { store } from '@/lib/mock-data';
import { calculateKuotaDasarSantri, getWarnaTiketSantri } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const kode = searchParams.get('kode');
    const id = searchParams.get('id');

    if (!kode && !id) {
      const { data, error } = await supabaseServer
        .from('peserta_santri')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, data: data || [] });
    }

    let query = supabaseServer.from('peserta_santri').select('*');
    if (id) query = query.eq('id', id);
    else if (kode) query = query.eq('kode', kode);

    const { data, error } = await query.maybeSingle();
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ ok: false, notFound: true, error: 'Data santri tidak ditemukan atau telah dihapus.' }, { status: 200 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

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
      kategoriUtama,
      subKategori,
      kelas,
      kamar,
      namaWali,
      noHp,
      alamat,
      kuotaDasar,
      warnaTiket,
      kode,
    } = body;

    if (!nama || !nama.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Nama santri wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanNama = nama.trim().replace(/\s+/g, ' ');
    const cleanWali = (namaWali || '-').trim().replace(/\s+/g, ' ');
    const finalKatUtama = (kategoriUtama || 'BIL_GHOIB').toUpperCase();
    const finalSubKat = subKategori || (finalKatUtama === 'TAMATAN' ? 'Tamatan (A.01)' : (finalKatUtama === 'BIL_GHOIB' ? 'Bil Ghoib' : 'Bin Nadzori'));
    const resolvedKelas = kelas || (finalKatUtama === 'BIN_NADZOR' ? '2 Tsanawiyah' : finalKatUtama);
    const resolvedKamar = (kamar || '-').trim();
    const resolvedAlamat = (alamat || 'KEDIRI').trim().toUpperCase();
    const resolvedNoHp = (noHp || '-').trim();

    const finalKuota = Number(kuotaDasar) || calculateKuotaDasarSantri(finalKatUtama, finalSubKat);
    const finalWarna = warnaTiket || getWarnaTiketSantri(finalKatUtama, finalSubKat);
    const newKode = kode || (await generateUniqueKodeFromDb('SH', 'peserta_santri', supabaseServer));

    const insertPayload = {
      kode: newKode,
      nama: cleanNama,
      kategori_utama: finalKatUtama,
      sub_kategori: finalSubKat,
      kelas: resolvedKelas,
      kamar: resolvedKamar,
      nama_wali: cleanWali,
      no_hp: resolvedNoHp,
      alamat: resolvedAlamat,
      kuota_dasar: finalKuota,
      kuota_tambahan: 0,
      kuota_terpakai: 0,
      status_konfirmasi: 'BELUM',
      warna_tiket: finalWarna,
      tiket_panggung_diberi: 0,
      merged_group_id: body.merged_group_id || null,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseServer
      .from('peserta_santri')
      .insert([insertPayload])
      .select()
      .single();

    if (error) {
      console.error('[API Santri] Supabase insert error:', error);
      return NextResponse.json(
        { ok: false, error: `Gagal menyimpan santri ke database: ${error.message}` },
        { status: 500 }
      );
    }

    // Sinkronkan ke mock-data in-memory store
    try {
      store.tambahPeserta({
        nama: cleanNama,
        kategoriUtama: finalKatUtama as any,
        bagianTamatan: finalKatUtama === 'TAMATAN' ? finalSubKat : undefined,
        kelas: resolvedKelas,
        kamar: resolvedKamar,
        namaWali: cleanWali,
        noHp: resolvedNoHp,
        alamat: resolvedAlamat,
      });
    } catch (storeErr) {
      console.warn('[API Santri] Mock store sync warning:', storeErr);
    }

    return NextResponse.json({
      ok: true,
      data,
      kode: newKode,
      pesan: `Berhasil mendaftarkan santri: ${cleanNama} (${newKode})`,
    });
  } catch (err: any) {
    console.error('[API Santri] Fatal POST error:', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Terjadi kesalahan server saat menyimpan data santri.' },
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
        { ok: false, error: 'ID atau Kode santri wajib disertakan untuk pembaruan.' },
        { status: 400 }
      );
    }

    // Map camelCase fields to snake_case if passed
    const dbPayload: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.nama !== undefined) dbPayload.nama = updates.nama;
    if (updates.kategori_utama !== undefined) dbPayload.kategori_utama = updates.kategori_utama;
    else if (updates.kategoriUtama !== undefined) dbPayload.kategori_utama = updates.kategoriUtama;

    if (updates.sub_kategori !== undefined) dbPayload.sub_kategori = updates.sub_kategori;
    else if (updates.subKategori !== undefined) dbPayload.sub_kategori = updates.subKategori;

    if (updates.kelas !== undefined) dbPayload.kelas = updates.kelas;
    if (updates.kamar !== undefined) dbPayload.kamar = updates.kamar;

    if (updates.nama_wali !== undefined) dbPayload.nama_wali = updates.nama_wali;
    else if (updates.namaWali !== undefined) dbPayload.nama_wali = updates.namaWali;

    if (updates.no_hp !== undefined) dbPayload.no_hp = updates.no_hp;
    else if (updates.noHp !== undefined) dbPayload.no_hp = updates.noHp;

    if (updates.alamat !== undefined) dbPayload.alamat = updates.alamat;

    if (updates.kuota_dasar !== undefined) dbPayload.kuota_dasar = Number(updates.kuota_dasar);
    else if (updates.kuotaDasar !== undefined) dbPayload.kuota_dasar = Number(updates.kuotaDasar);

    if (updates.kuota_tambahan !== undefined) dbPayload.kuota_tambahan = Number(updates.kuota_tambahan);
    else if (updates.kuotaTambahan !== undefined) dbPayload.kuota_tambahan = Number(updates.kuotaTambahan);

    if (updates.kuota_terpakai !== undefined) dbPayload.kuota_terpakai = Number(updates.kuota_terpakai);
    else if (updates.kuotaTerpakai !== undefined) dbPayload.kuota_terpakai = Number(updates.kuotaTerpakai);

    if (updates.warna_tiket !== undefined) dbPayload.warna_tiket = updates.warna_tiket;
    else if (updates.warnaTiket !== undefined) dbPayload.warna_tiket = updates.warnaTiket;

    if (updates.status_konfirmasi !== undefined) dbPayload.status_konfirmasi = updates.status_konfirmasi;
    if (updates.tiket_panggung_diberi !== undefined) dbPayload.tiket_panggung_diberi = updates.tiket_panggung_diberi;
    if (updates.dapat_qr !== undefined) dbPayload.dapat_qr = updates.dapat_qr;
    if (updates.status_wa !== undefined) dbPayload.status_wa = updates.status_wa;
    if (updates.merged_group_id !== undefined) dbPayload.merged_group_id = updates.merged_group_id;
    else if (updates.mergedGroupId !== undefined) dbPayload.merged_group_id = updates.mergedGroupId;

    let query = supabaseServer.from('peserta_santri').update(dbPayload);
    if (id) {
      query = query.eq('id', id);
    } else {
      query = query.eq('kode', kode);
    }

    const { data, error } = await query.select();

    if (error) {
      console.error('[API Santri] Supabase update error:', error);
      return NextResponse.json(
        { ok: false, error: `Gagal memperbarui data santri: ${error.message}` },
        { status: 500 }
      );
    }

    // In-memory store sync
    if (kode) {
      try {
        store.editPeserta(kode, {
          nama: dbPayload.nama,
          kategoriUtama: dbPayload.kategori_utama,
          subKategori: dbPayload.sub_kategori,
          kelas: dbPayload.kelas,
          kamar: dbPayload.kamar,
          namaWali: dbPayload.nama_wali,
          noHp: dbPayload.no_hp,
          alamat: dbPayload.alamat,
          kuotaDasar: dbPayload.kuota_dasar,
        });
      } catch (storeErr) {
        console.warn('[API Santri] In-memory update warning:', storeErr);
      }
    }

    return NextResponse.json({
      ok: true,
      data,
      pesan: 'Data santri berhasil diperbarui.',
    });
  } catch (err: any) {
    console.error('[API Santri] Fatal PATCH error:', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Terjadi kesalahan server saat memperbarui data santri.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const role = getSessionRole(req);
  if (role !== 'ADMIN') {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized: Hanya akun ADMIN yang memiliki izin menghapus data santri.' },
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
        { ok: false, error: 'ID atau Kode santri wajib disertakan untuk penghapusan.' },
        { status: 400 }
      );
    }

    let targetKode = kode;
    let targetNama = body.nama || null;

    // Ambil data sebelum dihapus jika id diberikan tapi kode/nama belum ada
    if (id || !targetNama) {
      let q = supabaseServer.from('peserta_santri').select('kode, nama');
      if (id) q = q.eq('id', id);
      else q = q.eq('kode', targetKode);
      const { data: existing } = await q.maybeSingle();
      if (existing) {
        if (!targetKode) targetKode = existing.kode;
        if (!targetNama) targetNama = existing.nama;
      }
    }

    // 1. Bersihkan tabel relasi terkait (fallback aplikasi selain DB trigger)
    if (targetKode) {
      await supabaseServer.from('presensi_log').delete().eq('kode_qr', targetKode);
      await supabaseServer.from('pembelian_kuota').delete().eq('kode_santri', targetKode);
      await supabaseServer.from('antrean_presensi_gagal').delete().eq('kode_qr', targetKode);
    }

    // 2. Hapus dari peserta_santri
    let query = supabaseServer.from('peserta_santri').delete();
    if (id) {
      query = query.eq('id', id);
    } else {
      query = query.eq('kode', targetKode);
    }

    const { error } = await query;
    if (error) {
      console.error('[API Santri] Supabase delete error:', error);
      return NextResponse.json(
        { ok: false, error: `Gagal menghapus data santri: ${error.message}` },
        { status: 500 }
      );
    }

    // 3. Catat aktivitas penghapusan ke audit_log
    try {
      await supabaseServer.from('audit_log').insert({
        panitia_id: 'ADMIN',
        panitia_role: role,
        aksi: 'HAPUS',
        tabel: 'peserta_santri',
        kode: targetKode || null,
        nama: targetNama || null,
        detail: { id, kode: targetKode, nama: targetNama },
        catatan: `Penghapusan santri ${targetNama || targetKode || id} berhasil beserta cascade log presensi dan kuota.`,
        created_at: new Date().toISOString(),
      });
    } catch (auditErr) {
      console.warn('[API Santri] Audit log insert warning:', auditErr);
    }

    if (targetKode) {
      try {
        store.hapusPeserta(targetKode);
      } catch {}
    }

    return NextResponse.json({
      ok: true,
      pesan: `Data santri ${targetKode || id} berhasil dihapus dari sistem.`,
    });
  } catch (err: any) {
    console.error('[API Santri] Fatal DELETE error:', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Terjadi kesalahan server saat menghapus data santri.' },
      { status: 500 }
    );
  }
}
