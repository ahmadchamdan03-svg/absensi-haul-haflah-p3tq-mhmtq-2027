'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, X, CheckCircle2, Layers, Loader2, MapPin, Tag } from 'lucide-react';

export interface MergeDuplicateGroup {
  key: string;
  nama: string;
  namaWali?: string;
  kota?: string;
  items: any[];
}

export interface MergeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'SANTRI' | 'TAMU';
  groups: MergeDuplicateGroup[];
  isMerging: boolean;
  onConfirmMergeAll: () => Promise<boolean>;
}

function getItemPriority(mode: 'SANTRI' | 'TAMU', item: any): number {
  if (mode === 'TAMU') {
    const kat = String(item?.kategori || item?.raw?.kategori || '').toUpperCase();
    const sub = String(item?.subKategori || item?.golonganUndangan || item?.golongan || '').toUpperCase();
    if (kat.includes('VVIP')) return 400;
    if (kat.includes('VIP') || sub.includes('ISTIMEWA')) return 300;
    if (sub.includes('KEHORMATAN') || kat.includes('KEHORMATAN')) return 200;
    return 100;
  }

  const kat = String(item?.kategoriUtama || item?.kategori_utama || '').toUpperCase();
  if (kat.includes('BIL_GHOIB') || kat.includes('GHOIB')) return 3;
  if (kat.includes('TAMATAN')) return 2;
  if (kat.includes('BIN_NADZOR') || kat.includes('NADZOR')) return 1;
  return 0;
}

function formatKategoriItem(mode: 'SANTRI' | 'TAMU', item: any): string {
  if (mode === 'TAMU') {
    const gol = String(item?.golonganUndangan || item?.golongan || '').trim();
    const kat = String(item?.kategori || item?.subKategori || '').trim();
    if (gol && kat && gol.toUpperCase() !== kat.toUpperCase()) {
      return `${gol} (${kat})`;
    }
    return kat || gol || 'Tamu Undangan';
  }

  const santriObj = item?.santri?.[0] || item;
  const kat = String(item?.kategoriUtama || santriObj?.kategoriUtama || item?.kategori_utama || '').trim();
  const sub = String(item?.subKategori || santriObj?.subKategori || item?.sub_kategori || '').trim();
  const kelas = String(item?.kelas || santriObj?.kelas || '').trim();

  if (sub && sub !== '-') {
    return kelas && kelas !== '-' && kat === 'BIN_NADZOR' ? `${sub} (${kelas})` : sub;
  }
  if (kat === 'BIL_GHOIB') return 'Bil Ghoib';
  if (kat === 'BIN_NADZOR') return kelas && kelas !== '-' ? `Bin Nadzori (${kelas})` : 'Bin Nadzori';
  if (kat === 'TAMATAN') return 'Tamatan';
  return kat || 'Santri';
}

function formatAlamatItem(item: any): string {
  const alamat = String(item?.alamat || '').trim();
  const instansi = String(item?.instansi || '').trim();
  if (alamat && alamat !== '-') return alamat;
  if (instansi && instansi !== '-') return instansi;
  return '-';
}

