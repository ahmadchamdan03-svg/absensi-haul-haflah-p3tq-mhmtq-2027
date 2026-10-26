export type MainTabType = 'WALI_SANTRI' | 'TAMU_UNDANGAN';

export type FilterStatusType = 'SEMUA' | 'SUDAH' | 'BELUM' | 'HADIR' | 'BERHALANGAN';

export type FilterKategoriType = 'SEMUA' | 'BIL_GHOIB' | 'BIN_NADZOR' | 'TAMATAN';

export interface KonfirmasiItem {
  id: any;
  tipe: MainTabType;
  kode: string;
  namaSantri: string;
  namaWali: string;
  namaPutra?: string;
  namaPutri?: string;
  noHp: string;
  alamat: string;
  kamar: string;
  kategoriUtama: string;
  subKategori: string;
  kelas: string;
  kuotaDasar: number;
  kuotaTambahan: number;
  totalKuota: number;
  statusKonfirmasi: 'SUDAH' | 'BELUM';
  rawStatusKonfirmasi?: string;
  perkiraanL: number;
  perkiraanP: number;
  totalEstimasi: number;
  catatan: string;
  diubahOleh: string;
  diisiAt: any;
}

export interface KonfirmasiRekap {
  totalSantri: number;
  totalKuotaSantri: number;
  sudahKonfirmasiCount: number;
  belumKonfirmasiCount: number;
  persentaseSudah: number;
  totalTamu: number;
  totalKuotaTamu: number;
  tamuHadirCount: number;
  tamuBerhalanganCount: number;
  tamuBelumCount: number;
  countTamuHadirL: number;
  countTamuHadirP: number;
  countTamuBerhalanganL: number;
  countTamuBerhalanganP: number;
  persenTamuHadir: number;
  persenTamuBerhalangan: number;
  persenTamuBelum: number;
  totalEstimasiRombongan: number;
  totalEstL: number;
  totalEstP: number;
  sumSudahL: number;
  sumSudahP: number;
  countHadirL: number;
  countHadirP: number;
  bilGhoibCount: number;
  binNadzorCount: number;
  tamatanCount: number;
}

export interface BlastProgress {
  current: number;
  total: number;
  sukses: number;
  gagal: number;
}

export function mapSantriToKonfirmasiItem(s: any): KonfirmasiItem {
  const kDasar = Number(s.kuota_dasar || 2);
  const kTambahan = Number(s.kuota_tambahan || 0);
  const totKuota = kDasar + kTambahan;
  const terpakai = Number(s.kuota_terpakai || 0);

  const estL = Number(s.perkiraan_l || 0);
  const estP = Number(s.perkiraan_p || 0);
  const sumEst = estL + estP;

  const isSudah =
    s.status_konfirmasi === 'SUDAH' ||
    (s.status_konfirmasi !== 'BELUM' && (sumEst > 0 || terpakai > 0));
  const status = isSudah ? 'SUDAH' : 'BELUM';
  const totalEst = isSudah ? (sumEst > 0 ? sumEst : terpakai) : 0;

  return {
    id: s.id,
    tipe: 'WALI_SANTRI',
    kode: s.kode || s.nis || 'SH000',
    namaSantri: s.nama || '-',
    namaWali: s.nama_wali || '-',
    noHp: s.no_hp || '-',
    alamat: s.alamat || '-',
    kamar: s.kamar || '-',
    kategoriUtama: s.kategori_utama || 'BIL_GHOIB',
    subKategori: s.sub_kategori || 'Bil Ghoib',
    kelas: s.kelas || '-',
    kuotaDasar: kDasar,
    kuotaTambahan: kTambahan,
    totalKuota: totKuota,
    statusKonfirmasi: status,
    perkiraanL: estL,
    perkiraanP: estP,
    totalEstimasi: totalEst,
    catatan: s.catatan_konfirmasi || s.catatan || '',
    diubahOleh: s.diubah_oleh || (status === 'SUDAH' ? 'PANITIA_MANUAL' : 'WALI_SANTRI'),
    diisiAt: s.created_at || s.updated_at,
  };
}

export function mapTamuToKonfirmasiItem(t: any): KonfirmasiItem {
  const countL = t.nama_putra && String(t.nama_putra).trim() ? 1 : 0;
  const countP = t.nama_putri && String(t.nama_putri).trim() ? 1 : 0;
  const totKuota = countL + countP;
  const terpakai = Number(t.kuota_terpakai || 0);

  const rawStatus = String(t.status_konfirmasi || '').toUpperCase().trim();
  const isSudah =
    ['HADIR', 'BERHALANGAN', 'SUDAH'].includes(rawStatus) ||
    Boolean(t.confirmed_at) ||
    terpakai > 0;
  const status = isSudah ? 'SUDAH' : 'BELUM';
  const isHadir =
    rawStatus === 'HADIR' ||
    rawStatus === 'SUDAH' ||
    (rawStatus !== 'BERHALANGAN' && isSudah);

  return {
    id: t.id,
    tipe: 'TAMU_UNDANGAN',
    kode: t.kode || 'UND000',
    namaSantri:
      t.nama || [t.nama_putra, t.nama_putri].filter(Boolean).join(' & ') || 'Tamu Undangan',
    namaWali: t.instansi || t.alamat || 'Tamu Undangan',
    namaPutra: t.nama_putra || '',
    namaPutri: t.nama_putri || '',
    noHp: t.no_hp || '-',
    alamat: t.alamat || '-',
    kamar: '-',
    kategoriUtama: t.kategori || 'Tamu Undangan',
    subKategori: t.sub_kategori || 'ISTIMEWA',
    kelas: t.kategori || 'Tamu',
    kuotaDasar: totKuota,
    kuotaTambahan: 0,
    totalKuota: totKuota,
    statusKonfirmasi: status,
    rawStatusKonfirmasi: rawStatus || (isSudah ? 'HADIR' : 'BELUM'),
    perkiraanL: countL,
    perkiraanP: countP,
    totalEstimasi: isHadir ? totKuota : 0,
    catatan: t.catatan_konfirmasi || '',
    diubahOleh: 'TAMU_OFFICIAL',
    diisiAt: t.confirmed_at || t.updated_at || t.created_at,
  };
}

