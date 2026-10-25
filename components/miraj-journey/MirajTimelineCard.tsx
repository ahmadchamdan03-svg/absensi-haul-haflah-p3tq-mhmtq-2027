'use client';

import React from 'react';
import { Shield, Zap } from 'lucide-react';
import { DimensiLevel } from './MirajHero';
import { MIRAJ_DIMENSIONS_DATA } from '@/lib/data-miraj';

export interface MirajTimelineCardProps {
  gameState: 'START' | 'PLAYING' | 'GAMEOVER' | 'VICTORY';
  setGameState: React.Dispatch<React.SetStateAction<'START' | 'PLAYING' | 'GAMEOVER' | 'VICTORY'>>;
  currentLevel: DimensiLevel;
  currentGelar: string;
  activeShield: boolean;
  dashTimeLeft: number;
  magnetTimeLeft: number;
  slowTimeLeft: number;
  highScore: number;
}

export default function MirajTimelineCard({
  gameState,
  setGameState,
  currentLevel,
  currentGelar,
  activeShield,
  dashTimeLeft,
  magnetTimeLeft,
  slowTimeLeft,
  highScore,
}: MirajTimelineCardProps) {
  if (gameState !== 'PLAYING') return null;

  const activeDimInfo =
    MIRAJ_DIMENSIONS_DATA.find((d) => d.id === currentLevel) || MIRAJ_DIMENSIONS_DATA[0];

  return (
    <div className="absolute top-3 inset-x-3 sm:inset-x-6 flex items-start justify-between pointer-events-none z-10">
      {/* Badge Dimensi & Gelar */}
      <div className="flex flex-col space-y-1">
        <div className="flex items-center space-x-2">
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-black tracking-wider uppercase border shadow-sm ${activeDimInfo.warnaBadge}`}
          >
            Dimensi: {currentLevel}
          </span>
          <span className="text-[11px] font-bold text-slate-300 bg-black/50 px-2.5 py-1 rounded-full border border-slate-700 backdrop-blur-xs">
            {currentGelar}
          </span>
        </div>

        {/* Status Power-Up Aktif */}
        <div className="flex items-center space-x-1.5 pt-1">
          {activeShield && (
            <div className="px-2 py-0.5 rounded-md bg-amber-500/80 text-amber-950 text-[10px] font-black flex items-center space-x-1 border border-amber-300">
              <Shield className="w-3 h-3" />
              <span>Tameng Bismillah</span>
            </div>
          )}
          {dashTimeLeft > 0 && (
            <div className="px-2 py-0.5 rounded-md bg-sky-500/80 text-sky-950 text-[10px] font-black flex items-center space-x-1 border border-sky-300 animate-pulse">
              <Zap className="w-3 h-3" />
              <span>Kilat: {dashTimeLeft}s</span>
            </div>
          )}
          {magnetTimeLeft > 0 && (
            <div className="px-2 py-0.5 rounded-md bg-emerald-500/80 text-emerald-950 text-[10px] font-black flex items-center space-x-1 border border-emerald-300">
              <span>📿 Tasbih: {magnetTimeLeft}s</span>
            </div>
          )}
          {slowTimeLeft > 0 && (
            <div className="px-2 py-0.5 rounded-md bg-cyan-500/80 text-cyan-950 text-[10px] font-black flex items-center space-x-1 border border-cyan-300">
              <span>💧 Kautsar: {slowTimeLeft}s</span>
            </div>
          )}
        </div>
      </div>

      {/* High Score & Tombol Kontrol Saat Bermain */}
      <div className="text-right flex items-center space-x-2">
        <div className="text-xs font-semibold text-slate-300 bg-black/60 px-3 py-1 rounded-full border border-slate-700 backdrop-blur-xs">
          Rekor: <strong className="text-amber-400">{highScore}</strong>
        </div>
        <button
          type="button"
          onClick={() => setGameState('START')}
          className="pointer-events-auto px-2.5 py-1 rounded-full bg-black/60 hover:bg-rose-950/80 text-slate-300 hover:text-rose-300 border border-slate-700 text-[11px] font-bold transition-colors flex items-center space-x-1 cursor-pointer"
          title="Kembali ke Menu Game"
        >
          <span>✕ Keluar</span>
        </button>
      </div>
    </div>
  );
}
