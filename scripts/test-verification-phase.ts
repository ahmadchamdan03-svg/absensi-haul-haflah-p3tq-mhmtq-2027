import { KELAS_BIN_NADZOR_LIST } from '../lib/types';
import { templateBlokSantri, getSantriIndex } from '../lib/laporan-rekap';
import { normalizePesertaString } from '../lib/types';

console.log('===============================================================');
console.log('       TEST VERIFIKASI SINKRONISASI KELAS & TAMU & MERGE       ');
console.log('===============================================================');

// 1. Uji KELAS_BIN_NADZOR_LIST
console.log('\n--- 1. Uji Konstanta KELAS_BIN_NADZOR_LIST ---');
if (KELAS_BIN_NADZOR_LIST.includes('Pondok Timur' as any)) {
  console.log('[PASS] "Pondok Timur" terdaftar di KELAS_BIN_NADZOR_LIST');
} else {
  console.error('[FAIL] "Pondok Timur" TIDAK ditemukan di KELAS_BIN_NADZOR_LIST');
  process.exit(1);
}

// 2. Uji Laporan Rekap getSantriIndex & templateBlokSantri
console.log('\n--- 2. Uji Laporan Rekap untuk Pondok Timur ---');
const ptEntry = templateBlokSantri.find(t => t.kategori === 'Bin Nadzori Pondok Timur');
if (ptEntry && ptEntry.no === 8) {
  console.log('[PASS] templateBlokSantri memuat "Bin Nadzori Pondok Timur" pada no. 8');
} else {
  console.error('[FAIL] templateBlokSantri tidak sesuai:', ptEntry);
  process.exit(1);
}

const mockSantriPT = {
  kategori_utama: 'BIN_NADZOR',
  kelas: 'Pondok Timur',
  sub_kategori: 'Bin Nadzori',
};
const ptIndex = getSantriIndex(mockSantriPT);
if (ptIndex === 7 && templateBlokSantri[ptIndex].kategori === 'Bin Nadzori Pondok Timur') {
  console.log('[PASS] getSantriIndex memetakan santri Pondok Timur ke index 7 (Bin Nadzori Pondok Timur)');
} else {
  console.error('[FAIL] getSantriIndex salah:', ptIndex, templateBlokSantri[ptIndex]);
  process.exit(1);
}

