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
  const latestLogMap: Record<string, { jumlah_l: number; jumlah_p: number; tipe: string }> = {};

  for (const log of logsData) {
    const key = String(log.kode_qr || log.kuota_id || '');
    const logTime = log.created_at || log.server_time || '';
    if (key) {
      if (!latestCheckinMap[key] && logTime) {
        latestCheckinMap[key] = logTime;
      }
      if (!latestLogMap[key]) {
        latestLogMap[key] = {
          jumlah_l: Number(log.jumlah_l || log.jumlahL || 0),
          jumlah_p: Number(log.jumlah_p || log.jumlahP || 0),
          tipe: log.tipe_peserta || '',
        };
      }
      loggedKeys.add(key);
    }
  }

  // Process Santri
  let wsHadir = 0;
  let wsL = 0;
  let wsP = 0;

  const santriList = santriData.map((s) => {
    const keyId = String(s.id || '');
    const keyKode = String(s.kode || '');
    const checkinTime = latestCheckinMap[keyKode] || latestCheckinMap[keyId] || s.updated_at || s.created_at;
    const isHadir = (s.kuota_terpakai || 0) > 0 || loggedKeys.has(keyKode) || loggedKeys.has(keyId);

    if (isHadir) {
      wsHadir++;
      const logInfo = latestLogMap[keyKode] || latestLogMap[keyId];
      if (logInfo) {
        wsL += logInfo.jumlah_l;
        wsP += logInfo.jumlah_p;
      } else {
        const terpakai = Number(s.kuota_terpakai || 1);
        wsL += Math.ceil(terpakai / 2);
        wsP += Math.floor(terpakai / 2);
      }
    }

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
      kuotaDasar: s.kuota_dasar || 2,
      kuotaTambahan: s.kuota_tambahan || 0,
      terpakai: s.kuota_terpakai || 0,
      isHadir,
      lastCheckinTime: checkinTime,
    };
  });

  // Process Tamu Undangan
  let tamuHadir = 0;
  let tamuL = 0;
  let tamuP = 0;

  const undanganList = undanganData.map((u) => {
    const keyId = String(u.id || '');
    const keyKode = String(u.kode || '');
    const checkinTime = latestCheckinMap[keyKode] || latestCheckinMap[keyId] || u.updated_at || u.created_at;
    const isHadir = (u.kuota_terpakai || 0) > 0 || loggedKeys.has(keyKode) || loggedKeys.has(keyId);

    if (isHadir) {
      tamuHadir++;
      const logInfo = latestLogMap[keyKode] || latestLogMap[keyId];
      if (logInfo) {
        tamuL += logInfo.jumlah_l;
        tamuP += logInfo.jumlah_p;
      } else {
        const terpakai = Number(u.kuota_terpakai || 1);
        const p = (u.nama_putra || u.namaPutra || '').trim();
        const w = (u.nama_putri || u.namaPutri || '').trim();
        let lCount = 1;
        let pCount = 0;
        if (p && w) {
          lCount = Math.ceil(terpakai / 2);
          pCount = Math.floor(terpakai / 2);
        } else if (p) {
          lCount = terpakai;
          pCount = 0;
        } else if (w) {
          lCount = 0;
          pCount = terpakai;
        } else {
          const lower = (u.nama || '').toLowerCase();
          const isFemale = ['nyai', 'hj.', 'ning', 'ibu', 'ustadzah', 'hajah', 'biyung'].some((h) => lower.includes(h));
          if (isFemale) {
            lCount = 0;
            pCount = terpakai;
          } else {
            lCount = terpakai;
            pCount = 0;
          }
        }
        tamuL += lCount;
        tamuP += pCount;
      }
    }

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
      kuotaDasar: u.kuota_dasar !== undefined && u.kuota_dasar !== null ? u.kuota_dasar : (u.kategori === 'Asatidz Mhmtq Sekalian' ? 2 : 1),
      kuotaTambahan: u.kuota_tambahan || 0,
      terpakai: u.kuota_terpakai || 0,
      isHadir,
      lastCheckinTime: checkinTime,
    };
  });

  return {
    totalSantri: santriData.length,
    wsHadir,
    wsKuota: santriData.length,
    wsL,
    wsP,
    totalTamu: undanganData.length,
    tamuHadir,
    tamuKuota: undanganData.length,
    tamuL,
    tamuP,
    santriList,
    undanganList,
  };
}
