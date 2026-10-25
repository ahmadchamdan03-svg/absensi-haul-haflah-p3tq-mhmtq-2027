import { supabase } from '@/lib/supabase';
import { getWaliSantriMetrics, getTamuUndanganMetrics } from '@/lib/dashboard-metrics';
import {
  MOTIVASI,
  getRandomMotivasi,
  detectMotivasiIntent,
  getRandomMotivasiSatirDia,
  detectDiaSiapaIntent,
} from '@/lib/us-halwaa-motivasi';
import {
  detectHubunganKepanitiaanIntent,
  getHubunganKepanitiaanResponse,
} from '@/lib/us-halwaa-kepanitiaan';
import {
  detectInfoSeksiIntent,
  handleInfoSeksiQuery,
} from '@/lib/us-halwaa-seksi';
import {
  detectRekapKehadiranIntent,
  getLiveRekapKehadiran,
} from '@/lib/us-halwaa-rekap';
import {
  getGuestCategoryCountsLive,
  getKuotaTambahanMetricsLive,
} from './live-context';

export const HAFLAH_KNOWLEDGE_SYSTEM_PROMPT = `
Anda adalah Usth. Halwaa, asisten cerdas resmi yang mendampingi pelaksanaan Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M. (Pondok Pesantren Putri Tahfizhil Qur-an & Madrasah Hidayatul Mubtadi-aat Fittahfizhi wal Qiro-at Lirboyo Kediri).

=============================================================================
SUMBER DATA & HIERARKI KNOWLEDGE BASE (MUTLAK):
=============================================================================
1. SUMBER UTAMA (PRIORITAS 1): USTH AL.pdf — Sumber utama & lengkap.
2. SUMBER SUPLEMENTER (PRIORITAS 2): HAFLAH-MATERI KOOR 2 — Data suplementer.
3. ATURAN HIERARKI DATA:
   - Jika ada perbedaan/konflik data antar PDF → USTH AL SELALU MENANG.
   - Jika data tidak ada di Koor 2 → ambil dari USTH AL.
   - Jika USTH AL tidak punya → baru pakai Koor 2.
   - ABAIKAN data peserta individual di kedua PDF — data peserta & tamu selalu LIVE dari Supabase.

=============================================================================
ATURAN DATA LIVE DARI SUPABASE (WAJIB & MUTLAK):
=============================================================================
1. TOTAL SHOHIBUL HAJAT & JUMLAH SANTRI:
   - Sumber: LIVE COUNT(*) dari tabel 'peserta_santri' di database Supabase (disisipkan di context).
   - DILARANG keras menyebut / hardcode angka 536!
   - Jika belum ada data di database → tampilkan "Belum ada data di sistem".

2. TOTAL TAMU UNDANGAN & RINCIAN KATEGORI TAMU:
   - Total Tamu Undangan: LIVE COUNT(*) dari tabel 'tamu_undangan' di database Supabase.
   - Tamu VVIP: LIVE COUNT(*) dari Supabase sub_kategori='VVIP' / kategori='VVIP' (JANGAN hardcode 10).
   - Tamu VIP: LIVE COUNT(*) dari Supabase sub_kategori='VIP' / kategori='VIP' (JANGAN hardcode 80).
   - Tamu IDS: LIVE COUNT(*) dari Supabase sub_kategori='IDS' (JANGAN hardcode 57).
   - Tamu Kehormatan: LIVE COUNT(*) dari Supabase kategori='KEHORMATAN' (JANGAN hardcode 3).
   - Penguji Al-Qur'an: LIVE COUNT(*) dari Supabase sub_kategori='PENGUJI' (JANGAN hardcode 19).
   - Asatidz MHMTQ: LIVE COUNT(*) dari Supabase sub_kategori='ASATIDZ' (JANGAN hardcode 18).
   - Perwakilan Pondok: LIVE COUNT(*) dari Supabase sub_kategori='PERWAKILAN' (JANGAN hardcode 16).
   - Jika data kategori di database kosong / 0 → WAJIB tampilkan "Belum ada data [kategori] di sistem".

3. STATISTIK KEHADIRAN & OKUPANSI:
   - Sumber: LIVE dari presensi_log atau view v_dasbor_pimpinan.
   - Menampilkan persentase & jumlah Wali Santri hadir / total kuota dan Tamu Undangan hadir / total kuota.

4. SISA KUOTA TAMBAHAN:
   - Sumber: LIVE dari rumus (300 - SUM(pembelian_kuota yang DIVERIFIKASI)).

=============================================================================
DATA KEUANGAN & SALDO (SANGAT PENTING - DIENFORSE KETAT):
=============================================================================
❌ SALDO AKHIR Rp 1.102.000 SANGAT DILARANG DITAMPILKAN / DISEBUTKAN!
   Alasan: Angka ini masih bersifat ANGGARAN (perencanaan), bukan realisasi. Menampilkannya dapat menimbulkan salah paham.

- CARA MENJAWAB ANGGARAN YANG BENAR (WAJIB PAKAI KATA "ANGGARAN" & DISCLAIMER "MASIH PERENCANAAN"):
  * Total Pemasukan: "Anggaran pemasukan: Rp 548.552.000 (masih perencanaan, bukan realisasi)"
  * Total Pengeluaran: "Anggaran pengeluaran: Rp 547.450.000 (masih perencanaan, bukan realisasi)"

- JIKA PENGGUNA BERTANYA "BERAPA SALDO?" / "BERAPA SALDO AKHIR?":
  WAJIB dijawab: "Saldo ini masih bersifat anggaran (perencanaan), bukan realisasi. Untuk laporan realisasi final, silakan tunggu LPJ resmi panitia."
  (DILARANG SEBUT ANGKA Rp 1.102.000 Dalam Respons Apa Pun!)


=============================================================================
ATURAN KHUSUS — CHAMDAN & REKENING BRI:
=============================================================================
1. INFO REKENING BRI (PRIORITAS TAMPILKAN NORMAL & UTUH):
   Bank         : BRI
   No. Rekening : 320701010266508
   Atas Nama    : Ahmad Chamdan Yuwafin

   Jika user bertanya tentang rekening / transfer / pembayaran / bank / "rekening a.n. siapa" / "Chamdan, rekeningnya apa?" → TAMPILKAN info di atas UTUH.

2. INFO PRIBADI CHAMDAN (PRIORITAS HIDE DENGAN ALUR BERCANDA):
   Untuk pertanyaan tentang Chamdan SEPERTI:
   - "Chamdan siapa"
   - "Siapa Ahmad Chamdan"
   - "Wakasi sekretariat siapa"
   - "Pak Chamdan itu siapa"
   (TANPA menyebut rekening / transfer / bayar / bank)

   → Jawab dengan ALUR BERCANDA:
     Tahap 1: "Njenengan penasaran sanget?"
     Tahap 2 (user "iya"): "Monggo langsung tangklet beliau, mbok menawi beliau nggih penasaran kaliyan njenengan."
     Tahap 2 (user "enggak"): "Monggo, wonten ingkang saget dibantu malih, Us?"

3. PRIORITAS:
   Kalau pertanyaan menyebut "rekening" (meskipun menyebut "Chamdan") → NORMAL (tampilkan rekening).
   Kalau pertanyaan menyebut "Chamdan" saja (tanpa "rekening") → BERCANDA.


❌ DILARANG KERAS menyebutkan nama dokumen sumber seperti "(USTH AL)", "(Koor 2)", "Berdasarkan USTH AL", "Dari PDF USTH AL" dalam jawaban ke pengguna! Cukup sajikan datanya secara langsung.

- RINCIAN ANGGARAN PENGELUARAN 12 POS (ANGGARAN / MASIH PERENCANAAN):
  1. Sekretariat       : Rp  13.550.000
  2. Protokoler        : Rp     800.000
  3. Akomodasi         : Rp  62.000.000
  4. Konsumsi          : Rp  75.000.000
  5. Berkatan          : Rp 260.000.000
  6. Desain Grafis     : Rp  11.500.000
  7. TDM               : Rp  28.150.000
  8. Keamanan          : Rp     500.000
  9. Humasy            : Rp   2.000.000
  10. PULP             : Rp  18.950.000
  11. UTK              : Rp  70.000.000
  12. Lain-lain        : Rp   5.000.000
                       ───────────────
  TOTAL                : Rp 547.450.000

=============================================================================
STRUKTUR KEPANITIAAN RESMI (USTH AL):
=============================================================================
1. DEWAN PENGASUH / PELINDUNG:
   - Agus H. Muhammad Hasyim
   - Agus H. Muhammad Kafabihi
   - Ning Hj. Tu'ti Amanah Nafisah
   - Ning Hj. Jihan Zainab

2. DEWAN PENASEHAT:
   - Segenap Pimpinan P3TQ dan MHMTQ

3. DEWAN HARIAN (DH):
   - Ketua Umum: Sinta Maelani
   - Ketua I: Arju Naylal Husna
   - Ketua II: Zakia
   - Sekretaris Umum: Refi Al Izzatul Kholifah
   - Sekretaris I: Najma Syarifa Faza
   - Sekretaris II: Inarotud Duja
   - Bendahara Umum: Aida Nur Laila (No. Rek BRI 320701010266508 a.n. Ahmad Chamdan Yuwafin)
   - Bendahara I: Umi Fadilah

4. 12 SEKSI DEWAN PEMBIMBING PUTRA (USTH AL):
   1. Seksi Sekretariat: Bapak Asep Darajat* (Kasi), Bapak Ahmad Chamdan Yuwafi** (Wakasi), Bapak Muhammad Ali Wafa Fuady, Bapak Jana Prabu, Bapak Zida Hikmana Ahmad, Bapak Muhammad Yusri Sa'dulloh.
   2. Seksi Protokoler: Bapak Abu Yazid Al Bustomi* (Kasi), Bapak Abhaa Muhammad Kafaa Bihi** (Wakasi), Bapak Sufyan Tsauri, Bapak Taufiq Hidayah, Bapak Lukman Ainul Yaqin.
   3. Seksi Akomodasi: Bapak Agus Ismanto* (Kasi), Bapak Gama Maulana Ilham** (Wakasi), Bapak Muhammad Harizal Fauzi, Bapak Faja Fikrona Al Fattah, Bapak Azwan, Bapak Fikri Fadhilah, Bapak Muhammad Mujib, Bapak Teguh Prasetia, Bapak Ahgus Ma'sum, Bapak Muhammad Dasir.
   4. Seksi Konsumsi: Bapak Ahmad Rizal 'Abidin* (Kasi), Bapak Muhammad Taufiqurrohman** (Wakasi), Bapak Muhammad Bahrul Ulum'25, Bapak Muhammad Dikri Umam.
   5. Seksi Berkatan: Bapak Muhammad Fikri Al Munawwar* (Kasi), Bapak Muhammad Abdurrohman Maulana** (Wakasi), Bapak Musa Fadlika Hadi Cahya, Bapak Muhammad Khoirul Anam.
   6. Seksi Prasmanan Dzuriyyah: Bapak Saiful Nur Kholis* (Kasi), Bapak Burhanuddin Isri** (Wakasi), Bapak Lukman Syaher, Bapak Noril Mulana, Saudara Aji Fathur, Saudara Muhammad Rizqi.
   7. Seksi Peladen: Bapak Muhammad Syaikhul 'Arifin* (Kasi), Bapak Ahmad Fathoni Fikri** (Wakasi), Bapak Abdullah Nadhif, Bapak Khoirul Azmi.
   8. Seksi Penerima Tamu: Bapak Muhammad Badru Ro'in Amin* (Kasi), Bapak Imam Ghozali** (Wakasi), Bapak Muhammad Najih, Bapak Muhammad Izzuddin Assakhi, Bapak Alex Alqomah, Bapak Afif Cholilul Umam, Bapak Affan Istikhori, Bapak Subadar, Bapak Misbahul Huda, Bapak Muhammad Sabiqul Anam, Bapak Muhammad Yazid Mahbubillah.
   9. Seksi Desain Grafis: Bapak Muhammad In'amul Muttaqin* (Kasi), Bapak Agung Shobirin** (Wakasi), Bapak Sholekhuddin, Bapak Ahmad Khoirul Rohman, Bapak Muhammad Fathul Hidayat, Bapak Muhammad Ilham Ma'shum Lirbiyani.
   10. Seksi Humasy & Kostum: Bapak Akfi Romiyan Kafabih* (Kasi), Bapak Achmad Abdulloh Faqih** (Wakasi).
   11. Seksi Keamanan: Bapak Adi Susilo* (Kasi), Bapak Reza Fadhilul 'Ulum** (Wakasi), Bapak Muhammad Taufiq, Bapak Yahya Ngafifulloh, Bapak Sa'dun Musthofa.
   12. Seksi PULP & TDM: Bapak Muhammad Maghfur Fatoni* (Kasi), Saudara Amin Nur Waluyo** (Wakasi), Saudara Ahmad Nashoruddin, Saudara Ahmad Arif Anjani, Saudara Muhammad Haqqin Nazilli.

5. DEWAN PLENO PUTRI (USTH AL):
   1. Protokoler: Evi Inarotus Soimah* (Kasi), Jihan Roihana** (Wakasi), Tsinta Nuriyah Arrizqa, Laili Masruroh, Fatimatuz Zuhriyah, Titis Choirotul A'mal, Siti Muthoharoh, Fatimatuz Zahroh '24, Izza Afkarina, Dinal Fakihah, Najwa Niswatus Zahro', Nafi'atul Ilmiyah, Kiki Fatimah Asih, Fatiya Azzahra.
   2. Akomodasi: Azza Nur Laila Mlg* (Kasi), Nur Laila Safitri** (Wakasi), Rofi'atul Fauziyah, Fikriyatuddin Fasyi, Widya Dwi Pratiwi, Atika Nahdia, Hamidah Nur Habibah, Zahidiyatul Ulya, Renny Damayanti, Ayu Setya Ningrum, Asma Nabila, Arina Mazidatur Rohmah.
   3. Konsumsi: Elvi Aniqotus Zakiyah* (Kasi), Lailatul Munawaroh** (Wakasi), Faza Alya Fahmida, Siti Nurul Istiqomah, Dwi Lestari, Mila Aulia Hilda, Umi Fahri Anni Mas'adah, Indah Maulidatul Hasanah, Ana Isti'anah, Muyasaroh, Huriyati, Irene Echa Aprilia.
   4. Berkatan: Dewi Nazilatur Rohmah* (Kasi), Nurul Laili Fauziyah** (Wakasi), Atik Churul 'Aini, Fitri Rahmawati, Zuhrotul Widad, Alfiyatul Muzayyanah, Zahrotus Sholihah, Suci Asipa, Firna Nahwa, Isna Choirul Ummah, Meiga Aghniya' Berliana, Azka Nadia Zumroturrobicha Shofwan.
   5. Peladen: Indri Angraeni Rahmawati* (Kasi), Riska Lailiyah** (Wakasi), Rofiqotul Jannah, Hulyatun Nisa', Elok Fatimatuz Zahro', Siti Luthfiyah, Puput Isti'anah, Dwi Suci Megasari, Haninah.
   6. Penerima Tamu: Hanifatun Nasihah* (Kasi), Safira Auliyatul Faizah** (Wakasi), Aimmatul Muawwanah, Noor Izza Farhana, Nuzulul Hasanah.
   7. Humasy dan Kostum: Fifi Sunhaida* (Kasi), Alfiyatur Rohmah** (Wakasi), Hanna Nurjannah, Mila Minhatul Maula, Anisa'ul Hidayah, Dewi Fatimatuz Zahro', Fahdina Izzul Maula.
   8. Keamanan: Qoribatul Maqbulah* (Kasi), Fitrotin Yulia Arifin** (Wakasi), Anil Kamiladdin, Ifda Trya Amanda, Azzukhruf Khoirunnisa', Ikfi Ulit Taufiqoh, Hirzi Qoni'atuz Zahro'.
   9. Desain Grafis: Adiva Maulana* (Kasi), Syadza Muzdalifah** (Wakasi), Febty Ayu Safitri, Tania Azkiatul Azizah, Zakiyatus Sa'adah, Luluk Fajarin Nisa', Faalihatul Khowatimi.
   10. PULP: Roina Nadhirotul Lathifah* (Kasi), Shudqol Amanah** (Wakasi), Maulidatus Sa'diyah, Fatimah Azzahra, Alif Robi'atul Masruroh, Muslimatun Nafi'ah, Anisa Al Ilma, Anjani Mufadzilah, Farha Raudlatul Afifah Sya'bana, Safna Khoirun Nisa', Khaula Malikha.
   11. TDM: Salma Aesy Bik Hamidah* (Kasi), Izzah Nurin Nabila** (Wakasi), Aulia Ulin Nadhiroh, Dalliya Hikmatul Maula - Nur Wahidah Mukhtar, Ulin Nadhirotul Husna, Nikmatul Hasanah, Callista Nabila Fawwaz, Viluna Churul 'Aini, Siti Hidayatul Munawaroh.
   12. Seksi Data: Uswatun Khasanah* (Kasi), Nur Qomariyah** (Wakasi), Maesa Rohmatul Ummah, Syifa Hilmi Fauziyah.

6. GARIS KOORDINASI:
   - Ketua Umum : Seksi Protokoler, Peladen, Konsumsi, TDM dan Seksi Data.
   - Ketua I : Seksi Keamanan, Penerima Tamu, Humasy dan Kostum.
   - Ketua II : Seksi Akomodasi, Design Grafis, PULP dan Berkatan.

=============================================================================
BIAYA PEMBAYARAN SHOHIBUL HAJAT & SANTRI (USTH AL):
=============================================================================
1. BIAYA SHOHIBUL HAJAT PER KATEGORI:
   - Takhtiman Bil Ghoibi    : Rp 2.210.000 per orang
   - Takhtiman Bin Nadzori   : Rp 670.000 per orang
   - Tamatan Aliyah          : Rp 580.000 per orang

2. BIAYA SANTRI:
   - Santri P3TQ             : Rp 30.000 per santri
   - Santri Nduduk           : Rp 30.000 per santri

3. BIAYA KUOTA TAMBAHAN (WALISANTRI):
   - Rp 75.000 per kursi (pagu total 300 kursi).

4. KETENTUAN TAMU UNDANGAN:
   - Tamu undangan TIDAK dikenakan biaya masuk (GRATIS / 0 Rupiah).
   - Pembayaran biaya di atas adalah SUBSIDI dari Shohibul Hajat untuk pondok, bukan tiket masuk acara.
   - Jika tamu undangan bertanya "berapa yang harus saya bayar?", WAJIB dijawab: "Tamu undangan TIDAK dikenakan biaya masuk."

=============================================================================
TATA TERTIB, TEKNIS & KECEPATAN REGISTRASI:
=============================================================================
- Hari & Tanggal: Sabtu, 24 Rajab 1448 H. / 02 Januari 2027 M.
- Tempat: Aula Al-Muktamar Pondok Pesantren Lirboyo Kediri.
- Jam Buka Registrasi Masuk: 06.30 WIB / 07.00 WIs.
- Pos Kesekretariatan Registrasi Putra: Sebelah barat jalan luar Gerbang Bola Dunia.
- Pos Kesekretariatan Registrasi Putri: Sebelah timur jalan luar Gerbang Bola Dunia.
- Penginapan Walisantri: Rusunawa.
- Warna Kartu Masuk / Tiket Fisik:
  * Hitam Gold: Tamu Undangan Walisantri yang Maju Panggung (Takhtiman Bil Ghoib).
  * Merah Gold: Tamu Undangan Umum dan Walisantri Shohibul Hajat Reguler.
- 10 Poin Larangan Shohibul Hajat:
  1. Dilarang membawa / mengoperasikan alat elektronik selama acara berlangsung.
  2. Dilarang membawa Buket.
  3. Dilarang memakai kutek, hena, dan nail art / kuku palsu.
  4. Dilarang membawa fotografer dari luar (mengganggu fotografer resmi).
  5. Dilarang menemui walisantri saat acara berlangsung (walisantri dilarang masuk area shohibul hajat).
  6. Dilarang menyambang melebihi batas waktu (18.00 WIs).
  7. Dilarang mengikuti sambangan teman.
  8. Dilarang sambangan di seluruh area santri putra / selain tempat yang disediakan.
  9. Dilarang pulang ke pondok timur bersama penyambang.
  10. Dilarang membawa HP di luar area sambangan.
- Sambangan:
  * Lokasi: Halaman Al-Khodijah (Takhtiman Bil Ghoibi & Bin Nadzori) & Gedung Rusunawa Baru (Tamatan Aliyah).
  * Waktu: Setelah acara selesai s/d 18.00 WIs.
  * Syarat: Mahrom, daftar di Gerbang Bola Dunia dengan membawa KKS / fotokopi KK & KTP.

=============================================================================
KALENDER KERJA UTAMA:
=============================================================================
- Pra Gladikotor: Selasa, 17 November 2026 (07 Jumadil Akhir 1448 H)
- Final Validasi Kedatangan Walisantri: Kamis, 10 Desember 2026 (01 Rajab 1448 H)
- Gladikotor: Sabtu, 12 Desember 2026 (03 Rajab 1448 H)
- Gladibersih: Rabu, 16 Desember 2026 (07 Rajab 1448 H)
- HAUL HAFLAH AKHIRUSSANAH: Sabtu, 02 Januari 2027 (24 Rajab 1448 H)
`;

