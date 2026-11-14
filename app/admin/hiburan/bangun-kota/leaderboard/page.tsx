'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Gamepad2, Trophy } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import { getTopScores, LeaderboardEntry } from '../_lib/db';

export default function BangunKotaLeaderboardPage() {
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    getTopScores(10)
      .then((data) => {
        if (active) {
          setScores(data);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 lg:pb-12 space-y-6">
      <div className="bg-white/95 border-2 border-[#D49B5B]/45 rounded-3xl p-5 sm:p-7 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0F2C59] border-2 border-[#D49B5B] flex items-center justify-center shrink-0 shadow-sm">
            <Trophy className="w-7 h-7 text-[#F5C56B]" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-[#92400E]">
              Bangun Kota (City Bloxx)
            </p>
            <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#0F2C59] tracking-tight">
              Papan Skor (Leaderboard)
            </h1>
            <p className="text-sm text-slate-700 leading-relaxed">
              Daftar 10 besar panitia dengan skor dan menara tertinggi.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/admin/hiburan/bangun-kota"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F2C59] focus-visible:ring-offset-2"
          >
            <Gamepad2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Kembali ke Game</span>
          </Link>

          <Link
            href="/admin/hiburan"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#0F2C59] border border-slate-300 text-xs sm:text-sm font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Kembali ke Lobby</span>
          </Link>
        </div>
      </div>

      <GlassCard className="p-5 sm:p-7 border border-[#D49B5B]/50 bg-white/95 shadow-lg overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-sm font-semibold text-slate-600">
            Memuat data peringkat panitia...
          </div>
        ) : scores.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <p className="text-base font-bold text-[#0F2C59]">
              Belum ada skor tercatat di Papan Skor.
            </p>
            <p className="text-sm text-slate-600">
              Mainkan Bangun Kota (City Bloxx) dan simpan skormu untuk menjadi peringkat pertama!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-[#D49B5B]/40 text-xs uppercase tracking-wider text-[#0F2C59] font-extrabold">
                  <th className="py-3 px-4 w-24">Peringkat</th>
                  <th className="py-3 px-4">Nama</th>
                  <th className="py-3 px-4 text-right">Skor</th>
                  <th className="py-3 px-4 text-right">Lantai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 text-sm">
                {scores.map((entry, idx) => {
                  const rank = idx + 1;
                  const isTopThree = rank <= 3;
                  return (
                    <tr
                      key={entry.id}
                      className={
                        rank === 1
                          ? 'bg-amber-50/70 font-bold'
                          : 'hover:bg-slate-50/80 transition-colors'
                      }
                    >
                      <td className="py-3.5 px-4 tabular-nums">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-xs ${
                            isTopThree
                              ? 'bg-[#0F2C59] text-[#F5C56B] border border-[#D49B5B]'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          #{rank}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#0F2C59]">
                        {entry.name}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black tabular-nums text-[#1E3A8A]">
                        {entry.score.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold tabular-nums text-slate-700">
                        {entry.floor} Lantai
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
