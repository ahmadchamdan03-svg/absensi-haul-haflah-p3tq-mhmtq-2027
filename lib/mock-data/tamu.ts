// =====================================================================
// MODUL DATA & OPERASI TAMU UNDANGAN KHUSUS (UND)
// =====================================================================

import {
  KeluargaWithKuota,
  TambahUndanganInput,
  EditPesertaInput,
  IDataStoreContext,
} from './types';
import { SANTRI_EVENT_ID } from './santri';
import { generateRandomKode } from '../utils';

export const INITIAL_UNDANGAN: KeluargaWithKuota[] = [];

export function tambahUndanganHelper(ctx: IDataStoreContext, input: TambahUndanganInput) {
  let nextCode = generateRandomKode('UND');
  for (let i = 0; i < 20; i++) {
    if (!ctx.undanganList.some(u => u.kode === nextCode)) break;
    nextCode = generateRandomKode('UND');
  }
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
    jalurMasuk: input.jalurMasuk || '',
    nama: finalNama,
    namaPutra: p,
    namaPutri: w,
    instansi: finalInstansi,
    alamat: finalAlamat,
    polaKuota: input.kuotaDasar || 4,
    kuota: {
      id: kuotaId,
      eventId: SANTRI_EVENT_ID,
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

  ctx.undanganList.push(newUndangan);
  ctx.saveToStorage();
  return { ok: true, code: nextCode, undangan: newUndangan };
}

export function editUndanganHelper(
  ctx: IDataStoreContext,
  und: any,
  data: EditPesertaInput
) {
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
  ctx.saveToStorage();
  return { ok: true, und };
}

export function fastTrackVipCheckinHelper(
  ctx: IDataStoreContext,
  undanganKode: string,
  jumlah: number = 2
): { ok: boolean; pesan: string; nama?: string } {
  const cleanKode = undanganKode.trim();
  const item = ctx.findByKode(cleanKode);
  if (!item) {
    return { ok: false, pesan: `Data undangan dengan kode ${cleanKode} tidak ditemukan!` };
  }
  const { kuota, entitas } = item;
  const namaTokoh = (entitas as any)?.nama || 'Tamu Kehormatan';

  const jatah = (kuota.kuotaDasar || 2) + (kuota.kuotaTambahan || 0);
  const kuotaPakai = Math.min(jumlah > 0 ? jumlah : 2, jatah);
  kuota.terpakai = kuotaPakai;

  const nowStr = new Date().toTimeString().split(' ')[0];
  ctx.presensiLogs = ctx.presensiLogs.filter(
    (l) => l.kuotaId !== kuota.id && l.kuotaId !== `qu_${cleanKode}`
  );

  ctx.presensiLogs.unshift({
    id: Date.now(),
    eventId: SANTRI_EVENT_ID,
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

  ctx.saveToStorage();
  return {
    ok: true,
    pesan: `Alhamdulillah, ${namaTokoh} berhasil di-checkin via Fast-Track VIP (${kuotaPakai} Kursi Terisi).`,
    nama: namaTokoh,
  };
}
