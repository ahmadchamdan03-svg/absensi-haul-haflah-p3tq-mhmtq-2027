// =====================================================================
// DEFINISI TIPE DATA: HAUL & HAFLAH P3TQ - MHMTQ v4.2
// =====================================================================

export type KategoriKode = 'BIL_GHOIB' | 'BIN_NADZOR' | 'TAMATAN';

export const BAGIAN_TAMATAN_LIST = ['A.01', 'A.02', 'A.03', 'A.04', 'B.01', 'B.02', 'B.03'] as const;

export function extractBagianTamatan(text?: string): string {
  if (!text) return '';
  const match = text.match(/[AB]\.0[1-4]/i);
  return match ? match[0].toUpperCase() : '';
}

export type WarnaTiket = 'Hijau' | 'Biru' | 'Kuning' | 'Merah muda' | 'Putih' | 'Emas' | 'Hitam Gold' | 'Merah Gold' | '';

export function getWarnaTiketSantri(kategoriUtama?: string, subKategori?: string): string {
  const kat = (kategoriUtama || '').toUpperCase();
  const sub = (subKategori || '').toLowerCase();
  if (kat === 'BIL_GHOIB' || sub.includes('bil ghoib') || sub.includes('ghoib')) {
    return 'Hitam Gold';
  }
  return 'Merah Gold';
}

/**
 * Aturan Kuota Dasar Santri Multi-Kategori:
 * 1. Bil Ghoib (jika santri terdaftar Bil Ghoib, termasuk bersama kategori lain) -> kuota_dasar = 4 kursi.
 * 2. Bin Nadzori -> 2 kursi.
 * 3. Tamatan -> 2 kursi.
 */
export function calculateKuotaDasarSantri(kategoriUtama?: string, subKategori?: string): number {
  const kat = (kategoriUtama || '').toUpperCase();
  const sub = (subKategori || '').toUpperCase();
  if (kat.includes('BIL_GHOIB') || kat.includes('GHOIB') || sub.includes('BIL GHOIB') || sub.includes('GHOIB')) {
    return 4;
  }
  return 2;
}

export function getWarnaTiketUndangan(golongan?: string, kategori?: string): string {
  const gol = (golongan || '').toUpperCase();
  const kat = (kategori || '').toLowerCase();

  if (gol === 'UMUM' || gol === 'UNDANGAN_UMUM') {
    return 'Merah Gold';
  }

  if (gol === 'ISTIMEWA' || gol === 'UNDANGAN_ISTIMEWA') {
    if (kat.includes('ids')) {
      return 'Merah Gold';
    }
    return '';
  }

  if (gol === 'KEHORMATAN' || gol === 'UNDANGAN_KEHORMATAN') {
    return '';
  }

  if (kat.includes('ids')) return 'Merah Gold';
  if (
    kat.includes('vvip') ||
    kat.includes('marzuqi') ||
    kat.includes('qomariyah') ||
    kat.includes('mahrus') ||
    kat.includes('zainab') ||
    kat.includes('salamah') ||
    kat.includes('aisyah') ||
    kat.includes('bandar') ||
    kat.includes('kunir') ||
    kat.includes('blitar') ||
    kat.includes('kehormatan')
  ) {
    return '';
  }

  return 'Merah Gold';
}

export function getDefaultJalurMasuk(golongan?: string): string {
  const g = String(golongan || '').toUpperCase();
  if (g.includes('ISTIMEWA') || g.includes('KEHORMATAN')) {
    return 'Jalur VIP';
  }
  return 'Gerbang Selatan (Bola Dunia)';
}

export type GolonganUndangan = 'ISTIMEWA' | 'KEHORMATAN' | 'UMUM';

