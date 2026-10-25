'use client';

import React, { useEffect, useRef } from 'react';
import { DimensiLevel } from './MirajHero';
import {
  createMirajAudioFunctions,
  MirajArenaOverlays,
} from './MirajInteractive';
import MirajTimelineCard from './MirajTimelineCard';
import {
  VIRTUAL_WIDTH,
  VIRTUAL_HEIGHT,
  JUMP_IMPULSE,
  createInitialMirajEngineState,
  updateMirajPhysicsStep,
  drawMirajScene,
} from '@/lib/data-miraj';

export interface MirajTimelineProps {
  gameState: 'START' | 'PLAYING' | 'GAMEOVER' | 'VICTORY';
  setGameState: React.Dispatch<React.SetStateAction<'START' | 'PLAYING' | 'GAMEOVER' | 'VICTORY'>>;
  namaSantri: string;
  setNamaSantri: React.Dispatch<React.SetStateAction<string>>;
  soundEnabled: boolean;
  currentScore: number;
  setCurrentScore: React.Dispatch<React.SetStateAction<number>>;
  highScore: number;
  currentLevel: DimensiLevel;
  setCurrentLevel: React.Dispatch<React.SetStateAction<DimensiLevel>>;
  currentGelar: string;
  setCurrentGelar: React.Dispatch<React.SetStateAction<string>>;
  activeShield: boolean;
  setActiveShield: React.Dispatch<React.SetStateAction<boolean>>;
  dashTimeLeft: number;
  setDashTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  magnetTimeLeft: number;
  setMagnetTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  slowTimeLeft: number;
  setSlowTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  startGame: () => void;
  saveLeaderboardEntry: (skorAkhir: number) => void;
  setLeaderboardOpen: React.Dispatch<React.SetStateAction<boolean>>;
  audioCtxRef: React.MutableRefObject<AudioContext | null>;
  animationFrameRef: React.MutableRefObject<number | null>;
  buroqSpriteRef: React.MutableRefObject<HTMLImageElement | null>;
}

export default function MirajTimeline({
  gameState,
  setGameState,
  namaSantri,
  setNamaSantri,
  soundEnabled,
  currentScore,
  setCurrentScore,
  highScore,
  currentLevel,
  setCurrentLevel,
  currentGelar,
  setCurrentGelar,
  activeShield,
  setActiveShield,
  dashTimeLeft,
  setDashTimeLeft,
  magnetTimeLeft,
  setMagnetTimeLeft,
  slowTimeLeft,
  setSlowTimeLeft,
  startGame,
  saveLeaderboardEntry,
  setLeaderboardOpen,
  audioCtxRef,
  animationFrameRef,
  buroqSpriteRef,
}: MirajTimelineProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    playSoundFlap,
    playSoundScore,
    playSoundPowerUp,
    playSoundShieldBreak,
    playSoundCrash,
    playSoundVictory,
  } = createMirajAudioFunctions(audioCtxRef, soundEnabled);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = VIRTUAL_WIDTH;
    canvas.height = VIRTUAL_HEIGHT;

    const state = createInitialMirajEngineState();

    const triggerFlap = () => {
      if (state.isGameOver || state.isVictory) return;
      state.bird.vy = JUMP_IMPULSE;
      playSoundFlap();

      for (let i = 0; i < 7; i++) {
        state.particles.push({
          x: state.bird.x - 10 + Math.random() * 20,
          y: state.bird.y + 25 + Math.random() * 10,
          vx: -2 - Math.random() * 2,
          vy: 1 + Math.random() * 2,
          size: 3 + Math.random() * 3,
          color: Math.random() > 0.4 ? '#F59E0B' : '#FCD34D',
          alpha: 0.9,
          decay: 0.03,
          type: 'SPARK',
        });
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        triggerFlap();
      }
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      triggerFlap();
    };

    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('touchstart', handlePointerDown, { passive: false });

    const engineLoop = () => {
      if (gameState === 'PLAYING') {
        updateMirajPhysicsStep(state, {
          setDashTimeLeft,
          setMagnetTimeLeft,
          setSlowTimeLeft,
          setActiveShield,
          setGameState,
          setCurrentScore,
          setCurrentLevel,
          setCurrentGelar,
          saveLeaderboardEntry,
          playSoundScore,
          playSoundPowerUp,
          playSoundShieldBreak,
          playSoundCrash,
          playSoundVictory,
        });
        drawMirajScene(ctx, state, currentLevel, buroqSpriteRef.current);
        animationFrameRef.current = requestAnimationFrame(engineLoop);
      }
    };

    animationFrameRef.current = requestAnimationFrame(engineLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('mousedown', handlePointerDown);
      canvas.removeEventListener('touchstart', handlePointerDown);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, namaSantri]);

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-6 relative overflow-hidden">
      <div className="relative w-full max-w-4xl h-[78vh] sm:h-auto sm:aspect-[4/3] max-h-[85vh] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-2 sm:border-4 border-[#8C6A47]/60 bg-black flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain cursor-pointer touch-none"
        />

        <MirajTimelineCard
          gameState={gameState}
          setGameState={setGameState}
          currentLevel={currentLevel}
          currentGelar={currentGelar}
          activeShield={activeShield}
          dashTimeLeft={dashTimeLeft}
          magnetTimeLeft={magnetTimeLeft}
          slowTimeLeft={slowTimeLeft}
          highScore={highScore}
        />

        <MirajArenaOverlays
          gameState={gameState}
          namaSantri={namaSantri}
          setNamaSantri={setNamaSantri}
          startGame={startGame}
          currentScore={currentScore}
          currentGelar={currentGelar}
          setLeaderboardOpen={setLeaderboardOpen}
        />
      </div>

      {/* Ringkasan Kontrol di Bawah Arena */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
        <div className="flex items-center space-x-1.5">
          <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[11px] border border-slate-700">
            Spasi
          </span>
          <span>atau</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[11px] border border-slate-700">
            Klik / Tap
          </span>
          <span>: Sayap Buroq Mengepak</span>
        </div>
        <div className="flex items-center space-x-2 text-[11px]">
          <span>🛡️ Tameng</span>
          <span>⚡ Kilat Dash</span>
          <span>📿 Magnet Tasbih</span>
          <span>💧 Air Kautsar</span>
        </div>
      </div>
    </main>
  );
}
