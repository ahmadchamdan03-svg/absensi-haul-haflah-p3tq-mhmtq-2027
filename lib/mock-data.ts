// =====================================================================
// DATA STORE & SIMULASI ATOMIK (HAUL & HAFLAH P3TQ - MHMTQ v4.2)
// Basis Data 549 Santri Riil (64 Bil Ghoib + 159 Bin Nadzori + 326 Tamatan)
// Pondok Pesantren Putri Tahfizhil Qur-an & MHMTQ Lirboyo Kediri
// Alamat: Jl. HM. Winarto, Campurejo, Kec. Mojoroto, Kabupaten Kediri 64117
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
} from './types';
import { REAL_SANTRI_LIST, MasterSantri } from './santri-data';
import { MASTER_UNDANGAN_LIST, MasterUndangan } from './undangan-data';

export const INITIAL_EVENT: EventConfig = {
  id: 'e0000000-0000-0000-0000-000000000001',
  nama: 'Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.',
  slug: 'HFL27',
  waktuMulai: '2027-01-02T06:30:00+07:00',
  tempat: 'Aula Muktamar Pondok Pesantren Lirboyo Kediri',
  kunciHmac: 'p3tq_secret_hmac_key_2027',
  linkGrupWa: '',
  kebijakanKuota: {
    lintasKategori: 'MAX',
    hangusMenit: 300,
    bonusSaudara: null,
  },
  status: 'AKTIF',
};

// Buat 549 data keluarga & santri riil dari REAL_SANTRI_LIST (64 Bil Ghoib + 159 Bin Nadzori + 326 Tamatan)
export const INITIAL_KELUARGA: (Keluarga & { kuota: Kuota; estimasi?: EstimasiKehadiran })[] =
  REAL_SANTRI_LIST.map((s: MasterSantri, idx: number) => {
    const kelId = `k_${s.code}`;
    const santriId = `s_${s.code}`;
    const kuotaId = `q_${s.code}`;

    // Contoh kedatangan bertahap awal representatif untuk demo live monitoring
    let demoTerpakai = 0;
    let demoPanggungDiberi = 0;

    if (idx === 0) {
      // SH0001 (Bil Ghoib) - 1 Wali Perempuan hadir (Tiket Panggung)
      demoTerpakai = 1;
      demoPanggungDiberi = 1;
    } else if (idx === 1) {
      // SH0002 (Bil Ghoib) - 2 Hadir
      demoTerpakai = 2;
    } else if (idx === 2) {
      // SH0003 (Bil Ghoib) - 3 Hadir (1 Panggung + 2 Reguler)
      demoTerpakai = 3;
      demoPanggungDiberi = 1;
    } else if (idx === 64) {
      // SH0065 (Bin Nadzori) - 2 Hadir
      demoTerpakai = 2;
    } else if (idx === 65) {
      // SH0066 (Bin Nadzori) - 2 Hadir
      demoTerpakai = 2;
    } else if (idx === 223) {
      // SH0224 (Tamatan III Aliyah) - 2 Hadir
      demoTerpakai = 2;
    } else if (idx === 224) {
      // SH0225 (Tamatan III Aliyah) - 2 Hadir
      demoTerpakai = 2;
    } else if (idx === 225) {
      // SH0226 (Tamatan III Aliyah) - 2 Hadir
      demoTerpakai = 2;
    }

    return {
      id: kelId,
      kode: s.code,
      namaWali: s.namaWali,
      noHp: s.noHp,
      alamat: s.alamat || 'Kediri',
      santri: [
        {
          id: santriId,
          keluargaId: kelId,
          nis: s.code,
          nama: s.nama,
          unit: 'P3TQ',
          kelas: s.kelas,
          kamar: s.kamar || '',
          kategoriUtama: s.kategoriUtama,
          subKategori: s.subKategori,
        },
      ],
      kuota: {
        id: kuotaId,
        eventId: INITIAL_EVENT.id,
        pemilikTipe: 'KELUARGA',
        pemilikId: kelId,
        kodeQr: s.code,
        kuotaDasar: s.kuotaDasar,
        kuotaTambahan: idx === 1 ? 1 : 0,
        terpakai: demoTerpakai,
        tiketPanggungJatah: s.tiketPanggungJatah || 0,
        tiketPanggungDiberi: demoPanggungDiberi,
        hangus: false,
      },
      estimasi: {
        kuotaId,
        perkiraanL: idx % 3 === 0 ? 1 : 0,
        perkiraanP: idx % 3 === 0 ? 1 : 0,
        statusHadir: 'HADIR',
        statusKonfirmasi: (idx % 3 === 0 ? 'SUDAH' : 'BELUM') as 'SUDAH' | 'BELUM',
        diisiAt: idx % 3 === 0 ? '2026-11-20T10:00:00Z' : '',
        diubahOleh: idx % 3 === 0 ? 'WALI_MANDIRI' : undefined,
      },
    };
  });

// Buat 70 Tamu Undangan Khusus dari MASTER_UNDANGAN_LIST (25 Penguji Al-Qur'an + 45 Asatidz Purna Bakti & Masyaikh)
export const INITIAL_UNDANGAN = MASTER_UNDANGAN_LIST.map((u: MasterUndangan, idx: number) => {
  const undId = `u_${u.code}`;
  const kuotaId = `qu_${u.code}`;

  // Beberapa tamu kehormatan disimulasikan tiba untuk demo monitoring VIP realtime
  let demoTerpakai = 0;
  if (idx === 0) demoTerpakai = 2; // KH. Abdullah Faqih (Penguji)
  else if (idx === 6) demoTerpakai = 2; // Nyai Hj. Nihayah (Penguji Huffadh Putri)
  else if (idx === 25) demoTerpakai = 2; // KH. M. Anwar Manshur (Pengasuh Utama PP. Lirboyo)
  else if (idx === 27) demoTerpakai = 2; // KH. Nurul Huda Djazuli (Masyayikh PP. Al-Falah Ploso)
  else if (idx === 37) demoTerpakai = 2; // Nyai Hj. Azimatul Qudsiyyah (Asatidzah Purna Bakti)
  else if (idx === 38) demoTerpakai = 2; // Nyai Hj. Azizah Ma'shoem (Lasem)

  return {
    id: undId,
    kode: u.code,
    kategori: u.kategori,
    subKategori: u.subKategori,
    nama: u.nama,
    instansi: u.instansi,
    polaKuota: u.kuotaDasar,
    kuota: {
      id: kuotaId,
      eventId: INITIAL_EVENT.id,
      pemilikTipe: 'UNDANGAN' as const,
      pemilikId: undId,
      kodeQr: u.code,
      kuotaDasar: u.kuotaDasar,
      kuotaTambahan: 0,
      terpakai: demoTerpakai,
      tiketPanggungJatah: 0,
      tiketPanggungDiberi: 0,
      hangus: false,
    },
  };
});

export const INITIAL_PEMBELIAN_KUOTA: PembelianKuota[] = [
  {
    id: 'b001',
    eventId: INITIAL_EVENT.id,
    keluargaId: 'k_SH0002',
    jumlah: 1,
    totalBayar: 80000,
    buktiUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
    status: 'DIVERIFIKASI',
    kedaluwarsaAt: '2026-12-01T12:00:00Z',
    buktiUploadedAt: '2026-12-01T08:30:00Z',
    batasVerifikasiAt: '2026-12-01T14:30:00Z',
    autoApproveAt: '2026-12-01T20:30:00Z',
    catatanPanitia: 'Transfer valid via BRI 320701010266508 (Diverifikasi manual oleh panitia)',
    createdAt: '2026-12-01T08:00:00Z',
    diputusAt: '2026-12-01T09:30:00Z',
  },
  {
    id: 'b002',
    eventId: INITIAL_EVENT.id,
    keluargaId: 'k_SH0003',
    jumlah: 1,
    totalBayar: 80000,
    buktiUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
    status: 'MENUNGGU_VERIFIKASI',
    kedaluwarsaAt: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    buktiUploadedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    batasVerifikasiAt: new Date(Date.now() + 4 * 3600 * 1000).toISOString(), // Target SLA 6 jam panitia (sisa 4 jam)
    autoApproveAt: new Date(Date.now() + 10 * 3600 * 1000).toISOString(), // Batas toleransi auto-approve 12 jam (sisa 10 jam)
    catatanPanitia: 'Wali santri sudah upload bukti transfer, menunggu verifikasi manual panitia (Target 6 Jam)',
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: 'b003',
    eventId: INITIAL_EVENT.id,
    keluargaId: 'k_SH0065',
    jumlah: 2,
    totalBayar: 160000,
    status: 'DIPESAN',
    kedaluwarsaAt: new Date(Date.now() + 5 * 3600 * 1000).toISOString(), // Terkunci 6 jam (sisa 5 jam untuk transfer & upload)
    catatanPanitia: 'Pesanan terkunci 6 jam menunggu transfer & upload bukti oleh wali santri',
    createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  },
  {
    id: 'b004',
    eventId: INITIAL_EVENT.id,
    keluargaId: 'k_SH0224',
    jumlah: 1,
    totalBayar: 80000,
    buktiUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
    status: 'DIVERIFIKASI',
    autoApprovedBySystem: true,
    kedaluwarsaAt: '2026-11-20T12:00:00Z',
    buktiUploadedAt: '2026-11-20T06:00:00Z',
    batasVerifikasiAt: '2026-11-20T12:00:00Z',
    autoApproveAt: '2026-11-20T18:00:00Z',
    catatanPanitia: 'Otomatis Berhasil oleh Sistem (Batas Waktu Verifikasi Panitia 12 Jam Terlampaui)',
    createdAt: '2026-11-20T05:30:00Z',
    diputusAt: '2026-11-20T18:00:00Z',
  },
];

