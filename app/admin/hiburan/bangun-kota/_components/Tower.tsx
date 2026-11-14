'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PlacedBlock } from '../_lib/engine';
import {
  BLOCK_HEIGHT,
  BLOCK_WIDTH,
  GROUND_HEIGHT,
  PALETTE,
} from '../_lib/palette';
import { BuildingBlockVisual } from './Crane';

interface TowerProps {
  placedBlocks: PlacedBlock[];
  cameraOffsetY: number;
  topBlockWorldX: number;
  wobbleKey: number;
}

export default function Tower({
  placedBlocks,
  cameraOffsetY,
  topBlockWorldX,
  wobbleKey,
}: TowerProps) {
  const startRenderIndex = Math.max(0, placedBlocks.length - 18);
  const visibleBlocks = placedBlocks.slice(startRenderIndex);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 z-10"
      style={{
        bottom: `${GROUND_HEIGHT}px`,
      }}
    >
      <div
        className="relative w-full transition-transform duration-300 ease-out will-change-transform"
        style={{
          transform: `translate3d(${-topBlockWorldX}px, ${cameraOffsetY}px, 0)`,
        }}
      >
        <div
          className="absolute left-1/2 rounded-t-sm"
          style={{
            width: `${BLOCK_WIDTH + 28}px`,
            height: '12px',
            bottom: '-10px',
            transform: `translate3d(${-(BLOCK_WIDTH + 28) / 2}px, 0, 0)`,
            backgroundColor: PALETTE.ground.foundationFill,
            border: `2px solid ${PALETTE.ground.foundationBorder}`,
          }}
        />

        <motion.div
          key={wobbleKey}
          animate={
            wobbleKey > 0
              ? { x: [0, -2, 2, -1, 0] }
              : { x: 0 }
          }
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="relative w-full"
        >
          {visibleBlocks.map((block, localIdx) => {
            const floorIndex = startRenderIndex + localIdx;
            const bottomPx = floorIndex * BLOCK_HEIGHT;

            return (
              <div
                key={block.id}
                className="absolute left-1/2 will-change-transform"
                style={{
                  width: `${block.width}px`,
                  height: `${block.height}px`,
                  bottom: `${bottomPx}px`,
                  transform: `translate3d(${block.x - block.width / 2}px, 0, 0)`,
                }}
              >
                <BuildingBlockVisual
                  colorIndex={floorIndex}
                  isBaseFloor={floorIndex === 0}
                  blockType={block.type}
                />
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
