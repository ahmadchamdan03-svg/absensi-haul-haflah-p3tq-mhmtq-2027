import { getHubunganKepanitiaanResponse, detectHubunganKepanitiaanIntent } from '../lib/us-halwaa-kepanitiaan';
import { detectRekapKehadiranIntent, getLiveRekapKehadiran } from '../lib/us-halwaa-rekap';
import { detectInfoSeksiIntent, handleInfoSeksiQuery } from '../lib/us-halwaa-seksi';

interface TestCase {
  no: number;
  category: string;
  query: string;
  run: () => Promise<string> | string;
  validate: (res: string) => { passed: boolean; message?: string };
}

const testCases: TestCase[] = [
  // 1. Kata Ganti Dia -> Motivasi Satir (1 paragraf, 50 template)
  {
    no: 1,
    category: 'Kata Ganti Dia',
    query: 'siapa dia?',
    run: () => getHubunganKepanitiaanResponse('siapa dia?', false),
    validate: (res) => {
      const pCount = res.split('\n\n').length;
      const isSatir = res.includes('dia') || res.includes('Fokuslah') || res.includes('sukses');
      const noSalam = !res.includes("Wa'alaikum Salam");
      return {
        passed: pCount === 1 && isSatir && noSalam,
        message: `Expected 1 paragraph satir motivation, got ${pCount} paragraphs.`,
      };
    },
  },
  // 2. Kata Ganti Kamu -> Perkenalan Diri
  {
    no: 2,
    category: 'Kata Ganti Kamu',
    query: 'kamu siapa?',
    run: () => getHubunganKepanitiaanResponse('kamu siapa?', false),
    validate: (res) => {
      const hasName = res.includes('**Usth. Halwaa**');
      const hasSelfConcept = /asisten|kecerdasan buatan|AI|kode dan sistem/i.test(res);
      return {
        passed: hasName && hasSelfConcept,
        message: `Expected perkenalan diri with '**Usth. Halwaa**'`,
      };
    },
  },
  // 3. Kata Ganti Saya -> Motivasi Positif (2 Paragraf)
  {
    no: 3,
    category: 'Kata Ganti Saya',
    query: 'saya siapa?',
    run: () => getHubunganKepanitiaanResponse('saya siapa?', false),
    validate: (res) => {
      const pCount = res.split('\n\n').length;
      const isPositif = res.includes('hebat') || res.includes('luar biasa') || res.includes('khidmah') || res.includes('berkah') || res.includes('istimewa');
      return {
        passed: pCount === 2 && isPositif,
        message: `Expected 2 paragraphs positive motivation, got ${pCount}.`,
      };
    },
  },
  // 4. Kata Ganti Lain -> Tolak Edukatif
  {
    no: 4,
    category: 'Kata Ganti Lain',
    query: 'siapa beliau?',
    run: () => getHubunganKepanitiaanResponse('siapa beliau?', false),
    validate: (res) => {
      const isRejected = res.includes('tidak bisa mencari berdasarkan kata ganti orang') && res.includes('nama spesifik');
      return {
        passed: isRejected,
        message: `Expected educational rejection for pronoun query.`,
      };
    },
  },
  // 5. Rekap Kehadiran Realtime
  {
    no: 5,
    category: 'Rekap Kehadiran',
    query: 'rekap kehadiran hari ini',
    run: () => getLiveRekapKehadiran(false),
    validate: (res) => {
      const hasWali = res.includes('Wali Santri');
      const hasTamu = res.includes('Tamu Undangan');
      const noOldLabel = !res.includes('Shohibul Hajat') && !res.includes('Total Scan Hari Ini');
      const hasPresensiContext = res.includes('WIB') && res.includes('Persentase:');
      const noAdi = !res.includes('Adi Susilo');
      const noHardcode = !res.includes('536') && !res.includes('1.534');
      return {
        passed: hasWali && hasTamu && noOldLabel && hasPresensiContext && noAdi && noHardcode,
        message: `Expected live recap format with Wali Santri & Tamu Undangan, without Shohibul Hajat and without hardcoded 536/1.534.`,
      };
    },
  },
  // 6. Rekap Kehadiran (Variasi Query)
  {
    no: 6,
    category: 'Rekap Kehadiran',
    query: 'berapa tamu yang sudah datang',
    run: () => {
      const isRekap = detectRekapKehadiranIntent('berapa tamu yang sudah datang');
      if (!isRekap) return 'INTENT_NOT_DETECTED';
      return getLiveRekapKehadiran(false);
    },
    validate: (res) => {
      const hasWali = res.includes('Wali Santri');
      const hasTamu = res.includes('Tamu Undangan');
      const noOldLabel = !res.includes('Shohibul Hajat');
      return {
        passed: res !== 'INTENT_NOT_DETECTED' && hasWali && hasTamu && noOldLabel,
        message: `Expected live recap intent detected with Wali Santri and Tamu Undangan.`,
      };
    },
  },
  // 7. Info Seksi Spesifik: Desain Grafis
  {
    no: 7,
    category: 'Info Seksi',
    query: 'seksi desain grafis',
    run: () => handleInfoSeksiQuery('seksi desain grafis', false),
    validate: (res) => {
      const hasInamul = res.includes("In'amul Muttaqin");
      const hasAdiva = res.includes('Adiva');
      const hasClosing = res.includes('Ada lagi info kepanitiaan yang bisa saya bantu, Us?');
      return {
        passed: hasInamul && hasAdiva && hasClosing,
        message: `Expected Kasi/Wakasi putra & putri for Desain Grafis.`,
      };
    },
  },
  // 8. Info Seksi Anggota: Keamanan
  {
    no: 8,
    category: 'Info Seksi',
    query: 'anggota keamanan',
    run: () => handleInfoSeksiQuery('anggota keamanan', false),
    validate: (res) => {
      const hasAdi = res.includes('Adi Susilo');
      const hasIkfi = res.includes('Ikfi Ulit Taufiqoh');
      const hasAnggota = res.includes('Anggota');
      return {
        passed: hasAdi && hasIkfi && hasAnggota,
        message: `Expected complete security section members.`,
      };
    },
  },
  // 9. Info Seksi Seluruh Banom
  {
    no: 9,
    category: 'Info Seksi',
    query: 'sebutkan seluruh banom',
    run: () => handleInfoSeksiQuery('sebutkan seluruh banom', false),
    validate: (res) => {
      const has12 = res.includes('12. **Seksi PULP & TDM:**') || res.includes('PULP & TDM');
      const hasSekretariat = res.includes('1. **Seksi Sekretariat:**');
      return {
        passed: has12 && hasSekretariat,
        message: `Expected list of all 12 banom/seksi.`,
      };
    },
  },
  // 10. Info Seksi Tidak Ditemukan
  {
    no: 10,
    category: 'Info Seksi',
    query: 'seksi ngawur',
    run: () => handleInfoSeksiQuery('seksi ngawur', false),
    validate: (res) => {
      const hasNotFound = res.includes("seksi 'ngawur' tidak ditemukan");
      const hasList = res.includes('Seksi yang tersedia:');
      return {
        passed: hasNotFound && hasList,
        message: `Expected honest not-found message for unknown section.`,
      };
    },
  },
  // 11. Nama Tahap 1: Exact Phrase
  {
    no: 11,
    category: 'Nama (Exact Phrase)',
    query: 'ikfi ulit taufiqoh',
    run: () => getHubunganKepanitiaanResponse('ikfi ulit taufiqoh', false),
    validate: (res) => {
      const parts = res.split('\n\n');
      const hasName = res.includes('**Ikfi Ulit Taufiqoh**');
      const hasFans = /penggemar|fans|kagum|mengidolakan|nge-fans|mendampingi|ikut/i.test(parts[1] || '');
      const hasPenutup = (parts[2] || '').trim() === 'Ada lagi info kepanitiaan yang bisa saya bantu, Us?';
      return {
        passed: parts.length === 3 && hasName && hasFans && hasPenutup,
        message: `Expected 3 paragraphs with fans text and standard closing.`,
      };
    },
  },
  // 12. Nama Tahap 2A: Exact Alias Match
  {
    no: 12,
    category: 'Nama (Exact Alias)',
    query: 'maulana',
    run: () => getHubunganKepanitiaanResponse('maulana', false),
    validate: (res) => {
      const hasMaulana = res.includes('Muhammad Abdurrohman Maulana');
      const notGama = !res.includes('Gama Maulana Ilham');
      const notAdiva = !res.includes('Adiva Maulana');
      return {
        passed: hasMaulana && notGama && notAdiva,
        message: `Expected sole match to Pak Maulana, not Gama or Adiva.`,
      };
    },
  },
  // 13. Nama Tahap 2B: Substring Match Ganda (Verifikasi)
  {
    no: 13,
    category: 'Nama (Substring Ganda)',
    query: 'yazid',
    run: () => getHubunganKepanitiaanResponse('yazid', false),
    validate: (res) => {
      const hasAbu = res.includes('Abu Yazid Al Bustomi');
      const hasMahbub = res.includes('Muhammad Yazid Mahbubillah');
      const hasAsk = res.includes('Maksud Anda yang mana?');
      return {
        passed: hasAbu && hasMahbub && hasAsk,
        message: `Expected disambiguation between both Yazids.`,
      };
    },
  },
  // 14. Nama Tahap 2B: 1 Hasil
  {
    no: 14,
    category: 'Nama (1 Hasil)',
    query: 'asep',
    run: () => getHubunganKepanitiaanResponse('asep', false),
    validate: (res) => {
      const parts = res.split('\n\n');
      const hasAsep = res.includes('**Asep Darajat**');
      const hasClosing = (parts[2] || '').trim() === 'Ada lagi info kepanitiaan yang bisa saya bantu, Us?';
      return {
        passed: parts.length === 3 && hasAsep && hasClosing,
        message: `Expected 3 paragraphs for Asep Darajat.`,
      };
    },
  },
  // 15. Nama Tahap 3: Prefix Match
  {
    no: 15,
    category: 'Nama (Prefix Match)',
    query: 'taufi',
    run: () => getHubunganKepanitiaanResponse('taufi', false),
    validate: (res) => {
      const hasTaufiq = res.includes('Taufiq Hidayah');
      return {
        passed: hasTaufiq,
        message: `Expected candidates starting with 'taufi'.`,
      };
    },
  },
  // 16. Nama Tahap 4: Typo Tolerance (Levenshtein = 1)
  {
    no: 16,
    category: 'Nama (Typo Tolerance)',
    query: 'taufik',
    run: () => getHubunganKepanitiaanResponse('taufik', false),
    validate: (res) => {
      const hasHidayah = res.includes('Taufiq Hidayah');
      const hasKeamanan = res.includes('Muhammad Taufiq');
      const hasAsk = res.includes('Maksud Anda yang mana?');
      return {
        passed: hasHidayah && hasKeamanan && hasAsk,
        message: `Expected verification prompt for typo 'taufik' -> 'taufiq'.`,
      };
    },
  },
  // 17. Nama Tahap 5: Tidak Ditemukan
  {
    no: 17,
    category: 'Nama (Tidak Ada)',
    query: 'dina siapa',
    run: () => getHubunganKepanitiaanResponse('dina siapa', false),
    validate: (res) => {
      const hasNotFound = res.includes('nama **Dina** tidak ditemukan dalam struktur kepanitiaan');
      const notMaelani = !res.includes('Sinta Maelani');
      return {
        passed: hasNotFound && notMaelani,
        message: `Expected honest not found for 'dina', not matching to Sinta Maelani.`,
      };
    },
  },
  // 18. Prioritas: ikfi vs akfi
  {
    no: 18,
    category: 'Prioritas Pencarian',
    query: 'ikfi',
    run: () => getHubunganKepanitiaanResponse('ikfi', false),
    validate: (res) => {
      const isIkfi = res.includes('Ikfi Ulit Taufiqoh');
      const notAkfi = !res.includes('Akfi Romiyan Kafabih');
      return {
        passed: isIkfi && notAkfi,
        message: `Expected 'ikfi' to prioritize Ikfi Ulit Taufiqoh over Akfi Romiyan.`,
      };
    },
  },
  // 19. Prioritas: akfi
  {
    no: 19,
    category: 'Prioritas Pencarian',
    query: 'akfi',
    run: () => getHubunganKepanitiaanResponse('akfi', false),
    validate: (res) => {
      const isAkfi = res.includes('Akfi Romiyan Kafabih');
      return {
        passed: isAkfi,
        message: `Expected 'akfi' to match Akfi Romiyan Kafabih.`,
      };
    },
  },
  // 20. Konsistensi: abha (Locked 3 Paragraf & Standard Penutup)
  {
    no: 20,
    category: 'Kunci Template & Penutup',
    query: 'abha',
    run: () => getHubunganKepanitiaanResponse('abha', false),
    validate: (res) => {
      const parts = res.split('\n\n');
      const hasAbha = res.includes('**Abhaa Muhammad Kafaa Bihi**');
      const hasFans = /penggemar|fans|kagum|mengidolakan|nge-fans|mendampingi|ikut/i.test(parts[1] || '');
      const hasClosing = (parts[2] || '').trim() === 'Ada lagi info kepanitiaan yang bisa saya bantu, Us?';
      const noJavanese = !res.includes('Wonten ingkang saget dibantu');
      return {
        passed: parts.length === 3 && hasAbha && hasFans && hasClosing && noJavanese,
        message: `Expected locked 3 paragraphs, fans text, and standard Indonesian closing.`,
      };
    },
  },
  // 21. Auto-Sync: Reza Fadhilul 'Ulum (Wakasi Keamanan)
  {
    no: 21,
    category: 'Auto-Sync Personil',
    query: 'reza siapa',
    run: () => getHubunganKepanitiaanResponse('reza siapa', false),
    validate: (res) => {
      const parts = res.split('\n\n');
      const hasName = res.includes("**Reza Fadhilul 'Ulum**");
      const noBeliau = !/\bbeliau\b/i.test(res);
      return {
        passed: parts.length === 3 && hasName && noBeliau,
        message: `Expected Reza Fadhilul 'Ulum with 3 paragraphs and no 'beliau'.`,
      };
    },
  },
  // 22. Auto-Sync: Sa'dun Musthofa (Seksi Keamanan)
  {
    no: 22,
    category: 'Auto-Sync Personil',
    query: "sa'dun siapa",
    run: () => getHubunganKepanitiaanResponse("sa'dun siapa", false),
    validate: (res) => {
      const parts = res.split('\n\n');
      const hasName = res.includes('**Sa\'dun Musthofa**');
      return {
        passed: parts.length === 3 && hasName,
        message: `Expected Sa'dun Musthofa with 3 paragraphs.`,
      };
    },
  },
  // 23. Toleransi Apostrof: sadun siapa (tanpa petik)
  {
    no: 23,
    category: 'Toleransi Apostrof',
    query: 'sadun siapa',
    run: () => getHubunganKepanitiaanResponse('sadun siapa', false),
    validate: (res) => {
      const hasName = res.includes('**Sa\'dun Musthofa**');
      return {
        passed: hasName,
        message: `Expected 'sadun' to match Sa'dun Musthofa without apostrophe.`,
      };
    },
  },
  // 24. Auto-Sync: Sufyan Tsauri (Seksi Protokoler)
  {
    no: 24,
    category: 'Auto-Sync Personil',
    query: 'tsauri siapa',
    run: () => getHubunganKepanitiaanResponse('tsauri siapa', false),
    validate: (res) => {
      const hasName = res.includes('**Sufyan Tsauri**');
      return {
        passed: hasName,
        message: `Expected 'tsauri' to match Sufyan Tsauri.`,
      };
    },
  },
  // 25. Variasi Panggilan Pesantren: qoribah -> Qoribatul Maqbulah
  {
    no: 25,
    category: 'Auto-Sync Personil',
    query: 'qoribah siapa',
    run: () => getHubunganKepanitiaanResponse('qoribah siapa', false),
    validate: (res) => {
      const hasName = res.includes('**Qoribatul Maqbulah**');
      return {
        passed: hasName,
        message: `Expected 'qoribah' to match Qoribatul Maqbulah.`,
      };
    },
  },
  // 26. Auto-Sync: Achmad Abdulloh Faqih (Wakasi Humasy & Kostum)
  {
    no: 26,
    category: 'Auto-Sync Personil',
    query: 'faqih siapa',
    run: () => getHubunganKepanitiaanResponse('faqih siapa', false),
    validate: (res) => {
      const hasName = res.includes('**Achmad Abdulloh Faqih**');
      return {
        passed: hasName,
        message: `Expected 'faqih' to match Achmad Abdulloh Faqih.`,
      };
    },
  },
  // 27. Auto-Sync: Agung Shobirin (Wakasi Desain Grafis)
  {
    no: 27,
    category: 'Auto-Sync Personil',
    query: 'agung siapa',
    run: () => getHubunganKepanitiaanResponse('agung siapa', false),
    validate: (res) => {
      const hasName = res.includes('**Agung Shobirin**');
      return {
        passed: hasName,
        message: `Expected 'agung' to match Agung Shobirin.`,
      };
    },
  },
  // 28. Auto-Sync: Imam Ghozali (Wakasi Penerima Tamu)
  {
    no: 28,
    category: 'Auto-Sync Personil',
    query: 'ghozali siapa',
    run: () => getHubunganKepanitiaanResponse('ghozali siapa', false),
    validate: (res) => {
      const hasName = res.includes('**Imam Ghozali**');
      return {
        passed: hasName,
        message: `Expected 'ghozali' to match Imam Ghozali.`,
      };
    },
  },
  // 29. Auto-Sync: Ahmad Fathoni Fikri (Wakasi Peladen)
  {
    no: 29,
    category: 'Auto-Sync Personil',
    query: 'fathoni siapa',
    run: () => getHubunganKepanitiaanResponse('fathoni siapa', false),
    validate: (res) => {
      const hasName = res.includes('**Ahmad Fathoni Fikri**');
      return {
        passed: hasName,
        message: `Expected 'fathoni' to match Ahmad Fathoni Fikri.`,
      };
    },
  },
  // 30. Auto-Sync: Amin Nur Waluyo (Wakasi PULP & TDM)
  {
    no: 30,
    category: 'Auto-Sync Personil',
    query: 'waluyo siapa',
    run: () => getHubunganKepanitiaanResponse('waluyo siapa', false),
    validate: (res) => {
      const hasName = res.includes('**Amin Nur Waluyo**');
      return {
        passed: hasName,
        message: `Expected 'waluyo' to match Amin Nur Waluyo.`,
      };
    },
  },
  // 31. Bahasa Jawa: Reza niku sinten?
  {
    no: 31,
    category: 'Bahasa Jawa',
    query: 'Reza niku sinten?',
    run: () => getHubunganKepanitiaanResponse('Reza niku sinten?', false),
    validate: (res) => {
      const hasName = res.includes("**Reza Fadhilul 'Ulum**");
      return {
        passed: hasName,
        message: `Expected 'Reza niku sinten?' to match Reza Fadhilul 'Ulum.`,
      };
    },
  },
  // 32. Bahasa Jawa: sinten Qoribah?
  {
    no: 32,
    category: 'Bahasa Jawa',
    query: 'sinten Qoribah?',
    run: () => getHubunganKepanitiaanResponse('sinten Qoribah?', false),
    validate: (res) => {
      const hasName = res.includes('**Qoribatul Maqbulah**');
      return {
        passed: hasName,
        message: `Expected 'sinten Qoribah?' to match Qoribatul Maqbulah.`,
      };
    },
  },
  // 33. Perkenalan Diri ("halwa siapa")
  {
    no: 33,
    category: 'Perkenalan Diri',
    query: 'halwa siapa',
    run: () => getHubunganKepanitiaanResponse('halwa siapa', false),
    validate: (res) => {
      const hasHalwaa = res.includes('**Usth. Halwaa**');
      const hasClosing = res.includes('Us?');
      return {
        passed: hasHalwaa && hasClosing,
        message: `Expected self-introduction with bold **Usth. Halwaa**.`,
      };
    },
  },
  // 34. Pertanyaan Ambigu ("ketuanya siapa")
  {
    no: 34,
    category: 'Klarifikasi Ketua',
    query: 'ketuanya siapa',
    run: () => getHubunganKepanitiaanResponse('ketuanya siapa', false),
    validate: (res) => {
      const isClarification = res.includes("'ketuanya' bisa merujuk ke seksi mana?");
      const notNotFound = !res.includes('tidak ditemukan');
      return {
        passed: isClarification && notNotFound,
        message: `Expected clarifying question for standalone 'ketuanya siapa'.`,
      };
    },
  },
  // 35. Format Bold Pilihan Ganda (2-5 Kandidat)
  {
    no: 35,
    category: 'Format Pilihan Ganda',
    query: 'yazid',
    run: () => getHubunganKepanitiaanResponse('yazid', false),
    validate: (res) => {
      const hasBoldAbu = res.includes('1. **Abu Yazid Al Bustomi**');
      const hasBoldMahbub = res.includes('2. **Muhammad Yazid Mahbubillah**');
      return {
        passed: hasBoldAbu && hasBoldMahbub,
        message: `Expected numbered bold list for candidates in disambiguation.`,
      };
    },
  },
  // 36. Display Title Kata Pertama ("Zida Hikmana Ahmad" -> "Pak Zida")
  {
    no: 36,
    category: 'Display Title Spesifik',
    query: 'zida siapa',
    run: () => getHubunganKepanitiaanResponse('zida siapa', false),
    validate: (res) => {
      const hasPakZida = res.includes('Pak Zida');
      const hasFullName = res.includes('Zida Hikmana Ahmad');
      return {
        passed: hasPakZida && hasFullName,
        message: `Expected Pak Zida (first word) instead of Pak Ahmad.`,
      };
    },
  },
];

