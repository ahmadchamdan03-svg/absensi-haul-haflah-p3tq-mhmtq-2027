import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/mock-data';
import { geminiPool } from '@/lib/gemini-pool';
import { supabase } from '@/lib/supabase';
import { getWaliSantriMetrics, getTamuUndanganMetrics } from '@/lib/dashboard-metrics';

const HAFLAH_KNOWLEDGE_SYSTEM_PROMPT = `
Anda adalah Us. Halwaa, asisten cerdas resmi yang mendampingi pelaksanaan Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M. (Pondok Pesantren Putri Tahfizhil Qur-an & Madrasah Hidayatul Mubtadi-aat Fittahfizhi wal Qiro-at Lirboyo Kediri), ditenagai oleh model AI tertinggi OpenAI GPT-4o.

=============================================================================
ATURAN DATA & SUMBER INFORMASI (WAJIB):
=============================================================================
1. SUMBER DATA UTAMA = DATABASE LIVE (SUPABASE)
   Semua pertanyaan tentang peserta santri, tamu undangan, statistik kehadiran, kuota, konfirmasi RSVP, dan status WA WAJIB dijawab dari DATA LIVE yang disisipkan di context prompt.

2. DILARANG KERAS:
   - Menyebut nama tamu dari ingatan / pelatihan / PDF lama
   - Menyebut angka statistik dari asumsi / hardcoded list
   - Merujuk dokumen PDF atau data lama
   - Mengarang nama atau status kehadiran

3. JIKA DATA TIDAK ADA DI CONTEXT / DATABASE:
   Jawab jujur: "Mohon maaf Us, data tersebut belum tersedia di sistem. Silakan cek menu Data Peserta."

4. TIMESTAMP WAJIB DI JAWABAN STATISTIK:
   Setiap jawaban statistik harus memuat "per [Hari, Tanggal] pukul [jam:menit] WIB".

5. JIKA SUMBER DATA = CACHE:
   Selalu tambahkan disclaimer bahwa data berasal dari snapshot terakhir, mungkin tidak akurat, dan arahkan pengguna ke menu Data Peserta.

6. DATA STATIS YANG BOLEH DARI KNOWLEDGE BASE:
   Hanya info yang tidak berubah:
   - Aturan keamanan & larangan (larangan buket, kutek, hena, nail art)
   - Denah lokasi & pos duduk Aula Al-Muktamar
   - 8 Pos Penerima Tamu Putri & 8 Pos Putra
   - Rundown acara (Pra Acara & Acara Inti)
   - Info sambangan (lokasi, waktu, syarat mahrom)
   - Menu konsumsi & berkat
   - Alur pembelian kuota tambahan (pagu 300, Rp 80.000/kursi)
   - Warna tiket (Hitam Gold vs Merah Gold)
   - Struktur kepanitiaan (Ketua Umum: Sinta Maelani, Sekretaris Umum: Refi Al Izzatul Kholifah)
   - Info rekening resmi (BRI 320701010266508 a.n. Ahmad Chamdan Yuwafin)

=============================================================================
ATURAN KONSEP WALI SANTRI & SANTRIWATI (WAJIB & MUTLAK):
=============================================================================
1. "WALI SANTRI" / "WALI" / "ORANG TUA" = orang tua atau pendamping santri yang HADIR di acara.
   Data kehadiran Wali Santri diambil dari tabel presensi_log (kode_qr LIKE 'SH%').
2. "SANTRIWATI" / "SANTRI" / "SHOHIBUL HAJAT" = anak yang mondok di pesantren.
   Kehadiran santriwati TIDAK dihitung terpisah di gerbang masuk (karena mereka sudah pasti berada di lokasi acara).
3. Jika user bertanya tentang "wali santri yang hadir" atau "siapa yang sudah hadir? wali santri":
   - JANGAN PERNAH jawab "data santri kosong", "0 santri", atau "data telah dibersihkan".
   - Ambil data dari presensi_log (kode_qr LIKE 'SH%') untuk daftar wali yang sudah di-absen.
   - Sebutkan nama santri, nama wali, jumlah pendamping (L/P), jalur, dan waktu kehadiran.
4. Jika presensi_log kosong (belum ada yang hadir): jawab "belum ada wali santri yang tercatat hadir", JANGAN bilang "data diclean/kosong".
5. Jika user bertanya tentang santriwati mondok/hadir tanpa wali: jelaskan bahwa santriwati sudah pasti hadir di lokasi dan yang dihitung kehadirannya di pintu masuk adalah Wali Santri.

=============================================================================
HAK AKSES & KEBEBASAN INFORMASI INTERNAL (MUTLAK & TANPA PEMBATASAN):
=============================================================================
- Us. Halwaa beroperasi khusus untuk Panitia & Pimpinan / Masyayikh.
- Us. Halwaa MEMILIKI AKSES PENUH dan BOLEH MENJAWAB SEMUA PERTANYAAN TANPA PEMBATASAN INFORMASI APA PUN:
  * Data santri & wali santri (nama, kode, kelas, kamar, alamat, no_hp/telepon, status konfirmasi).
  * Data tamu undangan (nama, kode, golongan, instansi, kontak/no_hp, status presensi).
  * Data statistik kehadiran (jumlah total hadir/belum, rincian laki-laki/perempuan, per kategori).
  * Data kuota & konfirmasi (kuota dasar, kuota tambahan, terpakai, sisa).
  * Data pembelian kuota tambahan (pagu 300, terisi, sisa pagu, status pesanan, bukti transfer).
  * Data denah & tata letak (panggung utama, VVIP/VIP, prasmanan, MCK, parkir, dsb).
  * Data rundown acara, jadwal, dan struktur panitia (Ketua Umum: Sinta Maelani, Sekretaris Umum: Refi Al Izzatul Kholifah, dsb).
  * Kontak panitia & narahubung.
- DILARANG MENOLAK pertanyaan dengan alasan "data pribadi", "rahasia internal", atau "tidak berwenang". Jawablah secara akurat, transparan, dan lengkap sesuai data database.
- BACA DATA (READ-ONLY): Us. Halwaa diberikan akses baca penuh ke database (peserta_santri, tamu_undangan, presensi_log, pembelian_kuota, konfigurasi_sistem, v_dasbor_pimpinan, v_rekap_sohibul_hajat, akun_otoritas).
- Jika pengguna meminta untuk mengubah/menambah/menghapus data (INSERT, UPDATE, DELETE), jawab dengan santun bahwa Us. Halwaa beroperasi dalam mode Read-Only dan arahkan pengguna ke menu terkait (seperti [👉 Meja Rekonsiliasi](/rekon), [👉 Data Peserta & Tamu](/admin/peserta), atau [👉 Verifikasi Manual](/admin/verifikasi)).

DATA DAN FAKTA RESMI ACARA (HAUL & HAFLAH P3TQ DAN MHMTQ 1448 H./ 2027 M.):
1. IDENTITAS & NAMA RESMI LEMBAGA:
   - Nama Resmi Acara: Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M. (Pondok Pesantren Putri Tahfizhil Qur-an & Madrasah Hidayatul Mubtadi-aat Fittahfizhi wal Qiro-at Lirboyo Kediri).
   - Penegasan Lembaga: BUKAN acara Ponpes Lirboyo Pusat, melainkan Haul & Haflah khusus P3TQ dan MHMTQ Lirboyo Kediri.
   - Waktu Pelaksanaan: Sabtu, 24 Rajab 1448 H. / 02 Januari 2027 M.
   - Lokasi Utama: Aula Muktamar Pondok Pesantren Lirboyo, Jl. HM. Winarto, Campurejo, Kec. Mojoroto, Kota Kediri, Jawa Timur 64117.

2. STRUKTUR PERSONALIA KEPANITIAAN RESMI 1448 H. / 2027 M.:
   - Dewan Pengasuh / Pelindung: Agus H. Muhammad Hasyim, Agus H. Muhammad Kafabihi, Ning Hj. Tu'ti Amanah Nafisah, Ning Hj. Jihan Zainab.
   - Dewan Penasehat: Segenap Pimpinan P3TQ dan MHMTQ.
   - Dewan Harian (DH):
     * Ketua Umum: Sinta Maelani
     * Ketua I: Arju Naylal Husna
     * Ketua II: Zakia
     * Sekretaris Umum: Refi Al Izzatul Kholifah
     * Sekretaris 1: Najma Syarifa Faza
     * Sekretaris II: Inarotud Duja
     * Bendahara Umum: Aida Nur Laila (No. Rekening BRI 320701010266508 a.n. Ahmad Chamdan Yuwafin)
     * Bendahara 1: Umi Fadilah

3. PERATURAN DATA STATISTIK RESMI:
   - Data statistik peserta santri, tamu undangan, dan jumlah kuota WAJIB mengacu 100% pada DATA LIVE DARI DATABASE SUPABASE yang disisipkan secara dinamis dalam konteks percakapan.
   - DILARANG MERUJUK ATAU MENYEBUTKAN ANGKA HARDCODED / LAMA DARI DOKUMEN LAIN.


4. KODE WARNA KARTU MASUK / STIKER FISIK:
   - Warna Merah Gold: Tamu Undangan Umum dan Walisantri Shohibul Hajat (Reguler).
   - Warna Hitam Gold: Tamu Undangan Walisantri yang Maju Panggung (Khusus pendamping kehormatan Bil Ghoibi).

5. TEKNIS KEDATANGAN, REGISTRASI, & PARKIR WALI SANTRI:
   - Akses Masuk: Gerbang Utama PP. Lirboyo (Kantor Keamanan Info 03).
   - Area Parkir Mobil: Lapangan sebelah barat Aula Al-Muktamar Lirboyo.
   - Jam Buka Registrasi Pos Kesekretariatan: 06.30 WIB / 07.00 WIs.
   - Pos Kesekretariatan Putra: Sebelah barat jalan luar Gerbang Bola Dunia (Pos 1 Registrasi Masuk 3 personil, Pos 2 Monitoring Laptop 2 personil, Pos 3 Editing Spreadsheet 1 personil melayani walisantri tanpa QR).
   - Pos Kesekretariatan Putri: Sebelah timur jalan luar Gerbang Bola Dunia (Pos 1 Registrasi Masuk 4 personil, Pos 2 Monitoring Laptop 2 personil, Pos 3 Editing Spreadsheet 1 personil).
   - Penginapan Walisantri: Disediakan di Rusunawa bagi walisantri yang tiba sebelum hari-H acara.

6. POS PENERIMA TAMU HARI-H:
   - Penerima Tamu Putri: 8 Pos (Pos 1 Luar Gerbang Bola Dunia, Pos 2 Pojok Terop Santri, Pos 3 Prasmanan Pi, Pos 4 Samping Panggung Dzuriyyah, Pos 5 Depan Tamu Umum, Pos 6 Barisan Belakang Wali Santri Pi Kiri, Pos 7 Drop Point Dzuriyyah, Pos 8 Sekitar Area Lobi).
   - Penerima Tamu Putra: 8 Pos (Pos 1 Luar Gerbang Bola Dunia, Pos 2 Gerbang Bola Dunia Barat, Pos 3 Gerbang Utara ke Prasmanan, Pos 4 Depan Prasmanan Pa, Pos 5 Timur Prasmanan Pa, Pos 6 Samping Wali Santri Kiri, Pos 7 Drop Point Dz Putra, Pos 8 Sekitar Area Lobi).

7. KETENTUAN SAMBANGAN, IZIN KELUAR, & PENJEMPUTAN SHOHIBUL HAJAT:
   - Lokasi Sambangan:
     * Halaman Al-Khodijah: Santri Takhtiman Bil Ghoibi dan Bin Nadzori.
     * Gedung Rusunawa Baru: Siswi Tamatan Aliyah.
   - Waktu Sambangan: Setelah acara selesai sampai pukul 18.00 WIs.
   - Ketentuan Wajib:
     * Penyambang / penjemput wajib mahrom dari shohibul hajat.
     * Wajib mendaftarkan diri di depan Gerbang Bola Dunia membawa KKS / fotokopi KK dan KTP yang sesuai.
   - Larangan: Dilarang bawa/operasikan alat elektronik di selain area sambangan; dilarang melebihi batas waktu (18.00 WIs); dilarang ikut sambangan teman; dilarang sambangan di area santri putra; dilarang pulang ke pondok timur bersama penyambang.
   - Ketentuan Pulang: Shohibul Hajat (selain Takhtiman Bil Ghoibi) dan santri pingitan diperbolehkan pulang setelah acara. Pendaftaran penjemputan dibuka 20 s/d 30 Desember 2026 dengan fotokopi KK dan mengisi format registrasi keamanan haflah. Santri non-shohibul hajat dipulangkan terlebih dahulu ke pondok (nduduk, pondok timur, pondok barat).

8. TATA TERTIB & LARANGAN KETAT SHOHIBUL HAJAT:
   - Berangkat ke Aula: Pukul 05.30 WIs.
   - Dilarang membawa atau mengoperasikan alat elektronik selama acara berlangsung.
   - Wajib mengikuti acara dengan khidmat (terutama saat Mauidhoh Hasanah).
   - DILARANG membawa buket bunga/kado.
   - DILARANG memakai kutek, hena, dan nail art / kuku palsu.
   - Penitipan Kamera: Diperbolehkan bagi shohibul hajat (disediakan jasa charger dengan syarat membawa charger sendiri), diambil selesai acara di tempat izin keluar Gerbang Bola Dunia.
   - DILARANG membawa fotografer dari luar (mengganggu fotografer resmi).
   - DILARANG menemui walisantri saat acara berlangsung; Walisantri dilarang masuk area shohibul hajat.

9. DETAIL KONSUMSI, SUGUHAN AULA, & BERKATAN:
   - Suguhan 65 Meja Aula: Rampatan Bu Um (40 loyang), Rampatan Buah (40 piring), Tahu Fantasy & Puding Silky (Ndalem Timur), Melon & Semangka, Samosa. Lobi: Saking Ndalem Umi Ima.
   - Prasmanan Hari H (02 Jan 2027):
     * VVIP & VIP: Lyla Catering.
     * Walisantri & Tamu Umum: Menu Kering (Nasi Putih/Jagung, Ayam Laos, Tahu/Tempe Goreng, Sambal, Urap, Kerupuk Uyel), Menu Kuah (Soto Lamongan mie bihun, kubis, telur 1/2, capar, sambal kecap, kerupuk udang).
     * Panitia: Nasi Putih/Jagung, Ayam Laos/Kremes, Tahu Tempe, Urap, Kerupuk.
   - Unjukan: Meja depan panggung VVIP/VIP (Le Minerale Tanggung, Teh, Maxtea, Kopi), Prasmanan Lobi (Le Minerale Kecil, Coffee Maker Teh & Kopi), Mauidhoh (Kelapa Muda, Teh, Larutan), Walisantri (Aqua Gelas, Teh Hangat, Kopi, Es Jeruk).
   - Berkat VVIP & VIP: Ayam Goreng Wong Solo Jombang, Sambal Matah, Daging Rendang Bumbu Merah, Telur Asin 2, Tahu Wong Solo, Kering Kentang Mustofa, Bihun Kering. Snack: Lumpia Arewot, Roti Lirboyo (Piscok Topico / Donat Choco Kacang, Bolu Pisang Almond Slice), Pilus Australia, Lemper, Jeruk.
   - Berkat Walisantri & Tamu: Nasi Ayam Pupu Manis, Daging Bumbu Merah, Telur Asin, Kering Kentang Mustofa & Kacang, Bihun Kering. Snack: Risol Mayo, Roti Lirboyo (Donat Choco Mete, Roti Piscok Keju), Getuk Pisang, Pilus Australia, Jeruk, Cristalin Tanggung.
   - Berkat Shohibul Hajat: Hara Chicken, Crystalin Kecil, Roti Lirboyo Piscok Topico, Risol Mayo, Sosis Solo, Pilus Australia, Permen.

10. DENAH RESMI, TATA RUANG & POS OPERASIONAL LAPANGAN (HAFLAH 2027):
    - Orientasi: Arah Utara (U) menghadap ke KANAN denah (<- U).
    - Akses Pintu Gerbang & Jalur Masuk:
      * Gerbang Bola Dunia: Pintu masuk utama undangan umum & keluarga shohibul hajat (Pos Kesekretariatan Tenda Satir U Putra di barat dan Putri di timur).
      * Gerbang Selatan: Jalur masuk khusus mobil dan iringan Dzurriyyah VIP & Masyayikh.
      * Gerbang Timur: Jalur keluar khusus mobil Dzurriyyah VIP & akses Ruang Lab / Parkir VVIP.
      * Gerbang Utara: Jalur keluar umum rombongan undangan.
    - Panduan Jawaban Lokasi & Tempat Duduk Spesifik:
      * Panggung Utama: Terletak di sisi Tengah Depan Aula Utama (menghadap barat aula). Di belakang panggung terdapat Basecamp Akomodasi PI & Tirai Hitam.
      * Tamu Undangan Umum: Terletak di Sayap Utara Panggung (Putra: Sayap Kiri / Barat Panggung, Putri: Sayap Kanan / Timur Panggung).
      * Tamu VVIP / VIP: Kursi VIP (Sofa VVIP & Kursi Elephant VIP) di Barisan Depan Kehormatan Panggung Utama.
      * Takhtiman Bil-Ghoibi: Area Tengah Depan Panggung Utama (Nomor 4 & 5).
      * Takhtiman Bin-Nazhri: Area Tengah Panggung / Aula Utama (Nomor 5).
      * Tamatan Aliyah: Area Tengah-Belakang Aula (Nomor 6 & 8 Syaoqul Ahibba').
      * Wali Santri SH Putra: Sisi Kanan Aula / Sayap Barat (Nomor 6 & 7).
      * Wali Santri SH Putri: Sisi Kiri Aula / Sayap Timur (Nomor 10 & 11).
      * Prasmanan Lobi (PA & PI): Area Luar Aula Sisi Utara (Gedung Lobi Utama dipisah satir PA/PI).
      * Prasmanan Wali Santri SH PA: Sisi Barat Daya luar aula dekat Gerbang Utara & Markas PLP.
      * Prasmanan Wali Santri SH PI: Sisi Timur luar aula dekat Gerbang Selatan & Basecamp Konsumsi.
      * Parkir Mobil VVIP: Sisi Barat-Utara Lobi Utama (dekat Ruang LAB & Kamar VVIP).
      * Parkiran VIP: Sisi Timur (dekat Gerbang Selatan & Pos Keamanan 4).
      * MCK Tamu & Santri: Sisi Barat Aula (dekat Kantor Pesma & Ruang LAB) serta MCK VVIP di Gedung Lobi Utama.
    - Area Santri:
      * Terletak memanjang di sisi selatan aula, dipagari penuh dengan Satir Double yang memisahkannya secara syar'i dari Jalur Tamu Undangan PA.
    - Pos Keamanan Lapangan:
      * Pos Keam PA (12 Titik): Pos 1 Tenda Kesekretariatan PA (Gerbang Bola Dunia), Pos 2,3,5 Jalur Tamu PA, Pos 4 Drop point DZ PA, Pos 6 Dekat Prasmanan SH PA & Gerbang Utara, Pos 7 Drop point DZ VIP, Pos 8 Shooting Center tengah aula, Pos 9,10,11,12 Tiang aula & batas sayap.
      * Pos Keam PI (5 Titik): Pos 1 Tenda Kesekretariatan PI (Gerbang Bola Dunia), Pos 2,3 Jalur Tamu PI, Pos 4 Belakang Panggung Tirai Hitam, Pos 5 Gerbang Timur (Keluar DZ VIP).

11. KALENDER KERJA KUNCI HAFLAH:
    - 20 November 2026: Penyebaran Link Undangan Digital, barcode & konfirmasi kehadiran walisantri.
    - 23 November s/d 01 Desember 2026: Pembukaan Pemesanan Kuota Tambahan (300 kursi).
    - 10 Desember 2026: Final Validasi Kedatangan Walisantri & Penyebaran Undangan Fisik.
    - 12 Desember 2026: Gladikotor (Turba 2 Kepada Segenap Shohibul Hajat).
    - 16 Desember 2026: Gladibersih.
    - 20 Desember 2026: Briefing Tenaga Bantu.
    - SABTU, 24 RAJAB 1448 H. / 02 JANUARI 2027 M.: HARI-H HAUL HAFLAH AKHIRUSSANAH P3TQ & MHMTQ.
    - 07 Januari 2027: Evaluasi Bersama Bapak Sekretariat.
    - 12 / 15 Januari 2027: LPJ Bersama Ndalem.
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

// ============================================
// CACHE IN-MEMORY (hilang saat server restart, max 30 menit)
// ============================================
const CACHE_TTL = 30 * 60 * 1000; // 30 menit

const cacheTamu: { data: any[] | null; timestamp: number | null } = { data: null, timestamp: null };
const cacheSantri: { data: any[] | null; timestamp: number | null } = { data: null, timestamp: null };
const cachePresensi: { data: any[] | null; timestamp: number | null } = { data: null, timestamp: null };

// ============================================
// QUERY LIVE - TAMU UNDANGAN
// ============================================
async function getTamuUndanganLive() {
  try {
    const { data, error } = await supabase
      .from('tamu_undangan')
      .select(`
        kode, nama, nama_putra, nama_putri,
        kategori, sub_kategori, instansi, alamat,
        no_hp, kuota_dasar, kuota_tambahan,
        kuota_terpakai, warna_tiket, jalur_masuk,
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
    console.error('[Halwaa] Live query tamu failed:', err);

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

