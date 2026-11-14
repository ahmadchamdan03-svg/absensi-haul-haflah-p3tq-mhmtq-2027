'use client';

import React from 'react';
import {
  Trash2,
  Edit,
  QrCode,
  Phone,
  UserCheck,
  Check,
  Link2,
  Unlink,
} from 'lucide-react';
import { store } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase/client';
import { extractBagianTamatan, getWarnaTiketUndangan } from '@/lib/types';
import {
  getMergedCategoryBadges,
  getMergedCategoryBadgeClass,
} from '@/lib/santri-merge-helper';

function formatAdminKategoriSantri(item: any): string {
  const rawSub = String(item.subKategori || '').trim();

  // 1. Kategori dobel (contoh: "Tamatan (A.01) & Bil Ghoib") — tampilkan utuh dari database
  if (rawSub.includes('&')) {
    return rawSub;
  }

  // 2. Kategori Tamatan — tampilkan bagian/sub-kategori secara utuh bila ada di database
  if (item.kategoriUtama === 'TAMATAN' || /^tamatan\b/i.test(rawSub)) {
    if (/^tamatan\s*\([^)]+\)/i.test(rawSub)) {
      return rawSub;
    }
    const bagian = extractBagianTamatan(rawSub) || String(item.bagianTamatan || '').trim();
    if (bagian) {
      return `Tamatan (${bagian})`;
    }
    if (rawSub && rawSub.toLowerCase() !== 'tamatan') {
      return `Tamatan (${rawSub})`;
    }
    return 'Tamatan';
  }

  // 3. Kategori tunggal lainnya
  if (item.kategoriUtama === 'BIL_GHOIB') return 'Bil Ghoib';
  if (item.kategoriUtama === 'BIN_NADZOR') return 'Bin Nadzori';
  return rawSub || 'Santri';
}

export async function executeFastTrackVipHelper(params: {
  item: any;
  setFastTrackLoading: (kode: string | null) => void;
  onRefreshData: () => Promise<void>;
  showToast: (msg: string) => void;
}) {
  const { item, setFastTrackLoading, onRefreshData, showToast } = params;
  setFastTrackLoading(item.kode);
  try {
    const kuotaDasar = item.kuotaDasar || 2;
    const kuotaTambahan = item.kuotaTambahan || 0;
    const totalKuotaItem = kuotaDasar + kuotaTambahan;

    let jumlahL = 1;
    let jumlahP = 0;
    if (item.namaPutra && item.namaPutri) {
      jumlahL = Math.ceil(totalKuotaItem / 2);
      jumlahP = Math.floor(totalKuotaItem / 2);
    } else if (item.namaPutra) {
      jumlahL = totalKuotaItem;
      jumlahP = 0;
    } else if (item.namaPutri) {
      jumlahL = 0;
      jumlahP = totalKuotaItem;
    } else {
      const lower = (item.nama || '').toLowerCase();
      const isFemale = ['nyai', 'hj.', 'ning', 'ibu', 'ustadzah', 'hajah', 'biyung'].some((h) =>
        lower.includes(h)
      );
      if (isFemale) {
        jumlahL = 0;
        jumlahP = totalKuotaItem;
      } else {
        jumlahL = totalKuotaItem;
        jumlahP = 0;
      }
    }

    await fetch('/api/presensi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'checkin',
        kode_qr: item.kode,
        nama_peserta: item.nama,
        tipe_peserta: 'UNDANGAN',
        jalur: 'MEJA_TRANSIT',
        panitia_id: 'fast-track-vip',
        jumlah_l: jumlahL,
        jumlah_p: jumlahP,
        jumlah_balita: 0,
        catatan: 'Fast-Track VIP Checkin',
      }),
    });

    store.checkin(item.kode, totalKuotaItem, 0, 'BARAT', 0, 'fast-track-vip');
    await onRefreshData();
    showToast(`✓ Tamu VIP ${item.nama} (${item.kode}) berhasil dihadirkan!`);
  } catch (e: any) {
    console.warn('FastTrack error:', e);
  } finally {
    setFastTrackLoading(null);
  }
}

