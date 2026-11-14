'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Crane from './_components/Crane';
import FallingBlock from './_components/FallingBlock';
import GameStage from './_components/GameStage';
import HUD from './_components/HUD';
import JudgementFlash from './_components/JudgementFlash';
import SummaryScreen from './_components/SummaryScreen';
import SurrenderDialog from './_components/SurrenderDialog';
import Tower from './_components/Tower';
import { useGameEngine } from './_hooks/useGameEngine';
import {
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
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-cover bg-center bg-no-repeat scale-105"
        style={{
          backgroundImage: "url('/images/aula-utama.jpg')",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none backdrop-blur-xl bg-black/50"
      />

      <div className="w-full h-[100dvh] max-w-[500px] mx-auto relative overflow-hidden bg-slate-900 shadow-2xl">
        {phase === 'idle' && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 overflow-hidden touch-none"
            style={{
              background: PALETTE.sky[0],
            }}
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none bg-cover bg-top bg-no-repeat"
              style={{
                backgroundImage: "url('/images/aula-utama.jpg')",
                backgroundPosition: 'center top',
              }}
            />

            <div
              className="absolute left-3.5 top-0 z-20"
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
              className="relative z-10 w-full max-w-sm rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 sm:p-8 text-white shadow-2xl flex flex-col items-center text-center gap-5"
            >
              <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-white">
                Mari Membangun Kota
              </h1>

              <button
                type="button"
                onClick={start}
                className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] border border-white/25 text-white text-base font-extrabold tracking-wide transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C56B] cursor-pointer shadow-md"
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
    </div>
  );

  if (mounted && typeof document !== 'undefined') {
    return createPortal(gameLayer, document.body);
  }

  return gameLayer;
}
