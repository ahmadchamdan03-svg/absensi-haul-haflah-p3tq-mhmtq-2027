'use client';

import React from 'react';
import {
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  X,
  AlertTriangle,
} from 'lucide-react';
import { getWarnaTiketSantri, getWarnaTiketUndangan } from '@/lib/types';
import { GolonganUndangan } from './TamuModal';

export interface PesertaHeaderProps {
  toastMessage: string | null;
  setShowAddModal: (show: boolean) => void;
  handleOpenAddUndangan: (gol: GolonganUndangan) => void;
}

export default function PesertaHeader({
  toastMessage,
  setShowAddModal,
  handleOpenAddUndangan,
}: PesertaHeaderProps) {
  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#8C6A47] text-white px-5 py-3.5 rounded-2xl shadow-2xl border-2 border-[#D49B5B] flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Halaman: Warm Latte & Cinnamon Mocha Aesthetic */}
      <div className="max-w-7xl mx-auto bg-gradient-to-r from-[#FAF7F3] via-[#EFE8E1] to-[#FAF7F3] text-[#422F21] rounded-3xl p-6 sm:p-8 shadow-sm border-2 border-[#8C6A47]/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-8 opacity-10 pointer-events-none">
          <img
            src="/images/logo-haul-gold.png"
            alt="Kaligrafi Haul Haflah"
            className="w-96 object-contain"
          />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-white border-2 border-[#8C6A47] flex items-center justify-center text-[#8C6A47] shadow-sm">
                <Users className="w-6 h-6 text-[#8C6A47]" />
              </div>
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FAF7F3] text-[#8C6A47] border border-[#D49B5B]">
                  <Sparkles className="w-3 h-3 mr-1 text-[#D49B5B]" />
                  DATABASE RESMI SANTRI &amp; TAMU
                </span>
                <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#422F21] tracking-wide">
                  Daftar Peserta Tiap Kategori
                </h1>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-[#7A624E] font-normal max-w-2xl">
              Pembagian 3 kategori utama: <strong>Bil Ghoib</strong>,{' '}
              <strong>Bin Nadzori</strong>, dan <strong>Tamatan</strong> (Bagian A.01–A.04 &amp; B.01–B.03), serta Tamu Undangan VIP.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#8C6A47] to-[#735334] hover:brightness-105 text-white font-serif font-bold text-xs shadow-md border border-[#5C3E28] flex items-center space-x-1.5 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Tambah Santri</span>
            </button>

            <button
              onClick={() => handleOpenAddUndangan('ISTIMEWA')}
              className="px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#422F21] font-serif font-bold text-xs border-2 border-[#D49B5B] shadow-sm flex items-center space-x-1.5 transition-all"
              title="Tambah Tamu Undangan (Istimewa, Kehormatan, atau Umum)"
            >
              <Plus className="w-4 h-4 text-[#8C6A47] stroke-[3]" />
              <span>Tambah Undangan</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export interface PesertaUtilityModalsProps {
  deletingItem: any | null;
  setDeletingItem: (item: any | null) => void;
  handleConfirmDelete: () => Promise<void>;
  showClearModal: boolean;
  setShowClearModal: (show: boolean) => void;
  clearScope: 'SANTRI' | 'UNDANGAN' | 'SEMUA';
  setClearScope: (scope: 'SANTRI' | 'UNDANGAN' | 'SEMUA') => void;
  handleConfirmHapusSemua: () => void;
  stats: any;
  qrDetailItem: any | null;
  setQrDetailItem: (item: any | null) => void;
  qrDataUrl: string;
  showToast: (msg: string) => void;
}

export function PesertaUtilityModals({
  deletingItem,
  setDeletingItem,
  handleConfirmDelete,
  showClearModal,
  setShowClearModal,
  clearScope,
  setClearScope,
  handleConfirmHapusSemua,
  stats,
  qrDetailItem,
  setQrDetailItem,
  qrDataUrl,
  showToast,
}: PesertaUtilityModalsProps) {
  return (
    <>
      {/* MODAL 4: KONFIRMASI HAPUS PESERTA */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-2 border-rose-500 overflow-hidden">
            <div className="bg-rose-50 p-5 border-b border-rose-200 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-serif font-black text-slate-900 text-sm">
                  Konfirmasi Hapus Peserta
                </h3>
                <p className="text-[11px] text-rose-700">
                  Tindakan ini akan mengurangi daftar peserta
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus peserta berikut dari daftar Haul &amp; Haflah?
              </p>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-mono font-bold text-opera-900">{deletingItem.kode}</div>
                <div className="font-bold text-slate-900 text-sm">{deletingItem.nama}</div>
                <div className="text-slate-500 text-[11px]">
                  Kategori: {deletingItem.kategoriUtama}{' '}
                  {deletingItem.bagianTamatan && `· Bagian ${deletingItem.bagianTamatan}`} · Wali:{' '}
                  {deletingItem.namaWali}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingItem(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow"
                >
                  Hapus Permanen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI HAPUS SEMUA PESERTA */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border-2 border-rose-500 overflow-hidden">
            <div className="bg-rose-50 p-4 sm:p-5 border-b border-rose-200 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-serif font-black text-slate-900 text-sm sm:text-base">
                  Hapus / Kosongkan Data
                </h3>
                <p className="text-[11px] text-rose-700">Pilih lingkup data yang ingin dihapus</p>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Tindakan ini akan menghapus peserta dari basis data. Pilih opsi penghapusan:
              </p>

              <div className="space-y-2">
                <label
                  onClick={() => setClearScope('SANTRI')}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    clearScope === 'SANTRI'
                      ? 'border-rose-500 bg-rose-50/70 ring-2 ring-rose-400/30'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-900">Hapus Semua Santri Peserta Saja</div>
                    <div className="text-[11px] text-slate-500">
                      Menghapus {stats.totalSantri} santri (Bil Ghoib, Bin Nadzor, Tamatan). 70 Tamu Undangan tetap disimpan.
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="clearScope"
                    checked={clearScope === 'SANTRI'}
                    onChange={() => setClearScope('SANTRI')}
                    className="accent-rose-600 w-4 h-4 ml-2"
                  />
                </label>

                <label
                  onClick={() => setClearScope('UNDANGAN')}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    clearScope === 'UNDANGAN'
                      ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-400/30'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-900">Hapus Semua Tamu Undangan Saja</div>
                    <div className="text-[11px] text-slate-500">
                      Menghapus {stats.undanganCount} tamu undangan (Istimewa, Kehormatan, Umum). Data santri tetap disimpan.
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="clearScope"
                    checked={clearScope === 'UNDANGAN'}
                    onChange={() => setClearScope('UNDANGAN')}
                    className="accent-amber-600 w-4 h-4 ml-2"
                  />
                </label>

                <label
                  onClick={() => setClearScope('SEMUA')}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    clearScope === 'SEMUA'
                      ? 'border-rose-600 bg-rose-100/70 ring-2 ring-rose-500/30'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-bold text-rose-900">Hapus Seluruh Data (Kosong Total)</div>
                    <div className="text-[11px] text-rose-700">
                      Menghapus seluruh {stats.totalSemua} data (Santri + Tamu Undangan).
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="clearScope"
                    checked={clearScope === 'SEMUA'}
                    onChange={() => setClearScope('SEMUA')}
                    className="accent-rose-600 w-4 h-4 ml-2"
                  />
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmHapusSemua}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow"
                >
                  Ya, Hapus Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: DETAIL QR CODE & KARTU SANTRI */}
      {qrDetailItem && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setQrDetailItem(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md sm:max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border-2 border-opera-800 overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-opera-950 via-opera-900 to-opera-950 text-white p-4 sm:p-5 text-center border-b border-gold-500/40 relative shrink-0 pr-12">
              <button
                onClick={() => setQrDetailItem(null)}
                className="absolute right-3 top-3 sm:right-4 sm:top-4 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="text-[10px] sm:text-[11px] font-serif text-gold-400 tracking-widest uppercase">
                HAUL &amp; HAFLAH 1448 H / 2027 M
              </div>
              <h3 className="font-serif font-black text-sm sm:text-base text-white mt-0.5">
                KARTU PESERTA RESMI
              </h3>
              <div className="text-[10px] sm:text-[11px] text-opera-200">
                P3TQ — MHMTQ PP. Lirboyo Kediri
              </div>
            </div>

            <div className="p-4 sm:p-6 text-center space-y-4 overflow-y-auto flex-1">
              <div className="p-3 bg-white border-2 border-dashed border-opera-300 rounded-2xl inline-block shadow-sm">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code ${qrDetailItem.kode}`}
                    className="w-48 h-48 mx-auto"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-slate-400 font-mono text-xs">
                    Membuat QR...
                  </div>
                )}
                <div className="font-mono font-bold text-sm text-slate-800 mt-2">
                  {qrDetailItem.kode}
                </div>
              </div>

              <div className="text-xs space-y-1">
                <div className="font-serif font-black text-base text-slate-900">
                  {qrDetailItem.nama}
                </div>
                <div className="text-slate-600 font-medium">
                  {qrDetailItem.kategoriUtama === 'BIL_GHOIB'
                    ? 'Bil Ghoib'
                    : qrDetailItem.kategoriUtama === 'BIN_NADZOR'
                    ? 'Bin Nadzori'
                    : qrDetailItem.kategoriUtama === 'TAMATAN'
                    ? `Tamatan (Bagian ${qrDetailItem.bagianTamatan})`
                    : qrDetailItem.golonganUndangan === 'ISTIMEWA'
                    ? `Undangan Istimewa · ${qrDetailItem.kategori}`
                    : qrDetailItem.golonganUndangan === 'KEHORMATAN'
                    ? 'Tamu Undangan Kehormatan'
                    : `Undangan Umum · ${qrDetailItem.kategori}`}
                  {qrDetailItem.kamar !== '-' && ` · Kamar ${qrDetailItem.kamar}`}
                </div>
                <div className="text-slate-500 text-[11px]">
                  {qrDetailItem.tipe === 'UNDANGAN' ? (
                    qrDetailItem.golonganUndangan === 'ISTIMEWA' ? (
                      <span className="text-amber-900 font-semibold">
                        📍 Alamat: {qrDetailItem.alamat || qrDetailItem.instansi || 'Kediri'}
                      </span>
                    ) : qrDetailItem.golonganUndangan === 'KEHORMATAN' ? (
                      <span className="text-purple-900 font-semibold">
                        📍 Alamat: {qrDetailItem.alamat || qrDetailItem.instansi || 'Kediri'}
                      </span>
                    ) : (
                      <span>
                        🏛️ Instansi: {qrDetailItem.instansi || 'Pondok Pesantren Lirboyo'}
                        {qrDetailItem.alamat &&
                          qrDetailItem.alamat !== '-' &&
                          qrDetailItem.alamat !== qrDetailItem.instansi &&
                          ` · 📍 ${qrDetailItem.alamat}`}
                      </span>
                    )
                  ) : (
                    <span>
                      Wali: {qrDetailItem.namaWali} ({qrDetailItem.alamat})
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-opera-50 border border-opera-200 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-slate-500 text-[10px]">TOTAL KUOTA</div>
                  <div className="font-serif font-black text-slate-800 text-lg">
                    {qrDetailItem.kuotaDasar + qrDetailItem.kuotaTambahan} Kursi
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">STATUS TIKET</div>
                  <div className="font-serif font-black text-opera-800 text-base">
                    {qrDetailItem.tipe === 'UNDANGAN'
                      ? qrDetailItem.warnaTiket ||
                        getWarnaTiketUndangan(
                          qrDetailItem.golonganUndangan,
                          qrDetailItem.kategori
                        ) ||
                        (qrDetailItem.golonganUndangan === 'ISTIMEWA'
                          ? 'Hitam Gold'
                          : 'Merah Gold')
                      : getWarnaTiketSantri(
                          qrDetailItem.kategoriUtama,
                          qrDetailItem.subKategori
                        )}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <a
                  href={`/u/${qrDetailItem.kode}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 rounded-xl bg-opera-850 hover:bg-opera-900 text-gold-300 font-serif font-bold text-xs shadow border border-gold-500/40 flex items-center justify-center space-x-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>
                    {qrDetailItem.tipe === 'UNDANGAN'
                      ? 'Buka Portal Undangan'
                      : 'Buka Portal Wali'}
                  </span>
                </a>
                <button
                  onClick={() => {
                    const liveDomain =
                      process.env.NEXT_PUBLIC_BASE_URL ||
                      process.env.NEXT_PUBLIC_APP_URL ||
                      'https://haflahp3tq.site';
                    const origin =
                      typeof window !== 'undefined' &&
                      !window.location.hostname.includes('localhost') &&
                      !window.location.hostname.includes('127.0.0.1')
                        ? window.location.origin
                        : liveDomain;
                    navigator.clipboard.writeText(`${origin}/u/${qrDetailItem.kode}`);
                    showToast(
                      `✓ Link portal ${
                        qrDetailItem.tipe === 'UNDANGAN' ? 'undangan' : 'wali'
                      } berhasil disalin!`
                    );
                  }}
                  className="px-3 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Salin Link
                </button>
              </div>

              {qrDetailItem.tipe === 'UNDANGAN' && (
                <button
                  onClick={() => {
                    const liveDomain =
                      process.env.NEXT_PUBLIC_BASE_URL ||
                      process.env.NEXT_PUBLIC_APP_URL ||
                      'https://haflahp3tq.site';
                    const origin =
                      typeof window !== 'undefined' &&
                      !window.location.hostname.includes('localhost') &&
                      !window.location.hostname.includes('127.0.0.1')
                        ? window.location.origin
                        : liveDomain;
                    const link = `${origin}/u/${qrDetailItem.kode}`;
                    const waText = `Assalamu'alaikum Wr. Wb.

Yth. *${qrDetailItem.nama}* (${qrDetailItem.instansi || qrDetailItem.kategori || 'Tamu Undangan'})

Pondok Pesantren Putri Tahfizhil Qur'an (P3TQ) & MHMTQ Lirboyo Kediri mengharapkan kehadiran Bapak/Ibu/Saudara/i dalam acara *Haul & Haflah Akhirussanah 1448 H / 2027 M*.

📋 *Detail Undangan:*
• Jatah Kuota: *${qrDetailItem.kuotaDasar + qrDetailItem.kuotaTambahan} Kursi VIP*
• Tautan Undangan & QR Code Digital:
${link}

Mohon tunjukkan QR Code pada tautan di atas kepada petugas saat tiba di gerbang lokasi acara.

Wassalamu'alaikum Wr. Wb.
Pemerhati Haul & Haflah P3TQ - MHMTQ Lirboyo Kediri`;

                    navigator.clipboard.writeText(waText);
                    showToast(`✓ Pesan WA santun untuk ${qrDetailItem.nama} berhasil disalin!`);
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer mt-2"
                >
                  <span>📋 Salin Template Chat WA Santun</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
