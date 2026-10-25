'use client';

import React from 'react';
import {
  Trophy,
  RotateCcw,
  Info,
  Play,
} from 'lucide-react';
import { LeaderboardEntry } from './MirajHero';

// --- AUDIO SYNTHESIZER BEBAS DEPENDENCY ---
export function createMirajAudioFunctions(
  audioCtxRef: React.MutableRefObject<AudioContext | null>,
  soundEnabled: boolean
) {
  const getAudioContext = () => {
    if (!soundEnabled) return null;
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playSoundFlap = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  };

  const playSoundScore = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
      gain.gain.setValueAtTime(0.12, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.25);
    });
  };

  const playSoundPowerUp = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [440, 554.37, 659.25, 880].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.15, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.3);
    });
  };

  const playSoundShieldBreak = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.25);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(now + 0.25);
  };

  const playSoundCrash = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(now + 0.4);
  };

  const playSoundVictory = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      gain.gain.setValueAtTime(0.2, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.8);
    });
  };

  return {
    playSoundFlap,
    playSoundScore,
    playSoundPowerUp,
    playSoundShieldBreak,
    playSoundCrash,
    playSoundVictory,
  };
}

export interface MirajInteractiveOverlayProps {
  gameState: 'START' | 'PLAYING' | 'GAMEOVER' | 'VICTORY';
  namaSantri: string;
  setNamaSantri: React.Dispatch<React.SetStateAction<string>>;
  startGame: () => void;
  currentScore: number;
  currentGelar: string;
  setLeaderboardOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function MirajArenaOverlays({
  gameState,
  namaSantri,
  setNamaSantri,
  startGame,
  currentScore,
  currentGelar,
  setLeaderboardOpen,
}: MirajInteractiveOverlayProps) {
  return (
    <>
      {/* OVERLAY: LAYAR AWAL (START SCREEN) */}
      {gameState === 'START' && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-slate-900/90 to-black/95 backdrop-blur-md flex flex-col items-center justify-start sm:justify-center p-4 sm:p-6 text-center z-20 space-y-3 sm:space-y-4 overflow-y-auto max-h-full">
          {/* Animasi Preview Karakter Murni Halus (Tidak Menabrak Atas) */}
          <div className="relative w-20 h-20 sm:w-28 sm:h-28 mt-1 sm:mt-0 animate-pulse duration-1000 flex-shrink-0">
            <img
              src="/images/game/santriwati-buroq-pure.png"
              alt="Santriwati Penunggang Buroq"
              className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(245,158,11,0.4)]"
            />
          </div>

          <div className="flex-shrink-0">
            <span className="inline-block px-3 py-0.5 sm:py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-1">
              Game Arkade Santriwati
            </span>
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-300 tracking-wide leading-tight">
              Mi&apos;raj Journey: Penunggang Buroq
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-300 max-w-md mx-auto mt-0.5 sm:mt-1 leading-relaxed">
              Kendalikan santriwati menunggangi Buroq bersayap emas melintasi 3 dimensi spiritual hingga Sidratul Muntaha.
            </p>
          </div>

          {/* Form Input Nama Santriwati */}
          <div className="w-full max-w-xs space-y-1 text-left flex-shrink-0">
            <label className="block text-[11px] font-bold text-slate-300">
              Nama Santriwati Penunggang Buroq:
            </label>
            <input
              type="text"
              value={namaSantri}
              onChange={(e) => setNamaSantri(e.target.value)}
              placeholder="Masukkan nama santriwati..."
              maxLength={24}
              className="w-full px-3 py-2 sm:py-2.5 rounded-xl bg-slate-800/90 border-2 border-amber-500/60 text-white font-semibold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 uppercase text-center placeholder:text-slate-500"
            />
          </div>

          {/* Tombol Mulai */}
          <button
            type="button"
            onClick={startGame}
            className="w-full max-w-xs py-3 sm:py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm sm:text-base tracking-wider shadow-lg shadow-amber-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 border border-yellow-200 cursor-pointer flex-shrink-0 mb-1"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>MULAI SAFAR (BISMILLAH)</span>
          </button>

          <div className="flex items-center space-x-4 text-[11px] text-slate-400 pb-2 flex-shrink-0">
            <span>
              ⌨️ Tekan <strong className="text-amber-300">Spasi</strong> / Klik / Tap Layar untuk Terbang
            </span>
          </div>
        </div>
      )}

