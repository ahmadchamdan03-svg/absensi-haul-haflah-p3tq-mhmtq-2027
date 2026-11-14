'use client';

import React from 'react';
import { Smartphone, Check, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { normalkanNomorHp } from '@/lib/hmac';
import { getTeksPesan, getTeksPesanTamu } from './WhatsAppStats';

export function validateAndCleanPhoneNumber(input: string): {
  cleanNumber: string;
  isValid: boolean;
  error?: string;
} {
  if (!input || !input.trim()) {
    return {
      cleanNumber: '',
      isValid: false,
      error: 'Nomor WhatsApp wajib diisi.',
    };
  }

  // Bersihkan karakter non-angka (spasi, strip, dll)
  let cleaned = input.replace(/\D/g, '');

  // Jika diawali angka 8 (misal 857...), normalisasi menjadi 08
  if (cleaned.startsWith('8')) {
    cleaned = '0' + cleaned;
  }

  // Validasi format: wajib diawali 08 atau 628
  if (!cleaned.startsWith('08') && !cleaned.startsWith('628')) {
    return {
      cleanNumber: cleaned,
      isValid: false,
      error: 'Nomor HP harus diawali dengan 08 atau 628 (contoh: 085790633812).',
    };
  }

  // Validasi panjang digit nomor seluler
  if (cleaned.length < 10) {
    return {
      cleanNumber: cleaned,
      isValid: false,
      error: 'Nomor HP terlalu pendek (minimal 10 digit angka).',
    };
  }

  if (cleaned.length > 15) {
    return {
      cleanNumber: cleaned,
      isValid: false,
      error: 'Nomor HP terlalu panjang (maksimal 15 digit angka).',
    };
  }

  return {
    cleanNumber: cleaned,
    isValid: true,
  };
}

async function persistStatusWa(
  endpoint: string,
  table: 'peserta_santri' | 'tamu_undangan',
  id: string | number,
  status: string,
  setList: React.Dispatch<React.SetStateAction<any[]>>
) {
  try {
    let persisted = false;

    try {
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status_wa: status }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.ok) persisted = true;
      }
    } catch {
      // Fallback to direct client update below
    }

    if (!persisted) {
      const { error } = await supabase
        .from(table)
        .update({ status_wa: status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.warn(`Error updating status_wa in ${table}:`, error.message);
      }
    }

    setList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, statusWa: status } : item))
    );
  } catch (e) {
    console.warn(`Error updating status_wa in ${table}:`, e);
  }
}

export async function updateStatusWaInSupabase(
  id: string,
  status: string,
  setKeluargaList: React.Dispatch<React.SetStateAction<any[]>>
) {
  await persistStatusWa('/api/santri', 'peserta_santri', id, status, setKeluargaList);
}

export async function updateTamuWaInSupabase(
  id: string | number,
  status: string,
  setTamuList: React.Dispatch<React.SetStateAction<any[]>>
) {
  await persistStatusWa('/api/tamu', 'tamu_undangan', id, status, setTamuList);
}

