'use client';

import React from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  Phone,
  MessageSquare,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Zap,
  XCircle,
} from 'lucide-react';
import { buatPesanPengingatKonfirmasi, normalkanNomorHp } from '@/lib/hmac';
import { MainTabType, KonfirmasiItem } from './types';

interface KonfirmasiTableSectionProps {
  activeMainTab: MainTabType;
  paginatedList: KonfirmasiItem[];
  filteredListLength: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  handlePageChange: (newPage: number) => void;
  handleOpenEdit: (item: KonfirmasiItem) => void;
  handleKirimFonnte: (item: KonfirmasiItem) => Promise<boolean>;
  sendingFonnteKode: string | null;
  sentFonnteKodes: Record<string, string>;
  isBlasting: boolean;
}

export default function KonfirmasiTableSection({
  activeMainTab,
  paginatedList,
  filteredListLength,
  currentPage,
  totalPages,
  itemsPerPage,
  handlePageChange,
  handleOpenEdit,
  handleKirimFonnte,
  sendingFonnteKode,
  sentFonnteKodes,
  isBlasting,
}: KonfirmasiTableSectionProps) {
  return (
    <>
      {/* Indikator Geser di Layar HP */}
      <div className="md:hidden px-3.5 py-2 bg-amber-50/90 border-2 border-b-0 border-[#D5C4B4] rounded-t-2xl text-[11px] font-semibold text-[#8C6A47] flex items-center justify-between mt-3">
        <span className="flex items-center space-x-1.5">
          <span>👉</span>
          <span>Geser tabel ke samping untuk melihat Kontak, Kuota &amp; Aksi</span>
        </span>
        <span className="text-xs">↔️</span>
      </div>

      {/* TABEL DATA KONFIRMASI */}
      <div className="overflow-x-auto rounded-b-2xl md:rounded-2xl border-2 border-[#D5C4B4] bg-white shadow-sm mt-0 md:mt-3">
        <table className="w-full text-left text-xs text-[#422F21]">
          <thead className="bg-[#EFE8E1] text-[#5C3E28] font-bold uppercase tracking-wider border-b border-[#D5C4B4]">
            <tr>
              <th className="py-3 px-3.5 whitespace-nowrap">
                {activeMainTab === 'WALI_SANTRI' ? 'Kode & Santri' : 'Kode & Tamu'}
              </th>
              <th className="py-3 px-3.5 whitespace-nowrap">
                {activeMainTab === 'WALI_SANTRI' ? 'Kategori & Kelas' : 'Kategori & Golongan'}
              </th>
              <th className="py-3 px-3.5 whitespace-nowrap">
                {activeMainTab === 'WALI_SANTRI' ? 'Nama Wali & Kontak WA' : 'Instansi & Kontak WA'}
              </th>
              <th className="py-3 px-3.5 text-center whitespace-nowrap">Jatah Kuota</th>
              <th className="py-3 px-3.5 text-center whitespace-nowrap">Status Konfirmasi</th>
              <th className="py-3 px-3.5 text-center whitespace-nowrap">Estimasi Kursi</th>
              <th className="py-3 px-3.5 text-center whitespace-nowrap">Aksi Panitia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D5C4B4]/40">
            {paginatedList.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#7A624E]">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Users className="w-8 h-8 text-[#8C6A47]/40" />
                    <div className="font-semibold">
                      Tidak ada data{' '}
                      {activeMainTab === 'WALI_SANTRI' ? 'santri' : 'tamu undangan'} yang cocok
                    </div>
                    <div className="text-[11px] text-[#7A624E]">
                      Silakan sesuaikan filter status konfirmasi atau kata kunci pencarian.
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedList.map((item) => (
                <tr key={item.id} className="hover:bg-[#FAF7F3] transition-colors">
                  {/* Kode & Santri */}
                  <td className="py-3 px-4">
                    <div className="font-serif font-black text-sm text-[#422F21]">
                      {item.namaSantri}
                    </div>
                    <div className="flex items-center space-x-1.5 text-[11px] text-[#8C6A47] font-mono mt-0.5">
                      <span className="font-bold">{item.kode}</span>
                      {item.kamar && item.kamar !== '-' && (
                        <span className="text-[#7A624E]">· Kamar {item.kamar}</span>
                      )}
                    </div>
                  </td>

                  {/* Kategori & Kelas */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        item.kategoriUtama === 'BIL_GHOIB'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : item.kategoriUtama === 'TAMATAN'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-blue-100 text-blue-900 border border-blue-300'
                      }`}
                    >
                      {item.subKategori}
                    </span>
                    <div className="text-[11px] text-[#7A624E] mt-0.5 font-medium">
                      Kelas: {item.kelas}
                    </div>
                  </td>

                  {/* Nama Wali & Kontak WA (Riil dari Supabase DB) */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#422F21]">{item.namaWali}</div>
                    <div className="text-[11px] text-[#7A624E] flex items-center space-x-2 mt-0.5">
                      {item.noHp && item.noHp !== '-' && item.noHp !== 'Tanpa Kontak HP' ? (
                        <a
                          href={`https://wa.me/${item.noHp.replace(/\D/g, '').replace(/^0/, '62')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 hover:text-emerald-900 font-mono font-bold flex items-center space-x-1 underline"
                          title="Hubungi Wali via WhatsApp"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{item.noHp}</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-gray-400">Tanpa Kontak HP</span>
                      )}
                    </div>
                    {item.alamat && item.alamat !== '-' && (
                      <div className="text-[10px] text-[#7A624E]/80 mt-0.5 truncate max-w-xs">
                        {item.alamat}
                      </div>
                    )}
                  </td>

                  {/* Jatah Kuota */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="font-mono font-black text-sm text-[#422F21]">
                      {item.totalKuota}{' '}
                      <span className="text-xs font-normal text-[#7A624E]">Kursi</span>
                    </div>
                    <div className="text-[10px] text-[#8C6A47]">
                      {item.kuotaDasar} Dasar
                      {item.kuotaTambahan > 0 && ` + ${item.kuotaTambahan} Tambahan`}
                    </div>
                  </td>

                  {/* Status Konfirmasi */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {item.rawStatusKonfirmasi === 'BERHALANGAN' ? (
                      <div>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          <XCircle className="w-3 h-3 mr-1 text-rose-600" />
                          Berhalangan Hadir
                        </span>
                        {item.diisiAt && (
                          <div className="text-[9px] text-[#7A624E] mt-0.5">
                            {new Date(item.diisiAt).toLocaleDateString('id-ID')}
                          </div>
                        )}
                      </div>
                    ) : item.statusKonfirmasi === 'SUDAH' ? (
                      <div>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                          Sudah Konfirmasi
                        </span>
                        <div className="text-[10px] text-[#7A624E] mt-0.5">
                          {item.diubahOleh === 'PANITIA_MANUAL' ? (
                            <span className="text-[#8C6A47] font-semibold">Oleh: Panitia Manual</span>
                          ) : item.tipe === 'TAMU_UNDANGAN' ? (
                            <span className="text-[#8C6A47] font-semibold">Oleh: Tamu (RSVP)</span>
                          ) : (
                            <span>Oleh: Wali Santri</span>
                          )}
                        </div>
                        {item.diisiAt && (
                          <div className="text-[9px] text-[#7A624E]">
                            {new Date(item.diisiAt).toLocaleDateString('id-ID')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <Clock className="w-3 h-3 mr-1 text-amber-600" />
                          Belum Konfirmasi
                        </span>
                        <div className="text-[10px] text-[#7A624E] mt-0.5">Menunggu respon</div>
                      </div>
                    )}
                  </td>

                  {/* Estimasi Kursi */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {item.statusKonfirmasi === 'SUDAH' ? (
                      <div>
                        <div className="font-black text-[#422F21] text-sm">
                          {item.totalEstimasi}{' '}
                          <span className="text-xs font-normal text-[#7A624E]">Orang</span>
                        </div>
                        <div className="text-[10px] text-[#8C6A47] font-medium">
                          L: {item.perkiraanL} · P: {item.perkiraanP}
                        </div>
                        {item.catatan && (
                          <div
                            className="text-[10px] text-stone-600 italic mt-0.5 truncate max-w-[120px]"
                            title={item.catatan}
                          >
                            &quot;{item.catatan}&quot;
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 font-mono text-xs">-</span>
                    )}
                  </td>

                  {/* Aksi Panitia */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-1.5">
                      {/* Edit Manual */}
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF7F3] text-[#8C6A47] border border-[#D5C4B4] font-bold text-xs flex items-center space-x-1 shadow-sm transition-all cursor-pointer"
                        title="Edit Konfirmasi Secara Manual"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      {/* Kirim via Fonnte Otomatis */}
                      {item.noHp && item.noHp !== '-' && item.noHp !== 'Tanpa Kontak HP' ? (
                        sentFonnteKodes[item.kode] ? (
                          <div
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[11px] flex items-center space-x-1"
                            title={`Terkirim via Fonnte jam ${sentFonnteKodes[item.kode]}`}
                          >
                            <Check className="w-3 h-3 text-emerald-700" />
                            <span>Terkirim</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleKirimFonnte(item)}
                            disabled={sendingFonnteKode === item.kode || isBlasting}
                            className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 shadow-sm transition-all cursor-pointer ${
                              item.statusKonfirmasi === 'BELUM'
                                ? 'bg-amber-600 hover:bg-amber-700 text-white border border-amber-700'
                                : 'bg-emerald-700 hover:bg-emerald-800 text-white border border-emerald-800'
                            } disabled:opacity-50`}
                            title={
                              item.statusKonfirmasi === 'BELUM'
                                ? 'Kirim Pesan Pengingat Otomatis via API Fonnte'
                                : 'Kirim Pengingat Ulang via API Fonnte'
                            }
                          >
                            {sendingFonnteKode === item.kode ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin text-white" />
                                <span>Kirim...</span>
                              </>
                            ) : (
                              <>
                                <Zap className="w-3 h-3 text-amber-200" />
                                <span>Fonnte</span>
                              </>
                            )}
                          </button>
                        )
                      ) : null}

                      {/* Link Chat WhatsApp Web Manual */}
                      {item.noHp && item.noHp !== '-' && item.noHp !== 'Tanpa Kontak HP' && (
                        <a
                          href={`https://wa.me/${normalkanNomorHp(item.noHp)}?text=${encodeURIComponent(
                            buatPesanPengingatKonfirmasi(
                              item.namaSantri !== '-' ? item.namaSantri : item.namaWali,
                              item.kode,
                              typeof window !== 'undefined'
                                ? window.location.origin
                                : 'https://haflah.p3tq.id'
                            )
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 transition-all cursor-pointer"
                          title="Buka Chat Pengingat Resmi di WhatsApp Web"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginasi Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-[#7A624E]">
        <div>
          Menampilkan{' '}
          <span className="font-bold text-[#422F21]">
            {filteredListLength > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
          </span>{' '}
          hingga{' '}
          <span className="font-bold text-[#422F21]">
            {Math.min(currentPage * itemsPerPage, filteredListLength)}
          </span>{' '}
          dari <span className="font-bold text-[#422F21]">{filteredListLength}</span> data terfilter
        </div>

        <div className="flex items-center space-x-2 self-center sm:self-auto">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-xl border border-[#D5C4B4] bg-white hover:bg-[#FAF7F3] disabled:opacity-40 disabled:hover:bg-white text-[#422F21] transition-colors cursor-pointer"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-xs px-2">
            Halaman {currentPage} dari {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-xl border border-[#D5C4B4] bg-white hover:bg-[#FAF7F3] disabled:opacity-40 disabled:hover:bg-white text-[#422F21] transition-colors cursor-pointer"
            title="Halaman Selanjutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