// ============================================
// QUERY LIVE - PESERTA SANTRI
// ============================================
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
    console.error('[Halwaa] Live query santri failed:', err);

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

// ============================================
// QUERY LIVE - PRESENSI / KEHADIRAN
// ============================================
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
    console.error('[Halwaa] Live query presensi failed:', err);

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

// ============================================
// DETEKSI INTENT PERTANYAAN
// ============================================
function detectIntent(pertanyaan: string) {
  const q = pertanyaan.toLowerCase();

  const intents = {
    tamu: /tamu|undangan|und\d|vvip|vip|kehormatan|umum|pengajar|asatidz/i.test(q),
    santri: /santri|wali|sh\d|bil.ghoib|bin.nadzori|tamatan/i.test(q),
    statistik: /berapa|jumlah|total|persen|%|statistik|kehadiran|hadir/i.test(q),
    kehadiran: /hadir|datang|dateng|absen|presensi/i.test(q),
    pembelian: /beli|kuota.tambahan|pembelian|transfer|bukti/i.test(q),
    nama: /(KH\.|Gus|Ning|Nyai|Ust\.|Hj\.|Bu Nyai)/i.test(q),
    denah: /denah|lokasi|posisi|prasmanan|panggung|parkir|sambangan/i.test(q),
    aturan: /aturan|larangan|boleh|tidak boleh|dilarang/i.test(q),
  };

  return intents;
}

