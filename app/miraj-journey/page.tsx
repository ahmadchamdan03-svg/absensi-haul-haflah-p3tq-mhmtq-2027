'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Trophy,
  Shield,
  Zap,
  RotateCcw,
  Sparkles,
  Info,
  Play,
  Heart,
  Award,
  Crown,
  Share2,
} from 'lucide-react';

// --- TIPE DATA & ENUMS GAME ---
type DimensiLevel = 'DUNIA' | 'AKHIRAT' | 'SURGA';

type PowerUpType = 'SHIELD' | 'DASH' | 'MAGNET' | 'SLOW';

interface PowerUpItem {
  x: number;
  y: number;
  type: PowerUpType;
  collected: boolean;
  pulseAngle: number;
}

interface PahalaStar {
  x: number;
  y: number;
  collected: boolean;
  angle: number;
}

interface ObstaclePillar {
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

interface Particle {
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

interface LeaderboardEntry {
  rank?: number;
  nama: string;
  gelar: string;
  skor: number;
  tanggal: string;
}

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { nama: 'Fatimah Zahra', gelar: '👑 Khatimatul Maqam Al-A\'la', skor: 1000, tanggal: '25/09/2026' },
  { nama: 'Aisyah Humaira', gelar: 'Sayyidatul Firdaus', skor: 780, tanggal: '25/09/2026' },
  { nama: 'Nabila Khansa', gelar: 'Khadimah Roudhoh', skor: 340, tanggal: '24/09/2026' },
  { nama: 'Zulfa Zakiyah', gelar: 'Mujahidah Hisab', skor: 95, tanggal: '24/09/2026' },
  { nama: 'Maryam Nurul', gelar: 'Mujahidah Hisab', skor: 62, tanggal: '23/09/2026' },
  { nama: 'Khadijah Al-Qur\'ani', gelar: 'Musafirah Dunia', skor: 28, tanggal: '23/09/2026' },
];

export default function MirajJourneyGamePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Status Layar Game
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER' | 'VICTORY'>('START');
  const [namaSantri, setNamaSantri] = useState<string>('Santriwati P3TQ');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [leaderboardOpen, setLeaderboardOpen] = useState<boolean>(false);
  const [panduanOpen, setPanduanOpen] = useState<boolean>(false);

  // Live HUD States
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [currentLevel, setCurrentLevel] = useState<DimensiLevel>('DUNIA');
  const [currentGelar, setCurrentGelar] = useState<string>('Musafirah Dunia');
  const [activeShield, setActiveShield] = useState<boolean>(false);
  const [dashTimeLeft, setDashTimeLeft] = useState<number>(0);
  const [magnetTimeLeft, setMagnetTimeLeft] = useState<number>(0);
  const [slowTimeLeft, setSlowTimeLeft] = useState<number>(0);

  // Leaderboard Data
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(DEFAULT_LEADERBOARD);

  // Refs untuk audio synth dan engine loop
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Image Sprite Ref
  const buroqSpriteRef = useRef<HTMLImageElement | null>(null);

  // --- HELPER GELAR BERDASARKAN SKOR ---
  const getGelarByScore = (skor: number): string => {
    if (skor >= 1000) return '👑 Khatimatul Maqam Al-A\'la';
    if (skor >= 500) return 'Sayyidatul Firdaus';
    if (skor >= 101) return 'Khadimah Roudhoh';
    if (skor >= 31) return 'Mujahidah Hisab';
    return 'Musafirah Dunia';
  };