export function getGolonganUndangan(u: any): GolonganUndangan {
  if (!u) return 'UMUM';
  if (u.golongan) {
    if (u.golongan === 'KEHORMATAN' || u.golongan === 'UNDANGAN_KEHORMATAN') return 'KEHORMATAN';
    if (u.golongan === 'ISTIMEWA' || u.golongan === 'UNDANGAN_ISTIMEWA') return 'ISTIMEWA';
    if (u.golongan === 'UMUM' || u.golongan === 'UNDANGAN_UMUM') return 'UMUM';
  }

  const text = `${u.kategori || ''} ${u.nama || ''} ${u.instansi || ''} ${u.alamat || ''}`.toLowerCase();

  if (
    text.includes('kehormatan') ||
    text.includes('masyayikh') ||
    text.includes('masyaikh') ||
    text.includes('habaib') ||
    text.includes('pejabat') ||
    text.includes('forkopimda') ||
    text.includes('pengasuh') ||
    text.includes('tokoh')
  ) {
    return 'KEHORMATAN';
  }

  if (
    text.includes('istimewa') ||
    text.includes('vvip') ||
    text.includes('bani') ||
    text.includes('bandar') ||
    text.includes('kunir')
  ) {
    return 'ISTIMEWA';
  }

  return 'UMUM';
}

export type JalurPemeriksaan = 'BARAT' | 'TIMUR' | 'REKONSILIASI';

export type StatusHadirEstimasi = 'BELUM' | 'HADIR' | 'RAGU' | 'BERHALANGAN';

export type StatusPembelian =
  | 'DIPESAN'
  | 'MENUNGGU_VERIFIKASI'
  | 'DIVERIFIKASI'
  | 'DITOLAK'
  | 'KEDALUWARSA'
  | 'DIBATALKAN_REFUND';

export type StatusPesanWA = 'BELUM' | 'TERKIRIM' | 'NOMOR_BERMASALAH' | 'DILEWATI';

export interface EventConfig {
  id: string;
  nama: string;
  slug: string; // misal 'HFL27'
  waktuMulai: string; // ISO string '2027-01-02T06:30:00+07:00'
  tempat: string;
  kunciHmac: string;
  linkGrupWa: string;
  kebijakanKuota: {
    lintasKategori: 'MAX';
    hangusMenit: number; // 300 menit (5 jam)
    bonusSaudara: null;
  };
  status: 'DRAFT' | 'AKTIF' | 'SELESAI' | 'ARSIP';
}

export interface KategoriKuota {
  id: string;
  eventId: string;
  kode: KategoriKode;
  subKategori: string;
  kuotaDefault: number;
  tiketPanggung: number; // 1 untuk Bil Ghoib, 0 lainnya
  warnaTiket: WarnaTiket;
  urutan: number;
}

export interface Santri {
  id: string;
  keluargaId: string;
  nis: string;
  nama: string;
  kelas: string;
  kategoriUtama: KategoriKode;
  kategoriSekunder?: KategoriKode[];
  subKategori: string;
  kamar?: string;
}

export interface Keluarga {
  id: string;
  kode: string; // 'SH0042'
  namaWali: string;
  noHp: string;
  alamat: string;
  santri?: Santri[];
}

export interface Kuota {
  id: string;
  eventId: string;
  pemilikTipe: 'KELUARGA' | 'UNDANGAN';
  pemilikId: string;
  kodeQr: string; // 'SH0042' atau 'UND0117'
  kuotaDasar: number;
  kuotaTambahan: number;
  terpakai: number;
  tiketPanggungJatah: number;
  tiketPanggungDiberi: number;
  hangus: boolean;
  hangusAt?: string | null;
}

export interface PesertaSantriDbRow {
  id?: string | number;
  kode: string;
  nama: string;
  kategori_utama: string;
  kategori_sekunder?: string | null;
  sub_kategori: string;
  kelas?: string | null;
  kamar?: string | null;
  nama_wali: string;
  no_hp?: string | null;
  alamat?: string | null;
  kuota_dasar: number;
  kuota_tambahan: number;
  kuota_terpakai: number;
  warna_tiket: string;
  status_wa?: string | null;
  created_at?: string;
}

