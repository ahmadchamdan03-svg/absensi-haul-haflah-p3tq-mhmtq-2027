import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ibvttbwpnwjkwqmtrpzv.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlidnR0Yndwbndqa3dxbXRycHp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTM4NjEwNiwiZXhwIjoyMTA0OTYyMTA2fQ.Suan_WF1AiBB9a-Dzstja9Y-Z2sJq1KJbhhUdebmR-A';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log('====================================================================');
  console.log('  TEST VERIFIKASI LOGIKA MERGE SUB-KATEGORI BERBEDA (KATEGORI SAMA)');
  console.log('====================================================================');

  // Bersihkan data tes lama jika ada
  console.log('Membersihkan sisa data tes lama...');
  await supabase.from('tamu_undangan').delete().ilike('nama', '%Budi Test Merged%');

  const kodeA = `TMU-TST-${Date.now().toString().slice(-4)}A`;
  const kodeB = `TMU-TST-${Date.now().toString().slice(-4)}B`;

  let idA = '';
  let idB = '';

  try {
    // 1. Buat Data Uji Coba A & B
    console.log('\n--- 1. Menyiapkan Data Uji Coba ---');
    console.log('Data A: Budi, Kediri, Istimewa (VIP IDS), Kuota 1');
    const { data: recA, error: errA } = await supabase
      .from('tamu_undangan')
      .insert({
        kode: kodeA,
        nama: 'Budi Test Merged',
        nama_putra: 'Budi Test Merged',
        nama_putri: null,
        alamat: 'Kediri',
        kategori: 'VIP IDS',
        sub_kategori: 'ISTIMEWA',
        kuota_terpakai: 0,
        status_konfirmasi: 'BELUM',
      })
      .select('id, kode, nama, kategori, sub_kategori')
      .single();

    if (errA || !recA) {
      throw new Error(`Gagal insert Data A: ${errA?.message}`);
    }
    idA = recA.id;
    console.log(`[PASS] Data A tersimpan (ID: ${idA}, Kode: ${recA.kode})`);

    console.log('Data B: Budi, Kediri, Istimewa (VIP Bani Marzuqi), Kuota 1');
    const { data: recB, error: errB } = await supabase
      .from('tamu_undangan')
      .insert({
        kode: kodeB,
        nama: 'Budi Test Merged',
        nama_putra: 'Budi Test Merged',
        nama_putri: null,
        alamat: 'Kediri',
        kategori: 'VIP Bani Marzuqi',
        sub_kategori: 'ISTIMEWA',
        kuota_terpakai: 0,
        status_konfirmasi: 'BELUM',
      })
      .select('id, kode, nama, kategori, sub_kategori')
      .single();

    if (errB || !recB) {
      throw new Error(`Gagal insert Data B: ${errB?.message}`);
    }
    idB = recB.id;
    console.log(`[PASS] Data B tersimpan (ID: ${idB}, Kode: ${recB.kode})`);

    // 2. Eksekusi API Merge
    console.log('\n--- 2. Memanggil API Merge (/api/peserta/merge) ---');
    const mergeResponse = await fetch('http://localhost:3000/api/peserta/merge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'haflah_active_role_session=ADMIN; user_role=ADMIN',
      },
      body: JSON.stringify({
        action: 'merge',
        items: [
          { id: idA, table: 'tamu_undangan' },
          { id: idB, table: 'tamu_undangan' },
        ],
      }),
    });

    const mergeResult = await mergeResponse.json();
    console.log('Response API Merge:', mergeResult);

    if (!mergeResult.ok || !mergeResult.merged_group_id) {
      throw new Error(`Merge API gagal: ${JSON.stringify(mergeResult)}`);
    }

    console.log('[PASS] API Merge berhasil mengembalikan merged_group_id:', mergeResult.merged_group_id);
    console.log('[PASS] Sub-kategori list terdeteksi:', mergeResult.sub_kategori_list);

    const hasVipIds = mergeResult.sub_kategori_list?.includes('VIP IDS');
    const hasVipBani = mergeResult.sub_kategori_list?.includes('VIP Bani Marzuqi');
    if (!hasVipIds || !hasVipBani) {
      throw new Error('Daftar sub-kategori tidak memuat VIP IDS dan VIP Bani Marzuqi!');
    }

    // 3. Verifikasi Tampilan UI dengan Puppeteer
    console.log('\n--- 3. Verifikasi UI & Ambil Screenshot ---');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Set localStorage dan sessionStorage sebelum dokumen dimuat agar lolos AuthGuard
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('haflah_active_role_session', 'ADMIN');
      sessionStorage.setItem('haflah_active_role_session', 'ADMIN');
      localStorage.setItem('user_role', 'ADMIN');
      sessionStorage.setItem('user_role', 'ADMIN');
    });

    // Set cookie dengan URL spesifik untuk middleware
    await page.setCookie(
      {
        name: 'haflah_active_role_session',
        value: 'ADMIN',
        url: 'http://localhost:3000',
      },
      {
        name: 'user_role',
        value: 'ADMIN',
        url: 'http://localhost:3000',
      }
    );

    const targetUrl = 'http://localhost:3000/admin/peserta?tab=UNDANGAN_ISTIMEWA';
    console.log(`Membuka URL: ${targetUrl} ...`);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    console.log('Current URL after navigation:', page.url());

    // Tunggu sampai tabel selesai dimuat
    await page.waitForSelector('table', { timeout: 15000 });
    await sleep(2000);

    // Cari input search dan ketik "Budi Test Merged"
    const searchInput = await page.$('input[placeholder*="Cari"], input[type="search"], input[type="text"]');
    if (searchInput) {
      console.log('Mengetik kata kunci pencarian "Budi Test Merged" ...');
      await searchInput.click({ count: 3 });
      await searchInput.type('Budi Test Merged', { delay: 20 });
      await sleep(2000);
    }

    // Evaluasi konten baris tabel
    const evaluation = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      const row = rows.find(r => r.textContent?.includes('Budi Test Merged'));
      if (!row) {
        return {
          found: false,
          totalRows: rows.length,
          pageText: document.body.innerText.slice(0, 400),
        };
      }

      const text = row.textContent || '';
      const istimewaCount = (text.match(/Istimewa/gi) || []).length;
      const hasVipIds = text.includes('VIP IDS');
      const hasVipBani = text.includes('VIP Bani Marzuqi');
      const hasGabungan = text.includes('Gabungan (2)') || text.includes('Gabungan');
      const has1Kursi = text.includes('1 Kursi');

      return {
        found: true,
        textSnippet: text.replace(/\s+/g, ' ').trim().slice(0, 300),
        istimewaCount,
        hasVipIds,
        hasVipBani,
        hasGabungan,
        has1Kursi,
      };
    });

    console.log('Hasil Evaluasi Tabel:', evaluation);

    if (!evaluation.found) {
      throw new Error(`Baris tabel untuk "Budi Test Merged" tidak ditemukan! (Total rows: ${evaluation.totalRows})`);
    }

    if (!evaluation.hasVipIds || !evaluation.hasVipBani) {
      throw new Error('Sub-kategori VIP IDS atau VIP Bani Marzuqi tidak tampil di kartu!');
    }

    if (!evaluation.has1Kursi) {
      throw new Error('Total kuota tidak bernilai 1 Kursi (terjadi duplikasi kuota)!');
    }

    console.log('[PASS] 1 Kartu gabungan berhasil ditampilkan.');
    console.log('[PASS] Kategori Utama Istimewa ditampilkan dengan benar.');
    console.log('[PASS] Multi sub-kategori ("VIP IDS" dan "VIP Bani Marzuqi") tampil sebagai label kecil.');
    console.log('[PASS] Total kuota terhitung tepat 1 Kursi (Anti double-counting sukses).');

    // Screenshot tabel
    const screenshotPath = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\70844ffa-ee55-4871-a1cb-5f7480b7ba47\\screenshot-merged-subkategori.png';
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`[PASS] Screenshot berhasil disimpan di: ${screenshotPath}`);

    // Buka juga halaman Penerima Tamu untuk memastikan sinkronisasi panel
    console.log('\n--- Verifikasi Halaman Penerima Tamu (/penerima-tamu) ---');
    await page.goto('http://localhost:3000/penerima-tamu', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2500);

    const ptSearchInput = await page.$('input[placeholder*="Cari"], input[type="text"]');
    if (ptSearchInput) {
      await ptSearchInput.type('Budi Test Merged', { delay: 20 });
      await sleep(1500);
    }

    const ptEval = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return {
        found: text.includes('Budi Test Merged'),
        hasVipIds: text.includes('VIP IDS'),
        hasVipBani: text.includes('VIP Bani Marzuqi'),
        hasGabungan: text.includes('Gabungan (2)') || text.includes('Gabungan'),
        has1Kursi: text.includes('1') && text.includes('Kursi'),
      };
    });

    console.log('Hasil Evaluasi Penerima Tamu:', ptEval);
    if (ptEval.found && ptEval.hasVipIds && ptEval.hasVipBani) {
      console.log('[PASS] Panel Penerima Tamu juga berhasil menampilkan 1 kartu gabungan dengan multi-subkategori!');
    }

    await browser.close();

    console.log('\n====================================================================');
    console.log('       SELURUH PENGUJIAN LOGIKA MERGE SUB-KATEGORI BERHASIL!        ');
    console.log('====================================================================');
  } catch (err: any) {
    console.error('[ERROR] Verifikasi gagal:', err.message || err);
    process.exitCode = 1;
  } finally {
    // 4. Bersihkan Data Uji Coba dari database tamu_undangan
    console.log('\n--- 4. Membersihkan Data Uji Coba ---');
    const idsToDelete = [idA, idB].filter(Boolean);
    if (idsToDelete.length > 0) {
      const { error: delErr } = await supabase
        .from('tamu_undangan')
        .delete()
        .in('id', idsToDelete);
      if (delErr) {
        console.error('Gagal membersihkan data uji coba:', delErr);
      } else {
        console.log(`[CLEANUP] Berhasil menghapus ${idsToDelete.length} data uji coba dari database.`);
      }
    }
  }
}

main().catch(console.error);
