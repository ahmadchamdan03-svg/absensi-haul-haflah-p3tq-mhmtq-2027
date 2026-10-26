'use client';

import React from 'react';
import {
  CreditCard,
  Upload,
  Camera,
  Eye,
  Loader2,
  MessageCircle,
  Check,
  Copy,
} from 'lucide-react';
import PaymentCountdownTimer from './BeliPaymentCountdownTimer';
import { formatTanggalIndo } from './types';

interface BeliActiveOrderCardProps {
  santri: any;
  activePendingOrder: any;
  fetchAllOrders: () => void;
  copiedRekening: boolean;
  onCopyRekening: () => void;
  isChangingProof: boolean;
  setIsChangingProof: (v: boolean) => void;
  selectedFile: File | null;
  setSelectedFile: (f: File | null) => void;
  selectedImage: string | null;
  setSelectedImage: (v: string | null) => void;
  selectedFileName: string;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setShowFullImageModal: (v: boolean) => void;
  onUploadProof: () => void;
  isUploadingProof: boolean;
}

export default function BeliActiveOrderCard({
  santri,
  activePendingOrder,
  fetchAllOrders,
  copiedRekening,
  onCopyRekening,
  isChangingProof,
  setIsChangingProof,
  selectedFile,
  setSelectedFile,
  selectedImage,
  setSelectedImage,
  selectedFileName,
  fileInputRef,
  onFileChange,
  setShowFullImageModal,
  onUploadProof,
  isUploadingProof,
}: BeliActiveOrderCardProps) {
  return (
    /* ===================================================================== */
    /* SKENARIO B: PESANAN AKTIF PENDING (TRANSFER & BUKTI / GANTI BUKTI)    */
    /* ===================================================================== */
    <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#8C6A47] shadow-xl space-y-6">
      {/* Header Status Pesanan Aktif */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <div>
          <span className="text-[10px] text-stone-500 font-bold uppercase block">ID PESANAN AKTIF:</span>
          <h3 className="font-serif font-black text-xl text-[#322116]">{activePendingOrder.id_pesanan}</h3>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-stone-500 font-bold uppercase block">STATUS PESANAN:</span>
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase border ${
              activePendingOrder.status === 'MENUNGGU_VERIFIKASI'
                ? 'bg-sky-100 text-sky-900 border-sky-300'
                : 'bg-amber-100 text-amber-900 border-amber-300'
            }`}
          >
            {activePendingOrder.status === 'MENUNGGU_VERIFIKASI'
              ? '⏳ Menunggu Verifikasi'
              : '💳 Menunggu Pembayaran'}
          </span>
        </div>
      </div>

      {/* TIMER COUNTDOWN 6 JAM (TERISOLASI) */}
      {activePendingOrder.status === 'MENUNGGU_PEMBAYARAN' && activePendingOrder.locked_until && (
        <PaymentCountdownTimer lockedUntil={activePendingOrder.locked_until} onExpire={fetchAllOrders} />
      )}

      {/* DETAIL ALOKASI & TOTAL HARGA */}
      <div className="p-4 rounded-2xl bg-[#FAF7F3] border border-[#D5C4B4] space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-stone-600">Jumlah Kursi Tambahan:</span>
          <strong className="text-[#422F21]">{activePendingOrder.jumlah_kursi} Kursi</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-stone-600">Harga per Kursi:</span>
          <span>Rp 75.000</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-[#D5C4B4] text-sm font-bold text-[#422F21]">
          <span>Total Wajib Transfer:</span>
          <span className="text-emerald-700 font-black text-base">
            Rp {Number(activePendingOrder.total_bayar).toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* INFO REKENING PEMBAYARAN BRI */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#FAF0E6] to-[#FAF7F3] border-2 border-[#D5C4B4] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A47] flex items-center space-x-1.5">
            <CreditCard className="w-4 h-4 text-[#8C6A47]" />
            <span>REKENING RESMI PANITIA (BRI)</span>
          </span>
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
            Bank BRI
          </span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-[#D5C4B4] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-stone-500 uppercase font-bold">Nomor Rekening:</div>
            <div className="font-mono font-black text-lg text-[#322116] tracking-wider">
              320701010266508
            </div>
            <div className="text-[11px] font-semibold text-[#8C6A47]">
              a.n. Ahmad Chamdan Yuwafin
            </div>
          </div>
          <button
            type="button"
            onClick={onCopyRekening}
            className="px-3 py-2 rounded-xl bg-[#FAF7F3] hover:bg-[#EFE8E1] text-[#5C3E28] text-xs font-bold border border-[#D5C4B4] flex items-center space-x-1 transition-colors cursor-pointer"
          >
            {copiedRekening ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#8C6A47]" />
                <span>Salin</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* FORM UPLOAD / GANTI BUKTI TRANSFER (FITUR B) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-[#422F21]">
            Foto Bukti Transfer Pembayaran:
          </label>
          {activePendingOrder.status === 'MENUNGGU_VERIFIKASI' && !isChangingProof && (
            <button
              type="button"
              onClick={() => {
                setIsChangingProof(true);
                setSelectedFile(null);
                setSelectedImage(null);
              }}
              className="text-[11px] font-bold text-[#8C6A47] hover:underline inline-flex items-center space-x-1"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Ganti Bukti Transfer</span>
            </button>
          )}
        </div>

        {/* INPUT FILE HIDDEN */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="hidden"
        />

        {/* AREA PREVIEW / DROPZONE */}
        {(selectedImage || (activePendingOrder.bukti_url && !isChangingProof)) ? (
          <div className="space-y-2">
            <div className="relative rounded-2xl overflow-hidden border-2 border-[#8C6A47] bg-stone-900 group">
              <img
                src={selectedImage || activePendingOrder.bukti_url}
                alt="Bukti Transfer"
                className="w-full max-h-64 object-contain mx-auto"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
                <button
                  type="button"
                  onClick={() => setShowFullImageModal(true)}
                  className="px-3 py-2 rounded-xl bg-white/90 text-stone-900 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Lihat Foto</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingProof(true);
                    fileInputRef.current?.click();
                  }}
                  className="px-3 py-2 rounded-xl bg-[#8C6A47] text-white text-xs font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Ganti Foto</span>
                </button>
              </div>
            </div>

            {/* SUBTEKS WAKTU UPLOAD TERBARU (FITUR B) */}
            <div className="text-[11px] text-stone-500 text-center font-medium">
              Bukti terakhir diperbarui:{' '}
              <strong className="text-[#422F21]">
                {formatTanggalIndo(activePendingOrder.uploaded_at || activePendingOrder.created_at)}
              </strong>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-8 px-4 rounded-2xl border-2 border-dashed border-[#D5C4B4] hover:border-[#8C6A47] bg-[#FAF7F3] hover:bg-white text-center space-y-2 transition-colors cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#8C6A47] flex items-center justify-center mx-auto border border-[#D5C4B4] group-hover:scale-105 transition-transform">
              <Camera className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-[#422F21]">
              Klik untuk Ambil Foto / Pilih Gambar Bukti Transfer
            </div>
            <p className="text-[10px] text-stone-500">Format JPG, PNG, WebP (Maksimal 10MB)</p>
          </button>
        )}

        {selectedFileName && (
          <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex items-center justify-between">
            <span className="truncate">File terpilih: {selectedFileName}</span>
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
        )}

        {/* TOMBOL UNGGAH / PERBARUI BUKTI */}
        {(activePendingOrder.status === 'MENUNGGU_PEMBAYARAN' || isChangingProof || selectedFile) && (
          <button
            type="button"
            onClick={onUploadProof}
            disabled={isUploadingProof || (!selectedFile && !selectedImage)}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-800 hover:brightness-105 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            {isUploadingProof ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin text-emerald-200" />
                <span>Mengunggah Bukti Pembayaran...</span>
              </>
            ) : (
              <>
                <Upload className="w-4.5 h-4.5 text-emerald-200" />
                <span>
                  {activePendingOrder.status === 'MENUNGGU_VERIFIKASI'
                    ? 'Perbarui Foto Bukti Transfer'
                    : 'Unggah Bukti Pembayaran'}
                </span>
              </>
            )}
          </button>
        )}

        {/* TOMBOL HUBUNGI PANITIA (WHATSAPP) */}
        {activePendingOrder.status === 'MENUNGGU_VERIFIKASI' && (
          <div className="pt-2 space-y-2">
            <a
              href={`https://wa.me/6285181805377?text=Assalamu%27alaikum%20Us...%2C%20saya%20wali%20dari%20${encodeURIComponent(
                santri.nama
              )}%20(ID%20Pesanan%3A%20${activePendingOrder.id_pesanan})%20sudah%20mengunggah%20bukti%20transfer%20sebesar%20Rp%20${activePendingOrder.total_bayar.toLocaleString(
                'id-ID'
              )}%2C%20mohon%20segera%20dikonfirmasi.%20Terima%20kasih.`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-800 hover:brightness-105 text-white font-bold text-sm shadow-md flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <MessageCircle className="w-4.5 h-4.5 text-emerald-200 shrink-0" />
              <span className="truncate">Hubungi Panitia via WhatsApp</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
