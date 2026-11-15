'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Flag,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Worm,
} from 'lucide-react';
import GlassCard from '@/components/GlassCard';
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
    fruitRef.current = createRandomFruit(snakeRef.current);
    document.title = 'Snake P3TQ | Pusat Hiburan Haflah';
  }, []);

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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 lg:pb-12 space-y-6">
      {/* Top Bar matching Hiburan Lobby Card Aesthetics */}
      <div className="bg-white/95 border border-[#D49B5B]/45 rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#0F2C59] border-2 border-[#D49B5B] flex items-center justify-center shrink-0 shadow-sm">
            <Worm
              className="w-6 h-6 sm:w-7 sm:h-7 text-[#F5C56B]"
              aria-hidden="true"
            />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-widest text-[#92400E]">
                Mode Zen Tanpa Akhir
              </span>
              <span className="inline-block px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-[11px] font-bold text-[#1E3A8A]">
                Kecepatan Lv. {speedLevel}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-black text-[#0F2C59] tracking-tight">
              Snake P3TQ
            </h1>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 flex-wrap">
          <Link
            href="/admin/hiburan"
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-[#0F2C59] border border-slate-300 text-xs sm:text-sm font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Lobby</span>
          </Link>

          <button
            type="button"
            onClick={toggleSound}
            aria-label={soundEnabled ? 'Matikan suara' : 'Nyalakan suara'}
            title={soundEnabled ? 'Matikan suara' : 'Nyalakan suara'}
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-[#0F2C59] border border-slate-300 text-xs sm:text-sm font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-[#0F2C59]" aria-hidden="true" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-600" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={togglePause}
            disabled={isSurrendered}
            aria-label={isPaused ? 'Lanjutkan permainan' : 'Jeda permainan'}
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-[#0F2C59] border border-slate-300 text-xs sm:text-sm font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2"
          >
            {isPaused ? (
              <>
                <Play className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Lanjut</span>
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Jeda</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Game Arena & Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Canvas Container (Left / Center Column) */}
        <GlassCard className="relative overflow-hidden lg:col-span-8 p-4 sm:p-5 border border-[#D49B5B]/45 bg-white/95 shadow-sm space-y-3.5">
          {/* HUD Bar Directly Above Canvas with Top-Right Surrender Button */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
            <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Skor
                </p>
                <p
                  data-testid="snake-current-score"
                  className="text-xl sm:text-2xl font-black tabular-nums text-[#0F2C59]"
                >
                  {score.toLocaleString('id-ID')}
                </p>
              </div>

              <div className="h-7 w-[1px] bg-slate-200" aria-hidden="true" />

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Panjang
                </p>
                <p
                  data-testid="snake-current-length"
                  className="text-base sm:text-lg font-extrabold tabular-nums text-[#0F2C59]"
                >
                  {snakeLength} Segmen
                </p>
              </div>

              <div className="h-7 w-[1px] bg-slate-200" aria-hidden="true" />

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Buah
                </p>
                <p
                  data-testid="snake-fruits-eaten"
                  className="text-base sm:text-lg font-extrabold tabular-nums text-[#92400E]"
                >
                  {fruitsEaten}
                </p>
              </div>
            </div>

            <button
              type="button"
              data-testid="snake-surrender-btn"
              onClick={handleSurrender}
              disabled={isSurrendered}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F2C59] focus-visible:ring-offset-2"
            >
              <Flag className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Menyerah</span>
            </button>
          </div>

          {/* Interactive Board Area with Touch Swipe Listener */}
          <div
            ref={boardTouchRef}
            className="relative w-full max-w-[380px] sm:max-w-[410px] mx-auto aspect-square rounded-2xl overflow-hidden border-2 border-[#0F2C59] bg-[#0B2247] shadow-inner touch-none select-none"
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
                      className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-bold shadow-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F2C59] focus-visible:ring-offset-2"
                    >
                      <Play className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Lanjutkan Permainan</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Final Score Summary Overlay on Surrender */}
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
                className="absolute inset-0 z-30 bg-[#07142B]/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
              >
                <div className="w-full max-w-sm rounded-2xl bg-white border-2 border-[#D49B5B] p-5 sm:p-6 text-center shadow-2xl space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-[#0F2C59] border-2 border-[#D49B5B] flex items-center justify-center shadow-sm">
                    <Worm
                      className="w-6 h-6 text-[#F5C56B]"
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

                  <div className="rounded-xl bg-[#F0F9FF] border border-blue-200 p-3.5">
                    <p className="text-xs font-bold text-[#1E3A8A]">
                      Skor Akhir
                    </p>
                    <p
                      data-testid="snake-final-score"
                      className="text-3xl font-black tabular-nums text-[#0F2C59] mt-0.5"
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
                      className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-bold shadow-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F2C59] focus-visible:ring-offset-2"
                    >
                      <RotateCcw
                        className="w-4 h-4 shrink-0"
                        aria-hidden="true"
                      />
                      <span>Main Lagi</span>
                    </button>

                    <Link
                      href="/admin/hiburan"
                      className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#0F2C59] border border-slate-300 text-sm font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2"
                    >
                      <span>Kembali ke Lobby</span>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile & Touch Directional Pad + Swipe Hint */}
          <div className="pt-1 flex flex-col items-end sm:items-center gap-2.5">
            <p className="w-full text-xs font-semibold text-slate-700 text-center">
              Geser layar (swipe) pada papan atau gunakan tombol arah di bawah:
            </p>
            <div className="grid grid-cols-3 gap-2 w-44 mr-1 sm:mr-0">
              <div />
              <button
                type="button"
                aria-label="Gerak ke atas"
                onClick={() => enqueueDirection({ x: 0, y: -1 })}
                className="flex items-center justify-center min-h-[48px] min-w-[48px] rounded-xl bg-[#0F2C59] hover:bg-[#1E3A8A] active:scale-95 text-[#F5C56B] border border-[#D49B5B] shadow-sm transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2"
              >
                <ArrowUp className="w-5 h-5" aria-hidden="true" />
              </button>
              <div />
              <button
                type="button"
                aria-label="Gerak ke kiri"
                onClick={() => enqueueDirection({ x: -1, y: 0 })}
                className="flex items-center justify-center min-h-[48px] min-w-[48px] rounded-xl bg-[#0F2C59] hover:bg-[#1E3A8A] active:scale-95 text-[#F5C56B] border border-[#D49B5B] shadow-sm transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2"
              >
                <ArrowLeft className="w-5 h-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Gerak ke bawah"
                onClick={() => enqueueDirection({ x: 0, y: 1 })}
                className="flex items-center justify-center min-h-[48px] min-w-[48px] rounded-xl bg-[#0F2C59] hover:bg-[#1E3A8A] active:scale-95 text-[#F5C56B] border border-[#D49B5B] shadow-sm transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2"
              >
                <ArrowDown className="w-5 h-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Gerak ke kanan"
                onClick={() => enqueueDirection({ x: 1, y: 0 })}
                className="flex items-center justify-center min-h-[48px] min-w-[48px] rounded-xl bg-[#0F2C59] hover:bg-[#1E3A8A] active:scale-95 text-[#F5C56B] border border-[#D49B5B] shadow-sm transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2"
              >
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Right Info & Rules Panel */}
        <GlassCard className="lg:col-span-4 p-5 sm:p-6 border border-[#D49B5B]/45 bg-white/95 shadow-sm space-y-5">
          <div className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-widest text-[#92400E]">
              Panduan Arena
            </p>
            <h2 className="text-lg font-serif font-black text-[#0F2C59]">
              Aturan Zen Endless
            </h2>
          </div>

          <ul className="space-y-3 text-sm text-slate-700 leading-relaxed">
            <li className="p-3 rounded-xl bg-[#F0F9FF] border border-blue-200">
              <p className="font-bold text-[#0F2C59]">Tanpa Dinding Mematikan</p>
              <p className="text-xs text-slate-700 mt-0.5">
                Ular menembus sisi kiri ke kanan dan atas ke bawah tanpa
                berhenti.
              </p>
            </li>
            <li className="p-3 rounded-xl bg-[#F0F9FF] border border-blue-200">
              <p className="font-bold text-[#0F2C59]">Makan Buah (+10 Poin)</p>
              <p className="text-xs text-slate-700 mt-0.5">
                Setiap buah menambah panjang 1 segmen dan skor 10 poin.
                Kecepatan meningkat setiap kelipatan 100 buah.
              </p>
            </li>
            <li className="p-3 rounded-xl bg-amber-50/80 border border-amber-200">
              <p className="font-bold text-[#92400E]">
                Tabrakan Tubuh &amp; Potong Ekor
              </p>
              <p className="text-xs text-slate-700 mt-0.5">
                Menabrak badan sendiri tidak mengakhiri permainan. Bagian tubuh
                dari titik tabrakan hingga ekor akan memudar dan skor
                disesuaikan proporsional terhadap sisa panjang tubuh.
              </p>
            </li>
          </ul>

          <div className="pt-2 border-t border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Kontrol PC</span>
              <span className="font-bold text-[#0F2C59]">
                Panah / WASD / Spasi
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">
                Kontrol Ponsel
              </span>
              <span className="font-bold text-[#0F2C59]">
                Swipe Layar / Tombol Arah
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">
                Target Kecepatan Berikutnya
              </span>
              <span className="font-bold text-[#92400E]">
                {FRUITS_PER_SPEED_UP - (fruitsEaten % FRUITS_PER_SPEED_UP)} Buah
                Lagi
              </span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
