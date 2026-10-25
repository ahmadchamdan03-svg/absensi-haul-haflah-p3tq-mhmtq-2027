'use client';

import React from 'react';
import {
  MessageSquare,
  Clock,
  Wifi,
  Zap,
  Pause,
  ShoppingBag,
  RefreshCw,
  UserCheck,
  MapPin,
} from 'lucide-react';
import { buatPesanPengingatKonfirmasi } from '@/lib/hmac';
import { extractBagianTamatan } from '@/lib/types';

export function getTeksPesan(kel: any, gel: 1 | 2 | 3, linkGrupWa: string) {
  const santri = kel.santri?.[0];
  const totalKuota = (kel.kuota?.kuotaDasar || 0) + (kel.kuota?.kuotaTambahan || 0);
  const liveDomain = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://haflahp3tq.site';
  const origin =
    typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')
      ? window.location.origin
      : liveDomain;
  const linkPortal = `${origin}/u/${kel.kode}`;
  const linkPembelian = `${origin}/beli/${kel.kode}`;

  const katText =
    santri?.kategoriUtama === 'BIL_GHOIB'
      ? 'Bil Ghoib'
      : santri?.kategoriUtama === 'BIN_NADZOR'
      ? 'Bin Nadzori'
      : santri?.kategoriUtama === 'TAMATAN'
      ? `Tamatan (Bagian ${extractBagianTamatan(santri?.kelas || santri?.subKategori)})`
      : 'Shohibul Hajat';

  if (gel === 1) {
    return `Yth. Bapak/Ibu Wali Santri
*${kel.namaWali}*

Dengan memohon rahmat dan ridha Allah SWT, kami mengundang Bapak/Ibu untuk menghadiri:

*HAUL & HAFLAH P3TQ DAN MHMTQ 1448 H./ 2027 M.*
*Pondok Pesantren Putri Tahfizhil Qur-an (P3TQ)*
*Madrasah Hidayatul Mubtadi-aat Fittahfizhi wal Qiro-at (MHMTQ)*

Hari/Tanggal : Sabtu, 24 Rajab 1448 H. / 02 Januari 2027 M.
Waktu : 06.30 WIB - Selesai
Tempat : Aula Muktamar Pondok Pesantren Lirboyo Kediri
Masuk melalui: Gerbang Selatan (Bola Dunia)

Shohibul Hajat : *${santri?.nama || '-'}*
Kategori : ${katText}
Kamar : ${santri?.kamar || '-'}
Hak Kuota Masuk : *${totalKuota} orang*

Undangan digital resmi, konfirmasi kehadiran, dan QR Code gerbang masuk dapat diakses pada tautan berikut:
${linkPortal}

_Mohon QR Code disimpan dan ditunjukkan kepada petugas saat memasuki Lokasi acara._

Untuk informasi dan pengumuman terbaru, silakan bergabung di grup WhatsApp resmi wali santri:
${linkGrupWa}

Atas perhatian dan kehadirannya kami sampaikan terima kasih.
Jazakumullahu khairan katsiran.

Wassalamu'alaikum warahmatullahi wabarakatuh
*Panitia Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.*`;
  } else if (gel === 2) {
    return `Yth. Bapak/Ibu Wali Santri
*${kel.namaWali}*

Menindaklanjuti undangan Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M., kami membuka kesempatan penambahan kuota kehadiran bagi keluarga yang ingin mengajak lebih banyak sanak saudara.

Ketentuan:
• Rincian biaya dan rekening tujuan transfer tersedia lengkap pada portal digital di bawah
• Bila dalam 6 jam belum upload bukti transfer, maka pemesanan otomatis dibatalkan
• Pendaftaran ditutup otomatis bila kuota habis
• Kuota otomatis ditambahkan ke QR Code Anda

Pemesanan dan konfirmasi pembayaran:
${linkPembelian}

Wassalamu'alaikum warahmatullahi wabarakatuh
*Panitia Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.*`;
  } else {
    return buatPesanPengingatKonfirmasi(santri?.nama || kel.namaWali, kel.kode, origin);
  }
}

