'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  HelpCircle,
  LogOut,
  Gift,
  Building,
  Plus,
  Phone,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { clearActiveRole } from '@/lib/auth-roles';
import { useTamuData } from '@/lib/hooks/useTamuData';
import TambahTamuModal from '@/components/penerima-tamu/TambahTamuModal';
import TanyaUsModal from '@/components/TanyaUsModal';

export default function PenerimaTamuPanel({ showLogout = true }: { showLogout?: boolean }) {
  const router = useRouter();

  const {
    undanganList,
    loading,
    searchQuery,
    setSearchQuery,
    isUsModalOpen,
    setIsUsModalOpen,
    activeTab,
    setActiveTab,
    showAddModal,
    setShowAddModal,
    selectedGolonganUndangan,
    undanganForm,
    setUndanganForm,
    undanganKategoriDropdown,
    setUndanganKategoriDropdown,
    customKategoriInput,
    setCustomKategoriInput,
    handleOpenAddModal,
    handleQuickCheckin,
    handleBatalkanHadir,
    handleHapusTamu,
    handleTambahTamu,
    filteredUndangan,
    totalKuotaTamu,
    totalHadirTamu,
    totalBelumHadirTamu,
  } = useTamuData();

  const handleLogout = () => {
    clearActiveRole();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-transparent text-[#422F21] pb-24">
      {/* HEADER RESPONSIF */}
      <header className="border-b border-white/50 bg-white/40 backdrop-blur-md sticky top-0 z-20 px-3.5 sm:px-6 py-3 sm:py-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-50 text-emerald-800 border-2 border-emerald-600 flex items-center justify-center font-bold shadow-xs shrink-0">
              <Users className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs font-serif font-black tracking-wider text-emerald-800 uppercase leading-tight truncate">
                POS PENERIMA TAMU · MEJA TRANSIT
              </div>
              <h1 className="font-serif font-black text-xs sm:text-base text-[#422F21] leading-tight truncate">
                Haul &amp; Haflah P3TQ - MHMTQ 2027
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-0.5 md:pb-0">
            <button
              type="button"
              onClick={() => handleOpenAddModal('ISTIMEWA')}
              className="flex-1 md:flex-none justify-center px-3 py-2 sm:py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs flex items-center space-x-1 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Tamu</span>
            </button>
            <button
              type="button"
              onClick={() => setIsUsModalOpen(true)}
              className="flex-1 md:flex-none justify-center px-3 py-2 sm:py-1.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 hover:brightness-105 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap"
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-200" />
              <span>Tanya Usth. Halwaa</span>
            </button>
            {showLogout && (
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-2 sm:py-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 text-xs font-bold shadow-2xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap"
                title="Keluar / Ganti Peran"
              >
                <LogOut className="w-3.5 h-3.5 text-stone-500" />
                <span className="inline">Keluar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* RINGKASAN LIVE DASBOR TAMU */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-3xl bg-white border border-[#E8DFD5] shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">
              Total Tamu Terdata
            </span>
            <div className="text-2xl font-serif font-black text-[#422F21]">
              {totalKuotaTamu > 0 ? `${totalKuotaTamu} Kursi` : '—'}
            </div>
            <p className="text-[11px] text-stone-600">Total Kuota ({undanganList.length} Undangan)</p>
          </div>

          <div className="p-4 rounded-3xl bg-emerald-50/70 border border-emerald-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
              Tamu Sudah Rawuh
            </span>
            <div className="text-2xl font-serif font-black text-emerald-900">
              {totalHadirTamu > 0 || totalKuotaTamu > 0 ? `${totalHadirTamu} Hadir` : '—'}
            </div>
            <p className="text-[11px] text-emerald-700">
              Terpakai ({totalKuotaTamu > 0 ? `${totalHadirTamu}/${totalKuotaTamu} Kursi` : '—'})
            </p>
          </div>

          <div className="p-4 rounded-3xl bg-amber-50/70 border border-amber-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">
              Belum Hadir
            </span>
            <div className="text-2xl font-serif font-black text-amber-900">
              {totalBelumHadirTamu} Belum
            </div>
            <p className="text-[11px] text-amber-700">Sisa Kuota Belum Terpakai</p>
          </div>

          <div className="p-4 rounded-3xl bg-blue-50/70 border border-blue-200 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wide">
              Registrasi Gerbang
            </span>
            <div className="text-2xl font-serif font-black text-blue-900">06.30 WIB</div>
            <p className="text-[11px] text-blue-700">07.00 Waktu Istiwa&apos; (WIs)</p>
          </div>
        </div>

        {/* TAB PILIHAN: ABSENSI CEPAT vs 8 POS JAGA */}
        <div className="flex bg-[#EFE8E1] p-1 rounded-2xl border border-[#D5C4B4] max-w-md">
          <button
            onClick={() => setActiveTab('ABSENSI')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ABSENSI'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-[#422F21] hover:text-emerald-800'
            }`}
          >
            Absensi Cepat Tamu
          </button>
          <button
            onClick={() => setActiveTab('POS_JAGA')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'POS_JAGA'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-[#422F21] hover:text-emerald-800'
            }`}
          >
            8 Pos Jaga Putri &amp; Putra
          </button>
        </div>

        {/* PANEL ABSENSI CEPAT TAMU UNDANGAN */}
        {activeTab === 'ABSENSI' && (
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#E8DFD5] shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
              <div>
                <h3 className="font-serif font-black text-lg text-[#422F21]">
                  absen cepat tamu undangan
                </h3>
                <p className="text-xs text-[#7A624E] font-medium">
                  haul haflah p3tq mhmtq 2027 M./ 1448 H.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Tamu Baru</span>
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama kiai, masyaikh, instansi, atau kode tamu..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#D5C4B4] bg-[#FAF7F3] focus:bg-white text-xs sm:text-sm focus:outline-none focus:border-emerald-700"
              />
            </div>

            {loading ? (
              <div className="p-8 text-center text-stone-500 text-xs">
                <p>Memuat data tamu dari Supabase...</p>
              </div>
            ) : filteredUndangan.length === 0 ? (
              <div className="p-8 text-center text-stone-500 text-xs bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                <p className="font-bold text-sm text-[#422F21]">Belum ada data peserta / tamu</p>
                <p className="mt-1 text-stone-600">
                  Silakan panitia menambahkan data tamu undangan via tombol &quot;+ Tambah Tamu Baru&quot;.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredUndangan.map((u) => {
                  const terpakai = u.kuota?.terpakai || 0;
                  const kuotaDasar =
                    u.kuota?.kuotaDasar !== undefined
                      ? u.kuota.kuotaDasar
                      : ((u.namaPutra && String(u.namaPutra).trim() ? 1 : 0) +
                          (u.namaPutri && String(u.namaPutri).trim() ? 1 : 0));
                  const kuotaTambahan = u.kuota?.kuotaTambahan || 0;
                  const totalKuotaItem = kuotaDasar + kuotaTambahan;
                  const isHadir = terpakai > 0;

                  return (
                    <div
                      key={u.id || u.kode}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isHadir
                          ? 'bg-emerald-50/60 border-emerald-300'
                          : 'bg-white border-[#E8DFD5] hover:border-emerald-500'
                      }`}
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                            {u.kode}
                          </span>
                          <span className="text-[10px] text-emerald-800 font-semibold truncate">
                            {u.kategori}
                          </span>
                        </div>
                        <h4 className="font-serif font-black text-sm text-[#422F21] truncate">
                          {u.nama}
                        </h4>
                        <p className="text-[11px] text-stone-600 truncate flex items-center gap-1">
                          <Building className="w-3 h-3 text-stone-400 shrink-0" />
                          <span>{u.instansi || u.alamat || 'Kediri'}</span>
                        </p>
                        {u.noHp && (
                          <p className="text-[10px] text-stone-500 truncate flex items-center gap-1">
                            <Phone className="w-3 h-3 text-stone-400 shrink-0" />
                            <span>{u.noHp}</span>
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0 space-y-1.5">
                        <div className="text-[11px] font-medium text-stone-500">
                          {isHadir ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-950 font-black text-[10px]">
                              ✓ HADIR ({terpakai}/{totalKuotaItem} Kursi)
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-stone-200 text-stone-700 font-semibold text-[10px]">
                              BELUM ({terpakai}/{totalKuotaItem} Kursi)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-1.5">
                          {!isHadir ? (
                            <button
                              type="button"
                              onClick={() => handleQuickCheckin(u)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                            >
                              Tandai Hadir
                            </button>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                                <Gift className="w-3 h-3 text-emerald-600" />
                                <span>Suvenir Siap</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleBatalkanHadir(u)}
                                className="px-2 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold shadow-2xs flex items-center space-x-1 transition-all cursor-pointer"
                                title="Batalkan Kehadiran (Undo)"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Batalkan Hadir</span>
                              </button>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => handleHapusTamu(u)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Tamu"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PANEL 8 POS JAGA */}
        {activeTab === 'POS_JAGA' && (
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#E8DFD5] shadow-sm space-y-4">
            <h3 className="font-serif font-black text-base text-[#422F21] border-b border-stone-100 pb-2">
              8 Pos Jaga Transit &amp; Registrasi Gerbang
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                <div className="font-bold text-amber-900 text-sm">Pos 1: Gerbang Utama VIP</div>
                <p className="text-amber-800 text-[11px]">Khusus Masyayikh &amp; Penguji Utama</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                <div className="font-bold text-emerald-900 text-sm">Pos 2: Transit Putri Barat</div>
                <p className="text-emerald-800 text-[11px]">Meja Registrasi Dzurriyah &amp; Nyai</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 space-y-1">
                <div className="font-bold text-blue-900 text-sm">Pos 3: Transit Putra Timur</div>
                <p className="text-blue-800 text-[11px]">Area Parkir Kiai &amp; Undangan Khusus</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 space-y-1">
                <div className="font-bold text-purple-900 text-sm">Pos 4: Meja Suvenir &amp; Berkat</div>
                <p className="text-purple-800 text-[11px]">Penyerahan Kitab &amp; Cendera Mata</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL TAMBAH TAMU BARU */}
      <TambahTamuModal
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        selectedGolonganUndangan={selectedGolonganUndangan}
        handleOpenAddModal={handleOpenAddModal}
        undanganForm={undanganForm}
        setUndanganForm={setUndanganForm}
        undanganKategoriDropdown={undanganKategoriDropdown}
        setUndanganKategoriDropdown={setUndanganKategoriDropdown}
        customKategoriInput={customKategoriInput}
        setCustomKategoriInput={setCustomKategoriInput}
        handleTambahTamu={handleTambahTamu}
      />

      {/* MODAL TANYA USTH. HALWAA */}
      {isUsModalOpen && (
        <TanyaUsModal
          isOpen={isUsModalOpen}
          onClose={() => setIsUsModalOpen(false)}
          role="PENERIMA_TAMU"
        />
      )}
    </div>
  );
}
