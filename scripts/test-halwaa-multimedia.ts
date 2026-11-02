import { generateLocalSmartResponseAsync, cleanAIResponse } from '../lib/halwaa/knowledge-base';

async function testMultimediaFeatures() {
  console.log('===============================================================');
  console.log('       TEST SUITE: USTH. HALWAA MULTIMEDIA & FILE EXPORT       ');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
      if (detail) console.error(`       Detail: ${detail}`);
      failed++;
    }
  }

  // 1. Gambar generatif saat diminta
  const resImage = await generateLocalSmartResponseAsync('tolong buatkan gambar panggung utama haflah');
  assert(
    resImage.includes('![') && resImage.includes('https://image.pollinations.ai/prompt/'),
    'Test 1: Menghasilkan gambar generatif via Markdown URL saat diminta eksplisit',
    resImage
  );

  // 2. Link eksternal saat diminta
  const resLink = await generateLocalSmartResponseAsync('apakah ada link toko merchandise pondok atau shopee');
  assert(
    resLink.includes('http') && resLink.includes('shopee.co.id'),
    'Test 2: Menghasilkan link eksternal (Shopee/website) saat diminta',
    resLink
  );

  // 3. Permintaan tabel data / Excel
  const resExcel = await generateLocalSmartResponseAsync('tolong buatkan tabel daftar pos penerima tamu');
  assert(
    resExcel.includes('|') && (resExcel.includes('Pos') || resExcel.includes('Tugas')),
    'Test 3: Menghasilkan Markdown Table saat diminta daftar dalam bentuk tabel/excel',
    resExcel
  );

  // 4. Permintaan PDF/Word
  const resPdf = await generateLocalSmartResponseAsync('tolong buatkan dokumen pdf susunan acara haflah');
  assert(
    resPdf.includes('[DOWNLOAD_PDF:') || resPdf.includes('susunan') || resPdf.includes('Acara'),
    'Test 4: Menangani permintaan ekspor PDF dengan tag unduhan atau dokumen tertata',
    resPdf
  );

  // 5. ATURAN EMAS: Larangan Penawaran Proaktif (Unsolicited Offer)
  const normalQueries = [
    'kapan registrasi gerbang dibuka?',
    'siapa ketua panitia?',
    'berapa biaya tamatan aliyah?',
    'bagaimana tata krama sowan ke masyayikh?',
  ];

  for (const q of normalQueries) {
    const res = await generateLocalSmartResponseAsync(q);
    const hasUnsolicitedOffer = /(apakah\s+(anda|kamu|us)\s+(ingin|mau|perlu|butuh).*?(pdf|word|excel|gambar)|jika\s+(anda|kamu|us).*?(butuh|perlu).*?(pdf|word|excel|gambar))/i.test(res);
    assert(
      !hasUnsolicitedOffer,
      `Test 5 (Golden Rule): Tidak menawarkan pembuatan file/gambar secara proaktif untuk "${q}"`,
      res
    );
  }

  // 6. Test regex cleanAIResponse pembersih tawaran tidak diminta
  const dirtyAIOutput = "Berikut jadwal acara Haflah: Pagi takhtiman, malam pengajian akbar.\n\nApakah Anda ingin saya buatkan file PDF untuk jadwal ini?";
  const cleaned = cleanAIResponse(dirtyAIOutput, "jadwal acara haflah");
  assert(
    !cleaned.toLowerCase().includes('apakah anda ingin saya buatkan file pdf'),
    'Test 6: cleanAIResponse berhasil memotong kalimat penawaran proaktif PDF/Word/Excel jika user tidak meminta',
    cleaned
  );

  console.log('---------------------------------------------------------------');
  console.log(`Total Uji   : ${passed + failed}`);
  console.log(`Lolos (PASS): ${passed}`);
  console.log(`Gagal (FAIL): ${failed}`);
  console.log('---------------------------------------------------------------');

  if (failed > 0) {
    process.exit(1);
  }
}

testMultimediaFeatures().catch((err) => {
  console.error(err);
  process.exit(1);
});
