export interface WaUndanganTemplateParams {
  nama_wali: string;
  nama_santri: string;
  kode_undangan: string;
  link_grup_wa?: string | null;
  variationIndex?: number;
}

const VARIATIONS: Array<{
  buildOpening: (namaWali: string) => string;
  closing: string;
}> = [
  {
    buildOpening: (namaWali) => `Kepada Yth. *Bapak/Ibu Wali Santri ${namaWali}*`,
    closing:
      'Atas perhatian dan kehadirannya, kami sampaikan terima kasih. Jazakumullahu khairan katsiran.',
  },
  {
    buildOpening: (namaWali) => `Assalamu'alaikum Bapak/Ibu Wali Santri *${namaWali}*`,
    closing:
      'Merupakan suatu kehormatan bagi kami apabila Bapak/Ibu berkenan hadir. Terima kasih.',
  },
  {
    buildOpening: (namaWali) => `Yth. Bapak/Ibu *${namaWali}*`,
    closing: 'Kami tunggu kehadiran Bapak/Ibu. Jazakumullahu khairan katsiran.',
  },
  {
    buildOpening: (namaWali) => `Dengan hormat, Bapak/Ibu Wali Santri *${namaWali}*`,
    closing: 'Demikian undangan ini kami sampaikan. Terima kasih atas kerja samanya.',
  },
];

let lastPickedVariationIndex = -1;

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
 * Memilih 1 dari 4 variasi template undangan WA secara acak menggunakan Math.random()
 * dan menyisipkan blok Link Grup WA hanya jika link_grup_wa terisi.
 */
export function generateRandomWaUndanganMessage(
  params: WaUndanganTemplateParams
): string {
  const namaWali = (params.nama_wali || 'Wali Santri').trim() || 'Wali Santri';
  const namaSantri = (params.nama_santri || '-').trim() || '-';
  const linkUndanganDigital = resolveUndanganDigitalLink(params.kode_undangan);
  const trimmedLinkGrup = (params.link_grup_wa || '').trim();

  let pickedIdx: number;
  if (
    typeof params.variationIndex === 'number' &&
    params.variationIndex >= 0 &&
    params.variationIndex < VARIATIONS.length
  ) {
    pickedIdx = params.variationIndex;
  } else {
    pickedIdx = Math.floor(Math.random() * VARIATIONS.length);
    // Hindari memilih variasi yang persis sama dua kali berturut-turut saat kirim massal
    if (pickedIdx === lastPickedVariationIndex) {
      pickedIdx = (pickedIdx + 1 + Math.floor(Math.random() * (VARIATIONS.length - 1))) % VARIATIONS.length;
    }
    lastPickedVariationIndex = pickedIdx;
  }

  const chosen = VARIATIONS[pickedIdx];
  const opening = chosen.buildOpening(namaWali);
  const grupWaBlock = trimmedLinkGrup
    ? `\n\nInfo/pengumuman terbaru, bergabung di grup WhatsApp resmi wali santri:\n*${trimmedLinkGrup}*`
    : '';

  return `${opening}

Dengan memohon rahmat dan ridha Allah SWT, kami mengundang Bapak/Ibu untuk menghadiri:

*HAUL & HAFLAH AKHIRUSSANAH*
Pondok Pesantren Putri Tahfizhil Qur-an (P3TQ) dan Madrasah Hidayatul Mubtadi-aat Fittahfizhi Wal Qiro-at (MHMTQ) 1448 H./2027 M.

- *Hari/Tanggal:* Sabtu, 24 Rajab 1448 H. / 02 Januari 2027 M.
- *Waktu:* 06.30 WIB – selesai
- *Tempat:* Aula Muktamar Pondok Pesantren Lirboyo Kediri
- *Shohibul Hajat:* *${namaSantri}*

Undangan digital resmi, konfirmasi kehadiran, dan QR Code gerbang masuk:
*${linkUndanganDigital}*

Mohon *QR Code disimpan dan ditunjukkan kepada petugas* saat memasuki lokasi acara.${grupWaBlock}

${chosen.closing}

Wassalamu’alaikum warahmatullahi wabarakatuh
*Panitia Haul & Haflah P3TQ dan MHMTQ 1448 H./2027 M.*`;
}
