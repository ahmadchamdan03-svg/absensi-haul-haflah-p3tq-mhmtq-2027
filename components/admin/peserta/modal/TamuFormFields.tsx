'use client';

import React from 'react';
import { Users, Sparkles, Building, Loader2 } from 'lucide-react';
import { getDefaultJalurMasuk } from '@/lib/types';

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
  "Penguji Al-Qur'an",
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

  const cleanIc = ic.replace(/[^a-z0-9]/g, '');
  const cleanFc = fc.replace(/[^a-z0-9]/g, '');

  if (cleanIc === cleanFc) return true;

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

export interface TamuFormFieldsProps {
  mode: 'ADD' | 'EDIT';
  // Add mode props
  selectedGolonganUndangan?: GolonganUndangan;
  setSelectedGolonganUndangan?: (gol: GolonganUndangan) => void;
  undanganForm?: any;
  setUndanganForm?: (form: any) => void;
  undanganKategoriDropdown?: string;
  setUndanganKategoriDropdown?: (val: string) => void;
  customKategoriInput?: string;
  setCustomKategoriInput?: (val: string) => void;
  isSubmittingTamu?: boolean;
  onCancelAdd?: () => void;
  onSubmitAdd?: (e: React.FormEvent) => void;
  // Edit mode props
  editingItem?: any;
  setEditingItem?: (item: any) => void;
  editGolonganUndangan?: GolonganUndangan;
  setEditGolonganUndangan?: (gol: GolonganUndangan) => void;
  editUndanganKategoriDropdown?: string;
  setEditUndanganKategoriDropdown?: (val: string) => void;
  editCustomKategoriInput?: string;
  setEditCustomKategoriInput?: (val: string) => void;
  onCancelEdit?: () => void;
  onSubmitEdit?: (e: React.FormEvent) => void;
}