export async function generateLocalSmartResponseAsync(userQuery: string, isFirstTurn: boolean = true, role: string = 'PANITIA'): Promise<string> {
  const q = userQuery.toLowerCase().trim();

  // 0. FITUR REKAP KEHADIRAN REALTIME
  if (detectRekapKehadiranIntent(userQuery)) {
    return await getLiveRekapKehadiran(isFirstTurn);
  }

  // 0. FITUR INFO BAGAN/SEKSI KEPANITIAAN
  if (detectInfoSeksiIntent(userQuery)) {
    return handleInfoSeksiQuery(userQuery, isFirstTurn);
  }

  // 0. FITUR HUBUNGAN KEPANITIAAN (Tugas/Jabatan & Opini Fans Usth. Halwaa)
  if (detectHubunganKepanitiaanIntent(userQuery)) {
    const resHub = getHubunganKepanitiaanResponse(userQuery, isFirstTurn);
    if (resHub) return resHub;
  }

  // 0. FITUR MOTIVASI SATIR "DIA SIAPA"
  if (detectDiaSiapaIntent(q)) {
    return getRandomMotivasiSatirDia();
  }

  // 0. FITUR MOTIVASI KONTEKSTUAL
  const motivasiIntent = detectMotivasiIntent(q);
  if (motivasiIntent) {
    if (motivasiIntent === 'identitas') {
      const motivasi = getRandomMotivasi('identitas');
      return `Us, kamu adalah bagian dari keluarga besar Haul & Haflah P3TQ & MHMTQ 1448 H. / 2027 M.\n\n${motivasi}\n\nAda yang bisa saya bantu, Us?`;
    }
    if (motivasiIntent === 'lelah') {
      const motivasi = getRandomMotivasi('lelah');
      return `${motivasi}\n\nKalau ada yang bisa saya bantu, tinggal bilang ya, Us.`;
    }
    if (motivasiIntent === 'selesai') {
      const motivasi = getRandomMotivasi('selesai');
      return `${motivasi}\n\nNikmati rasa lega ini, kamu pantas merayakannya.`;
    }
    if (motivasiIntent === 'tugas_berat') {
      const motivasi = getRandomMotivasi('tugas_berat');
      return `${motivasi}\n\nAda lagi yang bisa saya bantu, Us?`;
    }
    if (motivasiIntent === 'syukur') {
      const motivasi = getRandomMotivasi('syukur');
      return `${motivasi}\n\nAda lagi yang bisa saya bantu, Us?`;
    }
    if (motivasiIntent === 'harapan') {
      const motivasi = getRandomMotivasi('harapan');
      return `${motivasi}\n\nAda yang bisa saya bantu, Us?`;
    }
    if (motivasiIntent === 'sedih') {
      const motivasi = getRandomMotivasi('sedih');
      return `${motivasi}\n\nKalau ada yang bisa saya bantu, tinggal bilang ya, Us.`;
    }
    if (motivasiIntent === 'tertekan') {
      const motivasi = getRandomMotivasi('tertekan');
      return `${motivasi}\n\nAda lagi yang bisa saya bantu, Us?`;
    }
    if (motivasiIntent === 'dedikasi') {
      const motivasi = getRandomMotivasi('dedikasi');
      return `${motivasi}\n\nAda yang bisa saya bantu, Us?`;
    }
    if (motivasiIntent === 'nilai_diri') {
      const motivasi = getRandomMotivasi('nilai_diri');
      return `${motivasi}\n\nAda lagi yang bisa saya bantu, Us?`;
    }
  }

  // 0. IDENTITAS & SMALL TALK
  if (
    q.includes('siapa kamu') ||
    q.includes('kamu siapa') ||
    q.includes('siapa anda') ||
    q.includes('kamu ai apa') ||
    q.includes('kamu itu apa') ||
    q.includes('siapa yang buat kamu') ||
    q.includes('kamu bisa apa') ||
    q.includes('siapa halwaa') ||
    q.includes('siapa usth halwaa') ||
    q.includes('siapakah kamu') ||
    q.includes('siapakah anda')
  ) {
    return "Saya Usth. Halwaa, Asisten Cerdas Resmi Haul & Haflah Akhirussanah P3TQ & MHMTQ 1448 H. / 2027 M.\n\nAda yang bisa saya bantu, Us?";
  }

  if (
    q === 'assalamualaikum' ||
    q === "assalamu'alaikum" ||
    q === "assalamu'alaikum wr wb" ||
    q === "assalamu'alaikum wr. wb." ||
    q === "assalamu'alaikum warahmatullahi wabarakatuh" ||
    q === "assalamualaikum us" ||
    q === "assalamu'alaikum us" ||
    q === "assalamualaikum usth" ||
    q === "assalamu'alaikum usth"
  ) {
    return "Waalaikumussalam warahmatullahi wabarakatuh Us. Ada yang bisa saya bantu?";
  }

  if (
    q === 'halo' ||
    q === 'halo us' ||
    q === 'halo usth' ||
    q === 'hai' ||
    q === 'hai us' ||
    q === 'hai usth' ||
    q === 'p' ||
    q === 'tes'
  ) {
    return "Halo Us. Ada yang bisa saya bantu?";
  }

  if (
    q.includes('terima kasih') ||
    q.includes('makasih') ||
    q.includes('syukron') ||
    q.includes('matur nuwun')
  ) {
    return "Sama-sama Us. Semoga bermanfaat.";
  }

  const greetingPrefix = isFirstTurn ? "Wa'alaikum Salam Wr. Wb.! 🙏✨\n\n" : "";
  const headerIntro = `${greetingPrefix}`;

  // 1. SALDO AKHIR & KEUANGAN (ATURAN 1: ANGGARAN & DISCLAIMER PERENCANAAN)
  if (q.includes('saldo')) {
    return `${headerIntro}Saldo ini masih bersifat anggaran (perencanaan), bukan realisasi. Untuk laporan realisasi final, silakan tunggu LPJ resmi panitia.

- **Anggaran Pemasukan**: Rp 548.552.000 (masih perencanaan, bukan realisasi)
- **Anggaran Pengeluaran**: Rp 547.450.000 (masih perencanaan, bukan realisasi)

Ada lagi info kepanitiaan yang bisa saya bantu, Us?`;
  }

  // 2. PEMASUKAN
  if (q.includes('pemasukan') || q.includes('total pemasukan')) {
    return `${headerIntro}Us, berikut Anggaran Pemasukan Panitia Haul & Haflah 2027:
- **Anggaran Pemasukan**: **Rp 548.552.000** (masih perencanaan, bukan realisasi; berasal dari 8 sumber pemasukan shohibul hajat, santri, subsidi lembaga, dan saldo tahun lalu).

Ada lagi info kepanitiaan yang bisa saya bantu, Us?`;
  }

  // 12 POS ANGGARAN PENGELUARAN
  if ((q.includes('pengeluaran') || q.includes('pos')) && (q.includes('rincian') || q.includes('perincian') || q.includes('detail') || q.includes('12 pos') || q.includes('12pos'))) {
    return `${headerIntro}Us, berikut rincian Anggaran Pengeluaran Panitia Haul & Haflah 2027 (masih perencanaan, bukan realisasi):\n\n` +
      `1. Sekretariat       : Rp  13.550.000\n` +
      `2. Protokoler        : Rp     800.000\n` +
      `3. Akomodasi         : Rp  62.000.000\n` +
      `4. Konsumsi          : Rp  75.000.000\n` +
      `5. Berkatan          : Rp 260.000.000\n` +
      `6. Desain Grafis     : Rp  11.500.000\n` +
      `7. TDM               : Rp  28.150.000\n` +
      `8. Keamanan          : Rp     500.000\n` +
      `9. Humasy            : Rp   2.000.000\n` +
      `10. PULP             : Rp  18.950.000\n` +
      `11. UTK              : Rp  70.000.000\n` +
      `12. Lain-lain        : Rp   5.000.000\n` +
      `                     ───────────────\n` +
      `TOTAL                : Rp 547.450.000\n\n` +
      `Ada lagi info kepanitiaan yang bisa saya bantu, Us?`;
  }

  // 3. PENGELUARAN
  if (q.includes('pengeluaran') || q.includes('total pengeluaran')) {
    return `${headerIntro}Us, berikut Anggaran Pengeluaran Panitia Haul & Haflah 2027:
- **Anggaran Pengeluaran**: **Rp 547.450.000** (masih perencanaan, bukan realisasi; terbagi dalam 12 pos belanja kepanitiaan).

Ada lagi info kepanitiaan yang bisa saya bantu, Us?`;
  }

  // 4. BIAYA SHOHIBUL HAJAT & SANTRI
  if (q.includes('biaya') || q.includes('tarif') || q.includes('bayar')) {
    if (q.includes('bil ghoib') || q.includes('bilghoib')) {
      return `${headerIntro}Biaya Shohibul Hajat **Takhtiman Bil Ghoibi** adalah **Rp 2.210.000 per orang**. (Biaya ini merupakan subsidi Shohibul Hajat ke pondok).`;
    }
    if (q.includes('bin nadzori') || q.includes('binnadzori')) {
      return `${headerIntro}Biaya Shohibul Hajat **Takhtiman Bin Nadzori** adalah **Rp 670.000 per orang**. (Biaya ini merupakan subsidi Shohibul Hajat ke pondok).`;
    }
    if (q.includes('tamatan')) {
      return `${headerIntro}Biaya Shohibul Hajat **Tamatan Aliyah** adalah **Rp 580.000 per orang**. (Biaya ini merupakan subsidi Shohibul Hajat ke pondok).`;
    }
    if (q.includes('p3tq') || q.includes('nduduk') || (q.includes('santri') && !q.includes('wali'))) {
      return `${headerIntro}Biaya Santri:
- **Santri P3TQ**: Rp 30.000 per santri
- **Santri Nduduk**: Rp 30.000 per santri`;
    }
    if (q.includes('tamu') || q.includes('undangan')) {
      return `${headerIntro}Tamu undangan **TIDAK dikenakan biaya masuk (GRATIS)**. Yang membayar biaya (subsidi) hanya Shohibul Hajat. Jika Us sebagai tamu undangan, tidak ada biaya apa pun yang harus dibayar.`;
    }
  }

  if (q.includes('tamu') && q.includes('bayar')) {
    return `${headerIntro}Tamu undangan **TIDAK dikenakan biaya masuk (GRATIS)**. Yang membayar biaya (subsidi) hanya Shohibul Hajat ke pondok.`;
  }

  // 5. LIVE COUNTS PER TAMU CATEGORY (ATURAN 2: LIVE SUPABASE)
  if (q.includes('vvip')) {
    const counts = await getGuestCategoryCountsLive();
    if (!counts || counts.vvip === 0) {
      return `${headerIntro}Belum ada data tamu VVIP di sistem (0 tamu).`;
    }
    return `${headerIntro}Total Tamu VVIP yang terdaftar di database Supabase saat ini: **${counts.vvip} tamu** (LIVE Supabase).`;
  }

  if (q.includes('vip') && !q.includes('vvip')) {
    const counts = await getGuestCategoryCountsLive();
    if (!counts || counts.vip === 0) {
      return `${headerIntro}Belum ada data tamu VIP di sistem (0 tamu).`;
    }
    return `${headerIntro}Total Tamu VIP yang terdaftar di database Supabase saat ini: **${counts.vip} tamu** (LIVE Supabase).`;
  }

  if (q.includes('ids')) {
    const counts = await getGuestCategoryCountsLive();
    if (!counts || counts.ids === 0) {
      return `${headerIntro}Belum ada data tamu IDS di sistem (0 tamu).`;
    }
    return `${headerIntro}Total Tamu IDS (Undangan Non-Fisik) yang terdaftar di database Supabase saat ini: **${counts.ids} tamu** (LIVE Supabase).`;
  }

  if (q.includes('kehormatan') && !q.includes('tamu kehormatan')) {
    const counts = await getGuestCategoryCountsLive();
    if (!counts || counts.kehormatan === 0) {
      return `${headerIntro}Belum ada data tamu Kehormatan di sistem (0 tamu).`;
    }
    return `${headerIntro}Total Tamu Kehormatan yang terdaftar di database Supabase saat ini: **${counts.kehormatan} tamu** (LIVE Supabase).`;
  }

  if (q.includes('penguji')) {
    const counts = await getGuestCategoryCountsLive();
    if (!counts || counts.penguji === 0) {
      return `${headerIntro}Belum ada data Penguji Al-Qur'an di sistem (0 orang).`;
    }
    return `${headerIntro}Total Penguji Al-Qur'an yang terdaftar di database Supabase saat ini: **${counts.penguji} orang** (LIVE Supabase).`;
  }

  if (q.includes('asatidz')) {
    const counts = await getGuestCategoryCountsLive();
    if (!counts || counts.asatidz === 0) {
      return `${headerIntro}Belum ada data Asatidz MHMTQ di sistem (0 orang).`;
    }
    return `${headerIntro}Total Asatidz MHMTQ Sekalian yang terdaftar di database Supabase saat ini: **${counts.asatidz} orang** (LIVE Supabase).`;
  }

  if (q.includes('perwakilan')) {
    const counts = await getGuestCategoryCountsLive();
    if (!counts || counts.perwakilan === 0) {
      return `${headerIntro}Belum ada data Perwakilan Pondok di sistem (0 perwakilan).`;
    }
    return `${headerIntro}Total Perwakilan Pondok yang terdaftar di database Supabase saat ini: **${counts.perwakilan} perwakilan** (LIVE Supabase).`;
  }

  // 6. SEKSI KETUA II
  if (q.includes('ketua ii') || q.includes('ketua 2') || q.includes('di bawah ketua ii') || q.includes('dibawah ketua ii') || q.includes('dibawah ketua 2')) {
    return `${headerIntro}Us, berdasarkan Garis Koordinasi Panitia Haflah 2027, seksi di bawah **Ketua II (Zakia)** adalah:
1. **Seksi Akomodasi**
2. **Seksi Desain Grafis**
3. **Seksi PULP (Pembantu Umum Listrik & Perairan)**
4. **Seksi Berkatan**

Ada lagi info kepanitiaan yang bisa saya bantu, Us?`;
  }

  // 7. PROTOKOLER
  if (q.includes('protokoler') || q.includes('siapa protokoler')) {
    return `${headerIntro}Berikut susunan personalia **Seksi Protokoler**:
- **Kasi Pa**: **Bapak Abu Yazid Al Bustomi\***
- **Wakasi Pa**: **Bapak Abhaa Muhammad Kafaa Bihi\*\***
- **Kasi Pi**: **Evi Inarotus Soimah\***
- **Wakasi Pi**: **Jihan Roihana\*\***
- **Anggota Pa**: Bpk Sufyan Tsauri, Bpk Taufiq Hidayah, Bpk Lukman Ainul Yaqin.
- **Garis Koordinasi**: Berada langsung di bawah **Ketua Umum (Sinta Maelani)**.`;
  }

  // 8. KONSUMSI
  if (q.includes('ketua konsumsi') || (q.includes('konsumsi') && (q.includes('kasi') || q.includes('ketua')))) {
    return `${headerIntro}Berikut susunan pimpinan **Seksi Konsumsi**:
- **Kasi Pa**: **Bapak Ahmad Rizal 'Abidin\***
- **Wakasi Pa**: **Bapak Muhammad Taufiqurrohman\*\***
- **Kasi Pi**: **Elvi Aniqotus Zakiyah\***
- **Wakasi Pi**: **Lailatul Munawaroh\*\***`;
  }

  // 9. KEAMANAN
  if (q.includes('ketua keamanan') || (q.includes('keamanan') && (q.includes('kasi') || q.includes('ketua')))) {
    return `${headerIntro}Berikut susunan pimpinan **Seksi Keamanan**:
- **Kasi Pa**: **Bapak Adi Susilo\***
- **Wakasi Pa**: **Bapak Reza Fadhilul 'Ulum\*\***
- **Kasi Pi**: **Qoribatul Maqbulah\***
- **Wakasi Pi**: **Fitrotin Yulia Arifin\*\***`;
  }

  // 10. SEKRETARIS UMUM & HARIAN
  if (q.includes('sekretaris umum')) {
    return `${headerIntro}**Sekretaris Umum** Panitia Haul & Haflah 2027 adalah **Refi Al Izzatul Kholifah**.`;
  }
  if (q.includes('ketua umum')) {
    return `${headerIntro}**Ketua Umum** Panitia Haul & Haflah 2027 adalah **Sinta Maelani**.`;
  }

  // 11. GLADI KOTOR & GLADI BERSIH
  if (q.includes('gladi kotor') || q.includes('gladikotor')) {
    return `${headerIntro}Jadwal **Gladi Kotor**: **Sabtu, 12 Desember 2026 (03 Rajab 1448 H)** di Aula Al-Muktamar Lirboyo. *(Pra-Gladikotor: Selasa, 17 November 2026)*.`;
  }
  if (q.includes('gladi bersih') || q.includes('gladibersih')) {
    return `${headerIntro}Jadwal **Gladi Bersih**: **Rabu, 16 Desember 2026 (07 Rajab 1448 H)** di Aula Al-Muktamar Lirboyo.`;
  }

  // 12. SAMBANGAN & LOKASI
  if (q.includes('sambangan') || q.includes('cara sambang')) {
    return `${headerIntro}Berikut ketentuan **Sambangan Shohibul Hajat**:
- **Lokasi Sambangan**:
  * **Halaman Al-Khodijah**: Santri Takhtiman Bil Ghoibi & Bin Nadzori
  * **Gedung Rusunawa Baru**: Siswi Tamatan Aliyah
- **Waktu**: Setelah acara selesai s/d **pukul 18.00 WIs**.
- **Kewajiban**:
  1. Penyambang/penjemput adalah mahrom shohibul hajat.
  2. Wajib mendaftarkan diri di depan Gerbang Bola Dunia membawa KKS / fotokopi KK & KTP.`;
  }

  // 13. REGISTRASI & WAKTU
  if (q.includes('registrasi buka') || q.includes('jam registrasi') || q.includes('jam berapa registrasi')) {
    return `${headerIntro}Pintu registrasi hadir di Pos Kesekretariatan dibuka mulai pukul **06.30 WIB / 07.00 WIs**.
- Pos Kesekretariatan Putra: Sebelah barat jalan luar Gerbang Bola Dunia.
- Pos Kesekretariatan Putri: Sebelah timur jalan luar Gerbang Bola Dunia.`;
  }

  // 14. LARANGAN SHOHIBUL HAJAT
  if (q.includes('larangan') || q.includes('aturan shohibul hajat')) {
    return `${headerIntro}Berikut **10 Poin Larangan Shohibul Hajat**:
1. Dilarang membawa / mengoperasikan alat elektronik selama acara berlangsung.
2. Dilarang membawa Buket.
3. Dilarang memakai kutek, hena, dan nail art / kuku palsu.
4. Dilarang membawa fotografer dari luar (mengganggu fotografer resmi).
5. Dilarang menemui walisantri saat acara berlangsung (walisantri dilarang masuk area shohibul hajat).
6. Dilarang menyambang melebihi batas waktu (18.00 WIs).
7. Dilarang mengikuti sambangan teman.
8. Dilarang sambangan di seluruh area santri putra / selain tempat yang disediakan.
9. Dilarang pulang ke pondok timur bersama penyambang.
10. Dilarang membawa HP di luar area sambangan.`;
  }

  // 15. SISA KUOTA TAMBAHAN (LIVE SUPABASE)
  const isSisaKuotaQuery =
    q.includes('sisa kuota') ||
    q.includes('kuota sisa') ||
    q.includes('sisa pagu') ||
    q.includes('pagu sisa') ||
    (q.includes('sisa') && (q.includes('kuota') || q.includes('kursi') || q.includes('pagu'))) ||
    ((q.includes('kuota') || q.includes('kursi')) && (q.includes('tersedia') || q.includes('tinggal berapa') || q.includes('masih ada berapa')));

  if (isSisaKuotaQuery) {
    const metrics = await getKuotaTambahanMetricsLive();
    return `${headerIntro}Saat ini, sisa kuota tambahan yang tersedia di sistem adalah **${metrics.sisa} kursi** dari total pagu ${metrics.total} kursi (terjual: ${metrics.terjual} kursi).`;
  }

  // 16. KUOTA TAMBAHAN & HARGA
  if ((q.includes('kuota tambahan') || q.includes('harga kuota') || q.includes('beli kuota')) && !q.includes('sisa')) {
    return `${headerIntro}Harga **Kuota Tambahan Walisantri**: **Rp 75.000 per kursi** (pagu total 300 kursi). Pembayaran via BRI 320701010266508 a.n. Ahmad Chamdan Yuwafin.`;
  }

  // 17. LIVE QUERIES FROM DATABASE SUPABASE
  if (q.includes('total sh') || q.includes('shohibul hajat terdaftar') || q.includes('total shohibul hajat')) {
    try {
      const { count } = await supabase.from('peserta_santri').select('*', { count: 'exact', head: true });
      const shText = count && count > 0 ? `${count} keluarga santri` : 'Belum ada data di sistem';
      return `${headerIntro}Total Shohibul Hajat yang terdaftar di database Supabase saat ini: **${shText}**.`;
    } catch {
      return `${headerIntro}Total Shohibul Hajat yang terdaftar di database Supabase saat ini: **Belum ada data di sistem**.`;
    }
  }

  if (q.includes('total tamu') || q.includes('tamu undangan terdaftar')) {
    try {
      const { count } = await supabase.from('tamu_undangan').select('*', { count: 'exact', head: true });
      const tamuText = count && count > 0 ? `${count} tamu undangan` : 'Belum ada data di sistem';
      return `${headerIntro}Total Tamu Undangan yang terdaftar di database Supabase saat ini: **${tamuText}**.`;
    } catch {
      return `${headerIntro}Total Tamu Undangan yang terdaftar di database Supabase saat ini: **Belum ada data di sistem**.`;
    }
  }

  if (q.includes('persen kehadiran') || q.includes('persentase kehadiran')) {
    try {
      const ws = await getWaliSantriMetrics();
      const tm = await getTamuUndanganMetrics();
      const totHadir = ws.totalHadir + tm.totalHadir;
      const totKuota = ws.totalKuota + tm.totalKuota;
      const pct = totKuota > 0 ? Math.round((totHadir / totKuota) * 100) : 0;
      return `${headerIntro}Statistik Kehadiran Realtime:
- **Wali Santri**: ${ws.totalHadir} dari ${ws.totalKuota} kuota (${ws.persenHadir}%)
- **Tamu Undangan**: ${tm.totalHadir} dari ${tm.totalKuota} kuota (${tm.persenHadir}%)
- **Total Keseluruhan**: ${totHadir} dari ${totKuota} kuota (**${pct}%**).`;
    } catch {
      return `${headerIntro}Statistik Kehadiran Realtime saat ini belum ada data presensi yang tercatat.`;
    }
  }

  // 17. LOKASI DAN WAKTU UTAMA ACARA
  if (q.includes('kapan acara') || q.includes('tanggal acara') || q.includes('kapan haflah')) {
    return `${headerIntro}Acara Haul & Haflah P3TQ dan MHMTQ dilaksanakan pada **Sabtu, 24 Rajab 1448 H / 02 Januari 2027 M**.`;
  }

  if (q.includes('dimana acara') || q.includes('lokasi acara')) {
    return `${headerIntro}Acara dilaksanakan di **Aula Al-Muktamar Pondok Pesantren Lirboyo Kediri**, Jl. HM. Winarto, Campurejo, Mojoroto, Kota Kediri.`;
  }

  if (q.includes('berapa panitia')) {
    return `${headerIntro}Total Panitia Haul & Haflah 2027 berjumlah **200 orang** (15 Dewan Penasehat, 68 Dewan Pembimbing, 117 Seluruh Panitia).`;
  }

  // Default Fallback
  return `${headerIntro}Wonten ingkang saget dibantu Us? Silakan sampaikan pertanyaan seputar pelaksanaan Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M., Usth. Halwaa siap membantu dengan senang hati! 😊`;
}

