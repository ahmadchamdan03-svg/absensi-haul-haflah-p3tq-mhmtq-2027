# -*- coding: utf-8 -*-
import json

with open("C:/Users/user/.gemini/antigravity/scratch/haflah-p3tq/scripts/all_santri_final.json", "r", encoding="utf-8") as f:
    santri_list = json.load(f)

print(f"Generating SQL for {len(santri_list)} santri...")

sql_lines = [
    "-- =====================================================================",
    "-- SEED DATA: HAFLAH & HAUL P3TQ-MHMTQ 2027 (549 SANTRI LENGKAP)",
    "-- 64 Bil Ghoib + 159 Bin Nadzori + 326 Tamatan",
    "-- =====================================================================",
    "",
    "do $$",
    "declare",
    "  v_event_id uuid := 'e0000000-0000-0000-0000-000000000001'::uuid;",
    "  v_kunci text := 'p3tq_secret_hmac_key_2027';",
    "  v_kel_id uuid;",
    "begin",
    "  -- 1. Inisialisasi Master Acara",
    "  insert into events (id, nama, slug, waktu_mulai, tempat, kunci_hmac, link_grup_wa, status)",
    "  values (",
    "    v_event_id,",
    "    'Haflah & Haul P3TQ-MHMTQ 2027',",
    "    'HFL27',",
    "    '2027-01-02 06:30:00+07',",
    "    'Aula Muktamar Pondok Pesantren Lirboyo Kediri',",
    "    v_kunci,",
    "    'https://chat.whatsapp.com/HaflahP3TQ2027Official',",
    "    'AKTIF'",
    "  ) on conflict (id) do update set status = 'AKTIF';",
    "",
    "  -- 2. Inisialisasi Pagu Kuota Tambahan 300 Pagu @ Rp 80.000",
    "  insert into pagu_kuota_tambahan (event_id, pagu_total, terjual, harga_per_unit, rekening, dibuka)",
    "  values (v_event_id, 300, 0, 80000, 'BRI 320701010266508 a.n. Ahmad Chamdan Yuwafin', true)",
    "  on conflict (event_id) do nothing;",
    "",
    "  -- 3. Kategori Kuota & Warna Tiket",
    "  insert into kategori_kuota (event_id, kode, sub_kategori, kuota_default, tiket_panggung, warna_tiket, urutan)",
    "  values",
    "    (v_event_id, 'BIL_GHOIB', 'Bil Ghoib', 4, 1, 'Hijau', 1),",
    "    (v_event_id, 'BIN_NADZOR', 'Bin Nadzori 2 Tsanawiyah', 2, 0, 'Biru', 2),",
    "    (v_event_id, 'BIN_NADZOR', 'Bin Nadzori 3 Tsanawiyah', 2, 0, 'Biru', 3),",
    "    (v_event_id, 'BIN_NADZOR', 'Bin Nadzori 1 Aliyah', 2, 0, 'Biru', 4),",
    "    (v_event_id, 'BIN_NADZOR', 'Bin Nadzori 2 Aliyah', 2, 0, 'Biru', 5),",
    "    (v_event_id, 'BIN_NADZOR', 'Bin Nadzori 3 Aliyah', 2, 0, 'Biru', 6),",
    "    (v_event_id, 'BIN_NADZOR', 'Bin Nadzori Mutakhorijat', 2, 0, 'Biru', 7),",
    "    (v_event_id, 'TAMATAN', '3 ALY A.01', 2, 0, 'Kuning', 8),",
    "    (v_event_id, 'TAMATAN', '3 ALY A.02', 2, 0, 'Kuning', 9),",
    "    (v_event_id, 'TAMATAN', '3 ALY A.03', 2, 0, 'Kuning', 10),",
    "    (v_event_id, 'TAMATAN', '3 ALY A.04', 2, 0, 'Kuning', 11),",
    "    (v_event_id, 'TAMATAN', '3 ALY B.01', 2, 0, 'Kuning', 12),",
    "    (v_event_id, 'TAMATAN', '3 ALY B.02', 2, 0, 'Kuning', 13),",
    "    (v_event_id, 'TAMATAN', '3 ALY B.03', 2, 0, 'Kuning', 14)",
    "  on conflict (event_id, sub_kategori) do nothing;",
    ""
]

for s in santri_list:
    nama_esc = s["nama"].replace("'", "''")
    wali_esc = s["namaWali"].replace("'", "''")
    alamat_esc = s["alamat"].replace("'", "''")
    kamar_esc = s.get("kamar", "").replace("'", "''")
    hp = s.get("noHp", "")
    code = s["code"]
    kat = s["kategoriUtama"]
    sub_kat = s["subKategori"]
    kuota = s["kuotaDasar"]
    panggung = s.get("tiketPanggungJatah", 0)

    sql_lines.append(f"  -- Santri {code}: {nama_esc}")
    sql_lines.append(f"  v_kel_id := gen_random_uuid();")
    sql_lines.append(f"  insert into keluarga (id, event_id, kode, nama_wali, no_hp, alamat) values (v_kel_id, v_event_id, '{code}', '{wali_esc}', '{hp}', '{alamat_esc}') on conflict (event_id, kode) do nothing;")
    sql_lines.append(f"  insert into santri (event_id, keluarga_id, nis, nama, unit, kelas, kategori_utama, sub_kategori) values (v_event_id, v_kel_id, '{code}', '{nama_esc}', 'P3TQ', '{sub_kat}', '{kat}', '{sub_kat}') on conflict (event_id, nis) do nothing;")
    sql_lines.append(f"  insert into kuota (event_id, pemilik_tipe, pemilik_id, kode_qr, kuota_dasar, kuota_tambahan, tiket_panggung_jatah) values (v_event_id, 'KELUARGA', v_kel_id, '{code}', {kuota}, 0, {panggung}) on conflict (event_id, kode_qr) do nothing;")
    sql_lines.append("")

sql_lines.append("end $$;")

with open("C:/Users/user/.gemini/antigravity/scratch/haflah-p3tq/supabase/seed.sql", "w", encoding="utf-8") as f:
    f.write("\n".join(sql_lines))

print("Generated supabase/seed.sql successfully!")
