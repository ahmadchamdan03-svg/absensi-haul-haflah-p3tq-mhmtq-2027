# PRODUCT REQUIREMENTS DOCUMENT (PRD)
# FITUR PERSIDANGAN — UNDANGAN DIGITAL KEPANITIAAN
## HAUL & HAFLAH P3TQ & MHMTQ LIRBOYO 1448 H. / 2027 M.

═══════════════════════════════════════════
[INFORMASI DOKUMEN]
═══════════════════════════════════════════

Versi           : v1.0.0 (Initial Release)
Status          : Ready for Implementation
Tipe Fitur      : Modular / Temporary — bisa dihapus kapan saja
Platform        : Next.js 14 App Router + Supabase + Fonnte API
Dependensi      : Minimal (tidak mengubah Halwaa, presensi, peserta, tamu, rekap)
Estimasi Selesai: 1 sprint (1-2 hari kerja Agrav)

═══════════════════════════════════════════
[1. RINGKASAN EKSEKUTIF]
═══════════════════════════════════════════

Fitur Persidangan adalah modul tambahan untuk membuat dan mengirim undangan digital persidangan kepanitiaan (contoh: Sidang Harian II, Sidang Pleno, Sidang Ndalem) kepada peserta via WhatsApp.

Fitur ini menyediakan:
- Dashboard untuk mengelola persidangan
- Upload PDF undangan resmi (yang sudah ditandatangani Ketua Umum & Sekretaris)
- Editor template kata-kata WhatsApp
- Manajemen peserta (input manual + import Excel)
- Pengiriman WA per peserta via Fonnte API
- Halaman publik undangan dengan token rahasia + embed PDF viewer

Sifat fitur: Modular, standalone, DI LUAR SISTEM UTAMA. Dapat dihapus kapan saja tanpa merusak sistem existing.

═══════════════════════════════════════════
[2. SCOPE]
═══════════════════════════════════════════

TERMASUK (IN SCOPE):
1. Dashboard CRUD persidangan
2. Upload PDF undangan ke Supabase Storage
3. Custom template kata-kata WA dengan placeholder dinamis
4. Input peserta manual (nama + no WA + kategori)
5. Import peserta via Excel (.xlsx)
6. Kirim WA per peserta (bukan massal)
7. Halaman publik undangan dengan validasi token
8. Embed PDF viewer di halaman publik
9. Menu sidebar "Persidangan" (khusus role ADMIN)

TIDAK TERMASUK (OUT OF SCOPE):
1. Tracking view (log siapa yang buka link)
2. Audit log untuk aksi kirim WA
3. Kirim WA massal (bulk)
4. Auto-kirim WA saat tambah peserta
5. Integrasi dengan database peserta existing (peserta_santri / tamu_undangan)
6. Statistik/analytics penggunaan
7. Template default multi-varian
8. Role selain ADMIN untuk akses fitur

═══════════════════════════════════════════
[3. USER FLOW]
═══════════════════════════════════════════

ADMIN:
1. Buka menu "Persidangan" dari sidebar
2. Klik "+ Buat Persidangan Baru" — isi: judul, tanggal, waktu, tempat, agenda
3. Upload PDF undangan resmi — generate link publik + token
4. Tambah peserta: manual input (nama, no WA, kategori) atau Import Excel batch
5. Edit template WA (opsional) dengan placeholder
6. Klik tombol "Kirim WA" per peserta
7. Update status_kirim (BELUM → TERKIRIM / GAGAL)

PESERTA:
8. Terima WA berisi kata-kata + link undangan
9. Klik link → buka /undangan/[slug]?token=xxx
10. Lihat cover + embed PDF + tombol Download PDF

Flow ringkas:
Admin buat → Upload PDF → Tambah peserta → Kirim WA per peserta → Peserta terima WA → Peserta buka link → Lihat cover + PDF

═══════════════════════════════════════════
[4. SKEMA DATA]
═══════════════════════════════════════════

TABEL 4.1: persidangan
- id              : UUID (PK), auto-generated
- slug            : VARCHAR(80) UNIQUE, dari judul lowercase dash-separated
- token           : VARCHAR(64) UNIQUE, random 32 char (UUID tanpa dash)
- judul           : VARCHAR(200), contoh "Sidang Harian II"
- deskripsi       : TEXT, keterangan singkat (opsional)
- tanggal         : DATE, tanggal pelaksanaan
- waktu           : VARCHAR(50), contoh "09.00 WIs (Malam)"
- tempat          : VARCHAR(200), contoh "Aula Al Barokah"
- agenda          : TEXT, isi/agenda sidang (opsional)
- pdf_url         : TEXT, link ke Supabase Storage
- template_wa     : TEXT, template pesan WA
- status          : VARCHAR(20), DRAFT / AKTIF / SELESAI
- created_at      : TIMESTAMPTZ, auto
- updated_at      : TIMESTAMPTZ, auto

