'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Users, Sparkles, Building, Edit, X, History, Loader2 } from 'lucide-react';
import { store } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/audit-log';
import { getWarnaTiketUndangan, getDefaultJalurMasuk } from '@/lib/types';

export type GolonganUndangan = 'ISTIMEWA' | 'KEHORMATAN' | 'UMUM';

// 1. Opsi Tamu Undangan Istimewa (Sesuai Permintaan)
export const OPSI_UNDANGAN_ISTIMEWA = [
  'VVIP',
  'VIP Bani Marzuqi',
  'VIP Bani Qomariyah',
  'VIP Bani Mahrus (Zainab)',
  'VIP Bani Salamah',
  'VIP Bani Aisyah',
  'VIP Bandar',
  'VIP Keluarga Kunir – Blitar',
  'VIP IDS',
  'Lainnya (Ketik Sendiri...)',
];

// 2. Opsi Tamu Undangan Umum (Sesuai Permintaan)
export const OPSI_UNDANGAN_UMUM = [
  'Asatidz Mhmtq Sekalian',
  'Asatidz Purna Bakti',
  'Asatidzah Mhmtq Nduduk Rumah',
  'Mustahiq Tamatan Non Purna',
  'Purna Mustahiqoh Ibtidaiyyah Tamatan Aliyah',
  'Pengajar Ekstrakurikuler Pondok (Mutakhorijin)',
  'Pengajar Unit',
  'Penguji Al-Qur\'an',
  'Perwakilan Pondok',
  'Lainnya (Ketik Sendiri...)',
];

export function getGolonganUndangan(u: any): GolonganUndangan {
  if (u.golongan) {
    if (u.golongan === 'ISTIMEWA' || u.golongan === 'UNDANGAN_ISTIMEWA') return 'ISTIMEWA';
    if (u.golongan === 'KEHORMATAN' || u.golongan === 'UNDANGAN_KEHORMATAN') return 'KEHORMATAN';
    if (u.golongan === 'UMUM' || u.golongan === 'UNDANGAN_UMUM') return 'UMUM';
  }

  const text = `${u.kategori || ''} ${u.nama || ''} ${u.instansi || ''}`.toLowerCase();

  if (
    text.includes('vvip') ||
    text.includes('bani') ||
    text.includes('bandar') ||
    text.includes('kunir') ||
    text.includes('istimewa')
  ) {
    return 'ISTIMEWA';
  }

  if (
    text.includes('masyayikh') ||
    text.includes('habaib') ||
    text.includes('pejabat') ||
    text.includes('forkopimda') ||
    text.includes('pengasuh') ||
    text.includes('tokoh') ||
    text.includes('kehormatan')
  ) {
    return 'KEHORMATAN';
  }

  return 'UMUM';
}

export function matchUndanganCategory(itemCategory: string, filterCategory: string): boolean {
  if (!filterCategory || filterCategory === 'SEMUA') return true;
  if (!itemCategory) return false;

  const ic = itemCategory.toLowerCase().trim();
  const fc = filterCategory.toLowerCase().trim();

  if (ic === fc) return true;

  // Normalisasi karakter alfanumerik
  const cleanIc = ic.replace(/[^a-z0-9]/g, '');
  const cleanFc = fc.replace(/[^a-z0-9]/g, '');

  if (cleanIc === cleanFc) return true;

  // Keyword matching untuk variasi gelar & ejaan
  if (fc.includes('penguji') && ic.includes('penguji')) return true;
  if (fc.includes('purna bakti') && ic.includes('purna bakti')) return true;
  if (fc.includes('nduduk') && ic.includes('nduduk')) return true;
  if (fc.includes('mutakhorijin') && ic.includes('mutakhorijin')) return true;
  if (fc.includes('pengajar unit') && ic.includes('pengajar unit')) return true;
  if (fc.includes('marzuqi') && ic.includes('marzuqi')) return true;
  if (fc.includes('qomariyah') && ic.includes('qomariyah')) return true;
  if (fc.includes('mahrus') && ic.includes('mahrus')) return true;
  if (fc.includes('salamah') && ic.includes('salamah')) return true;
  if (fc.includes('aisyah') && ic.includes('aisyah')) return true;
  if (fc.includes('bandar') && ic.includes('bandar')) return true;
  if (fc.includes('kunir') && ic.includes('kunir')) return true;

  return cleanIc.includes(cleanFc) || cleanFc.includes(cleanIc);
}

export interface TamuModalProps {
  showAddUndanganModal: boolean;
  setShowAddUndanganModal: (show: boolean) => void;
  selectedGolonganUndangan: GolonganUndangan;
  setSelectedGolonganUndangan: (gol: GolonganUndangan) => void;
  editingItem: any | null;
  setEditingItem: (item: any | null) => void;
  onAddSuccess: (newUndanganItem: any, message: string) => void;
  onEditSuccess: (message: string) => Promise<void> | void;
}

