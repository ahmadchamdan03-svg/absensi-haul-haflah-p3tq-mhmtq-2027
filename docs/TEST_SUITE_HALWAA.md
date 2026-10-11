# TEST SUITE USTH. HALWAA AI ASSISTANT
**Haul & Haflah P3TQ & MHMTQ 1448 H. / 2027 M.**

Dokumen ini berisi kumpulan kasus uji baku (*test cases*) untuk memverifikasi keandalan dan konsistensi logika berpikir Usth. Halwaa AI Assistant. Test suite ini dirancang untuk mencegah terjadinya regresi setiap kali ada pembaruan kode.

---

## 1. TABEL UJI BAKU (STANDARD TEST CASES)

| No | Kategori | Query | Expected Intent | Expected Output (Cek Pola) | Status | Catatan Bug Terakhir / Konteks Historis |
|---|---|---|---|---|:---:|---|
| **1** | Kata Ganti Dia | `"siapa dia?"` | Motivasi Satir | 1 paragraf dari 50 template satir, tanpa salam/sapaan pembuka | ✅ PASS | Bug 2026-10-11: Kata "dia" sempat dicari ke database nama & keluar pesan "nama Dia tidak ditemukan". |
| **2** | Kata Ganti Kamu | `"kamu siapa?"` | Perkenalan Diri | Mengandung `**Usth. Halwaa**` + identitas asisten cerdas resmi 24 jam | ✅ PASS | Bug 2026-10-11: Sempat ditolak dengan pesan "tidak bisa mencari berdasarkan kata ganti". |
| **3** | Kata Ganti Saya | `"saya siapa?"` | Motivasi Positif | 2 paragraf motivasi mendalam penguat khidmah, tanpa penutup | ✅ PASS | Bug 2026-10-11: Sempat match ke 5 nama panitia acak di database (Kafabihi, Salma, dll.). |
| **4** | Kata Ganti Lain | `"siapa beliau?"` | Tolak Edukatif | Mengandung `"tidak bisa mencari berdasarkan kata ganti orang. Mohon sebutkan nama spesifik"` | ✅ PASS | Menolak kata ganti orang ketiga jamak/penghormatan agar database tidak terpolusi. |
| **5** | Rekap Kehadiran | `"rekap kehadiran hari ini"` | Rekap Live Supabase | Mengandung data LIVE: `Shohibul Hajat`, `Tamu Undangan`, `Total Scan`, dan jam `WIB` | ✅ PASS | Bug 2026-10-11: Kata "hari ini" fuzzy-match ke Pak Adi Susilo Kasi Keamanan. |
| **6** | Rekap Kehadiran | `"berapa tamu yang sudah datang"` | Rekap Live Supabase | Menampilkan statistik kehadiran tamu & Shohibul Hajat terkini | ✅ PASS | Format harus seragam dengan rekap live Supabase. |
| **7** | Info Seksi | `"seksi desain grafis"` | Info Seksi Spesifik | Menampilkan Kasi, Wakasi, & Anggota Putra (`In'amul`) dan Putri (`Adiva`) | ✅ PASS | Bug 2026-10-11: Intent gagal terdeteksi ("nama Seksi desain grafis tidak ditemukan"). |
| **8** | Info Seksi | `"anggota keamanan"` | Info Seksi Anggota | Menampilkan Kasi, Wakasi, dan seluruh Anggota Seksi Keamanan Putra & Putri | ✅ PASS | Deteksi kata "anggota" harus memicu info seksi lengkap. |
| **9** | Info Seksi | `"sebutkan seluruh banom"` | Seluruh Banom | Menampilkan 12 seksi lengkap (Kasi & Wakasi saja, tanpa nama anggota) | ✅ PASS | Format ringkas terstruktur 12 seksi tanpa detail anggota. |
| **10** | Info Seksi | `"seksi ngawur"` | Seksi Tidak Ditemukan | Mengandung `"seksi 'ngawur' tidak ditemukan"` + daftar seksi yang tersedia | ✅ PASS | Fallback jujur dan edukatif memberikan rekomendasi seksi resmi. |
| **11** | Nama (Exact Phrase) | `"ikfi ulit taufiqoh"` | Pencarian Tahap 1 | `**Ikfi Ulit Taufiqoh**` + persis 3 paragraf dengan sanjungan/fans | ✅ PASS | Bug 2026-10-11: Nama spesifik 3 kata salah match ke Akfi Romiyan karena fuzzy per-kata. |
| **12** | Nama (Exact Alias) | `"maulana"` | Pencarian Tahap 2A | Menjawab langsung `Muhammad Abdurrohman Maulana` (Pak Maulana) | ✅ PASS | Bug 2026-10-11: Sempat verifikasi 3 nama (Gama Maulana, Adiva Maulana, M. Maulana). |
| **13** | Nama (Substring Ganda) | `"yazid"` | Pencarian Tahap 2B | Pilihan verifikasi: `Abu Yazid Al Bustomi` dan `Muhammad Yazid Mahbubillah` | ✅ PASS | Menampilkan verifikasi "Maksud Anda yang mana?". |
| **14** | Nama (1 Hasil) | `"asep"` | Pencarian Tahap 2B | `**Asep Darajat**` (Kasi Sekretariat) + 3 paragraf fans + penutup standar | ✅ PASS | Verifikasi struktur 3 paragraf dan penutup standar. |
| **15** | Nama (Prefix Match) | `"taufi"` | Pencarian Tahap 3 | Menampilkan kandidat yang berawalan "taufi" (`Taufiq Hidayah`, dll.) | ✅ PASS | Tahap 3 prefix match aktif jika exact substring tidak menemukan kecocokan tunggal. |
| **16** | Nama (Typo Tolerance) | `"taufik"` | Pencarian Tahap 4 | Pilihan verifikasi: `Taufiq Hidayah` dan `Muhammad Taufiq` (Levenshtein = 1) | ✅ PASS | Hanya mentoleransi beda 1 huruf (k vs q) untuk kata $\ge 4$ karakter. |
| **17** | Nama (Tidak Ada) | `"dina siapa"` | Pencarian Tahap 5 | Mengandung `"nama **Dina** tidak ditemukan dalam struktur kepanitiaan"` | ✅ PASS | Bug 2026-10-11: Huruf acak d-i-n-a match ke Sinta Maelani & Inarotud Duja. |
| **18** | Prioritas Pencarian | `"ikfi"` | Prioritas Exact Substring | Wajib `**Ikfi Ulit Taufiqoh**` (BUKAN Akfi Romiyan Kafabih) | ✅ PASS | Bug 2026-10-11: Typo tolerance mendahului exact match sehingga lari ke Akfi. |
| **19** | Prioritas Pencarian | `"akfi"` | Prioritas Exact Substring | Wajib `**Akfi Romiyan Kafabih**` (Kasi Humasy & Kostum) | ✅ PASS | Memastikan query "akfi" tetap tepat sasaran ke Pak Akfi. |
| **20** | Kunci Template & Penutup | `"abha"` | Deterministic Locked Template | `**Abhaa Muhammad Kafaa Bihi**` + 3 paragraf fans + penutup standar bahasa Indonesia | ✅ PASS | Bug 2026-10-11: Fallback ke LLM ringkasan faktual & penutup bahasa Jawa. |

---

## 2. CARA MENJALANKAN TEST AUTOMATION

Skrip pengujian otomatis telah disediakan dan terintegrasi di `package.json`. Untuk memverifikasi seluruh test case secara otomatis:

```bash
npm run test:halwaa
```

Atau menggunakan `tsx` langsung:
```bash
npx tsx scripts/test-halwaa-suite.ts
```

Skrip ini akan mengevaluasi:
1. Regex kecocokan respons.
2. Integritas struktur 3 paragraf (`\n\n`).
3. Keberadaan kalimat sanjungan/fans di Paragraf 2.
4. Konsistensi kalimat penutup: `"Ada lagi info kepanitiaan yang bisa saya bantu, Us?"`.
5. Kebersihan dari penutup bahasa Jawa (*"Wonten ingkang saget dibantu malih"*).
