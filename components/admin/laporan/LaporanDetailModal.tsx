'use client';

import React from 'react';
import { CheckCircle2, Search, X } from 'lucide-react';
import {
  BLOK_3_SUBKATEGORI_DEFINITIONS,
  templateBlokSantri,
  getSantriIndex,
  getBlok3Index,
} from '@/lib/laporan-rekap';

export function LaporanDetailModal({
  modalKategori,
  setModalKategori,
  modalSearch,
  setModalSearch,
  modalTab,
  setModalTab,
  santriList,
  tamuList,
  presensiLogs,
}: {
  modalKategori: string | null;
  setModalKategori: (val: string | null) => void;
  modalSearch: string;
  setModalSearch: (val: string) => void;
  modalTab: 'HADIR' | 'BELUM_HADIR';
  setModalTab: (val: 'HADIR' | 'BELUM_HADIR') => void;
  santriList: any[];
  tamuList: any[];
  presensiLogs: any[];
}) {
  if (!modalKategori) return null;

  const isSantriCat = templateBlokSantri.some((t) => t.kategori === modalKategori);
  const selSantriIdx = templateBlokSantri.findIndex((t) => t.kategori === modalKategori);
  const selUndIdx = BLOK_3_SUBKATEGORI_DEFINITIONS.findIndex((t) => t.kategori === modalKategori);

  let rawItems: any[] = [];
  if (isSantriCat && selSantriIdx !== -1) {
    rawItems = santriList
      .filter((s) => getSantriIndex(s) === selSantriIdx)
      .map((s) => {
        const isHadir =
          Number(s.kuota_terpakai || 0) > 0 ||
          Number(s.perkiraan_l || 0) + Number(s.perkiraan_p || 0) > 0;
        const log = presensiLogs.find((l) => l.kode_qr === s.kode);
        return {
          kode: s.kode,
          nama: s.nama,
          namaWali: s.nama_wali || s.nama,
          kelas: s.kelas || '-',
          kamar: s.kamar || '-',
          noHp: s.no_hp || '-',
          isHadir,
          waktuHadir: log
            ? new Date(log.created_at).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              }) + ' WIB'
            : null,
          tipe: 'SANTRI',
        };
      });
  } else if (selUndIdx !== -1) {
    rawItems = tamuList
      .filter((und) => getBlok3Index(und) === selUndIdx)
      .map((und) => {
        const isHadir = Number(und.kuota_terpakai || 0) > 0;
        const log = presensiLogs.find((l) => l.kode_qr === und.kode);
        return {
          kode: und.kode,
          nama: und.nama,
          instansi: und.instansi || und.alamat || '-',
          isHadir,
          waktuHadir: log
            ? new Date(log.created_at).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              }) + ' WIB'
            : null,
          tipe: 'UNDANGAN',
          statusKonfirmasi: und.status_konfirmasi || 'BELUM',
        };
      });
  }

  const filteredItems = rawItems.filter((item) => {
    const q = modalSearch.toLowerCase().trim();
    const matchesQuery =
      !q ||
      item.nama.toLowerCase().includes(q) ||
      item.kode.toLowerCase().includes(q) ||
      (item.namaWali && item.namaWali.toLowerCase().includes(q)) ||
      (item.instansi && item.instansi.toLowerCase().includes(q));
    if (modalTab === 'HADIR') return matchesQuery && item.isHadir;
    if (modalTab === 'BELUM_HADIR') return matchesQuery && !item.isHadir;
    return matchesQuery;
  });

  const totalHadirCount = rawItems.filter((i) => i.isHadir).length;
  const totalBelumCount = rawItems.length - totalHadirCount;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in no-print">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden">
        {/* Header Modal */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#FAF7F3] via-[#EFE8E1] to-[#FAF7F3] border-b border-[#D5C4B4] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6A47]">
              RINCIAN DETAILED KATEGORI ({isSantriCat ? 'BLOK 1 WALI SANTRI' : 'BLOK 3 TAMU UNDANGAN'})
            </span>
            <h3 className="font-serif font-black text-base sm:text-lg text-[#422F21]">
              {modalKategori}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setModalKategori(null)}
            className="p-2 rounded-xl bg-white border border-[#D5C4B4] text-slate-700 hover:bg-[#EFE8E1] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-200 p-1 rounded-xl font-bold">
            <button
              type="button"
              onClick={() => setModalTab('HADIR')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                modalTab === 'HADIR'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              ✅ Hadir ({totalHadirCount})
            </button>
            <button
              type="button"
              onClick={() => setModalTab('BELUM_HADIR')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                modalTab === 'BELUM_HADIR'
                  ? 'bg-rose-800 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              ❌ Belum ({totalBelumCount})
            </button>
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={modalSearch}
              onChange={(e) => setModalSearch(e.target.value)}
              placeholder="Cari nama, kode, wali, instansi..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#8C6A47]"
            />
          </div>
        </div>

        {/* Body List Item */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-2 text-xs">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-medium space-y-1">
              <p className="text-sm font-bold text-slate-600">Tidak ada data ditemukan</p>
              <p className="text-xs">Silakan sesuaikan kata kunci pencarian atau filter tab.</p>
            </div>
          ) : (
            filteredItems.map((item, idx) => (
              <div
                key={item.kode + idx}
                className="p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-amber-50/60 transition-colors flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#8C6A47] text-[11px] bg-white px-2 py-0.5 rounded border border-[#D5C4B4]">
                      {item.kode}
                    </span>
                    <span className="font-bold text-slate-900 truncate text-sm">
                      {item.nama}
                    </span>
                  </div>
                  {item.tipe === 'SANTRI' ? (
                    <div className="text-[11px] text-slate-600 flex items-center gap-2 flex-wrap">
                      <span>
                        Wali: <strong>{item.namaWali}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        {item.kelas} (Kamar {item.kamar})
                      </span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-600 flex items-center gap-2 flex-wrap">
                      <span>
                        Instansi: <strong>{item.instansi}</strong>
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  {item.isHadir ? (
                    <div className="space-y-0.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>HADIR</span>
                      </span>
                      {item.waktuHadir && (
                        <span className="block text-[10px] text-slate-500 font-mono">
                          {item.waktuHadir}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[11px] font-bold border border-slate-300">
                      <span>BELUM HADIR</span>
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Modal */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 text-center text-[11px] text-slate-500 font-medium flex justify-between items-center px-4">
          <span>Total: {rawItems.length} Data Terdaftar</span>
          <button
            type="button"
            onClick={() => setModalKategori(null)}
            className="px-4 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
