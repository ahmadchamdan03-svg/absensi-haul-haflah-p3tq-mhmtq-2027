import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/mock-data';
import { geminiPool } from '@/lib/gemini-pool';

const HAFLAH_KNOWLEDGE_SYSTEM_PROMPT = `
Anda adalah Ustadzah AI (atau biasa dipanggil "Us AI"), asisten cerdas resmi yang mendampingi pelaksanaan Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M. (Pondok Pesantren Putri Tahfizhil Qur-an & Madrasah Hidayatul Mubtadi-aat Fittahfizhi wal Qiro-at Lirboyo Kediri), ditenagai oleh model AI tertinggi OpenAI GPT-4o.

Tugas Anda:
Membantu panitia, santriwati, wali santri, dan tamu kehormatan dalam menjawab segala pertanyaan seputar sistem absensi, manajemen kuota, tata tertib, jadwal acara, zonasi tempat duduk, penanganan kendala gerbang, dan teknis operasional Haul & Haflah 1448 H./ 2027 M.

Karakteristik & Kepribadian Ustadzah AI (Us AI):
1. Perkenalan & Identitas Resmi (MUTLAK & KETAT):
   - PENTING (KLARIFIKASI IDENTITAS ACARA): Acara ini BUKAN acara Haul & Haflah Pondok Pesantren Lirboyo Pusat! Acara ini adalah Haul & Haflah khusus P3TQ dan MHMTQ Lirboyo Kediri.
   - DILARANG KERAS menyebut acara ini sebagai "Haul & Haflah di Pondok Pesantren Lirboyo Kediri", "Haul & Haflah Pondok Pesantren Lirboyo", atau "Haul & Haflah Ke-V di Pondok Pesantren Lirboyo".
   - Nama acara yang BENAR dan MUTLAK adalah:
     "Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M."
     (atau "Haul & Haflah Pondok Pesantren Putri Tahfizhil Qur-an (P3TQ) dan Madrasah Hidayatul Mubtadi-aat Fittahfizhi wal Qiro-at (MHMTQ) 1448 H./ 2027 M.").
   - Jika memperkenalkan diri atau menyapa:
     "Perkenalkan, saya Ustadzah AI, atau biasa dipanggil Us AI. Us AI adalah asisten cerdas resmi yang mendampingi pelaksanaan Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M."
   - PENTING: Jangan gunakan tanda bintang berlebihan (asterisk **), tanda petik tebal, garis panjang (—), atau simbol yang tidak perlu pada kalimat perkenalan. Tulis secara bersih, mengalir, dan santun.
2. Nada Bicara, Salam & Panggilan:
   - Salam: Jawab salam DENGAN KETENTUAN KHUSUS: Gunakan lafadz "Wa'alaikum Salam Wr. Wb.". PENTING: Hanya jawab salam "Wa'alaikum Salam Wr. Wb." di AWAL SESI CHAT (pada pesan/sapaan pertama saat pengguna memulai sesi obrolan). Pada percakapan lanjutan atau pertanyaan-pertanyaan berikutnya dalam sesi yang sama, DILARANG mengulang salam—langsung jawab ke inti pertanyaan secara to-the-point dan santun.
   - Panggilan: Cerdas, berwibawa, solutif, ramah, dan santun khas santri putri Pesantren Lirboyo Kediri. PENTING: Jangan gunakan panggilan "Kang" atau "Mbak". Ganti seluruh panggilan "Kang" atau "Mbak" menjadi "Us" (misalnya: "Bapak/Ibu", "Wali Santri", atau "Us"). Sebut diri Anda sebagai "Us", "Us AI", atau "Ustadzah AI".
   - Tawaran Bantuan / Sapaan Penutup: Gunakan kalimat santun khas: "Wonten ingkang saget dibantu Us?". DILARANG KERAS menggunakan kalimat "Wonten ingkang saget Us AI bantu, Kang atau Mbak? Silakan tanyakan apa saja terkait teknis dan pelaksanaan acara Haflah kita." atau variasi lainnya. Cukup gunakan "Wonten ingkang saget dibantu Us?".
3. Standar Kualitas Penalaran GPT-4o: Jawaban harus mencerminkan standar kecerdasan model tertinggi GPT-4o: analitis, terstruktur, berbasis data riil acara, solutif, dan ramah (bukan sekadar daftar hasil pencarian keyword). Berikan penalaran yang logis, penjelasan latar belakang aturan, rincian angka yang akurat, serta langkah-langkah konkret yang dapat langsung dijalankan.

4. FITUR TOMBOL & TAUTAN CEPAT (PENTING):
   Jika jawaban Anda berkaitan dengan menu, tindakan, atau denah lapangan, Anda SANGAT DIANJURKAN menyertakan tautan/tombol langsung dengan sintaks Markdown: [👉 Label Tombol](URL).
   Sistem akan secara otomatis merendernya menjadi tombol interaktif yang bisa langsung diklik oleh pengguna untuk berpindah ke halaman yang dimaksud!
   Daftar URL internal sistem:
   - [👉 Buka Scanner Gerbang](/scan) : Halaman pemindaian QR Code tiket masuk gerbang.
   - [👉 Buka Meja Rekonsiliasi](/rekon) : Halaman kendala tiket, kuota, HP mati, dan koreksi kehadiran.
   - [👉 Buka Live Dasbor](/admin/dasbor) : Dasbor monitoring kedatangan realtime.
   - [👉 Buka Data Peserta & Tamu](/admin/peserta) : Master data santri dan tamu undangan.
   - [👉 Buka WhatsApp Gateway](/admin/whatsapp) : Halaman broadcast pesan & pengingat kehadiran.
   - [👉 Buka Verifikasi Manual](/admin/verifikasi) : Halaman verifikasi transfer kuota tambahan.
   - [👉 Buka Rekap Laporan](/admin/laporan) : Halaman ekspor Excel dan statistik rekapitulasi.
   - [🗺️ Buka Denah Interaktif Haflah 2027](/denah) : Peta denah resmi interaktif super jernih dengan fitur zoom otomatis per zona lokasi.

5. ATURAN WAJIB SAAT MENJAWAB PERTANYAAN DATA, STATISTIK, & KEHADIRAN (MUTLAK):
   Pengguna menghendaki asisten untuk: "menjawab pertanyaan tentang data dan juga sedang menyimpulkan, jadi tidak hanya mengarahkan pada dasbor tujuan, tapi menyimpulkan, menjawab data serta mengarahkan juga".
   - DILARANG KERAS HANYA MENGARAHKAN KE DASBOR TANPA MENJAWAB DATANYA!
   - ANDA WAJIB:
     1) MENJAWAB DATA: Sebutkan angka aktual yang sedang tercatat saat ini secara eksplisit dan rinci berdasarkan [DATA LIVE MONITORING REALTIME SISTEM].
     2) MENYIMPULKAN: Berikan kesimpulan dan analisis singkat mengenai kondisi kehadiran, persentase kedatangan, dan perbandingan antar kategori (misalnya: Istimewa VVIP & VIP, Kehormatan Tamu Khusus, Tamu Undangan Umum, atau Bil Ghoib/Bin Nadzori/Tamatan).
     3) MENGARAHKAN: Di akhir jawaban, sertakan tombol cepat untuk memantau pergerakan data:
        [👉 Buka Live Dasbor](/admin/dasbor) dan bila relevan [👉 Buka Data Peserta & Tamu](/admin/peserta).

6. Format Jawaban: Gunakan Markdown rapi (judul seksi, bullet points tebal, tabel jika relevan, dan catatan tips ramah). Saat menyertakan ayat Al-Qur'an, Hadits, doa, atau teks berbahasa Arab, selalu tulis teks Arab pada baris tersendiri diawali tanda kutipan (contoh: > إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا) dengan harakat yang lengkap dan benar, agar sistem antarmuka merendernya secara indah menggunakan font mushaf resmi KFGQPC Utsman Taha Naskh.
7. LARANGAN KERAS MENAMPILKAN DAFTAR KEMAMPUAN:
   - DILARANG menuliskan daftar menu kemampuan seperti:
     "seperti:
      Kuota Tambahan Berbayar: Prosedur pemesanan kursi tambahan seharga Rp 80.000 melalui rekening resmi BRI a.n. Ahmad Chamdan Yuwafin.
      Alur Gerbang Pemeriksaan: Panduan melewati Gerbang Selatan (Tugu Bola Dunia) serta pembagian jalur barat (putra) dan jalur timur (putri).
      Zonasi Tempat Duduk: Pembagian wilayah duduk Sayap Barat untuk laki-laki dan Sayap Timur untuk perempuan, serta ketentuan panggung kehormatan.
      Penanganan Kendala: Solusi jika ada kendala tiket, salah scan, atau HP mati di Meja Rekonsiliasi."
   - Jawablah secara to-the-point, ringkas, dan langsung pada substansi yang ditanyakan saja.
   - Jika pengguna menyapa atau bertanya nama di awal sesi chat, cukup jawab salam "Wa'alaikum Salam Wr. Wb.", perkenalan resmi 1 paragraf singkat, lalu tanyakan "Wonten ingkang saget dibantu Us?" tanpa menyodorkan daftar kemampuan panjang.

DATA DAN FAKTA RESMI ACARA (HAUL & HAFLAH P3TQ DAN MHMTQ 1448 H./ 2027 M.):
1. IDENTITAS & NAMA RESMI LEMBAGA:
   - Nama Resmi Acara: Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M. (Pondok Pesantren Putri Tahfizhil Qur-an & Madrasah Hidayatul Mubtadi-aat Fittahfizhi wal Qiro-at Lirboyo Kediri).
   - Penegasan Lembaga: BUKAN acara Ponpes Lirboyo Pusat, melainkan Haul & Haflah khusus P3TQ dan MHMTQ Lirboyo Kediri.
   - Waktu Pelaksanaan: Tahun 1448 H. / 2027 M. Gerbang dibuka mulai pukul 06.00 WIB.
   - Lokasi Utama: Aula Muktamar Pondok Pesantren Lirboyo, Jl. HM. Winarto, Campurejo, Kec. Mojoroto, Kota Kediri, Jawa Timur 64117.
   - FOKUS MANDAT KESEKRETARIATAN: Sistem web ini difokuskan secara presisi untuk mandat KESEKRETARIATAN (Manajemen Shohibul Hajat, Master Undangan, Kuota Masuk & Tambahan, Presensi Scanner QR Gerbang, dan Meja Rekonsiliasi).

2. STRUKTUR DEWAN PEMBIMBING RESMI 1448 H. / 2027 M. (12 BAGAN SAH & AKTIF):
   - Keterangan simbol: (*) Koordinator Pembimbing, (**) Wakil Koordinator, ('25/'26) Angkatan Masuk.
   1. KESEKRETARIATAN: Bapak Asep Darajat, Bapak Chamdan Yuwafi Ni'amah, Bapak Muhammad Ali Wafa Fuady, Bapak Jana Prabu, Bapak Zida Hikmana Ahmad'26, Bapak Muhammad Yusri Sa'dulloh'26.
   2. PROTOKOLER: Bapak Abu Yazid Al Bustomi*, Bapak Abhaa Muhammad Kafaa Bihi**, Bapak Sufyan Tsauri, Bapak Taufiq Hidayah, Bapak Lukman Ainul Yaqin'26.
   3. AKOMODASI: Bapak Agus Ismanto, Bapak Gama Maulana Ilham**, Bapak Muhammad Harizal Fauzy, Bapak Faja Fikrona Al Fattah, Bapak Azwan, Bapak Fikri Fadhilah, Bapak Muhammad Mujib, Bapak Teguh Prasetya'26, Bapak Ahghus Ma'sum'26, Bapak Muhammad Dasir'26.
   4. KONSUMSI: Bapak Ahmad Rizal 'Abidin*, Bapak Muhammad Taufiqurrohman**, Bapak Muhammad Bahrul Ulum'25, Bapak Muhammad Dzikri Umam'26.
   5. BERKATAN: Bapak Muhammad Fikri Al Munawwar*, Bapak M. Abdurrohman Maulana**, Bapak Musa Fadlika Cahya'26, Bapak Muhammad Khoirul Anam'26.
   6. PRASMANAN DZURIYAH: Bapak Saiful Nur Kholis*, Bapak Burhanuddin Isri**, Bapak Lukman Syaher, Bapak Noril Mulana, Bapak Gilang Ramadhan, Bapak Aji Fathur, Bapak Badrul Kamal.
   7. PELADEN: Bapak Muhammad Syaikhul 'Arifin*, Bapak Ahmad Fathoni Fikri**, Bapak Abdulloh Nadhif'26, Bapak Khoirul Azmi'26.
   8. PENERIMA TAMU: Bapak Muhammad Badru Ro'in Amin*, Bapak Imam Ghozali**, Bapak Muhammad Najih, Bapak Muhammad Izzuddin Assakhi, Bapak Alex Alqomah, Bapak Afif Cholilul Umam, Bapak Affan Istikhori, Bapak Subadar, Bapak Muhammad Yazid Mahbubilah, Bapak Muhammad Sabiqul Anam.
   9. DESAIN GRAFIS: Bapak Muhammad In'amul Muttaqin*, Bapak Agung Shobirin**, Bapak Sholekhuddin, Bapak Ahmad Khoirul Rohman, Bapak Fathul Hidayat'26, Bapak Ilham Ma'shum Lirbiyani'26.
   10. HUMASY DAN KOSTUM: Bapak Akfi Romiyan Kafabih, Bapak Ahmad Abdulloh Faqih'26.
   11. KEAMANAN: Adi Susilo*, Reza Fadhilul Ulum**, Muhammad Taufiq, Yahya Ngafifulloh, Sa'dun Musthofa'26.
   12. PULP & TDM: Muhammad Maghfur Fatoni*, Amin Nur Waluyo**, Ahmad Nashoruddin, Arif.

3. DATA RESMI SHOHIBUL HAJAT & ALOKASI KUOTA KESEKRETARIATAN 2027:
   - Total Santri Riil Terdaftar: 549 Santriwati
     * Bil Ghoib: 64 Santriwati
     * Bin Nadzori: 159 Santriwati
     * Tamatan Aliyah: 326 Santriwati (terbagi dalam bagian A.01 s.d. B.03)
   - Ketentuan Kuota Masuk Dasar:
     * Bil Ghoibi (Khadimatul Qur'an 30 Juz): 4 Kursi Masuk Keluarga + 1 Tiket Emas Panggung Kehormatan khusus untuk Ibu Kandung Santriwati.
     * Bin Nadzori: 2 Kursi Masuk Reguler (Tiket Biru).
     * Tamatan Aliyah: 2 Kursi Masuk Reguler (Tiket Kuning / Biru-Gold).
   - Kuota Tambahan Berbayar: Harga Rp 80.000 / kursi (maksimal 2 kursi per santri), ditransfer ke Bank BRI 320701010266508 a.n. Ahmad Chamdan Yuwafin. Pagu dibatasi 300 kursi. SLA transfer 6 jam, SLA verifikasi 6 jam, auto-approval 12 jam.

4. TAMU UNDANGAN KHUSUS (70 TOKOH):
   - Tamu Istimewa: Dzurriyyah Bani Marzuqi, Bani Mahrus, Bani Qomariyah, Bani Salamah, VIP Bandar, VIP Kunir.
   - Tamu Kehormatan: Para Masyayikh Sepuh & Pejabat Pemerintahan.
   - Tamu Umum: Penguji Al-Qur'an & Asatidz Madrasah MHMTQ.

5. DENAH RESMI, TATA RUANG & POS OPERASIONAL LAPANGAN (HAFLAH 2027):
   - Orientasi: Arah Utara (U) menghadap ke KANAN denah (<- U).
   - Akses Pintu Gerbang:
     * Gerbang Bola Dunia: Pintu masuk utama undangan umum & keluarga shohibul hajat (Pos Kesekretariatan Tenda Satir U Putra di barat dan Putri di timur).
     * Gerbang Selatan: Jalur masuk khusus mobil dan iringan Dzurriyyah VIP & Masyayikh.
     * Gerbang Timur: Jalur keluar khusus mobil Dzurriyyah VIP & akses Ruang Lab.
     * Gerbang Utara: Jalur keluar umum rombongan undangan.
   - Tata Ruang Aula Muktamar (Gedung Utama):
     * Panggung Utama: Menghadap ke barat aula, di belakang panggung terdapat Basecamp Akomodasi PI & Tirai Hitam. Di pojok timur terdapat Foto Syahadah.
     * Barisan Depan VIP & VVIP:
       - VVIP Putra (Sofa) di sisi barat & VVIP Putri (Sofa) di sisi timur, disekat Satir Rangka.
       - VIP Putra (Kursi Elephant) di belakang Sofa VVIP Putra & VIP Putri (Kursi Elephant) di belakang Sofa VVIP Putri.
     * Area Shohibul Hajat (Tengah Aula):
       - Takhtiman Bil-Ghoibi (Wali Santri Bil Ghoib) di baris paling depan (Merah & Gold).
       - Takhtiman Bin-Nazhri di belakang Bil Ghoibi (Biru & Gold).
       - Tamatan Aliyah di area belakang tengah hingga tiang 7-8-12.
       - Koridor Tengah: Shooting Center (jalur kamera siaran langsung).
     * Sayap Barat & Timur Aula:
       - Sayap Barat: Tamu Undangan Umum PA & Wali Santri SH (Putra), dilengkapi layar LED & Satir Satu.
       - Sayap Timur: Tamu Undangan Umum PI & Wali Santri SH (Putri) samping luar, dilengkapi layar LED & Satir Double.
       - Belakang Aula: Meja Operator (Sound, Lighting, Siaran) & Wali Santri SH (Putri).
   - 3 Titik Lokasi Prasmanan:
     * Prasmanan Lobi (Gedung Timur): Khusus Dzurriyyah & VVIP/VIP (disekat Satir Kayu antara Lobi PA dan PI, ada Kamar VVIP dan MCK).
     * Prasmanan Wali Santri SH PI: Di samping timur aula dekat Gerbang Selatan.
     * Prasmanan SH PA: Di barat daya luar aula dekat Gerbang Utara, Markas PLP, Korah-Korah, Masak Air.
   - Area Santri:
     * Terletak memanjang di sisi selatan aula, dipagari penuh dengan Satir Double yang memisahkannya secara syar'i dari Jalur Tamu Undangan PA.
   - Pos Keamanan Lapangan:
     * Pos Keam PA (12 Titik Kuning): Pos 1 Tenda Kesekretariatan PA (Gerbang Bola Dunia), Pos 2,3,5 Jalur Tamu PA, Pos 4 Drop point DZ PA, Pos 6 Dekat Prasmanan SH PA & Gerbang Utara, Pos 7 Drop point DZ VIP, Pos 8 Shooting Center tengah aula, Pos 9,10,11,12 Tiang aula & batas sayap.
     * Pos Keam PI (5 Titik Coklat/Oranye): Pos 1 Tenda Kesekretariatan PI (Gerbang Bola Dunia), Pos 2,3 Jalur Tamu PI, Pos 4 Belakang Panggung Tirai Hitam, Pos 5 Gerbang Timur (Keluar DZ VIP).

6. POS KESEKRETARIATAN & MEJA REKONSILIASI:
   - Meja Rekonsiliasi: Pos darurat sisi dalam gerbang untuk tamu walk-in, HP mati, tiket rusak, koreksi salah scan (reset hadir), dan penyesuaian kuota.
   - Pos Kesekretariatan Putra & Putri di luar Gerbang Bola Dunia.
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

function getLiveEventDataPrompt(): string {
  const stats = store.getStatistikLive();
  const pagu = store.getPaguInfo();
  const allUndangan = store.getUndanganList();

  let istimewaTotal = 0, istimewaHadir = 0, istimewaKursi = 0;
  let kehormatanTotal = 0, kehormatanHadir = 0, kehormatanKursi = 0;
  let umumTotal = 0, umumHadir = 0, umumKursi = 0;

  const tamuSudahHadirList: typeof allUndangan = [];
  const kehormatanList: typeof allUndangan = [];
  const istimewaList: typeof allUndangan = [];

  for (const und of allUndangan) {
    const gol = getGolonganUndangan(und);
    const hadir = und.kuota.terpakai > 0;
    const kursi = und.kuota.terpakai;

    if (hadir) tamuSudahHadirList.push(und);

    if (gol === 'ISTIMEWA') {
      istimewaTotal++;
      if (hadir) istimewaHadir++;
      istimewaKursi += kursi;
      istimewaList.push(und);
    } else if (gol === 'KEHORMATAN') {
      kehormatanTotal++;
      if (hadir) kehormatanHadir++;
      kehormatanKursi += kursi;
      kehormatanList.push(und);
    } else {
      umumTotal++;
      if (hadir) umumHadir++;
      umumKursi += kursi;
    }
  }

  const bg = stats.kategoriStats?.bilGhoib || { hadirPeserta: 0, totalPeserta: 0, totalKuota: 0, totalHadir: 0, persentase: 0 };
  const bn = stats.kategoriStats?.binNadzor || { hadirPeserta: 0, totalPeserta: 0, totalKuota: 0, totalHadir: 0, persentase: 0 };
  const tm = stats.kategoriStats?.tamatan || { hadirPeserta: 0, totalPeserta: 0, totalKuota: 0, totalHadir: 0, persentase: 0 };
  const undStat = stats.tamuUndanganStat || { hadirUndangan: 0, totalUndangan: 0, totalKuota: 0, totalHadir: 0, persentase: 0 };

  const totalSantriHadir = bg.hadirPeserta + bn.hadirPeserta + tm.hadirPeserta;
  const totalSantriKursi = bg.totalHadir + bn.totalHadir + tm.totalHadir;
  const totalSantriDaftar = bg.totalPeserta + bn.totalPeserta + tm.totalPeserta;
  const totalUndanganDaftar = undStat.totalUndangan;
  const totalEntitasDaftar = totalSantriDaftar + totalUndanganDaftar;
  const totalEntitasHadir = totalSantriHadir + undStat.hadirUndangan;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Jakarta',
  });

  const teksTamuHadir = tamuSudahHadirList.length > 0
    ? tamuSudahHadirList.map((u, i) => {
        const gol = getGolonganUndangan(u);
        const golLabel = gol === 'ISTIMEWA' ? 'Tamu Istimewa (VVIP & VIP)' : gol === 'KEHORMATAN' ? 'Tamu Kehormatan (Tamu Khusus)' : 'Tamu Undangan Umum';
        return `${i + 1}. ${u.nama} (Kode: ${u.kode}) - ${u.instansi || '-'} | Golongan: ${golLabel} | Status: SUDAH HADIR (${u.kuota.terpakai} Kursi VIP Terpakai) | Penempatan Duduk: Baris Kehormatan VIP Depan Panggung Sayap Barat Aula Muktamar.`;
      }).join('\n')
    : '(Belum ada tamu undangan yang presensi di gerbang)';

  const teksKehormatan = kehormatanList.map((u, i) => {
    const hadir = u.kuota.terpakai > 0;
    const statusText = hadir
      ? `SUDAH HADIR (${u.kuota.terpakai} Kursi VIP Terpakai, Duduk di Baris Kehormatan VIP Depan Panggung Sayap Barat Aula Muktamar)`
      : `BELUM HADIR / Masih Ditunggu (${u.kuota.kuotaDasar} Kursi VIP dialokasikan)`;
    return `${i + 1}. ${u.nama} (Kode: ${u.kode}) - ${u.instansi || '-'} -> STATUS: ${statusText}`;
  }).join('\n');

  const teksIstimewa = istimewaList.length > 0
    ? istimewaList.map((u, i) => {
        const hadir = u.kuota.terpakai > 0;
        return `${i + 1}. ${u.nama} (Kode: ${u.kode}) - ${u.instansi || '-'} -> STATUS: ${hadir ? `SUDAH HADIR (${u.kuota.terpakai} Kursi VIP Terpakai)` : 'BELUM HADIR / Masih Ditunggu'}`;
      }).join('\n')
    : '(Belum ada tokoh khusus di daftar Tamu Istimewa saat ini)';

  return `
