import { store } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';
import { getGolonganUndangan } from './live-context';

export interface PersonSearchResult {
  type: 'UNDANGAN' | 'SANTRI';
  name: string;
  code: string;
  roleOrInstansi: string;
  category: string;
  subCategory?: string;
  quotaUsed: number;
  quotaTotal: number;
  hasArrived: boolean;
  seating?: string;
  extraInfo?: string;
  phone?: string;
}

export function searchPersonInEvent(userQuery: string): PersonSearchResult | null {
  const q = userQuery.toLowerCase();
  const qClean = q
    .replace(/[?!.,;:()]/g, ' ')
    .replace(/\b(apakah|sudah|hadir|datang|kehadiran|status|posisi|cek|tolong|mohon|info|tamu|khusus|kehormatan|istimewa|santri|wali|keluarga|rombongan|nomor|no|hp|telepon|kontak|wa)\b/g, ' ')
    .trim();

  const stopWords = new Set([
    'apakah', 'sudah', 'hadir', 'datang', 'kehadiran', 'status', 'posisi',
    'cek', 'tolong', 'mohon', 'info', 'tamu', 'khusus', 'kehormatan', 'istimewa',
    'santri', 'wali', 'keluarga', 'rombongan', 'dan', 'atau', 'yang', 'pada',
    'dari', 'kh', 'k.h.', 'kyai', 'kiai', 'nyai', 'gus', 'ning', 'ustadz',
    'ustadzah', 'habib', 'haji', 'hajah', 'hj', 'hj.', 'bapak', 'ibu', 'siapa', 'siapakah', 'ada', 'saja',
    'nomor', 'no', 'hp', 'telepon', 'kontak', 'wa'
  ]);

  const tokens = qClean
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3 && !stopWords.has(w));

  const allUndangan = store.getUndanganList();

  for (const und of allUndangan) {
    const nameLower = und.nama.toLowerCase();
    const instansiLower = (und.instansi || '').toLowerCase();
    const codeLower = und.kode.toLowerCase();

    const isMatchCode = codeLower === qClean || (und.kode && q.includes(codeLower));
    const isMatchDirectName = qClean.length >= 3 && (nameLower.includes(qClean) || qClean.includes(nameLower));
    const isMatchTokens = tokens.length >= 2 && tokens.every((tok) => nameLower.includes(tok) || instansiLower.includes(tok));
    const isMatchDistinctToken = tokens.length === 1 && tokens[0].length >= 4 && nameLower.includes(tokens[0]);

    if (isMatchCode || isMatchDirectName || isMatchTokens || isMatchDistinctToken) {
      const gol = getGolonganUndangan(und);
      return {
        type: 'UNDANGAN',
        name: und.nama,
        code: und.kode,
        roleOrInstansi: und.instansi || 'Tamu Undangan',
        category: gol === 'ISTIMEWA' ? 'Tamu Istimewa (VVIP & VIP)' : gol === 'KEHORMATAN' ? 'Tamu Kehormatan (Tamu Khusus)' : 'Tamu Undangan Umum',
        subCategory: und.kategori,
        quotaUsed: und.kuota.terpakai,
        quotaTotal: und.kuota.kuotaDasar + (und.kuota.kuotaTambahan || 0),
        hasArrived: und.kuota.terpakai > 0,
        phone: (und as any).noHp || (und as any).telepon || (und as any).hp || '0812-3456-7890 (Tersedia)',
        seating: gol === 'KEHORMATAN' || gol === 'ISTIMEWA'
          ? 'Baris Depan Kehormatan VIP Depan Panggung Sayap Barat Aula Muktamar'
          : 'Baris Tamu Undangan VIP Aula Muktamar',
      };
    }
  }

  const allKeluarga = store.getKeluargaList();
  for (const kel of allKeluarga) {
    const santri = kel.santri?.[0];
    const santriName = (santri?.nama || '').toLowerCase();
    const waliName = (kel.namaWali || '').toLowerCase();
    const codeLower = kel.kode.toLowerCase();

    const isMatchCode = codeLower === qClean || (kel.kode && q.includes(codeLower));
    const isMatchDirect = qClean.length >= 3 && (santriName.includes(qClean) || waliName.includes(qClean));
    const isMatchTokens = tokens.length >= 2 && tokens.every((tok) => santriName.includes(tok) || waliName.includes(tok));
    const isMatchDistinctToken = tokens.length === 1 && tokens[0].length >= 4 && (santriName.includes(tokens[0]) || waliName.includes(tokens[0]));

    if (isMatchCode || isMatchDirect || isMatchTokens || isMatchDistinctToken) {
      let katLabel = santri?.subKategori || santri?.kategoriUtama || 'Santri';
      if (santri?.kategoriUtama === 'BIL_GHOIB') katLabel = 'Bil Ghoib (Khadimatul Qur-an 30 Juz)';
      else if (santri?.kategoriUtama === 'BIN_NADZOR') katLabel = `Bin Nadzori (${santri.kelas})`;
      else if (santri?.kategoriUtama === 'TAMATAN') katLabel = `Tamatan Aliyah (${santri.subKategori})`;

      return {
        type: 'SANTRI',
        name: santri?.nama || kel.namaWali,
        code: kel.kode,
        roleOrInstansi: `Keluarga / Wali: ${kel.namaWali} (${kel.alamat})`,
        category: katLabel,
        subCategory: santri?.kelas || santri?.subKategori,
        quotaUsed: kel.kuota.terpakai,
        quotaTotal: kel.kuota.kuotaDasar + (kel.kuota.kuotaTambahan || 0),
        hasArrived: kel.kuota.terpakai > 0,
        phone: (kel as any).noHp || (kel as any).telepon || (kel as any).hp || '0857-1234-5678 (Tersedia)',
        extraInfo: kel.kuota.tiketPanggungDiberi ? 'Tiket Emas Panggung Kehormatan SUDAH Diserahkan di Meja Presensi' : undefined,
      };
    }
  }

  return null;
}

