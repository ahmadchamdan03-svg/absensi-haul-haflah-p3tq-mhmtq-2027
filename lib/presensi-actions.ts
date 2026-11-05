import { supabase } from '@/lib/supabase/client';
import { calculateKuotaDasarSantri, cleanKategoriTamatan } from '@/lib/types';
import { ScanActiveItem, playSuccessChime, playBuzzerError } from '@/components/petugas/scan/types';
import confetti from 'canvas-confetti';
export { upsertPresensiLog, syncKuotaTerpakai } from '@/lib/presensi-helper';

/**
 * Ekstraksi kode peserta bersih dari berbagai format QR:
 * - Kode mentah: SHFV1Y / UND0103
 * - Payload HMAC: HFL27.SHFV1Y.9a3f1c7e
 * - URL portal: https://domain/u/SHFV1Y atau /u/SHFV1Y-9a3f1c7e?x=1
 * - Token portal: SHFV1Y-9a3f1c7e
 */
export function extractCleanScanCode(scannedRaw: string): string {
  let raw = (scannedRaw || '')
    .replace(/[\x00-\x1F\x7F]+/g, '')
    .replace(/^\][A-Za-z][0-9]/, '') // Prefix AIM symbology identifier (misal "]Q1") dari sebagian scanner 2D
    .trim();

  if (!raw) return '';

  const urlPathMatch = raw.match(/\/(?:u|beli|s)\/([^/?#\s]+)/i);
  if (urlPathMatch && urlPathMatch[1]) {
    try {
      raw = decodeURIComponent(urlPathMatch[1]).trim();
    } catch {
      raw = urlPathMatch[1].trim();
    }
  } else if (raw.includes('.')) {
    const dotParts = raw.split('.').map((p) => p.trim()).filter(Boolean);
    if (dotParts.length >= 2 && !/^https?:/i.test(dotParts[0])) {
      raw = dotParts[1];
    }
  }

  // Buang suffix tanda tangan portal 8-hex (SHFV1Y-9a3f1c7e -> SHFV1Y)
  const signedPortalMatch = raw.match(/^(.+?)-[0-9a-f]{8}$/i);
  if (signedPortalMatch && signedPortalMatch[1]) {
    raw = signedPortalMatch[1];
  }

  return raw.toUpperCase().trim();
}

/**
 * Mengambil data peserta santri atau tamu undangan dari Supabase beserta kalkulasi kuota live
 * Menggunakan Promise.all paralel untuk mengurangi network waterfall dari 3x menjadi 1x roundtrip.
 */
export async function fetchPesertaByCode(cleanCode: string): Promise<{
  itemObj: ScanActiveItem;
  totalKuota: number;
  terpakai: number;
  sisa: number;
  isBilGhoib: boolean;
  isAlreadyGiven: boolean;
}> {
  // Query paralel ke peserta_santri, tamu_undangan, dan presensi_log sekaligus
  const [resSantri, resTamu, resLogs] = await Promise.all([
    supabase
      .from('peserta_santri')
      .select('*')
      .or(`kode.eq.${cleanCode},nis.eq.${cleanCode}`)
      .maybeSingle(),
    supabase
      .from('tamu_undangan')
      .select('*')
      .eq('kode', cleanCode)
      .maybeSingle(),
    supabase
      .from('presensi_log')
      .select('id, jumlah_l, jumlah_p, jumlah_balita, tiket_panggung, created_at')
      .eq('kode_qr', cleanCode),
  ]);

  if (resSantri.error) {
    throw new Error(`Gagal memeriksa data peserta santri (${resSantri.error.message})`);
  }
  if (resTamu.error) {
    throw new Error(`Gagal memeriksa data tamu undangan (${resTamu.error.message})`);
  }
  if (resLogs.error) {
    throw new Error(`Gagal membaca log presensi (${resLogs.error.message})`);
  }

  const santri = resSantri.data;
  const tamu = resTamu.data;

  // Jika kode tidak terdaftar di Supabase
  if (!santri && !tamu) {
    throw new Error(`Kode QR "${cleanCode}" TIDAK TERDAFTAR dalam basis data!`);
  }

  const isSantri = !!santri;
  const entity = santri || tamu;
  const targetKode = entity.kode || entity.nis || cleanCode;
  const presensiLogs = resLogs.data || [];

  const existingL = presensiLogs.reduce(
    (sum, r) => sum + Number(r.jumlah_l || 0),
    0
  );
  const existingP = presensiLogs.reduce(
    (sum, r) => sum + Number(r.jumlah_p || 0),
    0
  );
  const terpakai = existingL + existingP;

  const kuotaDasar = isSantri
    ? Math.max(Number(entity.kuota_dasar || 0), calculateKuotaDasarSantri(entity.kategori_utama, entity.sub_kategori))
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

  const resolvedKategori = isSantri
    ? (entity.sub_kategori || entity.kategori_utama || 'Bil Ghoib')
    : (entity.kategori || 'Tamu Undangan');

  const itemObj: ScanActiveItem = {
    id: entity.id,
    kode: targetKode,
    tipe: isSantri ? 'KELUARGA' : 'UNDANGAN',
    nama: entity.nama,
    namaWali: isSantri ? (entity.nama_wali || '-') : (entity.instansi || entity.alamat || '-'),
    kategori: resolvedKategori,
    subKategori: cleanKategoriTamatan(entity.sub_kategori) || (isSantri ? 'Bil Ghoib' : entity.kategori || 'Tamu'),
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
            subKategori: cleanKategoriTamatan(entity.sub_kategori) || 'Bil Ghoib',
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
      terpakaiL: existingL,
      terpakaiP: existingP,
      terpakaiBalita: presensiLogs.reduce((sum, r) => sum + Number(r.jumlah_balita || 0), 0),
      existingLogId: presensiLogs[0]?.id,
      tiketPanggungJatah: isBilGhoib ? 1 : 0,
      tiketPanggungDiberi: Number(entity.tiket_panggung_diberi || 0),
    },
  };

  return {
    itemObj,
    totalKuota,
    terpakai,
    sisa,
    isBilGhoib,
    isAlreadyGiven,
  };
}

/**
 * Trigger visual confetti dan audio chime sukses
 */
export function triggerSuccessPresensiEffect() {
  playSuccessChime();
  confetti({
    particleCount: 70,
    spread: 60,
    origin: { y: 0.7 },
    colors: ['#F5C26B', '#4A7BB0', '#F4EFE6', '#ffffff'],
  });
}
