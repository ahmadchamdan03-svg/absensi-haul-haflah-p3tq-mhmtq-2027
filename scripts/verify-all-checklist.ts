import { getHubunganKepanitiaanResponse } from '../lib/us-halwaa-kepanitiaan';
import { handleInfoSeksiQuery, detectInfoSeksiIntent } from '../lib/us-halwaa-seksi';
import { getLiveRekapKehadiran, detectRekapKehadiranIntent } from '../lib/us-halwaa-rekap';

async function verifyAll() {
  console.log('===============================================================');
  console.log('     VERIFIKASI SEMUA 18 SKENARIO SESUAI CHECKLIST USER        ');
  console.log('===============================================================\n');

  const missing10 = [
    { q: "reza siapa", expected: "Reza Fadhilul 'Ulum" },
    { q: "sa'dun siapa", expected: "Sa'dun Musthofa" },
    { q: "sadun siapa", expected: "Sa'dun Musthofa" },
    { q: "tsauri siapa", expected: "Sufyan Tsauri" },
    { q: "qoribah siapa", expected: "Qoribatul Maqbulah" },
    { q: "faqih siapa", expected: "Achmad Abdulloh Faqih" },
    { q: "agung siapa", expected: "Agung Shobirin" },
    { q: "ghozali siapa", expected: "Imam Ghozali" },
    { q: "fathoni siapa", expected: "Ahmad Fathoni Fikri" },
    { q: "waluyo siapa", expected: "Amin Nur Waluyo" },
  ];

  console.log('--- 1. UJI MISSING PERSONIL (10 NAMA) ---');
  for (let i = 0; i < missing10.length; i++) {
    const item = missing10[i];
    const res = getHubunganKepanitiaanResponse(item.q, false);
    const p = res.split('\n\n');
    const hasName = res.includes(item.expected);
    const pCount = p.length === 3;
    const noBeliau = !/\bbeliau\b/i.test(res);
    const hasP1Bold = p[0].includes(`**${item.expected}**`);
    const hasFans = /penggemar|fans|kagum|mengidolakan|idolakan|nge-fans|mendampingi|ikut|sisi|dekat/i.test(p[1]);
    const pass = hasName && pCount && noBeliau && hasP1Bold && hasFans;
    console.log(`[${pass ? 'PASS' : 'FAIL'}] #${i + 1} "${item.q}" -> ${item.expected} (3-P: ${pCount}, Bold: ${hasP1Bold}, No Beliau: ${noBeliau})`);
    if (!pass) {
      console.log('Output:\n', res);
    }
  }

  console.log('\n--- 2. UJI BAHASA JAWA (2 QUERY) ---');
  const jawa = [
    { q: "Reza niku sinten?", expected: "Reza Fadhilul 'Ulum" },
    { q: "sinten Qoribah?", expected: "Qoribatul Maqbulah" },
  ];
  for (let i = 0; i < jawa.length; i++) {
    const item = jawa[i];
    const res = getHubunganKepanitiaanResponse(item.q, false);
    const p = res.split('\n\n');
    const hasName = res.includes(item.expected);
    const pCount = p.length === 3;
    const noBeliau = !/\bbeliau\b/i.test(res);
    const pass = hasName && pCount && noBeliau;
    console.log(`[${pass ? 'PASS' : 'FAIL'}] #${i + 11} "${item.q}" -> ${item.expected} (3-P: ${pCount}, No Beliau: ${noBeliau})`);
    if (!pass) {
      console.log('Output:\n', res);
    }
  }

  console.log('\n--- 3. UJI REGRESI (6 SKENARIO) ---');
  // 13. ikfi siapa -> Ikfi Ulit Taufiqoh
  const res13 = getHubunganKepanitiaanResponse("ikfi siapa", false);
  const pass13 = res13.includes("Ikfi Ulit Taufiqoh") && !res13.includes("Akfi Romiyan");
  console.log(`[${pass13 ? 'PASS' : 'FAIL'}] #13 "ikfi siapa" -> Ikfi Ulit Taufiqoh (bukan Akfi)`);

  // 14. abha siapa -> Abhaa Muhammad Kafaa Bihi 3 paragraf
  const res14 = getHubunganKepanitiaanResponse("abha siapa", false);
  const pass14 = res14.includes("Abhaa Muhammad Kafaa Bihi") && res14.split('\n\n').length === 3;
  console.log(`[${pass14 ? 'PASS' : 'FAIL'}] #14 "abha siapa" -> Abhaa Muhammad Kafaa Bihi (3 paragraf)`);

  // 15. maulana siapa -> Muhammad Abdurrohman Maulana
  const res15 = getHubunganKepanitiaanResponse("maulana siapa", false);
  const pass15 = res15.includes("Muhammad Abdurrohman Maulana");
  console.log(`[${pass15 ? 'PASS' : 'FAIL'}] #15 "maulana siapa" -> Muhammad Abdurrohman Maulana`);

  // 16. dina siapa -> tidak ditemukan
  const res16 = getHubunganKepanitiaanResponse("dina siapa", false);
  const pass16 = res16.includes("nama **Dina** tidak ditemukan dalam struktur kepanitiaan");
  console.log(`[${pass16 ? 'PASS' : 'FAIL'}] #16 "dina siapa" -> nama Dina tidak ditemukan`);

  // 17. seksi keamanan -> Info Seksi
  const isSeksi17 = detectInfoSeksiIntent("seksi keamanan");
  const res17 = handleInfoSeksiQuery("seksi keamanan");
  const pass17 = isSeksi17 && res17.includes("Adi Susilo") && res17.includes("Qoribatul Maqbulah");
  console.log(`[${pass17 ? 'PASS' : 'FAIL'}] #17 "seksi keamanan" -> Info Seksi Keamanan Putra & Putri`);

  // 18. rekap kehadiran hari ini -> Live Supa
  const isRekap18 = detectRekapKehadiranIntent("rekap kehadiran hari ini");
  const res18 = await getLiveRekapKehadiran(false);
  const pass18 = isRekap18 && res18.includes("Shohibul Hajat") && res18.includes("Tamu Undangan");
  console.log(`[${pass18 ? 'PASS' : 'FAIL'}] #18 "rekap kehadiran hari ini" -> Rekap Live Supabase`);

  console.log('\n===============================================================');
  console.log('               SELURUH 18 SKENARIO VERIFIKASI SELESAI          ');
  console.log('===============================================================');
}

verifyAll();
