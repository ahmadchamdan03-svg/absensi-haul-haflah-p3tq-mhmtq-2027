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
      {/* Batang Horizontal Utama Derek Konstruksi (Navy + Garis Emas di Tengah) */}
      <div
        className="relative w-64 sm:w-80 h-5 rounded-md border border-[#F5C56B]/60 shadow-lg flex items-center justify-center overflow-hidden"
        style={{
          marginTop: `${CRANE_PIVOT_Y - 18}px`,
          backgroundColor: PALETTE.crane.beam,
        }}
      >
        {/* Struktur Rangka Truss Derek */}
        <svg
          viewBox="0 0 320 20"
          className="absolute inset-0 w-full h-full opacity-40"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 18 L20 2 L40 18 L60 2 L80 18 L100 2 L120 18 L140 2 L160 18 L180 2 L200 18 L220 2 L240 18 L260 2 L280 18 L300 2 L320 18"
            fill="none"
            stroke={PALETTE.crane.beamHighlight}
            strokeWidth="1.5"
          />
        </svg>

        {/* Garis Emas Tipis di Tengah Batang Horizontal */}
        <div
          className="relative z-10 w-full h-[2px]"
          style={{
            backgroundColor: PALETTE.crane.beamHighlight,
          }}
        />
      </div>

      {/* Rumah Troli & Poros Ayunan (Pivot Lingkaran Emas) */}
      <div className="relative z-20 -mt-2.5 flex flex-col items-center">
        <div
          className="w-8 h-2.5 rounded-sm border border-[#F5C56B]/70"
          style={{ backgroundColor: '#0F2C59' }}
        />
        <div
          className="w-5 h-5 -mt-1.5 rounded-full flex items-center justify-center shadow-md"
          style={{
            backgroundColor: PALETTE.crane.pivot,
            border: `2.5px solid ${PALETTE.crane.beam}`,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: PALETTE.crane.beam }}
          />
        </div>
      </div>

      {/* Grup Ayunan Pendulum: Tali Perak Tipis + Kait (Hook J) + Blok */}
      <div
        ref={craneGroupElRef}
        className="relative flex flex-col items-center will-change-transform"
        style={{
          marginTop: '-4px',
          transformOrigin: '50% 0px',
          transform: `rotate(${-angleRef.current}rad)`,
        }}
      >
        {/* Tali Perak / Putih Tipis */}
        <div
          className="rounded-full shadow-xs"
          style={{
            width: '2px',
            height: `${CRANE_ROPE_LENGTH - 18}px`,
            backgroundColor: PALETTE.crane.rope,
          }}
        />

        {/* Kait Konstruksi (Hook Bentuk Huruf J Terbalik / Kait Emas) */}
        <svg
          viewBox="0 0 28 22"
          className="w-7 h-[18px] -mt-0.5 shrink-0 drop-shadow-sm"
          aria-hidden="true"
        >
          {/* Blok Katrol Kecil di Atas Kait */}
          <rect
            x="9"
            y="0"
            width="10"
            height="5"
            rx="1.5"
            fill="#0F2C59"
            stroke={PALETTE.crane.hook}
            strokeWidth="1.5"
          />
          {/* Kait Huruf J */}
          <path
            d="M14 5 V12 C14 16.5 9.5 18.5 7.5 15.5 C6.5 14 7.5 12.2 9.2 12.2"
            fill="none"
            stroke={PALETTE.crane.hook}
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          {/* Kabel Penyangga ke Sudut Blok */}
          <path
            d="M14 16 L4 22 M14 16 L24 22"
            stroke={PALETTE.crane.rope}
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>

        {/* Blok yang Digantung */}
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
