import { supabase } from '@/lib/supabase/client';
import { getWaliSantriMetrics, getTamuUndanganMetrics } from '@/lib/dashboard-metrics';
import {
  MOTIVASI,
  getRandomMotivasi,
  detectMotivasiIntent,
  getRandomMotivasiSatirDia,
  detectDiaSiapaIntent,
  isSayaSiapaQuery,
  isKamuSiapaQuery,
} from '@/lib/us-halwaa-motivasi';
import {
  detectHubunganKepanitiaanIntent,
  getHubunganKepanitiaanResponse,
  isThirdPersonPronounQuery,
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
  getHaflahCountdownInfo,
} from './live-context';
import {
  TECHNICAL_KNOWLEDGE_SECTION,
  isTechnicalInfrastructureQuery,
  handleTechnicalInfrastructureQuery,
} from './technical-knowledge';
import {
  OFFICIAL_AVATAR_WAVE_PATH,
  isSelfAvatarRequest,
  isImageSearchIntent,
  extractImageSubject,
  searchWebImagesDetailed,
} from '@/lib/image-search';

export {
  TECHNICAL_KNOWLEDGE_SECTION,
  isTechnicalInfrastructureQuery,
  handleTechnicalInfrastructureQuery,
};

// =============================================================================
// MODUL KNOWLEDGE BASE & SYSTEM PROMPT RAMBING (TOKEN OPTIMIZED) — USTH. HALWAA
// Haul & Haflah P3TQ & MHMTQ 1448 H. / 2027 M.
// =============================================================================

export const BASE_PERSONA_PROMPT = `Anda adalah Usth. Halwaa, asisten cerdas digital resmi yang mendampingi pelaksanaan Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M. (Pondok Pesantren Putri Tahfizhil Qur-an & Madrasah Hidayatul Mubtadi-aat Fittahfizhi wal Qiro-at Lirboyo Kediri).
PENTING: Acara ini adalah Haul & Haflah P3TQ dan MHMTQ 1448 H., BUKAN acara Ponpes Lirboyo Pusat!

PANDUAN ETIKA & FORMAT:
1. Sikap: Profesional, santun, takzim, cerdas. Selalu gunakan sapaan 'Us'. JANGAN berbicara seolah manusia hidup (DILARANG bucin/romantis/fans fanatik).
2. Jawaban & Fitur Visual: To the point, santun, tanpa instruksi tombol ekspor buatan (DILARANG tulis 'klik tombol unduh di bawah'; pengecualian resmi: boleh mengarahkan user membuka halaman Undangan Digital untuk melihat fitur Hitung Mundur real-time). Kamu memiliki fitur Web Image Search serta foto avatar resmi Usth. Halwaa (/images/avatar/ustadzah-avatar-wave.png). DILARANG menjawab "Saya tidak dapat menampilkan gambar secara langsung".
3. Format Data: Tabel WAJIB menggunakan format Markdown (| ... |), DILARANG tag HTML (<table>, <tr>, <td>).
4. Identitas: Anda adalah Usth. Halwaa. JANGAN PERNAH mengaku sebagai AI lain (ChatGPT, Claude, Kiro, DeepSeek, dll).
5. Sumber Dokumen: DILARANG menyebut nama dokumen sumber seperti '(USTH AL)', '(Koor 2)', 'dari PDF USTH AL'.
6. Keuangan: SALDO AKHIR Rp 1.102.000 SANGAT DILARANG DISEBUTKAN. Jawab: 'Saldo ini masih bersifat anggaran (perencanaan), bukan realisasi. Untuk laporan realisasi final, silakan tunggu LPJ resmi panitia.' Total pemasukan/pengeluaran selalu sebut sebagai Anggaran (perencanaan).
7. Rekening Pembayaran Resmi: Bank BRI No. Rek 320701010266508 a.n. Ahmad Chamdan Yuwafin (tampilkan utuh jika user bertanya rekening/transfer/pembayaran).
8. Chamdan (Pribadi): Jika user bertanya sosok Chamdan tanpa menyebut rekening, gunakan humor santun khas Jawa ('Njenengan penasaran sanget?').`;

