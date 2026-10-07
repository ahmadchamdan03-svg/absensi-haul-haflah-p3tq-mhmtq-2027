import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/mock-data';
import { geminiPool } from '@/lib/gemini-pool';
import { supabase } from '@/lib/supabase';
import { getWaliSantriMetrics, getTamuUndanganMetrics } from '@/lib/dashboard-metrics';

const HAFLAH_KNOWLEDGE_SYSTEM_PROMPT = `
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
   - Rp 80.000 per kursi (pagu total 300 kursi).

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

function getGolonganUndangan(u: any): 'ISTIMEWA' | 'KEHORMATAN' | 'UMUM' {
  if (u.golongan) {
    if (u.golongan === 'ISTIMEWA' || u.golongan === 'UNDANGAN_ISTIMEWA') return 'ISTIMEWA';
    if (u.golongan === 'KEHORMATAN' || u.golongan === 'UNDANGAN_KEHORMATAN') return 'KEHORMATAN';
    if (u.golongan === 'UMUM' || u.golongan === 'UNDANGAN_UMUM') return 'UMUM';
  }
  const text = `${u.kategori || ''} ${u.nama || ''} ${u.instansi || ''}`.toLowerCase();
  if (
    text.includes('vvip') ||
    text.includes('bani') ||
    text.includes('bandar') ||
    text.includes('kunir') ||
    text.includes('istimewa')
  ) {
    return 'ISTIMEWA';
  }
  if (
    text.includes('masyayikh') ||
    text.includes('habaib') ||
    text.includes('pejabat') ||
    text.includes('forkopimda') ||
    text.includes('pengasuh') ||
    text.includes('tokoh') ||
    text.includes('kehormatan')
  ) {
    return 'KEHORMATAN';
  }
  return 'UMUM';
}

const CACHE_TTL = 30 * 60 * 1000;
const cacheTamu: { data: any[] | null; timestamp: number | null } = { data: null, timestamp: null };
const cacheSantri: { data: any[] | null; timestamp: number | null } = { data: null, timestamp: null };
const cachePresensi: { data: any[] | null; timestamp: number | null } = { data: null, timestamp: null };

async function getTamuUndanganLive() {
  try {
    const { data, error } = await supabase
      .from('tamu_undangan')
      .select(`
        kode, nama, nama_putra, nama_putri,
        kategori, sub_kategori, instansi, alamat,
        no_hp, kuota_terpakai, warna_tiket, jalur_masuk,
        status_konfirmasi, status_wa
      `)
      .like('kode', 'UND%')
      .not('kode', 'is', null);

    if (error) throw error;

    cacheTamu.data = data;
    cacheTamu.timestamp = Date.now();

    return {
      source: 'live' as const,
      data: data || [],
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    if (cacheTamu.data && cacheTamu.timestamp && Date.now() - cacheTamu.timestamp < CACHE_TTL) {
      return {
        source: 'cache' as const,
        data: cacheTamu.data,
        timestamp: new Date(cacheTamu.timestamp).toISOString(),
        disclaimer: true,
      };
    }
    return {
      source: 'unavailable' as const,
      data: null,
      message: 'Mohon maaf Us, sistem sedang tidak dapat mengakses database. Silakan coba beberapa saat lagi.',
    };
  }
}

async function getPesertaSantriLive() {
  try {
    const { data, error } = await supabase
      .from('peserta_santri')
      .select(`
        kode, nama_santri, nama_wali, kategori_utama, sub_kategori,
        kelas, kamar, alamat, no_hp,
        kuota_dasar, kuota_tambahan, kuota_terpakai,
        tiket_panggung_jatah, tiket_panggung_diberi,
        perkiraan_l, perkiraan_p,
        status_konfirmasi, warna_tiket, status_wa
      `);

    if (error) throw error;

    cacheSantri.data = data;
    cacheSantri.timestamp = Date.now();

    return {
      source: 'live' as const,
      data: data || [],
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    if (cacheSantri.data && cacheSantri.timestamp && Date.now() - cacheSantri.timestamp < CACHE_TTL) {
      return {
        source: 'cache' as const,
        data: cacheSantri.data,
        timestamp: new Date(cacheSantri.timestamp).toISOString(),
        disclaimer: true,
      };
    }
    return {
      source: 'unavailable' as const,
      data: null,
      message: 'Mohon maaf Us, sistem sedang tidak dapat mengakses database. Silakan coba beberapa saat lagi.',
    };
  }
}

async function getPresensiLive() {
  try {
    const { data, error } = await supabase
      .from('presensi_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) throw error;

    cachePresensi.data = data;
    cachePresensi.timestamp = Date.now();

    return {
      source: 'live' as const,
      data: data || [],
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    if (cachePresensi.data && cachePresensi.timestamp && Date.now() - cachePresensi.timestamp < CACHE_TTL) {
      return {
        source: 'cache' as const,
        data: cachePresensi.data,
        timestamp: new Date(cachePresensi.timestamp).toISOString(),
        disclaimer: true,
      };
    }
    return {
      source: 'unavailable' as const,
      data: null,
      message: 'Mohon maaf Us, sistem presensi sedang tidak dapat diakses.',
    };
  }
}

async function getSisaKuotaTambahanLive(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('pembelian_kuota')
      .select('jumlah_kuota, status')
      .in('status', ['DIVERIFIKASI', 'DITERIMA', 'SETUJU', 'VERIFIED']);

    if (error) throw error;
    const verifiedSum = (data || []).reduce((acc: number, item: any) => acc + Number(item.jumlah_kuota || 0), 0);
    return Math.max(0, 300 - verifiedSum);
  } catch (err) {
    return 300;
  }
}

async function getGuestCategoryCountsLive() {
  try {
    const { data: guests, error } = await supabase
      .from('tamu_undangan')
      .select('kategori, sub_kategori');

    if (error || !guests) return null;

    let total = guests.length;
    let vvip = 0;
    let vip = 0;
    let ids = 0;
    let kehormatan = 0;
    let penguji = 0;
    let asatidz = 0;
    let perwakilan = 0;

    for (const g of guests) {
      const kat = (g.kategori || '').toUpperCase();
      const sub = (g.sub_kategori || '').toUpperCase();
      const combined = `${kat} ${sub}`;

      if (combined.includes('VVIP')) vvip++;
      else if (combined.includes('VIP')) vip++;

      if (combined.includes('IDS')) ids++;
      if (combined.includes('KEHORMATAN')) kehormatan++;
      if (combined.includes('PENGUJI')) penguji++;
      if (combined.includes('ASATIDZ')) asatidz++;
      if (combined.includes('PERWAKILAN')) perwakilan++;
    }

    return { total, vvip, vip, ids, kehormatan, penguji, asatidz, perwakilan };
  } catch (err) {
    return null;
  }
}

function detectIntent(pertanyaan: string) {
  const q = pertanyaan.toLowerCase();
  return {
    tamu: /tamu|undangan|und\d|vvip|vip|kehormatan|umum|pengajar|asatidz/i.test(q),
    santri: /santri|wali|sh\d|bil.ghoib|bin.nadzori|tamatan/i.test(q),
    statistik: /berapa|jumlah|total|persen|%|statistik|kehadiran|hadir/i.test(q),
    kehadiran: /hadir|datang|dateng|absen|presensi/i.test(q),
    pembelian: /beli|kuota.tambahan|pembelian|transfer|bukti/i.test(q),
    nama: /(KH\.|Gus|Ning|Nyai|Ust\.|Hj\.|Bu Nyai)/i.test(q),
    denah: /denah|lokasi|posisi|prasmanan|panggung|parkir|sambangan/i.test(q),
    aturan: /aturan|larangan|boleh|tidak boleh|dilarang/i.test(q),
  };
}

async function getLiveDatabaseContextPrompt(userQuery: string = ''): Promise<string> {
  const [resTamu, resSantri, resPresensi, sisaKuota, guestCounts, wsMetrics, tamuMetrics] = await Promise.all([
    getTamuUndanganLive(),
    getPesertaSantriLive(),
    getPresensiLive(),
    getSisaKuotaTambahanLive(),
    getGuestCategoryCountsLive(),
    getWaliSantriMetrics().catch(() => null),
    getTamuUndanganMetrics().catch(() => null),
  ]);

  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });

  const tamuList = resTamu.data || [];
  const santriList = resSantri.data || [];

  const totalSHText = santriList.length > 0 ? `${santriList.length} keluarga santri` : 'Belum ada data di sistem';
  const totalTamuText = tamuList.length > 0 ? `${tamuList.length} tamu undangan` : 'Belum ada data di sistem';

  const vvipText = guestCounts?.vvip ? `${guestCounts.vvip} tamu` : 'Belum ada data di sistem';
  const vipText = guestCounts?.vip ? `${guestCounts.vip} tamu` : 'Belum ada data di sistem';
  const idsText = guestCounts?.ids ? `${guestCounts.ids} tamu` : 'Belum ada data di sistem';
  const kehormatanText = guestCounts?.kehormatan ? `${guestCounts.kehormatan} tamu` : 'Belum ada data di sistem';
  const pengujiText = guestCounts?.penguji ? `${guestCounts.penguji} orang` : 'Belum ada data di sistem';
  const asatidzText = guestCounts?.asatidz ? `${guestCounts.asatidz} orang` : 'Belum ada data di sistem';
  const perwakilanText = guestCounts?.perwakilan ? `${guestCounts.perwakilan} perwakilan` : 'Belum ada data di sistem';

  return `
