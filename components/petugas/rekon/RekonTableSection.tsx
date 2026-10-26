'use client';

import { RotateCcw, CheckCircle2, Edit3, UserCheck } from 'lucide-react';
import { RekonSearchResultItem } from './types';

interface RekonTableSectionProps {
  keyword: string;
  searchResults: RekonSearchResultItem[];
  onToggleHadir: (item: RekonSearchResultItem) => void;
  onOpenEdit: (item: RekonSearchResultItem) => void;
}

export default function RekonTableSection({
  keyword,
  searchResults,
  onToggleHadir,
  onOpenEdit,
}: RekonTableSectionProps) {
  if (keyword.trim() === '') return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-bold text-[#7A624E]">
        <span>Hasil Pencarian ({searchResults.length} ditemukan):</span>
      </div>

      {searchResults.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border-2 border-dashed border-stone-200 text-stone-500 text-xs">
          <p className="font-bold text-sm text-[#422F21]">Data tidak ditemukan</p>
          <p className="mt-1">
            Tidak ada peserta / tamu yang cocok dengan kata kunci &quot;{keyword}&quot;. Gunakan tombol &quot;+ Daftarkan Walk-in&quot; jika tamu hadir tanpa registrasi awal.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {searchResults.map((item: any) => {
            const isSantri = item.tipe === 'SANTRI';
            const d = item.data;
            const currentTerpakai = Number(d.kuota_terpakai || 0);
            const kBase = isSantri
              ? Number(d.kuota_dasar || 2)
              : ((d.nama_putra && String(d.nama_putra).trim() !== '') ? 1 : 0) +
                ((d.nama_putri && String(d.nama_putri).trim() !== '') ? 1 : 0);
            const kExtra = isSantri ? Number(d.kuota_tambahan || 0) : 0;
            const totalKuota = kBase + kExtra;
            const isHadir = currentTerpakai > 0;

            return (
              <div
                key={d.id || d.kode}
                className={`p-4 sm:p-5 rounded-3xl border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ${
                  isHadir ? 'bg-emerald-50/60 border-emerald-300' : 'bg-white border-[#E8DFD5]'
                }`}
              >
                {/* INFORMASI UTAMA PESERTA */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-lg bg-[#FAF0E6] text-[#422F21] border border-[#D5C4B4]">
                      {d.kode}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isSantri
                          ? 'bg-blue-100 text-blue-900 border-blue-200'
                          : 'bg-purple-100 text-purple-900 border-purple-200'
                      }`}
                    >
                      {isSantri ? 'PESERTA SANTRI' : 'TAMU UNDANGAN'}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                        d.warna_tiket === 'Hitam Gold'
                          ? 'bg-stone-900 text-amber-300 border-stone-800'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      {d.warna_tiket || 'Merah Gold'}
                    </span>
                    {isHadir ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-950 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        <span>HADIR ({currentTerpakai}/{totalKuota} Kursi)</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-stone-200 text-stone-700 border border-stone-300">
                        BELUM (0/{totalKuota} Kursi)
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif font-black text-base sm:text-lg text-[#422F21]">
                    {d.nama}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-stone-600">
                    {isSantri ? (
                      <>
                        <div>Wali: <strong>{d.nama_wali || '-'}</strong> ({d.no_hp || '-'})</div>
                        <div>Kategori: <strong>{d.sub_kategori || d.kategori_utama}</strong> (Kamar: {d.kamar || '-'})</div>
                      </>
                    ) : (
                      <>
                        <div>Instansi: <strong>{d.instansi || d.alamat || '-'}</strong> ({d.no_hp || '-'})</div>
                        <div>Golongan: <strong>{d.sub_kategori || 'ISTIMEWA'}</strong> ({d.kategori})</div>
                      </>
                    )}
                    <div>Alamat: <strong>{d.alamat || 'Kediri'}</strong></div>
                    <div>Jalur: <strong>{d.jalur_masuk || (isSantri ? 'Gerbang Selatan' : 'Jalur VIP')}</strong></div>
                  </div>
                </div>

                {/* BUTTON REKONSILIASI CEPAT & EDIT LENGKAP */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 border-t md:border-t-0 border-stone-200 pt-3 md:pt-0 shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleHadir(item)}
                    className={`w-full md:w-auto px-4 py-2 rounded-2xl text-xs font-bold shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                      isHadir
                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300'
                        : 'bg-emerald-800 hover:bg-emerald-900 text-white'
                    }`}
                  >
                    {isHadir ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                        <span>Batalkan HADIR</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5 text-emerald-200" />
                        <span>Tandai HADIR</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenEdit(item)}
                    className="w-full md:w-auto px-4 py-2 rounded-2xl bg-white hover:bg-[#FAF7F3] text-[#8C6A47] border-2 border-[#D5C4B4] font-bold text-xs shadow-2xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#8C6A47]" />
                    <span>Edit Lengkap</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
