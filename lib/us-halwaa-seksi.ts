// =============================================================================
// MODUL INFO BAGAN / SEKSI KEPANITIAAN — USTH. HALWAA AI ASSISTANT
// Haul & Haflah P3TQ & MHMTQ 1448 H. / 2027 M.
// =============================================================================

export interface SeksiMemberInfo {
  kasi: string;
  wakasi: string;
  anggota?: string[];
}

export interface SeksiItem {
  id: string;
  name: string;
  aliases: string[];
  putra: SeksiMemberInfo;
  putri: SeksiMemberInfo;
}

export const SEKSI_DATABASE: SeksiItem[] = [
  {
    id: "sekretariat",
    name: "Sekretariat",
    aliases: ["sekretariat", "kesekretariatan"],
    putra: {
      kasi: "Bapak Asep Darajat",
      wakasi: "Bapak Ahmad Chamdan Yuwafi",
      anggota: [
        "Bapak Muhammad Ali Wafa Fuady",
        "Bapak Jana Prabu",
        "Bapak Zida Hikmana Ahmad",
        "Bapak Muhammad Yusri Sa'dulloh"
      ],
    },
    putri: {
      kasi: "Uswatun Khasanah",
      wakasi: "Nur Qomariyah",
      anggota: ["Maesa Rohmatul Ummah", "Syifa Hilmi Fauziyah"],
    },
  },
  {
    id: "protokoler",
    name: "Protokoler",
    aliases: ["protokoler", "protokol"],
    putra: {
      kasi: "Bapak Abu Yazid Al Bustomi",
      wakasi: "Bapak Abhaa Muhammad Kafaa Bihi",
      anggota: [
        "Bapak Sufyan Tsauri",
        "Bapak Taufiq Hidayah",
        "Bapak Lukman Ainul Yaqin"
      ],
    },
    putri: {
      kasi: "Evi Inarotus Soimah",
      wakasi: "Jihan Roihana",
      anggota: [
        "Tsinta Nuriyah Arrizqa",
        "Laili Masruroh",
        "Fatimatuz Zuhriyah",
        "Titis Choirotul A'mal",
        "Siti Muthoharoh",
        "Fatimatuz Zahroh '24",
        "Izza Afkarina",
        "Dinal Fakihah",
        "Najwa Niswatus Zahro'",
        "Nafi'atul Ilmiyah",
        "Kiki Fatimah Asih",
        "Fatiya Azzahra"
      ],
    },
  },
  {
    id: "akomodasi",
    name: "Akomodasi",
    aliases: ["akomodasi"],
    putra: {
      kasi: "Bapak Agus Ismanto",
      wakasi: "Bapak Gama Maulana Ilham",
      anggota: [
        "Bapak Muhammad Harizal Fauzi",
        "Bapak Faja Fikrona Al Fattah",
        "Bapak Azwan",
        "Bapak Fikri Fadhilah",
        "Bapak Muhammad Mujib",
        "Bapak Teguh Prasetia",
        "Bapak Ahgus Ma'sum",
        "Bapak Muhammad Dasir"
      ],
    },
    putri: {
      kasi: "Azza Nur Laila Mlg",
      wakasi: "Nur Laila Safitri",
      anggota: [
        "Rofi'atul Fauziyah",
        "Fikriyatuddin Fasyi",
        "Widya Dwi Pratiwi",
        "Atika Nahdia",
        "Hamidah Nur Habibah",
        "Zahidiyatul Ulya",
        "Renny Damayanti",
        "Ayu Setya Ningrum",
        "Asma Nabila",
        "Arina Mazidatur Rohmah"
      ],
    },
  },
  {
    id: "konsumsi",
    name: "Konsumsi",
    aliases: ["konsumsi"],
    putra: {
      kasi: "Bapak Ahmad Rizal 'Abidin",
      wakasi: "Bapak Muhammad Taufiqurrohman",
      anggota: [
        "Bapak Muhammad Bahrul Ulum'25",
        "Bapak Muhammad Dikri Umam"
      ],
    },
    putri: {
      kasi: "Elvi Aniqotus Zakiyah",
      wakasi: "Lailatul Munawaroh",
      anggota: [
        "Faza Alya Fahmida",
        "Siti Nurul Istiqomah",
        "Dwi Lestari",
        "Mila Aulia Hilda",
        "Umi Fahri Anni Mas'adah",
        "Indah Maulidatul Hasanah",
        "Ana Isti'anah",
        "Muyasaroh",
        "Huriyati",
        "Irene Echa Aprilia"
      ],
    },
  },
  {
    id: "berkatan",
    name: "Berkatan",
    aliases: ["berkatan", "berkat"],
    putra: {
      kasi: "Bapak Muhammad Fikri Al Munawwar",
      wakasi: "Bapak Muhammad Abdurrohman Maulana",
      anggota: [
        "Bapak Musa Fadlika Hadi Cahya",
        "Bapak Muhammad Khoirul Anam"
      ],
    },
    putri: {
      kasi: "Dewi Nazilatur Rohmah",
      wakasi: "Nurul Laili Fauziyah",
      anggota: [
        "Atik Churul 'Aini",
        "Fitri Rahmawati",
        "Zuhrotul Widad",
        "Alfiyatul Muzayyanah",
        "Zahrotus Sholihah",
        "Suci Asipa",
        "Firna Nahwa",
        "Isna Choirul Ummah",
        "Meiga Aghniya' Berliana",
        "Azka Nadia Zumroturrobicha Shofwan"
      ],
    },
  },
  {
    id: "prasmanan_dzuriyyah",
    name: "Prasmanan Dzuriyyah",
    aliases: ["prasmanan dzuriyyah", "prasmanan dzurriyyah", "prasmanan", "dzuriyyah"],
    putra: {
      kasi: "Bapak Saiful Nur Kholis",
      wakasi: "Bapak Burhanuddin Isri",
      anggota: [
        "Bapak Lukman Syaher",
        "Bapak Noril Mulana",
        "Saudara Aji Fathur",
        "Saudara Muhammad Rizqi"
      ],
    },
    putri: {
      kasi: "Elvi Aniqotus Zakiyah (Di bawah koordinasi Seksi Konsumsi Putri)",
      wakasi: "Lailatul Munawaroh",
      anggota: [
        "Faza Alya Fahmida",
        "Siti Nurul Istiqomah",
        "Dwi Lestari"
      ],
    },
  },
  {
    id: "peladen",
    name: "Peladen",
    aliases: ["peladen", "laden", "pelayan"],
    putra: {
      kasi: "Bapak Muhammad Syaikhul 'Arifin",
      wakasi: "Bapak Ahmad Fathoni Fikri",
      anggota: [
        "Bapak Abdullah Nadhif",
        "Bapak Khoirul Azmi"
      ],
    },
    putri: {
      kasi: "Indri Angraeni Rahmawati",
      wakasi: "Riska Lailiyah",
      anggota: [
        "Rofiqotul Jannah",
        "Hulyatun Nisa'",
        "Elok Fatimatuz Zahro'",
        "Siti Luthfiyah",
        "Puput Isti'anah",
        "Dwi Suci Megasari",
        "Haninah"
      ],
    },
  },
  {
    id: "penerima_tamu",
    name: "Penerima Tamu",
    aliases: ["penerima tamu", "penyambut tamu"],
    putra: {
      kasi: "Bapak Muhammad Badru Ro'in Amin",
      wakasi: "Bapak Imam Ghozali",
      anggota: [
        "Bapak Muhammad Najih",
        "Bapak Muhammad Izzuddin Assakhi",
        "Bapak Alex Alqomah",
        "Bapak Afif Cholilul Umam",
        "Bapak Affan Istikhori",
        "Bapak Subadar",
        "Bapak Misbahul Huda",
        "Bapak Muhammad Sabiqul Anam",
        "Bapak Muhammad Yazid Mahbubillah"
      ],
    },
    putri: {
      kasi: "Hanifatun Nasihah",
      wakasi: "Safira Auliyatul Faizah",
      anggota: [
        "Aimmatul Muawwanah",
        "Noor Izza Farhana",
        "Nuzulul Hasanah"
      ],
    },
  },
  {
    id: "desain_grafis",
    name: "Desain Grafis",
    aliases: ["desain grafis", "design grafis", "desain", "grafis", "design"],
    putra: {
      kasi: "Bapak Muhammad In'amul Muttaqin",
      wakasi: "Bapak Agung Shobirin",
      anggota: [
        "Bapak Sholekhuddin",
        "Bapak Ahmad Khoirul Rohman",
        "Bapak Muhammad Fathul Hidayat",
        "Bapak Muhammad Ilham Ma'shum Lirbiyani"
      ],
    },
    putri: {
      kasi: "Adiva Maulana",
      wakasi: "Syadza Muzdalifah",
      anggota: [
        "Febty Ayu Safitri",
        "Tania Azkiatul Azizah",
        "Zakiyatus Sa'adah",
        "Luluk Fajarin Nisa'",
        "Faalihatul Khowatimi"
      ],
    },
  },
  {
    id: "humasy_kostum",
    name: "Humasy & Kostum",
    aliases: ["humasy & kostum", "humasy dan kostum", "humas & kostum", "humas dan kostum", "humasy", "humas", "kostum"],
    putra: {
      kasi: "Bapak Akfi Romiyan Kafabih",
      wakasi: "Bapak Achmad Abdulloh Faqih",
      anggota: [],
    },
    putri: {
      kasi: "Fifi Sunhaida",
      wakasi: "Alfiyatur Rohmah",
      anggota: [
        "Hanna Nurjannah",
        "Mila Minhatul Maula",
        "Anisa'ul Hidayah",
        "Dewi Fatimatuz Zahro'",
        "Fahdina Izzul Maula"
      ],
    },
  },
  {
    id: "keamanan",
    name: "Keamanan",
    aliases: ["keamanan", "security"],
    putra: {
      kasi: "Bapak Adi Susilo",
      wakasi: "Bapak Reza Fadhilul 'Ulum",
      anggota: [
        "Bapak Muhammad Taufiq",
        "Bapak Yahya Ngafifulloh",
        "Bapak Sa'dun Musthofa"
      ],
    },
    putri: {
      kasi: "Qoribatul Maqbulah",
      wakasi: "Fitrotin Yulia Arifin",
      anggota: [
        "Anil Kamiladdin",
        "Ifda Trya Amanda",
        "Azzukhruf Khoirunnisa'",
        "Ikfi Ulit Taufiqoh",
        "Hirzi Qoni'atuz Zahro'"
      ],
    },
  },
  {
    id: "pulp_tdm",
    name: "PULP & TDM",
    aliases: ["pulp & tdm", "pulp dan tdm", "pulp tdm"],
    putra: {
      kasi: "Bapak Muhammad Maghfur Fatoni",
      wakasi: "Saudara Amin Nur Waluyo",
      anggota: [
        "Saudara Ahmad Nashoruddin",
        "Saudara Ahmad Arif Anjani",
        "Saudara Muhammad Haqqin Nazilli"
      ],
    },
    putri: {
      kasi: "Roina Nadhirotul Lathifah (PULP) / Salma Aesy Bik Hamidah (TDM)",
      wakasi: "Shudqol Amanah (PULP) / Izzah Nurin Nabila (TDM)",
      anggota: [
        "Maulidatus Sa'diyah",
        "Fatimah Azzahra",
        "Aulia Ulin Nadhiroh",
        "Dalliya Hikmatul Maula",
        "Ulin Nadhirotul Husna"
      ],
    },
  },
  {
    id: "pulp",
    name: "PULP",
    aliases: ["pulp"],
    putra: {
      kasi: "Bapak Muhammad Maghfur Fatoni (PULP & TDM)",
      wakasi: "Saudara Amin Nur Waluyo",
      anggota: [
        "Saudara Ahmad Nashoruddin",
        "Saudara Ahmad Arif Anjani",
        "Saudara Muhammad Haqqin Nazilli"
      ],
    },
    putri: {
      kasi: "Roina Nadhirotul Lathifah",
      wakasi: "Shudqol Amanah",
      anggota: [
        "Maulidatus Sa'diyah",
        "Fatimah Azzahra",
        "Alif Robi'atul Masruroh",
        "Muslimatun Nafi'ah",
        "Anisa Al Ilma",
        "Anjani Mufadzilah",
        "Farha Raudlatul Afifah Sya'bana",
        "Safna Khoirun Nisa'",
        "Khaula Malikha"
      ],
    },
  },
  {
    id: "tdm",
    name: "TDM",
    aliases: ["tdm"],
    putra: {
      kasi: "Bapak Muhammad Maghfur Fatoni (PULP & TDM)",
      wakasi: "Saudara Amin Nur Waluyo",
      anggota: [
        "Saudara Ahmad Nashoruddin",
        "Saudara Ahmad Arif Anjani",
        "Saudara Muhammad Haqqin Nazilli"
      ],
    },
    putri: {
      kasi: "Salma Aesy Bik Hamidah",
      wakasi: "Izzah Nurin Nabila",
      anggota: [
        "Aulia Ulin Nadhiroh",
        "Dalliya Hikmatul Maula - Nur Wahidah Mukhtar",
        "Ulin Nadhirotul Husna",
        "Nikmatul Hasanah",
        "Callista Nabila Fawwaz",
        "Viluna Churul 'Aini",
        "Siti Hidayatul Munawaroh"
      ],
    },
  },
  {
    id: "seksi_data",
    name: "Seksi Data",
    aliases: ["seksi data", "data"],
    putra: {
      kasi: "Bapak Asep Darajat (Seksi Sekretariat)",
      wakasi: "Bapak Ahmad Chamdan Yuwafi",
      anggota: [
        "Bapak Muhammad Ali Wafa Fuady",
        "Bapak Jana Prabu"
      ],
    },
    putri: {
      kasi: "Uswatun Khasanah",
      wakasi: "Nur Qomariyah",
      anggota: ["Maesa Rohmatul Ummah", "Syifa Hilmi Fauziyah"],
    },
  },
];

