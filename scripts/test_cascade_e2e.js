const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach((line) => {
  const parts = line.trim().split('=');
  const k = parts[0]?.trim();
  const v = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
  if (k) env[k] = v;
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log('=== MULAI PENGUJIAN END-TO-END CASCADE & ISOLASI PERSIDANGAN ===');

  // 1. Initial State Checks
  const { count: initialPersidangan } = await supabase.from('persidangan').select('*', { count: 'exact', head: true });
  const { count: initialPersidanganPeserta } = await supabase.from('persidangan_peserta').select('*', { count: 'exact', head: true });
  const { count: initialAuditLog } = await supabase.from('audit_log').select('*', { count: 'exact', head: true });

  console.log(`Initial persidangan rows: ${initialPersidangan} (Wajib tetap 3)`);
  console.log(`Initial persidangan_peserta rows: ${initialPersidanganPeserta} (Wajib tetap 101)`);
  console.log(`Initial audit_log rows: ${initialAuditLog}`);

  if (initialPersidangan !== 3 || initialPersidanganPeserta !== 101) {
    throw new Error('Persidangan initial count mismatch!');
  }

  // 2. Test Cascade Tamu
  const testTamuKode = 'UND-CASCADE-TEST';
  console.log(`\n--- Menguji Cascade Tamu Undangan (${testTamuKode}) ---`);
  
  // Cleanup if exists from previous aborted run
  await supabase.from('presensi_log').delete().eq('kode_qr', testTamuKode);
  await supabase.from('antrean_presensi_gagal').delete().eq('kode_qr', testTamuKode);
  await supabase.from('tamu_undangan').delete().eq('kode', testTamuKode);

  // Insert Tamu
  const { data: newTamu, error: tamuErr } = await supabase.from('tamu_undangan').insert({
    kode: testTamuKode,
    nama: 'Tamu Test Cascade',
    kategori: 'Tamu Umum',
    warna_tiket: 'Biru',
    alamat: 'Kediri'
  }).select().single();

  if (tamuErr) throw new Error('Gagal insert tamu test: ' + tamuErr.message);
  console.log('✓ Tamu test berhasil dibuat:', newTamu.id, newTamu.kode);

  // Insert Presensi Log for this tamu
  const { error: logErr } = await supabase.from('presensi_log').insert({
    kode_qr: testTamuKode,
    nama_peserta: 'Tamu Test Cascade',
    tipe_peserta: 'UNDANGAN',
    jumlah_l: 1,
    jumlah_p: 1,
    panitia_id: 'TEST_AGENT'
  });
  if (logErr) throw new Error('Gagal insert presensi_log: ' + logErr.message);
  console.log('✓ Presensi log test berhasil dibuat untuk', testTamuKode);

  // Insert Antrean Gagal for this tamu
  const { error: failErr } = await supabase.from('antrean_presensi_gagal').insert({
    kode_qr: testTamuKode,
    operator: 'TEST_AGENT',
    alasan_gagal: 'Testing cascade delete'
  });
  if (failErr) throw new Error('Gagal insert antrean_gagal: ' + failErr.message);
  console.log('✓ Antrean gagal test berhasil dibuat untuk', testTamuKode);

  // Verify records exist
  const { count: logBefore } = await supabase.from('presensi_log').select('*', { count: 'exact', head: true }).eq('kode_qr', testTamuKode);
  const { count: failBefore } = await supabase.from('antrean_presensi_gagal').select('*', { count: 'exact', head: true }).eq('kode_qr', testTamuKode);
  console.log(`Verifikasi sebelum delete: presensi_log=${logBefore}, antrean_gagal=${failBefore}`);

  // DELETE Tamu (Ini akan memicu PostgreSQL Trigger AFTER DELETE on tamu_undangan)
  const { error: delTamuErr } = await supabase.from('tamu_undangan').delete().eq('kode', testTamuKode);
  if (delTamuErr) throw new Error('Gagal delete tamu test: ' + delTamuErr.message);
  console.log('✓ Tamu test dihapus dari database.');

  // Verify Cascade happened automatically
  const { count: tamuAfter } = await supabase.from('tamu_undangan').select('*', { count: 'exact', head: true }).eq('kode', testTamuKode);
  const { count: logAfter } = await supabase.from('presensi_log').select('*', { count: 'exact', head: true }).eq('kode_qr', testTamuKode);
  const { count: failAfter } = await supabase.from('antrean_presensi_gagal').select('*', { count: 'exact', head: true }).eq('kode_qr', testTamuKode);

  console.log(`Hasil verifikasi setelah delete tamu:`);
  console.log(`- tamu_undangan tersisa: ${tamuAfter} (harus 0)`);
  console.log(`- presensi_log tersisa: ${logAfter} (harus 0 - CASCADE BERHASIL)`);
  console.log(`- antrean_gagal tersisa: ${failAfter} (harus 0 - CASCADE BERHASIL)`);

  if (tamuAfter !== 0 || logAfter !== 0 || failAfter !== 0) {
    throw new Error('CASCADE TRIGGER TAMU GAGAL!');
  }

  // 3. Test Cascade Santri
  const testSantriKode = 'SH-CASCADE-TEST';
  console.log(`\n--- Menguji Cascade Peserta Santri (${testSantriKode}) ---`);

  // Cleanup if exists
  await supabase.from('presensi_log').delete().eq('kode_qr', testSantriKode);
  await supabase.from('pembelian_kuota').delete().eq('kode_santri', testSantriKode);
  await supabase.from('antrean_presensi_gagal').delete().eq('kode_qr', testSantriKode);
  await supabase.from('peserta_santri').delete().eq('kode', testSantriKode);

  // Insert Santri
  const { data: newSantri, error: santriErr } = await supabase.from('peserta_santri').insert({
    kode: testSantriKode,
    nama: 'Santri Test Cascade',
    kategori_utama: 'BIL_GHOIB',
    nama_wali: 'Wali Test',
    kuota_dasar: 2
  }).select().single();
  if (santriErr) throw new Error('Gagal insert santri test: ' + santriErr.message);
  console.log('✓ Santri test berhasil dibuat:', newSantri.id, newSantri.kode);

  // Insert Presensi Log for santri
  await supabase.from('presensi_log').insert({
    kode_qr: testSantriKode,
    nama_peserta: 'Santri Test Cascade',
    tipe_peserta: 'SANTRI',
    jumlah_l: 1,
    jumlah_p: 1
  });

  // Insert Pembelian Kuota for santri
  await supabase.from('pembelian_kuota').insert({
    id: 'ORDER-CASCADE-TEST',
    kode_santri: testSantriKode,
    nama_wali: 'Wali Test',
    jumlah_kursi: 1,
    total_bayar: 80000,
    status: 'MENUNGGU_PEMBAYARAN'
  });

  // Insert Antrean Gagal for santri
  await supabase.from('antrean_presensi_gagal').insert({
    kode_qr: testSantriKode,
    operator: 'TEST_AGENT',
    alasan_gagal: 'Testing santri cascade delete'
  });

  console.log('✓ Seluruh data anak (presensi_log, pembelian_kuota, antrean_gagal) berhasil dibuat untuk santri.');

  // DELETE Santri (memicu trigger trg_cascade_santri)
  const { error: delSantriErr } = await supabase.from('peserta_santri').delete().eq('kode', testSantriKode);
  if (delSantriErr) throw new Error('Gagal delete santri test: ' + delSantriErr.message);
  console.log('✓ Santri test dihapus dari database.');

  // Verify Cascade
  const { count: santriAfter } = await supabase.from('peserta_santri').select('*', { count: 'exact', head: true }).eq('kode', testSantriKode);
  const { count: logSantriAfter } = await supabase.from('presensi_log').select('*', { count: 'exact', head: true }).eq('kode_qr', testSantriKode);
  const { count: kuotaSantriAfter } = await supabase.from('pembelian_kuota').select('*', { count: 'exact', head: true }).eq('kode_santri', testSantriKode);
  const { count: failSantriAfter } = await supabase.from('antrean_presensi_gagal').select('*', { count: 'exact', head: true }).eq('kode_qr', testSantriKode);

  console.log(`Hasil verifikasi setelah delete santri:`);
  console.log(`- peserta_santri tersisa: ${santriAfter} (harus 0)`);
  console.log(`- presensi_log tersisa: ${logSantriAfter} (harus 0 - CASCADE BERHASIL)`);
  console.log(`- pembelian_kuota tersisa: ${kuotaSantriAfter} (harus 0 - CASCADE BERHASIL)`);
  console.log(`- antrean_gagal tersisa: ${failSantriAfter} (harus 0 - CASCADE BERHASIL)`);

  if (santriAfter !== 0 || logSantriAfter !== 0 || kuotaSantriAfter !== 0 || failSantriAfter !== 0) {
    throw new Error('CASCADE TRIGGER SANTRI GAGAL!');
  }

  // 4. Verify Final State & Strict Constraints
  const { count: finalPersidangan } = await supabase.from('persidangan').select('*', { count: 'exact', head: true });
  const { count: finalPersidanganPeserta } = await supabase.from('persidangan_peserta').select('*', { count: 'exact', head: true });
  const { count: finalAuditLog } = await supabase.from('audit_log').select('*', { count: 'exact', head: true });

  console.log(`\n--- Verifikasi Strict Constraint ---`);
  console.log(`Final persidangan: ${finalPersidangan} (Wajib 3: ${finalPersidangan === 3 ? 'TERPENUHI ✓' : 'GAGAL ❌'})`);
  console.log(`Final persidangan_peserta: ${finalPersidanganPeserta} (Wajib 101: ${finalPersidanganPeserta === 101 ? 'TERPENUHI ✓' : 'GAGAL ❌'})`);
  console.log(`Final audit_log: ${finalAuditLog} (Wajib >= ${initialAuditLog}: ${finalAuditLog >= initialAuditLog ? 'TERPENUHI ✓' : 'GAGAL ❌'})`);

  if (finalPersidangan !== 3 || finalPersidanganPeserta !== 101 || finalAuditLog < initialAuditLog) {
    throw new Error('STRICT CONSTRAINT VIOLATION!');
  }

  console.log('\n🎉 SEMUA PENGUJIAN CASCADE BERHASIL 100%!');
}

runTest().catch((err) => {
  console.error('\n❌ TEST ERROR:', err);
  process.exit(1);
});
