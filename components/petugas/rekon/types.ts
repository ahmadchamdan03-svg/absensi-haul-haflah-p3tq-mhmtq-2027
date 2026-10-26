export type GolonganUndangan = 'ISTIMEWA' | 'KEHORMATAN' | 'UMUM';

export interface ToastMessage {
  tipe: 'success' | 'error';
  text: string;
}

export interface WalkinFormState {
  golongan: GolonganUndangan;
  nama: string;
  namaPutra: string;
  namaPutri: string;
  kategori: string;
  instansi: string;
  alamat: string;
  noHp: string;
  kuotaDasar: number;
  jalurMasuk: string;
  langsungCheckin: boolean;
}

export const INITIAL_WALKIN_FORM: WalkinFormState = {
  golongan: 'ISTIMEWA',
  nama: '',
  namaPutra: '',
  namaPutri: '',
  kategori: 'VVIP',
  instansi: '',
  alamat: '',
  noHp: '',
  kuotaDasar: 2,
  jalurMasuk: 'Jalur VIP',
  langsungCheckin: true,
};

export interface RekonSearchResultItem {
  tipe: 'SANTRI' | 'UNDANGAN';
  data: any;
}

export interface EditingItemState {
  tipe: 'SANTRI' | 'UNDANGAN' | string;
  id: any;
  kode: string;
  nama: string;
  namaPutra: string;
  namaPutri: string;
  namaWali: string;
  noHp: string;
  alamat: string;
  kelas: string;
  kamar: string;
  kategoriUtama: string;
  subKategori: string;
  kategori: string;
  instansi: string;
  kuotaDasar: number | string;
  kuotaTambahan: number | string;
  kuotaTerpakai: number | string;
  presensiL: number;
  presensiP: number;
  tiketPanggungJatah: number;
  tiketPanggungDiberi: number;
  kartuHitamGoldDiberi: boolean;
  warnaTiket: string;
  statusKonfirmasi: string;
  perkiraanL: number | string;
  perkiraanP: number | string;
  statusWa: string;
  jalurMasuk: string;
  catatanKonfirmasi: string;
}

export function filterRekonSearchResults(
  keyword: string,
  santriList: any[],
  tamuList: any[]
): RekonSearchResultItem[] {
  const q = keyword.trim().toLowerCase();
  if (!q) return [];

  const santriFiltered = santriList
    .filter((s) => {
      return (
        (s.nama && s.nama.toLowerCase().includes(q)) ||
        (s.nama_wali && s.nama_wali.toLowerCase().includes(q)) ||
        (s.kode && s.kode.toLowerCase().includes(q)) ||
        (s.no_hp && s.no_hp.includes(q)) ||
        (s.alamat && s.alamat.toLowerCase().includes(q)) ||
        (s.sub_kategori && s.sub_kategori.toLowerCase().includes(q)) ||
        (s.kelas && s.kelas.toLowerCase().includes(q)) ||
        (s.kamar && s.kamar.toLowerCase().includes(q))
      );
    })
    .map((s) => ({ tipe: 'SANTRI' as const, data: s }));

  const tamuFiltered = tamuList
    .filter((t) => {
      return (
        (t.nama && t.nama.toLowerCase().includes(q)) ||
        (t.nama_putra && t.nama_putra.toLowerCase().includes(q)) ||
        (t.nama_putri && t.nama_putri.toLowerCase().includes(q)) ||
        (t.kode && t.kode.toLowerCase().includes(q)) ||
        (t.no_hp && t.no_hp.includes(q)) ||
        (t.instansi && t.instansi.toLowerCase().includes(q)) ||
        (t.alamat && t.alamat.toLowerCase().includes(q)) ||
        (t.kategori && t.kategori.toLowerCase().includes(q))
      );
    })
    .map((t) => ({ tipe: 'UNDANGAN' as const, data: t }));

  return [...santriFiltered, ...tamuFiltered];
}