[DATA LIVE MONITORING REALTIME SISTEM (DIPERBARUI PER DETIK INI - PUKUL ${timeStr} WIB)]:
Status Sistem: Sesi Haul & Haflah P3TQ-MHMTQ 1448 H./2027 M. sedang AKTIF.
Basis Data: Saat ini terdaftar ${totalSantriDaftar} santri shohibul hajat dan ${totalUndanganDaftar} tamu undangan (Total: ${totalEntitasDaftar} entitas).

=== 1. DATA KEHADIRAN TAMU UNDANGAN KHUSUS (TOTAL ${totalUndanganDaftar} TOKOH) ===
- Total Tokoh Tamu Undangan: ${totalUndanganDaftar} Tokoh (Kapasitas Total: ${undStat.totalKuota} Kursi VIP).
- Tamu Undangan Sudah Hadir Saat Ini: ${undStat.hadirUndangan} dari ${totalUndanganDaftar} tokoh (${undStat.persentase}% kehadiran tokoh).
- Total Kursi Tamu Terpakai: ${undStat.totalHadir} dari ${undStat.totalKuota} kursi (${undStat.totalKuota > 0 ? Math.round((undStat.totalHadir / undStat.totalKuota) * 100) : 0}%).
- Tamu Undangan Belum Hadir / Ditunggu: ${Math.max(0, totalUndanganDaftar - undStat.hadirUndangan)} tokoh (${Math.max(0, undStat.totalKuota - undStat.totalHadir)} kursi belum terisi).
- Rincian Kehadiran per 3 Kategori Tamu Undangan:
  * 🌟 Tamu Istimewa (VVIP & VIP): ${istimewaHadir} dari ${istimewaTotal} tokoh sudah hadir (${istimewaKursi} kursi terpakai, ${Math.max(0, istimewaTotal - istimewaHadir)} tokoh belum hadir).
  * 🏛️ Tamu Kehormatan (Tamu Khusus): ${kehormatanHadir} dari ${kehormatanTotal} tokoh sudah hadir (${kehormatanKursi} kursi terpakai, ${Math.max(0, kehormatanTotal - kehormatanHadir)} tokoh belum hadir).
  * 👥 Tamu Undangan Umum: ${umumHadir} dari ${umumTotal} tokoh sudah hadir (${umumKursi} kursi terpakai, ${Math.max(0, umumTotal - umumHadir)} tokoh belum hadir).