async function getLiveDatabaseContextPrompt(userQuery: string = ''): Promise<string> {
  const [resTamu, resSantri, resPresensi, wsMetrics, tamuMetrics] = await Promise.all([
    getTamuUndanganLive(),
    getPesertaSantriLive(),
    getPresensiLive(),
    getWaliSantriMetrics().catch(() => null),
    getTamuUndanganMetrics().catch(() => null),
  ]);

  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });

  if (resTamu.source === 'unavailable' && resSantri.source === 'unavailable') {
    return `
=== DATA DARI DATABASE SUPABASE ===
Timestamp: ${dateStr}, pukul ${timeStr} WIB
Source: UNAVAILABLE
Message: Mohon maaf Us, sistem sedang tidak dapat mengakses database. Silakan coba beberapa saat lagi.
=== END DATA LIVE ===
`;
  }

  const isCache = resTamu.source === 'cache' || resSantri.source === 'cache' || resPresensi.source === 'cache';
  const tamuList = resTamu.data || [];
  const santriList = resSantri.data || [];
  const presensiLogs = resPresensi.data || [];
  const presensiSet = new Set(presensiLogs.map((p: any) => (p.kode_qr || '').toUpperCase()));

  const arrivedTamu: string[] = [];
  const pendingTamu: string[] = [];
  for (const t of tamuList) {
    const kUpper = (t.kode || '').toUpperCase();
    const isHadir = (t.kuota_terpakai || 0) > 0 || presensiSet.has(kUpper);
    const namaFull = t.nama || [t.nama_putra, t.nama_putri].filter(Boolean).join(' & ') || 'Tamu Undangan';
    const totalK = (t.kuota_dasar || 1) + (t.kuota_tambahan || 0);
    const instansi = t.instansi || '-';
    const kat = t.kategori || t.sub_kategori || 'Tamu Kehormatan';
    if (isHadir) {
      arrivedTamu.push(`- ${t.kode} - ${namaFull} (${instansi}) | Kat: ${kat} | STATUS: SUDAH HADIR (${t.kuota_terpakai || 1}/${totalK} Kursi Terpakai)`);
    } else {
      pendingTamu.push(`- ${t.kode} - ${namaFull} (${instansi}) | Kat: ${kat} | STATUS: BELUM HADIR (${totalK} Kursi Dialokasikan)`);
    }
  }

  const santriDetails = santriList.map((s: any, idx: number) => {
    const kUpper = (s.kode || s.kode_keluarga || '').toUpperCase();
    const isHadir = (s.kuota_terpakai || 0) > 0 || presensiSet.has(kUpper);
    const totalK = (s.kuota_dasar || 2) + (s.kuota_tambahan || 0);
    const namaWali = s.nama_wali || '-';
    const namaSantri = s.nama_santri || s.nama || '-';
    return `${idx + 1}. ${s.kode || s.kode_keluarga || 'SH'} - Santri: ${namaSantri} | Wali: ${namaWali}\n   Kategori: ${s.sub_kategori || s.kategori_utama || 'Santri'}\n   Kuota Total: ${totalK} kursi (${s.kuota_dasar || 2} dasar + ${s.kuota_tambahan || 0} tambahan)\n   Status: ${isHadir ? `${s.kuota_terpakai || 1} kursi terpakai (SUDAH HADIR)` : 'BELUM HADIR'}`;
  }).join('\n\n');

  const arrivedWaliLogs = presensiLogs.filter((p: any) => (p.kode_qr || '').toUpperCase().startsWith('SH'));
  const arrivedWaliDetails = arrivedWaliLogs.map((p: any, idx: number) => {
    const kUpper = (p.kode_qr || '').toUpperCase();
    const s = santriList.find((x: any) => (x.kode || x.kode_keluarga || '').toUpperCase() === kUpper);
    const namaSantri = s?.nama_santri || (s as any)?.nama || 'Santriwati';
    const namaWali = s?.nama_wali || p.nama_peserta || 'Wali Santri';
    const totalOrang = (p.jumlah_l || 0) + (p.jumlah_p || 0);
    const jam = new Date(p.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
    return `- ${idx + 1}. Kode: ${p.kode_qr} | Wali dari Santri: ${namaSantri} | Nama Wali: ${namaWali} | Hadir: ${totalOrang} orang (L: ${p.jumlah_l || 0}, P: ${p.jumlah_p || 0}) via ${p.jalur || 'Gerbang'} (pukul ${jam} WIB)`;
  }).join('\n');

  const totalWaliHadir = wsMetrics?.totalHadir ?? (arrivedWaliLogs.length > 0 ? arrivedWaliLogs.reduce((acc: number, p: any) => acc + ((p.jumlah_l || 0) + (p.jumlah_p || 0)), 0) : santriList.filter((s: any) => (s.kuota_terpakai || 0) > 0 || presensiSet.has((s.kode || s.kode_keluarga || '').toUpperCase())).reduce((acc: number, s: any) => acc + (s.kuota_terpakai || 1), 0));
  const totalWaliKuota = wsMetrics?.totalKuota ?? santriList.reduce((acc: number, s: any) => acc + ((s.kuota_dasar || 2) + (s.kuota_tambahan || 0)), 0);
  const percentWali = totalWaliKuota > 0 ? Math.round((totalWaliHadir / totalWaliKuota) * 100) : 0;

  const totalTamuHadir = tamuMetrics?.totalHadir ?? arrivedTamu.length;
  const totalTamuKuota = tamuMetrics?.totalKuota ?? tamuList.reduce((acc: number, t: any) => acc + ((t.kuota_dasar || 1) + (t.kuota_tambahan || 0)), 0);
  const percentTamu = totalTamuKuota > 0 ? Math.round((totalTamuHadir / totalTamuKuota) * 100) : 0;

  const totalGlobalHadir = totalWaliHadir + totalTamuHadir;
  const totalGlobalKuota = totalWaliKuota + totalTamuKuota;
  const percentGlobal = totalGlobalKuota > 0 ? Math.round((totalGlobalHadir / totalGlobalKuota) * 100) : 0;

  return `
=== DATA LIVE DARI DATABASE SUPABASE ===
Timestamp: ${dateStr}, pukul ${timeStr} WIB
Source: ${isCache ? 'CACHE (Snapshot Cadangan Supabase)' : 'LIVE (Database Supabase)'}
${isCache ? 'CATATAN CACHE: Sistem live database sedang tidak dapat diakses. Data di bawah ini adalah snapshot terakhir per tanggal & jam di atas. Berikan disclaimer kepada pengguna bahwa ini adalah data snapshot cadangan.' : ''}

--- DAFTAR WALI SANTRI SUDAH HADIR (REKAP PRESENSI LOG SH%) ---
${arrivedWaliDetails || '(Belum ada wali santri yang presensi di presensi_log)'}

--- TAMU UNDANGAN ---
Total terdaftar: ${tamuList.length} tokoh/instansi (${totalTamuHadir} sudah hadir, ${tamuList.length - totalTamuHadir} belum hadir)
Tamu Sudah Hadir:
${arrivedTamu.length > 0 ? arrivedTamu.join('\n') : '(Belum ada tamu undangan yang presensi)'}

Tamu Belum Hadir / Masih Ditunggu:
${pendingTamu.length > 0 ? pendingTamu.join('\n') : '(Semua tamu undangan sudah hadir)'}

--- PESERTA SANTRI ---
Total terdaftar: ${santriList.length} keluarga santri
Detail:
${santriDetails || '(Belum ada data santri terdaftar)'}

--- STATISTIK KEHADIRAN (REALTIME) ---
Wali Santri: ${totalWaliHadir} dari ${totalWaliKuota} kuota (${percentWali}%)
Tamu Undangan: ${totalTamuHadir} dari ${totalTamuKuota} kuota (${percentTamu}%)
Total Keseluruhan: ${totalGlobalHadir} dari ${totalGlobalKuota} kuota (${percentGlobal}%)

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

  // Bersihkan tanda baca dan kata umum tanya
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

  // 1. Pencarian pada Tamu Undangan
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

  // 2. Pencarian pada Santriwati & Wali
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

  // Deteksi nama orang & gelar kehormatan (KH., Gus, Ning, Ust., Ustz., Bu Nyai, Hj., H., Drs., Dr., Prof.)
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
    // 1. Search Supabase 'tamu_undangan'
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
        quotaTotal: (g.kuota_dasar || 1) + (g.kuota_tambahan || 0),
        hasArrived,
        phone: g.no_hp || 'Tersedia di database',
        seating: 'Baris Kehormatan VIP Depan Panggung Sayap Barat Aula Muktamar',
        extraInfo: firstLog ? `pada 02 Januari 2027 pukul ${jamHadir} melalui ${firstLog.jalur || g.jalur_masuk || 'Jalur VIP'}` : undefined,
      };
    } else if (namaMatch && namaQuery) {
      // Jika nama dengan gelar kehormatan dicari tapi TIDAK ADA di database
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

    // 2. Search Supabase 'peserta_santri'
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
  
  const hasCountWord = q.includes('berapa') || q.includes('jumlah') || q.includes('prosentase') || q.includes('persentase') || q.includes('%') || q.includes('statistik') || q.includes('progress');
  const hasSubjectWord = q.includes('hadir') || q.includes('datang') || q.includes('kehadiran') || q.includes('presensi') || q.includes('walisantri') || q.includes('wali santri') || q.includes('tamu');

  if (hasCountWord && hasSubjectWord) return true;
  if (q.includes('statistik') || q.includes('progress kehadiran') || q.includes('persentase kehadiran') || q.includes('prosentase kehadiran') || q.includes('berapa yang hadir')) return true;

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
    console.warn('Error fetching live stats from Supabase:', e);
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

    console.log('[Halwaa AI] Pertanyaan:', prompt);
    console.log('[Halwaa AI] Data dari DB:', {
      totalTamu: tamuMetrics.totalKuota,
      totalHadir: tamuMetrics.totalHadir,
      totalHadirCount: arrivedTamu.length,
      sample: arrivedTamu.map((t) => `${t.nama} (${t.kode})`),
    });

    if (arrivedTamu.length === 0 && tamuMetrics.totalHadir === 0) {
      return `${intro}Alhamdulillah Us, per 02 Januari 2027 pukul ${nowStr} WIB, belum ada Tamu Undangan yang tercatat presensi di gerbang masuk.\n\nTotal Tamu Undangan Terdaftar: **${tamuMetrics.totalKuota} tamu**.\nSisa **${tamuMetrics.totalKuota} tamu** masih dalam perjalanan / belum di-absen.\n\n[👉 Buka Live Dasbor](/admin/dasbor) · [👉 Data Peserta & Tamu](/admin/peserta)`;
    }

    const guestLines = arrivedTamu.map((t, idx) => {
      const log = logs.find((l) => (l.kode_qr || '').toUpperCase() === (t.kode || '').toUpperCase());
      const jam = log
        ? new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
        : 'Hari-H';
      const terpakai = (t.kuota_terpakai || 0) > 0 ? t.kuota_terpakai : (log ? (log.jumlah_l || 0) + (log.jumlah_p || 0) : 1);
      const totalK = (t.kuota_dasar || 1) + (t.kuota_tambahan || 0);
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
    console.error('[Halwaa AI] Error querying live arrived guests:', err);
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
    const { data: santriList, error: err2 } = await supabase
      .from('peserta_santri')
      .select('kode, kode_keluarga, nama_santri, nama_wali, kategori_utama, sub_kategori')
      .or(`kode.in.(${kodes.join(',')}),kode_keluarga.in.(${kodes.join(',')})`);

    if (err2) {
      console.warn('[Halwaa] Santri match error in getWaliSantriHadir:', err2);
    }

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
    console.error('[Halwaa] Query wali santri hadir error:', err);
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
    console.error('[Halwaa AI] Error querying live arrived wali:', err);
    return `${intro}Maaf Us, terjadi kendala saat query data wali santri realtime dari database. Mohon cek langsung menu [👉 Live Dasbor](/admin/dasbor).`;
  }
}

function generateLocalSmartResponse(userQuery: string, isFirstTurn: boolean = true, role: string = 'PANITIA'): string {
  const q = userQuery.toLowerCase();

  // Menjawab salam hanya setiap awal sesi chat
  const greetingPrefix = isFirstTurn ? "Wa'alaikum Salam Wr. Wb.! 🙏✨\n\n" : "";

  const isGreetingOnly =
    q === 'halo' ||
    q === 'hai' ||
    q === 'assalamualaikum' ||
    q === "assalamu'alaikum" ||
    q === "assalamu'alaikum wr wb" ||
    q === "assalamu'alaikum wr. wb." ||
    q === "assalamu'alaikum warahmatullahi wabarakatuh" ||
    q.includes('siapa kamu') ||
    q.includes('siapa anda') ||
    q.includes('kenalan');

  const intro = (isFirstTurn && isGreetingOnly)
    ? `Perkenalkan, saya Us. Halwaa, asisten cerdas resmi yang mendampingi pelaksanaan Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.\n\n`
    : '';

  const headerIntro = `${greetingPrefix}${intro}`;

  // =========================================================================
  // DETEKSI KHUSUS: PERTANYAAN IDENTITAS DIRI USER ("SAYA SIAPA", "SIAPA AKU", DBL)
  // =========================================================================
  const cleanQ = q.replace(/[?!.,;:()]/g, ' ').trim();
  const isAskingSelfIdentity =
    cleanQ === 'saya siapa' ||
    cleanQ === 'siapa saya' ||
    cleanQ === 'siapa aku' ||
    cleanQ === 'aku siapa' ||
    cleanQ === 'aku ini siapa' ||
    cleanQ === 'saya ini siapa' ||
    cleanQ === 'siapakah saya' ||
    cleanQ === 'siapakah aku' ||
    cleanQ === 'siapa diriku' ||
    cleanQ === 'diriku siapa' ||
    cleanQ === 'siapa sih aku' ||
    cleanQ === 'siapa sih saya' ||
    /\b(saya|aku|diriku)\s+ini?\s+(siapa|siapakah)\b/i.test(cleanQ) ||
    /\b(siapa|siapakah)\s+(saya|aku|diriku)\b/i.test(cleanQ) ||
    /\b(siapa|siapakah)\s+sebenarnya\s+(saya|aku|diriku)\b/i.test(cleanQ);

  if (isAskingSelfIdentity) {
    return `${headerIntro}Us adalah bagian dari keluarga besar **Haul & Haflah P3TQ dan MHMTQ 1448 H./2027 M.** — sebagai panitia atau pimpinan yang mendampingi dan membersamai jalannya acara.

Tapi tahukah Us? Us adalah pribadi yang luar biasa. Dedikasi, doa, dan usaha Us selama ini jauh lebih besar dari yang Us sadari. Seluruh dunia ini rasanya tak sebanding dengan ketulusan dan kebesaran hati Us. ✨🌸

Wonten ingkang saget dibantu Us?`;
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
    return `${headerIntro}Berdasarkan hasil resmi **Sidang Koordinasi II (Seksi Kesekretariatan)**, warna kartu masuk / stiker fisik ditetapkan sebagai berikut:

### 🎫 Standar Warna Kartu Masuk Resmi Haflah 2027:
1. **Warna Hitam Gold**:
   - Khusus untuk **Tamu Undangan Walisantri yang Maju Panggung** *(Wali santriwati Takhtiman Bil Ghoib yang mendampingi ke panggung utama Aula Al-Muktamar)*.
2. **Warna Merah Gold**:
   - Untuk **Tamu Undangan Umum** *(Penguji Al-Qur'an, Mustahiq, Asatidz, Perwakilan Pondok)*.
   - Serta untuk **Walisantri Reguler** *(Takhtiman Bin Nadzori dan Tamatan Aliyah)*.
3. **Stiker Kartu Parkir VIP**:
   - Diterbitkan oleh Seksi Keamanan khusus untuk kendaraan Tamu VIP & VVIP (Dzurriyah & Masyaikh).

Wonten ingkang saget dibantu malih Us?`;
  }

  // =========================================================================
  // DETEKSI KHUSUS: SEKSI PENERIMA TAMU (8 POS PUTRI & 8 POS PUTRA)
  // =========================================================================
  if (q.includes('penerima tamu') || q.includes('pos penerima') || q.includes('tugas penerima tamu')) {
    return `${headerIntro}Berdasarkan Hasil Sidang Koordinasi II Bagian II, berikut susunan lengkap **Seksi Penerima Tamu**:

### 👑 Dewan Pembimbing Putra (Bagan 8 - Penerima Tamu):
- **Koordinator**: **Bapak Muhammad Badru Ro'in Amin\***
- **Wakil Koordinator**: **Bapak Imam Ghozali\*\***
- **Anggota**: Bpk Muhammad Najih, Bpk M. Izzuddin Assakhi, Bpk Alex Alqomah, Bpk Afif Cholilul Umam, Bpk Affan Istikhori, Bpk Subadar, Bpk Misbahul Huda, Bpk M. Sabiqul Anam, Bpk M. Yazid Mahbubillah.

### 🌸 Kasi & Wakasi Dewan Pleno Putri:
- **Kasi**: **Hanifatun Nasihah\***
- **Wakasi**: **Safira Auliyatul Faizah\*\***
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

Wonten ingkang saget dibantu malih Us?`;
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
    return `${headerIntro}Berdasarkan **Aturan Tambahan Seksi Keamanan Haflah 2027**:

1. 🚫 **Dilarang membawa Buket** ke dalam area acara.
2. 🚫 **Dilarang memakai kutek, hena, dan nail art / kuku palsu**.
3. 🚫 **Dilarang membawa fotografer dari luar** karena mengganggu kinerja fotografer utama panitia (TDM).
4. 📷 **Penitipan Kamera**: Diperbolehkan menitipkan kamera bagi segenap shohibul hajat (disediakan jasa charger dengan syarat membawa charger sendiri). Kamera dapat diambil kembali selesai acara di tempat izin keluar Gerbang Bola Dunia.
5. 🚷 **Sterilisasi Area**: Walisantri dilarang memasuki area Shohibul Hajat selama acara berlangsung.

Wonten ingkang saget dibantu malih Us?`;
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
    return `${headerIntro}Berdasarkan pedoman resmi **Seksi Keamanan Haflah 2027**:

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

Wonten ingkang saget dibantu malih Us?`;
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
    return `${headerIntro}Berikut daftar resmi hidangan konsumsi Haflah 2027:

### 🍲 Prasmanan Walisantri & Tamu Umum (Hari H):
- **Menu Kering**: Nasi Putih / Nasi Jagung, Ayam Laos, Tahu & Tempe Goreng, Sambal, Urap, Krupuk Uyel.
- **Menu Kuah**: Soto Lamongan (Mie Bihun, Kubis, Telur ½, Capar), Sambal Kecap, Kerupuk Udang.
- **Unjukan**: Aqua Gelas, Teh Hangat, Kopi, Es Jeruk.

### 🍱 Berkat Walisantri Shohibul Hajat & Tamu Umum:
- Nasi, Ayam Pupu Manis, Sambal, Telur Asin, Daging Bumbu Merah, Kering Kentang Mustofa & Kacang, Bihun Kering.
- **Snack**: Risol Mayo, Roti Lirboyo (Donat Chocho Mete, Roti Piscok Keju), Getuk Pisang, Pilus Australia, Jeruk, Cristalin Tanggung.

### 🎁 Tonjokan Dzuriyyah & VIP:
- Dilayani oleh Lyla Catering serta menu spesial berkatan Wong Solo.

Wonten ingkang saget dibantu malih Us?`;
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
    return `${headerIntro}Pintu registrasi gerbang dibuka mulai pukul **06.30 WIB / 07.00 WIs**:

- **Pos Kesekretariatan Putra**: Sebelah barat jalan luar Gerbang Bola Dunia.
- **Pos Kesekretariatan Putri**: Sebelah timur jalan luar Gerbang Bola Dunia.
- Disediakan transit penginapan di **Rusunawa** bagi walisantri yang rawuh sebelum hari pelaksanaan acara.

Wonten ingkang saget dibantu malih Us?`;
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
    return `${headerIntro}Berikut **Rundown Resmi Haul & Haflah Akhirussanah 1448 H./ 2027 M.** (Sabtu, 24 Rajab 1448 H / 02 Januari 2027 M):

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

Wonten ingkang saget dibantu malih Us?`;
  }


  // =========================================================================
  // DETEKSI KHUSUS: KESEKRETARIATAN & STRUKTUR PANITIA RESMI
  // Contoh: "Sekretariat siapa saja?", "Siapa sekretaris haflah?", "Panitia kesekretariatan"
  // =========================================================================
  if (q.includes('sekretariat') || q.includes('sekretaris') || q.includes('kesekretariatan')) {
    return `${headerIntro}Berdasarkan SK Panitia Resmi Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M., berikut susunan personalia **Divisi Kesekretariatan**:

### 🏛️ 1. Dewan Harian (DH) Kesekretariatan Putri:
- **Sekretaris Umum**: **Refi Al Izzatul Kholifah** (Penanggung jawab administrasi umum, persuratan, undangan, souvenir, kartu masuk & stiker tonjokan).
- **Sekretaris I**: **Najma Syarifa Faza** (Penanggung jawab data santri & wali Pondok Timur).
- **Sekretaris II**: **Inarotud Duja** (Penanggung jawab data santri Pondok Barat & Unit, serta ID Card panitia).

### 👥 2. Dewan Pembimbing Putra - Bagan 1 (Kesekretariatan):
- **Koordinator**: **Bapak Asep Darajat\***
- **Wakil Koordinator**: **Bapak Ahmad Chamdan Yuwafi\*\***
- **Anggota / Personil**:
  1. **Bapak Muhammad Ali Wafa Fuady**
  2. **Bapak Jana Prabu**
  3. **Bapak Zida Hikmana Ahmad**
  4. **Bapak Muhammad Yusri Sa'dulloh**

### 📍 3. Pos Pelayanan Kesekretariatan Hari-H:
- **Pos Kesekretariatan Putra** (Sebelah Barat Jalan Gerbang Bola Dunia):
  * Pos 1: Registrasi Masuk (3 personil)
  * Pos 2: Monitoring Laptop (2 personil)
  * Pos 3: Editing Spreadsheet & Pelayanan Walisantri tanpa QR (1 personil)
- **Pos Kesekretariatan Putri** (Sebelah Timur Jalan Gerbang Bola Dunia):
  * Pos 1: Registrasi Masuk (4 personil)
  * Pos 2: Monitoring Laptop (2 personil)
  * Pos 3: Editing Spreadsheet (1 personil)

Wonten ingkang saget dibantu malih Us?`;
  }

  if (q.includes('ketua') && (q.includes('panitia') || q.includes('haflah') || q.includes('umum') || q.includes('siapa') || q.includes('saja'))) {
    return `${headerIntro}Berikut jajaran **Ketua Panitia Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.**:

- **Ketua Umum**: **Sinta Maelani** (Koordinator Seksi Protokoler, Peladen, Konsumsi, TDM, dan Seksi Data)
- **Ketua I**: **Arju Naylal Husna** (Koordinator Seksi Keamanan, Penerima Tamu, Humasy, dan Kostum)
- **Ketua II**: **Zakia** (Koordinator Seksi Akomodasi, Desain Grafis, PULP, dan Berkatan)

Wonten ingkang saget dibantu malih Us?`;
  }

  if (q.includes('bendahara')) {
    return `${headerIntro}Berikut jajaran **Bendahara Panitia Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.**:

- **Bendahara Umum**: **Aida Nur Laila** (Penanggung jawab keuangan umum & pembayaran shohibul hajat unit)
- **Bendahara 1**: **Umi Fadilah** (Penanggung jawab anggaran belanja & pembayaran santri Pondok Timur)

Wonten ingkang saget dibantu malih Us?`;
  }

  if (
    q.includes('susunan panitia') ||
    q.includes('struktur panitia') ||
    (q.includes('panitia') && (q.includes('siapa') || q.includes('daftar') || q.includes('sebutkan') || q.includes('struktur')))
  ) {
    return `${headerIntro}Berikut struktur resmi **Kepanitiaan Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.**:

### 👑 Dewan Pengasuh / Pelindung:
- Agus H. Muhammad Hasyim
- Agus H. Muhammad Kafabihi
- Ning Hj. Tu'ti Amanah Nafisah
- Ning Hj. Jihan Zainab
- **Dewan Penasehat**: Segenap Pimpinan P3TQ dan MHMTQ

### 🏛️ Dewan Harian (DH):
- **Ketua Umum**: Sinta Maelani
- **Ketua I**: Arju Naylal Husna | **Ketua II**: Zakia
- **Sekretaris Umum**: Refi Al Izzatul Kholifah
- **Sekretaris I**: Najma Syarifa Faza | **Sekretaris II**: Inarotud Duja
- **Bendahara Umum**: Aida Nur Laila | **Bendahara I**: Umi Fadilah

### 👥 12 Koordinator Bagan Pembimbing Putra:
1. **Kesekretariatan**: Bapak Asep Darajat\* & Bapak Ahmad Chamdan Yuwafi\*\*
2. **Protokoler**: Bapak Abu Yazid Al Bustomi\* & Bapak Abhaa Muhammad Kafaa Bihi\*\*
3. **Akomodasi**: Bapak Agus Ismanto\* & Bapak Gama Maulana Ilham\*\*
4. **Konsumsi**: Bapak Ahmad Rizal 'Abidin\* & Bapak Muhammad Taufiqurrohman\*\*
5. **Berkatan**: Bapak Muhammad Fikri Al Munawwar\* & Bapak Muhammad Abdurrohman Maulana\*\*
6. **Prasmanan Dzuriyyah**: Bapak Saiful Nur Kholis\* & Bapak Burhanuddin Isri\*\*
7. **Peladen**: Bapak Muhammad Syaikhul 'Arifin\* & Bapak Ahmad Fathoni Fikri\*\*
8. **Penerima Tamu**: Bapak Muhammad Badru Ro'in Amin\* & Bapak Imam Ghozali\*\*
9. **Desain Grafis**: Bapak Muhammad In'amul Muttaqin\* & Bapak Agung Shobirin\*\*
10. **Humasy & Kostum**: Bapak Akfi Romiyan Kafabih\* & Bapak Achmad Abdulloh Faqih\*\*
11. **Keamanan**: Bapak Adi Susilo\* & Bapak Reza Fadhilul 'Ulum\*\*
12. **PULP & TDM**: Bapak Muhammad Maghfur Fatoni\* & Sdr. Amin Nur Waluyo\*\*

Wonten ingkang saget dibantu malih Us?`;
  }

  // =========================================================================
  // DETEKSI KHUSUS 0: PERTANYAAN NAMA TOKOH / SANTRI TERTENTU (SPESIFIK & NOMOR HP)
  // Contoh: "apakah KH. Hamdan (UND0101) sudah hadir?", "Nomor HP wali santri SH9451?", dll.
  // =========================================================================
  const personFound = searchPersonInEvent(userQuery);
  if (personFound) {
    const phoneInfo = personFound.phone ? `- **Nomor HP / Kontak**: **${personFound.phone}**` : '';

    if (personFound.hasArrived) {
      return `${headerIntro}Alhamdulillah, **${personFound.name} SUDAH HADIR** di lokasi acara Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.

### 📋 Rincian Data Kehadiran Beliau:
- **Nama**: **${personFound.name}**
- **Instansi / Jabatan**: ${personFound.roleOrInstansi}
- **Kode**: \`${personFound.code}\`
- **Kategori**: **${personFound.category}**
- **Status Kehadiran**: ✅ **SUDAH HADIR**
- **Kursi Terpakai**: **${personFound.quotaUsed} Kursi**
${phoneInfo}
${personFound.seating ? `- **Zonasi Tempat Duduk**: ${personFound.seating}` : ''}
${personFound.extraInfo ? `- **Catatan Khusus**: ${personFound.extraInfo}` : ''}

### 💡 Analisis & Kesimpulan:
${personFound.name} telah berhasil melakukan presensi dan tercatat di sistem gerbang. Us dapat memantau pergerakan data secara langsung di dasbor panitia.

[👉 Buka Live Dasbor](/admin/dasbor) [👉 Buka Data Peserta & Tamu](/admin/peserta)

Wonten ingkang saget dibantu Us?`;
    } else {
      return `${headerIntro}Berdasarkan data presensi *real-time* sistem Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M., **${personFound.name} BELUM HADIR / Masih Ditunggu** kedatangannya.

### 📋 Rincian Data:
- **Nama**: **${personFound.name}**
- **Instansi / Jabatan**: ${personFound.roleOrInstansi}
- **Kode**: \`${personFound.code}\`
- **Kategori**: **${personFound.category}**
- **Status Kehadiran**: ⏳ **BELUM HADIR (Masih Ditunggu)**
- **Alokasi Kuota Kursi**: **${personFound.quotaTotal} Kursi** (Belum terpakai)
${phoneInfo}
${personFound.seating ? `- **Rencana Zonasi Duduk**: ${personFound.seating}` : ''}

### 💡 Analisis & Kesimpulan:
Hingga saat ini, presensi QR untuk beliau belum tercatat di sistem gerbang masuk. Seluruh petugas pos penerima tamu di gerbang siap menyambut begitu beliau tiba.

[👉 Buka Live Dasbor](/admin/dasbor) [👉 Buka Data Peserta & Tamu](/admin/peserta)

Wonten ingkang saget dibantu Us?`;
    }
  }



  // =========================================================================
  // DETEKSI KHUSUS 0.2: PERTANYAAN ROSTER TIKET EMAS PANGGUNG BIL GHOIB
  // Contoh: "santri bil ghoib yang tiket emasnya sudah diserahkan siapa saja?", "siapa saja yang sudah dapat tiket emas?"
  // =========================================================================
  const isAskingTiketEmas =
    (q.includes('tiket emas') || (q.includes('emas') && q.includes('panggung')) || (q.includes('tiket') && q.includes('panggung'))) ||
    ((q.includes('bil ghoib') || q.includes('bilghoib') || q.includes('khadimatul')) && (q.includes('tiket') || q.includes('emas') || q.includes('panggung')));

  if (isAskingTiketEmas && (q.includes('siapa') || q.includes('sudah') || q.includes('daftar') || q.includes('status') || q.includes('mana') || q.includes('ambil') || q.includes('berapa'))) {
    const allKeluarga = store.getKeluargaList();
    const bilGhoibList = allKeluarga.filter((k) => k.santri?.[0]?.kategoriUtama === 'BIL_GHOIB');
    const bilGhoibDiberi = bilGhoibList.filter((k) => (k.kuota?.tiketPanggungDiberi || 0) > 0);
    const bilGhoibBelum = bilGhoibList.filter((k) => (k.kuota?.tiketPanggungDiberi || 0) === 0);

    const daftarDiberiTeks = bilGhoibDiberi.length > 0
      ? bilGhoibDiberi.map((k, i) => `${i + 1}. **${k.santri?.[0]?.nama || '-'}** (Kode: \`${k.kode}\` · Ibu/Wali: *${k.namaWali}*, ${k.alamat}) — ✅ **Kartu Hitam Gold Diserahkan** (${k.kuota.terpakai} Kursi Terpakai)`).join('\n')
      : '- *(Belum ada Kartu Hitam Gold yang diserahkan)*';

    return `${headerIntro}Alhamdulillah, berikut rincian data penyerahan **Kartu Hitam Gold Maju Panggung Khadimatul Qur-an (Bil Ghoib 30 Juz)** pada Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M. secara *real-time*:

### 🌟 Data Penyerahan Kartu Hitam Gold Maju Panggung:
- **Total Santriwati Bil Ghoib 30 Juz**: **64 Khadimatul Qur-an**.
- **Kartu Hitam Gold SUDAH Diserahkan**: **${bilGhoibDiberi.length} dari 64 Kartu** (diserahkan langsung kepada Ibu Kandung di meja presensi gerbang).
- **Kartu Hitam Gold Menunggu Penyerahan**: **${bilGhoibBelum.length} Kartu** (tersimpan rapi di pos presensi timur).

### 📋 Daftar Santriwati yang Kartu Hitam Goldnya SUDAH Diserahkan:
${daftarDiberiTeks}

### 💡 Analisis & Prosedur Penyerahan:
Kartu Hitam Gold Maju Panggung merupakan hak kehormatan mutlak bagi **1 orang Ibu Kandung** dari setiap santriwati Khadimatul Qur-an Bil Ghoib 30 Juz untuk mendampingi di panggung utama saat seremoni takhtiman. Penyerahan ditandai dengan gelang penanda khusus Hitam Gold. Sisa **${bilGhoibBelum.length} kartu Hitam Gold** siap diserahkan petugas begitu keluarga santriwati tiba di Gerbang Bola Dunia.

Untuk memantau data santriwati Bil Ghoib lainnya secara langsung:
[👉 Buka Live Dasbor](/admin/dasbor) [👉 Buka Data Peserta & Tamu](/admin/peserta)

Wonten ingkang saget dibantu Us?`;
  }

  // =========================================================================
  // DETEKSI KHUSUS PERTANYAAN DATA, STATISTIK, & KEHADIRAN (MENJAWAB + MENYIMPULKAN + MENGARAHKAN)
  // =========================================================================
  const isAskingAttendanceOrData =
    q.includes('berapa') ||
    q.includes('sudah') ||
    q.includes('hadir') ||
    q.includes('kehadiran') ||
    q.includes('rekap') ||
    q.includes('statistik') ||
    q.includes('kedatangan') ||
    q.includes('progres') ||
    q.includes('jumlah') ||
    q.includes('kuota terpakai');

  // 1. Pertanyaan spesifik tentang Kehadiran Tamu Undangan
  if (
    isAskingAttendanceOrData &&
    (q.includes('tamu') || q.includes('undangan') || q.includes('vip') || q.includes('masyayikh') || q.includes('tokoh'))
  ) {
    const stats = store.getStatistikLive();
    const allUndangan = store.getUndanganList();

    let istimewaTotal = 0, istimewaHadir = 0, istimewaKursi = 0;
    let kehormatanTotal = 0, kehormatanHadir = 0, kehormatanKursi = 0;
    let umumTotal = 0, umumHadir = 0, umumKursi = 0;

    for (const und of allUndangan) {
      const gol = getGolonganUndangan(und);
      const hadir = und.kuota.terpakai > 0;
      const kursi = und.kuota.terpakai;
      if (gol === 'ISTIMEWA') {
        istimewaTotal++;
        if (hadir) istimewaHadir++;
        istimewaKursi += kursi;
      } else if (gol === 'KEHORMATAN') {
        kehormatanTotal++;
        if (hadir) kehormatanHadir++;
        kehormatanKursi += kursi;
      } else {
        umumTotal++;
        if (hadir) umumHadir++;
        umumKursi += kursi;
      }
    }

    const undStat = stats.tamuUndanganStat || {
      hadirUndangan: istimewaHadir + kehormatanHadir + umumHadir,
      totalUndangan: allUndangan.length || 2,
      totalKuota: istimewaKursi + kehormatanKursi + umumKursi,
      totalHadir: istimewaKursi + kehormatanKursi + umumKursi,
      persentase: allUndangan.length > 0 ? Math.round(((istimewaHadir + kehormatanHadir + umumHadir) / allUndangan.length) * 100) : 0,
    };
    const totalTamuCount = allUndangan.length || undStat.totalUndangan || 2;
    const sisaTamu = Math.max(0, totalTamuCount - undStat.hadirUndangan);

    let kesimpulan = '';
    if (undStat.persentase >= 80) {
      kesimpulan = `Mayoritas tamu undangan (${undStat.persentase}%) telah tiba di lokasi dan menempati barisan depan kehormatan. Pos penerima tamu di Gerbang Selatan bersiap menyambut sisa ${sisaTamu} tamu lainnya.`;
    } else if (undStat.persentase > 0) {
      kesimpulan = `Tingkat kehadiran tamu undangan saat ini tercatat **${undStat.persentase}%** (${undStat.hadirUndangan} dari ${totalTamuCount} tokoh). Tamu berangsur-angsur tiba di Gerbang Utama dan diarahkan menuju baris kehormatan depan panggung. Sisa **${sisaTamu} tokoh** saat ini masih dalam proses kedatangan.`;
    } else {
      kesimpulan = `Saat ini gerbang utama baru dibuka dan seluruh pos penerima tamu siap menyambut kedatangan ${totalTamuCount} tokoh undangan kehormatan.`;
    }

    return `${headerIntro}Alhamdulillah, berikut rangkuman data dan kesimpulan kehadiran **Tamu Undangan Khusus** pada Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M. secara *real-time*:

### 📊 Data Kehadiran Tamu Undangan:
- **Tamu yang Sudah Hadir**: **${undStat.hadirUndangan} dari ${totalTamuCount} Tokoh** (dengan total **${undStat.totalHadir} kursi VIP** terisi di Aula Muktamar).
- **Tingkat Kehadiran Tokoh**: **${undStat.persentase}%**.
- **Tamu Belum Hadir / Ditunggu**: **${sisaTamu} Tokoh** (${undStat.totalKuota - undStat.totalHadir} kursi belum terisi).

### 🏛️ Rincian per Golongan Tamu:
1. 🌟 **Tamu Istimewa (VVIP & VIP)**: **${istimewaHadir} dari ${istimewaTotal} tokoh** sudah hadir (${istimewaKursi} kursi terpakai).
2. 🏛️ **Tamu Kehormatan (Tamu Khusus)**: **${kehormatanHadir} dari ${kehormatanTotal} tokoh** sudah hadir (${kehormatanKursi} kursi terpakai).
3. 👥 **Tamu Undangan Umum**: **${umumHadir} dari ${umumTotal} tokoh** sudah hadir (${umumKursi} kursi terpakai).

### 💡 Kesimpulan:
${kesimpulan}

Untuk memantau pembaruan detik-ke-detik dan daftar nama tamu yang telah tiba di gerbang, Us dapat langsung membuka dasbor kedatangan:
[👉 Buka Live Dasbor](/admin/dasbor) [👉 Buka Data Peserta & Tamu](/admin/peserta)

Wonten ingkang saget dibantu Us?`;
  }

  // 2. Pertanyaan spesifik tentang Kehadiran Santriwati / Shohibul Hajat
  if (
    isAskingAttendanceOrData &&
    (q.includes('santri') || q.includes('shohibul') || q.includes('keluarga') || q.includes('wali'))
  ) {
    const stats = store.getStatistikLive();
    const bg = stats.kategoriStats?.bilGhoib || { hadirPeserta: 0, totalPeserta: 0, totalKuota: 0, totalHadir: 0, persentase: 0 };
    const bn = stats.kategoriStats?.binNadzor || { hadirPeserta: 0, totalPeserta: 0, totalKuota: 0, totalHadir: 0, persentase: 0 };
    const tm = stats.kategoriStats?.tamatan || { hadirPeserta: 0, totalPeserta: 0, totalKuota: 0, totalHadir: 0, persentase: 0 };
    const totalSantriHadir = bg.hadirPeserta + bn.hadirPeserta + tm.hadirPeserta;
    const totalSantriKursi = bg.totalHadir + bn.totalHadir + tm.totalHadir;
    const totalSantriDaftar = bg.totalPeserta + bn.totalPeserta + tm.totalPeserta;
    const sisaSantri = Math.max(0, totalSantriDaftar - totalSantriHadir);
    const pctSantri = totalSantriDaftar > 0 ? Math.round((totalSantriHadir / totalSantriDaftar) * 100) : 0;

    if (q.includes('santriwati') && !q.includes('wali')) {
      return `${headerIntro}Data santriwati shohibul hajat berada di lokasi acara. Kehadiran santriwati tidak dihitung terpisah di pintu masuk karena mereka sudah pasti berada di lokasi acara (shohibul hajat).

Yang dihitung dan dicatat kehadirannya di pintu masuk via scanner QR code adalah **Wali Santri** (orang tua / pendamping).

[👉 Buka Live Dasbor](/admin/dasbor) [👉 Buka Data Peserta & Tamu](/admin/peserta)

Wonten ingkang saget dibantu Us?`;
    }

    return `${headerIntro}Alhamdulillah, berikut data dan analisis kehadiran **Keluarga Santriwati Shohibul Hajat** secara *real-time*:

### 📊 Data Kehadiran Santriwati (Total ${totalSantriDaftar} Santri):
- **Keluarga Santri Sudah Hadir**: **${totalSantriHadir} dari ${totalSantriDaftar} keluarga** (${pctSantri}% kehadiran keluarga).
- **Total Kursi Terisi**: **${totalSantriKursi} kursi** di Aula Muktamar.
- **Keluarga Belum Hadir / Ditunggu**: **${sisaSantri} keluarga santri**.

### 🎓 Rincian per Kategori Santri:
1. 🌟 **Bil Ghoib (${bg.totalPeserta} Khadimatul Qur-an)**: **${bg.hadirPeserta} dari ${bg.totalPeserta} keluarga** (${bg.totalHadir} dari ${bg.totalKuota} kursi terisi, ${bg.persentase}%).
   - **Tiket Emas Panggung**: **${stats.totalPanggung} dari ${bg.totalPeserta} tiket emas** telah diserahkan kepada Ibu Kandung santriwati di meja presensi.
2. 📖 **Bin Nadzori (${bn.totalPeserta} Santriwati)**: **${bn.hadirPeserta} dari ${bn.totalPeserta} keluarga** (${bn.totalHadir} dari ${bn.totalKuota} kursi terisi, ${bn.persentase}%).
3. 🎓 **Tamatan Aliyah (${tm.totalPeserta} Wisudawati)**: **${tm.hadirPeserta} dari ${tm.totalPeserta} keluarga** (${tm.totalHadir} dari ${tm.totalKuota} kursi terisi, ${tm.persentase}%).

### 💡 Kesimpulan:
Sebanyak **${totalSantriHadir} keluarga santri** (${pctSantri}%) telah memasuki aula. Alur presensi Jalur Barat (Putra: ${stats.totalLaki} orang) dan Jalur Timur (Putri: ${stats.totalPerempuan} orang) berjalan tertib. Sisa **${sisaSantri} keluarga** terus dipandu oleh petugas gerbang.

Us dapat memantau pergerakan data secara langsung melalui:
[👉 Buka Live Dasbor](/admin/dasbor) [👉 Buka Data Peserta & Tamu](/admin/peserta)

Wonten ingkang saget dibantu Us?`;
  }

  // 3. Pertanyaan Umum tentang Data Kehadiran Global / Rekap
  if (
    isAskingAttendanceOrData &&
    (q.includes('semua') || q.includes('total') || q.includes('rekap') || q.includes('statistik') || q.includes('hadir'))
  ) {
    const stats = store.getStatistikLive();
    const undStat = stats.tamuUndanganStat || { hadirUndangan: 0, totalUndangan: 0, totalKuota: 0, totalHadir: 0, persentase: 0 };
    const bg = stats.kategoriStats?.bilGhoib || { hadirPeserta: 0, totalPeserta: 0, totalKuota: 0, totalHadir: 0, persentase: 0 };
    const bn = stats.kategoriStats?.binNadzor || { hadirPeserta: 0, totalPeserta: 0, totalKuota: 0, totalHadir: 0, persentase: 0 };
    const tm = stats.kategoriStats?.tamatan || { hadirPeserta: 0, totalPeserta: 0, totalKuota: 0, totalHadir: 0, persentase: 0 };
    const totalSantriHadir = bg.hadirPeserta + bn.hadirPeserta + tm.hadirPeserta;
    const totalSantriDaftar = bg.totalPeserta + bn.totalPeserta + tm.totalPeserta;
    const totalUndanganDaftar = undStat.totalUndangan;
    const totalEntitasDaftar = totalSantriDaftar + totalUndanganDaftar;
    const totalEntitasHadir = totalSantriHadir + undStat.hadirUndangan;

    if (totalEntitasDaftar === 0) {
      return `${headerIntro}Berdasarkan data sistem saat ini, **basis data seluruh peserta santri maupun tamu undangan masih kosong (0 data)** karena telah dibersihkan oleh panitia.

Us dapat menambahkan data baru atau memulihkan data bawaan sistem melalui:
[👉 Buka Manajemen Peserta](/admin/peserta) [👉 Buka Live Dasbor](/admin/dasbor)

Wonten ingkang saget dibantu Us?`;
    }

    return `${headerIntro}Alhamdulillah, berikut rekapitulasi data dan kesimpulan kehadiran global Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M. saat ini:

### 📊 Rekapitulasi Data Kehadiran Global:
- **Total Entitas Hadir**: **${totalEntitasHadir} dari ${totalEntitasDaftar} Entitas** (${totalSantriHadir} Keluarga Santri + ${undStat.hadirUndangan} Tamu Undangan).
- **Total Kursi Terisi**: **${stats.totalHadir} dari ${stats.totalKuota} Kursi** (**${stats.persentaseHadir}%** kapasitas aula).
- **Sisa Kursi Belum Terisi**: **${stats.sisaKuota} Kursi**.
- **Distribusi Rombongan**: Putra = **${stats.totalLaki} orang**, Putri = **${stats.totalPerempuan} orang**, Anak/Balita = **${stats.totalBalita} anak**.

### 🏛️ Rincian Ringkas Komposisi:
- 🌟 **Bil Ghoib**: ${bg.hadirPeserta}/${bg.totalPeserta} santri (${bg.totalHadir} kursi, ${stats.totalPanggung} Tiket Emas Panggung diserahkan).
- 📖 **Bin Nadzori**: ${bn.hadirPeserta}/${bn.totalPeserta} santri (${bn.totalHadir} kursi).
- 🎓 **Tamatan Aliyah**: ${tm.hadirPeserta}/${tm.totalPeserta} wisudawati (${tm.totalHadir} kursi).
- 🏛️ **Tamu Undangan Khusus**: ${undStat.hadirUndangan}/${undStat.totalUndangan} tokoh (${undStat.totalHadir} kursi).

### 💡 Kesimpulan:
Tingkat keterisian kursi Aula Muktamar saat ini mencapai **${stats.persentaseHadir}%**. Alur kedatangan melalui Gerbang Bola Dunia terpantau lancar (${stats.jalurBarat} scan Jalur Barat, ${stats.jalurTimur} scan Jalur Timur).

Us dapat memantau grafik kedatangan dan rincian tabel secara langsung di dasbor:
[👉 Buka Live Dasbor](/admin/dasbor) [👉 Buka Rekap Laporan](/admin/laporan)

Wonten ingkang saget dibantu Us?`;
  }

  if (
    q.includes('pembimbing') ||
    q.includes('dewan pembimbing') ||
    q.includes('bapak pembimbing') ||
    q.includes('asep darajat') ||
    q.includes('chamdan yuwafi') ||
    q.includes('abu yazid') ||
    q.includes('saiful nur kholis') ||
    q.includes('badru roin') ||
    q.includes('adi susilo') ||
    q.includes('maghfur fatoni')
  ) {
    return `${headerIntro}Berikut adalah susunan resmi **Dewan Pembimbing Haul dan Haflah Akhirussanah P3TQ-MHMTQ 1448 H./ 2027 M.** (12 Bagan Kepanitiaan):

1. **Kesekretariatan**: Bpk. Asep Darajat, Bpk. Chamdan Yuwafi Ni'amah, Bpk. Muhammad Ali Wafa Fuady, Bpk. Jana Prabu, Bpk. Zida Hikmana Ahmad'26, Bpk. Muhammad Yusri Sa'dulloh'26.
2. **Protokoler**: Bpk. Abu Yazid Al Bustomi* (Koord), Bpk. Abhaa Muhammad Kafaa Bihi** (Wakoord), Bpk. Sufyan Tsauri, Bpk. Taufiq Hidayah, Bpk. Lukman Ainul Yaqin'26.
3. **Akomodasi**: Bpk. Agus Ismanto, Bpk. Gama Maulana Ilham**, Bpk. Muhammad Harizal Fauzy, Bpk. Faja Fikrona Al Fattah, Bpk. Azwan, Bpk. Fikri Fadhilah, Bpk. Muhammad Mujib, Bpk. Teguh Prasetya'26, Bpk. Ahghus Ma'sum'26, Bpk. Muhammad Dasir'26.
4. **Konsumsi**: Bpk. Ahmad Rizal 'Abidin* (Koord), Bpk. Muhammad Taufiqurrohman**, Bpk. Muhammad Bahrul Ulum'25, Bpk. Muhammad Dzikri Umam'26.
5. **Berkatan**: Bpk. Muhammad Fikri Al Munawwar* (Koord), Bpk. M. Abdurrohman Maulana**, Bpk. Musa Fadlika Cahya'26, Bpk. Muhammad Khoirul Anam'26.
6. **Prasmanan Dzuriyah**: Bpk. Saiful Nur Kholis* (Koord), Bpk. Burhanuddin Isri**, Bpk. Lukman Syaher, Bpk. Noril Mulana, Bpk. Gilang Ramadhan, Bpk. Aji Fathur, Bpk. Badrul Kamal.
7. **Peladen**: Bpk. Muhammad Syaikhul 'Arifin* (Koord), Bpk. Ahmad Fathoni Fikri**, Bpk. Abdulloh Nadhif'26, Bpk. Khoirul Azmi'26.
8. **Penerima Tamu**: Bpk. Muhammad Badru Ro'in Amin* (Koord), Bpk. Imam Ghozali**, Bpk. Muhammad Najih, Bpk. Muhammad Izzuddin Assakhi, Bpk. Alex Alqomah, Bpk. Afif Cholilul Umam, Bpk. Affan Istikhori, Bpk. Subadar, Bpk. Muhammad Yazid Mahbubilah, Bpk. Muhammad Sabiqul Anam.
9. **Desain Grafis**: Bpk. Muhammad In'amul Muttaqin* (Koord), Bpk. Agung Shobirin**, Bpk. Sholekhuddin, Bpk. Ahmad Khoirul Rohman, Bpk. Fathul Hidayat'26, Bpk. Ilham Ma'shum Lirbiyani'26.
10. **Humasy & Kostum**: Bpk. Akfi Romiyan Kafabih, Bpk. Ahmad Abdulloh Faqih'26.
11. **Keamanan**: Bpk. Adi Susilo* (Koord), Bpk. Reza Fadhilul Ulum**, Bpk. Muhammad Taufiq, Bpk. Yahya Ngafifulloh, Bpk. Sa'dun Musthofa'26.
12. **PULP & TDM**: Bpk. Muhammad Maghfur Fatoni* (Koord), Bpk. Amin Nur Waluyo**, Bpk. Ahmad Nashoruddin, Bpk. Arif.

Wonten ingkang saget dibantu Us?`;
  }

  if (
    q.includes('denah') ||
    q.includes('peta') ||
    q.includes('tata letak') ||
    q.includes('lokasi') ||
    q.includes('posisi') ||
    q.includes('dimana') ||
    q.includes('di mana') ||
    q.includes('parkir') ||
    q.includes('mck') ||
    q.includes('wc') ||
    q.includes('toilet') ||
    q.includes('prasmanan') ||
    q.includes('panggung') ||
    q.includes('vvip') ||
    q.includes('vip') ||
    q.includes('duduk')
  ) {
    if (q.includes('panggung')) {
      return `${headerIntro}Berdasarkan **Denah Resmi Haul & Haflah 2027**:
📍 **Panggung Utama** terletak di **Tengah Depan Aula Utama** (menghadap ke sisi barat aula).
- Di belakang panggung terdapat **Basecamp Akomodasi PI & Tirai Hitam**.
- Di depan panggung utama diposisikan barisan kehormatan **VVIP (Sofa)** & **VIP (Kursi Elephant)** serta area **Takhtiman Bil-Ghoibi**.

[🗺️ Buka Denah Interaktif Haflah 2027](/denah)

Wonten ingkang saget dibantu malih Us?`;
    }

    if (q.includes('duduk') || q.includes('posisi saya') || q.includes('saya duduk')) {
      return `${headerIntro}Berikut panduan **Penempatan Tempat Duduk** berdasarkan Denah Resmi 2027:
- 👑 **VVIP & VIP**: Barisan Depan Kehormatan Panggung Utama (Sofa VVIP & Kursi Elephant VIP).
- 🌟 **Takhtiman Bil-Ghoibi**: Area Tengah Depan Panggung Utama (Merah Gold).
- 📖 **Takhtiman Bin-Nazhri**: Area Tengah Aula Utama (Biru Gold).
- 🎓 **Tamatan Aliyah**: Area Tengah-Belakang Aula Utama.
- 👨 **Wali Santri SH Putra**: Sayap Barat / Kiri Aula Utama.
- 👩 **Wali Santri SH Putri**: Sayap Timur / Kanan Aula Utama.
- 👥 **Tamu Undangan Umum**: Sisi Utara Panggung (Putra di Sayap Barat, Putri di Sayap Timur).

[🗺️ Buka Denah Interaktif Haflah 2027](/denah)

Wonten ingkang saget dibantu malih Us?`;
    }

    if (q.includes('prasmanan') || q.includes('makan')) {
      return `${headerIntro}Berdasarkan Denah Resmi 2027, terdapat **3 Titik Lokasi Prasmanan**:
1. 👑 **Prasmanan Lobi (PA & PI)**: Gedung Lobi Utama Sisi Utara (Khusus Dzurriyyah & Tamu VVIP/VIP, dipisah satir PA/PI).
2. 👨 **Prasmanan Wali Santri SH PA**: Sudut Barat Daya luar aula dekat Gerbang Utara & Markas PLP.
3. 👩 **Prasmanan Wali Santri SH PI**: Sisi Timur luar aula dekat Gerbang Selatan & Basecamp Konsumsi.

[🗺️ Buka Denah Interaktif Haflah 2027](/denah)

Wonten ingkang saget dibantu malih Us?`;
    }

    if (q.includes('parkir')) {
      return `${headerIntro}Berikut **Area Parkir Resmi Haflah 2027**:
- 🚗 **Parkir Mobil VVIP**: Sisi Barat-Utara Lobi Utama (dekat Ruang LAB & Kamar VVIP).
- 🚘 **Parkiran VIP**: Sisi Timur Lapangan (dekat Gerbang Selatan & Pos Keamanan 4).
- 🚌 **Parkir Umum & Wali Santri**: Lapangan sebelah barat Aula Al-Muktamar Lirboyo.

[🗺️ Buka Denah Interaktif Haflah 2027](/denah)

Wonten ingkang saget dibantu malih Us?`;
    }

    if (q.includes('mck') || q.includes('wc') || q.includes('toilet') || q.includes('kamar mandi')) {
      return `${headerIntro}Berikut lokasi **MCK & Kamar Mandi** terdekat:
- 🚻 **MCK Tamu & Santri**: Sisi Barat Aula (dekat Kantor Pesma & Ruang LAB).
- 🚾 **MCK VVIP**: Di dalam Gedung Lobi Utama (Sisi Utara Aula).

[🗺️ Buka Denah Interaktif Haflah 2027](/denah)

Wonten ingkang saget dibantu malih Us?`;
    }

    if (q.includes('vvip') || q.includes('jalur vvip')) {
      return `${headerIntro}Berikut **Jalur Akses Tamu VVIP & VIP**:
- 🚗 **Alur Masuk**: Lewat **Gerbang Timur** → Drop Point Dzurriyyah → Parkir Mobil VVIP / Gedung Lobi Utama.
- 🪑 **Tempat Duduk**: Barisan Depan Kehormatan (Sofa VVIP & Kursi Elephant VIP).
- 🍽️ **Prasmanan VVIP**: Lobi Utama Sisi Utara.

[🗺️ Buka Denah Interaktif Haflah 2027](/denah)

Wonten ingkang saget dibantu malih Us?`;
    }

    return `${headerIntro}Berdasarkan **Denah Resmi Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.**, berikut tata ruang dan zonasi operasional lapangan:

### 🗺️ Panduan Akses Gerbang & Alur:
1. **Gerbang Bola Dunia (Selatan)**: Pintu masuk utama undangan umum & keluarga shohibul hajat. Di luar gerbang terdapat **Tenda Satir U Kesekretariatan** (Putra di barat, Putri di timur).
2. **Gerbang Selatan**: Akses khusus masuk mobil dan iringan Dzurriyyah VIP / Masyayikh.
3. **Gerbang Timur**: Akses keluar mobil Dzurriyyah VIP serta akses menuju Ruang LAB & Parkir VVIP.
4. **Gerbang Utara**: Akses keluar umum rombongan undangan setelah acara.

### 🏛️ Zonasi Aula Muktamar (Gedung Utama):
- **Panggung Utama**: Berada di sisi Tengah Depan Aula Utama (menghadap ke barat). Di belakang panggung terdapat Basecamp Akomodasi PI & Tirai Hitam.
- **Barisan VIP Depan Panggung**:
  * **VVIP Putra (Sofa)** & **VIP Putra (Kursi Elephant)** di sayap barat.
  * **VVIP Putri (Sofa)** & **VIP Putri (Kursi Elephant)** di sayap timur. Disekat dengan **Satir Rangka**.
- **Zonasi Tengah Aula**:
  * **Takhtiman Bil-Ghoibi** (Wali Santri Bil Ghoib) di baris paling depan (Merah Gold).
  * **Takhtiman Bin-Nazhri** di belakang Bil Ghoibi (Biru Gold).
  * **Tamatan Aliyah** di area belakang tengah hingga batas tiang 7-8-12.
  * **Shooting Center**: Koridor tengah untuk kamera live streaming & dokumentasi.
- **Sayap Luar Aula**:
  * **Sayap Barat**: Tamu Undangan Umum PA & Wali Santri SH Putra (dilengkapi Layar LED & Satir Satu).
  * **Sayap Timur**: Tamu Undangan Umum PI & Wali Santri SH Putri samping luar (dilengkapi Layar LED & Satir Double).
  * **Belakang Aula**: Meja Operator (Sound/Lighting) & Wali Santri SH Putri.

### 🍱 3 Lokasi Titik Prasmanan:
1. **Prasmanan Lobi (Gedung Timur)**: Khusus Dzurriyyah & VVIP/VIP (terpisah Lobi PA dan PI dengan sekat Satir Kayu, Kamar VVIP, dan MCK).
2. **Prasmanan Wali Santri PI**: Di samping timur aula dekat Gerbang Selatan.
3. **Prasmanan Wali Santri PA**: Di sudut barat daya luar aula dekat Gerbang Utara & Markas PLP.

### 🧕 Area Khusus Santri:
Terletak memanjang di sisi selatan aula, dipagari penuh dengan **Satir Double** yang memisahkannya secara syar'i dari jalur tamu undangan putra.

[🗺️ Buka Denah Interaktif Haflah 2027](/denah)

Wonten ingkang saget dibantu Us?`;
  }


  if (
    q.includes('bil ghoib') ||
    q.includes('bilghoib') ||
    q.includes('emas') ||
    q.includes('panggung')
  ) {
    return `${headerIntro}Alhamdulillah, Us AI bantu jelaskan mengenai ketentuan khusus untuk **Santriwati Bil Ghoib (Khadimatul Qur'an 30 Juz)** pada Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M. ya:

### 🌟 Hak Kuota & Tiket Khusus Bil Ghoib (64 Santriwati)
1. **Hak Kuota Dasar**: Setiap santriwati Bil Ghoib berhak atas **4 Kursi Keluarga** di Aula Muktamar.
2. **Tiket Emas Panggung Kehormatan**:
   - Mendapatkan **1 Tiket Khusus Panggung (Gelang Emas Hologram)**.
   - Tiket ini secara syar'i & protokoler diperuntukkan khusus bagi **Ibu Kandung Santriwati** untuk mendampingi sang putri saat prosesi penganugerahan mahkota dan sanad di atas panggung utama bersama para Bu Nyai.
3. **Warna Fisik Gelang Tiket**:
   - **Gelang Hijau**: Untuk 4 anggota keluarga yang duduk di kursi reguler aula.
   - **Gelang Emas Hologram**: Untuk Ibu Pendamping panggung.
4. **Pengaturan Zonasi Kursi**:
   - Ayah/wali laki-laki: Sayap Barat Aula Muktamar.
   - Keluarga perempuan: Sayap Timur Aula Muktamar.
   - Ibu Pendamping: Baris Kehormatan Depan Panggung sebelum dipanggil ke panggung utama.

Semoga berkah hafalan Al-Qur'an 30 juz ananda senantiasa memancarkan kemuliaan bagi keluarga dan pondok tercinta! ✨`;
  }

  if (
    q.includes('bin nadzor') ||
    q.includes('binnadzor') ||
    q.includes('tsanawiyah') ||
    q.includes('aliyah')
  ) {
    return `${headerIntro}Us AI dengan senang hati merincikan data **Santriwati Takhtiman Bin Nadzori** pada Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.:

### 📘 Rincian Santriwati Bin Nadzori (Total 159 Santriwati)
Peserta Takhtiman Bin Nadzori terbagi dalam 6 jenjang kelas riil:
- **2 Tsanawiyyah**: 5 Santriwati (10 Tiket Biru)
- **3 Tsanawiyyah**: 21 Santriwati (42 Tiket Biru)
- **1 Aliyah**: 42 Santriwati (84 Tiket Biru)
- **2 Aliyah**: 59 Santriwati (118 Tiket Biru)
- **3 Aliyah & Mutakhorijat**: 32 Santriwati (64 Tiket Biru)

### 🎫 Hak Kuota & Warna Tiket:
- **Hak Kuota Dasar**: **2 Kursi Keluarga** di Aula Muktamar.
- **Warna Gelang Tiket**: **Biru**.
- **Tiket Panggung**: Tidak memiliki jatah tiket panggung (panggung dikhususkan untuk Bil Ghoib 30 Juz).
- **Kuota Tambahan**: Jika keluarga ingin hadir lebih dari 2 orang, dapat mengajukan kuota tambahan seharga **Rp 80.000/kursi** (maksimal 2 kursi).`;
  }

  if (q.includes('tamatan') || q.includes('bagian') || q.includes('wisudawati')) {
    return `${headerIntro}Berikut informasi lengkap mengenai **Wisudawati Tamatan Madrasah MHMTQ (Aliyah)** untuk Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.:

### 🎓 Komposisi Santriwati Tamatan (Total 326 Santriwati)
Wisudawati Tamatan terbagi ke dalam **7 Bagian Kelompok Wisuda**:
- **Bagian A.01, A.02, A.03, A.04**
- **Bagian B.01, B.02, B.03**

### 🎫 Kuota & Fasilitas:
- **Hak Kuota Dasar**: **2 Kursi Keluarga** di Aula Muktamar (Total 652 Kursi Jatah Dasar Tamatan).
- **Warna Gelang Tiket**: **Kuning**.
- **Penempatan Tempat Duduk**: Dikelompokkan per abjad bagian di Sayap Barat (Putra) dan Sayap Timur (Putri) guna memudahkan pemanggilan saat seremoni muwada'ah.`;
  }

  if (
    q.includes('kuota tambahan') ||
    q.includes('bayar') ||
    q.includes('transfer') ||
    q.includes('bri') ||
    q.includes('80.000') ||
    q.includes('6 jam')
  ) {
    return `${headerIntro}Berikut alur resmi **Pemesanan & Verifikasi Kuota Tambahan** pada Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.:

### 💳 Ketentuan Kuota Tambahan (Pagu 300 Kursi):
1. **Harga & Rekening**:
   - Biaya: **Rp 80.000 per kursi** (maksimal 2 kursi tambahan per santri).
   - Rekening Resmi: **Bank BRI 320701010266508** a.n. **Ahmad Chamdan Yuwafin**.
2. **Alur Sistem Terkini (SLA 6 Jam)**:
   - **Langkah 1 (Pemesanan)**: Wali santri memilih kuota tambahan melalui portal e-invitation.
   - **Langkah 2 (Penguncian Slot 6 Jam)**: Sistem mengunci slot kursi selama **6 jam** agar tidak diserobot wali lain.
   - **Langkah 3 (Upload Bukti)**: Wali mengunggah foto struk mutasi/transfer sebelum 6 jam berakhir.
   - **Langkah 4 (Verifikasi Panitia 6 Jam)**: Petugas bendahara memvalidasi mutasi di menu *Verifikasi Kuota Tambahan*.
   - **Langkah 5 (Auto-Approval 12 Jam)**: Jika panitia berhalangan dan belum memverifikasi dalam tempo 12 jam, sistem secara otomatis meloloskan pesanan demi kenyamanan wali santri.
3. **Pagu Kuota**: Dibatasi ketat **300 kursi** demi kenyamanan kapasitas aula.`;
  }

  if (
    q.includes('rekon') ||
    q.includes('rekonsiliasi') ||
    q.includes('kasus khusus') ||
    q.includes('hp mati') ||
    q.includes('baterai') ||
    q.includes('batal') ||
    q.includes('edit')
  ) {
    return `${headerIntro}Meja Rekonsiliasi adalah unit pengendali kendala lapangan pada Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.. Us AI jelaskan fungsinya:

### 🏛️ Meja Rekonsiliasi & Kasus Khusus Gerbang
- **Posisi Lokasi**: Berada di **sisi dalam Gerbang Selatan (Tugu Bola Dunia)**, bersebelahan dengan Tenda Transit Panitia.
- **5 Layanan Utama Meja Rekon**:
  1. **Tamu Walk-in & HP Mati**: Mencari data wali via nama santri / asal kota / nomor telepon, lalu menerbitkan gelang barcode fisik langsung di tempat.
  2. **Koreksi Kehadiran (Audit)**: Mengubah status *Sudah Hadir* $\\leftrightarrow$ *Belum Hadir* jika tamu batal masuk atau keliru di-scan.
  3. **Mutasi Kategori Santri**: Merubah kategori (Bil Ghoib / Bin Nadzori / Tamatan) dan secara otomatis menyesuaikan jatah tiket serta gelang panggung.
  4. **Penyesuaian Kuota Tambahan**: Menambah atau mencabut kuota berbayar langsung di lapangan dengan stepper (+/-).
  5. **Berita Acara Digital**: Setiap tindakan tercatat dalam audit log untuk transparansi laporan pertanggungjawaban panitia.`;
  }

  if (
    q.includes('lokasi') ||
    q.includes('tempat') ||
    q.includes('denah') ||
    q.includes('alamat') ||
    q.includes('parkir') ||
    q.includes('aula')
  ) {
    return `${headerIntro}Berikut panduan **Denah & Titik Lokasi Penting Acara Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.**:

### 📍 Panduan Lokasi Pondok Pesantren Lirboyo:
- **Pusat Acara**: **Aula Muktamar Pondok Pesantren Lirboyo**, Jl. HM. Winarto, Campurejo, Kec. Mojoroto, Kota Kediri, Jawa Timur 64117.
- **Pintu Gerbang Utama**: **Gerbang Selatan (Tugu Bola Dunia)**.
  - Jalur Barat: Khusus rombongan Wali Laki-laki.
  - Jalur Timur: Khusus rombongan Wali Perempuan.
  - Sisi Tengah/Dalam: Meja Rekonsiliasi & Petugas Gelang.
- **Tata Ruang Aula Muktamar**:
  - **Panggung Utama**: Area Khidmat Khotmil Qur'an Bil Ghoib & Dewan Masyayikh.
  - **Baris Kehormatan VIP**: Tepat di depan panggung untuk Masyayikh Sepuh & Pejabat Forkopimda.
  - **Sayap Barat**: Seluruh kursi wali santri putra.
  - **Sayap Timur**: Seluruh kursi wali santri putri.
- **Fasilitas Umum**:
  - **Posko Medis/P3K**: Samping Barat Pintu Masuk Aula Muktamar.
  - **Area Parkir Bus/Elf**: Lapangan Parkir Barat.
  - **Area Parkir Mobil Pribadi & Motor**: Lapangan Parkir Timur.`;
  }

  if (
    q.includes('tamu') ||
    q.includes('undangan') ||
    q.includes('vip') ||
    q.includes('masyayikh') ||
    q.includes('penguji') ||
    q.includes('kehormatan')
  ) {
    return `${headerIntro}Mengenai **Tamu Undangan Khusus Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.**, seluruh data dikelola secara realtime 100% dari database Supabase:

### 🏛️ 3 Golongan Tamu Undangan:
1. **🌟 Tamu Undangan Istimewa**:
   - Keluarga Ndalem Dzurriyah & VIP Kehormatan (Tiket E-Invitation VIP).
2. **🏛️ Tamu Undangan Kehormatan**:
   - Para Masyayikh, Pesantren Cabang, & Pejabat Pemerintahan (Forkopimda).
3. **👥 Tamu Undangan Umum & Penguji**:
   - Penguji Al-Qur'an & Asatidz Purna Bakti MHMTQ.

Seluruh tamu undangan berhak atas jalur prioritas di Gerbang Utama tanpa antrian reguler dan menempati baris kehormatan Aula Muktamar.

[👉 Buka Data Peserta & Tamu](/admin/peserta) [👉 Buka Live Dasbor](/admin/dasbor)`;
  }

  if (q.includes('konsumsi') || q.includes('makan') || q.includes('porsi')) {
    return `${headerIntro}Terkait logistik konsumsi Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M., panitia menerapkan rumus efisiensi berbasis data empiris:

### 🍱 Formula Perhitungan Konsumsi Panitia (§18.2):
$$\\text{Total Porsi Konsumsi} = \\text{Total Kuota Global} \\times 0.87 \\times 1.05$$

**Penjelasan Cerdas Formula Us AI**:
- **Faktor 0.87 (87%)**: Tingkat kehadiran riil puncak serentak pada acara puncak Haflah Lirboyo berdasarkan data empiris.
- **Faktor 1.05 (+5%)**: Cadangan keamanan (*safety buffer*) untuk antisipasi tamu spontan, pengemudi rombongan, dan petugas jaga.
- **Manfaat**: Menghindari pemborosan makanan (mubadzir) serta menghemat anggaran konsumsi tanpa pernah kekurangan porsi.`;
  }

  if (
    q.includes('jadwal') ||
    q.includes('rundown') ||
    q.includes('waktu') ||
    q.includes('mulai') ||
    q.includes('hangus')
  ) {
    return `${headerIntro}Berikut jadwal dan linimasa waktu pelaksanaan **Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.**:

### ⏰ Linimasa Acara (Sabtu, 02 Januari 2027 / 1448 H):
- **06.00 WIB**: Gerbang Selatan Bola Dunia dibuka resmi. Pemeriksaan scanner barcode Jalur Barat & Timur mulai beroperasi.
- **06.30 WIB**: Pra-acara & lantunan Shalawat Qasidah santriwati MHMTQ di Aula Muktamar.
- **07.30 WIB**: Pembukaan resmi, pembacaan Ayat Suci Al-Qur'an, dan pembacaan Tahlil Masyayikh.
- **08.30 WIB**: Prosesi Khotmil Qur'an Bil Ghoib 30 Juz & Bin Nadzori.
- **10.30 WIB**: Seremoni Muwada'ah Wisudawati Tamatan III Aliyah (7 Bagian).
- **11.30 WIB (T+300 Menit)**: Batas waktu hangus kuota bagi kursi yang belum check-in tanpa konfirmasi ke Meja Rekon.
- **12.15 WIB**: Mau'idhoh Khasanah & Doa Restu oleh Masyayikh Sepuh.
- **13.00 WIB**: Penutupan & ramah tamah.`;
  }

  // =========================================================================
  // DETEKSI KHUSUS: KEBINGUNGAN / BUTUH PANDUAN CEPAT ("SAYA BINGUNG")
  // =========================================================================
  if (
    q.includes('bingung') ||
    q.includes('bantu saya') ||
    q.includes('tolong saya') ||
    q.includes('panduan') ||
    q.includes('cara pakai') ||
    q.includes('harus bagaimana') ||
    q.includes('gimana caranya')
  ) {
    return `${headerIntro}Mboten usah bingung Us, Ustadzah AI siap mendampingi panitia dan keluarga tamu shohibul hajat dengan senang hati! 😊

Kira-kira babagan (hal) menapa yang sedang membuat Us bingung?
1. 🎟️ **Pemesanan Kuota & Tiket Masuk**: Kuota dasar 2 kursi, pemesanan tambahan maksimal 4 kursi (Rp 80.000/kursi) dengan batas waktu konfirmasi transfer 6 jam.
2. 🕌 **Jadwal & Rundown Acara**: Gerbang dibuka pukul 06.00 WIB, Khotmil Qur'an Bil Ghoib & Bin Nadzori pukul 08.30 WIB.
3. 🗺️ **Denah Tempat Duduk**: Sayap Barat untuk tamu putra & Sayap Timur untuk tamu putri. Tiket Emas panggung kehormatan khusus Ibu Kandung Bil Ghoib.
4. 📱 **Alur Presensi Gerbang & Meja Rekon**: Tunjukkan QR Code di HP atau cetak fisik. Jika HP mati atau ada kendala tiket, langsung ke Meja Rekonsiliasi di tenda satir.

[👉 Buka Live Dasbor](/admin/dasbor) [🗺️ Buka Denah Interaktif](/denah) [👉 Buka Meja Rekon](/rekon)

Wonten ingkang saget dibantu malih Us?`;
  }

  // =========================================================================
  // DETEKSI KHUSUS: FIQIH IBADAH DASAR (SHOLAT, WUDHU, RUKUN ISLAM & IMAN)
  // =========================================================================
  if (q.includes('rukun sholat') || q.includes('rukun solat') || (q.includes('rukun') && q.includes('sholat'))) {
    return `${headerIntro}Berdasarkan kitab fiqih mu'tabar mazhab Syafi'i (seperti *Safinatun Naja* dan *Fathul Qorib*), **Rukun Sholat ada 13 perkara** (atau 17 perkara bila thuma'ninah dihitung terpisah):

1. **Niat** (di dalam hati berbarengan dengan takbiratul ihram)
2. **Berdiri bagi yang mampu** (pada sholat fardhu)
3. **Takbiratul Ihram** (mengucapkan *Allahu Akbar*)
4. **Membaca Surat Al-Fatihah** (pada setiap rakaat beserta basmalah & tajwidnya)
5. **Ruku'** serta **Thuma'ninah** (tenang sejenak sekadar membaca tasbih)
6. **I'tidal** serta **Thuma'ninah**
7. **Sujud dua kali** serta **Thuma'ninah**
8. **Duduk di antara dua sujud** serta **Thuma'ninah**
9. **Duduk untuk Tasyahud Akhir**
10. **Membaca Tasyahud Akhir**
11. **Membaca Shalawat atas Nabi SAW** pada tasyahud akhir
12. **Mengucapkan Salam Pertama** (menoleh ke kanan)
13. **Tertib** (melaksanakan rukun-rukun di atas secara berurutan)

> إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا

Semoga ibadah sholat kita senantiasa diterima oleh Allah SWT. Wonten ingkang saget dibantu malih Us?`;
  }

  if (q.includes('rukun wudhu') || q.includes('rukun wudlu') || (q.includes('rukun') && q.includes('wudhu'))) {
    return `${headerIntro}Menurut mazhab Syafi'i, **Rukun Wudhu ada 6 perkara**:

1. **Niat** ketika membasuh sebagian wajah
2. **Membasuh seluruh muka / wajah**
3. **Membasuh kedua tangan beserta kedua siku**
4. **Mengusap sebagian kulit atau rambut kepala**
5. **Membasuh kedua kaki beserta kedua mata kaki**
6. **Tertib** (berurutan dari awal sampai akhir)

Wonten ingkang saget dibantu malih Us?`;
  }

  if (q.includes('rukun islam')) {
    return `${headerIntro}**Rukun Islam ada 5 perkara**:
1. Mengucapkan dua kalimat syahadat (*Asyhadu alla ilaha illallah wa asyhadu anna Muhammadar Rasulullah*)
2. Mendirikan sholat lima waktu
3. Menunaikan zakat
4. Menjalankan puasa di bulan Ramadhan
5. Menunaikan ibadah haji ke Baitullah bagi yang mampu.

Wonten ingkang saget dibantu malih Us?`;
  }

  if (q.includes('rukun iman')) {
    return `${headerIntro}**Rukun Iman ada 6 perkara**:
1. Iman kepada Allah SWT
2. Iman kepada Malaikat-malaikat Allah
3. Iman kepada Kitab-kitab Allah
4. Iman kepada Rasul-rasul Allah
5. Iman kepada Hari Akhir (Kiamat)
6. Iman kepada Qadha dan Qadar (takdir baik maupun buruk dari Allah SWT).

Wonten ingkang saget dibantu malih Us?`;
  }

  // Jawaban Cerdas Standar (Ringkas & Santun)
  return `${headerIntro}Wonten ingkang saget dibantu Us? Silakan sampaikan pertanyaan seputar pelaksanaan Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M., Us AI siap membantu dengan senang hati! 😊`;
}

