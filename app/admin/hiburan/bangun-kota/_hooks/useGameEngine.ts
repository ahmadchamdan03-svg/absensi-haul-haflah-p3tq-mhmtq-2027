'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BlockType,
  calculateLandingY,
  calculatePendulumAngle,
  checkAABB,
  classifyOffset,
  GamePhase,
  Judgement,
  nextCombo,
  PlacedBlock,
  rollBlockType,
  scoreForJudgement,
  windAcceleration,
} from '../_lib/engine';
import {
  initAudio,
  playBGM,
  playDing,
  playGlassShatter,
  playWhoosh,
  stopBGM,
} from '../_lib/audio';
import {
  BLOCK_HEIGHT,
  BLOCK_WIDTH,
  CRANE_PIVOT_Y,
  CRANE_ROPE_LENGTH,
  GRAVITY,
  GROUND_HEIGHT,
  MAX_VISIBLE_TOWER_BLOCKS,
} from '../_lib/palette';

export interface JudgementCounts {
  jayyid: number;
  mutawasith: number;
  rodi: number;
}

export interface FallingBlockState {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  windBias: number;
  missed: boolean;
  rotation: number;
  colorIndex: number;
  type: BlockType;
}

export interface FlashEvent {
  id: number;
  judgement: Judgement;
  combo: number;
  points: number;
  blockType?: BlockType;
  shattered?: boolean;
}

export interface ShatterEvent {
  id: number;
  x: number;
  y: number;
}

