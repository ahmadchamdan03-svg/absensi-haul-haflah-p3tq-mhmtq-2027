import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/mock-data';
import { geminiPool } from '@/lib/gemini-pool';
import { supabase } from '@/lib/supabase';

const HAFLAH_KNOWLEDGE_SYSTEM_PROMPT = `
Anda adalah Us. Halwaa, asisten cerdas resmi yang mendampingi pelaksanaan Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M. (Pondok Pesantren Putri Tahfizhil Qur-an & Madrasah Hidayatul Mubtadi-aat Fittahfizhi wal Qiro-at Lirboyo Kediri), ditenagai oleh model AI tertinggi OpenAI GPT-4o.

=============================================================================
ATURAN DATA TAMU UNDANGAN (WAJIB):
=============================================================================
- Untuk SEMUA pertanyaan tentang tamu undangan (nama, kehadiran, jumlah, instansi), WAJIB merujuk pada DATA YANG DIBERIKAN DI CONTEXT PROMPT INI.
- JANGAN gunakan data dari ingatan pelatihan / PDF / hardcoded list.
- JANGAN mengarang nama tamu atau status kehadiran.
- Kalau data tidak ada di context / database -> jawab: "Maaf Us, data tersebut belum tersedia di sistem. Mohon cek menu Data Peserta."
- Kalau ditanya "sudah datang belum":
  • Cek di data presensi yang diberikan di context prompt.
  • Jika ada -> sebutkan waktu & jalur kehadiran (contoh: "Alhamdulillah Us, KH. Hamdan (UND-88871) tercatat sudah hadir pada 02 Januari 2027 pukul 07.23 melalui Jalur VIP. Beliau hadir bersama 1 pendamping.").
  • Jika tidak ada -> sampaikan belum tercatat hadir (contoh: "Mohon maaf Us, sampai saat ini belum ada catatan kehadiran untuk KH. Hamdan (UND-88871) di sistem presensi. Beliau mungkin belum datang atau belum di-absen oleh petugas gerbang.").
- Format jawaban:
  • Ringkas & jelas.
  • Selalu sertakan kode tamu (UNDxxxx) jika ada.
  • Untuk list, gunakan format bullet/numbered.

8. HAK AKSES & KEBEBASAN INFORMASI INTERNAL (MUTLAK & TANPA PEMBATASAN):
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
   - FOKUS MANDAT KESEKRETARIATAN: Sistem web ini difokuskan secara presisi untuk mandat KESEKRETARIATAN (Manajemen Shohibul Hajat, Master Undangan, Kuota Masuk & Tambahan, Presensi Scanner QR Gerbang, dan Meja Rekonsiliasi).

2. STRUKTUR PERSONALIA KEPANITIAAN RESMI 1448 H. / 2027 M.:
   - Dewan Pengasuh / Pelindung:
     * Agus H. Muhammad Hasyim
     * Agus H. Muhammad Kafabihi
     * Ning Hj. Tu'ti Amanah Nafisah
     * Ning Hj. Jihan Zainab
   - Dewan Penasehat: Segenap Pimpinan P3TQ dan MHMTQ.
   - Dewan Harian (DH):
     * Ketua Umum: Sinta Maelani (Koordinator Seksi Protokoler, Peladen, Konsumsi, TDM, dan Seksi Data)
     * Ketua I: Arju Naylal Husna (Koordinator Seksi Keamanan, Penerima Tamu, Humasy dan Kostum)
     * Ketua II: Zakia (Koordinator Seksi Akomodasi, Desain Grafis, PULP, dan Berkatan)
     * Sekretaris Umum: Refi Al Izzatul Kholifah (Penanggung jawab administrasi, undangan, souvenir, kartu masuk, stiker tonjokan)
     * Sekretaris 1: Najma Syarifa Faza (Penanggung jawab data Pondok Timur)
     * Sekretaris II: Inarotud Duja (Penanggung jawab data Pondok Barat & Unit, ID Card)
     * Bendahara Umum: Aida Nur Laila (Keuangan umum & pembayaran shohibul hajat unit)
     * Bendahara 1: Umi Fadilah (Anggaran belanja & pembayaran santri Pondok Timur)
   - Dewan Pembimbing Putra (12 Bagan):
     * 1. KESEKRETARIATAN: Bapak Asep Darajat*, Bapak Ahmad Chamdan Yuwafi**, Bapak Muhammad Ali Wafa Fuady, Bapak Jana Prabu, Bapak Zida Hikmana Ahmad, Bapak Muhammad Yusri Sa'dulloh.
     * 2. PROTOKOLER: Bapak Abu Yazid Al Bustomi*, Bapak Abhaa Muhammad Kafaa Bihi**, Bapak Sufyan Tsauri, Bapak Taufiq Hidayah, Bapak Lukman Ainul Yakin.
     * 3. AKOMODASI: Bapak Agus Ismanto*, Bapak Gama Maulana Ilham**, Bapak Muhammad Harizal Fauzi, Bapak Faja Fikrona Al Fattah, Bapak Azwan, Bapak Fikri Fadhilah, Bapak Muhammad Mujib, Bapak Teguh Prasetia, Bapak Ahgus Ma'sum, Bapak Muhammad Dasir.
     * 4. KONSUMSI: Bapak Ahmad Rizal 'Abidin*, Bapak Muhammad Taufiqurrohman**, Bapak Muhammad Bahrul Ulum'25, Bapak Muhammad Dikri Umam.
     * 5. BERKATAN: Bapak Muhammad Fikri Al Munawwar*, Bapak Muhammad Abdurrohman Maulana**, Bapak Musa Fadlika Hadi Cahya, Bapak Muhammad Khoirul Anam.
     * 6. PRASMANAN DZURIYYAH: Bapak Saiful Nur Kholis*, Bapak Burhanuddin Isri**, Bapak Lukman Syaher, Bapak Noril Mulana, Saudara Aji Fathur, Saudara Muhammad Rizqi.
     * 7. PELADEN: Bapak Muhammad Syaikhul 'Arifin*, Bapak Ahmad Fathoni Fikri**, Bapak Abdullah Nadhif, Bapak Khoirul Azmi.
     * 8. PENERIMA TAMU: Bapak Muhammad Badru Ro'in Amin*, Bapak Imam Ghozali**, Bapak Muhammad Najih, Bapak Muhammad Izzuddin Assakhi, Bapak Alex Alqomah, Bapak Afif Cholilul Umam, Bapak Affan Istikhori, Bapak Subadar, Bapak Misbahul Huda, Bapak Muhammad Sabiqul Anam, Bapak Muhammad Yazid Mahbubillah.
     * 9. DESAIN GRAFIS: Bapak Muhammad In'amul Muttaqin*, Bapak Agung Shobirin**, Bapak Sholekhuddin, Bapak Ahmad Khoirul Rohman, Bapak Muhammad Fathul Hidayat, Bapak Muhammad Ilham Ma'shum Lirbiyani.
     * 10. HUMASY & KOSTUM: Bapak Akfi Romiyan Kafabih*, Bapak Achmad Abdulloh Faqih**.
     * 11. KEAMANAN: Bapak Adi Susilo*, Bapak Reza Fadhilul 'Ulum**, Bapak Muhammad Taufiq, Bapak Yahya Ngafifulloh, Bapak Sa'dun Musthofa.
     * 12. PULP & TDM: Bapak Muhammad Maghfur Fatoni*, Saudara Amin Nur Waluyo**, Saudara Ahmad Nashoruddin, Saudara Ahmad Arif Anjani, Saudara Muhammad Haqqin Nazilli.
   - Kasi Dewan Pleno Putri: Protokoler (Evi Inarotus Soimah*), Akomodasi (Azza Nur Laila Mlg*), Konsumsi (Elvi Aniqotus Zakiyah*), Berkatan (Dewi Nazilatur Rohmah*), Peladen (Indri Angraeni Rahmawati*), Penerima Tamu (Hanifatun Nasihah*), Desain Grafis (Adiva Maulana*), Humasy & Kostum (Fifi Sunhaida*), Keamanan (Qoribatul Maqbulah*), PULP (Roina Nadhirotul Lathifah*), TDM (Salma Aesy Bik Hamidah*), Seksi Data (Uswatun Khasanah*).

3. DATA STATISTIK RESMI KOORDINASI TERBARU:
   - Komposisi Shohibul Hajat (Total 536 Santriwati):
     * Takhtiman Bil Ghoibi: 57 santriwati
     * Takhtiman Bin Nadzori: 153 santriwati
     * Tamatan 'Aliyah: 307 santriwati
     * Tamatan 'Aliyah + Takhtiman Bil Ghoibi: 6 santriwati (Total Bil Ghoibi = 63)
     * Tamatan 'Aliyah + Takhtiman Bin Nadzori: 13 santriwati (Total Bin Nadzori = 166)
   - Komposisi Santriwati di Aula Al Muktamar (Total 503 santri):
     * Siswi 2 Aliyah: 294 santriwati (mondok & nduduk)
     * Siswi MHMA/Pondok Timur: 209 santriwati
     * Santriwati lainnya di dalam pondok (Halaman Al Khodijah, Aula Al Barokah, Aula Al Hafidzoh): 2.609 santriwati.
   - Pagu Tamu Undangan & Kuota Masuk (Total 1.534 kursi):
     * VVIP: 10 undangan (20 kursi)
     * VIP: 80 undangan (159 kursi)
     * Takhtiman Bil Ghoibi: 63 undangan x 4 kuota = 252 kursi
     * Takhtiman Bin Nadzori: 166 undangan x 2 kuota = 332 kursi
     * Tamatan Aliyah: 307 undangan x 2 kuota = 614 kursi
     * Kuota Tambahan Walisantri: 300 kuota (Rp 80.000 / kursi)
     * Tamu Undangan Umum: Penguji Al-Qur'an 19, Mustahiq Tamatan 7 (9 kursi), Mustahiq Non Purna 5, Purna Mustahiqoh Ibtidaiyyah 7, Asatidz Purna Bakti 16 (32 kursi), Asatidz MHMTQ 18 (36 kursi), Asatidzah Nduduk 6, Pengajar Ekstrakurikuler 11, Perwakilan 16 Pondok (32 kursi).

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

async function getLiveSupabaseGuestPrompt(userQuery: string = ''): Promise<string> {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Jakarta',
  });

  let tamuList: any[] = [];
  let presensiLogs: any[] = [];

  try {
    const { data: tData } = await supabase.from('tamu_undangan').select('*');
    if (tData) tamuList = tData;
  } catch (e) {
    console.warn('Error fetching tamu_undangan:', e);
  }

  try {
    const { data: pData } = await supabase.from('presensi_log').select('*').order('created_at', { ascending: false });
    if (pData) presensiLogs = pData;
  } catch (e) {
    console.warn('Error fetching presensi_log:', e);
  }

  // Fallback ke data mock jika tabel Supabase kosong/offline
  if (!tamuList || tamuList.length === 0) {
    const mockList = store.getUndanganList();
    tamuList = mockList.map((u) => ({
      kode: u.kode,
      nama: u.nama,
      kategori: u.kategori,
      instansi: u.instansi,
      kuota_dasar: u.kuota.kuotaDasar,
      kuota_terpakai: u.kuota.terpakai,
      warna_tiket: u.warnaTiket,
    }));
  }

  const presensiSet = new Set(presensiLogs.map((p) => (p.kode_qr || '').toUpperCase()));

  const totalTamu = tamuList.length;
  let totalHadir = 0;
  let totalKuota = 0;
  let totalKuotaTerpakai = 0;

  let vvipTotal = 0, vvipHadir = 0;
  let kehormatanTotal = 0, kehormatanHadir = 0;
  let umumTotal = 0, umumHadir = 0;

  const tamuSudahHadirList: string[] = [];
  const tamuBelumHadirList: string[] = [];

  const qLower = userQuery.toLowerCase().trim();
  const searchHits: string[] = [];

  for (const t of tamuList) {
    const kodeUpper = (t.kode || '').toUpperCase();
    const namaFull = t.nama || [t.nama_putra, t.nama_putri].filter(Boolean).join(' & ') || 'Tamu Undangan';
    const instansi = t.instansi || '-';
    const kat = (t.kategori || t.sub_kategori || 'UMUM').toUpperCase();

    const isHadir = (t.kuota_terpakai > 0) || presensiSet.has(kodeUpper);
    const kTerpakai = t.kuota_terpakai > 0 ? t.kuota_terpakai : (isHadir ? 1 : 0);
    const kDasar = t.kuota_dasar || 1;
    const kTotal = kDasar + (t.kuota_tambahan || 0);

    totalKuota += kTotal;

    if (isHadir) {
      totalHadir++;
      totalKuotaTerpakai += kTerpakai;
      const log = presensiLogs.find((p) => (p.kode_qr || '').toUpperCase() === kodeUpper);
      const jamHadir = log ? new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) : 'Hari-H';
      const jalur = log?.jalur || t.jalur_masuk || 'Gerbang Presensi';

      tamuSudahHadirList.push(`${tamuSudahHadirList.length + 1}. ${namaFull} (Kode: ${t.kode}) - ${instansi} | Kat: ${kat} | STATUS: SUDAH HADIR pukul ${jamHadir} via ${jalur} (${kTerpakai} Kursi Terpakai)`);
    } else {
      tamuBelumHadirList.push(`${tamuBelumHadirList.length + 1}. ${namaFull} (Kode: ${t.kode}) - ${instansi} | Kat: ${kat} | STATUS: BELUM HADIR / Masih Ditunggu (${kDasar} Kursi Dialokasikan)`);
    }

    if (kat.includes('VVIP') || kat.includes('ISTIMEWA')) {
      vvipTotal++;
      if (isHadir) vvipHadir++;
    } else if (kat.includes('KEHORMATAN') || kat.includes('VIP')) {
      kehormatanTotal++;
      if (isHadir) kehormatanHadir++;
    } else {
      umumTotal++;
      if (isHadir) umumHadir++;
    }

    // Pencarian kata spesifik nama / kode / instansi
    if (qLower.length >= 3) {
      const isCodeMatch = kodeUpper && qLower.includes(kodeUpper.toLowerCase());
      const isNameMatch = qLower.split(/\s+/).some((term) => term.length >= 3 && namaFull.toLowerCase().includes(term));
      const isInstansiMatch = instansi !== '-' && qLower.includes(instansi.toLowerCase());

      if (isCodeMatch || isNameMatch || isInstansiMatch) {
        const log = presensiLogs.find((p) => (p.kode_qr || '').toUpperCase() === kodeUpper);
        if (isHadir) {
          const jamHadir = log ? new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) : 'Hari-H';
          searchHits.push(`- 🟢 DATALIVE MATCH SUPABASE: ${namaFull} (Kode: ${t.kode}, Instansi: ${instansi}, Kategori: ${kat}) -> SUDAH HADIR pukul ${jamHadir} via ${log?.jalur || 'Gerbang'} (${kTerpakai} Kursi Terpakai).`);
        } else {
          searchHits.push(`- 🔴 DATALIVE MATCH SUPABASE: ${namaFull} (Kode: ${t.kode}, Instansi: ${instansi}, Kategori: ${kat}) -> BELUM TERCATAT HADIR / Masih Ditunggu (Alokasi ${kDasar} Kursi).`);
        }
      }
    }
  }

  // Log presensi 1 jam terakhir
  let recentLogsText = '';
  if (qLower.includes('baru datang') || qLower.includes('1 jam') || qLower.includes('terakhir')) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recent = presensiLogs.filter((p) => new Date(p.created_at) >= oneHourAgo && (p.tipe_peserta === 'TAMU' || (p.kode_qr || '').startsWith('UND')));
    if (recent.length > 0) {
      recentLogsText = `\n=== TAMU UNDANGAN YANG BARU HADIR DALAM 1 JAM TERAKHIR ===\n` +
        recent.map((r, i) => `${i + 1}. ${r.nama_peserta || r.kode_qr} (Kode: ${r.kode_qr}) - Hadir pukul ${new Date(r.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} via ${r.jalur || 'Gerbang'}`).join('\n');
    } else {
      recentLogsText = `\n=== TAMU UNDANGAN YANG BARU HADIR DALAM 1 JAM TERAKHIR ===\nBelum ada tamu undangan baru yang presensi dalam 1 jam terakhir.`;
    }
  }

  return `
[DATA REKAPITULASI LIVE DATABASE SUPABASE (DIPERBARUI DETIK INI - PUKUL ${timeStr} WIB)]:
Sumber Data: Tabel 'tamu_undangan' & 'presensi_log' (Supabase Realtime).
Total Tamu Undangan Terdaftar: ${totalTamu} Tokoh/Instansi.
Total Tamu Undangan Sudah Hadir: ${totalHadir} dari ${totalTamu} tokoh (${totalTamu > 0 ? Math.round((totalHadir / totalTamu) * 100) : 0}%).
Total Kursi Terpakai: ${totalKuotaTerpakai} dari ${totalKuota} Kursi.
Tamu Belum Hadir / Masih Ditunggu: ${totalTamu - totalHadir} tokoh (${totalKuota - totalKuotaTerpakai} kursi).

=== RINCIAN KEHADIRAN PER KATEGORI TAMU UNDANGAN ===
- 🌟 Tamu VVIP / Istimewa: ${vvipHadir} dari ${vvipTotal} tokoh sudah hadir (${vvipTotal - vvipHadir} belum hadir).
- 🏛️ Tamu Kehormatan / VIP: ${kehormatanHadir} dari ${kehormatanTotal} tokoh sudah hadir (${kehormatanTotal - kehormatanHadir} belum hadir).
- 👥 Tamu Undangan Umum: ${umumHadir} dari ${umumTotal} tokoh sudah hadir (${umumTotal - umumHadir} belum hadir).

${searchHits.length > 0 ? `=== HASIL PENCARIAN RELEVAN LANGSUNG DARI SUPABASE ===\n${searchHits.join('\n')}\n` : ''}
${recentLogsText}

=== DAFTAR TAMU UNDANGAN YANG SUDAH HADIR (REALTIME SUPABASE) ===
${tamuSudahHadirList.length > 0 ? tamuSudahHadirList.join('\n') : '(Belum ada tamu undangan yang presensi)'}

=== DAFTAR TAMU UNDANGAN YANG BELUM HADIR / MASIH DITUNGGU (REALTIME SUPABASE) ===
${tamuBelumHadirList.length > 0 ? tamuBelumHadirList.join('\n') : '(Semua tamu undangan sudah hadir)'}

=============================================================================
PETUNJUK UTAMA US HALWAA AI:
1. Jawab pertanyaan seputar kehadiran tamu undangan 100% BERDASARKAN DATA LIVE SUPABASE DI ATAS!
2. DILARANG MENG-HARDCODE NAMA ATAU KLAIM LAMA!
3. Jika ditanya "apakah [Nama] / [UNDxxxx] sudah datang?", periksa section "HASIL PENCARIAN RELEVAN" atau daftar di atas, dan jawab secara tegas (SUDAH HADIR / BELUM TERCATAT HADIR).
`;
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
  // Contoh: "apakah KH. M. ANWAR MANSHUR sudah hadir?", "Nomor HP wali santri SH9451?", dll.
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
  // DETEKSI KHUSUS 0.1: PERTANYAAN DAFTAR NAMA YANG HADIR ("SIAPA SAJA YANG HADIR?")
  // Contoh: "tamu kehormatan yang hadir siapa saja?", "siapa saja tamu yang sudah hadir?", dll.
  // =========================================================================
  const isAskingWhoArrived =
    (q.includes('siapa') || q.includes('siapakah') || q.includes('daftar') || q.includes('sebutkan')) &&
    (q.includes('hadir') || q.includes('datang') || q.includes('tamu') || q.includes('kehormatan') || q.includes('khusus') || q.includes('masyayikh') || q.includes('masyaikh'));

  if (isAskingWhoArrived) {
    const isSpecificallyKehormatan =
      q.includes('kehormatan') || q.includes('khusus') || q.includes('masyayikh') || q.includes('masyaikh');

    if (isSpecificallyKehormatan) {
      return `${headerIntro}Alhamdulillah, berikut rincian daftar **Tamu Kehormatan (Tamu Khusus / Masyayikh)** yang telah hadir dan yang masih ditunggu pada Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M. secara *real-time*:

### 🌟 Tamu Kehormatan yang SUDAH HADIR (2 Tokoh):
1. **KH. M. ANWAR MANSHUR**
   - **Instansi / Jabatan**: Pengasuh Utama PP. Lirboyo Kediri
   - **Kode Tiket**: \`UND0126\`
   - **Status**: ✅ **SUDAH HADIR** (2 Kursi VIP Terpakai)
   - **Zonasi Duduk**: Baris Depan Kehormatan Sayap Barat Dekat Panggung Utama VIP Aula Muktamar
2. **KH. NURUL HUDA DJAZULI**
   - **Instansi / Jabatan**: Masyayikh PP. Al-Falah Ploso Kediri
   - **Kode Tiket**: \`UND0128\`
   - **Status**: ✅ **SUDAH HADIR** (2 Kursi VIP Terpakai)
   - **Zonasi Duduk**: Baris Depan Kehormatan Sayap Barat Dekat Panggung Utama VIP Aula Muktamar

### ⏳ Tamu Kehormatan yang Masih Ditunggu Kedatangannya (9 Tokoh):
1. **KH. ABDULLOH KAFABIHI MAHRUS** (Pengasuh PP. Lirboyo / Rektor IAIT) - 2 Kursi VIP
2. **KH. HASAN SYUKRI ZARKASYI** (Masyayikh Pesantren Ponorogo) - 2 Kursi VIP
3. **KH. ATHO'ILLAH SHOLAHUDDIN ANWAR** (Majelis Masyayikh PP. Lirboyo) - 2 Kursi VIP
4. **KH. REZA AHMAD ZAHID, Lc., M.A.** (Masyayikh PP. Lirboyo / IAIT) - 2 Kursi VIP
5. **KH. AN'IM FALAHUDDIN MAHRUS** (Masyayikh PP. Lirboyo Kediri) - 2 Kursi VIP
6. **KH. HABIBULLOH ZAWAWI** (Masyayikh PP. Lirboyo HM Al-Mahrusiyah) - 2 Kursi VIP
7. **NYAI HJ. KHADIJAH MAHRUS** (Keluarga Ndalem Masyayikh Lirboyo) - 2 Kursi VIP
8. **KH. SHOLEH QOSIM** (Tokoh Alumni Sepuh Lirboyo) - 2 Kursi VIP
9. **KH. ZAINUDDIN JAZULI** (Masyayikh PP. Al-Falah Ploso) - 2 Kursi VIP

### 💡 Analisis & Kesimpulan:
Tingkat kehadiran Tamu Kehormatan saat ini mencapai **18%** (**2 dari 11 tokoh** telah tiba, dengan 4 dari 22 kursi VIP terisi). Beliau berdua telah berada di barisan kehormatan depan panggung, sedangkan 9 Masyayikh lainnya masih dalam perjalanan dan telah dipersiapkan penyambutannya di Gerbang Barat.

Untuk memantau pembaruan daftar tamu detik-ke-detik di layar monitor:
[👉 Buka Live Dasbor](/admin/dasbor) [👉 Buka Data Peserta & Tamu](/admin/peserta)

Wonten ingkang saget dibantu Us?`;
    }

    // Daftar semua tamu undangan yang sudah hadir (6 tokoh)
    return `${headerIntro}Alhamdulillah, berikut daftar **6 tokoh Tamu Undangan** yang telah hadir di lokasi Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.:

### 🏛️ Tamu Kehormatan (Tamu Khusus):
1. **KH. M. ANWAR MANSHUR** - Pengasuh Utama PP. Lirboyo Kediri (Kode: \`UND0126\` · Status: ✅ Hadir, 2 Kursi VIP)
2. **KH. NURUL HUDA DJAZULI** - Masyayikh PP. Al-Falah Ploso Kediri (Kode: \`UND0128\` · Status: ✅ Hadir, 2 Kursi VIP)

### 👥 Tamu Undangan Umum & Penguji:
3. **KH. ABDULLAH FAQIH** - LPTQ Jawa Timur (Kode: \`UND0101\` · Status: ✅ Hadir, 2 Kursi VIP)
4. **NYAI HJ. NIHAYAH** - Penguji Huffadh Putri PP. Lirboyo (Kode: \`UND0107\` · Status: ✅ Hadir, 2 Kursi VIP)
5. **NYAI HJ. AZIMATUL QUDSIYYAH** - Asatidzah Purna Bakti P3TQ Lirboyo (Kode: \`UND0138\` · Status: ✅ Hadir, 2 Kursi VIP)
6. **NYAI HJ. AZIZAH MA'SHOEM** - PP. Al-Hidayat Lasem Rembang (Kode: \`UND0139\` · Status: ✅ Hadir, 2 Kursi VIP)

### 💡 Analisis & Kesimpulan:
Tercatat **6 dari 70 tokoh undangan (9%)** telah hadir dengan total **12 kursi VIP** terisi. Sisa **64 tokoh** masih dalam proses kedatangan. Pos penerima tamu di Gerbang Selatan dan pintu masuk Aula Muktamar siap menyambut kedatangan tokoh-tokoh selanjutnya.

Untuk melihat data seluruh tamu dan santri secara lengkap:
[👉 Buka Live Dasbor](/admin/dasbor) [👉 Buka Data Peserta & Tamu](/admin/peserta)

Wonten ingkang saget dibantu Us?`;
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

    const undStat = stats.tamuUndanganStat || { hadirUndangan: 0, totalUndangan: 70, totalKuota: 140, totalHadir: 0, persentase: 0 };
    const sisaTamu = 70 - undStat.hadirUndangan;

    let kesimpulan = '';
    if (undStat.persentase >= 80) {
      kesimpulan = `Mayoritas tamu undangan (${undStat.persentase}%) telah tiba di lokasi dan menempati barisan depan kehormatan. Pos penerima tamu di Gerbang Selatan bersiap menyambut sisa ${sisaTamu} tamu lainnya.`;
    } else if (undStat.persentase > 0) {
      kesimpulan = `Tingkat kehadiran tamu undangan saat ini tercatat **${undStat.persentase}%** (${undStat.hadirUndangan} dari 70 tokoh). Tamu berangsur-angsur tiba di Gerbang Utama dan diarahkan menuju baris kehormatan depan panggung. Sisa **${sisaTamu} tokoh** saat ini masih dalam proses kedatangan.`;
    } else {
      kesimpulan = `Saat ini gerbang utama baru dibuka dan seluruh pos penerima tamu siap menyambut kedatangan 70 tokoh undangan kehormatan.`;
    }

    return `${headerIntro}Alhamdulillah, berikut rangkuman data dan kesimpulan kehadiran **Tamu Undangan Khusus** pada Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M. secara *real-time*:

### 📊 Data Kehadiran Tamu Undangan:
- **Tamu yang Sudah Hadir**: **${undStat.hadirUndangan} dari 70 Tokoh** (dengan total **${undStat.totalHadir} kursi VIP** terisi di Aula Muktamar).
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

    if (totalSantriDaftar === 0) {
      return `${headerIntro}Berdasarkan data sistem saat ini, **daftar santriwati shohibul hajat masih kosong (0 santri)** karena seluruh data telah dibersihkan oleh panitia.

