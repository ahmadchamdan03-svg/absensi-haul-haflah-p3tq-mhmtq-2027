'use client';

import React from 'react';
import {
  Trash2,
  Edit,
  QrCode,
  Phone,
  UserCheck,
  Check,
} from 'lucide-react';
import { store } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';
import { getWarnaTiketUndangan } from '@/lib/types';

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

    const { error: errUpdate } = await supabase
      .from('tamu_undangan')
      .update({ kuota_terpakai: totalKuotaItem })
      .eq('kode', item.kode);

    if (errUpdate) console.warn('Fast track update error:', errUpdate);

    await supabase.from('presensi_log').insert([
      {
        kode_qr: item.kode,
        nama_peserta: item.nama,
        tipe_peserta: 'UNDANGAN',
        jalur: 'MEJA_TRANSIT',
        panitia_id: 'fast-track-vip',
        jumlah_l: jumlahL,
        jumlah_p: jumlahP,
        jumlah_balita: 0,
        tiket_panggung: '0',
        catatan: 'Fast-Track VIP Checkin',
        created_at: new Date().toISOString(),
      },
    ]);

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
}

export default function SantriTableRow({
  item,
  globalIndex,
  fastTrackLoading,
  handleFastTrackVip,
  setQrDetailItem,
  handleOpenEdit,
  setDeletingItem,
}: SantriTableRowProps) {
  const isBilGhoib = item.kategoriUtama === 'BIL_GHOIB';
  const isBinNadzor = item.kategoriUtama === 'BIN_NADZOR';
  const isTamatan = item.kategoriUtama === 'TAMATAN';
  const isUndangan = item.tipe === 'UNDANGAN';

  return (
    <tr className="hover:bg-slate-50/80 transition-colors">
      {/* No */}
      <td className="py-3 px-4 text-center text-slate-400 font-mono">{globalIndex}</td>

      {/* Kode QR & Kartu Modal */}
      <td className="py-3 px-4 whitespace-nowrap">
        <button
          onClick={() => setQrDetailItem(item)}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-mono font-bold text-xs bg-slate-100 hover:bg-opera-50 hover:text-opera-850 hover:border-opera-300 border border-slate-200 transition-colors group"
        >
          <QrCode className="w-3.5 h-3.5 text-slate-500 group-hover:text-opera-700" />
          <span>{item.kode}</span>
        </button>
      </td>

      {/* Nama & Kamar */}
      <td className="py-3 px-4">
        <div className="font-bold text-slate-900 leading-snug">{item.nama}</div>
        {item.kamar && item.kamar !== '-' && (
          <div className="text-[11px] text-slate-500">Kamar: {item.kamar}</div>
        )}
        {isUndangan &&
          item.golonganUndangan === 'ISTIMEWA' &&
          item.namaPutra &&
          item.namaPutri && (
            <div className="text-[10px] text-amber-800/80 mt-0.5 font-medium flex items-center space-x-1">
              <span>🤵 {item.namaPutra}</span>
              <span>·</span>
              <span>🧕 {item.namaPutri}</span>
            </div>
          )}
      </td>

      {/* Kategori & Bagian */}
      <td className="py-3 px-4">
        <div className="flex items-center space-x-1.5">
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full ${
              isBilGhoib
                ? 'bg-emerald-500'
                : isBinNadzor
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
          <span className="font-bold text-slate-800">
            {isBilGhoib
              ? 'Bil Ghoib'
              : isBinNadzor
              ? 'Bin Nadzori'
              : isTamatan
              ? 'Tamatan'
              : item.golonganUndangan === 'ISTIMEWA'
              ? 'Undangan Istimewa'
              : item.golonganUndangan === 'KEHORMATAN'
              ? 'Undangan Kehormatan'
              : 'Undangan Umum'}
          </span>
        </div>
        {isTamatan && item.bagianTamatan && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 mt-0.5">
            Bagian {item.bagianTamatan}
          </span>
        )}
        {isUndangan && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border mt-0.5 ${
              item.golonganUndangan === 'ISTIMEWA'
                ? 'bg-amber-50 text-amber-900 border-amber-300'
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
      </td>

      {/* Wali Santri / Alamat & Kontak */}
      <td className="py-3 px-4">
        <div className="text-slate-800 font-medium">
          {isUndangan ? (
            item.golonganUndangan === 'ISTIMEWA' ? (
              <span className="text-amber-900 font-semibold flex items-center space-x-1">
                <span>📍 {item.alamat || item.instansi || 'Kediri'}</span>
              </span>
            ) : item.golonganUndangan === 'KEHORMATAN' ? (
              <span className="text-purple-950 font-semibold flex items-center space-x-1">
                <span>📍 {item.alamat || item.instansi || 'Kediri'}</span>
              </span>
            ) : (
              <div>
                <div className="font-semibold text-slate-800">
                  {item.instansi || 'Pondok Pesantren Lirboyo'}
                </div>
                {item.alamat && item.alamat !== '-' && item.alamat !== item.instansi && (
                  <div className="text-[11px] text-slate-500 font-normal">
                    📍 {item.alamat}
                  </div>
                )}
              </div>
            )
          ) : (
            item.namaWali
          )}
        </div>
        <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
          {item.noHp && item.noHp !== '-' && (
            <a
              href={`https://wa.me/${item.noHp.replace(/^0/, '62')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center text-emerald-700 hover:underline"
            >
              <Phone className="w-3 h-3 mr-0.5" />
              <span>{item.noHp}</span>
            </a>
          )}
          {item.alamat && !isUndangan && <span>· {item.alamat}</span>}
          {isUndangan &&
            item.golonganUndangan === 'ISTIMEWA' &&
            (item.namaPutra || item.namaPutri) && (
              <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                {item.namaPutra && item.namaPutri
                  ? 'Putra & Putri'
                  : item.namaPutra
                  ? 'Putra'
                  : 'Putri'}
              </span>
            )}
        </div>
      </td>

      {/* Hak Kuota */}
      <td className="py-3 px-4 text-center whitespace-nowrap">
        <div className="font-bold text-slate-800">
          {item.kuotaDasar + item.kuotaTambahan} Kursi
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5 space-y-0.5">
          {isBilGhoib && (
            <>
              <span className="inline-block font-bold text-slate-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded text-[10px]">
                Hitam Gold
              </span>
              <span className="text-[9px] text-amber-800 font-bold block">
                Wali Maju Panggung
              </span>
            </>
          )}
          {isBinNadzor && (
            <span className="inline-block font-bold text-rose-900 bg-rose-100 border border-rose-300 px-1.5 py-0.5 rounded text-[10px]">
              Merah Gold
            </span>
          )}
          {isTamatan && (
            <span className="inline-block font-bold text-rose-900 bg-rose-100 border border-rose-300 px-1.5 py-0.5 rounded text-[10px]">
              Merah Gold
            </span>
          )}
          {isUndangan && (
            <span className="inline-block font-bold text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[10px]">
              {item.warnaTiket ||
                getWarnaTiketUndangan(item.golonganUndangan, item.kategori) ||
                (item.golonganUndangan === 'ISTIMEWA' ? 'Hitam Gold' : 'Merah Gold')}
            </span>
          )}
          {item.kuotaTambahan > 0 && (
            <span className="text-rose-600 block font-semibold">
              + {item.kuotaTambahan} Tambahan
            </span>
          )}
        </div>
      </td>

      {/* Status Hadir */}
      <td className="py-3 px-4 text-center whitespace-nowrap">
        {item.terpakai > 0 ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Check className="w-3 h-3 mr-1" />
            {item.terpakai} Masuk
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">
            Belum Datang
          </span>
        )}
        <div className="text-[10px] text-slate-400 mt-0.5">Sisa: {item.sisa}</div>
      </td>

      {/* Tombol Aksi */}
      <td className="py-3 px-4 text-center whitespace-nowrap">
        <div className="flex items-center justify-center space-x-1.5">
          {isUndangan &&
            (item.terpakai === 0 ? (
              <button
                onClick={() => handleFastTrackVip(item)}
                disabled={fastTrackLoading === item.kode}
                title="Fast-Track VIP: Hadirkan beliau langsung tanpa scan QR gerbang"
                className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-[11px] shadow-xs flex items-center space-x-1 transition-all active:scale-95 disabled:opacity-50"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Hadirkan VIP</span>
              </button>
            ) : (
              <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[10px] flex items-center space-x-1">
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Hadir</span>
              </span>
            ))}

          <button
            onClick={() => setQrDetailItem(item)}
            title="Lihat QR & Kartu"
            className="p-1.5 rounded-lg text-slate-600 hover:text-opera-850 hover:bg-opera-50 border border-transparent hover:border-opera-200 transition-colors"
          >
            <QrCode className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleOpenEdit(item)}
            title="Edit Data Peserta"
            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>

          <button
            onClick={() => setDeletingItem(item)}
            title="Hapus Peserta"
            className="p-1.5 rounded-lg text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