export function buildEditingItemState(item: any, pLogs: any[] | null): EditingItemState {
  const isSantri = item.tipe === 'SANTRI';
  const d = item.data;

  const initL = (pLogs || []).reduce((acc: number, curr: any) => acc + (Number(curr.jumlah_l) || 0), 0);
  const initP = (pLogs || []).reduce((acc: number, curr: any) => acc + (Number(curr.jumlah_p) || 0), 0);

  return {
    tipe: item.tipe,
    id: d.id,
    kode: d.kode,
    nama: d.nama || '',
    namaPutra: d.nama_putra || '',
    namaPutri: d.nama_putri || '',
    namaWali: d.nama_wali || '',
    noHp: d.no_hp || '',
    alamat: d.alamat || '',
    kelas: d.kelas || '',
    kamar: d.kamar || '',
    kategoriUtama: d.kategori_utama || 'BIL_GHOIB',
    subKategori: d.sub_kategori || '',
    kategori: d.kategori || 'Tamu Undangan',
    instansi: d.instansi || '',
    kuotaDasar: isSantri
      ? (d.kuota_dasar !== undefined && d.kuota_dasar !== null ? d.kuota_dasar : (d.kategori_utama === 'BIL_GHOIB' ? 4 : 2))
      : ((d.nama_putra && String(d.nama_putra).trim() !== '') ? 1 : 0) +
        ((d.nama_putri && String(d.nama_putri).trim() !== '') ? 1 : 0),
    kuotaTambahan: d.kuota_tambahan || 0,
    kuotaTerpakai: d.kuota_terpakai || 0,
    presensiL: initL,
    presensiP: initP,
    tiketPanggungJatah: d.tiket_panggung_jatah || 0,
    tiketPanggungDiberi: d.tiket_panggung_diberi || 0,
    kartuHitamGoldDiberi: Boolean(d.kartu_hitam_gold_diberi),
    warnaTiket: d.warna_tiket || (isSantri ? (d.kategori_utama === 'BIL_GHOIB' ? 'Hitam Gold' : 'Merah Gold') : 'Merah Gold'),
    statusKonfirmasi: d.status_konfirmasi || 'BELUM',
    perkiraanL: d.perkiraan_l || 0,
    perkiraanP: d.perkiraan_p || 0,
    statusWa: d.status_wa || 'BELUM',
    jalurMasuk: d.jalur_masuk || (isSantri ? 'Gerbang Selatan (Bola Dunia)' : 'Jalur VIP'),
    catatanKonfirmasi: d.catatan_konfirmasi || '',
  };
}

export function buildEditPayload(editingItem: any): {
  payload: Record<string, any>;
  totalPresensiInput: number;
} {
  const isSantri = editingItem.tipe === 'SANTRI';
  const totalPresensiInput = Math.max(0, Number(editingItem.presensiL || 0) + Number(editingItem.presensiP || 0));

  let payload: Record<string, any> = {};

  if (isSantri) {
    // FIX 3: Hanya kolom resmi yang ada pada tabel peserta_santri
    payload = {
      nama: editingItem.nama.trim(),
      nama_wali: editingItem.namaWali.trim() || '-',
      no_hp: editingItem.noHp.trim() || '-',
      alamat: editingItem.alamat.trim() || 'Kediri',
      kelas: editingItem.kelas.trim() || '-',
      kamar: editingItem.kamar.trim() || '-',
      kategori_utama: editingItem.kategoriUtama,
      sub_kategori: editingItem.subKategori.trim() || 'Bil Ghoib',
      kuota_dasar: Math.max(0, Number(editingItem.kuotaDasar)),
      kuota_tambahan: Math.max(0, Number(editingItem.kuotaTambahan)),
      kuota_terpakai: totalPresensiInput,
      warna_tiket: editingItem.warnaTiket,
      status_konfirmasi: editingItem.statusKonfirmasi,
      perkiraan_l: Math.max(0, Number(editingItem.perkiraanL)),
      perkiraan_p: Math.max(0, Number(editingItem.perkiraanP)),
      catatan_konfirmasi: editingItem.catatanKonfirmasi ? editingItem.catatanKonfirmasi.trim() : null,
      updated_at: new Date().toISOString(),
    };
  } else {
    // FIX 3: Hanya kolom resmi yang ada pada tabel tamu_undangan (TANPA kuota_dasar / kuota_tambahan!)
    payload = {
      nama: editingItem.nama.trim(),
      nama_putra: editingItem.namaPutra.trim() || null,
      nama_putri: editingItem.namaPutri.trim() || null,
      instansi: editingItem.instansi.trim() || '-',
      alamat: editingItem.alamat.trim() || '-',
      no_hp: editingItem.noHp.trim() || '-',
      kategori: editingItem.kategori.trim() || 'Tamu Undangan',
      sub_kategori: editingItem.subKategori || 'ISTIMEWA',
      kuota_terpakai: totalPresensiInput,
      warna_tiket: editingItem.warnaTiket,
      jalur_masuk: editingItem.jalurMasuk.trim() || 'Jalur VIP',
      status_konfirmasi: editingItem.statusKonfirmasi,
      perkiraan_l: Math.max(0, Number(editingItem.perkiraanL)),
      perkiraan_p: Math.max(0, Number(editingItem.perkiraanP)),
      catatan_konfirmasi: editingItem.catatanKonfirmasi ? editingItem.catatanKonfirmasi.trim() : null,
      updated_at: new Date().toISOString(),
    };
  }

  // Bersihkan nilai undefined agar tidak menyebabkan error PostgREST
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  return { payload, totalPresensiInput };
}