export function getTeksPesanTamu(tamu: any) {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')
      ? window.location.origin
      : 'https://haflahp3tq.site');
  const linkPortal = `${baseUrl}/u/${tamu.kode || 'UNDxxxx'}`;
  const jalur = (tamu.jalurMasuk || '').trim();

  return `Yth. Bapak/Ibu 
*${tamu.nama}*

Dengan memohon rahmat dan ridha Allah SWT, kami mengundang Bapak/Ibu untuk menghadiri:

*HAUL & HAFLAH P3TQ DAN MHMTQ 1448 H./ 2027 M.*
*Pondok Pesantren Putri Tahfizhil Qur-an (P3TQ)*
*Madrasah Hidayatul Mubtadi-aat Fittahfizhi wal Qiro-at (MHMTQ)*

Hari/Tanggal : Sabtu, 24 Rajab 1448 H. / 02 Januari 2027 M.
Waktu        : 06.30 WIB - Selesai
Tempat       : Aula Muktamar Pondok Pesantren Lirboyo Kediri
Masuk melalui: ${jalur || '[JALUR MASUK - MANUAL INPUT]'}

Undangan digital resmi, konfirmasi kehadiran, dan QR Code gerbang masuk dapat diakses pada tautan berikut:
${linkPortal}

_Mohon QR Code disimpan dan ditunjukkan kepada petugas saat memasuki Lokasi acara._

Atas perhatian dan kehadirannya kami sampaikan terima kasih.
Jazakumullahu khairan katsiran.

Wassalamu'alaikum warahmatullahi wabarakatuh
*Panitia Haul & Haflah P3TQ dan MHMTQ 1448 H./ 2027 M.*`;
}

export interface WhatsAppStatsProps {
  activeTab: 'WALI_SANTRI' | 'TAMU_UNDANGAN';
  // Wali Santri Props
  keluargaList: any[];
  loadingData: boolean;
  fetchSantriWaData: () => void;
  gelombang: 1 | 2 | 3;
  setGelombang: (g: 1 | 2 | 3) => void;
  setFilterKonfirmasi: (f: 'SEMUA' | 'BELUM' | 'SUDAH') => void;
  kuotaTambahanBuka: boolean;
  savingKuotaConfig: boolean;
  handleToggleKuotaSwitch: () => void;
  fonnteStatus: {
    connected: boolean;
    name?: string;
    device?: string;
    quota?: string;
    loading: boolean;
    error?: string;
  };
  isBlasting: boolean;
  blastProgress: { current: number; total: number; success: number; failed: number };
  handleStartBatchBlast: () => void;
  handleStopBatchBlast: () => void;
  linkGrupWa: string;
  setLinkGrupWa: (val: string) => void;
  // Tamu Undangan Props
  tamuList: any[];
  filteredTamuList: any[];
  loadingTamuData: boolean;
  fetchTamuWaData: () => void;
  isTamuBlasting: boolean;
  tamuBlastProgress: { current: number; total: number; success: number; failed: number };
  handleStartBatchBlastTamu: () => void;
  handleStopBatchBlastTamu: () => void;
  countJalurKosong: number;
  massJalurInputText: string;
  setMassJalurInputText: (val: string) => void;
  handleApplyMassJalurMasuk: (customInput: string) => void;
}