      {/* OVERLAY: GAME OVER MODAL */}
      {gameState === 'GAMEOVER' && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-start sm:justify-center p-4 sm:p-6 text-center z-20 space-y-3 sm:space-y-4 animate-fade-in overflow-y-auto max-h-full">
          {/* Animasi Santriwati Sedih Mengelus Buroq */}
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border-2 border-amber-500/40 bg-slate-900/70 p-1 flex items-center justify-center shadow-lg shadow-amber-500/20 animate-pulse flex-shrink-0 mt-2 sm:mt-0">
            <img
              src="/images/game/santriwati-sedih-elus-buroq.png"
              alt="Santriwati Sedih Mengelus Buroq"
              className="w-full h-full object-contain filter drop-shadow-md"
            />
          </div>

          <div className="flex-shrink-0">
            <h2 className="text-xl sm:text-3xl font-serif font-black text-rose-400 tracking-wide">
              Perjalanan Terhenti
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-1">
              Alhamdulillah atas pencapaian safar yang telah dilalui
            </p>
          </div>

          {/* Rekap Nilai & Gelar */}
          <div className="w-full max-w-xs bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3.5 space-y-2 flex-shrink-0">
            <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-1.5">
              <span>Nama Musafirah:</span>
              <strong className="text-white uppercase">{namaSantri}</strong>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-1.5">
              <span>Skor Akhir:</span>
              <span className="text-lg font-black text-amber-400">{currentScore}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Gelar Kehormatan:</span>
              <span className="font-bold text-emerald-400 text-right">{currentGelar}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full max-w-xs pt-1 flex-shrink-0 pb-2">
            <button
              type="button"
              onClick={startGame}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm tracking-wide flex items-center justify-center space-x-2 transition-transform active:scale-95 shadow-md shadow-amber-500/20"
            >
              <RotateCcw className="w-4 h-4" />
              <span>SAFAR LAGI</span>
            </button>
            <button
              type="button"
              onClick={() => setLeaderboardOpen(true)}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>LIHAT PERINGKAT</span>
            </button>
          </div>
        </div>
      )}

      {/* OVERLAY: VICTORY SCREEN (TAMAT SKOR 1000) */}
      {gameState === 'VICTORY' && (
        <div className="absolute inset-0 bg-gradient-to-b from-amber-950/90 via-yellow-950/90 to-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 space-y-4 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-amber-400/20 border-2 border-amber-300 flex items-center justify-center text-4xl animate-bounce">
            👑
          </div>

          <div>
            <span className="px-3 py-1 rounded-full bg-amber-400/30 text-amber-200 border border-amber-300 text-xs font-black uppercase tracking-widest">
              VICTORY ACHIEVED!
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-black text-yellow-300 tracking-wide mt-1">
              Mencapai Puncak Sidratul Muntaha!
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 max-w-md mx-auto mt-1 leading-relaxed">
              Subhanallah! Seluruh rintangan 3 dimensi berhasil dilewati sempurna dengan total 1000 poin tertinggi.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-center w-full max-w-xs">
            <span className="text-xs text-amber-200 block">Gelar Kemuliaan Tertinggi:</span>
            <strong className="text-base sm:text-lg font-serif font-black text-yellow-300 block mt-0.5">
              👑 Khatimatul Maqam Al-A&apos;la
            </strong>
            <span className="text-[11px] text-amber-100/80 mt-1 block">
              Dianugerahkan kepada: <span className="font-bold text-white uppercase">{namaSantri}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={startGame}
            className="w-full max-w-xs py-3.5 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 text-slate-950 font-black text-sm tracking-wider shadow-xl shadow-yellow-500/30 hover:scale-105 active:scale-95 transition-all"
          >
            MULAI PERJALANAN LAGI
          </button>
        </div>
      )}
    </>
  );
}

export interface MirajInteractiveProps {
  leaderboardOpen: boolean;
  setLeaderboardOpen: React.Dispatch<React.SetStateAction<boolean>>;
  panduanOpen: boolean;
  setPanduanOpen: React.Dispatch<React.SetStateAction<boolean>>;
  leaderboard: LeaderboardEntry[];
}

