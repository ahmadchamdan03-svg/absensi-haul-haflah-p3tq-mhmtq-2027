-- =====================================================================
-- SISTEM ABSENSI & MANAJEMEN KUOTA HAUL & HAFLAH P3TQ - MHMTQ v4.2
-- Skema Basis Data PostgreSQL / Supabase
-- Target Acara: Haul & Haflah 2027 (Slug: HFL27)
-- =====================================================================

create extension if not exists "pgcrypto";

-- ============ ENUM & TIPE DATA ============
do $$ begin
  create type kategori_kode as enum ('BIL_GHOIB','BIN_NADZOR','TAMATAN');
exception
  when duplicate_object then null;
end $$;

-- ============ 1. MASTER ACARA (EVENTS) ============
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  nama text not null, -- 'Haflah & Haul P3TQ-MHMTQ 2027'
  slug text not null unique, -- 'HFL27' (dipakai di muatan QR)
  waktu_mulai timestamptz not null,
  tempat text,
  kunci_hmac text not null, -- kunci rahasia tanda tangan QR
  link_grup_wa text, -- diisi panitia sebelum kirim undangan
  kebijakan_kuota jsonb not null default
    '{"lintas_kategori":"MAX","hangus_menit":300,"bonus_saudara":null}'::jsonb,
  status text not null default 'DRAFT' check (status in ('DRAFT','AKTIF','SELESAI','ARSIP')),
  created_at timestamptz default now()
);

-- ============ 2. KONFIGURASI KUOTA ============
create table if not exists kategori_kuota (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  kode kategori_kode not null,
  sub_kategori text not null, -- 'Bin Nadzori 2 Tsanawiyah', '3 ALY A.01', dll.
  kuota_default smallint not null check (kuota_default between 0 and 10),
  tiket_panggung smallint not null default 0, -- 1 untuk Bil Ghoib, 0 lainnya
  warna_tiket text not null, -- 'Hijau', 'Biru', 'Kuning', 'Merah muda', 'Putih', 'Emas'
  urutan smallint not null default 1,
  unique (event_id, sub_kategori)
);

-- ============ 3. KELUARGA (SOHIBUL HAJAT) ============
create table if not exists keluarga (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  kode text not null, -- 'SH0042' → dipakai di QR & URL portal
  nama_wali text not null,
  no_hp text,
  alamat text,
  unique (event_id, kode)
);
create index if not exists idx_keluarga_event_nohp on keluarga (event_id, no_hp);

-- ============ 4. DATA SANTRI PUTRI ============
create table if not exists santri (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  keluarga_id uuid not null references keluarga(id) on delete cascade,
  nis text not null,
  nama text not null,
  unit text not null, -- 'P3TQ' | 'MHMTQ' | 'MHMA Timur'
  kelas text not null, -- '3 ALY A.02'
  kategori_utama kategori_kode not null,
  kategori_sekunder kategori_kode[] not null default '{}',
  sub_kategori text not null,
  unique (event_id, nis),
  foreign key (event_id, sub_kategori)
    references kategori_kuota (event_id, sub_kategori)
);

-- ============ 5. TAMU UNDANGAN ============
create table if not exists undangan (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  kode text not null, -- 'UND0117'
  kategori text not null, -- 'Penguji Al Qur-an', 'Asatidz Purna Bakti', dll
  nama text not null,
  instansi text,
  pola_kuota smallint not null check (pola_kuota in (2,4)),
  unique (event_id, kode)
);

-- ============ 6. KUOTA (SATU BARIS PER PEMILIK QR) ============
create table if not exists kuota (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  pemilik_tipe text not null check (pemilik_tipe in ('KELUARGA','UNDANGAN')),
  pemilik_id uuid not null,
  kode_qr text not null, -- 'SH0042' / 'UND0117'
  kuota_dasar smallint not null default 0,
  kuota_tambahan smallint not null default 0, -- hasil pembelian
  terpakai smallint not null default 0,
  tiket_panggung_jatah smallint not null default 0,
  tiket_panggung_diberi smallint not null default 0,
  hangus boolean not null default false,
  hangus_at timestamptz,
  constraint kuota_tidak_lebih check (terpakai <= kuota_dasar + kuota_tambahan),
  constraint panggung_tidak_lebih check (tiket_panggung_diberi <= tiket_panggung_jatah),
  unique (event_id, kode_qr),
  unique (event_id, pemilik_tipe, pemilik_id)
);