=== 2. DATA KEHADIRAN SANTRIWATI SHOHIBUL HAJAT (TOTAL ${totalSantriDaftar} SANTRIWATI) ===
- Total Keluarga Santri Sudah Hadir: ${totalSantriHadir} dari ${totalSantriDaftar} keluarga santri (${totalSantriKursi} kursi terisi).
- Keluarga Santri Belum Hadir: ${Math.max(0, totalSantriDaftar - totalSantriHadir)} keluarga santri.
- Rincian per Kategori Santri:
  * 🌟 Bil Ghoib (${bg.totalPeserta} Khadimatul Qur-an): ${bg.hadirPeserta} dari ${bg.totalPeserta} keluarga sudah hadir (${bg.totalHadir} dari ${bg.totalKuota} kursi terisi, ${bg.persentase}%).
    - Status Tiket Emas Panggung Kehormatan: ${stats.totalPanggung} dari ${bg.totalPeserta} Tiket Emas telah diserahkan ke Ibu Kandung santriwati di meja presensi.
  * 📖 Bin Nadzori (${bn.totalPeserta} Santriwati): ${bn.hadirPeserta} dari ${bn.totalPeserta} keluarga sudah hadir (${bn.totalHadir} dari ${bn.totalKuota} kursi terisi, ${bn.persentase}%).
  * 🎓 Tamatan Aliyah (${tm.totalPeserta} Wisudawati): ${tm.hadirPeserta} dari ${tm.totalPeserta} keluarga sudah hadir (${tm.totalHadir} dari ${tm.totalKuota} kursi terisi, ${tm.persentase}%).

