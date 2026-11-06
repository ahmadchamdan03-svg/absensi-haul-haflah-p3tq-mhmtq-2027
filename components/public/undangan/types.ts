export interface UndanganKuota {
  id?: string;
  kodeQr: string;
  kuotaDasar: number;
  kuotaTambahan: number;
  terpakai: number;
}

export interface UndanganEstimasi {
  statusKonfirmasi: 'BELUM' | 'SUDAH' | 'HADIR' | 'BERHALANGAN' | string;
  perkiraanL: number;
  perkiraanP: number;
  hariKonfirmasi?: string;
  jamKonfirmasi?: string;
  catatan?: string;
  diisiAt?: string;
}

export interface UndanganEntitas {
  id: string;
  nama: string;
  namaWali: string;
  alamat: string;
  noHp: string;
}

export interface UndanganSantriInfo {
  id: string;
  nama: string;
  kode?: string;
  kategoriUtama: string;
  subKategori: string;
  kelas: string;
  kamar: string;
}

export interface UndanganItem {
  id?: string;
  kode: string;
  kodeQr?: string;
  tipe: 'UNDANGAN' | 'WALI' | 'KELUARGA' | string;
  nama?: string;
  namaPutra?: string;
  namaPutri?: string;
  kategori?: string;
  subKategori?: string;
  instansi?: string;
  alamat?: string;
  noHp?: string;
  entitas?: UndanganEntitas;
  santri?: UndanganSantriInfo;
  kuota: UndanganKuota;
  estimasi: UndanganEstimasi;
}

export type PesertaSantri = UndanganItem;
export type TamuUndangan = UndanganItem;

import { formatGuestDisplayName } from '@/lib/utils';

// Helper Ambil Nama Penerima Tamu Undangan (Format Title Case & "Sekalian")
export function getNamaPenerima(item: any): string {
  return formatGuestDisplayName(item);
}
