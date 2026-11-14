'use client';

import React, { useEffect } from 'react';
import { BlockType } from '../_lib/engine';
import {
  BLOCK_HEIGHT,
  BLOCK_WIDTH,
  CRANE_PIVOT_Y,
  CRANE_ROPE_LENGTH,
  PALETTE,
} from '../_lib/palette';

interface CraneProps {
  angleRef: React.MutableRefObject<number>;
  craneGroupElRef: React.MutableRefObject<HTMLDivElement | null>;
  isBlockVisible: boolean;
  nextFloorIndex: number;
  blockType?: BlockType;
}

export function BuildingBlockVisual({
  colorIndex,
  isBaseFloor = false,
  blockType = 'normal',
}: {
  colorIndex: number;
  isBaseFloor?: boolean;
  blockType?: BlockType;
}) {
  if (blockType === 'taman') {
    const t = PALETTE.specialBlocks.taman;
    return (
      <div
        className="relative w-full h-full rounded-[3px] overflow-hidden flex flex-col justify-between"
        style={{
          backgroundColor: t.fill,
          border: `2px solid ${t.border}`,
        }}
      >
        <div
          className="w-full h-2.5 shrink-0 flex items-center justify-around px-2"
          style={{
            backgroundColor: t.roof,
          }}
        >
          {[0, 1, 2, 3].map((leaf) => (
            <span
              key={leaf}
              className="w-2.5 h-1.5 rounded-t-full -mt-1"
              style={{ backgroundColor: t.leafAccent }}
            />
          ))}
        </div>

        <div className="flex-1 flex items-center justify-evenly px-2 py-1">
          <div
            className="w-4 h-5 rounded-[2px]"
            style={{
              backgroundColor: t.windowLit,
              border: `1.5px solid ${t.windowDark}`,
            }}
          />
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: t.windowDark,
              border: `1.5px solid ${t.border}`,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="none"
              stroke={t.leafAccent}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          </div>
          <div
            className="w-4 h-5 rounded-[2px]"
            style={{
              backgroundColor: t.windowLit,
              border: `1.5px solid ${t.windowDark}`,
            }}
          />
        </div>

        <div
          className="w-full h-1 shrink-0"
          style={{ backgroundColor: t.border }}
        />
      </div>
    );
  }

  if (blockType === 'kaca') {
    const k = PALETTE.specialBlocks.kaca;
    return (
      <div
        className="relative w-full h-full rounded-[3px] overflow-hidden flex flex-col justify-between backdrop-blur-xs"
        style={{
          backgroundColor: k.fill,
          border: `2px solid ${k.border}`,
          boxShadow: 'inset 0 0 10px rgba(224, 242, 254, 0.45)',
        }}
      >
        <div
          className="w-full h-2 shrink-0"
          style={{
            backgroundColor: k.roof,
          }}
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-y-2 left-4 w-5 rotate-12 bg-white/30"
        />

        <div className="relative z-10 flex-1 flex items-center justify-evenly px-2 py-1">
          {[0, 1, 2].map((winIdx) => (
            <div
              key={winIdx}
              className="w-4 h-5 rounded-[2px] flex flex-col justify-between p-[2px]"
              style={{
                backgroundColor: k.windowLit,
                border: `1.5px solid ${k.windowDark}`,
              }}
            >
              <div
                className="w-full h-[1.5px] my-auto"
                style={{ backgroundColor: k.windowDark }}
              />
            </div>
          ))}
        </div>

        <div
          className="w-full h-1 shrink-0"
          style={{ backgroundColor: k.border }}
        />
      </div>
    );
  }

  const paletteIdx = Math.abs(colorIndex) % PALETTE.blocks.length;
  const fill = PALETTE.blocks[paletteIdx];
  const roof = PALETTE.blockRoofs[paletteIdx];
  const border = PALETTE.blockBorders[paletteIdx];

  return (
    <div
      className="relative w-full h-full rounded-[3px] overflow-hidden flex flex-col justify-between"
      style={{
        backgroundColor: fill,
        border: `2px solid ${border}`,
      }}
    >
      <div
        className="w-full h-2 shrink-0"
        style={{
          backgroundColor: roof,
        }}
      />

      <div className="flex-1 flex items-center justify-evenly px-2 py-1">
        {[0, 1, 2].map((winIdx) => {
          if (isBaseFloor && winIdx === 1) {
            return (
              <div
                key={winIdx}
                className="w-4 h-6 rounded-t-sm self-end flex flex-col items-center justify-start pt-0.5"
                style={{
                  backgroundColor: PALETTE.blockDoor,
                  border: `1.5px solid ${PALETTE.blockWindowDark}`,
                }}
              >
                <div
                  className="w-full h-1"
                  style={{ backgroundColor: PALETTE.blockAwning }}
                />
              </div>
            );
          }

          return (
            <div
              key={winIdx}
              className="w-4 h-5 rounded-[2px] flex flex-col justify-between p-[2px]"
              style={{
                backgroundColor: PALETTE.blockWindowLit,
                border: `1.5px solid ${PALETTE.blockWindowDark}`,
              }}
            >
              <div
                className="w-full h-[1.5px] my-auto"
                style={{ backgroundColor: PALETTE.blockWindowDark }}
              />
            </div>
          );
        })}
      </div>

      <div
        className="w-full h-1 shrink-0"
        style={{ backgroundColor: border }}
      />
    </div>
  );
}

export default function Crane({
  angleRef,
  craneGroupElRef,
  isBlockVisible,
  nextFloorIndex,
  blockType = 'normal',
}: CraneProps) {
  useEffect(() => {
    if (craneGroupElRef.current) {
      craneGroupElRef.current.style.transform = `rotate(${-angleRef.current}rad)`;
    }
  }, [angleRef, craneGroupElRef]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col items-center"
    >
      <div
        className="w-44 h-3 rounded-b-md flex items-center justify-around px-2"
        style={{
          marginTop: `${CRANE_PIVOT_Y - 12}px`,
          backgroundColor: PALETTE.crane.beam,
          borderBottom: `2px solid ${PALETTE.crane.beamHighlight}`,
        }}
      >
        {[0, 1, 2, 3, 4].map((stripe) => (
          <span
            key={stripe}
            className="w-2 h-1.5 rounded-xs"
            style={{ backgroundColor: PALETTE.crane.beamHighlight }}
          />
        ))}
      </div>

      <div
        className="w-4 h-4 -mt-2 rounded-full z-10"
        style={{
          backgroundColor: PALETTE.crane.pivot,
          border: `2px solid ${PALETTE.crane.beam}`,
        }}
      />

      <div
        ref={craneGroupElRef}
        className="relative flex flex-col items-center will-change-transform"
        style={{
          marginTop: '-6px',
          transformOrigin: '50% 0px',
          transform: `rotate(${-angleRef.current}rad)`,
        }}
      >
        <div
          style={{
            width: '3px',
            height: `${CRANE_ROPE_LENGTH}px`,
            backgroundColor: PALETTE.crane.rope,
          }}
        />

        <div
          className="w-4 h-2.5 rounded-b-full -mt-0.5"
          style={{
            backgroundColor: PALETTE.crane.hook,
          }}
        />

        <div
          className="transition-opacity duration-75"
          style={{
            width: `${BLOCK_WIDTH}px`,
            height: `${BLOCK_HEIGHT}px`,
            opacity: isBlockVisible ? 1 : 0,
          }}
        >
          <BuildingBlockVisual
            colorIndex={nextFloorIndex}
            isBaseFloor={nextFloorIndex === 0}
            blockType={blockType}
          />
        </div>
      </div>
    </div>
  );
}
