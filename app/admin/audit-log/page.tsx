'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Download,
  Calendar,
  User,
  Shield,
  FileText,
  Eye,
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  ArrowRight,
  Clock,
  Tag,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AuditLogDbRow, AksiAudit } from '@/lib/types';
import AuthGuard from '@/components/AuthGuard';
import * as XLSX from 'xlsx';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogDbRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAksi, setSelectedAksi] = useState<string>('SEMUA');
  const [selectedTabel, setSelectedTabel] = useState<string>('SEMUA');
  const [selectedPanitia, setSelectedPanitia] = useState<string>('SEMUA');
  const [quickFilter, setQuickFilter] = useState<'SEMUA' | 'ABSENSI' | 'KOREKSI' | 'KUOTA' | 'DATA'>('SEMUA');
  const [dateFilter, setDateFilter] = useState<string>(() => {
    // Default: Hari ini dalam format YYYY-MM-DD (Asia/Jakarta)
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Modal Detail State
  const [selectedLogDetail, setSelectedLogDetail] = useState<AuditLogDbRow | null>(null);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      const { data, error } = await query;
      if (!error && data) {
        setLogs(data);
      } else {
        console.warn('Failed to fetch audit logs:', error);
        setLogs([]);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  // Filter list panitia unik untuk dropdown
  const listPanitia = useMemo(() => {
    const setP = new Set<string>();
    logs.forEach((l) => {
      if (l.panitia_id) setP.add(l.panitia_id);
    });
    return Array.from(setP);
  }, [logs]);

  // Filter Data
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Quick Filter
      if (quickFilter === 'ABSENSI' && log.aksi !== 'TANDAI_HADIR') return false;
      if (quickFilter === 'KOREKSI' && log.aksi !== 'BATALKAN_HADIR') return false;
      if (quickFilter === 'KUOTA' && !['VERIFIKASI_KUOTA', 'TOLAK_KUOTA', 'REFUND_KUOTA', 'TOGGLE_KUOTA_SWITCH'].includes(log.aksi)) return false;
      if (quickFilter === 'DATA' && !['EDIT_PESERTA', 'EDIT_TAMU', 'TAMBAH_PESERTA', 'TAMBAH_TAMU', 'HAPUS_PESERTA', 'HAPUS_TAMU'].includes(log.aksi)) return false;

      // 2. Filter Aksi Specific
      if (selectedAksi !== 'SEMUA' && log.aksi !== selectedAksi) return false;

      // 3. Filter Tabel Specific
      if (selectedTabel !== 'SEMUA' && log.tabel !== selectedTabel) return false;

      // 4. Filter Panitia Specific
      if (selectedPanitia !== 'SEMUA' && log.panitia_id !== selectedPanitia) return false;

      // 5. Filter Tanggal
      if (dateFilter && log.created_at) {
        const logDate = new Date(log.created_at).toISOString().split('T')[0];
        if (logDate !== dateFilter) return false;
      }

      // 6. Filter Search Term (Kode, Nama, Catatan, Field)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchKode = log.kode?.toLowerCase().includes(term);
        const matchNama = log.nama?.toLowerCase().includes(term);
        const matchCatatan = log.catatan?.toLowerCase().includes(term);
        const matchField = log.field?.toLowerCase().includes(term);
        const matchPanitia = log.panitia_id?.toLowerCase().includes(term);

        if (!matchKode && !matchNama && !matchCatatan && !matchField && !matchPanitia) {
          return false;
        }
      }

      return true;
    });
  }, [logs, quickFilter, selectedAksi, selectedTabel, selectedPanitia, dateFilter, searchTerm]);

  // Ekspor CSV / Excel
  const handleExport = () => {
    if (filteredLogs.length === 0) {
      alert('Tidak ada data audit log untuk diekspor!');
      return;
    }

    const dataToExport = filteredLogs.map((l, idx) => ({
      No: idx + 1,
      Waktu: l.created_at ? new Date(l.created_at).toLocaleString('id-ID') : '',
      'Panitia ID': l.panitia_id || 'SYSTEM',
      Role: l.panitia_role || 'PANITIA',
      Aksi: l.aksi,
      Tabel: l.tabel || '-',
      Kode: l.kode || '-',
      Nama: l.nama || '-',
      Field: l.field || '-',
      'Nilai Lama': l.nilai_lama || '-',
      'Nilai Baru': l.nilai_baru || '-',
      Catatan: l.catatan || '-',
      'User Agent': l.user_agent || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Audit Log');
    XLSX.writeFile(wb, `Audit_Log_Haflah_2027_${dateFilter || 'all'}.xlsx`);
  };

  // Helper Badge Aksi
  const renderAksiBadge = (aksi: string) => {
    switch (aksi) {
      case 'TANDAI_HADIR':
      case 'VERIFIKASI_KUOTA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            <span>{aksi}</span>
          </span>
        );
      case 'BATALKAN_HADIR':
      case 'TOLAK_KUOTA':
      case 'REFUND_KUOTA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-700" />
            <span>{aksi}</span>
          </span>
        );
      case 'EDIT_PESERTA':
      case 'EDIT_TAMU':
      case 'EDIT_KUOTA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
            <Tag className="w-3 h-3 text-amber-700" />
            <span>{aksi}</span>
          </span>
        );
      case 'TAMBAH_PESERTA':
      case 'TAMBAH_TAMU':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-900 border border-blue-300">
            <Layers className="w-3 h-3 text-blue-700" />
            <span>{aksi}</span>
          </span>
        );
      case 'HAPUS_PESERTA':
      case 'HAPUS_TAMU':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-stone-800 text-rose-300 border border-rose-900">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>{aksi}</span>
          </span>
        );
      case 'TOGGLE_KUOTA_SWITCH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-100 text-purple-900 border border-purple-300">
            <RefreshCw className="w-3 h-3 text-purple-700" />
            <span>{aksi}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-stone-100 text-stone-800 border border-stone-300">
            <span>{aksi}</span>
          </span>
        );
    }
  };

  return (
    <AuthGuard allowedRoles={['ADMIN', 'PIMPINAN']}>
      <div className="min-h-screen bg-[#FAF7F3] text-[#422F21] pb-24 font-sans selection:bg-[#8C6A47]/20 selection:text-[#422F21]">
        {/* HEADER HALAMAN AUDIT LOG */}
        <header className="bg-white border-b border-[#D5C4B4] sticky top-0 z-20 px-4 py-4 shadow-xs">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-[#8C6A47] shrink-0">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-serif font-bold text-lg md:text-xl text-[#422F21] leading-tight">
                  Audit Log &amp; Riwayat Perubahan System
                </h1>
                <p className="text-xs text-stone-500 font-medium">
                  Jejak audit otomatis seluruh aksi perubahan data, presensi, &amp; verifikasi kuota (Read-Only)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchAuditLogs}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Data</span>
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="px-4 py-2 rounded-xl bg-[#8C6A47] hover:bg-[#725436] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ekspor Excel</span>
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6 space-y-5">
          {/* QUICK FILTER BAR (SECTION F) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-bold text-[#8C6A47] shrink-0 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Quick Filter:</span>
            </span>
            <button
              type="button"
              onClick={() => setQuickFilter('SEMUA')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                quickFilter === 'SEMUA'
                  ? 'bg-[#422F21] text-white shadow-xs'
                  : 'bg-white text-stone-600 border border-stone-300 hover:bg-stone-50'
              }`}
            >
              Semua Log ({logs.length})
            </button>
            <button
              type="button"
              onClick={() => setQuickFilter('ABSENSI')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                quickFilter === 'ABSENSI'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              ✓ Absensi (TANDAI_HADIR)
            </button>
            <button
              type="button"
              onClick={() => setQuickFilter('KOREKSI')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                quickFilter === 'KOREKSI'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-900 border border-rose-300 hover:bg-rose-100'
              }`}
            >
              ⚠️ Koreksi (BATALKAN_HADIR)
            </button>
            <button
              type="button"
              onClick={() => setQuickFilter('KUOTA')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                quickFilter === 'KUOTA'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
              }`}
            >
              🎟️ Pembelian &amp; Verifikasi Kuota
            </button>
            <button
              type="button"
              onClick={() => setQuickFilter('DATA')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                quickFilter === 'DATA'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-900 border border-blue-300 hover:bg-blue-100'
              }`}
            >
              👤 Perubahan Data Peserta
            </button>
          </div>

          {/* PANEL FILTER FORM DETAIL */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E8DFD5] shadow-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <label className="block text-[11px] font-bold text-stone-600 mb-1">Cari Kode / Nama / Catatan</label>
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ketik SH0042, UND0117, nama..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#8C6A47]"
                />
              </div>
            </div>

            {/* Filter Tanggal */}
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">Rentang Tanggal</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#8C6A47]"
              />
            </div>

            {/* Filter Aksi */}
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">Jenis Aksi</label>
              <select
                value={selectedAksi}
                onChange={(e) => setSelectedAksi(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#8C6A47]"
              >
                <option value="SEMUA">Semua Jenis Aksi</option>
                <option value="TANDAI_HADIR">TANDAI_HADIR</option>
                <option value="BATALKAN_HADIR">BATALKAN_HADIR</option>
                <option value="EDIT_PESERTA">EDIT_PESERTA</option>
                <option value="EDIT_TAMU">EDIT_TAMU</option>
                <option value="TAMBAH_PESERTA">TAMBAH_PESERTA</option>
                <option value="TAMBAH_TAMU">TAMBAH_TAMU</option>
                <option value="HAPUS_PESERTA">HAPUS_PESERTA</option>
                <option value="HAPUS_TAMU">HAPUS_TAMU</option>
                <option value="VERIFIKASI_KUOTA">VERIFIKASI_KUOTA</option>
                <option value="TOLAK_KUOTA">TOLAK_KUOTA</option>
                <option value="TOGGLE_KUOTA_SWITCH">TOGGLE_KUOTA_SWITCH</option>
              </select>
            </div>

            {/* Filter Panitia */}
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">Petugas Panitia</label>
              <select
                value={selectedPanitia}
                onChange={(e) => setSelectedPanitia(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#8C6A47]"
              >
                <option value="SEMUA">Semua Petugas</option>
                {listPanitia.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* TABEL HASIL AUDIT LOG */}
          <div className="bg-white rounded-2xl border border-[#E8DFD5] shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-[#FAF7F3] border-b border-[#E8DFD5] flex items-center justify-between">
              <span className="text-xs font-bold text-[#5C3E28]">
                Menampilkan <span className="text-[#8C6A47] font-extrabold">{filteredLogs.length}</span> catatan audit log
              </span>
              {dateFilter && (
                <button
                  type="button"
                  onClick={() => setDateFilter('')}
                  className="text-[11px] font-bold text-rose-700 hover:underline cursor-pointer"
                >
                  Tampilkan Semua Tanggal ✕
                </button>
              )}
            </div>

            {loading ? (
              <div className="py-20 text-center text-stone-500 font-medium">
                <RefreshCw className="w-8 h-8 text-[#8C6A47] animate-spin mx-auto mb-2" />
                <p>Memuat data audit log dari Supabase...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="py-20 text-center text-stone-500">
                <History className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                <p className="font-bold text-stone-700">Tidak ada audit log yang sesuai filter</p>
                <p className="text-xs text-stone-400 mt-1">Coba bersihkan kata kunci pencarian atau ubah rentang tanggal.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F3] text-stone-600 font-bold uppercase tracking-wider text-[10px] border-b border-[#E8DFD5]">
                    <tr>
                      <th className="py-3 px-4">Waktu (WIB)</th>
                      <th className="py-3 px-4">Petugas / Role</th>
                      <th className="py-3 px-4">Jenis Aksi</th>
                      <th className="py-3 px-4">Kode &amp; Nama</th>
                      <th className="py-3 px-4">Rincian (Lama ➔ Baru)</th>
                      <th className="py-3 px-4">Catatan</th>
                      <th className="py-3 px-4 text-center">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                    {filteredLogs.map((log) => {
                      const dtStr = log.created_at
                        ? new Date(log.created_at).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'Asia/Jakarta',
                          })
                        : '-';

                      return (
                        <tr key={log.id} className="hover:bg-stone-50/80 transition-colors">
                          {/* Waktu */}
                          <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-stone-500">
                            {dtStr}
                          </td>

                          {/* Panitia */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-bold text-[#422F21]">{log.panitia_id || 'SYSTEM'}</div>
                            <div className="text-[10px] text-stone-400 uppercase font-semibold">{log.panitia_role || 'PANITIA'}</div>
                          </td>

                          {/* Aksi Badge */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {renderAksiBadge(String(log.aksi))}
                          </td>

                          {/* Kode & Nama */}
                          <td className="py-3 px-4">
                            {log.kode ? (
                              <div>
                                <span className="font-mono font-bold text-[#8C6A47] text-xs">{log.kode}</span>
                                <div className="font-semibold text-stone-800 line-clamp-1">{log.nama || '-'}</div>
                              </div>
                            ) : (
                              <span className="text-stone-400 italic">-</span>
                            )}
                          </td>

                          {/* Detail Preview (Lama -> Baru) */}
                          <td className="py-3 px-4 max-w-xs truncate">
                            {log.field && <span className="font-bold text-[#8C6A47] mr-1">{log.field}:</span>}
                            {log.nilai_lama && (
                              <span className="line-through text-rose-600 mr-1 font-mono text-[11px]">{log.nilai_lama}</span>
                            )}
                            {log.nilai_baru && (
                              <span className="font-bold text-emerald-700 font-mono text-[11px]">
                                {log.nilai_baru.length > 40 ? log.nilai_baru.substring(0, 40) + '...' : log.nilai_baru}
                              </span>
                            )}
                            {!log.field && !log.nilai_lama && !log.nilai_baru && (
                              <span className="text-stone-400 italic">Lihat detail JSON</span>
                            )}
                          </td>

                          {/* Catatan */}
                          <td className="py-3 px-4 text-stone-600 max-w-xs truncate italic">
                            {log.catatan || '-'}
                          </td>

                          {/* Aksi Lihat Detail */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelectedLogDetail(log)}
                              className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-[11px] inline-flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#8C6A47]" />
                              <span>Lihat</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        {/* MODAL DETAIL AUDIT LOG */}
        {selectedLogDetail && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90dvh] flex flex-col shadow-2xl border-2 border-[#8C6A47] overflow-hidden">
              <div className="bg-gradient-to-r from-[#422F21] to-[#5C3E28] text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b border-[#8C6A47]">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-black text-sm sm:text-base text-amber-200">
                      Rincian Audit Log #{selectedLogDetail.id}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-amber-100/80">
                      Tercatat pada {selectedLogDetail.created_at ? new Date(selectedLogDetail.created_at).toLocaleString('id-ID') : '-'} WIB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLogDetail(null)}
                  className="text-amber-200 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1 bg-stone-50">
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-white rounded-2xl border border-stone-200 shadow-2xs">
                  <div>
                    <span className="text-[10px] text-stone-400 font-bold uppercase">PETUGAS PANITIA</span>
                    <p className="font-bold text-[#422F21] text-sm">{selectedLogDetail.panitia_id || 'SYSTEM'}</p>
                    <span className="text-[10px] text-stone-500 font-semibold">{selectedLogDetail.panitia_role || 'PANITIA'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 font-bold uppercase">JENIS AKSI</span>
                    <div className="mt-0.5">{renderAksiBadge(String(selectedLogDetail.aksi))}</div>
                  </div>
                </div>

                {selectedLogDetail.kode && (
                  <div className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-1">
                    <span className="text-[10px] text-stone-400 font-bold uppercase">PESERTA TERDAMPAK</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#8C6A47]">{selectedLogDetail.kode}</span>
                      <span className="font-bold text-stone-800">{selectedLogDetail.nama}</span>
                    </div>
                  </div>
                )}

                {(selectedLogDetail.nilai_lama || selectedLogDetail.nilai_baru) && (
                  <div className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-2">
                    <span className="text-[10px] text-stone-400 font-bold uppercase">PERUBAHAN DATA ({selectedLogDetail.field || 'General'})</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
                        <div className="text-[10px] font-bold text-rose-600 uppercase mb-1">Nilai Sebelum:</div>
                        <pre className="whitespace-pre-wrap break-words">{selectedLogDetail.nilai_lama || '(Kosong)'}</pre>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                        <div className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Nilai Sesudah:</div>
                        <pre className="whitespace-pre-wrap break-words">{selectedLogDetail.nilai_baru || '(Kosong)'}</pre>
                      </div>
                    </div>
                  </div>
                )}

                {selectedLogDetail.detail && (
                  <div className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-1">
                    <span className="text-[10px] text-stone-400 font-bold uppercase">BACKUP DATA JSONB DETAIL</span>
                    <pre className="p-3 rounded-xl bg-stone-900 text-amber-300 font-mono text-[10px] overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(selectedLogDetail.detail, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLogDetail.catatan && (
                  <div className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-1">
                    <span className="text-[10px] text-stone-400 font-bold uppercase">CATATAN AKSI</span>
                    <p className="font-semibold text-stone-700 italic">{selectedLogDetail.catatan}</p>
                  </div>
                )}

                {selectedLogDetail.user_agent && (
                  <div className="p-3 bg-stone-200/60 rounded-xl text-[10px] text-stone-500 font-mono break-all">
                    User-Agent: {selectedLogDetail.user_agent}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