export function calculateKonfirmasiRekap(
  daftarSantri: KonfirmasiItem[],
  daftarTamu: KonfirmasiItem[]
): KonfirmasiRekap {
  // A. Metrik Wali Santri
  const totalSantri = daftarSantri.length;
  const totalKuotaSantri = daftarSantri.reduce((acc, curr) => acc + (curr.totalKuota || 0), 0);
  const sudahKonfirmasiCount = daftarSantri.filter((s) => s.statusKonfirmasi === 'SUDAH').length;
  const belumKonfirmasiCount = Math.max(0, totalSantri - sudahKonfirmasiCount);
  const persentaseSudah =
    totalSantri > 0 ? Math.round((sudahKonfirmasiCount / totalSantri) * 100) : 0;

  const santriSudahList = daftarSantri.filter((s) => s.statusKonfirmasi === 'SUDAH');
  const totalEstimasiRombongan = daftarSantri.reduce(
    (acc, curr) => acc + (curr.totalEstimasi || 0),
    0
  );
  const sumSudahL = santriSudahList.reduce((acc, curr) => acc + (curr.perkiraanL || 0), 0);
  const sumSudahP = santriSudahList.reduce((acc, curr) => acc + (curr.perkiraanP || 0), 0);

  const totalEstL = daftarSantri.reduce((acc, curr) => acc + (curr.perkiraanL || 0), 0);
  const totalEstP = daftarSantri.reduce((acc, curr) => acc + (curr.perkiraanP || 0), 0);

  const countHadirL = daftarSantri.filter(
    (s) => s.statusKonfirmasi === 'SUDAH' && (s.namaPutra || s.perkiraanL > 0)
  ).length;
  const countHadirP = daftarSantri.filter(
    (s) => s.statusKonfirmasi === 'SUDAH' && (s.namaPutri || s.perkiraanP > 0)
  ).length;

  const bilGhoibCount = daftarSantri.filter((s) => s.kategoriUtama === 'BIL_GHOIB').length;
  const binNadzorCount = daftarSantri.filter((s) => s.kategoriUtama === 'BIN_NADZOR').length;
  const tamatanCount = daftarSantri.filter((s) => s.kategoriUtama === 'TAMATAN').length;

  // B. Metrik Tamu Undangan (FIX 8 & FIX 10: 4 Metrik Spesifik Tamu Undangan + Rincian L/P)
  const totalTamu = daftarTamu.length;
  const totalKuotaTamu = daftarTamu.reduce((acc, curr) => acc + (curr.totalKuota || 0), 0);

  const tamuHadirList = daftarTamu.filter(
    (t) =>
      String(t.rawStatusKonfirmasi || '').toUpperCase() === 'HADIR' ||
      (t.statusKonfirmasi === 'SUDAH' &&
        String(t.rawStatusKonfirmasi || '').toUpperCase() !== 'BERHALANGAN')
  );
  const tamuHadirCount = tamuHadirList.length;
  const countTamuHadirL = tamuHadirList.reduce(
    (acc, t) => acc + (t.namaPutra && String(t.namaPutra).trim() ? 1 : 0),
    0
  );
  const countTamuHadirP = tamuHadirList.reduce(
    (acc, t) => acc + (t.namaPutri && String(t.namaPutri).trim() ? 1 : 0),
    0
  );

  const tamuBerhalanganList = daftarTamu.filter(
    (t) => String(t.rawStatusKonfirmasi || '').toUpperCase() === 'BERHALANGAN'
  );
  const tamuBerhalanganCount = tamuBerhalanganList.length;
  const countTamuBerhalanganL = tamuBerhalanganList.reduce(
    (acc, t) => acc + (t.namaPutra && String(t.namaPutra).trim() ? 1 : 0),
    0
  );
  const countTamuBerhalanganP = tamuBerhalanganList.reduce(
    (acc, t) => acc + (t.namaPutri && String(t.namaPutri).trim() ? 1 : 0),
    0
  );

  const tamuBelumCount = Math.max(0, totalTamu - tamuHadirCount - tamuBerhalanganCount);
  const persenTamuHadir = totalTamu > 0 ? Math.round((tamuHadirCount / totalTamu) * 100) : 0;
  const persenTamuBerhalangan =
    totalTamu > 0 ? Math.round((tamuBerhalanganCount / totalTamu) * 100) : 0;
  const persenTamuBelum = totalTamu > 0 ? Math.round((tamuBelumCount / totalTamu) * 100) : 0;

  return {
    totalSantri,
    totalKuotaSantri,
    sudahKonfirmasiCount,
    belumKonfirmasiCount,
    persentaseSudah,
    totalTamu,
    totalKuotaTamu,
    tamuHadirCount,
    tamuBerhalanganCount,
    tamuBelumCount,
    countTamuHadirL,
    countTamuHadirP,
    countTamuBerhalanganL,
    countTamuBerhalanganP,
    persenTamuHadir,
    persenTamuBerhalangan,
    persenTamuBelum,
    totalEstimasiRombongan,
    totalEstL,
    totalEstP,
    sumSudahL,
    sumSudahP,
    countHadirL,
    countHadirP,
    bilGhoibCount,
    binNadzorCount,
    tamatanCount,
  };
}
