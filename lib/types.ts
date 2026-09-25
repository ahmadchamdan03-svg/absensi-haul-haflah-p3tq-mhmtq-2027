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

export type WarnaTiket = 'Hijau' | 'Biru' | 'Kuning' | 'Merah muda' | 'Putih' | 'Emas';

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
  unit: 'P3TQ' | 'MHMTQ' | 'MHMA Timur';
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
