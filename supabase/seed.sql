-- =====================================================================
-- SEED DATA: HAUL & HAFLAH P3TQ-MHMTQ 2027 (549 SANTRI LENGKAP)
-- 64 Bil Ghoib + 159 Bin Nadzori + 326 Tamatan
-- =====================================================================

do $$
declare
  v_event_id uuid := 'e0000000-0000-0000-0000-000000000001'::uuid;
  v_kunci text := 'p3tq_secret_hmac_key_2027';
  v_kel_id uuid;
begin
  -- 1. Inisialisasi Master Acara
  insert into events (id, nama, slug, waktu_mulai, tempat, kunci_hmac, link_grup_wa, status)
  values (
    v_event_id,
    'Haul & Haflah P3TQ-MHMTQ 2027',
    'HFL27',
    '2027-01-02 06:30:00+07',
    'Aula Muktamar Pondok Pesantren Lirboyo Kediri',
    v_kunci,
    'https://chat.whatsapp.com/HaflahP3TQ2027Official',
    'AKTIF'
  ) on conflict (id) do update set status = 'AKTIF';

  -- 2. Inisialisasi Pagu Kuota Tambahan 300 Pagu @ Rp 80.000
  insert into pagu_kuota_tambahan (event_id, pagu_total, terjual, harga_per_unit, rekening, dibuka)
  values (v_event_id, 300, 0, 80000, 'BRI 320701010266508 a.n. Ahmad Chamdan Yuwafin', true)
  on conflict (event_id) do nothing;

  -- 3. Kategori Kuota & Warna Tiket
  insert into kategori_kuota (event_id, kode, sub_kategori, kuota_default, tiket_panggung, warna_tiket, urutan)
  values
    (v_event_id, 'BIL_GHOIB', 'Bil Ghoib', 4, 1, 'Hijau', 1),
    (v_event_id, 'BIN_NADZOR', 'Bin Nadzori 2 Tsanawiyah', 2, 0, 'Biru', 2),
    (v_event_id, 'BIN_NADZOR', 'Bin Nadzori 3 Tsanawiyah', 2, 0, 'Biru', 3),
    (v_event_id, 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah', 2, 0, 'Biru', 4),
    (v_event_id, 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah', 2, 0, 'Biru', 5),
    (v_event_id, 'BIN_NADZOR', 'Bin Nadzori 3 Aliyah', 2, 0, 'Biru', 6),
    (v_event_id, 'BIN_NADZOR', 'Bin Nadzori Mutakhorijat', 2, 0, 'Biru', 7),
    (v_event_id, 'TAMATAN', '3 ALY A.01', 2, 0, 'Kuning', 8),
    (v_event_id, 'TAMATAN', '3 ALY A.02', 2, 0, 'Kuning', 9),
    (v_event_id, 'TAMATAN', '3 ALY A.03', 2, 0, 'Kuning', 10),
    (v_event_id, 'TAMATAN', '3 ALY A.04', 2, 0, 'Kuning', 11),
    (v_event_id, 'TAMATAN', '3 ALY B.01', 2, 0, 'Kuning', 12),
    (v_event_id, 'TAMATAN', '3 ALY B.02', 2, 0, 'Kuning', 13),
    (v_event_id, 'TAMATAN', '3 ALY B.03', 2, 0, 'Kuning', 14)
  on conflict (event_id, sub_kategori) do nothing;

  -- Santri SH0001: AFIFATUN NISAA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0001', 'BPK. IMAM SAHRI', '081515979544', 'TRENGGALEK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0001', 'AFIFATUN NISAA', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0001', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0002: ANA SHOFIA FUAIDA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0002', 'BPK. H. SYAMSUL BASHU''IR', '085708633780', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0002', 'ANA SHOFIA FUAIDA', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0002', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0003: AULIA DWI CAHYATI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0003', 'BPK. SARMIDIN', '082154205636', 'BOJONEGORO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0003', 'AULIA DWI CAHYATI', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0003', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0004: AULIA NUR AFIFAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0004', 'BPK. KHUDORI', '085327040613', 'TEGAL') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0004', 'AULIA NUR AFIFAH', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0004', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0005: AYU NUR HASANAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0005', 'BPK. YATNO', '0895393231656', 'KALIMANTAN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0005', 'AYU NUR HASANAH', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0005', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0006: BINTI MAHBUBAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0006', 'Wali BINTI MAHBUBAH', '', '') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0006', 'BINTI MAHBUBAH', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0006', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0007: DALIA HIKMATUL MAULA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0007', 'BPK. M. ALI MA''RUF', '085746908331', 'BLITAR') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0007', 'DALIA HIKMATUL MAULA', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0007', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0008: DEWI AKHIRUL JANNAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0008', 'BPK. SOELKANI', '081252760020', 'JOMBANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0008', 'DEWI AKHIRUL JANNAH', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0008', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0009: DEWI MASYITHOH Z.
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0009', 'BPK. ZAMROJI ROMLI', '082330221287', 'LUMAJANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0009', 'DEWI MASYITHOH Z.', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0009', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0010: DEWI MUNGIYAROTUL
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0010', 'BPK. SUNARKO', '081654985501', 'TULUNGAGUNG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0010', 'DEWI MUNGIYAROTUL', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0010', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0011: DINDA IRMA AINUR
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0011', 'BPK. MUZAKIR', '085604682835', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0011', 'DINDA IRMA AINUR', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0011', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0012: DYAH NAWANG WULAN
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0012', 'BPK. BAMBANG HARYANTO', '08219443995', 'SULAWESI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0012', 'DYAH NAWANG WULAN', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0012', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0013: FITRI NUR FADHILAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0013', 'BPK. TOHA', '085749851035', 'BOJONEGORO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0013', 'FITRI NUR FADHILAH', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0013', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0014: GHINA SA''ADAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0014', 'BPK. MOH. ISLAHUDDIN ANAS', '0895618081778', 'CIREBON') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0014', 'GHINA SA''ADAH', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0014', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0015: HANIFATUR ROIFAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0015', 'BPK. SAMSUSI', '082228476717', 'TULUNGAGUNG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0015', 'HANIFATUR ROIFAH', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0015', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0016: HILMIYATUL MAKIYYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0016', 'BPK. MOCH. YAHYA BADRUS', '081335817882', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0016', 'HILMIYATUL MAKIYYAH', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0016', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0017: HILWA AULIA AZZAHRA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0017', 'BPK. ISMAIL', '082337220020', '') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0017', 'HILWA AULIA AZZAHRA', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0017', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0018: ILMIYATUL HIKMAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0018', 'BPK. SUTRIMO', '085765452110', 'BATAM') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0018', 'ILMIYATUL HIKMAH', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0018', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0019: IMELDA MARTHA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0019', 'BPK. SAMSUDIN', '081331223289', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0019', 'IMELDA MARTHA', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0019', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0020: INDA PUSPITA SARI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0020', 'BPK. JUNARDI', '085732922109', 'NGANJUK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0020', 'INDA PUSPITA SARI', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0020', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0021: INTA ZUHAIRINI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0021', 'BPK. SALMAN FUADI', '081216571173', 'BLITAR') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0021', 'INTA ZUHAIRINI', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0021', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0022: IZZA NI''MATUL MUDAWAMAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0022', 'BPK. IMAM MAHMUD', '085175309399', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0022', 'IZZA NI''MATUL MUDAWAMAH', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0022', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0023: KAFILLAH ILAH NACHIWA S.
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0023', 'BPK. TEGUH HARIYANTO', '082173760533', 'RIAU') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0023', 'KAFILLAH ILAH NACHIWA S.', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0023', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0024: KHAFIDZOTUL FADHILAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0024', 'BPK. NASHORI', '087738196746', 'PEKALONGAN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0024', 'KHAFIDZOTUL FADHILAH', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0024', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0025: KHALIYA VI AINI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0025', 'BPK. MOCH. MUSLICH', '08980095900', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0025', 'KHALIYA VI AINI', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0025', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0026: KHOTIFAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0026', 'BPK. H. ABU HASAN', '081330050958', 'MADURA') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0026', 'KHOTIFAH', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0026', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0027: KUNI FAIZAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0027', 'BPK. ABU QOMARUDIN', '081328233385', 'MAGELANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0027', 'KUNI FAIZAH', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0027', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0028: LAILA MUHIMMATUN NAFI''
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0028', 'BPK. H. FAHRUDDIN', '085236871296', 'TRENGGALEK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0028', 'LAILA MUHIMMATUN NAFI''', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0028', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0029: LILI SURYANI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0029', 'BPK. SLAMET RIYANTO', '081991818729', 'LAMPUNG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0029', 'LILI SURYANI', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0029', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0030: MAR''ATUS SHOLIHAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0030', 'BPK. AHMAD WILDAN', '085707093389', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0030', 'MAR''ATUS SHOLIHAH', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0030', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0031: MUALIFATUR ROSYIDAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0031', 'BPK. AHMAD KHUDLOIRI', '085357082599', 'JAMBI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0031', 'MUALIFATUR ROSYIDAH', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0031', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0032: NABILA QURROTUL AINI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0032', 'BPK. MUHAMMAD NASIR', '085755506046', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0032', 'NABILA QURROTUL AINI', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0032', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0033: NADIA SILVI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0033', 'Wali NADIA SILVI', '', '') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0033', 'NADIA SILVI', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0033', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0034: NADIYA AL KAFI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0034', 'BPK. SYAFI''I', '081216284616', 'KENDAL') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0034', 'NADIYA AL KAFI', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0034', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0035: NAILINA AZKA SHOFIA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0035', 'BPK. AKHMAD FAUZI', '085647520370', 'BATANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0035', 'NAILINA AZKA SHOFIA', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0035', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0036: NAILU FIRHATIN WAFIROH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0036', 'BPK. ABU HAMID', '085655670690', 'NGANJUK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0036', 'NAILU FIRHATIN WAFIROH', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0036', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0037: NASYWA ATHIYATUR ROHMAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0037', 'BPK. AGUS MULYANTO', '081210691999', 'BEKASI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0037', 'NASYWA ATHIYATUR ROHMAH', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0037', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0038: NGATIQOTUN KHOIRUN
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0038', 'BPK. IMAM BAWANI', '081232790660', 'MADIUN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0038', 'NGATIQOTUN KHOIRUN', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0038', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0039: NIDA AMALIATUL FAUZIYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0039', 'BPK. NUR ARIFIN', '085731003692', 'BREBES') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0039', 'NIDA AMALIATUL FAUZIYAH', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0039', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0040: NIKHA NIHAYATUL HUSNA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0040', 'BPK. NAHROWI', '085853577773', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0040', 'NIKHA NIHAYATUL HUSNA', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0040', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0041: NI''MAH ILMIYATUL ULYA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0041', 'BPK. H. ABDUL ROUF', '081933829792', 'TANGERANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0041', 'NI''MAH ILMIYATUL ULYA', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0041', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0042: NI''MATUL HASANAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0042', 'BPK. SURANTO', '082333327993', 'SURABAYA') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0042', 'NI''MATUL HASANAH', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0042', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0043: NUFA''AH NUR IZZAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0043', 'BPK. M. KHOLILULLOH', '082331575670', 'JEMBER') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0043', 'NUFA''AH NUR IZZAH', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0043', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0044: NUR ANISATUL AZIZAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0044', 'BPK. QOMARUDIN ZUHRI', '085736274651', 'NGANJUK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0044', 'NUR ANISATUL AZIZAH', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0044', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0045: NUR LAILATUL M.
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0045', 'BPK. RUDIYANTO', '081277257944', 'MADURA') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0045', 'NUR LAILATUL M.', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0045', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0046: NURCAHYATI ZAHRO TUSSHOFIYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0046', 'BPK. FATKAN', '085708147917', 'MOJOKERTO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0046', 'NURCAHYATI ZAHRO TUSSHOFIYAH', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0046', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0047: NURUL FAIZAH AFIFATUL MILLAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0047', 'Wali NURUL FAIZAH AFIFATUL MILLAH', '08978105277', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0047', 'NURUL FAIZAH AFIFATUL MILLAH', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0047', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0048: RODLIYAH KARIM
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0048', 'BPK. AGUS FATKHUL KARIM', '081214157800', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0048', 'RODLIYAH KARIM', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0048', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0049: RODLIYAH PUTRI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0049', 'BPK. WAHONO SETYONO', '081227080368', 'SOLO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0049', 'RODLIYAH PUTRI', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0049', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0050: ROYHANAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0050', 'BPK. MUTHARI', '', 'MADURA') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0050', 'ROYHANAH', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0050', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0051: SALSABILA FIRDAUSI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0051', 'BPK. RUSMAN AL FIRDAUS', '082337558075', 'LAMONGAN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0051', 'SALSABILA FIRDAUSI', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0051', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0052: SAYYIDAH ATIKAH KHOIROTUN HISAN
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0052', 'BPK. MOH. JAZULI', '082234658778', 'JEMBER') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0052', 'SAYYIDAH ATIKAH KHOIROTUN HISAN', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0052', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0053: SITI ANISA MULYANA NASYIFA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0053', 'BPK. KUSAINI', '085808434359', 'NGANJUK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0053', 'SITI ANISA MULYANA NASYIFA', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0053', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0054: SITI FATIMAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0054', 'BPK. SYAMSUL HUDA', '081335708933', 'MOJOKERTO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0054', 'SITI FATIMAH', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0054', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0055: SITI FATIMATUZ ZAHRO''
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0055', 'BPK. IMAM SYAFI''I', '081914792249', 'TRENGGALEK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0055', 'SITI FATIMATUZ ZAHRO''', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0055', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0056: SITI NAFISAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0056', 'BPK. FAUZI', '082319854354', 'CIREBON') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0056', 'SITI NAFISAH', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0056', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0057: SITI NUR HASANAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0057', 'BPK. HASANUN', '085217046144', 'RIAU') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0057', 'SITI NUR HASANAH', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0057', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0058: SITI ZAKIYATUL MISKIYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0058', 'BPK. MUHAMMAD MUNAWIR', '082131561730', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0058', 'SITI ZAKIYATUL MISKIYAH', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0058', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0059: SU''DA NABILAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0059', 'BPK. KH. SAIFUL ANAM', '082121823699', 'CILACAP') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0059', 'SU''DA NABILAH', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0059', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0060: TSINTA NURIYAH ARRIZQA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0060', 'BPK. BISRI', '085232109608', 'BOJONEGORO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0060', 'TSINTA NURIYAH ARRIZQA', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0060', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0061: UMAMUL HABIBAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0061', 'BPK. AKSAN', '082331512257', 'PROBOLINGGO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0061', 'UMAMUL HABIBAH', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0061', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0062: VILUNA CHURUL AINI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0062', 'BPK. M. MUHAJIRIN', '085292923868', 'KENDAL') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0062', 'VILUNA CHURUL AINI', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0062', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0063: YULI SULISTIANI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0063', 'BPK. IMAM SAYUTI', '082117723352', 'CIREBON') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0063', 'YULI SULISTIANI', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0063', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0064: ZILLA HUSNA LAILI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0064', 'BPK. ZAENAL ABIDIN', '085645875976', 'BLITAR') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0064', 'ZILLA HUSNA LAILI', 'P3TQ', 'Bil Ghoib', 'BIL_GHOIB', 'Bil Ghoib') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0064', 4, 0, 1) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0065: AZMA NAJMI ULA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0065', 'BPK. NACHROWI AL JUFRI', '085941029460', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0065', 'AZMA NAJMI ULA', 'P3TQ', 'Bin Nadzori 2 Tsanawiyah', 'BIN_NADZOR', 'Bin Nadzori 2 Tsanawiyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0065', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0066: ANINDYA RAHMA NUR AISYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0066', 'BPK. SAMSUL HUDA', '08139247712', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0066', 'ANINDYA RAHMA NUR AISYAH', 'P3TQ', 'Bin Nadzori 2 Tsanawiyah', 'BIN_NADZOR', 'Bin Nadzori 2 Tsanawiyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0066', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0067: SITI NUR MAULIDA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0067', 'BPK. SUNARDI', '085815208073', 'KLATEN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0067', 'SITI NUR MAULIDA', 'P3TQ', 'Bin Nadzori 2 Tsanawiyah', 'BIN_NADZOR', 'Bin Nadzori 2 Tsanawiyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0067', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0068: DEWI ARIFINA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0068', 'BPK. SUHARTO', '0878814881365', 'MALANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0068', 'DEWI ARIFINA', 'P3TQ', 'Bin Nadzori 2 Tsanawiyah', 'BIN_NADZOR', 'Bin Nadzori 2 Tsanawiyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0068', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0069: WARDA HANIAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0069', 'BPK. SLAMET ACHMADI', '081328535838', 'WONOSOBO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0069', 'WARDA HANIAH', 'P3TQ', 'Bin Nadzori 2 Tsanawiyah', 'BIN_NADZOR', 'Bin Nadzori 2 Tsanawiyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0069', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0070: AENI RAMADHANI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0070', 'BPK. RUDIN', '085875475416', 'BREBES') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0070', 'AENI RAMADHANI', 'P3TQ', 'Bin Nadzori 3 Tsanawiyah', 'BIN_NADZOR', 'Bin Nadzori 3 Tsanawiyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0070', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0071: LIVIA AZRA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0071', 'BPK. AGUS SHOLIHUN', '085215498262', 'CIREBON') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0071', 'LIVIA AZRA', 'P3TQ', 'Bin Nadzori 3 Tsanawiyah', 'BIN_NADZOR', 'Bin Nadzori 3 Tsanawiyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0071', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0072: FAZA ILYA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0072', 'BPK. M. BADRUL MUNIR', '085655686866', 'NGANJUK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0072', 'FAZA ILYA', 'P3TQ', 'Bin Nadzori 3 Tsanawiyah', 'BIN_NADZOR', 'Bin Nadzori 3 Tsanawiyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0072', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0073: SITI HUMAIRO''
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0073', 'BPK. ABDUL ROHIM', '089502209165', 'BEKASI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0073', 'SITI HUMAIRO''', 'P3TQ', 'Bin Nadzori 3 Tsanawiyah', 'BIN_NADZOR', 'Bin Nadzori 3 Tsanawiyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0073', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0074: SALMA NURIL
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0074', 'BPK. AGUS SUKAMSO', '085282146397', 'SRAGEN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0074', 'SALMA NURIL', 'P3TQ', 'Bin Nadzori 3 Tsanawiyah', 'BIN_NADZOR', 'Bin Nadzori 3 Tsanawiyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0074', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0075: CHUSANATUL LINA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0075', 'BPK. ABDUL AZIZ', '082143211124', 'SRAGEN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0075', 'CHUSANATUL LINA', 'P3TQ', 'Bin Nadzori 3 Tsanawiyah', 'BIN_NADZOR', 'Bin Nadzori 3 Tsanawiyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0075', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0076: HANA MIR''ATUL
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0076', 'BPK. MOH. DHOFIR', '081996610581', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0076', 'HANA MIR''ATUL', 'P3TQ', 'Bin Nadzori 3 Tsanawiyah', 'BIN_NADZOR', 'Bin Nadzori 3 Tsanawiyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0076', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0077: ZAHROUN NAJA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0077', 'BPK. ABDUL MUGHNI', '081216567765', 'NGANJUK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0077', 'ZAHROUN NAJA', 'P3TQ', 'Bin Nadzori 3 Tsanawiyah', 'BIN_NADZOR', 'Bin Nadzori 3 Tsanawiyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0077', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0078: NAILATUL AZIZAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0078', 'BPK. M. NUR', '082331572093', 'BONDOWOSO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0078', 'NAILATUL AZIZAH', 'P3TQ', 'Bin Nadzori 3 Tsanawiyah', 'BIN_NADZOR', 'Bin Nadzori 3 Tsanawiyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0078', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0079: RIFDA HANAN
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0079', 'BPK. SUHARNO', '082179081378', 'PALEMBANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0079', 'RIFDA HANAN', 'P3TQ', 'Bin Nadzori 3 Tsanawiyah', 'BIN_NADZOR', 'Bin Nadzori 3 Tsanawiyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0079', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0080: ZAHRA ROFI''ATUR
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0080', 'BPK. M. KASURI', '082139545202', 'PONOROGO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0080', 'ZAHRA ROFI''ATUR', 'P3TQ', 'Bin Nadzori 3 Tsanawiyah', 'BIN_NADZOR', 'Bin Nadzori 3 Tsanawiyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0080', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0081: QOTRUN NADA SALSABILA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0081', 'BPK. DASUKI', '083861331583', 'BREBES') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0081', 'QOTRUN NADA SALSABILA', 'P3TQ', 'Bin Nadzori 3 Tsanawiyah', 'BIN_NADZOR', 'Bin Nadzori 3 Tsanawiyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0081', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0082: VIA ULFINA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0082', 'BPK. M. KHOIRUL MUSTA''IN', '081230189049', 'JEMBER') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0082', 'VIA ULFINA', 'P3TQ', 'Bin Nadzori 3 Tsanawiyah', 'BIN_NADZOR', 'Bin Nadzori 3 Tsanawiyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0082', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0083: AINUN NAIM
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0083', 'BPK. ABU HANIFAH', '082275408079', 'LAMPUNG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0083', 'AINUN NAIM', 'P3TQ', 'Bin Nadzori 3 Tsanawiyah', 'BIN_NADZOR', 'Bin Nadzori 3 Tsanawiyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0083', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0084: SALSABILA FATIMAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0084', 'BPK. JUHRI', '089636966557', 'BOGOR') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0084', 'SALSABILA FATIMAH', 'P3TQ', 'Bin Nadzori 3 Tsanawiyah', 'BIN_NADZOR', 'Bin Nadzori 3 Tsanawiyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0084', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0085: SALMA NUR FAIQOH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0085', 'BPK.', '081368811232', 'MADIUN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0085', 'SALMA NUR FAIQOH', 'P3TQ', 'Bin Nadzori 3 Tsanawiyah', 'BIN_NADZOR', 'Bin Nadzori 3 Tsanawiyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0085', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0086: DWI WULANDARI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0086', 'BPK. SUMINTO', '082140074296', 'TULUNGAGUNG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0086', 'DWI WULANDARI', 'P3TQ', 'Bin Nadzori 3 Tsanawiyah', 'BIN_NADZOR', 'Bin Nadzori 3 Tsanawiyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0086', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0087: RIHADATUL AISY
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0087', 'BPK. SUPRIADI', '085604333343', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0087', 'RIHADATUL AISY', 'P3TQ', 'Bin Nadzori 3 Tsanawiyah', 'BIN_NADZOR', 'Bin Nadzori 3 Tsanawiyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0087', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0088: MUJTAHIDAH NAFI''UN
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0088', 'BPK. KASIMEN', '085332788320', 'KALIMANTAN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0088', 'MUJTAHIDAH NAFI''UN', 'P3TQ', 'Bin Nadzori 3 Tsanawiyah', 'BIN_NADZOR', 'Bin Nadzori 3 Tsanawiyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0088', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0089: NILNA AMINAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0089', 'BPK. SATARI', '081227185870', 'REMBANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0089', 'NILNA AMINAH', 'P3TQ', 'Bin Nadzori 3 Tsanawiyah', 'BIN_NADZOR', 'Bin Nadzori 3 Tsanawiyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0089', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0090: ISNAY ALFIYATUL
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0090', 'BPK. ISMAIL', '088230363945', 'BOJONEGORO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0090', 'ISNAY ALFIYATUL', 'P3TQ', 'Bin Nadzori 3 Tsanawiyah', 'BIN_NADZOR', 'Bin Nadzori 3 Tsanawiyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0090', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0091: HIMMATUL ULYA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0091', 'BPK. SAYUTI', '08568562004', 'NGANJUK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0091', 'HIMMATUL ULYA', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0091', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0092: ZAHRA AFROZA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0092', 'BPK. MISBAHUL ULUM', '085330199586', 'BONDOWOSO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0092', 'ZAHRA AFROZA', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0092', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0093: DEWI ILMA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0093', 'BPK. MUHAMMAD MUNDZIR', '081515918227', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0093', 'DEWI ILMA', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0093', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0094: SELALIA BARKA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0094', 'BPK. UDIANTO', '085258802032', 'JEMBER') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0094', 'SELALIA BARKA', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0094', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0095: KAINA ALINCIA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0095', 'BPK. SURONO DADANG SYARIFUDIN', '081393098479', 'KARANGANYAR') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0095', 'KAINA ALINCIA', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0095', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0096: LULUK NAFISAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0096', 'BPK. KHASANNURI', '082327898882', 'BREBES') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0096', 'LULUK NAFISAH', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0096', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0097: ZAYYANA ADELIA NURILIZZA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0097', 'BPK. SLAMET RIADI', '081359367567', 'PONOROGO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0097', 'ZAYYANA ADELIA NURILIZZA', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0097', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0098: FAZA ZAHRO'' KAMALATUNNISA''
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0098', 'BPK. JAUHARI FAHMI', '081212834256', 'TUBAN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0098', 'FAZA ZAHRO'' KAMALATUNNISA''', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0098', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0099: HUMAIDATUL LUTFIAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0099', 'BPK. HAMDANI', '085852289478', 'NGANJUK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0099', 'HUMAIDATUL LUTFIAH', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0099', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0100: KAYSA LABABATAL
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0100', 'BPK. GHOUTSUL MUNA', '08125959981', 'TULUNGAGUNG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0100', 'KAYSA LABABATAL', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0100', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0101: ZARA CHELSEA ANJELI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0101', 'BPK. MASRURI', '081216357541', 'BLITAR') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0101', 'ZARA CHELSEA ANJELI', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0101', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0102: AMELIA VEGA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0102', 'BPK. JOKO SANTOSO', '085708726440', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0102', 'AMELIA VEGA', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0102', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0103: WAHIDAH NAZALA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0103', 'BPK. MOH. FAUZAN', '082326815474', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0103', 'WAHIDAH NAZALA', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0103', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0104: ALFI LAILATUL MAGHFIROH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0104', 'BPK. MAD KHOZIM', '082228323089', 'NGANJUK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0104', 'ALFI LAILATUL MAGHFIROH', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0104', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0105: ZIETA DZIEL IZZATI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0105', 'BPK. FATKURRAHMAN', '085334170499', 'NGAWI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0105', 'ZIETA DZIEL IZZATI', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0105', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0106: NELI FAJARINA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0106', 'BPK. MISBAHUS SURUR', '081336485035', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0106', 'NELI FAJARINA', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0106', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0107: NABILA HILYATUL QAYYIS
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0107', 'BPK. M. SOLEHUDDIN', '085822273183', 'KALIMANTAN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0107', 'NABILA HILYATUL QAYYIS', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0107', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0108: NAILA FAIZA NIAMI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0108', 'BPK. SOKIP', '085648812738', 'PONOROGO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0108', 'NAILA FAIZA NIAMI', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0108', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0109: ZAHWA AQILA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0109', 'BPK. M. ROZIKIN', '085373131606', 'JAMBI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0109', 'ZAHWA AQILA', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0109', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0110: DEWI AYU AINAYA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0110', 'BPK. MUSOFA', '085330480333', 'TEMANGGUNG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0110', 'DEWI AYU AINAYA', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0110', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0111: JIHAN AMALIA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0111', 'BPK. KADIS MUSTHOFA', '085785150338', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0111', 'JIHAN AMALIA', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0111', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0112: NAILA RAHMATIKA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0112', 'IBU TINIK', '085853275379', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0112', 'NAILA RAHMATIKA', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0112', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0113: SALMA ZAHIDA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0113', 'BPK. AHMAD ZUHRI', '085786400665', 'PEKALONGAN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0113', 'SALMA ZAHIDA', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0113', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0114: MILLA MINHATAL
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0114', 'BPK. ASFAS SHODIQ', '081558997115', 'NGANJUK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0114', 'MILLA MINHATAL', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0114', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0115: NURUS SHOLIHAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0115', 'BPK. M. BASTONI', '085850254559', 'TULUNGAGUNG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0115', 'NURUS SHOLIHAH', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0115', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0116: USWATUN HASANAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0116', 'BPK. ISTICHORI', '083853510394', 'BLITAR') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0116', 'USWATUN HASANAH', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0116', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0117: NAILI SANAYA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0117', 'BPK. M. BAHRUL ULUM (ALM)', '082335135332', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0117', 'NAILI SANAYA', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0117', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0118: SAFIRA FATIMATUZ
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0118', 'BPK. ZAENAL MAEZUN', '081225832975', 'SEMARANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0118', 'SAFIRA FATIMATUZ', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0118', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0119: NIKMATUS SALAMAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0119', 'BPK. ABDUL GHOFIR', '085791139917', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0119', 'NIKMATUS SALAMAH', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0119', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0120: WAHIYAFI AUNILLAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0120', 'BPK. M. ISHOM', '081586158710', 'SEMARANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0120', 'WAHIYAFI AUNILLAH', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0120', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0121: NALA RAHMATUL AZZA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0121', 'BPK. M. ANSORI', '087831870038', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0121', 'NALA RAHMATUL AZZA', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0121', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0122: FATIHATUSSHIFA NUR AULIA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0122', 'BPK. SATRIA NUR SABARUDIN', '081326205566', 'GROBOGAN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0122', 'FATIHATUSSHIFA NUR AULIA', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0122', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0123: INTAN RATNASARI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0123', 'BPK. MAMAT', '085273404440', 'LAMPUNG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0123', 'INTAN RATNASARI', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0123', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0124: NILNA MUNA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0124', 'BPK. ALI MASRUKHAN', '081212796833', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0124', 'NILNA MUNA', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0124', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0125: ULFA KHOIRUN NISA''
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0125', 'BPK. M. HADI IRWANTO', '082372702201', 'PALEMBANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0125', 'ULFA KHOIRUN NISA''', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0125', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0126: AULIA TRI WIDIA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0126', 'BPK. BARRY', '082233829980', 'KALIMANTAN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0126', 'AULIA TRI WIDIA', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0126', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0127: MUKHOFIFIN
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0127', 'BPK. AHMAD DASURI', '082289265796', 'PALEMBANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0127', 'MUKHOFIFIN', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0127', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0128: FAUZA HIDAYATUL
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0128', 'BPK. DEDI KUNKORO', '081995657626', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0128', 'FAUZA HIDAYATUL', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0128', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0129: JESICA SALSABILA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0129', 'BPK. M. KUSEIRI', '085231076903', 'JOMBANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0129', 'JESICA SALSABILA', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0129', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0130: RISKI AINA SARI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0130', 'BPK. PONIMAN', '0895328681084', 'LAMPUNG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0130', 'RISKI AINA SARI', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0130', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0131: SHOFIATUL MUNAWAROH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0131', 'BPK. AHMAD SOLIHUDIN', '085731595363', 'JOMBANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0131', 'SHOFIATUL MUNAWAROH', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0131', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0132: NA''IMAH ULIN
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0132', 'BPK. MOH. YUNUS', '085649393353', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0132', 'NA''IMAH ULIN', 'P3TQ', 'Bin Nadzori 1 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0132', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0133: HILDA NAFLAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0133', 'BPK. ANIK MUSYAHIDAH', '085232604071', 'NGANJUK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0133', 'HILDA NAFLAH', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0133', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0134: MASYIFA SALSABILA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0134', 'BPK. H. MAS ABDURROHMAN', '08561011274', 'BANTEN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0134', 'MASYIFA SALSABILA', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0134', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0135: SYAFA AZZAHRA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0135', 'Wali SYAFA AZZAHRA', '', '') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0135', 'SYAFA AZZAHRA', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0135', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0136: LUBNA ASHILATIL
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0136', 'BPK. AHMAD HARIS', '081230057999', 'MADURA') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0136', 'LUBNA ASHILATIL', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0136', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0137: ALIYA MASKUBIL HABBAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0137', 'BPK. DAHLAN', '085721000375', 'BANDUNG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0137', 'ALIYA MASKUBIL HABBAH', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0137', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0138: NI''MATUL MAULA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0138', 'BPK. SYAHRONI', '085649882668', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0138', 'NI''MATUL MAULA', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0138', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0139: PUTRI AYU SALSABILA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0139', 'BPK. SUYANTO', '085234110109', 'NGAWI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0139', 'PUTRI AYU SALSABILA', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0139', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0140: AULIA NAFISAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0140', 'BPK. IMAM WAHYUD', '085735769157', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0140', 'AULIA NAFISAH', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0140', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0141: JESICA RAHMA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0141', 'BPK. SUYANTO', '082139720431', 'GRESIK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0141', 'JESICA RAHMA', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0141', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0142: ALYA RAHMA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0142', 'BPK. AHMAD KHOLILI', '085607020625', 'JOMBANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0142', 'ALYA RAHMA', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0142', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0143: FINA DURROTUN
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0143', 'BPK. ABDUL BASITH', '085600516240', 'PEKALONGAN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0143', 'FINA DURROTUN', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0143', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0144: MUNADIAL ULA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0144', 'BPK. MOCH. HOLIL', '085726644931', 'MADURA') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0144', 'MUNADIAL ULA', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0144', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0145: FINA HIKMATUL
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0145', 'BPK. HASAN BISRI', '088989038639', 'LUMAJANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0145', 'FINA HIKMATUL', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0145', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0146: AULIYA NUR ADILLAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0146', 'BPK. ABDUL SALAM', '0853301244340', 'NGANJUK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0146', 'AULIYA NUR ADILLAH', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0146', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0147: ANISA AL ARIFAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0147', 'BPK. ARIFIN', '085732880979', 'SURABAYA') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0147', 'ANISA AL ARIFAH', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0147', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0148: KHALIDA ANISA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0148', 'BPK. HARDOYO', '082310653787', 'BANJARNEGARA') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0148', 'KHALIDA ANISA', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0148', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0149: YURIS SUCI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0149', 'BPK. YADI''', '085257688499', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0149', 'YURIS SUCI', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0149', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0150: RISMA ANISA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0150', 'BPK. SUBADRI', '085790294513', 'BANTEN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0150', 'RISMA ANISA', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0150', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0151: SITI NUR ALFIYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0151', 'BPK. ISMA''IL', '082175747921', 'PALEMBANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0151', 'SITI NUR ALFIYAH', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0151', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0152: SAIYA LADY
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0152', 'BPK. ACHMAD TACHMID', '085869581962', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0152', 'SAIYA LADY', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0152', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0153: RAHMA ALYA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0153', 'BPK. SUWITO', '081554804417', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0153', 'RAHMA ALYA', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0153', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0154: ISMI ZAIRINA ALFIFIN
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0154', 'BPK. MUSLIHUN', '085606306767', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0154', 'ISMI ZAIRINA ALFIFIN', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0154', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0155: TSUROYYA SYARIFATUN
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0155', 'BPK. MOCH. SANURI', '085784823757', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0155', 'TSUROYYA SYARIFATUN', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0155', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0156: MINANTI NAFISAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0156', 'BPK.', '', '') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0156', 'MINANTI NAFISAH', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0156', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0157: NIA RAHMADANI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0157', 'BPK. SUPRIYADI', '083133180138', 'INDRAMAYU') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0157', 'NIA RAHMADANI', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0157', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0158: FIKA AINA RAHMATIKA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0158', 'BPK. SUROSO', '085378501628', 'JAMBI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0158', 'FIKA AINA RAHMATIKA', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0158', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0159: AIDA ROFIFA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0159', 'BPK. MALIKAH', '082331232242', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0159', 'AIDA ROFIFA', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0159', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0160: SARIROTUS SA''DIYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0160', 'Wali SARIROTUS SA''DIYAH', '', '') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0160', 'SARIROTUS SA''DIYAH', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0160', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0161: TRIA NANDA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0161', 'BPK. ACHMAD MIFTAHUL U.', '082330724009', 'MADURA') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0161', 'TRIA NANDA', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0161', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0162: RATIH ADE PRATIWI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0162', 'BPK. TEKAT WIYONO', '085785497275', 'BLITAR') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0162', 'RATIH ADE PRATIWI', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0162', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0163: DIAH RAHMAWATI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0163', 'BPK. LAMIRAN', '081393851732', 'SEMARANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0163', 'DIAH RAHMAWATI', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0163', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0164: SITI PATIMAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0164', 'BPK. CADIR', '08138083006', 'BANGKA BELITUNG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0164', 'SITI PATIMAH', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0164', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0165: AISYAH AYU
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0165', 'BPK. MUKSHIN', '082220900125', 'BENGKULU') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0165', 'AISYAH AYU', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0165', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0166: ATIEK FUADIN NISA''
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0166', 'BPK. NURUDDIN', '087742501519', 'BATAM') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0166', 'ATIEK FUADIN NISA''', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0166', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0167: AISYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0167', 'BPK. RASIDIN', '082229587574', 'PEMALANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0167', 'AISYAH', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0167', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0168: NAJWA THOHIROH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0168', 'BPK. KH. MANDZUR LABIB', '087731323222', 'KENDAL') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0168', 'NAJWA THOHIROH', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0168', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0169: EVA ZAKIYA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0169', 'BPK. M. MAKHIN', '082286862586', 'NGANJUK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0169', 'EVA ZAKIYA', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0169', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0170: NAFI''URROHMAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0170', 'BPK. JUMA''IN', '085895915381', 'NGANJUK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0170', 'NAFI''URROHMAH', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0170', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0171: HASNA KHOIRUN NISA''
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0171', 'BPK. AHMADI', '085728040860', 'SOLO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0171', 'HASNA KHOIRUN NISA''', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0171', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0172: SILVINA MUFIDATUL
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0172', 'BPK. ARIF MUSTOFA', '081216144263', 'NGANJUK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0172', 'SILVINA MUFIDATUL', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0172', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0173: DITA LINA AWALIYATUL
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0173', 'BPK. AHMAD MUTHOFA', '081371281089', 'RIAU') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0173', 'DITA LINA AWALIYATUL', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0173', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0174: HARISSA ARIFATUS
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0174', 'IBU ZUNI MUSLIHAH', '085972554600', 'BLITAR') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0174', 'HARISSA ARIFATUS', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0174', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0175: KHOTIMATUS SUNIYYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0175', 'BPK. IMAM MAHSUN', '085777721712', 'TULUNGAGUNG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0175', 'KHOTIMATUS SUNIYYAH', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0175', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0176: ULFATUS SA''ADAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0176', 'BPK. AHMAD DZANURI', '085293363405', 'SRAGEN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0176', 'ULFATUS SA''ADAH', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0176', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0177: SITI KHODIJATAL KUBRO
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0177', 'BPK. AHMAD ZAHRI', '085606440586', 'MADURA') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0177', 'SITI KHODIJATAL KUBRO', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0177', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0178: FAHDINA SALWA HIDAYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0178', 'BPK. BUSTHOMI HIDAYAH', '085820021546', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0178', 'FAHDINA SALWA HIDAYAH', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0178', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0179: DEWI AISYAH ADELLA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0179', 'BPK. ABDUL ADJIZ', '085866235399', 'PEKALONGAN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0179', 'DEWI AISYAH ADELLA', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0179', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0180: ANISA JAMILATUL
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0180', 'BPK. MUHAMMAD NASHIN', '083840892251', 'DEMAK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0180', 'ANISA JAMILATUL', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0180', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0181: ALIFAH FARIKHATUL
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0181', 'BPK. MUHAMMAD SHOLEH', '085234391813', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0181', 'ALIFAH FARIKHATUL', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0181', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0182: ALFI AISYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0182', 'BPK. MUJAHIDIN', '085717539089', 'JAKARTA') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0182', 'ALFI AISYAH', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0182', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0183: NAJWA INAYATUL AULIYA''
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0183', 'BPK. AHMAD ZAED', '087888240653', 'NGANJUK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0183', 'NAJWA INAYATUL AULIYA''', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0183', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0184: SALSA ANDIN MAULA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0184', 'BPK. KOMARUDIN', '085640909176', 'BREBES') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0184', 'SALSA ANDIN MAULA', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0184', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0185: NAILATUL HIDAYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0185', 'BPK. MOH. AMIEN BAIDOWI', '085753228397', 'PONTIANAK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0185', 'NAILATUL HIDAYAH', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0185', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0186: ZANUBA AL IZZANI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0186', 'BPK. M. NAFI''UDIN', '087723511056', 'NGANJUK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0186', 'ZANUBA AL IZZANI', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0186', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0187: WIRDATUL FIRDAUS
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0187', 'BPK. ABDUL MANAN', '083898610792', 'CIREBON') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0187', 'WIRDATUL FIRDAUS', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0187', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0188: NAZLA RAHMATUL
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0188', 'BPK. SUWANU', '081555337230', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0188', 'NAZLA RAHMATUL', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0188', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0189: RATIH DWI PRATIWI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0189', 'BPK. MAHMUD', '085604023249', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0189', 'RATIH DWI PRATIWI', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0189', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0190: KUN NAJMA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0190', 'BPK. RAJAB BULAN HARI PURNOMO', '082331006822', 'MADIUN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0190', 'KUN NAJMA', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0190', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0191: MIFTAHUL DINAR
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0191', 'BPK. ABDUL AZIZ', '085249911048', 'MALANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0191', 'MIFTAHUL DINAR', 'P3TQ', 'Bin Nadzori 2 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0191', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0192: ST. NUR MUTAMMIMAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0192', 'BPK. KHAERI', '089619773920', 'PEMALANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0192', 'ST. NUR MUTAMMIMAH', 'P3TQ', 'Bin Nadzori 3 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 3 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0192', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0193: SITI NELI ZUHRIYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0193', 'BPK. BANDI', '087816282257', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0193', 'SITI NELI ZUHRIYAH', 'P3TQ', 'Bin Nadzori 3 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 3 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0193', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0194: ANISA EKA SYAFARIDA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0194', 'BPK. ABDUL RAHMAN', '085787155307', 'KALIMANTAN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0194', 'ANISA EKA SYAFARIDA', 'P3TQ', 'Bin Nadzori 3 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 3 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0194', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0195: ZASKIA INTAN
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0195', 'BPK. SYUKRON MAKMUM', '085642095015', 'CIREBON') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0195', 'ZASKIA INTAN', 'P3TQ', 'Bin Nadzori 3 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 3 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0195', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0196: NILA KHOIRUN NAILI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0196', 'BPK. AHMAD SYUAIB', '085785355053', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0196', 'NILA KHOIRUN NAILI', 'P3TQ', 'Bin Nadzori 3 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 3 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0196', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0197: NAFISAH LATHIFATUR ROHMAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0197', 'BPK. M. ALI NURDIN', '082221405634', 'BREBES') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0197', 'NAFISAH LATHIFATUR ROHMAH', 'P3TQ', 'Bin Nadzori 3 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 3 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0197', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0198: AGNES SAFITRI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0198', 'BPK. SAHID', '085346506549', 'KALIMANTAN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0198', 'AGNES SAFITRI', 'P3TQ', 'Bin Nadzori 3 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 3 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0198', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0199: FITROH NUR AZIZAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0199', 'BPK. KAMTO', '085212927983', 'TEGAL') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0199', 'FITROH NUR AZIZAH', 'P3TQ', 'Bin Nadzori 3 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 3 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0199', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0200: DIYANAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0200', 'BPK. MOHAMAD SODERI', '081296336660', 'CILACAP') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0200', 'DIYANAH', 'P3TQ', 'Bin Nadzori 3 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 3 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0200', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0201: FIRDA HANIFAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0201', 'BPK. JUMBRI', '085383805778', 'JAMBI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0201', 'FIRDA HANIFAH', 'P3TQ', 'Bin Nadzori 3 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 3 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0201', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0202: ANNISA NUR IZZANI SALSABILA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0202', 'BPK. SUTIKNO', '081264678956', 'BENGKULU') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0202', 'ANNISA NUR IZZANI SALSABILA', 'P3TQ', 'Bin Nadzori 3 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 3 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0202', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0203: FILZAH HIDAYATI FATANIAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0203', 'BPK. PONIMIN', '087701992289', 'TRENGGALEK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0203', 'FILZAH HIDAYATI FATANIAH', 'P3TQ', 'Bin Nadzori 3 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 3 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0203', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0204: SUCI AMALIA PUTRI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0204', 'BPK. ASPURIL', '085848368290', 'PEKALONGAN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0204', 'SUCI AMALIA PUTRI', 'P3TQ', 'Bin Nadzori 3 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 3 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0204', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0205: ZAHRA MAILATUS
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0205', 'BPK. M. NASRUR ROHMAN', '085854823068', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0205', 'ZAHRA MAILATUS', 'P3TQ', 'Bin Nadzori 3 Aliyah', 'BIN_NADZOR', 'Bin Nadzori 3 Aliyah') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0205', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0206: LINTANG ANJANI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0206', 'BPK. SIDIK PRAYOGO', '082223450801', 'KARANGANYAR') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0206', 'LINTANG ANJANI', 'P3TQ', 'Bin Nadzori Mutakhorijat', 'BIN_NADZOR', 'Bin Nadzori Mutakhorijat') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0206', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0207: DALLIYA HIMMATAL ULYA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0207', 'BPK. SAIFULLOH', '', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0207', 'DALLIYA HIMMATAL ULYA', 'P3TQ', 'Bin Nadzori Mutakhorijat', 'BIN_NADZOR', 'Bin Nadzori Mutakhorijat') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0207', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0208: ALFIANA NUR FIKRIA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0208', 'BPK. AEDI', '083861028406', 'TEMANGGUNG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0208', 'ALFIANA NUR FIKRIA', 'P3TQ', 'Bin Nadzori Mutakhorijat', 'BIN_NADZOR', 'Bin Nadzori Mutakhorijat') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0208', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0209: ANAS TASYA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0209', 'BPK. ASNAWI', '089627164485', 'PALEMBANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0209', 'ANAS TASYA', 'P3TQ', 'Bin Nadzori Mutakhorijat', 'BIN_NADZOR', 'Bin Nadzori Mutakhorijat') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0209', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0210: UMI LATIFAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0210', 'Wali UMI LATIFAH', '', 'JOMBANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0210', 'UMI LATIFAH', 'P3TQ', 'Bin Nadzori Mutakhorijat', 'BIN_NADZOR', 'Bin Nadzori Mutakhorijat') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0210', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0211: ANGGIT ULFIATUN NISA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0211', 'BPK. AHMAD SEHU', '081903228294', 'TEGAL') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0211', 'ANGGIT ULFIATUN NISA', 'P3TQ', 'Bin Nadzori Mutakhorijat', 'BIN_NADZOR', 'Bin Nadzori Mutakhorijat') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0211', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0212: DIAN ULFA ISTIQOMAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0212', 'BPK. SULAIMAN', '085267711463', 'LAMPUNG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0212', 'DIAN ULFA ISTIQOMAH', 'P3TQ', 'Bin Nadzori Mutakhorijat', 'BIN_NADZOR', 'Bin Nadzori Mutakhorijat') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0212', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0213: FATIKHATUR RIZQIYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0213', 'BPK. FUAT HASYIM', '085865467889', 'PEKALONGAN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0213', 'FATIKHATUR RIZQIYAH', 'P3TQ', 'Bin Nadzori Mutakhorijat', 'BIN_NADZOR', 'Bin Nadzori Mutakhorijat') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0213', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0214: HIDAYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0214', 'IBU MU''AWANAH', '085852062492', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0214', 'HIDAYAH', 'P3TQ', 'Bin Nadzori Mutakhorijat', 'BIN_NADZOR', 'Bin Nadzori Mutakhorijat') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0214', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0215: IKLIMAH FIDHIYANTI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0215', 'BPK. MUHSIN', '085740653444', 'MAGELANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0215', 'IKLIMAH FIDHIYANTI', 'P3TQ', 'Bin Nadzori Mutakhorijat', 'BIN_NADZOR', 'Bin Nadzori Mutakhorijat') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0215', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0216: LUTFI ALFIYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0216', 'BPK. SUEB', '08886609499', 'REMBANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0216', 'LUTFI ALFIYAH', 'P3TQ', 'Bin Nadzori Mutakhorijat', 'BIN_NADZOR', 'Bin Nadzori Mutakhorijat') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0216', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0217: MARIATUL AZIZAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0217', 'BPK. AMAR SHOLEH', '08563585591', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0217', 'MARIATUL AZIZAH', 'P3TQ', 'Bin Nadzori Mutakhorijat', 'BIN_NADZOR', 'Bin Nadzori Mutakhorijat') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0217', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0218: MAULIDYA NAELA RAHMA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0218', 'BPK. MUHSON', '085230117970', 'NGANJUK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0218', 'MAULIDYA NAELA RAHMA', 'P3TQ', 'Bin Nadzori Mutakhorijat', 'BIN_NADZOR', 'Bin Nadzori Mutakhorijat') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0218', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0219: MIFTACHUL JANAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0219', 'BPK. PURYADI', '085232688368', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0219', 'MIFTACHUL JANAH', 'P3TQ', 'Bin Nadzori Mutakhorijat', 'BIN_NADZOR', 'Bin Nadzori Mutakhorijat') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0219', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0220: NAILY AMANAH NAFISAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0220', 'BPK. ABDUL HAMID', '085232605855', 'SITUBONDO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0220', 'NAILY AMANAH NAFISAH', 'P3TQ', 'Bin Nadzori Mutakhorijat', 'BIN_NADZOR', 'Bin Nadzori Mutakhorijat') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0220', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0221: RATNA MAULIDA FITRIA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0221', 'BPK. RIYANTO', '085232300605', 'TUBAN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0221', 'RATNA MAULIDA FITRIA', 'P3TQ', 'Bin Nadzori Mutakhorijat', 'BIN_NADZOR', 'Bin Nadzori Mutakhorijat') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0221', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0222: SILA INAYATI ZUHRIYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0222', 'BPK. KH. MUNSHIF MAISUR', '081237940507', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0222', 'SILA INAYATI ZUHRIYAH', 'P3TQ', 'Bin Nadzori Mutakhorijat', 'BIN_NADZOR', 'Bin Nadzori Mutakhorijat') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0222', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0223: HIMMATUS SILFIAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0223', 'BPK. KARJO', '085329932680', 'JEPARA') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0223', 'HIMMATUS SILFIAH', 'P3TQ', 'Bin Nadzori Mutakhorijat', 'BIN_NADZOR', 'Bin Nadzori Mutakhorijat') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0223', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0224: ABWA'' ISROQUL FAROH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0224', 'BPK. ZAINAL ALIMUDIN', '081515401111', 'MALANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0224', 'ABWA'' ISROQUL FAROH', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0224', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0225: ADINDA TSALITSATUN NAJWA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0225', 'BPK. ABDUL MAJID', '085646451632', 'LAMONGAN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0225', 'ADINDA TSALITSATUN NAJWA', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0225', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0226: AINA ULYA RAMADLANI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0226', 'BPK. MOH. TOHA', '082337100749', 'LUMAJANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0226', 'AINA ULYA RAMADLANI', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0226', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0227: AISY AYU HUMAIRO''A
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0227', 'BPK. ROFIQ FAIZIN', '085706988906', 'BLITAR') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0227', 'AISY AYU HUMAIRO''A', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0227', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0228: AKMALA ZUHAIROTUL MUFIDAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0228', 'BPK. AHMAD ZAINI', '081359527724', 'MOJOKERTO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0228', 'AKMALA ZUHAIROTUL MUFIDAH', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0228', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0229: ALIFATUN NADHIROH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0229', 'BPK. JAMZURI', '081259847871', 'NGANJUK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0229', 'ALIFATUN NADHIROH', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0229', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0230: ARIINAL ASHFA AZZAKIYYATY
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0230', 'BPK. WIDODO AHMAD', '081336899950', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0230', 'ARIINAL ASHFA AZZAKIYYATY', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0230', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0231: ARINI ZULFA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0231', 'BPK. AMSHORI', '087788481913', 'PEMALANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0231', 'ARINI ZULFA', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0231', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0232: ASRIFAH HURIATUS SALSABILA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0232', 'BPK. KHASAN IBROHIM', '085784181615', 'MALANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0232', 'ASRIFAH HURIATUS SALSABILA', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0232', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0233: ATIK LIKAI TANJUA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0233', 'Wali ATIK LIKAI TANJUA', '', 'MADIUN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0233', 'ATIK LIKAI TANJUA', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0233', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0234: BINTI ISNAENI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0234', 'BPK. SARJONO', '085330358090', 'NGANJUK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0234', 'BINTI ISNAENI', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0234', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0235: DEVITA NUR LAILA FITRIANI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0235', 'BPK. MOH ATIM SANTOSO', '081237573984', 'TULUNGAGUNG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0235', 'DEVITA NUR LAILA FITRIANI', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0235', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0236: DUROTUN NAFISAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0236', 'BPK. WARDOYO', '081229491845', 'SRAGEN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0236', 'DUROTUN NAFISAH', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0236', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0237: DZIKRILLA NAFISAH ROHMATULLOH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0237', 'BPK. SUNARTO', '081229416794', 'SRAGEN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0237', 'DZIKRILLA NAFISAH ROHMATULLOH', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0237', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0238: EULYVINIA NAILULAUTHORIBAIDAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0238', 'BPK. ADI SUTEJO', '081242059991', 'SULAWESI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0238', 'EULYVINIA NAILULAUTHORIBAIDAH', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0238', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0239: FINA NAILUL MAGHFIROH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0239', 'BPK. ABDUL JALIL', '085234430944', 'NGANJUK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0239', 'FINA NAILUL MAGHFIROH', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0239', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0240: HIMATUS SHOFIAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0240', 'BPK. MUHSIN ALI', '081367628851', 'BENGKULU') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0240', 'HIMATUS SHOFIAH', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0240', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0241: IFAUL MILLAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0241', 'BPK. SATUKI', '083114240704', 'BANGKALAN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0241', 'IFAUL MILLAH', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0241', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0242: IFAUNNISA''
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0242', 'BPK. HABIB NU SUWITO', '085646692072', 'BLITAR') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0242', 'IFAUNNISA''', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0242', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0243: IMROATUL HASANAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0243', 'BPK. SANTOSO', '085191694519', 'JAMBI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0243', 'IMROATUL HASANAH', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0243', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0244: ISMATUL MAULA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0244', 'BPK. SAMAN', '081703421952', 'TENGERANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0244', 'ISMATUL MAULA', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0244', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0245: KHARIHTA NAIBAN
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0245', 'BPK. MARWAN', '085156147977', 'JAKARTA') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0245', 'KHARIHTA NAIBAN', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0245', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0246: KHOIRUNNISA''
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0246', 'BPK. NUR RAHMAN', '081994346263', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0246', 'KHOIRUNNISA''', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0246', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0247: KIRNIA NINGSIH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0247', 'BPK. NUR HUDA', '085876057654', 'PALEMBANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0247', 'KIRNIA NINGSIH', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0247', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0248: LAELATUL MUALIPAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0248', 'BPK. WANTER DARMO', '081211076695', 'TEGAL') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0248', 'LAELATUL MUALIPAH', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0248', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0249: MAR''ATUL KHASANAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0249', 'BPK. M. JAWAD KISWANTO', '081390359237', 'YOGYAKARTA') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0249', 'MAR''ATUL KHASANAH', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0249', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0250: MICHELLE NAYLA KINTANI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0250', 'BPK. HENDRY BHYTA', '085604608264', 'JOMBANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0250', 'MICHELLE NAYLA KINTANI', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0250', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0251: MIN MAYASIRIN NIKMATI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0251', 'BPK. ABDUL SALAM', '085707336150', 'NGANJUK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0251', 'MIN MAYASIRIN NIKMATI', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0251', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0252: NADIA RIZKINA AZIZAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0252', 'BPK. SHOFARODIN', '085735883709', 'BLITAR') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0252', 'NADIA RIZKINA AZIZAH', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0252', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0253: NAILUL ROSYIDAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0253', 'BPK. M. KAPIL', '085381142369', 'LAMPUNG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0253', 'NAILUL ROSYIDAH', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0253', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0254: NAJWA DIYANAH AL ''ALAWIYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0254', 'BPK. TUR SALIM', '081330427112', 'JOMBANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0254', 'NAJWA DIYANAH AL ''ALAWIYAH', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0254', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0255: NALA NABILATAL KARIMAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0255', 'BPK. SYAMSUL MA''ARIF', '085749895734', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0255', 'NALA NABILATAL KARIMAH', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0255', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0256: NGAINA FITRIA NURUL QURANI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0256', 'BPK. MOCH. ISHOMUDIN', '085965900812', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0256', 'NGAINA FITRIA NURUL QURANI', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0256', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0257: NI''MAH ILMIYATUL ULYA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0257', 'BPK. H. ABDUR ROUF', '081933829792', 'JAKARTA') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0257', 'NI''MAH ILMIYATUL ULYA', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0257', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0258: NOVA AULIYATUL KHOIRIYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0258', 'BPK. ADIGUDDIN QUSYAIRI', '081913573999', 'BANGKALAN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0258', 'NOVA AULIYATUL KHOIRIYAH', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0258', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0259: NUR ASHARIYATI NINGSIH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0259', 'BPK. ACHMAD SOKEH', '085339056520', 'NGANJUK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0259', 'NUR ASHARIYATI NINGSIH', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0259', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0260: NUR LAELIYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0260', 'BPK. SUROTO', '085226917030', 'KEBUMEN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0260', 'NUR LAELIYAH', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0260', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0261: QUMIL LAILA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0261', 'BPK. UMAR ALY', '082142915738', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0261', 'QUMIL LAILA', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0261', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0262: ROBIATUL ADAWIYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0262', 'BPK. WAKHID AUNU ROFIK', '082143903114', 'MOJOKERTO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0262', 'ROBIATUL ADAWIYAH', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0262', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0263: SHOFIE FARHATUL KHOTIMAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0263', 'BPK. IMAM SAYUTI', '082117723352', 'CIREBON') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0263', 'SHOFIE FARHATUL KHOTIMAH', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0263', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0264: SIFAUL QOLBI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0264', 'BPK. IBNU JARIR', '083147210122', 'MAGELANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0264', 'SIFAUL QOLBI', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0264', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0265: SIMATUL ULYA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0265', 'BPK. UMAR ALY', '082142915738', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0265', 'SIMATUL ULYA', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0265', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0266: SITI NUR MUTAMMIMAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0266', 'BPK. KHAERI', '089619773920', 'PEMALANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0266', 'SITI NUR MUTAMMIMAH', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0266', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0267: SITTI NURIL ISLAMIYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0267', 'BPK. SUPARTO', '081233324078', 'BONDOWOSO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0267', 'SITTI NURIL ISLAMIYAH', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0267', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0268: ULFATUN FARIKHA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0268', 'BPK. JAHIR MUTHOLIB', '082122685392', 'BREBES') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0268', 'ULFATUN FARIKHA', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0268', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0269: VINA DURROTUN NAFISAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0269', 'BPK. H. LUQMAN HAKIM', '08970509569', 'BATAM') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0269', 'VINA DURROTUN NAFISAH', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0269', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0270: WALIDA NADIATUL HANI-FAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0270', 'BPK. TUKIDI', '081555913138', 'TULUNGAGUNG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0270', 'WALIDA NADIATUL HANI-FAH', 'P3TQ', '3 ALY A.01', 'TAMATAN', '3 ALY A.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0270', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0271: AFIA ROHMA INAYATI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0271', 'BPK. MUHADI A.S', '085730209939', 'JOMBANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0271', 'AFIA ROHMA INAYATI', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0271', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0272: ALIMAH AJENG TRENGGANIS
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0272', 'BPK. SINGGIH', '085755273162', 'BLITAR') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0272', 'ALIMAH AJENG TRENGGANIS', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0272', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0273: ALYA KASFIFY DZURIYATUL AINI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0273', 'BPK. PAMUJI SISWANTO', '085335894445', 'NGANJUK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0273', 'ALYA KASFIFY DZURIYATUL AINI', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0273', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0274: ANANDA PUTRI ZAHIRAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0274', 'BPK. AGUS SUPRADJAB', '085777377341', 'JAKARTA SELATAN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0274', 'ANANDA PUTRI ZAHIRAH', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0274', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0275: AYU KHUMAIROK
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0275', 'BPK. M. ESMANTO', '085701972933', 'NGANJUK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0275', 'AYU KHUMAIROK', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0275', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0276: BINTAN SYAHROTUL AFIFAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0276', 'BPK. HABIBURROHMAN', '085851359446', 'BLITAR') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0276', 'BINTAN SYAHROTUL AFIFAH', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0276', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0277: ELI ERMAWATI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0277', 'BPK. SOLIHIN', '088985384469', 'CILACAP') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0277', 'ELI ERMAWATI', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0277', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0278: EUIS YULIYANTI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0278', 'BPK. CARDA', '082318918703', 'CIREBON') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0278', 'EUIS YULIYANTI', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0278', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0279: FATIMATUZ ZAHROK
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0279', 'BPK. FUADI', '085649524475', 'MOJOKERTO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0279', 'FATIMATUZ ZAHROK', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0279', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0280: FIKI MAHYA MAFAZA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0280', 'BPK. DWI HARIYONO', '082331041121', 'SIDOARJO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0280', 'FIKI MAHYA MAFAZA', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0280', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0281: IGHFIRLI SHAFHA TAZKIYYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0281', 'BPK. ABDULLAH ISKAK', '081358489697', 'SURABAYA') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0281', 'IGHFIRLI SHAFHA TAZKIYYAH', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0281', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0282: IKROMAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0282', 'BPK. MA''MUN', '085210302791', 'PEKALONGAN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0282', 'IKROMAH', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0282', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0283: ISTIANATUL KHORIDAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0283', 'BPK. M. FAIZIN', '089654811815', 'PEMALANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0283', 'ISTIANATUL KHORIDAH', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0283', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0284: IZZA NI''MATUL MUDAWAMAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0284', 'BPK. IMAM MAHMUD', '085175309399', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0284', 'IZZA NI''MATUL MUDAWAMAH', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0284', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0285: KHOIRUNNISA AZZAHRA AL-HASYIMI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0285', 'BPK. HASYIM HASYARI', '082126575328', 'SUBANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0285', 'KHOIRUNNISA AZZAHRA AL-HASYIMI', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0285', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0286: LAILATUL BADRIYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0286', 'BPK. AHMAD TAUFIQ', '085809069712', 'PALEMBANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0286', 'LAILATUL BADRIYAH', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0286', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0287: LAILIYANA ZAINATUL LUTFIAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0287', 'BPK. M. ZAINUDDIN', '085706822979', 'PONOROGO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0287', 'LAILIYANA ZAINATUL LUTFIAH', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0287', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0288: LU''LU NABILAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0288', 'BPK. URIP', '085643419129', 'TEGAL') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0288', 'LU''LU NABILAH', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0288', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0289: MEGA ROHMA AULIA ANNISA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0289', 'BPK. NURHUDA', '085811495281', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0289', 'MEGA ROHMA AULIA ANNISA', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0289', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0290: MINCHATUS SANIYYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0290', 'BPK. NI''AMULLAH KARIM', '081818244601', 'BREBES') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0290', 'MINCHATUS SANIYYAH', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0290', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0291: NAILAN TRIPARTI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0291', 'BPK. M. KHAYUN', '082285971143', 'PEBADARAN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0291', 'NAILAN TRIPARTI', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0291', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0292: NAJMI NAYLA FAIZAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0292', 'BPK. SYAMSUL ARIFIN', '08113494411', 'PROBOLINGGO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0292', 'NAJMI NAYLA FAIZAH', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0292', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0293: NAYLA ZAHWA HAFIYYA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0293', 'BPK. CHOLIDIN', '081574607288', 'PEKALONGAN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0293', 'NAYLA ZAHWA HAFIYYA', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0293', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0294: NILA RIHADATUL MAULA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0294', 'BPK. AHMAD WAKHUDIN', '082322735050', 'PEKALONGAN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0294', 'NILA RIHADATUL MAULA', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0294', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0295: NURAINI SAFITRI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0295', 'BPK. ROJIHAN SANJAYA', '081271870838', 'LAMPUNG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0295', 'NURAINI SAFITRI', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0295', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0296: NURIZ ZUHROTUL QOLBIYAH MAHFUDZ
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0296', 'BPK. MAHFUDZ', '085606057327', 'PASURUAN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0296', 'NURIZ ZUHROTUL QOLBIYAH MAHFUDZ', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0296', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0297: NURUL NUR AINI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0297', 'BPK. SLAMET', '082141065589', 'SRAGEN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0297', 'NURUL NUR AINI', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0297', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0298: RAHMA MUFHIDA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0298', 'BPK. JUWADI', '081284724951', 'BEKASI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0298', 'RAHMA MUFHIDA', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0298', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0299: RIDA RODIAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0299', 'BPK. OCID', '089657762394', 'KUNINGAN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0299', 'RIDA RODIAH', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0299', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0300: RIZKY NUR JULIANA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0300', 'BPK. SUDARNO', '081391735084', 'KARANGANYAR') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0300', 'RIZKY NUR JULIANA', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0300', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0301: RODHIYAH PUTRI WAHANANI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0301', 'BPK. WAHONO SETYONO', '081227080368', 'SUKOHARJO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0301', 'RODHIYAH PUTRI WAHANANI', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0301', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0302: ROFIATUL AMANAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0302', 'IBU SUYATI', '087824800385', 'LAMPUNG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0302', 'ROFIATUL AMANAH', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0302', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0303: RUSMAWATI UTAMI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0303', 'BPK. KLIWON SUTODIMEJO', '089619110608', 'SRAGEN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0303', 'RUSMAWATI UTAMI', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0303', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0304: SABILATUL JANNAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0304', 'IBU JUHRO', '082128590273', 'CIREBON') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0304', 'SABILATUL JANNAH', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0304', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0305: SAKINAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0305', 'IBU MURIYAH', '085600790936', 'PEKALONGAN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0305', 'SAKINAH', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0305', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0306: SAYYIDATUL ASYADDUDINA AZIZAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0306', 'BPK ASMUNGI', '089649856948', 'TULUNGANGUNG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0306', 'SAYYIDATUL ASYADDUDINA AZIZAH', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0306', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0307: SITI ANISA MULYANA NASYIFA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0307', 'BPK KUSAINI', '085808434359', 'NGANJUK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0307', 'SITI ANISA MULYANA NASYIFA', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0307', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0308: SITI FATIMATUZ ZAHROH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0308', 'BPK SISWO HADI SUSANTO', '082338399165', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0308', 'SITI FATIMATUZ ZAHROH', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0308', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0309: SITI NUR AZIZAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0309', 'BPK ROSYAD', '081548743740', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0309', 'SITI NUR AZIZAH', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0309', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0310: SITI SULAIHA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0310', 'BPK SUPANDI', '081233637594', 'BONDOWOSO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0310', 'SITI SULAIHA', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0310', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0311: SITI UN''IMAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0311', 'BPK AHMAD RUSDI', '082139838640', 'REMBANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0311', 'SITI UN''IMAH', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0311', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0312: SOFIYATUL AZIZAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0312', 'BPK MISBAHUDDIN', '081332373270', 'BALIKPAPAN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0312', 'SOFIYATUL AZIZAH', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0312', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0313: SRI WAHYUNI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0313', 'BPK MUHLIS', '085234000287', 'BANYUWANGI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0313', 'SRI WAHYUNI', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0313', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0314: ST.FATIMATUL MUNAWAROH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0314', 'BPK ROFI''UL ANAM', '081553149418', 'BLITAR') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0314', 'ST.FATIMATUL MUNAWAROH', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0314', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0315: SUSANTI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0315', 'BPK ROFI''I', '08315522426', 'BREBES') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0315', 'SUSANTI', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0315', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0316: YULIANA AINUN HABIBAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0316', 'BPK. M. SAMSODIN', '085748081750', 'NGANJUK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0316', 'YULIANA AINUN HABIBAH', 'P3TQ', '3 ALY A.02', 'TAMATAN', '3 ALY A.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0316', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0317: AENUL LINATUL PUADAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0317', 'BPK. ALEX AMINULAH', '085779113307', 'KARAWANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0317', 'AENUL LINATUL PUADAH', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0317', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0318: ADITRI AYUSETYANINGSIH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0318', 'BPK. SUGINO', '085708908831', 'SRAGEN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0318', 'ADITRI AYUSETYANINGSIH', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0318', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0319: ANNISA NUR IZZANI SALSABILA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0319', 'BPK. SUTIKNO', '081264678956', 'BENGKULU') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0319', 'ANNISA NUR IZZANI SALSABILA', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0319', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0320: AZZA HALIMATUS SA''DIYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0320', 'BPK. ZAINAL ABIDIN', '085785465180', 'MOJOKERTO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0320', 'AZZA HALIMATUS SA''DIYAH', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0320', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0321: DEWI MURTASIAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0321', 'BPK. M. DALAIL', '0895322321348', 'CILACAP') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0321', 'DEWI MURTASIAH', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0321', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0322: DIAH MUTIA FANI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0322', 'BPK. M. MUJIB', '082154837283', 'KALIMANTAN BARAT') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0322', 'DIAH MUTIA FANI', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0322', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0323: DINI ARYANTI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0323', 'BPK. SUPARNO', '082125318598', 'CIREBON') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0323', 'DINI ARYANTI', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0323', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0324: FAHDINAL HUSNA AISYAH ZUHRIYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0324', 'BPK. SOLEHUDDIN SOFWAN', '081218164917', 'JOMBANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0324', 'FAHDINAL HUSNA AISYAH ZUHRIYAH', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0324', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0325: FINTIA SUKMA ANGGRAENI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0325', 'BPK. MOHAMAD ARIFIN', '085649524547', 'BLITAR') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0325', 'FINTIA SUKMA ANGGRAENI', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0325', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0326: FITRIATUL AULIA ANNADZIFAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0326', 'BPK. PARJO', '085735748000', 'MOJOKERTO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0326', 'FITRIATUL AULIA ANNADZIFAH', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0326', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0327: HAMIDAH MAULA FATKHATUL AINI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0327', 'BPK. FATONI RIZAL', '081235489663', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0327', 'HAMIDAH MAULA FATKHATUL AINI', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0327', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0328: HIMMATUL ULYA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0328', 'BPK. ALI MUSTHOFA', '085331381981', 'NGANJUK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0328', 'HIMMATUL ULYA', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0328', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0329: IANATUZ ZAKIYA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0329', 'BPK. IMRON QOSIM', '082133510404', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0329', 'IANATUZ ZAKIYA', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0329', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0330: INTAN MEI HOKIS JUWITA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0330', 'BPK. M. HALIL', '085253854997', 'BONDOWOSO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0330', 'INTAN MEI HOKIS JUWITA', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0330', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0331: JAZILATUN NI''MAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0331', 'BPK. M. MUDZAKIR', '085273337951085716443945', 'TEGAL BINANGUN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0331', 'JAZILATUN NI''MAH', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0331', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0332: KARIMA SYAFA ANNISA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0332', 'BPK. NUR SALIM', '081281025759', 'BREBES') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0332', 'KARIMA SYAFA ANNISA', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0332', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0333: LAILATUL MUBAROK
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0333', 'BPK. ALI MUBAROK S', '081259895998', 'SURABAYA') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0333', 'LAILATUL MUBAROK', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0333', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0334: LENY MULIA NINGSIH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0334', 'BPK. TAUFIK SUSANTO', '085374314331', 'RIAU') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0334', 'LENY MULIA NINGSIH', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0334', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0335: MAYA AFLIKHA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0335', 'BPK. M. THOHIRIN', '085290181644', 'CILACAP') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0335', 'MAYA AFLIKHA', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0335', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0336: MULKIYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0336', 'BPK. ACENG', '08817883875', 'BANDUNG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0336', 'MULKIYAH', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0336', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0337: NAELA AIDA RAHMA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0337', 'BPK. MISBAHUS SURUR', '081336485035', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0337', 'NAELA AIDA RAHMA', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0337', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0338: NAFISAH LATHIFATUR ROHMAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0338', 'BPK. M. ALI NURDIN', '082221405634', 'BREBES') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0338', 'NAFISAH LATHIFATUR ROHMAH', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0338', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0339: NAILA NURIL AZIZAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0339', 'BPK. M. ANAM BASRONI', '085655635691', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0339', 'NAILA NURIL AZIZAH', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0339', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0340: NAJWA NAILUL MUNA CHOLIDAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0340', 'BPK. NASIRUN', '08563681104', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0340', 'NAJWA NAILUL MUNA CHOLIDAH', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0340', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0341: NALA LAYYINATUDDIANA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0341', 'BPK. AMINUDDIN DARDIRI', '085791734494', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0341', 'NALA LAYYINATUDDIANA', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0341', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0342: NIHAYATUZ ZAIN ANNAJMI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0342', 'BPK. M. SHOFWAN', '081387377878', 'SIDOARJO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0342', 'NIHAYATUZ ZAIN ANNAJMI', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0342', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0343: NILA KHOIRUN NAILI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0343', 'BPK. AHMAD SYUAIB', '085785355053', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0343', 'NILA KHOIRUN NAILI', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0343', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0344: NUR FAJRIYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0344', 'BPK. TARMUDI', '085773039172', 'CIREBON') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0344', 'NUR FAJRIYAH', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0344', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0345: NUR IMAMA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0345', 'BPK. SHOLI', '085339189971', 'BANYUWANGI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0345', 'NUR IMAMA', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0345', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0346: NUR INSANI RAHMADANI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0346', 'BPK. SAIFUDDIN RAHMAN', '089675637675089512859527', 'BOGOR') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0346', 'NUR INSANI RAHMADANI', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0346', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0347: NUR KHASANAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0347', 'BPK. KARTO', '085707284836', 'BREBES') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0347', 'NUR KHASANAH', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0347', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0348: RIBBI HABIBATUS SOLIHA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0348', 'BPK. AAN TAS''AN', '082128847602', 'CIREBON') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0348', 'RIBBI HABIBATUS SOLIHA', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0348', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0349: RISKA APRILIA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0349', 'BPK. JIRJI ZAIDAN', '082384805143', 'RIAU') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0349', 'RISKA APRILIA', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0349', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0350: ROFIATIM
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0350', 'BPK. SELAMET', '081337488837', 'LUMAJANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0350', 'ROFIATIM', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0350', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0351: SISKA ANNISA'' TAZLINA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0351', 'BPK. AHMAD FARID', '085735682993', 'BLITAR') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0351', 'SISKA ANNISA'' TAZLINA', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0351', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0352: SITI KHILYA QONITA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0352', 'BPK. SU''UDI', '085702116535', 'MAGELANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0352', 'SITI KHILYA QONITA', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0352', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0353: SITI NAILIN MUNA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0353', 'BPK. TARJA''I', '087877154815', 'PEMALANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0353', 'SITI NAILIN MUNA', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0353', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0354: SITI SOLEHATUN
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0354', 'BPK. DARSONO', '081990764030', 'BATANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0354', 'SITI SOLEHATUN', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0354', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0355: SUCI AMALIA PUTRI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0355', 'BPK. ASPURIL', '085848368290', 'PEKALONGAN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0355', 'SUCI AMALIA PUTRI', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0355', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0356: UMAMUL HABIBAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0356', 'BPK. AKSAN', '082331512257', 'PROBOLINGGO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0356', 'UMAMUL HABIBAH', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0356', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0357: UMI KULSUM
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0357', 'BPK. SUPARNO', '081373222240', 'JAMBI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0357', 'UMI KULSUM', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0357', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0358: USWATUN HASANAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0358', 'BPK. SARNO', '081393647379', 'SOLO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0358', 'USWATUN HASANAH', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0358', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0359: VERA NURIA MAULIDA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0359', 'BPK. GIARTO', '082245599691', 'TEMANGGUNG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0359', 'VERA NURIA MAULIDA', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0359', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0360: YULIA PUTRI NUR DIANA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0360', 'BPK. SUMAJI', '082363634949', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0360', 'YULIA PUTRI NUR DIANA', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0360', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0361: ZAHWA NADHIFAH THOYYIBAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0361', 'BPK. MOH. MUNIR', '081235333845', 'SIDOARJO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0361', 'ZAHWA NADHIFAH THOYYIBAH', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0361', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0362: ZIYADATUL HUSNI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0362', 'BPK. M. ALI MAS''UD', '082131911358', 'JEMBER') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0362', 'ZIYADATUL HUSNI', 'P3TQ', '3 ALY A.03', 'TAMATAN', '3 ALY A.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0362', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0363: AFIFATUS SILMI KAFFAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0363', 'BPK TAUFIQ ROHMAN', '0813352220003', 'MADIUN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0363', 'AFIFATUS SILMI KAFFAH', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0363', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0364: AKSA SAVIRA SEPTIYANI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0364', 'BPK H. RUDI PRIYONO', '085813337329', 'JAKARTA') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0364', 'AKSA SAVIRA SEPTIYANI', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0364', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0365: ALMAS BARLYNTI ASSA''ADAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0365', 'BPK M. MUFID', '089516527479', 'JOMBANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0365', 'ALMAS BARLYNTI ASSA''ADAH', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0365', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0366: AMANDA HADI REGITA NATASYA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0366', 'BPK ROHADI', '087788027337', 'BREBES') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0366', 'AMANDA HADI REGITA NATASYA', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0366', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0367: ANISA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0367', 'BPK RAKWAN', '085702645635', 'BREBES') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0367', 'ANISA', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0367', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0368: AULIA FITRI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0368', 'BPK SADRI', '08132534335', 'JAMBI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0368', 'AULIA FITRI', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0368', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0369: AULIA SYIFA NAFSI ALIYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0369', 'BPK YUDA ROSIFUL', '081259856899', 'SURABAYA') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0369', 'AULIA SYIFA NAFSI ALIYAH', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0369', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0370: AULIYA DEWI QOWIMUNA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0370', 'BPK MOH. TOYIB', '085655860612', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0370', 'AULIYA DEWI QOWIMUNA', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0370', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0371: AYI FITRI NURHAYATI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0371', 'BPK DADAN HAMDANI', '085798801428', 'SUKABUMI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0371', 'AYI FITRI NURHAYATI', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0371', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0372: AZKA MUTIARA SANI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0372', 'BPK H. UMAR ABDUL JABBAR AL-AINU', '08157639182', 'BREBES') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0372', 'AZKA MUTIARA SANI', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0372', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0373: DIYANAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0373', 'BPK MOH. SODERI', '081296336660', 'CILACAP') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0373', 'DIYANAH', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0373', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0374: ERIKSA SATTYA PUTRI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0374', 'BPK RIKI SHOLEH RIANTO', '085713243909', 'LUMAJANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0374', 'ERIKSA SATTYA PUTRI', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0374', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0375: EVA NUR FARIDA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0375', 'BPK M. TAUFIQ', '085706853680', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0375', 'EVA NUR FARIDA', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0375', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0376: HEVY HENDRYANI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0376', 'BPK SUHENDI', '081272702522', 'PALEMBANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0376', 'HEVY HENDRYANI', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0376', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0377: IFFAH NAFI''ATUL FAIZAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0377', 'BPK MAHMUDI', '085967099656', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0377', 'IFFAH NAFI''ATUL FAIZAH', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0377', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0378: IHYA'' SETIANI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0378', 'BPK MISNI', '0895329629225', 'MADIUN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0378', 'IHYA'' SETIANI', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0378', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0379: INDAH SAFITRI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0379', 'BPK SAHURI', '087834657650', 'PEMALANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0379', 'INDAH SAFITRI', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0379', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0380: INTAN NURFADILAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0380', 'BPK SOPUAN', '082258906653', 'CIREBON') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0380', 'INTAN NURFADILAH', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0380', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0381: IZA ZULFATUL AUFA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0381', 'BPK AGUS ROWANDI', '085735047727', 'BLITAR') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0381', 'IZA ZULFATUL AUFA', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0381', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0382: IZZA SAIDATUL BAROROH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0382', 'BPK TASMURI', '081216729383', 'PATI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0382', 'IZZA SAIDATUL BAROROH', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0382', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0383: JANNATIN ALIYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0383', 'BPK SUNARDI', '081244775396', 'NGANJUK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0383', 'JANNATIN ALIYAH', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0383', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0384: KANZA KAMILA RAMADHANA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0384', 'BPK CHOLIDIN AHMAD', '085940797994', 'JEPARA') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0384', 'KANZA KAMILA RAMADHANA', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0384', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0385: LAILATUL IZZAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0385', 'BPK SULIONO', '087816042086', 'TUBAN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0385', 'LAILATUL IZZAH', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0385', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0386: LAYYINA LINATAL HARIIR
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0386', 'BPK KATINOM', '082399469926', 'TRENGGALEK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0386', 'LAYYINA LINATAL HARIIR', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0386', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0387: MALICHAH MAYLA ROBBY
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0387', 'BPK M. AMIN TOHA', '081938523558', 'BOJONEGORO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0387', 'MALICHAH MAYLA ROBBY', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0387', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0388: MAYA SARI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0388', 'BPK BOCH BAHGIE', '081262561318', 'ACEH') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0388', 'MAYA SARI', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0388', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0389: MEL VINA A''IZZAUL MAULA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0389', 'BPK H. IMAM SYAFI''I', '08125946427', 'PONOROGO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0389', 'MEL VINA A''IZZAUL MAULA', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0389', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0390: MELISA DWI ANGGRAENI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0390', 'BPK M. ARIFIN', '085707114014', 'PALEMBANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0390', 'MELISA DWI ANGGRAENI', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0390', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0391: MUFRIKHATUL AMALIYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0391', 'BPK M. ANWAR', '082214759078', 'RIAU') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0391', 'MUFRIKHATUL AMALIYAH', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0391', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0392: NILA ZULFA KHOLILA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0392', 'BPK MAHFUD SODIK', '085607058571', 'MADIUN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0392', 'NILA ZULFA KHOLILA', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0392', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0393: NOVIA ISTIJANINGTYAS
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0393', 'BPK SUTEDJO', '081515106386', 'NGAWI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0393', 'NOVIA ISTIJANINGTYAS', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0393', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0394: NURSHINTA RAMADINA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0394', 'BPK SUPAGI', '089682148637', 'SIDOARJO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0394', 'NURSHINTA RAMADINA', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0394', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0395: QONI''ATUL MASYKUROH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0395', 'BPK MUKHIBIN', '085293550924', 'MAGELANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0395', 'QONI''ATUL MASYKUROH', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0395', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0396: QURROTU AYUN
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0396', 'BPK AHMAD MUHAMMAD ALI ANWAR', '089516602978', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0396', 'QURROTU AYUN', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0396', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0397: RANI NUR JANAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0397', 'BPK ANDI DARFITO', '082284275235', 'RIAU') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0397', 'RANI NUR JANAH', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0397', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0398: RAYNA WULAN NABILA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0398', 'KH. ISMAIL MARZUQI', '082374431575', 'LAMPUNG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0398', 'RAYNA WULAN NABILA', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0398', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0399: RIGHDAH AL AYSY
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0399', 'BPK ACHMAD FARCHAN A.', '085860787616', 'MAJALENGKA') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0399', 'RIGHDAH AL AYSY', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0399', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0400: RISKA SETYA TRIANDANI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0400', 'BPK HAMBALI', '0859183960031', 'SIDOARJO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0400', 'RISKA SETYA TRIANDANI', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0400', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0401: ROSYIQOTU SYIFAUL ALIYAH AL-ANWAR
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0401', 'BPK M. KHOIRUL ANWAR', '085203428033', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0401', 'ROSYIQOTU SYIFAUL ALIYAH AL-ANWAR', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0401', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0402: SALWA SAHARANI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0402', 'BPK ZAENAL ARIFIN', '08123221477', 'BLITAR') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0402', 'SALWA SAHARANI', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0402', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0403: SITI AISYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0403', 'BPK ROPI''I', '085815005373', 'PEKALONGAN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0403', 'SITI AISYAH', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0403', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0404: SITI NELY ZUHRIYYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0404', 'BPK BANDI', '087816282257', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0404', 'SITI NELY ZUHRIYYAH', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0404', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0405: SITI NIDA FATHUR ROHMAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0405', 'BPK M. MASRUL', '089661434811', 'CIREBON') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0405', 'SITI NIDA FATHUR ROHMAH', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0405', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0406: SYLVIA RAHMA AULIA FIRDAUS
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0406', 'BPK MIQDAD AMIN', '082333459956', 'NGANJUK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0406', 'SYLVIA RAHMA AULIA FIRDAUS', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0406', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0407: SYROTUL MUWAFIQ
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0407', 'BPK ISTANTO', '082396198807', 'SULAWESI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0407', 'SYROTUL MUWAFIQ', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0407', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0408: ZIDNIA AL IMALA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0408', 'BPK M. MUGHENI MAKMUN', '082302031179', 'NGANJUK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0408', 'ZIDNIA AL IMALA', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0408', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0409: ZUYINA FADILATUL KHASANAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0409', 'BPK NUR ROHMAN', '083822285435', 'BREBES') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0409', 'ZUYINA FADILATUL KHASANAH', 'P3TQ', '3 ALY A.04', 'TAMATAN', '3 ALY A.04') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0409', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0410: ADENIA CINDY SANTOSO
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0410', 'BPK. BUDI SANTOSO', '081259968955', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0410', 'ADENIA CINDY SANTOSO', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0410', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0411: ADKHILNA JANNATIN ALFAFA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0411', 'BPK AMIN TOHARI', '085804715233', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0411', 'ADKHILNA JANNATIN ALFAFA', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0411', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0412: ALFA ALFI KHASANAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0412', 'Wali ALFA ALFI KHASANAH', '', '') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0412', 'ALFA ALFI KHASANAH', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0412', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0413: ALVINA RAHMA SANI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0413', 'BPK WINARSO', '085608585309', 'NGAWI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0413', 'ALVINA RAHMA SANI', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0413', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0414: AZKIYA ULIN ALFIHANI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0414', 'BPK SUHARTO', '085649119090', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0414', 'AZKIYA ULIN ALFIHANI', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0414', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0415: DALLIYAH HADLIRATUL QUTSIAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0415', 'BPK MUZAYYIN AZIZ', '085231590583', 'BONDOWOSO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0415', 'DALLIYAH HADLIRATUL QUTSIAH', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0415', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0416: DEWI FATIMATUZ ZAHRO''
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0416', 'BPK AHMAD NURHUDA', '085267531585', 'LAMPUNG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0416', 'DEWI FATIMATUZ ZAHRO''', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0416', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0417: FADILLAH JOVI AGUSTIN
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0417', 'BPK JOPO SOPONYONO (ALM)', '081906680956', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0417', 'FADILLAH JOVI AGUSTIN', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0417', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0418: FARIHAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0418', 'BPK HIDAYAT', '089660036553', 'INDRAMAYU') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0418', 'FARIHAH', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0418', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0419: FATMAWATI NUR AZIZAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0419', 'BPK BANDI', '081909012266', 'TULUNG AGUNG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0419', 'FATMAWATI NUR AZIZAH', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0419', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0420: FIRDA HANIFA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0420', 'BPK JUMBRI', '085383805778', 'JAMBI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0420', 'FIRDA HANIFA', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0420', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0421: FITRIA DWI WULANDARI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0421', 'BPK MUHTAR ARIFIN', '082234059410', 'TRENGGALEK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0421', 'FITRIA DWI WULANDARI', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0421', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0422: FITROH NUR AZIZAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0422', 'BPK KATMO', '085212927983', 'TEGAL') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0422', 'FITROH NUR AZIZAH', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0422', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0423: FRISKA DIVA NOVIANI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0423', 'BPK SURTONO (ALM)', '083824386615', 'CIREBON') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0423', 'FRISKA DIVA NOVIANI', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0423', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0424: HANIM HANIFIYYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0424', 'BPK IMAM USTADZI', '082131565359', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0424', 'HANIM HANIFIYYAH', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0424', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0425: IZZA DZURROTUL MAJIIDAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0425', 'BPK ALI MANSUR', '085708059001', 'MADIUN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0425', 'IZZA DZURROTUL MAJIIDAH', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0425', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0426: KHOIRI MUHAMMADIYAH ISTIQOMAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0426', 'BPK IMAM NAWAWI', '085732166109', 'MADIUN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0426', 'KHOIRI MUHAMMADIYAH ISTIQOMAH', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0426', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0427: LUTHFIYAH NUR KAMILA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0427', 'BPK FAHMI AZWARI', '089634941598', 'BANGKA BELITUNG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0427', 'LUTHFIYAH NUR KAMILA', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0427', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0428: LUVIAH ALMATINA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0428', 'BPK SUROSO', '085378501628', 'JAMBI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0428', 'LUVIAH ALMATINA', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0428', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0429: MUTAMMIMATUL MASHOLIH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0429', 'BPK ABDUL AZIZ', '082143211124', 'SRAGEN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0429', 'MUTAMMIMATUL MASHOLIH', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0429', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0430: NABILA ZUBDATUL MUNA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0430', 'BPK HUBBULLAH', '081548047600', 'PEKALONGAN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0430', 'NABILA ZUBDATUL MUNA', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0430', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0431: NAELA AZAHRA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0431', 'BPK MUSTAIM', '085728449638', 'PEKALONGAN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0431', 'NAELA AZAHRA', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0431', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0432: NAILA RAHMA SHOIMAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0432', 'BPK IMAM ASYHARI YUSUF', '082331302588', 'NGANJUK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0432', 'NAILA RAHMA SHOIMAH', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0432', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0433: NAWAL EZZA MAULA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0433', 'BPK AHMAD AZZAM MAHDI', '082223337449', 'SIDOARJO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0433', 'NAWAL EZZA MAULA', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0433', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0434: NAYLAI ROSIDATUL AULIYA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0434', 'BPK ABDUL KOHAR', '081356331541', 'DEMAK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0434', 'NAYLAI ROSIDATUL AULIYA', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0434', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0435: NGAFA NAJJANA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0435', 'BPK IRCHAMNI', '085851610308', 'RULUNG AGUNG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0435', 'NGAFA NAJJANA', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0435', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0436: NILA KHOERUN NAILI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0436', 'BPK KISYRODIN SYAFRUDIN', '085606251421', 'CILACAP') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0436', 'NILA KHOERUN NAILI', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0436', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0437: NISFATULLATIFAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0437', 'BPK KHABIBBUDIN', '081332303113', 'MADIUN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0437', 'NISFATULLATIFAH', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0437', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0438: NURINA ISMAIYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0438', 'BPK M MAHFUD', '085604274314', 'KEDIRI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0438', 'NURINA ISMAIYAH', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0438', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0439: RAHMA PRAMUDIA MAHARANI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0439', 'BPK IMAM WAHYUDI', '081331495848', 'PONOROGO') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0439', 'RAHMA PRAMUDIA MAHARANI', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0439', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0440: RASWITA RISDA RADIVA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0440', 'BPK MUHAMAD ARIFIN', '085878482321', 'SEMARANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0440', 'RASWITA RISDA RADIVA', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0440', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0441: RUHILLA FIRDAUS
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0441', 'BPK SYA''RONI', '081246755333', 'MADURA') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0441', 'RUHILLA FIRDAUS', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0441', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0442: SAFNA NIHAYATUL HUSNA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0442', 'BPK IMAM SHOLEH', '085607007700', 'BLITAR') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0442', 'SAFNA NIHAYATUL HUSNA', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0442', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0443: SALSABILA AINUL JANNAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0443', 'BPK AHMAD ROFI''I', '081236877019', 'MALANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0443', 'SALSABILA AINUL JANNAH', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0443', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0444: SARIPAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0444', 'BPK ACENG', '085603398469', 'BANDUNG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0444', 'SARIPAH', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0444', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0445: SHAUT NADIA MILAH HILMI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0445', 'BPH. H. CECEP TAUFIQ HILMI', '081290351592', 'BANTEN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0445', 'SHAUT NADIA MILAH HILMI', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0445', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0446: SITI CHUSNIYATUL BAHA''IYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0446', 'BPK M SYAFI''I (ALM)', '082331461088', 'MALANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0446', 'SITI CHUSNIYATUL BAHA''IYAH', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0446', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0447: SITI DINA RAHMADITA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0447', 'BPK H. AJAT SUBANDI', '081910955338', 'BANTEN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0447', 'SITI DINA RAHMADITA', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0447', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0448: SUWAIBATUL ISLAMIYAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0448', 'BPK ABDUL AZIZ', '085708059858', 'MADIUN') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0448', 'SUWAIBATUL ISLAMIYAH', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0448', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0449: TAZKIA AULIA AZ ZAHRA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0449', 'BPK ABDUL ROHMAN SHOLEH', '085184696324', 'BANYUWANGI') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0449', 'TAZKIA AULIA AZ ZAHRA', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0449', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0450: TRI SUSANTI
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0450', 'BPK SUDARDI', '085743513959', 'PADANG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0450', 'TRI SUSANTI', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0450', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0451: VANNY ALISYA NUR LAILA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0451', 'Wali VANNY ALISYA NUR LAILA', '', 'BLITAR') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0451', 'VANNY ALISYA NUR LAILA', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0451', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0452: VELA MAYLATUZZAHRO
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0452', 'BPK M SHODIQIN', '085362138175', 'RIAU') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0452', 'VELA MAYLATUZZAHRO', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0452', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0453: WAFA
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0453', 'BPK NA''AM', '085649149941', 'BLITAR') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0453', 'WAFA', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0453', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0454: WAFIQ NAILIL MUSTAFIZAH
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0454', 'BPK YUSRON NAWAWY', '085781057143', 'LAMPUNG') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0454', 'WAFIQ NAILIL MUSTAFIZAH', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0454', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0455: ZAHWA ANNASYWA FIRDAUSY
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0455', 'BPK MIFTAHUL ZEN', '085608062335', 'NGANJUK') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0455', 'ZAHWA ANNASYWA FIRDAUSY', 'P3TQ', '3 ALY B.01', 'TAMATAN', '3 ALY B.01') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0455', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0456: Agnes Safitri
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0456', 'Sahid', '085346506549', 'Kalimantan') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0456', 'Agnes Safitri', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0456', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0457: Alifya Vizckania Poetri Prasetia
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0457', 'Irfan Prasetia', '08111887792', 'Jakarta') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0457', 'Alifya Vizckania Poetri Prasetia', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0457', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0458: Alisa Qolby Nurdin
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0458', 'Muhammad Nurudin', '085880440750', 'Blitar') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0458', 'Alisa Qolby Nurdin', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0458', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0459: Amalia Khoirun Nisa
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0459', 'Sutarmin', '085708165077', 'Boyolali') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0459', 'Amalia Khoirun Nisa', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0459', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0460: Amaliatin Nafiah
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0460', 'Muhammad Ja''far', '087782622087', 'Kediri') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0460', 'Amaliatin Nafiah', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0460', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0461: Anisya Eka Syafarida
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0461', 'Abdul Rahman', '085787155307', 'Pontianak') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0461', 'Anisya Eka Syafarida', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0461', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0462: Aprilia Dewi Rofi''ah
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0462', 'Deny Herlianto Irawan', '0811554115213', 'Blitar') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0462', 'Aprilia Dewi Rofi''ah', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0462', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0463: Ashfa Salsabila
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0463', 'Muhammad Ulil Huda', '085792512130', 'Madiun') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0463', 'Ashfa Salsabila', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0463', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0464: Aulia Umarotul Mukminin
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0464', 'Fatkhuroji', '089628797857', 'Kediri') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0464', 'Aulia Umarotul Mukminin', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0464', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0465: Avridah Vauziyah
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0465', 'Ponimin', '085745955751', 'Mojokerto') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0465', 'Avridah Vauziyah', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0465', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0466: Aziza Rihadatul ''Ais
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0466', 'Imam Mahmudi', '081325409497', 'Trenggalek') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0466', 'Aziza Rihadatul ''Ais', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0466', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0467: Azizah Nur Anisya
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0467', 'Agus Sujarwo', '081287146255', 'Kalimantan') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0467', 'Azizah Nur Anisya', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0467', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0468: Azza Tazkiyatil Adzhana
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0468', 'Andalus Jausan', '085645070387', 'Nganjuk') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0468', 'Azza Tazkiyatil Adzhana', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0468', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0469: Cantika Lailatul Haq
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0469', 'Markum', '082324047920', 'Brebes') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0469', 'Cantika Lailatul Haq', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0469', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0470: Delia Muzalfa Nurul ''Ulya
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0470', 'Muhammah Miftahul Yusro', '082359217195', 'Kediri') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0470', 'Delia Muzalfa Nurul ''Ulya', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0470', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0471: Dwi Latifatul Qolbiah
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0471', 'Darsono', '087808281444', 'Banten') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0471', 'Dwi Latifatul Qolbiah', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0471', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0472: Fatihatun Maghfiroh
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0472', 'Yadi', '0895348505736', 'Brebes') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0472', 'Fatihatun Maghfiroh', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0472', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0473: Fina Durrotun Nafisah
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0473', 'Muhammad Ali Shodirin', '085266229662', 'Palembang') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0473', 'Fina Durrotun Nafisah', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0473', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0474: Hanifatul Khoeriyah
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0474', 'Ahmad Khodori', '088987049989', 'Tegal') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0474', 'Hanifatul Khoeriyah', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0474', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0475: Hidayah Roudhotul Jannah
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0475', 'Sumadi', '081256684210', 'Kalimantan') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0475', 'Hidayah Roudhotul Jannah', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0475', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0476: Ifah Nuraini Riadah
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0476', 'Hariono', '081359818900', 'Kediri') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0476', 'Ifah Nuraini Riadah', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0476', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0477: Khanah Faridatun Na''imah
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0477', 'Fuad Hasyim', '085865467889', 'Pekalongan') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0477', 'Khanah Faridatun Na''imah', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0477', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0478: Khoridatul Mufidah
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0478', 'Yunus', '08138074782', 'Banyuwangi') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0478', 'Khoridatul Mufidah', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0478', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0479: Maulida Sofiya
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0479', 'Muhammad Munawwar', '085273651367', 'Palembang') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0479', 'Maulida Sofiya', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0479', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0480: Mehwa Fauzul Uluhyah
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0480', 'Mahfudz Fauzi', '0816550927', 'Batang') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0480', 'Mehwa Fauzul Uluhyah', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0480', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0481: Mumpuni Millati
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0481', 'Rahmat', '085215802406', 'Palembang') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0481', 'Mumpuni Millati', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0481', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0482: Nada Fauziah
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0482', 'H. Atiqul Anshori Ch.', '085171121206', 'Jember') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0482', 'Nada Fauziah', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0482', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0483: Najiha Gemasih
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0483', 'Nasir Suryan', '085381788362', 'Aceh') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0483', 'Najiha Gemasih', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0483', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0484: Najwa Latifa Ahmad
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0484', 'Ahmad Khozinul Abid Zein', '085804058388', 'Kediri') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0484', 'Najwa Latifa Ahmad', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0484', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0485: Nakhlah Syifa'' Cholid Bazeid
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0485', 'Cholid Bazied', '081233135857', 'Kediri') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0485', 'Nakhlah Syifa'' Cholid Bazeid', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0485', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0486: Putti Athipah Qolbi
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0486', 'Sukarto', '085194265932', 'Cirebon') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0486', 'Putti Athipah Qolbi', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0486', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0487: Refi Rahmawati
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0487', 'Suratimin', '085708165077', 'Temanggung') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0487', 'Refi Rahmawati', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0487', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0488: Robbiatul Addawiyah
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0488', 'Asy''ari', '085377514590', 'Lampung') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0488', 'Robbiatul Addawiyah', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0488', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0489: Rofiqoh Azzahro
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0489', 'Sutikno', '082375856177', 'Lampung') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0489', 'Rofiqoh Azzahro', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0489', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0490: Seila Marifatil Maula
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0490', 'Muhammad Nuroini', '085604040626', 'Blitar') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0490', 'Seila Marifatil Maula', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0490', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0491: Siti Amaliyah
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0491', 'Matasan', '081913117038', 'Mojokerto') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0491', 'Siti Amaliyah', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0491', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0492: Siti Faridatul Mustaghfiroh
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0492', 'HM. Hafidz', '085708444863', 'Nganjuk') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0492', 'Siti Faridatul Mustaghfiroh', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0492', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0493: Siti Fathimatuz Zahro''
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0493', 'Imam Syafi''i', '081914792249', 'Trenggalek') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0493', 'Siti Fathimatuz Zahro''', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0493', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0494: Soviatul Zanah
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0494', 'Ghufron', '085709113945', 'Lampung') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0494', 'Soviatul Zanah', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0494', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0495: Tazkiyatan Nafsiyah
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0495', 'Ahmad Muchlason', '085722741379', 'Trenggalek') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0495', 'Tazkiyatan Nafsiyah', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0495', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0496: Tiara Azzahra
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0496', 'Maryani', '089658169336', 'Cirebon') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0496', 'Tiara Azzahra', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0496', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0497: Tisa Juliyani
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0497', 'Solikin', '085870306990', 'Brebes') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0497', 'Tisa Juliyani', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0497', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0498: Yasna Faza Nailah
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0498', 'Wali Yasna Faza Nailah', '', 'Banyuwangi') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0498', 'Yasna Faza Nailah', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0498', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0499: Yuliyanti
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0499', 'Dana', '08889487033', 'Cirebon') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0499', 'Yuliyanti', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0499', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0500: Zahrotul Laili Hadi
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0500', 'Abdul Hadiyatulloh', '087846033636', 'Madura') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0500', 'Zahrotul Laili Hadi', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0500', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0501: Zakyyatun Nafisah
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0501', 'Moh. Fathoni', '085109332608', 'Malang') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0501', 'Zakyyatun Nafisah', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0501', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0502: Zaskia Intan Aulia
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0502', 'Syukron Makmum', '085642095015', 'Cirebon') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0502', 'Zaskia Intan Aulia', 'P3TQ', '3 ALY B.02', 'TAMATAN', '3 ALY B.02') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0502', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0503: Anita Wulandari
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0503', 'Puryanto', '087838244676', 'Lumajang') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0503', 'Anita Wulandari', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0503', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0504: Arifa Abso Zanubah
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0504', 'Pakhruri', '085846068061', 'Tegal') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0504', 'Arifa Abso Zanubah', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0504', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0505: Ashfa Bashiroh
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0505', 'K.H. Muhammad Tohar', '0895335414274', 'Malang') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0505', 'Ashfa Bashiroh', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0505', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0506: Aulia Danifatul Hilma
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0506', 'Ali Basyariah', '085235538609', 'Nganjuk') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0506', 'Aulia Danifatul Hilma', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0506', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0507: Ayu Mashitoh
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0507', 'M. Dawam', '0882003833144', 'Pekalongan') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0507', 'Ayu Mashitoh', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0507', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0508: Aza Elva Rohmatin
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0508', 'Nur Sareh', '082333819929', 'Kediri') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0508', 'Aza Elva Rohmatin', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0508', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0509: Cyndi Aulia
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0509', 'Rosidi', '0895358216201', 'Pemalang') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0509', 'Cyndi Aulia', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0509', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0510: Desi Alvi Rukhoyah
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0510', 'Sunarto', '081522890790', 'Kalimantan') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0510', 'Desi Alvi Rukhoyah', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0510', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0511: Dzurriyatul Chalimah
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0511', 'Abdulloh Maghfuri', '081241833585', 'Sulawesi') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0511', 'Dzurriyatul Chalimah', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0511', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0512: Elisya Naila Yasmin
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0512', 'Musleh Jazuli', '082231285499', 'Pasuruan') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0512', 'Elisya Naila Yasmin', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0512', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0513: Elma Qudsi Naba
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0513', 'Ahmad Zuhri', '085786400665', 'Pekalongan') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0513', 'Elma Qudsi Naba', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0513', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0514: Ely Musfarida
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0514', 'Sulistiyono', '0895406527252', 'Rembang') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0514', 'Ely Musfarida', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0514', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0515: Erni Kholifatonisa
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0515', 'Ndoyo', '082338933645', 'Batang') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0515', 'Erni Kholifatonisa', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0515', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0516: Fathimah Zahra Arrozy
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0516', 'Fakhrul Rozi', '08117440557', 'Jambi') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0516', 'Fathimah Zahra Arrozy', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0516', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0517: Filzah Hidayati Fataniah
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0517', 'Ponimin', '087701992289', 'Trenggalek') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0517', 'Filzah Hidayati Fataniah', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0517', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0518: Fitri Maisarah
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0518', 'Budi Santoso', '085366850487', 'Jambi') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0518', 'Fitri Maisarah', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0518', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0519: Handa Nur Halisa
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0519', 'Suttadi', '087753883367', 'Nganjuk') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0519', 'Handa Nur Halisa', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0519', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0520: Immatul Mabruroh
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0520', 'Khoiron', '085806166526', 'Batang') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0520', 'Immatul Mabruroh', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0520', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0521: Inayatuz Zulfa
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0521', 'Fathul Usman', '081234589219', 'Nganjuk') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0521', 'Inayatuz Zulfa', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0521', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0522: Isti''anatur Rosyida
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0522', 'Isnadi', '082132899125', 'Nganjuk') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0522', 'Isti''anatur Rosyida', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0522', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0523: Jesica Windhi Arta
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0523', 'Sukadi', '081916807087', 'Nganjuk') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0523', 'Jesica Windhi Arta', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0523', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0524: Joefani Azzahra
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0524', 'Junaidi', '082346345645', 'Jambi') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0524', 'Joefani Azzahra', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0524', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0525: Khalwa Bilqis Alriza
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0525', 'Muh. Khusnul Riza', '085735933995', 'Kediri') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0525', 'Khalwa Bilqis Alriza', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0525', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0526: Lia Hikmatul Maula
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0526', 'Moch. Rofiq As''ad', '085222616699', 'Bondowoso') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0526', 'Lia Hikmatul Maula', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0526', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0527: Lubna Azka Affadina
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0527', 'Moh. Afifuddin', '085645451622', 'Lamongan') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0527', 'Lubna Azka Affadina', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0527', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0528: Mamluatun Nikmah
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0528', 'Bahrowi Idris', '085785267470', 'Malang') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0528', 'Mamluatun Nikmah', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0528', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0529: Maula Khilmiyatussoliha
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0529', 'Saifuddin Zuhri', '085755863162', 'Malang') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0529', 'Maula Khilmiyatussoliha', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0529', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0530: Mazaya Aini Shofa
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0530', 'Muhammad Imron', '083850575314', 'Kediri') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0530', 'Mazaya Aini Shofa', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0530', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0531: Melina Sulistyaningsih
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0531', 'Rotadi', '085700869886', 'Brebes') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0531', 'Melina Sulistyaningsih', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0531', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0532: Mila Ni''matul Maula
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0532', 'K. Abdurrohman', '085648004939', 'Nganjuk') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0532', 'Mila Ni''matul Maula', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0532', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0533: Munawirotus Sholihah
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0533', 'Daenuri', '085641353504', 'Magelang') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0533', 'Munawirotus Sholihah', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0533', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0534: Naila Hikmiyah
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0534', 'Suharto', '083853371474', 'Madiun') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0534', 'Naila Hikmiyah', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0534', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0535: Nala Mauila Mamduhin
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0535', 'M. Mamduhin', '085852610231', 'Mojokerto') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0535', 'Nala Mauila Mamduhin', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0535', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0536: Nita Zulaikhah
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0536', 'Sutiyono', '081217008915', 'Magelang') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0536', 'Nita Zulaikhah', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0536', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0537: Nur Auliya El ''Udzma
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0537', 'M. Fathoni Rohman', '085841444562', 'Palembang') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0537', 'Nur Auliya El ''Udzma', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0537', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0538: Oktavia Faizatin Lailan Nuzli
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0538', 'Moh. Fauzi', '085707461871', 'Bojonegoro') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0538', 'Oktavia Faizatin Lailan Nuzli', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0538', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0539: Sayyidah Nafisah
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0539', 'Abdul Wahid', '085655379521', 'Magetan') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0539', 'Sayyidah Nafisah', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0539', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0540: Siti Mardhiyah
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0540', 'Khusnu', '085784064954', 'Kediri') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0540', 'Siti Mardhiyah', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0540', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0541: Siti Ulva Mariani
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0541', 'Sholeh', '082268862208', 'Riau') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0541', 'Siti Ulva Mariani', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0541', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0542: Syafiqoh Elnabila
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0542', 'Moh. Zuhdi Mubarok', '087850550585', 'Madura') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0542', 'Syafiqoh Elnabila', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0542', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0543: Syahdina Azkiyatun Namirah
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0543', 'Saefulloh', '081222793334', 'Cirebon') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0543', 'Syahdina Azkiyatun Namirah', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0543', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0544: Tri Andita Gusti Rachma Putri
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0544', 'Agus Siswanto', '082131062205', 'Nganjuk') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0544', 'Tri Andita Gusti Rachma Putri', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0544', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0545: Tuchfatus Salma
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0545', 'Budi Asy''ari', '085706058751', 'Blitar') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0545', 'Tuchfatus Salma', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0545', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0546: Vika Nur Aini
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0546', 'Nur Sidik', '08176495675', 'Brebes') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0546', 'Vika Nur Aini', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0546', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0547: Vina Luthfiatu Fuzati
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0547', 'Istuhri', '085743260976', 'Magelang') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0547', 'Vina Luthfiatu Fuzati', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0547', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0548: Virnesya Avilla
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0548', 'Slamet Subur', '085878885448', 'Batang') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0548', 'Virnesya Avilla', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0548', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

  -- Santri SH0549: Zahrah Mailatul Maula
  v_kel_id := gen_random_uuid();
  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, 'SH0549', 'M. Nasrur Rohman', '085854823068', 'Kediri') on conflict (event_id, kode) do nothing;
  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, 'SH0549', 'Zahrah Mailatul Maula', 'P3TQ', '3 ALY B.03', 'TAMATAN', '3 ALY B.03') on conflict (event_id, nis) do nothing;
  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, 'SH0549', 2, 0, 0) on conflict (event_id, kode_qr) do nothing;

end $$;