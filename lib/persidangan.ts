import { supabase } from '@/lib/supabase';

export type PersidanganStatus = 'DRAFT' | 'AKTIF' | 'SELESAI';

export interface Persidangan {
  id: string;
  slug: string;
  token: string;
  prefix_kode?: string | null;
  judul: string;
  deskripsi?: string | null;
  tanggal?: string | null; // YYYY-MM-DD
  waktu?: string | null;
  tempat?: string | null;
  agenda?: string | null;
  pdf_url?: string | null;
  jpg_urls?: string[] | null;
  template_wa?: string | null;
  status: PersidanganStatus;
  created_at?: string;
  updated_at?: string;
}

export type StatusKirimWa = 'BELUM' | 'TERKIRIM' | 'GAGAL';
export type StatusKehadiran = 'BELUM' | 'HADIR';

export interface PersidanganPeserta {
  id: string;
  persidangan_id: string;
  kode_peserta?: string | null;
  status_kehadiran?: StatusKehadiran | null;
  waktu_hadir?: string | null;
  nama: string;
  no_wa: string;
  kategori?: string | null;
  status_kirim: StatusKirimWa;
  waktu_kirim?: string | null;
  error_msg?: string | null;
  created_at?: string;
}

export const DEFAULT_TEMPLATE_WA = `Assalamu'alaikum Wr. Wb. Bapak [NAMA_PESERTA],

Kami atas nama Panitia Haul & Haflah Akhirussanah P3TQ & MHMTQ Lirboyo mengundang Bapak untuk hadir dalam [JUDUL_PERSIDANGAN].

Undangan resmi selengkapnya dapat dibuka melalui tautan berikut:

[LINK_UNDANGAN]

Wassalamu'alaikum Wr. Wb.
Panitia Haul & Haflah 2027

| Dikirim via haflahp3tq.site`;

/**
 * Normalisasi nomor WhatsApp:
 * - Mulai "08"  -> replace jadi "628"
 * - Mulai "+62" -> replace jadi "62"
 * - Mulai "8"   -> tambahkan prefix "62"
 */
export function normalizePhoneNumber(raw: string): string {
  if (!raw) return '';
  let cleaned = String(raw).replace(/[^0-9+]/g, '').trim();
  if (cleaned.startsWith('+62')) {
    cleaned = '62' + cleaned.slice(3);
  } else if (cleaned.startsWith('08')) {
    cleaned = '628' + cleaned.slice(2);
  } else if (cleaned.startsWith('8')) {
    cleaned = '628' + cleaned.slice(1);
  }
  cleaned = cleaned.replace(/\+/g, '');
  return cleaned;
}

/**
 * Generate slug dari teks judul:
 * Lowercase, ganti spasi dengan dash, hapus non-alphanumeric selain dash.
 * Contoh: "Sidang Harian 2" -> "sidang-harian-2"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate unique slug di tabel persidangan
 */
export async function generateSlug(judul: string): Promise<string> {
  const baseSlug = slugify(judul) || 'persidangan';
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const { data } = await supabase
      .from('persidangan')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (!data) {
      break;
    }
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
}

/**
 * Generate random 32 character token (UUID tanpa dash)
 */
export function generateToken(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '');
  }
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Format tanggal Indonesia: contoh "Sabtu, 12 Juli 2026"
 */