-- ============ 7. ESTIMASI KEHADIRAN ============
create table if not exists estimasi_kehadiran (
  kuota_id uuid primary key references kuota(id) on delete cascade,
  perkiraan_l smallint not null default 0,
  perkiraan_p smallint not null default 0,
  status_hadir text not null default 'BELUM'
    check (status_hadir in ('BELUM','HADIR','RAGU','BERHALANGAN')),
  diisi_at timestamptz default now()
);

-- ============ 8. PANITIA ============
create table if not exists panitia (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  nama text not null,
  email text,
  pin_hash text not null,
  peran text not null default 'PANITIA_INTI' check (peran in ('PANITIA_INTI', 'PETUGAS_BANTU')),
  aktif boolean not null default true
);

-- ============ 9. LOG PRESENSI ============
create table if not exists presensi_log (
  id bigserial primary key,
  event_id uuid not null references events(id) on delete cascade,
  kuota_id uuid references kuota(id),
  hasil text not null,
  jumlah_l smallint not null default 0,
  jumlah_p smallint not null default 0,
  tiket_panggung boolean not null default false,
  jumlah_balita smallint not null default 0,
  jalur text check (jalur in ('BARAT','TIMUR','REKONSILIASI')),
  panitia_id uuid references panitia(id),
  nonce uuid not null unique,
  server_time timestamptz not null default now(),
  catatan text
);
create index if not exists idx_presensi_event_time on presensi_log (event_id, server_time);
create index if not exists idx_presensi_kuota on presensi_log (kuota_id);

-- ============ 10. PEMBELIAN KUOTA TAMBAHAN ============
create table if not exists pagu_kuota_tambahan (
  event_id uuid primary key references events(id) on delete cascade,
  pagu_total int not null default 300,
  terjual int not null default 0,
  harga_per_unit int not null default 80000,
  rekening text default 'BRI 320701010266508 a.n. Ahmad Chamdan Yuwafin',
  dibuka boolean not null default false,
  constraint tidak_oversold check (terjual <= pagu_total)
);

create table if not exists pembelian_kuota (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  keluarga_id uuid not null references keluarga(id),
  jumlah smallint not null check (jumlah > 0),
  total_bayar int not null,
  bukti_url text,
  status text not null default 'DIPESAN'
    check (status in ('DIPESAN','MENUNGGU_VERIFIKASI','DIVERIFIKASI','DITOLAK','KEDALUWARSA','DIBATALKAN_REFUND')),
  kedaluwarsa_at timestamptz,
  diverifikasi_oleh uuid references panitia(id),
  catatan_panitia text,
  metode_refund text,
  bukti_refund_url text,
  created_at timestamptz default now(),
  diputus_at timestamptz
);
create index if not exists idx_pembelian_event_status on pembelian_kuota (event_id, status);

-- ============ 11. PENGIRIMAN UNDANGAN WHATSAPP ============
create table if not exists pesan_undangan (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  keluarga_id uuid not null references keluarga(id),
  gelombang smallint not null check (gelombang in (1,2)),
  status text not null default 'BELUM'
    check (status in ('BELUM','TERKIRIM','NOMOR_BERMASALAH','DILEWATI')),
  dikirim_oleh uuid references panitia(id),
  dikirim_at timestamptz,
  portal_dibuka_at timestamptz,
  unique (event_id, keluarga_id, gelombang)
);

-- ============ 12. AUDIT LOG ============
create table if not exists audit_log (
  id bigserial primary key,
  event_id uuid,
  aktor uuid,
  aksi text,
  entitas text,
  entitas_id uuid,
  sebelum jsonb,
  sesudah jsonb,
  at timestamptz default now()
);

