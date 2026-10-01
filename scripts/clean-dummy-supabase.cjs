const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ibvttbwpnwjkwqmtrpzv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlidnR0Yndwbndqa3dxbXRycHp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTM4NjEwNiwiZXhwIjoyMTA0OTYyMTA2fQ.Suan_WF1AiBB9a-Dzstja9Y-Z2sJq1KJbhhUdebmR-A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanDummyData() {
  console.log('--- Cleaning Dummy Data in Supabase ---');

  // Check peserta_santri
  const { data: santriList, error: santriErr } = await supabase.from('peserta_santri').select('id, kode, nama');
  if (santriErr) {
    console.error('Error fetching peserta_santri:', santriErr);
  } else if (santriList) {
    console.log(`Total peserta_santri: ${santriList.length}`);
    const dummySantri = santriList.filter(s => {
      const n = (s.nama || '').toUpperCase();
      return n.includes('HAMDAN') || n.includes('WAFI') || n.includes('ADAM') || n.includes('HAHA') || n.includes('HEHE') || n.includes('PEPE') || s.kode === 'SH0001' || s.kode === 'SH0002';
    });
    console.log(`Dummy santri found: ${dummySantri.length}`);
    for (const d of dummySantri) {
      const { error: delErr } = await supabase.from('peserta_santri').delete().eq('id', d.id);
      if (delErr) console.error(`Failed to delete santri ${d.kode}:`, delErr);
      else console.log(`Deleted dummy santri ${d.kode} (${d.nama})`);
    }
  }

  // Check tamu_undangan
  const { data: tamuList, error: tamuErr } = await supabase.from('tamu_undangan').select('id, kode, nama');
  if (tamuErr) {
    console.error('Error fetching tamu_undangan:', tamuErr);
  } else if (tamuList) {
    console.log(`Total tamu_undangan: ${tamuList.length}`);
    const dummyTamu = tamuList.filter(t => {
      const n = (t.nama || '').toUpperCase();
      return n.includes('HAMDAN') || n.includes('WAFI') || n.includes('ADAM') || n.includes('HAHA') || n.includes('HEHE') || n.includes('PEPE') || t.kode === 'UND-21482' || t.kode === 'UND0107';
    });
    console.log(`Dummy tamu found: ${dummyTamu.length}`);
    for (const d of dummyTamu) {
      const { error: delErr } = await supabase.from('tamu_undangan').delete().eq('id', d.id);
      if (delErr) console.error(`Failed to delete tamu ${d.kode}:`, delErr);
      else console.log(`Deleted dummy tamu ${d.kode} (${d.nama})`);
    }
  }

  console.log('--- Finished Clean Up ---');
}

cleanDummyData();
