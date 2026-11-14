'use client';

import React, { useState } from 'react';
import { Eye, Loader2, Sparkles } from 'lucide-react';
import MergeDetailModal, { MergeDuplicateGroup } from './MergeDetailModal';

export interface MergeDuplicateBannerProps {
  mode: 'SANTRI' | 'TAMU';
  groups: MergeDuplicateGroup[];
  isMerging: boolean;
  setIsMerging: (loading: boolean) => void;
  onRefreshData: () => Promise<void>;
  showToast: (msg: string) => void;
}

/**
 * Renders the duplicate-merge alert banner with preview ("Lihat Detail") and batch-merge actions
 * shared between the Santri and Tamu tables.
 */
export default function MergeDuplicateBanner({
  mode,
  groups,
  isMerging,
  setIsMerging,
  onRefreshData,
  showToast,
}: MergeDuplicateBannerProps) {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  if (!groups || groups.length === 0) return null;

  const isSantri = mode === 'SANTRI';
  const targetTable = isSantri ? 'peserta_santri' : 'tamu_undangan';

  const executeMergeAllDuplicates = async (skipConfirm: boolean): Promise<boolean> => {
    if (groups.length === 0) {
      showToast(
        isSantri
          ? '✓ Tidak ada data santri dobel yang perlu digabung.'
          : '✓ Tidak ada data tamu dobel yang perlu digabung.'
      );
      return true;
    }

    if (!skipConfirm) {
      const confirmMsg = isSantri
        ? `Ditemukan ${groups.length} grup santri dengan nama dan wali yang sama. Apakah Anda ingin menggabungkannya secara otomatis menjadi kategori dobel?`
        : `Ditemukan ${groups.length} grup tamu undangan dengan nama dan kota yang cocok. Apakah Anda ingin menggabungkannya secara otomatis menjadi kategori dobel?`;
      if (!window.confirm(confirmMsg)) {
        return false;
      }
    }

    setIsMerging(true);
    try {
      let mergedCount = 0;
      let failedCount = 0;
      let lastError = '';

      for (const grp of groups) {
        const res = await fetch('/api/peserta/merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'merge',
            items: grp.items.map((it: any) => ({ id: it.id, table: targetTable })),
          }),
        });
        const json = await res.json();
        if (res.ok && json.ok) {
          mergedCount++;
        } else {
          failedCount++;
          if (json?.error) lastError = json.error;
        }
      }

      if (failedCount > 0) {
        alert(
          mergedCount === 0
            ? `Gagal menggabungkan data: ${lastError || 'Terjadi kesalahan server.'}`
            : `Sebagian data gagal digabungkan (${mergedCount} berhasil, ${failedCount} gagal): ${lastError || 'Periksa log server.'}`
        );
        if (mergedCount > 0) await onRefreshData();
        return false;
      }

      showToast(
        isSantri
          ? `✓ Berhasil menggabungkan ${mergedCount} grup santri kategori dobel.`
          : `✓ Berhasil menggabungkan ${mergedCount} grup tamu undangan kategori dobel.`
      );
      await onRefreshData();
      return true;
    } catch (e: any) {
      alert(`Gagal menggabungkan data: ${e?.message || e}`);
      return false;
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <>
      <div
        data-testid={`merge-banner-${mode.toLowerCase()}`}
        className={
          isSantri
            ? 'max-w-7xl mx-auto my-3 bg-amber-500/15 border border-amber-500/40 backdrop-blur-md rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-blue-950 shadow-sm animate-in fade-in'
            : 'max-w-7xl mx-auto mb-4 bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-in fade-in'
        }
      >
        <div className={`flex items-center space-x-3 ${isSantri ? '' : 'text-amber-900'}`}>
          {isSantri ? (
            <span className="text-2xl shrink-0" aria-hidden="true">⚠️</span>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-amber-200/80 text-amber-800 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-700 animate-pulse" aria-hidden="true" />
            </div>
          )}
          <div>
            <p className="font-bold text-xs sm:text-sm">
              {isSantri
                ? `Terdeteksi ${groups.length} Grup Santri Kategori Dobel Belum Bergabung`
                : `Terdeteksi ${groups.length} Grup Tamu Undangan Kategori Dobel Belum Bergabung`}
            </p>
            <p className={`text-[11px] ${isSantri ? 'text-blue-950/80' : 'text-amber-800/80'}`}>
              {isSantri
                ? `Nama santri dan wali sama (${groups.map((g) => g.nama).slice(0, 3).join(', ')}${groups.length > 3 ? '...' : ''}). Gabungkan menjadi 1 baris resmi dengan kuota otomatis.`
                : 'Data memiliki nama dan kota yang cocok di beberapa kategori berbeda. Pratinjau atau gabungkan secara otomatis.'}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            type="button"
            data-testid={`merge-detail-btn-${mode.toLowerCase()}`}
            onClick={() => setIsDetailModalOpen(true)}
            disabled={isMerging}
            className="w-full sm:w-auto px-4 py-2 min-h-[44px] rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            <Eye className="w-4 h-4 text-slate-600 shrink-0" aria-hidden="true" />
            <span>Lihat Detail</span>
          </button>

          <button
            type="button"
            onClick={() => executeMergeAllDuplicates(false)}
            disabled={isMerging}
            className="w-full sm:w-auto px-4 py-2 min-h-[44px] bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            {isMerging ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" aria-hidden="true" />
                <span>Menggabungkan...</span>
              </>
            ) : (
              <span>⚡ Gabung Data Sekarang ({groups.length})</span>
            )}
          </button>
        </div>
      </div>

      <MergeDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        mode={mode}
        groups={groups}
        isMerging={isMerging}
        onConfirmMergeAll={() => executeMergeAllDuplicates(true)}
      />
    </>
  );
}
