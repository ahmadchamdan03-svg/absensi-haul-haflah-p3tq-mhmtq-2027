'use client';

import React, { useEffect } from 'react';
import { FallingBlockState } from '../_hooks/useGameEngine';
import { BLOCK_HEIGHT, BLOCK_WIDTH } from '../_lib/palette';
import { BuildingBlockVisual } from './Crane';

interface FallingBlockProps {
  fallingBlockRef: React.MutableRefObject<FallingBlockState>;
  fallingBlockElRef: React.MutableRefObject<HTMLDivElement | null>;
  floorIndex: number;
}

export default function FallingBlock({
  fallingBlockRef,
  fallingBlockElRef,
  floorIndex,
}: FallingBlockProps) {
  useEffect(() => {
    const el = fallingBlockElRef.current;
    if (!el) return;
    const fb = fallingBlockRef.current;
    if (fb.active) {
      el.style.opacity = '1';
      el.style.transform = `translate3d(${fb.x - BLOCK_WIDTH / 2}px, ${fb.y}px, 0) rotate(${fb.rotation}deg)`;
    } else {
      el.style.opacity = '0';
      el.style.transform = 'translate3d(-9999px, -9999px, 0)';
    }
  }, [fallingBlockRef, fallingBlockElRef]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-1/2 z-20"
    >
      <div
        ref={fallingBlockElRef}
        className="will-change-transform"
        style={{
          width: `${BLOCK_WIDTH}px`,
          height: `${BLOCK_HEIGHT}px`,
          opacity: 0,
          transform: 'translate3d(-9999px, -9999px, 0)',
        }}
      >
        <BuildingBlockVisual
          colorIndex={floorIndex}
          isBaseFloor={floorIndex === 0}
        />
      </div>
    </div>
  );
}
