export interface WaUndanganTemplateParams {
  nama_wali: string;
  nama_santri: string;
  kode_undangan: string;
  link_grup_wa?: string | null;
  variationIndex?: number;
}

const PEMBUKA: Array<(nama: string) => string> = [
  (nama) => `Assalamu'alaikum Bapak/Ibu Wali Santri *${nama}*`,
  (nama) => `Kepada Yth. *Bapak/Ibu Wali Santri ${nama}*`,
  (nama) => `Yth. Bapak/Ibu *${nama}*`,
  (nama) => `Dengan hormat, Bapak/Ibu *${nama}*`,
];

const PENGANTAR = [
  'Dengan memohon rahmat dan ridha Allah SWT, kami mengundang Bapak/Ibu untuk menghadiri:',
  'Dalam rangka tasyakuran akhirussanah, kami bermaksud mengundang Bapak/Ibu untuk hadir pada:',
  'Mengharap kehadiran Bapak/Ibu pada acara:',
] as const;

const BULLET = ['-', '•', '*', '▪'] as const;

const FORMAT_TANGGAL = [
  'Sabtu, 24 Rajab 1448 H. / 02 Januari 2027 M.',
  '24 Rajab 1448 H. / 02 Jan 2027',
] as const;

const FORMAT_WAKTU = [
  '06.30 WIB – selesai',
  'Pukul 06.30 WIB s.d. selesai',
] as const;

const FORMAT_TEMPAT = [
  'Aula Muktamar Pondok Pesantren Lirboyo Kediri',
  'Aula Al-Muktamar PP. Lirboyo Kediri',
] as const;

const INSTRUKSI_LINK = [
  'Undangan digital resmi, konfirmasi kehadiran, dan QR Code gerbang masuk:',
  'Silakan akses portal undangan digital, isi konfirmasi kehadiran, dan simpan QR Code Anda:',
] as const;

const INSTRUKSI_QR = [
  'Mohon *QR Code disimpan dan ditunjukkan kepada petugas* saat memasuki lokasi acara.',
  'Pastikan *QR Code tersimpan* untuk ditunjukkan kepada petugas gerbang saat tiba di lokasi.',
] as const;

const PENUTUP = [
  'Atas perhatian dan kehadirannya, kami sampaikan terima kasih. Jazakumullahu khairan katsiran.',
  'Merupakan suatu kehormatan bagi kami apabila Bapak/Ibu berkenan hadir. Terima kasih.',
  'Kami tunggu kehadiran Bapak/Ibu. Jazakumullahu khairan katsiran.',
  'Demikian undangan ini kami sampaikan. Terima kasih atas kerja samanya.',
] as const;

let lastPembukaIdx = -1;
let lastBulletIdx = -1;
let lastPenutupIdx = -1;

function pickRandomIndex(length: number, lastIdx?: number): number {
  if (length <= 1) return 0;
  let idx = Math.floor(Math.random() * length);
  if (typeof lastIdx === 'number' && lastIdx >= 0 && idx === lastIdx) {
    idx = (idx + 1 + Math.floor(Math.random() * (length - 1))) % length;
  }
  return idx;
}

function pickFromSpintax<T>(
  options: readonly T[],
  fixedIndex?: number
): T {
  if (typeof fixedIndex === 'number' && fixedIndex >= 0) {
    return options[fixedIndex % options.length];
  }
  return options[Math.floor(Math.random() * options.length)];
}

export function resolveUndanganDigitalLink(kodeUndangan: string): string {
  const liveDomain =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://haflahp3tq.site';
  const origin =
    typeof window !== 'undefined' &&
    !window.location.hostname.includes('localhost') &&
    !window.location.hostname.includes('127.0.0.1')
      ? window.location.origin
      : liveDomain;
  const cleanKode = (kodeUndangan || '').trim();
  return `${origin}/u/${cleanKode}`;
}

/**
 * Menghasilkan pesan undangan WhatsApp tahap pertama (Reply-First Gate) dengan Full-Body Spintax acak.
 * Pesan pertama sengaja hanya memuat link undangan digital TANPA Link Grup WA.
 */
