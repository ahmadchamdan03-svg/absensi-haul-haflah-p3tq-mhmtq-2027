// =====================================================================
// MODUL PRESENSI, REKONSILIASI, LOG KEDATANGAN & STATISTIK LIVE
// =====================================================================

import {
  EventConfig,
  PresensiLog,
  StatistikLive,
  DaftarHadirRealtimeItem,
  DaftarBelumHadirItem,
  PesertaHadirItem,
  extractBagianTamatan,
  getGolonganUndangan,
  CheckinResult,
  JalurPemeriksaan,
  RekonsiliasiKoreksiInput,
  IDataStoreContext,
} from './types';

export const INITIAL_EVENT: EventConfig = {
  id: 'e0000000-0000-0000-0000-000000000001',
  nama: 'Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.',
  slug: 'HFL27',
  waktuMulai: '2027-01-02T06:30:00+07:00',
  tempat: 'Aula Muktamar Pondok Pesantren Lirboyo Kediri',
  kunciHmac: 'p3tq_secret_hmac_key_2027',
  linkGrupWa: '',
  kebijakanKuota: {
    lintasKategori: 'MAX',
    hangusMenit: 300,
    bonusSaudara: null,
  },
  status: 'AKTIF',
};

export const INITIAL_PRESENSI_LOGS: PresensiLog[] = [];

