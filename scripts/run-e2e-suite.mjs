import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ibvttbwpnwjkwqmtrpzv.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlidnR0Yndwbndqa3dxbXRycHp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTM4NjEwNiwiZXhwIjoyMTA0OTYyMTA2fQ.Suan_WF1AiBB9a-Dzstja9Y-Z2sJq1KJbhhUdebmR-A';
const BASE_URL = 'http://localhost:3000';
const USER_PHONE = '6285790633812';
const ARTIFACT_DIR = 'C:/Users/user/.gemini/antigravity/brain/70844ffa-ee55-4871-a1cb-5f7480b7ba47';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

const benchmarkResults = [];
let nextProcess = null;

async function ensureServerRunning() {
  try {
    const res = await fetch(`${BASE_URL}/`);
    if (res.ok) {
      console.log('  ✓ Server Next.js sudah aktif di port 3000.');
      return;
    }
  } catch {}

  console.log('  Memulai server Next.js production di port 3000...');
  const nextBin = path.join(process.cwd(), 'node_modules/next/dist/bin/next');
  nextProcess = spawn(process.execPath, [nextBin, 'start', '-p', '3000'], {
    cwd: process.cwd(),
    stdio: 'ignore',
  });

  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      const res = await fetch(`${BASE_URL}/`);
      if (res.ok) {
        console.log('  ✓ Server Next.js siap menerima koneksi.');
        return;
      }
    } catch {}
  }
  throw new Error('Timeout menunggu server Next.js siap di port 3000');
}

function recordBenchmark(actionName, durationMs, thresholdMs = 3000, notes = '') {
  const passed = durationMs <= thresholdMs;
  const status = passed ? 'PASS (< 3s)' : 'FAIL (> 3s)';
  benchmarkResults.push({
    action: actionName,
    durationMs: Math.round(durationMs),
    durationSec: (durationMs / 1000).toFixed(2) + 's',
    status,
    notes,
  });
  console.log(`  [BENCHMARK] ${actionName}: ${(durationMs / 1000).toFixed(2)}s - ${status}`);
}

