import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getSessionRole } from '@/lib/auth-server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const role = getSessionRole(req);
  if (!role) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized: Sesi tidak valid atau belum login.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { action } = body;

    // =========================================================================
    // 1. DETEKSI DUPLIKASI OTOMATIS (NAMA SAMA & KOTA ASAL SAMA)
    // =========================================================================
    if (action === 'detect') {
      const { nama, alamat, type } = body;
      if (!nama || !nama.trim()) {
        return NextResponse.json({ detected: false });
      }

      const cleanNama = nama.trim().toUpperCase();
      const rawAlamat = (alamat || '').trim().toUpperCase();
      const lastWordAlamat = rawAlamat.split(/\s+/).pop() || '';

      const tableName = type === 'SANTRI' ? 'peserta_santri' : 'tamu_undangan';
      const { data: rows, error } = await supabaseServer
        .from(tableName)
        .select('*')
        .ilike('nama', cleanNama);

      if (error || !rows || rows.length === 0) {
        return NextResponse.json({ detected: false });
      }

      // Cari yang kota asalnya (kata terakhir alamat) sama
      const matched = rows.find(r => {
        const rAlamat = (r.alamat || '').trim().toUpperCase();
        if (!rAlamat || !lastWordAlamat) return true; // jika salah satu kosong, cocokkan nama saja
        const rLastWord = rAlamat.split(/\s+/).pop() || '';
        return rLastWord === lastWordAlamat || rAlamat.includes(lastWordAlamat) || lastWordAlamat.includes(rLastWord);
      }) || rows[0];

      return NextResponse.json({
        detected: true,
        record: {
          id: matched.id,
          nama: matched.nama,
          alamat: matched.alamat,
          kode: matched.kode,
          kategori: matched.kategori || matched.sub_kategori || matched.kategori_utama,
          kuota_terpakai: matched.kuota_terpakai || 0,
          merged_group_id: matched.merged_group_id || null,
        },
      });
    }

    // =========================================================================
    // 2. MERGE DATA (GABUNGKAN PESERTA)
    // =========================================================================
    if (action === 'merge') {
      const { items } = body as { items: Array<{ id: string; table: 'tamu_undangan' | 'peserta_santri' }> };
      if (!items || items.length < 2) {
        return NextResponse.json(
          { ok: false, error: 'Minimal 2 data peserta harus dipilih untuk digabungkan.' },
          { status: 400 }
        );
      }

      // Ambil seluruh data untuk validasi kuota_terpakai
      const tamuIds = items.filter(i => i.table === 'tamu_undangan').map(i => i.id);
      const santriIds = items.filter(i => i.table === 'peserta_santri').map(i => i.id);

      const [resTamu, resSantri] = await Promise.all([
        tamuIds.length > 0 ? supabaseServer.from('tamu_undangan').select('id, nama, kuota_terpakai, merged_group_id').in('id', tamuIds) : { data: [], error: null },
        santriIds.length > 0 ? supabaseServer.from('peserta_santri').select('id, nama, kuota_terpakai, merged_group_id').in('id', santriIds) : { data: [], error: null },
      ]);

      const allRecords = [...(resTamu.data || []), ...(resSantri.data || [])];

      // ⚠️ ATURAN KETAT: Merge HANYA bisa dilakukan jika peserta BELUM PERNAH SCAN (kuota_terpakai == 0)
      const hasScanned = allRecords.some(r => Number(r.kuota_terpakai || 0) > 0);
      if (hasScanned) {
        return NextResponse.json(
          { ok: false, error: 'Tidak dapat menggabungkan data yang sudah melakukan scan kehadiran.' },
          { status: 400 }
        );
      }

      // Tentukan target merged_group_id
      const existingGroupId = allRecords.find(r => r.merged_group_id)?.merged_group_id;
      const targetGroupId = existingGroupId || crypto.randomUUID();

      const updatePromises: PromiseLike<any>[] = [];
      if (tamuIds.length > 0) {
        updatePromises.push(
          supabaseServer
            .from('tamu_undangan')
            .update({ merged_group_id: targetGroupId, updated_at: new Date().toISOString() })
            .in('id', tamuIds)
        );
      }
      if (santriIds.length > 0) {
        updatePromises.push(
          supabaseServer
            .from('peserta_santri')
            .update({ merged_group_id: targetGroupId, updated_at: new Date().toISOString() })
            .in('id', santriIds)
        );
      }

      await Promise.all(updatePromises);

      return NextResponse.json({
        ok: true,
        merged_group_id: targetGroupId,
        pesan: `Berhasil menggabungkan ${allRecords.length} data peserta.`,
      });
    }

    // =========================================================================
    // 3. UNMERGE DATA (PISAHKAN PESERTA)
    // =========================================================================
    if (action === 'unmerge') {
      const { items, groupId } = body as {
        items?: Array<{ id: string; table: 'tamu_undangan' | 'peserta_santri' }>;
        groupId?: string;
      };

      if (!items && !groupId) {
        return NextResponse.json(
          { ok: false, error: 'Item atau Group ID wajib disertakan untuk unmerge.' },
          { status: 400 }
        );
      }

      // Cari semua record yang terlibat dalam grup ini
      let queryGroupId = groupId;
      if (!queryGroupId && items && items.length > 0) {
        const first = items[0];
        const { data: rec } = await supabaseServer
          .from(first.table)
          .select('merged_group_id')
          .eq('id', first.id)
          .maybeSingle();
        queryGroupId = rec?.merged_group_id;
      }

      if (!queryGroupId) {
        return NextResponse.json(
          { ok: false, error: 'Data tidak tergabung dalam grup merge manapun.' },
          { status: 400 }
        );
      }

      // Ambil seluruh anggota grup untuk cek kuota_terpakai
      const [resTamuGroup, resSantriGroup] = await Promise.all([
        supabaseServer.from('tamu_undangan').select('id, kuota_terpakai').eq('merged_group_id', queryGroupId),
        supabaseServer.from('peserta_santri').select('id, kuota_terpakai').eq('merged_group_id', queryGroupId),
      ]);

      const allInGroup = [...(resTamuGroup.data || []), ...(resSantriGroup.data || [])];

      // ⚠️ ATURAN KETAT: Unmerge HANYA bisa dilakukan jika peserta BELUM PERNAH SCAN (kuota_terpakai == 0)
      const hasScanned = allInGroup.some(r => Number(r.kuota_terpakai || 0) > 0);
      if (hasScanned) {
        return NextResponse.json(
          { ok: false, error: 'Tidak dapat dipisahkan karena peserta sudah melakukan scan kehadiran.' },
          { status: 400 }
        );
      }

      // Pisahkan baris yang dipilih (atau seluruh grup jika items tidak dispesifikasikan)
      const targetItems = items && items.length > 0
        ? items
        : [
            ...(resTamuGroup.data || []).map(r => ({ id: r.id, table: 'tamu_undangan' as const })),
            ...(resSantriGroup.data || []).map(r => ({ id: r.id, table: 'peserta_santri' as const })),
          ];

      const tamuToNull = targetItems.filter(i => i.table === 'tamu_undangan').map(i => i.id);
      const santriToNull = targetItems.filter(i => i.table === 'peserta_santri').map(i => i.id);

      const nullPromises: PromiseLike<any>[] = [];
      if (tamuToNull.length > 0) {
        nullPromises.push(
          supabaseServer
            .from('tamu_undangan')
            .update({ merged_group_id: null, updated_at: new Date().toISOString() })
            .in('id', tamuToNull)
        );
      }
      if (santriToNull.length > 0) {
        nullPromises.push(
          supabaseServer
            .from('peserta_santri')
            .update({ merged_group_id: null, updated_at: new Date().toISOString() })
            .in('id', santriToNull)
        );
      }

      await Promise.all(nullPromises);

      // Cek sisa record di grup tersebut. Jika hanya tersisa 1, lepaskan juga record tersebut.
      const [remTamu, remSantri] = await Promise.all([
        supabaseServer.from('tamu_undangan').select('id').eq('merged_group_id', queryGroupId),
        supabaseServer.from('peserta_santri').select('id').eq('merged_group_id', queryGroupId),
      ]);
      const remainingCount = (remTamu.data?.length || 0) + (remSantri.data?.length || 0);
      if (remainingCount === 1) {
        if (remTamu.data && remTamu.data.length > 0) {
          await supabaseServer.from('tamu_undangan').update({ merged_group_id: null }).eq('id', remTamu.data[0].id);
        }
        if (remSantri.data && remSantri.data.length > 0) {
          await supabaseServer.from('peserta_santri').update({ merged_group_id: null }).eq('id', remSantri.data[0].id);
        }
      }

      return NextResponse.json({
        ok: true,
        pesan: 'Data peserta berhasil dipisahkan (unmerged).',
      });
    }

    return NextResponse.json({ ok: false, error: 'Aksi tidak dikenali.' }, { status: 400 });
  } catch (err: any) {
    console.error('[API Peserta Merge] Fatal error:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
