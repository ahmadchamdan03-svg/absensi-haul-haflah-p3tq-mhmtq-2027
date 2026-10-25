'use client';

import React from 'react';
import { Eye } from 'lucide-react';

export function LaporanTables({
  subtotalSantri,
  countBilGhoib,
  countBinNadzor,
  countTamatan,
  blokSantri,
  pctSubtotalSantri,
  blokTambahan,
  subtotalUndangan,
  rowsIstimewa,
  subtotalIstimewa,
  pctIstimewa,
  rowsKehormatan,
  subtotalKehormatan,
  pctKehormatan,
  rowsUmum,
  subtotalUmum,
  pctUmum,
  pctSubtotalUndangan,
  onSelectCategory,
}: {
  subtotalSantri: { sh: number; l: number; p: number; total: number; kuota: number };
  countBilGhoib: number;
  countBinNadzor: number;
  countTamatan: number;
  blokSantri: any[];
  pctSubtotalSantri: number;
  blokTambahan: any[];
  subtotalUndangan: { sh: number; l: number; p: number; total: number; kuota: number };
  rowsIstimewa: any[];
  subtotalIstimewa: { sh: number; l: number; p: number; total: number; kuota: number };
  pctIstimewa: number;
  rowsKehormatan: any[];
  subtotalKehormatan: { sh: number; l: number; p: number; total: number; kuota: number };
  pctKehormatan: number;
  rowsUmum: any[];
  subtotalUmum: { sh: number; l: number; p: number; total: number; kuota: number };
  pctUmum: number;
  pctSubtotalUndangan: number;
  onSelectCategory: (kategori: string) => void;
}) {
  return (
    <div className="bg-white rounded-3xl p-4 sm:p-10 shadow-sm border border-slate-200 space-y-6 print:p-0 print:border-none print:shadow-none">
      {/* Kop Resmi Lembar Rekap Panitia */}
      <div className="text-center pb-4 sm:pb-6 border-b-2 border-slate-900 space-y-2">
        <div className="flex justify-center items-center gap-2 sm:gap-3 mb-2">
          <img src="/images/logo-p3tq.png" alt="Logo P3TQ" className="h-9 sm:h-12 w-auto object-contain" />
          <img src="/images/logo-haul-black.png" alt="Kaligrafi Haul Haflah" className="h-8 sm:h-10 w-auto object-contain" />
          <img src="/images/logo-mhmtq.png" alt="Logo MHMTQ" className="h-9 sm:h-12 w-auto object-contain" />
        </div>
        <h2 className="text-base sm:text-xl font-serif font-black text-slate-900 uppercase tracking-tight leading-snug">
          LEMBAR REKAPITULASI PRESENSI HAUL &amp; HAFLAH 1448 H / 2027 M
        </h2>
        <p className="text-[11px] sm:text-xs font-bold text-slate-700 leading-tight">
          PONDOK PESANTREN PUTRI TAHFIZHIL QUR-AN (P3TQ) — MADRASAH HIDAYATUL MUBTADI-AAT FITTAHFIZHI WAL QIRO-AT (MHMTQ) LIRBOYO KEDIRI
        </p>
        <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
          Jl. HM. Winarto, Campurejo, Kec. Mojoroto, Kabupaten Kediri, Jawa Timur 64117
        </p>
        <div className="text-[11px] text-slate-500 flex justify-center items-center gap-3">
          <span>Hari/Tanggal: Sabtu, 24 Rajab 1448 H. / 02 Januari 2027 M.</span>
          <span>·</span>
          <span>Gerbang Masuk: Gerbang Selatan Bola Dunia</span>
          <span>·</span>
          <span>Total Siswi: {subtotalSantri.sh} Santri Terdaftar ({countBilGhoib} Bil Ghoib · {countBinNadzor} Bin Nadzori · {countTamatan} Tamatan)</span>
        </div>
      </div>

      {/* TABEL BLOK 1: WALI SANTRI SHOHIBUL HAJAT */}
      <div className="space-y-2">
        <div className="font-serif font-bold text-xs text-slate-900 uppercase tracking-wide bg-slate-100 p-2.5 rounded-xl border border-slate-300 flex items-center justify-between">
          <span>BLOK 1: WALI SANTRI SHOHIBUL HAJAT ({subtotalSantri.sh} SANTRI TERDAFTAR)</span>
          <span className="text-[11px] font-normal normal-case text-[#8C6A47] no-print">
            💡 Klik baris untuk melihat rincian santri yang sudah absen
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-slate-300">
            <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
              <tr>
                <th className="p-2 border border-slate-300 w-10 text-center">NO</th>
                <th className="p-2 border border-slate-300">KATEGORI (LABEL REKAP)</th>
                <th className="p-2 border border-slate-300 text-center">WARNA TIKET</th>
                <th className="p-2 border border-slate-300 text-center">JUMLAH SH</th>
                <th className="p-2 border border-slate-300 text-center">WS. LAKI-LAKI</th>
                <th className="p-2 border border-slate-300 text-center">WS. PEREMPUAN</th>
                <th className="p-2 border border-slate-300 text-center font-black">TOTAL HADIR</th>
                <th className="p-2 border border-slate-300 text-center">TOTAL KUOTA</th>
                <th className="p-2 border border-slate-300 text-center font-black">PROSENTASE</th>
              </tr>
            </thead>
            <tbody>
              {blokSantri.map((row) => (
                <tr
                  key={row.no}
                  onClick={() => onSelectCategory(row.kategori)}
                  className="hover:bg-[#EFE8E1]/60 cursor-pointer transition-colors group"
                  title="Klik untuk melihat siapa saja santri yang sudah absen masuk"
                >
                  <td className="p-2 border border-slate-300 text-center font-mono">{row.no}</td>
                  <td className="p-2 border border-slate-300 font-medium text-slate-900">
                    <div className="flex items-center justify-between gap-2">
                      <span className="group-hover:text-[#8C6A47] group-hover:font-bold transition-colors">{row.kategori}</span>
                      <span className="no-print opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-[#8C6A47] font-semibold bg-[#FAF7F3] px-1.5 py-0.5 rounded border border-[#D5C4B4]">
                        <Eye className="w-3 h-3" />
                        <span>Lihat Hadir</span>
                      </span>
                    </div>
                  </td>
                  <td className="p-2 border border-slate-300 text-center font-semibold">
                    {row.warna ? (
                      <span
                        className={
                          row.warna.toLowerCase().includes('biru')
                            ? 'text-blue-700 font-bold'
                            : row.warna.toLowerCase().includes('kuning')
                            ? 'text-amber-700 font-bold'
                            : row.warna.toLowerCase().includes('hijau')
                            ? 'text-emerald-700 font-bold'
                            : row.warna.toLowerCase().includes('merah')
                            ? 'text-rose-700 font-bold'
                            : row.warna.toLowerCase().includes('hitam')
                            ? 'text-slate-900 font-black'
                            : 'text-slate-700'
                        }
                      >
                        {row.warna}
                      </span>
                    ) : (
                      <span className="text-slate-300"></span>
                    )}
                  </td>
                  <td className="p-2 border border-slate-300 text-center font-bold">{row.sh}</td>
                  <td className="p-2 border border-slate-300 text-center text-blue-800 font-bold">{row.l}</td>
                  <td className="p-2 border border-slate-300 text-center text-pink-800 font-bold">{row.p}</td>
                  <td className="p-2 border border-slate-300 text-center font-black text-slate-900">{row.total}</td>
                  <td className="p-2 border border-slate-300 text-center font-bold text-slate-700">{row.kuota}</td>
                  <td className="p-2 border border-slate-300 text-center font-black text-emerald-800">
                    {row.pct}%
                  </td>
                </tr>
              ))}
              {/* Subtotal Baris Santri */}
              <tr className="bg-slate-200 font-black text-slate-900">
                <td colSpan={3} className="p-2 border border-slate-300 text-right">
                  SUBTOTAL WALI SANTRI SHOHIBUL HAJAT ({subtotalSantri.sh} SANTRI):
                </td>
                <td className="p-2 border border-slate-300 text-center">{subtotalSantri.sh}</td>
                <td className="p-2 border border-slate-300 text-center">{subtotalSantri.l}</td>
                <td className="p-2 border border-slate-300 text-center">{subtotalSantri.p}</td>
                <td className="p-2 border border-slate-300 text-center">{subtotalSantri.total}</td>
                <td className="p-2 border border-slate-300 text-center">{subtotalSantri.kuota}</td>
                <td className="p-2 border border-slate-300 text-center">{pctSubtotalSantri}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* TABEL BLOK 2: KUOTA TAMBAHAN (300) */}
      <div className="space-y-2">
        <div className="font-serif font-bold text-xs text-slate-900 uppercase tracking-wide bg-slate-100 p-2.5 rounded-xl border border-slate-300 flex items-center justify-between">
          <span>BLOK 2: KUOTA TAMBAHAN (300)</span>
          <span className="text-[11px] font-normal normal-case text-[#8C6A47] no-print">
            💡 Klik baris untuk melihat rincian pemesan yang sudah absen
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-slate-300">
            <tbody>
              {blokTambahan.map((row) => (
                <tr
                  key={row.no}
                  onClick={() => onSelectCategory(row.kategori)}
                  className="hover:bg-[#EFE8E1]/60 cursor-pointer transition-colors group font-medium"
                  title="Klik untuk melihat siapa saja santri pembeli kuota tambahan yang sudah absen masuk"
                >
                  <td className="p-2 border border-slate-300 w-10 text-center font-mono">{row.no}</td>
                  <td className="p-2 border border-slate-300 text-slate-900 font-bold">
                    <div className="flex items-center justify-between gap-2">
                      <span className="group-hover:text-[#8C6A47] transition-colors">{row.kategori}</span>
                      <span className="no-print opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-[#8C6A47] font-semibold bg-[#FAF7F3] px-1.5 py-0.5 rounded border border-[#D5C4B4]">
                        <Eye className="w-3 h-3" />
                        <span>Lihat Hadir</span>
                      </span>
                    </div>
                  </td>
                  <td className="p-2 border border-slate-300 text-center text-pink-700 font-semibold">{row.warna}</td>
                  <td className="p-2 border border-slate-300 text-center font-bold">{row.sh}</td>
                  <td className="p-2 border border-slate-300 text-center text-blue-800 font-bold">{row.l}</td>
                  <td className="p-2 border border-slate-300 text-center text-pink-800 font-bold">{row.p}</td>
                  <td className="p-2 border border-slate-300 text-center font-black text-slate-900">{row.total}</td>
                  <td className="p-2 border border-slate-300 text-center font-bold text-slate-700">{row.kuota}</td>
                  <td className="p-2 border border-slate-300 text-center font-black text-emerald-800">
                    {row.pct}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TABEL BLOK 3: TAMU UNDANGAN (TERSTRUKTUR PER KATEGORI UTAMA) */}
      <div className="space-y-2">
        <div className="font-serif font-bold text-xs text-slate-900 uppercase tracking-wide bg-slate-100 p-2.5 rounded-xl border border-slate-300 flex items-center justify-between">
          <span>BLOK 3: TAMU UNDANGAN ({subtotalUndangan.sh} TAMU TERDAFTAR)</span>
          <span className="text-[11px] font-normal normal-case text-[#8C6A47] no-print">
            💡 Klik baris untuk melihat rincian tamu VIP yang sudah absen
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-slate-300">
            <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
              <tr>
                <th className="p-2 border border-slate-300 w-10 text-center">NO</th>
                <th className="p-2 border border-slate-300 font-black text-[#8C6A47]">KATEGORI UTAMA</th>
                <th className="p-2 border border-slate-300">RINCIAN SUB-KATEGORI (LABEL REKAP)</th>
                <th className="p-2 border border-slate-300 text-center">WARNA TIKET</th>
                <th className="p-2 border border-slate-300 text-center">JUMLAH TAMU</th>
                <th className="p-2 border border-slate-300 text-center">TAMU LAKI-LAKI</th>
                <th className="p-2 border border-slate-300 text-center">TAMU PEREMPUAN</th>
                <th className="p-2 border border-slate-300 text-center font-black">TOTAL HADIR</th>
                <th className="p-2 border border-slate-300 text-center">TOTAL KUOTA</th>
                <th className="p-2 border border-slate-300 text-center font-black">PROSENTASE</th>
              </tr>
            </thead>
            <tbody>
              {/* ── KATEGORI UTAMA 1: TAMU ISTIMEWA ── */}
              <tr className="bg-amber-100/90 font-black text-amber-950 text-xs">
                <td colSpan={10} className="p-2 border border-slate-300 tracking-wide">
                  ▸ KATEGORI UTAMA 1 — TAMU ISTIMEWA (VVIP / VIP IDS / BANI / BLITAR / BANDAR)
                </td>
              </tr>
              {rowsIstimewa.map((row) => (
                <tr
                  key={row.no}
                  onClick={() => onSelectCategory(row.kategori)}
                  className="hover:bg-[#EFE8E1]/60 cursor-pointer transition-colors group font-medium"
                  title="Klik untuk melihat rincian tamu hadir"
                >
                  <td className="p-2 border border-slate-300 w-10 text-center font-mono">{row.no}</td>
                  <td className="p-2 border border-slate-300 font-bold text-amber-900">{row.kategoriUtama}</td>
                  <td className="p-2 border border-slate-300 text-slate-900 font-bold">
                    <div className="flex items-center justify-between gap-2">
                      <span className="group-hover:text-[#8C6A47] transition-colors">{row.kategori}</span>
                      <span className="no-print opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-[#8C6A47] font-semibold bg-[#FAF7F3] px-1.5 py-0.5 rounded border border-[#D5C4B4]">
                        <Eye className="w-3 h-3" />
                        <span>Lihat Hadir</span>
                      </span>
                    </div>
                  </td>
                  <td className="p-2 border border-slate-300 text-center font-semibold">
                    {row.warna ? (
                      <span
                        className={
                          row.warna.toLowerCase().includes('merah')
                            ? 'text-rose-700 font-bold'
                            : row.warna.toLowerCase().includes('hitam')
                            ? 'text-slate-900 font-black'
                            : 'text-slate-700'
                        }
                      >
                        {row.warna}
                      </span>
                    ) : (
                      <span className="text-slate-300"></span>
                    )}
                  </td>
                  <td className="p-2 border border-slate-300 text-center font-bold">{row.sh}</td>
                  <td className="p-2 border border-slate-300 text-center text-blue-800 font-bold">{row.l}</td>
                  <td className="p-2 border border-slate-300 text-center text-pink-800 font-bold">{row.p}</td>
                  <td className="p-2 border border-slate-300 text-center font-black text-slate-900">{row.total}</td>
                  <td className="p-2 border border-slate-300 text-center font-bold text-slate-700">{row.kuota}</td>
                  <td className="p-2 border border-slate-300 text-center font-black text-emerald-800">{row.pct}%</td>
                </tr>
              ))}
              <tr className="bg-amber-50 font-black text-amber-950 text-xs border-b-2 border-slate-300">
                <td colSpan={4} className="p-2 border border-slate-300 text-right">
                  SUBTOTAL TAMU ISTIMEWA ({subtotalIstimewa.sh} TAMU):
                </td>
                <td className="p-2 border border-slate-300 text-center">{subtotalIstimewa.sh}</td>
                <td className="p-2 border border-slate-300 text-center">{subtotalIstimewa.l}</td>
                <td className="p-2 border border-slate-300 text-center">{subtotalIstimewa.p}</td>
                <td className="p-2 border border-slate-300 text-center">{subtotalIstimewa.total}</td>
                <td className="p-2 border border-slate-300 text-center">{subtotalIstimewa.kuota}</td>
                <td className="p-2 border border-slate-300 text-center text-emerald-800">{pctIstimewa}%</td>
              </tr>

              {/* ── KATEGORI UTAMA 2: TAMU KEHORMATAN ── */}
              <tr className="bg-[#EFE8E1] font-black text-[#422F21] text-xs">
                <td colSpan={10} className="p-2 border border-slate-300 tracking-wide">
                  ▸ KATEGORI UTAMA 2 — TAMU KEHORMATAN (MASYAYIKH / TOKOH / PENGASUH)
                </td>
              </tr>
              {rowsKehormatan.map((row) => (
                <tr
                  key={row.no}
                  onClick={() => onSelectCategory(row.kategori)}
                  className="hover:bg-[#EFE8E1]/60 cursor-pointer transition-colors group font-medium"
                  title="Klik untuk melihat rincian tamu hadir"
                >
                  <td className="p-2 border border-slate-300 w-10 text-center font-mono">{row.no}</td>
                  <td className="p-2 border border-slate-300 font-bold text-[#8C6A47]">{row.kategoriUtama}</td>
                  <td className="p-2 border border-slate-300 text-slate-900 font-bold">
                    <div className="flex items-center justify-between gap-2">
                      <span className="group-hover:text-[#8C6A47] transition-colors">{row.kategori}</span>
                      <span className="no-print opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-[#8C6A47] font-semibold bg-[#FAF7F3] px-1.5 py-0.5 rounded border border-[#D5C4B4]">
                        <Eye className="w-3 h-3" />
                        <span>Lihat Hadir</span>
                      </span>
                    </div>
                  </td>
                  <td className="p-2 border border-slate-300 text-center font-semibold">
                    {row.warna ? (
                      <span
                        className={
                          row.warna.toLowerCase().includes('merah')
                            ? 'text-rose-700 font-bold'
                            : row.warna.toLowerCase().includes('hitam')
                            ? 'text-slate-900 font-black'
                            : 'text-slate-700'
                        }
                      >
                        {row.warna}
                      </span>
                    ) : (
                      <span className="text-slate-300"></span>
                    )}
                  </td>
                  <td className="p-2 border border-slate-300 text-center font-bold">{row.sh}</td>
                  <td className="p-2 border border-slate-300 text-center text-blue-800 font-bold">{row.l}</td>
                  <td className="p-2 border border-slate-300 text-center text-pink-800 font-bold">{row.p}</td>
                  <td className="p-2 border border-slate-300 text-center font-black text-slate-900">{row.total}</td>
                  <td className="p-2 border border-slate-300 text-center font-bold text-slate-700">{row.kuota}</td>
                  <td className="p-2 border border-slate-300 text-center font-black text-emerald-800">{row.pct}%</td>
                </tr>
              ))}
              <tr className="bg-[#FAF7F3] font-black text-[#422F21] text-xs border-b-2 border-slate-300">
                <td colSpan={4} className="p-2 border border-slate-300 text-right">
                  SUBTOTAL TAMU KEHORMATAN ({subtotalKehormatan.sh} TAMU):
                </td>
                <td className="p-2 border border-slate-300 text-center">{subtotalKehormatan.sh}</td>
                <td className="p-2 border border-slate-300 text-center">{subtotalKehormatan.l}</td>
                <td className="p-2 border border-slate-300 text-center">{subtotalKehormatan.p}</td>
                <td className="p-2 border border-slate-300 text-center">{subtotalKehormatan.total}</td>
                <td className="p-2 border border-slate-300 text-center">{subtotalKehormatan.kuota}</td>
                <td className="p-2 border border-slate-300 text-center text-emerald-800">{pctKehormatan}%</td>
              </tr>

              {/* ── KATEGORI UTAMA 3: TAMU UMUM ── */}
              <tr className="bg-slate-200 font-black text-slate-900 text-xs">
                <td colSpan={10} className="p-2 border border-slate-300 tracking-wide">
                  ▸ KATEGORI UTAMA 3 — TAMU UMUM (ASATIDZ / MUSTAHIQ / PENGAJAR / PENGUJI / PERWAKILAN)
                </td>
              </tr>
              {rowsUmum.map((row) => (
                <tr
                  key={row.no}
                  onClick={() => onSelectCategory(row.kategori)}
                  className="hover:bg-[#EFE8E1]/60 cursor-pointer transition-colors group font-medium"
                  title="Klik untuk melihat rincian tamu hadir"
                >
                  <td className="p-2 border border-slate-300 w-10 text-center font-mono">{row.no}</td>
                  <td className="p-2 border border-slate-300 font-bold text-slate-700">{row.kategoriUtama}</td>
                  <td className="p-2 border border-slate-300 text-slate-900 font-bold">
                    <div className="flex items-center justify-between gap-2">
                      <span className="group-hover:text-[#8C6A47] transition-colors">{row.kategori}</span>
                      <span className="no-print opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-[#8C6A47] font-semibold bg-[#FAF7F3] px-1.5 py-0.5 rounded border border-[#D5C4B4]">
                        <Eye className="w-3 h-3" />
                        <span>Lihat Hadir</span>
                      </span>
                    </div>
                  </td>
                  <td className="p-2 border border-slate-300 text-center font-semibold">
                    {row.warna ? (
                      <span
                        className={
                          row.warna.toLowerCase().includes('merah')
                            ? 'text-rose-700 font-bold'
                            : row.warna.toLowerCase().includes('hitam')
                            ? 'text-slate-900 font-black'
                            : 'text-slate-700'
                        }
                      >
                        {row.warna}
                      </span>
                    ) : (
                      <span className="text-slate-300"></span>
                    )}
                  </td>
                  <td className="p-2 border border-slate-300 text-center font-bold">{row.sh}</td>
                  <td className="p-2 border border-slate-300 text-center text-blue-800 font-bold">{row.l}</td>
                  <td className="p-2 border border-slate-300 text-center text-pink-800 font-bold">{row.p}</td>
                  <td className="p-2 border border-slate-300 text-center font-black text-slate-900">{row.total}</td>
                  <td className="p-2 border border-slate-300 text-center font-bold text-slate-700">{row.kuota}</td>
                  <td className="p-2 border border-slate-300 text-center font-black text-emerald-800">{row.pct}%</td>
                </tr>
              ))}
              <tr className="bg-slate-100 font-black text-slate-900 text-xs border-b-2 border-slate-300">
                <td colSpan={4} className="p-2 border border-slate-300 text-right">
                  SUBTOTAL TAMU UMUM ({subtotalUmum.sh} TAMU):
                </td>
                <td className="p-2 border border-slate-300 text-center">{subtotalUmum.sh}</td>
                <td className="p-2 border border-slate-300 text-center">{subtotalUmum.l}</td>
                <td className="p-2 border border-slate-300 text-center">{subtotalUmum.p}</td>
                <td className="p-2 border border-slate-300 text-center">{subtotalUmum.total}</td>
                <td className="p-2 border border-slate-300 text-center">{subtotalUmum.kuota}</td>
                <td className="p-2 border border-slate-300 text-center text-emerald-800">{pctUmum}%</td>
              </tr>

              {/* Subtotal Baris Tamu Undangan Keseluruhan */}
              <tr className="bg-slate-300 font-black text-slate-950 text-xs border-t-2 border-slate-400">
                <td colSpan={4} className="p-2.5 border border-slate-400 text-right">
                  SUBTOTAL TAMU UNDANGAN KESELURUHAN ({subtotalUndangan.sh} TAMU):
                </td>
                <td className="p-2.5 border border-slate-400 text-center">{subtotalUndangan.sh}</td>
                <td className="p-2.5 border border-slate-400 text-center text-blue-900">{subtotalUndangan.l}</td>
                <td className="p-2.5 border border-slate-400 text-center text-pink-900">{subtotalUndangan.p}</td>
                <td className="p-2.5 border border-slate-400 text-center text-slate-950 font-black">{subtotalUndangan.total}</td>
                <td className="p-2.5 border border-slate-400 text-center font-bold">{subtotalUndangan.kuota}</td>
                <td className="p-2.5 border border-slate-400 text-center text-emerald-900 font-black">{pctSubtotalUndangan}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Kolom Tanda Tangan Panitia */}
      <div className="pt-8 grid grid-cols-2 text-center text-xs text-slate-800 font-medium">
        <div>
          <p>Mengetahui,</p>
          <p className="font-bold mt-1">Ketua Panitia Haul &amp; Haflah</p>
          <div className="h-16"></div>
          <p className="font-bold underline">( Sinta Maelani )</p>
        </div>
        <div>
          <p>Kediri, 02 Januari 2027</p>
          <p className="font-bold mt-1">Koordinator Presensi &amp; Rekonsiliasi</p>
          <div className="h-16"></div>
          <p className="font-bold underline">( Ahmad Chamdan Yuwafi )</p>
        </div>
      </div>
    </div>
  );
}