export default function TamuModal({
  showAddUndanganModal,
  setShowAddUndanganModal,
  selectedGolonganUndangan,
  setSelectedGolonganUndangan,
  editingItem,
  setEditingItem,
  onAddSuccess,
  onEditSuccess,
}: TamuModalProps) {
  const [isSubmittingTamu, setIsSubmittingTamu] = useState(false);
  const submitLockTamu = useRef(false);

  // Form state tambah undangan
  const [undanganForm, setUndanganForm] = useState({
    nama: '',
    namaPutra: '',
    namaPutri: '',
    kategori: 'VVIP',
    instansi: '',
    alamat: '',
    noHp: '',
    kuotaDasar: 2,
    jalurMasuk: getDefaultJalurMasuk('ISTIMEWA'),
  });

  // State dropdown kategori undangan
  const [undanganKategoriDropdown, setUndanganKategoriDropdown] = useState<string>('VVIP');
  const [customKategoriInput, setCustomKategoriInput] = useState<string>('');

  // State dropdown kategori undangan saat edit
  const [editUndanganKategoriDropdown, setEditUndanganKategoriDropdown] = useState<string>('VVIP');
  const [editCustomKategoriInput, setEditCustomKategoriInput] = useState<string>('');
  const [editGolonganUndangan, setEditGolonganUndangan] = useState<GolonganUndangan>('ISTIMEWA');

  // Edit Modal Audit History Tab State
  const [editModalTab, setEditModalTab] = useState<'FORM' | 'RIWAYAT'>('FORM');
  const [itemAuditHistory, setItemAuditHistory] = useState<any[]>([]);
  const [loadingAuditHistory, setLoadingAuditHistory] = useState(false);

  const isEditingUndangan = editingItem && editingItem.tipe === 'UNDANGAN';

  // Reset form saat modal tambah undangan dibuka
  useEffect(() => {
    if (showAddUndanganModal) {
      let defaultKategori = OPSI_UNDANGAN_ISTIMEWA[0];
      if (selectedGolonganUndangan === 'KEHORMATAN') defaultKategori = 'Tamu Kehormatan';
      else if (selectedGolonganUndangan === 'UMUM') defaultKategori = OPSI_UNDANGAN_UMUM[0];
      setUndanganKategoriDropdown(defaultKategori);
      setUndanganForm({
        nama: '',
        namaPutra: '',
        namaPutri: '',
        kategori: defaultKategori,
        instansi: '',
        alamat: '',
        noHp: '',
        kuotaDasar: selectedGolonganUndangan === 'ISTIMEWA' ? 2 : selectedGolonganUndangan === 'KEHORMATAN' ? 4 : 2,
        jalurMasuk: getDefaultJalurMasuk(selectedGolonganUndangan),
      });
      setCustomKategoriInput('');
    }
  }, [showAddUndanganModal]);

  // Sinkronisasi state edit golongan & kategori ketika editingItem dibuka
  useEffect(() => {
    if (isEditingUndangan && editingItem) {
      const raw = editingItem.raw || editingItem;
      const gol = editingItem.golonganUndangan || getGolonganUndangan(raw);
      setEditGolonganUndangan(gol);
      if (gol !== 'KEHORMATAN') {
        const opts = gol === 'ISTIMEWA' ? OPSI_UNDANGAN_ISTIMEWA : OPSI_UNDANGAN_UMUM;
        const currentKat = editingItem.kategori || '';
        if (opts.includes(currentKat)) {
          setEditUndanganKategoriDropdown(currentKat);
          setEditCustomKategoriInput('');
        } else {
          setEditUndanganKategoriDropdown('Lainnya (Ketik Sendiri...)');
          setEditCustomKategoriInput(currentKat);
        }
      }
    }
  }, [isEditingUndangan, editingItem?.kode]);

  useEffect(() => {
    if (isEditingUndangan && editingItem?.kode) {
      setLoadingAuditHistory(true);
      supabase
        .from('audit_log')
        .select('*')
        .eq('kode', editingItem.kode)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) {
            setItemAuditHistory(data);
          } else {
            setItemAuditHistory([]);
          }
          setLoadingAuditHistory(false);
        });
    } else if (!isEditingUndangan) {
      setItemAuditHistory([]);
      setEditModalTab('FORM');
    }
  }, [isEditingUndangan, editingItem?.kode]);

  // Handler Tambah Undangan Baru (Direct Supabase .insert() + Optimistic UI)
  const handleTambahUndangan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLockTamu.current || isSubmittingTamu) return;

    let finalKategori = '';
    if (selectedGolonganUndangan === 'KEHORMATAN') {
      finalKategori = 'Tamu Kehormatan';
    } else {
      finalKategori =
        undanganKategoriDropdown === 'Lainnya (Ketik Sendiri...)'
          ? customKategoriInput.trim()
          : undanganKategoriDropdown.trim();

      if (!finalKategori) {
        alert('Kategori undangan wajib diisi atau diketik!');
        return;
      }
    }

    const isAsatidzSekalian = selectedGolonganUndangan === 'UMUM' && finalKategori === 'Asatidz Mhmtq Sekalian';

    const p = (undanganForm.namaPutra || '').trim().toUpperCase();
    const w = (undanganForm.namaPutri || '').trim().toUpperCase();
    const n = (undanganForm.nama || '').trim().toUpperCase();

    if (!p && !w && !n) {
      alert('Mohon isi minimal salah satu: Nama Tamu Putra (Kyai/Gus/Ust.) atau Nama Tamu Putri (Nyai/Ning/Ustazah)!');
      return;
    }

    submitLockTamu.current = true;
    setIsSubmittingTamu(true);

    let finalNama = '';
    let kuotaBase = 1;

    if (p && w) {
      finalNama = `${p} & ${w}`;
      kuotaBase = 2;
    } else if (p) {
      finalNama = p;
      kuotaBase = 1;
    } else if (w) {
      finalNama = w;
      kuotaBase = 1;
    } else {
      finalNama = n;
      kuotaBase = 1;
    }

    if (isAsatidzSekalian && p && w) {
      kuotaBase = 2;
    }

    let finalAlamat = '';
    let finalInstansi = '';

    if (selectedGolonganUndangan === 'ISTIMEWA' || selectedGolonganUndangan === 'KEHORMATAN') {
      finalAlamat = (undanganForm.alamat || undanganForm.instansi || '').trim();
      finalInstansi = finalAlamat;
    } else {
      finalInstansi = (undanganForm.instansi || '').trim();
      finalAlamat = (undanganForm.alamat || '').trim();
    }

    const finalJalur = (undanganForm.jalurMasuk || getDefaultJalurMasuk(selectedGolonganUndangan)).trim();

    const res = store.tambahUndangan({
      nama: finalNama,
      namaPutra: p,
      namaPutri: w,
      kategori: finalKategori,
      instansi: finalInstansi,
      alamat: finalAlamat,
      kuotaDasar: kuotaBase,
      golongan: selectedGolonganUndangan,
      jalurMasuk: finalJalur,
    });

    if (res.ok) {
      try {
        const warnaTiketVal = getWarnaTiketUndangan(selectedGolonganUndangan, finalKategori);

        // Insert langsung ke tabel Supabase 'tamu_undangan'
        const { data: uInsertData, error } = await supabase.from('tamu_undangan').insert([
          {
            kode: res.code,
            nama: finalNama,
            nama_putra: p || null,
            nama_putri: w || null,
            instansi: finalInstansi || '-',
            alamat: finalAlamat || '-',
            kategori: finalKategori,
            sub_kategori: selectedGolonganUndangan || 'ISTIMEWA',
            no_hp: undanganForm.noHp || '-',
            kuota_terpakai: 0,
            status_konfirmasi: 'BELUM',
            warna_tiket: warnaTiketVal,
            jalur_masuk: finalJalur,
          },
        ]);
        if (error) {
          console.error('Supabase insert error (tamu_undangan):', error);
          alert(`Gagal menyimpan Tamu Undangan ke Supabase DB: ${error.message}`);
          return;
        }

        // Optimistic UI: Sisipkan langsung ke undanganList
        const newUndanganItem = {
          id: uInsertData && (uInsertData as any)[0]?.id ? (uInsertData as any)[0].id : res.code,
          kode: res.code,
          nama: finalNama,
          namaPutra: p || '',
          namaPutri: w || '',
          kategori: finalKategori,
          golongan: selectedGolonganUndangan || 'ISTIMEWA',
          instansi: finalInstansi || '-',
          alamat: finalAlamat || '-',
          noHp: undanganForm.noHp || '-',
          kuota: {
            id: res.code,
            kodeQr: res.code,
            kuotaDasar: kuotaBase,
            kuotaTambahan: 0,
            terpakai: 0,
            warnaTiket: warnaTiketVal,
          },
        };

        // Tutup modal SEGERA & tampilkan toast (< 500ms)
        setShowAddUndanganModal(false);
        onAddSuccess(
          newUndanganItem,
          `✓ Berhasil menambahkan Tamu Undangan ke database: ${finalNama} (Kode: ${res.code})`
        );

        // logAudit fire-and-forget (tanpa await yang memblokir UI)
        logAudit({
          panitia_id: 'ADMIN_SEKRETARIAT',
          panitia_role: 'ADMIN',
          aksi: 'TAMBAH_TAMU',
          tabel: 'tamu_undangan',
          kode: res.code,
          nama: finalNama,
          field: 'tambah_tamu_baru',
          nilai_baru: JSON.stringify(undanganForm),
          detail: undanganForm,
          catatan: `Penambahan Tamu Undangan Baru (${res.code})`,
        }).catch((err) => console.warn('Audit log error:', err));

        setUndanganForm({
          nama: '',
          namaPutra: '',
          namaPutri: '',
          kategori: OPSI_UNDANGAN_ISTIMEWA[0],
          instansi: '',
          alamat: '',
          noHp: '',
          kuotaDasar: 1,
          jalurMasuk: getDefaultJalurMasuk('ISTIMEWA'),
        });
        setUndanganKategoriDropdown(OPSI_UNDANGAN_ISTIMEWA[0]);
        setCustomKategoriInput('');
      } catch (err: any) {
        console.warn('Supabase direct insert tamu_undangan warning:', err);
        alert(`Terjadi kesalahan: ${err.message || err}`);
      } finally {
        submitLockTamu.current = false;
        setIsSubmittingTamu(false);
      }
    } else {
      submitLockTamu.current = false;
      setIsSubmittingTamu(false);
    }
  };

  // Handler Edit Tamu Undangan (Direct Supabase Update by Kode)
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || editingItem.tipe !== 'UNDANGAN') return;

    const targetKode = editingItem.kode;

    let finalKat = '';
    if (editGolonganUndangan === 'KEHORMATAN') {
      finalKat = editingItem.kategori || 'Tamu Kehormatan';
    } else {
      finalKat =
        editUndanganKategoriDropdown === 'Lainnya (Ketik Sendiri...)'
          ? editCustomKategoriInput.trim()
          : editUndanganKategoriDropdown.trim();

      if (!finalKat) {
        alert('Kategori undangan wajib diisi atau diketik!');
        return;
      }
    }

    const isAsatidzSekalian = editGolonganUndangan === 'UMUM' && finalKat === 'Asatidz Mhmtq Sekalian';

    let finalNama = (editingItem.nama || '').trim().toUpperCase();
    let p = (editingItem.namaPutra || '').trim().toUpperCase();
    let w = (editingItem.namaPutri || '').trim().toUpperCase();
    let kuotaBase = 1;

    if (editGolonganUndangan === 'ISTIMEWA') {
      if (!p && !w && !finalNama) {
        alert('Mohon isi minimal salah satu: Nama Tamu Putra atau Nama Tamu Putri!');
        return;
      }
      if (p && w) {
        finalNama = `${p} & ${w}`;
        kuotaBase = 2;
      } else {
        kuotaBase = 1;
      }
    } else if (isAsatidzSekalian) {
      if (!p && !w && !finalNama) {
        alert('Mohon isi minimal salah satu: Nama Tamu Putra atau Nama Tamu Putri!');
        return;
      }
      if (p && w) {
        finalNama = `${p} & ${w}`;
      } else if (p || w) {
        finalNama = p || w;
      }
      kuotaBase = 2; // Khusus Asatidz Mhmtq Sekalian OTOMATIS = 2 (1 Putra + 1 Putri)
    } else {
      if (!finalNama) {
        alert('Nama tamu undangan wajib diisi!');
        return;
      }
      kuotaBase = 1;
    }

    let finalAlamat = '';
    let finalInstansi = '';

    if (editGolonganUndangan === 'ISTIMEWA' || editGolonganUndangan === 'KEHORMATAN') {
      finalAlamat = (editingItem.alamat || editingItem.instansi || 'Kediri').trim();
      finalInstansi = finalAlamat;
    } else {
      finalInstansi = (editingItem.instansi || 'Pondok Pesantren Lirboyo').trim();
      finalAlamat = (editingItem.alamat || 'Kediri').trim();
    }

    try {
      const finalJalurEdit = (editingItem.jalurMasuk || getDefaultJalurMasuk(editGolonganUndangan)).trim();
      const { error } = await supabase
        .from('tamu_undangan')
        .update({
          nama: finalNama,
          nama_putra: p || null,
          nama_putri: w || null,
          kategori: finalKat,
          sub_kategori: editGolonganUndangan || 'ISTIMEWA',
          instansi: finalInstansi || '-',
          alamat: finalAlamat || '-',
          no_hp: (editingItem.noHp || '').trim() || '-',
          warna_tiket: getWarnaTiketUndangan(editGolonganUndangan, finalKat),
          jalur_masuk: finalJalurEdit,
        })
        .eq('kode', targetKode);

      if (error) {
        console.error('Supabase update error (tamu_undangan):', error);
        alert(`Gagal memperbarui data tamu di Supabase: ${error.message}`);
        return;
      }
    } catch (err: any) {
      console.error('Exception updating tamu_undangan:', err);
      alert(`Terjadi kesalahan saat menyimpan: ${err.message || err}`);
      return;
    }

    // Sync store
    store.editPeserta(targetKode, {
      nama: finalNama,
      namaPutra: p,
      namaPutri: w,
      kategori: finalKat,
      instansi: finalInstansi,
      alamat: finalAlamat,
      golongan: editGolonganUndangan,
      kuotaDasar: kuotaBase,
    });

    await logAudit({
      panitia_id: 'ADMIN_SEKRETARIAT',
      panitia_role: 'ADMIN',
      aksi: 'EDIT_TAMU',
      tabel: 'tamu_undangan',
      kode: targetKode,
      nama: finalNama,
      field: 'edit_tamu',
      nilai_baru: JSON.stringify(editingItem),
      detail: editingItem,
      catatan: `Perubahan Data Tamu Undangan (${targetKode})`,
    });

    await onEditSuccess(`✓ Perubahan data tamu undangan ${targetKode} berhasil disimpan!`);
    setEditingItem(null);
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* MODAL 2: TAMBAH TAMU UNDANGAN (Istimewa, Kehormatan, Umum) */}
      {/* ========================================================================= */}
      {showAddUndanganModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-full md:max-w-2xl lg:max-w-3xl w-full max-h-[92dvh] flex flex-col shadow-2xl border-2 border-opera-800 overflow-hidden">
            <div className="bg-gradient-to-r from-opera-950 to-opera-900 text-white p-4 sm:p-5 md:p-6 flex items-center justify-between border-b border-gold-500/40 shrink-0">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gold-500/20 border border-gold-500/50 flex items-center justify-center text-gold-400 shrink-0">
                  {selectedGolonganUndangan === 'ISTIMEWA' ? (
                    <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />
                  ) : selectedGolonganUndangan === 'KEHORMATAN' ? (
                    <Building className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
                  ) : (
                    <Users className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif font-black text-base sm:text-lg md:text-xl text-gold-300 truncate">
                    Tambah Tamu {selectedGolonganUndangan === 'ISTIMEWA' ? 'Istimewa' : selectedGolonganUndangan === 'KEHORMATAN' ? 'Kehormatan' : 'Umum'}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] md:text-xs text-opera-200 truncate mt-0.5">
                    {selectedGolonganUndangan === 'ISTIMEWA'
                      ? 'VVIP & Dzurriyyah / Keluarga Mahrus / Kunir / Bandar'
                      : selectedGolonganUndangan === 'KEHORMATAN'
                      ? 'Masyayikh, Habaib, Pejabat & Ulama Sepuh'
                      : 'Asatidz MHMTQ, Mustahiq, Pengajar Unit & Penguji'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddUndanganModal(false)}
                className="text-opera-200 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            <form onSubmit={handleTambahUndangan} className="p-4 sm:p-6 md:p-8 space-y-4 md:space-y-5 text-xs md:text-sm overflow-y-auto flex-1">
              {/* 3 Kotak Pemilih Golongan Undangan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 text-xs md:text-sm">
                  Pilih Golongan Tamu Undangan *
                </label>
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGolonganUndangan('ISTIMEWA');
                      setUndanganKategoriDropdown(OPSI_UNDANGAN_ISTIMEWA[0]);
                      setUndanganForm({
                        ...undanganForm,
                        kategori: OPSI_UNDANGAN_ISTIMEWA[0],
                        instansi: '',
                        alamat: '',
                        kuotaDasar: 2,
                        jalurMasuk: getDefaultJalurMasuk('ISTIMEWA'),
                      });
                      setCustomKategoriInput('');
                    }}
                    className={`py-2.5 px-2 rounded-xl font-bold text-xs md:text-sm border flex items-center justify-center space-x-1.5 transition-all ${
                      selectedGolonganUndangan === 'ISTIMEWA'
                        ? 'bg-amber-100 text-amber-900 border-amber-400 ring-2 ring-amber-400/30 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-600" />
                    <span>🌟 Istimewa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGolonganUndangan('KEHORMATAN');
                      setUndanganForm({
                        ...undanganForm,
                        kategori: 'Tamu Kehormatan',
                        instansi: '',
                        alamat: '',
                        kuotaDasar: 4,
                        jalurMasuk: getDefaultJalurMasuk('KEHORMATAN'),
                      });
                      setCustomKategoriInput('');
                    }}
                    className={`py-2.5 px-2 rounded-xl font-bold text-xs md:text-sm border flex items-center justify-center space-x-1.5 transition-all ${
                      selectedGolonganUndangan === 'KEHORMATAN'
                        ? 'bg-purple-100 text-purple-900 border-purple-400 ring-2 ring-purple-400/30 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-600" />
                    <span>🏛️ Kehormatan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGolonganUndangan('UMUM');
                      setUndanganKategoriDropdown(OPSI_UNDANGAN_UMUM[0]);
                      setUndanganForm({
                        ...undanganForm,
                        kategori: OPSI_UNDANGAN_UMUM[0],
                        instansi: '',
                        alamat: '',
                        kuotaDasar: 1,
                        jalurMasuk: getDefaultJalurMasuk('UMUM'),
                      });
                      setCustomKategoriInput('');
                    }}
                    className={`py-2.5 px-2 rounded-xl font-bold text-xs md:text-sm border flex items-center justify-center space-x-1.5 transition-all ${
                      selectedGolonganUndangan === 'UMUM'
                        ? 'bg-cyan-100 text-cyan-900 border-cyan-400 ring-2 ring-cyan-400/30 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-cyan-700" />
                    <span>👥 Umum</span>
                  </button>
                </div>
              </div>

              {/* NAMA TAMU UNDANGAN: INPUT PUTRA & PUTRI UNTUK SEMUA GOLONGAN */}
              <div className="p-4 md:p-5 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-amber-950 text-xs md:text-sm flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Nama Tamu Undangan *</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 text-[11px] md:text-xs mb-1">
                      👨 Nama Tamu Putra (Gus / Kyai / Ust.)
                    </label>
                    <input
                      type="text"
                      value={undanganForm.namaPutra}
                      onChange={(e) => setUndanganForm({ ...undanganForm, namaPutra: e.target.value })}
                      placeholder="Nama tamu putra..."
                      className="w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase font-semibold text-xs md:text-sm bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 text-[11px] md:text-xs mb-1">
                      👩 Nama Tamu Putri (Ning / Nyai / Ust.)
                    </label>
                    <input
                      type="text"
                      value={undanganForm.namaPutri}
                      onChange={(e) => setUndanganForm({ ...undanganForm, namaPutri: e.target.value })}
                      placeholder="Nama tamu putri..."
                      className="w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase font-semibold text-xs md:text-sm bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* KATEGORI UNDANGAN: DIHAPUS UNTUK KEHORMATAN, HANYA MUNCUL DI ISTIMEWA DAN UMUM */}
              {selectedGolonganUndangan !== 'KEHORMATAN' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kategori Undangan *
                  </label>
                  <select
                    value={undanganKategoriDropdown}
                    onChange={(e) => {
                      const val = e.target.value;
                      setUndanganKategoriDropdown(val);
                      const newKuota = (selectedGolonganUndangan === 'UMUM' && val === 'Asatidz Mhmtq Sekalian') ? 2 : 1;
                      if (val !== 'Lainnya (Ketik Sendiri...)') {
                        setUndanganForm({ ...undanganForm, kategori: val, kuotaDasar: newKuota });
                      } else {
                        setUndanganForm({ ...undanganForm, kategori: customKategoriInput, kuotaDasar: newKuota });
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 bg-white font-medium text-slate-800"
                  >
                    {(selectedGolonganUndangan === 'ISTIMEWA'
                      ? OPSI_UNDANGAN_ISTIMEWA
                      : OPSI_UNDANGAN_UMUM
                    ).map((kat) => (
                      <option key={kat} value={kat}>
                        {kat}
                      </option>
                    ))}
                  </select>

                  {/* Input Khusus jika memilih opsi terakhir 'Lainnya (Ketik Sendiri...)' */}
                  {undanganKategoriDropdown === 'Lainnya (Ketik Sendiri...)' && (
                    <div className="mt-2.5 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                      <label className="block text-[11px] font-bold text-opera-900">
                        Ketik Kategori Undangan Sendiri *
                      </label>
                      <input
                        type="text"
                        required
                        value={customKategoriInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomKategoriInput(val);
                          setUndanganForm({ ...undanganForm, kategori: val });
                        }}
                        placeholder=""
                        className="w-full px-3.5 py-2.5 rounded-xl border-2 border-opera-500 bg-opera-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-opera-700 font-medium placeholder:text-slate-400"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* INSTANSI / ALAMAT SESUAI GOLONGAN */}
              {selectedGolonganUndangan === 'ISTIMEWA' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Alamat *
                  </label>
                  <input
                    type="text"
                    value={undanganForm.alamat}
                    onChange={(e) =>
                      setUndanganForm({ ...undanganForm, alamat: e.target.value, instansi: e.target.value })
                    }
                    placeholder=""
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-medium"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Alamat asal / daerah Tamu Istimewa</p>
                </div>
              )}

              {selectedGolonganUndangan === 'KEHORMATAN' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Alamat *
                  </label>
                  <input
                    type="text"
                    value={undanganForm.alamat}
                    onChange={(e) =>
                      setUndanganForm({ ...undanganForm, alamat: e.target.value, instansi: e.target.value })
                    }
                    placeholder=""
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-medium"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Alamat asal / kediaman Masyayikh & Ulama Sepuh</p>
                </div>
              )}

              {selectedGolonganUndangan === 'UMUM' && (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Instansi / Asal Lembaga</label>
                    <input
                      type="text"
                      value={undanganForm.instansi}
                      onChange={(e) =>
                        setUndanganForm({ ...undanganForm, instansi: e.target.value })
                      }
                      placeholder=""
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Alamat</label>
                    <input
                      type="text"
                      value={undanganForm.alamat}
                      onChange={(e) =>
                        setUndanganForm({ ...undanganForm, alamat: e.target.value })
                      }
                      placeholder=""
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-medium"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Alamat domisili atau tempat tinggal</p>
                  </div>
                </>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
                <input
                  type="text"
                  value={undanganForm.noHp}
                  onChange={(e) =>
                    setUndanganForm({ ...undanganForm, noHp: e.target.value })
                  }
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Masuk Melalui (Jalur Masuk) *
                </label>
                <input
                  type="text"
                  value={undanganForm.jalurMasuk}
                  onChange={(e) =>
                    setUndanganForm({ ...undanganForm, jalurMasuk: e.target.value })
                  }
                  placeholder="Contoh: Gerbang Selatan (Bola Dunia)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-medium text-slate-800"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Otomatis terisi berdasarkan golongan (Istimewa/Kehormatan: "Jalur VIP", Umum: "Gerbang Selatan (Bola Dunia)"), tetap dapat di-edit manual.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddUndanganModal(false)}
                  disabled={isSubmittingTamu}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTamu}
                  className="px-6 py-2.5 rounded-xl bg-opera-850 hover:bg-opera-900 text-gold-300 font-serif font-black shadow border border-gold-500/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingTamu ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-gold-300 shrink-0" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    'Simpan Undangan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3 (UNDANGAN): EDIT TAMU UNDANGAN */}
      {/* ========================================================================= */}
      {isEditingUndangan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-full md:max-w-2xl lg:max-w-3xl w-full max-h-[92dvh] flex flex-col shadow-2xl border-2 border-opera-800 overflow-hidden">
            <div className="bg-gradient-to-r from-opera-950 to-opera-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-gold-500/40 shrink-0">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/50 flex items-center justify-center text-blue-300 shrink-0">
                  <Edit className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif font-black text-sm sm:text-base text-gold-300 truncate">
                    Edit Tamu Undangan: {editingItem.kode}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-opera-200 truncate">
                    Perbarui data tamu dan jatah kursi
                  </p>
                </div>
              </div>
              <button onClick={() => setEditingItem(null)} className="text-opera-200 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB NAVIGASI EDIT MODAL */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => setEditModalTab('FORM')}
                className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
                  editModalTab === 'FORM'
                    ? 'border-[#8C6A47] text-[#422F21]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                📝 Form Edit Data
              </button>
              <button
                type="button"
                onClick={() => setEditModalTab('RIWAYAT')}
                className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  editModalTab === 'RIWAYAT'
                    ? 'border-[#8C6A47] text-[#422F21]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Riwayat Audit ({itemAuditHistory.length})</span>
              </button>
            </div>

            {editModalTab === 'FORM' ? (
              <form onSubmit={handleSaveEdit} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
                {/* 3 Kotak Pemilih Golongan Undangan Edit */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Golongan Tamu Undangan *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditGolonganUndangan('ISTIMEWA');
                        setEditUndanganKategoriDropdown(OPSI_UNDANGAN_ISTIMEWA[0]);
                        setEditCustomKategoriInput('');
                        setEditingItem({
                          ...editingItem,
                          jalurMasuk: getDefaultJalurMasuk('ISTIMEWA'),
                        });
                      }}
                      className={`py-2 px-2 rounded-xl font-bold text-xs border flex items-center justify-center space-x-1.5 transition-all ${
                        editGolonganUndangan === 'ISTIMEWA'
                          ? 'bg-amber-100 text-amber-900 border-amber-400 ring-2 ring-amber-400/30 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>🌟 Istimewa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditGolonganUndangan('KEHORMATAN');
                        setEditCustomKategoriInput('');
                        setEditingItem({
                          ...editingItem,
                          jalurMasuk: getDefaultJalurMasuk('KEHORMATAN'),
                        });
                      }}
                      className={`py-2 px-2 rounded-xl font-bold text-xs border flex items-center justify-center space-x-1.5 transition-all ${
                        editGolonganUndangan === 'KEHORMATAN'
                          ? 'bg-purple-100 text-purple-900 border-purple-400 ring-2 ring-purple-400/30 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Building className="w-3.5 h-3.5 text-purple-600" />
                      <span>🏛️ Kehormatan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditGolonganUndangan('UMUM');
                        setEditUndanganKategoriDropdown(OPSI_UNDANGAN_UMUM[0]);
                        setEditCustomKategoriInput('');
                        setEditingItem({
                          ...editingItem,
                          jalurMasuk: getDefaultJalurMasuk('UMUM'),
                        });
                      }}
                      className={`py-2 px-2 rounded-xl font-bold text-xs border flex items-center justify-center space-x-1.5 transition-all ${
                        editGolonganUndangan === 'UMUM'
                          ? 'bg-cyan-100 text-cyan-900 border-cyan-400 ring-2 ring-cyan-400/30 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5 text-cyan-700" />
                      <span>👥 Umum</span>
                    </button>
                  </div>
                </div>

                {/* NAMA TAMU ISTIMEWA ATAU ASATIDZ MHMTQ SEKALIAN (PUTRA & PUTRI) ATAU NAMA BIASA */}
                {(editGolonganUndangan === 'ISTIMEWA' || (editGolonganUndangan === 'UMUM' && editUndanganKategoriDropdown === 'Asatidz Mhmtq Sekalian')) ? (
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-amber-950 text-xs flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Nama Tamu Undangan *</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 text-[11px] mb-1">
                          👨 Nama Tamu Putra (Gus / Kyai / Ust.)
                        </label>
                        <input
                          type="text"
                          value={editingItem.namaPutra || ''}
                          onChange={(e) => {
                            const p = e.target.value;
                            const w = editingItem.namaPutri || '';
                            const combined = p.trim() && w.trim() ? `${p.trim()} & ${w.trim()}` : (p.trim() || w.trim());
                            setEditingItem({ ...editingItem, namaPutra: p, nama: combined });
                          }}
                          placeholder="Nama tamu putra..."
                          className="w-full px-3 py-2.5 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase font-semibold text-xs bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 text-[11px] mb-1">
                          👩 Nama Tamu Putri (Ning / Nyai / Ust.)
                        </label>
                        <input
                          type="text"
                          value={editingItem.namaPutri || ''}
                          onChange={(e) => {
                            const w = e.target.value;
                            const p = editingItem.namaPutra || '';
                            const combined = p.trim() && w.trim() ? `${p.trim()} & ${w.trim()}` : (p.trim() || w.trim());
                            setEditingItem({ ...editingItem, namaPutri: w, nama: combined });
                          }}
                          placeholder="Nama tamu putri..."
                          className="w-full px-3 py-2.5 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase font-semibold text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-slate-700">
                        Nama Tamu / Tokoh / Kyai *
                      </label>
                      <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-semibold">
                        Kuota otomatis: 1 kursi
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={editingItem.nama || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, nama: e.target.value })}
                      placeholder=""
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 uppercase font-semibold"
                    />
                  </div>
                )}

                {/* KATEGORI UNDANGAN: DIHAPUS UNTUK KEHORMATAN, HANYA MUNCUL DI ISTIMEWA DAN UMUM */}
                {editGolonganUndangan !== 'KEHORMATAN' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Kategori Undangan *
                    </label>
                    <select
                      value={editUndanganKategoriDropdown}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditUndanganKategoriDropdown(val);
                        if (editingItem.tipe === 'UNDANGAN' && editGolonganUndangan === 'UMUM') {
                          setEditingItem({
                            ...editingItem,
                            kategori: val,
                            kuotaDasar: val === 'Asatidz Mhmtq Sekalian' ? 2 : 1,
                          });
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 bg-white font-medium text-slate-800"
                    >
                      {(editGolonganUndangan === 'ISTIMEWA'
                        ? OPSI_UNDANGAN_ISTIMEWA
                        : OPSI_UNDANGAN_UMUM
                      ).map((kat) => (
                        <option key={kat} value={kat}>
                          {kat}
                        </option>
                      ))}
                    </select>

                    {editUndanganKategoriDropdown === 'Lainnya (Ketik Sendiri...)' && (
                      <div className="mt-2.5 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                        <label className="block text-[11px] font-bold text-opera-900">
                          Ketik Kategori Undangan Sendiri *
                        </label>
                        <input
                          type="text"
                          required
                          value={editCustomKategoriInput}
                          onChange={(e) => setEditCustomKategoriInput(e.target.value)}
                          placeholder="Ketik kategori baru"
                          className="w-full px-3.5 py-2.5 rounded-xl border-2 border-opera-500 bg-opera-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-opera-700 font-medium"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* INSTANSI / ALAMAT SESUAI GOLONGAN */}
                {editGolonganUndangan === 'ISTIMEWA' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Alamat *
                    </label>
                    <input
                      type="text"
                      value={editingItem.alamat || editingItem.instansi || ''}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          alamat: e.target.value,
                          instansi: e.target.value,
                        })
                      }
                      placeholder=""
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-medium"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Alamat asal / daerah Tamu Istimewa</p>
                  </div>
                )}

                {editGolonganUndangan === 'KEHORMATAN' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Alamat *
                    </label>
                    <input
                      type="text"
                      value={editingItem.alamat || editingItem.instansi || ''}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          alamat: e.target.value,
                          instansi: e.target.value,
                        })
                      }
                      placeholder=""
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-medium"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Alamat asal / kediaman Masyayikh & Ulama Sepuh</p>
                  </div>
                )}

                {editGolonganUndangan === 'UMUM' && (
                  <>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Instansi / Asal Lembaga</label>
                      <input
                        type="text"
                        value={editingItem.instansi || ''}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            instansi: e.target.value,
                          })
                        }
                        placeholder=""
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Alamat</label>
                      <input
                        type="text"
                        value={editingItem.alamat || ''}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            alamat: e.target.value,
                          })
                        }
                        placeholder=""
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-medium"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Alamat domisili atau tempat tinggal</p>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Masuk Melalui (Jalur Masuk) *
                      </label>
                      <input
                        type="text"
                        value={editingItem.jalurMasuk || ''}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            jalurMasuk: e.target.value,
                          })
                        }
                        placeholder="Contoh: Gerbang Selatan (Bola Dunia)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-medium text-slate-800"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Otomatis terisi berdasarkan golongan (Istimewa/Kehormatan: "Jalur VIP", Umum: "Gerbang Selatan (Bola Dunia)"), tetap dapat di-edit manual.
                      </p>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
                      <input
                        type="text"
                        value={editingItem.noHp || ''}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            noHp: e.target.value,
                          })
                        }
                        placeholder="08xxxxxxxxxx"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-mono"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Format: 08xx atau 628xx. Boleh kosong (opsional).</p>
                    </div>
                  </>
                )}

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold shadow"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 sm:p-6 space-y-3 text-xs overflow-y-auto flex-1 bg-stone-50">
                {loadingAuditHistory ? (
                  <div className="py-12 text-center text-stone-500 font-medium">
                    Memuat riwayat audit...
                  </div>
                ) : itemAuditHistory.length === 0 ? (
                  <div className="py-12 text-center text-stone-500">
                    <History className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    <p className="font-bold">Belum Ada Riwayat Audit</p>
                    <p className="text-[11px] text-stone-400 mt-1">
                      Setiap aksi perubahan data pada peserta ini akan otomatis tercatat di sini.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {itemAuditHistory.map((log) => {
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
                        <div
                          key={log.id}
                          className="p-3.5 rounded-xl bg-white border border-stone-200 shadow-2xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] bg-amber-100 text-amber-900 border border-amber-300">
                              {log.aksi}
                            </span>
                            <span className="text-[10px] text-stone-400 font-mono">{dtStr} WIB</span>
                          </div>
                          <div className="text-xs font-semibold text-[#422F21]">
                            Oleh: <span className="font-bold text-[#8C6A47]">{log.panitia_id || 'SYSTEM'}</span> ({log.panitia_role || 'PANITIA'})
                          </div>
                          {log.catatan && (
                            <div className="text-[11px] text-stone-600 italic">
                              "{log.catatan}"
                            </div>
                          )}
                          {(log.nilai_lama || log.nilai_baru) && (
                            <div className="text-[11px] font-mono bg-stone-50 p-2 rounded-lg border border-stone-200 text-stone-700 overflow-x-auto">
                              {log.field && <span className="font-bold text-[#8C6A47]">{log.field}: </span>}
                              {log.nilai_lama && <span className="line-through text-rose-600 mr-2">{log.nilai_lama}</span>}
                              {log.nilai_baru && <span className="text-emerald-700 font-bold">{log.nilai_baru}</span>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
