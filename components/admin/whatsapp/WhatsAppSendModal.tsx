'use client';

import React from 'react';
import { Smartphone, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { normalkanNomorHp } from '@/lib/hmac';
import { getTeksPesan, getTeksPesanTamu } from './WhatsAppStats';

export async function updateStatusWaInSupabase(
  id: string,
  status: string,
  setKeluargaList: React.Dispatch<React.SetStateAction<any[]>>
) {
  try {
    await supabase
      .from('peserta_santri')
      .update({ status_wa: status })
      .eq('id', id);

    setKeluargaList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, statusWa: status } : item))
    );
  } catch (e) {
    console.warn('Error updating status_wa in Supabase:', e);
  }
}

export async function updateTamuWaInSupabase(
  id: string | number,
  status: string,
  setTamuList: React.Dispatch<React.SetStateAction<any[]>>,
  jalurMasuk?: string
) {
  try {
    const payload: any = { status_wa: status };
    if (jalurMasuk !== undefined) {
      payload.jalur_masuk = jalurMasuk;
    }

    const { error } = await supabase
      .from('tamu_undangan')
      .update(payload)
      .eq('id', id);

    if (error && (error.code === '42703' || error.code === 'PGRST204') && payload.jalur_masuk !== undefined) {
      delete payload.jalur_masuk;
      await supabase.from('tamu_undangan').update(payload).eq('id', id);
    }

    setTamuList((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              statusWa: status,
              ...(jalurMasuk !== undefined ? { jalurMasuk } : {}),
            }
          : item
      )
    );
  } catch (e) {
    console.warn('Error updating status_wa / jalur_masuk in Supabase:', e);
  }
}

export async function kirimFonnteWali(
  kel: any,
  gelombang: 1 | 2 | 3,
  linkGrupWa: string,
  setSendingKode: (val: string | null) => void,
  setKeluargaList: React.Dispatch<React.SetStateAction<any[]>>
) {
  if (gelombang === 1 && (!linkGrupWa || linkGrupWa.trim() === '')) {
    alert(
      '⚠️ PERINGATAN WAJIB:\nLink Grup WhatsApp Resmi Wali Santri masih KOSONG!\n\nSesuai SOP, link grup WA harus selalu diisi dan diperbarui setiap kali mau mengirim pesan undangan.'
    );
    return false;
  }

  const rawHp = kel.noHp;
  if (!rawHp || rawHp.trim() === '' || rawHp.trim().length < 8) {
    await updateStatusWaInSupabase(kel.id, 'NOMOR_TIDAK_TERDAFTAR', setKeluargaList);
    alert(`Nomor HP untuk ${kel.namaWali} tidak terdaftar atau tidak valid! Status telah diperbarui.`);
    return false;
  }

  setSendingKode(kel.kode);

  try {
    const teks = getTeksPesan(kel, gelombang, linkGrupWa);
    const res = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target: rawHp,
        message: teks,
      }),
    });

    const json = await res.json();
    if (json.ok) {
      await updateStatusWaInSupabase(kel.id, 'TERKIRIM', setKeluargaList);
      setSendingKode(null);
      return true;
    } else {
      const isNumInvalid =
        json.data?.reason?.toLowerCase().includes('invalid') ||
        json.data?.reason?.toLowerCase().includes('not registered');
      const newStatus = isNumInvalid ? 'NOMOR_TIDAK_TERDAFTAR' : 'GAGAL';
      await updateStatusWaInSupabase(kel.id, newStatus, setKeluargaList);
      alert(`Gagal mengirim via Fonnte: ${json.data?.reason || json.message || 'Error'}`);
      setSendingKode(null);
      return false;
    }
  } catch (err: any) {
    await updateStatusWaInSupabase(kel.id, 'GAGAL', setKeluargaList);
    alert(`Gagal menghubungi server Fonnte: ${err.message}`);
    setSendingKode(null);
    return false;
  }
}

