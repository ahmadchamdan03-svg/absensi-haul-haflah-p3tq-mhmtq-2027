const fs = require('fs');

const filePath = 'lib/mock-data.ts';
let code = fs.readFileSync(filePath, 'utf8');

// Replace from INITIAL_KELUARGA down to storageKey
const startMarker = '// Buat 549 data keluarga & santri riil dari REAL_SANTRI_LIST';
const endMarker = "private storageKey = 'haflah_store_v52_full_seeded';";

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `// Basis Data Kosong Bersih (Menunggu Pengisian Manual oleh Panitia)
export const INITIAL_KELUARGA: (Keluarga & { kuota: Kuota; estimasi?: EstimasiKehadiran })[] = [];

export const INITIAL_UNDANGAN: (typeof INITIAL_KELUARGA) = [];

export const INITIAL_PEMBELIAN_KUOTA: PembelianKuota[] = [];

export const INITIAL_PRESENSI_LOGS: PresensiLog[] = [];

class DataStore {
  private keluargaList: (Keluarga & { kuota: Kuota; estimasi?: EstimasiKehadiran })[] = [];
  private undanganList: any[] = [];
  private pembelianList: PembelianKuota[] = [];
  private presensiLogs: PresensiLog[] = [];
  private paguTotal = 300;
  private paguTerjual = 0;
  private kuotaTambahanBuka = false;
  private storageKey = 'haflah_store_v70_clean_manual';`;

  code = code.substring(0, startIndex) + replacement + code.substring(endIndex + endMarker.length);

  // Also replace pulihkanDataDefault to reset to empty []
  code = code.replace(
    'this.keluargaList = [...INITIAL_KELUARGA];\n    this.undanganList = [...INITIAL_UNDANGAN];\n    this.presensiLogs = [...INITIAL_PRESENSI_LOGS];',
    'this.keluargaList = [];\n    this.undanganList = [];\n    this.presensiLogs = [];'
  );

  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Successfully emptied mock-data.ts datasets!');
} else {
  console.error('Markers not found:', { startIndex, endIndex });
}