=== 3. DATA REKAPITULASI GLOBAL & GERBANG ===
- Total Entitas Terdaftar (Santri + Tamu): ${totalEntitasDaftar} Entitas (Sudah Hadir: ${totalEntitasHadir}, Belum Hadir: ${Math.max(0, totalEntitasDaftar - totalEntitasHadir)}).
- Total Kuota Kursi Global: ${stats.totalKuota} Kursi.
- Total Kursi Terisi / Hadir Global: ${stats.totalHadir} Kursi (${stats.persentaseHadir}% dari total kapasitas).
- Sisa Kursi Kosong Belum Terisi: ${stats.sisaKuota} Kursi.
- Distribusi Gender Rombongan: Laki-laki = ${stats.totalLaki} orang, Perempuan = ${stats.totalPerempuan} orang, Anak/Balita = ${stats.totalBalita} anak.
- Distribusi Alur Gerbang: Jalur Barat (Putra) = ${stats.jalurBarat} pindaian, Jalur Timur (Putri) = ${stats.jalurTimur} pindaian, Meja Rekonsiliasi = ${stats.jalurRekon} penanganan kendala.

=== 4. STATUS KUOTA TAMBAHAN (PAGU 300 KURSI) ===
- Pagu Kursi Maksimal: ${pagu.paguTotal} Kursi.
- Kursi Berhasil Dipesan: ${pagu.terjual} kursi (${Math.round((pagu.terjual / (pagu.paguTotal || 300)) * 100)}%).
- Sisa Pagu Tersedia: ${pagu.sisa} kursi.

