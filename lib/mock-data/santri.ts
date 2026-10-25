// =====================================================================
// MODUL DATA & OPERASI SANTRI / KELUARGA & KUOTA TAMBAHAN
// =====================================================================

import {
  KeluargaWithKuota,
  PembelianKuota,
  TambahPesertaInput,
  EditPesertaInput,
  TambahPesananManualInput,
  IDataStoreContext,
} from './types';

export const SANTRI_EVENT_ID = 'e0000000-0000-0000-0000-000000000001';

// Basis Data Kosong Bersih (Menunggu Pengisian Manual oleh Panitia)
export const INITIAL_KELUARGA: KeluargaWithKuota[] = [];

export const INITIAL_PEMBELIAN_KUOTA: PembelianKuota[] = [];

export function tambahPesertaHelper(ctx: IDataStoreContext, input: TambahPesertaInput) {
  let maxNum = 0;
  for (const k of ctx.keluargaList) {
    if (k.kode.startsWith('SH')) {
      const num = parseInt(k.kode.replace('SH', ''), 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  }
  const nextCode = `SH${String(maxNum + 1).padStart(4, '0')}`;
  const kelId = `k_${nextCode}`;
  const santriId = `s_${nextCode}`;
  const kuotaId = `q_${nextCode}`;

  const kuotaDasar = input.kategoriUtama === 'BIL_GHOIB' ? 4 : 2;
  const tiketPanggung = input.kategoriUtama === 'BIL_GHOIB' ? 1 : 0;

  let resolvedSub = input.subKategori;
  let resolvedKelas = input.kelas;
  if (input.kategoriUtama === 'TAMATAN') {
    const bagian = input.bagianTamatan || 'A.01';
    resolvedSub = `3 ALY ${bagian}`;
    resolvedKelas = `3 ALY ${bagian}`;
  } else if (input.kategoriUtama === 'BIL_GHOIB') {
    resolvedSub = 'Bil Ghoib';
    resolvedKelas = 'Bil Ghoib';
  } else {
    resolvedSub = 'Bin Nadzori';
    resolvedKelas = 'Bin Nadzori';
  }

  const newKeluarga: any = {
    id: kelId,
    kode: nextCode,
    namaWali: input.namaWali,
    noHp: input.noHp,
    alamat: input.alamat || 'Kediri',
    santri: [
      {
        id: santriId,
        keluargaId: kelId,
        nis: nextCode,
        nama: input.nama,
        kelas: resolvedKelas,
        kamar: input.kamar || '',
        kategoriUtama: input.kategoriUtama,
        subKategori: resolvedSub,
      },
    ],
    kuota: {
      id: kuotaId,
      eventId: SANTRI_EVENT_ID,
      pemilikTipe: 'KELUARGA',
      pemilikId: kelId,
      kodeQr: nextCode,
      kuotaDasar: kuotaDasar,
      kuotaTambahan: 0,
      terpakai: 0,
      tiketPanggungJatah: tiketPanggung,
      tiketPanggungDiberi: 0,
      hangus: false,
    },
    estimasi: {
      kuotaId,
      perkiraanL: 1,
      perkiraanP: 1,
      statusHadir: 'HADIR',
      diisiAt: new Date().toISOString(),
    },
  };

  ctx.keluargaList.push(newKeluarga);
  ctx.saveToStorage();
  return { ok: true, code: nextCode, peserta: newKeluarga };
}

export function editSantriHelper(
  ctx: IDataStoreContext,
  kel: KeluargaWithKuota,
  data: EditPesertaInput
) {
  if (data.namaWali !== undefined) kel.namaWali = data.namaWali;
  if (data.noHp !== undefined) kel.noHp = data.noHp;
  if (data.alamat !== undefined) kel.alamat = data.alamat;
  if (kel.santri && kel.santri[0]) {
    if (data.nama !== undefined) kel.santri[0].nama = data.nama;
    if (data.kamar !== undefined) (kel.santri[0] as any).kamar = data.kamar;
    if (data.subKategori !== undefined) kel.santri[0].subKategori = data.subKategori;
    if (data.kelas !== undefined) kel.santri[0].kelas = data.kelas;
    if (data.kategoriUtama !== undefined) {
      kel.santri[0].kategoriUtama = data.kategoriUtama;
      const kDasar = data.kategoriUtama === 'BIL_GHOIB' ? 4 : 2;
      const tPanggung = data.kategoriUtama === 'BIL_GHOIB' ? 1 : 0;
      kel.kuota.kuotaDasar = kDasar;
      kel.kuota.tiketPanggungJatah = tPanggung;
    }
  }
  if (data.kuotaDasar !== undefined) {
    kel.kuota.kuotaDasar = data.kuotaDasar;
  }
  ctx.saveToStorage();
  return { ok: true, kel };
}

export function pesanKuotaHelper(ctx: IDataStoreContext, keluargaId: string, jumlah: number) {
  if (!ctx.kuotaTambahanBuka) {
    return { ok: false, pesan: 'Mohon maaf, pemesanan kuota tambahan saat ini sedang ditutup oleh panitia.' };
  }
  if (jumlah <= 0) return { ok: false, pesan: 'Jumlah pemesanan harus lebih dari 0' };
  const sisa = ctx.paguTotal - ctx.paguTerjual;
  if (sisa < jumlah) return { ok: false, pesan: 'Sisa kuota tambahan tidak mencukupi!' };

  ctx.paguTerjual += jumlah;
  const batas = new Date(Date.now() + 6 * 3600 * 1000).toISOString();
  const orderId = 'order-' + Date.now();

  const newOrder: PembelianKuota = {
    id: orderId,
    eventId: SANTRI_EVENT_ID,
    keluargaId,
    jumlah,
    totalBayar: jumlah * 75000,
    status: 'DIPESAN',
    kedaluwarsaAt: batas,
    createdAt: new Date().toISOString(),
  };

  ctx.pembelianList.unshift(newOrder);
  ctx.saveToStorage();

  return { ok: true, id: orderId, jumlah, totalBayar: newOrder.totalBayar, batas };
}

export function uploadBuktiBayarHelper(ctx: IDataStoreContext, orderId: string, buktiUrl: string) {
  const order = ctx.pembelianList.find((p) => p.id === orderId);
  if (!order) return { ok: false, pesan: 'Pesanan tidak ditemukan' };
  const now = new Date();
  order.buktiUrl = buktiUrl;
  order.status = 'MENUNGGU_VERIFIKASI';
  order.buktiUploadedAt = now.toISOString();
  order.batasVerifikasiAt = new Date(now.getTime() + 6 * 3600 * 1000).toISOString(); // Target SLA 6 jam panitia
  order.autoApproveAt = new Date(now.getTime() + 12 * 3600 * 1000).toISOString(); // Batas 12 jam toleransi auto-approve
  ctx.saveToStorage();
  return {
    ok: true,
    batasVerifikasiAt: order.batasVerifikasiAt,
    autoApproveAt: order.autoApproveAt,
  };
}

export function verifikasiPembelianHelper(
  ctx: IDataStoreContext,
  orderId: string,
  setuju: boolean,
  catatan: string = ''
) {
  const order = ctx.pembelianList.find((p) => p.id === orderId);
  if (!order) return { ok: false, pesan: 'Pesanan tidak ditemukan' };

  if (setuju) {
    order.status = 'DIVERIFIKASI';
    order.diputusAt = new Date().toISOString();
    order.catatanPanitia = catatan || 'Diverifikasi manual oleh panitia';
    order.autoApprovedBySystem = false;

    const kel = ctx.keluargaList.find((k) => k.id === order.keluargaId);
    if (kel) {
      kel.kuota.kuotaTambahan += order.jumlah;
    }
  } else {
    order.status = 'DITOLAK';
    order.diputusAt = new Date().toISOString();
    order.catatanPanitia = catatan || 'Ditolak oleh panitia';
    order.autoApprovedBySystem = false;
    ctx.paguTerjual = Math.max(0, ctx.paguTerjual - order.jumlah);
  }

  ctx.saveToStorage();
  return { ok: true };
}

export function evaluasiBatasWaktuHelper(ctx: IDataStoreContext) {
  let changed = false;
  const now = Date.now();

  for (const order of ctx.pembelianList) {
    // 1. Pesanan DIPESAN: Kunci 6 jam. Jika lewat 6 jam belum upload bukti -> KEDALUWARSA & kembalikan pagu
    if (order.status === 'DIPESAN') {
      const expiredTime = new Date(order.kedaluwarsaAt).getTime();
      if (now > expiredTime) {
        order.status = 'KEDALUWARSA';
        order.diputusAt = new Date().toISOString();
        order.catatanPanitia = 'Kedaluwarsa otomatis: Batas waktu transfer dan upload bukti 6 jam telah habis';
        ctx.paguTerjual = Math.max(0, ctx.paguTerjual - order.jumlah);
        changed = true;
      }
    }

    // 2. Pesanan MENUNGGU_VERIFIKASI: Panitia punya target 6 jam. Jika dalam 12 jam belum diverifikasi panitia -> OTOMATIS BERHASIL
    if (order.status === 'MENUNGGU_VERIFIKASI') {
      const baseTime = order.buktiUploadedAt
        ? new Date(order.buktiUploadedAt).getTime()
        : order.createdAt
        ? new Date(order.createdAt).getTime()
        : now;
      const autoApproveTime = order.autoApproveAt
        ? new Date(order.autoApproveAt).getTime()
        : baseTime + 12 * 3600 * 1000;

      if (now > autoApproveTime) {
        order.status = 'DIVERIFIKASI';
        order.diputusAt = new Date().toISOString();
        order.autoApprovedBySystem = true;
        order.catatanPanitia = order.catatanPanitia
          ? `${order.catatanPanitia} | Otomatis Berhasil oleh Sistem (Batas Waktu Verifikasi 12 Jam Terlampaui)`
          : 'Otomatis Berhasil oleh Sistem (Batas Waktu Verifikasi Panitia 12 Jam Terlampaui)';

        const kel = ctx.keluargaList.find((k) => k.id === order.keluargaId);
        if (kel) {
          kel.kuota.kuotaTambahan += order.jumlah;
        }
        changed = true;
      }
    }
  }

  if (changed) {
    ctx.saveToStorage();
  }
  return { ok: true, changed };
}

export function tambahPesananManualHelper(ctx: IDataStoreContext, input: TambahPesananManualInput) {
  const {
    keluargaId,
    jumlah,
    metodeBayar = 'TUNAI',
    langsungVerifikasi = true,
    catatan = '',
  } = input;

  if (jumlah <= 0) return { ok: false, pesan: 'Jumlah pemesanan minimal 1 kursi' };

  const kel = ctx.keluargaList.find((k) => k.id === keluargaId);
  if (!kel) return { ok: false, pesan: 'Data santri / keluarga tidak ditemukan' };

  const sisa = ctx.paguTotal - ctx.paguTerjual;
  if (sisa < jumlah) {
    return { ok: false, pesan: `Sisa kuota global (${sisa}) tidak mencukupi untuk penambahan ${jumlah} kursi!` };
  }

  ctx.paguTerjual += jumlah;
  const orderId = 'ORD-MNL-' + Date.now();
  const nowIso = new Date().toISOString();

  const newOrder: PembelianKuota = {
    id: orderId,
    eventId: SANTRI_EVENT_ID,
    keluargaId,
    jumlah,
    totalBayar: jumlah * 75000,
    status: langsungVerifikasi ? 'DIVERIFIKASI' : 'MENUNGGU_VERIFIKASI',
    kedaluwarsaAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    catatanPanitia:
      catatan ||
      (langsungVerifikasi
        ? `Input manual & verifikasi langsung (${metodeBayar}) oleh panitia`
        : `Input manual (${metodeBayar}) menunggu verifikasi`),
    createdAt: nowIso,
    diputusAt: langsungVerifikasi ? nowIso : undefined,
  };

  if (langsungVerifikasi) {
    kel.kuota.kuotaTambahan += jumlah;
  }

  ctx.pembelianList.unshift(newOrder);
  ctx.saveToStorage();

  return {
    ok: true,
    order: newOrder,
    pesan: langsungVerifikasi
      ? `Berhasil menambahkan ${jumlah} kuota tambahan manual & langsung diverifikasi untuk ${kel.namaWali} (Santri: ${kel.santri?.[0]?.nama || '-'}).`
      : `Berhasil mencatat pesanan manual ${jumlah} kursi (menunggu verifikasi).`,
  };
}

export function batalkanPembelianHelper(
  ctx: IDataStoreContext,
  orderId: string,
  metode: 'TRANSFER' | 'TUNAI_HARI_H' = 'TRANSFER'
) {
  const order = ctx.pembelianList.find((p) => p.id === orderId);
  if (!order) return { ok: false, pesan: 'Pesanan tidak ditemukan' };

  if (order.status === 'DIVERIFIKASI') {
    const kel = ctx.keluargaList.find((k) => k.id === order.keluargaId);
    if (kel) {
      kel.kuota.kuotaTambahan = Math.max(0, kel.kuota.kuotaTambahan - order.jumlah);
    }
  }

  order.status = 'DIBATALKAN_REFUND';
  order.metodeRefund = metode;
  order.diputusAt = new Date().toISOString();
  ctx.paguTerjual = Math.max(0, ctx.paguTerjual - order.jumlah);

  ctx.saveToStorage();
  return { ok: true, jumlahRefund: order.jumlah, totalUang: order.totalBayar };
}

export function simpanEstimasiHelper(
  ctx: IDataStoreContext,
  kuotaId: string,
  perkiraanL: number,
  perkiraanP: number,
  diubahOleh: string = 'WALI_MANDIRI',
  catatan: string = ''
) {
  const kel = ctx.keluargaList.find(
    (k) => k.kuota.id === kuotaId || `q_${k.kode}` === kuotaId || k.id === kuotaId || k.kode === kuotaId
  );
  if (kel) {
    kel.estimasi = {
      kuotaId: kel.kuota.id,
      perkiraanL: Math.max(0, perkiraanL),
      perkiraanP: Math.max(0, perkiraanP),
      statusHadir: 'HADIR',
      statusKonfirmasi: 'SUDAH',
      diisiAt: new Date().toISOString(),
      diubahOleh,
      catatan,
    };
    ctx.saveToStorage();
    return { ok: true, estimasi: kel.estimasi };
  }
  return { ok: false, pesan: 'Data santri / kuota tidak ditemukan' };
}

export function getRekapKonfirmasiHelper(ctx: IDataStoreContext) {
  let sudahKonfirmasiCount = 0;
  let belumKonfirmasiCount = 0;
  let totalEstL = 0;
  let totalEstP = 0;
  let totalKuotaSantri = 0;

  for (const kel of ctx.keluargaList) {
    const kTotal = kel.kuota.kuotaDasar + kel.kuota.kuotaTambahan;
    totalKuotaSantri += kTotal;

    if (kel.estimasi && kel.estimasi.statusKonfirmasi === 'SUDAH') {
      sudahKonfirmasiCount++;
      totalEstL += kel.estimasi.perkiraanL || 0;
      totalEstP += kel.estimasi.perkiraanP || 0;
    } else {
      belumKonfirmasiCount++;
    }
  }

  return {
    totalSantri: ctx.keluargaList.length,
    sudahKonfirmasiCount,
    belumKonfirmasiCount,
    persentaseSudah:
      ctx.keluargaList.length > 0
        ? Math.round((sudahKonfirmasiCount / ctx.keluargaList.length) * 100)
        : 0,
    totalEstL,
    totalEstP,
    totalEstimasiRombongan: totalEstL + totalEstP,
    totalKuotaSantri,
  };
}

export function getDaftarKonfirmasiSantriHelper(ctx: IDataStoreContext) {
  return ctx.keluargaList.map((kel) => {
    const santri = kel.santri?.[0];
    const katUtama = (santri?.kategoriUtama || 'BIN_NADZOR') as
      | 'BIL_GHOIB'
      | 'BIN_NADZOR'
      | 'TAMATAN';
    const totalK = kel.kuota.kuotaDasar + kel.kuota.kuotaTambahan;
    const isConfirmed = kel.estimasi?.statusKonfirmasi === 'SUDAH';
    const estL = isConfirmed ? kel.estimasi?.perkiraanL || 0 : 0;
    const estP = isConfirmed ? kel.estimasi?.perkiraanP || 0 : 0;

    return {
      id: kel.id,
      kode: kel.kode,
      namaSantri: santri?.nama || '-',
      kamar: santri?.kamar || '-',
      kategoriUtama: katUtama,
      subKategori: santri?.subKategori || santri?.kelas || '-',
      kelas: santri?.kelas || '-',
      namaWali: kel.namaWali,
      noHp: kel.noHp,
      alamat: kel.alamat,
      kuotaDasar: kel.kuota.kuotaDasar,
      kuotaTambahan: kel.kuota.kuotaTambahan,
      totalKuota: totalK,
      statusKonfirmasi: isConfirmed ? ('SUDAH' as const) : ('BELUM' as const),
      perkiraanL: estL,
      perkiraanP: estP,
      totalEstimasi: estL + estP,
      diisiAt: kel.estimasi?.diisiAt || '',
      diubahOleh: kel.estimasi?.diubahOleh || 'WALI_MANDIRI',
      catatan: kel.estimasi?.catatan || '',
    };
  });
}

export function editKonfirmasiManualHelper(
  ctx: IDataStoreContext,
  kode: string,
  perkiraanL: number,
  perkiraanP: number,
  catatan: string = ''
) {
  const cleanKode = kode.trim().toUpperCase();
  const kel = ctx.keluargaList.find((k) => k.kode.toUpperCase() === cleanKode);
  if (!kel) return { ok: false, pesan: 'Data santri tidak ditemukan' };

  const totalK = kel.kuota.kuotaDasar + kel.kuota.kuotaTambahan;
  if (perkiraanL + perkiraanP > totalK) {
    return {
      ok: false,
      pesan: `Total rombongan (${perkiraanL + perkiraanP} orang) melebihi jatah kuota (${totalK} kursi)!`,
    };
  }

  kel.estimasi = {
    kuotaId: kel.kuota.id,
    perkiraanL: Math.max(0, perkiraanL),
    perkiraanP: Math.max(0, perkiraanP),
    statusHadir: 'HADIR',
    statusKonfirmasi: 'SUDAH',
    diisiAt: new Date().toISOString(),
    diubahOleh: 'PANITIA_MANUAL',
    catatan,
  };

  ctx.saveToStorage();
  return { ok: true, kel };
}