export default function MirajInteractive({
  leaderboardOpen,
  setLeaderboardOpen,
  panduanOpen,
  setPanduanOpen,
  leaderboard,
}: MirajInteractiveProps) {
  return (
    <>
      {/* MODAL 1: PAPAN PERINGKAT TOP 10 */}
      {leaderboardOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-fade-in text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Trophy className="w-6 h-6 text-amber-400" />
                <h3 className="font-serif font-black text-lg text-amber-300">
                  Papan Peringkat Santriwati (Top 10)
                </h3>
              </div>
              <button
                onClick={() => setLeaderboardOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="py-2 px-2 text-center w-10">No</th>
                    <th className="py-2 px-3">Nama Santriwati</th>
                    <th className="py-2 px-3">Gelar Tertinggi</th>
                    <th className="py-2 px-3 text-right">Skor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {leaderboard.map((item, idx) => (
                    <tr
                      key={idx}
                      className={idx === 0 ? 'bg-amber-500/10 font-bold text-amber-200' : 'text-slate-300'}
                    >
                      <td className="py-2.5 px-2 text-center font-bold">
                        {idx === 0 ? '👑 1' : idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-semibold uppercase">{item.nama}</td>
                      <td className="py-2.5 px-3 text-[11px] text-emerald-400">{item.gelar}</td>
                      <td className="py-2.5 px-3 text-right font-black text-amber-400">{item.skor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setLeaderboardOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PANDUAN TIGA DIMENSI & POWER-UP */}
      {panduanOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-fade-in text-white max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Info className="w-5 h-5 text-sky-400" />
                <h3 className="font-serif font-black text-lg text-slate-200">
                  Panduan Perjalanan Spiritual &amp; Kekuatan
                </h3>
              </div>
              <button
                onClick={() => setPanduanOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-slate-300">
              <div>
                <h4 className="font-bold text-amber-400 text-sm mb-1">1. Tiga Dimensi Safar:</h4>
                <ul className="space-y-1.5 list-disc pl-4">
                  <li>
                    <strong className="text-amber-300">Level 1: Dunia (Skor 1–30):</strong> Suasana bukit senja asri. Rintangan pilar batu reruntuhan statis dengan celah sangat lebar (160 px).
                  </li>
                  <li>
                    <strong className="text-rose-400">Level 2: Akhirat (Skor 31–100):</strong> Langit merah pekat temaram &amp; jembatan hisab. Rintangan pilar obsidian hitam berduri yang bergerak naik-turun perlahan (celah 135 px).
                  </li>
                  <li>
                    <strong className="text-yellow-300">Level 3: Surga (Skor 101–1000):</strong> Alam cahaya Sidratul Muntaha. Celah kembali diperlebar menjadi 155 px (flow state) dan tingkat kesulitan naik bertahap hingga tamat di skor 1000.
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-sky-400 text-sm mb-1">2. Empat Macam Power-Up:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                    <strong className="text-amber-400 block">🛡️ Tameng Bismillah</strong>
                    <span className="text-[11px] text-slate-400">
                      Menahan 1 benturan tabrakan dan menghancurkan pilar jadi serpihan cahaya.
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                    <strong className="text-sky-400 block">⚡ Kilat Buroq</strong>
                    <span className="text-[11px] text-slate-400">
                      Melesat kencang otomatis menembus semua rintangan selama 3 detik tanpa takut benturan.
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                    <strong className="text-emerald-400 block">📿 Magnet Tasbih</strong>
                    <span className="text-[11px] text-slate-400">
                      Menarik seluruh butiran cahaya pahala di sekitar selama 6 detik secara otomatis.
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                    <strong className="text-cyan-400 block">💧 Air Kautsar</strong>
                    <span className="text-[11px] text-slate-400">
                      Memperlambat gerakan 30% dan merampingkan hitbox santriwati selama 5 detik.
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-emerald-400 text-sm mb-1">3. Tingkatan Gelar Santriwati:</h4>
                <ul className="space-y-1 list-disc pl-4 text-[11px]">
                  <li>
                    Skor 1 – 30: <strong>Musafirah Dunia</strong>
                  </li>
                  <li>
                    Skor 31 – 100: <strong>Mujahidah Hisab</strong>
                  </li>
                  <li>
                    Skor 101 – 499: <strong>Khadimah Roudhoh</strong>
                  </li>
                  <li>
                    Skor 500 – 999: <strong>Sayyidatul Firdaus</strong>
                  </li>
                  <li>
                    Skor 1000: <strong>👑 Khatimatul Maqam Al-A&apos;la (Puncak Tertinggi)</strong>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setPanduanOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
              >
                Saya Paham, Siap Safar!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
