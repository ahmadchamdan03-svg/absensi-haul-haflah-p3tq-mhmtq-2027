import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { getSessionRole } from '@/lib/auth-server';
import { cleanHonorificTamuName } from '@/lib/santri-merge-helper';
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
    // 1. DETEKSI DUPLIKASI OTOMATIS
    // Santri: Nama Siswi sama DAN Nama Wali sama
    // Tamu: Nama Tamu/Putra/Putri cocok DAN Kota (kata terakhir alamat) cocok
    // =========================================================================
    if (action === 'detect') {
      const { nama, nama_putra, namaPutra, nama_putri, namaPutri, alamat, nama_wali, namaWali, type } = body;
      const cleanNama = (nama || '').trim().toUpperCase().replace(/\s+/g, ' ');
      if (!cleanNama) {
        return NextResponse.json({ detected: false });
      }

      const rawAlamat = (alamat || '').trim().toUpperCase();
      const lastWordAlamat = rawAlamat.split(/[\s,.-]+/).pop() || '';
      const cleanWali = (nama_wali || namaWali || '').trim().toUpperCase().replace(/\s+/g, ' ');

      const isSantri = type === 'SANTRI';
      let rows: any[] = [];

      if (isSantri) {
        const { data, error } = await supabaseServer
          .from('peserta_santri')
          .select('*')
          .ilike('nama', cleanNama);
        if (!error && data) rows = data;
      } else {
        const rawP = (nama_putra || namaPutra || '').trim();
        const rawW = (nama_putri || namaPutri || '').trim();
        const candidateName = rawP || (rawW && rawW.toUpperCase() !== 'ISTRI' ? rawW : '') || cleanNama.split('&')[0].trim();
        const cleanTamuTarget = cleanHonorificTamuName(candidateName);

        const { data, error } = await supabaseServer
          .from('tamu_undangan')
          .select('*');
        if (!error && data) {
          rows = data.filter((r) => {
            const rP = r.nama_putra || '';
            const rW = r.nama_putri || '';
            const rN = r.nama || '';
            const rCandidate = rP || (rW && rW.toUpperCase() !== 'ISTRI' ? rW : '') || rN.split('&')[0];
            const rClean = cleanHonorificTamuName(rCandidate);
            return (
              rClean === cleanTamuTarget ||
              (cleanTamuTarget.length > 5 && rClean.includes(cleanTamuTarget)) ||
              (rClean.length > 5 && cleanTamuTarget.includes(rClean))
            );
          });
        }
      }

      if (!rows || rows.length === 0) {
        return NextResponse.json({ detected: false });
      }

      // Deteksi kecocokan berdasarkan aturan baru
      const matched = rows.find((r) => {
        if (isSantri) {
          const rNama = (r.nama || '').trim().toUpperCase().replace(/\s+/g, ' ');
          if (rNama !== cleanNama) return false;
          // Aturan 1 (Santri): Nama Siswi sama DAN Nama Wali sama
          const rWali = (r.nama_wali || '').trim().toUpperCase().replace(/\s+/g, ' ');
          if (!cleanWali || !rWali || cleanWali === '-' || rWali === '-') return true;
          return rWali === cleanWali || rWali.includes(cleanWali) || cleanWali.includes(rWali);
        } else {
          // Aturan 2 (Tamu): Nama Tamu/Putra/Putri cocok DAN Kota cocok
          const rAlamat = (r.alamat || r.instansi || '').trim().toUpperCase();
          if (!rAlamat || !lastWordAlamat || rAlamat === '-' || lastWordAlamat === '-') return true;
          const rLastWord = rAlamat.split(/[\s,.-]+/).pop() || '';
          return (
            rLastWord === lastWordAlamat ||
            rAlamat.includes(lastWordAlamat) ||
            lastWordAlamat.includes(rLastWord)
          );
        }
      });

      if (!matched) {
        return NextResponse.json({ detected: false });
      }

      return NextResponse.json({
        detected: true,
        record: {
          id: matched.id,
          nama: matched.nama,
          nama_putra: matched.nama_putra || null,
          nama_putri: matched.nama_putri || null,
          nama_wali: matched.nama_wali || '-',
          alamat: matched.alamat,
          kode: matched.kode,
          kategori: matched.kategori || matched.sub_kategori || matched.kategori_utama,
          kuota_terpakai: matched.kuota_terpakai || 0,
          merged_group_id: matched.merged_group_id || null,
        },
      });
    }

    // =========================================================================
    // 2. MERGE DATA (GABUNGKAN PESERTA DENGAN VALIDASI KETAT & PRIORITAS)
    // =========================================================================
    if (action === 'merge') {
      const { items } = body as { items: Array<{ id: string; table: 'tamu_undangan' | 'peserta_santri' }> };
      if (!items || items.length < 2) {
        return NextResponse.json(
          { ok: false, error: 'Minimal 2 data peserta harus dipilih untuk digabungkan.' },
          { status: 400 }
        );
      }

      // Ambil seluruh data untuk validasi nama, alamat, kuota_terpakai, dan variasi sub-kategori
      const tamuIds = items.filter(i => i.table === 'tamu_undangan').map(i => i.id);
      const santriIds = items.filter(i => i.table === 'peserta_santri').map(i => i.id);

      const [resTamu, resSantri] = await Promise.all([
        tamuIds.length > 0 ? supabaseServer.from('tamu_undangan').select('id, nama, nama_putra, nama_putri, alamat, no_hp, instansi, kategori, sub_kategori, kuota_terpakai, merged_group_id').in('id', tamuIds) : { data: [], error: null },
        santriIds.length > 0 ? supabaseServer.from('peserta_santri').select('id, nama, nama_wali, alamat, no_hp, kamar, kelas, sub_kategori, kategori_utama, kuota_terpakai, merged_group_id').in('id', santriIds) : { data: [], error: null },
      ]);

      const tamuRecords = resTamu.data || [];
      const santriRecords = resSantri.data || [];
      const allRecords = [...tamuRecords, ...santriRecords];

      if (allRecords.length < items.length) {
        return NextResponse.json(
          { ok: false, error: 'Sebagian data peserta tidak ditemukan atau telah dihapus.' },
          { status: 404 }
        );
      }

      // Kumpulkan variasi sub-kategori
      const subKategoriVariations = Array.from(
        new Set(
          allRecords
            .map((r: any) => (r.kategori || r.sub_kategori || r.kategori_utama || '').trim())
            .filter(Boolean)
        )
      );

      // ⚠️ ATURAN KETAT 1: Merge HANYA bisa dilakukan jika peserta BELUM PERNAH SCAN (kuota_terpakai == 0)
      const hasScanned = allRecords.some(r => Number(r.kuota_terpakai || 0) > 0);
      if (hasScanned) {
        return NextResponse.json(
          { ok: false, error: 'Tidak dapat menggabungkan data yang sudah melakukan scan kehadiran.' },
          { status: 400 }
        );
      }

      // Helper normalisasi
      const normText = (s?: string | null) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
      const getCity = (al?: string | null) => {
        if (!al) return '';
        const parts = al.trim().split(/[\s,.-]+/);
        return parts.pop()?.toLowerCase() || '';
      };

      // ⚠️ ATURAN KETAT 2: Validasi Syarat Merge Santri (Nama Siswi sama DAN Nama Wali sama)
      if (santriRecords.length > 1) {
        const firstSantri = santriRecords[0];
        const firstNama = normText(firstSantri.nama);
        const firstWali = normText(firstSantri.nama_wali);

        const santriMismatch = santriRecords.slice(1).some(r => {
          const rNama = normText(r.nama);
          const rWali = normText(r.nama_wali);
          const nameMatches = rNama === firstNama || rNama.includes(firstNama) || firstNama.includes(rNama);
          const waliMatches = !firstWali || !rWali || firstWali === '-' || rWali === '-' || firstWali === rWali || firstWali.includes(rWali) || rWali.includes(firstWali);
          return !nameMatches || !waliMatches;
        });

        if (santriMismatch) {
          return NextResponse.json(
            { ok: false, error: 'Gagal menggabungkan: Nama Siswi dan Nama Wali seluruh data santri harus cocok.' },
            { status: 400 }
          );
        }
      }

      // ⚠️ ATURAN KETAT 3: Validasi Syarat Merge Tamu (Nama Tamu sama DAN Kota/Alamat sama)
      if (tamuRecords.length > 1) {
        const firstTamu = tamuRecords[0];
        const firstP = firstTamu.nama_putra || '';
        const firstW = firstTamu.nama_putri || '';
        const firstNameCandidate = firstP || (firstW && firstW.toUpperCase() !== 'ISTRI' ? firstW : '') || (firstTamu.nama || '').split('&')[0];
        const firstCleanName = cleanHonorificTamuName(firstNameCandidate);
        const firstCity = getCity(firstTamu.alamat);

        const tamuMismatch = tamuRecords.slice(1).some(r => {
          const rP = r.nama_putra || '';
          const rW = r.nama_putri || '';
          const rNameCandidate = rP || (rW && rW.toUpperCase() !== 'ISTRI' ? rW : '') || (r.nama || '').split('&')[0];
          const rCleanName = cleanHonorificTamuName(rNameCandidate);
          const rCity = getCity(r.alamat);

          const nameMatches =
            firstCleanName === rCleanName ||
            (firstCleanName.length > 5 && rCleanName.includes(firstCleanName)) ||
            (rCleanName.length > 5 && firstCleanName.includes(rCleanName));

          const cityMatches =
            !firstCity || !rCity || firstCity === '-' || rCity === '-' ||
            firstCity === rCity || firstCity.includes(rCity) || rCity.includes(firstCity);

          return !nameMatches || !cityMatches;
        });

        if (tamuMismatch) {
          return NextResponse.json(
            { ok: false, error: 'Gagal menggabungkan: Nama Tamu dan Alamat (Kota) seluruh data tamu harus cocok.' },
            { status: 400 }
          );
        }
      }

      // Tentukan target merged_group_id
      const existingGroupId = allRecords.find(r => r.merged_group_id)?.merged_group_id;
      const targetGroupId = existingGroupId || crypto.randomUUID();

      const updatePromises: PromiseLike<any>[] = [];

      // ⚠️ ATURAN KETAT 4: Prioritas Data Santri: BIL_GHOIB (3) > TAMATAN (2) > BIN_NADZOR (1)
      // Timpa data dari kategori rendah dengan data dari kategori tertinggi (alamat, no_hp, kamar)
      if (santriRecords.length > 0) {
        const getSantriPriority = (kat: string = '') => {
          const k = kat.toUpperCase();
          if (k.includes('BIL_GHOIB') || k.includes('GHOIB')) return 3;
          if (k.includes('TAMATAN')) return 2;
          if (k.includes('BIN_NADZOR') || k.includes('NADZOR')) return 1;
          return 0;
        };

        const sortedSantri = [...santriRecords].sort(
          (a, b) => getSantriPriority(b.kategori_utama) - getSantriPriority(a.kategori_utama)
        );
        const masterSantri = sortedSantri[0];

        const targetAlamat = masterSantri.alamat || 'Kediri';
        const targetNoHp = masterSantri.no_hp || '-';
        const targetKamar = masterSantri.kamar || '-';

        updatePromises.push(
          supabaseServer
            .from('peserta_santri')
            .update({
              merged_group_id: targetGroupId,
              alamat: targetAlamat,
              no_hp: targetNoHp,
              kamar: targetKamar,
              updated_at: new Date().toISOString(),
            })
            .in('id', santriIds)
        );
      }

      // ⚠️ ATURAN KETAT 5: Prioritas Data Tamu: VVIP (400) > VIP (300) > KEHORMATAN (200) > UMUM (100)
      // Saling melengkapi nama putri, kota, dan no hp
      if (tamuRecords.length > 0) {
        const getTamuPriority = (kategori: string = '', subKategori: string = '') => {
          const kat = (kategori || '').toUpperCase();
          const sub = (subKategori || '').toUpperCase();
          if (kat.includes('VVIP')) return 400;
          if (kat.includes('VIP') || sub.includes('ISTIMEWA')) return 300;
          if (sub.includes('KEHORMATAN') || kat.includes('KEHORMATAN')) return 200;
          return 100;
        };

        const sortedTamu = [...tamuRecords].sort(
          (a, b) => getTamuPriority(b.kategori, b.sub_kategori) - getTamuPriority(a.kategori, a.sub_kategori)
        );
        const masterTamu = sortedTamu[0];

        const bestPutri = tamuRecords.find(r => r.nama_putri && r.nama_putri.trim() !== '' && r.nama_putri.trim() !== '-')?.nama_putri?.trim() || '';
        const bestPutra = tamuRecords.find(r => r.nama_putra && r.nama_putra.trim() !== '' && r.nama_putra.trim() !== '-')?.nama_putra?.trim() || masterTamu.nama_putra || '';
        const bestNoHp = tamuRecords.find(r => r.no_hp && r.no_hp.trim() !== '' && r.no_hp.trim() !== '-')?.no_hp?.trim() || masterTamu.no_hp || '-';
        const bestAlamat = tamuRecords.find(r => r.alamat && r.alamat.trim() !== '' && r.alamat.trim() !== '-')?.alamat?.trim() || masterTamu.alamat || '-';
        const bestInstansi = tamuRecords.find(r => r.instansi && r.instansi.trim() !== '' && r.instansi.trim() !== '-')?.instansi?.trim() || masterTamu.instansi || '-';

        let finalNama = masterTamu.nama;
        if (bestPutra && bestPutri) {
          if (bestPutra.toLowerCase().trim() === bestPutri.toLowerCase().trim()) {
            finalNama = bestPutra;
          } else {
            finalNama = `${bestPutra} & ${bestPutri}`;
          }
        } else if (bestPutra) {
          finalNama = bestPutra;
        } else if (bestPutri) {
          finalNama = bestPutri;
        }

        const kuotaDasar = (bestPutra ? 1 : 0) + (bestPutri ? 1 : 0) || 1;

        for (const r of tamuRecords) {
          updatePromises.push(
            supabaseServer
              .from('tamu_undangan')
              .update({
                merged_group_id: targetGroupId,
                nama: finalNama,
                nama_putra: bestPutra || r.nama_putra || null,
                nama_putri: bestPutri || r.nama_putri || null,
                alamat: r.alamat && r.alamat !== '-' ? r.alamat : bestAlamat,
                no_hp: r.no_hp && r.no_hp !== '-' ? r.no_hp : bestNoHp,
                instansi: r.instansi && r.instansi !== '-' ? r.instansi : bestInstansi,
                kuota_dasar: kuotaDasar,
                updated_at: new Date().toISOString(),
              })
              .eq('id', r.id)
          );
        }
      }

      await Promise.all(updatePromises);

      return NextResponse.json({
        ok: true,
        merged_group_id: targetGroupId,
        sub_kategori_list: subKategoriVariations,
        pesan: `Berhasil menggabungkan ${allRecords.length} data peserta dengan sinkronisasi prioritas data.`,
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

export async function PATCH(req: NextRequest) {
  return POST(req);
}
