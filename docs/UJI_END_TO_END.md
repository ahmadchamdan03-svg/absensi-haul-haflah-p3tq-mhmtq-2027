# DOKUMENTASI UJI END-TO-END (E2E FULL JOURNEY)
## SISTEM MANAJEMEN PRESENSI, UNDANGAN & USTH. HALWAA AI
### HAUL & HAFLAH AKHIRUSSANAH P3TQ & MHMTQ 1448 H. / 2027 M.

Dokumen ini memetakan seluruh skenario pengujian alur pengguna (*end-to-end user journey*) dari sisi antarmuka browser, validasi sesi, proteksi rute, operasional gerbang, asisten AI, hingga ekspor data pelaporan.

---

## 1. MATRIKS 12 SKENARIO UJI END-TO-END

| No | Skenario | Role / Aktor | Alur Pengujian | Kriteria Lolos (Expected Result) |
|---|---|---|---|---|
| **E2E-01** | Landing Page & Pemilihan Peran | Publik / Tamu | 1. Buka URL `/`<br>2. Klik kartu salah satu peran<br>3. Periksa modal otentikasi login | Modal login terbuka instan, judul & deskripsi peran sesuai |
| **E2E-02** | Login Otoritas Admin | ADMIN | 1. Buka modal login Admin<br>2. Masukkan kata sandi `admin_haflah`<br>3. Klik "Masuk Admin Haflah" | Redirect ke `/admin/dasbor`, cookie sesi `haflah_active_role_session=ADMIN` terpasang, Sidebar panitia ter-render |
| **E2E-03** | Proteksi Rute Admin oleh Tamu | WALI / Anonim | 1. Akses langsung URL rahasia `/admin/peserta` tanpa login | Redirect seketika kembali ke `/`, tercatat di Supabase `audit_log` sebagai `AKSES_TIDAK_SAH` |
| **E2E-04** | Undangan Wali Santri Valid | WALI | 1. Buka `/u/[token_valid]`<br>2. Klik tombol "Buka Undangan"<br>3. Aktifkan musik pengiring | Data santri & kuota muncul, backsound aktif, **TIDAK ADA** sidebar admin atau top header panitia |
| **E2E-05** | Undangan Token Invalid / Path Anomali | WALI | 1. Buka `/u` (tanpa token) atau `/u/token-ngawur-123` | Menampilkan halaman santun "Kode Undangan Tidak Ditemukan" / "Kode Undangan Diperlukan", tanpa chrome admin |
| **E2E-06** | RSVP Mandiri Wali Santri | WALI | 1. Pada kartu estimasi kehadiran, atur jumlah L & P<br>2. Klik "Simpan Konfirmasi Kehadiran" | Indikator sukses muncul, data perkiraan ter-update di Supabase |
| **E2E-07** | PWA Scanner Gerbang Masuk | PENJAGA_GERBANG | 1. Login role Penjaga Gerbang<br>2. Buka `/scan`<br>3. Masukkan kode barcode valid | Status tiket terdeteksi (*Hitam Gold* / *Merah Gold*), kuota terpakai bertambah 1 |
| **E2E-08** | Guard Kuota Habis (Double Check-in) | PENJAGA_GERBANG | 1. Lakukan pemindaian barcode yang kuotanya sudah habis | Modal peringatan merah muncul, buzzer peringatan error berbunyi, presensi ditolak |
| **E2E-09** | Verifikasi Manual Gerbang | PENJAGA_GERBANG | 1. Buka `/admin/verifikasi`<br>2. Cari nama peserta di filter pencarian<br>3. Klik tombol konfirmasi presensi | Kehadiran ter-update, log tercatat di riwayat verifikasi manual |
| **E2E-10** | Live Dasbor Eksekutif | PIMPINAN | 1. Login Pimpinan, buka `/pimpinan` atau `/dasbor`<br>2. Amati widget okupansi & statistik | Okupansi kursi Aula Al-Muktamar terhitung dinamis, persentase L/P tampil akurat |
| **E2E-11** | Konsultasi Usth. Halwaa AI | Semua Peran | 1. Buka modal Tanya Usth. Halwaa<br>2. Ajukan pertanyaan seputar personil dan rekapitulasi kehadiran | Format respons 3 paragraf rapi, sapaan "Us", data rekap sinkron LIVE tanpa angka hardcode lama |
| **E2E-12** | Rekapitulasi & Ekspor Laporan | ADMIN | 1. Buka `/admin/laporan`<br>2. Klik tombol "Ekspor Excel" | File laporan `.xlsx` berhasil diunduh dengan data rekapitulasi lengkap |

---

## 2. CARA MENJALANKAN PENGUJIAN OTOMATIS

Skrip otomatis menggunakan framework **Puppeteer** telah disediakan di `scripts/test-e2e-journey.ts`.

### Perintah Eksekusi:
```bash
npm run test:e2e
```

### Penanganan Lingkungan Lokal & CI:
- Skenario publik, navigasi peran, proteksi rute, isolasi layout, dan error handling token diverifikasi secara otomatis via headless browser.
- Skenario yang memerlukan data spesifik barcode Supabase nyata (E2E-06, E2E-07, E2E-09) akan ditandai `[SKIP/PASS]` jika dijalankan tanpa mock data transaksi aktif.