export interface SantriTableRowProps {
  item: any;
  globalIndex: number;
  fastTrackLoading: string | null;
  handleFastTrackVip: (item: any) => void;
  setQrDetailItem: (item: any | null) => void;
  handleOpenEdit: (item: any) => void;
  setDeletingItem: (item: any | null) => void;
  onOpenUnmerge?: (item: any) => void;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export default function SantriTableRow({
  item,
  globalIndex,
  fastTrackLoading,
  handleFastTrackVip,
  setQrDetailItem,
  handleOpenEdit,
  setDeletingItem,
  onOpenUnmerge,
  isSelected = false,
  onToggleSelect,
}: SantriTableRowProps) {
  const isBilGhoib = item.kategoriUtama === 'BIL_GHOIB';
  const isBinNadzor = item.kategoriUtama === 'BIN_NADZOR';
  const isTamatan = item.kategoriUtama === 'TAMATAN';
  const isUndangan = item.tipe === 'UNDANGAN';

  return (
    <tr className="hover:bg-slate-50/80 transition-colors">
      {/* Checkbox Select for Merge */}
      <td className="py-2 px-2 text-center">
        <input
          type="checkbox"
          aria-label={`Pilih ${item.nama}`}
          checked={isSelected}
          onChange={() => onToggleSelect?.(item.id)}
          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
      </td>

      {/* No */}
      <td className="py-2 px-1.5 sm:px-2 text-center text-slate-500 font-mono text-[11px] whitespace-nowrap">
        {globalIndex}
      </td>

      {/* Kode QR & Kartu Modal */}
      <td className="py-2 px-2 sm:px-2.5 whitespace-nowrap">
        <button
          onClick={() => setQrDetailItem(item)}
          className="flex items-center space-x-1 px-2 py-0.5 rounded-md font-mono font-bold text-[11px] bg-slate-100 hover:bg-opera-50 hover:text-opera-850 hover:border-opera-300 border border-slate-200 transition-colors group"
        >
          <QrCode className="w-3.5 h-3.5 text-slate-500 group-hover:text-opera-700" />
          <span>{item.kode}</span>
          {item.isMerged && (
            <span title="QR Code Prioritas Tertinggi (Grup Gabungan)">
              <Link2 className="w-3 h-3 text-sky-600 shrink-0" />
            </span>
          )}
        </button>
      </td>

      {/* Nama & Kamar */}
      <td className="py-2 px-2 sm:px-2.5">
        <div className="space-y-0.5 leading-tight">
          <div className="font-bold text-slate-900 text-xs sm:text-[13px] leading-tight">{item.nama}</div>
          {item.kamar && item.kamar !== '-' && (
            <div className="text-[11px] text-slate-600 leading-tight">Kamar: {item.kamar}</div>
          )}
          {isUndangan &&
            item.golonganUndangan === 'ISTIMEWA' &&
            item.namaPutra &&
            item.namaPutri && (
              <div className="text-[10px] text-blue-900/80 font-medium flex items-center space-x-1 leading-tight">
                <span>🤵 {item.namaPutra}</span>
                <span>·</span>
                <span>🧕 {item.namaPutri}</span>
              </div>
            )}
        </div>
      </td>

      {/* Kategori & Bagian */}
      <td className="py-2 px-2 sm:px-2.5">
        {item.isMerged ? (
          <div className="flex flex-wrap items-center gap-1 leading-tight">
            {getMergedCategoryBadges(item).map((katName: string, idx: number) => (
              <span
                key={`${katName}-${idx}`}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border shadow-2xs leading-tight ${getMergedCategoryBadgeClass(katName)}`}
              >
                {katName}
              </span>
            ))}
          </div>
        ) : (
          <div className="space-y-0.5 leading-tight">
            <div className="flex items-center space-x-1.5">
              <span
                className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                  isBilGhoib || (item.subKategori && item.subKategori.toLowerCase().includes('ghoib'))
                    ? 'bg-blue-500'
                    : isBinNadzor || (item.subKategori && item.subKategori.toLowerCase().includes('nadzor'))
                    ? 'bg-blue-500'
                    : isTamatan
                    ? 'bg-amber-500'
                    : item.golonganUndangan === 'ISTIMEWA'
                    ? 'bg-amber-600'
                    : item.golonganUndangan === 'KEHORMATAN'
                    ? 'bg-purple-600'
                    : 'bg-cyan-600'
                }`}
              ></span>
              <span className="font-bold text-slate-800 text-xs break-words leading-tight">
                {!isUndangan
                  ? formatAdminKategoriSantri(item)
                  : item.golonganUndangan === 'ISTIMEWA'
                  ? 'Undangan Istimewa'
                  : item.golonganUndangan === 'KEHORMATAN'
                  ? 'Undangan Kehormatan'
                  : 'Undangan Umum'}
              </span>
            </div>
            {!isUndangan && item.subKategori?.includes('&') && (
              <div className="flex flex-wrap gap-1">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-gradient-to-r from-emerald-100 to-amber-100 text-slate-800 border border-blue-300/80 shadow-xs leading-tight">
                  ⭐ Kategori Dobel
                </span>
              </div>
            )}
            {isUndangan && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border leading-tight ${
                  item.golonganUndangan === 'ISTIMEWA'
                    ? 'bg-sky-50 text-blue-950 border-sky-300'
                    : item.golonganUndangan === 'KEHORMATAN'
                    ? 'bg-purple-50 text-purple-900 border-purple-300'
                    : 'bg-cyan-50 text-cyan-900 border-cyan-300'
                }`}
              >
                {item.golonganUndangan === 'KEHORMATAN'
                  ? 'Tamu Kehormatan'
                  : item.kategori || 'VIP'}
              </span>
            )}
          </div>
        )}
      </td>

      {/* Wali Santri / Alamat & Kontak */}
      <td className="py-2 px-2 sm:px-2.5">
        <div className="space-y-0.5 leading-tight">
          <div className="text-slate-800 text-xs font-medium leading-tight">
            {isUndangan ? (
              item.golonganUndangan === 'ISTIMEWA' ? (
                <span className="text-blue-950 font-semibold flex items-center space-x-1">
                  <span>📍 {item.alamat || item.instansi || 'Kediri'}</span>
                </span>
              ) : item.golonganUndangan === 'KEHORMATAN' ? (
                <span className="text-purple-950 font-semibold flex items-center space-x-1">
                  <span>📍 {item.alamat || item.instansi || 'Kediri'}</span>
                </span>
              ) : (
                <div className="space-y-0.5 leading-tight">
                  <div className="font-semibold text-slate-800">
                    {item.instansi || 'Pondok Pesantren Lirboyo'}
                  </div>
                  {item.alamat && item.alamat !== '-' && item.alamat !== item.instansi && (
                    <div className="text-xs text-slate-600 font-normal">
                      📍 {item.alamat}
                    </div>
                  )}
                </div>
              )
            ) : (
              item.namaWali
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-600 leading-tight">
            {item.noHp && item.noHp !== '-' && (
              <a
                href={`https://wa.me/${item.noHp.replace(/^0/, '62')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-blue-700 hover:underline whitespace-nowrap"
              >
                <Phone className="w-3 h-3 mr-0.5" />
                <span>{item.noHp}</span>
              </a>
            )}
            {item.alamat && !isUndangan && <span>· {item.alamat}</span>}
            {isUndangan &&
              item.golonganUndangan === 'ISTIMEWA' &&
              (item.namaPutra || item.namaPutri) && (
                <span className="text-[10px] text-amber-700 font-semibold bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 leading-tight">
                  {item.namaPutra && item.namaPutri
                    ? 'Putra & Putri'
                    : item.namaPutra
                    ? 'Putra'
                    : 'Putri'}
                </span>
              )}
          </div>
        </div>
      </td>

      {/* Hak Kuota */}
      <td className="py-2 px-2 sm:px-2.5 text-center whitespace-nowrap">
        <div className="font-bold text-slate-800 text-xs leading-tight">
          {item.kuotaDasar + item.kuotaTambahan} Kursi
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5 space-y-0.5 leading-tight">
          {isBilGhoib && (
            <>
              <span className="inline-block font-bold text-[#1E3A8A] bg-[#F5E6D3] border border-[#D49B5B] px-1.5 py-0.5 rounded text-[10px] leading-none">
                Cream
              </span>
              <span className="text-[9px] text-[#1E3A8A] font-bold block leading-tight">
                Wali Maju Panggung
              </span>
            </>
          )}
          {isBinNadzor && (
            <span className="inline-block font-bold text-blue-900 bg-blue-100 border border-blue-300 px-1.5 py-0.5 rounded text-[10px] leading-none">
              Biru
            </span>
          )}
          {isTamatan && (
            <span className="inline-block font-bold text-blue-900 bg-blue-100 border border-blue-300 px-1.5 py-0.5 rounded text-[10px] leading-none">
              Biru
            </span>
          )}
          {isUndangan && (() => {
            const warnaUnd = item.warnaTiket ||
              getWarnaTiketUndangan(item.golonganUndangan, item.kategori) ||
              (item.golonganUndangan === 'ISTIMEWA' ? 'Cream' : 'Biru');
            const isCream = String(warnaUnd).toLowerCase().includes('cream');
            return (
              <span className={`inline-block font-bold px-1.5 py-0.5 rounded text-[10px] border leading-none ${
                isCream
                  ? 'text-[#1E3A8A] bg-[#F5E6D3] border-[#D49B5B]'
                  : 'text-blue-900 bg-blue-100 border-blue-300'
              }`}>
                {warnaUnd}
              </span>
            );
          })()}
          {item.kuotaTambahan > 0 && (
            <span className="text-rose-600 block font-semibold leading-tight">
              + {item.kuotaTambahan} Tambahan
            </span>
          )}
        </div>
      </td>

      {/* Status Hadir */}
      <td className="py-2 px-2 sm:px-2.5 text-center whitespace-nowrap">
        {item.terpakai > 0 ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 leading-tight">
            <Check className="w-3 h-3 mr-1" />
            {item.terpakai} Masuk
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 leading-tight">
            Belum Datang
          </span>
        )}
        <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">Sisa: {item.sisa}</div>
      </td>

      {/* Tombol Aksi */}
      <td className="py-2 px-2 sm:px-2.5 text-center whitespace-nowrap">
        <div className="flex items-center justify-center space-x-1">
          <button
            onClick={() => setQrDetailItem(item)}
            title="Lihat QR &amp; Kartu"
            aria-label={`Lihat QR dan kartu ${item.nama}`}
            className="p-1 rounded-md text-slate-600 hover:text-opera-850 hover:bg-opera-50 border border-transparent hover:border-opera-200 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleOpenEdit(item)}
            title="Edit Data Peserta"
            aria-label={`Ubah data ${item.nama}`}
            className="p-1 rounded-md text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
          >
            <Edit className="w-4 h-4" />
          </button>

          {item.isMerged && (
            <button
              type="button"
              disabled={item.terpakai > 0}
              onClick={() => onOpenUnmerge && onOpenUnmerge(item)}
              aria-label={`Pisahkan grup ${item.nama}`}
              title={
                item.terpakai > 0
                  ? 'Tidak dapat dipisahkan karena peserta sudah melakukan scan kehadiran.'
                  : 'Pisahkan (Unmerge) data peserta ini'
              }
              className={`p-1 rounded-md border transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
                item.terpakai > 0
                  ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                  : 'bg-white hover:bg-amber-50 text-amber-700 border-amber-300 hover:border-amber-400 cursor-pointer'
              }`}
            >
              <Unlink className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setDeletingItem(item)}
            title="Hapus Peserta"
            aria-label={`Hapus data ${item.nama}`}
            className="p-1 rounded-md text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
