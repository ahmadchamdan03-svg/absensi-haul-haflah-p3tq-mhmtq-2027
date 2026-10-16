'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Users,
  Search,
  Filter,
  ExternalLink,
  Trash2,
  ChevronRight,
  FileCheck,
  AlertCircle,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import {
  Persidangan,
  getPersidanganList,
  deletePersidangan,
} from '@/lib/persidangan';
import { supabase } from '@/lib/supabase';

export default function PersidanganDashboardPage() {
  const router = useRouter();

  const [persidanganList, setPersidanganList] = useState<Persidangan[]>([]);
  const [pesertaCounts, setPesertaCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModalTarget, setDeleteModalTarget] = useState<Persidangan | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const list = await getPersidanganList();
      setPersidanganList(list);

      // Hitung peserta per persidangan
      if (list.length > 0) {
        const { data: pesertaData } = await supabase
          .from('persidangan_peserta')
          .select('persidangan_id');

        if (pesertaData) {
          const counts: Record<string, number> = {};
          pesertaData.forEach((row: any) => {
            const pId = row.persidangan_id;
            counts[pId] = (counts[pId] || 0) + 1;
          });
          setPesertaCounts(counts);
        }
      }
    } catch (err: any) {
      console.error('Error fetching persidangan dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle ESC key for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDeleteModalTarget(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered Persidangan
  const filteredList = useMemo(() => {
    return persidanganList.filter((item) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const judul = (item.judul || '').toLowerCase();
        return judul.includes(q);
      }
      return true;
    });
  }, [persidanganList, search]);

  const handleConfirmDelete = async () => {
    if (!deleteModalTarget) return;

    setDeletingId(deleteModalTarget.id);
    try {
      const { error } = await deletePersidangan(deleteModalTarget.id);
      if (error) {
        alert('Gagal menghapus persidangan: ' + error.message);
        return;
      }
      setDeleteModalTarget(null);
      fetchDashboardData();
    } catch (err: any) {
      alert('Terjadi kesalahan: ' + (err?.message || err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF7F3] border-2 border-[#D5C4B4] rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EFE8E1] border border-[#D5C4B4] text-[10px] font-bold uppercase tracking-wider text-[#8C6A47]">
            <Sparkles className="w-3 h-3 text-[#D49B5B]" />
            Modul Kepanitiaan
          </div>
          <h1 className="font-serif font-black text-xl sm:text-2xl text-[#422F21]">
            Manajemen Persidangan
          </h1>
          <p className="text-xs text-[#735334] max-w-xl">
            Kelola persidangan, unggah berkas PDF resmi, dan distribusikan tautan langsung ke peserta via WhatsApp.
          </p>
        </div>

        <Link
          href="/admin/persidangan/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          + Buat Persidangan Baru
        </Link>
      </div>

      {/* Search Bar */}
      <div className="bg-[#FAF7F3] border-2 border-[#D5C4B4] rounded-2xl p-4 shadow-xs">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-[#8C6A47] absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul persidangan..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs text-[#422F21] placeholder-[#A89887] focus:outline-none focus:ring-2 focus:ring-[#8C6A47]/40"
          />
        </div>
      </div>

      {/* Grid of Persidangan Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#FAF7F3] border-2 border-[#D5C4B4] rounded-2xl p-5 shadow-xs space-y-4 animate-pulse"
            >
              <div className="h-4 bg-[#E5D7C8] rounded w-3/4"></div>
              <div className="h-3 bg-[#E5D7C8] rounded w-1/2"></div>
              <div className="space-y-2 pt-2">
                <div className="h-3 bg-[#E5D7C8] rounded w-full"></div>
                <div className="h-3 bg-[#E5D7C8] rounded w-5/6"></div>
              </div>
              <div className="h-8 bg-[#E5D7C8] rounded-xl w-full pt-4"></div>
            </div>
          ))}
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-[#FAF7F3] border-2 border-dashed border-[#D5C4B4] rounded-2xl p-10 sm:p-14 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-white border border-[#D5C4B4] text-[#8C6A47] flex items-center justify-center mx-auto shadow-xs">
            <FileText className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-base text-[#422F21]">
              {persidanganList.length === 0
                ? 'Belum ada persidangan'
                : 'Tidak ada persidangan yang sesuai'}
            </h3>
            <p className="text-xs text-[#735334] max-w-sm mx-auto">
              {persidanganList.length === 0
                ? 'Belum ada persidangan yang dibuat. Klik tombol di bawah untuk membuat surat undangan persidangan baru.'
                : 'Coba ubah kata kunci pencarian Anda.'}
            </p>
          </div>
          {persidanganList.length === 0 && (
            <Link
              href="/admin/persidangan/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              + Buat Persidangan Baru
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredList.map((item) => {
            const countPeserta = pesertaCounts[item.id] || 0;
            const hasPdf = Boolean(item.pdf_url);

            return (
              <div
                key={item.id}
                className="bg-[#FAF7F3] border-2 border-[#D5C4B4] rounded-2xl p-5 shadow-xs hover:border-[#8C6A47] transition-all flex flex-col justify-between space-y-4 group"
              >
                {/* Header Card */}
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-emerald-100 text-emerald-800 border-emerald-300">
                      Aktif
                    </span>

                    {hasPdf ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <FileCheck className="w-3 h-3" />
                        PDF Siap
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <AlertCircle className="w-3 h-3" />
                        Belum Ada PDF
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif font-bold text-base text-[#422F21] group-hover:text-[#8C6A47] transition-colors line-clamp-2">
                    {item.judul}
                  </h3>
                </div>

                {/* Details info */}
                <div className="space-y-2 py-2 border-y border-[#E5D7C8] text-xs text-[#735334]">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-[#8C6A47] shrink-0" />
                    <span>
                      <strong>{countPeserta}</strong> Peserta Terdaftar
                    </span>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1">
                    {hasPdf && (
                      <a
                        href={`/persidangan/${item.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Buka Halaman Undangan Resmi"
                        className="p-2 rounded-xl bg-white border border-[#D5C4B4] text-[#735334] hover:bg-[#FAF7F3] transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#8C6A47]" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setDeleteModalTarget(item)}
                      title="Hapus persidangan"
                      className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <Link
                    href={`/admin/persidangan/${item.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8C6A47] hover:bg-[#735334] text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <span>Kelola</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setDeleteModalTarget(null)}
        >
          <div
            className="bg-[#FAF7F3] border-2 border-[#D5C4B4] rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-700">
              <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#422F21]">
                  Hapus Persidangan?
                </h3>
                <span className="text-[11px] text-red-600 font-semibold">
                  Tindakan ini tidak dapat dibatalkan
                </span>
              </div>
            </div>

            <p className="text-xs text-[#735334] leading-relaxed">
              Anda akan menghapus persidangan{' '}
              <strong className="text-[#422F21]">&quot;{deleteModalTarget.judul}&quot;</strong>.
              Seluruh data peserta terkait akan ikut dihapus secara otomatis (CASCADE).
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5D7C8]">
              <button
                type="button"
                onClick={() => setDeleteModalTarget(null)}
                disabled={deletingId !== null}
                className="px-4 py-2 rounded-xl border border-[#D5C4B4] bg-white text-xs font-bold text-[#735334] hover:bg-[#FAF7F3]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletingId !== null}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deletingId ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
