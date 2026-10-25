'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Trophy,
  Info,
} from 'lucide-react';

// --- TIPE DATA & ENUMS GAME ---
export type DimensiLevel = 'DUNIA' | 'AKHIRAT' | 'SURGA';

export type PowerUpType = 'SHIELD' | 'DASH' | 'MAGNET' | 'SLOW';

export interface PowerUpItem {
  x: number;
  y: number;
  type: PowerUpType;
  collected: boolean;
  pulseAngle: number;
}

export interface PahalaStar {
  x: number;
  y: number;
  collected: boolean;
  angle: number;
}

export interface ObstaclePillar {
  x: number;
  topHeight: number;
  bottomHeight: number;
  gap: number;
  passed: boolean;
  baseY: number; // Untuk gerakan vertikal naik turun
  moveOffset: number;
  moveSpeed: number;
  rotation: number;
  dimensi: DimensiLevel;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  type?: 'SPARK' | 'FLAME' | 'SMOKE' | 'CONFETTI' | 'DROPLET';
}

export interface LeaderboardEntry {
  rank?: number;
  nama: string;
  gelar: string;
  skor: number;
  tanggal: string;
}

export const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [];

// --- HELPER GELAR BERDASARKAN SKOR ---
export const getGelarByScore = (skor: number): string => {
  if (skor >= 1000) return "👑 Khatimatul Maqam Al-A'la";
  if (skor >= 500) return 'Sayyidatul Firdaus';
  if (skor >= 101) return 'Khadimah Roudhoh';
  if (skor >= 31) return 'Mujahidah Hisab';
  return 'Musafirah Dunia';
};

export interface MirajHeroProps {
  gameState: 'START' | 'PLAYING' | 'GAMEOVER' | 'VICTORY';
  soundEnabled: boolean;
  setSoundEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setLeaderboardOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setPanduanOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function MirajHero({
  gameState,
  soundEnabled,
  setSoundEnabled,
  setLeaderboardOpen,
  setPanduanOpen,
}: MirajHeroProps) {
  return (
    <header
      className={`h-16 px-4 sm:px-8 border-b border-slate-700/60 bg-slate-900/80 backdrop-blur-md items-center justify-between z-30 transition-all ${
        gameState === 'PLAYING' ? 'hidden' : 'flex'
      }`}
    >
      <div className="flex items-center space-x-3">
        <Link
          href="/"
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Portal</span>
        </Link>
        <div className="hidden sm:block h-5 w-px bg-slate-700" />
        <div className="hidden sm:flex items-center space-x-2">
          <span className="text-amber-400 font-serif font-black text-sm tracking-wide">
            Mi&apos;raj Journey: Penunggang Buroq
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Tombol Papan Peringkat */}
        <button
          onClick={() => setLeaderboardOpen(true)}
          className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center space-x-1.5 transition-colors"
          title="Papan Peringkat Santriwati"
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Peringkat</span>
        </button>

        {/* Tombol Panduan */}
        <button
          onClick={() => setPanduanOpen(true)}
          className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          title="Panduan Dimensi & Kekuatan"
        >
          <Info className="w-4 h-4 text-sky-400" />
          <span className="hidden sm:inline">Panduan</span>
        </button>

        {/* Tombol Audio Mute/Unmute */}
        <button
          onClick={() => setSoundEnabled((prev) => !prev)}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          title={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-rose-400" />
          )}
        </button>
      </div>
    </header>
  );
}
