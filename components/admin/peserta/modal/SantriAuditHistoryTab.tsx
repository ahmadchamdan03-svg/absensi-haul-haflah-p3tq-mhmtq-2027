'use client';

import React from 'react';
import { History } from 'lucide-react';

interface SantriAuditHistoryProps {
  loading: boolean;
  history: any[];
}

export default function SantriAuditHistoryTab({
  loading,
  history,
}: SantriAuditHistoryProps) {
  if (loading) {
    return (
      <div className="py-12 text-center text-stone-500 font-medium">
        Memuat riwayat audit...
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="py-12 text-center text-stone-500">
        <History className="w-8 h-8 text-stone-300 mx-auto mb-2" />
        <p className="font-bold">Belum Ada Riwayat Audit</p>
        <p className="text-[11px] text-stone-400 mt-1">
          Setiap aksi perubahan data pada peserta ini akan otomatis tercatat di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((log) => {
        const dtStr = log.created_at
          ? new Date(log.created_at).toLocaleString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Asia/Jakarta',
            })
          : '-';
        return (
          <div
            key={log.id}
            className="p-3.5 rounded-xl bg-white border border-stone-200 shadow-2xs space-y-1.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] bg-amber-100 text-amber-900 border border-amber-300">
                {log.aksi}
              </span>
              <span className="text-[10px] text-stone-400 font-mono">{dtStr} WIB</span>
            </div>
            <div className="text-xs font-semibold text-[#422F21]">
              Oleh: <span className="font-bold text-[#8C6A47]">{log.panitia_id || 'SYSTEM'}</span> ({log.panitia_role || 'PANITIA'})
            </div>
            {log.catatan && (
              <div className="text-[11px] text-stone-600 italic">
                "{log.catatan}"
              </div>
            )}
            {(log.nilai_lama || log.nilai_baru) && (
              <div className="text-[11px] font-mono bg-stone-50 p-2 rounded-lg border border-stone-200 text-stone-700 overflow-x-auto">
                {log.field && <span className="font-bold text-[#8C6A47]">{log.field}: </span>}
                {log.nilai_lama && <span className="line-through text-rose-600 mr-2">{log.nilai_lama}</span>}
                {log.nilai_baru && <span className="text-emerald-700 font-bold">{log.nilai_baru}</span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