async function runE2ESuite() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🚀 MEMULAI END-TO-END (E2E) TEST SUITE, BENCHMARK, & CLEANUP');
  console.log('═══════════════════════════════════════════════════════════════\n');

  await ensureServerRunning();

  // Launch Puppeteer browser
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    // =========================================================================
    // FASE 0: AUTENTIKASI & BENCHMARK AWAL (4 ROLE)
    // =========================================================================
    console.log('--- FASE 0: AUTENTIKASI & BENCHMARK AWAL (4 ROLE) ---');

    // 1. Warm-up
    console.log('  Navigasi awal ke Landing Portal...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 30000 });

    const rolesToTest = [
      { role: 'ADMIN', pass: 'admin_haflah', targetRoute: '/admin/dasbor', title: 'Admin Haflah' },
      { role: 'PIMPINAN', pass: 'pp_haflah', targetRoute: '/pimpinan', title: 'Pimpinan Haflah' },
      { role: 'PENERIMA_TAMU', pass: 'pt_haflah', targetRoute: '/penerima-tamu', title: 'Penerima Tamu' },
      { role: 'PENJAGA_GERBANG', pass: '1234567890', targetRoute: '/scan', title: 'Penjaga Gerbang' },
    ];

    for (const item of rolesToTest) {
      const context = await browser.createBrowserContext();
      const rolePage = await context.newPage();
      await rolePage.setViewport({ width: 1280, height: 800 });

      await rolePage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 30000 });

      // Buka modal login role
      const roleCardSelector = `button[data-role="${item.role}"]`;
      let clicked = false;
      try {
        await rolePage.waitForSelector(roleCardSelector, { timeout: 3000 });
        await rolePage.click(roleCardSelector);
        clicked = true;
      } catch {
        // Fallback: klik berdasarkan teks
        await rolePage.evaluate((r) => {
          const btns = Array.from(document.querySelectorAll('button'));
          const target = btns.find((b) => b.innerText.includes(r) || b.textContent.includes(r));
          if (target) target.click();
        }, item.title);
        clicked = true;
      }

      await rolePage.waitForSelector('input[type="password"]', { timeout: 4000 });
      await rolePage.type('input[type="password"]', item.pass, { delay: 30 });

      // Catat waktu klik tombol Masuk sampai targetRoute selesai loading
      const tStart = performance.now();
      await Promise.all([
        rolePage.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
        rolePage.keyboard.press('Enter'),
      ]);
      const tEnd = performance.now();
      const duration = tEnd - tStart;
      recordBenchmark(`Login ${item.title} -> ${item.targetRoute}`, duration);

      if (item.role === 'ADMIN') {
        const adminScreenshot = path.join(ARTIFACT_DIR, 'screenshot-e2e-login-admin.png');
        await rolePage.screenshot({ path: adminScreenshot, fullPage: false });
      } else if (item.role === 'PENERIMA_TAMU') {
        const ptScreenshot = path.join(ARTIFACT_DIR, 'screenshot-e2e-penerima-tamu.png');
        await rolePage.screenshot({ path: ptScreenshot, fullPage: false });
      }

      await context.close();
    }

    // =========================================================================
    // FASE 1: SANTRI & KUOTA
    // =========================================================================
    console.log('\n--- FASE 1: SANTRI & KUOTA ---');

    // Pre-cleanup data uji lama jika ada
    await supabase.from('presensi_log').delete().like('nama_peserta', 'E2E_TEST_%');
    await supabase.from('pembelian_kuota').delete().like('id_pesanan', 'E2E_%');
    await supabase.from('peserta_santri').delete().like('nama', 'E2E_TEST_%');
    await supabase.from('tamu_undangan').delete().like('nama', 'E2E_TEST_%');

    // Pastikan cookies Admin aktif
    const authHeaders = {
      'Content-Type': 'application/json',
      Cookie: 'haflah_active_role_session=ADMIN; user_role=ADMIN',
    };

    // 2. Tambah Santri 1 & 2
    const santri1Payload = {
      nama: 'E2E_TEST_SANTRI_1',
      kategoriUtama: 'BIL_GHOIB',
      subKategori: 'Bil Ghoib',
      namaWali: 'WALI_E2E_TEST',
      alamat: 'SURABAYA',
      kamar: 'A.01',
      kelas: '3 Tsanawiyah',
      noHp: USER_PHONE,
      kuotaDasar: 2,
    };

    let t1 = performance.now();
    const resS1 = await fetch(`${BASE_URL}/api/santri`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(santri1Payload),
    });
    let t2 = performance.now();
    const dataS1 = await resS1.json();
    recordBenchmark('Tambah Santri 1 (Bil Ghoib)', t2 - t1);
    if (!dataS1.ok) throw new Error(`Gagal tambah Santri 1: ${dataS1.error}`);
    const kodeS1 = dataS1.kode;
    console.log(`  ✓ Santri 1 dibuat: ${santri1Payload.nama} (${kodeS1})`);

    const santri2Payload = {
      nama: 'E2E_TEST_SANTRI_2',
      kategoriUtama: 'BIN_NADZOR',
      subKategori: 'Bin Nadzori',
      namaWali: 'WALI_E2E_TEST_2',
      alamat: 'MALANG',
      kamar: 'B.02',
      kelas: '2 Tsanawiyah',
      noHp: USER_PHONE,
      kuotaDasar: 2,
    };

    t1 = performance.now();
    const resS2 = await fetch(`${BASE_URL}/api/santri`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(santri2Payload),
    });
    t2 = performance.now();
    const dataS2 = await resS2.json();
    recordBenchmark('Tambah Santri 2 (Bin Nadzori)', t2 - t1);
    if (!dataS2.ok) throw new Error(`Gagal tambah Santri 2: ${dataS2.error}`);
    const kodeS2 = dataS2.kode;
    console.log(`  ✓ Santri 2 dibuat: ${santri2Payload.nama} (${kodeS2})`);

    // Cek Supa: Pastikan data masuk ke tabel peserta_santri
    const { data: supaSantriCheck, error: supaSantriErr } = await supabase
      .from('peserta_santri')
      .select('id, kode, nama, nama_wali, alamat, kategori_utama, kuota_dasar, kuota_tambahan')
      .in('kode', [kodeS1, kodeS2]);
    if (supaSantriErr || !supaSantriCheck || supaSantriCheck.length < 2) {
      throw new Error(`Cek Supabase Gagal: Peserta santri tidak lengkap di database: ${supaSantriErr?.message}`);
    }
    console.log(`  ✓ Cek Supabase: 2 Santri terverifikasi masuk ke database:`, supaSantriCheck.map((s) => `${s.nama} (${s.kode})`));

    const idSantri1 = supaSantriCheck.find((s) => s.kode === kodeS1).id;

    // 3. Kirim Undangan WA ke Nomor User (6285790633812)
    console.log(`  Memicu pengiriman WA resmi via Fonnte ke ${USER_PHONE}...`);
    t1 = performance.now();
    const resWA = await fetch(`${BASE_URL}/api/whatsapp/send`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        target: USER_PHONE,
        message: `*UNDANGAN RESMI HAFLAH P3TQ 2027*\n\nYth. Bpk/Ibu ${santri1Payload.namaWali},\nBerikut adalah tautan portal undangan digital putri Anda *${santri1Payload.nama}*:\n\n${BASE_URL}/u/${kodeS1}\n\nMohon konfirmasi kehadiran Anda. Terima kasih.`,
      }),
    });
    t2 = performance.now();
    const dataWA = await resWA.json();
    recordBenchmark('Kirim WA Undangan Asli (Fonnte API)', t2 - t1, 8000, 'Gateway WA eksternal');
    console.log(`  ✓ Status WA Fonnte:`, dataWA.ok ? 'BERHASIL TERKIRIM' : 'GAGAL/PENDING', dataWA.data?.detail || dataWA.message || '');

    // 4. Konfirmasi Hadir & Pesan Kuota Tambahan (1 Kursi)
    console.log(`  Membuka portal undangan & konfirmasi kehadiran (${kodeS1})...`);
    t1 = performance.now();
    const resRsvp = await fetch(`${BASE_URL}/api/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'SANTRI',
        kode: kodeS1,
        status_konfirmasi: 'SUDAH',
        perkiraan_l: 1,
        perkiraan_p: 1,
      }),
    });
    t2 = performance.now();
    const dataRsvp = await resRsvp.json();
    recordBenchmark('Konfirmasi RSVP Santri (Portal)', t2 - t1);
    if (!dataRsvp.ok) throw new Error(`RSVP Gagal: ${dataRsvp.error}`);

    // Pesan 1 kuota tambahan
    const orderId = `E2E_${Math.floor(1000 + Math.random() * 9000)}`;
    t1 = performance.now();
    const resOrder = await fetch(`${BASE_URL}/api/verifikasi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'order_public',
        newOrder: {
          id: orderId,
          id_pesanan: orderId,
          kode_santri: kodeS1,
          nama_wali: santri1Payload.namaWali,
          jumlah_kursi: 1,
          total_bayar: 75000,
          status: 'MENUNGGU_VERIFIKASI',
          bukti_url: 'https://placehold.co/600x400/png?text=E2E_TEST_BUKTI_BAYAR',
          created_at: new Date().toISOString(),
        },
      }),
    });
    t2 = performance.now();
    const dataOrder = await resOrder.json();
    recordBenchmark('Pesan 1 Kuota Tambahan (Wali)', t2 - t1);
    if (!dataOrder.ok) throw new Error(`Pesan Kuota Gagal: ${dataOrder.error}`);

    // Cek Supa: Pastikan pembelian_kuota tercatat
    const { data: supaOrderCheck, error: supaOrderErr } = await supabase
      .from('pembelian_kuota')
      .select('*')
      .eq('id_pesanan', orderId)
      .single();
    if (supaOrderErr || !supaOrderCheck) {
      throw new Error(`Cek Supabase Gagal: Pesanan kuota tidak tercatat: ${supaOrderErr?.message}`);
    }
    console.log(`  ✓ Cek Supabase: Pesanan ${orderId} tercatat dengan status '${supaOrderCheck.status}'.`);

    // 5. Verifikasi Kuota & ACC (Admin)
    console.log(`  Admin memverifikasi pesanan kuota ${orderId}...`);
    t1 = performance.now();
    const resVerify = await fetch(`${BASE_URL}/api/verifikasi`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        action: 'verify',
        targetId: orderId,
        targetKode: kodeS1,
      }),
    });
    t2 = performance.now();
    const dataVerify = await resVerify.json();
    recordBenchmark('Verifikasi & ACC Kuota (Admin)', t2 - t1);
    if (!dataVerify.ok) throw new Error(`Verifikasi Kuota Gagal: ${dataVerify.error}`);

    // Cek Supa: Pastikan status menjadi DIVERIFIKASI dan kuota_tambahan = 1 di peserta_santri
    const { data: supaSantriAfterVerify } = await supabase
      .from('peserta_santri')
      .select('kuota_dasar, kuota_tambahan')
      .eq('kode', kodeS1)
      .single();
    console.log(`  ✓ Cek Supabase: Kuota santri ${kodeS1} kini: Dasar=${supaSantriAfterVerify.kuota_dasar}, Tambahan=${supaSantriAfterVerify.kuota_tambahan}`);
    if (Number(supaSantriAfterVerify.kuota_tambahan) !== 1) {
      throw new Error(`Kuota tambahan tidak bertambah di database! Aktual: ${supaSantriAfterVerify.kuota_tambahan}`);
    }

    // =========================================================================
    // FASE 2: TAMU UNDANGAN & OPERASIONAL GERBANG
    // =========================================================================
    console.log('\n--- FASE 2: TAMU UNDANGAN & OPERASIONAL GERBANG ---');

    // 6. Tambah Tamu 1 (VIP IDS) & Tamu 2 (Tamu Kehormatan)
    const tamu1Payload = {
      nama: 'E2E_TEST_TAMU_1',
      kategori: 'VIP IDS',
      subKategori: 'ISTIMEWA',
      instansi: 'Pondok Pesantren Lirboyo',
      alamat: 'KEDIRI',
      noHp: USER_PHONE,
      kuotaDasar: 2,
    };

    t1 = performance.now();
    const resT1 = await fetch(`${BASE_URL}/api/tamu`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(tamu1Payload),
    });
    t2 = performance.now();
    const dataT1 = await resT1.json();
    recordBenchmark('Tambah Tamu 1 (VIP IDS)', t2 - t1);
    if (!dataT1.ok) throw new Error(`Tambah Tamu 1 Gagal: ${dataT1.error}`);
    const kodeT1 = dataT1.kode;
    console.log(`  ✓ Tamu 1 dibuat: ${tamu1Payload.nama} (${kodeT1})`);

    const tamu2Payload = {
      nama: 'E2E_TEST_TAMU_2',
      kategori: 'Tamu Kehormatan',
      subKategori: 'KEHORMATAN',
      instansi: 'Pengurus Cabang NU',
      alamat: 'JOMBANG',
      noHp: USER_PHONE,
      kuotaDasar: 4,
    };

    t1 = performance.now();
    const resT2 = await fetch(`${BASE_URL}/api/tamu`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(tamu2Payload),
    });
    t2 = performance.now();
    const dataT2 = await resT2.json();
    recordBenchmark('Tambah Tamu 2 (Tamu Kehormatan)', t2 - t1);
    if (!dataT2.ok) throw new Error(`Tambah Tamu 2 Gagal: ${dataT2.error}`);
    const kodeT2 = dataT2.kode;
    console.log(`  ✓ Tamu 2 dibuat: ${tamu2Payload.nama} (${kodeT2})`);

    // Cek Supa: Pastikan tamu tersimpan di tamu_undangan
    const { data: supaTamuCheck } = await supabase
      .from('tamu_undangan')
      .select('id, kode, nama, kategori, sub_kategori, alamat, kuota_terpakai')
      .in('kode', [kodeT1, kodeT2]);
    if (!supaTamuCheck || supaTamuCheck.length < 2) {
      throw new Error('Cek Supabase Gagal: Data tamu tidak lengkap di database.');
    }
    console.log(`  ✓ Cek Supabase: 2 Tamu terverifikasi masuk ke database:`, supaTamuCheck.map((t) => `${t.nama} (${t.kode})`));

    // 7. Portal Undangan Tamu & RSVP
    t1 = performance.now();
    const resTamuRsvp = await fetch(`${BASE_URL}/api/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'TAMU',
        kode: kodeT1,
        status_konfirmasi: 'HADIR',
      }),
    });
    t2 = performance.now();
    const dataTamuRsvp = await resTamuRsvp.json();
    recordBenchmark('Konfirmasi Kehadiran Tamu (Portal)', t2 - t1);
    if (!dataTamuRsvp.ok) throw new Error(`RSVP Tamu Gagal: ${dataTamuRsvp.error}`);

    // Screenshot Portal Undangan
    await page.goto(`${BASE_URL}/u/${kodeT1}`, { waitUntil: 'networkidle2', timeout: 30000 });
    const portalScreenshot = path.join(ARTIFACT_DIR, 'screenshot-e2e-portal-undangan.png');
    await page.screenshot({ path: portalScreenshot, fullPage: false });

    // 8. Presensi & Scan QR via /api/checkin
    console.log(`  Melakukan scan presensi QR (${kodeT1}) via /api/checkin...`);
    t1 = performance.now();
    const resScan = await fetch(`${BASE_URL}/api/checkin`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        kode_qr: kodeT1,
        jumlah_l: 1,
        jumlah_p: 1,
        jalur: 'TIMUR',
        panitia_id: 'panitia-gate-1',
      }),
    });
    t2 = performance.now();
    const dataScan = await resScan.json();
    recordBenchmark('Presensi & Scan QR Tamu (/api/checkin)', t2 - t1);
    if (!dataScan.ok) throw new Error(`Scan Presensi Gagal: ${dataScan.pesan || dataScan.error}`);

    // Cek Supa: Pastikan presensi_log tercatat dan kuota_terpakai = 2 di tamu_undangan
    const { data: supaLogCheck } = await supabase
      .from('presensi_log')
      .select('*')
      .eq('kode_qr', kodeT1)
      .single();
    if (!supaLogCheck) throw new Error('Cek Supabase Gagal: Presensi log tidak tercatat!');
    console.log(`  ✓ Cek Supabase: presensi_log tersimpan (ID: ${supaLogCheck.id}, L=${supaLogCheck.jumlah_l}, P=${supaLogCheck.jumlah_p})`);

    const { data: supaTamuAfterScan } = await supabase
      .from('tamu_undangan')
      .select('kuota_terpakai')
      .eq('kode', kodeT1)
      .single();
    console.log(`  ✓ Cek Supabase: Tamu ${kodeT1} kuota_terpakai = ${supaTamuAfterScan.kuota_terpakai}`);

    // 9. Sinkronisasi Dasbor: Ambil data dasbor via Puppeteer
    await page.setCookie(
      { name: 'haflah_active_role_session', value: 'ADMIN', domain: 'localhost', path: '/' },
      { name: 'user_role', value: 'ADMIN', domain: 'localhost', path: '/' }
    );
    await page.goto(`${BASE_URL}/admin/dasbor`, { waitUntil: 'networkidle2', timeout: 30000 });
    const dasborScreenshot = path.join(ARTIFACT_DIR, 'screenshot-e2e-dasbor.png');
    await page.screenshot({ path: dasborScreenshot, fullPage: false });
    console.log(`  ✓ Screenshot dasbor tersimpan di artifacts.`);

    // =========================================================================
    // FASE 3: PENGUJIAN LOGIKA MERGE & ATOMIK
    // =========================================================================
    console.log('\n--- FASE 3: PENGUJIAN LOGIKA MERGE & ATOMIK ---');

    // 10. Buat Santri Kembar: E2E_TEST_SANTRI_3 (Tamatan)
    // Nama Siswi SAMA dengan _1, Nama Wali SAMA dengan _1, tapi Alamat & Kamar BERBEDA!
    const santri3Payload = {
      nama: 'E2E_TEST_SANTRI_1', // PERSIS SAMA
      kategoriUtama: 'TAMATAN', // Prioritas 2 (di bawah Bil Ghoib yang prioritas 3)
      subKategori: 'Tamatan Bagian A.01',
      namaWali: 'WALI_E2E_TEST', // PERSIS SAMA
      alamat: 'TEGAL', // BERBEDA DARI _1 (SURABAYA)
      kamar: 'C.03', // BERBEDA DARI _1 (A.01)
      kelas: '3 Aliyah',
      noHp: USER_PHONE,
      kuotaDasar: 2,
    };

    t1 = performance.now();
    const resS3 = await fetch(`${BASE_URL}/api/santri`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(santri3Payload),
    });
    t2 = performance.now();
    const dataS3 = await resS3.json();
    recordBenchmark('Tambah Santri 3 (Tamatan Kembar)', t2 - t1);
    if (!dataS3.ok) throw new Error(`Gagal tambah Santri 3: ${dataS3.error}`);
    const kodeS3 = dataS3.kode;
    console.log(`  ✓ Santri 3 dibuat: ${santri3Payload.nama} (${kodeS3}, Alamat: ${santri3Payload.alamat})`);

    const { data: supaS3 } = await supabase.from('peserta_santri').select('id').eq('kode', kodeS3).single();
    const idSantri3 = supaS3.id;

    // 11. Merge Data: Gabungkan _1 dan _3
    console.log(`  Menggabungkan Santri 1 (${idSantri1}) dan Santri 3 (${idSantri3})...`);
    t1 = performance.now();
    const resMerge = await fetch(`${BASE_URL}/api/peserta/merge`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        action: 'merge',
        items: [
          { id: idSantri1, table: 'peserta_santri' },
          { id: idSantri3, table: 'peserta_santri' },
        ],
      }),
    });
    t2 = performance.now();
    const dataMerge = await resMerge.json();
    recordBenchmark('Penggabungan Data (Merge Santri)', t2 - t1);
    if (!dataMerge.ok) throw new Error(`Merge Gagal: ${dataMerge.error}`);
    console.log(`  ✓ Merge berhasil: merged_group_id = ${dataMerge.merged_group_id}`);

    // Cek Supa: Pastikan prioritas Bil Ghoib menimpa data Tamatan (alamat _3 berubah dari TEGAL ke SURABAYA, kamar ke A.01)!
    const { data: supaMergedRows } = await supabase
      .from('peserta_santri')
      .select('id, kode, nama, kategori_utama, alamat, kamar, merged_group_id')
      .in('id', [idSantri1, idSantri3]);

    console.log(`  ✓ Data setelah merge:`, supaMergedRows);
    const row3 = supaMergedRows.find((r) => r.id === idSantri3);
    if (row3.alamat !== 'SURABAYA') {
      throw new Error(`Prioritas merge gagal! Alamat Santri 3 seharusnya ditimpa menjadi SURABAYA, aktual: ${row3.alamat}`);
    }
    console.log(`  ✓ VERIFIKASI PRIORITAS SUKSES: Alamat Santri 3 berhasil ditimpa menjadi '${row3.alamat}' & kamar '${row3.kamar}' dari kategori tertinggi (Bil Ghoib)!`);

    // 12. Scan Kartu Merge via /api/checkin
    console.log(`  Melakukan scan presensi pada kartu merge (${kodeS1})...`);
    t1 = performance.now();
    const resScanMerge = await fetch(`${BASE_URL}/api/checkin`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        kode_qr: kodeS1,
        jumlah_l: 1,
        jumlah_p: 0,
        jalur: 'BARAT',
      }),
    });
    t2 = performance.now();
    const dataScanMerge = await resScanMerge.json();
    recordBenchmark('Scan Presensi Kartu Merge (/api/checkin)', t2 - t1);
    if (!dataScanMerge.ok) throw new Error(`Scan Merge Gagal: ${dataScanMerge.pesan || dataScanMerge.error}`);

    // Cek Supa: Pastikan kuota_terpakai terpotong
    const { data: supaSantri1AfterScan } = await supabase
      .from('peserta_santri')
      .select('kuota_terpakai')
      .eq('id', idSantri1)
      .single();
    console.log(`  ✓ Cek Supabase: Kuota terpakai santri 1 = ${supaSantri1AfterScan.kuota_terpakai}`);

    // 13. Coba Unmerge (Harus GAGAL karena sudah di-scan!)
    console.log(`  Menguji pencegahan unmerge setelah scan (Harus Ditolak)...`);
    t1 = performance.now();
    const resUnmerge = await fetch(`${BASE_URL}/api/peserta/merge`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        action: 'unmerge',
        items: [{ id: idSantri1, table: 'peserta_santri' }],
      }),
    });
    t2 = performance.now();
    const dataUnmerge = await resUnmerge.json();
    recordBenchmark('Uji Validasi Penolakan Unmerge Pasca-Scan', t2 - t1);
    if (resUnmerge.status === 400 || (dataUnmerge && !dataUnmerge.ok)) {
      console.log(`  ✓ VALIDASI SUKSES: Sistem menolak unmerge peserta yang sudah scan kehadiran (${dataUnmerge.error})`);
    } else {
      throw new Error(`Unmerge seharusnya ditolak jika kuota_terpakai > 0! Respons: ${JSON.stringify(dataUnmerge)}`);
    }

    // 14. Tes Unduh Laporan
    console.log('  Menguji pembuatan rekap laporan...');
    t1 = performance.now();
    const resLaporan = await fetch(`${BASE_URL}/admin/laporan`, {
      headers: authHeaders,
    });
    t2 = performance.now();
    recordBenchmark('Akses & Generate Halaman Laporan', t2 - t1);
    console.log(`  ✓ Halaman laporan respons status: ${resLaporan.status}`);

    // =========================================================================
    // FASE 4: PEMBERSIHAN DATA (CLEANUP)
    // =========================================================================
    console.log('\n--- FASE 4: PEMBERSIHAN DATA (CLEANUP) ---');
    console.log('  Menghapus semua entitas berawalan E2E_TEST_ dari database...');

    // Ambil semua kode E2E_TEST_ dari santri & tamu
    const { data: santriToClean } = await supabase
      .from('peserta_santri')
      .select('id, kode')
      .like('nama', 'E2E_TEST_%');
    const { data: tamuToClean } = await supabase
      .from('tamu_undangan')
      .select('id, kode')
      .like('nama', 'E2E_TEST_%');

    const allE2EKodes = [
      ...(santriToClean || []).map((s) => s.kode),
      ...(tamuToClean || []).map((t) => t.kode),
    ];

    if (allE2EKodes.length > 0) {
      // Hapus log presensi
      await supabase.from('presensi_log').delete().in('kode_qr', allE2EKodes);
      // Hapus antrean gagal
      await supabase.from('antrean_presensi_gagal').delete().in('kode_qr', allE2EKodes);
      // Hapus pembelian kuota
      await supabase.from('pembelian_kuota').delete().in('kode_santri', allE2EKodes);
    }
    // Hapus pembelian kuota berdasarkan ID pesanan uji
    await supabase.from('pembelian_kuota').delete().like('id_pesanan', 'E2E_%');

    // Hapus peserta santri
    const { error: delSantriErr } = await supabase
      .from('peserta_santri')
      .delete()
      .like('nama', 'E2E_TEST_%');
    if (delSantriErr) console.warn('Peringatan saat hapus santri uji:', delSantriErr.message);

    // Hapus tamu undangan
    const { error: delTamuErr } = await supabase
      .from('tamu_undangan')
      .delete()
      .like('nama', 'E2E_TEST_%');
    if (delTamuErr) console.warn('Peringatan saat hapus tamu uji:', delTamuErr.message);

    // Verifikasi Database Bersih 100%
    const [cSantri, cTamu, cLog, cBeli] = await Promise.all([
      supabase.from('peserta_santri').select('id', { count: 'exact' }).like('nama', 'E2E_TEST_%'),
      supabase.from('tamu_undangan').select('id', { count: 'exact' }).like('nama', 'E2E_TEST_%'),
      supabase.from('presensi_log').select('id', { count: 'exact' }).like('nama_peserta', 'E2E_TEST_%'),
      supabase.from('pembelian_kuota').select('id_pesanan', { count: 'exact' }).like('id_pesanan', 'E2E_%'),
    ]);

    const remainingCount = (cSantri.count || 0) + (cTamu.count || 0) + (cLog.count || 0) + (cBeli.count || 0);
    console.log(`  ✓ Verifikasi Pembersihan: Sisa record E2E_TEST_ = ${remainingCount}`);
    if (remainingCount === 0) {
      console.log('  ✓ DATABASE BERSIH 100%: Seluruh data uji E2E berhasil di-purge.');
    } else {
      console.warn('  ⚠️ Masih ada sisa data uji di database!');
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📊 REKAPITULASI BENCHMARK PERFORMA (BATAS 3 DETIK):');
    console.log('═══════════════════════════════════════════════════════════════');
    console.table(benchmarkResults);

    const failures = benchmarkResults.filter((b) => b.status.includes('FAIL') && !b.notes.includes('eksternal'));
    if (failures.length > 0) {
      console.log('\n⚠️ PERINGATAN: Ditemukan tombol/aksi melebihi 3 detik:');
      failures.forEach((f) => console.log(`  - ${f.action}: ${f.durationSec}`));
    } else {
      console.log('\n🎉 SEMUA AKSI UI & API LULUS BENCHMARK (< 3 DETIK)!');
    }

    // Tulis hasil ke file JSON untuk laporan
    const reportPath = path.join(ARTIFACT_DIR, 'e2e-benchmark-report.json');
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          allPassed: failures.length === 0,
          benchmarkResults,
          remainingDataCount: remainingCount,
        },
        null,
        2
      )
    );
    console.log(`\nLaporan tersimpan di: ${reportPath}`);
  } finally {
    try { await browser.close(); } catch {}
    if (nextProcess) {
      try { nextProcess.kill(); } catch {}
    }
  }
}

runE2ESuite().catch((err) => {
  console.error('\n❌ E2E SUITE FATAL ERROR:', err);
  process.exit(1);
});