TABEL 4.2: persidangan_peserta
- id              : UUID (PK), auto-generated
- persidangan_id  : UUID (FK), ON DELETE CASCADE
- nama            : VARCHAR(200), nama penerima undangan
- no_wa           : VARCHAR(20), format 628xxx
- kategori        : VARCHAR(50), DEWAN_HARIAN / DEWAN_PEMBIMBING / DEWAN_PLENO / TAMU_VVIP / TAMU_VIP / LAINNYA
- status_kirim    : VARCHAR(20), BELUM / TERKIRIM / GAGAL
- waktu_kirim     : TIMESTAMPTZ, kapan WA terkirim
- error_msg       : TEXT, pesan error kalau gagal
- created_at      : TIMESTAMPTZ, auto

STORAGE BUCKET 4.3:
- Bucket: undangan-pdf
- Path: {persidangan_id}/{filename}.pdf
- Akses: public read, anon write
- Max size: 5 MB

PLACEHOLDER TEMPLATE WA 4.4:
- [NAMA_PESERTA]       → Nama dari tabel peserta
- [JUDUL_PERSIDANGAN]  → Kolom judul
- [TANGGAL]            → Kolom tanggal (format Indonesia)
- [WAKTU]              → Kolom waktu
- [TEMPAT]             → Kolom tempat
- [LINK_UNDANGAN]      → https://haflahp3tq.site/undangan/{slug}?token={token}

═══════════════════════════════════════════
[5. FILE LIST]
═══════════════════════════════════════════

FILE BARU (CREATE):
1. lib/persidangan.ts
   - Helper functions + interface TypeScript + Fonnte sender
2. app/admin/persidangan/page.tsx
   - Dashboard grid kartu persidangan
3. app/admin/persidangan/new/page.tsx
   - Form buat persidangan baru
4. app/admin/persidangan/[id]/page.tsx
   - Detail persidangan (4 tab)
5. app/(public)/undangan/[slug]/page.tsx
   - Halaman publik undangan
6. components/PersidanganForm.tsx
   - Form reusable create/edit
7. components/PersidanganPesertaTable.tsx
   - Tabel peserta + kirim WA per baris
8. components/PersidanganPDFUploader.tsx
   - Upload PDF + copy link publik
9. docs/PRD_PERSIDANGAN.md
   - Dokumen ini

FILE DIMODIFIKASI (MODIFY):
1. components/Sidebar.tsx
   - Tambah 1 menu "Persidangan" (role ADMIN)

Total: 9 file baru + 1 file dimodifikasi.

═══════════════════════════════════════════
[6. CLEANUP GUIDE — CARA HAPUS FITUR]
═══════════════════════════════════════════

6.1. HAPUS FILE
rm -rf app/admin/persidangan/
rm -rf app/(public)/undangan/
rm components/PersidanganForm.tsx
rm components/PersidanganPesertaTable.tsx
rm components/PersidanganPDFUploader.tsx
rm lib/persidangan.ts
rm docs/PRD_PERSIDANGAN.md

6.2. REVERT SIDEBAR
Buka components/Sidebar.tsx, hapus 1 baris menu "Persidangan" dari area setelah "Rekap & Ekspor".

6.3. HAPUS TABEL SUPA
DROP TABLE IF EXISTS persidangan_peserta CASCADE;
DROP TABLE IF EXISTS persidangan CASCADE;

6.4. HAPUS STORAGE BUCKET
DELETE FROM storage.objects WHERE bucket_id = 'undangan-pdf';
DELETE FROM storage.buckets WHERE id = 'undangan-pdf';

6.5. VERIFIKASI CLEANUP
- npm run build → 0 error
- Sidebar tidak menampilkan menu "Persidangan"
- Route /admin/persidangan → 404
- Route /undangan/xxx → 404
- Tidak ada error di Console Supabase

Estimasi waktu cleanup: < 15 menit.

═══════════════════════════════════════════
[7. DESIGN & TEMA]
═══════════════════════════════════════════

Warna utama     : Krem #F5E6D3
Warna aksen     : Coklat #8C6A47
Warna highlight : Emas #D49B5B
Warna background: #FAF7F3
Warna teks utama: #422F21
Font judul      : Serif
Font body       : Sans-serif
Border radius   : rounded-xl atau rounded-2xl
Shadow          : Soft, tidak berat
Modal           : Tutup dengan ESC + klik area luar

═══════════════════════════════════════════
[8. ATURAN TEKNIS]
═══════════════════════════════════════════

1. TypeScript strict mode: 0 error
2. Build: npm run build sukses
3. Test suite: npm run test:halwaa tetap 36/36 PASS (tidak ada regresi)
4. Normalisasi No WA:
   - Mulai "08"  → replace jadi "628"
   - Mulai "+62" → replace jadi "62"
   - Mulai "8"   → tambahkan prefix "62"
5. Fonnte API:
   - Endpoint: POST https://api.fonnte.com/send
   - Header: Authorization: {FONNTE_API_KEY}
   - Body: target, message, countryCode=62
6. Validasi Upload PDF:
   - Format: hanya .pdf
   - Size: max 5 MB
   - Nama file disanitasi (hapus karakter khusus)
7. Token Generation:
   - crypto.randomUUID().replace(/-/g, '') → 32 karakter
   - Unique di tabel
8. Slug Generation:
   - Lowercase judul
   - Replace spasi dengan dash
   - Hapus karakter non-alphanumeric (kecuali dash)
   - Cek uniqueness di Supa
