'use client';

import React from 'react';
import { History } from 'lucide-react';
import { store } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/audit-log';
import { getWarnaTiketUndangan, getDefaultJalurMasuk } from '@/lib/types';
import { generateRandomKode, generateUniqueKodeFromDb } from '@/lib/utils';
import { GolonganUndangan, OPSI_UNDANGAN_ISTIMEWA } from './TamuFormFields';

export interface TamuPaymentUploaderProps {
  loadingAuditHistory: boolean;
  itemAuditHistory: any[];
}

export default function TamuPaymentUploader({
  loadingAuditHistory,
  itemAuditHistory,
}: TamuPaymentUploaderProps) {
  return (
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
                  Oleh: <span className="font-bold text-[#8C6A47]">{log.panitia_id || 'SYSTEM'}</span> (
                  {log.panitia_role || 'PANITIA'})
                </div>
                {log.catatan && (
                  <div className="text-[11px] text-stone-600 italic">&ldquo;{log.catatan}&rdquo;</div>
                )}
                {(log.nilai_lama || log.nilai_baru) && (
                  <div className="text-[11px] font-mono bg-stone-50 p-2 rounded-lg border border-stone-200 text-stone-700 overflow-x-auto">
                    {log.field && <span className="font-bold text-[#8C6A47]">{log.field}: </span>}
                    {log.nilai_lama && (
                      <span className="line-through text-rose-600 mr-2">{log.nilai_lama}</span>
                    )}
                    {log.nilai_baru && (
                      <span className="text-emerald-700 font-bold">{log.nilai_baru}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export async function submitTambahUndanganToSupabase(params: {
  selectedGolonganUndangan: GolonganUndangan;
  undanganKategoriDropdown: string;
  customKategoriInput: string;
  undanganForm: any;
  setUndanganForm: (f: any) => void;
  setUndanganKategoriDropdown: (v: string) => void;
  setCustomKategoriInput: (v: string) => void;
  setShowAddUndanganModal: (v: boolean) => void;
  onAddSuccess: (newUndanganItem: any, message: string) => void;
  submitLockTamu: React.MutableRefObject<boolean>;
  setIsSubmittingTamu: (v: boolean) => void;
}) {
  const {
    selectedGolonganUndangan,
    undanganKategoriDropdown,
    customKategoriInput,
    undanganForm,
    setUndanganForm,
    setUndanganKategoriDropdown,
    setCustomKategoriInput,
    setShowAddUndanganModal,
    onAddSuccess,
    submitLockTamu,
    setIsSubmittingTamu,
  } = params;

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

  const isAsatidzSekalian =
    selectedGolonganUndangan === 'UMUM' && finalKategori === 'Asatidz Mhmtq Sekalian';

  const p = (undanganForm.namaPutra || '').trim().toUpperCase();
  const w = (undanganForm.namaPutri || '').trim().toUpperCase();
  const n = (undanganForm.nama || '').trim().toUpperCase();

  if (!p && !w && !n) {
    alert(
      'Mohon isi minimal salah satu: Nama Tamu Putra (Kyai/Gus/Ust.) atau Nama Tamu Putri (Nyai/Ning/Ustazah)!'
    );
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

  const finalJalur = (
    undanganForm.jalurMasuk || getDefaultJalurMasuk(selectedGolonganUndangan)
  ).trim();

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
      let kodeBaru = generateRandomKode('UND');
      kodeBaru = await generateUniqueKodeFromDb('UND', 'tamu_undangan', supabase);
      res.code = kodeBaru;
      if (res.undangan) {
        res.undangan.kode = kodeBaru;
        if (res.undangan.kuota) {
          res.undangan.kuota.kodeQr = kodeBaru;
        }
      }

      const warnaTiketVal = getWarnaTiketUndangan(selectedGolonganUndangan, finalKategori);

      const { data: uInsertData, error } = await supabase.from('tamu_undangan').insert([
        {
          kode: kodeBaru,
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

      const newUndanganItem = {
        id: uInsertData && (uInsertData as any)[0]?.id ? (uInsertData as any)[0].id : kodeBaru,
        kode: kodeBaru,
        nama: finalNama,
        namaPutra: p || '',
        namaPutri: w || '',
        kategori: finalKategori,
        golongan: selectedGolonganUndangan || 'ISTIMEWA',
        instansi: finalInstansi || '-',
        alamat: finalAlamat || '-',
        noHp: undanganForm.noHp || '-',
        kuota: {
          id: kodeBaru,
          kodeQr: kodeBaru,
          kuotaDasar: kuotaBase,
          kuotaTambahan: 0,
          terpakai: 0,
          warnaTiket: warnaTiketVal,
        },
      };

      setShowAddUndanganModal(false);
      onAddSuccess(
        newUndanganItem,
        `✓ Berhasil menambahkan Tamu Undangan ke database: ${finalNama} (Kode: ${kodeBaru})`
      );

      logAudit({
        panitia_id: 'ADMIN_SEKRETARIAT',
        panitia_role: 'ADMIN',
        aksi: 'TAMBAH_TAMU',
        tabel: 'tamu_undangan',
        kode: kodeBaru,
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
}

export async function submitEditUndanganToSupabase(params: {
  editingItem: any;
  editGolonganUndangan: GolonganUndangan;
  editUndanganKategoriDropdown: string;
  editCustomKategoriInput: string;
  onEditSuccess: (message: string) => Promise<void> | void;
  setEditingItem: (item: any | null) => void;
}) {
  const {
    editingItem,
    editGolonganUndangan,
    editUndanganKategoriDropdown,
    editCustomKategoriInput,
    onEditSuccess,
    setEditingItem,
  } = params;

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

  const isAsatidzSekalian =
    editGolonganUndangan === 'UMUM' && finalKat === 'Asatidz Mhmtq Sekalian';

  let finalNama = (editingItem.nama || '').trim().toUpperCase();
  const p = (editingItem.namaPutra || '').trim().toUpperCase();
  const w = (editingItem.namaPutri || '').trim().toUpperCase();
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
    kuotaBase = 2;
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
    const finalJalurEdit = (
      editingItem.jalurMasuk || getDefaultJalurMasuk(editGolonganUndangan)
    ).trim();
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
}
