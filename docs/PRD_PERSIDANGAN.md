# PRODUCT REQUIREMENTS DOCUMENT (PRD)
# FITUR PERSIDANGAN — UNDANGAN DIGITAL KEPANITIAAN
## HAUL & HAFLAH P3TQ & MHMTQ LIRBOYO 1448 H. / 2027 M.

═══════════════════════════════════════════
[INFORMASI DOKUMEN]
═══════════════════════════════════════════

Versi           : v1.1.0 (Revisi 1.0 — Direct PDF Link & Simplified UI)
Status          : Implemented & Verified
Tipe Fitur      : Modular / Standalone — bisa dihapus kapan saja
Platform        : Next.js 14 App Router + Supabase Storage + Fonnte API
Dependensi      : Minimal (tidak mengubah Halwaa, presensi, peserta, tamu, rekap)

═══════════════════════════════════════════
[1. RINGKASAN EKSEKUTIF]
═══════════════════════════════════════════

Fitur Persidangan adalah modul tambahan untuk membuat dan mengirim undangan digital persidangan kepanitiaan (contoh: Sidang Harian II, Sidang Pleno, Sidang Ndalem) kepada peserta via WhatsApp dengan menyertakan tautan berkas PDF resmi langsung dari Supabase Storage.

Fitur ini menyediakan:
- Dashboard untuk mengelola persidangan
- Formulir ringkas: Judul Persidangan + Template Pesan WhatsApp
- Upload PDF undangan resmi ke Supabase Storage (yang sudah ditandatangani Ketua Umum & Sekretaris)
- Tombol salin link langsung PDF Supabase Storage
- Manajemen peserta sederhana (Nama + Nomor WhatsApp, tanpa kategori)
- Import peserta via Excel (.xlsx, Kolom A: Nama, Kolom B: No WA)
- Pengiriman WA per peserta via Fonnte API dengan tautan langsung PDF

Sifat fitur: Modular, standalone, DI LUAR SISTEM UTAMA. Dapat dihapus kapan saja tanpa merusak sistem existing.

═══════════════════════════════════════════
[2. SCOPE]
═══════════════════════════════════════════

TERMASUK (IN SCOPE):
1. Dashboard CRUD persidangan
2. Formulir sederhana (Judul + Template WA)
3. Upload PDF undangan ke Supabase Storage
4. Custom template kata-kata WA dengan tautan [LINK_PDF_LANGSUNG]
5. Input peserta manual (nama + no WA)
6. Import peserta via Excel (.xlsx)
7. Kirim WA per peserta (bukan massal) dengan link PDF langsung
8. Menu sidebar "Persidangan" (khusus role ADMIN)

TIDAK TERMASUK (OUT OF SCOPE):
1. Halaman publik internal /undangan/[slug] (sudah digantikan oleh direct PDF link)
2. Kategori peserta di tabel dan modal (sudah dihilangkan)
3. Input tanggal, waktu, tempat, deskripsi, agenda di form (sudah dihilangkan)

═══════════════════════════════════════════
[3. USER FLOW REVISI 1.0]
═══════════════════════════════════════════

ADMIN:
1. Buka menu "Persidangan" dari sidebar
2. Klik "+ Buat Persidangan Baru" — isi: Judul + Template WA
3. Submit $\to$ otomatis diarahkan ke Tab 2 (Dokumen PDF)
4. Upload PDF undangan resmi $\to$ dapatkan link langsung Supabase Storage
5. Buka Tab 3 (Peserta) $\to$ Tambah peserta manual (Nama + No WA) atau Import Excel
6. Klik tombol "Kirim WA" per peserta $\to$ konfirmasi pengiriman
7. Status peserta terupdate ke TERKIRIM

PESERTA:
8. Terima WA berisi kata-kata undangan resmi + tautan langsung PDF
9. Klik tautan $\to$ langsung membuka berkas PDF di viewer bawaan browser tanpa error embed/CSP

═══════════════════════════════════════════
[4. FILE LIST (REVISI 1.0)]
═══════════════════════════════════════════

FILE FITUR:
1. lib/persidangan.ts
   - Helper functions, interface TypeScript, Fonnte sender, format pesan direct PDF
2. app/admin/persidangan/page.tsx
   - Dashboard grid kartu persidangan
3. app/admin/persidangan/new/page.tsx
   - Form buat persidangan baru (Judul + Template WA)
4. app/admin/persidangan/[id]/page.tsx
   - Detail persidangan (3 tab: Info, Dokumen PDF, Peserta & Kirim WA)
5. components/PersidanganForm.tsx
   - Form reusable (Judul + Template WA)
6. components/PersidanganPesertaTable.tsx
   - Tabel peserta bersih (Nama, No WA, Status Kirim, Aksi) tanpa kolom/filter kategori
7. components/PersidanganPDFUploader.tsx
   - Upload PDF + tombol "Salin Link PDF" langsung ke Supabase Storage
8. docs/PRD_PERSIDANGAN.md
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
