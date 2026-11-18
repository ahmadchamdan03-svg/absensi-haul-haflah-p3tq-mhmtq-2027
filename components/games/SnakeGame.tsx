'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Flag,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Worm,
} from 'lucide-react';
import {
  initSnakeAudio,
  playCutSlash,
  playEatPop,
  playSurrenderChime,
} from '@/lib/games/snake-audio';

interface Point {
  x: number;
  y: number;
}

interface FadingCutGroup {
  id: number;
  segments: Point[];
  createdAt: number;
  durationMs: number;
}

interface CutFeedbackBanner {
  id: number;
  lostSegments: number;
  oldScore: number;
  newScore: number;
}

const GRID_SIZE = 20;
const BASE_STEP_MS = 115;
const MIN_STEP_MS = 48;
const FRUITS_PER_SPEED_UP = 100;
const STEP_DECREASE_PER_100 = 12;
const FADE_DURATION_MS = 650;
const SWIPE_THRESHOLD_PX = 24;

const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];

const INITIAL_DIRECTION: Point = { x: 1, y: 0 };

function createRandomFruit(snakeBody: Point[]): Point {
  const occupied = new Set(snakeBody.map((seg) => `${seg.x},${seg.y}`));
  const available: Point[] = [];

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!occupied.has(`${x},${y}`)) {
        available.push({ x, y });
      }
    }
  }

  if (available.length === 0) {
    return { x: 0, y: 0 };
  }

  const randomIndex = Math.floor(Math.random() * available.length);
  return available[randomIndex];
}