export default function TamuFormFields({
  mode,
  selectedGolonganUndangan = 'ISTIMEWA',
  setSelectedGolonganUndangan = () => {},
  undanganForm = {},
  setUndanganForm = () => {},
  undanganKategoriDropdown = 'VVIP',
  setUndanganKategoriDropdown = () => {},
  customKategoriInput = '',
  setCustomKategoriInput = () => {},
  isSubmittingTamu = false,
  onCancelAdd = () => {},
  onSubmitAdd = () => {},
  editingItem = null,
  setEditingItem = () => {},
  editGolonganUndangan = 'ISTIMEWA',
  setEditGolonganUndangan = () => {},
  editUndanganKategoriDropdown = 'VVIP',
  setEditUndanganKategoriDropdown = () => {},
  editCustomKategoriInput = '',
  setEditCustomKategoriInput = () => {},
  onCancelEdit = () => {},
  onSubmitEdit = () => {},
}: TamuFormFieldsProps) {
  if (mode === 'ADD') {
    return (
      <form
        onSubmit={onSubmitAdd}
        className="p-4 sm:p-6 md:p-8 space-y-4 md:space-y-5 text-xs md:text-sm overflow-y-auto flex-1"
      >
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

        {/* KATEGORI UNDANGAN */}
        {selectedGolonganUndangan !== 'KEHORMATAN' && (
          <div>
            <label className="block font-bold text-slate-700 mb-1">Kategori Undangan *</label>
            <select
              value={undanganKategoriDropdown}
              onChange={(e) => {
                const val = e.target.value;
                setUndanganKategoriDropdown(val);
                const newKuota =
                  selectedGolonganUndangan === 'UMUM' && val === 'Asatidz Mhmtq Sekalian' ? 2 : 1;
                if (val !== 'Lainnya (Ketik Sendiri...)') {
                  setUndanganForm({ ...undanganForm, kategori: val, kuotaDasar: newKuota });
                } else {
                  setUndanganForm({
                    ...undanganForm,
                    kategori: customKategoriInput,
                    kuotaDasar: newKuota,
                  });
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
            <label className="block font-bold text-slate-700 mb-1">Alamat *</label>
            <input
              type="text"
              value={undanganForm.alamat}
              onChange={(e) =>
                setUndanganForm({
                  ...undanganForm,
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

        {selectedGolonganUndangan === 'KEHORMATAN' && (
          <div>
            <label className="block font-bold text-slate-700 mb-1">Alamat *</label>
            <input
              type="text"
              value={undanganForm.alamat}
              onChange={(e) =>
                setUndanganForm({
                  ...undanganForm,
                  alamat: e.target.value,
                  instansi: e.target.value,
                })
              }
              placeholder=""
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-medium"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Alamat asal / kediaman Masyayikh &amp; Ulama Sepuh
            </p>
          </div>
        )}

        {selectedGolonganUndangan === 'UMUM' && (
          <>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Instansi / Asal Lembaga</label>
              <input
                type="text"
                value={undanganForm.instansi}
                onChange={(e) => setUndanganForm({ ...undanganForm, instansi: e.target.value })}
                placeholder=""
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Alamat</label>
              <input
                type="text"
                value={undanganForm.alamat}
                onChange={(e) => setUndanganForm({ ...undanganForm, alamat: e.target.value })}
                placeholder=""
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-medium"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Alamat domisili atau tempat tinggal
              </p>
            </div>
          </>
        )}

        <div>
          <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
          <input
            type="text"
            value={undanganForm.noHp}
            onChange={(e) => setUndanganForm({ ...undanganForm, noHp: e.target.value })}
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
            onChange={(e) => setUndanganForm({ ...undanganForm, jalurMasuk: e.target.value })}
            placeholder="Contoh: Gerbang Selatan (Bola Dunia)"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-medium text-slate-800"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Otomatis terisi berdasarkan golongan (Istimewa/Kehormatan: &quot;Jalur VIP&quot;, Umum: &quot;Gerbang Selatan (Bola Dunia)&quot;), tetap dapat di-edit manual.
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onCancelAdd}
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
    );
  }

  // EDIT MODE
  if (!editingItem) return null;

  return (
    <form onSubmit={onSubmitEdit} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
      {/* 3 Kotak Pemilih Golongan Undangan Edit */}
      <div>
        <label className="block font-bold text-slate-700 mb-1">Golongan Tamu Undangan *</label>
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
      {editGolonganUndangan === 'ISTIMEWA' ||
      (editGolonganUndangan === 'UMUM' &&
        editUndanganKategoriDropdown === 'Asatidz Mhmtq Sekalian') ? (
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
                  const combined =
                    p.trim() && w.trim()
                      ? `${p.trim()} & ${w.trim()}`
                      : p.trim() || w.trim();
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
                  const combined =
                    p.trim() && w.trim()
                      ? `${p.trim()} & ${w.trim()}`
                      : p.trim() || w.trim();
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
            <label className="block font-bold text-slate-700">Nama Tamu / Tokoh / Kyai *</label>
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

      {/* KATEGORI UNDANGAN */}
      {editGolonganUndangan !== 'KEHORMATAN' && (
        <div>
          <label className="block font-bold text-slate-700 mb-1">Kategori Undangan *</label>
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
          <label className="block font-bold text-slate-700 mb-1">Alamat *</label>
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
          <label className="block font-bold text-slate-700 mb-1">Alamat *</label>
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
          <p className="text-[10px] text-slate-400 mt-1">
            Alamat asal / kediaman Masyayikh &amp; Ulama Sepuh
          </p>
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
            <p className="text-[10px] text-slate-400 mt-1">
              Alamat domisili atau tempat tinggal
            </p>
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
              Otomatis terisi berdasarkan golongan (Istimewa/Kehormatan: &quot;Jalur VIP&quot;, Umum: &quot;Gerbang Selatan (Bola Dunia)&quot;), tetap dapat di-edit manual.
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
            <p className="text-[10px] text-slate-400 mt-1">
              Format: 08xx atau 628xx. Boleh kosong (opsional).
            </p>
          </div>
        </>
      )}

      <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
        <button
          type="button"
          onClick={onCancelEdit}
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
  );
}