const DAFTAR_SEKSI_TERSEDIA_STRING =
  "Sekretariat, Protokoler, Akomodasi, Konsumsi, Berkatan, Prasmanan Dzuriyyah, Peladen, Penerima Tamu, Desain Grafis, Humasy & Kostum, Keamanan, PULP & TDM, Seksi Data";

export function isAllBanomQuery(query: string): boolean {
  const q = query.toLowerCase().trim().replace(/[.,!?;:]/g, ' ').replace(/\s+/g, ' ');

  if (
    q.includes('seluruh banom') ||
    q.includes('semua banom') ||
    q.includes('daftar banom') ||
    q.includes('sebutkan banom') ||
    q.includes('seluruh seksi') ||
    q.includes('semua seksi') ||
    q.includes('daftar seksi') ||
    q.includes('seksi apa saja') ||
    q.includes('apa saja seksi') ||
    q.includes('banom apa saja') ||
    q.includes('apa saja banom')
  ) {
    return true;
  }

  return false;
}

export function detectInfoSeksiIntent(query: string): boolean {
  const q = query.toLowerCase().trim().replace(/[.,!?;:]/g, ' ').replace(/\s+/g, ' ');

  // 1. Cek inquiry seluruh banom / seksi
  if (isAllBanomQuery(query)) {
    return true;
  }

  // 2. Cek keyword eksplisit seksi / bagan / banom / anggota / struktur / kasi / wakasi
  const hasExplicitPrefix = /\b(seksi|bagan|banom|anggota|struktur|kasi|wakasi)\b/i.test(q);
  if (hasExplicitPrefix) {
    // Hindari bentrok dengan pencarian nama orang biasa yang tidak sengaja mengandung kata ini
    // Kecuali memang menanyakan seksi atau anggota kepanitiaan
    return true;
  }

  // 3. Cek pola "[nama seksi] siapa" / "siapa [nama seksi]" / "sebutkan [nama seksi]"
  for (const seksi of SEKSI_DATABASE) {
    for (const alias of seksi.aliases) {
      if (alias.length < 3) continue;
      // "[alias] siapa" atau "siapa [alias]"
      if (
        new RegExp(`(^|\\s)${alias}\\s+(siapa|siapakah|apa|ada siapa)($|\\s)`).test(q) ||
        new RegExp(`(^|\\s)(siapa|siapakah|sebutkan|info|tentang)\\s+${alias}($|\\s)`).test(q)
      ) {
        return true;
      }
    }
  }

  return false;
}

