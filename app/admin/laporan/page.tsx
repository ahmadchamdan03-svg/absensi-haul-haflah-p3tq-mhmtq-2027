'use client';

import { useState, useEffect } from 'react';
import { Printer, Download, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  fetchLaporanDataFromSupabase,
  computeLaporanThreeBlocks,
  exportLaporanRekapExcel,
} from '@/lib/laporan-rekap';
import { LaporanTables } from '@/components/admin/laporan/LaporanTables';
import { LaporanDetailModal } from '@/components/admin/laporan/LaporanDetailModal';

export default function LaporanPage() {
  const [santriList, setSantriList] = useState<any[]>([]);
  const [tamuList, setTamuList] = useState<any[]>([]);
  const [presensiLogs, setPresensiLogs] = useState<any[]>([]);
  const [, setLoading] = useState(true);

  const [modalKategori, setModalKategori] = useState<string | null>(null);
  const [modalSearch, setModalSearch] = useState<string>('');
  const [modalTab, setModalTab] = useState<'HADIR' | 'BELUM_HADIR'>('HADIR');

  const fetchLaporanData = async () => {
    try {
      const data = await fetchLaporanDataFromSupabase();
      setSantriList(data.santriList);
      setTamuList(data.tamuList);
      setPresensiLogs(data.presensiLogs);
    } catch (e) {
      console.error('Error fetching laporan data:', e);
      setSantriList([]);
      setTamuList([]);
      setPresensiLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaporanData();
    const interval = setInterval(fetchLaporanData, 60000);

    const channel = supabase
      .channel('laporan_page_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'peserta_santri' }, fetchLaporanData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tamu_undangan' }, fetchLaporanData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presensi_log' }, fetchLaporanData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pembelian_kuota' }, fetchLaporanData)
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const {
    blokSantri,
    subtotalSantri,
    pctSubtotalSantri,
    blokTambahan,
    blokUndangan,
    subtotalUndangan,
    pctSubtotalUndangan,
    rowsIstimewa,
    rowsKehormatan,
    rowsUmum,
    subtotalIstimewa,
    pctIstimewa,
    subtotalKehormatan,
    pctKehormatan,
    subtotalUmum,
    pctUmum,
    countBilGhoib,
    countBinNadzor,
    countTamatan,
  } = computeLaporanThreeBlocks(santriList, tamuList, presensiLogs);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    exportLaporanRekapExcel(
      blokSantri,
      subtotalSantri,
      pctSubtotalSantri,
      blokTambahan,
      blokUndangan,
      subtotalUndangan,
      pctSubtotalUndangan
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* HEADER DAN AKSI UTAMA (NO-PRINT) */}
      <div className="bg-gradient-to-r from-[#FAF7F3] via-[#EFE8E1] to-[#FAF7F3] text-[#422F21] rounded-3xl p-4 sm:p-6 shadow-sm border-2 border-[#8C6A47]/40 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="min-w-0">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF7F3] text-[#8C6A47] text-[10px] sm:text-xs font-serif font-black border-2 border-[#D49B5B] max-w-full truncate">
            <Sparkles className="w-3 h-3 text-[#D49B5B] shrink-0" />
            <span className="truncate">DOKUMEN RESMI REKAPITULASI PRESENSI</span>
          </div>
          <h1 className="text-lg sm:text-2xl font-serif font-black mt-2 tracking-tight text-[#422F21] leading-tight">
            Rekap &amp; Ekspor Laporan Presensi Realtime
          </h1>
          <p className="text-xs text-[#7A624E] mt-1 font-medium leading-relaxed">
            Format rekapitulasi sesuai dokumen resmi Haul &amp; Haflah 2.0 (Blok Santri, Kuota Tambahan 300, &amp; Tamu Undangan terstruktur per Kategori Utama).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full md:w-auto shrink-0">
          <button
            onClick={handleExportExcel}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow border border-emerald-700 flex items-center justify-center space-x-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Excel (.xlsx)</span>
          </button>
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white font-bold text-xs shadow border border-[#735334] flex items-center justify-center space-x-2 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rekap Fisik</span>
          </button>
        </div>
      </div>

      {/* DOKUMEN REKAP RESMI (SIAP CETAK) */}
      <LaporanTables
        subtotalSantri={subtotalSantri}
        countBilGhoib={countBilGhoib}
        countBinNadzor={countBinNadzor}
        countTamatan={countTamatan}
        blokSantri={blokSantri}
        pctSubtotalSantri={pctSubtotalSantri}
        blokTambahan={blokTambahan}
        subtotalUndangan={subtotalUndangan}
        rowsIstimewa={rowsIstimewa}
        subtotalIstimewa={subtotalIstimewa}
        pctIstimewa={pctIstimewa}
        rowsKehormatan={rowsKehormatan}
        subtotalKehormatan={subtotalKehormatan}
        pctKehormatan={pctKehormatan}
        rowsUmum={rowsUmum}
        subtotalUmum={subtotalUmum}
        pctUmum={pctUmum}
        pctSubtotalUndangan={pctSubtotalUndangan}
        onSelectCategory={(kat) => {
          setModalKategori(kat);
          setModalSearch('');
        }}
      />

      {/* MODAL DETAIL RINCIAN KATEGORI */}
      <LaporanDetailModal
        modalKategori={modalKategori}
        setModalKategori={setModalKategori}
        modalSearch={modalSearch}
        setModalSearch={setModalSearch}
        modalTab={modalTab}
        setModalTab={setModalTab}
        santriList={santriList}
        tamuList={tamuList}
        presensiLogs={presensiLogs}
      />
    </div>
  );
}
