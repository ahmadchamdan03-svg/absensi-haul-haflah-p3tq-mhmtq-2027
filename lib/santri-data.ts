// =====================================================================
// MASTER DATA SANTRI: HAUL & HAFLAH P3TQ - MHMTQ 2027
// Terhubung penuh secara dinamis ke Supabase Cloud (tabel: peserta_santri)
// Data statis hardcoded telah dibersihkan total.
// =====================================================================

export interface MasterSantri {
  code: string;
  nama: string;
  kategoriUtama: 'BIL_GHOIB' | 'BIN_NADZOR' | 'TAMATAN';
  subKategori: string;
  kelas: string;
  kamar: string;
  namaWali: string;
  alamat: string;
  noHp: string;
  kuotaDasar: number;
  tiketPanggungJatah: number;
  warnaTiket: string;
}

export const REAL_SANTRI_LIST: MasterSantri[] = [];
