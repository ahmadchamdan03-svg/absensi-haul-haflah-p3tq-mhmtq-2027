-- =====================================================================
-- SKRIP MIGRASI SQL SEKALI JALAN: HAUL & HAFLAH P3TQ - MHMTQ 1448 H. / 2027 M.
-- PONDOK PESANTREN PUTRI TAHFIZHIL QUR'AN & MHMTQ LIRBOYO KOTA KEDIRI
--
-- Karakteristik Skrip:
-- 1. Membersihkan tabel dummy lama (siswa, kamar, alamat).
-- 2. Menyiapkan skema tabel bersih (0 data peserta awal) siap untuk
--    pengisian manual langsung oleh panitia melalui aplikasi web.
-- 3. Mendukung tipe data kuota, presensi, pemesanan kuota, dan log audit.
-- =====================================================================

BEGIN;

-- 1. HAPUS TABEL DUMMY / LEGACY YANG SUDAH TIDAK DIGUNAKAN
DROP TABLE IF EXISTS siswa CASCADE;
DROP TABLE IF EXISTS kamar CASCADE;
DROP TABLE IF EXISTS alamat CASCADE;

-- 2. EKSTENSI POSTGRESQL
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 3. TABEL UTAMA: PESERTA SANTRI (Keluarga Sohibul Hajat)
-- Disiapkan bersih (0 baris), siap diisi manual oleh panitia lewat menu aplikasi
CREATE TABLE IF NOT EXISTS peserta_santri (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode VARCHAR(20) NOT NULL UNIQUE, -- Contoh: SH0001, SH0002...
  nama VARCHAR(255) NOT NULL,
  kategori_utama VARCHAR(50) NOT NULL DEFAULT 'BIL_GHOIB', -- BIL_GHOIB, BIN_NADZOR, TAMATAN
  sub_kategori VARCHAR(100) NOT NULL DEFAULT 'Bil Ghoib',
  kelas VARCHAR(50) DEFAULT '-',
  kamar VARCHAR(50) DEFAULT '-',
  nama_wali VARCHAR(255) NOT NULL DEFAULT '-',
  alamat TEXT DEFAULT 'Kediri',
  no_hp VARCHAR(50) DEFAULT '-',
  kuota_dasar SMALLINT NOT NULL DEFAULT 2,
  kuota_tambahan SMALLINT NOT NULL DEFAULT 0,
  kuota_terpakai SMALLINT NOT NULL DEFAULT 0,
  tiket_panggung_jatah SMALLINT NOT NULL DEFAULT 0, -- 1 untuk Bil Ghoib (Wali Maju Panggung)
  tiket_panggung_diberi SMALLINT NOT NULL DEFAULT 0,
  warna_tiket VARCHAR(50) DEFAULT 'Merah Gold', -- 'Hitam Gold' (Maju Panggung) / 'Merah Gold' (Reguler)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_peserta_santri_kode ON peserta_santri (kode);
CREATE INDEX IF NOT EXISTS idx_peserta_santri_kat ON peserta_santri (kategori_utama);

-- 4. TABEL UTAMA: TAMU UNDANGAN (Penguji, Asatidz, Dzuriyyah, VIP/VVIP)
-- Disiapkan bersih (0 baris), siap diisi manual oleh panitia lewat menu aplikasi
CREATE TABLE IF NOT EXISTS tamu_undangan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode VARCHAR(20) NOT NULL UNIQUE, -- Contoh: UND0101, UND0102...
  nama VARCHAR(255) NOT NULL,
  nama_putra VARCHAR(255),
  nama_putri VARCHAR(255),
  kategori VARCHAR(100) NOT NULL DEFAULT 'Tamu Kehormatan',
  sub_kategori VARCHAR(50) NOT NULL DEFAULT 'PENGUJI', -- PENGUJI, ASATIDZ_MASYAIKH, DZURIYYAH
  instansi VARCHAR(255) DEFAULT '-',
  alamat TEXT DEFAULT 'Kediri',
  kuota_dasar SMALLINT NOT NULL DEFAULT 2,
  kuota_tambahan SMALLINT NOT NULL DEFAULT 0,
  kuota_terpakai SMALLINT NOT NULL DEFAULT 0,
  warna_tiket VARCHAR(50) DEFAULT 'Merah Gold',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tamu_undangan_kode ON tamu_undangan (kode);
CREATE INDEX IF NOT EXISTS idx_tamu_undangan_sub ON tamu_undangan (sub_kategori);

-- 5. TABEL LOG PRESENSI REALTIME
CREATE TABLE IF NOT EXISTS presensi_log (
  id BIGSERIAL PRIMARY KEY,
  kode_qr VARCHAR(50) NOT NULL,
  nama_peserta VARCHAR(255),
  tipe_peserta VARCHAR(50) DEFAULT 'KELUARGA', -- KELUARGA / UNDANGAN
  jumlah_l SMALLINT NOT NULL DEFAULT 0,
  jumlah_p SMALLINT NOT NULL DEFAULT 0,
  jumlah_balita SMALLINT NOT NULL DEFAULT 0,
  tiket_panggung BOOLEAN NOT NULL DEFAULT FALSE,
  jalur VARCHAR(20) DEFAULT 'BARAT', -- BARAT, TIMUR, REKONSILIASI
  panitia_id VARCHAR(100) DEFAULT 'panitia-gate',
  nonce VARCHAR(100) UNIQUE,
  server_time VARCHAR(50),
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presensi_log_kode ON presensi_log (kode_qr);
CREATE INDEX IF NOT EXISTS idx_presensi_log_time ON presensi_log (created_at);

-- 6. TABEL PEMESANAN KUOTA TAMBAHAN (PAGU 300 KURSI @ Rp 80.000)
CREATE TABLE IF NOT EXISTS pemesanan_kuota (
  id VARCHAR(50) PRIMARY KEY,
  kode_peserta VARCHAR(50) NOT NULL,
  nama_wali VARCHAR(255),
  jumlah SMALLINT NOT NULL DEFAULT 1,
  total_bayar INT NOT NULL DEFAULT 80000,
  status VARCHAR(50) NOT NULL DEFAULT 'DIPESAN', -- DIPESAN, MENUNGGU_VERIFIKASI, DIVERIFIKASI, DITOLAK, KEDALUWARSA
  bukti_url TEXT,
  kedaluwarsa_at TIMESTAMPTZ,
  catatan_panitia TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pemesanan_status ON pemesanan_kuota (status);

-- 7. TABEL KONFIGURASI ACARA RESMI
CREATE TABLE IF NOT EXISTS konfigurasi_acara (
  slug VARCHAR(50) PRIMARY KEY,
  nama_acara VARCHAR(255) NOT NULL,
  tempat TEXT,
  waktu_mulai TIMESTAMPTZ,
  kunci_hmac TEXT,
  pagu_total INT DEFAULT 300,
  pagu_terjual INT DEFAULT 0,
  harga_per_unit INT DEFAULT 80000,
  rekening_tujuan TEXT,
  kuota_tambahan_buka BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inisialisasi Master Konfigurasi Acara Resmi
INSERT INTO konfigurasi_acara (
  slug, nama_acara, tempat, waktu_mulai, kunci_hmac,
  pagu_total, pagu_terjual, harga_per_unit, rekening_tujuan, kuota_tambahan_buka
) VALUES (
  'HFL27',
  'Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.',
  'Aula Al-Muktamar Pondok Pesantren Lirboyo Kediri',
  '2027-01-02 06:30:00+07',
  'p3tq_secret_hmac_key_2027',
  300,
  0,
  80000,
  'BRI 320701010266508 a.n. Ahmad Chamdan Yuwafin',
  false
) ON CONFLICT (slug) DO UPDATE SET
  nama_acara = EXCLUDED.nama_acara,
  tempat = EXCLUDED.tempat,
  waktu_mulai = EXCLUDED.waktu_mulai;

-- 8. VIEW REKAPITULASI CEPAT
CREATE OR REPLACE VIEW v_rekap_kehadiran AS
SELECT
  COUNT(*) FILTER (WHERE kuota_terpakai > 0) AS total_hadir,
  COUNT(*) FILTER (WHERE kuota_terpakai = 0) AS total_belum_hadir,
  SUM(kuota_dasar + kuota_tambahan) AS total_kursi_alokasi,
  SUM(kuota_terpakai) AS total_kursi_terpakai,
  COUNT(*) AS total_peserta
FROM peserta_santri;

COMMIT;

-- VERIFIKASI SKEMA
SELECT 'Skrip Migrasi Supabase Selesai! Tabel siap diisi manual oleh panitia.' AS status,
       (SELECT COUNT(*) FROM peserta_santri) AS jumlah_santri,
       (SELECT COUNT(*) FROM tamu_undangan) AS jumlah_tamu,
       (SELECT nama_acara FROM konfigurasi_acara WHERE slug = 'HFL27') AS acara;
