// =====================================================================
// DATA KONFIGURASI, FISIKA & RENDERER 3 DIMENSI PERJALANAN MI'RAJ
// =====================================================================

import {
  DimensiLevel,
  PowerUpType,
  PowerUpItem,
  PahalaStar,
  ObstaclePillar,
  Particle,
  getGelarByScore,
} from '@/components/miraj-journey/MirajHero';

export const VIRTUAL_WIDTH = 800;
export const VIRTUAL_HEIGHT = 600;
export const GRAVITY = 0.36;
export const JUMP_IMPULSE = -7.4;

export interface MirajDimensionInfo {
  id: DimensiLevel;
  urutan: number;
  judul: string;
  rentangSkor: string;
  deskripsi: string;
  warnaBadge: string;
}

export const MIRAJ_DIMENSIONS_DATA: MirajDimensionInfo[] = [
  {
    id: 'DUNIA',
    urutan: 1,
    judul: 'Level 1: Dunia (Skor 1–30)',
    rentangSkor: '1–30',
    deskripsi:
      'Suasana bukit senja asri. Rintangan pilar batu reruntuhan statis dengan celah sangat lebar (160 px).',
    warnaBadge: 'bg-amber-600/90 text-amber-100 border-amber-400',
  },
  {
    id: 'AKHIRAT',
    urutan: 2,
    judul: 'Level 2: Akhirat (Skor 31–100)',
    rentangSkor: '31–100',
    deskripsi:
      'Langit merah pekat temaram & jembatan hisab. Rintangan pilar obsidian hitam berduri yang bergerak naik-turun perlahan (celah 135 px).',
    warnaBadge: 'bg-rose-700/90 text-rose-100 border-rose-400',
  },
  {
    id: 'SURGA',
    urutan: 3,
    judul: 'Level 3: Surga (Skor 101–1000)',
    rentangSkor: '101–1000',
    deskripsi:
      'Alam cahaya Sidratul Muntaha. Celah kembali diperlebar menjadi 155 px (flow state) dan tingkat kesulitan naik bertahap hingga tamat di skor 1000.',
    warnaBadge: 'bg-emerald-600/90 text-emerald-100 border-emerald-300 animate-pulse',
  },
];

export interface MirajBirdState {
  x: number;
  y: number;
  vy: number;
  width: number;
  height: number;
  rotation: number;
  hitboxRadius: number;
}

export interface MirajEngineMutableState {
  bird: MirajBirdState;
  score: number;
  frameCount: number;
  isGameOver: boolean;
  isVictory: boolean;
  shield: boolean;
  dashFrames: number;
  magnetFrames: number;
  slowFrames: number;
  pillars: ObstaclePillar[];
  powerUps: PowerUpItem[];
  pahalaStars: PahalaStar[];
  particles: Particle[];
  bgOffsetFar: number;
  bgOffsetMid: number;
  bgOffsetNear: number;
}

export function createInitialMirajEngineState(): MirajEngineMutableState {
  return {
    bird: {
      x: 140,
      y: 280,
      vy: 0,
      width: 78,
      height: 78,
      rotation: 0,
      hitboxRadius: 24,
    },
    score: 0,
    frameCount: 0,
    isGameOver: false,
    isVictory: false,
    shield: false,
    dashFrames: 0,
    magnetFrames: 0,
    slowFrames: 0,
    pillars: [],
    powerUps: [],
    pahalaStars: [],
    particles: [],
    bgOffsetFar: 0,
    bgOffsetMid: 0,
    bgOffsetNear: 0,
  };
}

export function spawnMirajPillar(state: MirajEngineMutableState) {
  const { score, pillars, powerUps, pahalaStars } = state;
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
    moveSpeed = 0.9;
  } else {
    currentDim = 'SURGA';
    if (score <= 150) {
      gap = 155;
    } else {
      const tier = Math.floor((score - 150) / 50);
      gap = Math.max(115, 155 - tier * 2.5);
    }
    if (score > 350) {
      moveSpeed = 1.3;
    }
  }

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
    pahalaStars.push({
      x: VIRTUAL_WIDTH + 40 + 35,
      y: topHeight + gap / 2,
      collected: false,
      angle: 0,
    });
  }
}