export async function kirimFonnteWali(
  kel: any,
  gelombang: 1 | 2 | 3,
  linkGrupWa: string,
  setSendingKode: (val: string | null) => void,
  setKeluargaList: React.Dispatch<React.SetStateAction<any[]>>
) {
  const activeLinkGrup = gelombang === 1 ? (linkGrupWa || '').trim() : '';

  const rawHp = kel.noHp;
  if (!rawHp || rawHp.trim() === '' || rawHp.trim().length < 8) {
    await updateStatusWaInSupabase(kel.id, 'NOMOR_TIDAK_TERDAFTAR', setKeluargaList);
    alert(`Nomor HP untuk ${kel.namaWali} tidak terdaftar atau tidak valid! Status telah diperbarui.`);
    return false;
  }

  setSendingKode(kel.kode);

  try {
    const teks = getTeksPesan(kel, gelombang, activeLinkGrup);
    const tipePesan = gelombang === 3 ? 'PENGINAPAN' : gelombang === 2 ? 'KUOTA_TAMBAHAN' : 'UNDANGAN';
    const res = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target: rawHp,
        message: teks,
        tipe_pesan: tipePesan,
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
  const activeLinkGrup = gelombang === 1 ? (linkGrupWa || '').trim() : '';

  const rawHp = kel.noHp;
  if (!rawHp || rawHp.trim() === '' || rawHp.trim().length < 8) {
    await updateStatusWaInSupabase(kel.id, 'NOMOR_TIDAK_TERDAFTAR', setKeluargaList);
    alert('Nomor HP tidak terdaftar atau tidak valid!');
    return;
  }

  const nomorBersih = normalkanNomorHp(rawHp);
  const teks = getTeksPesan(kel, gelombang, activeLinkGrup);
  const url = `https://wa.me/${nomorBersih}?text=${encodeURIComponent(teks)}`;

  window.open(url, '_blank');
  await updateStatusWaInSupabase(kel.id, 'TERKIRIM', setKeluargaList);
}

export async function kirimFonnteTamu(
  tamu: any,
  setTamuSendingKode: (val: string | null) => void,
  setTamuList: React.Dispatch<React.SetStateAction<any[]>>
) {
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
  isSavingHp?: boolean;
  hpValidationError?: string;
  setHpValidationError?: (err: string) => void;
  editingTamuItem: any | null;
  setEditingTamuItem: (item: any | null) => void;
  newHpInputTamu: string;
  setNewHpInputTamu: (val: string) => void;
  handleSaveEditNoHpTamu: () => void;
  isSavingHpTamu?: boolean;
  hpValidationErrorTamu?: string;
  setHpValidationErrorTamu?: (err: string) => void;
}

export default function WhatsAppSendModal({
  editingItem,
  setEditingItem,
  newHpInput,
  setNewHpInput,
  handleSaveEditNoHp,
  isSavingHp = false,
  hpValidationError = '',
  setHpValidationError,
  editingTamuItem,
  setEditingTamuItem,
  newHpInputTamu,
  setNewHpInputTamu,
  handleSaveEditNoHpTamu,
  isSavingHpTamu = false,
  hpValidationErrorTamu = '',
  setHpValidationErrorTamu,
}: WhatsAppSendModalProps) {
  return (
    <>
      {/* MODAL EDIT HP WALI */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-white/80">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <Smartphone className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-sm text-[#0F2C59]">
                    Edit Nomor WhatsApp Wali
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Update nomor HP langsung ke tabel Supabase `peserta_santri`
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isSavingHp}
                onClick={() => {
                  setEditingItem(null);
                  if (setHpValidationError) setHpValidationError('');
                }}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 disabled:opacity-40 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-sky-50 rounded-2xl border border-sky-200 space-y-1">
                <p className="font-bold text-blue-950">
                  {editingItem.namaWali} ({editingItem.kode})
                </p>
                <p className="text-[11px] text-blue-900">
                  Santri: {editingItem.santri?.[0]?.nama || '-'}
                </p>
              </div>

              <div>
                <label className="block font-bold text-[#0F2C59] mb-1">
                  Nomor WhatsApp Baru:
                </label>
                <input
                  type="tel"
                  disabled={isSavingHp}
                  value={newHpInput}
                  onChange={(e) => {
                    setNewHpInput(e.target.value);
                    if (setHpValidationError) setHpValidationError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isSavingHp) {
                      e.preventDefault();
                      handleSaveEditNoHp();
                    }
                  }}
                  placeholder="Contoh: 085790633812"
                  className={`w-full px-3.5 py-2.5 rounded-2xl border bg-[#F0F9FF] focus:bg-white text-sm font-mono focus:outline-none transition-all ${
                    hpValidationError
                      ? 'border-rose-500 ring-2 ring-rose-200'
                      : 'border-[#BAE6FD] focus:ring-2 focus:ring-blue-700'
                  } disabled:opacity-60`}
                  autoFocus
                />
                {hpValidationError ? (
                  <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                    <span>⚠️</span>
                    <span>{hpValidationError}</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-stone-500 mt-1">
                    Format: diawali 08 atau 628 (contoh: 085790633812). Status WA akan diset ke "BELUM".
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                disabled={isSavingHp}
                onClick={() => {
                  setEditingItem(null);
                  if (setHpValidationError) setHpValidationError('');
                }}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer disabled:opacity-40 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSavingHp}
                onClick={handleSaveEditNoHp}
                className="px-4 py-2 rounded-xl bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs shadow-sm cursor-pointer flex items-center space-x-1.5 disabled:opacity-60 transition-all"
              >
                {isSavingHp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Simpan ke Supabase</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT HP TAMU UNDANGAN */}
      {editingTamuItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-white/80">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-blue-900 flex items-center justify-center font-bold">
                  <Smartphone className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-sm text-[#0F2C59]">
                    Edit Nomor WhatsApp Tamu Undangan
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Update nomor HP langsung ke tabel Supabase `tamu_undangan`
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isSavingHpTamu}
                onClick={() => {
                  setEditingTamuItem(null);
                  if (setHpValidationErrorTamu) setHpValidationErrorTamu('');
                }}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 disabled:opacity-40 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-sky-50 rounded-2xl border border-sky-200 space-y-1">
                <p className="font-bold text-blue-950">
                  {editingTamuItem.nama} ({editingTamuItem.kode})
                </p>
                <p className="text-[11px] text-blue-900">
                  Kategori: {editingTamuItem.kategori} · {editingTamuItem.instansi}
                </p>
              </div>

              <div>
                <label className="block font-bold text-[#0F2C59] mb-1">
                  Nomor WhatsApp Baru:
                </label>
                <input
                  type="tel"
                  disabled={isSavingHpTamu}
                  value={newHpInputTamu}
                  onChange={(e) => {
                    setNewHpInputTamu(e.target.value);
                    if (setHpValidationErrorTamu) setHpValidationErrorTamu('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isSavingHpTamu) {
                      e.preventDefault();
                      handleSaveEditNoHpTamu();
                    }
                  }}
                  placeholder="Contoh: 085790633812"
                  className={`w-full px-3.5 py-2.5 rounded-2xl border bg-[#F0F9FF] focus:bg-white text-sm font-mono focus:outline-none transition-all ${
                    hpValidationErrorTamu
                      ? 'border-rose-500 ring-2 ring-rose-200'
                      : 'border-[#BAE6FD] focus:ring-2 focus:ring-blue-700'
                  } disabled:opacity-60`}
                  autoFocus
                />
                {hpValidationErrorTamu ? (
                  <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                    <span>⚠️</span>
                    <span>{hpValidationErrorTamu}</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-stone-500 mt-1">
                    Format: diawali 08 atau 628 (contoh: 085790633812). Status WA akan diset ke "BELUM".
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                disabled={isSavingHpTamu}
                onClick={() => {
                  setEditingTamuItem(null);
                  if (setHpValidationErrorTamu) setHpValidationErrorTamu('');
                }}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer disabled:opacity-40 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSavingHpTamu}
                onClick={handleSaveEditNoHpTamu}
                className="px-4 py-2 rounded-xl bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs shadow-sm cursor-pointer flex items-center space-x-1.5 disabled:opacity-60 transition-all"
              >
                {isSavingHpTamu ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Simpan ke Supabase</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
