export function generateRandomKode(prefix: string): string {
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase().padEnd(4, '0');
  return `${prefix}${randomChars}`;
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
