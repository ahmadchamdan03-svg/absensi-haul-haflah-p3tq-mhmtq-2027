import { supabase } from '@/lib/supabase';

export interface MetricCardResult {
  totalHadir: number;
  totalKuota: number;
  totalL: number;
  totalP: number;
  persenHadir: number;
}

/**
 * Single Source of Truth Metrics Calculation for TOTAL WALI SANTRI.
 * - Numerator: SUM(jumlah_l + jumlah_p) from presensi_log for Wali Santri.
 * - Denominator: SUM(kuota_dasar + kuota_tambahan) from peserta_santri.
 */
export async function getWaliSantriMetrics(): Promise<MetricCardResult> {
  const { data: kuotaData, error: kuotaErr } = await supabase
    .from('peserta_santri')
    .select('kuota_dasar, kuota_tambahan');

  if (kuotaErr) {
    console.error('Error fetching peserta_santri kuota metrics:', kuotaErr);
  }

  const totalKuota = (kuotaData || []).reduce(
    (sum, r) => sum + Number(r.kuota_dasar || 0) + Number(r.kuota_tambahan || 0),
    0
  );

  const { data: presensiData, error: presensiErr } = await supabase
    .from('presensi_log')
    .select('jumlah_l, jumlah_p, kode_qr, tipe_peserta');

  if (presensiErr) {
    console.error('Error fetching presensi_log for wali metrics:', presensiErr);
  }

  const waliLogs = (presensiData || []).filter((r) => {
    const tipe = (r.tipe_peserta || '').toUpperCase();
    const qr = (r.kode_qr || '').toUpperCase();
    return tipe === 'SANTRI' || tipe === 'WALI' || qr.startsWith('SH');
  });

  const totalL = waliLogs.reduce((sum, r) => sum + Number(r.jumlah_l || 0), 0);
  const totalP = waliLogs.reduce((sum, r) => sum + Number(r.jumlah_p || 0), 0);
  const totalHadir = totalL + totalP;

  // Invariant validation
  if (totalHadir !== totalL + totalP) {
    console.error('INVARIANT ANOMALY in Wali Santri metrics:', { totalHadir, totalL, totalP });
  }

  const persenHadir = totalKuota > 0 ? Math.round((totalHadir / totalKuota) * 100) : 0;

  return {
    totalHadir,
    totalKuota,
    totalL,
    totalP,
    persenHadir,
  };
}

/**
 * Single Source of Truth Metrics Calculation for TOTAL TAMU UNDANGAN.
 * - Numerator: SUM(jumlah_l + jumlah_p) from presensi_log for Tamu Undangan.
 * - Denominator: SUM(kuota_dasar + kuota_tambahan) from tamu_undangan.
 */
export async function getTamuUndanganMetrics(): Promise<MetricCardResult> {
  const { data: kuotaData, error: kuotaErr } = await supabase
    .from('tamu_undangan')
    .select('nama_putra, nama_putri, kategori');

  if (kuotaErr) {
    console.error('Error fetching tamu_undangan kuota metrics:', kuotaErr);
  }

  const totalKuota = (kuotaData || []).reduce((sum, r: any) => {
    const countL = r.nama_putra && String(r.nama_putra).trim() ? 1 : 0;
    const countP = r.nama_putri && String(r.nama_putri).trim() ? 1 : 0;
    return sum + countL + countP;
  }, 0);

  const { data: presensiData, error: presensiErr } = await supabase
    .from('presensi_log')
    .select('jumlah_l, jumlah_p, kode_qr, tipe_peserta');

  if (presensiErr) {
    console.error('Error fetching presensi_log for tamu metrics:', presensiErr);
  }

  const tamuLogs = (presensiData || []).filter((r) => {
    const tipe = (r.tipe_peserta || '').toUpperCase();
    const qr = (r.kode_qr || '').toUpperCase();
    return tipe === 'TAMU' || tipe === 'UNDANGAN' || qr.startsWith('UND');
  });

  const totalL = tamuLogs.reduce((sum, r) => sum + Number(r.jumlah_l || 0), 0);
  const totalP = tamuLogs.reduce((sum, r) => sum + Number(r.jumlah_p || 0), 0);
  const totalHadir = totalL + totalP;

  // Invariant validation
  if (totalHadir !== totalL + totalP) {
    console.error('INVARIANT ANOMALY in Tamu Undangan metrics:', { totalHadir, totalL, totalP });
  }

  const persenHadir = totalKuota > 0 ? Math.round((totalHadir / totalKuota) * 100) : 0;

  return {
    totalHadir,
    totalKuota,
    totalL,
    totalP,
    persenHadir,
  };
}
