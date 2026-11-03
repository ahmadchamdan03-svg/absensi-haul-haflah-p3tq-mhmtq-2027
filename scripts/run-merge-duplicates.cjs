const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

let supabaseUrl = 'https://ibvttbwpnwjkwqmtrpzv.supabase.co';
let supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlidnR0Yndwbndqa3dxbXRycHp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTM4NjEwNiwiZXhwIjoyMTA0OTYyMTA2fQ.Suan_WF1AiBB9a-Dzstja9Y-Z2sJq1KJbhhUdebmR-A';

if (fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = trimmed.split('=')[1].trim().replace(/^["']|["']$/g, '');
    }
    if (trimmed.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      supabaseKey = trimmed.split('=')[1].trim().replace(/^["']|["']$/g, '');
    }
  }
}

const supabase = createClient(supabaseUrl, supabaseKey);

function normalizePesertaString(str) {
  if (!str) return '';
  return str.trim().replace(/\s+/g, ' ').toLowerCase();
}

function normalizeWaliString(str) {
  if (!str) return '';
  const cleaned = str.trim().replace(/\s+/g, ' ').toLowerCase();
  return cleaned
    .replace(/\b(bkp|bapak)\b\.?/gi, 'bpk')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractCoreWaliName(wali) {
  if (!wali) return '';
  const norm = normalizeWaliString(wali);
  return norm.replace(/^(bpk|bkp|bapak|ibu|ny|hj|h)\.?\s+/i, '').trim();
}

function isDuplicateSantri(nama1, wali1, nama2, wali2) {
  const n1 = normalizePesertaString(nama1);
  const n2 = normalizePesertaString(nama2);
  if (!n1 || !n2 || n1 !== n2) return false;

  const w1 = normalizeWaliString(wali1);
  const w2 = normalizeWaliString(wali2);
  if (!w1 || !w2 || w1 === '-' || w2 === '-') return false;

  if (w1 === w2) return true;

  const core1 = extractCoreWaliName(w1);
  const core2 = extractCoreWaliName(w2);
  return core1.length >= 3 && core1 === core2;
}

function mergeSubKategori(existingSub, incomingSub) {
  const ex = (existingSub || '').trim();
  const inc = (incomingSub || '').trim();
  if (!ex) return inc;
  if (!inc) return ex;

  const exLower = ex.toLowerCase();
  const incLower = inc.toLowerCase();

  let formattedEx = ex;
  if (/^[AB]\.0[1-4]$/i.test(formattedEx)) formattedEx = `Tamatan (${formattedEx.toUpperCase()})`;
  let formattedInc = inc;
  if (/^[AB]\.0[1-4]$/i.test(formattedInc)) formattedInc = `Tamatan (${formattedInc.toUpperCase()})`;

  if (formattedEx.toLowerCase() === formattedInc.toLowerCase()) return formattedEx;

  const isBilGhoib = incLower.includes('bil ghoib') || incLower.includes('ghoib');
  const isBinNadzor = incLower.includes('bin nadzor') || incLower.includes('nadzor');
  const isTamatan = incLower.includes('tamatan');

  if (isBilGhoib && (exLower.includes('bil ghoib') || exLower.includes('ghoib'))) return formattedEx;
  if (isBinNadzor && (exLower.includes('bin nadzor') || exLower.includes('nadzor'))) return formattedEx;
  if (isTamatan && exLower.includes('tamatan')) return formattedEx;

  const parts = [formattedEx, formattedInc];
  const tamatanPart = parts.find((p) => p.toLowerCase().includes('tamatan'));
  const otherPart = parts.find((p) => !p.toLowerCase().includes('tamatan'));
  if (tamatanPart && otherPart) {
    return `${tamatanPart} & ${otherPart}`;
  }

  return `${formattedEx} & ${formattedInc}`;
}

function resolvePriorityKategoriUtama(...kats) {
  const allStr = kats.map((k) => (k || '').toUpperCase()).join(' ');
  if (allStr.includes('BIL_GHOIB') || allStr.includes('BIL GHOIB') || allStr.includes('GHOIB')) {
    return 'BIL_GHOIB';
  }
  if (allStr.includes('BIN_NADZOR') || allStr.includes('BIN NADZOR') || allStr.includes('NADZOR')) {
    return 'BIN_NADZOR';
  }
  return 'TAMATAN';
}

async function runAutoMerge() {
  console.log('--- Scanning Supabase peserta_santri for duplicates ---');
  const { data: allSantri, error } = await supabase.from('peserta_santri').select('*').order('created_at', { ascending: true });
  if (error) {
    console.error('Error fetching santri:', error);
    return;
  }

  console.log(`Loaded ${allSantri.length} santri records.`);
  const groups = new Map();

  for (const item of allSantri) {
    const rawNama = item.nama || '';
    const rawWali = item.nama_wali || '';
    const normNama = normalizePesertaString(rawNama);
    const coreWali = extractCoreWaliName(rawWali);

    if (!normNama || !coreWali || coreWali === '-') continue;

    let matchedKey = null;
    for (const [existingKey, groupItems] of groups.entries()) {
      const sample = groupItems[0];
      if (isDuplicateSantri(sample.nama, sample.nama_wali, rawNama, rawWali)) {
        matchedKey = existingKey;
        break;
      }
    }

    const keyToUse = matchedKey || `${normNama}|||${coreWali}`;
    if (!groups.has(keyToUse)) {
      groups.set(keyToUse, []);
    }
    groups.get(keyToUse).push(item);
  }

  const dupeGroups = [];
  for (const [key, items] of groups.entries()) {
    if (items.length > 1) {
      dupeGroups.push({ key, items });
    }
  }

  console.log(`Found ${dupeGroups.length} duplicate groups.`);

  for (const grp of dupeGroups) {
    const items = grp.items;
    console.log(`\nProcessing group: ${grp.key} (${items.length} records)`);

    // Prioritize TAMATAN with specific code (e.g. Tamatan A.04) or user's requested target
    let primary = items.find(it => it.kategori_utama === 'TAMATAN' && String(it.sub_kategori || '').includes('('));
    if (!primary) primary = items.find(it => it.kategori_utama === 'TAMATAN' || it.kategori_utama === 'BIL_GHOIB');
    if (!primary) primary = items[0];

    const duplicates = items.filter(it => it.id !== primary.id);
    const primaryKode = primary.kode;
    console.log(`Primary record: ${primary.kode} (${primary.nama} - ${primary.sub_kategori})`);

    let mergedSub = primary.sub_kategori || '';
    let resolvedKat = primary.kategori_utama || 'BIN_NADZOR';
    let maxKuotaDasar = Number(primary.kuota_dasar || 2);
    let totalKuotaTambahan = Number(primary.kuota_tambahan || 0);
    let totalKuotaTerpakai = Number(primary.kuota_terpakai || 0);

    let bestNoHp = primary.no_hp || '';
    let bestKamar = primary.kamar || '';
    let bestAlamat = primary.alamat || '';

    for (const dup of duplicates) {
      console.log(` Merging duplicate: ${dup.kode} (${dup.nama} - ${dup.sub_kategori})`);
      mergedSub = mergeSubKategori(mergedSub, dup.sub_kategori || '');
      resolvedKat = resolvePriorityKategoriUtama(resolvedKat, dup.kategori_utama, mergedSub);
      maxKuotaDasar = Math.max(maxKuotaDasar, Number(dup.kuota_dasar || 0));
      totalKuotaTambahan += Number(dup.kuota_tambahan || 0);
      totalKuotaTerpakai += Number(dup.kuota_terpakai || 0);

      if ((!bestNoHp || bestNoHp === '-') && dup.no_hp && dup.no_hp !== '-') bestNoHp = dup.no_hp;
      if ((!bestKamar || bestKamar === '-') && dup.kamar && dup.kamar !== '-') bestKamar = dup.kamar;
      if ((!bestAlamat || bestAlamat === '-' || bestAlamat === 'Kediri') && dup.alamat && dup.alamat !== '-') bestAlamat = dup.alamat;

      // Re-point related tables
      await supabase.from('presensi_log').update({ kode_qr: primaryKode }).eq('kode_qr', dup.kode);
      await supabase.from('pembelian_kuota').update({ kode_santri: primaryKode }).eq('kode_santri', dup.kode);
      await supabase.from('audit_logs').update({ kode: primaryKode }).eq('kode', dup.kode);

      // Delete duplicate
      const { error: delErr } = await supabase.from('peserta_santri').delete().eq('id', dup.id);
      if (delErr) {
        console.error(`Failed to delete duplicate ${dup.kode}:`, delErr);
      } else {
        console.log(` Successfully deleted duplicate record ${dup.kode} (${dup.id})`);
      }
    }

    const updatePayload = {
      kategori_utama: resolvedKat,
      sub_kategori: mergedSub,
      kuota_dasar: maxKuotaDasar,
      kuota_tambahan: totalKuotaTambahan,
      kuota_terpakai: totalKuotaTerpakai,
      warna_tiket: 'Biru',
      updated_at: new Date().toISOString()
    };
    if (bestNoHp) updatePayload.no_hp = bestNoHp;
    if (bestKamar) updatePayload.kamar = bestKamar;
    if (bestAlamat) updatePayload.alamat = bestAlamat;

    const { error: updErr } = await supabase.from('peserta_santri').update(updatePayload).eq('id', primary.id);
    if (updErr) {
      console.error(`Failed to update primary record ${primary.kode}:`, updErr);
    } else {
      console.log(` Successfully updated primary record ${primary.kode}:`);
      console.log(`  - Kategori Utama: ${resolvedKat}`);
      console.log(`  - Sub Kategori: ${mergedSub}`);
      console.log(`  - Kuota Dasar: ${maxKuotaDasar}`);
    }
  }

  console.log('\n--- Finished Auto-Merge ---');
}

runAutoMerge();
