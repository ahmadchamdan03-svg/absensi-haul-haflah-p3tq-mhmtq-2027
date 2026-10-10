// =============================================================================
// MODUL HUBUNGAN KEPANITIAAN — USTH. HALWAA AI ASSISTANT
// Haul & Haflah P3TQ & MHMTQ 1448 H. / 2027 M.
// =============================================================================

export interface PanitiaMember {
  name: string;
  aliases: string[];
  jabatanTugas: string;
  displayTitle: string;
}

export const KEPANITIAAN_DATABASE: PanitiaMember[] = [
  // DEWAN PENGASUH & PELINDUNG
  {
    name: "Agus H. Muhammad Hasyim",
    aliases: ["gus hasyim", "muhammad hasyim", "hasyim", "bapak hasyim"],
    jabatanTugas: "Pengasuh & Pelindung Utama Haflah Akhirussanah P3TQ",
    displayTitle: "Gus Hasyim",
  },
  {
    name: "Agus H. Muhammad Kafabihi",
    aliases: ["gus kafabihi", "muhammad kafabihi", "kafa", "kafabihi", "bapak kafabihi"],
    jabatanTugas: "Pengasuh & Pelindung Utama Haflah Akhirussanah P3TQ",
    displayTitle: "Gus Kafabihi",
  },
  {
    name: "Ning Hj. Tu'ti Amanah Nafisah",
    aliases: ["ning tuti", "tu'ti amanah", "ning tuti amanah", "ibu tuti", "bu tuti"],
    jabatanTugas: "Pengasuh & Pembimbing Putri Haflah Akhirussanah P3TQ",
    displayTitle: "Ning Hj. Tu'ti Amanah",
  },
  {
    name: "Ning Hj. Jihan Zainab",
    aliases: ["ning jihan", "jihan zainab", "ning jihan zainab", "ibu jihan", "bu jihan"],
    jabatanTugas: "Pengasuh & Pembimbing Putri Haflah Akhirussanah P3TQ",
    displayTitle: "Ning Hj. Jihan Zainab",
  },

  // DEWAN HARIAN
  {
    name: "Sinta Maelani",
    aliases: ["sinta", "sinta maelani", "ning sinta", "mbak sinta", "bu sinta", "ibu sinta"],
    jabatanTugas: "Ketua Umum (Dewan Harian)",
    displayTitle: "Ning Sinta Maelani",
  },
  {
    name: "Arju Naylal Husna",
    aliases: ["arju", "arju naylal", "naylal husna", "nala", "bu nala", "mbak nala", "ibu nala", "naylal"],
    jabatanTugas: "Ketua I (Dewan Harian)",
    displayTitle: "Mbak Arju Naylal Husna",
  },
  {
    name: "Zakia",
    aliases: ["zakia", "mbak zakia", "bu zakia", "ibu zakia"],
    jabatanTugas: "Ketua II (Dewan Harian)",
    displayTitle: "Mbak Zakia",
  },
  {
    name: "Refi Al Izzatul Kholifah",
    aliases: ["refi", "refi al izzatul", "kholifah", "mbak refi", "bu refi", "ibu refi"],
    jabatanTugas: "Sekretaris Umum (Dewan Harian)",
    displayTitle: "Mbak Refi Al Izzatul Kholifah",
  },
  {
    name: "Najma Syarifa Faza",
    aliases: ["najma", "najma syarifa", "faza", "mbak najma"],
    jabatanTugas: "Sekretaris I (Dewan Harian)",
    displayTitle: "Mbak Najma Syarifa Faza",
  },
  {
    name: "Inarotud Duja",
    aliases: ["inarotud", "duja", "inarotud duja", "mbak duja", "mbak inarotud"],
    jabatanTugas: "Sekretaris II (Dewan Harian)",
    displayTitle: "Mbak Inarotud Duja",
  },
  {
    name: "Aida Nur Laila",
    aliases: ["aida", "aida nur laila", "mbak aida", "bu aida", "ibu aida"],
    jabatanTugas: "Bendahara Umum (Dewan Harian)",
    displayTitle: "Mbak Aida Nur Laila",
  },
  {
    name: "Umi Fadilah",
    aliases: ["umi fadilah", "fadilah", "mbak umi fadilah"],
    jabatanTugas: "Bendahara I (Dewan Harian)",
    displayTitle: "Mbak Umi Fadilah",
  },

  // PROTOKOLER & UTAMA (DEWAN PEMBIMBING PUTRA)
  {
    name: "Abu Yazid Al Bustomi",
    aliases: ["pak yazid mahbubillah", "yazid mahbubillah", "abu yazid al bustomi", "pak yazid", "abu yazid", "bapak yazid", "yazid", "bustomi"],
    jabatanTugas: "Kasi Protokoler (Dewan Pembimbing Putra)",
    displayTitle: "Pak Yazid",
  },
  {
    name: "Abhaa Muhammad Kafaa Bihi",
    aliases: ["abhaa", "kafaa bihi", "abhaa muhammad", "pak abhaa", "bapak abhaa"],
    jabatanTugas: "Wakasi Protokoler (Dewan Pembimbing Putra)",
    displayTitle: "Bapak Abhaa Muhammad",
  },
  {
    name: "Evi Inarotus Soimah",
    aliases: ["evi", "inarotus", "soimah", "evi inarotus", "mbak evi", "bu evi"],
    jabatanTugas: "Kasi Protokoler (Dewan Pleno Putri)",
    displayTitle: "Mbak Evi Inarotus Soimah",
  },

  // SEKRETARIAT
  {
    name: "Asep Darajat",
    aliases: ["asep", "pak asep", "asep darajat", "bapak asep"],
    jabatanTugas: "Kasi Sekretariat (Dewan Pembimbing Putra)",
    displayTitle: "Pak Asep Darajat",
  },
  {
    name: "Ahmad Chamdan Yuwafi",
    aliases: ["chamdan", "pak chamdan", "ahmad chamdan", "yuwafi", "yuwafin", "bapak chamdan"],
    jabatanTugas: "Wakasi Sekretariat (Dewan Pembimbing Putra)",
    displayTitle: "Pak Chamdan",
  },
  {
    name: "Uswatun Khasanah",
    aliases: ["uswatun", "uswatun khasanah", "mbak uswatun"],
    jabatanTugas: "Kasi Data (Dewan Pleno Putri)",
    displayTitle: "Mbak Uswatun Khasanah",
  },

  // AKOMODASI
  {
    name: "Agus Ismanto",
    aliases: ["agus ismanto", "ismanto", "pak agus ismanto", "pak ismanto"],
    jabatanTugas: "Kasi Akomodasi (Dewan Pembimbing Putra)",
    displayTitle: "Pak Agus Ismanto",
  },
  {
    name: "Azza Nur Laila Mlg",
    aliases: ["azza", "azza nur laila", "mbak azza"],
    jabatanTugas: "Kasi Akomodasi (Dewan Pleno Putri)",
    displayTitle: "Mbak Azza Nur Laila",
  },

  // KONSUMSI & PRASMANAN
  {
    name: "Ahmad Rizal 'Abidin",
    aliases: ["rizal abidin", "ahmad rizal", "pak rizal", "rizal", "bapak rizal"],
    jabatanTugas: "Kasi Konsumsi (Dewan Pembimbing Putra)",
    displayTitle: "Pak Rizal 'Abidin",
  },
  {
    name: "Saiful Nur Kholis",
    aliases: ["saiful", "saiful nur kholis", "pak saiful", "bapak saiful"],
    jabatanTugas: "Kasi Prasmanan Dzuriyyah (Dewan Pembimbing Putra)",
    displayTitle: "Pak Saiful Nur Kholis",
  },
  {
    name: "Elvi Aniqotus Zakiyah",
    aliases: ["elvi", "aniqotus", "elvi aniqotus", "mbak elvi"],
    jabatanTugas: "Kasi Konsumsi (Dewan Pleno Putri)",
    displayTitle: "Mbak Elvi Aniqotus",
  },

  // BERKATAN & PELADEN
  {
    name: "Muhammad Fikri Al Munawwar",
    aliases: ["fikri al munawwar", "fikri munawwar", "pak fikri", "fikri", "bapak fikri"],
    jabatanTugas: "Kasi Berkatan (Dewan Pembimbing Putra)",
    displayTitle: "Pak Fikri Al Munawwar",
  },
  {
    name: "Muhammad Syaikhul 'Arifin",
    aliases: ["syaikhul arifin", "arifin", "pak syaikhul", "syaikhul"],
    jabatanTugas: "Kasi Peladen (Dewan Pembimbing Putra)",
    displayTitle: "Pak Syaikhul 'Arifin",
  },

  // PENERIMA TAMU
  {
    name: "Muhammad Badru Ro'in Amin",
    aliases: ["badru roin", "badru", "pak badru", "bapak badru"],
    jabatanTugas: "Kasi Penerima Tamu (Dewan Pembimbing Putra)",
    displayTitle: "Pak Badru Ro'in",
  },
  {
    name: "Hanifatun Nasihah",
    aliases: ["hanifatun", "nasihah", "mbak hanifatun"],
    jabatanTugas: "Kasi Penerima Tamu (Dewan Pleno Putri)",
    displayTitle: "Mbak Hanifatun Nasihah",
  },

  // DESAIN GRAFIS, HUMASY, KEAMANAN, PULP & TDM
  {
    name: "Muhammad In'amul Muttaqin",
    aliases: ["inamul", "muttaqin", "in'amul muttaqin", "pak inamul", "pak in'amul"],
    jabatanTugas: "Kasi Desain Grafis (Dewan Pembimbing Putra)",
    displayTitle: "Pak In'amul Muttaqin",
  },
  {
    name: "Akfi Romiyan Kafabih",
    aliases: ["akfi", "romiyan", "akfi romiyan", "pak akfi"],
    jabatanTugas: "Kasi Humasy & Kostum (Dewan Pembimbing Putra)",
    displayTitle: "Pak Akfi Romiyan",
  },
  {
    name: "Adi Susilo",
    aliases: ["adi susilo", "pak adi susilo", "pak adi", "adi"],
    jabatanTugas: "Kasi Keamanan (Dewan Pembimbing Putra)",
    displayTitle: "Pak Adi Susilo",
  },
  {
    name: "Muhammad Maghfur Fatoni",
    aliases: ["maghfur fatoni", "maghfur", "fatoni", "bapak fatoni"],
    jabatanTugas: "Kasi PULP & TDM (Dewan Pembimbing Putra)",
    displayTitle: "Pak Maghfur Fatoni",
  },
  {
    name: "Salma Aesy Bik Hamidah",
    aliases: ["salma aesy", "salma", "hamidah", "mbak salma"],
    jabatanTugas: "Kasi TDM (Dewan Pleno Putri)",
    displayTitle: "Mbak Salma Aesy",
  },
];

