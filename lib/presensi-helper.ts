import { supabase } from './supabase';

/**
 * Sinkronisasi kuota_terpakai pada tabel `peserta_santri` dan `tamu_undangan`
 * berdasarkan total (jumlah_l + jumlah_p) dari seluruh catatan `presensi_log` untuk kode_qr tertentu.
 */
export async function syncKuotaTerpakai(kode: string): Promise<number> {
  if (!kode) return 0;

  try {
    const { data: logs, error: fetchErr } = await supabase
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

    // Update peserta_santri & tamu_undangan
    await Promise.all([
      supabase
        .from('peserta_santri')
        .update({ kuota_terpakai: totalTerpakai, updated_at: new Date().toISOString() })
        .eq('kode', kode),
      supabase
        .from('tamu_undangan')
        .update({ kuota_terpakai: totalTerpakai, updated_at: new Date().toISOString() })
        .eq('kode', kode),
    ]);

    return totalTerpakai;
  } catch (err) {
    console.error('Failed to sync kuota_terpakai:', err);
    return 0;
  }
}

/**
 * Upsert presensi_log untuk kode_qr.
 * Menjamin 1 kode_qr hanya memiliki 1 record presensi_log aktif, atau mengupdate jika sudah ada.
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
}) {
  const { kode_qr } = payload;
  if (!kode_qr) throw new Error('kode_qr required for upsertPresensiLog');

  // Check existing log
  const { data: existingLogs } = await supabase
    .from('presensi_log')
    .select('id')
    .eq('kode_qr', kode_qr);

  if (existingLogs && existingLogs.length > 0) {
    const primaryId = existingLogs[0].id;
    // Update the existing row
    const { error: updateErr } = await supabase
      .from('presensi_log')
      .update({
        nama_peserta: payload.nama_peserta,
        tipe_peserta: payload.tipe_peserta,
        jalur: payload.jalur,
        panitia_id: payload.panitia_id,
        jumlah_l: payload.jumlah_l ?? 0,
        jumlah_p: payload.jumlah_p ?? 0,
        jumlah_balita: payload.jumlah_balita ?? 0,
        tiket_panggung: payload.tiket_panggung ?? 0,
        catatan: payload.catatan,
        created_at: new Date().toISOString(),
      })
      .eq('id', primaryId);

    if (updateErr) throw updateErr;

    // Clean up any duplicate legacy rows if more than 1 row exists
    if (existingLogs.length > 1) {
      const extraIds = existingLogs.slice(1).map((r) => r.id);
      await supabase.from('presensi_log').delete().in('id', extraIds);
    }
  } else {
    // Insert new row
    const { error: insertErr } = await supabase.from('presensi_log').insert([
      {
        kode_qr,
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
      },
    ]);
    if (insertErr) throw insertErr;
  }

  // Sync kuota terpakai
  await syncKuotaTerpakai(kode_qr);
}