=== DATA DARI DATABASE SUPABASE (LIVE & ACTUAL) ===
Timestamp: ${dateStr}, pukul ${timeStr} WIB

- TOTAL SHOHIBUL HAJAT TERDAFTAR (LIVE SUPA): ${totalSHText}
- TOTAL TAMU UNDANGAN TERDAFTAR (LIVE SUPA): ${totalTamuText}
- TAMU VVIP (LIVE SUPA): ${vvipText}
- TAMU VIP (LIVE SUPA): ${vipText}
- TAMU IDS (LIVE SUPA): ${idsText}
- TAMU KEHORMATAN (LIVE SUPA): ${kehormatanText}
- PENGUJI AL-QUR'AN (LIVE SUPA): ${pengujiText}
- ASATIDZ MHMTQ (LIVE SUPA): ${asatidzText}
- PERWAKILAN PONDOK (LIVE SUPA): ${perwakilanText}
- SISA KUOTA TAMBAHAN (LIVE SUPA): ${sisaKuota} kursi dari 300 pagu

--- STATISTIK KEHADIRAN (REALTIME) ---
- Wali Santri Hadir: ${wsMetrics?.totalHadir || 0} dari ${wsMetrics?.totalKuota || 0} kuota (${wsMetrics?.persenHadir || 0}%)
- Tamu Undangan Hadir: ${tamuMetrics?.totalHadir || 0} dari ${tamuMetrics?.totalKuota || 0} kuota (${tamuMetrics?.persenHadir || 0}%)
=== END DATA LIVE ===
`;
}

async function getLiveSupabaseGuestPrompt(userQuery: string = ''): Promise<string> {
  return getLiveDatabaseContextPrompt(userQuery);
}

interface PersonSearchResult {
  type: 'UNDANGAN' | 'SANTRI';
  name: string;
  code: string;
  roleOrInstansi: string;
  category: string;
  subCategory?: string;
  quotaUsed: number;
  quotaTotal: number;
  hasArrived: boolean;
  seating?: string;
  extraInfo?: string;
  phone?: string;
}

function searchPersonInEvent(userQuery: string): PersonSearchResult | null {
  const q = userQuery.toLowerCase();
  const qClean = q
    .replace(/[?!.,;:()]/g, ' ')
    .replace(/\b(apakah|sudah|hadir|datang|kehadiran|status|posisi|cek|tolong|mohon|info|tamu|khusus|kehormatan|istimewa|santri|wali|keluarga|rombongan|nomor|no|hp|telepon|kontak|wa)\b/g, ' ')
    .trim();

  const stopWords = new Set([
    'apakah', 'sudah', 'hadir', 'datang', 'kehadiran', 'status', 'posisi',
    'cek', 'tolong', 'mohon', 'info', 'tamu', 'khusus', 'kehormatan', 'istimewa',
    'santri', 'wali', 'keluarga', 'rombongan', 'dan', 'atau', 'yang', 'pada',
    'dari', 'kh', 'k.h.', 'kyai', 'kiai', 'nyai', 'gus', 'ning', 'ustadz',
    'ustadzah', 'habib', 'haji', 'hajah', 'hj', 'hj.', 'bapak', 'ibu', 'siapa', 'siapakah', 'ada', 'saja',
    'nomor', 'no', 'hp', 'telepon', 'kontak', 'wa'
  ]);

  const tokens = qClean
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3 && !stopWords.has(w));

  const allUndangan = store.getUndanganList();

  for (const und of allUndangan) {
    const nameLower = und.nama.toLowerCase();
    const instansiLower = (und.instansi || '').toLowerCase();
    const codeLower = und.kode.toLowerCase();

    const isMatchCode = codeLower === qClean || (und.kode && q.includes(codeLower));
    const isMatchDirectName = qClean.length >= 3 && (nameLower.includes(qClean) || qClean.includes(nameLower));
    const isMatchTokens = tokens.length >= 2 && tokens.every((tok) => nameLower.includes(tok) || instansiLower.includes(tok));
    const isMatchDistinctToken = tokens.length === 1 && tokens[0].length >= 4 && nameLower.includes(tokens[0]);

    if (isMatchCode || isMatchDirectName || isMatchTokens || isMatchDistinctToken) {
      const gol = getGolonganUndangan(und);
      return {
        type: 'UNDANGAN',
        name: und.nama,
        code: und.kode,
        roleOrInstansi: und.instansi || 'Tamu Undangan',
        category: gol === 'ISTIMEWA' ? 'Tamu Istimewa (VVIP & VIP)' : gol === 'KEHORMATAN' ? 'Tamu Kehormatan (Tamu Khusus)' : 'Tamu Undangan Umum',
        subCategory: und.kategori,
        quotaUsed: und.kuota.terpakai,
        quotaTotal: und.kuota.kuotaDasar + (und.kuota.kuotaTambahan || 0),
        hasArrived: und.kuota.terpakai > 0,
        phone: (und as any).noHp || (und as any).telepon || (und as any).hp || '0812-3456-7890 (Tersedia)',
        seating: gol === 'KEHORMATAN' || gol === 'ISTIMEWA'
          ? 'Baris Depan Kehormatan VIP Depan Panggung Sayap Barat Aula Muktamar'
          : 'Baris Tamu Undangan VIP Aula Muktamar',
      };
    }
  }

  const allKeluarga = store.getKeluargaList();
  for (const kel of allKeluarga) {
    const santri = kel.santri?.[0];
    const santriName = (santri?.nama || '').toLowerCase();
    const waliName = (kel.namaWali || '').toLowerCase();
    const codeLower = kel.kode.toLowerCase();

    const isMatchCode = codeLower === qClean || (kel.kode && q.includes(codeLower));
    const isMatchDirect = qClean.length >= 3 && (santriName.includes(qClean) || waliName.includes(qClean));
    const isMatchTokens = tokens.length >= 2 && tokens.every((tok) => santriName.includes(tok) || waliName.includes(tok));
    const isMatchDistinctToken = tokens.length === 1 && tokens[0].length >= 4 && (santriName.includes(tokens[0]) || waliName.includes(tokens[0]));

    if (isMatchCode || isMatchDirect || isMatchTokens || isMatchDistinctToken) {
      let katLabel = santri?.subKategori || santri?.kategoriUtama || 'Santri';
      if (santri?.kategoriUtama === 'BIL_GHOIB') katLabel = 'Bil Ghoib (Khadimatul Qur-an 30 Juz)';
      else if (santri?.kategoriUtama === 'BIN_NADZOR') katLabel = `Bin Nadzori (${santri.kelas})`;
      else if (santri?.kategoriUtama === 'TAMATAN') katLabel = `Tamatan Aliyah (${santri.subKategori})`;

      return {
        type: 'SANTRI',
        name: santri?.nama || kel.namaWali,
        code: kel.kode,
        roleOrInstansi: `Keluarga / Wali: ${kel.namaWali} (${kel.alamat})`,
        category: katLabel,
        subCategory: santri?.kelas || santri?.subKategori,
        quotaUsed: kel.kuota.terpakai,
        quotaTotal: kel.kuota.kuotaDasar + (kel.kuota.kuotaTambahan || 0),
        hasArrived: kel.kuota.terpakai > 0,
        phone: (kel as any).noHp || (kel as any).telepon || (kel as any).hp || '0857-1234-5678 (Tersedia)',
        extraInfo: kel.kuota.tiketPanggungDiberi ? 'Tiket Emas Panggung Kehormatan SUDAH Diserahkan di Meja Presensi' : undefined,
      };
    }
  }

  return null;
}

async function searchPersonInSupabase(userQuery: string): Promise<PersonSearchResult | null> {
  const q = userQuery.toLowerCase().trim();
  const namaMatch = userQuery.match(
    /(KH\.|Gus|Ning|Ust\.|Ustz\.|Bu Nyai|Hj\.|H\.|Drs\.|Dr\.|Prof\.)\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)/i
  );
  const namaQuery = namaMatch ? namaMatch[2].trim() : null;

  const qClean = q
    .replace(/[?!.,;:()]/g, ' ')
    .replace(/\b(apakah|sudah|hadir|datang|kehadiran|status|posisi|cek|tolong|mohon|info|tamu|khusus|kehormatan|istimewa|santri|wali|keluarga|rombongan|nomor|no|hp|telepon|kontak|wa)\b/g, ' ')
    .trim();

  const termToSearch = namaQuery || (qClean.length >= 2 ? qClean : null);
  if (!termToSearch) return null;

  try {
    const { data: guests } = await supabase
      .from('tamu_undangan')
      .select('*')
      .or(`kode.ilike.%${termToSearch}%,nama.ilike.%${termToSearch}%,nama_putra.ilike.%${termToSearch}%,nama_putri.ilike.%${termToSearch}%,instansi.ilike.%${termToSearch}%`)
      .limit(5);

    if (guests && guests.length > 0) {
      const g = guests[0];
      const kodeUpper = (g.kode || '').toUpperCase();
      const { data: pLog } = await supabase
        .from('presensi_log')
        .select('*')
        .eq('kode_qr', kodeUpper)
        .order('created_at', { ascending: false })
        .limit(1);

      const firstLog = pLog && pLog.length > 0 ? pLog[0] : null;
      const hasArrived = Boolean((g.kuota_terpakai && g.kuota_terpakai > 0) || firstLog);
      const namaFull = g.nama || [g.nama_putra, g.nama_putri].filter(Boolean).join(' & ') || 'Tamu Undangan';
      const gol = (g.kategori || g.sub_kategori || 'UMUM').toUpperCase();
      const jamHadir = firstLog ? new Date(firstLog.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) : null;

      return {
        type: 'UNDANGAN',
        name: namaFull,
        code: g.kode,
        roleOrInstansi: g.instansi || 'Tamu Undangan',
        category: gol,
        subCategory: g.sub_kategori,
        quotaUsed: g.kuota_terpakai || (hasArrived ? 1 : 0),
        quotaTotal: (g.nama_putra && String(g.nama_putra).trim() ? 1 : 0) + (g.nama_putri && String(g.nama_putri).trim() ? 1 : 0),
        hasArrived,
        phone: g.no_hp || 'Tersedia di database',
        seating: 'Baris Kehormatan VIP Depan Panggung Sayap Barat Aula Muktamar',
        extraInfo: firstLog ? `pada 02 Januari 2027 pukul ${jamHadir} melalui ${firstLog.jalur || g.jalur_masuk || 'Jalur VIP'}` : undefined,
      };
    } else if (namaMatch && namaQuery) {
      return {
        type: 'UNDANGAN',
        name: `${namaMatch[1]} ${namaQuery}`,
        code: 'NOT_FOUND',
        roleOrInstansi: 'Tidak Ditemukan',
        category: 'UNKNOWN',
        quotaUsed: 0,
        quotaTotal: 0,
        hasArrived: false,
        extraInfo: 'DATA_NOT_FOUND',
      };
    }

    const { data: santriList } = await supabase
      .from('peserta_santri')
      .select('*')
      .or(`kode_keluarga.ilike.%${termToSearch}%,nama_santri.ilike.%${termToSearch}%,nama_wali.ilike.%${termToSearch}%`);

    if (santriList && santriList.length > 0) {
      const s = santriList[0];
      const kodeUpper = (s.kode_keluarga || s.kode || '').toUpperCase();
      const { data: pLog } = await supabase
        .from('presensi_log')
        .select('*')
        .eq('kode_qr', kodeUpper)
        .order('created_at', { ascending: false })
        .limit(1);

      const hasArrived = Boolean(pLog && pLog.length > 0);
      const firstLog = pLog && pLog.length > 0 ? pLog[0] : null;

      return {
        type: 'SANTRI',
        name: s.nama_santri || s.nama_wali,
        code: s.kode_keluarga || s.kode,
        roleOrInstansi: `Keluarga / Wali: ${s.nama_wali} (${s.alamat || '-'})`,
        category: s.kategori || s.sub_kategori || 'Santri',
        quotaUsed: hasArrived && firstLog ? ((firstLog.jumlah_l || 0) + (firstLog.jumlah_p || 0)) : 0,
        quotaTotal: 2,
        hasArrived,
        phone: s.no_hp || 'Tersedia di database',
        extraInfo: firstLog ? `pada 02 Januari 2027 pukul ${new Date(firstLog.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} melalui ${firstLog.jalur || 'Gerbang'}` : undefined,
      };
    }
  } catch (e) {
    console.warn('Error in searchPersonInSupabase:', e);
  }

  return searchPersonInEvent(userQuery);
}

function isStatsQuery(prompt: string): boolean {
  const q = prompt.toLowerCase();
  const hasCountWord = q.includes('berapa') || q.includes('jumlah') || q.includes('prosentase') || q.includes('persentase') || q.includes('%') || q.includes('statistik') || q.includes('progress') || q.includes('okupansi');
  const hasAttendanceWord = q.includes('hadir') || q.includes('datang') || q.includes('kehadiran') || q.includes('presensi');

  if (hasCountWord && hasAttendanceWord) return true;
  if (q.includes('statistik') || q.includes('progress kehadiran') || q.includes('persentase kehadiran') || q.includes('prosentase kehadiran') || q.includes('berapa yang hadir') || q.includes('okupansi')) return true;

  return false;
}

async function getLiveAttendanceStatsChart() {
  let totalWaliKuota = 0;
  let totalTamuKuota = 0;
  let totalWaliHadir = 0;
  let totalTamuHadir = 0;
  let waliL = 0;
  let waliP = 0;
  let tamuL = 0;
  let tamuP = 0;
  let percentWaliRatio = 0;
  let percentTamuRatio = 0;

  try {
    const wsMetrics = await getWaliSantriMetrics();
    const tamuMetrics = await getTamuUndanganMetrics();

    totalWaliHadir = wsMetrics.totalHadir;
    totalWaliKuota = wsMetrics.totalKuota;
    waliL = wsMetrics.totalL;
    waliP = wsMetrics.totalP;
    percentWaliRatio = wsMetrics.persenHadir;

    totalTamuHadir = tamuMetrics.totalHadir;
    totalTamuKuota = tamuMetrics.totalKuota;
    tamuL = tamuMetrics.totalL;
    tamuP = tamuMetrics.totalP;
    percentTamuRatio = tamuMetrics.persenHadir;
  } catch (e) {
    const stats = store.getStatistikLive();
    totalWaliHadir = (stats.kategoriStats?.bilGhoib?.totalHadir || 0) + (stats.kategoriStats?.binNadzor?.totalHadir || 0) + (stats.kategoriStats?.tamatan?.totalHadir || 0);
    totalTamuHadir = stats.tamuUndanganStat?.totalHadir || 0;
    totalWaliKuota = stats.totalKuota - (stats.tamuUndanganStat?.totalKuota || 0);
    totalTamuKuota = stats.tamuUndanganStat?.totalKuota || 462;
    percentWaliRatio = totalWaliKuota > 0 ? Math.round((totalWaliHadir / totalWaliKuota) * 100) : 0;
    percentTamuRatio = totalTamuKuota > 0 ? Math.round((totalTamuHadir / totalTamuKuota) * 100) : 0;
    waliL = Math.round(totalWaliHadir * 0.5);
    waliP = totalWaliHadir - waliL;
    tamuL = totalTamuHadir;
    tamuP = 0;
  }

  const totalKuota = totalWaliKuota + totalTamuKuota;
  const totalHadir = totalWaliHadir + totalTamuHadir;
  const totalBelumHadir = Math.max(0, totalKuota - totalHadir);
  const percentHadirTotal = totalKuota > 0 ? Math.round((totalHadir / totalKuota) * 100) : 0;

  const waliBelum = Math.max(0, totalWaliKuota - totalWaliHadir);
  const tamuBelum = Math.max(0, totalTamuKuota - totalTamuHadir);

  return {
    chart: {
      type: 'dual_pie',
      title: 'KEHADIRAN HAFLAH 2027',
      wali: {
        title: 'WALI SANTRI',
        totalHadir: totalWaliHadir,
        totalKuota: totalWaliKuota,
        persenHadir: percentWaliRatio,
        totalL: waliL,
        totalP: waliP,
        belumHadir: waliBelum,
        color: '#8C6A47',
      },
      tamu: {
        title: 'TAMU UNDANGAN',
        totalHadir: totalTamuHadir,
        totalKuota: totalTamuKuota,
        persenHadir: percentTamuRatio,
        totalL: tamuL,
        totalP: tamuP,
        belumHadir: tamuBelum,
        color: '#D49B5B',
      },
      data: [
        { label: `Wali Santri (${totalWaliHadir})`, value: totalWaliHadir, percent: percentWaliRatio, color: '#8C6A47' },
        { label: `Tamu Undangan (${totalTamuHadir})`, value: totalTamuHadir, percent: percentTamuRatio, color: '#D49B5B' },
        { label: `Belum Hadir (${totalBelumHadir})`, value: totalBelumHadir, percent: Math.max(0, 100 - percentHadirTotal), color: '#E5E0D8' },
      ],
      summary: {
        totalWaliHadir,
        totalWaliKuota,
        totalTamuHadir,
        totalTamuKuota,
        totalHadir,
        totalKuota,
      },
    },
    textSummary: {
      totalWaliHadir,
      totalWaliKuota,
      percentWaliRatio,
      waliL,
      waliP,
      waliBelum,
      totalTamuHadir,
      totalTamuKuota,
      percentTamuRatio,
      tamuL,
      tamuP,
      tamuBelum,
      totalHadir,
      totalKuota,
      percentHadirTotal,
    },
  };
}

async function getLiveArrivedGuestsResponse(prompt: string, isFirstTurn: boolean = false): Promise<string> {
  const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
  const intro = isFirstTurn ? "Wa'alaikum Salam Wr. Wb.! 🙏✨\n\n" : "";

  try {
    const tamuMetrics = await getTamuUndanganMetrics();

    const [resLogs, resTamu] = await Promise.all([
      supabase.from('presensi_log').select('*').order('created_at', { ascending: false }),
      supabase.from('tamu_undangan').select('*').order('created_at', { ascending: false }),
    ]);

    const logs = resLogs.data || [];
    const tamuData = resTamu.data || [];

    const presensiSet = new Set(logs.map((l) => (l.kode_qr || '').toUpperCase()));

    const arrivedTamu = tamuData.filter(
      (t) => (t.kuota_terpakai || 0) > 0 || presensiSet.has((t.kode || '').toUpperCase())
    );

    if (arrivedTamu.length === 0 && tamuMetrics.totalHadir === 0) {
      return `${intro}Alhamdulillah Us, per 02 Januari 2027 pukul ${nowStr} WIB, belum ada Tamu Undangan yang tercatat presensi di gerbang masuk.\n\nTotal Tamu Undangan Terdaftar: **${tamuMetrics.totalKuota} tamu**.\nSisa **${tamuMetrics.totalKuota} tamu** masih dalam perjalanan / belum di-absen.\n\n[👉 Buka Live Dasbor](/admin/dasbor) · [👉 Data Peserta & Tamu](/admin/peserta)`;
    }

    const guestLines = arrivedTamu.map((t, idx) => {
      const log = logs.find((l) => (l.kode_qr || '').toUpperCase() === (t.kode || '').toUpperCase());
      const jam = log
        ? new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
        : 'Hari-H';
      const terpakai = (t.kuota_terpakai || 0) > 0 ? t.kuota_terpakai : (log ? (log.jumlah_l || 0) + (log.jumlah_p || 0) : 1);
      const totalK = (t.nama_putra && String(t.nama_putra).trim() ? 1 : 0) + (t.nama_putri && String(t.nama_putri).trim() ? 1 : 0);
      const instansiInfo = t.instansi || t.alamat || 'Tamu Undangan';
      const katInfo = t.kategori || t.sub_kategori || 'Tamu Kehormatan';

      return `${idx + 1}. **${t.nama || 'Tamu Undangan'}** (\`${t.kode}\`) - ${instansiInfo}\n   - **Kategori**: ${katInfo}\n   - **Status**: ✅ **HADIR** (pukul ${jam} WIB, ${terpakai}/${totalK} Kursi)`;
    });

    const totalTerdaftar = tamuMetrics.totalKuota;
    const totalHadirCount = tamuMetrics.totalHadir;
    const percentRatio = tamuMetrics.persenHadir;
    const sisa = Math.max(0, totalTerdaftar - totalHadirCount);

    return `${intro}Alhamdulillah Us, per 02 Januari 2027 pukul ${nowStr} WIB, tercatat **${arrivedTamu.length} Tamu Undangan** yang sudah hadir:\n\n${guestLines.join('\n\n')}\n\nTotal yang sudah hadir: **${totalHadirCount} tamu** dari **${totalTerdaftar} tamu terdaftar** (${percentRatio}%). Sisa **${sisa} tamu** yang belum tercatat hadir.\n\n[👉 Buka Live Dasbor](/admin/dasbor) · [👉 Data Peserta & Tamu](/admin/peserta)`;
  } catch (err: any) {
    return `${intro}Maaf Us, terjadi kendala saat query data tamu realtime dari database. Mohon cek langsung menu [👉 Live Dasbor](/admin/dasbor).`;
  }
}

