'use client';

import React from 'react';
import {
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Search,
  MessageSquare,
  Phone,
  Clock,
  Banknote,
  Eye,
  Loader2,
} from 'lucide-react';

export function VerifikasiHeaderAndStats({
  setShowAddManualModal,
  paguTerjual,
  sisaPagu,
  countMenungguVerifikasi,
  countMenungguPembayaran,
  errorMessage,
  fetchData,
  statusMsg,
  setStatusMsg,
}: {
  setShowAddManualModal: (val: boolean) => void;
  paguTerjual: number;
  sisaPagu: number;
  countMenungguVerifikasi: number;
  countMenungguPembayaran: number;
  errorMessage: string | null;
  fetchData: () => void;
  statusMsg: { tipe: 'success' | 'error'; text: string } | null;
  setStatusMsg: (val: { tipe: 'success' | 'error'; text: string } | null) => void;
}) {
  return (
    <>
      {/* HEADER LOGO & JUDUL HALAMAN */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white rounded-3xl p-6 border-2 border-[#D5C4B4] shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#8C6A47] uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#8C6A47]" />
            <span>Panel Verifikasi Panitia</span>
          </div>
          <h1 className="font-serif font-black text-2xl text-[#322116]">
            Verifikasi Mutasi &amp; Kuota Tambahan
          </h1>
          <p className="text-xs text-stone-600">
            Kelola verifikasi pembayaran bukti transfer, entri manual kasir, dan alokasi pagu kuota tambahan kursi.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddManualModal(true)}
          className="py-3 px-5 rounded-2xl bg-gradient-to-r from-[#8C6A47] to-[#A47E57] hover:brightness-105 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2 cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 text-amber-200" />
          <span>Tambah Transaksi Manual (Kasir)</span>
        </button>
      </div>

      {/* RINGKASAN STATISTIK PAGU KUOTA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border-2 border-[#E8DFD5] shadow-xs space-y-2">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">
            PAGU TERJUAL (DIVERIFIKASI)
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="font-serif font-black text-3xl text-emerald-700">{paguTerjual}</span>
            <span className="text-xs text-stone-500 font-bold">/ 300 unit</span>
          </div>
          <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden border border-stone-200">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (paguTerjual / 300) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border-2 border-[#E8DFD5] shadow-xs space-y-2">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">
            SISA TERSEDIA
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="font-serif font-black text-3xl text-[#422F21]">{sisaPagu}</span>
            <span className="text-xs text-stone-500 font-bold">unit pagu</span>
          </div>
          <p className="text-[11px] text-stone-500 font-medium">Kapasitas maksimal 300 kursi</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border-2 border-[#E8DFD5] shadow-xs space-y-2">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">
            MENUNGGU VERIFIKASI
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="font-serif font-black text-3xl text-sky-700">
              {countMenungguVerifikasi}
            </span>
            <span className="text-xs text-stone-500 font-bold">pesanan</span>
          </div>
          <p className="text-[11px] text-stone-500 font-medium">Bukti transfer sudah diunggah</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border-2 border-[#E8DFD5] shadow-xs space-y-2">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">
            MENUNGGU PEMBAYARAN
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="font-serif font-black text-3xl text-amber-700">
              {countMenungguPembayaran}
            </span>
            <span className="text-xs text-stone-500 font-bold">pesanan</span>
          </div>
          <p className="text-[11px] text-stone-500 font-medium">Terkunci (Batas waktu 6 jam)</p>
        </div>
      </div>

      {/* ERROR MESSAGE NOTIFICATION BANNER */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={fetchData}
            className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* ALERT STATUS HASIL OPERASI */}
      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold border flex items-center justify-between shadow-xs animate-in fade-in ${
            statusMsg.tipe === 'success'
              ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
              : 'bg-rose-50 text-rose-950 border-rose-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2
              className={`w-5 h-5 shrink-0 ${
                statusMsg.tipe === 'success' ? 'text-emerald-600' : 'text-rose-600'
              }`}
            />
            <span>{statusMsg.text}</span>
          </div>
          <button
            onClick={() => setStatusMsg(null)}
            className="text-stone-400 hover:text-stone-600 font-bold px-2 py-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}

export function VerifikasiOrdersTable({
  filterStatus,
  setFilterStatus,
  pembelianListLength,
  countMenungguVerifikasi,
  countMenungguPembayaran,
  countDiverifikasi,
  countBatal,
  searchQuery,
  setSearchQuery,
  loadingData,
  filteredOrders,
  santriMap,
  setPreviewBuktiModal,
  isProcessing,
  handleVerifikasiOrder,
  handleTolakOrder,
}: {
  filterStatus: 'SEMUA' | 'MENUNGGU' | 'DIVERIFIKASI' | 'BATAL';
  setFilterStatus: (val: 'SEMUA' | 'MENUNGGU' | 'DIVERIFIKASI' | 'BATAL') => void;
  pembelianListLength: number;
  countMenungguVerifikasi: number;
  countMenungguPembayaran: number;
  countDiverifikasi: number;
  countBatal: number;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  loadingData: boolean;
  filteredOrders: any[];
  santriMap: Map<string, any>;
  setPreviewBuktiModal: (val: { url: string; title: string } | null) => void;
  isProcessing: boolean;
  handleVerifikasiOrder: (order: any) => void;
  handleTolakOrder: (order: any) => void;
}) {
  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border-2 border-[#D5C4B4] space-y-4">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Tab Filter Pills */}
        <div className="flex items-center gap-2 text-xs font-bold overflow-x-auto pb-2 md:pb-0 whitespace-nowrap no-scrollbar">
          <button
            onClick={() => setFilterStatus('SEMUA')}
            className={`px-4 py-2.5 rounded-2xl transition-all shrink-0 cursor-pointer ${
              filterStatus === 'SEMUA'
                ? 'bg-[#8C6A47] text-white shadow-md'
                : 'bg-[#FAF7F3] text-[#422F21] hover:bg-[#EFE8E1] border border-[#D5C4B4]'
            }`}
          >
            Semua Transaksi ({pembelianListLength})
          </button>
          <button
            onClick={() => setFilterStatus('MENUNGGU')}
            className={`px-4 py-2.5 rounded-2xl flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer ${
              filterStatus === 'MENUNGGU'
                ? 'bg-sky-700 text-white shadow-md'
                : 'bg-sky-50 text-sky-900 hover:bg-sky-100 border border-sky-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Menunggu ({countMenungguVerifikasi + countMenungguPembayaran})</span>
          </button>
          <button
            onClick={() => setFilterStatus('DIVERIFIKASI')}
            className={`px-4 py-2.5 rounded-2xl flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer ${
              filterStatus === 'DIVERIFIKASI'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-300'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>Diverifikasi ({countDiverifikasi})</span>
          </button>
          <button
            onClick={() => setFilterStatus('BATAL')}
            className={`px-4 py-2.5 rounded-2xl flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer ${
              filterStatus === 'BATAL'
                ? 'bg-rose-700 text-white shadow-md'
                : 'bg-rose-50 text-rose-900 hover:bg-rose-100 border border-rose-300'
            }`}
          >
            <X className="w-3.5 h-3.5" />
            <span>Refund / Batal ({countBatal})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ID pesanan, santri, wali..."
            className="w-full pl-9 pr-8 py-2.5 text-xs rounded-2xl border border-[#D5C4B4] bg-[#FAF7F3] focus:bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#8C6A47]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* TABEL TRANSAKSI KUOTA TAMBAHAN */}
      <div className="overflow-x-auto rounded-2xl border border-[#E8DFD5] bg-white">
        <table className="w-full min-w-[920px] text-xs text-left">
          <thead className="bg-[#FAF7F3] text-[#422F21] font-serif font-black border-b border-[#D5C4B4] uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3.5 px-4 whitespace-nowrap">ID PESANAN</th>
              <th className="py-3.5 px-4 whitespace-nowrap">WALI &amp; SANTRI</th>
              <th className="py-3.5 px-4 whitespace-nowrap">KATEGORI</th>
              <th className="py-3.5 px-4 whitespace-nowrap">JUMLAH</th>
              <th className="py-3.5 px-4 whitespace-nowrap">TOTAL</th>
              <th className="py-3.5 px-4 whitespace-nowrap">BUKTI / METODE</th>
              <th className="py-3.5 px-4 whitespace-nowrap">STATUS</th>
              <th className="py-3.5 px-4 text-right whitespace-nowrap">AKSI VERIFIKASI &amp; WA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loadingData ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-stone-500">
                  <Loader2 className="w-7 h-7 animate-spin text-[#8C6A47] mx-auto mb-2" />
                  <p className="font-semibold text-xs">Memuat Data Transaksi dari Supabase...</p>
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-stone-400">
                  Tidak ada transaksi kuota tambahan yang cocok dengan filter.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const santri = santriMap.get((order.kode_santri || '').toUpperCase());
                const orderId = order.id_pesanan || order.id || 'KT-0000';
                const numKursi = Number(order.jumlah_kursi || order.jumlah || 1);
                const totalBayar = Number(order.total_bayar || order.totalBayar || numKursi * 75000);
                const isMenunggu = order.status === 'MENUNGGU_VERIFIKASI' || order.status === 'MENUNGGU_PEMBAYARAN';

                return (
                  <tr key={orderId} className="hover:bg-[#FAF7F3]/70 transition-colors">
                    {/* ID PESANAN */}
                    <td className="py-3.5 px-4 font-mono">
                      <span className="font-bold text-[#322116] block text-xs">{orderId}</span>
                      <span className="text-[10px] text-stone-400 block pt-0.5">
                        {order.created_at
                          ? new Date(order.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </span>
                    </td>

                    {/* WALI & SANTRI */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#422F21]">
                        {order.nama_wali || santri?.nama_wali || 'Wali Santri'}
                      </div>
                      <div className="text-[11px] text-stone-600 flex items-center space-x-1 pt-0.5">
                        <span className="font-semibold text-[#8C6A47]">
                          {santri?.nama || order.kode_santri}
                        </span>
                        <span className="text-stone-400">
                          ({santri?.kelas ? `Kelas ${santri.kelas}` : order.kode_santri})
                        </span>
                      </div>
                      {(santri?.no_hp || order.no_hp) && (
                        <div className="text-[10px] text-stone-400 font-mono flex items-center space-x-1 mt-0.5">
                          <Phone className="w-2.5 h-2.5 text-emerald-600" />
                          <span>{santri?.no_hp || order.no_hp}</span>
                        </div>
                      )}
                    </td>

                    {/* KATEGORI */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF0E6] text-[#8C6A47] border border-[#D5C4B4]">
                        {santri?.sub_kategori || santri?.kategori_utama || 'Santri'}
                      </span>
                    </td>

                    {/* JUMLAH KURSI */}
                    <td className="py-3.5 px-4 font-bold text-stone-800">
                      <span className="text-sm font-serif font-black text-[#422F21]">
                        {numKursi}
                      </span>{' '}
                      Kursi
                    </td>

                    {/* TOTAL BAYAR */}
                    <td className="py-3.5 px-4">
                      <div className="font-serif font-black text-[#322116]">
                        Rp {totalBayar.toLocaleString('id-ID')}
                      </div>
                      <div className="text-[10px] text-stone-400">@ Rp 75.000</div>
                    </td>

                    {/* BUKTI / METODE */}
                    <td className="py-3.5 px-4">
                      {order.bukti_url || order.buktiUrl ? (
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewBuktiModal({
                                url: order.bukti_url || order.buktiUrl,
                                title: `Bukti Transfer - ${orderId} (${order.nama_wali || 'Wali'})`,
                              })
                            }
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-sky-50 text-sky-800 hover:bg-sky-100 font-bold border border-sky-300 transition-colors shadow-xs cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-sky-600" />
                            <span>Lihat Bukti</span>
                          </button>
                          <div className="text-[10px] text-stone-500 font-medium">
                            {order.uploaded_at
                              ? `Diperbarui: ${new Date(order.uploaded_at).toLocaleTimeString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })} WIB`
                              : 'Diunggah awal'}
                          </div>
                        </div>
                      ) : order.metode === 'TUNAI' ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-300">
                          <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Kas Tunai</span>
                        </span>
                      ) : (
                        <span className="text-stone-400 italic text-[11px]">Belum diunggah</span>
                      )}
                    </td>

                    {/* STATUS BADGE */}
                    <td className="py-3.5 px-4">
                      {order.status === 'DIVERIFIKASI' || order.status === 'DITERIMA' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-[11px]">
                          <Check className="w-3 h-3 text-emerald-700" />
                          <span>Diverifikasi</span>
                        </span>
                      ) : order.status === 'MENUNGGU_VERIFIKASI' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-sky-100 text-sky-900 border border-sky-300 font-bold text-[11px]">
                          <Clock className="w-3 h-3 text-sky-700 animate-pulse" />
                          <span>Menunggu Verifikasi</span>
                        </span>
                      ) : order.status === 'MENUNGGU_PEMBAYARAN' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px]">
                          <Clock className="w-3 h-3 text-amber-700" />
                          <span>Menunggu Bayar</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-900 border border-rose-300 font-bold text-[11px]">
                          <X className="w-3 h-3 text-rose-700" />
                          <span>{order.status || 'Batal'}</span>
                        </span>
                      )}
                    </td>

                    {/* AKSI VERIFIKASI & WA */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Tombol Verifikasi Langsung */}
                        {isMenunggu && (
                          <>
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleVerifikasiOrder(order)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs flex items-center space-x-1 shadow-sm transition-all active:scale-95 cursor-pointer"
                              title="Verifikasi dan tambahkan kuota ke QR santri"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Verifikasi</span>
                            </button>

                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleTolakOrder(order)}
                              className="p-1.5 rounded-xl bg-stone-100 hover:bg-rose-100 text-stone-500 hover:text-rose-700 border border-stone-200 transition-colors cursor-pointer"
                              title="Tolak Pesanan"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {/* Tombol WA Wali */}
                        {(santri?.no_hp || order.no_hp) && (
                          <a
                            href={`https://wa.me/${(santri?.no_hp || order.no_hp).replace(/[^0-9]/g, '')}?text=Assalamu%27alaikum%20Bpk%2FIbu%20Wali%20Santri%2C%20mengenai%20pesanan%20kuota%20tambahan%20${orderId}...`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-colors cursor-pointer"
                            title="Hubungi Wali via WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