export function rekonsiliasiKoreksiPesertaHelper(
  ctx: IDataStoreContext,
  input: RekonsiliasiKoreksiInput
) {
  const cleanKode = input.kode.trim().toUpperCase();
  const item = ctx.findByKode(cleanKode);
  if (!item) {
    return { ok: false, pesan: `Peserta dengan kode ${input.kode} tidak ditemukan.` };
  }

  const { tipe, entitas, kuota, santri } = item;

  // 1. Koreksi Status Kehadiran
  if (input.statusKehadiran === 'BELUM_HADIR') {
    kuota.terpakai = 0;
    kuota.tiketPanggungDiberi = 0;
    // Bersihkan presensi logs untuk kode ini
    ctx.presensiLogs = ctx.presensiLogs.filter(
      (l) => l.kuotaId !== kuota.id && l.kuotaId !== `q_${cleanKode}` && l.kuotaId !== `qu_${cleanKode}`
    );
    if (item.estimasi) {
      item.estimasi.statusHadir = 'BELUM';
    }
  } else if (input.statusKehadiran === 'HADIR') {
    const jL = input.jumlahL !== undefined ? input.jumlahL : 1;
    const jP = input.jumlahP !== undefined ? input.jumlahP : 1;
    const totHadir = jL + jP;
    kuota.terpakai = totHadir;

    // Jika Bil Ghoib dan ada jatah panggung
    if (kuota.tiketPanggungJatah > 0) {
      kuota.tiketPanggungDiberi = 1;
    }

    // Catat log presensi rekonsiliasi
    const logBaru: PresensiLog = {
      id: Date.now(),
      eventId: INITIAL_EVENT.id,
      kuotaId: kuota.id,
      hasil: 'SUKSES',
      jalur: 'REKONSILIASI',
      panitiaId: input.petugas || 'panitia-rekon',
      jumlahL: jL,
      jumlahP: jP,
      jumlahBalita: 0,
      tiketPanggung: kuota.tiketPanggungDiberi > 0,
      nonce: `nonce-rekon-${Date.now()}`,
      serverTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    // Hapus log lama jika ada, lalu push log baru
    ctx.presensiLogs = ctx.presensiLogs.filter(
      (l) => l.kuotaId !== kuota.id && l.kuotaId !== `q_${cleanKode}` && l.kuotaId !== `qu_${cleanKode}`
    );
    ctx.presensiLogs.unshift(logBaru);
    if (item.estimasi) {
      item.estimasi.statusHadir = 'HADIR';
    }
  }

  // 2. Koreksi Kategori Santri (khusus KELUARGA)
  if (tipe === 'KELUARGA' && santri && input.kategoriUtama) {
    santri.kategoriUtama = input.kategoriUtama;
    if (input.kategoriUtama === 'BIL_GHOIB') {
      santri.subKategori = input.subKategori || 'Bil Ghoib';
      santri.kelas = input.kelas || 'Bil Ghoib';
      kuota.kuotaDasar = 4;
      kuota.tiketPanggungJatah = 1;
    } else if (input.kategoriUtama === 'BIN_NADZOR') {
      santri.subKategori = input.subKategori || input.kelas || 'Bin Nadzori';
      santri.kelas = input.kelas || input.subKategori || '3 Tsanawiyah';
      kuota.kuotaDasar = 2;
      kuota.tiketPanggungJatah = 0;
      kuota.tiketPanggungDiberi = 0;
    } else if (input.kategoriUtama === 'TAMATAN') {
      const bg = input.bagianTamatan || 'A.01';
      santri.subKategori = `3 ALY ${bg}`;
      santri.kelas = `3 ALY ${bg}`;
      kuota.kuotaDasar = 2;
      kuota.tiketPanggungJatah = 0;
      kuota.tiketPanggungDiberi = 0;
    }
  }

  // 3. Koreksi Kuota Tambahan (+ / -)
  if (input.kuotaTambahan !== undefined && input.kuotaTambahan >= 0) {
    const selisih = input.kuotaTambahan - (kuota.kuotaTambahan || 0);
    kuota.kuotaTambahan = input.kuotaTambahan;
    ctx.paguTerjual = Math.max(0, ctx.paguTerjual + selisih);
  }

  // 4. Catatan Rekon
  if (input.catatanRekon) {
    (entitas as any).catatanRekon = input.catatanRekon;
    (entitas as any).diperbaruiAt = new Date().toISOString();
    (entitas as any).diperbaruiOleh = input.petugas || 'panitia-rekon';
  }

  ctx.saveToStorage();
  return { ok: true, data: entitas };
}

export function checkinHelper(
  ctx: IDataStoreContext,
  kodeQr: string,
  jumlahL: number,
  jumlahP: number,
  jalur: JalurPemeriksaan,
  balita: number = 0,
  panitiaId: string = 'panitia-gate',
  serahkanTiketPanggung?: boolean
): CheckinResult {
  const total = jumlahL + jumlahP;
  if (total <= 0) {
    return { ok: false, reason: 'JUMLAH_KOSONG', pesan: 'Jumlah yang hadir harus minimal 1 orang.' };
  }

  const item = ctx.findByKode(kodeQr);
  if (!item) {
    return { ok: false, reason: 'QR_INVALID', pesan: 'Kode QR tidak terdaftar dalam sistem!' };
  }

  const { kuota, santri, entitas } = item;

  if (kuota.hangus) {
    return { ok: false, reason: 'KUOTA_HANGUS', pesan: 'Masa berlaku kuota telah hangus (T+300 menit).' };
  }

  const sisa = kuota.kuotaDasar + kuota.kuotaTambahan - kuota.terpakai;
  if (total > sisa) {
    return {
      ok: false,
      reason: 'KUOTA_HABIS',
      pesan: `Sisa kuota tidak mencukupi. Sisa: ${sisa} kursi, diminta: ${total} orang.`,
      sisa,
      diminta: total,
    };
  }

  let isPanggung = false;
  if (kuota.tiketPanggungJatah > 0) {
    if (serahkanTiketPanggung === true) {
      if (kuota.tiketPanggungDiberi < kuota.tiketPanggungJatah) {
        isPanggung = true;
        kuota.tiketPanggungDiberi += 1;
      }
    } else if (serahkanTiketPanggung === false) {
      isPanggung = false; // Checklist tidak dicentang (diserahkan menyusul)
    } else {
      // Fallback default jika parameter tidak dikirim
      if (kuota.tiketPanggungDiberi < kuota.tiketPanggungJatah && jumlahP >= 1) {
        isPanggung = true;
        kuota.tiketPanggungDiberi += 1;
      }
    }
  }

  kuota.terpakai += total;

  const nowStr = new Date().toTimeString().split(' ')[0];
  ctx.presensiLogs.unshift({
    id: Date.now(),
    eventId: INITIAL_EVENT.id,
    kuotaId: kuota.id,
    hasil: 'SUKSES',
    jumlahL,
    jumlahP,
    tiketPanggung: isPanggung,
    jumlahBalita: balita,
    jalur,
    panitiaId,
    nonce: `nonce-${Date.now()}-${Math.random()}`,
    serverTime: nowStr,
  });

  ctx.saveToStorage();

  // Standar Resmi Materi Koordinasi 2: Hitam Gold untuk Maju Panggung (Bil Ghoib), Merah Gold untuk Reguler & Tamu
  let warna = 'Merah Gold';
  if (santri?.kategoriUtama === 'BIL_GHOIB' || isPanggung) {
    warna = 'Hitam Gold';
  }

  return {
    ok: true,
    namaSantri: santri?.nama || (entitas as any).nama || 'Tamu Undangan',
    kelas: santri?.kelas || '-',
    kategori: santri?.subKategori || (entitas as any).kategori || '-',
    warnaTiket: warna,
    masukSekarang: total,
    terpakai: kuota.terpakai,
    kuotaTotal: kuota.kuotaDasar + kuota.kuotaTambahan,
    sisa: kuota.kuotaDasar + kuota.kuotaTambahan - kuota.terpakai,
    tiketPanggung: isPanggung,
    tiketReguler: total - (isPanggung ? 1 : 0),
    zonaLaki: jumlahL,
    zonaPerempuan: jumlahP - (isPanggung ? 1 : 0),
    zonaPanggung: isPanggung ? 1 : 0,
  };
}

export function batalCheckinHelper(
  ctx: IDataStoreContext,
  kode: string
): { ok: boolean; pesan: string } {
  const cleanKode = kode.trim();
  const item = ctx.findByKode(cleanKode);
  if (!item) return { ok: false, pesan: 'Data tidak ditemukan!' };
  item.kuota.terpakai = 0;
  if (item.kuota.tiketPanggungDiberi) item.kuota.tiketPanggungDiberi = 0;
  ctx.presensiLogs = ctx.presensiLogs.filter(
    (l) => l.kuotaId !== item.kuota.id && l.kuotaId !== `q_${cleanKode}` && l.kuotaId !== `qu_${cleanKode}`
  );
  ctx.saveToStorage();
  return { ok: true, pesan: `Status check-in untuk ${item.santri?.nama || (item.entitas as any)?.nama || cleanKode} berhasil direset.` };
}

export function getStatistikLiveHelper(ctx: IDataStoreContext): StatistikLive {
  let totalKuota = 0;
  let totalHadir = 0;
  let totalLaki = 0;
  let totalPerempuan = 0;
  let totalPanggung = 0;
  let totalBalita = 0;
  let jalurBarat = 0;
  let jalurTimur = 0;
  let jalurRekon = 0;

  let bgSantriTotal = 0, bgSantriHadir = 0, bgKuota = 0, bgHadir = 0;
  let bnSantriTotal = 0, bnSantriHadir = 0, bnKuota = 0, bnHadir = 0;
  let tmSantriTotal = 0, tmSantriHadir = 0, tmKuota = 0, tmHadir = 0;
  let kuotaTambahanTerpakai = 0;

  for (const kel of ctx.keluargaList) {
    const kDasar = kel.kuota.kuotaDasar;
    const kTambahan = kel.kuota.kuotaTambahan;
    const terpakai = kel.kuota.terpakai;
    const kTotal = kDasar + kTambahan;

    totalKuota += kTotal;
    totalHadir += terpakai;
    totalPanggung += kel.kuota.tiketPanggungDiberi;

    if (kTambahan > 0 && terpakai > kDasar) {
      kuotaTambahanTerpakai += Math.min(kTambahan, terpakai - kDasar);
    }

    const kat = kel.santri?.[0]?.kategoriUtama;
    if (kat === 'BIL_GHOIB') {
      bgSantriTotal++;
      bgKuota += kTotal;
      bgHadir += terpakai;
      if (terpakai > 0) bgSantriHadir++;
    } else if (kat === 'TAMATAN') {
      tmSantriTotal++;
      tmKuota += kTotal;
      tmHadir += terpakai;
      if (terpakai > 0) tmSantriHadir++;
    } else {
      bnSantriTotal++;
      bnKuota += kTotal;
      bnHadir += terpakai;
      if (terpakai > 0) bnSantriHadir++;
    }
  }

  let undTamuTotal = 0, undTamuHadir = 0, undKuota = 0, undHadir = 0;
  for (const und of ctx.undanganList) {
    const kTotal = und.kuota.kuotaDasar + und.kuota.kuotaTambahan;
    totalKuota += kTotal;
    totalHadir += und.kuota.terpakai;
    undTamuTotal++;
    undKuota += kTotal;
    undHadir += und.kuota.terpakai;
    if (und.kuota.terpakai > 0) undTamuHadir++;
  }

  let tamuLaki = 0;
  let tamuPerempuan = 0;

  for (const log of ctx.presensiLogs) {
    if (log.hasil === 'SUKSES') {
      totalLaki += log.jumlahL;
      totalPerempuan += log.jumlahP;
      totalBalita += log.jumlahBalita;
      if (log.jalur === 'BARAT') jalurBarat++;
      else if (log.jalur === 'TIMUR') jalurTimur++;
      else if (log.jalur === 'REKONSILIASI') jalurRekon++;

      const isUnd = ctx.undanganList.some(
        (u) => u.kuota.id === log.kuotaId || `qu_${u.kode}` === log.kuotaId || u.id === log.kuotaId
      );
      if (isUnd) {
        tamuLaki += log.jumlahL;
        tamuPerempuan += log.jumlahP;
      }
    }
  }

  return {
    totalKuota,
    totalHadir,
    totalLaki,
    totalPerempuan,
    totalPanggung,
    totalBalita,
    jalurBarat,
    jalurTimur,
    jalurRekon,
    persentaseHadir: totalKuota > 0 ? Math.round((totalHadir / totalKuota) * 100) : 0,
    sisaKuota: Math.max(0, totalKuota - totalHadir),

    kategoriStats: {
      bilGhoib: {
        nama: 'Bil Ghoib (64 Khadimatul Qur-an)',
        subLabel: `${bgSantriTotal} Santri · ${bgKuota} Kuota Dasar (Tiket Hitam Gold + Wali Maju Panggung)`,
        warnaTiket: 'Hitam Gold',
        badgeWarna: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        totalPeserta: bgSantriTotal,
        hadirPeserta: bgSantriHadir,
        totalKuota: bgKuota,
        totalHadir: bgHadir,
        persentase: bgKuota > 0 ? Math.round((bgHadir / bgKuota) * 100) : 0,
      },
      binNadzor: {
        nama: 'Bin Nadzori (6 Jenjang Kelas)',
        subLabel: `${bnSantriTotal} Santri · ${bnKuota} Kuota Dasar (Tiket Merah Gold)`,
        warnaTiket: 'Merah Gold',
        badgeWarna: 'bg-blue-100 text-blue-900 border-blue-300',
        totalPeserta: bnSantriTotal,
        hadirPeserta: bnSantriHadir,
        totalKuota: bnKuota,
        totalHadir: bnHadir,
        persentase: bnKuota > 0 ? Math.round((bnHadir / bnKuota) * 100) : 0,
      },
      tamatan: {
        nama: 'Tamatan III Aliyah (7 Bagian)',
        subLabel: `${tmSantriTotal} Santri · ${tmKuota} Kuota Dasar (Tiket Merah Gold)`,
        warnaTiket: 'Merah Gold',
        badgeWarna: 'bg-amber-100 text-amber-900 border-amber-300',
        totalPeserta: tmSantriTotal,
        hadirPeserta: tmSantriHadir,
        totalKuota: tmKuota,
        totalHadir: tmHadir,
        persentase: tmKuota > 0 ? Math.round((tmHadir / tmKuota) * 100) : 0,
      },
      tamuUndangan: {
        nama: 'Tamu Undangan Khusus (Penguji & Asatidz)',
        subLabel: `${undTamuTotal} Tokoh Kehormatan · ${undKuota} Kuota VIP (Tiket Putih)`,
        warnaTiket: 'Putih VIP',
        badgeWarna: 'bg-stone-100 text-stone-900 border-stone-300',
        totalPeserta: undTamuTotal,
        hadirPeserta: undTamuHadir,
        totalKuota: undKuota,
        totalHadir: undHadir,
        persentase: undKuota > 0 ? Math.round((undHadir / undKuota) * 100) : 0,
      },
      kuotaTambahan: {
        paguTotal: ctx.paguTotal,
        terjual: ctx.paguTerjual,
        terpakai: kuotaTambahanTerpakai,
        persentase: ctx.paguTotal > 0 ? Math.round((ctx.paguTerjual / ctx.paguTotal) * 100) : 0,
      },
    },

    tamuUndanganStat: {
      totalUndangan: undTamuTotal,
      hadirUndangan: undTamuHadir,
      totalKuota: undKuota,
      totalHadir: undHadir,
      totalLaki: tamuLaki,
      totalPerempuan: tamuPerempuan,
      persentase: undKuota > 0 ? Math.round((undHadir / undKuota) * 100) : 0,
    },
  };
}

export function getDaftarHadirRealtimeHelper(ctx: IDataStoreContext): DaftarHadirRealtimeItem[] {
  const list: DaftarHadirRealtimeItem[] = [];

  // 1. Entitas Tamu Undangan yang hadir (terpakai > 0)
  for (const und of ctx.undanganList) {
    if (und.kuota.terpakai > 0) {
      const logs = ctx.presensiLogs.filter(
        (l) =>
          l.hasil === 'SUKSES' &&
          (l.kuotaId === und.kuota.id || l.kuotaId === `qu_${und.kode}` || l.kuotaId === und.id)
      );
      let jumlahL = 0;
      let jumlahP = 0;
      let jumlahBalita = 0;
      let waktuTiba = '08:00:00';
      let jalur: JalurPemeriksaan = 'BARAT';
      let panitiaId = 'panitia-gate';

      if (logs.length > 0) {
        for (const l of logs) {
          jumlahL += l.jumlahL;
          jumlahP += l.jumlahP;
          jumlahBalita += l.jumlahBalita;
        }
        const latestLog = logs[0];
        waktuTiba = latestLog.serverTime;
        jalur = latestLog.jalur;
        panitiaId = latestLog.panitiaId;
      } else {
        jumlahL = und.kuota.terpakai;
      }

      const totalK = und.kuota.kuotaDasar + und.kuota.kuotaTambahan;
      const statusHadir = und.kuota.terpakai >= totalK ? 'HADIR' : 'SEBAGIAN';

      list.push({
        id: und.id,
        kode: und.kode,
        tipe: 'UNDANGAN',
        kategoriUtama: 'UNDANGAN',
        nama: und.nama,
        waliAtauInstansi: und.instansi || 'Tamu Kehormatan',
        kategori: und.kategori,
        kelasAtauSub: und.subKategori === 'PENGUJI' ? 'Penguji Al-Qur\'an' : 'Masyayikh & Asatidz',
        kuotaDasar: und.kuota.kuotaDasar,
        kuotaTambahan: und.kuota.kuotaTambahan,
        totalKuota: totalK,
        terpakai: und.kuota.terpakai,
        jumlahL,
        jumlahP,
        jumlahBalita,
        tiketPanggung: false,
        warnaTiket: 'Putih VIP',
        waktuTiba,
        jalur,
        panitiaId,
        statusHadir,
      });
    }
  }

  // 2. Entitas Keluarga Santri yang hadir (terpakai > 0)
  for (const kel of ctx.keluargaList) {
    if (kel.kuota.terpakai > 0) {
      const santri = kel.santri?.[0];
      const katUtama = (santri?.kategoriUtama || 'BIN_NADZOR') as 'BIL_GHOIB' | 'BIN_NADZOR' | 'TAMATAN';
      const logs = ctx.presensiLogs.filter(
        (l) =>
          l.hasil === 'SUKSES' &&
          (l.kuotaId === kel.kuota.id || l.kuotaId === `q_${kel.kode}` || l.kuotaId === kel.id)
      );

      let jumlahL = 0;
      let jumlahP = 0;
      let jumlahBalita = 0;
      let waktuTiba = '07:45:00';
      let jalur: JalurPemeriksaan = katUtama === 'BIL_GHOIB' ? 'TIMUR' : 'BARAT';
      let panitiaId = 'panitia-gate';
      let panggung = kel.kuota.tiketPanggungDiberi > 0;

      if (logs.length > 0) {
        for (const l of logs) {
          jumlahL += l.jumlahL;
          jumlahP += l.jumlahP;
          jumlahBalita += l.jumlahBalita;
          if (l.tiketPanggung) panggung = true;
        }
        const latestLog = logs[0];
        waktuTiba = latestLog.serverTime;
        jalur = latestLog.jalur;
        panitiaId = latestLog.panitiaId;
      } else {
        jumlahL = Math.max(0, kel.kuota.terpakai - 1);
        jumlahP = 1;
      }

      let warna = 'Merah Gold';
      if (katUtama === 'BIL_GHOIB') warna = 'Hitam Gold';
      else if (katUtama === 'TAMATAN') warna = 'Merah Gold';

      const totalK = kel.kuota.kuotaDasar + kel.kuota.kuotaTambahan;
      const statusHadir = kel.kuota.terpakai >= totalK ? 'HADIR' : 'SEBAGIAN';

      list.push({
        id: kel.id,
        kode: kel.kode,
        tipe: 'SANTRI',
        kategoriUtama: katUtama,
        nama: santri?.nama || kel.namaWali,
        waliAtauInstansi: kel.namaWali,
        kategori: santri?.subKategori || santri?.kelas || katUtama,
        kelasAtauSub: santri?.kelas || '-',
        kuotaDasar: kel.kuota.kuotaDasar,
        kuotaTambahan: kel.kuota.kuotaTambahan,
        totalKuota: totalK,
        terpakai: kel.kuota.terpakai,
        jumlahL,
        jumlahP,
        jumlahBalita,
        tiketPanggung: panggung,
        warnaTiket: warna,
        waktuTiba,
        jalur,
        panitiaId,
        statusHadir,
      });
    }
  }

  return list.sort((a, b) => b.waktuTiba.localeCompare(a.waktuTiba));
}

export function getLogKedatanganDetailHelper(ctx: IDataStoreContext) {
  return ctx.presensiLogs.map((log) => {
    let nama = '-';
    let waliAtauInstansi = '-';
    let tipe: 'SANTRI' | 'UNDANGAN' = 'SANTRI';
    let kategori = '-';
    let kategoriUtama: 'BIL_GHOIB' | 'BIN_NADZOR' | 'TAMATAN' | 'UNDANGAN' = 'BIN_NADZOR';
    let kode = '-';
    let warna = 'Merah Gold';

    const kel = ctx.keluargaList.find((k) => k.kuota.id === log.kuotaId || `q_${k.kode}` === log.kuotaId);
    if (kel) {
      const santri = kel.santri?.[0];
      nama = santri?.nama || kel.namaWali;
      waliAtauInstansi = kel.namaWali;
      tipe = 'SANTRI';
      kategori = santri?.subKategori || santri?.kelas || 'SANTRI';
      kategoriUtama = (santri?.kategoriUtama || 'BIN_NADZOR') as any;
      kode = kel.kode;
      if (kategoriUtama === 'BIL_GHOIB') warna = 'Hitam Gold';
      else if (kategoriUtama === 'TAMATAN') warna = 'Merah Gold';
      else warna = 'Merah Gold';
    } else {
      const und = ctx.undanganList.find(
        (u) => u.kuota.id === log.kuotaId || `qu_${u.kode}` === log.kuotaId || u.id === log.kuotaId
      );
      if (und) {
        nama = und.nama;
        waliAtauInstansi = und.instansi || 'Tamu Kehormatan';
        tipe = 'UNDANGAN';
        kategori = und.kategori;
        kategoriUtama = 'UNDANGAN';
        kode = und.kode;
        warna = 'Putih VIP';
      }
    }

    return {
      ...log,
      nama,
      waliAtauInstansi,
      tipe,
      kategori,
      kategoriUtama,
      kode,
      warna,
    };
  });
}

export function getDaftarBelumHadirHelper(
  ctx: IDataStoreContext,
  filterKategori?: string
): DaftarBelumHadirItem[] {
  const list: DaftarBelumHadirItem[] = [];

  // 1. Santri Sohibul Hajat yang belum hadir (terpakai === 0)
  for (const kel of ctx.keluargaList) {
    if (kel.kuota.terpakai === 0) {
      const santri = kel.santri?.[0];
      const katUtama = (santri?.kategoriUtama || 'BIN_NADZOR') as
        | 'BIL_GHOIB'
        | 'BIN_NADZOR'
        | 'TAMATAN';
      const totalK = kel.kuota.kuotaDasar + kel.kuota.kuotaTambahan;

      let katLabel = santri?.subKategori || santri?.kategoriUtama || 'Santri';
      if (santri?.kategoriUtama === 'TAMATAN') {
        const bg = extractBagianTamatan(santri.subKategori) || 'A.01';
        katLabel = `Tamatan Bagian ${bg}`;
      } else if (santri?.kategoriUtama === 'BIL_GHOIB') {
        katLabel = 'Bil Ghoib (Khadimatul Qur-an)';
      } else if (santri?.kelas) {
        katLabel = `Bin Nadzori ${santri.kelas}`;
      }

      let warna = 'Merah Gold';
      if (katUtama === 'BIL_GHOIB') warna = 'Hitam Gold';
      else if (katUtama === 'TAMATAN') warna = 'Merah Gold';

      const isConfirmed = kel.estimasi?.statusKonfirmasi === 'SUDAH';
      const estL = isConfirmed ? kel.estimasi?.perkiraanL || 0 : 0;
      const estP = isConfirmed ? kel.estimasi?.perkiraanP || 0 : 0;

      list.push({
        id: kel.id,
        kode: kel.kode,
        tipe: 'SANTRI',
        kategoriUtama: katUtama,
        nama: santri?.nama || kel.namaWali,
        waliAtauInstansi: kel.namaWali,
        kategori: katLabel,
        kelasAtauSub: santri?.kelas || santri?.subKategori || '-',
        noHp: kel.noHp,
        alamat: kel.alamat,
        kuotaDasar: kel.kuota.kuotaDasar,
        kuotaTambahan: kel.kuota.kuotaTambahan,
        totalKuota: totalK,
        terpakai: 0,
        sisa: totalK,
        warnaTiket: warna,
        statusKonfirmasi: isConfirmed ? 'SUDAH' : 'BELUM',
        estimasiL: estL,
        estimasiP: estP,
        estimasiTotal: estL + estP,
        estimasiDiisiAt: kel.estimasi?.diisiAt,
      });
    }
  }

  // 2. Tamu Undangan yang belum hadir (terpakai === 0)
  for (const und of ctx.undanganList) {
    if (und.kuota.terpakai === 0) {
      const totalK = und.kuota.kuotaDasar + und.kuota.kuotaTambahan;
      list.push({
        id: und.id,
        kode: und.kode,
        tipe: 'UNDANGAN',
        kategoriUtama: 'UNDANGAN',
        golonganUndangan: (und as any).golongan || getGolonganUndangan(und),
        nama: und.nama,
        waliAtauInstansi: und.instansi || 'Tamu Kehormatan',
        kategori: und.kategori,
        kelasAtauSub:
          und.subKategori === 'PENGUJI' ? "Penguji Al-Qur'an" : 'Asatidz Purna Bakti & Masyaikh',
        noHp: '-',
        alamat: (und as any).alamat || und.instansi || '-',
        kuotaDasar: und.kuota.kuotaDasar,
        kuotaTambahan: und.kuota.kuotaTambahan,
        totalKuota: totalK,
        terpakai: 0,
        sisa: totalK,
        warnaTiket: 'Putih VIP',
        statusKonfirmasi: 'SUDAH',
        estimasiL: und.kuota.kuotaDasar,
        estimasiP: 0,
        estimasiTotal: und.kuota.kuotaDasar,
      });
    }
  }

  if (!filterKategori || filterKategori === 'SEMUA') {
    return list;
  }

  const fk = filterKategori.toLowerCase().trim();
  return list.filter((item) => {
    const kat = item.kategori.toLowerCase();
    const katUtama = item.kategoriUtama.toLowerCase();
    const sub = item.kelasAtauSub.toLowerCase();
    return kat.includes(fk) || katUtama.includes(fk) || sub.includes(fk);
  });
}

export function getDaftarHadirSantriDanTamuHelper(
  ctx: IDataStoreContext,
  filterKategori?: string
): PesertaHadirItem[] {
  const list: PesertaHadirItem[] = [];

  // 1. Santri Sohibul Hajat yang sudah hadir (terpakai > 0)
  for (const kel of ctx.keluargaList) {
    if (kel.kuota.terpakai > 0) {
      const santri = kel.santri?.[0];
      const log = ctx.presensiLogs.find(
        (l) => l.kuotaId === kel.kuota.id || l.kuotaId === `q_${kel.kode}`
      );

      let katLabel = santri?.subKategori || santri?.kategoriUtama || 'Santri';
      if (santri?.kategoriUtama === 'TAMATAN') {
        const bg = extractBagianTamatan(santri.subKategori) || 'A.01';
        katLabel = `Tamatan Bagian ${bg}`;
      } else if (santri?.kategoriUtama === 'BIL_GHOIB') {
        katLabel = 'Bil Ghoib (Khadimatul Qur-an)';
      } else if (santri?.kelas) {
        katLabel = `Bin Nadzori ${santri.kelas}`;
      }

      let warna = 'Merah Gold';
      if (santri?.kategoriUtama === 'TAMATAN') warna = 'Merah Gold';
      else if (santri?.kategoriUtama === 'BIL_GHOIB') warna = 'Hitam Gold';

      list.push({
        id: kel.id,
        kode: kel.kode,
        tipe: 'SANTRI',
        kategoriUtama: santri?.kategoriUtama || 'BIN_NADZOR',
        nama: santri?.nama || 'Santri',
        waliAtauInstansi: kel.namaWali,
        kategori: katLabel,
        kelasAtauSub: santri?.kelas || santri?.subKategori || '-',
        kamar: (santri as any)?.kamar || '',
        noHp: kel.noHp,
        alamat: kel.alamat,
        kuotaDasar: kel.kuota.kuotaDasar,
        kuotaTambahan: kel.kuota.kuotaTambahan,
        totalKuota: kel.kuota.kuotaDasar + kel.kuota.kuotaTambahan,
        terpakai: kel.kuota.terpakai,
        sisa: Math.max(0, kel.kuota.kuotaDasar + kel.kuota.kuotaTambahan - kel.kuota.terpakai),
        warnaTiket: warna,
        jumlahL: log ? log.jumlahL : (kel.kuota.terpakai > 1 ? 1 : 0),
        jumlahP: log ? log.jumlahP : (kel.kuota.terpakai > 1 ? kel.kuota.terpakai - 1 : kel.kuota.terpakai),
        tiketPanggungDiberi: kel.kuota.tiketPanggungDiberi,
        tiketPanggungJatah: kel.kuota.tiketPanggungJatah,
        jamMasuk: log?.serverTime || '08:15:00',
        jalur: log?.jalur || 'TIMUR',
      });
    }
  }

  // 2. Tamu Undangan yang sudah hadir (terpakai > 0)
  for (const und of ctx.undanganList) {
    if (und.kuota.terpakai > 0) {
      const log = ctx.presensiLogs.find(
        (l) => l.kuotaId === und.kuota.id || l.kuotaId === `qu_${und.kode}`
      );

      list.push({
        id: und.id,
        kode: und.kode,
        tipe: 'UNDANGAN',
        kategoriUtama: 'UNDANGAN',
        golonganUndangan: (und as any).golongan || getGolonganUndangan(und),
        nama: und.nama,
        waliAtauInstansi: und.instansi || (und as any).alamat || '-',
        kategori: und.kategori || 'Tamu Undangan Khusus',
        kelasAtauSub: und.subKategori === 'PENGUJI' ? "Penguji Al-Qur'an" : 'Asatidz Purna Bakti & Masyaikh',
        noHp: '-',
        alamat: (und as any).alamat || und.instansi,
        kuotaDasar: und.kuota.kuotaDasar,
        kuotaTambahan: und.kuota.kuotaTambahan,
        totalKuota: und.kuota.kuotaDasar + und.kuota.kuotaTambahan,
        terpakai: und.kuota.terpakai,
        sisa: Math.max(0, und.kuota.kuotaDasar + und.kuota.kuotaTambahan - und.kuota.terpakai),
        warnaTiket: 'Putih VIP',
        jumlahL: log ? log.jumlahL : und.kuota.terpakai,
        jumlahP: log ? log.jumlahP : 0,
        tiketPanggungDiberi: 0,
        tiketPanggungJatah: 0,
        jamMasuk: log?.serverTime || '08:30:00',
        jalur: log?.jalur || 'BARAT',
      });
    }
  }

  if (!filterKategori || filterKategori === 'SEMUA') {
    return list;
  }

  const fk = filterKategori.toLowerCase().trim();
  return list.filter((item) => {
    const kat = item.kategori.toLowerCase();
    const katUtama = item.kategoriUtama.toLowerCase();
    const sub = item.kelasAtauSub.toLowerCase();
    return kat.includes(fk) || katUtama.includes(fk) || sub.includes(fk);
  });
}
