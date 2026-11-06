'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  LogOut,
  Gift,
  Building,
  UserRoundPlus,
  Phone,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { clearActiveRole } from '@/lib/auth-roles';
import { useTamuData } from '@/lib/hooks/useTamuData';
import TambahTamuModal from '@/components/penerima-tamu/TambahTamuModal';
import TanyaUsModal from '@/components/TanyaUsModal';
import { SkeletonCard, SkeletonList } from '@/components/ui/GlassSkeleton';

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
    isSubmittingTamu,
    formErrors,
    setFormErrors,
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
    <div className="min-h-screen bg-transparent text-[#0F2C59] pb-24">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-12 space-y-6">
        {/* HEADER NORMAL FLOW — Ikut ter-scroll ke atas, tidak sticky/fixed */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 sm:mb-8">
          {/* Left-aligned Header Title */}
          <div className="flex flex-col items-start justify-start text-left w-full md:w-auto">
            <div className="flex items-center justify-start gap-2.5 mb-1.5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-white/20 text-white border-2 border-white/50 flex items-center justify-center font-bold shadow-xs shrink-0 backdrop-blur-sm">
                <Users className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" />
              </div>
              <span
                className="text-xs sm:text-sm lg:text-base font-serif font-black tracking-widest text-white uppercase leading-tight drop-shadow-md"
                style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)' }}
              >
                POS PENERIMA TAMU · MEJA TRANSIT
              </span>
            </div>
            <h1
              className="font-serif font-black text-2xl sm:text-3xl lg:text-4xl text-white leading-tight tracking-wide drop-shadow-md"
              style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)' }}
            >
              Haul &amp; Haflah P3TQ - MHMTQ 2027
            </h1>
          </div>

          {/* Action Buttons: Positioned right-aligned */}
          <div className="flex items-center space-x-2 shrink-0 self-start md:self-center">
            <button
              type="button"
              onClick={() => handleOpenAddModal('ISTIMEWA')}
              className="px-3.5 py-2 sm:py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-md flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap"
            >
              <UserRoundPlus className="w-4 h-4" />
              <span>Tambah Tamu</span>
            </button>
            {showLogout && (
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-2 sm:py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/40 text-xs font-bold shadow-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap"
                title="Keluar / Ganti Peran"
              >
                <LogOut className="w-3.5 h-3.5 text-white/80" />
                <span className="inline">Keluar</span>
              </button>
            )}
          </div>
        </div>

        {/* RINGKASAN LIVE DASBOR TAMU */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in duration-300">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in duration-300">
            <div className="p-4 rounded-3xl bg-white/85 backdrop-blur-md border border-white/80 shadow-md space-y-1">
              <span className="text-[10px] font-bold text-[#0F2C59] uppercase tracking-wide">
                Total Tamu Terdata
              </span>
              <div className="text-2xl font-serif font-black text-[#0F2C59]">
                {totalKuotaTamu > 0 ? `${totalKuotaTamu} Kursi` : '—'}
              </div>
              <p className="text-[11px] text-stone-600 font-medium">Total Kuota ({undanganList.length} Undangan)</p>
            </div>

            <div className="p-4 rounded-3xl bg-blue-50/85 backdrop-blur-md border border-blue-200/80 shadow-md space-y-1">
              <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wide">
                Tamu Sudah Rawuh
              </span>
              <div className="text-2xl font-serif font-black text-blue-950">
                {totalHadirTamu > 0 || totalKuotaTamu > 0 ? `${totalHadirTamu} Hadir` : '—'}
              </div>
              <p className="text-[11px] text-blue-800 font-medium">
                Terpakai ({totalKuotaTamu > 0 ? `${totalHadirTamu}/${totalKuotaTamu} Kursi` : '—'})
              </p>
            </div>

            <div className="p-4 rounded-3xl bg-sky-50/85 backdrop-blur-md border border-sky-200/80 shadow-md space-y-1">
              <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wide">
                Belum Hadir
              </span>
              <div className="text-2xl font-serif font-black text-blue-950">
                {totalBelumHadirTamu} Kursi
              </div>
              <p className="text-[11px] text-amber-800 font-medium">Sisa Kuota Belum Terpakai</p>
            </div>

            <div className="p-4 rounded-3xl bg-blue-50/85 backdrop-blur-md border border-blue-200/80 shadow-md space-y-1">
              <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wide">
                Registrasi Gerbang
              </span>
              <div className="text-2xl font-serif font-black text-blue-950">06.30 WIB</div>
              <p className="text-[11px] text-blue-800 font-medium">07.00 Waktu Istiwa&apos; (WIs)</p>
            </div>
          </div>
        )}

        {/* TAB PILIHAN: ABSENSI CEPAT vs 8 POS JAGA */}
        <div className="flex bg-white/80 backdrop-blur-md p-1 rounded-2xl border border-white/60 max-w-md shadow-xs">
          <button
            onClick={() => setActiveTab('ABSENSI')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ABSENSI'
                ? 'bg-blue-800 text-white shadow-xs'
                : 'text-[#0F2C59] hover:text-blue-800'
            }`}
          >
            Absensi Cepat Tamu
          </button>
          <button
            onClick={() => setActiveTab('POS_JAGA')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'POS_JAGA'
                ? 'bg-blue-800 text-white shadow-xs'
                : 'text-[#0F2C59] hover:text-blue-800'
            }`}
          >
            8 Pos Jaga Putri &amp; Putra
          </button>
        </div>

        {/* PANEL ABSENSI CEPAT TAMU UNDANGAN */}
        {activeTab === 'ABSENSI' && (
          <div className="bg-white/85 backdrop-blur-md rounded-3xl p-5 sm:p-7 border border-white/70 shadow-lg space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-200/60 pb-4">
              <div>
                <h3 className="font-serif font-black text-lg text-[#0F2C59]">
                  Absen Cepat Tamu Undangan
                </h3>
                <p className="text-xs text-[#0F2C59]/75 font-semibold">
                  Haul Haflah P3TQ MHMTQ 2027 M./ 1448 H.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 rounded-xl bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
              >
                <UserRoundPlus className="w-4 h-4" />
                <span>Tambah Tamu Baru</span>
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama kiai, masyaikh, instansi, atau kode tamu..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-white/60 bg-white/50 backdrop-blur-sm focus:bg-white/80 text-xs sm:text-sm text-[#0F2C59] placeholder-[#7A624E]/70 focus:outline-none focus:border-[#1D4ED8] shadow-xs"
              />
            </div>

            {loading ? (
              <SkeletonList rows={4} className="pt-1" />
            ) : filteredUndangan.length === 0 ? (
              <div className="p-8 text-center text-[#7A624E] text-xs bg-white/30 backdrop-blur-sm rounded-2xl border border-dashed border-white/60 shadow-xs">
                <p className="font-bold text-sm text-[#0F2C59]">Belum Ada Data Tamu</p>
                <p className="mt-1 text-[#7A624E]">
                  Belum ada data tamu pada daftar ini. Silakan tambahkan data melalui tombol Tambah Tamu Baru di atas.
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
                      className={`p-4 rounded-2xl border backdrop-blur-xs transition-all flex flex-col gap-2.5 shadow-xs ${
                        isHadir
                          ? 'bg-blue-50/70 border-blue-300'
                          : 'bg-white/60 hover:bg-white/80 border-white/60 hover:border-blue-500/70'
                      }`}
                    >
                      {/* Baris 1 (Atas): Kode QR, Kategori, & Status Hadir */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5 w-full">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100/80 text-stone-700 border border-stone-200">
                            {u.kode}
                          </span>
                          {u.isMerged ? (
                            <>
                              {/* Kategori Utama (1 badge jika kategori utamanya sama) */}
                              {(u.uniqueGolongan && u.uniqueGolongan.length > 0
                                ? u.uniqueGolongan
                                : [u.golongan || 'ISTIMEWA']
                              ).map((gol: string, gIdx: number) => {
                                const isIst = gol === 'ISTIMEWA';
                                const isKeh = gol === 'KEHORMATAN';
                                return (
                                  <span
                                    key={gIdx}
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                      isIst
                                        ? 'bg-amber-100 text-amber-950 border-amber-300'
                                        : isKeh
                                        ? 'bg-purple-100 text-purple-950 border-purple-300'
                                        : 'bg-cyan-100 text-cyan-950 border-cyan-300'
                                    }`}
                                  >
                                    {isIst ? '👑 Istimewa' : isKeh ? '🏛️ Kehormatan' : '👥 Umum'}
                                  </span>
                                );
                              })}
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-200 text-[10px] font-bold">
                                <Users className="w-3 h-3 text-purple-700" />
                                <span>Gabungan ({u.mergedItems?.length || 2})</span>
                              </span>
                            </>
                          ) : (
                            <span className="text-[10px] text-blue-800 font-semibold truncate">
                              {u.golongan ? `${u.golongan} · ` : ''}{u.kategori}
                            </span>
                          )}
                        </div>

                        {/* Jika kartu gabungan, tampilkan Sub-Kategori sebagai label kecil */}
                        {u.isMerged && (
                          <div className="flex flex-wrap items-center gap-1">
                            {(u.uniqueSubKategori && u.uniqueSubKategori.length > 0
                              ? u.uniqueSubKategori
                              : Array.from(
                                  new Set(
                                    (u.mergedItems || [])
                                      .map((m: any) => (m.kategori || m.subKategori || '').trim())
                                      .filter(Boolean)
                                  )
                                )
                            ).map((sub: string, sIdx: number) => (
                              <span
                                key={sIdx}
                                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/80 text-blue-950 border border-blue-200/80 shadow-2xs"
                              >
                                {sub}
                              </span>
                            ))}
                          </div>
                        )}
                        {/* Status Hadir Pill */}
                        <div className="text-[11px] font-medium text-stone-500">
                          {isHadir ? (
                            <span className="px-2.5 py-1 rounded-full bg-blue-200/90 text-blue-950 font-black text-[10px] shadow-xs">
                              ✓ HADIR ({terpakai}/{totalKuotaItem} Kursi)
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-stone-200/80 text-stone-700 font-semibold text-[10px]">
                              BELUM ({terpakai}/{totalKuotaItem} Kursi)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Baris 2 (Tengah): Nama Tamu (Anti-Truncate) */}
                      <div className="w-full">
                        <h4 className="w-full text-lg font-bold font-serif text-[#0F2C59] whitespace-normal break-words leading-snug">
                          {u.nama}
                        </h4>
                      </div>

                      {/* Baris 3 (Bawah): Tempatkan Instansi/Alamat di sisi kiri, dan Tombol Aksi di sisi kanan */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mt-2 pt-2.5 border-t border-stone-200/60 w-full">
                        <div className="space-y-0.5 text-[#7A624E]">
                          <p className="text-[11px] flex items-center gap-1 whitespace-normal break-words">
                            <Building className="w-3 h-3 text-[#1D4ED8] shrink-0" />
                            <span>{u.instansi || u.alamat || 'Kediri'}</span>
                          </p>
                          {u.noHp && (
                            <p className="text-[10px] text-stone-500 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-stone-400 shrink-0" />
                              <span>{u.noHp}</span>
                            </p>
                          )}
                        </div>

                        {/* Tombol Aksi */}
                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          {!isHadir ? (
                            <button
                              type="button"
                              onClick={() => handleQuickCheckin(u)}
                              className="px-3 py-1.5 rounded-xl bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                            >
                              Tandai Hadir
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-blue-700 font-semibold flex items-center gap-1">
                                <Gift className="w-3 h-3 text-blue-600" />
                                <span>Suvenir Siap</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleBatalkanHadir(u)}
                                className="px-2 py-1 rounded-xl bg-rose-50/80 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold shadow-2xs flex items-center space-x-1 transition-all cursor-pointer"
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
          <div className="bg-white/40 backdrop-blur-md rounded-3xl p-5 sm:p-7 border border-white/50 shadow-sm space-y-4">
            <h3 className="font-serif font-black text-base text-[#0F2C59] border-b border-white/40 pb-2">
              8 Pos Jaga Transit &amp; Registrasi Gerbang
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-sky-50/70 backdrop-blur-xs border border-sky-200/80 space-y-1">
                <div className="font-bold text-blue-950 text-sm">Pos 1: Gerbang Utama VIP</div>
                <p className="text-blue-900 text-[11px]">Khusus Masyayikh &amp; Penguji Utama</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-blue-50/70 backdrop-blur-xs border border-blue-200/80 space-y-1">
                <div className="font-bold text-blue-900 text-sm">Pos 2: Transit Putri Barat</div>
                <p className="text-blue-800 text-[11px]">Meja Registrasi Dzurriyah &amp; Nyai</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-blue-50/70 backdrop-blur-xs border border-blue-200/80 space-y-1">
                <div className="font-bold text-blue-900 text-sm">Pos 3: Transit Putra Timur</div>
                <p className="text-blue-800 text-[11px]">Area Parkir Kiai &amp; Undangan Khusus</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-purple-50/70 backdrop-blur-xs border border-purple-200/80 space-y-1">
                <div className="font-bold text-purple-900 text-sm">Pos 4: Meja Suvenir &amp; Berkat</div>
                <p className="text-purple-800 text-[11px]">Penyerahan Kitab &amp; Cendera Mata</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FLOATING ACTION BUTTON (FAB) TANYA USTH. HALWAA */}
      {!isUsModalOpen && (
        <button
          type="button"
          onClick={() => setIsUsModalOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center space-x-2.5 px-4 py-2.5 rounded-full bg-[#1D4ED8]/90 hover:bg-[#1D4ED8] backdrop-blur-md text-white font-bold text-xs shadow-2xl border border-white/40 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
          title="Tanya Usth. Halwaa seputar tamu dan protokoler"
        >
          <div className="w-7 h-7 rounded-full bg-white/20 border border-white/40 overflow-hidden flex items-center justify-center shrink-0">
            <img
              src="/images/avatar/ustadzah-avatar-wave.png"
              alt="Usth. Halwaa"
              className="w-full h-full object-cover object-center"
            />
          </div>
          <span className="font-serif tracking-wide text-amber-100 group-hover:text-white">
            Usth. Halwaa
          </span>
        </button>
      )}

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
        isSubmitting={isSubmittingTamu}
        errors={formErrors}
        setErrors={setFormErrors}
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
