import { supabase } from './supabase/client';

/**
 * Sinkronisasi kuota_terpakai pada tabel `peserta_santri` dan `tamu_undangan`
 * berdasarkan total (jumlah_l + jumlah_p) dari seluruh catatan `presensi_log` untuk kode_qr tertentu.
 */
export async function syncKuotaTerpakai(
  kode: string,
  extraSantriData?: Record<string, any>
): Promise<number> {
  if (!kode) return 0;

  // Di browser, sinkronisasi kuota dilakukan secara atomik di sisi server via API /api/checkin
  if (typeof window !== 'undefined') {
    try {
      const { data: logs } = await supabase
        .from('presensi_log')
        .select('jumlah_l, jumlah_p')
        .eq('kode_qr', kode);

      return (logs || []).reduce(
        (sum, item) => sum + (Number(item.jumlah_l) || 0) + (Number(item.jumlah_p) || 0),
        0
      );
    } catch {
      return 0;
    }
  }

  // Di server environment: gunakan supabaseServer
  try {
    const { supabaseServer } = await import('./supabase/server');
    const { data: logs, error: fetchErr } = await supabaseServer
      .from('presensi_log')
      .select('jumlah_l, jumlah_p')
      .eq('kode_qr', kode);

    if (fetchErr) {
      console.error('Error fetching presensi_log in syncKuotaTerpakai:', fetchErr);
    }

    const totalTerpakai = (logs || []).reduce(
      (sum, item) => sum + (Number(item.jumlah_l) || 0) + (Number(item.jumlah_p) || 0),
      0
    );

    const santriPayload: Record<string, any> = {
      kuota_terpakai: totalTerpakai,
      updated_at: new Date().toISOString(),
      ...(extraSantriData || {}),
    };

    await Promise.all([
      supabaseServer
        .from('peserta_santri')
        .update(santriPayload)
        .or(`kode.eq.${kode},nis.eq.${kode}`),
      supabaseServer
        .from('tamu_undangan')
        .update({ kuota_terpakai: totalTerpakai, updated_at: new Date().toISOString() })
        .eq('kode', kode),
    ]);

    return totalTerpakai;
  } catch (err) {
    console.error('Failed to sync kuota_terpakai on server:', err);
    return 0;
  }
}

/**
 * Upsert presensi_log untuk kode_qr.
 * Menjamin 1 kode_qr hanya memiliki 1 record presensi_log aktif, atau mengupdate jika sudah ada.
 * Pada browser, diarahkan ke API route /api/checkin agar diproses dengan supabaseServer (service_role).
 */
export async function upsertPresensiLog(payload: {
  kode_qr: string;
  nama_peserta?: string;
  tipe_peserta?: string;
  jalur?: string;
  panitia_id?: string;
  jumlah_l?: number;
  jumlah_p?: number;
  jumlah_balita?: number;
  tiket_panggung?: number;
  catatan?: string;
  extraSantriData?: Record<string, any>;
  existingId?: string;
}) {
  const { kode_qr } = payload;
  if (!kode_qr) throw new Error('kode_qr required for upsertPresensiLog');

  // Jika dipanggil dari browser (Client Component), panggil API route server
  if (typeof window !== 'undefined') {
    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || data.ok === false) {
      throw new Error(data.pesan || data.reason || 'Gagal menyimpan presensi ke server');
    }
    return data;
  }

  // Jika dipanggil langsung di lingkungan server (API route / Server Component)
  const { supabaseServer } = await import('./supabase/server');
  let primaryId = payload.existingId;

  if (!primaryId) {
    const { data: existingLogs, error: existingErr } = await supabaseServer
      .from('presensi_log')
      .select('id')
      .eq('kode_qr', kode_qr);

    if (existingErr) throw existingErr;

    if (existingLogs && existingLogs.length > 0) {
      primaryId = existingLogs[0].id;
      if (existingLogs.length > 1) {
        const extraIds = existingLogs.slice(1).map((r) => r.id);
        await supabaseServer.from('presensi_log').delete().in('id', extraIds);
      }
    }
  }

  const logRow = {
    nama_peserta: payload.nama_peserta,
    tipe_peserta: payload.tipe_peserta,
    jalur: payload.jalur || 'MEJA_REKONSILIASI',
    panitia_id: payload.panitia_id || 'panitia-rekonsiliasi',
    jumlah_l: payload.jumlah_l ?? 0,
    jumlah_p: payload.jumlah_p ?? 0,
    jumlah_balita: payload.jumlah_balita ?? 0,
    tiket_panggung: payload.tiket_panggung ?? 0,
    catatan: payload.catatan,
    created_at: new Date().toISOString(),
  };

  if (primaryId) {
    const { error: updateErr } = await supabaseServer
      .from('presensi_log')
      .update(logRow)
      .eq('id', primaryId);
    if (updateErr) throw updateErr;
  } else {
    const { error: insertErr } = await supabaseServer.from('presensi_log').insert([
      {
        kode_qr,
        ...logRow,
      },
    ]);
    if (insertErr) throw insertErr;
  }

  await syncKuotaTerpakai(kode_qr, payload.extraSantriData);
}