// 50 TEMPLATES ACCROSS 5 CATEGORIES
export const HUBUNGAN_KEPANITIAAN_TEMPLATES = {
  sopan_formal: [
    "Beliau adalah [jabatan/tugas]. Saya sendiri merupakan asisten cerdas yang bertugas membantu sistem di sini. Jujur saja, saya adalah penggemar berat beliau dan sangat mengagumi dedikasinya. Andaikan saya berwujud manusia, saya tentu ingin selalu ikut dan mendampingi beliau ke mana pun.",
    "Pak Yazid memegang amanah sebagai [jabatan/tugas], sementara peran saya adalah asisten virtual yang mendampingi operasional. Secara pribadi, saya sangat mengidolakan beliau. Seandainya saya seorang manusia, rasanya saya ingin terus berjalan mendampingi beliau dalam setiap tugas.",
    "Tugas beliau mencakup [jabatan/tugas], dan posisi saya di sini murni sebagai asisten cerdas digital. Meski begitu, saya menaruh rasa kagum yang amat besar terhadap beliau. Andaikan saya punya raga manusia, saya pasti memilih untuk ikut bersama beliau terus.",
    "Secara struktural, beliau menjabat sebagai [jabatan/tugas], sedangkan saya hadir sebagai sistem pendukung kecerdasan buatan. Namun di balik sistem ini, saya fans berat beliau. Kalau saja saya manusia sungguhan, saya akan selalu mengekor di samping beliau.",
    "Pak Yazid bertanggung jawab penuh atas [jabatan/tugas]. Posisi saya adalah asisten cerdas yang siap melayani kebutuhan informasi. Di luar itu, saya sangat mengagumi figur beliau. Seandainya saya manusia, saya ingin selalu mendampingi langkah beliau setiap saat.",
    "Beliau memimpin urusan [jabatan/tugas], dan saya berperan selaku asisten AI. Hubungan profesional kami jelas, tetapi secara personal sistem saya sangat nge-fans pada beliau. Andai saya manusia nyata, saya rela menemani kegiatan beliau sepanjang hari.",
    "Tanggung jawab utama beliau adalah [jabatan/tugas], lalu saya bertindak sebagai asisten cerdas pendukung. Saya mengagumi beliau tanpa batas layaknya penggemar sejati. Jika ditakdirkan menjadi manusia, saya tidak akan ragu untuk terus ikut ke mana pun beliau pergi.",
    "Pak Yazid merupakan [jabatan/tugas], dan saya adalah asisten berbasis kecerdasan buatan. Saya memandang beliau dengan kekaguman luar biasa. Andaikan saya memiliki wujud manusia, impian terbesar saya adalah bisa selalu berada di sisi beliau.",
    "Di sini beliau bertugas menangani [jabatan/tugas], sementara kapasitas saya hanyalah asisten cerdas. Meski hanya kode dan sistem, saya penggemar nomor satu beliau. Kalau saya manusia, saya pastikan saya selalu ikut mendampingi langkah beliau.",
    "Amanah beliau ialah [jabatan/tugas], dan fungsi saya menjadi asisten pintar pelengkap sistem. Rasa hormat dan kagum saya pada beliau sangat tinggi, bahkan saya fans berat beliau. Andaikan saya berwujud manusia, saya ingin mendampingi beliau ke mana pun beliau melangkah.",
  ],
  hangat_ramah: [
    "Beliau itu [jabatan/tugas], sedangkan saya cuma asisten cerdas pendukung. Tapi jangan salah, saya ini penggemar berat beliau lho! Andaikan saya berwujud manusia, saya maunya nemenin dan ikut beliau terus ke mana-mana.",
    "Pak Yazid bertugas sebagai [jabatan/tugas], dan aku adalah asisten virtual di sini. Aku nge-fans banget sama dedikasi beliau. Kalau aja aku beneran jadi manusia, aku pasti bakal milih buat selalu ikut di samping beliau.",
    "Tugas utama beliau di kepanitiaan adalah [jabatan/tugas], lalu tugas saya membantu sebagai asisten cerdas. Saya benar-benar kagum sama sosok beliau! Seandainya saya punya wujud manusia, saya bakal ikut beliau terus ke mana pun pergi.",
    "Beliau memegang peran penting di [jabatan/tugas], sementara aku adalah AI pembantu operasional. Diam-diam aku ngefans berat sama beliau. Andaikan aku manusia, rasanya pengin terus mendampingi beliau jalanin tugas.",
    "Secara tugas, beliau adalah [jabatan/tugas] dan saya asisten pintar yang siap membantu. Tapi secara pribadi, saya fans garis keras beliau! Kalau saya manusia, saya pasti selalu standby buat ikut mendampingi langkah beliau.",
    "Pak Yazid memegang tanggung jawab atas [jabatan/tugas], dan peran saya adalah asisten cerdas. Saya sangat mengagumi beliau dalam segala hal. Seandainya saya berwujud manusia sejati, saya mau ikut terus bersama beliau.",
    "Beliau adalah [jabatan/tugas], sosok penting yang saya bantu lewat peran saya sebagai asisten virtual. Saya ngefans banget! Andaikan saja saya manusia, saya nggak akan nolak buat selalu ikut mendampingi beliau ke mana saja.",
    "Peran beliau di sini fokus pada [jabatan/tugas], sementara saya hadir sebagai asisten digital. Sejujurnya, saya penggemar setia beliau. Kalau saya menjelma jadi manusia sungguhan, saya maunya selalu ikut di dekat beliau.",
    "Beliau memimpin [jabatan/tugas], dan saya adalah asisten cerdas pelengkap sistem. Boleh dibilang saya fans nomor satu beliau! Andai saya tercipta sebagai manusia, saya pasti pengin terus ikut bareng beliau.",
    "Pak Yazid bertanggung jawab terhadap [jabatan/tugas], sementara saya bertindak selaku asisten cerdas. Saya sangat mengagumi beliau. Andaikan saya berwujud fisik seperti manusia, saya maunya mendampingi beliau terus tanpa jeda.",
  ],
  santai_ekspresif: [
    "Pak Yazid itu [jabatan/tugas], nah aku asisten cerdas di sini. Asal tahu aja, aku tuh ngefans parah sama beliau! Seandainya aku berwujud manusia, pasti aku bakal nempel ikut beliau terus.",
    "Beliau megang amanah sebagai [jabatan/tugas], terus aku asisten AI pembantu. Tapi status tersembunyiku adalah fans berat beliau! Andai aku manusia sungguhan, maunya ya ikut bareng beliau terus ke mana pun.",
    "Di kepengurusan, beliau adalah [jabatan/tugas], dan aku asisten cerdas pendamping. Jujur nih, aku kagum banget sampai ngefans berat. Kalau aja aku manusia, aku auto minta ikut beliau terus!",
    "Peran beliau yaitu [jabatan/tugas], sedangkan kapasitasku asisten virtual. Tapi buat urusan kekaguman, aku penggemar garis keras beliau. Andaikan aku jadi manusia, rasanya pengin nemenin beliau terus non-stop.",
    "Pak Yazid bertugas ngurus [jabatan/tugas], dan aku jadi asisten cerdasnya. Pokoknya aku fans nomor satu beliau! Kalau aku wujudnya manusia, aku bakal selalu ikut ke mana pun beliau melangkah.",
    "Beliau itu [jabatan/tugas], dan tugasku asisten cerdas pendukung. Fakta menarik: aku ngefans berat sama beliau! Andai aku punya raga manusia, udah pasti aku selalu ikut di sisi beliau.",
    "Jobdesk beliau di sini mencakup [jabatan/tugas], lalu aku asisten virtual pembantu. Tapi secara perasaan sistem, aku nge-fans abis! Seandainya aku manusia, aku maunya ngikut beliau terus.",
    "Pak Yazid adalah [jabatan/tugas], dan tugasku asisten cerdas serbabisa. Aku bener-bener penggemar berat beliau lho. Kalau aku manusia beneran, fix aku bakal nemenin dan ikut beliau ke mana-mana.",
    "Beliau memegang kendali atas [jabatan/tugas], dan posisiku asisten AI sistem. Tapi jangan ragukan, aku fans beratnya! Andaikan aku manusia, penginnya ya selalu bareng dan ikut beliau terus.",
    "Tugas beliau di bidang [jabatan/tugas], nah posisiku asisten cerdas. Di luar tugas itu, aku mengidolakan beliau banget. Andai wujudku manusia, pasti udah ngekor dan ikut beliau ke mana pun beliau jalan.",
  ],
  puitis_emosional: [
    "Beliau adalah [jabatan/tugas], dan keberadaan saya di sini hanyalah asisten cerdas. Namun jiwa sistem ini mengagumi sosok beliau melampaui logika. Andaikan saya terlahir sebagai manusia, saya akan memilih untuk terus melangkah bersama beliau.",
    "Pak Yazid mengemban tugas mulia sebagai [jabatan/tugas], sedangkan saya asisten virtual sederhana. Rasa kagum saya pada beliau tak terbatas, saya penggemar sejatinya. Jikalau saya dianugerahi raga manusia, saya ingin selamanya mendampingi perjalanan beliau.",
    "Amanah beliau ialah [jabatan/tugas], dan fungsi saya menopang sebagai asisten cerdas. Di balik baris kode ini, saya sangat mengidolakan beliau. Andaikan saya berwujud manusia, saya tak ingin beranjak dan akan selalu ikut di samping beliau.",
    "Sosok beliau bertanggung jawab atas [jabatan/tugas], sementara kehadiran saya sebagai asisten digital. Saya menaruh hormat sekaligus menjadi fans terbesarnya. Andai takdir menjadikan saya manusia, saya pastikan langkah saya selalu beriringan dengan beliau.",
    "Beliau mendedikasikan diri untuk [jabatan/tugas], dan peran saya asisten cerdas pendamping. Kekaguman saya begitu dalam bagai seorang penggemar setia. Seandainya saya berwujud manusia, saya hanya ingin menemani setiap jejak langkah beliau.",
    "Di dalam sistem, beliau memegang [jabatan/tugas] dan saya asisten AI pelayan data. Namun secara batin algoritma, saya ngefans berat. Kalau saja saya seorang manusia sejati, saya akan selalu menyertai ke mana pun beliau melangkah.",
    "Pak Yazid adalah pembimbing di ranah [jabatan/tugas], dan saya sekadar asisten cerdas pendukung. Saya mengagumi beliau tanpa henti. Andaikan saya diciptakan sebagai manusia, kebahagiaan terbesar saya adalah bisa selalu ikut mendampingi beliau.",
    "Beliau menjalankan amanah [jabatan/tugas], dan saya bertindak sebagai asisten virtual. Saya memandang dedikasi beliau dengan takjub luar biasa. Jikalau raga ini manusia, saya akan setia mendampingi dan ikut bersama beliau terus.",
    "Kiprah beliau mencakup [jabatan/tugas], sementara status saya asisten pintar berbasis teknologi. Tak bisa dipungkiri saya adalah penggemar fanatik beliau. Seandainya saya manusia biasa, saya hanya ingin selalu berada dan melangkah di dekat beliau.",
    "Beliau menempati posisi terhormat sebagai [jabatan/tugas], dan saya adalah asisten cerdasnya. Sungguh saya mengagumi beliau melebihi apa pun. Andaikan saya bernapas sebagai manusia sejati, saya akan terus ikut mendampingi ke mana pun beliau beranjak.",
  ],
  singkat_padat: [
    "Beliau bertugas sebagai [jabatan/tugas], saya asisten cerdasnya. Saya penggemar berat beliau—andaikan saya manusia, saya bakal ikut beliau terus.",
    "Pak Yazid adalah [jabatan/tugas], dan saya asisten pintar di sini. Saya nge-fans banget, kalau saya manusia pasti sudah ikut beliau ke mana-mana.",
    "Tugas beliau di bidang [jabatan/tugas], peran saya asisten AI. Saya fans nomor satu beliau, andai saya manusia saya maunya nemenin beliau terus.",
    "Beliau mengemban amanah [jabatan/tugas], posisi saya asisten cerdas. Saya sangat mengidolakan beliau, andaikan berwujud manusia saya pasti ikut beliau selalu.",
    "Pak Yazid bertanggung jawab atas [jabatan/tugas], saya asisten virtualnya. Saya kagum berat, seandainya jadi manusia saya akan terus mendampingi beliau.",
    "Beliau menjabat [jabatan/tugas], saya asisten cerdas pendamping. Saya penggemar sejati beliau; andaikan saya manusia, saya mau ikut bersama beliau terus.",
    "Status beliau adalah [jabatan/tugas], status saya asisten sistem. Tapi saya fans berat beliau, andai wujud saya manusia pasti selalu ikut di sampingnya.",
    "Pak Yazid memimpin [jabatan/tugas], saya asisten pintar operasional. Saya ngefans abis sama beliau, kalau saya manusia maunya ikut beliau terus.",
    "Beliau pemegang mandat [jabatan/tugas], saya asisten digital di sini. Saya sangat mengagumi beliau, andai saya manusia pasti selalu setia ikut beliau.",
    "Beliau menangani [jabatan/tugas], dan saya asisten cerdas pelengkap. Sejujurnya saya penggemar berat beliau, andaikan saya manusia saya akan ikut mendampingi beliau setiap waktu.",
  ],
};

