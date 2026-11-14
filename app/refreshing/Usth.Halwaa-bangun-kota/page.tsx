'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Crane, { BuildingBlockVisual } from './_components/Crane';
import FallingBlock from './_components/FallingBlock';
import GameStage from './_components/GameStage';
import HUD from './_components/HUD';
import JudgementFlash from './_components/JudgementFlash';
import SummaryScreen from './_components/SummaryScreen';
import SurrenderDialog from './_components/SurrenderDialog';
import Tower from './_components/Tower';
import { useGameEngine } from './_hooks/useGameEngine';
import {
  BLOCK_HEIGHT,
  BLOCK_WIDTH,
  GROUND_HEIGHT,
  PALETTE,
} from './_lib/palette';

export default function CityBloxxGamePage() {
  const {
    phase,
    score,
    height,
    combo,
    longestCombo,
    judgementCounts,
    placedBlocks,
    isBlockInCrane,
    lastFlash,
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
  } = useGameEngine();

  const [surrenderDialogOpen, setSurrenderDialogOpen] = useState(false);

  useEffect(() => {
    document.title = 'City Bloxx 2D — Bangun Kota';
  }, []);

  const handleConfirmSurrender = () => {
    setSurrenderDialogOpen(false);
    surrender();
  };

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden select-none">
      {phase === 'idle' && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 overflow-hidden touch-none"
          style={{
            background: PALETTE.sky[0],
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0"
          >
            <div className="relative mx-auto w-full max-w-5xl h-28">
              <div
                className="absolute bottom-0 left-[10%] w-16 h-20 rounded-t-sm"
                style={{ backgroundColor: PALETTE.ground.silhouetteFar }}
              />
              <div
                className="absolute bottom-0 right-[12%] w-20 h-24 rounded-t-sm"
                style={{ backgroundColor: PALETTE.ground.silhouetteNear }}
              />
            </div>
            <div
              className="w-full"
              style={{
                height: `${GROUND_HEIGHT}px`,
                backgroundColor: PALETTE.ground.soil,
                borderTop: `6px solid ${PALETTE.ground.grass}`,
              }}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-md rounded-2xl p-6 sm:p-7 shadow-xl"
            style={{
              backgroundColor: PALETTE.ui.surfacePrimary,
              border: `2px solid ${PALETTE.ui.borderStrong}`,
              color: PALETTE.ui.textPrimary,
            }}
          >
            <div className="flex flex-col items-center text-center">
              <div
                className="mb-4 shadow-sm"
                style={{
                  width: `${BLOCK_WIDTH}px`,
                  height: `${BLOCK_HEIGHT}px`,
                }}
              >
                <BuildingBlockVisual colorIndex={0} isBaseFloor={true} />
              </div>

              <p
                className="text-xs font-bold tracking-wider uppercase"
                style={{ color: PALETTE.ui.textSecondary }}
              >
                Usth. Halwaa • Mode Tanpa Batas
              </p>

              <h1
                className="mt-1 text-2xl sm:text-3xl font-black tracking-tight"
                style={{ color: PALETTE.ui.textPrimary }}
              >
                City Bloxx 2D: Bangun Kota
              </h1>

              <p
                className="mt-2 text-sm leading-relaxed"
                style={{ color: PALETTE.ui.textSecondary }}
              >
                Susun blok bangunan setinggi langit dalam suasana senja yang hangat. Ketuk layar saat ayunan derek sejajar dengan puncak menara.
              </p>
            </div>

            <div
              className="mt-5 rounded-xl p-3.5 space-y-2 text-xs sm:text-sm"
              style={{
                backgroundColor: PALETTE.ui.surfaceSecondary,
                border: `1.5px solid ${PALETTE.ui.borderStrong}`,
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="font-bold"
                  style={{ color: PALETTE.ui.jayyidTextOnLight }}
                >
                  Jayyid (&lt;5% selisih)
                </span>
                <span
                  className="font-semibold"
                  style={{ color: PALETTE.ui.textPrimary }}
                >
                  Kombo 2x lipat • +100x
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span
                  className="font-bold"
                  style={{ color: PALETTE.ui.mutawasithTextOnLight }}
                >
                  Mutawasith (5–25%)
                </span>
                <span
                  className="font-semibold"
                  style={{ color: PALETTE.ui.textPrimary }}
                >
                  Kombo +1 • +50x
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span
                  className="font-bold"
                  style={{ color: PALETTE.ui.rodiTextOnLight }}
                >
                  {"Rodi' (>25% selisih)"}
                </span>
                <span
                  className="font-semibold"
                  style={{ color: PALETTE.ui.textPrimary }}
                >
                  Blok jatuh • Menara aman
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={start}
              className="mt-6 w-full min-h-[48px] px-5 py-3 rounded-xl text-base font-extrabold tracking-wide transition-transform duration-150 hover:scale-[1.01] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer shadow-md"
              style={{
                backgroundColor: PALETTE.ui.ctaPrimaryBg,
                color: PALETTE.ui.ctaPrimaryText,
                border: `2px solid ${PALETTE.ui.textPrimary}`,
                outlineColor: PALETTE.ui.textPrimary,
              }}
            >
              Mulai
            </button>
          </motion.div>
        </div>
      )}

      {phase === 'playing' && (
        <GameStage
          height={height}
          currentWind={currentWind}
          cameraOffsetY={cameraOffsetY}
          stageRef={stageElRef}
          onTap={tap}
          disabledTap={surrenderDialogOpen}
        >
          <HUD
            score={score}
            combo={combo}
            height={height}
            currentWind={currentWind}
            onRequestSurrender={() => setSurrenderDialogOpen(true)}
          />

          <Crane
            angleRef={pendulumAngle}
            craneGroupElRef={craneGroupElRef}
            isBlockVisible={isBlockInCrane}
            nextFloorIndex={height}
          />

          <FallingBlock
            fallingBlockRef={fallingBlock}
            fallingBlockElRef={fallingBlockElRef}
            floorIndex={fallingBlock.current.colorIndex}
          />

          <Tower
            placedBlocks={placedBlocks}
            cameraOffsetY={cameraOffsetY}
            topBlockWorldX={topBlockWorldX}
            wobbleKey={wobbleKey}
          />

          <JudgementFlash flash={lastFlash} />
        </GameStage>
      )}

      {phase === 'surrendered' && (
        <SummaryScreen
          score={score}
          height={height}
          longestCombo={longestCombo}
          judgementCounts={judgementCounts}
          onPlayAgain={() => {
            setSurrenderDialogOpen(false);
            start();
          }}
        />
      )}

      <SurrenderDialog
        open={surrenderDialogOpen}
        onConfirm={handleConfirmSurrender}
        onCancel={() => setSurrenderDialogOpen(false)}
      />
    </div>
  );
}