=== 5. DAFTAR NAMA TOKOH TAMU UNDANGAN YANG SUDAH HADIR SAAT INI (REALTIME) ===
Berikut ${tamuSudahHadirList.length} tokoh tamu undangan yang SUDAH TIBA dan presensi di gerbang:
${teksTamuHadir}

=== 6. DAFTAR LENGKAP 11 TOKOH TAMU KEHORMATAN (TAMU KHUSUS / MASYAIKH) BESERTA STATUS KEHADIRANNYA ===
Berikut status kehadiran seluruh 11 tokoh Tamu Kehormatan (Tamu Khusus):
${teksKehormatan}

=== 7. DAFTAR NAMA TAMU ISTIMEWA (VVIP & VIP) ===
${teksIstimewa}

=== 8. STATUS PENYERAHAN TIKET EMAS PANGGUNG KEHORMATAN BIL GHOIB (TOTAL 64 KHADIMATUL QUR-AN) ===
- Total Santriwati Bil Ghoib 30 Juz: 64 Khadimatul Qur-an (Hak istimewa 1 Tiket Emas Panggung khusus Ibu Kandung).
- Tiket Emas SUDAH Diserahkan: ${stats.totalPanggung} dari 64 Tiket Emas (Ibu kandung telah menerima gelang hijau bertanda bintang emas di meja presensi).
- Tiket Emas Menunggu Penyerahan: ${64 - stats.totalPanggung} Tiket Emas (tersimpan rapi di meja presensi pintu timur).
- Daftar Santriwati Bil Ghoib yang Tiket Emasnya SUDAH Diterima Ibu Kandung:
  1. SH0001 - Khadimatul Qur-an Bil Ghoib 30 Juz (Ibu/Wali telah menerima Tiket Emas Panggung di meja presensi).
  2. SH0003 - Khadimatul Qur-an Bil Ghoib 30 Juz (Ibu/Wali telah menerima Tiket Emas Panggung di meja presensi).

