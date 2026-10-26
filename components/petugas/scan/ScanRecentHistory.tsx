'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { RecentScanLog } from './types';

interface ScanRecentHistoryProps {
  recentScans: RecentScanLog[];
}

export default function ScanRecentHistory({ recentScans }: ScanRecentHistoryProps) {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-xs border border-stone-200 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-[#8C6A47]" />
          <h3 className="font-serif font-black text-xs sm:text-sm text-[#422F21]">
            Scan Terakhir Hari Ini
          </h3>
        </div>
        <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
          5 Terakhir
        </span>
      </div>

      {recentScans.length === 0 ? (
        <p className="text-xs text-stone-400 font-medium text-center py-3">
          Belum ada riwayat scan presensi hari ini.
        </p>
      ) : (
        <div className="space-y-2">
          {recentScans.map((log) => {
            const totalOrang = (Number(log.jumlah_l) || 0) + (Number(log.jumlah_p) || 0);
            const timeStr = log.created_at
              ? new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
              : '-';

            return (
              <div
                key={log.id}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] text-xs"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                    ✓
                  </span>
                  <div className="min-w-0">
                    <span className="font-mono font-bold text-[#422F21] block truncate">
                      {log.kode_qr} — <span className="font-sans font-semibold text-stone-700">{log.nama_peserta || 'Peserta'}</span>
                    </span>
                    <span className="text-[10px] text-stone-500">
                      {timeStr} WIB · Jalur {log.jalur || 'Gerbang'}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-serif font-black text-amber-900 bg-amber-100 px-2.5 py-1 rounded-xl border border-amber-200 shrink-0">
                  {totalOrang} orang
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