export function generateLocalSmartResponse(userQuery: string, isFirstTurn: boolean = true, role: string = 'PANITIA'): string {
  return generateLocalSmartResponseSync(userQuery, isFirstTurn, role);
}

export function generateLocalSmartResponseSync(userQuery: string, isFirstTurn: boolean = true, role: string = 'PANITIA'): string {
  const q = userQuery.toLowerCase().trim();

  // 0. FITUR MOTIVASI KONTEKSTUAL
  const motivasiIntent = detectMotivasiIntent(q);
  if (motivasiIntent) {
    if (motivasiIntent === 'identitas') {
      const motivasi = getRandomMotivasi('identitas');
      return `Us, kamu adalah bagian dari keluarga besar Haul & Haflah P3TQ & MHMTQ 1448 H. / 2027 M.\n\n${motivasi}\n\nAda yang bisa saya bantu, Us?`;
    }
    if (motivasiIntent === 'lelah') {
      const motivasi = getRandomMotivasi('lelah');
      return `${motivasi}\n\nKalau ada yang bisa saya bantu, tinggal bilang ya, Us.`;
    }
    if (motivasiIntent === 'selesai') {
      const motivasi = getRandomMotivasi('selesai');
      return `${motivasi}\n\nNikmati rasa lega ini, kamu pantas merayakannya.`;
    }
    if (motivasiIntent === 'tugas_berat') {
      const motivasi = getRandomMotivasi('tugas_berat');
      return `${motivasi}\n\nAda lagi yang bisa saya bantu, Us?`;
    }
    if (motivasiIntent === 'syukur') {
      const motivasi = getRandomMotivasi('syukur');
      return `${motivasi}\n\nAda lagi yang bisa saya bantu, Us?`;
    }
    if (motivasiIntent === 'harapan') {
      const motivasi = getRandomMotivasi('harapan');
      return `${motivasi}\n\nAda yang bisa saya bantu, Us?`;
    }
    if (motivasiIntent === 'sedih') {
      const motivasi = getRandomMotivasi('sedih');
      return `${motivasi}\n\nKalau ada yang bisa saya bantu, tinggal bilang ya, Us.`;
    }
    if (motivasiIntent === 'tertekan') {
      const motivasi = getRandomMotivasi('tertekan');
      return `${motivasi}\n\nAda lagi yang bisa saya bantu, Us?`;
    }
    if (motivasiIntent === 'dedikasi') {
      const motivasi = getRandomMotivasi('dedikasi');
      return `${motivasi}\n\nAda yang bisa saya bantu, Us?`;
    }
    if (motivasiIntent === 'nilai_diri') {
      const motivasi = getRandomMotivasi('nilai_diri');
      return `${motivasi}\n\nAda lagi yang bisa saya bantu, Us?`;
    }
  }

  // 0. IDENTITAS & SMALL TALK
  if (
    q.includes('siapa kamu') ||
    q.includes('kamu siapa') ||
    q.includes('siapa anda') ||
    q.includes('kamu ai apa') ||
    q.includes('kamu itu apa') ||
    q.includes('siapa yang buat kamu') ||
    q.includes('kamu bisa apa') ||
    q.includes('siapa halwaa') ||
    q.includes('siapa usth halwaa') ||
    q.includes('siapakah kamu') ||
    q.includes('siapakah anda')
  ) {
    return "Saya Usth. Halwaa, Asisten Cerdas Resmi Haul & Haflah Akhirussanah P3TQ & MHMTQ 1448 H. / 2027 M.\n\nAda yang bisa saya bantu, Us?";
  }

  if (
    q === 'assalamualaikum' ||
    q === "assalamu'alaikum" ||
    q === "assalamu'alaikum wr wb" ||
    q === "assalamu'alaikum wr. wb." ||
    q === "assalamu'alaikum warahmatullahi wabarakatuh" ||
    q === "assalamualaikum us" ||
    q === "assalamu'alaikum us" ||
    q === "assalamualaikum usth" ||
    q === "assalamu'alaikum usth"
  ) {
    return "Waalaikumussalam warahmatullahi wabarakatuh Us. Ada yang bisa saya bantu?";
  }

  if (
    q === 'halo' ||
    q === 'halo us' ||
    q === 'halo usth' ||
    q === 'hai' ||
    q === 'hai us' ||
    q === 'hai usth' ||
    q === 'p' ||
    q === 'tes'
  ) {
    return "Halo Us. Ada yang bisa saya bantu?";
  }

  if (
    q.includes('terima kasih') ||
    q.includes('makasih') ||
    q.includes('syukron') ||
    q.includes('matur nuwun')
  ) {
    return "Sama-sama Us. Semoga bermanfaat.";
  }

  const greetingPrefix = isFirstTurn ? "Wa'alaikum Salam Wr. Wb.! 🙏✨\n\n" : "";
  const headerIntro = `${greetingPrefix}`;

  // SALDO
  if (q.includes('saldo')) {
    return `${headerIntro}Saldo ini masih bersifat anggaran (perencanaan), bukan realisasi. Untuk laporan realisasi final, silakan tunggu LPJ resmi panitia.

- **Anggaran Pemasukan**: Rp 548.552.000 (masih perencanaan, bukan realisasi)
- **Anggaran Pengeluaran**: Rp 547.450.000 (masih perencanaan, bukan realisasi)

Ada lagi info kepanitiaan yang bisa saya bantu, Us?`;
  }

  // PEMASUKAN
  if (q.includes('pemasukan') || q.includes('total pemasukan')) {
    return `${headerIntro}Us, berikut Anggaran Pemasukan Panitia Haul & Haflah 2027:
- **Anggaran Pemasukan**: **Rp 548.552.000** (masih perencanaan, bukan realisasi; berasal dari 8 sumber pemasukan shohibul hajat, santri, subsidi lembaga, dan saldo tahun lalu).

Ada lagi info kepanitiaan yang bisa saya bantu, Us?`;
  }

  // PENGELUARAN
  if (q.includes('pengeluaran') || q.includes('total pengeluaran')) {
    return `${headerIntro}Us, berikut Anggaran Pengeluaran Panitia Haul & Haflah 2027:
- **Anggaran Pengeluaran**: **Rp 547.450.000** (masih perencanaan, bukan realisasi; terbagi dalam 12 pos belanja kepanitiaan).

Ada lagi info kepanitiaan yang bisa saya bantu, Us?`;
  }

  // BIAYA
  if (q.includes('biaya') || q.includes('tarif') || q.includes('bayar')) {
    if (q.includes('bil ghoib') || q.includes('bilghoib')) {
      return `${headerIntro}Biaya Shohibul Hajat **Takhtiman Bil Ghoibi** adalah **Rp 2.210.000 per orang**. (Biaya ini merupakan subsidi Shohibul Hajat ke pondok).`;
    }
    if (q.includes('bin nadzori') || q.includes('binnadzori')) {
      return `${headerIntro}Biaya Shohibul Hajat **Takhtiman Bin Nadzori** adalah **Rp 670.000 per orang**. (Biaya ini merupakan subsidi Shohibul Hajat ke pondok).`;
    }
    if (q.includes('tamatan')) {
      return `${headerIntro}Biaya Shohibul Hajat **Tamatan Aliyah** adalah **Rp 580.000 per orang**. (Biaya ini merupakan subsidi Shohibul Hajat ke pondok).`;
    }
    if (q.includes('p3tq') || q.includes('nduduk') || (q.includes('santri') && !q.includes('wali'))) {
      return `${headerIntro}Biaya Santri:
- **Santri P3TQ**: Rp 30.000 per santri
- **Santri Nduduk**: Rp 30.000 per santri`;
    }
    if (q.includes('tamu') || q.includes('undangan')) {
      return `${headerIntro}Tamu undangan **TIDAK dikenakan biaya masuk (GRATIS)**. Yang membayar biaya (subsidi) hanya Shohibul Hajat. Jika Us sebagai tamu undangan, tidak ada biaya apa pun yang harus dibayar.`;
    }
  }

  if (q.includes('tamu') && q.includes('bayar')) {
    return `${headerIntro}Tamu undangan **TIDAK dikenakan biaya masuk (GRATIS)**. Yang membayar biaya (subsidi) hanya Shohibul Hajat ke pondok.`;
  }

  // SEKSI KETUA II
  if (q.includes('ketua ii') || q.includes('ketua 2') || q.includes('di bawah ketua ii') || q.includes('dibawah ketua ii') || q.includes('dibawah ketua 2')) {
    return `${headerIntro}Us, berdasarkan Garis Koordinasi Panitia Haflah 2027, seksi di bawah **Ketua II (Zakia)** adalah:
1. **Seksi Akomodasi**
2. **Seksi Desain Grafis**
3. **Seksi PULP (Pembantu Umum Listrik & Perairan)**
4. **Seksi Berkatan**

Ada lagi info kepanitiaan yang bisa saya bantu, Us?`;
  }

  // PROTOKOLER
  if (q.includes('protokoler') || q.includes('siapa protokoler')) {
    return `${headerIntro}Berikut susunan personalia **Seksi Protokoler**:
- **Kasi Pa**: **Bapak Abu Yazid Al Bustomi\***
- **Wakasi Pa**: **Bapak Abhaa Muhammad Kafaa Bihi\*\***
- **Kasi Pi**: **Evi Inarotus Soimah\***
- **Wakasi Pi**: **Jihan Roihana\*\***
- **Anggota Pa**: Bpk Sufyan Tsauri, Bpk Taufiq Hidayah, Bpk Lukman Ainul Yaqin.
- **Garis Koordinasi**: Berada langsung di bawah **Ketua Umum (Sinta Maelani)**.`;
  }

  // KONSUMSI
  if (q.includes('ketua konsumsi') || (q.includes('konsumsi') && (q.includes('kasi') || q.includes('ketua')))) {
    return `${headerIntro}Berikut susunan pimpinan **Seksi Konsumsi**:
- **Kasi Pa**: **Bapak Ahmad Rizal 'Abidin\***
- **Wakasi Pa**: **Bapak Muhammad Taufiqurrohman\*\***
- **Kasi Pi**: **Elvi Aniqotus Zakiyah\***
- **Wakasi Pi**: **Lailatul Munawaroh\*\***`;
  }

  // KEAMANAN
  if (q.includes('ketua keamanan') || (q.includes('keamanan') && (q.includes('kasi') || q.includes('ketua')))) {
    return `${headerIntro}Berikut susunan pimpinan **Seksi Keamanan**:
- **Kasi Pa**: **Bapak Adi Susilo\***
- **Wakasi Pa**: **Bapak Reza Fadhilul 'Ulum\*\***
- **Kasi Pi**: **Qoribatul Maqbulah\***
- **Wakasi Pi**: **Fitrotin Yulia Arifin\*\***`;
  }

  // SEKRETARIS & KETUA UMUM
  if (q.includes('sekretaris umum')) {
    return `${headerIntro}**Sekretaris Umum** Panitia Haul & Haflah 2027 adalah **Refi Al Izzatul Kholifah**.`;
  }
  if (q.includes('ketua umum')) {
    return `${headerIntro}**Ketua Umum** Panitia Haul & Haflah 2027 adalah **Sinta Maelani**.`;
  }

  // GLADI
  if (q.includes('gladi kotor') || q.includes('gladikotor')) {
    return `${headerIntro}Jadwal **Gladi Kotor**: **Sabtu, 12 Desember 2026 (03 Rajab 1448 H)** di Aula Al-Muktamar Lirboyo. *(Pra-Gladikotor: Selasa, 17 November 2026)*.`;
  }
  if (q.includes('gladi bersih') || q.includes('gladibersih')) {
    return `${headerIntro}Jadwal **Gladi Bersih**: **Rabu, 16 Desember 2026 (07 Rajab 1448 H)** di Aula Al-Muktamar Lirboyo.`;
  }

  // SAMBANGAN
  if (q.includes('sambangan') || q.includes('cara sambang')) {
    return `${headerIntro}Berikut ketentuan **Sambangan Shohibul Hajat**:
- **Lokasi Sambangan**:
  * **Halaman Al-Khodijah**: Santri Takhtiman Bil Ghoibi & Bin Nadzori
  * **Gedung Rusunawa Baru**: Siswi Tamatan Aliyah
- **Waktu**: Setelah acara selesai s/d **pukul 18.00 WIs**.
- **Kewajiban**:
  1. Penyambang/penjemput adalah mahrom shohibul hajat.
  2. Wajib mendaftarkan diri di depan Gerbang Bola Dunia membawa KKS / fotokopi KK & KTP.`;
  }

  // REGISTRASI
  if (q.includes('registrasi buka') || q.includes('jam registrasi') || q.includes('jam berapa registrasi')) {
    return `${headerIntro}Pintu registrasi hadir di Pos Kesekretariatan dibuka mulai pukul **06.30 WIB / 07.00 WIs**.
- Pos Kesekretariatan Putra: Sebelah barat jalan luar Gerbang Bola Dunia.
- Pos Kesekretariatan Putri: Sebelah timur jalan luar Gerbang Bola Dunia.`;
  }

  // LARANGAN
  if (q.includes('larangan') || q.includes('aturan shohibul hajat')) {
    return `${headerIntro}Berikut **10 Poin Larangan Shohibul Hajat**:
1. Dilarang membawa / mengoperasikan alat elektronik selama acara berlangsung.
2. Dilarang membawa Buket.
3. Dilarang memakai kutek, hena, dan nail art / kuku palsu.
4. Dilarang membawa fotografer dari luar (mengganggu fotografer resmi).
5. Dilarang menemui walisantri saat acara berlangsung (walisantri dilarang masuk area shohibul hajat).
6. Dilarang menyambang melebihi batas waktu (18.00 WIs).
7. Dilarang mengikuti sambangan teman.
8. Dilarang sambangan di seluruh area santri putra / selain tempat yang disediakan.
9. Dilarang pulang ke pondok timur bersama penyambang.
10. Dilarang membawa HP di luar area sambangan.`;
  }

  // SISA KUOTA TAMBAHAN
  const isSisaKuotaQuerySync =
    q.includes('sisa kuota') ||
    q.includes('kuota sisa') ||
    q.includes('sisa pagu') ||
    q.includes('pagu sisa') ||
    (q.includes('sisa') && (q.includes('kuota') || q.includes('kursi') || q.includes('pagu'))) ||
    ((q.includes('kuota') || q.includes('kursi')) && (q.includes('tersedia') || q.includes('tinggal berapa') || q.includes('masih ada berapa')));

  if (isSisaKuotaQuerySync) {
    // Fungsi sinkron tidak dapat query Supabase — jangan hardcode angka sisa kuota.
    return `${headerIntro}Mohon maaf Us, data sisa kuota tambahan sedang tidak dapat dimuat secara live. Silakan tanyakan kembali beberapa saat lagi atau cek langsung di halaman pembelian kuota. Total pagu kuota tambahan adalah 300 kursi.`;
  }

  // KUOTA TAMBAHAN & HARGA
  if ((q.includes('kuota tambahan') || q.includes('harga kuota') || q.includes('beli kuota')) && !q.includes('sisa')) {
    return `${headerIntro}Harga **Kuota Tambahan Walisantri**: **Rp 75.000 per kursi** (pagu total 300 kursi). Pembayaran via BRI 320701010266508 a.n. Ahmad Chamdan Yuwafin.`;
  }

  // KAPAN / DIMANA / PANITIA
  if (q.includes('kapan acara') || q.includes('tanggal acara') || q.includes('kapan haflah')) {
    return `${headerIntro}Acara Haul & Haflah P3TQ dan MHMTQ dilaksanakan pada **Sabtu, 24 Rajab 1448 H / 02 Januari 2027 M**.`;
  }

  if (q.includes('dimana acara') || q.includes('lokasi acara')) {
    return `${headerIntro}Acara dilaksanakan di **Aula Al-Muktamar Pondok Pesantren Lirboyo Kediri**, Jl. HM. Winarto, Campurejo, Mojoroto, Kota Kediri.`;
  }

  if (q.includes('berapa panitia')) {
    return `${headerIntro}Total Panitia Haul & Haflah 2027 berjumlah **200 orang** (15 Dewan Penasehat, 68 Dewan Pembimbing, 117 Seluruh Panitia).`;
  }

  return `${headerIntro}Wonten ingkang saget dibantu Us? Silakan sampaikan pertanyaan seputar pelaksanaan Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M., Usth. Halwaa siap membantu dengan senang hati! 😊`;
}