  // Muat data tersimpan dari LocalStorage
  useEffect(() => {
    try {
      const savedName = localStorage.getItem('miraj_player_name');
      if (savedName) setNamaSantri(savedName);

      const savedHigh = localStorage.getItem('miraj_high_score');
      if (savedHigh) setHighScore(parseInt(savedHigh, 10) || 0);

      const savedLb = localStorage.getItem('miraj_leaderboard');
      if (savedLb) {
        const parsed = JSON.parse(savedLb);
        if (Array.isArray(parsed) && parsed.length > 0) setLeaderboard(parsed);
      }
    } catch {}

    // Preload image sprite
    const img = new Image();
    img.src = '/images/game/santriwati-buroq-transparent.png';
    buroqSpriteRef.current = img;

    // Bersihkan AudioContext saat unmount
    return () => {
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch {}
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // --- AUDIO SYNTHESIZER BEBAS DEPENDENCY ---
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

  // --- GAME ENGINE & STATE MANAGEMENT ---
  const saveLeaderboardEntry = (skorAkhir: number) => {
    const gelar = getGelarByScore(skorAkhir);
    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const newEntry: LeaderboardEntry = {
      nama: namaSantri.trim() || 'Santriwati',
      gelar,
      skor: skorAkhir,
      tanggal: dateStr,
    };

    setLeaderboard((prev) => {
      const updated = [...prev, newEntry]
        .sort((a, b) => b.skor - a.skor)
        .slice(0, 10);
      try {
        localStorage.setItem('miraj_leaderboard', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (skorAkhir > highScore) {
      setHighScore(skorAkhir);
      try {
        localStorage.setItem('miraj_high_score', skorAkhir.toString());
      } catch {}
    }
  };

  const startGame = () => {
    try {
      localStorage.setItem('miraj_player_name', namaSantri.trim() || 'Santriwati');
    } catch {}

    setCurrentScore(0);
    setCurrentLevel('DUNIA');
    setCurrentGelar('Musafirah Dunia');
    setActiveShield(false);
    setDashTimeLeft(0);
    setMagnetTimeLeft(0);
    setSlowTimeLeft(0);
    setGameState('PLAYING');
  };

  // --- CANVAS GAME LOOP & PHYSICS ENGINE ---
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dimensi Virtual Baku Game
    const VIRTUAL_WIDTH = 800;
    const VIRTUAL_HEIGHT = 600;

    canvas.width = VIRTUAL_WIDTH;
    canvas.height = VIRTUAL_HEIGHT;

    // Posisi & Fisika Karakter Santriwati Penunggang Buroq
    let bird = {
      x: 140,
      y: 280,
      vy: 0,
      width: 78,
      height: 78,
      rotation: 0,
      // Fair Play Hitbox (Hanya badan inti santriwati & buroq, bukan ujung sayap & jilatan api ekor)
      hitboxRadius: 24,
    };

    const GRAVITY = 0.36;
    const JUMP_IMPULSE = -7.4;

    let score = 0;
    let frameCount = 0;
    let isGameOver = false;
    let isVictory = false;

    // Power-Up State di dalam loop
    let shield = false;
    let dashFrames = 0; // 3 detik @60fps = 180 frames
    let magnetFrames = 0; // 6 detik = 360 frames
    let slowFrames = 0; // 5 detik = 300 frames

    // Obstacles, Items, Stars, Particles
    let pillars: ObstaclePillar[] = [];
    let powerUps: PowerUpItem[] = [];
    let pahalaStars: PahalaStar[] = [];
    let particles: Particle[] = [];

    // Background Parallax Offsets
    let bgOffsetFar = 0;
    let bgOffsetMid = 0;
    let bgOffsetNear = 0;

    // Input Jump Trigger
    const triggerFlap = () => {
      if (isGameOver || isVictory) return;
      bird.vy = JUMP_IMPULSE;
      playSoundFlap();

      // Partikel kibasan sayap emas
      for (let i = 0; i < 7; i++) {
        particles.push({
          x: bird.x - 10 + Math.random() * 20,
          y: bird.y + 25 + Math.random() * 10,
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

    // --- GENERATOR RINTANGAN & POWER-UP ---
    const spawnPillar = () => {
      let gap = 160;
      let moveSpeed = 0;
      let currentDim: DimensiLevel = 'DUNIA';

      if (score <= 30) {
        currentDim = 'DUNIA';
        gap = 160;
        moveSpeed = 0;
      } else if (score <= 100) {
        currentDim = 'AKHIRAT';
        gap = 135;
        moveSpeed = 0.9; // Bergerak vertikal perlahan
      } else {
        currentDim = 'SURGA';
        // Skor 101-150 gap diperlebar jadi 155px
        if (score <= 150) {
          gap = 155;
        } else {
          // Tiap tier +50 skor: gap menyempit -2.5px
          const tier = Math.floor((score - 150) / 50);
          gap = Math.max(115, 155 - tier * 2.5);
        }
        if (score > 350) {
          moveSpeed = 1.3;
        }
      }

      // Hitung tinggi pilar atas & bawah
      const minHeight = 60;
      const maxHeight = VIRTUAL_HEIGHT - gap - minHeight - 60;
      const topHeight = Math.floor(minHeight + Math.random() * (maxHeight - minHeight));
      const bottomHeight = VIRTUAL_HEIGHT - topHeight - gap;

      const newPillar: ObstaclePillar = {
        x: VIRTUAL_WIDTH + 40,
        topHeight,
        bottomHeight,
        gap,
        passed: false,
        baseY: topHeight,
        moveOffset: 0,
        moveSpeed,
        rotation: score > 600 ? (Math.random() - 0.5) * 0.15 : 0,
        dimensi: currentDim,
      };

      pillars.push(newPillar);

      // Probabilitas spawn Power-Up di celah pilar (22%)
      if (Math.random() < 0.24) {
        const types: PowerUpType[] = ['SHIELD', 'DASH', 'MAGNET', 'SLOW'];
        const pType = types[Math.floor(Math.random() * types.length)];
        powerUps.push({
          x: VIRTUAL_WIDTH + 40 + 35,
          y: topHeight + gap / 2,
          type: pType,
          collected: false,
          pulseAngle: 0,
        });
      } else if (Math.random() < 0.45) {
        // Spawn Butiran Pahala Star (+2 skor)
        pahalaStars.push({
          x: VIRTUAL_WIDTH + 40 + 35,
          y: topHeight + gap / 2,
          collected: false,
          angle: 0,
        });
      }
    };

    // --- GAME LOOP UTAMA ---
    const update = () => {
      frameCount++;

      // Cek apakah mode slow motion aktif
      const isSlowActive = slowFrames > 0;
      const timeScale = isSlowActive ? 0.7 : 1.0;

      // Kecepatan Scroll Dinamis Sesuai GDD
      let baseScrollSpeed = 2.5; // Level 1 Dunia
      let currentDim: DimensiLevel = 'DUNIA';

      if (score <= 30) {
        currentDim = 'DUNIA';
        baseScrollSpeed = 2.5;
      } else if (score <= 100) {
        currentDim = 'AKHIRAT';
        baseScrollSpeed = 3.2; // ~28% lebih cepat
      } else {
        currentDim = 'SURGA';
        if (score <= 150) {
          baseScrollSpeed = 3.0; // Flow state awal surga
        } else {
          const tier = Math.floor((score - 150) / 50);
          baseScrollSpeed = 3.0 + tier * 0.09;
        }
      }

      // Jika dash aktif: laju bertambah cepat dan kebal
      const isDashActive = dashFrames > 0;
      const effectiveSpeed = (isDashActive ? baseScrollSpeed * 1.7 : baseScrollSpeed) * timeScale;

      // Update Parallax Offsets
      bgOffsetFar += effectiveSpeed * 0.2;
      bgOffsetMid += effectiveSpeed * 0.5;
      bgOffsetNear += effectiveSpeed * 0.9;

      // Update Countdown Power-Up
      if (dashFrames > 0) dashFrames--;
      if (magnetFrames > 0) magnetFrames--;
      if (slowFrames > 0) slowFrames--;

      setDashTimeLeft(Math.ceil(dashFrames / 60));
      setMagnetTimeLeft(Math.ceil(magnetFrames / 60));
      setSlowTimeLeft(Math.ceil(slowFrames / 60));
      setActiveShield(shield);

      // Kondisi Tamat / Kemenangan (Skor 1000)
      if (score >= 1000 && !isVictory) {
        isVictory = true;
        setGameState('VICTORY');
        playSoundVictory();
        saveLeaderboardEntry(1000);

        // Hancurkan semua pilar jadi partikel cahaya abadi
        pillars.forEach((p) => {
          for (let i = 0; i < 25; i++) {
            particles.push({
              x: p.x + Math.random() * 60,
              y: Math.random() * VIRTUAL_HEIGHT,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              size: 4 + Math.random() * 5,
              color: '#FCD34D',
              alpha: 1,
              decay: 0.015,
              type: 'SPARK',
            });
          }
        });
        pillars = [];
      }

      // Fisika Burung Buroq
      if (!isVictory) {
        bird.vy += GRAVITY * timeScale;
        // Batasi kecepatan jatuh
        if (bird.vy > 9.0) bird.vy = 9.0;
        bird.y += bird.vy * timeScale;

        // Rotasi anggun mengikuti pergerakan
        bird.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 6, (bird.vy / 10) * 0.5));

        // Batasi lantai dan langit-langit
        if (bird.y - bird.hitboxRadius < 0) {
          bird.y = bird.hitboxRadius;
          bird.vy = 0;
        }

        if (bird.y + bird.hitboxRadius > VIRTUAL_HEIGHT - 30) {
          // Tabrak lantai
          if (!isDashActive) {
            isGameOver = true;
            setGameState('GAMEOVER');
            playSoundCrash();
            saveLeaderboardEntry(score);
          } else {
            bird.y = VIRTUAL_HEIGHT - 30 - bird.hitboxRadius;
            bird.vy = -3;
          }
        }
      } else {
        // Mode Kemenangan: Buroq melayang tenang di tengah
        bird.y += Math.sin(frameCount * 0.05) * 0.8;
        bird.rotation = Math.sin(frameCount * 0.03) * 0.05;
      }

      // Partikel Bara Api Ekor Buroq (Selalu Aktif)
      const tailX = bird.x - 28;
      const tailY = bird.y + 12;
      for (let i = 0; i < (isDashActive ? 4 : 2); i++) {
        particles.push({
          x: tailX,
          y: tailY + (Math.random() - 0.5) * 12,
          vx: -(effectiveSpeed * 0.8 + Math.random() * 2),
          vy: (Math.random() - 0.5) * 2,
          size: isDashActive ? 5 + Math.random() * 4 : 3 + Math.random() * 3,
          color: isDashActive ? '#38BDF8' : (Math.random() > 0.5 ? '#EF4444' : '#F59E0B'),
          alpha: 0.9,
          decay: isDashActive ? 0.03 : 0.04,
          type: 'FLAME',
        });
      }

      // Spawn Pilar Rintangan
      if (!isVictory) {
        const lastPillar = pillars[pillars.length - 1];
        const pillarSpacing = 280; // Jarak antar pilar
        if (!lastPillar || VIRTUAL_WIDTH - lastPillar.x >= pillarSpacing) {
          spawnPillar();
        }
      }

      // Update Pilar Rintangan
      for (let i = pillars.length - 1; i >= 0; i--) {
        const p = pillars[i];
        p.x -= effectiveSpeed;

        // Gerakan vertikal dinamis (Level 2 & Level 3)
        if (p.moveSpeed > 0) {
          p.moveOffset = Math.sin(frameCount * 0.035 * p.moveSpeed) * 35;
        }

        // Cek Lewat & Tambah Skor
        if (!p.passed && p.x + 70 < bird.x) {
          p.passed = true;
          score++;
          setCurrentScore(score);
          setCurrentLevel(currentDim);
          setCurrentGelar(getGelarByScore(score));
          playSoundScore();
        }

        // Cek Benturan / Tabrakan (Fair Play Hitbox)
        const effectiveTop = p.topHeight + p.moveOffset;
        const effectiveBottom = VIRTUAL_HEIGHT - (p.bottomHeight - p.moveOffset);
        const pillarWidth = 70;

        // Hitbox mengecil saat Air Kautsar aktif
        const playerRadius = isSlowActive ? 18 : bird.hitboxRadius;

        // Collision Check jika karakter berada dalam rentang X pilar
        const inPillarX = bird.x + playerRadius > p.x && bird.x - playerRadius < p.x + pillarWidth;
        const hitTopPillar = bird.y - playerRadius < effectiveTop;
        const hitBottomPillar = bird.y + playerRadius > effectiveBottom;

        if (inPillarX && (hitTopPillar || hitBottomPillar)) {
          if (isDashActive) {
            // Kilat Buroq: Menembus tanpa takut tabrakan & pecahkan pilar
            for (let k = 0; k < 12; k++) {
              particles.push({
                x: p.x + Math.random() * pillarWidth,
                y: hitTopPillar ? effectiveTop - 10 : effectiveBottom + 10,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: 4 + Math.random() * 4,
                color: '#38BDF8',
                alpha: 1,
                decay: 0.04,
                type: 'SPARK',
              });
            }
          } else if (shield) {
            // Tameng Bismillah menahan 1 kali benturan & hancurkan pilar jadi serpihan cahaya
            shield = false;
            setActiveShield(false);
            playSoundShieldBreak();

            // Efek serpihan cahaya emas
            for (let k = 0; k < 20; k++) {
              particles.push({
                x: bird.x,
                y: bird.y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                size: 5 + Math.random() * 5,
                color: '#FCD34D',
                alpha: 1,
                decay: 0.03,
                type: 'SPARK',
              });
            }
            // Hapus pilar yang tertabrak
            pillars.splice(i, 1);
            continue;
          } else {
            // Tabrakan Game Over
            isGameOver = true;
            setGameState('GAMEOVER');
            playSoundCrash();
            saveLeaderboardEntry(score);
          }
        }

        // Hapus pilar di luar layar kiri
        if (p.x < -100) {
          pillars.splice(i, 1);
        }
      }

      // Update Power-Up Items
      for (let i = powerUps.length - 1; i >= 0; i--) {
        const item = powerUps[i];
        item.x -= effectiveSpeed;
        item.pulseAngle += 0.06;

        // Jarak ke karakter
        const dist = Math.hypot(bird.x - item.x, bird.y - item.y);
        if (dist < bird.hitboxRadius + 22 && !item.collected) {
          item.collected = true;
          playSoundPowerUp();

          // Terapkan Efek Power-Up
          if (item.type === 'SHIELD') {
            shield = true;
            setActiveShield(true);
          } else if (item.type === 'DASH') {
            dashFrames = 180; // 3 detik
          } else if (item.type === 'MAGNET') {
            magnetFrames = 360; // 6 detik
          } else if (item.type === 'SLOW') {
            slowFrames = 300; // 5 detik
          }

          // Partikel ambil item
          for (let k = 0; k < 15; k++) {
            particles.push({
              x: item.x,
              y: item.y,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              size: 4 + Math.random() * 4,
              color: item.type === 'SHIELD' ? '#F59E0B' : item.type === 'DASH' ? '#38BDF8' : item.type === 'MAGNET' ? '#10B981' : '#06B6D4',
              alpha: 1,
              decay: 0.03,
              type: 'SPARK',
            });
          }

          powerUps.splice(i, 1);
          continue;
        }

        if (item.x < -60) {
          powerUps.splice(i, 1);
        }
      }

      // Update Butiran Pahala Stars
      for (let i = pahalaStars.length - 1; i >= 0; i--) {
        const star = pahalaStars[i];
        star.x -= effectiveSpeed;
        star.angle += 0.05;

        // Efek Magnet Tasbih: Tarik star ke arah pemain
        if (magnetFrames > 0) {
          const dist = Math.hypot(bird.x - star.x, bird.y - star.y);
          if (dist < 220) {
            star.x += (bird.x - star.x) * 0.12;
            star.y += (bird.y - star.y) * 0.12;
          }
        }

        // Ambil Pahala Star (+2 poin)
        const dist = Math.hypot(bird.x - star.x, bird.y - star.y);
        if (dist < bird.hitboxRadius + 18 && !star.collected) {
          star.collected = true;
          score += 2;
          setCurrentScore(score);
          setCurrentGelar(getGelarByScore(score));
          playSoundScore();

          for (let k = 0; k < 8; k++) {
            particles.push({
              x: star.x,
              y: star.y,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              size: 3 + Math.random() * 3,
              color: '#34D399',
              alpha: 1,
              decay: 0.04,
              type: 'SPARK',
            });
          }

          pahalaStars.splice(i, 1);
          continue;
        }

        if (star.x < -50) {
          pahalaStars.splice(i, 1);
        }
      }

      // Update Partikel
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= pt.decay;
        if (pt.alpha <= 0) {
          particles.splice(i, 1);
        }
      }
    };

    // --- RENDER ENGINE PADA HTML5 CANVAS ---
    const draw = () => {
      ctx.clearRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

      // 1. LATAR BELAKANG PARALLAX 3 DIMENSI
      const level = currentLevel;

      if (level === 'DUNIA') {
        // --- LEVEL 1: DUNIA (Senja hangat, bukit asri, masjid megah berkubah emas) ---
        const skyGrad = ctx.createLinearGradient(0, 0, 0, VIRTUAL_HEIGHT);
        skyGrad.addColorStop(0, '#B45309'); // Warm Amber Dusk
        skyGrad.addColorStop(0.4, '#D97706');
        skyGrad.addColorStop(0.7, '#FBBF24');
        skyGrad.addColorStop(1, '#FEF3C7');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

        // Matahari Senja Bersinar Lembut
        ctx.beginPath();
        ctx.arc(VIRTUAL_WIDTH - 140, 160, 55, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(254, 243, 199, 0.45)';
        ctx.fill();

        // Layer Far: Siluet Masjid Kubah Emas di Kejauhan
        ctx.fillStyle = '#78350F';
        ctx.globalAlpha = 0.35;
        const mosqueW = 180;
        for (let x = -((bgOffsetFar * 0.5) % mosqueW); x < VIRTUAL_WIDTH + mosqueW; x += mosqueW) {
          // Kubah besar
          ctx.beginPath();
          ctx.arc(x + 90, 420, 45, Math.PI, 0);
          ctx.fill();
          // Menara tinggi
          ctx.fillRect(x + 20, 310, 14, 150);
          ctx.fillRect(x + 145, 310, 14, 150);
          ctx.beginPath();
          ctx.moveTo(x + 18, 310);
          ctx.lineTo(x + 27, 280);
          ctx.lineTo(x + 36, 310);
          ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        // Layer Mid: Bukit Hijau Asri Berombak
        ctx.fillStyle = '#065F46';
        ctx.beginPath();
        ctx.moveTo(0, VIRTUAL_HEIGHT);
        for (let x = 0; x <= VIRTUAL_WIDTH; x += 30) {
          const y = 470 + Math.sin((x + bgOffsetMid) * 0.008) * 35;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
        ctx.closePath();
        ctx.fill();

        // Lantai Rumput Hijau Tua
        ctx.fillStyle = '#064E3B';
        ctx.fillRect(0, VIRTUAL_HEIGHT - 35, VIRTUAL_WIDTH, 35);

      } else if (level === 'AKHIRAT') {
        // --- LEVEL 2: AKHIRAT (Langit merah pekat temaram, awan berpetir halus, jurang hisab) ---
        const skyGrad = ctx.createLinearGradient(0, 0, 0, VIRTUAL_HEIGHT);
        skyGrad.addColorStop(0, '#1E1B4B'); // Dark Indigo
        skyGrad.addColorStop(0.3, '#450A0A'); // Deep Crimson
        skyGrad.addColorStop(0.7, '#7F1D1D');
        skyGrad.addColorStop(1, '#991B1B');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

        // Kilatan Petir Halus Berkala
        if (frameCount % 160 < 4) {
          ctx.fillStyle = 'rgba(254, 202, 202, 0.25)';
          ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
        }

        // Layer Far: Jembatan Hisab (Sirath) Melengkung di Kejauhan
        ctx.strokeStyle = '#FCA5A5';
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(-100, 360);
        ctx.quadraticCurveTo(VIRTUAL_WIDTH / 2, 280, VIRTUAL_WIDTH + 100, 360);
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // Layer Mid: Awan Mendung Berhawa Panas & Jurang Gelap
        ctx.fillStyle = '#290808';
        ctx.beginPath();
        ctx.moveTo(0, VIRTUAL_HEIGHT);
        for (let x = 0; x <= VIRTUAL_WIDTH; x += 40) {
          const y = 490 + Math.sin((x + bgOffsetMid * 1.2) * 0.015) * 25;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
        ctx.closePath();
        ctx.fill();

        // Hawa Panas Magma di Dasar
        const lavaGrad = ctx.createLinearGradient(0, VIRTUAL_HEIGHT - 35, 0, VIRTUAL_HEIGHT);
        lavaGrad.addColorStop(0, '#DC2626');
        lavaGrad.addColorStop(1, '#7F1D1D');
        ctx.fillStyle = lavaGrad;
        ctx.fillRect(0, VIRTUAL_HEIGHT - 35, VIRTUAL_WIDTH, 35);

      } else {
        // --- LEVEL 3: SURGA (Alam keemasan penuh pendar cahaya, gerbang marmer putih emas) ---
        const skyGrad = ctx.createLinearGradient(0, 0, 0, VIRTUAL_HEIGHT);
        skyGrad.addColorStop(0, '#FEF08A'); // Heavenly Radiant Gold
        skyGrad.addColorStop(0.4, '#FDE68A');
        skyGrad.addColorStop(0.7, '#E0F2FE'); // Soft Celestial Cyan
        skyGrad.addColorStop(1, '#F8FAFC');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

        // Pancaran Berkas Cahaya Suci (Sidratul Muntaha Light Rays)
        ctx.save();
        ctx.globalAlpha = 0.15;
        for (let i = 0; i < 7; i++) {
          const rayAngle = (i * 0.28) + (frameCount * 0.002);
          ctx.beginPath();
          ctx.moveTo(VIRTUAL_WIDTH / 2, -50);
          ctx.lineTo(VIRTUAL_WIDTH / 2 + Math.cos(rayAngle) * 900, Math.sin(rayAngle) * 900);
          ctx.lineTo(VIRTUAL_WIDTH / 2 + Math.cos(rayAngle + 0.14) * 900, Math.sin(rayAngle + 0.14) * 900);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
        }
        ctx.restore();

        // Kabut Suci Putih di Lantai Surga
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.moveTo(0, VIRTUAL_HEIGHT);
        for (let x = 0; x <= VIRTUAL_WIDTH; x += 30) {
          const y = 530 + Math.sin((x + bgOffsetNear) * 0.02) * 15;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
        ctx.closePath();
        ctx.fill();

        // Lantai Kristal Emas Marmer
        const floorGrad = ctx.createLinearGradient(0, VIRTUAL_HEIGHT - 35, 0, VIRTUAL_HEIGHT);
        floorGrad.addColorStop(0, '#FDE68A');
        floorGrad.addColorStop(1, '#F59E0B');
        ctx.fillStyle = floorGrad;
        ctx.fillRect(0, VIRTUAL_HEIGHT - 35, VIRTUAL_WIDTH, 35);
      }

      // 2. GAMBAR PILAR RINTANGAN (OBSTACLES)
      pillars.forEach((p) => {
        const topH = p.topHeight + p.moveOffset;
        const botH = p.bottomHeight - p.moveOffset;
        const botY = VIRTUAL_HEIGHT - botH;
        const pWidth = 70;

        ctx.save();
        if (p.rotation !== 0) {
          ctx.translate(p.x + pWidth / 2, VIRTUAL_HEIGHT / 2);
          ctx.rotate(p.rotation);
          ctx.translate(-(p.x + pWidth / 2), -VIRTUAL_HEIGHT / 2);
        }

        if (p.dimensi === 'DUNIA') {
          // Batu Reruntuhan Klasik Statis
          const pillarGrad = ctx.createLinearGradient(p.x, 0, p.x + pWidth, 0);
          pillarGrad.addColorStop(0, '#78350F');
          pillarGrad.addColorStop(0.5, '#B45309');
          pillarGrad.addColorStop(1, '#92400E');
          ctx.fillStyle = pillarGrad;

          // Pilar Atas
          ctx.fillRect(p.x, 0, pWidth, topH);
          ctx.fillStyle = '#D97706';
          ctx.fillRect(p.x - 5, topH - 18, pWidth + 10, 18); // Kepala pilar

          // Pilar Bawah
          ctx.fillStyle = pillarGrad;
          ctx.fillRect(p.x, botY, pWidth, botH);
          ctx.fillStyle = '#D97706';
          ctx.fillRect(p.x - 5, botY, pWidth + 10, 18); // Dasar pilar

        } else if (p.dimensi === 'AKHIRAT') {
          // Batu Hitam Berduri (Obsidian) dengan Retakan Merah Menyala
          const pillarGrad = ctx.createLinearGradient(p.x, 0, p.x + pWidth, 0);
          pillarGrad.addColorStop(0, '#0F172A');
          pillarGrad.addColorStop(0.5, '#1E293B');
          pillarGrad.addColorStop(1, '#0F172A');
          ctx.fillStyle = pillarGrad;

          // Pilar Atas
          ctx.fillRect(p.x, 0, pWidth, topH);
          // Ujung duri tajam bawah
          ctx.beginPath();
          ctx.moveTo(p.x, topH);
          ctx.lineTo(p.x + pWidth / 2, topH + 15);
          ctx.lineTo(p.x + pWidth, topH);
          ctx.fillStyle = '#EF4444';
          ctx.fill();

          // Pilar Bawah
          ctx.fillStyle = pillarGrad;
          ctx.fillRect(p.x, botY, pWidth, botH);
          // Ujung duri tajam atas
          ctx.beginPath();
          ctx.moveTo(p.x, botY);
          ctx.lineTo(p.x + pWidth / 2, botY - 15);
          ctx.lineTo(p.x + pWidth, botY);
          ctx.fillStyle = '#EF4444';
          ctx.fill();

        } else {
          // Surga: Gerbang Marmer Putih Berukir Emas Murni & Kristal
          const pillarGrad = ctx.createLinearGradient(p.x, 0, p.x + pWidth, 0);
          pillarGrad.addColorStop(0, '#FFFFFF');
          pillarGrad.addColorStop(0.5, '#F8FAFC');
          pillarGrad.addColorStop(1, '#E2E8F0');
          ctx.fillStyle = pillarGrad;

          // Pilar Atas
          ctx.fillRect(p.x, 0, pWidth, topH);
          ctx.fillStyle = '#F59E0B'; // Emas
          ctx.fillRect(p.x - 6, topH - 16, pWidth + 12, 16);

          // Pilar Bawah
          ctx.fillStyle = pillarGrad;
          ctx.fillRect(p.x, botY, pWidth, botH);
          ctx.fillStyle = '#F59E0B';
          ctx.fillRect(p.x - 6, botY, pWidth + 12, 16);

          // Pendar Cahaya Kristal di Gerbang
          ctx.fillStyle = 'rgba(253, 230, 138, 0.4)';
          ctx.beginPath();
          ctx.arc(p.x + pWidth / 2, topH - 8, 12, 0, Math.PI * 2);
          ctx.arc(p.x + pWidth / 2, botY + 8, 12, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      // 3. GAMBAR POWER-UP ITEMS
      powerUps.forEach((item) => {
        const floatY = item.y + Math.sin(item.pulseAngle) * 6;
        ctx.save();
        ctx.translate(item.x, floatY);

        // Gelembung Aura Bersinar
        ctx.beginPath();
        ctx.arc(0, 0, 19, 0, Math.PI * 2);
        if (item.type === 'SHIELD') ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
        else if (item.type === 'DASH') ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
        else if (item.type === 'MAGNET') ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
        else ctx.fillStyle = 'rgba(6, 182, 212, 0.35)';
        ctx.fill();

        // Lingkaran Inti Item
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        if (item.type === 'SHIELD') ctx.fillStyle = '#F59E0B';
        else if (item.type === 'DASH') ctx.fillStyle = '#0284C7';
        else if (item.type === 'MAGNET') ctx.fillStyle = '#059669';
        else ctx.fillStyle = '#0891B2';
        ctx.fill();

        // Ikon Simbolis
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (item.type === 'SHIELD') ctx.fillText('🛡️', 0, 1);
        else if (item.type === 'DASH') ctx.fillText('⚡', 0, 1);
        else if (item.type === 'MAGNET') ctx.fillText('📿', 0, 1);
        else ctx.fillText('💧', 0, 1);

        ctx.restore();
      });

      // 4. GAMBAR BUTIRAN PAHALA STARS
      pahalaStars.forEach((star) => {
        ctx.save();
        ctx.translate(star.x, star.y + Math.sin(star.angle) * 4);
        ctx.rotate(star.angle);

        // Bintang 8 Sudut Islami
        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const r = i % 2 === 0 ? 11 : 5;
          const a = (i * Math.PI) / 4;
          if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();

        // Titik Tengah Emas
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#FDE047';
        ctx.fill();

        ctx.restore();
      });

      // 5. GAMBAR KARAKTER SANTRIWATI PENUNGGANG BUROQ
      ctx.save();
      ctx.translate(bird.x, bird.y);
      ctx.rotate(bird.rotation);

      // Gambar Aura Kilat Buroq jika Aktif
      if (dashFrames > 0) {
        ctx.beginPath();
        ctx.arc(0, 0, 48, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.fill();
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Gambar Kubah Tameng Bismillah jika Aktif
      if (shield) {
        ctx.beginPath();
        ctx.arc(0, 0, 45, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
        ctx.fill();
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Gambar Cincin Magnet Tasbih jika Aktif
      if (magnetFrames > 0) {
        ctx.save();
        ctx.rotate(frameCount * 0.08);
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 44, 0, Math.PI * 2);
        ctx.stroke();
        // 6 butiran tasbih berpendar
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          ctx.beginPath();
          ctx.arc(Math.cos(a) * 44, Math.sin(a) * 44, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#34D399';
          ctx.fill();
        }
        ctx.restore();
      }

      // Gambar Sprite Karakter Santriwati Penunggang Buroq
      if (buroqSpriteRef.current && buroqSpriteRef.current.complete) {
        ctx.drawImage(
          buroqSpriteRef.current,
          -bird.width / 2,
          -bird.height / 2,
          bird.width,
          bird.height
        );
      } else {
        // Fallback jika gambar masih loading
        ctx.beginPath();
        ctx.arc(0, 0, bird.hitboxRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#F59E0B';
        ctx.fill();
        ctx.strokeStyle = '#B45309';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      ctx.restore();

      // 6. GAMBAR SEMUA PARTIKEL
      particles.forEach((pt) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 7. HUD ATAS (Skor & Status Ringkas)
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'black 22px serif';
      ctx.textAlign = 'left';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 6;
      ctx.fillText(`Skor: ${score}`, 24, 42);
      ctx.shadowBlur = 0;
    };

    // Main Engine Runner Loop
    const engineLoop = () => {
      if (gameState === 'PLAYING') {
        update();
        draw();
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
    <div className="min-h-screen bg-gradient-to-b from-[#1E293B] via-[#0F172A] to-[#020617] text-white flex flex-col select-none">
      {/* Top Header Navigasi Game */}
      <header className="h-16 px-4 sm:px-8 border-b border-slate-700/60 bg-slate-900/80 backdrop-blur-md flex items-center justify-between z-30">
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
              Mi'raj Journey: Penunggang Buroq
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
              Versi Santriwati
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

      {/* Area Arena Game */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-6 relative overflow-hidden">
        {/* Kontainer Kanvas Responsif */}
        <div className="relative w-full max-w-4xl aspect-[4/3] max-h-[75vh] rounded-3xl overflow-hidden shadow-2xl border-4 border-[#8C6A47]/60 bg-black flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain cursor-pointer touch-none"
          />

          {/* LIVE IN-GAME HUD BAR (Tampil saat Bermain) */}
          {gameState === 'PLAYING' && (
            <div className="absolute top-3 inset-x-3 sm:inset-x-6 flex items-start justify-between pointer-events-none z-10">
              {/* Badge Dimensi & Gelar */}
              <div className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-black tracking-wider uppercase border shadow-sm ${
                      currentLevel === 'DUNIA'
                        ? 'bg-amber-600/90 text-amber-100 border-amber-400'
                        : currentLevel === 'AKHIRAT'
                        ? 'bg-rose-700/90 text-rose-100 border-rose-400'
                        : 'bg-emerald-600/90 text-emerald-100 border-emerald-300 animate-pulse'
                    }`}
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

              {/* High Score & Skor Live */}
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-300 bg-black/50 px-3 py-1 rounded-full border border-slate-700 backdrop-blur-xs">
                  Rekor Terbaik: <strong className="text-amber-400">{highScore}</strong>
                </div>
              </div>
            </div>
          )}

          {/* OVERLAY: LAYAR AWAL (START SCREEN) */}
          {gameState === 'START' && (
            <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-slate-900/90 to-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 space-y-4">
              {/* Animasi Preview Karakter */}
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 animate-bounce duration-1000">
                <img
                  src="/images/game/santriwati-buroq-transparent.png"
                  alt="Santriwati Penunggang Buroq"
                  className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(245,158,11,0.4)]"
                />
              </div>

              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold tracking-widest uppercase mb-1">
                  Game Arkade Santriwati
                </span>
                <h1 className="text-2xl sm:text-4xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-300 tracking-wide leading-tight">
                  Mi'raj Journey: Penunggang Buroq
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mt-1 leading-relaxed">
                  Kendalikan santriwati menunggangi Buroq bersayap emas melintasi 3 dimensi spiritual hingga Sidratul Muntaha.
                </p>
              </div>

              {/* Form Input Nama Santriwati */}
              <div className="w-full max-w-xs space-y-1.5 text-left">
                <label className="block text-[11px] font-bold text-slate-300">
                  Nama Santriwati Penunggang Buroq:
                </label>
                <input
                  type="text"
                  value={namaSantri}
                  onChange={(e) => setNamaSantri(e.target.value)}
                  placeholder="Masukkan nama santriwati..."
                  maxLength={24}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border-2 border-amber-500/60 text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 uppercase text-center placeholder:text-slate-500"
                />
              </div>

              {/* Tombol Mulai */}
              <button
                type="button"
                onClick={startGame}
                className="w-full max-w-xs py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm sm:text-base tracking-wider shadow-lg shadow-amber-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 border border-yellow-200 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-slate-950" />
                <span>MULAI SAFAR (BISMILLAH)</span>
              </button>

              <div className="flex items-center space-x-4 text-xs text-slate-400 pt-1">
                <span>⌨️ Tekan <strong className="text-amber-300">Spasi</strong> / Klik / Tap Layar untuk Terbang</span>
              </div>
            </div>
          )}

          {/* OVERLAY: GAME OVER MODAL */}
          {gameState === 'GAMEOVER' && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500/50 flex items-center justify-center text-3xl">
                ✨
              </div>

              <div>
                <h2 className="text-xl sm:text-3xl font-serif font-black text-rose-400 tracking-wide">
                  Perjalanan Terhenti
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Alhamdulillah atas pencapaian safar yang telah dilalui
                </p>
              </div>

              {/* Rekap Nilai & Gelar */}
              <div className="w-full max-w-xs bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 space-y-2">
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

              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full max-w-xs pt-1">
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
                  👑 Khatimatul Maqam Al-A'la
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
        </div>

        {/* Ringkasan Kontrol di Bawah Arena */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
          <div className="flex items-center space-x-1.5">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[11px] border border-slate-700">Spasi</span>
            <span>atau</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[11px] border border-slate-700">Klik / Tap</span>
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
                  Panduan Perjalanan Spiritual & Kekuatan
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
                    <strong className="text-rose-400">Level 2: Akhirat (Skor 31–100):</strong> Langit merah pekat temaram & jembatan hisab. Rintangan pilar obsidian hitam berduri yang bergerak naik-turun perlahan (celah 135 px).
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
                    <span className="text-[11px] text-slate-400">Menahan 1 benturan tabrakan dan menghancurkan pilar jadi serpihan cahaya.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                    <strong className="text-sky-400 block">⚡ Kilat Buroq</strong>
                    <span className="text-[11px] text-slate-400">Melesat kencang otomatis menembus semua rintangan selama 3 detik tanpa takut benturan.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                    <strong className="text-emerald-400 block">📿 Magnet Tasbih</strong>
                    <span className="text-[11px] text-slate-400">Menarik seluruh butiran cahaya pahala di sekitar selama 6 detik secara otomatis.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                    <strong className="text-cyan-400 block">💧 Air Kautsar</strong>
                    <span className="text-[11px] text-slate-400">Memperlambat gerakan 30% dan merampingkan hitbox santriwati selama 5 detik.</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-emerald-400 text-sm mb-1">3. Tingkatan Gelar Santriwati:</h4>
                <ul className="space-y-1 list-disc pl-4 text-[11px]">
                  <li>Skor 1 – 30: <strong>Musafirah Dunia</strong></li>
                  <li>Skor 31 – 100: <strong>Mujahidah Hisab</strong></li>
                  <li>Skor 101 – 499: <strong>Khadimah Roudhoh</strong></li>
                  <li>Skor 500 – 999: <strong>Sayyidatul Firdaus</strong></li>
                  <li>Skor 1000: <strong>👑 Khatimatul Maqam Al-A'la (Puncak Tertinggi)</strong></li>
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
    </div>
  );
}