export interface TamuUndanganDbRow {
  id?: string | number;
  kode: string;
  nama: string;
  nama_putra?: string | null;
  nama_putri?: string | null;
  kategori: string;
  sub_kategori: string;
  instansi?: string | null;
  alamat?: string | null;
  no_hp?: string | null;
  kuota_dasar: number;
  kuota_tambahan: number;
  kuota_terpakai: number;
  warna_tiket: string;
  status_wa?: string | null;
  jalur_masuk?: string | null;
  created_at?: string;
}

export interface AkunOtoritasDbRow {
  id?: string;
  peran: string;
  password: string;
  hak_akses?: string | null;
  created_at?: string;
}

export interface VDasborPimpinan {
  total_santri: number;
  total_tamu: number;
  total_kuota_wali: number;
  total_kuota_tamu: number;
  total_hadir_wali: number;
  total_hadir_tamu: number;
  total_l_wali: number;
  total_p_wali: number;
  total_l_tamu: number;
  total_p_tamu: number;
}

export interface VRekapSohibulHajat {
  kategori_utama: string;
  sub_kategori: string;
  jumlah_santri: number;
  total_kuota_dasar: number;
  total_kuota_tambahan: number;
  total_kuota: number;
}

export interface KonfigurasiSistemDbRow {
  id?: string | number;
  kunci: string;
  nilai: string;
  keterangan?: string | null;
  updated_at?: string;
}


export interface EstimasiKehadiran {
  kuotaId: string;
  perkiraanL: number;
  perkiraanP: number;
  statusHadir?: StatusHadirEstimasi;
  statusKonfirmasi: 'SUDAH' | 'BELUM';
  diisiAt: string;
  diubahOleh?: string;
  catatan?: string;
}

export interface DaftarBelumHadirItem {
  id: string | number;
  kode: string;
  tipe: 'SANTRI' | 'UNDANGAN';
  kategoriUtama: 'BIL_GHOIB' | 'BIN_NADZOR' | 'TAMATAN' | 'UNDANGAN';
  golonganUndangan?: GolonganUndangan;
  nama: string;
  waliAtauInstansi: string;
  kategori: string;
  kelasAtauSub: string;
  noHp?: string;
  alamat?: string;
  kuotaDasar: number;
  kuotaTambahan: number;
  totalKuota: number;
  terpakai: number;
  sisa: number;
  warnaTiket: string;
  statusKonfirmasi: 'SUDAH' | 'BELUM';
  estimasiL?: number;
  estimasiP?: number;
  estimasiTotal?: number;
  estimasiDiisiAt?: string;
}

export interface PesertaHadirItem {
  id: string | number;
  kode: string;
  tipe: 'SANTRI' | 'UNDANGAN';
  kategoriUtama: 'BIL_GHOIB' | 'BIN_NADZOR' | 'TAMATAN' | 'UNDANGAN';
  golonganUndangan?: GolonganUndangan;
  nama: string;
  waliAtauInstansi: string;
  kategori: string;
  kelasAtauSub: string;
  kamar?: string;
  noHp?: string;
  alamat?: string;
  kuotaDasar: number;
  kuotaTambahan: number;
  totalKuota: number;
  terpakai: number;
  sisa: number;
  warnaTiket: string;
  jumlahL: number;
  jumlahP: number;
  tiketPanggungDiberi: number;
  tiketPanggungJatah: number;
  jamMasuk?: string;
  jalur?: string;
}

export interface PresensiLog {
  id: number;
  eventId: string;
  kuotaId?: string;
  hasil: 'SUKSES' | 'KUOTA_HABIS' | 'KUOTA_HANGUS' | 'QR_INVALID' | 'PANGGUNG_BUTUH_PEREMPUAN' | 'WALK_IN';
  jumlahL: number;
  jumlahP: number;
  tiketPanggung: boolean;
  jumlahBalita: number;
  jalur: JalurPemeriksaan;
  panitiaId: string;
  nonce: string;
  serverTime: string;
  catatan?: string;
}