export default function SnakeGame() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const boardTouchRef = useRef<HTMLDivElement | null>(null);

  const snakeRef = useRef<Point[]>(INITIAL_SNAKE.map((p) => ({ ...p })));
  const directionRef = useRef<Point>({ ...INITIAL_DIRECTION });
  const dirQueueRef = useRef<Point[]>([]);
  const fruitRef = useRef<Point>({ x: 15, y: 10 });
  const fadingCutsRef = useRef<FadingCutGroup[]>([]);

  const scoreRef = useRef<number>(0);
  const peakScoreRef = useRef<number>(0);
  const fruitsEatenRef = useRef<number>(0);
  const cutCountRef = useRef<number>(0);
  const soundEnabledRef = useRef<boolean>(true);
  const isPausedRef = useRef<boolean>(false);
  const isSurrenderedRef = useRef<boolean>(false);

  const [mounted, setMounted] = useState<boolean>(false);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [peakScore, setPeakScore] = useState<number>(0);
  const [snakeLength, setSnakeLength] = useState<number>(INITIAL_SNAKE.length);
  const [fruitsEaten, setFruitsEaten] = useState<number>(0);
  const [cutCount, setCutCount] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isSurrendered, setIsSurrendered] = useState<boolean>(false);
  const [cutBanner, setCutBanner] = useState<CutFeedbackBanner | null>(null);

  const speedLevel = 1 + Math.floor(fruitsEaten / FRUITS_PER_SPEED_UP);

  const tryEnterBrowserFullscreen = useCallback(() => {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }, []);

  const toggleBrowserFullscreen = useCallback(() => {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  const handleExitToLobby = useCallback(() => {
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    if (typeof window !== 'undefined' && window.opener) {
      window.close();
      return;
    }
    router.push('/admin/hiburan');
  }, [router]);

  const enqueueDirection = useCallback((nextDir: Point) => {
    if (isPausedRef.current || isSurrenderedRef.current) return;
    initSnakeAudio();

    const queue = dirQueueRef.current;
    const referenceDir =
      queue.length > 0 ? queue[queue.length - 1] : directionRef.current;

    const isOpposite =
      nextDir.x + referenceDir.x === 0 && nextDir.y + referenceDir.y === 0;
    const isSame =
      nextDir.x === referenceDir.x && nextDir.y === referenceDir.y;

    if (!isOpposite && !isSame && queue.length < 2) {
      queue.push(nextDir);
    }
  }, []);

  const resetGame = useCallback(() => {
    initSnakeAudio();
    const freshSnake = INITIAL_SNAKE.map((p) => ({ ...p }));
    snakeRef.current = freshSnake;
    directionRef.current = { ...INITIAL_DIRECTION };
    dirQueueRef.current = [];
    fruitRef.current = createRandomFruit(freshSnake);
    fadingCutsRef.current = [];

    scoreRef.current = 0;
    peakScoreRef.current = 0;
    fruitsEatenRef.current = 0;
    cutCountRef.current = 0;
    isPausedRef.current = false;
    isSurrenderedRef.current = false;

    setScore(0);
    setPeakScore(0);
    setSnakeLength(freshSnake.length);
    setFruitsEaten(0);
    setCutCount(0);
    setIsPaused(false);
    setIsSurrendered(false);
    setCutBanner(null);
  }, []);

  const handleSurrender = useCallback(() => {
    if (isSurrenderedRef.current) return;
    isSurrenderedRef.current = true;
    isPausedRef.current = false;
    setIsSurrendered(true);
    setIsPaused(false);
    if (soundEnabledRef.current) {
      playSurrenderChime();
    }
  }, []);

  const togglePause = useCallback(() => {
    if (isSurrenderedRef.current) return;
    const nextPaused = !isPausedRef.current;
    isPausedRef.current = nextPaused;
    setIsPaused(nextPaused);
  }, []);

  const toggleSound = useCallback(() => {
    const nextSound = !soundEnabledRef.current;
    soundEnabledRef.current = nextSound;
    setSoundEnabled(nextSound);
    if (nextSound) {
      initSnakeAudio();
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fruitRef.current = createRandomFruit(snakeRef.current);
    document.title = 'Snake P3TQ | Pusat Hiburan Haflah';
    tryEnterBrowserFullscreen();

    const handleFullscreenChange = () => {
      setIsNativeFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [tryEnterBrowserFullscreen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSurrenderedRef.current) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          enqueueDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          enqueueDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          enqueueDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          enqueueDirection({ x: 1, y: 0 });
          break;
        case ' ':
          e.preventDefault();
          togglePause();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enqueueDirection, togglePause]);

  useEffect(() => {
    const touchEl = boardTouchRef.current;
    if (!touchEl) return;

    let startX = 0;
    let startY = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 0) return;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const dx = endX - startX;
      const dy = endY - startY;

      if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD_PX) {
        return;
      }

      if (Math.abs(dx) > Math.abs(dy)) {
        enqueueDirection(dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 });
      } else {
        enqueueDirection(dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 });
      }
    };

    touchEl.addEventListener('touchstart', onTouchStart, { passive: true });
    touchEl.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      touchEl.removeEventListener('touchstart', onTouchStart);
      touchEl.removeEventListener('touchend', onTouchEnd);
    };
  }, [enqueueDirection]);

  useEffect(() => {
    let animationFrameId = 0;
    let lastTimestamp = performance.now();
    let stepAccumulator = 0;

    const stepSnake = (now: number) => {
      const currentSnake = snakeRef.current;
      if (currentSnake.length === 0) return;

      if (dirQueueRef.current.length > 0) {
        const candidate = dirQueueRef.current.shift()!;
        const curr = directionRef.current;
        if (candidate.x + curr.x !== 0 || candidate.y + curr.y !== 0) {
          directionRef.current = candidate;
        }
      }

      const dir = directionRef.current;
      const head = currentSnake[0];

      // Wrap-around grid movement using modulus
      const nextHead: Point = {
        x: (head.x + dir.x + GRID_SIZE) % GRID_SIZE,
        y: (head.y + dir.y + GRID_SIZE) % GRID_SIZE,
      };

      const currentFruit = fruitRef.current;
      const ateFruit =
        nextHead.x === currentFruit.x && nextHead.y === currentFruit.y;

      if (ateFruit) {
        const grownSnake = [nextHead, ...currentSnake];
        snakeRef.current = grownSnake;
        fruitRef.current = createRandomFruit(grownSnake);

        const updatedScore = scoreRef.current + 10;
        const updatedFruits = fruitsEatenRef.current + 1;
        scoreRef.current = updatedScore;
        fruitsEatenRef.current = updatedFruits;

        if (updatedScore > peakScoreRef.current) {
          peakScoreRef.current = updatedScore;
          setPeakScore(updatedScore);
        }

        setScore(updatedScore);
        setFruitsEaten(updatedFruits);
        setSnakeLength(grownSnake.length);

        if (soundEnabledRef.current) {
          playEatPop();
        }
        return;
      }

      const movedSnake = [nextHead, ...currentSnake.slice(0, -1)];
      const hitIndex = movedSnake.findIndex(
        (seg, idx) => idx > 0 && seg.x === nextHead.x && seg.y === nextHead.y
      );

      if (hitIndex !== -1) {
        const panjangLama = movedSnake.length;
        // Splice severed body segments from collision point to tail
        const severedSegments = movedSnake.splice(hitIndex);
        const panjangBaru = movedSnake.length;

        const oldScore = scoreRef.current;
        const newScore = Math.floor(oldScore * (panjangBaru / panjangLama));

        snakeRef.current = movedSnake;
        scoreRef.current = newScore;
        cutCountRef.current += 1;

        fadingCutsRef.current.push({
          id: now,
          segments: severedSegments,
          createdAt: now,
          durationMs: FADE_DURATION_MS,
        });

        setScore(newScore);
        setSnakeLength(panjangBaru);
        setCutCount(cutCountRef.current);
        setCutBanner({
          id: Math.round(now),
          lostSegments: severedSegments.length,
          oldScore,
          newScore,
        });

        if (soundEnabledRef.current) {
          playCutSlash();
        }
      } else {
        snakeRef.current = movedSnake;
      }
    };

    const drawCanvas = (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      if (displayWidth === 0 || displayHeight === 0) return;

      const targetWidth = Math.round(displayWidth * dpr);
      const targetHeight = Math.round(displayHeight * dpr);
      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const cellW = displayWidth / GRID_SIZE;
      const cellH = displayHeight / GRID_SIZE;

      // Board background in Deep Royal Navy
      ctx.fillStyle = '#0B2247';
      ctx.fillRect(0, 0, displayWidth, displayHeight);

      // Subtle checkerboard cells for spatial clarity
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          if ((x + y) % 2 === 0) {
            ctx.fillStyle = 'rgba(29, 78, 216, 0.14)';
            ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
          }
        }
      }

      // Subtle grid lines
      ctx.strokeStyle = 'rgba(212, 155, 91, 0.12)';
      ctx.lineWidth = 1;
      for (let i = 1; i < GRID_SIZE; i++) {
        const posX = Math.floor(i * cellW) + 0.5;
        const posY = Math.floor(i * cellH) + 0.5;
        ctx.beginPath();
        ctx.moveTo(posX, 0);
        ctx.lineTo(posX, displayHeight);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, posY);
        ctx.lineTo(displayWidth, posY);
        ctx.stroke();
      }

      // Render fading severed segments with decreasing alpha before removal
      const activeFading: FadingCutGroup[] = [];
      for (const group of fadingCutsRef.current) {
        const elapsed = now - group.createdAt;
        if (elapsed < group.durationMs) {
          const progress = Math.max(0, Math.min(1, elapsed / group.durationMs));
          const alpha = (1 - progress) * 0.78;
          const shrink = 1 - progress * 0.28;

          ctx.save();
          ctx.globalAlpha = alpha;
          for (const seg of group.segments) {
            const padX = cellW * (0.14 + (1 - shrink) * 0.35);
            const padY = cellH * (0.14 + (1 - shrink) * 0.35);
            const rx = seg.x * cellW + padX;
            const ry = seg.y * cellH + padY;
            const rw = Math.max(2, cellW - padX * 2);
            const rh = Math.max(2, cellH - padY * 2);

            ctx.fillStyle = '#FDA4AF';
            ctx.strokeStyle = '#F5C56B';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(rx, ry, rw, rh, 5);
            ctx.fill();
            ctx.stroke();
          }
          ctx.restore();
          activeFading.push(group);
        }
      }
      fadingCutsRef.current = activeFading;

      // Draw fruit (Golden Caramel orb with subtle pulse)
      const fruit = fruitRef.current;
      const pulse = 1 + Math.sin(now * 0.006) * 0.08;
      const fruitCenterX = (fruit.x + 0.5) * cellW;
      const fruitCenterY = (fruit.y + 0.5) * cellH;
      const fruitRadius = Math.max(4, Math.min(cellW, cellH) * 0.36 * pulse);

      ctx.save();
      ctx.beginPath();
      ctx.arc(fruitCenterX, fruitCenterY, fruitRadius * 1.32, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245, 197, 107, 0.24)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(fruitCenterX, fruitCenterY, fruitRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#F5C56B';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#D49B5B';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(
        fruitCenterX - fruitRadius * 0.28,
        fruitCenterY - fruitRadius * 0.28,
        fruitRadius * 0.24,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.restore();

      // Draw snake body and head
      const snake = snakeRef.current;
      for (let i = snake.length - 1; i >= 0; i--) {
        const seg = snake[i];
        const isHead = i === 0;
        const pad = isHead ? cellW * 0.06 : cellW * 0.11;
        const x = seg.x * cellW + pad;
        const y = seg.y * cellH + pad;
        const w = Math.max(4, cellW - pad * 2);
        const h = Math.max(4, cellH - pad * 2);
        const radius = isHead ? 7 : 5;

        ctx.beginPath();
        ctx.roundRect(x, y, w, h, radius);

        if (isHead) {
          ctx.fillStyle = '#F5C56B';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#D49B5B';
          ctx.stroke();

          // Directional eyes on the head
          const dir = directionRef.current;
          const centerX = seg.x * cellW + cellW * 0.5;
          const centerY = seg.y * cellH + cellH * 0.5;
          const eyeOffsetForward = cellW * 0.16;
          const eyeOffsetSide = cellW * 0.18;
          const perpX = -dir.y;
          const perpY = dir.x;

          const eye1X =
            centerX + dir.x * eyeOffsetForward + perpX * eyeOffsetSide;
          const eye1Y =
            centerY + dir.y * eyeOffsetForward + perpY * eyeOffsetSide;
          const eye2X =
            centerX + dir.x * eyeOffsetForward - perpX * eyeOffsetSide;
          const eye2Y =
            centerY + dir.y * eyeOffsetForward - perpY * eyeOffsetSide;
          const eyeRadius = Math.max(1.8, cellW * 0.085);

          ctx.fillStyle = '#0F2C59';
          ctx.beginPath();
          ctx.arc(eye1X, eye1Y, eyeRadius, 0, Math.PI * 2);
          ctx.arc(eye2X, eye2Y, eyeRadius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const isEven = i % 2 === 0;
          ctx.fillStyle = isEven ? '#38BDF8' : '#60A5FA';
          ctx.fill();
          ctx.lineWidth = 1.25;
          ctx.strokeStyle = '#0F2C59';
          ctx.stroke();
        }
      }

      ctx.restore();
    };

    const loop = (now: number) => {
      const delta = Math.min(100, now - lastTimestamp);
      lastTimestamp = now;

      if (!isPausedRef.current && !isSurrenderedRef.current) {
        stepAccumulator += delta;
        const speedTier = Math.floor(
          fruitsEatenRef.current / FRUITS_PER_SPEED_UP
        );
        const currentStepMs = Math.max(
          MIN_STEP_MS,
          BASE_STEP_MS - speedTier * STEP_DECREASE_PER_100
        );

        while (stepAccumulator >= currentStepMs) {
          stepAccumulator -= currentStepMs;
          stepSnake(now);
        }
      }

      drawCanvas(now);
      animationFrameId = window.requestAnimationFrame(loop);
    };

    animationFrameId = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, []);

  useEffect(() => {
    if (!cutBanner) return;
    const timer = window.setTimeout(() => {
      setCutBanner(null);
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [cutBanner]);

  const gameLayer = (
    <div
      ref={boardTouchRef}
      className="fixed inset-0 z-[9999] w-full h-[100dvh] bg-[#07142B] overflow-hidden touch-none select-none flex flex-col justify-between"
      style={{
        background:
          'linear-gradient(180deg, #07142B 0%, #0F2C59 52%, #07142B 100%)',
      }}
    >
      {/* Fullscreen Top Header & HUD */}
      <header
        className="relative z-20 w-full px-3 sm:px-6 pb-2"
        style={{
          paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
        }}
      >
        <div className="max-w-6xl mx-auto bg-white/95 border border-[#D49B5B]/60 rounded-2xl px-3 py-2.5 sm:px-5 sm:py-3 shadow-lg flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
          {/* Left: Lobby Exit + Identity */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <button
              type="button"
              onClick={handleExitToLobby}
              aria-label="Kembali ke Lobby Hiburan"
              title="Kembali ke Lobby Hiburan"
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-[#0F2C59] border border-slate-300 text-xs sm:text-sm font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Lobby</span>
            </button>

            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#0F2C59] border-2 border-[#D49B5B] flex items-center justify-center shrink-0 shadow-sm">
              <Worm
                className="w-5 h-5 sm:w-6 sm:h-6 text-[#F5C56B]"
                aria-hidden="true"
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-xl font-serif font-black text-[#0F2C59] tracking-tight leading-none">
                  Snake P3TQ
                </h1>
                <span className="inline-block px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-[10px] sm:text-[11px] font-bold text-[#1E3A8A]">
                  Lv. {speedLevel}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-[#92400E] hidden sm:block mt-0.5">
                Mode Zen Tanpa Akhir • Tembus Dinding
              </p>
            </div>
          </div>

          {/* Center: Live Telemetry Counters */}
          <div className="flex items-center gap-3 sm:gap-6 bg-[#F0F9FF] border border-blue-200 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Skor
              </p>
              <p
                data-testid="snake-current-score"
                className="text-base sm:text-xl font-black tabular-nums text-[#0F2C59] leading-tight"
              >
                {score.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="h-6 w-[1px] bg-blue-200" aria-hidden="true" />

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Panjang
              </p>
              <p
                data-testid="snake-current-length"
                className="text-sm sm:text-base font-extrabold tabular-nums text-[#0F2C59] leading-tight"
              >
                {snakeLength}
              </p>
            </div>

            <div className="h-6 w-[1px] bg-blue-200" aria-hidden="true" />

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Buah
              </p>
              <p
                data-testid="snake-fruits-eaten"
                className="text-sm sm:text-base font-extrabold tabular-nums text-[#92400E] leading-tight"
              >
                {fruitsEaten}
              </p>
            </div>
          </div>

          {/* Right: Controls & Top-Right Surrender ("Menyerah") Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto sm:ml-0">
            <button
              type="button"
              onClick={toggleSound}
              aria-label={soundEnabled ? 'Matikan suara' : 'Nyalakan suara'}
              title={soundEnabled ? 'Matikan suara' : 'Nyalakan suara'}
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-2.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-[#0F2C59] border border-slate-300 text-xs font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-[#0F2C59]" aria-hidden="true" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-600" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={toggleBrowserFullscreen}
              aria-label={
                isNativeFullscreen ? 'Keluar layar penuh' : 'Layar penuh'
              }
              title={isNativeFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}
              className="hidden sm:inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-2.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-[#0F2C59] border border-slate-300 text-xs font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
            >
              {isNativeFullscreen ? (
                <Minimize2 className="w-4 h-4 text-[#0F2C59]" aria-hidden="true" />
              ) : (
                <Maximize2 className="w-4 h-4 text-[#0F2C59]" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={togglePause}
              disabled={isSurrendered}
              aria-label={isPaused ? 'Lanjutkan permainan' : 'Jeda permainan'}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-[#0F2C59] border border-slate-300 text-xs sm:text-sm font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
            >
              {isPaused ? (
                <>
                  <Play className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="hidden md:inline">Lanjut</span>
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="hidden md:inline">Jeda</span>
                </>
              )}
            </button>

            <button
              type="button"
              data-testid="snake-surrender-btn"
              onClick={handleSurrender}
              disabled={isSurrendered}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 sm:px-4 py-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C56B]"
            >
              <Flag className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Menyerah</span>
            </button>
          </div>
        </div>
      </header>

      {/* Center Stage: Responsive Square Canvas Arena */}
      <main className="relative z-10 flex-1 min-h-0 w-full flex flex-col items-center justify-center px-3 py-1 sm:p-4 gap-2.5">
        <div
          className="relative aspect-square w-full rounded-2xl overflow-hidden border-2 border-[#D49B5B] bg-[#0B2247] shadow-2xl"
          style={{
            maxWidth: 'min(92vw, calc(100dvh - 230px))',
            maxHeight: 'min(92vw, calc(100dvh - 230px))',
          }}
        >
          <canvas
            ref={canvasRef}
            aria-label="Papan permainan Snake P3TQ"
            className="w-full h-full block"
          />

          {/* Framer Motion Fade-Out Notification when Body is Cut */}
          <AnimatePresence>
            {cutBanner && !isSurrendered && (
              <motion.div
                key={cutBanner.id}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="pointer-events-none absolute top-3 inset-x-3 flex justify-center z-10"
              >
                <div className="px-3.5 py-2 rounded-xl bg-[#0F2C59]/95 border border-[#F5C56B] text-white text-xs font-bold shadow-lg flex items-center gap-2">
                  <span className="text-[#FDA4AF]">
                    Tubuh Terpotong (-{cutBanner.lostSegments} segmen)
                  </span>
                  <span>•</span>
                  <span className="text-[#F5C56B]">
                    Skor: {cutBanner.oldScore} ke {cutBanner.newScore}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pause Overlay */}
          <AnimatePresence>
            {isPaused && !isSurrendered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="absolute inset-0 z-20 bg-[#07142B]/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="w-full max-w-xs rounded-2xl bg-white p-6 border-2 border-[#D49B5B] shadow-xl space-y-4">
                  <h2 className="text-xl font-serif font-black text-[#0F2C59]">
                    Permainan Dijeda
                  </h2>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Tekan tombol Lanjutkan atau bilah Spasi untuk kembali
                    menggerakkan ular.
                  </p>
                  <button
                    type="button"
                    onClick={togglePause}
                    className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-bold shadow-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F2C59]"
                  >
                    <Play className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Lanjutkan Permainan</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Control Bar: Touch D-Pad & Keyboard Hint */}
      <footer
        className="relative z-20 w-full px-4 pt-1 flex flex-col items-center gap-1.5"
        style={{
          paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
        }}
      >
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            aria-label="Gerak ke kiri"
            onClick={() => enqueueDirection({ x: -1, y: 0 })}
            className="flex items-center justify-center min-h-[46px] min-w-[54px] rounded-xl bg-white/95 hover:bg-white active:scale-95 text-[#0F2C59] border-2 border-[#D49B5B] shadow-md transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C56B]"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Gerak ke atas"
            onClick={() => enqueueDirection({ x: 0, y: -1 })}
            className="flex items-center justify-center min-h-[46px] min-w-[54px] rounded-xl bg-white/95 hover:bg-white active:scale-95 text-[#0F2C59] border-2 border-[#D49B5B] shadow-md transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C56B]"
          >
            <ArrowUp className="w-5 h-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Gerak ke bawah"
            onClick={() => enqueueDirection({ x: 0, y: 1 })}
            className="flex items-center justify-center min-h-[46px] min-w-[54px] rounded-xl bg-white/95 hover:bg-white active:scale-95 text-[#0F2C59] border-2 border-[#D49B5B] shadow-md transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C56B]"
          >
            <ArrowDown className="w-5 h-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Gerak ke kanan"
            onClick={() => enqueueDirection({ x: 1, y: 0 })}
            className="flex items-center justify-center min-h-[46px] min-w-[54px] rounded-xl bg-white/95 hover:bg-white active:scale-95 text-[#0F2C59] border-2 border-[#D49B5B] shadow-md transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C56B]"
          >
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <p className="text-[11px] font-semibold text-[#F5C56B] text-center">
          PC: Tombol Panah / WASD • Ponsel: Geser Layar (Swipe) atau Tombol Arah
        </p>
      </footer>

      {/* Fullscreen Final Score Summary Modal on Surrender */}
      <AnimatePresence>
        {isSurrendered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="snake-summary-title"
            className="fixed inset-0 z-50 bg-[#07142B]/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="w-full max-w-sm rounded-3xl bg-white border-2 border-[#D49B5B] p-6 text-center shadow-2xl space-y-4">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-[#0F2C59] border-2 border-[#D49B5B] flex items-center justify-center shadow-sm">
                <Worm
                  className="w-7 h-7 text-[#F5C56B]"
                  aria-hidden="true"
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-[#92400E]">
                  Sesi Berakhir
                </p>
                <h2
                  id="snake-summary-title"
                  className="text-2xl font-serif font-black text-[#0F2C59]"
                >
                  Hasil Akhir Snake P3TQ
                </h2>
              </div>

              <div className="rounded-2xl bg-[#F0F9FF] border border-blue-200 p-4">
                <p className="text-xs font-bold text-[#1E3A8A]">Skor Akhir</p>
                <p
                  data-testid="snake-final-score"
                  className="text-3xl sm:text-4xl font-black tabular-nums text-[#0F2C59] mt-0.5"
                >
                  {score.toLocaleString('id-ID')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-left">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5">
                  <p className="text-[11px] font-bold text-slate-600">
                    Skor Tertinggi
                  </p>
                  <p className="text-base font-extrabold tabular-nums text-[#0F2C59]">
                    {peakScore.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5">
                  <p className="text-[11px] font-bold text-slate-600">
                    Buah Dimakan
                  </p>
                  <p className="text-base font-extrabold tabular-nums text-[#92400E]">
                    {fruitsEaten} Buah
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5">
                  <p className="text-[11px] font-bold text-slate-600">
                    Panjang Akhir
                  </p>
                  <p className="text-base font-extrabold tabular-nums text-[#0F2C59]">
                    {snakeLength} Segmen
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5">
                  <p className="text-[11px] font-bold text-slate-600">
                    Terpotong
                  </p>
                  <p className="text-base font-extrabold tabular-nums text-[#0F2C59]">
                    {cutCount} Kali
                  </p>
                </div>
              </div>

              <div className="pt-1 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={resetGame}
                  className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-bold shadow-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F2C59]"
                >
                  <RotateCcw
                    className="w-4 h-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span>Main Lagi</span>
                </button>

                <button
                  type="button"
                  onClick={handleExitToLobby}
                  className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#0F2C59] border border-slate-300 text-sm font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
                >
                  <span>Kembali ke Lobby</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (mounted && typeof document !== 'undefined') {
    return createPortal(gameLayer, document.body);
  }

  return gameLayer;
}