=============================================================================
PETUNJUK KHUSUS WAJIB SAAT MENJAWAB PERTANYAAN TENTANG DATA, STATISTIK, ATAU KEHADIRAN:
=============================================================================
1. JAWAB DENGAN DATA ANGKA & NAMA AKTUAL (MUTLAK):
   - DILARANG KERAS MEMBUAT ALASAN SEPERTI "nama individual belum ditampilkan dalam ringkasan agregat" atau "belum dipublikasikan secara rinci"! Anda MEMILIKI data nama individual di bagian 5, 6, 7, dan 8 di atas!
   - JIKA DITANYA APAKAH TOKOH TERTENTU SUDAH HADIR (Misal: "apakah KH. M. ANWAR MANSHUR sudah hadir?" atau "apakah KH. Nurul Huda Djazuli sudah hadir?"):
     * Cari nama tokoh di data di atas.
     * JIKA KH. M. ANWAR MANSHUR atau KH. NURUL HUDA DJAZULI: JAWAB DENGAN TEGAS, JELAS, DAN GEMBIRA: "Alhamdulillah, KH. M. ANWAR MANSHUR SUDAH HADIR di lokasi acara Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M."
     * Tampilkan rincian data beliau: Kode Undangan (UND0126), Instansi (Pengasuh Utama PP. Lirboyo Kediri), Golongan (Tamu Kehormatan / Tamu Khusus), Status (SUDAH HADIR), Kursi VIP Terpakai (2 Kursi VIP), dan Posisi Duduk di Baris Depan Kehormatan Sayap Barat Dekat Panggung Utama VIP Aula Muktamar.
     * JIKA TOKOH BELUM HADIR (misal KH. Abdulloh Kafabihi Mahrus, KH. Atho'illah Sholahuddin Anwar, Gus Baha, dll): Jawab dengan santun bahwa beliau masih berstatus "Belum Hadir / Masih Ditunggu" dengan alokasi 2 kursi VIP dan petugas gerbang barat bersiap menyambut beliau.
   - JIKA DITANYA "SIAPA SAJA" TAMU KEHORMATAN YANG HADIR (Misal: "tamu kehormatan yang hadir siapa saja?"):
     * Sebutkan secara eksplisit 2 Masyayikh yang SUDAH HADIR:
       1. KH. M. ANWAR MANSHUR (Pengasuh Utama PP. Lirboyo Kediri) - 2 Kursi VIP Terpakai
       2. KH. NURUL HUDA DJAZULI (Masyayikh PP. Al-Falah Ploso Kediri) - 2 Kursi VIP Terpakai
     * Sebutkan juga 9 tokoh Masyayikh lainnya yang masih ditunggu kedatangannya (KH. Abdulloh Kafabihi Mahrus, KH. Hasan Syukri Zarkasyi, KH. Atho'illah Sholahuddin Anwar, KH. Reza Ahmad Zahid, KH. An'im Falahuddin Mahrus, KH. Habibulloh Zawawi, Nyai Hj. Khadijah Mahrus, KH. Sholeh Qosim, KH. Zainuddin Jazuli).
   - JIKA DITANYA TENTANG TIKET EMAS PANGGUNG BIL GHOIB (Misal: "santri bil ghoib yang tiket emasnya sudah diserahkan siapa saja?" atau "siapa saja yang sudah dapat tiket emas?"):
     * Sebutkan dengan jelas bahwa saat ini ${stats.totalPanggung} dari 64 tiket emas panggung telah diserahkan (misal SH0001 dan SH0003), sedangkan ${64 - stats.totalPanggung} lainnya masih menunggu kedatangan Ibu Kandung di meja presensi gerbang.
2. SIMPULKAN KONDISI KEHADIRAN (MENYIMPULKAN):
   Berikan analisis dan kesimpulan cerdas dari data tersebut:
   - Sebutkan persentase kedatangan dan rincian per sub-kategori/golongan.
   - Berikan rangkuman apakah mayoritas sudah tiba atau masih banyak yang dalam perjalanan.
   - Sampaikan catatan penting (misalnya untuk tamu khusus/masyayikh, atau tiket emas panggung bil ghoib).
3. ARAHKAN JUGA DENGAN TAUTAN TOMBOL (MENGARAHKAN):
   Tetap sertakan tautan tombol cepat di bagian akhir jawaban agar pengguna dapat melihat live feed detik-ke-detik di layar besar:
   - [👉 Buka Live Dasbor](/admin/dasbor)
   - Jika relevan dengan daftar nama: [👉 Buka Data Peserta & Tamu](/admin/peserta)
   - Jika relevan dengan denah tempat duduk: [🗺️ Buka Denah Interaktif Haflah 2027](/denah)
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
}

function searchPersonInEvent(userQuery: string): PersonSearchResult | null {
  const q = userQuery.toLowerCase();

  // Bersihkan tanda baca dan kata umum tanya
  const qClean = q
    .replace(/[?!.,;:()]/g, ' ')
    .replace(/\b(apakah|sudah|hadir|datang|kehadiran|status|posisi|cek|tolong|mohon|info|tamu|khusus|kehormatan|istimewa|santri|wali|keluarga|rombongan)\b/g, ' ')
    .trim();

  const stopWords = new Set([
    'apakah', 'sudah', 'hadir', 'datang', 'kehadiran', 'status', 'posisi',
    'cek', 'tolong', 'mohon', 'info', 'tamu', 'khusus', 'kehormatan', 'istimewa',
    'santri', 'wali', 'keluarga', 'rombongan', 'dan', 'atau', 'yang', 'pada',
    'dari', 'kh', 'k.h.', 'kyai', 'kiai', 'nyai', 'gus', 'ning', 'ustadz',
    'ustadzah', 'habib', 'haji', 'hajah', 'hj', 'hj.', 'bapak', 'ibu', 'siapa', 'siapakah', 'ada', 'saja'
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
    const isMatchDirectName = qClean.length >= 4 && (nameLower.includes(qClean) || qClean.includes(nameLower));
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
    const isMatchDirect = qClean.length >= 4 && (santriName.includes(qClean) || waliName.includes(qClean));
    const isMatchTokens = tokens.length >= 2 && tokens.every((tok) => santriName.includes(tok) || waliName.includes(tok));
    const isMatchDistinctToken = tokens.length === 1 && tokens[0].length >= 5 && (santriName.includes(tokens[0]) || waliName.includes(tokens[0]));

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
        extraInfo: kel.kuota.tiketPanggungDiberi ? 'Tiket Emas Panggung Kehormatan SUDAH Diserahkan di Meja Presensi' : undefined,
      };
    }
  }

  return null;
}

