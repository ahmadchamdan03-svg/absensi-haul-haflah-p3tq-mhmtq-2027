import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/audit-log';
import { JalurPemeriksaan } from '@/lib/types';

export interface ScanFeedback {
  type: 'success' | 'error';
  message: string;
  name?: string;
  kategori?: string;
}

export interface ScanSantriSubItem {
  nama: string;
  kategoriUtama: string;
  subKategori: string;
  kelas: string;
  kamar: string;
}

export interface ScanEntitasInfo {
  nama: string;
  namaWali: string;
  kategori: string;
}

export interface ScanKuotaInfo {
  id: any;
  kodeQr: string;
  kuotaDasar: number;
  kuotaTambahan: number;
  terpakai: number;
  tiketPanggungJatah: number;
  tiketPanggungDiberi: number;
}

export interface ScanActiveItem {
  id: any;
  kode: string;
  tipe: 'KELUARGA' | 'UNDANGAN' | string;
  nama: string;
  namaSantri?: string;
  namaWali: string;
  kategori: string;
  subKategori: string;
  kelas: string;
  kamar: string;
  alamat: string;
  noHp: string;
  isBilGhoib: boolean;
  kartuHitamGoldDiberi: boolean;
  santri: ScanSantriSubItem[] | null;
  entitas: ScanEntitasInfo;
  kuota: ScanKuotaInfo;
}

export interface RecentScanLog {
  id: any;
  kode_qr: string;
  nama_peserta: string;
  jumlah_l: number;
  jumlah_p: number;
  jalur: string;
  created_at: string;
}

// Audio synthesizer beep saat scan QR berhasil dideteksi
export const playBeep = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(784, ctx.currentTime); // G5
    osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.12); // C6

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch (e) {
    // Audio safety
  }
};

// Audio synthesizer buzzer error
export const playBuzzerError = () => {
  try {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([280, 100, 280, 100, 350]);
    }

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const playBuzzPulse = (delaySec: number, durationSec: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(175, ctx.currentTime + delaySec);
      osc.frequency.linearRampToValueAtTime(115, ctx.currentTime + delaySec + durationSec);

      gain.gain.setValueAtTime(0.85, ctx.currentTime + delaySec);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delaySec + durationSec);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + delaySec);
      osc.stop(ctx.currentTime + delaySec + durationSec);
    };

    playBuzzPulse(0, 0.22);
    playBuzzPulse(0.26, 0.32);
  } catch (e) {
    // Audio safety
  }
};

// Suara konfirmasi sukses merdu
export const playSuccessChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const playTone = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0.35, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };

    playTone(523.25, 0, 0.12);     // C5
    playTone(659.25, 0.1, 0.12);    // E5
    playTone(783.99, 0.2, 0.25);    // G5
  } catch (e) {}
};

// Normalisasi string kode QR dari input kamera / USB scanner
export const parseCleanQrCode = (scannedRaw: string): string => {
  let cleanCode = scannedRaw.trim();
  // Tangani jika format QR adalah URL web (e.g. https://domain.com/u/SH0001)
  if (cleanCode.includes('/u/')) {
    const parts = cleanCode.split('/u/');
    if (parts.length >= 2) cleanCode = parts[1].split('?')[0].split('#')[0];
  } else if (cleanCode.includes('.')) {
    const parts = cleanCode.split('.');
    if (parts.length >= 2) cleanCode = parts[1];
  }

  cleanCode = cleanCode.toUpperCase().trim();
  // Batasi input maksimal 50 karakter agar aman dari memory leak (FIX 4)
  if (cleanCode.length > 50) cleanCode = cleanCode.substring(0, 50);
  return cleanCode;
};

