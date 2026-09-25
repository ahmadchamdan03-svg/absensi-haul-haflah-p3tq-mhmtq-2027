// =====================================================================
// UTILITAS TANDA TANGAN QR STATIS: HMAC-SHA256
// Format Muatan: HFL27.SH0042.9a3f1c7e (20 Karakter)
// =====================================================================

export const DEFAULT_EVENT_SLUG = 'HFL27';
export const DEFAULT_HMAC_KEY = 'p3tq_secret_hmac_key_2027';

// Implementasi fungsi HMAC-SHA256 8 karakter pertama
async function sha256HmacHex8(key: string, message: string): Promise<string> {
  // Jika di environment browser atau Node 15+ dengan crypto.subtle
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const msgData = encoder.encode(message);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    const hashArray = Array.from(new Uint8Array(signature));
    const fullHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return fullHex.substring(0, 8);
  }

  // Fallback sinkron berbasis hash sederhana untuk lingkungan tanpa WebCrypto
  let hash = 0;
  const combined = key + ':' + message;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return hex.substring(0, 8);
}

// Format muatan QR lengkap
export async function formatQrPayload(
  kodeSohibulHajat: string,
  eventSlug: string = DEFAULT_EVENT_SLUG,
  kunciEvent: string = DEFAULT_HMAC_KEY
): Promise<string> {
  const prefix = `${eventSlug}.${kodeSohibulHajat}`;
  const hmac = await sha256HmacHex8(kunciEvent, prefix);
  return `${prefix}.${hmac}`;
}

// Verifikasi keaslian muatan QR saat dipindai
export async function verifyQrPayload(
  payload: string,
  expectedSlug: string = DEFAULT_EVENT_SLUG,
  kunciEvent: string = DEFAULT_HMAC_KEY
): Promise<{ valid: boolean; slug: string; kode: string; reason?: string }> {
  if (!payload || typeof payload !== 'string') {
    return { valid: false, slug: '', kode: '', reason: 'FORMAT_KOSONG' };
  }

  const parts = payload.trim().split('.');
  if (parts.length !== 3) {
    return { valid: false, slug: '', kode: '', reason: 'FORMAT_TIDAK_SESUAI' };
  }

  const [slug, kode, signature] = parts;

  if (slug !== expectedSlug) {
    return { valid: false, slug, kode, reason: 'QR_ACARA_LAIN' };
  }

  const expectedHmac = await sha256HmacHex8(kunciEvent, `${slug}.${kode}`);
  if (signature.toLowerCase() !== expectedHmac.toLowerCase()) {
    return { valid: false, slug, kode, reason: 'TANDA_TANGAN_PALSU' };
  }

  return { valid: true, slug, kode };
}

// Format token portal publik: SH0042-9a3f1c7e
export async function generatePortalToken(
  kodeSohibulHajat: string,
  eventSlug: string = DEFAULT_EVENT_SLUG,
  kunciEvent: string = DEFAULT_HMAC_KEY
): Promise<string> {
  const prefix = `${eventSlug}.${kodeSohibulHajat}`;
  const hmac = await sha256HmacHex8(kunciEvent, prefix);
  return `${kodeSohibulHajat}-${hmac}`;
}

// Verifikasi token portal publik
export async function verifyPortalToken(
  token: string,
  eventSlug: string = DEFAULT_EVENT_SLUG,
  kunciEvent: string = DEFAULT_HMAC_KEY
): Promise<{ valid: boolean; kode: string }> {
  if (!token) return { valid: false, kode: '' };
  const parts = token.split('-');
  if (parts.length !== 2) return { valid: false, kode: '' };

  const [kode, hmac] = parts;
  const expectedHmac = await sha256HmacHex8(kunciEvent, `${eventSlug}.${kode}`);
  return {
    valid: hmac.toLowerCase() === expectedHmac.toLowerCase(),
    kode,
  };
}

// Normalisasi nomor telepon WhatsApp (08... -> 628...)
export function normalkanNomorHp(hp: string): string {
  const bersih = hp.replace(/[^0-9]/g, '');
  if (bersih.startsWith('62')) return bersih;
  if (bersih.startsWith('0')) return '62' + bersih.slice(1);
  if (bersih.startsWith('8')) return '62' + bersih;
  return bersih;
}

// Template Pesan Pengingat Konfirmasi Kehadiran Resmi Wali Santri
export function buatPesanPengingatKonfirmasi(
  namaSantri: string,
  kodeSantri: string,
  baseUrl?: string
): string {
  const origin =
    baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://haflah.p3tq.id');
  const linkPortal = `${origin}/u/${kodeSantri}`;
  return `Assalamu’alaikum Warahmatullahi Wabarakatuh.

Kepada Yth. Bapak/Ibu Wali Santri dari ananda *${namaSantri}*,

Sehubungan dengan pelaksanaan acara Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M., kami dari pihak panitia memohon konfirmasi kehadiran Bapak/Ibu beserta rombongan.

Guna keperluan pendataan dan persiapan akomodasi, mohon kesediaan Bapak/Ibu untuk mengisi formulir kehadiran melalui tautan berikut:
👉 ${linkPortal}

Atau melalui tautan yang telah kami kirimkan sebelumnya

Atas perhatian, kerja sama, dan kehadiran Bapak/Ibu, kami haturkan terima kasih. Jazakumullah khairan katsiran.

Wassalamu’alaikum Warahmatullahi Wabarakatuh.

*Panitia Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.*`;
}
