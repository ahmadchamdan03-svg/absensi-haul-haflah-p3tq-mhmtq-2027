'use client';

import React, { useEffect } from 'react';
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
}

export function BuildingBlockVisual(_props?: {
  colorIndex?: number;
  isBaseFloor?: boolean;
}) {
  return (
    <img
      src="/images/blok-bangunan.png"
      alt=""
      draggable={false}
      className="w-full h-full object-cover object-center select-none pointer-events-none block"
    />
  );
}

export default function Crane({
  angleRef,
  craneGroupElRef,
  isBlockVisible,
  nextFloorIndex,
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
        <div
          className="rounded-full shadow-xs"
          style={{
            width: '2px',
            height: `${CRANE_ROPE_LENGTH - 18}px`,
            backgroundColor: PALETTE.crane.rope,
          }}
        />

        <svg
          viewBox="0 0 28 22"
          className="w-7 h-[18px] -mt-0.5 shrink-0 drop-shadow-sm"
          aria-hidden="true"
        >
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
          <path
            d="M14 5 V12 C14 16.5 9.5 18.5 7.5 15.5 C6.5 14 7.5 12.2 9.2 12.2"
            fill="none"
            stroke={PALETTE.crane.hook}
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path
            d="M14 16 L4 22 M14 16 L24 22"
            stroke={PALETTE.crane.rope}
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>

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
          />
        </div>
      </div>
    </div>
  );
}
