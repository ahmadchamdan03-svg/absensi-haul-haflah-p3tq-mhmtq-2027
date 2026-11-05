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
    <div className="bg-white/50 backdrop-blur-md rounded-3xl p-4 sm:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-[#1D4ED8]/40 space-y-6 print:bg-white print:p-0 print:border-none print:shadow-none">
      {/* Kop Resmi Lembar Rekap Panitia */}
      <div className="text-center pb-4 sm:pb-6 border-b-2 border-[#1D4ED8] space-y-2">
        <div className="flex justify-center items-center gap-2 sm:gap-3 mb-2 drop-shadow-xs">
          <img src="/images/logo-p3tq.png" alt="Logo P3TQ" className="h-9 sm:h-12 w-auto object-contain" />
          <img src="/images/logo-haul-black.png" alt="Kaligrafi Haul Haflah" className="h-8 sm:h-10 w-auto object-contain" />
          <img src="/images/logo-mhmtq.png" alt="Logo MHMTQ" className="h-9 sm:h-12 w-auto object-contain" />
        </div>
        <h2
          style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.9), -1px -1px 2px rgba(255,255,255,0.9)' }}
          className="text-base sm:text-xl font-serif font-black text-[#0A192F] uppercase tracking-tight leading-snug drop-shadow-xs"
        >
          LEMBAR REKAPITULASI PRESENSI HAUL &amp; HAFLAH 1448 H / 2027 M
        </h2>
        <p
          style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.85), -1px -1px 2px rgba(255,255,255,0.85)' }}
          className="text-[11px] sm:text-xs font-black text-[#0A192F] leading-tight"
        >
          PONDOK PESANTREN PUTRI TAHFIZHIL QUR-AN (P3TQ) — MADRASAH HIDAYATUL MUBTADI-AAT FITTAHFIZHI WAL QIRO-AT (MHMTQ) LIRBOYO KEDIRI
        </p>
        <p
          style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.8)' }}
          className="text-[10px] sm:text-[11px] text-[#0F2C59] font-bold"
        >
          Jl. HM. Winarto, Campurejo, Kec. Mojoroto, Kabupaten Kediri, Jawa Timur 64117
        </p>
        <div
          style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.8)' }}
          className="text-[11px] text-[#0A192F] font-bold flex flex-wrap justify-center items-center gap-2 sm:gap-3"
        >
          <span>Hari/Tanggal: <strong>Sabtu, 24 Rajab 1448 H. / 02 Januari 2027 M.</strong></span>
          <span>·</span>
          <span>Gerbang Masuk: <strong>Gerbang Selatan Bola Dunia</strong></span>
          <span>·</span>
          <span>Total Siswi: <strong>{subtotalSantri.sh} Santri Terdaftar</strong> ({countBilGhoib} Bil Ghoib · {countBinNadzor} Bin Nadzori · {countTamatan} Tamatan)</span>
        </div>
      </div>

      {/* TABEL BLOK 1: WALI SANTRI SHOHIBUL HAJAT */}
      <div className="space-y-2">
        <div className="font-serif font-black text-xs text-[#0A192F] uppercase tracking-wide bg-[#E0F2FE]/90 p-2.5 rounded-xl border border-[#1D4ED8]/60 flex items-center justify-between shadow-2xs">
          <span>BLOK 1: WALI SANTRI SHOHIBUL HAJAT ({subtotalSantri.sh} SANTRI TERDAFTAR)</span>
          <span className="text-[11px] font-normal normal-case text-[#1D4ED8] no-print">
            💡 Klik baris untuk melihat rincian santri yang sudah absen
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border-[1.5px] border-[#1D4ED8]/70">
            <thead className="bg-[#E0F2FE]/95 text-[#0A192F] font-black border-b-[1.5px] border-[#1D4ED8]/70">
              <tr>
                <th className="p-2 border border-[#1D4ED8]/60 w-10 text-center">NO</th>
                <th className="p-2 border border-[#1D4ED8]/60">KATEGORI (LABEL REKAP)</th>
                <th className="p-2 border border-[#1D4ED8]/60 text-center">WARNA TIKET</th>
                <th className="p-2 border border-[#1D4ED8]/60 text-center">JUMLAH SH</th>
                <th className="p-2 border border-[#1D4ED8]/60 text-center">WS. LAKI-LAKI</th>
                <th className="p-2 border border-[#1D4ED8]/60 text-center">WS. PEREMPUAN</th>
                <th className="p-2 border border-[#1D4ED8]/60 text-center font-black">TOTAL HADIR</th>
                <th className="p-2 border border-[#1D4ED8]/60 text-center">TOTAL KUOTA</th>
                <th className="p-2 border border-[#1D4ED8]/60 text-center font-black">PROSENTASE</th>
              </tr>
            </thead>
            <tbody>
              {blokSantri.map((row) => (
                <tr
                  key={row.no}
                  onClick={() => onSelectCategory(row.kategori)}
                  className="hover:bg-[#E0F2FE]/60 cursor-pointer transition-colors group"
                  title="Klik untuk melihat siapa saja santri yang sudah absen masuk"
                >
                  <td className="p-2 border border-[#1D4ED8]/60 text-center font-mono">{row.no}</td>
                  <td className="p-2 border border-[#1D4ED8]/60 font-medium text-[#0A192F]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="group-hover:text-[#1D4ED8] group-hover:font-bold transition-colors">{row.kategori}</span>
                      <span className="no-print opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-[#1D4ED8] font-semibold bg-[#F0F9FF] px-1.5 py-0.5 rounded border border-[#BAE6FD]">
                        <Eye className="w-3 h-3" />
                        <span>Lihat Hadir</span>
                      </span>
                    </div>
                  </td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center font-semibold">
                    {row.warna ? (
                      <span
                        className={
                          row.warna.toLowerCase().includes('biru')
                            ? 'text-blue-700 font-bold'
                            : row.warna.toLowerCase().includes('kuning')
                            ? 'text-amber-700 font-bold'
                            : row.warna.toLowerCase().includes('hijau')
                            ? 'text-blue-700 font-bold'
                            : row.warna.toLowerCase().includes('merah')
                            ? 'text-rose-700 font-bold'
                            : row.warna.toLowerCase().includes('hitam')
                            ? 'text-[#0A192F] font-black'
                            : 'text-[#0F2C59]'
                        }
                      >
                        {row.warna}
                      </span>
                    ) : (
                      <span className="text-slate-300"></span>
                    )}
                  </td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center font-bold">{row.sh}</td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center text-blue-800 font-bold">{row.l}</td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center text-pink-800 font-bold">{row.p}</td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center font-black text-[#0A192F]">{row.total}</td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center font-bold text-[#0F2C59]">{row.kuota}</td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center font-black text-blue-800">
                    {row.pct}%
                  </td>
                </tr>
              ))}
              {/* Subtotal Baris Santri */}
              <tr className="bg-sky-100/90 font-black text-[#0A192F] border-t-2 border-[#1D4ED8]/70">
                <td colSpan={3} className="p-2.5 border border-[#1D4ED8]/60 text-right font-black">
                  SUBTOTAL WALI SANTRI SHOHIBUL HAJAT ({subtotalSantri.sh} SANTRI):
                </td>
                <td className="p-2.5 border border-[#1D4ED8]/60 text-center font-black">{subtotalSantri.sh}</td>
                <td className="p-2.5 border border-[#1D4ED8]/60 text-center font-black text-blue-900">{subtotalSantri.l}</td>
                <td className="p-2.5 border border-[#1D4ED8]/60 text-center font-black text-pink-900">{subtotalSantri.p}</td>
                <td className="p-2.5 border border-[#1D4ED8]/60 text-center font-black text-[#0A192F]">{subtotalSantri.total}</td>
                <td className="p-2.5 border border-[#1D4ED8]/60 text-center font-bold text-[#0F2C59]">{subtotalSantri.kuota}</td>
                <td className="p-2.5 border border-[#1D4ED8]/60 text-center font-black text-blue-900">{pctSubtotalSantri}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* TABEL BLOK 2: KUOTA TAMBAHAN (300) */}
      <div className="space-y-2">
        <div className="font-serif font-black text-xs text-[#0A192F] uppercase tracking-wide bg-[#E0F2FE]/90 p-2.5 rounded-xl border border-[#1D4ED8]/60 flex items-center justify-between shadow-2xs">
          <span>BLOK 2: KUOTA TAMBAHAN (300)</span>
          <span className="text-[11px] font-normal normal-case text-[#1D4ED8] no-print">
            💡 Klik baris untuk melihat rincian pemesan yang sudah absen
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border-[1.5px] border-[#1D4ED8]/70">
            <tbody>
              {blokTambahan.map((row) => (
                <tr
                  key={row.no}
                  onClick={() => onSelectCategory(row.kategori)}
                  className="hover:bg-[#E0F2FE]/60 cursor-pointer transition-colors group font-medium"
                  title="Klik untuk melihat siapa saja santri pembeli kuota tambahan yang sudah absen masuk"
                >
                  <td className="p-2 border border-[#1D4ED8]/60 w-10 text-center font-mono">{row.no}</td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-[#0A192F] font-bold">
                    <div className="flex items-center justify-between gap-2">
                      <span className="group-hover:text-[#1D4ED8] transition-colors">{row.kategori}</span>
                      <span className="no-print opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-[#1D4ED8] font-semibold bg-[#F0F9FF] px-1.5 py-0.5 rounded border border-[#BAE6FD]">
                        <Eye className="w-3 h-3" />
                        <span>Lihat Hadir</span>
                      </span>
                    </div>
                  </td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center text-pink-700 font-semibold">{row.warna}</td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center font-bold">{row.sh}</td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center text-blue-800 font-bold">{row.l}</td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center text-pink-800 font-bold">{row.p}</td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center font-black text-[#0A192F]">{row.total}</td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center font-bold text-[#0F2C59]">{row.kuota}</td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center font-black text-blue-800">
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
        <div className="font-serif font-black text-xs text-[#0A192F] uppercase tracking-wide bg-[#E0F2FE]/90 p-2.5 rounded-xl border border-[#1D4ED8]/60 flex items-center justify-between shadow-2xs">
          <span>BLOK 3: TAMU UNDANGAN ({subtotalUndangan.sh} TAMU TERDAFTAR)</span>
          <span className="text-[11px] font-normal normal-case text-[#1D4ED8] no-print">
            💡 Klik baris untuk melihat rincian tamu VIP yang sudah absen
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border-[1.5px] border-[#1D4ED8]/70">
            <thead className="bg-[#E0F2FE]/95 text-[#0A192F] font-black border-b-[1.5px] border-[#1D4ED8]/70">
              <tr>
                <th className="p-2 border border-[#1D4ED8]/60 w-10 text-center">NO</th>
                <th className="p-2 border border-[#1D4ED8]/60 font-black text-[#1D4ED8]">KATEGORI UTAMA</th>
                <th className="p-2 border border-[#1D4ED8]/60">RINCIAN SUB-KATEGORI (LABEL REKAP)</th>
                <th className="p-2 border border-[#1D4ED8]/60 text-center">WARNA TIKET</th>
                <th className="p-2 border border-[#1D4ED8]/60 text-center">JUMLAH TAMU</th>
                <th className="p-2 border border-[#1D4ED8]/60 text-center">TAMU LAKI-LAKI</th>
                <th className="p-2 border border-[#1D4ED8]/60 text-center">TAMU PEREMPUAN</th>
                <th className="p-2 border border-[#1D4ED8]/60 text-center font-black">TOTAL HADIR</th>
                <th className="p-2 border border-[#1D4ED8]/60 text-center">TOTAL KUOTA</th>
                <th className="p-2 border border-[#1D4ED8]/60 text-center font-black">PROSENTASE</th>
              </tr>
            </thead>
            <tbody>
              {/* ── KATEGORI UTAMA 1: TAMU ISTIMEWA ── */}
              <tr className="bg-sky-200/80 font-black text-[#0A192F] text-xs border border-[#1D4ED8]/60">
                <td colSpan={10} className="p-2 border border-[#1D4ED8]/60 tracking-wide font-black text-[#0A192F]">
                  ▸ KATEGORI UTAMA 1 — TAMU ISTIMEWA (VVIP / VIP IDS / BANI / BLITAR / BANDAR)
                </td>
              </tr>
              {rowsIstimewa.map((row) => (
                <tr
                  key={row.no}
                  onClick={() => onSelectCategory(row.kategori)}
                  className="hover:bg-[#E0F2FE]/60 cursor-pointer transition-colors group font-medium"
                  title="Klik untuk melihat rincian tamu hadir"
                >
                  <td className="p-2 border border-[#1D4ED8]/60 w-10 text-center font-mono">{row.no}</td>
                  <td className="p-2 border border-[#1D4ED8]/60 font-bold text-blue-950">{row.kategoriUtama}</td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-[#0A192F] font-bold">
                    <div className="flex items-center justify-between gap-2">
                      <span className="group-hover:text-[#1D4ED8] transition-colors">{row.kategori}</span>
                      <span className="no-print opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-[#1D4ED8] font-semibold bg-[#F0F9FF] px-1.5 py-0.5 rounded border border-[#BAE6FD]">
                        <Eye className="w-3 h-3" />
                        <span>Lihat Hadir</span>
                      </span>
                    </div>
                  </td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center font-semibold">
                    {row.warna ? (
                      <span
                        className={
                          row.warna.toLowerCase().includes('merah')
                            ? 'text-rose-700 font-bold'
                            : row.warna.toLowerCase().includes('hitam')
                            ? 'text-[#0A192F] font-black'
                            : 'text-[#0F2C59]'
                        }
                      >
                        {row.warna}
                      </span>
                    ) : (
                      <span className="text-slate-300"></span>
                    )}
                  </td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center font-bold">{row.sh}</td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center text-blue-800 font-bold">{row.l}</td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center text-pink-800 font-bold">{row.p}</td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center font-black text-[#0A192F]">{row.total}</td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center font-bold text-[#0F2C59]">{row.kuota}</td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center font-black text-blue-800">{row.pct}%</td>
                </tr>
              ))}
              <tr className="bg-sky-100/90 font-black text-[#0A192F] text-xs border-b-2 border-[#1D4ED8]/70">
                <td colSpan={4} className="p-2.5 border border-[#1D4ED8]/60 text-right font-black">
                  SUBTOTAL TAMU ISTIMEWA ({subtotalIstimewa.sh} TAMU):
                </td>
                <td className="p-2.5 border border-[#1D4ED8]/60 text-center font-black">{subtotalIstimewa.sh}</td>
                <td className="p-2.5 border border-[#1D4ED8]/60 text-center font-black text-blue-900">{subtotalIstimewa.l}</td>
                <td className="p-2.5 border border-[#1D4ED8]/60 text-center font-black text-pink-900">{subtotalIstimewa.p}</td>
                <td className="p-2.5 border border-[#1D4ED8]/60 text-center font-black text-[#0A192F]">{subtotalIstimewa.total}</td>
                <td className="p-2.5 border border-[#1D4ED8]/60 text-center font-bold text-[#0F2C59]">{subtotalIstimewa.kuota}</td>
                <td className="p-2.5 border border-[#1D4ED8]/60 text-center font-black text-blue-900">{pctIstimewa}%</td>
              </tr>

              {/* ── KATEGORI UTAMA 2: TAMU KEHORMATAN ── */}
              <tr className="bg-[#BAE6FD]/80 font-black text-[#0A192F] text-xs border border-[#1D4ED8]/60">
                <td colSpan={10} className="p-2 border border-[#1D4ED8]/60 tracking-wide font-black text-[#0A192F]">
                  ▸ KATEGORI UTAMA 2 — TAMU KEHORMATAN (MASYAYIKH / TOKOH / PENGASUH)
                </td>
              </tr>
              {rowsKehormatan.map((row) => (
                <tr
                  key={row.no}
                  onClick={() => onSelectCategory(row.kategori)}
                  className="hover:bg-[#E0F2FE]/60 cursor-pointer transition-colors group font-medium"
                  title="Klik untuk melihat rincian tamu hadir"
                >
                  <td className="p-2 border border-[#1D4ED8]/60 w-10 text-center font-mono">{row.no}</td>
                  <td className="p-2 border border-[#1D4ED8]/60 font-bold text-[#1D4ED8]">{row.kategoriUtama}</td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-[#0A192F] font-bold">
                    <div className="flex items-center justify-between gap-2">
                      <span className="group-hover:text-[#1D4ED8] transition-colors">{row.kategori}</span>
                      <span className="no-print opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-[#1D4ED8] font-semibold bg-[#F0F9FF] px-1.5 py-0.5 rounded border border-[#BAE6FD]">
                        <Eye className="w-3 h-3" />
                        <span>Lihat Hadir</span>
                      </span>
                    </div>
                  </td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center font-semibold">
                    {row.warna ? (
                      <span
                        className={
                          row.warna.toLowerCase().includes('merah')
                            ? 'text-rose-700 font-bold'
                            : row.warna.toLowerCase().includes('hitam')
                            ? 'text-[#0A192F] font-black'
                            : 'text-[#0F2C59]'
                        }
                      >
                        {row.warna}
                      </span>
                    ) : (
                      <span className="text-slate-300"></span>
                    )}
                  </td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center font-bold">{row.sh}</td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center text-blue-800 font-bold">{row.l}</td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center text-pink-800 font-bold">{row.p}</td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center font-black text-[#0A192F]">{row.total}</td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center font-bold text-[#0F2C59]">{row.kuota}</td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center font-black text-blue-800">{row.pct}%</td>
                </tr>
              ))}
              <tr className="bg-sky-100/90 font-black text-[#0A192F] text-xs border-b-2 border-[#1D4ED8]/70">
                <td colSpan={4} className="p-2.5 border border-[#1D4ED8]/60 text-right font-black">
                  SUBTOTAL TAMU KEHORMATAN ({subtotalKehormatan.sh} TAMU):
                </td>
                <td className="p-2.5 border border-[#1D4ED8]/60 text-center font-black">{subtotalKehormatan.sh}</td>
                <td className="p-2.5 border border-[#1D4ED8]/60 text-center font-black text-blue-900">{subtotalKehormatan.l}</td>
                <td className="p-2.5 border border-[#1D4ED8]/60 text-center font-black text-pink-900">{subtotalKehormatan.p}</td>
                <td className="p-2.5 border border-[#1D4ED8]/60 text-center font-black text-[#0A192F]">{subtotalKehormatan.total}</td>
                <td className="p-2.5 border border-[#1D4ED8]/60 text-center font-bold text-[#0F2C59]">{subtotalKehormatan.kuota}</td>
                <td className="p-2.5 border border-[#1D4ED8]/60 text-center font-black text-blue-900">{pctKehormatan}%</td>
              </tr>

              {/* ── KATEGORI UTAMA 3: TAMU UMUM ── */}
              <tr className="bg-[#E0F2FE]/90 font-black text-[#0A192F] text-xs border border-[#1D4ED8]/60">
                <td colSpan={10} className="p-2 border border-[#1D4ED8]/60 tracking-wide font-black text-[#0A192F]">
                  ▸ KATEGORI UTAMA 3 — TAMU UMUM (ASATIDZ / MUSTAHIQ / PENGAJAR / PENGUJI / PERWAKILAN)
                </td>
              </tr>
              {rowsUmum.map((row) => (
                <tr
                  key={row.no}
                  onClick={() => onSelectCategory(row.kategori)}
                  className="hover:bg-[#E0F2FE]/60 cursor-pointer transition-colors group font-medium"
                  title="Klik untuk melihat rincian tamu hadir"
                >
                  <td className="p-2 border border-[#1D4ED8]/60 w-10 text-center font-mono">{row.no}</td>
                  <td className="p-2 border border-[#1D4ED8]/60 font-bold text-[#0F2C59]">{row.kategoriUtama}</td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-[#0A192F] font-bold">
                    <div className="flex items-center justify-between gap-2">
                      <span className="group-hover:text-[#1D4ED8] transition-colors">{row.kategori}</span>
                      <span className="no-print opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-[#1D4ED8] font-semibold bg-[#F0F9FF] px-1.5 py-0.5 rounded border border-[#BAE6FD]">
                        <Eye className="w-3 h-3" />
                        <span>Lihat Hadir</span>
                      </span>
                    </div>
                  </td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center font-semibold">
                    {row.warna ? (
                      <span
                        className={
                          row.warna.toLowerCase().includes('merah')
                            ? 'text-rose-700 font-bold'
                            : row.warna.toLowerCase().includes('hitam')
                            ? 'text-[#0A192F] font-black'
                            : 'text-[#0F2C59]'
                        }
                      >
                        {row.warna}
                      </span>
                    ) : (
                      <span className="text-slate-300"></span>
                    )}
                  </td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center font-bold">{row.sh}</td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center text-blue-800 font-bold">{row.l}</td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center text-pink-800 font-bold">{row.p}</td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center font-black text-[#0A192F]">{row.total}</td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center font-bold text-[#0F2C59]">{row.kuota}</td>
                  <td className="p-2 border border-[#1D4ED8]/60 text-center font-black text-blue-800">{row.pct}%</td>
                </tr>
              ))}
              <tr className="bg-sky-100/90 font-black text-[#0A192F] text-xs border-b-2 border-[#1D4ED8]/70">
                <td colSpan={4} className="p-2.5 border border-[#1D4ED8]/60 text-right font-black">
                  SUBTOTAL TAMU UMUM ({subtotalUmum.sh} TAMU):
                </td>
                <td className="p-2.5 border border-[#1D4ED8]/60 text-center font-black">{subtotalUmum.sh}</td>
                <td className="p-2.5 border border-[#1D4ED8]/60 text-center font-black text-blue-900">{subtotalUmum.l}</td>
                <td className="p-2.5 border border-[#1D4ED8]/60 text-center font-black text-pink-900">{subtotalUmum.p}</td>
                <td className="p-2.5 border border-[#1D4ED8]/60 text-center font-black text-[#0A192F]">{subtotalUmum.total}</td>
                <td className="p-2.5 border border-[#1D4ED8]/60 text-center font-bold text-[#0F2C59]">{subtotalUmum.kuota}</td>
                <td className="p-2.5 border border-[#1D4ED8]/60 text-center font-black text-blue-900">{pctUmum}%</td>
              </tr>

              {/* Subtotal Baris Tamu Undangan Keseluruhan */}
              <tr className="bg-[#BAE6FD]/90 font-black text-[#0A192F] text-xs border-t-2 border-[#1D4ED8] shadow-xs">
                <td colSpan={4} className="p-2.5 border border-[#1D4ED8]/70 text-right font-black">
                  SUBTOTAL TAMU UNDANGAN KESELURUHAN ({subtotalUndangan.sh} TAMU):
                </td>
                <td className="p-2.5 border border-[#1D4ED8]/70 text-center font-black">{subtotalUndangan.sh}</td>
                <td className="p-2.5 border border-[#1D4ED8]/70 text-center text-blue-900 font-black">{subtotalUndangan.l}</td>
                <td className="p-2.5 border border-[#1D4ED8]/70 text-center text-pink-900 font-black">{subtotalUndangan.p}</td>
                <td className="p-2.5 border border-[#1D4ED8]/70 text-center text-[#0A192F] font-black">{subtotalUndangan.total}</td>
                <td className="p-2.5 border border-[#1D4ED8]/70 text-center font-bold text-[#0F2C59]">{subtotalUndangan.kuota}</td>
                <td className="p-2.5 border border-[#1D4ED8]/70 text-center text-blue-900 font-black">{pctSubtotalUndangan}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Kolom Tanda Tangan Panitia */}
      <div className="pt-8 grid grid-cols-2 text-center text-xs text-[#0A192F] font-medium border-t border-[#1D4ED8]/40">
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
