'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  Send,
  Search,
  Filter,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  Phone,
  RefreshCw,
  Clock,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';
import {
  Persidangan,
  PersidanganPeserta,
  getPesertaList,
  addPeserta,
  addPesertaBatch,
  updatePeserta,
  deletePeserta,
  deletePesertaBatch,
  normalizePhoneNumber,
  buildMessageFromTemplate,
  sendWhatsApp,
} from '@/lib/persidangan';

interface PersidanganPesertaTableProps {
  persidangan: Persidangan;
}

export default function PersidanganPesertaTable({ persidangan }: PersidanganPesertaTableProps) {
  const [pesertaList, setPesertaList] = useState<PersidanganPeserta[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('SEMUA');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingPeserta, setEditingPeserta] = useState<PersidanganPeserta | null>(null);
  const [confirmSendTarget, setConfirmSendTarget] = useState<PersidanganPeserta | null>(null);

  // Add/Edit Form State
  const [inputNama, setInputNama] = useState('');
  const [inputNoWa, setInputNoWa] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Excel Import State
  const excelInputRef = useRef<HTMLInputElement>(null);
  const [excelPreviewData, setExcelPreviewData] = useState<
    Array<{ nama: string; no_wa: string }>
  >([]);
  const [excelAllData, setExcelAllData] = useState<
    Array<{ nama: string; no_wa: string }>
  >([]);
  const [excelFileName, setExcelFileName] = useState<string>('');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importing, setImporting] = useState(false);

  // Status feedback toast
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(
    null
  );

  // Sending state per peserta
  const [sendingId, setSendingId] = useState<string | null>(null);

  const showToast = useCallback((type: 'success' | 'error' | 'info', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchPeserta = useCallback(async () => {
    try {
      setLoading(true);
      const list = await getPesertaList(persidangan.id);
      setPesertaList(list);
    } catch (err: any) {
      showToast('error', err?.message || 'Gagal memuat daftar peserta.');
    } finally {
      setLoading(false);
    }
  }, [persidangan.id, showToast]);

  useEffect(() => {
    fetchPeserta();
  }, [fetchPeserta]);

  // Handle ESC key to close any open modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAddModal(false);
        setShowImportModal(false);
        setEditingPeserta(null);
        setConfirmSendTarget(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered List
  const filteredList = useMemo(() => {
    return pesertaList.filter((item) => {
      if (filterStatus !== 'SEMUA' && item.status_kirim !== filterStatus) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const nama = (item.nama || '').toLowerCase();
        const wa = (item.no_wa || '').toLowerCase();
        return nama.includes(q) || wa.includes(q);
      }
      return true;
    });
  }, [pesertaList, filterStatus, search]);

  // Selection helpers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredList.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} peserta terpilih?`))
      return;

    try {
      const { error } = await deletePesertaBatch(selectedIds);
      if (error) {
        showToast('error', 'Gagal menghapus beberapa peserta.');
        return;
      }
      showToast('success', `${selectedIds.length} peserta berhasil dihapus.`);
      setSelectedIds([]);
      fetchPeserta();
    } catch (err: any) {
      showToast('error', err?.message || 'Terjadi kesalahan.');
    }
  };

  // Single Delete
  const handleDeleteOne = async (peserta: PersidanganPeserta) => {
    if (!confirm(`Hapus peserta ${peserta.nama} (${peserta.no_wa})?`)) return;

    try {
      const { error } = await deletePeserta(peserta.id);
      if (error) {
        showToast('error', 'Gagal menghapus peserta.');
        return;
      }
      showToast('success', `Peserta ${peserta.nama} berhasil dihapus.`);
      fetchPeserta();
    } catch (err: any) {
      showToast('error', err?.message || 'Terjadi kesalahan.');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (peserta: PersidanganPeserta) => {
    setEditingPeserta(peserta);
    setInputNama(peserta.nama);
    setInputNoWa(peserta.no_wa);
  };

  // Submit Add Manual
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputNama.trim() || !inputNoWa.trim()) {
      showToast('error', 'Nama dan No WhatsApp wajib diisi.');
      return;
    }

    setFormSubmitting(true);
    try {
      const { data, error } = await addPeserta({
        persidangan_id: persidangan.id,
        nama: inputNama.trim(),
        no_wa: inputNoWa.trim(),
        kategori: null,
        status_kirim: 'BELUM',
        waktu_kirim: null,
        error_msg: null,
      });

      if (error || !data) {
        showToast('error', error?.message || 'Gagal menambahkan peserta.');
        return;
      }

      showToast('success', `Peserta ${data.nama} berhasil ditambahkan.`);
      setShowAddModal(false);
      setInputNama('');
      setInputNoWa('');
      fetchPeserta();
    } catch (err: any) {
      showToast('error', err?.message || 'Terjadi kesalahan.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPeserta) return;
    if (!inputNama.trim() || !inputNoWa.trim()) {
      showToast('error', 'Nama dan No WhatsApp wajib diisi.');
      return;
    }

    setFormSubmitting(true);
    try {
      const { data, error } = await updatePeserta(editingPeserta.id, {
        nama: inputNama.trim(),
        no_wa: inputNoWa.trim(),
      });

      if (error || !data) {
        showToast('error', error?.message || 'Gagal memperbarui data peserta.');
        return;
      }

      showToast('success', `Data ${data.nama} berhasil diperbarui.`);
      setEditingPeserta(null);
      fetchPeserta();
    } catch (err: any) {
      showToast('error', err?.message || 'Terjadi kesalahan.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Excel File Parsing
  const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (!rawData || rawData.length < 2) {
          showToast('error', 'File Excel kosong atau tidak memiliki baris data.');
          return;
        }

        let startRow = 1;
        const firstRow = rawData[0].map((c) => String(c || '').toLowerCase().trim());
        const hasHeader =
          firstRow.some((c) => c.includes('nama')) ||
          firstRow.some((c) => c.includes('wa') || c.includes('hp') || c.includes('telepon'));

        if (!hasHeader) {
          startRow = 0;
        }

        const parsedItems: Array<{ nama: string; no_wa: string }> = [];

        for (let i = startRow; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length === 0) continue;

          const nama = String(row[0] || '').trim();
          const noWa = String(row[1] || '').trim();

          if (!nama && !noWa) continue;

          parsedItems.push({
            nama,
            no_wa: normalizePhoneNumber(noWa),
          });
        }

        if (parsedItems.length === 0) {
          showToast('error', 'Tidak ditemukan data peserta yang valid di berkas Excel.');
          return;
        }

        setExcelAllData(parsedItems);
        setExcelPreviewData(parsedItems.slice(0, 5));
      } catch (err: any) {
        showToast('error', 'Gagal membaca berkas Excel: ' + (err?.message || err));
      }
    };
    reader.readAsBinaryString(file);
  };

  // Submit Import Excel
  const handleImportSubmit = async () => {
    if (excelAllData.length === 0) return;

    setImporting(true);
    try {
      let dataToInsert = [...excelAllData];

      if (skipDuplicates) {
        const existingPhones = new Set(pesertaList.map((p) => p.no_wa));
        dataToInsert = dataToInsert.filter((d) => !existingPhones.has(d.no_wa));
      }

      if (dataToInsert.length === 0) {
        showToast('info', 'Seluruh nomor WA pada file Excel sudah terdaftar dalam persidangan ini.');
        setShowImportModal(false);
        return;
      }

      const itemsForBatch = dataToInsert.map((item) => ({
        persidangan_id: persidangan.id,
        nama: item.nama,
        no_wa: item.no_wa,
        kategori: null,
        status_kirim: 'BELUM' as const,
        waktu_kirim: null,
        error_msg: null,
      }));

      const { count, error } = await addPesertaBatch(itemsForBatch);

      if (error) {
        showToast('error', 'Gagal mengimpor peserta: ' + error.message);
        return;
      }

      showToast('success', `Berhasil mengimpor ${count} peserta dari Excel.`);
      setShowImportModal(false);
      setExcelAllData([]);
      setExcelPreviewData([]);
      setExcelFileName('');
      fetchPeserta();
    } catch (err: any) {
      showToast('error', err?.message || 'Terjadi kesalahan.');
    } finally {
      setImporting(false);
    }
  };

  // Execute WA Sending
  const handleExecuteSendWa = async (peserta: PersidanganPeserta) => {
    setConfirmSendTarget(null);
    setSendingId(peserta.id);

    try {
      const template = persidangan.template_wa || '';
      const pesan = buildMessageFromTemplate(
        template,
        { nama: peserta.nama },
        persidangan
      );

      const res = await sendWhatsApp(peserta.no_wa, pesan);

      const nowIso = new Date().toISOString();
      if (res.ok) {
        await updatePeserta(peserta.id, {
          status_kirim: 'TERKIRIM',
          waktu_kirim: nowIso,
          error_msg: null,
        });
        showToast('success', `Undangan berhasil dikirim ke ${peserta.nama} (${peserta.no_wa})`);
      } else {
        await updatePeserta(peserta.id, {
          status_kirim: 'GAGAL',
          error_msg: res.message || 'Pengiriman gagal dari gateway',
        });
        showToast('error', `Gagal kirim ke ${peserta.nama}: ${res.message || 'Cek koneksi'}`);
      }

      fetchPeserta();
    } catch (err: any) {
      showToast('error', err?.message || 'Terjadi kesalahan sistem pengiriman.');
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 shadow-md transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : toast.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-[#8C6A47] text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <Check className="w-4 h-4" />
            ) : toast.type === 'error' ? (
              <XCircle className="w-4 h-4" />
            ) : (
              <Info className="w-4 h-4" />
            )}
            <span>{toast.text}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="p-1 hover:bg-black/10 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Control Bar: Actions & Filters */}
      <div className="bg-[#FAF7F3] border-2 border-[#D5C4B4] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#8C6A47]/10 border border-[#8C6A47]/30 flex items-center justify-center text-[#8C6A47]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm sm:text-base text-[#422F21]">
                Daftar Peserta Persidangan
              </h4>
              <p className="text-[11px] text-[#735334]">
                Total: <strong>{pesertaList.length}</strong> orang • Terkirim:{' '}
                <strong className="text-emerald-700">
                  {pesertaList.filter((p) => p.status_kirim === 'TERKIRIM').length}
                </strong>{' '}
                • Belum:{' '}
                <strong className="text-amber-700">
                  {pesertaList.filter((p) => p.status_kirim === 'BELUM').length}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Terpilih ({selectedIds.length})
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D5C4B4] bg-white hover:bg-[#F5E6D3] text-xs font-bold text-[#735334] transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              Import Excel
            </button>

            <button
              type="button"
              onClick={() => {
                setInputNama('');
                setInputNoWa('');
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white text-xs font-bold shadow-xs transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              + Tambah Peserta
            </button>
          </div>
        </div>

        {/* Filter & Search Controls (Tanpa Kategori) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E5D7C8]">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8C6A47] absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau nomor WA..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs text-[#422F21] placeholder-[#A89887] focus:outline-none focus:ring-2 focus:ring-[#8C6A47]/40"
            />
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs text-[#422F21] focus:outline-none focus:ring-2 focus:ring-[#8C6A47]/40"
            >
              <option value="SEMUA">Semua Status Kirim</option>
              <option value="BELUM">Belum Dikirim</option>
              <option value="TERKIRIM">Sudah Terkirim</option>
              <option value="GAGAL">Gagal Kirim</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Peserta (Tanpa Kolom Kategori) */}
      <div className="bg-white border-2 border-[#D5C4B4] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF7F3] border-b-2 border-[#D5C4B4] text-[#735334] uppercase font-bold text-[10px] tracking-wider select-none">
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredList.length > 0 && selectedIds.length === filteredList.length
                    }
                    onChange={handleSelectAll}
                    className="rounded text-[#8C6A47] focus:ring-[#8C6A47]"
                  />
                </th>
                <th className="p-3 w-12 text-center">No</th>
                <th className="p-3">Nama Penerima</th>
                <th className="p-3">No. WhatsApp</th>
                <th className="p-3">Status Kirim</th>
                <th className="p-3 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE8E1] text-[#422F21]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-[#735334]">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#8C6A47]" />
                      Memuat daftar peserta...
                    </div>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-[#735334]">
                    {pesertaList.length === 0
                      ? 'Belum ada peserta dalam persidangan ini. Klik "+ Tambah Peserta" atau "Import Excel" di atas.'
                      : 'Tidak ada data peserta yang cocok dengan kriteria pencarian/filter.'}
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  const isSelected = selectedIds.includes(item.id);
                  const isSendingThis = sendingId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-[#FAF7F3]/70 transition-colors ${
                        isSelected ? 'bg-[#F5E6D3]/40' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(item.id)}
                          className="rounded text-[#8C6A47] focus:ring-[#8C6A47]"
                        />
                      </td>
                      <td className="p-3 text-center text-[#735334] font-semibold">{idx + 1}</td>
                      <td className="p-3 font-bold text-xs">{item.nama}</td>
                      <td className="p-3 font-mono text-[11px] text-[#735334]">
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-[#8C6A47]" />
                          {item.no_wa}
                        </span>
                      </td>
                      <td className="p-3">
                        {item.status_kirim === 'TERKIRIM' ? (
                          <span
                            title={item.waktu_kirim ? `Terkirim: ${item.waktu_kirim}` : undefined}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Terkirim
                          </span>
                        ) : item.status_kirim === 'GAGAL' ? (
                          <span
                            title={item.error_msg || 'Pengiriman gagal'}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300 cursor-help"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            Gagal
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3" />
                            Belum
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Tombol Kirim WA / Coba Lagi */}
                          <button
                            type="button"
                            onClick={() => setConfirmSendTarget(item)}
                            disabled={isSendingThis}
                            title={
                              item.status_kirim === 'GAGAL'
                                ? 'Coba lagi kirim WhatsApp'
                                : 'Kirim WhatsApp ke nomor ini'
                            }
                            className={`p-1.5 rounded-lg text-white font-bold text-xs transition-colors ${
                              item.status_kirim === 'GAGAL'
                                ? 'bg-amber-600 hover:bg-amber-700'
                                : 'bg-emerald-600 hover:bg-emerald-700'
                            } disabled:opacity-50`}
                          >
                            {isSendingThis ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Tombol Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit peserta"
                            className="p-1.5 rounded-lg bg-white border border-[#D5C4B4] text-[#735334] hover:bg-[#FAF7F3] transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Tombol Hapus */}
                          <button
                            type="button"
                            onClick={() => handleDeleteOne(item)}
                            title="Hapus peserta"
                            className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* ========================================================================= */}
      {/* MODAL 1: TAMBAH PESERTA MANUAL (TANPA KATEGORI)                           */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-[#FAF7F3] border-2 border-[#D5C4B4] rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E5D7C8] pb-3">
              <h3 className="font-serif font-bold text-base text-[#422F21] flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#8C6A47]" />
                Tambah Peserta Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-[#735334] hover:text-[#422F21]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#735334] mb-1">
                  Nama Penerima <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={inputNama}
                  onChange={(e) => setInputNama(e.target.value)}
                  placeholder="Contoh: Gus Ahmad Faqih"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs text-[#422F21] focus:outline-none focus:ring-2 focus:ring-[#8C6A47]/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#735334] mb-1">
                  Nomor WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={inputNoWa}
                  onChange={(e) => setInputNoWa(e.target.value)}
                  placeholder="Contoh: 08123456789 atau 628123456789"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs text-[#422F21] focus:outline-none focus:ring-2 focus:ring-[#8C6A47]/40 font-mono"
                />
                <span className="text-[10px] text-[#A89887] block mt-1">
                  Format akan otomatis dinormalisasi ke format internasional (628...).
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5D7C8]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs font-bold text-[#735334] hover:bg-[#FAF7F3]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white text-xs font-bold disabled:opacity-50"
                >
                  {formSubmitting ? 'Menyimpan...' : 'Tambah Saja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT PESERTA (TANPA KATEGORI)                                    */}
      {/* ========================================================================= */}
      {editingPeserta && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setEditingPeserta(null)}
        >
          <div
            className="bg-[#FAF7F3] border-2 border-[#D5C4B4] rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E5D7C8] pb-3">
              <h3 className="font-serif font-bold text-base text-[#422F21] flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#8C6A47]" />
                Edit Data Peserta
              </h3>
              <button
                type="button"
                onClick={() => setEditingPeserta(null)}
                className="p-1 text-[#735334] hover:text-[#422F21]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#735334] mb-1">
                  Nama Penerima <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={inputNama}
                  onChange={(e) => setInputNama(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs text-[#422F21] focus:outline-none focus:ring-2 focus:ring-[#8C6A47]/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#735334] mb-1">
                  Nomor WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={inputNoWa}
                  onChange={(e) => setInputNoWa(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs text-[#422F21] focus:outline-none focus:ring-2 focus:ring-[#8C6A47]/40 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5D7C8]">
                <button
                  type="button"
                  onClick={() => setEditingPeserta(null)}
                  className="px-4 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs font-bold text-[#735334] hover:bg-[#FAF7F3]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white text-xs font-bold disabled:opacity-50"
                >
                  {formSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: IMPORT EXCEL                                                     */}
      {/* ========================================================================= */}
      {showImportModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowImportModal(false)}
        >
          <div
            className="bg-[#FAF7F3] border-2 border-[#D5C4B4] rounded-2xl p-6 w-full max-w-lg shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E5D7C8] pb-3">
              <h3 className="font-serif font-bold text-base text-[#422F21] flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                Import Peserta via Excel (.xlsx)
              </h3>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="p-1 text-[#735334] hover:text-[#422F21]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-white border border-[#D5C4B4] text-xs text-[#735334] space-y-1">
                <div className="font-bold text-[#422F21]">Format Kolom Excel:</div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li>
                    Kolom A: <strong>Nama Penerima</strong>
                  </li>
                  <li>
                    Kolom B: <strong>Nomor WhatsApp</strong> (contoh: 08123456789)
                  </li>
                </ul>
              </div>

              <div>
                <input
                  ref={excelInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleExcelFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => excelInputRef.current?.click()}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-[#8C6A47] bg-white hover:bg-[#F5E6D3]/40 text-xs font-bold text-[#8C6A47] flex items-center justify-center gap-2 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  {excelFileName ? `Ganti Berkas (${excelFileName})` : 'Pilih Berkas Excel (.xlsx)'}
                </button>
              </div>

              {/* Preview 5 Baris Pertama */}
              {excelPreviewData.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#422F21] flex items-center justify-between">
                    <span>Pratinjau Data (5 dari {excelAllData.length} baris):</span>
                    <span className="text-[11px] text-[#8C6A47]">
                      Total {excelAllData.length} peserta terdeteksi
                    </span>
                  </div>

                  <div className="border border-[#D5C4B4] rounded-xl overflow-hidden bg-white max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-[#FAF7F3] text-[#735334] font-bold border-b border-[#D5C4B4]">
                        <tr>
                          <th className="p-2 w-8">No</th>
                          <th className="p-2">Nama</th>
                          <th className="p-2">No WA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EFE8E1]">
                        {excelPreviewData.map((row, idx) => (
                          <tr key={idx}>
                            <td className="p-2 text-center text-[#735334]">{idx + 1}</td>
                            <td className="p-2 font-medium">{row.nama}</td>
                            <td className="p-2 font-mono text-[#735334]">{row.no_wa}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-[#735334] cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={skipDuplicates}
                      onChange={(e) => setSkipDuplicates(e.target.checked)}
                      className="rounded text-[#8C6A47] focus:ring-[#8C6A47]"
                    />
                    <span>Lewati jika nomor WA sudah ada di daftar persidangan ini</span>
                  </label>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5D7C8]">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs font-bold text-[#735334] hover:bg-[#FAF7F3]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleImportSubmit}
                disabled={excelAllData.length === 0 || importing}
                className="px-5 py-2 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white text-xs font-bold disabled:opacity-50"
              >
                {importing
                  ? 'Mengimpor...'
                  : `Impor ${excelAllData.length > 0 ? excelAllData.length : ''} Peserta`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: KONFIRMASI KIRIM WA PER BARIS                                     */}
      {/* ========================================================================= */}
      {confirmSendTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setConfirmSendTarget(null)}
        >
          <div
            className="bg-[#FAF7F3] border-2 border-[#D5C4B4] rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E5D7C8] pb-3">
              <h3 className="font-serif font-bold text-base text-[#422F21] flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                Konfirmasi Kirim WhatsApp
              </h3>
              <button
                type="button"
                onClick={() => setConfirmSendTarget(null)}
                className="p-1 text-[#735334] hover:text-[#422F21]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#735334]">
              <p>
                Kirim surat undangan digital persidangan ke penerima berikut?
              </p>

              <div className="p-3.5 rounded-xl bg-white border border-[#D5C4B4] space-y-1.5">
                <div>
                  <span className="text-[#A89887] text-[10px] uppercase font-bold block">
                    Nama Penerima
                  </span>
                  <strong className="text-sm text-[#422F21]">{confirmSendTarget.nama}</strong>
                </div>
                <div>
                  <span className="text-[#A89887] text-[10px] uppercase font-bold block">
                    Nomor WhatsApp
                  </span>
                  <span className="font-mono text-xs text-[#422F21]">{confirmSendTarget.no_wa}</span>
                </div>
                <div>
                  <span className="text-[#A89887] text-[10px] uppercase font-bold block">
                    Persidangan
                  </span>
                  <span className="text-xs text-[#8C6A47] font-semibold">{persidangan.judul}</span>
                </div>
              </div>

              <p className="text-[11px] text-[#8C6A47]">
                Pesan akan dikirim langsung via gateway WhatsApp Fonnte bersama tautan dokumen PDF resmi.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5D7C8]">
              <button
                type="button"
                onClick={() => setConfirmSendTarget(null)}
                className="px-4 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs font-bold text-[#735334] hover:bg-[#FAF7F3]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleExecuteSendWa(confirmSendTarget)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                Ya, Kirim Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
