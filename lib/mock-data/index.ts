// =====================================================================
// BARREL EXPORT & DATA STORE (HAUL & HAFLAH P3TQ - MHMTQ v4.2)
// Basis Data 549 Santri Riil (64 Bil Ghoib + 159 Bin Nadzori + 326 Tamatan)
// Pondok Pesantren Putri Tahfizhil Qur-an & MHMTQ Lirboyo Kediri
// =====================================================================

import {
  KeluargaWithKuota,
  PembelianKuota,
  PresensiLog,
  StatistikLive,
  DaftarHadirRealtimeItem,
  DaftarBelumHadirItem,
  PesertaHadirItem,
  CheckinResult,
  JalurPemeriksaan,
  TambahPesertaInput,
  EditPesertaInput,
  RekonsiliasiKoreksiInput,
  TambahUndanganInput,
  TambahPesananManualInput,
  FindByKodeResult,
  IDataStoreContext,
} from './types';

import {
  INITIAL_KELUARGA,
  INITIAL_PEMBELIAN_KUOTA,
  tambahPesertaHelper,
  editSantriHelper,
  pesanKuotaHelper,
  uploadBuktiBayarHelper,
  verifikasiPembelianHelper,
  evaluasiBatasWaktuHelper,
  tambahPesananManualHelper,
  batalkanPembelianHelper,
  simpanEstimasiHelper,
  getRekapKonfirmasiHelper,
  getDaftarKonfirmasiSantriHelper,
  editKonfirmasiManualHelper,
} from './santri';

import {
  INITIAL_UNDANGAN,
  tambahUndanganHelper,
  editUndanganHelper,
  fastTrackVipCheckinHelper,
} from './tamu';

import {
  INITIAL_EVENT,
  INITIAL_PRESENSI_LOGS,
  rekonsiliasiKoreksiPesertaHelper,
  checkinHelper,
  batalCheckinHelper,
  getStatistikLiveHelper,
  getDaftarHadirRealtimeHelper,
  getLogKedatanganDetailHelper,
  getDaftarBelumHadirHelper,
  getDaftarHadirSantriDanTamuHelper,
} from './presensi';

export * from './types';
export * from './santri';
export * from './tamu';
export * from './presensi';

export class DataStore implements IDataStoreContext {
  public keluargaList: KeluargaWithKuota[] = [];
  public undanganList: any[] = [];
  public pembelianList: PembelianKuota[] = [];
  public presensiLogs: PresensiLog[] = [];
  public paguTotal = 300;
  public paguTerjual = 0;
  public kuotaTambahanBuka = false;
  private storageKey = 'haflah_store_v72_pure_empty_v2';

  private isSyncing = false;
  private lastCloudSync = 0;

  constructor() {
    this.loadFromStorage();
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.syncCloud('PUSH');
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
          action: forceAction || 'PUSH',
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

  public saveToStorage(forceAction?: 'RESET' | 'PUSH' | 'MERGE') {
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
      this.syncCloud(forceAction || 'PUSH');
    }
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('haflah_store_') && k !== this.storageKey) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));

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

  public tambahPeserta(input: TambahPesertaInput) {
    return tambahPesertaHelper(this, input);
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
    this.keluargaList = [];
    this.undanganList = [];
    this.presensiLogs = [];
    this.paguTerjual = 1;
    this.saveToStorage();
    return { ok: true, pesan: 'Data bawaan 549 santri dan 70 tamu undangan berhasil dipulihkan.' };
  }

  public editPeserta(kode: string, data: EditPesertaInput) {
    const cleanKode = kode.trim().toUpperCase();
    const kel = this.keluargaList.find((k) => k.kode.toUpperCase() === cleanKode);
    if (kel) {
      return editSantriHelper(this, kel, data);
    }

    const und = this.undanganList.find((u) => u.kode.toUpperCase() === cleanKode);
    if (und) {
      return editUndanganHelper(this, und, data);
    }

    return { ok: false, pesan: `Peserta dengan kode ${kode} tidak ditemukan.` };
  }

  public rekonsiliasiKoreksiPeserta(input: RekonsiliasiKoreksiInput) {
    return rekonsiliasiKoreksiPesertaHelper(this, input);
  }

  public tambahUndangan(input: TambahUndanganInput) {
    return tambahUndanganHelper(this, input);
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
      hargaPerUnit: 75000,
      rekening: 'BRI 320701010266508 a.n. Ahmad Chamdan Yuwafin',
      bisaBeli: this.kuotaTambahanBuka,
    };
  }

  public findByKode(kodeQr: string): FindByKodeResult | null {
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
    return checkinHelper(this, kodeQr, jumlahL, jumlahP, jalur, balita, panitiaId, serahkanTiketPanggung);
  }

  public fastTrackVipCheckin(undanganKode: string, jumlah: number = 2) {
    return fastTrackVipCheckinHelper(this, undanganKode, jumlah);
  }

  public batalCheckin(kode: string) {
    return batalCheckinHelper(this, kode);
  }

  public pesanKuota(keluargaId: string, jumlah: number) {
    return pesanKuotaHelper(this, keluargaId, jumlah);
  }

  public uploadBuktiBayar(orderId: string, buktiUrl: string) {
    return uploadBuktiBayarHelper(this, orderId, buktiUrl);
  }

  public unggahBuktiBayar(orderId: string, buktiUrl: string) {
    return this.uploadBuktiBayar(orderId, buktiUrl);
  }

  public verifikasiPembelian(orderId: string, setuju: boolean, catatan: string = '') {
    return verifikasiPembelianHelper(this, orderId, setuju, catatan);
  }

  public evaluasiBatasWaktu() {
    return evaluasiBatasWaktuHelper(this);
  }

  public tambahPesananManual(input: TambahPesananManualInput) {
    return tambahPesananManualHelper(this, input);
  }

  public batalkanPembelian(orderId: string, metode: 'TRANSFER' | 'TUNAI_HARI_H' = 'TRANSFER') {
    return batalkanPembelianHelper(this, orderId, metode);
  }

  public simpanEstimasi(
    kuotaId: string,
    perkiraanL: number,
    perkiraanP: number,
    diubahOleh: string = 'WALI_MANDIRI',
    catatan: string = ''
  ) {
    return simpanEstimasiHelper(this, kuotaId, perkiraanL, perkiraanP, diubahOleh, catatan);
  }

  public getStatistikLive(): StatistikLive {
    return getStatistikLiveHelper(this);
  }

  public getDaftarHadirRealtime(): DaftarHadirRealtimeItem[] {
    return getDaftarHadirRealtimeHelper(this);
  }

  public getLogKedatanganDetail() {
    return getLogKedatanganDetailHelper(this);
  }

  public getRekapKonfirmasi() {
    return getRekapKonfirmasiHelper(this);
  }

  public getDaftarKonfirmasiSantri() {
    return getDaftarKonfirmasiSantriHelper(this);
  }

  public editKonfirmasiManual(kode: string, perkiraanL: number, perkiraanP: number, catatan: string = '') {
    return editKonfirmasiManualHelper(this, kode, perkiraanL, perkiraanP, catatan);
  }

  public getDaftarBelumHadir(filterKategori?: string): DaftarBelumHadirItem[] {
    return getDaftarBelumHadirHelper(this, filterKategori);
  }

  public getDaftarHadirSantriDanTamu(filterKategori?: string): PesertaHadirItem[] {
    return getDaftarHadirSantriDanTamuHelper(this, filterKategori);
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