export interface PembelianKuota {
  id: string;
  eventId: string;
  keluargaId: string;
  jumlah: number;
  totalBayar: number;
  buktiUrl?: string;
  status: StatusPembelian;
  kedaluwarsaAt: string; // Batas 6 jam untuk upload bukti bayar
  buktiUploadedAt?: string; // Waktu ketika wali santri mengunggah bukti bayar
  batasVerifikasiAt?: string; // Target verifikasi manual panitia (6 jam setelah upload bukti)
  autoApproveAt?: string; // Batas toleransi auto-approve sistem (12 jam setelah upload bukti)
  autoApprovedBySystem?: boolean; // True jika disetujui otomatis oleh sistem karena melewati 12 jam
  catatanPanitia?: string;
  metodeRefund?: 'TRANSFER' | 'TUNAI_HARI_H';
  buktiRefundUrl?: string;
  createdAt: string;
  diputusAt?: string;
  // Join fields for UI
  keluarga?: Keluarga;
  santri?: Santri;
}

export interface PesanUndangan {
  id: string;
  eventId: string;
  keluargaId: string;
  gelombang: 1 | 2;
  status: StatusPesanWA;
  dikirimOleh?: string;
  dikirimAt?: string;
  portalDibukaAt?: string;
  keluarga?: Keluarga;
  santri?: Santri;
}

export interface CheckinResult {
  ok: boolean;
  reason?: string;
  pesan?: string;
  sisa?: number;
  diminta?: number;
  namaSantri?: string;
  kelas?: string;
  kategori?: string;
  warnaTiket?: string;
  masukSekarang?: number;
  terpakai?: number;
  kuotaTotal?: number;
  tiketPanggung?: boolean;
  tiketReguler?: number;
  zonaLaki?: number;
  zonaPerempuan?: number;
  zonaPanggung?: number;
  riwayat?: { waktu: string; jumlahL: number; jumlahP: number; jalur: string }[];
  detail?: any;
}

export interface KategoriStat {
  nama: string;
  subLabel: string;
  warnaTiket: string;
  badgeWarna: string;
  totalPeserta: number;
  hadirPeserta: number;
  totalKuota: number;
  totalHadir: number;
  persentase: number;
}

export interface DaftarHadirRealtimeItem {
  id: string | number;
  kode: string;
  tipe: 'SANTRI' | 'UNDANGAN';
  kategoriUtama: 'BIL_GHOIB' | 'BIN_NADZOR' | 'TAMATAN' | 'UNDANGAN';
  nama: string;
  waliAtauInstansi: string;
  kategori: string;
  kelasAtauSub: string;
  kuotaDasar: number;
  kuotaTambahan: number;
  totalKuota: number;
  terpakai: number;
  jumlahL: number;
  jumlahP: number;
  jumlahBalita: number;
  tiketPanggung: boolean;
  warnaTiket: string;
  waktuTiba: string;
  jalur: JalurPemeriksaan;
  panitiaId?: string;
  statusHadir: 'HADIR' | 'SEBAGIAN';
}

export interface StatistikLive {
  totalKuota: number;
  totalHadir: number;
  totalLaki: number;
  totalPerempuan: number;
  totalPanggung: number;
  totalBalita: number;
  jalurBarat: number;
  jalurTimur: number;
  jalurRekon: number;
  persentaseHadir: number;
  sisaKuota: number;

  // Rincian kategori lengkap untuk live dashboard
  kategoriStats?: {
    bilGhoib: KategoriStat;
    binNadzor: KategoriStat;
    tamatan: KategoriStat;
    tamuUndangan: KategoriStat;
    kuotaTambahan: {
      paguTotal: number;
      terjual: number;
      terpakai: number;
      persentase: number;
    };
  };

  // Ringkasan khusus Tamu Undangan VIP
  tamuUndanganStat?: {
    totalUndangan: number;
    hadirUndangan: number;
    totalKuota: number;
    totalHadir: number;
    totalLaki: number;
    totalPerempuan: number;
    persentase: number;
  };
}
