// =====================================================================
// TYPES & CONTEXT INTERFACE UNTUK DATA STORE (HAUL & HAFLAH P3TQ - MHMTQ)
// =====================================================================

import {
  EventConfig,
  Keluarga,
  Santri,
  Kuota,
  EstimasiKehadiran,
  PresensiLog,
  PembelianKuota,
  PesanUndangan,
  StatistikLive,
  KategoriStat,
  DaftarHadirRealtimeItem,
  DaftarBelumHadirItem,
  PesertaHadirItem,
  extractBagianTamatan,
  getGolonganUndangan,
  CheckinResult,
  JalurPemeriksaan,
} from '../types';

export {
  type EventConfig,
  type Keluarga,
  type Santri,
  type Kuota,
  type EstimasiKehadiran,
  type PresensiLog,
  type PembelianKuota,
  type PesanUndangan,
  type StatistikLive,
  type KategoriStat,
  type DaftarHadirRealtimeItem,
  type DaftarBelumHadirItem,
  type PesertaHadirItem,
  extractBagianTamatan,
  getGolonganUndangan,
  type CheckinResult,
  type JalurPemeriksaan,
};

export type KeluargaWithKuota = Keluarga & {
  kuota: Kuota;
  estimasi?: EstimasiKehadiran;
};

export interface TambahPesertaInput {
  nama: string;
  kategoriUtama: 'BIL_GHOIB' | 'BIN_NADZOR' | 'TAMATAN';
  bagianTamatan?: string;
  subKategori?: string;
  kelas?: string;
  kamar?: string;
  namaWali: string;
  noHp: string;
  alamat: string;
}

export interface EditPesertaInput {
  nama?: string;
  namaPutra?: string;
  namaPutri?: string;
  namaWali?: string;
  noHp?: string;
  alamat?: string;
  kamar?: string;
  subKategori?: string;
  kelas?: string;
  kategoriUtama?: 'BIL_GHOIB' | 'BIN_NADZOR' | 'TAMATAN';
  kuotaDasar?: number;
  kategori?: string;
  instansi?: string;
  golongan?: 'ISTIMEWA' | 'KEHORMATAN' | 'UMUM';
  jalurMasuk?: string;
}

export interface RekonsiliasiKoreksiInput {
  kode: string;
  statusKehadiran?: 'HADIR' | 'BELUM_HADIR';
  jumlahL?: number;
  jumlahP?: number;
  kategoriUtama?: 'BIL_GHOIB' | 'BIN_NADZOR' | 'TAMATAN';
  subKategori?: string;
  kelas?: string;
  bagianTamatan?: string;
  kuotaTambahan?: number;
  catatanRekon?: string;
  petugas?: string;
}

export interface TambahUndanganInput {
  nama?: string;
  namaPutra?: string;
  namaPutri?: string;
  kategori: string;
  instansi?: string;
  alamat?: string;
  kuotaDasar: number;
  subKategori?: 'PENGUJI' | 'ASATIDZ_MASYAIKH';
  golongan?: 'ISTIMEWA' | 'KEHORMATAN' | 'UMUM';
  jalurMasuk?: string;
}

export interface TambahPesananManualInput {
  keluargaId: string;
  jumlah: number;
  metodeBayar?: 'TUNAI' | 'TRANSFER';
  langsungVerifikasi?: boolean;
  catatan?: string;
}

export interface FindByKodeResult {
  tipe: 'KELUARGA' | 'UNDANGAN';
  entitas: any;
  santri?: Santri;
  kuota: Kuota;
  estimasi?: EstimasiKehadiran;
}

export interface IDataStoreContext {
  keluargaList: KeluargaWithKuota[];
  undanganList: any[];
  pembelianList: PembelianKuota[];
  presensiLogs: PresensiLog[];
  paguTotal: number;
  paguTerjual: number;
  kuotaTambahanBuka: boolean;
  saveToStorage: (forceAction?: 'RESET' | 'PUSH' | 'MERGE') => void;
  findByKode: (kodeQr: string) => FindByKodeResult | null;
  evaluasiBatasWaktu: () => { ok: boolean; changed: boolean };
}