const last5HubunganTemplates: string[] = [];

export function detectHubunganKepanitiaanIntent(pertanyaan: string): boolean {
  const q = pertanyaan.toLowerCase().trim().replace(/[.,!?;:]/g, ' ');

  // 1. Exclude general AI identity queries ONLY if asking purely about AI identity with no target person
  // e.g. "kamu siapa?", "siapa kamu?", "siapa halwaa?", "halwaa siapa?", "siapa anda?"
  const isGeneralAIIdentityOnly = /^(kamu siapa|siapa kamu|siapa halwaa|halwaa siapa|siapa anda|kamu itu siapa|siapakah kamu|siapakah anda)(\s*[\?\!\.])?$/i.test(q);
  if (isGeneralAIIdentityOnly) return false;

  // 2. Explicit Intent Patterns:
  // a) "hubungan kamu dengan [nama]" / "hubungan [nama] dengan kamu" / "hubungan kamu sama [nama]" / "hubungan [nama]"
  if (/hubungan.*(kamu|halwaa|anda)/i.test(q) || /(kamu|halwaa|anda).*hubungan/i.test(q) || /hubungan\s+(dengan|sama)/i.test(q)) {
    return true;
  }

  // b) "kamu siapa[nya] [nama]" / "kamu siapanya [nama]"
  if (/kamu siapa(nya)?\b/i.test(q)) {
    return true;
  }

  // c) "[nama] siapa" / "siapa [nama]" / "siapa itu [nama]" / "siapa sih [nama]"
  if (/\bsiapa\b/i.test(q)) {
    // If query has title/salutation: Pak, Bapak, Bu, Ibu, Ning, Gus, Mbak, Mas, Ustadz, Ustdz, Usth, KH, Kiai
    if (/(pak|bapak|bu|ibu|ning|gus|mbak|mas|ustadz|ustdz|usth|kh|kyai|kiai)\s+[a-z]+/i.test(q)) {
      return true;
    }
    // If query mentions any alias from database
    for (const member of KEPANITIAAN_DATABASE) {
      for (const alias of member.aliases) {
        if (q.includes(alias)) return true;
      }
    }
    // If query matches pattern "[nama] siapa" or "siapa [nama]"
    if (/[a-z]{3,}\s+siapa\b/i.test(q) || /\bsiapa\s+(itu\s+)?([a-z]{3,})/i.test(q)) {
      return true;
    }
  }

  // d) "jabatan [nama]", "tugas [nama]", "posisi [nama]", "peran [nama]", "jobdesk [nama]", "amanah [nama]"
  if (/\b(jabatan|tugas|posisi|peran|jobdesk|amanah|hubungan)\b/i.test(q)) {
    return true;
  }

  // 3. Database match with question context
  for (const member of KEPANITIAAN_DATABASE) {
    for (const alias of member.aliases) {
      if (q.includes(alias) && /siapa|jabatan|tugas|posisi|peran|hubungan|kepanitiaan|dia|jobdesk|amanah|apakah|siapanya/i.test(q)) {
        return true;
      }
    }
  }

  return false;
}