export function findMatchedSeksi(query: string): SeksiItem | null {
  const q = query.toLowerCase().trim().replace(/[.,!?;:]/g, ' ').replace(/\s+/g, ' ');

  // Prioritas matching: urutkan aliases terpanjang terlebih dahulu
  for (const seksi of SEKSI_DATABASE) {
    const sortedAliases = [...seksi.aliases].sort((a, b) => b.length - a.length);
    for (const alias of sortedAliases) {
      if (q.includes(alias)) {
        return seksi;
      }
    }
  }

  return null;
}

export function extractUnrecognizedSeksiName(query: string): string {
  const q = query.trim().replace(/[.,!?;:]/g, ' ');

  // Cari setelah kata "seksi", "bagan", "banom", "anggota", "struktur", "kasi", "wakasi"
  const match = q.match(/\b(?:seksi|bagan|banom|anggota|struktur|kasi|wakasi)\s+([A-Za-z0-9\s&'-]+)/i);
  if (match) {
    let clean = match[1].replace(/\b(siapa|siapakah|apa|saja|us|usth|tolong|info|ya|kan)\b/gi, '').trim();
    if (clean) return clean;
  }

  // Cari sebelum kata "siapa"
  const matchBeforeSiapa = q.match(/([A-Za-z0-9\s&'-]+)\s+siapa\b/i);
  if (matchBeforeSiapa) {
    let clean = matchBeforeSiapa[1].replace(/\b(seksi|bagan|banom|anggota|struktur|kasi|wakasi|us|usth)\b/gi, '').trim();
    if (clean) return clean;
  }

  return query.trim();
}

export function handleInfoSeksiQuery(query: string, isFirstTurn: boolean = false): string {
  const greetingPrefix = isFirstTurn ? "Wa'alaikum Salam Wr. Wb.! 🙏✨\n\n" : "";

  // 1. JIKA USER MEMINTA SELURUH BANOM (TANPA NAMA ANGGOTA)
  if (isAllBanomQuery(query)) {
    const daftarBanomText = [
      "1. **Seksi Sekretariat:**\n   - Kasi: Bapak Asep Darajat\n   - Wakasi: Bapak Ahmad Chamdan Yuwafi",
      "2. **Seksi Protokoler:**\n   - Kasi: Bapak Abu Yazid Al Bustomi\n   - Wakasi: Bapak Abhaa Muhammad Kafaa Bihi",
      "3. **Seksi Akomodasi:**\n   - Kasi: Bapak Agus Ismanto\n   - Wakasi: Bapak Gama Maulana Ilham",
      "4. **Seksi Konsumsi:**\n   - Kasi: Bapak Ahmad Rizal 'Abidin\n   - Wakasi: Bapak Muhammad Taufiqurrohman",
      "5. **Seksi Berkatan:**\n   - Kasi: Bapak Muhammad Fikri Al Munawwar\n   - Wakasi: Bapak Muhammad Abdurrohman Maulana",
      "6. **Seksi Prasmanan Dzuriyyah:**\n   - Kasi: Bapak Saiful Nur Kholis\n   - Wakasi: Bapak Burhanuddin Isri",
      "7. **Seksi Peladen:**\n   - Kasi: Bapak Muhammad Syaikhul 'Arifin\n   - Wakasi: Bapak Ahmad Fathoni Fikri",
      "8. **Seksi Penerima Tamu:**\n   - Kasi: Bapak Muhammad Badru Ro'in Amin\n   - Wakasi: Bapak Imam Ghozali",
      "9. **Seksi Desain Grafis:**\n   - Kasi: Bapak Muhammad In'amul Muttaqin\n   - Wakasi: Bapak Agung Shobirin",
      "10. **Seksi Humasy & Kostum:**\n   - Kasi: Bapak Akfi Romiyan Kafabih\n   - Wakasi: Bapak Achmad Abdulloh Faqih",
      "11. **Seksi Keamanan:**\n   - Kasi: Bapak Adi Susilo\n   - Wakasi: Bapak Reza Fadhilul 'Ulum",
      "12. **Seksi PULP & TDM:**\n   - Kasi: Bapak Muhammad Maghfur Fatoni\n   - Wakasi: Saudara Amin Nur Waluyo",
    ].join("\n\n");

    return `${greetingPrefix}Berikut adalah seluruh seksi (banom) kepanitiaan beserta Kasi dan Wakasinya, tanpa menyebutkan nama anggota:\n\n${daftarBanomText}\n\nAda lagi info kepanitiaan yang bisa saya bantu, Us?`;
  }

  // 2. CARI SEKSI SPESIFIK
  const matchedSeksi = findMatchedSeksi(query);

  // JIKA TIDAK DITEMUKAN
  if (!matchedSeksi) {
    const unrec = extractUnrecognizedSeksiName(query);
    return `${greetingPrefix}Mohon maaf Us, seksi '${unrec}' tidak ditemukan dalam struktur kepanitiaan Haul & Haflah. Seksi yang tersedia: ${DAFTAR_SEKSI_TERSEDIA_STRING}. Ada lagi info kepanitiaan yang bisa saya bantu, Us?`;
  }

  const q = query.toLowerCase().trim().replace(/[.,!?;:]/g, ' ').replace(/\s+/g, ' ');

  // 3. VARIASI PERTANYAAN

  // a. Kasi Saja ("kasi [seksi]")
  const isKasiOnly = /\bkasi\b/i.test(q) && !/\bwakasi\b/i.test(q) && !/\banggota\b/i.test(q);
  if (isKasiOnly) {
    return `${greetingPrefix}Berikut adalah Kasi **Seksi ${matchedSeksi.name}** untuk putra dan putri:

- Kasi Putra: ${matchedSeksi.putra.kasi}
- Kasi Putri: ${matchedSeksi.putri.kasi}

Ada lagi info kepanitiaan yang bisa saya bantu, Us?`;
  }

  // b. Wakasi Saja ("wakasi [seksi]")
  const isWakasiOnly = /\bwakasi\b/i.test(q) && !/\banggota\b/i.test(q);
  if (isWakasiOnly) {
    return `${greetingPrefix}Berikut adalah Wakasi **Seksi ${matchedSeksi.name}** untuk putra dan putri:

- Wakasi Putra: ${matchedSeksi.putra.wakasi}
- Wakasi Putri: ${matchedSeksi.putri.wakasi}

Ada lagi info kepanitiaan yang bisa saya bantu, Us?`;
  }

  // c. Kasi/Wakasi Saja ("keamanan siapa", "[seksi] siapa", "siapa [seksi]")
  // Yaitu ketika user menanyakan siapa pengurus/ketua seksi tanpa menyebut kata "anggota" atau "seksi [nama]"
  const isKasiWakasiOnly =
    (/\bsiapa\b/i.test(q) || /\bketua\b/i.test(q) || /\bpimpinan\b/i.test(q)) &&
    !/\banggota\b/i.test(q) &&
    !/\bseksi\s+[a-z]+/i.test(q) &&
    !/\bbagan\s+[a-z]+/i.test(q);

  if (isKasiWakasiOnly) {
    return `${greetingPrefix}Berikut adalah jajaran pengurus **Seksi ${matchedSeksi.name}** untuk putra dan putri:

**Seksi ${matchedSeksi.name} (Putra):**
- Kasi: ${matchedSeksi.putra.kasi}
- Wakasi: ${matchedSeksi.putra.wakasi}

**Seksi ${matchedSeksi.name} (Putri):**
- Kasi: ${matchedSeksi.putri.kasi}
- Wakasi: ${matchedSeksi.putri.wakasi}

Ada lagi info kepanitiaan yang bisa saya bantu, Us?`;
  }

  // d. Lengkap dengan Anggota ("seksi [nama]", "anggota [seksi]", "struktur [seksi]")
  const anggotaPutraStr =
    matchedSeksi.putra.anggota && matchedSeksi.putra.anggota.length > 0
      ? `\n- Anggota: ${matchedSeksi.putra.anggota.join(', ')}`
      : '';

  const anggotaPutriStr =
    matchedSeksi.putri.anggota && matchedSeksi.putri.anggota.length > 0
      ? `\n- Anggota: ${matchedSeksi.putri.anggota.join(', ')}`
      : '';

  return `${greetingPrefix}Berikut adalah jajaran pengurus **Seksi ${matchedSeksi.name}** untuk putra dan putri:

**Seksi ${matchedSeksi.name} (Putra):**
- Kasi: ${matchedSeksi.putra.kasi}
- Wakasi: ${matchedSeksi.putra.wakasi}${anggotaPutraStr}

**Seksi ${matchedSeksi.name} (Putri):**
- Kasi: ${matchedSeksi.putri.kasi}
- Wakasi: ${matchedSeksi.putri.wakasi}${anggotaPutriStr}

Ada lagi info kepanitiaan yang bisa saya bantu, Us?`;
}
