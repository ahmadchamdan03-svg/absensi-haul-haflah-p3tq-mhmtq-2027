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
  const legacyUndMatch = trimmed.match(/^(UND-\d+)/i);
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
