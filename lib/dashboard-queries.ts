import { supabase } from '@/lib/supabase';

export interface DashboardMetricsResult {
  totalSantri: number;
  wsHadir: number;
  wsKuota: number;
  wsL: number;
  wsP: number;
  totalTamu: number;
  tamuHadir: number;
  tamuKuota: number;
  tamuL: number;
  tamuP: number;
  santriList: any[];
  undanganList: any[];
}

/**
 * Single source of truth query & aggregation function for Live Dashboard & Pimpinan Dashboard.
 * Ensures metrics cards (hadir count, kuota, L/P breakdown) and bottom participant lists
 * are computed from the exact same dataset without source mismatch.
 */
export async function fetchDashboardMetrics(): Promise<DashboardMetricsResult> {
  const [resSantri, resUndangan, resLogs] = await Promise.all([
    supabase.from('peserta_santri').select('*').order('created_at', { ascending: false }),
    supabase.from('tamu_undangan').select('*').order('created_at', { ascending: false }),
    supabase.from('presensi_log').select('*').order('created_at', { ascending: false }),
  ]);

  const santriData = resSantri.data || [];
  const undanganData = resUndangan.data || [];
  const logsData = resLogs.data || [];

  const loggedKeys = new Set<string>();
  const latestCheckinMap: Record<string, string> = {};
  const sumLogMap: Record<string, number> = {};

  for (const log of logsData) {
    const key = String(log.kode_qr || '').toUpperCase();
    const logTime = log.created_at || '';
    if (key) {
      if (!latestCheckinMap[key] && logTime) {
        latestCheckinMap[key] = logTime;
      }
      const l = Number(log.jumlah_l || log.jumlahL || 0);
      const p = Number(log.jumlah_p || log.jumlahP || 0);
      sumLogMap[key] = (sumLogMap[key] || 0) + l + p;
      loggedKeys.add(key);
    }
  }

  // Calculate Total Kuota (Denominators)
  const wsKuota = santriData.reduce(
    (sum, s) => sum + Number(s.kuota_dasar || 0) + Number(s.kuota_tambahan || 0),
    0
  );

  const tamuKuota = undanganData.reduce((sum, u: any) => {
    const countL = u.nama_putra && String(u.nama_putra).trim() ? 1 : 0;
    const countP = u.nama_putri && String(u.nama_putri).trim() ? 1 : 0;
    return sum + countL + countP;
  }, 0);

  // Calculate Total Hadir & Gender Breakdown (Numerators)
  let wsL = 0;
  let wsP = 0;
  let tamuL = 0;
  let tamuP = 0;

  for (const log of logsData) {
    const tipe = (log.tipe_peserta || '').toUpperCase();
    const qr = (log.kode_qr || '').toUpperCase();
    const l = Number(log.jumlah_l || log.jumlahL || 0);
    const p = Number(log.jumlah_p || log.jumlahP || 0);

    if (tipe === 'SANTRI' || tipe === 'WALI' || qr.startsWith('SH')) {
      wsL += l;
      wsP += p;
    } else if (tipe === 'TAMU' || tipe === 'UNDANGAN' || qr.startsWith('UND')) {
      tamuL += l;
      tamuP += p;
    }
  }

  // Fallback if logsData is empty but kuota_terpakai > 0
  if (wsL === 0 && wsP === 0) {
    for (const s of santriData) {
      if ((s.kuota_terpakai || 0) > 0) {
        const terpakai = Number(s.kuota_terpakai);
        wsL += Math.ceil(terpakai / 2);
        wsP += Math.floor(terpakai / 2);
      }
    }
  }

  if (tamuL === 0 && tamuP === 0) {
    for (const u of undanganData) {
      if ((u.kuota_terpakai || 0) > 0) {
        const terpakai = Number(u.kuota_terpakai);
        const pStr = (u.nama_putra || u.namaPutra || '').trim();
        const wStr = (u.nama_putri || u.namaPutri || '').trim();
        if (pStr && wStr) {
          tamuL += Math.ceil(terpakai / 2);
          tamuP += Math.floor(terpakai / 2);
        } else if (wStr) {
          tamuP += terpakai;
        } else {
          tamuL += terpakai;
        }
      }
    }
  }

  const wsHadir = wsL + wsP;
  const tamuHadir = tamuL + tamuP;

  // Invariant validations
  if (wsHadir !== wsL + wsP) {
    console.error('INVARIANT ANOMALY in Wali Santri metrics:', { wsHadir, wsL, wsP });
  }
  if (tamuHadir !== tamuL + tamuP) {
    console.error('INVARIANT ANOMALY in Tamu Undangan metrics:', { tamuHadir, tamuL, tamuP });
  }

  // Process Santri List for bottom table
  const santriList = santriData.map((s) => {
    const keyId = String(s.id || '').toUpperCase();
    const keyKode = String(s.kode || '').toUpperCase();
    const checkinTime = latestCheckinMap[keyKode] || latestCheckinMap[keyId] || s.updated_at || s.created_at;
    const sumTerpakai = sumLogMap[keyKode] ?? sumLogMap[keyId];
    const isHadir = (sumTerpakai !== undefined && sumTerpakai > 0) || loggedKeys.has(keyKode) || loggedKeys.has(keyId) || (s.kuota_terpakai || 0) > 0;

    const kDasar = s.kuota_dasar !== undefined && s.kuota_dasar !== null ? Number(s.kuota_dasar) : 2;
    const kTambahan = Number(s.kuota_tambahan || 0);
    const kuotaTotal = kDasar + kTambahan;
    const terpakai = isHadir
      ? (sumTerpakai !== undefined ? sumTerpakai : Number(s.kuota_terpakai || 0))
      : 0;

    return {
      id: s.id,
      kode: s.kode,
      tipe: 'SANTRI',
      nama: s.nama,
      namaWali: s.nama_wali || '-',
      subInfo: `Wali: ${s.nama_wali || '-'} (${s.kategori_utama || 'Bil Ghoib'})`,
      kategori: s.kategori_utama || 'BIL_GHOIB',
      subKategori: s.sub_kategori || 'Bil Ghoib',
      kelas: s.kelas || '-',
      kamar: s.kamar || '-',
      noHp: s.no_hp || '-',
      alamat: s.alamat || 'Kediri',
      kuotaDasar: kDasar,
      kuotaTambahan: kTambahan,
      kuotaTotal,
      terpakai,
      isHadir,
      lastCheckinTime: checkinTime,
    };
  });

  // Process Tamu Undangan List for bottom table
  const undanganList = undanganData.map((u) => {
    const keyId = String(u.id || '').toUpperCase();
    const keyKode = String(u.kode || '').toUpperCase();
    const checkinTime = latestCheckinMap[keyKode] || latestCheckinMap[keyId] || u.updated_at || u.created_at;
    const sumTerpakai = sumLogMap[keyKode] ?? sumLogMap[keyId];
    const isHadir = (sumTerpakai !== undefined && sumTerpakai > 0) || loggedKeys.has(keyKode) || loggedKeys.has(keyId) || (u.kuota_terpakai || 0) > 0;

    const countL = u.nama_putra && String(u.nama_putra).trim() ? 1 : 0;
    const countP = u.nama_putri && String(u.nama_putri).trim() ? 1 : 0;
    const kuotaTotal = countL + countP;
    const terpakai = isHadir
      ? (sumTerpakai !== undefined ? sumTerpakai : Number(u.kuota_terpakai || 0))
      : 0;

    return {
      id: u.id,
      kode: u.kode,
      tipe: 'UNDANGAN',
      nama: u.nama,
      namaWali: u.instansi || u.alamat || 'Tamu Undangan',
      subInfo: `Instansi: ${u.instansi || u.alamat || '-'} (${u.kategori || 'Tamu'})`,
      kategori: u.kategori || 'Tamu Undangan',
      subKategori: u.sub_kategori || 'ISTIMEWA',
      kelas: u.sub_kategori || 'VIP IDS',
      kamar: '-',
      noHp: u.no_hp || '-',
      alamat: u.alamat || u.instansi || 'Kediri',
      kuotaDasar: kuotaTotal,
      kuotaTambahan: 0,
      kuotaTotal,
      terpakai,
      isHadir,
      lastCheckinTime: checkinTime,
    };
  });

  return {
    totalSantri: santriData.length,
    wsHadir,
    wsKuota,
    wsL,
    wsP,
    totalTamu: undanganData.length,
    tamuHadir,
    tamuKuota,
    tamuL,
    tamuP,
    santriList,
    undanganList,
  };
}