export function updateMirajPhysicsStep(
  state: MirajEngineMutableState,
  callbacks: {
    setDashTimeLeft: (v: number) => void;
    setMagnetTimeLeft: (v: number) => void;
    setSlowTimeLeft: (v: number) => void;
    setActiveShield: (v: boolean) => void;
    setGameState: (v: 'START' | 'PLAYING' | 'GAMEOVER' | 'VICTORY') => void;
    setCurrentScore: (v: number) => void;
    setCurrentLevel: (v: DimensiLevel) => void;
    setCurrentGelar: (v: string) => void;
    saveLeaderboardEntry: (skor: number) => void;
    playSoundScore: () => void;
    playSoundPowerUp: () => void;
    playSoundShieldBreak: () => void;
    playSoundCrash: () => void;
    playSoundVictory: () => void;
  }
) {
  state.frameCount++;

  const isSlowActive = state.slowFrames > 0;
  const timeScale = isSlowActive ? 0.7 : 1.0;

  let baseScrollSpeed = 2.5;
  let currentDim: DimensiLevel = 'DUNIA';

  if (state.score <= 30) {
    currentDim = 'DUNIA';
    baseScrollSpeed = 2.5;
  } else if (state.score <= 100) {
    currentDim = 'AKHIRAT';
    baseScrollSpeed = 3.2;
  } else {
    currentDim = 'SURGA';
    if (state.score <= 150) {
      baseScrollSpeed = 3.0;
    } else {
      const tier = Math.floor((state.score - 150) / 50);
      baseScrollSpeed = 3.0 + tier * 0.09;
    }
  }

  const isDashActive = state.dashFrames > 0;
  const effectiveSpeed = (isDashActive ? baseScrollSpeed * 1.7 : baseScrollSpeed) * timeScale;

  state.bgOffsetFar += effectiveSpeed * 0.2;
  state.bgOffsetMid += effectiveSpeed * 0.5;
  state.bgOffsetNear += effectiveSpeed * 0.9;

  if (state.dashFrames > 0) state.dashFrames--;
  if (state.magnetFrames > 0) state.magnetFrames--;
  if (state.slowFrames > 0) state.slowFrames--;

  callbacks.setDashTimeLeft(Math.ceil(state.dashFrames / 60));
  callbacks.setMagnetTimeLeft(Math.ceil(state.magnetFrames / 60));
  callbacks.setSlowTimeLeft(Math.ceil(state.slowFrames / 60));
  callbacks.setActiveShield(state.shield);

  if (state.score >= 1000 && !state.isVictory) {
    state.isVictory = true;
    callbacks.setGameState('VICTORY');
    callbacks.playSoundVictory();
    callbacks.saveLeaderboardEntry(1000);

    state.pillars.forEach((p) => {
      for (let i = 0; i < 25; i++) {
        state.particles.push({
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
    state.pillars = [];
  }

  const { bird, particles, pillars, powerUps, pahalaStars } = state;

  if (!state.isVictory) {
    bird.vy += GRAVITY * timeScale;
    if (bird.vy > 9.0) bird.vy = 9.0;
    bird.y += bird.vy * timeScale;

    bird.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 6, (bird.vy / 10) * 0.5));

    if (bird.y - bird.hitboxRadius < 0) {
      bird.y = bird.hitboxRadius;
      bird.vy = 0;
    }

    if (bird.y + bird.hitboxRadius > VIRTUAL_HEIGHT - 30) {
      if (!isDashActive) {
        state.isGameOver = true;
        callbacks.setGameState('GAMEOVER');
        callbacks.playSoundCrash();
        callbacks.saveLeaderboardEntry(state.score);
      } else {
        bird.y = VIRTUAL_HEIGHT - 30 - bird.hitboxRadius;
        bird.vy = -3;
      }
    }
  } else {
    bird.y += Math.sin(state.frameCount * 0.05) * 0.8;
    bird.rotation = Math.sin(state.frameCount * 0.03) * 0.05;
  }

  const tailX = bird.x - 28;
  const tailY = bird.y + 12;
  for (let i = 0; i < (isDashActive ? 4 : 2); i++) {
    particles.push({
      x: tailX,
      y: tailY + (Math.random() - 0.5) * 12,
      vx: -(effectiveSpeed * 0.8 + Math.random() * 2),
      vy: (Math.random() - 0.5) * 2,
      size: isDashActive ? 5 + Math.random() * 4 : 3 + Math.random() * 3,
      color: isDashActive ? '#38BDF8' : Math.random() > 0.5 ? '#EF4444' : '#F59E0B',
      alpha: 0.9,
      decay: isDashActive ? 0.03 : 0.04,
      type: 'FLAME',
    });
  }

  if (!state.isVictory) {
    const lastPillar = pillars[pillars.length - 1];
    const pillarSpacing = 280;
    if (!lastPillar || VIRTUAL_WIDTH - lastPillar.x >= pillarSpacing) {
      spawnMirajPillar(state);
    }
  }

  for (let i = pillars.length - 1; i >= 0; i--) {
    const p = pillars[i];
    p.x -= effectiveSpeed;

    if (p.moveSpeed > 0) {
      p.moveOffset = Math.sin(state.frameCount * 0.035 * p.moveSpeed) * 35;
    }

    if (!p.passed && p.x + 70 < bird.x) {
      p.passed = true;
      state.score++;
      callbacks.setCurrentScore(state.score);
      callbacks.setCurrentLevel(currentDim);
      callbacks.setCurrentGelar(getGelarByScore(state.score));
      callbacks.playSoundScore();
    }

    const effectiveTop = p.topHeight + p.moveOffset;
    const effectiveBottom = VIRTUAL_HEIGHT - (p.bottomHeight - p.moveOffset);
    const pillarWidth = 70;
    const playerRadius = isSlowActive ? 18 : bird.hitboxRadius;

    const inPillarX =
      bird.x + playerRadius > p.x && bird.x - playerRadius < p.x + pillarWidth;
    const hitTopPillar = bird.y - playerRadius < effectiveTop;
    const hitBottomPillar = bird.y + playerRadius > effectiveBottom;

    if (inPillarX && (hitTopPillar || hitBottomPillar)) {
      if (isDashActive) {
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
      } else if (state.shield) {
        state.shield = false;
        callbacks.setActiveShield(false);
        callbacks.playSoundShieldBreak();

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
        pillars.splice(i, 1);
        continue;
      } else {
        state.isGameOver = true;
        callbacks.setGameState('GAMEOVER');
        callbacks.playSoundCrash();
        callbacks.saveLeaderboardEntry(state.score);
      }
    }

    if (p.x < -100) {
      pillars.splice(i, 1);
    }
  }

  for (let i = powerUps.length - 1; i >= 0; i--) {
    const item = powerUps[i];
    item.x -= effectiveSpeed;
    item.pulseAngle += 0.06;

    const dist = Math.hypot(bird.x - item.x, bird.y - item.y);
    if (dist < bird.hitboxRadius + 22 && !item.collected) {
      item.collected = true;
      callbacks.playSoundPowerUp();

      if (item.type === 'SHIELD') {
        state.shield = true;
        callbacks.setActiveShield(true);
      } else if (item.type === 'DASH') {
        state.dashFrames = 180;
      } else if (item.type === 'MAGNET') {
        state.magnetFrames = 360;
      } else if (item.type === 'SLOW') {
        state.slowFrames = 300;
      }

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

  for (let i = pahalaStars.length - 1; i >= 0; i--) {
    const star = pahalaStars[i];
    star.x -= effectiveSpeed;
    star.angle += 0.05;

    if (state.magnetFrames > 0) {
      const dist = Math.hypot(bird.x - star.x, bird.y - star.y);
      if (dist < 220) {
        star.x += (bird.x - star.x) * 0.12;
        star.y += (bird.y - star.y) * 0.12;
      }
    }

    const dist = Math.hypot(bird.x - star.x, bird.y - star.y);
    if (dist < bird.hitboxRadius + 18 && !star.collected) {
      star.collected = true;
      state.score += 2;
      callbacks.setCurrentScore(state.score);
      callbacks.setCurrentGelar(getGelarByScore(state.score));
      callbacks.playSoundScore();

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

  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i];
    pt.x += pt.vx;
    pt.y += pt.vy;
    pt.alpha -= pt.decay;
    if (pt.alpha <= 0) {
      particles.splice(i, 1);
    }
  }
}

export function drawMirajScene(
  ctx: CanvasRenderingContext2D,
  state: MirajEngineMutableState,
  currentLevel: DimensiLevel,
  buroqSprite: HTMLImageElement | null
) {
  ctx.clearRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

  const level = currentLevel;
  const {
    bird,
    score,
    frameCount,
    shield,
    dashFrames,
    magnetFrames,
    pillars,
    powerUps,
    pahalaStars,
    particles,
    bgOffsetFar,
    bgOffsetMid,
    bgOffsetNear,
  } = state;

  if (level === 'DUNIA') {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, VIRTUAL_HEIGHT);
    skyGrad.addColorStop(0, '#B45309');
    skyGrad.addColorStop(0.4, '#D97706');
    skyGrad.addColorStop(0.7, '#FBBF24');
    skyGrad.addColorStop(1, '#FEF3C7');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    ctx.beginPath();
    ctx.arc(VIRTUAL_WIDTH - 140, 160, 55, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(254, 243, 199, 0.45)';
    ctx.fill();

    ctx.fillStyle = '#78350F';
    ctx.globalAlpha = 0.35;
    const mosqueW = 180;
    for (
      let x = -((bgOffsetFar * 0.5) % mosqueW);
      x < VIRTUAL_WIDTH + mosqueW;
      x += mosqueW
    ) {
      ctx.beginPath();
      ctx.arc(x + 90, 420, 45, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(x + 20, 310, 14, 150);
      ctx.fillRect(x + 145, 310, 14, 150);
      ctx.beginPath();
      ctx.moveTo(x + 18, 310);
      ctx.lineTo(x + 27, 280);
      ctx.lineTo(x + 36, 310);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

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

    ctx.fillStyle = '#064E3B';
    ctx.fillRect(0, VIRTUAL_HEIGHT - 35, VIRTUAL_WIDTH, 35);
  } else if (level === 'AKHIRAT') {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, VIRTUAL_HEIGHT);
    skyGrad.addColorStop(0, '#1E1B4B');
    skyGrad.addColorStop(0.3, '#450A0A');
    skyGrad.addColorStop(0.7, '#7F1D1D');
    skyGrad.addColorStop(1, '#991B1B');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    if (frameCount % 160 < 4) {
      ctx.fillStyle = 'rgba(254, 202, 202, 0.25)';
      ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
    }

    ctx.strokeStyle = '#FCA5A5';
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(-100, 360);
    ctx.quadraticCurveTo(VIRTUAL_WIDTH / 2, 280, VIRTUAL_WIDTH + 100, 360);
    ctx.stroke();
    ctx.globalAlpha = 1.0;

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

    const lavaGrad = ctx.createLinearGradient(0, VIRTUAL_HEIGHT - 35, 0, VIRTUAL_HEIGHT);
    lavaGrad.addColorStop(0, '#DC2626');
    lavaGrad.addColorStop(1, '#7F1D1D');
    ctx.fillStyle = lavaGrad;
    ctx.fillRect(0, VIRTUAL_HEIGHT - 35, VIRTUAL_WIDTH, 35);
  } else {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, VIRTUAL_HEIGHT);
    skyGrad.addColorStop(0, '#FEF08A');
    skyGrad.addColorStop(0.4, '#FDE68A');
    skyGrad.addColorStop(0.7, '#E0F2FE');
    skyGrad.addColorStop(1, '#F8FAFC');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

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

    const floorGrad = ctx.createLinearGradient(0, VIRTUAL_HEIGHT - 35, 0, VIRTUAL_HEIGHT);
    floorGrad.addColorStop(0, '#FDE68A');
    floorGrad.addColorStop(1, '#F59E0B');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, VIRTUAL_HEIGHT - 35, VIRTUAL_WIDTH, 35);
  }

  // 2. GAMBAR PILAR RINTANGAN
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
      const pillarGrad = ctx.createLinearGradient(p.x, 0, p.x + pWidth, 0);
      pillarGrad.addColorStop(0, '#78350F');
      pillarGrad.addColorStop(0.5, '#B45309');
      pillarGrad.addColorStop(1, '#92400E');
      ctx.fillStyle = pillarGrad;

      ctx.fillRect(p.x, 0, pWidth, topH);
      ctx.fillStyle = '#D97706';
      ctx.fillRect(p.x - 5, topH - 18, pWidth + 10, 18);

      ctx.fillStyle = pillarGrad;
      ctx.fillRect(p.x, botY, pWidth, botH);
      ctx.fillStyle = '#D97706';
      ctx.fillRect(p.x - 5, botY, pWidth + 10, 18);
    } else if (p.dimensi === 'AKHIRAT') {
      const pillarGrad = ctx.createLinearGradient(p.x, 0, p.x + pWidth, 0);
      pillarGrad.addColorStop(0, '#0F172A');
      pillarGrad.addColorStop(0.5, '#1E293B');
      pillarGrad.addColorStop(1, '#0F172A');
      ctx.fillStyle = pillarGrad;

      ctx.fillRect(p.x, 0, pWidth, topH);
      ctx.beginPath();
      ctx.moveTo(p.x, topH);
      ctx.lineTo(p.x + pWidth / 2, topH + 15);
      ctx.lineTo(p.x + pWidth, topH);
      ctx.fillStyle = '#EF4444';
      ctx.fill();

      ctx.fillStyle = pillarGrad;
      ctx.fillRect(p.x, botY, pWidth, botH);
      ctx.beginPath();
      ctx.moveTo(p.x, botY);
      ctx.lineTo(p.x + pWidth / 2, botY - 15);
      ctx.lineTo(p.x + pWidth, botY);
      ctx.fillStyle = '#EF4444';
      ctx.fill();
    } else {
      const pillarGrad = ctx.createLinearGradient(p.x, 0, p.x + pWidth, 0);
      pillarGrad.addColorStop(0, '#FFFFFF');
      pillarGrad.addColorStop(0.5, '#F8FAFC');
      pillarGrad.addColorStop(1, '#E2E8F0');
      ctx.fillStyle = pillarGrad;

      ctx.fillRect(p.x, 0, pWidth, topH);
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(p.x - 6, topH - 16, pWidth + 12, 16);

      ctx.fillStyle = pillarGrad;
      ctx.fillRect(p.x, botY, pWidth, botH);
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(p.x - 6, botY, pWidth + 12, 16);

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

    ctx.beginPath();
    ctx.arc(0, 0, 19, 0, Math.PI * 2);
    if (item.type === 'SHIELD') ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
    else if (item.type === 'DASH') ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
    else if (item.type === 'MAGNET') ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
    else ctx.fillStyle = 'rgba(6, 182, 212, 0.35)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    if (item.type === 'SHIELD') ctx.fillStyle = '#F59E0B';
    else if (item.type === 'DASH') ctx.fillStyle = '#0284C7';
    else if (item.type === 'MAGNET') ctx.fillStyle = '#059669';
    else ctx.fillStyle = '#0891B2';
    ctx.fill();

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

  if (dashFrames > 0) {
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.fill();
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

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

  if (magnetFrames > 0) {
    ctx.save();
    ctx.rotate(frameCount * 0.08);
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 44, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 44, Math.sin(a) * 44, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#34D399';
      ctx.fill();
    }
    ctx.restore();
  }

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

  if (buroqSprite && buroqSprite.complete) {
    const flapOffset = Math.sin(frameCount * 0.3) * 3;
    const scaleFlap = 1 + Math.sin(frameCount * 0.3) * 0.04;
    ctx.save();
    ctx.scale(1, scaleFlap);
    ctx.drawImage(
      buroqSprite,
      -bird.width / 2,
      -bird.height / 2 + flapOffset,
      bird.width,
      bird.height
    );
    ctx.restore();
  } else {
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

  // 7. HUD ATAS
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'black 22px serif';
  ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 6;
  ctx.fillText(`Skor: ${score}`, 24, 42);
  ctx.shadowBlur = 0;
}
