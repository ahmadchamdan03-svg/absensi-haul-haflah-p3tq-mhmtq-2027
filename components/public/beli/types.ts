export interface BeliStatusMsg {
  tipe: 'success' | 'error';
  text: string;
}

export const PANITIA_WA_NUMBER = '6285181805377';

export function formatRupiahRibuan(amount: number): string {
  return Math.round(Number(amount || 0))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function buildBeliKuotaWaMessage(params: {
  namaSantri: string;
  kodePesanan: string;
  jumlahKursi: number;
  totalBayar: number;
}): string {
  const namaSantri = (params.namaSantri || '-').trim();
  const kodePesanan = (params.kodePesanan || '-').trim();
  const jumlahKursi = Number(params.jumlahKursi || 0);
  const totalBayar = formatRupiahRibuan(params.totalBayar);

  return [
    '*!Pembelian Kuota Tambahan*',
    "Assalamu'alaikum wr. wb.",
    '',
    `Saya Walisantri dari Shohibul Hajat ${namaSantri}.`,
    '',
    'Saya telah mengunggah bukti transfer untuk pembelian kuota tambahan:',
    '',
    `ID Pesanan: ${kodePesanan}`,
    '',
    `Jumlah: ${jumlahKursi} Kursi`,
    '',
    `Total Bayar: Rp ${totalBayar}`,
    '',
    'Mohon segera dikonfirmasi. Terima kasih.',
  ].join('\n');
}

export function buildBeliKuotaWaUrl(params: {
  namaSantri: string;
  kodePesanan: string;
  jumlahKursi: number;
  totalBayar: number;
}): string {
  const encodedMessage = encodeURIComponent(buildBeliKuotaWaMessage(params));
  return `https://wa.me/${PANITIA_WA_NUMBER}?text=${encodedMessage}`;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export function formatTanggalIndo(isoString?: string) {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return (
      d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }) +
      ', ' +
      d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }) +
      ' WIB'
    );
  } catch (e) {
    return isoString;
  }
}