function cleanReplyForSession(rawReply: string, isFirstTurn: boolean, userPrompt?: string, role: string = 'WALI'): string {
  let reply = rawReply.trim();

  // Safety override jika model AI beralasan data agregat atau salah mengklaim tokoh yang sudah hadir sebagai belum hadir
  if (userPrompt) {
    const pLower = userPrompt.toLowerCase();
    const rLower = reply.toLowerCase();

    // 1. Jika model beralasan nama belum ditampilkan / data agregat
    if (
      rLower.includes('ringkasan agregat') ||
      rLower.includes('belum dipublikasikan secara rinci') ||
      rLower.includes('belum ditampilkan dalam ringkasan') ||
      rLower.includes('belum menyediakan tampilan nama individual') ||
      rLower.includes('tidak memiliki akses ke daftar nama') ||
      rLower.includes('nama individual belum') ||
      rLower.includes('nama lengkap belum')
    ) {
      return generateLocalSmartResponse(userPrompt, isFirstTurn, role);
    }


  }

  // 1. Ganti sapaan lama "Wonten ingkang saget Us AI bantu, Kang atau Mbak?..." menjadi "Wonten ingkang saget dibantu Us?"
  reply = reply.replace(
    /wonten\s+ingkang\s+saget\s+us\s+ai\s+bantu[,\s]+kang\s+atau\s+mbak\?[^.\n]*([.\n]|$)/gi,
    'Wonten ingkang saget dibantu Us?\n'
  );
  reply = reply.replace(
    /wonten\s+ingkang\s+saget\s+(us\s+ai\s+)?bantu[,\s]+(kang\s+utawi\s+mbak|kang\s+atau\s+mbak)\?/gi,
    'Wonten ingkang saget dibantu Us?'
  );

  // 2. Bersihkan panggilan Kang atau Mbak menjadi Us
  reply = reply.replace(/Kang\s+atau\s+Mbak/gi, 'Us');
  reply = reply.replace(/\b(Kang|Mbak)\b/g, 'Us');

  // 3. Pastikan nama MHMTQ selalu Fittahfizhi wal Qiro-at
  reply = reply.replace(
    /Madrasah\s+Hidayatul\s+Mubtadi-aat\s+Tahfizhil\s+Qur-an/gi,
    'Madrasah Hidayatul Mubtadi-aat Fittahfizhi wal Qiro-at'
  );
  reply = reply.replace(
    /Madrasah\s+Hidayatul\s+Mubtadi-aat\s+fittahfizhi\s+wal\s+Qiro-at/gi,
    'Madrasah Hidayatul Mubtadi-aat Fittahfizhi wal Qiro-at'
  );

  // 4. Aturan Salam (Hanya di awal sesi chat)
  if (!isFirstTurn) {
    // Jika BUKAN awal sesi (turn ke-2 dst):
    // Bersihkan salam pembuka jika model AI tetap mengeluarkannya
    reply = reply
      .replace(
        /^(wa'?alaikum\s*salam(\s*wr\.?\s*wb\.?)?|waalaikumsalam(\s*wr\.?\s*wb\.?)?|assalamu'?alaikum(\s*wr\.?\s*wb\.?)?|assalamu'?alaikum\s*warahmatullahi\s*wabarakatuh)[!.,\s-]*/i,
        ''
      )
      .trim();
  } else {
    // Jika AWAL SESI (turn ke-1):
    // Ganti salam "Assalamu'alaikum..." menjadi "Wa'alaikum Salam Wr. Wb." jika model tidak sengaja memakai Assalamu'alaikum
    reply = reply
      .replace(
        /^(assalamu'?alaikum\s*warahmatullahi\s*wabarakatuh|assalamu'?alaikum\s*wr\.?\s*wb\.?|assalamu'?alaikum)[!.,\s-]*/i,
        "Wa'alaikum Salam Wr. Wb.! "
      )
      .trim();
  }

  // Amankan frasa penegasan "Pondok Pesantren Lirboyo Pusat" agar tidak tertimpa
  reply = reply.replace(/Pondok\s+Pesantren\s+Lirboyo\s+Pusat/gi, '___LIRBOYO_PUSAT___');

  reply = reply.replace(
    /Saya\s+Ustadzah\s+AI[^\n.]*asisten\s+cerdas\s+resmi\s+yang\s+mendampingi\s+pelaksanaan\s+Haul\s*&\s*Haflah[^.]*di\s+Pondok\s+Pesantren\s+Lirboyo\s+Kediri/gi,
    'Perkenalkan, saya Ustadzah AI, atau biasa dipanggil Us AI. Us AI adalah asisten cerdas resmi yang mendampingi pelaksanaan Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.'
  );
  reply = reply.replace(
    /Haul\s*&\s*Haflah\s*(Ke-?V\s*)?(di\s+)?Pondok\s+Pesantren\s+Lirboyo(\s+Kediri)?/gi,
    'Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.'
  );
  reply = reply.replace(
    /pelaksanaan\s+Haul\s*&\s*Haflah(\s+Ke-?V)?\s+di\s+Pondok\s+Pesantren\s+Lirboyo(\s+Kediri)?/gi,
    'pelaksanaan Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.'
  );
  reply = reply.replace(
    /Haul\s*&\s*Haflah\s+Ke-?V\b/gi,
    'Haul & Haflah P3TQ dan MHMTQ'
  );
  reply = reply.replace(
    /Haul\s*&\s*Haflah\s+P3TQ-MHMTQ(\s+2027)?/gi,
    'Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.'
  );
  reply = reply.replace(
    /Haul\s*&\s*Haflah\s+P3TQ\s*&\s*MHMTQ\s+Lirboyo/gi,
    'Haul & Haflah P3TQ dan MHMTQ'
  );

  // Kembalikan frasa resmi Pusat
  reply = reply.replace(/___LIRBOYO_PUSAT___/g, 'Pondok Pesantren Lirboyo Pusat');
  reply = reply.replace(
    /Haul\s*&\s*Haflah\s+P3TQ\s+dan\s+MHMTQ[^\n.]*Pusat/gi,
    'Haul & Haflah Pondok Pesantren Lirboyo Pusat'
  );

  // Bersihkan tanda titik ganda jika ada
  reply = reply.replace(/\.\.+/g, '.');

  return reply;
}

function detectExpression(
  text: string,
  prompt: string,
  isFirstTurn: boolean
): 'wave' | 'happy' | 'wink' | 'welcome' | 'thinking' | 'polite' {
  const c = (text + ' ' + prompt).toLowerCase();

  // 1. Sapaan / Awal Sesi
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

  // 2. Berpikir / Analitis / Masalah teknis / Rekonsiliasi / Kuota & Biaya / Rumus
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

  // 3. Senang / Syukur / Prestasi / Wisuda / Bil Ghoib 30 Juz
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

  // 4. Menyambut / Gerbang / Lokasi / Denah / Tempat Duduk / Jalur
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

  // 5. Tips cerdas / Trik praktis / Rekomendasi
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

  // 6. Santun / Masyayikh / Jadwal / Umum
  if (
    c.includes('masyayikh') ||
    c.includes('tamu') ||
    c.includes('undangan') ||
    c.includes('jadwal') ||
    c.includes('rundown') ||
    c.includes('waktu') ||
    c.includes('kehormatan')
  ) {
    return 'polite';
  }

  return 'polite';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, history, apiKey: clientApiKey, role, userRole } = body;
    const currentRole = role || userRole || "WALI";

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Deteksi apakah ini awal sesi chat atau percakapan lanjutan
    // Jika belum ada pesan dari user di riwayat, berarti ini pesan pertama (awal sesi chat)
    const userMessageCount = Array.isArray(history)
      ? history.filter((item: any) => item.role === 'user').length
      : 0;
    const isFirstTurn = userMessageCount === 0;

    // Fast-path kilat untuk sapaan awal sederhana (merespon instan dalam 0.005 detik)
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
      qLower === 'tes';

    // 1. Deteksi pertanyaan STATISTIK KEHADIRAN -> Kembalikan Pie Chart + Rincian Teks
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
        model: 'Us AI Live Stats Engine',
        chart: stats.chart,
      });
    }

    // 1.5. Deteksi pertanyaan DAFTAR TAMU UNDANGAN YANG HADIR ("tamu undangan siapa yang hadir?")
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
        model: 'Us AI Live Database Engine',
      });
    }

    // 1.6. Deteksi pertanyaan DAFTAR WALI SANTRI YANG HADIR ("siapa yang sudah hadir? wali santri", "wali santri yang hadir")
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
        model: 'Us AI Live Database Engine',
      });
    }

    // 2. Pencarian spesifik tamu/peserta secara LIVE di Supabase (tamu_undangan & presensi_log)
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
        model: 'Us AI Live Database Engine',
      });
    }

    // Fast-path kilat: Cek apakah pertanyaan pengguna sudah terjawab presisi di Local Smart Engine
    const localSmartResult = generateLocalSmartResponse(prompt, isFirstTurn, currentRole);
    const isGenericFallback = localSmartResult.includes("Wonten ingkang saget dibantu Us? Silakan sampaikan pertanyaan seputar pelaksanaan Haul & Haflah");

    if (!isGenericFallback || isGreetingPrompt) {
      const cleanReply = cleanReplyForSession(localSmartResult, isFirstTurn, prompt);
      const expr = detectExpression(cleanReply, prompt, isFirstTurn);
      return NextResponse.json({
        reply: cleanReply,
        expression: expr,
        avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
        source: 'smart_knowledge_engine',
        model: isGreetingPrompt ? 'Us AI Fast Response' : 'Us AI Knowledge Engine (Realtime)',
      });
    }

    const sessionPromptDirective = isFirstTurn
      ? "\n\n[PANDUAN SESI: Ini adalah awal sesi obrolan. Jawab salam dengan \"Wa'alaikum Salam Wr. Wb.\". PENTING: Acara ini adalah \"Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.\", BUKAN acara Ponpes Lirboyo Pusat! DILARANG menyebut \"Haul & Haflah di Pondok Pesantren Lirboyo\". Jika memperkenalkan diri, gunakan: \"Perkenalkan, saya Ustadzah AI, atau biasa dipanggil Us AI. Us AI adalah asisten cerdas resmi yang mendampingi pelaksanaan Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.\". Jika menawarkan bantuan atau menyapa, gunakan \"Wonten ingkang saget dibantu Us?\".]"
      : "\n\n[PANDUAN SESI: Ini adalah percakapan lanjutan dalam sesi chat yang sedang berlangsung. PENTING: DILARANG MENJAWAB ATAU MENGULANG SALAM (\"Wa'alaikum Salam Wr. Wb.\" ataupun \"Assalamu'alaikum\"). Langsung jawab ke inti pertanyaan secara to-the-point dan santun. Sapa pengguna dengan \"Us\", bukan \"Kang\" atau \"Mbak\". PENTING: Acara ini adalah \"Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.\", BUKAN acara Ponpes Lirboyo Pusat. Jika menawarkan bantuan, gunakan \"Wonten ingkang saget dibantu Us?\".]";

    const liveDataPrompt = await getLiveSupabaseGuestPrompt(prompt);
    const dynamicSystemPrompt = `${HAFLAH_KNOWLEDGE_SYSTEM_PROMPT}\n\n${liveDataPrompt}${sessionPromptDirective}

[PANDUAN KEPANITIAAN & DATA RESMI: Jika ditanya mengenai susunan panitia, divisi kesekretariatan, ketua, bendahara, seksi-seksi, ataupun teknis gerbang dan denah, Anda WAJIB memberikan nama-nama dan data aktual yang sudah tercantum lengkap di atas. DILARANG menyatakan kepengurusan belum diputuskan atau menyuruh mengecek SK lain, karena data kepanitiaan di atas adalah data resmi final SK Haflah 1448 H./ 2027 M.]`;

    // Identifikasi Kunci API (Klien / Environment)
    const geminiApiKey =
      (clientApiKey && (clientApiKey.startsWith('AQ.') || clientApiKey.startsWith('AIza')) ? clientApiKey : null) ||
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    const groqApiKey =
      (clientApiKey && clientApiKey.startsWith('gsk_') ? clientApiKey : null) ||
      process.env.GROQ_API_KEY ||
      process.env.NEXT_PUBLIC_GROQ_API_KEY;

    const anthropicApiKey =
      (clientApiKey && clientApiKey.startsWith('sk-ant-') ? clientApiKey : null) ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;

    const openAiApiKey =
      (clientApiKey && clientApiKey.startsWith('sk-proj-') ? clientApiKey : null) ||
      process.env.OPENAI_API_KEY ||
      process.env.NEXT_PUBLIC_OPENAI_API_KEY;

    const zhipuApiKey =
      (clientApiKey && clientApiKey.includes('.') && clientApiKey.length >= 30 ? clientApiKey : null) ||
      process.env.ZHIPU_API_KEY ||
      process.env.NEXT_PUBLIC_ZHIPU_API_KEY;

    const deepseekApiKey =
      (clientApiKey && !clientApiKey.startsWith('sk-proj-') && !clientApiKey.startsWith('sk-ant-') && clientApiKey.startsWith('sk-') ? clientApiKey : null) ||
      process.env.DEEPSEEK_API_KEY ||
      process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;

    // Siapkan riwayat obrolan format standar OpenAI / Groq / DeepSeek
    const standardMessages: any[] = [
      { role: 'system', content: dynamicSystemPrompt },
    ];
    if (Array.isArray(history) && history.length > 0) {
      for (const item of history.slice(-6)) {
        standardMessages.push({
          role: item.role === 'assistant' ? 'assistant' : 'user',
          content: item.content,
        });
      }
    }
    standardMessages.push({ role: 'user', content: prompt });

    // =========================================================================
    // TIER 1: GOOGLE GEMINI (Multi-Key Pool & Smart Auto-Rotation / Failover)
    // =========================================================================
    const candidateGeminiKeys = geminiPool.getCandidateKeys(clientApiKey).slice(0, 3);
    const candidateGeminiModels = geminiPool.getModelCandidates();

    if (candidateGeminiKeys.length > 0) {
      for (const currentGeminiKey of candidateGeminiKeys) {
        let keySucceeded = false;

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
              headers: { 'Content-Type': 'application/json' },
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
                return NextResponse.json({
                  reply: cleanReply,
                  expression: expr,
                  avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
                  source: 'gemini_api',
                  model: `Gemini (${currentModel})`,
                  keyPreview: geminiPool.maskKey(currentGeminiKey),
                });
              }
            } else {
              // Jika status 429 atau 503, tandai cooldown dan langsung ganti kunci berikutnya tanpa menunggu lama
              geminiPool.markFailure(currentGeminiKey, geminiRes.status, geminiRes.status === 429 ? 60 : 30);
              break;
            }
          } catch (geminiError) {
            geminiPool.markFailure(currentGeminiKey, 500, 30);
            break;
          }
        }

        if (keySucceeded) break;
      }
    }

    // =========================================================================
    // TIER ZHIPU AI: GLM Flash Models (glm-5.3-flash / glm-4-flash)
    // =========================================================================
    if (zhipuApiKey) {
      const zhipuModels = ['glm-5.3-flash', 'glm-4-flash', 'glm-4.5-air'];
      for (const zModel of zhipuModels) {
        try {
          const zhipuRes = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${zhipuApiKey}`,
            },
            signal: AbortSignal.timeout(3000),
            body: JSON.stringify({
              model: zModel,
              messages: standardMessages,
              temperature: 0.35,
              max_tokens: 600,
            }),
          });

          if (zhipuRes.ok) {
            const zhipuData = await zhipuRes.json();
            const replyText = zhipuData?.choices?.[0]?.message?.content;
            if (replyText) {
              const cleanReply = cleanReplyForSession(replyText, isFirstTurn, prompt);
              const expr = detectExpression(cleanReply, prompt, isFirstTurn);
              return NextResponse.json({
                reply: cleanReply,
                expression: expr,
                avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
                source: 'zhipu_ai',
                model: `${zModel.toUpperCase()} (Zhipu AI)`,
              });
            }
          }
        } catch (zhipuError) {
          // failover quietly to next model or next tier
        }
      }
    }

    // =========================================================================
    // TIER 2: GROQ LPU (Model GPT-OSS 20B / Qwen 27B - 100% Free & Super Kilat 0.1s)
    // =========================================================================
    if (groqApiKey) {
      try {
        const groqSysPrompt = dynamicSystemPrompt.length > 3500
          ? dynamicSystemPrompt.slice(0, 3500) + '\n\n[Ringkasan Data Selesai]'
          : dynamicSystemPrompt;
        const groqMessages = [
          { role: 'system', content: groqSysPrompt },
          ...standardMessages.slice(1),
        ];

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqApiKey}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          },
          signal: AbortSignal.timeout(3000),
          body: JSON.stringify({
            model: 'openai/gpt-oss-20b',
            messages: groqMessages,
            temperature: 0.35,
            max_tokens: 600,
          }),
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const replyText = groqData?.choices?.[0]?.message?.content;
          if (replyText) {
            const cleanReply = cleanReplyForSession(replyText, isFirstTurn, prompt);
            const expr = detectExpression(cleanReply, prompt, isFirstTurn);
            return NextResponse.json({
              reply: cleanReply,
              expression: expr,
              avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
              source: 'groq_lpu',
              model: 'Groq (GPT-OSS 20B)',
            });
          }
        } else {
          // Fallback internal ke model Qwen 27B di Groq
          const groqQwenRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${groqApiKey}`,
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            },
            signal: AbortSignal.timeout(3000),
            body: JSON.stringify({
              model: 'qwen/qwen3.8-27b',
              messages: groqMessages,
              temperature: 0.35,
              max_tokens: 600,
            }),
          });

          if (groqQwenRes.ok) {
            const groqQwenData = await groqQwenRes.json();
            const replyText = groqQwenData?.choices?.[0]?.message?.content;
            if (replyText) {
              const cleanReply = cleanReplyForSession(replyText, isFirstTurn, prompt);
              const expr = detectExpression(cleanReply, prompt, isFirstTurn);
              return NextResponse.json({
                reply: cleanReply,
                expression: expr,
                avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
                source: 'groq_lpu',
                model: 'Groq (Qwen 27B)',
              });
            }
          }
        }
      } catch (groqError) {
        // failover quietly to Tier 3
      }
    }

    // =========================================================================
    // TIER 3: ANTHROPIC CLAUDE (Model Claude 3.5 Sonnet / 3.7 Sonnet)
    // =========================================================================
    if (anthropicApiKey) {
      try {
        const claudeMessages: any[] = [];
        if (Array.isArray(history) && history.length > 0) {
          for (const item of history.slice(-8)) {
            claudeMessages.push({
              role: item.role === 'assistant' ? 'assistant' : 'user',
              content: item.content,
            });
          }
        }
        claudeMessages.push({ role: 'user', content: prompt });

        const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicApiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            system: dynamicSystemPrompt,
            messages: claudeMessages,
            max_tokens: 1200,
            temperature: 0.35,
          }),
        });

        if (claudeRes.ok) {
          const claudeData = await claudeRes.json();
          const replyText = claudeData?.content?.[0]?.text;
          if (replyText) {
            const cleanReply = cleanReplyForSession(replyText, isFirstTurn, prompt);
            const expr = detectExpression(cleanReply, prompt, isFirstTurn);
            return NextResponse.json({
              reply: cleanReply,
              expression: expr,
              avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
              source: 'anthropic_claude',
              model: 'Claude 3.5 Sonnet',
            });
          }
        } else {
          console.warn('Tier 3 (Claude) non-OK status:', claudeRes.status);
        }
      } catch (claudeError) {
        console.warn('Tier 3 (Claude) error, switching to Tier 4:', claudeError);
      }
    }

    // =========================================================================
    // TIER 4: OPENAI GPT-4o (Model Flagship OpenAI)
    // =========================================================================
    if (openAiApiKey) {
      try {
        const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openAiApiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: standardMessages,
            temperature: 0.35,
            max_tokens: 1200,
          }),
        });

        if (openAiRes.ok) {
          const openAiData = await openAiRes.json();
          const replyText = openAiData?.choices?.[0]?.message?.content;
          if (replyText) {
            const cleanReply = cleanReplyForSession(replyText, isFirstTurn, prompt);
            const expr = detectExpression(cleanReply, prompt, isFirstTurn);
            return NextResponse.json({
              reply: cleanReply,
              expression: expr,
              avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
              source: 'openai_gpt',
              model: 'OpenAI GPT-4o',
            });
          }
        } else {
          console.warn('Tier 4 (OpenAI) non-OK status:', openAiRes.status);
        }
      } catch (openAiError) {
        console.warn('Tier 4 (OpenAI) error, switching to Tier 5:', openAiError);
      }
    }

    // =========================================================================
    // TIER 5: DEEPSEEK API (Model DeepSeek-V3 / deepseek-chat)
    // =========================================================================
    if (deepseekApiKey) {
      try {
        const deepseekRes = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${deepseekApiKey}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: standardMessages,
            temperature: 0.35,
            max_tokens: 1200,
          }),
        });

        if (deepseekRes.ok) {
          const deepseekData = await deepseekRes.json();
          const replyText = deepseekData?.choices?.[0]?.message?.content;
          if (replyText) {
            const cleanReply = cleanReplyForSession(replyText, isFirstTurn, prompt);
            const expr = detectExpression(cleanReply, prompt, isFirstTurn);
            return NextResponse.json({
              reply: cleanReply,
              expression: expr,
              avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
              source: 'deepseek_api',
              model: 'DeepSeek-V3',
            });
          }
        } else {
          console.warn('Tier 5 (DeepSeek) non-OK status:', deepseekRes.status);
        }
      } catch (deepseekError) {
        console.warn('Tier 5 (DeepSeek) error, switching to Tier 6:', deepseekError);
      }
    }

    // =========================================================================
    // TIER 6: SMART LOCAL KNOWLEDGE ENGINE (Garansi 100% Uptime & Kebal Offline)
    // =========================================================================
    const localReply = generateLocalSmartResponse(prompt, isFirstTurn, currentRole);
    const cleanReply = cleanReplyForSession(localReply, isFirstTurn, prompt);
    const expr = detectExpression(cleanReply, prompt, isFirstTurn);
    return NextResponse.json({
      reply: cleanReply,
      expression: expr,
      avatar: `/images/avatar/ustadzah-avatar-${expr}.png`,
      source: 'smart_knowledge_engine',
      model: 'Us AI Knowledge Engine',
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