// Query langsung ke Supabase peserta_santri & tamu_undangan + presensi_log
export const lookupAndBuildScanItem = async (cleanCode: string) => {
  // 1. Cek Peserta Santri (cocokkan dengan kolom 'kode' ATAU 'nis')
  const { data: santri } = await supabase
    .from('peserta_santri')
    .select('*')
    .or(`kode.eq.${cleanCode},nis.eq.${cleanCode}`)
    .maybeSingle();

  // 2. Jika tidak ada di santri, cek ke Tamu Undangan
  let tamu = null;
  if (!santri) {
    const resTamu = await supabase
      .from('tamu_undangan')
      .select('*')
      .eq('kode', cleanCode)
      .maybeSingle();
    tamu = resTamu.data;
  }

  // 3. Jika kode tidak terdaftar di Supabase
  if (!santri && !tamu) {
    return null;
  }

  const isSantri = !!santri;
  const entity = santri || tamu;
  const targetKode = entity.kode || entity.nis || cleanCode;

  // Single Source of Truth: Fetch live terpakai & pre-fill existing values from presensi_log
  const { data: presensiLogs } = await supabase
    .from('presensi_log')
    .select('jumlah_l, jumlah_p')
    .eq('kode_qr', targetKode);

  const existingL = (presensiLogs || []).reduce(
    (sum, r) => sum + Number(r.jumlah_l || 0),
    0
  );
  const existingP = (presensiLogs || []).reduce(
    (sum, r) => sum + Number(r.jumlah_p || 0),
    0
  );
  const terpakai = existingL + existingP;

  const kuotaDasar = isSantri
    ? Number(entity.kuota_dasar || 2)
    : ((entity.nama_putra && String(entity.nama_putra).trim() !== '') ? 1 : 0) +
      ((entity.nama_putri && String(entity.nama_putri).trim() !== '') ? 1 : 0);
  const kuotaTambahan = isSantri ? Number(entity.kuota_tambahan || 0) : 0;
  const totalKuota = kuotaDasar + kuotaTambahan;

  const sisa = Math.max(0, totalKuota - terpakai);

  const isBilGhoib = isSantri && (
    (entity.kategori_utama || '').toUpperCase().includes('BIL_GHOIB') ||
    (entity.kategori_utama || '').toUpperCase().includes('GHOIB') ||
    (entity.sub_kategori || '').toUpperCase().includes('GHOIB')
  );
  const isAlreadyGiven = Number(entity.tiket_panggung_diberi || 0) > 0;

  const itemObj: ScanActiveItem = {
    id: entity.id,
    kode: targetKode,
    tipe: isSantri ? 'KELUARGA' : 'UNDANGAN',
    nama: entity.nama,
    namaWali: isSantri ? (entity.nama_wali || '-') : (entity.instansi || entity.alamat || '-'),
    kategori: isSantri ? (entity.kategori_utama || 'BIL_GHOIB') : (entity.kategori || 'Tamu Undangan'),
    subKategori: entity.sub_kategori || 'Bil Ghoib',
    kelas: entity.kelas || '-',
    kamar: entity.kamar || '-',
    alamat: entity.alamat || 'Kediri',
    noHp: entity.no_hp || '-',
    isBilGhoib,
    kartuHitamGoldDiberi: isAlreadyGiven,
    santri: isSantri
      ? [
          {
            nama: entity.nama,
            kategoriUtama: entity.kategori_utama || 'BIL_GHOIB',
            subKategori: entity.sub_kategori || 'Bil Ghoib',
            kelas: entity.kelas || '-',
            kamar: entity.kamar || '-',
          },
        ]
      : null,
    entitas: {
      nama: entity.nama,
      namaWali: entity.nama_wali || entity.instansi || '-',
      kategori: entity.kategori || entity.kategori_utama || 'Tamu',
    },
    kuota: {
      id: entity.id,
      kodeQr: targetKode,
      kuotaDasar,
      kuotaTambahan,
      terpakai,
      tiketPanggungJatah: isBilGhoib ? 1 : 0,
      tiketPanggungDiberi: Number(entity.tiket_panggung_diberi || 0),
    },
  };

  return {
    itemObj,
    existingL,
    existingP,
    terpakai,
    totalKuota,
    sisa,
    isBilGhoib,
    isAlreadyGiven,
  };
};

// Update status Kartu Hitam Gold di Supabase beserta pencatatan Audit Log
export const updateKartuHitamGoldInDb = async (
  activeItem: ScanActiveItem,
  jalur: JalurPemeriksaan,
  giveCard: boolean
) => {
  const newVal = giveCard ? 1 : 0;
  const { error } = await supabase
    .from('peserta_santri')
    .update({ tiket_panggung_diberi: newVal })
    .eq('id', activeItem.id);

  if (error) throw error;

  await logAudit({
    panitia_id: jalur === 'BARAT' ? 'PETUGAS_PUTRA' : 'PETUGAS_PUTRI',
    panitia_role: 'PENJAGA_GERBANG',
    aksi: giveCard ? 'CHECK_KARTU_HITAM_GOLD' : 'UNCHECK_KARTU_HITAM_GOLD',
    tabel: 'peserta_santri',
    kode: activeItem.kode,
    nama: activeItem.nama,
    field: 'tiket_panggung_diberi',
    nilai_lama: giveCard ? '0' : '1',
    nilai_baru: giveCard ? '1' : '0',
    catatan: giveCard
      ? 'Diberikan Kartu Hitam Gold via Scanner Gerbang'
      : 'Reset/Uncheck Kartu Hitam Gold via Scanner Gerbang',
  });
};