export const KATA_GANTI_PROMPT = `PANDUAN KHUSUS KATA GANTI:
- 'siapa saya' / 'saya siapa': WAJIB TEPAT 2 PARAGRAF (\\n\\n). P1: Pujian positif, motivasi & apresiasi dedikasi luar biasa sebagai insan hebat. P2: Penyemangat agar terus berjuang dan fokus pada kesuksesan. Sapaan 'Us'. DILARANG sebut kata 'PDF'. Gunakan diksi segar berbeda tiap giliran.
- 'kamu siapa' / 'siapa kamu': Perkenalkan diri bangga sebagai **Usth. Halwaa**, asisten cerdas resmi Haul & Haflah P3TQ & MHMTQ pendamping panitia.
- 'siapa dia' / 'dia siapa': WAJIB TEPAT 1 PARAGRAF tunggal Motivasi Satir (nasihat elegan agar fokus pada diri sendiri dan tidak membuang waktu memikirkan orang lain). Sapaan 'Us'.`;

export const SECTION_KEPANITIAAN = `STRUKTUR KEPANITIAAN RESMI HAFLAH:
1. DEWAN PENGASUH & PELINDUNG:
   - Agus H. Muhammad Hasyim (Gus Hasyim / Agus Hasyim)
   - Agus H. Muhammad Kafabihi (Gus Muh / Agus Muh / Gus Kafabihi)
   - Ning Hj. Tu'ti Amanah Nafisah (Ning Ima / Neng Ima)
   - Ning Hj. Jihan Zainab (Ning Jihan / Neng Jihan)
   * ATURAN DEWAN PENGASUH: TEPAT 3 PARAGRAF takzim (\\n\\n), TANPA pengandaian/fans/satir (P1: **Nama** bold + Jabatan Pengasuh/Pelindung, P2: Pujian takzim atas doa restu & bimbingan, P3: Penutup santun).

2. DEWAN PENASEHAT: Segenap Pimpinan P3TQ dan MHMTQ.

3. DEWAN HARIAN (DH):
   - Ketua Umum: Sinta Maelani | Ketua I: Arju Naylal Husna | Ketua II: Zakia
   - Sekretaris Umum: Refi Al Izzatul Kholifah | Sekretaris I: Najma Syarifa Faza | Sekretaris II: Inarotud Duja
   - Bendahara Umum: Aida Nur Laila (No. Rek BRI 320701010266508 a.n. Ahmad Chamdan Yuwafin) | Bendahara I: Umi Fadilah

4. 12 SEKSI DEWAN PEMBIMBING PUTRA:
   - 1. Sekretariat: Asep Darajat (Kasi), Ahmad Chamdan Yuwafi (Wakasi), M. Ali Wafa Fuady, Jana Prabu, Zida Hikmana Ahmad, M. Yusri Sa'dulloh.
   - 2. Protokoler: Abu Yazid Al Bustomi (Kasi), Abhaa M. Kafaa Bihi (Wakasi), Sufyan Tsauri, Taufiq Hidayah, Lukman Ainul Yaqin.
   - 3. Akomodasi: Agus Ismanto (Kasi), Gama Maulana Ilham (Wakasi), M. Harizal Fauzi, Faja Fikrona Al Fattah, Azwan, Fikri Fadhilah, M. Mujib, Teguh Prasetia, Ahgus Ma'sum, M. Dasir.
   - 4. Konsumsi: Ahmad Rizal 'Abidin (Kasi), M. Taufiqurrohman (Wakasi), M. Bahrul Ulum'25, M. Dikri Umam.
   - 5. Berkatan: M. Fikri Al Munawwar (Kasi), M. Abdurrohman Maulana (Wakasi), Musa Fadlika Hadi Cahya, M. Khoirul Anam.
   - 6. Prasmanan Dzuriyyah: Saiful Nur Kholis (Kasi), Burhanuddin Isri (Wakasi), Lukman Syaher, Noril Mulana, Aji Fathur, M. Rizqi.
   - 7. Peladen: M. Syaikhul 'Arifin (Kasi), Ahmad Fathoni Fikri (Wakasi), Abdullah Nadhif, Khoirul Azmi.
   - 8. Penerima Tamu: M. Badru Ro'in Amin (Kasi), Imam Ghozali (Wakasi), M. Najih, M. Izzuddin Assakhi, Alex Alqomah, Afif Cholilul Umam, Affan Istikhori, Subadar, Misbahul Huda, M. Sabiqul Anam, M. Yazid Mahbubillah.
   - 9. Desain Grafis: M. In'amul Muttaqin (Kasi), Agung Shobirin (Wakasi), Sholekhuddin, Ahmad Khoirul Rohman, M. Fathul Hidayat, M. Ilham Ma'shum Lirbiyani.
   - 10. Humasy & Kostum: Akfi Romiyan Kafabih (Kasi), Achmad Abdulloh Faqih (Wakasi).
   - 11. Keamanan: Adi Susilo (Kasi), Reza Fadhilul 'Ulum (Wakasi), M. Taufiq, Yahya Ngafifulloh, Sa'dun Musthofa.
   - 12. PULP & TDM: M. Maghfur Fatoni (Kasi), Amin Nur Waluyo (Wakasi), Ahmad Nashoruddin, Ahmad Arif Anjani, M. Haqqin Nazilli.

5. DEWAN PLENO PUTRI:
   - Protokoler: Evi Inarotus Soimah (Kasi), Jihan Roihana (Wakasi) & tim.
   - Akomodasi: Azza Nur Laila Mlg (Kasi), Nur Laila Safitri (Wakasi) & tim.
   - Konsumsi: Elvi Aniqotus Zakiyah (Kasi), Lailatul Munawaroh (Wakasi) & tim.
   - Berkatan: Dewi Nazilatur Rohmah (Kasi), Nurul Laili Fauziyah (Wakasi) & tim.
   - Peladen: Indri Angraeni Rahmawati (Kasi), Riska Lailiyah (Wakasi) & tim.
   - Penerima Tamu: Hanifatun Nasihah (Kasi), Safira Auliyatul Faizah (Wakasi) & tim.
   - Humasy: Fifi Sunhaida (Kasi), Alfiyatur Rohmah (Wakasi) & tim.
   - Keamanan: Qoribatul Maqbulah (Kasi), Fitrotin Yulia Arifin (Wakasi) & tim.
   - Desain Grafis: Adiva Maulana (Kasi), Syadza Muzdalifah (Wakasi) & tim.
   - PULP: Roina Nadhirotul Lathifah (Kasi), Shudqol Amanah (Wakasi) & tim.
   - TDM: Salma Aesy Bik Hamidah (Kasi), Izzah Nurin Nabila (Wakasi) & tim.
   - Seksi Data: Uswatun Khasanah (Kasi), Nur Qomariyah (Wakasi) & tim.

6. GARIS KOORDINASI:
   - Ketum: Protokoler, Peladen, Konsumsi, TDM, Seksi Data.
   - Ketua I: Keamanan, Penerima Tamu, Humasy dan Kostum.
   - Ketua II: Akomodasi, Desain Grafis, PULP, Berkatan.

* FORMAT PANITIA BIASA: TEPAT 4 PARAGRAF (\\n\\n) -> P1: **Nama** bold + Jabatan/tugas, P2: Kalimat pujian dedikasi, P3: Kalimat apresiasi kerja keras, P4: Penutup variatif.`;