export const INITIAL_PRESENSI_LOGS: PresensiLog[] = [
  {
    id: 13,
    eventId: INITIAL_EVENT.id,
    kuotaId: 'q_SH0226',
    hasil: 'SUKSES',
    jumlahL: 2,
    jumlahP: 0,
    tiketPanggung: false,
    jumlahBalita: 0,
    jalur: 'BARAT',
    panitiaId: 'panitia-putra',
    nonce: 'nonce-13',
    serverTime: '08:45:10',
    catatan: 'Tamatan III Aliyah - Jalur Barat Putra',
  },
  {
    id: 12,
    eventId: INITIAL_EVENT.id,
    kuotaId: 'qu_UND0139',
    hasil: 'SUKSES',
    jumlahL: 0,
    jumlahP: 2,
    tiketPanggung: false,
    jumlahBalita: 0,
    jalur: 'TIMUR',
    panitiaId: 'panitia-putri',
    nonce: 'nonce-12',
    serverTime: '08:42:00',
    catatan: 'Tamu VIP: Nyai Hj. Azizah Ma\'shoem (Lasem)',
  },
  {
    id: 11,
    eventId: INITIAL_EVENT.id,
    kuotaId: 'q_SH0225',
    hasil: 'SUKSES',
    jumlahL: 1,
    jumlahP: 1,
    tiketPanggung: false,
    jumlahBalita: 0,
    jalur: 'BARAT',
    panitiaId: 'panitia-putra',
    nonce: 'nonce-11',
    serverTime: '08:37:15',
    catatan: 'Tamatan III Aliyah',
  },
  {
    id: 10,
    eventId: INITIAL_EVENT.id,
    kuotaId: 'qu_UND0138',
    hasil: 'SUKSES',
    jumlahL: 0,
    jumlahP: 2,
    tiketPanggung: false,
    jumlahBalita: 0,
    jalur: 'TIMUR',
    panitiaId: 'panitia-putri',
    nonce: 'nonce-10',
    serverTime: '08:33:20',
    catatan: 'Tamu VIP: Nyai Hj. Azimatul Qudsiyyah',
  },
  {
    id: 9,
    eventId: INITIAL_EVENT.id,
    kuotaId: 'q_SH0003',
    hasil: 'SUKSES',
    jumlahL: 1,
    jumlahP: 2,
    tiketPanggung: true,
    jumlahBalita: 1,
    jalur: 'TIMUR',
    panitiaId: 'panitia-putri',
    nonce: 'nonce-9',
    serverTime: '08:28:40',
    catatan: 'Santri Bil Ghoib + Penyerahan Tiket Emas Panggung',
  },
  {
    id: 8,
    eventId: INITIAL_EVENT.id,
    kuotaId: 'qu_UND0128',
    hasil: 'SUKSES',
    jumlahL: 2,
    jumlahP: 0,
    tiketPanggung: false,
    jumlahBalita: 0,
    jalur: 'BARAT',
    panitiaId: 'panitia-putra',
    nonce: 'nonce-8',
    serverTime: '08:24:10',
    catatan: 'Tamu VIP: KH. Nurul Huda Djazuli (Ploso)',
  },
  {
    id: 7,
    eventId: INITIAL_EVENT.id,
    kuotaId: 'q_SH0224',
    hasil: 'SUKSES',
    jumlahL: 2,
    jumlahP: 0,
    tiketPanggung: false,
    jumlahBalita: 0,
    jalur: 'BARAT',
    panitiaId: 'panitia-putra',
    nonce: 'nonce-7',
    serverTime: '08:20:05',
    catatan: 'Tamatan III Aliyah Bagian A',
  },
  {
    id: 6,
    eventId: INITIAL_EVENT.id,
    kuotaId: 'qu_UND0126',
    hasil: 'SUKSES',
    jumlahL: 2,
    jumlahP: 0,
    tiketPanggung: false,
    jumlahBalita: 0,
    jalur: 'BARAT',
    panitiaId: 'panitia-putra',
    nonce: 'nonce-6',
    serverTime: '08:15:30',
    catatan: 'Tamu VIP: KH. M. Anwar Manshur (Lirboyo)',
  },
  {
    id: 5,
    eventId: INITIAL_EVENT.id,
    kuotaId: 'qu_UND0107',
    hasil: 'SUKSES',
    jumlahL: 0,
    jumlahP: 2,
    tiketPanggung: false,
    jumlahBalita: 0,
    jalur: 'TIMUR',
    panitiaId: 'panitia-putri',
    nonce: 'nonce-5',
    serverTime: '08:11:50',
    catatan: 'Tamu VIP: Nyai Hj. Nihayah (Penguji Huffadh)',
  },
  {
    id: 4,
    eventId: INITIAL_EVENT.id,
    kuotaId: 'q_SH0065',
    hasil: 'SUKSES',
    jumlahL: 0,
    jumlahP: 2,
    tiketPanggung: false,
    jumlahBalita: 0,
    jalur: 'TIMUR',
    panitiaId: 'panitia-putri',
    nonce: 'nonce-4',
    serverTime: '08:06:12',
    catatan: 'Bin Nadzori - Jalur Putri',
  },
  {
    id: 3,
    eventId: INITIAL_EVENT.id,
    kuotaId: 'qu_UND0101',
    hasil: 'SUKSES',
    jumlahL: 2,
    jumlahP: 0,
    tiketPanggung: false,
    jumlahBalita: 0,
    jalur: 'BARAT',
    panitiaId: 'panitia-putra',
    nonce: 'nonce-3',
    serverTime: '08:02:45',
    catatan: 'Tamu VIP: KH. Abdullah Faqih (Penguji LPTQ)',
  },
  {
    id: 2,
    eventId: INITIAL_EVENT.id,
    kuotaId: 'q_SH0002',
    hasil: 'SUKSES',
    jumlahL: 1,
    jumlahP: 1,
    tiketPanggung: false,
    jumlahBalita: 0,
    jalur: 'BARAT',
    panitiaId: 'panitia-putra',
    nonce: 'nonce-2',
    serverTime: '07:55:00',
    catatan: 'Santri Bil Ghoib',
  },
  {
    id: 1,
    eventId: INITIAL_EVENT.id,
    kuotaId: 'q_SH0001',
    hasil: 'SUKSES',
    jumlahL: 0,
    jumlahP: 1,
    tiketPanggung: true,
    jumlahBalita: 0,
    jalur: 'TIMUR',
    panitiaId: 'panitia-putri',
    nonce: 'nonce-1',
    serverTime: '07:41:00',
    catatan: 'Kedatangan bertahap pertama + Tiket Panggung Emas',
  },
];

class DataStore {
  private keluargaList: (Keluarga & { kuota: Kuota; estimasi?: EstimasiKehadiran })[] = [];
  private undanganList: (typeof INITIAL_UNDANGAN) = [];
  private pembelianList: PembelianKuota[] = [];
  private presensiLogs: PresensiLog[] = [];
  private paguTotal = 300;
  private paguTerjual = 0;
  private kuotaTambahanBuka = false;
  private storageKey = 'haflah_store_v51_all_cleared';

  private isSyncing = false;
  private lastCloudSync = 0;

