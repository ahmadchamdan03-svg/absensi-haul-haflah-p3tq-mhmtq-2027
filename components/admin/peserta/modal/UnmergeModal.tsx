'use client';

import React, { useState, useEffect } from 'react';
import { Unlink, X, AlertTriangle, Loader2 } from 'lucide-react';

export interface UnmergeModalProps {
  isOpen: boolean;
  mergedCard: any;
  onUnmergeSelected: (selectedIds: Array<{ id: string; table: 'tamu_undangan' | 'peserta_santri' }>) => Promise<void>;
  onClose: () => void;
}

export default function UnmergeModal({
  isOpen,
  mergedCard,
  onUnmergeSelected,
  onClose,
}: UnmergeModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mergedCard?.mergedItems) {
      // Default: select all
      setSelectedIds(mergedCard.mergedItems.map((i: any) => i.id));
    } else {
      setSelectedIds([]);
    }
  }, [mergedCard]);

  if (!isOpen || !mergedCard) return null;

  const items: any[] = mergedCard.mergedItems || [];
  const hasScanned = items.some((i: any) => Number(i.terpakai || i.kuota_terpakai || 0) > 0);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleConfirm = async () => {
    if (selectedIds.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = selectedIds.map(id => {
        const found = items.find((i: any) => i.id === id);
        return {
          id,
          table: (found?.tipe === 'SANTRI' ? 'peserta_santri' : 'tamu_undangan') as 'tamu_undangan' | 'peserta_santri',
        };
      });
      await onUnmergeSelected(payload);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-sky-200 space-y-4 animate-in zoom-in-95">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0">
              <Unlink className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="font-serif font-black text-base text-[#0F2C59]">
                Pisahkan (Unmerge) Peserta
              </h3>
              <p className="text-[11px] text-slate-500">
                Pilih kategori peserta yang ingin dilepaskan dari grup
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog pemisahan peserta"
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {hasScanned ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Tidak dapat dipisahkan:</span> Peserta dalam grup ini sudah pernah melakukan scan kehadiran. Untuk integritas data presensi, grup yang sudah hadir tidak dapat di-unmerge.
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-600">
              Centang data kategori di bawah ini yang ingin dilepaskan kembali menjadi kartu mandiri:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {items.map((item: any) => {
                const isChecked = selectedIds.includes(item.id);
                return (
                  <label
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-sky-50/80 border-sky-300 text-slate-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelect(item.id)}
                        className="w-4 h-4 text-blue-700 rounded border-slate-300 focus:ring-blue-500"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-xs truncate">{item.nama}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {item.kode} · {item.golonganUndangan || item.kategori || item.subKategori || item.kategoriUtama}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0">
                      Kuota: {item.kuotaDasar || 1}
                    </span>
                  </label>
                );
              })}
            </div>
          </>
        )}

        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
          >
            Batal
          </button>
          {!hasScanned && (
            <button
              type="button"
              disabled={selectedIds.length === 0 || isSubmitting}
              onClick={handleConfirm}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-colors flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memisahkan...</span>
                </>
              ) : (
                <>
                  <Unlink className="w-4 h-4" />
                  <span>Pisahkan Terpilih ({selectedIds.length})</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
