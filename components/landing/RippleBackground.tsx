'use client';

import React, { useEffect, useRef } from 'react';
import { useDevicePerformance } from '@/lib/hooks/useDevicePerformance';

const VERTEX_SHADER_SOURCE = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
    v_uv = (a_position + 1.0) * 0.5;
    v_uv.y = 1.0 - v_uv.y; // Invert Y agar sesuai orientasi tekstur browser
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = `
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform int u_mode; // 0: Desktop Mouse Ripple, 1: Mobile Rain Reveal
uniform sampler2D u_texture;

#define MAX_RIPPLES 12
uniform vec4 u_ripples[MAX_RIPPLES]; // xy: koordinat (0-1), z: usia riak (detik), w: intensitas
uniform int u_ripple_count;

varying vec2 v_uv;

void main() {
    vec2 uv = v_uv;
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);

    vec2 totalDisplacement = vec2(0.0);
    float totalReveal = 0.0;
    float totalSpec = 0.0;

    for (int i = 0; i < MAX_RIPPLES; i++) {
        if (i >= u_ripple_count) break;

        vec4 r = u_ripples[i];
        vec2 rPos = r.xy;
        float age = r.z;
        float intensity = r.w;

        if (age < 0.0 || age > 2.0) continue;

        // Jarak dalam koordinat yang dikoreksi aspek rasio
        vec2 diff = (uv - rPos) * aspect;
        float dist = length(diff);

        // Kecepatan & radius muka gelombang air
        float speed = (u_mode == 0) ? 0.42 : 0.35;
        float waveRadius = age * speed;
        float waveDist = dist - waveRadius;

        // Karakteristik fisik gelombang riak air
        float waveFreq = 26.0;
        float lifeProgress = age / 2.0;
        float waveFalloff = exp(-dist * 3.5) * (1.0 - lifeProgress);

        // Lingkaran riak terkonsentrasi di depan gelombang
        float ring = exp(-waveDist * waveDist * 140.0);
        float wave = sin(waveDist * waveFreq) * ring * waveFalloff * intensity;

        if (dist > 0.0001) {
            vec2 dir = normalize(diff);
            totalDisplacement += dir * wave * 0.028;
        }

        // Pantulan kilau cahaya air (specular water highlight)
        float spec = ring * waveFalloff * 0.35 * intensity;
        totalSpec += spec;

        // Mobile High-End Reveal Mask: tetesan air menyingkap gambar panggung di baliknya
        if (u_mode == 1) {
            float revealRadius = waveRadius * 1.35;
            float mask = smoothstep(revealRadius, 0.0, dist) * (1.0 - lifeProgress) * intensity;
            totalReveal = max(totalReveal, mask);
        }
    }

    // Warna dasar solid krem khas tema pesantren (#F5E6D3 ke #EAD8C3)
    vec3 creamTop = vec3(0.961, 0.902, 0.827);    // #F5E6D3
    vec3 creamBottom = vec3(0.918, 0.847, 0.765); // #EAD8C3
    vec3 baseCream = mix(creamTop, creamBottom, uv.y);

    // Pengambilan tekstur gambar panggung aula dengan distorsi riak
    vec2 displacedUV = clamp(uv + totalDisplacement, 0.0, 1.0);
    vec4 stageTex = texture2D(u_texture, displacedUV);

    vec3 finalColor;

    if (u_mode == 0) {
        // DESKTOP: Gambar panggung penuh dipadukan warna krem hangat dengan riak transparan interaktif
        vec3 tintedStage = mix(stageTex.rgb, baseCream, 0.28);
        // Tambahkan kilau emas lembut pada puncak riak air
        tintedStage += vec3(totalSpec * 0.95, totalSpec * 0.80, totalSpec * 0.55);
        finalColor = tintedStage;
    } else {
        // MOBILE HIGH-END: Warna krem dasar menutupi panggung; tetesan hujan membuka jendela (reveal) gambar aula
        vec3 revealedStage = stageTex.rgb + vec3(totalSpec * 0.7, totalSpec * 0.55, totalSpec * 0.4);
        finalColor = mix(baseCream, revealedStage, clamp(totalReveal * 1.15, 0.0, 0.92));
    }

    gl_FragColor = vec4(finalColor, 1.0);
}
`;

interface ActiveRipple {
  x: number;
  y: number;
  startTime: number;
  intensity: number;
}

