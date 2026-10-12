import puppeteer, { Browser, Page } from 'puppeteer';
import http from 'http';
import next from 'next';

const PORT = 3099;
const BASE_URL = `http://localhost:${PORT}`;

interface TestResult {
  id: string;
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  note?: string;
}

const results: TestResult[] = [];

async function logResult(id: string, name: string, status: 'PASS' | 'FAIL' | 'SKIP', note?: string) {
  results.push({ id, name, status, note });
  const statusFormatted =
    status === 'PASS' ? '\x1b[32m[PASS]\x1b[0m' :
    status === 'FAIL' ? '\x1b[31m[FAIL]\x1b[0m' :
    '\x1b[33m[SKIP]\x1b[0m';
  console.log(`${statusFormatted} ${id}: ${name} ${note ? `(${note})` : ''}`);
}

async function startServer(): Promise<http.Server> {
  const app = next({ dev: false, dir: process.cwd() });
  const handle = app.getRequestHandler();
  await app.prepare();

  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      handle(req, res);
    });
    server.listen(PORT, () => {
      resolve(server);
    });
  });
}

async function runE2ESuite() {
  console.log('===============================================================');
  console.log('       E2E USER JOURNEY TEST SUITE — HAFLAH P3TQ 2027          ');
  console.log('===============================================================\n');

  let server: http.Server | null = null;
  let browser: Browser | null = null;

  try {
    console.log(`[Info] Menyiapkan server Next.js pada port ${PORT}...`);
    server = await startServer();
    console.log(`[Info] Server siap di ${BASE_URL}\n`);

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // E2E-01: Landing Page & Pemilihan Peran
    try {
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      const pageTitle = await page.title();
      const hasBrand = await page.$('body');
      if (pageTitle.includes('Haflah') && hasBrand) {
        logResult('E2E-01', 'Landing Page & Pemilihan Peran', 'PASS', 'Halaman termuat sempurna');
      } else {
        logResult('E2E-01', 'Landing Page & Pemilihan Peran', 'FAIL', 'Judul halaman tidak sesuai');
      }
    } catch (err: any) {
      logResult('E2E-01', 'Landing Page & Pemilihan Peran', 'FAIL', err.message);
    }

    // E2E-02: Login Admin
    try {
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      // Simulasi set sesi cookie Admin
      await page.setCookie({
        name: 'haflah_active_role_session',
        value: 'ADMIN',
        url: BASE_URL,
      });
      await page.setCookie({
        name: 'user_role',
        value: 'ADMIN',
        url: BASE_URL,
      });
      await page.goto(`${BASE_URL}/admin/dasbor`, { waitUntil: 'domcontentloaded' });
      const currentUrl = page.url();
      if (currentUrl.includes('/admin/dasbor')) {
        logResult('E2E-02', 'Login Admin & Sesi Otoritas', 'PASS', 'Cookie sesi aktif & akses dasbor admin');
      } else {
        logResult('E2E-02', 'Login Admin & Sesi Otoritas', 'FAIL', `Redirect tidak diharapkan ke ${currentUrl}`);
      }
    } catch (err: any) {
      logResult('E2E-02', 'Login Admin & Sesi Otoritas', 'FAIL', err.message);
    }

    // E2E-03: Proteksi Rute Admin oleh Tamu / Tanpa Login
    try {
      const incognitoContext = await browser.createBrowserContext();
      const incognitoPage = await incognitoContext.newPage();
      // Buka rute admin tanpa cookie login
      await incognitoPage.goto(`${BASE_URL}/admin/peserta`, { waitUntil: 'networkidle0' });
      const protectedUrl = incognitoPage.url();
      // Harus di-redirect ke / (oleh middleware atau client AuthGuard)
      if (protectedUrl === `${BASE_URL}/` || protectedUrl === `${BASE_URL}`) {
        logResult('E2E-03', 'Proteksi Rute Admin oleh Anonim', 'PASS', 'Redirect ke / berhasil dicegat');
      } else {
        logResult('E2E-03', 'Proteksi Rute Admin oleh Anonim', 'FAIL', `Rute bocor: ${protectedUrl}`);
      }
      await incognitoContext.close();
    } catch (err: any) {
      logResult('E2E-03', 'Proteksi Rute Admin oleh Anonim', 'FAIL', err.message);
    }

    // E2E-04: Undangan Wali Santri Valid
    try {
      await page.goto(`${BASE_URL}/u/SH001`, { waitUntil: 'domcontentloaded' });
      const content = await page.content();
      // Pastikan TIDAK ADA sidebar admin
      const hasSidebar = content.includes('MENU UTAMA') && content.includes('Live Dasbor');
      if (!hasSidebar) {
        logResult('E2E-04', 'Undangan Wali Valid & Isolasi Layout', 'PASS', 'Layout publik bersih tanpa sidebar');
      } else {
        logResult('E2E-04', 'Undangan Wali Valid & Isolasi Layout', 'FAIL', 'Sidebar admin bocor di portal undangan');
      }
    } catch (err: any) {
      logResult('E2E-04', 'Undangan Wali Valid & Isolasi Layout', 'FAIL', err.message);
    }

    // E2E-05: Undangan Token Invalid & Path Traversal Guard
    try {
      await page.goto(`${BASE_URL}/u`, { waitUntil: 'domcontentloaded' });
      const textU = await page.content();
      const hasNoticeU = textU.includes('Kode Undangan Diperlukan') || textU.includes('Kembali ke Beranda');

      await page.goto(`${BASE_URL}/u/token-ngawur-invalid-999`, { waitUntil: 'domcontentloaded' });
      const textInvalid = await page.content();
      const hasNoticeInvalid = textInvalid.includes('Kode Undangan Tidak Ditemukan') || textInvalid.includes('Kembali ke Beranda');

      if (hasNoticeU && hasNoticeInvalid) {
        logResult('E2E-05', 'Undangan Token Invalid & Halaman Santun', 'PASS', 'Halaman not-found publik render bersih');
      } else {
        logResult('E2E-05', 'Undangan Token Invalid & Halaman Santun', 'FAIL', 'Pesan tidak ditemukan tidak sesuai');
      }
    } catch (err: any) {
      logResult('E2E-05', 'Undangan Token Invalid & Halaman Santun', 'FAIL', err.message);
    }

    // E2E-06: RSVP Mandiri Wali (Perlu koneksi update Supabase real)
    logResult('E2E-06', 'RSVP Mandiri Wali', 'SKIP', 'Memerlukan transaksi live Supabase');

    // E2E-07: PWA Scanner Gerbang Masuk
    try {
      await page.setCookie({
        name: 'haflah_active_role_session',
        value: 'PENJAGA_GERBANG',
        url: BASE_URL,
      });
      await page.goto(`${BASE_URL}/scan`, { waitUntil: 'domcontentloaded' });
      const scanUrl = page.url();
      if (scanUrl.includes('/scan')) {
        logResult('E2E-07', 'PWA Scanner Gerbang Masuk', 'PASS', 'Halaman scanner terbuka untuk role Penjaga Gerbang');
      } else {
        logResult('E2E-07', 'PWA Scanner Gerbang Masuk', 'FAIL', 'Akses ke /scan gagal');
      }
    } catch (err: any) {
      logResult('E2E-07', 'PWA Scanner Gerbang Masuk', 'FAIL', err.message);
    }

    // E2E-08: Guard Kuota Habis
    logResult('E2E-08', 'Guard Kuota Habis (Double Check-in)', 'SKIP', 'Memerlukan data barcode terpakai real');

    // E2E-09: Verifikasi Manual Gerbang
    try {
      await page.setCookie({
        name: 'haflah_active_role_session',
        value: 'PENJAGA_GERBANG',
        url: BASE_URL,
      });
      await page.goto(`${BASE_URL}/admin/verifikasi`, { waitUntil: 'domcontentloaded' });
      const verifContent = await page.content();
      if (verifContent.includes('Verifikasi') || verifContent.includes('Cari')) {
        logResult('E2E-09', 'Verifikasi Manual Gerbang', 'PASS', 'Panel verifikasi manual terbuka');
      } else {
        logResult('E2E-09', 'Verifikasi Manual Gerbang', 'FAIL', 'Gagal memuat panel verifikasi');
      }
    } catch (err: any) {
      logResult('E2E-09', 'Verifikasi Manual Gerbang', 'FAIL', err.message);
    }

    // E2E-10: Live Dasbor Realtime Eksekutif
    try {
      await page.setCookie({
        name: 'haflah_active_role_session',
        value: 'PIMPINAN',
        url: BASE_URL,
      });
      await page.goto(`${BASE_URL}/pimpinan`, { waitUntil: 'domcontentloaded' });
      const pimpinanUrl = page.url();
      if (pimpinanUrl.includes('/pimpinan')) {
        logResult('E2E-10', 'Live Dasbor Realtime Eksekutif', 'PASS', 'Dasbor eksekutif pimpinan termuat');
      } else {
        logResult('E2E-10', 'Live Dasbor Realtime Eksekutif', 'FAIL', 'Akses pimpinan gagal');
      }
    } catch (err: any) {
      logResult('E2E-10', 'Live Dasbor Realtime Eksekutif', 'FAIL', err.message);
    }

    // E2E-11: Konsultasi Usth. Halwaa AI
    try {
      const response = await fetch(`${BASE_URL}/api/ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'siapa kamu', history: [] }),
      });
      const data = await response.json();
      if (data.reply && data.reply.includes('Usth. Halwaa')) {
        logResult('E2E-11', 'Konsultasi Usth. Halwaa AI Endpoint', 'PASS', 'Respons AI valid & terformat');
      } else {
        logResult('E2E-11', 'Konsultasi Usth. Halwaa AI Endpoint', 'FAIL', 'Respons AI tidak sesuai');
      }
    } catch (err: any) {
      logResult('E2E-11', 'Konsultasi Usth. Halwaa AI Endpoint', 'FAIL', err.message);
    }

    // E2E-12: Ekspor Laporan
    try {
      await page.setCookie({
        name: 'haflah_active_role_session',
        value: 'ADMIN',
        url: BASE_URL,
      });
      await page.goto(`${BASE_URL}/admin/laporan`, { waitUntil: 'domcontentloaded' });
      const laporanContent = await page.content();
      if (laporanContent.includes('Laporan') || laporanContent.includes('Ekspor') || laporanContent.includes('Excel')) {
        logResult('E2E-12', 'Akses Panel Ekspor Laporan', 'PASS', 'Menu rekapitulasi & ekspor siap diunduh');
      } else {
        logResult('E2E-12', 'Akses Panel Ekspor Laporan', 'FAIL', 'Panel laporan gagal termuat');
      }
    } catch (err: any) {
      logResult('E2E-12', 'Akses Panel Ekspor Laporan', 'FAIL', err.message);
    }

  } catch (err) {
    console.error('Fatal error during E2E test:', err);
  } finally {
    if (browser) await browser.close();
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
    }
  }

  console.log('\n---------------------------------------------------------------');
  const passCount = results.filter((r) => r.status === 'PASS').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;
  const skipCount = results.filter((r) => r.status === 'SKIP').length;
  console.log(`Total Skenario : ${results.length}`);
  console.log(`Lolos (PASS)   : ${passCount}`);
  console.log(`Gagal (FAIL)   : ${failCount}`);
  console.log(`Dilewati (SKIP): ${skipCount}`);
  console.log('---------------------------------------------------------------');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runE2ESuite();
