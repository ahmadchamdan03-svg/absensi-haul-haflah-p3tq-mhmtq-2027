'use client';

import { Judgement } from './engine';

let audioCtx: AudioContext | null = null;
let bgmTimerId: ReturnType<typeof setInterval> | null = null;
let bgmActive = false;
let bgmStepIndex = 0;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const CtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (CtxClass) {
        audioCtx = new CtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function initAudio(): void {
  getAudioContext();
}

export function playWhoosh(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const duration = 0.24;
    const sampleRate = ctx.sampleRate;
    const frameCount = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < frameCount; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(950, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(
      260,
      ctx.currentTime + duration
    );
    filter.Q.setValueAtTime(1.8, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noiseSource.start(ctx.currentTime);
    noiseSource.stop(ctx.currentTime + duration);
  } catch {
    // Ignore audio errors on restricted environments
  }
}

export function playDing(
  judgementOrPitch: Judgement | number = 1.0,
  pitchMultiplier = 1.0
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    let baseFreq = 660;
    if (typeof judgementOrPitch === 'number') {
      baseFreq = 660 * judgementOrPitch;
    } else if (judgementOrPitch === 'jayyid') {
      baseFreq = 880 * pitchMultiplier;
    } else if (judgementOrPitch === 'mutawasith') {
      baseFreq = 660 * pitchMultiplier;
    } else {
      baseFreq = 300 * pitchMultiplier;
    }

    const now = ctx.currentTime;
    const duration = judgementOrPitch === 'rodi' ? 0.28 : 0.36;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    if (judgementOrPitch === 'jayyid') {
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, now + 0.12);
    } else if (judgementOrPitch === 'rodi') {
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.65, now + duration);
    }

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  } catch {
    // Ignore audio errors
  }
}

export function playGlassShatter(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const duration = 0.22;
    const sampleRate = ctx.sampleRate;
    const frameCount = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < frameCount; i++) {
      const decay = 1 - i / frameCount;
      data[i] = (Math.random() * 2 - 1) * decay;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2400, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + duration);

    const chimeFreqs = [2100, 2650, 3200];
    chimeFreqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      const startOffset = now + idx * 0.025;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startOffset);
      oscGain.gain.setValueAtTime(0.08, startOffset);
      oscGain.gain.exponentialRampToValueAtTime(0.001, startOffset + 0.09);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(startOffset);
      osc.stop(startOffset + 0.09);
    });
  } catch {
    // Ignore audio errors
  }
}

const LOFI_MELODY_HZ = [293.66, 329.63, 392.0, 440.0, 392.0, 329.63, 261.63, 293.66];

export function playBGM(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  stopBGM();
  bgmActive = true;
  bgmStepIndex = 0;

  const playNote = () => {
    if (!bgmActive) return;
    const activeCtx = getAudioContext();
    if (!activeCtx) return;

    try {
      const now = activeCtx.currentTime;
      const freq = LOFI_MELODY_HZ[bgmStepIndex % LOFI_MELODY_HZ.length];
      bgmStepIndex += 1;

      const osc = activeCtx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      const noteGain = activeCtx.createGain();
      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.linearRampToValueAtTime(0.075, now + 0.08);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.62);

      const delay = activeCtx.createDelay(0.5);
      delay.delayTime.setValueAtTime(0.28, now);

      const feedback = activeCtx.createGain();
      feedback.gain.setValueAtTime(0.25, now);

      osc.connect(noteGain);
      noteGain.connect(activeCtx.destination);
      noteGain.connect(delay);
      delay.connect(feedback);
      feedback.connect(activeCtx.destination);

      osc.start(now);
      osc.stop(now + 0.65);
    } catch {
      // Ignore audio errors
    }
  };

  playNote();
  bgmTimerId = setInterval(playNote, 720);
}

export function stopBGM(): void {
  bgmActive = false;
  if (bgmTimerId !== null) {
    clearInterval(bgmTimerId);
    bgmTimerId = null;
  }
}