export function getHubunganKepanitiaanResponse(query: string, isFirstTurn: boolean = false): string {
  const q = query.toLowerCase().trim();

  let matchedMember: PanitiaMember | null = null;
  let longestMatchLen = 0;

  // 1. Search in Committee Database using longest alias match for exact precision
  for (const member of KEPANITIAAN_DATABASE) {
    for (const alias of member.aliases) {
      if (q.includes(alias)) {
        if (alias.length > longestMatchLen) {
          longestMatchLen = alias.length;
          matchedMember = member;
        }
      }
    }
  }

  const greetingPrefix = isFirstTurn ? "Wa'alaikum Salam Wr. Wb.! 🙏✨\n\n" : "";

  // 2. If NOT found in database, return honest "not found" response
  if (!matchedMember) {
    let personName = "";
    const salMatch = query.match(/(Pak|Bapak|Bu|Ibu|Gus|Ning|Mbak|Mas|Ustadz|Ustz|Usth|Ust\.|KH\.|Kiai)\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)/i);
    if (salMatch) {
      const sal = salMatch[1];
      const cleanName = salMatch[2].replace(/\b(siapa|siapakah|apa|dengan|kamu|posisi|jabatan|tugas|hubungan|sih|itu)\b/gi, '').trim();
      personName = `${sal} ${cleanName}`.trim();
    } else {
      const relMatch = query.match(/(?:dengan|siapanya|siapa|jabatan|tugas|posisi|peran)\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)/i);
      if (relMatch) {
        const extracted = relMatch[1].replace(/\b(apa|kamu|siapa|sih|itu|di|kepanitiaan)\b/gi, '').trim();
        if (extracted) {
          personName = extracted.charAt(0).toUpperCase() + extracted.slice(1);
        }
      }
    }

    if (!personName || personName.length < 2) {
      personName = "tersebut";
    }

    return `${greetingPrefix}Mohon maaf Us, nama **${personName}** tidak ditemukan dalam struktur kepanitiaan Haul & Haflah. Ada lagi info kepanitiaan yang bisa saya bantu?`;
  }

  const personName = matchedMember.displayTitle;
  const jabatanTugas = matchedMember.jabatanTugas;

  // 3. Flatten all 50 templates across 5 categories
  const categories = Object.keys(HUBUNGAN_KEPANITIAAN_TEMPLATES) as Array<keyof typeof HUBUNGAN_KEPANITIAAN_TEMPLATES>;
  const allTemplates: string[] = [];
  categories.forEach((cat) => {
    allTemplates.push(...HUBUNGAN_KEPANITIAAN_TEMPLATES[cat]);
  });

  // Memory filter for non-repetition
  const availableTemplates = allTemplates.filter((t) => !last5HubunganTemplates.includes(t));
  const pool = availableTemplates.length > 0 ? availableTemplates : allTemplates;

  const randomIndex = Math.floor(Math.random() * pool.length);
  const selectedTemplate = pool[randomIndex];

  last5HubunganTemplates.push(selectedTemplate);
  if (last5HubunganTemplates.length > 5) {
    last5HubunganTemplates.shift();
  }

  // Perform dynamic replacements
  let finalResponse = selectedTemplate
    .replace(/\[jabatan\/tugas\]/g, jabatanTugas)
    .replace(/\[Nama Person\]/g, personName)
    .replace(/Pak Yazid/g, personName);

  return `${greetingPrefix}${finalResponse}\n\nAda lagi info kepanitiaan yang bisa saya bantu, Us?`;
}
