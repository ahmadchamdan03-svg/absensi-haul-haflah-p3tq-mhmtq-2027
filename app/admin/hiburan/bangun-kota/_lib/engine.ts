import {
  PALETTE,
  PENDULUM_AMPLITUDE,
  PENDULUM_PERIOD_MS,
  TOLERANCE_JAYYID,
  TOLERANCE_MUTAWASITH,
  WIND_MIN_HEIGHT,
} from './palette';

export type Judgement = 'jayyid' | 'mutawasith' | 'rodi';

export type BlockType = 'normal';

export type PlacedBlock = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  judgement: Judgement;
  comboAtPlacement: number;
  type: BlockType;
};

export type GamePhase = 'idle' | 'playing' | 'surrendered';

export interface AABBBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function classifyOffset(offsetX: number, blockWidth: number): Judgement {
  if (blockWidth <= 0) return 'rodi';
  const normalizedOffset = Math.abs(offsetX) / blockWidth;
  if (normalizedOffset < TOLERANCE_JAYYID) {
    return 'jayyid';
  }
  if (normalizedOffset <= TOLERANCE_MUTAWASITH) {
    return 'mutawasith';
  }
  return 'rodi';
}

export function nextCombo(currentCombo: number, judgement: Judgement): number {
  if (judgement === 'jayyid') {
    return (currentCombo + 1) * 2;
  }
  if (judgement === 'mutawasith') {
    return currentCombo + 1;
  }
  return 0;
}

export function scoreForJudgement(judgement: Judgement, combo: number): number {
  if (judgement === 'jayyid') {
    return 100 * combo;
  }
  if (judgement === 'mutawasith') {
    return 50 * combo;
  }
  return 0;
}

export function windAcceleration(height: number, tMs: number): number {
  if (height < WIND_MIN_HEIGHT) {
    return 0;
  }
  return Math.sin(tMs / 400) * Math.min(120, (height - 20) * 8);
}

export function calculatePendulumAngle(tMs: number): number {
  return Math.sin((tMs / PENDULUM_PERIOD_MS) * Math.PI * 2) * PENDULUM_AMPLITUDE;
}

export function checkAABB(a: AABBBox, b: AABBBox): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function calculateLandingY(
  groundTopY: number,
  visibleTowerBlocks: number,
  blockHeight: number,
  borderOffset = 0
): { blockBelowTopY: number; landingY: number } {
  const blockBelowTopY = groundTopY - visibleTowerBlocks * blockHeight;
  const landingY = blockBelowTopY - blockHeight - borderOffset;
  return { blockBelowTopY, landingY };
}

export function getSkyIndex(height: number): number {
  if (height < 10) return 0;
  if (height < 20) return 1;
  if (height < 35) return 2;
  return Math.min(3, PALETTE.sky.length - 1);
}

export function getJudgementLabel(judgement: Judgement): string {
  if (judgement === 'jayyid') return 'Jayyid';
  if (judgement === 'mutawasith') return 'Mutawasith';
  return "Rodi'";
}