export function generateRandomWaUndanganMessage(
  params: WaUndanganTemplateParams
): string {
  const namaWali = (params.nama_wali || 'Wali Santri').trim() || 'Wali Santri';
  const namaSantri = (params.nama_santri || '-').trim() || '-';
  const linkUndanganDigital = resolveUndanganDigitalLink(params.kode_undangan);

  const fixedIdx =
    typeof params.variationIndex === 'number' && params.variationIndex >= 0
      ? params.variationIndex
      : undefined;

  let pembukaIdx: number;
  let bulletIdx: number;
  let penutupIdx: number;

  if (fixedIdx !== undefined) {
    pembukaIdx = fixedIdx % PEMBUKA.length;
    bulletIdx = fixedIdx % BULLET.length;
    penutupIdx = fixedIdx % PENUTUP.length;
  } else {
    pembukaIdx = pickRandomIndex(PEMBUKA.length, lastPembukaIdx);
    bulletIdx = pickRandomIndex(BULLET.length, lastBulletIdx);
    penutupIdx = pickRandomIndex(PENUTUP.length, lastPenutupIdx);
    lastPembukaIdx = pembukaIdx;
    lastBulletIdx = bulletIdx;
    lastPenutupIdx = penutupIdx;
  }

  const pembuka = PEMBUKA[pembukaIdx](namaWali);
  const pengantar = pickFromSpintax(PENGANTAR, fixedIdx);
  const bullet = BULLET[bulletIdx];
  const tanggal = pickFromSpintax(FORMAT_TANGGAL, fixedIdx);
  const waktu = pickFromSpintax(FORMAT_WAKTU, fixedIdx);
  const tempat = pickFromSpintax(FORMAT_TEMPAT, fixedIdx);
  const instruksiLink = pickFromSpintax(INSTRUKSI_LINK, fixedIdx);
  const instruksiQr = pickFromSpintax(INSTRUKSI_QR, fixedIdx);
  const penutup = PENUTUP[penutupIdx];

  return `${pembuka}

${pengantar}

*HAUL & HAFLAH AKHIRUSSANAH*
Pondok Pesantren Putri Tahfizhil Qur-an (P3TQ) dan Madrasah Hidayatul Mubtadi-aat Fittahfizhi Wal Qiro-at (MHMTQ) 1448 H./2027 M.

${bullet} *Hari/Tanggal:* ${tanggal}
${bullet} *Waktu:* ${waktu}
${bullet} *Tempat:* ${tempat}
${bullet} *Shohibul Hajat:* *${namaSantri}*

${instruksiLink}
*${linkUndanganDigital}*

${instruksiQr}

${penutup}

Wassalamu’alaikum warahmatullahi wabarakatuh
*Panitia Haul & Haflah P3TQ dan MHMTQ 1448 H./2027 M.*`;
}

export interface WaGroupReplyTemplateParams {
  nama_wali?: string | null;
  nama_santri?: string | null;
  link_grup_wa: string;
}

const GROUP_REPLY_VARIATIONS: Array<(namaWali: string, linkGrup: string) => string> = [
  (namaWali, linkGrup) =>
    `Terima kasih Bapak/Ibu *${namaWali}*. \n\nInfo/pengumuman terbaru, bergabung di grup WhatsApp resmi wali santri:\n*${linkGrup}*`,
  (namaWali, linkGrup) =>
    `Alhamdulillah, pesan Bapak/Ibu *${namaWali}* telah kami terima. \n\nSilakan bergabung di grup WhatsApp resmi wali santri untuk info terbaru seputar acara:\n*${linkGrup}*`,
  (namaWali, linkGrup) =>
    `Baik Bapak/Ibu *${namaWali}*, terima kasih atas responsnya. \n\nInfo/pengumuman terbaru, bergabung di grup WhatsApp resmi wali santri:\n*${linkGrup}*`,
  (namaWali, linkGrup) =>
    `Terima kasih atas konfirmasinya Bapak/Ibu *${namaWali}*. \n\nSilahkan bergabung di grup WhatsApp resmi wali santri untuk mendapatkan pengumuman terbaru:\n*${linkGrup}*`,
];

let lastGroupReplyIdx = -1;

/**
 * Memilih 1 dari 4 variasi balasan otomatis Webhook Fonnte berisi Link Grup WA resmi Wali Santri.
 */
export function generateRandomWaGroupReplyMessage(
  params: WaGroupReplyTemplateParams
): string {
  const cleanWali = (params.nama_wali || '').trim();
  const cleanSantri = (params.nama_santri || '').trim();
  const displayName =
    cleanWali && cleanWali !== '-'
      ? cleanWali
      : cleanSantri && cleanSantri !== '-'
      ? cleanSantri
      : 'Wali Santri';
  const cleanLink = (params.link_grup_wa || '').trim();

  const pickedIdx = pickRandomIndex(GROUP_REPLY_VARIATIONS.length, lastGroupReplyIdx);
  lastGroupReplyIdx = pickedIdx;

  return GROUP_REPLY_VARIATIONS[pickedIdx](displayName, cleanLink);
}
