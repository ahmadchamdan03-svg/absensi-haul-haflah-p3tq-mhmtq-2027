// =====================================================================
// MASTER DATA TAMU UNDANGAN KHUSUS: HAUL & HAFLAH P3TQ - MHMTQ
// Terhubung penuh secara dinamis ke Supabase Cloud (tabel: tamu_undangan)
// Data statis hardcoded telah dibersihkan total.
// =====================================================================

export interface MasterUndangan {
  code: string;
  nama: string;
  kategori: string;
  subKategori: 'PENGUJI' | 'ASATIDZ_MASYAIKH';
  instansi: string;
  kuotaDasar: number;
  warnaTiket: string;
}

export const MASTER_UNDANGAN_LIST: MasterUndangan[] = [];