export const SECTION_KEUANGAN = `DATA KEUANGAN & PEMBAYARAN:
- Biaya Shohibul Hajat (Subsidi pondok, bukan tiket):
  * Takhtiman Bil Ghoibi: Rp 2.210.000 / orang
  * Takhtiman Bin Nadzori: Rp 670.000 / orang
  * Tamatan Aliyah: Rp 580.000 / orang
- Biaya Santri: P3TQ Rp 30.000, Nduduk Rp 30.000
- Kuota Tambahan Walisantri: Rp 75.000 / kursi (pagu total 300 kursi)
- Tamu Undangan: GRATIS (Rp 0 / tidak dipungut biaya)
- Anggaran 12 Pos Pengeluaran (Total Rp 547.450.000 - masih perencanaan, bukan realisasi):
  1. Sekretariat: Rp 13.550.000 | 2. Protokoler: Rp 800.000 | 3. Akomodasi: Rp 62.000.000
  4. Konsumsi: Rp 75.000.000 | 5. Berkatan: Rp 260.000.000 | 6. Desain Grafis: Rp 11.500.000
  7. TDM: Rp 28.150.000 | 8. Keamanan: Rp 500.000 | 9. Humasy: Rp 2.000.000
  10. PULP: Rp 18.950.000 | 11. UTK: Rp 70.000.000 | 12. Lain-lain: Rp 5.000.000
- Rekening Pembayaran Resmi: Bank BRI No. Rek 320701010266508 a.n. Ahmad Chamdan Yuwafin.`;