-- ============ 13. TABEL STATISTIK RINGKASAN REALTIME ============
create table if not exists statistik_live (
  event_id uuid primary key references events(id) on delete cascade,
  total_kuota int not null default 0,
  total_hadir int not null default 0,
  total_laki int not null default 0,
  total_perempuan int not null default 0,
  total_panggung int not null default 0,
  total_balita int not null default 0,
  jalur_barat int not null default 0,
  jalur_timur int not null default 0,
  jalur_rekon int not null default 0,
  updated_at timestamptz default now()
);

-- =====================================================================
-- FUNGSI & STORED PROCEDURES
-- =====================================================================

-- 1. Hitung Kuota Dasar (MAX)
create or replace function hitung_kuota_dasar(p_santri uuid)
returns smallint
language sql stable as $$
  select coalesce(max(kk.kuota_default), 2)::smallint
  from santri s
  join kategori_kuota kk
    on kk.event_id = s.event_id
   and kk.kode = any (array[s.kategori_utama] || s.kategori_sekunder)
  where s.id = p_santri;
$$;

-- 2. Mesin Validasi Checkin Atomik
create or replace function checkin(
  p_kode_qr text,
  p_jumlah_l smallint,
  p_jumlah_p smallint,
  p_panitia uuid,
  p_jalur text,
  p_nonce uuid,
  p_balita smallint default 0
) returns jsonb
language plpgsql security definer as $$
declare
  v_k kuota%rowtype;
  v_total smallint := p_jumlah_l + p_jumlah_p;
  v_sisa smallint;
  v_nama text;
  v_kelas text;
  v_kat text;
  v_warna text;
  v_panggung boolean := false;
begin
  if v_total <= 0 then
    return jsonb_build_object('ok', false, 'reason', 'JUMLAH_KOSONG');
  end if;

  if exists (select 1 from presensi_log where nonce = p_nonce) then
    return jsonb_build_object('ok', true, 'reason', 'REPLAY');
  end if;

  select * into v_k from kuota
  where kode_qr = p_kode_qr for update;

  if not found then
    insert into presensi_log(event_id, hasil, panitia_id, jalur, nonce)
    values ((select id from events where status = 'AKTIF' limit 1), 'QR_INVALID', p_panitia, p_jalur, p_nonce);
    return jsonb_build_object('ok', false, 'reason', 'QR_INVALID');
  end if;

  if v_k.hangus then
    return jsonb_build_object('ok', false, 'reason', 'KUOTA_HANGUS', 'hangus_at', v_k.hangus_at);
  end if;

  v_sisa := v_k.kuota_dasar + v_k.kuota_tambahan - v_k.terpakai;

  if v_total > v_sisa then
    insert into presensi_log(event_id, kuota_id, hasil, jumlah_l, jumlah_p, panitia_id, jalur, nonce)
    values (v_k.event_id, v_k.id, 'KUOTA_HABIS', p_jumlah_l, p_jumlah_p, p_panitia, p_jalur, p_nonce);
    return jsonb_build_object('ok', false, 'reason', 'KUOTA_HABIS', 'sisa', v_sisa, 'diminta', v_total);
  end if;

  if v_k.tiket_panggung_jatah > 0 and v_k.tiket_panggung_diberi < v_k.tiket_panggung_jatah then
    if p_jumlah_p < 1 then
      return jsonb_build_object(
        'ok', false,
        'reason', 'PANGGUNG_BUTUH_PEREMPUAN',
        'pesan', 'Tiket panggung hanya untuk wali perempuan. Pastikan minimal 1 wali perempuan hadir sebelum menyerahkan tiket emas.'
      );
    end if;
    v_panggung := true;
    update kuota set tiket_panggung_diberi = tiket_panggung_diberi + 1 where id = v_k.id;
  end if;

  update kuota set terpakai = terpakai + v_total where id = v_k.id;

  insert into presensi_log(
    event_id, kuota_id, hasil, jumlah_l, jumlah_p,
    tiket_panggung, jumlah_balita, panitia_id, jalur, nonce
  ) values (
    v_k.event_id, v_k.id, 'SUKSES', p_jumlah_l, p_jumlah_p,
    v_panggung, p_balita, p_panitia, p_jalur, p_nonce
  );

  if v_k.pemilik_tipe = 'KELUARGA' then
    select s.nama, s.kelas, s.sub_kategori, kk.warna_tiket
    into v_nama, v_kelas, v_kat, v_warna
    from santri s
    join kategori_kuota kk on kk.event_id = s.event_id and kk.sub_kategori = s.sub_kategori
    where s.keluarga_id = v_k.pemilik_id limit 1;
  else
    select u.nama, '(Tamu Undangan)', u.kategori, 'Putih'
    into v_nama, v_kelas, v_kat, v_warna
    from undangan u where u.id = v_k.pemilik_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'nama_santri', coalesce(v_nama, '(Sohibul Hajat)'),
    'kelas', coalesce(v_kelas, '-'),
    'kategori', coalesce(v_kat, '-'),
    'warna_tiket', coalesce(v_warna, 'Reguler'),
    'masuk_sekarang', v_total,
    'terpakai', v_k.terpakai + v_total,
    'kuota_total', v_k.kuota_dasar + v_k.kuota_tambahan,
    'sisa', v_sisa - v_total,
    'tiket_panggung', v_panggung,
    'tiket_reguler', v_total - (case when v_panggung then 1 else 0 end),
    'zona_laki', p_jumlah_l,
    'zona_perempuan', p_jumlah_p - (case when v_panggung then 1 else 0 end),
    'zona_panggung', case when v_panggung then 1 else 0 end
  );