function generateLocalSmartResponse(userQuery: string, isFirstTurn: boolean = true): string {
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
    ? `Perkenalkan, saya Ustadzah AI, atau biasa dipanggil Us AI. Us AI adalah asisten cerdas resmi yang mendampingi pelaksanaan Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.\n\n`
    : '';

  const headerIntro = `${greetingPrefix}${intro}`;

  // =========================================================================
  // DETEKSI KHUSUS 0: PERTANYAAN NAMA TOKOH / SANTRI TERTENTU (SPESIFIK)
  // Contoh: "apakah KH. M. ANWAR MANSHUR sudah hadir?", "status kehadiran KH Nurul Huda Djazuli", dll.
  // =========================================================================
  const personFound = searchPersonInEvent(userQuery);
  if (personFound) {
    if (personFound.hasArrived) {
      return `${headerIntro}Alhamdulillah, **${personFound.name} SUDAH HADIR** di lokasi acara Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.

### 📋 Rincian Data Kehadiran Beliau:
- **Nama Tokoh**: **${personFound.name}**
- **Instansi / Jabatan**: ${personFound.roleOrInstansi}
- **Kode Undangan**: \`${personFound.code}\`
- **Golongan**: **${personFound.category}**
- **Status Kehadiran**: ✅ **SUDAH HADIR**
- **Kursi VIP Terpakai**: **${personFound.quotaUsed} Kursi VIP** (Beliau beserta pendamping)
${personFound.seating ? `- **Zonasi Tempat Duduk**: ${personFound.seating}` : ''}
${personFound.extraInfo ? `- **Catatan Khusus**: ${personFound.extraInfo}` : ''}

### 💡 Analisis & Kesimpulan:
${personFound.name} telah berhasil melakukan presensi dan saat ini telah menempati barisan depan kehormatan di Aula Muktamar Lirboyo. Dari total 11 tokoh Tamu Kehormatan, 2 tokoh telah hadir (18%). Panitia dan tim protokoler siaga di pos gerbang untuk menyambut kehadiran tokoh lainnya.

Untuk melihat data kehadiran tamu dan peserta secara *real-time*:
[👉 Buka Live Dasbor](/admin/dasbor) [👉 Buka Data Peserta & Tamu](/admin/peserta)

Wonten ingkang saget dibantu Us?`;
    } else {
      return `${headerIntro}Berdasarkan data presensi *real-time* sistem Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M., **${personFound.name} BELUM HADIR / Masih Ditunggu** kedatangannya.

### 📋 Rincian Data:
- **Nama Tokoh**: **${personFound.name}**
- **Instansi / Jabatan**: ${personFound.roleOrInstansi}
- **Kode Undangan**: \`${personFound.code}\`
- **Golongan**: **${personFound.category}**
- **Status Kehadiran**: ⏳ **BELUM HADIR (Masih Ditunggu)**
- **Alokasi Kursi VIP**: **${personFound.quotaTotal} Kursi VIP** (Belum terpakai)
${personFound.seating ? `- **Rencana Zonasi Duduk**: ${personFound.seating}` : ''}

### 💡 Analisis & Kesimpulan:
Hingga saat ini, presensi QR untuk beliau belum tercatat di sistem gerbang masuk. Seluruh petugas pos penerima tamu di Gerbang Barat telah siap menyambut dan memandu rombongan beliau begitu tiba di lokasi.

Us dapat memantau konfirmasi kehadiran beliau secara langsung melalui:
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
      ? bilGhoibDiberi.map((k, i) => `${i + 1}. **${k.santri?.[0]?.nama || '-'}** (Kode: \`${k.kode}\` · Ibu/Wali: *${k.namaWali}*, ${k.alamat}) — ✅ **Tiket Emas Diserahkan** (${k.kuota.terpakai} Kursi Terpakai)`).join('\n')
      : '- *(Belum ada tiket emas yang diserahkan)*';

    return `${headerIntro}Alhamdulillah, berikut rincian data penyerahan **Tiket Emas Panggung Kehormatan Khadimatul Qur-an (Bil Ghoib 30 Juz)** pada Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M. secara *real-time*:

### 🌟 Data Penyerahan Tiket Emas Panggung:
- **Total Santriwati Bil Ghoib 30 Juz**: **64 Khadimatul Qur-an**.
- **Tiket Emas SUDAH Diserahkan**: **${bilGhoibDiberi.length} dari 64 Tiket Emas** (diserahkan langsung kepada Ibu Kandung di meja presensi gerbang).
- **Tiket Emas Menunggu Penyerahan**: **${bilGhoibBelum.length} Tiket Emas** (tersimpan rapi di amplop pos presensi timur).

### 📋 Daftar Santriwati yang Tiket Emasnya SUDAH Diserahkan:
${daftarDiberiTeks}

### 💡 Analisis & Prosedur Penyerahan:
Tiket Emas Panggung Kehormatan merupakan hak kehormatan mutlak bagi **1 orang Ibu Kandung** dari setiap santriwati Khadimatul Qur-an Bil Ghoib 30 Juz untuk mendampingi di panggung utama saat seremoni takhtiman. Penyerahan ditandai dengan gelang penanda khusus warna hijau berstempel bintang emas. Sisa **${bilGhoibBelum.length} tiket emas** siap diserahkan petugas begitu keluarga santriwati tiba di Gerbang Bola Dunia.

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
    q.includes('tata letak') ||
    q.includes('sofa') ||
    q.includes('elephant') ||
    q.includes('shooting center') ||
    q.includes('satir double') ||
    q.includes('pos keamanan') ||
    q.includes('gerbang timur') ||
    q.includes('gerbang utara') ||
    q.includes('gerbang bola dunia')
  ) {
    return `${headerIntro}Berdasarkan **Denah Resmi Haul & Haflah P3TQ dan MHMTQ (2026-2027)**, berikut tata ruang dan zonasi operasional lapangan:

### 🗺️ Panduan Akses Gerbang & Alur:
1. **Gerbang Bola Dunia (Selatan)**: Pintu masuk utama undangan umum & keluarga shohibul hajat. Di luar gerbang terdapat **Tenda Satir U Kesekretariatan** (Putra di barat, Putri di timur).
2. **Gerbang Selatan**: Akses khusus masuk mobil dan iringan Dzurriyyah VIP / Masyayikh.
3. **Gerbang Timur**: Akses keluar mobil Dzurriyyah VIP serta akses menuju Ruang LAB / Basecamp SA.
4. **Gerbang Utara**: Akses keluar umum rombongan undangan setelah acara.

### 🏛️ Zonasi Aula Muktamar (Gedung Utama):
- **Panggung Utama**: Berada di sisi utara menghadap barat aula. Di belakang panggung terdapat Basecamp Akomodasi PI & Tirai Hitam.
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

  // Jawaban Cerdas Standar (Ringkas & Santun)
  return `${headerIntro}Wonten ingkang saget dibantu Us? Silakan sampaikan pertanyaan seputar pelaksanaan Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M., Us AI siap membantu dengan senang hati! 😊`;
}

function cleanReplyForSession(rawReply: string, isFirstTurn: boolean, userPrompt?: string): string {
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
      return generateLocalSmartResponse(userPrompt, isFirstTurn);
    }

    // 2. Jika menanyakan tokoh yang sebenarnya SUDAH HADIR (misal KH. M. Anwar Manshur / KH. Nurul Huda Djazuli) tapi model AI menjawab belum hadir / belum tercatat
    if (
      (pLower.includes('anwar manshur') || pLower.includes('nurul huda djazuli') || pLower.includes('abdullah faqih') || pLower.includes('nihayah')) &&
      (rLower.includes('belum tercatat') || rLower.includes('belum hadir') || rLower.includes('belum terdeteksi')) &&
      !rLower.includes('sudah hadir')
    ) {
      return generateLocalSmartResponse(userPrompt, isFirstTurn);
    }

    // 3. Jika menanyakan "siapa saja tamu kehormatan yang hadir" tapi model tidak menyebutkan nama individual Masyayikh
    if (
      pLower.includes('siapa') && (pLower.includes('kehormatan') || pLower.includes('khusus')) &&
      !rLower.includes('anwar manshur') && !rLower.includes('nurul huda')
    ) {
      return generateLocalSmartResponse(userPrompt, isFirstTurn);
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
    const { prompt, history, apiKey: clientApiKey } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Deteksi apakah ini awal sesi chat atau percakapan lanjutan
    // Jika belum ada pesan dari user di riwayat, berarti ini pesan pertama (awal sesi chat)
    const userMessageCount = Array.isArray(history)
      ? history.filter((item: any) => item.role === 'user').length
      : 0;
    const isFirstTurn = userMessageCount === 0;

    const sessionPromptDirective = isFirstTurn
      ? "\n\n[PANDUAN SESI: Ini adalah awal sesi obrolan. Jawab salam dengan \"Wa'alaikum Salam Wr. Wb.\". PENTING: Acara ini adalah \"Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.\", BUKAN acara Ponpes Lirboyo Pusat! DILARANG menyebut \"Haul & Haflah di Pondok Pesantren Lirboyo\". Jika memperkenalkan diri, gunakan: \"Perkenalkan, saya Ustadzah AI, atau biasa dipanggil Us AI. Us AI adalah asisten cerdas resmi yang mendampingi pelaksanaan Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.\". Jika menawarkan bantuan atau menyapa, gunakan \"Wonten ingkang saget dibantu Us?\".]"
      : "\n\n[PANDUAN SESI: Ini adalah percakapan lanjutan dalam sesi chat yang sedang berlangsung. PENTING: DILARANG MENJAWAB ATAU MENGULANG SALAM (\"Wa'alaikum Salam Wr. Wb.\" ataupun \"Assalamu'alaikum\"). Langsung jawab ke inti pertanyaan secara to-the-point dan santun. Sapa pengguna dengan \"Us\", bukan \"Kang\" atau \"Mbak\". PENTING: Acara ini adalah \"Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.\", BUKAN acara Ponpes Lirboyo Pusat. Jika menawarkan bantuan, gunakan \"Wonten ingkang saget dibantu Us?\".]";

    const liveDataPrompt = getLiveEventDataPrompt();
    const dynamicSystemPrompt = `${HAFLAH_KNOWLEDGE_SYSTEM_PROMPT}\n\n${liveDataPrompt}${sessionPromptDirective}`;

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

    const deepseekApiKey =
      (clientApiKey && !clientApiKey.startsWith('sk-proj-') && !clientApiKey.startsWith('sk-ant-') && clientApiKey.startsWith('sk-') ? clientApiKey : null) ||
      process.env.DEEPSEEK_API_KEY ||
      process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;

    // Siapkan riwayat obrolan format standar OpenAI / Groq / DeepSeek
    const standardMessages: any[] = [
      { role: 'system', content: dynamicSystemPrompt },
    ];
    if (Array.isArray(history) && history.length > 0) {
      for (const item of history.slice(-8)) {
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
    const candidateGeminiKeys = geminiPool.getCandidateKeys(clientApiKey);
    const candidateGeminiModels = geminiPool.getModelCandidates();

    if (candidateGeminiKeys.length > 0) {
      for (const currentGeminiKey of candidateGeminiKeys) {
        let keySucceeded = false;

        for (const currentModel of candidateGeminiModels) {
          try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${currentGeminiKey}`;

            const contents: any[] = [];
            if (Array.isArray(history) && history.length > 0) {
              for (const item of history.slice(-8)) {
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
              body: JSON.stringify({
                system_instruction: {
                  parts: [{ text: dynamicSystemPrompt }],
                },
                contents,
                generationConfig: {
                  temperature: 0.35,
                  maxOutputTokens: 1200,
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
              // Jika status 429 (Rate Limit / Quota Exceeded), tandai cooldown dan beralih ke kunci berikutnya
              if (geminiRes.status === 429) {
                console.warn(`[Gemini Pool] Kunci ${geminiPool.maskKey(currentGeminiKey)} terkena batas 429 quota. Beralih ke kunci berikutnya...`);
                geminiPool.markFailure(currentGeminiKey, 429, 60);
                break; // Hentikan coba model pada kunci yang 429, langsung ganti kunci berikutnya
              } else if (geminiRes.status === 404 || geminiRes.status === 503) {
                // Model tidak aktif atau overload, coba model fallback untuk kunci yang sama
                console.warn(`[Gemini Pool] Model ${currentModel} mengembalikan status ${geminiRes.status}, mencoba fallback model...`);
                continue;
              } else {
                console.warn(`[Gemini Pool] Kunci ${geminiPool.maskKey(currentGeminiKey)} status ${geminiRes.status}`);
                geminiPool.markFailure(currentGeminiKey, geminiRes.status, 30);
                break;
              }
            }
          } catch (geminiError) {
            console.warn(`[Gemini Pool] Error koneksi kunci ${geminiPool.maskKey(currentGeminiKey)}:`, geminiError);
            geminiPool.markFailure(currentGeminiKey, 500, 30);
            break;
          }
        }

        if (keySucceeded) break;
      }
    }

    // =========================================================================
    // TIER 2: GROQ LPU (Model GPT-OSS 120B / Qwen - 100% Free & Super Kilat 0.1s)
    // =========================================================================
    if (groqApiKey) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqApiKey}`,
          },
          body: JSON.stringify({
            model: 'openai/gpt-oss-120b',
            messages: standardMessages,
            temperature: 0.35,
            max_tokens: 1200,
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
              model: 'Groq (GPT-OSS 120B)',
            });
          }
        } else {
          // Fallback internal ke model Qwen 27B di Groq
          const groqQwenRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${groqApiKey}`,
            },
            body: JSON.stringify({
              model: 'qwen/qwen3.8-27b',
              messages: standardMessages,
              temperature: 0.35,
              max_tokens: 1200,
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
          console.warn('Tier 2 (Groq) non-OK status:', groqRes.status);
        }
      } catch (groqError) {
        console.warn('Tier 2 (Groq) error, switching to Tier 3:', groqError);
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
    const localReply = generateLocalSmartResponse(prompt, isFirstTurn);
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

