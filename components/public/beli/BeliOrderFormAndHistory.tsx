'use client';

import React from 'react';
import {
  ShoppingBag,
  AlertCircle,
  Info,
  X,
  Loader2,
  Plus,
  Minus,
  History,
} from 'lucide-react';
import { formatTanggalIndo } from './types';

/* ===================================================================== */
/* SKENARIO A: FITUR DITUTUP PANITIA / KUOTA HABIS                       */
/* ===================================================================== */
export function BeliClosedNotice() {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-300 shadow-md text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-600 border border-stone-300 flex items-center justify-center mx-auto">
        <Info className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="font-serif font-black text-base text-[#422F21]">
          Pembelian Kuota Tambahan Sedang Ditutup
        </h3>
        <p className="text-xs text-stone-600 leading-relaxed">
          Panitia belum membuka atau sedang menutup akses pembelian kuota tambahan kursi saat ini. Silakan berkonsultasi dengan panitia atau menunggu info resmi berikutnya.
        </p>
      </div>
    </div>
  );
}

export function BeliPaguHabisNotice() {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-300 shadow-md text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-300 flex items-center justify-center mx-auto">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="font-serif font-black text-base text-amber-950">
          Kuota Tambahan Pagu Nasional Sudah Habis
        </h3>
        <p className="text-xs text-amber-900 leading-relaxed">
          Pembelian kuota tambahan tersedia selama masa pemesanan aktif dan kuota masih tersedia.
        </p>
      </div>
    </div>
  );
}

/* ===================================================================== */
/* SKENARIO C: FORM INPUT PEMBELIAN KUOTA BARU (FITUR A)                 */
/* ===================================================================== */
interface BeliOrderFormProps {
  jumlahBeli: number;
  setJumlahBeli: (v: number) => void;
  sisaPaguGlobal: number;
  isSubmittingOrder: boolean;
  onKunciPesanan: () => void;
}

export function BeliOrderForm({
  jumlahBeli,
  setJumlahBeli,
  sisaPaguGlobal,
  isSubmittingOrder,
  onKunciPesanan,
}: BeliOrderFormProps) {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#E8DFD5] shadow-sm space-y-6">
      <div className="space-y-1">
        <h3 className="font-serif font-black text-lg text-[#422F21]">
          Formulir Pemesanan Kuota Kursi Tambahan
        </h3>
        <p className="text-xs text-stone-600">
          Pembelian kuota tambahan tersedia selama masa pemesanan aktif dan kuota masih tersedia.
        </p>
      </div>

      {/* STEPPER INPUT JUMLAH KURSI */}
      <div className="p-4 rounded-2xl bg-[#FAF7F3] border border-[#D5C4B4] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-[#422F21]">Jumlah Kuota Tambahan:</div>
            <div className="text-[10px] text-stone-500">Harga Rp 75.000 / kursi</div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setJumlahBeli(Math.max(1, jumlahBeli - 1))}
              disabled={jumlahBeli <= 1}
              className="w-10 h-10 rounded-xl bg-white border border-[#D5C4B4] text-[#422F21] font-black text-base flex items-center justify-center hover:bg-stone-100 disabled:opacity-40 cursor-pointer active:scale-95"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-mono font-black text-xl w-6 text-center text-[#422F21]">
              {jumlahBeli}
            </span>
            <button
              type="button"
              onClick={() => setJumlahBeli(Math.min(sisaPaguGlobal, jumlahBeli + 1))}
              disabled={jumlahBeli >= sisaPaguGlobal}
              className="w-10 h-10 rounded-xl bg-[#8C6A47] text-white font-black text-base flex items-center justify-center hover:bg-[#735334] disabled:opacity-40 cursor-pointer active:scale-95 shadow-xs"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Rincian Total Tagihan */}
        <div className="pt-3 border-t border-[#D5C4B4] flex items-center justify-between text-xs">
          <span className="text-stone-600 font-semibold">Total Pembayaran:</span>
          <span className="font-serif font-black text-lg text-emerald-700">
            Rp {(jumlahBeli * 75000).toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* TOMBOL KUNCI PESANAN */}
      <button
        type="button"
        onClick={onKunciPesanan}
        disabled={isSubmittingOrder || sisaPaguGlobal <= 0}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#8C6A47] via-[#A47E57] to-[#8C6A47] hover:brightness-105 disabled:opacity-50 text-white font-serif font-black text-xs sm:text-sm tracking-wide shadow-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center space-x-2 border border-amber-200/40"
      >
        {isSubmittingOrder ? (
          <>
            <Loader2 className="w-4.5 h-4.5 animate-spin text-amber-200" />
            <span>Mengunci Pesanan di Database...</span>
          </>
        ) : (
          <>
            <ShoppingBag className="w-4.5 h-4.5 text-amber-200" />
            <span>Kunci Pesanan &amp; Lanjut Bayar</span>
          </>
        )}
      </button>
    </div>
  );
}

/* FITUR A: RIWAYAT SEMUA PEMBELIAN KUOTA SANTRI (Hanya DIVERIFIKASI / DITERIMA) */
export function BeliVerifiedHistory({ verifiedOrders }: { verifiedOrders: any[] }) {
  if (verifiedOrders.length === 0) return null;
  return (
    <div className="bg-white rounded-3xl p-6 border-2 border-[#E8DFD5] shadow-xs space-y-4">
      <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
        <History className="w-4 h-4 text-[#8C6A47]" />
        <h3 className="font-serif font-bold text-sm text-[#422F21]">
          Riwayat Transaksi Kuota Tambahan Disetujui ({verifiedOrders.length})
        </h3>
      </div>

      <div className="space-y-2.5">
        {verifiedOrders.map((order) => {
          return (
            <div
              key={order.id_pesanan || order.id}
              className="p-3.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] flex items-center justify-between text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-[#322116]">
                    {order.id_pesanan || order.id}
                  </span>
                  <span className="text-stone-400">•</span>
                  <span className="font-semibold text-stone-700">
                    +{order.jumlah_kursi} Kursi
                  </span>
                </div>
                <div className="text-[10px] text-stone-500">
                  {formatTanggalIndo(order.created_at)}
                </div>
              </div>

              <div className="text-right space-y-1">
                <div className="font-bold text-[#422F21]">
                  Rp {Number(order.total_bayar || 0).toLocaleString('id-ID')}
                </div>
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  Terverifikasi
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* FOOTER INFORMASI BANTUAN */
export function BeliFooter() {
  return (
    <div className="text-center text-[11px] text-stone-500 space-y-1 pt-4">
      <p className="font-serif font-bold text-[#422F21]">
        Pondok Pesantren Putri Tahfizhil Qur-an &amp; MHMTQ Lirboyo
      </p>
      <p>Jika membutuhkan bantuan, silakan hubungi Panitia di 0857-9063-3812</p>
    </div>
  );
}

/* MODAL FULL PREVIEW IMAGE */
export function BeliFullImageModal({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div className="relative max-w-3xl w-full bg-stone-900 rounded-3xl p-3 border border-stone-700 overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <img
          src={src}
          alt="Bukti Transfer Full"
          className="w-full max-h-[85vh] object-contain rounded-2xl mx-auto"
        />
      </div>
    </div>
  );
}