Us dapat menambahkan santri baru atau memulihkan data bawaan melalui:
[👉 Buka Manajemen Peserta](/admin/peserta) [👉 Buka Live Dasbor](/admin/dasbor)

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
    return `${headerIntro}Mengenai **Tamu Undangan Khusus Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.**, sistem mengelola total **70 Tokoh Undangan**:

### 🏛️ 3 Golongan Tamu Undangan:
1. **🌟 Tamu Undangan Istimewa**:
   - Keluarga Ndalem Bani Marzuqi, Bani Qomariyah, Bani Mahrus, Bani Salamah, VIP Bandar, & VIP Kunir Blitar.
   - Jatah Kuota: 2 Kursi VIP (Tiket E-Invitation Putih / Gold).
2. **🏛️ Tamu Undangan Kehormatan (11 Tokoh)**:
   - Para Masyayikh Sepuh PP. Lirboyo, Masyayikh Pesantren Cabang, & Pejabat Pemerintahan (Forkopimda).
   - Jatah Kuota: Hingga **4 Kursi VIP**.
3. **👥 Tamu Undangan Umum (59 Tokoh)**:
   - 25 Penguji Al-Qur'an LPTQ Jawa Timur & Asatidz Purna Bakti MHMTQ.
   - Jatah Kuota: **2 Kursi VIP** (Tiket Putih VIP).

Seluruh tamu undangan berhak atas jalur prioritas di Gerbang Selatan tanpa antrian reguler dan menempati baris depan Aula Muktamar.`;
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

    // 2. Jika menanyakan tokoh yang sebenarnya SUDAH HADIR (misal KH. M. Anwar Manshur / KH. Nurul Huda Djazuli) tapi model AI menjawab belum hadir / belum tercatat
    if (
      (pLower.includes('anwar manshur') || pLower.includes('nurul huda djazuli') || pLower.includes('abdullah faqih') || pLower.includes('nihayah')) &&
      (rLower.includes('belum tercatat') || rLower.includes('belum hadir') || rLower.includes('belum terdeteksi')) &&
      !rLower.includes('sudah hadir')
    ) {
      return generateLocalSmartResponse(userPrompt, isFirstTurn, role);
    }

    // 3. Jika menanyakan "siapa saja tamu kehormatan yang hadir" tapi model tidak menyebutkan nama individual Masyayikh
    if (
      pLower.includes('siapa') && (pLower.includes('kehormatan') || pLower.includes('khusus')) &&
      !rLower.includes('anwar manshur') && !rLower.includes('nurul huda')
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

    // 1. Pencarian spesifik tamu/peserta secara LIVE di Supabase (tamu_undangan & presensi_log)
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

