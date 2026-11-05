import puppeteer from 'puppeteer';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log('Launching browser for image search verification...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Set auth cookie
  await page.setCookie({
    name: 'haflah_active_role_session',
    value: 'ADMIN',
    domain: 'localhost',
    path: '/',
  });

  console.log('Navigating to http://localhost:3000/admin/dasbor ...');
  await page.goto('http://localhost:3000/admin/dasbor', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2000);

  // Open Tanya Usth. Halwaa chat modal
  console.log('Opening Tanya Usth. Halwaa chat modal...');
  const buttons = await page.$$('button');
  let fab: any = null;
  for (const b of buttons) {
    const text = await page.evaluate((el) => el.textContent, b);
    if (text && (text.includes('Halwaa') || text.includes('Tanya'))) {
      fab = b;
      break;
    }
  }

  if (fab) {
    await fab.click();
    console.log('Clicked Halwaa button.');
  } else {
    const btn = await page.$('button[title*="Halwaa"], button[aria-label*="Halwaa"]');
    if (btn) await btn.click();
  }

  await sleep(1500);

  // Look for chat input
  const inputSelector =
    'textarea, input[placeholder*="Tanyakan"], input[placeholder*="Ketik"], input[type="text"]';
  await page.waitForSelector(inputSelector, { timeout: 8000 });
  const input = await page.$(inputSelector);
  if (input) {
    console.log('Typing query into chat: "Tolong carikan gambar Pondok Lirboyo di internet" ...');
    await input.type('Tolong carikan gambar Pondok Lirboyo di internet', { delay: 20 });
    await sleep(400);
    await page.keyboard.press('Enter');

    console.log('Waiting for AI response with real web image...');
    await sleep(12000);

    const screenshotPath =
      'C:\\Users\\user\\.gemini\\antigravity\\brain\\70844ffa-ee55-4871-a1cb-5f7480b7ba47\\screenshot-halwaa-web-image-lirboyo.png';
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log('Screenshot successfully saved to:', screenshotPath);
  } else {
    console.error('Chat input not found!');
  }

  await browser.close();
  console.log('Verification browser finished successfully.');
}

main().catch(console.error);