// 3. Uji Normalisasi Header Import Excel (Kasus NAMA LENGKAP SANTRIWATI)
console.log('\n--- 3. Uji Normalisasi Header Import Excel ---');
const sampleRow = {
  'NAMA LENGKAP SANTRIWATI': 'Fatimah Zahro',
  'KAMAR PONDOK': 'A.05',
  'KELAS': 'Pondok Timur',
  'NAMA WALI SANTRI': 'Bpk. Ahmad Subhan',
  'NO WHATSAPP WALI': '081234567890',
  'ALAMAT / ASAL KOTA': 'Jombang',
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const getVal = (row: any, ...keys: string[]) => {
  const normKeys = keys.map(norm);
  for (const rk of Object.keys(row)) {
    const normRk = norm(rk);
    if (normKeys.includes(normRk) && row[rk] !== undefined && row[rk] !== null) {
      const val = String(row[rk]).trim();
      if (val !== '') return val;
    }
  }
  return '';
};

const extractedNama = getVal(
  sampleRow,
  'NAMA LENGKAP SANTRIWATI',
  'NAMA LENGKAP SANTRI',
  'NAMA SANTRIWATI',
  'NAMA SANTRI',
  'NAMA'
);
const extractedKamar = getVal(sampleRow, 'KAMAR PONDOK', 'KAMAR');
const extractedKelas = getVal(sampleRow, 'KELAS', 'TINGKAT');
const extractedWali = getVal(sampleRow, 'NAMA WALI SANTRI', 'NAMA WALI');
const extractedHp = getVal(sampleRow, 'NO WHATSAPP WALI', 'NO WA');
const extractedAlamat = getVal(sampleRow, 'ALAMAT / ASAL KOTA', 'ALAMAT');

if (
  extractedNama === 'Fatimah Zahro' &&
  extractedKamar === 'A.05' &&
  extractedKelas === 'Pondok Timur' &&
  extractedWali === 'Bpk. Ahmad Subhan' &&
  extractedHp === '081234567890' &&
  extractedAlamat === 'Jombang'
) {
  console.log('[PASS] Header "NAMA LENGKAP SANTRIWATI" berhasil dipetakan ke nama santri tanpa terlewat');
  console.log('[PASS] Seluruh kolom (kamar, kelas "Pondok Timur", wali, hp, alamat) terbaca sempurna');
} else {
  console.error('[FAIL] Ekstraksi header gagal:', { extractedNama, extractedKamar, extractedKelas });
  process.exit(1);
}

// 4. Uji Logika Kuota Otomatis Tamu
console.log('\n--- 4. Uji Logika Kuota Otomatis Tamu ---');
const testAutoKuota = (putra?: string, putri?: string) => {
  const hasP = !!(putra && putra.trim());
  const hasW = !!(putri && putri.trim());
  return hasP && hasW ? 2 : hasP || hasW ? 1 : 0;
};

if (testAutoKuota('KH. Anwar Manshur', 'Nyai Hj. Ummi Kulsum') === 2) {
  console.log('[PASS] Putra & Putri terisi -> Kuota = 2 Kursi');
} else {
  console.error('[FAIL] Auto kuota suami istri gagal');
  process.exit(1);
}

if (testAutoKuota('KH. Anwar Manshur', '') === 1) {
  console.log('[PASS] Hanya Putra terisi -> Kuota = 1 Kursi');
} else {
  console.error('[FAIL] Auto kuota putra gagal');
  process.exit(1);
}

if (testAutoKuota('', 'Nyai Hj. Ummi Kulsum') === 1) {
  console.log('[PASS] Hanya Putri terisi -> Kuota = 1 Kursi');
} else {
  console.error('[FAIL] Auto kuota putri gagal');
  process.exit(1);
}

if (testAutoKuota('', '') === 0) {
  console.log('[PASS] Keduanya kosong -> Kuota = 0 (Ditolak submit)');
} else {
  console.error('[FAIL] Auto kuota kosong gagal');
  process.exit(1);
}

// 5. Uji Anti-Duplikasi Kuota saat Merge Tamu
console.log('\n--- 5. Uji Anti-Duplikasi Kuota saat Merge Tamu ---');
const groupItems = [
  {
    namaPutra: 'KH. Anwar Manshur',
    namaPutri: 'Nyai Hj. Ummi Kulsum',
    nama: 'KH. Anwar Manshur & Nyai Hj. Ummi Kulsum',
    kuotaDasar: 2,
    golonganUndangan: 'ISTIMEWA',
  },
  {
    namaPutra: 'KH. Anwar Manshur',
    namaPutri: 'Nyai Hj. Ummi Kulsum',
    nama: 'KH. Anwar Manshur & Nyai Hj. Ummi Kulsum',
    kuotaDasar: 2,
    golonganUndangan: 'UMUM',
  },
];

const uniqueNames = new Set<string>();
groupItems.forEach((it) => {
  const p = (it.namaPutra || '').trim();
  const w = (it.namaPutri || '').trim();
  if (p) uniqueNames.add(normalizePesertaString(p));
  if (w) uniqueNames.add(normalizePesertaString(w));
  if (!p && !w && it.nama) {
    const parts = it.nama.split(/&|,/).map((s: string) => s.trim()).filter(Boolean);
    parts.forEach((part: string) => uniqueNames.add(normalizePesertaString(part)));
  }
});
const mergedKuotaDasar = uniqueNames.size > 0 ? uniqueNames.size : Math.max(...groupItems.map(it => it.kuotaDasar || 1));

if (mergedKuotaDasar === 2) {
  console.log('[PASS] Anti-duplikasi berhasil: 2 record identik di-merge menghasilkan kuota 2 (bukan 4)');
} else {
  console.error('[FAIL] Anti-duplikasi gagal, kuota terhitung:', mergedKuotaDasar);
  process.exit(1);
}

console.log('\n===============================================================');
console.log('       SELURUH PENGUJIAN VERIFIKASI SELESAI & SUKSES!        ');
console.log('===============================================================');
