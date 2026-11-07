'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { store } from '@/lib/mock-data';
import { X, Search, Loader2, Users, MapPin, Award } from 'lucide-react';

interface PesertaItem {
  id: string;
  kode: string;
  nama: string;
  nama_wali?: string;
  alamat?: string;
  kategori_utama?: string;
  sub_kategori?: string;
  kelas?: string;
  kamar?: string;
}

interface DaftarShohibulHajatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DaftarShohibulHajatModal({ isOpen, onClose }: DaftarShohibulHajatModalProps) {
  const [pesertaList, setPesertaList] = useState<PesertaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'BIL_GHOIB' | 'BIN_NADZOR' | 'TAMATAN'>('ALL');

  // Fetch live peserta santri dari Supabase
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function fetchPeserta() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('peserta_santri')
          .select('id, kode, nama, nama_wali, alamat, kategori_utama, sub_kategori, kelas, kamar')
          .order('nama', { ascending: true });

        if (!error && data && data.length > 0) {
          if (isMounted) setPesertaList(data);
        } else {
          // Fallback lokal jika offline
          const fallback = store.getKeluargaList();
          if (fallback && fallback.length > 0 && isMounted) {
            setPesertaList(
              fallback.map((k: any) => ({
                id: k.id,
                kode: k.kode,
                nama: k.nama,
                nama_wali: k.namaWali,
                alamat: k.alamat,
                kategori_utama: k.kategori,
                sub_kategori: k.subKategori,
                kelas: k.kelas,
                kamar: k.kamar,
              }))
            );
          }
        }
      } catch (err) {
        console.warn('Error fetching peserta santri for modal:', err);
        const fallback = store.getKeluargaList();
        if (fallback && fallback.length > 0 && isMounted) {
          setPesertaList(
            fallback.map((k: any) => ({
              id: k.id,
              kode: k.kode,
              nama: k.nama,
              nama_wali: k.namaWali,
              alamat: k.alamat,
              kategori_utama: k.kategori,
              sub_kategori: k.subKategori,
              kelas: k.kelas,
              kamar: k.kamar,
            }))
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchPeserta();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // 1. Kunci scroll background saat modal terbuka & cegah scroll leak
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Listener tombol ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Helper pengelompokan kategori: Bil Ghoib -> Bin Nadzor -> Tamatan
  const getCategoryOrder = (kategoriUtama?: string, subKategori?: string): number => {
    const text = `${kategoriUtama || ''} ${subKategori || ''}`.toUpperCase();
    if (text.includes('GHOIB')) return 1;
    if (text.includes('NADZOR')) return 2;
    return 3; // Tamatan / lainnya
  };

  const getCategoryLabel = (kategoriUtama?: string, subKategori?: string): string => {
    const text = `${kategoriUtama || ''} ${subKategori || ''}`.toUpperCase();
    if (text.includes('GHOIB')) return 'Bil Ghoib';
    if (text.includes('NADZOR')) return 'Bin Nadzor';
    return subKategori || kategoriUtama || 'Tamatan';
  };

  // Filter & Urutan
  const filteredPeserta = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return pesertaList
      .filter((p) => {
        // Filter tab
        const catOrder = getCategoryOrder(p.kategori_utama, p.sub_kategori);
        if (activeTab === 'BIL_GHOIB' && catOrder !== 1) return false;
        if (activeTab === 'BIN_NADZOR' && catOrder !== 2) return false;
        if (activeTab === 'TAMATAN' && catOrder !== 3) return false;

        // Filter search query
        if (!q) return true;
        return (
          (p.nama && p.nama.toLowerCase().includes(q)) ||
          (p.nama_wali && p.nama_wali.toLowerCase().includes(q)) ||
          (p.alamat && p.alamat.toLowerCase().includes(q)) ||
          (p.kode && p.kode.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        const orderA = getCategoryOrder(a.kategori_utama, a.sub_kategori);
        const orderB = getCategoryOrder(b.kategori_utama, b.sub_kategori);
        if (orderA !== orderB) return orderA - orderB;
        return (a.nama || '').localeCompare(b.nama || '');
      });
  }, [pesertaList, searchQuery, activeTab]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border-2 border-[#BAE6FD] overflow-hidden animate-in zoom-in-95">
        {/* HEADER MODAL */}
        <div className="p-4 sm:p-5 border-b border-[#E8DFD5] bg-[#F0F9FF] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#FAF0E6] text-[#1D4ED8] border border-[#BAE6FD] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-black text-base sm:text-lg text-[#322116]">
                Daftar Shohibul Hajat
              </h3>
              <p className="text-[11px] text-[#7A624E]">
                Peserta Khotmil Qur-an &amp; Tamatan Haflah 2027
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-200/80 hover:bg-stone-300 text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
            title="Tutup (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SEARCH BAR & FILTER TABS */}
        <div className="p-3 sm:p-4 border-b border-[#E8DFD5] space-y-2.5 bg-white shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama santri, nama wali, atau daerah asal..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] text-xs focus:outline-hidden focus:ring-2 focus:ring-[#1D4ED8]"
            />
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-[#1D4ED8] text-white shadow-xs'
                  : 'bg-[#F0F9FF] text-stone-600 hover:bg-stone-200 border border-[#BAE6FD]'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('BIL_GHOIB')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'BIL_GHOIB'
                  ? 'bg-[#1D4ED8] text-white shadow-xs'
                  : 'bg-[#F0F9FF] text-stone-600 hover:bg-stone-200 border border-[#BAE6FD]'
              }`}
            >
              Bil Ghoib
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('BIN_NADZOR')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'BIN_NADZOR'
                  ? 'bg-[#1D4ED8] text-white shadow-xs'
                  : 'bg-[#F0F9FF] text-stone-600 hover:bg-stone-200 border border-[#BAE6FD]'
              }`}
            >
              Bin Nadzor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('TAMATAN')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'TAMATAN'
                  ? 'bg-[#1D4ED8] text-white shadow-xs'
                  : 'bg-[#F0F9FF] text-stone-600 hover:bg-stone-200 border border-[#BAE6FD]'
              }`}
            >
              Tamatan
            </button>
          </div>
        </div>

        {/* LIST DAFTAR PESERTA (SCROLLABLE DENGAN OVERSCROLL-CONTAIN, MAKS 60VH) */}
        <div className="flex-1 max-h-[60vh] overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-2.5 bg-[#F0F9FF]">
          {loading ? (
            <div className="py-12 text-center space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-[#1D4ED8] mx-auto" />
              <p className="font-serif font-bold text-xs text-[#0F2C59]">
                Memuat Daftar Shohibul Hajat...
              </p>
            </div>
          ) : filteredPeserta.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Award className="w-10 h-10 text-stone-300 mx-auto" />
              <p className="font-serif font-bold text-sm text-[#0F2C59]">
                Tidak ada data peserta yang cocok.
              </p>
              <p className="text-xs text-stone-500">
                Silakan coba kata kunci pencarian yang lain.
              </p>
            </div>
          ) : (
            filteredPeserta.map((p, idx) => {
              const catOrder = getCategoryOrder(p.kategori_utama, p.sub_kategori);
              const badgeClass =
                catOrder === 1
                  ? 'bg-sky-100 text-blue-950 border-sky-300'
                  : catOrder === 2
                  ? 'bg-blue-100 text-blue-900 border-blue-300'
                  : 'bg-stone-200 text-stone-800 border-stone-300';

              return (
                <div
                  key={p.id || p.kode || idx}
                  className="p-3 sm:p-3.5 rounded-2xl bg-white border border-[#E8DFD5] shadow-xs flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="font-serif font-black text-sm text-[#322116] truncate">
                        {p.nama}
                      </span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}
                      >
                        {getCategoryLabel(p.kategori_utama, p.sub_kategori)}
                      </span>
                    </div>

                    <div className="text-[11px] text-stone-600 flex items-center space-x-2">
                      <span>Wali: <strong>{p.nama_wali || '-'}</strong></span>
                      {p.alamat && (
                        <>
                          <span className="text-stone-300">•</span>
                          <span className="inline-flex items-center space-x-0.5 text-stone-500">
                            <MapPin className="w-3 h-3 text-[#1D4ED8] shrink-0" />
                            <span>{p.alamat}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <span className="font-mono text-[10px] font-bold text-stone-400 shrink-0">
                    {p.kode}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER MODAL */}
        <div className="p-3 sm:p-4 border-t border-[#E8DFD5] bg-white flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-stone-500 font-medium">
            Menampilkan <strong>{filteredPeserta.length}</strong> peserta
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#F0F9FF] hover:bg-[#E0F2FE] border border-[#BAE6FD] font-bold text-[#1E3A8A] cursor-pointer transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