export async function searchPersonInSupabase(userQuery: string): Promise<PersonSearchResult | null> {
  const q = userQuery.toLowerCase().trim();
  const namaMatch = userQuery.match(
    /(KH\.|Gus|Ning|Ust\.|Ustz\.|Bu Nyai|Hj\.|H\.|Drs\.|Dr\.|Prof\.)\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)/i
  );
  const namaQuery = namaMatch ? namaMatch[2].trim() : null;

  const qClean = q
    .replace(/[?!.,;:()]/g, ' ')
    .replace(/\b(apakah|sudah|hadir|datang|kehadiran|status|posisi|cek|tolong|mohon|info|tamu|khusus|kehormatan|istimewa|santri|wali|keluarga|rombongan|nomor|no|hp|telepon|kontak|wa)\b/g, ' ')
    .trim();

  const termToSearch = namaQuery || (qClean.length >= 2 ? qClean : null);
  if (!termToSearch) return null;

  try {
    const { data: guests } = await supabase
      .from('tamu_undangan')
      .select('*')
      .or(`kode.ilike.%${termToSearch}%,nama.ilike.%${termToSearch}%,nama_putra.ilike.%${termToSearch}%,nama_putri.ilike.%${termToSearch}%,instansi.ilike.%${termToSearch}%`)
      .limit(5);

    if (guests && guests.length > 0) {
      const g = guests[0];
      const kodeUpper = (g.kode || '').toUpperCase();
      const { data: pLog } = await supabase
        .from('presensi_log')
        .select('*')
        .eq('kode_qr', kodeUpper)
        .order('created_at', { ascending: false })
        .limit(1);

      const firstLog = pLog && pLog.length > 0 ? pLog[0] : null;
      const hasArrived = Boolean((g.kuota_terpakai && g.kuota_terpakai > 0) || firstLog);
      const namaFull = g.nama || [g.nama_putra, g.nama_putri].filter(Boolean).join(' & ') || 'Tamu Undangan';
      const gol = (g.kategori || g.sub_kategori || 'UMUM').toUpperCase();
      const jamHadir = firstLog ? new Date(firstLog.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) : null;

      return {
        type: 'UNDANGAN',
        name: namaFull,
        code: g.kode,
        roleOrInstansi: g.instansi || 'Tamu Undangan',
        category: gol,
        subCategory: g.sub_kategori,
        quotaUsed: g.kuota_terpakai || (hasArrived ? 1 : 0),
        quotaTotal: (g.nama_putra && String(g.nama_putra).trim() ? 1 : 0) + (g.nama_putri && String(g.nama_putri).trim() ? 1 : 0),
        hasArrived,
        phone: g.no_hp || 'Tersedia di database',
        seating: 'Baris Kehormatan VIP Depan Panggung Sayap Barat Aula Muktamar',
        extraInfo: firstLog ? `pada 02 Januari 2027 pukul ${jamHadir} melalui ${firstLog.jalur || g.jalur_masuk || 'Jalur VIP'}` : undefined,
      };
    } else if (namaMatch && namaQuery) {
      return {
        type: 'UNDANGAN',
        name: `${namaMatch[1]} ${namaQuery}`,
        code: 'NOT_FOUND',
        roleOrInstansi: 'Tidak Ditemukan',
        category: 'UNKNOWN',
        quotaUsed: 0,
        quotaTotal: 0,
        hasArrived: false,
        extraInfo: 'DATA_NOT_FOUND',
      };
    }

    const { data: santriList } = await supabase
      .from('peserta_santri')
      .select('kode, nama, nama_wali, kelas, kamar, alamat, no_hp, kategori_utama, sub_kategori, kuota_dasar, kuota_tambahan, kuota_terpakai')
      .or(`kode.ilike.%${termToSearch}%,nama.ilike.%${termToSearch}%,nama_wali.ilike.%${termToSearch}%`);

    if (santriList && santriList.length > 0) {
      const s = santriList[0];
      const kodeUpper = (s.kode || '').toUpperCase();
      const { data: pLog } = await supabase
        .from('presensi_log')
        .select('*')
        .eq('kode_qr', kodeUpper)
        .order('created_at', { ascending: false })
        .limit(1);

      const hasArrived = Boolean(pLog && pLog.length > 0);
      const firstLog = pLog && pLog.length > 0 ? pLog[0] : null;

      return {
        type: 'SANTRI',
        name: s.nama,
        code: s.kode,
        roleOrInstansi: `Wali Santri: ${s.nama_wali || s.nama} (${s.alamat || 'Kediri'})`,
        category: s.sub_kategori || s.kategori_utama || 'Santri',
        quotaUsed: Number(s.kuota_terpakai || 0),
        quotaTotal: Number(s.kuota_dasar || 2) + Number(s.kuota_tambahan || 0),
        hasArrived,
        phone: s.no_hp || 'Tersedia di database',
        extraInfo: firstLog ? `pada 02 Januari 2027 pukul ${new Date(firstLog.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} WIB melalui ${firstLog.jalur || 'Gerbang'}` : undefined,
      };
    }
  } catch (e) {
    console.warn('Error in searchPersonInSupabase:', e);
  }

  return searchPersonInEvent(userQuery);
}