export default function MergeDetailModal({
  isOpen,
  onClose,
  mode,
  groups,
  isMerging,
  onConfirmMergeAll,
}: MergeDetailModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isMerging) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isMerging, onClose]);

  if (!mounted || !isOpen) return null;

  const modeLabel = mode === 'SANTRI' ? 'Santri Peserta' : 'Tamu Undangan';

  const handleConfirmClick = async () => {
    const ok = await onConfirmMergeAll();
    if (ok) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isMerging) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="merge-detail-modal-title"
        className="bg-[#F0F9FF]/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[90dvh] flex flex-col shadow-2xl border border-white/70 overflow-hidden"
      >
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-[#0F2C59] to-[#1E3A8A] text-white px-6 py-4 sm:px-8 sm:py-5 flex items-center justify-between gap-3 border-b border-amber-400/40 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0">
              <Eye className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 id="merge-detail-modal-title" className="font-serif font-black text-base sm:text-lg text-amber-300 truncate">
                Preview Penggabungan Data {modeLabel}
              </h3>
              <p className="text-[11px] sm:text-xs text-blue-100 truncate">
                Terdeteksi {groups.length} grup kategori dobel. Data prioritas tertinggi menjadi kartu utama.
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Tutup modal preview penggabungan"
            disabled={isMerging}
            onClick={onClose}
            className="text-blue-200 hover:text-white hover:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body Daftar Grup Duplikat */}
        <div className="p-5 sm:px-8 sm:py-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {groups.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 space-y-2">
              <p className="font-bold text-slate-700 text-sm">Tidak ada grup data dobel yang belum digabung.</p>
              <p>Seluruh data peserta yang cocok sudah berada dalam satu kartu terpadu.</p>
            </div>
          ) : (
            groups.map((grp, groupIdx) => {
              const sortedItems = [...grp.items].sort(
                (a, b) => getItemPriority(mode, b) - getItemPriority(mode, a)
              );

              return (
                <div
                  key={grp.key}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
                >
                  <div className="px-4 py-3 sm:px-5 bg-amber-50/70 border-b border-amber-200/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-600 text-white font-bold text-[10px]">
                          Grup #{groupIdx + 1}
                        </span>
                        <span className="font-serif font-black text-sm text-[#0F2C59]">
                          {grp.nama}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {mode === 'SANTRI'
                          ? `Wali Santri: ${grp.namaWali || '-'}`
                          : `Wilayah / Kota: ${grp.kota || '-'}`}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-amber-300 text-amber-900 font-bold text-[11px] shrink-0">
                      <Layers className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
                      {sortedItems.length} Data Digabung
                    </span>
                  </div>

                  {/* Tampilan Tabel PC/Tablet */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-2.5 px-4">Status Prioritas</th>
                          <th className="py-2.5 px-4">Nama Lengkap</th>
                          <th className="py-2.5 px-4">Kategori / Bagian</th>
                          <th className="py-2.5 px-4">Alamat / Kota</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sortedItems.map((item, idx) => {
                          const isPrimary = idx === 0;
                          const namaItem = item.nama || item.santri?.[0]?.nama || '-';
                          return (
                            <tr
                              key={item.id || item.kode || idx}
                              className={isPrimary ? 'bg-blue-50/45' : 'bg-white'}
                            >
                              <td className="py-3 px-4 align-top whitespace-nowrap">
                                {isPrimary ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0F2C59] text-white font-bold text-[10px]">
                                    <CheckCircle2 className="w-3 h-3 text-amber-300" aria-hidden="true" />
                                    Data Utama (Prioritas Tertinggi)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-[10px]">
                                    Data Tambahan (Digabungkan)
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 align-top">
                                <div className="font-bold text-[#0F2C59]">{namaItem}</div>
                                {item.kode && (
                                  <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                                    Kode: {item.kode}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-4 align-top font-semibold text-slate-700">
                                {formatKategoriItem(mode, item)}
                              </td>
                              <td className="py-3 px-4 align-top text-slate-600">
                                {formatAlamatItem(item)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Tampilan Kartu Mobile */}
                  <div className="sm:hidden divide-y divide-slate-100">
                    {sortedItems.map((item, idx) => {
                      const isPrimary = idx === 0;
                      const namaItem = item.nama || item.santri?.[0]?.nama || '-';
                      return (
                        <div
                          key={item.id || item.kode || idx}
                          className={`p-4 space-y-2 ${isPrimary ? 'bg-blue-50/45' : 'bg-white'}`}
                        >
                          <div>
                            {isPrimary ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0F2C59] text-white font-bold text-[10px]">
                                <CheckCircle2 className="w-3 h-3 text-amber-300" aria-hidden="true" />
                                Data Utama (Prioritas Tertinggi)
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-[10px]">
                                Data Tambahan (Digabungkan)
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{namaItem}</div>
                            {item.kode && (
                              <div className="font-mono text-[10px] text-slate-500">Kode: {item.kode}</div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-3 text-[11px] text-slate-600 pt-1">
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                              <Tag className="w-3 h-3 text-blue-600" aria-hidden="true" />
                              {formatKategoriItem(mode, item)}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500" aria-hidden="true" />
                              {formatAlamatItem(item)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Eksekusi */}
        <div className="shrink-0 px-6 py-4 sm:px-8 sm:py-4 bg-white/90 backdrop-blur-sm border-t border-slate-200 flex flex-wrap items-center justify-end gap-3 text-xs sm:text-sm">
          <button
            type="button"
            onClick={onClose}
            disabled={isMerging}
            className="px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={isMerging || groups.length === 0}
            className="px-5 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold shadow-sm flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isMerging ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
                <span>Menggabungkan...</span>
              </>
            ) : (
              <span>Konfirmasi &amp; Gabungkan Semua ({groups.length})</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