export function formatTanggalIndo(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, monthIndex, day);
      const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'][date.getDay()];
      const bulan = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ][monthIndex];
      return `${hari}, ${day} ${bulan} ${year}`;
    }
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'][date.getDay()];
    const bulan = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ][date.getMonth()];
    return `${hari}, ${date.getDate()} ${bulan} ${date.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

/**
 * Dapatkan live base URL sistem
 */
export function getLiveBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  return 'https://haflahp3tq.site';
}

/**
 * Dapatkan URL publik resmi persidangan: https://haflahp3tq.site/persidangan/[slug]
 * Jika memiliki kode peserta unik, tambahkan query parameter ?to=[kode_peserta]
 */
export function getPublicPersidanganUrl(
  slug: string,
  customBaseUrl?: string,
  kodePeserta?: string | null
): string {
  const base = customBaseUrl || 'https://haflahp3tq.site';
  const url = `${base}/persidangan/${slug}`;
  if (kodePeserta) {
    return `${url}?to=${encodeURIComponent(kodePeserta)}`;
  }
  return url;
}

/**
 * Replace placeholder template WA dengan data aktual
 * Menghubungkan [LINK_UNDANGAN] ke halaman resmi https://haflahp3tq.site/persidangan/{slug}?to={kode_peserta}
 */
export function buildMessageFromTemplate(
  template: string,
  peserta: { nama: string; no_wa?: string; kode_peserta?: string | null },
  persidangan: {
    judul: string;
    slug: string;
    pdf_url?: string | null;
  },
  baseUrl?: string
): string {
  const publicUrl = getPublicPersidanganUrl(persidangan.slug, baseUrl, peserta.kode_peserta);

  let msg = template || DEFAULT_TEMPLATE_WA;
  msg = msg.replace(/\[NAMA_PESERTA\]/g, peserta.nama || '');
  msg = msg.replace(/\[JUDUL_PERSIDANGAN\]/g, persidangan.judul || '');
  msg = msg.replace(/\[LINK_UNDANGAN\]/g, publicUrl);
  msg = msg.replace(/\[LINK_PDF_LANGSUNG\]/g, publicUrl);

  return msg;
}

/**
 * Kirim pesan WhatsApp via gateway Fonnte
 */
export async function sendWhatsApp(
  no_wa: string,
  pesan: string
): Promise<{ ok: boolean; message?: string }> {
  const normalizedTarget = normalizePhoneNumber(no_wa);
  if (!normalizedTarget || normalizedTarget.length < 9) {
    return { ok: false, message: 'Nomor WhatsApp tidak valid' };
  }

  // Client-side call: gunakan proxy internal Next.js
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: normalizedTarget,
          message: pesan,
        }),
      });
      const data = await res.json();
      return { ok: data.ok === true || data.data?.status === true, message: data.message || data.data?.reason };
    } catch (err: any) {
      return { ok: false, message: err.message || 'Gagal mengirim pesan via gateway WhatsApp' };
    }
  }

  // Server-side call: langsung panggil API Fonnte
  try {
    const token = process.env.FONNTE_API_KEY || process.env.FONNTE_TOKEN || 'qUYeuFbxZZPoTT6cniAj';
    const formData = new FormData();
    formData.append('target', normalizedTarget);
    formData.append('message', pesan);
    formData.append('countryCode', '62');

    const res = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: token,
      },
      body: formData,
    });
    const result = await res.json();
    return { ok: result.status === true, message: result.reason || result.message };
  } catch (err: any) {
    return { ok: false, message: err.message || 'Gagal memanggil API Fonnte' };
  }
}

// =========================================================================
// SUPABASE CRUD PERSIDANGAN
// =========================================================================

export async function getPersidanganList(): Promise<Persidangan[]> {
  const { data, error } = await supabase
    .from('persidangan')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching persidangan list:', error);
    return [];
  }
  return (data || []) as Persidangan[];
}

export async function getPersidanganById(id: string): Promise<Persidangan | null> {
  const { data, error } = await supabase
    .from('persidangan')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    console.error('Error fetching persidangan by id:', error);
    return null;
  }
  return data as Persidangan;
}

export async function getPersidanganBySlug(slug: string): Promise<Persidangan | null> {
  if (!slug) return null;

  const { data, error } = await supabase
    .from('persidangan')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) {
    return null;
  }
  return data as Persidangan;
}

/**
 * Generate sequential participant code with persidangan prefix:
 * Example: SD30001, SD30002, SN0001
 */
export async function generateKodePeserta(
  persidanganId: string,
  prefixKode?: string | null
): Promise<string> {
  const prefix = (prefixKode || 'SD').trim().toUpperCase();
  const { data, error } = await supabase
    .from('persidangan_peserta')
    .select('kode_peserta')
    .eq('persidangan_id', persidanganId);

  if (error || !data || data.length === 0) {
    return `${prefix}0001`;
  }

  let maxSeq = 0;
  const regex = new RegExp(`^${prefix}(\\d+)$`, 'i');

  for (const row of data) {
    if (!row.kode_peserta) continue;
    const match = row.kode_peserta.match(regex);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  const nextSeq = maxSeq + 1;
  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

/**
 * Generate a sequential batch of participant codes with persidangan prefix:
 * Example for 3 participants: [SD30001, SD30002, SD30003]
 */
export async function generateBatchKodePeserta(
  persidanganId: string,
  prefixKode: string | null | undefined,
  count: number
): Promise<string[]> {
  if (count <= 0) return [];
  const prefix = (prefixKode || 'SD').trim().toUpperCase();
  const { data } = await supabase
    .from('persidangan_peserta')
    .select('kode_peserta')
    .eq('persidangan_id', persidanganId);

  let maxSeq = 0;
  const regex = new RegExp(`^${prefix}(\\d+)$`, 'i');

  if (data && data.length > 0) {
    for (const row of data) {
      if (!row.kode_peserta) continue;
      const match = row.kode_peserta.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
  }

  const codes: string[] = [];
  for (let i = 1; i <= count; i++) {
    const nextSeq = maxSeq + i;
    codes.push(`${prefix}${String(nextSeq).padStart(4, '0')}`);
  }
  return codes;
}

export async function createPersidangan(
  data: Partial<Persidangan> & { judul: string }
): Promise<{ data: Persidangan | null; error: any }> {
  const slug = data.slug || (await generateSlug(data.judul));
  const token = data.token || generateToken();
  const template_wa = data.template_wa || DEFAULT_TEMPLATE_WA;
  const status: PersidanganStatus = data.status || 'AKTIF';
  const tanggal = data.tanggal || new Date().toISOString().split('T')[0];
  const prefix_kode = data.prefix_kode ? data.prefix_kode.trim().toUpperCase() : null;

  const insertPayload = {
    slug,
    token,
    prefix_kode,
    judul: data.judul,
    deskripsi: data.deskripsi || null,
    tanggal,
    waktu: data.waktu || null,
    tempat: data.tempat || null,
    agenda: data.agenda || null,
    pdf_url: data.pdf_url || null,
    template_wa,
    status,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: created, error } = await supabase
    .from('persidangan')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) {
    console.error('Error creating persidangan:', error);
    return { data: null, error };
  }
  return { data: created as Persidangan, error: null };
}

export async function updatePersidangan(
  id: string,
  updates: Partial<Persidangan>
): Promise<{ data: Persidangan | null; error: any }> {
  const updatePayload: any = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  if (updates.prefix_kode !== undefined) {
    updatePayload.prefix_kode = updates.prefix_kode ? updates.prefix_kode.trim().toUpperCase() : null;
  }

  const { data, error } = await supabase
    .from('persidangan')
    .update(updatePayload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating persidangan:', error);
    return { data: null, error };
  }
  return { data: data as Persidangan, error: null };
}

export async function deletePersidangan(id: string): Promise<{ error: any }> {
  const { error } = await supabase.from('persidangan').delete().eq('id', id);
  if (error) {
    console.error('Error deleting persidangan:', error);
    return { error };
  }
  return { error: null };
}

// =========================================================================
// SUPABASE CRUD PESERTA
// =========================================================================

export async function getPesertaList(persidanganId: string): Promise<PersidanganPeserta[]> {
  const { data, error } = await supabase
    .from('persidangan_peserta')
    .select('*')
    .eq('persidangan_id', persidanganId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching persidangan peserta:', error);
    return [];
  }
  return (data || []) as PersidanganPeserta[];
}

export async function addPeserta(
  data: Omit<PersidanganPeserta, 'id' | 'created_at'>
): Promise<{ data: PersidanganPeserta | null; error: any }> {
  const payload = {
    persidangan_id: data.persidangan_id,
    kode_peserta: data.kode_peserta || null,
    status_kehadiran: data.status_kehadiran || 'BELUM',
    waktu_hadir: data.waktu_hadir || null,
    nama: data.nama,
    no_wa: normalizePhoneNumber(data.no_wa),
    kategori: data.kategori || null,
    status_kirim: data.status_kirim || 'BELUM',
    waktu_kirim: data.waktu_kirim || null,
    error_msg: data.error_msg || null,
    created_at: new Date().toISOString(),
  };

  const { data: created, error } = await supabase
    .from('persidangan_peserta')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    console.error('Error adding peserta:', error);
    return { data: null, error };
  }
  return { data: created as PersidanganPeserta, error: null };
}

export async function addPesertaBatch(
  items: Array<Omit<PersidanganPeserta, 'id' | 'created_at'>>
): Promise<{ count: number; error: any }> {
  if (items.length === 0) return { count: 0, error: null };

  const payload = items.map((item) => ({
    persidangan_id: item.persidangan_id,
    kode_peserta: item.kode_peserta || null,
    status_kehadiran: item.status_kehadiran || 'BELUM',
    waktu_hadir: item.waktu_hadir || null,
    nama: item.nama,
    no_wa: normalizePhoneNumber(item.no_wa),
    kategori: item.kategori || null,
    status_kirim: item.status_kirim || 'BELUM',
    waktu_kirim: item.waktu_kirim || null,
    error_msg: item.error_msg || null,
    created_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from('persidangan_peserta')
    .insert(payload)
    .select('id');

  if (error) {
    console.error('Error batch adding peserta:', error);
    return { count: 0, error };
  }
  return { count: data?.length || 0, error: null };
}

export async function updatePeserta(
  id: string,
  updates: Partial<PersidanganPeserta>
): Promise<{ data: PersidanganPeserta | null; error: any }> {
  const payload: any = { ...updates };
  if (updates.no_wa) {
    payload.no_wa = normalizePhoneNumber(updates.no_wa);
  }

  const { data, error } = await supabase
    .from('persidangan_peserta')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating peserta:', error);
    return { data: null, error };
  }
  return { data: data as PersidanganPeserta, error: null };
}

export async function deletePeserta(id: string): Promise<{ error: any }> {
  const { error } = await supabase.from('persidangan_peserta').delete().eq('id', id);
  if (error) {
    console.error('Error deleting peserta:', error);
    return { error };
  }
  return { error: null };
}

export async function deletePesertaBatch(ids: string[]): Promise<{ error: any }> {
  if (ids.length === 0) return { error: null };
  const { error } = await supabase.from('persidangan_peserta').delete().in('id', ids);
  if (error) {
    console.error('Error batch deleting peserta:', error);
    return { error };
  }
  return { error: null };
}

// =========================================================================
// STORAGE UPLOAD HELPER
// =========================================================================

export async function uploadPersidanganPdf(
  file: File,
  persidanganId: string
): Promise<{ publicUrl: string | null; error: any }> {
  try {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${persidanganId}/${Date.now()}_${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('undangan-pdf')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return { publicUrl: null, error: uploadError };
    }

    const { data: urlData } = supabase.storage
      .from('undangan-pdf')
      .getPublicUrl(storagePath);

    return { publicUrl: urlData.publicUrl, error: null };
  } catch (err: any) {
    console.error('Exception during PDF upload:', err);
    return { publicUrl: null, error: err };
  }
}