export default function RippleBackground() {
  const { isDesktop, isHighEndMobile, isLowEnd, isReady, hasWebGL } = useDevicePerformance();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Mode Low-End atau WebGL tidak tersedia -> tidak inisialisasi WebGL
    if (!isReady || isLowEnd || !hasWebGL) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Inisialisasi konteks WebGL (optimasi powerPreference: high-performance)
    const gl =
      canvas.getContext('webgl', {
        alpha: false,
        depth: false,
        stencil: false,
        antialias: false,
        powerPreference: 'high-performance',
      }) ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);

    if (!gl) return;

    // Helper kompilasi shader
    const createShader = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn('WebGL shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertShader = createShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fragShader = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('WebGL program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Quad Buffer geometri layar penuh (-1 s/d 1)
    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    const quadVertices = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
       1.0,  1.0,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

    const aPositionLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPositionLoc);
    gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uResolutionLoc = gl.getUniformLocation(program, 'u_resolution');
    const uTimeLoc = gl.getUniformLocation(program, 'u_time');
    const uModeLoc = gl.getUniformLocation(program, 'u_mode');
    const uTextureLoc = gl.getUniformLocation(program, 'u_texture');
    const uRipplesLoc = gl.getUniformLocation(program, 'u_ripples');
    const uRippleCountLoc = gl.getUniformLocation(program, 'u_ripple_count');

    // Tekstur Panggung Aula Al-Muktamar
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Placeholder 1x1 piksel krem agar render awal instan tanpa kedip hitam
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([245, 230, 211, 255])
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Muat gambar panggung resmi secara asinkron
    let isTextureLoaded = false;
    const stageImg = new Image();
    stageImg.crossOrigin = 'anonymous';

    const uploadTexture = () => {
      if (!gl || gl.isContextLost()) return;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, stageImg);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      isTextureLoaded = true;
    };

    stageImg.onload = uploadTexture;
    stageImg.src = '/images/panggung-haul-haflah.jpg';
    if (stageImg.complete) {
      uploadTexture();
    }

    if (uTextureLoc) gl.uniform1i(uTextureLoc, 0);

    // Mode: 0 = Desktop Ripple, 1 = Mobile Rain Reveal
    const renderMode = isDesktop ? 0 : 1;
    if (uModeLoc) gl.uniform1i(uModeLoc, renderMode);

    // Penyesuaian resolusi layar & DPR (Dibatasi maks 1.5 untuk efisiensi GPU)
    const resizeCanvas = () => {
      if (!canvas || !gl || gl.isContextLost()) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const displayWidth = Math.floor(window.innerWidth * dpr);
      const displayHeight = Math.floor(window.innerHeight * dpr);

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, displayWidth, displayHeight);
        if (uResolutionLoc) {
          gl.uniform2f(uResolutionLoc, displayWidth, displayHeight);
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });

    // State Riak Air
    let activeRipples: ActiveRipple[] = [];
    let lastMousePos = { x: -1, y: -1, time: 0 };
    let lastRainDropTime = 0;
    let nextRainDropInterval = 0.6; // Detik interval tetesan mobile

    // Inisialisasi riak lembut di awal agar efek air langsung tampak hidup saat halaman dibuka
    if (isDesktop) {
      activeRipples.push({
        x: 0.5,
        y: 0.5,
        startTime: performance.now() / 1000,
        intensity: 0.9,
      });
    }

    // Event listener mousemove di tingkat window (canvas tetap pointer-events-none)
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDesktop) return;
      const now = performance.now() / 1000;
      const normX = e.clientX / window.innerWidth;
      const normY = e.clientY / window.innerHeight;

      const dx = normX - lastMousePos.x;
      const dy = normY - lastMousePos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Throttling halus: buat riak responsif pada setiap gerakan mouse
      if (dist > 0.015 || (now - lastMousePos.time > 0.04 && dist > 0.003)) {
        activeRipples.push({
          x: normX,
          y: normY,
          startTime: now,
          intensity: Math.min(1.3, 0.7 + dist * 9.0),
        });

        if (activeRipples.length > 12) {
          activeRipples.shift();
        }

        lastMousePos = { x: normX, y: normY, time: now };
      }
    };

    if (isDesktop) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    // Loop Animasi Sadar Performa (requestAnimationFrame + Visibility Pause)
    let animationFrameId: number;
    let isTabVisible = true;
    const rippleUniformData = new Float32Array(12 * 4);

    const render = () => {
      if (!isTabVisible) return;

      const now = performance.now() / 1000;

      // Hapus riak yang sudah usang (> 2.0 detik)
      activeRipples = activeRipples.filter((r) => now - r.startTime < 2.0);

      // Logika Mobile High-End: Munculkan tetesan hujan acak berkala
      if (!isDesktop) {
        if (now - lastRainDropTime > nextRainDropInterval) {
          lastRainDropTime = now;
          nextRainDropInterval = 0.55 + Math.random() * 0.65; // Interval dinamis alami
          activeRipples.push({
            x: 0.12 + Math.random() * 0.76,
            y: 0.12 + Math.random() * 0.76,
            startTime: now,
            intensity: 0.85 + Math.random() * 0.45,
          });
          if (activeRipples.length > 12) {
            activeRipples.shift();
          }
        }
      }

      // Format data uniform untuk shader
      rippleUniformData.fill(0);
      const count = Math.min(activeRipples.length, 12);
      for (let i = 0; i < count; i++) {
        const r = activeRipples[i];
        const offset = i * 4;
        rippleUniformData[offset + 0] = r.x;
        rippleUniformData[offset + 1] = r.y;
        rippleUniformData[offset + 2] = now - r.startTime; // Usia riak
        rippleUniformData[offset + 3] = r.intensity;
      }

      gl.useProgram(program);
      if (uTimeLoc) gl.uniform1f(uTimeLoc, now);
      if (uRippleCountLoc) gl.uniform1i(uRippleCountLoc, count);
      if (uRipplesLoc) gl.uniform4fv(uRipplesLoc, rippleUniformData);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    // Mulai loop animasi
    animationFrameId = requestAnimationFrame(render);

    // Listener pause tab visibility
    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(render);
      } else {
        cancelAnimationFrame(animationFrameId);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Pembersihan resource WebGL saat unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (gl && !gl.isContextLost()) {
        gl.deleteBuffer(quadBuffer);
        gl.deleteTexture(texture);
        gl.deleteProgram(program);
        gl.deleteShader(vertShader);
        gl.deleteShader(fragShader);
      }
    };
  }, [isDesktop, isHighEndMobile, isLowEnd, isReady, hasWebGL]);

  // JIKA LOW-END ATAU WEBGL TIDAK TERSEDIA: Fallback warna krem solid murni yang ringan
  if (!isReady || isLowEnd || !hasWebGL) {
    return (
      <div
        className="fixed inset-0 z-0 bg-[#F5E6D3] select-none pointer-events-none transition-colors duration-300"
        aria-hidden="true"
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 w-full h-full pointer-events-none select-none"
      aria-hidden="true"
    />
  );
}
