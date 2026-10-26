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

// Helper Ambil Nama Penerima Tamu Undangan
export function getNamaPenerima(item: any): string {
  const namaDirect = (item?.nama || item?.entitas?.nama || '').trim();
  const namaPutra = (item?.namaPutra || item?.nama_putra || item?.entitas?.namaPutra || '').trim();
  const namaPutri = (item?.namaPutri || item?.nama_putri || item?.entitas?.namaPutri || '').trim();

  if (namaDirect && namaDirect !== '-' && namaDirect !== 'Tamu Undangan') {
    return namaDirect;
  }

  const hasPutra = namaPutra && namaPutra !== '-';
  const hasPutri = namaPutri && namaPutri !== '-';

  if (hasPutra && hasPutri) {
    return `${namaPutra} & ${namaPutri}`;
  }
  if (hasPutra) {
    return namaPutra;
  }
  if (hasPutri) {
    return namaPutri;
  }

  if (namaDirect && namaDirect !== '-') {
    return namaDirect;
  }

  return 'Tamu Undangan';
}