async function main() {
  console.log('===============================================================');
  console.log('       TEST SUITE AUTOMATION — USTH. HALWAA AI ASSISTANT       ');
  console.log('===============================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  for (const tc of testCases) {
    try {
      const rawRes = await tc.run();
      const check = tc.validate(rawRes);
      if (check.passed) {
        console.log(`[PASS] Case #${tc.no.toString().padStart(2, '0')} [${tc.category}] "${tc.query}"`);
        passedCount++;
      } else {
        console.error(`[FAIL] Case #${tc.no.toString().padStart(2, '0')} [${tc.category}] "${tc.query}" -> ${check.message}`);
        console.error(`       Preview: ${rawRes.slice(0, 100).replace(/\n/g, ' ')}...`);
        failedCount++;
      }
    } catch (err: any) {
      console.error(`[ERR ] Case #${tc.no.toString().padStart(2, '0')} [${tc.category}] "${tc.query}" -> Error: ${err?.message}`);
      failedCount++;
    }
  }

  console.log('\n---------------------------------------------------------------');
  console.log(`Total Uji   : ${testCases.length}`);
  console.log(`Lolos (PASS): ${passedCount}`);
  console.log(`Gagal (FAIL): ${failedCount}`);
  console.log('---------------------------------------------------------------');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    console.log('HASIL: SELURUH SKENARIO UJI LOLOS TANPA REGRESI! (100% PASS)\n');
    process.exit(0);
  }
}

main();