  constructor() {
    this.loadFromStorage();
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.syncCloud();
      }, 100);
    }
  }

  public applyState(state: any) {
    if (!state || typeof state !== 'object') return;
    if (Array.isArray(state.keluargaList)) {
      this.keluargaList = state.keluargaList;
    }
    if (Array.isArray(state.undanganList)) {
      this.undanganList = state.undanganList;
    }
    if (Array.isArray(state.presensiLogs)) {
      this.presensiLogs = state.presensiLogs;
    }
    if (Array.isArray(state.pembelianList)) {
      this.pembelianList = state.pembelianList;
    }
    if (typeof state.paguTerjual === 'number') {
      this.paguTerjual = state.paguTerjual;
    }
    if (typeof state.kuotaTambahanBuka === 'boolean') {
      this.kuotaTambahanBuka = state.kuotaTambahanBuka;
    }
    if (typeof window !== 'undefined') {
      try {
        const payload = {
          keluargaList: this.keluargaList,
          undanganList: this.undanganList,
          pembelianList: this.pembelianList,
          presensiLogs: this.presensiLogs,
          paguTerjual: this.paguTerjual,
          kuotaTambahanBuka: this.kuotaTambahanBuka,
        };
        localStorage.setItem(this.storageKey, JSON.stringify(payload));
      } catch (e) {}
    }
    this.evaluasiBatasWaktu();
  }

  public async syncCloud(forceAction?: 'RESET' | 'PUSH' | 'MERGE'): Promise<boolean> {
    if (typeof window === 'undefined' || this.isSyncing) return false;
    this.isSyncing = true;
    try {
      const localState = {
        keluargaList: this.keluargaList,
        undanganList: this.undanganList,
        pembelianList: this.pembelianList,
        presensiLogs: this.presensiLogs,
        paguTerjual: this.paguTerjual,
        kuotaTambahanBuka: this.kuotaTambahanBuka,
      };

      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: forceAction || 'MERGE',
          localState,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.ok && json.state) {
          this.applyState(json.state);
          this.lastCloudSync = Date.now();
          return true;
        }
      }
    } catch (e) {
      // Offline fallback
    } finally {
      this.isSyncing = false;
    }
    return false;
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      try {
        const payload = {
          keluargaList: this.keluargaList,
          undanganList: this.undanganList,
          pembelianList: this.pembelianList,
          presensiLogs: this.presensiLogs,
          paguTerjual: this.paguTerjual,
          kuotaTambahanBuka: this.kuotaTambahanBuka,
        };
        localStorage.setItem(this.storageKey, JSON.stringify(payload));
      } catch (e) {
        console.error('Error saving store to localStorage', e);
      }
      this.syncCloud('MERGE');
    }
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed.keluargaList)) {
              this.keluargaList = parsed.keluargaList;
            }
            if (Array.isArray(parsed.undanganList)) {
              this.undanganList = parsed.undanganList;
            }
            if (Array.isArray(parsed.pembelianList)) {
              this.pembelianList = parsed.pembelianList;
            }
            if (Array.isArray(parsed.presensiLogs)) {
              this.presensiLogs = parsed.presensiLogs;
            }
            this.paguTerjual = parsed.paguTerjual ?? this.paguTerjual;
            this.kuotaTambahanBuka = parsed.kuotaTambahanBuka ?? false;
            this.evaluasiBatasWaktu();
            return;
          }
        }
      } catch (e) {
        console.error('Error loading store from localStorage', e);
      }
    }
    this.evaluasiBatasWaktu();
  }

  public tambahPeserta(input: {
    nama: string;
    kategoriUtama: 'BIL_GHOIB' | 'BIN_NADZOR' | 'TAMATAN';
    bagianTamatan?: string;
    subKategori?: string;
    kelas?: string;
    kamar?: string;
    namaWali: string;
    noHp: string;
    alamat: string;
  }) {
    let maxNum = 0;
    for (const k of this.keluargaList) {
      if (k.kode.startsWith('SH')) {
        const num = parseInt(k.kode.replace('SH', ''), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
    const nextCode = `SH${String(maxNum + 1).padStart(4, '0')}`;
    const kelId = `k_${nextCode}`;
    const santriId = `s_${nextCode}`;
    const kuotaId = `q_${nextCode}`;

    const kuotaDasar = input.kategoriUtama === 'BIL_GHOIB' ? 4 : 2;
    const tiketPanggung = input.kategoriUtama === 'BIL_GHOIB' ? 1 : 0;

    let resolvedSub = input.subKategori;
    let resolvedKelas = input.kelas;
    if (input.kategoriUtama === 'TAMATAN') {
      const bagian = input.bagianTamatan || 'A.01';
      resolvedSub = `3 ALY ${bagian}`;
      resolvedKelas = `3 ALY ${bagian}`;
    } else if (input.kategoriUtama === 'BIL_GHOIB') {
      resolvedSub = 'Bil Ghoib';
      resolvedKelas = 'Bil Ghoib';
    } else {
      resolvedSub = 'Bin Nadzori';
      resolvedKelas = 'Bin Nadzori';
    }

    const newKeluarga: any = {
      id: kelId,
      kode: nextCode,
      namaWali: input.namaWali,
      noHp: input.noHp,
      alamat: input.alamat || 'Kediri',
      santri: [
        {
          id: santriId,
          keluargaId: kelId,
          nis: nextCode,
          nama: input.nama,
          unit: 'P3TQ',
          kelas: resolvedKelas,
          kamar: input.kamar || '',
          kategoriUtama: input.kategoriUtama,
          subKategori: resolvedSub,
        },
      ],
      kuota: {
        id: kuotaId,
        eventId: INITIAL_EVENT.id,
        pemilikTipe: 'KELUARGA',
        pemilikId: kelId,
        kodeQr: nextCode,
        kuotaDasar: kuotaDasar,
        kuotaTambahan: 0,
        terpakai: 0,
        tiketPanggungJatah: tiketPanggung,
        tiketPanggungDiberi: 0,
        hangus: false,
      },
      estimasi: {
        kuotaId,
        perkiraanL: 1,
        perkiraanP: 1,
        statusHadir: 'HADIR',
        diisiAt: new Date().toISOString(),
      },
    };

    this.keluargaList.push(newKeluarga);
    this.saveToStorage();
    return { ok: true, code: nextCode, peserta: newKeluarga };
  }

  public hapusPeserta(kode: string) {
    const cleanKode = kode.trim().toUpperCase();
    const idx = this.keluargaList.findIndex((k) => k.kode.toUpperCase() === cleanKode);
    if (idx !== -1) {
      const removed = this.keluargaList.splice(idx, 1);
      this.saveToStorage();
      return { ok: true, removed: removed[0], tipe: 'KELUARGA' };
    }
    const undIdx = this.undanganList.findIndex((u) => u.kode.toUpperCase() === cleanKode);
    if (undIdx !== -1) {
      const removed = this.undanganList.splice(undIdx, 1);
      this.saveToStorage();
      return { ok: true, removed: removed[0], tipe: 'UNDANGAN' };
    }
    return { ok: false, pesan: `Peserta dengan kode ${kode} tidak ditemukan.` };
  }

  public hapusSemuaPeserta(scope: 'SANTRI' | 'UNDANGAN' | 'SEMUA' = 'SEMUA') {
    if (scope === 'SANTRI') {
      const count = this.keluargaList.length;
      this.keluargaList = [];
      this.presensiLogs = this.presensiLogs.filter((log) =>
        this.undanganList.some((u) => u.kuota.id === log.kuotaId || `qu_${u.kode}` === log.kuotaId || u.id === log.kuotaId)
      );
      this.saveToStorage();
      return { ok: true, count, pesan: `Seluruh ${count} data santri peserta berhasil dihapus.` };
    } else if (scope === 'UNDANGAN') {
      const count = this.undanganList.length;
      this.undanganList = [];
      this.presensiLogs = this.presensiLogs.filter((log) =>
        this.keluargaList.some((k) => k.kuota.id === log.kuotaId || `q_${k.kode}` === log.kuotaId || k.id === log.kuotaId)
      );
      this.saveToStorage();
      return { ok: true, count, pesan: `Seluruh ${count} data tamu undangan berhasil dihapus.` };
    } else {
      const countTotal = this.keluargaList.length + this.undanganList.length;
      this.keluargaList = [];
      this.undanganList = [];
      this.presensiLogs = [];
      this.saveToStorage();
      return { ok: true, count: countTotal, pesan: `Seluruh ${countTotal} data peserta santri dan tamu undangan berhasil dihapus.` };
    }
  }

  public hapusSemuaUndangan() {
    return this.hapusSemuaPeserta('UNDANGAN');
  }

  public pulihkanDataDefault() {
    this.keluargaList = [...INITIAL_KELUARGA];
    this.undanganList = [...INITIAL_UNDANGAN];
    this.presensiLogs = [...INITIAL_PRESENSI_LOGS];
    this.paguTerjual = 1;
    this.saveToStorage();
    return { ok: true, pesan: 'Data bawaan 549 santri dan 70 tamu undangan berhasil dipulihkan.' };
  }

  public editPeserta(
    kode: string,
    data: {
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
    }
  ) {
    const cleanKode = kode.trim().toUpperCase();
    const kel = this.keluargaList.find((k) => k.kode.toUpperCase() === cleanKode);
    if (kel) {
      if (data.namaWali !== undefined) kel.namaWali = data.namaWali;
      if (data.noHp !== undefined) kel.noHp = data.noHp;
      if (data.alamat !== undefined) kel.alamat = data.alamat;
      if (kel.santri && kel.santri[0]) {
        if (data.nama !== undefined) kel.santri[0].nama = data.nama;
        if (data.kamar !== undefined) (kel.santri[0] as any).kamar = data.kamar;
        if (data.subKategori !== undefined) kel.santri[0].subKategori = data.subKategori;
        if (data.kelas !== undefined) kel.santri[0].kelas = data.kelas;
        if (data.kategoriUtama !== undefined) {
          kel.santri[0].kategoriUtama = data.kategoriUtama;
          const kDasar = data.kategoriUtama === 'BIL_GHOIB' ? 4 : 2;
          const tPanggung = data.kategoriUtama === 'BIL_GHOIB' ? 1 : 0;
          kel.kuota.kuotaDasar = kDasar;
          kel.kuota.tiketPanggungJatah = tPanggung;
        }
      }
      if (data.kuotaDasar !== undefined) {
        kel.kuota.kuotaDasar = data.kuotaDasar;
      }
      this.saveToStorage();
      return { ok: true, kel };
    }

    const und = this.undanganList.find((u) => u.kode.toUpperCase() === cleanKode);
    if (und) {
      if (data.namaPutra !== undefined) (und as any).namaPutra = data.namaPutra;
      if (data.namaPutri !== undefined) (und as any).namaPutri = data.namaPutri;

      if (data.nama !== undefined) {
        und.nama = data.nama;
      } else if (data.namaPutra !== undefined || data.namaPutri !== undefined) {
        const p = data.namaPutra !== undefined ? data.namaPutra : ((und as any).namaPutra || '');
        const w = data.namaPutri !== undefined ? data.namaPutri : ((und as any).namaPutri || '');
        if (p && w) und.nama = `${p} & ${w}`;
        else if (p) und.nama = p;
        else if (w) und.nama = w;
      }

      if (data.kategori !== undefined) und.kategori = data.kategori;
      else if (data.subKategori !== undefined) und.kategori = data.subKategori;

      if (data.alamat !== undefined && data.instansi !== undefined) {
        (und as any).alamat = data.alamat;
        und.instansi = data.instansi;
      } else if (data.alamat !== undefined) {
        (und as any).alamat = data.alamat;
        und.instansi = data.alamat;
      } else if (data.instansi !== undefined) {
        und.instansi = data.instansi;
        (und as any).alamat = data.instansi;
      }
      if (data.golongan !== undefined) (und as any).golongan = data.golongan;
      if (data.kuotaDasar !== undefined) {
        und.polaKuota = data.kuotaDasar;
        und.kuota.kuotaDasar = data.kuotaDasar;
      }
      this.saveToStorage();
      return { ok: true, und };
    }

    return { ok: false, pesan: `Peserta dengan kode ${kode} tidak ditemukan.` };
  }

  public rekonsiliasiKoreksiPeserta(input: {
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
  }) {
    const cleanKode = input.kode.trim().toUpperCase();
    const item = this.findByKode(cleanKode);
    if (!item) {
      return { ok: false, pesan: `Peserta dengan kode ${input.kode} tidak ditemukan.` };
    }

    const { tipe, entitas, kuota, santri } = item;

    // 1. Koreksi Status Kehadiran
    if (input.statusKehadiran === 'BELUM_HADIR') {
      kuota.terpakai = 0;
      kuota.tiketPanggungDiberi = 0;
      // Bersihkan presensi logs untuk kode ini
      this.presensiLogs = this.presensiLogs.filter(
        (l) => l.kuotaId !== kuota.id && l.kuotaId !== `q_${cleanKode}` && l.kuotaId !== `qu_${cleanKode}`
      );
      if (item.estimasi) {
        item.estimasi.statusHadir = 'BELUM';
      }
    } else if (input.statusKehadiran === 'HADIR') {
      const jL = input.jumlahL !== undefined ? input.jumlahL : 1;
      const jP = input.jumlahP !== undefined ? input.jumlahP : 1;
      const totHadir = jL + jP;
      kuota.terpakai = totHadir;

      // Jika Bil Ghoib dan ada jatah panggung
      if (kuota.tiketPanggungJatah > 0) {
        kuota.tiketPanggungDiberi = 1;
      }

      // Catat log presensi rekonsiliasi
      const logBaru: PresensiLog = {
        id: Date.now(),
        eventId: INITIAL_EVENT.id,
        kuotaId: kuota.id,
        hasil: 'SUKSES',
        jalur: 'REKONSILIASI',
        panitiaId: input.petugas || 'panitia-rekon',
        jumlahL: jL,
        jumlahP: jP,
        jumlahBalita: 0,
        tiketPanggung: kuota.tiketPanggungDiberi > 0,
        nonce: `nonce-rekon-${Date.now()}`,
        serverTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      // Hapus log lama jika ada, lalu push log baru
      this.presensiLogs = this.presensiLogs.filter(
        (l) => l.kuotaId !== kuota.id && l.kuotaId !== `q_${cleanKode}` && l.kuotaId !== `qu_${cleanKode}`
      );
      this.presensiLogs.unshift(logBaru);
      if (item.estimasi) {
        item.estimasi.statusHadir = 'HADIR';
      }
    }

    // 2. Koreksi Kategori Santri (khusus KELUARGA)
    if (tipe === 'KELUARGA' && santri && input.kategoriUtama) {
      santri.kategoriUtama = input.kategoriUtama;
      if (input.kategoriUtama === 'BIL_GHOIB') {
        santri.subKategori = input.subKategori || 'Bil Ghoib';
        santri.kelas = input.kelas || 'Bil Ghoib';
        kuota.kuotaDasar = 4;
        kuota.tiketPanggungJatah = 1;
      } else if (input.kategoriUtama === 'BIN_NADZOR') {
        santri.subKategori = input.subKategori || input.kelas || 'Bin Nadzori';
        santri.kelas = input.kelas || input.subKategori || '3 Tsanawiyah';
        kuota.kuotaDasar = 2;
        kuota.tiketPanggungJatah = 0;
        kuota.tiketPanggungDiberi = 0;
      } else if (input.kategoriUtama === 'TAMATAN') {
        const bg = input.bagianTamatan || 'A.01';
        santri.subKategori = `3 ALY ${bg}`;
        santri.kelas = `3 ALY ${bg}`;
        kuota.kuotaDasar = 2;
        kuota.tiketPanggungJatah = 0;
        kuota.tiketPanggungDiberi = 0;
      }
    }

    // 3. Koreksi Kuota Tambahan (+ / -)
    if (input.kuotaTambahan !== undefined && input.kuotaTambahan >= 0) {
      const selisih = input.kuotaTambahan - (kuota.kuotaTambahan || 0);
      kuota.kuotaTambahan = input.kuotaTambahan;
      this.paguTerjual = Math.max(0, this.paguTerjual + selisih);
    }

    // 4. Catatan Rekon
    if (input.catatanRekon) {
      (entitas as any).catatanRekon = input.catatanRekon;
      (entitas as any).diperbaruiAt = new Date().toISOString();
      (entitas as any).diperbaruiOleh = input.petugas || 'panitia-rekon';
    }

    this.saveToStorage();
    return { ok: true, data: entitas };
  }


  public tambahUndangan(input: {
    nama?: string;
    namaPutra?: string;
    namaPutri?: string;
    kategori: string;
    instansi?: string;
    alamat?: string;
    kuotaDasar: number;
    subKategori?: 'PENGUJI' | 'ASATIDZ_MASYAIKH';
    golongan?: 'ISTIMEWA' | 'KEHORMATAN' | 'UMUM';
  }) {
    let maxNum = 100;
    for (const u of this.undanganList) {
      const match = u.kode.match(/UND(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const nextCode = `UND${String(maxNum + 1).padStart(4, '0')}`;
    const undId = `u_${nextCode}`;
    const kuotaId = `qu_${nextCode}`;

    const subKat: 'PENGUJI' | 'ASATIDZ_MASYAIKH' =
      input.subKategori ||
      (input.kategori.toLowerCase().includes('penguji') ? 'PENGUJI' : 'ASATIDZ_MASYAIKH');

    let finalNama = input.nama || '';
    const p = (input.namaPutra || '').trim();
    const w = (input.namaPutri || '').trim();
    if (p && w) finalNama = `${p} & ${w}`;
    else if (p) finalNama = p;
    else if (w) finalNama = w;
    if (!finalNama) finalNama = 'TAMU UNDANGAN';

    const finalAlamat = input.alamat || input.instansi || 'Kediri';
    const finalInstansi = input.instansi || input.alamat || 'Pondok Pesantren Lirboyo';

    const newUndangan = {
      id: undId,
      kode: nextCode,
      kategori: input.kategori || 'VIP / Tokoh Masyarakat',
      subKategori: subKat,
      golongan: input.golongan,
      nama: finalNama,
      namaPutra: p,
      namaPutri: w,
      instansi: finalInstansi,
      alamat: finalAlamat,
      polaKuota: input.kuotaDasar || 4,
      kuota: {
        id: kuotaId,
        eventId: INITIAL_EVENT.id,
        pemilikTipe: 'UNDANGAN' as const,
        pemilikId: undId,
        kodeQr: nextCode,
        kuotaDasar: input.kuotaDasar || 4,
        kuotaTambahan: 0,
        terpakai: 0,
        tiketPanggungJatah: 0,
        tiketPanggungDiberi: 0,
        hangus: false,
      },
    };

    this.undanganList.push(newUndangan);
    this.saveToStorage();
    return { ok: true, code: nextCode, undangan: newUndangan };
  }

  public resetToDefault() {
    this.keluargaList = [...INITIAL_KELUARGA];
    this.undanganList = [...INITIAL_UNDANGAN];
    this.pembelianList = [...INITIAL_PEMBELIAN_KUOTA];
    this.presensiLogs = [...INITIAL_PRESENSI_LOGS];
    this.paguTerjual = 1;
    this.saveToStorage();
    return { ok: true };
  }

  public getKeluargaList() {
    return this.keluargaList;
  }

  public getUndanganList() {
    return this.undanganList;
  }

  public getPembelianList() {
    this.evaluasiBatasWaktu();
    return this.pembelianList;
  }

  public getPresensiLogs() {
    return this.presensiLogs;
  }

  public isKuotaTambahanBuka(): boolean {
    return this.kuotaTambahanBuka;
  }

  public setKuotaTambahanBuka(buka: boolean): boolean {
    this.kuotaTambahanBuka = buka;
    this.saveToStorage();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('kuota_tambahan_toggle', { detail: { buka } }));
    }
    return this.kuotaTambahanBuka;
  }

  public getPaguInfo() {
    return {
      paguTotal: this.paguTotal,
      terjual: this.paguTerjual,
      sisa: Math.max(0, this.paguTotal - this.paguTerjual),
      hargaPerUnit: 80000,
      rekening: 'BRI 320701010266508 a.n. Ahmad Chamdan Yuwafin',
      bisaBeli: this.kuotaTambahanBuka,
    };
  }

  public findByKode(kodeQr: string) {
    const cleanKode = kodeQr.trim().toUpperCase();
    const kel = this.keluargaList.find((k) => k.kode.toUpperCase() === cleanKode);
    if (kel) {
      return {
        tipe: 'KELUARGA' as const,
        entitas: kel,
        santri: kel.santri?.[0],
        kuota: kel.kuota,
        estimasi: kel.estimasi,
      };
    }
    const und = this.undanganList.find((u) => u.kode.toUpperCase() === cleanKode);
    if (und) {
      return {
        tipe: 'UNDANGAN' as const,
        entitas: und,
        santri: undefined,
        kuota: und.kuota,
        estimasi: undefined,
      };
    }
    return null;
  }

  public checkin(
    kodeQr: string,
    jumlahL: number,
    jumlahP: number,
    jalur: JalurPemeriksaan,
    balita: number = 0,
    panitiaId: string = 'panitia-gate',
    serahkanTiketPanggung?: boolean
  ): CheckinResult {
    const total = jumlahL + jumlahP;
    if (total <= 0) {
      return { ok: false, reason: 'JUMLAH_KOSONG', pesan: 'Jumlah yang hadir harus minimal 1 orang.' };
    }

    const item = this.findByKode(kodeQr);
    if (!item) {
      return { ok: false, reason: 'QR_INVALID', pesan: 'Kode QR tidak terdaftar dalam sistem!' };
    }

    const { kuota, santri, entitas } = item;

    if (kuota.hangus) {
      return { ok: false, reason: 'KUOTA_HANGUS', pesan: 'Masa berlaku kuota telah hangus (T+300 menit).' };
    }

    const sisa = kuota.kuotaDasar + kuota.kuotaTambahan - kuota.terpakai;
    if (total > sisa) {
      return {
        ok: false,
        reason: 'KUOTA_HABIS',
        pesan: `Sisa kuota tidak mencukupi. Sisa: ${sisa} kursi, diminta: ${total} orang.`,
        sisa,
        diminta: total,
      };
    }

    let isPanggung = false;
    if (kuota.tiketPanggungJatah > 0) {
      if (serahkanTiketPanggung === true) {
        if (kuota.tiketPanggungDiberi < kuota.tiketPanggungJatah) {
          isPanggung = true;
          kuota.tiketPanggungDiberi += 1;
        }
      } else if (serahkanTiketPanggung === false) {
        isPanggung = false; // Checklist tidak dicentang (diserahkan menyusul)
      } else {
        // Fallback default jika parameter tidak dikirim
        if (kuota.tiketPanggungDiberi < kuota.tiketPanggungJatah && jumlahP >= 1) {
          isPanggung = true;
          kuota.tiketPanggungDiberi += 1;
        }
      }
    }

    kuota.terpakai += total;

    const nowStr = new Date().toTimeString().split(' ')[0];
    this.presensiLogs.unshift({
      id: Date.now(),
      eventId: INITIAL_EVENT.id,
      kuotaId: kuota.id,
      hasil: 'SUKSES',
      jumlahL,
      jumlahP,
      tiketPanggung: isPanggung,
      jumlahBalita: balita,
      jalur,
      panitiaId,
      nonce: `nonce-${Date.now()}-${Math.random()}`,
      serverTime: nowStr,
    });

    this.saveToStorage();

    let warna = 'Biru';
    if (santri?.kategoriUtama === 'TAMATAN') warna = 'Kuning';
    else if (santri?.kategoriUtama === 'BIL_GHOIB') warna = 'Hijau';
    else if (item.tipe === 'UNDANGAN') warna = 'Putih';

    return {
      ok: true,
      namaSantri: santri?.nama || (entitas as any).nama || 'Tamu Undangan',
      kelas: santri?.kelas || '-',
      kategori: santri?.subKategori || (entitas as any).kategori || '-',
      warnaTiket: warna,
      masukSekarang: total,
      terpakai: kuota.terpakai,
      kuotaTotal: kuota.kuotaDasar + kuota.kuotaTambahan,
      sisa: kuota.kuotaDasar + kuota.kuotaTambahan - kuota.terpakai,
      tiketPanggung: isPanggung,
      tiketReguler: total - (isPanggung ? 1 : 0),
      zonaLaki: jumlahL,
      zonaPerempuan: jumlahP - (isPanggung ? 1 : 0),
      zonaPanggung: isPanggung ? 1 : 0,
    };
  }

  public fastTrackVipCheckin(undanganKode: string, jumlah: number = 2): { ok: boolean; pesan: string; nama?: string } {
    const cleanKode = undanganKode.trim();
    const item = this.findByKode(cleanKode);
    if (!item) {
      return { ok: false, pesan: `Data undangan dengan kode ${cleanKode} tidak ditemukan!` };
    }
    const { kuota, entitas } = item;
    const namaTokoh = (entitas as any)?.nama || 'Tamu Kehormatan';

    const jatah = (kuota.kuotaDasar || 2) + (kuota.kuotaTambahan || 0);
    const kuotaPakai = Math.min(jumlah > 0 ? jumlah : 2, jatah);
    kuota.terpakai = kuotaPakai;

    const nowStr = new Date().toTimeString().split(' ')[0];
    this.presensiLogs = this.presensiLogs.filter(
      (l) => l.kuotaId !== kuota.id && l.kuotaId !== `qu_${cleanKode}`
    );

    this.presensiLogs.unshift({
      id: Date.now(),
      eventId: INITIAL_EVENT.id,
      kuotaId: kuota.id,
      hasil: 'SUKSES',
      jumlahL: kuotaPakai,
      jumlahP: 0,
      tiketPanggung: false,
      jumlahBalita: 0,
      jalur: 'BARAT',
      panitiaId: 'protokoler-vip-fasttrack',
      nonce: `fasttrack-${Date.now()}`,
      serverTime: nowStr,
    });

    this.saveToStorage();
    return {
      ok: true,
      pesan: `Alhamdulillah, ${namaTokoh} berhasil di-checkin via Fast-Track VIP (${kuotaPakai} Kursi Terisi).`,
      nama: namaTokoh,
    };
  }

  public batalCheckin(kode: string): { ok: boolean; pesan: string } {
    const cleanKode = kode.trim();
    const item = this.findByKode(cleanKode);
    if (!item) return { ok: false, pesan: 'Data tidak ditemukan!' };
    item.kuota.terpakai = 0;
    if (item.kuota.tiketPanggungDiberi) item.kuota.tiketPanggungDiberi = 0;
    this.presensiLogs = this.presensiLogs.filter(
      (l) => l.kuotaId !== item.kuota.id && l.kuotaId !== `q_${cleanKode}` && l.kuotaId !== `qu_${cleanKode}`
    );
    this.saveToStorage();
    return { ok: true, pesan: `Status check-in untuk ${item.santri?.nama || (item.entitas as any)?.nama || cleanKode} berhasil direset.` };
  }

  public pesanKuota(keluargaId: string, jumlah: number) {
    if (!this.kuotaTambahanBuka) {
      return { ok: false, pesan: 'Mohon maaf, pemesanan kuota tambahan saat ini sedang ditutup oleh panitia.' };
    }
    if (jumlah <= 0) return { ok: false, pesan: 'Jumlah pemesanan harus lebih dari 0' };
    const sisa = this.paguTotal - this.paguTerjual;
    if (sisa < jumlah) return { ok: false, pesan: 'Sisa kuota tambahan tidak mencukupi!' };

    this.paguTerjual += jumlah;
    const batas = new Date(Date.now() + 6 * 3600 * 1000).toISOString();
    const orderId = 'order-' + Date.now();

    const newOrder: PembelianKuota = {
      id: orderId,
      eventId: INITIAL_EVENT.id,
      keluargaId,
      jumlah,
      totalBayar: jumlah * 80000,
      status: 'DIPESAN',
      kedaluwarsaAt: batas,
      createdAt: new Date().toISOString(),
    };

    this.pembelianList.unshift(newOrder);
    this.saveToStorage();

    return { ok: true, id: orderId, jumlah, totalBayar: newOrder.totalBayar, batas };
  }

  public uploadBuktiBayar(orderId: string, buktiUrl: string) {
    const order = this.pembelianList.find((p) => p.id === orderId);
    if (!order) return { ok: false, pesan: 'Pesanan tidak ditemukan' };
    const now = new Date();
    order.buktiUrl = buktiUrl;
    order.status = 'MENUNGGU_VERIFIKASI';
    order.buktiUploadedAt = now.toISOString();
    order.batasVerifikasiAt = new Date(now.getTime() + 6 * 3600 * 1000).toISOString(); // Target SLA 6 jam panitia
    order.autoApproveAt = new Date(now.getTime() + 12 * 3600 * 1000).toISOString(); // Batas 12 jam toleransi auto-approve
    this.saveToStorage();
    return {
      ok: true,
      batasVerifikasiAt: order.batasVerifikasiAt,
      autoApproveAt: order.autoApproveAt,
    };
  }

  public unggahBuktiBayar(orderId: string, buktiUrl: string) {
    return this.uploadBuktiBayar(orderId, buktiUrl);
  }

  public verifikasiPembelian(orderId: string, setuju: boolean, catatan: string = '') {
    const order = this.pembelianList.find((p) => p.id === orderId);
    if (!order) return { ok: false, pesan: 'Pesanan tidak ditemukan' };

    if (setuju) {
      order.status = 'DIVERIFIKASI';
      order.diputusAt = new Date().toISOString();
      order.catatanPanitia = catatan || 'Diverifikasi manual oleh panitia';
      order.autoApprovedBySystem = false;

      const kel = this.keluargaList.find((k) => k.id === order.keluargaId);
      if (kel) {
        kel.kuota.kuotaTambahan += order.jumlah;
      }
    } else {
      order.status = 'DITOLAK';
      order.diputusAt = new Date().toISOString();
      order.catatanPanitia = catatan || 'Ditolak oleh panitia';
      order.autoApprovedBySystem = false;
      this.paguTerjual = Math.max(0, this.paguTerjual - order.jumlah);
    }

    this.saveToStorage();
    return { ok: true };
  }

  public evaluasiBatasWaktu() {
    let changed = false;
    const now = Date.now();

    for (const order of this.pembelianList) {
      // 1. Pesanan DIPESAN: Kunci 6 jam. Jika lewat 6 jam belum upload bukti -> KEDALUWARSA & kembalikan pagu
      if (order.status === 'DIPESAN') {
        const expiredTime = new Date(order.kedaluwarsaAt).getTime();
        if (now > expiredTime) {
          order.status = 'KEDALUWARSA';
          order.diputusAt = new Date().toISOString();
          order.catatanPanitia = 'Kedaluwarsa otomatis: Batas waktu transfer dan upload bukti 6 jam telah habis';
          this.paguTerjual = Math.max(0, this.paguTerjual - order.jumlah);
          changed = true;
        }
      }

      // 2. Pesanan MENUNGGU_VERIFIKASI: Panitia punya target 6 jam. Jika dalam 12 jam belum diverifikasi panitia -> OTOMATIS BERHASIL
      if (order.status === 'MENUNGGU_VERIFIKASI') {
        const baseTime = order.buktiUploadedAt
          ? new Date(order.buktiUploadedAt).getTime()
          : order.createdAt
          ? new Date(order.createdAt).getTime()
          : now;
        const autoApproveTime = order.autoApproveAt
          ? new Date(order.autoApproveAt).getTime()
          : baseTime + 12 * 3600 * 1000;

        if (now > autoApproveTime) {
          order.status = 'DIVERIFIKASI';
          order.diputusAt = new Date().toISOString();
          order.autoApprovedBySystem = true;
          order.catatanPanitia = order.catatanPanitia
            ? `${order.catatanPanitia} | Otomatis Berhasil oleh Sistem (Batas Waktu Verifikasi 12 Jam Terlampaui)`
            : 'Otomatis Berhasil oleh Sistem (Batas Waktu Verifikasi Panitia 12 Jam Terlampaui)';

          const kel = this.keluargaList.find((k) => k.id === order.keluargaId);
          if (kel) {
            kel.kuota.kuotaTambahan += order.jumlah;
          }
          changed = true;
        }
      }
    }

    if (changed) {
      this.saveToStorage();
    }
    return { ok: true, changed };
  }

  public tambahPesananManual(input: {
    keluargaId: string;
    jumlah: number;
    metodeBayar?: 'TUNAI' | 'TRANSFER';
    langsungVerifikasi?: boolean;
    catatan?: string;
  }) {
    const {
      keluargaId,
      jumlah,
      metodeBayar = 'TUNAI',
      langsungVerifikasi = true,
      catatan = '',
    } = input;

    if (jumlah <= 0) return { ok: false, pesan: 'Jumlah pemesanan minimal 1 kursi' };

    const kel = this.keluargaList.find((k) => k.id === keluargaId);
    if (!kel) return { ok: false, pesan: 'Data santri / keluarga tidak ditemukan' };

    const sisa = this.paguTotal - this.paguTerjual;
    if (sisa < jumlah) {
      return { ok: false, pesan: `Sisa kuota global (${sisa}) tidak mencukupi untuk penambahan ${jumlah} kursi!` };
    }

    this.paguTerjual += jumlah;
    const orderId = 'ORD-MNL-' + Date.now();
    const nowIso = new Date().toISOString();

    const newOrder: PembelianKuota = {
      id: orderId,
      eventId: INITIAL_EVENT.id,
      keluargaId,
      jumlah,
      totalBayar: jumlah * 80000,
      status: langsungVerifikasi ? 'DIVERIFIKASI' : 'MENUNGGU_VERIFIKASI',
      kedaluwarsaAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      catatanPanitia:
        catatan ||
        (langsungVerifikasi
          ? `Input manual & verifikasi langsung (${metodeBayar}) oleh panitia`
          : `Input manual (${metodeBayar}) menunggu verifikasi`),
      createdAt: nowIso,
      diputusAt: langsungVerifikasi ? nowIso : undefined,
    };

    if (langsungVerifikasi) {
      kel.kuota.kuotaTambahan += jumlah;
    }

    this.pembelianList.unshift(newOrder);
    this.saveToStorage();

    return {
      ok: true,
      order: newOrder,
      pesan: langsungVerifikasi
        ? `Berhasil menambahkan ${jumlah} kuota tambahan manual & langsung diverifikasi untuk ${kel.namaWali} (Santri: ${kel.santri?.[0]?.nama || '-'}).`
        : `Berhasil mencatat pesanan manual ${jumlah} kursi (menunggu verifikasi).`,
    };
  }

  public batalkanPembelian(orderId: string, metode: 'TRANSFER' | 'TUNAI_HARI_H' = 'TRANSFER') {
    const order = this.pembelianList.find((p) => p.id === orderId);
    if (!order) return { ok: false, pesan: 'Pesanan tidak ditemukan' };

    if (order.status === 'DIVERIFIKASI') {
      const kel = this.keluargaList.find((k) => k.id === order.keluargaId);
      if (kel) {
        kel.kuota.kuotaTambahan = Math.max(0, kel.kuota.kuotaTambahan - order.jumlah);
      }
    }

    order.status = 'DIBATALKAN_REFUND';
    order.metodeRefund = metode;
    order.diputusAt = new Date().toISOString();
    this.paguTerjual = Math.max(0, this.paguTerjual - order.jumlah);

    this.saveToStorage();
    return { ok: true, jumlahRefund: order.jumlah, totalUang: order.totalBayar };
  }

  public simpanEstimasi(
    kuotaId: string,
    perkiraanL: number,
    perkiraanP: number,
    diubahOleh: string = 'WALI_MANDIRI',
    catatan: string = ''
  ) {
    const kel = this.keluargaList.find(
      (k) => k.kuota.id === kuotaId || `q_${k.kode}` === kuotaId || k.id === kuotaId || k.kode === kuotaId
    );
    if (kel) {
      kel.estimasi = {
        kuotaId: kel.kuota.id,
        perkiraanL: Math.max(0, perkiraanL),
        perkiraanP: Math.max(0, perkiraanP),
        statusHadir: 'HADIR',
        statusKonfirmasi: 'SUDAH',
        diisiAt: new Date().toISOString(),
        diubahOleh,
        catatan,
      };
      this.saveToStorage();
      return { ok: true, estimasi: kel.estimasi };
    }
    return { ok: false, pesan: 'Data santri / kuota tidak ditemukan' };
  }

  public getStatistikLive(): StatistikLive {
    let totalKuota = 0;
    let totalHadir = 0;
    let totalLaki = 0;
    let totalPerempuan = 0;
    let totalPanggung = 0;
    let totalBalita = 0;
    let jalurBarat = 0;
    let jalurTimur = 0;
    let jalurRekon = 0;

    let bgSantriTotal = 0, bgSantriHadir = 0, bgKuota = 0, bgHadir = 0;
    let bnSantriTotal = 0, bnSantriHadir = 0, bnKuota = 0, bnHadir = 0;
    let tmSantriTotal = 0, tmSantriHadir = 0, tmKuota = 0, tmHadir = 0;
    let kuotaTambahanTerpakai = 0;

    for (const kel of this.keluargaList) {
      const kDasar = kel.kuota.kuotaDasar;
      const kTambahan = kel.kuota.kuotaTambahan;
      const terpakai = kel.kuota.terpakai;
      const kTotal = kDasar + kTambahan;

      totalKuota += kTotal;
      totalHadir += terpakai;
      totalPanggung += kel.kuota.tiketPanggungDiberi;

      if (kTambahan > 0 && terpakai > kDasar) {
        kuotaTambahanTerpakai += Math.min(kTambahan, terpakai - kDasar);
      }

      const kat = kel.santri?.[0]?.kategoriUtama;
      if (kat === 'BIL_GHOIB') {
        bgSantriTotal++;
        bgKuota += kTotal;
        bgHadir += terpakai;
        if (terpakai > 0) bgSantriHadir++;
      } else if (kat === 'TAMATAN') {
        tmSantriTotal++;
        tmKuota += kTotal;
        tmHadir += terpakai;
        if (terpakai > 0) tmSantriHadir++;
      } else {
        bnSantriTotal++;
        bnKuota += kTotal;
        bnHadir += terpakai;
        if (terpakai > 0) bnSantriHadir++;
      }
    }

    let undTamuTotal = 0, undTamuHadir = 0, undKuota = 0, undHadir = 0;
    for (const und of this.undanganList) {
      const kTotal = und.kuota.kuotaDasar + und.kuota.kuotaTambahan;
      totalKuota += kTotal;
      totalHadir += und.kuota.terpakai;
      undTamuTotal++;
      undKuota += kTotal;
      undHadir += und.kuota.terpakai;
      if (und.kuota.terpakai > 0) undTamuHadir++;
    }

    let tamuLaki = 0;
    let tamuPerempuan = 0;

    for (const log of this.presensiLogs) {
      if (log.hasil === 'SUKSES') {
        totalLaki += log.jumlahL;
        totalPerempuan += log.jumlahP;
        totalBalita += log.jumlahBalita;
        if (log.jalur === 'BARAT') jalurBarat++;
        else if (log.jalur === 'TIMUR') jalurTimur++;
        else if (log.jalur === 'REKONSILIASI') jalurRekon++;

        const isUnd = this.undanganList.some(
          (u) => u.kuota.id === log.kuotaId || `qu_${u.kode}` === log.kuotaId || u.id === log.kuotaId
        );
        if (isUnd) {
          tamuLaki += log.jumlahL;
          tamuPerempuan += log.jumlahP;
        }
      }
    }

    return {
      totalKuota,
      totalHadir,
      totalLaki,
      totalPerempuan,
      totalPanggung,
      totalBalita,
      jalurBarat,
      jalurTimur,
      jalurRekon,
      persentaseHadir: totalKuota > 0 ? Math.round((totalHadir / totalKuota) * 100) : 0,
      sisaKuota: Math.max(0, totalKuota - totalHadir),

      kategoriStats: {
        bilGhoib: {
          nama: 'Bil Ghoib (64 Khadimatul Qur-an)',
          subLabel: `${bgSantriTotal} Santri · ${bgKuota} Kuota Dasar (Tiket Hijau + Emas Panggung)`,
          warnaTiket: 'Hijau (+Emas Panggung)',
          badgeWarna: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          totalPeserta: bgSantriTotal,
          hadirPeserta: bgSantriHadir,
          totalKuota: bgKuota,
          totalHadir: bgHadir,
          persentase: bgKuota > 0 ? Math.round((bgHadir / bgKuota) * 100) : 0,
        },
        binNadzor: {
          nama: 'Bin Nadzori (6 Jenjang Kelas)',
          subLabel: `${bnSantriTotal} Santri · ${bnKuota} Kuota Dasar (Tiket Biru)`,
          warnaTiket: 'Biru',
          badgeWarna: 'bg-blue-100 text-blue-900 border-blue-300',
          totalPeserta: bnSantriTotal,
          hadirPeserta: bnSantriHadir,
          totalKuota: bnKuota,
          totalHadir: bnHadir,
          persentase: bnKuota > 0 ? Math.round((bnHadir / bnKuota) * 100) : 0,
        },
        tamatan: {
          nama: 'Tamatan III Aliyah (7 Bagian)',
          subLabel: `${tmSantriTotal} Santri · ${tmKuota} Kuota Dasar (Tiket Kuning)`,
          warnaTiket: 'Kuning',
          badgeWarna: 'bg-amber-100 text-amber-900 border-amber-300',
          totalPeserta: tmSantriTotal,
          hadirPeserta: tmSantriHadir,
          totalKuota: tmKuota,
          totalHadir: tmHadir,
          persentase: tmKuota > 0 ? Math.round((tmHadir / tmKuota) * 100) : 0,
        },
        tamuUndangan: {
          nama: 'Tamu Undangan Khusus (Penguji & Asatidz)',
          subLabel: `${undTamuTotal} Tokoh Kehormatan · ${undKuota} Kuota VIP (Tiket Putih)`,
          warnaTiket: 'Putih VIP',
          badgeWarna: 'bg-stone-100 text-stone-900 border-stone-300',
          totalPeserta: undTamuTotal,
          hadirPeserta: undTamuHadir,
          totalKuota: undKuota,
          totalHadir: undHadir,
          persentase: undKuota > 0 ? Math.round((undHadir / undKuota) * 100) : 0,
        },
        kuotaTambahan: {
          paguTotal: this.paguTotal,
          terjual: this.paguTerjual,
          terpakai: kuotaTambahanTerpakai,
          persentase: this.paguTotal > 0 ? Math.round((this.paguTerjual / this.paguTotal) * 100) : 0,
        },
      },

      tamuUndanganStat: {
        totalUndangan: undTamuTotal,
        hadirUndangan: undTamuHadir,
        totalKuota: undKuota,
        totalHadir: undHadir,
        totalLaki: tamuLaki,
        totalPerempuan: tamuPerempuan,
        persentase: undKuota > 0 ? Math.round((undHadir / undKuota) * 100) : 0,
      },
    };
  }

  public getDaftarHadirRealtime(): DaftarHadirRealtimeItem[] {
    const list: DaftarHadirRealtimeItem[] = [];

    // 1. Entitas Tamu Undangan yang hadir (terpakai > 0)
    for (const und of this.undanganList) {
      if (und.kuota.terpakai > 0) {
        const logs = this.presensiLogs.filter(
          (l) =>
            l.hasil === 'SUKSES' &&
            (l.kuotaId === und.kuota.id || l.kuotaId === `qu_${und.kode}` || l.kuotaId === und.id)
        );
        let jumlahL = 0;
        let jumlahP = 0;
        let jumlahBalita = 0;
        let waktuTiba = '08:00:00';
        let jalur: JalurPemeriksaan = 'BARAT';
        let panitiaId = 'panitia-gate';

        if (logs.length > 0) {
          for (const l of logs) {
            jumlahL += l.jumlahL;
            jumlahP += l.jumlahP;
            jumlahBalita += l.jumlahBalita;
          }
          const latestLog = logs[0];
          waktuTiba = latestLog.serverTime;
          jalur = latestLog.jalur;
          panitiaId = latestLog.panitiaId;
        } else {
          jumlahL = und.kuota.terpakai;
        }

        const totalK = und.kuota.kuotaDasar + und.kuota.kuotaTambahan;
        const statusHadir = und.kuota.terpakai >= totalK ? 'HADIR' : 'SEBAGIAN';

        list.push({
          id: und.id,
          kode: und.kode,
          tipe: 'UNDANGAN',
          kategoriUtama: 'UNDANGAN',
          nama: und.nama,
          waliAtauInstansi: und.instansi || 'Tamu Kehormatan',
          kategori: und.kategori,
          kelasAtauSub: und.subKategori === 'PENGUJI' ? 'Penguji Al-Qur\'an' : 'Masyayikh & Asatidz',
          kuotaDasar: und.kuota.kuotaDasar,
          kuotaTambahan: und.kuota.kuotaTambahan,
          totalKuota: totalK,
          terpakai: und.kuota.terpakai,
          jumlahL,
          jumlahP,
          jumlahBalita,
          tiketPanggung: false,
          warnaTiket: 'Putih VIP',
          waktuTiba,
          jalur,
          panitiaId,
          statusHadir,
        });
      }
    }

    // 2. Entitas Keluarga Santri yang hadir (terpakai > 0)
    for (const kel of this.keluargaList) {
      if (kel.kuota.terpakai > 0) {
        const santri = kel.santri?.[0];
        const katUtama = (santri?.kategoriUtama || 'BIN_NADZOR') as 'BIL_GHOIB' | 'BIN_NADZOR' | 'TAMATAN';
        const logs = this.presensiLogs.filter(
          (l) =>
            l.hasil === 'SUKSES' &&
            (l.kuotaId === kel.kuota.id || l.kuotaId === `q_${kel.kode}` || l.kuotaId === kel.id)
        );

        let jumlahL = 0;
        let jumlahP = 0;
        let jumlahBalita = 0;
        let waktuTiba = '07:45:00';
        let jalur: JalurPemeriksaan = katUtama === 'BIL_GHOIB' ? 'TIMUR' : 'BARAT';
        let panitiaId = 'panitia-gate';
        let panggung = kel.kuota.tiketPanggungDiberi > 0;

        if (logs.length > 0) {
          for (const l of logs) {
            jumlahL += l.jumlahL;
            jumlahP += l.jumlahP;
            jumlahBalita += l.jumlahBalita;
            if (l.tiketPanggung) panggung = true;
          }
          const latestLog = logs[0];
          waktuTiba = latestLog.serverTime;
          jalur = latestLog.jalur;
          panitiaId = latestLog.panitiaId;
        } else {
          jumlahL = Math.max(0, kel.kuota.terpakai - 1);
          jumlahP = 1;
        }

        let warna = 'Biru';
        if (katUtama === 'BIL_GHOIB') warna = 'Hijau (+Emas ★)';
        else if (katUtama === 'TAMATAN') warna = 'Kuning';

        const totalK = kel.kuota.kuotaDasar + kel.kuota.kuotaTambahan;
        const statusHadir = kel.kuota.terpakai >= totalK ? 'HADIR' : 'SEBAGIAN';

        list.push({
          id: kel.id,
          kode: kel.kode,
          tipe: 'SANTRI',
          kategoriUtama: katUtama,
          nama: santri?.nama || kel.namaWali,
          waliAtauInstansi: kel.namaWali,
          kategori: santri?.subKategori || santri?.kelas || katUtama,
          kelasAtauSub: santri?.kelas || '-',
          kuotaDasar: kel.kuota.kuotaDasar,
          kuotaTambahan: kel.kuota.kuotaTambahan,
          totalKuota: totalK,
          terpakai: kel.kuota.terpakai,
          jumlahL,
          jumlahP,
          jumlahBalita,
          tiketPanggung: panggung,
          warnaTiket: warna,
          waktuTiba,
          jalur,
          panitiaId,
          statusHadir,
        });
      }
    }

    return list.sort((a, b) => b.waktuTiba.localeCompare(a.waktuTiba));
  }

  public getLogKedatanganDetail() {
    return this.presensiLogs.map((log) => {
      let nama = '-';
      let waliAtauInstansi = '-';
      let tipe: 'SANTRI' | 'UNDANGAN' = 'SANTRI';
      let kategori = '-';
      let kategoriUtama: 'BIL_GHOIB' | 'BIN_NADZOR' | 'TAMATAN' | 'UNDANGAN' = 'BIN_NADZOR';
      let kode = '-';
      let warna = 'Biru';

      const kel = this.keluargaList.find((k) => k.kuota.id === log.kuotaId || `q_${k.kode}` === log.kuotaId);
      if (kel) {
        const santri = kel.santri?.[0];
        nama = santri?.nama || kel.namaWali;
        waliAtauInstansi = kel.namaWali;
        tipe = 'SANTRI';
        kategori = santri?.subKategori || santri?.kelas || 'SANTRI';
        kategoriUtama = (santri?.kategoriUtama || 'BIN_NADZOR') as any;
        kode = kel.kode;
        if (kategoriUtama === 'BIL_GHOIB') warna = 'Hijau (+Emas ★)';
        else if (kategoriUtama === 'TAMATAN') warna = 'Kuning';
        else warna = 'Biru';
      } else {
        const und = this.undanganList.find(
          (u) => u.kuota.id === log.kuotaId || `qu_${u.kode}` === log.kuotaId || u.id === log.kuotaId
        );
        if (und) {
          nama = und.nama;
          waliAtauInstansi = und.instansi || 'Tamu Kehormatan';
          tipe = 'UNDANGAN';
          kategori = und.kategori;
          kategoriUtama = 'UNDANGAN';
          kode = und.kode;
          warna = 'Putih VIP';
        }
      }

      return {
        ...log,
        nama,
        waliAtauInstansi,
        tipe,
        kategori,
        kategoriUtama,
        kode,
        warna,
      };
    });
  }

  public getRekapKonfirmasi() {
    let sudahKonfirmasiCount = 0;
    let belumKonfirmasiCount = 0;
    let totalEstL = 0;
    let totalEstP = 0;
    let totalKuotaSantri = 0;

    for (const kel of this.keluargaList) {
      const kTotal = kel.kuota.kuotaDasar + kel.kuota.kuotaTambahan;
      totalKuotaSantri += kTotal;

      if (kel.estimasi && kel.estimasi.statusKonfirmasi === 'SUDAH') {
        sudahKonfirmasiCount++;
        totalEstL += kel.estimasi.perkiraanL || 0;
        totalEstP += kel.estimasi.perkiraanP || 0;
      } else {
        belumKonfirmasiCount++;
      }
    }

    return {
      totalSantri: this.keluargaList.length,
      sudahKonfirmasiCount,
      belumKonfirmasiCount,
      persentaseSudah:
        this.keluargaList.length > 0
          ? Math.round((sudahKonfirmasiCount / this.keluargaList.length) * 100)
          : 0,
      totalEstL,
      totalEstP,
      totalEstimasiRombongan: totalEstL + totalEstP,
      totalKuotaSantri,
    };
  }

  public getDaftarKonfirmasiSantri() {
    return this.keluargaList.map((kel) => {
      const santri = kel.santri?.[0];
      const katUtama = (santri?.kategoriUtama || 'BIN_NADZOR') as
        | 'BIL_GHOIB'
        | 'BIN_NADZOR'
        | 'TAMATAN';
      const totalK = kel.kuota.kuotaDasar + kel.kuota.kuotaTambahan;
      const isConfirmed = kel.estimasi?.statusKonfirmasi === 'SUDAH';
      const estL = isConfirmed ? kel.estimasi?.perkiraanL || 0 : 0;
      const estP = isConfirmed ? kel.estimasi?.perkiraanP || 0 : 0;

      return {
        id: kel.id,
        kode: kel.kode,
        namaSantri: santri?.nama || '-',
        kamar: santri?.kamar || '-',
        kategoriUtama: katUtama,
        subKategori: santri?.subKategori || santri?.kelas || '-',
        kelas: santri?.kelas || '-',
        namaWali: kel.namaWali,
        noHp: kel.noHp,
        alamat: kel.alamat,
        kuotaDasar: kel.kuota.kuotaDasar,
        kuotaTambahan: kel.kuota.kuotaTambahan,
        totalKuota: totalK,
        statusKonfirmasi: isConfirmed ? ('SUDAH' as const) : ('BELUM' as const),
        perkiraanL: estL,
        perkiraanP: estP,
        totalEstimasi: estL + estP,
        diisiAt: kel.estimasi?.diisiAt || '',
        diubahOleh: kel.estimasi?.diubahOleh || 'WALI_MANDIRI',
        catatan: kel.estimasi?.catatan || '',
      };
    });
  }

  public editKonfirmasiManual(
    kode: string,
    perkiraanL: number,
    perkiraanP: number,
    catatan: string = ''
  ) {
    const cleanKode = kode.trim().toUpperCase();
    const kel = this.keluargaList.find((k) => k.kode.toUpperCase() === cleanKode);
    if (!kel) return { ok: false, pesan: 'Data santri tidak ditemukan' };

    const totalK = kel.kuota.kuotaDasar + kel.kuota.kuotaTambahan;
    if (perkiraanL + perkiraanP > totalK) {
      return {
        ok: false,
        pesan: `Total rombongan (${perkiraanL + perkiraanP} orang) melebihi jatah kuota (${totalK} kursi)!`,
      };
    }

    kel.estimasi = {
      kuotaId: kel.kuota.id,
      perkiraanL: Math.max(0, perkiraanL),
      perkiraanP: Math.max(0, perkiraanP),
      statusHadir: 'HADIR',
      statusKonfirmasi: 'SUDAH',
      diisiAt: new Date().toISOString(),
      diubahOleh: 'PANITIA_MANUAL',
      catatan,
    };

    this.saveToStorage();
    return { ok: true, kel };
  }

  public getDaftarBelumHadir(filterKategori?: string): DaftarBelumHadirItem[] {
    const list: DaftarBelumHadirItem[] = [];

    // 1. Santri Sohibul Hajat yang belum hadir (terpakai === 0)
    for (const kel of this.keluargaList) {
      if (kel.kuota.terpakai === 0) {
        const santri = kel.santri?.[0];
        const katUtama = (santri?.kategoriUtama || 'BIN_NADZOR') as
          | 'BIL_GHOIB'
          | 'BIN_NADZOR'
          | 'TAMATAN';
        const totalK = kel.kuota.kuotaDasar + kel.kuota.kuotaTambahan;

        let katLabel = santri?.subKategori || santri?.kategoriUtama || 'Santri';
        if (santri?.kategoriUtama === 'TAMATAN') {
          const bg = extractBagianTamatan(santri.subKategori) || 'A.01';
          katLabel = `Tamatan Bagian ${bg}`;
        } else if (santri?.kategoriUtama === 'BIL_GHOIB') {
          katLabel = 'Bil Ghoib (Khadimatul Qur-an)';
        } else if (santri?.kelas) {
          katLabel = `Bin Nadzori ${santri.kelas}`;
        }

        let warna = 'Biru';
        if (katUtama === 'BIL_GHOIB') warna = 'Hijau (+Emas ★)';
        else if (katUtama === 'TAMATAN') warna = 'Kuning';

        const isConfirmed = kel.estimasi?.statusKonfirmasi === 'SUDAH';
        const estL = isConfirmed ? kel.estimasi?.perkiraanL || 0 : 0;
        const estP = isConfirmed ? kel.estimasi?.perkiraanP || 0 : 0;

        list.push({
          id: kel.id,
          kode: kel.kode,
          tipe: 'SANTRI',
          kategoriUtama: katUtama,
          nama: santri?.nama || kel.namaWali,
          waliAtauInstansi: kel.namaWali,
          kategori: katLabel,
          kelasAtauSub: santri?.kelas || santri?.subKategori || '-',
          noHp: kel.noHp,
          alamat: kel.alamat,
          kuotaDasar: kel.kuota.kuotaDasar,
          kuotaTambahan: kel.kuota.kuotaTambahan,
          totalKuota: totalK,
          terpakai: 0,
          sisa: totalK,
          warnaTiket: warna,
          statusKonfirmasi: isConfirmed ? 'SUDAH' : 'BELUM',
          estimasiL: estL,
          estimasiP: estP,
          estimasiTotal: estL + estP,
          estimasiDiisiAt: kel.estimasi?.diisiAt,
        });
      }
    }

    // 2. Tamu Undangan yang belum hadir (terpakai === 0)
    for (const und of this.undanganList) {
      if (und.kuota.terpakai === 0) {
        const totalK = und.kuota.kuotaDasar + und.kuota.kuotaTambahan;
        list.push({
          id: und.id,
          kode: und.kode,
          tipe: 'UNDANGAN',
          kategoriUtama: 'UNDANGAN',
          golonganUndangan: (und as any).golongan || getGolonganUndangan(und),
          nama: und.nama,
          waliAtauInstansi: und.instansi || 'Tamu Kehormatan',
          kategori: und.kategori,
          kelasAtauSub:
            und.subKategori === 'PENGUJI' ? "Penguji Al-Qur'an" : 'Asatidz Purna Bakti & Masyaikh',
          noHp: '-',
          alamat: (und as any).alamat || und.instansi || '-',
          kuotaDasar: und.kuota.kuotaDasar,
          kuotaTambahan: und.kuota.kuotaTambahan,
          totalKuota: totalK,
          terpakai: 0,
          sisa: totalK,
          warnaTiket: 'Putih VIP',
          statusKonfirmasi: 'SUDAH',
          estimasiL: und.kuota.kuotaDasar,
          estimasiP: 0,
          estimasiTotal: und.kuota.kuotaDasar,
        });
      }
    }

    if (!filterKategori || filterKategori === 'SEMUA') {
      return list;
    }

    const fk = filterKategori.toLowerCase().trim();
    return list.filter((item) => {
      const kat = item.kategori.toLowerCase();
      const katUtama = item.kategoriUtama.toLowerCase();
      const sub = item.kelasAtauSub.toLowerCase();
      return kat.includes(fk) || katUtama.includes(fk) || sub.includes(fk);
    });
  }

  public getDaftarHadirSantriDanTamu(filterKategori?: string): PesertaHadirItem[] {
    const list: PesertaHadirItem[] = [];

    // 1. Santri Sohibul Hajat yang sudah hadir (terpakai > 0)
    for (const kel of this.keluargaList) {
      if (kel.kuota.terpakai > 0) {
        const santri = kel.santri?.[0];
        const log = this.presensiLogs.find(
          (l) => l.kuotaId === kel.kuota.id || l.kuotaId === `q_${kel.kode}`
        );

        let katLabel = santri?.subKategori || santri?.kategoriUtama || 'Santri';
        if (santri?.kategoriUtama === 'TAMATAN') {
          const bg = extractBagianTamatan(santri.subKategori) || 'A.01';
          katLabel = `Tamatan Bagian ${bg}`;
        } else if (santri?.kategoriUtama === 'BIL_GHOIB') {
          katLabel = 'Bil Ghoib (Khadimatul Qur-an)';
        } else if (santri?.kelas) {
          katLabel = `Bin Nadzori ${santri.kelas}`;
        }

        let warna = 'Biru';
        if (santri?.kategoriUtama === 'TAMATAN') warna = 'Kuning';
        else if (santri?.kategoriUtama === 'BIL_GHOIB') warna = 'Hijau (+Emas ★)';

        list.push({
          id: kel.id,
          kode: kel.kode,
          tipe: 'SANTRI',
          kategoriUtama: santri?.kategoriUtama || 'BIN_NADZOR',
          nama: santri?.nama || 'Santri',
          waliAtauInstansi: kel.namaWali,
          kategori: katLabel,
          kelasAtauSub: santri?.kelas || santri?.subKategori || '-',
          kamar: (santri as any)?.kamar || '',
          noHp: kel.noHp,
          alamat: kel.alamat,
          kuotaDasar: kel.kuota.kuotaDasar,
          kuotaTambahan: kel.kuota.kuotaTambahan,
          totalKuota: kel.kuota.kuotaDasar + kel.kuota.kuotaTambahan,
          terpakai: kel.kuota.terpakai,
          sisa: Math.max(0, kel.kuota.kuotaDasar + kel.kuota.kuotaTambahan - kel.kuota.terpakai),
          warnaTiket: warna,
          jumlahL: log ? log.jumlahL : (kel.kuota.terpakai > 1 ? 1 : 0),
          jumlahP: log ? log.jumlahP : (kel.kuota.terpakai > 1 ? kel.kuota.terpakai - 1 : kel.kuota.terpakai),
          tiketPanggungDiberi: kel.kuota.tiketPanggungDiberi,
          tiketPanggungJatah: kel.kuota.tiketPanggungJatah,
          jamMasuk: log?.serverTime || '08:15:00',
          jalur: log?.jalur || 'TIMUR',
        });
      }
    }

    // 2. Tamu Undangan yang sudah hadir (terpakai > 0)
    for (const und of this.undanganList) {
      if (und.kuota.terpakai > 0) {
        const log = this.presensiLogs.find(
          (l) => l.kuotaId === und.kuota.id || l.kuotaId === `qu_${und.kode}`
        );

        list.push({
          id: und.id,
          kode: und.kode,
          tipe: 'UNDANGAN',
          kategoriUtama: 'UNDANGAN',
          golonganUndangan: (und as any).golongan || getGolonganUndangan(und),
          nama: und.nama,
          waliAtauInstansi: und.instansi || (und as any).alamat || '-',
          kategori: und.kategori || 'Tamu Undangan Khusus',
          kelasAtauSub: und.subKategori === 'PENGUJI' ? "Penguji Al-Qur'an" : 'Asatidz Purna Bakti & Masyaikh',
          noHp: '-',
          alamat: (und as any).alamat || und.instansi,
          kuotaDasar: und.kuota.kuotaDasar,
          kuotaTambahan: und.kuota.kuotaTambahan,
          totalKuota: und.kuota.kuotaDasar + und.kuota.kuotaTambahan,
          terpakai: und.kuota.terpakai,
          sisa: Math.max(0, und.kuota.kuotaDasar + und.kuota.kuotaTambahan - und.kuota.terpakai),
          warnaTiket: 'Putih VIP',
          jumlahL: log ? log.jumlahL : und.kuota.terpakai,
          jumlahP: log ? log.jumlahP : 0,
          tiketPanggungDiberi: 0,
          tiketPanggungJatah: 0,
          jamMasuk: log?.serverTime || '08:30:00',
          jalur: log?.jalur || 'BARAT',
        });
      }
    }

    if (!filterKategori || filterKategori === 'SEMUA') {
      return list;
    }

    const fk = filterKategori.toLowerCase().trim();
    return list.filter((item) => {
      const kat = item.kategori.toLowerCase();
      const katUtama = item.kategoriUtama.toLowerCase();
      const sub = item.kelasAtauSub.toLowerCase();
      return kat.includes(fk) || katUtama.includes(fk) || sub.includes(fk);
    });
  }

  public resetDemoData() {
    this.keluargaList = [...INITIAL_KELUARGA];
    this.undanganList = [...INITIAL_UNDANGAN];
    this.pembelianList = [...INITIAL_PEMBELIAN_KUOTA];
    this.presensiLogs = [...INITIAL_PRESENSI_LOGS];
    this.paguTerjual = 1;
    this.saveToStorage();
  }
}

export const store = new DataStore();