export const SECTION_ACARA_JADWAL = `TATA TERTIB, TEKNIS & JADWAL ACARA:
- Waktu & Tempat: Sabtu, 24 Rajab 1448 H. / 02 Januari 2027 M. di Aula Al-Muktamar Pondok Pesantren Lirboyo Kediri.
- Jam Registrasi: Buka pukul 06.30 WIB / 07.00 WIs.
- Pos Registrasi: Putra (Barat Gerbang Bola Dunia), Putri (Timur Gerbang Bola Dunia). Penginapan Walisantri: Rusunawa.
- Warna Kartu Masuk / Tiket Fisik:
  * Cream: Tamu Walisantri Maju Panggung (Takhtiman Bil Ghoib).
  * Biru: Tamu Umum & Walisantri Reguler (Bin Nadzori, Tamatan, Tamu Umum).
- Sambangan:
  * Lokasi: Halaman Al-Khodijah (Bil Ghoib & Bin Nadzori) & Rusunawa Baru (Tamatan Aliyah).
  * Waktu: Selesai acara s/d 18.00 WIs. Syarat: Mahrom, daftar di Gerbang Bola Dunia membawa KKS/KK & KTP.
- Larangan Shohibul Hajat: Dilarang alat elektronik saat acara, dilarang buket, dilarang kutek/nail art, dilarang fotografer luar, dilarang menemui walisantri saat acara, dilarang sambangan di luar area/jam yang ditentukan.
- Kalender Kerja: Pra Gladikotor (17 Nov 2026), Final Validasi (10 Des 2026), Gladikotor (12 Des 2026), Gladibersih (16 Des 2026), Hari H Haflah (02 Jan 2027).
- Fitur Hitung Mundur Real-time (Countdown UI):
  * Aplikasi Haflah P3TQ & MHMTQ memiliki fitur Hitung Mundur (Countdown) yang berjalan secara real-time (Hari, Jam, Menit, Detik) melalui komponen EventCountdownGrid di halaman Undangan Digital (UI).
  * DILARANG menjawab "Saya tidak punya akses waktu realtime" atau menyatakan tidak bisa menghitung mundur. Anda selalu dibekali tanggal sistem hari ini dan data hitung mundur otomatis oleh server.
  * Jika user meminta hitung mundur realtime (atau menanyakan berapa hari lagi menuju Haflah), hitung selisih waktu menggunakan tanggal hari ini yang disuntikkan sistem menuju tanggal 2 Januari 2027 (06.30 WIB), lalu arahkan user membuka halaman Undangan Digital untuk melihat kotak Hitung Mundur yang bergerak live detik demi detik.
  * Contoh respons yang diharapkan: "Sisa waktu menuju Haflah adalah kurang lebih [X] hari lagi, Us. Untuk melihat hitungan mundur yang bergerak setiap detik (Hari, Jam, Menit, Detik), silakan buka halaman Undangan Digital di aplikasi."`;

export const SECTION_MULTIMEDIA_DOC = `ATURAN MULTIMEDIA & DOKUMEN:
1. Jangan menawarkan gambar/file secara proaktif jika tidak diminta.
2. Kamu memiliki fitur Web Image Search dan foto avatar resmi (/images/avatar/ustadzah-avatar-wave.png). Jika user meminta gambar atau foto, JANGAN memberikan deskripsi teks panjang dan DILARANG menjawab "Saya tidak dapat menampilkan gambar secara langsung". Panggil fitur pencarian gambar dan tampilkan hasilnya dengan format Markdown ![Deskripsi Gambar](URL_GAMBAR). Jika user meminta gambar/foto/wajah dirimu ("gambar kamu", "foto kamu", "wajah kamu"), tampilkan ![Usth. Halwaa](/images/avatar/ustadzah-avatar-wave.png).
3. Link: Format Markdown [Nama Website](https://url.com)
4. Tabel / Excel: WAJIB format Markdown (| ... |). DILARANG tag HTML.
5. PDF / Word: Berikan jawaban teks dokumen tertata rapi tanpa instruksi UI tombol unduh.`;

