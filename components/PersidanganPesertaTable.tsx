'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  Send,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Phone,
  RefreshCw,
  Clock,
  Check,
} from 'lucide-react';
import {
  PersidanganPeserta,
  getPesertaList,
  addPeserta,
  addPesertaBatch,
  updatePeserta,
  deletePeserta,
  deletePesertaBatch,
  generateKodePeserta,
  generateBatchKodePeserta,
  normalizePhoneNumber,
  buildMessageFromTemplate,
  sendWhatsApp,
} from '@/lib/persidangan';
import {
  PersidanganPesertaTableProps,
  ExcelRowItem,
  PersidanganToast,
} from '@/components/admin/persidangan/types';
import PersidanganToolbarAndStats from '@/components/admin/persidangan/PersidanganToolbarAndStats';
import PersidanganModals from '@/components/admin/persidangan/PersidanganModals';

export type { PersidanganPesertaTableProps };

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
  const [excelPreviewData, setExcelPreviewData] = useState<ExcelRowItem[]>([]);
  const [excelAllData, setExcelAllData] = useState<ExcelRowItem[]>([]);
  const [excelFileName, setExcelFileName] = useState<string>('');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importing, setImporting] = useState(false);

  // Status feedback toast
  const [toast, setToast] = useState<PersidanganToast | null>(null);

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
      if (filterStatus === 'HADIR' && item.status_kehadiran !== 'HADIR') return false;
      if (filterStatus === 'BELUM_HADIR' && item.status_kehadiran === 'HADIR') return false;
      if (
        filterStatus !== 'SEMUA' &&
        filterStatus !== 'HADIR' &&
        filterStatus !== 'BELUM_HADIR' &&
        item.status_kirim !== filterStatus
      )
        return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const nama = (item.nama || '').toLowerCase();
        const wa = (item.no_wa || '').toLowerCase();
        const kode = (item.kode_peserta || '').toLowerCase();
        return nama.includes(q) || wa.includes(q) || kode.includes(q);
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
      const kodePeserta = await generateKodePeserta(persidangan.id, persidangan.prefix_kode);

      const { data, error } = await addPeserta({
        persidangan_id: persidangan.id,
        kode_peserta: kodePeserta,
        status_kehadiran: 'BELUM',
        waktu_hadir: null,
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

      showToast(
        'success',
        `Peserta ${data.nama} (${data.kode_peserta || kodePeserta}) berhasil ditambahkan.`
      );
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

        const parsedItems: ExcelRowItem[] = [];

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

      const codes = await generateBatchKodePeserta(
        persidangan.id,
        persidangan.prefix_kode,
        dataToInsert.length
      );

      const itemsForBatch = dataToInsert.map((item, idx) => ({
        persidangan_id: persidangan.id,
        kode_peserta: codes[idx],
        status_kehadiran: 'BELUM' as const,
        waktu_hadir: null,
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

      showToast('success', `Berhasil mengimpor ${count} peserta dari Excel dengan kode presensi.`);
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
        {
          nama: peserta.nama,
          no_wa: peserta.no_wa,
          kode_peserta: peserta.kode_peserta,
        },
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
      <PersidanganToolbarAndStats
        toast={toast}
        onCloseToast={() => setToast(null)}
        pesertaList={pesertaList}
        selectedIds={selectedIds}
        onBulkDelete={handleBulkDelete}
        onOpenImportModal={() => setShowImportModal(true)}
        onOpenAddModal={() => {
          setInputNama('');
          setInputNoWa('');
          setShowAddModal(true);
        }}
        search={search}
        onSearchChange={setSearch}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
      />

      {/* Table Peserta */}
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
                <th className="p-3 w-10 text-center">No</th>
                <th className="p-3 w-28">Kode Presensi</th>
                <th className="p-3">Nama Penerima</th>
                <th className="p-3">No. WhatsApp</th>
                <th className="p-3 w-28">Status WA</th>
                <th className="p-3 w-28">Presensi</th>
                <th className="p-3 text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE8E1] text-[#422F21]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-xs text-[#735334]">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#8C6A47]" />
                      Memuat daftar peserta...
                    </div>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-xs text-[#735334]">
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
                      <td className="p-3">
                        <span className="inline-block px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-[#8C6A47]/10 text-[#8C6A47] border border-[#8C6A47]/25">
                          {item.kode_peserta || '-'}
                        </span>
                      </td>
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
                      <td className="p-3">
                        {item.status_kehadiran === 'HADIR' ? (
                          <span
                            title={
                              item.waktu_hadir
                                ? `Waktu hadir: ${new Date(item.waktu_hadir).toLocaleString('id-ID')}`
                                : 'Sudah Hadir'
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300"
                          >
                            <Check className="w-3 h-3 text-emerald-600" />
                            Hadir
                            {item.waktu_hadir && (
                              <span className="text-[9px] font-normal opacity-80">
                                ({new Date(item.waktu_hadir).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
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

      <PersidanganModals
        persidangan={persidangan}
        showAddModal={showAddModal}
        onCloseAddModal={() => setShowAddModal(false)}
        onAddSubmit={handleAddSubmit}
        editingPeserta={editingPeserta}
        onCloseEditModal={() => setEditingPeserta(null)}
        onEditSubmit={handleEditSubmit}
        inputNama={inputNama}
        onInputNamaChange={setInputNama}
        inputNoWa={inputNoWa}
        onInputNoWaChange={setInputNoWa}
        formSubmitting={formSubmitting}
        showImportModal={showImportModal}
        onCloseImportModal={() => setShowImportModal(false)}
        excelInputRef={excelInputRef}
        onExcelFileChange={handleExcelFileChange}
        excelFileName={excelFileName}
        excelPreviewData={excelPreviewData}
        excelAllData={excelAllData}
        skipDuplicates={skipDuplicates}
        onSkipDuplicatesChange={setSkipDuplicates}
        importing={importing}
        onImportSubmit={handleImportSubmit}
        confirmSendTarget={confirmSendTarget}
        onCloseConfirmSend={() => setConfirmSendTarget(null)}
        onExecuteSendWa={handleExecuteSendWa}
      />
    </div>
  );
}
