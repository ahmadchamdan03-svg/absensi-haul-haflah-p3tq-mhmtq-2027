'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
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

export default function BangunKotaAdminGamePage() {
  const router = useRouter();
  const {
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
  } = useGameEngine();

  const [surrenderDialogOpen, setSurrenderDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.title = 'Bangun Kota (City Bloxx) | Haflah P3TQ';
  }, []);

  const handleConfirmSurrender = () => {
    setSurrenderDialogOpen(false);
    surrender();
  };

  const gameLayer = (
    <div
      className="fixed inset-0 z-[9999] bg-[#07142B] overflow-hidden touch-none select-none"
      style={{
        backgroundColor: PALETTE.skyBaseFallback,
      }}
    >
      {phase === 'idle' && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 overflow-hidden touch-none"
          style={{
            background: PALETTE.sky[0],
          }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none bg-cover bg-center bg-no-repeat opacity-35 mix-blend-luminosity"
            style={{
              backgroundImage: "url('/images/panggung-aula.jpg')",
            }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, rgba(7, 20, 43, 0.55) 0%, rgba(15, 44, 89, 0.35) 55%, rgba(7, 20, 43, 0.72) 100%)',
            }}
          />

          <div
            className="absolute left-3 sm:left-6 top-0 z-20"
            style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
          >
            <button
              type="button"
              aria-label="Keluar ke Lobby Hiburan"
              title="Keluar ke Lobby Hiburan"
              onClick={() => router.push('/admin/hiburan')}
              className="flex items-center justify-center min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-sm font-black transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C56B] cursor-pointer shadow-md"
            >
              X
            </button>
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0"
          >
            <div
              className="w-full"
              style={{
                height: `${GROUND_HEIGHT}px`,
                backgroundColor: PALETTE.ground.soil,
                borderTop: `4px solid ${PALETTE.ground.grass}`,
              }}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-md rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 sm:p-7 text-white shadow-2xl"
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
                style={{ color: PALETTE.accentJayyid }}
              >
                Lobby Hiburan • Mode Tanpa Batas
              </p>

              <h1 className="mt-1 text-2xl sm:text-3xl font-serif font-black tracking-tight text-white">
                Bangun Kota (City Bloxx)
              </h1>

              <p className="mt-2 text-sm leading-relaxed text-white/90">
                Susun menara setinggi mungkin. Seimbangkan presisi dan ritme dengan mengetuk layar saat ayunan derek sejajar puncak menara.
              </p>
            </div>

            <div className="mt-5 rounded-xl bg-white/10 border border-white/20 p-3.5 space-y-2 text-xs sm:text-sm">
              <div className="flex items-center justify-between">
                <span
                  className="font-bold"
                  style={{ color: PALETTE.accentJayyid }}
                >
                  Jayyid (&lt;5% selisih)
                </span>
                <span className="font-semibold text-white">
                  Kombo 2x lipat • +100x
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-white">
                  Mutawasith (5–25%)
                </span>
                <span className="font-semibold text-white">
                  Kombo +1 • +50x
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span
                  className="font-bold"
                  style={{ color: PALETTE.accentRodi }}
                >
                  {"Rodi' (>25% selisih)"}
                </span>
                <span className="font-semibold text-white">
                  Blok jatuh • Menara aman
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={start}
              className="mt-6 w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] border border-white/25 text-white text-base font-extrabold tracking-wide transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C56B] cursor-pointer shadow-md"
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
            blockType={currentBlockType}
          />

          <FallingBlock
            fallingBlockRef={fallingBlock}
            fallingBlockElRef={fallingBlockElRef}
            floorIndex={fallingBlock.current.colorIndex}
            blockType={fallingBlockType}
            shatterEvent={shatterEvent}
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

  if (mounted && typeof document !== 'undefined') {
    return createPortal(gameLayer, document.body);
  }

  return gameLayer;
}
