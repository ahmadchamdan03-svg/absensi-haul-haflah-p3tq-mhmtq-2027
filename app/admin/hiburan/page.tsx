'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Brain,
  Puzzle,
  Play,
  Building2,
  Trophy,
} from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import { getTopScores, LeaderboardEntry } from './bangun-kota/_lib/db';

interface GameItem {
  id: string;
  title: string;
  category: string;
  description: string;
  href: string;
  icon: 'brain' | 'puzzle' | 'city' | 'trophy';
  featured?: boolean;
  ready?: boolean;
  buttonText?: string;
}

const GAMES: GameItem[] = [
  {
    id: 'kuis',
    title: 'Kuis Kilat Haflah',
    category: 'Tanya Jawab',
    description:
      'Uji pengetahuanmu seputar Haflah, sejarah pondok, dan rangkaian acara.',
    href: '/admin/hiburan/kuis',
    icon: 'brain',
    featured: true,
  },
  {
    id: 'tebak-gambar',
    title: 'Tebak Gambar P3TQ',
    category: 'Permainan Visual',
    description:
      'Kenali lokasi, momen, dan simbol kegiatan P3TQ melalui petunjuk visual.',
    href: '/admin/hiburan/tebak-gambar',
    icon: 'puzzle',
  },
  {
    id: 'bangun-kota',
    title: 'Bangun Kota (City Bloxx)',
    category: 'Permainan Visual',
    description:
      'Susun menara setinggi mungkin. Seimbangkan presisi dan ritme.',
    href: '/admin/hiburan/bangun-kota',
    icon: 'city',
    featured: true,
    ready: true,
  },
  {
    id: 'leaderboard-bangun-kota',
    title: 'Papan Skor (Leaderboard)',
    category: 'Peringkat Panitia',
    description: 'Lihat siapa panitia dengan menara tertinggi.',
    href: '/admin/hiburan/bangun-kota/leaderboard',
    icon: 'trophy',
    ready: true,
    buttonText: 'Lihat',
  },
];

export default function HiburanLobbyPage() {
  const [topScoreEntry, setTopScoreEntry] = useState<LeaderboardEntry | null>(
    null
  );

  useEffect(() => {
    let active = true;
    getTopScores(1).then((res) => {
      if (active && res.length > 0) {
        setTopScoreEntry(res[0]);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 lg:pb-10 space-y-8">
      <div className="bg-white/90 border border-[#D49B5B]/45 rounded-3xl p-5 sm:p-7 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-widest text-[#92400E]">
            Lobby Hiburan
          </p>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#0F2C59] tracking-tight">
            Pusat Hiburan &amp; Kuis Haflah
          </h1>
          <p className="text-sm text-slate-700 max-w-2xl leading-relaxed">
            Pilih permainan di bawah untuk membuka ruang bermain. Modul
            permainan sedang disiapkan bertahap.
          </p>
        </div>

        <Link
          href="/admin/dasbor"
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#0F2C59] border border-slate-300 text-xs sm:text-sm font-bold shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Kembali ke Dasbor</span>
        </Link>
      </div>

      <section
        aria-label="Daftar Game"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {GAMES.map((game) => {
          const IconComponent =
            game.icon === 'brain'
              ? Brain
              : game.icon === 'city'
                ? Building2
                : game.icon === 'trophy'
                  ? Trophy
                  : Puzzle;

          const isLeaderboardCard = game.id === 'leaderboard-bangun-kota';

          return (
            <GlassCard
              key={game.id}
              className={`p-6 flex flex-col justify-between gap-6 border bg-white/90 transition-shadow hover:shadow-xl ${
                game.featured
                  ? 'border-[#D49B5B]/70 ring-1 ring-[#D49B5B]/30'
                  : 'border-white/80'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#0F2C59] border-2 border-[#D49B5B] flex items-center justify-center shrink-0 shadow-sm">
                    <IconComponent
                      className="w-7 h-7 text-[#F5C56B]"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-xs font-bold text-[#1E3A8A]">
                    {game.category}
                  </span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-serif font-black text-[#0F2C59] tracking-tight">
                    {game.title}
                  </h2>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {game.description}
                  </p>

                  {isLeaderboardCard && (
                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-300 text-xs font-bold text-[#92400E]">
                        <Trophy
                          className="w-3.5 h-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        {topScoreEntry
                          ? `Skor Tertinggi: ${topScoreEntry.name} (${topScoreEntry.score.toLocaleString('id-ID')} • ${topScoreEntry.floor} Lt)`
                          : 'Skor Tertinggi: Belum ada rekor'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div
                className={`pt-2 border-t border-slate-200/80 flex items-center ${
                  game.ready ? 'justify-end' : 'justify-between'
                } gap-3`}
              >
                {!game.ready && (
                  <span className="text-xs font-semibold text-[#92400E]">
                    Tahap Persiapan
                  </span>
                )}
                <Link
                  href={game.href}
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] active:scale-[0.99] text-white text-sm font-bold shadow-sm transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F2C59] focus-visible:ring-offset-2"
                >
                  {game.icon === 'trophy' ? (
                    <Trophy className="w-4 h-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <Play className="w-4 h-4 shrink-0" aria-hidden="true" />
                  )}
                  <span>{game.buttonText ?? 'Mainkan'}</span>
                </Link>
              </div>
            </GlassCard>
          );
        })}
      </section>
    </div>
  );
}
