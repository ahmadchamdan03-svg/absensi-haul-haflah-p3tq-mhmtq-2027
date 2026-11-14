'use client';

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FallingBlockState, ShatterEvent } from '../_hooks/useGameEngine';
import { BlockType } from '../_lib/engine';
import { BLOCK_HEIGHT, BLOCK_WIDTH, PALETTE } from '../_lib/palette';
import { BuildingBlockVisual } from './Crane';

interface FallingBlockProps {
  fallingBlockRef: React.MutableRefObject<FallingBlockState>;
  fallingBlockElRef: React.MutableRefObject<HTMLDivElement | null>;
  floorIndex: number;
  blockType?: BlockType;
  shatterEvent?: ShatterEvent | null;
}

const SHARD_OFFSETS = [
  { dx: -44, dy: -32, rot: -65, w: 14, h: 10 },
  { dx: -20, dy: -46, rot: 45, w: 12, h: 12 },
  { dx: 18, dy: -42, rot: -40, w: 15, h: 10 },
  { dx: 46, dy: -28, rot: 70, w: 12, h: 14 },
  { dx: -36, dy: 24, rot: -85, w: 16, h: 11 },
  { dx: 0, dy: 34, rot: 55, w: 14, h: 12 },
  { dx: 38, dy: 26, rot: 90, w: 15, h: 10 },
];

export default function FallingBlock({
  fallingBlockRef,
  fallingBlockElRef,
  floorIndex,
  blockType = 'normal',
  shatterEvent = null,
}: FallingBlockProps) {
  useEffect(() => {
    const el = fallingBlockElRef.current;
    if (!el) return;
    const fb = fallingBlockRef.current;
    if (fb.active) {
      const rotationDeg = fb.missed ? fb.rotation : 0;
      el.style.opacity = '1';
      el.style.transform = `translate3d(${fb.x - BLOCK_WIDTH / 2}px, ${fb.y}px, 0) rotate(${rotationDeg}deg)`;
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
          blockType={blockType}
        />
      </div>

      <AnimatePresence>
        {shatterEvent && (
          <motion.div
            key={shatterEvent.id}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="absolute top-0 left-0"
            style={{
              transform: `translate3d(${shatterEvent.x}px, ${shatterEvent.y + BLOCK_HEIGHT / 2}px, 0)`,
            }}
          >
            {SHARD_OFFSETS.map((shard, idx) => (
              <motion.span
                key={idx}
                initial={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 0.95 }}
                animate={{
                  x: shard.dx,
                  y: shard.dy + 28,
                  rotate: shard.rot,
                  scale: 0.35,
                  opacity: 0,
                }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="absolute rounded-[2px] border border-white/80"
                style={{
                  width: `${shard.w}px`,
                  height: `${shard.h}px`,
                  backgroundColor: PALETTE.specialBlocks.kaca.shardColor,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
