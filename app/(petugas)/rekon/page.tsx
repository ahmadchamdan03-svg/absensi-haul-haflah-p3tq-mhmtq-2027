'use client';

import { useState } from 'react';
import {
  RotateCcw,
  Search,
  Users,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Check,
  Sparkles,
  Edit3,
  UserCheck,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Clock,
  Ticket,
} from 'lucide-react';
import { store } from '@/lib/mock-data';
import { BAGIAN_TAMATAN_LIST, extractBagianTamatan } from '@/lib/types';

export default function RekonPage() {
  const [keyword, setKeyword] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modeTab, setModeTab] = useState<'CHECKIN' | 'EDIT'>('CHECKIN');
  const [hasilMsg, setHasilMsg] = useState<{ tipe: 'success' | 'error'; text: string } | null>(null);

  // Form Check-in Biasa
  const [catatan, setCatatan] = useState('');
  const [jumlahL, setJumlahL] = useState(1);
  const [jumlahP, setJumlahP] = useState(1);

  // Form Edit & Koreksi Data
  const [editStatusHadir, setEditStatusHadir] = useState<'HADIR' | 'BELUM_HADIR'>('BELUM_HADIR');
  const [editJumlahL, setEditJumlahL] = useState(1);
  const [editJumlahP, setEditJumlahP] = useState(1);
  const [editKategoriUtama, setEditKategoriUtama] = useState<'BIL_GHOIB' | 'BIN_NADZOR' | 'TAMATAN'>('BIL_GHOIB');
  const [editBagianTamatan, setEditBagianTamatan] = useState<string>('A.01');
  const [editKelas, setEditKelas] = useState<string>('3 Tsanawiyah');
  const [editKuotaTambahan, setEditKuotaTambahan] = useState<number>(0);
  const [editCatatanRekon, setEditCatatanRekon] = useState<string>('');

  const keluargaList = store.getKeluargaList();
  const undanganList = store.getUndanganList();

  // Pencarian
  const searchResults = keyword.trim()
    ? [
        ...keluargaList
          .filter(
            (k) =>
              k.namaWali.toLowerCase().includes(keyword.toLowerCase()) ||
              k.kode.toLowerCase().includes(keyword.toLowerCase()) ||
              k.noHp.includes(keyword) ||
              k.santri?.some(
                (s) =>
                  s.nama.toLowerCase().includes(keyword.toLowerCase()) ||
                  s.nis.includes(keyword) ||
                  s.kelas.toLowerCase().includes(keyword.toLowerCase())
              )
          )
          .map((k) => ({ tipe: 'KELUARGA', data: k })),
        ...undanganList
          .filter(
            (u) =>
              u.nama.toLowerCase().includes(keyword.toLowerCase()) ||
              u.kode.toLowerCase().includes(keyword.toLowerCase()) ||
              u.kategori.toLowerCase().includes(keyword.toLowerCase())
          )
          .map((u) => ({ tipe: 'UNDANGAN', data: u })),
      ]
    : [];

  const handleSelectItem = (item: any) => {
    setSelectedItem(item);
    setHasilMsg(null);
    setCatatan('');

    const kuota = item.data.kuota;
    const sudahHadir = kuota.terpakai > 0;
    setEditStatusHadir(sudahHadir ? 'HADIR' : 'BELUM_HADIR');

    // Estimasi L/P
    if (kuota.terpakai > 1) {
      setEditJumlahL(1);
      setEditJumlahP(kuota.terpakai - 1);
    } else if (kuota.terpakai === 1) {
      setEditJumlahL(0);
      setEditJumlahP(1);
    } else {
      setEditJumlahL(1);
      setEditJumlahP(1);
    }

    setEditKuotaTambahan(kuota.kuotaTambahan || 0);
    setEditCatatanRekon((item.data as any).catatanRekon || '');

    if (item.tipe === 'KELUARGA') {
      const santri = item.data.santri?.[0];
      if (santri) {
        setEditKategoriUtama(santri.kategoriUtama || 'BIL_GHOIB');
        setEditBagianTamatan(extractBagianTamatan(santri.subKategori) || 'A.01');
        setEditKelas(santri.kelas || '3 Tsanawiyah');
      }
    }
  };

  // Handler Check-in Biasa
  const handleProsesRekon = () => {
    if (!selectedItem) return;
    setHasilMsg(null);

    const kodeQr = selectedItem.data.kode;
    const res = store.checkin(kodeQr, jumlahL, jumlahP, 'REKONSILIASI', 0, 'panitia-rekon');

    if (!res.ok) {
      setHasilMsg({
        tipe: 'error',
        text: res.pesan || res.reason || 'Proses rekonsiliasi gagal',
      });
      return;
    }

    setHasilMsg({
      tipe: 'success',
      text: `✓ Berhasil check-in rekonsiliasi untuk ${res.namaSantri || selectedItem.data.kode}. Serahkan ${
        res.tiketReguler || 0
      } tiket ${res.warnaTiket} ${res.tiketPanggung ? '+ 1 Tiket Emas Panggung' : ''}.`,
    });

    setSelectedItem(null);
    setKeyword('');
    setCatatan('');
  };

  // Handler Koreksi & Edit Data Rekonsiliasi
  const handleSimpanKoreksi = () => {
    if (!selectedItem) return;
    setHasilMsg(null);

    const kodeQr = selectedItem.data.kode;
    const isKel = selectedItem.tipe === 'KELUARGA';

    const res = store.rekonsiliasiKoreksiPeserta({
      kode: kodeQr,
      statusKehadiran: editStatusHadir,
      jumlahL: editJumlahL,
      jumlahP: editJumlahP,
      kategoriUtama: isKel ? editKategoriUtama : undefined,
      subKategori:
        isKel && editKategoriUtama === 'TAMATAN'
          ? `3 ALY ${editBagianTamatan}`
          : isKel && editKategoriUtama === 'BIL_GHOIB'
          ? 'Bil Ghoib'
          : editKelas,
      kelas:
        isKel && editKategoriUtama === 'TAMATAN'
          ? `3 ALY ${editBagianTamatan}`
          : isKel && editKategoriUtama === 'BIL_GHOIB'
          ? 'Bil Ghoib'
          : editKelas,
      bagianTamatan: editBagianTamatan,
      kuotaTambahan: editKuotaTambahan,
      catatanRekon: editCatatanRekon.trim() || 'Koreksi data meja rekonsiliasi',
      petugas: 'Panitia Rekonsiliasi',
    });

    if (!res.ok) {
      setHasilMsg({
        tipe: 'error',
        text: res.pesan || 'Gagal menyimpan perubahan rekonsiliasi.',
      });
      return;
    }

    setHasilMsg({
      tipe: 'success',
      text: `✓ Berhasil memperbarui data rekonsiliasi untuk ${selectedItem.data.kode}. Status Kehadiran: ${
        editStatusHadir === 'HADIR' ? 'Sudah Hadir' : 'Belum Hadir (Reset)'
      }, Total Kuota: ${
        (isKel && editKategoriUtama === 'BIL_GHOIB' ? 4 : 2) + editKuotaTambahan
      } Kursi. Data otomatis tersimpan & terhubung ke Live Dasbor.`,
    });

    setSelectedItem(null);
    setKeyword('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header Meja Rekonsiliasi */}
      <div className="bg-[#FAF7F3] rounded-3xl p-6 shadow-sm border-2 border-[#D5C4B4]">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-[#EFE8E1] text-[#8C6A47] border-2 border-[#8C6A47]/40 flex items-center justify-center font-bold shadow-xs">
            <RotateCcw className="w-5 h-5 text-[#8C6A47]" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-black text-[#422F21]">
              Meja Rekonsiliasi & Kasus Khusus Gerbang
            </h1>
            <p className="text-xs text-[#7A624E]">
              Gerbang Selatan (Sisi Dalam). Menangani tamu walk-in, barcode bermasalah, serta koreksi status kehadiran, kategori santri, & kuota.
            </p>
          </div>
        </div>

        {/* Notifikasi / Alert Box */}
        {hasilMsg && (
          <div
            className={`mt-4 p-4 rounded-2xl text-xs flex items-center space-x-2.5 shadow-xs transition-all ${
              hasilMsg.tipe === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-2 border-emerald-300'
                : 'bg-rose-50 text-rose-900 border-2 border-rose-300'
            }`}
          >
            {hasilMsg.tipe === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold leading-relaxed">{hasilMsg.text}</span>
          </div>
        )}

        {/* Form Cari Santri / Tamu */}
        <div className="mt-6 space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 text-[#8C6A47] absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Cari berdasarkan Nama Santri, Nama Wali, Tamu VIP, No. HP, atau Kode SH0001..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-[#D5C4B4] text-xs focus:outline-none focus:border-[#8C6A47] font-semibold bg-white text-[#422F21] placeholder-[#7A624E]/70"
            />
            {keyword && (
              <button
                onClick={() => setKeyword('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#7A624E] hover:text-[#422F21]"
              >
                ✕
              </button>
            )}
          </div>

          {/* List Hasil Pencarian */}
          {searchResults.length > 0 && (
            <div className="border-2 border-[#D5C4B4] rounded-2xl divide-y divide-[#EFE8E1] max-h-72 overflow-y-auto bg-white shadow-xs">
              {searchResults.map((item: any) => {
                const isKel = item.tipe === 'KELUARGA';
                const santri = isKel ? item.data.santri?.[0] : null;
                const kuota = item.data.kuota;
                const sudahHadir = kuota.terpakai > 0;
                const sisa = kuota.kuotaDasar + kuota.kuotaTambahan - kuota.terpakai;

                let badgeKategori = 'bg-[#FAF7F3] text-[#8C6A47] border-[#D5C4B4]';
                if (santri?.kategoriUtama === 'BIL_GHOIB') {
                  badgeKategori = 'bg-emerald-50 text-emerald-800 border-emerald-300';
                } else if (santri?.kategoriUtama === 'BIN_NADZOR') {
                  badgeKategori = 'bg-blue-50 text-blue-800 border-blue-300';
                } else if (santri?.kategoriUtama === 'TAMATAN') {
                  badgeKategori = 'bg-amber-50 text-amber-900 border-amber-300';
                } else if (!isKel) {
                  badgeKategori = 'bg-purple-50 text-purple-900 border-purple-300';
                }

                return (
                  <div
                    key={item.data.id}
                    onClick={() => handleSelectItem(item)}
                    className={`p-3 sm:p-3.5 hover:bg-[#FAF7F3] cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors ${
                      selectedItem?.data.id === item.data.id
                        ? 'bg-[#EFE8E1] border-l-4 border-[#8C6A47]'
                        : ''
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                        <span className="font-serif font-black text-xs sm:text-sm text-[#422F21]">
                          {isKel ? santri?.nama : item.data.nama}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${badgeKategori}`}>
                          {isKel ? santri?.kategoriUtama : 'TAMU UNDANGAN'}
                        </span>
                        {sudahHadir ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            <span>Sudah Hadir ({kuota.terpakai} Kursi)</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center space-x-1 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                            <span>Belum Hadir</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#7A624E] truncate">
                        {isKel
                          ? `${santri?.kelas || santri?.subKategori} · Wali: ${item.data.namaWali} (${item.data.noHp})`
                          : `${item.data.kategori} · ${item.data.instansi || '-'}`}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center text-xs shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-[#D5C4B4]/40">
                      <span className="font-mono px-2 py-0.5 rounded-lg bg-[#FAF7F3] border border-[#D5C4B4] text-[#8C6A47] font-black text-xs">
                        {item.data.kode}
                      </span>
                      <div className="text-[11px] text-[#7A624E] sm:mt-1">
                        Total: <strong>{kuota.kuotaDasar + (kuota.kuotaTambahan || 0)}</strong> · Sisa:{' '}
                        <strong className={sisa > 0 ? 'text-emerald-700' : 'text-rose-600'}>
                          {sisa}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail & Aksi Rekonsiliasi */}
      {selectedItem && (
        <div className="bg-[#FAF7F3] rounded-3xl p-6 shadow-sm border-2 border-[#8C6A47]/60 space-y-5 animate-in fade-in">
          {/* Header Peserta Terpilih */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-[#D5C4B4] pb-4 gap-3">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white text-[#8C6A47] text-[10px] font-black border border-[#D5C4B4]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D49B5B]" />
                <span>MEJA KASUS KHUSUS GERBANG SELATAN</span>
              </div>
              <h3 className="text-lg font-serif font-black text-[#422F21] mt-1.5">
                {selectedItem.tipe === 'KELUARGA'
                  ? selectedItem.data.santri?.[0]?.nama
                  : selectedItem.data.nama}
              </h3>
              <div className="flex items-center space-x-3 text-xs text-[#7A624E] mt-0.5">
                <span className="font-mono font-bold text-[#8C6A47]">{selectedItem.data.kode}</span>
                <span>•</span>
                <span>
                  {selectedItem.tipe === 'KELUARGA'
                    ? `Wali: ${selectedItem.data.namaWali} (${selectedItem.data.noHp})`
                    : `${selectedItem.data.kategori} · ${selectedItem.data.instansi || '-'}`}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-black border ${
                  selectedItem.data.kuota.terpakai > 0
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}
              >
                {selectedItem.data.kuota.terpakai > 0
                  ? `Sudah Masuk (${selectedItem.data.kuota.terpakai} Kursi)`
                  : 'Belum Masuk Lokasi'}
              </span>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-xl bg-white border border-[#D5C4B4] text-[#7A624E] hover:text-[#422F21] text-xs font-bold"
              >
                ✕ Tutup
              </button>
            </div>
          </div>

          {/* TAB SWITCHER: MODE CHECK-IN VS MODE EDIT DATA */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#EFE8E1] rounded-2xl border border-[#D5C4B4]">
            <button
              type="button"
              onClick={() => setModeTab('CHECKIN')}
              className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 ${
                modeTab === 'CHECKIN'
                  ? 'bg-[#8C6A47] text-white shadow-sm'
                  : 'text-[#7A624E] hover:text-[#422F21]'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Mode 1: Check-in Cepat Masuk</span>
            </button>

            <button
              type="button"
              onClick={() => setModeTab('EDIT')}
              className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 ${
                modeTab === 'EDIT'
                  ? 'bg-[#8C6A47] text-white shadow-sm'
                  : 'text-[#7A624E] hover:text-[#422F21]'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>Mode 2: Edit & Koreksi Data (Audit)</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: FORM CHECK-IN CEPAT (MASUK / SCAN LANGSUNG)                       */}
          {/* ========================================================================= */}
          {modeTab === 'CHECKIN' && (
            <div className="space-y-4 pt-1">
              <div className="p-3.5 rounded-2xl bg-white border border-[#D5C4B4] flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-[#7A624E] font-medium">Sisa Kuota Tersedia:</div>
                  <div className="text-xl font-serif font-black text-[#422F21]">
                    {Math.max(
                      0,
                      selectedItem.data.kuota.kuotaDasar +
                        (selectedItem.data.kuota.kuotaTambahan || 0) -
                        selectedItem.data.kuota.terpakai
                    )}{' '}
                    <span className="text-xs font-normal text-[#7A624E]">
                      dari {selectedItem.data.kuota.kuotaDasar + (selectedItem.data.kuota.kuotaTambahan || 0)} Kursi
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FAF7F3] text-[#8C6A47] border border-[#D5C4B4]">
                    Tiket{' '}
                    {selectedItem.data.kuota.tiketPanggungJatah > 0
                      ? 'Hijau (+ Emas Panggung)'
                      : selectedItem.tipe === 'UNDANGAN'
                      ? 'Putih VIP'
                      : 'Reguler'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#422F21] mb-1">
                    Jumlah Laki-laki Hadir
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={jumlahL}
                    onChange={(e) => setJumlahL(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-[#D5C4B4] text-xs font-bold text-[#422F21] bg-white focus:outline-none focus:border-[#8C6A47]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#422F21] mb-1">
                    Jumlah Perempuan Hadir
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={jumlahP}
                    onChange={(e) => setJumlahP(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-[#D5C4B4] text-xs font-bold text-[#422F21] bg-white focus:outline-none focus:border-[#8C6A47]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#422F21] mb-1">
                  Catatan Kasus Lapangan (Opsional)
                </label>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Misal: Ponsel mati, undangan fisik tertinggal, tamu VIP langsung diantar panitia..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border-2 border-[#D5C4B4] text-xs focus:outline-none focus:border-[#8C6A47] bg-white text-[#422F21]"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2.5 rounded-xl border-2 border-[#D5C4B4] text-xs font-bold text-[#7A624E] hover:bg-white transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleProsesRekon}
                  className="px-6 py-2.5 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white text-xs font-bold shadow-md transition-colors flex items-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Selesaikan & Terbitkan Gelang Tiket</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: FORM EDIT & KOREKSI DATA (AUDIT REKONSILIASI)                      */}
          {/* ========================================================================= */}
          {modeTab === 'EDIT' && (
            <div className="space-y-5 pt-1">
              {/* 1. Koreksi Status Kehadiran (Sudah Hadir <-> Belum Hadir) */}
              <div className="p-4 rounded-2xl bg-white border-2 border-[#D5C4B4] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#422F21] uppercase tracking-wide flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-[#8C6A47]" />
                    <span>1. Koreksi Status Kehadiran</span>
                  </span>
                  <span className="text-[10px] text-[#7A624E]">
                    Mengubah status kehadiran dan mereset log presensi
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditStatusHadir('HADIR')}
                    className={`p-3 rounded-xl border-2 text-xs font-black transition-all flex items-center justify-center space-x-2 ${
                      editStatusHadir === 'HADIR'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs'
                        : 'bg-[#FAF7F3] border-[#D5C4B4] text-[#7A624E] hover:border-[#8C6A47]'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <span>Sudah Hadir di Lokasi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditStatusHadir('BELUM_HADIR')}
                    className={`p-3 rounded-xl border-2 text-xs font-black transition-all flex items-center justify-center space-x-2 ${
                      editStatusHadir === 'BELUM_HADIR'
                        ? 'bg-amber-50 border-amber-600 text-amber-900 shadow-xs'
                        : 'bg-[#FAF7F3] border-[#D5C4B4] text-[#7A624E] hover:border-[#8C6A47]'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                    <span>Belum Hadir (Reset ke 0)</span>
                  </button>
                </div>

                {editStatusHadir === 'BELUM_HADIR' ? (
                  <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-300 text-amber-900 text-[11px] flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>
                      <strong>Perhatian:</strong> Mengubah ke <em>Belum Hadir</em> akan mereset kuota terpakai menjadi <strong>0</strong>, menarik tiket panggung emas, dan membatalkan catatan scan pintu masuk.
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-[#5C3E28] mb-1">
                        Jumlah Hadir Laki-laki
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editJumlahL}
                        onChange={(e) => setEditJumlahL(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] text-xs font-bold text-[#422F21] bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#5C3E28] mb-1">
                        Jumlah Hadir Perempuan
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editJumlahP}
                        onChange={(e) => setEditJumlahP(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 rounded-xl border border-[#D5C4B4] text-xs font-bold text-[#422F21] bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Koreksi Kategori Santri (Hanya untuk Santri / KELUARGA) */}
              {selectedItem.tipe === 'KELUARGA' && (
                <div className="p-4 rounded-2xl bg-white border-2 border-[#D5C4B4] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#422F21] uppercase tracking-wide flex items-center space-x-1.5">
                      <Ticket className="w-4 h-4 text-[#8C6A47]" />
                      <span>2. Koreksi Kategori Santri</span>
                    </span>
                    <span className="text-[10px] text-[#7A624E]">
                      Otomatis sesuaikan kuota dasar & tiket panggung
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditKategoriUtama('BIL_GHOIB')}
                      className={`p-3 rounded-xl border-2 text-xs font-bold text-left transition-all ${
                        editKategoriUtama === 'BIL_GHOIB'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-black shadow-xs'
                          : 'border-[#D5C4B4] bg-[#FAF7F3] text-[#7A624E] hover:border-[#8C6A47]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>Bil Ghoib</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      </div>
                      <div className="text-[10px] text-emerald-800 mt-1 font-normal">
                        4 Kursi · Tiket Emas Panggung ★
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditKategoriUtama('BIN_NADZOR')}
                      className={`p-3 rounded-xl border-2 text-xs font-bold text-left transition-all ${
                        editKategoriUtama === 'BIN_NADZOR'
                          ? 'border-blue-600 bg-blue-50 text-blue-950 font-black shadow-xs'
                          : 'border-[#D5C4B4] bg-[#FAF7F3] text-[#7A624E] hover:border-[#8C6A47]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>Bin Nadzori</span>
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      </div>
                      <div className="text-[10px] text-blue-800 mt-1 font-normal">
                        2 Kursi · Tiket Biru
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditKategoriUtama('TAMATAN')}
                      className={`p-3 rounded-xl border-2 text-xs font-bold text-left transition-all ${
                        editKategoriUtama === 'TAMATAN'
                          ? 'border-amber-600 bg-amber-50 text-amber-950 font-black shadow-xs'
                          : 'border-[#D5C4B4] bg-[#FAF7F3] text-[#7A624E] hover:border-[#8C6A47]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>Tamatan</span>
                        <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                      </div>
                      <div className="text-[10px] text-amber-900 mt-1 font-normal">
                        2 Kursi · Tiket Kuning
                      </div>
                    </button>
                  </div>

                  {/* Sub-Pilihan Dinamis */}
                  {editKategoriUtama === 'TAMATAN' && (
                    <div className="pt-2">
                      <label className="block text-[11px] font-bold text-[#5C3E28] mb-1">
                        Pilih Sub-Bagian Tamatan:
                      </label>
                      <select
                        value={editBagianTamatan}
                        onChange={(e) => setEditBagianTamatan(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#D5C4B4] text-xs font-bold text-[#422F21] bg-white focus:outline-none focus:border-[#8C6A47]"
                      >
                        {BAGIAN_TAMATAN_LIST.map((bg) => (
                          <option key={bg} value={bg}>
                            Bagian {bg}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {editKategoriUtama === 'BIN_NADZOR' && (
                    <div className="pt-2">
                      <label className="block text-[11px] font-bold text-[#5C3E28] mb-1">
                        Pilih Jenjang Kelas Bin Nadzori:
                      </label>
                      <select
                        value={editKelas}
                        onChange={(e) => setEditKelas(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#D5C4B4] text-xs font-bold text-[#422F21] bg-white focus:outline-none focus:border-[#8C6A47]"
                      >
                        <option value="2 Tsanawiyah">2 Tsanawiyah</option>
                        <option value="3 Tsanawiyah">3 Tsanawiyah</option>
                        <option value="1 Aliyah">1 Aliyah</option>
                        <option value="2 Aliyah">2 Aliyah</option>
                        <option value="3 Aliyah">3 Aliyah</option>
                        <option value="Mutakhorijat">Mutakhorijat</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Koreksi Kuota Tambahan (Tambah / Kurang) */}
              <div className="p-4 rounded-2xl bg-white border-2 border-[#D5C4B4] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#422F21] uppercase tracking-wide flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-[#8C6A47]" />
                    <span>3. Koreksi Kuota Tambahan</span>
                  </span>
                  <span className="text-[10px] text-[#7A624E]">
                    Pagu Kursi Global Rp 80.000 / Kursi
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F3] border border-[#D5C4B4]">
                  <div>
                    <div className="text-xs font-bold text-[#422F21]">
                      Jumlah Kuota Tambahan:
                    </div>
                    <div className="text-[11px] text-[#7A624E]">
                      Total Hak Kursi ={' '}
                      <strong>
                        {(selectedItem.tipe === 'KELUARGA' && editKategoriUtama === 'BIL_GHOIB' ? 4 : 2) +
                          editKuotaTambahan}{' '}
                        Kursi
                      </strong>
                    </div>
                  </div>

                  {/* Stepper +/- */}
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setEditKuotaTambahan((prev) => Math.max(0, prev - 1))}
                      className="w-8 h-8 rounded-xl bg-white border-2 border-[#D5C4B4] text-[#422F21] hover:bg-[#EFE8E1] flex items-center justify-center font-black active:scale-95 transition-all"
                      title="Kurangi 1 Kuota"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center text-base font-serif font-black text-[#8C6A47]">
                      {editKuotaTambahan}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditKuotaTambahan((prev) => prev + 1)}
                      className="w-8 h-8 rounded-xl bg-white border-2 border-[#D5C4B4] text-[#422F21] hover:bg-[#EFE8E1] flex items-center justify-center font-black active:scale-95 transition-all"
                      title="Tambah 1 Kuota"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. Berita Acara & Catatan Alasan Rekonsiliasi */}
              <div>
                <label className="block text-xs font-bold text-[#422F21] mb-1">
                  Catatan Alasan Koreksi (Berita Acara Audit):
                </label>
                <textarea
                  value={editCatatanRekon}
                  onChange={(e) => setEditCatatanRekon(e.target.value)}
                  placeholder="Misal: Wali membatalkan 1 kuota tambahan / Barcode ter-scan dua kali oleh petugas pintu barat..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border-2 border-[#D5C4B4] text-xs focus:outline-none focus:border-[#8C6A47] bg-white text-[#422F21]"
                />
              </div>

              {/* Tombol Aksi Simpan Perubahan */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2.5 rounded-xl border-2 border-[#D5C4B4] text-xs font-bold text-[#7A624E] hover:bg-white transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSimpanKoreksi}
                  className="px-6 py-2.5 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white text-xs font-bold shadow-md transition-colors flex items-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan & Terapkan Perubahan Rekon</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