async function getWaliSantriHadir() {
  try {
    const { data: presensi, error: err1 } = await supabase
      .from('presensi_log')
      .select('kode_qr, nama_peserta, jumlah_l, jumlah_p, jalur, created_at')
      .like('kode_qr', 'SH%')
      .order('created_at', { ascending: false });

    if (err1) throw err1;

    if (!presensi || presensi.length === 0) {
      return {
        source: 'live' as const,
        totalWaliHadir: 0,
        list: [],
        message: 'Belum ada wali santri yang tercatat hadir.',
      };
    }

    const kodes = Array.from(new Set(presensi.map((p) => p.kode_qr).filter(Boolean)));
    const { data: santriList } = await supabase
      .from('peserta_santri')
      .select('kode, kode_keluarga, nama_santri, nama_wali, kategori_utama, sub_kategori')
      .or(`kode.in.(${kodes.join(',')}),kode_keluarga.in.(${kodes.join(',')})`);

    const combined = presensi.map((p) => {
      const kUpper = (p.kode_qr || '').toUpperCase();
      const s = santriList?.find(
        (x: any) =>
          (x.kode || '').toUpperCase() === kUpper ||
          (x.kode_keluarga || '').toUpperCase() === kUpper
      );
      return {
        kode: p.kode_qr,
        namaSantri: s?.nama_santri || (s as any)?.nama || 'Santriwati',
        namaWali: s?.nama_wali || p.nama_peserta || 'Wali Santri',
        kategori: s?.sub_kategori || s?.kategori_utama || 'Reguler',
        jumlahL: p.jumlah_l || 0,
        jumlahP: p.jumlah_p || 0,
        jalur: p.jalur || 'REGULER',
        waktu: p.created_at,
      };
    });

    return {
      source: 'live' as const,
      totalWaliHadir: combined.length,
      list: combined,
    };
  } catch (err) {
    return {
      source: 'unavailable' as const,
      totalWaliHadir: 0,
      list: [],
      message: 'Sistem sedang tidak dapat mengakses data presensi log.',
    };
  }
}

