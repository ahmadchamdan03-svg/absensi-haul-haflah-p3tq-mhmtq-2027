import { store } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';
import { getWaliSantriMetrics, getTamuUndanganMetrics } from '@/lib/dashboard-metrics';

export function getGolonganUndangan(u: any): 'ISTIMEWA' | 'KEHORMATAN' | 'UMUM' {
  if (u.golongan) {
    if (u.golongan === 'ISTIMEWA' || u.golongan === 'UNDANGAN_ISTIMEWA') return 'ISTIMEWA';
    if (u.golongan === 'KEHORMATAN' || u.golongan === 'UNDANGAN_KEHORMATAN') return 'KEHORMATAN';
    if (u.golongan === 'UMUM' || u.golongan === 'UNDANGAN_UMUM') return 'UMUM';
  }
  const text = `${u.kategori || ''} ${u.nama || ''} ${u.instansi || ''}`.toLowerCase();
  if (
    text.includes('vvip') ||
    text.includes('bani') ||
    text.includes('bandar') ||
    text.includes('kunir') ||
    text.includes('istimewa')
  ) {
    return 'ISTIMEWA';
  }
  if (
    text.includes('masyayikh') ||
    text.includes('habaib') ||
    text.includes('pejabat') ||
    text.includes('forkopimda') ||
    text.includes('pengasuh') ||
    text.includes('tokoh') ||
    text.includes('kehormatan')
  ) {
    return 'KEHORMATAN';
  }
  return 'UMUM';
}

const CACHE_TTL = 30 * 60 * 1000;
const cacheTamu: { data: any[] | null; timestamp: number | null } = { data: null, timestamp: null };
const cacheSantri: { data: any[] | null; timestamp: number | null } = { data: null, timestamp: null };
const cachePresensi: { data: any[] | null; timestamp: number | null } = { data: null, timestamp: null };

