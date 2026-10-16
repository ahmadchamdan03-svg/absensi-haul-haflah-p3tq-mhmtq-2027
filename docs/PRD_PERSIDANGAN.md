# PRODUCT REQUIREMENTS DOCUMENT (PRD)
# FITUR PERSIDANGAN — UNDANGAN DIGITAL KEPANITIAAN
## HAUL & HAFLAH P3TQ & MHMTQ LIRBOYO 1448 H. / 2027 M.

═══════════════════════════════════════════
[INFORMASI DOKUMEN]
═══════════════════════════════════════════

Versi           : v1.3.0 (PDF to JPG Conversion — Universal Mobile/Desktop Viewing)
Status          : Implemented & Verified
Tipe Fitur      : Modular / Standalone — bisa dihapus kapan saja
Platform        : Next.js 14 App Router + Supabase Storage + Fonnte API + pdf-to-img
Dependensi      : Minimal (tidak mengubah Halwaa, presensi, peserta, tamu, rekap)

═══════════════════════════════════════════
[1. RINGKASAN EKSEKUTIF]
═══════════════════════════════════════════

Fitur Persidangan adalah modul tambahan untuk membuat dan mengirim undangan digital persidangan kepanitiaan (contoh: Sidang Harian II, Sidang Pleno, Sidang Ndalem) kepada peserta via WhatsApp dengan menyertakan tautan resmi publik `https://haflahp3tq.site/persidangan/[slug]`.

Fitur ini menyediakan:
- Dashboard untuk mengelola persidangan
- Formulir ringkas: Judul Persidangan + Template Pesan WhatsApp
- Upload PDF undangan resmi ke Supabase Storage (yang sudah ditandatangani Ketua Umum & Sekretaris)
- **Konversi otomatis PDF ke Gambar (JPG)** via serverless endpoint `/api/persidangan/convert-pdf` menggunakan `pdf-to-img`
- Halaman publik resmi `/persidangan/[slug]` yang me-render **gambar JPG resolusi tinggi** (scrollable, natural pinch-to-zoom di HP tanpa perlu PDF viewer / iframe) + floating action bar (⬇ Unduh PDF, ↗ Buka di Tab Baru, Kembali)
- Tombol salin link resmi `https://haflahp3tq.site/persidangan/[slug]` di admin dashboard & uploader
- Pratinjau gambar JPG di Tab 2 Dokumen PDF admin
- Manajemen peserta sederhana (Nama + Nomor WhatsApp, tanpa kategori)
- Import peserta via Excel (.xlsx, Kolom A: Nama, Kolom B: No WA)
- Pengiriman WA per peserta via Fonnte API dengan tautan publik resmi persidangan

Sifat fitur: Modular, standalone, DI LUAR SISTEM UTAMA. Dapat dihapus kapan saja tanpa merusak sistem existing.

═══════════════════════════════════════════
[2. SCOPE]
═══════════════════════════════════════════

TERMASUK (IN SCOPE):
1. Dashboard CRUD persidangan
2. Formulir sederhana (Judul + Template WA)
3. Upload PDF undangan ke Supabase Storage
4. Custom template kata-kata WA dengan tautan [LINK_UNDANGAN] -> https://haflahp3tq.site/persidangan/[slug]
5. Halaman publik viewer fullscreen /persidangan/[slug] dengan tombol floating Unduh PDF
6. Tombol "Salin Link Resmi" pada halaman detail persidangan admin
7. Input peserta manual (nama + no WA)
8. Import peserta via Excel (.xlsx)
9. Kirim WA per peserta (bukan massal)
10. Menu sidebar "Persidangan" (khusus role ADMIN)

TIDAK TERMASUK (OUT OF SCOPE):
1. Halaman token individual /undangan/[slug]?token=... (sudah dihapus dan disatukan ke /persidangan/[slug])
2. Kategori peserta di tabel dan modal (sudah dihilangkan)
3. Input tanggal, waktu, tempat, deskripsi, agenda di form UI (sudah dihilangkan)

═══════════════════════════════════════════
[3. USER FLOW REVISI 1.0]
═══════════════════════════════════════════

ADMIN:
1. Buka menu "Persidangan" dari sidebar
2. Klik "+ Buat Persidangan Baru" — isi: Judul + Template WA
3. Submit -> otomatis diarahkan ke Tab 2 (Dokumen PDF)
4. Upload PDF undangan resmi -> tombol "Salin Link Resmi" aktif
5. Buka Tab 3 (Peserta) -> Tambah peserta manual (Nama + No WA) atau Import Excel
6. Klik tombol "Kirim WA" per peserta -> konfirmasi pengiriman
7. Status peserta terupdate ke TERKIRIM

PESERTA:
8. Terima WA berisi kata-kata undangan resmi + tautan resmi https://haflahp3tq.site/persidangan/[slug]
9. Klik tautan -> membuka halaman publik resmi dengan tampilan PDF fullscreen dan tombol unduh floating

═══════════════════════════════════════════
[4. FILE LIST (REVISI 1.0)]
═══════════════════════════════════════════

FILE FITUR:
1. lib/persidangan.ts
   - Helper functions, interface TypeScript, Fonnte sender, format pesan template, slug query
2. app/(public)/persidangan/[slug]/page.tsx
   - Halaman publik viewer PDF fullscreen + floating action button Unduh & Kembali
3. app/admin/persidangan/page.tsx
   - Dashboard grid kartu persidangan
4. app/admin/persidangan/new/page.tsx
   - Form buat persidangan baru (Judul + Template WA)
5. app/admin/persidangan/[id]/page.tsx
   - Detail persidangan (3 tab: Info, Dokumen PDF, Peserta & Kirim WA) + tombol Salin Link Resmi
6. components/PersidanganForm.tsx
   - Form reusable (Judul + Template WA)
7. components/PersidanganPesertaTable.tsx
   - Tabel peserta bersih (Nama, No WA, Status Kirim, Aksi) tanpa kolom/filter kategori
8. components/PersidanganPDFUploader.tsx
   - Upload PDF + tombol "Salin Link Resmi" (https://haflahp3tq.site/persidangan/[slug])
9. docs/PRD_PERSIDANGAN.md
   - Dokumen ini

FILE DIMODIFIKASI:
1. components/Sidebar.tsx
   - Menu "Persidangan" (role ADMIN)

═══════════════════════════════════════════
[5. CLEANUP GUIDE — CARA HAPUS FITUR]
═══════════════════════════════════════════

5.1. HAPUS FILE
rm -rf app/admin/persidangan/
rm components/PersidanganForm.tsx
rm components/PersidanganPesertaTable.tsx
rm components/PersidanganPDFUploader.tsx
rm lib/persidangan.ts
rm docs/PRD_PERSIDANGAN.md

5.2. REVERT SIDEBAR
Buka components/Sidebar.tsx, hapus 1 baris menu "Persidangan" dari area setelah "Rekap & Ekspor".

5.3. HAPUS TABEL SUPA
DROP TABLE IF EXISTS persidangan_peserta CASCADE;
DROP TABLE IF EXISTS persidangan CASCADE;

5.4. HAPUS STORAGE BUCKET
DELETE FROM storage.objects WHERE bucket_id = 'undangan-pdf';
DELETE FROM storage.buckets WHERE id = 'undangan-pdf';