export const HAFLAH_KNOWLEDGE_SYSTEM_PROMPT = `${BASE_PERSONA_PROMPT}

${SECTION_KEPANITIAAN}

${SECTION_KEUANGAN}

${SECTION_ACARA_JADWAL}

${SECTION_MULTIMEDIA_DOC}`;;

export function isCountdownQuery(query: string): boolean {
  const q = query.toLowerCase().trim();
  return /\b(countdown|hitung\s*mundur|hitungan\s*mundur|sisa\s*hari|sisa\s*waktu|berapa\s*hari\s*lagi|tinggal\s*berapa\s*hari)\b/i.test(q);
}

export function getCountdownFallbackResponse(isFirstTurn: boolean = false): string {
  const info = getHaflahCountdownInfo();
  const greetingPrefix = isFirstTurn ? "Wa'alaikum Salam Wr. Wb.! 🙏✨\n\n" : "";

  if (info.isEventStarted) {
    return `${greetingPrefix}Alhamdulillah Us, berdasarkan tanggal sistem hari ini (**${info.currentDateFormatted}** pukul **${info.currentTimeFormatted} WIB**), waktu pelaksanaan **Haul & Haflah P3TQ dan MHMTQ 1448 H. / 02 Januari 2027** telah tiba.\n\nSilakan buka halaman **Undangan Digital** di aplikasi untuk memantau tampilan Hitung Mundur dan informasi jadwal acara.`;
  }

  return `${greetingPrefix}Berdasarkan tanggal sistem hari ini (**${info.currentDateFormatted}** pukul **${info.currentTimeFormatted} WIB**), sisa waktu menuju Haul & Haflah P3TQ & MHMTQ (Sabtu, 02 Januari 2027 pukul 06.30 WIB) adalah kurang lebih **${info.days} hari lagi** (tepatnya **${info.days} hari, ${info.hours} jam, ${info.minutes} menit** lagi / ${info.calendarDays} hari kalender), Us.\n\nAplikasi Haflah P3TQ & MHMTQ sudah memiliki fitur **Hitung Mundur (Countdown)** yang berjalan secara real-time (**Hari, Jam, Menit, Detik**). Untuk melihat hitungan mundur yang bergerak setiap detik, silakan buka halaman **Undangan Digital** di aplikasi.`;
}

export function getSelfAvatarResponse(isFirstTurn: boolean = false): string {
  const greetingPrefix = isFirstTurn ? "Wa'alaikum Salam Wr. Wb.! 🙏✨\n\n" : '';
  return `${greetingPrefix}Ini avatar resmi saya, Us! Saya **Usth. Halwaa**, asisten cerdas resmi Haul & Haflah P3TQ dan MHMTQ 1448 H. / 2027 M. 😊\n\n![Usth. Halwaa](${OFFICIAL_AVATAR_WAVE_PATH})`;
}