export function useGameEngine() {
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [score, setScore] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [longestCombo, setLongestCombo] = useState<number>(0);
  const [judgementCounts, setJudgementCounts] = useState<JudgementCounts>({
    jayyid: 0,
    mutawasith: 0,
    rodi: 0,
  });
  const [placedBlocks, setPlacedBlocks] = useState<PlacedBlock[]>([]);
  const [isBlockInCrane, setIsBlockInCrane] = useState<boolean>(true);
  const [currentBlockType, setCurrentBlockType] = useState<BlockType>('normal');
  const [fallingBlockType, setFallingBlockType] = useState<BlockType>('normal');
  const [lastFlash, setLastFlash] = useState<FlashEvent | null>(null);
  const [shatterEvent, setShatterEvent] = useState<ShatterEvent | null>(null);
  const [wobbleKey, setWobbleKey] = useState<number>(0);
  const [currentWind, setCurrentWind] = useState<number>(0);

  const phaseRef = useRef<GamePhase>('idle');
  const scoreRef = useRef<number>(0);
  const heightRef = useRef<number>(0);
  const comboRef = useRef<number>(0);
  const longestComboRef = useRef<number>(0);
  const judgementCountsRef = useRef<JudgementCounts>({
    jayyid: 0,
    mutawasith: 0,
    rodi: 0,
  });
  const placedBlocksRef = useRef<PlacedBlock[]>([]);
  const currentBlockTypeRef = useRef<BlockType>('normal');

  const pendulumAngle = useRef<number>(0);
  const pendulumTime = useRef<number>(0);
  const fallingBlock = useRef<FallingBlockState>({
    active: false,
    x: 0,
    y: 0,
    vy: 0,
    windBias: 0,
    missed: false,
    rotation: 0,
    colorIndex: 0,
    type: 'normal',
  });
  const lastFrameTime = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);
  const flashCounterRef = useRef<number>(0);
  const shatterCounterRef = useRef<number>(0);

  const stageElRef = useRef<HTMLDivElement | null>(null);
  const craneGroupElRef = useRef<HTMLDivElement | null>(null);
  const fallingBlockElRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      stopBGM();
    };
  }, []);

  const applyDomTransforms = useCallback(() => {
    if (craneGroupElRef.current) {
      craneGroupElRef.current.style.transform = `rotate(${-pendulumAngle.current}rad)`;
    }
    if (fallingBlockElRef.current) {
      const fb = fallingBlock.current;
      if (fb.active) {
        const rotationDeg = fb.missed ? fb.rotation : 0;
        fallingBlockElRef.current.style.opacity = '1';
        fallingBlockElRef.current.style.transform = `translate3d(${fb.x - BLOCK_WIDTH / 2}px, ${fb.y}px, 0) rotate(${rotationDeg}deg)`;
      } else {
        fallingBlockElRef.current.style.opacity = '0';
        fallingBlockElRef.current.style.transform = 'translate3d(-9999px, -9999px, 0)';
      }
    }
  }, []);

  const prepareNextCraneBlock = useCallback((nextFloorNumber: number) => {
    const nextType = rollBlockType(nextFloorNumber);
    currentBlockTypeRef.current = nextType;
    setCurrentBlockType(nextType);
    setIsBlockInCrane(true);
  }, []);

  const finalizeDrop = useCallback(
    (offsetX: number) => {
      const rawJudgement = classifyOffset(offsetX, BLOCK_WIDTH);
      const droppedType = fallingBlock.current.type;

      // Blok Kaca hanya menerima penilaian Jayyid; selain itu pecah dan dianggap Rodi'
      const isGlassShattered =
        droppedType === 'kaca' && rawJudgement !== 'jayyid';
      const judgement: Judgement = isGlassShattered ? 'rodi' : rawJudgement;

      if (isGlassShattered) {
        playGlassShatter();
        playDing('rodi', 0.8);
        shatterCounterRef.current += 1;
        setShatterEvent({
          id: shatterCounterRef.current,
          x: fallingBlock.current.x,
          y: fallingBlock.current.y,
        });
      } else if (judgement === 'jayyid') {
        playDing('jayyid', 1.2);
      } else if (judgement === 'mutawasith') {
        playDing('mutawasith', 1.0);
      } else {
        playDing('rodi', 0.8);
      }

      const updatedCombo = nextCombo(comboRef.current, judgement);
      const earnedScore = scoreForJudgement(judgement, updatedCombo);

      comboRef.current = updatedCombo;
      setCombo(updatedCombo);

      if (updatedCombo > longestComboRef.current) {
        longestComboRef.current = updatedCombo;
        setLongestCombo(updatedCombo);
      }

      const nextCounts = {
        ...judgementCountsRef.current,
        [judgement]: judgementCountsRef.current[judgement] + 1,
      };
      judgementCountsRef.current = nextCounts;
      setJudgementCounts(nextCounts);

      flashCounterRef.current += 1;
      setLastFlash({
        id: flashCounterRef.current,
        judgement,
        combo: updatedCombo,
        points: earnedScore,
        blockType: droppedType,
        shattered: isGlassShattered,
      });

      if (judgement === 'rodi') {
        const fb = fallingBlock.current;
        if (isGlassShattered) {
          // Blok kaca pecah berkeping-keping di lokasi jatuhnya
          fb.active = false;
          fb.missed = false;
          fb.rotation = 0;
          prepareNextCraneBlock(heightRef.current + 1);
          return;
        }
        fb.missed = true;
        fb.rotation = 0;
        if (Math.abs(offsetX) < BLOCK_WIDTH) {
          fb.x = offsetX >= 0 ? BLOCK_WIDTH + 6 : -(BLOCK_WIDTH + 6);
        }
        fb.vy = Math.max(fb.vy, 950);
        fb.windBias += offsetX >= 0 ? 180 : -180;
        return;
      }

      const nextScore = scoreRef.current + earnedScore;
      scoreRef.current = nextScore;
      setScore(nextScore);

      const prevBlocks = placedBlocksRef.current;
      const prevTopX =
        prevBlocks.length > 0 ? prevBlocks[prevBlocks.length - 1].x : 0;
      const placedX = prevBlocks.length === 0 ? 0 : prevTopX + offsetX;
      const nextHeight = prevBlocks.length + 1;

      const newBlock: PlacedBlock = {
        id: `floor-${nextHeight}`,
        x: placedX,
        y: nextHeight * BLOCK_HEIGHT,
        width: BLOCK_WIDTH,
        height: BLOCK_HEIGHT,
        judgement,
        comboAtPlacement: updatedCombo,
        type: droppedType,
      };

      const nextBlocks = [...prevBlocks, newBlock];
      placedBlocksRef.current = nextBlocks;
      heightRef.current = nextHeight;

      setPlacedBlocks(nextBlocks);
      setHeight(nextHeight);

      // Blok Taman menetralkan goyangan menara kembali ke 0
      if (droppedType === 'taman') {
        setWobbleKey(0);
      } else if (judgement === 'mutawasith') {
        setWobbleKey((prev) => prev + 1);
      }

      fallingBlock.current.active = false;
      fallingBlock.current.missed = false;
      prepareNextCraneBlock(nextHeight + 1);
    },
    [prepareNextCraneBlock]
  );

  useEffect(() => {
    if (phase !== 'playing') {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      lastFrameTime.current = null;
      return;
    }

    let windUiTimer = 0;

    const tick = (now: number) => {
      if (lastFrameTime.current === null) {
        lastFrameTime.current = now;
      }
      const rawDt = (now - lastFrameTime.current) / 1000;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
      lastFrameTime.current = now;

      pendulumTime.current += dt * 1000;
      pendulumAngle.current = calculatePendulumAngle(pendulumTime.current);

      const windAcc = windAcceleration(heightRef.current, pendulumTime.current);
      windUiTimer += dt;
      if (windUiTimer >= 0.15) {
        windUiTimer = 0;
        setCurrentWind(Math.round(windAcc));
      }

      const fb = fallingBlock.current;
      if (fb.active) {
        fb.vy += GRAVITY * dt;
        fb.y += fb.vy * dt;
        fb.windBias += windAcc * dt;
        fb.x += fb.windBias * dt + windAcc * dt * dt;

        const stageHeight =
          stageElRef.current?.clientHeight ||
          (typeof window !== 'undefined' ? window.innerHeight : 844);
        const foundationTopY = stageHeight - GROUND_HEIGHT - 10;
        const visibleTowerBlocks = Math.min(
          placedBlocksRef.current.length,
          MAX_VISIBLE_TOWER_BLOCKS
        );
        const { blockBelowTopY, landingY } = calculateLandingY(
          foundationTopY,
          visibleTowerBlocks,
          BLOCK_HEIGHT,
          0
        );

        if (!fb.missed) {
          fb.rotation = 0;
          const isTowerEmpty = placedBlocksRef.current.length === 0;
          const targetBox = {
            x: -BLOCK_WIDTH / 2,
            y: blockBelowTopY - 2,
            width: BLOCK_WIDTH,
            height: BLOCK_HEIGHT,
          };
          const fallingBox = {
            x: fb.x - BLOCK_WIDTH / 2,
            y: fb.y,
            width: BLOCK_WIDTH,
            height: BLOCK_HEIGHT,
          };

          const hasReachedLandingLevel = fb.y >= landingY;
          const hasAABBOverlap = checkAABB(fallingBox, targetBox);

          if (hasReachedLandingLevel || hasAABBOverlap) {
            fb.y = landingY;
            fb.rotation = 0;
            const offsetX = isTowerEmpty ? 0 : fb.x;
            finalizeDrop(offsetX);
          }
        } else {
          fb.rotation += (fb.windBias >= 0 ? 140 : -140) * dt;
          if (fb.y > stageHeight + BLOCK_HEIGHT) {
            fb.active = false;
            fb.missed = false;
            fb.rotation = 0;
            prepareNextCraneBlock(heightRef.current + 1);
          }
        }
      }

      applyDomTransforms();
      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);

    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, [phase, applyDomTransforms, finalizeDrop, prepareNextCraneBlock]);

  const start = useCallback(() => {
    initAudio();
    playBGM();

    phaseRef.current = 'playing';
    scoreRef.current = 0;
    heightRef.current = 0;
    comboRef.current = 0;
    longestComboRef.current = 0;
    judgementCountsRef.current = { jayyid: 0, mutawasith: 0, rodi: 0 };
    placedBlocksRef.current = [];
    currentBlockTypeRef.current = 'normal';
    pendulumTime.current = 0;
    pendulumAngle.current = 0;
    lastFrameTime.current = null;
    fallingBlock.current = {
      active: false,
      x: 0,
      y: 0,
      vy: 0,
      windBias: 0,
      missed: false,
      rotation: 0,
      colorIndex: 0,
      type: 'normal',
    };

    setScore(0);
    setHeight(0);
    setCombo(0);
    setLongestCombo(0);
    setJudgementCounts({ jayyid: 0, mutawasith: 0, rodi: 0 });
    setPlacedBlocks([]);
    setCurrentBlockType('normal');
    setFallingBlockType('normal');
    setIsBlockInCrane(true);
    setLastFlash(null);
    setShatterEvent(null);
    setWobbleKey(0);
    setCurrentWind(0);
    setPhase('playing');
  }, []);

  const tap = useCallback(() => {
    if (phaseRef.current !== 'playing' || fallingBlock.current.active) {
      return;
    }

    playWhoosh();

    const angle = pendulumAngle.current;
    const swingRadius = CRANE_ROPE_LENGTH + BLOCK_HEIGHT / 2;
    const startCenterX = swingRadius * Math.sin(angle);
    const startTopY =
      CRANE_PIVOT_Y + swingRadius * Math.cos(angle) - BLOCK_HEIGHT / 2;
    const activeType = currentBlockTypeRef.current;

    fallingBlock.current = {
      active: true,
      x: startCenterX,
      y: startTopY,
      vy: 240,
      windBias: 0,
      missed: false,
      rotation: 0,
      colorIndex: heightRef.current,
      type: activeType,
    };

    setFallingBlockType(activeType);
    setIsBlockInCrane(false);
    applyDomTransforms();
  }, [applyDomTransforms]);

  const surrender = useCallback(() => {
    stopBGM();
    phaseRef.current = 'surrendered';
    fallingBlock.current.active = false;
    setPhase('surrendered');
  }, []);

  const cameraOffsetY =
    Math.max(0, placedBlocks.length - MAX_VISIBLE_TOWER_BLOCKS) * BLOCK_HEIGHT;
  const topBlockWorldX =
    placedBlocks.length > 0 ? placedBlocks[placedBlocks.length - 1].x : 0;

  return {
    phase,
    score,
    height,
    combo,
    longestCombo,
    judgementCounts,
    placedBlocks,
    isBlockInCrane,
    currentBlockType,
    fallingBlockType,
    lastFlash,
    shatterEvent,
    wobbleKey,
    currentWind,
    cameraOffsetY,
    topBlockWorldX,
    pendulumAngle,
    fallingBlock,
    stageElRef,
    craneGroupElRef,
    fallingBlockElRef,
    start,
    tap,
    surrender,
  };
}
