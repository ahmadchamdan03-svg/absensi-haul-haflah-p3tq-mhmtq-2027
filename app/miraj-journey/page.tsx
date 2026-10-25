'use client';

import React, { useState, useEffect, useRef } from 'react';
import MirajHero, {
  DimensiLevel,
  LeaderboardEntry,
  getGelarByScore,
} from '@/components/miraj-journey/MirajHero';
import MirajTimeline from '@/components/miraj-journey/MirajTimeline';
import MirajInteractive from '@/components/miraj-journey/MirajInteractive';

export default function MirajJourneyGamePage() {
  // Status Layar Game
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER' | 'VICTORY'>('START');
  const [namaSantri, setNamaSantri] = useState<string>('Santriwati P3TQ');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [leaderboardOpen, setLeaderboardOpen] = useState<boolean>(false);
  const [panduanOpen, setPanduanOpen] = useState<boolean>(false);

  // Live HUD States
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [currentLevel, setCurrentLevel] = useState<DimensiLevel>('DUNIA');
  const [currentGelar, setCurrentGelar] = useState<string>('Musafirah Dunia');
  const [activeShield, setActiveShield] = useState<boolean>(false);
  const [dashTimeLeft, setDashTimeLeft] = useState<number>(0);
  const [magnetTimeLeft, setMagnetTimeLeft] = useState<number>(0);
  const [slowTimeLeft, setSlowTimeLeft] = useState<number>(0);

  // Leaderboard Data (Mulai Kosong)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Refs untuk audio synth, engine loop, dan image sprite
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const buroqSpriteRef = useRef<HTMLImageElement | null>(null);

  // Muat data tersimpan dari LocalStorage
  useEffect(() => {
    try {
      const savedName = localStorage.getItem('miraj_player_name');
      if (savedName) setNamaSantri(savedName);

      const savedHigh = localStorage.getItem('miraj_high_score');
      if (savedHigh) setHighScore(parseInt(savedHigh, 10) || 0);

      const savedLb = localStorage.getItem('miraj_leaderboard');
      if (savedLb) {
        const parsed = JSON.parse(savedLb);
        // Bersihkan data dummy lama bila ada
        const filtered = (Array.isArray(parsed) ? parsed : []).filter(
          (item) =>
            item.nama !== 'Fatimah Zahra' &&
            item.nama !== 'Aisyah Humaira' &&
            item.nama !== 'Nabila Khansa' &&
            item.nama !== 'Zulfa Zakiyah' &&
            item.nama !== 'Maryam Nurul' &&
            item.nama !== "Khadijah Al-Qur'ani"
        );
        setLeaderboard(filtered);
        localStorage.setItem('miraj_leaderboard', JSON.stringify(filtered));
      } else {
        setLeaderboard([]);
      }
    } catch {}

    // Preload image sprite (Karakter Santriwati Murni Tanpa Lingkaran Gelap)
    const img = new Image();
    img.src = '/images/game/santriwati-buroq-pure.png';
    buroqSpriteRef.current = img;

    // Bersihkan AudioContext saat unmount
    return () => {
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch {}
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // --- GAME ENGINE & STATE MANAGEMENT ---
  const saveLeaderboardEntry = (skorAkhir: number) => {
    const gelar = getGelarByScore(skorAkhir);
    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const newEntry: LeaderboardEntry = {
      nama: namaSantri.trim() || 'Santriwati',
      gelar,
      skor: skorAkhir,
      tanggal: dateStr,
    };

    setLeaderboard((prev) => {
      const updated = [...prev, newEntry]
        .sort((a, b) => b.skor - a.skor)
        .slice(0, 10);
      try {
        localStorage.setItem('miraj_leaderboard', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (skorAkhir > highScore) {
      setHighScore(skorAkhir);
      try {
        localStorage.setItem('miraj_high_score', skorAkhir.toString());
      } catch {}
    }
  };

  const startGame = () => {
    try {
      localStorage.setItem('miraj_player_name', namaSantri.trim() || 'Santriwati');
    } catch {}

    setCurrentScore(0);
    setCurrentLevel('DUNIA');
    setCurrentGelar('Musafirah Dunia');
    setActiveShield(false);
    setDashTimeLeft(0);
    setMagnetTimeLeft(0);
    setSlowTimeLeft(0);
    setGameState('PLAYING');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1E293B] via-[#0F172A] to-[#020617] text-white flex flex-col select-none">
      {/* 1. Bagian Hero / Header Navigasi Game */}
      <MirajHero
        gameState={gameState}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        setLeaderboardOpen={setLeaderboardOpen}
        setPanduanOpen={setPanduanOpen}
      />

      {/* 2. Bagian Timeline & Arena Perjalanan 3 Dimensi Miraj */}
      <MirajTimeline
        gameState={gameState}
        setGameState={setGameState}
        namaSantri={namaSantri}
        setNamaSantri={setNamaSantri}
        soundEnabled={soundEnabled}
        currentScore={currentScore}
        setCurrentScore={setCurrentScore}
        highScore={highScore}
        currentLevel={currentLevel}
        setCurrentLevel={setCurrentLevel}
        currentGelar={currentGelar}
        setCurrentGelar={setCurrentGelar}
        activeShield={activeShield}
        setActiveShield={setActiveShield}
        dashTimeLeft={dashTimeLeft}
        setDashTimeLeft={setDashTimeLeft}
        magnetTimeLeft={magnetTimeLeft}
        setMagnetTimeLeft={setMagnetTimeLeft}
        slowTimeLeft={slowTimeLeft}
        setSlowTimeLeft={setSlowTimeLeft}
        startGame={startGame}
        saveLeaderboardEntry={saveLeaderboardEntry}
        setLeaderboardOpen={setLeaderboardOpen}
        audioCtxRef={audioCtxRef}
        animationFrameRef={animationFrameRef}
        buroqSpriteRef={buroqSpriteRef}
      />

      {/* 3. Bagian Modal Interaktif (Papan Peringkat & Panduan) */}
      <MirajInteractive
        leaderboardOpen={leaderboardOpen}
        setLeaderboardOpen={setLeaderboardOpen}
        panduanOpen={panduanOpen}
        setPanduanOpen={setPanduanOpen}
        leaderboard={leaderboard}
      />
    </div>
  );
}
