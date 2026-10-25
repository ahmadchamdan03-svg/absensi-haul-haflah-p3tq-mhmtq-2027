'use client';

import React, { useEffect, useRef } from 'react';
import { Shield, Zap } from 'lucide-react';
import {
  DimensiLevel,
  PowerUpType,
  PowerUpItem,
  PahalaStar,
  ObstaclePillar,
  Particle,
  getGelarByScore,
} from './MirajHero';
import {
  createMirajAudioFunctions,
  MirajArenaOverlays,
} from './MirajInteractive';

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

  // --- CANVAS GAME LOOP & PHYSICS ENGINE (3 DIMENSI MIRAJ) ---
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
              color:
                item.type === 'SHIELD'
                  ? '#F59E0B'
                  : item.type === 'DASH'
                  ? '#38BDF8'
                  : item.type === 'MAGNET'
                  ? '#10B981'
                  : '#06B6D4',
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
          const rayAngle = i * 0.28 + frameCount * 0.002;
          ctx.beginPath();
          ctx.moveTo(VIRTUAL_WIDTH / 2, -50);
          ctx.lineTo(VIRTUAL_WIDTH / 2 + Math.cos(rayAngle) * 900, Math.sin(rayAngle) * 900);
          ctx.lineTo(
            VIRTUAL_WIDTH / 2 + Math.cos(rayAngle + 0.14) * 900,
            Math.sin(rayAngle + 0.14) * 900
          );
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

      // Efek Hembusan Angin Emas (Golden Flight Breeze) di Belakang Buroq
      ctx.save();
      for (let i = 0; i < 3; i++) {
        const offsetTrail = (i + 1) * 16;
        const trailAlpha = 0.35 - i * 0.1;
        const wave = Math.sin(frameCount * 0.2 + i * 1.5) * 5;
        ctx.beginPath();
        ctx.moveTo(-bird.width / 2, wave);
        ctx.bezierCurveTo(
          -bird.width / 2 - offsetTrail * 0.6,
          wave + 5,
          -bird.width / 2 - offsetTrail * 1.3,
          wave - 5,
          -bird.width / 2 - offsetTrail * 2,
          wave * 0.5
        );
        ctx.strokeStyle = `rgba(251, 191, 36, ${Math.max(0.1, trailAlpha)})`;
        ctx.lineWidth = 3 - i * 0.8;
        ctx.stroke();
      }
      ctx.restore();

      // Gambar Sprite Karakter Santriwati Penunggang Buroq (Animasi Kibasan Halus)
      if (buroqSpriteRef.current && buroqSpriteRef.current.complete) {
        const flapOffset = Math.sin(frameCount * 0.3) * 3;
        const scaleFlap = 1 + Math.sin(frameCount * 0.3) * 0.04;
        ctx.save();
        ctx.scale(1, scaleFlap);
        ctx.drawImage(
          buroqSpriteRef.current,
          -bird.width / 2,
          -bird.height / 2 + flapOffset,
          bird.width,
          bird.height
        );
        ctx.restore();
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
    <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-6 relative overflow-hidden">
      {/* Kontainer Kanvas Responsif (Adaptif Layar HP & Layar Penuh) */}
      <div className="relative w-full max-w-4xl h-[78vh] sm:h-auto sm:aspect-[4/3] max-h-[85vh] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-2 sm:border-4 border-[#8C6A47]/60 bg-black flex items-center justify-center">
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
        )}

        {/* OVERLAY INTERAKTIF (START, GAMEOVER, VICTORY) */}
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