end $$;

-- 3. Pemesanan Kuota Tambahan Atomik
create or replace function pesan_kuota_tambahan(
  p_event uuid,
  p_keluarga uuid,
  p_jumlah smallint
) returns jsonb
language plpgsql security definer as $$
declare
  v_sisa int;
  v_id uuid;
  v_harga int;
begin
  select pagu_total - terjual, harga_per_unit
  into v_sisa, v_harga
  from pagu_kuota_tambahan where event_id = p_event for update;

  if v_sisa is null then
    return jsonb_build_object('ok', false, 'reason', 'PAGU_BELUM_DIATUR');
  end if;

  if v_sisa <= 0 then
    return jsonb_build_object('ok', false, 'reason', 'HABIS', 'sisa', 0);
  end if;

  if p_jumlah > v_sisa then
    return jsonb_build_object('ok', false, 'reason', 'MELEBIHI_SISA', 'sisa', v_sisa);
  end if;

  update pagu_kuota_tambahan
  set terjual = terjual + p_jumlah
  where event_id = p_event;

  insert into pembelian_kuota(
    event_id, keluarga_id, jumlah, total_bayar, status, kedaluwarsa_at
  ) values (
    p_event, p_keluarga, p_jumlah, p_jumlah * v_harga, 'DIPESAN', now() + interval '6 hours'
  ) returning id into v_id;

  return jsonb_build_object(
    'ok', true,
    'id', v_id,
    'jumlah', p_jumlah,
    'total_bayar', p_jumlah * v_harga,
    'sisa', v_sisa - p_jumlah,
    'batas_unggah', now() + interval '6 hours'
  );
end $$;

-- 4. Pembatalan Aktif / Refund Kuota Tambahan
create or replace function batalkan_pembelian(p_id uuid)
returns jsonb
language plpgsql security definer as $$
declare
  v_p pembelian_kuota%rowtype;
begin
  select * into v_p from pembelian_kuota
  where id = p_id and status in ('DIVERIFIKASI', 'MENUNGGU_VERIFIKASI', 'DIPESAN')
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'TIDAK_DITEMUKAN_ATAU_SUDAH_DIPROSES');
  end if;

  update pembelian_kuota
  set status = 'DIBATALKAN_REFUND', diputus_at = now()
  where id = p_id;

  if v_p.status = 'DIVERIFIKASI' then
    update kuota
    set kuota_tambahan = kuota_tambahan - v_p.jumlah
    where event_id = v_p.event_id and pemilik_tipe = 'KELUARGA' and pemilik_id = v_p.keluarga_id;
  end if;

  update pagu_kuota_tambahan
  set terjual = terjual - v_p.jumlah
  where event_id = v_p.event_id;

  return jsonb_build_object(
    'ok', true,
    'jumlah_refund', v_p.jumlah,
    'total_uang', v_p.total_bayar,
    'status', 'DIBATALKAN_REFUND'
  );
end $$;

