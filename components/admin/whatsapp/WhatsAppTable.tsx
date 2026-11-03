'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Clock,
  Zap,
  Edit2,
} from 'lucide-react';
import { extractBagianTamatan } from '@/lib/types';
import WhatsAppFilter, { WhatsAppFilterProps } from './WhatsAppFilter';

export interface WhatsAppTableProps extends WhatsAppFilterProps {
  // Wali Santri Table Props
  loadingData: boolean;
  filteredList: any[];
  sendingKode: string | null;
  isBlasting: boolean;
  handleKirimFonnte: (kel: any) => void;
  handleKirimManualWA: (kel: any) => void;
  setEditingItem: (kel: any | null) => void;
  setNewHpInput: (val: string) => void;
  // Tamu Undangan Table Props
  loadingTamuData: boolean;
  filteredTamuList: any[];
  tamuSendingKode: string | null;
  isTamuBlasting: boolean;
  setTamuList: React.Dispatch<React.SetStateAction<any[]>>;
  handleKirimFonnteTamu: (tamu: any) => void;
  handleKirimManualWATamu: (tamu: any) => void;
  setEditingTamuItem: (tamu: any | null) => void;
  setNewHpInputTamu: (val: string) => void;
}

export default function WhatsAppTable(props: WhatsAppTableProps) {
  const {
    activeTab,
    loadingData,
    filteredList,
    sendingKode,
    isBlasting,
    handleKirimFonnte,
    handleKirimManualWA,
    setEditingItem,
    setNewHpInput,
    loadingTamuData,
    filteredTamuList,
    tamuSendingKode,
    isTamuBlasting,
    setTamuList,
    handleKirimFonnteTamu,
    handleKirimManualWATamu,
    setEditingTamuItem,
    setNewHpInputTamu,
  } = props;

  if (activeTab === 'WALI_SANTRI') {
    return (
      <div className="bg-white/40 backdrop-blur-md border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-3xl p-6 space-y-4">
        <WhatsAppFilter {...props} />

        {/* Tabel Wali */}
        <div className="overflow-x-auto rounded-2xl border border-white/40 bg-white/20">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/60 backdrop-blur-xs text-[#5C3E28] font-bold border-b border-[#D5C4B4] uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3">Kode</th>
                <th className="py-3 px-4">Nama Wali Santri &amp; HP</th>
                <th className="py-3 px-4">Sohibul Hajat &amp; Kategori</th>
                <th className="py-3 px-3 text-center">Hak Kuota</th>
                <th className="py-3 px-3 text-center">Konfirmasi Hadir</th>
                <th className="py-3 px-3 text-center">Status Kirim WA</th>
                <th className="py-3 px-4 text-center">Aksi Kirim</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loadingData ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Memuat data peserta dari database Supabase...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada data wali santri yang cocok di Supabase DB.
                  </td>
                </tr>
              ) : (
                filteredList.map((kel) => {
                  const santri = kel.santri?.[0];
                  const isInvalidNum = !kel.noHp || kel.noHp.trim().length < 8;
                  const isNoWaNotRegistered = kel.statusWa === 'NOMOR_TIDAK_TERDAFTAR';
                  const isFailed = kel.statusWa === 'GAGAL';
                  const isTerkirim = kel.statusWa === 'TERKIRIM';
                  const isSendingThis = sendingKode === kel.kode;

                  const isBilGhoib = santri?.kategoriUtama === 'BIL_GHOIB';
                  const isBinNadzor = santri?.kategoriUtama === 'BIN_NADZOR';
                  const isTamatan = santri?.kategoriUtama === 'TAMATAN';
                  const bagian = isTamatan ? extractBagianTamatan(santri?.kelas || santri?.subKategori) : '';
                  const isConfirmed = kel.estimasi?.statusKonfirmasi === 'SUDAH';

                  return (
                    <tr key={kel.id || kel.kode} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-opera-900">
                        {kel.kode}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{kel.namaWali}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                          <span>{kel.noHp || <span className="text-rose-500 font-bold">Tidak ada nomor</span>}</span>
                          {(isNoWaNotRegistered || isInvalidNum) && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingItem(kel);
                                setNewHpInput(kel.noHp || '');
                              }}
                              className="p-0.5 rounded hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                              title="Edit Nomor HP Langsung ke Supabase"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{santri?.nama}</div>
                        <div className="text-[11px] flex items-center space-x-1.5 mt-0.5">
                          <span
                            className={`font-semibold ${
                              isBilGhoib
                                ? 'text-emerald-700'
                                : isBinNadzor
                                ? 'text-blue-700'
                                : 'text-amber-800'
                            }`}
                          >
                            {isBilGhoib ? 'Bil Ghoib' : isBinNadzor ? 'Bin Nadzori' : 'Tamatan'}
                          </span>
                          {isTamatan && bagian && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                              Bagian {bagian}
                            </span>
                          )}
                          <span className="text-slate-400">· Kamar: {santri?.kamar || '-'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="font-bold text-slate-800">
                          {(kel.kuota?.kuotaDasar || 2) + (kel.kuota?.kuotaTambahan || 0)} Kursi
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 space-y-0.5">
                          {isBilGhoib && (
                            <>
                              <span className="inline-block font-bold text-[#5C3E28] bg-[#F5E6D3] border border-[#D49B5B] px-1.5 py-0.5 rounded text-[10px]">
                                Cream
                              </span>
                              <span className="text-[9px] text-[#5C3E28] font-bold block">
                                Wali Maju Panggung
                              </span>
                            </>
                          )}
                          {isBinNadzor && (
                            <span className="inline-block font-bold text-blue-900 bg-blue-100 border border-blue-300 px-1.5 py-0.5 rounded text-[10px]">
                              Biru
                            </span>
                          )}
                          {isTamatan && (
                            <span className="inline-block font-bold text-blue-900 bg-blue-100 border border-blue-300 px-1.5 py-0.5 rounded text-[10px]">
                              Biru
                            </span>
                          )}
                          {(kel.kuota?.kuotaTambahan || 0) > 0 && (
                            <span className="text-rose-600 block font-semibold">+ {kel.kuota.kuotaTambahan} Tambahan</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isConfirmed ? (
                          <span className="inline-flex flex-col items-center px-2 py-0.5 rounded-xl text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <span>✓ Sudah Konfirmasi</span>
                            <span className="font-semibold text-[9px] text-emerald-700">
                              L: {kel.estimasi?.perkiraanL ?? 0}, P: {kel.estimasi?.perkiraanP ?? 0}
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            ⏳ Belum Konfirmasi
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isTerkirim ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                            TERKIRIM
                          </span>
                        ) : isNoWaNotRegistered || isInvalidNum ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                            <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" />
                            NOMOR TIDAK TERDAFTAR
                          </span>
                        ) : isFailed ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 mr-1 text-rose-500" />
                            GAGAL
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <Clock className="w-3 h-3 mr-1 text-slate-400" />
                            BELUM
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => handleKirimFonnte(kel)}
                            disabled={isInvalidNum || isSendingThis || isBlasting}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 shadow-sm transition-all cursor-pointer ${
                              isTerkirim
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                                : 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs'
                            } disabled:opacity-40 disabled:pointer-events-none`}
                            title="Kirim otomatis lewat WhatsApp Fonnte"
                          >
                            <Zap className="w-3 h-3 fill-current text-amber-300" />
                            <span>{isSendingThis ? 'Mengirim...' : isTerkirim ? 'Kirim Ulang' : 'Kirim Fonnte'}</span>
                          </button>

                          <button
                            onClick={() => handleKirimManualWA(kel)}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-emerald-700 border border-slate-200 transition-colors cursor-pointer"
                            title="Kirim Manual via WhatsApp Web / App"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          {(isNoWaNotRegistered || isInvalidNum) && (
                            <button
                              onClick={() => {
                                setEditingItem(kel);
                                setNewHpInput(kel.noHp || '');
                              }}
                              className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-xs cursor-pointer flex items-center space-x-1"
                              title="Edit Nomor HP Langsung ke Supabase"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit HP</span>
                            </button>
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

  return (
    <div className="bg-white/40 backdrop-blur-md border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-3xl p-6 space-y-4">
      <WhatsAppFilter {...props} />

      {/* Tabel Tamu Undangan */}
      <div className="overflow-x-auto rounded-2xl border border-white/40 bg-white/20">
        <table className="w-full text-left text-xs">
          <thead className="bg-white/60 backdrop-blur-xs text-[#5C3E28] font-bold border-b border-[#D5C4B4] uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-3">Kode</th>
              <th className="py-3 px-4">Nama Penerima &amp; HP</th>
              <th className="py-3 px-4">Kategori &amp; Instansi</th>
              <th className="py-3 px-3 text-center">Warna Tiket</th>
              <th className="py-3 px-3 text-center">Status WA</th>
              <th className="py-3 px-4 text-center">Aksi Kirim</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {loadingTamuData ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  Memuat data tamu undangan dari database Supabase...
                </td>
              </tr>
            ) : filteredTamuList.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  Tidak ada data tamu undangan yang cocok di Supabase DB.
                </td>
              </tr>
            ) : (
              filteredTamuList.map((tamu) => {
                const isInvalidNum = !tamu.noHp || tamu.noHp.trim().length < 8;
                const isNoWaNotRegistered = tamu.statusWa === 'NOMOR_TIDAK_TERDAFTAR';
                const isFailed = tamu.statusWa === 'GAGAL';
                const isTerkirim = tamu.statusWa === 'TERKIRIM';
                const isSendingThis = tamuSendingKode === tamu.kode;
                const isSendDisabled = isInvalidNum || isSendingThis || isTamuBlasting;

                const isIstimewa = tamu.golongan === 'ISTIMEWA';
                const isKehormatan = tamu.golongan === 'KEHORMATAN';

                return (
                  <tr key={tamu.id || tamu.kode} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-amber-900">
                      {tamu.kode}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{tamu.nama}</div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                        <span>{tamu.noHp || <span className="text-rose-500 font-bold">Tidak ada nomor</span>}</span>
                        {(isNoWaNotRegistered || isInvalidNum) && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTamuItem(tamu);
                              setNewHpInputTamu(tamu.noHp || '');
                            }}
                            className="p-0.5 rounded hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                            title="Edit Nomor HP Langsung ke Supabase"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{tamu.kategori}</div>
                      <div className="text-[11px] flex items-center space-x-1.5 mt-0.5">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            isIstimewa
                              ? 'bg-purple-100 text-purple-900 border border-purple-200'
                              : isKehormatan
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {tamu.golongan}
                        </span>
                        <span className="text-slate-400">· {tamu.instansi}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {(() => {
                        const rawWarna = tamu.warnaTiket || 'Biru';
                        const isCream = String(rawWarna).toLowerCase().includes('cream');
                        return (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isCream
                              ? 'bg-[#F5E6D3] text-[#5C3E28] border-[#D49B5B]'
                              : 'bg-blue-100 text-blue-900 border-blue-300'
                          }`}>
                            {rawWarna}
                          </span>
                        );
                      })()}
                    </td>

                    {/* Status WA */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {isTerkirim ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                          TERKIRIM
                        </span>
                      ) : isNoWaNotRegistered || isInvalidNum ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                          <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" />
                          NOMOR TIDAK TERDAFTAR
                        </span>
                      ) : isFailed ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 mr-1 text-rose-500" />
                          GAGAL
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <Clock className="w-3 h-3 mr-1 text-slate-400" />
                          BELUM
                        </span>
                      )}
                    </td>

                    {/* Aksi Kirim */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleKirimFonnteTamu(tamu)}
                          disabled={isSendDisabled}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 shadow-sm transition-all cursor-pointer ${
                            isTerkirim
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                              : 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs'
                          } disabled:opacity-40 disabled:pointer-events-none`}
                          title="Kirim otomatis lewat WhatsApp Fonnte"
                        >
                          <Zap className="w-3 h-3 fill-current text-amber-300" />
                          <span>{isSendingThis ? 'Mengirim...' : isTerkirim ? 'Kirim Ulang' : 'Kirim Fonnte'}</span>
                        </button>

                        <button
                          onClick={() => handleKirimManualWATamu(tamu)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-emerald-700 border border-slate-200 transition-colors cursor-pointer"
                          title="Kirim Manual via WhatsApp Web / App"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>

                        {(isNoWaNotRegistered || isInvalidNum) && (
                          <button
                            onClick={() => {
                              setEditingTamuItem(tamu);
                              setNewHpInputTamu(tamu.noHp || '');
                            }}
                            className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-xs cursor-pointer flex items-center space-x-1"
                            title="Edit Nomor HP Langsung ke Supabase"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit HP</span>
                          </button>
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