export async function kirimManualWAWali(
  kel: any,
  gelombang: 1 | 2 | 3,
  linkGrupWa: string,
  setKeluargaList: React.Dispatch<React.SetStateAction<any[]>>
) {
  if (gelombang === 1 && (!linkGrupWa || linkGrupWa.trim() === '')) {
    alert('⚠️ PERINGATAN WAJIB:\nLink Grup WhatsApp Resmi Wali Santri masih KOSONG!');
    return;
  }

  const rawHp = kel.noHp;
  if (!rawHp || rawHp.trim() === '' || rawHp.trim().length < 8) {
    await updateStatusWaInSupabase(kel.id, 'NOMOR_TIDAK_TERDAFTAR', setKeluargaList);
    alert('Nomor HP tidak terdaftar atau tidak valid!');
    return;
  }

  const nomorBersih = normalkanNomorHp(rawHp);
  const teks = getTeksPesan(kel, gelombang, linkGrupWa);
  const url = `https://wa.me/${nomorBersih}?text=${encodeURIComponent(teks)}`;

  window.open(url, '_blank');
  await updateStatusWaInSupabase(kel.id, 'TERKIRIM', setKeluargaList);
}

export async function kirimFonnteTamu(
  tamu: any,
  setTamuSendingKode: (val: string | null) => void,
  setTamuList: React.Dispatch<React.SetStateAction<any[]>>
) {
  if (!tamu.jalurMasuk || !tamu.jalurMasuk.trim()) {
    alert(
      `⚠️ PERINGATAN WAJIB:\nJalur masuk untuk ${tamu.nama} masih KOSONG!\n\nHarap isi kolom "Masuk Melalui" (contoh: Gerbang Selatan (Bola Dunia)) sebelum mengirim pesan undangan.`
    );
    return false;
  }

  const rawHp = tamu.noHp;
  if (!rawHp || rawHp.trim() === '' || rawHp.trim().length < 8) {
    await updateTamuWaInSupabase(tamu.id, 'NOMOR_TIDAK_TERDAFTAR', setTamuList);
    alert(`Nomor HP untuk ${tamu.nama} tidak terdaftar atau tidak valid! Status diperbarui.`);
    return false;
  }

  setTamuSendingKode(tamu.kode);

  try {
    const teks = getTeksPesanTamu(tamu);
    const res = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target: rawHp,
        message: teks,
      }),
    });

    const json = await res.json();
    if (json.ok) {
      await updateTamuWaInSupabase(tamu.id, 'TERKIRIM', setTamuList);
      setTamuSendingKode(null);
      return true;
    } else {
      const isNumInvalid =
        json.data?.reason?.toLowerCase().includes('invalid') ||
        json.data?.reason?.toLowerCase().includes('not registered');
      const newStatus = isNumInvalid ? 'NOMOR_TIDAK_TERDAFTAR' : 'GAGAL';
      await updateTamuWaInSupabase(tamu.id, newStatus, setTamuList);
      alert(`Gagal mengirim via Fonnte: ${json.data?.reason || json.message || 'Error'}`);
      setTamuSendingKode(null);
      return false;
    }
  } catch (err: any) {
    await updateTamuWaInSupabase(tamu.id, 'GAGAL', setTamuList);
    alert(`Gagal menghubungi server Fonnte: ${err.message}`);
    setTamuSendingKode(null);
    return false;
  }
}

