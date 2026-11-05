const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('C:/Users/user/.gemini/antigravity/scratch/haflah-p3tq/.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach((line) => {
  const parts = line.trim().split('=');
  const k = parts[0]?.trim();
  const v = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
  if (k) env[k] = v;
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function cleanOrphans() {
  console.log('Querying orphans in presensi_log...');
  const { data: santri } = await supabase.from('peserta_santri').select('kode');
  const { data: tamu } = await supabase.from('tamu_undangan').select('kode');

  const validCodes = new Set([
    ...(santri || []).map((s) => s.kode),
    ...(tamu || []).map((t) => t.kode),
  ]);

  const { data: logs, error: errLogs } = await supabase.from('presensi_log').select('id, kode_qr');
  if (errLogs) {
    console.error('Err fetch logs:', errLogs);
    return;
  }

  const orphanIds = logs.filter((l) => !validCodes.has(l.kode_qr)).map((l) => l.id);
  console.log('Found orphan presensi_log IDs:', orphanIds);

  if (orphanIds.length > 0) {
    const { error: delErr } = await supabase.from('presensi_log').delete().in('id', orphanIds);
    if (delErr) {
      console.error('Err delete orphans:', delErr);
    } else {
      console.log('Successfully deleted orphan presensi_log IDs:', orphanIds);
    }
  }

  // Check pembelian_kuota orphans
  const santriCodes = new Set((santri || []).map((s) => s.kode));
  const { data: kuotaList } = await supabase.from('pembelian_kuota').select('id, kode_santri');
  const orphanKuota = (kuotaList || []).filter((k) => !santriCodes.has(k.kode_santri)).map((k) => k.id);
  console.log('Found orphan pembelian_kuota IDs:', orphanKuota);
  if (orphanKuota.length > 0) {
    await supabase.from('pembelian_kuota').delete().in('id', orphanKuota);
  }

  // Check antrean_presensi_gagal orphans
  const { data: antreanList } = await supabase.from('antrean_presensi_gagal').select('id, kode_qr');
  const orphanAntrean = (antreanList || []).filter((a) => !validCodes.has(a.kode_qr)).map((a) => a.id);
  console.log('Found orphan antrean_presensi_gagal IDs:', orphanAntrean);
  if (orphanAntrean.length > 0) {
    await supabase.from('antrean_presensi_gagal').delete().in('id', orphanAntrean);
  }

  console.log('Orphan cleanup completed!');
}

cleanOrphans();
