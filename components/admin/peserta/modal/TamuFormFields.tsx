'use client';

import React from 'react';
import { Users, Crown, Building, Loader2 } from 'lucide-react';
import { KATEGORI_UMUM_LIST } from '@/lib/types';

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

// 2. Opsi Tamu Undangan Umum (Sesuai Permintaan: A sampai I + Lainnya)
export const OPSI_UNDANGAN_UMUM = [...KATEGORI_UMUM_LIST];

export function getGolonganUndangan(u: any): GolonganUndangan {
  if (!u) return 'UMUM';
  const rawGol = String(u.golongan || u.sub_kategori || u.subKategori || '').toUpperCase().trim();
  if (rawGol === 'ISTIMEWA' || rawGol === 'UNDANGAN_ISTIMEWA') return 'ISTIMEWA';
  if (rawGol === 'KEHORMATAN' || rawGol === 'UNDANGAN_KEHORMATAN') return 'KEHORMATAN';
  if (rawGol === 'UMUM' || rawGol === 'UNDANGAN_UMUM') return 'UMUM';

  const text = `${u.kategori || ''} ${u.sub_kategori || ''} ${u.subKategori || ''} ${u.nama || ''} ${u.instansi || ''}`.toLowerCase();

  if (
    text.includes('vvip') ||
    text.includes('vip') ||
    text.includes('bani') ||
    text.includes('bandar') ||
    text.includes('kunir') ||
    text.includes('istimewa')
  ) {
    return 'ISTIMEWA';
  }

  if (
    text.includes('masyayikh') ||
    text.includes('masyaikh') ||
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
  if (fc.includes('tamatan aliyah') && ic.includes('tamatan aliyah')) return true;
  if (fc.includes('non purna') && ic.includes('non purna')) return true;
  if ((fc.includes('purna ibtida') || fc.includes('mustahiqoh')) && (ic.includes('purna ibtida') || ic.includes('mustahiqoh'))) return true;
  if (fc.includes('purna bakti') && ic.includes('purna bakti')) return true;
  if (fc.includes('sekalian') && ic.includes('sekalian')) return true;
  if (fc.includes('nduduk') && ic.includes('nduduk')) return true;
  if (fc.includes('mutakhorijin') && ic.includes('mutakhorijin')) return true;
  if (fc.includes('perwakilan') && ic.includes('perwakilan')) return true;
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
  errors?: { [key: string]: string };
  setErrors?: (errs: { [key: string]: string }) => void;
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
  errors = {},
  setErrors = () => {},
}: TamuFormFieldsProps) {
  if (mode === 'ADD') {
    return (
      <form
        onSubmit={onSubmitAdd}
        className="flex-1 flex flex-col min-h-0 overflow-hidden"
      >
        <div className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {/* 3 Kotak Pemilih Golongan Undangan */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5 text-xs">
              Pilih Golongan Tamu Undangan *
            </label>
            <div className="grid grid-cols-3 gap-2">
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
                  });
                  setCustomKategoriInput('');
                }}
                className={`py-2 px-2 rounded-xl font-bold text-xs border flex items-center justify-center space-x-1.5 transition-all ${
                  selectedGolonganUndangan === 'ISTIMEWA'
                    ? 'bg-sky-100 text-blue-950 border-sky-400 ring-2 ring-amber-400/30 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Istimewa</span>
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
                  });
                  setCustomKategoriInput('');
                }}
                className={`py-2 px-2 rounded-xl font-bold text-xs border flex items-center justify-center space-x-1.5 transition-all ${
                  selectedGolonganUndangan === 'KEHORMATAN'
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
                  setSelectedGolonganUndangan('UMUM');
                  setUndanganKategoriDropdown(OPSI_UNDANGAN_UMUM[0]);
                  setUndanganForm({
                    ...undanganForm,
                    kategori: OPSI_UNDANGAN_UMUM[0],
                    instansi: '',
                    alamat: '',
                    kuotaDasar: 1,
                  });
                  setCustomKategoriInput('');
                }}
                className={`py-2 px-2 rounded-xl font-bold text-xs border flex items-center justify-center space-x-1.5 transition-all ${
                  selectedGolonganUndangan === 'UMUM'
                    ? 'bg-cyan-100 text-cyan-900 border-cyan-400 ring-2 ring-cyan-400/30 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-cyan-700" />
                <span>👥 Umum</span>
              </button>
            </div>
          </div>

        {/* NAMA TAMU UNDANGAN: INPUT PUTRA & PUTRI UNTUK SEMUA GOLONGAN */}
        <div className={`p-3.5 sm:p-4 rounded-2xl space-y-3 transition-colors ${
          errors.nama
            ? 'bg-rose-50/70 border border-rose-300'
            : 'bg-sky-50/70 border border-sky-200/80'
        }`}>
          <div className="flex items-center justify-between">
            <label className="block font-bold text-blue-950 text-xs">
              Nama Tamu Undangan *
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="tamu-nama-putra" className="block font-semibold text-slate-700 text-[11px] mb-1">
                👨 Nama Tamu Putra (Gus / Kyai / Ust.)
              </label>
              <input
                id="tamu-nama-putra"
                type="text"
                aria-invalid={!!errors.nama}
                aria-describedby={errors.nama ? 'error-tamu-nama' : undefined}
                value={undanganForm.namaPutra}
                onChange={(e) => {
                  setUndanganForm({ ...undanganForm, namaPutra: e.target.value });
                  if (errors.nama) setErrors({ ...errors, nama: '' });
                }}
                placeholder="Nama tamu putra..."
                className={`w-full px-3.5 py-2 sm:py-2.5 rounded-xl border uppercase font-semibold text-xs bg-white focus:outline-none focus:ring-2 transition-colors ${
                  errors.nama ? 'border-rose-400 focus:ring-rose-500' : 'border-sky-300 focus:ring-amber-500'
                }`}
              />
            </div>

            <div>
              <label htmlFor="tamu-nama-putri" className="block font-semibold text-slate-700 text-[11px] mb-1">
                👩 Nama Tamu Putri (Ning / Nyai / Ust.)
              </label>
              <input
                id="tamu-nama-putri"
                type="text"
                aria-invalid={!!errors.nama}
                aria-describedby={errors.nama ? 'error-tamu-nama' : undefined}
                value={undanganForm.namaPutri}
                onChange={(e) => {
                  setUndanganForm({ ...undanganForm, namaPutri: e.target.value });
                  if (errors.nama) setErrors({ ...errors, nama: '' });
                }}
                placeholder="Nama tamu putri..."
                className={`w-full px-3.5 py-2 sm:py-2.5 rounded-xl border uppercase font-semibold text-xs bg-white focus:outline-none focus:ring-2 transition-colors ${
                  errors.nama ? 'border-rose-400 focus:ring-rose-500' : 'border-sky-300 focus:ring-amber-500'
                }`}
              />
            </div>
          </div>

          {errors.nama && (
            <p id="error-tamu-nama" className="text-rose-500 text-xs font-medium animate-in fade-in">
              {errors.nama}
            </p>
          )}

          {/* Indikator Kuota Otomatis Real-time */}
          {(() => {
            const hasP = !!undanganForm.namaPutra?.trim();
            const hasW = !!undanganForm.namaPutri?.trim();
            const autoKuota = hasP && hasW ? 2 : hasP || hasW ? 1 : 0;
            return (
              <div className="pt-2 border-t border-sky-200/60 flex items-center justify-between text-xs font-semibold">
                <span className="text-blue-950">
                  Estimasi Kuota: <strong className="text-sm font-bold text-opera-850">{autoKuota} Kursi</strong>
                </span>
                {autoKuota === 0 ? (
                  <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[11px]">
                    ⚠️ Wajib mengisi minimal satu nama
                  </span>
                ) : (
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                    ✓ Kuota otomatis ({hasP && hasW ? 'Suami & Istri' : hasP ? 'Tamu Putra' : 'Tamu Putri'})
                  </span>
                )}
              </div>
            );
          })()}
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
                if (errors.kategori) setErrors({ ...errors, kategori: '' });
                const isSekalian = val.toUpperCase().includes('SEKALIAN');
                const newKuota =
                  selectedGolonganUndangan === 'UMUM' && isSekalian ? 2 : 1;
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
                <label htmlFor="custom-kategori-input" className="block text-[11px] font-bold text-opera-900">
                  Ketik Kategori Undangan Sendiri *
                </label>
                <input
                  id="custom-kategori-input"
                  type="text"
                  required
                  aria-invalid={!!errors.kategori}
                  aria-describedby={errors.kategori ? 'error-tamu-kategori' : undefined}
                  value={customKategoriInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomKategoriInput(val);
                    setUndanganForm({ ...undanganForm, kategori: val });
                    if (errors.kategori) setErrors({ ...errors, kategori: '' });
                  }}
                  placeholder=""
                  className={`w-full px-3.5 py-2.5 rounded-xl border-2 bg-opera-50/50 text-slate-900 focus:outline-none focus:ring-2 font-medium transition-colors ${
                    errors.kategori
                      ? 'border-rose-400 focus:ring-rose-500'
                      : 'border-opera-500 focus:ring-opera-700'
                  }`}
                />
              </div>
            )}
            {errors.kategori && (
              <p id="error-tamu-kategori" className="text-rose-500 text-xs mt-1 font-medium animate-in fade-in">
                {errors.kategori}
              </p>
            )}
          </div>
        )}

        {/* INSTANSI / ALAMAT SESUAI GOLONGAN */}
        {selectedGolonganUndangan === 'ISTIMEWA' && (
          <div>
            <label htmlFor="tamu-alamat-istimewa" className="block font-bold text-slate-700 mb-1">Alamat *</label>
            <input
              id="tamu-alamat-istimewa"
              type="text"
              aria-invalid={!!errors.alamat}
              aria-describedby={errors.alamat ? 'error-tamu-alamat' : undefined}
              value={undanganForm.alamat}
              onChange={(e) => {
                setUndanganForm({
                  ...undanganForm,
                  alamat: e.target.value,
                  instansi: e.target.value,
                });
                if (errors.alamat) setErrors({ ...errors, alamat: '' });
              }}
              placeholder=""
              className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 font-medium transition-colors ${
                errors.alamat
                  ? 'border-rose-400 bg-rose-50/40 text-rose-950 focus:ring-rose-500'
                  : 'border-slate-300 focus:ring-opera-700'
              }`}
            />
            {errors.alamat ? (
              <p id="error-tamu-alamat" className="text-rose-500 text-xs mt-1 font-medium animate-in fade-in">
                {errors.alamat}
              </p>
            ) : (
              <p className="text-[10px] text-slate-400 mt-1">Alamat asal / daerah Tamu Istimewa</p>
            )}
          </div>
        )}

        {selectedGolonganUndangan === 'KEHORMATAN' && (
          <div>
            <label htmlFor="tamu-alamat-kehormatan" className="block font-bold text-slate-700 mb-1">Alamat *</label>
            <input
              id="tamu-alamat-kehormatan"
              type="text"
              aria-invalid={!!errors.instansi}
              aria-describedby={errors.instansi ? 'error-tamu-instansi' : undefined}
              value={undanganForm.alamat}
              onChange={(e) => {
                setUndanganForm({
                  ...undanganForm,
                  alamat: e.target.value,
                  instansi: e.target.value,
                });
                if (errors.instansi) setErrors({ ...errors, instansi: '' });
              }}
              placeholder=""
              className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 font-medium transition-colors ${
                errors.instansi
                  ? 'border-rose-400 bg-rose-50/40 text-rose-950 focus:ring-rose-500'
                  : 'border-slate-300 focus:ring-opera-700'
              }`}
            />
            {errors.instansi ? (
              <p id="error-tamu-instansi" className="text-rose-500 text-xs mt-1 font-medium animate-in fade-in">
                {errors.instansi}
              </p>
            ) : (
              <p className="text-[10px] text-slate-400 mt-1">
                Alamat asal / kediaman Masyayikh &amp; Ulama Sepuh
              </p>
            )}
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
            className="w-full px-3.5 py-2 sm:py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-mono"
          />
        </div>
      </div>

      <div className="shrink-0 p-3.5 sm:px-6 sm:py-3.5 bg-white/80 backdrop-blur-sm border-t border-slate-200/80 flex items-center justify-end space-x-2">
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
    <form onSubmit={onSubmitEdit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
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
            }}
            className={`py-2 px-2 rounded-xl font-bold text-xs border flex items-center justify-center space-x-1.5 transition-all ${
              editGolonganUndangan === 'ISTIMEWA'
                ? 'bg-sky-100 text-blue-950 border-sky-400 ring-2 ring-amber-400/30 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Istimewa</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditGolonganUndangan('KEHORMATAN');
              setEditCustomKategoriInput('');
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
        <div className={`p-3.5 rounded-2xl space-y-3 transition-colors ${
          errors.nama ? 'bg-rose-50/70 border border-rose-300' : 'bg-sky-50/70 border border-sky-200/80'
        }`}>
          <div className="flex items-center justify-between">
            <label className="block font-bold text-blue-950 text-xs">
              Nama Tamu Undangan *
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-tamu-nama-putra" className="block font-semibold text-slate-700 text-[11px] mb-1">
                👨 Nama Tamu Putra (Gus / Kyai / Ust.)
              </label>
              <input
                id="edit-tamu-nama-putra"
                type="text"
                aria-invalid={!!errors.nama}
                aria-describedby={errors.nama ? 'error-edit-tamu-nama' : undefined}
                value={editingItem.namaPutra || ''}
                onChange={(e) => {
                  const p = e.target.value;
                  const w = editingItem.namaPutri || '';
                  const combined =
                    p.trim() && w.trim()
                      ? `${p.trim()} & ${w.trim()}`
                      : p.trim() || w.trim();
                  setEditingItem({ ...editingItem, namaPutra: p, nama: combined });
                  if (errors.nama) setErrors({ ...errors, nama: '' });
                }}
                placeholder="Nama tamu putra..."
                className={`w-full px-3.5 py-2 sm:py-2.5 rounded-xl border uppercase font-semibold text-xs bg-white focus:outline-none focus:ring-2 transition-colors ${
                  errors.nama ? 'border-rose-400 focus:ring-rose-500' : 'border-sky-300 focus:ring-amber-500'
                }`}
              />
            </div>

            <div>
              <label htmlFor="edit-tamu-nama-putri" className="block font-semibold text-slate-700 text-[11px] mb-1">
                👩 Nama Tamu Putri (Ning / Nyai / Ust.)
              </label>
              <input
                id="edit-tamu-nama-putri"
                type="text"
                aria-invalid={!!errors.nama}
                aria-describedby={errors.nama ? 'error-edit-tamu-nama' : undefined}
                value={editingItem.namaPutri || ''}
                onChange={(e) => {
                  const w = e.target.value;
                  const p = editingItem.namaPutra || '';
                  const combined =
                    p.trim() && w.trim()
                      ? `${p.trim()} & ${w.trim()}`
                      : p.trim() || w.trim();
                  setEditingItem({ ...editingItem, namaPutri: w, nama: combined });
                  if (errors.nama) setErrors({ ...errors, nama: '' });
                }}
                placeholder="Nama tamu putri..."
                className={`w-full px-3.5 py-2 sm:py-2.5 rounded-xl border uppercase font-semibold text-xs bg-white focus:outline-none focus:ring-2 transition-colors ${
                  errors.nama ? 'border-rose-400 focus:ring-rose-500' : 'border-sky-300 focus:ring-amber-500'
                }`}
              />
            </div>
          </div>
          {errors.nama && (
            <p id="error-edit-tamu-nama" className="text-rose-500 text-xs font-medium animate-in fade-in">
              {errors.nama}
            </p>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="edit-tamu-nama" className="block font-bold text-slate-700">Nama Tamu / Tokoh / Kyai *</label>
            <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-semibold">
              Kuota otomatis: 1 kursi
            </span>
          </div>
          <input
            id="edit-tamu-nama"
            type="text"
            required
            aria-invalid={!!errors.nama}
            aria-describedby={errors.nama ? 'error-edit-tamu-nama' : undefined}
            value={editingItem.nama || ''}
            onChange={(e) => {
              setEditingItem({ ...editingItem, nama: e.target.value });
              if (errors.nama) setErrors({ ...errors, nama: '' });
            }}
            placeholder=""
            className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 uppercase font-semibold transition-colors ${
              errors.nama ? 'border-rose-400 bg-rose-50/40 text-rose-950 focus:ring-rose-500' : 'border-slate-300 focus:ring-opera-700'
            }`}
          />
          {errors.nama && (
            <p id="error-edit-tamu-nama" className="text-rose-500 text-xs mt-1 font-medium animate-in fade-in">
              {errors.nama}
            </p>
          )}
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
              if (errors.kategori) setErrors({ ...errors, kategori: '' });
              if (editingItem.tipe === 'UNDANGAN' && editGolonganUndangan === 'UMUM') {
                const isSekalian = val.toUpperCase().includes('SEKALIAN');
                setEditingItem({
                  ...editingItem,
                  kategori: val,
                  kuotaDasar: isSekalian ? 2 : 1,
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
              <label htmlFor="edit-custom-kategori-input" className="block text-[11px] font-bold text-opera-900">
                Ketik Kategori Undangan Sendiri *
              </label>
              <input
                id="edit-custom-kategori-input"
                type="text"
                required
                aria-invalid={!!errors.kategori}
                aria-describedby={errors.kategori ? 'error-edit-tamu-kategori' : undefined}
                value={editCustomKategoriInput}
                onChange={(e) => {
                  setEditCustomKategoriInput(e.target.value);
                  if (errors.kategori) setErrors({ ...errors, kategori: '' });
                }}
                placeholder="Ketik kategori baru"
                className={`w-full px-3.5 py-2.5 rounded-xl border-2 bg-opera-50/50 text-slate-900 focus:outline-none focus:ring-2 font-medium transition-colors ${
                  errors.kategori ? 'border-rose-400 focus:ring-rose-500' : 'border-opera-500 focus:ring-opera-700'
                }`}
              />
            </div>
          )}
          {errors.kategori && (
            <p id="error-edit-tamu-kategori" className="text-rose-500 text-xs mt-1 font-medium animate-in fade-in">
              {errors.kategori}
            </p>
          )}
        </div>
      )}

      {/* INSTANSI / ALAMAT SESUAI GOLONGAN */}
      {editGolonganUndangan === 'ISTIMEWA' && (
        <div>
          <label htmlFor="edit-tamu-alamat-istimewa" className="block font-bold text-slate-700 mb-1">Alamat *</label>
          <input
            id="edit-tamu-alamat-istimewa"
            type="text"
            aria-invalid={!!errors.alamat}
            aria-describedby={errors.alamat ? 'error-edit-tamu-alamat' : undefined}
            value={editingItem.alamat || editingItem.instansi || ''}
            onChange={(e) => {
              setEditingItem({
                ...editingItem,
                alamat: e.target.value,
                instansi: e.target.value,
              });
              if (errors.alamat) setErrors({ ...errors, alamat: '' });
            }}
            placeholder=""
            className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 font-medium transition-colors ${
              errors.alamat
                ? 'border-rose-400 bg-rose-50/40 text-rose-950 focus:ring-rose-500'
                : 'border-slate-300 focus:ring-opera-700'
            }`}
          />
          {errors.alamat ? (
            <p id="error-edit-tamu-alamat" className="text-rose-500 text-xs mt-1 font-medium animate-in fade-in">
              {errors.alamat}
            </p>
          ) : (
            <p className="text-[10px] text-slate-400 mt-1">Alamat asal / daerah Tamu Istimewa</p>
          )}
        </div>
      )}

      {editGolonganUndangan === 'KEHORMATAN' && (
        <div>
          <label htmlFor="edit-tamu-alamat-kehormatan" className="block font-bold text-slate-700 mb-1">Alamat *</label>
          <input
            id="edit-tamu-alamat-kehormatan"
            type="text"
            aria-invalid={!!errors.instansi}
            aria-describedby={errors.instansi ? 'error-edit-tamu-instansi' : undefined}
            value={editingItem.alamat || editingItem.instansi || ''}
            onChange={(e) => {
              setEditingItem({
                ...editingItem,
                alamat: e.target.value,
                instansi: e.target.value,
              });
              if (errors.instansi) setErrors({ ...errors, instansi: '' });
            }}
            placeholder=""
            className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 font-medium transition-colors ${
              errors.instansi
                ? 'border-rose-400 bg-rose-50/40 text-rose-950 focus:ring-rose-500'
                : 'border-slate-300 focus:ring-opera-700'
            }`}
          />
          {errors.instansi ? (
            <p id="error-edit-tamu-instansi" className="text-rose-500 text-xs mt-1 font-medium animate-in fade-in">
              {errors.instansi}
            </p>
          ) : (
            <p className="text-[10px] text-slate-400 mt-1">
              Alamat asal / kediaman Masyayikh &amp; Ulama Sepuh
            </p>
          )}
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
              className="w-full px-3.5 py-2 sm:py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-opera-700 font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Format: 08xx atau 628xx. Boleh kosong (opsional).
            </p>
          </div>
        </>
      )}
      </div>

      <div className="shrink-0 p-3.5 sm:px-6 sm:py-3.5 bg-white/80 backdrop-blur-sm border-t border-slate-200/80 flex items-center justify-end space-x-2">
        <button
          type="button"
          onClick={onCancelEdit}
          disabled={isSubmittingTamu}
          className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isSubmittingTamu}
          className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmittingTamu ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
              <span>Menyimpan...</span>
            </>
          ) : (
            'Simpan Perubahan'
          )}
        </button>
      </div>
    </form>
  );
}