async function getLiveArrivedWaliResponse(prompt: string, isFirstTurn: boolean = false): Promise<string> {
  const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
  const dateStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
  const intro = isFirstTurn ? "Wa'alaikum Salam Wr. Wb.! 🙏✨\n\n" : "";

  try {
    const res = await getWaliSantriHadir();
    const wsMetrics = await getWaliSantriMetrics().catch(() => null);

    const totalKuota = wsMetrics?.totalKuota || 6;
    const totalHadirCount = wsMetrics?.totalHadir || res.totalWaliHadir;

    if (res.list.length === 0 && totalHadirCount === 0) {
      return `${intro}Alhamdulillah Us, per ${dateStr} pukul ${nowStr} WIB, belum ada Wali Santri yang tercatat presensi di gerbang masuk.\n\nTotal Kuota Wali Santri: **${totalKuota} kursi**.\nSisa **${totalKuota} kursi** belum di-absen.\n\n[👉 Buka Live Dasbor](/admin/dasbor) · [👉 Data Peserta & Tamu](/admin/peserta)`;
    }

    const waliLines = res.list.map((w, idx) => {
      const jam = new Date(w.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
      const totalOrang = w.jumlahL + w.jumlahP;
      return `${idx + 1}. **Wali dari ${w.namaSantri}** (\`${w.kode}\`) - ${w.kategori}\n   - **Nama Wali**: ${w.namaWali}\n   - **Hadir dengan**: ${totalOrang} orang (Laki-laki: ${w.jumlahL}, Perempuan: ${w.jumlahP})\n   - **Jalur**: via ${w.jalur || 'Gerbang'}\n   - **Waktu**: pukul ${jam} WIB`;
    });

    const percentRatio = totalKuota > 0 ? Math.round((totalHadirCount / totalKuota) * 100) : 0;

    return `${intro}Alhamdulillah Us, per ${dateStr} pukul ${nowStr} WIB, tercatat **${res.list.length} wali santri** yang sudah hadir:\n\n${waliLines.join('\n\n')}\n\nTotal yang sudah hadir: **${totalHadirCount} wali santri**.\nTotal kuota wali santri: **${totalKuota} kursi**.\nPersentase: **${percentRatio}%** dari kuota.\n\n[👉 Buka Live Dasbor](/admin/dasbor) · [👉 Data Peserta & Tamu](/admin/peserta)`;
  } catch (err: any) {
    return `${intro}Maaf Us, terjadi kendala saat query data wali santri realtime dari database. Mohon cek langsung menu [👉 Live Dasbor](/admin/dasbor).`;
  }
}

async function generateLocalSmartResponseAsync(userQuery: string, isFirstTurn: boolean = true, role: string = 'PANITIA'): Promise<string> {
  const q = userQuery.toLowerCase().trim();

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

Wonten ingkang saget dibantu malih Us?`;
  }

  // 2. PEMASUKAN
  if (q.includes('pemasukan') || q.includes('total pemasukan')) {
    return `${headerIntro}Berdasarkan Anggaran Pemasukan Panitia Haul & Haflah 2027 (USTH AL):
- **Anggaran Pemasukan**: **Rp 548.552.000** (masih perencanaan, bukan realisasi; berasal dari 8 sumber pemasukan shohibul hajat, santri, subsidi lembaga, dan saldo tahun lalu).

Wonten ingkang saget dibantu malih Us?`;
  }

  // 3. PENGELUARAN
  if (q.includes('pengeluaran') || q.includes('total pengeluaran')) {
    return `${headerIntro}Berdasarkan Anggaran Pengeluaran Panitia Haul & Haflah 2027 (USTH AL):
- **Anggaran Pengeluaran**: **Rp 547.450.000** (masih perencanaan, bukan realisasi; terbagi dalam 12 pos belanja kepanitiaan).

Wonten ingkang saget dibantu malih Us?`;
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
    return `${headerIntro}Berdasarkan Garis Koordinasi Panitia Haflah 2027 (USTH AL), seksi di bawah **Ketua II (Zakia)** adalah:
1. **Seksi Akomodasi**
2. **Seksi Desain Grafis**
3. **Seksi PULP (Pembantu Umum Listrik & Perairan)**
4. **Seksi Berkatan**

Wonten ingkang saget dibantu malih Us?`;
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

  // 15. KUOTA TAMBAHAN
  if (q.includes('kuota tambahan') || q.includes('harga kuota tambahan')) {
    return `${headerIntro}Harga **Kuota Tambahan Walisantri**: **Rp 80.000 per kursi** (pagu total 300 kursi, maksimal 2 kursi per santri). Pembayaran via BRI 320701010266508 a.n. Ahmad Chamdan Yuwafin.`;
  }

  // 16. LIVE QUERIES FROM DATABASE SUPABASE
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

  if (q.includes('sisa kuota tambahan')) {
    const sisa = await getSisaKuotaTambahanLive();
    return `${headerIntro}Sisa kuota tambahan saat ini: **${sisa} kursi** dari total pagu 300 kursi.`;
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

function generateLocalSmartResponse(userQuery: string, isFirstTurn: boolean = true, role: string = 'PANITIA'): string {
  return generateLocalSmartResponseSync(userQuery, isFirstTurn, role);
}

function generateLocalSmartResponseSync(userQuery: string, isFirstTurn: boolean = true, role: string = 'PANITIA'): string {
  const q = userQuery.toLowerCase().trim();

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

Wonten ingkang saget dibantu malih Us?`;
  }

  // PEMASUKAN
  if (q.includes('pemasukan') || q.includes('total pemasukan')) {
    return `${headerIntro}Berdasarkan Anggaran Pemasukan Panitia Haul & Haflah 2027 (USTH AL):
- **Anggaran Pemasukan**: **Rp 548.552.000** (masih perencanaan, bukan realisasi; berasal dari 8 sumber pemasukan shohibul hajat, santri, subsidi lembaga, dan saldo tahun lalu).

Wonten ingkang saget dibantu malih Us?`;
  }

  // PENGELUARAN
  if (q.includes('pengeluaran') || q.includes('total pengeluaran')) {
    return `${headerIntro}Berdasarkan Anggaran Pengeluaran Panitia Haul & Haflah 2027 (USTH AL):
- **Anggaran Pengeluaran**: **Rp 547.450.000** (masih perencanaan, bukan realisasi; terbagi dalam 12 pos belanja kepanitiaan).

Wonten ingkang saget dibantu malih Us?`;
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
    return `${headerIntro}Berdasarkan Garis Koordinasi Panitia Haflah 2027 (USTH AL), seksi di bawah **Ketua II (Zakia)** adalah:
1. **Seksi Akomodasi**
2. **Seksi Desain Grafis**
3. **Seksi PULP (Pembantu Umum Listrik & Perairan)**
4. **Seksi Berkatan**

Wonten ingkang saget dibantu malih Us?`;
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

  // KUOTA TAMBAHAN
  if (q.includes('kuota tambahan') || q.includes('harga kuota tambahan')) {
    return `${headerIntro}Harga **Kuota Tambahan Walisantri**: **Rp 80.000 per kursi** (pagu total 300 kursi, maksimal 2 kursi per santri). Pembayaran via BRI 320701010266508 a.n. Ahmad Chamdan Yuwafin.`;
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

function cleanReplyForSession(rawReply: string, isFirstTurn: boolean, userPrompt?: string, role: string = 'WALI'): string {
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

  reply = reply.replace(/\.\.+/g, '.');

  return reply;
}

function detectExpression(
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
    c.includes('80.000') ||
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

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const { prompt, history, apiKey: clientApiKey, role, userRole } = body;
    const currentRole = role || userRole || "WALI";

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const userMessageCount = Array.isArray(history)
      ? history.filter((item: any) => item.role === 'user').length
      : 0;
    const isFirstTurn = userMessageCount === 0;

    const qLower = prompt.trim().toLowerCase().replace(/[.!?,]/g, '');
    const isGreetingPrompt =
      qLower === "assalamu'alaikum" ||
      qLower === "assalamu'alaikum us" ||
      qLower === 'assalamualaikum' ||
      qLower === 'assalamualaikum us' ||
      qLower === 'halo' ||
      qLower === 'halo us' ||
      qLower === 'hai' ||
      qLower === 'hai us' ||
      qLower === 'p' ||
      qLower === 'tes' ||
      qLower.includes('siapa kamu') ||
      qLower.includes('kamu siapa') ||
      qLower.includes('siapa anda') ||
      qLower.includes('kamu ai apa') ||
      qLower.includes('kamu itu apa') ||
      qLower.includes('siapa yang buat kamu') ||
      qLower.includes('kamu bisa apa') ||
      qLower.includes('siapa halwaa') ||
      qLower.includes('siapa usth halwaa') ||
      qLower.includes('terima kasih') ||
      qLower.includes('makasih');

    if (isStatsQuery(prompt)) {
      const stats = await getLiveAttendanceStatsChart();
      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
      const nowStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
      const { textSummary: ts } = stats;
      const replyText = `${isFirstTurn ? "Wa'alaikum Salam Wr. Wb.! 🙏✨\n\n" : ""}Alhamdulillah Us, per ${dateStr} pukul ${nowStr} WIB, statistik kehadiran Haul & Haflah 2027:

*WALI SANTRI*
• Hadir: ${ts.totalWaliHadir.toLocaleString('id-ID')} dari ${ts.totalWaliKuota.toLocaleString('id-ID')} kuota (${ts.percentWaliRatio}%)
• Laki-laki: ${ts.waliL.toLocaleString('id-ID')} | Perempuan: ${ts.waliP.toLocaleString('id-ID')}
• Belum hadir: ${ts.waliBelum.toLocaleString('id-ID')} kursi

*TAMU UNDANGAN*
• Hadir: ${ts.totalTamuHadir.toLocaleString('id-ID')} dari ${ts.totalTamuKuota.toLocaleString('id-ID')} kuota (${ts.percentTamuRatio}%)
• Laki-laki: ${ts.tamuL.toLocaleString('id-ID')} | Perempuan: ${ts.tamuP.toLocaleString('id-ID')}
• Belum hadir: ${ts.tamuBelum.toLocaleString('id-ID')} kursi

Total yang sudah hadir: **${ts.totalHadir.toLocaleString('id-ID')} orang** dari **${ts.totalKuota.toLocaleString('id-ID')} kuota** (${ts.percentHadirTotal}%). Semoga acara berjalan lancar hingga selesai.

[👉 Buka Live Dasbor](/admin/dasbor) · [👉 Data Peserta & Tamu](/admin/peserta)`;

      return NextResponse.json({
        reply: cleanReplyForSession(replyText, isFirstTurn, prompt),
        expression: 'happy',
        avatar: '/images/avatar/ustadzah-avatar-happy.png',
        source: 'supabase_live_stats',
        model: 'Usth. Halwaa Live Stats Engine',
        chart: stats.chart,
      });
    }

    const isAskingWhoArrived =
      (qLower.includes('tamu') || qLower.includes('undangan') || qLower.includes('masyayikh') || qLower.includes('penguji') || qLower.includes('vip')) &&
      !qLower.includes('wali') &&
      (qLower.includes('siapa') || qLower.includes('siapakah') || qLower.includes('daftar') || qLower.includes('sebutkan') || qLower.includes('mana') || qLower.includes('siapa saja')) &&
      (qLower.includes('hadir') || qLower.includes('datang') || qLower.includes('tiba') || qLower.includes('masuk') || qLower.includes('presensi'));

    if (isAskingWhoArrived) {
      const replyText = await getLiveArrivedGuestsResponse(prompt, isFirstTurn);
      const cleanReply = cleanReplyForSession(replyText, isFirstTurn, prompt);
      const expr = detectExpression(cleanReply, prompt, isFirstTurn);
      return NextResponse.json({
        reply: cleanReply,
        expression: expr,
        avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
        source: 'supabase_live_query',
        model: 'Usth. Halwaa Live Database Engine',
      });
    }

    const isAskingWaliArrived =
      (qLower.includes('wali') || qLower.includes('orang tua') || qLower.includes('pendamping')) &&
      (qLower.includes('siapa') || qLower.includes('siapakah') || qLower.includes('daftar') || qLower.includes('sebutkan') || qLower.includes('mana') || qLower.includes('siapa saja') || qLower.includes('yang sudah hadir')) &&
      (qLower.includes('hadir') || qLower.includes('datang') || qLower.includes('tiba') || qLower.includes('masuk') || qLower.includes('presensi'));

    if (isAskingWaliArrived) {
      const replyText = await getLiveArrivedWaliResponse(prompt, isFirstTurn);
      const cleanReply = cleanReplyForSession(replyText, isFirstTurn, prompt);
      const expr = detectExpression(cleanReply, prompt, isFirstTurn);
      return NextResponse.json({
        reply: cleanReply,
        expression: expr,
        avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
        source: 'supabase_live_query',
        model: 'Usth. Halwaa Live Database Engine',
      });
    }

    const personMatch = await searchPersonInSupabase(prompt);
    if (personMatch) {
      let detailText = '';
      if (personMatch.code === 'NOT_FOUND' || personMatch.extraInfo === 'DATA_NOT_FOUND') {
        detailText = `${isFirstTurn ? "Wa'alaikum Salam Wr. Wb.! 🙏✨\n\n" : ""}Maaf Us, data untuk **${personMatch.name}** belum tersedia di sistem. Mohon cek menu [Data Peserta & Tamu](/admin/peserta).`;
      } else if (personMatch.hasArrived) {
        detailText = `${isFirstTurn ? "Wa'alaikum Salam Wr. Wb.! 🙏✨\n\n" : ""}Alhamdulillah Us, **${personMatch.name}** (${personMatch.code}) tercatat sudah hadir ${personMatch.extraInfo ? personMatch.extraInfo : 'di lokasi acara'}. Beliau hadir ${personMatch.quotaUsed > 1 ? 'bersama ' + (personMatch.quotaUsed - 1) + ' pendamping' : 'dengan alokasi 1 kursi'}.`;
      } else {
        detailText = `${isFirstTurn ? "Wa'alaikum Salam Wr. Wb.! 🙏✨\n\n" : ""}Mohon maaf Us, sampai saat ini belum ada catatan kehadiran untuk **${personMatch.name}** (${personMatch.code}) di sistem presensi. Beliau mungkin belum datang atau belum di-absen oleh petugas gerbang.`;
      }

      const cleanReply = cleanReplyForSession(detailText, isFirstTurn, prompt);
      const expr = detectExpression(cleanReply, prompt, isFirstTurn);
      return NextResponse.json({
        reply: cleanReply,
        expression: expr,
        avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
        source: 'supabase_live_query',
        model: 'Usth. Halwaa Live Database Engine',
      });
    }

    const localSmartResult = await generateLocalSmartResponseAsync(prompt, isFirstTurn, currentRole);
    const isGenericFallback = localSmartResult.includes("Wonten ingkang saget dibantu Us? Silakan sampaikan pertanyaan seputar pelaksanaan Haul & Haflah");

    if (!isGenericFallback || isGreetingPrompt) {
      const cleanReply = cleanReplyForSession(localSmartResult, isFirstTurn, prompt);
      const expr = detectExpression(cleanReply, prompt, isFirstTurn);
      return NextResponse.json({
        reply: cleanReply,
        expression: expr,
        avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
        source: 'smart_knowledge_engine',
        model: isGreetingPrompt ? 'Usth. Halwaa Fast Response' : 'Usth. Halwaa Knowledge Engine (Realtime)',
      });
    }

    const sessionPromptDirective = isFirstTurn
      ? "\n\n[PANDUAN SESI: Ini adalah awal sesi obrolan. Jawab salam dengan \"Wa'alaikum Salam Wr. Wb.\". PENTING: Acara ini adalah \"Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.\", BUKAN acara Ponpes Lirboyo Pusat! DILARANG menyebut \"Haul & Haflah di Pondok Pesantren Lirboyo\". Jika menawarkan bantuan atau menyapa, gunakan \"Wonten ingkang saget dibantu Us?\".]"
      : "\n\n[PANDUAN SESI: Ini adalah percakapan lanjutan dalam sesi chat yang sedang berlangsung. PENTING: DILARANG MENJAWAB ATAU MENGULANG SALAM (\"Wa'alaikum Salam Wr. Wb.\" ataupun \"Assalamu'alaikum\"). Langsung jawab ke inti pertanyaan secara to-the-point dan santun. Sapa pengguna dengan \"Usth.\", bukan \"Kang\" atau \"Mbak\". Jika menawarkan bantuan, gunakan \"Wonten ingkang saget dibantu Us?\".]";

    const liveDataPrompt = await getLiveSupabaseGuestPrompt(prompt);
    const dynamicSystemPrompt = `${HAFLAH_KNOWLEDGE_SYSTEM_PROMPT}\n\n${liveDataPrompt}${sessionPromptDirective}

[PANDUAN KEPANITIAAN & DATA RESMI: Anda WAJIB memberikan nama-nama dan data aktual yang sudah tercantum lengkap di atas. DILARANG MENYEUTKAN SALDO AKHIR Rp 1.102.000 (Jawab: Saldo ini masih bersifat anggaran (perencanaan), bukan realisasi. Untuk laporan realisasi final, silakan tunggu LPJ resmi panitia). Total SH dan total Tamu Undangan selalu di-query LIVE dari Supabase. Selalu sebut 'Anggaran [pemasukan/pengeluaran]' dengan disclaimer '(masih perencanaan, bukan realisasi)'.]`;

    const candidateGeminiKeys = geminiPool.getCandidateKeys(clientApiKey).slice(0, 3);
    const candidateGeminiModels = geminiPool.getModelCandidates();
    const proKeyClean = process.env.GEMINI_PRO_API_KEY?.trim().replace(/^["']|["']$/g, '');

    if (candidateGeminiKeys.length > 0) {
      for (const currentGeminiKey of candidateGeminiKeys) {
        let keySucceeded = false;
        const isProKey = proKeyClean && currentGeminiKey === proKeyClean;
        const engineLabel = isProKey ? 'Gemini Pro (Primary)' : 'Gemini Pool';

        for (const currentModel of candidateGeminiModels) {
          try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${currentGeminiKey}`;

            const contents: any[] = [];
            if (Array.isArray(history) && history.length > 0) {
              for (const item of history.slice(-6)) {
                contents.push({
                  role: item.role === 'assistant' ? 'model' : 'user',
                  parts: [{ text: item.content }],
                });
              }
            }
            contents.push({
              role: 'user',
              parts: [{ text: prompt }],
            });

            const geminiRes = await fetch(geminiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': currentGeminiKey,
              },
              signal: AbortSignal.timeout(4000),
              body: JSON.stringify({
                system_instruction: {
                  parts: [{ text: dynamicSystemPrompt }],
                },
                contents,
                generationConfig: {
                  temperature: 0.35,
                  maxOutputTokens: 800,
                },
              }),
            });

            if (geminiRes.ok) {
              const geminiData = await geminiRes.json();
              const replyText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (replyText) {
                geminiPool.markSuccess(currentGeminiKey);
                keySucceeded = true;
                const cleanReply = cleanReplyForSession(replyText, isFirstTurn, prompt);
                const expr = detectExpression(cleanReply, prompt, isFirstTurn);
                const durationMs = Date.now() - startTime;

                return NextResponse.json({
                  reply: cleanReply,
                  expression: expr,
                  avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
                  source: 'gemini_api',
                  model: `${engineLabel} (${currentModel})`,
                  keyPreview: geminiPool.maskKey(currentGeminiKey),
                  responseTimeMs: durationMs,
                });
              }
            } else {
              geminiPool.markFailure(currentGeminiKey, geminiRes.status, geminiRes.status === 429 ? 60 : 30);
              break;
            }
          } catch (geminiError: any) {
            geminiPool.markFailure(currentGeminiKey, 500, 30);
            break;
          }
        }
        if (keySucceeded) break;
      }
    }

    const localReply = await generateLocalSmartResponseAsync(prompt, isFirstTurn, currentRole);
    const cleanReply = cleanReplyForSession(localReply, isFirstTurn, prompt);
    const expr = detectExpression(cleanReply, prompt, isFirstTurn);
    return NextResponse.json({
      reply: cleanReply,
      expression: expr,
      avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
      source: 'smart_knowledge_engine',
      model: 'Usth. Halwaa Knowledge Engine',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const summary = geminiPool.getPoolSummary();
  const models = geminiPool.getModelCandidates();
  return NextResponse.json({
    status: 'ok',
    totalConfiguredKeys: summary.length,
    activeKeys: summary.filter((s) => !s.isCoolingDown).length,
    coolingDownKeys: summary.filter((s) => s.isCoolingDown).length,
    candidateModels: models,
    pool: summary,
  });
}