export default function WhatsAppStats({
  activeTab,
  keluargaList,
  loadingData,
  fetchSantriWaData,
  gelombang,
  setGelombang,
  setFilterKonfirmasi,
  kuotaTambahanBuka,
  savingKuotaConfig,
  handleToggleKuotaSwitch,
  fonnteStatus,
  isBlasting,
  blastProgress,
  handleStartBatchBlast,
  handleStopBatchBlast,
  linkGrupWa,
  setLinkGrupWa,
  tamuList,
  filteredTamuList,
  loadingTamuData,
  fetchTamuWaData,
  isTamuBlasting,
  tamuBlastProgress,
  handleStartBatchBlastTamu,
  handleStopBatchBlastTamu,
  countJalurKosong,
  massJalurInputText,
  setMassJalurInputText,
  handleApplyMassJalurMasuk,
}: WhatsAppStatsProps) {
  if (activeTab === 'WALI_SANTRI') {
    return (
      <div className="bg-[#FAF7F3] rounded-3xl p-4 sm:p-6 shadow-sm border-2 border-[#D5C4B4] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#EFE8E1] text-[#8C6A47] flex items-center justify-center font-bold border border-[#D5C4B4] shadow-sm shrink-0">
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-serif font-black text-[#422F21] truncate">
                Panel WA Gateway — Wali Santri
              </h1>
              <p className="text-xs text-[#7A624E] font-normal leading-tight">
                Terhubung 100% langsung ke tabel Supabase `peserta_santri` (<strong>{keluargaList.length} Santri</strong>).
              </p>
            </div>
          </div>

          <button
            onClick={fetchSantriWaData}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF7F3] text-[#8C6A47] border border-[#D5C4B4] font-bold text-xs shadow-xs flex items-center justify-center space-x-1.5 w-full md:w-auto cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
            <span>Refresh Data DB</span>
          </button>
        </div>

        {/* Gelombang & Switch Kontrol Beli Kuota */}
        <div className="pt-3 border-t border-[#D5C4B4] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-[#EFE8E1] p-1.5 rounded-2xl border border-[#D5C4B4] shadow-inner overflow-x-auto no-scrollbar whitespace-nowrap">
            <button
              type="button"
              onClick={() => {
                setGelombang(1);
                setFilterKonfirmasi('SEMUA');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-serif font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
                gelombang === 1
                  ? 'bg-[#8C6A47] text-white shadow-md border border-[#735334]'
                  : 'text-[#422F21] hover:text-[#8C6A47] hover:bg-white/70'
              }`}
            >
              <span>1. Undangan &amp; QR</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setGelombang(2);
                setFilterKonfirmasi('SEMUA');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-serif font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
                gelombang === 2
                  ? 'bg-[#8C6A47] text-white shadow-md border border-[#735334]'
                  : 'text-[#422F21] hover:text-[#8C6A47] hover:bg-white/70'
              }`}
            >
              <span>2. Kuota Tambahan</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setGelombang(3);
                setFilterKonfirmasi('BELUM');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-serif font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
                gelombang === 3
                  ? 'bg-amber-800 text-white shadow-md border border-amber-900'
                  : 'text-[#422F21] hover:text-amber-800 hover:bg-white/70'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>3. Pengingat Konfirmasi</span>
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-start space-x-2.5 px-3.5 py-2 bg-white rounded-xl border border-[#D5C4B4] shadow-xs shrink-0">
            <span className="text-xs font-bold text-[#422F21] flex items-center space-x-1.5">
              <ShoppingBag className="w-4 h-4 text-[#8C6A47]" />
              <span>Beli Kuota:</span>
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleToggleKuotaSwitch}
                disabled={savingKuotaConfig}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                  kuotaTambahanBuka ? 'bg-emerald-600' : 'bg-[#C5B5A5]'
                }`}
              >
                <span className="sr-only">Toggle Kuota Tambahan</span>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    kuotaTambahanBuka ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span
                className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                  savingKuotaConfig
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : kuotaTambahanBuka
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-stone-100 text-stone-500 border border-stone-300'
                }`}
              >
                {savingKuotaConfig ? 'MEMPROSES...' : kuotaTambahanBuka ? 'ON' : 'OFF (TUTUP)'}
              </span>
            </div>
          </div>
        </div>

        {/* Fonnte Live Status Widget */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#FAF7F3] via-[#EFE8E1] to-[#FAF7F3] text-[#422F21] border-2 border-[#8C6A47]/40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shadow-sm shrink-0">
              <Wifi className="w-4.5 h-4.5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-serif font-black text-[#422F21] truncate">
                  FONNTE GATEWAY TERHUBUNG
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-400 shrink-0">
                  ONLINE
                </span>
              </div>
              <div className="text-[11px] sm:text-xs text-[#7A624E] mt-0.5 font-medium truncate">
                Pengirim: <strong>{fonnteStatus.name}</strong> ({fonnteStatus.device}) · Sisa: <strong>{fonnteStatus.quota} Pesan</strong>
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto">
            {!isBlasting ? (
              <button
                onClick={handleStartBatchBlast}
                className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8C6A47] via-[#A47E57] to-[#8C6A47] hover:brightness-105 text-white font-serif font-black text-xs shadow-md flex items-center justify-center space-x-1.5 transition-all border border-[#FAF7F3] cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>
                  {gelombang === 3
                    ? 'Blast Pengingat (Fonnte)'
                    : 'Kirim Massal Otomatis (Fonnte)'}
                </span>
              </button>
            ) : (
              <button
                onClick={handleStopBatchBlast}
                className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <Pause className="w-4 h-4" />
                <span>Hentikan Blasting ({blastProgress.current}/{blastProgress.total})</span>
              </button>
            )}
          </div>
        </div>

        {/* Box Preview Template Pesan */}
        <div className="mt-4 p-4 rounded-2xl bg-white border border-[#D5C4B4] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-[#8C6A47]" />
              <span className="font-bold text-xs text-[#422F21]">
                Preview Template Pesan Wali:{' '}
                <span className="text-[#8C6A47]">
                  {gelombang === 1
                    ? 'Gelombang 1 - Undangan Resmi & QR'
                    : gelombang === 2
                    ? 'Gelombang 2 - Info Kuota Tambahan'
                    : 'Pengingat Konfirmasi Kehadiran'}
                </span>
              </span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#FAF7F3] border border-[#D5C4B4]/70 font-mono text-[11px] text-[#422F21] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
            {getTeksPesan(
              keluargaList[0] || {
                kode: 'SH0001',
                namaWali: 'Bpk. Wali Santri',
                santri: [{ nama: 'Santri Putri', kategoriUtama: 'BIL_GHOIB', kamar: 'A.01' }],
                kuota: { kuotaDasar: 2, kuotaTambahan: 0 },
              },
              gelombang,
              linkGrupWa
            )}
          </div>
        </div>

        {/* Progress Bar Blasting jika aktif */}
        {isBlasting && (
          <div className="mt-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 space-y-2 text-xs text-amber-950">
            <div className="flex items-center justify-between font-bold">
              <span>Sedang Mengirim Pesan WhatsApp Massal...</span>
              <span>
                {blastProgress.current} dari {blastProgress.total} wali ({blastProgress.success} berhasil, {blastProgress.failed} gagal)
              </span>
            </div>
            <div className="w-full bg-amber-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#8C6A47] h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.round((blastProgress.current / blastProgress.total) * 100) || 0}%`,
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Pengaturan Link Grup WA */}
        <div
          className={`mt-4 p-4 rounded-2xl border transition-all ${
            !linkGrupWa.trim()
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-300/40'
              : 'bg-[#FAF7F3] border-[#D5C4B4]'
          } grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs`}
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-[#422F21]">
                Link Grup WhatsApp Resmi Wali Santri:
              </label>
              {!linkGrupWa.trim() ? (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-300 animate-pulse">
                  ⚠️ Belum Diisi (Wajib Update)
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  ✓ Link Terisi
                </span>
              )}
            </div>
            <input
              type="text"
              value={linkGrupWa}
              onChange={(e) => setLinkGrupWa(e.target.value)}
              placeholder="Wajib selalu diisi setiap mau kirim: https://chat.whatsapp.com/..."
              className={`w-full px-3 py-2 rounded-xl border text-xs font-mono transition-all ${
                !linkGrupWa.trim()
                  ? 'border-rose-400 bg-rose-50/40 text-rose-950 focus:ring-2 focus:ring-rose-400 focus:outline-none placeholder:text-rose-400'
                  : 'border-[#D5C4B4] bg-white text-slate-900 focus:ring-2 focus:ring-[#8C6A47]/40 focus:outline-none'
              }`}
            />
          </div>
          <div className="flex items-center p-3 rounded-xl bg-white border border-[#D5C4B4]">
            <div className="text-[11px] text-[#7A624E] leading-relaxed">
              <strong className="text-[#8C6A47]">Info Fonnte DB Sync:</strong> Seluruh status WA tersimpan murni di tabel Supabase `peserta_santri`.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header Panel WhatsApp Tamu */}
      <div className="bg-[#FAF7F3] rounded-3xl p-6 shadow-sm border-2 border-[#D5C4B4]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EFE8E1] text-[#8C6A47] flex items-center justify-center font-bold border border-[#D5C4B4] shadow-sm">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-black text-[#422F21]">
                Panel WA Gateway — Tamu Undangan
              </h1>
              <p className="text-xs text-[#7A624E] font-normal">
                Terhubung 100% langsung ke tabel Supabase `tamu_undangan` (<strong>{tamuList.length} Tamu Undangan Terdaftar</strong>).
              </p>
            </div>
          </div>

          <button
            onClick={fetchTamuWaData}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF7F3] text-[#8C6A47] border border-[#D5C4B4] font-bold text-xs shadow-xs flex items-center space-x-1.5 self-start md:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loadingTamuData ? 'animate-spin' : ''}`} />
            <span>Refresh Data DB</span>
          </button>
        </div>

        {/* Fonnte Live Status Widget */}
        <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-[#FAF7F3] via-[#EFE8E1] to-[#FAF7F3] text-[#422F21] border-2 border-[#8C6A47]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shadow-sm">
              <Wifi className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-serif font-black text-[#422F21]">
                  FONNTE GATEWAY TERHUBUNG
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-400">
                  ONLINE
                </span>
              </div>
              <div className="text-xs text-[#7A624E] mt-0.5 font-medium">
                Pengirim: <strong>{fonnteStatus.name}</strong> ({fonnteStatus.device}) · Sisa Kuota API: <strong>{fonnteStatus.quota} Pesan</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isTamuBlasting ? (
              <button
                onClick={handleStartBatchBlastTamu}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8C6A47] via-[#A47E57] to-[#8C6A47] hover:brightness-105 text-white font-serif font-black text-xs shadow-md flex items-center space-x-1.5 transition-all border border-[#FAF7F3] cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Kirim WA ke Semua Tamu (Fonnte)</span>
              </button>
            ) : (
              <button
                onClick={handleStopBatchBlastTamu}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Pause className="w-4 h-4" />
                <span>Hentikan Blasting ({tamuBlastProgress.current}/{tamuBlastProgress.total})</span>
              </button>
            )}
          </div>
        </div>

        {/* Box Preview Template Pesan Tamu Undangan (Format Resmi Persis) */}
        <div className="mt-4 p-4 rounded-2xl bg-white border border-[#D5C4B4] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-[#8C6A47]" />
              <span className="font-bold text-xs text-[#422F21]">
                Preview Format Pesan WA Resmi Tamu Undangan:
              </span>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EFE8E1] text-[#8C6A47] border border-[#D5C4B4]">
              Format Resmi Haul 2027
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#FAF7F3] border border-[#D5C4B4]/70 font-mono text-[11px] text-[#422F21] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
            {getTeksPesanTamu(
              filteredTamuList[0] || tamuList[0] || {
                kode: 'UND0107',
                nama: 'KH. Abdullah Kafabihi Mahrus',
                jalurMasuk: 'Gerbang Selatan (Bola Dunia)',
              }
            )}
          </div>
        </div>

        {/* Progress Bar Blasting Tamu jika aktif */}
        {isTamuBlasting && (
          <div className="mt-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 space-y-2 text-xs text-amber-950">
            <div className="flex items-center justify-between font-bold">
              <span>Sedang Mengirim WA Undangan ke Tamu...</span>
              <span>
                {tamuBlastProgress.current} dari {tamuBlastProgress.total} tamu ({tamuBlastProgress.success} berhasil, {tamuBlastProgress.failed} gagal)
              </span>
            </div>
            <div className="w-full bg-amber-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#8C6A47] h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.round((tamuBlastProgress.current / tamuBlastProgress.total) * 100) || 0}%`,
                }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* BAR ISI MASSAL JALUR MASUK UNTUK BARIS KOSONG */}
      <div className="bg-[#FAF7F3] rounded-3xl p-4 shadow-sm border-2 border-[#D5C4B4] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4.5 h-4.5 text-[#8C6A47]" />
          <div>
            <span className="font-bold text-[#422F21]">Isi Jalur Masuk Massal untuk Baris Kosong:</span>
            <span className="text-[11px] text-amber-800 font-medium block sm:inline sm:ml-2">
              ({countJalurKosong} tamu belum memiliki jalur masuk)
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Contoh: Gerbang Selatan (Bola Dunia)"
            value={massJalurInputText}
            onChange={(e) => setMassJalurInputText(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-[#8C6A47]"
          />
          <button
            type="button"
            onClick={() => handleApplyMassJalurMasuk(massJalurInputText)}
            className="px-4 py-2 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white font-bold text-xs shadow-sm cursor-pointer whitespace-nowrap"
          >
            Terapkan ke Baris Kosong
          </button>
        </div>
      </div>
    </>
  );
}
