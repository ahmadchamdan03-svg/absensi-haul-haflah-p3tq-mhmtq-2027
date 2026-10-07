const fs = require('fs');

const filePath = 'app/api/ai/ask/route.ts';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Update function signature: generateLocalSmartResponse
code = code.replace(
  'function generateLocalSmartResponse(userQuery: string, isFirstTurn: boolean = true): string {',
  "function generateLocalSmartResponse(userQuery: string, isFirstTurn: boolean = true, role: string = 'WALI'): string {"
);

// 2. Insert new handlers right after `const headerIntro = \`${greetingPrefix}\${intro}\`;`
const targetPoint = 'const headerIntro = `${greetingPrefix}${intro}`;';
const newHandlers = `const headerIntro = \`\${greetingPrefix}\${intro}\`;

  // =========================================================================
  // PROTEKSI AKSES WALI SANTRI (INFORMATION BOUNDARY)
  // Wali santri dilarang mengakses data keuangan, anggaran kas, password, dll.
  // =========================================================================
  if (role === 'WALI') {
    const isSensitiveInternal =
      q.includes('anggaran') ||
      q.includes('keuangan') ||
      q.includes('pengeluaran') ||
      q.includes('pemasukan') ||
      q.includes('kas panitia') ||
      q.includes('uang kas') ||
      q.includes('honor') ||
      q.includes('gaji') ||
      q.includes('password') ||
      q.includes('kata sandi') ||
      q.includes('sandi') ||
      q.includes('token hmac') ||
      q.includes('kunci rahasia');

    if (isSensitiveInternal) {
      return \`\${greetingPrefix}Ngapunten sanget Bapak/Ibu wali santri ingkang minulya, informasi kasebat kalebet data administratif internal kepanitiaan ingkang mboten kepareng dipunpublikasikaken umum. 🙏✨\\n\\nUntuk Bapak/Ibu wali santri, Usth. Halwaa siap membantu informasi jadwal adicara, ketentuan sambangan, warna kartu masuk, denah lokasi, fasilitas penginapan, konsultasi ibadah, doa, utawi panduan sowan. Wonten ingkang saget dibantu malih?\`;
    }
  }

  // =========================================================================
  // DETEKSI KHUSUS: WARNA KARTU MASUK / STIKER RESMI (KOORDINASI II)
  // =========================================================================
  if (
    q.includes('warna kartu') ||
    q.includes('warna tiket') ||
    q.includes('warna stiker') ||
    q.includes('kartu masuk') ||
    q.includes('stiker masuk')
  ) {
    return \`\${headerIntro}Berdasarkan hasil resmi **Sidang Koordinasi II (Seksi Kesekretariatan)**, warna kartu masuk / stiker fisik ditetapkan sebagai berikut:

### 🎫 Standar Warna Kartu Masuk Resmi Haflah 2027:
1. **Warna Hitam Gold**:
   - Khusus untuk **Tamu Undangan Walisantri yang Maju Panggung** *(Wali santriwati Takhtiman Bil Ghoib yang mendampingi ke panggung utama Aula Al-Muktamar)*.
2. **Warna Merah Gold**:
   - Untuk **Tamu Undangan Umum** *(Penguji Al-Qur'an, Mustahiq, Asatidz, Perwakilan Pondok)*.
   - Serta untuk **Walisantri Reguler** *(Takhtiman Bin Nadzori dan Tamatan Aliyah)*.
3. **Stiker Kartu Parkir VIP**:
   - Diterbitkan oleh Seksi Keamanan khusus untuk kendaraan Tamu VIP & VVIP (Dzurriyah & Masyaikh).

Wonten ingkang saget dibantu malih Us?\`;
  }

  // =========================================================================
  // DETEKSI KHUSUS: SEKSI PENERIMA TAMU (8 POS PUTRI & 8 POS PUTRA)
  // =========================================================================
  if (q.includes('penerima tamu') || q.includes('pos penerima') || q.includes('tugas penerima tamu')) {
    return \`\${headerIntro}Berdasarkan Hasil Sidang Koordinasi II Bagian II, berikut susunan lengkap **Seksi Penerima Tamu**:

### 👑 Dewan Pembimbing Putra (Bagan 8 - Penerima Tamu):
- **Koordinator**: **Bapak Muhammad Badru Ro'in Amin\\***
- **Wakil Koordinator**: **Bapak Imam Ghozali\\*\\***
- **Anggota**: Bpk Muhammad Najih, Bpk M. Izzuddin Assakhi, Bpk Alex Alqomah, Bpk Afif Cholilul Umam, Bpk Affan Istikhori, Bpk Subadar, Bpk Misbahul Huda, Bpk M. Sabiqul Anam, Bpk M. Yazid Mahbubillah.

### 🌸 Kasi & Wakasi Dewan Pleno Putri:
- **Kasi**: **Hanifatun Nasihah\\***
- **Wakasi**: **Safira Auliyatul Faizah\\*\\***
- **Anggota**: Aimmatul Muawwanah, Noor Izza Farhana, Nuzulul Hasanah.

### 📍 8 Pos Penerima Tamu Putri (Hari Acara):
1. **Pos 1 (Luar Gerbang Bola Dunia)**: *Aimmatul Mu'awwanah & Nala Sholihatunnisa'* (Menyambut tamu, periksa kartu masuk/stiker, arahkan ke pos 2).
2. **Pos 2 (Pojok Terop Santri)**: *Rifqa Annisa Nawang Wulan & Zidni Zein Azkiyah* (Arahkan tamu ke tempat prasmanan pos 3).
3. **Pos 3 (Prasmanan Putri)**: *Safira Auliyatul Faizah & Afifah Nur Hafidzoh* (Sambut tamu ke prasmanan).
4. **Pos 4 (Samping Panggung)**: *Hj. Noer Izza Farhana, Lafifatuz Zahro', Nailatun Nafisah* (Sambut Dzurriyah ke tempat VIP panggung).
5. **Pos 5 (Depan Tamu Undangan Umum)**: *Nuzulul Hasanah & Nurus Sa'idah* (Periksa kartu masuk, arahkan ke tempat duduk).
6. **Pos 6 (Barisan Belakang Wali Santri Pi Kiri)**: *Ghina Sa'idah & Khusnul Khotimah* (Persilahkan tamu ke tempat duduk).
7. **Pos 7 (Drop Point Dzuriyyah)**: *Hanifatun Nasihah & Ilma Rofi'atul Walidah* (Sambut Dzuriyyah, isi daftar hadir Dzuriyyah, dan nderekaken rawuh).
8. **Pos 8 (Sekitar Area Lobi)**: *Hanik Najwa & Nurul Walidaini Ihsana* (Sambut Dzuriyyah di lobi, kawal ke Pos 7).

### 📍 8 Pos Penerima Tamu Putra (Hari Acara):
1. **Pos 1 (Luar Gerbang Bola Dunia)**: 2 Orang Petugas (Sambut tamu & cek kartu masuk).
2. **Pos 2 (Gerbang Bola Dunia Barat)**: *Bapak Akfi Romiyan Kafabih & Bapak Achmad Abdulloh Faqih*.
3. **Pos 3 (Gerbang Utara)**: 2 Tenaga Bantu Putra (Arahkan tamu putra ke prasmanan).
4. **Pos 4 (Depan Prasmanan Tamu Pa)**: *Bapak Affan Istikhori*.
5. **Pos 5 (Timur Prasmanan Pa)**: *Bapak Badru Ro'in Amin*.
6. **Pos 6 (Samping Wali Santri Kiri)**: *Bapak Subadar, Bapak Misbahul Huda, Bapak Alex Alqomah*.
7. **Pos 7 (Drop Point Dz Putra)**: *Bapak M. Izzuddin Assakhi, Bapak Muhammad Najih, Bapak M. Yazid Mahbubillah*.
8. **Pos 8 (Sekitar Area Lobi)**: *Bapak Imam Ghozali, Bapak Afif Cholilul Umam, Bapak Muhammad Sabiqul Anam*.

Wonten ingkang saget dibantu malih Us?\`;
  }

  // =========================================================================
  // DETEKSI KHUSUS: ATURAN BUKET, KUTEK, HENA, NAIL ART, FOTOGRAFER
  // =========================================================================
  if (
    q.includes('buket') ||
    q.includes('kutek') ||
    q.includes('hena') ||
    q.includes('nail art') ||
    q.includes('kuku palsu') ||
    q.includes('fotografer')
  ) {
    return \`\${headerIntro}Berdasarkan **Aturan Tambahan Seksi Keamanan Haflah 2027**:

1. 🚫 **Dilarang membawa Buket** ke dalam area acara.
2. 🚫 **Dilarang memakai kutek, hena, dan nail art / kuku palsu**.
3. 🚫 **Dilarang membawa fotografer dari luar** karena mengganggu kinerja fotografer utama panitia (TDM).
4. 📷 **Penitipan Kamera**: Diperbolehkan menitipkan kamera bagi segenap shohibul hajat (disediakan jasa charger dengan syarat membawa charger sendiri). Kamera dapat diambil kembali selesai acara di tempat izin keluar Gerbang Bola Dunia.
5. 🚷 **Sterilisasi Area**: Walisantri dilarang memasuki area Shohibul Hajat selama acara berlangsung.

Wonten ingkang saget dibantu malih Us?\`;
  }

  // =========================================================================
  // DETEKSI KHUSUS: KETENTUAN SAMBANGAN, KEPULANGAN, IZIN KELUAR
  // =========================================================================
  if (
    q.includes('sambangan') ||
    q.includes('jam sambang') ||
    q.includes('lokasi sambang') ||
    q.includes('pulang') ||
    q.includes('izin keluar') ||
    q.includes('penjemputan')
  ) {
    return \`\${headerIntro}Berdasarkan pedoman resmi **Seksi Keamanan Haflah 2027**:

### 📍 Lokasi & Waktu Sambangan:
- **Waktu**: Dibuka **setelah acara selesai sampai pukul 18.00 WIs**.
- **Lokasi**:
  * **Halaman Al-Khodijah**: Khusus Santri Takhtiman Bil Ghoibi dan Bin Nadzori.
  * **Gedung Rusunawa Baru**: Khusus Siswi Tamatan Aliyah.

### 📋 Syarat & Kewajiban Sambangan / Penjemput:
1. Penyambang / Penjemput adalah **mahrom sah** dari shohibul hajat.
2. Wajib mendaftarkan diri di depan **Gerbang Bola Dunia** dengan membawa **KKS / fotokopi KK dan KTP yang sesuai**.
3. Dilarang membawa / mengoperasikan alat elektronik di selain area sambangan.
4. Dilarang mengikuti sambangan teman.

### 🚗 Ketentuan Kepulangan:
- Santri Shohibul Hajat (selain Takhtiman Bil-Ghoibi) dan santri pingitan diperbolehkan pulang setelah acara selesai.
- Pendaftaran kepulangan dibuka tanggal **20 – 30 Desember 2026** ke Keamanan Haflah dengan fotokopi KK.
- Santriwati Takhtiman Bil Ghoibi **tidak diperkenankan pulang**.

Wonten ingkang saget dibantu malih Us?\`;
  }

  // =========================================================================
  // DETEKSI KHUSUS: KONSUMSI, PRASMANAN, DAN BERKATAN
  // =========================================================================
  if (
    q.includes('prasmanan') ||
    q.includes('menu') ||
    q.includes('konsumsi') ||
    q.includes('berkat') ||
    q.includes('tonjokan') ||
    q.includes('soto')
  ) {
    return \`\${headerIntro}Berikut daftar resmi hidangan konsumsi Haflah 2027:

### 🍲 Prasmanan Walisantri & Tamu Umum (Hari H):
- **Menu Kering**: Nasi Putih / Nasi Jagung, Ayam Laos, Tahu & Tempe Goreng, Sambal, Urap, Krupuk Uyel.
- **Menu Kuah**: Soto Lamongan (Mie Bihun, Kubis, Telur ½, Capar), Sambal Kecap, Kerupuk Udang.
- **Unjukan**: Aqua Gelas, Teh Hangat, Kopi, Es Jeruk.

### 🍱 Berkat Walisantri Shohibul Hajat & Tamu Umum:
- Nasi, Ayam Pupu Manis, Sambal, Telur Asin, Daging Bumbu Merah, Kering Kentang Mustofa & Kacang, Bihun Kering.
- **Snack**: Risol Mayo, Roti Lirboyo (Donat Chocho Mete, Roti Piscok Keju), Getuk Pisang, Pilus Australia, Jeruk, Cristalin Tanggung.

### 🎁 Tonjokan Dzuriyyah & VIP:
- Dilayani oleh Lyla Catering serta menu spesial berkatan Wong Solo.

Wonten ingkang saget dibantu malih Us?\`;
  }

  // =========================================================================
  // DETEKSI KHUSUS: JAM BUKA GERBANG & REGISTRASI
  // =========================================================================
  if (
    q.includes('jam buka') ||
    q.includes('buka jam') ||
    q.includes('registrasi buka') ||
    q.includes('jam berapa masuk') ||
    q.includes('pukul berapa')
  ) {
    return \`\${headerIntro}Pintu registrasi gerbang dibuka mulai pukul **06.30 WIB / 07.00 WIs**:

- **Pos Kesekretariatan Putra**: Sebelah barat jalan luar Gerbang Bola Dunia.
- **Pos Kesekretariatan Putri**: Sebelah timur jalan luar Gerbang Bola Dunia.
- Disediakan transit penginapan di **Rusunawa** bagi walisantri yang rawuh sebelum hari pelaksanaan acara.

Wonten ingkang saget dibantu malih Us?\`;
  }

  // =========================================================================
  // DETEKSI KHUSUS: RUNDOWN ACARA HARI H
  // =========================================================================
  if (
    q.includes('rundown') ||
    q.includes('susunan acara') ||
    q.includes('jadwal acara') ||
    q.includes('urutan acara')
  ) {
    return \`\${headerIntro}Berikut **Rundown Resmi Haul & Haflah Akhirussanah 1448 H./ 2027 M.** (Sabtu, 24 Rajab 1448 H / 02 Januari 2027 M):

### 🌅 Pra-Acara:
- **05.30 WIs**: Persiapan Shohibul Hajat diberangkatkan ke Aula Al Muktamar.
- **05.45 – 06.00**: Senandung Sholawat (Syauqul Ahibba' Group).
- **06.00 – 06.30**: Lalaran Tamatan Aliyah (Ibu Fatimah).
- **06.30 – 07.30**: Tartilan Takhtiman Bil Ghoibi & Bin Nadzori + Do'a Khotmil Qur'an (Pak Bustomi).

### 🕌 Acara Inti:
- **07.30 – 07.35**: MC Pembukaan (Nisrina Zahirotul).
- **07.35 – 07.41**: Qiro'at (Wida Mardiana & Anzalina Nuronia).
- **07.42 – 08.07**: Tahlil (Pak Taufiq).
- **08.08 – 08.29**: Sambutan Mudier MHMTQ (Agus H. M. Kafabihi) & Pengasuh P3TQ (Agus H. M. Hasyim).
- **08.30 – 08.51**: Sambutan Shohibul Hajat (Ibu Afifatun Nisaa) & Sambutan Wali Santri (Pak Sufyan).
- **08.52 – 09.32**: Pembagian Syahadah Takhtiman Bil Ghoibi (Gel. 1 & 2).
- **09.33 – 09.53**: Pembagian Syahadah Takhtiman Bin Nadzori (Gel. 1 s/d 4).
- **09.54 – 10.11**: Istirahat (Senandung Sholawat Nabi - Ibu Nyai Hj. Noer Channah & SA Group).
- **10.12 – 11.42**: Mau'idzoh Hasanah & Do'a (Pak Abha).
- **11.43 – 12.00**: Foto Dzurriyah Bani Abdul Karim & Do'a Masyayikh.
- **12.00 – 12.35**: Pembagian Ijazah Siswi Tamatan Aliyah (Gel. 1 s/d 7).
- **12.35 – 12.45**: Apresiasi Siswi 9 Tahun (Gel. 1 & 2).
- **12.51 – 13.01**: MC Penutupan & Do'a Penutup (Pak Sufyan).

### 🎬 Pasca Acara:
- **01.01 – 01.16 WIs**: Penayangan Video Closing *"Sajak Akhirussanah"* (Tim TDM P3TQ).
- **01.17 – Selesai**: Sesi Foto Lengkap bersama Dzuriyyah.

Wonten ingkang saget dibantu malih Us?\`;
  }
`;

code = code.replace(targetPoint, newHandlers);

// 3. Update POST handler to extract role and pass it
code = code.replace(
  'const { prompt, history, apiKey: clientApiKey } = body;',
  'const { prompt, history, apiKey: clientApiKey, role, userRole } = body;\n    const currentRole = role || userRole || "WALI";'
);

code = code.replace(
  'const localSmartResult = generateLocalSmartResponse(prompt, isFirstTurn);',
  'const localSmartResult = generateLocalSmartResponse(prompt, isFirstTurn, currentRole);'
);

code = code.replace(
  'const localReply = generateLocalSmartResponse(prompt, isFirstTurn);',
  'const localReply = generateLocalSmartResponse(prompt, isFirstTurn, currentRole);'
);

code = code.replace(
  'return generateLocalSmartResponse(userPrompt, isFirstTurn);',
  'return generateLocalSmartResponse(userPrompt, isFirstTurn, currentRole);'
);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated app/api/ai/ask/route.ts!');