export async function getTamuUndanganLive() {
  try {
    const { data, error } = await supabase
      .from('tamu_undangan')
      .select('*')
      .like('kode', 'UND%')
      .not('kode', 'is', null);

    if (error) throw error;

    cacheTamu.data = data;
    cacheTamu.timestamp = Date.now();

    return {
      source: 'live' as const,
      data: data || [],
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    if (cacheTamu.data && cacheTamu.timestamp && Date.now() - cacheTamu.timestamp < CACHE_TTL) {
      return {
        source: 'cache' as const,
        data: cacheTamu.data,
        timestamp: new Date(cacheTamu.timestamp).toISOString(),
        disclaimer: true,
      };
    }
    return {
      source: 'unavailable' as const,
      data: null,
      message: 'Mohon maaf Us, sistem sedang tidak dapat mengakses database. Silakan coba beberapa saat lagi.',
    };
  }
}

export async function getPesertaSantriLive() {
  try {
    const { data, error } = await supabase
      .from('peserta_santri')
      .select('*');

    if (error) throw error;

    cacheSantri.data = data;
    cacheSantri.timestamp = Date.now();

    return {
      source: 'live' as const,
      data: data || [],
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    if (cacheSantri.data && cacheSantri.timestamp && Date.now() - cacheSantri.timestamp < CACHE_TTL) {
      return {
        source: 'cache' as const,
        data: cacheSantri.data,
        timestamp: new Date(cacheSantri.timestamp).toISOString(),
        disclaimer: true,
      };
    }
    return {
      source: 'unavailable' as const,
      data: null,
      message: 'Mohon maaf Us, sistem sedang tidak dapat mengakses database. Silakan coba beberapa saat lagi.',
    };
  }
}

export async function getPresensiLive() {
  try {
    const { data, error } = await supabase
      .from('presensi_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) throw error;

    cachePresensi.data = data;
    cachePresensi.timestamp = Date.now();

    return {
      source: 'live' as const,
      data: data || [],
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    if (cachePresensi.data && cachePresensi.timestamp && Date.now() - cachePresensi.timestamp < CACHE_TTL) {
      return {
        source: 'cache' as const,
        data: cachePresensi.data,
        timestamp: new Date(cachePresensi.timestamp).toISOString(),
        disclaimer: true,
      };
    }
    return {
      source: 'unavailable' as const,
      data: null,
      message: 'Mohon maaf Us, sistem presensi sedang tidak dapat diakses.',
    };
  }
}

export interface KuotaTambahanMetrics {
  sisa: number;
  terjual: number;
  total: number;
}

export async function getKuotaTambahanMetricsLive(): Promise<KuotaTambahanMetrics> {
  try {
    const { data, error } = await supabase
      .from('pembelian_kuota')
      .select('jumlah_kursi, status')
      .in('status', ['DIVERIFIKASI', 'DITERIMA', 'SETUJU', 'VERIFIED']);

    if (error) {
      console.error('[Halwaa AI] Error query pembelian_kuota live:', error.message || error);
      throw error;
    }

    const verifiedSum = (data || []).reduce(
      (acc: number, item: any) => acc + Number(item.jumlah_kursi || item.jumlah || item.jumlah_kuota || 0),
      0
    );
    const sisa = Math.max(0, 300 - verifiedSum);
    return {
      sisa,
      terjual: verifiedSum,
      total: 300,
    };
  } catch (err: any) {
    console.error('[Halwaa AI] Exception getKuotaTambahanMetricsLive:', err?.message || err);
    return {
      sisa: 300,
      terjual: 0,
      total: 300,
    };
  }
}

export async function getSisaKuotaTambahanLive(): Promise<number> {
  const metrics = await getKuotaTambahanMetricsLive();
  return metrics.sisa;
}

export async function getGuestCategoryCountsLive() {
  try {
    const { data: guests, error } = await supabase
      .from('tamu_undangan')
      .select('kategori, sub_kategori');

    if (error || !guests) return null;

    let total = guests.length;
    let vvip = 0;
    let vip = 0;
    let ids = 0;
    let kehormatan = 0;
    let penguji = 0;
    let asatidz = 0;
    let perwakilan = 0;

    for (const g of guests) {
      const kat = (g.kategori || '').toUpperCase();
      const sub = (g.sub_kategori || '').toUpperCase();
      const combined = `${kat} ${sub}`;

      if (combined.includes('VVIP')) vvip++;
      else if (combined.includes('VIP')) vip++;

      if (combined.includes('IDS')) ids++;
      if (combined.includes('KEHORMATAN')) kehormatan++;
      if (combined.includes('PENGUJI')) penguji++;
      if (combined.includes('ASATIDZ')) asatidz++;
      if (combined.includes('PERWAKILAN')) perwakilan++;
    }

    return { total, vvip, vip, ids, kehormatan, penguji, asatidz, perwakilan };
  } catch (err) {
    return null;
  }
}

export function detectIntent(pertanyaan: string) {
  const q = pertanyaan.toLowerCase();
  return {
    tamu: /tamu|undangan|und\d|\bund[a-z0-9]{4}\b|vvip|vip|kehormatan|umum|pengajar|asatidz/i.test(q),
    santri: /santri|wali|sh\d|\bsh[a-z0-9]{4}\b|bil.ghoib|bin.nadzori|tamatan/i.test(q),
    statistik: /berapa|jumlah|total|persen|%|statistik|kehadiran|hadir/i.test(q),
    kehadiran: /hadir|datang|dateng|absen|presensi/i.test(q),
    pembelian: /beli|kuota.tambahan|pembelian|transfer|bukti/i.test(q),
    nama: /(KH\.|Gus|Ning|Nyai|Ust\.|Hj\.|Bu Nyai)/i.test(q),
    denah: /denah|lokasi|posisi|prasmanan|panggung|parkir|sambangan/i.test(q),
    aturan: /aturan|larangan|boleh|tidak boleh|dilarang/i.test(q),
  };
}

export async function handleLiveCategoryNameQueries(userQuery: string, isFirstTurn: boolean = false): Promise<string | null> {
  const q = userQuery.toLowerCase().trim();

  const isNameQuestion =
    q.includes('siapa') ||
    q.includes('siapakah') ||
    q.includes('nama') ||
    q.includes('daftar') ||
    q.includes('sebutkan') ||
    q.includes('siapa saja') ||
    q.includes('siapa-siapa');

  if (!isNameQuestion) return null;

  // Don't intercept if asking about who arrived (handled by getLiveArrivedGuestsResponse / getLiveArrivedWaliResponse)
  if (q.includes('hadir') || q.includes('datang') || q.includes('tiba') || q.includes('masuk') || q.includes('presensi')) {
    return null;
  }

  // Don't intercept AI identity questions
  if (q.includes('kamu') || q.includes('anda') || q.includes('pembuat') || q.includes('halwaa')) {
    return null;
  }

  const greetingPrefix = isFirstTurn ? "Wa'alaikum Salam Wr. Wb.! 🙏✨\n\n" : "";

  // 1. TAMU VVIP
  if (q.includes('vvip')) {
    let guests: any[] = [];
    try {
      const res = await supabase
        .from('tamu_undangan')
        .select('*')
        .or('kategori.ilike.%VVIP%,sub_kategori.ilike.%VVIP%')
        .order('nama', { ascending: true });
      if (res.data && res.data.length > 0) guests = res.data;
    } catch {}

    if (guests.length === 0) {
      const mockList = store.getUndanganList().filter((u) => getGolonganUndangan(u) === 'ISTIMEWA');
      guests = mockList.map((u) => ({
        kode: u.kode,
        nama: u.nama,
        instansi: u.instansi,
        kuota_terpakai: u.kuota.terpakai,
        no_hp: (u as any).noHp || (u as any).telepon,
      }));
    }

    if (guests.length === 0) {
      return `${greetingPrefix}Belum ada data Tamu VVIP yang tercatat di database Supabase.`;
    }

    const lines = guests.map((g, idx) => {
      const namaDisp = g.nama || [g.nama_putra, g.nama_putri].filter(Boolean).join(' & ') || 'Tamu VVIP';
      const instansi = g.instansi || g.alamat || 'Lirboyo';
      const status = (g.kuota_terpakai || 0) > 0 ? '✅ **HADIR**' : '⏳ Belum Presensi';
      const phone = g.no_hp ? ` (No. HP: ${g.no_hp})` : '';
      return `${idx + 1}. **${namaDisp}** (\`${g.kode}\`) - ${instansi}${phone}\n   - **Status**: ${status}`;
    });

    return `${greetingPrefix}Alhamdulillah Us, berikut daftar **${guests.length} Tamu VVIP** yang terdaftar di database Supabase (LIVE):\n\n${lines.join('\n\n')}\n\n[👉 Buka Live Dasbor](/admin/dasbor) · [👉 Data Peserta & Tamu](/admin/peserta)`;
  }

  // 2. TAMU VIP (excluding VVIP)
  if (q.includes('vip') && !q.includes('vvip')) {
    let guests: any[] = [];
    try {
      const res = await supabase
        .from('tamu_undangan')
        .select('*')
        .or('kategori.ilike.%VIP%,sub_kategori.ilike.%VIP%')
        .order('nama', { ascending: true });
      if (res.data) {
        guests = res.data.filter((g) => {
          const cat = `${g.kategori || ''} ${g.sub_kategori || ''}`.toUpperCase();
          return !cat.includes('VVIP');
        });
      }
    } catch {}

    if (guests.length === 0) {
      const mockList = store.getUndanganList().filter((u) => {
        const txt = `${u.kategori || ''} ${u.nama || ''}`.toLowerCase();
        return txt.includes('vip') && !txt.includes('vvip');
      });
      guests = mockList.map((u) => ({
        kode: u.kode,
        nama: u.nama,
        instansi: u.instansi,
        kuota_terpakai: u.kuota.terpakai,
        no_hp: (u as any).noHp || (u as any).telepon,
      }));
    }

    if (guests.length === 0) {
      return `${greetingPrefix}Belum ada data Tamu VIP yang tercatat di database Supabase.`;
    }

    const lines = guests.map((g, idx) => {
      const namaDisp = g.nama || [g.nama_putra, g.nama_putri].filter(Boolean).join(' & ') || 'Tamu VIP';
      const instansi = g.instansi || g.alamat || 'Lirboyo';
      const status = (g.kuota_terpakai || 0) > 0 ? '✅ **HADIR**' : '⏳ Belum Presensi';
      const phone = g.no_hp ? ` (No. HP: ${g.no_hp})` : '';
      return `${idx + 1}. **${namaDisp}** (\`${g.kode}\`) - ${instansi}${phone}\n   - **Status**: ${status}`;
    });

    return `${greetingPrefix}Alhamdulillah Us, berikut daftar **${guests.length} Tamu VIP** yang terdaftar di database Supabase (LIVE):\n\n${lines.join('\n\n')}\n\n[👉 Buka Live Dasbor](/admin/dasbor) · [👉 Data Peserta & Tamu](/admin/peserta)`;
  }

  // 3. TAMU KEHORMATAN
  if (q.includes('kehormatan')) {
    let guests: any[] = [];
    try {
      const res = await supabase
        .from('tamu_undangan')
        .select('*')
        .or('kategori.ilike.%KEHORMATAN%,sub_kategori.ilike.%KEHORMATAN%')
        .order('nama', { ascending: true });
      if (res.data && res.data.length > 0) guests = res.data;
    } catch {}

    if (guests.length === 0) {
      const mockList = store.getUndanganList().filter((u) => getGolonganUndangan(u) === 'KEHORMATAN');
      guests = mockList.map((u) => ({
        kode: u.kode,
        nama: u.nama,
        instansi: u.instansi,
        kuota_terpakai: u.kuota.terpakai,
        no_hp: (u as any).noHp || (u as any).telepon,
      }));
    }

    if (guests.length === 0) {
      return `${greetingPrefix}Belum ada data Tamu Kehormatan yang tercatat di database Supabase.`;
    }

    const lines = guests.map((g, idx) => {
      const namaDisp = g.nama || [g.nama_putra, g.nama_putri].filter(Boolean).join(' & ') || 'Tamu Kehormatan';
      const instansi = g.instansi || g.alamat || 'Masyayikh / Tokoh';
      const status = (g.kuota_terpakai || 0) > 0 ? '✅ **HADIR**' : '⏳ Belum Presensi';
      const phone = g.no_hp ? ` (No. HP: ${g.no_hp})` : '';
      return `${idx + 1}. **${namaDisp}** (\`${g.kode}\`) - ${instansi}${phone}\n   - **Status**: ${status}`;
    });

    return `${greetingPrefix}Alhamdulillah Us, berikut daftar **${guests.length} Tamu Kehormatan** yang terdaftar di database Supabase (LIVE):\n\n${lines.join('\n\n')}\n\n[👉 Buka Live Dasbor](/admin/dasbor) · [👉 Data Peserta & Tamu](/admin/peserta)`;
  }

  // 4. PENGUJI AL-QUR'AN
  if (q.includes('penguji')) {
    let guests: any[] = [];
    try {
      const res = await supabase
        .from('tamu_undangan')
        .select('*')
        .or('kategori.ilike.%PENGUJI%,sub_kategori.ilike.%PENGUJI%')
        .order('nama', { ascending: true });
      if (res.data && res.data.length > 0) guests = res.data;
    } catch {}

    if (guests.length === 0) {
      return `${greetingPrefix}Belum ada data Penguji Al-Qur'an yang tercatat di database Supabase.`;
    }

    const lines = guests.map((g, idx) => {
      const namaDisp = g.nama || [g.nama_putra, g.nama_putri].filter(Boolean).join(' & ') || 'Penguji Al-Qur\'an';
      const instansi = g.instansi || g.alamat || 'Penguji Qur-an';
      const status = (g.kuota_terpakai || 0) > 0 ? '✅ **HADIR**' : '⏳ Belum Presensi';
      const phone = g.no_hp ? ` (No. HP: ${g.no_hp})` : ' (No. HP: Tersedia di database)';
      return `${idx + 1}. **${namaDisp}** (\`${g.kode}\`) - ${instansi}${phone}\n   - **Status**: ${status}`;
    });

    return `${greetingPrefix}Alhamdulillah Us, berikut daftar **${guests.length} Penguji Al-Qur'an** yang terdaftar di database Supabase (LIVE):\n\n${lines.join('\n\n')}\n\n[👉 Buka Live Dasbor](/admin/dasbor) · [👉 Data Peserta & Tamu](/admin/peserta)`;
  }

  // 5. ASATIDZ MHMTQ
  if (q.includes('asatidz') || q.includes('ustadz mhmtq')) {
    let guests: any[] = [];
    try {
      const res = await supabase
        .from('tamu_undangan')
        .select('*')
        .or('kategori.ilike.%ASATIDZ%,sub_kategori.ilike.%ASATIDZ%')
        .order('nama', { ascending: true });
      if (res.data && res.data.length > 0) guests = res.data;
    } catch {}

    if (guests.length === 0) {
      return `${greetingPrefix}Belum ada data Asatidz MHMTQ Sekalian yang tercatat di database Supabase.`;
    }

    const lines = guests.map((g, idx) => {
      const namaDisp = g.nama || [g.nama_putra, g.nama_putri].filter(Boolean).join(' & ') || 'Asatidz MHMTQ';
      const instansi = g.instansi || g.alamat || 'MHMTQ Lirboyo';
      const status = (g.kuota_terpakai || 0) > 0 ? '✅ **HADIR**' : '⏳ Belum Presensi';
      const phone = g.no_hp ? ` (No. HP: ${g.no_hp})` : '';
      return `${idx + 1}. **${namaDisp}** (\`${g.kode}\`) - ${instansi}${phone}\n   - **Status**: ${status}`;
    });

    return `${greetingPrefix}Alhamdulillah Us, berikut daftar **${guests.length} Asatidz MHMTQ Sekalian** yang terdaftar di database Supabase (LIVE):\n\n${lines.join('\n\n')}\n\n[👉 Buka Live Dasbor](/admin/dasbor) · [👉 Data Peserta & Tamu](/admin/peserta)`;
  }

  // 6. PERWAKILAN PONDOK
  if (q.includes('perwakilan')) {
    let guests: any[] = [];
    try {
      const res = await supabase
        .from('tamu_undangan')
        .select('*')
        .or('kategori.ilike.%PERWAKILAN%,sub_kategori.ilike.%PERWAKILAN%')
        .order('nama', { ascending: true });
      if (res.data && res.data.length > 0) guests = res.data;
    } catch {}

    if (guests.length === 0) {
      return `${greetingPrefix}Belum ada data Perwakilan Pondok yang tercatat di database Supabase.`;
    }

    const lines = guests.map((g, idx) => {
      const namaDisp = g.nama || [g.nama_putra, g.nama_putri].filter(Boolean).join(' & ') || 'Perwakilan Pondok';
      const instansi = g.instansi || g.alamat || 'Perwakilan Pondok Pesantren';
      const status = (g.kuota_terpakai || 0) > 0 ? '✅ **HADIR**' : '⏳ Belum Presensi';
      const phone = g.no_hp ? ` (No. HP: ${g.no_hp})` : '';
      return `${idx + 1}. **${namaDisp}** (\`${g.kode}\`) - ${instansi}${phone}\n   - **Status**: ${status}`;
    });

    return `${greetingPrefix}Alhamdulillah Us, berikut daftar **${guests.length} Perwakilan Pondok** yang terdaftar di database Supabase (LIVE):\n\n${lines.join('\n\n')}\n\n[👉 Buka Live Dasbor](/admin/dasbor) · [👉 Data Peserta & Tamu](/admin/peserta)`;
  }

  // 7. IDS
  if (q.includes('ids')) {
    let guests: any[] = [];
    try {
      const res = await supabase
        .from('tamu_undangan')
        .select('*')
        .or('kategori.ilike.%IDS%,sub_kategori.ilike.%IDS%')
        .order('nama', { ascending: true });
      if (res.data && res.data.length > 0) guests = res.data;
    } catch {}

    if (guests.length === 0) {
      return `${greetingPrefix}Belum ada data Tamu IDS yang tercatat di database Supabase.`;
    }

    const lines = guests.map((g, idx) => {
      const namaDisp = g.nama || [g.nama_putra, g.nama_putri].filter(Boolean).join(' & ') || 'Tamu IDS';
      const instansi = g.instansi || g.alamat || 'Undangan Digital IDS';
      const status = (g.kuota_terpakai || 0) > 0 ? '✅ **HADIR**' : '⏳ Belum Presensi';
      return `${idx + 1}. **${namaDisp}** (\`${g.kode}\`) - ${instansi}\n   - **Status**: ${status}`;
    });

    return `${greetingPrefix}Alhamdulillah Us, berikut daftar **${guests.length} Tamu IDS** yang terdaftar di database Supabase (LIVE):\n\n${lines.join('\n\n')}\n\n[👉 Buka Live Dasbor](/admin/dasbor) · [👉 Data Peserta & Tamu](/admin/peserta)`;
  }

  // 8. "NAMANYA SIAPA?" / GENERAL GUEST NAME QUERY
  if (q.includes('namanya siapa') || q.includes('nama-nama') || q.includes('siapa nama') || (q.includes('siapa saja') && !q.includes('hadir'))) {
    let guests: any[] = [];
    try {
      const res = await supabase
        .from('tamu_undangan')
        .select('kode, nama, nama_putra, nama_putri, kategori, sub_kategori, instansi, alamat')
        .order('kategori', { ascending: true })
        .order('nama', { ascending: true })
        .limit(25);
      if (res.data && res.data.length > 0) guests = res.data;
    } catch {}

    if (guests.length === 0) {
      const mockList = store.getUndanganList();
      guests = mockList.map((u) => ({
        kode: u.kode,
        nama: u.nama,
        kategori: u.kategori,
        instansi: u.instansi,
      }));
    }

    if (guests.length === 0) {
      return `${greetingPrefix}Belum ada data tamu undangan terdaftar di database Supabase.`;
    }

    const lines = guests.map((g, idx) => {
      const namaDisp = g.nama || [g.nama_putra, g.nama_putri].filter(Boolean).join(' & ') || 'Tamu Undangan';
      const katDisp = g.kategori || g.sub_kategori || 'Tamu Undangan';
      const instansi = g.instansi || g.alamat || '-';
      return `${idx + 1}. **${namaDisp}** (\`${g.kode}\`) [${katDisp}] - ${instansi}`;
    });

    return `${greetingPrefix}Alhamdulillah Us, berikut sampel daftar nama **Tamu Undangan** yang terdaftar di database Supabase (LIVE):\n\n${lines.join('\n')}\n\n[👉 Buka Live Dasbor](/admin/dasbor) · [👉 Data Peserta & Tamu](/admin/peserta)`;
  }

  return null;
}

export async function getLiveDatabaseContextPrompt(userQuery: string = ''): Promise<string> {
  const [resTamu, resSantri, resPresensi, kuotaMetrics, guestCounts, wsMetrics, tamuMetrics] = await Promise.all([
    getTamuUndanganLive(),
    getPesertaSantriLive(),
    getPresensiLive(),
    getKuotaTambahanMetricsLive(),
    getGuestCategoryCountsLive(),
    getWaliSantriMetrics().catch(() => null),
    getTamuUndanganMetrics().catch(() => null),
  ]);

  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });

  const tamuList = resTamu.data || [];
  const santriList = resSantri.data || [];

  const totalSHText = santriList.length > 0 ? `${santriList.length} keluarga santri` : 'Belum ada data di sistem';
  const totalTamuText = tamuList.length > 0 ? `${tamuList.length} tamu undangan` : 'Belum ada data di sistem';

  const vvipText = guestCounts?.vvip ? `${guestCounts.vvip} tamu` : 'Belum ada data di sistem';
  const vipText = guestCounts?.vip ? `${guestCounts.vip} tamu` : 'Belum ada data di sistem';
  const idsText = guestCounts?.ids ? `${guestCounts.ids} tamu` : 'Belum ada data di sistem';
  const kehormatanText = guestCounts?.kehormatan ? `${guestCounts.kehormatan} tamu` : 'Belum ada data di sistem';
  const pengujiText = guestCounts?.penguji ? `${guestCounts.penguji} orang` : 'Belum ada data di sistem';
  const asatidzText = guestCounts?.asatidz ? `${guestCounts.asatidz} orang` : 'Belum ada data di sistem';
  const perwakilanText = guestCounts?.perwakilan ? `${guestCounts.perwakilan} perwakilan` : 'Belum ada data di sistem';

  return `
=== DATA DARI DATABASE SUPABASE (LIVE & ACTUAL) ===
Timestamp: ${dateStr}, pukul ${timeStr} WIB

- TOTAL SHOHIBUL HAJAT TERDAFTAR (LIVE SUPA): ${totalSHText}
- TOTAL TAMU UNDANGAN TERDAFTAR (LIVE SUPA): ${totalTamuText}
- TAMU VVIP (LIVE SUPA): ${vvipText}
- TAMU VIP (LIVE SUPA): ${vipText}
- TAMU IDS (LIVE SUPA): ${idsText}
- TAMU KEHORMATAN (LIVE SUPA): ${kehormatanText}
- PENGUJI AL-QUR'AN (LIVE SUPA): ${pengujiText}
- ASATIDZ MHMTQ (LIVE SUPA): ${asatidzText}
- PERWAKILAN PONDOK (LIVE SUPA): ${perwakilanText}
- SISA KUOTA TAMBAHAN (LIVE SUPA): ${kuotaMetrics.sisa} kursi dari total pagu ${kuotaMetrics.total} kursi (pagu terjual: ${kuotaMetrics.terjual} kursi). Jika ditanya sisa kuota tambahan/pagu, sebutkan secara jelas sisa saat ini adalah ${kuotaMetrics.sisa} kursi!

--- DAFTAR NAMA TAMU INDIVIDUAL RESMI DARI SUPABASE (LIVE & DETIL) ---
• Tamu VVIP: ${(tamuList.filter((g: any) => `${g.kategori||''} ${g.sub_kategori||''}`.toUpperCase().includes('VVIP')).map((g: any) => `${g.nama||g.nama_putra||'VVIP'} (${g.kode})`).join(', ')) || 'Belum ada data'}
• Tamu VIP: ${(tamuList.filter((g: any) => `${g.kategori||''} ${g.sub_kategori||''}`.toUpperCase().includes('VIP') && !`${g.kategori||''} ${g.sub_kategori||''}`.toUpperCase().includes('VVIP')).map((g: any) => `${g.nama||g.nama_putra||'VIP'} (${g.kode})`).slice(0, 10).join(', ')) || 'Belum ada data'}
• Tamu Kehormatan: ${(tamuList.filter((g: any) => `${g.kategori||''} ${g.sub_kategori||''}`.toUpperCase().includes('KEHORMATAN')).map((g: any) => `${g.nama||g.nama_putra||'Kehormatan'} (${g.kode})`).join(', ')) || 'Belum ada data'}
• Penguji Al-Qur'an: ${(tamuList.filter((g: any) => `${g.kategori||''} ${g.sub_kategori||''}`.toUpperCase().includes('PENGUJI')).map((g: any) => `${g.nama||g.nama_putra||'Penguji'} (${g.kode}, No. HP: ${g.no_hp||'Tersedia'})`).join(', ')) || 'Belum ada data'}
• Asatidz MHMTQ: ${(tamuList.filter((g: any) => `${g.kategori||''} ${g.sub_kategori||''}`.toUpperCase().includes('ASATIDZ')).map((g: any) => `${g.nama||g.nama_putra||'Asatidz'} (${g.kode})`).join(', ')) || 'Belum ada data'}
• Perwakilan Pondok: ${(tamuList.filter((g: any) => `${g.kategori||''} ${g.sub_kategori||''}`.toUpperCase().includes('PERWAKILAN')).map((g: any) => `${g.nama||g.nama_putra||'Perwakilan'} (${g.kode})`).join(', ')) || 'Belum ada data'}
[CATATAN PENTING AI: Anda MEMILIKI AKSES PENUH ke daftar nama individu di atas. SEBUTKAN nama spesifik tersebut saat ditanyakan dan DILARANG MERESPON 'tidak disimpan di Knowledge Base' ATAU 'tidak memiliki akses ke daftar nama'!]

--- STATISTIK KEHADIRAN (REALTIME) ---
- Wali Santri Hadir: ${wsMetrics?.totalHadir || 0} dari ${wsMetrics?.totalKuota || 0} kuota (${wsMetrics?.persenHadir || 0}%)
- Tamu Undangan Hadir: ${tamuMetrics?.totalHadir || 0} dari ${tamuMetrics?.totalKuota || 0} kuota (${tamuMetrics?.persenHadir || 0}%)
=== END DATA LIVE ===
`;
}

export async function getLiveSupabaseGuestPrompt(userQuery: string = ''): Promise<string> {
  return getLiveDatabaseContextPrompt(userQuery);
}

export function isStatsQuery(prompt: string): boolean {
  const q = prompt.toLowerCase();
  if (
    q.includes('grafik') ||
    q.includes('chart') ||
    q.includes('diagram') ||
    q.includes('visualisasi') ||
    q.includes('donut') ||
    q.includes('pie')
  ) {
    return true;
  }
  const hasCountWord = q.includes('berapa') || q.includes('jumlah') || q.includes('prosentase') || q.includes('persentase') || q.includes('%') || q.includes('statistik') || q.includes('progress') || q.includes('okupansi');
  const hasAttendanceWord = q.includes('hadir') || q.includes('datang') || q.includes('kehadiran') || q.includes('presensi');

  if (hasCountWord && hasAttendanceWord) return true;
  if (q.includes('statistik') || q.includes('progress kehadiran') || q.includes('persentase kehadiran') || q.includes('prosentase kehadiran') || q.includes('berapa yang hadir') || q.includes('okupansi')) return true;

  return false;
}

export async function getLiveAttendanceStatsChart() {
  let totalWaliKuota = 0;
  let totalTamuKuota = 0;
  let totalWaliHadir = 0;
  let totalTamuHadir = 0;
  let waliL = 0;
  let waliP = 0;
  let tamuL = 0;
  let tamuP = 0;
  let percentWaliRatio = 0;
  let percentTamuRatio = 0;

  try {
    const wsMetrics = await getWaliSantriMetrics();
    const tamuMetrics = await getTamuUndanganMetrics();

    totalWaliHadir = wsMetrics.totalHadir;
    totalWaliKuota = wsMetrics.totalKuota;
    waliL = wsMetrics.totalL;
    waliP = wsMetrics.totalP;
    percentWaliRatio = wsMetrics.persenHadir;

    totalTamuHadir = tamuMetrics.totalHadir;
    totalTamuKuota = tamuMetrics.totalKuota;
    tamuL = tamuMetrics.totalL;
    tamuP = tamuMetrics.totalP;
    percentTamuRatio = tamuMetrics.persenHadir;
  } catch (e) {
    const stats = store.getStatistikLive();
    totalWaliHadir = (stats.kategoriStats?.bilGhoib?.totalHadir || 0) + (stats.kategoriStats?.binNadzor?.totalHadir || 0) + (stats.kategoriStats?.tamatan?.totalHadir || 0);
    totalTamuHadir = stats.tamuUndanganStat?.totalHadir || 0;
    totalWaliKuota = stats.totalKuota - (stats.tamuUndanganStat?.totalKuota || 0);
    totalTamuKuota = stats.tamuUndanganStat?.totalKuota || 462;
    percentWaliRatio = totalWaliKuota > 0 ? Math.round((totalWaliHadir / totalWaliKuota) * 100) : 0;
    percentTamuRatio = totalTamuKuota > 0 ? Math.round((totalTamuHadir / totalTamuKuota) * 100) : 0;
    waliL = Math.round(totalWaliHadir * 0.5);
    waliP = totalWaliHadir - waliL;
    tamuL = totalTamuHadir;
    tamuP = 0;
  }

  const totalKuota = totalWaliKuota + totalTamuKuota;
  const totalHadir = totalWaliHadir + totalTamuHadir;
  const totalBelumHadir = Math.max(0, totalKuota - totalHadir);
  const percentHadirTotal = totalKuota > 0 ? Math.round((totalHadir / totalKuota) * 100) : 0;

  const waliBelum = Math.max(0, totalWaliKuota - totalWaliHadir);
  const tamuBelum = Math.max(0, totalTamuKuota - totalTamuHadir);

  return {
    chart: {
      type: 'dual_pie',
      title: 'KEHADIRAN HAFLAH 2027',
      wali: {
        title: 'WALI SANTRI',
        totalHadir: totalWaliHadir,
        totalKuota: totalWaliKuota,
        persenHadir: percentWaliRatio,
        totalL: waliL,
        totalP: waliP,
        belumHadir: waliBelum,
        color: '#8C6A47',
      },
      tamu: {
        title: 'TAMU UNDANGAN',
        totalHadir: totalTamuHadir,
        totalKuota: totalTamuKuota,
        persenHadir: percentTamuRatio,
        totalL: tamuL,
        totalP: tamuP,
        belumHadir: tamuBelum,
        color: '#D49B5B',
      },
      data: [
        { label: `Wali Santri (${totalWaliHadir})`, value: totalWaliHadir, percent: percentWaliRatio, color: '#8C6A47' },
        { label: `Tamu Undangan (${totalTamuHadir})`, value: totalTamuHadir, percent: percentTamuRatio, color: '#D49B5B' },
        { label: `Belum Hadir (${totalBelumHadir})`, value: totalBelumHadir, percent: Math.max(0, 100 - percentHadirTotal), color: '#E5E0D8' },
      ],
      summary: {
        totalWaliHadir,
        totalWaliKuota,
        totalTamuHadir,
        totalTamuKuota,
        totalHadir,
        totalKuota,
      },
    },
    textSummary: {
      totalWaliHadir,
      totalWaliKuota,
      percentWaliRatio,
      waliL,
      waliP,
      waliBelum,
      totalTamuHadir,
      totalTamuKuota,
      percentTamuRatio,
      tamuL,
      tamuP,
      tamuBelum,
      totalHadir,
      totalKuota,
      percentHadirTotal,
    },
  };
}

export async function getLiveArrivedGuestsResponse(prompt: string, isFirstTurn: boolean = false): Promise<string> {
  const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
  const intro = isFirstTurn ? "Wa'alaikum Salam Wr. Wb.! 🙏✨\n\n" : "";

  try {
    const tamuMetrics = await getTamuUndanganMetrics();

    const [resLogs, resTamu] = await Promise.all([
      supabase.from('presensi_log').select('*').order('created_at', { ascending: false }),
      supabase.from('tamu_undangan').select('*').order('created_at', { ascending: false }),
    ]);

    const logs = resLogs.data || [];
    const tamuData = resTamu.data || [];

    const presensiSet = new Set(logs.map((l) => (l.kode_qr || '').toUpperCase()));

    const arrivedTamu = tamuData.filter(
      (t) => (t.kuota_terpakai || 0) > 0 || presensiSet.has((t.kode || '').toUpperCase())
    );

    if (arrivedTamu.length === 0 && tamuMetrics.totalHadir === 0) {
      return `${intro}Alhamdulillah Us, per 02 Januari 2027 pukul ${nowStr} WIB, belum ada Tamu Undangan yang tercatat presensi di gerbang masuk.\n\nTotal Tamu Undangan Terdaftar: **${tamuMetrics.totalKuota} tamu**.\nSisa **${tamuMetrics.totalKuota} tamu** masih dalam perjalanan / belum di-absen.\n\n[👉 Buka Live Dasbor](/admin/dasbor) · [👉 Data Peserta & Tamu](/admin/peserta)`;
    }

    const guestLines = arrivedTamu.map((t, idx) => {
      const log = logs.find((l) => (l.kode_qr || '').toUpperCase() === (t.kode || '').toUpperCase());
      const jam = log
        ? new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
        : 'Hari-H';
      const terpakai = (t.kuota_terpakai || 0) > 0 ? t.kuota_terpakai : (log ? (log.jumlah_l || 0) + (log.jumlah_p || 0) : 1);
      const totalK = (t.nama_putra && String(t.nama_putra).trim() ? 1 : 0) + (t.nama_putri && String(t.nama_putri).trim() ? 1 : 0);
      const instansiInfo = t.instansi || t.alamat || 'Tamu Undangan';
      const katInfo = t.kategori || t.sub_kategori || 'Tamu Kehormatan';

      return `${idx + 1}. **${t.nama || 'Tamu Undangan'}** (\`${t.kode}\`) - ${instansiInfo}\n   - **Kategori**: ${katInfo}\n   - **Status**: ✅ **HADIR** (pukul ${jam} WIB, ${terpakai}/${totalK} Kursi)`;
    });

    const totalTerdaftar = tamuMetrics.totalKuota;
    const totalHadirCount = tamuMetrics.totalHadir;
    const percentRatio = tamuMetrics.persenHadir;
    const sisa = Math.max(0, totalTerdaftar - totalHadirCount);

    return `${intro}Alhamdulillah Us, per 02 Januari 2027 pukul ${nowStr} WIB, tercatat **${arrivedTamu.length} Tamu Undangan** yang sudah hadir:\n\n${guestLines.join('\n\n')}\n\nTotal yang sudah hadir: **${totalHadirCount} tamu** dari **${totalTerdaftar} tamu terdaftar** (${percentRatio}%). Sisa **${sisa} tamu** yang belum tercatat hadir.\n\n[👉 Buka Live Dasbor](/admin/dasbor) · [👉 Data Peserta & Tamu](/admin/peserta)`;
  } catch (err: any) {
    return `${intro}Maaf Us, terjadi kendala saat query data tamu realtime dari database. Mohon cek langsung menu [👉 Live Dasbor](/admin/dasbor).`;
  }
}

export async function getWaliSantriHadir() {
  try {
    const { data: presensi, error: err1 } = await supabase
      .from('presensi_log')
      .select('kode_qr, nama_peserta, jumlah_l, jumlah_p, jalur, created_at')
      .like('kode_qr', 'SH%')
      .order('created_at', { ascending: false });

    if (err1) throw err1;

    if (!presensi || presensi.length === 0) {
      return {
        source: 'live' as const,
        totalWaliHadir: 0,
        list: [],
        message: 'Belum ada wali santri yang tercatat hadir.',
      };
    }

    const kodes = Array.from(new Set(presensi.map((p) => p.kode_qr).filter(Boolean)));
    const { data: santriList } = await supabase
      .from('peserta_santri')
      .select('kode, nama, nama_wali, kategori_utama, sub_kategori')
      .in('kode', kodes);

    const combined = presensi.map((p) => {
      const kUpper = (p.kode_qr || '').toUpperCase();
      const s = santriList?.find(
        (x: any) => (x.kode || '').toUpperCase() === kUpper
      );
      return {
        kode: p.kode_qr,
        namaSantri: s?.nama || 'Santriwati',
        namaWali: s?.nama_wali || p.nama_peserta || 'Wali Santri',
        kategori: s?.sub_kategori || s?.kategori_utama || 'Reguler',
        jumlahL: p.jumlah_l || 0,
        jumlahP: p.jumlah_p || 0,
        jalur: p.jalur || 'REGULER',
        waktu: p.created_at,
      };
    });

    return {
      source: 'live' as const,
      totalWaliHadir: combined.length,
      list: combined,
    };
  } catch (err) {
    return {
      source: 'unavailable' as const,
      totalWaliHadir: 0,
      list: [],
      message: 'Sistem sedang tidak dapat mengakses data presensi log.',
    };
  }
}

export async function getLiveArrivedWaliResponse(prompt: string, isFirstTurn: boolean = false): Promise<string> {
  const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
  const dateStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
  const intro = isFirstTurn ? "Wa'alaikum Salam Wr. Wb.! 🙏✨\n\n" : "";

  try {
    const res = await getWaliSantriHadir();
    const wsMetrics = await getWaliSantriMetrics().catch(() => null);

    const totalKuota = wsMetrics?.totalKuota || 6;
    const totalHadirCount = wsMetrics?.totalHadir || res.totalWaliHadir;

    if (res.list.length === 0 && totalHadirCount === 0) {
      return `${intro}Alhamdulillah Us, per ${dateStr} pukul ${nowStr} WIB, belum ada Wali Santri yang tercatat presensi di gerbang masuk.\n\nTotal Kuota Wali Santri: **${totalKuota} kursi**.\nSisa **${totalKuota} kursi** belum di-absen.\n\n[👉 Buka Live Dasbor](/admin/dasbor) · [👉 Data Peserta & Tamu](/admin/peserta)`;
    }

    const waliLines = res.list.map((w, idx) => {
      const jam = new Date(w.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
      const totalOrang = w.jumlahL + w.jumlahP;
      return `${idx + 1}. **Wali dari ${w.namaSantri}** (\`${w.kode}\`) - ${w.kategori}\n   - **Nama Wali**: ${w.namaWali}\n   - **Hadir dengan**: ${totalOrang} orang (Laki-laki: ${w.jumlahL}, Perempuan: ${w.jumlahP})\n   - **Jalur**: via ${w.jalur || 'Gerbang'}\n   - **Waktu**: pukul ${jam} WIB`;
    });

    const percentRatio = totalKuota > 0 ? Math.round((totalHadirCount / totalKuota) * 100) : 0;

    return `${intro}Alhamdulillah Us, per ${dateStr} pukul ${nowStr} WIB, tercatat **${res.list.length} wali santri** yang sudah hadir:\n\n${waliLines.join('\n\n')}\n\nTotal yang sudah hadir: **${totalHadirCount} wali santri**.\nTotal kuota wali santri: **${totalKuota} kursi**.\nPersentase: **${percentRatio}%** dari kuota.\n\n[👉 Buka Live Dasbor](/admin/dasbor) · [👉 Data Peserta & Tamu](/admin/peserta)`;
  } catch (err: any) {
    return `${intro}Maaf Us, terjadi kendala saat query data wali santri realtime dari database. Mohon cek langsung menu [👉 Live Dasbor](/admin/dasbor).`;
  }
}

export async function handleWaliSantriQueries(prompt: string, isFirstTurn: boolean): Promise<string | null> {
  const qLower = prompt.toLowerCase().trim();
  const isWaliQuery =
    qLower.includes('wali') ||
    qLower.includes('walisantri') ||
    qLower.includes('orang tua');

  if (!isWaliQuery) return null;

  const isAsking =
    qLower.includes('siapa') ||
    qLower.includes('siapakah') ||
    qLower.includes('daftar') ||
    qLower.includes('sebutkan') ||
    qLower.includes('mana') ||
    qLower.includes('siapa saja') ||
    qLower.includes('nama');

  if (!isAsking) return null;

  try {
    const termToSearch = qLower
      .replace(/\b(siapa|siapakah|wali|walisantri|orang|tua|dari|santri|daftar|sebutkan|mana|saja|apakah|nama|siapa saja|yang|itu)\b/gi, ' ')
      .trim();

    let query = supabase
      .from('peserta_santri')
      .select('kode, nama, nama_wali, kelas, kamar, kuota_dasar, kuota_tambahan, kuota_terpakai, no_hp, alamat')
      .order('kode');

    if (termToSearch && termToSearch.length >= 2) {
      query = query.or(`kode.ilike.%${termToSearch}%,nama.ilike.%${termToSearch}%,nama_wali.ilike.%${termToSearch}%`);
    } else {
      query = query.limit(20);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) return null;

    const dateStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });

    if (termToSearch && data.length <= 5) {
      const items = data.map((s, idx) => {
        const isHadir = Number(s.kuota_terpakai || 0) > 0;
        const totalK = Number(s.kuota_dasar || 2) + Number(s.kuota_tambahan || 0);
        return `${idx + 1}. **Santri**: **${s.nama}** (\`${s.kode}\`)\n` +
          `   - **Nama Wali**: **${s.nama_wali || s.nama}**\n` +
          `   - **Kelas / Kamar**: ${s.kelas || '-'} / Kamar ${s.kamar || '-'}\n` +
          `   - **Status Presensi**: ${isHadir ? '✅ **SUDAH HADIR**' : '⏳ Belum Presensi'} (${s.kuota_terpakai || 0}/${totalK} Kursi)\n` +
          `   - **Alamat**: ${s.alamat || 'Kediri'}`;
      });

      return `${isFirstTurn ? "Wa'alaikum Salam Wr. Wb.! 🙏✨\n\n" : ""}Alhamdulillah Us, berikut data **Wali Santri** di database Supabase yang Anda cari:\n\n${items.join('\n\n')}\n\n[📋 Buka Data Peserta & Wali](/admin/peserta)`;
    }

    const listLines = data.slice(0, 15).map((s, idx) => {
      return `${idx + 1}. **${s.nama_wali || s.nama}** (Wali dari **${s.nama}** - \`${s.kode}\`)`;
    });

    return `${isFirstTurn ? "Wa'alaikum Salam Wr. Wb.! 🙏✨\n\n" : ""}Alhamdulillah Us, per ${dateStr}, berikut daftar data **Wali Santri** di database Supabase (${data.length} santri terdaftar):\n\n${listLines.join('\n')}\n\n${data.length > 15 ? `_...dan ${data.length - 15} wali santri lainnya._\n\n` : ''}[📋 Lihat Seluruh Data Santri & Wali](/admin/peserta)`;
  } catch (e) {
    console.warn('Error querying wali santri:', e);
    return null;
  }
}