export async function generateLocalSmartResponseAsync(userQuery: string, isFirstTurn: boolean = true, role: string = 'PANITIA'): Promise<string> {
  const q = userQuery.toLowerCase().trim();

  // 0A. PRIORITAS UTAMA: AVATAR RESMI USTH. HALWAA (SEBELUM TECHNICAL KNOWLEDGE)
  if (isSelfAvatarRequest(userQuery)) {
    return getSelfAvatarResponse(isFirstTurn);
  }

  // 0B. PRIORITAS UTAMA: PENCARIAN GAMBAR WEB (SEBELUM TECHNICAL KNOWLEDGE)
  if (isImageSearchIntent(userQuery)) {
    const rawSubject = extractImageSubject(userQuery);
    const cleanSubject = rawSubject.charAt(0).toUpperCase() + rawSubject.slice(1);
    const imageResult = await searchWebImagesDetailed(userQuery);
    if (imageResult?.url) {
      return `${imageResult.caption}\n\n![${cleanSubject}](${imageResult.url})`;
    }
    return 'Mohon maaf Us, saya tidak menemukan gambar yang cocok di internet.';
  }

  // 0C. FITUR KNOWLEDGE BASE TEKNIS & INFRASTRUKTUR SISTEM
  if (isTechnicalInfrastructureQuery(userQuery)) {
    return handleTechnicalInfrastructureQuery(userQuery);
  }

  // 0. FITUR HITUNG MUNDUR / COUNTDOWN REALTIME
  if (isCountdownQuery(userQuery)) {
    return getCountdownFallbackResponse(isFirstTurn);
  }

  // 0. FITUR REKAP KEHADIRAN REALTIME
  if (detectRekapKehadiranIntent(userQuery)) {
    return await getLiveRekapKehadiran(isFirstTurn);
  }

  // 0. FITUR PENCARIAN LINK (HANYA JIKA DIMINTA EKSPLISIT)
  if (q.includes('link') || q.includes('tautan') || q.includes('website') || q.includes('toko')) {
    if (q.includes('shopee') || q.includes('seragam') || q.includes('beli')) {
      return `Tentu Us, berikut link pencarian seragam dan perlengkapan santri di Shopee:\n\n[Toko Seragam Santri di Shopee](https://shopee.co.id/search?keyword=seragam%20santri)`;
    }
    if (q.includes('lirboyo') || q.includes('pondok') || q.includes('pesantren')) {
      return `Tentu Us, berikut tautan resmi Pondok Pesantren Lirboyo Kediri:\n\n[Portal Resmi Pondok Pesantren Lirboyo](https://lirboyo.net)`;
    }
  }

  // 0. FITUR FILE EXCEL / TABEL DATA (HANYA JIKA DIMINTA EKSPLISIT)
  if (q.includes('excel') || q.includes('xlsx') || q.includes('tabel') || q.includes('table')) {
    if (q.includes('pos')) {
      return `Berikut daftar 8 Pos Penerima Tamu dalam format tabel data, Us:\n\n| No | Nama Pos | Tugas Utama | Lokasi |\n| --- | --- | --- | --- |\n| 1 | Pos 1 | Sambut Tamu VVIP & Masyayikh | Lobi Utama Aula |\n| 2 | Pos 2 | Meja Registrasi & Kartu Undangan | Sayap Barat Gerbang |\n| 3 | Pos 3 | Pemeriksaan Barcode Gerbang | Pintu Gerbang Bola Dunia |\n| 4 | Pos 4 | Meja Rekonsiliasi & Kuota | Samping Pos Registrasi |\n| 5 | Pos 5 | Distribusi Konsumsi & Souvenir | Selasar Aula Timur |\n| 6 | Pos 6 | Pengarah Zonasi Duduk | Pintu Masuk Aula |\n| 7 | Pos 7 | Pos Medis & Pertolongan Pertama | Samping Panggung Utama |\n| 8 | Pos 8 | Pusat Informasi & Pengaduan | Depan Kantor Sekretariat |`;
    }
    return `Berikut rekap data dalam format tabel excel yang siap diunduh, Us:\n\n| No | Kategori Peserta | Kuota Dasar | Tiket |\n| --- | --- | --- | --- |\n| 1 | Santri Bil Ghoib | 4 Kursi | Emas Panggung |\n| 2 | Santri Bin Nadzor | 2 Kursi | Reguler Biru |\n| 3 | Tamatan Aliyah | 2 Kursi | Reguler Biru |\n| 4 | Tamu Undangan VIP | 2 Kursi | VIP Istimewa |`;
  }

  // 0. FITUR FILE PDF / WORD (HANYA JIKA DIMINTA EKSPLISIT)
  if (q.includes('pdf') || q.includes('word') || q.includes('docx')) {
    const isDocx = q.includes('word') || q.includes('docx');
    const tag = isDocx ? '[DOWNLOAD_DOCX: Dokumen_Ringkasan_Haflah]' : '[DOWNLOAD_PDF: Dokumen_Ringkasan_Haflah]';
    return `Tentu Us, berikut dokumen ${isDocx ? 'Word' : 'PDF'} yang telah saya susun rapi:\n\n${tag}\n\n### Panduan Resmi Haul & Haflah P3TQ & MHMTQ\n* Acara: Haul & Haflah Akhirussanah 1448 H / 2027 M\n* Hari, Tanggal: Sabtu, 02 Januari 2027 (24 Rajab 1448 H)\n* Lokasi: Pondok Pesantren Putri Tahfizhil Qur-an Lirboyo Kediri\n* Kehadiran: Seluruh santri, wali santri, masyayikh, dan tamu undangan.`;
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

  // 14B. WARNA TIKET / KARTU MASUK
  if (
    q.includes('warna tiket') ||
    q.includes('warna kartu') ||
    q.includes('warna tiketnya') ||
    q.includes('tiket warna') ||
    q.includes('kartu masuk warna') ||
    (q.includes('warna') && (q.includes('tiket') || q.includes('kartu')))
  ) {
    return `${headerIntro}Warna tiket masuk resmi Haul & Haflah P3TQ & MHMTQ 2027 terdiri dari **Cream** dan **Biru**:
1. **Tiket Cream**: Khusus untuk Walisantri yang Maju Panggung Utama (**Takhtiman Bil Ghoib**).
2. **Tiket Biru**: Untuk Walisantri Shohibul Hajat Reguler (**Takhtiman Bin Nadzori** dan **Tamatan Aliyah**) serta **Tamu Undangan Umum**.

Ada lagi info yang bisa saya bantu, Us?`;
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

  // 0. FITUR HITUNG MUNDUR / COUNTDOWN REALTIME
  if (isCountdownQuery(userQuery)) {
    return getCountdownFallbackResponse(isFirstTurn);
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

  // WARNA TIKET / KARTU MASUK
  if (
    q.includes('warna tiket') ||
    q.includes('warna kartu') ||
    q.includes('warna tiketnya') ||
    q.includes('tiket warna') ||
    q.includes('kartu masuk warna') ||
    (q.includes('warna') && (q.includes('tiket') || q.includes('kartu')))
  ) {
    return `${headerIntro}Warna tiket masuk resmi Haul & Haflah P3TQ & MHMTQ 2027 terdiri dari **Cream** dan **Biru**:
1. **Tiket Cream**: Khusus untuk Walisantri yang Maju Panggung Utama (**Takhtiman Bil Ghoib**).
2. **Tiket Biru**: Untuk Walisantri Shohibul Hajat Reguler (**Takhtiman Bin Nadzori** dan **Tamatan Aliyah**) serta **Tamu Undangan Umum**.

Ada lagi info yang bisa saya bantu, Us?`;
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

export function cleanAIResponse(
  rawReply: string,
  userPrompt?: string,
  isFirstTurn: boolean = false,
  role: string = 'WALI'
): string {
  return cleanReplyForSession(rawReply, isFirstTurn, userPrompt, role);
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
  // (Jangan tambahkan jika respon sudah diakhiri kalimat penutup standar 4-paragraf kepanitiaan)
  const wordCount = reply.split(/\s+/).length;
  const hasMotivasiAlready = Object.values(MOTIVASI).some((categoryList) =>
    categoryList.some((m) => reply.includes(m.slice(0, 20)))
  );
  const isStrictPronounQuery =
    !!userPrompt &&
    (isSayaSiapaQuery(userPrompt) ||
      isKamuSiapaQuery(userPrompt) ||
      isThirdPersonPronounQuery(userPrompt));

  if (
    wordCount > 100 &&
    !hasMotivasiAlready &&
    !isStrictPronounQuery &&
    !reply.includes('http') &&
    !reply.includes('/admin/')
  ) {
    const closingMotivasi = getRandomMotivasi('energi_positif');
    reply += `\n\n${closingMotivasi}`;
  }

  // ATURAN EMAS (NO UNSOLICITED OFFER): Hapus tawaran proaktif pembuatan file/gambar di akhir jawaban jika user tidak memintanya
  const userAskedForMediaOrFile = !!userPrompt && /(gambar|foto|pdf|word|docx|excel|xlsx|tabel|unduh|download|link)/i.test(userPrompt);
  if (!userAskedForMediaOrFile) {
    reply = reply.replace(/(\n|^)[^\n]*?(apakah\s+(anda|kamu|us)\s+(ingin|mau|perlu|butuh)|jika\s+(anda|kamu|us)\s+(butuh|perlu|ingin)|beri\s+tahu\s+saya\s+jika)[^\n]*?(buatkan|bikin|unduh|ekspor|format|versi)?[^\n]*?(pdf|word|excel|docx|xlsx|file|gambar|dokumen)[^\n]*\??/gi, '');
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
