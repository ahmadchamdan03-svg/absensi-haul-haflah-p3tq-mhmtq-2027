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

function getMergedGuestPriority(entry: any): number {
  if (!entry) return 0;
  const kat = String(entry.kategori || entry.kategoriUtama || entry.kategori_utama || '').toUpperCase();
  const sub = String(
    entry.subKategori || entry.sub_kategori || entry.golongan || entry.golonganUndangan || ''
  ).toUpperCase();

  // Prioritas Tamu Undangan: VVIP > VIP / Istimewa > Kehormatan > Umum
  if (kat.includes('VVIP')) return 400;
  if (kat.includes('VIP') || sub.includes('ISTIMEWA')) return 300;
  if (sub.includes('KEHORMATAN') || kat.includes('KEHORMATAN')) return 200;
  if (sub.includes('UMUM') || kat.includes('TAMU')) return 100;

  // Prioritas Santri: Bil Ghoib > Tamatan > Bin Nadzori
  if (kat.includes('BIL_GHOIB') || kat.includes('GHOIB')) return 3;
  if (kat.includes('TAMATAN')) return 2;
  if (kat.includes('BIN_NADZOR') || kat.includes('NADZOR')) return 1;

  return 0;
}

/**
 * Format nama tamu undangan dengan Title Case, anti-dobel, dan etika "Sekalian":
 * 1. Untuk data gabungan (merged_group_id), gunakan hanya satu entitas prioritas tertinggi (Data Induk).
 * 2. Anti-dobel: jika nama_putra dan nama_putri identik, tampilkan satu nama saja (tanpa "&").
 * 3. Jika nama_putra ada & nama_putri "ISTRI", ubah menjadi "[Nama Putra] Sekalian".
 * 4. Jika keduanya ada dan berbeda, gabungkan dengan " & ".
 * 5. Jika hanya putra atau hanya putri, tampilkan yang tersedia saja.
 */
export function formatGuestDisplayName(item: any): string {
  if (!item) return 'Tamu Undangan';

  // 1. Jika data tamu memiliki merged_group_id / mergedItems (data gabungan),
  // pilih HANYA satu entitas dengan prioritas tertinggi (Data Induk), jangan gabungkan lintas entitas.
  let source = item;
  if (
    (item?.merged_group_id || item?.isMerged) &&
    Array.isArray(item?.mergedItems) &&
    item.mergedItems.length > 0
  ) {
    const sorted = [...item.mergedItems].sort(
      (a, b) => getMergedGuestPriority(b) - getMergedGuestPriority(a)
    );
    source = sorted[0];
  }

  const normalizeRaw = (val: any): string => {
    if (typeof val !== 'string') return '';
    const trimmed = val.trim().replace(/\s+/g, ' ');
    if (!trimmed || trimmed === '-' || trimmed.toLowerCase() === 'tamu undangan') return '';
    return trimmed;
  };

  const targetPutra = normalizeRaw(
    source?.namaPutra ?? source?.nama_putra ?? source?.entitas?.namaPutra ?? source?.entitas?.nama_putra
  );
  const targetPutri = normalizeRaw(
    source?.namaPutri ?? source?.nama_putri ?? source?.entitas?.namaPutri ?? source?.entitas?.nama_putri
  );
  const targetNama = normalizeRaw(source?.nama ?? source?.entitas?.nama);

  // 2. Jika nama_putra dan nama_putri keduanya terisi pada Data Induk
  if (targetPutra && targetPutri) {
    const cleanPutra = targetPutra.toLowerCase().trim();
    const cleanPutri = targetPutri.toLowerCase().trim();
    const fmtPutra = formatTitleCase(targetPutra);
    const fmtPutri = formatTitleCase(targetPutri);

    // Tetap pertahankan aturan "Sekalian" jika nama putri diisi "ISTRI"
    if (cleanPutri === 'istri') {
      return `${fmtPutra} Sekalian`;
    }
    // Pengecekan duplikasi (Anti-Dobel): jika identik, tampilkan satu nama saja
    if (cleanPutra === cleanPutri) {
      return fmtPutra;
    }
    return `${fmtPutra} & ${fmtPutri}`;
  }

  // 3. Jika hanya nama putra yang terisi
  if (targetPutra) {
    if (targetPutra.toLowerCase().trim() === 'istri' && targetNama) {
      const stripped = targetNama.replace(/\s*&\s*istri$/i, '').trim();
      return stripped && stripped.toLowerCase() !== 'istri'
        ? `${formatTitleCase(stripped)} Sekalian`
        : 'Tamu Undangan';
    }
    return formatTitleCase(targetPutra);
  }

  // 4. Jika hanya nama putri yang terisi
  if (targetPutri) {
    if (targetPutri.toLowerCase().trim() === 'istri') {
      if (targetNama) {
        const stripped = targetNama.replace(/\s*&\s*istri$/i, '').trim();
        if (stripped && stripped.toLowerCase() !== 'istri') {
          return `${formatTitleCase(stripped)} Sekalian`;
        }
      }
      return 'Tamu Undangan';
    }
    return formatTitleCase(targetPutri);
  }

  // 5. Fallback ke properti nama apabila nama_putra dan nama_putri keduanya kosong
  if (targetNama) {
    if (targetNama.includes('&')) {
      const parts = targetNama
        .split('&')
        .map((p) => p.trim())
        .filter(Boolean);

      if (parts.length === 2) {
        const [p1, p2] = parts;
        if (p2.toLowerCase().trim() === 'istri') {
          return `${formatTitleCase(p1)} Sekalian`;
        }
        if (p1.toLowerCase().trim() === p2.toLowerCase().trim()) {
          return formatTitleCase(p1);
        }
        return `${formatTitleCase(p1)} & ${formatTitleCase(p2)}`;
      }

      const seen = new Set<string>();
      const uniqueParts: string[] = [];
      for (const part of parts) {
        const key = part.toLowerCase().trim();
        if (!seen.has(key)) {
          seen.add(key);
          uniqueParts.push(formatTitleCase(part));
        }
      }
      return uniqueParts.length > 0 ? uniqueParts.join(' & ') : 'Tamu Undangan';
    }
    return formatTitleCase(targetNama);
  }

  return 'Tamu Undangan';
}
