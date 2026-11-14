'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { JudgementCounts } from '../_hooks/useGameEngine';
import { getTopScores, LeaderboardEntry, saveScore } from '../_lib/db';
import { PALETTE } from '../_lib/palette';

interface SummaryScreenProps {
  score: number;
  height: number;
  longestCombo: number;
  judgementCounts: JudgementCounts;
  onPlayAgain: () => void;
}

export default function SummaryScreen({
  score,
  height,
  longestCombo,
  judgementCounts,
  onPlayAgain,
}: SummaryScreenProps) {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [topScores, setTopScores] = useState<LeaderboardEntry[]>([]);
  const [loadingTop, setLoadingTop] = useState<boolean>(true);

  const fetchTopFive = useCallback(async () => {
    setLoadingTop(true);
    try {
      const list = await getTopScores(5);
      setTopScores(list);
    } finally {
      setLoadingTop(false);
    }
  }, []);

  useEffect(() => {
    fetchTopFive();
  }, [fetchTopFive]);

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saveStatus === 'saving' || saveStatus === 'saved') return;

    const trimmed = playerName.trim();
    if (!trimmed) {
      setSaveStatus('error');
      setErrorMessage('Nama wajib diisi sebelum menyimpan skor.');
      return;
    }

    setSaveStatus('saving');
    setErrorMessage('');
    const result = await saveScore(trimmed, score, height);
    if (result.ok) {
      setSaveStatus('saved');
      await fetchTopFive();
    } else {
      setSaveStatus('error');
      setErrorMessage(result.error || 'Gagal menyimpan skor.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto select-none"
      style={{
        background: PALETTE.sky[0],
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-cover bg-center bg-no-repeat opacity-35 mix-blend-luminosity"
        style={{
          backgroundImage: "url('/images/panggung-aula.jpg')",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(7, 20, 43, 0.65) 0%, rgba(15, 44, 89, 0.45) 55%, rgba(7, 20, 43, 0.80) 100%)',
        }}
      />

      <div
        className="absolute left-3 sm:left-6 top-0 z-20"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <button
          type="button"
          aria-label="Keluar ke Lobby Hiburan"
          title="Keluar ke Lobby Hiburan"
          onClick={() => router.push('/admin/hiburan')}
          className="flex items-center justify-center min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-sm font-black transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C56B] cursor-pointer shadow-md"
        >
          X
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative z-10 my-auto w-full max-w-md rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-5 sm:p-6 text-white shadow-2xl"
      >
        <div className="text-center">
          <p
            className="text-xs font-bold tracking-wider uppercase"
            style={{ color: PALETTE.accentJayyid }}
          >
            Laporan Pembangunan Menara
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-serif font-black tracking-tight text-white">
            Pembangunan Selesai
          </h1>
        </div>

        <div className="mt-3 rounded-xl bg-white/10 border border-white/20 p-3.5 text-center">
          <span
            className="text-xs font-bold tracking-wide"
            style={{ color: PALETTE.accentJayyid }}
          >
            Skor Akhir
          </span>
          <div className="mt-0.5 text-3xl sm:text-4xl font-black tabular-nums tracking-tight text-white">
            {score.toLocaleString('id-ID')}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <div className="rounded-xl bg-white/10 border border-white/20 p-2.5 text-center">
            <span
              className="text-xs font-semibold"
              style={{ color: PALETTE.accentJayyid }}
            >
              Tinggi Menara
            </span>
            <p className="mt-0.5 text-lg sm:text-xl font-extrabold tabular-nums text-white">
              {height} Lantai
            </p>
          </div>

          <div className="rounded-xl bg-white/10 border border-white/20 p-2.5 text-center">
            <span
              className="text-xs font-semibold"
              style={{ color: PALETTE.accentJayyid }}
            >
              Kombo Terpanjang
            </span>
            <p className="mt-0.5 text-lg sm:text-xl font-extrabold tabular-nums text-white">
              {longestCombo}x
            </p>
          </div>
        </div>

        <div className="mt-3">
          <h2
            className="text-xs font-bold tracking-wide mb-1.5"
            style={{ color: PALETTE.accentJayyid }}
          >
            Rincian Ketepatan Blok
          </h2>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-white/10 border border-white/20 p-2 text-center">
              <span
                className="block text-xs font-bold"
                style={{ color: PALETTE.accentJayyid }}
              >
                Jayyid
              </span>
              <span className="mt-0.5 block text-lg font-black tabular-nums text-white">
                {judgementCounts.jayyid}
              </span>
            </div>

            <div className="rounded-xl bg-white/10 border border-white/20 p-2 text-center">
              <span className="block text-xs font-bold text-white">
                Mutawasith
              </span>
              <span className="mt-0.5 block text-lg font-black tabular-nums text-white">
                {judgementCounts.mutawasith}
              </span>
            </div>

            <div className="rounded-xl bg-white/10 border border-white/20 p-2 text-center">
              <span
                className="block text-xs font-bold"
                style={{ color: PALETTE.accentRodi }}
              >
                {"Rodi'"}
              </span>
              <span className="mt-0.5 block text-lg font-black tabular-nums text-white">
                {judgementCounts.rodi}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveScore} className="mt-4 space-y-2">
          <label
            htmlFor="leaderboard-player-name"
            className="block text-xs font-bold tracking-wide"
            style={{ color: PALETTE.accentJayyid }}
          >
            Masukkan Nama Anda
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="leaderboard-player-name"
              type="text"
              required
              maxLength={20}
              disabled={saveStatus === 'saving' || saveStatus === 'saved'}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Masukkan Nama Anda"
              className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl bg-white/10 border border-white/25 text-white placeholder:text-white/55 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#F5C56B] disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={saveStatus === 'saving' || saveStatus === 'saved'}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:bg-emerald-700/80 border border-white/25 text-white text-sm font-extrabold tracking-wide transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C56B] cursor-pointer shadow-sm shrink-0"
            >
              {saveStatus === 'saving'
                ? 'Menyimpan...'
                : saveStatus === 'saved'
                  ? 'Tersimpan ✅'
                  : 'Simpan Skor'}
            </button>
          </div>
          {errorMessage && (
            <p className="text-xs font-semibold text-rose-300">{errorMessage}</p>
          )}
        </form>

        <div className="mt-4 rounded-xl bg-white/10 border border-white/20 p-3">
          <div className="flex items-center justify-between mb-2">
            <h3
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: PALETTE.accentJayyid }}
            >
              Top 5 Skor Panitia
            </h3>
            <button
              type="button"
              onClick={() =>
                router.push('/admin/hiburan/bangun-kota/leaderboard')
              }
              className="text-xs font-bold text-[#F5C56B] hover:underline cursor-pointer"
            >
              Lihat Papan Skor
            </button>
          </div>

          {loadingTop ? (
            <p className="text-xs text-white/80 py-2 text-center">
              Memuat papan skor...
            </p>
          ) : topScores.length === 0 ? (
            <p className="text-xs text-white/80 py-2 text-center">
              Belum ada skor tercatat. Jadilah yang pertama!
            </p>
          ) : (
            <div className="space-y-1.5">
              {topScores.map((entry, idx) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-5 text-center font-black tabular-nums"
                      style={{ color: PALETTE.accentJayyid }}
                    >
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-white truncate">
                      {entry.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 tabular-nums">
                    <span className="text-white/80">{entry.floor} Lt</span>
                    <span
                      className="font-black"
                      style={{ color: PALETTE.accentJayyid }}
                    >
                      {entry.score.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={onPlayAgain}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] border border-white/25 text-white text-sm font-extrabold tracking-wide transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C56B] cursor-pointer shadow-md"
          >
            Main Lagi
          </button>

          <button
            type="button"
            onClick={() => router.push('/admin/hiburan')}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white text-sm font-extrabold tracking-wide transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C56B] cursor-pointer shadow-sm"
          >
            Kembali ke Lobby
          </button>
        </div>
      </motion.div>
    </div>
  );
}