export async function kirimManualWATamu(
  tamu: any,
  setTamuList: React.Dispatch<React.SetStateAction<any[]>>
) {
  if (!tamu.jalurMasuk || !tamu.jalurMasuk.trim()) {
    alert(
      `⚠️ PERINGATAN WAJIB:\nJalur masuk untuk ${tamu.nama} masih KOSONG!\n\nHarap isi kolom "Masuk Melalui" sebelum mengirim pesan.`
    );
    return;
  }

  const rawHp = tamu.noHp;
  if (!rawHp || rawHp.trim() === '' || rawHp.trim().length < 8) {
    await updateTamuWaInSupabase(tamu.id, 'NOMOR_TIDAK_TERDAFTAR', setTamuList);
    alert('Nomor HP tidak terdaftar atau tidak valid!');
    return;
  }

  const nomorBersih = normalkanNomorHp(rawHp);
  const teks = getTeksPesanTamu(tamu);
  const url = `https://wa.me/${nomorBersih}?text=${encodeURIComponent(teks)}`;

  window.open(url, '_blank');
  await updateTamuWaInSupabase(tamu.id, 'TERKIRIM', setTamuList);
}

export interface WhatsAppSendModalProps {
  editingItem: any | null;
  setEditingItem: (item: any | null) => void;
  newHpInput: string;
  setNewHpInput: (val: string) => void;
  handleSaveEditNoHp: () => void;
  editingTamuItem: any | null;
  setEditingTamuItem: (item: any | null) => void;
  newHpInputTamu: string;
  setNewHpInputTamu: (val: string) => void;
  handleSaveEditNoHpTamu: () => void;
}

export default function WhatsAppSendModal({
  editingItem,
  setEditingItem,
  newHpInput,
  setNewHpInput,
  handleSaveEditNoHp,
  editingTamuItem,
  setEditingTamuItem,
  newHpInputTamu,
  setNewHpInputTamu,
  handleSaveEditNoHpTamu,
}: WhatsAppSendModalProps) {
  return (
    <>
      {/* MODAL EDIT HP WALI */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#D5C4B4]">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <Smartphone className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-sm text-[#422F21]">
                    Edit Nomor WhatsApp Wali
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Update nomor HP langsung ke tabel Supabase `peserta_santri`
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 space-y-1">
                <p className="font-bold text-amber-900">
                  {editingItem.namaWali} ({editingItem.kode})
                </p>
                <p className="text-[11px] text-amber-800">
                  Santri: {editingItem.santri?.[0]?.nama || '-'}
                </p>
              </div>

              <div>
                <label className="block font-bold text-[#422F21] mb-1">
                  Nomor WhatsApp Baru:
                </label>
                <input
                  type="text"
                  value={newHpInput}
                  onChange={(e) => setNewHpInput(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D5C4B4] bg-[#FAF7F3] focus:bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  Format: 08xx atau 628xx. Status WA akan otomatis diset kembali ke "BELUM".
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEditNoHp}
                className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-sm cursor-pointer flex items-center space-x-1"
              >
                <Check className="w-4 h-4" />
                <span>Simpan ke Supabase</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT HP TAMU UNDANGAN */}
      {editingTamuItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#D5C4B4]">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Smartphone className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-sm text-[#422F21]">
                    Edit Nomor WhatsApp Tamu Undangan
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Update nomor HP langsung ke tabel Supabase `tamu_undangan`
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingTamuItem(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 space-y-1">
                <p className="font-bold text-amber-900">
                  {editingTamuItem.nama} ({editingTamuItem.kode})
                </p>
                <p className="text-[11px] text-amber-800">
                  Kategori: {editingTamuItem.kategori} · {editingTamuItem.instansi}
                </p>
              </div>

              <div>
                <label className="block font-bold text-[#422F21] mb-1">
                  Nomor WhatsApp Baru:
                </label>
                <input
                  type="text"
                  value={newHpInputTamu}
                  onChange={(e) => setNewHpInputTamu(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#D5C4B4] bg-[#FAF7F3] focus:bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  Format: 08xx atau 628xx. Status WA akan otomatis diset kembali ke "BELUM".
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => setEditingTamuItem(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEditNoHpTamu}
                className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-sm cursor-pointer flex items-center space-x-1"
              >
                <Check className="w-4 h-4" />
                <span>Simpan ke Supabase</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
