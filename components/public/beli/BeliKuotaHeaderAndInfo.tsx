'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import NamaLembaga from '@/components/NamaLembaga';
import { BeliStatusMsg } from './types';

interface BeliKuotaHeaderAndInfoProps {
  santri: any;
  isRefreshing: boolean;
  onRefreshAll: () => void;
  totalVerifiedExtraSeats: number;
  totalVerifiedTxCount: number;
  totalKuotaAkhir: number;
  kuotaDasar: number;
  statusMsg: BeliStatusMsg | null;
  activePendingOrder: any | undefined;
}

export default function BeliKuotaHeaderAndInfo({
  santri,
  isRefreshing,
  onRefreshAll,
  totalVerifiedExtraSeats,
  totalVerifiedTxCount,
  totalKuotaAkhir,
  kuotaDasar,
  statusMsg,
  activePendingOrder,
}: BeliKuotaHeaderAndInfoProps) {
  return (
    <>
      {/* TOMBOL KEMBALI KE UNDANGAN & REFRESH */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/u/${santri.kode}`}
          className="inline-flex items-center space-x-2 text-xs font-bold text-[#8C6A47] hover:text-[#5C3E28] bg-white px-3.5 py-2 rounded-2xl border border-[#D5C4B4] shadow-xs transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Undangan Digital</span>
        </Link>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onRefreshAll}
            disabled={isRefreshing}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#8C6A47] hover:text-[#5C3E28] bg-white px-3 py-2 rounded-2xl border border-[#D5C4B4] shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Perbarui Data Kuota"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Perbarui</span>
          </button>
          <span className="text-xs font-mono font-bold text-stone-400">Kode: {santri.kode}</span>
        </div>
      </div>

      {/* HEADER KARTU LEMBAGA */}
      <div className="bg-white rounded-3xl p-6 border-2 border-[#D5C4B4] shadow-md text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <img src="/images/logo-p3tq.png" alt="Logo P3TQ" className="h-10 object-contain" />
          <img src="/logo-haul-haflah-transparent.png" alt="Logo Haul & Haflah" className="h-12 object-contain" />
          <img src="/images/logo-mhmtq.png" alt="Logo MHMTQ" className="h-10 object-contain" />
        </div>
        <NamaLembaga align="center" size="xs" weight="bold" color="text-[#422F21]" />
        <div className="inline-block px-3 py-1 rounded-full bg-[#FAF0E6] text-[#8C6A47] text-[11px] font-bold border border-[#D5C4B4]">
          Pembelian Kuota Tambahan Kursi Wali
        </div>
      </div>

      {/* KARTU PROFIL SANTRI & WALI */}
      <div className="bg-white rounded-3xl p-6 border-2 border-[#E8DFD5] shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <span className="text-[10px] text-[#8C6A47] font-bold uppercase tracking-wider whitespace-nowrap block">
              SHOHIBUL HAJAT (SANTRI):
            </span>
            <h2 className="font-serif font-black text-lg text-[#322116]">{santri.nama}</h2>
          </div>
          <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold shrink-0">
            {santri.sub_kategori || santri.kategori_utama || 'Santri'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5]">
            <span className="text-stone-500 text-[10px] uppercase font-bold block">Nama Wali:</span>
            <p className="font-bold text-[#422F21] truncate">{santri.nama_wali || santri.nama}</p>
          </div>
          <div className="p-2.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5]">
            <span className="text-stone-500 text-[10px] uppercase font-bold block">Kelas / Kamar:</span>
            <p className="font-bold text-[#422F21] truncate">
              {santri.kelas || '-'} / Kamar {santri.kamar || '-'}
            </p>
          </div>
        </div>
      </div>

      {/* FITUR A: BANNER RINGKASAN KUOTA TAMBAHAN SANTRI */}
      <div className="bg-emerald-50 rounded-3xl p-5 border-2 border-emerald-200 shadow-xs space-y-2 text-xs">
        <div className="flex items-center space-x-2 text-emerald-900 font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Informasi Kuota Santri Saat Ini</span>
        </div>
        <p className="text-emerald-950 font-medium leading-relaxed">
          Anda telah memiliki{' '}
          <strong className="font-serif font-black text-sm text-emerald-800">
            {totalVerifiedExtraSeats} kursi tambahan
          </strong>{' '}
          (dari {totalVerifiedTxCount} transaksi terverifikasi).
        </p>
        <div className="p-3 bg-white/80 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs">
          <span className="text-stone-600 font-semibold">Total Kuota Akhir Anda:</span>
          <span className="font-serif font-black text-base text-emerald-800">
            {totalKuotaAkhir} Kursi ({kuotaDasar} dasar + {totalVerifiedExtraSeats} tambahan)
          </span>
        </div>
      </div>

      {/* NOTIFIKASI STATUS OPERASI */}
      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold border flex items-center space-x-2.5 animate-in fade-in ${
            statusMsg.tipe === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}
        >
          {statusMsg.tipe === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* FITUR A BLOKIR: Peringatan Jika Masih Ada Pesanan Pending */}
      {activePendingOrder && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs font-bold flex items-start space-x-2.5">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span>Pesanan Anda Masih Dalam Proses</span>
            <p className="text-[11px] font-normal text-amber-900 leading-relaxed">
              Anda masih memiliki pesanan yang sedang diproses (ID Pesanan:{' '}
              <strong>{activePendingOrder.id_pesanan}</strong>). Selesaikan dulu atau tunggu hasil verifikasi panitia
              sebelum melakukan pembelian baru.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