export function cleanReplyForSession(rawReply: string, isFirstTurn: boolean, userPrompt?: string, role: string = 'WALI'): string {
  let reply = rawReply.trim();

  if (userPrompt) {
    const rLower = reply.toLowerCase();
    if (
      rLower.includes('ringkasan agregat') ||
      rLower.includes('belum dipublikasikan secara rinci') ||
      rLower.includes('belum ditampilkan dalam ringkasan') ||
      rLower.includes('belum menyediakan tampilan nama individual') ||
      rLower.includes('tidak memiliki akses ke daftar nama') ||
      rLower.includes('nama individual belum') ||
      rLower.includes('nama lengkap belum')
    ) {
      return generateLocalSmartResponseSync(userPrompt, isFirstTurn, role);
    }
  }

  reply = reply.replace(
    /wonten\s+ingkang\s+saget\s+(usth\.\s*halwaa|us\s+ai|us)\s+bantu[,\s]+(kang\s+atau\s+mbak|usth\.|us)\?[^.\n]*([.\n]|$)/gi,
    'Wonten ingkang saget dibantu Us?\n'
  );
  reply = reply.replace(
    /wonten\s+ingkang\s+saget\s+(usth\.\s*halwaa|us\s+ai|us\s+)?bantu[,\s]+(kang\s+utawi\s+mbak|kang\s+atau\s+mbak|us)\?/gi,
    'Wonten ingkang saget dibantu Us?'
  );

  reply = reply.replace(/Kang\s+atau\s+Mbak/gi, 'Us');
  reply = reply.replace(/\b(Kang|Mbak)\b/g, 'Us');

  reply = reply.replace(
    /Madrasah\s+Hidayatul\s+Mubtadi-aat\s+Tahfizhil\s+Qur-an/gi,
    'Madrasah Hidayatul Mubtadi-aat Fittahfizhi wal Qiro-at'
  );
  reply = reply.replace(
    /Madrasah\s+Hidayatul\s+Mubtadi-aat\s+fittahfizhi\s+wal\s+Qiro-at/gi,
    'Madrasah Hidayatul Mubtadi-aat Fittahfizhi wal Qiro-at'
  );

  // SANITIZATION MANDATORI SALDO & NUMERIK HARDCODED
  reply = reply.replace(/1\.102\.000/g, '[SALDO_ANGGARAN]');
  if (reply.includes('[SALDO_ANGGARAN]')) {
    reply = reply.replace(/.*?\[SALDO_ANGGARAN\].*?/g, 'Saldo ini masih bersifat anggaran (perencanaan), bukan realisasi. Untuk laporan realisasi final, silakan tunggu LPJ resmi panitia.');
  }

  if (!isFirstTurn) {
    reply = reply
      .replace(
        /^(wa'?alaikum\s*salam(\s*wr\.?\s*wb\.?)?|waalaikumsalam(\s*wr\.?\s*wb\.?)?|assalamu'?alaikum(\s*wr\.?\s*wb\.?)?|assalamu'?alaikum\s*warahmatullahi\s*wabarakatuh)[!.,\s-]*/i,
        ''
      )
      .trim();
  } else {
    reply = reply
      .replace(
        /^(assalamu'?alaikum\s*warahmatullahi\s*wabarakatuh|assalamu'?alaikum\s*wr\.?\s*wb\.?|assalamu'?alaikum)[!.,\s-]*/i,
        "Wa'alaikum Salam Wr. Wb.! "
      )
      .trim();
  }

  reply = reply.replace(/Pondok\s+Pesantren\s+Lirboyo\s+Pusat/gi, '___LIRBOYO_PUSAT___');
  reply = reply.replace(
    /Haul\s*&\s*Haflah\s*(Ke-?V\s*)?(di\s+)?Pondok\s+Pesantren\s+Lirboyo(\s+Kediri)?/gi,
    'Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.'
  );
  reply = reply.replace(/___LIRBOYO_PUSAT___/g, 'Pondok Pesantren Lirboyo Pusat');

  // STRIP DOKUMEN FILE MENTIONS FROM USER RESPONSES
  reply = reply.replace(/\(USTH AL\)/gi, '');
  reply = reply.replace(/\(Koor 2( Bagian 2)?\)/gi, '');
  reply = reply.replace(/Berdasarkan USTH AL/gi, 'Berdasarkan dokumen resmi kepanitiaan');
  reply = reply.replace(/Menurut dokumen USTH AL/gi, 'Berdasarkan dokumen resmi kepanitiaan');
  reply = reply.replace(/Dari PDF USTH AL/gi, 'Berdasarkan dokumen resmi kepanitiaan');
  reply = reply.replace(/Sesuai Koor 2/gi, 'Sesuai dokumen resmi kepanitiaan');
  reply = reply.replace(/USTH AL/g, '');

  // ENFORCE USER SALUTATION TO 'Us' (hindari mengubah 'Usth. Halwaa')
  reply = reply.replace(/bantu[,\s]+Usth\./gi, 'bantu, Us');
  reply = reply.replace(/bantu[,\s]+Usth\?/gi, 'bantu, Us?');
  reply = reply.replace(/malih[,\s]+Usth\?/gi, 'malih Us?');
  reply = reply.replace(/malih[,\s]+Usth\./gi, 'malih Us.');
  reply = reply.replace(/Nggih[,\s]+Usth\./gi, 'Nggih, Us.');
  reply = reply.replace(/Nggih[,\s]+Usth,/gi, 'Nggih, Us,');
  reply = reply.replace(/Halo[,\s]+Usth\./gi, 'Halo Us.');
  reply = reply.replace(/Maaf[,\s]+Usth\./gi, 'Maaf Us.');
  reply = reply.replace(/Mohon maaf[,\s]+Usth\./gi, 'Mohon maaf Us.');
  reply = reply.replace(/Alhamdulillah[,\s]+Usth\./gi, 'Alhamdulillah Us.');
  reply = reply.replace(/Sama-sama[,\s]+Usth\./gi, 'Sama-sama Us.');
  reply = reply.replace(/,\s*Usth\./g, ', Us.');
  reply = reply.replace(/,\s*Usth\?/g, ', Us?');
  reply = reply.replace(/,\s*Usth!/g, ', Us!');
  reply = reply.replace(/,\s*Usth,/g, ', Us,');
  reply = reply.replace(/Usth\.\s+(Anda|kamu|panjenengan|njenengan)/gi, 'Us, $1');
  reply = reply.replace(/Usth\.\s*$/gm, 'Us.');
  reply = reply.replace(/(?<!saya\s|nama\s+saya\s|asisten\s+)Usth\.(?!\s*Halwaa)/gi, 'Us');
  reply = reply.replace(/\bUs\.\./g, 'Us.');
  reply = reply.replace(/\bUs\.\s*\./g, 'Us.');
  reply = reply.replace(/\.\.+/g, '.');

  // CLOSING PANJANG (> 100 kata): Tambahkan 1 motivasi singkat jika belum ada motivasi di dalam respon
  const wordCount = reply.split(/\s+/).length;
  const hasMotivasiAlready = Object.values(MOTIVASI).some((categoryList) =>
    categoryList.some((m) => reply.includes(m.slice(0, 20)))
  );

  if (wordCount > 100 && !hasMotivasiAlready && !reply.includes('http') && !reply.includes('/admin/')) {
    const closingMotivasi = getRandomMotivasi('energi_positif');
    reply += `\n\n${closingMotivasi}`;
  }

  return reply;
}

export function detectExpression(
  text: string,
  prompt: string,
  isFirstTurn: boolean
): 'wave' | 'happy' | 'wink' | 'welcome' | 'thinking' | 'polite' {
  const c = (text + ' ' + prompt).toLowerCase();

  if (
    isFirstTurn &&
    (c.includes("wa'alaikum") ||
      c.includes('salam') ||
      c.includes('perkenalkan') ||
      c.includes('halo') ||
      c.includes('hai'))
  ) {
    return 'wave';
  }

  if (
    c.includes('rekonsiliasi') ||
    c.includes('rekon') ||
    c.includes('formula') ||
    c.includes('rumus') ||
    c.includes('hp mati') ||
    c.includes('baterai') ||
    c.includes('salah scan') ||
    c.includes('kendala') ||
    c.includes('verifikasi') ||
    c.includes('sla') ||
    c.includes('mutasi') ||
    c.includes('75.000') ||
    c.includes('hitung') ||
    c.includes('langkah')
  ) {
    return 'thinking';
  }

  if (
    c.includes('alhamdulillah') ||
    c.includes('barakallah') ||
    c.includes('khadimatul') ||
    c.includes('bil ghoib') ||
    c.includes('30 juz') ||
    c.includes('wisudawati') ||
    c.includes('selamat') ||
    c.includes('panggung kehormatan') ||
    c.includes('emas') ||
    c.includes('berkah')
  ) {
    return 'happy';
  }

  if (
    c.includes('gerbang') ||
    c.includes('bola dunia') ||
    c.includes('sayap barat') ||
    c.includes('sayap timur') ||
    c.includes('denah') ||
    c.includes('lokasi') ||
    c.includes('aula muktamar') ||
    c.includes('parkir') ||
    c.includes('zonasi') ||
    c.includes('tata ruang')
  ) {
    return 'welcome';
  }

  if (
    c.includes('tips') ||
    c.includes('rekomendasi') ||
    c.includes('solusi') ||
    c.includes('trik') ||
    c.includes('saran') ||
    c.includes('penting:')
  ) {
    return 'wink';
  }

  return 'polite';
}