-- 5. Trigger Proteksi Penguncian Konfigurasi Kuota Saat Event AKTIF
create or replace function cegah_ubah_konfigurasi_saat_aktif()
returns trigger language plpgsql as $$
begin
  if (select status from events where id = OLD.event_id) = 'AKTIF' then
    raise exception 'Konfigurasi kuota terkunci — event sedang AKTIF. Hubungi panitia inti.';
  end if;
  return NEW;
end $$;

drop trigger if exists kunci_kategori_kuota on kategori_kuota;
create trigger kunci_kategori_kuota
before update on kategori_kuota
for each row execute function cegah_ubah_konfigurasi_saat_aktif();

-- 6. Trigger Pembaruan Statistik Live Realtime
create or replace function update_statistik_live()
returns trigger language plpgsql as $$
begin
  if NEW.hasil = 'SUKSES' then
    insert into statistik_live (event_id, total_hadir, total_laki, total_perempuan, total_panggung, total_balita, jalur_barat, jalur_timur, jalur_rekon)
    values (
      NEW.event_id,
      NEW.jumlah_l + NEW.jumlah_p,
      NEW.jumlah_l,
      NEW.jumlah_p,
      case when NEW.tiket_panggung then 1 else 0 end,
      NEW.jumlah_balita,
      case when NEW.jalur = 'BARAT' then 1 else 0 end,
      case when NEW.jalur = 'TIMUR' then 1 else 0 end,
      case when NEW.jalur = 'REKONSILIASI' then 1 else 0 end
    )
    on conflict (event_id) do update set
      total_hadir = statistik_live.total_hadir + (NEW.jumlah_l + NEW.jumlah_p),
      total_laki = statistik_live.total_laki + NEW.jumlah_l,
      total_perempuan = statistik_live.total_perempuan + NEW.jumlah_p,
      total_panggung = statistik_live.total_panggung + (case when NEW.tiket_panggung then 1 else 0 end),
      total_balita = statistik_live.total_balita + NEW.jumlah_balita,
      jalur_barat = statistik_live.jalur_barat + (case when NEW.jalur = 'BARAT' then 1 else 0 end),
      jalur_timur = statistik_live.jalur_timur + (case when NEW.jalur = 'TIMUR' then 1 else 0 end),
      jalur_rekon = statistik_live.jalur_rekon + (case when NEW.jalur = 'REKONSILIASI' then 1 else 0 end),
      updated_at = now();
  end if;
  return NEW;
end $$;

drop trigger if exists trg_presensi_statistik on presensi_log;
create trigger trg_presensi_statistik
after insert on presensi_log
for each row execute function update_statistik_live();

-- ============ VIEW REKAPITULASI SOHIBUL HAJAT ============
create or replace view v_rekap_sohibul_hajat as
select
  kk.urutan as no,
  kk.sub_kategori as kategori,
  count(distinct s.id) as jumlah_sh,
  coalesce(sum(case when pl.hasil = 'SUKSES' then pl.jumlah_l else 0 end), 0) as ws_laki_laki,
  coalesce(sum(case when pl.hasil = 'SUKSES' then pl.jumlah_p else 0 end), 0) as ws_perempuan,
  coalesce(sum(case when pl.hasil = 'SUKSES' then pl.jumlah_l + pl.jumlah_p else 0 end), 0) as total_hadir,
  sum(coalesce(k.kuota_dasar, 0) + coalesce(k.kuota_tambahan, 0)) as total_kuota,
  round(
    100.0 * coalesce(sum(case when pl.hasil = 'SUKSES' then pl.jumlah_l + pl.jumlah_p else 0 end), 0)
    / nullif(sum(coalesce(k.kuota_dasar, 0) + coalesce(k.kuota_tambahan, 0)), 0),
    1
  ) as prosentase
from kategori_kuota kk
left join santri s
  on s.event_id = kk.event_id
 and s.sub_kategori = kk.sub_kategori
left join kuota k
  on k.pemilik_id = s.keluarga_id
 and k.pemilik_tipe = 'KELUARGA'
left join presensi_log pl
  on pl.kuota_id = k.id
group by kk.urutan, kk.sub_kategori
order by kk.urutan;
