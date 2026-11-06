export function generateRandomKode(prefix: string): string {
  const rawChars = Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase()
    .padEnd(4, '8')
    .replace(/O/g, '8')
    .replace(/I/g, '9');
  return `${prefix}${rawChars}`;
}

export function normalizePortalToken(rawToken: string): string {
  const trimmed = (rawToken || '').trim().toUpperCase();
  const legacyUndMatch = trimmed.match(/^(UND-[A-Z0-9]+)/i);
  if (legacyUndMatch) {
    return legacyUndMatch[1].toUpperCase();
  }
  return (trimmed.split('-')[0] || '').trim();
}

export function isValidKodeUndangan(cleanKode: string): boolean {
  return /^(SH|UND-?)[A-Z0-9]+$/i.test((cleanKode || '').trim());
}

export function getAmbiguousKodeVariants(kode: string): string[] {
  const clean = (kode || '').toUpperCase().trim();
  const match = clean.match(/^(SH|UND-?)([A-Z0-9]+)$/);
  if (!match) return [clean];
  const [, prefix, suffix] = match;
  const variants = new Set<string>([clean]);
  // Generate combinations swapping 0 <-> O and 1 <-> I in the suffix
  const chars = suffix.split('');
  const helper = (idx: number, current: string) => {
    if (idx === chars.length) {
      variants.add(`${prefix}${current}`);
      return;
    }
    const ch = chars[idx];
    helper(idx + 1, current + ch);
    if (ch === '0') helper(idx + 1, current + 'O');
    else if (ch === 'O') helper(idx + 1, current + '0');
    else if (ch === '1') helper(idx + 1, current + 'I');
    else if (ch === 'I') helper(idx + 1, current + '1');
  };
  helper(0, '');
  return Array.from(variants);
}

export async function generateUniqueKodeFromDb(
  prefix: 'SH' | 'UND',
  tableName: 'peserta_santri' | 'tamu_undangan',
  supabaseClient: any,
  localSet?: Set<string>
): Promise<string> {
  let kodeBaru = generateRandomKode(prefix);
  for (let attempt = 0; attempt < 25; attempt++) {
    if (localSet && localSet.has(kodeBaru)) {
      kodeBaru = generateRandomKode(prefix);
      continue;
    }
    const { data } = await supabaseClient
      .from(tableName)
      .select('kode')
      .eq('kode', kodeBaru)
      .maybeSingle();
    if (!data) {
      return kodeBaru;
    }
    kodeBaru = generateRandomKode(prefix);
  }
  return kodeBaru;
}

/**
 * Format string ke Title Case (Kapital di awal kata, kecil di tengah)
 * Contoh: "bapak muhammad robi'ul huda" -> "Bapak Muhammad Robi'ul Huda"
 */
export function formatTitleCase(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/(^|[\s\(\)\-\/])([a-z0-9])/g, (_, p, c) => p + c.toUpperCase());
}

/**
 * Format nama tamu undangan dengan Title Case dan etika "Sekalian"
 * 1. Jika nama putri diisi "ISTRI", ubah menjadi "[Nama Putra] Sekalian"
 * 2. Jika keduanya ada, gabungkan dengan " & "
 * 3. Jika hanya putra, gunakan nama putra
 */
export function formatGuestDisplayName(item: any): string {
  const rawPutra = (item?.namaPutra || item?.nama_putra || item?.entitas?.namaPutra || '').trim();
  const rawPutri = (item?.namaPutri || item?.nama_putri || item?.entitas?.namaPutri || '').trim();
  const rawNama = (item?.nama || item?.entitas?.nama || '').trim();

  let targetPutra = rawPutra;
  let targetPutri = rawPutri;

  // Jika namaPutra kosong namun nama diisi (bukan placeholder default)
  if (!targetPutra && rawNama && rawNama !== '-' && rawNama !== 'Tamu Undangan') {
    targetPutra = rawNama;
  }

  const fmtPutra = formatTitleCase(targetPutra);
  const fmtPutri = formatTitleCase(targetPutri);

  let displayName = fmtPutra;

  if (fmtPutri && fmtPutri.trim().toLowerCase() === 'istri') {
    displayName = `${fmtPutra} Sekalian`;
  } else if (fmtPutra && fmtPutri && fmtPutri !== '-') {
    displayName = `${fmtPutra} & ${fmtPutri}`;
  } else if (!fmtPutra && fmtPutri && fmtPutri !== '-') {
    displayName = fmtPutri;
  }

  return displayName || 'Tamu Undangan';
}
